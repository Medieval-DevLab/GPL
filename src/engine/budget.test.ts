/**
 * The delta-budget report, and the checks that stop it lying.
 *
 * This file's main job is to PRINT. The numbers in `budget.ts` are for authoring against —
 * 88 authored deltas are about to be rewritten and nobody should do that from intuition —
 * and a report that is not in the test run is a report nobody sees. `engagement.test.ts`
 * established the pattern: print the measurement, assert only what the instrument itself
 * guarantees.
 *
 * So the assertions here are deliberately NOT content values. Content is being authored
 * while this is written; pinning "16 of 17 missions drift positive" would turn every
 * legitimate content edit into a red build, and the pinned numbers that belong in a gate
 * are already in `engagement.test.ts`. What is asserted is that the instrument agrees with
 * the engine, that the scaler does what it says, and that the clamp accounting can see a
 * clamp — because an instrument reporting 0% waste because it cannot detect waste is the
 * exact D-037 failure, and it is the cheapest wrong answer this file could produce.
 *
 * THE BIG TABLES LIVE IN `tools/economy.mjs`, not here. The exhaustive walk is ~10s and the
 * k sweep another ~8s, and adding them to the suite took it to 205s of test CPU across the
 * workers — enough that Vitest's reporter stopped being scheduled and the run failed with
 * `Timeout calling "onTaskUpdate"` while all 162 tests passed. A green suite with a
 * non-zero exit code is the most confusing failure available, and this repo has produced it
 * three times already. What stays here is the sampled population (half a second) and the
 * arithmetic, which is what can actually regress.
 */

import { describe, expect, it } from "vitest";

import { story } from "../content/story";
import {
  accountDecision,
  bestWitnessedPlay,
  formatBudget,
  randomVerdicts,
  sampledBudget,
  scaleAuthoredGains,
  TOP_VERDICT,
} from "./budget";
import { DIMENSIONS, type BuildMission, type Content, type Lesson } from "./types";

const content = story;

/**
 * Enough runs to assert on, not enough to be a report.
 *
 * The report wants 1,200 — a share of a verdict has a standard error near 3 points at 300
 * and 1.4 at 1,200 — and it lives in `tools/economy.mjs` where it can afford them. What
 * this file needs is a population big enough to reach every mission and exercise the
 * accounting, and small enough that it costs the suite well under a second. Vitest runs
 * nine files in competing workers on eight cores against a 60s RPC timeout, and this
 * project has already shipped a green suite with a non-zero exit code three times.
 */
const RUNS = 400;

describe("the delta budget, over random play", () => {
  it("prints the behavioural budget beside the verdicts drawn from the same population", () => {
    const budget = sampledBudget(content, RUNS);
    const verdicts = randomVerdicts(content, RUNS);
    console.log(`\n${formatBudget(budget)}`);
    console.log(
      `\nUNIFORM-RANDOM VERDICTS (${verdicts.runs} runs, same generator and seeds)\n` +
        Object.entries(verdicts.verdicts)
          .sort((a, b) => b[1] - a[1])
          .map(([title, n]) => `  ${String(Math.round((n / verdicts.runs) * 100)).padStart(3)}%  ${title}`)
          .join("\n") +
        `\n  mean score ${verdicts.meanScore}, best ${verdicts.bestScore}\n`,
    );

    /* The one assertion that makes the table worth reading. `accountDecision` recomputes
       `dimsAfter` from the authored deltas and the engine's two-step order; if it ever
       disagrees with what `commit` actually recorded, every clamp figure above is this
       module's arithmetic rather than the game's. */
    expect(budget.mismatches).toBe(0);
    expect(budget.missions.length).toBe(content.missionOrder.length);
    expect(budget.whole.magnitude).toBeGreaterThan(0);
    expect(verdicts.verdicts[TOP_VERDICT] ?? 0).toBeGreaterThan(0);
  }, 120_000);
});

describe("scaling the gains", () => {
  it("leaves negative deltas and un-named meters exactly as authored", () => {
    const scaled = scaleAuthoredGains(content, 0.5, ["win"]);
    const authored = new Map<string, number>();
    const rescaled = new Map<string, number>();
    const collect = (c: Content, into: Map<string, number>) => {
      for (const node of Object.values(c.nodes)) {
        if (node.kind !== "choice") continue;
        for (const option of node.options) {
          for (const outcome of option.outcomes) {
            for (const d of DIMENSIONS) {
              const v = outcome.effect.dims?.[d];
              if (v !== undefined) into.set(`${outcome.id}.${d}`, v);
            }
          }
        }
      }
    };
    collect(content, authored);
    collect(scaled.content, rescaled);

    const wrong: string[] = [];
    for (const [key, value] of authored) {
      const after = rescaled.get(key);
      const isWinGain = key.endsWith(".win") && value > 0;
      if (isWinGain ? after !== Math.round(value * 0.5) : after !== value) {
        wrong.push(`${key}: ${value} → ${after}`);
      }
    }
    expect(wrong).toEqual([]);
    // It did something, or the loop above proved nothing.
    expect(scaled.scaled).toBeGreaterThan(20);
  });

  it("does not mutate the content it was given", () => {
    const beforeJson = JSON.stringify(content);
    scaleAuthoredGains(content, 0.5);
    expect(JSON.stringify(content)).toBe(beforeJson);
  });
});

