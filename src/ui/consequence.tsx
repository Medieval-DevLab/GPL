/**
 * The three beats after a decision.
 *
 *   resolving   — a short pause so the commit lands as an event, not a page swap
 *   consequence — your call, then what actually happened, then what changed
 *   lesson      — the transferable rule, after the experience
 *
 * The consequence now OPENS with the prediction the player made. That is the whole
 * de-condescension fix: the screen is answering a question they asked rather than
 * telling them what they just felt. See docs/ENGAGEMENT-MODEL.md.
 *
 * Badges deliberately do not appear here. Recognition mid-run is a narrator patting the
 * player on the head; the same information in the closing debrief reads as an account of
 * how they played.
 */

import { useEffect } from "react";

import { DIMENSION_META, type DimensionId, type OutcomeTone, type Resolution } from "../engine/types";
import { Icon, SectionTitle } from "./icons";

const TONE: Record<
  OutcomeTone,
  { label: string; colour: string; tint: string; icon: Parameters<typeof Icon>[0]["name"] }
> = {
  strong: {
    label: "That worked",
    colour: "var(--color-good)",
    tint: "var(--color-good-tint)",
    icon: "check",
  },
  mixed: {
    label: "Mixed result",
    colour: "var(--color-warn)",
    tint: "var(--color-warn-tint)",
    icon: "scale",
  },
  hard: {
    label: "That hurt",
    colour: "var(--color-bad)",
    tint: "var(--color-bad-tint)",
    icon: "warning",
  },
};

/* ─────────────────────────── resolving ─────────────────────────── */

export function ResolvingScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(onDone, reduced ? 120 : 1000);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-5">
      <div className="anim-fade w-full max-w-sm">
        <p className="mb-5 text-center text-[14px] font-medium text-(--color-muted)">
          Seeing what happens…
        </p>
        <div className="shimmer h-1.5 w-full overflow-hidden rounded-full bg-(--color-canvas-deep)" />
      </div>
    </div>
  );
}

/* ───────────────────── the call the player made ───────────────────── */

function dimName(d: DimensionId): string {
  return DIMENSION_META[d].label;
}

function YourCall({ predicted, actual }: { predicted: DimensionId | null; actual: DimensionId | null }) {
  if (!predicted) return null;

  const right = predicted === actual;
  const nothingGave = actual === null;

  const verdict = nothingGave
    ? { text: "Nothing went backwards. That is rarer than it should be.", tone: "good" as const }
    : right
      ? { text: `You called it. ${dimName(actual)} took the hit.`, tone: "good" as const }
      : {
          text: `You said ${dimName(predicted)}. It was ${dimName(actual)}.`,
          tone: "warn" as const,
        };

  const colour = verdict.tone === "good" ? "var(--color-good)" : "var(--color-warn)";
  const tint = verdict.tone === "good" ? "var(--color-good-tint)" : "var(--color-warn-tint)";

  return (
    <div className="anim-pop my-4 flex items-center gap-2.5 rounded-xl px-4 py-2.5" style={{ background: tint }}>
      <span className="shrink-0" style={{ color: colour }}>
        <Icon name={verdict.tone === "good" ? "check" : "scale"} size={16} />
      </span>
      <p className="text-[13.5px] font-semibold" style={{ color: colour }}>
        {verdict.text}
      </p>
    </div>
  );
}

/**
 * The three factors stacked, each with its delta — the shape that fits a side panel.
 * `FactorGrid` is the three-across version used on the ending screen.
 */
