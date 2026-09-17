/**
 * The home screen.
 *
 * The game had no front door: it opened on a title and then ran seventeen briefings back
 * to back, so there was nowhere the player could stand and see what they had done, what
 * they were on, and what was left. "Feels like static pages where I read and click on
 * things" is partly a consequence of that — a run with no vantage point is a document.
 *
 * This is a game menu, not an LMS dashboard. One loud action, oversized numerals, the
 * engagement named, and two doors: the map and the recognition board. Dark for the same
 * reason the map is dark — see the header of `ui/journey.tsx`.
 *
 * NO RULES LIVE HERE. Everything on screen is read off `GameState` and `story`; the next
 * mission is the node the player is already on, not a node this file chooses.
 */

import {
  BADGE_META,
  DIMENSIONS,
  DIMENSION_META,
  isMission,
  type Content,
  type DimensionId,
  type GameState,
  type Mission,
} from "../engine/types";
import { story } from "../content/story";
import { Icon } from "./icons";
import { buildJourney, JourneyMap, STAGE_TOKENS } from "./journey";

/* ─────────────────────────── interface labels ───────────────────────────
   SHOULD MOVE TO `UI_LABEL` in `ui/shell.tsx`; this file does not own that
   module while several agents are editing in parallel. None of it is story. */
const HUB_LABEL = {
  greeting: "Welcome back",
  engagementLead: "Your engagement",
  upNext: "Up next",
  continue: "Continue",
  start: "Start the pursuit",
  startNote: "Chapter one, from the beginning",
  minutes: "min",
  journey: "The pursuit map",
  recognition: "Recognition",
  missionsComplete: "missions complete",
  of: "of",
  chapterReached: "Chapter reached",
  badgesEarned: "Recognition earned",
  standing: "Where you stand",
  yourPath: "Your path",
  viewWholeMap: "See the whole map",
  finished: "Every mission complete",
} as const;

const T = STAGE_TOKENS;

const glowWash = (pct: number) => `color-mix(in oklab, ${T.glow} ${pct}%, transparent)`;

/* The two display steps above the old 56px ceiling, for numerals only. A 96px figure
   reads as a scoreboard where a 32px one reads as a table, and that is the cheapest
   game signal on the screen. Nothing else here leaves the authored steps. */
const DISPLAY_MEGA = "var(--text-mega)";
const DISPLAY_HERO = "var(--text-hero)";

/* ───────────────────────────── small pieces ───────────────────────────── */

/** Outlined door. Two of them, and neither competes with the primary action. */
function DoorButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: "flag" | "trophy";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-[12px] px-4 py-2.5 outline-offset-2 focus-visible:outline-2"
      style={{
        border: `1px solid ${T.line}`,
        color: T.ink,
        background: T.sunk,
        fontSize: "var(--text-sm)",
        fontWeight: 700,
        outlineColor: T.energy,
      }}
    >
      <span style={{ color: icon === "trophy" ? T.reward : T.energy }}>
        <Icon name={icon} size={16} />
      </span>
      {label}
    </button>
  );
}

/** A dimension, on dark. The glyph carries the meaning colour is only repeating. */
function StageMeter({ id, value }: { id: DimensionId; value: number }) {
  const meta = DIMENSION_META[id];
  const hue = `var(${meta.fillVar})`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5"
          style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: T.inkSoft }}
        >
          <span aria-hidden="true" style={{ color: hue }}>
            {meta.glyph}
          </span>
          {meta.label}
        </span>
        <span
          className="tabular-nums"
          style={{ fontSize: "var(--text-base)", fontWeight: 800, color: T.ink }}
        >
          {value}
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`${meta.label}: ${value} out of 100`}
        style={{ background: T.sunk }}
      >
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: hue }} />
      </div>
    </div>
  );
}

