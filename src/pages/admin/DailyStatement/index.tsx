import React from 'react'
import { Card, Table, DatePicker, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

const { RangePicker } = DatePicker

// 每日对账详情 - 已合并到 FinanceReport 页面
const DailyStatement: React.FC = () => {
  const navigate = useNavigate()
  return (
    <Card
      title="每日对账单"
      extra={<Button type="primary" onClick={() => navigate('/admin/finance')}>进入财务对账</Button>}
    >
      <p style={{ color: '#999' }}>每日对账功能已合并到财务对账页面，包含"财务汇总"和"每日对账单"两个Tab</p>
    </Card>
  )
}

export default DailyStatement
