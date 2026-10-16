const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const defaultFilePath = path.join(process.env.USERPROFILE, 'Downloads', 'N.PSA.2569-09.xlsx');
  const filePath = process.argv[2] || defaultFilePath;

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Starting import from: ${filePath}`);
  const wb = xlsx.readFile(filePath);

  // 1. Prepare Categories
  console.log('Ensuring default categories exist...');
  const categoryKeywords = [
    { name: 'น้ำมันเครื่องและของเหลว', keywords: ['น้ำมัน', 'จารบี', 'หล่อลื่น', 'น้ำยา', 'coolant'] },
    { name: 'ไส้กรอง', keywords: ['กรอง', 'filter'] },
    { name: 'ระบบเบรก', keywords: ['เบรก', 'เบรค', 'ผ้าเบรก', 'จานเบรก', 'โอริ่งเบรค'] },
    { name: 'ยางและช่วงล่าง', keywords: ['ยาง', 'โช้ค', 'แหนบ', 'ลูกหมาก', 'เพลา', 'ลูกปืน', 'ซีล', 'seal', 'oring', 'โอริ่ง'] },
    { name: 'ระบบไฟฟ้าและแบตเตอรี่', keywords: ['แบตเตอรี่', 'ไฟ', 'หลอด', 'ฟิวส์', 'สายไฟ', 'ไดชาร์จ', 'ไดสตาร์ท', 'สวิตช์'] },
    { name: 'เครื่องยนต์และเกียร์', keywords: ['ประเก็น', 'ลูกสูบ', 'วาล์ว', 'คลัตช์', 'คลัทช์', 'สายพาน', 'เทอร์โบ', 'ปั๊ม', 'ปั้ม'] },
    { name: 'อะไหล่ทั่วไป', keywords: [] }
  ];

  const categoryMap = new Map();
  for (const cat of categoryKeywords) {
    let existing = await prisma.partCategory.findUnique({ where: { name: cat.name } });
    if (!existing) {
      existing = await prisma.partCategory.create({
        data: { name: cat.name, description: `หมวดหมู่ ${cat.name}` }
      });
      console.log(`Created category: ${cat.name}`);
    }
    categoryMap.set(cat.name, existing.id);
  }

  // 2. Extract Suppliers, Vehicles, and Units from transaction sheets
  console.log('Scanning transaction sheets (นนทนันทน์, บ.ตั้งไท้เส็ง) for suppliers, vehicles, and units...');
  const suppliersFound = new Set();
  const vehiclesFound = new Map();
  const partUnits = new Map();
  const partSuppliers = new Map();

  ['นนทนันทน์', 'บ.ตั้งไท้เส็ง'].forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return;
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;

      // Vehicle
      const plate = r[5] ? String(r[5]).trim() : '';
      if (plate && !plate.includes('ลาน') && !plate.includes('ซ่อม') && plate.length >= 4) {
        if (!vehiclesFound.has(plate)) {
          vehiclesFound.set(plate, sheetName);
        }
      }

      // Supplier
      const sup = r[10] ? String(r[10]).trim() : '';
      if (sup && sup.length > 1 && !sup.startsWith('=')) {
        suppliersFound.add(sup);
      }

      // Unit & Supplier mapping for part
      const pCode = r[7] ? String(r[7]).trim() : '';
      const pName = r[8] ? String(r[8]).trim() : '';
      const unit = r[19] ? String(r[19]).trim() : '';

      if (unit && unit.length < 20) {
        if (pCode) partUnits.set(pCode, unit);
        if (pName) partUnits.set(pName, unit);
      }
      if (sup && sup.length > 1) {
        if (pCode) partSuppliers.set(pCode, sup);
        if (pName) partSuppliers.set(pName, sup);
      }
    }
  });

  console.log(`Found ${suppliersFound.size} suppliers and ${vehiclesFound.size} vehicles.`);

  // Upsert Suppliers
  const supplierIdMap = new Map();
  for (const supName of suppliersFound) {
    let s = await prisma.supplier.findFirst({ where: { name: supName } });
    if (!s) {
      s = await prisma.supplier.create({
        data: {
          name: supName,
          isActive: true
        }
      });
    }
    supplierIdMap.set(supName, s.id);
  }
  console.log('Suppliers saved to database.');

  // Upsert Vehicles
  let vehicleCount = 0;
  for (const [plate, dept] of vehiclesFound.entries()) {
    let v = await prisma.vehicle.findUnique({ where: { licensePlate: plate } });
    if (!v) {
      // create vehicle
      const code = 'V-' + plate.replace(/\s+/g, '-');
      try {
        await prisma.vehicle.create({
          data: {
            code,
            licensePlate: plate,
            province: 'นครราชสีมา',
            brand: 'ไม่ระบุ',
            model: 'ไม่ระบุ',
            vehicleType: 'รถบรรทุก',
            department: dept,
            status: 'active'
          }
        });
        vehicleCount++;
      } catch (e) {
        // plate or code might conflict
      }
    }
  }
  console.log(`Saved ${vehicleCount} new vehicles to database.`);

  // 3. Process Parts from sheet 'stock-ตั้งไท้เส็ง+นนทนันทน์'
  const stockSheet = wb.Sheets['stock-ตั้งไท้เส็ง+นนทนันทน์'];
  if (!stockSheet) {
    console.error('Sheet "stock-ตั้งไท้เส็ง+นนทนันทน์" not found!');
    return;
  }

  const stockRows = xlsx.utils.sheet_to_json(stockSheet, { header: 1 });
  console.log(`Scanning parts sheet (Total rows: ${stockRows.length})...`);

  function findCategory(name) {
    const lower = name.toLowerCase();
    for (const cat of categoryKeywords) {
      if (cat.keywords.length > 0 && cat.keywords.some(k => lower.includes(k))) {
        return categoryMap.get(cat.name);
      }
    }
    return categoryMap.get('อะไหล่ทั่วไป');
  }

  const usedCodes = new Set();
  const existingParts = await prisma.part.findMany({ select: { code: true } });
  existingParts.forEach(p => usedCodes.add(p.code));

  let importedParts = 0;
  let updatedParts = 0;
  let skippedRows = 0;

  for (let i = 2; i < stockRows.length; i++) {
    const row = stockRows[i];
    if (!row || row.length === 0) {
      skippedRows++;
      continue;
    }

    let code = row[3] !== undefined && row[3] !== null ? String(row[3]).trim() : '';
    let name = row[4] !== undefined && row[4] !== null ? String(row[4]).trim() : '';
    const costPerUnit = typeof row[5] === 'number' ? row[5] : (parseFloat(row[5]) || 0);
    const quantity = typeof row[16] === 'number' ? row[16] : (parseFloat(row[16]) || 0);

    if (!code && !name) {
      skippedRows++;
      continue;
    }

    if (!code && name) {
      code = 'GEN-' + (i + 1);
    }
    if (!name && code) {
      name = 'อะไหล่รหัส ' + code;
    }

    // Handle code duplicates
    let uniqueCode = code;
    let duplicateIndex = 1;
    while (usedCodes.has(uniqueCode)) {
      // Check if existing part has the exact same name
      const existing = await prisma.part.findUnique({ where: { code: uniqueCode } });
      if (existing && existing.name === name) {
        // update quantity & cost
        await prisma.part.update({
          where: { code: uniqueCode },
          data: {
            quantity: Math.max(0, quantity),
            costPerUnit: Math.max(0, costPerUnit)
          }
        });
        updatedParts++;
        uniqueCode = null;
        break;
      } else {
        uniqueCode = `${code}-${duplicateIndex}`;
        duplicateIndex++;
      }
    }

    if (!uniqueCode) continue;

    usedCodes.add(uniqueCode);

    // Determine unit
    const unit = partUnits.get(code) || partUnits.get(name) || 'ชิ้น';

    // Determine supplier
    const supName = partSuppliers.get(code) || partSuppliers.get(name);
    const supplierId = supName && supplierIdMap.has(supName) ? supplierIdMap.get(supName) : null;

    // Determine category
    const categoryId = findCategory(name);

    try {
      await prisma.part.create({
        data: {
          code: uniqueCode,
          name,
          categoryId,
          unit,
          quantity: Math.max(0, quantity),
          minimumStock: 5,
          costPerUnit: Math.max(0, costPerUnit),
          supplierId,
          isActive: true
        }
      });
      importedParts++;
    } catch (err) {
      console.error(`Failed to import part at row ${i} (${uniqueCode}):`, err.message);
    }

    if (importedParts % 500 === 0 && importedParts > 0) {
      console.log(`...imported ${importedParts} parts so far`);
    }
  }

  console.log('\n=========================================');
  console.log('IMPORT COMPLETED SUCCESSFULLY!');
  console.log(`- New parts created: ${importedParts}`);
  console.log(`- Parts updated: ${updatedParts}`);
  console.log(`- Skipped empty rows: ${skippedRows}`);
  console.log(`- Total unique parts in database: ${usedCodes.size}`);
  console.log('=========================================');
}

main()
  .catch(err => {
    console.error('Import failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

