'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  X,
  Delete,
  KeyRound,
  Truck,
  ShoppingBag
} from 'lucide-react';
import { isProgramAuthenticated, setProgramAuthenticated } from '@/lib/auth';

function PortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Login PIN Modal state
  const [activeProgram, setActiveProgram] = useState<'a' | 'b' | 'c' | null>(null);
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [validating, setValidating] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Check query parameter for automatic login modal popup (e.g. redirected from protected page)
  useEffect(() => {
    const loginTarget = searchParams.get('login');
    if (loginTarget === 'a') {
      setActiveProgram('a');
    } else if (loginTarget === 'b') {
      setActiveProgram('b');
    } else if (loginTarget === 'c') {
      setActiveProgram('c');
    }
  }, [searchParams]);

  // Set title
  useEffect(() => {
    document.title = 'ศูนย์กลางระบบสารสนเทศองค์กร (Enterprise Portal)';
  }, []);

  // Handle program click: check existing session or prompt PIN
  const handleSelectProgram = (program: 'a' | 'b' | 'c') => {
    const destination = program === 'a' ? '/dashboard' : program === 'b' ? '/marketing' : '/procurement';

    if (isProgramAuthenticated(program)) {
      router.push(destination);
      return;
    }

    // Open PIN login modal
    setActiveProgram(program);
    setPin('');
    setPinError('');
    setSuccess(false);
  };

  // Focus input when modal opens
  useEffect(() => {
    if (activeProgram) {
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
    }
  }, [activeProgram]);

  // Submit PIN for verification
  const verifyPin = async (inputPin: string) => {
    if (!activeProgram || validating) return;
    try {
      setValidating(true);
      setPinError('');

      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program: activeProgram,
          pin: inputPin,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setSuccess(true);
        setProgramAuthenticated(activeProgram);
        const destination = activeProgram === 'a' ? '/dashboard' : activeProgram === 'b' ? '/marketing' : '/procurement';

        setTimeout(() => {
          router.push(destination);
        }, 500);
      } else {
        setPinError('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        setPin('');
      }
    } catch (e: any) {
      setPinError('เกิดข้อผิดพลาดในการตรวจสอบรหัส');
    } finally {
      setValidating(false);
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pin.length >= 4 || validating || success) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      verifyPin(newPin);
    }
  };

  const handleBackspace = () => {
    if (validating || success) return;
    setPin((prev) => prev.slice(0, -1));
    setPinError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      handleBackspace();
    } else if (/^[0-9]$/.test(e.key)) {
      handleKeypadPress(e.key);
    } else if (e.key === 'Enter' && pin.length === 4) {
      verifyPin(pin);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-100 px-4 py-12 selection:bg-blue-500 selection:text-white">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[280px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container / Window */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
        {/* Title Page */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-8 sm:mb-10 text-center">
          ศูนย์กลางระบบสารสนเทศองค์กร (Enterprise Portal)
        </h1>

        {/* 3 Main Program Buttons / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Program A: ระบบแผนงานซ่อมบำรุง */}
          <button
            type="button"
            onClick={() => handleSelectProgram('a')}
            className="group relative flex flex-col justify-between p-7 sm:p-8 rounded-2xl bg-slate-800/70 border-2 border-slate-700/80 hover:border-blue-500/80 hover:bg-slate-800/90 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-xl transition-all duration-300 transform hover:-translate-y-1 text-left cursor-pointer"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
                <Truck className="w-7 h-7" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-300">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                <span>โปรแกรม A</span>
              </span>
            </div>

            {/* Content */}
            <div className="space-y-2 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                ระบบแผนงานซ่อมบำรุง
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                ระบบบริหารจัดการรถบริษัท คลังอะไหล่ ใบสั่งซ่อม และแผนการตรวจเช็กบำรุงรักษาเชิงป้องกัน
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-blue-400 group-hover:text-blue-300 font-semibold text-sm w-full">
              <span>เข้าสู่ระบบ (PIN)</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* Program B: ระบบแผนงานการตลาด */}
          <button
            type="button"
            onClick={() => handleSelectProgram('b')}
            className="group relative flex flex-col justify-between p-7 sm:p-8 rounded-2xl bg-slate-800/70 border-2 border-slate-700/80 hover:border-purple-500/80 hover:bg-slate-800/90 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 backdrop-blur-xl transition-all duration-300 transform hover:-translate-y-1 text-left cursor-pointer"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform duration-300">
                <TrendingUp className="w-7 h-7" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300">
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                <span>โปรแกรม B</span>
              </span>
            </div>

            {/* Content */}
            <div className="space-y-2 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                ระบบแผนงานการตลาด
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                บริหารจัดการเที่ยววิ่งขนส่ง วางบิลลูกค้า ตรวจสอบต้นทุนค่าน้ำมัน และคำนวณกำไรสุทธิต่องาน
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-purple-400 group-hover:text-purple-300 font-semibold text-sm w-full">
              <span>เข้าสู่ระบบ (PIN)</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* Program C: ระบบแผนงานฝ่ายจัดซื้อ */}
          <button
            type="button"
            onClick={() => handleSelectProgram('c')}
            className="group relative flex flex-col justify-between p-7 sm:p-8 rounded-2xl bg-slate-800/70 border-2 border-slate-700/80 hover:border-emerald-500/80 hover:bg-slate-800/90 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 backdrop-blur-xl transition-all duration-300 transform hover:-translate-y-1 text-left cursor-pointer"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-300">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>โปรแกรม C</span>
              </span>
            </div>

            {/* Content */}
            <div className="space-y-2 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                ระบบแผนงานฝ่ายจัดซื้อ
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                บริหารจัดการงานจัดซื้อจัดจ้าง ติดตามใบขอซื้อ/ใบสั่งซื้อ (PR/PO) และบริหารจัดการผู้จำหน่าย
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-emerald-400 group-hover:text-emerald-300 font-semibold text-sm w-full">
              <span>เข้าสู่ระบบ (PIN)</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* PIN Login Modal */}
      {activeProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-7 shadow-2xl space-y-6 text-center">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setActiveProgram(null);
                setPin('');
                setPinError('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Hidden Input for Physical Keyboard */}
            <input
              ref={pinInputRef}
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onKeyDown={handleKeyDown}
              onChange={() => {}}
              className="sr-only"
            />

            {/* Header / Program Icon */}
            <div className="space-y-2">
              <div
                className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg ${
                  activeProgram === 'a'
                    ? 'bg-blue-600 text-white shadow-blue-500/30'
                    : activeProgram === 'b'
                    ? 'bg-purple-600 text-white shadow-purple-500/30'
                    : 'bg-emerald-600 text-white shadow-emerald-500/30'
                }`}
              >
                {activeProgram === 'a' ? (
                  <Truck className="w-7 h-7" />
                ) : activeProgram === 'b' ? (
                  <TrendingUp className="w-7 h-7" />
                ) : (
                  <ShoppingBag className="w-7 h-7" />
                )}
              </div>
              <h3 className="text-lg font-bold text-white pt-1">
                {activeProgram === 'a'
                  ? 'เข้าสู่ระบบแผนงานซ่อมบำรุง'
                  : activeProgram === 'b'
                  ? 'เข้าสู่ระบบแผนงานการตลาด'
                  : 'เข้าสู่ระบบแผนงานฝ่ายจัดซื้อ'}
              </h3>
              <p className="text-xs text-slate-400">
                {activeProgram === 'a' ? 'โปรแกรม A' : activeProgram === 'b' ? 'โปรแกรม B' : 'โปรแกรม C'} • กรุณาใส่รหัส PIN 4 หลัก
              </p>
            </div>

            {/* 4 Digit Dots Indicator */}
            <div className="flex items-center justify-center gap-4 py-2">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      success
                        ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-400/50'
                        : isFilled
                        ? activeProgram === 'a'
                          ? 'bg-blue-400 scale-110 shadow-lg shadow-blue-400/50'
                          : activeProgram === 'b'
                          ? 'bg-purple-400 scale-110 shadow-lg shadow-purple-400/50'
                          : 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-400/50'
                        : 'bg-slate-700 border border-slate-600'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            {pinError && (
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2 px-3 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>รหัสถูกต้อง กำลังเข้าสู่ระบบ...</span>
              </div>
            )}

            {/* Interactive Numpad */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  disabled={validating || success}
                  onClick={() => handleKeypadPress(digit)}
                  className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-white font-bold text-lg border border-slate-700/60 shadow-sm transition-all disabled:opacity-50"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                disabled={validating || success || pin.length === 0}
                onClick={() => setPin('')}
                className="h-12 rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 text-xs font-medium border border-slate-700/40 transition-all disabled:opacity-30"
              >
                ล้าง
              </button>

              <button
                type="button"
                disabled={validating || success}
                onClick={() => handleKeypadPress('0')}
                className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-white font-bold text-lg border border-slate-700/60 shadow-sm transition-all disabled:opacity-50"
              >
                0
              </button>

              <button
                type="button"
                disabled={validating || success || pin.length === 0}
                onClick={handleBackspace}
                className="h-12 rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 text-slate-300 flex items-center justify-center border border-slate-700/40 transition-all disabled:opacity-30"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Hint */}
            <p className="text-[11px] text-slate-500">
              PIN เริ่มต้นคือ <span className="font-mono font-bold text-slate-300">1234</span> (สามารถกดแป้นพิมพ์ตัวเลขได้)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortalLandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PortalContent />
    </Suspense>
  );
}
