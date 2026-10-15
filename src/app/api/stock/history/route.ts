import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const partId = searchParams.get('partId') || ''
    const transactionType = searchParams.get('type') || '' // receive, issue, return, adjust
    const search = searchParams.get('search') || ''
    const range = searchParams.get('range') || ''

    const where: any = {}

    if (partId) {
      where.partId = partId
    }

    if (transactionType) {
      where.transactionType = transactionType
    }

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search } },
        { reason: { contains: search } },
        { performedBy: { contains: search } },
        { part: { name: { contains: search } } },
        { part: { code: { contains: search } } },
      ]
    }

    if (range) {
      const now = new Date()
      let startDate: Date
      if (range === '7days') startDate = startOfDay(subDays(now, 7))
      else if (range === '6months') startDate = startOfDay(subMonths(now, 6))
      else if (range === '1year') startDate = startOfDay(subYears(now, 1))
      else startDate = startOfDay(subMonths(now, 1))

      where.transactionDate = { gte: startDate, lte: endOfDay(now) }
    }

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      include: {
        part: true,
      },
      take: 100,
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching inventory history:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลประวัติสต็อกได้' }, { status: 500 })
  }
}

