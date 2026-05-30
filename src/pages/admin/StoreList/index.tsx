/**
 * @file pages/admin/StoreList.tsx - 门店管理页面
 * @description 管理员端的门店列表 CRUD 页面
 * - 支持新增/编辑门店（名称、地址、电话、负责人）
 * - 支持切换门店状态（启用/停用）
 * - 仅超级管理员可见此页面
 * @module pages/admin/StoreList
 */

import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { getStores, createStore, updateStore } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { getStoreStatusLabel } from '@/utils'
import { TableSkeleton } from '@/components/Skeletons'
import type { Store, StoreStatus } from '@/types'

/** 门店管理页面组件 */
const StoreList: React.FC = () => {
  const { isSuperAdmin } = useAuthStore()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editStore, setEditStore] = useState<Store | null>(null)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  /** 加载门店列表数据 */
  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getStores()
      // 防御：确保数据是数组（rpc_get_stores 修复前可能返回对象）
      const data = res.data
      setStores(Array.isArray(data) ? data : (data ? [data] : []))
    } catch (err: any) { messageApi.error('加载门店失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  /** 处理保存（新建或编辑） */
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (editStore) {
        await updateStore(editStore.id, values)
        messageApi.success('更新成功')
      } else {
        await createStore(values)
        messageApi.success('创建成功')
      }
      setModalOpen(false)
      form.resetFields()
      loadData()
    } catch (err: any) { messageApi.error(err.message || '操作失败') }
  }

  /** 表格列定义 */
  const columns = [
    { title: '门店名称', dataIndex: 'name', key: 'name' },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '联系电话', dataIndex: 'phone', key: 'phone' },
    { title: '负责人', dataIndex: 'manager', key: 'manager' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: StoreStatus) => <Tag color={s === 'active' ? 'green' : 'red'}>{getStoreStatusLabel(s)}</Tag> },
    {
      title: '操作', key: 'action', render: (_: any, record: Store) => (
        <Space>
          <Button type="link" onClick={() => { setEditStore(record); form.setFieldsValue(record); setModalOpen(true) }}>编辑</Button>
          <Button type="link" onClick={async () => {
            await updateStore(record.id, { status: record.status === 'active' ? 'inactive' : 'active' })
            messageApi.success('状态已切换')
            loadData()
          }}>{record.status === 'active' ? '停用' : '启用'}</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      {loading ? (
        <TableSkeleton columns={6} rows={5} />
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditStore(null); form.resetFields(); setModalOpen(true) }}>新增门店</Button>
          </div>
          <Table dataSource={stores} columns={columns} rowKey="id" loading={loading} />
        </>
      )}
      <Modal title={editStore ? '编辑门店' : '新增门店'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="门店名称" rules={[{ required: true, message: '请输入门店名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址"><Input /></Form.Item>
          <Form.Item name="phone" label="联系电话"><Input /></Form.Item>
          <Form.Item name="manager" label="负责人"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default StoreList
