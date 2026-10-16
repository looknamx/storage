import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
      now.getHours()
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const filename = `fleet_full_snapshot_${timestamp}.json`

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
  } catch (error: any) {
    console.error('Export snapshot error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

