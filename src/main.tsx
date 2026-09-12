import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root")!;
const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);

// 预渲染过的页面会带上 prerender-path。只有它和当前地址一致时才 hydrate；
// 否则（比如服务器把未知路径兜底到了首页）直接清空重渲染，避免结构对不上。
const prerenderedPath = document
  .querySelector('meta[name="prerender-path"]')
  ?.getAttribute("content");
const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

if (container.hasChildNodes() && prerenderedPath === currentPath) {
  hydrateRoot(container, tree);
} else {
  container.replaceChildren();
  createRoot(container).render(tree);
}
