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
import { Icon, SectionTitle, type Tone } from "./icons";

export const artUrl = (name: string) => `${import.meta.env.BASE_URL}art/${name}.webp`;

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
              style={{ background: active ? "var(--color-accent-tint)" : "transparent" }}
              aria-current={active ? "step" : undefined}
            >
              <span
                aria-hidden="true"
                className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-bold transition-colors duration-300"
                style={{
                  background: active
                    ? "var(--color-accent)"
                    : done
                      ? "var(--color-good)"
                      : "var(--color-canvas-deep)",
                  color: active || done ? "#fff" : "var(--color-faint)",
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
                      ? "var(--color-ink-soft)"
                      : "var(--color-faint)",
                }}
              >
                {c.label}
              </span>
            </span>
            {i < chapters.length - 1 && (
              // The track fills behind you, so progress is legible without a label.
              <span
                aria-hidden="true"
                className="h-[2px] shrink-0 rounded-full"
                style={{
                  width: compact ? 8 : 20,
                  background: done ? "var(--color-good)" : "var(--color-line-strong)",
                }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ───────────────────────────── console frame ───────────────────────────── */

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
    <>
      <header className="flex h-14 shrink-0 items-center gap-6 border-b border-(--color-line) px-5">
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
          <span className="hidden text-[13px] font-semibold leading-tight text-(--color-ink) sm:block">
            Global Pursuit
            <span className="block text-[11px] font-medium text-(--color-faint)">League</span>
          </span>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center xl:flex">
          <ChapterStepper chapters={chapters} current={currentChapter} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          {showScore && (
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-(--color-warn)">
                <Icon name="flag" size={15} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-(--color-faint)">
                Score
              </span>
              <span className="text-[17px] font-bold tabular-nums text-(--color-accent-deep)">
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
  children,
}: {
  bars: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  bottom?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="lg:h-screen lg:p-3">
      <div
        className="flex min-h-screen flex-col overflow-hidden border-(--color-line) bg-(--color-surface) lg:min-h-0 lg:h-full lg:rounded-[18px] lg:border"
        style={{ boxShadow: "0 1px 2px rgb(20 18 31/0.04), 0 18px 50px rgb(20 18 31/0.08)" }}
      >
        {bars}

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {left && (
            <aside className="order-2 shrink-0 border-t border-(--color-line) p-4 lg:order-none lg:w-[248px] lg:overflow-y-auto lg:border-r lg:border-t-0">
              {left}
            </aside>
          )}
          <div
            data-work-area
            className="order-1 min-w-0 flex-1 lg:order-none lg:overflow-y-auto"
            style={{ background: "var(--color-canvas)" }}
          >
            {children}
          </div>
          {right && (
            <aside className="order-3 shrink-0 border-t border-(--color-line) p-4 lg:order-none lg:w-[264px] lg:overflow-y-auto lg:border-l lg:border-t-0">
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
  children,
}: {
  title?: string;
  icon?: IconId;
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-(--color-line) pt-3.5 first:border-t-0 first:pt-0">
      {title && (
        <SectionTitle icon={icon} tone={tone} className="mb-2.5">
          {title}
        </SectionTitle>
      )}
      {children}
    </section>
  );
}

/** Left rail: where you are, and who is talking to you. */
export function MissionRail({
  chapter,
  missionId,
  missionNumber,
  totalMissions,
  completed,
  advisor,
}: {
  chapter: Chapter;
  missionId: string | null;
  missionNumber: number;
  totalMissions: number;
  completed: string[];
  advisor?: Advisor;
}) {
  return (
    <div className="space-y-3.5">
      <div>
        <p className="text-[12px] font-bold text-(--color-accent)">Chapter {chapter.number}</p>
        <h2 className="mt-0.5 text-[18px] font-bold leading-tight text-(--color-ink)">
          {chapter.title}
        </h2>
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
                className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
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

      {advisor && <AdvisorCard advisor={advisor} />}
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
              background: "linear-gradient(135deg, var(--color-win), var(--color-accent-deep))",
            }}
          >
            {initials}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-bold text-(--color-ink)">{advisor.name}</p>
          <p className="truncate text-[11.5px] font-medium text-(--color-accent)">{advisor.role}</p>
        </div>
      </div>
      <p className="mt-3 border-l-2 border-(--color-accent-ring) pl-3 text-[13px] italic leading-relaxed text-(--color-ink-soft)">
        “{advisor.quote}”
      </p>
      {advisor.steer && (
        <p className="mt-2.5 border-l-2 border-(--color-accent-ring) pl-3 text-[13px] italic leading-relaxed text-(--color-ink-soft)">
          “{advisor.steer}”
        </p>
      )}
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
                className="text-[26px] font-bold leading-none tabular-nums"
                style={{ color: colour }}
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
  consider,
  advisorName,
  commits,
}: {
  dims: Record<DimensionId, number>;
  entries: LedgerEntry[];
  consider?: string[];
  advisorName?: string;
  /** what the currently selected option would add to the ledger */
  commits?: string;
}) {
  return (
    <div className="space-y-3.5">
      <RailCard title="Key factors" icon="chart">
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
          <p className="text-[12.5px] leading-snug text-(--color-ink-soft)">{commits}</p>
        </section>
      )}

      <RailCard title="Where you stand" icon="layers">
        {entries.length === 0 ? (
          <p className="text-[12.5px] leading-relaxed text-(--color-muted)">
            Nothing committed yet. Everything you learn and promise lands here.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => {
              const t = LEDGER_TONE[e.tone];
              return (
                <li key={e.label} className="flex gap-2">
                  <span
                    className="mt-[3px] shrink-0"
                    style={{
                      color:
                        e.tone === "good"
                          ? "var(--color-good)"
                          : e.tone === "bad"
                            ? "var(--color-bad)"
                            : "var(--color-accent)",
                    }}
                  >
                    <Icon name={t.icon} size={13} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-bold leading-snug text-(--color-ink)">
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

      {consider && consider.length > 0 && (
        <RailCard
          title={advisorName ? `${advisorName.split(" ")[0]} is asking` : "Open questions"}
          icon="talk"
          tone="warn"
        >
          <ul className="space-y-2.5">
            {consider.map((c) => (
              <li
                key={c}
                className="flex gap-2.5 text-[13px] leading-relaxed text-(--color-ink-soft)"
              >
                <span
                  aria-hidden="true"
                  className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-accent)"
                />
                {c}
              </li>
            ))}
          </ul>
        </RailCard>
      )}
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
export function PredictionStrip({
  prediction,
  onPredict,
}: {
  prediction: DimensionId | null;
  onPredict: (d: DimensionId) => void;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
      <span className="text-[12.5px] font-semibold text-(--color-ink-soft)">
        Before you commit — what will this cost most?
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
              className="rounded-lg border px-2.5 py-1 text-[12px] font-bold transition-colors"
              style={{
                borderColor: on ? `var(${meta.varName})` : "var(--color-line-strong)",
                background: on ? `var(${meta.varName})` : "var(--color-surface)",
                color: on ? "#fff" : `var(${meta.varName})`,
              }}
            >
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ActionBar({
  label,
  onAction,
  disabled,
  children,
}: {
  label: string;
  onAction: () => void;
  disabled?: boolean;
  /** left-hand content — the prediction strip on a decide screen */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-3 border-t border-(--color-line) bg-(--color-surface) px-5 py-3">
      {children}
      <div className="ml-auto shrink-0">
        <button
          onClick={onAction}
          disabled={disabled}
          className="rounded-xl px-6 py-2.5 text-[14.5px] font-semibold transition-all duration-150 enabled:text-white enabled:shadow-[0_6px_18px_rgb(109_53_232/0.28)] enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 disabled:cursor-not-allowed"
          style={
            disabled
              ? { background: "var(--color-accent-tint)", color: "var(--color-accent-ring)" }
              : { background: "var(--color-accent)" }
          }
        >
          {label}
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
        className="rounded-xl px-6 py-3 text-[15px] font-semibold transition-all duration-150 enabled:text-white enabled:shadow-[0_6px_18px_rgb(109_53_232/0.28)] enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 disabled:cursor-not-allowed"
        style={
          disabled
            ? { background: "var(--color-accent-tint)", color: "var(--color-accent-ring)" }
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
        <p className="text-[12.5px] leading-snug text-(--color-ink-soft)">{meta.note}</p>
      </div>
    </div>
  );
}

export function scoreOf(dims: Record<DimensionId, number>): number {
  return Math.round((dims.win + dims.profit + dims.deliver) / 3);
}
