'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Wrench,
  ArrowLeft,
  Car,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Plus,
  Save,
  Printer,
  X,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import {
  formatDate,
  formatCurrency,
  getStatusLabel,
  getStatusColor,
} from '@/lib/utils'
import ThaiDatePicker from '@/components/ui/ThaiDatePicker'

export default function RepairOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit / Close Order Form State
  const [status, setStatus] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [laborCost, setLaborCost] = useState(0)
  const [otherCost, setOtherCost] = useState(0)
  const [completedDate, setCompletedDate] = useState('')
  const [deliveredDate, setDeliveredDate] = useState('')
  const [testResult, setTestResult] = useState('')
  const [notes, setNotes] = useState('')

  const handleDeleteOrder = async () => {
    setIsDeleting(true)
    setErrorMessage('')
    try {
      const res = await fetch(`/api/repair-orders/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error || 'ไม่สามารถลบใบงานซ่อมได้')
        setIsDeleting(false)
        return
      }
      router.push('/repair-orders')
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
      setIsDeleting(false)
    }
  }

  const fetchOrderDetail = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/repair-orders/${id}`)
      if (!res.ok) throw new Error('ไม่พบข้อมูลใบงาน')
      const json = await res.json()
      setOrder(json)

      // Initialize form values
      setStatus(json.status)
      setDiagnosis(json.diagnosis || '')
      setAssignedTo(json.assignedTo || '')
      setLaborCost(json.laborCost || 0)
      setOtherCost(json.otherCost || 0)
      setCompletedDate(
        json.completedDate ? new Date(json.completedDate).toISOString().split('T')[0] : ''
      )
      setDeliveredDate(
        json.deliveredDate ? new Date(json.deliveredDate).toISOString().split('T')[0] : ''
      )
      setTestResult(json.testResult || '')
      setNotes(json.notes || '')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchOrderDetail()
  }, [id])

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const res = await fetch(`/api/repair-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          diagnosis,
          assignedTo,
          laborCost,
          otherCost,
          completedDate: completedDate || null,
          deliveredDate: deliveredDate || null,
          testResult,
          notes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการอัปเดต')
        return
      }

      setSuccessMessage('อัปเดตข้อมูลใบงานซ่อมสำเร็จ')
      fetchOrderDetail()
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถบันทึกได้')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-slate-400">กำลังโหลดข้อมูลใบงาน...</div>
  }

  if (!order) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-600 font-medium">ไม่พบใบงานซ่อม</p>
        <Link href="/repair-orders" className="mt-4 inline-block text-blue-600 text-sm">
          ← กลับหน้ารายการใบงาน
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/repair-orders"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono text-slate-800">{order.orderNumber}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              วันที่เปิดงาน: {formatDate(order.orderDate)} • รถประจำงาน:{' '}
              <Link
                href={`/vehicles/${order.vehicleId}`}
                className="font-bold text-blue-600 hover:underline"
              >
                {order.vehicle.licensePlate} ({order.vehicle.brand} {order.vehicle.model})
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/stock-out"
            className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 transition"
          >
            + เบิกอะไหล่เข้าใบงานนี้
          </Link>
          <button
            onClick={() => window.print()}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
            title="พิมพ์ใบงาน"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            title="ลบใบงานนี้"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Cost Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">ค่าแรงช่าง (Labor)</span>
          <div className="text-lg font-bold text-slate-800 mt-1">
            {formatCurrency(order.laborCost)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">ค่าอะไหล่ตามจริง (Parts)</span>
          <div className="text-lg font-bold text-indigo-600 mt-1">
            {formatCurrency(order.partsCost)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            จากใบเบิกที่ยืนยันแล้ว {order.partIssues?.length || 0} ใบ
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">ค่าใช้จ่ายอื่น (Other)</span>
          <div className="text-lg font-bold text-slate-700 mt-1">
            {formatCurrency(order.otherCost)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-blue-50/30">
          <span className="text-xs text-blue-600 font-bold">ยอดค่าใช้จ่ายรวมทั้งสิ้น</span>
          <div className="text-xl font-bold text-blue-700 mt-1">
            {formatCurrency(order.totalCost)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Edit & Update Status (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleUpdateOrder}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold text-slate-800">
                ปรับปรุงสถานะและรายละเอียดการซ่อม
              </h2>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  สถานะงานซ่อม
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500 font-semibold"
                >
                  <option value="open">เปิดงานใหม่</option>
                  <option value="inspecting">รอตรวจสอบ / ประเมินราคา</option>
                  <option value="waiting_parts">รออะไหล่</option>
                  <option value="repairing">กำลังดำเนินการซ่อม</option>
                  <option value="testing">รอทดสอบหลังซ่อม</option>
                  <option value="completed">ซ่อมเสร็จเรียบร้อย</option>
                  <option value="delivered">ส่งมอบรถคืนหน่วยงาน</option>
                  <option value="cancelled">ยกเลิกใบงาน</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ช่างผู้รับผิดชอบงาน
                </label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วันที่ซ่อมเสร็จ
                </label>
                <ThaiDatePicker
                  value={completedDate}
                  onChange={setCompletedDate}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วันที่ส่งมอบรถ
                </label>
                <ThaiDatePicker
                  value={deliveredDate}
                  onChange={setDeliveredDate}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ค่าแรงช่าง (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={laborCost}
                  onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ค่าใช้จ่ายอื่น ๆ (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={otherCost}
                  onChange={(e) => setOtherCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ผลการตรวจสอบ / สาเหตุของปัญหา
              </label>
              <textarea
                rows={2}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="ระบุผลการวิเคราะห์ปัญหาของช่าง เช่น จานเบรกเป็นรอย ผ้าเบรกสึก..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ผลการทดสอบหลังการซ่อม (Quality Check)
              </label>
              <input
                type="text"
                placeholder="เช่น ทดลองวิ่ง 10 กม. ระบบเบรกปกติ ไม่พบเสียงดังผิดปกติ"
                value={testResult}
                onChange={(e) => setTestResult(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
              />
            </div>
          </form>

          {/* Parts Issued to this Repair Order */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  อะไหล่ที่เบิกใช้จริงในใบงานนี้ ({order.partIssues?.length || 0} ใบเบิก)
                </h3>
              </div>
              <Link
                href="/stock-out"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + เบิกเพิ่ม
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {order.partIssues?.length > 0 ? (
                order.partIssues.map((iss: any) => (
                  <div key={iss.id} className="py-3 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-mono font-medium">{iss.issueNumber}</span>
                      <span>{formatDate(iss.issueDate)}</span>
                    </div>
                    {iss.items.map((it: any) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium text-slate-800">{it.part.name}</span>
                          <span className="text-slate-400 font-mono ml-2">({it.part.code})</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-slate-700 mr-3">
                            {it.quantity} {it.part.unit} @ {formatCurrency(it.costPerUnit)}
                          </span>
                          <span className="font-bold text-slate-800">
                            {formatCurrency(it.totalCost)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  ยังไม่มีการเบิกอะไหล่สำหรับใบงานนี้ (หากต้องการใช้อะไหล่ ให้ไปที่เมนู &quot;เบิกจ่ายและคืนอะไหล่&quot;)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Card: Vehicle & Info Snapshot (1 col) */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">ข้อมูลรถที่เข้าซ่อม</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">ทะเบียน:</span>
                <span className="font-bold text-slate-800">{order.vehicle.licensePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ยี่ห้อ/รุ่น:</span>
                <span className="font-medium text-slate-700">
                  {order.vehicle.brand} {order.vehicle.model}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">หน่วยงาน:</span>
                <span className="text-slate-700">{order.department || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ผู้แจ้ง:</span>
                <span className="text-slate-700">{order.reportedBy || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ไมล์ตอนเข้าซ่อม:</span>
                <span className="font-semibold text-slate-800">
                  {order.mileageAtRepair ? `${order.mileageAtRepair.toLocaleString()} กม.` : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl text-xs space-y-2 text-amber-900">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              ข้อกำหนดการปิดงานซ่อม
            </h4>
            <p className="text-[11px] leading-relaxed">
              เมื่อเปลี่ยนสถานะเป็น <strong>&quot;ซ่อมเสร็จ&quot;</strong> หรือ{' '}
              <strong>&quot;ส่งมอบรถ&quot;</strong> สถานะของรถจะถูกปรับกลับเป็น{' '}
              <strong>&quot;พร้อมใช้งาน&quot;</strong> โดยอัตโนมัติ
            </p>
          </div>
        </div>
      </div>

      {/* Modal Confirm Delete Repair Order */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการลบใบงานซ่อม</h3>
                <p className="text-xs text-slate-500 font-mono">{order.orderNumber}</p>
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
                  หากรถ {order.vehicle.licensePlate} อยู่ในสถานะกำลังซ่อม ระบบจะปรับสถานะรถกลับเป็น <strong>&quot;พร้อมใช้งาน&quot;</strong> โดยอัตโนมัติ
                </li>
                <li>การดำเนินการนี้ไม่สามารถยกเลิกย้อนหลังได้</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteOrder}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
              >
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบใบงาน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

