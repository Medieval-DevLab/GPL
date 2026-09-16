/**
 * What happens to the sweep when a condition finally reads a meter.
 *
 * Backlog 1.3: no condition in the game gates on a dimension, so the three meters are
 * write-only — a scoreboard beside a questionnaire. `analysis.ts` has carried the machinery
 * for the day that changes since dimension bucketing landed, and **that path had never been
 * exercised**, because there is no content to exercise it with. A capability nobody has run
 * is a capability nobody knows they have: the sequencing note in the backlog says it
 * plainly, "1.3 needs the decile bucketing in `stateKey` or the sweep silently stops being
 * exhaustive".
 *
 * WHAT IS IN HERE AND WHAT IS NOT. The mechanism is proven here, on fixtures small enough
 * that the answer can be checked against arithmetic rather than against a second walk. The
 * same proof on the real story — clone the content, add `min: { win: 60 }`, sweep it — is
 * `tools/gate-proof.mjs`, because it is 31s of synchronous CPU and a gigabyte of frontier,
 * and running it on every `vitest run` starved Vitest's reporter until the run failed with
 * `Timeout calling "onTaskUpdate"` while all 162 tests passed. That is the failure this
 * repo has already hit three times.
 *
 * It is not a standing invariant anyway, and that is the real argument: it measures what
 * WOULD happen to content that does not exist yet. The moment a real gate lands,
 * `analysis.test.ts`'s "fires every authored outcome on some path" becomes exactly this
 * test, on the real content, for nothing.
 *
 * The honest headline, and it is not what the code comments used to claim: **bucketing is
 * not exact.** Two states in one bucket agree on every threshold now and can still drift
 * apart later. What bucketing buys is that the error runs one way only — the sweep can lose
 * a branch, never invent one — so its failure mode is a reachable outcome reported as DEAD,
 * which fails the suite loudly. The quiet casualty is `findRealisedDominance`, whose
 * `share` is a fraction of the states the key admits.
 */

import { describe, expect, it } from "vitest";

import { sweep } from "./analysis";
import {
  isMission,
  type Content,
  type DimensionId,
  type GameNode,
  type Lesson,
} from "./types";

/**
 * Every outcome id the content declares, which is what "complete coverage" is measured
 * against. Derived from the content rather than from a baseline sweep on purpose: comparing
 * one walk against another walk cannot tell you whether either walked everything.
 */
function authoredOutcomes(c: Content): string[] {
  const out: string[] = [];
  for (const node of Object.values(c.nodes)) {
    if (!isMission(node)) continue;
    const list = node.kind === "choice" ? node.options.flatMap((o) => o.outcomes) : node.outcomes;
    for (const o of list) out.push(o.id);
  }
  return out;
}

/* ───────────────────── the limit, on content small enough to prove ───────────────────── */

const LESSON: Lesson = { principle: "A fixture teaches nothing.", because: "It is arithmetic." };

/**
 * A linear chain of choice missions, each option moving `win` by a fixed amount, ending in
 * one mission whose outcome is gated on `win`.
 *
 * Small enough that the answer can be worked out with a pencil, which is the point: the
 * reference below is the arithmetic, not a second walk. Two walks agreeing tells you they
 * share a bug.
 */
function chain(steps: { id: string; deltas: number[] }[], floor: number): Content {
  const nodes: Record<string, GameNode> = {};
  const order = steps.map((s) => s.id);

  nodes["s0"] = {
    kind: "setup",
    id: "s0",
    eyebrow: "",
    title: "",
    body: [],
    question: "",
    options: [
      {
        id: "s-only",
        title: "",
        description: "",
        icon: "target",
        strengths: [],
        tradeoff: "",
        flags: [],
      },
    ],
    next: (order[0] ?? "gate") as string,
  };

  steps.forEach((step, i) => {
    nodes[step.id] = {
      kind: "choice",
      id: step.id,
      chapter: 1,
      stage: "lead",
      title: step.id,
      eyebrow: "",
      objective: "",
      minutes: 1,
      situation: [],
      lesson: LESSON,
      question: "",
      next: (order[i + 1] ?? "gate") as string,
      options: step.deltas.map((d, j) => ({
        id: `${step.id}-o${j}`,
        title: `${d >= 0 ? "+" : ""}${d}`,
        description: "",
        outcomes: [
          {
            id: `${step.id}-o${j}-out`,
            tone: "mixed" as const,
            headline: "",
            detail: "",
            changed: [],
            effect: { dims: { win: d } },
          },
        ],
      })),
    };
  });

  nodes["gate"] = {
    kind: "choice",
    id: "gate",
    chapter: 1,
    stage: "deal",
    title: "gate",
    eyebrow: "",
    objective: "",
    minutes: 1,
    situation: [],
    lesson: LESSON,
    question: "",
    next: "end",
    options: [
      {
        id: "gate-o",
        title: "",
        description: "",
        outcomes: [
          {
            id: "gate-hit",
            when: { min: { win: floor } },
            tone: "strong" as const,
            headline: "",
            detail: "",
            changed: [],
            effect: {},
          },
          {
            id: "gate-miss",
            tone: "hard" as const,
            headline: "",
            detail: "",
            changed: [],
            effect: {},
          },
        ],
      },
    ],
  };

  nodes["end"] = { kind: "ending", id: "end" };

  return {
    nodes,
    startNodeId: "s0",
    missionOrder: [...order, "gate"],
    chapters: [{ number: 1, label: "", title: "", missionIds: [...order, "gate"], steps: [] }],
    threads: [],
  };
}

