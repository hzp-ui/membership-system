import React from 'react'
import { Card, Button, Descriptions } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'

const BarberDetail: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  return (
    <Card
      title="理发师详情"
      extra={<Button onClick={() => navigate('/admin/barbers')}>返回列表</Button>}
    >
      <Descriptions column={1}>
        <Descriptions.Item label="ID">{id}</Descriptions.Item>
      </Descriptions>
      <p style={{ color: '#999', marginTop: 16 }}>理发师详情功能：可在列表页点击编辑查看完整信息</p>
    </Card>
  )
}

export default BarberDetail
