'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import MarketingSidebar from '@/components/layout/MarketingSidebar';
import Topbar from '@/components/layout/Topbar';
import AutoBackupRunner from '@/components/AutoBackupRunner';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMarketing = pathname.startsWith('/marketing');
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

  // When visiting portal landing page (root path), render clean standalone window without sidebar/topbar
  if (pathname === '/') {
    return (
      <main className="min-h-screen w-full">
        {children}
      </main>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden ${isMarketing ? 'bg-[#13111c]' : 'bg-slate-900'}`}>
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
