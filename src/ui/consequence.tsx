/**
 * The two beats after a decision.
 *
 *   resolving   — a short pause so the commit lands as an event, not a page swap
 *   consequence — your call, what happened, what changed, and a colleague's read on it
 *
 * There used to be a third: a full screen carrying the lesson in 26px bold under the
 * caption "Next time." Sixteen of them, one after every decision, with no speaker and
 * nothing to disagree with. That screen was where the feeling of being lectured at
 * actually lived, so the phase is gone and its words now come out of the mouth of the
 * colleague who briefed you — which makes the teaching a read on what just happened
 * rather than a moral assigned to you. See docs/ENGAGEMENT-MODEL.md.
 *
 * Badges also do not appear here. Recognition mid-run is a narrator patting the player
 * on the head; the same information in the closing debrief is an account of how they
 * played.
 */

import { useEffect } from "react";

import {
  DIMENSION_META,
  type Advisor,
  type DimensionId,
  type OutcomeTone,
  type Resolution,
} from "../engine/types";
import { Icon, SectionTitle } from "./icons";
import { artUrl } from "./shell";

/**
 * Tone is carried by the medallion's colour AND its icon — never colour alone (E6).
 * There is deliberately no label: "THAT WORKED" in tracked caps above the headline is
 * the interface grading the decision before the player has read what happened.
 */
const TONE: Record<
  OutcomeTone,
  { colour: string; tint: string; icon: Parameters<typeof Icon>[0]["name"] }
> = {
  strong: { colour: "var(--color-good)", tint: "var(--color-good-tint)", icon: "check" },
  mixed: { colour: "var(--color-warn)", tint: "var(--color-warn-tint)", icon: "scale" },
  hard: { colour: "var(--color-bad)", tint: "var(--color-bad-tint)", icon: "warning" },
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
        <p className="mb-5 text-center text-[13px] font-medium text-(--color-muted)">
          Seeing what happens…
        </p>
        <div className="shimmer h-1.5 w-full overflow-hidden rounded-full bg-(--color-canvas-deep)" />
      </div>
    </div>
  );
}

/* ───────────────────── the call the player made ───────────────────── */

function YourCall({
  predicted,
  actual,
}: {
  predicted: DimensionId | null;
  actual: DimensionId | null;
}) {
  if (!predicted || !actual) return null;

  const right = predicted === actual;
  const colour = right ? "var(--color-good)" : "var(--color-warn)";
  const tint = right ? "var(--color-good-tint)" : "var(--color-warn-tint)";
  const text = right
    ? `You called it. ${DIMENSION_META[actual].label} barely moved.`
    : `You said ${DIMENSION_META[predicted].label}. It was ${DIMENSION_META[actual].label} that held.`;

  return (
    <div
      className="anim-pop flex items-center gap-2.5 rounded-xl px-4 py-2.5"
      style={{ background: tint }}
    >
      <span className="shrink-0" style={{ color: colour }}>
        <Icon name={right ? "check" : "scale"} size={16} />
      </span>
      <p className="text-[13px] font-semibold" style={{ color: colour }}>
        {text}
      </p>
    </div>
  );
}

/**
 * Three metric tiles with their movement — the mockups' result-screen shape.
 *
 * The rail carries the same three values as bars; these carry the CHANGE, which is the
 * only thing the player is looking for at this moment.
 */
