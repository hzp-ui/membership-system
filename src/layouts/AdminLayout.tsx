/**
 * @file layouts/AdminLayout.tsx - 管理后台布局组件
 * @description 提供管理后台页面布局，包含：
 * - 左侧可折叠侧边栏导航菜单（根据权限动态显示菜单项）
 * - 顶部 Header 显示当前管理员名称和退出登录下拉菜单
 * - 主内容区域（通过 React Router Outlet 渲染子路由）
 * - 超级管理员独占菜单项（门店管理）
 * @module layouts/AdminLayout
 */

import React from 'react'
import { Layout, Menu, Dropdown, Button, theme } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  DashboardOutlined, ShopOutlined, TeamOutlined, DollarOutlined,
  ShoppingOutlined, CalendarOutlined, ScissorOutlined, AppstoreOutlined,
  AuditOutlined, UserOutlined, LogoutOutlined, SafetyOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'

const { Header, Sider, Content } = Layout

/**
 * 管理后台布局组件
 * @component AdminLayout
 * @description 管理后台整体布局：左侧导航 + 顶部栏 + 内容区
 * - 侧边栏：响应式折叠，断点 lg 以下自动收起
 * - 菜单权限：门店管理仅超级管理员可见
 * - 退出登录：通过 Dropdown 菜单触发
 * @returns {JSX.Element} 管理后台布局
 */
const AdminLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { admin, logout, isSuperAdmin } = useAuthStore()
  const { token: { colorBgContainer } } = theme.useToken()

  /** 侧边栏菜单项配置（根据权限动态生成） */
  const menuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '首页' },
    { key: '/admin/stores', icon: <ShopOutlined />, label: '门店管理' },
    { key: '/admin/members', icon: <TeamOutlined />, label: '会员管理' },
    { key: '/admin/recharge', icon: <DollarOutlined />, label: '充值管理' },
    { key: '/admin/consumption', icon: <ShoppingOutlined />, label: '消费管理' },
    { key: '/admin/appointments', icon: <CalendarOutlined />, label: '预约管理' },
    { key: '/admin/barbers', icon: <ScissorOutlined />, label: '理发师管理' },
    { key: '/admin/services', icon: <AppstoreOutlined />, label: '服务项目管理' },
    { key: '/admin/finance', icon: <AuditOutlined />, label: '财务对账' },
    { key: '/admin/admins', icon: <SafetyOutlined />, label: '管理员账号' },
  ]

  /** 处理退出登录：清除认证状态并跳转到登录页 */
  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 左侧侧边栏 */}
      <Sider breakpoint="lg" collapsedWidth={0}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          💈 会员管理
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        {/* 顶部 Header */}
        <Header style={{ background: colorBgContainer, padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={{ items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }] }}>
            <Button type="text" icon={<UserOutlined />}>{admin?.name}</Button>
          </Dropdown>
        </Header>
        {/* 主内容区 */}
        <Content style={{ margin: 24, padding: 24, background: colorBgContainer, borderRadius: 8, minHeight: 360 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
