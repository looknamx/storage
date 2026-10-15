import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/categories - get part categories and vehicle types
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'part' or 'vehicle' or null (all)

    if (type === 'part') {
      const partCategories = await prisma.partCategory.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { parts: true } },
        },
      })
      return NextResponse.json(partCategories)
    }

    if (type === 'vehicle') {
      const vehicleTypes = await prisma.vehicleType.findMany({
        orderBy: { name: 'asc' },
      })
      return NextResponse.json(vehicleTypes)
    }

    const [partCategories, vehicleTypes] = await Promise.all([
      prisma.partCategory.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { parts: true } },
        },
      }),
      prisma.vehicleType.findMany({
        orderBy: { name: 'asc' },
      }),
    ])

    return NextResponse.json({
      partCategories,
      vehicleTypes,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้' }, { status: 500 })
  }
}

// POST /api/categories - create part category or vehicle type
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { kind, name, description } = body // kind: 'part' | 'vehicle'

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อหมวดหมู่' }, { status: 400 })
    }

    const trimmedName = name.trim()

    if (kind === 'vehicle') {
      const existing = await prisma.vehicleType.findUnique({
        where: { name: trimmedName },
      })
      if (existing) {
        return NextResponse.json({ error: `ประเภทรถ "${trimmedName}" มีอยู่ในระบบแล้ว` }, { status: 400 })
      }

      const vehicleType = await prisma.vehicleType.create({
        data: {
          name: trimmedName,
          description: description?.trim() || null,
        },
      })
      return NextResponse.json(vehicleType, { status: 201 })
    } else {
      // Default: part category
      const existing = await prisma.partCategory.findUnique({
        where: { name: trimmedName },
      })
      if (existing) {
        return NextResponse.json({ error: `หมวดหมู่อะไหล่ "${trimmedName}" มีอยู่ในระบบแล้ว` }, { status: 400 })
      }

      const category = await prisma.partCategory.create({
        data: {
          name: trimmedName,
          description: description?.trim() || null,
        },
      })
      return NextResponse.json(category, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'ไม่สามารถบันทึกหมวดหมู่ได้' }, { status: 500 })
  }
}

// DELETE /api/categories - delete part category or vehicle type
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const kind = searchParams.get('kind') // 'part' | 'vehicle'

    if (!id) {
      return NextResponse.json({ error: 'ต้องระบุ ID ที่ต้องการลบ' }, { status: 400 })
    }

    if (kind === 'vehicle') {
      const type = await prisma.vehicleType.findUnique({ where: { id } })
      if (!type) return NextResponse.json({ error: 'ไม่พบประเภทรถนี้' }, { status: 404 })

      // Check if any vehicle uses this vehicle type
      const usedInVehicle = await prisma.vehicle.count({
        where: { vehicleType: type.name },
      })
      if (usedInVehicle > 0) {
        return NextResponse.json(
          { error: `ไม่สามารถลบ "${type.name}" ได้ เนื่องจากมีรถบริษัทใช้งานประเภทนี้อยู่ (${usedInVehicle} คัน)` },
          { status: 400 }
        )
      }

      await prisma.vehicleType.delete({ where: { id } })
      return NextResponse.json({ success: true, message: 'ลบประเภทรถเรียบร้อยแล้ว' })
    } else {
      // Part category
      const category = await prisma.partCategory.findUnique({
        where: { id },
        include: { _count: { select: { parts: true } } },
      })
      if (!category) return NextResponse.json({ error: 'ไม่พบหมวดหมู่นี้' }, { status: 404 })

      if (category._count.parts > 0) {
        return NextResponse.json(
          { error: `ไม่สามารถลบหมวดหมู่ "${category.name}" ได้ เนื่องจากมีอะไหล่อยู่ในหมวดหมู่นี้ (${category._count.parts} รายการ)` },
          { status: 400 }
        )
      }

      await prisma.partCategory.delete({ where: { id } })
      return NextResponse.json({ success: true, message: 'ลบหมวดหมู่อะไหล่เรียบร้อยแล้ว' })
    }
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'ไม่สามารถลบหมวดหมู่ได้' }, { status: 500 })
  }
}

