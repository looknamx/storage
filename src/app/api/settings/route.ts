import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.appSetting.findMany({
      orderBy: { group: 'asc' },
    })
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลการตั้งค่าได้' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // settings array: [{ key, value, label, group }]
    for (const item of body) {
      await prisma.appSetting.upsert({
        where: { key: item.key },
        update: { value: String(item.value) },
        create: {
          key: item.key,
          value: String(item.value),
          label: item.label || item.key,
          group: item.group || 'general',
        },
      })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ error: 'ไม่สามารถบันทึกการตั้งค่าได้' }, { status: 500 })
  }
}

