import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '1month' // 7days, 1month, 6months, 1year, custom
    const customStart = searchParams.get('start')
    const customEnd = searchParams.get('end')

    const now = new Date()
    let startDate: Date

    if (range === '7days') {
      startDate = startOfDay(subDays(now, 7))
    } else if (range === '6months') {
      startDate = startOfDay(subMonths(now, 6))
    } else if (range === '1year') {
      startDate = startOfDay(subYears(now, 1))
    } else if (range === 'custom' && customStart) {
      startDate = startOfDay(new Date(customStart))
    } else {
      // Default: 1 month
      startDate = startOfDay(subMonths(now, 1))
    }

    const endDate = customEnd && range === 'custom' ? endOfDay(new Date(customEnd)) : endOfDay(now)

    // Current State Stats (snapshot)
    const totalVehicles = await prisma.vehicle.count()
    const activeVehicles = await prisma.vehicle.count({ where: { status: 'active' } })
    const repairingVehicles = await prisma.vehicle.count({
      where: { status: { in: ['repairing', 'waiting_repair', 'waiting_parts'] } },
    })
    const inactiveVehicles = await prisma.vehicle.count({
      where: { status: { in: ['inactive', 'decommissioned'] } },
    })

    const pendingRepairs = await prisma.repairOrder.count({
      where: { status: { notIn: ['completed', 'delivered', 'cancelled'] } },
    })

    const allParts = await prisma.part.findMany()
    const totalParts = allParts.length
    const lowStockParts = allParts.filter((p) => p.quantity > 0 && p.quantity <= p.minimumStock).length
    const outOfStockParts = allParts.filter((p) => p.quantity <= 0).length

    const upcomingMaintenance = await prisma.maintenancePlan.count({
      where: { status: 'upcoming', isActive: true },
    })
    const overdueMaintenance = await prisma.maintenancePlan.count({
      where: { status: 'overdue', isActive: true },
    })

    // Filtered by range: Repair Orders
    const repairOrdersInRange = await prisma.repairOrder.findMany({
      where: {
        orderDate: { gte: startDate, lte: endDate },
      },
      include: { vehicle: true },
      orderBy: { orderDate: 'desc' },
    })

    // Filtered by range: Stock Transactions
    const stockTransactionsInRange = await prisma.inventoryTransaction.findMany({
      where: {
        transactionDate: { gte: startDate, lte: endDate },
      },
      include: { part: true },
      orderBy: { transactionDate: 'desc' },
    })

    // Tables data
    const recentRepairs = await prisma.repairOrder.findMany({
      take: 5,
      orderBy: { orderDate: 'desc' },
      include: { vehicle: true },
    })

    const activeRepairList = await prisma.repairOrder.findMany({
      where: { status: { in: ['repairing', 'waiting_parts', 'inspecting', 'open'] } },
      take: 5,
      orderBy: { orderDate: 'desc' },
      include: { vehicle: true },
    })

    const maintenanceDueList = await prisma.maintenancePlan.findMany({
      where: {
        status: { in: ['upcoming', 'due', 'overdue'] },
        isActive: true,
      },
      take: 5,
      orderBy: [{ status: 'asc' }, { nextDueDate: 'asc' }],
      include: { vehicle: true },
    })

    const lowStockList = allParts
      .filter((p) => p.quantity <= p.minimumStock)
      .slice(0, 5)

    const recentActivities = await prisma.inventoryTransaction.findMany({
      take: 6,
      orderBy: { transactionDate: 'desc' },
      include: { part: true },
    })

    // Costs calculation
    const totalRepairCost = repairOrdersInRange.reduce((acc, ro) => acc + ro.totalCost, 0)
    const completedRepairCount = repairOrdersInRange.filter((ro) =>
      ['completed', 'delivered'].includes(ro.status)
    ).length

    return NextResponse.json({
      summary: {
        totalVehicles,
        activeVehicles,
        repairingVehicles,
        inactiveVehicles,
        pendingRepairs,
        totalParts,
        lowStockParts,
        outOfStockParts,
        upcomingMaintenance,
        overdueMaintenance,
        totalRepairCost,
        completedRepairCount,
      },
      recentRepairs,
      activeRepairList,
      maintenanceDueList,
      lowStockList,
      recentActivities,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    })
  } catch (error) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
