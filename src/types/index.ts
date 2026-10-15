// ──────────────────────────────────────────────
// Status Types
// ──────────────────────────────────────────────

export type VehicleStatus =
  | 'active'
  | 'waiting_repair'
  | 'repairing'
  | 'waiting_parts'
  | 'inactive'
  | 'decommissioned'

export type RepairOrderStatus =
  | 'open'
  | 'inspecting'
  | 'waiting_parts'
  | 'repairing'
  | 'testing'
  | 'completed'
  | 'delivered'
  | 'cancelled'

export type MaintenanceStatus =
  | 'normal'
  | 'upcoming'
  | 'due'
  | 'overdue'

export type TransactionType =
  | 'receive'
  | 'issue'
  | 'return'
  | 'adjust'
  | 'transfer'

export type Priority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'

export type FuelType =
  | 'diesel'
  | 'gasoline'
  | 'electric'
  | 'hybrid'
  | 'lpg'
  | 'cng'

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────

export interface DashboardStats {
  totalVehicles: number
  activeVehicles: number
  vehiclesInRepair: number
  vehiclesWaitingParts: number
  inactiveVehicles: number
  totalRepairOrders: number
  openRepairOrders: number
  completedRepairOrders: number
  totalParts: number
  lowStockParts: number
  outOfStockParts: number
  totalPartsValue: number
  maintenanceDueCount: number
  maintenanceOverdueCount: number
  monthlyRepairCost: number
  monthlyPartsCost: number
  averageRepairTime: number
  repairCompletionRate: number
}

// ──────────────────────────────────────────────
// Time Filter
// ──────────────────────────────────────────────

export type TimeFilter =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'this_quarter'
  | 'this_year'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'custom'

export interface DateRange {
  from: Date
  to: Date
}

// ──────────────────────────────────────────────
// Page & Search
// ──────────────────────────────────────────────

export interface PageProps {
  params: { [key: string]: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export interface SearchParams {
  page?: string
  limit?: string
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  status?: string
  category?: string
  from?: string
  to?: string
  [key: string]: string | string[] | undefined
}

// ──────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────

export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// ──────────────────────────────────────────────
// API Response
// ──────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ──────────────────────────────────────────────
// Select / Option
// ──────────────────────────────────────────────

export interface SelectOption {
  value: string
  label: string
}

// ──────────────────────────────────────────────
// Table
// ──────────────────────────────────────────────

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  className?: string
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

// ──────────────────────────────────────────────
// Breadcrumb
// ──────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string
  href?: string
}

// ──────────────────────────────────────────────
// Notification
// ──────────────────────────────────────────────

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Date
  link?: string
}
