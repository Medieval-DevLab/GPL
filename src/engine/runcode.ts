/**
 * GPL run codes — a whole playthrough in fourteen typeable characters.
 *
 * The game has no randomness (D-005) and no clock, so a run is completely determined by
 * the ordered list of decisions the player made: the chapter 0 advantage, then one
 * selection per mission. Everything else — three meters, twenty-odd flags, sixteen
 * history entries, the verdict — is a function of that list. A serialised `GameState` for
 * a finished run is about 11,900 characters; the decisions inside it are 36 bits.
 *
 * So this module trades a fat artefact for a thin one, and the thin one is the useful
 * shape: a player can read a run code down the phone, a facilitator can pre-read a
 * cohort's runs before the session, a bug report can carry the exact run that produced
 * it, and a run can survive a browser, a laptop or an LMS that wipes local storage.
 * `suspend_data` in SCORM 1.2 is capped at 4,096 characters, which a `GameState` does not
 * fit inside and 14 characters obviously does.
 *
 * WHY THE CODE IS SHORT
 * The decisions are not encoded independently. At each beat the game itself knows exactly
 * how many selections were legal — three or four options, or C(5,2)=10 ways to spend two
 * investigation slots, or C(6,3)=20 ways to build a proposal, or at most 3 × 3 × 3 = 27
 * combinations of lever settings (D-084) — so each decision is stored
 * as an index into that list and the indices are packed in mixed radix. That is why both
 * functions here take `content`: the radices come from the game, and a code that did not
 * know them would have to spell out the option ids and would run to five times the length.
 *
 * There is no explicit length field. The packed integer starts at 1 rather than 0, so the
 * leading sentinel marks the end of the digits: decoding stops when the accumulator is
 * back down to 1. It costs a single bit and it is the difference between eight payload
 * characters and nine.
 *
 * WHAT A CODE DOES NOT CARRY
 * Uncommitted draft selections and presentation checkpoints. Local saves retain those;
 * portable codes replay committed decisions and stop at the next unread brief.
 *
 * PURE. No React, no DOM, no `Date.now`, no `Math.random`, no `fetch` — same law as the
 * rest of `src/engine`, and `runcode.test.ts` now sweeps the whole directory for it.
 */

import { openingState, possibleSelections } from "./analysis";
import { advance, chooseSetup, commit, fnv1a, getNode } from "./engine";
import {
  DIMENSIONS,
  isMission,
  type Condition,
  type Content,
  type Effect,
  type GameState,
  type Mission,
  type Outcome,
  type Setup,
} from "./types";

/** A playthrough as the player's own decisions, which is all a run actually is. */
export interface Run {
  /** the chapter 0 advantage, by `SetupOption` id */
  advantage: string;
  /**
   * One entry per committed decision, in the order played; each entry is the set of ids
   * chosen at that beat. Sets, not sequences: two players who spent the same two
   * investigation slots in a different order made the same decision and get the same
   * code, which is the property peer comparison needs.
   */
  selections: string[][];
}

/**
 * Bumped only when the *format* changes — the alphabet, the layout, the checksum.
 *
 * A content change is not a format change; that is what the fingerprint below is for.
 * Keeping the two separate means a story patch does not invalidate the notion of a code,
 * and a format change does not pretend to be a story patch.
 */
export const RUN_CODE_VERSION = 1;

/**
 * Crockford's base32: no I, L, O or U.
 *
 * Chosen over plain base32 or base64 because a run code is going to be dictated across a
 * room and typed back in. I/1, O/0 and L/1 are the confusions that actually happen, so
 * they are folded on input rather than merely hoped about, and U is absent so that no
 * code can spell anything unfortunate.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Characters of shape fingerprint carried in the code: 15 bits. */
const FINGERPRINT_CHARS = 3;
/** Characters of checksum: 10 bits, so a mistyped code passes about once in 1,024. */
const CHECKSUM_CHARS = 2;
/** Dictation grouping. Stripped on the way back in, so it is presentation only. */
const GROUP_SIZE = 4;
/**
 * Loop guard. The walk is bounded by the content — it stops when the node it reaches is
 * not a mission — so this only fires if content ever grows a cycle, which is a bug worth
 * a thrown error rather than a hung tab.
 */
const MAX_DECISIONS = 64;

/* ─────────────────────────── the fingerprints ─────────────────────────── */

