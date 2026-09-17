/**
 * Reward.
 *
 * The engine has awarded badges since the first build and no screen has ever said so —
 * `BADGE_META` defines six, `applyEffect` returns `newBadges`, and the player finds out
 * never. Recognition that is computed and not shown is not a reward system, it is a log
 * line. Four exports fix that, in order of loudness:
 *
 *   `Celebration`      — the burst, on its own, over any surface. Reusable on purpose:
 *                        the journey map will want to fire it too, and a burst welded
 *                        into a modal cannot be.
 *   `BadgeEarned`      — interrupts. The moment it happens, once, dismissible.
 *   `RecognitionBoard` — the collection. Six slots, earned and not, so the unearned ones
 *                        read as goals rather than as absences.
 *   `ScoreTally`       — three staggered cards, each counting to its new value.
 *
 * All four render state. Nothing here decides whether a badge was earned or what a meter
 * became; the caller passes what the engine already produced.
 */

import { useEffect, useRef, useState } from "react";

import type { BadgeStatus } from "../engine/progress";
import {
  BADGE_META,
  DIMENSIONS,
  DIMENSION_META,
  type BadgeId,
  type DimensionId,
} from "../engine/types";
import { Icon } from "./icons";
import { useCountUp } from "./shell";

/* ───────────────────────── interface labels ─────────────────────────
   Interface state, not story — it names affordances and supplies the non-colour
   redundancy for gold-versus-grey. Belongs in `UI_LABEL` in `shell.tsx`; local only
   because that file is being edited in parallel. */
const REWARD_LABEL = {
  earnedEyebrow: "Recognition earned",
  dismiss: "Continue",
  /** the board */
  boardTitle: "Recognition",
  boardOf: "of",
  boardCaption: "Six ways of working the game notices. You keep whichever you earn.",
  /** per-slot state, said in words as well as in gold */
  earned: "Earned",
  locked: "Not yet earned",
  /** how a locked slot names its goal without predicting anything */
  toEarn: "Awarded when:",
  /** the tally */
  tallyTitle: "Where you stand",
  up: "up",
  down: "down",
};

/**
 * Local stylesheet.
 *
 * Every rule is specific to these three surfaces, and this agent owns two files, so it
 * is injected rather than added to `index.css`.
 *
 * The motion lives **inside** `@media (prefers-reduced-motion: no-preference)` rather
 * than being declared and then overridden under `reduce`. The default state of every
 * element below is its *final* state; animation is the addition. That way reduced motion
 * cannot leave anything stranded at a `from` frame, which is the usual failure — and the
 * static frame is fully legible: badge, numeral and copy all at full opacity.
 *
 * Numbers are the researched ones: pop 0.8 → 1.06 → 1.0 over 420ms; stat cards slide up
 * 200ms ease-out, staggered; burst ~900ms; confetti 1,500ms, opaque through the first
 * 60% of travel. Nothing here delays the next decision by more than 1.5s, and the whole
 * celebration is skippable with a click.
 */
