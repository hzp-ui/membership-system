/**
 * @file pages/user/Login.tsx - 用户登录/注册页
 * @description 使用 Supabase Auth 登录/注册
 * @module pages/user/Login
 */

import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Select, Tabs, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { memberLogin, memberRegister, getStores } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

/** 用户登录/注册组件 */
const UserLogin: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState<any[]>([])
  const navigate = useNavigate()
  const { setMember } = useAuthStore()
  const [messageApi, contextHolder] = message.useMessage()

  // 加载门店列表
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getStores()
        setStores(res.data || [])
      } catch {}
    }
    load()
  }, [])

  /** 处理登录 */
  const onLogin = async (values: any) => {
    setLoading(true)
    try {
      const result = await memberLogin(values.phone, values.password, values.store_id)
      setMember(result.data)
      messageApi.success('登录成功')
      navigate('/user/profile')
    } catch (err: any) {
      messageApi.error(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  /** 处理注册 */
  const onRegister = async (values: any) => {
    setLoading(true)
    try {
      const result = await memberRegister({
        phone: values.phone,
        password: values.password,
        name: values.name,
        store_id: values.store_id,
      })
      setMember(result.data)
      messageApi.success('注册成功')
      navigate('/user/profile')
    } catch (err: any) {
      messageApi.error(err.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      {contextHolder}
      <Card>
        <Tabs
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form onFinish={onLogin}>
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                    ]}
                  >
                    <Input placeholder="手机号" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password placeholder="密码" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="store_id"
                    rules={[{ required: true, message: '请选择门店' }]}
                  >
                    <Select placeholder="选择门店" size="large">
                      {stores.filter((s: any) => s.status === 'active').map((s: any) => (
                        <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                      ))}
                    </Select>
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
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form onFinish={onRegister}>
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                    ]}
                  >
                    <Input placeholder="手机号" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 8, message: '密码长度至少 8 位' },
                      { pattern: /[A-Z]/, message: '密码必须包含大写字母' },
                      { pattern: /[a-z]/, message: '密码必须包含小写字母' },
                      { pattern: /[0-9]/, message: '密码必须包含数字' },
                    ]}
                  >
                    <Input.Password
                      placeholder="密码（至少8位，包含大小写和数字）"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    name="name"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input placeholder="姓名" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="store_id"
                    rules={[{ required: true, message: '请选择门店' }]}
                  >
                    <Select placeholder="选择门店" size="large">
                      {stores.filter((s: any) => s.status === 'active').map((s: any) => (
                        <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                    >
                      注册
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default UserLogin
