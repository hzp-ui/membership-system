/**
 * @file layouts/UserLayout.tsx - 用户端布局组件
 * @description 提供会员端页面布局，包含：
 * - 主内容区域（通过 React Router Outlet 渲染子路由）
 * - 底部固定 Tab 导航栏（我的/充值/预约/预约记录）
 * - 适配移动端（最大宽度 480px 居中显示）
 * @module layouts/UserLayout
 */

import React from 'react'
import { Layout } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { UserOutlined, WalletOutlined, CalendarOutlined, FileTextOutlined } from '@ant-design/icons'

const { Content } = Layout

/** 底部 Tab 导航配置 */
const tabs = [
  { key: '/user/profile', title: '我的', icon: <UserOutlined /> },
  { key: '/user/recharge', title: '充值', icon: <WalletOutlined /> },
  { key: '/user/booking', title: '预约', icon: <CalendarOutlined /> },
  { key: '/user/appointments', title: '预约记录', icon: <FileTextOutlined /> },
]

/**
 * 用户端布局组件
 *
 * 功能说明：
 * - 移动端优先设计：最大宽度 480px，居中显示
 * - 底部固定导航：4 个 Tab 切换不同功能模块
 * - 当前激活 Tab 高亮显示（蓝色）
 */
const UserLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  /** 根据当前路径确定激活的 Tab */
  const activeTab = tabs.find(t => location.pathname.startsWith(t.key))?.key || '/user/profile'

  return (
    <Layout style={{ minHeight: '100vh', maxWidth: 480, margin: '0 auto', background: '#f5f5f5' }}>
      {/* 主内容区 */}
      <Content style={{ padding: 16, paddingBottom: 60 }}>
        <Outlet />
      </Content>
      {/* 底部固定 Tab 导航 */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0' }}>
          {tabs.map(tab => (
            <div
              key={tab.key}
              onClick={() => navigate(tab.key)}
              style={{
                flex: 1, textAlign: 'center', cursor: 'pointer',
                color: activeTab === tab.key ? '#1677ff' : '#999',
                fontSize: 12,
              }}
            >
              <div style={{ fontSize: 20 }}>{tab.icon}</div>
              <div>{tab.title}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default UserLayout