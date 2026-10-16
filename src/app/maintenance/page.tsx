'use client'

import React, { useState, useEffect } from 'react'
import {
  CalendarCheck,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Calendar,
  Gauge,
  X,
  History,
  Check,
  Car,
  Edit,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils'

export default function MaintenancePage() {
  const [plans, setPlans] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [planToDelete, setPlanToDelete] = useState<any>(null)

  // Feedback
  const [submitting, setSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Add Plan Form
  const [useMonths, setUseMonths] = useState(true)
  const [useKm, setUseKm] = useState(true)
  const [formData, setFormData] = useState({
    vehicleId: '',
    name: '',
    intervalMonths: 6,
    intervalKm: 10000,
    lastPerformedDate: new Date().toISOString().split('T')[0],
    lastPerformedMileage: 0,
    advanceWarningDays: 30,
    advanceWarningKm: 1000,
    notes: '',
  })

  // Edit Plan Form
  const [editUseMonths, setEditUseMonths] = useState(true)
  const [editUseKm, setEditUseKm] = useState(true)
  const [editFormData, setEditFormData] = useState<any>({
    id: '',
    name: '',
    intervalMonths: 6,
    intervalKm: 10000,
    lastPerformedDate: '',
    lastPerformedMileage: 0,
    advanceWarningDays: 30,
    advanceWarningKm: 1000,
    notes: '',
  })

  // Complete Maintenance Form
  const [completeData, setCompleteData] = useState({
    performedDate: new Date().toISOString().split('T')[0],
    mileageAtService: 0,
    description: '',
    cost: 0,
    performedBy: '',
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      let url = '/api/maintenance'
      if (statusFilter) url += `?status=${statusFilter}`

      const [plansRes, vehiclesRes] = await Promise.all([
        fetch(url),
        fetch('/api/vehicles'),
      ])

      const plansData = await plansRes.json()
      const vehiclesData = await vehiclesRes.json()

      setPlans(Array.isArray(plansData) ? plansData : [])
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

  const handleVehicleSelect = (vId: string) => {
    const selected = vehicles.find((v) => v.id === vId)
    setFormData({
      ...formData,
      vehicleId: vId,
      lastPerformedMileage: selected?.currentMileage || 0,
    })
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    if (!useMonths && !useKm) {
      setErrorMessage('กรุณาเลือกเงื่อนไขการแจ้งเตือนอย่างน้อย 1 อย่าง (ตามระยะเวลา หรือ ตามระยะทาง)')
      setSubmitting(false)
      return
    }

    try {
      const payload = {
        ...formData,
        intervalMonths: useMonths ? formData.intervalMonths : null,
        intervalKm: useKm ? formData.intervalKm : null,
      }

      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการสร้างแผน')
        return
      }

      setSuccessMessage(`สร้างแผนซ่อมบำรุง "${data.name}" เรียบร้อยแล้ว`)
      setIsAddModalOpen(false)
      fetchData()
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompleteMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')

    try {
      const res = await fetch(`/api/maintenance/${selectedPlan.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeData),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'ไม่สามารถบันทึกได้')
        return
      }

      setSuccessMessage(
        `บันทึกผลการบำรุงรักษา "${selectedPlan.name}" สำเร็จและคำนวณรอบถัดไปแล้ว`
      )
      setIsCompleteModalOpen(false)
      fetchData()
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEditModal = (plan: any) => {
    setSelectedPlan(plan)
    const hasMonths = plan.intervalMonths !== null && plan.intervalMonths !== undefined && plan.intervalMonths > 0
    const hasKm = plan.intervalKm !== null && plan.intervalKm !== undefined && plan.intervalKm > 0
    setEditUseMonths(hasMonths || (!hasMonths && !hasKm))
    setEditUseKm(hasKm)
    setEditFormData({
      id: plan.id,
      name: plan.name,
      intervalMonths: hasMonths ? plan.intervalMonths : 6,
      intervalKm: hasKm ? plan.intervalKm : 10000,
      lastPerformedDate: plan.lastPerformedDate ? new Date(plan.lastPerformedDate).toISOString().split('T')[0] : '',
      lastPerformedMileage: plan.lastPerformedMileage !== null && plan.lastPerformedMileage !== undefined
        ? plan.lastPerformedMileage
        : plan.vehicle.currentMileage,
      advanceWarningDays: plan.advanceWarningDays || 30,
      advanceWarningKm: plan.advanceWarningKm || 1000,
      notes: plan.notes || '',
    })
    setErrorMessage('')
    setIsEditModalOpen(true)
  }

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    if (!editUseMonths && !editUseKm) {
      setErrorMessage('กรุณาเลือกเงื่อนไขการแจ้งเตือนอย่างน้อย 1 อย่าง (ตามระยะเวลา หรือ ตามระยะทาง)')
      setSubmitting(false)
      return
    }

    try {
      const payload = {
        ...editFormData,
        intervalMonths: editUseMonths ? editFormData.intervalMonths : null,
        intervalKm: editUseKm ? editFormData.intervalKm : null,
      }

      const res = await fetch('/api/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'ไม่สามารถแก้ไขแผนซ่อมบำรุงได้')
        return
      }

      setSuccessMessage(`แก้ไขแผนซ่อมบำรุง "${data.name}" สำเร็จแล้ว`)
      setIsEditModalOpen(false)
      fetchData()
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePlan = async () => {
    if (!planToDelete) return
    setIsDeleting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const res = await fetch(`/api/maintenance?id=${planToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'ไม่สามารถลบแผนซ่อมบำรุงได้')
        return
      }

      setSuccessMessage(data.message || 'ลบแผนซ่อมบำรุงสำเร็จแล้ว')
      setIsDeleteModalOpen(false)
      setPlanToDelete(null)
      fetchData()
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            แผนซ่อมบำรุงตามระยะเวลาและระยะทาง (Preventive Maintenance)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ตั้งรอบตรวจเช็ก เช็กระยะ เปลี่ยนถ่ายของเหลว แจ้งเตือนล่วงหน้า และคำนวณรอบถัดไปอัตโนมัติ
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMessage('')
            setIsAddModalOpen(true)
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          สร้างแผนซ่อมบำรุงใหม่
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

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            id: '',
            label: 'ทั้งหมด',
            count: plans.length,
            color: 'border-slate-200 text-slate-700',
            bg: 'bg-white',
          },
          {
            id: 'overdue',
            label: 'เกินกำหนด (Overdue)',
            count: plans.filter((p) => p.status === 'overdue').length,
            color: 'border-rose-200 text-rose-700',
            bg: 'bg-rose-50/50',
          },
          {
            id: 'due',
            label: 'ถึงกำหนด (Due Today)',
            count: plans.filter((p) => p.status === 'due').length,
            color: 'border-orange-200 text-orange-700',
            bg: 'bg-orange-50/50',
          },
          {
            id: 'upcoming',
            label: 'ใกล้ครบกำหนด (Upcoming)',
            count: plans.filter((p) => p.status === 'upcoming').length,
            color: 'border-yellow-200 text-yellow-700',
            bg: 'bg-yellow-50/50',
          },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setStatusFilter(c.id)}
            className={`p-4 rounded-xl border text-left transition ${c.bg} ${
              statusFilter === c.id ? 'ring-2 ring-blue-500 font-bold' : ''
            }`}
          >
            <div className="text-xs text-slate-500 font-medium">{c.label}</div>
            <div className={`text-2xl font-bold mt-1 ${c.color}`}>{c.count}</div>
          </button>
        ))}
      </div>

      {/* Plans List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">กำลังโหลดแผนซ่อมบำรุง...</div>
          ) : plans.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <CalendarCheck className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              ไม่พบรายการแผนซ่อมบำรุง
            </div>
          ) : (
            plans.map((plan) => {
              const isOverdue = plan.status === 'overdue'
              const isUpcoming = plan.status === 'upcoming'
              const isDue = plan.status === 'due'

              return (
                <div key={plan.id} className="p-5 hover:bg-slate-50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-base">{plan.name}</span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-700'
                              : isDue
                              ? 'bg-orange-100 text-orange-700'
                              : isUpcoming
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isOverdue
                            ? 'เกินกำหนดแล้ว'
                            : isDue
                            ? 'ถึงกำหนดวันนี้'
                            : isUpcoming
                            ? 'ใกล้ครบกำหนด'
                            : 'ปกติ'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>รถ:</span>
                        <Link
                          href={`/vehicles/${plan.vehicleId}`}
                          className="font-bold text-blue-600 hover:underline"
                        >
                          {plan.vehicle.licensePlate}
                        </Link>
                        <span>
                          ({plan.vehicle.brand} {plan.vehicle.model}) • ไมล์ปัจจุบัน:{' '}
                          <strong className="text-slate-800">
                            {plan.vehicle.currentMileage.toLocaleString()} กม.
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800">
                          ครบกำหนด:{' '}
                          {plan.nextDueDate ? formatDate(plan.nextDueDate) : 'ไม่ระบุวัน'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          หรือเมื่อถึง{' '}
                          {plan.nextDueMileage
                            ? `${plan.nextDueMileage.toLocaleString()} กม.`
                            : 'ไม่ระบุระยะทาง'}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedPlan(plan)
                          setCompleteData({
                            performedDate: new Date().toISOString().split('T')[0],
                            mileageAtService: plan.vehicle.currentMileage,
                            description: `ตรวจเช็ก/เปลี่ยนตามรอบ: ${plan.name}`,
                            cost: 0,
                            performedBy: '',
                          })
                          setErrorMessage('')
                          setIsCompleteModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition shadow-sm"
                      >
                        <Check className="h-4 w-4" />
                        บันทึกทำเสร็จแล้ว
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(plan)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                        title="แก้ไขแผนซ่อมบำรุง"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPlanToDelete(plan)
                          setIsDeleteModalOpen(true)
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="ลบแผนซ่อมบำรุง"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Intervals & Last done snapshot */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">รอบเวลา:</span>{' '}
                      <span className="font-medium text-slate-800">
                        {plan.intervalMonths ? `ทุก ${plan.intervalMonths} เดือน` : 'ไม่กำหนด'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">รอบระยะทาง:</span>{' '}
                      <span className="font-medium text-slate-800">
                        {plan.intervalKm
                          ? `ทุก ${plan.intervalKm.toLocaleString()} กม.`
                          : 'ไม่กำหนด'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">ทำครั้งล่าสุด:</span>{' '}
                      <span className="font-medium text-slate-800">
                        {plan.lastPerformedDate ? formatDate(plan.lastPerformedDate) : 'ยังไม่เคย'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">ไมล์ครั้งล่าสุด:</span>{' '}
                      <span className="font-medium text-slate-800">
                        {plan.lastPerformedMileage
                          ? `${plan.lastPerformedMileage.toLocaleString()} กม.`
                          : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Past records badge */}
                  {plan.records?.length > 0 && (
                    <div className="mt-2 text-[11px] text-slate-400">
                      มีประวัติการบันทึกทำมาแล้ว {plan.records.length} ครั้ง (ล่าสุดเมื่อ{' '}
                      {formatDate(plan.records[0].performedDate)})
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal Add Maintenance Plan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">สร้างแผนซ่อมบำรุงเชิงป้องกัน</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
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

            <form onSubmit={handleCreatePlan} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เลือกรถบริษัท <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.vehicleId}
                  onChange={(e) => handleVehicleSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                >
                  <option value="">-- เลือกรถ --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.licensePlate} ({v.brand} {v.model}) - ไมล์ {v.currentMileage.toLocaleString()} กม.
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อรายการบำรุงรักษา <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เปลี่ยนน้ำมันเครื่องและกรอง, ตรวจเช็กระบบเบรก"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  เลือกเงื่อนไขการแจ้งเตือน (สามารถเลือกอย่างใดอย่างหนึ่ง หรือทั้ง 2 อย่าง) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Checkbox 1: ตามระยะเวลา */}
                  <div className={`p-3 rounded-xl border transition ${useMonths ? 'bg-white border-blue-400 shadow-xs' : 'bg-slate-100/70 border-slate-200 opacity-60'}`}>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-800 mb-2">
                      <input
                        type="checkbox"
                        checked={useMonths}
                        onChange={(e) => setUseMonths(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>เตือนตามรอบระยะเวลา</span>
                    </label>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">รอบระยะเวลา (เดือน)</label>
                      <input
                        type="number"
                        min="1"
                        disabled={!useMonths}
                        placeholder="เช่น 6 หรือ 12"
                        value={formData.intervalMonths || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            intervalMonths: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Checkbox 2: ตามระยะทาง */}
                  <div className={`p-3 rounded-xl border transition ${useKm ? 'bg-white border-blue-400 shadow-xs' : 'bg-slate-100/70 border-slate-200 opacity-60'}`}>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-800 mb-2">
                      <input
                        type="checkbox"
                        checked={useKm}
                        onChange={(e) => setUseKm(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>เตือนตามรอบระยะทาง</span>
                    </label>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">รอบระยะทาง (กม.)</label>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        disabled={!useKm}
                        placeholder="เช่น 10000"
                        value={formData.intervalKm || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            intervalKm: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    วันที่ทำครั้งล่าสุด
                  </label>
                  <input
                    type="date"
                    value={formData.lastPerformedDate}
                    onChange={(e) =>
                      setFormData({ ...formData, lastPerformedDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เลขไมล์ครั้งล่าสุด (กม.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lastPerformedMileage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lastPerformedMileage: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เตือนล่วงหน้า (วัน)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.advanceWarningDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        advanceWarningDays: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เตือนล่วงหน้า (กม.)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={formData.advanceWarningKm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        advanceWarningKm: parseFloat(e.target.value) || 1000,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกแผนซ่อมบำรุง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Complete Maintenance */}
      {isCompleteModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800">บันทึกผลการบำรุงรักษา</h3>
                <p className="text-xs text-slate-500">
                  {selectedPlan.name} ({selectedPlan.vehicle.licensePlate})
                </p>
              </div>
              <button
                onClick={() => setIsCompleteModalOpen(false)}
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

            <form onSubmit={handleCompleteMaintenance} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วันที่ดำเนินการ <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={completeData.performedDate}
                  onChange={(e) =>
                    setCompleteData({ ...completeData, performedDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เลขไมล์ขณะทำ (กม.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={completeData.mileageAtService}
                  onChange={(e) =>
                    setCompleteData({
                      ...completeData,
                      mileageAtService: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ค่าใช้จ่ายในการทำ (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={completeData.cost}
                  onChange={(e) =>
                    setCompleteData({
                      ...completeData,
                      cost: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ผู้ดำเนินการ / อู่ที่ทำ
                </label>
                <input
                  type="text"
                  placeholder="เช่น ช่างศูนย์บริการโตโยต้า หรือ ช่างประจำบริษัท"
                  value={completeData.performedBy}
                  onChange={(e) =>
                    setCompleteData({ ...completeData, performedBy: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                ระบบจะคำนวณกำหนดครั้งถัดไปให้อัตโนมัติ:
                <br />
                {selectedPlan.intervalMonths
                  ? `• วันที่ถัดไป: อีก ${selectedPlan.intervalMonths} เดือน`
                  : ''}
                <br />
                {selectedPlan.intervalKm
                  ? `• ไมล์ถัดไป: อีก ${selectedPlan.intervalKm.toLocaleString()} กม.`
                  : ''}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'กำลังบันทึก...' : 'ยืนยันบันทึกเสร็จสิ้น'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Maintenance Plan */}
      {isEditModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">แก้ไขแผนซ่อมบำรุงเชิงป้องกัน</h2>
                <p className="text-xs text-slate-500">
                  รถ: <span className="font-semibold text-slate-700">{selectedPlan.vehicle?.licensePlate}</span> ({selectedPlan.vehicle?.brand} {selectedPlan.vehicle?.model})
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center justify-between">
                <span>{errorMessage}</span>
                <button onClick={() => setErrorMessage('')}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <form onSubmit={handleUpdatePlan} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อรายการซ่อมบำรุง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="เช่น เปลี่ยนถ่ายน้ำมันเครื่องสังเคราะห์แท้, สลับยาง-ถ่วงล้อ"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  เลือกเงื่อนไขการแจ้งเตือน (สามารถเลือกอย่างใดอย่างหนึ่ง หรือทั้ง 2 อย่าง) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Checkbox 1: ตามระยะเวลา */}
                  <div className={`p-3 rounded-xl border transition ${editUseMonths ? 'bg-white border-blue-400 shadow-xs' : 'bg-slate-100/70 border-slate-200 opacity-60'}`}>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-800 mb-2">
                      <input
                        type="checkbox"
                        checked={editUseMonths}
                        onChange={(e) => setEditUseMonths(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>เตือนตามรอบระยะเวลา</span>
                    </label>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">รอบระยะเวลา (เดือน)</label>
                      <input
                        type="number"
                        min="1"
                        disabled={!editUseMonths}
                        placeholder="เช่น 6 หรือ 12"
                        value={editFormData.intervalMonths || ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            intervalMonths: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Checkbox 2: ตามระยะทาง */}
                  <div className={`p-3 rounded-xl border transition ${editUseKm ? 'bg-white border-blue-400 shadow-xs' : 'bg-slate-100/70 border-slate-200 opacity-60'}`}>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-800 mb-2">
                      <input
                        type="checkbox"
                        checked={editUseKm}
                        onChange={(e) => setEditUseKm(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>เตือนตามรอบระยะทาง</span>
                    </label>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">รอบระยะทาง (กม.)</label>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        disabled={!editUseKm}
                        placeholder="เช่น 10000"
                        value={editFormData.intervalKm || ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            intervalKm: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    วันที่ทำครั้งล่าสุด
                  </label>
                  <input
                    type="date"
                    value={editFormData.lastPerformedDate}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, lastPerformedDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เลขไมล์ครั้งล่าสุด (กม.)
                  </label>
                  <input
                    type="number"
                    value={editFormData.lastPerformedMileage}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        lastPerformedMileage: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เตือนล่วงหน้า (วัน)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.advanceWarningDays}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        advanceWarningDays: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เตือนล่วงหน้า (กม.)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={editFormData.advanceWarningKm}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        advanceWarningKm: parseFloat(e.target.value) || 1000,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  หมายเหตุ / ข้อแนะนำ
                </label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="เช่น เบอร์น้ำมันเครื่อง 5W-30 หรือยี่ห้อกรองที่แนะนำ..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Maintenance Plan */}
      {isDeleteModalOpen && planToDelete && (
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
                <li>
                  แผนนี้ผูกกับรถ:{' '}
                  <span className="font-semibold text-slate-800">
                    {planToDelete.vehicle?.licensePlate} ({planToDelete.vehicle?.brand} {planToDelete.vehicle?.model})
                  </span>
                </li>
                <li>ประวัติการบันทึกทำเสร็จของแผนนี้ทั้งหมดจะถูกลบออกจากระบบ</li>
                <li>การดำเนินการนี้ไม่สามารถยกเลิกย้อนหลังได้</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setPlanToDelete(null)
                }}
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

