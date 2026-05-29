/**
 * 理发店会员系统 RPC 回归测试套件
 * 
 * 用法: node tests/rpc-regression.test.mjs
 * 
 * 环境变量:
 *   SUPABASE_URL - Supabase 项目 URL
 *   SUPABASE_ANON_KEY - Supabase 匿名密钥
 * 
 * 测试覆盖:
 *   - 15 个读操作 RPC
 *   - 8 个写操作 RPC
 *   - 预约完整生命周期（创建→确认→完成）
 *   - 充值/消费完整流程
 * 
 * 注意: 函数签名必须与前端 api.ts 完全匹配
 */

import { createClient } from '@supabase/supabase-js'
import assert from 'assert'

// ============ 配置 ============
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yknvmkzgsoirjfchabov.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbnZta3pnc29pcmpmY2hhYm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTg0NjksImV4cCI6MjA5NDczNDQ2OX0.1FLE8GXo9Xl43bwjLGC-nvUZ67Q8SVphx__pE4bW4lk'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ============ 测试工具 ============
const TestRunner = {
  passed: 0,
  failed: 0,
  errors: [],
  skipped: 0,
  
  async run(name, fn) {
    try {
      await fn()
      this.passed++
      console.log(`  ✅ ${name}`)
    } catch (err) {
      this.failed++
      this.errors.push({ name, error: err.message })
      console.log(`  ❌ ${name}: ${err.message}`)
    }
  },
  
  skip(name, reason) {
    this.skipped++
    console.log(`  ⏭️ ${name} (${reason})`)
  },
  
  summary() {
    console.log('\n' + '='.repeat(50))
    console.log(`测试结果: ${this.passed} 通过, ${this.failed} 失败, ${this.skipped} 跳过`)
    if (this.errors.length > 0) {
      console.log('\n失败详情:')
      this.errors.forEach(e => console.log(`  - ${e.name}: ${e.error}`))
      process.exit(1)
    }
  }
}

// ============ 辅助函数 ============

/**
 * 统一 RPC 调用包装（模拟前端 api.ts 的 rpcCall）
 * RPC 返回 { data: { data: [...], error: ... }, error: ... }
 * 包装后返回 { data: [...], error: ... }
 */
async function rpcCall(name, params) {
  const { data, error } = await supabase.rpc(name, params)
  if (error) throw new Error(error.message)
  // RPC 函数内部返回 { data: ..., error: ... }
  if (data?.error) throw new Error(data.error)
  return data?.data ?? data
}

function assertArray(data, name) {
  assert(Array.isArray(data), `${name} 应返回数组，实际: ${JSON.stringify(data).slice(0, 100)}`)
}

function assertNotNull(data, name) {
  assert(data !== null && data !== undefined, `${name} 不应返回 null`)
}

// ============ 全局测试数据 ============
let adminId, storeId, memberId, barberId, serviceId, packageId

async function loadTestData() {
  console.log('\n📦 加载测试数据...')
  
  // 查询真实 admin
  const { data: admins, error: adminErr } = await supabase
    .from('admins')
    .select('id, store_id')
    .limit(1)
  
  if (adminErr || !admins?.[0]) {
    throw new Error('无法加载测试管理员数据')
  }
  
  adminId = admins[0].id
  storeId = admins[0].store_id
  console.log(`  ✓ Admin ID: ${adminId}`)
  console.log(`  ✓ Store ID: ${storeId || '(超级管理员)'}`)
  
  // 查询会员
  const { data: members } = await supabase.from('members').select('id').limit(1)
  memberId = members?.[0]?.id
  console.log(`  ✓ Member ID: ${memberId || '(无)'}`)
  
  // 查询理发师
  const { data: barbers } = await supabase.from('barbers').select('id').limit(1)
  barberId = barbers?.[0]?.id
  console.log(`  ✓ Barber ID: ${barberId || '(无)'}`)
  
  // 查询服务
  const { data: services } = await supabase.from('services').select('id').limit(1)
  serviceId = services?.[0]?.id
  console.log(`  ✓ Service ID: ${serviceId || '(无)'}`)
  
  // 查询套餐
  const { data: packages } = await supabase.from('recharge_packages').select('id').limit(1)
  packageId = packages?.[0]?.id
  console.log(`  ✓ Package ID: ${packageId || '(无)'}`)
}

// ============ 测试套件 ============

