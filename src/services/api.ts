/**
 * @file api.ts - API 服务模块（全 RPC）
 * @description 所有数据库操作通过 RPC 函数，权限在数据库层控制
 *               store_admin 自动注入 p_store_id 过滤，super_admin 可查全部
 * @module services/api
 */

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type {
  Store, Admin, Member, Barber, Service,
  RechargePackage,
} from '@/types'

/**
 * 获取当前管理员视角下的 store_id 过滤值
 * - super_admin：返回传入值（支持查全部或指定门店）
 * - store_admin：强制返回自己的 store_id（无视传入值，保证数据隔离）
 */
function resolveStoreId(passedStoreId?: string | null): string | null {
  const { isSuperAdmin, storeId } = useAuthStore.getState()
  if (isSuperAdmin()) return passedStoreId ?? null
  // store_admin：强制用自己的门店 ID
  return storeId() ?? null
}

/**
 * 统一 RPC 调用包装
 * RPC 返回 { data: { data: [...], error: ... }, error: ... }
 * 包装后返回 { data: [...], error: ... }，和原 supabase.from() 返回格式一致
 */
async function rpcCall(fn: string, params: Record<string, any>) {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) return { data: null, error }
  // RPC 函数内部返回 { data: ..., error: ... }
  if (data?.error) return { data: null, error: new Error(data.error) }
  return { data: data?.data ?? data, error: null }
}

// ==================== 认证（RPC） ====================

