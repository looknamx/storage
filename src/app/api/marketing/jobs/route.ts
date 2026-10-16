import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncJobVehicleMileage } from '@/lib/syncVehicleMileage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const customer = searchParams.get('customer')?.trim() || '';
    const month = searchParams.get('month')?.trim() || '';
    const year = searchParams.get('year')?.trim() || '';
    const isSubcontractor = searchParams.get('isSubcontractor');
    const isPaid = searchParams.get('isPaid');
    const invoiceNo = searchParams.get('invoiceNo')?.trim() || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { driverName: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { weightTicketNo: { contains: search, mode: 'insensitive' } },
        { invoiceNo: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
        { origin: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (customer) {
      where.customerName = { contains: customer, mode: 'insensitive' };
    }

    if (month && month !== 'all') {
      where.jobMonth = month;
    }

    if (year && year !== 'all') {
      where.jobYear = parseInt(year, 10);
    }

    if (invoiceNo) {
      where.invoiceNo = { contains: invoiceNo, mode: 'insensitive' };
    }

    if (isSubcontractor !== null && isSubcontractor !== undefined && isSubcontractor !== '') {
      where.isSubcontractor = isSubcontractor === 'true';
    }

    if (isPaid !== null && isPaid !== undefined && isPaid !== '') {
      where.isPaid = isPaid === 'true';
    }

    const [total, jobs, aggregations, monthsGroup] = await Promise.all([
      prisma.transportJob.count({ where }),
      prisma.transportJob.findMany({
        where,
        orderBy: [{ itemNo: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.transportJob.aggregate({
        where,
        _sum: {
          grossAmount: true,
          withholdingTax: true,
          netRevenue: true,
          fuelCost: true,
          totalExpenses: true,
          netProfit: true,
          distanceKm: true,
          fuelLiters: true,
        },
      }),
      prisma.transportJob.groupBy({
        by: ['jobYear', 'jobMonth'],
        _count: { id: true },
        orderBy: [
          { jobYear: 'desc' },
          { jobMonth: 'desc' },
        ],
      }),
    ]);

    const availableMonths = monthsGroup.map((g) => ({
      year: g.jobYear || 2569,
      month: g.jobMonth || '',
      count: g._count.id,
    }));

    return NextResponse.json({
      jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      availableMonths,
      aggregations: {
        totalGross: aggregations._sum.grossAmount || 0,
        totalWht: aggregations._sum.withholdingTax || 0,
        totalNetRevenue: aggregations._sum.netRevenue || 0,
        totalFuelCost: aggregations._sum.fuelCost || 0,
        totalExpenses: aggregations._sum.totalExpenses || 0,
        totalNetProfit: aggregations._sum.netProfit || 0,
        totalDistance: aggregations._sum.distanceKm || 0,
        totalFuelLiters: aggregations._sum.fuelLiters || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching transport jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transport jobs', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Auto-compute derived fields if needed
    const weightKg = Number(body.weightKg) || 0;
    const ratePerTon = Number(body.ratePerTon) || 0;
    const rateType = body.rateType || 'per_ton';
    let grossAmount = Number(body.grossAmount) || 0;

    if (grossAmount === 0 && rateType === 'per_ton' && weightKg > 0 && ratePerTon > 0) {
      grossAmount = weightKg * ratePerTon;
    }

    const isTaxExempt = body.isTaxExempt === true || body.withholdingTax === 0;
    const withholdingTax = isTaxExempt ? 0 : (Number(body.withholdingTax) || grossAmount * 0.01);
    const netRevenue = Number(body.netRevenue) || (grossAmount - withholdingTax);

    // Mileage & fuel
    const odometerStart = Number(body.odometerStart) || 0;
    const odometerEnd = Number(body.odometerEnd) || 0;
    let distanceKm = Number(body.distanceKm) || 0;
    if (distanceKm === 0 && odometerEnd > odometerStart) {
      distanceKm = odometerEnd - odometerStart;
    }

    const fuelLiters = Number(body.fuelLiters) || 0;
    const fuelEfficiency = Number(body.fuelEfficiency) || (fuelLiters > 0 ? distanceKm / fuelLiters : 0);
    const fuelPricePerLiter = Number(body.fuelPricePerLiter) || 0;
    const fuelCost = Number(body.fuelCost) || (fuelLiters * fuelPricePerLiter);

    // Expenses
    const expenseLoadingUnloading = Number(body.expenseLoadingUnloading) || 0;
    const expenseFuelSavingBonus = Number(body.expenseFuelSavingBonus) || 0;
    const expenseExtraBonus = Number(body.expenseExtraBonus) || 0;
    const expenseAllowance = Number(body.expenseAllowance) || 0;
    const expenseBackhaul = Number(body.expenseBackhaul) || 0;
    const expenseExpressway = Number(body.expenseExpressway) || 0;
    const expensePort = Number(body.expensePort) || 0;
    const expenseDetention = Number(body.expenseDetention) || 0;
    const expenseRepair = Number(body.expenseRepair) || 0;
    const expenseOther = Number(body.expenseOther) || 0;

    const totalExpenses = Number(body.totalExpenses) || (
      fuelCost +
      expenseLoadingUnloading +
      expenseFuelSavingBonus +
      expenseExtraBonus +
      expenseAllowance +
      expenseBackhaul +
      expenseExpressway +
      expensePort +
      expenseDetention +
      expenseRepair +
      expenseOther
    );

    const netProfit = Number(body.netProfit) || (netRevenue - totalExpenses);

    // Determine max itemNo
    const maxItemJob = await prisma.transportJob.findFirst({
      orderBy: { itemNo: 'desc' },
      select: { itemNo: true },
    });
    const itemNo = (maxItemJob?.itemNo || 0) + 1;

    // Connect or find customer if exists
    let customerId = body.customerId || null;
    if (!customerId && body.customerName) {
      const existingCust = await prisma.marketingCustomer.findFirst({
        where: { name: body.customerName.trim() },
      });
      if (existingCust) {
        customerId = existingCust.id;
      }
    }

    // Sync vehicle and mileage to Program A (Vehicle table) if company truck
    let linkedVehicleId = body.vehicleId || null;
    if (!Boolean(body.isSubcontractor)) {
      try {
        const syncedVehicle = await syncJobVehicleMileage({
          jobNo: itemNo,
          licensePlate: body.licensePlate?.trim() || '',
          vehicleId: body.vehicleId || null,
          driverName: body.driverName?.trim() || null,
          vehicleType: body.vehicleType || null,
          odometerEnd,
          date: body.deliveryDate ? new Date(body.deliveryDate) : new Date(),
          origin: body.origin?.trim() || null,
          destination: body.destination?.trim() || null,
          isSubcontractor: false,
        });
        if (syncedVehicle) {
          linkedVehicleId = syncedVehicle.id;
        }
      } catch (e) {
        console.error('Failed to sync vehicle mileage:', e);
      }
    }

    const newJob = await prisma.transportJob.create({
      data: {
        itemNo,
        jobDate: body.jobDate ? new Date(body.jobDate) : new Date(),
        jobMonth: body.jobMonth || 'ก.ค.',
        jobYear: body.jobYear || 2569,
        loadingDate: body.loadingDate ? new Date(body.loadingDate) : null,
        loadingTime: body.loadingTime || null,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        deliveryTime: body.deliveryTime || null,
        isApproved: Boolean(body.isApproved),
        billingDate: body.billingDate ? new Date(body.billingDate) : null,
        invoiceNo: body.invoiceNo || null,
        jobOrderNo: body.jobOrderNo || null,
        isPaid: Boolean(body.isPaid),
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
        isSubcontractor: Boolean(body.isSubcontractor),
        vehicleType: body.vehicleType || 'รถพ่วง/เทรลเลอร์',
        licensePlate: body.licensePlate?.trim() || 'ไม่ระบุ',
        driverName: body.driverName?.trim() || 'ไม่ระบุ',
        vehicleId: linkedVehicleId,
        customerId,
        customerName: body.customerName?.trim() || 'ไม่ระบุ',
        origin: body.origin?.trim() || 'ไม่ระบุ',
        weightTicketNo: body.weightTicketNo?.trim() || null,
        destination: body.destination?.trim() || 'ไม่ระบุ',
        details: body.details?.trim() || null,
        weightKg,
        rateType,
        ratePerTon,
        grossAmount,
        withholdingTax,
        netRevenue,
        odometerStart,
        odometerEnd,
        distanceKm,
        fuelLiters,
        fuelEfficiency,
        fuelPricePerLiter,
        fuelCost,
        expenseLoadingUnloading,
        expenseFuelSavingBonus,
        expenseExtraBonus,
        expenseAllowance,
        expenseBackhaul,
        expenseExpressway,
        expensePort,
        expenseDetention,
        expenseRepair,
        expenseOther,
        totalExpenses,
        netProfit,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, job: newJob }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transport job:', error);
    return NextResponse.json(
      { error: 'Failed to create transport job', details: error.message },
      { status: 500 }
    );
  }
}

