'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  FileText, 
  Users, 
  BarChart3, 
  LayoutGrid, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  ShieldCheck,
  Package
} from 'lucide-react';
import { clearProgramAuth } from '@/lib/auth';

export default function ProcurementPage() {
  const handleLogout = () => {
    if (confirm('คุณต้องการออกจากระบบแผนงานฝ่ายจัดซื้อ ใช่หรือไม่?')) {
      clearProgramAuth('c');
      window.location.href = '/';
    }
  };

  const upcomingModules = [
    {
      title: 'ใบขอซื้อ (Purchase Requisition - PR)',
      description: 'ระบบบันทึกและส่งอนุมัติใบขอซื้อสินค้า อะไหล่ หรือบริการจากแต่ละแผนก',
      icon: FileText,
      status: 'เร็วๆ นี้',
    },
    {
      title: 'ใบสั่งซื้อ (Purchase Order - PO)',
      description: 'ออกใบสั่งซื้อ ติดตามสถานะการส่งมอบสินค้า ตรวจรับพัสดุและจัดเก็บเอกสาร',
      icon: ShoppingBag,
      status: 'เร็วๆ นี้',
    },
    {
      title: 'ทะเบียนผู้จำหน่าย & คู่ค้า (Suppliers / Vendors)',
      description: 'ฐานข้อมูลคู่ค้า เงื่อนไขเครดิตเทอม บันทึกประวัติการจัดซื้อและประเมินผลงาน',
      icon: Users,
      status: 'เร็วๆ นี้',
    },
    {
      title: 'รายงาน & สถิติงานจัดซื้อ (Procurement Analytics)',
      description: 'วิเคราะห์ยอดจัดซื้อแยกตามหมวดหมู่ ตรวจสอบต้นทุน และเปรียบเทียบราคาผู้จำหน่าย',
      icon: BarChart3,
      status: 'เร็วๆ นี้',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-slate-100 p-6 md:p-10 flex flex-col justify-between">
      {/* Top Navbar */}
      <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                ระบบแผนงานฝ่ายจัดซื้อ
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                โปรแกรม C
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Procurement & Purchasing Management System
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors shadow-sm"
          >
            <LayoutGrid className="w-4 h-4 text-emerald-400" />
            <span>สลับระบบงาน (Portal)</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl w-full mx-auto my-10 space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 p-8 sm:p-10 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ยืนยันรหัส PIN สำเร็จ (Session ปลอดภัยประจำวัน)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              ยินดีต้อนรับสู่ระบบแผนงานฝ่ายจัดซื้อ
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              โมดูลระบบแผนงานฝ่ายจัดซื้อ (โปรแกรม C) อยู่ระหว่างการเตรียมโครงสร้างและขั้นตอนจัดซื้อจัดจ้าง 
              คุณสามารถสลับกลับสู่หน้า Portal เพื่อเข้าใช้งานโปรแกรม A หรือ B ได้ตลอดเวลา
            </p>
          </div>
          <div className="absolute right-6 -bottom-6 opacity-10 sm:opacity-20 pointer-events-none text-emerald-400">
            <Package className="w-64 h-64" />
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>แผนผังฟังก์ชันระบบจัดซื้อ (Upcoming Modules)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {upcomingModules.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-800/60 border border-slate-700/80 p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-emerald-500/40 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-white text-base leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {item.status}
                    </span>
                    <span className="text-[11px] text-slate-500">เวอร์ชัน v1.0</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        ศูนย์กลางระบบสารสนเทศองค์กร • โปรแกรม C ระบบแผนงานฝ่ายจัดซื้อ
      </div>
    </div>
  );
}