export const adminLogin = async (username: string, password: string) => {
  const { data, error } = await supabase.rpc('rpc_admin_login', {
    p_username: username,
    p_password: password,
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return { data: data.data }
}

export const memberLogin = async (phone: string, password: string, store_id: string) => {
  const { data, error } = await supabase.rpc('rpc_member_login', {
    p_phone: phone,
    p_password: password,
    p_store_id: store_id,
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return { data: data.data }
}

export const memberRegister = async (data: {
  phone: string
  password: string
  name: string
  store_id: string
}) => {
  const { data: result, error } = await supabase.rpc('rpc_member_register', {
    p_phone: data.phone,
    p_password: data.password,
    p_name: data.name,
    p_store_id: data.store_id,
  })
  if (error) throw error
  if (result?.error) throw new Error(result.error)
  return { data: result.data }
}

// ==================== 门店 ====================

export const getStores = (storeId?: string | null) =>
  rpcCall('rpc_get_stores', { p_store_id: resolveStoreId(storeId) })

export const createStore = (data: Partial<Store>) =>
  rpcCall('rpc_create_store', {
    p_name: data.name,
    p_address: data.address || null,
    p_phone: data.phone || null,
    p_manager: data.manager || null,
  })

export const updateStore = (id: string, data: Partial<Store>) =>
  rpcCall('rpc_update_store', {
    p_id: id,
    p_name: data.name || null,
    p_address: data.address || null,
    p_phone: data.phone || null,
    p_manager: data.manager || null,
    p_status: data.status || null,
  })

// ==================== 管理员 ====================

export const getAdmins = (storeId?: string | null) =>
  rpcCall('rpc_get_admins', { p_store_id: resolveStoreId(storeId) })

export const createAdmin = (data: any) =>
  rpcCall('rpc_create_admin', {
    p_username: data.username,
    p_password: data.password,
    p_name: data.name,
    p_phone: data.phone || null,
    p_role: data.role || 'store_admin',
    p_store_id: data.store_id || null,
  })

export const updateAdmin = (id: string, data: any) =>
  rpcCall('rpc_update_admin', {
    p_id: id,
    p_name: data.name || null,
    p_phone: data.phone || null,
    p_role: data.role || null,
    p_store_id: data.store_id || null,
    p_password: data.password || null,
  })

export const deleteAdmin = (id: string) =>
  rpcCall('rpc_delete_admin', { p_id: id })

// ==================== 会员 ====================

export const getMembers = (storeId?: string | null) =>
  rpcCall('rpc_get_members', { p_store_id: resolveStoreId(storeId) })

export const updateMember = (id: string, data: Partial<Member>) =>
  rpcCall('rpc_update_member', {
    p_id: id,
    p_name: data.name || null,
    p_phone: data.phone || null,
    p_level: data.level || null,
    p_points: (data as any).points ?? null,
    p_balance: (data as any).balance ?? null,
    p_status: (data as any).status || null,
  })

// ==================== 理发师 ====================

export const getBarbers = (storeId?: string | null) =>
  rpcCall('rpc_get_barbers', { p_store_id: resolveStoreId(storeId) })

export const createBarber = (data: Partial<Barber>) =>
  rpcCall('rpc_create_barber', {
    p_name: data.name,
    p_phone: data.phone || null,
    p_specialties: data.specialties || null,
    p_store_id: data.store_id,
  })

export const updateBarber = (id: string, data: Partial<Barber>) =>
  rpcCall('rpc_update_barber', {
    p_id: id,
    p_name: data.name || null,
    p_phone: data.phone || null,
    p_specialties: data.specialties || null,
    p_status: (data as any).status || null,
  })

export const deleteBarber = (id: string) =>
  rpcCall('rpc_delete_barber', { p_id: id })

// ==================== 服务项目 ====================

export const getServices = (storeId?: string | null) =>
  rpcCall('rpc_get_services', { p_store_id: resolveStoreId(storeId) })

export const createService = (data: Partial<Service>) =>
  rpcCall('rpc_create_service', {
    p_type: data.type,
    p_name: data.name,
    p_price: data.price,
    p_discount_normal: (data as any).discount_normal ?? 1.00,
    p_discount_silver: (data as any).discount_silver ?? 0.95,
    p_discount_gold: (data as any).discount_gold ?? 0.90,
    p_discount_diamond: (data as any).discount_diamond ?? 0.80,
    p_store_id: (data as any).store_id,
  })

export const updateService = (id: string, data: Partial<Service>) =>
  rpcCall('rpc_update_service', {
    p_id: id,
    p_type: data.type || null,
    p_name: data.name || null,
    p_price: (data as any).price ?? null,
    p_discount_normal: (data as any).discount_normal ?? null,
    p_discount_silver: (data as any).discount_silver ?? null,
    p_discount_gold: (data as any).discount_gold ?? null,
    p_discount_diamond: (data as any).discount_diamond ?? null,
  })

export const deleteService = (id: string) =>
  rpcCall('rpc_delete_service', { p_id: id })

// ==================== 服务类型 ====================

export const getServiceTypes = (storeId?: string | null) =>
  rpcCall('rpc_get_service_types', { p_store_id: resolveStoreId(storeId) })

export const createServiceType = (name: string, storeId?: string) =>
  rpcCall('rpc_create_service_type', { p_name: name, p_store_id: storeId || null })

export const deleteServiceType = (id: string) =>
  rpcCall('rpc_delete_service_type', { p_id: id })

// ==================== 充值 ====================

export const getRechargeRecords = (storeId?: string | null) =>
  rpcCall('rpc_get_recharge_records', { p_store_id: resolveStoreId(storeId) })

export const getPackages = (storeId?: string | null) =>
  rpcCall('rpc_get_packages', { p_store_id: resolveStoreId(storeId) })

export const createPackage = (data: Partial<RechargePackage>) =>
  rpcCall('rpc_create_package', {
    p_name: data.name,
    p_amount: (data as any).amount,
    p_bonus: (data as any).bonus ?? 0,
    p_status: (data as any).status || 'active',
    p_store_id: (data as any).store_id,
  })

export const updatePackage = (id: string, data: Partial<RechargePackage>) =>
  rpcCall('rpc_update_package', {
    p_id: id,
    p_name: data.name || null,
    p_amount: (data as any).amount ?? null,
    p_bonus: (data as any).bonus ?? null,
    p_status: (data as any).status || null,
  })

export const deletePackage = (id: string) =>
  rpcCall('rpc_delete_package', { p_id: id })

export const recharge = (memberId: string, packageId: string) =>
  rpcCall('rpc_create_recharge_record', { p_member_id: memberId, p_package_id: packageId, p_pay_method: 'cash' })

/** 自定义金额充值（RPC 原子操作） */
export const customRecharge = (memberId: string, amount: number, bonus: number = 0) =>
  rpcCall('rpc_create_recharge_record', { p_member_id: memberId, p_package_id: null, p_amount: amount, p_bonus: bonus, p_pay_method: 'cash' })

/** @deprecated 充值积分已由 RPC 统一处理 */
export const addRechargePoints = async (_memberId: string, _amount: number) => {
  return { data: { points_earned: 0 } }
}

/** 手动扣款（通过 consume RPC，使用该门店第一个服务项） */
export const deductBalance = async (memberId: string, amount: number, reason: string = '手动扣款', _serviceId?: string) => {
  const { data: members } = await rpcCall('rpc_get_members', { p_store_id: null })
  const member = (members as any[])?.find((m: any) => m.id === memberId)
  if (!member) return { data: null, error: new Error('会员不存在') }
  if ((member as any).balance < amount) return { data: null, error: new Error('余额不足') }
  return rpcCall('rpc_update_member', {
    p_id: memberId,
    p_balance: (member as any).balance - amount,
  })
}

// ==================== 消费 ====================

export const getConsumptionRecords = (storeId?: string | null) =>
  rpcCall('rpc_get_consume_records', { p_store_id: resolveStoreId(storeId) })

export const consume = (memberId: string, serviceId: string, barberId?: string) =>
  rpcCall('rpc_create_consume_record', {
    p_member_id: memberId,
    p_service_id: serviceId,
    p_barber_id: barberId || null,
    p_amount: 0,
    p_payment_method: 'balance',
    p_remark: null,
  })

// ==================== 预约 ====================

export const getAppointments = (storeId?: string | null) =>
  rpcCall('rpc_get_appointments', { p_store_id: resolveStoreId(storeId) })

export const createAppointment = (data: {
  member_id: string
  barber_id: string
  service_id: string
  appointment_time: string
}) =>
  rpcCall('rpc_create_appointment', {
    p_member_id: data.member_id,
    p_barber_id: data.barber_id,
    p_service_id: data.service_id,
    p_appointment_time: data.appointment_time,
  })

export const confirmAppointment = (id: string) =>
  rpcCall('rpc_confirm_appointment', { p_id: id })

export const cancelAppointment = (id: string) =>
  rpcCall('rpc_cancel_appointment', { p_id: id })

export const completeAppointment = (id: string) =>
  rpcCall('rpc_complete_appointment', { p_id: id })

// ==================== 财务 ====================

export const getFinanceSummary = (params: {
  store_id?: string | null
  start_date?: string
  end_date?: string
}) =>
  rpcCall('rpc_finance_summary', {
    p_store_id: resolveStoreId(params.store_id),
    p_start_date: params.start_date || null,
    p_end_date: params.end_date || null,
  })

export const getDailyStatements = (params: {
  store_id?: string | null
  start_date?: string
  end_date?: string
}) =>
  rpcCall('rpc_daily_statements', {
    p_store_id: resolveStoreId(params.store_id),
    p_start_date: params.start_date || null,
    p_end_date: params.end_date || null,
  })

/** @deprecated CSV导出已弃用，改用 getDailyStatements */
export const exportFinanceCsv = (params: {
  store_id?: string
  start_date?: string
  end_date?: string
}) => getDailyStatements(params)

// ==================== 统计 ====================

export const getRevenueStats = (params: {
  store_id?: string | null
  start_date?: string
  end_date?: string
  dimension?: string
}) =>
  rpcCall('rpc_revenue_stats', {
    p_store_id: resolveStoreId(params.store_id),
    p_start_date: params.start_date || null,
    p_end_date: params.end_date || null,
    p_dimension: params.dimension || 'day',
  })

export const getMemberGrowthStats = (params: {
  store_id?: string | null
  start_date?: string
  end_date?: string
  dimension?: string
}) =>
  rpcCall('rpc_member_growth_stats', {
    p_store_id: resolveStoreId(params.store_id),
    p_start_date: params.start_date || null,
    p_end_date: params.end_date || null,
    p_dimension: params.dimension || 'day',
  })

export const getHotServicesStats = (params: {
  store_id?: string | null
  start_date?: string
  end_date?: string
}) =>
  rpcCall('rpc_hot_services_stats', {
    p_store_id: resolveStoreId(params.store_id),
    p_start_date: params.start_date || null,
    p_end_date: params.end_date || null,
  })
