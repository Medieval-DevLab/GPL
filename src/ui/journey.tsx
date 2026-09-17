/**
 * The path.
 *
 * Seventeen missions existed as an invisible linked list: the player was moved from beat
 * to beat with no way to see the shape of the run or where they were in it. The client's
 * verdict was "no clear path of modules", and that is a literal reading — there was no
 * path, only a `next` field.
 *
 * So this is the level select. Five chapters, read left to right as five flush-adjacent
 * cells of one panel; inside each, a winding track through that chapter's missions. The
 * whole structure is DERIVED from `story` — chapters come from each mission's own
 * `chapter` field and their headers from the five `interlude` nodes — so authoring a
 * mission still means editing content and nothing else.
 *
 * WHY DARK. Every gameplay screen is the light console, and that stays. The map and the
 * hub are the two surfaces where the product has to earn the word "game", and depth,
 * glow and scale are the tools that do it. The tint is contained to these two files.
 *
 * NO RULES LIVE HERE. `done`, `current` and `locked` are read off `state.completed` and
 * `state.nodeId`. Nothing in this file decides a branch or computes a consequence.
 */

import {
  isMission,
  STAGES,
  type Content,
  type GameState,
  type IconId,
  type Mission,
} from "../engine/types";
import { stars, type Stars } from "../engine/progress";
import { story } from "../content/story";
import { Icon } from "./icons";
import { useReducedMotion } from "./shell";

/* ─────────────────────────── interface labels ───────────────────────────
   SHOULD MOVE TO `UI_LABEL` in `ui/shell.tsx` — this file does not own that
   module while several agents are editing in parallel. None of it is story: it
   is interface state and the non-colour half of each node's status. */
const JOURNEY_LABEL = {
  title: "The pursuit",
  lede: "One client, from first contact to delivery.",
  chapter: "Chapter",
  start: "Start",
  resume: "Continue",
  done: "Complete",
  current: "In progress",
  locked: "Locked",
  complete: "complete",
  of: "of",
  stars: "stars",
} as const;

/* ───────────────────────── the dark stage tokens ─────────────────────────
   The dark cinematic register, named once and shared with `ui/hub.tsx`. No hex
   anywhere: `--color-glow` is 3.58:1 on the stage, which is a FILL and a display
   numeral and never body type, and the only way that stays true is if the file
   cannot spell a colour it did not measure. `--color-glow-ink` is the violet that
   is legal as type. */
export const STAGE_TOKENS = {
  base: "var(--color-stage)",
  raised: "var(--color-stage-raised)",
  ink: "var(--color-stage-ink)",
  inkSoft: "var(--color-stage-ink-soft)",
  /** fills, borders, glows and numerals at 24px and up. Never small type. */
  glow: "var(--color-glow)",
  /** the same violet, darkened until it is legal on the stage as type */
  glowInk: "var(--color-glow-ink)",
  energy: "var(--color-energy)",
  reward: "var(--color-reward)",
  line: "var(--color-stage-line)",
  lineSoft: "color-mix(in oklab, var(--color-stage-line) 62%, transparent)",
  sunk: "color-mix(in oklab, var(--color-stage-ink) 7%, transparent)",
} as const;

const T = STAGE_TOKENS;

const glowWash = (pct: number) => `color-mix(in oklab, ${T.glow} ${pct}%, transparent)`;

/* ───────────────────────────── derived shape ───────────────────────────── */

export type NodeState = "done" | "current" | "locked";

interface MapMission {
  id: string;
  /** 1-based position in the whole run, which is what the player counts */
  index: number;
  title: string;
  minutes: number;
  stageLabel: string;
  state: NodeState;
  /** what KIND of beat this is, so the map advertises variety before a click */
  icon: IconId;
  /** 0 on anything unplayed. Earned rather than progress, so it is rendered in gold. */
  stars: Stars;
}

interface MapChapter {
  number: number;
  eyebrow: string;
  title: string;
  milestone?: string;
  stageLabel: string;
  missions: MapMission[];
  reached: boolean;
}

export interface Journey {
  chapters: MapChapter[];
  total: number;
  doneCount: number;
  currentId: string | null;
  currentMission: MapMission | null;
  currentChapter: MapChapter | null;
  chapterCount: number;
}

const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label ?? id;

/**
 * The node's glyph is its ACTIVITY TYPE, not its progress.
 *
 * Seventeen identical circles say the run is seventeen identical things, and it is not:
 * two beats are evidence-buying, two are assembly, ten are conversations on three
 * different surfaces. All of that is already in the content — `kind`, `presentation` and
 * `surface` — so the map can show it without a new field.
 */
