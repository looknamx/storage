import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateDocumentNumber } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const issues = await prisma.partIssue.findMany({
      orderBy: { issueDate: 'desc' },
      include: {
        vehicle: true,
        repairOrder: true,
        items: {
          include: {
            part: true,
          },
        },
        partReturns: true,
      },
    })
    return NextResponse.json(issues)
  } catch (error) {
    console.error('Error fetching part issues:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลรายการเบิกจ่ายได้' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { issueDate, vehicleId, repairOrderId, issuedBy, notes, items } = body

    if (!vehicleId) {
      return NextResponse.json({ error: 'การเบิกอะไหล่ต้องระบุทะเบียนรถปลายทางเสมอ' }, { status: 400 })
    }

    if (!repairOrderId) {
      return NextResponse.json({ error: 'การเบิกอะไหล่ต้องระบุใบงานซ่อมที่เกี่ยวข้องเสมอ' }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'ต้องมีรายการอะไหล่ที่ต้องการเบิกอย่างน้อย 1 รายการ' }, { status: 400 })
    }

    const docNumber = generateDocumentNumber('ISS')

    // Execute in Prisma Transaction to enforce stock validation and atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate vehicle and repair order
      const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } })
      if (!vehicle) throw new Error('ไม่พบข้อมูลรถที่ระบุ')

      const repairOrder = await tx.repairOrder.findUnique({ where: { id: repairOrderId } })
      if (!repairOrder) throw new Error('ไม่พบข้อมูลใบงานซ่อมที่ระบุ')

      // 2. Pre-check stock levels for all items (prevent negative stock)
      let totalAmount = 0
      for (const item of items) {
        const qtyToIssue = parseFloat(item.quantity)
        if (qtyToIssue <= 0) {
          throw new Error('จำนวนที่เบิกต้องมากกว่า 0')
        }

        const part = await tx.part.findUnique({ where: { id: item.partId } })
        if (!part) {
          throw new Error(`ไม่พบอะไหล่รหัส ID: ${item.partId}`)
        }

        if (part.quantity < qtyToIssue) {
          throw new Error(
            `ไม่สามารถเบิกอะไหล่ "${part.name}" ได้ เนื่องจากยอดคงเหลือ (${part.quantity} ${part.unit}) ไม่เพียงพอกับจำนวนที่ต้องการเบิก (${qtyToIssue} ${part.unit})`
          )
        }

        totalAmount += qtyToIssue * part.costPerUnit
      }

      // 3. Create Part Issue Record
      const issue = await tx.partIssue.create({
        data: {
          issueNumber: docNumber,
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          vehicleId,
          repairOrderId,
          issuedBy: issuedBy?.trim() || 'ผู้ขอเบิก',
          totalAmount,
          notes: notes?.trim() || null,
          status: 'completed',
        },
      })

      // 4. Deduct stock, create items and inventory transactions
      for (const item of items) {
        const qtyToIssue = parseFloat(item.quantity)
        const part = (await tx.part.findUnique({ where: { id: item.partId } }))!
        const prevQty = part.quantity
        const newQty = prevQty - qtyToIssue
        const totalCost = qtyToIssue * part.costPerUnit

        // Create issue item
        await tx.partIssueItem.create({
          data: {
            issueId: issue.id,
            partId: item.partId,
            quantity: qtyToIssue,
            costPerUnit: part.costPerUnit,
            totalCost,
            notes: item.notes?.trim() || null,
          },
        })

        // Deduct part stock
        await tx.part.update({
          where: { id: item.partId },
          data: { quantity: newQty },
        })

        // Create Inventory Transaction
        await tx.inventoryTransaction.create({
          data: {
            partId: item.partId,
            transactionType: 'issue',
            quantity: -qtyToIssue,
            previousQty: prevQty,
            newQty: newQty,
            referenceType: 'issue',
            referenceId: issue.id,
            referenceNumber: issue.issueNumber,
            vehicleId,
            repairOrderId,
            reason: `เบิกไปใช้กับรถ ${vehicle.licensePlate} (${vehicle.brand} ${vehicle.model}) ตามใบงาน ${repairOrder.orderNumber}`,
            performedBy: issuedBy || 'เจ้าหน้าที่',
            transactionDate: issue.issueDate,
          },
        })
      }

      // 5. Update Repair Order partsCost and totalCost automatically
      const currentPartsCost = repairOrder.partsCost + totalAmount
      const currentTotalCost = repairOrder.laborCost + currentPartsCost + repairOrder.otherCost
      await tx.repairOrder.update({
        where: { id: repairOrderId },
        data: {
          partsCost: currentPartsCost,
          totalCost: currentTotalCost,
        },
      })

      return issue
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error creating part issue:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการเบิกจ่ายอะไหล่' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ต้องระบุ ID ใบเบิกที่ต้องการลบ' }, { status: 400 })
    }

    const issue = await prisma.partIssue.findUnique({
      where: { id },
      include: {
        items: { include: { part: true } },
        partReturns: true,
        repairOrder: true,
      },
    })

    if (!issue) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลใบเบิกอะไหล่' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      // 1. Revert stock: return unreturned quantities back to inventory
      for (const item of issue.items) {
        const netQuantityToRestore = item.quantity - item.returnedQty
        if (netQuantityToRestore > 0) {
          const currentPart = await tx.part.findUnique({ where: { id: item.partId } })
          if (currentPart) {
            const prevQty = currentPart.quantity
            const newQty = prevQty + netQuantityToRestore

            await tx.part.update({
              where: { id: item.partId },
              data: { quantity: newQty },
            })

            // Record transaction for cancellation/delete
            await tx.inventoryTransaction.create({
              data: {
                partId: item.partId,
                transactionType: 'return',
                quantity: netQuantityToRestore,
                previousQty: prevQty,
                newQty,
                referenceType: 'return',
                referenceNumber: issue.issueNumber,
                reason: `ยกเลิก/ลบใบเบิก ${issue.issueNumber} (คืนสต็อกอัตโนมัติ)`,
                performedBy: 'ระบบ',
                transactionDate: new Date(),
              },
            })
          }
        }
      }

      // 2. Adjust linked repair order cost if applicable
      if (issue.repairOrder) {
        const deductedPartsCost = Math.max(0, issue.repairOrder.partsCost - issue.totalAmount)
        const updatedTotalCost = issue.repairOrder.laborCost + deductedPartsCost + issue.repairOrder.otherCost

        await tx.repairOrder.update({
          where: { id: issue.repairOrderId! },
          data: {
            partsCost: deductedPartsCost,
            totalCost: updatedTotalCost,
          },
        })
      }

      // 3. Delete returns, items, and issue record
      await tx.partReturn.deleteMany({ where: { issueId: id } })
      await tx.partIssueItem.deleteMany({ where: { issueId: id } })
      await tx.partIssue.delete({ where: { id } })
    })

    return NextResponse.json({ success: true, message: `ลบใบเบิก ${issue.issueNumber} และคืนสต็อกสำเร็จ` })
  } catch (error: any) {
    console.error('Error deleting part issue:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการลบใบเบิก' },
      { status: 500 }
    )
  }
}


