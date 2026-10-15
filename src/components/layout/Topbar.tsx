'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setCurrentDate(formatThaiDate(new Date()));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const q = searchQuery.trim();
    // Smart routing:
    // If query starts with RO- or looks like order -> /repair-orders
    // If looks like part -> /parts
    // Otherwise check vehicles -> /vehicles
    if (q.toUpperCase().startsWith('RO-')) {
      router.push(`/repair-orders?search=${encodeURIComponent(q)}`);
    } else if (q.toUpperCase().startsWith('REC-') || q.toUpperCase().startsWith('ISS-')) {
      router.push(`/stock-out`);
    } else {
      router.push(`/vehicles?search=${encodeURIComponent(q)}`);
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Left: Hamburger menu (mobile) */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
          aria-label="เปิดเมนู"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Center: Global Search input */}
      <form onSubmit={handleSearch} className="mx-4 flex max-w-xl flex-1">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาด่วน: ทะเบียนรถ, ยี่ห้อ, ใบงาน RO-xxxx, หรือกด Enter..."
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-8 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Right: Current date in Thai Buddhist Era */}
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <span className="text-sm font-medium text-gray-600">{currentDate}</span>
      </div>
    </header>
  );
}
