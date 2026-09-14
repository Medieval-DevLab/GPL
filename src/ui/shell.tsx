/**
 * The game frame.
 *
 * Everything persistent lives here: the chapter stepper across the top, the
 * mission rail on the left, the read-out on the right, and the confirm bar
 * pinned to the bottom. The centre column is the only thing that changes
 * between beats, which is what makes this feel like one continuous game
 * rather than a sequence of pages.
 *
 * Layout: three columns at xl, two at lg (the right rail folds under the
 * centre), one on a phone (both rails fold, in reading order).
 */

import {
  BADGE_META,
  DIMENSIONS,
  DIMENSION_META,
  type Advisor,
  type BadgeId,
  type Chapter,
  type DimensionId,
} from "../engine/types";
import { Icon } from "./icons";

/* ─────────────────────────── chapter stepper ─────────────────────────── */

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
  return (
    <ol className="flex items-center gap-1" aria-label="Chapters">
      {chapters.map((c, i) => {
        const done = c.number < current;
        const active = c.number === current;
        const showLabel = !compact || active;
        return (
          <li key={c.number} className="flex shrink-0 items-center gap-1">
            <span
              className={`flex items-center gap-2 whitespace-nowrap rounded-full py-1 pl-1 transition-colors duration-300 ${showLabel ? "pr-3" : "pr-1"}`}
              style={{
                background: active ? "var(--color-accent-tint)" : "transparent",
              }}
              aria-current={active ? "step" : undefined}
            >
              <span
                aria-hidden="true"
                className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-bold transition-colors duration-300"
                style={{
                  background: active
                    ? "var(--color-accent)"
                    : done
                      ? "var(--color-accent-ring)"
                      : "var(--color-canvas-deep)",
                  color: active ? "#fff" : done ? "var(--color-accent-deep)" : "var(--color-faint)",
                }}
              >
                {done ? <Icon name="check" size={12} /> : c.number}
              </span>
              <span
                className={`text-[11px] font-bold uppercase tracking-[0.08em] ${showLabel ? "" : "sr-only"}`}
                style={{
                  color: active
                    ? "var(--color-accent-deep)"
                    : done
                      ? "var(--color-muted)"
                      : "var(--color-faint)",
                }}
              >
                {c.label}
              </span>
            </span>
            {i < chapters.length - 1 && (
              <span
                aria-hidden="true"
                className="h-px shrink-0"
                style={{ width: compact ? 8 : 16, background: "var(--color-line-strong)" }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ───────────────────────────── top bar ───────────────────────────── */

export function TopBar({
  chapters,
  currentChapter,
  score,
  showScore,
  onRestart,
}: {
  chapters: Chapter[];
  currentChapter: number;
  score: number;
  showScore: boolean;
  onRestart: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-(--color-line) backdrop-blur-xl"
      style={{ background: "rgb(255 255 255 / 0.85)" }}
    >
      <div className="mx-auto flex max-w-[1500px] items-center gap-6 px-5 py-2.5">
        <div className="flex shrink-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[13px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
            }}
          >
            GPL
          </span>
          <span className="hidden text-[13px] font-semibold leading-tight text-(--color-ink) sm:block">
            Global Pursuit
            <span className="block text-[11px] font-medium text-(--color-faint)">League</span>
          </span>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center overflow-x-auto xl:flex">
          <ChapterStepper chapters={chapters} current={currentChapter} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {showScore && (
            <div
              className="flex items-center gap-2 rounded-full border border-(--color-line) px-3 py-1.5"
              style={{ background: "var(--color-surface)" }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-(--color-faint)">
                Score
              </span>
              <span className="text-[15px] font-bold tabular-nums text-(--color-accent-deep)">
                {score}
              </span>
            </div>
          )}
          <button
            onClick={onRestart}
            className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-(--color-muted) transition-colors hover:bg-(--color-canvas-deep) hover:text-(--color-ink)"
          >
            Start over
          </button>
        </div>
      </div>

      <div className="flex justify-center border-t border-(--color-line) px-5 py-2 xl:hidden">
        <ChapterStepper chapters={chapters} current={currentChapter} compact />
      </div>
    </header>
  );
}

/* ───────────────────────────── rail pieces ───────────────────────────── */

export function RailCard({
  title,
  icon,
  children,
  accent = false,
}: {
  title?: string;
  icon?: Parameters<typeof Icon>[0]["name"];
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className="rounded-[14px] border p-4"
      style={{
        borderColor: accent ? "var(--color-accent-ring)" : "var(--color-line)",
        background: accent ? "var(--color-accent-tint)" : "var(--color-surface)",
      }}
    >
      {title && (
        <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-(--color-faint)">
          {icon && <Icon name={icon} size={13} />}
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

/** Left rail: where you are, what you are here to do, and who is advising you. */
export function MissionRail({
  chapter,
  missionId,
  missionNumber,
  totalMissions,
  completed,
  objective,
  minutes,
  advisor,
}: {
  chapter: Chapter;
  missionId: string | null;
  missionNumber: number;
  totalMissions: number;
  completed: string[];
  objective?: string;
  minutes?: number;
  advisor?: Advisor;
}) {
  return (
    <div className="space-y-3.5">
      <div>
        <p className="eyebrow" style={{ color: "var(--color-accent)" }}>
          Chapter {chapter.number}
        </p>
        <h2 className="display mt-1 text-[21px] text-(--color-ink)">{chapter.title}</h2>
        <p className="mt-1.5 text-[12px] font-medium text-(--color-muted) tabular-nums">
          Mission {missionNumber} of {totalMissions}
        </p>
      </div>

      <ol className="space-y-1">
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
                className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border"
                style={{
                  borderColor: done
                    ? "var(--color-good)"
                    : active
                      ? "var(--color-accent)"
                      : "var(--color-line-strong)",
                  background: done
                    ? "var(--color-good)"
                    : active
                      ? "var(--color-accent)"
                      : "transparent",
                  color: "#fff",
                }}
              >
                {done ? (
                  <Icon name="check" size={11} />
                ) : active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : null}
              </span>
              <span
                className="text-[13px] leading-snug"
                style={{
                  color: active
                    ? "var(--color-accent-deep)"
                    : done
                      ? "var(--color-muted)"
                      : "var(--color-faint)",
                  fontWeight: active ? 600 : 500,
                }}
              >
                {chapter.steps[i] ?? `Mission ${i + 1}`}
              </span>
            </li>
          );
        })}
      </ol>

      {objective && (
        <RailCard title="Your objective" icon="target">
          <p className="text-[13.5px] leading-relaxed text-(--color-ink-soft)">{objective}</p>
          {minutes !== undefined && (
            <p className="mt-2.5 flex items-center gap-1.5 border-t border-(--color-line) pt-2.5 text-[12px] text-(--color-muted)">
              <Icon name="clock" size={13} />
              About {minutes} min
            </p>
          )}
        </RailCard>
      )}

      {advisor && <AdvisorCard advisor={advisor} />}
    </div>
  );
}

export function AdvisorCard({ advisor }: { advisor: Advisor }) {
  const initials = advisor.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <RailCard title="Team discussion" icon="people">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-win), var(--color-accent-deep))",
          }}
        >
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-(--color-ink)">{advisor.name}</p>
          <p className="truncate text-[11.5px] text-(--color-muted)">{advisor.role}</p>
        </div>
      </div>
      <p className="mt-2.5 text-[13px] italic leading-relaxed text-(--color-ink-soft)">
        “{advisor.quote}”
      </p>
    </RailCard>
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
        const colour = `var(${meta.varName})`;
        const delta = deltas?.[d] ?? 0;
        const moved = showDeltas && delta !== 0;
        return (
          <div key={d}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span
                className="flex items-center gap-1.5 text-[12px] font-semibold"
                style={{ color: colour }}
              >
                <span aria-hidden="true" className="text-[8px]">
                  {meta.glyph}
                </span>
                {meta.label}
              </span>
              <span className="flex items-baseline gap-1.5">
                {moved && (
                  <span
                    className="anim-pop rounded-full px-1.5 text-[11px] font-bold tabular-nums"
                    style={{
                      color: delta > 0 ? "var(--color-good)" : "var(--color-bad)",
                      background: delta > 0 ? "#e4f5ef" : "#fbeaea",
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
                style={{ width: `${dims[d]}%`, background: colour }}
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
        const colour = `var(${meta.varName})`;
        const delta = deltas?.[d] ?? 0;
        const moved = showDeltas && delta !== 0;
        return (
          <div key={d}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span
                className="flex items-center gap-1.5 text-[13px] font-bold"
                style={{ color: colour }}
              >
                <span aria-hidden="true" className="text-[9px]">
                  {meta.glyph}
                </span>
                {meta.label}
              </span>
              {moved && (
                <span
                  className="anim-pop rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
                  style={{
                    color: delta > 0 ? "var(--color-good)" : "var(--color-bad)",
                    background: delta > 0 ? "#e4f5ef" : "#fbeaea",
                  }}
                >
                  {delta > 0 ? "+" : ""}
                  {delta}
                </span>
              )}
            </div>
            <div className="mb-1.5 flex items-baseline gap-1">
              <span className="text-[26px] font-bold leading-none tabular-nums" style={{ color: colour }}>
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
                style={{ width: `${dims[d]}%`, background: colour }}
              />
            </div>
            <p className="mt-2 text-[12.5px] text-(--color-muted)">{meta.question}</p>
          </div>
        );
      })}
    </div>
  );
}

/** Right rail: the read-out, the open questions, and what you have banked. */
export function InsightRail({
  dims,
  consider,
  badges,
  knownCount,
}: {
  dims: Record<DimensionId, number>;
  consider?: string[];
  badges: BadgeId[];
  knownCount: number;
}) {
  return (
    <div className="space-y-3.5">
      <RailCard title="Key factors" icon="chart">
        <FactorBars dims={dims} />
      </RailCard>

      {consider && consider.length > 0 && (
        <RailCard title="Things to consider" icon="spark">
          <ul className="space-y-2">
            {consider.map((c) => (
              <li key={c} className="flex gap-2 text-[13px] leading-relaxed text-(--color-ink-soft)">
                <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-(--color-accent-ring)" />
                {c}
              </li>
            ))}
          </ul>
        </RailCard>
      )}

      <RailCard title="Learning in progress" icon="flag">
        <p className="text-[12.5px] leading-relaxed text-(--color-muted)">
          {knownCount > 0 ? (
            <>
              <span className="font-bold text-(--color-ink)">{knownCount}</span> thing
              {knownCount === 1 ? "" : "s"} you found out are still in play.
            </>
          ) : (
            "What you learn early changes what happens later."
          )}
        </p>
        {badges.length > 0 && (
          <ul className="mt-2.5 space-y-1.5 border-t border-(--color-line) pt-2.5">
            {badges.map((b) => (
              <li
                key={b}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-(--color-accent-deep)"
              >
                <span aria-hidden="true">★</span>
                {BADGE_META[b].label}
              </li>
            ))}
          </ul>
        )}
      </RailCard>
    </div>
  );
}

/* ───────────────────────────── layout ───────────────────────────── */

export function GameLayout({
  left,
  right,
  bottom,
  children,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** Spans every column and stays pinned — the action bar belongs to the page. */
  bottom?: React.ReactNode;
  children: React.ReactNode;
}) {
  /* On a phone the rails stack, and putting them first buries the headline
     half a screen down. Explicit order puts the mission first there and
     restores the source order once there are real columns.
     The action bar sits OUTSIDE the grid: a sticky grid item is constrained to
     its own grid area, which has no room to move, so it would never pin. */
  return (
    <>
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 items-start gap-x-6 gap-y-6 px-4 pt-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-6 xl:grid-cols-[250px_minmax(0,1fr)_270px]">
        {left && (
          <aside className="anim-fade order-2 lg:sticky lg:top-[72px] lg:order-none">{left}</aside>
        )}
        <div className="order-1 min-w-0 lg:order-none">{children}</div>
        {right && (
          <aside className="anim-fade order-3 xl:sticky xl:top-[72px] lg:order-none">{right}</aside>
        )}
      </div>
      {bottom}
    </>
  );
}

/** Sticky action bar. The tip sits beside the button so it is read, not buried. */
export function ActionBar({
  tip,
  hint,
  label,
  onAction,
  disabled,
}: {
  tip?: string;
  hint?: string;
  label: string;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="sticky bottom-0 z-20 mt-6 border-t border-(--color-line) backdrop-blur-xl"
      style={{ background: "rgb(255 255 255 / 0.9)" }}
    >
      {/* Stacks on a phone. Side by side, the tip gets squeezed into a two-word
          column and the hint lands on top of it. */}
      <div className="mx-auto flex max-w-[1500px] flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-5 lg:px-6">
        {tip && (
          <p className="flex min-w-0 items-start gap-2 text-[12.5px] leading-snug text-(--color-muted) sm:flex-1">
            <span className="mt-px shrink-0 text-(--color-accent)">
              <Icon name="spark" size={14} />
            </span>
            <span>
              <span className="font-semibold text-(--color-ink-soft)">Tip. </span>
              {tip}
            </span>
          </p>
        )}
        <div className="flex shrink-0 items-center justify-end gap-3 sm:ml-auto">
          {hint && <span className="text-[12.5px] text-(--color-muted)">{hint}</span>}
          <button
            onClick={onAction}
            disabled={disabled}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14.5px] font-semibold text-white shadow-[0_6px_18px_rgb(109_53_232/0.28)] transition-all duration-150 enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_10px_26px_rgb(109_53_232/0.34)] enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
            style={{ background: disabled ? "var(--color-faint)" : "var(--color-accent)" }}
          >
            {label}
            <span aria-hidden="true">→</span>
          </button>
        </div>
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
        className="flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold text-white shadow-[0_6px_18px_rgb(109_53_232/0.28)] transition-all duration-150 enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_10px_26px_rgb(109_53_232/0.34)] enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
        style={{ background: disabled ? "var(--color-faint)" : "var(--color-accent)" }}
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
      <span aria-hidden="true" className="mt-0.5 text-[15px]">
        ★
      </span>
      <div>
        <p className="text-[13px] font-bold text-(--color-accent-deep)">{meta.label}</p>
        <p className="text-[12.5px] leading-snug text-(--color-ink-soft)">{meta.note}</p>
      </div>
    </div>
  );
}

export function scoreOf(dims: Record<DimensionId, number>): number {
  return Math.round((dims.win + dims.profit + dims.deliver) / 3);
}
