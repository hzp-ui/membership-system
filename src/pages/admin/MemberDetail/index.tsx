import React from 'react'
import { Card, Button, Descriptions } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'

const MemberDetail: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  return (
    <Card
      title="会员详情"
      extra={<Button onClick={() => navigate('/admin/members')}>返回列表</Button>}
    >
      <Descriptions column={1}>
        <Descriptions.Item label="会员ID">{id}</Descriptions.Item>
      </Descriptions>
      <p style={{ color: '#999', marginTop: 16 }}>会员详情功能：可在会员列表页点击编辑查看完整信息</p>
    </Card>
  )
}

export default MemberDetail
