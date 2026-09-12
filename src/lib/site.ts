import cfg from "../../site.config.json";

const trimSlash = (s: string) => String(s || "").replace(/\/+$/, "");

/** 站点级配置，客户端与服务端共用同一份，避免两边不一致 */
export const SITE = {
  siteUrl: trimSlash(cfg.siteUrl),
  repoUrl: String(cfg.repoUrl || ""),
  feedbackUrl: String(cfg.feedbackUrl || ""),
};
