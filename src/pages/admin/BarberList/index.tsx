import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { getBarbers, createBarber, updateBarber, deleteBarber, getStores, getServices } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { TableSkeleton } from '@/components/Skeletons'

const BarberList: React.FC = () => {
  const { isSuperAdmin, storeId } = useAuthStore()
  const [barbers, setBarbers] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editBarber, setEditBarber] = useState<any>(null)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const sid = isSuperAdmin() ? undefined : storeId()

  const loadData = async () => {
    setLoading(true)
    try { const [dataRes, stoRes, svcRes] = await Promise.all([getBarbers(sid), getStores(), getServices(sid)]); setBarbers(dataRes.data || []); setStores(stoRes.data || []); setServices(svcRes.data?.records || svcRes.data || []) }
    catch { messageApi.error('加载理发师失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (Array.isArray(values.specialties)) values.specialties = values.specialties.join(',')
      if (editBarber) {
        await updateBarber(editBarber.id, values)
        messageApi.success('更新成功')
      } else {
        values.store_id = storeId()
        await createBarber(values)
        messageApi.success('创建成功')
      }
      setModalOpen(false)
      loadData()
    } catch (err: any) { messageApi.error(err.message || '操作失败') }
  }

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '擅长项目', dataIndex: 'specialties', key: 'specialties', render: (v: string | string[]) => { const arr = Array.isArray(v) ? v : (typeof v === 'string' ? v.split(',') : []); return arr.map((s, i) => <Tag key={i}>{String(s).trim()}</Tag>)} },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '在职' : '离职'}</Tag> },
    { title: '所属门店', dataIndex: 'store_id', key: 'storeId', render: (v: string) => (stores as any[])?.find((s: any) => s.id === v)?.name || '-' },
    {
      title: '操作', key: 'action', render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => { setEditBarber(record); form.setFieldsValue({ name: record.name, phone: record.phone, specialties: Array.isArray(record.specialties) ? record.specialties : (typeof record.specialties === 'string' ? record.specialties.split(',').map((s: string) => s.trim()) : []) }); setModalOpen(true) }}>编辑</Button>
          <Button type="link" danger onClick={async () => { await deleteBarber(record.id); messageApi.success('已删除'); loadData() }}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      {loading ? (
        <TableSkeleton columns={6} rows={10} />
      ) : (
        <>
          <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => { setEditBarber(null); form.resetFields(); setModalOpen(true) }}>新增理发师</Button>
          <Table dataSource={barbers} columns={columns} rowKey="id" loading={loading} />
        </>
      )}
      <Modal title={editBarber ? '编辑理发师' : '新增理发师'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label="手机号"><Input /></Form.Item>
          <Form.Item name="specialties" label="擅长项目">
            <Select mode="multiple" placeholder="请选择擅长项目">
              {services.map((s: any) => <Select.Option key={s.id} value={s.name}>{s.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="active">在职</Select.Option>
              <Select.Option value="inactive">离职</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default BarberList
