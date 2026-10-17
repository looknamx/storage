import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.trim() || 'all'; // 'all' | 'paid' | 'unpaid'
    const period = searchParams.get('period')?.trim() || 'month'; // 'month' | '7days' | 'year' | 'all'
    const requestedMonth = searchParams.get('month')?.trim() || '';
    const requestedYear = searchParams.get('year')?.trim() || '';
    const sortBy = searchParams.get('sortBy')?.trim() || 'billingDate';
    const sortOrder = searchParams.get('sortOrder')?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    // 1. Fetch available months and years for invoices
    const monthsGroup = await prisma.transportJob.groupBy({
      by: ['jobMonth', 'jobYear'],
      where: {
        invoiceNo: { not: null, notIn: ['', '-'] },
      },
      _count: { id: true },
    });

    const monthList = Array.from(new Set(monthsGroup.map((g) => g.jobMonth).filter(Boolean))) as string[];
    const availableYears = Array.from(new Set(monthsGroup.map((g) => g.jobYear || 2569))).sort((a, b) => b - a);

    // Default month/year if not specified and period is month or year
    const activeMonth = requestedMonth || (monthList[0] || 'ก.ค.');
    const activeYear = requestedYear ? parseInt(requestedYear, 10) : (availableYears[0] || 2569);

    // 2. Build where filter for TransportJob
    const where: any = {
      invoiceNo: { not: null, notIn: ['', '-'] },
    };

    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { invoiceNo: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (status === 'paid') {
      where.isPaid = true;
    } else if (status === 'unpaid') {
      where.isPaid = false;
    }

    // Date / Period Filter
    if (period === '7days') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      andConditions.push({
        OR: [
          { billingDate: { gte: sevenDaysAgo } },
          { loadingDate: { gte: sevenDaysAgo } },
        ],
      });
    } else if (period === 'month') {
      if (activeMonth && activeMonth !== 'all') {
        where.jobMonth = activeMonth;
      }
      if (activeYear) {
        where.jobYear = activeYear;
      }
    } else if (period === 'year') {
      if (activeYear) {
        where.jobYear = activeYear;
      }
    }
    // if period === 'all', no date filters are applied (ยกมาแสดงทั้งหมด)

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // 3. Query jobs matching filter
    const jobs = await prisma.transportJob.findMany({
      where,
      orderBy: { billingDate: 'desc' },
    });

    // 4. Group jobs by invoiceNo
    const invoiceGroups: Record<string, any> = {};

    for (const job of jobs) {
      const inv = job.invoiceNo!;
      if (!invoiceGroups[inv]) {
        invoiceGroups[inv] = {
          invoiceNo: inv,
          billingDate: job.billingDate,
          customerName: job.customerName,
          jobMonth: job.jobMonth,
          jobYear: job.jobYear,
          jobsCount: 0,
          totalGross: 0,
          totalWht: 0,
          totalNetRevenue: 0,
          isPaid: job.isPaid,
          paymentDate: job.paymentDate,
          paymentMethod: job.paymentMethod || null,
          paymentNote: job.paymentNote || null,
        };
      }
      invoiceGroups[inv].jobsCount += 1;
      invoiceGroups[inv].totalGross += job.grossAmount || 0;
      invoiceGroups[inv].totalWht += job.withholdingTax || 0;
      invoiceGroups[inv].totalNetRevenue += job.netRevenue || 0;
      if (job.isPaid) {
        invoiceGroups[inv].isPaid = true;
        invoiceGroups[inv].paymentDate = job.paymentDate;
        if (job.paymentMethod) invoiceGroups[inv].paymentMethod = job.paymentMethod;
        if (job.paymentNote) invoiceGroups[inv].paymentNote = job.paymentNote;
      }
    }

    let invoices = Object.values(invoiceGroups);

    // 5. Dynamic Sorting
    invoices.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'billingDate') {
        const timeA = a.billingDate ? new Date(a.billingDate).getTime() : 0;
        const timeB = b.billingDate ? new Date(b.billingDate).getTime() : 0;
        comparison = timeA - timeB;
      } else if (sortBy === 'jobsCount') {
        comparison = (a.jobsCount || 0) - (b.jobsCount || 0);
      } else if (sortBy === 'totalGross') {
        comparison = (a.totalGross || 0) - (b.totalGross || 0);
      } else if (sortBy === 'totalWht') {
        comparison = (a.totalWht || 0) - (b.totalWht || 0);
      } else if (sortBy === 'totalNetRevenue') {
        comparison = (a.totalNetRevenue || 0) - (b.totalNetRevenue || 0);
      } else if (sortBy === 'customerName') {
        comparison = (a.customerName || '').localeCompare(b.customerName || '', 'th');
      } else if (sortBy === 'invoiceNo') {
        comparison = (a.invoiceNo || '').localeCompare(b.invoiceNo || '');
      } else if (sortBy === 'isPaid') {
        comparison = (a.isPaid ? 1 : 0) - (b.isPaid ? 1 : 0);
      } else {
        comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const totalGrossAll = invoices.reduce((acc, curr) => acc + (curr.totalGross || 0), 0);
    const totalWhtAll = invoices.reduce((acc, curr) => acc + (curr.totalWht || 0), 0);
    const totalNetAll = invoices.reduce((acc, curr) => acc + (curr.totalNetRevenue || 0), 0);
    const paidInvoices = invoices.filter((i) => i.isPaid).length;
    const unpaidInvoices = invoices.filter((i) => !i.isPaid).length;
    const paidAmount = invoices.filter((i) => i.isPaid).reduce((acc, curr) => acc + (curr.totalNetRevenue || 0), 0);
    const unpaidAmount = invoices.filter((i) => !i.isPaid).reduce((acc, curr) => acc + (curr.totalNetRevenue || 0), 0);

    const summary = {
      totalGross: totalGrossAll,
      totalWht: totalWhtAll,
      totalNet: totalNetAll,
      totalGrossAll,
      totalWhtAll,
      totalNetAll,
      totalInvoices: invoices.length,
      paidInvoices,
      unpaidInvoices,
      paidCount: paidInvoices,
      unpaidCount: unpaidInvoices,
      paidAmount,
      unpaidAmount,
    };

    return NextResponse.json({
      invoices,
      availableMonths: monthList,
      availableYears,
      activeMonth,
      activeYear,
      summary,
    });
  } catch (error: any) {
    console.error('Error fetching billing data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing data', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { invoiceNo, isPaid, paymentDate, paymentMethod, paymentNote } = await req.json();
    if (!invoiceNo) {
      return NextResponse.json({ error: 'Invoice number is required' }, { status: 400 });
    }

    const trimmedInvoice = String(invoiceNo).trim();

    const updated = await prisma.transportJob.updateMany({
      where: {
        OR: [
          { invoiceNo: trimmedInvoice },
          { invoiceNo: { equals: trimmedInvoice, mode: 'insensitive' } },
        ],
      },
      data: {
        isPaid: Boolean(isPaid),
        paymentDate: isPaid && paymentDate ? new Date(paymentDate) : isPaid ? new Date() : null,
        paymentMethod: isPaid ? (paymentMethod ? String(paymentMethod).trim() : null) : null,
        paymentNote: isPaid ? (paymentNote ? String(paymentNote).trim() : null) : null,
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
