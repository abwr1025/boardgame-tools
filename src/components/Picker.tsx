import type { Experience, Mood } from "../lib/types";
import { EXPERIENCE_LABEL, MOOD_LABEL } from "../lib/types";
import type { Query } from "../lib/recommend";

const PLAYER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 10];
const TIME_OPTIONS = [
  { v: 20, label: "20 分钟" },
  { v: 30, label: "半小时" },
  { v: 60, label: "1 小时" },
  { v: 90, label: "1.5 小时" },
  { v: 120, label: "2 小时" },
  { v: 999, label: "不限" },
];
const MOOD_OPTIONS: Array<Mood | "any"> = ["any", "party", "bluff", "thinky", "coop", "quick", "family", "two", "story"];

export function Picker({ query, onChange }: { query: Query; onChange: (q: Query) => void }) {
  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-ink-700/70 bg-ink-900/70 p-6 backdrop-blur">
      <Field label="几个人">
        <div className="flex flex-wrap gap-2">
          {PLAYER_OPTIONS.map((p) => (
            <Chip key={p} active={query.players === p} onClick={() => onChange({ ...query, players: p })}>
              {p === 10 ? "10+" : p}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="有多少时间">
        <div className="flex flex-wrap gap-2">
          {TIME_OPTIONS.map((t) => (
            <Chip key={t.v} active={query.minutes === t.v} onClick={() => onChange({ ...query, minutes: t.v })}>
              {t.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="玩家的熟悉程度">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(EXPERIENCE_LABEL) as Experience[]).map((e) => (
            <Chip key={e} active={query.experience === e} onClick={() => onChange({ ...query, experience: e })}>
              {EXPERIENCE_LABEL[e]}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="今晚想玩的类型">
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((m) => (
            <Chip key={m} active={query.mood === m} onClick={() => onChange({ ...query, mood: m })}>
              {m === "any" ? "都行" : MOOD_LABEL[m]}
            </Chip>
          ))}
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</span>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active
          ? "border-felt-500 bg-felt-500/15 text-felt-400"
          : "border-ink-600 bg-ink-800/60 text-slate-400 hover:border-slate-500 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
