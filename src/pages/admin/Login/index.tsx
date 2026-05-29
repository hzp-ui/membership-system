/**
 * @file pages/admin/Login.tsx - 管理员登录页
 * @description 使用 RPC 登录（不依赖 Supabase Auth）
 * @module pages/admin/Login
 */

import React, { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
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
      // Step 1: RPC 登录（直接查 admins 表，不依赖 auth.users）
      const { data: loginData, error: loginError } = await supabase.rpc('rpc_admin_login', {
        p_username: values.username,
        p_password: values.password,
      })

      if (loginError) {
        throw new Error(loginError.message)
      }

      // rpc_admin_login 返回格式: {"data": {...admin对象...}}
      const adminInfo = (loginData as any)?.data || loginData
      if (!adminInfo || !(adminInfo as any).id) {
        throw new Error('用户名或密码错误')
      }

      // Step 2: 保存到 store（RPC 模式不需要 JWT，用 SECURITY DEFINER 鉴权）
      const admin: Admin = {
        id: adminInfo.id,
        username: adminInfo.username,
        name: adminInfo.name,
        phone: adminInfo.phone,
        role: adminInfo.role,
        store_id: adminInfo.store_id,
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