const CSS = `
.rw-pop, .rw-rise, .rw-card { opacity: 1; transform: none; }
.rw-scrim { animation: rw-fade 200ms linear both; }
.rw-burst-layer { display: none; }
@media (prefers-reduced-motion: no-preference) {
  .rw-burst-layer { display: block; }
  .rw-pop { animation: rw-pop 420ms cubic-bezier(0.22, 1.2, 0.36, 1) var(--d, 0ms) both; }
  .rw-rise { animation: rw-rise 320ms ease-out var(--d, 0ms) both; }
  .rw-card { animation: rw-rise 200ms ease-out var(--d, 0ms) both; }
  .rw-rays { animation: rw-rays 900ms cubic-bezier(0.2, 0.7, 0.2, 1) 120ms both; }
  .rw-ring { animation: rw-ring 820ms cubic-bezier(0.2, 0.7, 0.2, 1) 160ms both; }
  .rw-shimmer { animation: rw-shimmer 1100ms cubic-bezier(0.3, 0, 0.2, 1) 240ms both; }
  .rw-confetto { animation: rw-confetto 1500ms cubic-bezier(0.25, 0.6, 0.3, 1) var(--d, 0ms) both; }
  .rw-bar { transition: transform 900ms cubic-bezier(0.65, 0, 0.35, 1) var(--d, 0ms); }
}
@keyframes rw-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes rw-pop {
  0%   { opacity: 0; transform: scale(0.8); }
  62%  { opacity: 1; transform: scale(1.06); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes rw-rise {
  from { opacity: 0; transform: translate3d(0, 12px, 0); }
  to   { opacity: 1; transform: none; }
}
@keyframes rw-ring {
  from { opacity: 0.85; transform: scale(0.55); }
  to   { opacity: 0; transform: scale(1.9); }
}
@keyframes rw-rays {
  from { opacity: 0; transform: rotate(-24deg) scale(0.6); }
  55%  { opacity: 0.7; }
  to   { opacity: 0; transform: rotate(18deg) scale(1.35); }
}
@keyframes rw-shimmer {
  from { opacity: 1; transform: translateX(-140%); }
  90%  { opacity: 1; }
  to   { opacity: 0; transform: translateX(340%); }
}
@keyframes rw-confetto {
  0%   { opacity: 1; transform: translate3d(0, 0, 0) rotate(0deg); }
  60%  { opacity: 1; }
  100% { opacity: 0; transform: translate3d(var(--dx), var(--dy), 0) rotate(var(--dr)); }
}
`;

function useRewardStyles() {
  useEffect(() => {
    const id = "gpl-reward-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = CSS;
    document.head.append(el);
  }, []);
}

/** A stagger, expressed as data rather than as five near-identical classes. */
const at = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/* ═══════════════════════════ 0. the burst, on its own ═══════════════════════════ */

/**
 * Rays, one expanding ring and 36 pieces of CSS confetti, centred on its own box.
 *
 * Separated from the modal so the same celebration can later play over the journey map,
 * where the reward is meant to land as well — that is a one-line reuse rather than a
 * rewrite. It is `pointer-events-none` throughout, so it never eats the click that
 * dismisses whatever it is decorating.
 *
 * No confetti library. 36 absolutely-positioned spans on one keyframe is a few hundred
 * bytes; the smallest library for this is several kilobytes of canvas, and the bundle
 * budget is 101 kB.
 */
