/**
 * Can the sweep survive a condition that reads a meter?
 *
 * Backlog 1.3 wants a dimension gate in content, and the sequencing note says why it
 * cannot simply be added: "1.3 needs the decile bucketing in `stateKey` or the sweep
 * silently stops being exhaustive." The bucketing exists and, until this ran, had never
 * been exercised by anything, because no content gates on a meter.
 *
 * So this clones the content, adds one gate, and sweeps it three ways:
 *
 *   · **default (ten-point buckets)** — does coverage stay complete?
 *   · **`dimBucket: Infinity`** — the pre-bucketing key, dimensions dropped. The control.
 *     If coverage survives THIS, the bucketing is decoration and the proof is worthless.
 *   · and it reports the state-count growth, which is what the gate actually costs.
 *
 *   npx vite-node tools/gate-proof.mjs               # min.win 60 on the last choice beat
 *   npx vite-node tools/gate-proof.mjs --floor 70
 *   npx vite-node tools/gate-proof.mjs --two         # add a second gated meter, and time it
 *
 * A tool rather than a test, for two reasons. It is ~31s of unbroken synchronous CPU and a
 * gigabyte of frontier, and `vitest` runs its files in competing workers against a 60s RPC
 * timeout hardcoded in birpc — three failures in this repo have that shape. And it is not a
 * standing invariant: it measures what WOULD happen to content that does not exist yet. The
 * day a real gate lands, `analysis.test.ts`'s "fires every authored outcome on some path"
 * becomes this test, on the real content, for free. The mechanism — that two states which
 * branch differently do not collapse, and where that stops being true — is proven on small
 * fixtures in `src/engine/gated.test.ts`, which runs in 59ms.
 */

import { story } from "../src/content/story";
import { sweep } from "../src/engine/analysis";
import { isMission } from "../src/engine/types";

const args = process.argv.slice(2);
const floorArg = args.indexOf("--floor");
const FLOOR = floorArg >= 0 ? Number(args[floorArg + 1]) : 60;
const TWO = args.includes("--two");

/** Every outcome id the content declares — the yardstick for "complete coverage". */
function authoredOutcomes(c) {
  const out = [];
  for (const node of Object.values(c.nodes)) {
    if (!isMission(node)) continue;
    const list = node.kind === "choice" ? node.options.flatMap((o) => o.outcomes) : node.outcomes;
    for (const o of list) out.push(o.id);
  }
  return out;
}

/**
 * Add a gated DUPLICATE of an existing outcome, ahead of it.
 *
 * The pair is identical in every way except the condition, which is what makes this a
 * measurement: both are reachable from exactly the same selection, so the only thing that
 * can decide between them is the meter. If a walk reports either as dead, its key lost a
 * state — there is no other explanation available.
 */
function addGate(c, dim, boundary, which, fromEnd = 0) {
  const clone = JSON.parse(JSON.stringify(c));
  let seen = 0;
  for (let i = clone.missionOrder.length - 1; i >= 0; i--) {
    const node = clone.nodes[clone.missionOrder[i]];
    if (!node || !isMission(node) || node.kind !== "choice") continue;
    if (seen++ < fromEnd) continue;
    const option = node.options[0];
    const sibling = option?.outcomes[0];
    if (!option || !sibling) continue;
    const gated = {
      ...sibling,
      id: `${sibling.id}-gated`,
      when: which === "min" ? { min: { [dim]: boundary } } : { max: { [dim]: boundary } },
    };
    option.outcomes.unshift(gated);
    return { content: clone, gatedId: gated.id, siblingId: sibling.id, missionId: node.id };
  }
  throw new Error("no choice mission available to gate");
}

const total = (byMission) =>
  Object.values(byMission).reduce((a, b) => a + b, 0);

function run(label, c, dimBucket) {
  const t0 = Date.now();
  const result = sweep(c, dimBucket === undefined ? {} : { dimBucket });
  const ms = Date.now() - t0;
  const dead = authoredOutcomes(c).filter((id) => !result.firedOutcomes.has(id));
  console.log(
    `\n${label}\n` +
      `  ${ms}ms · ${total(result.statesAtMission)} states · ${result.endings} endings · ` +
      `${result.firedOutcomes.size} outcomes fired · ${Math.round(process.memoryUsage().heapUsed / 1e6)}MB heap`,
  );
  console.log(`  biggest single mission: ${Math.max(...Object.values(result.statesAtMission))} (MAX_FRONTIER is 600,000)`);
  console.log(
    dead.length
      ? `  ✗ reports ${dead.length} reachable outcome(s) as DEAD CONTENT: ${dead.join(", ")}`
      : `  ✓ every authored outcome fired`,
  );
  return { result, dead, ms };
}

console.log(`\nUNGATED — today's content, for the growth figure`);
const before = run("baseline", story);

const gate = addGate(story, "win", FLOOR, "min");
console.log(
  `\nGATE: min.win ${FLOOR} on ${gate.missionId}, as a duplicate of ${gate.siblingId} —` +
    ` the pair differs only by the condition`,
);
const gated = run("default key (ten-point buckets)", gate.content);
console.log(
  `  growth: ×${(total(gated.result.statesAtMission) / total(before.result.statesAtMission)).toFixed(2)} states,` +
    ` ×${(gated.ms / Math.max(1, before.ms)).toFixed(1)} time`,
);
console.log(
  `  both sides of the gate fired: ${gated.result.firedOutcomes.has(gate.gatedId)} (gated) /` +
    ` ${gated.result.firedOutcomes.has(gate.siblingId)} (ungated sibling)`,
);

const control = run("CONTROL — dimensions dropped from the key, as before bucketing", gate.content, Infinity);
console.log(
  control.dead.length
    ? `  → the bucketing is doing real work: without it, ${control.dead.length} reachable outcome(s) look dead`
    : `  → the control lost nothing, so THIS GATE PROVES NOTHING. Move the gate or change the floor.`,
);

if (TWO) {
  const second = addGate(gate.content, "deliver", 39, "max", 1);
  console.log(`\nSECOND GATE: max.deliver 39 on ${second.missionId}, on top of the first`);
  run("two gated meters, default key", second.content);
}

console.log(
  `\nWhat this does NOT prove: bucketing is not exact. Two states in one bucket agree on` +
    `\nevery threshold now and can drift apart later — 50 and 59 are one state, and after a` +
    `\nshared +5 they sit either side of a gate at 60. The error runs one way only (a lost` +
    `\nbranch, never an invented one), so it surfaces as dead content rather than as a quiet` +
    `\npass. See src/engine/gated.test.ts for that case, worked.\n`,
);
