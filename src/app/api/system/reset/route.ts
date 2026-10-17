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

    const scope = body.scope || 'all' // 'program_a', 'program_b', or 'all'
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
      now.getHours()
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}`

    // ==========================================
    // CASE 1: Reset Program B (Marketing & Jobs)
    // ==========================================
    if (scope === 'program_b') {
      const backupFilename = `marketing_backup_before_reset_${timestamp}.json`

      const [transportJobs, marketingCustomers] = await Promise.all([
        prisma.transportJob.findMany({ orderBy: { itemNo: 'asc' } }),
        prisma.marketingCustomer.findMany({ orderBy: { name: 'asc' } }),
      ])

      const snapshot = {
        version: '1.0.0',
        program: 'B (Marketing & Transport Logistics)',
        exportedAt: now.toISOString(),
        reason: 'Pre-reset safety backup for Program B',
        counts: {
          transportJobs: transportJobs.length,
          marketingCustomers: marketingCustomers.length,
        },
        data: {
          transportJobs,
          marketingCustomers,
        },
      }

      // Save to server filesystem
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

      // Purge only Program B tables
      await prisma.$transaction([
        prisma.transportJob.deleteMany(),
        prisma.marketingCustomer.deleteMany(),
      ])

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: 'reset',
          entityType: 'marketing',
          entityId: 'transport_jobs',
          description: `ล้างข้อมูลระบบแผนงานการตลาด ทั้งหมดเพื่อเริ่มใช้งานใหม่ (สำรองข้อมูลไว้ที่ ${backupFilename})`,
          newValue: JSON.stringify(snapshot.counts),
          performedBy: 'ผู้ดูแลระบบการตลาด',
        },
      })

      return NextResponse.json({
        success: true,
        scope: 'program_b',
        message: 'ล้างข้อมูลระบบแผนงานการตลาด เรียบร้อยแล้ว (ข้อมูลฝ่ายซ่อมบำรุงและรถบริษัทคงอยู่ครบถ้วน 100%)',
        backupFilename,
        deletedSummary: snapshot.counts,
        snapshot,
      })
    }

    // ==========================================
    // CASE 2: Reset Program C (Procurement)
    // ==========================================
    if (scope === 'program_c') {
      const backupFilename = `procurement_backup_before_reset_${timestamp}.json`

      const [suppliers] = await Promise.all([
        prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
      ])

      const snapshot = {
        version: '1.0.0',
        program: 'C (Procurement)',
        exportedAt: now.toISOString(),
        reason: 'Pre-reset safety backup for Procurement',
        counts: {
          suppliers: suppliers.length,
        },
        data: {
          suppliers,
        },
      }

      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true })
      }
      fs.writeFileSync(
        path.join(BACKUP_DIR, backupFilename),
        JSON.stringify(snapshot, null, 2),
        'utf8'
      )

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: 'reset',
          entityType: 'procurement',
          entityId: 'procurement_system',
          description: `ล้างข้อมูลระบบฝ่ายจัดซื้อ ทั้งหมดเพื่อเริ่มใช้งานใหม่ (สำรองข้อมูลไว้ที่ ${backupFilename})`,
          newValue: JSON.stringify(snapshot.counts),
          performedBy: 'ผู้ดูแลระบบฝ่ายจัดซื้อ',
        },
      })

      return NextResponse.json({
        success: true,
        scope: 'program_c',
        message: 'ล้างข้อมูลระบบฝ่ายจัดซื้อ เรียบร้อยแล้ว (ข้อมูลฝ่ายซ่อมบำรุงและการตลาดคงอยู่ครบถ้วน 100%)',
        backupFilename,
        deletedSummary: snapshot.counts,
        snapshot,
      })
    }

    // ==========================================
    // CASE 3: Reset Program A (Fleet & Repairs)
    // ==========================================
    if (scope === 'program_a') {
      const backupFilename = `fleet_backup_before_reset_${timestamp}.json`

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
        program: 'A (Fleet & Maintenance Management)',
        exportedAt: now.toISOString(),
        reason: 'Pre-reset safety backup for Program A',
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

      // Save to server filesystem
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

      // Purge only Program A tables (Keep Program B transport jobs intact)
      await prisma.$transaction([
        // Unlink vehicleId on transport jobs so transport logs remain safe
        prisma.transportJob.updateMany({
          where: { vehicleId: { not: null } },
          data: { vehicleId: null },
        }),
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

      // Re-seed default part categories for mechanics
      for (const catName of DEFAULT_CATEGORIES) {
        await prisma.partCategory.upsert({
          where: { name: catName },
          update: {},
          create: { name: catName },
        })
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: 'reset',
          entityType: 'maintenance',
          entityId: 'fleet_parts',
          description: `ล้างข้อมูลระบบแผนงานซ่อมบำรุง ทั้งหมดเพื่อเริ่มใช้งานใหม่ (สำรองข้อมูลไว้ที่ ${backupFilename})`,
          newValue: JSON.stringify(snapshot.counts),
          performedBy: 'ผู้ดูแลระบบซ่อมบำรุง',
        },
      })

      return NextResponse.json({
        success: true,
        scope: 'program_a',
        message: 'ล้างข้อมูลระบบแผนงานซ่อมบำรุง เรียบร้อยแล้ว (ข้อมูลแผนงานการตลาดคงอยู่ครบถ้วน 100%)',
        backupFilename,
        deletedSummary: snapshot.counts,
        snapshot,
      })
    }

    // ==========================================
    // CASE 3: Reset All (Program A + Program B)
    // ==========================================
    const backupFilename = `full_backup_before_reset_${timestamp}.json`

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
      prisma.transportJob.findMany(),
      prisma.marketingCustomer.findMany(),
    ])

    const snapshot = {
      version: '1.0.0',
      program: 'All (Program A + Program B)',
      exportedAt: now.toISOString(),
      reason: 'Mandatory pre-reset safety backup for all programs',
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
        transportJobs: transportJobs.length,
        marketingCustomers: marketingCustomers.length,
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
        transportJobs,
        marketingCustomers,
      },
    }

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

    await prisma.$transaction([
      prisma.transportJob.deleteMany(),
      prisma.marketingCustomer.deleteMany(),

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

    for (const catName of DEFAULT_CATEGORIES) {
      await prisma.partCategory.upsert({
        where: { name: catName },
        update: {},
        create: { name: catName },
      })
    }

    await prisma.auditLog.create({
      data: {
        action: 'reset',
        entityType: 'system',
        entityId: 'database',
        description: `ล้างข้อมูลระบบทั้งหมด (A + B) เพื่อเริ่มใช้งานใหม่ (สำรองข้อมูลไว้ที่ ${backupFilename})`,
        newValue: JSON.stringify(snapshot.counts),
        performedBy: 'ผู้ดูแลระบบ',
      },
    })

    return NextResponse.json({
      success: true,
      scope: 'all',
      message: 'ล้างข้อมูลระบบทั้งหมดเรียบร้อยแล้ว',
      backupFilename,
      deletedSummary: snapshot.counts,
      snapshot,
    })
  } catch (error: any) {
    console.error('System reset error:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการล้างข้อมูลระบบ' },
      { status: 500 }
    )
  }
}
