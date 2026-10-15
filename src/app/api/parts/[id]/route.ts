import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        inventoryTransactions: {
          orderBy: { transactionDate: 'desc' },
          take: 50,
        },
        stockReceiptItems: {
          include: {
            receipt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        partIssueItems: {
          include: {
            issue: {
              include: {
                vehicle: true,
                repairOrder: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!part) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลอะไหล่' }, { status: 404 })
    }

    return NextResponse.json(part)
  } catch (error) {
    console.error('Error fetching part details:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลอะไหล่ได้' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.part.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลอะไหล่' }, { status: 404 })
    }

    // Check code duplication
    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.part.findUnique({ where: { code: body.code.trim() } })
      if (duplicate) {
        return NextResponse.json(
          { error: `รหัสอะไหล่ "${body.code}" มีอยู่ในระบบแล้ว` },
          { status: 400 }
        )
      }
    }

    // Note: Stock quantity cannot be directly modified here, must use stock adjustment API to preserve audit trail
    const updated = await prisma.part.update({
      where: { id },
      data: {
        code: body.code ? body.code.trim() : existing.code,
        name: body.name ? body.name.trim() : existing.name,
        categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
        brand: body.brand !== undefined ? body.brand?.trim() || null : existing.brand,
        compatibleModels: body.compatibleModels !== undefined ? body.compatibleModels?.trim() || null : existing.compatibleModels,
        unit: body.unit ? body.unit.trim() : existing.unit,
        minimumStock: body.minimumStock !== undefined ? parseFloat(body.minimumStock) : existing.minimumStock,
        costPerUnit: body.costPerUnit !== undefined ? parseFloat(body.costPerUnit) : existing.costPerUnit,
        location: body.location !== undefined ? body.location?.trim() || null : existing.location,
        supplierId: body.supplierId !== undefined ? body.supplierId : existing.supplierId,
        description: body.description !== undefined ? body.description?.trim() || null : existing.description,
        notes: body.notes !== undefined ? body.notes?.trim() || null : existing.notes,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating part:', error)
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตข้อมูลอะไหล่ได้' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            stockReceiptItems: true,
            partIssueItems: true,
            inventoryTransactions: true,
          },
        },
      },
    })

    if (!part) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลอะไหล่' }, { status: 404 })
    }

    // Only block if there are active receipts or issues, unless force is specified
    if (!force && (part._count.stockReceiptItems > 0 || part._count.partIssueItems > 0)) {
      const reasons: string[] = []
      if (part._count.stockReceiptItems > 0) {
        reasons.push(`เอกสารรับเข้า ${part._count.stockReceiptItems} รายการ`)
      }
      if (part._count.partIssueItems > 0) {
        reasons.push(`เอกสารใบเบิกใช้งาน ${part._count.partIssueItems} รายการ`)
      }
      return NextResponse.json(
        {
          error: `ไม่สามารถลบอะไหล่นี้ได้เนื่องจากผูกอยู่กับ ${reasons.join(' และ ')} กรุณาลบเอกสารที่เกี่ยวข้องก่อน หรือยืนยันการลบแบบบังคับ (Force Delete)`,
          hasRelations: true,
          receiptCount: part._count.stockReceiptItems,
          issueCount: part._count.partIssueItems,
        },
        { status: 400 }
      )
    }

    // Delete in database transaction
    await prisma.$transaction(async (tx) => {
      // Clean up inventory transaction history logs
      await tx.inventoryTransaction.deleteMany({ where: { partId: id } })

      if (force) {
        // If force deleting, also clean up receipt items and issue items for this part
        await tx.stockReceiptItem.deleteMany({ where: { partId: id } })
        await tx.partIssueItem.deleteMany({ where: { partId: id } })
      }

      await tx.part.delete({ where: { id } })
    })

    return NextResponse.json({
      success: true,
      message: `ลบอะไหล่ "${part.name}" (${part.code}) เรียบร้อยแล้ว`,
    })
  } catch (error: any) {
    console.error('Error deleting part:', error)
    return NextResponse.json({ error: error.message || 'ไม่สามารถลบอะไหล่ได้' }, { status: 500 })
  }
}

