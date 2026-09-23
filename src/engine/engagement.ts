/**
 * Does the game reward reading it?
 *
 * Nine reviewers audited the build independently and converged on one defect: the
 * read-outs cannot distinguish a thinking player from someone clicking. Two of them
 * proposed a gate for it, then each deferred to the other's version — which is the right
 * answer, because they are one instrument pointed at two different adversaries:
 *
 *   · the NULL PLAYER chooses uniformly at random. A floor: it says whether the game is
 *     simply too generous, and it is the limiting case of every policy below.
 *   · a NON-READER follows a fixed rule — always the first option, always the cheapest,
 *     always whatever moves the meters most. This is the realistic adversary, because it
 *     models a bored human and a second playthrough, and each policy *names its own leak*:
 *     if `cheapest` scores well, the cost pips are giving the answer away.
 *
 * The number that matters is the **engagement premium**: how much better the best
 * informed play is than the best uninformed play. If it is zero or negative, the prose is
 * decoration and every other finding in the audit is a proposal to improve decoration.
 *
 * Pure and deterministic — the random policy uses a seeded generator, so a failure is
 * reproducible from its seed. No `Math.random` anywhere in `src/engine`.
 */

import { finalVerdict, getNode, scoreOf } from "./engine";
import { pastSetup, playMission, possibleSelections } from "./analysis";
import {
  DIMENSIONS,
  isMission,
  type Content,
  type DimensionId,
  type GameState,
  type Mission,
} from "./types";

/* ───────────────────────────── policies ───────────────────────────── */

/**
 * A policy picks one selection from those legally available, knowing only what is on the
 * card. None of them may read `situation`, `assessment`, the client's words, the ledger
 * or the advisor — that is the whole point.
 */
export interface Policy {
  id: string;
  /** what a player following it has understood about the game, in a few words */
  reads: string;
  pick: (options: string[][], mission: Mission, state: GameState, rng: () => number) => string[];
}

/**
 * Deterministic 32-bit PRNG (mulberry32). Seeded, so any failure replays exactly.
 *
 * Exported for `budget.ts`, which samples random play to measure the delta economy, so
 * that the two instruments draw from the same stream given the same seed and a divergence
 * between them is a real difference rather than two different coins. `analysis.test.ts`
 * and `runcode.test.ts` each carry their own copy; those are tests sampling their own
 * space, and a test that borrows the subject's randomness is testing itself.
 */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Total resource cost of a selection, the one fully legible number on the card. */
function costOf(mission: Mission, selection: string[]): number {
  if (mission.kind !== "choice") return 0;
  let total = 0;
  for (const id of selection) {
    const option = mission.options.find((o) => o.id === id);
    if (option?.cost) total += option.cost.time + option.cost.investment;
  }
  return total;
}

export const NON_READER_POLICIES: Policy[] = [
  {
    id: "always-first",
    reads: "nothing; takes whatever is at the top",
    pick: (options) => options[0] as string[],
  },
  {
    id: "always-last",
    reads: "nothing; takes whatever is at the bottom",
    pick: (options) => options[options.length - 1] as string[],
  },
  {
    id: "always-middle",
    reads: "nothing; splits the difference every time",
    pick: (options) => options[Math.floor(options.length / 2)] as string[],
  },
  {
    id: "cheapest",
    reads: "only the resource-cost pips, and minimises them",
    pick: (options, mission) =>
      [...options].sort((a, b) => costOf(mission, a) - costOf(mission, b))[0] as string[],
  },
  {
    id: "dearest",
    reads: "only the resource-cost pips, and maximises them",
    pick: (options, mission) =>
      [...options].sort((a, b) => costOf(mission, b) - costOf(mission, a))[0] as string[],
  },
  {
    id: "meter-greedy",
    reads: "the meters, one move ahead — a second playthrough",
    pick: (options, mission, state) => {
      let best = options[0] as string[];
      let bestScore = -Infinity;
      for (const selection of options) {
        const after = playMission(state, contentOf(state), selection);
        const score = DIMENSIONS.reduce((total, d) => total + after.dims[d], 0);
        if (score > bestScore) {
          bestScore = score;
          best = selection;
        }
      }
      void mission;
      return best;
    },
  },
];

/**
 * `meter-greedy` has to look one move ahead, which needs the content. Threading it
 * through every policy signature to serve one of them is worse than this: the harness
 * stashes it for the duration of a run, and it is never observable outside this module.
 */
