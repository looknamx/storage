'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  FileCheck,
  ShieldCheck,
  Clock,
  X,
  FileJson,
  Cloud,
  Laptop,
  FileUp,
  Check,
  Trash2,
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'

export default function BackupPage() {
  const [backups, setBackups] = useState<any[]>([])
  const [lastBackup, setLastBackup] = useState<any>(null)
  const [dbPath, setDbPath] = useState<string>('')
  const [isCloud, setIsCloud] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [backingUpCloud, setBackingUpCloud] = useState(false)
  const [backingUpDownload, setBackingUpDownload] = useState(false)
  const [restoring, setRestoring] = useState(false)

  // Scope Filter & Deletion
  const [fileFilter, setFileFilter] = useState<'maintenance' | 'all'>('maintenance')
  const [selectedBackupForDelete, setSelectedBackupForDelete] = useState<any>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Messages
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Confirmation Modal for server file restore
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false)
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<any>(null)

  // JSON Import & Restore from Computer state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedJsonFile, setSelectedJsonFile] = useState<File | null>(null)
  const [jsonPreviewData, setJsonPreviewData] = useState<any>(null)
  const [parsingJson, setParsingJson] = useState(false)
  const [isJsonRestoreModalOpen, setIsJsonRestoreModalOpen] = useState(false)

  const fetchBackups = async (filter = fileFilter) => {
    try {
      setLoading(true)
      const url = filter === 'all' ? '/api/backup' : '/api/backup?scope=maintenance'
      const res = await fetch(url)
      const data = await res.json()
      setBackups(data.backups || [])
      setLastBackup(data.lastBackup || null)
      setDbPath(data.databasePath || '')
      setIsCloud(!!data.isCloud)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  // Option 1: Backup on Cloud / Server
  const handleBackupToCloud = async () => {
    try {
      setBackingUpCloud(true)
      setErrorMessage('')
      setSuccessMessage('')

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Maintenance Server Snapshot', scope: 'maintenance' }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการสำรองข้อมูล')
        return
      }

      setSuccessMessage(
        `บันทึกไฟล์สำรองข้อมูล "${data.filename}" (${data.sizeFormatted}) ไว้บนระบบสำเร็จเรียบร้อยแล้ว`
      )
      fetchBackups()
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถสำรองข้อมูลได้')
    } finally {
      setBackingUpCloud(false)
    }
  }

  // Option 2: Download Snapshot to Computer (.json)
  const handleBackupAndDownload = async () => {
    try {
      setBackingUpDownload(true)
      setErrorMessage('')
      setSuccessMessage('')

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Maintenance Direct Download Snapshot', scope: 'maintenance' }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการสร้างไฟล์สำรองข้อมูล')
        return
      }

      // Trigger browser download
      if (data.snapshot) {
        const blob = new Blob([JSON.stringify(data.snapshot, null, 2)], {
          type: 'application/json',
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename || `fleet_backup_${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }

      setSuccessMessage(
        `สร้างไฟล์สำรองและดาวน์โหลด "${data.filename}" (${data.sizeFormatted}) ลงเครื่องคอมพิวเตอร์สำเร็จเรียบร้อยแล้ว`
      )
      fetchBackups()
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถดาวน์โหลดไฟล์สำรองข้อมูลได้')
    } finally {
      setBackingUpDownload(false)
    }
  }

  // Handle local JSON file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      setErrorMessage('กรุณาเลือกไฟล์สำรองข้อมูลที่มีนามสกุล .json เท่านั้น')
      return
    }

    setParsingJson(true)
    setErrorMessage('')
    setSelectedJsonFile(file)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        const rawData = parsed.data || parsed

        const counts = {
          parts: Array.isArray(rawData.parts) ? rawData.parts.length : parsed.counts?.parts || 0,
          vehicles: Array.isArray(rawData.vehicles)
            ? rawData.vehicles.length
            : parsed.counts?.vehicles || 0,
          categories: Array.isArray(rawData.partCategories || rawData.categories)
            ? (rawData.partCategories || rawData.categories).length
            : parsed.counts?.categories || 0,
          suppliers: Array.isArray(rawData.suppliers)
            ? rawData.suppliers.length
            : parsed.counts?.suppliers || 0,
          orders: Array.isArray(rawData.repairOrders)
            ? rawData.repairOrders.length
            : parsed.counts?.repairOrders || 0,
        }

        setJsonPreviewData({
          filename: file.name,
          sizeFormatted: `${(file.size / 1024).toFixed(1)} KB`,
          exportedAt: parsed.exportedAt || null,
          version: parsed.version || '1.0',
          counts,
          fullPayload: parsed,
        })
      } catch (err) {
        setErrorMessage('ไฟล์ JSON ไม่ถูกต้องหรือชำรุด โปรดเลือกไฟล์สำรองข้อมูลที่ถูกต้อง')
        setSelectedJsonFile(null)
        setJsonPreviewData(null)
      } finally {
        setParsingJson(false)
      }
    }
    reader.readAsText(file)
  }

  // Execute restore from uploaded JSON
  const handleRestoreFromJsonFile = async () => {
    if (!jsonPreviewData?.fullPayload) return
    try {
      setRestoring(true)
      setErrorMessage('')

      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonData: jsonPreviewData.fullPayload,
          createSafetyBackupFirst: true,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error || 'การกู้คืนข้อมูลล้มเหลว')
        return
      }

      setSuccessMessage(
        `กู้คืนฐานข้อมูลจากไฟล์ "${selectedJsonFile?.name}" สำเร็จเรียบร้อยแล้ว! (อะไหล่ ${data.restoredSummary?.partsCount || 0} รายการ, รถ ${data.restoredSummary?.vehiclesCount || 0} คัน)`
      )
      setIsJsonRestoreModalOpen(false)
      setSelectedJsonFile(null)
      setJsonPreviewData(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchBackups()
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการกู้คืนข้อมูล')
    } finally {
      setRestoring(false)
    }
  }

  // Execute restore from server file
  const handleRestoreServerBackup = async () => {
    if (!selectedBackupForRestore) return
    try {
      setRestoring(true)
      setErrorMessage('')

      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedBackupForRestore.filename,
          createSafetyBackupFirst: true,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error || 'การกู้คืนข้อมูลล้มเหลว')
        return
      }

      setSuccessMessage(
        `กู้คืนฐานข้อมูลจาก "${selectedBackupForRestore.filename}" สำเร็จแล้ว (สร้างจุดสำรองก่อนกู้คืนไว้ที่ ${data.safetyBackupCreated || 'เซิร์ฟเวอร์'})`
      )
      setIsRestoreModalOpen(false)
      fetchBackups()
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการกู้คืน')
    } finally {
      setRestoring(false)
    }
  }

  // Execute delete from server file
  const handleDeleteServerBackup = async () => {
    if (!selectedBackupForDelete) return
    try {
      setDeleting(true)
      setErrorMessage('')
      setSuccessMessage('')

      const res = await fetch(
        `/api/backup?filename=${encodeURIComponent(selectedBackupForDelete.filename)}`,
        { method: 'DELETE' }
      )
      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'ไม่สามารถลบไฟล์สำรองข้อมูลได้')
        return
      }

      setSuccessMessage(data.message || `ลบไฟล์ "${selectedBackupForDelete.filename}" สำเร็จ`)
      setIsDeleteModalOpen(false)
      setSelectedBackupForDelete(null)
      fetchBackups()
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการลบไฟล์')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          สำรองและกู้คืนฐานข้อมูล (Database Backup & Restore)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          ระบบความปลอดภัยของข้อมูล รองรับการสำรองบนคลาวด์ ดาวน์โหลดลงเครื่อง และนำเข้าไฟล์ JSON เพื่อกู้คืน
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Backup Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Cloud/Server Backup */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
              <Cloud className="h-5 w-5 text-blue-600" />
              1. สำรองข้อมูลไว้บน Cloud / เซิร์ฟเวอร์
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              สร้างไฟล์ Snapshot ของฐานข้อมูลทั้งหมด บันทึกไว้ในโฟลเดอร์ <code>/backups</code> ของระบบทันที สามารถใช้กู้คืนย้อนหลังได้ตลอดเวลา
            </p>
          </div>
          <button
            onClick={handleBackupToCloud}
            disabled={backingUpCloud}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-sm active:scale-95"
          >
            <Cloud className="h-4 w-4" />
            {backingUpCloud ? 'กำลังสำรองข้อมูลขึ้นระบบ...' : 'สำรองไว้บน Cloud/เซิร์ฟเวอร์'}
          </button>
        </div>

        {/* Card 2: Download Snapshot to Computer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
              <Laptop className="h-5 w-5 text-emerald-600" />
              2. ดาวน์โหลด Snapshot ลงคอมพิวเตอร์ (.json)
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              สร้างไฟล์สำรองข้อมูล JSON ฉบับสมบูรณ์ และสั่งดาวน์โหลดบันทึกลงในเครื่องคอมพิวเตอร์ของคุณทันที (เก็บไว้ใน Downloads หรือ Flash Drive)
            </p>
          </div>
          <button
            onClick={handleBackupAndDownload}
            disabled={backingUpDownload}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-sm active:scale-95"
          >
            <Download className="h-4 w-4" />
            {backingUpDownload ? 'กำลังเตรียมไฟล์ดาวน์โหลด...' : 'ดาวน์โหลด Snapshot ลงคอมพิวเตอร์ (.json)'}
          </button>
        </div>
      </div>

      {/* JSON Import & Restore Section */}
      <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-indigo-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
          <div className="flex items-center gap-2 text-indigo-950 font-bold text-base">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileUp className="h-5 w-5" />
            </div>
            <div>
              <h3>นำเข้าไฟล์สำรองข้อมูล (.json) จากคอมพิวเตอร์เพื่อกู้คืน</h3>
              <p className="text-xs font-normal text-slate-500">
                เลือกไฟล์ Snapshot (.json) ที่เคยดาวน์โหลดไว้ เพื่อนำข้อมูลกลับเข้าสู่ระบบ
              </p>
            </div>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <FileJson className="h-4 w-4" />
              เลือกไฟล์สำรองข้อมูล (.json)
            </button>
          </div>
        </div>

        {/* Selected JSON Preview */}
        {parsingJson && (
          <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
            <RefreshCw className="h-4 w-4 animate-spin inline-block mr-2" />
            กำลังตรวจสอบโครงสร้างไฟล์ JSON...
          </div>
        )}

        {jsonPreviewData && (
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200/70 pb-2.5">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-indigo-600" />
                <div>
                  <span className="font-mono font-bold text-xs text-indigo-950">
                    {jsonPreviewData.filename}
                  </span>
                  <span className="text-[11px] text-indigo-600 ml-2">
                    ({jsonPreviewData.sizeFormatted})
                  </span>
                </div>
              </div>
              {jsonPreviewData.exportedAt && (
                <div className="text-[11px] text-slate-500">
                  วันที่สำรอง:{' '}
                  <strong className="text-slate-700">
                    {formatDate(jsonPreviewData.exportedAt)}
                  </strong>
                </div>
              )}
            </div>

            {/* Counts grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                <div className="text-[10px] text-slate-400 font-medium">อะไหล่</div>
                <div className="text-sm font-bold text-indigo-900">
                  {jsonPreviewData.counts.parts.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                <div className="text-[10px] text-slate-400 font-medium">รถบริษัท</div>
                <div className="text-sm font-bold text-indigo-900">
                  {jsonPreviewData.counts.vehicles.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                <div className="text-[10px] text-slate-400 font-medium">ผู้จำหน่าย</div>
                <div className="text-sm font-bold text-indigo-900">
                  {jsonPreviewData.counts.suppliers.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                <div className="text-[10px] text-slate-400 font-medium">หมวดหมู่อะไหล่</div>
                <div className="text-sm font-bold text-indigo-900">
                  {jsonPreviewData.counts.categories.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                <div className="text-[10px] text-slate-400 font-medium">ใบงานซ่อม</div>
                <div className="text-sm font-bold text-indigo-900">
                  {jsonPreviewData.counts.orders.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedJsonFile(null)
                  setJsonPreviewData(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                ยกเลิกไฟล์นี้
              </button>

              <button
                type="button"
                onClick={() => setIsJsonRestoreModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
              >
                <Upload className="h-4 w-4" />
                เริ่มกู้คืนฐานข้อมูลจากไฟล์นี้...
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Safety Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card: Last Backup */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-400 font-medium">การสำรองข้อมูลล่าสุด</div>
            {lastBackup ? (
              <div className="mt-1">
                <div className="font-mono text-xs font-bold text-slate-800 truncate">
                  {lastBackup.filename}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {formatDateTime(lastBackup.createdAt)} ({lastBackup.sizeFormatted})
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 mt-1">ยังไม่มีประวัติการสำรองข้อมูล</div>
            )}
          </div>
        </div>

        {/* Card: Database Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <HardDrive className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-400 font-medium">ระบบฐานข้อมูลที่ใช้งาน</div>
            <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
              <span>{dbPath}</span>
              {isCloud && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-semibold">
                  Cloud Active
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              รองรับการสำรองและกู้คืนข้ามเครื่องอย่างสมบูรณ์
            </div>
          </div>
        </div>
      </div>

      {/* Backup Files Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                รายการไฟล์สำรองข้อมูลบนระบบ ({backups.length} ไฟล์)
              </h3>
              <p className="text-[11px] text-slate-400">
                {fileFilter === 'maintenance'
                  ? 'แสดงเฉพาะไฟล์สำรอง (JSON) ของระบบแผนงานซ่อมบำรุง'
                  : 'แสดงไฟล์สำรองข้อมูลทั้งหมดในโฟลเดอร์ /backups'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => {
                  setFileFilter('maintenance')
                  fetchBackups('maintenance')
                }}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  fileFilter === 'maintenance'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เฉพาะไฟล์ซ่อมบำรุง
              </button>
              <button
                type="button"
                onClick={() => {
                  setFileFilter('all')
                  fetchBackups('all')
                }}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  fileFilter === 'all'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ไฟล์ทั้งหมด
              </button>
            </div>

            <button
              onClick={() => fetchBackups()}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="รีเฟรช"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">รูปแบบ</th>
                <th className="px-6 py-3.5">ชื่อไฟล์สำรอง</th>
                <th className="px-6 py-3.5">ระบบงาน</th>
                <th className="px-6 py-3.5">ขนาดไฟล์</th>
                <th className="px-6 py-3.5">วันที่และเวลาที่สำรอง</th>
                <th className="px-6 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    กำลังโหลดข้อมูลไฟล์สำรอง...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    ยังไม่มีไฟล์สำรองข้อมูลในโฟลเดอร์ /backups
                  </td>
                </tr>
              ) : (
                backups.map((bk) => (
                  <tr key={bk.filename} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      {bk.isJson ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-md text-[10px]">
                          JSON Snapshot
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md text-[10px]">
                          SQLITE DB
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-800 break-all">
                      {bk.filename}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {bk.scopeLabel || 'แผนงานซ่อมบำรุง'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{bk.sizeFormatted}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDateTime(bk.createdAt)}</td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {/* Download to PC */}
                      <a
                        href={`/api/backup/download?filename=${encodeURIComponent(bk.filename)}`}
                        download={bk.filename}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        title="ดาวน์โหลดไฟล์นี้ลงคอมพิวเตอร์"
                      >
                        <Download className="h-3.5 w-3.5" />
                        โหลดลงเครื่อง
                      </a>

                      {/* Restore */}
                      <button
                        onClick={() => {
                          setSelectedBackupForRestore(bk)
                          setErrorMessage('')
                          setIsRestoreModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition"
                        title="กู้คืนฐานข้อมูลจากไฟล์นี้"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        กู้คืนไฟล์นี้
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          setSelectedBackupForDelete(bk)
                          setIsDeleteModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
                        title="ลบไฟล์สำรองนี้ออกจากระบบ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Server File Deletion */}
      {isDeleteModalOpen && selectedBackupForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b pb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการลบไฟล์สำรองข้อมูล</h3>
                <p className="text-xs text-slate-400">Delete Server Backup File</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                ไฟล์ที่จะถูกลบ:{' '}
                <strong className="font-mono text-slate-800">
                  {selectedBackupForDelete.filename}
                </strong>
              </div>
              <div>
                ขนาดไฟล์: <strong>{selectedBackupForDelete.sizeFormatted}</strong>
              </div>
              <div className="text-rose-700 pt-1 font-medium leading-relaxed">
                ⚠️ เมื่อลบแล้วไฟล์นี้จะถูกนำออกจากพื้นที่จัดเก็บของเซิร์ฟเวอร์อย่างถาวรและไม่สามารถกู้คืนได้
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteServerBackup}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    กำลังลบไฟล์...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    ยืนยันลบไฟล์
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Server File Restore */}
      {isRestoreModalOpen && selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 text-amber-600 border-b pb-3">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการกู้คืนฐานข้อมูล</h3>
                <p className="text-xs text-slate-400">Restore from Server Backup</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                ไฟล์ที่จะนำมากู้คืน:{' '}
                <strong className="font-mono text-slate-800">
                  {selectedBackupForRestore.filename}
                </strong>
              </div>
              <div>
                วันที่ของไฟล์สำรอง: <strong>{formatDate(selectedBackupForRestore.createdAt)}</strong>
              </div>
              <div className="text-amber-800 pt-1 font-medium leading-relaxed">
                ⚠️ คำเตือน: ระบบจะเขียนทับฐานข้อมูลปัจจุบันด้วยข้อมูลจากไฟล์นี้ (ระบบจะทำ Safety Snapshot สำรองข้อมูลปัจจุบันให้อัตโนมัติก่อนเริ่มกู้คืน)
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsRestoreModalOpen(false)}
                disabled={restoring}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={restoring}
                onClick={handleRestoreServerBackup}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center gap-2"
              >
                {restoring ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    กำลังกู้คืนข้อมูล...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    ยืนยันกู้คืนข้อมูล
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Uploaded JSON File Restore */}
      {isJsonRestoreModalOpen && jsonPreviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 text-indigo-600 border-b pb-3">
              <div className="p-2.5 bg-indigo-100 rounded-xl">
                <FileJson className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  ยืนยันการกู้คืนฐานข้อมูลจากไฟล์ JSON
                </h3>
                <p className="text-xs text-slate-400">Restore from Uploaded JSON File</p>
              </div>
              <button
                onClick={() => !restoring && setIsJsonRestoreModalOpen(false)}
                className="ml-auto text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div>
                  ชื่อไฟล์:{' '}
                  <strong className="font-mono text-slate-800">{jsonPreviewData.filename}</strong> (
                  {jsonPreviewData.sizeFormatted})
                </div>
                {jsonPreviewData.exportedAt && (
                  <div>
                    วันที่สร้างไฟล์สำรอง:{' '}
                    <strong>{formatDate(jsonPreviewData.exportedAt)}</strong>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-relaxed">
                <strong>⚠️ คำเตือนสำคัญ:</strong> ข้อมูลทั้งหมดในฐานข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูลจากไฟล์ JSON นี้ (ระบบจะทำ Safety Snapshot สำรองข้อมูลปัจจุบันให้อัตโนมัติ 1 ชุด)
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-white">
                <div className="font-bold text-slate-700 mb-2">สรุปรายการที่จะถูกนำเข้าสู่ระบบ:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>• อะไหล่: <strong>{jsonPreviewData.counts.parts} รายการ</strong></div>
                  <div>• รถบริษัท: <strong>{jsonPreviewData.counts.vehicles} คัน</strong></div>
                  <div>• ผู้จำหน่าย: <strong>{jsonPreviewData.counts.suppliers} ราย</strong></div>
                  <div>• หมวดหมู่: <strong>{jsonPreviewData.counts.categories} หมวดหมู่</strong></div>
                  <div>• ใบงานซ่อม: <strong>{jsonPreviewData.counts.orders} ใบงาน</strong></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsJsonRestoreModalOpen(false)}
                disabled={restoring}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={restoring}
                onClick={handleRestoreFromJsonFile}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-2 shadow-md"
              >
                {restoring ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    กำลังกู้คืนข้อมูลเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    ยืนยันกู้คืนฐานข้อมูลเดี๋ยวนี้
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
