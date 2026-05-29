/**
 * @file PrivateRoute.tsx - 路由守卫组件
 * @description 根据角色保护管理后台和用户端路由
 * - 未登录 → 跳转登录页
 * - 加载中 → 显示加载状态
 */

import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuthStore } from '@/stores/auth'

interface PrivateRouteProps {
  /** 子路由内容 */
  children: React.ReactNode
  /** 路由类型：admin 后台 / user 用户端 */
  type?: 'admin' | 'user'
}

/**
 * 路由守卫组件
 * @param type - 'admin' 未登录跳转 /admin/login，'user' 跳转 /user/login
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, type = 'admin' }) => {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuthStore()
  const checkAuth = useAuthStore((s) => s.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [])

  // 加载中：显示 spinner
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  // 未认证：重定向到对应登录页，保存原始路径用于登录后返回
  if (!isAuthenticated) {
    const redirect = type === 'admin' ? '/admin/login' : '/user/login'
    return <Navigate to={redirect} state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default PrivateRoute