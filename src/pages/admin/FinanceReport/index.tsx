/**
 * @file index.tsx
 * @description 财务对账页面组件
 * @module admin/FinanceReport
 */

import React, { useEffect, useState } from 'react'
import { Card, DatePicker, Button, Table, Row, Col, Statistic, Tabs, Select, Space, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { getFinanceSummary, getDailyStatements } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { formatMoney, downloadCsv } from '@/utils'
import { StatisticSkeleton, TableSkeleton } from '@/components/Skeletons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

/**
 * 财务对账页面组件
 * @component FinancePage
 * @description 提供财务汇总统计和每日对账单查看功能，支持CSV导出
 * @returns {JSX.Element} 财务对账页面
 */
const FinancePage: React.FC = () => {
  const { isSuperAdmin, storeId } = useAuthStore()
  const [activeTab, setActiveTab] = useState('summary')
  const [storeIdFilter, setStoreIdFilter] = useState<string | undefined>(isSuperAdmin() ? undefined : storeId())
  const [summary, setSummary] = useState<any>({})
  const [dailyData, setDailyData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const params: any = {
    store_id: storeIdFilter,
    start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
    end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
  }

  /** 导出财务数据到CSV */
  const handleExport = async () => {
    try {
      const res = await getDailyStatements(params)
      if (res.error) throw res.error
      downloadCsv((res.data as any)?.data || [], 'finance_report.csv')
    } catch { messageApi.error('导出失败') }
  }

  /** 并行加载财务数据 */
  const loadData = async () => {
    setLoading(true)
    try {
      const [sumRes, dailyRes] = await Promise.all([getFinanceSummary(params), getDailyStatements(params)])
      if (sumRes.error) throw sumRes.error
      if (dailyRes.error) throw dailyRes.error
      setSummary((sumRes.data as any)?.data || {})
      setDailyData((dailyRes.data as any)?.data || [])
    } catch { messageApi.error('加载财务数据失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [storeIdFilter])

  /** 每日对账单表格列配置 */
  const dailyColumns = [
    { title: '日期', dataIndex: 'date', key: 'date', render: (v: string) => v?.split('T')[0] || v, defaultSortOrder: 'descend' as 'descend' | 'ascend' | undefined, sorter: (a: any, b: any) => a.date.localeCompare(b.date) },
    { title: '充值笔数', dataIndex: 'recharge_count', key: 'recharge_count' },
    { title: '充值金额', dataIndex: 'recharge_amount', key: 'recharge_amount', render: (v: number) => formatMoney(v) },
    { title: '消费笔数', dataIndex: 'consumption_count', key: 'consumption_count' },
    { title: '消费金额', dataIndex: 'consumption_amount', key: 'consumption_amount', render: (v: number) => formatMoney(v) },
  ]

  return (
    <div>
      {contextHolder}
      <Space style={{ marginBottom: 16 }}>
        <RangePicker onChange={(dates) => setDateRange(dates)} />
        <Button onClick={loadData}>查询</Button>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>导出CSV</Button>
      </Space>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'summary', label: '财务汇总', children: loading ? <StatisticSkeleton /> : (
            <Row gutter={[16, 16]}>
              <Col span={6}><Card><Statistic title="充值收入" value={summary.recharge_income || 0} prefix="¥" precision={2} /></Card></Col>
              <Col span={6}><Card><Statistic title="消费收入" value={summary.consumption_income || 0} prefix="¥" precision={2} /></Card></Col>
              <Col span={6}><Card><Statistic title="退款金额" value={summary.refund_amount || 0} prefix="¥" precision={2} /></Card></Col>
              <Col span={6}><Card><Statistic title="净收入" value={summary.net_income || 0} prefix="¥" precision={2} valueStyle={{ color: '#3f8600' }} /></Card></Col>
            </Row>
          ),
        },
        {
          key: 'daily', label: '每日对账单', children: loading ? <TableSkeleton columns={5} rows={10} /> : (
            <Table dataSource={dailyData} columns={dailyColumns} rowKey="date" loading={loading} />
          ),
        },
      ]} />
    </div>
  )
}

export default FinancePage
