import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncJobVehicleMileage } from '@/lib/syncVehicleMileage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await prisma.transportJob.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Transport job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch transport job', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

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

    // Sync vehicle and mileage to Program A (Vehicle table) if company truck
    let linkedVehicleId = body.vehicleId !== undefined ? body.vehicleId : undefined;
    if (!Boolean(body.isSubcontractor)) {
      try {
        const syncedVehicle = await syncJobVehicleMileage({
          jobId: id,
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
        console.error('Failed to sync vehicle mileage on update:', e);
      }
    }

    const updated = await prisma.transportJob.update({
      where: { id },
      data: {
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

    return NextResponse.json({ success: true, job: updated });
  } catch (error: any) {
    console.error('Error updating transport job:', error);
    return NextResponse.json(
      { error: 'Failed to update transport job', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.transportJob.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete transport job', details: error.message },
      { status: 500 }
    );
  }
}

