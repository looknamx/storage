import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลแจ้งเตือนได้' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id } = await request.json()
    if (id) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      })
    } else {
      await prisma.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตแจ้งเตือนได้' }, { status: 500 })
  }
}

