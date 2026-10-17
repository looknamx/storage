'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Car,
  ArrowLeft,
  Gauge,
  Wrench,
  Package,
  CalendarCheck,
  Clock,
  History,
  AlertTriangle,
  Edit,
  Plus,
  Save,
  X,
  FileText,
  Trash2,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import {
  formatDate,
  formatCurrency,
  getStatusLabel,
  getStatusColor,
  formatNumber,
} from '@/lib/utils'

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'repairs' | 'parts' | 'maintenance' | 'mileage'>('overview')

  // Feedback Messages
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const [deleteError, setDeleteError] = useState('')

  // Delete State
  const [orderToDelete, setOrderToDelete] = useState<any>(null)
  const [issueToDelete, setIssueToDelete] = useState<any>(null)
  const [planToDelete, setPlanToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Quick Mileage Update Modal
  const [isMileageModalOpen, setIsMileageModalOpen] = useState(false)
  const [newMileage, setNewMileage] = useState<number>(0)
  const [mileageReason, setMileageReason] = useState('')
  const [mileageError, setMileageError] = useState('')
  const [allowLowerMileage, setAllowLowerMileage] = useState(false)
  const [updatingMileage, setUpdatingMileage] = useState(false)

  const fetchVehicleDetail = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/vehicles/${id}`)
      if (!res.ok) {
        throw new Error('ไม่พบข้อมูลรถ')
      }
      const json = await res.json()
      setData(json)
      setNewMileage(json.vehicle.currentMileage)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchVehicleDetail()
  }, [id])

  const handleUpdateMileage = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingMileage(true)
    setMileageError('')

    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentMileage: newMileage,
          mileageReason,
          allowLowerMileage,
        }),
      })

      const resData = await res.json()

      if (!res.ok) {
        setMileageError(resData.error || 'เกิดข้อผิดพลาดในการอัปเดตเลขไมล์')
        if (resData.requiresConfirmation) {
          setAllowLowerMileage(true)
        }
        return
      }

      setIsMileageModalOpen(false)
      setAllowLowerMileage(false)
      setMileageReason('')
      fetchVehicleDetail()
    } catch (err: any) {
      setMileageError(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setUpdatingMileage(false)
    }
  }

  const handleDeleteRepairOrder = async () => {
    if (!orderToDelete) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/repair-orders/${orderToDelete.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) {
        setDeleteError(json.error || 'เกิดข้อผิดพลาดในการลบใบงาน')
        return
      }
      setDeleteSuccess(json.message || 'ลบใบงานซ่อมสำเร็จ')
      setOrderToDelete(null)
      fetchVehicleDetail()
    } catch (err: any) {
      setDeleteError(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteIssue = async () => {
    if (!issueToDelete) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/stock/issue?id=${issueToDelete.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) {
        setDeleteError(json.error || 'เกิดข้อผิดพลาดในการลบใบเบิก')
        return
      }
      setDeleteSuccess(json.message || 'ลบใบเบิกและคืนสต็อกสำเร็จ')
      setIssueToDelete(null)
      fetchVehicleDetail()
    } catch (err: any) {
      setDeleteError(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeletePlan = async () => {
    if (!planToDelete) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/maintenance?id=${planToDelete.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) {
        setDeleteError(json.error || 'เกิดข้อผิดพลาดในการลบแผนซ่อมบำรุง')
        return
      }
      setDeleteSuccess(json.message || 'ลบแผนซ่อมบำรุงสำเร็จ')
      setPlanToDelete(null)
      fetchVehicleDetail()
    } catch (err: any) {
      setDeleteError(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-slate-400">กำลังโหลดรายละเอียดรถ...</div>
  }

  if (!data?.vehicle) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-600 font-medium">ไม่พบข้อมูลรถในระบบ</p>
        <Link href="/vehicles" className="mt-4 inline-block text-blue-600 text-sm">
          ← กลับหน้ารายการรถ
        </Link>
      </div>
    )
  }

  const { vehicle, statistics } = data

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/vehicles"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">{vehicle.licensePlate}</h1>
              <span className="text-slate-400 text-sm">({vehicle.province})</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                  vehicle.status
                )}`}
              >
                {getStatusLabel(vehicle.status)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              รหัสรถ: <span className="font-mono font-medium">{vehicle.code}</span> • ยี่ห้อ:{' '}
              <span className="font-medium text-slate-700">
                {vehicle.brand} {vehicle.model}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setNewMileage(vehicle.currentMileage)
            setMileageError('')
            setAllowLowerMileage(false)
            setIsMileageModalOpen(true)
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition"
        >
          <Gauge className="h-4 w-4" />
          อัปเดตเลขไมล์ ({vehicle.currentMileage.toLocaleString()} กม.)
        </button>
      </div>

      {/* Summary KPI Cards for this vehicle */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">ค่าซ่อมบำรุงสะสมทั้งหมด</span>
          <div className="text-xl font-bold text-slate-800 mt-1">
            {formatCurrency(statistics.totalRepairCost)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            รวมค่าอะไหล่ {formatCurrency(statistics.totalPartsCost)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">ประวัติการเข้าซ่อม</span>
          <div className="text-xl font-bold text-blue-600 mt-1">
            {statistics.totalRepairOrders} ครั้ง
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ล่าสุด: {statistics.lastRepairDate ? formatDate(statistics.lastRepairDate) : 'ยังไม่มี'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">เลขไมล์ปัจจุบัน</span>
          <div className="text-xl font-bold text-slate-800 mt-1">
            {vehicle.currentMileage.toLocaleString()} กม.
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            อัปเดต: {vehicle.mileageDate ? formatDate(vehicle.mileageDate) : '-'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">แผนซ่อมบำรุงที่ต้องทำ</span>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {vehicle.maintenancePlans?.length || 0} รายการ
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {vehicle.maintenancePlans?.some((p: any) => p.status === 'overdue')
              ? '⚠️ มีรายการเกินกำหนด'
              : 'ตามรอบปกติ'}
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {deleteSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{deleteSuccess}</span>
          </div>
          <button onClick={() => setDeleteSuccess('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {deleteError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{deleteError}</span>
          </div>
          <button onClick={() => setDeleteError('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4 text-sm font-medium">
        {[
          { id: 'overview', label: 'ข้อมูลประจำรถ' },
          { id: 'repairs', label: `ประวัติการซ่อม (${vehicle.repairOrders?.length || 0})` },
          { id: 'parts', label: `อะไหล่ที่เคยใช้ (${vehicle.partIssues?.length || 0})` },
          { id: 'maintenance', label: `แผนซ่อมบำรุง (${vehicle.maintenancePlans?.length || 0})` },
          { id: 'mileage', label: 'ประวัติเลขไมล์' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 border-b-2 font-medium transition ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 text-sm border-b pb-2">ข้อมูลทางเทคนิค</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-slate-400">ยี่ห้อ / รุ่น:</span>
              <span className="font-medium text-slate-800">{vehicle.brand} {vehicle.model}</span>
              <span className="text-slate-400">ประเภทรถ:</span>
              <span className="font-medium text-slate-800">{vehicle.vehicleType}</span>
              <span className="text-slate-400">ปีที่ผลิต (พ.ศ./ค.ศ.):</span>
              <span className="font-medium text-slate-800">{vehicle.year || '-'}</span>
              <span className="text-slate-400">เลขตัวถัง (VIN):</span>
              <span className="font-mono text-slate-800">{vehicle.vin || '-'}</span>
              <span className="text-slate-400">เลขเครื่องยนต์:</span>
              <span className="font-mono text-slate-800">{vehicle.engineNumber || '-'}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 text-sm border-b pb-2">การใช้งานและผู้รับผิดชอบ</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-slate-400">หน่วยงาน / แผนก:</span>
              <span className="font-medium text-slate-800">{vehicle.department || '-'}</span>
              <span className="text-slate-400">ผู้ดูแลรถ / ผู้รับผิดชอบ:</span>
              <span className="font-medium text-slate-800">{vehicle.responsiblePerson || '-'}</span>
              <span className="text-slate-400">วันที่เริ่มใช้งาน:</span>
              <span className="font-medium text-slate-800">
                {vehicle.startDate ? formatDate(vehicle.startDate) : '-'}
              </span>
              <span className="text-slate-400">หมายเหตุ:</span>
              <span className="text-slate-700">{vehicle.notes || '-'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Repairs History */}
      {activeTab === 'repairs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {vehicle.repairOrders?.length > 0 ? (
              vehicle.repairOrders.map((ro: any) => (
                <div key={ro.id} className="p-5 hover:bg-slate-50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/repair-orders/${ro.id}`}
                        className="font-mono font-bold text-slate-800 hover:text-blue-600 transition"
                      >
                        {ro.orderNumber}
                      </Link>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusColor(
                          ro.status
                        )}`}
                      >
                        {getStatusLabel(ro.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold text-slate-800">
                        ค่าใช้จ่ายรวม: {formatCurrency(ro.totalCost)}
                      </div>
                      <Link
                        href={`/repair-orders/${ro.id}`}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg inline-block transition"
                        title="ดูรายละเอียดใบงาน"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setOrderToDelete(ro)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg inline-block transition"
                        title="ลบใบงานนี้"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 mt-2 font-medium">
                    อาการ: {ro.reportedSymptoms}
                  </p>
                  {ro.diagnosis && (
                    <p className="text-xs text-slate-500 mt-1">ผลตรวจ: {ro.diagnosis}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400 border-t pt-2">
                    <span>วันที่เข้าซ่อม: {formatDate(ro.orderDate)}</span>
                    <span>ไมล์เข้าซ่อม: {ro.mileageAtRepair?.toLocaleString() || '-'} กม.</span>
                    <span>ผู้รับผิดชอบ: {ro.assignedTo || '-'}</span>
                    <span>ค่าแรง: {formatCurrency(ro.laborCost)}</span>
                    <span>ค่าอะไหล่: {formatCurrency(ro.partsCost)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                ยังไม่มีประวัติการเปิดใบงานซ่อมสำหรับรถคันนี้
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Parts Used */}
      {activeTab === 'parts' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-5 py-3">วันที่เบิก</th>
                  <th className="px-5 py-3">เลขที่ใบเบิก</th>
                  <th className="px-5 py-3">รายการอะไหล่</th>
                  <th className="px-5 py-3 text-right">จำนวน</th>
                  <th className="px-5 py-3 text-right">มูลค่า</th>
                  <th className="px-5 py-3 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicle.partIssues?.length > 0 ? (
                  vehicle.partIssues.map((iss: any) =>
                    iss.items.map((it: any) => (
                      <tr key={it.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 text-xs">{formatDate(iss.issueDate)}</td>
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">
                          {iss.issueNumber}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-800">{it.part.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{it.part.code}</div>
                        </td>
                        <td className="px-5 py-3 text-right font-medium">
                          {it.quantity} {it.part.unit}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-800">
                          {formatCurrency(it.totalCost)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setIssueToDelete(iss)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg inline-block transition"
                            title="ลบใบเบิกนี้และคืนสต็อกอัตโนมัติ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-slate-400">
                      ยังไม่มีประวัติการเบิกอะไหล่ไปใช้กับรถคันนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Maintenance Plans */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {vehicle.maintenancePlans?.length > 0 ? (
              vehicle.maintenancePlans.map((plan: any) => (
                <div key={plan.id} className="p-5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{plan.name}</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          plan.status === 'overdue'
                            ? 'bg-rose-100 text-rose-700'
                            : plan.status === 'upcoming'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {plan.status === 'overdue'
                          ? 'เกินกำหนด'
                          : plan.status === 'upcoming'
                          ? 'ใกล้ครบกำหนด'
                          : 'ปกติ'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      รอบการทำ: ทุก {plan.intervalMonths ? `${plan.intervalMonths} เดือน` : ''}{' '}
                      {plan.intervalKm ? `หรือ ${plan.intervalKm.toLocaleString()} กม.` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs">
                      <div className="font-semibold text-slate-800">
                        ครบกำหนด: {plan.nextDueDate ? formatDate(plan.nextDueDate) : '-'}
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        หรือ {plan.nextDueMileage ? `${plan.nextDueMileage.toLocaleString()} กม.` : '-'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlanToDelete(plan)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg inline-block transition"
                      title="ลบแผนซ่อมบำรุงนี้"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                ยังไม่มีการตั้งค่าแผนซ่อมบำรุงสำหรับรถคันนี้
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Mileage History */}
      {activeTab === 'mileage' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
              <tr>
                <th className="px-5 py-3">วันที่บันทึก</th>
                <th className="px-5 py-3">เลขไมล์</th>
                <th className="px-5 py-3">แหล่งที่มา</th>
                <th className="px-5 py-3">หมายเหตุ / เหตุผล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicle.odometerReadings?.map((odo: any) => (
                <tr key={odo.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-xs">{formatDate(odo.readingDate)}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">
                    {odo.reading.toLocaleString()} กม.
                  </td>
                  <td className="px-5 py-3 text-xs">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                        odo.source === 'transport_job'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : odo.source === 'repair_order'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {odo.source === 'transport_job'
                        ? '🚛 งานขนส่ง (ฝ่ายการตลาด)'
                        : odo.source === 'repair_order'
                        ? '🔧 ใบสั่งซ่อม'
                        : odo.source === 'manual'
                        ? '✏️ บันทึกด้วยตนเอง'
                        : odo.source}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{odo.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Quick Mileage Update */}
      {isMileageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">อัปเดตเลขไมล์รถ {vehicle.licensePlate}</h3>
              <button
                onClick={() => setIsMileageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {mileageError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                {mileageError}
              </div>
            )}

            <form onSubmit={handleUpdateMileage} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เลขไมล์ปัจจุบันเดิม
                </label>
                <div className="text-sm font-semibold text-slate-500">
                  {vehicle.currentMileage.toLocaleString()} กม.
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เลขไมล์ใหม่ (กม.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={newMileage}
                  onChange={(e) => setNewMileage(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เหตุผล / หมายเหตุการอัปเดต
                </label>
                <input
                  type="text"
                  placeholder="เช่น ตรวจเช็กประจำสัปดาห์, ปรับยอดเนื่องจากกรอกผิด"
                  value={mileageReason}
                  onChange={(e) => setMileageReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500"
                />
              </div>

              {allowLowerMileage && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <div className="font-bold mb-1">⚠️ ยืนยันการปรับลดเลขไมล์:</div>
                  คุณกำลังจะบันทึกเลขไมล์ที่น้อยกว่าประวัติเดิม กรุณากดปุ่มด้านล่างเพื่อยืนยันการแก้ไข
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsMileageModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={updatingMileage}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingMileage ? 'กำลังบันทึก...' : 'ยืนยันอัปเดตเลขไมล์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Repair Order */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการลบใบงานซ่อม</h3>
                <p className="text-xs text-slate-500 font-mono">{orderToDelete.orderNumber}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1.5 mb-5">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                ข้อควรทราบก่อนการลบ:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                <li>ข้อมูลรายการซ่อม ค่าแรง และผลตรวจในใบงานนี้จะถูกลบออกจากระบบ</li>
                <li>
                  หากรถกำลังอยู่ในสถานะซ่อม ระบบจะปรับสถานะรถกลับเป็น <strong>&quot;พร้อมใช้งาน&quot;</strong> โดยอัตโนมัติ
                </li>
                <li>ยอดค่าใช้จ่ายสะสมของรถคันนี้จะถูกคำนวณใหม่โดยอัตโนมัติ</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteRepairOrder}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
              >
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบใบงาน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Part Issue */}
      {issueToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการลบใบเบิกอะไหล่</h3>
                <p className="text-xs text-slate-500 font-mono">{issueToDelete.issueNumber}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1.5 mb-5">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                ผลกระทบเมื่อทำการลบใบเบิกนี้:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                <li>
                  จำนวนอะไหล่ที่ยังไม่ได้คืน จะถูก<strong>คืนสต็อกกลับเข้าคลังอัตโนมัติ</strong>
                </li>
                <li>
                  ต้นทุนอะไหล่ในใบงานซ่อมจะถูกปรับลดยอดลง {formatCurrency(issueToDelete.totalAmount)}
                </li>
                <li>ประวัติการเบิกใช้อะไหล่ของรถคันนี้จะถูกลบออก</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIssueToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteIssue}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
              >
                {isDeleting ? 'กำลังลบและคืนสต็อก...' : 'ยืนยันลบใบเบิกนี้'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Maintenance Plan */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการลบแผนซ่อมบำรุง</h3>
                <p className="text-xs text-slate-500">{planToDelete.name}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1.5 mb-5">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                ข้อควรทราบก่อนการลบ:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                <li>ประวัติการบันทึกทำเสร็จของแผนนี้ทั้งหมดจะถูกลบออกจากระบบ</li>
                <li>การดำเนินการนี้ไม่สามารถยกเลิกย้อนหลังได้</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPlanToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeletePlan}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
              >
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบแผนนี้'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

