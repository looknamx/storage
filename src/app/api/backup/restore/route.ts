import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'

const DB_PATH = path.join(process.cwd(), 'data', 'storage.db')
const BACKUP_DIR = path.join(process.cwd(), 'backups')

export async function POST(request: Request) {
  try {
    const isPostgres = process.env.DATABASE_URL?.startsWith('postgres')
    if (isPostgres) {
      return NextResponse.json({
        error: 'ระบบกำลังทำงานบน Neon Cloud Database ซึ่งได้รับการสำรองและดูแลบนคลาวด์อัตโนมัติ (Automated Cloud Recovery) หากต้องการย้อนข้อมูล สามารถเลือก Branch หรือ Point-in-time Restore ผ่านหน้าคอนโซลของ Neon ได้ทันทีครับ',
      }, { status: 400 })
    }

    const { filename, createSafetyBackupFirst = true } = await request.json()

    if (!filename) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อไฟล์สำรองข้อมูลที่ต้องการกู้คืน' }, { status: 400 })
    }

    const backupFilePath = path.join(BACKUP_DIR, filename)

    if (!fs.existsSync(backupFilePath)) {
      return NextResponse.json({ error: 'ไม่พบไฟล์สำรองข้อมูลที่ระบุ' }, { status: 404 })
    }

    // Step 1: Check header of file to verify it's a valid SQLite database
    const buffer = Buffer.alloc(16)
    const fd = fs.openSync(backupFilePath, 'r')
    fs.readSync(fd, buffer, 0, 16, 0)
    fs.closeSync(fd)

    const header = buffer.toString('utf-8', 0, 16)
    if (!header.startsWith('SQLite format 3')) {
      return NextResponse.json(
        { error: 'ไฟล์ที่เลือกไม่ใช่ไฟล์ฐานข้อมูล SQLite ที่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Step 2: Create safety snapshot of current DB before restoring
    let safetyBackupName = ''
    if (createSafetyBackupFirst && fs.existsSync(DB_PATH)) {
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      safetyBackupName = `storage_pre_restore_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
        now.getDate()
      )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.db`
      fs.copyFileSync(DB_PATH, path.join(BACKUP_DIR, safetyBackupName))
    }

    // Step 3: Disconnect Prisma momentarily
    await prisma.$disconnect()

    // Step 4: Overwrite current db with backup file
    fs.copyFileSync(backupFilePath, DB_PATH)

    return NextResponse.json({
      success: true,
      message: 'กู้คืนฐานข้อมูลสำเร็จแล้ว',
      safetyBackupCreated: safetyBackupName,
    })
  } catch (error: any) {
    console.error('Database restore error:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการกู้คืนฐานข้อมูล' },
      { status: 500 }
    )
  }
}
