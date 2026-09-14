/**
 * The three beats after a decision.
 *
 * Pacing is deliberate and it is the main source of "juice" in this game:
 *   resolving  — a short pause so the commit lands as an event, not a page swap
 *   consequence — what happened, WHY it happened, what is now different
 *   lesson      — the transferable rule, five seconds, after the experience
 *
 * Splitting "why it happened" from "what it teaches" is the whole design. Put
 * them on one screen and the lesson reads as a lecture attached to a result.
 *
 * These beats drop the side rails on purpose. The briefing screen is busy
 * because a briefing is busy; the result should be the only thing on screen.
 * The action bar stays full-bleed throughout, so it reads as one persistent
 * HUD rather than a button that moves around between screens.
 */

import { useEffect } from "react";

import type { OutcomeTone, Resolution } from "../engine/types";
import { Icon } from "./icons";
import { ActionBar, BadgeChip, Eyebrow, FactorGrid } from "./shell";

const TONE: Record<
  OutcomeTone,
  { label: string; colour: string; tint: string; icon: Parameters<typeof Icon>[0]["name"] }
> = {
  strong: { label: "That worked", colour: "var(--color-good)", tint: "#e4f5ef", icon: "check" },
  mixed: { label: "Mixed result", colour: "var(--color-warn)", tint: "#fbf0e2", icon: "scale" },
  hard: { label: "That hurt", colour: "var(--color-bad)", tint: "#fbeaea", icon: "warning" },
};

/* ─────────────────────────── resolving ─────────────────────────── */

export function ResolvingScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(onDone, reduced ? 120 : 1100);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="mx-auto flex min-h-[62vh] max-w-3xl flex-col items-center justify-center px-5">
      <div className="anim-fade w-full max-w-sm">
        <p className="mb-5 text-center text-[14px] font-medium text-(--color-muted)">
          Seeing what happens…
        </p>
        <div className="shimmer h-1.5 w-full overflow-hidden rounded-full bg-(--color-canvas-deep)" />
      </div>
    </div>
  );
}

/* ─────────────────────────── consequence ─────────────────────────── */

export function ConsequenceScreen({
  resolution,
  onContinue,
}: {
  resolution: Resolution;
  onContinue: () => void;
}) {
  const tone = TONE[resolution.outcome.tone];

  return (
    <>
      <div className="mx-auto max-w-3xl px-5 pt-9">
        <div className="anim-rise">
          <div className="card overflow-hidden">
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5"
              style={{ background: tone.tint }}
            >
              <span
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
                style={{ color: tone.colour }}
              >
                <Icon name={tone.icon} size={13} />
                {tone.label}
              </span>
              <span className="text-[12.5px] text-(--color-ink-soft)">
                <span className="text-(--color-muted)">You chose: </span>
                <span className="font-semibold">{resolution.chosenLabel}</span>
              </span>
            </div>
            <div className="px-6 py-6 sm:px-8 sm:py-7">
              <h1 className="display text-[28px] leading-[1.15] text-(--color-ink) sm:text-[34px]">
                {resolution.outcome.headline}
              </h1>
              <p className="mt-4 text-[16.5px] leading-[1.68] text-(--color-ink-soft)">
                {resolution.outcome.detail}
              </p>
            </div>
          </div>
        </div>

        {resolution.revealed.length > 0 && (
          <div className="stagger mt-7 space-y-3">
            <Eyebrow>What you found</Eyebrow>
            {resolution.revealed.map((e) => (
              <div key={e.id} className="card p-5">
                <p className="eyebrow">{e.label}</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-(--color-ink)">{e.reveals}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Eyebrow>What is now different</Eyebrow>
          <ul className="mt-3 space-y-2.5">
            {resolution.outcome.changed.map((c, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[15.5px] leading-relaxed text-(--color-ink-soft)"
              >
                <span
                  aria-hidden="true"
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-accent)"
                />
                {c}
              </li>
            ))}
          </ul>
        </div>

        <div className="card mt-8 p-6">
          <FactorGrid dims={resolution.dimsAfter} deltas={resolution.deltas} showDeltas />
        </div>
      </div>

      <ActionBar label="Why did that happen?" onAction={onContinue} />
    </>
  );
}

/* ─────────────────────────── lesson ─────────────────────────── */

export function LessonScreen({
  resolution,
  onContinue,
  isLast,
}: {
  resolution: Resolution;
  onContinue: () => void;
  isLast: boolean;
}) {
  const { lesson, newBadges } = resolution;

  return (
    <>
      <div className="anim-rise mx-auto max-w-2xl px-5 pt-12">
        {newBadges.length > 0 && (
          <div className="mb-8 space-y-3">
            {newBadges.map((b) => (
              <BadgeChip key={b} id={b} animate />
            ))}
          </div>
        )}

        <p className="eyebrow flex items-center gap-1.5" style={{ color: "var(--color-accent)" }}>
          <Icon name="flag" size={13} />
          The point
        </p>
        <h1 className="display mt-3 text-[28px] leading-[1.2] text-(--color-ink) sm:text-[33px]">
          {lesson.principle}
        </h1>

        <p className="mt-5 text-[16.5px] leading-[1.68] text-(--color-ink-soft)">
          {lesson.because}
        </p>

        {lesson.watchFor && (
          <div
            className="mt-7 rounded-xl border px-5 py-4"
            style={{
              borderColor: "var(--color-accent-ring)",
              background: "var(--color-accent-tint)",
            }}
          >
            <p className="eyebrow" style={{ color: "var(--color-accent-deep)" }}>
              Next time
            </p>
            <p className="mt-1.5 text-[15.5px] leading-relaxed text-(--color-ink)">
              {lesson.watchFor}
            </p>
          </div>
        )}
      </div>

      <ActionBar label={isLast ? "See how it went" : "Continue"} onAction={onContinue} />
    </>
  );
}
