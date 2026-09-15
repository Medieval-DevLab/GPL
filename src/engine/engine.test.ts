import { describe, expect, it } from "vitest";

import { story } from "../content/story";
import { advance, causalThreads, createInitialState, finalVerdict, getNode } from "./engine";
import {
  findDominantOptions,
  pastSetup,
  playMission,
  playScript,
  possibleSelections,
  sweep,
} from "./analysis";
import { formatIssues, validateContent } from "./validate";
import { DIMENSIONS, isMission, type GameState } from "./types";

const content = story;

describe("content validity", () => {
  const issues = validateContent(content);
  const errors = issues.filter((i) => i.severity === "error");

  it("has no structural errors", () => {
    expect(formatIssues(errors)).toBe("content is valid");
  });

  it("reports its warnings for review", () => {
    const warnings = issues.filter((i) => i.severity === "warning");
    if (warnings.length) console.log("\ncontent warnings:\n" + formatIssues(warnings) + "\n");
    expect(Array.isArray(warnings)).toBe(true);
  });

  it("has sixteen missions", () => {
    expect(content.missionOrder).toHaveLength(16);
  });

  /**
   * The story is full of curly quotes, en dashes and em dashes. Any tool that
   * reads the file as Latin-1 and writes it back as UTF-8 turns “ into â€œ, and
   * nothing else in the pipeline notices — it typechecks, it builds, it ships,
   * and it is only visible if someone happens to look at that paragraph.
   * A PowerShell `Get-Content | Set-Content -Encoding utf8` did exactly that.
   */
  it("has no mis-decoded characters anywhere in the content", () => {
    const suspect = /â€|Ã‚|Ã©|�/;
    const bad: string[] = [];

    const walk = (value: unknown, path: string) => {
      if (typeof value === "string") {
        if (suspect.test(value)) bad.push(`${path}: ${value.slice(0, 80)}`);
      } else if (Array.isArray(value)) {
        value.forEach((v, i) => walk(v, `${path}[${i}]`));
      } else if (value && typeof value === "object") {
        for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
      }
    };

    walk(content, "story");
    expect(bad).toEqual([]);
  });
});

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
  it(
    "uses no randomness — repeated sweeps match exactly",
    () => {
      const one = sweep(content);
      const two = sweep(content);
      expect([...one.firedOutcomes].sort()).toEqual([...two.firedOutcomes].sort());
      expect(one.finalRange).toEqual(two.finalRange);
    },
    60_000,
  );
});

describe("every path is playable", () => {
  const result = sweep(content);

  it("reaches an ending from every branch", () => {
    expect(result.endings).toBeGreaterThan(0);
  });

  it("keeps every dimension inside 0..100", () => {
    for (const d of DIMENSIONS) {
      expect(result.finalRange[d].min).toBeGreaterThanOrEqual(0);
      expect(result.finalRange[d].max).toBeLessThanOrEqual(100);
    }
  });

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
});

/**
 * These are the pedagogy tests. They assert that playing well and playing
 * badly actually feel different, and — more importantly — that the specific
 * causal chains the game is built to teach genuinely fire.
 */
