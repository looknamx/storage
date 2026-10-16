'use client'

import React, { useState, useEffect } from 'react'
import {
  Car,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Wrench,
  Clock,
  AlertTriangle,
  X,
  Gauge,
  Building,
  User,
  Calendar,
  FileSpreadsheet,
  Upload,
  Download,
} from 'lucide-react'
import Link from 'next/link'
import { getStatusLabel, getStatusColor, formatDate, formatNumber } from '@/lib/utils'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modal Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Import Excel Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [updateExistingOnImport, setUpdateExistingOnImport] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [importError, setImportError] = useState('')

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    licensePlate: '',
    province: 'กรุงเทพมหานคร',
    brand: '',
    model: '',
    vehicleType: 'กระบะ 4 ประตู',
    year: new Date().getFullYear(),
    vin: '',
    engineNumber: '',
    department: '',
    responsiblePerson: '',
    startDate: new Date().toISOString().split('T')[0],
    currentMileage: 0,
    status: 'active',
    notes: '',
  })

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      let url = `/api/vehicles?search=${encodeURIComponent(search)}`
      if (statusFilter) url += `&status=${statusFilter}`
      const [resVehicles, resTypes] = await Promise.all([
        fetch(url),
        fetch('/api/categories?type=vehicle'),
      ])

      const data = await resVehicles.json()
      const typesData = await resTypes.json()

      setVehicles(Array.isArray(data) ? data : [])
      setVehicleTypes(Array.isArray(typesData) ? typesData : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchVehicles()
  }

  const handleOpenAddModal = () => {
    setEditingVehicleId(null)
    setErrorMessage('')
    setSuccessMessage('')
    setFormData({
      code: '',
      licensePlate: '',
      province: 'กรุงเทพมหานคร',
      brand: '',
      model: '',
      vehicleType: vehicleTypes[0]?.name || 'กระบะ 4 ประตู',
      year: new Date().getFullYear(),
      vin: '',
      engineNumber: '',
      department: '',
      responsiblePerson: '',
      startDate: new Date().toISOString().split('T')[0],
      currentMileage: 0,
      status: 'active',
      notes: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (v: any) => {
    setEditingVehicleId(v.id)
    setErrorMessage('')
    setSuccessMessage('')
    setFormData({
      code: v.code || '',
      licensePlate: v.licensePlate || '',
      province: v.province || 'กรุงเทพมหานคร',
      brand: v.brand || '',
      model: v.model || '',
      vehicleType: v.vehicleType || 'กระบะ 4 ประตู',
      year: v.year || new Date().getFullYear(),
      vin: v.vin || '',
      engineNumber: v.engineNumber || '',
      department: v.department || '',
      responsiblePerson: v.responsiblePerson || '',
      startDate: v.startDate ? new Date(v.startDate).toISOString().split('T')[0] : '',
      currentMileage: v.currentMileage || 0,
      status: v.status || 'active',
      notes: v.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleDeleteVehicle = async (v: any) => {
    const confirmMessage = `คุณต้องการลบรถทะเบียน "${v.licensePlate}" (${v.brand} ${v.model}) ใช่หรือไม่?\n\n*หมายเหตุ: หากรถมีประวัติการซ่อมหรือการเบิกอะไหล่ ระบบจะไม่อนุญาตให้ลบเพื่อรักษาความถูกต้องของประวัติธุรกรรม โดยแนะนำให้เปลี่ยนสถานะเป็น "จำหน่ายออก" หรือ "หยุดใช้งาน" แทน`
    if (!confirm(confirmMessage)) return

    try {
      setErrorMessage('')
      const res = await fetch(`/api/vehicles/${v.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'ไม่สามารถลบรถได้')
        return
      }

      setSuccessMessage(data.message || 'ลบข้อมูลรถเรียบร้อยแล้ว')
      fetchVehicles()
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการลบ')
    }
  }

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const url = editingVehicleId ? `/api/vehicles/${editingVehicleId}` : '/api/vehicles'
      const method = editingVehicleId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการบันทึก')
        return
      }

      setSuccessMessage(
        editingVehicleId ? 'แก้ไขข้อมูลรถบริษัทสำเร็จแล้ว' : 'เพิ่มข้อมูลรถบริษัทสำเร็จแล้ว'
      )
      setIsModalOpen(false)
      fetchVehicles()
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setSubmitting(false)
    }
  }

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) {
      setImportError('กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls)')
      return
    }

    setIsImporting(true)
    setImportError('')
    setImportResult(null)

    try {
      const data = new FormData()
      data.append('file', importFile)
      data.append('updateExisting', updateExistingOnImport ? 'true' : 'false')

      const res = await fetch('/api/vehicles/import', {
        method: 'POST',
        body: data,
      })
      const result = await res.json()

      if (!res.ok) {
        setImportError(result.error || 'เกิดข้อผิดพลาดในการนำเข้าไฟล์')
        return
      }

      setImportResult(result)
      fetchVehicles()
    } catch (err: any) {
      setImportError(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ทะเบียนรถบริษัท (Fleet Vehicles)</h1>
          <p className="text-sm text-slate-500 mt-1">
            จัดการข้อมูลรถประจำตำแหน่ง รถขนส่ง ประวัติเลขไมล์ และสถานะการใช้งาน
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsImportModalOpen(true)
              setImportFile(null)
              setImportResult(null)
              setImportError('')
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-100 transition shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            นำเข้า Excel
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            เพิ่มรถใหม่
          </button>
        </div>
      </div>

      {/* Alerts */}
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
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาทะเบียน, ยี่ห้อ, รุ่น, แผนก, ผู้ดูแล..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-blue-500"
          />
        </form>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          {[
            { id: '', label: 'ทั้งหมด' },
            { id: 'active', label: 'พร้อมใช้งาน' },
            { id: 'repairing', label: 'กำลังซ่อม' },
            { id: 'waiting_repair', label: 'รอซ่อม' },
            { id: 'inactive', label: 'หยุดใช้งาน' },
            { id: 'decommissioned', label: 'จำหน่ายออก' },
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

      {/* Vehicles Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">ทะเบียนรถ / รหัส</th>
                <th className="px-5 py-3.5">ยี่ห้อ / รุ่น / ประเภท</th>
                <th className="px-5 py-3.5">หน่วยงาน / ผู้รับผิดชอบ</th>
                <th className="px-5 py-3.5">เลขไมล์ล่าสุด</th>
                <th className="px-5 py-3.5">สถานะ</th>
                <th className="px-5 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Car className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">ไม่พบข้อมูลรถบริษัท</p>
                    <p className="text-xs text-slate-400 mt-1">
                      สามารถคลิกปุ่ม &quot;เพิ่มรถใหม่&quot; ด้านบนเพื่อบันทึกข้อมูลรถคันแรก
                    </p>
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800 text-base">{v.licensePlate}</div>
                      <div className="text-xs text-slate-400">
                        {v.province} • <span className="font-mono text-slate-600">{v.code}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">
                        {v.brand} {v.model}
                      </div>
                      <div className="text-xs text-slate-400">
                        {v.vehicleType} {v.year ? `(${v.year})` : ''}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-700">{v.department || '-'}</div>
                      <div className="text-xs text-slate-400">{v.responsiblePerson || '-'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">
                        {v.currentMileage.toLocaleString()} กม.
                      </div>
                      <div className="text-xs text-slate-400">
                        {v.mileageDate ? formatDate(v.mileageDate) : '-'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          v.status
                        )}`}
                      >
                        {getStatusLabel(v.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/vehicles/${v.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition"
                          title="ดูรายละเอียดและประวัติ"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          ดูประวัติ
                        </Link>
                        <button
                          onClick={() => handleOpenEditModal(v)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                          title="แก้ไขข้อมูลรถ"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(v)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="ลบรถคันนี้"
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

      {/* Modal Add / Edit Vehicle */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingVehicleId ? 'แก้ไขข้อมูลรถบริษัท' : 'ลงทะเบียนรถบริษัทคันใหม่'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveVehicle} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ทะเบียนรถ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 1ฒผ 4589"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    จังหวัดจดทะเบียน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ยี่ห้อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น Toyota, Isuzu, Honda"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    รุ่น <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น Hilux Revo 2.4"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ประเภทรถ</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500"
                  >
                    {vehicleTypes.length > 0 ? (
                      vehicleTypes.map((vt) => (
                        <option key={vt.id} value={vt.name}>
                          {vt.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="กระบะ 4 ประตู">กระบะ 4 ประตู</option>
                        <option value="กระบะตอนครึ่ง">กระบะตอนครึ่ง</option>
                        <option value="กระบะตอนเดียว">กระบะตอนเดียว</option>
                        <option value="รถตู้โดยสาร">รถตู้โดยสาร</option>
                        <option value="รถเก๋ง 4 ประตู">รถเก๋ง 4 ประตู</option>
                        <option value="รถเก๋ง 5 ประตู">รถเก๋ง 5 ประตู</option>
                        <option value="รถบรรทุก 4/6 ล้อ">รถบรรทุก 4/6 ล้อ</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    รหัสรถภายใน (เว้นว่างเพื่อสร้างอัตโนมัติ)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น V-005"
                    value={formData.code}
                    disabled={!!editingVehicleId}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    หน่วยงาน / แผนก
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ฝ่ายขาย, คลังสินค้า"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ผู้ดูแลรถ</label>
                  <input
                    type="text"
                    placeholder="ชื่อ-นามสกุล คนขับ/ผู้รับผิดชอบ"
                    value={formData.responsiblePerson}
                    onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เลขไมล์ล่าสุด (กม.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentMileage}
                    onChange={(e) =>
                      setFormData({ ...formData, currentMileage: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">สถานะรถ</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500 font-medium"
                  >
                    <option value="active">พร้อมใช้งาน</option>
                    <option value="waiting_repair">รอซ่อม</option>
                    <option value="repairing">กำลังซ่อม</option>
                    <option value="waiting_parts">รออะไหล่</option>
                    <option value="inactive">หยุดใช้งาน</option>
                    <option value="decommissioned">จำหน่ายออกจากระบบ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุ</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม เช่น ลักษณะการใช้งาน..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting
                    ? 'กำลังบันทึก...'
                    : editingVehicleId
                    ? 'บันทึกการแก้ไข'
                    : 'บันทึกข้อมูลรถ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">นำเข้าข้อมูลรถบริษัทจาก Excel</h3>
                <p className="text-xs text-slate-500">
                  รองรับไฟล์ .xlsx หรือ .xls พร้อมนำเข้าทะเบียนรถ ข้อมูลคนขับ และเลขไมล์
                </p>
              </div>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              {/* Template Download */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <span className="text-slate-600">ต้องการดูรูปแบบตารางที่แนะนำ?</span>
                <a
                  href="/api/vehicles/template"
                  download="fleet_vehicles_template.xlsx"
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  ดาวน์โหลดไฟล์ตัวอย่าง (.xlsx)
                </a>
              </div>

              {/* File Drop Area */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:border-emerald-500 transition bg-slate-50/50">
                <input
                  type="file"
                  id="vehicleExcelFileInput"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImportFile(e.target.files[0])
                      setImportError('')
                      setImportResult(null)
                    }
                  }}
                />
                <label htmlFor="vehicleExcelFileInput" className="cursor-pointer flex flex-col items-center">
                  <Upload className="h-8 w-8 text-slate-400 mb-2" />
                  <span className="text-sm font-semibold text-slate-700">
                    {importFile ? importFile.name : 'คลิกเพื่อเลือกไฟล์ Excel (.xlsx, .xls)'}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    {importFile ? `ขนาด: ${(importFile.size / 1024).toFixed(1)} KB` : 'หรือลากไฟล์มาวางที่นี่'}
                  </span>
                </label>
              </div>

              {/* Options */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={updateExistingOnImport}
                    onChange={(e) => setUpdateExistingOnImport(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    <strong>อัปเดตข้อมูลเดิม:</strong> หากพบทะเบียนรถซ้ำ ให้ปรับปรุงข้อมูล ยี่ห้อ, รุ่น, แผนก, ผู้ดูแล, เลขไมล์ ตามไฟล์ Excel
                  </span>
                </label>
              </div>

              {/* Error Message */}
              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Result Summary */}
              {importResult && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    นำเข้าไฟล์ Excel สำเร็จ!
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center font-medium">
                    <div className="p-2 bg-white rounded-lg border border-emerald-100">
                      <div className="text-slate-500 text-[10px]">เพิ่มรถใหม่</div>
                      <div className="text-emerald-600 font-bold text-sm">+{importResult.importedCount}</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-emerald-100">
                      <div className="text-slate-500 text-[10px]">อัปเดตเดิม</div>
                      <div className="text-blue-600 font-bold text-sm">{importResult.updatedCount}</div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-emerald-100">
                      <div className="text-slate-500 text-[10px]">ข้ามรายการ</div>
                      <div className="text-slate-500 font-bold text-sm">{importResult.skippedCount}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50"
                >
                  {importResult ? 'เสร็จสิ้น' : 'ยกเลิก'}
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !importFile}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
                >
                  {isImporting ? (
                    <>กำลังนำเข้าข้อมูล...</>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      เริ่มนำเข้าข้อมูล
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
