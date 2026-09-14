/** Title, chapter interludes, and the closing debrief. */

import { causalThreads, finalVerdict } from "../engine/engine";
import { BADGE_META, STAGES, type GameState, type Interlude } from "../engine/types";
import { BadgeChip, Eyebrow, MeterRow, PrimaryButton } from "./chrome";

/* ─────────────────────────── title ─────────────────────────── */

export function TitleScreen({ onBegin, hasSave, onResume }: {
  onBegin: () => void;
  hasSave: boolean;
  onResume: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[88vh] max-w-3xl flex-col justify-center px-5 py-16">
      <div className="anim-rise">
        <p className="eyebrow">A short game about winning work</p>
        <h1 className="display mt-4 text-[72px] leading-[0.92] tracking-tight text-ink sm:text-[104px]">
          GPL
        </h1>
        <p className="mt-7 max-w-xl text-[20px] leading-[1.55] text-ink-soft">
          A client you have never met is about to become a promise you have to keep.
          Ten decisions stand between those two things.
        </p>
      </div>

      <div className="anim-rise mt-12 grid gap-5 sm:grid-cols-3" style={{ animationDelay: "0.12s" }}>
        {[
          {
            t: "There are no right answers",
            d: "Every option is defensible. Whether it works depends on what you know and what you already promised.",
          },
          {
            t: "Nothing is random",
            d: "Every result can be explained. If something goes wrong in month five, you can trace it back to the decision that caused it.",
          },
          {
            t: "About 25 minutes",
            d: "One engagement, from first contact to delivery. Your choices carry all the way through.",
          },
        ].map((c) => (
          <div key={c.t} className="card p-5">
            <p className="text-[14.5px] font-bold text-ink">{c.t}</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{c.d}</p>
          </div>
        ))}
      </div>

      <div
        className="anim-rise mt-12 flex flex-wrap items-center gap-4"
        style={{ animationDelay: "0.22s" }}
      >
        <PrimaryButton onClick={onBegin}>{hasSave ? "Start again" : "Begin"}</PrimaryButton>
        {hasSave && (
          <button
            onClick={onResume}
            className="rounded-xl border border-line-strong bg-surface px-5 py-3 text-[15px] font-semibold text-ink transition-colors hover:bg-surface-sunk"
          >
            Resume where you left off
          </button>
        )}
      </div>

      <p className="anim-fade mt-10 text-[13px] text-faint" style={{ animationDelay: "0.3s" }}>
        Client → Lead → Opportunity → Solution → Deal → Delivery
      </p>
    </div>
  );
}

/* ─────────────────────────── interlude ─────────────────────────── */

export function InterludeScreen({
  node,
  onContinue,
}: {
  node: Interlude;
  onContinue: () => void;
}) {
  return (
    <div
      key={node.id}
      className="mx-auto flex min-h-[78vh] max-w-2xl flex-col justify-center px-5 py-16"
    >
      <div className="anim-rise">
        <Eyebrow>{node.eyebrow}</Eyebrow>
        <h1 className="display mt-4 text-[46px] leading-[1.05] text-ink sm:text-[58px]">
          {node.title}
        </h1>
        <div className="mt-8 space-y-4">
          {node.body.map((p, i) => (
            <p key={i} className="text-[18px] leading-[1.65] text-ink-soft">
              {p}
            </p>
          ))}
        </div>
      </div>
      <div className="anim-rise mt-11" style={{ animationDelay: "0.16s" }}>
        <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
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

export function EndingScreen({
  state,
  onRestart,
}: {
  state: GameState;
  onRestart: () => void;
}) {
  const verdict = finalVerdict(state.dims);
  const threads = causalThreads(state);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-14">
      <div className="anim-rise">
        <Eyebrow>How it ended</Eyebrow>
        <h1 className="display mt-3 text-[40px] leading-[1.1] text-ink sm:text-[50px]">
          {verdict.title}
        </h1>
        <p className="mt-5 text-[18px] leading-[1.65] text-ink-soft">{verdict.summary}</p>
      </div>

      <div className="card anim-rise mt-10 p-7" style={{ animationDelay: "0.1s" }}>
        <MeterRow dims={state.dims} size="lg" />
        <p className="mt-6 border-t border-line pt-5 text-[13.5px] leading-relaxed text-muted">
          These three pull against each other on purpose. A deal that scores full marks on all of
          them is not a sign of skill — it is a sign the game was too easy.
        </p>
      </div>

      {state.badges.length > 0 && (
        <div className="anim-rise mt-10" style={{ animationDelay: "0.16s" }}>
          <Eyebrow>What you did well</Eyebrow>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {state.badges.map((b) => (
              <BadgeChip key={b} id={b} />
            ))}
          </div>
        </div>
      )}

      {threads.length > 0 && (
        <div className="anim-rise mt-12" style={{ animationDelay: "0.18s" }}>
          <Eyebrow>What led to what</Eyebrow>
          <p className="mt-2 text-[14px] text-muted">
            Nothing in this game is random. These are the chains your own decisions created.
          </p>
          <div className="mt-4 space-y-4">
            {threads.map((t, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="border-l-[3px] border-accent px-5 py-4">
                  <p className="text-[15px] leading-relaxed text-ink">{t.because}</p>
                  <p className="mt-2 flex items-start gap-2 text-[15px] leading-relaxed text-ink-soft">
                    <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold text-accent">
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

      <div className="anim-rise mt-12" style={{ animationDelay: "0.2s" }}>
        <Eyebrow>Your decisions</Eyebrow>
        <ol className="mt-4 space-y-0">
          {state.history.map((h, i) => {
            const stage = STAGES.find((s) => s.id === h.stage);
            return (
              <li key={h.missionId} className="relative flex gap-4 pb-7">
                {i < state.history.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[7px] top-5 h-full w-px bg-line-strong"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-canvas"
                  style={{ background: TONE_DOT[h.tone] }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                    {stage?.label} · {h.missionTitle}
                  </p>
                  <p className="mt-1 text-[15.5px] font-semibold text-ink">{h.chosenLabel}</p>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-ink-soft">{h.headline}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="anim-rise mt-6" style={{ animationDelay: "0.24s" }}>
        <Eyebrow>What this run taught</Eyebrow>
        <ul className="mt-4 space-y-3.5">
          {state.history.map((h) => (
            <li key={h.missionId} className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <p className="text-[15.5px] leading-relaxed text-ink-soft">{h.lesson.principle}</p>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="card anim-rise mt-12 p-7"
        style={{ animationDelay: "0.28s", background: "var(--color-accent-tint)", borderColor: "var(--color-accent-ring)" }}
      >
        <p className="display text-[22px] text-accent-deep">Run it differently</p>
        <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">
          Ask different questions at the start and the same decisions later on produce a different
          engagement. The most interesting version of this game is the second one.
        </p>
        <div className="mt-6">
          <PrimaryButton onClick={onRestart}>Play again</PrimaryButton>
        </div>
      </div>

      <p className="mt-10 text-center text-[12.5px] text-faint">
        {state.badges.length} of {Object.keys(BADGE_META).length} recognitions earned this run
      </p>
    </div>
  );
}
