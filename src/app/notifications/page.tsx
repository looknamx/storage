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
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(Array.isArray(data) ? data : [])
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

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ศูนย์การแจ้งเตือน (Notifications)</h1>
          <p className="text-sm text-slate-500 mt-1">
            การแจ้งเตือนรถถึงรอบซ่อมบำรุง, อะไหล่ใกล้หมดสต็อก และสถานะงานซ่อม
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
          >
            <Check className="h-3.5 w-3.5" />
            ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">กำลังโหลดแจ้งเตือน...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Bell className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              ไม่มีการแจ้งเตือนในขณะนี้
            </div>
          ) : (
            notifications.map((n) => {
              const isCritical = n.priority === 'critical'
              const isHigh = n.priority === 'high'

              return (
                <div
                  key={n.id}
                  className={`p-4 flex items-start justify-between gap-4 transition ${
                    n.isRead ? 'bg-white opacity-70' : 'bg-blue-50/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
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
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{n.title}</span>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[11px] text-slate-400 mt-1.5 inline-block">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
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

