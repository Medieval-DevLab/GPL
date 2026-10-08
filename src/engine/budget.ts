/**
 * The delta budget — what the authored numbers add up to, and what the clamp eats.
 *
 * Backlog section 1 says reading does not pay, and `engagement.test.ts` pins how badly:
 * most non-reader policies reach the top verdict and the best one scores 100. The largest
 * single piece of content work left is rebalancing 88 authored deltas, and rebalancing by
 * feel is how they got here. So this measures the economy before anyone touches it.
 *
 * Four questions, and the fourth is the one that produces a number to author against:
 *
 *   1. **Per mission, what do the deltas sum to?** If the mean summed delta is positive
 *      almost everywhere, every meter drifts upward for everyone and the meters stop
 *      discriminating — which is the mechanism behind "the best non-reader scores 100".
 *   2. **How much authored magnitude does the clamp destroy?** A +8 written against a
 *      meter already at 97 is two points of consequence and six points of nothing. Those
 *      six points are invisible in the content and in the screen.
 *   3. **Which meters saturate, and where?** A meter pinned at the ceiling by mission 12
 *      makes the last four beats unmarkable: nothing the player does can move it, so the
 *      game stops responding at exactly the point the stakes are highest.
 *   4. **If every positive delta were scaled by k, what happens?** Swept, so the answer is
 *      a number rather than a direction.
 *
 * TWO POPULATIONS, AND THEY ARE NOT INTERCHANGEABLE. The exhaustive walk treats every
 * reachable state as equally likely; random play weights them the way a coin-flipper
 * would; neither is how a person plays. Both are reported side by side because the
 * difference between them is itself information, and because a single mean quoted without
 * its population is the kind of number that starts an argument nobody can settle.
 *
 * Pure and deterministic: every sample is a replayed `playMission`, and the random
 * population uses the engine's seeded generator.
 */

import { walkReachable, openingState, playMission, possibleSelections, type SweepOptions } from "./analysis";
import { advance, chooseSetup, finalVerdict, getNode, leverSettings, scoreOf } from "./engine";
import { seeded } from "./engagement";
import {
  DIMENSIONS,
  isMission,
  type Content,
  type DimensionId,
  type GameState,
  type Mission,
  type Outcome,
} from "./types";

/**
 * The best verdict in the game, derived rather than spelled.
 *
 * Quoting the string would put a fifth copy of "A deal worth having" in the repo and make
 * a rename look like a 0% top-verdict share — a rebalance that had achieved nothing would
 * read as a total success. Asking `finalVerdict` what a perfect run is called cannot drift.
 */
export const TOP_VERDICT = finalVerdict({ win: 100, profit: 100, deliver: 100 }, []).title;

/**
 * The same question for content that names its own endings (D-086): what is a run with every
 * meter full and nothing to answer for called? For the eight-decision story that is the
 * unconditional last ending, "We kept our promises, and it paid", because every ending above
 * it needs a card a clean run does not hold.
 */
export function topVerdict(content: Pick<Content, "endings">): string {
  return finalVerdict({ win: 100, profit: 100, deliver: 100 }, [], content).title;
}

/** Mirrors `engine.ts`'s private `clamp`. Verified against it on every sample — see below. */
const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

/* ─────────────────────────── one decision, accounted ─────────────────────────── */

export interface DeltaSample {
  /** summed across the three meters, as authored: selection effects plus outcome effects */
  authored: number;
  /**
   * The same authored delta, per meter — which is the number an author can act on.
   *
   * The summed figure hides the shape: on this content `win` drifts up hard enough to pin
   * at the ceiling while `profit` is nearly balanced, so a single scale factor applied to
   * everything pushes `profit` toward the floor before it has finished fixing `win`. A
   * report that only sums would recommend exactly that.
   */
  authoredByDim: Record<DimensionId, number>;
  /** summed across the three meters, as the player experiences it after clamping */
  applied: number;
  /** Σ|authored per-meter write|, the denominator for "how much the clamp eats" */
  magnitude: number;
  /** how much of that magnitude the clamp destroyed */
  lost: number;
  /** non-zero authored writes to a meter, counting the two effect steps separately */
  writes: number;
  /** writes whose result was cut off by the 100 ceiling, and by the 0 floor */
  ceilingWrites: number;
  floorWrites: number;
  /** per meter: was this write cut off at the ceiling? Used for the saturation map. */
  ceilingByDim: Record<DimensionId, number>;
  floorByDim: Record<DimensionId, number>;
  /** `dimsAfter` recomputed here, so the accounting can be checked against the engine */
  recomputed: Record<DimensionId, number>;
}