/**
 * Which side of the gate the chain can land on, by arithmetic.
 *
 * Independent of every walk in this repo: the meters start at 50 (`START_DIMS`), each step
 * adds one of its deltas, and the gate fires when the total reaches the floor. Deltas are
 * kept small so nothing clamps, because a clamp would make this reference wrong in a way
 * that is hard to see — and a wrong reference is worse than none.
 */
function reachesBothSides(steps: { id: string; deltas: number[] }[], floor: number): { hit: boolean; miss: boolean } {
  let sums = [50];
  for (const step of steps) sums = sums.flatMap((s) => step.deltas.map((d) => s + d));
  return { hit: sums.some((s) => s >= floor), miss: sums.some((s) => s < floor) };
}

describe("dimension bucketing, on content small enough to check by hand", () => {
  /**
   * The mechanism, in the smallest case that has one.
   *
   * One decision moves `win` to 60 or leaves it at 50. Those are different buckets, so the
   * two states survive as two and the gate is exercised both ways — which is precisely what
   * the backlog asks to be proven before content is allowed to gate on a meter.
   */
  const separable = [{ id: "s1", deltas: [10, 0] }];

  it("keeps two states that branch differently apart", () => {
    const truth = reachesBothSides(separable, 60);
    expect(truth).toEqual({ hit: true, miss: true });

    const bucketed = sweep(chain(separable, 60));
    expect(bucketed.firedOutcomes.has("gate-hit")).toBe(truth.hit);
    expect(bucketed.firedOutcomes.has("gate-miss")).toBe(truth.miss);

    // And the exact key agrees, so ten-point buckets cost nothing here.
    const exact = sweep(chain(separable, 60), { dimBucket: 1 });
    expect([...exact.firedOutcomes].sort()).toEqual([...bucketed.firedOutcomes].sort());
  });

  it("collapses them under the dimensionless key, and reports one as dead", () => {
    const control = sweep(chain(separable, 60), { dimBucket: Infinity });
    // Exactly one side of the gate survives: the frontier keeps the first state to arrive.
    expect(control.firedOutcomes.has("gate-hit")).toBe(true);
    expect(control.firedOutcomes.has("gate-miss")).toBe(false);
  });

  /**
   * And the limit, which is the part worth writing down.
   *
   * `win` goes to 59 or stays at 50 — **the same ten-point bucket** — so the two states
   * collapse. Then both would have received +1, putting one either side of a gate at 60.
   * The exact key fires both outcomes; ten-point buckets fire one and report the other as
   * dead content.
   *
   * So the bucketing is an approximation, and this is its shape: it cannot invent a branch
   * (every outcome it reports fired was fired by a real `playMission`), it can only lose
   * one, and losing one fails the "fires every authored outcome" test rather than passing
   * quietly. That asymmetry is the whole argument for shipping it, and it is why the
   * alignment guard below exists — a threshold *inside* a bucket collapses the two sides
   * immediately rather than after a drift, which is the same defect with no upper bound.
   */
  const inseparable = [
    { id: "s1", deltas: [9, 0] },
    { id: "s2", deltas: [1] },
  ];

  it("admits the states it cannot separate, and loses them loudly", () => {
    const truth = reachesBothSides(inseparable, 60);
    expect(truth).toEqual({ hit: true, miss: true });

    const exact = sweep(chain(inseparable, 60), { dimBucket: 1 });
    expect(exact.firedOutcomes.has("gate-hit")).toBe(true);
    expect(exact.firedOutcomes.has("gate-miss")).toBe(true);

    const bucketed = sweep(chain(inseparable, 60));
    const lost = ["gate-hit", "gate-miss"].filter((id) => !bucketed.firedOutcomes.has(id));
    expect(lost).toEqual(["gate-miss"]);
  });

  /**
   * The guard that turns the unsound case into a failure instead of a wrong answer.
   *
   * A gate at `min: { win: 55 }` puts 50 and 59 — one side each — in bucket 5. The old
   * comment stated the soundness condition ("a threshold on a bucket boundary, which is
   * where thresholds should be set for exactly this reason") and nothing enforced it, so
   * content could have walked straight into it while the sweep reported full coverage.
   */
  it("refuses to walk a threshold that sits inside a bucket", () => {
    expect(() => sweep(chain(separable, 55))).toThrow(/bucket boundary/);
    // `max` splits between b and b+1, so `max: 59` is the aligned spelling of the same cut.
    expect(() => sweep(chain(separable, 60))).not.toThrow();
    // And the exact key is always allowed, because there is nothing left to be inside of.
    expect(() => sweep(chain(separable, 55), { dimBucket: 1 })).not.toThrow();
  });

  /** The fixture itself has to be able to fail, or none of the above means anything. */
  it("has a fixture the walk can actually get wrong", () => {
    const c = chain(separable, 60);
    expect(authoredOutcomes(c)).toContain("gate-hit");
    expect(authoredOutcomes(c)).toContain("gate-miss");
    const dims: DimensionId[] = ["win", "profit", "deliver"];
    expect(dims).toHaveLength(3);
  });
});
