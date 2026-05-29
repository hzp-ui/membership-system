import React from 'react'
import { Card, Button, Descriptions } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'

const StoreDetail: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  return (
    <Card
      title="门店详情"
      extra={<Button onClick={() => navigate('/admin/stores')}>返回列表</Button>}
    >
      <Descriptions column={1}>
        <Descriptions.Item label="门店ID">{id}</Descriptions.Item>
      </Descriptions>
      <p style={{ color: '#999', marginTop: 16 }}>门店详情功能：可在门店列表页点击编辑查看完整信息</p>
    </Card>
  )
}

export default StoreDetail
