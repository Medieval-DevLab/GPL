/**
 * Exhaustive narrative analysis.
 *
 * The story graph is linear (ten missions in sequence) but the STATE space
 * branches: 3 × C(5,2) × 3 × 3 × 4 × 3 × C(6,3) × 4 × 4 × 4 ≈ 4.1 million
 * distinct playthroughs. Enumerating those naively is wasteful, but most of
 * them converge on the same state — so we walk mission by mission and
 * deduplicate on (dims + flags). That collapses it to something trivial and
 * lets us answer questions a human reviewer cannot:
 *
 *   · Is every outcome reachable? (dead content)
 *   · Does any option beat its siblings on all three dimensions in every
 *     case? (a fake choice — the mechanical test for "no right answer")
 *
 * It does NOT answer questions about meter bounds, though it used to claim to. Because
 * the dedup key excludes dimensions, `entryRanges` and `finalRange` are samples of
 * first-arriving paths. `reachableExtremes` answers that question instead, by replaying
 * greedy policies — so every value it reports is witnessed by an actual playthrough.
 *
 * Pure and deterministic. Runs in the test suite.
 */

import {
  advance,
  chooseSetup,
  commit,
  createInitialState,
  evaluateCondition,
  finalVerdict,
  getNode,
  terminalConditions,
} from "./engine";
import {
  DIMENSIONS,
  isMission,
  type Condition,
  type Content,
  type DimensionId,
  type GameState,
  type LeverMission,
  type Mission,
} from "./types";

/* ─────────────────────────── helpers ─────────────────────────── */

function combinations<T>(items: readonly T[], k: number): T[][] {
  if (k <= 0) return [[]];
  if (k > items.length) return [];
  const out: T[][] = [];
  const pick = (start: number, acc: T[]) => {
    if (acc.length === k) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i < items.length; i++) {
      acc.push(items[i] as T);
      pick(i + 1, acc);
      acc.pop();
    }
  };
  pick(0, []);
  return out;
}

/** Flags read by the conditions of one mission. */
function missionReadFlags(node: Mission): Set<string> {
  const read = new Set<string>();
  const note = (c: Condition | undefined) => {
    if (!c) return;
    for (const f of [...(c.all ?? []), ...(c.any ?? []), ...(c.none ?? [])]) read.add(f);
  };
  for (const v of node.variants ?? []) note(v.when);
  /* Who speaks reads the record too. Leave the voices out of the key and a state that would
     hear Marcus collapses into one that would not, so "someone can hear every line" becomes
     a statement about whichever state arrived first (D-086). */
  for (const q of node.quotes ?? []) note(q.when);
  if (Array.isArray(node.advisorLine)) for (const l of node.advisorLine) note(l.when);
  if (node.kind === "choice") {
    for (const o of node.options) {
      note(o.requires);
      for (const oc of o.outcomes) note(oc.when);
    }
  } else {
    /* A locked lever setting reads its card exactly as a locked choice option does, so
       the flag decides which combinations are legal and has to be in the dedup key —
       or two states either side of it collapse and the combinations only one of them
       could play are never swept. */
    if (node.kind === "levers") for (const l of node.levers) for (const o of l.options) note(o.requires);
    for (const oc of node.outcomes) note(oc.when);
  }
  return read;
}

/**
 * For each mission, the flags that IT or ANY LATER mission reads.
 *
 * This is what makes the sweep both exact and tractable. Two states that differ only in
 * flags no remaining mission will ever read cannot diverge again, so they are the same
 * state for coverage purposes and collapsing them loses nothing.
 */
function suffixReadFlags(content: Content): Map<string, Set<string>> {
  const order = content.missionOrder;
  const out = new Map<string, Set<string>>();
  /* The end of the run reads too (D-086): the promise calendar settles on what the player
     holds and the endings choose on it, both after the last decision. So every flag they
     read is in every mission's suffix — leave one out and two runs that settle differently
     collapse at the first decision, and a promise that can break is reported as one that
     cannot. */
  const acc = new Set<string>(terminalReadFlags(content));
  for (let i = order.length - 1; i >= 0; i--) {
    const node = content.nodes[order[i] as string];
    if (node && isMission(node)) for (const f of missionReadFlags(node)) acc.add(f);
    out.set(order[i] as string, new Set(acc));
  }
  return out;
}

/** Every flag the promise calendar and the endings read, including each rule's own card. */
function terminalReadFlags(content: Content): Set<string> {
  const out = new Set<string>((content.promises ?? []).map((p) => p.flag));
  for (const c of terminalConditions(content)) {
    for (const f of [...(c.all ?? []), ...(c.any ?? []), ...(c.none ?? [])]) out.add(f);
  }
  return out;
}

/** The end of the run's gates, as (dimension, threshold) pairs — see `missionGates`. */
function terminalGates(content: Content): { dim: DimensionId; boundary: number }[] {
  const out: { dim: DimensionId; boundary: number }[] = [];
  for (const c of terminalConditions(content)) {
    for (const d of DIMENSIONS) {
      const lo = c.min?.[d];
      if (lo !== undefined) out.push({ dim: d, boundary: lo });
      const hi = c.max?.[d];
      if (hi !== undefined) out.push({ dim: d, boundary: hi + 1 });
    }
  }
  return out;
}

