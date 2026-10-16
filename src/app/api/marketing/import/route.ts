import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

const THAI_MONTHS = [
  { short: 'ม.ค.', full: 'มกราคม', num: 1 },
  { short: 'ก.พ.', full: 'กุมภาพันธ์', num: 2 },
  { short: 'มี.ค.', full: 'มีนาคม', num: 3 },
  { short: 'เม.ย.', full: 'เมษายน', num: 4 },
  { short: 'พ.ค.', full: 'พฤษภาคม', num: 5 },
  { short: 'มิ.ย.', full: 'มิถุนายน', num: 6 },
  { short: 'ก.ค.', full: 'กรกฎาคม', num: 7 },
  { short: 'ส.ค.', full: 'สิงหาคม', num: 8 },
  { short: 'ก.ย.', full: 'กันยายน', num: 9 },
  { short: 'ต.ค.', full: 'ตุลาคม', num: 10 },
  { short: 'พ.ย.', full: 'พฤศจิกายน', num: 11 },
  { short: 'ธ.ค.', full: 'ธันวาคม', num: 12 },
];

export async function POST(req: NextRequest) {
  try {
    let buffer: Buffer | null = null;
    let fileName = '';
    let specifiedMonth = '';
    let specifiedYear: number | null = null;
    let importMode = 'replace_month'; // 'replace_month' | 'append'

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'ไม่พบไฟล์ที่อัปโหลด' }, { status: 400 });
      }
      fileName = file.name;
      specifiedMonth = (formData.get('month') as string)?.trim() || '';
      const yearStr = (formData.get('year') as string)?.trim();
      if (yearStr) specifiedYear = parseInt(yearStr, 10);
      importMode = (formData.get('mode') as string)?.trim() || 'replace_month';

      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      // JSON or default seed fallback
      let body: any = {};
      try {
        body = await req.json();
      } catch (e) {
        // empty body
      }
      specifiedMonth = body?.month || 'ก.ค.';
      specifiedYear = body?.year ? parseInt(body.year, 10) : 2569;
      importMode = body?.mode || 'replace_month';

      const defaultExcelPath = path.join(process.cwd(), 'data', 'july_2569.xlsx');
      if (fs.existsSync(defaultExcelPath)) {
        buffer = fs.readFileSync(defaultExcelPath);
        fileName = 'july_2569.xlsx';
      } else {
        return NextResponse.json({ error: 'ไม่พบไฟล์ข้อมูลเริ่มต้น' }, { status: 404 });
      }
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: 'ไฟล์ว่างเปล่าหรือไม่ถูกต้อง' }, { status: 400 });
    }

    // Parse workbook
    const wb = XLSX.read(buffer, { type: 'buffer', raw: false });
    const firstSheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[firstSheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'ข้อมูลในไฟล์ไม่เพียงพอ ไม่พบแถวรายการ' }, { status: 400 });
    }

    // 1. Detect Month & Year from Title / Sheet / Filename if not explicitly specified
    let detectedMonth = specifiedMonth;
    let detectedYear = specifiedYear;

    const row0Title = String(rows[0]?.[0] || '');
    const searchString = `${fileName} ${firstSheetName} ${row0Title}`;

    if (!detectedMonth) {
      const foundM = THAI_MONTHS.find(m => searchString.includes(m.full) || searchString.includes(m.short));
      if (foundM) detectedMonth = foundM.short;
    }

    if (!detectedYear) {
      const matchY = searchString.match(/25\d{2}|20\d{2}/);
      if (matchY) {
        const y = parseInt(matchY[0], 10);
        detectedYear = y > 2400 ? y : y + 543;
      }
    }

    // Fallbacks
    if (!detectedMonth) detectedMonth = 'ก.ค.';
    if (!detectedYear) detectedYear = 2569;

    // 2. Detect Header Row
    let headerRowIdx = 1;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const rowStr = (rows[i] || []).join(' ');
      if (rowStr.includes('ทะเบียน') || rowStr.includes('Job Order') || rowStr.includes('ชื่อลูกค้า') || rowStr.includes('ลำดับ')) {
        headerRowIdx = i;
        break;
      }
    }

    const headers: string[] = (rows[headerRowIdx] || []).map(h => String(h || '').trim());

    // Helper to find column index by matching one or more keywords
    const colOf = (...keywords: string[]): number => {
      for (const kw of keywords) {
        const idx = headers.findIndex(h => h.includes(kw));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    // Standard column mappings with fallback to original july indices (0..56)
    const cItemNo = colOf('ลำดับ') !== -1 ? colOf('ลำดับ') : 0;
    const cJobDate = colOf('วดป.รับงาน') !== -1 ? colOf('วดป.รับงาน') : 1;
    const cJobMonth = colOf('เดือนรับงาน') !== -1 ? colOf('เดือนรับงาน') : 2;
    const cLoadingDate = colOf('วันที่รับสินค้า') !== -1 ? colOf('วันที่รับสินค้า') : 3;
    const cLoadingTime = colOf('เวลาขึ้นสินค้า') !== -1 ? colOf('เวลาขึ้นสินค้า') : 4;
    const cDeliveryDate = colOf('วันลงสินค้า') !== -1 ? colOf('วันลงสินค้า') : 5;
    const cDeliveryTime = colOf('เวลาลงของ') !== -1 ? colOf('เวลาลงของ') : 6;
    const cIsApproved = colOf('OK') !== -1 ? colOf('OK') : 7;
    const cBillingDate = colOf('วันที่วางบิล') !== -1 ? colOf('วันที่วางบิล') : 8;
    const cInvoiceNo = colOf('เลขที่วางบิล') !== -1 ? colOf('เลขที่วางบิล') : 9;
    const cJobOrderNo = colOf('Job Order') !== -1 ? colOf('Job Order') : 10;
    const cSubcontractor = colOf('รถร่วม') !== -1 ? colOf('รถร่วม') : 11;
    const cVehicleType = colOf('ประเภทรถ') !== -1 ? colOf('ประเภทรถ') : 12;
    const cLicensePlate = colOf('ทะเบียน') !== -1 ? colOf('ทะเบียน') : 13;
    const cDriverName = colOf('ชื่อ-สกุล', 'คนขับ') !== -1 ? colOf('ชื่อ-สกุล', 'คนขับ') : 14;
    const cPaid = colOf('รับชำระแล้ว') !== -1 ? colOf('รับชำระแล้ว') : 15;
    const cPaidDate = colOf('วันที่รับชำระ') !== -1 ? colOf('วันที่รับชำระ') : 16;
    const cCustomerName = colOf('ชื่อลูกค้า', 'ลูกค้า') !== -1 ? colOf('ชื่อลูกค้า', 'ลูกค้า') : 19;
    const cOrigin = colOf('ต้นทาง') !== -1 ? colOf('ต้นทาง') : 20;
    const cWeightTicketNo = colOf('เลขที่ใบชั่ง', 'ใบชั่ง') !== -1 ? colOf('เลขที่ใบชั่ง', 'ใบชั่ง') : 21;
    const cDestination = colOf('ปลายทาง') !== -1 ? colOf('ปลายทาง') : 22;
    const cDetails = colOf('รายละเอียด') !== -1 ? colOf('รายละเอียด') : 23;
    const cWeightKg = colOf('น้ำหนัก(กก.)', 'น้ำหนัก') !== -1 ? colOf('น้ำหนัก(กก.)', 'น้ำหนัก') : 24;
    const cRatePerTon = colOf('ราคาต่อตัน') !== -1 ? colOf('ราคาต่อตัน') : 25;
    const cGrossAmount = colOf('จำนวนเงิน(น้ำหนัก/เหมา)', 'จำนวนเงิน') !== -1 ? colOf('จำนวนเงิน(น้ำหนัก/เหมา)', 'จำนวนเงิน') : 26;
    const cWithholdingTax = colOf('หัก ณ ที่จ่าย 1%', 'หัก ณ ที่จ่าย') !== -1 ? colOf('หัก ณ ที่จ่าย 1%', 'หัก ณ ที่จ่าย') : 27;
    const cNetRevenue = colOf('จำนวนเงินสุทธิ') !== -1 ? colOf('จำนวนเงินสุทธิ') : 33;
    const cOdometerStart = colOf('เลขไมท์ก่อนไป', 'ไมล์ก่อน') !== -1 ? colOf('เลขไมท์ก่อนไป', 'ไมล์ก่อน') : 37;
    const cOdometerEnd = colOf('เลขไมท์กลับมา', 'ไมล์กลับ') !== -1 ? colOf('เลขไมท์กลับมา', 'ไมล์กลับ') : 38;
    const cDistanceKm = colOf('กม. ที่ใช้ไป', 'ระยะทาง') !== -1 ? colOf('กม. ที่ใช้ไป', 'ระยะทาง') : 39;
    const cFuelLiters = colOf('เติมน้ำมัน(ลิตร)', 'เติมน้ำมัน') !== -1 ? colOf('เติมน้ำมัน(ลิตร)', 'เติมน้ำมัน') : 40;
    const cFuelEfficiency = colOf('กม./ลิตร') !== -1 ? colOf('กม./ลิตร') : 41;
    const cFuelPricePerLiter = colOf('ราคาต่อลิตร') !== -1 ? colOf('ราคาต่อลิตร') : 42;
    const cFuelCost = colOf('ค่าน้ำมันรถ', 'ค่าน้ำมัน') !== -1 ? colOf('ค่าน้ำมันรถ', 'ค่าน้ำมัน') : 43;
    const cExpenseLoading = colOf('ขึ้น ลง') !== -1 ? colOf('ขึ้น ลง') : 44;
    const cExpenseFuelSaving = colOf('พิเศษ(เซฟน้ำมัน)', 'เซฟน้ำมัน') !== -1 ? colOf('พิเศษ(เซฟน้ำมัน)', 'เซฟน้ำมัน') : 45;
    const cExpenseExtraBonus = colOf('พิเศษ+เพิ่ม') !== -1 ? colOf('พิเศษ+เพิ่ม') : 46;
    const cExpenseAllowance = colOf('เบี้ยเลี้ยง') !== -1 ? colOf('เบี้ยเลี้ยง') : 47;
    const cExpenseBackhaul = colOf('ของกลับ') !== -1 ? colOf('ของกลับ') : 48;
    const cExpenseExpressway = colOf('ทางด่วน') !== -1 ? colOf('ทางด่วน') : 49;
    const cExpensePort = colOf('ค่าท่า') !== -1 ? colOf('ค่าท่า') : 50;
    const cExpenseDetention = colOf('ตกค้าง') !== -1 ? colOf('ตกค้าง') : 51;
    const cExpenseRepair = colOf('ค่าซ่อม') !== -1 ? colOf('ค่าซ่อม') : 52;
    const cExpenseOther = colOf('อื่นๆ') !== -1 ? colOf('อื่นๆ') : 53;
    const cTotalExpenses = colOf('รวม ค่าใช้จ่าย', 'รวมค่าใช้จ่าย') !== -1 ? colOf('รวม ค่าใช้จ่าย', 'รวมค่าใช้จ่าย') : 54;
    const cNetProfit = colOf('คงเหลือสุทธิต่องาน', 'คงเหลือสุทธิ', 'กำไร') !== -1 ? colOf('คงเหลือสุทธิต่องาน', 'คงเหลือสุทธิ', 'กำไร') : 55;
    const cNotes = colOf('หมายเหตุ') !== -1 ? colOf('หมายเหตุ') : 56;

    // Helper functions for parsing
    const parseDate = (val: any) => {
      if (!val) return null;
      if (val instanceof Date) return val;
      const s = String(val).trim();
      // Formats: M/D/YY or M/D/YYYY or D/M/YYYY
      if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(s)) {
        const [m, d, y] = s.split('/').map(Number);
        return new Date(2500 + y - 543, m - 1, d, 12, 0, 0);
      }
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
        const [d, m, y] = s.split('/').map(Number);
        const ceYear = y > 2400 ? y - 543 : y;
        return new Date(ceYear, m - 1, d, 12, 0, 0);
      }
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        return new Date(s);
      }
      return null;
    };

    const parseN = (val: any) => {
      if (!val) return 0;
      const n = parseFloat(String(val).replace(/,/g, '').trim());
      return isNaN(n) ? 0 : n;
    };

    // 3. Upsert Customers
    const customerDbMap = new Map<string, string>();
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const cName = (r[cCustomerName] || '').toString().trim();
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

    // 4. Delete existing jobs for this month & year ONLY if replace_month mode
    if (importMode === 'replace_month' && detectedMonth && detectedYear) {
      await prisma.transportJob.deleteMany({
        where: {
          jobMonth: detectedMonth,
          jobYear: detectedYear,
        },
      });
    }

    // 5. Parse Data Rows
    const jobsToCreate = [];
    let totalGross = 0;
    let totalProfit = 0;

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;

      const rawItem = r[cItemNo];
      const itemNo = parseInt(String(rawItem), 10);
      if (isNaN(itemNo)) continue;

      const licensePlate = (r[cLicensePlate] || '').toString().trim();
      const driverName = (r[cDriverName] || '').toString().trim();
      const customerName = (r[cCustomerName] || '').toString().trim();
      const customerId = customerDbMap.get(customerName) || null;

      const grossAmount = parseN(r[cGrossAmount]);
      const netProfit = parseN(r[cNetProfit]);
      totalGross += grossAmount;
      totalProfit += netProfit;

      const rowMonth = (r[cJobMonth] || '').toString().trim() || detectedMonth;

      jobsToCreate.push({
        itemNo,
        jobMonth: rowMonth,
        jobYear: detectedYear,
        jobDate: parseDate(r[cJobDate]),
        loadingDate: parseDate(r[cLoadingDate]),
        loadingTime: (r[cLoadingTime] || '').toString().trim() || null,
        deliveryDate: parseDate(r[cDeliveryDate]),
        deliveryTime: (r[cDeliveryTime] || '').toString().trim() || null,
        isApproved: (r[cIsApproved] || '').toString().trim().toUpperCase() === 'OK',
        billingDate: parseDate(r[cBillingDate]),
        invoiceNo: (r[cInvoiceNo] || '').toString().trim() || null,
        jobOrderNo: (r[cJobOrderNo] || '').toString().trim() || null,
        isPaid: (r[cPaid] || '').toString().trim().toLowerCase().includes('ใช่') || (r[cPaid] || '').toString().trim().toUpperCase() === 'OK',
        paymentDate: parseDate(r[cPaidDate]),
        isSubcontractor: !!(r[cSubcontractor] || '').toString().trim(),
        vehicleType: (r[cVehicleType] || '').toString().trim() || 'รถพ่วง/เทรลเลอร์',
        licensePlate: licensePlate || 'ไม่ระบุ',
        driverName: driverName || 'ไม่ระบุ',
        customerId,
        customerName: customerName || 'ไม่ระบุ',
        origin: (r[cOrigin] || '').toString().trim() || 'ไม่ระบุ',
        weightTicketNo: (r[cWeightTicketNo] || '').toString().trim() || null,
        destination: (r[cDestination] || '').toString().trim() || 'ไม่ระบุ',
        details: (r[cDetails] || '').toString().trim() || null,
        weightKg: parseN(r[cWeightKg]),
        rateType: (r[cRatePerTon] || '').toString().trim() === 'เหมา' ? 'lump_sum' : 'per_ton',
        ratePerTon: parseN(r[cRatePerTon]),
        grossAmount,
        withholdingTax: parseN(r[cWithholdingTax]),
        netRevenue: parseN(r[cNetRevenue]) || grossAmount,
        odometerStart: parseN(r[cOdometerStart]),
        odometerEnd: parseN(r[cOdometerEnd]),
        distanceKm: parseN(r[cDistanceKm]),
        fuelLiters: parseN(r[cFuelLiters]),
        fuelEfficiency: parseN(r[cFuelEfficiency]),
        fuelPricePerLiter: parseN(r[cFuelPricePerLiter]),
        fuelCost: parseN(r[cFuelCost]),
        expenseLoadingUnloading: parseN(r[cExpenseLoading]),
        expenseFuelSavingBonus: parseN(r[cExpenseFuelSaving]),
        expenseExtraBonus: parseN(r[cExpenseExtraBonus]),
        expenseAllowance: parseN(r[cExpenseAllowance]),
        expenseBackhaul: parseN(r[cExpenseBackhaul]),
        expenseExpressway: parseN(r[cExpenseExpressway]),
        expensePort: parseN(r[cExpensePort]),
        expenseDetention: parseN(r[cExpenseDetention]),
        expenseRepair: parseN(r[cExpenseRepair]),
        expenseOther: parseN(r[cExpenseOther]),
        totalExpenses: parseN(r[cTotalExpenses]),
        netProfit,
        notes: (r[cNotes] || '').toString().trim() || null,
      });
    }

    // 6. Batch Insert
    const chunkSize = 100;
    for (let i = 0; i < jobsToCreate.length; i += chunkSize) {
      const chunk = jobsToCreate.slice(i, i + chunkSize);
      await prisma.transportJob.createMany({ data: chunk });
    }

    return NextResponse.json({
      success: true,
      count: jobsToCreate.length,
      jobMonth: detectedMonth,
      jobYear: detectedYear,
      mode: importMode,
      totalGross,
      totalProfit,
      customersCount: customerDbMap.size,
      fileName,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล', details: error.message },
      { status: 500 }
    );
  }
}
