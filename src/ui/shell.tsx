/**
 * The console.
 *
 * GPL is an operations console, not a scrolling document. Top bar, chapter stepper,
 * left rail, working area, right rail and action bar are all visible at once, and a
 * mission is meant to fit without scrolling. That single property is what separates
 * "a game you look across" from "a form you go down" — see docs/UI-AUDIT.md F1.
 *
 * The working area is the only scrollable region, so if a mission does overflow, the
 * chrome stays put rather than the page sliding away. `tools/verify.mjs` fails the build
 * if it overflows at desktop width, which keeps the fits-one-screen rule mechanical
 * rather than aspirational.
 */

import { useEffect, useRef, useState } from "react";

import {
  BADGE_META,
  DIMENSIONS,
  DIMENSION_META,
  type Advisor,
  type BadgeId,
  type Chapter,
  type Content,
  type DimensionId,
  type IconId,
} from "../engine/types";
import type { LedgerEntry } from "../engine/engine";
import { Icon, IconTile, SectionTitle, type Tone } from "./icons";

export const artUrl = (name: string) => `${import.meta.env.BASE_URL}art/${name}.webp`;

/* ───────────────────────── interface labels ─────────────────────────
   Hard-coded strings, collected in one place on purpose.

   `CLAUDE.md` puts player-facing prose in `src/content/story.ts`. None of these is
   story: they are interface state and non-colour redundancy for information the
   screen carries as an icon or a row of dots. `story.ts` has no field for any of
   them yet, so they are named here rather than scattered through five components —
   one object to move the day content gains a `ui:` block.

   `outOf` already shipped, in the meters' `aria-label` ("…out of 100"); `chooseApproach`,
   `pickTeam` and `teamPicked` already shipped as literals in `App.tsx` and were moved,
   not written. `ready`, `up` and `down` are new. */
export const UI_LABEL = {
  /** magnitude, where the visual is a row of filled dots that produces no text */
  outOf: "out of",
  /** polarity, where the visual is a tick or a red cross and nothing else */
  up: "Upside:",
  down: "Trade-off:",
  /** the commit gate */
  chooseApproach: "Choose an approach to continue",
  ready: "Ready to commit.",
  pickTeam: "Pick your team's strength",
  teamPicked: "This is who you are for the rest of the run.",
  /** recovering a run this build can no longer read — see engine/save.ts */
  runCode: "Your run code",
  continueFromCode: "Continue from this code",
  /** the decide beat's disclosure — backlog 4.1. Both are interface state, not story:
      one names an affordance, the other labels a field content already authors. */
  showBrief: "— the brief",
  objective: "You are trying to:",
  /** the ledger disclosure, where the count decides the noun */
  inPlayOne: "thing in play",
  inPlayMany: "things in play",
  show: "— show",
  /** the option card's own marker. The short form is for a 163px column — see
      `NARROW_COLUMNS` in `ui/mission.tsx`. */
  select: "Select this option",
  selectShort: "Select",
  /** the closing debrief's section headings and its one disclosure */
  standing: "Where you ended up",
  account: "The account",
  decisions: "Your decisions",
  decisionsOpen: "— and what they told you to watch for",
  ledToWhat: "What led to what",
  howYouPlayed: "How you played",
} as const;

/** Visually-hidden text: what an icon or a dot row says to the eye and to nothing else. */
export function Hidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/**
 * A quotation, as ONE string.
 *
 * `“{advisor.quote}”` looks like one sentence and is three sibling text nodes, so the
 * browser is free to break between the last word and the closing mark — and it does,
 * because a 13px italic quote in a 248px rail or a 300px bar is exactly the measure where
 * the last word lands near the edge. Every consequence screen in the game was rendering an
 * orphaned `”` alone on its own line, twice.
 *
 * Interpolating makes the closing mark part of the final word, so there is nothing for the
 * line-breaker to separate. `text-pretty` then handles the rest of the ragged edge; on its
 * own it could not have fixed this, because the orphan was not a bad break, it was a legal
 * one between two independent nodes.
 */
export function quoted(text: string): string {
  return `“${text}”`;
}

/* ───────────────────────────── motion, in JavaScript ─────────────────────────────
   `src/motion.css` is the whole motion system apart from these two hooks. They exist
   because a `requestAnimationFrame` loop is not reachable from a media query, and a
   counting number is the one thing in this interface that CSS cannot do.              */

/**
 * Has the player asked the operating system for less movement?
 *
 * Live rather than read once, because the setting can be changed mid-run — on macOS it is
 * a checkbox in System Settings, and a 70-minute game is long enough for someone to go
 * and tick it precisely because the motion is bothering them.
 */
export function useReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    setReduced(mq.matches);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Count a number from one value to another.
 *
 * A meter is the only quantitative feedback in this game, and a number that jumps from 58
 * to 64 does not report a change — it reports a different number, and the player has to
 * remember the old one to know what happened. Counting makes the size of the movement the
 * thing you see, which is the whole point of the beat.
 *
 * `easeInOutCubic`, which is the closed form of `--gpl-ease-track`, because the bar beside
 * the number is a CSS `transform` transition on that curve and the two are one fact. The
 * curve is slow-in-slow-out rather than the ease-out used for arrivals, for the reason
 * given on the token: a meter is not arriving anywhere, it is travelling, and the player's
 * job is to follow it.
 *
 * The returned value is for the eye only. Every caller keeps the true value on the
 * `role="meter"` that wraps it, so nothing an assistive technology reads ever passes
 * through an intermediate number — see `FactorMeter`.
 */