/**
 * Default bucket width for a dimension that some condition reads.
 *
 * A dimension in the key un-collapses the state space: two states differing by one point
 * of Winability become different states, and the frontier multiplies. Measured on this
 * content, one gated dimension at ten-point buckets takes the walk from 176k states to
 * 506k and from 6s to 22s. Unbucketed all three is not an option — an exhaustive walk over
 * full dimension state exhausts 2 GB and dies.
 *
 * Twenty rather than ten, and the reason is a hard limit rather than taste. Vitest's
 * worker RPC timeout is **hardcoded at 60s** in birpc, and at ten-point buckets a single
 * sweep of this content became ~50s of unbroken synchronous CPU the moment the first
 * dimension gate landed — close enough that one more authored outcome would have failed
 * the run with `Timeout calling "onTaskUpdate"` while every test passed.
 *
 * Coarser is only legal while every gate threshold still sits on a boundary, which
 * `assertGatesOnBoundaries` enforces rather than assumes: the one gate in the content is
 * `min: { deliver: 60 }`, and 60 is a multiple of 20. Raise this again and that guard is
 * what will stop you, not a comment.
 */
const DIM_BUCKET = 20;

/**
 * How the sweep keys its states, and therefore what it can and cannot see.
 *
 * `dimBucket` exists so a test can reproduce the *wrong* answers as well as the right one,
 * which is the only way to know the right one is doing any work (D-037):
 *
 *   · `1`        exact — every point of a gated dimension is its own state. The reference,
 *                affordable only on small content.
 *   · `10`       the default. Tractable, and aligned with thresholds on a multiple of ten.
 *   · `Infinity` the control: every value lands in one bucket, which is precisely the
 *                pre-bucketing key that dropped dimensions altogether. Named rather than
 *                described, so a test asserting what it loses cannot be mistaken for a
 *                test of production behaviour.
 */
export interface SweepOptions {
  dimBucket?: number;
}

/**
 * Everything needed to key a state, computed once per walk.
 *
 * Was three positional arguments threaded through two walkers; the third was added for
 * dimension bucketing and then had to be added again, identically, in
 * `findRealisedDominance`. One object means the two walks cannot key differently — which
 * matters, because the dominance detector's `share` is a fraction of the states the key
 * admits, so a key that differs between the two silently compares different denominators.
 */
interface Keying {
  /** per mission, the flags it or any later mission reads */
  readFlags: Map<string, Set<string>>;
  /** per mission, the dimensions it or any later mission gates on */
  gatedDims: Map<string, DimensionId[]>;
  /** for nodes outside `missionOrder` — setup, interludes, the ending */
  defaultGated: DimensionId[];
  bucket: number;
}

/**
 * Dedup key for the sweep.
 *
 * Four deliberate exclusions. The first three keep it sound; the fourth is an
 * approximation and is the only one that can cost coverage, so it is the one to read:
 *
 *  1. FLAGS NOTHING READS. Purely narrative flags (`signed`, `conventional`…) cannot
 *     affect any branch.
 *  2. FLAGS NOTHING READS *FROM HERE ON*. `knows:real_pain` matters up to the solution
 *     missions and is inert afterwards, so carrying it in the key past that point splits
 *     states that can no longer behave differently.
 *  3. DIMENSIONS NOTHING GATES ON, and dimensions nothing gates on *from here on* — the
 *     same argument as (2), since a dimension no remaining condition reads can only
 *     change the closing numbers, never a branch.
 *  4. THE LOW BITS OF A GATED DIMENSION. Two states in the same bucket collapse. They
 *     agree on every threshold *now* (given alignment, below) but not necessarily later:
 *     `win` 50 and 59 are one state here, and after a shared +5 they sit either side of a
 *     gate at 60. **So bucketing is not exact.** What it is, is one-directional: every
 *     outcome the sweep reports as fired was fired by a real `playMission` call, so there
 *     are no false positives — the loss is completeness, and it surfaces as a reachable
 *     outcome reported DEAD, which is loud. The quiet casualty is
 *     `findRealisedDominance`, whose `share` is a fraction of the states the key admits.
 *
 * (1) and (2) matter in practice: with the full flag set the frontier hit its ceiling at
 * mission 10 of 16, silently truncating coverage and reporting reachable outcomes as dead
 * content. The node id is part of the key because a branch can divert the whole game —
 * walking away from the deal skips delivery — so the frontier holds states at different
 * nodes at the same time.
 */
function stateKey(k: Keying, s: GameState): string {
  const read = k.readFlags.get(s.nodeId);
  const flags = read ? s.flags.filter((f) => read.has(f)) : [...s.flags];
  const gated = k.gatedDims.get(s.nodeId) ?? k.defaultGated;
  const dims = gated
    .map((d) => `${d}${Number.isFinite(k.bucket) ? Math.floor(s.dims[d] / k.bucket) : 0}`)
    .join("");
  return `${s.nodeId}|${flags.sort().join(",")}|${dims}`;
}

/** Gates read by the conditions of one mission, as (dimension, threshold) pairs. */
function missionGates(node: Mission): { dim: DimensionId; boundary: number }[] {
  const out: { dim: DimensionId; boundary: number }[] = [];
  const note = (c: Condition | undefined) => {
    if (!c) return;
    for (const d of DIMENSIONS) {
      /* Where the partition boundary falls, which is not the same number for the two
         clauses. `min: 60` splits 59|60, so the boundary is 60. `max: 59` splits the same
         pair, so its boundary is 60 as well — b + 1. Getting this wrong would put the
         alignment check half a bucket out and quietly pass a misaligned `max`. */
      const lo = c.min?.[d];
      if (lo !== undefined) out.push({ dim: d, boundary: lo });
      const hi = c.max?.[d];
      if (hi !== undefined) out.push({ dim: d, boundary: hi + 1 });
    }
  };
  for (const v of node.variants ?? []) note(v.when);
  if (node.kind === "choice") {
    for (const o of node.options) {
      note(o.requires);
      for (const oc of o.outcomes) note(oc.when);
    }
  } else {
    if (node.kind === "levers") for (const l of node.levers) for (const o of l.options) note(o.requires);
    for (const oc of node.outcomes) note(oc.when);
  }
  return out;
}

