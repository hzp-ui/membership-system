/**
 * @file api.ts - API 服务模块（REST）
 * @description 所有操作通过 REST API，移除 Supabase RPC 依赖
 * @module services/api
 */

import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'

/**
 * 获取当前管理员视角下的 store_id 过滤值
 */
function resolveStoreId(passedStoreId?: string | null): string | undefined {
  const { isSuperAdmin, storeId } = useAuthStore.getState()
  if (isSuperAdmin()) return passedStoreId ?? undefined
  return storeId() ?? undefined
}

/**
 * 统一后端返回格式：分页对象提取 records，其他直接返回
 * 后端部分接口返回数组 []，部分返回分页 { records: [], total, ... }
 */
function unwrapData<T>(res: any): { data: T } {
  const d = res?.data
  // 分页对象 → 提取 records 数组，包装回 { data: [...] } 保持前端 .data 兼容
  if (d && typeof d === 'object' && 'records' in d && Array.isArray(d.records)) {
    return { data: d.records as unknown as T }
  }
  // 普通数组/对象也包装回 { data: ... }
  return { data: d as T }
}

// ==================== 认证 ====================

export const adminLogin = async (username: string, password: string) => {
  const res = await api.post('/auth/admin/login', { username, password })
  // 拦截器返回 Result<T>，res.data 是业务数据 { token, userId, ... }
  return res.data
}

export const memberLogin = async (phone: string, password: string, store_id: string) => {
  const res = await api.post('/auth/member/login', { phone, password, storeId: store_id })
  return res.data
}

export const memberRegister = async (data: {
  phone: string
  password: string
  name: string
  store_id: string
}) => {
  const res = await api.post('/auth/member/register', {
    phone: data.phone,
    password: data.password,
    name: data.name,
    storeId: data.store_id,
  })
  return res.data
}

// ==================== 门店 ====================

export const getStores = (storeId?: string | null) =>
  api.get('/stores', { params: { storeId: resolveStoreId(storeId) } }).then(r => unwrapData<any>(r))

export const createStore = (data: any) =>
  api.post('/stores', data)

export const updateStore = (id: string, data: any) =>
  api.put(`/stores/${id}`, data)

export const deleteStore = (id: string) =>
  api.delete(`/stores/${id}`)

// ==================== 管理员 ====================

export const getAdmins = (storeId?: string | null) =>
  api.get('/admins', { params: { storeId: resolveStoreId(storeId) } }).then(r => unwrapData<any>(r))

export const createAdmin = (data: any) =>
  api.post('/admins', data)

export const updateAdmin = (id: string, data: any) =>
  api.put(`/admins/${id}`, data)

export const deleteAdmin = (id: string) =>
  api.delete(`/admins/${id}`)

// ==================== 会员 ====================

export const getMembers = (storeId?: string | null) =>
  api.get('/members', { params: { storeId: resolveStoreId(storeId) } }).then(r => unwrapData<any>(r))

export const updateMember = (id: string, data: any) =>
  api.put(`/members/${id}`, data)

export const deleteMember = (id: string) =>
  api.delete(`/members/${id}`)

// ==================== 理发师 ====================

export const getBarbers = (storeId?: string | null) =>
  api.get('/barbers', { params: { storeId: resolveStoreId(storeId) } }).then(r => unwrapData<any>(r))

export const createBarber = (data: any) =>
  api.post('/barbers', data)

export const updateBarber = (id: string, data: any) =>
  api.put(`/barbers/${id}`, data)

export const deleteBarber = (id: string) =>
  api.delete(`/barbers/${id}`)

// ==================== 服务项目 ====================

export const getServices = (storeId?: string | null) =>
  api.get('/services', { params: { storeId: resolveStoreId(storeId) } }).then(r => unwrapData<any>(r))

export const createService = (data: any) =>
  api.post('/services', data)

export const updateService = (id: string, data: any) =>
  api.put(`/services/${id}`, data)

export const deleteService = (id: string) =>
  api.delete(`/services/${id}`)

// ==================== 服务类型 ====================

export const getServiceTypes = (storeId?: string | null) =>
  api.get('/service-types', { params: { storeId: resolveStoreId(storeId) } }).then(r => unwrapData<any>(r))

export const createServiceType = (name: string, storeId?: string) =>
  api.post('/service-types', { name, storeId: storeId || null })

export const deleteServiceType = (id: string) =>
  api.delete(`/service-types/${id}`)

// ==================== 充值套餐 ====================

export const getPackages = (storeId?: string | null) =>
  api.get('/packages', { params: { storeId: resolveStoreId(storeId) } }).then(r => unwrapData<any>(r))

export const createPackage = (data: any) =>
  api.post('/packages', data)

