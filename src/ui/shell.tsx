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
import { Icon, IconTile, SectionTitle, type Tone } from "./icons";

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

        <div className="ml-auto flex shrink-0 items-center gap-4">
          {showScore && (
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-(--color-warn)">
                <Icon name="trophy" size={17} />
              </span>
              <span className="text-[15px] font-medium text-(--color-ink-soft)">Score</span>
              <span className="text-[18px] font-bold tabular-nums text-(--color-accent-deep)">
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
              background: "linear-gradient(135deg, var(--color-win), var(--color-accent-deep))",
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
        const colour = `var(${meta.varName})`;
        const delta = deltas?.[d] ?? 0;
        const moved = showDeltas && delta !== 0;
        return (
          <div key={d}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span
                className="flex items-center gap-2 text-[13px] font-bold"
                style={{ color: colour }}
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
            <summary className="cursor-pointer list-none text-[13px] text-(--color-muted)">
              <span className="font-bold text-(--color-ink)">{entries.length}</span> things in
              play <span className="text-(--color-accent)">— show</span>
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
export function PredictionStrip({
  prediction,
  onPredict,
}: {
  prediction: DimensionId | null;
  onPredict: (d: DimensionId) => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
      <span className="text-[13px] font-semibold text-(--color-ink-soft)">
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
  aside,
  children,
}: {
  label: string;
  onAction: () => void;
  disabled?: boolean;
  /**
   * The colleague's practical steer. The mockups carry an unattributed "Tip" in this
   * slot; we keep their treatment — portrait, label, two lines — but the label is a
   * person's name, because the interface does not get to tell the player what to think.
   */
  aside?: { from: string; text: string; photo?: string };
  /** left-hand content — the prediction strip on a decide screen */
  children?: React.ReactNode;
}) {
  return (
    <div data-region="commit" className="flex min-h-[66px] shrink-0 items-center gap-x-5 gap-y-2 border-t border-(--color-line) bg-(--color-surface) px-5 py-2.5">
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
      <div className="ml-auto shrink-0">
        <button
          onClick={onAction}
          disabled={disabled}
          className="flex h-[48px] min-w-[280px] items-center justify-center gap-2.5 rounded-[12px] px-8 text-[15px] font-bold transition-colors duration-150 enabled:text-white disabled:cursor-not-allowed"
          style={
            disabled
              ? { background: "var(--color-accent-tint)", color: "var(--color-accent-deep)" }
              : { background: "var(--color-accent)" }
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
