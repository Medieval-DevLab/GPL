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
 */

import { useEffect } from "react";

import type { OutcomeTone, Resolution } from "../engine/types";
import { BadgeChip, Eyebrow, MeterRow, PrimaryButton } from "./chrome";

const TONE: Record<OutcomeTone, { label: string; colour: string; tint: string }> = {
  strong: { label: "That worked", colour: "var(--color-good)", tint: "#e4f5ef" },
  mixed: { label: "Mixed result", colour: "var(--color-warn)", tint: "#fbf0e2" },
  hard: { label: "That hurt", colour: "var(--color-bad)", tint: "#fbeaea" },
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
        <p className="mb-5 text-center text-[14px] font-medium text-muted">
          Seeing what happens…
        </p>
        <div className="shimmer h-1.5 w-full overflow-hidden rounded-full bg-canvas-deep" />
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
    <div className="anim-rise mx-auto max-w-3xl px-5 pb-24 pt-10">
      <Eyebrow>You chose</Eyebrow>
      <p className="mt-1.5 text-[16px] font-semibold text-ink">{resolution.chosenLabel}</p>

      <div className="mt-8 border-l-[3px] pl-6" style={{ borderColor: tone.colour }}>
        <span
          className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
          style={{ background: tone.tint, color: tone.colour }}
        >
          {tone.label}
        </span>
        <h1 className="display mt-4 text-[30px] leading-[1.15] text-ink sm:text-[36px]">
          {resolution.outcome.headline}
        </h1>
        <p className="mt-5 text-[17px] leading-[1.68] text-ink-soft">
          {resolution.outcome.detail}
        </p>
      </div>

      {resolution.revealed.length > 0 && (
        <div className="stagger mt-9 space-y-3.5">
          <Eyebrow>What you found</Eyebrow>
          {resolution.revealed.map((e) => (
            <div key={e.id} className="card p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-faint">{e.label}</p>
              <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink">{e.reveals}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-9">
        <Eyebrow>What is now different</Eyebrow>
        <ul className="mt-3 space-y-2.5">
          {resolution.outcome.changed.map((c, i) => (
            <li key={i} className="flex items-start gap-3 text-[15.5px] leading-relaxed text-ink-soft">
              <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="card mt-9 p-6">
        <MeterRow
          dims={resolution.dimsAfter}
          deltas={resolution.deltas}
          showDeltas
          size="lg"
        />
      </div>

      <div className="mt-9">
        <PrimaryButton onClick={onContinue}>Why did that happen?</PrimaryButton>
      </div>
    </div>
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
    <div className="anim-rise mx-auto max-w-2xl px-5 pb-24 pt-14">
      {newBadges.length > 0 && (
        <div className="mb-9 space-y-3">
          {newBadges.map((b) => (
            <BadgeChip key={b} id={b} animate />
          ))}
        </div>
      )}

      <Eyebrow>The point</Eyebrow>
      <h1 className="display mt-3 text-[30px] leading-[1.2] text-ink sm:text-[34px]">
        {lesson.principle}
      </h1>

      <p className="mt-6 text-[17px] leading-[1.68] text-ink-soft">{lesson.because}</p>

      {lesson.watchFor && (
        <div
          className="mt-8 rounded-xl border px-5 py-4"
          style={{ borderColor: "var(--color-accent-ring)", background: "var(--color-accent-tint)" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-accent-deep">
            Next time
          </p>
          <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink">{lesson.watchFor}</p>
        </div>
      )}

      <div className="mt-10">
        <PrimaryButton onClick={onContinue}>{isLast ? "See how it went" : "Continue"}</PrimaryButton>
      </div>
    </div>
  );
}
