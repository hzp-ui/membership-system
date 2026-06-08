/**
 * @file axios.ts - REST API 客户端
 * @description axios 实例 + JWT 拦截器，替代 Supabase RPC
 * @module lib/axios
 */

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
})

// 请求拦截器：自动带 JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (res) => {
    const data = res.data
    if (data.code !== undefined && data.code !== 200) {
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return data // 返回 Result<T> 整体，调用方通过 .data 取业务数据
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('admin')
      localStorage.removeItem('member')
      localStorage.removeItem('role')
      window.location.href = '/admin/login'
    }
    return Promise.reject(err)
  }
)

export default api
