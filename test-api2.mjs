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

  console.log(`aid=${aid}, storeId=${storeId}, memberId=${memberId}, svcId=${svcId}, barberId=${barberId}\n`)

  console.log('=== UPDATE / DELETE ===')
  if (svcId) {
    await test('updateService', () => supabase.rpc('rpc_update_service', {
      p_admin_id: aid, p_id: svcId, p_type: null, p_name: '改名测', p_price: null,
      p_discount_normal: null, p_discount_silver: null, p_discount_gold: null, p_discount_diamond: null
    }))
    await test('deleteService', () => supabase.rpc('rpc_delete_service', { p_admin_id: aid, p_id: svcId }))
  } else {
    console.log('⚠️ 没有 service，跳过')
  }

  console.log('\n=== PACKAGE CRUD ===')
  await test('createPackage', () => supabase.rpc('rpc_create_package', {
    p_admin_id: aid, p_name: 'API测试套餐', p_amount: 300, p_bonus: 30,
    p_status: 'active', p_store_id: storeId
  }))
  const { data: pkgs } = await supabase.from('recharge_packages').select('id').eq('name', 'API测试套餐').limit(1)
  if (pkgs?.[0]) {
    await test('updatePackage', () => supabase.rpc('rpc_update_package', {
      p_admin_id: aid, p_id: pkgs[0].id, p_name: '改名了', p_amount: null, p_bonus: null, p_status: null
    }))
    await test('deletePackage', () => supabase.rpc('rpc_delete_package', { p_admin_id: aid, p_id: pkgs[0].id }))
  }

  console.log('\n=== SERVICE TYPE ===')
  // 先清理残留
  await supabase.from('service_types').delete().eq('name', 'API测试类型')
  await test('createServiceType', () => supabase.rpc('rpc_create_service_type', {
    p_admin_id: aid, p_name: 'API测试类型', p_store_id: storeId
  }))
  const { data: st } = await supabase.from('service_types').select('id').eq('name', 'API测试类型').limit(1)
  if (st?.[0]) {
    await test('deleteServiceType', () => supabase.rpc('rpc_delete_service_type', { p_admin_id: aid, p_id: st[0].id }))
  }

  console.log('\n=== APPOINTMENT ===')
  // 重新查一次有效的 service_id 和 barber_id（上面的 deleteService 可能把它们删了）
  const { data: freshSvcs } = await supabase.from('services').select('id').limit(1)
  const freshSvcId = freshSvcs?.[0]?.id
  const { data: freshBarbers } = await supabase.from('barbers').select('id').limit(1)
  const freshBarberId = freshBarbers?.[0]?.id
  if (memberId && storeId && freshSvcId) {
    const apptTime = new Date(Date.now() + 86400000).toISOString()
    await test('createAppointment', () => supabase.rpc('rpc_create_appointment', {
      p_admin_id: aid, p_member_id: memberId, p_barber_id: freshBarberId, p_service_id: freshSvcId, p_appointment_time: apptTime
    }))
    const { data: newAppt } = await supabase.from('appointments')
      .select('id').order('created_at', { ascending: false }).limit(1).single()
    if (newAppt) {
      await test('confirmAppointment', () => supabase.rpc('rpc_confirm_appointment', { p_admin_id: aid, p_id: newAppt.id }))
      await test('completeAppointment', () => supabase.rpc('rpc_complete_appointment', { p_admin_id: aid, p_id: newAppt.id }))
    }
    // 再创建一个用来取消
    const { data: newAppt2 } = await supabase.from('appointments')
      .select('id').eq('status', 'pending').limit(1).single()
    if (newAppt2) {
      await test('cancelAppointment (confirmed)', () => supabase.rpc('rpc_cancel_appointment', { p_admin_id: aid, p_id: newAppt2.id }))
    }
  }

  console.log('\n=== STATS ===')
  await test('revenueStats', () => supabase.rpc('rpc_revenue_stats', {
    p_admin_id: aid, p_store_id: null, p_start_date: null, p_end_date: null, p_dimension: 'day'
  }))
  await test('memberGrowthStats', () => supabase.rpc('rpc_member_growth_stats', {
    p_admin_id: aid, p_store_id: null, p_start_date: null, p_end_date: null, p_dimension: 'day'
  }))
  await test('hotServicesStats', () => supabase.rpc('rpc_hot_services_stats', {
    p_admin_id: aid, p_store_id: null, p_start_date: null, p_end_date: null
  }))

  console.log('\n=== 清理 ===')
  await supabase.from('service_types').delete().eq('name', 'API测试类型')
  await supabase.from('members').delete().eq('phone', '13800000000')

  console.log('\n=== 完成 ===')
}

main()