/**
 * Which dimensions any condition in the content gates on, and where.
 *
 * Today: none, so everything below is inert and the sweep behaves exactly as it always
 * has. The moment a condition carries `min` or `max` — which the losable-pursuit beat
 * needs — that dimension has to enter the key, or two states that branch differently
 * collapse into one and a reachable outcome is reported as dead content. `validate.ts`
 * warns when this set becomes non-empty; this makes the sweep survive it rather than
 * merely complain.
 */
function gatedDimensions(content: Content): DimensionId[] {
  const gated = new Set<DimensionId>(terminalGates(content).map((g) => g.dim));
  for (const node of Object.values(content.nodes)) {
    if (!isMission(node)) continue;
    for (const g of missionGates(node)) gated.add(g.dim);
  }
  return DIMENSIONS.filter((d) => gated.has(d));
}

/**
 * Per mission, the dimensions IT or ANY LATER mission gates on.
 *
 * The same argument as `suffixReadFlags`, and it matters for the same reason: a dimension
 * no remaining condition reads cannot change a branch again, so keying on it splits states
 * that can no longer behave differently. Note what it does *not* buy — a gate on the last
 * mission is in every mission's suffix, because the value carries forward and accumulates,
 * so it puts that dimension in the key from mission one. Measured: a `min.win` gate on m10
 * and the same gate on m1 produce an identical 506k states, because m10's gate is in m1's
 * suffix either way. The saving only arrives for a gate that is read early and never
 * again.
 */
function suffixGatedDimensions(content: Content): Map<string, DimensionId[]> {
  const order = content.missionOrder;
  const out = new Map<string, DimensionId[]>();
  /* A gate at the end of the run is in every suffix, for the reason given above. */
  const acc = new Set<DimensionId>(terminalGates(content).map((g) => g.dim));
  for (let i = order.length - 1; i >= 0; i--) {
    const node = content.nodes[order[i] as string];
    if (node && isMission(node)) for (const g of missionGates(node)) acc.add(g.dim);
    out.set(order[i] as string, DIMENSIONS.filter((d) => acc.has(d)));
  }
  return out;
}

/**
 * Refuse to run a walk whose key cannot see a threshold it is supposed to see.
 *
 * A gate at `min: { win: 55 }` under ten-point buckets puts 50 and 59 — one side of the
 * gate each — in the same bucket, so the two states collapse *immediately*, not merely
 * after some later drift. The sweep then reports complete coverage of a state space it
 * walked half of, and the test that would have caught it is the one asserting every
 * outcome fires, which passes as soon as any other path happens to satisfy the gate.
 *
 * That is exactly the D-037 family: a gate that cannot see the defect it exists for. The
 * comment this replaces asserted the soundness condition ("a threshold on a bucket
 * boundary, which is where thresholds should be set") and nothing enforced it. Now
 * unaligned content fails loudly, with both remedies named. `Infinity` is exempt because
 * it *is* the control for the unsound case and says so in its own name.
 */
function assertBucketAligned(content: Content, bucket: number): void {
  if (bucket <= 1 || !Number.isFinite(bucket)) return;
  const bad: string[] = [];
  for (const node of Object.values(content.nodes)) {
    if (!isMission(node)) continue;
    for (const g of missionGates(node)) {
      if (g.boundary % bucket !== 0) bad.push(`${node.id}: ${g.dim} boundary at ${g.boundary}`);
    }
  }
  for (const g of terminalGates(content)) {
    if (g.boundary % bucket !== 0) bad.push(`end of run: ${g.dim} boundary at ${g.boundary}`);
  }
  if (bad.length) {
    throw new Error(
      `sweep: ${bad.length} dimension gate(s) do not sit on a ${bucket}-point bucket ` +
        `boundary, so states either side of the threshold share a dedup key and the walk ` +
        `is no longer exhaustive:\n  ${[...new Set(bad)].join("\n  ")}\n` +
        `Move the threshold to a multiple of ${bucket}, or pass { dimBucket: 1 } and pay ` +
        `for an exact walk.`,
    );
  }
}

function keyingFor(content: Content, opts: SweepOptions = {}): Keying {
  const bucket = opts.dimBucket ?? DIM_BUCKET;
  assertBucketAligned(content, bucket);
  return {
    readFlags: suffixReadFlags(content),
    gatedDims: suffixGatedDimensions(content),
    defaultGated: gatedDimensions(content),
    bucket,
  };
}

/**
 * Hard ceiling, so a future content change cannot silently OOM the test run.
 *
 * Raised from 200k when dimension bucketing arrived: a gated dimension multiplies the
 * frontier by roughly the number of occupied buckets, and m8 already holds ~42k states.
 */
const MAX_FRONTIER = 600_000;

/** Every selection a player could legally make at this mission from this state. */
export function possibleSelections(mission: Mission, state: GameState): string[][] {
  switch (mission.kind) {
    case "choice":
      return mission.options
        .filter((o) => evaluateCondition(o.requires, state.flags, state.dims))
        .map((o) => [o.id]);
    case "investigate":
      return combinations(
        mission.evidence.map((e) => e.id),
        mission.slots,
      );
    case "build":
      return combinations(
        mission.components.map((c) => c.id),
        mission.pick,
      );
    case "levers":
      return leverCombinations(mission, state);
  }
}

