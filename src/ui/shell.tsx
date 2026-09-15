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
} as const;

/** Visually-hidden text: what an icon or a dot row says to the eye and to nothing else. */
export function Hidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
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
      <span
        aria-hidden="true"
        className="absolute top-[11px] h-[2px] rounded-full transition-[width] duration-500"
        style={{
          left: `${edge}%`,
          width: `${(span * doneCount) / (chapters.length - 1 || 1)}%`,
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
      <header className="flex h-[66px] shrink-0 items-center gap-6 border-b border-(--color-line) px-5">
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

      <div className="flex shrink-0 justify-center border-b border-(--color-line) py-2 xl:hidden">
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
    <div className="lg:h-screen lg:p-3">
      <div
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
            className="order-1 min-w-0 flex-1 lg:order-2 lg:overflow-y-auto"
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
  return (
    <section
      data-region={region}
      className="border-t border-(--color-line) pt-3.5 first:border-t-0 first:pt-0"
    >
      {title && (
        <SectionTitle icon={icon} tone={tone} className="mb-2.5">
          {title}
        </SectionTitle>
      )}
      {children}
    </section>
  );
}

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
    <div data-region="orientation" className="space-y-3.5">
      <div>
        <p className="text-[12px] font-bold text-(--color-accent)">Chapter {chapter.number}</p>
        {/* Not a heading. It names where you are, and as an `h2` it outranked the beat's
            own `h1` in the heading outline while saying less than the chapter stepper
            two inches above it already says. */}
        <p className="mt-0.5 text-[18px] font-bold leading-tight text-(--color-ink)">
          {chapter.title}
        </p>
        <p className="mt-1 text-[12px] font-medium text-(--color-muted) tabular-nums">
          Mission {missionNumber} of {totalMissions}
        </p>
      </div>

      <ol className="space-y-0.5 border-t border-(--color-line) pt-3">
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
        <section className="border-t border-(--color-line) pt-3.5">
          <SectionTitle icon="target" className="mb-2">
            The brief
          </SectionTitle>
          <p className="text-[13px] leading-relaxed text-(--color-ink-soft)">{objective}</p>
          {minutes !== undefined && (
            <p className="mt-2.5 flex items-center gap-2 text-[12px] text-(--color-muted)">
              <Icon name="clock" size={14} />
              About {minutes} min
            </p>
          )}
        </section>
      )}

      {advisor && <AdvisorCard advisor={advisor} />}

      {file && file.length > 0 && (
        <section className="border-t border-(--color-line) pt-3.5">
          <SectionTitle icon="search" className="mb-2">
            Your file
          </SectionTitle>
          <ul className="space-y-2.5">
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
    <section className="border-t border-(--color-line) pt-3.5">
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
      <p className="mt-3 border-l-2 border-(--color-accent-ring) pl-3 text-[13px] italic leading-relaxed text-(--color-ink-soft)">
        “{advisor.quote}”
      </p>
    </section>
  );
}

/* ───────────────────────── factor read-out ───────────────────────── */

