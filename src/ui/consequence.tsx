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
  DIMENSIONS,
  DIMENSION_META,
  type Advisor,
  type DimensionId,
  type OutcomeTone,
  type Resolution,
} from "../engine/types";
import { Icon, SectionTitle } from "./icons";
import { BEAT_TITLE_ID, FactorGrid, UI_LABEL, artUrl, meterDelay } from "./shell";

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
  /**
   * `mixed` is deliberately NOT a hue.
   *
   * It resolved to `--color-warn` (#8e1212) against `hard`'s `--color-bad` (#a31515):
   * ΔE2000 **4.2 in normal vision and 3.1 under protanopia**, which is not a distinction
   * at all. Since `mixed` is 41 of 99 outcomes and `hard` is 21, that meant **62 of 99
   * consequence screens rendered the same alarm medallion** — the game could not
   * visually tell "you traded something" from "that went badly".
   *
   * Ink separates it from both: ΔE 19.3 from `strong` and far more from `hard`, while
   * staying inside the rule that valence is not a hue. A trade-off is a fact, which is
   * ink; only a genuine reverse gets the alarm colour.
   */
  mixed: { colour: "var(--color-text-muted)", tint: "var(--color-panel)", icon: "scale" },
  hard: { colour: "var(--color-bad)", tint: "var(--color-bad-tint)", icon: "warning" },
};

/* ─────────────────────────── resolving ─────────────────────────── */

/**
 * The beat that used to be a lie.
 *
 * It was one second of `gpl-fade` plus a 1,150ms **skeleton shimmer** — a white gradient
 * sweeping a grey bar, which is the visual idiom of a pending network request, on the one
 * beat of a deterministic offline game where the answer is already computed and sitting in
 * `state.resolution`. A visual reviewer located the "feels like a form" complaint exactly
 * here: *"the one moment of consequence is rendered in the idiom of a pending XHR."*
 *
 * It is now the three meters moving. Same second, and the player spends it watching the
 * thing their decision actually did — which is the only quantitative feedback in the game
 * and was previously delivered as a number that had silently become a different number
 * while a fake progress bar held their attention somewhere else.
 *
 * Two consequences of doing it here rather than on the next screen, both deliberate:
 *
 *  · The meters in the right-hand rail move at the same moment, on the same stagger and
 *    the same curve, because `App` now keeps the rails mounted through this beat. The
 *    player sees one event in two places rather than two events.
 *  · By the time the second is up, every number has arrived. easeInOutCubic is 99.97%
 *    complete at 93% of its duration, so the last of the three — delayed 160ms into a
 *    900ms travel — has visually settled at 1,000ms. The consequence screen therefore
 *    opens showing exactly the numbers the player just watched land, rather than catching
 *    them mid-flight.
 *
 * The 1,000ms is unchanged, and the labour-illusion literature is why that is defensible
 * now when it was not before: a pause earns its keep only if it shows work rather than
 * waiting. A second of fake latency is above the Doherty threshold and buys nothing. A
 * second of watching a value travel is the transition Heer & Robertson measured at "around
 * one second" for statistical data graphics.
 */
export function ResolvingScreen({
  resolution,
  onDone,
}: {
  resolution: Resolution | null;
  onDone: () => void;
}) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(onDone, reduced ? 120 : 1000);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-5 py-6">
      <div className="w-full max-w-2xl">
        {/* Carries the beat-title id even though it is not a heading: the work area takes
            focus on every phase change, and for this one second it would otherwise be an
            unnamed region — "main", and nothing else, while the player waits.

            Not animated beyond a short fade. Under `reduce` this beat is 120ms long, so
            anything whose meaning lived in this line's entrance would be unreadable. */}
        <p
          id={BEAT_TITLE_ID}
          className="m-swap mb-7 text-center text-[13px] font-medium text-(--color-muted)"
        >
          Seeing what happens…
        </p>
        {resolution && (
          <FactorGrid
            dims={resolution.dimsAfter}
            from={resolution.dimsBefore}
            deltas={resolution.deltas}
            showDeltas
          />
        )}
      </div>
    </div>
  );
}

/* ───────────────────── the call the player made ───────────────────── */

/**
 * The verdict on the player's call, as one sentence.
 *
 * Lifted out of the component because it is now said in two places — on screen, and in
 * the live region that speaks the resolution. Two copies of this sentence would drift,
 * and the one that drifted would be the one nobody can see.
 */
export function predictionVerdict(resolution: Resolution): string | null {
  const { predicted, actualLeastMoved: actual, predictionCorrect: correct, nothingMoved } = resolution;
  if (!predicted || !actual || correct === null) return null;
  // With nothing to separate the three, naming a winner would be inventing one.
  if (nothingMoved) return "Nothing moved. This one cost you nothing and bought you nothing.";
  return correct
    ? `You called it. ${DIMENSION_META[actual].label} barely moved.`
    : `You said ${DIMENSION_META[predicted].label}. It was ${DIMENSION_META[actual].label} that held.`;
}

