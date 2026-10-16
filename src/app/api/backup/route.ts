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
            isJson: file.endsWith('.json'),
            sizeBytes: stats.size,
            sizeFormatted:
              stats.size > 1024 * 1024
                ? `${(stats.size / (1024 * 1024)).toFixed(2)} MB`
                : `${(stats.size / 1024).toFixed(1)} KB`,
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
      databasePath: isPostgres ? 'Neon Cloud PostgreSQL' : DB_PATH,
      isCloud: isPostgres,
    })
  } catch (error) {
    console.error('Error listing backups:', error)
    return NextResponse.json({ error: 'ไม่สามารถอ่านรายการไฟล์สำรองข้อมูลได้' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const isPostgres = process.env.DATABASE_URL?.startsWith('postgres')

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
      now.getHours()
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}`

    // Fetch all tables for complete snapshot
    const [
      parts,
      partCategories,
      suppliers,
      vehicles,
      vehicleTypes,
      odometerReadings,
      stockReceipts,
      stockReceiptItems,
      partIssues,
      partIssueItems,
      partReturns,
      inventoryTransactions,
      repairOrders,
      repairOrderItems,
      maintenancePlans,
      maintenanceRecords,
      notifications,
      auditLogs,
      appSettings,
    ] = await Promise.all([
      prisma.part.findMany(),
      prisma.partCategory.findMany(),
      prisma.supplier.findMany(),
      prisma.vehicle.findMany(),
      prisma.vehicleType.findMany(),
      prisma.odometerReading.findMany(),
      prisma.stockReceipt.findMany(),
      prisma.stockReceiptItem.findMany(),
      prisma.partIssue.findMany(),
      prisma.partIssueItem.findMany(),
      prisma.partReturn.findMany(),
      prisma.inventoryTransaction.findMany(),
      prisma.repairOrder.findMany(),
      prisma.repairOrderItem.findMany(),
      prisma.maintenancePlan.findMany(),
      prisma.maintenanceRecord.findMany(),
      prisma.notification.findMany(),
      prisma.auditLog.findMany(),
      prisma.appSetting.findMany(),
    ])

    const snapshot = {
      version: '1.0.0',
      exportedAt: now.toISOString(),
      provider: isPostgres ? 'Neon Cloud PostgreSQL' : 'SQLite',
      reason: body.reason || 'Database backup snapshot',
      counts: {
        parts: parts.length,
        categories: partCategories.length,
        suppliers: suppliers.length,
        vehicles: vehicles.length,
        vehicleTypes: vehicleTypes.length,
        odometerReadings: odometerReadings.length,
        stockReceipts: stockReceipts.length,
        stockReceiptItems: stockReceiptItems.length,
        partIssues: partIssues.length,
        partIssueItems: partIssueItems.length,
        partReturns: partReturns.length,
        inventoryTransactions: inventoryTransactions.length,
        repairOrders: repairOrders.length,
        repairOrderItems: repairOrderItems.length,
        maintenancePlans: maintenancePlans.length,
        maintenanceRecords: maintenanceRecords.length,
        notifications: notifications.length,
        auditLogs: auditLogs.length,
      },
      data: {
        parts,
        partCategories,
        suppliers,
        vehicles,
        vehicleTypes,
        odometerReadings,
        stockReceipts,
        stockReceiptItems,
        partIssues,
        partIssueItems,
        partReturns,
        inventoryTransactions,
        repairOrders,
        repairOrderItems,
        maintenancePlans,
        maintenanceRecords,
        notifications,
        auditLogs,
        appSettings,
      },
    }

    const backupFileName = isPostgres
      ? `cloud_backup_${timestamp}.json`
      : `storage_backup_${timestamp}.json`

    // Save to BACKUP_DIR on server if possible
    try {
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true })
      }
      const backupFilePath = path.join(BACKUP_DIR, backupFileName)
      fs.writeFileSync(backupFilePath, JSON.stringify(snapshot, null, 2), 'utf8')
    } catch (e) {
      console.warn('Could not write backup to disk:', e)
    }

    const jsonString = JSON.stringify(snapshot)
    const sizeFormatted =
      jsonString.length > 1024 * 1024
        ? `${(jsonString.length / (1024 * 1024)).toFixed(2)} MB`
        : `${(jsonString.length / 1024).toFixed(1)} KB`

    return NextResponse.json({
      success: true,
      filename: backupFileName,
      sizeFormatted,
      createdAt: now,
      isCloud: isPostgres,
      snapshot, // Full payload returned for direct client-side downloading
      message: isPostgres
        ? 'สำรองข้อมูลจาก Neon Cloud สำเร็จ (Cloud Protection Snapshot)'
        : 'สำรองข้อมูลฐานข้อมูลสำเร็จ',
    })
  } catch (error: any) {
    console.error('Backup creation error:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการสร้างไฟล์สำรองข้อมูล' },
      { status: 500 }
    )
  }
}