/**
 * Every combination of settings open in this state: one per lever, in lever order.
 *
 * The cartesian product of each lever's open settings, the first lever varying slowest.
 * That order is load-bearing beyond tidiness — `runcode.ts` stores a decision as an index
 * into this list, so it must be a pure function of the content and the state, which it
 * is. At most 3 × 3 × 3 = 27 entries, which the validator holds it to.
 *
 * A lever with no open setting leaves no legal combination at all, and the decision could
 * not be committed. `validate.ts` therefore requires one setting on every lever that
 * nothing can lock.
 */
function leverCombinations(mission: LeverMission, state: GameState): string[][] {
  let combos: string[][] = [[]];
  for (const lever of mission.levers) {
    const open = lever.options
      .filter((o) => evaluateCondition(o.requires, state.flags, state.dims))
      .map((o) => o.id);
    const grown: string[][] = [];
    for (const combo of combos) for (const id of open) grown.push([...combo, id]);
    combos = grown;
  }
  return combos;
}

/** Commit a selection and fast-forward to the next mission (or the ending). */
export function playMission(state: GameState, content: Content, selection: string[]): GameState {
  let s: GameState = state.phase === "brief" ? advance(state, content) : state;
  s = { ...s, selection };
  s = commit(s, content);
  /* One advance, not two: `commit` lands on `consequence` now rather than on `resolving`.
     The loop below would have swallowed a second call — it walks `brief` and `interlude`
     either way, so the end state is identical — which is the reason to delete it rather
     than leave it. A step that is only harmless because something downstream happens to
     cover for it stops being harmless the day that loop changes. */
  s = advance(s, content); // consequence -> next node (or the diverted one)
  let guard = 0;
  while ((s.phase === "interlude" || s.phase === "brief") && guard++ < 20) {
    s = advance(s, content);
  }
  return s;
}

/**
 * The state at the first decision, past the title and any opening interlude.
 *
 * Stops AT chapter 0 rather than through it — the starting advantage is a real branch
 * and the sweep has to cover all of them, so it is expanded in the sweep loop.
 */
export function openingState(content: Content): GameState {
  let s = createInitialState(content);
  s = advance(s, content); // title -> start node
  let guard = 0;
  while ((s.phase === "interlude" || s.phase === "brief") && guard++ < 20) {
    s = advance(s, content);
  }
  return s;
}

/** Past chapter 0, taking the first advantage. For scripted runs that skip setup. */
export function pastSetup(content: Content, optionId?: string): GameState {
  let s = openingState(content);
  const node = getNode(content, s.nodeId);
  if (node.kind !== "setup") return s;
  s = chooseSetup(s, content, optionId ?? (node.options[0]?.id as string));
  let guard = 0;
  while ((s.phase === "interlude" || s.phase === "brief") && guard++ < 20) {
    s = advance(s, content);
  }
  return s;
}

/* ─────────────────────────── the sweep ─────────────────────────── */

export interface DimRange {
  min: number;
  max: number;
}

export interface SweepResult {
  /** distinct states examined, per mission id */
  statesAtMission: Record<string, number>;
  /** ids of every outcome that fired at least once */
  firedOutcomes: Set<string>;
  /**
   * `missionId/optionId` for every option exercised at least once — choice options and,
   * on a lever decision, every lever setting that was part of a committed combination.
   */
  exercisedOptions: Set<string>;
  /**
   * `missionId/a,b,c` for every lever combination committed at least once, the ids in
   * lever order. A setting being exercised says nothing about whether it was ever played
   * alongside each setting of the other levers, and the outcome list is written over the
   * combination, so the combination is what coverage has to be stated over.
   */
  exercisedSettings: Set<string>;
  /** flags that were set on at least one path */
  reachableFlags: Set<string>;
  /**
   * Dimension range observed on ENTRY to each mission — **a sample, not a bound.**
   *
   * `stateKey` excludes dimensions and the frontier keeps the first state to arrive at
   * each key, so every other dimension vector reaching that key is discarded and its
   * successors are never explored from those numbers. These ranges therefore describe
   * whichever paths happened to arrive first.
   *
   * They were read as bounds, including by this file's own header, and the error was not
   * small: the sweep reported profit ≤ 90 and deliver ≥ 20, while a one-step-greedy walk
   * reaches 100/100/100 and drives deliver to 3. Two reviewers independently concluded the
   * loss verdict was unreachable by quoting `finalRange.win.min`. For a real bound, use
   * `reachableExtremes`, where every number is a replayed path.
   */
  entryRanges: Record<string, Record<DimensionId, DimRange>>;
  /** Dimension range observed at the ending. Same caveat as `entryRanges`. */
  finalRange: Record<DimensionId, DimRange>;
  /** distinct terminal states */
  endings: number;
  /** situation variants that matched at least once, by mission */
  firedVariants: Set<string>;
  /** `missionId#i` for each conditional client quote some reachable state would hear. */
  firedQuotes: Set<string>;
  /** content ending ids some reachable run ends on (D-086) */
  firedEndings: Set<string>;
  /** `endingId#j` for every ending extra some reachable run is shown */
  firedExtras: Set<string>;
  /** `flag/status` for every way a promise card came due on some reachable run */
  settledStatuses: Set<string>;
  /** `flag|line` for every calendar line some reachable run is shown */
  settledLines: Set<string>;
  /**
   * `missionId/leverId` wherever some reachable state leaves a lever with fewer than two
   * open settings. A lever with one open setting is not a choice; the script was checked
   * for this by hand, and this is the check that keeps it so.
   */
  thinLevers: Set<string>;
}

