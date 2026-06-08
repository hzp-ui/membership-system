/**
 * @file pages/admin/Login.tsx - 管理员登录页
 * @description 使用 REST API 登录（替代 Supabase RPC）
 * @module pages/admin/Login
 */

import React, { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { Admin } from '@/types'

/** 管理员登录组件 */
const AdminLogin: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAdmin } = useAuthStore()
  const [messageApi, contextHolder] = message.useMessage()

  /** 处理登录 */
  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      // REST API 登录
      const loginData = await adminLogin(values.username, values.password)
      // loginData = { token, admin }
      if (!loginData || !loginData.token) {
        throw new Error('用户名或密码错误')
      }

      // 后端返回 { token, userId, username, name, role, storeId }，映射为前端 Admin
      const admin: Admin = {
        id: loginData.userId,
        username: loginData.username,
        name: loginData.name,
        phone: loginData.phone ?? null,
        role: loginData.role,
        store_id: loginData.storeId ?? undefined,
        token: loginData.token,
      }

      setAdmin(admin)
      messageApi.success('登录成功')
      navigate('/admin/dashboard')
    } catch (err: any) {
      messageApi.error(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      {contextHolder}
      <Card title="🔒 管理后台登录" style={{ width: 400 }}>
        <Form onFinish={onFinish}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default AdminLogin