export function FactorBars({
  dims,
  deltas,
  showDeltas = false,
}: {
  dims: Record<DimensionId, number>;
  deltas?: Record<DimensionId, number>;
  showDeltas?: boolean;
}) {
  return (
    <div className="space-y-3">
      {DIMENSIONS.map((d) => {
        const meta = DIMENSION_META[d];
        const ink = `var(${meta.textVar})`;
        const fill = `var(${meta.fillVar})`;
        const delta = deltas?.[d] ?? 0;
        const moved = showDeltas && delta !== 0;
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
                {moved && (
                  <span
                    className="anim-pop rounded-full px-1.5 text-[12px] font-bold tabular-nums"
                    style={{
                      color: delta > 0 ? "var(--color-good)" : "var(--color-bad)",
                      background: delta > 0 ? "var(--color-good-tint)" : "var(--color-bad-tint)",
                    }}
                  >
                    {delta > 0 ? "+" : ""}
                    {delta}
                  </span>
                )}
                <span className="text-[12px] font-bold tabular-nums text-(--color-muted)">
                  {dims[d]}
                </span>
              </span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: "var(--color-canvas-deep)" }}
              role="meter"
              aria-valuenow={dims[d]}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${meta.label}: ${dims[d]} out of 100`}
            >
              <div
                className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
                style={{ width: `${dims[d]}%`, background: fill }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The same three factors, given room to breathe. Used after a decision and at the end. */
export function FactorGrid({
  dims,
  deltas,
  showDeltas = false,
}: {
  dims: Record<DimensionId, number>;
  deltas?: Record<DimensionId, number>;
  showDeltas?: boolean;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {DIMENSIONS.map((d) => {
        const meta = DIMENSION_META[d];
        const ink = `var(${meta.textVar})`;
        const fill = `var(${meta.fillVar})`;
        const delta = deltas?.[d] ?? 0;
        const moved = showDeltas && delta !== 0;
        return (
          <div key={d}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span
                className="flex items-center gap-1.5 text-[13px] font-bold"
                style={{ color: ink }}
              >
                <span aria-hidden="true" className="text-[12px]">
                  {meta.glyph}
                </span>
                {meta.label}
              </span>
              {moved && (
                <span
                  className="anim-pop rounded-full px-1.5 py-0.5 text-[12px] font-bold tabular-nums"
                  style={{
                    color: delta > 0 ? "var(--color-good)" : "var(--color-bad)",
                    background: delta > 0 ? "var(--color-good-tint)" : "var(--color-bad-tint)",
                  }}
                >
                  {delta > 0 ? "+" : ""}
                  {delta}
                </span>
              )}
            </div>
            <div className="mb-1.5 flex items-baseline gap-1">
              <span
                className="text-[24px] font-bold leading-none tabular-nums"
                style={{ color: ink }}
              >
                {dims[d]}
              </span>
              <span className="text-[12px] text-(--color-faint)">/ 100</span>
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
                style={{ width: `${dims[d]}%`, background: fill }}
              />
            </div>
            <p className="mt-2 text-[13px] text-(--color-muted)">{meta.question}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── the ledger ───────────────────────────── */

const LEDGER_TONE: Record<LedgerEntry["tone"], { icon: IconId; tone: Tone }> = {
  good: { icon: "check", tone: "good" },
  neutral: { icon: "layers", tone: "accent" },
  bad: { icon: "warning", tone: "bad" },
};

/**
 * Right rail: what you know, what you have promised, what you have spent.
 *
 * The three dimensions are an abstraction. This is the account behind them, in the
 * language of the work — a score invites the player to optimise the grader, a ledger
 * invites them to read their own position.
 */
export function InsightRail({
  dims,
  entries,
  commits,
  collapsed = false,
}: {
  dims: Record<DimensionId, number>;
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
        <FactorBars dims={dims} />
      </RailCard>

      {/* Sits above the ledger because that is what it is: the next line of it. Keeping
          it out of the option card stops the whole card row growing on selection. */}
      {commits && (
        <section
          className="anim-fade rounded-xl px-3.5 py-3"
          style={{ background: "var(--color-accent-tint)" }}
        >
          <SectionTitle icon="scale" className="mb-1.5">
            If you commit
          </SectionTitle>
          <p className="text-[13px] leading-snug text-(--color-ink-soft)">{commits}</p>
        </section>
      )}

      <RailCard title="Where you stand" icon="layers" region="ledger">
        {collapsed && entries.length > 0 ? (
          <details>
            {/* 231×20 before, which fails 2.5.8 on the short axis. `min-h` rather than
                padding, so the 24px is the target and not the gap to the list below. */}
            <summary className="flex min-h-[24px] cursor-pointer list-none items-center text-[13px] text-(--color-muted)">
              {/* One flex child, so the whitespace between these spans survives — a text
                  run promoted to a flex item loses its leading and trailing spaces. */}
              <span>
                <span className="font-bold text-(--color-ink)">{entries.length}</span> things in
                play <span className="text-(--color-accent)">— show</span>
              </span>
            </summary>
            <ul className="mt-2.5 space-y-2">
              {entries.map((e) => (
                <li key={e.label} className="flex gap-2">
                  <IconTile name={e.icon} tone={LEDGER_TONE[e.tone].tone} size={22} />
                  <span className="min-w-0 text-[12px] font-bold leading-snug text-(--color-ink)">
                    {e.label}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        ) : entries.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-(--color-muted)">
            Nothing committed yet. Everything you learn and promise lands here.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => {
              const t = LEDGER_TONE[e.tone];
              return (
                <li key={e.label} className="flex gap-2">
                  <IconTile name={e.icon} tone={t.tone} size={26} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold leading-snug text-(--color-ink)">
                      {e.label}
                    </span>
                    <span className="block text-[12px] leading-snug text-(--color-muted)">
                      {e.detail}
                    </span>
                  </span>
                </li>
              );
            })}
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
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
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
              className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-bold transition-colors"
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
  label: string;
  onAction: () => void;
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
    <div data-region="commit" className="flex min-h-[66px] shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-t border-(--color-line) bg-(--color-surface) px-5 py-2.5">
      {aside && (
        <div className="flex w-[300px] shrink-0 items-center gap-3 rounded-xl border border-(--color-line) px-3.5 py-2.5">
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
          <p className="min-w-0 text-[13px] leading-snug text-(--color-ink-soft)">
            <span className="font-bold text-(--color-ink)">{aside.from}: </span>
            “{aside.text}”
          </p>
        </div>
      )}
      {children}
      {hint && (
        <span id={ACTION_HINT_ID} className="text-[13px] text-(--color-muted)">
          {hint}
        </span>
      )}
      <div className="ml-auto shrink-0">
        <button
          onClick={() => (gated ? onBlocked?.() : onAction())}
          aria-disabled={gated || undefined}
          aria-describedby={describedBy}
          className="flex h-[48px] min-w-[280px] items-center justify-center gap-2.5 rounded-[12px] px-8 text-[15px] font-bold transition-colors duration-150 aria-disabled:cursor-not-allowed"
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
        className="rounded-[12px] px-6 py-3 text-[15px] font-bold transition-colors duration-150 enabled:text-white disabled:cursor-not-allowed"
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

export function BadgeChip({ id, animate = false }: { id: BadgeId; animate?: boolean }) {
  const meta = BADGE_META[id];
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${animate ? "anim-pop" : ""}`}
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

export function scoreOf(dims: Record<DimensionId, number>): number {
  return Math.round((dims.win + dims.profit + dims.deliver) / 3);
}
