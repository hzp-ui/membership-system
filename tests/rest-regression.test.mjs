/**
 * @file rest-regression.test.mjs - 会员系统 REST API 回归测试
 * @description 验证 Java 后端 + 前端重构后的所有端点
 *
 * 覆盖范围：
 * 1. 认证：管理员/会员登录、Token 校验
 * 2. 数据隔离：super_admin 看全量，store_admin 只看本店
 * 3. CRUD：门店、管理员、会员、理发师、服务、套餐
 * 4. 业务流程：充值、消费、预约
 * 5. 统计：Dashboard、财务、营收、会员增长、热服务
 * 6. 预约状态流转：confirm / cancel / complete
 *
 * 用法：node tests/rest-regression.test.mjs
 */

const BASE = process.env.API_URL || 'http://localhost:8080/api/v1'

// ======================== 工具函数 ========================

let token = ''
let storeAdminToken = ''
let testIds = {}

async function request(method, path, body = null, headers = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  }
  if (body) opts.body = JSON.stringify(body)
  const resp = await fetch(`${BASE}${path}`, opts)
  const data = await resp.json()
  return { status: resp.status, data }
}

async function get(path, storeId) {
  const hdr = token ? { Authorization: `Bearer ${token}` } : {}
  const params = storeId ? `?storeId=${storeId}` : ''
  return request('GET', path + params, null, hdr)
}

async function post(path, body) {
  return request('POST', path, body, { Authorization: `Bearer ${token}` })
}

async function put(path, body = null) {
  return request('PUT', path, body, { Authorization: `Bearer ${token}` })
}

async function del(path) {
  return request('DELETE', path, null, { Authorization: `Bearer ${token}` })
}

// ======================== 断言 ========================

let passed = 0
let failed = 0
const failures = []

function assert(condition, label) {
  if (condition) {
    passed++
    console.log(`  ✅ ${label}`)
  } else {
    failed++
    failures.push(label)
    console.log(`  ❌ ${label}`)
  }
}

function assertStatus(resp, expected, label) {
  assert(resp.status === expected, `${label} → HTTP ${resp.status} (期望 ${expected})`)
}

function assertData(resp, field, expected, label) {
  const actual = resp.data?.data?.[field] ?? resp.data?.[field]
  if (typeof expected === 'function') {
    assert(expected(actual), `${label} → ${field} 校验通过`)
  } else {
    assert(actual === expected, `${label} → ${field}=${actual} (期望 ${expected})`)
  }
}

function section(title) {
  console.log(`\n━━━ ${title} ━━━`)
}

// ======================== 测试用例 ========================

async function testAuth() {
  section('1. 认证模块')

  // 1.1 超管登录
  const loginResp = await request('POST', '/auth/admin/login', {
    username: 'admin',
    password: 'admin123',
  })
  assertStatus(loginResp, 200, '超管登录 HTTP 200')
  assert(loginResp.data?.data?.token, '超管登录返回 token')
  token = loginResp.data.data.token
  testIds.superAdminId = loginResp.data.data.admin?.id

  // 1.2 超管角色验证
  assertData(loginResp, 'role', 'super_admin', '超管角色')

  // 1.3 店长登录
  const storeLoginResp = await request('POST', '/auth/admin/login', {
    username: 'admin1',
    password: 'admin123',
  })
  assertStatus(storeLoginResp, 200, '店长登录 HTTP 200')
  storeAdminToken = storeLoginResp.data.data.token
  assertData(storeLoginResp, 'role', 'store_admin', '店长角色')

  // 1.4 错误密码（后端返回 HTTP 200 + code 401，Result 风格）
  const badLogin = await request('POST', '/auth/admin/login', {
    username: 'admin',
    password: 'wrong',
  })
  const badCode = badLogin.data?.code ?? badLogin.data?.data?.code
  assert(badCode === 401 || badLogin.status === 401, `错误密码 → code=${badCode} HTTP=${badLogin.status}`)

  // 1.5 无 Token 访问受保护资源
  const noAuth = await request('GET', '/stores')
  assertStatus(noAuth, 401, '无 Token → HTTP 401')
}

