/**
 * State-space analysis.
 *
 * Split out of `engine.test.ts` for a mechanical reason: these are the only
 * CPU-bound tests in the project — three exhaustive sweeps, a per-state dominance walk
 * and six hundred sampled playthroughs — and together they blocked one Vitest worker for
 * about a hundred seconds. Long enough that the worker stopped answering the reporter's
 * RPC, so the run failed with `Timeout calling "onTaskUpdate"` while all 138 tests
 * passed: a green suite with a non-zero exit code, which is the most confusing possible
 * failure. Vitest runs files in parallel workers, so the fix is two files.
 */

import { beforeAll, describe, expect, it } from "vitest";

import { story } from "../content/story";
import { causalThreads, getNode } from "./engine";
import {
  findRealisedDominance,
  pastSetup,
  playMission,
  possibleSelections,
  reachableExtremes,
  sweep,
  sweepWalk,
} from "./analysis";
import { DIMENSIONS, isMission, type GameState } from "./types";

const content = story;

/**
 * One sweep, shared.
 *
 * A sweep is ~18s of unbroken synchronous CPU. This file was running three of them — one
 * per determinism test and a third in the `every path is playable` hook — which put a
 * single test at 80s, past the 60s worker RPC timeout hardcoded in birpc, and failed the
 * run with `Timeout calling "onTaskUpdate"` while every test passed. Only the determinism
 * check genuinely needs a second, independent sweep; everything else is asking the same
 * question of the same answer.
 */
/**
 * Drive the sweep, letting the worker breathe between levels.
 *
 * The scheduling lives in the test rather than the engine, which may not touch a timer.
 * `setTimeout`, not `queueMicrotask`: a microtask does not let the worker service its
 * message port, and servicing it is the entire point. A worker blocked in a twenty-second
 * synchronous loop cannot read the reply to its own `onTaskUpdate` call, so birpc's
 * hardcoded 60s deadline expires and the run exits 1 with every test green.
 *
 * Belt and braces alongside `fileParallelism: false`. That stops the workers competing
 * for cores today; this stops one long level from being able to blow the deadline however
 * much content arrives later.
 */
async function driveSweep(): Promise<ReturnType<typeof sweep>> {
  const walk = sweepWalk(content);
  let step = walk.next();
  while (!step.done) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    step = walk.next();
  }
  return step.value;
}

let memo: ReturnType<typeof sweep> | null = null;
async function sharedSweep(): Promise<ReturnType<typeof sweep>> {
  if (!memo) memo = await driveSweep();
  return memo;
}