function zeroByDim(): Record<DimensionId, number> {
  return { win: 0, profit: 0, deliver: 0 };
}

/**
 * The selection's own writes to the meters, in the order the engine applies them.
 *
 * `build` is one write — its components are summed and land together. `levers` is one
 * write per lever, in lever order, because the engine applies each setting as its own step
 * and the clamp can tell the difference (see `applySteps` in `engine.ts`). The other kinds
 * write nothing until the outcome.
 */
function selectionWrites(mission: Mission, selection: readonly string[]): Record<DimensionId, number>[] {
  if (mission.kind === "levers") {
    return leverSettings(mission, selection).map((o) => {
      const dims = zeroByDim();
      for (const d of DIMENSIONS) dims[d] = o.dims?.[d] ?? 0;
      return dims;
    });
  }
  if (mission.kind !== "build") return [];
  const dims = zeroByDim();
  for (const id of selection) {
    const component = mission.components.find((c) => c.id === id);
    if (!component) continue;
    for (const d of DIMENSIONS) dims[d] += component.dims?.[d] ?? 0;
  }
  return [dims];
}

function outcomeById(mission: Mission, id: string): Outcome | undefined {
  const list = mission.kind === "choice" ? mission.options.flatMap((o) => o.outcomes) : mission.outcomes;
  return list.find((o) => o.id === id);
}

/**
 * Account for one committed decision.
 *
 * The two-step order is `engine.ts`'s and has to be, or the clamp accounting is fiction:
 * the selection's effects land first, the outcome is chosen against the result, and the
 * outcome's effects land on top. A `+6` and a `−6` arriving in that order from a meter at
 * 97 lose three points at the ceiling and finish at 91 — net zero authored, six points of
 * real movement, and three points destroyed. Summing the two writes first would report all
 * three of those numbers wrong.
 *
 * `recomputed` exists so this can be checked rather than believed: it must equal the
 * `dimsAfter` the engine recorded in history, on every sample, or this module is measuring
 * arithmetic of its own invention. `budget.test.ts` asserts that over the whole walk.
 */
export function accountDecision(
  mission: Mission,
  selection: readonly string[],
  before: Record<DimensionId, number>,
  outcomeId: string,
): DeltaSample {
  const sel = selectionWrites(mission, selection);
  const outcome = outcomeById(mission, outcomeId);
  const out = zeroByDim();
  for (const d of DIMENSIONS) out[d] = outcome?.effect.dims?.[d] ?? 0;

  const sample: DeltaSample = {
    authored: 0,
    authoredByDim: zeroByDim(),
    applied: 0,
    magnitude: 0,
    lost: 0,
    writes: 0,
    ceilingWrites: 0,
    floorWrites: 0,
    ceilingByDim: zeroByDim(),
    floorByDim: zeroByDim(),
    recomputed: zeroByDim(),
  };

  for (const d of DIMENSIONS) {
    let value = before[d];
    for (const write of [...sel.map((w) => w[d]), out[d]]) {
      if (write === 0) continue;
      sample.writes += 1;
      sample.magnitude += Math.abs(write);
      const wanted = value + write;
      const got = clamp(wanted);
      const lost = Math.abs(wanted - got);
      sample.lost += lost;
      if (lost > 0 && wanted > 100) {
        sample.ceilingWrites += 1;
        sample.ceilingByDim[d] += 1;
      }
      if (lost > 0 && wanted < 0) {
        sample.floorWrites += 1;
        sample.floorByDim[d] += 1;
      }
      value = got;
    }
    /* A meter with no write still has to be carried through `clamp`, because the engine
       does: `applyEffect` only touches dimensions the effect names, so an untouched meter
       keeps its exact value. Rounding it here would invent drift. */
    sample.recomputed[d] = value;
    const authored = sel.reduce((total, w) => total + w[d], 0) + out[d];
    sample.authoredByDim[d] = authored;
    sample.authored += authored;
    sample.applied += value - before[d];
  }

  return sample;
}

/* ─────────────────────────── aggregation ─────────────────────────── */

