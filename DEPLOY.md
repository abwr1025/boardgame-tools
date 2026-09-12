# 部署上线指南

目标：拿到一个公网链接 `https://xxx.vercel.app`，手机能打开，能发给别人。

## 当前状态（我已经做完的）

- Git 仓库已初始化，主分支 `main`
- **GitHub 仓库已创建并推送完成**：<https://github.com/abwr1025/boardgame-tools>（公开，32 个文件）
- 本机 GitHub 凭据（`abwr1025`）可用，之后 push 不会再问密码
- 构建验证通过：`npm run build` → 81 个页面预渲染成功
- 打包好的静态站：`dist-upload.zip`（路线 B 直接用它）

**只剩第 3 步（Vercel 导入）和第 4 步（回填域名）要做。**

---

## 第 1、2 步 · 建仓库 + 推送 ✅ 已完成

仓库在 <https://github.com/abwr1025/boardgame-tools>，32 个文件，`main` 分支与本地完全同步。

以后你自己改了代码要推上去，只需要：

```powershell
cd D:\CodexProjects\boardgame-tools
git add -A
git commit -m "说明这次改了什么"
git push
```

---

## 第 3 步 · 把网站上传到 Vercel（约 5 分钟）

### 先说清楚「上传」到底在传什么

你这个站构建完，就是 `dist/` 里的一堆**静态文件**：HTML、CSS、JS、图标。
它不需要服务器程序、不需要数据库，任何人打开浏览器就能看——**前提是这些文件放在一台 24 小时开机的机器上**。

你在本机跑 `npm run dev` 起的那个服务器，只有你自己能访问（`localhost` 就是「我自己这台电脑」的意思），
关掉窗口就没了。所谓的「上传 / 部署」，就是**把 `dist/` 这堆文件送到一台常年在线的机器上，让它一直对外提供服务**。

Vercel 这类平台就是干这个的。它对个人免费，因为它靠大厂带宽成本 + 付费用户赚钱。

### 为什么用 Vercel，而不是自己买服务器

- 不用买服务器、不用配 nginx、不用管 HTTPS 证书（自动签好）
- 和 GitHub 打通：你 `git push` 一次，它自动重新构建、自动上线
- 静态站没有带宽计费，免费额度对个人站绰绰有余

### 具体步骤

**① 用 GitHub 账号登录 Vercel**

打开 <https://vercel.com> → 点 **Continue with GitHub** → 弹窗点 **Authorize**。

这一步是在授权 Vercel **读取你的 GitHub 仓库**。它只能读，改不了你的代码。

**② 选择要部署的仓库**

进 <https://vercel.com/new>，列表里找到 `boardgame-tools` → 点 **Import**。

如果列表是空的，点 **Adjust GitHub App Permissions**，把 `boardgame-tools` 勾上再回来。

**③ 确认构建配置**（唯一需要动脑的一步）

Vercel 会自动识别出这是 Vite 项目并把三项填好，你核对一下：

| 字段 | 应该填 | 这行是干什么的 |
| --- | --- | --- |
| Framework Preset | `Vite` | 告诉 Vercel 用 Vite 的方式构建 |
| Build Command | `npm run build` | **云端要执行的命令**，等价于你在本机敲的那条 |
| Output Directory | `dist` | 构建产物在哪个文件夹，Vercel 把这个文件夹发布成网站 |

把这条链路搞明白，你以后换任何平台都不会懵：

```
你的代码（存在 GitHub 上）
   ↓  云端自动执行 npm install    —— 装依赖
   ↓  云端自动执行 npm run build  —— 构建 + 预渲染 81 个页面
   ↓  产出 dist/ 文件夹
   ↓  把 dist/ 的内容发布到 CDN
https://xxx.vercel.app           ← 全世界可访问
```

**④ 点 Deploy**

等 1—2 分钟。你会看到构建日志滚动，输出和你在本机跑 `npm run build` 时**一模一样**
（`✓ 38 modules transformed` → `预渲染完成：81 个页面`）。

看到 🎉 和烟花动画就是成了，链接形如 `https://boardgame-tools-xxxx.vercel.app`。

**⑤ 验证**

用手机打开那个链接（或发到微信「文件传输助手」再点开）。**手机能正常看，才算真的上线了。**

