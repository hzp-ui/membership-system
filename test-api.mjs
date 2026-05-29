import { createClient } from '@supabase/supabase-js'

const URL = 'https://yknvmkzgsoirjfchabov.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbnZta3pnc29pcmpmY2hhYm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTg0NjksImV4cCI6MjA5NDczNDQ2OX0.1FLE8GXo9Xl43bwjLGC-nvUZ67Q8SVphx__pE4bW4lk'

const supabase = createClient(URL, KEY)

async function test(name, fn) {
  try {
    const result = await fn()
    if (result.error) {
      console.log(`❌ ${name}: ${result.error.message}`)
    } else {
      const d = result.data
      const preview = JSON.stringify(d)?.slice(0, 80)
      console.log(`✅ ${name}: ${preview}`)
    }
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`)
  }
}

async function main() {
  console.log('=== 1. 管理员登录 ===')
  // 尝试登录，找一个存在的 admin
  const { data: admins } = await supabase.from('admins').select('id, username').limit(3)
  if (!admins || admins.length === 0) {
    console.log('❌ 没有 admin 记录，无法测试')
    return
  }
  console.log(`找到 admin: ${JSON.stringify(admins[0])}`)
  const aid = admins[0].id
  console.log(`\n用 admin_id: ${aid}\n`)

  console.log('=== 2. 读操作（GET）===')
  await test('getStores', () => supabase.rpc('rpc_get_stores', { p_admin_id: aid, p_store_id: null }))
  await test('getAdmins', () => supabase.rpc('rpc_get_admins', { p_admin_id: aid, p_store_id: null }))
  await test('getMembers', () => supabase.rpc('rpc_get_members', { p_admin_id: aid, p_store_id: null }))
  await test('getBarbers', () => supabase.rpc('rpc_get_barbers', { p_admin_id: aid, p_store_id: null }))
  await test('getServices', () => supabase.rpc('rpc_get_services', { p_admin_id: aid, p_store_id: null }))
  await test('getServiceTypes', () => supabase.rpc('rpc_get_service_types', { p_admin_id: aid, p_store_id: null }))
  await test('getPackages', () => supabase.rpc('rpc_get_packages', { p_admin_id: aid, p_store_id: null }))
  await test('getRechargeRecords', () => supabase.rpc('rpc_get_recharge_records', { p_admin_id: aid, p_store_id: null }))
  await test('getConsumptionRecords', () => supabase.rpc('rpc_get_consumption_records', { p_admin_id: aid, p_store_id: null }))
  await test('getAppointments', () => supabase.rpc('rpc_get_appointments', { p_admin_id: aid, p_store_id: null }))
  await test('financeSummary', () => supabase.rpc('rpc_finance_summary', { p_admin_id: aid, p_store_id: null, p_start_date: null, p_end_date: null }))
  await test('dailyStatements', () => supabase.rpc('rpc_daily_statements', { p_admin_id: aid, p_store_id: null, p_start_date: null, p_end_date: null }))
  await test('revenueStats', () => supabase.rpc('rpc_revenue_stats', { p_admin_id: aid, p_store_id: null, p_days: 30 }))
  await test('memberGrowthStats', () => supabase.rpc('rpc_member_growth_stats', { p_admin_id: aid, p_store_id: null, p_days: 30 }))
  await test('hotServicesStats', () => supabase.rpc('rpc_hot_services_stats', { p_admin_id: aid, p_store_id: null, p_days: 30 }))

  console.log('\n=== 3. 写操作（CREATE/UPDATE/DELETE）===')
  // 找一条 stores 记录
  const { data: stores } = await supabase.from('stores').select('id').limit(1)
  const storeId = stores?.[0]?.id

  if (storeId) {
    await test('createMember', () => supabase.rpc('rpc_create_member', {
      p_admin_id: aid, p_name: '测试会员', p_phone: '13800000000',
      p_level: 'normal', p_store_id: storeId, p_password: '123456'
    }))
    // 找刚创建的会员
    const { data: newMember } = await supabase.from('members').select('id').eq('phone', '13800000000').single()
    if (newMember) {
      await test('updateMember', () => supabase.rpc('rpc_update_member', {
        p_admin_id: aid, p_id: newMember.id, p_name: '测试会员_改', p_level: 'silver'
      }))
      await test('customRecharge', () => supabase.rpc('rpc_custom_recharge', {
        p_admin_id: aid, p_member_id: newMember.id, p_amount: 100, p_bonus: 10
      }))
    }
    await test('createService', () => supabase.rpc('rpc_create_service', {
      p_admin_id: aid, p_type: '剪发', p_name: '洗剪吹', p_price: 58,
      p_discount_normal: 1.0, p_discount_silver: 0.95, p_discount_gold: 0.9, p_discount_diamond: 0.85,
      p_store_id: storeId
    }))
    const { data: newSvc } = await supabase.from('services').select('id').eq('name', '洗剪吹').single()
    if (newSvc) {
      await test('updateService', () => supabase.rpc('rpc_update_service', {
        p_admin_id: aid, p_id: newSvc.id, p_name: '洗剪吹_改', p_price: 68
      }))
    }
    await test('createServiceType', () => supabase.rpc('rpc_create_service_type', {
      p_admin_id: aid, p_name: '测试类型', p_store_id: storeId
    }))
    const { data: newSt } = await supabase.from('service_types').select('id').eq('name', '测试类型').single()
    if (newSt) {
      await test('deleteServiceType', () => supabase.rpc('rpc_delete_service_type', {
        p_admin_id: aid, p_id: newSt.id
      }))
    }
    await test('createPackage', () => supabase.rpc('rpc_create_package', {
      p_admin_id: aid, p_name: '测试套餐', p_amount: 500, p_bonus: 50,
      p_store_id: storeId, p_status: 'active'
    }))
    const { data: newPkg } = await supabase.from('packages').select('id').eq('name', '测试套餐').single()
    if (newPkg) {
      await test('updatePackage', () => supabase.rpc('rpc_update_package', {
        p_admin_id: aid, p_id: newPkg.id, p_name: '测试套餐_改'
      }))
    }
  } else {
    console.log('⚠️ 没有 stores 记录，跳过需要 store_id 的写操作')
  }

  // 找一条 members 记录用于消费测试
  const { data: members } = await supabase.from('members').select('id').limit(1)
  const memberId = members?.[0]?.id
  const { data: svcs } = await supabase.from('services').select('id').limit(1)
  const svcId = svcs?.[0]?.id
  if (memberId && svcId) {
    await test('consume', () => supabase.rpc('rpc_consume', {
      p_admin_id: aid, p_member_id: memberId, p_service_id: svcId, p_barber_id: null
    }))
  }

  // 找一条 packages 记录
  const { data: pkgs } = await supabase.from('packages').select('id').limit(1)
  if (memberId && pkgs?.[0]?.id) {
    await test('recharge (package)', () => supabase.rpc('rpc_recharge', {
      p_admin_id: aid, p_member_id: memberId, p_package_id: pkgs[0].id
    }))
  }

  // 创建预约测试
  if (memberId && storeId) {
    await test('createAppointment', () => supabase.rpc('rpc_create_appointment', {
      p_admin_id: aid, p_member_id: memberId, p_store_id: storeId,
      p_barber_id: null, p_service_id: svcId || null,
      p_appointment_time: new Date(Date.now() + 86400000).toISOString(),
      p_status: 'pending', p_notes: 'API测试'
    }))
    const { data: newAppt } = await supabase.from('appointments')
      .select('id').eq('notes', 'API测试').order('created_at', { ascending: false }).limit(1).single()
    if (newAppt) {
      await test('confirmAppointment', () => supabase.rpc('rpc_confirm_appointment', { p_admin_id: aid, p_id: newAppt.id }))
      await test('cancelAppointment', () => supabase.rpc('rpc_cancel_appointment', { p_admin_id: aid, p_id: newAppt.id }))
    }
  }

  // 清理测试数据
  await supabase.from('members').delete().eq('phone', '13800000000')

  console.log('\n=== 测试完成 ===')
}

main()
