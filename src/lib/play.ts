import type { Game } from "./types";

export interface PlayLink {
  label: string;
  url: string;
  /** true = 打开即可开局；false = 该平台上的搜索入口 */
  direct: boolean;
}

/**
 * 可直接开局的在线入口。
 * 目前只收录 Board Game Arena，其 slug 均已逐条核对存在于 BGA 官方游戏目录，
 * 链接格式为 https://boardgamearena.com/gamepanel?game=<slug>。
 */
export function directPlayLinks(game: Game): PlayLink[] {
  const links: PlayLink[] = [];
  if (game.bga) {
    links.push({
      label: "Board Game Arena",
      url: `https://boardgamearena.com/gamepanel?game=${encodeURIComponent(game.bga)}`,
      direct: true,
    });
  }
  return links;
}

/** 没有直接入口时的兜底搜索，保证每款游戏都有可操作的去处 */
export function searchPlayLinks(game: Game): PlayLink[] {
  const q = encodeURIComponent(game.en);
  return [
    { label: "Tabletopia", url: `https://tabletopia.com/search?query=${q}`, direct: false },
    { label: "Steam", url: `https://store.steampowered.com/search/?term=${q}`, direct: false },
  ];
}
