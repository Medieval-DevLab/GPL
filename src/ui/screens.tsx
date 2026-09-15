/** Title, chapter interludes, and the closing debrief. */

import { causalThreads, finalVerdict, ledger } from "../engine/engine";
import { BADGE_META, STAGES, type Chapter, type GameState, type Interlude } from "../engine/types";
import { Icon, Pill, SectionTitle } from "./icons";
import { BadgeChip, Eyebrow, FactorGrid, PrimaryButton } from "./shell";

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
        <h1 className="mt-3 text-[74px] font-bold leading-[0.95] tracking-[-0.04em] text-(--color-ink) sm:text-[104px]">
          GPL
        </h1>
        <p className="mt-1 text-[14px] font-bold uppercase tracking-[0.2em] text-(--color-accent)">
          Global Pursuit League
        </p>
        <p className="mt-7 max-w-xl text-[19px] leading-[1.55] text-(--color-ink-soft)">
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
                className="flex h-[20px] w-[20px] items-center justify-center rounded-full text-[10px] font-bold text-(--color-accent-deep)"
                style={{ background: "var(--color-accent-tint)" }}
              >
                {c.number}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-(--color-muted)">
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
            t: "There are no right answers",
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
            <p className="mt-2.5 text-[14.5px] font-bold text-(--color-ink)">{c.t}</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-(--color-muted)">{c.d}</p>
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
          className="flex h-11 w-11 items-center justify-center rounded-[14px] text-[17px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
          }}
        >
          {node.chapter}
        </span>
        <p className="eyebrow mt-5">{node.eyebrow}</p>
        <h1 className="mt-2.5 text-[40px] font-bold leading-[1.08] tracking-[-0.025em] text-(--color-ink)">
          {node.title}
        </h1>
        <div className="mt-6 space-y-3.5">
          {node.body.map((p, i) => (
            <p key={i} className="text-[17px] leading-[1.6] text-(--color-ink-soft)">
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
                <span className="text-[11px] font-bold text-(--color-faint) tabular-nums">
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

export function EndingScreen({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const verdict = finalVerdict(state.dims, state.flags);
  const threads = causalThreads(state);
  const account = ledger(state);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="anim-fade">
        <Eyebrow>How it ended</Eyebrow>
        <h1 className="mt-2.5 text-[36px] font-bold leading-[1.1] tracking-[-0.025em] text-(--color-ink)">
          {verdict.title}
        </h1>
        <p className="mt-4 text-[17px] leading-[1.6] text-(--color-ink-soft)">{verdict.summary}</p>
      </div>

      <div className="card mt-7 p-6">
        <FactorGrid dims={state.dims} />
        <p className="mt-5 border-t border-(--color-line) pt-4 text-[13.5px] leading-relaxed text-(--color-muted)">
          These three pull against each other on purpose. A deal that scores full marks on all of
          them is not a sign of skill — it is a sign the game was too easy.
        </p>
      </div>

      {account.length > 0 && (
        <div className="mt-7">
          <SectionTitle icon="layers">The account</SectionTitle>
          <p className="mt-1.5 text-[13.5px] text-(--color-muted)">
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
                  <p className="text-[14px] font-bold text-(--color-ink)">{e.label}</p>
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
          <p className="mt-1.5 text-[13.5px] text-(--color-muted)">
            Nothing here is random. These are the chains your own decisions created.
          </p>
          <div className="mt-3 space-y-3">
            {threads.map((t, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="border-l-[3px] border-(--color-accent) px-5 py-3.5">
                  <p className="text-[14.5px] leading-relaxed text-(--color-ink)">{t.because}</p>
                  <p className="mt-1.5 flex items-start gap-2 text-[14.5px] leading-relaxed text-(--color-ink-soft)">
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
          <p className="mt-3 text-center text-[12.5px] text-(--color-faint)">
            {state.badges.length} of {Object.keys(BADGE_META).length} recognised this run
          </p>
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
                  <p className="text-[14px] leading-relaxed text-(--color-ink-soft)">
                    {h.headline}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-4">
        <SectionTitle icon="bulb" tone="warn">
          What this run taught
        </SectionTitle>
        <ul className="mt-3 space-y-2.5">
          {state.history.map((h) => (
            <li key={h.missionId} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-accent)"
              />
              <p className="text-[15px] leading-relaxed text-(--color-ink-soft)">
                {h.lesson.principle}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="card mt-9 p-6"
        style={{
          background: "var(--color-accent-tint)",
          borderColor: "var(--color-accent-ring)",
        }}
      >
        <p className="text-[20px] font-bold text-(--color-accent-deep)">Run it differently</p>
        <p className="mt-2 text-[15px] leading-relaxed text-(--color-ink-soft)">
          Ask different questions at the start and the same decisions later on produce a different
          engagement. The most interesting version of this is the second one.
        </p>
        <div className="mt-5">
          <PrimaryButton onClick={onRestart}>Take a new brief</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