export function Celebration({
  /** the size of the ring and rays; confetti travels beyond it */
  size = 132,
  className,
}: {
  size?: number;
  className?: string;
}) {
  useRewardStyles();
  /* Deterministic — no `Math.random`. Even in the UI, a reward that looks different on
     every replay of the same run is a small lie about the same event. */
  const pieces = Array.from({ length: 36 }, (_, i) => {
    const angle = (i / 36) * Math.PI * 2 + (i % 3) * 0.14;
    const reach = 150 + (i % 5) * 34;
    return {
      dx: Math.cos(angle) * reach,
      dy: Math.sin(angle) * reach + (i % 4) * 22,
      dr: `${((i % 7) - 3) * 110}deg`,
      delay: (i % 6) * 40,
      tone:
        i % 3 === 0
          ? "var(--color-reward)"
          : i % 3 === 1
            ? "var(--color-energy)"
            : "var(--color-glow-ink)",
      long: i % 2 === 0,
    };
  });

  return (
    <span
      aria-hidden="true"
      className={`rw-burst-layer pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <span
        className="rw-rays absolute rounded-full"
        style={{
          inset: -size / 3,
          background:
            "conic-gradient(from 0deg, color-mix(in oklab, var(--color-reward) 62%, transparent) 0 6deg, transparent 6deg 30deg)",
          maskImage: "radial-gradient(closest-side, transparent 46%, #000 54%, transparent 92%)",
          WebkitMaskImage:
            "radial-gradient(closest-side, transparent 46%, #000 54%, transparent 92%)",
        }}
      />
      <span
        className="rw-ring absolute inset-0 rounded-full"
        style={{ border: "2px solid color-mix(in oklab, var(--color-reward) 70%, transparent)" }}
      />
      {pieces.map((p, i) => (
        <span
          key={i}
          className="rw-confetto absolute top-1/2 left-1/2 rounded-[1px]"
          style={{
            width: p.long ? 4 : 6,
            height: p.long ? 10 : 6,
            background: p.tone,
            "--dx": `${p.dx}px`,
            "--dy": `${p.dy}px`,
            "--dr": p.dr,
            ...at(p.delay),
          } as React.CSSProperties}
        />
      ))}
    </span>
  );
}

/* ═══════════════════════════ 1. the interruption ═══════════════════════════ */

/**
 * The pop-up the client says is missing.
 *
 * It interrupts on purpose: a reward that waits politely until the end of the beat is not
 * a reward, it is a receipt. One badge at a time — if the engine awards two at once the
 * caller shows them in sequence, because two medals on one screen halves both.
 */
export function BadgeEarned({
  badge,
  onDismiss,
}: {
  badge: BadgeId;
  onDismiss: () => void;
}) {
  useRewardStyles();
  const meta = BADGE_META[badge];
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /* Real focus management: remember where focus was, take it, trap it, give it back. */
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onDismiss();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      previous?.focus?.();
    };
  }, [badge, onDismiss]);

  return (
    <div
      className="rw-scrim fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        background: "color-mix(in oklab, var(--color-stage) 82%, transparent)",
        backdropFilter: "blur(6px)",
      }}
      /* Skippable: anywhere outside the panel dismisses. */
      onClick={onDismiss}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gpl-badge-title"
        aria-describedby="gpl-badge-note"
        onClick={(e) => e.stopPropagation()}
        className="rw-pop relative w-full max-w-[520px] overflow-hidden rounded-2xl border px-10 pt-11 pb-9 text-center"
        style={{
          background: "linear-gradient(168deg, var(--color-stage-raised) 0%, var(--color-stage) 86%)",
          borderColor: "color-mix(in oklab, var(--color-reward) 34%, var(--color-stage-line))",
          boxShadow: "0 30px 90px -20px color-mix(in oklab, var(--color-stage) 92%, transparent)",
        }}
      >
        {/* one pass of light across the panel, never repeated */}
        <span
          aria-hidden="true"
          className="rw-burst-layer pointer-events-none absolute inset-y-0 left-0 w-1/3"
        >
          <span
            className="rw-shimmer absolute inset-0 block"
            style={{
              background:
                "linear-gradient(100deg, transparent, color-mix(in oklab, var(--color-reward) 22%, transparent), transparent)",
            }}
          />
        </span>

        <div className="relative mx-auto h-[132px] w-[132px]">
          <Celebration size={132} />
          {/* the badge itself, large and gold */}
          <span
            className="absolute inset-0 flex items-center justify-center rounded-full border-2 text-(--color-reward)"
            style={{
              background:
                "radial-gradient(circle at 50% 34%, color-mix(in oklab, var(--color-reward) 34%, transparent), color-mix(in oklab, var(--color-reward) 10%, transparent) 70%)",
              borderColor: "color-mix(in oklab, var(--color-reward) 76%, transparent)",
            }}
          >
            <Icon name="trophy" size={66} />
          </span>
        </div>

        <p
          className="rw-rise mt-7 text-[13px] font-semibold tracking-[0.14em] uppercase text-(--color-reward)"
          style={at(200)}
        >
          {REWARD_LABEL.earnedEyebrow}
        </p>
        <h2
          id="gpl-badge-title"
          className="rw-rise mt-2 text-[32px] leading-[1.1] font-bold tracking-[-0.02em] text-(--color-stage-ink)"
          style={at(260)}
        >
          {meta.label}
        </h2>
        <p
          id="gpl-badge-note"
          className="rw-rise mx-auto mt-3 max-w-[38ch] text-[15px] leading-[1.6] text-(--color-stage-ink-soft)"
          style={at(320)}
        >
          {meta.note}
        </p>

        {/* The lip, inline against `--color-brand-lip` because `.btn-game` is not in
            `index.css` yet — swap for the utility when it lands. */}
        <button
          ref={closeRef}
          type="button"
          onClick={onDismiss}
          className="rw-rise mt-8 w-full rounded-xl border-b-4 border-(--color-brand-lip) bg-(--color-glow) px-6 pt-3.5 pb-3 text-[15px] font-semibold text-white transition-[filter,transform] duration-100 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--color-energy) active:translate-y-[4px] active:border-b-0"
          style={{
            boxShadow: "0 10px 30px -14px color-mix(in oklab, var(--color-glow) 85%, transparent)",
            ...at(380),
          }}
        >
          {REWARD_LABEL.dismiss}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════ 2. the collection ═══════════════════════════ */

/**
 * Six slots, always six.
 *
 * The unearned ones are the point. A board showing only what you have collected says
 * nothing about what is available, so every locked slot names its badge and prints the
 * same `note` the earned state does, as its criterion. A silhouette with a question mark
 * would be a mystery, and a mystery motivates nobody thirty minutes into a learning game.
 */
export function RecognitionBoard({
  badges,
  titleId,
}: {
  /** straight from `badgeProgress(state)` — six entries, in the engine's own order */
  badges: readonly BadgeStatus[];
  titleId?: string;
}) {
  useRewardStyles();
  const count = badges.filter((b) => b.earned).length;

  return (
    <section
      aria-label={REWARD_LABEL.boardTitle}
      className="relative flex h-full min-h-[560px] w-full flex-col justify-center overflow-hidden bg-(--color-stage) px-12 py-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--color-glow) 38%, transparent), transparent 66%)",
        }}
      />

      <header className="relative flex items-end justify-between gap-8">
        <div>
          <h1
            id={titleId}
            className="text-[32px] font-bold tracking-[-0.025em] text-(--color-stage-ink)"
          >
            {REWARD_LABEL.boardTitle}
          </h1>
          <p className="mt-2 max-w-[46ch] text-[15px] text-(--color-stage-ink-soft)">
            {REWARD_LABEL.boardCaption}
          </p>
        </div>
        <p className="rw-pop flex items-baseline gap-2.5 whitespace-nowrap" style={at(60)}>
          <span
            className="text-[length:var(--text-hero)] leading-[0.9] font-bold tracking-[-0.04em] tabular-nums text-(--color-reward)"
            style={{
              textShadow: "0 0 48px color-mix(in oklab, var(--color-reward) 45%, transparent)",
            }}
          >
            {count}
          </span>
          <span className="text-[18px] font-semibold text-(--color-stage-ink-soft)">
            {REWARD_LABEL.boardOf} {badges.length}
          </span>
        </p>
      </header>

      {/* Flush-adjacent cells divided by 1px rules — the hairline is the grid's own
          background showing through a 1px gap, not six detached cards. */}
      <ul
        className="relative mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-(--color-stage-line)"
        style={{ background: "var(--color-stage-line)" }}
      >
        {badges.map((meta, i) => {
          const has = meta.earned;
          return (
            <li
              key={meta.id}
              className="rw-card flex flex-col gap-3 p-5"
              style={{
                background: has
                  ? "color-mix(in oklab, var(--color-reward) 9%, var(--color-stage-raised))"
                  : "var(--color-stage)",
                ...at(80 + i * 55),
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[1.5px]"
                  style={
                    has
                      ? {
                          background: "color-mix(in oklab, var(--color-reward) 20%, transparent)",
                          borderColor: "color-mix(in oklab, var(--color-reward) 72%, transparent)",
                          color: "var(--color-reward)",
                        }
                      : {
                          background: "color-mix(in oklab, var(--color-stage-ink) 6%, transparent)",
                          borderColor: "var(--color-stage-line)",
                          borderStyle: "dashed",
                          color: "color-mix(in oklab, var(--color-stage-ink-soft) 60%, transparent)",
                        }
                  }
                >
                  <Icon name={has ? "trophy" : "block"} size={24} />
                </span>
                {/* The state in words. Gold-versus-grey may not be the only carrier — E6,
                    and half the slots would otherwise be unreadable. */}
                <span
                  className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
                  style={
                    has
                      ? {
                          background: "color-mix(in oklab, var(--color-reward) 16%, transparent)",
                          color: "var(--color-reward)",
                        }
                      : { color: "var(--color-stage-ink-soft)" }
                  }
                >
                  {has && <Icon name="check" size={12} />}
                  {has ? REWARD_LABEL.earned : REWARD_LABEL.locked}
                </span>
              </div>
              <div>
                <h2
                  className={`text-[18px] font-bold tracking-[-0.01em] ${
                    has ? "text-(--color-stage-ink)" : "text-(--color-stage-ink-soft)"
                  }`}
                >
                  {meta.label}
                </h2>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-(--color-stage-ink-soft)">
                  {!has && (
                    <span className="font-semibold text-(--color-energy)">
                      {REWARD_LABEL.toEarn}{" "}
                    </span>
                  )}
                  {meta.note}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ═══════════════════════════ 3. the tally ═══════════════════════════ */

/**
 * Three cards that slide up one after another, each counting to its new value.
 *
 * The stagger is the production value and it is nearly free: one block that appears is
 * information, three cards that arrive in sequence is an event. 200ms ease-out each, 140ms
 * apart, which puts the last card in place at 480ms — well inside the 1.5s ceiling on
 * delaying the next decision.
 */
export function ScoreTally({
  to,
  from,
  className,
}: {
  to: Record<DimensionId, number>;
  from?: Record<DimensionId, number>;
  className?: string;
}) {
  useRewardStyles();
  return (
    <div
      aria-label={REWARD_LABEL.tallyTitle}
      className={`flex items-stretch gap-3 ${className ?? ""}`}
    >
      {DIMENSIONS.map((dim, i) => (
        <TallyCard key={dim} dim={dim} to={to[dim]} from={from?.[dim]} index={i} />
      ))}
    </div>
  );
}

function TallyCard({
  dim,
  to,
  from,
  index,
}: {
  dim: DimensionId;
  to: number;
  from?: number;
  index: number;
}) {
  const meta = DIMENSION_META[dim];
  const delay = 140 + index * 140;
  /* `useCountUp` is the shell's, so this inherits the meters' easing and their
     reduced-motion behaviour: the value snaps to its final state, which is the right
     replacement because the number itself is the information. */
  const shown = useCountUp(to, from, delay);
  const delta = from === undefined ? 0 : to - from;
  /* The bar needs a start value to travel from, so it is painted at the old level for one
     frame and then set to the new one; the transition on `.rw-bar` does the rest, and
     under reduced motion there is no transition so it simply is at the new level. */
  const [level, setLevel] = useState(from ?? to);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLevel(to));
    return () => cancelAnimationFrame(id);
  }, [to]);
  const word = delta > 0 ? REWARD_LABEL.up : REWARD_LABEL.down;

  return (
    <div
      role="meter"
      aria-valuenow={to}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${meta.label}: ${to}${delta === 0 ? "" : `, ${word} ${Math.abs(delta)}`}`}
      className="rw-card flex min-w-[160px] flex-1 flex-col gap-2 rounded-xl border border-(--color-stage-line) bg-(--color-stage-raised) px-4 py-3.5"
      style={at(delay - 140)}
    >
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-(--color-stage-ink-soft)">
        <span aria-hidden="true" style={{ color: `var(${meta.fillVar})` }}>
          {meta.glyph}
        </span>
        {meta.label}
      </p>
      <p className="flex items-baseline gap-2">
        <span className="text-[32px] leading-none font-bold tracking-[-0.03em] tabular-nums text-(--color-stage-ink)">
          {shown}
        </span>
        {delta !== 0 && (
          <span
            className="text-[13px] font-semibold tabular-nums"
            /* Gold is the reward colour and may not double as "a meter fell", so a
               fall is the pale rose of the risk ramp — legible on the stage, where the
               solid red is not. */
            style={{ color: delta > 0 ? "var(--color-energy)" : "var(--color-risk-tint)" }}
          >
            {/* a glyph as well as a hue; the word itself is on the meter's label */}
            {delta > 0 ? "▲" : "▼"}
            {Math.abs(delta)}
          </span>
        )}
      </p>
      {/* the bar grows in sync with the count */}
      <span
        aria-hidden="true"
        className="mt-0.5 block h-1.5 overflow-hidden rounded-full"
        style={{ background: "color-mix(in oklab, var(--color-stage-ink) 12%, transparent)" }}
      >
        <span
          className="rw-bar block h-full w-full origin-left rounded-full"
          style={{
            background: `var(${meta.fillVar})`,
            transform: `scaleX(${level / 100})`,
            ...at(delay),
          }}
        />
      </span>
    </div>
  );
}
