/**
 * The performance dashboard — how the run actually went.
 *
 * It replaces a leaderboard, and the reason is architectural rather than aesthetic.
 * There is no backend — `runcode.test.ts` bans `fetch` outright — so a cohort ranking
 * would have to be invented, and an invented cohort is a lie a learner spots in about
 * four seconds. The benchmark here is the ACHIEVABLE RANGE instead: `reachableExtremes`
 * in `engine/analysis.ts` replays greedy policies and reports how far each meter can
 * actually be driven, every value of it witnessed by a real playthrough. "84 of a
 * reachable 100" answers *how well could this have gone*, which is the better question
 * and is one the game can answer honestly.
 *
 * WHAT IS DELIBERATELY ABSENT: any aggregate score. Not a mean of the meters, not a
 * letter grade, not a percentage of quality. One existed, four reviewers asked for its
 * removal independently, and a meter-greedy policy drove it to 100/100/100 without
 * reading a word (D-037). Level and XP survive because they measure turning up, not
 * quality. Prediction accuracy survives because it cannot be farmed: it is the player's
 * own pre-commit call on which meter would move least, scored after the fact.
 *
 * THE ARTEFACT is the arc. Every other surface shows a snapshot — three meters, now.
 * Only this one shows the SHAPE of the run: where it climbed, where it turned, and what
 * it cost to turn it. That is why the chart gets the centre of the screen and the
 * numerals get a band.
 *
 * NO RULES LIVE HERE. Everything is read off `GameState` through `engine/progress.ts`
 * and `engine/analysis.ts`. The two arithmetic operations this file performs — counting
 * how many recorded predictions were right, and finding the extremes of a drawn series
 * for the chart's text alternative — describe what is on screen rather than decide
 * anything, and neither feeds back into play.
 */

import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { reachableExtremes, type DimRange } from "../engine/analysis";
import {
  badgeProgress,
  chapters,
  levelFor,
  progressSummary,
  stars,
  type BadgeStatus,
  type ChapterProgress,
  type Stars,
} from "../engine/progress";
import {
  DIMENSIONS,
  DIMENSION_META,
  type Content,
  type DimensionId,
  type GameState,
} from "../engine/types";
import { story } from "../content/story";
import { Icon } from "./icons";
import { STAGE_TOKENS } from "./journey";
import { UI_LABEL } from "./shell";

const T = STAGE_TOKENS;

/**
 * The dimension colour that is legal on the dark ground, measured rather than assumed.
 *
 * The paper solids do not survive the move: `--color-deliver-solid` is #054e9e, which is
 * **2.34:1 against `--color-stage`** and fails 1.4.11 for a line that carries meaning.
 * The step-7 `-line` values clear it on all three — Winability 5.59, Profitability 5.19,
 * Deliverability 4.58 — and they sit within 1.2 stops of each other, so the three read as
 * one family instead of one bright line and two murky ones.
 *
 * `-line` is also the honest role name for what these are used as here: a stroke, a
 * marker and a bar edge. When the token layer grows a `--color-<dim>-stage` triad this
 * should point at that instead; see docs/DECISIONS.md.
 */
const onStage: Record<DimensionId, string> = {
  win: "var(--color-win-line)",
  profit: "var(--color-profit-line)",
  deliver: "var(--color-deliver-line)",
};

const wash = (colour: string, pct: number) =>
  `color-mix(in oklab, ${colour} ${pct}%, transparent)`;

/**
 * Computed once per content object, not once per open.
 *
 * `reachableExtremes` replays two greedy policies per starting advantage across the whole
 * story — a couple of thousand `playMission` calls. That is milliseconds, but it is
 * milliseconds of blocked main thread every time somebody opens this panel, and the
 * answer cannot change while the content object is the same one.
 */
const reachableCache = new WeakMap<Content, Record<DimensionId, DimRange>>();
function reachableFor(content: Content): Record<DimensionId, DimRange> {
  let hit = reachableCache.get(content);
  if (!hit) {
    hit = reachableExtremes(content);
    reachableCache.set(content, hit);
  }
  return hit;
}

/* ───────────────────────────── the numerals band ───────────────────────────── */

