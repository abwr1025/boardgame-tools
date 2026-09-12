import { GAMES } from "../data/games";
import type { Game } from "./types";
import { MOOD_LABEL } from "./types";

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  jsonLd: Record<string, unknown>;
}

export function homeMeta(): PageMeta {
  return {
    path: "/",
    title: "今晚玩什么 - 桌游推荐器 | 按人数和时长挑桌游",
    description: `输入人数、可用时长和玩家经验，从 ${GAMES.length} 款中文桌游里挑出今晚最合适的那一款。收录卡坦岛、璀璨宝石、阿瓦隆、冷战热斗等热门桌游的人数、时长与难度数据。`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "今晚玩什么 - 桌游推荐器",
      applicationCategory: "GameApplication",
      operatingSystem: "Web",
      description: "按人数、可用时长和玩家经验推荐桌游，并可浏览中文桌游数据库。",
    },
  };
}

export function gameMeta(g: Game): PageMeta {
  const players = g.min === g.max ? `${g.min} 人` : `${g.min}-${g.max} 人`;
  const time = g.minTime === g.maxTime ? `${g.minTime} 分钟` : `${g.minTime}-${g.maxTime} 分钟`;
  const moods = g.moods.map((m) => MOOD_LABEL[m]).join("、");

  return {
    path: `/game/${g.id}`,
    title: `${g.zh}（${g.en}）几人玩、多久、多难？完整介绍 | 今晚玩什么`,
    description: `${g.zh}支持 ${players}，最佳 ${g.best.join("/")} 人，一局约 ${time}，复杂度 ${
      g.weight
    }/5，适合${moods}。${g.note}`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Game",
      name: g.zh,
      alternateName: g.en,
      datePublished: String(g.year),
      numberOfPlayers: { "@type": "QuantitativeValue", minValue: g.min, maxValue: g.max },
      description: g.note,
      genre: g.cats,
    },
  };
}

/** 首页 + 每款游戏一个页面，客户端和服务端共用同一份，避免两边标题不一致 */
export function allPages(): PageMeta[] {
  return [homeMeta(), ...GAMES.map(gameMeta)];
}

export function metaForPath(pathname: string): PageMeta | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return homeMeta();
  const m = clean.match(/^\/game\/([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  const game = GAMES.find((g) => g.id === m[1]);
  return game ? gameMeta(game) : null;
}
