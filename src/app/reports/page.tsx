'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Wrench,
  Car,
  Package,
} from 'lucide-react'
import * as XLSX from 'xlsx'

const REPORT_OPTIONS = [
  { id: 'vehicles', label: '1. รายงานทะเบียนรถบริษัททั้งหมด', desc: 'ข้อมูลรถ สถานะ เลขไมล์ล่าสุด แผนก จำนวนครั้งซ่อม' },
  { id: 'vehicle_costs', label: '2. รายงานค่าใช้จ่ายรายคัน', desc: 'สรุปค่าแรง ค่าอะไหล่ และค่าใช้จ่ายรวมต่อคัน' },
  { id: 'parts_by_vehicle', label: '3. รายงานการใช้อะไหล่ตามทะเบียนรถ', desc: 'ตรวจสอบย้อนหลังว่ารถแต่ละคันเบิกอะไหล่ใดไปบ้าง' },
  { id: 'inventory_stock', label: '4. รายงานสต็อกคงเหลือและมูลค่าพัสดุ', desc: 'ยอดคงเหลือ จุดสั่งซื้อ และมูลค่าทุนรวม' },
  { id: 'stock_movement', label: '5. รายงานรับเข้าและเบิกจ่ายอะไหล่', desc: 'ประวัติความเคลื่อนไหวสต็อกทั้งหมด' },
  { id: 'low_stock', label: '6. รายงานอะไหล่ใกล้หมดและหมดสต็อก', desc: 'รายการพัสดุที่ต่ำกว่าเกณฑ์ขั้นต่ำที่ต้องสั่งซื้อ' },
  { id: 'maintenance_due', label: '7. รายงานรถครบกำหนดบำรุงรักษา', desc: 'รายการรถที่ถึงรอบเวลาหรือระยะทางที่ต้องเข้าตรวจเช็ก' },
  { id: 'pending_repairs', label: '8. รายงานงานซ่อมที่ค้างอยู่', desc: 'งานซ่อมที่ยังเปิดอยู่ รออะไหล่ หรืออยู่ระหว่างซ่อม' },
]

