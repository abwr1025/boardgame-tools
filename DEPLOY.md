# 部署上线指南

目标：拿到一个公网链接 `https://xxx.vercel.app`，手机能打开，能发给别人。

## 当前状态（我已经做完的）

- Git 仓库已初始化，主分支 `main`
- **GitHub 仓库已创建并推送完成**：<https://github.com/abwr1025/boardgame-tools>（公开，32 个文件）
- 本机 GitHub 凭据（`abwr1025`）可用，之后 push 不会再问密码
- 构建验证通过：`npm run build` → 81 个页面预渲染成功
- 打包好的静态站：`dist-netlify-drop.zip`（路线 B 直接用它）

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

## 第 3 步 · Vercel 导入（约 2 分钟）

1. 打开 <https://vercel.com> → **Continue with GitHub** → 授权
2. 进入 <https://vercel.com/new>
3. 在仓库列表里找到 `boardgame-tools` → **Import**
4. 配置页确认这三项（一般都是自动填好的）：
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 点 **Deploy**，等 1—2 分钟
6. 拿到链接，形如 `https://boardgame-tools-xxxx.vercel.app`

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

## 路线 B · 60 秒拿到链接（不用账号）

只想先看看线上长什么样、或者发给朋友看：

1. 打开 <https://app.netlify.com/drop>
2. 把 `D:\CodexProjects\boardgame-tools\dist-netlify-drop.zip` 拖进去
3. 立刻得到 `https://xxxx.netlify.app`

缺点：没绑定 Git，改了代码要重新拖。适合先看效果，长期还是走 Vercel。

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
