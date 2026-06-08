# 理发店会员管理系统 - 前端

基于 React + TypeScript + Vite 构建的现代化会员管理系统前端，采用 **axios + REST API** 架构与 **Spring Boot 后端**通信。

---

## 技术栈

### 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| **React** | 18.3 | UI 框架 |
| **TypeScript** | 5.6 | 类型安全 |
| **Vite** | 6.0 | 构建工具 |
| **Ant Design** | 5.22 | UI 组件库 |

### 状态管理 & 路由

| 技术 | 用途 |
|------|------|
| **Zustand** | 轻量级状态管理（auth store） |
| **React Router** | 客户端路由（懒加载） |

### 数据可视化

| 技术 | 用途 |
|------|------|
| **Recharts** | 图表库（Dashboard、财务报表） |
| **Day.js** | 日期处理 |

### 网络请求

| 技术 | 用途 |
|------|------|
| **axios** | REST API 调用、JWT 拦截器 |
| **localStorage** | Token 持久化 |

---

## 项目结构

```
MmbershipJavaWeb/
├── src/
│   ├── components/         # 通用组件
│   │   ├── PrivateRoute.tsx    # 路由守卫
│   │   └── Skeletons.tsx       # 骨架屏组件库
│   ├── pages/              # 页面组件
│   │   ├── admin/              # 管理员端
│   │   │   ├── Login/          # 登录页
│   │   │   ├── Dashboard/      # 仪表盘
│   │   │   ├── MemberList/     # 会员管理
│   │   │   ├── RechargeList/   # 充值记录
│   │   │   ├── ConsumptionList/ # 消费记录
│   │   │   ├── AppointmentList/ # 预约管理
│   │   │   ├── BarberList/      # 理发师管理
│   │   │   ├── ServiceList/    # 服务管理
│   │   │   ├── PackageList/    # 套餐管理
│   │   │   ├── StoreList/      # 门店管理
│   │   │   ├── AdminList/      # 管理员管理
│   │   │   └── FinanceReport/  # 财务报表
│   │   └── user/               # 会员端（待开发）
│   ├── services/           # API 层
│   │   ├── api.ts              # axios REST API 封装
│   │   └── types/              # API 类型定义
│   ├── lib/                # 工具库
│   │   └── axios.ts           # axios 配置 + JWT 拦截器
│   ├── stores/             # 状态管理
│   │   ├── auth.ts             # 认证状态（Zustand）
│   │   └── index.ts            # Store 导出
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts            # 全局类型
│   ├── layouts/            # 布局组件
│   │   └── AdminLayout.tsx    # 管理后台布局
│   ├── App.tsx             # 根组件（路由配置）
│   ├── main.tsx            # 入口文件
│   └── index.css           # 全局样式
├── public/                 # 静态资源
├── .env                    # 环境变量
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
└── package.json            # 依赖配置
```

---

## 核心架构

### 认证流程

```
用户输入账号密码
    ↓
POST /api/v1/auth/admin/login
    ↓
后端验证 bcrypt 哈希
    ↓
返回 JWT Token + 用户信息
    ↓
前端存储到 Zustand + localStorage
    ↓
axios 拦截器自动注入 Token
    ↓
PrivateRoute 守卫检查 token
    ↓
允许访问受保护路由
```

### 数据隔离方案

```typescript
// api.ts - resolveStoreId()
function resolveStoreId(admin: Admin, storeId?: string): string | undefined {
  // super_admin: 可选传 storeId，不传则查全部
  // store_admin: 强制使用 admin.store_id，忽略传入参数
  if (admin.role === 'store_admin') {
    return admin.store_id;
  }
  return storeId; // super_admin 可传可不传
}
```

### API 层设计

```typescript
// lib/axios.ts
const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

// JWT 拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 统一响应处理
export const unwrapData = <T>(res: any): T => {
  if (res.data?.records) {
    return res.data.records as T  // MyBatis-Plus 分页格式
  }
  return res.data as T
}
```

---

## 功能模块

### 仪表盘 (Dashboard)

- 今日/本月充值金额
- 今日/本月消费金额
- 会员数统计
- 趋势图表（Recharts）

### 会员管理 (MemberList)

- 会员列表（分页、搜索、门店过滤）
- 新增/编辑/删除会员
- 会员详情（充值/消费记录）
- 余额查询

### 充值管理 (RechargeList)

- 会员充值（套餐/自定义金额）
- 充值记录查询
- 门店过滤（store_admin 只能看本门店）

### 消费管理 (ConsumptionList)

- 会员消费（选择服务、理发师）
- 消费记录查询
- 积分累计

### 预约管理 (AppointmentList)

- 预约创建、确认、完成、取消
- 预约记录查询
- 显示会员姓名、理发师名称、服务名称

### 理发师管理 (BarberList)

- 理发师列表
- 新增/编辑/删除理发师
- 擅长项目设置（多选）

### 服务管理 (ServiceList)

- 服务列表
- 新增/编辑/删除服务
- 服务类型管理

### 套餐管理 (PackageList)

- 充值套餐列表
- 新增/编辑/删除套餐

### 门店管理 (StoreList)

- 门店列表（仅 super_admin）
- 新增/编辑门店

### 管理员管理 (AdminList)

- 管理员列表（按门店过滤）
- 创建/编辑/删除管理员
- 分配门店权限

### 财务报表 (FinanceReport)