describe("the game teaches what it claims to teach", () => {
  /** Never asks a question, never involves Operations, over-promises, discounts. */
  const RECKLESS: string[][] = [
    ["o-apex"],
    ["ev-rivals", "ev-budget"],
    ["o-campaign"],
    ["o-pursue"],
    ["o-hold"],
    ["c-benchmark", "c-reference"],
    ["o-asked"],
    ["o-conventional"],
    ["c-journey", "c-platform", "c-pilot"],
    ["o-defend"],
    ["o-discount"],
    ["o-accept-risk"],
    ["o-proceed"],
    ["o-push"],
    ["o-contractors"],
    ["o-prove-fast"],
  ];

  /** Investigates, involves Operations, prices honestly, mitigates, resets early. */
  const CONSIDERED: string[][] = [
    ["o-northwind"],
    ["ev-pain", "ev-sponsor"],
    ["o-pov"],
    ["o-workshop"],
    ["o-reframe"],
    ["c-ops-workshop", "c-data-audit"],
    ["o-real"],
    ["o-outcome-deal"],
    ["c-ops", "c-training", "c-journey"],
    ["o-shore-deliver"],
    ["o-phase"],
    ["o-mitigate"],
    ["o-modify"],
    ["o-reset"],
    ["o-slip"],
    ["o-broaden"],
  ];

  /** Good instincts, but wins the deal by giving away the contingency. */
  const DISCOUNTER: string[][] = [
    ["o-northwind"],
    ["ev-pain", "ev-sponsor"],
    ["o-pov"],
    ["o-pursue"],
    ["o-reframe"],
    ["c-reference", "c-benchmark"],
    ["o-real"],
    ["o-conventional"],
    ["c-ops", "c-journey", "c-pilot"],
    ["o-sharpen-win"],
    ["o-discount"],
    ["o-mitigate"],
    ["o-proceed"],
    ["o-absorb"],
    ["o-contractors"],
    ["o-handover"],
  ];

  const reckless = playScript(content, RECKLESS, "s-builder");
  const considered = playScript(content, CONSIDERED);
  const discounter = playScript(content, DISCOUNTER);

  it("all three reach the ending", () => {
    for (const s of [reckless, considered, discounter]) {
      expect(s.phase).toBe("ending");
      expect(s.history).toHaveLength(16);
    }
  });

  /**
   * Note what this does NOT claim. Recklessness can absolutely win the work — it
   * over-promises, and over-promising is persuasive. What it cannot do is leave the
   * engagement profitable or deliverable. Asserting that the considered run wins on
   * all three would be asserting something the game deliberately does not teach.
   */
  it("the considered run beats the reckless run where it matters", () => {
    expect(considered.dims.profit).toBeGreaterThan(reckless.dims.profit);
    expect(considered.dims.deliver).toBeGreaterThan(reckless.dims.deliver);
    expect(considered.dims.win).toBeGreaterThanOrEqual(reckless.dims.win);
  });

  it("the reckless run genuinely fails delivery", () => {
    expect(reckless.dims.deliver).toBeLessThan(35);
    expect(finalVerdict(reckless.dims).title).not.toBe("A deal worth having");
  });

  it("the considered run lands a deal worth having", () => {
    expect(finalVerdict(considered.dims).title).toBe("A deal worth having");
  });

  it("CAUSAL CHAIN: discounting removes the money needed to fix the risk later", () => {
    // m9 mitigation should hit the "cannot afford it" branch because of m8.
    const m9 = discounter.history.find((h) => h.missionId === "m9");
    expect(m9?.outcomeId).toBe("m9-mitigate-broke");
    expect(discounter.flags).toContain("thin_mitigation");

    // ...and that thin mitigation should then bite in month five.
    const m10 = discounter.history.find((h) => h.missionId === "m10");
    expect(m10?.outcomeId).toBe("m10-absorb-broke");
    expect(discounter.dims.profit).toBeLessThan(35);
  });

  it("CAUSAL CHAIN: skipping discovery makes the right answer undefendable", () => {
    // Choosing the genuinely correct problem WITHOUT evidence lands weakly.
    const blind = playScript(content, [
      ["o-northwind"],
      ["ev-rivals", "ev-budget"],
      ["o-direct"],
      ["o-workshop"],
      ["o-reframe"],
      ["c-benchmark", "c-stakeholders"],
      ["o-real"], // correct call, no proof
      ["o-conventional"],
      ["c-ops", "c-training", "c-data"],
      ["o-shore-deliver"],
      ["o-phase"],
      ["o-mitigate"],
      ["o-modify"],
      ["o-reset"],
      ["o-slip"],
      ["o-handover"],
    ]);
    const m6 = blind.history.find((h) => h.missionId === "m6");
    expect(m6?.outcomeId).toBe("m6-real-hunch");
  });

  it("CAUSAL CHAIN: involving Operations early prevents the month-five blockage", () => {
    const m7 = considered.history.find((h) => h.missionId === "m7");
    expect(m7?.outcomeId).toBe("m7-anchored");
    expect(considered.flags).toContain("ops_onside");

    const m10 = considered.history.find((h) => h.missionId === "m10");
    expect(m10?.outcomeId).toBe("m10-reset-trust");
  });

  it("surfaces the causal thread the player actually created", () => {
    const threads = causalThreads(discounter);
    expect(threads.length).toBeGreaterThan(0);
    const all = threads.map((t) => `${t.because} ${t.soLater}`).join(" ");
    expect(all).toContain("price");

    // A thread must never appear for a chain the player did not cause.
    const considered2 = causalThreads(considered);
    expect(considered2.some((t) => t.because.includes("met the client on price"))).toBe(false);
  });

  it("awards recognition only where it was earned", () => {
    expect(considered.badges.length).toBeGreaterThan(0);
    expect(reckless.badges).toHaveLength(0);
  });

  /**
   * The PRD is blunt about why this has to work: "Walking away must sometimes be a good
   * decision. Otherwise the game teaches: Always accept the contract." (p. 132)
   *
   * So the SAME action has to resolve two ways, decided entirely by the position the
   * player built. Both of these walk away at m9b; one is praised and one is not.
   */
  describe("walking away", () => {
    const walkFromBadDeal = playScript(content, [
      ["o-northwind"],
      ["ev-rivals", "ev-budget"],
      ["o-campaign"],
      ["o-pursue"],
      ["o-hold"],
      ["c-benchmark", "c-reference"],
      ["o-asked"],
      ["o-conventional"],
      ["c-journey", "c-platform", "c-pilot"],
      ["o-defend"],
      ["o-discount"],
      ["o-accept-risk"],
      ["o-walk"],
    ]);

    const walkFromGoodDeal = playScript(content, [
      ["o-northwind"],
      ["ev-pain", "ev-sponsor"],
      ["o-pov"],
      ["o-workshop"],
      ["o-reframe"],
      ["c-ops-workshop", "c-data-audit"],
      ["o-real"],
      ["o-outcome-deal"],
      ["c-ops", "c-training", "c-journey"],
      ["o-shore-deliver"],
      ["o-phase"],
      ["o-mitigate"],
      ["o-walk"],
    ]);

    it("ends the game there, skipping delivery entirely", () => {
      for (const s of [walkFromBadDeal, walkFromGoodDeal]) {
        expect(s.phase).toBe("ending");
        expect(s.history).toHaveLength(13);
        expect(s.flags).toContain("walked_away");
      }
    });

    it("is the right call on a deal that had gone bad", () => {
      const m9b = walkFromBadDeal.history.find((h) => h.missionId === "m9b");
      expect(m9b?.outcomeId).toBe("m9b-walk-right");
      expect(m9b?.tone).toBe("strong");
      expect(walkFromBadDeal.badges).toContain("held_nerve");
    });

    it("is the wrong call on a deal that was sound", () => {
      const m9b = walkFromGoodDeal.history.find((h) => h.missionId === "m9b");
      expect(m9b?.outcomeId).toBe("m9b-walk-wrong");
      expect(m9b?.tone).toBe("hard");
    });

    it("is named as a choice in the verdict, not as a loss", () => {
      expect(finalVerdict(walkFromBadDeal.dims, walkFromBadDeal.flags).title).toBe(
        "You walked away",
      );
    });
  });

  it("produces distinct verdicts across the outcome space", () => {
    const verdicts = new Set(
      [
        { win: 20, profit: 50, deliver: 50 },
        { win: 80, profit: 80, deliver: 20 },
        { win: 80, profit: 20, deliver: 80 },
        { win: 75, profit: 70, deliver: 70 },
        { win: 55, profit: 50, deliver: 48 },
      ].map((c) => finalVerdict(c).title),
    );
    expect(verdicts.size).toBeGreaterThanOrEqual(4);
  });
});

