'use client'

import React, { useState, useEffect } from 'react'
import {
  PackageMinus,
  Plus,
  Trash2,
  Calendar,
  Car,
  Wrench,
  CheckCircle2,
  X,
  History,
  RotateCcw,
  Sliders,
  AlertTriangle,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface IssueItem {
  partId: string
  quantity: number
  notes?: string
}

export default function StockOutPage() {
  const [activeTab, setActiveTab] = useState<'issue' | 'return' | 'history'>('issue')
  const [parts, setParts] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [repairOrders, setRepairOrders] = useState<any[]>([])
  const [issuesHistory, setIssuesHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Feedback messages
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Form Issue State
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [vehicleId, setVehicleId] = useState('')
  const [repairOrderId, setRepairOrderId] = useState('')
  const [issuedBy, setIssuedBy] = useState('')
  const [issueNotes, setIssueNotes] = useState('')
  const [items, setItems] = useState<IssueItem[]>([{ partId: '', quantity: 1, notes: '' }])

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<any>(null)
  const [returnData, setReturnData] = useState({
    partId: '',
    quantity: 1,
    condition: 'good',
    reason: '',
    returnedBy: '',
  })

  // Delete Issue State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [issueToDelete, setIssueToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteIssue = async () => {
    if (!issueToDelete) return
    setIsDeleting(true)
    setErrorMessage('')
    try {
      const res = await fetch(`/api/stock/issue?id=${issueToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการลบใบเบิก')
        return
      }
      setSuccessMessage(data.message || 'ลบใบเบิกและคืนอะไหล่เข้าคลังเรียบร้อยแล้ว')
      setIsDeleteModalOpen(false)
      setIssueToDelete(null)
      fetchData()
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setIsDeleting(false)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [partsRes, vehiclesRes, issuesRes, dashRes] = await Promise.all([
        fetch('/api/parts'),
        fetch('/api/vehicles'),
        fetch('/api/stock/issue'),
        fetch('/api/dashboard'),
      ])

      const partsData = await partsRes.json()
      const vehiclesData = await vehiclesRes.json()
      const issuesData = await issuesRes.json()
      const dashData = await dashRes.json()

      setParts(partsData.parts || [])
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : [])
      setIssuesHistory(Array.isArray(issuesData) ? issuesData : [])
      // Use recent/active repair orders from dash
      setRepairOrders(dashData.activeRepairList || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddItem = () => {
    setItems([...items, { partId: '', quantity: 1, notes: '' }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleItemChange = (index: number, field: keyof IssueItem, value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    if (!vehicleId) {
      setErrorMessage('กรุณาเลือกทะเบียนรถปลายทางที่จะนำอะไหล่ไปใช้งาน')
      setSubmitting(false)
      return
    }

    if (!repairOrderId) {
      setErrorMessage('กรุณาเลือกใบงานซ่อมที่เกี่ยวข้อง')
      setSubmitting(false)
      return
    }

    // Check items stock
    for (const it of items) {
      if (!it.partId) {
        setErrorMessage('กรุณาเลือกอะไหล่ให้ครบทุกรายการ')
        setSubmitting(false)
        return
      }
      const part = parts.find((p) => p.id === it.partId)
      if (part && it.quantity > part.quantity) {
        setErrorMessage(
          `ไม่สามารถเบิก "${part.name}" จำนวน ${it.quantity} ได้ เนื่องจากยอดคงเหลือมีเพียง ${part.quantity} ${part.unit}`
        )
        setSubmitting(false)
        return
      }
    }

    try {
      const res = await fetch('/api/stock/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueDate,
          vehicleId,
          repairOrderId,
          issuedBy,
          notes: issueNotes,
          items,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการเบิกจ่าย')
        return
      }

      setSuccessMessage(`บันทึกการเบิกอะไหล่เลขที่ใบเบิก ${data.issueNumber} สำเร็จ`)
      setItems([{ partId: '', quantity: 1, notes: '' }])
      setIssueNotes('')
      fetchData()
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setSubmitting(false)
    }
  }

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')

    try {
      const res = await fetch('/api/stock/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: selectedIssue.id,
          partId: returnData.partId,
          quantity: returnData.quantity,
          condition: returnData.condition,
          reason: returnData.reason,
          returnedBy: returnData.returnedBy,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'ไม่สามารถทำการคืนอะไหล่ได้')
        return
      }

      setSuccessMessage(`บันทึกการคืนอะไหล่เลขที่ ${data.returnNumber} สำเร็จแล้ว`)
      setIsReturnModalOpen(false)
      fetchData()
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">เบิกจ่ายและคืนอะไหล่ (Stock Out & Return)</h1>
        <p className="text-sm text-slate-500 mt-1">
          การเบิกพัสดุอะไหล่ผูกกับทะเบียนรถและใบงานซ่อมจริง และบันทึกประวัติการส่งคืน
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('issue')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'issue'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ฟอร์มเบิกอะไหล่ไปใช้งาน
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ประวัติใบเบิก & บันทึกคืน ({issuesHistory.length})
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

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* TAB 1: Issue Form */}
      {activeTab === 'issue' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-4xl">
          <form onSubmit={handleSubmitIssue} className="space-y-6">
            <h2 className="text-base font-bold text-slate-800 border-b pb-3">
              สร้างใบเบิกอะไหล่ (ผูกกับรถและใบงานซ่อม)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ทะเบียนรถปลายทางที่จะใช้งาน <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                >
                  <option value="">-- เลือกทะเบียนรถ --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.licensePlate} ({v.brand} {v.model}) - {v.department || 'ไม่ระบุแผนก'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เลขที่ใบงานซ่อม (Repair Order) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={repairOrderId}
                  onChange={(e) => setRepairOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                >
                  <option value="">-- เลือกใบงานซ่อมที่กำลังดำเนินการ --</option>
                  {repairOrders.map((ro) => (
                    <option key={ro.id} value={ro.id}>
                      [{ro.orderNumber}] {ro.vehicle?.licensePlate || ''} - {ro.reportedSymptoms}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วันที่เบิกสินค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ผู้เบิก / ช่างผู้รับผิดชอบ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ชื่อ-นามสกุล ช่างผู้เบิก"
                  value={issuedBy}
                  onChange={(e) => setIssuedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>
            </div>

            {/* Items to Issue */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-bold text-slate-800">
                  รายการอะไหล่ที่ต้องการเบิก ({items.length} รายการ)
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  เพิ่มแถวอะไหล่
                </button>
              </div>

              <div className="space-y-3">
                {items.map((it, idx) => {
                  const partObj = parts.find((p) => p.id === it.partId)

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-3 items-center"
                    >
                      <div className="col-span-12 md:col-span-7">
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          เลือกอะไหล่ #{idx + 1}
                        </label>
                        <select
                          required
                          value={it.partId}
                          onChange={(e) => handleItemChange(idx, 'partId', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-blue-500"
                        >
                          <option value="">-- เลือกรายการอะไหล่ --</option>
                          {parts.map((p) => (
                            <option
                              key={p.id}
                              value={p.id}
                              disabled={p.quantity <= 0}
                              className={p.quantity <= 0 ? 'text-red-400' : ''}
                            >
                              [{p.code}] {p.name} (คงเหลือ: {p.quantity} {p.unit})
                              {p.quantity <= 0 ? ' - หมดสต็อก' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-8 md:col-span-3">
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          จำนวนที่ต้องการเบิก
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          required
                          value={it.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-right font-medium"
                        />
                      </div>

                      <div className="col-span-4 md:col-span-2 text-center">
                        <label className="block text-[11px] font-medium text-transparent mb-1">
                          ลบ
                        </label>
                        <button
                          type="button"
                          disabled={items.length <= 1}
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {partObj && it.quantity > partObj.quantity && (
                        <div className="col-span-12 text-xs text-red-600 font-medium">
                          ⚠️ จำนวนที่เบิกเกินกว่ายอดคงเหลือในสต็อก (มีเพียง {partObj.quantity}{' '}
                          {partObj.unit})
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุ</label>
              <textarea
                rows={2}
                value={issueNotes}
                onChange={(e) => setIssueNotes(e.target.value)}
                placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับการเบิกจ่าย..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
              />
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
              >
                {submitting ? 'กำลังตัดสต็อกและบันทึก...' : 'ยืนยันการเบิกอะไหล่'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: History & Returns */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {issuesHistory.length > 0 ? (
              issuesHistory.map((iss) => (
                <div key={iss.id} className="p-5 hover:bg-slate-50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 text-sm">
                          {iss.issueNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          ยืนยันแล้ว
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        รถปลายทาง: <span className="font-semibold text-slate-800">{iss.vehicle?.licensePlate}</span> ({iss.vehicle?.brand} {iss.vehicle?.model}) • ใบงาน:{' '}
                        <span className="font-mono">{iss.repairOrder?.orderNumber}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-800">
                          มูลค่าเบิก {formatCurrency(iss.totalAmount)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatDate(iss.issueDate)} • ผู้เบิก: {iss.issuedBy}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIssueToDelete(iss)
                          setIsDeleteModalOpen(true)
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="ลบใบเบิกนี้และคืนสต็อกอัตโนมัติ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Items in this issue */}
                  <div className="mt-3 space-y-2">
                    {iss.items.map((it: any) => {
                      const returnable = it.quantity - it.returnedQty

                      return (
                        <div
                          key={it.id}
                          className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <span className="font-medium text-slate-800">{it.part.name}</span>
                            <span className="text-slate-400 font-mono ml-2">({it.part.code})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-600">
                              เบิก {it.quantity} {it.part.unit}
                              {it.returnedQty > 0 && (
                                <span className="text-amber-600 ml-1">
                                  (คืนแล้ว {it.returnedQty})
                                </span>
                              )}
                            </span>
                            {returnable > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedIssue(iss)
                                  setReturnData({
                                    partId: it.partId,
                                    quantity: returnable,
                                    condition: 'good',
                                    reason: '',
                                    returnedBy: '',
                                  })
                                  setErrorMessage('')
                                  setIsReturnModalOpen(true)
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md text-xs font-medium transition"
                              >
                                <RotateCcw className="h-3 w-3" />
                                ทำรายการคืน
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                ยังไม่มีประวัติการเบิกจ่ายอะไหล่ในระบบ
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Return Part */}
      {isReturnModalOpen && selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800">คืนอะไหล่เข้าคลัง</h3>
                <p className="text-xs text-slate-500">อ้างอิงใบเบิก {selectedIssue.issueNumber}</p>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
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

            <form onSubmit={handleProcessReturn} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  จำนวนที่ต้องการคืน <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={returnData.quantity}
                  onChange={(e) =>
                    setReturnData({
                      ...returnData,
                      quantity: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  สภาพอะไหล่ที่นำมาคืน <span className="text-red-500">*</span>
                </label>
                <select
                  value={returnData.condition}
                  onChange={(e) => setReturnData({ ...returnData, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                >
                  <option value="good">สภาพสมบูรณ์ พร้อมใช้งาน (เพิ่มกลับเข้าสต็อก)</option>
                  <option value="damaged">ชำรุดเสียหาย (ไม่นำกลับเข้าสต็อกใช้งาน)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เหตุผลการคืน
                </label>
                <input
                  type="text"
                  placeholder="เช่น เบิกเกินจำนวน, เบิกผิดเบอร์, ไม่ได้ใช้งาน"
                  value={returnData.reason}
                  onChange={(e) => setReturnData({ ...returnData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ผู้ส่งคืนอะไหล่
                </label>
                <input
                  type="text"
                  placeholder="ชื่อผู้ส่งคืน"
                  value={returnData.returnedBy}
                  onChange={(e) => setReturnData({ ...returnData, returnedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'กำลังบันทึก...' : 'ยืนยันการคืนอะไหล่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Issue */}
      {isDeleteModalOpen && issueToDelete && (
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
                  ต้นทุนอะไหล่ในใบงานซ่อม{' '}
                  <span className="font-mono font-semibold">
                    {issueToDelete.repairOrder?.orderNumber || '-'}
                  </span>{' '}
                  จะถูกปรับลดยอดลง {formatCurrency(issueToDelete.totalAmount)}
                </li>
                <li>ประวัติการเบิกและประวัติการส่งคืนของใบนี้จะถูกลบออกจากระบบ</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setIssueToDelete(null)
                }}
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
    </div>
  )
}

