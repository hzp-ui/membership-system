/**
 * @file pages/user/Booking.tsx - 用户预约页面
 * @description 会员端预约服务页面，采用分步流程：
 * - 第一步：选择理发师（仅显示在职理发师）
 * - 第二步：选择服务项目（根据会员等级显示折扣价格）
 * - 第三步：选择预约日期和时间，提交预约
 * @module pages/user/Booking
 */

import React, { useEffect, useState } from 'react'
import { Card, Steps, Button, List, Tag, DatePicker, TimePicker, message } from 'antd'
import { createAppointment, getBarbers, getServices } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { formatMoney, getLevelLabel } from '@/utils'
import dayjs from 'dayjs'
import type { MemberLevel } from '@/types'

/**
 * 用户预约页面组件
 * @component Booking
 * @description 三步式预约流程：选理发师 → 选服务 → 选时间
 * - 根据会员等级自动计算折扣价格
 * - 提交后预约状态为 pending（待确认）
 * @returns {JSX.Element} 用户预约页面
 */
const Booking: React.FC = () => {
  const { member } = useAuthStore()
  /** 当前步骤索引（0=选理发师, 1=选服务, 2=选时间） */
  const [step, setStep] = useState(0)
  const [barbers, setBarbers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  /** 当前选中的理发师 */
  const [selectedBarber, setSelectedBarber] = useState<any>(null)
  /** 当前选中的服务项目 */
  const [selectedService, setSelectedService] = useState<any>(null)
  const [appointmentDate, setAppointmentDate] = useState<dayjs.Dayjs | null>(null)
  const [appointmentTime, setAppointmentTime] = useState<dayjs.Dayjs | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  /** 页面加载时获取所属门店的理发师和服务项目 */
  useEffect(() => {
    if (!member?.store_id) return
    const load = async () => {
      try {
        const [bRes, sRes] = await Promise.all([
          getBarbers(member.store_id),
          getServices(member.store_id),
        ])
        setBarbers((bRes.data || []).filter((b: any) => b.status === 'active'))
        setServices(sRes.data || [])
      } catch {}
    }
    load()
  }, [member])

  /**
   * 根据会员等级计算服务折扣价格
   * @function getDiscountPrice
   * @param {any} service - 服务项目对象
   * @returns {number} 折扣后的价格
   */
  const getDiscountPrice = (service: any) => {
    if (!member) return service.price
    const discountKey = `discount_${member.level}` as const
    return Math.round(service.price * (service[discountKey] || 1) * 100) / 100
  }

  /**
   * 提交预约
   * @function handleSubmit
   * @description 组装预约信息并提交到后端，成功后重置表单
   * @async
   */
  const handleSubmit = async () => {
    if (!member || !selectedBarber || !selectedService || !appointmentDate || !appointmentTime) return
    setSubmitting(true)
    try {
      const time = appointmentDate.hour(appointmentTime.hour()).minute(appointmentTime.minute()).second(0).toISOString()
      await createAppointment({
        member_id: member.id,
        barber_id: selectedBarber.id,
        service_id: selectedService.id,
        appointment_time: time,
        store_id: member.store_id,
      } as any)
      messageApi.success('预约成功！等待确认')
      // 重置所有步骤状态
      setStep(0)
      setSelectedBarber(null)
      setSelectedService(null)
      setAppointmentDate(null)
      setAppointmentTime(null)
    } catch (err: any) { messageApi.error(err.message || '预约失败') }
    finally { setSubmitting(false) }
  }

  return (
    <div>
      {contextHolder}
      <Card title="预约服务">
        <Steps
          current={step}
          items={[
            { title: '选择理发师' },
            { title: '选择服务' },
            { title: '选择时间' },
          ]}
          style={{ marginBottom: 24 }}
        />

        {/* 第一步：选择理发师 */}
        {step === 0 && (
          <List
            grid={{ gutter: 16, column: 3 }}
            dataSource={barbers}
            renderItem={barber => (
              <List.Item>
                <Card
                  hoverable
                  style={selectedBarber?.id === barber.id ? { borderColor: '#1677ff' } : {}}
                  onClick={() => { setSelectedBarber(barber); setStep(1) }}
                >
                  <Card.Meta
                    title={barber.name}
                    description={
                      <>
                        <Tag color="blue">{barber.specialties?.join(', ')}</Tag>
                      </>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        )}

        {/* 第二步：选择服务 */}
        {step === 1 && (
          <List
            grid={{ gutter: 16, column: 3 }}
            dataSource={services}
            renderItem={service => (
              <List.Item>
                <Card
                  hoverable
                  style={selectedService?.id === service.id ? { borderColor: '#1677ff' } : {}}
                  onClick={() => { setSelectedService(service); setStep(2) }}
                >
                  <Card.Meta
                    title={service.name}
                    description={
                      <>
                        <div>原价: {formatMoney(service.price)}</div>
                        <div style={{ color: '#f50', fontSize: 16 }}>
                          会员价: {formatMoney(getDiscountPrice(service))}
                        </div>
                      </>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        )}

        {/* 第三步：选择时间 */}
        {step === 2 && (
          <div style={{ maxWidth: 400 }}>
            <DatePicker
              value={appointmentDate}
              onChange={setAppointmentDate}
              style={{ width: '100%', marginBottom: 16 }}
              placeholder="选择日期"
            />
            <TimePicker
              value={appointmentTime}
              onChange={setAppointmentTime}
              style={{ width: '100%', marginBottom: 16 }}
              placeholder="选择时间"
              format="HH:mm"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => setStep(1)}>上一步</Button>
              <Button type="primary" onClick={handleSubmit} loading={submitting}>提交预约</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Booking