function emptyRange(): Record<DimensionId, DimRange> {
  return {
    win: { min: Infinity, max: -Infinity },
    profit: { min: Infinity, max: -Infinity },
    deliver: { min: Infinity, max: -Infinity },
  };
}

function widen(range: Record<DimensionId, DimRange>, dims: Record<DimensionId, number>): void {
  for (const d of DIMENSIONS) {
    range[d].min = Math.min(range[d].min, dims[d]);
    range[d].max = Math.max(range[d].max, dims[d]);
  }
}

/**
 * The walk itself, as a generator that pauses between levels.
 *
 * A sweep is tens of seconds of unbroken synchronous CPU, and that is what has been
 * failing this build on and off for a fortnight with `Timeout calling "onTaskUpdate"`
 * while every test passes. The diagnosis in D-043 was incomplete. Capping workers at 4
 * helped and did not fix it, because the mechanism is not only that the main thread is
 * busy: A WORKER BLOCKED IN A 50-SECOND LOOP CANNOT READ THE REPLY TO ITS OWN RPC. The
 * request goes out, the worker stops servicing its event loop, and by the time it looks
 * again birpc's hardcoded 60s deadline has passed. Adding cores cannot help that, and the
 * failure therefore came back the moment a dev server was running alongside the suite.
 *
 * So the loop yields once per breadth-first level — around eighteen times per sweep, at
 * points where no partial state is exposed. `sweep` drives it to completion synchronously
 * and is unchanged for every caller; a test drives it step by step instead.
 */
export function* sweepWalk(
  content: Content,
  opts: SweepOptions = {},
): Generator<void, SweepResult, void> {
  const keying = keyingFor(content, opts);
  const result: SweepResult = {
    statesAtMission: {},
    firedOutcomes: new Set(),
    exercisedOptions: new Set(),
    exercisedSettings: new Set(),
    reachableFlags: new Set(),
    entryRanges: {},
    finalRange: emptyRange(),
    endings: 0,
    firedVariants: new Set(),
    firedQuotes: new Set(),
    firedEndings: new Set(),
    firedExtras: new Set(),
    settledStatuses: new Set(),
    settledLines: new Set(),
    thinLevers: new Set(),
  };

  const start = openingState(content);
  let frontier = new Map<string, GameState>([[stateKey(keying, start), start]]);
  let truncated = false;

  /* The frontier can hold states sitting at DIFFERENT nodes, because an outcome may
     divert the game. So group by node each round rather than assuming one node per
     level, and keep terminal states aside as they arrive. */
  let guard = 0;
  while (frontier.size > 0 && guard++ < 200) {
    const byNode = new Map<string, GameState[]>();
    for (const state of frontier.values()) {
      const list = byNode.get(state.nodeId);
      if (list) list.push(state);
      else byNode.set(state.nodeId, [state]);
    }

    const next = new Map<string, GameState>();

    for (const [nodeId, states] of byNode) {
      const node = getNode(content, nodeId);

      // Chapter 0: a real branch, so every starting advantage gets swept.
      if (node.kind === "setup") {
        for (const state of states) {
          for (const option of node.options) {
            let after = chooseSetup(state, content, option.id);
            let g = 0;
            while ((after.phase === "interlude" || after.phase === "brief") && g++ < 20) {
              after = advance(after, content);
            }
            for (const f of after.flags) result.reachableFlags.add(f);
            const key = stateKey(keying, after);
            if (!next.has(key)) next.set(key, after);
          }
        }
        continue;
      }

      if (!isMission(node)) {
        result.endings += states.length;
        for (const s of states) {
          widen(result.finalRange, s.dims);
          /* How the run ended and how its promises came due, on every terminal state — the
             calendar settles on the way in and the ending reads the result, so both are a
             function of the state the sweep already holds (D-086). */
          for (const r of s.settled ?? []) {
            result.settledStatuses.add(`${r.flag}/${r.status}`);
            result.settledLines.add(`${r.flag}|${r.line}`);
          }
          const ending = content.endings?.length ? finalVerdict(s.dims, s.flags, content) : null;
          if (ending?.id) {
            result.firedEndings.add(ending.id);
            const rule = content.endings?.find((e) => e.id === ending.id);
            (rule?.extras ?? []).forEach((x, j) => {
              if (evaluateCondition(x.when, s.flags, s.dims)) result.firedExtras.add(`${ending.id}#${j}`);
            });
          }
        }
        continue;
      }

      const mission = node;
      result.statesAtMission[mission.id] = (result.statesAtMission[mission.id] ?? 0) + states.length;
      result.entryRanges[mission.id] ??= emptyRange();

      for (const state of states) {
        widen(result.entryRanges[mission.id] as Record<DimensionId, DimRange>, state.dims);

        // which situation variant this state would see
        const variants = mission.variants ?? [];
        for (let i = 0; i < variants.length; i++) {
          if (evaluateCondition(variants[i]?.when, state.flags, state.dims)) {
            result.firedVariants.add(`${mission.id}#${i}`);
            break;
          }
        }

        /* And which client voice. Same first-match-wins rule as `resolveSaidQuote`, so an
           entry shadowed by a broader one above it reports as dead rather than as fine. */
        const quotes = mission.quotes ?? [];
        for (let i = 0; i < quotes.length; i++) {
          if (evaluateCondition(quotes[i]?.when, state.flags, state.dims)) {
            result.firedQuotes.add(`${mission.id}#${i}`);
            break;
          }
        }

        if (mission.kind === "levers") {
          for (const l of mission.levers) {
            const open = l.options.filter((o) => evaluateCondition(o.requires, state.flags, state.dims));
            if (open.length < 2) result.thinLevers.add(`${mission.id}/${l.id}`);
          }
        }

        for (const selection of possibleSelections(mission, state)) {
          if (mission.kind === "choice" && selection[0]) {
            result.exercisedOptions.add(`${mission.id}/${selection[0]}`);
          }
          if (mission.kind === "levers") {
            for (const id of selection) result.exercisedOptions.add(`${mission.id}/${id}`);
            result.exercisedSettings.add(`${mission.id}/${selection.join(",")}`);
          }
          const after = playMission(state, content, selection);
          const fired = after.history[after.history.length - 1];
          if (fired) result.firedOutcomes.add(fired.outcomeId);
          for (const f of after.flags) result.reachableFlags.add(f);

          const key = stateKey(keying, after);
          if (next.has(key)) continue;
          if (next.size >= MAX_FRONTIER) {
            truncated = true;
            continue;
          }
          next.set(key, after);
        }
      }
    }

    frontier = next;
    /* Between levels, so a caller that wants to stay responsive can. Nothing is
       half-updated here: `result` is consistent and `frontier` is the next whole level. */
    yield;
  }

  /* Truncation would make every "is this reachable?" answer unsound, so it must never
     be silent. If this fires, narrow the dedup key further rather than raising the cap. */
  if (truncated) {
    throw new Error(
      `sweep: frontier exceeded ${MAX_FRONTIER} states, so coverage is no longer exhaustive. ` +
        `Narrow the dedup key (see stateKey) rather than raising the ceiling.`,
    );
  }

  return result;
}

