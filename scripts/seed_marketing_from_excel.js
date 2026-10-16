const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

function parseThaiOrIsoDate(val) {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed === '-' || trimmed === '0') return null;

  // Format: 7/1/69 (m/d/yy in BE)
  if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    let year = 2500 + parseInt(parts[2], 10) - 543; // BE to CE
    const d = new Date(year, month, day, 12, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  // Format: 4/8/2569 (d/m/yyyy in BE)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year > 2400) year -= 543;
    const d = new Date(year, month, day, 12, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  // Format: 2569-07-01
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split('-');
    let year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (year > 2400) year -= 543;
    const d = new Date(year, month, day, 12, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function parseNum(val, def = 0) {
  if (val === null || val === undefined) return def;
  let s = String(val).replace(/[,฿\s]/g, '').trim();
  if (!s || s === '-') return def;
  if (s.startsWith('(') && s.endsWith(')')) {
    s = '-' + s.slice(1, -1).trim();
  }
  const n = parseFloat(s);
  return isNaN(n) ? def : n;
}

async function main() {
  console.log('--- Starting Marketing & Transport Logistics Seed ---');
  const wb = XLSX.readFile('data/july_2569.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

  // 1. Gather all unique customers
  const customerMap = new Map();
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    const itemNo = parseInt(r[0], 10);
    if (isNaN(itemNo)) continue;
    const cName = (r[19] || '').trim();
    if (cName && !customerMap.has(cName)) {
      customerMap.set(cName, true);
    }
  }

  console.log(`Found ${customerMap.size} unique customers. Upserting...`);
  const customerDbMap = new Map();
  let cIdx = 1;
  for (const cName of customerMap.keys()) {
    const code = `CUST-${String(cIdx++).padStart(3, '0')}`;
    const cust = await prisma.marketingCustomer.upsert({
      where: { name: cName },
      update: {},
      create: {
        code,
        name: cName,
        isActive: true,
      },
    });
    customerDbMap.set(cName, cust.id);
  }

  // 2. Clear existing transport jobs to avoid duplicates during initial seed
  const existingCount = await prisma.transportJob.count();
  if (existingCount > 0) {
    console.log(`Clearing ${existingCount} existing jobs...`);
    await prisma.transportJob.deleteMany({});
  }

  // 3. Insert all 539 jobs in batch
  const jobsToCreate = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    const itemNo = parseInt(r[0], 10);
    if (isNaN(itemNo)) continue;

    const licensePlate = (r[13] || '').trim();
    const driverName = (r[14] || '').trim();
    const customerName = (r[19] || '').trim();
    const customerId = customerDbMap.get(customerName) || null;

    const loadingDate = parseThaiOrIsoDate(r[3]);
    const deliveryDate = parseThaiOrIsoDate(r[5]);
    const billingDate = parseThaiOrIsoDate(r[8]);
    const invoiceNo = (r[9] || '').trim();
    const jobOrderNo = (r[10] || '').trim();
    const isApproved = (r[7] || '').trim().toUpperCase() === 'OK';

    const origin = (r[20] || '').trim();
    const weightTicketNo = (r[21] || '').trim();
    const destination = (r[22] || '').trim();
    const details = (r[23] || '').trim();

    const weightKg = parseNum(r[24]);
    const rateRaw = (r[25] || '').trim();
    const rateType = rateRaw === 'เหมา' ? 'lump_sum' : 'per_ton';
    const ratePerTon = parseNum(rateRaw);
    const grossAmount = parseNum(r[26]);
    const withholdingTax = parseNum(r[27]);
    const netRevenue = parseNum(r[33]) || (grossAmount - withholdingTax);

    // Subcontractor fields
    const isSubcontractor = !!(r[11] || '').trim();
    const subcontractorRate = parseNum(r[28]);
    const commission = parseNum(r[29]);
    const subcontractorDiff = parseNum(r[30]);
    const subcontractorFuelCost = parseNum(r[31]);
    const subcontractorWht = parseNum(r[32]);
    const subcontractorNet = parseNum(r[33]);
    const subcontractorFuelLiters = parseNum(r[34]);
    const subcontractorFuelPrice = parseNum(r[35]);

    // Odometer & Fuel
    const odometerStart = parseNum(r[37]);
    const odometerEnd = parseNum(r[38]);
    const distanceKm = parseNum(r[39]) || (odometerEnd > odometerStart ? odometerEnd - odometerStart : 0);
    const fuelLiters = parseNum(r[40]);
    const fuelEfficiency = parseNum(r[41]) || (fuelLiters > 0 ? distanceKm / fuelLiters : 0);
    const fuelPricePerLiter = parseNum(r[42]);
    const fuelCost = parseNum(r[43]) || (fuelLiters * fuelPricePerLiter);

    // Expenses
    const expenseLoadingUnloading = parseNum(r[44]);
    const expenseFuelSavingBonus = parseNum(r[45]);
    const expenseExtraBonus = parseNum(r[46]);
    const expenseAllowance = parseNum(r[47]);
    const expenseBackhaul = parseNum(r[48]);
    const expenseExpressway = parseNum(r[49]);
    const expensePort = parseNum(r[50]);
    const expenseDetention = parseNum(r[51]);
    const expenseRepair = parseNum(r[52]);
    const expenseOther = parseNum(r[53]);

    const totalExpenses = parseNum(r[54]) || (
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

    const netProfit = parseNum(r[55]) !== 0
      ? parseNum(r[55])
      : (netRevenue - totalExpenses);

    const notes = (r[56] || r[36] || '').trim();

    jobsToCreate.push({
      itemNo,
      jobMonth: 'ก.ค.',
      jobYear: 2569,
      loadingDate,
      deliveryDate,
      isApproved,
      billingDate,
      invoiceNo,
      jobOrderNo,
      isPaid: false,
      isSubcontractor,
      vehicleType: (r[12] || '').trim() || 'รถพ่วง/เทรลเลอร์',
      licensePlate: licensePlate || 'ไม่ระบุ',
      driverName: driverName || 'ไม่ระบุ',
      customerId,
      customerName: customerName || 'ไม่ระบุ',
      origin,
      weightTicketNo,
      destination,
      details,
      weightKg,
      rateType,
      ratePerTon,
      grossAmount,
      withholdingTax,
      netRevenue,
      subcontractorRate,
      commission,
      subcontractorDiff,
      subcontractorFuelCost,
      subcontractorWht,
      subcontractorNet,
      subcontractorFuelLiters,
      subcontractorFuelPrice,
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
      notes,
    });
  }

  console.log(`Inserting ${jobsToCreate.length} transport jobs into PostgreSQL...`);
  // Insert in chunks of 100 for optimal performance
  const chunkSize = 100;
  for (let i = 0; i < jobsToCreate.length; i += chunkSize) {
    const chunk = jobsToCreate.slice(i, i + chunkSize);
    await prisma.transportJob.createMany({
      data: chunk,
    });
    console.log(`Inserted chunk ${i + 1} to ${Math.min(i + chunkSize, jobsToCreate.length)}`);
  }

  const finalCount = await prisma.transportJob.count();
  console.log(`=== Done! Successfully seeded ${finalCount} transport jobs into database ===`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