export const updatePackage = (id: string, data: any) =>
  api.put(`/packages/${id}`, data)

export const deletePackage = (id: string) =>
  api.delete(`/packages/${id}`)

// ==================== 充值记录 ====================

export const getRechargeRecords = (storeId?: string | null) =>
  api.get('/recharges', { params: { storeId: resolveStoreId(storeId) } }).then(r => unwrapData<any>(r))

export const recharge = (memberId: string, packageId: string) =>
  api.post('/recharges', { memberId, packageId })

/** 自定义金额充值 */
export const customRecharge = (memberId: string, amount: number, bonus: number = 0) =>
  api.post('/recharges', { memberId, amount, bonus, packageName: null })

/** @deprecated 充值积分已由后端统一处理 */
export const addRechargePoints = async (_memberId: string, _amount: number) => {
  return { data: { points_earned: 0 } }
}

/** 手动扣款（通过 updateMember 扣余额） */
export const deductBalance = async (memberId: string, amount: number, reason: string = '手动扣款', _serviceId?: string) => {
  const res = await getMembers()
  const list = Array.isArray(res.data) ? res.data : (Array.isArray((res as any)?.records) ? (res as any).records : [])
  const member = list.find((m: any) => m.id === memberId)
  if (!member) return { data: null, error: new Error('会员不存在') }
  if ((member as any).balance < amount) return { data: null, error: new Error('余额不足') }
  return updateMember(memberId, { balance: (member as any).balance - amount })
}

// ==================== 消费记录 ====================

export const getConsumptionRecords = (storeId?: string | null) =>
  api.get('/consumptions', { params: { storeId: resolveStoreId(storeId) } }).then(r => unwrapData<any>(r))

export const consume = (memberId: string, serviceId: string, barberId?: string, customAmount?: number): Promise<any> =>
  api.post('/consumptions', { member_id: memberId, service_id: serviceId, barber_id: barberId, custom_amount: customAmount })

// ==================== 预约 ====================

export const getAppointments = (storeId?: string | null) =>
  api.get('/appointments', { params: { storeId: resolveStoreId(storeId) } }).then(r => unwrapData<any>(r))

export const createAppointment = (data: {
  member_id: string
  barber_id: string
  service_id: string
  appointment_time: string
}) =>
  api.post('/appointments', {
    member_id: data.member_id,
    barber_id: data.barber_id,
    service_id: data.service_id,
    appointment_time: data.appointment_time,
  })

export const confirmAppointment = (id: string) =>
  api.put(`/appointments/${id}/confirm`)

export const cancelAppointment = (id: string) =>
  api.put(`/appointments/${id}/cancel`)

export const completeAppointment = (id: string) =>
  api.put(`/appointments/${id}/complete`)

// ==================== 统计 ====================

export const getFinanceSummary = (params: {
  store_id?: string | null
  start_date?: string
  end_date?: string
}) =>
  api.get('/stats/finance-summary', {
    params: {
      storeId: resolveStoreId(params.store_id),
      startDate: params.start_date,
      endDate: params.end_date,
    },
  })

export const getDailyStatements = (params: {
  store_id?: string | null
  start_date?: string
  end_date?: string
}) =>
  api.get('/stats/daily-statements', {
    params: {
      storeId: resolveStoreId(params.store_id),
      startDate: params.start_date,
      endDate: params.end_date,
    },
  })

/** @deprecated CSV导出已弃用，改用 getDailyStatements */
export const exportFinanceCsv = (params: {
  store_id?: string
  start_date?: string
  end_date?: string
}) => getDailyStatements(params)

export const getRevenueStats = (params: {
  store_id?: string | null
  start_date?: string
  end_date?: string
  dimension?: string
}) =>
  api.get('/stats/revenue', {
    params: {
      storeId: resolveStoreId(params.store_id),
      startDate: params.start_date,
      endDate: params.end_date,
      dimension: params.dimension || 'day',
    },
  })

export const getMemberGrowthStats = (params: {
  store_id?: string | null
  start_date?: string
  end_date?: string
  dimension?: string
}) =>
  api.get('/stats/member-growth', {
    params: {
      storeId: resolveStoreId(params.store_id),
      startDate: params.start_date,
      endDate: params.end_date,
      dimension: params.dimension || 'day',
    },
  })

export const getHotServicesStats = (params: {
  store_id?: string | null
  start_date?: string
  end_date?: string
}) =>
  api.get('/stats/hot-services', {
    params: {
      storeId: resolveStoreId(params.store_id),
      startDate: params.start_date,
      endDate: params.end_date,
    },
  })

// ==================== Dashboard ====================

export const getDashboard = (storeId?: string | null) =>
  api.get('/dashboard', { params: { storeId: resolveStoreId(storeId) } })
