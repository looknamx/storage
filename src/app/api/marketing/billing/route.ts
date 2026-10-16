import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';

    // Group jobs by invoiceNo
    const jobs = await prisma.transportJob.findMany({
      where: {
        invoiceNo: { not: null, notIn: ['', '-'] },
        ...(search ? { invoiceNo: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { billingDate: 'desc' },
    });

    const invoiceGroups: Record<string, any> = {};

    for (const job of jobs) {
      const inv = job.invoiceNo!;
      if (!invoiceGroups[inv]) {
        invoiceGroups[inv] = {
          invoiceNo: inv,
          billingDate: job.billingDate,
          customerName: job.customerName,
          jobsCount: 0,
          totalGross: 0,
          totalWht: 0,
          totalNetRevenue: 0,
          isPaid: job.isPaid,
          paymentDate: job.paymentDate,
        };
      }
      invoiceGroups[inv].jobsCount += 1;
      invoiceGroups[inv].totalGross += job.grossAmount || 0;
      invoiceGroups[inv].totalWht += job.withholdingTax || 0;
      invoiceGroups[inv].totalNetRevenue += job.netRevenue || 0;
      if (job.isPaid) {
        invoiceGroups[inv].isPaid = true;
        invoiceGroups[inv].paymentDate = job.paymentDate;
      }
    }

    const invoices = Object.values(invoiceGroups).sort((a, b) => {
      if (a.billingDate && b.billingDate) {
        return new Date(b.billingDate).getTime() - new Date(a.billingDate).getTime();
      }
      return b.invoiceNo.localeCompare(a.invoiceNo);
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch billing data', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { invoiceNo, isPaid, paymentDate } = await req.json();
    if (!invoiceNo) {
      return NextResponse.json({ error: 'Invoice number is required' }, { status: 400 });
    }

    const updated = await prisma.transportJob.updateMany({
      where: { invoiceNo },
      data: {
        isPaid: Boolean(isPaid),
        paymentDate: isPaid && paymentDate ? new Date(paymentDate) : (isPaid ? new Date() : null),
      },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update invoice payment status', details: error.message },
      { status: 500 }
    );
  }
}

