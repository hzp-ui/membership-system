/**
 * @file Skeletons.tsx
 * @description 通用骨架屏组件库
 * @module components/Skeletons
 */

import React from 'react'
import { Skeleton, Card, Table, Row, Col, Space } from 'antd'

/** 统计卡片骨架屏 */
export const StatisticSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <Row gutter={16}>
    {Array.from({ length: count }).map((_, i) => (
      <Col span={24 / count} key={i}>
        <Card>
          <Skeleton active paragraph={{ rows: 1 }} />
        </Card>
      </Col>
    ))}
  </Row>
)

/** 表格骨架屏 */
export const TableSkeleton: React.FC<{ columns?: number; rows?: number }> = ({ columns = 5, rows = 5 }) => (
  <div style={{ padding: '12px 0' }}>
    <Space style={{ marginBottom: 16, width: '100%' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton.Button key={i} active style={{ width: 120 }} />
      ))}
    </Space>
    <Table
      dataSource={Array.from({ length: rows })}
      columns={Array.from({ length: columns }).map((_, i) => ({
        title: <Skeleton.Button active size="small" style={{ width: 80 }} />,
        dataIndex: `col-${i}`,
        render: () => <Skeleton.Button active size="small" style={{ width: '100%' }} />,
      }))}
      rowKey={(_, i) => `row-${i}`}
      pagination={false}
    />
  </div>
)

/** 图表骨架屏 */
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Skeleton.Image active style={{ width: '100%', height: height - 40 }} />
  </div>
)

/** 卡片骨架屏 */
export const CardSkeleton: React.FC<{ title?: boolean }> = ({ title = true }) => (
  <Card>
    {title && <Skeleton.Input active style={{ width: 120, marginBottom: 16 }} />}
    <Skeleton active paragraph={{ rows: 3 }} />
  </Card>
)

/** 列表骨架屏 */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
        <Skeleton active avatar paragraph={{ rows: 1 }} />
      </div>
    ))}
  </div>
)

/** 页面级骨架屏 */
export const PageSkeleton: React.FC<{ type?: 'table' | 'chart' | 'card' }> = ({ type = 'table' }) => {
  if (type === 'chart') return <StatisticSkeleton />
  if (type === 'card') return <CardSkeleton />
  return <TableSkeleton />
}
