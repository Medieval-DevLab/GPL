/**
 * GPL saves — what is stored, and what happens when it no longer fits.
 *
 * THE DEFECT THIS EXISTS TO FIX
 * The save used to be a bare `GameState` under a hand-written key, `gpl.save.v3`. Two
 * consequences, both measured on the shipped build:
 *
 *  1. Nothing described the content the state was produced by. The only check was "does
 *     this node id still exist", so a patch that renamed a node voided every run in the
 *     cohort silently — the Resume button simply stopped being there — and a patch that
 *     changed an effect left the save loading happily with arithmetic no build would ever
 *     produce again.
 *  2. The key carried the version, so the *fix* for (1) was to bump the key, which throws
 *     every run in progress away on purpose. Ship a typo fix at eleven o'clock and the
 *     room resets.
 *
 * So the key is now stable and the envelope carries the version instead: a schema number
 * for the shape of `GameState`, and the two content fingerprints from `runcode.ts`. That
 * separation is the substance of the fix, not the nicer error message — because a
 * fingerprint taken over decisions and rules, and never over prose, means a typo fix does
 * not invalidate anything at all.
 *
 * WHEN A SAVE REALLY IS STALE
 * It carries its own run code, written at save time under the content that was live. A
 * stale save can therefore still hand the player fourteen characters that put them back
 * where they were — replayed under the new rules, which is the only honest place to put
 * them. If the decision *structure* moved as well, the code cannot be replayed and says
 * so, rather than pretending.
 *
 * SHARED AND VDI MACHINES
 * `localStorage` is per-browser, not per-person, so two people on one desk overwrite each
 * other. `saveKey(seat)` gives each seat its own slot; until the interface offers a seat
 * picker, the run code is the portable identity — it is the one piece of a run that
 * survives the machine.
 *
 * PURE. Storage is a Web API, so this module never touches it: it turns state into a
 * string and a string into a verdict, and `App.tsx` does the reading and writing.
 */

import { codeFromState, rulesFingerprint, shapeFingerprint } from "./runcode";
import {
  DIMENSIONS,
  BADGE_META,
  isMission,
  type Content,
  type GameState,
  type HistoryEntry,
  type Phase,
} from "./types";

/**
 * The shape of `GameState`, by hand.
 *
 * Bump this when a field is added, removed or reinterpreted — not when content changes,
 * which the fingerprints handle. Schema 5 removes the obsolete prediction fields;
 * schema 4 and bare v3 states are migrated without replaying committed decisions.
 */
export const SAVE_SCHEMA = 5;

/** One stable key, forever. The version lives in the envelope now, where it belongs. */
const KEY_ROOT = "gpl.save";

/**
 * Keys written by earlier builds, newest first.
 *
 * Read in order after the current key comes up empty, so the cohort that is mid-run when
 * this ships keeps their run instead of paying for the fix.
 */
export const LEGACY_SAVE_KEYS: readonly string[] = ["gpl.save.v3"];

/**
 * Where one person's run lives.
 *
 * A seat is any label the room agrees on — a name, a desk number, a cohort tag. It is
 * slugged rather than trusted, because it ends up in a storage key.
 */
export function saveKey(seat?: string): string {
  if (!seat) return KEY_ROOT;
  const slug = seat
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return slug ? `${KEY_ROOT}.${slug}` : KEY_ROOT;
}

export interface SaveEnvelope {
  schema: number;
  /** `shapeFingerprint` when this was written — decides whether the code below is playable */
  shape: string;
  /** `rulesFingerprint` when this was written — decides whether the state is still current */
  rules: string;
  /** the run code for this state, computed while the content that produced it was live */
  code: string | null;
  state: GameState;
}

/** What to store. A string, because the engine does not know what storage is. */
export function encodeSave(state: GameState, content: Content): string {
  const envelope: SaveEnvelope = {
    schema: SAVE_SCHEMA,
    shape: shapeFingerprint(content),
    rules: rulesFingerprint(content),
    code: codeFromState(state, content),
    state,
  };
  return JSON.stringify(envelope);
}

