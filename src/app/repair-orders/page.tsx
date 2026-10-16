'use client'

import React, { useState, useEffect } from 'react'
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Car,
  X,
  Calendar,
  User,
  DollarSign,
  Trash2,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import {
  formatDate,
  formatCurrency,
  getStatusLabel,
  getStatusColor,
} from '@/lib/utils'
import ThaiDatePicker from '@/components/ui/ThaiDatePicker'

interface RepairItemInput {
  description: string
  laborCost: number
  otherCost: number
  notes?: string
}

export default function RepairOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Delete Repair Order State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteRepairOrder = async () => {
    if (!orderToDelete) return
    setIsDeleting(true)
    setErrorMessage('')
    try {
      const res = await fetch(`/api/repair-orders/${orderToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการลบใบงาน')
        return
      }
      setSuccessMessage(data.message || 'ลบใบงานซ่อมสำเร็จ')
      setIsDeleteModalOpen(false)
      setOrderToDelete(null)
      fetchData()
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setIsDeleting(false)
    }
  }

  // Form State
  const [formData, setFormData] = useState({
    vehicleId: '',
    mileageAtRepair: 0,
    reportedBy: '',
    department: '',
    reportedSymptoms: '',
    diagnosis: '',
    assignedTo: '',
    orderDate: new Date().toISOString().split('T')[0],
    vehicleStatus: 'waiting_repair',
  })

  const [repairItems, setRepairItems] = useState<RepairItemInput[]>([
    { description: '', laborCost: 0, otherCost: 0, notes: '' },
  ])

  const fetchData = async () => {
    try {
      setLoading(true)
      let url = `/api/repair-orders?search=${encodeURIComponent(search)}`
      if (statusFilter) url += `&status=${statusFilter}`

      const [ordersRes, vehiclesRes] = await Promise.all([
        fetch(url),
        fetch('/api/vehicles'),
      ])

      const ordersData = await ordersRes.json()
      const vehiclesData = await vehiclesRes.json()

      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData()
  }

  const handleVehicleSelect = (vId: string) => {
    const selected = vehicles.find((v) => v.id === vId)
    setFormData({
      ...formData,
      vehicleId: vId,
      department: selected?.department || '',
      mileageAtRepair: selected?.currentMileage || 0,
    })
  }

  const handleAddItemRow = () => {
    setRepairItems([...repairItems, { description: '', laborCost: 0, otherCost: 0 }])
  }

  const handleRemoveItemRow = (index: number) => {
    if (repairItems.length > 1) {
      setRepairItems(repairItems.filter((_, i) => i !== index))
    }
  }

  const handleItemChange = (index: number, field: keyof RepairItemInput, value: any) => {
    const updated = [...repairItems]
    updated[index] = { ...updated[index], [field]: value }
    setRepairItems(updated)
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    if (!formData.vehicleId) {
      setErrorMessage('กรุณาเลือกรถที่ต้องการเปิดใบงาน')
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/repair-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: repairItems.filter((it) => it.description.trim() !== ''),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการเปิดใบงาน')
        return
      }

      setSuccessMessage(`เปิดใบงานซ่อมเลขที่ ${data.orderNumber} สำเร็จแล้ว`)
      setIsModalOpen(false)
      // Reset form
      setFormData({
        vehicleId: '',
        mileageAtRepair: 0,
        reportedBy: '',
        department: '',
        reportedSymptoms: '',
        diagnosis: '',
        assignedTo: '',
        orderDate: new Date().toISOString().split('T')[0],
        vehicleStatus: 'waiting_repair',
      })
      setRepairItems([{ description: '', laborCost: 0, otherCost: 0 }])
      fetchData()
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ระบบใบงานซ่อมรถบริษัท (Repair Orders)</h1>
          <p className="text-sm text-slate-500 mt-1">
            ออกใบสั่งซ่อม ติดตามสถานะงานซ่อม การใช้อะไหล่ และค่าใช้จ่าย
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMessage('')
            setIsModalOpen(true)
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          เปิดใบงานซ่อมใหม่
        </button>
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาเลขที่ใบงาน, ทะเบียนรถ, อาการ, ช่าง..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-blue-500"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          {[
            { id: '', label: 'ทั้งหมด' },
            { id: 'open', label: 'เปิดงาน' },
            { id: 'repairing', label: 'กำลังซ่อม' },
            { id: 'waiting_parts', label: 'รออะไหล่' },
            { id: 'completed', label: 'ซ่อมเสร็จ' },
            { id: 'delivered', label: 'ส่งมอบแล้ว' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition ${
                statusFilter === st.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">กำลังโหลดรายการใบงานซ่อม...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">ไม่พบรายการใบงานซ่อม</p>
              <p className="text-xs text-slate-400 mt-1">
                คลิกปุ่ม &quot;เปิดใบงานซ่อมใหม่&quot; ด้านบนเพื่อเริ่มบันทึก
              </p>
            </div>
          ) : (
            orders.map((ro) => (
              <div key={ro.id} className="p-5 hover:bg-slate-50 transition">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {ro.orderNumber}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusColor(
                        ro.status
                      )}`}
                    >
                      {getStatusLabel(ro.status)}
                    </span>
                    <span className="text-xs text-slate-400">• {formatDate(ro.orderDate)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-800">
                        {formatCurrency(ro.totalCost)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        (อะไหล่ {formatCurrency(ro.partsCost)} + แรง {formatCurrency(ro.laborCost)})
                      </div>
                    </div>
                    <Link
                      href={`/repair-orders/${ro.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      เปิดใบงาน
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderToDelete(ro)
                        setIsDeleteModalOpen(true)
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="ลบใบงานซ่อมนี้"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Vehicle & Symptom Info */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">รถ:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {ro.vehicle.licensePlate}
                    </span>{' '}
                    ({ro.vehicle.brand} {ro.vehicle.model}) • แผนก: {ro.department || '-'}
                  </div>
                  <div>
                    <span className="text-slate-400">ผู้รับผิดชอบ:</span>{' '}
                    <span className="font-medium text-slate-700">{ro.assignedTo || '-'}</span> •
                    ผู้แจ้ง: {ro.reportedBy || '-'}
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-800">อาการที่แจ้ง:</span>{' '}
                  {ro.reportedSymptoms}
                  {ro.diagnosis && (
                    <div className="mt-1 text-slate-600">
                      <span className="font-semibold">ผลการตรวจ:</span> {ro.diagnosis}
                    </div>
                  )}
                </div>

                {/* Sub items badge count */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t pt-2">
                  <div>
                    {ro.items?.length || 0} รายการงานซ่อมย่อย • {ro.partIssues?.length || 0} ใบเบิกอะไหล่
                  </div>
                  <div>
                    ไมล์ขณะเข้าซ่อม:{' '}
                    {ro.mileageAtRepair ? `${ro.mileageAtRepair.toLocaleString()} กม.` : '-'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal New Repair Order */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">เปิดใบงานซ่อมรถบริษัทใหม่</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เลือกรถที่เข้าซ่อม <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.vehicleId}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  >
                    <option value="">-- เลือกรถบริษัท --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.licensePlate} ({v.brand} {v.model}) - {v.department || 'ไม่ระบุแผนก'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    วันที่เข้าซ่อม <span className="text-red-500">*</span>
                  </label>
                  <ThaiDatePicker
                    required
                    value={formData.orderDate}
                    onChange={(val) => setFormData({ ...formData, orderDate: val })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เลขไมล์ขณะเข้าซ่อม (กม.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.mileageAtRepair}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mileageAtRepair: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ผู้แจ้งซ่อม / คนขับ
                  </label>
                  <input
                    type="text"
                    placeholder="ชื่อผู้แจ้ง"
                    value={formData.reportedBy}
                    onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ช่างผู้รับผิดชอบงาน
                  </label>
                  <input
                    type="text"
                    placeholder="ชื่อช่าง หรือ อู่ซ่อมภายนอก"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ปรับสถานะรถเป็น
                  </label>
                  <select
                    value={formData.vehicleStatus}
                    onChange={(e) => setFormData({ ...formData, vehicleStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  >
                    <option value="waiting_repair">รอซ่อม (ยังไม่ได้ลงมือซ่อม)</option>
                    <option value="repairing">กำลังซ่อม (เข้าอู่/ลงมือซ่อมทันที)</option>
                    <option value="waiting_parts">รออะไหล่</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  อาการที่แจ้งซ่อม / ปัญหาที่พบ <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="เช่น เบรกมีเสียงดัง แอร์ไม่เย็น หรือเช็กระยะ 50,000 กม."
                  value={formData.reportedSymptoms}
                  onChange={(e) => setFormData({ ...formData, reportedSymptoms: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              {/* Repair items table */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    รายการซ่อมย่อย / ค่าแรงเบื้องต้น
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> เพิ่มรายการ
                  </button>
                </div>

                {repairItems.map((it, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder={`รายการที่ ${idx + 1} เช่น เปลี่ยนผ้าเบรก`}
                      value={it.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="ค่าแรง (บาท)"
                      value={it.laborCost || ''}
                      onChange={(e) =>
                        handleItemChange(idx, 'laborCost', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-right"
                    />
                    <button
                      type="button"
                      disabled={repairItems.length <= 1}
                      onClick={() => handleRemoveItemRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'กำลังบันทึก...' : 'เปิดใบงานซ่อม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Repair Order */}
      {isDeleteModalOpen && orderToDelete && (
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
                  หากรถ {orderToDelete.vehicle?.licensePlate} กำลังอยู่ในสถานะซ่อม ระบบจะปรับสถานะรถกลับเป็น <strong>&quot;พร้อมใช้งาน&quot;</strong> โดยอัตโนมัติ
                </li>
                <li>การดำเนินการนี้ไม่สามารถยกเลิกย้อนหลังได้</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setOrderToDelete(null)
                }}
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
    </div>
  )
}

