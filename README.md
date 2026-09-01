# TripFlow

TripFlow 是一个覆盖旅行前准备、旅行中执行和旅行后整理的个人旅行规划与管理 Web App。当前仓库处于 **Phase 03B.5.2**。

桌面端主要用于规划旅行，移动端主要用于旅途中快速查看和记录；PWA 提供可安装体验和离线 app shell。当前业务数据由 Supabase 提供，需要联网读取和写入。

## 核心功能

- **Authentication:** Supabase 邮箱密码注册、登录、退出，以及次要的 Magic Link / 邮箱 OTP 登录。
- **Trips:** 创建、选择、编辑和删除旅行，自动生成旅行日，并从本地城市库管理一个或多个结构化目的地。
- **My Trips:** 用户级首页包含可切换全球/聚焦视图的轻量 SVG 旅行足迹、移动端城市聚合、动态年份/全部筛选、旅行统计、分币种消费和时间轴。
- **Preparation:** 按通行、住宿、证件、预订与活动、网络与设备、生活用品六个折叠分组管理准备清单。
- **Itinerary:** 按天管理定时或灵活时间的行程，支持地点、地址、停留时长、备注和状态。
- **Today:** 为当前进行中的旅行提供当天行程、当前/下一站、快速加行程和快速记花费。
- **Records:** 按当前旅行管理花费、购物、回忆和可选的素材备注模块。
- **Expenses / Purchases:** 预算、分类统计、按币种独立汇总，以及统一的购物计入支出规则。
- **Memories / Media Notes:** 每日回忆与评分，以及可关联旅行日或行程的素材元数据备注。
- **Profile / Preferences:** 从“我的旅行”右上角的响应式设置抽屉管理个人资料、默认货币/时区/地图和记录偏好。
- **Map Navigation:** 支持系统默认、Apple Maps、高德、百度和 Google Maps 外部导航。
- **Travel Notes:** 每段旅行可维护独立的旅行级备注。
- **Timezone Selection:** 新旅行使用用户默认时区，已有旅行保持独立时区。
- **PWA:** 可安装、自动更新的 service worker 和离线 app shell；尚无业务数据离线缓存或离线写入同步。

## 技术栈

- React 19
- TypeScript（严格模式）
- Vite
- Tailwind CSS
- React Router
- Supabase JavaScript Client + PostgreSQL RLS
- Vitest
- React Testing Library
- Playwright
- Netlify

## 本地开发

要求 Node.js 22.13 或更高版本。

```bash
npm install
cp .env.example .env.local
npm run dev
```

生产构建：

```bash
npm run build
```

质量检查：

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

`npm run test:e2e` 使用 Playwright，并默认复用本机安装的 Google Chrome。

## 环境变量

从 `.env.example` 创建本地环境文件：

```bash
cp .env.example .env.local
```

需要配置以下浏览器端变量：

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

浏览器端只能使用 publishable key。不要在 Vite 环境变量、浏览器代码或仓库文档中放置 secret key、service role key、数据库密码或部署 token。

## 页面路由

| 页面 | 路由 |
| --- | --- |
| 我的旅行 | `/trips` |
| 旅行总览 | `/overview` |
| 今天 | `/today` |
| 准备 | `/preparation` |
| 行程 | `/itinerary` |
| 记录 | `/archive` |
| 登录 | `/login` |
| 邮件登录回调 | `/auth/callback` |

桌面端和移动端统一为：我的旅行、旅行总览、准备、行程、记录。Today 是进行中旅行的上下文入口，不占底部导航。历史 `/profile` 路由仅作兼容跳转，不再是一级导航。

## 架构

主要业务数据流：

`Page / Component → Provider → Repository / Service → Supabase`

页面不直接访问 Supabase。Trip-level 数据包括结构化目的地、旅行日、准备、行程、记录、预算、旅行时区和旅行备注，并按 `tripId` 隔离；user-level 数据包括个人资料、默认偏好、记录模块偏好和跨旅行统计，并按 `userId` 隔离。

生产环境默认使用 Supabase repository。Phase 02A 的版本化 `localStorage` 代码仅作为显式 legacy/test adapter 保留，不会与云端数据自动混合，也不是当前业务数据离线缓存。

## 部署

- GitHub 用于源码版本管理，`main` 为部署分支。
- Netlify 从 `main` 自动部署应用。
- Supabase 提供 Auth 和 PostgreSQL Database。

## 项目状态

For current phase, migrations, known issues and implementation status, see [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).
