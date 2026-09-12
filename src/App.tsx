import { useEffect, useMemo, useState } from "react";
import { GameCard } from "./components/GameCard";
import { Library } from "./components/Library";
import { Picker } from "./components/Picker";
import { GAMES } from "./data/games";
import { metaForPath } from "./lib/meta";
import { Link, usePathname } from "./lib/router";
import { countMatches, recommend, type Query } from "./lib/recommend";
import { MOOD_LABEL } from "./lib/types";
import { GameDetail } from "./pages/GameDetail";

const DEFAULT_QUERY: Query = { players: 4, minutes: 60, experience: "mixed", mood: "any" };

export function parseRoute(pathname: string): { name: "home" } | { name: "game"; id: string } | { name: "404" } {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return { name: "home" };
  const m = clean.match(/^\/game\/([A-Za-z0-9_-]+)$/);
  if (m) return { name: "game", id: m[1] };
  return { name: "404" };
}

export default function App({ initialPath }: { initialPath?: string }) {
  const pathname = usePathname(initialPath);
  const route = parseRoute(pathname);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const meta = metaForPath(pathname);
    if (!meta) return;
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
  }, [pathname]);

  if (route.name === "game") {
    const game = GAMES.find((g) => g.id === route.id);
    if (game) {
      return (
        <Shell>
          <GameDetail game={game} />
        </Shell>
      );
    }
    return (
      <Shell>
        <div className="py-24 text-center">
          <h1 className="text-2xl font-semibold text-white">找不到这款游戏</h1>
          <p className="mt-3 text-sm text-slate-400">它可能还没被收录，或者链接拼错了。</p>
          <Link to="/" className="mt-6 inline-block text-sm text-felt-400 hover:underline">
            回到推荐器
          </Link>
        </div>
      </Shell>
    );
  }

  if (route.name === "404") {
    return (
      <Shell>
        <div className="py-24 text-center">
          <h1 className="text-2xl font-semibold text-white">页面不存在</h1>
          <Link to="/" className="mt-6 inline-block text-sm text-felt-400 hover:underline">
            回到首页
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Home />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-white">
            <span className="text-lg">🎲</span>
            今晚玩什么
          </Link>
          <nav className="flex items-center gap-5 text-sm text-slate-400">
            <Link to="/#pick" className="transition-colors hover:text-felt-400">
              推荐器
            </Link>
            <Link to="/#library" className="transition-colors hover:text-felt-400">
              游戏库 {GAMES.length}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5">{children}</main>

      <footer className="border-t border-ink-800/80 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 text-xs text-slate-500">
          <p>
            数据为玩家整理，人数与时长以出版方说明书为准；复杂度参考 BGG weight，可能随版本和扩展变化。
          </p>
          <p>下一步：计分器、随机分身份、以及「带去别人家」的便携清单。</p>
        </div>
      </footer>
    </div>
  );
}

function Home() {
  const [query, setQuery] = useState<Query>(DEFAULT_QUERY);

  const results = useMemo(() => recommend(GAMES, query), [query]);
  const total = useMemo(() => countMatches(GAMES, query), [query]);
  const empty = results.length === 0;

  return (
    <>
      <section className="py-14 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">今晚玩什么？</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          告诉你几个人、有多少时间、熟不熟手，从这里挑一款最合适的桌游。收录 {GAMES.length}{" "}
          款中文圈常见桌游，不用再翻十篇「桌游推荐」清单。
        </p>
      </section>

      <section id="pick" className="scroll-mt-20 pb-16">
        <Picker query={query} onChange={setQuery} />

        <div className="mt-8 flex items-baseline justify-between">
          <h2 className="text-sm font-medium tracking-wide text-slate-500 uppercase">推荐结果</h2>
          <span className="text-xs text-slate-500">
            符合条件 {total} 款{empty ? "" : `，显示前 ${results.length} 款`}
          </span>
        </div>

        {empty ? (
          <div className="mt-6 rounded-2xl border border-ink-700/70 bg-ink-900/60 p-8 text-center">
            <p className="text-slate-400">这个条件下没有合适的。</p>
            <p className="mt-2 text-sm text-slate-500">
              {query.mood === "any"
                ? "试试放宽时间，或者先把时间调到「不限」。"
                : `没有同时满足「${MOOD_LABEL[query.mood]}」的组合，把类型换回「都行」会宽松很多。`}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map(({ game, reasons }, i) => (
              <GameCard key={game.id} game={game} reasons={reasons} highlight={i === 0} />
            ))}
          </div>
        )}
      </section>

      <section id="library" className="scroll-mt-20 pb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white">中文桌游库</h2>
          <p className="mt-2 text-sm text-slate-400">
            中英文名对照、人数、时长、难度、机制。点开任意一款看详情。
          </p>
        </div>
        <Library />
      </section>
    </>
  );
}
