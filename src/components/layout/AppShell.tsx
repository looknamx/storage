'use client';

import React, { useState, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import AutoBackupRunner from '@/components/AutoBackupRunner';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuToggle={handleMenuToggle} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <AutoBackupRunner />
          {children}
        </main>
      </div>
    </div>
  );
}
