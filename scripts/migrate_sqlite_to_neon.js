const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const dumpFile = path.join(__dirname, '..', 'temp_sqlite_dump.json');
  if (!fs.existsSync(dumpFile)) {
    console.error('temp_sqlite_dump.json not found!');
    process.exit(1);
  }

  console.log('Loading dump file:', dumpFile);
  const dump = JSON.parse(fs.readFileSync(dumpFile, 'utf8'));

  // 1. Categories
  if (dump.partCategory && dump.partCategory.length > 0) {
    console.log(`Migrating ${dump.partCategory.length} categories...`);
    for (const c of dump.partCategory) {
      await prisma.partCategory.upsert({
        where: { id: c.id },
        update: { name: c.name, description: c.description },
        create: {
          id: c.id,
          name: c.name,
          description: c.description,
          createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
        },
      });
    }
    console.log('Categories migrated.');
  }

  // 2. Suppliers
  if (dump.supplier && dump.supplier.length > 0) {
    console.log(`Migrating ${dump.supplier.length} suppliers...`);
    // Insert in batches of 50
    for (let i = 0; i < dump.supplier.length; i += 50) {
      const batch = dump.supplier.slice(i, i + 50);
      for (const s of batch) {
        await prisma.supplier.upsert({
          where: { id: s.id },
          update: {
            name: s.name,
            contactInfo: s.contactInfo,
            address: s.address,
            phone: s.phone,
            email: s.email,
            notes: s.notes,
            isActive: s.isActive ?? true,
          },
          create: {
            id: s.id,
            name: s.name,
            contactInfo: s.contactInfo,
            address: s.address,
            phone: s.phone,
            email: s.email,
            notes: s.notes,
            isActive: s.isActive ?? true,
            createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
            updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined,
          },
        });
      }
    }
    console.log('Suppliers migrated.');
  }

  // 3. Vehicles
  if (dump.vehicle && dump.vehicle.length > 0) {
    console.log(`Migrating ${dump.vehicle.length} vehicles...`);
    for (let i = 0; i < dump.vehicle.length; i += 50) {
      const batch = dump.vehicle.slice(i, i + 50);
      for (const v of batch) {
        await prisma.vehicle.upsert({
          where: { licensePlate: v.licensePlate },
          update: {
            code: v.code,
            province: v.province,
            brand: v.brand,
            model: v.model,
            vehicleType: v.vehicleType,
            year: v.year,
            vin: v.vin,
            engineNumber: v.engineNumber,
            department: v.department,
            responsiblePerson: v.responsiblePerson,
            currentMileage: v.currentMileage || 0,
            status: v.status || 'active',
            notes: v.notes,
          },
          create: {
            id: v.id,
            code: v.code,
            licensePlate: v.licensePlate,
            province: v.province,
            brand: v.brand,
            model: v.model,
            vehicleType: v.vehicleType,
            year: v.year,
            vin: v.vin,
            engineNumber: v.engineNumber,
            department: v.department,
            responsiblePerson: v.responsiblePerson,
            startDate: v.startDate ? new Date(v.startDate) : undefined,
            currentMileage: v.currentMileage || 0,
            mileageDate: v.mileageDate ? new Date(v.mileageDate) : undefined,
            status: v.status || 'active',
            notes: v.notes,
            createdAt: v.createdAt ? new Date(v.createdAt) : undefined,
            updatedAt: v.updatedAt ? new Date(v.updatedAt) : undefined,
          },
        });
      }
    }
    console.log('Vehicles migrated.');
  }

  // 4. Parts
  if (dump.part && dump.part.length > 0) {
    console.log(`Migrating ${dump.part.length} parts...`);
    let partCount = 0;
    const batchSize = 100;
    for (let i = 0; i < dump.part.length; i += batchSize) {
      const batch = dump.part.slice(i, i + batchSize);
      for (const p of batch) {
        await prisma.part.upsert({
          where: { code: p.code },
          update: {
            name: p.name,
            categoryId: p.categoryId,
            brand: p.brand,
            compatibleModels: p.compatibleModels,
            unit: p.unit || 'ชิ้น',
            quantity: p.quantity || 0,
            minimumStock: p.minimumStock || 0,
            costPerUnit: p.costPerUnit || 0,
            location: p.location,
            supplierId: p.supplierId,
            description: p.description,
            notes: p.notes,
            isActive: p.isActive ?? true,
          },
          create: {
            id: p.id,
            code: p.code,
            name: p.name,
            categoryId: p.categoryId,
            brand: p.brand,
            compatibleModels: p.compatibleModels,
            unit: p.unit || 'ชิ้น',
            quantity: p.quantity || 0,
            minimumStock: p.minimumStock || 0,
            costPerUnit: p.costPerUnit || 0,
            location: p.location,
            supplierId: p.supplierId,
            description: p.description,
            notes: p.notes,
            isActive: p.isActive ?? true,
            createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
          },
        });
        partCount++;
      }
      if (partCount % 500 === 0 || partCount === dump.part.length) {
        console.log(`...migrated ${partCount} / ${dump.part.length} parts`);
      }
    }
    console.log('Parts migrated.');
  }

  // 5. AppSettings
  if (dump.appSetting && dump.appSetting.length > 0) {
    console.log(`Migrating ${dump.appSetting.length} app settings...`);
    for (const a of dump.appSetting) {
      await prisma.appSetting.upsert({
        where: { key: a.key },
        update: { value: a.value, label: a.label, group: a.group },
        create: {
          id: a.id,
          key: a.key,
          value: a.value,
          label: a.label,
          group: a.group,
        },
      });
    }
    console.log('App settings migrated.');
  }

  console.log('\n=========================================');
  console.log('MIGRATION TO NEON COMPLETED SUCCESSFULLY!');
  console.log('=========================================');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

