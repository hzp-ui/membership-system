/**
 * @file index.ts - TypeScript 类型定义
 * @description 定义会员系统中所有数据类型、接口和枚举
 * - 门店/管理员/会员/理发师/服务实体
 * - 充值/消费/预约业务记录
 * - 财务统计相关类型
 * @module types
 */

// ==================== 基础实体 ====================

/** 门店信息 */
export interface Store {
  id: string
  name: string
  address: string
  phone: string
  manager: string
  status: 'active' | 'inactive'
  created_at: string
}

/** 门店状态类型 */
export type StoreStatus = 'active' | 'inactive'

/** 管理员 */
export interface Admin {
  id: string
  username: string
  password_hash?: string
  name: string
  phone?: string | null
  role: AdminRole
  store_id?: string
  created_at?: string  // 可选，登录时可能没有
  token?: string  // 登录后保存 JWT
}

/** 管理员角色枚举 */
export type AdminRole = 'super_admin' | 'store_admin'

/** 会员等级枚举 */
export type MemberLevel = 'normal' | 'silver' | 'gold' | 'diamond'

/** 会员信息 */
export interface Member {
  id: string
  phone: string
  password_hash: string
  name: string
  level: MemberLevel
  balance: number
  points: number
  store_id: string
  created_at: string
}

/** 理发师 */
export interface Barber {
  id: string
  name: string
  phone: string
  specialties: string[]
  status: 'active' | 'inactive'
  store_id: string
}

/** 服务项目 */
export interface Service {
  id: string
  type: string
  name: string
  price: number
  discount_normal: number
  discount_silver: number
  discount_gold: number
  discount_diamond: number
  store_id: string
}

// ==================== 业务记录 ====================

/** 充值套餐 */
export interface RechargePackage {
  id: string
  name: string
  amount: number
  bonus: number
  store_id: string
}

/** 充值记录 */
export interface RechargeRecord {
  id: string
  member_id: string
  amount: number
  bonus: number
  package_name: string
  store_id: string
  created_at: string
}

/** 消费记录 */
export interface ConsumptionRecord {
  id: string
  member_id: string
  amount: number
  original_price: number
  discount: number
  service_id: string
  service_name: string
  barber_id?: string
  barber_name?: string
  points_earned: number
  store_id: string
  created_at: string
}

/** 预约状态枚举 */
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

/** 预约记录 */
export interface Appointment {
  id: string
  member_id: string
  barber_id: string
  service_id: string
  appointment_time: string
  status: AppointmentStatus
  store_id: string
  created_at: string
}

// ==================== 财务与统计 ====================

/** 财务汇总报表 */
export interface FinanceSummary {
  recharge_income: number
  consumption_income: number
  refund_amount: number
  net_income: number
}

/** 每日对账单 */
export interface DailyStatement {
  date: string
  recharge_count: number
  recharge_amount: number
  consumption_count: number
  consumption_amount: number
  refund_count: number
  refund_amount: number
}

/** 统计项（通用） */
export interface StatItem {
  period: string
  total_amount?: number
  count?: number
}

/** 热门服务统计项 */
export interface HotService {
  service_name: string
  count: number
}

// ==================== 中文标签映射 ====================

/** 会员等级 → 中文标签 */
export const LEVEL_LABELS: Record<MemberLevel, string> = {
  normal: '普通',
  silver: '银卡',
  gold: '金卡',
  diamond: '钻石',
}

/** 预约状态 → 中文标签 */
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
}

/** 门店状态 → 中文标签 */
export const STORE_STATUS_LABELS: Record<string, string> = {
  active: '营业中',
  inactive: '已停业',
}
