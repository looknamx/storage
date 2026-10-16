'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LayoutGrid,
  TrendingUp,
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

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
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'ข้อมูลรถบริษัท', icon: Car, path: '/vehicles' },
    ],
  },
  {
    id: 'inventory',
    items: [
      { label: 'คลังอะไหล่', icon: Package, path: '/parts' },
      { label: 'รับอะไหล่เข้า', icon: PackagePlus, path: '/stock-in' },
      { label: 'เบิกจ่ายและคืนอะไหล่', icon: PackageMinus, path: '/stock-out' },
    ],
  },
  {
    id: 'maintenance',
    items: [
      { label: 'ใบงานซ่อม', icon: Wrench, path: '/repair-orders' },
      { label: 'ประวัติการซ่อม', icon: History, path: '/repair-history' },
      { label: 'แผนซ่อมบำรุง', icon: CalendarCheck, path: '/maintenance' },
    ],
  },
  {
    id: 'monitoring',
    items: [
      { label: 'แจ้งเตือน', icon: Bell, path: '/notifications' },
      { label: 'รายงาน', icon: BarChart3, path: '/reports' },
    ],
  },
  {
    id: 'system',
    items: [
      { label: 'สำรองและกู้คืนข้อมูล', icon: Database, path: '/backup' },
      { label: 'ตั้งค่าระบบ', icon: Settings, path: '/settings' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications?countOnly=true');
      if (res.ok) {
        const data = await res.json();
        setUnreadNotifications(data.unreadCount || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [pathname]);

  const isActive = (path: string): boolean => {
    if (path === '/dashboard') return pathname === '/dashboard';
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
        className={`fixed top-0 left-0 z-50 flex h-full flex-col transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-64 lg:w-[72px]' : 'w-64 lg:w-64'}`}
        style={{ backgroundColor: '#1e293b' }}
      >
        {/* Logo / System Name */}
        <div
          className={`flex h-16 items-center border-b border-slate-700/80 px-3 transition-all ${
            isCollapsed ? 'justify-center lg:px-2' : 'justify-between px-4'
          }`}
        >
          {isCollapsed ? (
            /* Collapsed view header: Centered blue truck icon with expand action */
            <div className="flex items-center justify-center w-full">
              <button
                type="button"
                onClick={onToggleCollapse}
                title="คลิกเพื่อขยายเมนู (Expand Menu)"
                className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all active:scale-95"
              >
                <Truck className="h-5 w-5" />
                <div className="absolute left-full ml-3 hidden lg:group-hover:flex items-center px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                  คลิกเพื่อขยายเมนูด้านซ้าย
                </div>
              </button>
            </div>
          ) : (
            /* Expanded view header */
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-semibold text-white leading-tight truncate">
                    ระบบบริหารรถบริษัท
                  </h1>
                  <p className="text-xs text-slate-400 truncate">Fleet Management</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Desktop Collapse Toggle */}
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

                {/* Mobile Close Button */}
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
                {/* Thin subtle category divider line */}
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
                      // Collapsed (Icon Only with Floating Tooltip)
                      return (
                        <li key={item.path} className="relative group flex justify-center">
                          <Link
                            href={item.path}
                            onClick={onClose}
                            className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                              active
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
                            }`}
                          >
                            <Icon className="h-5 w-5 shrink-0" />

                            {/* Low-stock / Unread badge in collapsed mode */}
                            {item.path === '/notifications' && unreadNotifications > 0 && (
                              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-slate-800"></span>
                              </span>
                            )}
                          </Link>

                          {/* Floating Tooltip */}
                          <div className="absolute left-full ml-3 hidden lg:group-hover:flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-2xl whitespace-nowrap z-50 pointer-events-none transition-opacity">
                            <span>{item.label}</span>
                            {item.path === '/notifications' && unreadNotifications > 0 && (
                              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {unreadNotifications > 99 ? '99+' : unreadNotifications}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    }

                    // Expanded Mode (Normal)
                    return (
                      <li key={item.path}>
                        <Link
                          href={item.path}
                          onClick={onClose}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                            active
                              ? 'bg-blue-600 text-white font-semibold shadow-sm'
                              : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
                          }`}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.path === '/notifications' && unreadNotifications > 0 && (
                            <div className="ml-auto flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                              </span>
                              <span
                                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full min-w-5 text-center leading-none ${
                                  active
                                    ? 'bg-white text-rose-600'
                                    : 'bg-rose-500 text-white'
                                }`}
                              >
                                {unreadNotifications > 99 ? '99+' : unreadNotifications}
                              </span>
                            </div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Collapsed Toggle Button at bottom when collapsed */}
        {isCollapsed && onToggleCollapse && (
          <div className="hidden lg:flex justify-center py-2 border-t border-slate-700/60">
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

        {/* Portal Switcher & Exit Application & Version */}
        <div
          className={`border-t border-slate-700/80 py-3 transition-all ${
            isCollapsed ? 'px-2 flex flex-col items-center space-y-2' : 'px-3 space-y-2'
          }`}
        >
          {/* Switch to Marketing System */}
          <Link
            href="/marketing"
            title={isCollapsed ? 'ไป: ระบบแผนงานการตลาด' : undefined}
            className={`flex items-center rounded-lg text-sm font-medium text-purple-300 hover:bg-purple-950/40 hover:text-purple-100 transition-colors ${
              isCollapsed
                ? 'h-10 w-10 justify-center group relative'
                : 'w-full gap-3 px-3 py-2'
            }`}
          >
            <TrendingUp className="h-5 w-5 shrink-0 text-purple-400" />
            {!isCollapsed && <span>ไป: ระบบแผนงานการตลาด</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-3 hidden lg:group-hover:flex items-center px-2.5 py-1.5 bg-slate-900 text-purple-200 text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                ไป: ระบบแผนงานการตลาด
              </div>
            )}
          </Link>

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
            <LayoutGrid className="h-5 w-5 shrink-0 text-blue-400" />
            {!isCollapsed && <span>สลับระบบงาน (Portal)</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-3 hidden lg:group-hover:flex items-center px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                สลับระบบงาน (Portal)
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={async () => {
              if (confirm('คุณต้องการปิดการทำงานของระบบและออกจากโปรแกรมใช่หรือไม่?')) {
                try {
                  await fetch('/api/system/shutdown', { method: 'POST' });
                } catch (e) {
                  // ignore
                }
                document.body.innerHTML = `
                  <div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;background:#0f172a;color:#f8fafc;">
                    <h2 style="font-size:24px;margin-bottom:8px;">ปิดระบบเรียบร้อยแล้ว</h2>
                    <p style="color:#94a3b8;font-size:14px;">คุณสามารถปิดหน้าต่างนี้ได้ทันที ขอบคุณครับ</p>
                  </div>
                `;
                setTimeout(() => {
                  window.close();
                }, 1000);
              }
            }}
            title={isCollapsed ? 'ออกจากโปรแกรม' : undefined}
            className={`flex items-center rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors ${
              isCollapsed
                ? 'h-10 w-10 justify-center group relative'
                : 'w-full gap-3 px-3 py-2'
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>ออกจากโปรแกรม</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-3 hidden lg:group-hover:flex items-center px-2.5 py-1.5 bg-slate-900 text-rose-200 text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                ออกจากโปรแกรม
              </div>
            )}
          </button>
          {!isCollapsed && (
            <p className="text-center text-[11px] text-slate-500">v1.0.0 (Fleet Storage)</p>
          )}
        </div>
      </aside>
    </>
  );
}
