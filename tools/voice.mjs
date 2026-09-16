/**
 * The voice instrument.
 *
 * Backlog section 6. The complaint that started this project was that the game sounded
 * condescending, and every earlier attempt to fix it worked on the *framing* — an
 * unattributed "Tip" box became a named colleague with a job and a photograph. That was
 * right and it is done. What it exposed is the thing this measures.
 *
 * Each advisor speaks in two places. Their `quote` and the mission's `advisorLine` are
 * written as speech: "Whatever we write down, somebody has to build." Their `lesson`
 * lines are written as proverbs: "Price is not a number, it is a position." Both are
 * rendered under the same name and photograph, inside quotation marks, on the same
 * screen. So the defect is not that the teaching is unattributed; it is that ONE NAMED
 * PERSON SPEAKS IN TWO REGISTERS depending on which field the words are stored in.
 *
 * That is measurable, which is why this is a tool and not an opinion:
 *
 *   FIRST PERSON      does the line use we/our/us/I/my — the mark of someone who was
 *                     in the room, rather than an observation about rooms in general
 *   TENSELESS         present-tense copula with no agent ("X is not Y, it is Z"), the
 *                     grammatical signature of the maxim
 *   SPLIT             an advisor whose speech fields and lesson fields disagree on both
 *
 *   npx vite-node tools/voice.mjs
 *   npx vite-node tools/voice.mjs --lines     # every line, grouped by speaker
 */

import { story } from "../src/content/story.ts";

const showLines = process.argv.includes("--lines");

const FIRST_PERSON = /\b(we|our|ours|us|i|my|mine|i'd|i've|i'm|we'd|we've|we're)\b/i;
const SECOND_PERSON = /\b(you|your|yours|you'll|you've|you're)\b/i;
/* "X is not Y, it is Z" / "X is Y" with an abstract subject and no agent. The test is
   deliberately crude: a line that opens on a bare abstract noun phrase and whose only
   verb is a copula is a definition, and definitions are what wall posters contain. */
const TENSELESS =
  /^(?:A|An|The|Every|Not every|Nothing|Nobody|Reach|Fit|Risk|Price|Reuse|Delivery|Scope|Evaluation|Honesty|Cover|Discipline|Signing|Walking|Being|Saying|Deciding|Answering|Relationships|Commercial|What)\b[^.!?]*\b(is|are|becomes|inherits|look|do|does)\b/;
/**
 * Does the line point at something that just happened?
 *
 * TENSELESS alone over-reports badly, and it is worth saying why rather than quietly
 * tightening the regex. "A price is a position I have to hold for months" opens on an
 * article and a copula, so the shape test fires — but a named person is saying "I" about
 * a decision taken thirty seconds ago, which is the opposite of a wall poster. The
 * grammatical shape was never the defect; being unsituated was. So a maxim is a line
 * that is tenseless AND impersonal AND contains nothing that points at the event.
 */
const DEICTIC =
  /\b(that|those|this|these|there|then|here|now|today|tonight|ours|theirs|hers|his|she|he|him|her|sarah|marcus|aisha|riya|arjun|priya|foyle)\b/i;
const isMaxim = (t) => TENSELESS.test(t) && !FIRST_PERSON.test(t) && !DEICTIC.test(t);

/**
 * Walk every mission and collect the lines with the person they are attributed to.
 *
 * Every node kind, and both places a lesson lives. An earlier draft of this walked only
 * `choice` nodes and only per-outcome lessons, and reported 22 of the 41 principle lines
 * in the file — it silently missed `investigate` and `build` nodes altogether, and the
 * mission-level `lesson` that DESIGN-RULES requires so the objective lands on whichever
 * branch is taken. An instrument that reads half the content is worse than none, because
 * its number looks like a measurement.
 */
function collect(content) {
  const rows = [];
  for (const node of Object.values(content.nodes)) {
    if (node.kind === "setup" || node.kind === "ending") continue;
    const who = node.advisor?.name ?? "(nobody)";
    const role = node.advisor?.role ?? "";
    const add = (field, text, outcome) => {
      if (text) rows.push({ who, role, node: node.id, field, text, outcome });
    };
    add("quote", node.advisor?.quote);
    add("advisorLine", node.advisorLine);
    add("steer", node.advisor?.steer);

    /* The mission's own lesson is the fallback the player sees when no outcome lesson
       applies, so it is read in exactly the same voice and counts the same. */
    for (const f of ["principle", "because", "watchFor"]) {
      if (node.lesson?.[f]) add(f, node.lesson[f], "(mission)");
    }
    const outs = node.kind === "choice" ? node.options.flatMap((o) => o.outcomes) : (node.outcomes ?? []);
    for (const o of outs) {
      for (const f of ["principle", "because", "watchFor"]) {
        if (o.lesson?.[f]) add(f, o.lesson[f], o.id);
      }
    }
  }
  return rows;
}

const rows = collect(story);
const SPEECH = new Set(["quote", "advisorLine"]);
const TEACH = new Set(["principle", "because", "watchFor"]);

const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : "  -");
function stats(list) {
  const uniq = [...new Map(list.map((r) => [r.text, r])).values()];
  return {
    n: uniq.length,
    first: uniq.filter((r) => FIRST_PERSON.test(r.text)).length,
    second: uniq.filter((r) => SECOND_PERSON.test(r.text)).length,
    tenseless: uniq.filter((r) => TENSELESS.test(r.text)).length,
    maxim: uniq.filter((r) => isMaxim(r.text)).length,
    uniq,
  };
}

