import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'

const DB_PATH = path.join(process.cwd(), 'data', 'storage.db')
const BACKUP_DIR = path.join(process.cwd(), 'backups')

export async function GET() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
    }

    const files = fs.readdirSync(BACKUP_DIR)
    const backups = files
      .filter((file) => file.endsWith('.db'))
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

    const lastBackup = backups[0] || null

    return NextResponse.json({
      backups,
      lastBackup,
      databasePath: DB_PATH,
    })
  } catch (error) {
    console.error('Error listing backups:', error)
    return NextResponse.json({ error: 'ไม่สามารถอ่านรายการไฟล์สำรองข้อมูลได้' }, { status: 500 })
  }
}

export async function POST() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json({ error: 'ไม่พบไฟล์ฐานข้อมูลหลัก' }, { status: 404 })
    }

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
    }

    // Format timestamp for backup filename: storage_backup_YYYYMMDD_HHMMSS.db
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
      now.getHours()
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}`

    const backupFileName = `storage_backup_${timestamp}.db`
    const backupFilePath = path.join(BACKUP_DIR, backupFileName)

    // Execute SQLite VACUUM INTO to safely backup live database without corruption
    try {
      const sanitizedPath = backupFilePath.replace(/\\/g, '/')
      await prisma.$executeRawUnsafe(`VACUUM INTO '${sanitizedPath}'`)
    } catch (e) {
      // Fallback to copyFile if VACUUM INTO is not supported
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