export function useCountUp(to: number, from?: number, delay = 0, duration = 900): number {
  const reduced = useReducedMotion();
  const start = from ?? to;
  const skip = reduced || start === to;
  const [value, setValue] = useState(skip ? to : start);

  useEffect(() => {
    if (skip) {
      setValue(to);
      return;
    }
    let frame = 0;
    let t0 = 0;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      const elapsed = now - t0 - delay;
      if (elapsed < 0) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min(1, elapsed / duration);
      /* easeInOutCubic — the closed form of cubic-bezier(0.645, 0.045, 0.355, 1). */
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      setValue(Math.round(start + (to - start) * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    /* Cancelled on unmount and on any change of target, so a beat that ends early — the
       player clicking through a consequence before the meters settle — never leaves a
       loop running against a component that is gone. */
    return () => cancelAnimationFrame(frame);
  }, [skip, start, to, delay, duration]);

  return value;
}

/**
 * The stagger across the three dimensions: 0, 80, 160ms, in reading order.
 *
 * One place, because it is used by the rail's bars, the resolving beat's meters and the
 * consequence's delta chips, and three copies of `i * 80` would drift the moment one of
 * them was tuned. 80ms is the step at which three things read as a sequence rather than
 * as one thing that is late.
 */
export const METER_STEP_MS = 80;
export const meterDelay = (i: number) => i * METER_STEP_MS;

/**
 * True from the frame after mount.
 *
 * A CSS transition needs two computed values to interpolate between, and an element that
 * mounts already showing its final value has only one — so a meter rendered fresh on the
 * resolving beat would simply appear at its new length. Painting the old value for exactly
 * one frame and then setting the new one gives the transition something to do, and costs a
 * single extra render per beat.
 *
 * This is why the bar is a CSS transition at all rather than being driven from the same
 * `requestAnimationFrame` loop as the number: `transform` on the compositor is free, and
 * of `width`, `height`, `margin` and `padding` Linear's engineering write-up says "never
 * animate those. I mean never."
 */
function useSettled(): boolean {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return settled;
}

/**
 * The `id` of whatever names the beat on screen — normally its `h1`, and on the one
 * beat with no heading (`resolving`) the line that stands in for one.
 *
 * Exactly one beat renders inside the console at a time, so a single id is enough, and
 * `<main aria-labelledby>` can then name itself after the beat without every screen
 * having to thread a label down.
 */
export const BEAT_TITLE_ID = "gpl-beat-title";

/* ───────────────────────────── live regions ───────────────────────────── */

/**
 * The game's two spoken channels.
 *
 * Nothing in this interface used to be announced. Meters moved 58→64 in silence, the
 * prediction verdict — the whole point of the gate — was never read, and the commit
 * gate opening was invisible to anyone not looking at the button. A blind player made
 * sixteen predictions and was told the result of none, which is not a polish defect:
 * it is the learning loop missing (WCAG 4.1.3).
 *
 * Both are `polite`, and both live here, mounted for the whole run. A live region that
 * mounts at the same moment its text arrives announces nothing — the element has to be
 * in the accessibility tree *before* the change it reports.
 *
 * `gateKey` re-keys the gate's only child so an unchanged requirement can be spoken
 * again: activating a gated button must answer, and a live region with identical text
 * has not changed. Replacing the node is a change.
 */
export function LiveRegions({
  announce,
  gate,
  gateKey,
}: {
  /** the resolution: headline, every non-zero delta, and whether the call was right */
  announce: string;
  /** what still stands between the player and committing */
  gate: string;
  gateKey: number;
}) {
  return (
    <>
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      <div aria-live="polite" className="sr-only">
        <span key={gateKey}>{gate}</span>
      </div>
    </>
  );
}

/* ───────────────────────────── radio group ───────────────────────────── */

/**
 * Mutual exclusion, said out loud.
 *
 * The option cards were real buttons with `aria-pressed`, in a bare `<div>`. So the set
 * had no name, no boundary and no arity: choosing card B silently un-pressed card A and
 * a screen reader announced only that B was now pressed — three unrelated toggles, where
 * the game means "pick exactly one of these". `radiogroup`/`radio` says it in one word.
 *
 * Taking the group's semantics means taking its keyboard contract too: one tab stop for
 * the whole set, arrows to move between members, selection following focus. Cards are
 * found in the DOM rather than plumbed through refs, so a list only has to mark its
 * members with `role="radio"` and set the roving `tabIndex`.
 */
export function RadioGroup({
  label,
  className,
  style,
  children,
}: {
  label: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!step && e.key !== "Home" && e.key !== "End") return;

    const radios = [...(ref.current?.querySelectorAll<HTMLElement>('[role="radio"]') ?? [])];
    const here = radios.findIndex((r) => r === document.activeElement);
    if (radios.length < 2 || here === -1) return;

    e.preventDefault();
    const to =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? radios.length - 1
          : (here + step + radios.length) % radios.length;
    const target = radios[to];
    if (!target) return;
    target.focus();
    // Selection follows focus, as the radio pattern requires — but re-activating the
    // one already checked would toggle it OFF, and a radio cannot be unchecked.
    if (target.getAttribute("aria-checked") !== "true") target.click();
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}

/** Roving tabindex: the checked member is the group's single tab stop, else the first. */
export function radioTabIndex(isChecked: boolean, index: number, anyChecked: boolean): 0 | -1 {
  if (anyChecked) return isChecked ? 0 : -1;
  return index === 0 ? 0 : -1;
}

/* ───────────────────────────── chapter stepper ───────────────────────────── */

export function ChapterStepper({
  chapters,
  current,
  compact = false,
}: {
  chapters: Chapter[];
  current: number;
  /** Phone width: only the chapter you are in is named. Five labels do not fit. */
  compact?: boolean;
}) {
  /* Circle over label, joined by a single track that fills behind you. Two tiers is the
     mockups' geometry; a row of circle-beside-label chips is not. */
  const doneCount = chapters.filter((c) => c.number < current).length;
  // Equal-width items put node i's centre at (2i+1)/(2n), so the track must start and
  // end inset by half a cell — otherwise a stub renders to the left of node 1.
  const edge = 100 / (2 * chapters.length);
  const span = 100 - 2 * edge;

  return (
    <ol
      className={`relative flex items-start justify-between ${compact ? "w-full max-w-[320px]" : "w-full max-w-[560px]"}`}
      aria-label="Chapters"
    >
      <span
        aria-hidden="true"
        className="absolute top-[11px] h-[2px] rounded-full"
        style={{ left: `${edge}%`, right: `${edge}%`, background: "var(--color-line-strong)" }}
      />
      {/* The one piece of motion in the persistent chrome, and the only one the player
          sees twice in a row: the track fills in behind them as a chapter closes.

          Delayed 260ms so it moves just after the interlude has arrived rather than
          underneath it — the interlude's whole subject is that time has passed, and this
          is the interface agreeing. `scaleX` rather than `width` so a 900ms animation in
          the top bar does not run layout on every frame of it. */}
      <span
        aria-hidden="true"
        className="m-settle absolute top-[11px] h-[2px] rounded-full"
        style={{
          left: `${edge}%`,
          width: `${span}%`,
          transform: `scaleX(${doneCount / (chapters.length - 1 || 1)})`,
          transitionDelay: "260ms",
          background: "var(--color-good)",
        }}
      />

      {chapters.map((c) => {
        const isDone = c.number < current;
        const active = c.number === current;
        return (
          <li
            key={c.number}
            className="relative flex flex-1 flex-col items-center gap-1.5"
            aria-current={active ? "step" : undefined}
          >
            <span
              aria-hidden="true"
              className="flex h-[24px] w-[24px] items-center justify-center rounded-full text-[12px] font-bold ring-4 ring-(--color-surface) transition-colors duration-300"
              style={{
                background: isDone
                  ? "var(--color-good)"
                  : active
                    ? "var(--color-accent)"
                    : "var(--color-canvas-deep)",
                color: active || isDone ? "#fff" : "var(--color-faint)",
              }}
            >
              {isDone ? <Icon name="check" size={13} /> : c.number}
            </span>
            <span
              className={`whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.08em] ${compact && !active ? "sr-only" : ""}`}
              style={{
                color: active
                  ? "var(--color-accent-deep)"
                  : isDone
                    ? "var(--color-ink-soft)"
                    : "var(--color-faint)",
              }}
            >
              {c.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ───────────────────────────── console frame ───────────────────────────── */

/**
 * Discarding the run takes two deliberate activations.
 *
 * This is the most destructive control in the product and it was the easiest to hit: a
 * single unconfirmed click that clears `localStorage`, sitting beside the score readout
 * players are drawn to — and, because the header comes first in the DOM, it was **tab
 * stop #1 on all 56 screens**. Four reviewers found it independently. A run is around 70
 * minutes; anyone with a tremor, a switch device or a stray Enter lost all of it.
 *
 * Confirming in place rather than in a modal is deliberate: a dialogue is a new
 * focus-management surface and a new way to trap a keyboard user, for a decision that
 * needs one bit of confirmation.
 */
function StartOver({ onRestart }: { onRestart: () => void }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    // Disarm on its own, so a mis-click does not leave a live trigger sitting there.
    const t = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(t);
  }, [armed]);

  return (
    <button
      onClick={() => (armed ? onRestart() : setArmed(true))}
      onBlur={() => setArmed(false)}
      aria-label={armed ? "Confirm starting over. This discards your run." : "Start over"}
      className={`rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
        armed
          ? "bg-(--color-risk-tint) text-(--color-risk-text)"
          : "text-(--color-muted) hover:bg-(--color-canvas-deep) hover:text-(--color-ink)"
      }`}
    >
      {armed ? "Discard this run?" : "Start over"}
    </button>
  );
}

export function TopBar({
  chapters,
  currentChapter,
  onRestart,
}: {
  chapters: Chapter[];
  currentChapter: number;
  onRestart: () => void;
}) {
  return (
    <>
      {/* Navigation, and paper has none. */}
      <header className="flex h-[66px] shrink-0 items-center gap-6 border-b border-(--color-line) px-5 print:hidden">
        <div className="flex shrink-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[12px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
            }}
          >
            GPL
          </span>
          <span className="hidden whitespace-nowrap text-[13px] font-semibold text-(--color-ink) sm:block">
            Global Pursuit League
          </span>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center xl:flex">
          <ChapterStepper chapters={chapters} current={currentChapter} />
        </div>

        {/* There used to be a "Score" here, the mean of the three meters, appearing from
            consequence 1 onward in the most persistent slot on screen.

            Four reviewers asked independently for its deletion and they were right. It
            contradicted the game's own position — the debrief deliberately drops a letter
            grade because "a score invites the player to optimise the grader" — it
            duplicated the meters two columns away, it read 78 for a run with
            Profitability at 34, and it was the surface a meter-greedy policy optimised to
            100/100/100 without reading a word. Invariant furniture should be invariant,
            and a grader should not be the thing that never leaves the screen. */}
        <div className="ml-auto flex shrink-0 items-center gap-4">
          <StartOver onRestart={onRestart} />
        </div>
      </header>

      <div className="flex shrink-0 justify-center border-b border-(--color-line) py-2 xl:hidden print:hidden">
        <ChapterStepper chapters={chapters} current={currentChapter} compact />
      </div>
    </>
  );
}

/**
 * The console body. Rails are white; the working area is the tinted surface — the
 * mockups are this way round and we previously had it inverted.
 */
export function Console({
  bars,
  left,
  right,
  bottom,
  live,
  focusKey,
  children,
}: {
  bars: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  bottom?: React.ReactNode;
  /** the two spoken channels, mounted here so they outlive every beat */
  live: { announce: string; gate: string; gateKey: number };
  /** changes when the beat changes, which is when focus must move */
  focusKey: string;
  children: React.ReactNode;
}) {
  const work = useRef<HTMLElement>(null);

  /**
   * Focus follows the beat.
   *
   * Focus landed on `<body>` 48 times in a single run: the action-bar button becomes
   * unavailable on brief→decide, and unmounts on commit→resolving, and Chromium blurs a
   * control it takes away. From `<body>` there is no "where am I" — a screen-reader user
   * is dropped at the top of a six-region console with no indication that the screen
   * changed at all, and a keyboard user has to Tab past the whole header every beat.
   *
   * The work area takes the focus rather than the `h1`, because focusing a heading
   * announces one line and leaves the reading cursor after it; focusing the region that
   * *contains* the heading announces "main, <beat title>" and leaves everything below
   * readable from the top.
   */
  useEffect(() => {
    work.current?.focus();
  }, [focusKey]);

  return (
    <div className="lg:h-screen lg:p-3 print:h-auto print:p-0">
      {/* `data-console` is the print stylesheet's only hook on the frame. The console
          owns the viewport and scrolls its own work area, which on paper would print one
          screenful and clip the rest — see `@media print` in `index.css`. */}
      <div
        data-console
        className="flex min-h-screen flex-col overflow-hidden border-(--color-line) bg-(--color-surface) lg:min-h-0 lg:h-full lg:rounded-[18px] lg:border"
        style={{ boxShadow: "0 1px 2px rgb(20 18 31/0.04), 0 18px 50px rgb(20 18 31/0.08)" }}
      >
        <LiveRegions {...live} />
        {bars}

        {/* The work area is FIRST in the DOM and second on screen.
            `order` puts the left rail back where the mockups have it, but the reading
            order now starts with the beat: the `h1` was previously the third heading on
            the page, behind the rail's "Find the right client" and "The brief", so a
            screen-reader user navigating by heading met the furniture before the
            situation on all 31 beats. Below `lg` the stack was already content-first. */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <main
            ref={work}
            data-work-area
            tabIndex={-1}
            aria-labelledby={BEAT_TITLE_ID}
            className="order-1 min-w-0 flex-1 lg:order-2 lg:overflow-y-auto print:overflow-visible"
            style={{ background: "var(--color-canvas)" }}
          >
            {children}
          </main>
          {left && (
            <aside className="order-2 shrink-0 border-t border-(--color-line) p-4 lg:order-1 lg:w-[248px] lg:overflow-y-auto lg:border-r lg:border-t-0">
              {left}
            </aside>
          )}
          {right && (
            <aside className="order-3 shrink-0 border-t border-(--color-line) p-4 lg:order-3 lg:w-[264px] lg:overflow-y-auto lg:border-l lg:border-t-0">
              {right}
            </aside>
          )}
        </div>

        {bottom}
      </div>
    </div>
  );
}

/* ───────────────────────────── rail pieces ───────────────────────────── */

export function RailCard({
  title,
  icon,
  tone = "accent",
  region,
  children,
}: {
  title?: string;
  icon?: IconId;
  tone?: Tone;
  /** Names this as a perceived region, for the density rubric. */
  region?: string;
  children: React.ReactNode;
}) {
  /* 10px above the rule and 10px below it, so a section boundary is 20px of air with a
     hairline in it, against 6px inside a group. See `RAIL_INTRA` below: the ratio is what
     does the grouping, and at 14 + 14 = 28px against a 10px intra step the rail was
     spending more space on its own seams than on the relationships inside them. */
  return (
    <section
      data-region={region}
      className="border-t border-(--color-line) pt-2.5 first:border-t-0 first:pt-0"
    >
      {title && (
        <SectionTitle icon={icon} tone={tone} className="mb-1.5">
          {title}
        </SectionTitle>
      )}
      {children}
    </section>
  );
}

/**
 * The rail's two spacing steps, and why there are exactly two.
 *
 * Gestalt proximity only groups when the inside of a group is decisively tighter than the
 * gap to the next one — practitioner rule of thumb and NN/g's own framing is a ratio of at
 * least 2:1. The rail was running 10px inside a block against 28px between sections in
 * some places and 2px against 14px in others, which is four steps doing the work of two.
 *
 * 6px intra, 20px inter. Stated as constants because three components lay the rail out and
 * the numbers drifted the moment they were typed separately.
 */
export const RAIL_INTRA = "mt-1.5"; /* 6px */
export const RAIL_INTER = "space-y-2.5"; /* 10px, plus 10px of `pt` under each rule */

/**
 * Left rail: where you are, what you were asked to do, who is talking to you, and the
 * file of things you have found out.
 *
 * "The brief" rather than "Your objective", and a file rather than a progress panel.
 * The words matter: the rail is furniture for a pursuit lead, not a worksheet for a
 * student (docs/STRATEGY.md D1). "Your file" also lives here rather than in the centre
 * because reference material belongs on the desk, not in the decision — Papers, Please's
 * rulebook, not a quiz.
 */
export function MissionRail({
  chapter,
  missionId,
  missionNumber,
  totalMissions,
  completed,
  advisor,
  objective,
  minutes,
  file,
}: {
  chapter: Chapter;
  missionId: string | null;
  missionNumber: number;
  totalMissions: number;
  completed: string[];
  advisor?: Advisor;
  objective?: string;
  minutes?: number;
  file?: { id: string; label: string; reveals: string }[];
}) {
  return (
    <div data-region="orientation" className={RAIL_INTER}>
      <div>
        <p className="text-[12px] font-bold text-(--color-accent)">Chapter {chapter.number}</p>
        {/* Not a heading. It names where you are, and as an `h2` it outranked the beat's
            own `h1` in the heading outline while saying less than the chapter stepper
            two inches above it already says. */}
        <p className={`${RAIL_INTRA} text-[18px] font-bold leading-tight text-(--color-ink)`}>
          {chapter.title}
        </p>
        <p className={`${RAIL_INTRA} text-[12px] font-medium text-(--color-muted) tabular-nums`}>
          Mission {missionNumber} of {totalMissions}
        </p>
      </div>

      <ol className="space-y-0.5 border-t border-(--color-line) pt-2.5">
        {chapter.missionIds.map((id, i) => {
          const done = completed.includes(id);
          const active = id === missionId;
          return (
            <li
              key={id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors"
              style={{ background: active ? "var(--color-accent-tint)" : "transparent" }}
              aria-current={active ? "step" : undefined}
            >
              <span
                aria-hidden="true"
                className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                style={{
                  background: done
                    ? "var(--color-good)"
                    : active
                      ? "var(--color-accent)"
                      : "var(--color-canvas-deep)",
                  color: done || active ? "#fff" : "var(--color-faint)",
                }}
              >
                {done ? <Icon name="check" size={12} /> : i + 1}
              </span>
              <span
                className="text-[13px] leading-snug"
                style={{
                  color: active
                    ? "var(--color-accent-deep)"
                    : done
                      ? "var(--color-ink-soft)"
                      : "var(--color-faint)",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {chapter.steps[i] ?? `Mission ${i + 1}`}
              </span>
            </li>
          );
        })}
      </ol>

      {objective && (
        <section className="border-t border-(--color-line) pt-2.5">
          {/* `megaphone`, not `target`. "The brief" is what you have been asked to do,
              and `target` is Winability's pictogram — which is on the same screen, two
              rails away, with a number beside it. */}
          <SectionTitle icon="megaphone" className="mb-1.5">
            The brief
          </SectionTitle>
          <p className="text-[13px] leading-relaxed text-(--color-ink-soft)">{objective}</p>
          {minutes !== undefined && (
            <p className={`${RAIL_INTRA} flex items-center gap-2 text-[12px] text-(--color-muted)`}>
              <Icon name="clock" size={14} />
              About {minutes} min
            </p>
          )}
        </section>
      )}

      {advisor && <AdvisorCard advisor={advisor} />}

      {file && file.length > 0 && (
        <section className="border-t border-(--color-line) pt-2.5">
          <SectionTitle icon="search" className="mb-1.5">
            Your file
          </SectionTitle>
          <ul className="space-y-1.5">
            {file.map((e) => (
              <li key={e.id}>
                <p className="text-[12px] font-bold text-(--color-accent-deep)">{e.label}</p>
                <p className="line-clamp-3 text-[12px] leading-snug text-(--color-muted)">{e.reveals}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * Everything the player has paid to find out, by label.
 *
 * Lives here because two beats need it and neither owns it: the brief's left rail gets it
 * as a prop, and the decide beat has to derive it — the rail's `file` prop is `undefined`
 * there, which is the deletion backlog 4.1 is about. Walking the node set is how
 * `App.tsx` already computes the same list; this is the shared implementation the two
 * should be sharing, and the `App.tsx` copy should be replaced by a call to it.
 */
export function discoveredEvidence(
  content: Content,
  discovered: readonly string[],
): { id: string; label: string; reveals: string }[] {
  const out: { id: string; label: string; reveals: string }[] = [];
  for (const node of Object.values(content.nodes)) {
    if (node.kind !== "investigate") continue;
    for (const e of node.evidence) {
      if (discovered.includes(e.id)) out.push({ id: e.id, label: e.label, reveals: e.reveals });
    }
  }
  return out;
}

/**
 * The only voice that gives advice in this game.
 *
 * Nothing in the interface tells the player what to think. A colleague does, by name,
 * with a job title and a stake of their own — which is briefing rather than lecturing.
 */
export function AdvisorCard({ advisor }: { advisor: Advisor }) {
  const initials = advisor.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <section className="border-t border-(--color-line) pt-2.5">
      <div className="flex items-center gap-2.5">
        {advisor.photo ? (
          <img
            src={artUrl(advisor.photo)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
            style={{
              /* Ink, not the Winability solid. White on #cd6d0a is 3.63:1, and the
                 gradient's other stop was the same ink anyway, so this was a two-stop
                 gradient between one colour and a contrast failure. */
              background: "var(--color-brand-solid)",
            }}
          >
            {initials}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-(--color-ink)">{advisor.name}</p>
          <p className="truncate text-[12px] font-medium text-(--color-accent)">{advisor.role}</p>
        </div>
      </div>
      <p className="mt-3 border-l-2 border-(--color-accent-ring) pl-3 text-[13px] italic leading-relaxed text-(--color-ink-soft) text-pretty">
        {quoted(advisor.quote)}
      </p>
    </section>
  );
}

/* ───────────────────────── factor read-out ─────────────────────────
   The three dimensions, at two scales: `FactorBars` for the rail, `FactorGrid` for the
   middle of the screen. Both take an optional `from`, and that one prop is what turns a
   meter from a number that has changed into a number the player watched change.          */

/**
 * The size of the change.
 *
 * Deliberately the FIRST thing to appear, ahead of the number it describes: it lands at
 * its dimension's stagger step, inside 100ms of the commit, so the click is acknowledged
 * immediately and the 900ms travel that follows is free to be legible rather than merely
 * quick. The chip is the claim; the counting number is the evidence for it.
 *
 * A gain lands with a slight overshoot. A loss does not — see `m-arrive` in `motion.css`
 * for why that asymmetry is not a stylistic preference.
 */
function DeltaChip({ delta, delay }: { delta: number; delay: number }) {
  const up = delta > 0;
  return (
    <span
      className={`${up ? "m-land" : "m-arrive"} rounded-full px-1.5 text-[12px] font-bold tabular-nums`}
      style={{
        animationDelay: `${delay}ms`,
        color: up ? "var(--color-good)" : "var(--color-bad)",
        background: up ? "var(--color-good-tint)" : "var(--color-bad-tint)",
      }}
    >
      {up ? "+" : ""}
      {delta}
    </span>
  );
}

/**
 * The bar, and the only thing in the interface that carries a value spatially.
 *
 * `role="meter"` stays on the track and keeps the TRUE value, never the counted one:
 * `role="meter"` does not report `aria-valuenow` changes anyway, so animating it would
 * buy nothing and risk an assistive technology reading a number that is on its way
 * somewhere. The announcement of the change is the resolution live region's job.
 */
function MeterTrack({
  label,
  value,
  from,
  fill,
  track,
  delay,
  height,
}: {
  label: string;
  value: number;
  from?: number;
  fill: string;
  /**
   * The unfilled part of the track, in this dimension's own tint.
   *
   * All three tracks used to share one neutral, which meant the three hues the palette
   * works hardest to keep separable held almost no surface area — they were a 6px sliver
   * of fill and nothing else. A tinted track gives each dimension a readable band whether
   * its value is 8 or 80, and it is a surface rather than a mark, so it costs nothing
   * against the rule that colour never carries meaning alone.
   */
  track: string;
  delay: number;
  height: string;
}) {
  const settled = useSettled();
  const shown = settled ? value : (from ?? value);
  return (
    <div
      className={`${height} w-full overflow-hidden rounded-full`}
      style={{ background: track }}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${value} ${UI_LABEL.outOf} 100`}
    >
      <div
        className="m-settle h-full w-full rounded-full"
        style={{
          transform: `scaleX(${Math.max(0, Math.min(100, shown)) / 100})`,
          transitionDelay: `${delay}ms`,
          background: fill,
        }}
      />
    </div>
  );
}

/**
 * The counted number.
 *
 * `aria-hidden`, and this is the one place where motion is allowed to change what is in
 * the accessibility tree — because leaving it exposed would put TWO numbers for the same
 * quantity in the tree that disagree with each other for 900ms: this one, mid-count, and
 * the authoritative one on the `role="meter"` beside it. The meter's `aria-label` already
 * reads "Winability: 64 out of 100", so the bare duplicate was adding a second reading of
 * the same fact even before it could animate.
 *
 * `tabular-nums` is load-bearing, not typographic: without it every digit change reflows
 * the row for the whole count.
 */
function CountedValue({
  value,
  from,
  delay,
  className,
  style,
  children,
}: {
  value: number;
  from?: number;
  delay: number;
  className: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const shown = useCountUp(value, from, delay);
  return (
    <span aria-hidden="true" className={className} style={style}>
      {shown}
      {children}
    </span>
  );
}

export function FactorBars({
  dims,
  from,
  deltas,
  showDeltas = false,
}: {
  dims: Record<DimensionId, number>;
  /** where each meter is coming FROM. Present only on the beats where one moved. */
  from?: Record<DimensionId, number>;
  deltas?: Record<DimensionId, number>;
  showDeltas?: boolean;
}) {
  return (
    <div className="space-y-3">
      {DIMENSIONS.map((d, i) => {
        const meta = DIMENSION_META[d];
        const ink = `var(${meta.textVar})`;
        const delta = deltas?.[d] ?? 0;
        const delay = meterDelay(i);
        return (
          <div key={d}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span
                className="flex items-center gap-2 text-[13px] font-bold"
                style={{ color: ink }}
              >
                <Icon name={meta.icon} size={15} />
                {meta.label}
              </span>
              <span className="flex items-baseline gap-1.5">
                {showDeltas && delta !== 0 && <DeltaChip delta={delta} delay={delay} />}
                <CountedValue
                  value={dims[d]}
                  from={from?.[d]}
                  delay={delay}
                  className="text-[12px] font-bold tabular-nums text-(--color-muted)"
                />
              </span>
            </div>
            <MeterTrack
              label={meta.label}
              value={dims[d]}
              from={from?.[d]}
              fill={`var(${meta.fillVar})`}
              track={`var(--color-${d}-tint)`}
              delay={delay}
              height="h-1.5"
            />
          </div>
        );
      })}
    </div>
  );
}

/** The same three factors, given room to breathe. Used after a decision and at the end. */
export function FactorGrid({
  dims,
  from,
  deltas,
  showDeltas = false,
}: {
  dims: Record<DimensionId, number>;
  from?: Record<DimensionId, number>;
  deltas?: Record<DimensionId, number>;
  showDeltas?: boolean;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {DIMENSIONS.map((d, i) => {
        const meta = DIMENSION_META[d];
        const ink = `var(${meta.textVar})`;
        const delta = deltas?.[d] ?? 0;
        const delay = meterDelay(i);
        return (
          <div key={d}>
            {/* The dimension's own pictogram — target / coins / layers — and not the
                `◆ ● ▲` geometric glyphs this used to draw. Those appeared on exactly two
                screens, after 46 on which the same three quantities had been identified
                by the same three drawings, so the game changed its mind about what
                Winability looks like at the moment it summed the run up. A pictogram is
                one of the three things DESIGN-SYSTEM.md relies on to keep colour from
                carrying meaning alone; swapping it for a different mark halfway through
                breaks that redundancy rather than providing it. */}
            <div className="mb-1.5 flex items-center gap-2">
              <span
                className="flex items-center gap-1.5 text-[13px] font-bold"
                style={{ color: ink }}
              >
                <Icon name={meta.icon} size={15} />
                {meta.label}
              </span>
            </div>
            {/* The delta chip sits BESIDE the number, not out at the right-hand edge of
                the header row where it was — 180px away from the only number it makes a
                claim about, measured on the resolving beat. `showDeltas` is true on that
                beat and nowhere else, so this arrangement costs the closing debrief, which
                shows no deltas, exactly nothing. */}
            <div className="mb-1.5 flex items-baseline gap-2">
              <CountedValue
                value={dims[d]}
                from={from?.[d]}
                delay={delay}
                className="text-[24px] font-bold leading-none tabular-nums"
                style={{ color: ink }}
              />
              <span aria-hidden="true" className="text-[12px] text-(--color-faint)">
                / 100
              </span>
              {showDeltas && delta !== 0 && <DeltaChip delta={delta} delay={delay} />}
            </div>
            <MeterTrack
              label={meta.label}
              value={dims[d]}
              from={from?.[d]}
              fill={`var(${meta.fillVar})`}
              track={`var(--color-${d}-tint)`}
              delay={delay}
              height="h-2"
            />
            <p className="mt-2 text-[13px] text-(--color-muted)">{meta.question}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── the ledger ───────────────────────────── */

/**
 * Tone → the tile's colour, and nothing else.
 *
 * There used to be an `icon` here too, and it was dead: both call sites render
 * `entry.icon`, which the engine sets per rule precisely so the ledger is not six
 * identical dots. The dead field named `layers` for every neutral entry, which is one of
 * the four meanings that pictogram had accumulated.
 */
const LEDGER_TONE: Record<LedgerEntry["tone"], Tone> = {
  good: "good",
  neutral: "accent",
  bad: "bad",
};

/**
 * One ledger row, rendered the same way everywhere it appears.
 *
 * The rail and the closing debrief were two copies of this markup that had already drifted
 * apart — the debrief ignored `entry.icon` and re-derived a pictogram from the tone, so
 * every neutral line in the account was drawn with Deliverability's `layers`. One
 * component, one data source: `detailClass` is the only difference either caller needs,
 * and it exists so the debrief can defer the detail line to the print stylesheet.
 */
export function LedgerRow({
  entry,
  size,
  bare = false,
  detailClass,
}: {
  entry: LedgerEntry;
  size: number;
  /**
   * A bare pictogram instead of a tinted tile.
   *
   * The tile is right in a 248px rail, where it is one of four marks and gives a
   * three-word label something to sit against. On the closing debrief the same list is
   * ten to twelve rows across three columns, and ten tinted squares is scattered
   * chroma — which `DESIGN-SYSTEM.md` measures as the thing that separates a screen that
   * reads as designed from one that reads as a document. It also costs three of the
   * distinct fills the debrief is over budget on.
   */
  bare?: boolean;
  detailClass?: string;
}) {
  return (
    <li className="flex gap-2 break-inside-avoid">
      {bare ? (
        <span
          className="mt-[2px] shrink-0"
          style={{ color: `var(--color-${LEDGER_TONE[entry.tone]})` }}
        >
          <Icon name={entry.icon} size={size} />
        </span>
      ) : (
        <IconTile name={entry.icon} tone={LEDGER_TONE[entry.tone]} size={size} />
      )}
      <span className="min-w-0">
        <span className="block text-[13px] font-bold leading-snug text-(--color-ink)">
          {entry.label}
        </span>
        <span
          className={`block text-[12px] leading-snug text-(--color-muted) ${detailClass ?? ""}`}
        >
          {entry.detail}
        </span>
      </span>
    </li>
  );
}

/**
 * Right rail: what you know, what you have promised, what you have spent.
 *
 * The three dimensions are an abstraction. This is the account behind them, in the
 * language of the work — a score invites the player to optimise the grader, a ledger
 * invites them to read their own position.
 */
export function InsightRail({
  dims,
  from,
  entries,
  commits,
  collapsed = false,
}: {
  dims: Record<DimensionId, number>;
  /**
   * Where the meters are coming from, on the two beats where they have just moved.
   *
   * This rail stays mounted from the decision beat through resolving and into the
   * consequence — which is the whole reason the movement is visible at all. It used to
   * unmount on commit and remount on the consequence, so the meters did not travel, they
   * were replaced: the player watched three bars disappear and three different bars come
   * back, which is a cut dressed as feedback.
   */
  from?: Record<DimensionId, number>;
  entries: LedgerEntry[];
  /** what the currently selected option would add to the ledger */
  commits?: string;
  /**
   * On the decision beat the ledger becomes detail-on-demand: a count and a summary
   * line, openable. The framework allows 25–40% of briefing words behind one
   * affordance, and forbids hiding anything decision-critical — the ledger is context.
   */
  collapsed?: boolean;
}) {
  return (
    <div className="space-y-3.5">
      <RailCard title="Key factors" icon="chart" region="factors">
        <FactorBars dims={dims} from={from} />
      </RailCard>

      {/* Sits above the ledger because that is what it is: the next line of it. Keeping
          it out of the option card stops the whole card row growing on selection. */}
      {commits && (
        <section
          /* 160ms, down from 500. This panel answers a click the player has just made,
             so anything slower is the rail catching up with them. */
          className="m-swap rounded-xl px-3.5 py-3"
          style={{ background: "var(--color-accent-tint)" }}
        >
          <SectionTitle icon="scale" className="mb-1.5">
            If you commit
          </SectionTitle>
          <p className="text-[13px] leading-snug text-(--color-ink-soft)">{commits}</p>
        </section>
      )}

      {/* `flag`, not `layers`. "Where you stand" is a position, which is what a flag is,
          and `layers` belongs to Deliverability. */}
      <RailCard title="Where you stand" icon="flag" region="ledger">
        {collapsed && entries.length > 0 ? (
          <details>
            {/* 231×20 before, which fails 2.5.8 on the short axis. `min-h` rather than
                padding, so the 24px is the target and not the gap to the list below. */}
            <summary className="flex min-h-[24px] cursor-pointer list-none items-center text-[13px] text-(--color-muted)">
              {/* One flex child, so the whitespace between these spans survives — a text
                  run promoted to a flex item loses its leading and trailing spaces. */}
              {/* "1 things in play" shipped, on the first decision of every run — the
                  only mission where the ledger has exactly one entry. Caught by looking
                  at the render, not by any test. */}
              <span>
                <span className="font-bold text-(--color-ink)">{entries.length}</span>{" "}
                {entries.length === 1 ? UI_LABEL.inPlayOne : UI_LABEL.inPlayMany}{" "}
                <span className="text-(--color-accent)">{UI_LABEL.show}</span>
              </span>
            </summary>
            {/**
             * The SAME rows as the expanded rail, `detail` included.
             *
             * This branch used to render `e.label` alone while the branch below rendered
             * label *and* detail, so opening the disclosure on a decision beat did not
             * defer the ledger — it destroyed half of it. The reason a player consults
             * the ledger mid-decision is to remember what "Timeline assumes access"
             * actually commits them to, and that sentence is the `detail`. A label on its
             * own is a filename.
             *
             * Nothing is written here and nothing is moved anywhere: it is the field the
             * engine already computes, rendered on the beat where it was being dropped.
             * The cost is zero layout pixels, because it is behind the affordance that
             * was already on screen — which is also why it is the highest-priority
             * restoration of the three (backlog 4.1).
             */}
            <ul className="mt-1.5 space-y-1.5">
              {entries.map((e) => (
                <LedgerRow key={e.label} entry={e} size={22} />
              ))}
            </ul>
          </details>
        ) : entries.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-(--color-muted)">
            Nothing committed yet. Everything you learn and promise lands here.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {entries.map((e) => (
              <LedgerRow key={e.label} entry={e} size={26} />
            ))}
          </ul>
        )}
      </RailCard>

    </div>
  );
}

/* ───────────────────────────── action bar ───────────────────────────── */

/**
 * The prediction gate — the game's "before".
 *
 * You cannot commit until you have said which of the three this will cost most. It is
 * one tap, and it is what turns the consequence screen from the game telling you what
 * happened into the game answering a question you asked. See docs/ENGAGEMENT-MODEL.md.
 */
/**
 * While the strip is up, the question IS the outstanding requirement, so the commit
 * button is described by it rather than by a second copy of the same sentence.
 */
export const PREDICTION_QUESTION_ID = "gpl-prediction-question";

export function PredictionStrip({
  prediction,
  onPredict,
}: {
  prediction: DimensionId | null;
  onPredict: (d: DimensionId) => void;
}) {
  return (
    /* Appears the moment a selection completes, so it fades in at the speed of the click
       that summoned it rather than at the speed of a page transition. */
    <div className="m-swap flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
      <span
        id={PREDICTION_QUESTION_ID}
        className="text-[13px] font-semibold text-(--color-ink-soft)"
      >
        Which of the three will move least?
      </span>
      <div className="flex gap-1.5">
        {DIMENSIONS.map((d) => {
          const meta = DIMENSION_META[d];
          const on = prediction === d;
          return (
            <button
              key={d}
              onClick={() => onPredict(d)}
              aria-pressed={on}
              className="m-press flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-bold"
              style={{
                /* Selected is a tint fill with the dark text token, never white on the
                   solid: win and profit solids are 3.63:1 and 3.90:1 on white, which is
                   a fill ratio, not a type ratio. */
                borderColor: on ? `var(${meta.fillVar})` : "var(--color-border-control)",
                background: on ? `var(--color-${d}-tint)` : "var(--color-surface)",
                color: `var(${meta.textVar})`,
              }}
            >
              {/* The pictogram, so the chip carries identity without relying on hue. */}
              <Icon name={meta.icon} size={13} />
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const ACTION_HINT_ID = "gpl-action-hint";

/**
 * Why the primary action is `aria-disabled` and not `disabled`.
 *
 * A `disabled` button is removed from the tab order, which means the one control that
 * explains why the player cannot proceed is the one control they cannot reach. The
 * explanation was also an unassociated `<span>` sitting last in the bar, and
 * `aria-describedby` was null on every control in the game — so a screen-reader user
 * arrived at a decide screen, found no primary action at all, and had nothing to tell
 * them a gate existed.
 *
 * `aria-disabled` keeps the button focusable and announced as unavailable, ties it to
 * the requirement it is waiting on, and answers when activated: the gate's live region
 * speaks the requirement instead of the game doing nothing. Sighted keyboard users get
 * the same discoverability for free.
 */
/**
 * `label` and `onAction` are optional, and that is a motion decision rather than an API
 * one.
 *
 * The resolving beat had no action bar, so committing a decision took the whole bottom
 * 66px of the console away for one second and then put it back — the frame flickering
 * around the one moment that is supposed to feel like a consequence. The bar now stays
 * up through resolving carrying only the colleague's steer, which is honest (it is still
 * their advice about the decision just made) and holds every edge of the console still
 * from the decision beat through to the result.
 */
export function ActionBar({
  label,
  onAction,
  disabled,
  onBlocked,
  hint,
  hintId,
  aside,
  children,
}: {
  label?: string;
  onAction?: () => void;
  disabled?: boolean;
  /** activated while gated — say what is missing rather than swallowing the press */
  onBlocked?: () => void;
  /** the outstanding requirement, rendered here so the button can point at it */
  hint?: string;
  /** or the id of something already on screen that states it */
  hintId?: string;
  /**
   * The colleague's practical steer. The mockups carry an unattributed "Tip" in this
   * slot; we keep their treatment — portrait, label, two lines — but the label is a
   * person's name, because the interface does not get to tell the player what to think.
   */
  aside?: { from: string; text: string; photo?: string };
  /** left-hand content — the prediction strip on a decide screen */
  children?: React.ReactNode;
}) {
  const gated = Boolean(disabled);
  const describedBy = hint ? ACTION_HINT_ID : hintId;
  /* `flex-wrap` matters more than it looks. Three children with fixed widths — a 300px
     advisor card, the prediction strip and a 280px button — give this bar a ~640px hard
     minimum, and the console shell is `overflow-hidden`. Below about 660px the primary
     action was therefore CLIPPED rather than wrapped: 250px of it gone at 390px wide,
     with no scrollbar, and focusing a prediction chip scrolled the whole application
     sideways. `gap-y-2` was already here, so wrapping was always the intent. */
  return (
    <div data-region="commit" className="flex min-h-[66px] shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-t border-(--color-line) bg-(--color-surface) px-5 py-2.5 print:hidden">
      {/**
       * 360px from `xl` up, and this is a fit fix rather than a taste one.
       *
       * At 300px the colleague's steer wrapped to four lines on the missions with the
       * longest one, which made the action bar 115px tall against 97px elsewhere — and
       * the bar is the only thing between the working area and the bottom of the console,
       * so those 18px come straight off every screen that beat can show. Mission 7
       * overflowed by 24px with an 18px-taller bar underneath it.
       *
       * Widening the card by 60px takes the same sentence to two lines, which makes the
       * bar the same height on every beat — §10's "shared regions moving <24px" — and
       * hands the height back to the desk. Held to `xl` because below 1280px the bar's
       * three children do not have 1,010px of room and `flex-wrap` would take a second
       * line, which is the defect this is fixing, from the other direction.
       */}
      {aside && (
        <div className="flex w-[300px] shrink-0 items-center gap-3 rounded-xl border border-(--color-line) px-3.5 py-2.5 xl:w-[360px]">
          {aside.photo ? (
            <img
              src={artUrl(aside.photo)}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-[38px] w-[38px] shrink-0 rounded-[9px] object-cover"
            />
          ) : (
            <IconTile name="bulb" tone="neutral" size={38} />
          )}
          <p className="min-w-0 text-[13px] leading-snug text-(--color-ink-soft) text-pretty">
            <span className="font-bold text-(--color-ink)">{aside.from}: </span>
            {quoted(aside.text)}
          </p>
        </div>
      )}
      {children}
      {hint && (
        <span id={ACTION_HINT_ID} className="text-[13px] text-(--color-muted)">
          {hint}
        </span>
      )}
      {label && (
        <div className="ml-auto shrink-0">
          <button
            onClick={() => (gated ? onBlocked?.() : onAction?.())}
            aria-disabled={gated || undefined}
            aria-describedby={describedBy}
            /* `data-ready` is what fires the gate-opening scale: the attribute appearing
               starts the animation, so it cannot re-fire on a re-render that left the
               gate where it was. Only set on a bar that HAS a gate, or every action bar
               in the game would pop on arrival. */
            data-ready={disabled === undefined ? undefined : !gated}
            className="m-gate m-press flex h-[48px] min-w-[280px] items-center justify-center gap-2.5 rounded-[12px] px-8 text-[15px] font-bold aria-disabled:cursor-not-allowed"
            style={
              gated
                ? { background: "var(--color-accent-tint)", color: "var(--color-accent-deep)" }
                : { background: "var(--color-accent)", color: "#fff" }
            }
          >
            {label}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── primitives ───────────────────────────── */

export function PrimaryButton({
  children,
  onClick,
  disabled,
  hint,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={onClick}
        disabled={disabled}
        className="m-press rounded-[12px] px-6 py-3 text-[15px] font-bold enabled:text-white disabled:cursor-not-allowed"
        style={
          disabled
            ? { background: "var(--color-accent-tint)", color: "var(--color-accent-deep)" }
            : { background: "var(--color-accent)" }
        }
      >
        {children}
      </button>
      {hint && <span className="text-[13px] text-(--color-muted)">{hint}</span>}
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

/**
 * `animate` is still here and still defaults to false, and it must stay that way.
 *
 * Badges are earned mid-run and shown only at the debrief on purpose — recognition
 * mid-run is a narrator patting the player on the head, and the same information at the
 * end is an account of how they played. A badge landing is therefore never a celebration
 * of an event; at the debrief it is one row of a list arriving with the rest of its
 * section, which is what `m-seq` on the ending gives it.
 */
export function BadgeChip({
  id,
  animate = false,
  compact = false,
}: {
  id: BadgeId;
  animate?: boolean;
  /**
   * The debrief's form. `trophy`, because recognition is the one thing that pictogram
   * means anywhere in this game — the full card used `check`, which by then stood for a
   * completed chapter, a completed mission, an upside on an option card, a milestone, a
   * strong outcome and a ledger entry in credit. The note is not dropped: it prints.
   */
  compact?: boolean;
}) {
  const meta = BADGE_META[id];
  if (compact) {
    return (
      <span
        className="chip"
        style={{ background: "var(--color-accent-tint)", color: "var(--color-accent-deep)" }}
      >
        <Icon name="trophy" size={12} />
        {meta.label}
        <span className="only-print font-medium">— {meta.note}</span>
      </span>
    );
  }
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${animate ? "m-land" : ""}`}
      style={{ borderColor: "var(--color-accent-ring)", background: "var(--color-accent-tint)" }}
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-(--color-accent)">
        <Icon name="check" size={16} />
      </span>
      <div>
        <p className="text-[13px] font-bold text-(--color-accent-deep)">{meta.label}</p>
        <p className="text-[13px] leading-snug text-(--color-ink-soft)">{meta.note}</p>
      </div>
    </div>
  );
}

