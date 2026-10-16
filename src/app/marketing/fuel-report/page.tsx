'use client';

import React, { useState, useEffect } from 'react';
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
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('');

  const fetchFuelStats = async () => {
    try {
      setLoading(true);
      let url = '/api/marketing/jobs?limit=1500';

      if (selectedMonthYear && selectedMonthYear !== 'all') {
        const [m, y] = selectedMonthYear.split('|');
        if (m) url += `&month=${encodeURIComponent(m)}`;
        if (y) url += `&year=${encodeURIComponent(y)}`;
      } else if (selectedMonthYear === 'all') {
        url += '&month=all&year=all';
      }

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const jobs = json.jobs || [];

        if (json.availableMonths && json.availableMonths.length > 0) {
          setAvailableMonths(json.availableMonths);
          if (!selectedMonthYear) {
            setSelectedMonthYear(`${json.availableMonths[0].month}|${json.availableMonths[0].year}`);
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

        list.sort((a, b) => b.avgEfficiency - a.avgEfficiency);
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
  }, [selectedMonthYear]);

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('th-TH').format(Math.round(val || 0));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(val || 0);
  };

  const filtered = vehicles.filter(
    (v) =>
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      v.driverName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              วิเคราะห์การใช้น้ำมันและอัตราสิ้นเปลือง (กม./ลิตร)
            </h1>
            <p className="text-xs text-gray-500">
              Fuel Consumption & Efficiency Leaderboard across Fleet
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchFuelStats}
          title="รีเฟรชข้อมูล"
          className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Top 3 Fuel Saving Trucks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {vehicles.slice(0, 3).map((v, idx) => (
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

      {/* Search & Month Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาทะเบียนรถ หรือชื่อคนขับ..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500 font-semibold shrink-0">เลือกเดือน:</span>
          <select
            value={selectedMonthYear}
            onChange={(e) => setSelectedMonthYear(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50/70 text-purple-900 font-bold text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-auto"
          >
            {availableMonths.length > 0 ? (
              availableMonths.map((item) => (
                <option key={`${item.month}|${item.year}`} value={`${item.month}|${item.year}`}>
                  เดือน {THAI_MONTH_NAMES[item.month] || item.month} {item.year} ({item.count} งาน)
                </option>
              ))
            ) : (
              <option value="ก.ค.|2569">เดือน กรกฎาคม 2569</option>
            )}
            <option value="all">ดูข้อมูลทุกเดือน (ยอดรวมทั้งหมด)</option>
          </select>
        </div>
      </div>

      {/* Fuel Leaderboard Table */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">อันดับ</th>
                <th className="py-3 px-4">ทะเบียนรถ & คนขับ</th>
                <th className="py-3 px-4 text-center">จำนวนเที่ยว</th>
                <th className="py-3 px-4 text-right">ระยะทางรวม</th>
                <th className="py-3 px-4 text-right">เติมน้ำมันรวม</th>
                <th className="py-3 px-4 text-right">อัตราสิ้นเปลือง</th>
                <th className="py-3 px-4 text-right">ค่าน้ำมันรวม</th>
                <th className="py-3 px-4 text-right">ต้นทุนเฉลี่ย/กม.</th>
                <th className="py-3 px-4 text-center">ดูงานวิ่ง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((v, i) => {
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

