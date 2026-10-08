/**
 * The comprehension meter (D-087). Measures, from the content itself, what the cold newcomer
 * audit counted by hand. The targets come from docs/STRATEGY.md and the learning research
 * behind it (Cowan 2001; Mayer 2021; Heath & Heath 2007):
 *
 *   words a player reads per decision    ≤ 150 on average (audit of v1: 272)
 *   distinct takeaways                   ≤ 4, the four ideas, word for word (v1: 53)
 *   decisions                            8, two per act (v1: 18)
 *   people named before they matter      every one introduced in their first line
 *
 * Run: node tools/comprehension.mjs [--strict]
 * With --strict it exits 1 when a target is missed, so it can sit in the release gate.
 */
import { build } from "esbuild";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const strict = process.argv.includes("--strict");
const dir = await mkdtemp(path.join(tmpdir(), "gpl-comprehension-"));
const entry = path.join(dir, "entry.ts");
await writeFile(entry, `export { story } from ${JSON.stringify(path.resolve("src/content/story.ts"))};`);
const out = path.join(dir, "story.mjs");
await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile: out, logLevel: "error" });
const { story } = await import(pathToFileURL(out).href);
await rm(dir, { recursive: true, force: true });

const words = s => (s ?? "").split(/\s+/).filter(Boolean).length;
const first = x => typeof x === "string" ? x : Array.isArray(x) ? (x.find(l => !l.when) ?? x.at(-1))?.text ?? "" : "";

/** What a player reads to make one decision and learn from it, on its most common path. */
function readLoad(m) {
  const situation = words((m.situation ?? []).join(" "));
  const quote = words((m.saidQuote ?? (m.quotes ?? []).find(q => !q.when) ?? {}).text);
  let choices = 0, outcomes = [];
  if (m.kind === "choice") {
    for (const o of m.options) choices += words(o.title) + words(o.description) + words((o.pros ?? []).join(" ")) + words((o.cons ?? []).join(" "));
    outcomes = m.options.flatMap(o => o.outcomes);
  } else if (m.kind === "levers") {
    for (const l of m.levers) { choices += words(l.label); for (const o of l.options) choices += words(o.label) + words(o.detail); }
    outcomes = m.outcomes;
  } else {
    for (const e of m.evidence ?? m.components ?? []) choices += words(e.label ?? e.title) + words(e.question ?? e.description);
    outcomes = m.outcomes;
  }
  const avgOutcome = outcomes.length ? outcomes.reduce((n, o) => n + words(o.headline) + words(o.detail) + words(o.lesson?.because ?? m.lesson?.because), 0) / outcomes.length : 0;
  return { situation, quote, choices, outcome: Math.round(avgOutcome), principle: words(m.lesson?.principle), total: Math.round(situation + quote + choices + avgOutcome + words(m.lesson?.principle)) };
}

const missions = story.missionOrder.map(id => ({ id, ...story.nodes[id] }));
const loads = missions.map(m => ({ id: m.id, ...readLoad(m) }));
const avg = Math.round(loads.reduce((n, l) => n + l.total, 0) / loads.length);
const max = loads.reduce((a, b) => (b.total > a.total ? b : a));
const principles = new Set(missions.flatMap(m => [m.lesson?.principle, ...(m.kind === "choice" ? m.options.flatMap(o => o.outcomes) : m.outcomes ?? []).map(o => o.lesson?.principle)]).filter(Boolean));
const byAct = story.chapters.map(c => ({ act: c.number, decisions: c.missionIds.length }));
const levers = missions.filter(m => m.kind === "levers").length;

const rows = [
  ["Decisions", missions.length, "8", missions.length <= 8],
  ["Lever decisions", levers, "all", levers === missions.length],
  ["Words a player reads per decision (average)", avg, "≤ 150", avg <= 150],
  ["Heaviest decision", `${max.total} (${max.id})`, "≤ 220", max.total <= 220],
  ["Distinct takeaways", principles.size, "≤ 4", principles.size <= 4],
  ["Decisions per act", byAct.map(a => a.decisions).join(" · "), "2 each", byAct.every(a => a.decisions === 2)],
];

const pad = (s, n) => String(s).padEnd(n);
console.log("\n Comprehension, measured from src/content/story.ts\n");
for (const [label, value, target, ok] of rows) console.log(` ${ok ? "✓" : "✗"} ${pad(label, 46)} ${pad(value, 14)} target ${target}`);
console.log("\n Per decision: situation + client + choices + an outcome + the takeaway");
for (const l of loads) console.log(`   ${pad(l.id, 6)} ${pad(l.total, 4)} = ${l.situation} + ${l.quote} + ${l.choices} + ${l.outcome} + ${l.principle}`);
if (principles.size > 4) console.log(`\n ${principles.size} takeaways; the strategy allows the four ideas only.`);
const missed = rows.filter(r => !r[3]).length;
console.log(missed ? `\n ${missed} target(s) missed.` : "\n Every target met.");
if (strict && missed) process.exit(1);
