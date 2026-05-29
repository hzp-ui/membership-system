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
      const preview = JSON.stringify(d)?.slice(0, 100)
      console.log(`✅ ${name}: ${preview}`)
    }
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`)
  }
}

async function main() {
  const { data: admins } = await supabase.from('admins').select('id').limit(1)
  if (!admins || admins.length === 0) { console.log('❌ 没有 admin'); return }
  const aid = admins[0].id

  const { data: stores } = await supabase.from('stores').select('id').limit(1)
  const storeId = stores?.[0]?.id
  const { data: members } = await supabase.from('members').select('id').limit(1)
  const memberId = members?.[0]?.id
  const { data: svcs } = await supabase.from('services').select('id').limit(1)
  const svcId = svcs?.[0]?.id
  const { data: barbers } = await supabase.from('barbers').select('id').limit(1)
  const barberId = barbers?.[0]?.id

  console.log(`aid=${aid}`)
  console.log(`storeId=${storeId}`)
  console.log(`memberId=${memberId}`)
  console.log(`svcId=${svcId}`)
  console.log(`barberId=${barberId}\n`)

  // ========== 读操作 ==========
  console.log('=== 读操作 GET ===')
  await test('getStores',            () => supabase.rpc('rpc_get_stores',              { p_admin_id: aid, p_store_id: null }))
  await test('getAdmins',            () => supabase.rpc('rpc_get_admins',              { p_admin_id: aid, p_store_id: null }))
  await test('getMembers',           () => supabase.rpc('rpc_get_members',             { p_admin_id: aid, p_store_id: null }))
  await test('getBarbers',           () => supabase.rpc('rpc_get_barbers',            { p_admin_id: aid, p_store_id: null }))
  await test('getServices',           () => supabase.rpc('rpc_get_services',           { p_admin_id: aid, p_store_id: null }))
  await test('getServiceTypes',       () => supabase.rpc('rpc_get_service_types',      { p_admin_id: aid, p_store_id: null }))
  await test('getPackages',           () => supabase.rpc('rpc_get_packages',           { p_admin_id: aid, p_store_id: null }))
  await test('getRechargeRecords',    () => supabase.rpc('rpc_get_recharge_records',   { p_admin_id: aid, p_store_id: null }))
  await test('getConsumptionRecords', () => supabase.rpc('rpc_get_consumption_records',{ p_admin_id: aid, p_store_id: null }))
  await test('getAppointments',      () => supabase.rpc('rpc_get_appointments',       { p_admin_id: aid, p_store_id: null }))
  await test('financeSummary',        () => supabase.rpc('rpc_finance_summary',       { p_admin_id: aid, p_store_id: null, p_start_date: null, p_end_date: null }))
  await test('dailyStatements',       () => supabase.rpc('rpc_daily_statements',      { p_admin_id: aid, p_store_id: null, p_start_date: null, p_end_date: null }))
  await test('revenueStats',          () => supabase.rpc('rpc_revenue_stats',          { p_admin_id: aid, p_store_id: null, p_start_date: null, p_end_date: null, p_dimension: 'day' }))
  await test('memberGrowthStats',     () => supabase.rpc('rpc_member_growth_stats',    { p_admin_id: aid, p_store_id: null, p_start_date: null, p_end_date: null, p_dimension: 'day' }))
  await test('hotServicesStats',      () => supabase.rpc('rpc_hot_services_stats',     { p_admin_id: aid, p_store_id: null, p_start_date: null, p_end_date: null }))

  // ========== 写操作 ==========
  console.log('\n=== 写操作 CREATE / UPDATE / DELETE ===')

  // —— createMember（前端有此功能，但 DB 无此 RPC，跳过）——
  // 用直接 insert 测（anon key 无权限则跳过）
  if (storeId) {
    await test('createService', () => supabase.rpc('rpc_create_service', {
      p_admin_id: aid, p_type: '烫发', p_name: '测试服务' + Date.now(), p_price: 88,
      p_discount_normal: 1, p_discount_silver: 0.95, p_discount_gold: 0.9, p_discount_diamond: 0.85,
      p_store_id: storeId
    }))
  }

  // updateService（用上面刚创建的，或现有的 svcId）
  if (svcId) {
    await test('updateService', () => supabase.rpc('rpc_update_service', {
      p_admin_id: aid, p_id: svcId,
      p_type: null, p_name: '改名测' + Date.now(), p_price: null,
      p_discount_normal: null, p_discount_silver: null, p_discount_gold: null, p_discount_diamond: null
    }))
  }

  // createPackage
  if (storeId) {
    await test('createPackage', () => supabase.rpc('rpc_create_package', {
      p_admin_id: aid, p_name: '测试套餐' + Date.now(), p_amount: 200, p_bonus: 20,
      p_status: 'active', p_store_id: storeId
    }))
  }

  // updatePackage
  const { data: pkgs } = await supabase.from('recharge_packages').select('id').limit(1)
  if (pkgs?.[0]) {
    await test('updatePackage', () => supabase.rpc('rpc_update_package', {
      p_admin_id: aid, p_id: pkgs[0].id,
      p_name: '改名了', p_amount: null, p_bonus: null, p_status: null
    }))
  }

  // createServiceType（用时间戳保证唯一）
  if (storeId) {
    await test('createServiceType', () => supabase.rpc('rpc_create_service_type', {
      p_admin_id: aid, p_name: '测试类型' + Date.now(), p_store_id: storeId
    }))
  }

  // createAppointment（重新查有效 service/barber）
  if (memberId && storeId) {
    const { data: freshSvcs }   = await supabase.from('services').select('id').limit(1)
    const { data: freshBarbers } = await supabase.from('barbers').select('id').limit(1)
    const freshSvcId     = freshSvcs?.[0]?.id
    const freshBarberId  = freshBarbers?.[0]?.id
    if (freshSvcId) {
      const apptTime = new Date(Date.now() + 86400000).toISOString()
      await test('createAppointment', () => supabase.rpc('rpc_create_appointment', {
        p_admin_id: aid, p_member_id: memberId,
        p_barber_id: freshBarberId, p_service_id: freshSvcId, p_appointment_time: apptTime
      }))
    }
  }

  // confirm / complete / cancel（找最新 pending 预约）
  const { data: pendingAppts } = await supabase.from('appointments')
    .select('id,status').in('status', ['pending','confirmed']).order('created_at',{ascending:false}).limit(3)

  if (pendingAppts?.length > 0) {
    const p = pendingAppts[0]
    if (p.status === 'pending') {
      await test('confirmAppointment', () => supabase.rpc('rpc_confirm_appointment', { p_admin_id: aid, p_id: p.id }))
      // 再查一次，确认后 complete
      const { data: c } = await supabase.from('appointments').select('id').eq('status','confirmed').limit(1)
      if (c?.[0]) {
        await test('completeAppointment', () => supabase.rpc('rpc_complete_appointment', { p_admin_id: aid, p_id: c[0].id }))
      }
    }
    // cancel 一个 pending 或 confirmed
    const toCancel = pendingAppts.find(x => x.status === 'pending') || pendingAppts[0]
    await test('cancelAppointment', () => supabase.rpc('rpc_cancel_appointment', { p_admin_id: aid, p_id: toCancel.id }))
  }

  // recharge / customRecharge / consume
  if (memberId && svcId) {
    const { data: pkgs2 } = await supabase.from('recharge_packages').select('id').limit(1)
    if (pkgs2?.[0]) {
      await test('recharge (package)', () => supabase.rpc('rpc_recharge', {
        p_admin_id: aid, p_member_id: memberId, p_package_id: pkgs2[0].id
      }))
    }
    await test('customRecharge', () => supabase.rpc('rpc_custom_recharge', {
      p_admin_id: aid, p_member_id: memberId, p_amount: 10, p_bonus: 0
    }))
    await test('consume', () => supabase.rpc('rpc_consume', {
      p_admin_id: aid, p_member_id: memberId, p_service_id: svcId, p_barber_id: barberId
    }))
  }

  console.log('\n=== 完成 ===')
}

main()
