import { format } from 'date-fns'
import { th } from 'date-fns/locale'

// ──────────────────────────────────────────────
// Thai Month Names
// ──────────────────────────────────────────────

const THAI_MONTHS_FULL: string[] = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]

const THAI_MONTHS_SHORT: string[] = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
]

// ──────────────────────────────────────────────
// Status Maps
// ──────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  // Vehicle statuses
  active: 'พร้อมใช้งาน',
  waiting_repair: 'รอซ่อม',
  repairing: 'กำลังซ่อม',
  waiting_parts: 'รออะไหล่',
  inactive: 'หยุดใช้งาน',
  decommissioned: 'จำหน่ายออก',
  // Repair statuses
  open: 'เปิดงานใหม่',
  inspecting: 'รอตรวจสอบ',
  testing: 'รอทดสอบ',
  completed: 'ซ่อมเสร็จ',
  delivered: 'ส่งมอบรถ',
  cancelled: 'ยกเลิก',
  // Maintenance statuses
  normal: 'ปกติ',
  upcoming: 'ใกล้ครบกำหนด',
  due: 'ถึงกำหนด',
  overdue: 'เกินกำหนด',
}

const STATUS_COLORS: Record<string, string> = {
  // Vehicle statuses
  active: 'bg-green-100 text-green-800',
  waiting_repair: 'bg-yellow-100 text-yellow-800',
  repairing: 'bg-blue-100 text-blue-800',
  waiting_parts: 'bg-orange-100 text-orange-800',
  inactive: 'bg-gray-100 text-gray-800',
  decommissioned: 'bg-red-100 text-red-800',
  // Repair statuses
  open: 'bg-blue-100 text-blue-800',
  inspecting: 'bg-purple-100 text-purple-800',
  testing: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-green-100 text-green-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  // Maintenance statuses
  normal: 'bg-green-100 text-green-800',
  upcoming: 'bg-yellow-100 text-yellow-800',
  due: 'bg-orange-100 text-orange-800',
  overdue: 'bg-red-100 text-red-800',
}

// ──────────────────────────────────────────────
// Date Helpers
// ──────────────────────────────────────────────

/**
 * Convert a CE year to a Buddhist Era (พ.ศ.) year.
 * Prevents double-conversion if the year is already > 2400.
 */
export function toBuddhistYear(date: Date): number {
  const y = date.getFullYear()
  if (isNaN(y)) return new Date().getFullYear() + 543
  if (y > 2400) return y
  return y + 543
}

/**
 * Return the full Thai month name (0-indexed internally, but accepts 1-12).
 */
export function getThaiMonth(month: number): string {
  if (month < 1 || month > 12) return ''
  return THAI_MONTHS_FULL[month - 1]
}

/**
 * Return the abbreviated Thai month name (accepts 1-12).
 */
export function getThaiMonthShort(month: number): string {
  if (month < 1 || month > 12) return ''
  return THAI_MONTHS_SHORT[month - 1]
}

/**
 * Ensure the incoming value is a Date object.
 */
function ensureDate(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date
}

// ──────────────────────────────────────────────
// Formatting Functions
// ──────────────────────────────────────────────

/**
 * Format date to short Thai format with Buddhist Era.
 * Example: "15 ต.ค. 2569"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = ensureDate(date)
  if (isNaN(d.getTime())) return '-'

  // Guard against epoch 0 / 1970 timestamp bug (which rendered as 2513)
  if (d.getFullYear() <= 1980) {
    if (typeof date === 'string') {
      const match = date.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/)
      if (match && parseInt(match[1]) > 2000) {
        const y = parseInt(match[1])
        const m = parseInt(match[2]) - 1
        const day = parseInt(match[3])
        const bYear = y > 2400 ? y : y + 543
        return `${day} ${THAI_MONTHS_SHORT[m]} ${bYear}`
      }
    }
    return '-'
  }

  const day = d.getDate()
  const monthShort = THAI_MONTHS_SHORT[d.getMonth()]
  const buddhistYear = toBuddhistYear(d)
  return `${day} ${monthShort} ${buddhistYear}`
}

/**
 * Format date to full Thai format with Buddhist Era.
 * Example: "15 ตุลาคม 2569"
 */
export function formatDateFull(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = ensureDate(date)
  if (isNaN(d.getTime())) return '-'

  if (d.getFullYear() <= 1980) return '-'

  const day = d.getDate()
  const monthFull = THAI_MONTHS_FULL[d.getMonth()]
  const buddhistYear = toBuddhistYear(d)
  return `${day} ${monthFull} ${buddhistYear}`
}

/**
 * Format date with time in Thai format.
 * Example: "15 ต.ค. 2569 14:30 น."
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = ensureDate(date)
  if (isNaN(d.getTime())) return '-'

  if (d.getFullYear() <= 1980) return '-'

  const time = format(d, 'HH:mm', { locale: th })
  return `${formatDate(d)} ${time} น.`
}

/**
 * Format date to numeric format in Buddhist Era (DD/MM/YYYY พ.ศ.)
 * Example: "16/10/2569"
 */
export function formatDateNumeric(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = ensureDate(date)
  if (isNaN(d.getTime()) || d.getFullYear() <= 1980) return '-'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const buddhistYear = toBuddhistYear(d)
  return `${day}/${month}/${buddhistYear}`
}

/**
 * Format a number with comma separators.
 * Example: 1234567 → "1,234,567"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('th-TH')
}

/**
 * Format a number as Thai Baht currency.
 * Example: 1234.5 → "฿1,234.50"
 */
export function formatCurrency(num: number): string {
  return `฿${num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Format mileage in kilometres.
 * Example: 12345 → "12,345 กม."
 */
export function formatMileage(km: number): string {
  return `${km.toLocaleString('th-TH')} กม.`
}

// ──────────────────────────────────────────────
// Document Number Generator
// ──────────────────────────────────────────────

/**
 * Generate a unique document number.
 * Pattern: PREFIX-YYYY(พ.ศ.)-MM-NNNN
 * Example: "RO-2569-10-0001"
 */
export function generateDocumentNumber(
  prefix: string,
  date?: Date
): string {
  const d = date ?? new Date()
  const buddhistYear = toBuddhistYear(d)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
  return `${prefix}-${buddhistYear}-${month}-${seq}`
}

// ──────────────────────────────────────────────
// Classname Utility
// ──────────────────────────────────────────────

/**
 * Merge class names, filtering out falsy values.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ──────────────────────────────────────────────
// Status Helpers
// ──────────────────────────────────────────────

/**
 * Return Tailwind color classes for a given status string.
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'
}

/**
 * Return Thai label for a vehicle / repair / maintenance status.
 */
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}