describe("no fake choices", () => {
  it("has no option that beats a sibling on all three dimensions in every case", () => {
    const findings = findDominantOptions(content);
    const readable = findings.map((f) => `${f.mission}: ${f.note}`);
    expect(readable).toEqual([]);
  });
});

describe("engine mechanics", () => {
  it("starts at the title, then at chapter 0", () => {
    const s0 = createInitialState(content);
    expect(s0.phase).toBe("title");
    const s1 = advance(s0, content);
    expect(s1.phase).toBe("setup");
  });

  it("takes a starting advantage before the first mission", () => {
    const s = pastSetup(content, "s-builder");
    expect(s.phase).toBe("decide");
    expect(s.flags).toContain("start:builder");
    expect(s.dims.deliver).toBeGreaterThan(50);
  });

  it("will not commit without a complete selection", () => {
    const s = pastSetup(content);
    const mission = getNode(content, s.nodeId);
    expect(isMission(mission)).toBe(true);
    // no selection made
    const attempted = playMission({ ...s, selection: [] }, content, []);
    expect(attempted.phase).toBe("decide");
  });

  it("records one history entry per completed mission", () => {
    let s = pastSetup(content);
    let guard = 0;
    while (isMission(getNode(content, s.nodeId)) && guard++ < 50) {
      const mission = getNode(content, s.nodeId);
      if (!isMission(mission)) break;
      const selection = possibleSelections(mission, s)[0];
      if (!selection) break;
      s = playMission(s, content, selection);
    }
    expect(s.history).toHaveLength(16);
    expect(s.phase).toBe("ending");
  });
});