let activeContent: Content | null = null;
function contentOf(_state: GameState): Content {
  if (!activeContent) throw new Error("engagement: no active content");
  return activeContent;
}

export const NULL_PLAYER: Policy = {
  id: "uniform-random",
  reads: "nothing at all; chooses uniformly",
  pick: (options, _m, _s, rng) => options[Math.floor(rng() * options.length)] as string[],
};

/* ───────────────────────────── running them ───────────────────────────── */

export interface PolicyResult {
  policy: string;
  reads: string;
  dims: Record<DimensionId, number>;
  /** mean of the three meters — the number the top bar shows */
  score: number;
  verdict: string;
  badges: number;
  threads: number;
}

/** Play one policy to the end, measuring actual outcomes only. */
export function runPolicy(
  content: Content,
  policy: Policy,
  advantage: string | undefined,
  seed: number,
): PolicyResult {
  activeContent = content;
  try {
    const rng = seeded(seed);
    let s = pastSetup(content, advantage);
    let guard = 0;

    while (isMission(getNode(content, s.nodeId)) && guard++ < 40) {
      const mission = getNode(content, s.nodeId);
      if (!isMission(mission)) break;
      const legal = possibleSelections(mission, s);
      if (legal.length === 0) break;
      const selection = policy.pick(legal, mission, s, rng);
      s = playMission(s, content, selection);
    }

    const verdict = finalVerdict(s.dims, s.flags);
    return {
      policy: policy.id,
      reads: policy.reads,
      dims: s.dims,
      score: scoreOf(s.dims),
      verdict: verdict.title,
      badges: s.badges.length,
      threads: 0,
    };
  } finally {
    activeContent = null;
  }
}

export interface EngagementReport {
  /** every fixed policy, across every starting advantage */
  nonReaders: PolicyResult[];
  /** the uniform-random floor, sampled */
  nullPlayer: { runs: number; meanScore: number; verdicts: Record<string, number>; meanBadges: number };
  /** the best score any non-reader achieved */
  bestNonReader: number;
  /** verdict titles reachable without reading anything */
  verdictsWithoutReading: string[];
}

/**
 * Every fixed policy, across every starting advantage. Deterministic, and cheap.
 *
 * Separated from `engagementReport` because `budget.ts` needs exactly this — the best a
 * non-reader can do — once per value of k, and the random floor beside it costs three
 * hundred playthroughs it does not need. Reusing the function rather than copying the loop
 * means the "best non-reader" in the k table is the same population as the one the
 * engagement gate fails on, which is the only way the two numbers can be compared.
 */
export function nonReaderRuns(content: Content): PolicyResult[] {
  const advantages = setupOptionIds(content);
  const results: PolicyResult[] = [];
  for (const policy of NON_READER_POLICIES) {
    for (const advantage of advantages) {
      results.push(runPolicy(content, policy, advantage, 1));
    }
  }
  return results;
}

/**
 * The full report. `samples` controls only the random floor; the fixed policies are
 * deterministic and run once per starting advantage.
 */
export function engagementReport(content: Content, samples = 400): EngagementReport {
  const advantages = setupOptionIds(content);
  const nonReaders = nonReaderRuns(content);

  const verdicts: Record<string, number> = {};
  let totalScore = 0;
  let totalBadges = 0;
  for (let i = 0; i < samples; i++) {
    const advantage = advantages[i % advantages.length];
    const r = runPolicy(content, NULL_PLAYER, advantage, i + 1);
    verdicts[r.verdict] = (verdicts[r.verdict] ?? 0) + 1;
    totalScore += r.score;
    totalBadges += r.badges;
  }

  const bestNonReader = Math.max(...nonReaders.map((r) => r.score));
  const reachable = new Set<string>(nonReaders.map((r) => r.verdict));
  for (const title of Object.keys(verdicts)) reachable.add(title);

  return {
    nonReaders,
    nullPlayer: {
      runs: samples,
      meanScore: Math.round(totalScore / samples),
      verdicts,
      meanBadges: +(totalBadges / samples).toFixed(2),
    },
    bestNonReader,
    verdictsWithoutReading: [...reachable].sort(),
  };
}

function setupOptionIds(content: Content): (string | undefined)[] {
  for (const node of Object.values(content.nodes)) {
    if (node.kind === "setup") return node.options.map((o) => o.id);
  }
  return [undefined];
}
