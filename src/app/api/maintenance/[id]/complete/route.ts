import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { addMonths } from 'date-fns'
import { evaluatePlanStatus } from '@/app/api/maintenance/route'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      performedDate,
      mileageAtService,
      description,
      cost = 0,
      performedBy,
      repairOrderId,
      notes,
    } = body

    const plan = await prisma.maintenancePlan.findUnique({
      where: { id },
      include: { vehicle: true },
    })

    if (!plan) {
      return NextResponse.json({ error: 'ไม่พบแผนซ่อมบำรุง' }, { status: 404 })
    }

    const serviceDate = performedDate ? new Date(performedDate) : new Date()
    const currentServiceKm = mileageAtService !== undefined && mileageAtService !== null
      ? parseFloat(mileageAtService)
      : plan.vehicle.currentMileage

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Maintenance Record
      const record = await tx.maintenanceRecord.create({
        data: {
          planId: id,
          vehicleId: plan.vehicleId,
          performedDate: serviceDate,
          mileageAtService: currentServiceKm,
          description: description?.trim() || `ดำเนินการตามรอบ: ${plan.name}`,
          cost: parseFloat(cost) || 0,
          performedBy: performedBy?.trim() || null,
          repairOrderId: repairOrderId || null,
          notes: notes?.trim() || null,
        },
      })

      // 2. Compute Next Due Date and Mileage based on preset intervals
      let nextDueDate: Date | null = null
      let nextDueMileage: number | null = null

      if (plan.intervalMonths) {
        nextDueDate = addMonths(serviceDate, plan.intervalMonths)
      }

      if (plan.intervalKm) {
        nextDueMileage = currentServiceKm + plan.intervalKm
      }

      // Re-evaluate status for new cycle
      const newStatus = evaluatePlanStatus(
        new Date(),
        plan.vehicle.currentMileage,
        nextDueDate,
        nextDueMileage,
        plan.advanceWarningDays,
        plan.advanceWarningKm
      )

      // 3. Update Plan
      const updatedPlan = await tx.maintenancePlan.update({
        where: { id },
        data: {
          lastPerformedDate: serviceDate,
          lastPerformedMileage: currentServiceKm,
          nextDueDate,
          nextDueMileage,
          status: newStatus,
        },
      })

      // 4. Update Vehicle mileage if service km is higher
      if (currentServiceKm > plan.vehicle.currentMileage) {
        await tx.vehicle.update({
          where: { id: plan.vehicleId },
          data: {
            currentMileage: currentServiceKm,
            mileageDate: new Date(),
          },
        })

        await tx.odometerReading.create({
          data: {
            vehicleId: plan.vehicleId,
            reading: currentServiceKm,
            readingDate: serviceDate,
            source: 'maintenance',
            referenceId: plan.id,
            notes: `เลขไมล์เมื่อทำ ${plan.name}`,
          },
        })
      }

      return { record, plan: updatedPlan }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error recording maintenance execution:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการบันทึกการซ่อมบำรุง' },
      { status: 500 }
    )
  }
}