/**
 * Exhaustive walk of the reachable state space. Blocks until finished.
 *
 * The generator above is the only implementation. A caller that must stay responsive
 * drives `sweepWalk` itself and awaits something between steps — see `analysis.test.ts`.
 * The scheduling deliberately lives there and not here: deciding when to pause is not a
 * game rule, and the engine may not touch a timer, which `runcode.test.ts` now enforces.
 */
export function sweep(content: Content, opts: SweepOptions = {}): SweepResult {
  const walk = sweepWalk(content, opts);
  let step = walk.next();
  while (!step.done) step = walk.next();
  return step.value;
}

/* ─────────────────── witnessed meter extremes ─────────────────── */

/**
 * How far the meters can actually be driven, established by playing.
 *
 * This exists because the sweep cannot answer it. Deduplicating on flags is what makes
 * the sweep tractable, and it is exact for "is this outcome reachable?" — but it discards
 * dimension vectors, so its ranges are a sample. Asking it for bounds produced confident
 * wrong answers: profit ≤ 90 when 100 is reachable, deliver ≥ 20 when 3 is.
 *
 * A greedy one-step walk is not a proof of the true optimum — it can be led into a local
 * maximum — so this is a **lower bound on the achievable range**, and every number in it
 * is witnessed by a playthrough that can be replayed. That asymmetry is the point: a
 * threshold set inside this range is known to be crossable, which is exactly what a rule
 * like "the pursuit is lost below 40" needs before it can be trusted.
 */
export function reachableExtremes(content: Content): Record<DimensionId, DimRange> {
  const range = emptyRange();
  const setups = pastSetupOptions(content);

  /* Two changes for the eight-decision story (D-086), both making the bound less loose and
     neither making it less honest — every number is still a replayed path:
       · it climbs each meter on its own as well as their sum, because climbing the sum
         trades one meter away to raise the others and never drove Win past 90;
       · it keeps a small beam rather than one state, because a lever decision is up to 27
         combinations and the best next step is often not on the best route — one step of
         greed stopped Worth at 87 where the sweep had seen 90.
     Deterministic: expansion order is the enumeration order, and the sort is stable. */
  const objectives: ((dims: Record<DimensionId, number>) => number)[] = [
    (dims) => DIMENSIONS.reduce((total, d) => total + dims[d], 0),
    ...DIMENSIONS.map((d) => (dims: Record<DimensionId, number>) => dims[d]),
  ];

  for (const advantage of setups) {
    for (const objective of objectives) for (const sign of [1, -1]) {
      let live: GameState[] = [pastSetup(content, advantage)];
      for (let depth = 0; depth < 40 && live.length > 0; depth++) {
        const next: GameState[] = [];
        for (const s of live) {
          widen(range, s.dims);
          const mission = getNode(content, s.nodeId);
          if (!isMission(mission)) continue;
          for (const selection of possibleSelections(mission, s)) next.push(playMission(s, content, selection));
        }
        next.sort((a, b) => sign * (objective(b.dims) - objective(a.dims)));
        live = next.slice(0, EXTREMES_BEAM);
      }
    }
  }
  return range;
}

/** How many states each witnessed-extremes walk keeps at every step. */
const EXTREMES_BEAM = 24;

/** The ids of chapter 0's options, or an empty pick if there is no setup node. */
function pastSetupOptions(content: Content): (string | undefined)[] {
  for (const node of Object.values(content.nodes)) {
    if (node.kind === "setup") return node.options.map((o) => o.id);
  }
  return [undefined];
}

/* ─────────────────── scripted playthroughs ─────────────────── */

/** Play a named sequence of selections straight through. */
export function playScript(
  content: Content,
  script: string[][],
  advantage?: string,
): GameState {
  let s = pastSetup(content, advantage);
  for (const selection of script) {
    if (!isMission(getNode(content, s.nodeId))) break;
    s = playMission(s, content, selection);
  }
  return s;
}

/* ───────────────────── dominant-option detection ───────────────────── */

export interface DominanceFinding {
  mission: string;
  dominant: string;
  dominated: string;
  note: string;
}

