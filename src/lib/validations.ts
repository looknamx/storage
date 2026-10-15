import { z } from 'zod'

// ──────────────────────────────────────────────
// Vehicle Schema
// ──────────────────────────────────────────────

export const vehicleSchema = z.object({
  plateNumber: z
    .string()
    .min(1, 'กรุณากรอกหมายเลขทะเบียน')
    .max(20, 'หมายเลขทะเบียนต้องไม่เกิน 20 ตัวอักษร'),
  province: z
    .string()
    .min(1, 'กรุณาเลือกจังหวัด'),
  brand: z
    .string()
    .min(1, 'กรุณากรอกยี่ห้อ'),
  model: z
    .string()
    .min(1, 'กรุณากรอกรุ่น'),
  year: z
    .number()
    .min(2500, 'ปีต้องไม่น้อยกว่า พ.ศ. 2500')
    .max(2600, 'ปีต้องไม่เกิน พ.ศ. 2600'),
  color: z
    .string()
    .optional(),
  chassisNumber: z
    .string()
    .optional(),
  engineNumber: z
    .string()
    .optional(),
  fuelType: z
    .enum(['diesel', 'gasoline', 'electric', 'hybrid', 'lpg', 'cng'], {
      message: 'กรุณาเลือกประเภทเชื้อเพลิง',
    }),
  vehicleType: z
    .string()
    .min(1, 'กรุณาเลือกประเภทรถ'),
  status: z
    .enum([
      'active',
      'waiting_repair',
      'repairing',
      'waiting_parts',
      'inactive',
      'decommissioned',
    ])
    .default('active'),
  currentMileage: z
    .number()
    .min(0, 'เลขไมล์ต้องไม่น้อยกว่า 0')
    .default(0),
  department: z
    .string()
    .optional(),
  assignedDriver: z
    .string()
    .optional(),
  insuranceExpiry: z
    .string()
    .optional(),
  taxExpiry: z
    .string()
    .optional(),
  notes: z
    .string()
    .max(500, 'หมายเหตุต้องไม่เกิน 500 ตัวอักษร')
    .optional(),
})

export type VehicleFormValues = z.infer<typeof vehicleSchema>

// ──────────────────────────────────────────────
// Part Schema
// ──────────────────────────────────────────────

export const partSchema = z.object({
  partNumber: z
    .string()
    .min(1, 'กรุณากรอกรหัสอะไหล่')
    .max(50, 'รหัสอะไหล่ต้องไม่เกิน 50 ตัวอักษร'),
  name: z
    .string()
    .min(1, 'กรุณากรอกชื่ออะไหล่')
    .max(200, 'ชื่ออะไหล่ต้องไม่เกิน 200 ตัวอักษร'),
  description: z
    .string()
    .max(500, 'รายละเอียดต้องไม่เกิน 500 ตัวอักษร')
    .optional(),
  category: z
    .string()
    .min(1, 'กรุณาเลือกหมวดหมู่'),
  unit: z
    .string()
    .min(1, 'กรุณากรอกหน่วยนับ'),
  minStock: z
    .number()
    .min(0, 'จำนวนขั้นต่ำต้องไม่น้อยกว่า 0')
    .default(0),
  maxStock: z
    .number()
    .min(0, 'จำนวนสูงสุดต้องไม่น้อยกว่า 0')
    .optional(),
  reorderPoint: z
    .number()
    .min(0, 'จุดสั่งซื้อต้องไม่น้อยกว่า 0')
    .default(0),
  costPrice: z
    .number()
    .min(0, 'ราคาทุนต้องไม่น้อยกว่า 0'),
  sellingPrice: z
    .number()
    .min(0, 'ราคาขายต้องไม่น้อยกว่า 0')
    .optional(),
  location: z
    .string()
    .max(100, 'ตำแหน่งจัดเก็บต้องไม่เกิน 100 ตัวอักษร')
    .optional(),
  supplier: z
    .string()
    .optional(),
  notes: z
    .string()
    .max(500, 'หมายเหตุต้องไม่เกิน 500 ตัวอักษร')
    .optional(),
}).refine(
  (data) => {
    if (data.maxStock !== undefined && data.maxStock !== null) {
      return data.maxStock >= data.minStock
    }
    return true
  },
  {
    message: 'จำนวนสูงสุดต้องมากกว่าหรือเท่ากับจำนวนขั้นต่ำ',
    path: ['maxStock'],
  }
)

export type PartFormValues = z.infer<typeof partSchema>

// ──────────────────────────────────────────────
// Stock Receipt Schema
// ──────────────────────────────────────────────

