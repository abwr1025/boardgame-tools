# 今晚玩什么 · 桌游推荐器

线上地址：<https://boardgame-tools.1600727279.workers.dev>

按 **人数 / 可用时长 / 玩家熟练度 / 想玩的类型**，从中文桌游库里挑出今晚合适的游戏。

纯前端静态站，无后端、无数据库。全部 81 个页面（1 个首页 + 80 个游戏详情页）在构建时预渲染为静态 HTML，不依赖客户端 JS 执行，便于搜索引擎收录。

## 快速开始

需要 Node.js 20.19 或更高版本。

```bash
npm install      # 首次
npm run dev      # 开发服务器 http://localhost:5173/
npm run build    # 构建 + 预渲染，产物在 dist/
npm run preview  # 预览构建产物
npm run lint     # ESLint
```

Windows 下可直接双击 `start-dev.bat` 启动开发服务器。**启动后不要关闭那个命令行窗口**，关闭即停止服务，浏览器会报 `ERR_CONNECTION_REFUSED`。

> 若开发机启用了 Windows 智能应用控制，请不要执行 `npm install`，详见文末「开发环境约束」。

## 页面结构

| 路径 | 内容 |
| --- | --- |
| `/` | 推荐器 + 可搜索的中文桌游库 |
| `/game/<id>` | 单款游戏详情页，共 80 个 |
| 其他 | 404 页面 |

路由是约 60 行的零依赖实现（`src/lib/router.tsx`），没有引入 react-router。

## 构建与预渲染

### 为什么需要预渲染

纯前端 SPA 对 SEO 几乎没有价值——搜索引擎抓取时正文由 JS 渲染，索引不到实际内容。因此 `npm run build` 的最后一步会执行 `scripts/prerender.mjs`，用 `react-dom/server` 把每个路由渲染成静态 HTML：

- 81 个页面各自输出 `<title>`、`<meta description>`、Open Graph 标签与 JSON-LD 结构化数据
- 正文内容直接写入 HTML，不依赖客户端 JS
- 生成 `404.html` 兜底页
- 配置了站点域名时，额外生成 `sitemap.xml` 与 `robots.txt`

构建链路：

```
tsc -b  →  vite build  →  node scripts/prerender.mjs
```

### 客户端只在安全的前提下 hydrate

预渲染页面带有 `<meta name="prerender-path">`，标记该 HTML 是为哪个路由生成的。`src/main.tsx` 仅在该标记与当前地址一致时才调用 `hydrateRoot`；不一致时清空容器后重新渲染。

这样即使服务器把未知路径兜底到首页，也不会出现 hydration 结构不匹配的报错。

### 站点域名：site.config.json

```json
{
  "siteUrl": "https://boardgame-tools.1600727279.workers.dev",
  "repoUrl": "https://github.com/abwr1025/boardgame-tools",
  "feedbackUrl": "https://github.com/abwr1025/boardgame-tools/issues/new"
}
```

| 字段 | 用途 |
| --- | --- |
| `siteUrl` | 生成 canonical 与 sitemap，留空则跳过 |
| `repoUrl` | 页脚的源码仓库链接 |
| `feedbackUrl` | 数据纠错入口 |

`siteUrl` 为空时**不生成** canonical 与 sitemap。这是刻意设计——canonical 指向一个不存在的域名会被搜索引擎判定为无效信号，反而比不写更糟。更换域名后修改此文件并重新构建即可。

## 项目结构

```
src/
  data/games.ts          # 桌游数据集（核心资产，80 款）
  lib/types.ts           # Game / Mood / Experience 类型定义
  lib/recommend.ts       # 推荐评分算法
  lib/router.tsx         # 零依赖前端路由
  lib/meta.ts            # 标题/描述生成，客户端与服务端共用
  components/Picker.tsx  # 条件选择器
  components/GameCard.tsx
  components/Library.tsx # 可搜索筛选的游戏库
  pages/GameDetail.tsx   # 游戏详情页
  App.tsx                # 路由分发
scripts/
  ssr-entry.tsx          # 预渲染入口
  prerender.mjs          # 预渲染 + sitemap 生成
site.config.json         # 站点域名配置
wrangler.jsonc           # Cloudflare Workers 部署配置（生产环境使用）
vercel.json              # Vercel 备用配置（当前未使用）
tailwind.config.js       # 主题色 ink / felt / gold
start-dev.bat            # Windows 双击启动
```

## 推荐算法

`recommend()` 位于 `src/lib/recommend.ts`，分四步：

