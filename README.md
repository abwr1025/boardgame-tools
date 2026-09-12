# 今晚玩什么 · 桌游推荐器

按 **人数 / 可用时长 / 玩家熟练度 / 想玩的类型** 从中文桌游库里挑出今晚合适的游戏。
纯前端，无后端，无数据库。每款游戏都有独立的静态详情页，方便被搜索引擎收录。

## 快速开始

**最简单：双击 `start-dev.bat`**，等几秒，手动打开 http://localhost:5173/

注意：**那个黑窗口不能关**。关掉它服务器就停了，浏览器会报 `ERR_CONNECTION_REFUSED`。
要停止服务器就按 `Ctrl+C`，或直接关掉窗口。

**或者用命令行：**

```bash
cd D:\CodexProjects\boardgame-tools
npm run dev      # 开发服务器 http://localhost:5173/
npm run build    # 构建 + 预渲染，产物在 dist/
npm run preview  # 预览构建产物
npm run lint
```

## 页面结构

| 路径 | 内容 |
| --- | --- |
| `/` | 推荐器 + 中文桌游库 |
| `/game/<id>` | 单款游戏详情页，共 80 个 |
| 其他 | 404 页面 |

路由是零依赖自己写的（`src/lib/router.tsx`），没用 react-router。

## 构建时预渲染（重要）

纯前端 SPA 对 SEO 几乎没用——搜索引擎打开页面时正文是空的。所以 `npm run build`
最后会跑 `scripts/prerender.mjs`，用 `react-dom/server` 把每个页面渲染成**真正的静态 HTML**：

- 81 个页面各自的 `<title>` / `<meta description>` / OG 标签 / JSON-LD 结构化数据
- 正文内容直接写进 HTML，不依赖 JS 执行
- `404.html` 兜底页（root 留空，交给客户端渲染）
- 填了域名后还会生成 `sitemap.xml` 和 `robots.txt`

构建流程：`tsc -b` → `vite build` → `node scripts/prerender.mjs`

### 客户端只在安全时才 hydrate

预渲染页面会带一个 `<meta name="prerender-path">` 标记自己是给哪个路由渲染的。
`src/main.tsx` 只在标记与当前地址一致时调用 `hydrateRoot`，否则清空重渲染。

这样即使服务器把未知路径兜底到了首页（`vite preview` 就是这么干的），也不会出现
hydration 结构不匹配的报错。

### 部署后要填域名

`site.config.json` 里的 `siteUrl` 默认是空的，此时**不生成** canonical 和 sitemap。
拿到 Vercel 域名后填进去，重新构建一次：

```json
{ "siteUrl": "https://你的域名.vercel.app" }
```

留空是故意的——填一个不存在的域名会让 canonical 指向无效地址，反而对 SEO 有害。

## 本地验证预渲染结果

`vite preview` 不做目录索引解析，直接访问 `/game/avalon`（不带斜杠）会落到 SPA 兜底。
想本地验证静态产物，用：

```bash
npm run build
npx serve dist
```

真实主机（Vercel / Netlify / nginx）都会把 `/game/avalon` 解析到 `/game/avalon/index.html`。
`vercel.json` 里还写了一条显式 rewrite 兜底。

## 项目结构

```
src/
  data/games.ts          # 桌游数据集（核心资产，目前 80 款）
  lib/types.ts           # Game / Mood / Experience 类型
  lib/recommend.ts       # 推荐评分算法
  lib/router.tsx         # 零依赖前端路由
  lib/meta.ts            # 标题/描述生成，客户端和服务端共用
  components/Picker.tsx  # 条件选择器
  components/GameCard.tsx
  components/Library.tsx # 可搜索筛选的游戏库
  pages/GameDetail.tsx   # 游戏详情页
  App.tsx                # 路由分发
scripts/
  ssr-entry.tsx          # 给预渲染用的入口
  prerender.mjs          # 预渲染 + sitemap 生成
site.config.json         # 站点域名配置
tailwind.config.js       # 主题色 ink / felt / gold
start-dev.bat            # 双击启动
```

## 推荐算法怎么工作

`recommend()` 分四步：

1. **硬过滤**：人数在 `min-max` 内、游戏最大时长不超过可用时间、类型命中选中的心情。
   类型是硬条件——选了「烧脑策略」就不会拿不相关的游戏来凑数。
