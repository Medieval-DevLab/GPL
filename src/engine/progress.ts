/**
 * GPL — derived progression facts.
 *
 * The client's verdict on the build was "no clear path of modules" and "no gamification".
 * Both are progression-surface complaints, and a hub screen or a journey map needs answers
 * to questions the game already knows: which beats exist, which are behind the player,
 * which one is live, how well each went.
 *
 * Every answer here is a pure function of `GameState` + `Content`. Nothing is stored and
 * no field was added to `GameState` to support it, for two reasons:
 *
 *  1. A stored progression figure is a second source of truth that can disagree with the
 *     run that produced it. Derived, it cannot drift — replay the same choices and every
 *     number below is identical, which is the property the whole engine is built on.
 *  2. `save.ts` round-trips a run from its ordered list of choices. A `level` field would
 *     have to be serialised, versioned and then trusted; a derivation needs none of that.
 *
 * These are game rules, so they live here rather than in a component: `src/ui` holds no
 * game rules and `runcode.test.ts` enforces it.
 */

import { getNode } from "./engine";
import {
  BADGE_META,
  isMission,
  type BadgeId,
  type Content,
  type GameNode,
  type GameState,
  type HistoryEntry,
  type Interlude,
  type Mission,
  type OutcomeTone,
  type StageId,
} from "./types";

/* ───────────────────────────── the module list ───────────────────────────── */

/**
 * What the player DOES on a beat, as one word.
 *
 * This exists so a journey map can advertise variety before the player clicks: seventeen
 * identical dots say "seventeen of the same screen", and the game's actual answer to that
 * complaint — six different interactions — is invisible until you are inside one. Today's
 * story resolves to six distinct values across its eighteen missions.
 *
 * Derived here rather than in the component because choosing a glyph from `kind`,
 * `presentation` and `surface` is a reading of the content, and `src/ui` holds no game
 * rules.
 */
export type ActivityId =
  | "investigate"
  | "build"
  | "call"
  | "chat"
  | "thread"
  | "apply"
  | "choice";

/** One mission, reduced to what a path or a map needs to draw it. */
export interface MissionEntry {
  id: string;
  chapter: number;
  stage: StageId;
  title: string;
  /** roughly how long it takes, as authored */
  minutes: number;
  /** which glyph this beat earns — see `ActivityId` */
  activity: ActivityId;
}

/**
 * The mechanic first, the staging second.
 *
 * `investigate` and `build` are distinct interactions — evidence slots, a proposal with
 * room for two things — so they keep their own glyph even if a future author stages one as
 * a conversation. A `choice` has no distinguishing mechanic, so its staging is the most
 * informative thing about it, and a dialogue beat is named by its surface: a `call` is
 * live and you cannot take it back, a `chat` is quick and internal, a `thread` is written
 * and on the record. An `apply` beat earns its own glyph for the same reason: what the
 * player does there is answer for what they already have, so the map should not promise a
 * fresh comparison. `Presentation` defaults to `console` and `Surface` to `call`, exactly
 * as the renderer defaults them.
 */
function activityOf(mission: Mission): ActivityId {
  if (mission.kind === "investigate") return "investigate";
  if (mission.kind === "build") return "build";
  if (mission.presentation === "apply") return "apply";
  return mission.presentation === "dialogue" ? (mission.surface ?? "call") : "choice";
}

/**
 * The ordered missions.
 *
 * Read from `content.missionOrder` rather than by filtering `content.nodes`, because the
 * authored order is the one a progress display is meant to show, and `validate.ts` already
 * pins that list to exactly the set of mission nodes in both directions — a mission
 * missing from it, or an id in it that is not a mission, is a build failure. So this
 * cannot silently omit a beat.
 *
 * The five `interlude` nodes are deliberately absent: they are chapter headers, not
 * modules, and counting them as modules would put the completion percentage out by a
 * quarter.
 */
export function missionList(content: Content): MissionEntry[] {
  const list: MissionEntry[] = [];
  for (const id of content.missionOrder) {
    const node = getNode(content, id);
    if (!isMission(node)) continue;
    list.push({
      id: node.id,
      chapter: node.chapter,
      stage: node.stage,
      title: node.title,
      minutes: node.minutes,
      activity: activityOf(node),
    });
  }
  return list;
}

