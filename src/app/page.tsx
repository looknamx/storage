'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Wrench, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Info,
  X
} from 'lucide-react';

export default function PortalLandingPage() {
  const [showMarketingModal, setShowMarketingModal] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-100 px-4 py-12 selection:bg-blue-500 selection:text-white">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[280px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container / Window */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Header Section */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 shadow-inner backdrop-blur-md text-xs font-medium text-blue-400">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>ศูนย์กลางระบบสารสนเทศองค์กร (Enterprise Portal)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            เลือกระบบงานที่ต้องการใช้งาน
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto font-normal">
            กรุณาเลือกโมดูลเพื่อเข้าสู่ระบบงานบริหารจัดการภายในองค์กร
          </p>
        </div>

        {/* 2 Main Program Buttons / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Program 1: ระบบบริหารจัดการแผนซ่อมบำรุง */}
          <Link
            href="/dashboard"
            className="group relative flex flex-col justify-between p-7 sm:p-8 rounded-2xl bg-slate-800/70 border-2 border-slate-700/80 hover:border-blue-500/80 hover:bg-slate-800/90 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-xl transition-all duration-300 transform hover:-translate-y-1 text-left"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
                <Wrench className="w-7 h-7" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                พร้อมใช้งาน
              </span>
            </div>

            {/* Content */}
            <div className="space-y-2 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                ระบบบริหารจัดการแผนซ่อมบำรุง
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                ระบบบริหารจัดการรถบริษัท คลังอะไหล่ ใบสั่งซ่อม และแผนการตรวจเช็กบำรุงรักษาเชิงป้องกัน
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-blue-400 group-hover:text-blue-300 font-semibold text-sm">
              <span>เข้าสู่ระบบงาน</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Program 2: ระบบแผนงานการตลาด */}
          <button
            type="button"
            onClick={() => setShowMarketingModal(true)}
            className="group relative flex flex-col justify-between p-7 sm:p-8 rounded-2xl bg-slate-800/40 border-2 border-slate-700/60 hover:border-purple-500/60 hover:bg-slate-800/70 shadow-lg hover:shadow-xl hover:shadow-purple-500/10 backdrop-blur-xl transition-all duration-300 transform hover:-translate-y-1 text-left"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                <TrendingUp className="w-7 h-7" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300">
                <Clock className="w-3.5 h-3.5 text-purple-300" />
                โครงการถัดไป
              </span>
            </div>

            {/* Content */}
            <div className="space-y-2 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                ระบบแผนงานการตลาด
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                ระบบวางแผนกลยุทธ์การตลาด วิเคราะห์กลุ่มเป้าหมาย แคมเปญโปรโมชัน และติดตามยอดขาย
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-purple-400 group-hover:text-purple-300 font-semibold text-sm">
              <span>รอเปิดใช้งาน</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-xs text-slate-500 flex items-center gap-2">
          <span>Enterprise Portal Platform</span>
          <span>•</span>
          <span>เวอร์ชัน 1.0.0</span>
        </div>
      </div>

      {/* Coming Soon Modal for "ระบบแผนงานการตลาด" */}
      {showMarketingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 p-6 sm:p-7 shadow-2xl space-y-5 text-center">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowMarketingModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto shadow-inner">
              <TrendingUp className="w-8 h-8" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                เร็วๆ นี้ (Coming Soon)
              </div>
              <h3 className="text-xl font-bold text-white">
                ระบบแผนงานการตลาด
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed pt-1">
                ระบบนี้จัดเตรียมไว้เพื่อรองรับโครงการในระยะถัดไป ขณะนี้กำลังอยู่ระหว่างขั้นตอนการวางแผนและพัฒนาโครงสร้าง
              </p>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-left text-xs text-slate-400">
              <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>หากมีการอัปเดตเปิดใช้งานระบบงานการตลาด ทางทีมงานจะทำการแจ้งเตือนให้ทราบผ่านหน้าศูนย์กลางนี้ครับ</span>
            </div>

            {/* Confirmation Button */}
            <button
              type="button"
              onClick={() => setShowMarketingModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-purple-600/30 transition-all active:scale-98"
            >
              รับทราบ / เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
