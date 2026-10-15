'use client'

import React, { useState, useEffect } from 'react'
import {
  Settings,
  Save,
  Building,
  Bell,
  CheckCircle2,
  Database,
  Shield,
  HelpCircle,
  X,
  Package,
  Car,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    company_name: 'บริษัท ไทยฟลีท ทรานสปอร์ต จำกัด',
    default_advance_days: '30',
    default_advance_km: '1000',
    contact_phone: '02-123-4567',
    currency_symbol: '฿',
  })

  // Categories & Types
  const [partCategories, setPartCategories] = useState<any[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Modal Add Category
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalKind, setModalKind] = useState<'part' | 'vehicle'>('part')
  const [newCatName, setNewCatName] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [settingsRes, catsRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/categories'),
      ])

      const settingsData = await settingsRes.json()
      const catsData = await catsRes.json()

      if (Array.isArray(settingsData)) {
        const mapped: Record<string, string> = {}
        settingsData.forEach((s) => {
          mapped[s.key] = s.value
        })
        setSettings((prev) => ({ ...prev, ...mapped }))
      }

      setPartCategories(catsData.partCategories || [])
      setVehicleTypes(catsData.vehicleTypes || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const payload = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        group: key.startsWith('default_advance') ? 'maintenance' : 'general',
      }))

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการบันทึก')

      setSuccessMessage('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว')
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถบันทึกได้')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: modalKind,
          name: newCatName,
          description: newCatDesc,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error || 'ไม่สามารถเพิ่มได้')
        return
      }

      setSuccessMessage(`เพิ่ม${modalKind === 'vehicle' ? 'ประเภทรถ' : 'หมวดหมู่อะไหล่'} "${newCatName}" สำเร็จ`)
      setIsModalOpen(false)
      setNewCatName('')
      setNewCatDesc('')
      fetchAll()
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาด')
    }
  }

  const handleDeleteCategory = async (id: string, name: string, kind: 'part' | 'vehicle') => {
    if (!confirm(`คุณต้องการลบ "${name}" ใช่หรือไม่?`)) return

    try {
      setErrorMessage('')
      const res = await fetch(`/api/categories?id=${id}&kind=${kind}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'ไม่สามารถลบได้')
        return
      }

      setSuccessMessage(`ลบ "${name}" เรียบร้อยแล้ว`)
      fetchAll()
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาด')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ตั้งค่าระบบ (System Settings)</h1>
        <p className="text-sm text-slate-500 mt-1">
          กำหนดชื่อหน่วยงาน หมวดหมู่อะไหล่ ประเภทรถ และค่าพารามิเตอร์ของระบบ
        </p>
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

      {/* Section 1: General Info */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
            <Building className="h-4 w-4 text-blue-600" />
            ข้อมูลหน่วยงาน / องค์กร
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชื่อหน่วยงาน / บริษัท
              </label>
              <input
                type="text"
                value={settings.company_name || ''}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
              <input
                type="text"
                value={settings.contact_phone || ''}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Maintenance Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
            <Bell className="h-4 w-4 text-amber-600" />
            ค่าเริ่มต้นการแจ้งเตือนซ่อมบำรุงล่วงหน้า
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ระยะเวลาเตือนล่วงหน้า (วัน)
              </label>
              <input
                type="number"
                min="1"
                value={settings.default_advance_days || ''}
                onChange={(e) =>
                  setSettings({ ...settings, default_advance_days: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                แจ้งเตือนสถานะ &quot;ใกล้ครบกำหนด&quot; ก่อนถึงวันจริง (เช่น 30 วัน)
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ระยะทางเตือนล่วงหน้า (กิโลเมตร)
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={settings.default_advance_km || ''}
                onChange={(e) =>
                  setSettings({ ...settings, default_advance_km: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                แจ้งเตือนสถานะ &quot;ใกล้ครบกำหนด&quot; ก่อนถึงเลขไมล์เป้าหมาย (เช่น 1,000 กม.)
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั่วไป'}
            </button>
          </div>
        </div>
      </form>

      {/* Section 3: Categories & Vehicle Types Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box A: หมวดหมู่อะไหล่ */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Package className="h-4 w-4 text-indigo-600" />
              หมวดหมู่อะไหล่ ({partCategories.length})
            </h2>
            <button
              type="button"
              onClick={() => {
                setModalKind('part')
                setNewCatName('')
                setNewCatDesc('')
                setIsModalOpen(true)
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="h-3.5 w-3.5" />
              เพิ่มหมวดหมู่
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {partCategories.map((cat) => (
              <div key={cat.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800">{cat.name}</span>
                  {cat.description && (
                    <span className="text-slate-400 ml-2">({cat.description})</span>
                  )}
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    มีอะไหล่ {cat._count?.parts || 0} รายการ
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id, cat.name, 'part')}
                  className="p-1 text-slate-400 hover:text-red-600 transition"
                  title="ลบหมวดหมู่"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Box B: หมวดหมู่ประเภทรถ */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Car className="h-4 w-4 text-emerald-600" />
              ประเภทรถบริษัท ({vehicleTypes.length})
            </h2>
            <button
              type="button"
              onClick={() => {
                setModalKind('vehicle')
                setNewCatName('')
                setNewCatDesc('')
                setIsModalOpen(true)
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800"
            >
              <Plus className="h-3.5 w-3.5" />
              เพิ่มประเภทรถ
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {vehicleTypes.map((vt) => (
              <div key={vt.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800">{vt.name}</span>
                  {vt.description && (
                    <span className="text-slate-400 ml-2">({vt.description})</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(vt.id, vt.name, 'vehicle')}
                  className="p-1 text-slate-400 hover:text-red-600 transition"
                  title="ลบประเภทรถ"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
          <Shield className="h-4 w-4 text-emerald-600" />
          ข้อมูลสถาปัตยกรรมระบบเครื่องเดี่ยว (Standalone Architecture)
        </h2>
        <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
          <div>• <strong>ระบบฐานข้อมูล:</strong> SQLite บนไฟล์ดิสก์จริง (./data/storage.db)</div>
          <div>• <strong>การเชื่อมโยง:</strong> Prisma ORM Type-safe Client</div>
          <div>• <strong>การขยายระบบในอนาคต:</strong> สามารถปรับเปลี่ยนเป็น PostgreSQL เพื่อรองรับ Multi-user และระบบคลาวด์ได้โดยไม่ต้องเขียนโค้ดใหม่ทั้งหมด</div>
        </div>
      </div>

      {/* Modal Add Category/Type */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl relative space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm">
                {modalKind === 'vehicle' ? 'เพิ่มประเภทรถใหม่' : 'เพิ่มหมวดหมู่อะไหล่ใหม่'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อ{modalKind === 'vehicle' ? 'ประเภทรถ' : 'หมวดหมู่'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={modalKind === 'vehicle' ? 'เช่น รถยกโฟล์คลิฟต์, รถจักรยานยนต์' : 'เช่น ระบบไฟฟ้า, ของตกแต่ง'}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">คำอธิบายเพิ่มเติม</label>
                <input
                  type="text"
                  placeholder="รายละเอียดสั้นๆ"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-600"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
