'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Truck,
  TrendingUp,
  Receipt,
  Users,
  Fuel,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

const REPORT_OPTIONS = [
  {
    id: 'transport_jobs',
    label: '1. รายงานเที่ยววิ่งขนส่งสินค้าทั้งหมด',
    desc: 'ข้อมูลเที่ยววิ่ง ทะเบียนรถ คนขับ ลูกค้า ต้นทาง-ปลายทาง รายได้และกำไร',
    icon: Truck,
  },
  {
    id: 'pl_summary',
    label: '2. รายงานสรุปผลการดำเนินงานและกำไร-ขาดทุน (P&L)',
    desc: 'สรุปรายรับรวม ภาษีหัก ณ ที่จ่าย ค่าน้ำมัน ค่าใช้จ่ายคนขับ และกำไรสุทธิ',
    icon: TrendingUp,
  },
  {
    id: 'billing_status',
    label: '3. รายงานการวางบิลและติดตามการรับชำระเงิน (AR)',
    desc: 'เลขที่ใบวางบิล ยอดเงินรวม หัก ณ ที่จ่าย สถานะรับชำระ และวันที่รับเงิน',
    icon: Receipt,
  },
  {
    id: 'customer_summary',
    label: '4. รายงานยอดขนส่งและรายได้แยกตามลูกค้า',
    desc: 'สรุปจำนวนเที่ยววิ่ง น้ำหนักรวม ยอดเงินรวม และกำไรสุทธิต่อลูกค้า',
    icon: Users,
  },
  {
    id: 'fuel_efficiency',
    label: '5. รายงานการใช้น้ำมันและระยะทางรายคัน',
    desc: 'สถิติระยะทาง ปริมาณน้ำมัน ค่าน้ำมัน และอัตราสิ้นเปลือง (กม./ลิตร)',
    icon: Fuel,
  },
  {
    id: 'subcontractor_jobs',
    label: '6. รายงานงานจ้างรถร่วม (Subcontractors)',
    desc: 'เที่ยววิ่งที่ใช้รถร่วม ค่าจ้าง ค่านายหน้า ยอดสุทธิ และสถานะการจ่ายเงิน',
    icon: Truck,
  },
  {
    id: 'driver_performance',
    label: '7. รายงานผลงานพนักงานขับรถ',
    desc: 'สถิติจำนวนเที่ยววิ่ง น้ำหนักที่ส่ง ระยะทาง และเบี้ยเลี้ยงค่าเที่ยว',
    icon: UserCheck,
  },
  {
    id: 'unpaid_invoices',
    label: '8. รายงานใบวางบิลค้างชำระเงิน (Overdue AR)',
    desc: 'รายการใบวางบิลที่ยังไม่ได้รับชำระเงิน ยอดเงินค้างรับสุทธิ',
    icon: AlertCircle,
  },
];

const THAI_MONTH_NAMES: Record<string, string> = {
  'ม.ค.': 'มกราคม (ม.ค.)',
  'ก.พ.': 'กุมภาพันธ์ (ก.พ.)',
  'มี.ค.': 'มีนาคม (มี.ค.)',
  'เม.ย.': 'เมษายน (เม.ย.)',
  'พ.ค.': 'พฤษภาคม (พ.ค.)',
  'มิ.ย.': 'มิถุนายน (มิ.ย.)',
  'ก.ค.': 'กรกฎาคม (ก.ค.)',
  'ส.ค.': 'สิงหาคม (ส.ค.)',
  'ก.ย.': 'กันยายน (ก.ย.)',
  'ต.ค.': 'ตุลาคม (ต.ค.)',
  'พ.ย.': 'พฤศจิกายน (พ.ย.)',
  'ธ.ค.': 'ธันวาคม (ธ.ค.)',
};