1. **硬过滤**：人数落在 `min-max` 区间内、游戏最大时长不超过可用时间、类型命中所选心情。类型是硬条件——选了「烧脑策略」不会用不相关的游戏凑数。
2. **人数契合**：命中 `best`（最佳人数）得 8 分，否则按与最佳人数的距离递减。
3. **时间余量**：留出讲规则的时间，游戏时长控制在可用时长的 85% 以内为最佳。
4. **难度匹配**：新手 / 有老手带 / 全是老玩家，各有对应的舒适难度区间，超出会明显扣分。

调整推荐口味只需修改这一个文件。

## 数据

`src/data/games.ts` 收录 80 款中文圈常见桌游。每条记录的字段：

```ts
{
  id: "unique-id",              // URL 片段，对应 /game/<id>
  zh: "中文名",
  en: "English Name",
  year: 2020,
  min: 2, max: 4,               // 支持人数
  best: [3, 4],                 // 最佳人数（玩家共识，非官方数值）
  minTime: 45, maxTime: 60,     // 时长区间（分钟）
  weight: 2.5,                  // 复杂度 1-5，参考 BGG weight
  cats: ["工人放置"],            // 自由标签
  moods: ["thinky", "family"],  // 必须取自 types.ts 中定义的类型
  note: "一句话说明适合什么场合。",
  bga: "azul",                  // 可选：Board Game Arena 的 slug
}
```

数据的取值口径：

- 人数与时长以出版方说明书为准，扩展与不同版本会有差异
- 复杂度参考 BGG 的 weight，是玩家投票的平均值
- `best` 是最佳人数，来自玩家共识而非官方数值

**这份数据的准确性就是这个项目的价值所在。** 建议每款都对照 BGG 与中文版说明书核对一次，优先核对中文圈高频游玩的那些（阿瓦隆、璀璨宝石、卡坦岛、七大奇迹）。

新增游戏只需在 `games.ts` 中追加一条记录，重新构建后推荐器、游戏库、详情页与 sitemap 会全部自动包含它。

### 在线游玩入口

`Game.bga` 是 **Board Game Arena** 的游戏 slug，填写后详情页会出现「在线玩」按钮，链接为
`https://boardgamearena.com/gamepanel?game=<slug>`。

**填写前必须确认该游戏确实存在于 BGA**，否则 slug 会指向另一款游戏。核对方式：
打开 <https://boardgamearena.com/gamelist> 搜索游戏英文名，从页面数据中取得其 slug。

当前 80 款中有 43 款已收录 BGA 入口。其余游戏没有填写，多为出版方授权限制（阿瓦隆、行动代号、
三国杀、幽港迷城等均未上 BGA）。这些游戏的详情页会给出去 Tabletopia 与 Steam 搜索的入口作为兜底。

### 数据纠错

站内所有介绍与数值都来自玩家整理。首页页脚与每款游戏的详情页都提供了纠错入口，
指向 `site.config.json` 的 `feedbackUrl`（当前是 GitHub Issues）。修改该配置即可更换反馈渠道。

## 开发环境约束（Windows 智能应用控制）

本项目初版的工具链版本受开发机环境限制，此处记录原因，避免后来者误升级导致构建失败。

Windows 11 的**智能应用控制（Smart App Control）**按微软云端信誉判断程序能否运行，会拦截 npm 包中较新的、未签名的原生二进制，报错为 `An Application Control policy has blocked this file`。

**该判定是动态的**：`oxlint` 的原生绑定曾先被放行、数小时后被拦截；`esbuild` 也出现过同一二进制在不同路径下结果不同的情况。因此「现在能跑」不代表以后能跑。

本项目因此固定使用**不含原生二进制**的纯 JS 工具链：

| 依赖 | 版本 | 说明 |
| --- | --- | --- |
| Vite | 7 | 使用 esbuild + rollup |
| @vitejs/plugin-react | 5 | |
| Tailwind CSS | 3.4 | 走 PostCSS，无原生模块 |
| ESLint | 10 | 纯 JS |

以下依赖**不可引入**，其原生二进制会被拦截：

- `rolldown`（Vite 8 默认打包器）
- `@tailwindcss/oxide`（Tailwind 4 原生引擎）
- `lightningcss`
- `oxlint` / `biome`（带原生绑定）

在未启用智能应用控制的机器上开发时，可以自由升级依赖；升级后需同步更新本节内容。

## 部署

生产环境部署在 **Cloudflare Workers**，推送到 `main` 分支后自动构建并发布。

- 平台配置与排障：[DEPLOY.md](DEPLOY.md)
- 日常改动的标准流程：[WORKFLOW.md](WORKFLOW.md)

## 路线图

- 计分器（针对热门游戏单独实现，可带来回访流量）
- 随机分身份 / 抽队伍（阿瓦隆、狼人杀场景）
- 按人数、时长细化详情页的筛选入口
- 更细的长尾 SEO 页面
