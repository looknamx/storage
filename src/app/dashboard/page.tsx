'use client'

import React, { useState, useEffect } from 'react'
import {
  Car,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Clock,
  Package,
  AlertCircle,
  PackageX,
  CalendarClock,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency, getStatusLabel, getStatusColor } from '@/lib/utils'
import ThaiDatePicker from '@/components/ui/ThaiDatePicker'

export default function DashboardPage() {
  const [timeFilter, setTimeFilter] = useState<string>('1month')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [data, setData] = useState<any>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      let url = `/api/dashboard?range=${timeFilter}`
      if (timeFilter === 'custom' && customStart && customEnd) {
        url += `&start=${customStart}&end=${customEnd}`
      }
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`)
      }
      const text = await res.text()
      if (!text) {
        throw new Error('Empty response received from server')
      }
      const json = JSON.parse(text)
      setData(json)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [timeFilter])

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      fetchDashboardData()
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Range Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">แดชบอร์ดภาพรวม (Dashboard)</h1>
          <p className="text-sm text-slate-500 mt-1">
            สรุปสถานะรถบริษัท คลังอะไหล่ และแผนงานซ่อมบำรุง
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          {[
            { id: '7days', label: '7 วัน' },
            { id: '1month', label: '1 เดือน' },
            { id: '6months', label: '6 เดือน' },
            { id: '1year', label: '1 ปี' },
            { id: 'custom', label: 'กำหนดเอง' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                timeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={fetchDashboardData}
            title="รีเฟรชข้อมูล"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Range Selector */}
      {timeFilter === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 bg-blue-50 border border-blue-200 p-3 rounded-xl">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-medium text-blue-800 shrink-0">เลือกช่วงวันที่:</span>
          <div className="w-36">
            <ThaiDatePicker
              value={customStart}
              onChange={setCustomStart}
              placeholder="เริ่มต้น"
            />
          </div>
          <span className="text-xs text-blue-600 shrink-0">ถึง</span>
          <div className="w-36">
            <ThaiDatePicker
              value={customEnd}
              onChange={setCustomEnd}
              placeholder="สิ้นสุด"
            />
          </div>
          <button
            onClick={handleCustomApply}
            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
          >
            นำไปใช้
          </button>
        </div>
      )}

      {/* Summary Cards Grid (10 Cards from Spec) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {/* 1. รถทั้งหมด */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">รถทั้งหมด</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Car className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-800">
              {data?.summary?.totalVehicles ?? '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">คันในระบบ</div>
          </div>
        </div>

        {/* 2. พร้อมใช้งาน */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">พร้อมใช้งาน</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600">
              {data?.summary?.activeVehicles ?? '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">พร้อมวิ่งงาน</div>
          </div>
        </div>

        {/* 3. อยู่ระหว่างซ่อม */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">อยู่ระหว่างซ่อม</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600">
              {data?.summary?.repairingVehicles ?? '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">ซ่อม/รออะไหล่</div>
          </div>
        </div>

        {/* 4. หยุดใช้งาน */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">หยุดใช้งาน/จำหน่าย</span>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-700">
              {data?.summary?.inactiveVehicles ?? '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">งดใช้งานชั่วคราว</div>
          </div>
        </div>

        {/* 5. งานซ่อมค้าง */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">งานซ่อมยังไม่เสร็จ</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600">
              {data?.summary?.pendingRepairs ?? '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">ใบงานเปิดอยู่</div>
          </div>
        </div>

        {/* 6. อะไหล่ทั้งหมด */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">รายการอะไหล่ทั้งหมด</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-800">
              {data?.summary?.totalParts ?? '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">รายการในระบบ</div>
          </div>
        </div>

        {/* 7. อะไหล่ใกล้หมด */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">อะไหล่ใกล้หมด</span>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-orange-600">
              {data?.summary?.lowStockParts ?? '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">ต่ำกว่าเกณฑ์ขั้นต่ำ</div>
          </div>
        </div>

        {/* 8. อะไหล่หมดสต็อก */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">อะไหล่หมดสต็อก</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <PackageX className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-red-600">
              {data?.summary?.outOfStockParts ?? '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">ต้องสั่งซื้อด่วน</div>
          </div>
        </div>

        {/* 9. ใกล้ถึงกำหนดบำรุงรักษา */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">ใกล้ครบกำหนดซ่อมบำรุง</span>
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <CalendarClock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-yellow-600">
              {data?.summary?.upcomingMaintenance ?? '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">ใน 30 วัน/1,000 กม.</div>
          </div>
        </div>

        {/* 10. เกินกำหนดบำรุงรักษา */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">เกินกำหนดซ่อมบำรุง</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600">
              {data?.summary?.overdueMaintenance ?? '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">เลยกำหนดแล้ว</div>
          </div>
        </div>
      </div>

      {/* Main Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: รถที่กำลังซ่อม */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-800">รถที่กำลังดำเนินการซ่อม</h2>
            </div>
            <Link
              href="/repair-orders"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.activeRepairList?.length > 0 ? (
              data.activeRepairList.map((ro: any) => (
                <div key={ro.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">
                        {ro.vehicle.licensePlate}
                      </span>
                      <span className="text-xs text-slate-400">({ro.vehicle.province})</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(
                          ro.status
                        )}`}
                      >
                        {getStatusLabel(ro.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {ro.reportedSymptoms || 'ไม่มีรายละเอียดอาการ'}
                    </p>
                    <div className="text-[11px] text-slate-400 mt-1">
                      ใบงาน: <span className="font-mono text-slate-600">{ro.orderNumber}</span> •
                      ผู้แจ้ง: {ro.reportedBy || '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-800">
                      {formatCurrency(ro.totalCost)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatDate(ro.orderDate)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                ไม่มีรายการรถที่อยู่ระหว่างซ่อมในขณะนี้
              </div>
            )}
          </div>
        </div>

        {/* Table 2: รถที่ต้องเข้าบำรุงรักษา */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-800">รถที่ต้องเข้าบำรุงรักษา</h2>
            </div>
            <Link
              href="/maintenance"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.maintenanceDueList?.length > 0 ? (
              data.maintenanceDueList.map((plan: any) => (
                <div key={plan.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">
                        {plan.vehicle.licensePlate}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          plan.status === 'overdue'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {plan.status === 'overdue' ? 'เกินกำหนด' : 'ใกล้ครบกำหนด'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">{plan.name}</p>
                    <div className="text-[11px] text-slate-400 mt-1">
                      ไมล์ปัจจุบัน: {plan.vehicle.currentMileage.toLocaleString()} กม.
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-700">
                      ครบกำหนด: {plan.nextDueDate ? formatDate(plan.nextDueDate) : '-'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      หรือ {plan.nextDueMileage ? `${plan.nextDueMileage.toLocaleString()} กม.` : '-'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                ไม่มีรถที่ใกล้ถึงหรือเกินกำหนดบำรุงรักษา
              </div>
            )}
          </div>
        </div>

        {/* Table 3: อะไหล่ใกล้หมด / หมดสต็อก */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-slate-800">อะไหล่ใกล้หมดสต็อก</h2>
            </div>
            <Link href="/parts" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              ดูคลังอะไหล่ →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.lowStockList?.length > 0 ? (
              data.lowStockList.map((part: any) => (
                <div key={part.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {part.code}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          part.quantity === 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {part.quantity === 0 ? 'หมดสต็อก' : 'ใกล้หมด'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-800 mt-1 font-medium">{part.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      ตำแหน่ง: {part.location || '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-bold ${
                        part.quantity === 0 ? 'text-red-600' : 'text-orange-600'
                      }`}
                    >
                      {part.quantity} {part.unit}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      ขั้นต่ำ {part.minimumStock} {part.unit}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                ไม่มีรายการอะไหล่ที่ต่ำกว่าเกณฑ์ขั้นต่ำ
              </div>
            )}
          </div>
        </div>

        {/* Table 4: ประวัติการเคลื่อนไหวสต็อกล่าสุด */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-800">การเคลื่อนไหวสต็อกล่าสุด</h2>
            </div>
            <Link href="/parts" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              ดูประวัติทั้งหมด →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.recentActivities?.length > 0 ? (
              data.recentActivities.map((act: any) => (
                <div key={act.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        act.quantity > 0
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {act.quantity > 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        {act.part.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {act.reason ||
                          (act.transactionType === 'receive'
                            ? 'รับเข้าสต็อก'
                            : act.transactionType === 'issue'
                            ? 'เบิกจ่ายอะไหล่'
                            : 'ปรับปรุงยอด')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-bold ${
                        act.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {act.quantity > 0 ? `+${act.quantity}` : act.quantity} {act.part.unit}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatDate(act.transactionDate)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                ยังไม่มีรายการเคลื่อนไหวสต็อก
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
