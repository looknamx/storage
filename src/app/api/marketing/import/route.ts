import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const excelPath = path.join(process.cwd(), 'data', 'july_2569.xlsx');
    if (!fs.existsSync(excelPath)) {
      return NextResponse.json({ error: 'Data file july_2569.xlsx not found' }, { status: 404 });
    }

    const wb = XLSX.readFile(excelPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

    // 1. Gather all unique customers
    const customerDbMap = new Map<string, string>();
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      const itemNo = parseInt(r[0], 10);
      if (isNaN(itemNo)) continue;
      const cName = (r[19] || '').trim();
      if (cName && !customerDbMap.has(cName)) {
        const cust = await prisma.marketingCustomer.upsert({
          where: { name: cName },
          update: {},
          create: {
            code: `CUST-${customerDbMap.size + 1}`,
            name: cName,
            isActive: true,
          },
        });
        customerDbMap.set(cName, cust.id);
      }
    }

    // 2. Clear existing jobs to prevent duplicate seed
    await prisma.transportJob.deleteMany({});

    // 3. Prepare jobs
    const jobsToCreate = [];
    let totalGross = 0;

    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      const itemNo = parseInt(r[0], 10);
      if (isNaN(itemNo)) continue;

      const licensePlate = (r[13] || '').trim();
      const driverName = (r[14] || '').trim();
      const customerName = (r[19] || '').trim();
      const customerId = customerDbMap.get(customerName) || null;

      const parseDate = (val: string) => {
        if (!val || typeof val !== 'string') return null;
        const s = val.trim();
        if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(s)) {
          const [m, d, y] = s.split('/').map(Number);
          return new Date(2500 + y - 543, m - 1, d, 12, 0, 0);
        }
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
          const [d, m, y] = s.split('/').map(Number);
          return new Date(y > 2400 ? y - 543 : y, m - 1, d, 12, 0, 0);
        }
        return null;
      };

      const parseN = (val: any) => {
        if (!val) return 0;
        const n = parseFloat(String(val).replace(/,/g, '').trim());
        return isNaN(n) ? 0 : n;
      };

      const grossAmount = parseN(r[26]);
      totalGross += grossAmount;

      jobsToCreate.push({
        itemNo,
        jobMonth: 'ก.ค.',
        jobYear: 2569,
        loadingDate: parseDate(r[3]),
        deliveryDate: parseDate(r[5]),
        isApproved: (r[7] || '').trim().toUpperCase() === 'OK',
        billingDate: parseDate(r[8]),
        invoiceNo: (r[9] || '').trim() || null,
        jobOrderNo: (r[10] || '').trim() || null,
        isPaid: false,
        isSubcontractor: !!(r[11] || '').trim(),
        vehicleType: (r[12] || '').trim() || 'รถพ่วง/เทรลเลอร์',
        licensePlate: licensePlate || 'ไม่ระบุ',
        driverName: driverName || 'ไม่ระบุ',
        customerId,
        customerName: customerName || 'ไม่ระบุ',
        origin: (r[20] || '').trim() || 'ไม่ระบุ',
        weightTicketNo: (r[21] || '').trim() || null,
        destination: (r[22] || '').trim() || 'ไม่ระบุ',
        details: (r[23] || '').trim() || null,
        weightKg: parseN(r[24]),
        rateType: (r[25] || '').trim() === 'เหมา' ? 'lump_sum' : 'per_ton',
        ratePerTon: parseN(r[25]),
        grossAmount,
        withholdingTax: parseN(r[27]),
        netRevenue: parseN(r[33]) || grossAmount,
        odometerStart: parseN(r[37]),
        odometerEnd: parseN(r[38]),
        distanceKm: parseN(r[39]),
        fuelLiters: parseN(r[40]),
        fuelEfficiency: parseN(r[41]),
        fuelPricePerLiter: parseN(r[42]),
        fuelCost: parseN(r[43]),
        expenseLoadingUnloading: parseN(r[44]),
        expenseFuelSavingBonus: parseN(r[45]),
        expenseExtraBonus: parseN(r[46]),
        expenseAllowance: parseN(r[47]),
        expenseBackhaul: parseN(r[48]),
        expenseExpressway: parseN(r[49]),
        expensePort: parseN(r[50]),
        expenseDetention: parseN(r[51]),
        expenseRepair: parseN(r[52]),
        expenseOther: parseN(r[53]),
        totalExpenses: parseN(r[54]),
        netProfit: parseN(r[55]),
        notes: (r[56] || r[36] || '').trim() || null,
      });
    }

    // Insert in chunks
    const chunkSize = 100;
    for (let i = 0; i < jobsToCreate.length; i += chunkSize) {
      const chunk = jobsToCreate.slice(i, i + chunkSize);
      await prisma.transportJob.createMany({ data: chunk });
    }

    return NextResponse.json({
      success: true,
      count: jobsToCreate.length,
      totalGross,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import data', details: error.message },
      { status: 500 }
    );
  }
}

