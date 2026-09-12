export type Mood =
  | "party"   // 轻松聚会
  | "bluff"   // 推理嘴炮
  | "thinky"  // 烧脑策略
  | "coop"    // 合作
  | "quick"   // 快节奏
  | "family"  // 家庭友好
  | "two"     // 双人专精
  | "story";  // 剧情沉浸

export interface Game {
  id: string;
  zh: string;
  en: string;
  year: number;
  min: number;
  max: number;
  /** 最佳人数，官方标 note 或玩家共识 */
  best: number[];
  minTime: number;
  maxTime: number;
  /** 复杂度 1-5，越大越烧脑 */
  weight: number;
  cats: string[];
  moods: Mood[];
  note: string;
}

export const MOOD_LABEL: Record<Mood, string> = {
  party: "轻松聚会",
  bluff: "推理嘴炮",
  thinky: "烧脑策略",
  coop: "合作闯关",
  quick: "快节奏",
  family: "家庭友好",
  two: "双人专精",
  story: "剧情沉浸",
};

export type Experience = "new" | "mixed" | "veteran";

export const EXPERIENCE_LABEL: Record<Experience, string> = {
  new: "全是新手",
  mixed: "有老手带",
  veteran: "都是老玩家",
};
