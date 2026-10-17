import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding initial data...')

  // 1. Categories
  const catOil = await prisma.partCategory.upsert({
    where: { name: 'น้ำมันเครื่องและของเหลว' },
    update: {},
    create: {
      name: 'น้ำมันเครื่องและของเหลว',
      description: 'น้ำมันเครื่อง น้ำมันเบรก น้ำยาหล่อเย็น ฯลฯ',
    },
  })

  const catFilter = await prisma.partCategory.upsert({
    where: { name: 'ไส้กรอง' },
    update: {},
    create: {
      name: 'ไส้กรอง',
      description: 'กรองอากาศ กรองน้ำมันเครื่อง กรองแอร์',
    },
  })

  const catBrake = await prisma.partCategory.upsert({
    where: { name: 'ระบบเบรก' },
    update: {},
    create: {
      name: 'ระบบเบรก',
      description: 'ผ้าเบรก จานเบรก สายเบรก',
    },
  })

  const catTire = await prisma.partCategory.upsert({
    where: { name: 'ยางและช่วงล่าง' },
    update: {},
    create: {
      name: 'ยางและช่วงล่าง',
      description: 'ยางรถยนต์ โช้คอัพ ลูกหมาก',
    },
  })

  // 2. Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'บริษัท สยามออโต้พาร์ท จำกัด',
      phone: '02-123-4567',
      contactInfo: 'คุณสมชาย',
      address: 'กรุงเทพฯ',
    },
  })

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'ห้างหุ้นส่วน ปิโตรเลียมเซอร์วิส',
      phone: '02-987-6543',
      contactInfo: 'คุณวิภา',
      address: 'สมุทรปราการ',
    },
  })

  // 3. Parts
  const partOil5W30 = await prisma.part.create({
    data: {
      code: 'OIL-5W30-4L',
      name: 'น้ำมันเครื่องสังเคราะห์แท้ 5W-30 (แกลลอน 4L)',
      categoryId: catOil.id,
      brand: 'Castrol',
      unit: 'แกลลอน',
      quantity: 12,
      minimumStock: 5,
      costPerUnit: 1250,
      location: 'ชั้น A1-01',
      supplierId: supplier2.id,
      compatibleModels: 'Toyota Hilux Revo, Isuzu D-Max, Fortuner',
    },
  })

  const partFilterOil = await prisma.part.create({
    data: {
      code: 'FLT-OIL-TOY',
      name: 'ไส้กรองน้ำมันเครื่อง Toyota แท้',
      categoryId: catFilter.id,
      brand: 'Toyota',
      unit: 'ลูก',
      quantity: 8,
      minimumStock: 4,
      costPerUnit: 220,
      location: 'ชั้น B2-05',
      supplierId: supplier1.id,
      compatibleModels: 'Toyota Hilux Revo, Fortuner, Commuter',
    },
  })

  const partBrakeFront = await prisma.part.create({
    data: {
      code: 'BRK-PAD-F-REVO',
      name: 'ผ้าดิสเบรกหน้า Revo/Fortuner',
      categoryId: catBrake.id,
      brand: 'Compact Brakes',
      unit: 'ชุด',
      quantity: 2,
      minimumStock: 3, // Low stock!
      costPerUnit: 950,
      location: 'ชั้น C1-02',
      supplierId: supplier1.id,
      compatibleModels: 'Toyota Hilux Revo 4WD, Fortuner',
    },
  })

  const partCoolant = await prisma.part.create({
    data: {
      code: 'LQD-COOL-4L',
      name: 'น้ำยาหล่อเย็นหม้อน้ำ Super Coolant 4L',
      categoryId: catOil.id,
      brand: 'Toyota',
      unit: 'แกลลอน',
      quantity: 0, // Out of stock!
      minimumStock: 2,
      costPerUnit: 480,
      location: 'ชั้น A2-03',
      supplierId: supplier2.id,
      compatibleModels: 'Toyota ทุกรุ่น',
    },
  })

  // 4. Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      code: 'V-001',
      licensePlate: '1ฒผ 4589',
      province: 'กรุงเทพมหานคร',
      brand: 'Toyota',
      model: 'Hilux Revo Double Cab 2.4 Prerunner',
      vehicleType: 'กระบะ 4 ประตู',
      year: 2022,
      department: 'ฝ่ายขายและการตลาด',
      responsiblePerson: 'นายกิตติคุณ มั่นใจ',
      startDate: new Date('2022-03-15'),
      currentMileage: 48500,
      mileageDate: new Date('2026-10-10'),
      status: 'active',
      notes: 'รถสภาพดี ใช้งานในกรุงเทพฯ และปริมณฑล',
    },
  })

  const vehicle2 = await prisma.vehicle.create({
    data: {
      code: 'V-002',
      licensePlate: '3ขษ 9821',
      province: 'กรุงเทพมหานคร',
      brand: 'Isuzu',
      model: 'D-Max Spacecab 1.9 Ddi S',
      vehicleType: 'กระบะตอนครึ่ง',
      year: 2021,
      department: 'ฝ่ายคลังสินค้าและจัดส่ง',
      responsiblePerson: 'นายประสิทธิ์ ขยันงาน',
      startDate: new Date('2021-08-01'),
      currentMileage: 92300,
      mileageDate: new Date('2026-10-12'),
      status: 'repairing',
      notes: 'อยู่ระหว่างเปลี่ยนผ้าเบรกและเช็กระยะ 90,000 กม.',
    },
  })

  const vehicle3 = await prisma.vehicle.create({
    data: {
      code: 'V-003',
      licensePlate: 'นข 1122',
      province: 'นนทบุรี',
      brand: 'Toyota',
      model: 'Commuter 2.8 Van',
      vehicleType: 'รถตู้โดยสาร',
      year: 2020,
      department: 'ฝ่ายบริหารทั่วไป',
      responsiblePerson: 'นายอนันต์ นำทาง',
      startDate: new Date('2020-01-10'),
      currentMileage: 125000,
      mileageDate: new Date('2026-10-01'),
      status: 'waiting_repair',
      notes: 'รอคิวซ่อมระบบหล่อเย็นและแอร์',
    },
  })

  const vehicle4 = await prisma.vehicle.create({
    data: {
      code: 'V-004',
      licensePlate: '7กศ 3344',
      province: 'กรุงเทพมหานคร',
      brand: 'Honda',
      model: 'City Hatchback e:HEV RS',
      vehicleType: 'เก๋ง 5 ประตู',
      year: 2023,
      department: 'ฝ่ายบริหาร',
      responsiblePerson: 'นางสาวพิมพ์ใจ มีสุข',
      startDate: new Date('2023-05-20'),
      currentMileage: 28400,
      mileageDate: new Date('2026-10-14'),
      status: 'active',
      notes: 'รถประจำตำแหน่งผู้บริหาร',
    },
  })

  // 5. Odometer Readings
  await prisma.odometerReading.createMany({
    data: [
      {
        vehicleId: vehicle1.id,
        reading: 40000,
        readingDate: new Date('2026-05-10'),
        source: 'maintenance',
        notes: 'เช็กระยะ 40,000 กม.',
      },
      {
        vehicleId: vehicle1.id,
        reading: 48500,
        readingDate: new Date('2026-10-10'),
        source: 'manual',
        notes: 'บันทึกประจำเดือน ต.ค.',
      },
      {
        vehicleId: vehicle2.id,
        reading: 85000,
        readingDate: new Date('2026-06-15'),
        source: 'manual',
      },
      {
        vehicleId: vehicle2.id,
        reading: 92300,
        readingDate: new Date('2026-10-12'),
        source: 'repair_order',
        notes: 'เข้าซ่อมที่ 92,300 กม.',
      },
    ],
  })

  // 6. Maintenance Plans
  await prisma.maintenancePlan.create({
    data: {
      vehicleId: vehicle1.id,
      name: 'เปลี่ยนน้ำมันเครื่องและไส้กรอง',
      intervalMonths: 6,
      intervalKm: 10000,
      lastPerformedDate: new Date('2026-05-10'),
      lastPerformedMileage: 40000,
      nextDueDate: new Date('2026-11-10'),
      nextDueMileage: 50000,
      status: 'upcoming', // mileage is 48500, within 1500km (< 1000km advance warning or upcoming)
      advanceWarningDays: 30,
      advanceWarningKm: 1500,
    },
  })

  await prisma.maintenancePlan.create({
    data: {
      vehicleId: vehicle2.id,
      name: 'ตรวจเช็กระบบเบรกและเปลี่ยนถ่ายน้ำมันเบรก',
      intervalMonths: 12,
      intervalKm: 20000,
      lastPerformedDate: new Date('2025-09-10'),
      lastPerformedMileage: 70000,
      nextDueDate: new Date('2026-09-10'), // Overdue!
      nextDueMileage: 90000, // Overdue (current 92,300)!
      status: 'overdue',
      advanceWarningDays: 30,
      advanceWarningKm: 1000,
    },
  })

  // 7. Repair Orders
  const ro1 = await prisma.repairOrder.create({
    data: {
      orderNumber: 'RO-2569-10-0001',
      vehicleId: vehicle2.id,
      mileageAtRepair: 92300,
      reportedBy: 'นายประสิทธิ์ ขยันงาน',
      department: 'ฝ่ายคลังสินค้าและจัดส่ง',
      reportedSymptoms: 'เบรกมีเสียงดัง และถึงรอบเปลี่ยนน้ำมันเครื่อง 90,000 กม.',
      diagnosis: 'ผ้าเบรกหน้าสึกเกือบหมด ต้องเปลี่ยนทันที จานเบรกยังปกติ',
      assignedTo: 'ช่างเอกชัย ชำนาญการ',
      laborCost: 600,
      partsCost: 2420,
      otherCost: 0,
      totalCost: 3020,
      status: 'repairing',
      orderDate: new Date('2026-10-12'),
      startDate: new Date('2026-10-13'),
      items: {
        create: [
          {
            description: 'เปลี่ยนผ้าดิสเบรกหน้า คู่หน้า',
            laborCost: 350,
            partsCost: 950,
            status: 'in_progress',
          },
          {
            description: 'เปลี่ยนถ่ายน้ำมันเครื่องและไส้กรอง',
            laborCost: 250,
            partsCost: 1470,
            status: 'pending',
          },
        ],
      },
    },
  })

  // 8. Part Issue linked to Repair Order
  const issue1 = await prisma.partIssue.create({
    data: {
      issueNumber: 'ISS-2569-10-0001',
      issueDate: new Date('2026-10-13'),
      vehicleId: vehicle2.id,
      repairOrderId: ro1.id,
      issuedBy: 'นายประสิทธิ์ ขยันงาน',
      totalAmount: 950,
      status: 'completed',
      items: {
        create: [
          {
            partId: partBrakeFront.id,
            quantity: 1,
            costPerUnit: 950,
            totalCost: 950,
          },
        ],
      },
    },
  })

  // Inventory transaction for this issue
  await prisma.inventoryTransaction.create({
    data: {
      partId: partBrakeFront.id,
      transactionType: 'issue',
      quantity: -1,
      previousQty: 3,
      newQty: 2,
      referenceType: 'issue',
      referenceId: issue1.id,
      referenceNumber: issue1.issueNumber,
      vehicleId: vehicle2.id,
      repairOrderId: ro1.id,
      reason: 'เบิกไปเปลี่ยนผ้าเบรกรถ Isuzu 3ขษ 9821 ตามใบงาน ' + ro1.orderNumber,
      performedBy: 'นายสมบัติ คลังพัสดุ',
      transactionDate: new Date('2026-10-13'),
    },
  })

  // 9. Notifications
  await prisma.notification.createMany({
    data: [
      {
        type: 'maintenance_overdue',
        title: 'รถเกินกำหนดซ่อมบำรุง',
        message: 'รถ Isuzu D-Max (3ขษ 9821) เกินกำหนดตรวจเช็กระบบเบรก (เกินทั้งเวลาและระยะทาง)',
        referenceType: 'vehicle',
        referenceId: vehicle2.id,
        priority: 'critical',
      },
      {
        type: 'low_stock',
        title: 'อะไหล่ใกล้หมดสต็อก',
        message: 'ผ้าดิสเบรกหน้า Revo/Fortuner เหลือเพียง 2 ชุด (เกณฑ์ขั้นต่ำ 3 ชุด)',
        referenceType: 'part',
        referenceId: partBrakeFront.id,
        priority: 'high',
      },
      {
        type: 'out_of_stock',
        title: 'อะไหล่หมดสต็อก',
        message: 'น้ำยาหล่อเย็นหม้อน้ำ Super Coolant 4L หมดสต็อก (0 แกลลอน)',
        referenceType: 'part',
        referenceId: partCoolant.id,
        priority: 'high',
      },
    ],
  })

  // 10. Settings
  await prisma.appSetting.createMany({
    data: [
      { key: 'company_name', value: 'บริษัท เฮียเชาว์ จำกัด (iHereCHOW Co.,Ltd)', label: 'ชื่อหน่วยงาน/บริษัท', group: 'general' },
      { key: 'default_advance_days', value: '30', label: 'แจ้งเตือนซ่อมบำรุงล่วงหน้า (วัน)', group: 'maintenance' },
      { key: 'default_advance_km', value: '1000', label: 'แจ้งเตือนซ่อมบำรุงล่วงหน้า (กิโลเมตร)', group: 'maintenance' },
    ],
  })

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

