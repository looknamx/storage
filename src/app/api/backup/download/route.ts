import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อไฟล์' }, { status: 400 })
    }

    // Sanitize filename to prevent directory traversal
    const safeName = path.basename(filename)

    // 1. Check Neon Cloud database first
    try {
      const dbBackup = await prisma.systemBackup.findUnique({
        where: { filename: safeName },
      })
      if (dbBackup && dbBackup.content) {
        return new NextResponse(dbBackup.content, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${safeName}"`,
          },
        })
      }
    } catch (dbErr) {
      console.warn('Could not read backup from database:', dbErr)
    }

    // 2. Fallback to filesystem
    const filePath = path.join(BACKUP_DIR, safeName)
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'ไม่พบไฟล์ที่ระบุ' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)
    const contentType = safeName.endsWith('.json')
      ? 'application/json'
      : 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeName}"`,
      },
    })
  } catch (error: any) {
    console.error('Download backup error:', error)
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการดาวน์โหลด' }, { status: 500 })
  }
}

