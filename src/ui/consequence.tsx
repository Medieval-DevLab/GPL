/**
 * RECEIVE — the beat where the result is the subject.
 *
 * One screen, not two. `resolving` used to sit in front of this one: a full screen that
 * existed for a single second, seventeen times a run, occupying 17 of the run's 76 screen
 * instances purely by being in the way (`docs/SCREEN-TAXONOMY.md` §3, "the type to cut").
 * It is now this screen's ENTRANCE — the consequence mounts and the three meters travel
 * from `dimsBefore` to `dimsAfter` as part of its arrival.
 *
 * **The guarantee that made `resolving` exist is kept.** A meter only travels if the same
 * DOM node holds both values, so the right-hand rail must stay mounted from the decision
 * beat through to the result — `App.tsx` does that, and it is why the rail's bars and this
 * screen's band move as one event in two places rather than as two events. The band in the
 * centre is new on this beat and so cannot inherit a previous value from the DOM; it paints
 * `from` for exactly one frame and then sets the target, which is what gives the CSS
 * transition something to interpolate. See `useFirstFrame` below.
 *
 * ── the mode grammar (`docs/SCREEN-SPECS.md` §3) ───────────────────────────────────────
 *
 * This is the RECEIVE screen, and three things separate it from the READ screen it used to
 * be mistaken for — none of them a hue:
 *
 *  1. **No situation photograph.** The consequence was rendering `mission.hero`, which is
 *     the SAME image file the brief renders, in the same place, at a similar size. The
 *     result screen was showing a picture of the situation as though it were a picture of
 *     the outcome, and it was the single biggest reason the two read as one screen in a
 *     thumbnail. The prop is still accepted, because `App.tsx` owns the call site.
 *  2. **The result band.** Three figures at the 56px display step, flush, full width and
 *     divided by 1px rules — the only place in the run where a numeral is bigger than a
 *     heading. The meters are the story on this beat, so they are drawn at the size of the
 *     story rather than as rail furniture.
 *  3. **The verdict on the player's own call** sits between the two, full width. It is the
 *     answer to the question the gate made them ask, so it is the hinge of the screen.
 *
 * Badges do not appear here. Recognition mid-run is a narrator patting the player on the
 * head; the same information in the closing debrief is an account of how they played.
 */

import { useEffect, useState } from "react";

import {
  DIMENSIONS,
  DIMENSION_META,
  type Advisor,
  type DimensionId,
  type OutcomeTone,
  type Resolution,
} from "../engine/types";
import { Bullet, Icon, SectionTitle } from "./icons";
import {
  BEAT_TITLE_ID,
  Hidden,
  UI_LABEL,
  artUrl,
  meterDelay,
  quoted,
  useCountUp,
  useReducedMotion,
} from "./shell";

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

/* ───────────────────── the call the player made ───────────────────── */

/**
 * The verdict on the player's call, as one sentence.
 *
 * Lifted out of the component because it is now said in two places — on screen, and in
 * the live region that speaks the resolution. Two copies of this sentence would drift,
 * and the one that drifted would be the one nobody can see.
 */
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

/* ───────────────────────── the result band ───────────────────────── */

/** 0–100, because a meter drawn outside its track is a rendering bug, not a value. */
const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * True from the frame after mount.
 *
 * A CSS transition needs two computed values to interpolate between, and an element that
 * mounts already showing its final value has only one. The rail's meters survive the
 * commit — `App.tsx` keeps them mounted — so they simply transition when the prop changes.
 * The band in the centre does not exist until this screen arrives, so it has to paint the
 * old value for exactly one frame and then set the new one. One extra render per beat, and
 * it is the whole reason the centre and the rail move together instead of one of them
 * jumping.
 *
 * A local copy of `useSettled`, which `ui/shell.tsx` keeps private. Four lines, and this
 * worker does not own that file; if it is ever exported this should use it.
 */
function useFirstFrame(): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setPast(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return past;
}

