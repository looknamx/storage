import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

const DEFAULT_CATEGORIES = [
  'น้ำมันเครื่องและของเหลว',
  'ไส้กรอง',
  'ระบบเบรก',
  'ยางและช่วงล่าง',
  'ระบบไฟฟ้าและแบตเตอรี่',
  'เครื่องยนต์และเกียร์',
  'อะไหล่ทั่วไป',
]

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    // Require strict confirmation keyword
    if (body.confirmText !== 'RESET') {
      return NextResponse.json(
        { error: 'คำยืนยันไม่ถูกต้อง กรุณาพิมพ์ RESET เพื่อยืนยัน' },
        { status: 400 }
      )
    }

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
      now.getHours()
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const backupFilename = `fleet_backup_before_reset_${timestamp}.json`

    // Step 1: MANDATORY FULL BACKUP SNAPSHOT BEFORE PURGE
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
      reason: 'Mandatory pre-reset safety backup',
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

    // Attempt to save snapshot to server backups directory
    try {
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true })
      }
      fs.writeFileSync(
        path.join(BACKUP_DIR, backupFilename),
        JSON.stringify(snapshot, null, 2),
        'utf8'
      )
    } catch (fsErr) {
      console.warn('Could not write backup file to server filesystem:', fsErr)
    }

    // Step 2: PURGE TRANSACTIONAL & MASTER DATA
    // Delete in strict relational dependency order
    await prisma.$transaction([
      prisma.partReturn.deleteMany(),
      prisma.partIssueItem.deleteMany(),
      prisma.stockReceiptItem.deleteMany(),
      prisma.inventoryTransaction.deleteMany(),
      prisma.repairOrderItem.deleteMany(),
      prisma.maintenanceRecord.deleteMany(),
      prisma.odometerReading.deleteMany(),

      prisma.partIssue.deleteMany(),
      prisma.stockReceipt.deleteMany(),
      prisma.repairOrder.deleteMany(),
      prisma.maintenancePlan.deleteMany(),

      prisma.part.deleteMany(),
      prisma.vehicle.deleteMany(),
      prisma.supplier.deleteMany(),

      prisma.notification.deleteMany(),
      prisma.auditLog.deleteMany(),
    ])

    // Explicit second pass to guarantee 0 notifications
    await prisma.notification.deleteMany({})

    // Step 3: Ensure standard categories are available for mechanics
    for (const catName of DEFAULT_CATEGORIES) {
      await prisma.partCategory.upsert({
        where: { name: catName },
        update: {},
        create: { name: catName },
      })
    }

    // Create an audit log for the reset event
    await prisma.auditLog.create({
      data: {
        action: 'reset',
        entityType: 'system',
        entityId: 'database',
        description: `ล้างข้อมูลระบบทั้งหมดเพื่อเริ่มใช้งานใหม่ (สำรองข้อมูลไว้ที่ ${backupFilename})`,
        newValue: JSON.stringify(snapshot.counts),
        performedBy: 'ผู้ดูแลระบบ',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'ล้างข้อมูลระบบเรียบร้อยแล้ว ระบบพร้อมสำหรับการเริ่มต้นคีย์ข้อมูลใหม่',
      backupFilename,
      deletedSummary: snapshot.counts,
      snapshot, // Full snapshot payload sent to client for immediate forced download
    })
  } catch (error: any) {
    console.error('System reset error:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการล้างข้อมูลระบบ' },
      { status: 500 }
    )
  }
}

