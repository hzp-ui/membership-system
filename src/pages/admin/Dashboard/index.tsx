import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Select, DatePicker, Statistic } from 'antd'
import { ArrowUpOutlined, TeamOutlined, FireOutlined } from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { getRevenueStats, getMemberGrowthStats, getHotServicesStats } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import dayjs from 'dayjs'
import type { StatItem, HotService } from '@/types'

const { RangePicker } = DatePicker

const Dashboard: React.FC = () => {
  const { isSuperAdmin, storeId } = useAuthStore()
  const [storeIdFilter, setStoreIdFilter] = useState<string | undefined>(isSuperAdmin() ? undefined : storeId())
  const [revenueData, setRevenueData] = useState<StatItem[]>([])
  const [memberData, setMemberData] = useState<StatItem[]>([])
  const [hotServices, setHotServices] = useState<HotService[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [revRes, memRes, hotRes] = await Promise.all([
        getRevenueStats({ store_id: storeIdFilter, dimension: 'day' }),
        getMemberGrowthStats({ store_id: storeIdFilter, dimension: 'day' }),
        getHotServicesStats({ store_id: storeIdFilter }),
      ])
      setRevenueData((revRes.data as any)?.data || [])
      setMemberData((memRes.data as any)?.data || [])
      setHotServices((hotRes.data as any)?.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [storeIdFilter])

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card loading={loading}>
            <Statistic title="营业额" value={revenueData.reduce((s, d) => s + (d.total_amount || 0), 0)} prefix="¥" precision={2} />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="营业额趋势" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total_amount" stroke="#1677ff" name="营业额" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="会员增长" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memberData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#52c41a" name="新增会员" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
      <Card title="🔥 热门服务" style={{ marginTop: 16 }} loading={loading}>
        {hotServices.map((s, i) => (
          <div key={s.service_name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span>{i + 1}. {s.service_name}</span>
            <span>{s.count} 次</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

export default Dashboard