2. **人数契合**：命中 `best`（最佳人数）得 8 分，否则按距离最佳人数的间隔递减。
3. **时间余量**：留出讲规则的时间，游戏控制在可用时长的 85% 以内最佳。
4. **难度匹配**：新手 / 有老手带 / 全是老玩家 各有舒适难度区间，超出会明显扣分。

想调推荐口味，只改 `src/lib/recommend.ts`。

## 加一款新桌游

在 `src/data/games.ts` 里加一条：

```ts
{
  id: "unique-id",
  zh: "中文名", en: "English Name", year: 2020,
  min: 2, max: 4, best: [3, 4],
  minTime: 45, maxTime: 60,
  weight: 2.5,                        // 1-5，越大越烧脑
  cats: ["工人放置"],                  // 自由标签
  moods: ["thinky", "family"],        // 必须是 types.ts 里定义的类型
  note: "一句话说清这游戏适合什么场合。",
},
```

重新 `npm run build` 后，推荐器、游戏库、详情页、sitemap 会全部自动带上它。

## 部署

### Vercel（推荐）

1. 推到 GitHub：

   ```bash
   git init
   git add .
   git commit -m "feat: 桌游推荐器"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/boardgame-tools.git
   git push -u origin main
   ```

2. <https://vercel.com> 用 GitHub 登录 → **Add New → Project** → 选仓库 → **Import**。
3. 框架自动识别成 Vite，不用改配置，点 **Deploy**。
4. 拿到域名后填进 `site.config.json` 的 `siteUrl`，重新 push 一次。
5. 之后每次 `git push` 自动重新部署。

Vercel 的构建机器是 Linux，**没有智能应用控制**，所以部署不受本机限制影响。

### Cloudflare Pages

构建命令 `npm run build`，输出目录 `dist`。

## 本机环境限制（重要，别乱升级）

这台电脑开启了 **Windows 智能应用控制（Smart App Control）**，它按微软云端信誉
判断能不能运行程序，会直接拦截 npm 包里较新的未签名原生二进制。

| 模块 | 状态 |
| --- | --- |
| esbuild | 放行 |
| rollup (`@rollup/rollup-win32-x64-msvc`) | 放行 |
| rolldown（Vite 8 用的） | **被拦截** |
| `@tailwindcss/oxide`（Tailwind 4 用的） | **被拦截** |
| lightningcss | **被拦截** |
| oxlint | **被拦截**（注意：它一开始是放行的，几小时后被拦，判定会变） |

所以本项目固定在下面这套组合，**都能跑**：

- Vite **7**（esbuild + rollup）+ `@vitejs/plugin-react` **5**
- Tailwind CSS **3.4**（走 PostCSS，纯 JS，没有原生模块）+ `postcss` + `autoprefixer`
- ESLint（纯 JS，无原生模块）负责 lint —— 原来模板自带的 oxlint 被拦截后换掉了

判断标准是：**这个包有没有原生二进制**。有原生模块的包随时可能被拦，
所以这台机器上的原则是优先选纯 JS 的工具链。

**不要**把 Vite 升到 8、也不要把 Tailwind 升到 4，否则会报
`An Application Control policy has blocked this file`，服务器直接起不来。

想用最新版工具只有两条路：关掉智能应用控制（设置 → 隐私和安全性 → Windows 安全中心
→ 应用和浏览器控制 → 智能应用控制 → 关闭，**关闭后要重装 Windows 才能再打开**），
或者继续用当前这套。

## 关于数据

`games.ts` 里的人数、时长、复杂度是按玩家习惯整理的近似值：

- 人数与时长以出版方说明书为准，扩展和不同版本会有差异；
- 复杂度参考 BGG 的 weight，是玩家投票的平均数；
- `best`（最佳人数）是玩家共识，不是官方数值。

**这份数据的准确性就是这个站的价值所在。** 建议每款都点开 BGG 核对一次，
优先核对中文圈常玩的那些（阿瓦隆、璀璨宝石、卡坦岛、七大奇迹）。

## 下一步可以加的东西

- 计分器（针对热门游戏单独做，吃回访流量）
- 随机分身份 / 抽队伍（阿瓦隆、狼人杀场景）
- 按人数、时长细化详情页的筛选入口