function condText(c: Condition | undefined): string {
  if (!c) return "-";
  const flags = (xs: string[] | undefined) => (xs ? [...xs].sort().join(",") : "");
  const bounds = (b: Partial<Record<string, number>> | undefined) =>
    b ? DIMENSIONS.map((d) => `${d}${b[d] ?? ""}`).join("") : "";
  return `${flags(c.all)}/${flags(c.any)}/${flags(c.none)}/${bounds(c.min)}/${bounds(c.max)}`;
}

function effectText(e: Effect | undefined): string {
  if (!e) return "-";
  const dims = DIMENSIONS.map((d) => `${d}${e.dims?.[d] ?? 0}`).join("");
  return `${dims}/${[...(e.flags ?? [])].sort().join(",")}/${e.badge ?? ""}`;
}

/** Ids and arity only — the part that decides what a digit in a code *means*. */
function outcomeShape(o: Outcome): string {
  return `${o.id}>${o.next ?? ""}`;
}

/** Everything about an outcome that changes the state a replay lands in. */
function outcomeRules(o: Outcome): string {
  return `${outcomeShape(o)}|${condText(o.when)}|${effectText(o.effect)}`;
}

function missionText(m: Mission, rules: boolean): string {
  const parts: string[] = [`${m.kind}:${m.id}>${m.next}`];
  switch (m.kind) {
    case "choice":
      for (const o of m.options) {
        parts.push(`o:${o.id}|${condText(o.requires)}`);
        for (const oc of o.outcomes) parts.push(rules ? outcomeRules(oc) : outcomeShape(oc));
      }
      break;
    case "investigate":
      parts.push(`slots:${m.slots}`);
      for (const e of m.evidence)
        parts.push(`e:${e.id}${rules ? `|${[...(e.flags ?? [])].sort().join(",")}` : ""}`);
      for (const oc of m.outcomes) parts.push(rules ? outcomeRules(oc) : outcomeShape(oc));
      break;
    case "build":
      parts.push(`pick:${m.pick}`);
      for (const c of m.components)
        parts.push(
          `c:${c.id}${
            rules
              ? `|${[...(c.flags ?? [])].sort().join(",")}|${DIMENSIONS.map(
                  (d) => `${d}${c.dims?.[d] ?? 0}`,
                ).join("")}`
              : ""
          }`,
        );
      for (const oc of m.outcomes) parts.push(rules ? outcomeRules(oc) : outcomeShape(oc));
      break;
    case "levers":
      /* Shape: every lever, every setting and its lock, in authored order — because the
         digit for a lever decision is an index into the cartesian product of the open
         settings, and moving a setting or a lock changes what that index means. Rules
         add each setting's immediate effect, which decides where a replay lands. */
      for (const l of m.levers) {
        parts.push(`l:${l.id}`);
        for (const o of l.options)
          parts.push(
            `s:${o.id}|${condText(o.requires)}${
              rules ? `|${effectText({ dims: o.dims, flags: o.flags })}` : ""
            }`,
          );
      }
      for (const oc of m.outcomes) parts.push(rules ? outcomeRules(oc) : outcomeShape(oc));
      break;
  }
  return parts.join(";");
}

function setupText(s: Setup, rules: boolean): string {
  const parts = [`setup:${s.id}>${s.next}`];
  for (const o of s.options)
    parts.push(
      `a:${o.id}${
        rules
          ? `|${[...o.flags].sort().join(",")}|${DIMENSIONS.map((d) => `${d}${o.dims?.[d] ?? 0}`).join(
              "",
            )}`
          : ""
      }`,
    );
  return parts.join(";");
}

/**
 * The canonical text a fingerprint is taken over.
 *
 * Deliberately built by walking named fields rather than by `JSON.stringify(content)`,
 * because what belongs in a fingerprint is a judgement and stringify makes it by accident.
 * Prose is excluded on purpose: headlines, details, situations, variants, lessons, tips,
 * advisors, images, chapters, `missionOrder` and the causal-thread copy. None of them can
 * change which selections are legal or what state a run reaches — so a typo fix mid-cohort
 * must not invalidate anybody's save or anybody's code. That is the whole point of taking
 * the fingerprint over a hand-written projection.
 *
 * `rules: false` gives the SHAPE: node ids, kinds, arity, selectable ids, `requires`, and
 * every outcome id and diversion. Two contents with the same shape give every digit of a
 * run code the same meaning, so a code is decodable across them.
 *
 * `rules: true` adds conditions, effects and component stats: everything that decides
 * *where a replay lands*. Same shape, different rules means a code still reads correctly
 * but replays to a different position — which is exactly the distinction a mid-cohort
 * patch needs, and why there are two of these rather than one.
 */
