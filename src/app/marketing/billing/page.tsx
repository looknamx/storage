'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Calendar,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function MarketingBillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters
  const [period, setPeriod] = useState<string>('month'); // '7days', 'month', 'year', 'all'
  const [status, setStatus] = useState<string>('all'); // 'all', 'unpaid', 'paid'
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | string>('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Sorting
  const [sortBy, setSortBy] = useState<string>('billingDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (period) params.append('period', period);
      if (status && status !== 'all') params.append('status', status);
      if (period === 'month' && selectedMonth) params.append('month', selectedMonth);
      if ((period === 'month' || period === 'year') && selectedYear) {
        params.append('year', String(selectedYear));
      }
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      const res = await fetch(`/api/marketing/billing?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setInvoices(data);
        } else {
          setInvoices(data.invoices || []);
          setSummary(data.summary || null);
          if (data.availableMonths) setAvailableMonths(data.availableMonths);
          if (data.availableYears) setAvailableYears(data.availableYears);
          if (!selectedMonth && data.activeMonth) setSelectedMonth(data.activeMonth);
          if (!selectedYear && data.activeYear) setSelectedYear(data.activeYear);
        }
      }
    } catch (e) {
      console.error('Failed to fetch invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [period, status, selectedMonth, selectedYear, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleTogglePaid = async (invoiceNo: string, currentPaid: boolean) => {
    try {
      setUpdatingId(invoiceNo);
      const res = await fetch('/api/marketing/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNo,
          isPaid: !currentPaid,
          paymentDate: !currentPaid ? new Date().toISOString() : null,
        }),
      });

      if (res.ok) {
        fetchInvoices();
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setUpdatingId(null);
    }
  };

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', {
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const totalGrossAll = summary?.totalGross ?? invoices.reduce((acc, curr) => acc + (curr.totalGross || 0), 0);
  const totalNetAll = summary?.totalNet ?? invoices.reduce((acc, curr) => acc + (curr.totalNetRevenue || 0), 0);
  const totalWhtAll = summary?.totalWht ?? invoices.reduce((acc, curr) => acc + (curr.totalWht || 0), 0);
  const unpaidCount = summary?.unpaidInvoices ?? invoices.filter((i) => !i.isPaid).length;
  const unpaidAmount = summary?.unpaidAmount ?? invoices.filter((i) => !i.isPaid).reduce((acc, curr) => acc + (curr.totalNetRevenue || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              การวางบิลและติดตามการรับชำระเงิน
            </h1>
            <p className="text-xs text-gray-500">
              Billing & Invoicing Accounts Receivable (แสดง {invoices.length} รายการตามเงื่อนไขที่เลือก)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchInvoices}
          title="รีเฟรชข้อมูล"
          className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-sm self-start sm:self-auto flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรช</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500">ยอดวางบิลรวม (Gross AR)</span>
          <div className="text-xl font-bold text-gray-900 mt-1">
            ฿{formatCurrency(totalGrossAll)}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">รวมทั้งหมด {invoices.length} ใบวางบิล</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500">ภาษีหัก ณ ที่จ่าย 1% รวม</span>
          <div className="text-xl font-bold text-amber-600 mt-1">
            ฿{formatCurrency(totalWhtAll)}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">หักนำส่งกรมสรรพากร</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500">ยอดรับเงินสุทธิ (Net AR)</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            ฿{formatCurrency(totalNetAll)}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">ยอดเงินที่คาดหวังเข้าบัญชี</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-amber-200 bg-amber-50/20 shadow-sm">
          <span className="text-xs font-semibold text-amber-700">คงค้างรอรับชำระเงิน</span>
          <div className="text-xl font-bold text-amber-700 mt-1">
            ฿{formatCurrency(unpaidAmount)}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5">
            รอชำระ {unpaidCount} ใบ ({((unpaidCount / (invoices.length || 1)) * 100).toFixed(0)}%)
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        {/* Main Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Period selector */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>ช่วงเวลาแสดงผล:</span>
            </span>
            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setPeriod('7days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === '7days'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                7 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setPeriod('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === 'month'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                รายเดือน
              </button>
              <button
                type="button"
                onClick={() => setPeriod('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === 'year'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                รายปี
              </button>
              <button
                type="button"
                onClick={() => setPeriod('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === 'all'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                แสดงทั้งหมด
              </button>
            </div>

            {/* If period is month, show month & year selector */}
            {period === 'month' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">ทุกเดือน</option>
                  {(availableMonths.length > 0
                    ? availableMonths
                    : ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
                  ).map((m) => (
                    <option key={m} value={m}>
                      เดือน {m}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">ทุกปี</option>
                  {(availableYears.length > 0 ? availableYears : [2569, 2568, 2567]).map((y) => (
                    <option key={y} value={y}>
                      ปี พ.ศ. {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* If period is year, show year selector */}
            {period === 'year' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">ทุกปี</option>
                {(availableYears.length > 0 ? availableYears : [2569, 2568, 2567]).map((y) => (
                  <option key={y} value={y}>
                    ปี พ.ศ. {y}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-purple-600" />
              <span>สถานะ:</span>
            </span>
            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  status === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setStatus('unpaid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  status === 'unpaid'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                รอชำระ
              </button>
              <button
                type="button"
                onClick={() => setStatus('paid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  status === 'paid'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                รับชำระแล้ว
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar & Sort quick options */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเลขที่บิล หรือ ชื่อลูกค้า... (กด Enter)"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </form>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">เรียงตาม:</span>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_');
                setSortBy(sb);
                setSortOrder(so as 'asc' | 'desc');
              }}
              className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white font-medium focus:ring-2 focus:ring-purple-500"
            >
              <option value="billingDate_desc">วันที่วางบิล (ใหม่ล่าสุด)</option>
              <option value="billingDate_asc">วันที่วางบิล (เก่าที่สุด)</option>
              <option value="totalNetRevenue_desc">ยอดสุทธิ: High to Low (มาก → น้อย)</option>
              <option value="totalNetRevenue_asc">ยอดสุทธิ: Low to High (น้อย → มาก)</option>
              <option value="jobsCount_desc">จำนวนเที่ยว: High to Low (มาก → น้อย)</option>
              <option value="jobsCount_asc">จำนวนเที่ยว: Low to High (น้อย → มาก)</option>
              <option value="invoiceNo_asc">เลขที่บิล: A → Z</option>
              <option value="invoiceNo_desc">เลขที่บิล: Z → A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 font-semibold uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort('invoiceNo')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <span>เลขที่ใบวางบิล</span>
                    {renderSortIndicator('invoiceNo')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('billingDate')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <span>วันที่วางบิล</span>
                    {renderSortIndicator('billingDate')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('customerName')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <span>ลูกค้าหลัก</span>
                    {renderSortIndicator('customerName')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('jobsCount')}
                  className="py-3.5 px-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-center">
                    <span>จำนวนเที่ยว</span>
                    {renderSortIndicator('jobsCount')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalGross')}
                  className="py-3.5 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-end">
                    <span>ยอดเงินรวม</span>
                    {renderSortIndicator('totalGross')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalWht')}
                  className="py-3.5 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-end">
                    <span>หัก ณ ที่จ่าย 1%</span>
                    {renderSortIndicator('totalWht')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalNetRevenue')}
                  className="py-3.5 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-end">
                    <span>ยอดสุทธิ</span>
                    {renderSortIndicator('totalNetRevenue')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('isPaid')}
                  className="py-3.5 px-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-center">
                    <span>สถานะรับชำระ</span>
                    {renderSortIndicator('isPaid')}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <span>ติดตามเที่ยววิ่ง</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.invoiceNo} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {inv.billingDate ? formatDate(inv.billingDate) : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800 line-clamp-1">
                      {inv.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                        {inv.jobsCount} เที่ยว
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-900">
                      ฿{formatCurrency(inv.totalGross)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-500">
                      ฿{formatCurrency(inv.totalWht)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                      ฿{formatCurrency(inv.totalNetRevenue)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        disabled={updatingId === inv.invoiceNo}
                        onClick={() => handleTogglePaid(inv.invoiceNo, inv.isPaid)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-95 ${
                          inv.isPaid
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                      >
                        {inv.isPaid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>รับชำระแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>รอชำระเงิน</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/marketing/jobs?invoiceNo=${encodeURIComponent(inv.invoiceNo)}`}
                        className="px-2.5 py-1 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 inline-flex items-center gap-1.5 font-semibold text-xs transition-colors border border-purple-200/60"
                        title="ดูเฉพาะเที่ยววิ่งในบิลนี้"
                      >
                        <span>ติดตามเที่ยว ({inv.jobsCount})</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="w-6 h-6 text-gray-300" />
                      <p>{loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบรายการใบวางบิลตามเงื่อนไขที่เลือก'}</p>
                      {period !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setPeriod('all')}
                          className="text-xs text-purple-600 hover:underline font-semibold"
                        >
                          ลองคลิก "แสดงทั้งหมด"
                        </button>
                      )}
                    </div>
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
