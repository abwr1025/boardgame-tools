import { GameCard } from "../components/GameCard";
import { GAMES } from "../data/games";
import { Link } from "../lib/router";
import { SITE } from "../lib/site";
import { directPlayLinks, searchPlayLinks } from "../lib/play";
import type { Game } from "../lib/types";
import { MOOD_LABEL } from "../lib/types";

function fmtPlayers(g: Game) {
  return g.min === g.max ? `${g.min} 人` : `${g.min}-${g.max} 人`;
}

function fmtTime(g: Game) {
  return g.minTime === g.maxTime ? `${g.minTime} 分钟` : `${g.minTime}-${g.maxTime} 分钟`;
}

const WEIGHT_LABEL = ["", "极轻", "轻", "中等", "偏重", "很重"];

/** 同类型 + 人数重叠 + 难度接近，用来做内链和相关推荐 */
function relatedGames(game: Game, limit = 3): Game[] {
  return GAMES.filter((g) => g.id !== game.id)
    .map((g) => {
      const moodOverlap = g.moods.filter((m) => game.moods.includes(m)).length;
      const playerOverlap = Math.max(0, Math.min(g.max, game.max) - Math.max(g.min, game.min) + 1);
      const weightGap = Math.abs(g.weight - game.weight);
      return { g, score: moodOverlap * 4 + Math.min(playerOverlap, 4) - weightGap * 1.5 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.g);
}

export function GameDetail({ game }: { game: Game }) {
  const related = relatedGames(game);
  const direct = directPlayLinks(game);
  const search = searchPlayLinks(game);

  return (
    <div className="flex flex-col gap-10 pb-20">
      <nav className="pt-8 text-sm text-slate-500">
        <Link to="/" className="transition-colors hover:text-felt-400">
          首页
        </Link>
        <span className="mx-2">/</span>
        <Link to="/#library" className="transition-colors hover:text-felt-400">
          游戏库
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-400">{game.zh}</span>
      </nav>

      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{game.zh}</h1>
        <p className="text-base text-slate-500">
          {game.en}
          <span className="mx-2">·</span>
          {game.year} 年
        </p>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">{game.note}</p>
        <p className="text-sm text-slate-500">
          这段介绍和下方的数据都由玩家整理，难免有出入。
          {SITE.feedbackUrl ? (
            <a
              href={SITE.feedbackUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="ml-1 underline decoration-dotted hover:text-felt-400"
            >
              发现错误欢迎指出
            </a>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-2">
          {game.cats.map((c) => (
            <span key={c} className="rounded-full bg-ink-700/60 px-3 py-1 text-xs text-slate-300">
              {c}
            </span>
          ))}
        </div>
      </header>

      <section className="rounded-2xl border border-felt-500/30 bg-felt-500/[0.06] p-6">
        <h2 className="text-lg font-semibold text-white">在线玩</h2>
        {direct.length > 0 ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              这款游戏在 Board Game Arena 上有官方实现，注册后浏览器直接开局，免费。
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {direct.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-full bg-felt-500 px-5 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-felt-400"
                >
                  {l.label} 开局 →
                </a>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              这款游戏暂时没有能直接开局的在线版本——Board Game Arena 未收录，多为出版方授权限制。
              下面两个平台可能有数字版或第三方实现：
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {search.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-full border border-ink-600 px-5 py-2 text-sm text-slate-300 transition-colors hover:border-felt-500/60 hover:text-felt-400"
                >
                  在 {l.label} 找
                </a>
              ))}
            </div>
          </>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium tracking-wide text-slate-500 uppercase">基本信息</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="支持人数" value={fmtPlayers(game)} />
          <Stat label="最佳人数" value={`${game.best.join(" / ")} 人`} tone="gold" />
          <Stat label="一局时长" value={fmtTime(game)} />
          <Stat
            label="复杂度"
            value={`${game.weight.toFixed(1)} · ${WEIGHT_LABEL[Math.round(game.weight)] ?? ""}`}
          />
        </dl>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs text-slate-500">
            <span>轻</span>
            <span>重</span>
          </div>
          <div className="flex gap-1.5" role="img" aria-label={`复杂度 ${game.weight} / 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`h-2 flex-1 rounded-full ${
                  n <= Math.round(game.weight) ? "bg-felt-500" : "bg-ink-700"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium tracking-wide text-slate-500 uppercase">适合的场合</h2>
        <div className="flex flex-wrap gap-2">
          {game.moods.map((m) => (
            <Link
              key={m}
              to="/"
              className="rounded-full border border-felt-500/40 bg-felt-500/10 px-4 py-1.5 text-sm text-felt-400 transition-colors hover:bg-felt-500/20"
            >
              {MOOD_LABEL[m]}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-ink-700/70 bg-ink-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">想直接开局？</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          回到推荐器，填上你们几个人、有多少时间，它会连同其他候选一起排好序。
        </p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-full bg-felt-500 px-5 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-felt-400"
        >
          打开推荐器
        </Link>
      </section>

      {related.length > 0 ? (
        <section>
          <h2 className="mb-4 text-sm font-medium tracking-wide text-slate-500 uppercase">
            玩腻了可以试试这些
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </section>
      ) : null}

      <footer className="text-xs text-slate-500">
        数据为玩家整理，人数与时长以出版方说明书为准，欢迎指正。
        <a
          href={"https://boardgamegeek.com/geeksearch.php?action=search&q=" + encodeURIComponent(game.en)}
          target="_blank"
          rel="noreferrer noopener"
          className="ml-2 underline decoration-dotted hover:text-felt-400"
        >
          在 BGG 核对这款游戏
        </a>
        {SITE.feedbackUrl ? (
          <a
            href={SITE.feedbackUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="ml-2 underline decoration-dotted hover:text-felt-400"
          >
            提交更正
          </a>
        ) : null}
      </footer>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "gold" }) {
  return (
    <div className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-4">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-1 text-lg font-semibold ${tone === "gold" ? "text-gold-400" : "text-white"}`}>
        {value}
      </dd>
    </div>
  );
}
