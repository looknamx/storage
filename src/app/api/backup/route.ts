import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'

const DB_PATH = path.join(process.cwd(), 'data', 'storage.db')
const BACKUP_DIR = path.join(process.cwd(), 'backups')

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') // 'maintenance' | 'marketing' | 'procurement' | 'all'
    const onlyJson = searchParams.get('onlyJson') === 'true'
    const isPostgres = process.env.DATABASE_URL?.startsWith('postgres')

    let dbBackups: any[] = []
    try {
      dbBackups = await prisma.systemBackup.findMany({
        orderBy: { createdAt: 'desc' },
      })
    } catch (e) {
      console.warn('Could not query SystemBackup from database:', e)
    }

    const dbBackupFilenames = new Set(dbBackups.map((b) => b.filename))

    let fsBackups: any[] = []
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR)
      fsBackups = files
        .filter((file) => (file.endsWith('.db') || file.endsWith('.json')) && !dbBackupFilenames.has(file))
        .map((file) => {
          const filePath = path.join(BACKUP_DIR, file)
          const stats = fs.statSync(filePath)

          let fileDate = stats.mtime
          if (stats.birthtime && stats.birthtime.getTime() > 946684800000) {
            fileDate = stats.birthtime
          }

          const fnMatch = file.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/)
          if (fnMatch) {
            const parsed = new Date(
              parseInt(fnMatch[1]),
              parseInt(fnMatch[2]) - 1,
              parseInt(fnMatch[3]),
              parseInt(fnMatch[4]),
              parseInt(fnMatch[5]),
              parseInt(fnMatch[6])
            )
            if (!isNaN(parsed.getTime())) {
              fileDate = parsed
            }
          }

          let fileScope = 'maintenance'
          let scopeLabel = 'แผนงานซ่อมบำรุง'
          if (file.startsWith('marketing_')) {
            fileScope = 'marketing'
            scopeLabel = 'แผนงานการตลาด'
          } else if (file.startsWith('procurement_')) {
            fileScope = 'procurement'
            scopeLabel = 'แผนงานฝ่ายจัดซื้อ'
          } else if (file.startsWith('maintenance_')) {
            fileScope = 'maintenance'
            scopeLabel = 'แผนงานซ่อมบำรุง'
          } else if (file.startsWith('cloud_')) {
            fileScope = 'maintenance'
            scopeLabel = 'แผนงานซ่อมบำรุง'
          } else if (file.startsWith('storage_') || file.startsWith('fleet_')) {
            fileScope = 'maintenance'
            scopeLabel = 'แผนงานซ่อมบำรุง'
          }

          return {
            filename: file,
            isJson: file.endsWith('.json'),
            format: file.endsWith('.json') ? 'JSON' : 'SQLITE',
            scope: fileScope,
            scopeLabel,
            sizeBytes: stats.size,
            sizeFormatted:
              stats.size > 1024 * 1024
                ? `${(stats.size / (1024 * 1024)).toFixed(2)} MB`
                : `${(stats.size / 1024).toFixed(1)} KB`,
            createdAt: fileDate,
            modifiedAt: stats.mtime,
          }
        })
    }

    let allBackups = [
      ...dbBackups.map((b) => ({
        filename: b.filename,
        isJson: b.format === 'JSON' || b.filename.endsWith('.json'),
        format: b.format || 'JSON',
        scope: b.scope,
        scopeLabel:
          b.scopeLabel ||
          (b.scope === 'marketing'
            ? 'แผนงานการตลาด'
            : b.scope === 'procurement'
            ? 'แผนงานฝ่ายจัดซื้อ'
            : 'แผนงานซ่อมบำรุง'),
        sizeBytes: b.sizeBytes,
        sizeFormatted: b.sizeFormatted,
        createdAt: b.createdAt,
        modifiedAt: b.updatedAt,
      })),
      ...fsBackups,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Filter by scope if specified
    if (scope && scope !== 'all') {
      allBackups = allBackups.filter((b) => b.scope === scope)
    }

    // Filter by JSON only if requested
    if (onlyJson) {
      allBackups = allBackups.filter((b) => b.isJson)
    }

    const lastBackup = allBackups[0] || null

    return NextResponse.json({
      backups: allBackups,
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
    const scope = body.scope || 'all' // 'marketing', 'procurement', 'maintenance', 'all'

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
      now.getHours()
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}`

    // Fetch tables based on scope or all
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
      transportJobs,
      marketingCustomers,
    ] = await Promise.all([
      scope === 'marketing' ? Promise.resolve([]) : prisma.part.findMany(),
      scope === 'marketing' ? Promise.resolve([]) : prisma.partCategory.findMany(),
      prisma.supplier.findMany(),
      scope === 'marketing' ? Promise.resolve([]) : prisma.vehicle.findMany(),
      scope === 'marketing' ? Promise.resolve([]) : prisma.vehicleType.findMany(),
      scope === 'marketing' ? Promise.resolve([]) : prisma.odometerReading.findMany(),
      scope === 'marketing' ? Promise.resolve([]) : prisma.stockReceipt.findMany(),
      scope === 'marketing' ? Promise.resolve([]) : prisma.stockReceiptItem.findMany(),
      scope === 'marketing' ? Promise.resolve([]) : prisma.partIssue.findMany(),
      scope === 'marketing' ? Promise.resolve([]) : prisma.partIssueItem.findMany(),
      scope === 'marketing' ? Promise.resolve([]) : prisma.partReturn.findMany(),
      scope === 'marketing' ? Promise.resolve([]) : prisma.inventoryTransaction.findMany(),
      scope === 'marketing' ? Promise.resolve([]) : prisma.repairOrder.findMany(),
      scope === 'marketing' ? Promise.resolve([]) : prisma.repairOrderItem.findMany(),
      scope === 'marketing' ? Promise.resolve([]) : prisma.maintenancePlan.findMany(),
      scope === 'marketing' ? Promise.resolve([]) : prisma.maintenanceRecord.findMany(),
      prisma.notification.findMany(),
      prisma.auditLog.findMany(),
      prisma.appSetting.findMany(),
      scope === 'maintenance' || scope === 'procurement' ? Promise.resolve([]) : prisma.transportJob.findMany(),
      scope === 'maintenance' || scope === 'procurement' ? Promise.resolve([]) : prisma.marketingCustomer.findMany(),
    ])

    const counts: Record<string, number> = {
      auditLogs: auditLogs.length,
      notifications: notifications.length,
      settings: appSettings.length,
    }

    const data: Record<string, any> = {
      appSettings,
      auditLogs,
      notifications,
    }

    if (scope === 'marketing') {
      counts.transportJobs = transportJobs.length
      counts.marketingCustomers = marketingCustomers.length
      data.transportJobs = transportJobs
      data.marketingCustomers = marketingCustomers
    } else if (scope === 'procurement') {
      counts.suppliers = suppliers.length
      data.suppliers = suppliers
    } else {
      counts.parts = parts.length
      counts.categories = partCategories.length
      counts.suppliers = suppliers.length
      counts.vehicles = vehicles.length
      counts.vehicleTypes = vehicleTypes.length
      counts.odometerReadings = odometerReadings.length
      counts.stockReceipts = stockReceipts.length
      counts.stockReceiptItems = stockReceiptItems.length
      counts.partIssues = partIssues.length
      counts.partIssueItems = partIssueItems.length
      counts.partReturns = partReturns.length
      counts.inventoryTransactions = inventoryTransactions.length
      counts.repairOrders = repairOrders.length
      counts.repairOrderItems = repairOrderItems.length
      counts.maintenancePlans = maintenancePlans.length
      counts.maintenanceRecords = maintenanceRecords.length
      if (transportJobs.length > 0) counts.transportJobs = transportJobs.length
      if (marketingCustomers.length > 0) counts.marketingCustomers = marketingCustomers.length

      data.parts = parts
      data.partCategories = partCategories
      data.suppliers = suppliers
      data.vehicles = vehicles
      data.vehicleTypes = vehicleTypes
      data.odometerReadings = odometerReadings
      data.stockReceipts = stockReceipts
      data.stockReceiptItems = stockReceiptItems
      data.partIssues = partIssues
      data.partIssueItems = partIssueItems
      data.partReturns = partReturns
      data.inventoryTransactions = inventoryTransactions
      data.repairOrders = repairOrders
      data.repairOrderItems = repairOrderItems
      data.maintenancePlans = maintenancePlans
      data.maintenanceRecords = maintenanceRecords
      if (transportJobs.length > 0) data.transportJobs = transportJobs
      if (marketingCustomers.length > 0) data.marketingCustomers = marketingCustomers
    }

    const snapshot = {
      version: '1.0.0',
      exportedAt: now.toISOString(),
      provider: isPostgres ? 'Neon Cloud PostgreSQL' : 'SQLite',
      scope,
      reason: body.reason || 'Database backup snapshot',
      counts,
      data,
    }

    const backupFileName =
      scope === 'marketing'
        ? `marketing_backup_${timestamp}.json`
        : scope === 'procurement'
        ? `procurement_backup_${timestamp}.json`
        : scope === 'maintenance'
        ? `maintenance_backup_${timestamp}.json`
        : isPostgres
        ? `cloud_backup_${timestamp}.json`
        : `storage_backup_${timestamp}.json`

    const jsonString = JSON.stringify(snapshot)
    const sizeFormatted =
      jsonString.length > 1024 * 1024
        ? `${(jsonString.length / (1024 * 1024)).toFixed(2)} MB`
        : `${(jsonString.length / 1024).toFixed(1)} KB`

    const determinedScopeLabel =
      scope === 'marketing'
        ? 'แผนงานการตลาด'
        : scope === 'procurement'
        ? 'แผนงานฝ่ายจัดซื้อ'
        : 'แผนงานซ่อมบำรุง'

    // 1. Save permanently to Neon PostgreSQL SystemBackup table
    try {
      await prisma.systemBackup.upsert({
        where: { filename: backupFileName },
        update: {
          scope,
          scopeLabel: determinedScopeLabel,
          format: 'JSON',
          sizeBytes: jsonString.length,
          sizeFormatted,
          content: jsonString,
          updatedAt: now,
        },
        create: {
          filename: backupFileName,
          scope,
          scopeLabel: determinedScopeLabel,
          format: 'JSON',
          sizeBytes: jsonString.length,
          sizeFormatted,
          content: jsonString,
          createdAt: now,
        },
      })
    } catch (dbErr) {
      console.warn('Could not save snapshot to Neon PostgreSQL database:', dbErr)
    }

    // 2. Also attempt saving to BACKUP_DIR on server filesystem if possible
    try {
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true })
      }
      const backupFilePath = path.join(BACKUP_DIR, backupFileName)
      fs.writeFileSync(backupFilePath, JSON.stringify(snapshot, null, 2), 'utf8')
    } catch (e) {
      console.warn('Could not write backup to disk:', e)
    }

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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อไฟล์ที่ต้องการลบ' }, { status: 400 })
    }

    const safeName = path.basename(filename)

    // Delete from Neon PostgreSQL database
    let dbDeleted = false
    try {
      const res = await prisma.systemBackup.deleteMany({
        where: { filename: safeName },
      })
      if (res.count > 0) dbDeleted = true
    } catch (dbErr) {
      console.warn('Could not delete from database:', dbErr)
    }

    // Delete from disk if file exists
    let fsDeleted = false
    try {
      const filePath = path.join(BACKUP_DIR, safeName)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        fsDeleted = true
      }
    } catch (fsErr) {
      console.warn('Could not delete from disk:', fsErr)
    }

    if (!dbDeleted && !fsDeleted) {
      return NextResponse.json({ error: 'ไม่พบไฟล์สำรองข้อมูลที่ต้องการลบ' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `ลบไฟล์สำรองข้อมูล "${safeName}" สำเร็จเรียบร้อยแล้ว`,
    })
  } catch (error: any) {
    console.error('Delete backup error:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการลบไฟล์สำรองข้อมูล' },
      { status: 500 }
    )
  }
}
