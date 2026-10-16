import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateDocumentNumber } from '@/lib/utils'

export async function GET() {
  try {
    const returns = await prisma.partReturn.findMany({
      orderBy: { returnDate: 'desc' },
      include: {
        issue: {
          include: {
            vehicle: true,
            repairOrder: true,
            items: {
              include: {
                part: true,
              },
            },
          },
        },
      },
    })

    // Fetch part details by partId for each return
    const partIds = [...new Set(returns.map((r) => r.partId))]
    const parts = await prisma.part.findMany({
      where: { id: { in: partIds } },
    })
    const partMap = new Map(parts.map((p) => [p.id, p]))

    const enrichedReturns = returns.map((r) => ({
      ...r,
      part: partMap.get(r.partId) || null,
    }))

    return NextResponse.json(enrichedReturns)
  } catch (error) {
    console.error('Error fetching part returns:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลรายการคืนอะไหล่ได้' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { issueId, partId, quantity, condition, reason, returnedBy, notes } = body

    if (!issueId) {
      return NextResponse.json({ error: 'ต้องระบุเลขที่ใบเบิกที่ต้องการคืน' }, { status: 400 })
    }

    if (!partId) {
      return NextResponse.json({ error: 'ต้องระบุอะไหล่ที่ต้องการคืน' }, { status: 400 })
    }

    const qtyToReturn = parseFloat(quantity)
    if (!qtyToReturn || qtyToReturn <= 0) {
      return NextResponse.json({ error: 'จำนวนที่คืนต้องมากกว่า 0' }, { status: 400 })
    }

    const docNumber = generateDocumentNumber('RET')

    const result = await prisma.$transaction(async (tx) => {
      // Find issue item
      const issueItem = await tx.partIssueItem.findFirst({
        where: { issueId, partId },
        include: {
          issue: {
            include: {
              vehicle: true,
              repairOrder: true,
            },
          },
          part: true,
        },
      })

      if (!issueItem) {
        throw new Error('ไม่พบรายการอะไหล่นี้ในใบเบิกที่ระบุ')
      }

      const availableToReturn = issueItem.quantity - issueItem.returnedQty
      if (qtyToReturn > availableToReturn) {
        throw new Error(
          `ไม่สามารถคืนเกินจำนวนที่เบิกได้ (เบิกไป ${issueItem.quantity}, คืนแล้ว ${issueItem.returnedQty}, สามารถคืนได้สูงสุด ${availableToReturn} ${issueItem.part.unit})`
        )
      }

      // Create Return Record
      const returnRecord = await tx.partReturn.create({
        data: {
          returnNumber: docNumber,
          returnDate: new Date(),
          issueId,
          partId,
          quantity: qtyToReturn,
          condition: condition || 'good', // 'good' = normal, 'damaged' = defect
          reason: reason?.trim() || 'ไม่ได้ใช้งาน/ส่งคืนคลัง',
          returnedBy: returnedBy?.trim() || 'ผู้คืน',
          notes: notes?.trim() || null,
        },
      })

      // Update returnedQty on issueItem
      await tx.partIssueItem.update({
        where: { id: issueItem.id },
        data: {
          returnedQty: issueItem.returnedQty + qtyToReturn,
        },
      })

      // Only add back to active stock if condition is good
      const part = issueItem.part
      const prevQty = part.quantity
      let newQty = prevQty

      if (condition !== 'damaged') {
        newQty = prevQty + qtyToReturn
        await tx.part.update({
          where: { id: partId },
          data: { quantity: newQty },
        })
      }

      // Record transaction
      await tx.inventoryTransaction.create({
        data: {
          partId,
          transactionType: 'return',
          quantity: qtyToReturn,
          previousQty: prevQty,
          newQty: newQty,
          referenceType: 'return',
          referenceId: returnRecord.id,
          referenceNumber: returnRecord.returnNumber,
          vehicleId: issueItem.issue.vehicleId,
          repairOrderId: issueItem.issue.repairOrderId,
          reason: `คืนอะไหล่จากใบเบิก ${issueItem.issue.issueNumber}${
            condition === 'damaged' ? ' (สภาพชำรุด ไม่นำเข้าสต็อกใช้งาน)' : ' (สภาพพร้อมใช้งาน)'
          } - ${reason || ''}`,
          performedBy: returnedBy || 'เจ้าหน้าที่',
          transactionDate: returnRecord.returnDate,
        },
      })

      // Recalculate repair order costs if linked
      if (issueItem.issue.repairOrder) {
        const refundedAmount = qtyToReturn * issueItem.costPerUnit
        const newPartsCost = Math.max(0, issueItem.issue.repairOrder.partsCost - refundedAmount)
        const newTotalCost =
          issueItem.issue.repairOrder.laborCost + newPartsCost + issueItem.issue.repairOrder.otherCost

        await tx.repairOrder.update({
          where: { id: issueItem.issue.repairOrderId! },
          data: {
            partsCost: newPartsCost,
            totalCost: newTotalCost,
          },
        })
      }

      return returnRecord
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error processing part return:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการคืนอะไหล่' },
      { status: 400 }
    )
  }
}