> **以后要收费的话注意**：Vercel 的 Hobby（免费）计划，条款上只允许**个人非商业用途**。
> 这个站如果挂广告、卖 Pro 会员，严格讲得升 Pro（$20/月）。
> 国内小团队常见做法是改用 **Cloudflare Pages**——免费版允许商业用途，且不限带宽。
> 迁移成本很低：构建命令和输出目录填一样的，代码一行不用改。
> 所以先用 Vercel 跑通，等真要收钱了再迁，不亏。
>
> **注册时卡在手机验证码收不到？** 见下面的「路线 A′ · Cloudflare Pages」。
> Vercel 的短信走国际通道，+86 号码经常收不到，别在那上面耗时间。

---

## 第 4 步 · 回填域名（让搜索引擎能收录）

编辑 `D:\CodexProjects\boardgame-tools\site.config.json`：

```json
{ "siteUrl": "https://boardgame-tools-xxxx.vercel.app" }
```

然后：

```powershell
cd D:\CodexProjects\boardgame-tools
npm run build
git add -A
git commit -m "chore: 填写站点域名"
git push
```

Vercel 自动重新部署，这次会多生成 `sitemap.xml` 和 canonical 标签。
验证：打开 `https://你的域名/sitemap.xml`，能看到 81 条 URL 就对了。

> 为什么不能留空？canonical 指向不存在的域名会被搜索引擎判为无效信号，比不写更糟。

---

## 路线 A′ · Cloudflare Pages（Vercel 卡住时用这个）

### 什么时候该用它

- 注册 Vercel 时卡在手机短信验证码。`+86` 号码收境外短信到达率很差，很可能是收不到的
- 以后要在站上挂广告、卖会员。Vercel 免费版条款不允许商业用途，Cloudflare Pages 免费版允许，且不限带宽

### 步骤

**① 注册 / 登录**

打开 <https://dash.cloudflare.com/sign-up>，用邮箱注册，或直接 **Sign up with GitHub**。
**不需要手机号，没有短信验证。**

**② 连 GitHub 仓库**

控制台左侧 **Workers & Pages** → **Create** → 选 **Pages** 标签 → **Connect to Git**
→ 授权 GitHub → 选中 `boardgame-tools` → **Begin setup**

**③ 填构建配置**

| 字段 | 填什么 |
| --- | --- |
| Project name | `boardgame-tools`，决定域名 `xxx.pages.dev` |
| Production branch | `main` |
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Build output directory | `dist` |

**④ 加一个环境变量（容易漏，漏了可能构建失败）**

展开 **Environment variables (advanced)**，加一条：

| Variable name | Value |
| --- | --- |
| `NODE_VERSION` | `22` |

Cloudflare 的默认 Node 版本可能比项目要求的低。`package.json` 里写了 engines node 22.x，
这里对齐一下，省得云端报 Node 版本不符。

**⑤ 点 Save and Deploy**

等 1—2 分钟，看构建日志。成功后拿到 `https://boardgame-tools.pages.dev`。

之后每次 `git push` 都会自动重新部署，和 Vercel 一样。

### 和 Vercel 的差别

- 不要手机号，注册门槛低
- 免费版允许商业用途，不限带宽，国内访问速度通常也比 Vercel 好一些
- 自定义域名同样免费，在 **Custom domains** 里加

---

## 路线 B · 60 秒拿到链接（不用登录、不用注册）

想先确认「传上去之后长什么样」再决定用哪个平台，就先走这条。

**原理**：把**本机已经构建好的** `dist/` 文件夹（我打包成了 `dist-upload.zip`）直接传给 Netlify，
它当场把文件挂到 CDN 上。因为文件是在本机构建好的，所以这条路**既不需要 GitHub、也不需要云端构建**。

1. 打开 <https://app.netlify.com/drop>
2. 把 `D:\CodexProjects\boardgame-tools\dist-upload.zip` 拖进页面中间那个虚线框
3. 等十几秒，页面上直接出现 `https://xxxx.netlify.app`

**和 Vercel 的区别**：这条路上传的是「**构建结果**」，不是「源代码」。
所以 Netlify 不知道你的代码长什么样。你改了代码，必须在本机重新 `npm run build` 再拖一次。
适合验证效果、临时发给朋友看；长期用还是走 Vercel（能自动更新）。

---

## 三条红线（踩了要花时间修）