function Impact({
  dims,
  deltas,
}: {
  dims: Record<DimensionId, number>;
  deltas: Record<DimensionId, number>;
}) {
  return (
    <div className="card grid gap-px overflow-hidden sm:grid-cols-3" style={{ background: "var(--color-line)" }}>
      {(Object.keys(DIMENSION_META) as DimensionId[]).map((d) => {
        const meta = DIMENSION_META[d];
        const colour = `var(${meta.varName})`;
        const delta = deltas[d];
        return (
          <div key={d} className="bg-(--color-surface) px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="shrink-0" style={{ color: colour }}>
                <Icon name={meta.icon} size={16} />
              </span>
              <span className="text-[12px] font-bold" style={{ color: colour }}>
                {meta.label}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className="text-[24px] font-bold leading-none tabular-nums"
                style={{ color: colour }}
              >
                {dims[d]}
              </span>
              {delta !== 0 && (
                <span
                  className="anim-pop rounded-full px-1.5 py-0.5 text-[12px] font-bold tabular-nums"
                  style={{
                    color: delta > 0 ? "var(--color-good)" : "var(--color-bad)",
                    background: delta > 0 ? "var(--color-good-tint)" : "var(--color-bad-tint)",
                  }}
                >
                  {delta > 0 ? "▲ +" : "▼ "}
                  {delta}
                </span>
              )}
            </div>
            <p className="mt-1 text-[12px] text-(--color-muted)">{meta.question}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────── the colleague's read ───────────────────── */

/**
 * Where the teaching lives now.
 *
 * Same words that were on the lesson screen; the difference is that a named person with
 * a job and a stake is saying them about something that just happened, which is a
 * briefing. The interface saying them to nobody in particular was a lecture.
 */
function TheRead({ advisor, resolution }: { advisor?: Advisor; resolution: Resolution }) {
  const { lesson } = resolution;
  if (!advisor) return null;

  return (
    <section
      className="rounded-[14px] border px-5 py-4"
      style={{ borderColor: "var(--color-accent-ring)", background: "var(--color-accent-tint)" }}
    >
      <div className="flex items-start gap-3.5">
        {advisor.photo ? (
          <img
            src={artUrl(advisor.photo)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-[52px] w-[52px] shrink-0 rounded-full object-cover"
          />
        ) : null}
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-(--color-ink)">
            {advisor.name}
            <span className="ml-2 font-medium text-(--color-accent)">{advisor.role}</span>
          </p>
          <p className="mt-1.5 text-[15px] font-semibold leading-snug text-(--color-ink)">
            “{lesson.principle}”
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-(--color-ink-soft)">
            “{lesson.because}”
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── consequence ─────────────────────────── */

export function ConsequenceScreen({
  resolution,
  advisor,
  hero,
}: {
  resolution: Resolution;
  advisor?: Advisor;
  hero?: string;
}) {
  const tone = TONE[resolution.outcome.tone];

  return (
    <div className="anim-fade flex min-h-full flex-col">
      {/* Header, matching the briefing's shape so the console does not change register. */}
      <div className="flex items-stretch gap-5 bg-(--color-surface)">
        <div className="min-w-0 flex-1 px-5 pt-5">
          <div className="flex items-start gap-3.5">
            <span
              aria-hidden="true"
              className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: tone.colour }}
            >
              <Icon name={tone.icon} size={25} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] text-(--color-muted)">
                You chose:{" "}
                <span className="font-bold text-(--color-ink-soft)">{resolution.chosenLabel}</span>
              </p>
              <h1 className="mt-1 text-[24px] font-bold leading-[1.12] tracking-[-0.015em] text-(--color-ink)">
                {resolution.outcome.headline}
              </h1>
            </div>
          </div>
          <p className="mt-3 text-[15px] leading-[1.55] text-(--color-ink-soft)">
            {resolution.outcome.detail}
          </p>
        </div>
        {hero && (
          <img
            src={artUrl(hero)}
            alt=""
            loading="lazy"
            decoding="async"
            className="hidden h-[172px] w-[34%] shrink-0 object-cover md:block"
            style={{
              maskImage: "linear-gradient(to right, transparent, #000 22%)",
              WebkitMaskImage: "linear-gradient(to right, transparent, #000 22%)",
            }}
          />
        )}
      </div>

      <div className="flex-1 space-y-4 px-5 py-4">
        <YourCall predicted={resolution.predicted} actual={resolution.actualLeastMoved} />

        <Impact dims={resolution.dimsAfter} deltas={resolution.deltas} />

        {resolution.revealed.length > 0 && (
          <div className="card overflow-hidden">
            {resolution.revealed.map((e) => (
              <div key={e.id} className="border-b border-(--color-line) px-5 py-3 last:border-b-0">
                <SectionTitle icon="search" className="mb-1">
                  {e.label}
                </SectionTitle>
                <p className="text-[13px] leading-relaxed text-(--color-ink-soft)">{e.reveals}</p>
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
                className="flex items-start gap-2.5 text-[13px] leading-relaxed text-(--color-ink-soft)"
              >
                <span className="mt-[3px] shrink-0 text-(--color-accent)">
                  <Icon name="layers" size={13} />
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>

        <TheRead advisor={advisor} resolution={resolution} />
      </div>
    </div>
  );
}