/** A statistic, sized to be read across the room. */
function BigStat({
  value,
  total,
  label,
  size,
  tone,
}: {
  value: number;
  total?: number;
  label: string;
  size: string;
  tone: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <span
          className="tabular-nums"
          style={{
            fontSize: size,
            lineHeight: 0.86,
            fontWeight: 800,
            letterSpacing: "var(--tracking-display)",
            color: tone,
          }}
        >
          {value}
        </span>
        {total !== undefined && (
          <span
            className="tabular-nums"
            style={{ fontSize: "var(--text-md)", fontWeight: 700, color: T.inkSoft }}
          >
            {HUB_LABEL.of} {total}
          </span>
        )}
      </div>
      <p className="mt-2" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: T.inkSoft }}>
        {label}
      </p>
    </div>
  );
}

/* ───────────────────────────── the hub ───────────────────────────── */

export function HubScreen({
  state,
  content = story,
  onContinue,
  onViewJourney,
  onViewRecognition,
}: {
  state: GameState;
  content?: Content;
  onContinue: () => void;
  onViewJourney: () => void;
  onViewRecognition: () => void;
}) {
  const journey = buildJourney(content, state);

  /* The client is named by the content, not by this file — the first mission that carries
     a profile owns the engagement's identity. */
  const missions = content.missionOrder
    .map((id) => content.nodes[id])
    .filter((n): n is Mission => Boolean(n) && isMission(n));
  const client = missions.find((m) => m.client)?.client;

  const nextNode = journey.currentId ? content.nodes[journey.currentId] : undefined;
  const next = nextNode && isMission(nextNode) ? nextNode : undefined;
  const nextChapter = journey.currentChapter;

  const fresh = journey.doneCount === 0;
  const badgeTotal = Object.keys(BADGE_META).length;

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden"
      style={{ background: T.base, color: T.ink }}
    >
      {/* the glow sits behind the whole upper half, so the screen has a light source */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            left: -160,
            top: -260,
            width: 900,
            height: 640,
            background: `radial-gradient(ellipse at center, ${glowWash(26)} 0%, transparent 68%)`,
          }}
        />

        <header
          className="relative flex shrink-0 items-center justify-between gap-6 px-8 py-4"
          style={{ borderBottom: `1px solid ${T.line}`, background: T.raised }}
        >
          <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: T.inkSoft }}>
            {HUB_LABEL.greeting}
          </p>
          <div className="flex items-center gap-2.5">
            <DoorButton label={HUB_LABEL.journey} icon="flag" onClick={onViewJourney} />
            <DoorButton label={HUB_LABEL.recognition} icon="trophy" onClick={onViewRecognition} />
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1">
          {/* ── the engagement and the one action ── */}
          <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex min-w-0 flex-1 flex-col justify-center px-9">
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 700,
                  color: T.energy,
                }}
              >
                {HUB_LABEL.engagementLead}
              </p>
              <h1
                className="mt-1"
                style={{
                  fontSize: "var(--text-display)",
                  lineHeight: 1.02,
                  fontWeight: 800,
                  letterSpacing: "var(--tracking-display)",
                }}
              >
                {client?.name ?? ""}
              </h1>
              {client && (
                <p className="mt-2" style={{ fontSize: "var(--text-base)", color: T.inkSoft }}>
                  {client.tags.join("  ·  ")}
                </p>
              )}
            </div>

            {/* The rule spans the whole cell, so the division reads as the console's own
                architecture rather than as a gap between two floating cards. */}
            <div className="px-9 py-6" style={{ borderTop: `1px solid ${T.lineSoft}` }}>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: T.inkSoft }}>
                {next ? HUB_LABEL.upNext : HUB_LABEL.finished}
              </p>
              <h2
                className="mt-1.5"
                style={{
                  fontSize: "var(--text-lg)",
                  fontWeight: 700,
                  letterSpacing: "var(--tracking-tight)",
                }}
              >
                {next ? next.title : HUB_LABEL.finished}
              </h2>
              {next && (
                <p className="mt-1" style={{ fontSize: "var(--text-base)", color: T.inkSoft }}>
                  {next.objective}
                </p>
              )}

              <button
                type="button"
                onClick={onContinue}
                aria-label={
                  next
                    ? `${fresh ? HUB_LABEL.start : HUB_LABEL.continue}: ${next.title}`
                    : (fresh ? HUB_LABEL.start : HUB_LABEL.continue)
                }
                /* THE LIP, from `.btn-game` in index.css: a solid 4px darker bottom
                   edge that collapses under a 4px drop on press. It is the strongest
                   single "this is a game" cue available and it is already shipped, so
                   this button only names its fill. */
                className="btn-game mt-5 w-[360px] justify-between px-6 py-4 text-left outline-offset-4 focus-visible:outline-2"
                style={
                  {
                    "--btn-fill": T.glow,
                    "--btn-lip": "var(--color-brand-lip)",
                    outlineColor: T.energy,
                  } as React.CSSProperties
                }
              >
                <span className="min-w-0 text-left">
                  <span
                    className="block"
                    style={{ fontSize: "var(--text-md)", fontWeight: 800, letterSpacing: "-0.01em" }}
                  >
                    {fresh ? HUB_LABEL.start : HUB_LABEL.continue}
                  </span>
                  {/* The mission is named by the heading directly above, so the button
                      carries the cost instead — repeating the title here read as a stutter. */}
                  <span
                    className="mt-0.5 block truncate"
                    style={{ fontSize: "var(--text-sm)", fontWeight: 600, opacity: 0.85 }}
                  >
                    {fresh || !next || !nextChapter
                      ? HUB_LABEL.startNote
                      : `${nextChapter.eyebrow}  ·  ${next.minutes} ${HUB_LABEL.minutes}`}
                  </span>
                </span>
                <Icon name="rocket" size={22} />
              </button>
            </div>
          </section>

          {/* ── progress at a glance ── */}
          <section
            className="flex w-[400px] shrink-0 flex-col"
            style={{ borderLeft: `1px solid ${T.line}`, background: T.raised }}
            aria-label={HUB_LABEL.standing}
          >
            <div className="px-7 py-6">
              <BigStat
                value={journey.doneCount}
                total={journey.total}
                label={HUB_LABEL.missionsComplete}
                size={DISPLAY_MEGA}
                tone={T.ink}
              />
            </div>

            <div className="flex" style={{ borderTop: `1px solid ${T.lineSoft}` }}>
              <div className="flex-1 px-7 py-5">
                <BigStat
                  value={nextChapter?.number ?? journey.chapterCount}
                  total={journey.chapterCount}
                  label={HUB_LABEL.chapterReached}
                  size={DISPLAY_HERO}
                  tone={T.glow}
                />
              </div>
              <div className="flex-1 px-7 py-5" style={{ borderLeft: `1px solid ${T.lineSoft}` }}>
                <BigStat
                  value={state.badges.length}
                  total={badgeTotal}
                  label={HUB_LABEL.badgesEarned}
                  size={DISPLAY_HERO}
                  tone={T.reward}
                />
              </div>
            </div>

            <div
              className="flex-1 space-y-3.5 px-7 py-5"
              style={{ borderTop: `1px solid ${T.lineSoft}` }}
            >
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: T.inkSoft }}>
                {HUB_LABEL.standing}
              </p>
              {DIMENSIONS.map((d) => (
                <StageMeter key={d} id={d} value={state.dims[d]} />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── the path, in one line ── */}
      <div
        className="flex shrink-0 items-end justify-between gap-6 px-8 py-4"
        style={{ borderTop: `1px solid ${T.line}` }}
      >
        <div className="min-w-0">
          <p
            className="mb-2.5"
            style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: T.inkSoft }}
          >
            {HUB_LABEL.yourPath}
          </p>
          <JourneyMap state={state} content={content} compact />
        </div>
        <button
          type="button"
          onClick={onViewJourney}
          className="shrink-0 rounded-[12px] px-4 py-2.5 outline-offset-2 focus-visible:outline-2"
          style={{
            border: `1px solid ${T.line}`,
            background: T.sunk,
            color: T.ink,
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            outlineColor: T.energy,
          }}
        >
          {HUB_LABEL.viewWholeMap}
        </button>
      </div>
    </div>
  );
}
