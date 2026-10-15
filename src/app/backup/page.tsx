'use client'

import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function BackupPage() {
  const [backups, setBackups] = useState<any[]>([])
  const [lastBackup, setLastBackup] = useState<any>(null)
  const [dbPath, setDbPath] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [backingUp, setBackingUp] = useState(false)
  const [restoring, setRestoring] = useState(false)

  // Messages
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Confirmation Modal
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false)
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<any>(null)

  const fetchBackups = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/backup')
      const data = await res.json()
      setBackups(data.backups || [])
      setLastBackup(data.lastBackup || null)
      setDbPath(data.databasePath || '')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  const handleCreateBackup = async () => {
    try {
      setBackingUp(true)
      setErrorMessage('')
      setSuccessMessage('')

      const res = await fetch('/api/backup', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการสำรองข้อมูล')
        return
      }

      setSuccessMessage(`สร้างไฟล์สำรองข้อมูล "${data.filename}" (${data.sizeFormatted}) สำเร็จ`)
      fetchBackups()
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถสำรองข้อมูลได้')
    } finally {
      setBackingUp(false)
    }
  }

  const handleRestoreBackup = async () => {
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
        `กู้คืนฐานข้อมูลจาก "${selectedBackupForRestore.filename}" สำเร็จแล้ว (สร้างจุดสำรองก่อนกู้คืนไว้ที่ ${data.safetyBackupCreated})`
      )
      setIsRestoreModalOpen(false)
      fetchBackups()
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการกู้คืน')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          สำรองและกู้คืนฐานข้อมูล (Database Backup & Restore)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          ระบบความปลอดภัยของข้อมูลสำหรับเครื่องเดี่ยว จัดเก็บในเครื่องและป้องกันข้อมูลสูญหาย
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Quick Action & Storage Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Create Backup */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
              <Database className="h-5 w-5 text-blue-600" />
              สำรองข้อมูลเดี๋ยวนี้
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              สร้างไฟล์ snapshot ของฐานข้อมูล SQLite ทั้งหมด บันทึกไว้ในโฟลเดอร์ <code>/backups</code>
            </p>
          </div>
          <button
            onClick={handleCreateBackup}
            disabled={backingUp}
            className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-sm"
          >
            <Download className="h-4 w-4" />
            {backingUp ? 'กำลังสร้างไฟล์สำรอง...' : 'กดเพื่อสำรองข้อมูลทันที'}
          </button>
        </div>

        {/* Card 2: Last Backup Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <Clock className="h-5 w-5 text-emerald-600" />
            การสำรองข้อมูลล่าสุด
          </div>
          <div className="mt-3">
            {lastBackup ? (
              <div className="space-y-1.5">
                <div className="font-mono text-xs font-bold text-slate-700 truncate">
                  {lastBackup.filename}
                </div>
                <div className="text-xs text-slate-500">
                  วันเวลา: {formatDate(lastBackup.createdAt)}
                </div>
                <div className="text-xs text-slate-400">
                  ขนาดไฟล์: {lastBackup.sizeFormatted}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 mt-2">ยังไม่มีประวัติการสร้างไฟล์สำรอง</div>
            )}
          </div>
        </div>

        {/* Card 3: Database Location */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <HardDrive className="h-5 w-5 text-indigo-600" />
            ที่ตั้งไฟล์ฐานข้อมูลหลัก
          </div>
          <p className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-3 break-all">
            {dbPath || 'data/storage.db'}
          </p>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            ฐานข้อมูลจัดเก็บบนดิสก์จริง ข้อมูลไม่หายเมื่อรีสตาร์ต
          </div>
        </div>
      </div>

      {/* Safety Warning Guidelines */}
      <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl text-amber-900 text-xs space-y-2">
        <h3 className="font-bold text-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          คำแนะนำความปลอดภัยในการกู้คืนข้อมูล (Restore Guidelines)
        </h3>
        <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed">
          <li>
            <strong>การกู้คืนจะเขียนทับฐานข้อมูลปัจจุบัน:</strong> ข้อมูลที่บันทึกหลังจากวันที่ของไฟล์สำรองจะถูกแทนที่
          </li>
          <li>
            <strong>ระบบสร้าง Safety Backup อัตโนมัติ:</strong> ก่อนการกู้คืนทุกครั้ง ระบบจะทำสำเนาของฐานข้อมูลปัจจุบันเก็บไว้ให้อีก 1 ชุดเสมอ
          </li>
          <li>
            <strong>ตรวจสอบความสมบูรณ์ของไฟล์:</strong> ระบบมีขั้นตอนตรวจสอบ SQLite Header 16 ไบต์แรกก่อนเริ่มการแทนที่ไฟล์จริง
          </li>
        </ul>
      </div>

      {/* Backup Files Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-slate-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              รายการไฟล์สำรองข้อมูล ({backups.length} ไฟล์)
            </h3>
          </div>
          <button
            onClick={fetchBackups}
            className="p-1.5 text-slate-400 hover:text-slate-600"
            title="รีเฟรช"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">ชื่อไฟล์สำรอง (.db)</th>
                <th className="px-6 py-3.5">ขนาดไฟล์</th>
                <th className="px-6 py-3.5">วันที่และเวลาที่สำรอง</th>
                <th className="px-6 py-3.5 text-right">การกู้คืนข้อมูล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    กำลังโหลดข้อมูลไฟล์สำรอง...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400">
                    ยังไม่มีไฟล์สำรองข้อมูลในโฟลเดอร์ /backups
                  </td>
                </tr>
              ) : (
                backups.map((bk) => (
                  <tr key={bk.filename} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono font-medium text-slate-800">
                      {bk.filename}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{bk.sizeFormatted}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(bk.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedBackupForRestore(bk)
                          setErrorMessage('')
                          setIsRestoreModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        กู้คืนไฟล์นี้
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Restore */}
      {isRestoreModalOpen && selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยืนยันการกู้คืนฐานข้อมูล</h3>
                <p className="text-xs text-slate-400">Database Restoration Confirmation</p>
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
              <div className="text-amber-800 pt-1 font-medium">
                ⚠️ คำเตือน: ระบบจะเขียนทับข้อมูลในเครื่องด้วยข้อมูลจากไฟล์นี้
                (โดยระบบจะทำ snapshot สำรองข้อมูลก่อนหน้าไว้ให้อัตโนมัติ 1 ชุด)
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsRestoreModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={restoring}
                onClick={handleRestoreBackup}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                {restoring ? 'กำลังกู้คืนข้อมูล...' : 'ยืนยันเขียนทับและกู้คืน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