function typeIcon(m: Mission): IconId {
  if (m.kind === "investigate") return "search";
  if (m.kind === "build") return "layers";
  if (m.presentation === "dialogue") {
    if (m.surface === "chat") return "people";
    if (m.surface === "thread") return "megaphone";
    return "talk";
  }
  return "scale";
}

/**
 * Read the map off the content and the state. Display derivation only.
 *
 * `current` is the node the player is actually on when that node is a mission; on an
 * interlude or the ending it falls back to the first mission not yet completed, so the
 * map never loses its focal point between chapters.
 */
export function buildJourney(content: Content, state: GameState): Journey {
  const missions = content.missionOrder
    .map((id) => content.nodes[id])
    .filter((n): n is Mission => Boolean(n) && isMission(n));

  const onAMission = missions.some((m) => m.id === state.nodeId);
  const currentId = onAMission
    ? state.nodeId
    : (missions.find((m) => !state.completed.includes(m.id))?.id ?? null);

  const numbers = [...new Set(missions.map((m) => m.chapter))].sort((a, b) => a - b);

  const chapters: MapChapter[] = numbers.map((number) => {
    const own = missions.filter((m) => m.chapter === number);
    const header = Object.values(content.nodes).find(
      (n) => n.kind === "interlude" && n.chapter === number,
    );
    const mapped: MapMission[] = own.map((m) => ({
      id: m.id,
      index: missions.findIndex((x) => x.id === m.id) + 1,
      title: m.title,
      minutes: m.minutes,
      stageLabel: stageLabel(m.stage),
      state: state.completed.includes(m.id) ? "done" : m.id === currentId ? "current" : "locked",
      icon: typeIcon(m),
      stars: stars(state, content, m.id),
    }));
    return {
      number,
      eyebrow:
        header?.kind === "interlude" ? header.eyebrow : `${JOURNEY_LABEL.chapter} ${number}`,
      title: header?.kind === "interlude" ? header.title : "",
      milestone: header?.kind === "interlude" ? header.milestone : undefined,
      stageLabel: [...new Set(own.map((m) => stageLabel(m.stage)))].join(" · "),
      missions: mapped,
      reached: mapped.some((m) => m.state !== "locked"),
    };
  });

  const all = chapters.flatMap((c) => c.missions);

  return {
    chapters,
    total: missions.length,
    doneCount: all.filter((m) => m.state === "done").length,
    currentId,
    currentMission: all.find((m) => m.state === "current") ?? null,
    currentChapter: chapters.find((c) => c.missions.some((m) => m.state === "current")) ?? null,
    chapterCount: chapters.length,
  };
}

/* ───────────────────────────── geometry ─────────────────────────────
   Fixed pixel geometry, because the track is an SVG drawn through the node
   centres and a percentage would distort the stroke. The column is 224px wide
   inside a cell that is a fifth of 1400px, so it centres with room to spare. */

const TRACK_W = 224;
const STEP = 118;
const FIRST_Y = 48;
/** Per-chapter, so a two-beat chapter does not leave a screenful of floor below it. */
const columnHeight = (n: number) => FIRST_Y + Math.max(n - 1, 0) * STEP + 46 + 62;
const SIZE: Record<NodeState, number> = { done: 52, current: 76, locked: 44 };
/** the wind. Four offsets, reused, so no chapter's track is a straight line. */
const OFFSETS = [-28, 26, -18, 30];

const centreOf = (i: number) => ({
  x: TRACK_W / 2 + (OFFSETS[i % OFFSETS.length] ?? 0),
  y: FIRST_Y + i * STEP,
});

/** S-curves through the centres: vertical control handles at each segment's midpoint. */
function trackPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const first = points[0]!;
  return points.slice(1).reduce((d, p, i) => {
    const prev = points[i]!;
    const mid = (prev.y + p.y) / 2;
    return `${d} C ${prev.x},${mid} ${p.x},${mid} ${p.x},${p.y}`;
  }, `M ${first.x},${first.y}`);
}

/* ───────────────────────────── the padlock ─────────────────────────────
   Not an `IconId`: the icon set in `engine/types.ts` is the content author's
   vocabulary and nothing in the story refers to a lock. This is interface
   furniture, so it lives with the interface. */
