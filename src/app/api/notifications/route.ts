import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Auto-sync real-time alerts from parts inventory and maintenance plans
async function syncSystemAlerts() {
  try {
    const now = new Date()

    // 1. Fetch active parts
    const parts = await prisma.part.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        unit: true,
        quantity: true,
        minimumStock: true,
      },
    })

    // If there are no parts at all, wipe all part notifications immediately
    if (parts.length === 0) {
      await prisma.notification.deleteMany({
        where: { referenceType: 'part' },
      })
    }

    // 2. Fetch active maintenance plans
    const maintenancePlans = await prisma.maintenancePlan.findMany({
      where: { isActive: true },
      include: { vehicle: true },
    })

    // If there are no maintenance plans at all, wipe all maintenance notifications immediately
    if (maintenancePlans.length === 0) {
      await prisma.notification.deleteMany({
        where: { referenceType: 'maintenance_plan' },
      })
    }

    // Existing part notifications
    const existingPartNotifs = await prisma.notification.findMany({
      where: { referenceType: 'part' },
      select: { id: true, referenceId: true, type: true, isRead: true },
    })

    const notifByPartId = new Map<string, typeof existingPartNotifs[0]>()
    existingPartNotifs.forEach((n) => {
      if (n.referenceId) notifByPartId.set(n.referenceId, n)
    })

    const newNotifications: any[] = []
    const resolvedNotifIds: string[] = []

    // Clean up any orphan notifications for parts that were deleted
    const activePartIds = new Set(parts.map((p) => p.id))
    for (const notif of existingPartNotifs) {
      if (!notif.referenceId || !activePartIds.has(notif.referenceId)) {
        resolvedNotifIds.push(notif.id)
      }
    }

    for (const part of parts) {
      const minStock = part.minimumStock > 0 ? part.minimumStock : 5
      const isOutOfStock = part.quantity <= 0
      const isLowStock = part.quantity > 0 && part.quantity <= minStock
      const existing = notifByPartId.get(part.id)

      if (isOutOfStock) {
        if (!existing) {
          newNotifications.push({
            title: 'อะไหล่หมดสต็อก',
            message: `[${part.code}] ${part.name} หมดสต็อกแล้ว (0 ${part.unit}) จำเป็นต้องสั่งซื้อด่วน`,
            type: 'out_of_stock',
            referenceType: 'part',
            referenceId: part.id,
            priority: 'critical',
            isRead: false,
            createdAt: now,
          })
        }
      } else if (isLowStock) {
        if (!existing) {
          newNotifications.push({
            title: 'อะไหล่ใกล้หมดสต็อก',
            message: `[${part.code}] ${part.name} เหลือเพียง ${part.quantity} ${part.unit} (เกณฑ์สั่งซื้อ ${minStock} ${part.unit})`,
            type: 'low_stock',
            referenceType: 'part',
            referenceId: part.id,
            priority: 'high',
            isRead: false,
            createdAt: now,
          })
        }
      } else {
        // Stock is sufficient -> auto-resolve old low_stock/out_of_stock alert
        if (existing) {
          resolvedNotifIds.push(existing.id)
        }
      }
    }

    // Existing maintenance notifications
    const existingMaintNotifs = await prisma.notification.findMany({
      where: { referenceType: 'maintenance_plan' },
      select: { id: true, referenceId: true },
    })
    const notifByPlanId = new Set(existingMaintNotifs.map((n) => n.referenceId))

    // Clean up orphan notifications for maintenance plans that were deleted
    const activePlanIds = new Set(maintenancePlans.map((p) => p.id))
    for (const notif of existingMaintNotifs) {
      if (!notif.referenceId || !activePlanIds.has(notif.referenceId)) {
        resolvedNotifIds.push(notif.id)
      }
    }

    for (const plan of maintenancePlans) {
      const isDateOverdue = plan.nextDueDate && new Date(plan.nextDueDate) <= now
      const isKmOverdue =
        plan.nextDueMileage &&
        plan.vehicle &&
        plan.vehicle.currentMileage >= plan.nextDueMileage

      if ((isDateOverdue || isKmOverdue) && !notifByPlanId.has(plan.id)) {
        const vPlate = plan.vehicle?.licensePlate || 'ไม่ระบุทะเบียน'
        newNotifications.push({
          title: isDateOverdue ? 'รถเกินกำหนดซ่อมบำรุง' : 'รถครบกำหนดซ่อมบำรุงตามระยะทาง',
          message: `รถทะเบียน ${vPlate} ถึงกำหนดตรวจเช็กรายการ "${plan.name}"`,
          type: 'maintenance_due',
          referenceType: 'maintenance_plan',
          referenceId: plan.id,
          priority: 'critical',
          isRead: false,
          createdAt: now,
        })
      }
    }

    // Clean up resolved and orphaned notifications
    if (resolvedNotifIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { id: { in: resolvedNotifIds } },
      })
    }

    // Create new notifications in batch
    if (newNotifications.length > 0) {
      await prisma.notification.createMany({
        data: newNotifications,
      })
    }
  } catch (err) {
    console.error('Error syncing notifications:', err)
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get('countOnly') === 'true'

    // Automatically synchronize alerts
    await syncSystemAlerts()

    const unreadCount = await prisma.notification.count({
      where: { isRead: false },
    })

    if (countOnly) {
      const totalCount = await prisma.notification.count()
      return NextResponse.json({ unreadCount, totalCount })
    }

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลแจ้งเตือนได้' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id } = await request.json()
    if (id) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      })
    } else {
      await prisma.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตแจ้งเตือนได้' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const clearRead = searchParams.get('clearRead') === 'true'

    if (id) {
      await prisma.notification.delete({ where: { id } })
    } else if (clearRead) {
      await prisma.notification.deleteMany({ where: { isRead: true } })
    } else {
      await prisma.notification.deleteMany({})
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'ไม่สามารถลบการแจ้งเตือนได้' }, { status: 500 })
  }
}