function canonicalContent(content: Content, rules: boolean): string {
  const parts: string[] = [`start:${content.startNodeId}`];
  for (const id of Object.keys(content.nodes).sort()) {
    const node = content.nodes[id];
    if (!node) continue;
    if (isMission(node)) parts.push(missionText(node, rules));
    else if (node.kind === "setup") parts.push(setupText(node, rules));
    else if (node.kind === "interlude") parts.push(`interlude:${node.id}>${node.next}`);
    else parts.push(`ending:${node.id}`);
  }
  return parts.join("\n");
}

/**
 * What makes a run code readable: 8 hex characters over the decision structure.
 *
 * If this matches, every digit in a code means the selection the player actually made.
 * If it does not, the code must be refused — decoding it against different arity would
 * silently play somebody else's run, which is worse than telling them it cannot be read.
 */
export function shapeFingerprint(content: Content): string {
  return fnv1a(canonicalContent(content, false)).toString(16).padStart(8, "0");
}

/**
 * What makes a saved state current: 8 hex characters over structure *and* rules.
 *
 * A stored `GameState` is the arithmetic of the rules that were live when it was written.
 * Change an effect by one point and the state is no longer something this build would
 * produce — so a save is stale, while a code is still perfectly good.
 */
export function rulesFingerprint(content: Content): string {
  return fnv1a(canonicalContent(content, true)).toString(16).padStart(8, "0");
}

/* ─────────────────────────── base32 ─────────────────────────── */

function toBase32(value: bigint): string {
  if (value <= 0n) return ALPHABET[0] as string;
  let out = "";
  let v = value;
  while (v > 0n) {
    out = (ALPHABET[Number(v % 32n)] as string) + out;
    v /= 32n;
  }
  return out;
}

function toBase32Fixed(value: bigint, width: number): string {
  let out = "";
  let v = value;
  for (let i = 0; i < width; i++) {
    out = (ALPHABET[Number(v % 32n)] as string) + out;
    v /= 32n;
  }
  return out;
}

function fromBase32(chars: string): bigint | null {
  let v = 0n;
  for (const ch of chars) {
    const digit = ALPHABET.indexOf(ch);
    if (digit < 0) return null;
    v = v * 32n + BigInt(digit);
  }
  return v;
}

/**
 * Fold a dictated code back to the alphabet.
 *
 * Case, spaces and the grouping hyphens are presentation, so they go. O→0 and I/L→1 are
 * Crockford's substitutions and they are the errors that happen when a code is read out
 * loud. Anything else is rejected rather than stripped: quietly dropping an unknown
 * character shortens the payload and produces a *different valid-looking* code, which is
 * the one failure mode a checksum cannot help with.
 */
function canonicalise(raw: string): string | null {
  let out = "";
  for (const ch of raw.trim().toUpperCase()) {
    if (ch === "-" || ch === " " || ch === "\t") continue;
    const folded = ch === "O" ? "0" : ch === "I" || ch === "L" ? "1" : ch;
    if (!ALPHABET.includes(folded)) return null;
    out += folded;
  }
  return out;
}

function group(body: string): string {
  const out: string[] = [];
  for (let i = 0; i < body.length; i += GROUP_SIZE) out.push(body.slice(i, i + GROUP_SIZE));
  return out.join("-");
}

function checksumFor(body: string): string {
  return toBase32Fixed(BigInt(fnv1a(body) % 1024), CHECKSUM_CHARS);
}

function fingerprintFor(content: Content): string {
  /* The top 15 bits of the shape fingerprint. Three characters, so a patch that changes
     the decision structure and happens to collide anyway is a 1-in-32,768 event — against
     a certainty of misplaying the run if the code carried no fingerprint at all. */
  const full = Number.parseInt(shapeFingerprint(content), 16) >>> 0;
  return toBase32Fixed(BigInt(full >>> 17), FINGERPRINT_CHARS);
}

/* ─────────────────────────── the walk ─────────────────────────── */

