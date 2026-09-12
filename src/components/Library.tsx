import { useMemo, useState } from "react";
import { GAMES } from "../data/games";
import type { Mood } from "../lib/types";
import { MOOD_LABEL } from "../lib/types";
import { GameCard } from "./GameCard";

type SortKey = "weight-asc" | "weight-desc" | "time-asc" | "year-desc" | "name";

const SORTS: Array<{ v: SortKey; label: string }> = [
  { v: "weight-asc", label: "难度从低到高" },
  { v: "weight-desc", label: "难度从高到低" },
  { v: "time-asc", label: "时长从短到长" },
  { v: "year-desc", label: "年份从新到旧" },
  { v: "name", label: "按名字" },
];

export function Library() {
  const [q, setQ] = useState("");
  const [mood, setMood] = useState<Mood | "any">("any");
  const [players, setPlayers] = useState(0);
  const [sort, setSort] = useState<SortKey>("weight-asc");

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const filtered = GAMES.filter((g) => {
      if (mood !== "any" && !g.moods.includes(mood)) return false;
      if (players && (players < g.min || players > g.max)) return false;
      if (!kw) return true;
      return (
        g.zh.toLowerCase().includes(kw) ||
        g.en.toLowerCase().includes(kw) ||
        g.cats.some((c) => c.toLowerCase().includes(kw)) ||
        g.note.toLowerCase().includes(kw)
      );
    });
    return filtered.sort((a, b) => {
      switch (sort) {
        case "weight-asc":
          return a.weight - b.weight;
        case "weight-desc":
          return b.weight - a.weight;
        case "time-asc":
          return a.maxTime - b.maxTime;
        case "year-desc":
          return b.year - a.year;
        case "name":
          return a.zh.localeCompare(b.zh, "zh-Hans-CN");
      }
    });
  }, [q, mood, players, sort]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-ink-700/70 bg-ink-900/70 p-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索中文名、英文名、类型，比如「合作」「Catan」"
          className="w-full rounded-xl border border-ink-600 bg-ink-950/60 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-felt-500"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">类型</span>
          {(["any", "party", "bluff", "thinky", "coop", "quick", "family", "two", "story"] as Array<Mood | "any">).map(
            (m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  mood === m
                    ? "border-felt-500 bg-felt-500/15 text-felt-400"
                    : "border-ink-600 text-slate-400 hover:text-slate-200"
                }`}
              >
                {m === "any" ? "全部" : MOOD_LABEL[m]}
              </button>
            ),
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-500">
            人数
            <select
              value={players}
              onChange={(e) => setPlayers(Number(e.target.value))}
              className="rounded-lg border border-ink-600 bg-ink-950/60 px-2 py-1 text-xs text-slate-300 outline-none focus:border-felt-500"
            >
              <option value={0}>不限</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n === 10 ? "10+" : n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            排序
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-ink-600 bg-ink-950/60 px-2 py-1 text-xs text-slate-300 outline-none focus:border-felt-500"
            >
              {SORTS.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <span className="ml-auto text-xs text-slate-500">共 {list.length} 款</span>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">没找到，换个关键词试试。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}
