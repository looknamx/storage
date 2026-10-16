'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Search,
  PlusCircle,
  Filter,
  Download,
  Trash2,
  Edit,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Receipt,
  Truck,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

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

export default function MarketingJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<{ month: string; year: number; count: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isSubcontractor, setIsSubcontractor] = useState<string>('');
  const [isPaid, setIsPaid] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [aggregations, setAggregations] = useState<any>({
    totalGross: 0,
    totalNetRevenue: 0,
    totalFuelCost: 0,
    totalExpenses: 0,
    totalNetProfit: 0,
    totalDistance: 0,
    totalFuelLiters: 0,
  });

  const availableYears = Array.from(new Set(availableMonths.map((m) => m.year))).sort((a, b) => b - a);
  const monthsInYear = availableMonths.filter(
    (m) => selectedYear === 'all' || !selectedYear || String(m.year) === selectedYear
  );

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '30',
      });
      if (search) params.set('search', search);

      if (selectedYear && selectedYear !== 'all') {
        params.set('year', selectedYear);
      }
      if (selectedMonth && selectedMonth !== 'all') {
        params.set('month', selectedMonth);
      }

      if (isSubcontractor) params.set('isSubcontractor', isSubcontractor);
      if (isPaid) params.set('isPaid', isPaid);

      const res = await fetch(`/api/marketing/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        setAggregations(data.aggregations || {});

        if (data.availableMonths && data.availableMonths.length > 0) {
          setAvailableMonths(data.availableMonths);
          const years = Array.from(new Set(data.availableMonths.map((m: any) => m.year))).sort(
            (a: any, b: any) => b - a
          );
          if (!selectedYear && years.length > 0) {
            setSelectedYear(String(years[0]));
          }
          if (!selectedMonth) {
            setSelectedMonth(data.availableMonths[0].month);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load transport jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, selectedYear, selectedMonth, isSubcontractor, isPaid]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleDelete = async (id: string, itemNo: number) => {
    if (!confirm(`คุณต้องการลบรายการงานลำดับที่ ${itemNo} ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/marketing/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchJobs();
      } else {
        alert('เกิดข้อผิดพลาดในการลบรายการ');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการลบรายการ');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', {
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              รายการเที่ยววิ่งขนส่งสินค้า
            </h1>
            <p className="text-xs text-gray-500">
              Transport Job Orders & Dispatch Operations (ทั้งหมด {totalCount} รายการ)
            </p>
          </div>
        </div>

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
            onClick={fetchJobs}
            title="รีเฟรชข้อมูล"
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาด่วน: ทะเบียนรถ, ชื่อคนขับ, ลูกค้า, ใบชั่ง, ปลายทาง, เลขที่บิล..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-purple-200 text-xs font-semibold text-purple-900 bg-purple-50/70 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  ปี พ.ศ. {yr}
                </option>
              ))}
              <option value="all">ทุกปี (ทั้งหมด)</option>
            </select>

            {/* Month Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-purple-200 text-xs font-semibold text-purple-900 bg-purple-50/70 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
            >
              {monthsInYear.map((item) => (
                <option key={`${item.month}-${item.year}`} value={item.month}>
                  เดือน {THAI_MONTH_NAMES[item.month] || item.month} ({item.count} งาน)
                </option>
              ))}
              <option value="all">ทุกเดือน</option>
            </select>

            <select
              value={isSubcontractor}
              onChange={(e) => {
                setIsSubcontractor(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">ประเภทรถทั้งหมด</option>
              <option value="false">รถบริษัท</option>
              <option value="true">รถร่วม</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors shadow-sm"
            >
              ค้นหา
            </button>
          </div>
        </form>

        {/* Aggregation summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs">
          <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
            <span className="text-gray-500 block">รายรับรวม (ตามฟิลเตอร์)</span>
            <span className="text-sm font-bold text-purple-700">
              ฿{formatCurrency(aggregations.totalGross)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-gray-500 block">ค่าน้ำมันรถ</span>
            <span className="text-sm font-bold text-blue-700">
              ฿{formatCurrency(aggregations.totalFuelCost)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100">
            <span className="text-gray-500 block">รวมค่าใช้จ่ายทั้งหมด</span>
            <span className="text-sm font-bold text-rose-700">
              ฿{formatCurrency(aggregations.totalExpenses)}
            </span>
          </div>
          <div
            className={`p-2.5 rounded-xl border ${
              aggregations.totalNetProfit >= 0
                ? 'bg-emerald-50/60 border-emerald-100'
                : 'bg-rose-50/60 border-rose-100'
            }`}
          >
            <span className="text-gray-500 block">
              คงเหลือสุทธิ {aggregations.totalNetProfit >= 0 ? '(กำไร)' : '(ขาดทุน)'}
            </span>
            <span
              className={`text-sm font-bold ${
                aggregations.totalNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {aggregations.totalNetProfit < 0
                ? `-฿${Math.abs(aggregations.totalNetProfit).toLocaleString('th-TH', {
                    maximumFractionDigits: 0,
                  })}`
                : `฿${Number(aggregations.totalNetProfit || 0).toLocaleString('th-TH', {
                    maximumFractionDigits: 0,
                  })}`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Transport Jobs Table */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-3 min-w-[90px]">วันรับของ</th>
                <th className="py-3 px-3 min-w-[150px]">ทะเบียน & คนขับ</th>
                <th className="py-3 px-3 min-w-[180px]">ลูกค้า & เส้นทาง</th>
                <th className="py-3 px-3 text-right min-w-[80px]">น้ำหนัก</th>
                <th className="py-3 px-3 text-right min-w-[90px]">รายรับสุทธิ</th>
                <th className="py-3 px-3 text-right min-w-[90px]">ค่าน้ำมัน</th>
                <th className="py-3 px-3 text-right min-w-[90px]">ค่าใช้จ่าย</th>
                <th className="py-3 px-3 text-right min-w-[100px]">คงเหลือสุทธิ</th>
                <th className="py-3 px-3 min-w-[110px]">ใบวางบิล</th>
                <th className="py-3 px-3 text-center w-20">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.length > 0 ? (
                jobs.map((job) => {
                  const isPositive = (job.netProfit || 0) >= 0;
                  return (
                    <tr key={job.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3 px-3 text-center text-gray-400 font-medium">
                        {job.itemNo}
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        {job.loadingDate ? formatDate(job.loadingDate) : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-900">{job.licensePlate}</div>
                        <div className="text-[11px] text-gray-500 line-clamp-1">{job.driverName}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-800 line-clamp-1">{job.customerName}</div>
                        <div className="text-[11px] text-gray-500">
                          {job.origin} ➔ {job.destination}
                        </div>
                        {job.details && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200/60 mt-0.5">
                            {job.details}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-gray-700">
                        {job.weightKg > 0 ? `${formatCurrency(job.weightKg)} กก.` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">
                        ฿{formatCurrency(job.netRevenue || job.grossAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-blue-700">
                        {job.fuelCost > 0 ? `฿${formatCurrency(job.fuelCost)}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-rose-700">
                        ฿{formatCurrency(job.totalExpenses)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            isPositive ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-rose-500" />
                          )}
                          {job.netProfit < 0
                            ? `-฿${Math.abs(job.netProfit).toLocaleString('th-TH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : `฿${Number(job.netProfit || 0).toLocaleString('th-TH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {job.invoiceNo ? (
                          <div className="text-[11px] font-medium text-gray-800">
                            {job.invoiceNo}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px]">-</span>
                        )}
                        {job.weightTicketNo && (
                          <div className="text-[10px] text-gray-400">ใบชั่ง: {job.weightTicketNo}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/marketing/jobs/${job.id}`}
                            className="p-1 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="แก้ไขข้อมูลเที่ยววิ่ง"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(job.id, job.itemNo)}
                            className="p-1 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="ลบรายการ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-400">
                    {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลเที่ยววิ่ง'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs">
          <span className="text-gray-500">
            แสดงหน้า {page} จากทั้งหมด {totalPages} หน้า (รวม {totalCount} รายการ)
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-gray-700">{page}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
