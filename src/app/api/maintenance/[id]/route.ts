import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { addMonths } from 'date-fns'
import { evaluatePlanStatus } from '../route'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const plan = await prisma.maintenancePlan.findUnique({
      where: { id },
      include: {
        vehicle: true,
        records: {
          orderBy: { performedDate: 'desc' },
        },
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'ไม่พบแผนซ่อมบำรุง' }, { status: 404 })
    }

    return NextResponse.json(plan)
  } catch (error: any) {
    console.error('Error fetching maintenance plan:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      intervalMonths,
      intervalKm,
      lastPerformedDate,
      lastPerformedMileage,
      advanceWarningDays = 30,
      advanceWarningKm = 1000,
      notes,
    } = body

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const plan = await prisma.maintenancePlan.findUnique({ where: { id } })
    if (!plan) {
      return NextResponse.json({ error: 'ไม่พบแผนซ่อมบำรุง' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.maintenanceRecord.deleteMany({ where: { planId: id } })
      await tx.maintenancePlan.delete({ where: { id } })
    })

    return NextResponse.json({ success: true, message: `ลบแผนซ่อมบำรุง "${plan.name}" สำเร็จ` })
  } catch (error: any) {
    console.error('Error deleting maintenance plan:', error)
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการลบแผนซ่อมบำรุง' }, { status: 500 })
  }
}

