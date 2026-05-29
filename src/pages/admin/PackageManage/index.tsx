import React from 'react'
import { Card, Descriptions } from 'antd'
import { useParams } from 'react-router-dom'

const PackageManage: React.FC = () => {
  const { id } = useParams()
  return (
    <Card title="充值套餐管理">
      <Descriptions column={1}>
        <Descriptions.Item label="套餐ID">{id || '全部'}</Descriptions.Item>
      </Descriptions>
      <p style={{ color: '#999', marginTop: 16 }}>充值套餐管理已合并到充值管理页面（RechargeList），包含充值记录和套餐管理两个Tab</p>
    </Card>
  )
}

export default PackageManage
