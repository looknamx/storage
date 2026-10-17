import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'transport_jobs';
    const period = searchParams.get('period') || 'month'; // '7days', 'month', 'year', 'custom', 'all'
    const monthParam = searchParams.get('month') || '';
    const yearParam = searchParams.get('year') || '';
    const customStart = searchParams.get('startDate') || '';
    const customEnd = searchParams.get('endDate') || '';

    // 1. Determine available months and years from transportJob
    const monthsGroup = await prisma.transportJob.groupBy({
      by: ['jobMonth', 'jobYear'],
      _count: { id: true },
      orderBy: [{ jobYear: 'desc' }, { jobMonth: 'desc' }],
    });

    const availableMonths = monthsGroup.map((g) => ({
      month: g.jobMonth || '',
      year: g.jobYear || 2569,
      count: g._count.id,
    }));
    const availableYears = Array.from(new Set(availableMonths.map((m) => m.year))).sort((a, b) => b - a);

    const activeMonth = monthParam || (availableMonths[0]?.month || 'ก.ค.');
    const activeYear = yearParam ? parseInt(yearParam, 10) : (availableYears[0] || 2569);

    // 2. Build where filter for TransportJob
    const where: any = {};

    if (period === '7days') {
      const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
      where.OR = [
        { loadingDate: { gte: sevenDaysAgo } },
        { billingDate: { gte: sevenDaysAgo } },
      ];
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
    } else if (period === 'custom' && customStart && customEnd) {
      const start = startOfDay(new Date(customStart));
      const end = endOfDay(new Date(customEnd));
      where.OR = [
        { loadingDate: { gte: start, lte: end } },
        { billingDate: { gte: start, lte: end } },
      ];
    }
    // period === 'all' -> no date filter

    const getFuelCost = (j: any): number => {
      if (j.fuelCost && j.fuelCost > 0) return j.fuelCost;
      if (j.subcontractorFuelCost && j.subcontractorFuelCost > 0) return j.subcontractorFuelCost;
      if (j.fuelLiters && j.fuelPricePerLiter && j.fuelLiters > 0 && j.fuelPricePerLiter > 0) {
        return Number((j.fuelLiters * j.fuelPricePerLiter).toFixed(2));
      }
      return 0;
    };

    let reportData: any[] = [];

    switch (reportType) {
      // 1. รายงานเที่ยววิ่งขนส่งสินค้าทั้งหมด
      case 'transport_jobs': {
        const jobs = await prisma.transportJob.findMany({
          where,
          orderBy: [{ jobDate: 'desc' }, { itemNo: 'asc' }],
        });

        reportData = jobs.map((j) => ({
          ลำดับ: j.itemNo || '-',
          วันที่รับของ: j.loadingDate ? j.loadingDate.toISOString().split('T')[0] : '-',
          ทะเบียนรถ: j.licensePlate,
          ประเภทรถ: j.isSubcontractor ? 'รถร่วม' : 'รถบริษัท',
          พนักงานขับรถ: j.driverName,
          ลูกค้า: j.customerName,
          ต้นทาง: j.origin,
          ปลายทาง: j.destination,
          เลขที่ใบชั่ง: j.weightTicketNo || '-',
          'น้ำหนัก (ตัน)': j.weightKg ? (j.weightKg / 1000).toFixed(2) : '0',
          รายรับสุทธิ: j.netRevenue,
          ค่าน้ำมัน: getFuelCost(j),
          ค่าใช้จ่ายคนขับ: j.totalExpenses,
          คงเหลือสุทธิ: j.netProfit,
          เลขที่ใบวางบิล: j.invoiceNo || '-',
          สถานะรับเงิน: j.isPaid ? 'รับชำระแล้ว' : 'รอชำระเงิน',
        }));
        break;
      }

      // 2. รายงานสรุปผลการดำเนินงานและกำไร-ขาดทุน (P&L)
      case 'pl_summary': {
        // Group by month and year
        const jobs = await prisma.transportJob.findMany({
          where,
          orderBy: [{ jobYear: 'desc' }, { jobMonth: 'desc' }],
        });

        const monthGroups: Record<string, any> = {};
        for (const j of jobs) {
          const key = `${j.jobMonth || 'ทั่วไป'} ${j.jobYear || ''}`.trim();
          if (!monthGroups[key]) {
            monthGroups[key] = {
              ช่วงเดือน: key,
              จำนวนเที่ยว: 0,
              'น้ำหนักรวม (ตัน)': 0,
              รายรับรวม: 0,
              'ภาษีหัก ณ ที่จ่าย 1%': 0,
              รายรับสุทธิ: 0,
              ค่าน้ำมันรวม: 0,
              ค่าใช้จ่ายรวม: 0,
              กำไรสุทธิรวม: 0,
            };
          }
          monthGroups[key].จำนวนเที่ยว += 1;
          monthGroups[key]['น้ำหนักรวม (ตัน)'] += (j.weightKg || 0) / 1000;
          monthGroups[key].รายรับรวม += j.grossAmount || 0;
          monthGroups[key]['ภาษีหัก ณ ที่จ่าย 1%'] += j.withholdingTax || 0;
          monthGroups[key].รายรับสุทธิ += j.netRevenue || 0;
          monthGroups[key].ค่าน้ำมันรวม += getFuelCost(j);
          monthGroups[key].ค่าใช้จ่ายรวม += j.totalExpenses || 0;
          monthGroups[key].กำไรสุทธิรวม += j.netProfit || 0;
        }

        reportData = Object.values(monthGroups).map((m: any) => ({
          ...m,
          'น้ำหนักรวม (ตัน)': Number(m['น้ำหนักรวม (ตัน)'].toFixed(2)),
          'อัตรากำไร (%)': m.รายรับสุทธิ > 0 ? Number(((m.กำไรสุทธิรวม / m.รายรับสุทธิ) * 100).toFixed(1)) : 0,
        }));
        break;
      }

      // 3. รายงานการวางบิลและติดตามการรับชำระเงิน (AR)
      case 'billing_status': {
        const jobs = await prisma.transportJob.findMany({
          where: {
            ...where,
            invoiceNo: { not: null, notIn: ['', '-'] },
          },
          orderBy: { billingDate: 'desc' },
        });

        const invoiceGroups: Record<string, any> = {};
        for (const j of jobs) {
          const inv = j.invoiceNo!;
          if (!invoiceGroups[inv]) {
            invoiceGroups[inv] = {
              เลขที่ใบวางบิล: inv,
              วันที่วางบิล: j.billingDate ? j.billingDate.toISOString().split('T')[0] : '-',
              ลูกค้าหลัก: j.customerName,
              จำนวนเที่ยววิ่ง: 0,
              ยอดเงินรวม: 0,
              'หัก ณ ที่จ่าย 1%': 0,
              ยอดรับเงินสุทธิ: 0,
              สถานะรับชำระ: j.isPaid ? 'รับชำระแล้ว' : 'รอชำระเงิน',
              วันที่รับชำระ: j.paymentDate ? j.paymentDate.toISOString().split('T')[0] : '-',
            };
          }
          invoiceGroups[inv].จำนวนเที่ยววิ่ง += 1;
          invoiceGroups[inv].ยอดเงินรวม += j.grossAmount || 0;
          invoiceGroups[inv]['หัก ณ ที่จ่าย 1%'] += j.withholdingTax || 0;
          invoiceGroups[inv].ยอดรับเงินสุทธิ += j.netRevenue || 0;
          if (j.isPaid) {
            invoiceGroups[inv].สถานะรับชำระ = 'รับชำระแล้ว';
            invoiceGroups[inv].วันที่รับชำระ = j.paymentDate ? j.paymentDate.toISOString().split('T')[0] : invoiceGroups[inv].วันที่รับชำระ;
          }
        }

        reportData = Object.values(invoiceGroups);
        break;
      }

      // 4. รายงานยอดขนส่งและรายได้แยกตามลูกค้า
      case 'customer_summary': {
        const jobs = await prisma.transportJob.findMany({
          where,
        });

        const custMap: Record<string, any> = {};
        for (const j of jobs) {
          const cust = j.customerName || 'ไม่ระบุ';
          if (!custMap[cust]) {
            custMap[cust] = {
              ชื่อลูกค้า: cust,
              จำนวนเที่ยววิ่ง: 0,
              'น้ำหนักรวม (ตัน)': 0,
              ยอดเงินรวม: 0,
              'ภาษีหัก ณ ที่จ่าย': 0,
              ยอดรับสุทธิ: 0,
              ค่าน้ำมันรวม: 0,
              กำไรสุทธิ: 0,
            };
          }
          custMap[cust].จำนวนเที่ยววิ่ง += 1;
          custMap[cust]['น้ำหนักรวม (ตัน)'] += (j.weightKg || 0) / 1000;
          custMap[cust].ยอดเงินรวม += j.grossAmount || 0;
          custMap[cust]['ภาษีหัก ณ ที่จ่าย'] += j.withholdingTax || 0;
          custMap[cust].ยอดรับสุทธิ += j.netRevenue || 0;
          custMap[cust].ค่าน้ำมันรวม += getFuelCost(j);
          custMap[cust].กำไรสุทธิ += j.netProfit || 0;
        }

        reportData = Object.values(custMap)
          .map((c: any) => ({
            ...c,
            'น้ำหนักรวม (ตัน)': Number(c['น้ำหนักรวม (ตัน)'].toFixed(2)),
          }))
          .sort((a, b) => b.ยอดรับสุทธิ - a.ยอดรับสุทธิ);
        break;
      }

      // 5. รายงานการใช้น้ำมันและระยะทางรายคัน
      case 'fuel_efficiency': {
        const jobs = await prisma.transportJob.findMany({
          where,
        });

        const vehicleMap: Record<string, any> = {};
        for (const j of jobs) {
          const plate = j.licensePlate;
          if (!vehicleMap[plate]) {
            vehicleMap[plate] = {
              ทะเบียนรถ: plate,
              ประเภทรถ: j.isSubcontractor ? 'รถร่วม' : 'รถบริษัท',
              พนักงานขับรถ: j.driverName,
              จำนวนเที่ยว: 0,
              'ระยะทางรวม (กม.)': 0,
              'น้ำมันรวม (ลิตร)': 0,
              ค่าน้ำมันรวม: 0,
            };
          }
          vehicleMap[plate].จำนวนเที่ยว += 1;
          vehicleMap[plate]['ระยะทางรวม (กม.)'] += j.distanceKm || 0;
          vehicleMap[plate]['น้ำมันรวม (ลิตร)'] += j.fuelLiters || 0;
          vehicleMap[plate].ค่าน้ำมันรวม += getFuelCost(j);
        }

        reportData = Object.values(vehicleMap).map((v: any) => {
          const distance = v['ระยะทางรวม (กม.)'];
          const liters = v['น้ำมันรวม (ลิตร)'];
          const kmPerLiter = liters > 0 ? (distance / liters).toFixed(2) : '-';
          const costPerKm = distance > 0 ? (v.ค่าน้ำมันรวม / distance).toFixed(2) : '-';
          return {
            ...v,
            'อัตราสิ้นเปลือง (กม./ลิตร)': kmPerLiter,
            'ต้นทุนน้ำมัน (บาท/กม.)': costPerKm,
          };
        }).sort((a, b) => b.จำนวนเที่ยว - a.จำนวนเที่ยว);
        break;
      }

      // 6. รายงานงานจ้างรถร่วม (Subcontractors)
      case 'subcontractor_jobs': {
        const jobs = await prisma.transportJob.findMany({
          where: {
            ...where,
            isSubcontractor: true,
          },
          orderBy: [{ jobDate: 'desc' }, { itemNo: 'asc' }],
        });

        reportData = jobs.map((j) => ({
          ลำดับ: j.itemNo || '-',
          วันที่รับของ: j.loadingDate ? j.loadingDate.toISOString().split('T')[0] : '-',
          ทะเบียนรถร่วม: j.licensePlate,
          พนักงานขับรถ: j.driverName,
          ลูกค้า: j.customerName,
          ปลายทาง: j.destination,
          'น้ำหนัก (ตัน)': j.weightKg ? (j.weightKg / 1000).toFixed(2) : '0',
          ค่าจ้างรถร่วม: j.subcontractorRate || 0,
          ค่านายหน้า: j.commission || 0,
          ค่าน้ำมันรถร่วม: j.subcontractorFuelCost || 0,
          ยอดสุทธิรถร่วม: j.subcontractorNet || 0,
          สถานะจ่ายเงิน: j.isSubcontractorPaid ? 'จ่ายเงินแล้ว' : 'รอจ่ายเงิน',
          วันที่จ่ายเงิน: j.subcontractorPaidDate ? j.subcontractorPaidDate.toISOString().split('T')[0] : '-',
        }));
        break;
      }

      // 7. รายงานผลงานพนักงานขับรถ
      case 'driver_performance': {
        const jobs = await prisma.transportJob.findMany({
          where,
        });

        const driverMap: Record<string, any> = {};
        for (const j of jobs) {
          const d = j.driverName || 'ไม่ระบุ';
          if (!driverMap[d]) {
            driverMap[d] = {
              ชื่อพนักงานขับรถ: d,
              ทะเบียนรถหลัก: j.licensePlate,
              ประเภท: j.isSubcontractor ? 'รถร่วม' : 'รถบริษัท',
              จำนวนเที่ยววิ่ง: 0,
              'น้ำหนักรวม (ตัน)': 0,
              'ระยะทางรวม (กม.)': 0,
              เบี้ยเลี้ยงและค่าเที่ยวรวม: 0,
              ค่าน้ำมันที่ใช้: 0,
            };
          }
          driverMap[d].จำนวนเที่ยววิ่ง += 1;
          driverMap[d]['น้ำหนักรวม (ตัน)'] += (j.weightKg || 0) / 1000;
          driverMap[d]['ระยะทางรวม (กม.)'] += j.distanceKm || 0;
          driverMap[d].เบี้ยเลี้ยงและค่าเที่ยวรวม += (j.expenseAllowance || 0) + (j.expenseLoadingUnloading || 0);
          driverMap[d].ค่าน้ำมันที่ใช้ += getFuelCost(j);
        }

        reportData = Object.values(driverMap)
          .map((d: any) => ({
            ...d,
            'น้ำหนักรวม (ตัน)': Number(d['น้ำหนักรวม (ตัน)'].toFixed(2)),
          }))
          .sort((a, b) => b.จำนวนเที่ยววิ่ง - a.จำนวนเที่ยววิ่ง);
        break;
      }

      // 8. รายงานใบวางบิลค้างชำระเงิน (Overdue / Unpaid AR)
      case 'unpaid_invoices': {
        const jobs = await prisma.transportJob.findMany({
          where: {
            ...where,
            invoiceNo: { not: null, notIn: ['', '-'] },
            isPaid: false,
          },
          orderBy: { billingDate: 'asc' },
        });

        const invoiceMap: Record<string, any> = {};
        for (const j of jobs) {
          const inv = j.invoiceNo!;
          if (!invoiceMap[inv]) {
            invoiceMap[inv] = {
              เลขที่ใบวางบิล: inv,
              วันที่วางบิล: j.billingDate ? j.billingDate.toISOString().split('T')[0] : '-',
              ลูกค้า: j.customerName,
              จำนวนเที่ยว: 0,
              ยอดเงินรวม: 0,
              'ภาษีหัก ณ ที่จ่าย': 0,
              'ยอดค้างชำระ (Net AR)': 0,
              สถานะ: 'รอชำระเงิน',
            };
          }
          invoiceMap[inv].จำนวนเที่ยว += 1;
          invoiceMap[inv].ยอดเงินรวม += j.grossAmount || 0;
          invoiceMap[inv]['ภาษีหัก ณ ที่จ่าย'] += j.withholdingTax || 0;
          invoiceMap[inv]['ยอดค้างชำระ (Net AR)'] += j.netRevenue || 0;
        }

        reportData = Object.values(invoiceMap);
        break;
      }

      default:
        reportData = [];
    }

    return NextResponse.json({
      reportType,
      period,
      availableMonths,
      availableYears,
      activeMonth,
      activeYear,
      rowCount: reportData?.length || 0,
      data: reportData,
    });
  } catch (error: any) {
    console.error('Marketing Report API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketing report data', details: error.message },
      { status: 500 }
    );
  }
}

