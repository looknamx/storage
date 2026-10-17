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
  RefreshCw,
  Clock,
  Check,
  Download,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    company_name: 'บริษัท เฮียเชาว์ จำกัด (iHereCHOW Co.,Ltd)',
    pincode_program_a: '1234',
    pincode_program_b: '1234',
    default_advance_days: '30',
    default_advance_km: '1000',
    contact_phone: '02-123-4567',
    currency_symbol: '฿',
    auto_backup_enabled: 'false',
    auto_backup_interval_days: '7',
    last_auto_backup_date: '',
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

  // Reset System & Mandatory Backup State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [confirmResetText, setConfirmResetText] = useState('')
  const [resetting, setResetting] = useState(false)
  const [exportingSnapshot, setExportingSnapshot] = useState(false)

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
        group: key.startsWith('default_advance')
          ? 'maintenance'
          : key.startsWith('auto_backup')
          ? 'backup'
          : 'general',
      }))

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการบันทึก')

      // If auto backup enabled right now, trigger check
      if (settings.auto_backup_enabled === 'true') {
        fetch('/api/backup/auto')
      }

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

  const handleExportSnapshot = async () => {
    try {
      setExportingSnapshot(true)
      setErrorMessage('')
      const res = await fetch('/api/system/export-snapshot?scope=program_a')
      if (!res.ok) throw new Error('ไม่สามารถดาวน์โหลดไฟล์สำรองข้อมูลได้')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fleet_maintenance_snapshot_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      setSuccessMessage('ดาวน์โหลดไฟล์สำรองข้อมูล (Maintenance Snapshot) สำเร็จเรียบร้อยแล้ว')
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการดาวน์โหลดสำรองข้อมูล')
    } finally {
      setExportingSnapshot(false)
    }
  }

  const handleExecuteReset = async () => {
    if (confirmResetText !== 'RESET') return
    try {
      setResetting(true)
      setErrorMessage('')

      const res = await fetch('/api/system/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: 'RESET', scope: 'program_a' }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'การล้างข้อมูลระบบล้มเหลว')
      }

      // MANDATORY SAFETY BACKUP: Automatic forced browser download
      if (data.snapshot) {
        const blob = new Blob([JSON.stringify(data.snapshot, null, 2)], {
          type: 'application/json',
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.backupFilename || `fleet_backup_before_reset_${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }

      setIsResetModalOpen(false)
      setConfirmResetText('')
      setSuccessMessage(
        `ล้างข้อมูลระบบสำเร็จเรียบร้อย! ระบบได้สำรองข้อมูลอัตโนมัติและดาวน์โหลดไฟล์ "${data.backupFilename}" ลงเครื่องคอมพิวเตอร์ของท่านแล้ว (ล้างข้อมูลอะไหล่ ${data.deletedSummary?.parts || 0} รายการ, รถ ${data.deletedSummary?.vehicles || 0} คัน) พร้อมสำหรับเริ่มบันทึกข้อมูลใหม่`
      )
      fetchAll()
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการล้างข้อมูล')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ตั้งค่าระบบ (System Settings)</h1>
        <p className="text-sm text-slate-500 mt-1">
          กำหนดชื่อหน่วยงาน หมวดหมู่อะไหล่ ประเภทรถ การสำรองข้อมูลอัตโนมัติ และอัปเดตระบบ
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

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section: Auto Backup Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              การสำรองข้อมูลอัตโนมัติ (Auto Backup)
            </h2>
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.auto_backup_enabled === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      auto_backup_enabled: e.target.checked ? 'true' : 'false',
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-700">
                  {settings.auto_backup_enabled === 'true' ? 'เปิดใช้งาน' : 'ปิดการทำงาน'}
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                รอบระยะเวลาการสำรองข้อมูลอัตโนมัติ
              </label>
              <select
                disabled={settings.auto_backup_enabled !== 'true'}
                value={settings.auto_backup_interval_days || '7'}
                onChange={(e) =>
                  setSettings({ ...settings, auto_backup_interval_days: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="3">ทุกๆ 3 วัน</option>
                <option value="5">ทุกๆ 5 วัน</option>
                <option value="7">ทุกๆ 7 วัน (แนะนำ)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                ระบบจะตรวจสอบและสร้างไฟล์ Snapshot อัตโนมัติเมื่อมีการเปิดใช้งานโปรแกรม
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                สำรองข้อมูลอัตโนมัติล่าสุด
              </label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between">
                <span>
                  {settings.last_auto_backup_date
                    ? formatDate(settings.last_auto_backup_date)
                    : 'ยังไม่มีประวัติการสำรองอัตโนมัติ'}
                </span>
                <Clock className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                ไฟล์จะถูกเก็บไว้ที่โฟลเดอร์ <code className="bg-slate-100 px-1 py-0.5 rounded">./backups/</code>
              </span>
            </div>
          </div>
        </div>

        {/* Section: General Info */}
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


        {/* Section: Maintenance Alerts */}
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
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าระบบ'}
            </button>
          </div>
        </div>
      </form>

      {/* Section: Categories & Vehicle Types Management */}
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

      {/* Danger Zone: Handover & Reset Database */}
      <div className="bg-red-50/70 border-2 border-red-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-200 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-red-950 flex items-center gap-2">
                โซนอันตราย: ส่งมอบโปรเจกต์ & ล้างข้อมูลระบบซ่อมบำรุง
              </h2>
              <p className="text-xs text-red-700 mt-0.5">
                สำหรับผู้ดูแลระบบ: ใช้เมื่อต้องการล้างข้อมูลรถและสต็อกอะไหล่เพื่อเริ่มบันทึกใหม่ (ข้อมูลเที่ยววิ่งของฝ่ายการตลาดจะไม่ได้รับผลกระทบ)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportSnapshot}
              disabled={exportingSnapshot}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-blue-600" />
              {exportingSnapshot ? 'กำลังส่งออก...' : 'ดาวน์โหลด Snapshot สำรองข้อมูล'}
            </button>

            <button
              type="button"
              onClick={() => {
                setConfirmResetText('')
                setIsResetModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
              ลบข้อมูลเฉพาะระบบซ่อมบำรุงเพื่อเริ่มใช้งานใหม่
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white/80 p-3.5 rounded-xl border border-red-100 space-y-1.5">
            <div className="font-bold text-red-800 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-red-600" />
              ระบบบังคับสำรองข้อมูลอัตโนมัติ (Forced Safety Backup)
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              เมื่อกดลบข้อมูล ระบบจะทำการ Export ฐานข้อมูลของระบบซ่อมบำรุงทุกตาราง และสั่งดาวน์โหลดไฟล์ <code>.json</code> ลงในเครื่องของท่านโดยอัตโนมัติทันทีก่อนการลบ เพื่อป้องกันข้อมูลสูญหาย 100%
            </p>
          </div>

          <div className="bg-white/80 p-3.5 rounded-xl border border-red-100 space-y-1.5">
            <div className="font-bold text-red-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              แยกข้อมูลอิสระ ไม่กระทบฝ่ายการตลาด
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              การล้างข้อมูลนี้จะลบเฉพาะข้อมูลรถและอะไหล่ของฝ่ายซ่อมบำรุงเท่านั้น <strong>ข้อมูลเที่ยววิ่งและลูกค้าในระบบแผนงานการตลาดจะคงอยู่ครบถ้วน 100%</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Architecture Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
          <Shield className="h-4 w-4 text-emerald-600" />
          ข้อมูลสถาปัตยกรรมระบบ (Cloud & Standalone Architecture)
        </h2>
        <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
          <div>• <strong>ระบบฐานข้อมูลหลัก:</strong> เชื่อมต่อ Neon Cloud PostgreSQL (Serverless Cloud Database) พร้อมระบบสำรองอัตโนมัติ</div>
          <div>• <strong>ความปลอดภัยของข้อมูล:</strong> การอัปเดตโค้ดผ่าน GitHub จะอัปเดตเฉพาะ Source Code โดยไม่มีผลกระทบต่อข้อมูลจริงใน Cloud Database</div>
          <div>• <strong>การเข้าถึงหลายอุปกรณ์:</strong> ช่างสามารถเข้าถึงและบันทึกข้อมูลพร้อมกันได้จากทุกที่ทุกเวลาผ่านระบบคลาวด์</div>
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

      {/* Modal Confirm Reset & Forced Backup */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 text-red-600 border-b pb-3">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  ยืนยันการล้างข้อมูลระบบซ่อมบำรุง
                </h3>
                <p className="text-xs text-slate-500">
                  Project Handover - ส่งมอบระบบซ่อมบำรุงและเริ่มคีย์ข้อมูลใหม่
                </p>
              </div>
              <button
                onClick={() => !resetting && setIsResetModalOpen(false)}
                disabled={resetting}
                className="ml-auto text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-1.5">
                <p className="font-bold text-red-800">
                  ⚠️ การดำเนินการนี้จะลบข้อมูลเฉพาะระบบซ่อมบำรุงดังนี้:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-700">
                  <li>ข้อมูลอะไหล่ทั้งหมด และประวัติการรับเข้า-เบิกจ่าย-คืนอะไหล่</li>
                  <li>ข้อมูลรถบริษัททั้งหมด และประวัติการอ่านเลขไมล์</li>
                  <li>ใบงานซ่อมทั้งหมด และประวัติการซ่อมบำรุง</li>
                  <li>รายชื่อผู้จำหน่าย (Suppliers) และรายการแจ้งเตือนทั้งหมด</li>
                  <li className="font-semibold text-emerald-700 mt-1">
                    ✓ ข้อมูลเที่ยววิ่งขนส่งสินค้าและลูกค้าในระบบการตลาดจะคงอยู่ครบถ้วน 100% ไม่ถูกลบ
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-blue-800">
                  <Shield className="h-4 w-4 text-blue-600" />
                  ระบบบังคับสำรองข้อมูลลงเครื่องทันที (Forced Backup)
                </p>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  เมื่อกดยืนยัน ระบบจะรวบรวมข้อมูลทั้งหมดของระบบซ่อมบำรุงเป็นไฟล์ Snapshot และสั่งให้เว็บบราวเซอร์ดาวน์โหลดไฟล์ <code>fleet_backup_before_reset_*.json</code> ลงโฟลเดอร์ Downloads ในเครื่องของท่านทันทีโดยอัตโนมัติก่อนที่จะเริ่มทำการลบข้อมูล
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  เพื่อความปลอดภัยสูงสุด กรุณาพิมพ์คำว่า <span className="text-red-600 underline font-mono text-sm">RESET</span> เพื่อยืนยัน:
                </label>
                <input
                  type="text"
                  value={confirmResetText}
                  onChange={(e) => setConfirmResetText(e.target.value)}
                  placeholder="พิมพ์ RESET ตรงนี้..."
                  disabled={resetting}
                  className="w-full px-3.5 py-2.5 border-2 border-slate-300 focus:border-red-500 rounded-xl text-sm font-mono tracking-wider focus:outline-none uppercase"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                disabled={resetting}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={confirmResetText !== 'RESET' || resetting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
              >
                {resetting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    กำลังสำรองข้อมูลและล้างระบบ...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    สำรองข้อมูลและล้างระบบทันที
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