export default function MarketingReportsPage() {
  const [selectedReport, setSelectedReport] = useState('transport_jobs');
  const [period, setPeriod] = useState<string>('month'); // '7days', 'month', 'year', 'custom', 'all'
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [availableMonths, setAvailableMonths] = useState<{ month: string; year: number; count: number }[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const [reportResult, setReportResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Sorting
  const [sortCol, setSortCol] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('type', selectedReport);
      params.append('period', period);
      if (period === 'month') {
        if (selectedMonth) params.append('month', selectedMonth);
        if (selectedYear) params.append('year', selectedYear);
      } else if (period === 'year') {
        if (selectedYear) params.append('year', selectedYear);
      } else if (period === 'custom') {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }

      const res = await fetch(`/api/marketing/reports?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setReportResult(json);

        if (json.availableMonths && json.availableMonths.length > 0) {
          setAvailableMonths(json.availableMonths);
          if (!selectedMonth && json.activeMonth) setSelectedMonth(json.activeMonth);
        }
        if (json.availableYears && json.availableYears.length > 0) {
          setAvailableYears(json.availableYears);
          if (!selectedYear && json.activeYear) setSelectedYear(String(json.activeYear));
        }
      }
    } catch (err) {
      console.error('Failed to load marketing report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedReport, period, selectedMonth, selectedYear, startDate, endDate]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortOrder('desc');
    }
  };

  const renderSortIndicator = (col: string) => {
    if (sortCol !== col) {
      return <ArrowUpDown className="w-3 h-3 text-gray-300 ml-1 inline-block" />;
    }
    return sortOrder === 'desc' ? (
      <ArrowDown className="w-3.5 h-3.5 text-purple-600 ml-1 inline-block font-bold" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 text-purple-600 ml-1 inline-block font-bold" />
    );
  };

  // Filtered and Sorted Rows
  const rows = useMemo(() => {
    if (!reportResult?.data || !Array.isArray(reportResult.data)) return [];

    let data = [...reportResult.data];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((row) =>
        Object.values(row).some((val) =>
          String(val || '').toLowerCase().includes(q)
        )
      );
    }

    if (sortCol) {
      data.sort((a, b) => {
        const valA = a[sortCol] ?? '';
        const valB = b[sortCol] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return sortOrder === 'asc'
          ? String(valA).localeCompare(String(valB), 'th')
          : String(valB).localeCompare(String(valA), 'th');
      });
    }

    return data;
  }, [reportResult, search, sortCol, sortOrder]);

  const exportToExcel = () => {
    if (!rows || rows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงาน');

    const currentTitle = REPORT_OPTIONS.find((r) => r.id === selectedReport)?.label || selectedReport;
    const fileName = `${currentTitle}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToCSV = () => {
    if (!rows || rows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const currentTitle = REPORT_OPTIONS.find((r) => r.id === selectedReport)?.label || selectedReport;
    link.setAttribute('download', `${currentTitle}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthOptions = useMemo(() => {
    if (availableMonths.length > 0) {
      const unique = Array.from(new Set(availableMonths.map((m) => m.month))).filter(Boolean);
      return unique;
    }
    return ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  }, [availableMonths]);

  const yearOptions = useMemo(() => {
    if (availableYears.length > 0) return availableYears;
    return [2569, 2568, 2567];
  }, [availableYears]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            ศูนย์รายงานและส่งออกข้อมูล (Reports)
          </h1>
          <p className="text-xs text-gray-500">
            รายงานสรุปผลการดำเนินงานขนส่ง กำไร-ขาดทุน การวางบิล การใช้น้ำมัน และส่งออก Excel / CSV
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={!rows.length}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            ส่งออก CSV
          </button>
          <button
            onClick={exportToExcel}
            disabled={!rows.length}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40 shadow-sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            ส่งออก Excel (.xlsx)
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 shadow-sm"
            title="พิมพ์รายงาน"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Report Type Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {REPORT_OPTIONS.map((rep) => {
          const IconComponent = rep.icon;
          return (
            <button
              key={rep.id}
              onClick={() => {
                setSelectedReport(rep.id);
                setSearch('');
                setSortCol('');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedReport === rep.id
                  ? 'border-purple-600 bg-purple-50/60 shadow-sm ring-1 ring-purple-500'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <IconComponent className={`w-4 h-4 ${selectedReport === rep.id ? 'text-purple-600' : 'text-gray-400'}`} />
                <div className="text-xs font-bold text-gray-900 line-clamp-1">{rep.label}</div>
              </div>
              <div className="text-[11px] text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                {rep.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Period Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <span className="font-semibold text-gray-700 flex items-center gap-1.5 mr-1">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span>ช่วงเวลาแสดงผล:</span>
            </span>

            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setPeriod('7days')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  period === '7days' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                7 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setPeriod('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  period === 'month' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                รายเดือน
              </button>
              <button
                type="button"
                onClick={() => setPeriod('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  period === 'year' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                รายปี
              </button>
              <button
                type="button"
                onClick={() => setPeriod('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  period === 'custom' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                กำหนดเอง
              </button>
              <button
                type="button"
                onClick={() => setPeriod('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  period === 'all' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                แสดงทั้งหมด
              </button>
            </div>

            {/* Month & Year Selectors */}
            {period === 'month' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>
                      {THAI_MONTH_NAMES[m] || `เดือน ${m}`}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={String(y)}>
                      ปี พ.ศ. {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Year Selector */}
            {period === 'year' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={String(y)}>
                    ปี พ.ศ. {y}
                  </option>
                ))}
              </select>
            )}

            {/* Custom Dates */}
            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-gray-300 bg-white text-xs"
                />
                <span className="text-gray-400">ถึง</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-gray-300 bg-white text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReport}
              className="p-2 text-gray-400 hover:text-purple-600 rounded-xl hover:bg-gray-100 transition"
              title="โหลดข้อมูลใหม่"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาข้อความในรายงานนี้..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="text-xs text-gray-500">
            แสดงผล <span className="font-bold text-gray-800">{rows.length}</span> รายการ
          </div>
        </div>
      </div>

      {/* Report Data Table Preview */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <span className="text-xs font-bold text-gray-800">
            {REPORT_OPTIONS.find((r) => r.id === selectedReport)?.label} ({rows.length} รายการ)
          </span>
          <span className="text-[11px] text-gray-400">
            คลิกที่หัวตารางเพื่อเรียงลำดับ (High to Low / Low to High)
          </span>
        </div>

        <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-400">กำลังประมวลผลรายงาน...</div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400">
              ไม่พบข้อมูลในช่วงเวลาที่เลือก
            </div>
          ) : (
            <table className="w-full text-left text-xs text-gray-700 border-collapse">
              <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 font-bold text-gray-600 select-none">
                <tr>
                  {Object.keys(rows[0]).map((key) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <span>{key}</span>
                        {renderSortIndicator(key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-purple-50/20 transition-colors">
                    {Object.values(row).map((val: any, j: number) => (
                      <td key={j} className="px-4 py-2.5 whitespace-nowrap text-xs">
                        {typeof val === 'number'
                          ? val.toLocaleString()
                          : val !== null && val !== undefined
                          ? String(val)
                          : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
