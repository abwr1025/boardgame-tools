import { build } from "esbuild";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const distDir = path.join(root, "dist");
const ssrDir = path.join(root, ".ssr");
const ssrOut = path.join(ssrDir, "entry.mjs");

if (!existsSync(distDir)) {
  console.error("找不到 dist/，请先执行 vite build");
  process.exit(1);
}

await rm(ssrDir, { recursive: true, force: true });

await build({
  entryPoints: [path.join(root, "scripts", "ssr-entry.tsx")],
  outfile: ssrOut,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  jsx: "automatic",
  external: ["react", "react-dom", "react/*", "react-dom/*"],
  logLevel: "warning",
});

const { renderPage, pages } = await import(pathToFileURL(ssrOut).href);

let siteUrl = "";
try {
  const cfg = JSON.parse(await readFile(path.join(root, "site.config.json"), "utf8"));
  siteUrl = String(cfg.siteUrl || "").replace(/\/+$/, "");
} catch {
  siteUrl = "";
}

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const template = await readFile(path.join(distDir, "index.html"), "utf8");

function injectHtml(meta) {
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, "<title>" + esc(meta.title) + "</title>");
  html = html.replace(
    /<meta\s+name="description"[\s\S]*?\/>/,
    '<meta name="description" content="' + esc(meta.description) + '" />',
  );
  html = html.replace(
    /<meta\s+property="og:title"[\s\S]*?\/>/,
    '<meta property="og:title" content="' + esc(meta.title) + '" />',
  );
  html = html.replace(
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    '<meta property="og:description" content="' + esc(meta.description) + '" />',
  );
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    '<script type="application/ld+json">' + JSON.stringify(meta.jsonLd) + "</script>",
  );

  // 标记这一页是为哪个路由预渲染的，客户端据此判断能否安全 hydrate
  const headExtra = ['  <meta name="prerender-path" content="' + meta.path + '" />'];
  if (siteUrl) {
    const abs = siteUrl + meta.path;
    headExtra.push('  <link rel="canonical" href="' + abs + '" />');
    headExtra.push('  <meta property="og:url" content="' + abs + '" />');
  }
  html = html.replace("</head>", headExtra.join("\n") + "\n  </head>");

  const body = renderPage(meta.path);
  html = html.replace('<div id="root"></div>', '<div id="root">' + body + "</div>");
  return html;
}

const all = pages();

for (const meta of all) {
  const html = injectHtml(meta);
  const dir = meta.path === "/" ? distDir : path.join(distDir, meta.path.slice(1));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), html, "utf8");
}

// 兜底页：root 留空，交给客户端渲染，避免 hydration 结构不匹配
const notFound = template
  .replace(/<title>[\s\S]*?<\/title>/, "<title>页面不存在 | 今晚玩什么</title>")
  .replace(
    /<meta\s+name="description"[\s\S]*?\/>/,
    '<meta name="description" content="这个页面不存在，回到首页用推荐器挑一款今晚要玩的桌游。" />',
  )
  .replace(
    /<meta\s+property="og:title"[\s\S]*?\/>/,
    '<meta property="og:title" content="页面不存在 | 今晚玩什么" />',
  );
await writeFile(path.join(distDir, "404.html"), notFound, "utf8");

if (siteUrl) {
  const urls = all
    .map((m) => "  <url><loc>" + siteUrl + m.path + "</loc><changefreq>monthly</changefreq></url>")
    .join("\n");
  await writeFile(
    path.join(distDir, "sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls +
      "\n</urlset>\n",
    "utf8",
  );
  await writeFile(
    path.join(distDir, "robots.txt"),
    "User-agent: *\nAllow: /\n\nSitemap: " + siteUrl + "/sitemap.xml\n",
    "utf8",
  );
  console.log("预渲染完成：" + all.length + " 个页面，已生成 sitemap.xml");
} else {
  await writeFile(path.join(distDir, "robots.txt"), "User-agent: *\nAllow: /\n", "utf8");
  console.log("预渲染完成：" + all.length + " 个页面");
  console.log("提示：site.config.json 的 siteUrl 还是空的，跳过了 canonical 和 sitemap。");
  console.log("      部署拿到域名后填上它，再 npm run build 一次。");
}

await rm(ssrDir, { recursive: true, force: true });
