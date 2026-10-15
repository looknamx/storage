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
  GitBranch,
  RefreshCw,
  Clock,
  ArrowUpCircle,
  Check,
  ExternalLink,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    company_name: 'บริษัท ไทยฟลีท ทรานสปอร์ต จำกัด',
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

  // System Update state
  const [versionInfo, setVersionInfo] = useState<any>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updatingSystem, setUpdatingSystem] = useState(false)
  const [updateLog, setUpdateLog] = useState<string[]>([])

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

  const checkVersion = async () => {
    try {
      setCheckingUpdate(true)
      const res = await fetch('/api/system/update')
      const data = await res.json()
      setVersionInfo(data)
    } catch (err) {
      console.error('Failed to check version:', err)
    } finally {
      setCheckingUpdate(false)
    }
  }

  useEffect(() => {
    fetchAll()
    checkVersion()
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

  const handleExecuteUpdate = async () => {
    if (!confirm('ยืนยันการอัปเดตระบบตาม GitHub? ระบบจะดึงโค้ดล่าสุดลงมาโดยที่ข้อมูลในเครื่องไม่สูญหาย')) {
      return
    }

    try {
      setUpdatingSystem(true)
      setErrorMessage('')
      setSuccessMessage('')
      setUpdateLog([])

      const res = await fetch('/api/system/update', {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'การอัปเดตระบบล้มเหลว')
        if (data.logs) setUpdateLog(data.logs)
        return
      }

      setSuccessMessage(data.message || 'อัปเดตระบบสำเร็จ กรุณารีเฟรชหน้าเว็บ')
      if (data.logs) setUpdateLog(data.logs)
      checkVersion()
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่ออัปเดต')
    } finally {
      setUpdatingSystem(false)
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

      {/* ================= SECTION: System Version & GitHub Update ================= */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                การตรวจสอบเวอร์ชัน & อัปเดตจาก GitHub
              </h2>
              <p className="text-xs text-slate-400">
                ตรวจหาโค้ดเวอร์ชันล่าสุดบน GitHub และดึงมาอัปเดตระบบในเครื่อง Local อัตโนมัติ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={checkVersion}
              disabled={checkingUpdate || updatingSystem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
              {checkingUpdate ? 'กำลังตรวจหา...' : 'ตรวจหาเวอร์ชันใหม่'}
            </button>
          </div>
        </div>

        {/* Version Status Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-medium">เวอร์ชันปัจจุบันบนเครื่องนี้ (Local)</div>
            <div className="text-sm font-semibold text-white mt-1 flex items-center gap-2">
              <span className="font-mono bg-slate-700 px-2 py-0.5 rounded text-blue-300">
                {versionInfo?.current?.short || 'กำลังโหลด...'}
              </span>
              <span className="text-xs text-slate-400">({versionInfo?.branch || 'master'})</span>
            </div>
            {versionInfo?.current?.message && (
              <p className="text-xs text-slate-300 mt-2 truncate" title={versionInfo.current.message}>
                {versionInfo.current.message}
              </p>
            )}
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-medium">เวอร์ชันล่าสุดบน GitHub Remote</div>
            <div className="text-sm font-semibold text-white mt-1 flex items-center gap-2">
              <span className="font-mono bg-slate-700 px-2 py-0.5 rounded text-emerald-300">
                {versionInfo?.latest?.short || 'กำลังตรวจสอบ...'}
              </span>
              <a
                href={`https://github.com/${versionInfo?.repo || 'looknamx/storage'}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-0.5"
              >
                ดูบน GitHub <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {versionInfo?.latest?.message && (
              <p className="text-xs text-slate-300 mt-2 truncate" title={versionInfo.latest.message}>
                {versionInfo.latest.message}
              </p>
            )}
          </div>
        </div>

        {/* Update Notification Banner */}
        {versionInfo?.hasUpdate ? (
          <div className="bg-blue-600/30 border border-blue-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 text-white rounded-lg">
                <ArrowUpCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-blue-200">
                  มีโค้ดอัปเดตเวอร์ชันใหม่พร้อมใช้งาน! ({versionInfo.latest.short})
                </div>
                <div className="text-xs text-blue-300/90 mt-0.5">
                  เมื่อกดอัปเดต ระบบจะดึงโค้ดล่าสุดลงมาโดยที่ฐานข้อมูลในเครื่องของคุณจะไม่สูญหาย
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExecuteUpdate}
              disabled={updatingSystem}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${updatingSystem ? 'animate-spin' : ''}`} />
              {updatingSystem ? 'กำลังดาวน์โหลดและอัปเดต...' : 'อัปเดตระบบทันที'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-3 py-2 rounded-xl">
            <Check className="h-4 w-4" />
            <span>
              {versionInfo?.checkError
                ? `หมายเหตุ: ${versionInfo.checkError}`
                : 'ระบบของคุณเป็นเวอร์ชันล่าสุดแล้ว ซิงค์ตรงกับ GitHub เรียบร้อย'}
            </span>
          </div>
        )}

        {/* Logs if available */}
        {updateLog.length > 0 && (
          <div className="bg-black/50 p-3 rounded-xl border border-slate-700 font-mono text-[11px] text-slate-300 space-y-1">
            <div className="font-bold text-slate-400 mb-1">ผลการทำงาน (Update Logs):</div>
            {updateLog.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        )}
      </div>

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

      {/* Architecture Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
          <Shield className="h-4 w-4 text-emerald-600" />
          ข้อมูลสถาปัตยกรรมระบบเครื่องเดี่ยว (Standalone Architecture)
        </h2>
        <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
          <div>• <strong>ระบบฐานข้อมูล:</strong> SQLite บนไฟล์ดิสก์จริง (./data/storage.db)</div>
          <div>• <strong>ความปลอดภัยของข้อมูล:</strong> การอัปเดตโค้ดผ่าน GitHub จะอัปเดตเฉพาะ Source Code โดยไม่มีการแตะต้องหรือเขียนทับไฟล์ `storage.db` ฐานข้อมูลเด็ดขาด</div>
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
