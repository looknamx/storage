import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'all';
    const month = searchParams.get('month')?.trim() || '';
    const year = searchParams.get('year')?.trim() || '';
    const startStr = searchParams.get('start');
    const endStr = searchParams.get('end');

    let whereClause: any = {};

    if (month && month !== 'all') {
      whereClause.jobMonth = month;
    }
    if (year && year !== 'all') {
      whereClause.jobYear = parseInt(year, 10);
    }

    if (range === 'custom' && startStr && endStr) {
      whereClause.loadingDate = {
        gte: new Date(startStr),
        lte: new Date(endStr),
      };
    } else if (range === '1month' && !month) {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      whereClause.loadingDate = { gte: oneMonthAgo };
    }

    const [jobs, monthsGroup] = await Promise.all([
      prisma.transportJob.findMany({
        where: whereClause,
        orderBy: { itemNo: 'asc' },
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

    // Calculate aggregated metrics
    let totalGrossRevenue = 0;
    let totalWithholdingTax = 0;
    let totalNetRevenue = 0;
    let totalDistanceKm = 0;
    let totalFuelLiters = 0;
    let totalFuelCost = 0;
    let totalTripExpenses = 0;
    let totalNetProfit = 0;

    let totalExpenseLoading = 0;
    let totalExpenseFuelSaving = 0;
    let totalExpenseExtraBonus = 0;
    let totalExpenseAllowance = 0;
    let totalExpenseBackhaul = 0;
    let totalExpenseExpressway = 0;
    let totalExpensePort = 0;
    let totalExpenseDetention = 0;
    let totalExpenseRepair = 0;
    let totalExpenseOther = 0;

    const customerStats: Record<string, { count: number; revenue: number; profit: number }> = {};
    const routeStats: Record<string, { count: number; revenue: number }> = {};
    const vehicleStats: Record<string, { count: number; distance: number; profit: number }> = {};
    const dailyBreakdown: Record<string, { date: string; revenue: number; expense: number; profit: number; trips: number }> = {};

    for (const job of jobs) {
      totalGrossRevenue += job.grossAmount || 0;
      totalWithholdingTax += job.withholdingTax || 0;
      totalNetRevenue += job.netRevenue || 0;
      totalDistanceKm += job.distanceKm || 0;
      totalFuelLiters += job.fuelLiters || 0;
      totalFuelCost += job.fuelCost || 0;
      totalTripExpenses += job.totalExpenses || 0;
      totalNetProfit += job.netProfit || 0;

      totalExpenseLoading += job.expenseLoadingUnloading || 0;
      totalExpenseFuelSaving += job.expenseFuelSavingBonus || 0;
      totalExpenseExtraBonus += job.expenseExtraBonus || 0;
      totalExpenseAllowance += job.expenseAllowance || 0;
      totalExpenseBackhaul += job.expenseBackhaul || 0;
      totalExpenseExpressway += job.expenseExpressway || 0;
      totalExpensePort += job.expensePort || 0;
      totalExpenseDetention += job.expenseDetention || 0;
      totalExpenseRepair += job.expenseRepair || 0;
      totalExpenseOther += job.expenseOther || 0;

      // Customer aggregation
      const cust = job.customerName || 'ไม่ระบุ';
      if (!customerStats[cust]) {
        customerStats[cust] = { count: 0, revenue: 0, profit: 0 };
      }
      customerStats[cust].count += 1;
      customerStats[cust].revenue += job.grossAmount || 0;
      customerStats[cust].profit += job.netProfit || 0;

      // Route aggregation
      const routeKey = `${job.origin || 'ต้นทาง'} ➔ ${job.destination || 'ปลายทาง'}`;
      if (!routeStats[routeKey]) {
        routeStats[routeKey] = { count: 0, revenue: 0 };
      }
      routeStats[routeKey].count += 1;
      routeStats[routeKey].revenue += job.grossAmount || 0;

      // Vehicle aggregation
      const veh = job.licensePlate || 'ไม่ระบุ';
      if (!vehicleStats[veh]) {
        vehicleStats[veh] = { count: 0, distance: 0, profit: 0 };
      }
      vehicleStats[veh].count += 1;
      vehicleStats[veh].distance += job.distanceKm || 0;
      vehicleStats[veh].profit += job.netProfit || 0;

      // Daily breakdown
      if (job.loadingDate) {
        const dStr = job.loadingDate.toISOString().split('T')[0];
        if (!dailyBreakdown[dStr]) {
          dailyBreakdown[dStr] = { date: dStr, revenue: 0, expense: 0, profit: 0, trips: 0 };
        }
        dailyBreakdown[dStr].revenue += job.grossAmount || 0;
        dailyBreakdown[dStr].expense += job.totalExpenses || 0;
        dailyBreakdown[dStr].profit += job.netProfit || 0;
        dailyBreakdown[dStr].trips += 1;
      }
    }

    const avgFuelEfficiency = totalFuelLiters > 0 ? totalDistanceKm / totalFuelLiters : 0;
    const profitMargin = totalGrossRevenue > 0 ? (totalNetProfit / totalGrossRevenue) * 100 : 0;

    // Top customers
    const topCustomers = Object.entries(customerStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 7);

    // Top routes
    const topRoutes = Object.entries(routeStats)
      .map(([route, data]) => ({ route, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    // Top vehicles
    const topVehicles = Object.entries(vehicleStats)
      .map(([plate, data]) => ({ plate, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Chart timeline sorted by date
    const chartData = Object.values(dailyBreakdown).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      availableMonths,
      summary: {
        totalJobs: jobs.length,
        totalGrossRevenue,
        totalWithholdingTax,
        totalNetRevenue,
        totalDistanceKm,
        totalFuelLiters,
        totalFuelCost,
        avgFuelEfficiency: Number(avgFuelEfficiency.toFixed(2)),
        totalExpenses: totalTripExpenses,
        totalNetProfit,
        profitMargin: Number(profitMargin.toFixed(1)),
        expenseLoading: totalExpenseLoading,
        expenseFuelSaving: totalExpenseFuelSaving,
        expenseExtraBonus: totalExpenseExtraBonus,
        expenseAllowance: totalExpenseAllowance,
        expenseBackhaul: totalExpenseBackhaul,
        expenseExpressway: totalExpenseExpressway,
        expensePort: totalExpensePort,
        expenseDetention: totalExpenseDetention,
        expenseRepair: totalExpenseRepair,
        expenseOther: totalExpenseOther,
      },
      chartData,
      topCustomers,
      topRoutes,
      topVehicles,
    });
  } catch (error: any) {
    console.error('Marketing dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketing dashboard data', details: error.message },
      { status: 500 }
    );
  }
}

