/** Persistent chrome: wordmark, stage rail, the three meters, recognition. */

import {
  BADGE_META,
  DIMENSIONS,
  DIMENSION_META,
  STAGES,
  type BadgeId,
  type DimensionId,
  type StageId,
} from "../engine/types";

/* ───────────────────────────── meters ───────────────────────────── */

function meterColour(d: DimensionId): string {
  return `var(${DIMENSION_META[d].varName})`;
}

export function Meter({
  dim,
  value,
  delta,
  showDelta = false,
  size = "sm",
}: {
  dim: DimensionId;
  value: number;
  delta?: number;
  showDelta?: boolean;
  size?: "sm" | "lg";
}) {
  const meta = DIMENSION_META[dim];
  const colour = meterColour(dim);
  const big = size === "lg";
  const moved = showDelta && delta !== undefined && delta !== 0;

  return (
    <div className={big ? "w-full" : "w-[112px]"}>
      <div
        className="mb-1.5 flex items-center justify-between gap-2"
        style={{ minHeight: big ? 24 : 18 }}
      >
        <span
          className={`flex items-center gap-1.5 font-semibold ${big ? "text-[13px]" : "text-[11px]"}`}
          style={{ color: colour }}
        >
          <span aria-hidden="true" className={big ? "text-[10px]" : "text-[8px]"}>
            {meta.glyph}
          </span>
          {big ? meta.label : meta.label.slice(0, 3)}
        </span>
        {moved && (
          <span
            className="anim-pop rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
            style={{
              color: delta! > 0 ? "var(--color-good)" : "var(--color-bad)",
              background: delta! > 0 ? "#e4f5ef" : "#fbeaea",
            }}
          >
            {delta! > 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </div>

      <div
        className={`relative w-full overflow-hidden rounded-full ${big ? "h-2.5" : "h-1.5"}`}
        style={{ background: "var(--color-canvas-deep)" }}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${meta.label}: ${value} out of 100`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
          style={{ width: `${value}%`, background: colour }}
        />
      </div>

      {big && <p className="mt-1.5 text-[12px] text-(--color-muted)">{meta.question}</p>}
    </div>
  );
}

export function MeterRow({
  dims,
  deltas,
  showDeltas = false,
  size = "sm",
}: {
  dims: Record<DimensionId, number>;
  deltas?: Record<DimensionId, number>;
  showDeltas?: boolean;
  size?: "sm" | "lg";
}) {
  return (
    <div className={size === "lg" ? "grid gap-6 sm:grid-cols-3" : "flex items-start gap-4"}>
      {DIMENSIONS.map((d) => (
        <Meter
          key={d}
          dim={d}
          value={dims[d]}
          delta={deltas?.[d]}
          showDelta={showDeltas}
          size={size}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────── stage rail ─────────────────────────── */

export function StageRail({ current }: { current: StageId | null }) {
  const currentIndex = current ? STAGES.findIndex((s) => s.id === current) : -1;

  return (
    <ol
      className="flex items-center gap-1 overflow-x-auto"
      aria-label="Progress through the client journey"
    >
      {STAGES.map((s, i) => {
        const done = currentIndex > i;
        const active = currentIndex === i;
        return (
          <li key={s.id} className="flex shrink-0 items-center gap-1">
            <span
              className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors duration-300"
              style={{
                background: active
                  ? "var(--color-accent)"
                  : done
                    ? "var(--color-accent-tint)"
                    : "transparent",
                color: active
                  ? "#fff"
                  : done
                    ? "var(--color-accent-deep)"
                    : "var(--color-faint)",
              }}
              aria-current={active ? "step" : undefined}
            >
              {s.label}
            </span>
            {i < STAGES.length - 1 && (
              <span aria-hidden="true" className="text-(--color-line-strong)">
                ·
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ─────────────────────────── top bar ─────────────────────────── */

export function TopBar({
  dims,
  stage,
  missionNumber,
  totalMissions,
  onRestart,
  showMeters,
}: {
  dims: Record<DimensionId, number>;
  stage: StageId | null;
  missionNumber: number | null;
  totalMissions: number;
  onRestart: () => void;
  showMeters: boolean;
}) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-(--color-line) backdrop-blur-xl"
      style={{ background: "rgb(255 255 255 / 0.82)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <div className="flex items-center gap-3">
          <span
            className="display text-[20px] tracking-tight"
            style={{ color: "var(--color-accent-deep)" }}
          >
            GPL
          </span>
          {missionNumber !== null && (
            <span className="text-[12px] font-medium text-(--color-muted) tabular-nums">
              {missionNumber} / {totalMissions}
            </span>
          )}
        </div>

        <div className="hidden lg:block">
          <StageRail current={stage} />
        </div>

        <div className="ml-auto flex items-center gap-5">
          {showMeters && <MeterRow dims={dims} />}
          <button
            onClick={onRestart}
            className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-(--color-muted) transition-colors hover:bg-(--color-canvas-deep) hover:text-(--color-ink)"
          >
            Start over
          </button>
        </div>
      </div>

      <div className="border-t border-(--color-line) px-5 py-2 lg:hidden">
        <StageRail current={stage} />
      </div>
    </header>
  );
}

/* ─────────────────────────── recognition ─────────────────────────── */

export function BadgeChip({ id, animate = false }: { id: BadgeId; animate?: boolean }) {
  const meta = BADGE_META[id];
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${animate ? "anim-pop" : ""}`}
      style={{
        borderColor: "var(--color-accent-ring)",
        background: "var(--color-accent-tint)",
      }}
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

/* ─────────────────────────── primitives ─────────────────────────── */

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
        className="rounded-xl px-6 py-3 text-[15px] font-semibold text-white shadow-[0_6px_18px_rgb(109_53_232/0.28)] transition-all duration-150 enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_10px_26px_rgb(109_53_232/0.34)] enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
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
