/** Title, chapter interludes, and the closing debrief. */

import { useState } from "react";

import { story } from "../content/story";
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
import {
  BEAT_TITLE_ID,
  BadgeChip,
  Eyebrow,
  FactorGrid,
  Hidden,
  PrimaryButton,
  RadioGroup,
  UI_LABEL,
  artUrl,
  radioTabIndex,
} from "./shell";

/* ─────────────────────────── title ─────────────────────────── */

export function TitleScreen({
  onBegin,
  hasSave,
  onResume,
  chapters,
  stale,
  onCode,
}: {
  onBegin: () => void;
  hasSave: boolean;
  onResume: () => void;
  chapters: Chapter[];
  /** a save this build can no longer read, and what can be recovered from it */
  stale?: { message: string; code: string | null; replayable: boolean } | null;
  /** returns an error message, or null when the code was accepted */
  onCode?: (code: string) => string | null;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-5 py-14">
      {/**
       * The title screen arrives as ONE gesture, and this is a reversal worth recording.
       *
       * It had four blocks fading in at 0 / 80 / 140 / 220ms, and the first draft of this
       * work kept the staging and merely tightened it — on the grounds that a screen seen
       * once per run is the one place a frequency gate allows some delight.
       *
       * It is not, and the reason is specific: "animating on first paint when stillness
       * is clearer" is a named tell of a machine-built interface, and this is literally
       * the application's first paint. A staged entrance on the first screen is the single
       * most recognisable thing a generated UI does. Stillness is clearer here, so the
       * page resolves at once and then stops.
       */}
      <div className="m-enter">
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
        className="m-enter mt-9 flex flex-wrap items-center gap-1.5"
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

      <div className="m-enter mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: "scale" as const,
            t: "Every option is defensible",
            /* This used to open by repeating its own heading verbatim, on the first
               screen anyone reads. */
            d: "Whether one works depends on what you know by then, and what you have already promised.",
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
        className="m-enter mt-9 flex flex-wrap items-center gap-4"
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

      {stale && <StaleSave stale={stale} onCode={onCode} />}
    </div>
  );
}

/**
 * A run this build can no longer read, and what is left of it.
 *
 * The save used to be keyed `gpl.save.v3`, so any content change voided every run in
 * progress silently — ship a typo fix mid-cohort and the room resets with no explanation.
 * Now a stale save says so, and hands back the run code it stored at save time: fourteen
 * characters that replay the whole run, which exist only because the game is
 * deterministic. `replayable` is false when the decision structure itself moved, and then
 * this says that rather than offering a code the build will refuse.
 */
