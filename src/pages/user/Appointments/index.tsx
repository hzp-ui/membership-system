/**
 * @file pages/user/Appointments.tsx - 用户预约记录页面
 * @description 会员端预约记录列表页面，展示：
 * - 当前会员的所有预约记录
 * - 预约状态标签（待确认/已确认/已完成/已取消）
 * - 待确认或已确认状态的预约可取消操作
 * @module pages/user/Appointments
 */

import React, { useEffect, useState } from 'react'
import { Card, List, Tag, Button, message } from 'antd'
import { getAppointments, cancelAppointment } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { getAppointmentStatusLabel, getAppointmentStatusColor, formatDate } from '@/utils'
import type { AppointmentStatus } from '@/types'

/**
 * 用户预约记录页面组件
 * @component UserAppointments
 * @description 展示当前会员的预约列表，支持取消待确认/已确认的预约
 * @returns {JSX.Element} 预约记录页面
 */
const UserAppointments: React.FC = () => {
  const { member } = useAuthStore()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  /**
   * 加载当前会员的预约记录
   */
  const loadData = async () => {
    if (!member) return
    setLoading(true)
    try {
      const res = await getAppointments(member.store_id)
      // 筛选当前会员的预约记录
      setAppointments((res.data || []).filter((a: any) => a.member_id === member.id))
    } catch { messageApi.error('加载预约记录失败') }
    finally { setLoading(false) }
  }

  /** 页面加载时获取预约数据 */
  useEffect(() => { loadData() }, [member])

  /**
   * 取消预约
   * @param {string} id - 预约记录 ID
   */
  const handleCancel = async (id: string) => {
    try {
      await cancelAppointment(id)
      messageApi.success('已取消')
      loadData()
    } catch (err: any) { messageApi.error(err.message || '取消失败') }
  }

  return (
    <Card title="预约记录">
      {contextHolder}
      <List
        loading={loading}
        dataSource={appointments}
        renderItem={(item: any) => (
          <List.Item
            extra={
              // 待确认或已确认状态才显示取消按钮
              ['pending', 'confirmed'].includes(item.status) && (
                <Button danger size="small" onClick={() => handleCancel(item.id)}>取消</Button>
              )
            }
          >
            <List.Item.Meta
              title={
                <span>
                  <Tag color={getAppointmentStatusColor(item.status as AppointmentStatus)}>
                    {getAppointmentStatusLabel(item.status as AppointmentStatus)}
                  </Tag>
                  {item.barbers?.name} - {item.services?.name}
                </span>
              }
              description={`预约时间: ${formatDate(item.appointment_time)}`}
            />
          </List.Item>
        )}
      />
    </Card>
  )
}

export default UserAppointments