export type StaleReason =
  /** stored by a build whose `GameState` had a different shape */
  | "schema"
  /** stored before the story changed in a way that changes what the numbers mean */
  | "story"
  /** not a save, or a damaged one */
  | "unreadable";

export type LoadOutcome =
  | { status: "empty" }
  | {
      status: "ok";
      state: GameState;
      /** true when the save was written by an older build and has been adopted */
      migrated: boolean;
    }
  | {
      status: "stale";
      reason: StaleReason;
      /** plain prose the interface may use or replace */
      message: string;
      /** the run behind the stale save, if one could be recovered */
      code: string | null;
      /** whether that code can actually be played on this build */
      replayable: boolean;
    };

/**
 * `resolving` is still on this list, and it has to be.
 *
 * No build produces it any more — `commit` lands on `consequence` — but a save written by
 * the build before this one can be sitting in it, and this list is the gate: drop the
 * value and `looksPlayable` reads that save as a different `GameState` shape, which
 * throws away a run that is one beat from being perfectly resumable. It is kept as a
 * value the boundary can RECOGNISE, not as a phase the game can be in; `adoptPhase`
 * rewrites it on the way through.
 */
const PHASES: readonly string[] = [
  "title",
  "setup",
  "brief",
  "interlude",
  "decide",
  "resolving",
  "consequence",
  "ending",
];

/**
 * Bring a loaded state into a phase this build actually renders.
 *
 * The only case is `resolving`, deleted from the flow because it was a one-second screen
 * holding 17 of a run's 76 screen instances. Its successor is where the state already
 * belongs: `commit` applied every effect and then set the phase, so a `resolving` state
 * IS a post-commit state, and the resolution the consequence beat needs to draw is in the
 * save beside it.
 *
 * Returns null when there is nothing honest to adopt. A `resolving` state with no
 * resolution cannot have come from any build that shipped — `commit` writes both in one
 * object — so it is damage, and guessing a phase for it would put the player on a screen
 * with nothing on it. That is worse than saying the save could not be read.
 */
function adoptPhase(state: GameState): GameState | null {
  const old = state as unknown as Record<string, unknown>;
  if (old.phase === "resolving" && !state.resolution) return null;
  const clean = { ...old };
  delete clean.prediction;
  clean.phase = old.phase === "resolving" ? "consequence" : old.phase;
  clean.history = state.history.map((entry) => {
    const copy = { ...entry } as unknown as Record<string, unknown>;
    delete copy.predictionCorrect;
    return copy;
  });
  if (state.resolution) {
    const copy = { ...state.resolution } as unknown as Record<string, unknown>;
    delete copy.predicted;
    delete copy.actualLeastMoved;
    delete copy.predictionCorrect;
    clean.resolution = copy;
  }
  return clean as unknown as GameState;
}

const isStrings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

function validDims(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const dims = value as Record<string, unknown>;
  return DIMENSIONS.every((d) => typeof dims[d] === "number" && Number.isFinite(dims[d]) && (dims[d] as number) >= 0 && (dims[d] as number) <= 100);
}

function validLesson(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const lesson = value as Record<string, unknown>;
  return typeof lesson.principle === "string" && typeof lesson.because === "string" && (lesson.watchFor === undefined || typeof lesson.watchFor === "string");
}

/**
 * Is this state something this content could actually be in?
 *
 * The old check was one line — "is `nodeId` a string, and does that node exist" — which
 * let a save from a different `GameState` shape through to crash two screens later, when
 * a missing `history` or `dims` field is read. Anything reachable through a load has to be
 * checked at the boundary, because after it the engine is entitled to assume its own types.
 */
