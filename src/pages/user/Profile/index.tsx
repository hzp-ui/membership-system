/**
 * @file index.tsx
 * @description 个人中心页面组件
 * @module user/Profile
 */

import React, { useEffect, useState } from 'react'
import { Card, Descriptions, Tag, Table, message } from 'antd'
import { useAuthStore } from '@/stores/auth'
import { getLevelLabel, getLevelColor, formatMoney, formatDate } from '@/utils'
import { getConsumptionRecords } from '@/services/api'

/**
 * 个人中心页面组件
 * @component Profile
 * @description 展示会员个人信息、余额积分和消费记录
 * @returns {JSX.Element | null} 个人中心页面或 null（未登录时）
 */
const Profile: React.FC = () => {
  const { member } = useAuthStore()
  const [consumptions, setConsumptions] = useState<any[]>([])
  const [messageApi, contextHolder] = message.useMessage()

  /**
   * 加载当前会员的消费记录
   * @effect
   * @dependency member
   */
  useEffect(() => {
    if (!member?.store_id) return
    const load = async () => {
      try {
        const res = await getConsumptionRecords(member.store_id)
        const data = (res.data || []).filter((r: any) => r.member_id === member.id)
        setConsumptions(data)
      } catch {}
    }
    load()
  }, [member])

  if (!member) return null

  return (
    <div>
      {contextHolder}
      <Card title="个人信息" style={{ marginBottom: 16 }}>
        <Descriptions column={1}>
          <Descriptions.Item label="姓名">{member.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="手机号">{member.phone}</Descriptions.Item>
          <Descriptions.Item label="会员等级"><Tag color={getLevelColor(member.level)}>{getLevelLabel(member.level)}</Tag></Descriptions.Item>
          <Descriptions.Item label="注册时间">{formatDate(member.created_at)}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="余额与积分" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 32, fontSize: 20 }}>
          <div>余额: <strong style={{ color: '#1677ff' }}>{formatMoney(member.balance)}</strong></div>
          <div>积分: <strong style={{ color: '#faad14' }}>{member.points}</strong></div>
        </div>
      </Card>
      <Card title="消费记录">
        <Table
          dataSource={consumptions}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '金额', dataIndex: 'amount', render: (v: number) => formatMoney(v) },
            { title: '服务项目', dataIndex: 'service_name' },
            { title: '理发师', dataIndex: 'barber_name' },
            { title: '时间', dataIndex: 'created_at', render: (v: string) => formatDate(v) },
          ]}
        />
      </Card>
    </div>
  )
}

export default Profile
