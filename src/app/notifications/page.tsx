'use client'

import React, { useState, useEffect } from 'react'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Package,
  Wrench,
  Check,
  Clock,
  Trash2,
  ArrowRight,
  Filter,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'parts' | 'maintenance'>('all')

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications')
      const data = await res.json()
      const list = Array.isArray(data) ? data : data.notifications || []
      const unread = typeof data.unreadCount === 'number' ? data.unreadCount : list.filter((n: any) => !n.isRead).length
      setNotifications(list)
      setUnreadCount(unread)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      fetchNotifications()
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      fetchNotifications()
    } catch (err) {
      console.error(err)
    }
  }

  const handleClearRead = async () => {
    if (!confirm('คุณต้องการล้างรายการแจ้งเตือนที่อ่านแล้วทั้งหมดใช่หรือไม่?')) return
    try {
      await fetch('/api/notifications?clearRead=true', { method: 'DELETE' })
      fetchNotifications()
    } catch (err) {
      console.error(err)
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead
    if (activeTab === 'parts') return n.referenceType === 'part' || n.type === 'low_stock' || n.type === 'out_of_stock'
    if (activeTab === 'maintenance') return n.referenceType === 'maintenance_plan' || n.type === 'maintenance_due' || n.type === 'maintenance_overdue'
    return true
  })

  const readCount = notifications.filter((n) => n.isRead).length

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ศูนย์การแจ้งเตือน (Notifications)</h1>
          <p className="text-sm text-slate-500 mt-1">
            การแจ้งเตือนรถถึงรอบซ่อมบำรุง, อะไหล่ใกล้หมดสต็อก และสถานะงานซ่อม
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-medium transition"
            >
              <Check className="h-3.5 w-3.5" />
              อ่านแล้วทั้งหมด ({unreadCount})
            </button>
          )}
          {readCount > 0 && (
            <button
              onClick={handleClearRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              ล้างที่อ่านแล้ว
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl transition ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          ทั้งหมด ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'unread'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <span>ยังไม่อ่าน</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-rose-500 text-white rounded-full font-bold">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('parts')}
          className={`px-3 py-1.5 rounded-xl transition ${
            activeTab === 'parts'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          อะไหล่ใกล้หมด / สต็อก ({notifications.filter((n) => n.referenceType === 'part').length})
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-3 py-1.5 rounded-xl transition ${
            activeTab === 'maintenance'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          ซ่อมบำรุง ({notifications.filter((n) => n.referenceType === 'maintenance_plan').length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400">กำลังตรวจสอบและโหลดแจ้งเตือน...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Bell className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              {activeTab === 'unread'
                ? 'ไม่มีรายการที่ยังไม่ได้อ่าน'
                : 'ไม่มีการแจ้งเตือนในหมวดหมู่นี้'}
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isCritical = n.priority === 'critical' || n.type === 'out_of_stock'
              const isHigh = n.priority === 'high' || n.type === 'low_stock'

              // Extract part code if in message e.g. [01-0001-011]
              const partCodeMatch = n.message.match(/\[(.*?)\]/)
              const partCode = partCodeMatch ? partCodeMatch[1] : null

              return (
                <div
                  key={n.id}
                  className={`p-4 flex items-start justify-between gap-4 transition ${
                    n.isRead ? 'bg-white opacity-70' : 'bg-blue-50/20'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isCritical
                          ? 'bg-rose-100 text-rose-700'
                          : isHigh
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {isCritical ? (
                        <Flame className="h-4 w-4" />
                      ) : isHigh ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{n.title}</span>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-slate-400">
                          {formatDate(n.createdAt)}
                        </span>

                        {/* Quick action buttons */}
                        {n.referenceType === 'part' && partCode && (
                          <Link
                            href={`/parts?search=${encodeURIComponent(partCode)}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            <span>ดูอะไหล่นี้ในคลัง</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                        {n.referenceType === 'maintenance_plan' && (
                          <Link
                            href="/maintenance"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            <span>ดูแผนซ่อมบำรุง</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg text-xs shrink-0"
                      title="ทำเครื่องหมายว่าอ่านแล้ว"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