/**
 * An option is a FAKE CHOICE if its worst possible result beats another
 * option's best possible result on all three dimensions at once. There is then
 * no context in which picking the other one is defensible, which is exactly
 * the "A is timid, B is correct" pattern the design forbids.
 *
 * **This test is much weaker than it looks, and `findRealisedDominance` below is the one
 * to trust.** It builds each option's per-dimension *worst* across its whole outcome list
 * and compares against a sibling's per-dimension *best* — a composite profile that no
 * single game state can produce, because the worst `win` and the worst `deliver` typically
 * come from different branches. It therefore returns zero findings on content where three
 * options dominate their siblings in over 90% of the states that actually occur. Kept
 * because it is cheap and a positive result is still conclusive.
 */
export function findDominantOptions(content: Content): DominanceFinding[] {
  const findings: DominanceFinding[] = [];

  for (const node of Object.values(content.nodes)) {
    if (!isMission(node) || node.kind !== "choice") continue;

    const profiles = node.options.map((o) => {
      const best: Record<DimensionId, number> = { win: -Infinity, profit: -Infinity, deliver: -Infinity };
      const worst: Record<DimensionId, number> = { win: Infinity, profit: Infinity, deliver: Infinity };
      for (const oc of o.outcomes) {
        for (const d of DIMENSIONS) {
          const v = oc.effect.dims?.[d] ?? 0;
          best[d] = Math.max(best[d], v);
          worst[d] = Math.min(worst[d], v);
        }
      }
      return { id: o.id, title: o.title, best, worst };
    });

    for (const a of profiles) {
      for (const b of profiles) {
        if (a.id === b.id) continue;
        const dominates = DIMENSIONS.every((d) => a.worst[d] >= b.best[d]);
        const strictly = DIMENSIONS.some((d) => a.worst[d] > b.best[d]);
        if (dominates && strictly) {
          findings.push({
            mission: node.id,
            dominant: a.id,
            dominated: b.id,
            note: `"${a.title}" is never worse than "${b.title}" on any dimension — the second option is a fake choice`,
          });
        }
      }
    }
  }

  return findings;
}

/* ──────────────── the reachable-state walk, shared ──────────────── */

/**
 * Every reachable entry state at every mission, with every legal selection priced.
 *
 * `sweep` answers "what fires?" and throws its states away as it goes. Two other questions
 * need the states themselves and the result of each option *from* each state: which options
 * dominate their siblings in the situations that actually occur, and what the authored
 * delta budget looks like across those situations. Both walked their own copy of the
 * frontier, and the second copy was written by copying the first.
 *
 * One walk, because the dedup key decides the denominator. `findRealisedDominance` reports
 * a `share` — "this option is free money in 92% of reachable states" — and a walk that
 * keyed states even slightly differently would report a share of a different population
 * while printing the same sentence. Two hand-maintained copies of a key is how that
 * happens, and it would not show up as a failure anywhere.
 *
 * `visit` is called once per (mission, entry state) with every selection already resolved,
 * rather than once per selection, because both callers need to compare selections against
 * each other from the same starting point.
 */
export function* walkReachableSteps(
  content: Content,
  visit: (
    mission: Mission,
    state: GameState,
    priced: { selection: string[]; after: GameState }[],
  ) => void,
  opts: SweepOptions = {},
): Generator<void, void, void> {
  const keying = keyingFor(content, opts);
  const start = openingState(content);
  let frontier = new Map<string, GameState>([[stateKey(keying, start), start]]);

  let guard = 0;
  while (frontier.size > 0 && guard++ < 200) {
    const next = new Map<string, GameState>();
    const byNode = new Map<string, GameState[]>();
    for (const state of frontier.values()) {
      const list = byNode.get(state.nodeId);
      if (list) list.push(state);
      else byNode.set(state.nodeId, [state]);
    }

    for (const [nodeId, states] of byNode) {
      const node = getNode(content, nodeId);

      if (node.kind === "setup") {
        for (const state of states) {
          for (const option of node.options) {
            let after = chooseSetup(state, content, option.id);
            let g = 0;
            while ((after.phase === "interlude" || after.phase === "brief") && g++ < 20) {
              after = advance(after, content);
            }
            const key = stateKey(keying, after);
            if (!next.has(key)) next.set(key, after);
          }
        }
        continue;
      }
      if (!isMission(node)) continue;

      for (const state of states) {
        const priced: { selection: string[]; after: GameState }[] = [];
        for (const selection of possibleSelections(node, state)) {
          const after = playMission(state, content, selection);
          priced.push({ selection, after });
          const key = stateKey(keying, after);
          if (!next.has(key)) next.set(key, after);
        }
        visit(node, state, priced);
        // Callers may yield to their event loop. Scheduling remains outside the engine.
        yield;
      }
    }
    frontier = next;
  }
}

/** Synchronous compatibility surface for command-line analysis. */
export function walkReachable(
  content: Content,
  visit: (mission: Mission, state: GameState, priced: { selection: string[]; after: GameState }[]) => void,
  opts: SweepOptions = {},
): void {
  const steps = walkReachableSteps(content, visit, opts);
  while (!steps.next().done) { /* drain */ }
}

/* ──────────────── realised dominance, over states that occur ──────────────── */

export interface RealisedDominance extends DominanceFinding {
  /** states where A weakly beat B on all three dimensions */
  dominatedIn: number;
  /** states where both options were legal and could be compared */
  comparedIn: number;
  share: number;
}