export interface MissionBudget {
  missionId: string;
  kind: Mission["kind"];
  /** reachable entry states priced (exhaustive walk), or runs that reached it (sampled) */
  states: number;
  /** (state, selection) pairs accounted */
  samples: number;
  meanAuthored: number;
  /** mean authored delta per meter — the drift, unsummed */
  meanAuthoredByDim: Record<DimensionId, number>;
  minAuthored: number;
  maxAuthored: number;
  meanApplied: number;
  /** share of samples whose authored deltas sum to more than zero */
  positiveShare: number;
  magnitude: number;
  lost: number;
  /** lost ÷ magnitude — the share of authored consequence the clamp destroys here */
  lossShare: number;
  writes: number;
  ceilingWrites: number;
  floorWrites: number;
  ceilingByDim: Record<DimensionId, number>;
  floorByDim: Record<DimensionId, number>;
  /** entry states already pinned at a bound on arrival, per meter */
  enteredAtCeiling: Record<DimensionId, number>;
  enteredAtFloor: Record<DimensionId, number>;
  /** mean meter values on arrival, so saturation can be read as a trend down the table */
  meanEntry: Record<DimensionId, number>;
}

interface Bucket {
  missionId: string;
  kind: Mission["kind"];
  states: number;
  samples: number;
  authoredSum: number;
  authoredByDim: Record<DimensionId, number>;
  authoredMin: number;
  authoredMax: number;
  appliedSum: number;
  positives: number;
  magnitude: number;
  lost: number;
  writes: number;
  ceilingWrites: number;
  floorWrites: number;
  ceilingByDim: Record<DimensionId, number>;
  floorByDim: Record<DimensionId, number>;
  enteredAtCeiling: Record<DimensionId, number>;
  enteredAtFloor: Record<DimensionId, number>;
  entrySum: Record<DimensionId, number>;
}

function newBucket(missionId: string, kind: Mission["kind"]): Bucket {
  return {
    missionId,
    kind,
    states: 0,
    samples: 0,
    authoredSum: 0,
    authoredByDim: zeroByDim(),
    authoredMin: Infinity,
    authoredMax: -Infinity,
    appliedSum: 0,
    positives: 0,
    magnitude: 0,
    lost: 0,
    writes: 0,
    ceilingWrites: 0,
    floorWrites: 0,
    ceilingByDim: zeroByDim(),
    floorByDim: zeroByDim(),
    enteredAtCeiling: zeroByDim(),
    enteredAtFloor: zeroByDim(),
    entrySum: zeroByDim(),
  };
}

function noteEntry(bucket: Bucket, dims: Record<DimensionId, number>): void {
  bucket.states += 1;
  for (const d of DIMENSIONS) {
    bucket.entrySum[d] += dims[d];
    if (dims[d] >= 100) bucket.enteredAtCeiling[d] += 1;
    if (dims[d] <= 0) bucket.enteredAtFloor[d] += 1;
  }
}

