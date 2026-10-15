import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateDocumentNumber } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const receipts = await prisma.stockReceipt.findMany({
      orderBy: { receiptDate: 'desc' },
      include: {
        supplier: true,
        items: {
          include: {
            part: true,
          },
        },
      },
    })
    return NextResponse.json(receipts)
  } catch (error) {
    console.error('Error fetching stock receipts:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลรายการรับเข้าได้' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { receiptDate, supplierId, purchaseOrderRef, receivedBy, notes, items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'ต้องมีรายการอะไหล่อย่างน้อย 1 รายการ' }, { status: 400 })
    }

    const docNumber = generateDocumentNumber('REC')

    // Execute in Prisma Transaction to guarantee data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Calculate total amount
      let totalAmount = 0
      for (const item of items) {
        const qty = parseFloat(item.quantity)
        const cost = parseFloat(item.costPerUnit)
        totalAmount += qty * cost
      }

      // 2. Create Stock Receipt Header
      const receipt = await tx.stockReceipt.create({
        data: {
          receiptNumber: docNumber,
          receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
          supplierId: supplierId || null,
          purchaseOrderRef: purchaseOrderRef?.trim() || null,
          receivedBy: receivedBy?.trim() || 'เจ้าหน้าที่คลัง',
          totalAmount,
          notes: notes?.trim() || null,
          status: 'completed',
        },
      })

      // 3. Process each item: create receipt item, update part quantity & cost, and record transaction
      for (const item of items) {
        const qty = parseFloat(item.quantity)
        const cost = parseFloat(item.costPerUnit)
        const totalCost = qty * cost

        const part = await tx.part.findUnique({ where: { id: item.partId } })
        if (!part) {
          throw new Error(`ไม่พบอะไหล่รหัส ID: ${item.partId}`)
        }

        const prevQty = part.quantity
        const newQty = prevQty + qty

        // Create receipt item
        await tx.stockReceiptItem.create({
          data: {
            receiptId: receipt.id,
            partId: item.partId,
            quantity: qty,
            costPerUnit: cost,
            totalCost,
            notes: item.notes?.trim() || null,
          },
        })

        // Update part current stock & latest cost
        await tx.part.update({
          where: { id: item.partId },
          data: {
            quantity: newQty,
            costPerUnit: cost > 0 ? cost : part.costPerUnit,
          },
        })

        // Record Inventory Transaction
        await tx.inventoryTransaction.create({
          data: {
            partId: item.partId,
            transactionType: 'receive',
            quantity: qty,
            previousQty: prevQty,
            newQty: newQty,
            referenceType: 'receipt',
            referenceId: receipt.id,
            referenceNumber: receipt.receiptNumber,
            reason: `รับเข้าตามเอกสาร ${receipt.receiptNumber}${
              purchaseOrderRef ? ` (PO: ${purchaseOrderRef})` : ''
            }`,
            performedBy: receivedBy || 'เจ้าหน้าที่คลัง',
            transactionDate: receipt.receiptDate,
          },
        })
      }

      return receipt
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error creating stock receipt:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการบันทึกรับเข้าสต็อก' },
      { status: 500 }
    )
  }
}

