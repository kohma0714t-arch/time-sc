'use client'

import { createClient } from '@/app/_lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Employee, ShiftWithEmployee, ShiftRequest } from '@/app/_lib/types'

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [todayShifts, setTodayShifts] = useState<ShiftWithEmployee[]>([])
  const [pendingRequests, setPendingRequests] = useState<ShiftRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const [employeesRes, shiftsRes, requestsRes] = await Promise.all([
      supabase.from('employees').select('*').eq('is_active', true),
      supabase
        .from('shifts')
        .select('*, employee:employees(*)')
        .eq('date', today)
        .order('start_time'),
      supabase
        .from('shift_requests')
        .select('*')
        .eq('status', 'pending')
        .order('date'),
    ])

    setEmployees((employeesRes.data as Employee[]) || [])
    setTodayShifts((shiftsRes.data as ShiftWithEmployee[]) || [])
    setPendingRequests((requestsRes.data as ShiftRequest[]) || [])
    setLoading(false)
  }

  const formatTime = (time: string) => time?.slice(0, 5) || ''

  const stats = [
    {
      label: '従業員数',
      value: employees.length,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      color: 'text-primary',
      bg: 'bg-primary/10',
      href: '/dashboard/employees',
    },
    {
      label: '今日のシフト',
      value: todayShifts.length,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-accent',
      bg: 'bg-accent/10',
      href: '/dashboard/calendar',
    },
    {
      label: '未承認の希望',
      value: pendingRequests.length,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
      color: 'text-warning',
      bg: 'bg-warning/10',
      href: '/dashboard/requests',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted text-sm mt-1">
          {new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group bg-surface border border-border rounded-lg p-5 hover:bg-surface-hover hover:border-border-hover
                       transition-all duration-150 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Today's Shifts */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">今日のシフト</h2>
          <Link
            href="/dashboard/calendar"
            className="text-sm text-primary hover:text-primary-hover transition-colors"
          >
            カレンダーを見る →
          </Link>
        </div>
        {todayShifts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg
              className="w-12 h-12 text-muted-foreground mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
              />
            </svg>
            <p className="text-muted text-sm">今日のシフトはまだありません</p>
            <Link
              href="/dashboard/calendar"
              className="inline-block mt-3 text-sm text-primary hover:text-primary-hover transition-colors"
            >
              シフトを作成する
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {todayShifts.map((shift) => (
              <div
                key={shift.id}
                className="px-6 py-3.5 flex items-center gap-4 hover:bg-surface-hover transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: shift.employee?.color || '#3B82F6' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {shift.employee?.name || '不明'}
                  </p>
                </div>
                <div className="text-sm text-muted font-mono">
                  {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
