/**
 * @file index.tsx
 * @description 服务项目管理页面组件
 * @module admin/ServiceList
 */

import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message, Popconfirm } from 'antd'
import { PlusOutlined, SettingOutlined } from '@ant-design/icons'
import { getServices, createService, updateService, deleteService,
  getServiceTypes, createServiceType, deleteServiceType } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { formatMoney } from '@/utils'

/**
 * 服务项目管理页面组件
 * @component ServiceList
 * @description 提供服务的增删改查功能，支持各会员等级的折扣配置
 * @returns {JSX.Element} 服务项目管理页面
 */
const ServiceList: React.FC = () => {
  const { isSuperAdmin, storeId } = useAuthStore()
  const [services, setServices] = useState<any[]>([])
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editService, setEditService] = useState<any>(null)
  const [form] = Form.useForm()
  const [typeModalOpen, setTypeModalOpen] = useState(false)
  const [typeForm] = Form.useForm()
  const [newTypeName, setNewTypeName] = useState('')
  const [messageApi, contextHolder] = message.useMessage()

  const sid = isSuperAdmin() ? undefined : storeId()

  const loadData = async () => {
    setLoading(true)
    try {
      const [sRes, tRes] = await Promise.all([getServices(sid), getServiceTypes()])
      if (sRes.error) throw sRes.error
      if (tRes.error) throw tRes.error
      setServices(sRes.data || [])
      setServiceTypes(tRes.data || [])
    } catch { messageApi.error('加载失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (editService) {
        await updateService(editService.id, values)
        messageApi.success('更新成功')
      } else {
        values.store_id = storeId()
        await createService(values)
        messageApi.success('创建成功')
      }
      setModalOpen(false)
      loadData()
    } catch (err: any) { messageApi.error(err.message || '操作失败') }
  }

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return
    try {
      const res = await createServiceType(newTypeName.trim())
      if (res.error) throw res.error
      messageApi.success('类型已添加')
      setNewTypeName('')
      const tRes = await getServiceTypes()
      if (!tRes.error) setServiceTypes(tRes.data || [])
    } catch (err: any) { messageApi.error(err.message || '添加失败') }
  }

  const handleDeleteType = async (id: string) => {
    try {
      const res = await deleteServiceType(id)
      if (res.error) throw res.error
      messageApi.success('类型已删除')
      const tRes = await getServiceTypes()
      if (!tRes.error) setServiceTypes(tRes.data || [])
    } catch (err: any) { messageApi.error(err.message || '删除失败') }
  }

  const columns = [
    { title: '服务类型', dataIndex: 'type', key: 'type' },
    { title: '服务名称', dataIndex: 'name', key: 'name' },
    { title: '原价', dataIndex: 'price', key: 'price', render: (v: number) => formatMoney(v) },
    { title: '普通折扣', dataIndex: 'discount_normal', key: 'discount_normal', render: (v: number) => `${(v * 100).toFixed(0)}%` },
    { title: '银卡折扣', dataIndex: 'discount_silver', key: 'discount_silver', render: (v: number) => `${(v * 100).toFixed(0)}%` },
    { title: '金卡折扣', dataIndex: 'discount_gold', key: 'discount_gold', render: (v: number) => `${(v * 100).toFixed(0)}%` },
    { title: '钻石折扣', dataIndex: 'discount_diamond', key: 'discount_diamond', render: (v: number) => `${(v * 100).toFixed(0)}%` },
    { title: '所属门店', dataIndex: 'store_name', key: 'store_name', render: (v: string) => v || '-' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => { setEditService(record); form.setFieldsValue(record); setModalOpen(true) }}>编辑</Button>
          <Button type="link" danger onClick={async () => { await deleteService(record.id); messageApi.success('已删除'); loadData() }}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => { setEditService(null); form.resetFields(); setModalOpen(true) }}>新增服务项目</Button>
      <Table dataSource={services} columns={columns} rowKey="id" loading={loading} scroll={{ x: 1000 }} />
      <Modal title={editService ? '编辑服务项目' : '新增服务项目'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="服务类型" rules={[{ required: true }]}>
            <Select
              placeholder="请选择服务类型"
              dropdownRender={menu => (
                <>
                  {menu}
                  <div style={{ padding: 8, borderTop: '1px solid #f0f0f0' }}>
                    <Button type="link" icon={<SettingOutlined />} onClick={() => { setTypeModalOpen(true) }}>管理类型</Button>
                  </div>
                </>
              )}
            >
              {serviceTypes.map((t: any) => (
                <Select.Option key={t.id} value={t.name}>{t.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="服务名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="price" label="原价" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Space>
            <Form.Item name="discount_normal" label="普通折扣" rules={[{ required: true }]}><InputNumber min={0} max={1} step={0.05} /></Form.Item>
            <Form.Item name="discount_silver" label="银卡折扣" rules={[{ required: true }]}><InputNumber min={0} max={1} step={0.05} /></Form.Item>
            <Form.Item name="discount_gold" label="金卡折扣" rules={[{ required: true }]}><InputNumber min={0} max={1} step={0.05} /></Form.Item>
            <Form.Item name="discount_diamond" label="钻石折扣" rules={[{ required: true }]}><InputNumber min={0} max={1} step={0.05} /></Form.Item>
          </Space>
        </Form>
      </Modal>
      <Modal title="管理服务类型" open={typeModalOpen} onCancel={() => setTypeModalOpen(false)} footer={null}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {serviceTypes.map((t: any) => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t.name}</span>
              <Popconfirm title="确定删除？" onConfirm={() => handleDeleteType(t.id)}>
                <Button type="link" danger size="small">删除</Button>
              </Popconfirm>
            </div>
          ))}
          <Input.Search
            placeholder="输入新类型名称"
            value={newTypeName}
            onChange={e => setNewTypeName(e.target.value)}
            onSearch={handleCreateType}
            enterButton="添加"
          />
        </Space>
      </Modal>
    </div>
  )
}

export default ServiceList
