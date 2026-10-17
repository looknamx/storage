'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import MarketingSidebar from '@/components/layout/MarketingSidebar';
import Topbar from '@/components/layout/Topbar';
import AutoBackupRunner from '@/components/AutoBackupRunner';
import { isProgramAuthenticated } from '@/lib/auth';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMarketing = pathname.startsWith('/marketing');
  const isProcurement = pathname.startsWith('/procurement');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapsed state

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fleet_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('fleet_sidebar_collapsed', String(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  }, []);

  const handleMenuToggle = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen((prev) => !prev);
    } else {
      handleToggleCollapse();
    }
  }, [handleToggleCollapse]);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Authentication check for Program A vs Program B vs Program C (Daily PIN session)
  useEffect(() => {
    if (pathname === '/') {
      setIsAuthenticated(true);
      return;
    }

    const checkDailyAuth = () => {
      const targetProgram = isProcurement ? 'c' : isMarketing ? 'b' : 'a';
      if (!isProgramAuthenticated(targetProgram)) {
        setIsAuthenticated(false);
        window.location.href = `/?login=${targetProgram}`;
        return false;
      }
      setIsAuthenticated(true);
      return true;
    };

    checkDailyAuth();

    // Check periodically or when user switches back to the tab,
    // ensuring session expires immediately upon date change (ขึ้นวันใหม่)
    const timer = setInterval(checkDailyAuth, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkDailyAuth();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [pathname, isMarketing, isProcurement]);

  // When visiting portal landing page (root path), render clean standalone window without sidebar/topbar
  if (pathname === '/') {
    return (
      <main className="min-h-screen w-full">
        {children}
      </main>
    );
  }

  // Prevent unauthorized view flash while checking auth
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</span>
        </div>
      </div>
    );
  }

  if (isProcurement) {
    return (
      <main className="min-h-screen w-full bg-slate-900">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      {isMarketing ? (
        <MarketingSidebar
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      ) : (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      )}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        <Topbar onMenuToggle={handleMenuToggle} isCollapsed={isCollapsed} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <AutoBackupRunner />
          {children}
        </main>
      </div>
    </div>
  );
}