export const stockReceiptItemSchema = z.object({
  partId: z
    .string()
    .min(1, 'กรุณาเลือกอะไหล่'),
  quantity: z
    .number()
    .min(1, 'จำนวนต้องไม่น้อยกว่า 1'),
  unitCost: z
    .number()
    .min(0, 'ราคาต่อหน่วยต้องไม่น้อยกว่า 0'),
  totalCost: z
    .number()
    .min(0, 'ราคารวมต้องไม่น้อยกว่า 0'),
  notes: z
    .string()
    .max(200, 'หมายเหตุต้องไม่เกิน 200 ตัวอักษร')
    .optional(),
})

export const stockReceiptSchema = z.object({
  receiptNumber: z
    .string()
    .min(1, 'กรุณากรอกเลขที่ใบรับ'),
  receiptDate: z
    .string()
    .min(1, 'กรุณาเลือกวันที่รับสินค้า'),
  supplier: z
    .string()
    .min(1, 'กรุณากรอกชื่อผู้จำหน่าย'),
  referenceNumber: z
    .string()
    .optional(),
  items: z
    .array(stockReceiptItemSchema)
    .min(1, 'กรุณาเพิ่มรายการอะไหล่อย่างน้อย 1 รายการ'),
  totalAmount: z
    .number()
    .min(0, 'ยอดรวมต้องไม่น้อยกว่า 0'),
  notes: z
    .string()
    .max(500, 'หมายเหตุต้องไม่เกิน 500 ตัวอักษร')
    .optional(),
})

export type StockReceiptItemFormValues = z.infer<typeof stockReceiptItemSchema>
export type StockReceiptFormValues = z.infer<typeof stockReceiptSchema>

// ──────────────────────────────────────────────
// Part Issue Schema
// ──────────────────────────────────────────────

export const partIssueItemSchema = z.object({
  partId: z
    .string()
    .min(1, 'กรุณาเลือกอะไหล่'),
  quantity: z
    .number()
    .min(1, 'จำนวนต้องไม่น้อยกว่า 1'),
  unitCost: z
    .number()
    .min(0, 'ราคาต่อหน่วยต้องไม่น้อยกว่า 0'),
  notes: z
    .string()
    .max(200, 'หมายเหตุต้องไม่เกิน 200 ตัวอักษร')
    .optional(),
})

export const partIssueSchema = z.object({
  issueNumber: z
    .string()
    .min(1, 'กรุณากรอกเลขที่ใบเบิก'),
  issueDate: z
    .string()
    .min(1, 'กรุณาเลือกวันที่เบิก'),
  vehicleId: z
    .string()
    .min(1, 'กรุณาเลือกรถ'),
  repairOrderId: z
    .string()
    .optional(),
  requestedBy: z
    .string()
    .min(1, 'กรุณากรอกชื่อผู้เบิก'),
  approvedBy: z
    .string()
    .optional(),
  items: z
    .array(partIssueItemSchema)
    .min(1, 'กรุณาเพิ่มรายการอะไหล่อย่างน้อย 1 รายการ'),
  purpose: z
    .string()
    .min(1, 'กรุณาระบุวัตถุประสงค์'),
  notes: z
    .string()
    .max(500, 'หมายเหตุต้องไม่เกิน 500 ตัวอักษร')
    .optional(),
})

export type PartIssueItemFormValues = z.infer<typeof partIssueItemSchema>
export type PartIssueFormValues = z.infer<typeof partIssueSchema>

// ──────────────────────────────────────────────
// Repair Order Schema
// ──────────────────────────────────────────────

export const repairOrderItemSchema = z.object({
  description: z
    .string()
    .min(1, 'กรุณากรอกรายละเอียดรายการซ่อม'),
  laborCost: z
    .number()
    .min(0, 'ค่าแรงต้องไม่น้อยกว่า 0')
    .default(0),
  partsCost: z
    .number()
    .min(0, 'ค่าอะไหล่ต้องไม่น้อยกว่า 0')
    .default(0),
  notes: z
    .string()
    .max(200, 'หมายเหตุต้องไม่เกิน 200 ตัวอักษร')
    .optional(),
})

