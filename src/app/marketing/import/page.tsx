'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileUp,
  X,
  Layers,
  ArrowRight,
  Database,
  Calendar,
  Check,
  Download,
} from 'lucide-react';

const THAI_MONTHS = [
  { short: 'ม.ค.', full: 'มกราคม' },
  { short: 'ก.พ.', full: 'กุมภาพันธ์' },
  { short: 'มี.ค.', full: 'มีนาคม' },
  { short: 'เม.ย.', full: 'เมษายน' },
  { short: 'พ.ค.', full: 'พฤษภาคม' },
  { short: 'มิ.ย.', full: 'มิถุนายน' },
  { short: 'ก.ค.', full: 'กรกฎาคม' },
  { short: 'ส.ค.', full: 'สิงหาคม' },
  { short: 'ก.ย.', full: 'กันยายน' },
  { short: 'ต.ค.', full: 'ตุลาคม' },
  { short: 'พ.ย.', full: 'พฤศจิกายน' },
  { short: 'ธ.ค.', full: 'ธันวาคม' },
];

export default function MarketingImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2569');
  const [mode, setMode] = useState<string>('replace_month');
  const [uploading, setUploading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setErrorMessage('');
      setResult(null);

      // Auto detect month from filename if possible
      const name = selected.name;
      for (const m of THAI_MONTHS) {
        if (name.includes(m.full) || name.includes(m.short)) {
          setSelectedMonth(m.short);
          break;
        }
      }
      const matchYear = name.match(/25\d{2}|20\d{2}/);
      if (matchYear) {
        const y = parseInt(matchYear[0], 10);
        setSelectedYear(String(y > 2400 ? y : y + 543));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('กรุณาเลือกไฟล์ Excel (.xlsx, .xls) หรือ CSV ก่อนกดอัปโหลด');
      return;
    }

    try {
      setUploading(true);
      setErrorMessage('');
      setResult(null);

      const formData = new FormData();
      formData.append('file', file);
      if (selectedMonth) formData.append('month', selectedMonth);
      if (selectedYear) formData.append('year', selectedYear);
      formData.append('mode', mode);

      const res = await fetch('/api/marketing/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setFile(null);
      } else {
        setErrorMessage(data.error || data.details || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
      }
    } catch (err: any) {
      setErrorMessage(`เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            นำเข้าข้อมูลงานขนส่ง (Import CSV / Excel)
          </h1>
          <p className="text-xs text-gray-500">
            ระบบอัปโหลดไฟล์รายงานเที่ยววิ่งประจำเดือน รองรับหลายเดือนและแยกข้อมูลเดือนต่อเดือน
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-3 text-sm font-medium animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Result Card */}
      {result && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm space-y-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-bold text-base text-emerald-900">
                นำเข้าข้อมูลสำเร็จเรียบร้อย!
              </h3>
              <p className="text-xs text-emerald-700">
                ข้อมูลประจำเดือน {THAI_MONTHS.find(m => m.short === result.jobMonth)?.full || result.jobMonth} พ.ศ. {result.jobYear}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-emerald-200 text-center">
              <span className="text-[11px] text-emerald-700 block">จำนวนรายการ</span>
              <span className="text-lg font-bold text-emerald-950">{result.count} งาน</span>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-emerald-200 text-center">
              <span className="text-[11px] text-emerald-700 block">ยอดรายรับรวม</span>
              <span className="text-lg font-bold text-emerald-950">
                ฿{new Intl.NumberFormat('th-TH').format(Math.round(result.totalGross || 0))}
              </span>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-emerald-200 text-center">
              <span className="text-[11px] text-emerald-700 block">กำไรสุทธิรวม</span>
              <span className="text-lg font-bold text-emerald-950">
                ฿{new Intl.NumberFormat('th-TH').format(Math.round(result.totalProfit || 0))}
              </span>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-emerald-200 text-center">
              <span className="text-[11px] text-emerald-700 block">ลูกค้าที่บันทึก</span>
              <span className="text-lg font-bold text-emerald-950">{result.customersCount} ราย</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Upload Box */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FileUp className="w-5 h-5 text-purple-600" />
            <span>เลือกไฟล์ Excel หรือ CSV เพื่อนำเข้า</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            รองรับไฟล์นามสกุล .xlsx, .xls, .csv ที่มีโครงสร้างตารางเที่ยววิ่งประจำเดือน
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-5">
          {/* File Picker Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              file
                ? 'border-purple-500 bg-purple-50/30'
                : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-purple-600" />
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    ขนาด: {(file.size / 1024).toFixed(1)} KB | คลิกเพื่อเปลี่ยนไฟล์
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 mx-auto flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  คลิกที่นี่เพื่อเลือกไฟล์ หรือลากไฟล์มาวาง
                </p>
                <p className="text-xs text-gray-400">
                  รองรับไฟล์ Microsoft Excel (.xlsx, .xls) และ CSV
                </p>
              </div>
            )}
          </div>

          {/* Month, Year, and Mode Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                ประจำเดือน
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">ตรวจหาอัตโนมัติจากไฟล์</option>
                {THAI_MONTHS.map((m) => (
                  <option key={m.short} value={m.short}>
                    {m.full} ({m.short})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                ปี พ.ศ.
              </label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                placeholder="2569"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                รูปแบบการนำเข้า
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="replace_month">
                  แทนที่ข้อมูลเฉพาะเดือนที่เลือก (ไม่กระทบเดือนอื่น)
                </option>
                <option value="append">เพิ่มต่อท้ายรายการเดิม</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-gray-100">
            <span className="text-xs text-gray-400">
              * ข้อมูลเดือนอื่นๆ ในระบบจะไม่สูญหาย ระบบจะแยกจัดเก็บเป็นรายเดือน
            </span>

            <button
              type="submit"
              disabled={uploading || !file}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud className={`w-4 h-4 ${uploading ? 'animate-spin' : ''}`} />
              <span>{uploading ? 'กำลังประมวลผลไฟล์...' : 'เริ่มอัปโหลดและนำเข้าข้อมูล'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Template Download Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-purple-50 rounded-2xl border border-purple-200/80 text-xs gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-600 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-gray-800 text-sm">ต้องการดูรูปแบบตารางหรือดาวน์โหลดไฟล์ตัวอย่าง?</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              ดาวน์โหลดเทมเพลต Excel (.xlsx) ที่มีโครงสร้างหัวคอลัมน์มาตรฐานครบถ้วน พร้อมข้อมูลตัวอย่างเพื่อนำไปกรอกข้อมูล
            </div>
          </div>
        </div>
        <a
          href="/api/marketing/template"
          download="transport_jobs_template.xlsx"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs shadow-sm transition active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>ดาวน์โหลดไฟล์ตัวอย่าง (.xlsx)</span>
        </a>
      </div>

      {/* Column Structure Information */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3 text-xs">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          <span>โครงสร้างหัวคอลัมน์มาตรฐานที่ระบบรองรับ</span>
        </h3>
        <p className="text-gray-600 leading-relaxed">
          ระบบตรวจจับหัวคอลัมน์อัตโนมัติจากไฟล์ Excel / CSV เช่น ลำดับที่, วดป.รับงาน, เดือนรับงาน, วันที่รับสินค้า, วันลงสินค้า, ทะเบียน, คนขับ, ชื่อลูกค้า, ต้นทาง, ปลายทาง, น้ำหนัก, ราคาต่อตัน, จำนวนเงิน, ค่าน้ำมัน, เบี้ยเลี้ยง, กำไรสุทธิ ฯลฯ
        </p>
      </div>
    </div>
  );
}
