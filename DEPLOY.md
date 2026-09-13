# 部署与运维

面向维护者。日常改动的标准流程见 [WORKFLOW.md](WORKFLOW.md)，本文只涉及平台配置与排障。

## 线上环境

| 项 | 值 |
| --- | --- |
| 平台 | Cloudflare Workers（静态资源模式） |
| 地址 | <https://boardgame-tools.1600727279.workers.dev> |
| 源码仓库 | <https://github.com/abwr1025/boardgame-tools> |
| 生产分支 | `main` |
| 触发方式 | 推送到 `main` 后自动构建，约 45 秒上线 |

## 部署链路

```
GitHub main 分支
   ↓  云端 npm clean-install
   ↓  云端 npm run build   （tsc -b → vite build → node scripts/prerender.mjs）
   ↓  产出 dist/：168 个文件，含 81 个 HTML、静态资源、robots.txt、sitemap.xml
   ↓  npx wrangler deploy   读取 wrangler.jsonc，将 dist/ 作为静态资源发布
https://boardgame-tools.1600727279.workers.dev
```

Cloudflare 的构建机为 Linux 环境，不受开发机 Windows 智能应用控制的限制。

## 控制台配置

| 字段 | 值 |
| --- | --- |
| 仓库 | `abwr1025/boardgame-tools` |
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | 留空（即仓库根目录） |

### 如何判断项目类型

Cloudflare 新版控制台默认引导至 **Workers** 而非 Pages，两者都能托管静态站，但配置方式不同：

- `Deploy command` 为 `npx wrangler deploy` → Workers 项目，**必须有 `wrangler.jsonc`**
- 项目创建于 `Pages` 标签下 → Pages 项目，**不需要**任何配置文件

## wrangler.jsonc

**该文件为必需项。** 缺少它，`npx wrangler deploy` 无从得知要发布什么，构建会在 `Executing user deploy command` 之后失败。

```jsonc
{
  "name": "boardgame-tools",
  "compatibility_date": "2026-09-12",
  "assets": {
    "directory": "./dist",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page"
  }
}
```

| 配置项 | 作用 |
| --- | --- |
| `name` | Worker 名称，需与控制台中的项目一致，否则会创建出第二个项目 |
| `compatibility_date` | Workers 运行时行为版本，修改后需重新验证线上表现 |
| `assets.directory` | 以 `dist/` 作为静态资源目录 |
| `assets.html_handling` | `auto-trailing-slash`：`/game/avalon` 命中 `/game/avalon/index.html`，80 个详情页依赖此项 |
| `assets.not_found_handling` | `404-page`：未匹配的路径返回 `dist/404.html` |

## Node 版本

Cloudflare 构建机默认使用 Node 24。`package.json` 中 `engines` 声明为 `>=20.19`，与构建机一致，不会再触发 `EBADENGINE` 警告。

如需锁定具体版本，在控制台 **Settings → Build → Variables and Secrets** 中添加 `NODE_VERSION = 22`。

## 故障排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 构建停在 `Executing user deploy command` 之后失败 | 缺少 `wrangler.jsonc` | 确认该文件存在于仓库根目录 |
| 部署成功但访问任意路径均为 404 | `assets.directory` 配置错误 | 确认其值为 `./dist` |
| 直接访问 `/game/<id>` 返回 404 | `html_handling` 配置丢失 | 恢复为 `auto-trailing-slash` |
| 出现 `npm warn EBADENGINE Unsupported engine` | 构建机 Node 版本与 `engines` 不符 | 放宽 `engines` 或设置 `NODE_VERSION` |
| 本地 `ERR_CONNECTION_REFUSED` | 开发服务器已停止 | 重新执行 `npm run dev` 或双击 `start-dev.bat` |
| 本地 `An Application Control policy has blocked this file` | 智能应用控制拦截了原生二进制 | 见 README「开发环境约束」，改用纯 JS 工具链 |
| `git push` 连接超时或 `Connection was reset` | 未走系统代理 | 见下方「Git 代理」 |

## Git 代理

在中国大陆网络环境下，直连 github.com 的 443 端口通常不可靠，表现为约 21 秒超时或 `Recv failure: Connection was reset`。若本机已运行代理（如 Clash，默认监听 127.0.0.1:7897），可为 git 单独配置代理：

```bash
git config --global http.https://github.com.proxy http://127.0.0.1:7897
```

该配置只影响 github.com，不改变其他远程仓库的行为。实测配置前 21 秒超时，配置后约 4 秒完成推送。

**该设置依赖代理进程处于运行状态**，代理退出后推送会再次失败。

## 备选部署平台

### Netlify Drop（用于快速验证）

将 `npm run build` 产出的 `dist/` 目录打包为 zip，拖入 <https://app.netlify.com/drop>，无需注册即可获得临时地址。

上传的是构建产物而非源码，不会与 Git 联动，每次更新都需重新构建并上传。适合临时分享或验证渲染效果，不适合长期维护。

### Cloudflare Pages

控制台 **Workers & Pages → Create → Pages → Connect to Git**，配置如下：

| 字段 | 值 |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| 环境变量 | `NODE_VERSION = 22` |

Pages 不需要 `wrangler.jsonc`；该文件的存在不会影响 Pages 的构建。

### Vercel

仓库中保留了 `vercel.json`，用于 `/game/:id` 的 rewrite。Vercel 侧配置为 Framework Preset `Vite`、Build Command `npm run build`、Output Directory `dist`。

注意 Vercel Hobby 计划的条款限定为个人非商业用途，站点若涉及广告或付费需升级至 Pro 计划。

> Vercel 注册流程要求手机短信验证。中国大陆号码接收境外短信的到达率较低，若收不到验证码，直接改用 Cloudflare 即可。

## 自定义域名

当前使用 `workers.dev` 子域名，该域名在中国大陆的访问稳定性一般。接入自有域名：

1. 购买域名
2. Cloudflare 控制台 → 目标 Worker → **Settings → Domains & Routes → Add → Custom domain**
3. 按提示配置 DNS 解析，Cloudflare 会自动签发 HTTPS 证书
4. 域名生效后更新 `site.config.json` 的 `siteUrl` 并重新构建，以生成正确的 canonical 与 sitemap

## Docker 本地自托管

`Dockerfile` 为两阶段构建：`node:22-alpine` 执行 `npm run build`（`tsc` + `vite build` + `scripts/prerender.mjs`），产物 `dist/` 再复制到 `nginx:alpine`。

```powershell
docker compose -f deploy\docker-compose.yml up -d --build
docker compose -f deploy\docker-compose.yml logs -f web
docker compose -f deploy\docker-compose.yml down
```

访问地址为 `http://127.0.0.1:8081`。

注意事项：

- 该容器用于本地预览与自托管。线上仍按本文件前述流程部署到 Cloudflare Workers，两者产物同为 `dist` 目录
- `.dockerignore` 排除了 `node_modules`、`dist` 和部署压缩包，构建上下文只包含源码
- `scripts/` 目录不能加入 `.dockerignore`，`npm run build` 依赖其中的预渲染脚本，缺少会导致构建报 `MODULE_NOT_FOUND`
## 发布检查清单

- [ ] `npm run build` 无报错，输出「预渲染完成：81 个页面」
- [ ] `npm run lint` 退出码为 0
- [ ] 线上 `/` 可访问且标题正确
- [ ] 线上 `/game/<id>` 可访问，刷新不 404
- [ ] 线上 `/sitemap.xml` 条数与页面总数一致
- [ ] 移动端打开排版正常