/** A chapter, its missions, and the interlude that announces it. */
export interface ChapterProgress {
  number: number;
  label: string;
  title: string;
  /** the interlude's own title, where the chapter has one */
  interludeTitle: string | null;
  /** what the player achieved to get here, as named by the interlude */
  milestone: string | null;
  missions: MissionEntry[];
}

/**
 * Missions grouped by chapter, in authored chapter order.
 *
 * The spine is `content.chapters` — number, label and title are authored there — while
 * membership comes from each mission's own `chapter` field rather than from
 * `Chapter.missionIds`. Both exist and the validator keeps them in agreement, so this
 * takes the one that cannot list a mission twice or name one that does not exist.
 */
export function chapters(content: Content): ChapterProgress[] {
  const missions = missionList(content);
  return content.chapters.map((chapter) => {
    const interlude = Object.values(content.nodes).find(
      (node): node is Interlude => node.kind === "interlude" && node.chapter === chapter.number,
    );
    return {
      number: chapter.number,
      label: chapter.label,
      title: chapter.title,
      interludeTitle: interlude?.title ?? null,
      milestone: interlude?.milestone ?? null,
      missions: missions.filter((m) => m.chapter === chapter.number),
    };
  });
}

/* ──────────────────────────── where the player is ──────────────────────────── */

export type NodeStatus = "done" | "current" | "locked";

/**
 * Whether a beat is behind the player, under them, or not yet reached.
 *
 * `locked` means NOT REACHED, which is not the same as "later in the list". The graph
 * branches: an `Outcome.next` can divert the whole run, and walking away from the deal
 * ends the pursuit before chapter five exists. So a mission is only ever `done` because
 * the engine recorded it in `state.completed`, and only ever `current` because the player
 * is standing on it. Everything else is `locked`, whether it lies ahead, was skipped by a
 * branch, or can no longer be reached at all. Nothing here compares indices.
 *
 * `done` wins over `current` when both are true — which is the case while the player is
 * still reading the consequence of the mission they just finished. That way a tick count
 * taken from these statuses always agrees with `progressSummary`'s completed count; the
 * other way round it would be short by one for the length of every consequence screen.
 *
 * Any node id is accepted, so a map may ask about an interlude. Non-missions are never in
 * `state.completed`, so they can only come back `current` or `locked`. An unknown id
 * throws, via `getNode` — a typo in a journey map should be loud rather than a row that
 * quietly stays grey for ever.
 */
export function nodeStatus(state: GameState, content: Content, missionId: string): NodeStatus {
  getNode(content, missionId);
  if (state.completed.includes(missionId)) return "done";
  if (state.nodeId === missionId) return "current";
  return "locked";
}

/**
 * The next thing to do, found by walking the graph forward — never by adding one to an
 * index, for the reason `nodeStatus` gives.
 *
 * Where the current node is a mission the player has not finished, that mission IS the
 * next thing. Otherwise this steps once, honouring the live resolution's own `next` so a
 * diverting branch is reported truthfully the moment it resolves, exactly as `advance`
 * does, and then follows plain `next` links through any interludes until it reaches a
 * mission or the ending. Nodes past that first step have not resolved yet, so their branch
 * is not knowable and their authored `next` is the only honest answer.
 */
function nextMission(state: GameState, content: Content): MissionEntry | null {
  const byId = new Map(missionList(content).map((m) => [m.id, m]));

  let node: GameNode = getNode(content, state.nodeId);
  let first = true;
  let guard = 0;

  while (guard++ < 40) {
    const entry = byId.get(node.id);
    if (entry && !state.completed.includes(node.id)) return entry;

    const diverted = first && isMission(node) ? state.resolution?.outcome.next : undefined;
    first = false;
    const to = diverted ?? ("next" in node ? node.next : undefined);
    if (!to) return null;
    node = getNode(content, to);
  }
  return null;
}

export interface ProgressSummary {
  /** missions finished on this run */
  completed: number;
  /** missions in the story — the denominator a player sees */
  total: number;
  /** 0–100, rounded */
  percentage: number;
  /** the furthest chapter reached, 0 before chapter one begins */
  chapter: number;
  chapterCount: number;
  nextMissionId: string | null;
  nextMissionTitle: string | null;
}

/**
 * The one-line read on a run, for a hub header.
 *
 * `total` is every authored mission, including the ones a branching run will never see.
 * That is deliberate: a player who walked away in chapter four finished 14 of 17 modules
 * and should be told so, because the three they skipped are the consequence of a decision
 * they made, not a denominator the game should quietly shrink to flatter them.
 *
 * `chapter` is the furthest reached rather than the current node's, so it cannot go
 * backwards, and so it still reads 5 on the ending screen, where the node carries no
 * chapter at all.
 */