function StaleSave({
  stale,
  onCode,
}: {
  stale: { message: string; code: string | null; replayable: boolean };
  onCode?: (code: string) => string | null;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div
      className="m-swap mt-8 max-w-xl rounded-[14px] border px-5 py-4"
      role="note"
      style={{ borderColor: "var(--color-border-control)", background: "var(--color-panel)" }}
    >
      <p className="text-[13px] leading-relaxed text-(--color-ink-soft)">{stale.message}</p>
      {stale.code && stale.replayable && onCode && (
        <>
          <p className="mt-2.5 text-[12px] font-bold uppercase tracking-[0.07em] text-(--color-muted)">
            {UI_LABEL.runCode}
          </p>
          <p className="mt-1 text-[18px] font-bold tracking-[0.04em] text-(--color-ink)">
            {stale.code}
          </p>
          <button
            onClick={() => setError(onCode(stale.code as string))}
            className="mt-3 rounded-xl border border-(--color-line-strong) bg-(--color-surface) px-4 py-2 text-[13px] font-semibold text-(--color-ink) transition-colors hover:bg-(--color-surface-sunk)"
          >
            {UI_LABEL.continueFromCode}
          </button>
          {error && (
            <p role="alert" className="mt-2 text-[13px] text-(--color-risk-text)">
              {error}
            </p>
          )}
        </>
      )}
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
      <div className="m-enter">
        <p className="eyebrow" style={{ color: "var(--color-accent)" }}>
          {node.eyebrow}
        </p>
        <h1
          id={BEAT_TITLE_ID}
          className="mt-2 text-[32px] font-bold leading-[1.1] tracking-[-0.025em] text-(--color-ink)"
        >
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

      {/* Same treatment as a mission's option set, because it is the same object and had
          the same defect: three mutually exclusive cards in an unnamed `<div>`, each
          announced as an independent toggle. This is also the first interactive thing
          anyone meets. */}
      <RadioGroup
        label={node.question}
        className="m-deal mt-3 grid items-stretch gap-3 sm:grid-cols-3"
        style={{ gridTemplateRows: "repeat(5, auto)" }}
      >
        {node.options.map((o, i) => {
          const on = chosen === o.id;
          return (
            <button
              key={o.id}
              className="choice grid gap-0 !p-0 text-left"
              style={{ gridRow: "span 5", gridTemplateRows: "subgrid" }}
              data-selected={on}
              role="radio"
              aria-checked={on}
              tabIndex={radioTabIndex(on, i, chosen !== null)}
              aria-labelledby={`team-${o.id}-title`}
              aria-describedby={`team-${o.id}-desc team-${o.id}-trade`}
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
                id={`team-${o.id}-title`}
                className="px-4 pt-2 text-center text-[15px] font-bold"
                style={{ color: on ? "var(--color-accent-deep)" : "var(--color-ink)" }}
              >
                {o.title}
              </p>
              <p
                id={`team-${o.id}-desc`}
                className="px-4 pt-1.5 text-center text-[13px] leading-snug text-(--color-muted)"
              >
                {o.description}
              </p>

              <div id={`team-${o.id}-trade`} className="px-4 pt-3">
                <ul className="space-y-1 border-t border-(--color-line) pt-2.5">
                  {o.strengths.map((t) => (
                    <li key={t} className="flex items-start gap-1.5 text-[12px] leading-snug">
                      <span className="mt-[2px] shrink-0 text-(--color-good)">
                        <Icon name="check" size={13} />
                      </span>
                      <span className="font-medium text-(--color-ink-soft)">
                        <Hidden>{UI_LABEL.up} </Hidden>
                        {t}
                        <Hidden>.</Hidden>
                      </span>
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
                    <span className="text-(--color-muted)">
                      <Hidden>{UI_LABEL.down} </Hidden>
                      {o.tradeoff}
                      <Hidden>.</Hidden>
                    </span>
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
      </RadioGroup>
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
      {/**
       * The interlude is time passing, and it is the slowest beat in the game: 420ms
       * against 220ms everywhere else.
       *
       * It can afford to be. This is the only screen with nothing to decide, nothing to
       * compare and nothing to read across — measured at ~20% ink and 0.13% chroma, it is
       * the emptiest surface in the product, so a slower arrival reads as a pause in the
       * work rather than as the interface being sluggish. It is also the one beat where
       * the motion IS the content: nothing on this screen says "months have passed"
       * except the pacing and the chapter track filling in behind you in the top bar,
       * which starts 260ms after this arrives.
       */}
      <div className="m-enter-slow">
        {/* The chapter number lands. It is the only thing on screen that marks the
            boundary this beat exists to mark. */}
        <span
          aria-hidden="true"
          className="m-land flex h-11 w-11 items-center justify-center rounded-[14px] text-[15px] font-bold text-white"
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
        <h1
          id={BEAT_TITLE_ID}
          className="mt-2.5 text-[32px] font-bold leading-[1.08] tracking-[-0.025em] text-(--color-ink)"
        >
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
    i,
    r: 62 - i * 15,
    colour: `var(${DIMENSION_META[d].fillVar})`,
    value: dims[d],
  }));
  const score = Math.round((dims.win + dims.profit + dims.deliver) / 3);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <g transform={`rotate(-90 ${c} ${c})`}>
          {rings.map(({ d, i, r, colour, value }) => {
            const circ = 2 * Math.PI * r;
            const arc = (circ * value) / 100;
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
                {/**
                 * The three arcs draw themselves, 1,100ms, 120ms apart.
                 *
                 * The longest animation in the game and the only screen that can afford
                 * it: the run is over, there is nothing to do but read, and this is the
                 * summing-up. It is `stroke-dashoffset`, so the arc is revealed along its
                 * own path rather than scaled or wiped.
                 *
                 * The numbers beside it deliberately do NOT count up from zero, and the
                 * distinction matters: an arc being drawn reads as the interface drawing a
                 * summary, whereas a number ticking 0 → 64 reads as a claim that the value
                 * used to be 0. It never was — every dimension starts the run near 50. A
                 * count-up here would be a 1.1-second lie about the player's own data.
                 */}
                <circle
                  className="m-draw"
                  style={
                    {
                      "--gpl-arc": arc,
                      animationDelay: `${i * 120}ms`,
                    } as React.CSSProperties
                  }
                  cx={c}
                  cy={c}
                  r={r}
                  fill="none"
                  stroke={colour}
                  strokeWidth={9}
                  strokeLinecap="round"
                  strokeDasharray={`${arc} ${circ}`}
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
  const threads = causalThreads(state, story);
  const account = ledger(state);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      {/* One gesture for the verdict, and then the page holds still.

          No cascade down the rest of this screen, deliberately. It is ~3,000px long, so
          most of a mount-time stagger would play where nobody is looking, and a
          scroll-triggered reveal would leave every section below the fold at opacity 0 —
          invisible in a full-page screenshot and, worse, in a print. The summing-up motion
          on this screen is the ring drawing itself, once, at the top. */}
      <div className="m-enter">
        <Eyebrow>How it ended</Eyebrow>
        <h1
          id={BEAT_TITLE_ID}
          className="mt-2.5 text-[32px] font-bold leading-[1.1] tracking-[-0.025em] text-(--color-ink)"
        >
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
