/**
 * @file utils/index.ts - 通用工具函数
 * @description 提供标签映射、格式化、颜色映射、CSV 下载等通用工具函数
 * @module utils
 */

import { LEVEL_LABELS, APPOINTMENT_STATUS_LABELS, STORE_STATUS_LABELS } from '@/types'
import type { MemberLevel, AppointmentStatus, StoreStatus } from '@/types'

/** 获取会员等级中文标签 */
export const getLevelLabel = (level: MemberLevel) => LEVEL_LABELS[level] || level

/** 获取预约状态中文标签 */
export const getAppointmentStatusLabel = (status: AppointmentStatus) => APPOINTMENT_STATUS_LABELS[status] || status

/** 获取门店状态中文标签 */
export const getStoreStatusLabel = (status: StoreStatus) => STORE_STATUS_LABELS[status] || status

/** 获取会员等级对应的 Ant Design Tag 颜色 */
export const getLevelColor = (level: MemberLevel) => {
  const map: Record<MemberLevel, string> = { normal: 'default', silver: 'silver', gold: 'gold', diamond: 'red' }
  return map[level]
}

/** 获取预约状态对应的 Ant Design Tag 颜色 */
export const getAppointmentStatusColor = (status: AppointmentStatus) => {
  const map: Record<AppointmentStatus, string> = { pending: 'processing', confirmed: 'success', completed: 'default', cancelled: 'error' }
  return map[status]
}

/** 格式化金额显示（带 ¥ 前缀，保留两位小数） */
export const formatMoney = (amount: number | undefined | null) => `¥${(amount ?? 0).toFixed(2)}`

/** 格式化日期时间为中文本地格式 */
export const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const date = d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

/**
 * 下载 CSV 文件到本地
 * @param blob - CSV 文件的 Blob 对象
 * @param filename - 下载的文件名
 */
export const downloadCsv = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}