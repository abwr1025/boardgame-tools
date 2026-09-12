import { Link } from "../lib/router";
import type { Game } from "../lib/types";
import { MOOD_LABEL } from "../lib/types";

function fmtPlayers(g: Game) {
  return g.min === g.max ? `${g.min} 人` : `${g.min}-${g.max} 人`;
}

function fmtTime(g: Game) {
  return g.minTime === g.maxTime ? `${g.minTime} 分钟` : `${g.minTime}-${g.maxTime} 分钟`;
}

export function GameCard({ game, reasons, highlight }: { game: Game; reasons?: string[]; highlight?: boolean }) {
  const href = `/game/${game.id}`;

  return (
    <article
      className={`flex flex-col gap-3 rounded-2xl border p-5 transition-colors ${
        highlight
          ? "border-felt-500/50 bg-ink-800/80 hover:border-felt-400"
          : "border-ink-700/70 bg-ink-900/60 hover:border-ink-600"
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">
            <Link to={href} className="text-white transition-colors hover:text-felt-400">
              {game.zh}
            </Link>
          </h3>
          <p className="truncate text-xs text-slate-500">{game.en}</p>
        </div>
        <span className="shrink-0 rounded-full bg-ink-700/70 px-2 py-1 text-[11px] text-slate-400">
          {game.year}
        </span>
      </header>

      <div className="flex flex-wrap gap-1.5">
        <Pill>{fmtPlayers(game)}</Pill>
        <Pill>{fmtTime(game)}</Pill>
        <Pill>难度 {game.weight.toFixed(1)}</Pill>
        <Pill tone="gold">最佳 {game.best.join("/")} 人</Pill>
        {game.bga ? <Pill tone="play">可在线玩</Pill> : null}
      </div>

      <p className="text-sm leading-relaxed text-slate-400">{game.note}</p>

      <div className="flex flex-wrap gap-1.5">
        {game.cats.map((c) => (
          <span key={c} className="text-[11px] text-slate-500">
            #{c}
          </span>
        ))}
        {game.moods.map((m) => (
          <span key={m} className="text-[11px] text-felt-400/70">
            {MOOD_LABEL[m]}
          </span>
        ))}
      </div>

      {reasons && reasons.length > 0 ? (
        <ul className="mt-auto flex flex-wrap gap-x-3 gap-y-1 border-t border-ink-700/60 pt-3 text-[11px] text-slate-500">
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}

      <Link to={href} className="text-[11px] text-slate-500 underline decoration-dotted hover:text-felt-400">
        查看详情
      </Link>
    </article>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone?: "gold" | "play" }) {
  const cls =
    tone === "gold"
      ? "bg-gold-400/15 text-gold-400"
      : tone === "play"
        ? "bg-felt-500/15 text-felt-400"
        : "bg-ink-700/60 text-slate-300";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>
  );
}