/**
 * A figure big enough to be read as a scoreboard.
 *
 * 96px for the one number the player came for and 72px for the other three — the two
 * display steps exist for exactly this and nothing else. Tabular, so nothing shifts
 * between a run of 9 and a run of 11.
 */
function Numeral({
  value,
  suffix,
  total,
  label,
  note,
  size,
  tone,
}: {
  value: string | number;
  suffix?: string;
  total?: number;
  label: string;
  note?: string;
  /** `none` is the not-yet state: a 96px em dash reads as a broken element, not a blank */
  size: "mega" | "hero" | "none";
  tone: string;
}) {
  const step =
    size === "mega" ? "var(--text-mega)" : size === "hero" ? "var(--text-hero)" : "var(--text-xl)";
  return (
    <div className="min-w-0">
      <p className="flex items-baseline gap-1.5">
        <span
          className="numeral"
          style={{
            fontSize: step,
            color: tone,
          }}
        >
          {value}
          {suffix && <span style={{ fontSize: "var(--text-xl)" }}>{suffix}</span>}
        </span>
        {total !== undefined && (
          <span
            className="tabular-nums"
            style={{ fontSize: "var(--text-md)", fontWeight: 700, color: T.inkSoft }}
          >
            {UI_LABEL.of} {total}
          </span>
        )}
      </p>
      <p
        className="mt-1 truncate"
        style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: T.ink }}
      >
        {label}
      </p>
      {note && (
        <p className="truncate" style={{ fontSize: "var(--text-xs)", color: T.inkSoft }}>
          {note}
        </p>
      )}
    </div>
  );
}

/* ───────────────────────────── the arc ───────────────────────────── */

/**
 * The chart's frame, in real pixels — measured from its box, never scaled into it.
 *
 * A `viewBox` that stretches to fit would have been three lines shorter and would have
 * put the axis type at 11.2px in the 739px case, under the 12px floor the scale sets.
 * So the canvas is sized to the box and the type stays at its authored step, which is
 * the same trade `ui/journey.tsx` makes when it fixes its track in pixels.
 *
 * `right` reserves the gutter the direct end labels live in: marker, name and value at
 * 13px bold comes to about 150px for "Deliverability", the longest of the three.
 */
const GUTTER = { left: 40, right: 168, top: 14, bottom: 34 };
const CHART_MIN = { w: 560, h: 236 };
/* 470 is what the 1024-tall case actually offers (512px of column, less the heading and
   its padding). Ceilinged rather than unbounded so a very tall window does not stretch a
   0–100 axis into a wall. */
const CHART_MAX_H = 470;

interface Frame {
  w: number;
  h: number;
  plotW: number;
  plotH: number;
}

function frameFor(width: number, height: number): Frame {
  const w = Math.max(CHART_MIN.w, width);
  const h = Math.min(CHART_MAX_H, Math.max(CHART_MIN.h, height));
  return { w, h, plotW: w - GUTTER.left - GUTTER.right, plotH: h - GUTTER.top - GUTTER.bottom };
}

/** One drawn series: a dimension, its points, and where its end label lands. */
interface Series {
  id: DimensionId;
  points: { x: number; y: number; value: number }[];
  labelY: number;
}

const yFor = (f: Frame, value: number) => GUTTER.top + f.plotH * (1 - value / 100);

/**
 * The marker shape, per dimension — the thing that stops the chart depending on colour.
 *
 * Diamond, circle and triangle are the same three forms as the ◆ ● ▲ glyphs the rest of
 * the game already uses for these meters, drawn rather than typeset so they sit exactly
 * on the vertex and do not fall back to a system font at 9px.
 */