export function progressSummary(state: GameState, content: Content): ProgressSummary {
  const missions = missionList(content);
  const done = missions.filter((m) => state.completed.includes(m.id));
  const here = getNode(content, state.nodeId);
  const hereChapter = "chapter" in here ? here.chapter : 0;
  const next = nextMission(state, content);

  return {
    completed: done.length,
    total: missions.length,
    percentage: missions.length === 0 ? 0 : Math.round((done.length / missions.length) * 100),
    chapter: done.reduce((furthest, m) => Math.max(furthest, m.chapter), hereChapter),
    chapterCount: content.chapters.length,
    nextMissionId: next?.id ?? null,
    nextMissionTitle: next?.title ?? null,
  };
}

/* ─────────────────────────────── mastery ─────────────────────────────── */

export type Stars = 0 | 1 | 2 | 3;

/** Recognition reflects the actual authored outcome, never a prediction. */
export function starsFrom(tone: OutcomeTone): Stars {
  return tone === "strong" ? 3 : tone === "mixed" ? 2 : 1;
}


/**
 * How well a completed mission went, 0–3. See `starsFrom` for the rule.
 *
 * A completed mission never scores 0. A `hard` outcome is a lesson landed, not an absence,
 * and 0 is reserved for "you have not played this yet" so a map can tell the two apart.
 */
export function stars(state: GameState, content: Content, missionId: string): Stars {
  getNode(content, missionId);
  /* Last entry wins. Nothing replays a mission within a run today; reading the most
     recent one keeps this sensible if anything ever does. */
  let entry: HistoryEntry | undefined;
  for (const h of state.history) if (h.missionId === missionId) entry = h;
  if (!entry) return 0;
  return starsFrom(entry.tone);
}

/* ───────────────────────────── recognition ───────────────────────────── */

export interface BadgeStatus {
  id: BadgeId;
  label: string;
  note: string;
  earned: boolean;
}

/**
 * The six badges, earned or not.
 *
 * Keyed off `BADGE_META` rather than off a list written out here, so a seventh badge
 * appears in every progression surface the moment content awards it. `state.badges` is the
 * record of what was genuinely earned; this only reads it.
 */
export function badgeProgress(state: GameState): BadgeStatus[] {
  return (Object.keys(BADGE_META) as BadgeId[]).map((id) => ({
    id,
    label: BADGE_META[id].label,
    note: BADGE_META[id].note,
    earned: state.badges.includes(id),
  }));
}

/* ───────────────────────────── the big number ───────────────────────────── */

/** Finishing a beat at all. Flat, so the number always moves for turning up. */
export const XP_PER_MISSION = 10;
/** Doing it well. Three stars is worth one and a half missions of turning up. */
export const XP_PER_STAR = 5;
/** Earned, not accumulated — a badge is worth two and a half missions of turning up. */
export const XP_PER_BADGE = 25;
export const XP_PER_LEVEL = 100;

export interface Level {
  level: number;
  xp: number;
  /** progress through the current level, 0..XP_PER_LEVEL */
  xpIntoLevel: number;
  xpForNextLevel: number;
}

/**
 * A level and an XP figure, so a hub can show one big number.
 *
 * One expression, on purpose: the whole formula stays legible in a single line, which is
 * the only way "why did that go up by 15?" has an answer anybody can give. Turning up is
 * worth something, doing it well is worth more, and recognition is worth most per event
 * because it is the rarest.
 *
 * Scale check, which is the part that decides whether the number feels like anything: a
 * complete run at full mastery is 17 × (10 + 15) + 6 × 25 = 575 XP, so 100 XP per level
 * puts a perfect run at level 6 — one per chapter, plus one — and an unremarkable complete
 * run at about 3. A short run that walked away also lands near 3, which is correct:
 * walking away is sometimes the right decision and must not read as failure.
 */
export function levelFor(state: GameState, content: Content): Level {
  const xp =
    state.completed.reduce(
      (total, id) => total + XP_PER_MISSION + XP_PER_STAR * stars(state, content, id),
      0,
    ) + state.badges.length * XP_PER_BADGE;

  return {
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    xp,
    xpIntoLevel: xp % XP_PER_LEVEL,
    xpForNextLevel: XP_PER_LEVEL,
  };
}
