/**
 * @file RechargeManage.tsx
 * @description 充值管理页面组件
 * @module admin/RechargeManage
 */

import React, { useEffect, useState } from 'react'
import { Table, Input, Select, Button, Modal, Form, Space, DatePicker, Tabs, message, InputNumber } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { getRechargeRecords, getPackages, createPackage, updatePackage, deletePackage } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { formatMoney, formatDate } from '@/utils'

const { RangePicker } = DatePicker

/**
 * 充值管理页面组件
 * @component RechargeManage
 * @description 提供充值记录查看和充值套餐 CRUD 管理功能
 * @returns {JSX.Element} 充值管理页面
 */
const RechargeManage: React.FC = () => {
  const { isSuperAdmin, storeId } = useAuthStore()
  const [activeTab, setActiveTab] = useState('records')
  const [records, setRecords] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pkgModal, setPkgModal] = useState(false)
  const [editPkg, setEditPkg] = useState<any>(null)
  const [form] = Form.useForm()

  const sid = isSuperAdmin() ? undefined : storeId()
  const [messageApi, contextHolder] = message.useMessage()

  /**
   * 加载充值记录数据
   */
  const loadRecords = async () => {
    setLoading(true)
    try { const res = await getRechargeRecords(sid); setRecords(res.data || []) }
    catch (e) { messageApi.error('加载充值记录失败') }
    finally { setLoading(false) }
  }

  /**
   * 加载充值套餐数据
   */
  const loadPackages = async () => {
    setLoading(true)
    try { const res = await getPackages(sid); setPackages(res.data || []) }
    catch (e) { messageApi.error('加载套餐失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadRecords(); loadPackages() }, [])

  /**
   * 保存充值套餐（新增或更新）
   */
  const handleSavePkg = async () => {
    try {
      const values = await form.validateFields()
      values.store_id = storeId()
      if (editPkg) {
        await updatePackage(editPkg.id, values)
        messageApi.success('更新成功')
      } else {
        await createPackage(values)
        messageApi.success('创建成功')
      }
      setPkgModal(false)
      loadPackages()
    } catch (err: any) { messageApi.error(err.message || '操作失败') }
  }

  /** 充值记录表格列配置 */
  const recordColumns = [
    { title: '会员姓名', dataIndex: 'member_name', key: 'member_name', render: (v: string) => v || '-' },
    { title: '手机号', dataIndex: 'member_phone', key: 'member_phone', render: (v: string) => v || '-' },
    { title: '充值金额', dataIndex: 'amount', key: 'amount', render: (v: number) => formatMoney(v) },
    { title: '赠送金额', dataIndex: 'bonus', key: 'bonus', render: (v: number) => formatMoney(v) },
    { title: '套餐名称', dataIndex: 'package_name', key: 'package_name' },
    { title: '所属门店', dataIndex: 'store_name', key: 'store_name', render: (v: string) => v || '-' },
    { title: '充值时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDate(v) },
  ]

  /** 充值套餐表格列配置 */
  const pkgColumns = [
    { title: '套餐名称', dataIndex: 'name', key: 'name' },
    { title: '充值金额', dataIndex: 'amount', key: 'amount', render: (v: number) => formatMoney(v) },
    { title: '赠送金额', dataIndex: 'bonus', key: 'bonus', render: (v: number) => formatMoney(v) },
    { title: '所属门店', dataIndex: 'store_name', key: 'store_name', render: (v: string) => v || '-' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => { setEditPkg(record); form.setFieldsValue(record); setPkgModal(true) }}>编辑</Button>
          <Button type="link" danger onClick={async () => { await deletePackage(record.id); messageApi.success('已删除'); loadPackages() }}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'records', label: '充值记录', children: <Table dataSource={records} columns={recordColumns} rowKey="id" loading={loading} /> },
        {
          key: 'packages', label: '充值套餐', children: (
            <div>
              <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => { setEditPkg(null); form.resetFields(); setPkgModal(true) }}>新增套餐</Button>
              <Table dataSource={packages} columns={pkgColumns} rowKey="id" loading={loading} />
            </div>
          ),
        },
      ]} />
      <Modal title={editPkg ? '编辑套餐' : '新增套餐'} open={pkgModal} onOk={handleSavePkg} onCancel={() => setPkgModal(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="套餐名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="amount" label="充值金额" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="bonus" label="赠送金额" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RechargeManage
