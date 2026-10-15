import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { addMonths, startOfDay } from 'date-fns'

// Helper function to calculate maintenance plan status based on conditions
export function evaluatePlanStatus(
  currentDate: Date,
  currentMileage: number,
  nextDueDate: Date | null,
  nextDueMileage: number | null,
  advanceWarningDays: number = 30,
  advanceWarningKm: number = 1000
): 'normal' | 'upcoming' | 'due' | 'overdue' {
  let isOverdue = false
  let isDue = false
  let isUpcoming = false

  const now = startOfDay(currentDate)

  // 1. Check Date condition
  if (nextDueDate) {
    const dueTime = startOfDay(new Date(nextDueDate)).getTime()
    const nowTime = now.getTime()
    const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      isOverdue = true
    } else if (diffDays === 0) {
      isDue = true
    } else if (diffDays <= advanceWarningDays) {
      isUpcoming = true
    }
  }

  // 2. Check Mileage condition
  if (nextDueMileage) {
    const diffKm = nextDueMileage - currentMileage
    if (diffKm < 0) {
      isOverdue = true
    } else if (diffKm === 0) {
      isDue = true
    } else if (diffKm <= advanceWarningKm) {
      isUpcoming = true
    }
  }

  if (isOverdue) return 'overdue'
  if (isDue) return 'due'
  if (isUpcoming) return 'upcoming'
  return 'normal'
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const vehicleId = searchParams.get('vehicleId') || ''

    const where: any = { isActive: true }

    if (status) {
      where.status = status
    }

    if (vehicleId) {
      where.vehicleId = vehicleId
    }

    const plans = await prisma.maintenancePlan.findMany({
      where,
      orderBy: [{ status: 'asc' }, { nextDueDate: 'asc' }],
      include: {
        vehicle: true,
        records: {
          orderBy: { performedDate: 'desc' },
          take: 5,
        },
      },
    })

    // Re-evaluate and sync statuses in real-time
    const now = new Date()
    const updatedPlans = await Promise.all(
      plans.map(async (plan) => {
        const computedStatus = evaluatePlanStatus(
          now,
          plan.vehicle.currentMileage,
          plan.nextDueDate,
          plan.nextDueMileage,
          plan.advanceWarningDays,
          plan.advanceWarningKm
        )

        if (computedStatus !== plan.status) {
          await prisma.maintenancePlan.update({
            where: { id: plan.id },
            data: { status: computedStatus },
          })
          return { ...plan, status: computedStatus }
        }
        return plan
      })
    )

    return NextResponse.json(updatedPlans)
  } catch (error) {
    console.error('Error fetching maintenance plans:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลแผนซ่อมบำรุงได้' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      vehicleId,
      name,
      intervalMonths,
      intervalKm,
      lastPerformedDate,
      lastPerformedMileage,
      advanceWarningDays = 30,
      advanceWarningKm = 1000,
      notes,
    } = body

    if (!vehicleId) {
      return NextResponse.json({ error: 'กรุณาเลือกรถสำหรับแผนซ่อมบำรุง' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อรายการซ่อมบำรุง' }, { status: 400 })
    }

    const parsedMonths = intervalMonths ? parseInt(intervalMonths) : null
    const parsedKm = intervalKm ? parseFloat(intervalKm) : null

    if (!parsedMonths && !parsedKm) {
      return NextResponse.json(
        { error: 'กรุณาระบุเงื่อนไขรอบระยะเวลา (เดือน) หรือรอบระยะทาง (กม.) อย่างน้อยหนึ่งเงื่อนไข' },
        { status: 400 }
      )
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } })
    if (!vehicle) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรถในระบบ' }, { status: 404 })
    }

    // Calculate initial nextDueDate & nextDueMileage
    const lastDate = lastPerformedDate ? new Date(lastPerformedDate) : new Date()
    const lastKm = lastPerformedMileage !== undefined && lastPerformedMileage !== null
      ? parseFloat(lastPerformedMileage)
      : vehicle.currentMileage

    let nextDueDate: Date | null = null
    let nextDueMileage: number | null = null

    if (parsedMonths) {
      nextDueDate = addMonths(lastDate, parsedMonths)
    }

    if (parsedKm) {
      nextDueMileage = lastKm + parsedKm
    }

    const status = evaluatePlanStatus(
      new Date(),
      vehicle.currentMileage,
      nextDueDate,
      nextDueMileage,
      parseInt(advanceWarningDays) || 30,
      parseFloat(advanceWarningKm) || 1000
    )

    const plan = await prisma.maintenancePlan.create({
      data: {
        vehicleId,
        name: name.trim(),
        intervalMonths: parsedMonths,
        intervalKm: parsedKm,
        lastPerformedDate: lastPerformedDate ? new Date(lastPerformedDate) : null,
        lastPerformedMileage: lastKm,
        nextDueDate,
        nextDueMileage,
        advanceWarningDays: parseInt(advanceWarningDays) || 30,
        advanceWarningKm: parseFloat(advanceWarningKm) || 1000,
        status,
        notes: notes?.trim() || null,
        isActive: true,
      },
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Error creating maintenance plan:', error)
    return NextResponse.json({ error: 'ไม่สามารถสร้างแผนซ่อมบำรุงได้' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      intervalMonths,
      intervalKm,
      lastPerformedDate,
      lastPerformedMileage,
      advanceWarningDays = 30,
      advanceWarningKm = 1000,
      notes,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ต้องระบุ ID แผนซ่อมบำรุงที่ต้องการแก้ไข' }, { status: 400 })
    }

    const existing = await prisma.maintenancePlan.findUnique({
      where: { id },
      include: { vehicle: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบแผนซ่อมบำรุง' }, { status: 404 })
    }

    const parsedMonths = intervalMonths !== undefined && intervalMonths !== '' ? parseInt(intervalMonths) : null
    const parsedKm = intervalKm !== undefined && intervalKm !== '' ? parseFloat(intervalKm) : null

    if (!parsedMonths && !parsedKm) {
      return NextResponse.json(
        { error: 'กรุณาระบุเงื่อนไขรอบระยะเวลา (เดือน) หรือรอบระยะทาง (กม.) อย่างน้อยหนึ่งเงื่อนไข' },
        { status: 400 }
      )
    }

    const lastDate = lastPerformedDate ? new Date(lastPerformedDate) : (existing.lastPerformedDate || new Date())
    const lastKm = lastPerformedMileage !== undefined && lastPerformedMileage !== null && lastPerformedMileage !== ''
      ? parseFloat(lastPerformedMileage)
      : (existing.lastPerformedMileage ?? existing.vehicle.currentMileage)

    let nextDueDate: Date | null = null
    let nextDueMileage: number | null = null

    if (parsedMonths) {
      nextDueDate = addMonths(lastDate, parsedMonths)
    }

    if (parsedKm) {
      nextDueMileage = lastKm + parsedKm
    }

    const status = evaluatePlanStatus(
      new Date(),
      existing.vehicle.currentMileage,
      nextDueDate,
      nextDueMileage,
      parseInt(advanceWarningDays) || 30,
      parseFloat(advanceWarningKm) || 1000
    )

    const updated = await prisma.maintenancePlan.update({
      where: { id },
      data: {
        name: name ? name.trim() : existing.name,
        intervalMonths: parsedMonths,
        intervalKm: parsedKm,
        lastPerformedDate: lastPerformedDate ? new Date(lastPerformedDate) : existing.lastPerformedDate,
        lastPerformedMileage: lastKm,
        nextDueDate,
        nextDueMileage,
        advanceWarningDays: parseInt(advanceWarningDays) || 30,
        advanceWarningKm: parseFloat(advanceWarningKm) || 1000,
        status,
        notes: notes !== undefined ? (notes?.trim() || null) : existing.notes,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating maintenance plan:', error)
    return NextResponse.json({ error: error.message || 'ไม่สามารถแก้ไขแผนซ่อมบำรุงได้' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ต้องระบุ ID แผนซ่อมบำรุงที่ต้องการลบ' }, { status: 400 })
    }

    const plan = await prisma.maintenancePlan.findUnique({ where: { id } })
    if (!plan) {
      return NextResponse.json({ error: 'ไม่พบแผนซ่อมบำรุง' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated records
      await tx.maintenanceRecord.deleteMany({ where: { planId: id } })
      // 2. Delete plan
      await tx.maintenancePlan.delete({ where: { id } })
    })

    return NextResponse.json({ success: true, message: `ลบแผนซ่อมบำรุง "${plan.name}" สำเร็จ` })
  } catch (error: any) {
    console.error('Error deleting maintenance plan:', error)
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการลบแผนซ่อมบำรุง' }, { status: 500 })
  }
}


