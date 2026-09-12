import type { Experience, Game, Mood } from "./types";

export interface Query {
  players: number;
  minutes: number;
  experience: Experience;
  mood: Mood | "any";
}

export interface Scored {
  game: Game;
  score: number;
  reasons: string[];
}

const WEIGHT_BAND: Record<Experience, { lo: number; hi: number; peak: number }> = {
  new: { lo: 1, hi: 2.2, peak: 1.6 },
  mixed: { lo: 1.5, hi: 3.2, peak: 2.3 },
  veteran: { lo: 2.2, hi: 5, peak: 3.2 },
};

export function fitsPlayers(game: Game, players: number): boolean {
  return players >= game.min && players <= game.max;
}

export function fitsTime(game: Game, minutes: number): boolean {
  return game.maxTime <= minutes;
}

export function isBestAt(game: Game, players: number): boolean {
  return game.best.includes(players);
}

/** 类型是硬条件：选了「烧脑策略」就不该拿不相关的游戏来凑数 */
export function fitsMood(game: Game, mood: Mood | "any"): boolean {
  return mood === "any" || game.moods.includes(mood);
}

function weightScore(game: Game, experience: Experience): number {
  const band = WEIGHT_BAND[experience];
  if (game.weight < band.lo) return -6 - (band.lo - game.weight) * 4;
  if (game.weight > band.hi) return -6 - (game.weight - band.hi) * 4;
  return 6 - Math.abs(game.weight - band.peak) * 2.5;
}

/** 命中最佳人数得满分；否则按距离最佳人数的间隔递减，人数跨度大的再压一点 */
function playerFitScore(game: Game, players: number): number {
  if (isBestAt(game, players)) return 8;
  const span = game.max - game.min;
  const distFromBest = Math.min(...game.best.map((b) => Math.abs(b - players)));
  return 4 - distFromBest * 1.5 - span * 0.2;
}

function timeScore(game: Game, minutes: number): number {
  // 留出讲规则的余量，游戏本身控制在可用时长的 85% 内最舒服
  const usable = minutes * 0.85;
  if (game.maxTime <= usable) return 5;
  return 5 - (game.maxTime - usable) / 15;
}

function buildReasons(game: Game, q: Query): string[] {
  const reasons: string[] = [];
  reasons.push(game.min === game.max ? `固定 ${game.min} 人` : `支持 ${game.min}-${game.max} 人`);
  reasons.push(
    game.minTime === game.maxTime ? `${game.minTime} 分钟` : `${game.minTime}-${game.maxTime} 分钟`,
  );
  if (isBestAt(game, q.players)) reasons.push(`${q.players} 人正是它的最佳人数`);
  const label = ["", "极轻", "轻", "中等", "偏重", "很重"][Math.round(game.weight)] ?? "";
  reasons.push(`难度 ${game.weight.toFixed(1)}（${label}）`);
  return reasons;
}

function candidatesFor(games: Game[], q: Query): Game[] {
  return games
    .filter((g) => fitsPlayers(g, q.players) && fitsTime(g, q.minutes) && fitsMood(g, q.mood))
    .sort((a, b) => a.weight - b.weight);
}

export function recommend(games: Game[], q: Query): Scored[] {
  return candidatesFor(games, q)
    .map((game) => ({
      game,
      score: playerFitScore(game, q.players) + timeScore(game, q.minutes) + weightScore(game, q.experience),
      reasons: buildReasons(game, q),
    }))
    .sort((a, b) => b.score - a.score || a.game.weight - b.game.weight)
    .slice(0, 6);
}

export function countMatches(games: Game[], q: Query): number {
  return candidatesFor(games, q).length;
}
