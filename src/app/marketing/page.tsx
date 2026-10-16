'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Fuel,
  Truck,
  PlusCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Building2,
  MapPin,
  ClipboardList,
  Receipt,
  Percent,
} from 'lucide-react';
import ThaiDatePicker from '@/components/ui/ThaiDatePicker';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function MarketingDashboardPage() {
  const [range, setRange] = useState<string>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      let url = `/api/marketing/dashboard?range=${range}`;
      if (range === 'custom' && customStart && customEnd) {
        url += `&start=${customStart}&end=${customEnd}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load marketing dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [range]);

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      fetchDashboardData();
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('th-TH').format(Math.round(val || 0));
  };

  const summary = data?.summary || {
    totalJobs: 0,
    totalGrossRevenue: 0,
    totalWithholdingTax: 0,
    totalNetRevenue: 0,
    totalDistanceKm: 0,
    totalFuelLiters: 0,
    totalFuelCost: 0,
    avgFuelEfficiency: 0,
    totalExpenses: 0,
    totalNetProfit: 0,
    profitMargin: 0,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                ภาพรวมแผนงานการตลาด & การเดินรถ
              </h1>
              <p className="text-xs text-gray-500">
                Marketing & Transport Logistics Operations Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/marketing/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-purple-600/20 hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>บันทึกเที่ยววิ่งใหม่</span>
          </Link>

          <button
            type="button"
            onClick={fetchDashboardData}
            title="รีเฟรชข้อมูล"
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: '1month', label: '1 เดือนล่าสุด' },
            { id: 'custom', label: 'กำหนดช่วงเวลา' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setRange(item.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                range === item.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            <ThaiDatePicker
              value={customStart}
              onChange={(val) => setCustomStart(val)}
              placeholder="จากวันที่"
            />
            <span className="text-gray-400 text-xs">ถึง</span>
            <ThaiDatePicker
              value={customEnd}
              onChange={(val) => setCustomEnd(val)}
              placeholder="ถึงวันที่"
            />
            <button
              onClick={handleCustomApply}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              ค้นหา
            </button>
          </div>
        )}

        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-purple-600" />
          <span>ข้อมูลประจำงวด: กรกฎาคม 2569</span>
        </div>
      </div>

      {/* 4 Main Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: รายรับรวม */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">ยอดรายรับรวม (Gross)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {formatCurrency(summary.totalGrossRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span>สุทธิหลังหัก 1%:</span>
              <span className="font-semibold text-gray-700">{formatCurrency(summary.totalNetRevenue)}</span>
            </p>
          </div>
        </div>

        {/* Card 2: กำไรสุทธิคงเหลือ */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">กำไรสุทธิต่องาน (Net Profit)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 tracking-tight">
              {formatCurrency(summary.totalNetProfit)}
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span>อัตรากำไร (Margin):</span>
              <span className="font-semibold text-emerald-600 inline-flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                {summary.profitMargin}%
              </span>
            </p>
          </div>
        </div>

        {/* Card 3: ต้นทุนค่าใช้จ่ายรวม */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">ต้นทุนค่าใช้จ่ายรวม</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600 tracking-tight">
              {formatCurrency(summary.totalExpenses)}
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span>ค่าน้ำมันรถ:</span>
              <span className="font-semibold text-gray-700">{formatCurrency(summary.totalFuelCost)}</span>
            </p>
          </div>
        </div>

        {/* Card 4: จำนวนเที่ยววิ่งและระยะทาง */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">จำนวนเที่ยววิ่งทั้งหมด</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {formatNumber(summary.totalJobs)}{' '}
              <span className="text-sm font-normal text-gray-500">เที่ยว</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <span>วิ่งรวม: {formatNumber(summary.totalDistanceKm)} กม.</span>
              <span>•</span>
              <span className="text-purple-600 font-semibold">{summary.avgFuelEfficiency} กม./ลิตร</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Chart Section: Revenue vs Expenses vs Profit */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              แนวโน้มรายรับ รายจ่าย และกำไรสุทธิรายวัน
            </h2>
            <p className="text-xs text-gray-500">
              Daily Revenue, Expenses & Net Profit Trend
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-blue-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> รายรับ (Gross)
            </span>
            <span className="flex items-center gap-1.5 text-rose-500 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> ค่าใช้จ่าย
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> กำไรสุทธิ
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          {data?.chartData && data.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return `${parts[2]}/${parts[1]}`;
                  }}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  labelFormatter={(label) => `วันที่ ${label}`}
                  contentStyle={{
                    borderRadius: '12px',
                    borderColor: '#e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="รายรับ" />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="ค่าใช้จ่าย" />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="#10b981"
                  fillOpacity={0.15}
                  name="กำไรสุทธิ"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">
              {loading ? 'กำลังโหลดข้อมูลกราฟ...' : 'ไม่มีข้อมูลในช่วงเวลาที่เลือก'}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Top Customers & Top Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-gray-900">
                ลูกค้ายอดนิยมที่สร้างรายได้สูงสุด (Top Customers)
              </h3>
            </div>
            <Link
              href="/marketing/customers"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <span>ดูทั้งหมด</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {data?.topCustomers && data.topCustomers.length > 0 ? (
              data.topCustomers.map((cust: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 line-clamp-1">{cust.name}</p>
                      <p className="text-xs text-gray-400">{cust.count} เที่ยววิ่ง</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(cust.revenue)}</p>
                    <p className="text-xs text-emerald-600 font-medium">กำไร {formatCurrency(cust.profit)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-xs text-gray-400">ไม่พบข้อมูลลูกค้า</p>
            )}
          </div>
        </div>

        {/* Top Routes */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900">
                เส้นทางขนส่งยอดนิยม (Top Routes)
              </h3>
            </div>
            <Link
              href="/marketing/jobs"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>ดูเที่ยววิ่ง</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {data?.topRoutes && data.topRoutes.length > 0 ? (
              data.topRoutes.map((route: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{route.route}</p>
                      <p className="text-xs text-gray-400">{route.count} เที่ยววิ่ง</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(route.revenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-xs text-gray-400">ไม่พบข้อมูลเส้นทาง</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
