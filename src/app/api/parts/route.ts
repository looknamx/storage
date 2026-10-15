import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('category') || ''
    const stockStatus = searchParams.get('stockStatus') || '' // all, low, out, normal

    const where: any = {}

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { brand: { contains: search } },
        { compatibleModels: { contains: search } },
        { location: { contains: search } },
      ]
    }

    const parts = await prisma.part.findMany({
      where,
      include: {
        category: true,
        supplier: true,
        _count: {
          select: {
            stockReceiptItems: true,
            partIssueItems: true,
            inventoryTransactions: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    })

    // Filter by stock status if requested
    let filteredParts = parts
    if (stockStatus === 'low') {
      filteredParts = parts.filter((p) => p.quantity > 0 && p.quantity <= p.minimumStock)
    } else if (stockStatus === 'out') {
      filteredParts = parts.filter((p) => p.quantity <= 0)
    } else if (stockStatus === 'normal') {
      filteredParts = parts.filter((p) => p.quantity > p.minimumStock)
    }

    // Categories and suppliers for filter dropdowns
    const categories = await prisma.partCategory.findMany({ orderBy: { name: 'asc' } })
    const suppliers = await prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })

    return NextResponse.json({
      parts: filteredParts,
      categories,
      suppliers,
    })
  } catch (error) {
    console.error('Error fetching parts:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลอะไหล่ได้' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate unique part code
    const existingCode = await prisma.part.findUnique({
      where: { code: body.code.trim() },
    })

    if (existingCode) {
      return NextResponse.json(
        { error: `รหัสอะไหล่ "${body.code}" มีอยู่ในระบบแล้ว` },
        { status: 400 }
      )
    }

    const initialQuantity = body.quantity ? parseFloat(body.quantity) : 0

    const part = await prisma.part.create({
      data: {
        code: body.code.trim(),
        name: body.name.trim(),
        categoryId: body.categoryId || null,
        brand: body.brand?.trim() || null,
        compatibleModels: body.compatibleModels?.trim() || null,
        unit: body.unit?.trim() || 'ชิ้น',
        quantity: initialQuantity,
        minimumStock: body.minimumStock ? parseFloat(body.minimumStock) : 0,
        costPerUnit: body.costPerUnit ? parseFloat(body.costPerUnit) : 0,
        location: body.location?.trim() || null,
        supplierId: body.supplierId || null,
        description: body.description?.trim() || null,
        notes: body.notes?.trim() || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    })

    // Record initial inventory transaction if quantity > 0
    if (initialQuantity > 0) {
      await prisma.inventoryTransaction.create({
        data: {
          partId: part.id,
          transactionType: 'receive',
          quantity: initialQuantity,
          previousQty: 0,
          newQty: initialQuantity,
          referenceType: 'adjustment',
          reason: 'ยอดยกมาเริ่มต้น ณ วันที่บันทึกทะเบียนอะไหล่',
          performedBy: body.recordedBy || 'เจ้าหน้าที่คลัง',
        },
      })
    }

    return NextResponse.json(part, { status: 201 })
  } catch (error) {
    console.error('Error creating part:', error)
    return NextResponse.json({ error: 'ไม่สามารถบันทึกข้อมูลอะไหล่ได้' }, { status: 500 })
  }
}

