'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Fuel,
  Truck,
  TrendingUp,
  Award,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

const THAI_MONTH_NAMES: Record<string, string> = {
  'ม.ค.': 'มกราคม',
  'ก.พ.': 'กุมภาพันธ์',
  'มี.ค.': 'มีนาคม',
  'เม.ย.': 'เมษายน',
  'พ.ค.': 'พฤษภาคม',
  'มิ.ย.': 'มิถุนายน',
  'ก.ค.': 'กรกฎาคม',
  'ส.ค.': 'สิงหาคม',
  'ก.ย.': 'กันยายน',
  'ต.ค.': 'ตุลาคม',
  'พ.ย.': 'พฤศจิกายน',
  'ธ.ค.': 'ธันวาคม',
};

export default function MarketingFuelReportPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<{ month: string; year: number; count: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Sorting
  const [sortBy, setSortBy] = useState<string>('avgEfficiency');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const availableYears = Array.from(new Set(availableMonths.map((m) => m.year))).sort((a, b) => b - a);
  const monthsInYear = availableMonths.filter(
    (m) => selectedYear === 'all' || !selectedYear || String(m.year) === selectedYear
  );

  const fetchFuelStats = async () => {
    try {
      setLoading(true);
      let url = '/api/marketing/jobs?limit=1500';

      if (selectedYear && selectedYear !== 'all') {
        url += `&year=${encodeURIComponent(selectedYear)}`;
      }
      if (selectedMonth && selectedMonth !== 'all') {
        url += `&month=${encodeURIComponent(selectedMonth)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const jobs = json.jobs || [];

        if (json.availableMonths && json.availableMonths.length > 0) {
          setAvailableMonths(json.availableMonths);
          const years = Array.from(new Set(json.availableMonths.map((m: any) => m.year))).sort(
            (a: any, b: any) => b - a
          );
          if (!selectedYear && years.length > 0) {
            setSelectedYear(String(years[0]));
          }
          if (!selectedMonth) {
            setSelectedMonth(json.availableMonths[0].month);
          }
        }

        const vMap: Record<string, any> = {};
        for (const j of jobs) {
          const plate = j.licensePlate || 'ไม่ระบุ';
          if (!vMap[plate]) {
            vMap[plate] = {
              plate,
              driverName: j.driverName || 'ไม่ระบุ',
              trips: 0,
              totalDistance: 0,
              totalFuelLiters: 0,
              totalFuelCost: 0,
            };
          }
          vMap[plate].trips += 1;
          vMap[plate].totalDistance += j.distanceKm || 0;
          vMap[plate].totalFuelLiters += j.fuelLiters || 0;
          vMap[plate].totalFuelCost += j.fuelCost || 0;
        }

        const list = Object.values(vMap).map((v: any) => {
          const avgEfficiency = v.totalFuelLiters > 0 ? v.totalDistance / v.totalFuelLiters : 0;
          const costPerKm = v.totalDistance > 0 ? v.totalFuelCost / v.totalDistance : 0;
          return {
            ...v,
            avgEfficiency: Number(avgEfficiency.toFixed(2)),
            costPerKm: Number(costPerKm.toFixed(2)),
          };
        });

        setVehicles(list);
      }
    } catch (e) {
      console.error('Failed to load fuel stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuelStats();
  }, [selectedYear, selectedMonth]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const renderSortIndicator = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-300 ml-1 inline-block" />;
    }
    return sortOrder === 'desc' ? (
      <ArrowDown className="w-3.5 h-3.5 text-purple-600 ml-1 inline-block font-bold" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 text-purple-600 ml-1 inline-block font-bold" />
    );
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('th-TH').format(Math.round(val || 0));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(val || 0);
  };

  // Filter & Sort
  const sortedAndFiltered = useMemo(() => {
    let list = vehicles.filter(
      (v) =>
        v.plate.toLowerCase().includes(search.toLowerCase()) ||
        v.driverName.toLowerCase().includes(search.toLowerCase())
    );

    list.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB), 'th')
        : String(valB).localeCompare(String(valA), 'th');
    });

    return list;
  }, [vehicles, search, sortBy, sortOrder]);

  // Top 3 fuel-saving vehicles based on pure efficiency
  const topSavingVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => b.avgEfficiency - a.avgEfficiency).slice(0, 3);
  }, [vehicles]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            วิเคราะห์การใช้น้ำมันและอัตราสิ้นเปลือง (กม./ลิตร)
          </h1>
          <p className="text-xs text-gray-500">
            Fuel Consumption & Efficiency Leaderboard across Fleet ({vehicles.length} คัน)
          </p>
        </div>

        <button
          type="button"
          onClick={fetchFuelStats}
          title="รีเฟรชข้อมูล"
          className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-sm self-start sm:self-auto flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรช</span>
        </button>
      </div>

      {/* Top 3 Fuel Saving Trucks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {topSavingVehicles.map((v, idx) => (
          <div
            key={v.plate}
            className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-white border border-purple-200/80 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-600 text-white shadow-sm">
                <Award className="w-3.5 h-3.5" />
                <span>อันดับ {idx + 1} ประหยัดน้ำมัน</span>
              </span>
              <span className="text-xl font-black text-purple-700">
                {v.avgEfficiency}{' '}
                <span className="text-xs font-medium text-gray-500">กม./ลิตร</span>
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-bold text-gray-900">{v.plate}</h3>
              <p className="text-xs text-gray-500">{v.driverName}</p>
            </div>

            <div className="mt-3 pt-3 border-t border-purple-100 flex items-center justify-between text-xs text-gray-600">
              <span>{v.trips} เที่ยว ({formatNumber(v.totalDistance)} กม.)</span>
              <span className="font-semibold text-blue-700">฿{formatCurrency(v.totalFuelCost)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search, Sort Dropdown & Month Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาทะเบียนรถ หรือชื่อคนขับ..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs">
            <span className="text-gray-500 font-medium">เรียงตาม:</span>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_');
                setSortBy(sb);
                setSortOrder(so as 'asc' | 'desc');
              }}
              className="bg-transparent font-semibold text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="avgEfficiency_desc">อัตราสิ้นเปลือง: High to Low (ประหยัดสุด → กินน้ำมัน)</option>
              <option value="avgEfficiency_asc">อัตราสิ้นเปลือง: Low to High (กินน้ำมัน → ประหยัดสุด)</option>
              <option value="totalFuelCost_desc">ค่าน้ำมันรวม: High to Low (มาก → น้อย)</option>
              <option value="totalFuelCost_asc">ค่าน้ำมันรวม: Low to High (น้อย → มาก)</option>
              <option value="totalDistance_desc">ระยะทางรวม: High to Low (มาก → น้อย)</option>
              <option value="totalDistance_asc">ระยะทางรวม: Low to High (น้อย → มาก)</option>
              <option value="costPerKm_desc">ต้นทุนเฉลี่ย/กม.: High to Low (มาก → น้อย)</option>
              <option value="costPerKm_asc">ต้นทุนเฉลี่ย/กม.: Low to High (น้อย → มาก)</option>
              <option value="trips_desc">จำนวนเที่ยว: High to Low (มาก → น้อย)</option>
              <option value="trips_asc">จำนวนเที่ยว: Low to High (น้อย → มาก)</option>
              <option value="plate_asc">ทะเบียนรถ: A → Z (ก-ฮ)</option>
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-semibold shrink-0">ปี:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/70 text-purple-900 font-bold text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  ปี พ.ศ. {yr}
                </option>
              ))}
              <option value="all">ทุกปี (ทั้งหมด)</option>
            </select>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-semibold shrink-0">เดือน:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/70 text-purple-900 font-bold text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              {monthsInYear.map((item) => (
                <option key={`${item.month}-${item.year}`} value={item.month}>
                  เดือน {THAI_MONTH_NAMES[item.month] || item.month} ({item.count} งาน)
                </option>
              ))}
              <option value="all">ทุกเดือน (รวมทั้งปี)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fuel Leaderboard Table */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider select-none">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th
                  onClick={() => handleSort('plate')}
                  className="py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <span>ทะเบียนรถ & คนขับ</span>
                    {renderSortIndicator('plate')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('trips')}
                  className="py-3 px-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-center">
                    <span>จำนวนเที่ยว</span>
                    {renderSortIndicator('trips')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalDistance')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-end">
                    <span>ระยะทางรวม</span>
                    {renderSortIndicator('totalDistance')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalFuelLiters')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-end">
                    <span>เติมน้ำมันรวม</span>
                    {renderSortIndicator('totalFuelLiters')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avgEfficiency')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-end">
                    <span>อัตราสิ้นเปลือง</span>
                    {renderSortIndicator('avgEfficiency')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalFuelCost')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-end">
                    <span>ค่าน้ำมันรวม</span>
                    {renderSortIndicator('totalFuelCost')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('costPerKm')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-end">
                    <span>ต้นทุนเฉลี่ย/กม.</span>
                    {renderSortIndicator('costPerKm')}
                  </div>
                </th>
                <th className="py-3 px-4 text-center">ดูงานวิ่ง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedAndFiltered.length > 0 ? (
                sortedAndFiltered.map((v, i) => {
                  const isTopTier = v.avgEfficiency >= 3.5;
                  const isWarning = v.avgEfficiency > 0 && v.avgEfficiency < 3.0;

                  return (
                    <tr key={v.plate} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                        {i + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{v.plate}</div>
                        <div className="text-[11px] text-gray-500">{v.driverName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium">
                        {v.trips} เที่ยว
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-gray-800">
                        {formatNumber(v.totalDistance)} กม.
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-gray-800">
                        {formatNumber(v.totalFuelLiters)} ลิตร
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full ${
                            isTopTier
                              ? 'bg-emerald-100 text-emerald-800'
                              : isWarning
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {v.avgEfficiency} กม./ลิตร
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-blue-700">
                        ฿{formatCurrency(v.totalFuelCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-600">
                        ฿{v.costPerKm} / กม.
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          href={`/marketing/jobs?search=${encodeURIComponent(v.plate)}`}
                          className="font-semibold text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
                        >
                          <span>ดูงาน</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูล'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
