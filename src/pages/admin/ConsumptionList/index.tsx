/**
 * @file ConsumptionList.tsx
 * @description 消费记录列表页面组件
 * @module admin/ConsumptionList
 */

import React, { useEffect, useState } from 'react'
import { Table, Input, DatePicker, Space, message } from 'antd'
import { getConsumptionRecords } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { formatMoney, formatDate } from '@/utils'
import { TableSkeleton } from '@/components/Skeletons'

/**
 * 消费记录列表页面组件
 * @component ConsumptionList
 * @description 展示会员消费记录，支持搜索功能
 * @returns {JSX.Element} 消费记录列表页面
 */
const ConsumptionList: React.FC = () => {
  const { isSuperAdmin, storeId } = useAuthStore()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [messageApi, contextHolder] = message.useMessage()

  const sid = isSuperAdmin() ? undefined : storeId()

  /**
   * 加载消费记录数据
   */
  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getConsumptionRecords(sid)
      setRecords(res.data || [])
    } catch { messageApi.error('加载消费记录失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  /** 根据搜索条件过滤后的记录 */
  const filtered = search
    ? records.filter((r: any) => r.member_name?.includes(search) || r.member_phone?.includes(search))
    : records

  /** 消费记录表格列配置 */
  const columns = [
    { title: '会员姓名', dataIndex: 'member_name', key: 'member_name', render: (v: string) => v || '-' },
    { title: '手机号', dataIndex: 'member_phone', key: 'member_phone', render: (v: string) => v || '-' },
    { title: '消费金额', dataIndex: 'amount', key: 'amount', render: (v: number) => formatMoney(v) },
    { title: '原价', dataIndex: 'original_price', key: 'original_price', render: (v: number) => formatMoney(v) },
    { title: '折扣', dataIndex: 'discount', key: 'discount', render: (v: number) => `${(v * 100).toFixed(0)}%` },
    { title: '服务项目', dataIndex: 'service_name', key: 'service_name' },
    { title: '理发师', dataIndex: 'barber_name', key: 'barber_name' },
    { title: '获得积分', dataIndex: 'points_earned', key: 'points_earned' },
    { title: '所属门店', dataIndex: 'store_name', key: 'store_name', render: (v: string) => v || '-' },
    { title: '消费时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDate(v) },
  ]

  return (
    <div>
      {contextHolder}
      {loading ? (
        <TableSkeleton columns={10} rows={10} />
      ) : (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Input.Search placeholder="搜索会员姓名/手机号" onSearch={setSearch} style={{ width: 300 }} />
          </Space>
          <Table dataSource={filtered} columns={columns} rowKey="id" loading={loading} />
        </>
      )}
    </div>
  )
}

export default ConsumptionList
