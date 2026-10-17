'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertCircle,
  PackageX,
  X,
  Sliders,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Trash2,
  Edit,
  AlertTriangle,
  FileSpreadsheet,
  Upload,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function PartsInventoryPage() {
  const [parts, setParts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockStatusFilter, setStockStatusFilter] = useState('')

  // Sorting
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder(field === 'quantity' || field === 'costPerUnit' ? 'desc' : 'asc')
    }
  }

  const renderSortIndicator = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 inline-block" />
    }
    return sortOrder === 'desc' ? (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 ml-1 inline-block font-bold" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 ml-1 inline-block font-bold" />
    )
  }

  const sortedParts = useMemo(() => {
    return [...parts].sort((a, b) => {
      let valA = a[sortBy] ?? ''
      let valB = b[sortBy] ?? ''
      if (typeof valA === 'number' || typeof valB === 'number') {
        const numA = Number(valA) || 0
        const numB = Number(valB) || 0
        return sortOrder === 'asc' ? numA - numB : numB - numA
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB), 'th')
        : String(valB).localeCompare(String(valA), 'th')
    })
  }, [parts, sortBy, sortOrder])

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingPartId, setEditingPartId] = useState<string | null>(null)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<any>(null)

  // Import Excel Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [updateExistingOnImport, setUpdateExistingOnImport] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [importError, setImportError] = useState('')

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [partToDelete, setPartToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [forceDelete, setForceDelete] = useState(false)
  const [deleteRelationError, setDeleteRelationError] = useState('')

  // Form states
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    categoryId: '',
    brand: '',
    compatibleModels: '',
    unit: 'ชิ้น',
    quantity: 0,
    minimumStock: 5,
    costPerUnit: 0,
    location: '',
    notes: '',
  })

  // Stock Adjustment Form
  const [adjustData, setAdjustData] = useState({
    newQuantity: 0,
    reason: '',
    adjustedBy: '',
  })

  const fetchParts = async () => {
    try {
      setLoading(true)
      let url = `/api/parts?search=${encodeURIComponent(search)}`
      if (categoryFilter) url += `&category=${categoryFilter}`
      if (stockStatusFilter) url += `&stockStatus=${stockStatusFilter}`

      const res = await fetch(url)
      const data = await res.json()
      setParts(data.parts || [])
      setCategories(data.categories || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParts()
  }, [categoryFilter, stockStatusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchParts()
  }

  const handleOpenAddModal = () => {
    setEditingPartId(null)
    setErrorMessage('')
    setSuccessMessage('')
    setFormData({
      code: '',
      name: '',
      categoryId: '',
      brand: '',
      compatibleModels: '',
      unit: 'ชิ้น',
      quantity: 0,
      minimumStock: 5,
      costPerUnit: 0,
      location: '',
      notes: '',
    })
    setIsAddModalOpen(true)
  }

  const handleOpenEditModal = (p: any) => {
    setEditingPartId(p.id)
    setErrorMessage('')
    setSuccessMessage('')
    setFormData({
      code: p.code || '',
      name: p.name || '',
      categoryId: p.categoryId || '',
      brand: p.brand || '',
      compatibleModels: p.compatibleModels || '',
      unit: p.unit || 'ชิ้น',
      quantity: p.quantity || 0,
      minimumStock: p.minimumStock || 0,
      costPerUnit: p.costPerUnit || 0,
      location: p.location || '',
      notes: p.notes || '',
    })
    setIsAddModalOpen(true)
  }

  const handleDeletePart = (p: any) => {
    setPartToDelete(p)
    setForceDelete(false)
    setDeleteRelationError('')
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDeletePart = async () => {
    if (!partToDelete) return
    setIsDeleting(true)
    setErrorMessage('')
    setDeleteRelationError('')

    try {
      const url = `/api/parts/${partToDelete.id}${forceDelete ? '?force=true' : ''}`
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        if (data.hasRelations) {
          setDeleteRelationError(data.error)
        } else {
          setErrorMessage(data.error || 'ไม่สามารถลบอะไหล่ได้')
          setIsDeleteModalOpen(false)
        }
        return
      }

      setSuccessMessage(data.message || 'ลบอะไหล่เรียบร้อยแล้ว')
      setIsDeleteModalOpen(false)
      setPartToDelete(null)
      setForceDelete(false)
      fetchParts()
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการลบ')
      setIsDeleteModalOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const url = editingPartId ? `/api/parts/${editingPartId}` : '/api/parts'
      const method = editingPartId ? 'PUT' : 'POST'

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
        editingPartId ? 'แก้ไขข้อมูลอะไหล่สำเร็จ' : 'เพิ่มรายการอะไหล่สำเร็จ'
      )
      setIsAddModalOpen(false)
      fetchParts()
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')

    try {
      const res = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: selectedPart.id,
          newQuantity: adjustData.newQuantity,
          reason: adjustData.reason,
          adjustedBy: adjustData.adjustedBy,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'ไม่สามารถปรับยอดสต็อกได้')
        return
      }

      setSuccessMessage(`ปรับยอดอะไหล่ "${selectedPart.name}" เรียบร้อยแล้ว`)
      setIsAdjustModalOpen(false)
      fetchParts()
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาด')
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

      const res = await fetch('/api/parts/import', {
        method: 'POST',
        body: data,
      })
      const result = await res.json()

      if (!res.ok) {
        setImportError(result.error || 'เกิดข้อผิดพลาดในการนำเข้าไฟล์')
        return
      }

      setImportResult(result)
      fetchParts()
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
          <h1 className="text-2xl font-bold text-slate-800">คลังอะไหล่ (Parts Inventory)</h1>
          <p className="text-sm text-slate-500 mt-1">
            ทะเบียนพัสดุ อะไหล่สำรอง ยอดคงเหลือ และจุดสั่งซื้อซ้ำ
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
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            นำเข้า Excel
          </button>
          <Link
            href="/stock-in"
            className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition"
          >
            + รับเข้าอะไหล่
          </Link>
          <Link
            href="/stock-out"
            className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 transition"
          >
            - เบิกจ่ายอะไหล่
          </Link>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            เพิ่มทะเบียนอะไหล่
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
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหารหัสอะไหล่, ชื่อ, รุ่นที่ใช้ได้, ตำแหน่ง..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-blue-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>เรียงตาม:</span>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_')
                setSortBy(sb)
                setSortOrder(so as 'asc' | 'desc')
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-blue-500"
            >
              <option value="quantity_desc">ยอดคงเหลือ: High to Low (มาก → น้อย)</option>
              <option value="quantity_asc">ยอดคงเหลือ: Low to High (น้อย → มาก)</option>
              <option value="costPerUnit_desc">ราคาทุน: High to Low (มาก → น้อย)</option>
              <option value="costPerUnit_asc">ราคาทุน: Low to High (น้อย → มาก)</option>
              <option value="name_asc">ชื่ออะไหล่: A → Z (ก-ฮ)</option>
              <option value="code_asc">รหัสอะไหล่: A → Z</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-blue-500"
          >
            <option value="">ทุกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {[
              { id: '', label: 'ทั้งหมด' },
              { id: 'normal', label: 'ปกติ' },
              { id: 'low', label: 'ใกล้หมด' },
              { id: 'out', label: 'หมดสต็อก' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStockStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  stockStatusFilter === st.id
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 select-none">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center">
                    <span>รหัส / ชื่ออะไหล่</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>
                <th className="px-5 py-3.5">หมวดหมู่ / ยี่ห้อ</th>
                <th className="px-5 py-3.5">รุ่นที่เข้ากันได้</th>
                <th className="px-5 py-3.5 text-center">ตำแหน่งเก็บ</th>
                <th
                  onClick={() => handleSort('costPerUnit')}
                  className="px-5 py-3.5 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end">
                    <span>ราคาทุน/หน่วย</span>
                    {renderSortIndicator('costPerUnit')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantity')}
                  className="px-5 py-3.5 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end">
                    <span>ยอดคงเหลือ</span>
                    {renderSortIndicator('quantity')}
                  </div>
                </th>
                <th className="px-5 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-sm">
                    กำลังโหลดข้อมูลอะไหล่...
                  </td>
                </tr>
              ) : sortedParts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">ไม่พบรายการอะไหล่</p>
                  </td>
                </tr>
              ) : (
                sortedParts.map((p) => {
                  const isOut = p.quantity <= 0
                  const isLow = !isOut && p.quantity <= p.minimumStock

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800 font-mono text-xs">{p.code}</div>
                        <div className="text-sm font-medium text-slate-800 mt-0.5">{p.name}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-medium text-slate-700">
                          {p.category?.name || '-'}
                        </div>
                        <div className="text-xs text-slate-400">{p.brand || '-'}</div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 max-w-xs">
                        {p.compatibleModels || '-'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {p.location || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-slate-800 text-xs">
                        {formatCurrency(p.costPerUnit)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div
                          className={`font-bold text-base ${
                            isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-slate-800'
                          }`}
                        >
                          {p.quantity.toLocaleString()} {p.unit}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          เตือนเมื่อต่ำกว่า {p.minimumStock} {p.unit}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedPart(p)
                              setAdjustData({
                                newQuantity: p.quantity,
                                reason: '',
                                adjustedBy: '',
                              })
                              setErrorMessage('')
                              setIsAdjustModalOpen(true)
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                            title="ตรวจนับ / ปรับปรุงยอดสต็อกจริง"
                          >
                            <Sliders className="h-3 w-3" />
                            ปรับยอด
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition"
                            title="แก้ไขรายละเอียดอะไหล่"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePart(p)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="ลบอะไหล่นี้"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Part */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingPartId ? 'แก้ไขข้อมูลอะไหล่' : 'ลงทะเบียนอะไหล่ใหม่'}
              </h2>
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

            <form onSubmit={handleSavePart} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    รหัสอะไหล่ (Part No.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น FLT-OIL-TOY"
                    value={formData.code}
                    disabled={!!editingPartId}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500 font-mono disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ชื่ออะไหล่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ไส้กรองน้ำมันเครื่อง Toyota แท้"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">หมวดหมู่</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ยี่ห้อ</label>
                  <input
                    type="text"
                    placeholder="เช่น Denso, Castrol, Toyota"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="ชิ้น, แกลลอน, ลูก, ชุด"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ตำแหน่งจัดเก็บ (Location)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ชั้น A1-02"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>

                {!editingPartId && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      จำนวนเริ่มต้นยกมา
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    จำนวนขั้นต่ำที่จะแจ้งเตือน
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.minimumStock}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumStock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                  <span className="text-[10px] text-slate-400">ระบบจะแจ้งเตือนเมื่อยอดคงเหลือลดลงถึงหรือต่ำกว่าจำนวนนี้</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ราคาทุนต่อหน่วย (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.costPerUnit}
                    onChange={(e) =>
                      setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  รุ่นรถที่สามารถใช้งานร่วมกันได้
                </label>
                <input
                  type="text"
                  placeholder="เช่น Hilux Revo, Fortuner, Commuter ทุกรุ่นปี 2020+"
                  value={formData.compatibleModels}
                  onChange={(e) => setFormData({ ...formData, compatibleModels: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุ</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
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
                  {submitting ? 'กำลังบันทึก...' : editingPartId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลอะไหล่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adjust Stock */}
      {isAdjustModalOpen && selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800">ตรวจนับและปรับยอดสต็อก</h3>
                <p className="text-xs text-slate-500">{selectedPart.name}</p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
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

            <form onSubmit={handleAdjustStock} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                <span className="text-slate-500">ยอดคงเหลือเดิมในระบบ:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedPart.quantity} {selectedPart.unit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ยอดนับจริงใหม่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={adjustData.newQuantity}
                  onChange={(e) =>
                    setAdjustData({
                      ...adjustData,
                      newQuantity: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เหตุผลในการปรับยอด <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="เช่น ตรวจนับสิ้นเดือนพบของขาด, ชำรุดเสียหาย, คีย์ผิด"
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ผู้ทำรายการตรวจนับ
                </label>
                <input
                  type="text"
                  placeholder="ชื่อเจ้าหน้าที่ตรวจนับ"
                  value={adjustData.adjustedBy}
                  onChange={(e) => setAdjustData({ ...adjustData, adjustedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'กำลังบันทึก...' : 'ยืนยันปรับยอด'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Part */}
      {isDeleteModalOpen && partToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการลบรายการอะไหล่</h3>
                <p className="text-xs text-slate-500 font-mono">{partToDelete.code}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl mb-4 text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">ชื่ออะไหล่:</span>
                <span className="font-semibold text-slate-800">{partToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ยอดคงเหลือในคลัง:</span>
                <span className="font-semibold text-slate-800">
                  {partToDelete.quantity} {partToDelete.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ราคาทุน:</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(partToDelete.costPerUnit)}
                </span>
              </div>
            </div>

            {deleteRelationError && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  พบรายการเอกสารที่เกี่ยวข้อง
                </div>
                <p>{deleteRelationError}</p>
                <label className="flex items-start gap-2 pt-1 font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceDelete}
                    onChange={(e) => setForceDelete(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span>ฉันเข้าใจความเสี่ยงและต้องการลบอะไหล่นี้ออกจากระบบโดยบังคับ (Force Delete)</span>
                </label>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setPartToDelete(null)
                  setDeleteRelationError('')
                  setForceDelete(false)
                }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeletePart}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
              >
                {isDeleting ? 'กำลังลบ...' : forceDelete ? 'ยืนยันลบแบบบังคับ' : 'ยืนยันลบอะไหล่นี้'}
              </button>
            </div>
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
                <h3 className="font-bold text-slate-800 text-lg">นำเข้าข้อมูลอะไหล่จาก Excel</h3>
                <p className="text-xs text-slate-500">
                  รองรับทั้งไฟล์ระบบเดิม (N.PSA.2569) และไฟล์ตาราง Excel มาตรฐาน
                </p>
              </div>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              {/* Template Download */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <span className="text-slate-600">ต้องการดูรูปแบบตารางที่แนะนำ?</span>
                <a
                  href="/api/parts/template"
                  download="parts_import_template.xlsx"
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
                  id="excelFileInput"
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
                <label htmlFor="excelFileInput" className="cursor-pointer flex flex-col items-center">
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
                    <strong>อัปเดตข้อมูลเดิม:</strong> หากพบรหัสอะไหล่ซ้ำ ให้ปรับปรุงยอดคงเหลือและราคาทุนตามไฟล์ Excel
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
                      <div className="text-slate-500 text-[10px]">เพิ่มใหม่</div>
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
