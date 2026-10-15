'use client'

import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
} from 'lucide-react'
import * as XLSX from 'xlsx'

const REPORT_OPTIONS = [
  { id: 'vehicles', label: '1. รายงานทะเบียนรถบริษัททั้งหมด', desc: 'ข้อมูลรถ สถานะ เลขไมล์ล่าสุด แผนก' },
  { id: 'vehicle_costs', label: '2. รายงานค่าใช้จ่ายรายคัน', desc: 'สรุปค่าแรง ค่าอะไหล่ และค่าใช้จ่ายรวมต่อคัน' },
  { id: 'parts_by_vehicle', label: '3. รายงานการใช้อะไหล่ตามทะเบียนรถ', desc: 'ตรวจสอบย้อนหลังว่ารถแต่ละคันเบิกอะไหล่ใดไปบ้าง' },
  { id: 'inventory_stock', label: '4. รายงานสต็อกคงเหลือและมูลค่าพัสดุ', desc: 'ยอดคงเหลือ จุดสั่งซื้อ และมูลค่าทุนรวม' },
  { id: 'stock_movement', label: '5. รายงานรับเข้าและเบิกจ่ายอะไหล่', desc: 'ประวัติความเคลื่อนไหวสต็อกทั้งหมด' },
  { id: 'low_stock', label: '6. รายงานอะไหล่ใกล้หมดและหมดสต็อก', desc: 'รายการพัสดุที่ต่ำกว่าเกณฑ์ขั้นต่ำที่ต้องสั่งซื้อ' },
  { id: 'maintenance_due', label: '7. รายงานรถครบกำหนดบำรุงรักษา', desc: 'รายการรถที่ถึงรอบเวลาหรือระยะทางที่ต้องเข้าตรวจเช็ก' },
  { id: 'pending_repairs', label: '8. รายงานงานซ่อมที่ค้างอยู่', desc: 'งานซ่อมที่ยังเปิดอยู่ รออะไหล่ หรืออยู่ระหว่างซ่อม' },
]

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('vehicles')
  const [range, setRange] = useState('1month')
  const [reportResult, setReportResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/reports?type=${selectedReport}&range=${range}`)
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
  }, [selectedReport, range])

  const exportToExcel = () => {
    if (!reportResult?.data || reportResult.data.length === 0) return

    const worksheet = XLSX.utils.json_to_sheet(reportResult.data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงาน')

    const fileName = `รายงาน_${selectedReport}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  const exportToCSV = () => {
    if (!reportResult?.data || reportResult.data.length === 0) return

    const worksheet = XLSX.utils.json_to_sheet(reportResult.data)
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet)

    const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `รายงาน_${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
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
            disabled={!reportResult?.data?.length}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            ส่งออก CSV
          </button>
          <button
            onClick={exportToExcel}
            disabled={!reportResult?.data?.length}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-medium transition disabled:opacity-40 shadow-sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            ส่งออก Excel (.xlsx)
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
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
            onClick={() => setSelectedReport(rep.id)}
            className={`p-3.5 rounded-xl border text-left transition ${
              selectedReport === rep.id
                ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="text-xs font-bold text-slate-800">{rep.label}</div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{rep.desc}</div>
          </button>
        ))}
      </div>

      {/* Range filter bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="font-semibold text-slate-700">ช่วงเวลาของข้อมูล:</span>
          <div className="flex items-center gap-1 ml-2">
            {[
              { id: '7days', label: '7 วัน' },
              { id: '1month', label: '1 เดือน' },
              { id: '6months', label: '6 เดือน' },
              { id: '1year', label: '1 ปี' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setRange(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  range === t.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchReport}
          className="p-1.5 text-slate-400 hover:text-slate-600"
          title="โหลดข้อมูลใหม่"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Report Data Table Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            ตัวอย่างข้อมูลในรายงาน ({reportResult?.data?.length || 0} แถว)
          </span>
          <span className="text-[11px] text-slate-400">
            ดึงข้อมูลอ้างอิงจากฐานข้อมูลจริง
          </span>
        </div>

        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">กำลังประมวลผลรายงาน...</div>
          ) : !reportResult?.data || reportResult.data.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              ไม่พบข้อมูลในช่วงเวลาที่เลือก
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-bold text-slate-600">
                <tr>
                  {Object.keys(reportResult.data[0]).map((key) => (
                    <th key={key} className="px-4 py-3 whitespace-nowrap">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportResult.data.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
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

