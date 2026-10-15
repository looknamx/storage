import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const order = await prisma.repairOrder.findUnique({
      where: { id },
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
            partReturns: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'ไม่พบใบงานซ่อม' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching repair order:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลใบงานได้' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.repairOrder.findUnique({
      where: { id },
      include: { items: true, vehicle: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบใบงานซ่อม' }, { status: 404 })
    }

    const {
      status,
      diagnosis,
      assignedTo,
      laborCost,
      otherCost,
      startDate,
      completedDate,
      deliveredDate,
      testResult,
      notes,
      items,
    } = body

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update items if provided
      let currentLabor = laborCost !== undefined ? parseFloat(laborCost) : existing.laborCost
      let currentOther = otherCost !== undefined ? parseFloat(otherCost) : existing.otherCost

      if (items && Array.isArray(items)) {
        // Delete removed items or recreate
        await tx.repairOrderItem.deleteMany({ where: { repairOrderId: id } })
        if (items.length > 0) {
          await tx.repairOrderItem.createMany({
            data: items.map((it: any) => ({
              repairOrderId: id,
              description: it.description?.trim() || 'งานซ่อม',
              laborCost: it.laborCost ? parseFloat(it.laborCost) : 0,
              otherCost: it.otherCost ? parseFloat(it.otherCost) : 0,
              partsCost: 0,
              status: it.status || 'pending',
              notes: it.notes?.trim() || null,
            })),
          })

          // Sum up items costs
          let itemLabor = 0
          let itemOther = 0
          for (const it of items) {
            itemLabor += it.laborCost ? parseFloat(it.laborCost) : 0
            itemOther += it.otherCost ? parseFloat(it.otherCost) : 0
          }
          currentLabor = itemLabor
          currentOther = itemOther
        }
      }

      // Recompute total cost using existing verified partsCost
      const totalCost = currentLabor + existing.partsCost + currentOther

      // 2. Prepare dates and vehicle status based on order status transition
      let startDt = startDate ? new Date(startDate) : existing.startDate
      let compDt = completedDate ? new Date(completedDate) : existing.completedDate
      let delDt = deliveredDate ? new Date(deliveredDate) : existing.deliveredDate

      if (status === 'repairing' && !startDt) {
        startDt = new Date()
      } else if (status === 'completed' && !compDt) {
        compDt = new Date()
      } else if (status === 'delivered') {
        if (!compDt) compDt = new Date()
        if (!delDt) delDt = new Date()
      }

      // 3. Update Repair Order
      const updatedOrder = await tx.repairOrder.update({
        where: { id },
        data: {
          status: status || existing.status,
          diagnosis: diagnosis !== undefined ? diagnosis?.trim() || null : existing.diagnosis,
          assignedTo: assignedTo !== undefined ? assignedTo?.trim() || null : existing.assignedTo,
          laborCost: currentLabor,
          otherCost: currentOther,
          totalCost,
          startDate: startDt,
          completedDate: compDt,
          deliveredDate: delDt,
          testResult: testResult !== undefined ? testResult?.trim() || null : existing.testResult,
          notes: notes !== undefined ? notes?.trim() || null : existing.notes,
        },
      })

      // 4. Synchronize Vehicle status when repair order transitions
      let newVehicleStatus = existing.vehicle.status
      if (status === 'completed' || status === 'delivered') {
        newVehicleStatus = 'active' // vehicle is ready and back in service
      } else if (status === 'repairing') {
        newVehicleStatus = 'repairing'
      } else if (status === 'waiting_parts') {
        newVehicleStatus = 'waiting_parts'
      } else if (status === 'inspecting') {
        newVehicleStatus = 'waiting_repair'
      }

      if (newVehicleStatus !== existing.vehicle.status) {
        await tx.vehicle.update({
          where: { id: existing.vehicleId },
          data: { status: newVehicleStatus },
        })
      }

      return updatedOrder
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error updating repair order:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการอัปเดตใบงาน' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const order = await prisma.repairOrder.findUnique({
      where: { id },
      include: {
        partIssues: true,
        vehicle: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'ไม่พบใบงานซ่อม' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated repair order items
      await tx.repairOrderItem.deleteMany({ where: { repairOrderId: id } })

      // 2. Unlink or handle partIssues linked to this repair order
      await tx.partIssue.updateMany({
        where: { repairOrderId: id },
        data: { repairOrderId: null },
      })

      // 3. Delete the repair order
      await tx.repairOrder.delete({ where: { id } })

      // 4. If vehicle was in waiting_repair or repairing, check if there are any other active repairs
      const remainingActive = await tx.repairOrder.count({
        where: {
          vehicleId: order.vehicleId,
          status: { in: ['open', 'repairing', 'waiting_parts', 'inspecting'] },
        },
      })

      if (remainingActive === 0 && ['repairing', 'waiting_repair', 'waiting_parts'].includes(order.vehicle.status)) {
        await tx.vehicle.update({
          where: { id: order.vehicleId },
          data: { status: 'active' },
        })
      }
    })

    return NextResponse.json({ success: true, message: `ลบใบงานซ่อม ${order.orderNumber} เรียบร้อยแล้ว` })
  } catch (error: any) {
    console.error('Error deleting repair order:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการลบใบงานซ่อม' },
      { status: 500 }
    )
  }
}


