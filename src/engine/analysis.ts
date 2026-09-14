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

import { advance, commit, createInitialState, evaluateCondition, getNode } from "./engine";
import {
  DIMENSIONS,
  isMission,
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

/**
 * Dedup key for the sweep.
 *
 * Deliberately FLAGS ONLY, not dimensions. Every branching condition in this
 * game gates on flags; none reads a dimension value. (`validate.ts` warns if
 * that ever stops being true, because this analysis would then be incomplete.)
 * Keying on dimensions as well produced ~4.1M distinct states and exhausted the
 * heap; keying on flags collapses that to a few thousand while remaining exact
 * for branch coverage.
 */
function stateKey(s: GameState): string {
  return [...s.flags].sort().join(",");
}

/** Hard ceiling, so a future content change cannot silently OOM the test run. */
const MAX_FRONTIER = 20000;

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
  let s: GameState = { ...state, selection };
  s = commit(s, content);
  s = advance(s, content); // resolving -> consequence
  s = advance(s, content); // consequence -> lesson
  s = advance(s, content); // lesson -> next node
  let guard = 0;
  while (s.phase === "interlude" && guard++ < 20) s = advance(s, content);
  return s;
}

/** The state at the first mission, past the title and opening interlude. */
export function openingState(content: Content): GameState {
  let s = createInitialState(content);
  s = advance(s, content); // title -> start node
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

  let frontier = new Map<string, GameState>();
  const start = openingState(content);
  frontier.set(stateKey(start), start);

  let guard = 0;
  while (frontier.size > 0 && guard++ < 100) {
    const sample = frontier.values().next().value as GameState;
    const node = getNode(content, sample.nodeId);

    if (!isMission(node)) {
      // terminal
      result.endings = frontier.size;
      for (const s of frontier.values()) widen(result.finalRange, s.dims);
      break;
    }

    const mission = node;
    result.statesAtMission[mission.id] = frontier.size;
    result.entryRanges[mission.id] = emptyRange();

    const next = new Map<string, GameState>();

    for (const state of frontier.values()) {
      widen(result.entryRanges[mission.id], state.dims);

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
        const key = stateKey(after);
        if (!next.has(key) && next.size < MAX_FRONTIER) next.set(key, after);
      }
    }

    frontier = next;
  }

  return result;
}

/* ─────────────────── scripted playthroughs ─────────────────── */

/** Play a named sequence of selections straight through. */
export function playScript(content: Content, script: string[][]): GameState {
  let s = openingState(content);
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
