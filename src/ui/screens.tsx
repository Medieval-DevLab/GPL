/** Title, chapter interludes, and the closing debrief. */

import { causalThreads, finalVerdict, ledger } from "../engine/engine";
import {
  DIMENSIONS,
  DIMENSION_META,
  STAGES,
  type DimensionId,
  type Chapter,
  type GameState,
  type Interlude,
  type Setup,
} from "../engine/types";
import { Icon, Pill, SectionTitle } from "./icons";
import { BadgeChip, Eyebrow, FactorGrid, PrimaryButton, artUrl } from "./shell";

/* ─────────────────────────── title ─────────────────────────── */

export function TitleScreen({
  onBegin,
  hasSave,
  onResume,
  chapters,
}: {
  onBegin: () => void;
  hasSave: boolean;
  onResume: () => void;
  chapters: Chapter[];
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-5 py-14">
      <div className="anim-fade">
        <p className="eyebrow">A short game about winning work</p>
        <h1 className="mt-3 text-[56px] font-bold leading-[0.95] tracking-[-0.04em] text-(--color-ink) sm:text-[56px]">
          GPL
        </h1>
        <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.2em] text-(--color-accent)">
          Global Pursuit League
        </p>
        <p className="mt-7 max-w-xl text-[18px] leading-[1.55] text-(--color-ink-soft)">
          You have just been handed your first client to win. A company you have never met is
          about to become a promise someone has to keep.
        </p>
      </div>

      <div
        className="anim-fade mt-9 flex flex-wrap items-center gap-1.5"
        style={{ animationDelay: "0.08s" }}
      >
        {chapters.map((c, i) => (
          <span key={c.number} className="flex items-center gap-1.5">
            <span className="flex items-center gap-2 rounded-full border border-(--color-line) bg-(--color-surface) py-1 pl-1 pr-3">
              <span
                aria-hidden="true"
                className="flex h-[20px] w-[20px] items-center justify-center rounded-full text-[12px] font-bold text-(--color-accent-deep)"
                style={{ background: "var(--color-accent-tint)" }}
              >
                {c.number}
              </span>
              <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-(--color-muted)">
                {c.label}
              </span>
            </span>
            {i < chapters.length - 1 && (
              <span aria-hidden="true" className="text-(--color-line-strong)">
                ›
              </span>
            )}
          </span>
        ))}
      </div>

      <div className="anim-fade mt-8 grid gap-4 sm:grid-cols-3" style={{ animationDelay: "0.14s" }}>
        {[
          {
            icon: "scale" as const,
            t: "Every option is defensible",
            d: "Every option is defensible. Whether it works depends on what you know and what you already promised.",
          },
          {
            icon: "target" as const,
            t: "Nothing is random",
            d: "Every result can be explained. If something goes wrong in month five, you can trace it to the decision that caused it.",
          },
          {
            icon: "clock" as const,
            t: "Call it before you commit",
            d: "You say what each decision will cost before you make it. Then you find out.",
          },
        ].map((c) => (
          <div key={c.t} className="card p-5">
            <span className="text-(--color-accent)">
              <Icon name={c.icon} size={18} />
            </span>
            <p className="mt-2.5 text-[15px] font-bold text-(--color-ink)">{c.t}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-(--color-muted)">{c.d}</p>
          </div>
        ))}
      </div>

      <div
        className="anim-fade mt-9 flex flex-wrap items-center gap-4"
        style={{ animationDelay: "0.22s" }}
      >
        <PrimaryButton onClick={onBegin}>{hasSave ? "Start again" : "Take the brief"}</PrimaryButton>
        {hasSave && (
          <button
            onClick={onResume}
            className="rounded-xl border border-(--color-line-strong) bg-(--color-surface) px-5 py-3 text-[15px] font-semibold text-(--color-ink) transition-colors hover:bg-(--color-surface-sunk)"
          >
            Resume where you left off
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── chapter 0 ─────────────────────────── */

/**
 * The starting advantage.
 *
 * Deliberately not styled as a mission: no rails, no prediction gate, no consequence.
 * You are picking who you are, not deciding anything yet — and the PRD's whole argument
 * for this screen is that a beginning state beats a tutorial (p. 55).
 */
export function SetupScreen({
  node,
  chosen,
  onChoose,
}: {
  node: Setup;
  chosen: string | null;
  onChoose: (id: string) => void;
}) {
  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-center px-5 py-8">
      <div className="anim-fade">
        <p className="eyebrow" style={{ color: "var(--color-accent)" }}>
          {node.eyebrow}
        </p>
        <h1 className="mt-2 text-[32px] font-bold leading-[1.1] tracking-[-0.025em] text-(--color-ink)">
          {node.title}
        </h1>
        <div className="mt-3 max-w-2xl space-y-1.5">
          {node.body.map((p, i) => (
            <p key={i} className="text-[15px] leading-[1.55] text-(--color-ink-soft)">
              {p}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-7">
        <h2 className="text-[18px] font-bold text-(--color-ink)">{node.question}</h2>
        <p className="mt-0.5 text-[13px] text-(--color-muted)">
          Three teams. None of them is good at everything.
        </p>
      </div>

      <div
        className="mt-3 grid items-stretch gap-3 sm:grid-cols-3"
        style={{ gridTemplateRows: "repeat(5, auto)" }}
      >
        {node.options.map((o) => {
          const on = chosen === o.id;
          return (
            <button
              key={o.id}
              className="choice grid gap-0 !p-0 text-left"
              style={{ gridRow: "span 5", gridTemplateRows: "subgrid" }}
              data-selected={on}
              aria-pressed={on}
              onClick={() => onChoose(o.id)}
            >
              <div>
                {o.image && (
                  <img
                    src={artUrl(o.image)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-[96px] w-full object-cover"
                  />
                )}
                <div className="-mt-6 flex justify-center">
                  <span
                    aria-hidden="true"
                    className="flex h-[48px] w-[48px] items-center justify-center rounded-full border-[3px] border-(--color-surface)"
                    style={{
                      background: on ? "var(--color-accent)" : "var(--color-accent-tint)",
                      color: on ? "#fff" : "var(--color-accent)",
                    }}
                  >
                    <Icon name={o.icon} size={23} />
                  </span>
                </div>
              </div>

              <p
                className="px-4 pt-2 text-center text-[15px] font-bold"
                style={{ color: on ? "var(--color-accent-deep)" : "var(--color-ink)" }}
              >
                {o.title}
              </p>
              <p className="px-4 pt-1.5 text-center text-[13px] leading-snug text-(--color-muted)">
                {o.description}
              </p>

              <div className="px-4 pt-3">
                <ul className="space-y-1 border-t border-(--color-line) pt-2.5">
                  {o.strengths.map((t) => (
                    <li key={t} className="flex items-start gap-1.5 text-[12px] leading-snug">
                      <span className="mt-[2px] shrink-0 text-(--color-good)">
                        <Icon name="check" size={13} />
                      </span>
                      <span className="font-medium text-(--color-ink-soft)">{t}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-1.5 text-[12px] leading-snug">
                    <span
                      aria-hidden="true"
                      className="mt-[2px] flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full text-white"
                      style={{ background: "var(--color-bad)" }}
                    >
                      <Icon name="cross" size={9} />
                    </span>
                    <span className="text-(--color-muted)">{o.tradeoff}</span>
                  </li>
                </ul>
              </div>

              <div className="self-end p-4">
                <span
                  className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border px-2 py-[7px] text-[13px] font-bold"
                  style={
                    on
                      ? {
                          background: "var(--color-accent)",
                          borderColor: "var(--color-accent)",
                          color: "#fff",
                        }
                      : {
                          background: "var(--color-surface)",
                          borderColor: "var(--color-line-strong)",
                          color: "var(--color-accent)",
                        }
                  }
                >
                  {on ? "This is us" : "Pick this team"}
                  <span aria-hidden="true">→</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── interlude ─────────────────────────── */

export function InterludeScreen({
  node,
  chapter,
}: {
  node: Interlude;
  chapter?: Chapter;
}) {
  return (
    <div
      key={node.id}
      className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-5 py-10"
    >
      <div className="anim-fade">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-[14px] text-[15px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
          }}
        >
          {node.chapter}
        </span>
        {node.milestone && (
          <p className="mt-5">
            <Pill tone="good">
              <Icon name="check" size={12} />
              {node.milestone}
            </Pill>
          </p>
        )}
        <p className={`eyebrow ${node.milestone ? "mt-3" : "mt-5"}`}>{node.eyebrow}</p>
        <h1 className="mt-2.5 text-[32px] font-bold leading-[1.08] tracking-[-0.025em] text-(--color-ink)">
          {node.title}
        </h1>
        <div className="mt-6 space-y-3.5">
          {node.body.map((p, i) => (
            <p key={i} className="text-[15px] leading-[1.6] text-(--color-ink-soft)">
              {p}
            </p>
          ))}
        </div>

        {chapter && (
          <ul className="mt-8 flex flex-wrap gap-2">
            {chapter.steps.map((s, i) => (
              <li
                key={s}
                className="flex items-center gap-2 rounded-lg border border-(--color-line) bg-(--color-surface) px-3 py-1.5 text-[13px] text-(--color-ink-soft)"
              >
                <span className="text-[12px] font-bold text-(--color-faint) tabular-nums">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── ending ─────────────────────────── */

const TONE_DOT: Record<string, string> = {
  strong: "var(--color-good)",
  mixed: "var(--color-warn)",
  hard: "var(--color-bad)",
};

const LEDGER_COLOUR = {
  good: "var(--color-good)",
  neutral: "var(--color-accent)",
  bad: "var(--color-bad)",
} as const;

/**
 * Three arcs, one per dimension, with the run's score in the middle.
 *
 * The mockups put a letter grade in a ring here, and the PRD does too. We keep their
 * geometry and drop the letter: a grade invites the player to optimise the grader, and
 * `docs/ENGAGEMENT-MODEL.md` rejects an end-of-run rank outright. Three arcs say the same
 * thing better anyway — you can see at a glance which one took the strain.
 */
function BalanceRing({ dims }: { dims: Record<DimensionId, number> }) {
  const size = 148;
  const c = size / 2;
  const rings = DIMENSIONS.map((d, i) => ({
    d,
    r: 62 - i * 15,
    colour: `var(${DIMENSION_META[d].varName})`,
    value: dims[d],
  }));
  const score = Math.round((dims.win + dims.profit + dims.deliver) / 3);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <g transform={`rotate(-90 ${c} ${c})`}>
          {rings.map(({ d, r, colour, value }) => {
            const circ = 2 * Math.PI * r;
            return (
              <g key={d}>
                <circle
                  cx={c}
                  cy={c}
                  r={r}
                  fill="none"
                  stroke="var(--color-canvas-deep)"
                  strokeWidth={9}
                />
                <circle
                  cx={c}
                  cy={c}
                  r={r}
                  fill="none"
                  stroke={colour}
                  strokeWidth={9}
                  strokeLinecap="round"
                  strokeDasharray={`${(circ * value) / 100} ${circ}`}
                />
              </g>
            );
          })}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[24px] font-bold leading-none tabular-nums text-(--color-ink)">
          {score}
        </span>
      </div>
    </div>
  );
}

export function EndingScreen({ state }: { state: GameState }) {
  const verdict = finalVerdict(state.dims, state.flags);
  const threads = causalThreads(state);
  const account = ledger(state);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="anim-fade">
        <Eyebrow>How it ended</Eyebrow>
        <h1 className="mt-2.5 text-[32px] font-bold leading-[1.1] tracking-[-0.025em] text-(--color-ink)">
          {verdict.title}
        </h1>
        <p className="mt-4 text-[15px] leading-[1.6] text-(--color-ink-soft)">{verdict.summary}</p>
      </div>

      <div className="card mt-7 p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <BalanceRing dims={state.dims} />
          <div className="min-w-0 flex-1">
            <FactorGrid dims={state.dims} />
          </div>
        </div>
        <p className="mt-5 border-t border-(--color-line) pt-4 text-[13px] leading-relaxed text-(--color-muted)">
          No engagement finishes level on all three. The one that gave is the one you decided
          could.
        </p>
      </div>

      {account.length > 0 && (
        <div className="mt-7">
          <SectionTitle icon="layers">The account</SectionTitle>
          <p className="mt-1.5 text-[13px] text-(--color-muted)">
            What you learned, what you promised, and what you spent to get here.
          </p>
          <div className="card mt-3 overflow-hidden">
            {account.map((e) => (
              <div
                key={e.label}
                className="flex gap-3 border-b border-(--color-line) px-5 py-3 last:border-b-0"
              >
                <span className="mt-0.5 shrink-0" style={{ color: LEDGER_COLOUR[e.tone] }}>
                  <Icon
                    name={e.tone === "good" ? "check" : e.tone === "bad" ? "warning" : "layers"}
                    size={15}
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-(--color-ink)">{e.label}</p>
                  <p className="text-[13px] leading-snug text-(--color-muted)">{e.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {threads.length > 0 && (
        <div className="mt-8">
          <SectionTitle icon="target">What led to what</SectionTitle>
          <p className="mt-1.5 text-[13px] text-(--color-muted)">
            Each of these starts with something you chose.
          </p>
          <div className="mt-3 space-y-3">
            {threads.map((t, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="border-l-[3px] border-(--color-accent) px-5 py-3.5">
                  <p className="text-[15px] leading-relaxed text-(--color-ink)">{t.because}</p>
                  <p className="mt-1.5 flex items-start gap-2 text-[15px] leading-relaxed text-(--color-ink-soft)">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 font-bold text-(--color-accent)"
                    >
                      →
                    </span>
                    {t.soLater}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.badges.length > 0 && (
        <div className="mt-8">
          <SectionTitle icon="check" tone="good">
            How you played
          </SectionTitle>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {state.badges.map((b) => (
              <BadgeChip key={b} id={b} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <SectionTitle icon="flag">Your decisions</SectionTitle>
        <ol className="mt-4 space-y-0">
          {state.history.map((h, i) => {
            const stage = STAGES.find((s) => s.id === h.stage);
            return (
              <li key={h.missionId} className="relative flex gap-4 pb-6">
                {i < state.history.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[7px] top-5 h-full w-px bg-(--color-line-strong)"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-(--color-canvas)"
                  style={{ background: TONE_DOT[h.tone] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="neutral">{stage?.label}</Pill>
                    <span className="text-[12px] font-medium text-(--color-faint)">
                      {h.missionTitle}
                    </span>
                  </div>
                  <p className="mt-1 text-[15px] font-bold text-(--color-ink)">{h.chosenLabel}</p>
                  <p className="text-[13px] leading-relaxed text-(--color-ink-soft)">
                    {h.headline}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div
        className="card mt-9 p-6"
        style={{
          background: "var(--color-accent-tint)",
          borderColor: "var(--color-accent-ring)",
        }}
      >
        <p className="text-[18px] font-bold text-(--color-accent-deep)">Run it differently</p>
        <p className="mt-2 text-[15px] leading-relaxed text-(--color-ink-soft)">
          Ask different questions at the start and the same decisions later on produce a different
          engagement. The most interesting version of this is the second one.
        </p>
      </div>
    </div>
  );
}
