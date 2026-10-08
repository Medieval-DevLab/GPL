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
 *
 * Re-measured on the eight-decision story (D-086). Every number pinned below is today's,
 * and each says what it is a measurement of; none was tuned to pass.
 */

import { describe, expect, it } from "vitest";

import { story } from "../content/story";
import { playScript } from "./analysis";
import { bestWitnessedPlay, topVerdict } from "./budget";
import { finalVerdict } from "./engine";
import { engagementReport } from "./engagement";

const content = story;
const TOP = topVerdict(content);

describe("the engagement gate", () => {
  const report = engagementReport(content, 300);

  it("reports what a player who reads nothing achieves", () => {
    const rows = report.nonReaders
      .map(
        (r) =>
          `  ${r.policy.padEnd(14)} ${String(r.score).padStart(3)}  ` +
          `${r.dims.win}/${r.dims.profit}/${r.dims.deliver}  ${r.badges} badges  ${r.verdict}`,
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
   * The clause the panel cared most about, and it passes.
   *
   * The top ending is "We kept our promises, and it paid". Uniform-random play reaches it on
   * about one run in twenty, and is most often told that Orion chose the cheaper firm: a
   * coin-flipper offers an app or a screen about as often as not, and an offer the rival can
   * match is decided on price.
   */
  it("no longer tells a coin-flipper it did well", () => {
    const share = (title: string) => (report.nullPlayer.verdicts[title] ?? 0) / report.nullPlayer.runs;
    const modal = Object.entries(report.nullPlayer.verdicts).sort((a, b) => b[1] - a[1])[0];
    expect(modal?.[0], "the modal verdict for random play is the best one").not.toBe(TOP);
    expect(share(TOP)).toBeLessThan(0.4);
  }, 120_000);

  /**
   * The second of the panel's bars, and since D-086 it passes too: no fixed non-reader policy
   * reaches the top ending. `meter-greedy` — a second playthrough, optimising the numbers it
   * can see — comes closest and still lands on "paid for it", because the team's weekends
   * cost nothing on the meters it is reading and everything on the ending.
   *
   * Reading pays in the ending, which is the claim that matters: the considered run, which
   * reads the situation at every decision, reaches the top ending that no fixed policy does.
   */
  it("keeps the top ending out of reach of every fixed non-reader policy, and within reach of reading", () => {
    expect(report.nonReaders.filter((r) => r.verdict === TOP)).toEqual([]);
    const considered = playScript(
      content,
      [
        ["d1-delivery", "d1-complaints"],
        ["d2-found", "d2-marcus"],
        ["d3-two", "d3-paid"],
        ["d4-reframe", "d4-figures"],
        ["d5-after-sale", "d5-month-five", "d5-by-day"],
        ["d6-half", "d6-drop-nothing", "d6-ops-lead"],
        ["d7-no-late-fee", "d7-sign"],
        ["d8-tell", "d8-contractors"],
      ],
      "s-connector",
    );
    expect(finalVerdict(considered.dims, considered.flags, content).title).toBe(TOP);
  }, 120_000);

  /**
   * What is still failing, pinned to today's measurements rather than to the target.
   *
   * The panel's remaining bar: the engagement premium — best informed play minus best
   * uninformed play, on the mean of the meters — is at least 12 points. It is not: the best
   * non-reader scores 72 and a 24-wide beam of informed play also scores 72. The meters no
   * longer tell the endings apart; the endings do the discriminating (above). Pinning the
   * failure rather than asserting the target is deliberate: an aspirational threshold in a
   * red suite gets skipped within a week, and D-038 records what happens when a band is
   * quietly retuned until the build passes instead.
   */
  it("is currently failing, by these exact numbers", () => {
    // TARGET: well below 88. It is 72: meter-greedy, starting as the Challengers.
    expect(report.bestNonReader).toBe(72);

    // TARGET: a premium of 12 or more. Today it is nothing.
    const informed = bestWitnessedPlay(content, 24).score;
    expect(informed - report.bestNonReader).toBe(0);

    /*
     * Twelve of the eighteen fixed-policy runs lose the award. `cheapest` and `dearest` read
     * only an option's cost pips, which a lever setting does not carry, so on this story they
     * play exactly as `always-first` does — a policy that names its own leak, here naming
     * that there is none to read.
     */
    expect(report.nonReaders.filter((r) => r.verdict === "Orion chose the cheaper firm")).toHaveLength(12);

    /* Every ending title is reachable without reading: six titles over eight endings. */
    expect(report.verdictsWithoutReading).toHaveLength(6);
  }, 120_000);
});
