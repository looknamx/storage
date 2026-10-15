'use client'

import React, { useState, useEffect } from 'react'
import {
  PackagePlus,
  Plus,
  Trash2,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  X,
  History,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ReceiveItem {
  partId: string
  quantity: number
  costPerUnit: number
  notes?: string
}

export default function StockInPage() {
  const [parts, setParts] = useState<any[]>([])
  const [recentReceipts, setRecentReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Form states
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0])
  const [purchaseOrderRef, setPurchaseOrderRef] = useState('')
  const [receivedBy, setReceivedBy] = useState('เจ้าหน้าที่คลัง')
  const [notes, setNotes] = useState('')

  const [items, setItems] = useState<ReceiveItem[]>([
    { partId: '', quantity: 1, costPerUnit: 0, notes: '' },
  ])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [partsRes, receiptsRes] = await Promise.all([
        fetch('/api/parts'),
        fetch('/api/stock/receive'),
      ])

      const partsData = await partsRes.json()
      const receiptsData = await receiptsRes.json()

      setParts(partsData.parts || [])
      setRecentReceipts(Array.isArray(receiptsData) ? receiptsData : [])
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
    setItems([...items, { partId: '', quantity: 1, costPerUnit: 0, notes: '' }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleItemChange = (index: number, field: keyof ReceiveItem, value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }

    // Auto-fill cost if part selected
    if (field === 'partId') {
      const selected = parts.find((p) => p.id === value)
      if (selected) {
        updated[index].costPerUnit = selected.costPerUnit || 0
      }
    }

    setItems(updated)
  }

  const calculateTotal = () => {
    return items.reduce((acc, it) => acc + (it.quantity || 0) * (it.costPerUnit || 0), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    // Validation
    const invalidItems = items.filter((it) => !it.partId || it.quantity <= 0)
    if (invalidItems.length > 0) {
      setErrorMessage('กรุณาเลือกอะไหล่และระบุจำนวนที่มากกว่า 0 ให้ครบทุกรายการ')
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/stock/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptDate,
          purchaseOrderRef,
          receivedBy,
          notes,
          items,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการรับเข้าสต็อก')
        return
      }

      setSuccessMessage(`บันทึกรับเข้าอะไหล่เลขที่เอกสาร ${data.receiptNumber} สำเร็จแล้ว`)
      // Reset
      setPurchaseOrderRef('')
      setNotes('')
      setItems([{ partId: '', quantity: 1, costPerUnit: 0, notes: '' }])
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">รับอะไหล่เข้าคลัง (Stock In)</h1>
        <p className="text-sm text-slate-500 mt-1">
          บันทึกการรับสินค้าเข้าสต็อก เพิ่มจำนวนพัสดุ และอัปเดตราคาทุนเฉลี่ย
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-base font-bold text-slate-800 border-b pb-3">
              เอกสารการรับเข้าพัสดุ
            </h2>

            {/* Header info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วันที่รับเข้าสินค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เลขที่ใบสั่งซื้อ (PO) / ใบส่งของอ้างอิง
                </label>
                <input
                  type="text"
                  placeholder="เช่น PO-2569/008 หรือ INV-9981"
                  value={purchaseOrderRef}
                  onChange={(e) => setPurchaseOrderRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ผู้รับสินค้าเข้าคลัง
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-bold text-slate-800">
                  รายการอะไหล่ที่รับเข้า ({items.length} รายการ)
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  เพิ่มแถวอะไหล่
                </button>
              </div>

              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-3 items-center"
                  >
                    <div className="col-span-12 md:col-span-5">
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
                          <option key={p.id} value={p.id}>
                            [{p.code}] {p.name} (คงเหลือ: {p.quantity} {p.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        จำนวนรับ
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

                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        ทุน/หน่วย (บาท)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.costPerUnit}
                        onChange={(e) =>
                          handleItemChange(idx, 'costPerUnit', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-right"
                      />
                    </div>

                    <div className="col-span-10 md:col-span-2 text-right">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        รวมเงิน
                      </label>
                      <div className="text-xs font-bold text-slate-800 py-1.5">
                        {formatCurrency((it.quantity || 0) * (it.costPerUnit || 0))}
                      </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 text-center">
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
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="p-4 bg-slate-100 rounded-xl flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">มูลค่ารับเข้ารวมทั้งสิ้น:</span>
                <span className="text-xl font-bold text-emerald-700">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุเอกสาร</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ระบุข้อความบันทึกเพิ่มเติม เช่น ตรวจรับพัสดุครบถ้วน..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
              />
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
              >
                {submitting ? 'กำลังบันทึกรับเข้า...' : 'ยืนยันรับอะไหล่เข้าคลัง'}
              </button>
            </div>
          </form>
        </div>

        {/* Right side: Recent Receipts (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <History className="h-4 w-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">ประวัติการรับเข้าล่าสุด</h3>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {recentReceipts.length > 0 ? (
              recentReceipts.slice(0, 10).map((rec) => (
                <div key={rec.id} className="py-3 text-xs">
                  <div className="flex items-center justify-between font-medium">
                    <span className="font-mono text-slate-800">{rec.receiptNumber}</span>
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(rec.totalAmount)}
                    </span>
                  </div>
                  <div className="text-slate-500 mt-1">
                    ผู้รับเข้า: {rec.receivedBy || 'เจ้าหน้าที่คลัง'} {rec.purchaseOrderRef ? `(PO: ${rec.purchaseOrderRef})` : ''}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex justify-between">
                    <span>{formatDate(rec.receiptDate)}</span>
                    <span>{rec.items?.length || 0} รายการ</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                ยังไม่มีประวัติการรับสินค้าเข้า
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

