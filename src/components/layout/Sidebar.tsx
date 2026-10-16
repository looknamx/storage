'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Package,
  PackagePlus,
  PackageMinus,
  Wrench,
  History,
  CalendarCheck,
  Bell,
  BarChart3,
  Database,
  Settings,
  Truck,
  X,
  LogOut,
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'ข้อมูลรถบริษัท', icon: Car, path: '/vehicles' },
  { label: 'คลังอะไหล่', icon: Package, path: '/parts' },
  { label: 'รับอะไหล่เข้า', icon: PackagePlus, path: '/stock-in' },
  { label: 'เบิกจ่ายและคืนอะไหล่', icon: PackageMinus, path: '/stock-out' },
  { label: 'ใบงานซ่อม', icon: Wrench, path: '/repair-orders' },
  { label: 'ประวัติการซ่อม', icon: History, path: '/repair-history' },
  { label: 'แผนซ่อมบำรุง', icon: CalendarCheck, path: '/maintenance' },
  { label: 'แจ้งเตือน', icon: Bell, path: '/notifications' },
  { label: 'รายงาน', icon: BarChart3, path: '/reports' },
  { label: 'สำรองและกู้คืนข้อมูล', icon: Database, path: '/backup' },
  { label: 'ตั้งค่าระบบ', icon: Settings, path: '/settings' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string): boolean => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-64 flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#1e293b' }}
      >
        {/* Logo / System Name */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight">
                ระบบบริหารรถบริษัท
              </h1>
              <p className="text-xs text-slate-400">Fleet Management</p>
            </div>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-700 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Exit Application & Version */}
        <div className="border-t border-slate-700/80 px-3 py-3 space-y-2">
          <button
            type="button"
            onClick={async () => {
              if (confirm('คุณต้องการปิดการทำงานของระบบและออกจากโปรแกรมใช่หรือไม่?')) {
                try {
                  await fetch('/api/system/shutdown', { method: 'POST' })
                } catch (e) {
                  // ignore
                }
                document.body.innerHTML = `
                  <div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;background:#0f172a;color:#f8fafc;">
                    <h2 style="font-size:24px;margin-bottom:8px;">ปิดระบบเรียบร้อยแล้ว</h2>
                    <p style="color:#94a3b8;font-size:14px;">คุณสามารถปิดหน้าต่างนี้ได้ทันที ขอบคุณครับ</p>
                  </div>
                `
                setTimeout(() => {
                  window.close()
                }, 1000)
              }
            }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>ออกจากโปรแกรม</span>
          </button>
          <p className="text-center text-[11px] text-slate-500">v1.0.0 (Fleet Storage)</p>
        </div>
      </aside>
    </>
  );
}
