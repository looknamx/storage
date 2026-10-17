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
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Settings,
  BarChart3,
  Database,
} from 'lucide-react';
import { clearProgramAuth } from '@/lib/auth';

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

interface MenuGroup {
  id: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    id: 'overview',
    items: [
      { label: 'แดชบอร์ดการตลาด', icon: LayoutDashboard, path: '/marketing' },
      { label: 'รายการเที่ยววิ่งทั้งหมด', icon: ClipboardList, path: '/marketing/jobs' },
    ],
  },
  {
    id: 'operations',
    items: [
      { label: 'บันทึกเที่ยววิ่งใหม่', icon: PlusCircle, path: '/marketing/jobs/new' },
      { label: 'ฐานข้อมูลลูกค้า', icon: Users, path: '/marketing/customers' },
    ],
  },
  {
    id: 'finance',
    items: [
      { label: 'การวางบิลและรับชำระ', icon: Receipt, path: '/marketing/billing' },
      { label: 'ศูนย์รายงานและส่งออก (Reports)', icon: BarChart3, path: '/marketing/reports' },
    ],
  },
  {
    id: 'analytics',
    items: [
      { label: 'วิเคราะห์น้ำมัน & เลขไมล์', icon: Fuel, path: '/marketing/fuel-report' },
      { label: 'นำเข้าข้อมูล CSV/Excel', icon: UploadCloud, path: '/marketing/import' },
    ],
  },
  {
    id: 'system',
    items: [
      { label: 'สำรองและกู้คืนข้อมูล', icon: Database, path: '/marketing/backup' },
      { label: 'ตั้งค่าระบบ', icon: Settings, path: '/marketing/settings' },
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
    if (path === '/marketing/jobs') {
      return pathname === '/marketing/jobs' || (pathname.startsWith('/marketing/jobs/') && pathname !== '/marketing/jobs/new');
    }
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

      {/* Sidebar - Same slate background #1e293b and dimensions as Program A */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full flex-col transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-64 lg:w-[72px]' : 'w-64 lg:w-64'}`}
        style={{ backgroundColor: '#1e293b' }}
      >
        {/* Header - Identical to Program A */}
        <div
          className={`flex h-16 items-center border-b border-slate-700/80 px-3 transition-all ${
            isCollapsed ? 'justify-center lg:px-2' : 'justify-between px-4'
          }`}
        >
          {isCollapsed ? (
            <div className="flex items-center justify-center w-full">
              <button
                type="button"
                onClick={onToggleCollapse}
                title="คลิกเพื่อขยายเมนู (Expand Menu)"
                className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all active:scale-95"
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
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-600 shadow-sm text-white">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-semibold text-white leading-tight truncate">
                    ระบบแผนงานการตลาด
                  </h1>
                  <p className="text-xs text-slate-400 truncate">Marketing & Transport</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onToggleCollapse && (
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    title="ย่อเมนู (แสดงเฉพาะไอคอน)"
                    className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-700 hover:text-white lg:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="space-y-1">
            {menuGroups.map((group, groupIdx) => (
              <div key={group.id} className="space-y-1">
                {/* Thin subtle category divider line - Identical to Program A */}
                {groupIdx > 0 && (
                  <div
                    className={
                      isCollapsed
                        ? 'w-8 h-[1px] bg-slate-700/80 my-2 mx-auto'
                        : 'border-t border-slate-700/80 my-2 mx-1.5'
                    }
                  />
                )}

                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    if (isCollapsed) {
                      return (
                        <li key={item.path} className="relative group flex justify-center">
                          <Link
                            href={item.path}
                            onClick={onClose}
                            className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                              active
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
                            }`}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                          </Link>

                          {/* Floating Tooltip */}
                          <div className="absolute left-full ml-3 hidden lg:group-hover:flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-2xl whitespace-nowrap z-50 pointer-events-none transition-opacity">
                            <span>{item.label}</span>
                          </div>
                        </li>
                      );
                    }

                    // Expanded Mode (Normal) - Identical font, padding and height
                    return (
                      <li key={item.path}>
                        <Link
                          href={item.path}
                          onClick={onClose}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                            active
                              ? 'bg-purple-600 text-white font-semibold shadow-sm'
                              : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
                          }`}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1 truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom Expand Toggle Button if collapsed */}
        {isCollapsed && onToggleCollapse && (
          <div className="hidden lg:flex justify-center border-t border-slate-700/80 py-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="ขยายเมนู (Expand)"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Portal Switcher & Logout & Version */}
        <div
          className={`border-t border-slate-700/80 py-3 transition-all ${
            isCollapsed ? 'px-2 flex flex-col items-center space-y-2' : 'px-3 space-y-2'
          }`}
        >
          {/* Switch Module / Return to Portal */}
          <Link
            href="/"
            title={isCollapsed ? 'สลับระบบงาน (Portal)' : undefined}
            className={`flex items-center rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700/80 hover:text-white transition-colors ${
              isCollapsed
                ? 'h-10 w-10 justify-center group relative'
                : 'w-full gap-3 px-3 py-2'
            }`}
          >
            <LayoutGrid className="h-5 w-5 shrink-0 text-purple-400" />
            {!isCollapsed && <span>สลับระบบงาน (Portal)</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-3 hidden lg:group-hover:flex items-center px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                สลับระบบงาน (Portal)
              </div>
            )}
          </Link>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => {
              if (confirm('คุณต้องการออกจากระบบแผนงานการตลาด ใช่หรือไม่?')) {
                clearProgramAuth('b');
                window.location.href = '/';
              }
            }}
            title={isCollapsed ? 'ออกจากระบบ' : undefined}
            className={`flex items-center rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors ${
              isCollapsed
                ? 'h-10 w-10 justify-center group relative'
                : 'w-full gap-3 px-3 py-2'
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>ออกจากระบบ</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-3 hidden lg:group-hover:flex items-center px-2.5 py-1.5 bg-slate-900 text-rose-200 text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                ออกจากระบบ
              </div>
            )}
          </button>

          {!isCollapsed && (
            <p className="text-center text-[11px] text-slate-500">v1.0.0</p>
          )}
        </div>
      </aside>
    </>
  );
}