function noteSample(bucket: Bucket, s: DeltaSample): void {
  bucket.samples += 1;
  bucket.authoredSum += s.authored;
  for (const d of DIMENSIONS) bucket.authoredByDim[d] += s.authoredByDim[d];
  bucket.authoredMin = Math.min(bucket.authoredMin, s.authored);
  bucket.authoredMax = Math.max(bucket.authoredMax, s.authored);
  bucket.appliedSum += s.applied;
  if (s.authored > 0) bucket.positives += 1;
  bucket.magnitude += s.magnitude;
  bucket.lost += s.lost;
  bucket.writes += s.writes;
  bucket.ceilingWrites += s.ceilingWrites;
  bucket.floorWrites += s.floorWrites;
  for (const d of DIMENSIONS) {
    bucket.ceilingByDim[d] += s.ceilingByDim[d];
    bucket.floorByDim[d] += s.floorByDim[d];
  }
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

function finish(bucket: Bucket): MissionBudget {
  const per = (v: number) => (bucket.samples ? round2(v / bucket.samples) : 0);
  return {
    missionId: bucket.missionId,
    kind: bucket.kind,
    states: bucket.states,
    samples: bucket.samples,
    meanAuthored: per(bucket.authoredSum),
    meanAuthoredByDim: {
      win: per(bucket.authoredByDim.win),
      profit: per(bucket.authoredByDim.profit),
      deliver: per(bucket.authoredByDim.deliver),
    },
    minAuthored: Number.isFinite(bucket.authoredMin) ? bucket.authoredMin : 0,
    maxAuthored: Number.isFinite(bucket.authoredMax) ? bucket.authoredMax : 0,
    meanApplied: per(bucket.appliedSum),
    positiveShare: bucket.samples ? round2(bucket.positives / bucket.samples) : 0,
    magnitude: bucket.magnitude,
    lost: bucket.lost,
    lossShare: bucket.magnitude ? round2(bucket.lost / bucket.magnitude) : 0,
    writes: bucket.writes,
    ceilingWrites: bucket.ceilingWrites,
    floorWrites: bucket.floorWrites,
    ceilingByDim: bucket.ceilingByDim,
    floorByDim: bucket.floorByDim,
    enteredAtCeiling: bucket.enteredAtCeiling,
    enteredAtFloor: bucket.enteredAtFloor,
    meanEntry: {
      win: bucket.states ? Math.round(bucket.entrySum.win / bucket.states) : 0,
      profit: bucket.states ? Math.round(bucket.entrySum.profit / bucket.states) : 0,
      deliver: bucket.states ? Math.round(bucket.entrySum.deliver / bucket.states) : 0,
    },
  };
}

export interface DeltaBudget {
  population: "reachable states" | "random play";
  missions: MissionBudget[];
  /** every mission folded together */
  whole: MissionBudget;
  /** missions whose mean summed delta is positive — the headline count */
  positiveMissions: number;
  /** recomputation mismatches against the engine. Must be 0 or nothing here is measured. */
  mismatches: number;
}

function assemble(
  population: DeltaBudget["population"],
  order: string[],
  buckets: Map<string, Bucket>,
  mismatches: number,
): DeltaBudget {
  const missions = order.filter((id) => buckets.has(id)).map((id) => finish(buckets.get(id) as Bucket));
  const all = newBucket("ALL", "choice");
  for (const bucket of buckets.values()) {
    all.states += bucket.states;
    all.samples += bucket.samples;
    all.authoredSum += bucket.authoredSum;
    for (const d of DIMENSIONS) all.authoredByDim[d] += bucket.authoredByDim[d];
    all.authoredMin = Math.min(all.authoredMin, bucket.authoredMin);
    all.authoredMax = Math.max(all.authoredMax, bucket.authoredMax);
    all.appliedSum += bucket.appliedSum;
    all.positives += bucket.positives;
    all.magnitude += bucket.magnitude;
    all.lost += bucket.lost;
    all.writes += bucket.writes;
    all.ceilingWrites += bucket.ceilingWrites;
    all.floorWrites += bucket.floorWrites;
    for (const d of DIMENSIONS) {
      all.ceilingByDim[d] += bucket.ceilingByDim[d];
      all.floorByDim[d] += bucket.floorByDim[d];
      all.enteredAtCeiling[d] += bucket.enteredAtCeiling[d];
      all.enteredAtFloor[d] += bucket.enteredAtFloor[d];
      all.entrySum[d] += bucket.entrySum[d];
    }
  }
  return {
    population,
    missions,
    whole: finish(all),
    positiveMissions: missions.filter((m) => m.meanAuthored > 0).length,
    mismatches,
  };
}

/**
 * The budget over every reachable state — the exhaustive population.
 *
 * Costs one full reachable-state walk, ~11s of synchronous CPU on this content. The mean it
 * reports is unweighted across (state, selection) pairs, which is a combinatorial
 * population and not a behavioural one: a state a player would reach once in a thousand
 * runs counts as much as the opening. That is the right population for "is this option
 * ever a bad idea?" and the wrong one for "what will a cohort see", which is why
 * `sampledBudget` exists and why both are printed.
 */
export function deltaBudget(content: Content, opts: SweepOptions = {}): DeltaBudget {
  const buckets = new Map<string, Bucket>();
  let mismatches = 0;

  walkReachable(
    content,
    (mission, state, priced) => {
      const bucket = buckets.get(mission.id) ?? newBucket(mission.id, mission.kind);
      buckets.set(mission.id, bucket);
      noteEntry(bucket, state.dims);
      for (const { selection, after } of priced) {
        const entry = after.history[after.history.length - 1];
        if (!entry) continue;
        const sample = accountDecision(mission, selection, entry.dimsBefore, entry.outcomeId);
        if (DIMENSIONS.some((d) => sample.recomputed[d] !== entry.dimsAfter[d])) mismatches += 1;
        noteSample(bucket, sample);
      }
    },
    opts,
  );

  return assemble("reachable states", content.missionOrder, buckets, mismatches);
}

/**
 * The same budget over uniform-random play — the behavioural population.
 *
 * This is the one to quote next to a verdict distribution, because it is drawn from the
 * same population: whatever `runs` of the null player see is exactly what the verdict
 * share below describes. It is also cheap enough to re-measure for every value of k.
 */
export function sampledBudget(content: Content, runs = 300, seed = 1): DeltaBudget {
  const buckets = new Map<string, Bucket>();
  let mismatches = 0;

  for (let i = 0; i < runs; i++) {
    const rng = seeded(seed + i);
    let s = openingState(content);
    let guard = 0;
    while (guard++ < 60) {
      const node = getNode(content, s.nodeId);
      if (node.kind === "setup") {
        const option = node.options[Math.floor(rng() * node.options.length)];
        if (!option) break;
        s = chooseSetup(s, content, option.id);
        let g = 0;
        while ((s.phase === "interlude" || s.phase === "brief") && g++ < 20) s = advance(s, content);
        continue;
      }
      if (!isMission(node)) break;
      const legal = possibleSelections(node, s);
      const selection = legal[Math.floor(rng() * legal.length)];
      if (!selection) break;

      const bucket = buckets.get(node.id) ?? newBucket(node.id, node.kind);
      buckets.set(node.id, bucket);
      noteEntry(bucket, s.dims);

      const after = playMission(s, content, selection);
      const entry = after.history[after.history.length - 1];
      if (entry) {
        const sample = accountDecision(node, selection, entry.dimsBefore, entry.outcomeId);
        if (DIMENSIONS.some((d) => sample.recomputed[d] !== entry.dimsAfter[d])) mismatches += 1;
        noteSample(bucket, sample);
      }
      s = after;
    }
  }

  return assemble("random play", content.missionOrder, buckets, mismatches);
}

/* ─────────────────────────── scaling the gains ─────────────────────────── */

export interface ScaledContent {
  content: Content;
  k: number;
  /** positive meter writes rescaled */
  scaled: number;
  /** authored upside removed, in meter points */
  removed: number;
  /** writes that rounded away to nothing — a delta that no longer says anything */
  zeroed: number;
}

/**
 * Every positive authored delta, multiplied by k and rounded to an integer.
 *
 * Rounded because an author writes integers: quoting a k that only works with `+3.6` in the
 * content is quoting a k nobody can use. It makes the knob coarse at the bottom end, and
 * that coarseness is real — below k = 0.5 every `+1` rounds to 0 and stops being a
 * consequence at all, which is what `zeroed` counts.
 *
 * Negative deltas are left alone. The reviewer's finding is that the mean summed delta is
 * positive on 14 of 16 missions, so the economy's problem is its upside, and scaling both
 * ends would simply shrink the whole game's dynamic range while leaving the drift intact.
 *
 * `only` narrows it to named meters, and it is not a convenience. Measured on this content,
 * `win` and `deliver` inflate (2,334 and 2,667 ceiling-cut writes across 1,200 random runs)
 * while `profit` does not (33 — and it is the only meter that ever reaches the floor). So a
 * single factor across all three pays for `win` partly out of `profit`: at a uniform 0.70,
 * profit's mean arrival in the last chapter drops from 33–37 to 27–31 and its floor-cut
 * writes double, while `win` is still pinned at 100 for 59% of the states entering m10.
 * Scaling `win` and `deliver` alone leaves profit where it is — and needs a much lower k to
 * move the verdict share, because the verdict reads the mean of all three.
 *
 * Touches outcome effects, `build` component stats, lever settings and chapter 0's opening
 * advantage — every place content writes a meter. Chapter 0 is included because it is a real write
 * (the opening advantage is worth up to 5 points) and excluding it would quietly exempt
 * the one write every single run takes.
 */
export function scaleAuthoredGains(
  content: Content,
  k: number,
  only: readonly DimensionId[] = DIMENSIONS,
): ScaledContent {
  const clone: Content = JSON.parse(JSON.stringify(content)) as Content;
  let scaled = 0;
  let removed = 0;
  let zeroed = 0;

  const rescale = (dims: Partial<Record<DimensionId, number>> | undefined) => {
    if (!dims) return;
    for (const d of only) {
      const value = dims[d];
      if (value === undefined || value <= 0) continue;
      const next = Math.round(value * k);
      scaled += 1;
      removed += value - next;
      if (next === 0) zeroed += 1;
      dims[d] = next;
    }
  };

  for (const node of Object.values(clone.nodes)) {
    if (node.kind === "setup") {
      for (const option of node.options) rescale(option.dims);
      continue;
    }
    if (!isMission(node)) continue;
    if (node.kind === "build") for (const c of node.components) rescale(c.dims);
    if (node.kind === "levers") for (const l of node.levers) for (const o of l.options) rescale(o.dims);
    const outcomes = node.kind === "choice" ? node.options.flatMap((o) => o.outcomes) : node.outcomes;
    for (const outcome of outcomes) rescale(outcome.effect.dims);
  }

  return { content: clone, k, scaled, removed, zeroed };
}

/* ─────────────────────────── who can reach what ─────────────────────────── */

export interface BestPlay {
  score: number;
  dims: Record<DimensionId, number>;
  verdict: string;
  /** the selections, so the claim is a replayable playthrough rather than a number */
  script: string[][];
  advantage: string | undefined;
}

/**
 * The best score a player can actually be shown to reach, by breadth-limited search.
 *
 * A LOWER BOUND, witnessed. The exhaustive sweep cannot answer this — its dedup key drops
 * dimensions, so its ranges are first-arrival samples, and two reviewers have already
 * quoted them as bounds and been wrong. A beam keeps the best `beam` states at each beat
 * and replays from them, so every number it returns belongs to a playthrough that can be
 * re-run.
 *
 * WHAT THIS IS NOT. It is not "a reader", and the premium computed from it is not "what
 * reading is worth". A beam search has perfect foresight, which is a different advantage
 * from having read the brief, and at `beam = 1` it degenerates into the `meter-greedy`
 * non-reader policy — which is why the premium below is ≥ 0 by construction. The number it
 * honestly answers is **headroom**: is there anything left for understanding to buy, or has
 * the ceiling already been reached without it? Today the answer is nothing, and that is the
 * finding rather than an artefact.
 */
export function bestWitnessedPlay(content: Content, beam = 48): BestPlay {
  interface Live {
    state: GameState;
    script: string[][];
    advantage: string | undefined;
  }

  let live: Live[] = [];
  const start = openingState(content);
  const startNode = getNode(content, start.nodeId);
  if (startNode.kind === "setup") {
    for (const option of startNode.options) {
      let s = chooseSetup(start, content, option.id);
      let g = 0;
      while ((s.phase === "interlude" || s.phase === "brief") && g++ < 20) s = advance(s, content);
      live.push({ state: s, script: [], advantage: option.id });
    }
  } else {
    live.push({ state: start, script: [], advantage: undefined });
  }

  let best: BestPlay | null = null;
  const consider = (l: Live) => {
    const score = scoreOf(l.state.dims);
    if (best && best.score >= score) return;
    best = {
      score,
      dims: { ...l.state.dims },
      verdict: finalVerdict(l.state.dims, l.state.flags, content).title,
      script: l.script,
      advantage: l.advantage,
    };
  };

  let guard = 0;
  while (live.length && guard++ < 60) {
    const next: Live[] = [];
    for (const l of live) {
      const node = getNode(content, l.state.nodeId);
      if (!isMission(node)) {
        consider(l);
        continue;
      }
      for (const selection of possibleSelections(node, l.state)) {
        next.push({
          state: playMission(l.state, content, selection),
          script: [...l.script, selection],
          advantage: l.advantage,
        });
      }
    }
    /* Sort is stable in V8 and the expansion order above is deterministic, so ties break
       the same way on every run — which matters, because `script` is published as a
       reproduction and a reproduction that depends on sort luck is not one. */
    next.sort((a, b) => scoreOf(b.state.dims) - scoreOf(a.state.dims));
    live = next.slice(0, beam);
    for (const l of live) if (!isMission(getNode(content, l.state.nodeId))) consider(l);
  }

  if (!best) throw new Error("bestWitnessedPlay: no run reached an ending");
  return best;
}

/* ─────────────────────────── the k sweep ─────────────────────────── */

export interface VerdictProfile {
  runs: number;
  verdicts: Record<string, number>;
  topVerdictShare: number;
  meanScore: number;
  bestScore: number;
}

/** Uniform-random play, and what it is told it achieved. */
export function randomVerdicts(content: Content, runs = 300, seed = 1): VerdictProfile {
  const verdicts: Record<string, number> = {};
  let totalScore = 0;
  let bestScore = 0;

  for (let i = 0; i < runs; i++) {
    const rng = seeded(seed + i);
    let s = openingState(content);
    let guard = 0;
    while (guard++ < 60) {
      const node = getNode(content, s.nodeId);
      if (node.kind === "setup") {
        const option = node.options[Math.floor(rng() * node.options.length)];
        if (!option) break;
        s = chooseSetup(s, content, option.id);
        let g = 0;
        while ((s.phase === "interlude" || s.phase === "brief") && g++ < 20) s = advance(s, content);
        continue;
      }
      if (!isMission(node)) break;
      const legal = possibleSelections(node, s);
      const selection = legal[Math.floor(rng() * legal.length)];
      if (!selection) break;
      s = playMission(s, content, selection);
    }
    const title = finalVerdict(s.dims, s.flags, content).title;
    verdicts[title] = (verdicts[title] ?? 0) + 1;
    const score = scoreOf(s.dims);
    totalScore += score;
    bestScore = Math.max(bestScore, score);
  }

  return {
    runs,
    verdicts,
    topVerdictShare: round2((verdicts[topVerdict(content)] ?? 0) / runs),
    meanScore: Math.round(totalScore / runs),
    bestScore,
  };
}

export interface KRow {
  k: number;
  /** authored upside removed by the scaling, in meter points */
  removed: number;
  zeroed: number;
  /** uniform-random play */
  topVerdictShare: number;
  randomMean: number;
  randomBest: number;
  /** the fixed non-reader policies */
  bestNonReader: number;
  nonReadersAtTop: number;
  nonReaderCount: number;
  /** breadth-limited search: the headroom above every fixed policy */
  bestInformed: number;
  premium: number;
  /** clamp loss over the random population at this k */
  lossShare: number;
  ceilingWriteShare: number;
}

/**
 * One row of the k table.
 *
 * `samples` is deliberately modest: the row is a comparison between values of k, and the
 * seeds are identical across rows, so the noise is common-mode. A 300-run estimate of a
 * share has a standard error around 3 points, which is small against the 40-point decision
 * this table exists to inform, and large enough that a 2-point difference between adjacent
 * rows means nothing. Both facts are stated because the second one is the one that gets
 * forgotten when a table is read as a ranking.
 */
export interface KOptions {
  /** random runs per row. Identical seeds across rows, so the noise is common-mode. */
  samples?: number;
  /** beam width for the informed player. 200 on this content; see `bestWitnessedPlay`. */
  beam?: number;
  /** which meters' gains to scale. Defaults to all three — usually the wrong answer. */
  only?: readonly DimensionId[];
}

export function measureK(
  content: Content,
  k: number,
  nonReaders: (c: Content) => { scores: number[]; verdicts: string[] },
  opts: KOptions = {},
): KRow {
  const { samples = 300, beam = 48, only = DIMENSIONS } = opts;
  const scaled =
    k === 1 ? { content, k, scaled: 0, removed: 0, zeroed: 0 } : scaleAuthoredGains(content, k, only);
  const random = randomVerdicts(scaled.content, samples);
  const sampled = sampledBudget(scaled.content, Math.min(samples, 300));
  const fixed = nonReaders(scaled.content);
  const informed = bestWitnessedPlay(scaled.content, beam);

  const bestNonReader = fixed.scores.length ? Math.max(...fixed.scores) : 0;
  return {
    k,
    removed: scaled.removed,
    zeroed: scaled.zeroed,
    topVerdictShare: random.topVerdictShare,
    randomMean: random.meanScore,
    randomBest: random.bestScore,
    bestNonReader,
    nonReadersAtTop: fixed.verdicts.filter((v) => v === topVerdict(content)).length,
    nonReaderCount: fixed.verdicts.length,
    bestInformed: informed.score,
    premium: informed.score - bestNonReader,
    lossShare: sampled.whole.lossShare,
    ceilingWriteShare: sampled.whole.writes
      ? round2(sampled.whole.ceilingWrites / sampled.whole.writes)
      : 0,
  };
}

/* ─────────────────────────── printing ─────────────────────────── */

const pad = (v: unknown, n: number) => String(v).padEnd(n);
const lpad = (v: unknown, n: number) => String(v).padStart(n);

export function formatBudget(budget: DeltaBudget): string {
  const lines: string[] = [];
  lines.push(
    `DELTA BUDGET — population: ${budget.population}` +
      `  (${budget.missions.length} missions, ${budget.whole.samples} decisions accounted)`,
  );
  lines.push(
    ` ${pad("mission", 8)} ${lpad("states", 7)} ${lpad("decs", 7)} ${lpad("mean", 6)} ${lpad("range", 11)}` +
      ` ${lpad("applied", 7)} ${lpad("pos%", 5)} ${lpad("clamp", 6)} ${lpad("ceil", 7)}` +
      ` ${pad("authored w/p/d", 20)} ${pad("entry w/p/d", 13)} pinned`,
  );
  for (const m of budget.missions) {
    /* Pinned on ARRIVAL, as a share of the states entering this mission — the number that
       says "by here, this meter has stopped being a meter". A floor pin reads `p!`, because
       a meter stuck at 0 and one stuck at 100 are the same defect and opposite advice. */
    const pinned = [
      ...DIMENSIONS.filter((d) => m.enteredAtCeiling[d] > 0).map(
        (d) => `${d[0]}${Math.round((m.enteredAtCeiling[d] / Math.max(1, m.states)) * 100)}%`,
      ),
      ...DIMENSIONS.filter((d) => m.enteredAtFloor[d] > 0).map(
        (d) => `${d[0]}!${Math.round((m.enteredAtFloor[d] / Math.max(1, m.states)) * 100)}%`,
      ),
    ].join(" ");
    const byDim = DIMENSIONS.map((d) => m.meanAuthoredByDim[d].toFixed(1)).join(" / ");
    lines.push(
      ` ${pad(m.missionId, 8)} ${lpad(m.states, 7)} ${lpad(m.samples, 7)} ${lpad(m.meanAuthored, 6)}` +
        ` ${lpad(`${m.minAuthored}..${m.maxAuthored}`, 11)} ${lpad(m.meanApplied, 7)}` +
        ` ${lpad(Math.round(m.positiveShare * 100), 5)} ${lpad(m.lossShare, 6)}` +
        ` ${lpad(m.ceilingWrites, 7)} ${pad(byDim, 20)} ${pad(`${m.meanEntry.win}/${m.meanEntry.profit}/${m.meanEntry.deliver}`, 13)} ${pinned}`,
    );
  }
  lines.push(
    ` ${pad("ALL", 8)} ${lpad(budget.whole.states, 7)} ${lpad(budget.whole.samples, 7)}` +
      ` ${lpad(budget.whole.meanAuthored, 6)} ${lpad(`${budget.whole.minAuthored}..${budget.whole.maxAuthored}`, 11)}` +
      ` ${lpad(budget.whole.meanApplied, 7)} ${lpad(Math.round(budget.whole.positiveShare * 100), 5)}` +
      ` ${lpad(budget.whole.lossShare, 6)} ${lpad(budget.whole.ceilingWrites, 7)}` +
      ` ${pad(DIMENSIONS.map((d) => budget.whole.meanAuthoredByDim[d].toFixed(1)).join(" / "), 20)}`,
  );
  lines.push(
    `  ${budget.positiveMissions} of ${budget.missions.length} missions have a positive mean summed delta.` +
      `  The clamp destroys ${budget.whole.lost} of ${budget.whole.magnitude} authored meter points` +
      ` (${Math.round(budget.whole.lossShare * 100)}%),` +
      ` ${budget.whole.ceilingWrites} of ${budget.whole.writes} writes` +
      ` (${Math.round((budget.whole.ceilingWrites / Math.max(1, budget.whole.writes)) * 100)}%) hitting the 100 ceiling` +
      ` and ${budget.whole.floorWrites} the 0 floor.`,
  );
  lines.push(
    `  saturating meters — writes cut at the ceiling: ` +
      DIMENSIONS.map((d) => `${d} ${budget.whole.ceilingByDim[d]}`).join(" · ") +
      `; cut at the floor: ` +
      DIMENSIONS.map((d) => `${d} ${budget.whole.floorByDim[d]}`).join(" · "),
  );
  if (budget.mismatches > 0) {
    lines.push(
      `  !! ${budget.mismatches} samples where this module's arithmetic disagreed with the engine.` +
        ` Every number above is then worthless — see accountDecision.`,
    );
  }
  return lines.join("\n");
}

export function formatKTable(rows: KRow[]): string {
  const lines: string[] = [];
  lines.push("SCALING EVERY POSITIVE DELTA BY k");
  lines.push(
    ` ${lpad("k", 5)} ${lpad("removed", 8)} ${lpad("zeroed", 7)} ${lpad("top%", 6)} ${lpad("rnd mean", 9)}` +
      ` ${lpad("rnd best", 9)} ${lpad("best NR", 8)} ${lpad("NR@top", 7)} ${lpad("informed", 9)}` +
      ` ${lpad("premium", 8)} ${lpad("clamp", 6)} ${lpad("ceil%", 6)}`,
  );
  for (const r of rows) {
    lines.push(
      ` ${lpad(r.k.toFixed(2), 5)} ${lpad(r.removed, 8)} ${lpad(r.zeroed, 7)}` +
        ` ${lpad(Math.round(r.topVerdictShare * 100), 6)} ${lpad(r.randomMean, 9)} ${lpad(r.randomBest, 9)}` +
        ` ${lpad(r.bestNonReader, 8)} ${lpad(`${r.nonReadersAtTop}/${r.nonReaderCount}`, 7)}` +
        ` ${lpad(r.bestInformed, 9)} ${lpad(r.premium, 8)} ${lpad(r.lossShare, 6)}` +
        ` ${lpad(Math.round(r.ceilingWriteShare * 100), 6)}`,
    );
  }
  lines.push(
    `  top% = share of uniform-random runs told the top verdict (target < 40).` +
      `  premium = best breadth-limited play − best fixed non-reader policy (target > 0,` +
      ` and the panel's bar is 12).`,
  );
  return lines.join("\n");
}
