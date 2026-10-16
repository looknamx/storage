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
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function MarketingBillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const url = search
        ? `/api/marketing/billing?search=${encodeURIComponent(search)}`
        : '/api/marketing/billing';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (e) {
      console.error('Failed to fetch invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search]);

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', {
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const totalGrossAll = invoices.reduce((acc, curr) => acc + (curr.totalGross || 0), 0);
  const totalNetAll = invoices.reduce((acc, curr) => acc + (curr.totalNetRevenue || 0), 0);
  const totalWhtAll = invoices.reduce((acc, curr) => acc + (curr.totalWht || 0), 0);

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
              Billing & Invoicing Accounts Receivable (รวม {invoices.length} ใบแจ้งหนี้)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchInvoices}
          title="รีเฟรชข้อมูล"
          className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500">ยอดวางบิลรวมทั้งหมด</span>
          <div className="text-xl font-bold text-gray-900 mt-1">
            ฿{formatCurrency(totalGrossAll)}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500">ภาษีหัก ณ ที่จ่าย 1% รวม</span>
          <div className="text-xl font-bold text-amber-600 mt-1">
            ฿{formatCurrency(totalWhtAll)}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500">ยอดรับเงินสุทธิ (Net AR)</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            ฿{formatCurrency(totalNetAll)}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาเลขที่ใบวางบิล: เช่น IV.6907/007..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">เลขที่ใบวางบิล</th>
                <th className="py-3 px-4">วันที่วางบิล</th>
                <th className="py-3 px-4">ลูกค้าหลัก</th>
                <th className="py-3 px-4 text-center">จำนวนเที่ยว</th>
                <th className="py-3 px-4 text-right">ยอดเงินรวม</th>
                <th className="py-3 px-4 text-right">หัก ณ ที่จ่าย 1%</th>
                <th className="py-3 px-4 text-right">ยอดสุทธิ</th>
                <th className="py-3 px-4 text-center">สถานะรับชำระ</th>
                <th className="py-3 px-4 text-center">รายการเที่ยววิ่ง</th>
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
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
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
                        className="p-1 rounded-lg text-purple-600 hover:bg-purple-100 inline-flex items-center gap-1 font-semibold"
                        title="ดูเที่ยววิ่งในบิลนี้"
                      >
                        <span>ดูเที่ยว</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลใบวางบิล'}
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
