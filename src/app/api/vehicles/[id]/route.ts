import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        odometerReadings: {
          orderBy: { readingDate: 'desc' },
          take: 20,
        },
        repairOrders: {
          orderBy: { orderDate: 'desc' },
          include: {
            items: true,
            partIssues: {
              include: {
                items: {
                  include: {
                    part: true,
                  },
                },
              },
            },
          },
        },
        partIssues: {
          orderBy: { issueDate: 'desc' },
          include: {
            items: {
              include: {
                part: true,
              },
            },
            repairOrder: true,
          },
        },
        maintenancePlans: {
          orderBy: { nextDueDate: 'asc' },
          include: {
            records: {
              orderBy: { performedDate: 'desc' },
              take: 5,
            },
          },
        },
      },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรถในระบบ' }, { status: 404 })
    }

    // Calculate aggregated statistics
    const totalRepairCost = vehicle.repairOrders.reduce((sum, ro) => sum + ro.totalCost, 0)
    const totalPartsCost = vehicle.repairOrders.reduce((sum, ro) => sum + ro.partsCost, 0)
    const totalLaborCost = vehicle.repairOrders.reduce((sum, ro) => sum + ro.laborCost, 0)
    const totalOtherCost = vehicle.repairOrders.reduce((sum, ro) => sum + ro.otherCost, 0)
    const lastRepair = vehicle.repairOrders[0] || null

    return NextResponse.json({
      vehicle,
      statistics: {
        totalRepairCost,
        totalPartsCost,
        totalLaborCost,
        totalOtherCost,
        totalRepairOrders: vehicle.repairOrders.length,
        lastRepairDate: lastRepair?.orderDate || null,
        lastRepairSymptoms: lastRepair?.reportedSymptoms || null,
      },
    })
  } catch (error) {
    console.error('Error fetching vehicle details:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลรายละเอียดรถได้' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check existing
    const existing = await prisma.vehicle.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรถในระบบ' }, { status: 404 })
    }

    // Check duplicate license plate if changed
    if (body.licensePlate && body.licensePlate !== existing.licensePlate) {
      const duplicatePlate = await prisma.vehicle.findUnique({
        where: { licensePlate: body.licensePlate.trim() },
      })
      if (duplicatePlate) {
        return NextResponse.json(
          { error: `ทะเบียนรถ "${body.licensePlate}" มีอยู่ในระบบแล้ว` },
          { status: 400 }
        )
      }
    }

    // Check mileage update
    let newMileage = existing.currentMileage
    if (body.currentMileage !== undefined) {
      const parsedMileage = parseFloat(body.currentMileage)
      if (parsedMileage < existing.currentMileage && !body.allowLowerMileage) {
        return NextResponse.json(
          {
            error: `เลขไมล์ใหม่ (${parsedMileage.toLocaleString()} กม.) น้อยกว่าเลขไมล์เดิม (${existing.currentMileage.toLocaleString()} กม.) หากต้องการแก้ไขเพื่อความถูกต้อง กรุณาระบุเหตุผลและยืนยัน`,
            requiresConfirmation: true,
          },
          { status: 400 }
        )
      }

      if (parsedMileage !== existing.currentMileage) {
        newMileage = parsedMileage
        await prisma.odometerReading.create({
          data: {
            vehicleId: id,
            reading: newMileage,
            readingDate: new Date(),
            source: 'manual',
            notes: body.mileageReason || 'อัปเดตเลขไมล์ประจำวัน/รอบตรวจเช็ก',
          },
        })

        // Re-evaluate maintenance plan statuses based on new mileage
        const plans = await prisma.maintenancePlan.findMany({
          where: { vehicleId: id, isActive: true },
        })

        for (const plan of plans) {
          if (plan.nextDueMileage) {
            let status = plan.status
            if (newMileage >= plan.nextDueMileage) {
              status = 'overdue'
            } else if (newMileage >= plan.nextDueMileage - plan.advanceWarningKm) {
              status = 'upcoming'
            }
            if (status !== plan.status) {
              await prisma.maintenancePlan.update({
                where: { id: plan.id },
                data: { status },
              })
            }
          }
        }
      }
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        licensePlate: body.licensePlate ? body.licensePlate.trim() : existing.licensePlate,
        province: body.province ? body.province.trim() : existing.province,
        brand: body.brand ? body.brand.trim() : existing.brand,
        model: body.model ? body.model.trim() : existing.model,
        vehicleType: body.vehicleType ? body.vehicleType.trim() : existing.vehicleType,
        year: body.year !== undefined ? parseInt(body.year) : existing.year,
        vin: body.vin !== undefined ? body.vin?.trim() || null : existing.vin,
        engineNumber: body.engineNumber !== undefined ? body.engineNumber?.trim() || null : existing.engineNumber,
        department: body.department !== undefined ? body.department?.trim() || null : existing.department,
        responsiblePerson: body.responsiblePerson !== undefined ? body.responsiblePerson?.trim() || null : existing.responsiblePerson,
        startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
        currentMileage: newMileage,
        mileageDate: new Date(),
        status: body.status || existing.status,
        notes: body.notes !== undefined ? body.notes?.trim() || null : existing.notes,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating vehicle:', error)
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตข้อมูลรถได้' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if vehicle has any repair orders or part issues
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            repairOrders: true,
            partIssues: true,
          },
        },
      },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรถในระบบ' }, { status: 404 })
    }

    if (vehicle._count.repairOrders > 0 || vehicle._count.partIssues > 0) {
      return NextResponse.json(
        {
          error: `ห้ามลบรถคันนี้เนื่องจากมีประวัติการซ่อม (${vehicle._count.repairOrders} ครั้ง) หรือประวัติการเบิกอะไหล่ (${vehicle._count.partIssues} รายการ) อยู่ในระบบ กรุณาเปลี่ยนสถานะเป็น "หยุดใช้งาน" หรือ "จำหน่ายออกจากระบบ" แทน`,
        },
        { status: 400 }
      )
    }

    // Safe to delete if no historical transactions
    await prisma.odometerReading.deleteMany({ where: { vehicleId: id } })
    await prisma.maintenancePlan.deleteMany({ where: { vehicleId: id } })
    await prisma.vehicle.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'ลบข้อมูลรถเรียบร้อยแล้ว' })
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    return NextResponse.json({ error: 'ไม่สามารถลบข้อมูลรถได้' }, { status: 500 })
  }
}

