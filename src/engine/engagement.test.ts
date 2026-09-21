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
   * The clause that now PASSES, and it is the one the panel cared most about.
   *
   * Uniform-random play used to be told "A deal worth having" 58% of the time — the best
   * ending in the game, as the modal outcome of pressing buttons. It is now told "You
   * walked away", and the best verdict's share has fallen to about a fifth.
   *
   * Two changes did that, and the cheaper one did most of the work. `finalVerdict`'s top
   * branch was `avg >= 62`, an average — so 100 / 45 / 45 averaged 63 and was congratulated
   * while its margin and deliverability sat a coin-flip from the failure branches. It now
   * requires the WORST meter to clear 58, which is a lower bar per meter and a far harder
   * one to clear on all three. Separately, positive Winability and Deliverability deltas
   * were scaled by 0.65 — profit deliberately untouched, since it is the only meter that
   * ever reaches the floor and uniform scaling pays for winability out of margin.
   */
  it("no longer tells a coin-flipper it did well", () => {
    const share = (title: string) => (report.nullPlayer.verdicts[title] ?? 0) / report.nullPlayer.runs;
    const modal = Object.entries(report.nullPlayer.verdicts).sort((a, b) => b[1] - a[1])[0];
    expect(modal?.[0], "the modal verdict for random play is the best one").not.toBe(
      "A deal worth having",
    );
    expect(share("A deal worth having")).toBeLessThan(0.4);
  }, 120_000);

  /**
   * What is still failing, pinned to today's measurements rather than to the target.
   *
   * The panel's remaining bars: no fixed non-reader policy reaches the top verdict, and
   * the engagement premium — best informed play minus best uninformed play — is at least
   * 12 points. Both are still open.
   *
   * Pinning the failure rather than asserting the target is deliberate. An aspirational
   * threshold in a red suite gets skipped within a week, and D-038 records what happens
   * when a band is quietly retuned until the build passes instead.
   */
  it("is currently failing, by these exact numbers", () => {
    /*
     * TARGET: 0. 12 → 14 → 13 → 3, and the shape of that is the story.
     *
     * The losable award beat took it UP, because three of the eighteen non-reader runs now
     * lose outright while the survivors collect m9a's winning deltas. The economy work
     * then took it down hard, and almost all of that came from one line: requiring the
     * worst meter to clear 58 instead of the average to clear 62.
     *
     * The last three are the `meter-greedy` policy, one per starting advantage — which is
     * to say a second playthrough, optimising the numbers it can see. That is the honest
     * residue, and it closes on the engagement premium below rather than on this clause.
     */
    const topVerdictReachedBy = report.nonReaders.filter(
      (r) => r.verdict === "A deal worth having",
    ).length;
    expect(topVerdictReachedBy).toBe(3);

    // The award beat is doing its job on the policies that never differentiate.
    const lostTheAward = report.nonReaders.filter(
      (r) => r.verdict === "They chose someone else",
    ).length;
    expect(lostTheAward).toBe(3);

    /*
     * 6 → 7 → 6, and the last step is a SAMPLE SIZE rather than a regression. Worth
     * reading before anybody "fixes" it.
     *
     * Every verdict in the game is reachable without reading, "You did not win the work"
     * included. At this sample of 300 it was reaching that one on exactly ONE run, so the
     * seventh entry was riding on a single playthrough. Adding the chapter-five handover
     * shifted every random draw after mission 16 by one, which is enough to move that one
     * run off the boundary — it does not move the property. Measured directly, over 3,000
     * runs of the same generator: 13 of 3,000 before the handover, 11 of 3,000 after, so
     * 0.43% became 0.37% and the ending is as alive as it ever was.
     *
     * The honest reading is that a verdict firing on 0.4% of random play is inside this
     * sample's noise either way, and a count of DISTINCT verdicts over 300 runs cannot
     * resolve it. `nullPlayer.verdicts` is the number to look at, and the clause that
     * matters — a thoughtless player is not congratulated — is asserted above and passes.
     */
    expect(report.verdictsWithoutReading).toHaveLength(6);

    // TARGET: best non-reader well below 88. Today it is the ceiling.
    expect(report.bestNonReader).toBe(100);

    /* This clause has moved out of here and into the passing test above. */
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