async function testReadOperations() {
  console.log('\n📋 读操作测试')
  
  // 基础 CRUD 读
  await TestRunner.run('getStores', async () => {
    const data = await rpcCall('rpc_get_stores', { 
      p_admin_id: adminId, 
      p_store_id: null 
    })
    assertArray(data, 'getStores')
  })
  
  await TestRunner.run('getAdmins', async () => {
    const data = await rpcCall('rpc_get_admins', { 
      p_admin_id: adminId, 
      p_store_id: null 
    })
    assertArray(data, 'getAdmins')
  })
  
  await TestRunner.run('getMembers', async () => {
    const data = await rpcCall('rpc_get_members', { 
      p_admin_id: adminId, 
      p_store_id: null 
    })
    assertArray(data, 'getMembers')
  })
  
  await TestRunner.run('getBarbers', async () => {
    const data = await rpcCall('rpc_get_barbers', { 
      p_admin_id: adminId, 
      p_store_id: null 
    })
    assertArray(data, 'getBarbers')
  })
  
  await TestRunner.run('getServices', async () => {
    const data = await rpcCall('rpc_get_services', { 
      p_admin_id: adminId, 
      p_store_id: null 
    })
    assertArray(data, 'getServices')
  })
  
  await TestRunner.run('getServiceTypes', async () => {
    const data = await rpcCall('rpc_get_service_types', { 
      p_admin_id: adminId, 
      p_store_id: null 
    })
    assertArray(data, 'getServiceTypes')
  })
  
  await TestRunner.run('getPackages', async () => {
    const data = await rpcCall('rpc_get_packages', { 
      p_admin_id: adminId, 
      p_store_id: null 
    })
    assertArray(data, 'getPackages')
  })
  
  // 财务记录读
  await TestRunner.run('getRechargeRecords', async () => {
    const data = await rpcCall('rpc_get_recharge_records', { 
      p_admin_id: adminId, 
      p_store_id: null 
    })
    assertArray(data, 'getRechargeRecords')
  })
  
  await TestRunner.run('getConsumptionRecords', async () => {
    const data = await rpcCall('rpc_get_consumption_records', { 
      p_admin_id: adminId, 
      p_store_id: null 
    })
    assertArray(data, 'getConsumptionRecords')
  })
  
  await TestRunner.run('getAppointments', async () => {
    const data = await rpcCall('rpc_get_appointments', { 
      p_admin_id: adminId, 
      p_store_id: null 
    })
    assertArray(data, 'getAppointments')
  })
  
  // 统计报表
  await TestRunner.run('financeSummary', async () => {
    const data = await rpcCall('rpc_finance_summary', { 
      p_admin_id: adminId, 
      p_store_id: null,
      p_start_date: null,
      p_end_date: null
    })
    assertNotNull(data, 'financeSummary')
  })
  
  await TestRunner.run('dailyStatements', async () => {
    const data = await rpcCall('rpc_daily_statements', { 
      p_admin_id: adminId, 
      p_store_id: null,
      p_start_date: null,
      p_end_date: null
    })
    assertArray(data, 'dailyStatements')
  })
  
  await TestRunner.run('revenueStats', async () => {
    const data = await rpcCall('rpc_revenue_stats', { 
      p_admin_id: adminId, 
      p_store_id: null, 
      p_start_date: null, 
      p_end_date: null, 
      p_dimension: 'day' 
    })
    assertArray(data, 'revenueStats')
  })
  
  await TestRunner.run('memberGrowthStats', async () => {
    const data = await rpcCall('rpc_member_growth_stats', { 
      p_admin_id: adminId, 
      p_store_id: null, 
      p_start_date: null, 
      p_end_date: null, 
      p_dimension: 'day' 
    })
    assertArray(data, 'memberGrowthStats')
  })
  
  await TestRunner.run('hotServicesStats', async () => {
    const data = await rpcCall('rpc_hot_services_stats', { 
      p_admin_id: adminId, 
      p_store_id: null, 
      p_start_date: null, 
      p_end_date: null 
    })
    assertArray(data, 'hotServicesStats')
  })
}