console.log("\nREGISTER BY FIELD\n");
console.log("  field          n   first person   second person   maxim shape   unsituated maxim");
for (const f of ["quote", "advisorLine", "steer", "principle", "because", "watchFor"]) {
  const s = stats(rows.filter((r) => r.field === f));
  console.log(
    `  ${f.padEnd(13)} ${String(s.n).padStart(3)}   ` +
      `${pct(s.first, s.n).padStart(5)} (${String(s.first).padStart(2)})   ` +
      `${pct(s.second, s.n).padStart(6)} (${String(s.second).padStart(2)})    ` +
      `${pct(s.tenseless, s.n).padStart(6)} (${String(s.tenseless).padStart(2)})   ` +
      `${pct(s.maxim, s.n).padStart(8)} (${String(s.maxim).padStart(2)})`,
  );
}

/* The headline number. An advisor is "split" when the words stored as their speech and
   the words stored as their teaching do not agree about who is talking. */
console.log("\nSPLIT SPEAKERS — the same person, two registers\n");
const people = [...new Set(rows.map((r) => r.who))].filter((w) => w !== "(nobody)");
let split = 0;
for (const who of people) {
  const mine = rows.filter((r) => r.who === who);
  const sp = stats(mine.filter((r) => SPEECH.has(r.field)));
  const te = stats(mine.filter((r) => TEACH.has(r.field)));
  const isSplit = sp.first > 0 && te.first === 0;
  if (isSplit) split++;
  console.log(
    `  ${isSplit ? "SPLIT" : "  ok "}  ${who.padEnd(14)} ` +
      `speech ${sp.first}/${sp.n} first person, teaching ${te.first}/${te.n}`,
  );
}
console.log(`\n  split speakers: ${split} of ${people.length}`);

const prin = stats(rows.filter((r) => r.field === "principle"));
console.log(`  principle lines that are unsituated maxims: ${prin.maxim} of ${prin.n}`);
console.log(`  principle lines using we/our/us: ${prin.first} of ${prin.n}\n`);

if (showLines) {
  for (const who of people) {
    console.log(`\n── ${who} ──`);
    for (const f of ["quote", "advisorLine", "principle"]) {
      for (const r of new Map(
        rows.filter((x) => x.who === who && x.field === f).map((x) => [x.text, x]),
      ).values()) {
        const m = [
          FIRST_PERSON.test(r.text) ? "1P" : "  ",
          isMaxim(r.text) ? "MAXIM" : "     ",
        ].join(" ");
        console.log(`  ${m}  ${f.padEnd(11)} ${r.node.padEnd(9)} ${r.text}`);
      }
    }
  }
}