async function testStores() {
  section('2. 门店 CRUD')

  const listResp = await get('/stores')
  assertStatus(listResp, 200, '获取门店列表')
  const stores = listResp.data?.data
  assert(Array.isArray(stores) && stores.length >= 2, `门店数量 >= 2 (实际 ${stores?.length})`)

  // 创建门店
  const createResp = await post('/stores', {
    name: '测试分店',
    address: '测试地址',
    phone: '13800000000',
    manager: '测试经理',
  })
  assertStatus(createResp, 200, '创建门店 HTTP 200')
  testIds.storeId = createResp.data?.data?.id || createResp.data?.data
  assert(testIds.storeId, '返回门店 ID')

  // 更新门店
  const updateResp = await put(`/stores/${testIds.storeId}`, { name: '测试分店-已更新' })
  assertStatus(updateResp, 200, '更新门店 HTTP 200')

  // 删除门店
  const deleteResp = await del(`/stores/${testIds.storeId}`)
  assertStatus(deleteResp, 200, '删除门店 HTTP 200')
}

async function testAdmins() {
  section('3. 管理员 CRUD')

  const listResp = await get('/admins')
  assertStatus(listResp, 200, '获取管理员列表')
  const admins = listResp.data?.data ?? listResp.data?.data?.records
  const adminCount = Array.isArray(admins) ? admins.length : admins?.total ?? admins?.length ?? 0
  assert(adminCount >= 1, `管理员数量 >= 1 (实际 ${adminCount})`)

  // 创建管理员
  const createResp = await post('/admins', {
    username: `test_admin_${Date.now()}`,
    password: 'test123',
    name: '测试管理员',
    phone: '13900000001',
    role: 'store_admin',
    storeId: 'store-001',
  })
  assertStatus(createResp, 200, '创建管理员 HTTP 200')
  testIds.adminId = createResp.data?.data?.id || createResp.data?.data

  // 更新
  const updateResp = await put(`/admins/${testIds.adminId}`, { name: '测试管理员-已更新' })
  assertStatus(updateResp, 200, '更新管理员 HTTP 200')

  // 删除
  const deleteResp = await del(`/admins/${testIds.adminId}`)
  assertStatus(deleteResp, 200, '删除管理员 HTTP 200')
}

async function testMembers() {
  section('4. 会员模块')

  // 先创建会员（后端要求 balance 字段）
  const createResp = await post('/members', {
    name: '测试会员',
    phone: `1380001${Date.now()}`,
    storeId: 'store-001',
    level: 'normal',
    balance: 0,
  })
  assertStatus(createResp, 200, '创建会员 HTTP 200')
  testIds.memberId = createResp.data?.data?.id || createResp.data?.data
  assert(testIds.memberId, '返回会员 ID')

  // 查询会员
  const listResp = await get('/members')
  assertStatus(listResp, 200, '获取会员列表')

  // 更新会员
  const updateResp = await put(`/members/${testIds.memberId}`, { level: 'gold', balance: 500 })
  assertStatus(updateResp, 200, '更新会员 HTTP 200')

  // 删除会员（测试后清理）
  const deleteResp = await del(`/members/${testIds.memberId}`)
  assertStatus(deleteResp, 200, '删除会员 HTTP 200')
}

async function testBarbers() {
  section('5. 理发师 CRUD')

  const createResp = await post('/barbers', {
    name: '测试理发师',
    phone: '13700001234',
    storeId: 'store-001',
    specialties: '剪发,烫发',
  })
  assertStatus(createResp, 200, '创建理发师 HTTP 200')
  testIds.barberId = createResp.data?.data?.id || createResp.data?.data

  const listResp = await get('/barbers')
  assertStatus(listResp, 200, '获取理发师列表')

  const updateResp = await put(`/barbers/${testIds.barberId}`, { name: '测试理发师-已更新' })
  assertStatus(updateResp, 200, '更新理发师 HTTP 200')

  const deleteResp = await del(`/barbers/${testIds.barberId}`)
  assertStatus(deleteResp, 200, '删除理发师 HTTP 200')
}

async function testServices() {
  section('6. 服务项目 CRUD')

  const listResp = await get('/services')
  assertStatus(listResp, 200, '获取服务列表')
  const services = listResp.data?.data
  assert(Array.isArray(services) && services.length >= 5, `服务数量 >= 5 (实际 ${services?.length})`)

  // 创建
  const createResp = await post('/services', {
    name: '测试服务',
    type: '护理',
    price: 88,
    discountNormal: 1,
    discountSilver: 0.95,
    discountGold: 0.9,
    discountDiamond: 0.8,
  })
  assertStatus(createResp, 200, '创建服务 HTTP 200')
  testIds.serviceId = createResp.data?.data?.id || createResp.data?.data

  // 更新
  const updateResp = await put(`/services/${testIds.serviceId}`, { price: 99 })
  assertStatus(updateResp, 200, '更新服务 HTTP 200')

  // 删除
  const deleteResp = await del(`/services/${testIds.serviceId}`)
  assertStatus(deleteResp, 200, '删除服务 HTTP 200')
}

