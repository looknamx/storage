'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, LayoutGrid } from 'lucide-react';

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

function formatThaiDate(date: Date): string {
  const day = date.getDate();
  const month = THAI_MONTHS[date.getMonth()];
  const buddhistYear = date.getFullYear() + 543;
  return `${day} ${month} ${buddhistYear}`;
}

interface TopbarProps {
  onMenuToggle: () => void;
  isCollapsed?: boolean;
}

export default function Topbar({ onMenuToggle, isCollapsed }: TopbarProps) {
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    setCurrentDate(formatThaiDate(new Date()));
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Left: Hamburger menu (mobile & desktop toggle) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          aria-label="เปิด/ปิดเมนู"
          title={isCollapsed ? "ขยายแถบเมนูด้านซ้าย" : "ย่อแถบเมนูด้านซ้าย"}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right: Switch System (Portal) & Current date */}
      <div className="flex shrink-0 items-center gap-2.5">
        <Link
          href="/"
          title="สลับระบบงาน (Enterprise Portal)"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 transition-colors shadow-sm"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">สลับระบบ</span>
        </Link>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <span className="text-sm font-medium text-gray-600">{currentDate}</span>
        </div>
      </div>
    </header>
  );
}
