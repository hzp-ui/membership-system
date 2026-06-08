/**
 * @file MemberList.tsx
 * @description 会员管理页面组件
 * @module admin/MemberList
 */

import React, { useEffect, useState } from 'react'
import { Table, Input, Select, Tag, Button, Modal, Form, Space, message, InputNumber } from 'antd'
import { getMembers, updateMember, getStores, getPackages, recharge, customRecharge, consume, addRechargePoints, getServices, getBarbers } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { getLevelLabel, getLevelColor, formatMoney } from '@/utils'
import { TableSkeleton } from '@/components/Skeletons'
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
  const [deductBarbers, setDeductBarbers] = useState<any[]>([])
  const [deductMode, setDeductMode] = useState<'service' | 'custom'>('service')

  const [messageApi, contextHolder] = message.useMessage()

  const loadData = async () => {
    setLoading(true)
    try {
      const sid = isSuperAdmin() ? undefined : storeId()
      const [memRes, stoRes] = await Promise.all([
        getMembers(sid),
        getStores(),
      ])

      console.log('[loadData] memRes:', memRes, 'memRes.data:', memRes.data)
      console.log('[loadData] stoRes:', stoRes, 'stoRes.data:', stoRes.data)
      let data = memRes.data || []
      console.log('[loadData] data before filter:', data, 'isArray:', Array.isArray(data))
      if (search) data = data.filter((m: any) => m.name?.includes(search) || m.phone?.includes(search))
      if (levelFilter) data = data.filter((m: any) => m.level === levelFilter)
      console.log('[loadData] data after filter:', data, 'isArray:', Array.isArray(data))
      setMembers(Array.isArray(data) ? data : [])
      setStores(Array.isArray(stoRes.data) ? stoRes.data : [])
    } catch (err: any) { messageApi.error(err.message || '加载数据失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleEdit = async () => {
    try {
      const values = await form.validateFields()
      await updateMember(editMember.id, values)
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
      setPackages(Array.isArray(res.data) ? res.data : (res.data?.records || []))
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
      if (res.code !== undefined && res.code !== 200) throw new Error(res.message || '充值失败')
      if (rechargeMode === 'custom') {
        const pts = res.data?.points_earned || 0
        messageApi.success(`充值成功，获得 ${pts} 积分`)
      } else {
        const pkg = (Array.isArray(packages) ? packages : []).find((p: any) => p.id === values.package_id)
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
    { title: '所属门店', dataIndex: 'store_id', key: 'storeId', render: (v: string) => (stores as any[])?.find((s: any) => s.id === v)?.name || '-' },
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
              const [svcRes, brbRes] = await Promise.all([getServices(record.store_id), getBarbers(record.store_id)])
              setDeductServices(Array.isArray(svcRes.data) ? svcRes.data : (svcRes.data?.records || []))
              setDeductBarbers(Array.isArray(brbRes.data) ? brbRes.data : (brbRes.data?.records || []))
            } catch { messageApi.error('加载数据失败') }
            setDeductModal(true)
          }}>扣款</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      {loading ? (
        <TableSkeleton columns={7} rows={10} />
      ) : (
        <>
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
        </>
      )}
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
      <Modal title={`会员消费 - ${deductMember?.name || ''}`} open={deductModal} onOk={async () => {
        try {
          const values = await deductForm.validateFields()
          if (deductMode === 'service') {
            if (!values.service_id) { messageApi.error('请选择服务项目'); return }
          } else {
            if (!values.custom_amount || values.custom_amount <= 0) { messageApi.error('请输入有效金额'); return }
          }
          if (!values.barber_id) { messageApi.error('请选择理发师'); return }
          const res = deductMode === 'service'
            ? await consume(deductMember.id, values.service_id, values.barber_id)
            : await consume(deductMember.id, 'custom', values.barber_id, values.custom_amount)
          messageApi.success(`消费成功，消费金额 ¥${res?.amount || 0}`)
          setDeductModal(false)
          setDeductMode('service')
          deductForm.resetFields()
          loadData()
        } catch (err: any) { messageApi.error(err.message || '消费失败') }
      }} onCancel={() => { setDeductModal(false); setDeductMode('service'); deductForm.resetFields() }}>
        <Form form={deductForm} layout="vertical">
          <Form.Item label="当前余额"><span style={{ fontSize: 18, fontWeight: 600 }}>{formatMoney(deductMember?.balance)}</span></Form.Item>
          <Form.Item label="消费方式">
            <Select value={deductMode} onChange={setDeductMode}>
              <Select.Option value="service">选择服务</Select.Option>
              <Select.Option value="custom">自定义金额</Select.Option>
            </Select>
          </Form.Item>
          {deductMode === 'service' ? (
            <Form.Item name="service_id" label="服务项目" rules={[{ required: true, message: '请选择服务项目' }]}>
              <Select placeholder="请选择服务项目">
                {deductServices.map((s: any) => (
                  <Select.Option key={s.id} value={s.id}>{s.name}（¥{s.price}）</Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <Form.Item name="custom_amount" label="消费金额" rules={[{ required: true, message: '请输入消费金额' }]}>
              <InputNumber min={0.01} precision={2} prefix="¥" style={{ width: '100%' }} placeholder="请输入消费金额" />
            </Form.Item>
          )}
          <Form.Item name="barber_id" label="理发师" rules={[{ required: true, message: '请选择理发师' }]}>
            <Select placeholder="请选择理发师">
              {deductBarbers.map((b: any) => (
                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="备注"><Input placeholder="选填，备注信息" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MemberList
