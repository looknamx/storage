import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateDocumentNumber } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const vehicleId = searchParams.get('vehicleId') || ''
    const month = searchParams.get('month') || ''
    const year = searchParams.get('year') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const where: any = {}

    if (startDate && endDate) {
      where.orderDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (month && year && month !== 'all') {
      const y = parseInt(year, 10)
      const ceYear = y > 2400 ? y - 543 : y
      const m = parseInt(month, 10) // 1-12
      const startOfMonth = new Date(ceYear, m - 1, 1, 0, 0, 0)
      const endOfMonth = new Date(ceYear, m, 0, 23, 59, 59)
      where.orderDate = {
        gte: startOfMonth,
        lte: endOfMonth,
      }
    }

    if (status) {
      where.status = status
    }

    if (vehicleId) {
      where.vehicleId = vehicleId
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { reportedSymptoms: { contains: search } },
        { reportedBy: { contains: search } },
        { assignedTo: { contains: search } },
        { vehicle: { licensePlate: { contains: search } } },
        { vehicle: { brand: { contains: search } } },
      ]
    }

    const orders = await prisma.repairOrder.findMany({
      where,
      orderBy: { orderDate: 'desc' },
      include: {
        vehicle: true,
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
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching repair orders:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลใบงานซ่อมได้' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      vehicleId,
      mileageAtRepair,
      reportedBy,
      department,
      reportedSymptoms,
      diagnosis,
      assignedTo,
      laborCost,
      otherCost,
      orderDate,
      startDate,
      items,
      vehicleStatus,
    } = body

    if (!vehicleId) {
      return NextResponse.json({ error: 'กรุณาเลือกรถที่ต้องการแจ้งซ่อม' }, { status: 400 })
    }

    if (!reportedSymptoms || !reportedSymptoms.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุอาการที่แจ้งซ่อม' }, { status: 400 })
    }

    const orderNumber = generateDocumentNumber('RO')

    const result = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } })
      if (!vehicle) throw new Error('ไม่พบข้อมูลรถในระบบ')

      // Calculate initial labor cost from items if any
      let calculatedLabor = laborCost ? parseFloat(laborCost) : 0
      let calculatedOther = otherCost ? parseFloat(otherCost) : 0

      if (items && Array.isArray(items) && items.length > 0) {
        for (const it of items) {
          calculatedLabor += it.laborCost ? parseFloat(it.laborCost) : 0
          calculatedOther += it.otherCost ? parseFloat(it.otherCost) : 0
        }
      }

      const totalCost = calculatedLabor + calculatedOther // partsCost initially 0 until parts issued

      // Create Repair Order
      const repairOrder = await tx.repairOrder.create({
        data: {
          orderNumber,
          vehicleId,
          mileageAtRepair: mileageAtRepair
            ? parseFloat(mileageAtRepair)
            : vehicle.currentMileage,
          reportedBy: reportedBy?.trim() || null,
          department: department?.trim() || vehicle.department || null,
          reportedSymptoms: reportedSymptoms.trim(),
          diagnosis: diagnosis?.trim() || null,
          assignedTo: assignedTo?.trim() || null,
          laborCost: calculatedLabor,
          partsCost: 0,
          otherCost: calculatedOther,
          totalCost,
          status: 'open',
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          startDate: startDate ? new Date(startDate) : null,
          items: items && items.length > 0
            ? {
                create: items.map((it: any) => ({
                  description: it.description?.trim() || 'งานซ่อม',
                  laborCost: it.laborCost ? parseFloat(it.laborCost) : 0,
                  otherCost: it.otherCost ? parseFloat(it.otherCost) : 0,
                  partsCost: 0,
                  status: 'pending',
                  notes: it.notes?.trim() || null,
                })),
              }
            : undefined,
        },
      })

      // Update vehicle status to waiting_repair or repairing
      const newVehicleStatus = vehicleStatus || 'waiting_repair'
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: newVehicleStatus },
      })

      // Update vehicle mileage if mileageAtRepair > vehicle.currentMileage
      if (mileageAtRepair && parseFloat(mileageAtRepair) > vehicle.currentMileage) {
        const newKm = parseFloat(mileageAtRepair)
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: {
            currentMileage: newKm,
            mileageDate: new Date(),
          },
        })

        await tx.odometerReading.create({
          data: {
            vehicleId,
            reading: newKm,
            readingDate: new Date(),
            source: 'repair_order',
            referenceId: repairOrder.id,
            notes: `เลขไมล์ ณ วันเปิดใบงานซ่อม ${repairOrder.orderNumber}`,
          },
        })
      }

      return repairOrder
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error creating repair order:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการเปิดใบงานซ่อม' },
      { status: 500 }
    )
  }
}

