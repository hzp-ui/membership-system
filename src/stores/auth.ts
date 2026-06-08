/**
 * @file auth.ts - 认证状态管理（Zustand Store）
 * @description 使用 REST API 登录 + localStorage 持久化
 * @module stores/auth
 */

import { create } from 'zustand'
import type { Admin, Member } from '@/types'

// ========== 类型定义 ==========

interface AuthState {
  /** 当前登录的管理员信息 */
  admin: Admin | null
  /** 当前登录的会员信息 */
  member: Member | null
  /** 当前角色：admin / member / null */
  role: 'admin' | 'member' | null
  /** 是否已认证 */
  isAuthenticated: boolean
  /** 是否正在加载 */
  isLoading: boolean

  /** 设置管理员 */
  setAdmin: (admin: Admin) => void
  /** 设置会员 */
  setMember: (member: Member) => void
  /** 登出 */
  logout: () => void
  /** 检查认证状态（从 localStorage 恢复） */
  checkAuth: () => void
  /** 判断是否超管 */
  isSuperAdmin: () => boolean
  /** 获取门店 ID */
  storeId: () => string | undefined
}

// ========== Auth Store ==========

export const useAuthStore = create<AuthState>((set, get) => ({
  admin: null,
  member: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  setAdmin: (admin) => {
    localStorage.setItem('admin', JSON.stringify(admin))
    localStorage.setItem('role', 'admin')
    // 保存 JWT Token
    if ((admin as any).token) {
      localStorage.setItem('auth_token', (admin as any).token)
    }
    set({ admin, role: 'admin', isAuthenticated: true, isLoading: false })
  },

  setMember: (member) => {
    localStorage.setItem('member', JSON.stringify(member))
    localStorage.setItem('role', 'member')
    if ((member as any).token) {
      localStorage.setItem('auth_token', (member as any).token)
    }
    set({ member, role: 'member', isAuthenticated: true, isLoading: false })
  },

  logout: () => {
    localStorage.removeItem('admin')
    localStorage.removeItem('member')
    localStorage.removeItem('role')
    localStorage.removeItem('auth_token')
    set({ admin: null, member: null, role: null, isAuthenticated: false, isLoading: false })
  },

  checkAuth: () => {
    set({ isLoading: true })
    try {
      const role = localStorage.getItem('role') as 'admin' | 'member' | null
      if (role === 'admin') {
        const raw = localStorage.getItem('admin')
        if (raw) {
          const admin = JSON.parse(raw)
          set({ admin, role: 'admin', isAuthenticated: true, isLoading: false })
          return
        }
      } else if (role === 'member') {
        const raw = localStorage.getItem('member')
        if (raw) {
          const member = JSON.parse(raw)
          set({ member, role: 'member', isAuthenticated: true, isLoading: false })
          return
        }
      }
    } catch {
      localStorage.removeItem('admin')
      localStorage.removeItem('member')
      localStorage.removeItem('role')
    }
    set({ isAuthenticated: false, admin: null, member: null, role: null, isLoading: false })
  },

  isSuperAdmin: () => get().admin?.role === 'super_admin',

  storeId: () => get().admin?.store_id || get().member?.store_id,
}))