- 按时间段统计
- 充值/消费对比
- 门店对比（super_admin）
- 每日对账表格

---

## 性能优化

### 构建优化

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        antd: ['antd', '@ant-design/icons'],
        charts: ['recharts'],
      },
    },
  },
}
```

### 路由懒加载

```typescript
// App.tsx
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'))
const MemberList = React.lazy(() => import('./pages/admin/MemberList'))
// ... 其他页面
```

**优化效果**：
- 首屏加载：~2.6KB（chunk 按需加载）
- 各页面独立 chunk，按需加载

### 并行数据加载

```typescript
// MemberList/index.tsx
const [membersData, storesData] = await Promise.all([
  getMembers(storeId),
  getStores()
]);
```

---

## 开发指南

### 环境要求

- Node.js 18+
- npm 9+
- 后端运行在 `http://localhost:8080`

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

输出目录：`dist/`

### 类型检查

```bash
npm run type-check
```

---

## 后端 API 文档

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/admin/login` | 管理员登录 |
| POST | `/api/v1/auth/member/login` | 会员登录 |
| POST | `/api/v1/auth/member/register` | 会员注册 |

### 会员接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/members` | 会员列表 |
| POST | `/api/v1/members` | 创建会员 |
| PUT | `/api/v1/members/{id}` | 更新会员 |
| DELETE | `/api/v1/members/{id}` | 删除会员 |

### 充值接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/recharges` | 充值记录 |
| POST | `/api/v1/recharges` | 会员充值 |

### 消费接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/consumptions` | 消费记录 |
| POST | `/api/v1/consumptions` | 创建消费 |

### 预约接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/appointments` | 预约列表 |
| POST | `/api/v1/appointments` | 创建预约 |
| PUT | `/api/v1/appointments/{id}/confirm` | 确认预约 |
| PUT | `/api/v1/appointments/{id}/complete` | 完成预约 |
| PUT | `/api/v1/appointments/{id}/cancel` | 取消预约 |

### 其他接口

| 模块 | 路径前缀 | 说明 |
|------|----------|------|
| 理发师 | `/api/v1/barbers` | 理发师管理 |
| 服务 | `/api/v1/services` | 服务管理 |
| 套餐 | `/api/v1/packages` | 套餐管理 |
| 门店 | `/api/v1/stores` | 门店管理 |
| 管理员 | `/api/v1/admins` | 管理员管理 |
| 统计 | `/api/v1/stats` | 统计报表 |

---

## 部署

### 前端部署（Vercel）

1. 连接 GitHub 仓库
2. 构建命令：`npm run build`
3. 输出目录：`dist`
4. 环境变量：`VITE_API_BASE_URL` 设置为后端 production URL

### 前端部署（Nginx）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 反向代理后端 API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 测试账号

| 用户名 | 密码 | 角色 | 门店 |
|--------|------|------|------|
| admin | admin123 | SUPER_ADMIN | 全部 |
| admin1 | admin123 | STORE_ADMIN | store-001 |

---

## 技术决策

### 为什么从 Supabase 迁移到 Spring Boot？

1. **性能**：Spring Boot + MyBatis-Plus 查询性能优于 Supabase RPC
2. **灵活性**：自定义 SQL 更灵活，便于复杂查询优化
3. **部署**：自建后端可以部署在国内服务器，避免 Supabase 国外服务器延迟
4. **权限控制**：Spring Security 提供更细粒度的权限控制
5. **类型安全**：MyBatis-Plus 提供类型安全的 CRUD 操作

### 为什么使用 axios 而不是 fetch？

1. **拦截器**：axios 拦截器简化 JWT Token 注入
2. **错误处理**：统一的错误处理和超时配置
3. **兼容性**：更好的浏览器兼容性
4. **生态**：丰富的插件和扩展

---

## 已知问题

1. **Chunk 大小警告**：部分 chunk 超过 500KB，已配置 manualChunks 优化
2. **会员端功能待开发**
3. **国内访问 Vercel 可能被墙**，建议部署到国内服务器或使用 CDN

---

## 最近更新

### 2026-06-08
- ✅ **完全移除 Supabase 依赖**，改用 Spring Boot 后端 + axios REST API
- ✅ 新增 `axios.ts` 配置 JWT 拦截器
- ✅ 修复数据流问题（双重解包 `res.data`）
- ✅ 添加多门店数据隔离（`StoreAccessUtil`）
- ✅ 修复中文编码问题（UTF-8）
- ✅ 更新所有页面使用新 API 层
- ✅ TypeScript 编译零错误

### 2026-05-30
- ✅ 添加骨架屏加载状态：Dashboard、MemberList、FinanceReport 等
- ✅ 新增 `Skeletons.tsx` 组件库
- ✅ 改善数据加载时的用户体验

---

## 后端仓库

- **GitHub**: https://github.com/hzp-ui/membership-systems
- **技术栈**: Spring Boot 3.2.5 + MyBatis-Plus 3.5.7 + MySQL 8.0 + JWT
- **分支**: `refactor/springboot-backend`

---

## 项目文档

- **改造问题与解决方案**: `../改造问题与解决方案.md`
- **项目整体介绍**: `../项目整体介绍.md`
- **PRD**: `../MembershioSystemJava/PRD.md`

---

## 许可证

MIT

---

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 联系方式

如有问题或建议，请提交 Issue 或联系项目维护者。
