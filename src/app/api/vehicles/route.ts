import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const department = searchParams.get('department') || ''

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (department) {
      where.department = department
    }

    if (search) {
      where.OR = [
        { licensePlate: { contains: search } },
        { code: { contains: search } },
        { brand: { contains: search } },
        { model: { contains: search } },
        { responsiblePerson: { contains: search } },
      ]
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            repairOrders: true,
            maintenancePlans: true,
            partIssues: true,
          },
        },
      },
    })

    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลรถได้' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate unique license plate
    const existingPlate = await prisma.vehicle.findUnique({
      where: { licensePlate: body.licensePlate.trim() },
    })

    if (existingPlate) {
      return NextResponse.json(
        { error: `ทะเบียนรถ "${body.licensePlate}" มีอยู่ในระบบแล้ว` },
        { status: 400 }
      )
    }

    // Auto-generate vehicle code if not given
    let vehicleCode = body.code?.trim()
    if (!vehicleCode) {
      const count = await prisma.vehicle.count()
      vehicleCode = `V-${String(count + 1).padStart(3, '0')}`
    } else {
      const existingCode = await prisma.vehicle.findUnique({
        where: { code: vehicleCode },
      })
      if (existingCode) {
        return NextResponse.json(
          { error: `รหัสรถ "${vehicleCode}" มีอยู่ในระบบแล้ว` },
          { status: 400 }
        )
      }
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        code: vehicleCode,
        licensePlate: body.licensePlate.trim(),
        province: body.province?.trim() || 'กรุงเทพมหานคร',
        brand: body.brand.trim(),
        model: body.model.trim(),
        vehicleType: body.vehicleType?.trim() || 'รถกระบะ',
        year: body.year ? parseInt(body.year) : null,
        vin: body.vin?.trim() || null,
        engineNumber: body.engineNumber?.trim() || null,
        department: body.department?.trim() || null,
        responsiblePerson: body.responsiblePerson?.trim() || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        currentMileage: body.currentMileage ? parseFloat(body.currentMileage) : 0,
        mileageDate: new Date(),
        status: body.status || 'active',
        notes: body.notes?.trim() || null,
      },
    })

    // Create initial odometer record if mileage > 0
    if (vehicle.currentMileage > 0) {
      await prisma.odometerReading.create({
        data: {
          vehicleId: vehicle.id,
          reading: vehicle.currentMileage,
          readingDate: new Date(),
          source: 'manual',
          notes: 'เลขไมล์เริ่มต้น ณ วันที่ลงทะเบียน',
        },
      })
    }

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json({ error: 'ไม่สามารถบันทึกข้อมูลรถได้' }, { status: 500 })
  }
}

