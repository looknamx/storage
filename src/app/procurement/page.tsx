'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  FileText, 
  FileCheck2, 
  Users, 
  PackageCheck, 
  BarChart3, 
  Clock, 
  ArrowUpRight, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function ProcurementDashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Sample placeholder data for procurement dashboard
  const stats = [
    {
      title: 'ใบขอซื้อรออนุมัติ (PR)',
      value: '0',
      unit: 'รายการ',
      subtitle: 'รอการตรวจสอบและอนุมัติ',
      icon: FileText,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      title: 'ใบสั่งซื้อกำลังดำเนินการ (PO)',
      value: '0',
      unit: 'รายการ',
      subtitle: 'อยู่ระหว่างส่งของ/จัดซื้อ',
      icon: ShoppingBag,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    {
      title: 'ตรวจรับพัสดุสำเร็จเดือนนี้',
      value: '0',
      unit: 'รายการ',
      subtitle: 'รับเข้าคลังและตรวจเช็กแล้ว',
      icon: PackageCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'ทะเบียนคู่ค้า & ผู้จำหน่าย',
      value: '0',
      unit: 'ราย',
      subtitle: 'ข้อมูลร้านค้าและตัวแทนจำหน่าย',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  const menuOverview = [
    {
      title: 'ใบขอซื้อ (Purchase Requisition - PR)',
      path: '/procurement/pr',
      description: 'ระบบบันทึกและส่งอนุมัติใบขอซื้อสินค้า อะไหล่ หรือบริการจากแผนกต่างๆ',
      icon: FileText,
      badge: 'เมนูหลัก',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      title: 'ใบสั่งซื้อ (Purchase Order - PO)',
      path: '/procurement/po',
      description: 'ออกใบสั่งซื้ออย่างเป็นทางการ ติดตามสถานะการส่งมอบจากผู้จำหน่าย',
      icon: FileCheck2,
      badge: 'เมนูหลัก',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      title: 'ทะเบียนผู้จำหน่าย & คู่ค้า (Vendors)',
      path: '/procurement/vendors',
      description: 'จัดการฐานข้อมูลคู่ค้า เงื่อนไขเครดิต บันทึกประวัติและคะแนนการบริการ',
      icon: Users,
      badge: 'ฐานข้อมูล',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      title: 'ตรวจรับพัสดุ/สินค้า (Receiving)',
      path: '/procurement/receiving',
      description: 'ระบบตรวจรับของเข้า เชื่อมโยงกับใบสั่งซื้อและตรวจสอบความถูกต้อง',
      icon: PackageCheck,
      badge: 'คลังพัสดุ',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'ศูนย์รายงานจัดซื้อ (Reports)',
      path: '/procurement/reports',
      description: 'สรุปยอดจัดซื้อแยกตามหมวดหมู่ วิเคราะห์ค่าใช้จ่าย และส่งออก Excel',
      icon: BarChart3,
      badge: 'รายงาน',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-800">
              แดชบอร์ดฝ่ายจัดซื้อ (Procurement Dashboard)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              โปรแกรม C
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            ระบบบริหารจัดการแผนงานฝ่ายจัดซื้อ ติดตามใบขอซื้อ (PR), ใบสั่งซื้อ (PO) และจัดการผู้จำหน่าย
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างใบขอซื้อใหม่ (PR)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 truncate max-w-[180px]">
                  {item.title}
                </span>
                <div className={`w-9 h-9 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-extrabold text-slate-800">{item.value}</span>
                <span className="text-xs text-slate-500 font-medium">{item.unit}</span>
              </div>
              <p className="text-xs text-slate-400">{item.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Welcome & System Status Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-6 sm:p-7 shadow-md">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>โครงสร้างเมนูด้านข้าง (Sidebar) พร้อมใช้งาน</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            ระบบแผนงานฝ่ายจัดซื้อ (โปรแกรม C) พร้อมเชื่อมโยงการทำงาน
          </h2>
          <p className="text-sm text-emerald-100/90 leading-relaxed font-normal">
            หน้าต่างและการแสดงผลถูกจัดรูปแบบให้สอดคล้องกับโปรแกรม A (ซ่อมบำรุง) และโปรแกรม B (การตลาด) 
            มีแถบเมนูด้านซ้ายสำหรับการเข้าถึงส่วนงานต่างๆ ได้อย่างสะดวกรวดเร็ว
          </p>
        </div>
      </div>

      {/* Functional Modules Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              ผังเมนูและฟังก์ชันงานฝ่ายจัดซื้อ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกเพื่อดูรายละเอียดของแต่ละโมดูลงานที่จัดเตรียมไว้ในแถบเมนูด้านซ้าย
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            ทั้งหมด 5 เมนูหลัก
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {menuOverview.map((menu, idx) => {
            const Icon = menu.icon;
            return (
              <div
                key={idx}
                className="group flex flex-col justify-between p-4 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${menu.badgeColor}`}>
                      {menu.badge}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">
                    {menu.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {menu.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-medium">
                  <span>ดูรายละเอียด</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
