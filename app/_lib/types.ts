// ========================================
// データベース型定義
// ========================================

export type Role = 'admin' | 'employee'

export type ShiftRequestStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: Role
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  user_id: string | null
  name: string
  email: string | null
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Shift {
  id: string
  employee_id: string
  date: string // YYYY-MM-DD
  start_time: string // HH:MM:SS
  end_time: string // HH:MM:SS
  memo: string | null
  created_at: string
  updated_at: string
}

export interface ShiftWithEmployee extends Shift {
  employee: Employee
}

export interface ShiftRequest {
  id: string
  employee_id: string
  date: string // YYYY-MM-DD
  start_time: string // HH:MM:SS
  end_time: string // HH:MM:SS
  status: ShiftRequestStatus
  memo: string | null
  created_at: string
  updated_at: string
}

export interface ShiftRequestWithEmployee extends ShiftRequest {
  employee: Employee
}

// ========================================
// 色定数（従業員カラーのプリセット）
// ========================================
export const EMPLOYEE_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
] as const
