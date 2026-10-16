import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.marketingCustomer.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch marketing customers', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const code = body.code?.trim() || `CUST-${Date.now().toString().slice(-4)}`;
    const customer = await prisma.marketingCustomer.create({
      data: {
        code,
        name: body.name.trim(),
        contactInfo: body.contactInfo?.trim() || null,
        address: body.address?.trim() || null,
        phone: body.phone?.trim() || null,
        taxId: body.taxId?.trim() || null,
        notes: body.notes?.trim() || null,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create marketing customer', details: error.message },
      { status: 500 }
    );
  }
}