/**
 * One dimension, as the result screen draws it: a 56px figure, its movement, and the bar
 * arriving underneath.
 *
 * The figure is `aria-hidden` and the truth lives on the `role="meter"` below it, for the
 * same reason `ui/shell.tsx` gives: a counting number and an authoritative one in the
 * accessibility tree at once are two numbers for one quantity that disagree for 900ms.
 */
function ResultCell({
  dim,
  value,
  from,
  delta,
  index,
}: {
  dim: DimensionId;
  value: number;
  /** where this meter is travelling FROM, on the beat where it is arriving */
  from?: number;
  delta: number;
  index: number;
}) {
  const meta = DIMENSION_META[dim];
  const ink = `var(${meta.textVar})`;
  const delay = meterDelay(index);
  const shownNumber = useCountUp(value, from, delay);
  const painted = useFirstFrame();
  const reduced = useReducedMotion();
  const bar = painted ? value : (from ?? value);

  return (
    <div className="bg-(--color-surface) px-5 py-4">
      <div className="flex items-center gap-2" style={{ color: ink }}>
        <Icon name={meta.icon} size={16} />
        <span className="text-[13px] font-bold">{meta.label}</span>
      </div>

      <div className="mt-1.5 flex items-baseline gap-2.5">
        {/* 56px, the display step, and the only place in a mission where a numeral
            outranks the heading above it. That is the whole of "the meters are the story
            on this screen and furniture on every other one" — and it is what makes the
            result screen legible as a result at thumbnail size, with the text unreadable. */}
        <span
          aria-hidden="true"
          className="numeral text-[56px]"
          style={{ color: ink }}
        >
          {shownNumber}
        </span>
        {delta !== 0 && (
          /* A gain lands with a slight overshoot; a loss simply appears. That asymmetry is
             argued in `motion.css` and it is not a stylistic preference — feedback that
             celebrates a loss is measurably remembered as a win (Dixon et al., 2010). */
          <span
            className={`${delta > 0 ? "m-land" : "m-arrive"} rounded-full px-2 py-0.5 text-[13px] font-bold tabular-nums`}
            style={{
              animationDelay: `${delay}ms`,
              color: delta > 0 ? "var(--color-good)" : "var(--color-bad)",
              background: delta > 0 ? "var(--color-good-tint)" : "var(--color-bad-tint)",
            }}
          >
            <span aria-hidden="true">
              {delta > 0 ? "▲ +" : "▼ "}
              {Math.abs(delta)}
            </span>
            {/* The glyph carries direction to the eye and nothing at all to a screen
                reader, which reads "▲" as either a triangle or as silence. */}
            <Hidden>
              {delta > 0 ? UI_LABEL.movedUp : UI_LABEL.movedDown} {Math.abs(delta)}.
            </Hidden>
          </span>
        )}
      </div>

      <div
        className="mt-2.5 h-2 w-full overflow-hidden rounded-full"
        style={{ background: `var(--color-${dim}-tint)` }}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${meta.label}: ${value} ${UI_LABEL.outOf} 100`}
      >
        {/**
         * `transform` when it moves, `width` when it does not — and the second half of
         * that is a bug fix, not an optimisation.
         *
         * A travelling bar must be a `transform`: a width transition runs layout on every
         * frame of a 900ms animation, and of width, height, margin and padding Linear's
         * engineering write-up says "never animate those. I mean never." So the animated
         * path is `scaleX` from a left origin, composited, with `.m-settle` carrying the
         * curve.
         *
         * But `index.css` collapses reduced motion with `transform: none !important` on
         * `*`, and an inline style cannot outrank `!important` — so under `reduce` a
         * `scaleX` bar renders at its UNSCALED width, which is 100%. **Every meter in the
         * game currently reads full under reduced motion**, because the rail, the chapter
         * stepper and the reward level bar are all built this way
         * (`MeterTrack` and `ChapterStepper` in `ui/shell.tsx`, and `ui/reward.tsx`). That
         * is a player who asked for less movement being shown the wrong number, which is
         * worse than the animation was.
         *
         * Under `reduce` there is nothing to animate, so `width` costs nothing and is
         * correct. Fixed here because this file is owned; the other three need the same
         * two lines and are written up rather than reached into.
         */}
        <div
          className={`h-full rounded-full ${reduced ? "" : "m-settle w-full"}`}
          style={
            reduced
              ? { width: `${clamp(value)}%`, background: `var(${meta.fillVar})` }
              : {
                  transform: `scaleX(${clamp(bar) / 100})`,
                  transitionDelay: `${delay}ms`,
                  background: `var(${meta.fillVar})`,
                }
          }
        />
      </div>

      <p className="mt-2 text-[13px] text-(--color-muted)">{meta.question}</p>
    </div>
  );
}

/**
 * The three of them, flush and full width, divided by 1px rules.
 *
 * `gap-px` over a line-coloured ground rather than three bordered cards with gaps between
 * them: the mockups' own construction, and the difference between a console and a card kit.
 */
function ResultBand({
  dims,
  from,
  deltas,
}: {
  dims: Record<DimensionId, number>;
  from?: Record<DimensionId, number>;
  deltas: Record<DimensionId, number>;
}) {
  return (
    <section
      data-region="result"
      aria-label={UI_LABEL.whatItMoved}
      className="grid gap-px border-y border-(--color-line) sm:grid-cols-3"
      style={{ background: "var(--color-line)" }}
    >
      {DIMENSIONS.map((d, i) => (
        <ResultCell
          key={d}
          dim={d}
          value={dims[d]}
          from={from?.[d]}
          delta={deltas[d]}
          index={i}
        />
      ))}
    </section>
  );
}

/* ───────────────────── the verdict on your call ───────────────────── */

/**
 * The hinge of the screen: the answer to the question the gate made the player ask.
 *
 * Full width and flush under the band it is about, rather than a floating pill above it.
 * The landing is on the icon and only when the call was right — a wrong call is not a
 * thing to give a satisfying little bounce to.
 */
/* ───────────────────── the colleague's read ───────────────────── */

/**
 * Where the teaching lives.
 *
 * There used to be a screen for it: the lesson in 26px bold under the caption "Next time",
 * sixteen of them, with no speaker and nothing to disagree with. That screen was where the
 * feeling of being lectured at actually lived. Same words, out of the mouth of the
 * colleague who briefed you, about something that just happened — which is a briefing
 * rather than a moral assigned to you. See docs/ENGAGEMENT-MODEL.md.
 */
function TheRead({ advisor, resolution }: { advisor?: Advisor; resolution: Resolution }) {
  const { lesson } = resolution;
  if (!advisor) return null;

  return (
    <section
      data-region="read"
      /**
       * `min-w-[340px]` below `lg` is what makes this pair STACK in the tablet band, and
       * it is a legibility fix that happens to give height back.
       *
       * Side by side in a 560px centre these are two 280px columns, and this one spends
       * 62px of its own on a portrait and a gap — so the colleague's read, which is the
       * only part of a consequence that teaches anything, was being set at a 178px
       * measure. That is ~22 characters: less than half Bringhurst's floor, and it made
       * the panel 479px tall. Stacked, the same words have 418px and the pair comes out
       * ~110px SHORTER than it was in two columns. 340 + the sibling's 280 does not fit
       * in 560, which is how the wrap is expressed without a second layout.
       */
      className="flex min-w-[340px] flex-1 items-start gap-3.5 border-b border-(--color-line) px-5 py-4 lg:min-w-0 lg:border-b-0 lg:border-r"
      style={{ background: "var(--color-accent-tint)" }}
    >
      {advisor.photo ? (
        <img
          src={artUrl(advisor.photo)}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-[48px] w-[48px] shrink-0 rounded-full object-cover"
        />
      ) : null}
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-(--color-ink)">
          {advisor.name}
          <span className="ml-2 font-medium text-(--color-accent)">{advisor.role}</span>
        </p>
        {/* One interpolated string each, not `“` + text + `”` as three sibling nodes.
            Those were the two orphaned closing quote marks on every consequence screen
            in the game — see `quoted` in `ui/shell.tsx`. */}
        <p className="mt-1.5 text-[15px] font-semibold leading-snug text-(--color-ink) text-pretty">
          {quoted(lesson.principle)}
        </p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-(--color-ink-soft) text-pretty">
          {quoted(lesson.because)}
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────── consequence ─────────────────────────── */

export function ConsequenceScreen({
  resolution,
  advisor,
  from,
}: {
  resolution: Resolution;
  advisor?: Advisor;
  /**
   * Still accepted, deliberately unused.
   *
   * `App.tsx` passes the mission's hero photograph and owns that call site. This screen
   * does not render it any more — see the note at the top of the file: it is the same
   * file the brief renders, in the same place, which is most of why READ and RECEIVE
   * were indistinguishable at a glance.
   */
  hero?: string;
  /**
   * Where the three meters are travelling FROM, and the whole of what `resolving` used
   * to be.
   *
   * Present when this screen IS the arrival of the commit: the band paints these values
   * for one frame, then travels to `resolution.dimsAfter` on the 0 / 80 / 160ms stagger
   * and the 900ms slow-in-slow-out curve the rail uses, so the centre and the rail are
   * one event in two places. Omit it and the screen renders settled, which is what a
   * revisit or a resumed save should do.
   *
   * It is a prop rather than being read off `resolution.dimsBefore` on purpose: only the
   * caller knows whether this mount is the arrival. Reading it here would re-run the
   * whole travel on any re-render that remounted the screen.
   */
  from?: Record<DimensionId, number>;
}) {
  const tone = TONE[resolution.outcome.tone];

  return (
    <div className="flex min-h-full flex-col">
      {/**
       * The header, and it is NOT the brief's header.
       *
       * No photograph, a 60px tone medallion, and the outcome at the 32px step. `m-swap`,
       * not a rise: this band occupies the same place as the band that was here a moment
       * ago, and translating it would claim a move that did not happen.
       */}
      <div className="m-swap bg-(--color-surface) px-5 pb-4 pt-5">
        <div className="flex items-start gap-4">
          {/* The one object in the header allowed to land. It is the verdict on the
              decision and it is the first thing the eye goes to. */}
          <span
            aria-hidden="true"
            className="m-land flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: tone.colour }}
          >
            <Icon name={tone.icon} size={30} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-(--color-muted)">
              {UI_LABEL.youChose}{" "}
              <span className="font-bold text-(--color-ink-soft)">{resolution.chosenLabel}</span>
            </p>
            {/* 26px below `lg`, and it is the scale following the measure rather than a
                shave. The 32px step is authored against the 848px column the console
                gives this headline at 1440; in the tablet band the same headline has
                428px, where `DESIGN-SYSTEM.md` puts the display step at 26. A three-line
                32px headline at 428px is the wrong size being used, not the right size
                being cut. */}
            <h1
              id={BEAT_TITLE_ID}
              className="mt-1 max-w-[30ch] text-[24px] font-bold leading-[1.1] tracking-[-0.015em] text-(--color-ink) text-pretty lg:text-[32px]"
            >
              {resolution.outcome.headline}
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-[92ch] text-[15px] leading-[1.55] text-(--color-ink-soft)">
          {resolution.outcome.detail}
        </p>
      </div>

      {/* The subject of the screen. Flush against the header and against the verdict
          below it, because a result is not a card floating on a page. */}
      <ResultBand
        dims={resolution.dimsAfter}
        from={from}
        deltas={resolution.deltas}
      />

      {/**
       * What it changed, and what a colleague makes of it — side by side, flush, divided
       * by a 1px rule, on the tinted ground.
       *
       * They used to be two of five full-width cards stacked down a 739px column, which
       * left ~200px of empty desk under the last one on most paths and pushed the
       * colleague's read — the only part of a consequence that teaches anything — off the
       * bottom on the densest ones. Two columns is also the second structural difference
       * from the brief, which is one column of prose.
       *
       * `m-seq` is kept and is now two children rather than five: the meters travelling
       * ARE the entrance, so a five-step cascade behind them would be a second arrival
       * competing with the first.
       *
       * The surplus height goes BELOW this pair, onto the desk, rather than being
       * distributed into the screen. Two other arrangements were built and looked at
       * first, and both were worse: giving the slack to the read panel put a 350px field
       * of lavender under 140px of type, and giving it to the result band left the three
       * figures floating in the middle of a white void that grew to 500px at 1440x1024.
       * A document that ends, with desk under it, is the one that reads as finished.
       */}
      <div className="m-seq flex flex-wrap items-stretch border-b border-(--color-line)">
        <TheRead advisor={advisor} resolution={resolution} />

        <section
          data-region="changed"
          className="min-w-[280px] flex-1 bg-(--color-surface) px-5 py-4"
        >
          <SectionTitle icon="spark" className="mb-2.5">
            {UI_LABEL.nowDifferent}
          </SectionTitle>
          <ul className="space-y-1.5">
            {resolution.outcome.changed.map((c, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-[13px] leading-relaxed text-(--color-ink-soft)"
              >
                {/* A 3px ink square, not `layers`. This was Deliverability's pictogram
                    used as a list marker, on a screen that also shows the Deliverability
                    meter — one of the four meanings that drawing had accumulated. A
                    bullet has nothing to mean. */}
                <Bullet className="mt-[8px]" />
                {c}
              </li>
            ))}
          </ul>

          {/**
           * The evidence, deferred rather than printed a third time.
           *
           * This block was the whole of the investigate consequence's overflow: it
           * reprinted the FULL reveal text of every card the player opened — paragraphs
           * they had already read once when they opened them, and which are permanently
           * in "Your file" in the left rail for the rest of the run. What it pushed off
           * the bottom was the colleague's read.
           *
           * The labels stay visible so the player can see WHAT they found without
           * re-reading it, which is the part with recall value.
           */}
          {resolution.revealed.length > 0 && (
            <details className="mt-3 border-t border-(--color-line) pt-2.5">
              <summary className="flex min-h-[24px] cursor-pointer list-none flex-wrap items-center gap-x-2 text-[13px]">
                <SectionTitle icon="search">{UI_LABEL.foundOut}</SectionTitle>
                <span className="text-(--color-ink-soft)">
                  {resolution.revealed.map((e) => e.label).join(" · ")}
                </span>
                <span className="text-(--color-accent)">{UI_LABEL.show}</span>
              </summary>
              <div className="mt-2 space-y-2.5">
                {resolution.revealed.map((e) => (
                  <div key={e.id}>
                    <p className="text-[13px] font-bold text-(--color-ink)">{e.label}</p>
                    <p className="text-[13px] leading-relaxed text-(--color-ink-soft)">
                      {e.reveals}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>
      </div>
    </div>
  );
}

/* ─────────────────────────── resolving ─────────────────────────── */

/**
 * DEPRECATED, and kept only until `App.tsx` stops routing to it.
 *
 * This is the screen `docs/SCREEN-TAXONOMY.md` §3 names as the one type to cut: a
 * one-second transition holding 17 of a run's 76 screen instances, earning its slot purely
 * by being in the way. Everything it did now happens as `ConsequenceScreen`'s entrance —
 * pass that screen `from` and the same three meters travel on the same stagger and the
 * same curve, on a screen that also has something to say.
 *
 * It is still exported because `App.tsx` is owned by another worker and removing the
 * export would break their file mid-change. Delete it, and this comment, the day the
 * `resolving` phase leaves the flow.
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
            unnamed region — "main", and nothing else, while the player waits. */}
        <p
          id={BEAT_TITLE_ID}
          className="m-swap mb-7 text-center text-[13px] font-medium text-(--color-muted)"
        >
          Seeing what happens…
        </p>
        {resolution && (
          <ResultBand
            dims={resolution.dimsAfter}
            from={resolution.dimsBefore}
            deltas={resolution.deltas}
          />
        )}
      </div>
    </div>
  );
}