function LockGlyph({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

const STATE_WORD: Record<NodeState, string> = {
  done: JOURNEY_LABEL.done,
  current: JOURNEY_LABEL.current,
  locked: JOURNEY_LABEL.locked,
};

/* ───────────────────────────── a node ───────────────────────────── */

function StarPips({ count }: { count: Stars }) {
  return (
    <span aria-hidden="true" className="mt-1 flex items-center justify-center gap-1">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className="block rounded-full"
          style={{ width: 7, height: 7, background: n <= count ? T.reward : T.lineSoft }}
        />
      ))}
    </span>
  );
}

function MissionNode({
  mission,
  point,
  ctaLabel,
  onSelect,
  reducedMotion,
}: {
  mission: MapMission;
  point: { x: number; y: number };
  /** the call to action that rides ON the current node, rather than in a header */
  ctaLabel: string;
  onSelect?: (id: string) => void;
  reducedMotion: boolean;
}) {
  const d = SIZE[mission.state];
  const isDone = mission.state === "done";
  const isCurrent = mission.state === "current";
  const isLocked = mission.state === "locked";
  const clickable = !isLocked && Boolean(onSelect);

  /* Gold for done, because it is EARNED; violet+glow for the one you are on. Both carry
     a lip — a solid darker edge under the circle — which is the cheapest "this is a
     game" cue available and costs nothing but a shadow. */
  const face = isDone
    ? {
        background: T.reward,
        color: T.base,
        border: `1px solid color-mix(in oklab, ${T.reward} 60%, ${T.base})`,
        boxShadow: `0 4px 0 color-mix(in oklab, ${T.reward} 55%, ${T.base})`,
      }
    : isCurrent
      ? {
          background: `linear-gradient(160deg, ${T.glow}, color-mix(in oklab, ${T.glow} 60%, ${T.base}))`,
          color: T.ink,
          border: `2px solid ${T.energy}`,
          boxShadow: `0 5px 0 color-mix(in oklab, ${T.glow} 48%, ${T.base}), 0 0 0 7px ${glowWash(16)}, 0 16px 34px ${glowWash(45)}`,
        }
      : { background: T.sunk, color: T.inkSoft, border: `1px solid ${T.lineSoft}` };

  /* The corner badge carries PROGRESS, so the centre of the node is free to carry the
     activity type. A tick and a padlock in the same place as each other, never both. */
  const badge = isDone
    ? { icon: <Icon name="check" size={11} />, colour: T.reward }
    : isLocked
      ? { icon: <LockGlyph size={10} />, colour: T.inkSoft }
      : null;

  const starNote =
    mission.stars > 0 ? `, ${mission.stars} ${JOURNEY_LABEL.of} 3 ${JOURNEY_LABEL.stars}` : "";
  const labelLeft = Math.min(Math.max(point.x - 66, 2), TRACK_W - 134);

  return (
    <>
      {isCurrent && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            left: point.x - 100,
            top: point.y - 100,
            width: 200,
            height: 200,
            background: `radial-gradient(circle, ${glowWash(40)} 0%, ${glowWash(10)} 45%, transparent 70%)`,
          }}
        />
      )}

      <button
        type="button"
        onClick={clickable ? () => onSelect?.(mission.id) : undefined}
        aria-disabled={!clickable ? true : undefined}
        aria-current={isCurrent ? "step" : undefined}
        aria-label={`${mission.index}. ${mission.title} — ${STATE_WORD[mission.state]}${starNote}`}
        className="absolute flex items-center justify-center rounded-full outline-offset-4 focus-visible:outline-2"
        style={{
          left: point.x - d / 2,
          top: point.y - d / 2,
          width: d,
          height: d,
          cursor: clickable ? "pointer" : "default",
          outlineColor: T.energy,
          ...face,
        }}
      >
        <Icon name={mission.icon} size={isCurrent ? 30 : isDone ? 24 : 19} />
        {badge && (
          <span
            aria-hidden="true"
            className="absolute flex items-center justify-center rounded-full"
            style={{
              right: -2,
              bottom: -2,
              width: 19,
              height: 19,
              background: T.base,
              color: badge.colour,
              border: `1px solid ${T.lineSoft}`,
            }}
          >
            {badge.icon}
          </span>
        )}
      </button>

      {isCurrent && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-full ${reducedMotion ? "" : "animate-ping"}`}
          style={{
            left: point.x - d / 2 - 8,
            top: point.y - d / 2 - 8,
            width: d + 16,
            height: d + 16,
            border: `2px solid ${T.energy}`,
            opacity: reducedMotion ? 0.55 : 0.5,
          }}
        />
      )}

      <span
        aria-hidden="true"
        className="pointer-events-none absolute flex flex-col items-center text-center"
        style={{ left: labelLeft, top: point.y + d / 2 + 9, width: 132 }}
      >
        {isCurrent && (
          <>
            <span
              className="block"
              style={{
                width: 9,
                height: 9,
                marginBottom: -4,
                background: T.energy,
                transform: "rotate(45deg)",
              }}
            />
            <span
              className="relative inline-flex items-center rounded-full px-3 py-1"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 800,
                background: T.energy,
                color: T.base,
                boxShadow: `0 3px 0 color-mix(in oklab, ${T.energy} 55%, ${T.base})`,
              }}
            >
              {ctaLabel}
            </span>
          </>
        )}
        {isDone && <StarPips count={mission.stars} />}
        <span
          className="mt-1.5 block"
          style={{
            fontSize: "var(--text-xs)",
            lineHeight: 1.35,
            fontWeight: isCurrent ? 700 : 600,
            color: isLocked ? T.inkSoft : T.ink,
            opacity: isLocked ? 0.75 : 1,
          }}
        >
          {mission.title}
        </span>
      </span>
    </>
  );
}

/* ───────────────────────────── a chapter cell ───────────────────────────── */

function ChapterCell({
  chapter,
  first,
  ctaLabel,
  onSelect,
  reducedMotion,
}: {
  chapter: MapChapter;
  first: boolean;
  ctaLabel: string;
  onSelect?: (id: string) => void;
  reducedMotion: boolean;
}) {
  const points = chapter.missions.map((_, i) => centreOf(i));
  const lit = chapter.missions.reduce((hi, m, i) => (m.state === "locked" ? hi : i), -1);
  const isHere = chapter.missions.some((m) => m.state === "current");

  return (
    <section
      aria-label={`${chapter.eyebrow}: ${chapter.title}`}
      className="flex min-w-0 flex-1 flex-col"
      style={{
        borderLeft: first ? undefined : `1px solid ${T.lineSoft}`,
        background: isHere ? glowWash(7) : undefined,
      }}
    >
      <header className="px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${T.lineSoft}` }}>
        <div className="flex items-baseline gap-2">
          <span
            className="tabular-nums"
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 800,
              letterSpacing: "var(--tracking-tight)",
              color: chapter.reached ? T.glow : T.inkSoft,
              opacity: chapter.reached ? 1 : 0.6,
            }}
          >
            {chapter.number}
          </span>
          <h3
            className="min-w-0 truncate"
            style={{
              fontSize: "var(--text-base)",
              fontWeight: 700,
              color: chapter.reached ? T.ink : T.inkSoft,
            }}
          >
            {chapter.title}
          </h3>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: T.inkSoft }}>
            {chapter.stageLabel}
          </span>
          {chapter.milestone && (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5"
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                color: chapter.reached ? T.base : T.inkSoft,
                background: chapter.reached ? T.reward : T.sunk,
              }}
            >
              {chapter.milestone}
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center">
        <div
          className="relative"
          style={{ width: TRACK_W, height: columnHeight(chapter.missions.length) }}
        >
          <svg
            className="absolute inset-0"
            width={TRACK_W}
            height={columnHeight(chapter.missions.length)}
            aria-hidden="true"
            focusable="false"
          >
            <path
              d={trackPath(points)}
              fill="none"
              stroke={T.lineSoft}
              strokeWidth={8}
              strokeLinecap="round"
            />
            {lit >= 1 && (
              <path
                d={trackPath(points.slice(0, lit + 1))}
                fill="none"
                stroke={glowWash(80)}
                strokeWidth={8}
                strokeLinecap="round"
              />
            )}
          </svg>
          {chapter.missions.map((m, i) => (
            <MissionNode
              key={m.id}
              mission={m}
              point={points[i]!}
              ctaLabel={ctaLabel}
              onSelect={onSelect}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── compact rail ─────────────────────────────
   The hub's preview. Same states, same buttons, one line: seventeen stops in
   five groups, so the whole run is legible before the map is opened. */

function CompactRail({
  journey,
  onSelect,
  reducedMotion,
}: {
  journey: Journey;
  onSelect?: (id: string) => void;
  reducedMotion: boolean;
}) {
  return (
    <div className="flex items-end gap-5" role="group" aria-label={JOURNEY_LABEL.title}>
      {journey.chapters.map((chapter) => (
        <div key={chapter.number} className="flex flex-col gap-1.5">
          <div className="flex items-center">
            {chapter.missions.map((m, i) => {
              const isCurrent = m.state === "current";
              const dot = isCurrent ? 26 : m.state === "done" ? 18 : 16;
              return (
                <span key={m.id} className="flex items-center">
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className="block"
                      style={{
                        width: 12,
                        height: 3,
                        borderRadius: 2,
                        background: m.state === "locked" ? T.lineSoft : glowWash(70),
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={m.state !== "locked" && onSelect ? () => onSelect(m.id) : undefined}
                    aria-disabled={m.state === "locked" || !onSelect ? true : undefined}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`${m.index}. ${m.title} — ${STATE_WORD[m.state]}`}
                    className="flex items-center justify-center rounded-full outline-offset-2 focus-visible:outline-2"
                    style={{ width: 30, height: 30, outlineColor: T.energy }}
                  >
                    <span
                      className={`flex items-center justify-center rounded-full ${
                        isCurrent && !reducedMotion ? "animate-pulse" : ""
                      }`}
                      style={{
                        width: dot,
                        height: dot,
                        background:
                          m.state === "locked" ? T.sunk : isCurrent ? T.energy : T.reward,
                        border:
                          m.state === "locked"
                            ? `1px solid ${T.lineSoft}`
                            : isCurrent
                              ? `2px solid ${T.ink}`
                              : undefined,
                        color: T.base,
                        boxShadow: isCurrent ? `0 0 0 5px ${glowWash(22)}` : undefined,
                      }}
                    >
                      {m.state !== "locked" && <Icon name={m.icon} size={isCurrent ? 14 : 11} />}
                      {m.state === "locked" && <LockGlyph size={9} />}
                    </span>
                  </button>
                </span>
              );
            })}
          </div>
          <span
            className="truncate"
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: chapter.reached ? T.ink : T.inkSoft,
              maxWidth: chapter.missions.length * 54,
            }}
          >
            {chapter.number}. {chapter.title}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────── the map ───────────────────────────── */

export function JourneyMap({
  state,
  content = story,
  compact = false,
  onSelectMission,
}: {
  state: GameState;
  content?: Content;
  /** the hub's one-line preview */
  compact?: boolean;
  /** absent means every node is inert, which is the state until replay routing lands */
  onSelectMission?: (id: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  const journey = buildJourney(content, state);

  if (compact) {
    return (
      <CompactRail journey={journey} onSelect={onSelectMission} reducedMotion={reducedMotion} />
    );
  }

  const pct = journey.total === 0 ? 0 : Math.round((journey.doneCount / journey.total) * 100);

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden"
      style={{ background: T.base, color: T.ink }}
    >
      <header
        className="flex shrink-0 items-end justify-between gap-6 px-6 py-4"
        style={{ borderBottom: `1px solid ${T.line}`, background: T.raised }}
      >
        <div className="min-w-0">
          <h1
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 800,
              letterSpacing: "var(--tracking-display)",
              lineHeight: 1.1,
            }}
          >
            {JOURNEY_LABEL.title}
          </h1>
          <p className="mt-1" style={{ fontSize: "var(--text-sm)", color: T.inkSoft }}>
            {JOURNEY_LABEL.lede}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <span
              className="tabular-nums"
              style={{ fontSize: "var(--text-xl)", fontWeight: 800, letterSpacing: "-0.03em" }}
            >
              {journey.doneCount}
            </span>
            <span
              className="tabular-nums"
              style={{ fontSize: "var(--text-md)", fontWeight: 700, color: T.inkSoft }}
            >
              /{journey.total}
            </span>
            <span className="ml-2" style={{ fontSize: "var(--text-xs)", color: T.inkSoft }}>
              {JOURNEY_LABEL.complete}
            </span>
          </div>
          <div
            className="h-2 w-[180px] overflow-hidden rounded-full"
            role="img"
            aria-label={`${journey.doneCount} ${JOURNEY_LABEL.of} ${journey.total} ${JOURNEY_LABEL.complete}`}
            style={{ background: T.sunk }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${T.glow}, ${T.energy})`,
              }}
            />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {journey.chapters.map((chapter, i) => (
          <ChapterCell
            key={chapter.number}
            chapter={chapter}
            first={i === 0}
            ctaLabel={journey.doneCount === 0 ? JOURNEY_LABEL.start : JOURNEY_LABEL.resume}
            onSelect={onSelectMission}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
    </div>
  );
}
