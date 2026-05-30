# 理发店会员管理系统 - 前端

基于 React + TypeScript + Vite 构建的现代化会员管理系统前端，采用纯 RPC 架构与 Supabase 后端通信。

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
| **Supabase JS SDK** | RPC 函数调用、实时订阅 |
| **原生 fetch** | 备用方案 |

## 项目结构

```
MmbershipWeb/
├── src/
│   ├── components/         # 通用组件
│   │   └── PrivateRoute.tsx    # 路由守卫
│   ├── pages/              # 页面组件
│   │   ├── admin/              # 管理员端
│   │   │   ├── Login/          # 登录页
│   │   │   ├── Dashboard/      # 仪表盘
│   │   │   ├── MemberList/     # 会员管理
│   │   │   ├── Recharge/       # 充值管理
│   │   │   ├── Consume/        # 消费管理
│   │   │   ├── FinanceReport/  # 财务报表
│   │   │   ├── StoreManage/    # 门店管理
│   │   │   └── Settings/       # 系统设置
│   │   └── user/               # 会员端（待开发）
│   ├── services/           # API 层
│   │   └── api.ts              # Supabase RPC 封装
│   ├── stores/             # 状态管理
│   │   ├── auth.ts             # 认证状态
│   │   └── index.ts            # Store 导出
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts            # 全局类型
│   ├── App.tsx             # 根组件（路由配置）
│   ├── main.tsx            # 入口文件
│   └── index.css           # 全局样式
├── public/                 # 静态资源
├── .env                    # 环境变量
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
└── package.json            # 依赖配置
```

## 核心架构

### 认证流程

```
用户输入账号密码
    ↓
rpc_admin_login(username, password)
    ↓
后端验证 bcrypt 哈希
    ↓
返回 JWT Token + 用户信息
    ↓
前端存储到 Zustand + localStorage
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

### 路由配置

| 路由 | 组件 | 权限 | 说明 |
|------|------|------|------|
| `/admin/login` | Login | 公开 | 管理员登录 |
| `/admin/dashboard` | Dashboard | 需登录 | 数据概览 |
| `/admin/members` | MemberList | 需登录 | 会员管理 |
| `/admin/recharge` | Recharge | 需登录 | 充值管理 |
| `/admin/consume` | Consume | 需登录 | 消费管理 |
| `/admin/finance` | FinanceReport | 需登录 | 财务报表 |
| `/admin/stores` | StoreManage | 需登录 | 门店管理 |
| `/admin/settings` | Settings | 需登录 | 系统设置 |
| `/user/*` | - | 待开发 | 会员端 |

## 功能模块

### 仪表盘

- 今日/本月充值金额
- 今日/本月消费金额
- 会员数统计
- 趋势图表（Recharts）

### 会员管理

- 会员列表（分页、搜索）
- 新增/编辑/删除会员
- 会员详情（充值/消费记录）
- 余额查询

### 充值管理

- 会员充值
- 充值套餐选择
- 赠送金额计算
- 充值记录查询

### 消费管理

- 会员消费
- 服务项目选择
- 理发师选择
- 消费记录查询

### 财务报表

- 按时间段统计
- 充值/消费对比
- 门店对比（super_admin）
- 导出功能

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
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const MemberList = React.lazy(() => import('./pages/admin/MemberList'));
// ... 其他页面
```

**优化效果**：
- 首屏加载：1.88MB → **2.6KB**
- 各页面独立 chunk，按需加载

### 并行数据加载

```typescript
// MemberList/index.tsx
const [membersData, storesData] = await Promise.all([
  api.getMembers(admin, storeId),
  api.getStores(admin),
]);
```

## 开发指南

### 环境要求

- Node.js 18+
- npm 9+

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件：

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5174

### 构建生产版本

```bash
npm run build
```

输出目录：`dist/`

### 类型检查

```bash
npm run type-check
```

## 部署

### GitHub Pages

```bash
npm run build
# 将 dist/ 目录部署到 GitHub Pages
```

### Cloudflare Pages

1. 连接 GitHub 仓库
2. 构建命令：`npm run build`
3. 输出目录：`dist`

### Netlify

1. 连接 GitHub 仓库
2. 构建命令：`npm run build`
3. 输出目录：`dist`

## 测试账号

| 用户名 | 密码 | 角色 | 门店 |
|--------|------|------|------|
| admin | admin123 | super_admin | 全部 |
| admin1 | admin123 | store_admin | 国贸分店 |
| admin3 | admin123 | store_admin | 天河分店 |

## 主题定制

```typescript
// App.tsx
const THEME_COLOR = '#1677ff'; // 主色调

<ConfigProvider
  theme={{
    token: {
      colorPrimary: THEME_COLOR,
    },
  }}
>
```

## 已知问题

1. 国内访问 `vercel.app`、`pages.dev` 域名被墙，需绑定自定义域名
2. 部分页面缺少加载状态骨架屏
3. 会员端功能待开发

## 后端仓库

- GitHub: https://github.com/hzp-ui/membership-systems
- 技术栈: Supabase PostgreSQL + RPC Functions

## 许可证

MIT
