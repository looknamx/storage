'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Building,
  CheckCircle2,
  Database,
  Shield,
  X,
  Trash2,
  AlertTriangle,
  Clock,
  Download,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function MarketingSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    company_name: 'บริษัท เฮียเชาว์ จำกัด (iHereCHOW Co.,Ltd)',
    contact_phone: '02-123-4567',
    currency_symbol: '฿',
    auto_backup_enabled: 'false',
    auto_backup_interval_days: '7',
    last_auto_backup_date: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset System & Mandatory Backup State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [confirmResetText, setConfirmResetText] = useState('');
  const [resetting, setResetting] = useState(false);
  const [exportingSnapshot, setExportingSnapshot] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();

      if (Array.isArray(data)) {
        const mapped: Record<string, string> = {};
        data.forEach((s) => {
          mapped[s.key] = s.value;
        });
        setSettings((prev) => ({ ...prev, ...mapped }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        group: key.startsWith('auto_backup') ? 'backup' : 'general',
      }));

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการบันทึก');

      // If auto backup enabled right now, trigger check
      if (settings.auto_backup_enabled === 'true') {
        fetch('/api/backup/auto');
      }

      setSuccessMessage('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถบันทึกได้');
    } finally {
      setSaving(false);
    }
  };

  const handleExportSnapshot = async () => {
    try {
      setExportingSnapshot(true);
      setErrorMessage('');
      const res = await fetch('/api/system/export-snapshot?scope=program_b');
      if (!res.ok) throw new Error('ไม่สามารถดาวน์โหลดไฟล์สำรองข้อมูลได้');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marketing_snapshot_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSuccessMessage('ดาวน์โหลดไฟล์สำรองข้อมูล (โปรแกรม B Snapshot) สำเร็จเรียบร้อยแล้ว');
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการดาวน์โหลดสำรองข้อมูล');
    } finally {
      setExportingSnapshot(false);
    }
  };

  const handleExecuteReset = async () => {
    if (confirmResetText !== 'RESET') return;
    try {
      setResetting(true);
      setErrorMessage('');

      const res = await fetch('/api/system/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: 'RESET', scope: 'program_b' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'การล้างข้อมูลระบบล้มเหลว');
      }

      // MANDATORY SAFETY BACKUP: Automatic forced browser download
      if (data.snapshot) {
        const blob = new Blob([JSON.stringify(data.snapshot, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.backupFilename || `marketing_backup_before_reset_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      setIsResetModalOpen(false);
      setConfirmResetText('');
      setSuccessMessage(
        `ล้างข้อมูลระบบสำเร็จเรียบร้อย! ระบบได้สำรองข้อมูลอัตโนมัติและดาวน์โหลดไฟล์ "${data.backupFilename}" ลงเครื่องคอมพิวเตอร์ของท่านแล้ว (ล้างข้อมูลงานขนส่ง ${data.deletedSummary?.transportJobs || 0} เที่ยว) พร้อมสำหรับเริ่มบันทึกข้อมูลใหม่`
      );
      fetchSettings();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการล้างข้อมูล');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ตั้งค่าระบบ (System Settings)</h1>
          <p className="text-xs text-gray-500">
            ระบบแผนงานการตลาด: กำหนดข้อมูลหน่วยงาน การสำรองข้อมูลอัตโนมัติ และการส่งมอบโปรเจกต์
          </p>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-purple-500 disabled:bg-slate-100 disabled:text-slate-400"
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
            <Building className="h-4 w-4 text-purple-600" />
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
              <input
                type="text"
                value={settings.contact_phone || ''}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-sm active:scale-95"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าระบบ'}
            </button>
          </div>
        </div>
      </form>

      {/* Danger Zone: Handover & Reset Database */}
      <div className="bg-red-50/70 border-2 border-red-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-200 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-red-950 flex items-center gap-2">
                โซนอันตราย: ส่งมอบโปรเจกต์ & ล้างข้อมูลระบบแผนงานการตลาด (โปรแกรม B)
              </h2>
              <p className="text-xs text-red-700 mt-0.5">
                สำหรับผู้ดูแลระบบ: ใช้เมื่อต้องการล้างข้อมูลเที่ยววิ่งและลูกค้าเพื่อเริ่มบันทึกใหม่ (ข้อมูลรถและสต็อกอะไหล่ของฝ่ายซ่อมบำรุง โปรแกรม A จะไม่ได้รับผลกระทบ)
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
              <Download className="h-4 w-4 text-purple-600" />
              {exportingSnapshot ? 'กำลังส่งออก...' : 'ดาวน์โหลด Snapshot สำรองข้อมูล'}
            </button>

            <button
              type="button"
              onClick={() => {
                setConfirmResetText('');
                setIsResetModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
              ลบข้อมูลเฉพาะโปรแกรม B เพื่อเริ่มใช้งานใหม่
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
              เมื่อกดลบข้อมูล ระบบจะทำการ Export ฐานข้อมูลของโปรแกรม B ทุกตาราง และสั่งดาวน์โหลดไฟล์ <code>.json</code> ลงในเครื่องของท่านโดยอัตโนมัติทันทีก่อนการลบ เพื่อป้องกันข้อมูลสูญหาย 100%
            </p>
          </div>

          <div className="bg-white/80 p-3.5 rounded-xl border border-red-100 space-y-1.5">
            <div className="font-bold text-red-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              แยกข้อมูลอิสระ ไม่กระทบโปรแกรม A
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              การล้างข้อมูลนี้จะลบเฉพาะเที่ยววิ่งและลูกค้าของฝ่ายการตลาดเท่านั้น <strong>ข้อมูลรถและสต็อกอะไหล่ในโปรแกรมบริหารแผนซ่อมบำรุง (โปรแกรม A) จะคงอยู่ครบถ้วน 100%</strong>
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
          <div>• <strong>ความปลอดภัยของข้อมูล:</strong> มีระบบสำรองข้อมูลอัตโนมัติทั้งแบบ Local Snapshot และ Cloud Backup</div>
          <div>• <strong>การเชื่อมโยงข้ามระบบ:</strong> ข้อมูลรถและเลขไมล์จะซิงค์กับโปรแกรมบริหารงานซ่อมบำรุงโดยตรง</div>
        </div>
      </div>

      {/* Modal Confirm Reset */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 text-red-600 border-b border-red-100 pb-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">ยืนยันการล้างข้อมูลระบบแผนงานการตลาด (โปรแกรม B)</h3>
                <p className="text-xs text-red-600 font-medium">Project Handover - ส่งมอบระบบการตลาดและเริ่มคีย์ข้อมูลใหม่</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-red-50/60 p-3.5 rounded-xl border border-red-100 leading-relaxed">
              <p className="font-semibold text-red-800">โปรดทราบ:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                <li>ข้อมูลงานขนส่ง เที่ยววิ่ง และข้อมูลลูกค้าการตลาดทั้งหมดจะถูกลบ</li>
                <li className="font-semibold text-emerald-700">
                  ✓ ข้อมูลทะเบียนรถ สต็อกอะไหล่ และใบสั่งซ่อมในโปรแกรม A จะคงอยู่ครบถ้วน 100% ไม่ถูกลบ
                </li>
                <li>
                  ระบบจะ<strong>ทำการดาวน์โหลดไฟล์สำรองข้อมูล (Safety Snapshot JSON) ลงในเครื่องของท่านโดยอัตโนมัติ</strong>ก่อนเริ่มการลบ
                </li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                พิมพ์คำว่า <span className="text-red-600 select-all font-mono">RESET</span> เพื่อยืนยัน:
              </label>
              <input
                type="text"
                value={confirmResetText}
                onChange={(e) => setConfirmResetText(e.target.value.trim())}
                placeholder="RESET"
                className="w-full px-3 py-2 border-2 border-red-200 rounded-xl text-sm font-mono text-center tracking-widest uppercase focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={confirmResetText !== 'RESET' || resetting}
                onClick={handleExecuteReset}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
                {resetting ? 'กำลังสำรองข้อมูลและล้างระบบ...' : 'ยืนยันล้างข้อมูลและส่งมอบงาน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

