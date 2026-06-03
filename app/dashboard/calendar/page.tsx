'use client'

import { createClient } from '@/app/_lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import type { Employee, ShiftWithEmployee } from '@/app/_lib/types'

type ViewMode = 'month' | 'week'

// ========================================
// Utility functions
// ========================================

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = firstDay.getDay() // 0=Sun
  const totalDays = lastDay.getDate()

  const days: Date[] = []

  // Previous month padding
  for (let i = startDay - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i))
  }

  // Current month
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(year, month, i))
  }

  // Next month padding (fill to 42 = 6 rows)
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i))
  }

  return days
}

function getWeekDays(baseDate: Date) {
  const day = baseDate.getDay()
  const start = new Date(baseDate)
  start.setDate(start.getDate() - day)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

function formatDateKey(date: Date) {
  return date.toISOString().split('T')[0]
}

function formatTime(time: string) {
  return time?.slice(0, 5) || ''
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6) // 6:00 - 21:00

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

// ========================================
// Main Component
// ========================================

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [shifts, setShifts] = useState<ShiftWithEmployee[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftWithEmployee | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [formData, setFormData] = useState<{
    employee_id: string
    employee_ids: string[]
    start_time: string
    end_time: string
    memo: string
  }>({
    employee_id: '',
    employee_ids: [],
    start_time: '09:00',
    end_time: '17:00',
    memo: '',
  })
  const [saving, setSaving] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Date range for query
  const getDateRange = useCallback(() => {
    if (viewMode === 'month') {
      const days = getMonthDays(year, month)
      return {
        start: formatDateKey(days[0]),
        end: formatDateKey(days[days.length - 1]),
      }
    } else {
      const days = getWeekDays(currentDate)
      return {
        start: formatDateKey(days[0]),
        end: formatDateKey(days[6]),
      }
    }
  }, [year, month, currentDate, viewMode])

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { start, end } = getDateRange()

    const [shiftsRes, employeesRes] = await Promise.all([
      supabase
        .from('shifts')
        .select('*, employee:employees(*)')
        .gte('date', start)
        .lte('date', end)
        .order('start_time'),
      supabase.from('employees').select('*').eq('is_active', true).order('name'),
    ])

    setShifts((shiftsRes.data as ShiftWithEmployee[]) || [])
    setEmployees((employeesRes.data as Employee[]) || [])
    setLoading(false)
  }, [getDateRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Group shifts by date
  const shiftsByDate = shifts.reduce<Record<string, ShiftWithEmployee[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = []
    acc[s.date].push(s)
    return acc
  }, {})

  // Navigation
  const navigate = (direction: number) => {
    const d = new Date(currentDate)
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + direction)
    } else {
      d.setDate(d.getDate() + direction * 7)
    }
    setCurrentDate(d)
  }

  const goToday = () => setCurrentDate(new Date())

  // Modal
  const openAddModal = (date: string) => {
    setEditingShift(null)
    setSelectedDate(date)
    setFormData({
      employee_id: '',
      employee_ids: [],
      start_time: '09:00',
      end_time: '17:00',
      memo: '',
    })
    setShowModal(true)
  }

  const openEditModal = (shift: ShiftWithEmployee) => {
    setEditingShift(shift)
    setSelectedDate(shift.date)
    setFormData({
      employee_id: shift.employee_id,
      employee_ids: [],
      start_time: formatTime(shift.start_time),
      end_time: formatTime(shift.end_time),
      memo: shift.memo || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!selectedDate) return

    if (editingShift) {
      if (!formData.employee_id) return
      setSaving(true)

      const supabase = createClient()
      const payload = {
        employee_id: formData.employee_id,
        date: selectedDate,
        start_time: formData.start_time + ':00',
        end_time: formData.end_time + ':00',
        memo: formData.memo.trim() || null,
        updated_at: new Date().toISOString()
      }

      await supabase
        .from('shifts')
        .update(payload)
        .eq('id', editingShift.id)
    } else {
      if (formData.employee_ids.length === 0) return
      setSaving(true)

      const supabase = createClient()
      const payloads = formData.employee_ids.map(empId => ({
        employee_id: empId,
        date: selectedDate,
        start_time: formData.start_time + ':00',
        end_time: formData.end_time + ':00',
        memo: formData.memo.trim() || null,
      }))

      await supabase.from('shifts').insert(payloads)
    }

    setSaving(false)
    setShowModal(false)
    loadData()
  }

  const handleDelete = async () => {
    if (!editingShift) return
    if (!confirm('このシフトを削除しますか？')) return

    const supabase = createClient()
    await supabase.from('shifts').delete().eq('id', editingShift.id)
    setShowModal(false)
    loadData()
  }

  const today = formatDateKey(new Date())

  // Title
  const title =
    viewMode === 'month'
      ? `${year}年${month + 1}月`
      : (() => {
          const days = getWeekDays(currentDate)
          const s = days[0]
          const e = days[6]
          return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`
        })()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface rounded-lg animate-pulse" />
        <div className="h-[500px] bg-surface rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-surface border border-border
                         hover:bg-surface-hover transition-colors cursor-pointer"
            >
              今日
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-surface border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-surface-hover'
              }`}
            >
              月
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-surface-hover'
              }`}
            >
              週
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      {viewMode === 'month' ? (
        <MonthView
          year={year}
          month={month}
          today={today}
          shiftsByDate={shiftsByDate}
          onDateClick={openAddModal}
          onShiftClick={openEditModal}
        />
      ) : (
        <WeekView
          currentDate={currentDate}
          today={today}
          shiftsByDate={shiftsByDate}
          onDateClick={openAddModal}
          onShiftClick={openEditModal}
        />
      )}

      {/* Shift Modal */}
      {showModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="modal-content w-full max-w-md mx-auto px-4">
            <div className="bg-surface border border-border rounded-lg shadow-xl p-6 w-full">
              <h3 className="text-lg font-semibold mb-1">
                {editingShift ? 'シフトを編集' : 'シフトを追加'}
              </h3>
              <p className="text-sm text-muted mb-5">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </p>

              <div className="space-y-4">
                {/* Employee */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">従業員 *</label>
                  {editingShift ? (
                    <select
                      value={formData.employee_id}
                      onChange={(e) =>
                        setFormData({ ...formData, employee_id: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-md bg-background border border-border
                                 focus:border-primary focus:ring-2 focus:ring-primary/20
                                 outline-none transition-all text-sm"
                    >
                      <option value="">選択してください</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-border">
                        <span className="text-xs text-muted-foreground">
                          {formData.employee_ids.length} 名選択中
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                employee_ids: employees.map((emp) => emp.id),
                              })
                            }
                            className="text-[11px] text-primary hover:underline cursor-pointer"
                          >
                            すべて選択
                          </button>
                          <span className="text-border">|</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, employee_ids: [] })
                            }
                            className="text-[11px] text-muted hover:underline cursor-pointer"
                          >
                            選択解除
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1.5 border border-border rounded-md bg-background">
                        {employees.map((emp) => {
                          const isChecked = formData.employee_ids.includes(emp.id)
                          return (
                            <label
                              key={emp.id}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded border text-xs cursor-pointer transition-all
                                          ${
                                            isChecked
                                              ? 'border-primary bg-primary/5 text-foreground font-medium'
                                              : 'border-border hover:bg-surface-hover text-muted-foreground'
                                          }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  const nextIds = checked
                                    ? [...formData.employee_ids, emp.id]
                                    : formData.employee_ids.filter((id) => id !== emp.id)
                                  setFormData({ ...formData, employee_ids: nextIds })
                                }}
                                className="w-3.5 h-3.5 rounded text-primary border-border focus:ring-primary/20 accent-primary"
                              />
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: emp.color || '#3B82F6' }}
                              />
                              <span className="truncate">{emp.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">開始時間</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-md bg-background border border-border
                                 focus:border-primary focus:ring-2 focus:ring-primary/20
                                 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">終了時間</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-md bg-background border border-border
                                 focus:border-primary focus:ring-2 focus:ring-primary/20
                                 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Memo */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">メモ</label>
                  <textarea
                    value={formData.memo}
                    onChange={(e) =>
                      setFormData({ ...formData, memo: e.target.value })
                    }
                    placeholder="任意のメモ"
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-md bg-background border border-border
                               focus:border-primary focus:ring-2 focus:ring-primary/20
                               outline-none transition-all text-sm resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <div>
                  {editingShift && (
                    <button
                      onClick={handleDelete}
                      className="px-3 py-2 rounded-md text-sm font-medium text-danger hover:bg-danger-bg transition-colors cursor-pointer"
                    >
                      削除
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-md text-sm font-medium text-muted hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={
                      saving ||
                      (editingShift ? !formData.employee_id : formData.employee_ids.length === 0)
                    }
                    className="px-5 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground
                               hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all cursor-pointer"
                  >
                    {saving ? '保存中...' : editingShift ? '更新' : '追加'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ========================================
// Month View
// ========================================

function MonthView({
  year,
  month,
  today,
  shiftsByDate,
  onDateClick,
  onShiftClick,
}: {
  year: number
  month: number
  today: string
  shiftsByDate: Record<string, ShiftWithEmployee[]>
  onDateClick: (date: string) => void
  onShiftClick: (shift: ShiftWithEmployee) => void
}) {
  const days = getMonthDays(year, month)

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-2.5 text-center text-xs font-semibold ${
              i === 0 ? 'text-danger' : i === 6 ? 'text-primary' : 'text-muted'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((date, idx) => {
          const key = formatDateKey(date)
          const isCurrentMonth = date.getMonth() === month
          const isToday = key === today
          const dayShifts = shiftsByDate[key] || []
          const dayOfWeek = date.getDay()

          return (
            <div
              key={idx}
              onClick={() => onDateClick(key)}
              className={`min-h-[90px] sm:min-h-[110px] border-b border-r border-border p-1.5 cursor-pointer
                         hover:bg-surface-hover/50 transition-colors
                         ${!isCurrentMonth ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                    ${isToday ? 'bg-primary text-primary-foreground' : ''}
                    ${dayOfWeek === 0 ? 'text-danger' : dayOfWeek === 6 ? 'text-primary' : ''}`}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Shift badges */}
              <div className="space-y-0.5">
                {dayShifts.slice(0, 3).map((shift) => (
                  <button
                    key={shift.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onShiftClick(shift)
                    }}
                    className="w-full text-left px-1.5 py-0.5 rounded text-[10px] sm:text-xs truncate block
                               hover:opacity-80 transition-opacity cursor-pointer font-medium"
                    style={{
                      backgroundColor: (shift.employee?.color || '#3B82F6') + '20',
                      color: shift.employee?.color || '#3B82F6',
                    }}
                  >
                    <span className="hidden sm:inline">{formatTime(shift.start_time)} </span>
                    {shift.employee?.name}
                  </button>
                ))}
                {dayShifts.length > 3 && (
                  <span className="text-[10px] text-muted-foreground pl-1">
                    +{dayShifts.length - 3}件
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ========================================
// Week View
// ========================================

function WeekView({
  currentDate,
  today,
  shiftsByDate,
  onDateClick,
  onShiftClick,
}: {
  currentDate: Date
  today: string
  shiftsByDate: Record<string, ShiftWithEmployee[]>
  onDateClick: (date: string) => void
  onShiftClick: (shift: ShiftWithEmployee) => void
}) {
  const days = getWeekDays(currentDate)

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
        <div className="border-r border-border" />
        {days.map((date, i) => {
          const key = formatDateKey(date)
          const isToday = key === today
          return (
            <div
              key={i}
              className={`py-3 text-center border-r border-border last:border-r-0
                ${isToday ? 'bg-primary/5' : ''}`}
            >
              <p className={`text-xs font-medium ${
                date.getDay() === 0 ? 'text-danger' : date.getDay() === 6 ? 'text-primary' : 'text-muted'
              }`}>
                {WEEKDAYS[date.getDay()]}
              </p>
              <p
                className={`text-lg font-bold mt-0.5 ${
                  isToday ? 'text-primary' : ''
                }`}
              >
                {date.getDate()}
              </p>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border last:border-b-0">
            <div className="py-4 px-2 text-right text-xs text-muted-foreground border-r border-border font-mono">
              {String(hour).padStart(2, '0')}:00
            </div>
            {days.map((date, i) => {
              const key = formatDateKey(date)
              const isToday = key === today
              const dayShifts = (shiftsByDate[key] || []).filter((s) => {
                const startHour = parseInt(s.start_time.split(':')[0])
                return startHour === hour
              })

              return (
                <div
                  key={i}
                  onClick={() => onDateClick(key)}
                  className={`py-1 px-0.5 border-r border-border last:border-r-0 min-h-[52px]
                             cursor-pointer hover:bg-surface-hover/50 transition-colors
                             ${isToday ? 'bg-primary/[0.02]' : ''}`}
                >
                  {dayShifts.map((shift) => (
                    <button
                      key={shift.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onShiftClick(shift)
                      }}
                      className="w-full text-left px-1.5 py-1 rounded-md text-[11px] mb-0.5
                                 hover:opacity-80 transition-opacity cursor-pointer font-medium leading-tight"
                      style={{
                        backgroundColor: (shift.employee?.color || '#3B82F6') + '20',
                        color: shift.employee?.color || '#3B82F6',
                        borderLeft: `3px solid ${shift.employee?.color || '#3B82F6'}`,
                      }}
                    >
                      <span className="block truncate">{shift.employee?.name}</span>
                      <span className="text-[10px] opacity-70">
                        {formatTime(shift.start_time)}-{formatTime(shift.end_time)}
                      </span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
