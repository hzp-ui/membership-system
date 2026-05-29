/**
 * @file pages/user/Recharge.tsx - 用户充值页面
 * @description 会员端充值功能页面，展示当前余额和可选充值套餐：
 * - 显示当前会员余额
 * - 列出所属门店的充值套餐（充值金额 + 赠送金额）
 * - 点击套餐即可完成充值，实时更新余额
 * @module pages/user/Recharge
 */

import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Button, message } from 'antd'
import { recharge, getPackages } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { formatMoney } from '@/utils'

/**
 * 用户充值页面组件
 * @component UserRecharge
 * @description 展示充值套餐卡片列表，支持一键充值并实时更新余额
 * @returns {JSX.Element} 用户充值页面
 */
const UserRecharge: React.FC = () => {
  const { member, setMember } = useAuthStore()
  const [packages, setPackages] = useState<any[]>([])
  /** 当前正在充值的套餐 ID（用于按钮 loading 状态） */
  const [loading, setLoading] = useState<string | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  /** 页面加载时获取所属门店的充值套餐 */
  useEffect(() => {
    if (!member?.store_id) return
    const load = async () => {
      try {
        const res = await getPackages(member.store_id)
        setPackages(res.data || [])
      } catch {}
    }
    load()
  }, [member])

  /**
   * 处理充值操作
   * @function handleRecharge
   * @description 调用充值接口，成功后更新会员余额到 Zustand Store
   * @param {string} pkgId - 充值套餐 ID
   * @async
   */
  const handleRecharge = async (pkgId: string) => {
    if (!member) return
    setLoading(pkgId)
    try {
      const res = await recharge(member.id, pkgId)
      const newBalance = res.data.data.new_balance
      // 更新会员余额到全局状态
      setMember({ ...member, balance: newBalance })
      messageApi.success(`充值成功！余额: ${formatMoney(newBalance)}`)
    } catch (err: any) { messageApi.error(err.message || '充值失败') }
    finally { setLoading(null) }
  }

  return (
    <div>
      {contextHolder}
      {/* 当前余额展示 */}
      <Card title={`当前余额: ${formatMoney(member?.balance || 0)}`} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          {packages.map(pkg => (
            <Col xs={24} sm={12} key={pkg.id}>
              <Card hoverable>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>{pkg.name}</div>
                <div style={{ margin: '8px 0' }}>充值 <span style={{ color: '#1677ff', fontSize: 24 }}>{formatMoney(pkg.amount)}</span></div>
                <div style={{ color: '#f50' }}>赠送 {formatMoney(pkg.bonus)}</div>
                <Button type="primary" block style={{ marginTop: 12 }} loading={loading === pkg.id} onClick={() => handleRecharge(pkg.id)}>立即充值</Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}

export default UserRecharge
