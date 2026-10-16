'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  ArrowRight,
  Database,
} from 'lucide-react';

export default function MarketingImportPage() {
  const [importing, setImporting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleReseedJulyData = async () => {
    if (!confirm('คุณต้องการนำเข้าชุดข้อมูลเดือนกรกฎาคม 2569 (539 รายการ) อีกครั้งใช่หรือไม่?')) return;

    try {
      setImporting(true);
      setMessage(null);
      const res = await fetch('/api/marketing/import', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: 'success',
          text: `นำเข้าข้อมูลเรียบร้อยแล้ว จำนวน ${data.count || 539} รายการ ยอดรวม ฿${new Intl.NumberFormat('th-TH').format(data.totalGross || 6666510)}`,
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'เกิดข้อผิดพลาดในการนำเข้า',
        });
      }
    } catch (e: any) {
      setMessage({
        type: 'error',
        text: `เกิดข้อผิดพลาด: ${e.message}`,
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
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
            Import Transport Job Orders & Monthly Operations Data
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1-Click Seed Section */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">ชุดข้อมูลประวัติ: งานประจำเดือน กรกฎาคม 2569</h2>
            <p className="text-xs text-purple-200/70">
              ชุดข้อมูลจริง 539 รายการ ยอดรายรับ 6.66 ล้านบาท พร้อมคำนวณค่าน้ำมันและกำไรสุทธิครบถ้วน
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            disabled={importing}
            onClick={handleReseedJulyData}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-purple-900 font-bold text-xs shadow-lg hover:bg-purple-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${importing ? 'animate-spin' : ''}`} />
            <span>{importing ? 'กำลังนำเข้าข้อมูล...' : 'ซิงค์ / นำเข้าชุดข้อมูล ก.ค. 2569 ทันที'}</span>
          </button>
        </div>
      </div>

      {/* Instructions & Template Info */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4 text-xs">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          <span>โครงสร้างหัวคอลัมน์มาตรฐานที่ระบบรองรับ</span>
        </h3>

        <div className="space-y-2 text-gray-600 leading-relaxed">
          <p>
            ระบบรองรับไฟล์ Excel (.xlsx) และ CSV ที่มีหัวตารางเหมือนไฟล์งานประจำเดือน ดังนี้:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>ข้อมูลงาน:</strong> ลำดับที่, วดป.รับงาน, เดือนรับงาน, วันที่รับสินค้า, วันลงสินค้า, วันที่วางบิล, เลขที่วางบิล, Job Order</li>
            <li><strong>ข้อมูลรถ & คนขับ:</strong> ทะเบียน, ชื่อ-สกุล, ประเภทรถ, รถร่วม</li>
            <li><strong>ลูกค้า & เส้นทาง:</strong> ชื่อลูกค้า, ต้นทาง, เลขที่ใบชั่ง, ปลายทาง, รายละเอียด</li>
            <li><strong>รายรับ & ราคา:</strong> น้ำหนัก(กก.), ราคาต่อตัน, จำนวนเงิน, หัก ณ ที่จ่าย 1%</li>
            <li><strong>การเดินทาง & น้ำมัน:</strong> เลขไมท์ก่อนไป, เลขไมท์กลับมา, กม. ที่ใช้ไป, เติมน้ำมัน(ลิตร), กม./ลิตร, ราคาต่อลิตร, ค่าน้ำมันรถ</li>
            <li><strong>ค่าใช้จ่าย:</strong> ขึ้น ลง, พิเศษ(เซฟน้ำมัน), พิเศษ+เพิ่ม, เบี้ยเลี้ยง, ของกลับ, ทางด่วน, ค่าท่า, ตกค้าง, ค่าซ่อม, อื่นๆ</li>
            <li><strong>กำไร:</strong> รวม ค่าใช้จ่าย, คงเหลือสุทธิต่องาน</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