/**
 * Advance to the next thing the player has to decide, skipping the beats that decide
 * themselves.
 *
 * Stops on a mission's brief rather than on its options, because that is where a resumed
 * player belongs: they have not read this brief yet. `analysis.playMission` stops one beat
 * further on, which is right for a sweep and wrong for a person.
 */
function settle(state: GameState, content: Content): GameState {
  let out = state;
  let guard = 0;
  while (out.phase === "interlude" && guard++ < MAX_DECISIONS) out = advance(out, content);
  return out;
}

/** Commit one decision and come to rest at the next unread brief. */
function commitSelection(state: GameState, content: Content, selection: string[]): GameState {
  let s = state.phase === "brief" ? advance(state, content) : state;
  s = { ...s, selection: [...selection] };
  s = commit(s, content);
  /* `commit` lands on `consequence`, so this is the only advance a replay needs. It was
     two while `resolving` sat in between; `settle` skips interludes but not briefs, so a
     leftover second call here WOULD have overshot — it would have taken the resumed
     player past the brief they have not read yet, which is the one thing `settle`
     deliberately stops in front of. */
  s = advance(s, content); // consequence -> the next node
  return settle(s, content);
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

interface Walked {
  digits: number[];
  radices: number[];
  state: GameState;
}

/** Chapter 0, which is where every run starts and the only beat outside `history`. */
function setupNode(content: Content, state: GameState): Setup {
  const node = getNode(content, state.nodeId);
  if (node.kind !== "setup") {
    throw new Error("runcode: the game does not open on a setup node, so there is no advantage");
  }
  return node;
}

function walkRun(content: Content, run: Run): Walked {
  const digits: number[] = [];
  const radices: number[] = [];

  let state = openingState(content);
  const setup = setupNode(content, state);
  const advantage = setup.options.findIndex((o) => o.id === run.advantage);
  if (advantage < 0) {
    throw new Error(`runcode: "${run.advantage}" is not a starting advantage in this content`);
  }
  digits.push(advantage);
  radices.push(setup.options.length);
  state = settle(chooseSetup(state, content, run.advantage), content);

  for (const selection of run.selections) {
    const node = getNode(content, state.nodeId);
    if (!isMission(node)) {
      throw new Error(
        `runcode: the run has ${run.selections.length} decisions but the game ends at ${digits.length - 1}`,
      );
    }
    const legal = possibleSelections(node, state);
    const index = legal.findIndex((s) => sameSet(s, selection));
    if (index < 0) {
      throw new Error(
        `runcode: [${selection.join(", ")}] is not a legal selection at "${node.id}"`,
      );
    }
    digits.push(index);
    radices.push(legal.length);
    /* The canonical member of the enumeration, not what was handed in: that is what makes
       the code independent of the order the player happened to click. */
    state = commitSelection(state, content, legal[index] as string[]);
  }

  return { digits, radices, state };
}

/* ─────────────────────────── the public surface ─────────────────────────── */

/**
 * The code for a run. Throws if the run is not one this content can play — loudly, because
 * a code for an impossible run is worse than no code.
 */
export function encodeRun(content: Content, run: Run): string {
  const { digits, radices } = walkRun(content, run);
  /* Sentinel first: see the header. The 1 sits above the most significant digit, so the
     decoder knows it has run out of decisions without being told how many there were. */
  let value = 1n;
  for (let k = digits.length - 1; k >= 0; k--) {
    value = value * BigInt(radices[k] as number) + BigInt(digits[k] as number);
  }
  const body =
    (ALPHABET[RUN_CODE_VERSION] as string) + fingerprintFor(content) + toBase32(value);
  return group(body + checksumFor(body));
}

export type DecodeFailure =
  /** nothing typed */
  | "empty"
  /** a character that is not in the alphabet, so something was mis-copied */
  | "charset"
  /** too short to be a code at all */
  | "shape"
  /** the code is the right shape and does not add up — a typo, almost always */
  | "checksum"
  /** a code from a later or earlier format */
  | "version"
  /** a code from a build whose decision structure differs; the digits cannot be trusted */
  | "content"
  /** the payload decodes to decisions this game does not have */
  | "structure";

export type DecodeResult =
  | {
      ok: true;
      run: Run;
      /** the state the run reaches, so a caller does not replay it a second time */
      state: GameState;
    }
  | { ok: false; reason: DecodeFailure; message: string };

/**
 * Read a run code.
 *
 * Returns a result rather than throwing, and never returns a run it is not sure of: the
 * checksum catches the typo, the version catches the format and the fingerprint catches
 * the content. Each has its own reason so the interface can say which of the four true
 * things it is, instead of "invalid code".
 */
export function decodeRun(content: Content, code: string): DecodeResult {
  const fail = (reason: DecodeFailure, message: string): DecodeResult => ({
    ok: false,
    reason,
    message,
  });

  if (!code || !code.trim()) return fail("empty", "No run code entered.");
  const body = canonicalise(code);
  if (body === null) {
    return fail("charset", "That code contains a character a run code never uses.");
  }
  const minimum = 1 + FINGERPRINT_CHARS + 1 + CHECKSUM_CHARS;
  if (body.length < minimum) return fail("shape", "That code is too short to be a run code.");

  const payload = body.slice(0, body.length - CHECKSUM_CHARS);
  if (checksumFor(payload) !== body.slice(body.length - CHECKSUM_CHARS)) {
    return fail("checksum", "That code does not add up, so a character is wrong somewhere.");
  }
  if (body[0] !== ALPHABET[RUN_CODE_VERSION]) {
    return fail("version", "That code was made by a different version of the game.");
  }
  if (payload.slice(1, 1 + FINGERPRINT_CHARS) !== fingerprintFor(content)) {
    return fail(
      "content",
      "That code is from a version of the story with different decisions, so it cannot be replayed here.",
    );
  }

  let value = fromBase32(payload.slice(1 + FINGERPRINT_CHARS));
  /* 1 is the bare sentinel: a well-formed code with nothing packed underneath it. */
  if (value === null || value <= 1n) return fail("structure", "That code carries no decisions.");

  let state = openingState(content);
  const setup = setupNode(content, state);
  const advantageRadix = BigInt(setup.options.length);
  const advantageIndex = Number(value % advantageRadix);
  value /= advantageRadix;
  const advantage = setup.options[advantageIndex];
  if (!advantage) return fail("structure", "That code names an advantage this game does not have.");
  state = settle(chooseSetup(state, content, advantage.id), content);

  const selections: string[][] = [];
  let guard = 0;
  while (value > 1n) {
    if (guard++ >= MAX_DECISIONS) {
      return fail("structure", "That code carries more decisions than the game has beats.");
    }
    const node = getNode(content, state.nodeId);
    if (!isMission(node)) {
      return fail("structure", "That code carries more decisions than this game has.");
    }
    const legal = possibleSelections(node, state);
    if (legal.length === 0) {
      return fail("structure", `There is nothing selectable at "${node.id}".`);
    }
    const radix = BigInt(legal.length);
    const index = Number(value % radix);
    value /= radix;
    const selection = legal[index] as string[];
    selections.push([...selection]);
    state = commitSelection(state, content, selection);
  }

  return { ok: true, run: { advantage: advantage.id, selections }, state };
}

/**
 * The run a state was produced by.
 *
 * `history` already holds it — one entry per committed decision, with the ids chosen — so
 * this is a projection rather than a reconstruction. The advantage is the one thing
 * history does not record, and it is recoverable because each chapter 0 option sets its
 * own flags. Returns null before the advantage is taken, when there is no run yet.
 */
export function runFromState(state: GameState, content: Content): Run | null {
  const setup = setupNode(content, openingState(content));
  const taken = setup.options.filter(
    (o) => o.flags.length > 0 && o.flags.every((f) => state.flags.includes(f)),
  );
  if (taken.length !== 1) return null;
  return {
    advantage: (taken[0] as { id: string }).id,
    selections: state.history.map((h) => [...h.chosenIds]),
  };
}

/** The code for a state, or null if it has not started. Convenience: this is the one-liner. */
export function codeFromState(state: GameState, content: Content): string | null {
  const run = runFromState(state, content);
  if (!run) return null;
  try {
    return encodeRun(content, run);
  } catch {
    /* The state was produced by content this build no longer has, so its decisions cannot
       be indexed. Nothing to offer, and nothing to crash over. */
    return null;
  }
}

/** Play a run and hand back the state it reaches, resting on the next unread brief. */
export function replayRun(content: Content, run: Run): GameState {
  return walkRun(content, run).state;
}