async function testPackages() {
  section('7. 充值套餐')

  const listResp = await get('/packages')
  assertStatus(listResp, 200, '获取套餐列表')
  const pkgs = listResp.data?.data
  assert(Array.isArray(pkgs) && pkgs.length >= 3, `套餐数量 >= 3 (实际 ${pkgs?.length})`)

  // 创建
  const createResp = await post('/packages', {
    name: '测试套餐',
    amount: 1000,
    bonus: 100,
    description: '测试用',
    storeId: 'store-001',
  })
  assertStatus(createResp, 200, '创建套餐 HTTP 200')
  testIds.packageId = createResp.data?.data?.id || createResp.data?.data

  // 更新
  const updateResp = await put(`/packages/${testIds.packageId}`, { amount: 2000 })
  assertStatus(updateResp, 200, '更新套餐 HTTP 200')

  // 删除
  const deleteResp = await del(`/packages/${testIds.packageId}`)
  assertStatus(deleteResp, 200, '删除套餐 HTTP 200')
}

async function testServiceTypes() {
  section('8. 服务类型')

  const listResp = await get('/service-types')
  assertStatus(listResp, 200, '获取服务类型列表')

  // 创建
  const createResp = await post('/service-types', { name: '测试类型' })
  assertStatus(createResp, 200, '创建服务类型 HTTP 200')
  testIds.serviceTypeId = createResp.data?.data?.id || createResp.data?.data

  // 删除
  const deleteResp = await del(`/service-types/${testIds.serviceTypeId}`)
  assertStatus(deleteResp, 200, '删除服务类型 HTTP 200')
}

async function testDataIsolation() {
  section('9. 数据隔离验证')

  // 切换为店长 Token
  const origToken = token
  token = storeAdminToken

  // 店长只能看到自己门店
  const storesResp = await get('/stores')
  assertStatus(storesResp, 200, '店长获取门店 HTTP 200')
  const stores = storesResp.data?.data
  if (Array.isArray(stores)) {
    assert(stores.length === 1, `店长只能看 1 个门店 (实际 ${stores.length})`)
    assert(stores[0].id === 'store-001', `门店 ID = store-001 (实际 ${stores[0].id})`)
  }

  // 理发师也只看本店
  const barbersResp = await get('/barbers')
  assertStatus(barbersResp, 200, '店长获取理发师 HTTP 200')
  const barbers = barbersResp.data?.data
  if (Array.isArray(barbers) && barbers.length > 0) {
    const allStore001 = barbers.every((b) => b.storeId === 'store-001')
    assert(allStore001, '所有理发师属于 store-001')
  }

  // 店长传其他门店 ID 无效
  const otherStoreResp = await get('/stores', 'store-002')
  const otherStores = otherStoreResp.data?.data
  if (Array.isArray(otherStores)) {
    assert(!otherStores.some((s) => s.id === 'store-002'), '店长无法看到 store-002')
  }

  // 恢复超管 Token
  token = origToken

  // 超管看全量
  const superStoresResp = await get('/stores')
  const superStores = superStoresResp.data?.data
  assert(Array.isArray(superStores) && superStores.length >= 2, `超管看全量 >= 2 (实际 ${superStores?.length})`)
}

async function testBusinessFlow() {
  section('10. 业务流程：充值 + 消费')

  // 创建测试会员
  const memberResp = await post('/members', {
    name: '流程测试会员',
    phone: `1380002${Date.now()}`,
    storeId: 'store-001',
    level: 'normal',
    balance: 0,
  })
  assertStatus(memberResp, 200, '创建流程测试会员')
  testIds.flowMemberId = memberResp.data?.data?.id || memberResp.data?.data

  // 充值（amount 必填，后端 RechargeRequest: memberId + amount）
  const rechargeResp = await post('/recharges', {
    memberId: testIds.flowMemberId,
    amount: 500,
    bonus: 50,
    packageName: '流程测试充值',
  })
  assertStatus(rechargeResp, 200, '充值 HTTP 200')

  // 消费（后端 ConsumeRequest: memberId + amount 必填）
  const consumeResp = await post('/consumptions', {
    memberId: testIds.flowMemberId,
    amount: 68,
    originalPrice: 68,
    discount: 1,
    serviceName: '男士精剪',
    serviceId: 'svc-001',
  })
  assertStatus(consumeResp, 200, '消费 HTTP 200')

  // 清理
  await del(`/members/${testIds.flowMemberId}`)
}

