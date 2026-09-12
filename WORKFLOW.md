# 开发与发布流程

本文档规定本项目的标准工作流程。任何改动——改一行文案、加一款游戏、调整推荐算法——都走同一个闭环：

```
改动 → 本地验证 → 提交 → 推送 → 自动部署 → 线上验证
```

每一步都有明确的验收标准。**其中第 2 步（本地验证）和第 5 步（线上验证）不可跳过**——部署是自动的，自动不代表成功。

相关文档：[README.md](README.md)（项目说明）、[DEPLOY.md](DEPLOY.md)（平台配置与排障）。

---

## 起点：环境检查

```bash
cd D:\CodexProjects\boardgame-tools
node -v          # 需要 >= 20.19
git status -sb   # 确认工作区干净，且与 origin/main 同步
```

`git status` 若显示未提交的改动，先确认这些改动是否需要保留，再决定继续。

---

## 第 1 步：改动

常见改动对应的文件：

| 目标 | 修改位置 |
| --- | --- |
| 新增 / 修正桌游数据 | `src/data/games.ts` |
| 调整推荐口味 | `src/lib/recommend.ts` |
| 页面文案与布局 | `src/components/`、`src/pages/` |
| 标题、描述、结构化数据 | `src/lib/meta.ts` |
| 配色 | `tailwind.config.js` |
| 新增路由 | `src/App.tsx`、`src/lib/router.tsx` |
| 部署配置 | `wrangler.jsonc`、`site.config.json` |

---

## 第 2 步：本地验证（不可跳过）

```bash
npm run build
npm run lint
```

验收标准：

| 命令 | 期望结果 |
| --- | --- |
| `npm run build` | 输出「预渲染完成：81 个页面」（新增游戏后数量相应增加），无 TypeScript 报错 |
| `npm run lint` | 退出码 0，无输出 |

`npm run build` 内置 `tsc -b` 全量类型检查，类型错误会直接导致构建失败。

改动涉及交互或页面渲染时，另起开发服务器确认：

```bash
npm run dev      # http://localhost:5173/
```

改动涉及预渲染产物（详情页、sitemap、canonical）时，必须用静态文件服务器验证，因为 `vite preview` 不解析目录索引：

```bash
npm run build
npx serve dist
```

---

## 第 3 步：提交

```bash
git add -A
git commit -m "<类型>: <改了什么>"
```

提交信息采用 Conventional Commits 风格：

| 类型 | 用于 |
| --- | --- |
| `feat` | 新功能、新增游戏数据 |
| `fix` | 修复缺陷 |
| `docs` | 仅修改文档 |
| `chore` | 配置、依赖、构建相关 |
| `refactor` | 重构，不改变外部行为 |

示例：

```
feat: 新增 12 款双人桌游
fix: 修正心情筛选未命中时用不相关游戏填充结果的问题
docs: 补充部署排障表
```

**一次提交只做一件事。** 不要把「加游戏」和「改样式」混在同一个提交里，否则回滚时无法拆分。

---

## 第 4 步：推送

```bash
git push
```

推送成功后 Cloudflare 会自动构建，约 45 秒完成，无需在控制台做任何操作。

**推送失败时**：中国大陆网络直连 github.com 不稳定，表现为 `Failed to connect to github.com port 443` 或 `Recv failure: Connection was reset`。若本机已运行代理，按 [DEPLOY.md](DEPLOY.md) 的「Git 代理」一节配置后重试。

---

## 第 5 步：线上验证（不可跳过）

线上地址：<https://boardgame-tools.1600727279.workers.dev>

浏览器逐项确认，或用 `curl` 检查状态码：

| 检查项 | 期望结果 |
| --- | --- |
| `/` | 200，标题「今晚玩什么 - 桌游推荐器」 |
| `/game/avalon` | 200，标题含游戏名，**按 F5 刷新不 404** |
| `/sitemap.xml` | 200，URL 条数等于页面总数 |
| `/robots.txt` | 200，Sitemap 指向当前域名 |
| 任意不存在的路径 | 404，显示「页面不存在」 |

命令行批量检查：

```bash
for p in / /game/avalon /sitemap.xml /robots.txt /nope; do
  printf "%s  " "$(curl -s -o /dev/null -w '%{http_code}' https://boardgame-tools.1600727279.workers.dev${p})"
  echo "$p"
done
```

构建日志可在 Cloudflare 控制台查看：**Workers & Pages → 目标项目 → Deployments → 最近一次构建**。

---

## 完整示例：新增一款桌游

以新增「花砖物语：夏日行宫」为例走一遍全流程。

**1. 修改 `src/data/games.ts`**，在 `GAMES` 数组中追加：

```ts
{
  id: "azul-summer-pavilion",
  zh: "花砖物语：夏日行宫",
  en: "Azul: Summer Pavilion",
  year: 2019,
  min: 2, max: 4, best: [3],
  minTime: 30, maxTime: 45,
  weight: 2.0,
  cats: ["板块放置"],
  moods: ["family", "thinky"],
  note: "比初代更宽松，适合家庭局。",
},
```

**2. 本地验证**

```bash
npm run build      # 应输出「预渲染完成：82 个页面」
npm run lint
npm run dev        # 打开 http://localhost:5173/game/azul-summer-pavilion
```

**3. 提交并推送**

```bash
git add -A
git commit -m "feat: 新增花砖物语：夏日行宫"
git push
```

**4. 约 45 秒后验证线上**

```
https://boardgame-tools.1600727279.workers.dev/game/azul-summer-pavilion
https://boardgame-tools.1600727279.workers.dev/sitemap.xml      ← 应为 82 条
```

---

## 回滚

线上出现问题时，优先用 Git 回滚，不要在控制台直接改配置：

```bash
git log --oneline        # 找到出问题的提交
git revert <提交哈希>
git push
```

`git revert` 会生成一个反向提交，历史保持完整，Cloudflare 会自动部署回滚后的状态。

**禁止使用 `git push --force`**，也不要删除 `main` 上已有的提交。

---

## 各类改动的检查清单

### 新增或修改游戏数据

- [ ] `id` 唯一，仅使用小写字母、数字和连字符（会直接成为 URL 片段）
- [ ] `moods` 的取值来自 `src/lib/types.ts` 中的定义
- [ ] `min <= best` 中的每个值 `<= max`
- [ ] 构建后页面总数正确增加
- [ ] 详情页可以打开，sitemap 条数同步

### 调整推荐算法

- [ ] 手动验证至少三组条件：2 人 / 30 分钟 / 新手，4 人 / 60 分钟 / 策略，6 人 / 120 分钟 / 欢乐
- [ ] 确认心情是硬过滤——选定某类型后，结果中不出现不匹配的游戏
- [ ] 确认结果非空且不超过 6 条

### 修改文案

- [ ] 涉及页面标题或描述时，同步检查 `src/lib/meta.ts`
- [ ] 构建后确认产物 HTML 中的 `<title>` 已更新

### 修改部署配置

- [ ] `wrangler.jsonc` 的 `name` 与控制台项目名一致
- [ ] 改动 `compatibility_date` 后重新验证线上表现
- [ ] 更换域名时同步更新 `site.config.json` 的 `siteUrl`
