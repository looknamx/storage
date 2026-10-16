import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') || 'all' // 'program_a', 'program_b', or 'all'

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
      now.getHours()
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}`

    if (scope === 'program_b') {
      const filename = `marketing_snapshot_${timestamp}.json`
      const [transportJobs, marketingCustomers] = await Promise.all([
        prisma.transportJob.findMany({ orderBy: { itemNo: 'asc' } }),
        prisma.marketingCustomer.findMany({ orderBy: { name: 'asc' } }),
      ])

      const snapshot = {
        version: '1.0.0',
        program: 'B (Marketing & Transport Logistics)',
        exportedAt: now.toISOString(),
        reason: 'Manual Program B snapshot export',
        counts: {
          transportJobs: transportJobs.length,
          marketingCustomers: marketingCustomers.length,
        },
        data: {
          transportJobs,
          marketingCustomers,
        },
      }

      return new NextResponse(JSON.stringify(snapshot, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    if (scope === 'program_a') {
      const filename = `fleet_maintenance_snapshot_${timestamp}.json`
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
        reason: 'Manual Program A snapshot export',
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

      return new NextResponse(JSON.stringify(snapshot, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // Default: 'all'
    const filename = `full_system_snapshot_${timestamp}.json`
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
      reason: 'Manual full snapshot export',
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

    return new NextResponse(JSON.stringify(snapshot, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Export snapshot error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
