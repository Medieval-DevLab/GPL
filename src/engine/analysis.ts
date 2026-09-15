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
 *   · Can the delivery crisis actually fire? (meter bounds)
 *   · Does any option beat its siblings on all three dimensions in every
 *     case? (a fake choice — the mechanical test for "no right answer")
 *
 * Pure and deterministic. Runs in the test suite.
 */

import {
  advance,
  chooseSetup,
  commit,
  createInitialState,
  evaluateCondition,
  getNode,
} from "./engine";
import {
  DIMENSIONS,
  isMission,
  type Condition,
  type Content,
  type DimensionId,
  type GameState,
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
  if (node.kind === "choice") {
    for (const o of node.options) {
      note(o.requires);
      for (const oc of o.outcomes) note(oc.when);
    }
  } else {
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
  const acc = new Set<string>();
  for (let i = order.length - 1; i >= 0; i--) {
    const node = content.nodes[order[i] as string];
    if (node && isMission(node)) for (const f of missionReadFlags(node)) acc.add(f);
    out.set(order[i] as string, new Set(acc));
  }
  return out;
}

/**
 * Dedup key for the sweep.
 *
 * Three deliberate exclusions, each of which keeps this exact rather than approximate:
 *
 *  1. DIMENSIONS. No branching condition reads a dimension value — `validate.ts` warns
 *     if that ever changes. Including them produced ~4.1M states and exhausted the heap.
 *  2. FLAGS NOTHING READS. Purely narrative flags (`signed`, `conventional`…) cannot
 *     affect any branch.
 *  3. FLAGS NOTHING READS *FROM HERE ON*. `knows:real_pain` matters up to the solution
 *     missions and is inert afterwards, so carrying it in the key past that point splits
 *     states that can no longer behave differently.
 *
 * (2) and (3) matter in practice: with the full flag set the frontier hit its ceiling at
 * mission 10 of 16, silently truncating coverage and reporting reachable outcomes as dead
 * content. The node id is part of the key because a branch can divert the whole game —
 * walking away from the deal skips delivery — so the frontier holds states at different
 * nodes at the same time.
 */
function stateKey(s: GameState, read: Set<string> | undefined): string {
  const flags = read ? s.flags.filter((f) => read.has(f)) : [...s.flags];
  return `${s.nodeId}|${flags.sort().join(",")}`;
}

/** Hard ceiling, so a future content change cannot silently OOM the test run. */
const MAX_FRONTIER = 200_000;

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
  }
}

/** Commit a selection and fast-forward to the next mission (or the ending). */
export function playMission(state: GameState, content: Content, selection: string[]): GameState {
  // A prediction is required to commit, but it is purely informational — it never gates
  // an outcome, so the sweep fixes it rather than branching on it. Were it ever to affect
  // a branch, this would silently stop covering the alternatives.
  let s: GameState = { ...state, selection, prediction: "win" };
  s = commit(s, content);
  s = advance(s, content); // resolving -> consequence
  s = advance(s, content); // consequence -> lesson
  s = advance(s, content); // lesson -> next node
  let guard = 0;
  while (s.phase === "interlude" && guard++ < 20) s = advance(s, content);
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
  while (s.phase === "interlude" && guard++ < 20) s = advance(s, content);
  return s;
}

/** Past chapter 0, taking the first advantage. For scripted runs that skip setup. */
export function pastSetup(content: Content, optionId?: string): GameState {
  let s = openingState(content);
  const node = getNode(content, s.nodeId);
  if (node.kind !== "setup") return s;
  s = chooseSetup(s, content, optionId ?? (node.options[0]?.id as string));
  let guard = 0;
  while (s.phase === "interlude" && guard++ < 20) s = advance(s, content);
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
  /** ids of every option exercised at least once */
  exercisedOptions: Set<string>;
  /** flags that were set on at least one path */
  reachableFlags: Set<string>;
  /** dimension range observed on ENTRY to each mission */
  entryRanges: Record<string, Record<DimensionId, DimRange>>;
  /** dimension range observed at the ending */
  finalRange: Record<DimensionId, DimRange>;
  /** distinct terminal states */
  endings: number;
  /** situation variants that matched at least once, by mission */
  firedVariants: Set<string>;
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

export function sweep(content: Content): SweepResult {
  const result: SweepResult = {
    statesAtMission: {},
    firedOutcomes: new Set(),
    exercisedOptions: new Set(),
    reachableFlags: new Set(),
    entryRanges: {},
    finalRange: emptyRange(),
    endings: 0,
    firedVariants: new Set(),
  };

  const suffix = suffixReadFlags(content);
  const start = openingState(content);
  let frontier = new Map<string, GameState>([[stateKey(start, suffix.get(start.nodeId)), start]]);
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
            while (after.phase === "interlude" && g++ < 20) after = advance(after, content);
            for (const f of after.flags) result.reachableFlags.add(f);
            const key = stateKey(after, suffix.get(after.nodeId));
            if (!next.has(key)) next.set(key, after);
          }
        }
        continue;
      }

      if (!isMission(node)) {
        result.endings += states.length;
        for (const s of states) widen(result.finalRange, s.dims);
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

        for (const selection of possibleSelections(mission, state)) {
          if (mission.kind === "choice" && selection[0]) {
            result.exercisedOptions.add(`${mission.id}/${selection[0]}`);
          }
          const after = playMission(state, content, selection);
          const fired = after.history[after.history.length - 1];
          if (fired) result.firedOutcomes.add(fired.outcomeId);
          for (const f of after.flags) result.reachableFlags.add(f);

          const key = stateKey(after, suffix.get(after.nodeId));
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