export const repairOrderSchema = z.object({
  orderNumber: z
    .string()
    .min(1, 'กรุณากรอกเลขที่ใบสั่งซ่อม'),
  vehicleId: z
    .string()
    .min(1, 'กรุณาเลือกรถ'),
  reportDate: z
    .string()
    .min(1, 'กรุณาเลือกวันที่แจ้งซ่อม'),
  reportedBy: z
    .string()
    .min(1, 'กรุณากรอกชื่อผู้แจ้งซ่อม'),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'], {
      message: 'กรุณาเลือกระดับความเร่งด่วน',
    })
    .default('medium'),
  status: z
    .enum([
      'open',
      'inspecting',
      'waiting_parts',
      'repairing',
      'testing',
      'completed',
      'delivered',
      'cancelled',
    ])
    .default('open'),
  description: z
    .string()
    .min(1, 'กรุณากรอกรายละเอียดอาการ')
    .max(1000, 'รายละเอียดต้องไม่เกิน 1,000 ตัวอักษร'),
  currentMileage: z
    .number()
    .min(0, 'เลขไมล์ต้องไม่น้อยกว่า 0')
    .optional(),
  estimatedCost: z
    .number()
    .min(0, 'ราคาประเมินต้องไม่น้อยกว่า 0')
    .optional(),
  actualCost: z
    .number()
    .min(0, 'ราคาจริงต้องไม่น้อยกว่า 0')
    .optional(),
  items: z
    .array(repairOrderItemSchema)
    .optional(),
  assignedMechanic: z
    .string()
    .optional(),
  estimatedCompletion: z
    .string()
    .optional(),
  completedDate: z
    .string()
    .optional(),
  notes: z
    .string()
    .max(500, 'หมายเหตุต้องไม่เกิน 500 ตัวอักษร')
    .optional(),
})

export type RepairOrderItemFormValues = z.infer<typeof repairOrderItemSchema>
export type RepairOrderFormValues = z.infer<typeof repairOrderSchema>

// ──────────────────────────────────────────────
// Maintenance Plan Schema
// ──────────────────────────────────────────────

export const maintenancePlanSchema = z.object({
  vehicleId: z
    .string()
    .min(1, 'กรุณาเลือกรถ'),
  maintenanceType: z
    .string()
    .min(1, 'กรุณาเลือกประเภทการบำรุงรักษา'),
  description: z
    .string()
    .min(1, 'กรุณากรอกรายละเอียด')
    .max(500, 'รายละเอียดต้องไม่เกิน 500 ตัวอักษร'),
  intervalKm: z
    .number()
    .min(0, 'ระยะทางต้องไม่น้อยกว่า 0 กม.')
    .optional(),
  intervalDays: z
    .number()
    .min(1, 'จำนวนวันต้องไม่น้อยกว่า 1 วัน')
    .optional(),
  lastServiceDate: z
    .string()
    .optional(),
  lastServiceMileage: z
    .number()
    .min(0, 'เลขไมล์ต้องไม่น้อยกว่า 0')
    .optional(),
  nextServiceDate: z
    .string()
    .min(1, 'กรุณาเลือกวันที่บำรุงรักษาครั้งถัดไป'),
  nextServiceMileage: z
    .number()
    .min(0, 'เลขไมล์ต้องไม่น้อยกว่า 0')
    .optional(),
  estimatedCost: z
    .number()
    .min(0, 'ค่าใช้จ่ายโดยประมาณต้องไม่น้อยกว่า 0')
    .optional(),
  isActive: z
    .boolean()
    .default(true),
  notes: z
    .string()
    .max(500, 'หมายเหตุต้องไม่เกิน 500 ตัวอักษร')
    .optional(),
}).refine(
  (data) => data.intervalKm || data.intervalDays,
  {
    message: 'กรุณาระบุระยะทางหรือจำนวนวันอย่างน้อย 1 รายการ',
    path: ['intervalKm'],
  }
)

export type MaintenancePlanFormValues = z.infer<typeof maintenancePlanSchema>

// ──────────────────────────────────────────────
// Odometer Reading Schema
// ──────────────────────────────────────────────

export const odometerReadingSchema = z.object({
  vehicleId: z
    .string()
    .min(1, 'กรุณาเลือกรถ'),
  reading: z
    .number()
    .min(0, 'เลขไมล์ต้องไม่น้อยกว่า 0')
    .max(9999999, 'เลขไมล์ต้องไม่เกิน 9,999,999'),
  readingDate: z
    .string()
    .min(1, 'กรุณาเลือกวันที่อ่านค่า'),
  recordedBy: z
    .string()
    .min(1, 'กรุณากรอกชื่อผู้บันทึก'),
  source: z
    .enum(['manual', 'gps', 'maintenance', 'refuel'], {
      message: 'กรุณาเลือกแหล่งข้อมูล',
    })
    .default('manual'),
  notes: z
    .string()
    .max(200, 'หมายเหตุต้องไม่เกิน 200 ตัวอักษร')
    .optional(),
})

export type OdometerReadingFormValues = z.infer<typeof odometerReadingSchema>