/** Deterministic PRNG (mulberry32), so a sampled failure replays from its seed. */
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("determinism", () => {
  it("produces identical state from identical choices", () => {
    const run = (): GameState => {
      let s = pastSetup(content);
      let guard = 0;
      while (isMission(getNode(content, s.nodeId)) && guard++ < 50) {
        const mission = getNode(content, s.nodeId);
        if (!isMission(mission)) break;
        const selection = possibleSelections(mission, s)[0];
        if (!selection) break;
        s = playMission(s, content, selection);
      }
      return s;
    };

    const a = run();
    const b = run();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  // Two exhaustive sweeps of the whole state space. Legitimately slow, and the
  // single most important guarantee in the game — if this ever fails, a result
  // stopped being attributable to the player's decisions.
  /**
   * Two independent sweeps must agree exactly.
   *
   * Split across two tests on purpose. One sweep is ~21s of unbroken synchronous CPU, and
   * Vitest's worker RPC timeout is hardcoded at 60s (`DEFAULT_TIMEOUT` in birpc) — so two
   * back to back inside one test blocked the worker past it and the run failed with
   * `Timeout calling "onTaskUpdate"` while all 138 tests passed. A green suite with a
   * non-zero exit code is the most confusing failure available. Vitest yields between
   * tests, so two tests give the reporter a guaranteed window. The guarantee is unchanged:
   * the point is that two independent sweeps agree, not that they are adjacent.
   */
  let first: ReturnType<typeof sweep> | null = null;

  it("sweeps the whole state space once", async () => {
    first = await sharedSweep();
    expect(first.endings).toBeGreaterThan(0);
  }, 180_000);

  it("uses no randomness — a second sweep matches exactly", async () => {
    const second = await driveSweep();
    expect(first).not.toBeNull();
    expect([...(first as NonNullable<typeof first>).firedOutcomes].sort()).toEqual(
      [...second.firedOutcomes].sort(),
    );
    expect((first as NonNullable<typeof first>).finalRange).toEqual(second.finalRange);
    expect((first as NonNullable<typeof first>).statesAtMission).toEqual(second.statesAtMission);
  }, 180_000);
});

describe("every path is playable", () => {
  /* `beforeAll`, not module scope. At module scope this runs during COLLECTION, and a
     collect phase that blocks for ninety seconds is what actually starved the reporter —
     splitting the file did not help, because the work had simply moved to another
     worker's collect. */
  let result: ReturnType<typeof sweep>;
  beforeAll(async () => {
    result = await sharedSweep();
  }, 180_000);

  it("reaches an ending from every branch", () => {
    expect(result.endings).toBeGreaterThan(0);
  });

  it("keeps every dimension inside 0..100", () => {
    for (const d of DIMENSIONS) {
      expect(result.finalRange[d].min).toBeGreaterThanOrEqual(0);
      expect(result.finalRange[d].max).toBeLessThanOrEqual(100);
    }
  });

  /**
   * The assertion above is satisfied by `clamp` and therefore cannot fail — it looks like
   * a meter-bounds test and is not one. The real question is whether a verdict threshold
   * is crossable, and `finalRange` cannot answer it: the dedup key drops dimensions, so
   * its ranges are first-arrival samples. They reported profit ≤ 90 and deliver ≥ 20
   * while both are wrong, and two reviewers read the win figure as proof that the
   * "did not win the work" ending was dead.
   *
   * `reachableExtremes` replays greedy policies, so every number is witnessed.
   */
  it("reports witnessed extremes wider than the sweep's sampled ranges", () => {
    const witnessed = reachableExtremes(content);
    for (const d of DIMENSIONS) {
      // A witnessed path is proof; the sample cannot legitimately exceed it on either end.
      expect(
        witnessed[d].max,
        `${d}: sweep claims max ${result.finalRange[d].max}, witnessed only ${witnessed[d].max}`,
      ).toBeGreaterThanOrEqual(result.finalRange[d].max);
    }
    // Every meter can be driven to the ceiling, which is itself a finding: see D-040.
    expect(witnessed.profit.max).toBe(100);
    expect(witnessed.deliver.max).toBe(100);
  }, 120_000);

  it("exercises every option at least once", () => {
    const declared: string[] = [];
    for (const node of Object.values(content.nodes)) {
      if (isMission(node) && node.kind === "choice") {
        for (const o of node.options) declared.push(`${node.id}/${o.id}`);
      }
    }
    const missed = declared.filter((id) => !result.exercisedOptions.has(id));
    expect(missed).toEqual([]);
  });

  it("fires every authored outcome on some path", () => {
    const declared: string[] = [];
    for (const node of Object.values(content.nodes)) {
      if (!isMission(node)) continue;
      if (node.kind === "choice") {
        for (const o of node.options) for (const oc of o.outcomes) declared.push(oc.id);
      } else {
        for (const oc of node.outcomes) declared.push(oc.id);
      }
    }
    const dead = declared.filter((id) => !result.firedOutcomes.has(id));
    expect(dead).toEqual([]);
  });

  it("fires every situation variant on some path", () => {
    const declared: string[] = [];
    for (const node of Object.values(content.nodes)) {
      if (!isMission(node)) continue;
      (node.variants ?? []).forEach((_, i) => declared.push(`${node.id}#${i}`));
    }
    const dead = declared.filter((id) => !result.firedVariants.has(id));
    expect(dead).toEqual([]);
  });

  /**
   * The same guarantee for the conditional client voices, which are new and therefore
   * exactly the thing most likely to be authored wrong.
   *
   * `Mission.quotes` is first-match-wins, so a broad entry above a narrow one silences the
   * narrow one permanently — and because the fallback `saidQuote` still renders, the brief
   * looks completely normal. A line of dialogue nobody can ever hear is the quietest
   * possible content bug, and Marcus Reed's two are gated on flags set by a single
   * optional question in chapter two.
   */
  it("lets someone hear every conditional client quote", () => {
    const declared: string[] = [];
    for (const node of Object.values(content.nodes)) {
      if (!isMission(node)) continue;
      (node.quotes ?? []).forEach((_, i) => declared.push(`${node.id}#${i}`));
    }
    expect(declared.length, "no conditional quotes authored — is the walk still right?").toBeGreaterThan(0);
    const dead = declared.filter((id) => !result.firedQuotes.has(id));
    expect(dead).toEqual([]);
  });
});

/**
 * These are the pedagogy tests. They assert that playing well and playing
 * badly actually feel different, and — more importantly — that the specific
 * causal chains the game is built to teach genuinely fire.
 */
describe("the debrief has something to say", () => {
  it("shows at least one causal thread on most runs", () => {
    const advantages = ["s-connector", "s-builder", "s-challenger"];
    let zero = 0;
    let atCap = 0;
    const RUNS = 600;
    for (let i = 0; i < RUNS; i++) {
      const rng = seededRng(i + 1);
      let s = pastSetup(content, advantages[i % 3]);
      let guard = 0;
      while (isMission(getNode(content, s.nodeId)) && guard++ < 40) {
        const mission = getNode(content, s.nodeId);
        if (!isMission(mission)) break;
        const legal = possibleSelections(mission, s);
        s = playMission(s, content, legal[Math.floor(rng() * legal.length)] as string[]);
      }
      const n = causalThreads(s, content).length;
      if (n === 0) zero++;
      if (n >= 3) atCap++;
    }
    // Was 77% empty. Product adoption's threshold was >=70% of runs showing one.
    expect(zero / RUNS).toBeLessThan(0.4);
    // And the cap is now reachable, so slice(0, 3) is not dead code.
    expect(atCap).toBeGreaterThan(0);
  }, 180_000);

  it("keeps the thread table in content, where a writer can reach it", () => {
    expect(content.threads.length).toBeGreaterThanOrEqual(12);
    // Every rule needs two outcomes: one is a decision restated as a chain.
    for (const t of content.threads) {
      expect(t.needsOutcomes.length, `"${t.because}" fires on one outcome`).toBeGreaterThan(1);
    }
    // And every id it names must exist, or the rule can never fire.
    const authored = new Set<string>();
    for (const node of Object.values(content.nodes)) {
      if (!isMission(node)) continue;
      const outs = node.kind === "choice" ? node.options.flatMap((o) => o.outcomes) : node.outcomes;
      for (const o of outs) authored.add(o.id);
    }
    const unknown = content.threads.flatMap((t) => t.needsOutcomes).filter((id) => !authored.has(id));
    expect(unknown).toEqual([]);
  });
});

describe("no fake choices, in the states that occur", () => {
  /* Walked once and filtered twice. Two calls cost ~30s of solid synchronous CPU in one
     worker, which starved Vitest's reporter RPC and failed the run with
     `Timeout calling "onTaskUpdate"` while every test passed — a green suite with a
     non-zero exit code. */
  let weak: ReturnType<typeof findRealisedDominance>;
  let strong: ReturnType<typeof findRealisedDominance>;
  beforeAll(() => {
    // Walked once and filtered twice: two walks are ~30s of solid synchronous CPU.
    weak = findRealisedDominance(content, 0.75);
    strong = weak.filter((f) => f.share >= 0.9);
  }, 180_000);

  it("has no option that dominates a sibling in 90% of reachable states", () => {
    expect(strong.map((f) => `${f.mission}: ${f.note}`)).toEqual([]);
  });

  /**
   * Reported, not enforced. A relation in the 75–90% band is usually a legitimately
   * strong option rather than a fake choice, and the threshold is a judgement — but an
   * unwatched list is how these got to 90% in the first place.
   */
  it("reports weaker dominance relations for review", () => {
    const findings = weak;
    if (findings.length) {
      const lines = findings.map(
        (f) =>
          `  ${f.mission}  ${f.dominant} > ${f.dominated}  ` +
          `${Math.round(f.share * 100)}% of ${f.comparedIn}`,
      );
      console.log(["", "dominance relations in the 75-90% band:", ...lines, ""].join("\n"));
    }
    /* 6 → 8. Two of the additions are the new change-control option beating the two
       answers it is *meant* to beat — absorbing the cost yourself, and quietly trimming
       the scope — which is the lesson rather than a defect. Both sit at 83–88%, below the
       90% bar, and they are watched here precisely so that claim does not have to be
       taken on trust. */
    expect(findings.length).toBeLessThanOrEqual(8);
  });
});
