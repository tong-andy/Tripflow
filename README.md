# TripFlow

TripFlow 是一个个人旅行规划与旅行管理 Web App。本仓库当前完成 Phase 02B-2：使用 Supabase Auth 和受 RLS 保护的 PostgreSQL 保存核心旅行数据。

## 技术栈

- React 19
- TypeScript（严格模式）
- Vite
- Tailwind CSS
- React Router
- Supabase JavaScript Client + PostgreSQL RLS
- Vitest + React Testing Library
- Playwright

## 本地开发

要求 Node.js 22.13 或更高版本。

```bash
npm install
cp .env.example .env.local
npm run dev
```

在 `.env.local` 中配置 Supabase 项目的浏览器端变量：

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

这里只能使用 publishable key。不要在 Vite 环境变量或浏览器代码中使用 secret key、service role key 或数据库密码。

## 质量检查

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

端到端测试默认复用本机安装的 Google Chrome：

```bash
npm run test:e2e
```

## 页面路由

| 页面 | 路由 |
| --- | --- |
| 我的旅行 | `/trips` |
| 旅行总览 | `/overview` |
| 准备 | `/preparation` |
| 行程 | `/itinerary` |
| 归档 | `/archive` |
| 登录 | `/login` |
| 邮件登录回调 | `/auth/callback` |

## 目录结构

```text
src/
├── app/             # 路由与应用级配置
├── components/      # 导航与通用 UI 组件
├── data/            # 初始示例数据
├── domain/          # 日期生成、统计与排序等纯业务逻辑
├── layouts/         # 应用整体布局
├── lib/             # 格式化工具
├── pages/           # 路由页面
├── services/        # Supabase repository、Auth 与 legacy 本地适配层
├── state/           # React 业务状态
├── styles/          # 全局样式与 Tailwind 主题
├── test/            # 测试环境配置
├── types/           # 核心 TypeScript 数据模型
└── main.tsx         # 应用入口
```

## 当前功能

- 新建和选择旅行
- 根据日期自动生成旅行日
- 动态旅行总览
- 准备事项的新增、分类、完成、编辑和确认删除
- 每日行程切换、添加、时间排序和状态更新
- 使用版本化 `localStorage` 保存设备本地数据
- 邮箱密码注册、登录与退出登录（当前主要开发登录方式）
- 保留 Magic Link / OTP 作为次要登录方式
- 身份状态恢复和旅行页面路由保护
- `trips`、`trip_days`、`preparation_items`、`itinerary_items` 数据库 migration
- 每张业务表的用户 ownership、RLS 和仅限本人 CRUD 策略
- Supabase repository 统一负责旅行、旅行日、准备事项和每日行程 CRUD
- 创建旅行和旅行日通过 PostgreSQL RPC 在一个事务内完成
- 云端 loading、error、empty state 与重复提交保护

默认数据源现在是 Supabase。Phase 02A 的版本化 `localStorage` 代码仍保留，并通过 legacy repository 作为显式兼容适配器；应用不会自动混合或迁移两套数据，也不包含复杂离线同步。

数据库 migration 位于 `supabase/migrations/`。Phase 02B-2 新增 `create_trip_with_days` 原子 RPC，进入真实云端创建流程前必须通过 Supabase CLI 或项目的标准数据库部署流程应用到目标项目。
