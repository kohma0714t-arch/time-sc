'use client'

import { createClient } from '@/app/_lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Employee } from '@/app/_lib/types'
import { EMPLOYEE_COLORS } from '@/app/_lib/types'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', color: EMPLOYEE_COLORS[0] as string })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('employees')
      .select('*')
      .order('created_at')
    setEmployees((data as Employee[]) || [])
    setLoading(false)
  }

  const openAddModal = () => {
    setEditingEmployee(null)
    setFormData({ name: '', email: '', color: EMPLOYEE_COLORS[0] })
    setShowModal(true)
  }

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp)
    setFormData({ name: emp.name, email: emp.email || '', color: emp.color })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return
    setSaving(true)

    const supabase = createClient()

    if (editingEmployee) {
      await supabase
        .from('employees')
        .update({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          color: formData.color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingEmployee.id)
    } else {
      await supabase.from('employees').insert({
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        color: formData.color,
      })
    }

    setSaving(false)
    setShowModal(false)
    loadEmployees()
  }

  const handleToggleActive = async (emp: Employee) => {
    const supabase = createClient()
    await supabase
      .from('employees')
      .update({ is_active: !emp.is_active, updated_at: new Date().toISOString() })
      .eq('id', emp.id)
    loadEmployees()
  }

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`${emp.name} を削除しますか？\n関連するシフトデータもすべて削除されます。`)) return
    const supabase = createClient()
    await supabase.from('employees').delete().eq('id', emp.id)
    loadEmployees()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-surface rounded-lg animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-surface rounded-lg animate-pulse" />
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
          <h1 className="text-2xl font-bold tracking-tight">従業員</h1>
          <p className="text-muted text-sm mt-1">
            {employees.length}名の従業員が登録されています
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground
                     hover:bg-primary-hover active:scale-[0.99] transition-all text-sm font-medium shadow-sm cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          追加
        </button>
      </div>

      {/* Employee List */}
      {employees.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg px-6 py-16 text-center">
          <svg
            className="w-16 h-16 text-muted-foreground mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <p className="text-muted font-medium mb-1">まだ従業員が登録されていません</p>
          <p className="text-muted-foreground text-sm mb-4">
            「追加」ボタンから従業員を登録してください
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground
                       hover:bg-primary-hover transition-all text-sm font-medium cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            最初の従業員を追加
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="divide-y divide-border">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className={`px-6 py-4 flex items-center gap-4 hover:bg-surface-hover transition-colors
                  ${!emp.is_active ? 'opacity-50' : ''}`}
              >
                {/* Color dot */}
                <div
                  className="w-4 h-4 rounded-full shrink-0 ring-2 ring-white dark:ring-surface shadow-sm"
                  style={{ backgroundColor: emp.color }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{emp.name}</p>
                  {emp.email && (
                    <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                  )}
                </div>

                {/* Status */}
                <span
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    emp.is_active
                      ? 'bg-success-bg text-success'
                      : 'bg-surface-hover text-muted-foreground'
                  }`}
                >
                  {emp.is_active ? '有効' : '無効'}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(emp)}
                    className="p-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
                    title="編集"
                  >
                    <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleToggleActive(emp)}
                    className="p-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
                    title={emp.is_active ? '無効にする' : '有効にする'}
                  >
                    <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      {emp.is_active ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(emp)}
                    className="p-2 rounded-lg hover:bg-danger-bg transition-colors cursor-pointer"
                    title="削除"
                  >
                    <svg className="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="modal-content w-full max-w-md mx-auto px-4">
            <div className="bg-surface border border-border rounded-lg shadow-lg p-6 w-full">
              <h3 className="text-lg font-semibold mb-5">
                {editingEmployee ? '従業員を編集' : '従業員を追加'}
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">名前 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例: 山田太郎"
                    className="w-full px-4 py-2.5 rounded-md bg-background border border-border
                               focus:border-primary focus:ring-2 focus:ring-primary/20
                               outline-none transition-all text-sm"
                    autoFocus
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">メールアドレス</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="例: yamada@example.com"
                    className="w-full px-4 py-2.5 rounded-md bg-background border border-border
                               focus:border-primary focus:ring-2 focus:ring-primary/20
                               outline-none transition-all text-sm"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">カラー</label>
                  <div className="flex flex-wrap gap-2">
                    {EMPLOYEE_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setFormData({ ...formData, color: c })}
                        className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                          formData.color === c
                            ? 'outline-2 outline-offset-2 outline scale-110'
                            : 'hover:scale-110'
                        }`}
                        style={{
                          backgroundColor: c,
                          outlineColor: formData.color === c ? c : undefined,
                        }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-muted hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name.trim() || saving}
                  className="px-5 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground
                             hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all cursor-pointer"
                >
                  {saving ? '保存中...' : editingEmployee ? '更新' : '追加'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
