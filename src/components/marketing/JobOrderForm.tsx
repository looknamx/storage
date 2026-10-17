'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  ArrowLeft,
  Truck,
  User,
  Building2,
  Calendar,
  Fuel,
  Receipt,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Calculator,
} from 'lucide-react';
import ThaiDatePicker from '@/components/ui/ThaiDatePicker';

interface JobOrderFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function JobOrderForm({ initialData, isEdit = false }: JobOrderFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [companyVehicles, setCompanyVehicles] = useState<any[]>([]);

  // Form states
  const [loadingDate, setLoadingDate] = useState<string>(
    initialData?.loadingDate ? initialData.loadingDate.split('T')[0] : ''
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    initialData?.deliveryDate ? initialData.deliveryDate.split('T')[0] : ''
  );
  const [billingDate, setBillingDate] = useState<string>(
    initialData?.billingDate ? initialData.billingDate.split('T')[0] : ''
  );
  const [invoiceNo, setInvoiceNo] = useState<string>(initialData?.invoiceNo || '');
  const [jobOrderNo, setJobOrderNo] = useState<string>(initialData?.jobOrderNo || '');
  const [isApproved, setIsApproved] = useState<boolean>(Boolean(initialData?.isApproved));
  const [isPaid, setIsPaid] = useState<boolean>(Boolean(initialData?.isPaid));
  const [paymentDate, setPaymentDate] = useState<string>(
    initialData?.paymentDate ? initialData.paymentDate.split('T')[0] : ''
  );
  const [paymentMethods, setPaymentMethods] = useState<string[]>(() => {
    const raw = String(initialData?.paymentMethod || '').trim();
    const arr: string[] = [];
    if (raw.includes('เงินสด') && !raw.includes('เช็คเงินสด')) arr.push('เงินสด');
    if (raw.includes('เงินโอน')) arr.push('เงินโอน');
    if (raw.includes('เช็ค')) arr.push('เช็คเงินสด');
    if (raw && arr.length === 0) arr.push(raw);
    return arr;
  });
  const [paymentNote, setPaymentNote] = useState<string>(initialData?.paymentNote || '');

  // Vehicle & driver
  const [isSubcontractor, setIsSubcontractor] = useState<boolean>(Boolean(initialData?.isSubcontractor));
  const [licensePlate, setLicensePlate] = useState<string>(initialData?.licensePlate || '');
  const [driverName, setDriverName] = useState<string>(initialData?.driverName || '');
  const [vehicleType, setVehicleType] = useState<string>(initialData?.vehicleType || 'รถพ่วง/เทรลเลอร์');

  // Customer & Route
  const [customerName, setCustomerName] = useState<string>(initialData?.customerName || '');
  const [origin, setOrigin] = useState<string>(initialData?.origin || '');
  const [destination, setDestination] = useState<string>(initialData?.destination || '');
  const [weightTicketNo, setWeightTicketNo] = useState<string>(initialData?.weightTicketNo || '');
  const [details, setDetails] = useState<string>(initialData?.details || '');

  // Revenue & pricing
  const [weightKg, setWeightKg] = useState<number>(initialData?.weightKg || 0);
  const [rateType, setRateType] = useState<string>(initialData?.rateType || 'per_ton');
  const [ratePerTon, setRatePerTon] = useState<number>(initialData?.ratePerTon || 0);
  const [grossAmount, setGrossAmount] = useState<number>(initialData?.grossAmount || 0);
  const [isTaxExempt, setIsTaxExempt] = useState<boolean>(
    initialData ? initialData.withholdingTax === 0 : false
  );
  const [withholdingTax, setWithholdingTax] = useState<number>(initialData?.withholdingTax || 0);
  const [netRevenue, setNetRevenue] = useState<number>(initialData?.netRevenue || 0);

  // Odometer & Fuel
  const [odometerStart, setOdometerStart] = useState<number>(initialData?.odometerStart || 0);
  const [odometerEnd, setOdometerEnd] = useState<number>(initialData?.odometerEnd || 0);
  const [distanceKm, setDistanceKm] = useState<number>(initialData?.distanceKm || 0);
  const [fuelLiters, setFuelLiters] = useState<number>(initialData?.fuelLiters || 0);
  const [fuelEfficiency, setFuelEfficiency] = useState<number>(initialData?.fuelEfficiency || 0);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState<number>(initialData?.fuelPricePerLiter || 34.94);
  const [fuelCost, setFuelCost] = useState<number>(initialData?.fuelCost || 0);

  // Expenses
  const [expenseLoadingUnloading, setExpenseLoadingUnloading] = useState<number>(initialData?.expenseLoadingUnloading || 0);
  const [expenseFuelSavingBonus, setExpenseFuelSavingBonus] = useState<number>(initialData?.expenseFuelSavingBonus || 0);
  const [expenseExtraBonus, setExpenseExtraBonus] = useState<number>(initialData?.expenseExtraBonus || 0);
  const [expenseAllowance, setExpenseAllowance] = useState<number>(initialData?.expenseAllowance || 0);
  const [expenseBackhaul, setExpenseBackhaul] = useState<number>(initialData?.expenseBackhaul || 0);
  const [expenseExpressway, setExpenseExpressway] = useState<number>(initialData?.expenseExpressway || 0);
  const [expensePort, setExpensePort] = useState<number>(initialData?.expensePort || 0);
  const [expenseDetention, setExpenseDetention] = useState<number>(initialData?.expenseDetention || 0);
  const [expenseRepair, setExpenseRepair] = useState<number>(initialData?.expenseRepair || 0);
  const [expenseOther, setExpenseOther] = useState<number>(initialData?.expenseOther || 0);
  const [totalExpenses, setTotalExpenses] = useState<number>(initialData?.totalExpenses || 0);
  const [netProfit, setNetProfit] = useState<number>(initialData?.netProfit || 0);
  const [notes, setNotes] = useState<string>(initialData?.notes || '');

  // Fetch helper lists (customers and vehicles)
  useEffect(() => {
    fetch('/api/marketing/customers')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCustomers(data))
      .catch(() => {});

    fetch('/api/vehicles')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCompanyVehicles(Array.isArray(data) ? data : data.vehicles || []))
      .catch(() => {});
  }, []);

  // Find linked company vehicle from Program A
  const matchedCompanyVehicle = React.useMemo(() => {
    if (!licensePlate || isSubcontractor || companyVehicles.length === 0) return null;
    const clean = licensePlate.trim().toLowerCase();
    // 1. Exact match
    const exact = companyVehicles.find(
      (v) => v.licensePlate?.trim().toLowerCase() === clean
    );
    if (exact) return exact;
    // 2. Digits match (e.g. "71-1726" from "นม.71-1726 , 71-1036")
    const m = clean.match(/\d{1,2}-\d{3,4}/);
    if (m) {
      const digits = m[0];
      const matchDigits = companyVehicles.find((v) =>
        v.licensePlate?.includes(digits)
      );
      if (matchDigits) return matchDigits;
    }
    return null;
  }, [licensePlate, isSubcontractor, companyVehicles]);

  const handleSelectCompanyVehicle = (v: any) => {
    setLicensePlate(v.licensePlate);
    if (v.responsiblePerson) {
      setDriverName(v.responsiblePerson);
    }
    if (v.type) {
      setVehicleType(v.type);
    }
    if (v.currentMileage && (!odometerStart || odometerStart === 0)) {
      setOdometerStart(v.currentMileage);
    }
  };

  // 1. Auto-calc Distance & Fuel
  useEffect(() => {
    let dist = distanceKm;
    if (odometerEnd > odometerStart && odometerStart > 0) {
      dist = odometerEnd - odometerStart;
      setDistanceKm(dist);
    }
    if (fuelLiters > 0 && dist > 0) {
      setFuelEfficiency(Number((dist / fuelLiters).toFixed(2)));
    }
    if (fuelLiters > 0 && fuelPricePerLiter > 0) {
      setFuelCost(Number((fuelLiters * fuelPricePerLiter).toFixed(2)));
    }
  }, [odometerStart, odometerEnd, fuelLiters, fuelPricePerLiter]);

  // 2. Auto-calc Gross Revenue & WHT
  useEffect(() => {
    let gross = grossAmount;
    if (rateType === 'per_ton' && weightKg > 0 && ratePerTon > 0) {
      gross = Number((weightKg * ratePerTon).toFixed(2));
      setGrossAmount(gross);
    }
    const wht = isTaxExempt ? 0 : Number((gross * 0.01).toFixed(2));
    setWithholdingTax(wht);
    setNetRevenue(Number((gross - wht).toFixed(2)));
  }, [weightKg, ratePerTon, rateType, isTaxExempt]);

  // 3. Auto-calc Total Expenses & Net Profit
  useEffect(() => {
    const totalExp = Number(
      (
        fuelCost +
        expenseLoadingUnloading +
        expenseFuelSavingBonus +
        expenseExtraBonus +
        expenseAllowance +
        expenseBackhaul +
        expenseExpressway +
        expensePort +
        expenseDetention +
        expenseRepair +
        expenseOther
      ).toFixed(2)
    );
    setTotalExpenses(totalExp);
    setNetProfit(Number((netRevenue - totalExp).toFixed(2)));
  }, [
    fuelCost,
    expenseLoadingUnloading,
    expenseFuelSavingBonus,
    expenseExtraBonus,
    expenseAllowance,
    expenseBackhaul,
    expenseExpressway,
    expensePort,
    expenseDetention,
    expenseRepair,
    expenseOther,
    netRevenue,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate.trim()) {
      alert('กรุณากรอกทะเบียนรถ');
      return;
    }
    if (!customerName.trim()) {
      alert('กรุณากรอกหรือเลือกลูกค้า');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        loadingDate: loadingDate || null,
        deliveryDate: deliveryDate || null,
        billingDate: billingDate || null,
        invoiceNo: invoiceNo || null,
        jobOrderNo: jobOrderNo || null,
        vehicleId: matchedCompanyVehicle?.id || initialData?.vehicleId || null,
        isApproved,
        isPaid,
        paymentDate: isPaid && paymentDate ? new Date(paymentDate) : null,
        paymentMethod: isPaid ? (paymentMethods.length > 0 ? paymentMethods.join(', ') : null) : null,
        paymentNote: isPaid ? (paymentNote.trim() || null) : null,
        isSubcontractor,
        vehicleType,
        licensePlate: licensePlate.trim(),
        driverName: driverName.trim(),
        customerName: customerName.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        weightTicketNo: weightTicketNo.trim() || null,
        details: details.trim() || null,
        weightKg,
        rateType,
        ratePerTon,
        grossAmount,
        withholdingTax,
        netRevenue,
        odometerStart,
        odometerEnd,
        distanceKm,
        fuelLiters,
        fuelEfficiency,
        fuelPricePerLiter,
        fuelCost,
        expenseLoadingUnloading,
        expenseFuelSavingBonus,
        expenseExtraBonus,
        expenseAllowance,
        expenseBackhaul,
        expenseExpressway,
        expensePort,
        expenseDetention,
        expenseRepair,
        expenseOther,
        totalExpenses,
        netProfit,
        notes: notes.trim() || null,
      };

      const url = isEdit
        ? `/api/marketing/jobs/${initialData.id}`
        : '/api/marketing/jobs';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      router.push('/marketing/jobs');
      router.refresh();
    } catch (err: any) {
      alert(`บันทึกไม่สำเร็จ: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isEdit ? `แก้ไขเที่ยววิ่ง #${initialData?.itemNo || ''}` : 'บันทึกเที่ยววิ่งขนส่งใหม่'}
            </h1>
            <p className="text-xs text-gray-500">
              กรอกข้อมูลงานขนส่ง ระบบจะทำการคำนวณระยะทาง ค่าน้ำมัน และกำไรสุทธิให้อัตโนมัติ
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-purple-600/30 hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
        </button>
      </div>

      {/* Real-Time Profitability Live Preview Banner */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all shadow-sm ${
          netProfit >= 0
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-rose-50/80 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              netProfit >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">
              สรุปผลคำนวณกำไรสุทธิคงเหลือ (Net Profit Live)
            </span>
            <div className="text-2xl font-black tracking-tight">
              {netProfit < 0
                ? `-฿${new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(netProfit))}`
                : `฿${new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(netProfit)}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="opacity-70 block">รายรับสุทธิ</span>
            <span className="font-bold text-sm">
              ฿{new Intl.NumberFormat('th-TH').format(netRevenue)}
            </span>
          </div>
          <span className="opacity-40 text-lg">-</span>
          <div>
            <span className="opacity-70 block">รวมค่าใช้จ่าย</span>
            <span className="font-bold text-sm text-rose-700">
              ฿{new Intl.NumberFormat('th-TH').format(totalExpenses)}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: ข้อมูลงาน & วันที่ */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-600" />
          <span>ข้อมูลวันที่ & การวางบิล</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              วันที่รับสินค้า / วันขึ้นของ
            </label>
            <ThaiDatePicker
              value={loadingDate}
              onChange={(val) => setLoadingDate(val)}
              placeholder="เลือกวันที่"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              วันลงสินค้า
            </label>
            <ThaiDatePicker
              value={deliveryDate}
              onChange={(val) => setDeliveryDate(val)}
              placeholder="เลือกวันที่"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              เลขที่ใบวางบิล (Invoice No.)
            </label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="เช่น IV.6907/007"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              วันที่วางบิล
            </label>
            <ThaiDatePicker
              value={billingDate}
              onChange={(val) => setBillingDate(val)}
              placeholder="เลือกวันที่วางบิล"
            />
          </div>
        </div>

        {/* Payment Status & Details */}
        <div className="pt-3 border-t border-gray-100 space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsPaid(checked);
                  if (checked && !paymentDate) {
                    setPaymentDate(new Date().toISOString().split('T')[0]);
                  }
                }}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-800">
                รับชำระเงินแล้ว (Paid)
              </span>
            </label>

            {isPaid && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">วันที่รับชำระ:</span>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
            )}
          </div>

          {isPaid && (
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-gray-700">วิธีการรับชำระ:</span>
                {[
                  { id: 'เงินสด', label: 'เงินสด' },
                  { id: 'เงินโอน', label: 'เงินโอน' },
                  { id: 'เช็คเงินสด', label: 'เช็คเงินสด' },
                ].map((item) => {
                  const isChecked = paymentMethods.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-purple-100/80 border-purple-500 text-purple-900 font-bold ring-1 ring-purple-500/20'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setPaymentMethods((prev) =>
                            prev.includes(item.id) ? prev.filter((m) => m !== item.id) : [...prev, item.id]
                          );
                        }}
                        className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  บันทึกเพิ่มเติมเกี่ยวกับการจ่ายเงิน (Note)
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="ระบุข้อมูลเพิ่มเติม เช่น โอนเข้า บช. กสิกรไทย, เช็คเลขที่..., วันที่นัดเคลียร์ ฯลฯ"
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-purple-500 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: ข้อมูลรถ & พนักงานขับรถ */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-4 h-4 text-purple-600" />
          <span>ข้อมูลรถและพนักงานขับรถ</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                ทะเบียนรถ (หัว - หาง) *
              </label>
              {!isSubcontractor && companyVehicles.length > 0 && (
                <span className="text-[10px] text-purple-600 font-medium">
                  {companyVehicles.length} คันในระบบ
                </span>
              )}
            </div>

            {/* Quick dropdown for company vehicles from Program A */}
            {!isSubcontractor && companyVehicles.length > 0 && (
              <div className="mb-2">
                <select
                  value={matchedCompanyVehicle?.id || ''}
                  onChange={(e) => {
                    const sel = companyVehicles.find((v) => v.id === e.target.value);
                    if (sel) handleSelectCompanyVehicle(sel);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-purple-50/70 border border-purple-200 text-purple-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium cursor-pointer"
                >
                  <option value="">⚡ เลือกรถบริษัทจากโปรแกรม A ({companyVehicles.length} คัน)...</option>
                  {companyVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.code ? `[${v.code}] ` : ''}{v.licensePlate} {v.responsiblePerson ? `• ${v.responsiblePerson}` : ''} {v.currentMileage ? `(${v.currentMileage.toLocaleString()} กม.)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <input
              type="text"
              required
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              list="company-vehicles-datalist"
              placeholder="เช่น นม.71-1726 , 71-1036"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
            <datalist id="company-vehicles-datalist">
              {companyVehicles.map((v) => (
                <option key={v.id} value={v.licensePlate}>
                  {v.code ? `${v.code} - ` : ''}{v.licensePlate} {v.responsiblePerson ? `(${v.responsiblePerson})` : ''}
                </option>
              ))}
            </datalist>

            {/* Program A Linked Vehicle Badge */}
            {matchedCompanyVehicle && (
              <div className="mt-2 p-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-purple-600 text-white rounded text-[10px] font-bold">
                      {matchedCompanyVehicle.code || 'รถบริษัท'}
                    </span>
                    <span className="font-semibold text-purple-950">
                      {matchedCompanyVehicle.licensePlate}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-purple-700">
                    ไมล์โปรแกรม A: {matchedCompanyVehicle.currentMileage ? matchedCompanyVehicle.currentMileage.toLocaleString() : 0} กม.
                  </span>
                </div>
                <div className="text-[10px] text-purple-700 flex items-center justify-between">
                  <span>
                    คนขับ: {matchedCompanyVehicle.responsiblePerson || 'ไม่ระบุ'}
                  </span>
                  {odometerStart === 0 && matchedCompanyVehicle.currentMileage > 0 && (
                    <button
                      type="button"
                      onClick={() => setOdometerStart(matchedCompanyVehicle.currentMileage)}
                      className="text-purple-800 underline font-semibold hover:text-purple-950"
                    >
                      กดเพื่อใช้ไมล์นี้
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ชื่อ-สกุล พนักงานขับรถ
            </label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="เช่น นายสุชานนท์ เจริญสุข"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ประเภทรถ
            </label>
            <div className="flex items-center gap-4 pt-1.5">
              <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="truckType"
                  checked={!isSubcontractor}
                  onChange={() => setIsSubcontractor(false)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>รถบริษัท</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="truckType"
                  checked={isSubcontractor}
                  onChange={() => setIsSubcontractor(true)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>รถร่วม</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: ลูกค้า สินค้า และเส้นทาง */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-purple-600" />
          <span>ลูกค้า สินค้า และเส้นทางขนส่ง</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ชื่อลูกค้า *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="เช่น บริษัท น้ำตาลครบุรี จำกัด (มหาชน)"
              list="customerList"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <datalist id="customerList">
              {customers.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ต้นทาง
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="เช่น ครบุรี, บางปู"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ปลายทาง
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="เช่น อ่าวไทย, ปลาวาฬ"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              เลขที่ใบชั่ง
            </label>
            <input
              type="text"
              value={weightTicketNo}
              onChange={(e) => setWeightTicketNo(e.target.value)}
              placeholder="เช่น 870687"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              รายละเอียดเพิ่มเติม / หมายเหตุงาน
            </label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="เช่น อนุโลมจ่ายพิเศษ, มีของกลับ, สั่งรอใส่"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Section 4: รายรับ & ราคาขนส่ง */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-purple-600" />
          <span>รายรับและการคิดเงิน</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              น้ำหนักสินค้า (กก.)
            </label>
            <input
              type="number"
              step="any"
              value={weightKg || ''}
              onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
              placeholder="33000"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              รูปแบบราคา
            </label>
            <select
              value={rateType}
              onChange={(e) => setRateType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="per_ton">คิดตามน้ำหนัก (ราคา/ตัน/กก.)</option>
              <option value="lump_sum">ราคาเหมา</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {rateType === 'per_ton' ? 'ราคาต่อ กก./ตัน' : 'ราคาเหมา (บาท)'}
            </label>
            <input
              type="number"
              step="any"
              value={ratePerTon || ''}
              onChange={(e) => setRatePerTon(parseFloat(e.target.value) || 0)}
              placeholder={rateType === 'per_ton' ? '0.43' : '9000'}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              จำนวนเงินรวม (Gross)
            </label>
            <input
              type="number"
              step="any"
              value={grossAmount || ''}
              onChange={(e) => setGrossAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700">หัก ณ ที่จ่าย 1%</label>
              <label className="inline-flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTaxExempt}
                  onChange={(e) => setIsTaxExempt(e.target.checked)}
                />
                <span>ไม่หัก 1%</span>
              </label>
            </div>
            <input
              type="number"
              step="any"
              value={withholdingTax || ''}
              onChange={(e) => setWithholdingTax(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Section 5: ระยะทาง & การเติมน้ำมัน */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Fuel className="w-4 h-4 text-purple-600" />
          <span>เลขไมล์และค่าน้ำมันรถ</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                เลขไมล์ก่อนไป
              </label>
              {matchedCompanyVehicle && matchedCompanyVehicle.currentMileage > 0 && (
                <button
                  type="button"
                  onClick={() => setOdometerStart(matchedCompanyVehicle.currentMileage)}
                  className="text-[10px] text-purple-600 hover:text-purple-800 font-semibold underline"
                >
                  ใช้ไมล์ล่าสุด ({matchedCompanyVehicle.currentMileage.toLocaleString()})
                </button>
              )}
            </div>
            <input
              type="number"
              step="any"
              value={odometerStart || ''}
              onChange={(e) => setOdometerStart(parseFloat(e.target.value) || 0)}
              placeholder="เช่น 202622"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                เลขไมล์กลับมา
              </label>
              {!isSubcontractor && (
                <span className="text-[10px] text-emerald-600 font-semibold">
                  ✓ ซิงค์เข้าโปรแกรม A
                </span>
              )}
            </div>
            <input
              type="number"
              step="any"
              value={odometerEnd || ''}
              onChange={(e) => setOdometerEnd(parseFloat(e.target.value) || 0)}
              placeholder="เช่น 203233"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              กม. ที่ใช้ไป (คำนวณอัตโนมัติ)
            </label>
            <input
              type="number"
              step="any"
              value={distanceKm || ''}
              onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-gray-50 font-semibold text-gray-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              เติมน้ำมัน (ลิตร)
            </label>
            <input
              type="number"
              step="any"
              value={fuelLiters || ''}
              onChange={(e) => setFuelLiters(parseFloat(e.target.value) || 0)}
              placeholder="เช่น 179.5"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              อัตราสิ้นเปลือง (กม./ลิตร)
            </label>
            <input
              type="number"
              step="any"
              value={fuelEfficiency || ''}
              readOnly
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-gray-50 text-purple-700 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ราคาน้ำมันต่อลิตร (บาท)
            </label>
            <input
              type="number"
              step="any"
              value={fuelPricePerLiter || ''}
              onChange={(e) => setFuelPricePerLiter(parseFloat(e.target.value) || 0)}
              placeholder="34.94"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ค่าน้ำมันรถ (บาท)
            </label>
            <input
              type="number"
              step="any"
              value={fuelCost || ''}
              onChange={(e) => setFuelCost(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-gray-50 font-bold text-blue-700"
            />
          </div>
        </div>
      </div>

      {/* Section 6: ค่าใช้จ่ายประจำเที่ยววิ่ง (Trip Expenses) */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span>ค่าใช้จ่ายประจำเที่ยว & เบี้ยเลี้ยงคนขับ</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ขึ้น ลง
            </label>
            <input
              type="number"
              step="any"
              value={expenseLoadingUnloading || ''}
              onChange={(e) => setExpenseLoadingUnloading(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              พิเศษ (เซฟน้ำมัน)
            </label>
            <input
              type="number"
              step="any"
              value={expenseFuelSavingBonus || ''}
              onChange={(e) => setExpenseFuelSavingBonus(parseFloat(e.target.value) || 0)}
              placeholder="300"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              พิเศษ + เพิ่ม
            </label>
            <input
              type="number"
              step="any"
              value={expenseExtraBonus || ''}
              onChange={(e) => setExpenseExtraBonus(parseFloat(e.target.value) || 0)}
              placeholder="200"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              เบี้ยเลี้ยงคนขับ
            </label>
            <input
              type="number"
              step="any"
              value={expenseAllowance || ''}
              onChange={(e) => setExpenseAllowance(parseFloat(e.target.value) || 0)}
              placeholder="1200"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-purple-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ของกลับ (Backhaul)
            </label>
            <input
              type="number"
              step="any"
              value={expenseBackhaul || ''}
              onChange={(e) => setExpenseBackhaul(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ทางด่วน
            </label>
            <input
              type="number"
              step="any"
              value={expenseExpressway || ''}
              onChange={(e) => setExpenseExpressway(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ค่าท่า
            </label>
            <input
              type="number"
              step="any"
              value={expensePort || ''}
              onChange={(e) => setExpensePort(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ตกค้าง
            </label>
            <input
              type="number"
              step="any"
              value={expenseDetention || ''}
              onChange={(e) => setExpenseDetention(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ค่าซ่อมระหว่างทาง
            </label>
            <input
              type="number"
              step="any"
              value={expenseRepair || ''}
              onChange={(e) => setExpenseRepair(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              อื่นๆ
            </label>
            <input
              type="number"
              step="any"
              value={expenseOther || ''}
              onChange={(e) => setExpenseOther(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Bottom Save bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
        >
          ยกเลิก
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-purple-600/30 hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลเที่ยววิ่ง'}</span>
        </button>
      </div>
    </form>
  );
}