/**
 * Everything the resolution beat says, as one string for the live region.
 *
 * The screen shows an outcome headline, three meters that animate to new values, and a
 * verdict on the prediction. None of it was announced: `role="meter"` does not report
 * `aria-valuenow` changes, and the verdict was a paragraph that appeared in place. So a
 * blind player committed, waited, and was told nothing — sixteen times.
 *
 * Only the dimensions that actually moved are named, because reading "Profitability 52,
 * no change" three times a beat, 31 beats a run, is how a live region gets switched off.
 */
export function resolutionAnnouncement(resolution: Resolution): string {
  const parts = [sentence(resolution.outcome.headline)];
  for (const d of DIMENSIONS) {
    const delta = resolution.deltas[d];
    if (delta === 0) continue;
    const sign = delta > 0 ? "+" : "";
    parts.push(
      `${DIMENSION_META[d].label} ${sign}${delta}, ${resolution.dimsAfter[d]} ${UI_LABEL.outOf} 100.`,
    );
  }
  const verdict = predictionVerdict(resolution);
  if (verdict) parts.push(sentence(verdict));
  return parts.join(" ");
}

/**
 * Terminal punctuation, so a run of announced facts is a run of sentences.
 *
 * Content is not guaranteed to end a headline with a full stop, and without one a
 * screen reader runs the headline straight into the first number with no pause.
 */
function sentence(s: string): string {
  return /[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`;
}

function YourCall({ resolution }: { resolution: Resolution }) {
  const text = predictionVerdict(resolution);
  if (!text) return null;

  const right = resolution.predictionCorrect === true;
  const colour = right ? "var(--color-good)" : "var(--color-warn)";
  const tint = right ? "var(--color-good-tint)" : "var(--color-warn-tint)";

  return (
    /* The strip itself rides the reveal sequence — it is the first thing in it, because
       it answers the question the PLAYER asked rather than telling them something. The
       landing is on the icon instead, and only when the call was right: a wrong call is
       not a thing to give a satisfying little bounce to. See `m-arrive` in motion.css. */
    <div className="flex items-center gap-2.5 rounded-xl px-4 py-2.5" style={{ background: tint }}>
      <span className={`${right ? "m-land" : "m-arrive"} shrink-0`} style={{ color: colour }}>
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
      {(Object.keys(DIMENSION_META) as DimensionId[]).map((d, i) => {
        const meta = DIMENSION_META[d];
        const colour = `var(${meta.textVar})`;
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
                /* The number beside this one does NOT count here — the player watched it
                   count, one beat ago, and re-running it would make the restatement look
                   like a second event. What repeats is the RHYTHM: the three chips arrive
                   on the same 0 / 80 / 160ms stagger the meters just moved on, so the two
                   beats read as one consequence rather than as a result and a summary. */
                <span
                  className={`${delta > 0 ? "m-land" : "m-arrive"} rounded-full px-1.5 py-0.5 text-[12px] font-bold tabular-nums`}
                  style={{
                    animationDelay: `${meterDelay(i)}ms`,
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
    <div className="flex min-h-full flex-col">
      {/* Header, matching the briefing's shape so the console does not change register.
          `m-swap`, not a rise: this band occupies the same place as the band that was
          here a moment ago, and translating it would claim a move that did not happen. */}
      <div className="m-swap flex items-stretch gap-5 bg-(--color-surface)">
        <div className="min-w-0 flex-1 px-5 pt-5">
          <div className="flex items-start gap-3.5">
            {/* The one object on this screen that is allowed to land. It is the verdict
                on the decision, and it is the first thing the eye goes to. */}
            <span
              aria-hidden="true"
              className="m-land flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: tone.colour }}
            >
              <Icon name={tone.icon} size={25} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] text-(--color-muted)">
                You chose:{" "}
                <span className="font-bold text-(--color-ink-soft)">{resolution.chosenLabel}</span>
              </p>
              <h1
                id={BEAT_TITLE_ID}
                className="mt-1 text-[24px] font-bold leading-[1.12] tracking-[-0.015em] text-(--color-ink)"
              >
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

      {/**
       * The reveal, and the only sequenced entrance in the game.
       *
       * Its order is the argument the beat is making: whether you called it → what it
       * cost → what you found out → what is now different → what a colleague makes of it.
       * 70ms apart and a 6px rise, so it reads as one cascade settling rather than five
       * separate animations, and it is over in 540ms. Nothing waits for it: the primary
       * action is in the action bar, which is outside this element and never animates, so
       * a player who wants the next mission can have it immediately.
       *
       * `m-seq` indexes on `:nth-child`, and every section below is conditional — which
       * is fine and is worth stating, because a falsy branch in JSX renders no node at
       * all, so the stagger stays contiguous rather than leaving a gap where a mission
       * with no revealed evidence would have been.
       */}
      <div className="m-seq flex-1 space-y-4 px-5 py-4">
        <YourCall resolution={resolution} />

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
