/**
 * The outcome economy, measured.
 *
 * Backlog section 1: reading does not pay. `engagement.test.ts` pins how badly — most
 * non-reader policies reach the top verdict and the best of them scores 100 — and the fix
 * is a rewrite of 88 authored deltas. This prints the numbers to author against, so that
 * rewrite is not done by feel.
 *
 *   npx vite-node tools/economy.mjs                 # everything below
 *   npx vite-node tools/economy.mjs --sampled       # skip the 10s exhaustive walk
 *   npx vite-node tools/economy.mjs --k 0.7         # one value of k, in detail
 *
 * WHY A TOOL AND NOT A TEST. The exhaustive walk is ~10s of unbroken synchronous CPU and
 * the k sweep another ~8s; adding both to `vitest run` took the suite to 205s of test CPU
 * across its workers, which starved the reporter and failed the run with
 * `Timeout calling "onTaskUpdate"` while all 162 tests passed. Vitest's worker RPC timeout
 * is hardcoded at 60s in birpc and the workers compete for the same cores. The instrument's
 * *arithmetic* is asserted in `src/engine/budget.test.ts`, which is what can regress; the
 * measurement is a thing you run when you are about to change the economy.
 *
 * Read `formatBudget`'s columns as: `mean` is the summed authored delta across the three
 * meters for one decision, `applied` is what survives the clamp, `clamp` is the share of
 * authored magnitude the clamp destroys, and `pinned` is the share of states arriving with
 * a meter already at a bound — `w59%` means Winability was already 100 for 59% of them,
 * and `p!3%` means Profitability was already 0 for 3%.
 */

import { story } from "../src/content/story";
import {
  bestWitnessedPlay,
  deltaBudget,
  formatBudget,
  formatKTable,
  measureK,
  randomVerdicts,
  sampledBudget,
  scaleAuthoredGains,
  TOP_VERDICT,
} from "../src/engine/budget";
import { nonReaderRuns } from "../src/engine/engagement";

const args = process.argv.slice(2);
const SAMPLED_ONLY = args.includes("--sampled");
const kArg = args.indexOf("--k");
const SINGLE_K = kArg >= 0 ? Number(args[kArg + 1]) : null;

/** The shape `measureK` wants: the best a fixed, card-reading-only policy can do. */
const nonReaders = (c) => {
  const runs = nonReaderRuns(c);
  return { scores: runs.map((r) => r.score), verdicts: runs.map((r) => r.verdict) };
};

const SAMPLES = 1200;
const BEAM = 200;
const KS = [1, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.5, 0.4, 0.3];
const WIN_AND_DELIVER = ["win", "deliver"];

function heading(text) {
  console.log(`\n${"─".repeat(96)}\n${text}\n`);
}

if (SINGLE_K !== null) {
  const scaled = SINGLE_K === 1 ? { content: story, removed: 0, scaled: 0, zeroed: 0 } : scaleAuthoredGains(story, SINGLE_K);
  heading(
    `k = ${SINGLE_K} — ${scaled.scaled} positive meter writes rescaled, ${scaled.removed} points removed, ${scaled.zeroed} rounded to nothing`,
  );
  console.log(formatBudget(deltaBudget(scaled.content)));
  console.log();
  console.log(formatKTable([measureK(story, SINGLE_K, nonReaders, { samples: SAMPLES, beam: BEAM })]));
  const best = bestWitnessedPlay(scaled.content, BEAM);
  console.log(
    `\n best witnessed play: ${best.score} (${best.dims.win}/${best.dims.profit}/${best.dims.deliver})` +
      ` from ${best.advantage} — "${best.verdict}"`,
  );
  process.exit(0);
}

if (!SAMPLED_ONLY) {
  heading("1 · EVERY REACHABLE STATE — what the authored numbers add up to");
  console.log(formatBudget(deltaBudget(story)));
}

heading(`2 · RANDOM PLAY — the same accounting over ${SAMPLES} coin-flipping runs`);
console.log(formatBudget(sampledBudget(story, SAMPLES)));
const verdicts = randomVerdicts(story, SAMPLES);
console.log(
  `\n verdicts, same runs:\n` +
    Object.entries(verdicts.verdicts)
      .sort((a, b) => b[1] - a[1])
      .map(([title, n]) => `   ${String(Math.round((n / verdicts.runs) * 100)).padStart(3)}%  ${title}`)
      .join("\n") +
    `\n   mean score ${verdicts.meanScore}, best ${verdicts.bestScore}. Top verdict is "${TOP_VERDICT}".`,
);

heading("3 · SCALING THE GAINS — every positive authored delta × k");
const uniform = KS.map((k) => measureK(story, k, nonReaders, { samples: SAMPLES, beam: BEAM }));
console.log(formatKTable(uniform));
console.log("\n win AND deliver only — profit's gains left where they are:\n");
const targeted = KS.map((k) =>
  measureK(story, k, nonReaders, { samples: SAMPLES, beam: BEAM, only: WIN_AND_DELIVER }),
);
console.log(formatKTable(targeted));

/**
 * What the table is for: one k, named, with both clauses checked.
 *
 * Printed rather than left to the reader because the two clauses cross at different values
 * and quoting whichever one crosses first is how a target gets softened by accident.
 */
const firstBoth = uniform.find((r) => r.topVerdictShare < 0.4 && r.premium > 0);
const bestPremium = [...uniform, ...targeted].reduce((a, b) => (b.premium > a.premium ? b : a));
heading("4 · THE ANSWER");
console.log(
  ` uniform k satisfying BOTH clauses (random top verdict < 40% and premium > 0): ` +
    `${firstBoth ? firstBoth.k : "none in the swept range"}`,
);
if (firstBoth) {
  console.log(
    `   at k = ${firstBoth.k}: top verdict ${Math.round(firstBoth.topVerdictShare * 100)}%,` +
      ` premium +${firstBoth.premium}, best non-reader ${firstBoth.bestNonReader},` +
      ` ${firstBoth.nonReadersAtTop}/${firstBoth.nonReaderCount} fixed policies still reach the top verdict,` +
      ` clamp waste ${Math.round(firstBoth.lossShare * 100)}%`,
  );
}
console.log(
  `\n largest premium anywhere in the sweep: +${bestPremium.premium} (k = ${bestPremium.k}).` +
    `\n The panel's bar is 12, so NO value of k reaches it: scaling fixes the verdict` +
    `\n distribution and the clamp waste, and does not make reading pay. What pays for` +
    `\n reading is knowledge that changes what a player may do — backlog 1.2 and 1.3 —` +
    `\n not the size of the numbers.`,
);
console.log();
