'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

const THAI_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]

const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

interface ThaiDatePickerProps {
  value?: string // format: YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  id?: string
  name?: string
  minDate?: string
  maxDate?: string
}

export default function ThaiDatePicker({
  value = '',
  onChange,
  placeholder = 'วว/ดด/ปปปป (พ.ศ.)',
  required = false,
  disabled = false,
  className = '',
  id,
  name,
}: ThaiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Current view month & CE year
  const today = new Date()
  const initialDate = value ? new Date(value) : today
  const [viewYear, setViewYear] = useState<number>(
    isNaN(initialDate.getFullYear()) ? today.getFullYear() : initialDate.getFullYear()
  )
  const [viewMonth, setViewMonth] = useState<number>(
    isNaN(initialDate.getMonth()) ? today.getMonth() : initialDate.getMonth()
  )

  // Update view when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear())
        setViewMonth(d.getMonth())
      }
    }
  }, [value])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Format value to Thai display (DD/MM/BBBB)
  const formatDisplayValue = (val: string): string => {
    if (!val) return ''
    const d = new Date(val)
    if (isNaN(d.getTime())) return ''
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const bYear = d.getFullYear() > 2400 ? d.getFullYear() : d.getFullYear() + 543
    return `${day}/${month}/${bYear}`
  }

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  // Handle day selection
  const handleSelectDay = (day: number) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
    onChange(dateStr)
    setIsOpen(false)
  }

  // Handle Select Today
  const handleSelectToday = () => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    onChange(dateStr)
    setIsOpen(false)
  }

  // Handle Clear
  const handleClear = () => {
    onChange('')
    setIsOpen(false)
  }

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay() // 0 = Sun
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate()

  // Generate Year options in Buddhist Era (พ.ศ.)
  const currentBYear = today.getFullYear() + 543
  const yearOptions: number[] = []
  for (let bY = currentBYear - 20; bY <= currentBYear + 10; bY++) {
    yearOptions.push(bY)
  }

  // Check if a day is currently selected
  const isSelected = (day: number): boolean => {
    if (!value) return false
    const d = new Date(value)
    if (isNaN(d.getTime())) return false
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day
  }

  // Check if a day is today
  const isToday = (day: number): boolean => {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    )
  }

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      {/* Input Box */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between cursor-pointer bg-white px-3 py-2 border rounded-lg text-xs transition select-none ${
          disabled
            ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-slate-200 hover:border-slate-300'
        } ${className}`}
      >
        <span className={value ? 'text-slate-800 font-medium' : 'text-slate-400'}>
          {formatDisplayValue(value) || placeholder}
        </span>
        <div className="flex items-center gap-1.5 text-slate-400">
          {value && !required && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              className="p-0.5 hover:text-slate-600 rounded"
              title="ล้างค่าวันที่"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <Calendar className="h-4 w-4 text-slate-500" />
        </div>
      </div>

      {/* Hidden input for form validation if required */}
      {required && (
        <input
          type="text"
          id={id}
          name={name}
          required
          tabIndex={-1}
          value={value}
          onChange={() => {}}
          className="sr-only"
        />
      )}

      {/* Dropdown Calendar Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-72 rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
          {/* Header: Month and Buddhist Year Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value))}
                className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
              >
                {THAI_MONTHS_FULL.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Buddhist Year Dropdown */}
              <select
                value={viewYear + 543}
                onChange={(e) => setViewYear(parseInt(e.target.value) - 543)}
                className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
              >
                {yearOptions.map((bY) => (
                  <option key={bY} value={bY}>
                    {bY}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
              title="เดือนถัดไป"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Thai Days of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center py-2 text-[11px] font-bold text-slate-400">
            {THAI_DAYS_SHORT.map((dayName, idx) => (
              <div
                key={dayName}
                className={idx === 0 ? 'text-rose-400' : idx === 6 ? 'text-blue-400' : ''}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {/* Prev month days padding */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => {
              const dayNum = prevMonthDays - firstDayIndex + idx + 1
              return (
                <div
                  key={`prev-${idx}`}
                  className="flex h-8 items-center justify-center text-slate-300 select-none text-[11px]"
                >
                  {dayNum}
                </div>
              )
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1
              const selected = isSelected(day)
              const todayFlag = isToday(day)

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`flex h-8 w-8 mx-auto items-center justify-center rounded-lg font-medium transition active:scale-95 ${
                    selected
                      ? 'bg-blue-600 text-white font-bold shadow-md'
                      : todayFlag
                      ? 'border border-blue-500 text-blue-600 font-bold hover:bg-blue-50'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Footer Controls: ล้าง & วันนี้ */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-rose-600 transition font-medium"
            >
              ล้าง
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-blue-600 hover:text-blue-800 font-bold transition hover:underline"
            >
              วันนี้
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

