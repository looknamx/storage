import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'

const DB_PATH = path.join(process.cwd(), 'data', 'storage.db')
const BACKUP_DIR = path.join(process.cwd(), 'backups')

export async function GET() {
  try {
    const isPostgres = process.env.DATABASE_URL?.startsWith('postgres')

    let backups: any[] = []
    let lastBackup = null

    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR)
      backups = files
        .filter((file) => file.endsWith('.db') || file.endsWith('.json'))
        .map((file) => {
          const filePath = path.join(BACKUP_DIR, file)
          const stats = fs.statSync(filePath)
          return {
            filename: file,
            sizeBytes: stats.size,
            sizeFormatted: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
          }
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      lastBackup = backups[0] || null
    }

    return NextResponse.json({
      backups,
      lastBackup,
      databasePath: isPostgres ? 'Neon Cloud PostgreSQL (ep-quiet-sky...)' : DB_PATH,
      isCloud: isPostgres,
    })
  } catch (error) {
    console.error('Error listing backups:', error)
    return NextResponse.json({ error: 'ไม่สามารถอ่านรายการไฟล์สำรองข้อมูลได้' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const isPostgres = process.env.DATABASE_URL?.startsWith('postgres')

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
      now.getHours()
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}`

    if (isPostgres) {
      // Export full cloud snapshot as JSON
      const [categories, suppliers, vehicles, parts, settings] = await Promise.all([
        prisma.partCategory.findMany(),
        prisma.supplier.findMany(),
        prisma.vehicle.findMany(),
        prisma.part.findMany(),
        prisma.appSetting.findMany(),
      ])

      const snapshot = {
        exportedAt: now.toISOString(),
        provider: 'Neon PostgreSQL',
        categories,
        suppliers,
        vehicles,
        parts,
        settings,
      }

      const backupFileName = `cloud_backup_${timestamp}.json`

      // If local filesystem writable, save it
      try {
        if (!fs.existsSync(BACKUP_DIR)) {
          fs.mkdirSync(BACKUP_DIR, { recursive: true })
        }
        const backupFilePath = path.join(BACKUP_DIR, backupFileName)
        fs.writeFileSync(backupFilePath, JSON.stringify(snapshot, null, 2), 'utf8')
      } catch (e) {
        // Ignored on read-only serverless
      }

      return NextResponse.json({
        success: true,
        filename: backupFileName,
        sizeFormatted: `${(JSON.stringify(snapshot).length / 1024).toFixed(1)} KB`,
        createdAt: now,
        isCloud: true,
        message: 'สำรองข้อมูลจาก Neon Cloud สำเร็จ (Automated Cloud Protection)',
      })
    }

    // Local SQLite Backup Fallback
    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json({ error: 'ไม่พบไฟล์ฐานข้อมูลหลัก' }, { status: 404 })
    }

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
    }

    const backupFileName = `storage_backup_${timestamp}.db`
    const backupFilePath = path.join(BACKUP_DIR, backupFileName)

    try {
      const sanitizedPath = backupFilePath.replace(/\\/g, '/')
      await prisma.$executeRawUnsafe(`VACUUM INTO '${sanitizedPath}'`)
    } catch (e) {
      fs.copyFileSync(DB_PATH, backupFilePath)
    }

    const stats = fs.statSync(backupFilePath)

    return NextResponse.json({
      success: true,
      filename: backupFileName,
      sizeBytes: stats.size,
      sizeFormatted: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
      createdAt: stats.birthtime,
    })
  } catch (error: any) {
    console.error('Backup creation error:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการสร้างไฟล์สำรองข้อมูล' },
      { status: 500 }
    )
  }
}
