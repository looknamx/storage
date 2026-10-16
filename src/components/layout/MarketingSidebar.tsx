'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  TrendingUp,
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Users,
  Receipt,
  Fuel,
  FileSpreadsheet,
  UploadCloud,
  Wrench,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  X,
  Truck,
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

interface MenuGroup {
  id: string;
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    id: 'overview',
    title: 'ภาพรวม & เที่ยววิ่ง',
    items: [
      { label: 'แดชบอร์ดการตลาด', icon: LayoutDashboard, path: '/marketing' },
      { label: 'รายการเที่ยววิ่งทั้งหมด', icon: ClipboardList, path: '/marketing/jobs' },
    ],
  },
  {
    id: 'operations',
    title: 'การจัดการงาน',
    items: [
      { label: 'บันทึกเที่ยววิ่งใหม่', icon: PlusCircle, path: '/marketing/jobs/new' },
      { label: 'ฐานข้อมูลลูกค้า', icon: Users, path: '/marketing/customers' },
    ],
  },
  {
    id: 'finance',
    title: 'การเงิน & วางบิล',
    items: [
      { label: 'การวางบิลและรับชำระ', icon: Receipt, path: '/marketing/billing' },
      { label: 'รายงานกำไร-ขาดทุน', icon: FileSpreadsheet, path: '/marketing/reports' },
    ],
  },
  {
    id: 'analytics',
    title: 'วิเคราะห์ & นำเข้า',
    items: [
      { label: 'วิเคราะห์น้ำมัน & เลขไมล์', icon: Fuel, path: '/marketing/fuel-report' },
      { label: 'นำเข้าข้อมูล CSV/Excel', icon: UploadCloud, path: '/marketing/import' },
    ],
  },
];

interface MarketingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function MarketingSidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: MarketingSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string): boolean => {
    if (path === '/marketing') return pathname === '/marketing';
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full flex-col transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-64 lg:w-[72px]' : 'w-64 lg:w-64'}`}
        style={{ backgroundColor: '#13111c' }}
      >
        {/* Header */}
        <div
          className={`flex h-16 items-center border-b border-purple-900/40 px-3 transition-all ${
            isCollapsed ? 'justify-center lg:px-2' : 'justify-between px-4'
          }`}
        >
          {isCollapsed ? (
            <div className="flex items-center justify-center w-full">
              <button
                type="button"
                onClick={onToggleCollapse}
                title="คลิกเพื่อขยายเมนู (Expand)"
                className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all active:scale-95"
              >
                <TrendingUp className="h-5 w-5" />
                <div className="absolute left-full ml-3 hidden lg:group-hover:flex items-center px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                  คลิกเพื่อขยายเมนูด้านซ้าย
                </div>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-sm shadow-purple-600/30 text-white">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-semibold text-white leading-tight truncate">
                    ระบบแผนงานการตลาด
                  </h1>
                  <p className="text-xs text-purple-300/70 truncate">Marketing & Transport</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onToggleCollapse && (
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    title="ย่อเมนู (แสดงเฉพาะไอคอน)"
                    className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-purple-300/70 hover:bg-purple-950/60 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1 text-purple-300/70 hover:bg-purple-950/60 hover:text-white lg:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 scrollbar-thin scrollbar-thumb-purple-900">
          <div className="space-y-1">
            {menuGroups.map((group, groupIdx) => (
              <div key={group.id} className="space-y-1">
                {groupIdx > 0 && (
                  <div
                    className={
                      isCollapsed
                        ? 'w-8 h-[1px] bg-purple-900/40 my-2 mx-auto'
                        : 'border-t border-purple-900/40 my-2 mx-1.5'
                    }
                  />
                )}

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <div key={item.path} className="relative group">
                      <Link
                        href={item.path}
                        onClick={onClose}
                        title={isCollapsed ? item.label : undefined}
                        className={`flex items-center rounded-lg text-sm font-medium transition-all ${
                          isCollapsed
                            ? 'h-10 w-10 justify-center mx-auto'
                            : 'w-full gap-3 px-3 py-2'
                        } ${
                          active
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                            : 'text-purple-200/80 hover:bg-purple-950/50 hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>

                      {/* Tooltip on collapsed desktop view */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 hidden lg:group-hover:flex items-center px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                          {item.label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom Expand Toggle Button if collapsed */}
        {isCollapsed && onToggleCollapse && (
          <div className="hidden lg:flex justify-center border-t border-purple-900/40 py-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="ขยายเมนู (Expand)"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-purple-300/70 hover:bg-purple-950/60 hover:text-white transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* System Switchers & Portal */}
        <div
          className={`border-t border-purple-900/40 py-3 transition-all ${
            isCollapsed ? 'px-2 flex flex-col items-center space-y-2' : 'px-3 space-y-2'
          }`}
        >
          {/* Switch to Maintenance System */}
          <Link
            href="/dashboard"
            title={isCollapsed ? 'สลับไป: ระบบซ่อมบำรุงรถ' : undefined}
            className={`flex items-center rounded-lg text-xs font-medium text-blue-300 hover:bg-blue-950/40 hover:text-blue-100 transition-colors ${
              isCollapsed ? 'h-10 w-10 justify-center group relative' : 'w-full gap-3 px-3 py-2'
            }`}
          >
            <Truck className="h-4 w-4 shrink-0 text-blue-400" />
            {!isCollapsed && <span>ไป: ระบบซ่อมบำรุง</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-3 hidden lg:group-hover:flex items-center px-2.5 py-1.5 bg-slate-900 text-blue-200 text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                ไป: ระบบแผนซ่อมบำรุงรถ
              </div>
            )}
          </Link>

          {/* Switch to Portal */}
          <Link
            href="/"
            title={isCollapsed ? 'กลับหน้าแรก Portal' : undefined}
            className={`flex items-center rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors ${
              isCollapsed ? 'h-10 w-10 justify-center group relative' : 'w-full gap-3 px-3 py-2'
            }`}
          >
            <LayoutGrid className="h-4 w-4 shrink-0 text-slate-400" />
            {!isCollapsed && <span>หน้าแรก (Portal)</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-3 hidden lg:group-hover:flex items-center px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                หน้าแรก (Portal)
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <p className="text-center text-[10px] text-purple-300/40 pt-1">v1.0.0 (Marketing & Ops)</p>
          )}
        </div>
      </aside>
    </>
  );
}

