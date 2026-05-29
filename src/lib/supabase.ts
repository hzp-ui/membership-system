/**
 * @file supabase.ts - Supabase 客户端配置
 * @description 创建 Supabase 客户端实例，用于 Auth 和数据库操作
 * @module lib/supabase
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yknvmkzgsoirjfchabov.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY 未设置，请在 .env 文件中配置')
}

/**
 * Supabase 客户端实例
 * 用于：
 * - supabase.from(): 数据库操作（CRUD）
 * - supabase.rpc(): 调用 RPC 函数
 * 
 * 注意：登录后需要通过 setAuthToken() 设置 JWT Token，否则 RPC 调用会返回 "未认证"
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * 设置 JWT Token（登录后调用）
 * @param token - JWT Token
 */
export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token)
  // 使用 Supabase 的 setAuth 方法设置 Token
  supabase.auth.setSession({ access_token: token, refresh_token: '' })
}

/**
 * 清除 JWT Token（登出时调用）
 */
export function clearAuthToken() {
  localStorage.removeItem('auth_token')
  supabase.auth.signOut()
}
