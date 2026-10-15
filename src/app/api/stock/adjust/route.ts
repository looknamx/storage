import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateDocumentNumber } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { partId, newQuantity, reason, adjustedBy, notes } = body

    if (!partId) {
      return NextResponse.json({ error: 'ต้องระบุอะไหล่ที่ต้องการปรับยอด' }, { status: 400 })
    }

    if (newQuantity === undefined || newQuantity === null || isNaN(parseFloat(newQuantity))) {
      return NextResponse.json({ error: 'ต้องระบุยอดสต็อกใหม่ที่ถูกต้อง' }, { status: 400 })
    }

    const targetQty = parseFloat(newQuantity)
    if (targetQty < 0) {
      return NextResponse.json({ error: 'ยอดสต็อกใหม่ต้องไม่ติดลบ' }, { status: 400 })
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'การปรับยอดสต็อกต้องระบุเหตุผลเสมอ' }, { status: 400 })
    }

    const docNumber = generateDocumentNumber('ADJ')

    const result = await prisma.$transaction(async (tx) => {
      const part = await tx.part.findUnique({ where: { id: partId } })
      if (!part) throw new Error('ไม่พบข้อมูลอะไหล่')

      const prevQty = part.quantity
      const difference = targetQty - prevQty

      if (difference === 0) {
        throw new Error('ยอดสต็อกใหม่เท่ากับยอดเดิม ไม่จำเป็นต้องปรับปรุงยอด')
      }

      // Update part quantity
      const updatedPart = await tx.part.update({
        where: { id: partId },
        data: { quantity: targetQty },
      })

      // Record transaction
      const transaction = await tx.inventoryTransaction.create({
        data: {
          partId,
          transactionType: 'adjust',
          quantity: difference,
          previousQty: prevQty,
          newQty: targetQty,
          referenceType: 'adjustment',
          referenceNumber: docNumber,
          reason: `ปรับปรุงยอดสต็อก: เดิม ${prevQty} เป็น ${targetQty} (ผลต่าง ${
            difference > 0 ? `+${difference}` : difference
          } ${part.unit}) - เหตุผล: ${reason.trim()}`,
          performedBy: adjustedBy?.trim() || 'เจ้าหน้าที่ตรวจนับสต็อก',
          transactionDate: new Date(),
        },
      })

      return { part: updatedPart, transaction }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error adjusting stock:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการปรับยอดสต็อก' },
      { status: 400 }
    )
  }
}

