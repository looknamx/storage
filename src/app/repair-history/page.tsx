'use client'

import React, { useState, useEffect } from 'react'
import {
  History,
  Search,
  Filter,
  Eye,
  Calendar,
  Car,
  Download,
  DollarSign,
  Wrench,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react'
import Link from 'next/link'
import {
  formatDate,
  formatCurrency,
  getStatusLabel,
  getStatusColor,
} from '@/lib/utils'

export default function RepairHistoryPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const fetchHistory = async () => {
    try {
      setLoading(true)
      let url = `/api/repair-orders?search=${encodeURIComponent(search)}`
      if (yearFilter) url += `&year=${yearFilter}`
      if (monthFilter) url += `&month=${monthFilter}`
      const res = await fetch(url)
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [yearFilter, monthFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchHistory()
  }

  const handleDeleteRepairOrder = async (ro: any) => {
    const confirmMsg = `คุณต้องการลบประวัติใบงานซ่อมเลขที่ "${ro.orderNumber}" (รถ ${ro.vehicle.licensePlate}) ใช่หรือไม่?\n\n*หมายเหตุ: การลบใบงานจะลบรายการงานซ่อมในใบงานนี้ด้วย`
    if (!confirm(confirmMsg)) return

    try {
      setErrorMessage('')
      const res = await fetch(`/api/repair-orders/${ro.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'ไม่สามารถลบใบงานซ่อมได้')
        return
      }

      setSuccessMessage(data.message || 'ลบใบงานซ่อมเรียบร้อยแล้ว')
      fetchHistory()
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการลบ')
    }
  }

  // Calculate overall metrics
  const totalCostAll = orders.reduce((acc, ro) => acc + ro.totalCost, 0)
  const totalPartsAll = orders.reduce((acc, ro) => acc + ro.partsCost, 0)
  const totalLaborAll = orders.reduce((acc, ro) => acc + ro.laborCost, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ประวัติการซ่อมบำรุง (Repair History)</h1>
          <p className="text-sm text-slate-500 mt-1">
            สืบค้นประวัติการซ่อมรถทุกคัน การใช้อะไหล่ และจัดการลบประวัติงานซ่อม
          </p>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-400">ใบงานซ่อมทั้งหมดในประวัติ</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">{orders.length} รายการ</div>
          <div className="text-[11px] text-slate-400 mt-0.5">รวมทุกสถานะ</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-400">ค่าซ่อมสะสมรวมทั้งหมด</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalCostAll)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            ค่าแรง {formatCurrency(totalLaborAll)} + ค่าอะไหล่ {formatCurrency(totalPartsAll)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-400">งานซ่อมที่ส่งมอบรถแล้ว</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {orders.filter((ro) => ['completed', 'delivered'].includes(ro.status)).length} คัน
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">ซ่อมเสร็จสมบูรณ์</div>
        </div>
      </div>

      {/* Search & Month Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาประวัติ: ทะเบียนรถ, ยี่ห้อ, เลขที่ใบงาน, อาการที่ซ่อม, ผู้รับผิดชอบ..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-blue-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Year Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium shrink-0">ปี:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg text-xs font-medium border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">ทุกปี (ทั้งหมด)</option>
              {(() => {
                const currentBE = new Date().getFullYear() + 543
                return [currentBE, currentBE - 1, currentBE - 2].map((yr) => (
                  <option key={yr} value={String(yr)}>
                    ปี พ.ศ. {yr}
                  </option>
                ))
              })()}
            </select>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium shrink-0">เดือน:</span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg text-xs font-medium border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">ทุกเดือน</option>
              {[
                { num: '1', name: 'ม.ค.' },
                { num: '2', name: 'ก.พ.' },
                { num: '3', name: 'มี.ค.' },
                { num: '4', name: 'เม.ย.' },
                { num: '5', name: 'พ.ค.' },
                { num: '6', name: 'มิ.ย.' },
                { num: '7', name: 'ก.ค.' },
                { num: '8', name: 'ส.ค.' },
                { num: '9', name: 'ก.ย.' },
                { num: '10', name: 'ต.ค.' },
                { num: '11', name: 'พ.ย.' },
                { num: '12', name: 'ธ.ค.' },
              ].map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">วันที่ / เลขที่ใบงาน</th>
                <th className="px-5 py-3.5">ทะเบียนรถ / แผนก</th>
                <th className="px-5 py-3.5">อาการและรายการซ่อม</th>
                <th className="px-5 py-3.5 text-right">ไมล์เข้าซ่อม</th>
                <th className="px-5 py-3.5 text-right">ค่าใช้จ่ายรวม</th>
                <th className="px-5 py-3.5 text-center">สถานะ</th>
                <th className="px-5 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-xs text-slate-400">
                    กำลังโหลดประวัติ...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-xs">
                    ไม่พบรายการประวัติการซ่อม
                  </td>
                </tr>
              ) : (
                orders.map((ro) => (
                  <tr key={ro.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-slate-800 text-xs">
                        {ro.orderNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(ro.orderDate)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/vehicles/${ro.vehicleId}`}
                        className="font-bold text-slate-800 hover:text-blue-600"
                      >
                        {ro.vehicle.licensePlate}
                      </Link>
                      <div className="text-xs text-slate-400">
                        {ro.vehicle.brand} {ro.vehicle.model} • {ro.department || '-'}
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <div className="font-medium text-slate-800 text-xs line-clamp-1">
                        {ro.reportedSymptoms}
                      </div>
                      {ro.diagnosis && (
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          ผลตรวจ: {ro.diagnosis}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-700 text-xs">
                      {ro.mileageAtRepair ? `${ro.mileageAtRepair.toLocaleString()} กม.` : '-'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="font-bold text-slate-800 text-xs">
                        {formatCurrency(ro.totalCost)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        (อะไหล่ {formatCurrency(ro.partsCost)})
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusColor(
                          ro.status
                        )}`}
                      >
                        {getStatusLabel(ro.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/repair-orders/${ro.id}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg inline-block"
                          title="ดูรายละเอียดใบงาน"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteRepairOrder(ro)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg inline-block transition"
                          title="ลบใบงานซ่อมนี้"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
