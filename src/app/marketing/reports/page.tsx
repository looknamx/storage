'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Truck,
  RefreshCw,
  Printer,
  ChevronDown,
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

export default function MarketingMonthlyReportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [availableMonths, setAvailableMonths] = useState<{ month: string; year: number; count: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const availableYears = Array.from(new Set(availableMonths.map((m) => m.year))).sort((a, b) => b - a);
  const monthsInYear = availableMonths.filter(
    (m) => selectedYear === 'all' || !selectedYear || String(m.year) === selectedYear
  );

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedYear && selectedYear !== 'all') {
        params.set('year', selectedYear);
      }
      if (selectedMonth && selectedMonth !== 'all') {
        params.set('month', selectedMonth);
      }

      const res = await fetch(`/api/marketing/dashboard?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);

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
      }
    } catch (e) {
      console.error('Failed to load monthly report:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedYear, selectedMonth]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('th-TH').format(Math.round(val || 0));
  };

  const summary = data?.summary || {};

  const fuelCost = summary.totalFuelCost || 0;
  const loadingUnloading = summary.expenseLoading || 0;
  const fuelSaving = summary.expenseFuelSaving || 0;
  const extraBonus = summary.expenseExtraBonus || 0;
  const allowance = summary.expenseAllowance || 0;
  const backhaul = summary.expenseBackhaul || 0;
  const expressway = summary.expenseExpressway || 0;
  const portFee = summary.expensePort || 0;
  const detention = summary.expenseDetention || 0;
  const repair = summary.expenseRepair || 0;
  const other = summary.expenseOther || 0;
  const totalExpenses = summary.totalExpenses || 0;
  const gross = summary.totalGrossRevenue || 0;
  const wht = summary.totalWithholdingTax || 0;
  const netRev = summary.totalNetRevenue || 0;
  const netProfit = summary.totalNetProfit || 0;

  // Active label
  let activeLabel = 'ทุกปี (ยอดสะสม)';
  if (selectedYear && selectedYear !== 'all' && selectedMonth && selectedMonth !== 'all') {
    activeLabel = `งานประจำเดือน ${THAI_MONTH_NAMES[selectedMonth] || selectedMonth} ${selectedYear}`;
  } else if (selectedYear && selectedYear !== 'all' && selectedMonth === 'all') {
    activeLabel = `รายงานรวมตลอดทั้งปี พ.ศ. ${selectedYear}`;
  } else if (availableMonths.length > 0 && selectedYear !== 'all') {
    const first = availableMonths[0];
    activeLabel = `งานประจำเดือน ${THAI_MONTH_NAMES[first.month] || first.month} ${first.year}`;
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              รายงานสรุปผลการดำเนินงานและกำไร-ขาดทุน
            </h1>
            <p className="text-xs text-gray-500">
              Monthly Operational P&L Statement ({activeLabel})
            </p>
          </div>
        </div>

        {/* Year & Month Selectors & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 rounded-xl border border-purple-300 bg-purple-50/70 text-purple-900 font-bold text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
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
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-purple-300 bg-purple-50/70 text-purple-900 font-bold text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            {monthsInYear.map((item) => (
              <option key={`${item.month}-${item.year}`} value={item.month}>
                เดือน {THAI_MONTH_NAMES[item.month] || item.month} ({item.count} งาน)
              </option>
            ))}
            <option value="all">ทุกเดือน (รวมทั้งปี)</option>
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-sm"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            <span>พิมพ์รายงาน</span>
          </button>

          <button
            type="button"
            onClick={fetchReport}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 shadow-sm"
            title="รีเฟรช"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Statement Sheet */}
      <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-xl space-y-6">
        <div className="border-b border-gray-200 pb-5 text-center">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-1">
            รายงานงบการเงินและผลการดำเนินงานขนส่ง
          </span>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {activeLabel}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            สรุปเที่ยววิ่งทั้งหมด {summary.totalJobs || 0} เที่ยว | ระยะทางวิ่งรวม {formatNumber(summary.totalDistanceKm || 0)} กม.
          </p>
        </div>

        {/* 1. รายรับ (Revenue Section) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span>1. สรุปรายรับจากการขนส่ง (Revenue)</span>
          </h3>

          <div className="rounded-xl border border-gray-100 overflow-hidden text-xs">
            <div className="flex justify-between py-2.5 px-4 bg-gray-50 text-gray-700">
              <span>ยอดรายรับรวมก่อนหักภาษี (Gross Revenue)</span>
              <span className="font-bold text-gray-900 text-sm">฿{formatCurrency(gross)}</span>
            </div>
            <div className="flex justify-between py-2 px-4 border-t border-gray-100 text-gray-600">
              <span>หัก ภาษี ณ ที่จ่าย 1% (WHT)</span>
              <span className="text-rose-600">- ฿{formatCurrency(wht)}</span>
            </div>
            <div className="flex justify-between py-2.5 px-4 bg-blue-50/60 border-t border-blue-100 text-blue-900 font-bold text-sm">
              <span>ยอดรายรับสุทธิ (Net Revenue)</span>
              <span className="text-blue-700">฿{formatCurrency(netRev)}</span>
            </div>
          </div>
        </div>

        {/* 2. ค่าใช้จ่าย (Expenses Section) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-600" />
            <span>2. สรุปต้นทุนและค่าใช้จ่ายประจำเที่ยว (Expenses)</span>
          </h3>

          <div className="rounded-xl border border-gray-100 divide-y divide-gray-100 text-xs">
            <div className="flex justify-between py-2.5 px-4 bg-gray-50/60 font-semibold text-gray-800">
              <span>ค่าน้ำมันเชื้อเพลิง ({formatNumber(summary.totalFuelLiters || 0)} ลิตร @ {summary.avgFuelEfficiency || 0} กม./ลิตร)</span>
              <span className="text-blue-700 font-bold">฿{formatCurrency(fuelCost)}</span>
            </div>
            <div className="flex justify-between py-2 px-4 text-gray-600">
              <span>เบี้ยเลี้ยงพนักงานขับรถ</span>
              <span className="font-medium text-gray-800">฿{formatCurrency(allowance)}</span>
            </div>
            <div className="flex justify-between py-2 px-4 text-gray-600">
              <span>ค่าของกลับ (Backhaul Handling)</span>
              <span className="font-medium text-gray-800">฿{formatCurrency(backhaul)}</span>
            </div>
            <div className="flex justify-between py-2 px-4 text-gray-600">
              <span>เงินพิเศษเซฟน้ำมัน</span>
              <span className="font-medium text-gray-800">฿{formatCurrency(fuelSaving)}</span>
            </div>
            <div className="flex justify-between py-2 px-4 text-gray-600">
              <span>ค่าขึ้น-ลง สินค้า</span>
              <span className="font-medium text-gray-800">฿{formatCurrency(loadingUnloading)}</span>
            </div>
            <div className="flex justify-between py-2 px-4 text-gray-600">
              <span>เงินพิเศษ + เพิ่ม</span>
              <span className="font-medium text-gray-800">฿{formatCurrency(extraBonus)}</span>
            </div>
            <div className="flex justify-between py-2 px-4 text-gray-600">
              <span>ค่าผ่านทางด่วน</span>
              <span className="font-medium text-gray-800">฿{formatCurrency(expressway)}</span>
            </div>
            <div className="flex justify-between py-2 px-4 text-gray-600">
              <span>ค่าตกค้าง / รอขึ้น-ลงข้ามคืน</span>
              <span className="font-medium text-gray-800">฿{formatCurrency(detention)}</span>
            </div>
            <div className="flex justify-between py-2 px-4 text-gray-600">
              <span>ค่าท่าเทียบเรือ</span>
              <span className="font-medium text-gray-800">฿{formatCurrency(portFee)}</span>
            </div>
            <div className="flex justify-between py-2 px-4 text-gray-600">
              <span>ค่าซ่อมบำรุงฉุกเฉินระหว่างทาง</span>
              <span className="font-medium text-gray-800">฿{formatCurrency(repair)}</span>
            </div>
            <div className="flex justify-between py-2 px-4 text-gray-600">
              <span>ค่าใช้จ่ายอื่นๆ</span>
              <span className="font-medium text-gray-800">฿{formatCurrency(other)}</span>
            </div>
            <div className="flex justify-between py-2.5 px-4 bg-rose-50/70 text-rose-900 font-bold text-sm">
              <span>รวมค่าใช้จ่ายทั้งหมด (Total Expenses)</span>
              <span className="text-rose-700">฿{formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* 3. สรุปกำไรสุทธิคงเหลือ (Net Profit Final) */}
        <div
          className={`p-6 rounded-2xl ${
            netProfit >= 0
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-600/20'
              : 'bg-gradient-to-tr from-rose-600 to-red-600 shadow-rose-600/20'
          } text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4`}
        >
          <div className="space-y-1 text-center sm:text-left">
            <span
              className={`text-xs uppercase font-semibold ${
                netProfit >= 0 ? 'text-emerald-100' : 'text-rose-100'
              } tracking-wider`}
            >
              คงเหลือสุทธิประจำงวด {netProfit >= 0 ? '(Net Profit)' : '(Net Loss)'}
            </span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight">
              {netProfit < 0
                ? `-฿${formatCurrency(Math.abs(netProfit))}`
                : `฿${formatCurrency(netProfit)}`}
            </div>
          </div>

          <div className="text-center sm:text-right text-xs text-emerald-100 border-t sm:border-t-0 sm:border-l border-emerald-400/40 pt-3 sm:pt-0 sm:pl-6">
            <span className="block opacity-90">อัตรากำไรสุทธิ (Net Margin)</span>
            <span className="text-2xl font-bold text-white">
              {summary.profitMargin || 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
