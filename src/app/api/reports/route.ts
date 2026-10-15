import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'vehicles'
    const range = searchParams.get('range') || '1month'

    const now = new Date()
    let startDate: Date

    if (range === '7days') startDate = startOfDay(subDays(now, 7))
    else if (range === '6months') startDate = startOfDay(subMonths(now, 6))
    else if (range === '1year') startDate = startOfDay(subYears(now, 1))
    else startDate = startOfDay(subMonths(now, 1))

    const endDate = endOfDay(now)

    let reportData: any = null

    switch (reportType) {
      // 1. รายงานรถทั้งหมด
      case 'vehicles': {
        const vehicles = await prisma.vehicle.findMany({
          orderBy: { code: 'asc' },
          include: {
            _count: {
              select: { repairOrders: true, partIssues: true },
            },
          },
        })
        reportData = vehicles.map((v) => ({
          รหัสรถ: v.code,
          ทะเบียนรถ: v.licensePlate,
          จังหวัด: v.province,
          ยี่ห้อ: v.brand,
          รุ่น: v.model,
          ประเภท: v.vehicleType,
          แผนก: v.department || '-',
          ผู้ดูแล: v.responsiblePerson || '-',
          เลขไมล์ล่าสุด: v.currentMileage,
          สถานะ: v.status,
          จำนวนครั้งที่ซ่อม: v._count.repairOrders,
        }))
        break
      }

      // 2. รายงานค่าใช้จ่ายรายคัน
      case 'vehicle_costs': {
        const vehicles = await prisma.vehicle.findMany({
          include: {
            repairOrders: {
              where: { orderDate: { gte: startDate, lte: endDate } },
            },
          },
        })
        reportData = vehicles.map((v) => {
          const totalCost = v.repairOrders.reduce((sum, r) => sum + r.totalCost, 0)
          const partsCost = v.repairOrders.reduce((sum, r) => sum + r.partsCost, 0)
          const laborCost = v.repairOrders.reduce((sum, r) => sum + r.laborCost, 0)
          return {
            รหัสรถ: v.code,
            ทะเบียนรถ: v.licensePlate,
            ยี่ห้อ: `${v.brand} ${v.model}`,
            แผนก: v.department || '-',
            จำนวนครั้งซ่อม: v.repairOrders.length,
            ค่าแรงรวม: laborCost,
            ค่าอะไหล่รวม: partsCost,
            ค่าใช้จ่ายรวมทั้งสิ้น: totalCost,
          }
        })
        break
      }

      // 3. รายงานการใช้อะไหล่ตามทะเบียนรถ
      case 'parts_by_vehicle': {
        const issues = await prisma.partIssue.findMany({
          where: { issueDate: { gte: startDate, lte: endDate } },
          include: {
            vehicle: true,
            repairOrder: true,
            items: { include: { part: true } },
          },
        })
        const rows: any[] = []
        issues.forEach((iss) => {
          iss.items.forEach((it) => {
            rows.push({
              เลขที่ใบเบิก: iss.issueNumber,
              วันที่เบิก: iss.issueDate.toISOString().split('T')[0],
              ทะเบียนรถ: iss.vehicle?.licensePlate || '-',
              ยี่ห้อรถ: `${iss.vehicle?.brand || ''} ${iss.vehicle?.model || ''}`,
              ใบงานซ่อม: iss.repairOrder?.orderNumber || '-',
              รหัสอะไหล่: it.part.code,
              ชื่ออะไหล่: it.part.name,
              จำนวน: it.quantity,
              หน่วยนับ: it.part.unit,
              ราคาทุนต่อหน่วย: it.costPerUnit,
              มูลค่ารวม: it.totalCost,
              ผู้เบิก: iss.issuedBy,
            })
          })
        })
        reportData = rows
        break
      }

      // 4. รายงานสต็อกคงเหลือ
      case 'inventory_stock': {
        const parts = await prisma.part.findMany({
          include: { category: true, supplier: true },
          orderBy: { code: 'asc' },
        })
        reportData = parts.map((p) => ({
          รหัสอะไหล่: p.code,
          ชื่ออะไหล่: p.name,
          หมวดหมู่: p.category?.name || '-',
          ยี่ห้อ: p.brand || '-',
          ตำแหน่งเก็บ: p.location || '-',
          ยอดคงเหลือ: p.quantity,
          จุดสั่งซื้อขั้นต่ำ: p.minimumStock,
          หน่วยนับ: p.unit,
          ราคาทุนต่อหน่วย: p.costPerUnit,
          มูลค่าสต็อกรวม: p.quantity * p.costPerUnit,
          สถานะสต็อก:
            p.quantity <= 0
              ? 'หมดสต็อก'
              : p.quantity <= p.minimumStock
              ? 'ใกล้หมด'
              : 'ปกติ',
        }))
        break
      }

      // 5. รายงานรับเข้าและเบิกจ่าย
      case 'stock_movement': {
        const txs = await prisma.inventoryTransaction.findMany({
          where: { transactionDate: { gte: startDate, lte: endDate } },
          include: { part: true },
          orderBy: { transactionDate: 'desc' },
        })
        reportData = txs.map((t) => ({
          วันที่: t.transactionDate.toISOString().split('T')[0],
          ประเภท:
            t.transactionType === 'receive'
              ? 'รับเข้า'
              : t.transactionType === 'issue'
              ? 'เบิกจ่าย'
              : t.transactionType === 'return'
              ? 'คืนอะไหล่'
              : 'ปรับยอด',
          รหัสอะไหล่: t.part.code,
          ชื่ออะไหล่: t.part.name,
          จำนวน: t.quantity,
          ยอดก่อนหน้า: t.previousQty,
          ยอดหลังทำ: t.newQty,
          เลขที่เอกสาร: t.referenceNumber || '-',
          เหตุผล: t.reason || '-',
          ผู้ทำรายการ: t.performedBy || '-',
        }))
        break
      }

      // 6. รายงานอะไหล่ใกล้หมด/หมดสต็อก
      case 'low_stock': {
        const parts = await prisma.part.findMany({
          where: { quantity: { lte: prisma.part.fields.minimumStock as any } },
          include: { category: true },
        })
        reportData = parts
          .filter((p) => p.quantity <= p.minimumStock)
          .map((p) => ({
            รหัสอะไหล่: p.code,
            ชื่ออะไหล่: p.name,
            หมวดหมู่: p.category?.name || '-',
            ตำแหน่งจัดเก็บ: p.location || '-',
            ยอดคงเหลือ: p.quantity,
            จุดสั่งซื้อขั้นต่ำ: p.minimumStock,
            หน่วยนับ: p.unit,
            ขาดอยู่: Math.max(0, p.minimumStock - p.quantity),
            ราคาทุนต่อหน่วย: p.costPerUnit,
            มูลค่าสั่งซื้อขั้นต่ำ:
              Math.max(0, p.minimumStock - p.quantity) * p.costPerUnit,
          }))
        break
      }

      // 7. รายงานรถครบกำหนดบำรุงรักษา
      case 'maintenance_due': {
        const plans = await prisma.maintenancePlan.findMany({
          where: { status: { in: ['upcoming', 'due', 'overdue'] }, isActive: true },
          include: { vehicle: true },
          orderBy: { nextDueDate: 'asc' },
        })
        reportData = plans.map((p) => ({
          ทะเบียนรถ: p.vehicle.licensePlate,
          ยี่ห้อรุ่น: `${p.vehicle.brand} ${p.vehicle.model}`,
          แผนก: p.vehicle.department || '-',
          รายการบำรุงรักษา: p.name,
          เลขไมล์ปัจจุบัน: p.vehicle.currentMileage,
          ครบกำหนดวันที่: p.nextDueDate ? p.nextDueDate.toISOString().split('T')[0] : '-',
          หรือเมื่อถึงไมล์: p.nextDueMileage || '-',
          สถานะ:
            p.status === 'overdue'
              ? 'เกินกำหนด'
              : p.status === 'due'
              ? 'ถึงกำหนดวันนี้'
              : 'ใกล้ครบกำหนด',
        }))
        break
      }

      // 8. รายงานงานซ่อมที่ค้างอยู่
      case 'pending_repairs': {
        const repairs = await prisma.repairOrder.findMany({
          where: { status: { notIn: ['completed', 'delivered', 'cancelled'] } },
          include: { vehicle: true },
          orderBy: { orderDate: 'asc' },
        })
        reportData = repairs.map((r) => ({
          เลขที่ใบงาน: r.orderNumber,
          วันที่เปิดงาน: r.orderDate.toISOString().split('T')[0],
          ทะเบียนรถ: r.vehicle.licensePlate,
          อาการที่แจ้ง: r.reportedSymptoms,
          สถานะงาน: r.status,
          ช่างผู้รับผิดชอบ: r.assignedTo || '-',
          ค่าใช้จ่ายสะสมปัจจุบัน: r.totalCost,
        }))
        break
      }

      default:
        reportData = []
    }

    return NextResponse.json({
      reportType,
      rowCount: reportData?.length || 0,
      data: reportData,
    })
  } catch (error) {
    console.error('Report API Error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงรายงาน' }, { status: 500 })
  }
}

