/**
 * @file MemberList.tsx
 * @description 会员管理页面组件
 * @module admin/MemberList
 */

import React, { useEffect, useState } from 'react'
import { Table, Input, Select, Tag, Button, Modal, Form, Space, message, InputNumber } from 'antd'
import { getMembers, updateMember, getStores, getPackages, recharge, customRecharge, deductBalance, addRechargePoints, getServices } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { getLevelLabel, getLevelColor, formatMoney } from '@/utils'
import type { MemberLevel } from '@/types'

const MemberList: React.FC = () => {
  const { isSuperAdmin, storeId } = useAuthStore()
  const [members, setMembers] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<MemberLevel | undefined>()
  const [editModal, setEditModal] = useState(false)
  const [editMember, setEditMember] = useState<any>(null)
  const [form] = Form.useForm()

  // 充值相关
  const [rechargeModal, setRechargeModal] = useState(false)
  const [rechargeMember, setRechargeMember] = useState<any>(null)
  const [packages, setPackages] = useState<any[]>([])
  const [rechargeForm] = Form.useForm()

  // 扣款相关
  const [deductModal, setDeductModal] = useState(false)
  const [deductMember, setDeductMember] = useState<any>(null)
  const [deductForm] = Form.useForm()
  const [deductServices, setDeductServices] = useState<any[]>([])

  const [messageApi, contextHolder] = message.useMessage()

  const loadData = async () => {
    setLoading(true)
    try {
      const sid = isSuperAdmin() ? undefined : storeId()
    console.log('[MemberList] isSuperAdmin:', isSuperAdmin(), 'storeId:', storeId(), 'sid:', sid)

      const [memRes, stoRes] = await Promise.all([
        getMembers(sid),
        getStores(),
      ])
      if (memRes.error) throw memRes.error
      if (stoRes.error) throw stoRes.error

      let data = memRes.data || []
      if (search) data = data.filter((m: any) => m.name?.includes(search) || m.phone?.includes(search))
      if (levelFilter) data = data.filter((m: any) => m.level === levelFilter)
      setMembers(data)
      setStores(stoRes.data || [])
    } catch (err: any) { messageApi.error(err.message || '加载数据失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleEdit = async () => {
    try {
      const values = await form.validateFields()
      const res = await updateMember(editMember.id, values)
      if (res.error) throw res.error
      messageApi.success('更新成功')
      setEditModal(false)
      loadData()
    } catch (err: any) { messageApi.error(err.message || '更新失败') }
  }

  const [rechargeMode, setRechargeMode] = useState<'package' | 'custom'>('package')

  /** 打开充值弹窗 */
  const openRecharge = async (record: any) => {
    setRechargeMember(record)
    rechargeForm.resetFields()
    setRechargeMode('package')
    try {
      const res = await getPackages(record.store_id)
      if (res.error) throw res.error
      setPackages(res.data || [])
    } catch (err: any) { messageApi.error(err.message || '加载套餐失败') }
    setRechargeModal(true)
  }

  /** 提交充值 */
  const handleRecharge = async () => {
    try {
      const values = await rechargeForm.validateFields()
      let res: any
      if (rechargeMode === 'custom') {
        if (!values.amount || values.amount <= 0) { messageApi.error('请输入有效充值金额'); return }
        res = await customRecharge(rechargeMember.id, values.amount, values.bonus || 0)
      } else {
        if (!values.package_id) { messageApi.error('请选择套餐'); return }
        res = await recharge(rechargeMember.id, values.package_id)
      }
      if (res.error) throw res.error
      if (rechargeMode === 'custom') {
        const pts = (res.data as any)?.points_earned || 0
        messageApi.success(`充值成功，获得 ${pts} 积分`)
      } else {
        const pkg = packages.find((p: any) => p.id === values.package_id)
        if (pkg) await addRechargePoints(rechargeMember.id, pkg.amount)
        messageApi.success('充值成功')
      }
      setRechargeModal(false)
      loadData()
    } catch (err: any) { messageApi.error(err.message || '充值失败') }
  }

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      render: (l: MemberLevel) => <Tag color={getLevelColor(l)}>{getLevelLabel(l)}</Tag>,
    },
    { title: '积分', dataIndex: 'points', key: 'points' },
    { title: '余额', dataIndex: 'balance', key: 'balance', render: (v: number) => formatMoney(v) },
    { title: '所属门店', dataIndex: 'store_name', key: 'store_name', render: (v: string) => v || '-' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => {
            setEditMember(record)
            form.setFieldsValue({
              name: record.name,
              phone: record.phone,
              level: record.level,
              store_id: record.store_id,
            })
            setEditModal(true)
          }}>编辑</Button>
          <Button type="link" style={{ color: '#1677ff' }} onClick={() => openRecharge(record)}>充值</Button>
          <Button type="link" danger onClick={async () => {
            setDeductMember(record); deductForm.resetFields()
            try {
              const res = await getServices(record.store_id)
              if (res.error) throw res.error
              setDeductServices(res.data || [])
            } catch { messageApi.error('加载服务失败') }
            setDeductModal(true)
          }}>扣款</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      <Space style={{ marginBottom: 16 }}>
        <Input.Search placeholder="搜索姓名/手机号" onSearch={setSearch} style={{ width: 250 }} />
        <Select placeholder="会员等级" allowClear style={{ width: 120 }} onChange={setLevelFilter}>
          <Select.Option value="normal">普通</Select.Option>
          <Select.Option value="silver">银卡</Select.Option>
          <Select.Option value="gold">金卡</Select.Option>
          <Select.Option value="diamond">钻石</Select.Option>
        </Select>
        <Button onClick={loadData}>查询</Button>
      </Space>
      <Table dataSource={members} columns={columns} rowKey="id" loading={loading} />
      <Modal title="编辑会员" open={editModal} onOk={handleEdit} onCancel={() => setEditModal(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名"><Input /></Form.Item>
          <Form.Item name="phone" label="手机号"><Input /></Form.Item>
          <Form.Item name="level" label="会员等级">
            <Select>
              <Select.Option value="normal">普通</Select.Option>
              <Select.Option value="silver">银卡</Select.Option>
              <Select.Option value="gold">金卡</Select.Option>
              <Select.Option value="diamond">钻石</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="store_id" label="所属门店">
            <Select placeholder="请选择门店">
              {stores.map((s: any) => (
                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      <Modal title={`会员充值 - ${rechargeMember?.name || ''}`} open={rechargeModal} onOk={handleRecharge} onCancel={() => setRechargeModal(false)}>
        <Form form={rechargeForm} layout="vertical">
          <Form.Item label="充值方式">
            <Select value={rechargeMode} onChange={setRechargeMode}>
              <Select.Option value="package">套餐充值</Select.Option>
              <Select.Option value="custom">自定义金额</Select.Option>
            </Select>
          </Form.Item>
          {rechargeMode === 'package' ? (
            <Form.Item name="package_id" label="选择充值套餐" rules={[{ required: true, message: '请选择套餐' }]}>
              <Select placeholder="请选择套餐">
                {packages.map((p: any) => (
                  <Select.Option key={p.id} value={p.id}>{p.name}（充值 ¥{p.amount}，赠送 ¥{p.bonus}）</Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <>
              <Form.Item name="amount" label="充值金额" rules={[{ required: true, message: '请输入充值金额' }]}>
                <InputNumber min={0.01} precision={2} prefix="¥" style={{ width: '100%' }} placeholder="请输入充值金额" />
              </Form.Item>
              <Form.Item name="bonus" label="赠送金额">
                <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} placeholder="选填，赠送金额" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
      <Modal title={`会员扣款 - ${deductMember?.name || ''}`} open={deductModal} onOk={async () => {
        try {
          const values = await deductForm.validateFields()
          if (!values.amount || values.amount <= 0) { messageApi.error('请输入有效扣款金额'); return }
          const res = await deductBalance(deductMember.id, values.amount, values.reason || '手动扣款', values.service_id)
          if (res.error) { messageApi.error((res.error as any).message || '扣款失败'); return }
          messageApi.success('扣款成功')
          setDeductModal(false)
          loadData()
        } catch (err: any) { messageApi.error(err.message || '扣款失败') }
      }} onCancel={() => setDeductModal(false)}>
        <Form form={deductForm} layout="vertical">
          <Form.Item label="当前余额">
            <span style={{ fontSize: 18, fontWeight: 600 }}>{formatMoney(deductMember?.balance)}</span>
          </Form.Item>
          <Form.Item name="amount" label="扣款金额" rules={[{ required: true, message: '请输入扣款金额' }]}>
            <InputNumber min={0.01} precision={2} prefix="¥" style={{ width: '100%' }} placeholder="请输入扣款金额" />
          </Form.Item>
          <Form.Item name="service_id" label="服务项目" rules={[{ required: true, message: '请选择服务项目' }]}>
            <Select placeholder="请选择服务项目">
              {deductServices.map((s: any) => (
                <Select.Option key={s.id} value={s.id}>{s.name}（¥{s.price}）</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="备注">
            <Input placeholder="选填，备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MemberList
