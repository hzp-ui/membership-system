/**
 * @file App.tsx - 应用根组件与路由配置
 * @description 会员管理系统前端入口，定义全局路由规则和 Ant Design 配置：
 * - 管理后台路由（登录、仪表盘、门店/会员/充值/消费/预约/理发师/服务/财务管理）
 * - 用户端路由（登录、个人中心、充值、预约、预约记录）
 * - 默认跳转到管理员登录页
 * - Ant Design 中文语言包和主题色配置
 * - 路由守卫：未登录自动跳转登录页，登录后返回原始路径
 * - 路由懒加载：非首屏页面按需加载，减少首屏 JS 体积
 * @module App
 */

import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntApp, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AdminLayout from '@/layouts/AdminLayout'
import UserLayout from '@/layouts/UserLayout'
import PrivateRoute from '@/components/PrivateRoute'

/** 全局主题色 */
const THEME_COLOR = '#1677ff'

// ========== 懒加载页面（按路由分组）==========

// 管理员页面
const AdminLogin    = lazy(() => import('@/pages/admin/Login/index'))
const Dashboard     = lazy(() => import('@/pages/admin/Dashboard/index'))
const StoreList     = lazy(() => import('@/pages/admin/StoreList/index'))
const MemberList    = lazy(() => import('@/pages/admin/MemberList/index'))
const RechargeList  = lazy(() => import('@/pages/admin/RechargeList/index'))
const ConsumptionList = lazy(() => import('@/pages/admin/ConsumptionList/index'))
const AppointmentList = lazy(() => import('@/pages/admin/AppointmentList/index'))
const BarberList    = lazy(() => import('@/pages/admin/BarberList/index'))
const ServiceList   = lazy(() => import('@/pages/admin/ServiceList/index'))
const FinanceReport = lazy(() => import('@/pages/admin/FinanceReport/index'))
const AdminList     = lazy(() => import('@/pages/admin/AdminList/index'))

// 用户端页面
const UserLogin      = lazy(() => import('@/pages/user/Login/index'))
const Profile        = lazy(() => import('@/pages/user/Profile/index'))
const UserRecharge   = lazy(() => import('@/pages/user/Recharge/index'))
const Booking        = lazy(() => import('@/pages/user/Booking/index'))
const UserAppointments = lazy(() => import('@/pages/user/Appointments/index'))

// ========== 懒加载 Fallback ==========

/** 全屏加载中组件 */
const PageLoader: React.FC = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh',
  }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

// ========== App ==========

/**
 * 应用根组件
 * @component App
 * @description 配置全局 Ant Design 主题与路由：
 * - 主题色：#1677ff（Ant Design 默认蓝）
 * - 语言包：中文（zh_CN）
 * - 根路径自动跳转至 /admin/login
 * - 管理后台路由嵌套在 AdminLayout 下，受路由守卫保护
 * - 用户端路由嵌套在 UserLayout 下，受路由守卫保护
 * - 所有页面使用 React.lazy 懒加载，首屏只加载登录页
 * @returns {JSX.Element} 应用根组件
 */
const App: React.FC = () => (
  <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: THEME_COLOR } }}>
    <AntApp>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* 根路径重定向到管理员登录 */}
            <Route path="/" element={<Navigate to="/admin/login" replace />} />

            {/* 管理员登录页（独立布局，无需守卫） */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* 管理后台路由（嵌套在 AdminLayout 中，受路由守卫保护） */}
            <Route path="/admin" element={
              <PrivateRoute type="admin">
                <AdminLayout />
              </PrivateRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="stores" element={<StoreList />} />
              <Route path="members" element={<MemberList />} />
              <Route path="recharge" element={<RechargeList />} />
              <Route path="consumption" element={<ConsumptionList />} />
              <Route path="appointments" element={<AppointmentList />} />
              <Route path="barbers" element={<BarberList />} />
              <Route path="services" element={<ServiceList />} />
              <Route path="finance" element={<FinanceReport />} />
              <Route path="admins" element={<AdminList />} />
            </Route>

            {/* 用户端登录页（独立布局，无需守卫） */}
            <Route path="/user/login" element={<UserLogin />} />

            {/* 用户端路由（嵌套在 UserLayout 中，受路由守卫保护） */}
            <Route path="/user" element={
              <PrivateRoute type="user">
                <UserLayout />
              </PrivateRoute>
            }>
              <Route path="profile" element={<Profile />} />
              <Route path="recharge" element={<UserRecharge />} />
              <Route path="booking" element={<Booking />} />
              <Route path="appointments" element={<UserAppointments />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AntApp>
  </ConfigProvider>
)

export default App