function FactorStack({
  dims,
  deltas,
}: {
  dims: Record<DimensionId, number>;
  deltas: Record<DimensionId, number>;
}) {
  return (
    <div className="space-y-3.5">
      {(Object.keys(DIMENSION_META) as DimensionId[]).map((d) => {
        const meta = DIMENSION_META[d];
        const colour = `var(${meta.varName})`;
        const delta = deltas[d];
        return (
          <div key={d}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-bold" style={{ color: colour }}>
                {meta.label}
              </span>
              <span className="flex items-baseline gap-2">
                {delta !== 0 && (
                  <span
                    className="anim-pop rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
                    style={{
                      color: delta > 0 ? "var(--color-good)" : "var(--color-bad)",
                      background: delta > 0 ? "var(--color-good-tint)" : "var(--color-bad-tint)",
                    }}
                  >
                    {delta > 0 ? "▲ +" : "▼ "}
                    {delta}
                  </span>
                )}
                <span
                  className="text-[19px] font-bold leading-none tabular-nums"
                  style={{ color: colour }}
                >
                  {dims[d]}
                </span>
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ background: "var(--color-canvas-deep)" }}
              role="meter"
              aria-valuenow={dims[d]}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${meta.label}: ${dims[d]} out of 100`}
            >
              <div
                className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
                style={{ width: `${dims[d]}%`, background: colour }}
              />
            </div>
            <p className="mt-1 text-[11.5px] text-(--color-muted)">{meta.question}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── consequence ─────────────────────────── */

export function ConsequenceScreen({ resolution }: { resolution: Resolution }) {
  const tone = TONE[resolution.outcome.tone];

  return (
    // Centred vertically: a short outcome should sit in the middle of the console rather
    // than stranded at the top with half a screen of empty desk beneath it.
    <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-center px-5 py-5">
      {/* The outcome banner: a large tone medallion beside the headline, on a tinted
          panel. The mockups give the result real scale — ours used to be a paragraph. */}
      <section
        className="anim-fade flex items-start gap-4 rounded-[14px] border px-5 py-4"
        style={{ background: tone.tint, borderColor: "var(--color-line)" }}
      >
        <span
          aria-hidden="true"
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: tone.colour }}
        >
          <Icon name={tone.icon} size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: tone.colour }}
            >
              {tone.label}
            </span>
            <span className="text-[12.5px] text-(--color-ink-soft)">
              <span className="text-(--color-muted)">You chose: </span>
              <span className="font-semibold">{resolution.chosenLabel}</span>
            </span>
          </div>
          <h1 className="mt-1.5 text-[24px] font-bold leading-[1.15] tracking-[-0.015em] text-(--color-ink)">
            {resolution.outcome.headline}
          </h1>
          <p className="mt-2 text-[14.5px] leading-[1.6] text-(--color-ink-soft)">
            {resolution.outcome.detail}
          </p>
        </div>
      </section>

      <YourCall predicted={resolution.predicted} actual={resolution.actualWorst} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {resolution.revealed.length > 0 && (
            <div className="card overflow-hidden">
              {resolution.revealed.map((e) => (
                <div key={e.id} className="border-b border-(--color-line) px-5 py-3 last:border-b-0">
                  <SectionTitle icon="search" className="mb-1">
                    {e.label}
                  </SectionTitle>
                  <p className="text-[13.5px] leading-relaxed text-(--color-ink-soft)">
                    {e.reveals}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="card px-5 py-4">
            <SectionTitle icon="spark" className="mb-2.5">
              What is now different
            </SectionTitle>
            <ul className="space-y-1.5">
              {resolution.outcome.changed.map((c, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-[14px] leading-relaxed text-(--color-ink-soft)"
                >
                  <span
                    aria-hidden="true"
                    className="mt-px shrink-0 font-bold text-(--color-accent)"
                  >
                    →
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card px-5 py-4">
          <SectionTitle icon="chart" className="mb-3">
            Impact of your decision
          </SectionTitle>
          <FactorStack dims={resolution.dimsAfter} deltas={resolution.deltas} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── lesson ─────────────────────────── */

export function LessonScreen({ resolution }: { resolution: Resolution }) {
  const { lesson } = resolution;

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-5 py-8">
      <div className="anim-fade">
        <h1 className="text-[26px] font-bold leading-[1.2] tracking-[-0.015em] text-(--color-ink)">
          {lesson.principle}
        </h1>
        <p className="mt-4 text-[16px] leading-[1.65] text-(--color-ink-soft)">{lesson.because}</p>

        {lesson.watchFor && (
          <div
            className="mt-6 flex gap-3 rounded-xl px-4 py-3.5"
            style={{ background: "var(--color-accent-tint)" }}
          >
            <span className="mt-0.5 shrink-0 text-(--color-accent)">
              <Icon name="target" size={17} />
            </span>
            <p className="text-[14.5px] leading-relaxed text-(--color-ink)">
              <span className="font-bold text-(--color-accent-deep)">Next time. </span>
              {lesson.watchFor}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