### 1. 不要在这个项目里跑 `npm install` / `npm ci`

这台电脑开着 **Windows 智能应用控制（Smart App Control）**，会把 npm 包里较新的未签名原生二进制拦掉。
`esbuild.exe` 现在的放行状态是**按路径判定**的：装在这个路径下能跑，装到别处或重装一次就可能被拦。

一旦被拦，`npm run dev` 会直接报 `An Application Control policy has blocked this file`，开发服务器起不来。

**已经坏了怎么办** —— 从备份恢复：

```powershell
cd D:\CodexProjects\boardgame-tools
Rename-Item node_modules node_modules_broken
Expand-Archive D:\CodexArchive\boardgame-tools-node_modules.zip -DestinationPath .
```

备份是 26.8 MB 的完整 `node_modules` 快照（7151 个文件），放在 `D:\CodexArchive\`。

**不影响部署**：Vercel / Netlify 的构建机是 Linux，没有智能应用控制，云端 `npm install` 完全正常。

### 2. 不要升级 Vite 到 8、Tailwind 到 4

Vite 8 用 rolldown，Tailwind 4 用 `@tailwindcss/oxide`，**两个都被拦截**。
当前锁定的是唯一能跑的版本组合：Vite 7 + Tailwind 3.4（走 PostCSS，纯 JS 无原生模块）。

### 3. 不要在 C 盘建项目

所有项目放 `D:\CodexProjects\`，草稿放 `D:\CodexWork\`。
C 盘只保留 `C:\Users\16007\.codex\AGENTS.md`（Codex 的配置文件，路径写死在 `$CODEX_HOME`，没法搬）。

---

## 报错对照表

| 看到这个 | 意思是 | 怎么办 |
| --- | --- | --- |
| `ERR_CONNECTION_REFUSED` | 本地开发服务器的黑窗口被关了 | 重新双击 `start-dev.bat` |
| `An Application Control policy has blocked this file` | 智能应用控制拦了原生二进制 | 按「红线 1」从 zip 恢复 node_modules |
| `! [rejected] main -> main (fetch first)` | 远端有本地没有的提交 | `git pull --rebase origin main` 再 push |
| Vercel 部署成功但打开是 404 | 输出目录不对 | Settings → Build & Development → Output Directory 改成 `dist` |
| Vercel 报 `No Output Directory named 'dist'` | 构建失败没产出 | 看部署日志里 `npm run build` 那段的报错 |
| 页面能开但样式全乱 | CSS 没加载 | 检查 Output Directory 是不是被指到了 `dist/dist` |

---

## 上线后检查清单

- [ ] 首页能打开，选「4 人 / 60 分钟 / 聚会欢乐」出得来推荐
- [ ] 随便点一个游戏进详情页，**按 F5 刷新**不 404
- [ ] 把链接发到微信「文件传输助手」，手机上打开排版正常
- [ ] `https://域名/sitemap.xml` 能打开，且是 81 条
- [ ] `https://域名/robots.txt` 能打开
- [ ] 提交到 [Google Search Console](https://search.google.com/search-console) 和 [Bing 站长工具](https://www.bing.com/webmasters)，把 sitemap 地址填进去

---

## 以后怎么更新

```powershell
cd D:\CodexProjects\boardgame-tools
# 改代码 / 加游戏
npm run build     # 本地先确认没报错
git add -A
git commit -m "feat: 加了 5 款新游戏"
git push
```

Vercel 自动重新部署，1 分钟后线上就更新。

---

## 想要自定义域名

Vercel 免费版支持绑自己的域名：Project → Settings → Domains → Add。
买好域名（Cloudflare / Namecheap / 阿里云都行）后按提示改 DNS 解析。
**注意**：国内域名解析到 Vercel，国内访问速度可能不稳定，建议先用默认的 `.vercel.app` 域名跑通。

---

## 最后一句实话

域名和部署只是发令枪，**这个站真正的价值在那 80 款桌游数据的准确性**。
上线之后每周做一件事：挑 10 款中文圈常玩的（阿瓦隆、璀璨宝石、卡坦岛、七大奇迹……），
点开 BGG 核对人数和时长，改数据、提交。三个月后这个库就是中文圈里最好用的桌游选型表之一，
那时候流量才真正开始来。工具站拼的从来不是代码，是数据和内容。
