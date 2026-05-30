/**
 * @file AppointmentList.tsx
 * @description 预约管理页面组件
 * @module admin/AppointmentList
 */

import React, { useEffect, useState } from 'react'
import { Table, Input, Select, Button, Space, Tag, message } from 'antd'
import { getAppointments, confirmAppointment, cancelAppointment, completeAppointment } from '@/services/api'
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
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | undefined>()
  const [messageApi, contextHolder] = message.useMessage()

  const sid = isSuperAdmin() ? undefined : storeId()

  /**
   * 加载预约数据
   */
  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getAppointments(sid)
      setAppointments(res.data || [])
    } catch { messageApi.error('加载预约失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

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
    { title: '所属门店', dataIndex: 'store_name', key: 'store_name', render: (v: string) => v || '-' },
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
            <Select placeholder="预约状态" allowClear style={{ width: 120 }} onChange={setStatusFilter}>
              <Select.Option value="pending">待确认</Select.Option>
              <Select.Option value="confirmed">已确认</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Space>
          <Table dataSource={filtered} columns={columns} rowKey="id" loading={loading} />
        </>
      )}
    </div>
  )
}

export default AppointmentList