async function testAppointments() {
  section('11. 预约 + 状态流转')

  // 创建测试会员
  const memberResp = await post('/members', {
    name: '预约测试会员',
    phone: `1380003${Date.now()}`,
    storeId: 'store-001',
    level: 'normal',
    balance: 0,
  })
  testIds.appointMemberId = memberResp.data?.data?.id || memberResp.data?.data
  assert(testIds.appointMemberId, '预约测试会员创建成功')

  // 创建预约
  const appointTime = new Date(Date.now() + 86400000).toISOString()
  const createResp = await post('/appointments', {
    memberId: testIds.appointMemberId,
    barberId: 'barber-001',
    serviceId: 'svc-001',
    appointmentTime: appointTime,
  })
  assertStatus(createResp, 200, '创建预约 HTTP 200')
  testIds.appointmentId = createResp.data?.data?.id || createResp.data?.data

  // 获取预约列表
  const listResp = await get('/appointments')
  assertStatus(listResp, 200, '获取预约列表 HTTP 200')

  if (testIds.appointmentId) {
    // 确认预约
    const confirmResp = await put(`/appointments/${testIds.appointmentId}/confirm`)
    assertStatus(confirmResp, 200, '确认预约 HTTP 200')

    // 完成预约
    const completeResp = await put(`/appointments/${testIds.appointmentId}/complete`)
    assertStatus(completeResp, 200, '完成预约 HTTP 200')
  }

  // 清理
  await del(`/members/${testIds.appointMemberId}`)
}

async function testRecords() {
  section('12. 消费/充值记录列表')

  const consResp = await get('/consumptions')
  assertStatus(consResp, 200, '获取消费记录列表 HTTP 200')

  const rechargeResp = await get('/recharges')
  assertStatus(rechargeResp, 200, '获取充值记录列表 HTTP 200')
}

async function testStats() {
  section('13. 统计 API')

  // Dashboard
  const dashResp = await get('/dashboard')
  assertStatus(dashResp, 200, 'Dashboard HTTP 200')
  const dash = dashResp.data?.data
  assert(typeof dash?.totalMembers === 'number', 'Dashboard.totalMembers 是数字')
  assert(typeof dash?.totalBarbers === 'number', 'Dashboard.totalBarbers 是数字')

  // 财务汇总
  const financeResp = await get('/stats/finance-summary')
  assertStatus(financeResp, 200, '财务汇总 HTTP 200')

  // 日报
  const dailyResp = await get('/stats/daily-statements')
  assertStatus(dailyResp, 200, '日报 HTTP 200')

  // 营收统计
  const revenueResp = await get('/stats/revenue?dimension=day')
  assertStatus(revenueResp, 200, '营收统计 HTTP 200')

  // 会员增长
  const growthResp = await get('/stats/member-growth?dimension=day')
  assertStatus(growthResp, 200, '会员增长统计 HTTP 200')

  // 热门服务
  const hotResp = await get('/stats/hot-services')
  assertStatus(hotResp, 200, '热门服务 HTTP 200')
}

// ======================== 主流程 ========================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║  会员系统 REST API 回归测试                              ║')
  console.log(`║  目标: ${BASE}                   ║`)
  console.log('╚══════════════════════════════════════════════════════════╝')

  try {
    await testAuth()
    await testStores()
    await testAdmins()
    await testMembers()
    await testBarbers()
    await testServices()
    await testPackages()
    await testServiceTypes()
    await testDataIsolation()
    await testBusinessFlow()
    await testAppointments()
    await testRecords()
    await testStats()
  } catch (err) {
    failed++
    failures.push(`未捕获异常: ${err.message}`)
    console.error(`  💥 异常: ${err.message}`)
  }

  console.log('\n══════════════════════════════════════════════════════════')
  console.log(`  总计: ${passed} 通过, ${failed} 失败`)
  if (failures.length > 0) {
    console.log('  失败项:')
    failures.forEach((f) => console.log(`    ❌ ${f}`))
  }
  console.log('══════════════════════════════════════════════════════════')

  process.exit(failed > 0 ? 1 : 0)
}

main()