const THAI_MONTHS = [
  { val: 'ม.ค.', label: 'มกราคม (ม.ค.)' },
  { val: 'ก.พ.', label: 'กุมภาพันธ์ (ก.พ.)' },
  { val: 'มี.ค.', label: 'มีนาคม (มี.ค.)' },
  { val: 'เม.ย.', label: 'เมษายน (เม.ย.)' },
  { val: 'พ.ค.', label: 'พฤษภาคม (พ.ค.)' },
  { val: 'มิ.ย.', label: 'มิถุนายน (มิ.ย.)' },
  { val: 'ก.ค.', label: 'กรกฎาคม (ก.ค.)' },
  { val: 'ส.ค.', label: 'สิงหาคม (ส.ค.)' },
  { val: 'ก.ย.', label: 'กันยายน (ก.ย.)' },
  { val: 'ต.ค.', label: 'ตุลาคม (ต.ค.)' },
  { val: 'พ.ย.', label: 'พฤศจิกายน (พ.ย.)' },
  { val: 'ธ.ค.', label: 'ธันวาคม (ธ.ค.)' },
]

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('vehicles')
  const [period, setPeriod] = useState<string>('month') // '7days', 'month', 'year', 'custom', 'all'
  const [selectedMonth, setSelectedMonth] = useState<string>('ก.ค.')
  const [selectedYear, setSelectedYear] = useState<string>('2569')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const [reportResult, setReportResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Sorting
  const [sortCol, setSortCol] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchReport = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('type', selectedReport)
      params.append('period', period)
      if (period === 'month') {
        params.append('month', selectedMonth)
        params.append('year', selectedYear)
      } else if (period === 'year') {
        params.append('year', selectedYear)
      } else if (period === 'custom') {
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
      }

      const res = await fetch(`/api/reports?${params.toString()}`)
      const json = await res.json()
      setReportResult(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [selectedReport, period, selectedMonth, selectedYear, startDate, endDate])

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortOrder('desc')
    }
  }

  const renderSortIndicator = (col: string) => {
    if (sortCol !== col) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 inline-block" />
    }
    return sortOrder === 'desc' ? (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 ml-1 inline-block font-bold" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 ml-1 inline-block font-bold" />
    )
  }

  // Filtered and Sorted Rows
  const rows = useMemo(() => {
    if (!reportResult?.data || !Array.isArray(reportResult.data)) return []

    let data = [...reportResult.data]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      data = data.filter((row) =>
        Object.values(row).some((val) =>
          String(val || '').toLowerCase().includes(q)
        )
      )
    }

    if (sortCol) {
      data.sort((a, b) => {
        const valA = a[sortCol] ?? ''
        const valB = b[sortCol] ?? ''
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA
        }
        return sortOrder === 'asc'
          ? String(valA).localeCompare(String(valB), 'th')
          : String(valB).localeCompare(String(valA), 'th')
      })
    }

    return data
  }, [reportResult, search, sortCol, sortOrder])

  const exportToExcel = () => {
    if (!rows || rows.length === 0) return

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงาน')

    const currentTitle = REPORT_OPTIONS.find((r) => r.id === selectedReport)?.label || selectedReport
    const fileName = `${currentTitle}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  const exportToCSV = () => {
    if (!rows || rows.length === 0) return

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet)

    const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const currentTitle = REPORT_OPTIONS.find((r) => r.id === selectedReport)?.label || selectedReport
    link.setAttribute('download', `${currentTitle}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ศูนย์รายงานและส่งออกข้อมูล (Reports)</h1>
          <p className="text-sm text-slate-500 mt-1">
            รายงานสถิติ fleet management สรุปยอดค่าใช้จ่าย คลังอะไหล่ และส่งออก Excel / CSV
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={!rows.length}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            ส่งออก CSV
          </button>
          <button
            onClick={exportToExcel}
            disabled={!rows.length}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40 shadow-sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            ส่งออก Excel (.xlsx)
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm"
            title="พิมพ์รายงาน"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Report Type Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {REPORT_OPTIONS.map((rep) => (
          <button
            key={rep.id}
            onClick={() => {
              setSelectedReport(rep.id)
              setSearch('')
              setSortCol('')
            }}
            className={`p-3.5 rounded-xl border text-left transition ${
              selectedReport === rep.id
                ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-500'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="text-xs font-bold text-slate-800">{rep.label}</div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{rep.desc}</div>
          </button>
        ))}
      </div>

      {/* Period Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5 mr-1">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>ช่วงเวลาแสดงผล:</span>
            </span>

            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setPeriod('7days')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  period === '7days' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setPeriod('month')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  period === 'month' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายเดือน
              </button>
              <button
                type="button"
                onClick={() => setPeriod('year')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  period === 'year' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายปี
              </button>
              <button
                type="button"
                onClick={() => setPeriod('custom')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  period === 'custom' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                กำหนดเอง
              </button>
              <button
                type="button"
                onClick={() => setPeriod('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  period === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                แสดงทั้งหมด
              </button>
            </div>

            {/* Month & Year Selectors */}
            {period === 'month' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-blue-500"
                >
                  {THAI_MONTHS.map((m) => (
                    <option key={m.val} value={m.val}>
                      {m.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-blue-500"
                >
                  <option value="2569">ปี พ.ศ. 2569</option>
                  <option value="2568">ปี พ.ศ. 2568</option>
                  <option value="2567">ปี พ.ศ. 2567</option>
                </select>
              </div>
            )}

            {/* Year Selector */}
            {period === 'year' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-blue-500"
              >
                <option value="2569">ปี พ.ศ. 2569</option>
                <option value="2568">ปี พ.ศ. 2568</option>
                <option value="2567">ปี พ.ศ. 2567</option>
              </select>
            )}

            {/* Custom Dates */}
            {period === 'custom' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                />
                <span className="text-slate-400">ถึง</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReport}
              className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
              title="โหลดข้อมูลใหม่"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาข้อความในรายงานนี้..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-blue-500"
            />
          </div>

          <div className="text-xs text-slate-500">
            แสดงผล <span className="font-bold text-slate-800">{rows.length}</span> รายการ
          </div>
        </div>
      </div>

      {/* Report Data Table Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            {REPORT_OPTIONS.find((r) => r.id === selectedReport)?.label} ({rows.length} รายการ)
          </span>
          <span className="text-[11px] text-slate-400">
            คลิกที่หัวตารางเพื่อเรียงลำดับ (High to Low / Low to High)
          </span>
        </div>

        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">กำลังประมวลผลรายงาน...</div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              ไม่พบข้อมูลในช่วงเวลาที่เลือก
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-bold text-slate-600 select-none">
                <tr>
                  {Object.keys(rows[0]).map((key) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <span>{key}</span>
                        {renderSortIndicator(key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {Object.values(row).map((val: any, j: number) => (
                      <td key={j} className="px-4 py-2.5 whitespace-nowrap text-xs">
                        {typeof val === 'number'
                          ? val.toLocaleString()
                          : val !== null && val !== undefined
                          ? String(val)
                          : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
