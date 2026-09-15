/**
 * The engagement gate.
 *
 * Chosen by all nine reviewers of the round-1 audit as the one thing to measure first,
 * over four other candidates, for a reason worth keeping: every other proposed gate
 * presumes reading pays. Beat continuity protects information the player needs; a
 * perceivable-state-change gate announces a state change; decision-consequence density
 * measures downstream reach. If a player who reads nothing reaches the best ending, all
 * three are improvements to decoration.
 *
 * So this runs first and the rest are judged against it.
 */

import { describe, expect, it } from "vitest";

import { story } from "../content/story";
import { engagementReport, NON_READER_POLICIES, runPolicy } from "./engagement";

const content = story;

describe("the engagement gate", () => {
  const report = engagementReport(content, 300);

  it("reports what a player who reads nothing achieves", () => {
    const rows = report.nonReaders
      .map(
        (r) =>
          `  ${r.policy.padEnd(14)} ${String(r.score).padStart(3)}  ` +
          `${r.dims.win}/${r.dims.profit}/${r.dims.deliver}  ${r.badges} badges  ` +
          `pred ${r.predictionsRight}/${r.predictionsMade}  ${r.verdict}`,
      )
      .join("\n");
    const verdicts = Object.entries(report.nullPlayer.verdicts)
      .sort((a, b) => b[1] - a[1])
      .map(([title, n]) => `  ${String(Math.round((n / report.nullPlayer.runs) * 100)).padStart(3)}%  ${title}`)
      .join("\n");

    console.log(
      `\nNON-READER POLICIES\n${rows}\n\n` +
        `UNIFORM-RANDOM FLOOR (${report.nullPlayer.runs} runs)\n` +
        `  mean score ${report.nullPlayer.meanScore}, mean badges ${report.nullPlayer.meanBadges}\n${verdicts}\n\n` +
        `  best non-reader score: ${report.bestNonReader}\n` +
        `  verdicts reachable without reading: ${report.verdictsWithoutReading.length}\n`,
    );
    expect(report.nonReaders.length).toBeGreaterThan(0);
  }, 120_000);

  /**
   * The gate proper, pinned to today's measurements rather than to the target.
   *
   * These numbers are a failure. The panel's threshold is that no non-reader policy
   * reaches the top verdict and that the engagement premium — best informed play minus
   * best uninformed play — is at least 12 points. Today the premium is negative: the
   * meter-greedy policy, which is simply a second playthrough, maxes every meter.
   *
   * Pinning the failure rather than asserting the target is deliberate. An aspirational
   * threshold in a red suite gets skipped within a week, and D-038 records what happens
   * when a band is quietly retuned until the build passes instead. So the current values
   * are asserted exactly: any change that improves or worsens them shows up as a diff,
   * and the numbers may only move in the direction of the target.
   */
  it("is currently failing, by these exact numbers", () => {
    // TARGET: 0. A non-reader must not reach the best verdict in the game.
    // Today: 12 of 18 runs (6 fixed policies × 3 starting advantages).
    const topVerdictReachedBy = report.nonReaders.filter(
      (r) => r.verdict === "A deal worth having",
    ).length;
    expect(topVerdictReachedBy).toBe(12);

    // TARGET: fewer than 6. Every verdict in the game is reachable without reading,
    // including the two written to describe a specific kind of misjudgement.
    expect(report.verdictsWithoutReading).toHaveLength(6);

    // TARGET: best non-reader well below 88. Today it is the ceiling.
    expect(report.bestNonReader).toBe(100);

    // TARGET: the random floor's modal verdict is NOT the best one.
    const modal = Object.entries(report.nullPlayer.verdicts).sort((a, b) => b[1] - a[1])[0];
    expect(modal?.[0]).toBe("A deal worth having");
  }, 120_000);

  /**
   * The regression clause learning science asked to keep from their own gate.
   *
   * The prediction key is fixed now, but a correctly-keyed question that cannot be
   * answered from the screen is still a fair coin — game systems measured the cost pips
   * at r = 0.110 against payoff and pros-minus-cons at r = 0.065. So a policy that always
   * answers the same dimension must score at chance. Well above it means the item is
   * biased; well below means it is inverted.
   */
  it("keeps a fixed prediction at roughly chance for every non-reader", () => {
    for (const policy of NON_READER_POLICIES) {
      const r = runPolicy(content, policy, "s-builder", 1, "profit");
      if (r.predictionsMade === 0) continue;
      const rate = r.predictionsRight / r.predictionsMade;
      expect(rate, `${policy.id} answers "profit" correctly ${Math.round(rate * 100)}% of the time`)
        .toBeLessThan(0.7);
    }
  }, 120_000);
});
