'use client'

import { createClient } from '@/app/_lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Employee, ShiftRequestWithEmployee } from '@/app/_lib/types'

export default function RequestsPage() {
  const [requests, setRequests] = useState<ShiftRequestWithEmployee[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [formData, setFormData] = useState({
    employee_id: '',
    date: '',
    start_time: '09:00',
    end_time: '17:00',
    memo: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    const supabase = createClient()

    let query = supabase
      .from('shift_requests')
      .select('*, employee:employees(*)')
      .order('date', { ascending: true })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const [requestsRes, employeesRes] = await Promise.all([
      query,
      supabase.from('employees').select('*').eq('is_active', true).order('name'),
    ])

    setRequests((requestsRes.data as ShiftRequestWithEmployee[]) || [])
    setEmployees((employeesRes.data as Employee[]) || [])
    setLoading(false)
  }

  const handleApprove = async (req: ShiftRequestWithEmployee) => {
    const supabase = createClient()

    // シフト希望を承認
    await supabase
      .from('shift_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', req.id)

    // シフトテーブルに自動追加
    await supabase.from('shifts').insert({
      employee_id: req.employee_id,
      date: req.date,
      start_time: req.start_time,
      end_time: req.end_time,
      memo: req.memo ? `[希望より] ${req.memo}` : '[希望より承認]',
    })

    loadData()
  }

  const handleReject = async (req: ShiftRequestWithEmployee) => {
    const supabase = createClient()
    await supabase
      .from('shift_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', req.id)
    loadData()
  }

  const handleDelete = async (req: ShiftRequestWithEmployee) => {
    if (!confirm('この希望を削除しますか？')) return
    const supabase = createClient()
    await supabase.from('shift_requests').delete().eq('id', req.id)
    loadData()
  }

  const handleAddRequest = async () => {
    if (!formData.employee_id || !formData.date) return
    setSaving(true)

    const supabase = createClient()
    await supabase.from('shift_requests').insert({
      employee_id: formData.employee_id,
      date: formData.date,
      start_time: formData.start_time + ':00',
      end_time: formData.end_time + ':00',
      memo: formData.memo.trim() || null,
    })

    setSaving(false)
    setShowAddModal(false)
    setFormData({ employee_id: '', date: '', start_time: '09:00', end_time: '17:00', memo: '' })
    loadData()
  }

  const formatTime = (time: string) => time?.slice(0, 5) || ''

  const statusConfig = {
    pending: { label: '未承認', className: 'bg-warning-bg text-warning' },
    approved: { label: '承認済', className: 'bg-success-bg text-success' },
    rejected: { label: '却下', className: 'bg-danger-bg text-danger' },
  }

  const filterCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-surface rounded-lg animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">シフト希望</h1>
          <p className="text-muted text-sm mt-1">
            従業員からのシフト希望を管理します
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground
                     hover:bg-primary-hover active:scale-[0.98] transition-all text-sm font-medium shadow-sm cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          希望を代理入力
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-md p-1 w-fit">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === f
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            {f === 'all' ? 'すべて' : statusConfig[f].label}
          </button>
        ))}
      </div>

      {/* Request List */}
      {requests.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg px-6 py-16 text-center">
          <svg
            className="w-16 h-16 text-muted-foreground mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
            />
          </svg>
          <p className="text-muted font-medium mb-1">
            {filter === 'pending'
              ? '未承認のシフト希望はありません'
              : 'シフト希望がありません'}
          </p>
          <p className="text-muted-foreground text-sm">
            従業員からの希望を待つか、代理入力してください
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="divide-y divide-border">
            {requests.map((req) => {
              const status = statusConfig[req.status]
              return (
                <div
                  key={req.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-surface-hover/50 transition-colors"
                >
                  {/* Employee info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: req.employee?.color || '#3B82F6' }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{req.employee?.name || '不明'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.date + 'T00:00:00').toLocaleDateString('ja-JP', {
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                        {' '}
                        {formatTime(req.start_time)} - {formatTime(req.end_time)}
                      </p>
                      {req.memo && (
                        <p className="text-xs text-muted mt-0.5 truncate">
                          💬 {req.memo}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className={`px-2.5 py-1 rounded text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>

                    {req.status === 'pending' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleApprove(req)}
                          className="p-2 rounded-lg hover:bg-success-bg text-success transition-colors cursor-pointer"
                          title="承認"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          className="p-2 rounded-lg hover:bg-danger-bg text-danger transition-colors cursor-pointer"
                          title="却下"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => handleDelete(req)}
                      className="p-2 rounded-lg hover:bg-danger-bg text-danger/60 hover:text-danger transition-colors cursor-pointer"
                      title="削除"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Request Modal */}
      {showAddModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowAddModal(false)} />
          <div className="modal-content w-full max-w-md mx-auto px-4">
            <div className="bg-surface border border-border rounded-lg shadow-xl p-6 w-full">
              <h3 className="text-lg font-semibold mb-5">シフト希望を代理入力</h3>

              <div className="space-y-4">
                {/* Employee */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">従業員 *</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
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
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">日付 *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-md bg-background border border-border
                               focus:border-primary focus:ring-2 focus:ring-primary/20
                               outline-none transition-all text-sm"
                  />
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">開始時間</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    placeholder="例: 午前中のみ希望"
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-md bg-background border border-border
                               focus:border-primary focus:ring-2 focus:ring-primary/20
                               outline-none transition-all text-sm resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-muted hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddRequest}
                  disabled={!formData.employee_id || !formData.date || saving}
                  className="px-5 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground
                             hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all cursor-pointer"
                >
                  {saving ? '保存中...' : '登録'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
