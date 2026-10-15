import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'

const DB_PATH = path.join(process.cwd(), 'data', 'storage.db')
const BACKUP_DIR = path.join(process.cwd(), 'backups')

export async function GET() {
  try {
    // 1. Fetch current settings for auto backup
    const settings = await prisma.appSetting.findMany({
      where: {
        key: {
          in: ['auto_backup_enabled', 'auto_backup_interval_days', 'last_auto_backup_date'],
        },
      },
    })

    const config: Record<string, string> = {
      auto_backup_enabled: 'false',
      auto_backup_interval_days: '7',
      last_auto_backup_date: '',
    }

    settings.forEach((s) => {
      config[s.key] = s.value
    })

    const isEnabled = config.auto_backup_enabled === 'true'
    const intervalDays = parseInt(config.auto_backup_interval_days || '7', 10)
    const lastBackupDateStr = config.last_auto_backup_date
    const now = new Date()

    let shouldBackup = false
    let daysSinceLast = 0

    if (isEnabled) {
      if (!lastBackupDateStr) {
        shouldBackup = true
      } else {
        const lastDate = new Date(lastBackupDateStr)
        const diffMs = now.getTime() - lastDate.getTime()
        daysSinceLast = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        if (daysSinceLast >= intervalDays) {
          shouldBackup = true
        }
      }
    }

    let backupResult: any = null

    // 2. If overdue or never backed up, run automatic backup right now
    if (shouldBackup) {
      if (!fs.existsSync(DB_PATH)) {
        return NextResponse.json({
          status: 'skipped',
          reason: 'database_not_found',
          config,
        })
      }

      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true })
      }

      const pad = (n: number) => String(n).padStart(2, '0')
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
        now.getHours()
      )}${pad(now.getMinutes())}${pad(now.getSeconds())}`
      const backupFileName = `auto_backup_${timestamp}.db`
      const backupFilePath = path.join(BACKUP_DIR, backupFileName)

      try {
        const sanitizedPath = backupFilePath.replace(/\\/g, '/')
        await prisma.$executeRawUnsafe(`VACUUM INTO '${sanitizedPath}'`)
      } catch (e) {
        fs.copyFileSync(DB_PATH, backupFilePath)
      }

      const stats = fs.statSync(backupFilePath)

      // Update last backup date in DB
      await prisma.appSetting.upsert({
        where: { key: 'last_auto_backup_date' },
        update: { value: now.toISOString() },
        create: {
          key: 'last_auto_backup_date',
          value: now.toISOString(),
          label: 'วันที่สำรองข้อมูลอัตโนมัติล่าสุด',
          group: 'backup',
        },
      })

      config.last_auto_backup_date = now.toISOString()

      backupResult = {
        created: true,
        filename: backupFileName,
        sizeFormatted: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
        timestamp: now.toISOString(),
      }
    }

    return NextResponse.json({
      enabled: isEnabled,
      intervalDays,
      lastBackupDate: config.last_auto_backup_date,
      daysSinceLast,
      backupPerformed: shouldBackup,
      backupResult,
    })
  } catch (error: any) {
    console.error('Auto backup check error:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบ Auto Backup' },
      { status: 500 }
    )
  }
}