function looksPlayable(state: unknown, content: Content): state is GameState {
  if (!state || typeof state !== "object") return false;
  const s = state as Partial<GameState>;
  if (typeof s.nodeId !== "string" || !content.nodes[s.nodeId]) return false;
  if (typeof s.phase !== "string" || !PHASES.includes(s.phase as Phase)) return false;
  if (!s.dims || typeof s.dims !== "object") return false;
  for (const d of DIMENSIONS) {
    const value = s.dims[d];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
      return false;
    }
  }
  if (!isStrings(s.flags) || !isStrings(s.badges)) return false;
  if (!s.badges.every((id) => Object.hasOwn(BADGE_META, id))) return false;
  if (!isStrings(s.discovered) || !isStrings(s.selection) || !isStrings(s.completed)) return false;
  if (new Set(s.selection).size !== s.selection.length) return false;
  if (!s.completed.every((id) => content.nodes[id] && isMission(content.nodes[id]!))) return false;
  const node = content.nodes[s.nodeId]!;
  const phase = s.phase as string;
  if (phase === "title" && s.nodeId !== content.startNodeId) return false;
  if (phase === "setup" && node.kind !== "setup") return false;
  if (phase === "interlude" && node.kind !== "interlude") return false;
  if (phase === "ending" && node.kind !== "ending") return false;
  if (["brief", "decide", "consequence", "resolving"].includes(phase) && !isMission(node)) return false;
  if (isMission(node)) {
    const legal =
      node.kind === "choice" ? node.options.map((o) => o.id)
      : node.kind === "investigate" ? node.evidence.map((e) => e.id)
      : node.kind === "build" ? node.components.map((c) => c.id)
      : node.levers.flatMap((l) => l.options.map((o) => o.id));
    const max =
      node.kind === "choice" ? 1
      : node.kind === "investigate" ? node.slots
      : node.kind === "build" ? node.pick
      : node.levers.length;
    if (s.selection.length > max || !s.selection.every((id) => legal.includes(id))) return false;
    /* A half-set lever panel is a legal draft; two settings on one lever is not a state
       `toggleSelection` can produce, so it did not come from this build. */
    if (node.kind === "levers" && node.levers.some((l) => l.options.filter((o) => s.selection!.includes(o.id)).length > 1)) {
      return false;
    }
  }
  /* The promise calendar (D-086). Optional — absent until a settle beat, and on every save
     written before the calendar existed — so this adds a field without changing what an
     older state means, which is why `SAVE_SCHEMA` did not move. Present, it is read by the
     ending screen and must be whole. */
  if (s.settled !== undefined) {
    if (!Array.isArray(s.settled)) return false;
    for (const r of s.settled) {
      if (!r || typeof r !== "object") return false;
      if (typeof r.flag !== "string" || typeof r.line !== "string" || typeof r.due !== "string") return false;
      if (typeof r.dueMonth !== "number" || !Number.isFinite(r.dueMonth)) return false;
      if (!["kept", "late", "broken", "void"].includes(r.status)) return false;
    }
  }
  if (!Array.isArray(s.history)) return false;
  for (const entry of s.history as HistoryEntry[]) {
    if (!entry || typeof entry !== "object") return false;
    if (typeof entry.missionId !== "string" || !content.nodes[entry.missionId]) return false;
    if (!isStrings(entry.chosenIds) || entry.chosenIds.length === 0) return false;
    if (typeof entry.outcomeId !== "string") return false;
    if (!["strong", "mixed", "hard"].includes(entry.tone)) return false;
    if (typeof entry.missionTitle !== "string" || typeof entry.chosenLabel !== "string" || typeof entry.headline !== "string" || typeof entry.chapter !== "number") return false;
    if (!validDims(entry.dimsBefore) || !validDims(entry.dimsAfter) || !validLesson(entry.lesson)) return false;
  }
  if (phase === "consequence" || phase === "resolving") {
    const r = s.resolution;
    if (!r || typeof r !== "object" || !r.outcome || typeof r.outcome !== "object") return false;
    if (typeof r.chosenLabel !== "string" || !validLesson(r.lesson) || !validDims(r.dimsBefore) || !validDims(r.dimsAfter)) return false;
    if (!r.deltas || !DIMENSIONS.every((d) => typeof r.deltas[d] === "number" && Number.isFinite(r.deltas[d]))) return false;
    if (!isStrings(r.newBadges) || !r.newBadges.every((id) => Object.hasOwn(BADGE_META, id)) || !Array.isArray(r.revealed)) return false;
    if (typeof r.outcome.id !== "string" || typeof r.outcome.headline !== "string" || typeof r.outcome.detail !== "string" || !isStrings(r.outcome.changed)) return false;
    if (!["strong", "mixed", "hard"].includes(r.outcome.tone)) return false;
    if (r.outcome.next !== undefined && !content.nodes[r.outcome.next]) return false;
    if (!r.revealed.every((e) => e && typeof e.id === "string" && typeof e.label === "string" && typeof e.reveals === "string")) return false;
  } else if (s.resolution !== null) return false;
  return true;
}

