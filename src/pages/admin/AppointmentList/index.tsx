/**
 * @file AppointmentList.tsx
 * @description 预约管理页面组件
 * @module admin/AppointmentList
 */

import React, { useEffect, useState } from 'react'
import { Table, Input, Select, Button, Space, Tag, message, Modal, Form, DatePicker, Divider } from 'antd'
import { getAppointments, confirmAppointment, cancelAppointment, completeAppointment, getStores, getMembers, getBarbers, getServices, createAppointment } from '@/services/api'
import type { Dayjs } from 'dayjs'
import { useAuthStore } from '@/stores/auth'
import { getAppointmentStatusLabel, getAppointmentStatusColor, formatDate } from '@/utils'
import { TableSkeleton } from '@/components/Skeletons'
import type { AppointmentStatus } from '@/types'

/**
 * 预约管理页面组件
 * @component AppointmentList
 * @description 提供预约记录的查看、状态筛选和操作功能（确认/取消/完成）
 * @returns {JSX.Element} 预约管理页面
 */
const AppointmentList: React.FC = () => {
  const { isSuperAdmin, storeId } = useAuthStore()
  const [appointments, setAppointments] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [barbers, setBarbers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const sid = isSuperAdmin() ? undefined : storeId()

  /**
   * 加载预约数据
   */
  const loadData = async () => {
    setLoading(true)
    try {
      const [dataRes, stoRes] = await Promise.all([getAppointments(sid), getStores()])
      setAppointments(dataRes.data || [])
      setStores(stoRes.data || [])
    } catch { messageApi.error('加载预约失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  /** 加载下拉数据 */
  const loadOptions = async () => {
    const [mRes, bRes, sRes] = await Promise.all([getMembers(sid), getBarbers(sid), getServices(sid)])
    setMembers(mRes.data || [])
    setBarbers(bRes.data || [])
    setServices(sRes.data || [])
  }

  /** 新增预约 */
  const handleCreate = async (values: { member_id: string; barber_id: string; service_id: string; appointment_time: Dayjs }) => {
    setSubmitting(true)
    try {
      await createAppointment({
        member_id: values.member_id,
        barber_id: values.barber_id,
        service_id: values.service_id,
        appointment_time: values.appointment_time.format('YYYY-MM-DDTHH:mm:ss')
      })
      messageApi.success('预约创建成功')
      setModalOpen(false)
      form.resetFields()
      loadData()
    } catch { messageApi.error('创建预约失败') }
    finally { setSubmitting(false) }
  }

  /** 根据状态筛选后的预约记录 */
  const filtered = statusFilter ? appointments.filter((a: any) => a.status === statusFilter) : appointments

  /** 预约记录表格列配置 */
  const columns = [
    { title: '会员姓名', dataIndex: 'member_name', key: 'member_name', render: (v: string) => v || '-' },
    { title: '手机号', dataIndex: 'member_phone', key: 'member_phone', render: (v: string) => v || '-' },
    { title: '理发师', dataIndex: 'barber_name', key: 'barber_name', render: (v: string) => v || '-' },
    { title: '服务项目', dataIndex: 'service_name', key: 'service_name', render: (v: string) => v || '-' },
    { title: '预约时间', dataIndex: 'appointment_time', key: 'appointment_time', render: (v: string) => formatDate(v) },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: AppointmentStatus) => <Tag color={getAppointmentStatusColor(s)}>{getAppointmentStatusLabel(s)}</Tag> },
    { title: '所属门店', dataIndex: 'store_id', key: 'storeId', render: (v: string) => (stores as any[])?.find((s: any) => s.id === v)?.name || '-' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'pending' && <Button type="link" onClick={async () => { await confirmAppointment(record.id); messageApi.success('已确认'); loadData() }}>确认</Button>}
          {['pending', 'confirmed'].includes(record.status) && <Button type="link" danger onClick={async () => { await cancelAppointment(record.id); messageApi.success('已取消'); loadData() }}>取消</Button>}
          {record.status === 'confirmed' && <Button type="link" onClick={async () => { await completeAppointment(record.id); messageApi.success('已完成'); loadData() }}>完成</Button>}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      {loading ? (
        <TableSkeleton columns={8} rows={10} />
      ) : (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" onClick={() => { loadOptions(); setModalOpen(true) }}>+ 新增预约</Button>
            <Select placeholder="预约状态" allowClear style={{ width: 120 }} onChange={setStatusFilter}>
              <Select.Option value="pending">待确认</Select.Option>
              <Select.Option value="confirmed">已确认</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Space>
          <Table dataSource={filtered} columns={columns} rowKey="id" loading={loading} />
          <Modal title="新增预约" open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields() }} footer={null}>
            <Form form={form} layout="vertical" onFinish={handleCreate}>
              <Form.Item label="会员" name="member_id" rules={[{ required: true, message: '请选择会员' }]}>
                <Select placeholder="请选择会员" showSearch filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}>
                  {members.map(m => <Select.Option key={m.id} value={m.id} label={m.name}>{m.name} - {m.phone}</Select.Option>)}
                </Select>
              </Form.Item>
              <Form.Item label="理发师" name="barber_id" rules={[{ required: true, message: '请选择理发师' }]}>
                <Select placeholder="请选择理发师">
                  {barbers.map(b => <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>)}
                </Select>
              </Form.Item>
              <Form.Item label="服务项目" name="service_id" rules={[{ required: true, message: '请选择服务项目' }]}>
                <Select placeholder="请选择服务项目">
                  {services.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
                </Select>
              </Form.Item>
              <Form.Item label="预约时间" name="appointment_time" rules={[{ required: true, message: '请选择预约时间' }]}>
                <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => { setModalOpen(false); form.resetFields() }}>取消</Button>
                  <Button type="primary" htmlType="submit" loading={submitting}>创建</Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </div>
  )
}

export default AppointmentList