/**
 * The dominance test that means something: resolve every option in every state that
 * actually occurs, and compare what really happened.
 *
 * `findDominantOptions` asks whether an option's worst *authored* result beats a sibling's
 * best *authored* result. That composite never occurs — an option's worst `win` and worst
 * `deliver` usually come from different branches, so the profile it compares belongs to no
 * reachable state. It returns zero findings on content where three options beat their
 * siblings on all three dimensions in over 90% of real states.
 *
 * This walks the same frontier the sweep walks, and at each choice mission prices every
 * option for real from each reachable entry state — and at each lever decision, every
 * setting against its siblings on the same lever with the other levers held (D-084).
 * `share` is the fraction of comparable
 * states in which A weakly dominated B and strictly beat it somewhere — so a finding says
 * "in 90% of the situations a player can actually be in, this option is free money".
 *
 * `CLAUDE.md`: fix a fake choice by giving the weaker option a genuine compensating
 * upside, never by nerfing the stronger one.
 */
export function* findRealisedDominanceSteps(
  content: Content,
  threshold = 0.9,
  opts: SweepOptions = {},
): Generator<void, RealisedDominance[], void> {
  /** mission → "a>b" → [dominated, compared] */
  const tally = new Map<string, Map<string, [number, number]>>();

  yield* walkReachableSteps(
    content,
    (mission, state, priced) => {
      const pairs = tally.get(mission.id) ?? new Map<string, [number, number]>();
      tally.set(mission.id, pairs);

      const deltaOf = (after: GameState): Record<DimensionId, number> => ({
        win: after.dims.win - state.dims.win,
        profit: after.dims.profit - state.dims.profit,
        deliver: after.dims.deliver - state.dims.deliver,
      });
      const compare = (aId: string, a: Record<DimensionId, number>, bId: string, b: Record<DimensionId, number>) => {
        const k = `${aId}>${bId}`;
        const cur = pairs.get(k) ?? [0, 0];
        cur[1] += 1;
        const weak = DIMENSIONS.every((d) => a[d] >= b[d]);
        const strict = DIMENSIONS.some((d) => a[d] > b[d]);
        if (weak && strict) cur[0] += 1;
        pairs.set(k, cur);
      };

      /* The lever-level fake choice, in the states that occur. Two settings of ONE lever,
         with every other lever held where it is, compared on what really happened — the
         settings' own bars and the outcome they led to. The validator's rule is the static
         half (a setting may not beat a sibling by its `dims` alone); this is the half only
         the walk can see, where a setting is free money because of the outcomes it
         unlocks. Each (state, other settings) pair is one comparison. */
      if (mission.kind === "levers") {
        const bySelection = new Map<string, Record<DimensionId, number>>();
        for (const { selection, after } of priced) bySelection.set(selection.join(","), deltaOf(after));
        for (const { selection } of priced) {
          const a = bySelection.get(selection.join(",")) as Record<DimensionId, number>;
          mission.levers.forEach((lever, i) => {
            const aId = selection[i] as string;
            for (const alt of lever.options) {
              if (alt.id === aId) continue;
              const swapped = [...selection];
              swapped[i] = alt.id;
              const b = bySelection.get(swapped.join(","));
              if (b) compare(aId, a, alt.id, b); // absent: that setting is locked here
            }
          });
        }
        return;
      }

      /* Otherwise the pairwise comparison is choice-only, because "this option dominates
         that option" is not a question a multi-pick mission asks. The WALK still has to
         advance for every mission kind — skipping `investigate` and `build` killed it at m2
         and made the whole detector report nothing in 13ms. */
      if (mission.kind !== "choice") return;

      const deltas = new Map<string, Record<DimensionId, number>>();
      for (const { selection, after } of priced) {
        const id = selection[0];
        if (!id) continue;
        deltas.set(id, deltaOf(after));
      }

      for (const [aId, a] of deltas) {
        for (const [bId, b] of deltas) {
          if (aId === bId) continue;
          compare(aId, a, bId, b);
        }
      }
    },
    opts,
  );

  const findings: RealisedDominance[] = [];
  for (const [missionId, pairs] of tally) {
    const node = content.nodes[missionId];
    if (!node || !isMission(node) || (node.kind !== "choice" && node.kind !== "levers")) continue;
    const levers = node.kind === "levers";
    const title = (id: string) =>
      node.kind === "choice"
        ? (node.options.find((o) => o.id === id)?.title ?? id)
        : node.kind === "levers"
          ? (node.levers.flatMap((l) => l.options).find((o) => o.id === id)?.label ?? id)
          : id;
    for (const [k, [dominated, compared]] of pairs) {
      if (compared === 0) continue;
      const share = dominated / compared;
      if (share < threshold) continue;
      const [aId, bId] = k.split(">") as [string, string];
      findings.push({
        mission: missionId,
        dominant: aId,
        dominated: bId,
        dominatedIn: dominated,
        comparedIn: compared,
        share: Math.round(share * 1000) / 1000,
        note: levers
          ? `setting "${title(aId)}" beats "${title(bId)}" on all three dimensions in ` +
            `${Math.round(share * 100)}% of ${compared} reachable comparisons with the other ` +
            `levers held — a fake choice on that lever`
          : `"${title(aId)}" beats "${title(bId)}" on all three dimensions in ` +
            `${Math.round(share * 100)}% of ${compared} reachable states — a fake choice in ` +
            `the situations that actually occur`,
      });
    }
  }
  return findings.sort((a, b) => b.share - a.share);
}

export function findRealisedDominance(content: Content, threshold = 0.9, opts: SweepOptions = {}): RealisedDominance[] {
  const steps = findRealisedDominanceSteps(content, threshold, opts);
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}