function marker(id: DimensionId, x: number, y: number, r: number): string {
  if (id === "win") return `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`;
  if (id === "deliver")
    return `M${x} ${y - r}L${x + r * 0.95} ${y + r * 0.75}L${x - r * 0.95} ${y + r * 0.75}Z`;
  /* A circle, as a path, so all three markers are one element type. */
  return `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
}

/**
 * End labels, pushed apart so three converged lines do not print on top of each other.
 *
 * Runs end with the meters close together more often than not — that is what a trade-off
 * game does — and at 15px a pair less than 22px apart is unreadable. Ordered by value,
 * then relaxed downward and clamped, which is the cheapest correct answer for three
 * items and needs no measurement of the text.
 */
function spreadLabels(
  f: Frame,
  ends: { id: DimensionId; y: number }[],
): Record<DimensionId, number> {
  const gap = 26;
  const sorted = [...ends].sort((a, b) => a.y - b.y);
  const out = {} as Record<DimensionId, number>;
  let previous = -Infinity;
  for (const end of sorted) {
    const y = Math.max(end.y, previous + gap);
    out[end.id] = y;
    previous = y;
  }
  /* If the relaxation pushed the last one off the bottom, slide the whole stack back up. */
  const overflow = previous - (GUTTER.top + f.plotH);
  if (overflow > 0) for (const id of DIMENSIONS) out[id] = (out[id] as number) - overflow;
  return out;
}

/**
 * The chart's text alternative.
 *
 * A screen-reader user gets the shape in words rather than a bare "chart": where each
 * meter started, where it ended, and the extremes it passed through on the way. Written
 * from the same arrays the polylines are drawn from, so the two cannot disagree.
 */
function arcSummary(series: Series[], beats: number): string {
  const lines = series.map((s) => {
    const values = s.points.map((p) => p.value);
    const first = values[0] as number;
    const last = values[values.length - 1] as number;
    const low = Math.min(...values);
    const high = Math.max(...values);
    const direction = last > first ? "up" : last < first ? "down" : "level";
    return `${DIMENSION_META[s.id].label} started at ${first} and finished at ${last}, ${direction} over the run, ranging between ${low} and ${high}.`;
  });
  return `${UI_LABEL.arcTitle}: three lines across ${beats} ${UI_LABEL.beats}. ${lines.join(" ")}`;
}

/**
 * The box's own size, measured.
 *
 * The chart has to fill 345px of column at 1440×900 and 469px at 1440×1024 without its
 * axis type changing size, which no purely declarative answer gives you. One observer,
 * one piece of state, and the geometry is derived — and because the SVG is absolutely
 * positioned inside the box it measures, growing the chart cannot grow the box, so there
 * is no feedback loop to guard against.
 */
function useBoxSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ w: 880, h: 320 });
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const read = () =>
      setSize((previous) => {
        const w = node.clientWidth;
        const h = node.clientHeight;
        return previous.w === w && previous.h === h ? previous : { w, h };
      });
    read();
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

function ArcChart({ state, content }: { state: GameState; content: Content }) {
  const history = state.history;
  const box = useRef<HTMLDivElement>(null);
  const size = useBoxSize(box);
  const f = frameFor(size.w, size.h);

  const series: Series[] = useMemo(() => {
    if (history.length === 0) return [];
    const step = f.plotW / history.length;
    const built = DIMENSIONS.map((id) => {
      const values = [
        (history[0] as (typeof history)[number]).dimsBefore[id],
        ...history.map((h) => h.dimsAfter[id]),
      ];
      return {
        id,
        points: values.map((value, i) => ({
          x: GUTTER.left + i * step,
          y: yFor(f, value),
          value,
        })),
        labelY: 0,
      };
    });
    const spread = spreadLabels(
      f,
      built.map((s) => ({ id: s.id, y: (s.points[s.points.length - 1] as { y: number }).y })),
    );
    return built.map((s) => ({ ...s, labelY: spread[s.id] as number }));
  }, [history, f.plotW, f.plotH]);

  /* Chapter bands, from the beats themselves — a boundary wherever the chapter changes,
     and the label centred over the run of beats that belongs to it. */
  const bands = useMemo(() => {
    if (history.length === 0) return [];
    const step = f.plotW / history.length;
    const byChapter = chapters(content);
    const out: { number: number; label: string; from: number; to: number }[] = [];
    history.forEach((h, i) => {
      const last = out[out.length - 1];
      if (last && last.number === h.chapter) last.to = GUTTER.left + (i + 1) * step;
      else
        out.push({
          number: h.chapter,
          label: byChapter.find((c) => c.number === h.chapter)?.label ?? String(h.chapter),
          from: GUTTER.left + i * step,
          to: GUTTER.left + (i + 1) * step,
        });
    });
    return out;
  }, [history, content, f.plotW]);

  return (
    /* `overflow-x-auto` earns its keep only below `lg`, where the canvas hits its 560px
       floor and the direct end labels — the chart’s non-colour carrier — would otherwise
       be cut off the right edge. At desktop the canvas is exactly the box width, so no
       scrollbar ever appears. */
    <div ref={box} className="relative min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
      {series.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-10 text-center">
          <span style={{ color: T.glowInk }}>
            <Icon name="chart" size={38} />
          </span>
          <p className="mt-4" style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.ink }}>
            {UI_LABEL.arcEmpty}
          </p>
          <p
            className="mt-2 max-w-[54ch] text-pretty"
            style={{ fontSize: "var(--text-base)", color: T.inkSoft, lineHeight: 1.5 }}
          >
            {UI_LABEL.arcEmptyNote}
          </p>
        </div>
      ) : (
        <>
          <p className="sr-only">{arcSummary(series, history.length)}</p>
          <svg
            width={f.w}
            height={f.h}
            viewBox={`0 0 ${f.w} ${f.h}`}
            aria-hidden="true"
            focusable="false"
            className="absolute top-1/2 left-0 -translate-y-1/2"
          >
            {/* the grid: 0, 50 and 100, and nothing else — a meter has no other landmarks */}
            {[0, 50, 100].map((v) => (
              <g key={v}>
                <line
                  x1={GUTTER.left}
                  x2={GUTTER.left + f.plotW}
                  y1={yFor(f, v)}
                  y2={yFor(f, v)}
                  stroke={v === 50 ? T.line : T.lineSoft}
                  strokeWidth={1}
                  strokeDasharray={v === 50 ? "3 5" : undefined}
                />
                <text
                  x={GUTTER.left - 10}
                  y={yFor(f, v) + 4}
                  textAnchor="end"
                  fill={T.inkSoft}
                  style={{ fontSize: "var(--text-xs)", fontVariantNumeric: "tabular-nums" }}
                >
                  {v}
                </text>
              </g>
            ))}

            {/* chapter bands: a hairline at each boundary, the chapter named beneath it */}
            {bands.map((band, i) => (
              <g key={`${band.number}-${i}`}>
                {i > 0 && (
                  <line
                    x1={band.from}
                    x2={band.from}
                    y1={GUTTER.top}
                    y2={GUTTER.top + f.plotH}
                    stroke={T.lineSoft}
                    strokeWidth={1}
                  />
                )}
                <text
                  x={(band.from + band.to) / 2}
                  y={GUTTER.top + f.plotH + 22}
                  textAnchor="middle"
                  fill={T.inkSoft}
                  style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}
                >
                  {band.label}
                </text>
              </g>
            ))}

            {/* the three arcs */}
            {series.map((s) => {
              const end = s.points[s.points.length - 1] as { x: number; y: number; value: number };
              return (
                <g key={s.id}>
                  <polyline
                    points={s.points.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke={onStage[s.id]}
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {s.points.map((p, i) => (
                    <path
                      key={i}
                      d={marker(s.id, p.x, p.y, 4.5)}
                      fill={onStage[s.id]}
                      stroke={T.base}
                      strokeWidth={1.5}
                    />
                  ))}
                  {/* the direct label — the chart's second, non-colour carrier */}
                  <line
                    x1={end.x + 6}
                    x2={GUTTER.left + f.plotW + 18}
                    y1={end.y}
                    y2={s.labelY}
                    stroke={wash(onStage[s.id], 60)}
                    strokeWidth={1}
                  />
                  <path
                    d={marker(s.id, GUTTER.left + f.plotW + 26, s.labelY, 5)}
                    fill={onStage[s.id]}
                  />
                  <text
                    x={GUTTER.left + f.plotW + 38}
                    y={s.labelY + 5}
                    fill={T.ink}
                    style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}
                  >
                    {DIMENSION_META[s.id].label}
                  </text>
                  <text
                    x={f.w - 4}
                    y={s.labelY + 5}
                    textAnchor="end"
                    fill={T.ink}
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {end.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </>
      )}
    </div>
  );
}

/* ─────────────────────── against what was reachable ─────────────────────── */

function ReachableBar({ id, value, range }: { id: DimensionId; value: number; range: DimRange }) {
  const meta = DIMENSION_META[id];
  const hue = onStage[id];
  const beyond = value > range.max;
  const caption = beyond
    ? `${value} — ${UI_LABEL.reachablePast} ${range.max} ${UI_LABEL.reachablePastTail}`
    : `${value} ${UI_LABEL.reachableOf} ${range.max}`;

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span
          className="inline-flex min-w-0 items-center gap-1.5"
          style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: T.ink }}
        >
          <span aria-hidden="true" style={{ color: hue }}>
            {meta.glyph}
          </span>
          <span className="truncate">{meta.label}</span>
        </span>
        <span
          className="shrink-0 tabular-nums"
          style={{ fontSize: "var(--text-xs)", color: T.inkSoft }}
        >
          {caption}
        </span>
      </div>
      <div
        className="relative mt-1 h-2.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`${meta.label}: ${caption}. Witnessed range ${range.min} to ${range.max}.`}
        style={{ background: T.sunk }}
      >
        {/* the band a real playthrough has been seen to occupy */}
        <span
          className="absolute inset-y-0 block"
          style={{
            left: `${range.min}%`,
            width: `${Math.max(0, range.max - range.min)}%`,
            background: wash(hue, 26),
          }}
        />
        <span
          className="absolute inset-y-0 left-0 block rounded-full"
          style={{ width: `${Math.min(100, value)}%`, background: hue }}
        />
        {/* the ceiling, as a tick, so "reachable 74" is visible and not only stated */}
        {range.max < 100 && (
          <span
            className="absolute inset-y-0 block w-0.5"
            style={{ left: `${range.max}%`, background: T.ink }}
          />
        )}
      </div>
    </li>
  );
}

/* ───────────────────────────── stars by chapter ───────────────────────────── */

function StarTriple({ count, played }: { count: Stars; played: boolean }) {
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center gap-px">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className="block rounded-full"
          style={{
            width: 6,
            height: 6,
            background: played && n <= count ? T.reward : T.lineSoft,
          }}
        />
      ))}
    </span>
  );
}

function ChapterStars({
  chapter,
  state,
  content,
}: {
  chapter: ChapterProgress;
  state: GameState;
  content: Content;
}) {
  const scored = chapter.missions.map((m) => ({
    id: m.id,
    count: stars(state, content, m.id),
    played: state.completed.includes(m.id),
  }));
  const earned = scored.reduce((total, m) => total + m.count, 0);
  const available = chapter.missions.length * 3;

  return (
    <li className="flex items-center gap-3">
      <span
        className="shrink-0 tabular-nums"
        style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: T.glowInk }}
      >
        {chapter.number}
      </span>
      <span
        className="min-w-0 flex-1 truncate"
        style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: T.ink }}
      >
        {chapter.label}
      </span>
      <span className="flex shrink-0 items-center gap-2.5">
        {scored.map((m) => (
          <StarTriple key={m.id} count={m.count} played={m.played} />
        ))}
      </span>
      <span
        aria-hidden="true"
        className="w-[38px] shrink-0 text-right tabular-nums"
        style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: T.inkSoft }}
      >
        {earned}/{available}
      </span>
      {/* The pips say nothing and "4/9" reads as "four slash nine", so the row carries
          its own sentence. */}
      <span className="sr-only">
        {earned} {UI_LABEL.of} {available} {UI_LABEL.stars}
      </span>
    </li>
  );
}

/* ───────────────────────────── recognition ───────────────────────────── */

/**
 * Six slots, and the unearned ones name their criterion.
 *
 * A badge that hides its condition is a mystery, and a mystery motivates nobody thirty
 * minutes into a learning game — so the locked state prints the same `note` the earned
 * one does. Gold-versus-grey is not the only carrier either: each slot says Earned or
 * Not yet in words.
 */
function BadgeCell({ badge }: { badge: BadgeStatus }) {
  const has = badge.earned;
  return (
    <li
      className="flex min-w-0 flex-col gap-1 px-4 py-2.5"
      style={{
        background: has
          ? "color-mix(in oklab, var(--color-reward) 10%, var(--color-stage-raised))"
          : T.base,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
          style={
            has
              ? { borderColor: wash(T.reward, 72), color: T.reward, background: wash(T.reward, 18) }
              : { borderColor: T.line, borderStyle: "dashed", color: T.inkSoft }
          }
        >
          <Icon name={has ? "trophy" : "block"} size={14} />
        </span>
        <span
          className="min-w-0 flex-1 truncate"
          style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: has ? T.reward : T.ink }}
        >
          {badge.label}
        </span>
      </div>
      {/* The state in words, leading the criterion rather than sitting on a line of its
          own. Gold against grey may not be the only carrier (E6), a third line cost 22px
          on all six cells, and putting it beside the name in a 233px column truncated
          "Connected the Dots". Inline, it competes with nothing. */}
      <p
        className="text-pretty"
        style={{ fontSize: "var(--text-xs)", color: T.inkSoft, lineHeight: 1.35 }}
      >
        <span style={{ fontWeight: 700, color: has ? T.reward : T.ink }}>
          {has ? UI_LABEL.earned : UI_LABEL.notYet}
        </span>
        {"  ·  "}
        {badge.note}
      </p>
    </li>
  );
}

/* ───────────────────────────── the dashboard ───────────────────────────── */

/** A section heading on the stage. Sentence case: no all-caps eyebrow over every block. */
function Heading({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="flex min-w-0 items-baseline gap-2.5">
      <h2
        className="shrink-0"
        style={{ fontSize: "var(--text-base)", fontWeight: 700, color: T.ink }}
      >
        {children}
      </h2>
      {note && (
        <p className="min-w-0 truncate" style={{ fontSize: "var(--text-xs)", color: T.inkSoft }}>
          {note}
        </p>
      )}
    </div>
  );
}

export function PerformanceDashboard({
  state,
  content = story,
  onDismiss,
}: {
  state: GameState;
  content?: Content;
  /** absent means the panel has no way out of its own — the parent owns the route */
  onDismiss?: () => void;
}) {
  const summary = progressSummary(state, content);
  const level = levelFor(state, content);
  const badges = badgeProgress(state);
  const byChapter = chapters(content);
  const range = reachableFor(content);

  /**
   * How often the player's pre-commit call was right.
   *
   * `predictionCorrect` is `null` on any beat where no prediction was recorded, and those
   * beats are excluded from both halves rather than counted as wrong — a denominator that
   * includes unanswered questions measures the recorder, not the player. Belongs in
   * `engine/progress.ts` beside `stars`; it is here only because this file does not own
   * that module today.
   */
  const answered = state.history.filter((h) => h.predictionCorrect !== null);
  const right = answered.filter((h) => h.predictionCorrect === true).length;
  const accuracy =
    answered.length === 0 ? null : Math.round((right / answered.length) * 100);

  const earnedBadges = badges.filter((b) => b.earned).length;

  return (
    <div
      data-stage
      /* Desktop is the designed case and the only one the fit gate measures. Below `lg`
         the four regions stack and the panel grows instead of clipping — the same
         content-first degradation `Console` applies to the rails. */
      className="flex w-full flex-col lg:h-full lg:min-h-0 lg:overflow-hidden"
      style={{ background: T.base, color: T.ink }}
    >
      {/* ── header ── */}
      <header
        data-region="dashboard-header"
        className="flex shrink-0 items-center justify-between gap-6 px-7 py-3"
        style={{ borderBottom: `1px solid ${T.line}`, background: T.raised }}
      >
        <div className="min-w-0">
          <h1
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 800,
              letterSpacing: "var(--tracking-tight)",
              lineHeight: 1.1,
            }}
          >
            {UI_LABEL.howYouPlayed}
          </h1>
          <p className="mt-0.5 truncate" style={{ fontSize: "var(--text-sm)", color: T.inkSoft }}>
            {UI_LABEL.dashboardLede}
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            data-variant="glow"
            className="btn-game shrink-0 py-2.5"
          >
            {UI_LABEL.backToGame}
          </button>
        )}
      </header>

      {/* ── the numerals ── */}
      <section
        data-region="dashboard-headline"
        aria-label={UI_LABEL.howYouPlayed}
        className="relative grid shrink-0 grid-cols-2 items-end gap-6 px-7 py-3 lg:grid-cols-4"
        style={{ borderBottom: `1px solid ${T.line}` }}
      >
        {/* A light source, not a stain: wide and shallow so it lifts the whole band and
            the header above it rather than pooling behind the first numeral. Its width is
            relative, not the 1240px it needs at 1400 — a fixed decoration measured 630px
            of real horizontal overflow at 390px wide, which is a scrollbar caused by a
            gradient. */}
        <span
          aria-hidden="true"
          className="glow-radial pointer-events-none absolute"
          style={{ left: -220, top: -150, width: "calc(100% + 60px)", height: 330 }}
        />
        <div className="relative">
          <Numeral
            value={summary.completed}
            total={summary.total}
            label={UI_LABEL.missionsPlayed}
            note={`${UI_LABEL.chapterWord} ${summary.chapter} ${UI_LABEL.of} ${summary.chapterCount}`}
            size="mega"
            tone={T.ink}
          />
        </div>
        <div className="relative">
          <Numeral
            value={accuracy === null ? "–" : accuracy}
            suffix={accuracy === null ? undefined : "%"}
            label={UI_LABEL.readTradeRight}
            note={
              accuracy === null
                ? UI_LABEL.noCallsYet
                : `${right} ${UI_LABEL.of} ${answered.length}`
            }
            size={accuracy === null ? "none" : "hero"}
            tone={accuracy === null ? T.inkSoft : T.energy}
          />
        </div>
        <div className="relative">
          <Numeral
            value={earnedBadges}
            total={badges.length}
            label={UI_LABEL.recognitionsEarned}
            note={`${badges.length - earnedBadges} ${UI_LABEL.stillToEarn}`}
            size="hero"
            tone={T.reward}
          />
        </div>
        <div className="relative">
          <Numeral
            value={level.level}
            label={UI_LABEL.levelReached}
            note={`${level.xp} XP · ${UI_LABEL.levelNote}`}
            size="hero"
            tone={T.glowInk}
          />
        </div>
      </section>

      {/* ── the artefact, and the two readings beside it ── */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section
          data-region="dashboard-arc"
          aria-label={UI_LABEL.arcTitle}
          className="flex min-h-[280px] min-w-0 flex-1 flex-col px-7 py-3"
        >
          <Heading note={UI_LABEL.arcNote}>{UI_LABEL.arcTitle}</Heading>
          <ArcChart state={state} content={content} />
        </section>

        <section
          data-region="dashboard-benchmark"
          className="flex w-full shrink-0 flex-col lg:w-[452px]"
          style={{ borderLeft: `1px solid ${T.line}`, background: T.raised }}
        >
          <div className="px-6 py-3" aria-label={UI_LABEL.reachableTitle}>
            <Heading>{UI_LABEL.reachableTitle}</Heading>
            <ul className="mt-2.5 space-y-2">
              {DIMENSIONS.map((d) => (
                <ReachableBar
                  key={d}
                  id={d}
                  value={state.dims[d]}
                  range={range[d] as DimRange}
                />
              ))}
            </ul>
            <p
              className="mt-2.5 text-pretty"
              style={{ fontSize: "var(--text-xs)", color: T.inkSoft, lineHeight: 1.35 }}
            >
              {UI_LABEL.reachableFoot}
            </p>
          </div>

          <div
            className="flex-1 px-6 py-3"
            style={{ borderTop: `1px solid ${T.lineSoft}` }}
            aria-label={UI_LABEL.starsByChapter}
          >
            <Heading note={UI_LABEL.starsNote}>{UI_LABEL.starsByChapter}</Heading>
            <ul className="mt-2.5 space-y-1.5">
              {byChapter.map((c) => (
                <ChapterStars key={c.number} chapter={c} state={state} content={content} />
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* ── recognition: six slots, flush-adjacent, divided by 1px rules ── */}
      <section
        data-region="dashboard-recognition"
        aria-label={UI_LABEL.recognition}
        className="shrink-0"
        style={{ borderTop: `1px solid ${T.line}` }}
      >
        <div className="px-7 pt-2.5 pb-2">
          <Heading>{UI_LABEL.recognition}</Heading>
        </div>
        {/* Flush to the panel’s own edges and divided by 1px rules — the hairline is the
            grid’s background showing through a 1px gap. A rounded, inset, bordered block
            would be six detached cards in a tray, which is the card-kit tell. */}
        <ul
          className="grid grid-cols-2 gap-px lg:grid-cols-6"
          style={{ background: T.line, borderTop: `1px solid ${T.line}` }}
        >
          {badges.map((badge) => (
            <BadgeCell key={badge.id} badge={badge} />
          ))}
        </ul>
      </section>
    </div>
  );
}