const STALE_MESSAGES: Record<StaleReason, string> = {
  schema:
    "This run was saved by an earlier version of the game, which kept its progress in a different shape.",
  story:
    "This run was saved before the story was updated, so where it left off no longer means what it meant then.",
  unreadable: "The saved run could not be read.",
};

function stale(
  reason: StaleReason,
  code: string | null,
  replayable: boolean,
): LoadOutcome {
  return { status: "stale", reason, message: STALE_MESSAGES[reason], code, replayable };
}

/**
 * Decide what to do with whatever came out of storage.
 *
 * One call, one answer, and every answer says something: resume it, adopt it, or explain
 * why not and hand back the fourteen characters that carry the run across. Nothing here
 * returns null, which is what made the old behaviour invisible — a missing Resume button
 * is not a message.
 */
export function decodeSave(raw: string | null | undefined, content: Content): LoadOutcome {
  if (!raw || !raw.trim()) return { status: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return stale("unreadable", null, false);
  }
  /* A stored `null` is an empty slot, not damage — something cleared the save rather than
     corrupting it, and there is nothing for a player to be told about that. */
  if (parsed === null) return { status: "empty" };
  if (typeof parsed !== "object") return stale("unreadable", null, false);

  const envelope = parsed as Partial<SaveEnvelope>;

  /* No schema field means a bare `GameState` from the build before this one. It is adopted
     rather than discarded — that cohort is exactly who the item was written for — after
     the same structural check every other save gets. The cost is stated: a bare state
     carries no fingerprint, so if it came from a build with different rules there is
     nothing here that can tell. This is the one and only migration with that hole in it,
     and it closes as soon as the first envelope is written over the top. */
  if (envelope.schema === undefined && envelope.state === undefined) {
    if (!looksPlayable(parsed, content)) return stale("unreadable", null, false);
    const legacy = adoptPhase(parsed as GameState);
    if (!legacy) return stale("unreadable", null, false);
    if (legacy.phase === "title") return { status: "empty" };
    return { status: "ok", state: legacy, migrated: true };
  }

  if (typeof envelope.schema !== "number" || !looksPlayable(envelope.state, content)) {
    return stale("unreadable", typeof envelope.code === "string" ? envelope.code : null, false);
  }

  /* The phase is adopted before the fingerprints are compared, so the run code below is
     taken from the state the player will actually resume into rather than from a phase
     this build has no screen for. */
  const state = adoptPhase(envelope.state);
  if (!state) {
    return stale("unreadable", typeof envelope.code === "string" ? envelope.code : null, false);
  }
  const code = typeof envelope.code === "string" ? envelope.code : codeFromState(state, content);
  /* A code is only playable if the decisions still index the same way. `runcode.ts`
     refuses it otherwise, so promising it here would be a promise broken one screen later. */
  const replayable = envelope.shape === shapeFingerprint(content) && code !== null;

  if (envelope.schema !== SAVE_SCHEMA && envelope.schema !== 4) return stale("schema", code, replayable);
  if (envelope.rules !== rulesFingerprint(content)) return stale("story", code, replayable);
  if (state.phase === "title") return { status: "empty" };

  /* `migrated` means "written by an older build and adopted", which a rewritten phase is
     — the state going back is not the state that came in. The interface may say so; what
     matters here is that it does not claim the save arrived current when it did not. */
  return { status: "ok", state, migrated: envelope.schema !== SAVE_SCHEMA || state.phase !== envelope.state.phase };
}
