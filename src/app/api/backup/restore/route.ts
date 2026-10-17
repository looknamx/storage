import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'

const BACKUP_DIR = path.join(process.cwd(), 'backups')
const DB_PATH = path.join(process.cwd(), 'data', 'storage.db')

function parseDate(val: any): Date | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function parseRequiredDate(val: any): Date {
  return parseDate(val) || new Date()
}

// Restore all database tables from a structured JSON snapshot
async function restoreFromJsonSnapshot(snapshot: any) {
  const rawData = snapshot.data || snapshot

  const categories: any[] = rawData.partCategories || rawData.categories || []
  const vehicleTypes: any[] = rawData.vehicleTypes || []
  const suppliers: any[] = rawData.suppliers || []
  const parts: any[] = rawData.parts || []
  const vehicles: any[] = rawData.vehicles || []
  const odometerReadings: any[] = rawData.odometerReadings || []
  const stockReceipts: any[] = rawData.stockReceipts || []
  const stockReceiptItems: any[] = rawData.stockReceiptItems || []
  const partIssues: any[] = rawData.partIssues || []
  const partIssueItems: any[] = rawData.partIssueItems || []
  const partReturns: any[] = rawData.partReturns || []
  const inventoryTransactions: any[] = rawData.inventoryTransactions || []
  const repairOrders: any[] = rawData.repairOrders || []
  const repairOrderItems: any[] = rawData.repairOrderItems || []
  const maintenancePlans: any[] = rawData.maintenancePlans || []
  const maintenanceRecords: any[] = rawData.maintenanceRecords || []
  const notifications: any[] = rawData.notifications || []
  const appSettings: any[] = rawData.appSettings || rawData.settings || []
  const transportJobs: any[] = rawData.transportJobs || []
  const marketingCustomers: any[] = rawData.marketingCustomers || []

  const hasMaintenanceData =
    parts.length > 0 ||
    vehicles.length > 0 ||
    categories.length > 0 ||
    repairOrders.length > 0 ||
    maintenancePlans.length > 0

  const hasMarketingData = transportJobs.length > 0 || marketingCustomers.length > 0

  // 1. Purge existing maintenance data ONLY if snapshot contains maintenance data
  if (hasMaintenanceData) {
    await prisma.$transaction([
      prisma.partReturn.deleteMany(),
      prisma.partIssueItem.deleteMany(),
      prisma.stockReceiptItem.deleteMany(),
      prisma.inventoryTransaction.deleteMany(),
      prisma.repairOrderItem.deleteMany(),
      prisma.maintenanceRecord.deleteMany(),
      prisma.odometerReading.deleteMany(),
      prisma.partIssue.deleteMany(),
      prisma.stockReceipt.deleteMany(),
      prisma.repairOrder.deleteMany(),
      prisma.maintenancePlan.deleteMany(),
      prisma.part.deleteMany(),
      prisma.vehicle.deleteMany(),
      prisma.supplier.deleteMany(),
      prisma.partCategory.deleteMany(),
      prisma.vehicleType.deleteMany(),
      prisma.notification.deleteMany(),
    ])
  }

  // 2. Insert Master Data: Categories
  if (categories.length > 0) {
    const formattedCategories = categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description || null,
      createdAt: parseRequiredDate(c.createdAt),
      updatedAt: parseRequiredDate(c.updatedAt),
    }))
    await prisma.partCategory.createMany({ data: formattedCategories, skipDuplicates: true })
  }

  // 3. Insert Master Data: Vehicle Types
  if (vehicleTypes.length > 0) {
    const formattedTypes = vehicleTypes.map((vt) => ({
      id: vt.id,
      name: vt.name,
      description: vt.description || null,
      createdAt: parseRequiredDate(vt.createdAt),
      updatedAt: parseRequiredDate(vt.updatedAt),
    }))
    await prisma.vehicleType.createMany({ data: formattedTypes, skipDuplicates: true })
  }

  // 4. Insert Master Data: Suppliers
  if (suppliers.length > 0) {
    const formattedSuppliers = suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      contactInfo: s.contactInfo || null,
      address: s.address || null,
      phone: s.phone || null,
      email: s.email || null,
      notes: s.notes || null,
      isActive: s.isActive ?? true,
      createdAt: parseRequiredDate(s.createdAt),
      updatedAt: parseRequiredDate(s.updatedAt),
    }))
    await prisma.supplier.createMany({ data: formattedSuppliers, skipDuplicates: true })
  }

  // 5. Insert Parts (in chunks of 500)
  if (parts.length > 0) {
    const chunkSize = 500
    for (let i = 0; i < parts.length; i += chunkSize) {
      const chunk = parts.slice(i, i + chunkSize).map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        categoryId: p.categoryId || null,
        brand: p.brand || null,
        compatibleModels: p.compatibleModels || null,
        unit: p.unit || 'ชิ้น',
        quantity: Number(p.quantity) || 0,
        minimumStock: Number(p.minimumStock) || 0,
        costPerUnit: Number(p.costPerUnit) || 0,
        location: p.location || null,
        supplierId: p.supplierId || null,
        description: p.description || null,
        notes: p.notes || null,
        isActive: p.isActive ?? true,
        createdAt: parseRequiredDate(p.createdAt),
        updatedAt: parseRequiredDate(p.updatedAt),
      }))
      await prisma.part.createMany({ data: chunk, skipDuplicates: true })
    }
  }

  // 6. Insert Vehicles
  if (vehicles.length > 0) {
    const formattedVehicles = vehicles.map((v) => ({
      id: v.id,
      code: v.code,
      licensePlate: v.licensePlate,
      province: v.province,
      brand: v.brand,
      model: v.model,
      vehicleType: v.vehicleType,
      year: v.year ? Number(v.year) : null,
      vin: v.vin || null,
      engineNumber: v.engineNumber || null,
      department: v.department || null,
      responsiblePerson: v.responsiblePerson || null,
      startDate: parseDate(v.startDate),
      currentMileage: Number(v.currentMileage) || 0,
      mileageDate: parseDate(v.mileageDate),
      status: v.status || 'active',
      notes: v.notes || null,
      createdAt: parseRequiredDate(v.createdAt),
      updatedAt: parseRequiredDate(v.updatedAt),
    }))
    await prisma.vehicle.createMany({ data: formattedVehicles, skipDuplicates: true })
  }

  // 7. Insert Odometer Readings
  if (odometerReadings.length > 0) {
    const formattedReadings = odometerReadings.map((r) => ({
      id: r.id,
      vehicleId: r.vehicleId,
      reading: Number(r.reading) || 0,
      readingDate: parseRequiredDate(r.readingDate),
      source: r.source || 'manual',
      referenceId: r.referenceId || null,
      notes: r.notes || null,
      createdBy: r.createdBy || null,
      createdAt: parseRequiredDate(r.createdAt),
    }))
    await prisma.odometerReading.createMany({ data: formattedReadings, skipDuplicates: true })
  }

  // 8. Insert Stock Receipts & Items
  if (stockReceipts.length > 0) {
    const formattedReceipts = stockReceipts.map((sr) => ({
      id: sr.id,
      receiptNumber: sr.receiptNumber,
      receiptDate: parseRequiredDate(sr.receiptDate),
      supplierId: sr.supplierId || null,
      purchaseOrderRef: sr.purchaseOrderRef || null,
      receivedBy: sr.receivedBy || null,
      totalAmount: Number(sr.totalAmount) || 0,
      notes: sr.notes || null,
      status: sr.status || 'completed',
      createdAt: parseRequiredDate(sr.createdAt),
      updatedAt: parseRequiredDate(sr.updatedAt),
    }))
    await prisma.stockReceipt.createMany({ data: formattedReceipts, skipDuplicates: true })
  }
  if (stockReceiptItems.length > 0) {
    const formattedItems = stockReceiptItems.map((sri) => ({
      id: sri.id,
      receiptId: sri.receiptId,
      partId: sri.partId,
      quantity: Number(sri.quantity) || 0,
      costPerUnit: Number(sri.costPerUnit) || 0,
      totalCost: Number(sri.totalCost) || 0,
      notes: sri.notes || null,
      createdAt: parseRequiredDate(sri.createdAt),
    }))
    await prisma.stockReceiptItem.createMany({ data: formattedItems, skipDuplicates: true })
  }

  // 9. Insert Part Issues, Items & Returns
  if (partIssues.length > 0) {
    const formattedIssues = partIssues.map((pi) => ({
      id: pi.id,
      issueNumber: pi.issueNumber,
      issueDate: parseRequiredDate(pi.issueDate),
      vehicleId: pi.vehicleId || null,
      repairOrderId: pi.repairOrderId || null,
      issuedBy: pi.issuedBy || null,
      totalAmount: Number(pi.totalAmount) || 0,
      notes: pi.notes || null,
      status: pi.status || 'completed',
      createdAt: parseRequiredDate(pi.createdAt),
      updatedAt: parseRequiredDate(pi.updatedAt),
    }))
    await prisma.partIssue.createMany({ data: formattedIssues, skipDuplicates: true })
  }
  if (partIssueItems.length > 0) {
    const formattedIssueItems = partIssueItems.map((pii) => ({
      id: pii.id,
      issueId: pii.issueId,
      partId: pii.partId,
      quantity: Number(pii.quantity) || 0,
      costPerUnit: Number(pii.costPerUnit) || 0,
      totalCost: Number(pii.totalCost) || 0,
      returnedQty: Number(pii.returnedQty) || 0,
      notes: pii.notes || null,
      createdAt: parseRequiredDate(pii.createdAt),
    }))
    await prisma.partIssueItem.createMany({ data: formattedIssueItems, skipDuplicates: true })
  }
  if (partReturns.length > 0) {
    const formattedReturns = partReturns.map((pr) => ({
      id: pr.id,
      returnNumber: pr.returnNumber,
      returnDate: parseRequiredDate(pr.returnDate),
      issueId: pr.issueId,
      partId: pr.partId,
      quantity: Number(pr.quantity) || 0,
      condition: pr.condition || 'good',
      reason: pr.reason || null,
      returnedBy: pr.returnedBy || null,
      notes: pr.notes || null,
      createdAt: parseRequiredDate(pr.createdAt),
    }))
    await prisma.partReturn.createMany({ data: formattedReturns, skipDuplicates: true })
  }

  // 10. Insert Inventory Transactions
  if (inventoryTransactions.length > 0) {
    const formattedTx = inventoryTransactions.map((tx) => ({
      id: tx.id,
      partId: tx.partId,
      transactionType: tx.transactionType,
      quantity: Number(tx.quantity) || 0,
      previousQty: Number(tx.previousQty) || 0,
      newQty: Number(tx.newQty) || 0,
      referenceType: tx.referenceType || null,
      referenceId: tx.referenceId || null,
      referenceNumber: tx.referenceNumber || null,
      vehicleId: tx.vehicleId || null,
      repairOrderId: tx.repairOrderId || null,
      reason: tx.reason || null,
      performedBy: tx.performedBy || null,
      transactionDate: parseRequiredDate(tx.transactionDate),
      createdAt: parseRequiredDate(tx.createdAt),
    }))
    await prisma.inventoryTransaction.createMany({ data: formattedTx, skipDuplicates: true })
  }

  // 11. Insert Repair Orders & Items
  if (repairOrders.length > 0) {
    const formattedOrders = repairOrders.map((ro) => ({
      id: ro.id,
      orderNumber: ro.orderNumber,
      vehicleId: ro.vehicleId,
      mileageAtRepair: ro.mileageAtRepair ? Number(ro.mileageAtRepair) : null,
      reportedBy: ro.reportedBy || null,
      department: ro.department || null,
      reportedSymptoms: ro.reportedSymptoms || null,
      diagnosis: ro.diagnosis || null,
      assignedTo: ro.assignedTo || null,
      laborCost: Number(ro.laborCost) || 0,
      partsCost: Number(ro.partsCost) || 0,
      otherCost: Number(ro.otherCost) || 0,
      totalCost: Number(ro.totalCost) || 0,
      status: ro.status || 'open',
      orderDate: parseRequiredDate(ro.orderDate),
      startDate: parseDate(ro.startDate),
      completedDate: parseDate(ro.completedDate),
      deliveredDate: parseDate(ro.deliveredDate),
      testResult: ro.testResult || null,
      notes: ro.notes || null,
      createdAt: parseRequiredDate(ro.createdAt),
      updatedAt: parseRequiredDate(ro.updatedAt),
    }))
    await prisma.repairOrder.createMany({ data: formattedOrders, skipDuplicates: true })
  }
  if (repairOrderItems.length > 0) {
    const formattedOrderItems = repairOrderItems.map((roi) => ({
      id: roi.id,
      repairOrderId: roi.repairOrderId,
      description: roi.description,
      laborCost: Number(roi.laborCost) || 0,
      partsCost: Number(roi.partsCost) || 0,
      otherCost: Number(roi.otherCost) || 0,
      status: roi.status || 'pending',
      notes: roi.notes || null,
      createdAt: parseRequiredDate(roi.createdAt),
      updatedAt: parseRequiredDate(roi.updatedAt),
    }))
    await prisma.repairOrderItem.createMany({ data: formattedOrderItems, skipDuplicates: true })
  }

  // 12. Insert Maintenance Plans & Records
  if (maintenancePlans.length > 0) {
    const formattedPlans = maintenancePlans.map((mp) => ({
      id: mp.id,
      vehicleId: mp.vehicleId,
      name: mp.name,
      intervalMonths: mp.intervalMonths ? Number(mp.intervalMonths) : null,
      intervalKm: mp.intervalKm ? Number(mp.intervalKm) : null,
      lastPerformedDate: parseDate(mp.lastPerformedDate),
      lastPerformedMileage: mp.lastPerformedMileage ? Number(mp.lastPerformedMileage) : null,
      nextDueDate: parseDate(mp.nextDueDate),
      nextDueMileage: mp.nextDueMileage ? Number(mp.nextDueMileage) : null,
      advanceWarningDays: Number(mp.advanceWarningDays) || 30,
      advanceWarningKm: Number(mp.advanceWarningKm) || 1000,
      status: mp.status || 'normal',
      isActive: mp.isActive ?? true,
      notes: mp.notes || null,
      createdAt: parseRequiredDate(mp.createdAt),
      updatedAt: parseRequiredDate(mp.updatedAt),
    }))
    await prisma.maintenancePlan.createMany({ data: formattedPlans, skipDuplicates: true })
  }
  if (maintenanceRecords.length > 0) {
    const formattedRecords = maintenanceRecords.map((mr) => ({
      id: mr.id,
      planId: mr.planId,
      vehicleId: mr.vehicleId,
      performedDate: parseRequiredDate(mr.performedDate),
      mileageAtService: mr.mileageAtService ? Number(mr.mileageAtService) : null,
      description: mr.description || null,
      cost: Number(mr.cost) || 0,
      performedBy: mr.performedBy || null,
      repairOrderId: mr.repairOrderId || null,
      notes: mr.notes || null,
      createdAt: parseRequiredDate(mr.createdAt),
    }))
    await prisma.maintenanceRecord.createMany({ data: formattedRecords, skipDuplicates: true })
  }

  // 13. Insert Notifications
  if (notifications.length > 0) {
    const formattedNotifs = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      referenceType: n.referenceType || null,
      referenceId: n.referenceId || null,
      isRead: n.isRead ?? false,
      priority: n.priority || 'normal',
      createdAt: parseRequiredDate(n.createdAt),
    }))
    await prisma.notification.createMany({ data: formattedNotifs, skipDuplicates: true })
  }

  // 15. Insert Marketing Customers & Transport Jobs (if present in snapshot)
  if (hasMarketingData) {
    await prisma.$transaction([
      prisma.transportJob.deleteMany(),
      prisma.marketingCustomer.deleteMany(),
    ])

    if (marketingCustomers.length > 0) {
      const formattedCustomers = marketingCustomers.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code || null,
        taxId: c.taxId || null,
        contactPerson: c.contactPerson || null,
        phone: c.phone || null,
        email: c.email || null,
        address: c.address || null,
        billingNote: c.billingNote || null,
        creditTermDays: Number(c.creditTermDays) || 30,
        isActive: c.isActive ?? true,
        notes: c.notes || null,
        createdAt: parseRequiredDate(c.createdAt),
        updatedAt: parseRequiredDate(c.updatedAt),
      }))
      await prisma.marketingCustomer.createMany({
        data: formattedCustomers,
        skipDuplicates: true,
      })
    }

    if (transportJobs.length > 0) {
      const formattedJobs = transportJobs.map((j) => ({
        ...j,
        loadingDate: parseDate(j.loadingDate),
        deliveryDate: parseDate(j.deliveryDate),
        billingDate: parseDate(j.billingDate),
        paymentDate: parseDate(j.paymentDate),
        subcontractorPaidDate: parseDate(j.subcontractorPaidDate),
        createdAt: parseRequiredDate(j.createdAt),
        updatedAt: parseRequiredDate(j.updatedAt),
      }))

      for (let i = 0; i < formattedJobs.length; i += 100) {
        await prisma.transportJob.createMany({
          data: formattedJobs.slice(i, i + 100),
          skipDuplicates: true,
        })
      }
    }
  }

  return {
    partsCount: parts.length,
    vehiclesCount: vehicles.length,
    suppliersCount: suppliers.length,
    categoriesCount: categories.length,
    ordersCount: repairOrders.length,
    transportJobsCount: transportJobs.length,
    marketingCustomersCount: marketingCustomers.length,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { filename, jsonData, createSafetyBackupFirst = true } = body

    if (!filename && !jsonData) {
      return NextResponse.json(
        { error: 'กรุณาเลือกไฟล์สำรองข้อมูล หรือระบุข้อมูล JSON ที่ต้องการกู้คืน' },
        { status: 400 }
      )
    }

    // Create safety snapshot before restoring
    let safetyBackupName = ''
    if (createSafetyBackupFirst) {
      try {
        const now = new Date()
        const pad = (n: number) => String(n).padStart(2, '0')
        safetyBackupName = `safety_pre_restore_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
          now.getDate()
        )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`

        const [parts, vehicles, suppliers, categories] = await Promise.all([
          prisma.part.findMany(),
          prisma.vehicle.findMany(),
          prisma.supplier.findMany(),
          prisma.partCategory.findMany(),
        ])

        const safetyData = {
          exportedAt: now.toISOString(),
          reason: 'Pre-restore safety backup',
          counts: {
            parts: parts.length,
            vehicles: vehicles.length,
            suppliers: suppliers.length,
            categories: categories.length,
          },
          data: { parts, vehicles, suppliers, partCategories: categories },
        }

        if (!fs.existsSync(BACKUP_DIR)) {
          fs.mkdirSync(BACKUP_DIR, { recursive: true })
        }
        fs.writeFileSync(
          path.join(BACKUP_DIR, safetyBackupName),
          JSON.stringify(safetyData, null, 2),
          'utf8'
        )
      } catch (err) {
        console.warn('Could not save safety backup:', err)
      }
    }

    // CASE 1: Uploaded JSON data directly
    if (jsonData) {
      const summary = await restoreFromJsonSnapshot(jsonData)
      return NextResponse.json({
        success: true,
        message: `กู้คืนฐานข้อมูลจากไฟล์ JSON สำเร็จเรียบร้อยแล้ว (อะไหล่ ${summary.partsCount} รายการ, รถ ${summary.vehiclesCount} คัน)`,
        safetyBackupCreated: safetyBackupName,
        restoredSummary: summary,
      })
    }

    // CASE 2: Restore from a file in /backups
    const safeName = path.basename(filename)
    const backupFilePath = path.join(BACKUP_DIR, safeName)

    if (!fs.existsSync(backupFilePath)) {
      return NextResponse.json({ error: 'ไม่พบไฟล์สำรองข้อมูลที่ระบุในเซิร์ฟเวอร์' }, { status: 404 })
    }

    if (safeName.endsWith('.json')) {
      const fileContent = fs.readFileSync(backupFilePath, 'utf8')
      const snapshot = JSON.parse(fileContent)
      const summary = await restoreFromJsonSnapshot(snapshot)

      return NextResponse.json({
        success: true,
        message: `กู้คืนฐานข้อมูลจากไฟล์ "${safeName}" สำเร็จเรียบร้อยแล้ว (อะไหล่ ${summary.partsCount} รายการ, รถ ${summary.vehiclesCount} คัน)`,
        safetyBackupCreated: safetyBackupName,
        restoredSummary: summary,
      })
    }

    // Fallback for .db files (SQLite)
    const isPostgres = process.env.DATABASE_URL?.startsWith('postgres')
    if (isPostgres) {
      return NextResponse.json(
        {
          error:
            'ไฟล์สำรองนี้เป็นรูปแบบ SQLite (.db) ซึ่งไม่รองรับการกู้คืนโดยตรงเข้า Neon Cloud โปรดใช้ไฟล์สำรองรูปแบบ .json',
        },
        { status: 400 }
      )
    }

    // Local SQLite restore
    await prisma.$disconnect()
    fs.copyFileSync(backupFilePath, DB_PATH)

    return NextResponse.json({
      success: true,
      message: `กู้คืนฐานข้อมูล SQLite จากไฟล์ "${safeName}" สำเร็จเรียบร้อยแล้ว`,
      safetyBackupCreated: safetyBackupName,
    })
  } catch (error: any) {
    console.error('Database restore error:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการกู้คืนฐานข้อมูล' },
      { status: 500 }
    )
  }
}
