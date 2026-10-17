'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  FileUp,
  Check,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function ProcurementBackupPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [lastBackup, setLastBackup] = useState<any>(null);
  const [dbPath, setDbPath] = useState<string>('');
  const [isCloud, setIsCloud] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [backingUpCloud, setBackingUpCloud] = useState(false);
  const [backingUpDownload, setBackingUpDownload] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Scope Filter & Deletion
  const [fileFilter, setFileFilter] = useState<'procurement' | 'all'>('procurement');
  const [selectedBackupForDelete, setSelectedBackupForDelete] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Confirmation Modal for server file restore
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<any>(null);

  // JSON Import & Restore from Computer state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedJsonFile, setSelectedJsonFile] = useState<File | null>(null);
  const [jsonPreviewData, setJsonPreviewData] = useState<any>(null);
  const [parsingJson, setParsingJson] = useState(false);
  const [isJsonRestoreModalOpen, setIsJsonRestoreModalOpen] = useState(false);

  const fetchBackups = async (filter = fileFilter) => {
    try {
      setLoading(true);
      const url = filter === 'all' ? '/api/backup' : '/api/backup?scope=procurement';
      const res = await fetch(url);
      const data = await res.json();
      setBackups(data.backups || []);
      setLastBackup(data.lastBackup || null);
      setDbPath(data.databasePath || '');
      setIsCloud(!!data.isCloud);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  // Option 1: Backup on Cloud / Server
  const handleBackupToCloud = async () => {
    try {
      setBackingUpCloud(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Procurement Cloud Snapshot', scope: 'procurement' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการสำรองข้อมูล');
        return;
      }

      setSuccessMessage(
        `บันทึกไฟล์สำรองข้อมูลฝ่ายจัดซื้อ "${data.filename}" (${data.sizeFormatted}) ไว้บนระบบสำเร็จเรียบร้อยแล้ว`
      );
      fetchBackups();
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถสำรองข้อมูลได้');
    } finally {
      setBackingUpCloud(false);
    }
  };

  // Option 2: Download Snapshot to Computer (.json)
  const handleBackupAndDownload = async () => {
    try {
      setBackingUpDownload(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Procurement Direct Download Snapshot', scope: 'procurement' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการสร้างไฟล์สำรองข้อมูล');
        return;
      }

      // Trigger browser download
      if (data.snapshot) {
        const blob = new Blob([JSON.stringify(data.snapshot, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || `procurement_backup_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      setSuccessMessage(
        `สร้างไฟล์สำรองและดาวน์โหลด "${data.filename}" (${data.sizeFormatted}) ลงเครื่องคอมพิวเตอร์สำเร็จเรียบร้อยแล้ว`
      );
      fetchBackups();
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถดาวน์โหลดไฟล์สำรองข้อมูลได้');
    } finally {
      setBackingUpDownload(false);
    }
  };

  // Handle local JSON file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setErrorMessage('กรุณาเลือกไฟล์สำรองข้อมูลที่มีนามสกุล .json เท่านั้น');
      return;
    }

    setParsingJson(true);
    setErrorMessage('');
    setSelectedJsonFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const rawData = parsed.data || parsed;

        const counts = {
          suppliers: Array.isArray(rawData.suppliers)
            ? rawData.suppliers.length
            : parsed.counts?.suppliers || 0,
          settings: Array.isArray(rawData.appSettings)
            ? rawData.appSettings.length
            : parsed.counts?.settings || 0,
        };

        setJsonPreviewData({
          filename: file.name,
          sizeFormatted: `${(file.size / 1024).toFixed(1)} KB`,
          exportedAt: parsed.exportedAt || null,
          version: parsed.version || '1.0',
          counts,
          fullPayload: parsed,
        });
      } catch (err) {
        setErrorMessage('ไฟล์ JSON ไม่ถูกต้องหรือชำรุด โปรดเลือกไฟล์สำรองข้อมูลที่ถูกต้อง');
        setSelectedJsonFile(null);
        setJsonPreviewData(null);
      } finally {
        setParsingJson(false);
      }
    };
    reader.readAsText(file);
  };

  // Execute restore from uploaded JSON
  const handleRestoreFromJsonFile = async () => {
    if (!jsonPreviewData?.fullPayload) return;

    try {
      setRestoring(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonData: jsonPreviewData.fullPayload,
          createSafetyBackupFirst: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการกู้คืนข้อมูล');
        return;
      }

      setSuccessMessage(
        `กู้คืนข้อมูลสำเร็จเรียบร้อย! คืนค่าผู้จำหน่าย/คู่ค้า ${data.restoredCounts?.suppliersCount || 0} รายการ (ระบบได้สร้างจุดสำรองข้อมูลความปลอดภัยก่อนกู้คืนไว้แล้ว)`
      );
      setIsJsonRestoreModalOpen(false);
      setSelectedJsonFile(null);
      setJsonPreviewData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchBackups();
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถกู้คืนข้อมูลได้');
    } finally {
      setRestoring(false);
    }
  };

  // Execute restore from server backup file
  const handleRestoreFromServerFile = async () => {
    if (!selectedBackupForRestore) return;

    try {
      setRestoring(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedBackupForRestore.filename,
          createSafetyBackupFirst: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'เกิดข้อผิดพลาดในการกู้คืนข้อมูล');
        return;
      }

      setSuccessMessage(
        `กู้คืนข้อมูลจากไฟล์ "${selectedBackupForRestore.filename}" สำเร็จเรียบร้อยแล้ว`
      );
      setIsRestoreModalOpen(false);
      setSelectedBackupForRestore(null);
      fetchBackups();
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถกู้คืนข้อมูลได้');
    } finally {
      setRestoring(false);
    }
  };

  // Execute delete from server file
  const handleDeleteServerBackup = async () => {
    if (!selectedBackupForDelete) return;
    try {
      setDeleting(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await fetch(
        `/api/backup?filename=${encodeURIComponent(selectedBackupForDelete.filename)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'ไม่สามารถลบไฟล์สำรองข้อมูลได้');
        return;
      }

      setSuccessMessage(data.message || `ลบไฟล์ "${selectedBackupForDelete.filename}" สำเร็จ`);
      setIsDeleteModalOpen(false);
      setSelectedBackupForDelete(null);
      fetchBackups();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการลบไฟล์');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-800">
              สำรองและกู้คืนข้อมูล (Database Backup & Restore)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              ฝ่ายจัดซื้อ
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            จัดการไฟล์สำรองข้อมูลงานจัดซื้อ ทะเบียนคู่ค้า ระบบ Cloud และกู้คืนข้อมูลย้อนหลัง
          </p>
        </div>

        <button
          onClick={() => fetchBackups()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <RefreshCw className={`h-4 w-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรชรายการ
        </button>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 shadow-sm animate-in fade-in">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {/* 2 Primary Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Cloud/Server Backup */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Cloud className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  สำรองข้อมูลและบันทึกไว้บนระบบ
                </h2>
                <p className="text-xs text-slate-500">Cloud / Server Snapshot</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              สร้างจุดสำรองข้อมูลงานจัดซื้อและทะเบียนคู่ค้า ณ ปัจจุบัน เก็บไว้บนพื้นที่จัดเก็บไฟล์สำรองของระบบโดยตรง ปลอดภัยและเรียกกู้คืนได้ทันที
            </p>
          </div>

          <div className="pt-5 border-t border-slate-100 mt-5 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {lastBackup ? `สำรองล่าสุด: ${formatDate(lastBackup.createdAt)}` : 'ยังไม่มีประวัติ'}
            </span>
            <button
              type="button"
              onClick={handleBackupToCloud}
              disabled={backingUpCloud}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <Database className="h-4 w-4" />
              {backingUpCloud ? 'กำลังสร้างไฟล์...' : 'สร้างไฟล์สำรองบนระบบ'}
            </button>
          </div>
        </div>

        {/* Card 2: Download Snapshot to Computer */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  ดาวน์โหลดไฟล์สำรองข้อมูลลงเครื่องคอมพิวเตอร์
                </h2>
                <p className="text-xs text-slate-500">Download Offline Snapshot (.json)</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export ข้อมูลฝ่ายจัดซื้อออกมาเป็นไฟล์ <code>.json</code> เพื่อจัดเก็บไว้ใน Flash Drive หรือคอมพิวเตอร์ส่วนตัว สามารถนำมากู้คืนได้ทุกเมื่อ
            </p>
          </div>

          <div className="pt-5 border-t border-slate-100 mt-5 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">รูปแบบ JSON สมบูรณ์ 100%</span>
            <button
              type="button"
              onClick={handleBackupAndDownload}
              disabled={backingUpDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {backingUpDownload ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลดไฟล์ (.json)'}
            </button>
          </div>
        </div>
      </div>

      {/* Section: Upload & Restore from Computer (.json) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-600" />
            กู้คืนข้อมูลจากไฟล์ในเครื่องคอมพิวเตอร์ (.json)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            เลือกไฟล์สำรองข้อมูลนามสกุล <code>.json</code> จากคอมพิวเตอร์เพื่อนำเข้าและกู้คืนสู่ฐานข้อมูล
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
            id="procurement-json-file-input"
          />
          <label
            htmlFor="procurement-json-file-input"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-emerald-700 text-xs font-semibold cursor-pointer transition"
          >
            <FileUp className="h-4 w-4" />
            {selectedJsonFile ? 'เปลี่ยนไฟล์ที่เลือก' : 'คลิกเพื่อเลือกไฟล์สำรอง (.json)'}
          </label>

          {selectedJsonFile && jsonPreviewData && (
            <div className="flex-1 w-full bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-emerald-900 flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-emerald-600" />
                  <span>{jsonPreviewData.filename}</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({jsonPreviewData.sizeFormatted})
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700">
                  พบข้อมูล: ผู้จำหน่าย/คู่ค้า {jsonPreviewData.counts.suppliers} ราย
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsJsonRestoreModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition active:scale-95"
              >
                <Check className="h-3.5 w-3.5" />
                เริ่มกู้คืนข้อมูล
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section: Server Backup Files Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-emerald-600" />
              ประวัติและไฟล์สำรองข้อมูลบนระบบ (Server Backup Files)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {fileFilter === 'procurement'
                ? `แสดงเฉพาะไฟล์สำรอง (JSON) ของฝ่ายจัดซื้อ (${backups.length} ไฟล์)`
                : `ไฟล์สำรองข้อมูลทั้งหมดในระบบ (${backups.length} ไฟล์)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => {
                  setFileFilter('procurement');
                  fetchBackups('procurement');
                }}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  fileFilter === 'procurement'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เฉพาะไฟล์จัดซื้อ
              </button>
              <button
                type="button"
                onClick={() => {
                  setFileFilter('all');
                  fetchBackups('all');
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

        {backups.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            ยังไม่มีไฟล์สำรองข้อมูลในระบบ
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">ชื่อไฟล์</th>
                  <th className="px-4 py-3 font-semibold">ประเภท</th>
                  <th className="px-4 py-3 font-semibold">ระบบงาน</th>
                  <th className="px-4 py-3 font-semibold">ขนาดไฟล์</th>
                  <th className="px-4 py-3 font-semibold">วันที่สำรอง</th>
                  <th className="px-5 py-3 font-semibold text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {backups.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-mono font-medium text-slate-800 flex items-center gap-2">
                      <FileJson className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-xs">{b.filename}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {b.isJson ? 'JSON Snapshot' : 'Database DB'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {b.scopeLabel || 'แผนงานฝ่ายจัดซื้อ'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{b.sizeFormatted}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(b.createdAt)}</td>
                    <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                      <a
                        href={`/api/backup/download?filename=${encodeURIComponent(b.filename)}`}
                        download
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        ดาวน์โหลด
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBackupForRestore(b);
                          setIsRestoreModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 rounded-lg transition"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        กู้คืนไฟล์นี้
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBackupForDelete(b);
                          setIsDeleteModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="ลบไฟล์สำรองนี้ออกจากระบบ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Restore from Uploaded JSON */}
      {isJsonRestoreModalOpen && jsonPreviewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 text-amber-600 border-b border-amber-100 pb-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">ยืนยันการกู้คืนข้อมูล</h3>
                <p className="text-xs text-slate-500">จากไฟล์: {jsonPreviewData.filename}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="font-semibold text-slate-800">รายการข้อมูลที่จะถูกกู้คืน:</div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                <li>ข้อมูลผู้จำหน่าย/คู่ค้า: {jsonPreviewData.counts.suppliers} รายการ</li>
              </ul>
              <div className="pt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                ระบบจะสร้างจุดสำรองข้อมูลความปลอดภัยก่อนกู้คืนให้อัตโนมัติ
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={restoring}
                onClick={() => setIsJsonRestoreModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={restoring}
                onClick={handleRestoreFromJsonFile}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {restoring ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {restoring ? 'กำลังกู้คืนข้อมูล...' : 'ยืนยันกู้คืนข้อมูลทันที'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Restore from Server File */}
      {isRestoreModalOpen && selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b border-rose-100 pb-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">ยืนยันการกู้คืนข้อมูลย้อนหลัง</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{selectedBackupForRestore.filename}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              การกู้คืนข้อมูลจากไฟล์นี้จะทำการเขียนทับข้อมูลในระบบด้วยข้อมูล ณ วันที่สำรอง (
              {formatDateTime(selectedBackupForRestore.createdAt)}) เพื่อความปลอดภัย ระบบจะสำรองข้อมูลปัจจุบันไว้ก่อนเริ่มกู้คืน
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={restoring}
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setSelectedBackupForRestore(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={restoring}
                onClick={handleRestoreFromServerFile}
                className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {restoring ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {restoring ? 'กำลังกู้คืนข้อมูล...' : 'ยืนยันกู้คืนข้อมูล'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Server Backup File */}
      {isDeleteModalOpen && selectedBackupForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b border-rose-100 pb-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">ยืนยันการลบไฟล์สำรองข้อมูล</h3>
                <p className="text-xs text-slate-500">Delete Server Backup File</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
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

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedBackupForDelete(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteServerBackup}
                className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {deleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? 'กำลังลบไฟล์...' : 'ยืนยันลบไฟล์'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