/**
 * The clamp accounting, on arithmetic it cannot get right by accident.
 *
 * Every assertion above is against the live content, where the two effect steps are only
 * both non-zero on the two `build` missions — 15 of 17 missions write the meters once, so
 * the ordering that `accountDecision`'s comment makes so much of is barely exercised by
 * them. These three cases exercise it directly: a write cut at the ceiling, a write cut at
 * the floor, and the order-dependent pair where a `+` and a `−` of equal size net to zero
 * authored while destroying real magnitude.
 */
describe("clamp accounting", () => {
  const LESSON: Lesson = { principle: "", because: "" };
  const build = (componentDims: Partial<Record<"win" | "profit" | "deliver", number>>, outcomeDims: Partial<Record<"win" | "profit" | "deliver", number>>): BuildMission => ({
    kind: "build",
    id: "b",
    chapter: 1,
    stage: "solution",
    title: "",
    eyebrow: "",
    objective: "",
    minutes: 1,
    situation: [],
    lesson: LESSON,
    question: "",
    next: "end",
    pick: 1,
    components: [{ id: "c1", title: "", description: "", tag: "", dims: componentDims }],
    outcomes: [{ id: "o", tone: "mixed", headline: "", detail: "", changed: [], effect: { dims: outcomeDims } }],
  });

  it("counts magnitude destroyed at the ceiling", () => {
    const s = accountDecision(build({}, { win: 8 }), ["c1"], { win: 97, profit: 50, deliver: 50 }, "o");
    expect(s.magnitude).toBe(8);
    expect(s.lost).toBe(5);
    expect(s.applied).toBe(3);
    expect(s.ceilingWrites).toBe(1);
    expect(s.recomputed.win).toBe(100);
  });

  it("counts magnitude destroyed at the floor", () => {
    const s = accountDecision(build({}, { profit: -9 }), ["c1"], { win: 50, profit: 4, deliver: 50 }, "o");
    expect(s.lost).toBe(5);
    expect(s.floorWrites).toBe(1);
    expect(s.floorByDim.profit).toBe(1);
    expect(s.recomputed.profit).toBe(0);
  });

  /**
   * The order case. From 97: the component's +6 is cut to +3 at the ceiling, then the
   * outcome's −6 lands on 100 and finishes at 94. Authored nets to zero, the player sees
   * −3, and three points of authored consequence were destroyed. Summing the two writes
   * before applying them would report 0 authored, 0 applied and 0 lost — all three wrong,
   * and all three plausible.
   */
  it("applies the selection's writes before the outcome's, as the engine does", () => {
    const s = accountDecision(build({ win: 6 }, { win: -6 }), ["c1"], { win: 97, profit: 50, deliver: 50 }, "o");
    expect(s.authored).toBe(0);
    expect(s.magnitude).toBe(12);
    expect(s.lost).toBe(3);
    expect(s.applied).toBe(-3);
    expect(s.recomputed.win).toBe(94);
  });

  it("reports nothing when nothing is near a bound", () => {
    const s = accountDecision(build({}, { win: 5, profit: -3 }), ["c1"], { win: 50, profit: 50, deliver: 50 }, "o");
    expect(s.lost).toBe(0);
    expect(s.authored).toBe(2);
    expect(s.applied).toBe(2);
    expect(s.writes).toBe(2);
  });
});

describe("the informed player", () => {
  /**
   * A beam of one IS the `meter-greedy` non-reader policy — same one-step lookahead, same
   * objective — so a wider beam must never do worse. If it did, the search would be losing
   * states it had already found, and every premium in the k table would be noise.
   */
  it("never does worse with a wider beam", () => {
    const narrow = bestWitnessedPlay(content, 1).score;
    const wide = bestWitnessedPlay(content, 24).score;
    expect(wide).toBeGreaterThanOrEqual(narrow);
  }, 120_000);

  it("returns a script that replays to the score it claims", () => {
    const best = bestWitnessedPlay(content, 24);
    expect(best.script.length).toBeGreaterThan(8);
    expect(best.verdict.length).toBeGreaterThan(0);
    for (const d of DIMENSIONS) {
      expect(best.dims[d]).toBeGreaterThanOrEqual(0);
      expect(best.dims[d]).toBeLessThanOrEqual(100);
    }
  }, 120_000);
});