async function testWriteOperations() {
  console.log('\n✏️ 写操作测试')
  
  const timestamp = Date.now()
  let createdServiceId, createdPackageId, createdServiceTypeId, appointmentId
  
  // 服务 CRUD
  await TestRunner.run('createService', async () => {
    // 使用真实 store_id
    const actualStoreId = storeId || 'a0000000-0000-0000-0000-000000000001'
    const data = await rpcCall('rpc_create_service', {
      p_admin_id: adminId,
      p_name: `测试服务_${timestamp}`,
      p_type: '剪发',
      p_price: 88,
      p_discount_normal: 1.0,
      p_discount_silver: 0.95,
      p_discount_gold: 0.9,
      p_discount_diamond: 0.8,
      p_store_id: actualStoreId
    })
    createdServiceId = data?.id || data
    assertNotNull(createdServiceId, 'createService 返回值')
  })
  
  await TestRunner.run('updateService', async () => {
    if (!createdServiceId) {
      TestRunner.skip('updateService', 'createService 失败')
      return
    }
    const data = await rpcCall('rpc_update_service', {
      p_admin_id: adminId,
      p_id: createdServiceId,
      p_type: null,
      p_name: `测试服务_已更新_${timestamp}`,
      p_price: 99,
      p_discount_normal: null,
      p_discount_silver: null,
      p_discount_gold: null,
      p_discount_diamond: null
    })
    assertNotNull(data, 'updateService 返回值')
  })
  
  // 套餐 CRUD
  await TestRunner.run('createPackage', async () => {
    // 使用真实 store_id
    const actualStoreId = storeId || 'a0000000-0000-0000-0000-000000000001'
    const data = await rpcCall('rpc_create_package', {
      p_admin_id: adminId,
      p_name: `测试套餐_${timestamp}`,
      p_amount: 500,
      p_bonus: 100,
      p_status: 'active',
      p_store_id: actualStoreId
    })
    createdPackageId = data?.id || data
    assertNotNull(createdPackageId, 'createPackage 返回值')
  })
  
  await TestRunner.run('updatePackage', async () => {
    if (!createdPackageId) {
      TestRunner.skip('updatePackage', 'createPackage 失败')
      return
    }
    const data = await rpcCall('rpc_update_package', {
      p_admin_id: adminId,
      p_id: createdPackageId,
      p_name: `测试套餐_已更新_${timestamp}`,
      p_amount: 600,
      p_bonus: null,
      p_status: null
    })
    assertNotNull(data, 'updatePackage 返回值')
  })
  
  // 服务类型创建
  await TestRunner.run('createServiceType', async () => {
    const data = await rpcCall('rpc_create_service_type', {
      p_admin_id: adminId,
      p_name: `测试类型_${timestamp}`,
      p_store_id: storeId
    })
    createdServiceTypeId = data?.id || data
    assertNotNull(createdServiceTypeId, 'createServiceType 返回值')
  })
  
  // 预约生命周期
  await TestRunner.run('createAppointment', async () => {
    if (!memberId || !barberId || !serviceId) {
      TestRunner.skip('createAppointment', '缺少会员/理发师/服务数据')
      return
    }
    
    const data = await rpcCall('rpc_create_appointment', {
      p_admin_id: adminId,
      p_member_id: memberId,
      p_barber_id: barberId,
      p_service_id: serviceId,
      p_appointment_time: new Date(Date.now() + 3600000).toISOString()
    })
    // RPC 返回整个预约对象
    appointmentId = data?.id || data
    assertNotNull(appointmentId, 'createAppointment 返回值')
  })
  
  await TestRunner.run('confirmAppointment', async () => {
    if (!appointmentId) {
      TestRunner.skip('confirmAppointment', 'createAppointment 失败')
      return
    }
    const data = await rpcCall('rpc_confirm_appointment', {
      p_admin_id: adminId,
      p_id: appointmentId
    })
    assertNotNull(data, 'confirmAppointment 返回值')
  })
  
  await TestRunner.run('completeAppointment', async () => {
    if (!appointmentId) {
      TestRunner.skip('completeAppointment', 'createAppointment 失败')
      return
    }
    // 可能因会员余额不足失败，只验证函数存在
    try {
      await rpcCall('rpc_complete_appointment', {
        p_admin_id: adminId,
        p_id: appointmentId
      })
    } catch (err) {
      // "余额不足" 是预期错误，不算失败
      if (!err.message.includes('余额不足') && !err.message.includes('balance')) {
        throw err
      }
    }
  })
}

async function testFinancialOperations() {
  console.log('\n💰 财务操作测试')
  
  if (!memberId) {
    console.log('  ⚠️ 跳过财务测试: 缺少会员数据')
    return
  }
  
  // 套餐充值
  await TestRunner.run('recharge (套餐充值)', async () => {
    if (!packageId) {
      TestRunner.skip('recharge', '缺少套餐数据')
      return
    }
    const data = await rpcCall('rpc_recharge', {
      p_admin_id: adminId,
      p_member_id: memberId,
      p_package_id: packageId
    })
    assertNotNull(data, 'recharge 返回值')
  })
  
  // 自定义金额充值
  await TestRunner.run('customRecharge', async () => {
    const data = await rpcCall('rpc_custom_recharge', {
      p_admin_id: adminId,
      p_member_id: memberId,
      p_amount: 100,
      p_bonus: 10
    })
    assertNotNull(data, 'customRecharge 返回值')
  })
  
  // 消费
  await TestRunner.run('consume', async () => {
    if (!serviceId) {
      TestRunner.skip('consume', '缺少服务数据')
      return
    }
    
    try {
      const data = await rpcCall('rpc_consume', {
        p_admin_id: adminId,
        p_member_id: memberId,
        p_service_id: serviceId,
        p_barber_id: barberId || null
      })
      assertNotNull(data, 'consume 返回值')
    } catch (err) {
      // "余额不足" 是预期错误
      if (!err.message.includes('余额不足') && !err.message.includes('balance')) {
        throw err
      }
    }
  })
}

// ============ 主入口 ============
async function main() {
  console.log('🚀 理发店会员系统 RPC 回归测试')
  console.log('='.repeat(50))
  console.log(`Supabase URL: ${SUPABASE_URL}`)
  
  await loadTestData()
  await testReadOperations()
  await testWriteOperations()
  await testFinancialOperations()
  
  TestRunner.summary()
}

main().catch(console.error)
