import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, getStores } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { TableSkeleton } from '@/components/Skeletons'

const AdminList: React.FC = () => {
  const { isSuperAdmin, storeId } = useAuthStore()
  const [admins, setAdmins] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editAdmin, setEditAdmin] = useState<any>(null)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const loadData = async () => {
    setLoading(true)
    try {
      const sid = isSuperAdmin() ? undefined : storeId()
      const [aRes, sRes] = await Promise.all([getAdmins(sid), getStores()])
      if (aRes.error) throw aRes.error
      if (sRes.error) throw sRes.error
      setAdmins(aRes.data || [])
      setStores(sRes.data || [])
    } catch (err: any) { messageApi.error(err.message || '加载失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (editAdmin) {
        const res = await updateAdmin(editAdmin.id, values)
        if (res.error) throw res.error
        messageApi.success('更新成功')
      } else {
        const res = await createAdmin(values)
        if (res.error) throw res.error
        messageApi.success('创建成功')
      }
      setModalOpen(false)
      form.resetFields()
      loadData()
    } catch (err: any) { messageApi.error(err.message || '操作失败') }
  }

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (r: string) => <Tag color={r === 'super_admin' ? 'red' : 'blue'}>{r === 'super_admin' ? '超级管理员' : '店长'}</Tag>,
    },
    { title: '所属门店', dataIndex: 'store_name', key: 'store_name', render: (v: string, r: any) => v || (r.role === 'super_admin' ? '-' : '未绑定') },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => { setEditAdmin(record); form.setFieldsValue(record); setModalOpen(true) }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={async () => { const res = await deleteAdmin(record.id); if (res.error) { messageApi.error('删除失败'); return } messageApi.success('已删除'); loadData() }}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      {loading ? (
        <TableSkeleton columns={6} rows={10} />
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditAdmin(null); form.resetFields(); setModalOpen(true) }}>新增管理员</Button>
          </div>
          <Table dataSource={admins} columns={columns} rowKey="id" loading={loading} />
        </>
      )}
      <Modal title={editAdmin ? '编辑管理员' : '新增管理员'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input disabled={!!editAdmin} /></Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label="手机号"><Input /></Form.Item>
          <Form.Item name="password" label={editAdmin ? '新密码（留空不修改）' : '密码'} rules={[{ required: !editAdmin }]}>
            <Input.Password placeholder={editAdmin ? '留空则不修改密码' : '请输入密码'} />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select placeholder="请选择角色" onChange={(v) => { if (v === 'super_admin') form.setFieldsValue({ store_id: undefined }) }}>
              <Select.Option value="super_admin">超级管理员</Select.Option>
              <Select.Option value="store_admin">店长</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.role !== curr.role}
          >
            {({ getFieldValue }) => getFieldValue('role') === 'store_admin' && (
              <Form.Item name="store_id" label="所属门店" rules={[{ required: true, message: '店长必须绑定门店' }]}>
                <Select placeholder="请选择门店">
                  {stores.map((s: any) => (
                    <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminList
