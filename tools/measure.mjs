/**
 * Screen density measurement.
 *
 * "Too densely packed" is a judgement until it has numbers attached. This walks a real
 * playthrough and, on each decide screen, counts what is actually on it: words, panels,
 * distinct type sizes, distinct colours, interactive targets, how much is hidden behind a
 * disclosure, and how much of the desk is ink versus air.
 *
 * It exists so that a density target can be a build gate rather than an opinion — see
 * docs/DENSITY-FRAMEWORK.md for the target ranges.
 *
 * The probe itself lives in tools/lib/probe.mjs, shared with tools/air-debug.mjs, which
 * draws the air verdict onto the page. If you doubt a number here, look at it there.
 *
 *   node tools/measure.mjs                      # against http://localhost:5173
 *   node tools/measure.mjs --json               # machine-readable
 *   node tools/measure.mjs --legacy-air         # score the pre-fix air rule, for contrast
 */

import { chromium } from "playwright";
import { PROBE } from "./lib/probe.mjs";

const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:5173";
const AS_JSON = process.argv.includes("--json");
const LEGACY_AIR = process.argv.includes("--legacy-air");
const [vw, vh] = (process.env.GPL_VIEWPORT ?? "1440x1024").split("x").map(Number);

async function btn(page, name) {
  const b = page.getByRole("button", { name, exact: true });
  if ((await b.count()) === 0) return null;
  const f = b.first();
  return (await f.isVisible()) ? f : null;
}

const rows = [];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: vw || 1440, height: vh || 1024 } });
  await page.goto(BASE, { waitUntil: "networkidle" });

  const begin = (await btn(page, "Take the brief")) ?? (await btn(page, "Start again"));
  if (begin) await begin.click();
  await page.waitForTimeout(250);

  const start = await btn(page, "Start the pursuit");
  if (start) {
    rows.push({ screen: "chapter 0", ...(await page.evaluate(PROBE)) });
    await page.locator("button.choice").first().click();
    await page.waitForTimeout(80);
    await start.click();
  }

  /* Same deadlock stop as tools/verify.mjs, and the same lesson: at 90 this was an
     unstated assumption of about sixteen missions, and with seventeen it ran out one click
     short of the ending — which does not change the rubric (only decide screens are
     scored) but silently dropped the densest screen in the game from the table. */
  for (let step = 0; step < 240; step++) {
    await page.waitForTimeout(140);
    if ((await page.getByText("How it ended", { exact: true }).count()) > 0) {
      /* The ending grows after it mounts — the ledger and the rings arrive late — and
         probing on the first frame measured a screen a third of its final height, which
         showed up as the air sample claiming full coverage of a screen it had seen a
         quarter of. Same settle as tools/verify.mjs, so the two tools' numbers line up. */
      await page.waitForTimeout(450);
      rows.push({ screen: "ending", ...(await page.evaluate(PROBE)) });
      break;
    }

    const toOptions = await btn(page, "See your options");
    if (toOptions) {
      const h = (await page.locator("h1").first().innerText()).trim();
      rows.push({ screen: `brief · ${h}`, ...(await page.evaluate(PROBE)) });
      await toOptions.click();
      continue;
    }

    const commit = await btn(page, "Commit to this");
    if (commit) {
      const h = (await page.locator("h1").first().innerText()).trim();
      rows.push({ screen: `decide · ${h}`, ...(await page.evaluate(PROBE)) });

      const choices = page.locator("button.choice");
      const n = await choices.count();
      for (let i = 0; i < n; i++) {
        if ((await page.getByText("will move least?", { exact: false }).count()) > 0) break;
        await choices.nth(i).click();
        await page.waitForTimeout(60);
      }
      const p = await btn(page, "Deliverability");
      if (p) await p.click();
      if (await commit.isEnabled()) await commit.click();
      continue;
    }

    const next = (await btn(page, "Next mission")) ?? (await btn(page, "See how it went"));
    if (next) {
      await page.waitForTimeout(500);
      if (rows.filter((r) => r.screen.startsWith("result")).length < 2) {
        rows.push({ screen: "result", ...(await page.evaluate(PROBE)) });
      }
      await next.click();
      continue;
    }

    const chapter = await btn(page, "Begin the chapter");
    if (chapter) {
      if (!rows.some((r) => r.screen === "interlude")) {
        rows.push({ screen: "interlude", ...(await page.evaluate(PROBE)) });
      }
      await chapter.click();
      continue;
    }

    await page.waitForTimeout(350);
  }

  await browser.close();

  if (AS_JSON) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  const decides = rows.filter((r) => r.screen.startsWith("decide"));
  const briefs = rows.filter((r) => r.screen.startsWith("brief"));

  /**
   * Refuse to score nothing.
   *
   * A run that never reached a decide screen — the dev server reloading under the walk is
   * enough to do it — used to print the full rubric with `undefined` in every cell and a
   * cheerful "SCORE 0/100", which is a measurement claim about a screen this tool never
   * saw. The whole point of this exercise is instruments that do not report numbers they
   * have not earned (D-038), so this one says what happened and exits non-zero.
   */
  if (decides.length === 0) {
    console.error(
      `\nmeasured ${rows.length} screens but none of them was a decide screen — nothing to` +
        ` score.\nThe walk did not reach a decision beat (a dev-server reload mid-run will` +
        ` do this).\n`,
    );
    process.exit(1);
  }

  /**
   * The rubric from docs/DENSITY-FRAMEWORK.md §C. 100 points, pass ≥80, and any factor
   * scoring zero is a failure regardless of the total.
   *
   * Scored on the DECIDE screens only. The brief is a reading beat and is allowed to
   * carry more words; what it may not do is carry the options.
   */
  const FACTORS = [
    { id: "regions", wt: 18, get: (r) => r.regions, lo: 4, hi: 6 },
    { id: "words", wt: 16, get: (r) => r.totalWords, lo: 160, hi: 220 },
    { id: "air", wt: 12, get: (r) => (LEGACY_AIR ? r.airLegacy : r.air), lo: 0.35, hi: 0.65 },
    { id: "decisionShare", wt: 12, get: (r) => r.decisionShare, lo: 0.55, hi: 1 },
    { id: "typeSizes", wt: 6, get: (r) => r.typeSizes.length, lo: 3, hi: 5 },
    { id: "weights", wt: 4, get: (r) => r.fontWeights.length, lo: 2, hi: 3 },
    { id: "stations", wt: 10, get: (r) => r.stations, lo: 3, hi: 4 },
    { id: "fills", wt: 8, get: (r) => r.fillColours, lo: 1, hi: 5 },
    /* §C factor 8's measure is "`button.choice` count", not "targets − 1". The old proxy
       happened to land near the option count on this build and is not the same number. */
    { id: "options", wt: 6, get: (r) => r.choices, lo: 3, hi: 5 },
    /* Factor 9 — progressive disclosure share. Specified, marked "✅ Auto", and never
       built: first left out of the denominator (which is how this printed "92/92"), then
       counted as a flat zero. A zero is not a measurement either. Now measured in
       lib/probe.mjs from the affordances actually on screen. */
    { id: "disclosure", wt: 5, get: (r) => r.disclosureShare, lo: 0.25, hi: 0.4 },
    { id: "targets", wt: 0, get: (r) => r.targets, lo: 3, hi: 9 },
  ];

  /* Each brief→decide pair, and how much of the screen survives the transition. */
  const beatPairs = [];
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i];
    const b = rows[i + 1];
    if (!a.screen.startsWith("brief") || !b.screen.startsWith("decide")) continue;
    const A = new Set((a.regionNames ?? []).filter(Boolean));
    const B = new Set((b.regionNames ?? []).filter(Boolean));
    if (A.size === 0 || B.size === 0) continue;
    const shared = [...A].filter((n) => B.has(n)).length;
    const union = new Set([...A, ...B]).size;
    beatPairs.push({ pair: b.screen, jaccard: Math.round((shared / union) * 100) / 100 });
  }

  /**
   * WHICH SCREEN THE SCORE IS ABOUT — the median is the report, the worst screen is the gate.
   *
   * This used to score the median decide screen and print the range beside it, which let
   * words run to 225 against a 220 cap and air to 0.67 against a 0.65 one while the two
   * factors showed 16/16 and 12/12. Nobody reads a median screen. The game is linear and
   * sixteen beats long, so every screen in that range is on every single playthrough, and
   * a density failure is a property of the beat it happens on. Averaging it away is
   * D-038's mistake approached from the other side: there the band moved to fit the build,
   * here the statistic did, and both produce an instrument that agrees with whatever it
   * measures.
   *
   * So the worst screen decides the score. The median is still printed, because it is the
   * honest summary of where the design sits, and so is the number of screens outside the
   * band — "one screen five words over" and "nine screens forty words over" earn the same
   * points and deserve different responses.
   *
   * "Worst" is the value furthest outside the band, normalised by band width, so a
   * two-sided factor cannot be scored on whichever end flatters it. §C's half-credit rule
   * ("half weight within 25% of the band edge") is unchanged; it now applies to that
   * distance rather than to the median's.
   */
  const assess = (vals, lo, hi) => {
    const span = hi - lo || 1;
    const away = (v) => Math.max(lo - v, v - hi, 0) / span;
    const sorted = [...vals].sort((a, b) => a - b);
    const worst = vals.reduce((w, v) => (away(v) > away(w) ? v : w), vals[0]);
    const d = away(worst);
    return {
      worst,
      median: sorted[Math.floor(sorted.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      outside: vals.filter((v) => away(v) > 0).length,
      of: vals.length,
      verdict: d === 0 ? "in" : d <= 0.25 ? "near" : "out",
    };
  };

  const pad = (s, n) => String(s).padEnd(n);
  console.log(`\n${vw}×${vh} — ${rows.length} screens\n`);
  console.log(
    pad("screen", 44),
    pad("words", 6),
    pad("regs", 5),
    pad("air", 5),
    pad("dec%", 5),
    pad("stn", 4),
    pad("sizes", 6),
    pad("fills", 5),
    pad("opts", 5),
    pad("hidden", 6),
  );
  for (const r of rows) {
    console.log(
      pad(r.screen.slice(0, 43), 44),
      pad(r.totalWords, 6),
      pad(r.regions, 5),
      pad(LEGACY_AIR ? r.airLegacy : r.air, 5),
      pad(r.decisionShare, 5),
      pad(r.stations, 4),
      pad(r.typeSizes.length, 6),
      pad(r.fillColours, 5),
      pad(r.choices, 5),
      pad(r.hiddenWords, 6),
    );
  }

  let score = 0;
  let maxScore = 0;
  const fails = [];
  console.log(
    `\nRUBRIC — ${decides.length} decide screens, scored on the WORST screen per factor\n`,
  );
  console.log(
    ` ${pad("", 2)}${pad("factor", 15)} ${pad("worst", 7)} ${pad("median", 7)} ${pad("target", 11)} ${pad("range", 12)} ${pad("off-band", 9)} score`,
  );
  for (const f of FACTORS) {
    const a = assess(decides.map(f.get), f.lo, f.hi);
    const got = a.verdict === "in" ? f.wt : a.verdict === "near" ? f.wt / 2 : 0;
    score += got;
    maxScore += f.wt;
    if (f.wt > 0 && got === 0) fails.push(f.id);
    const mark = a.verdict === "in" ? "✓" : a.verdict === "near" ? "~" : "✗";
    console.log(
      ` ${mark} ${pad(f.id, 15)} ${pad(a.worst, 7)} ${pad(a.median, 7)} ${pad(`${f.lo}–${f.hi}`, 11)} ${pad(`${a.min}–${a.max}`, 12)} ${pad(`${a.outside}/${a.of}`, 9)} ${got}/${f.wt}`,
    );
  }

  /**
   * Factor 10 — between-beat overlap. §C specifies it, marks it "auto", and it was never
   * implemented, so the rubric was scored out of 92 while printing "92/92 — PASS".
   *
   * It is the only factor measuring continuity BETWEEN screens, which makes it the one
   * that speaks directly to "there is no system to read the flow" — and it is the one
   * that fails. Jaccard on the `data-region` names across each brief→decide pair.
   *
   * Scored on the worst pair for the same reason as everything above.
   */
  if (beatPairs.length) {
    const a = assess(
      beatPairs.map((p) => p.jaccard),
      0.85,
      1,
    );
    const got = a.verdict === "in" ? 3 : a.verdict === "near" ? 1.5 : 0;
    score += got;
    maxScore += 3;
    if (got === 0) fails.push("overlap");
    const mark = a.verdict === "in" ? "✓" : a.verdict === "near" ? "~" : "✗";
    console.log(
      ` ${mark} ${pad("overlap", 15)} ${pad(a.worst, 7)} ${pad(a.median, 7)} ${pad("0.85–1", 11)} ${pad(`${a.min}–${a.max}`, 12)} ${pad(`${a.outside}/${a.of}`, 9)} ${got}/3`,
    );
  }

  /**
   * The two clauses of factor 9 that are not a share: "at most two disclosure controls on
   * the screen" and "0% of decision-critical content hidden". They are pass/fail rather
   * than banded, so they are reported as violations rather than scored twice — the share
   * above already carries the five points.
   *
   * The critical-content clause is the one worth having. The framework's own test for
   * whether a disclosure is honest is that a player who ignores it should not be
   * *surprised* by the outcome; hiding an option attribute behind a toggle fails that, and
   * it is the kind of thing that arrives later, in a hurry, to win back layout space.
   */
  const tooManyControls = decides.filter((r) => r.disclosureControls > 2);
  const hidesCritical = decides.filter((r) => r.disclosureCritical);
  const controlCounts = [...new Set(decides.map((r) => r.disclosureControls))].sort();
  const hid = decides.map((r) => r.hiddenWords).sort((a, b) => a - b);
  console.log(
    `\n disclosure controls per decide screen: ${controlCounts.join(", ")} (§9 allows at most 2)`,
  );
  /* What the band asks for in words, since "0.25–0.40" is not a brief anybody can act on.
     Solved at the word target rather than at today's count, because a screen that hits the
     band by growing its visible text has not made anything easier to read. */
  const implied = (share) => Math.round((220 * share) / (1 - share));
  console.log(
    `   hidden words per decide screen: ${hid[0]}–${hid[hid.length - 1]}. At the 220-word` +
      ` cap of factor 2,\n   the 0.25–0.40 band implies ${implied(0.25)}–${implied(0.4)} words behind the affordance.`,
  );
  if (tooManyControls.length) {
    fails.push("disclosure controls");
    console.log(` ✗ ${tooManyControls.length} screen(s) carry more than two disclosure controls`);
  }
  if (hidesCritical.length) {
    fails.push("disclosure hides decision-critical content");
    console.log(
      ` ✗ ${hidesCritical.length} screen(s) hide content inside [data-decision] — §9 forbids this outright`,
    );
  }

  /* Where the air number comes from, summed across the decide screens. Printed because a
     single ratio is exactly as believable when it is wrong (QA F7: photography and icons
     counted as emptiness), and a reader who can see the composition can check it. */
  const totals = {};
  let sampled = 0;
  for (const r of decides) {
    sampled += r.airSampled;
    for (const [k, n] of Object.entries(r.airBreakdown ?? {})) totals[k] = (totals[k] ?? 0) + n;
  }
  const share = (n) => `${Math.round((n / sampled) * 100)}%`;
  console.log(
    `\n air sample composition, ${sampled} points across ${decides.length} decide screens:`,
  );
  console.log(
    `   paper ${share(totals.paper ?? 0)} · text ${share(totals.text ?? 0)} · image ${share(totals.image ?? 0)}` +
      ` · svg ${share(totals.svg ?? 0)} · gradient ${share(totals.gradient ?? 0)} · fill ${share(totals.fill ?? 0)}`,
  );
  const inkPhotos = (totals.image ?? 0) + (totals.svg ?? 0) + (totals.gradient ?? 0);
  console.log(
    `   ${inkPhotos} of those points are photography, SVG or gradient — counted as EMPTY by the pre-fix probe`,
  );
  const legacyMedian = assess(decides.map((r) => r.airLegacy), 0.35, 0.65);
  const fixedMedian = assess(decides.map((r) => r.air), 0.35, 0.65);
  console.log(
    `   air median: ${fixedMedian.median} measured, ${legacyMedian.median} under the old rule` +
      `${LEGACY_AIR ? " (scoring the OLD rule: --legacy-air)" : ""}`,
  );
  const partial = rows.filter((r) => (r.airCoverage ?? 1) < 0.99);
  if (partial.length) {
    console.log(
      `   partial samples (content taller than the work area, so air is the first screenful only):`,
    );
    for (const r of partial) {
      console.log(`     ${r.screen.slice(0, 43)} — ${Math.round(r.airCoverage * 100)}% sampled`);
    }
  }

  const allSizes = [...new Set(decides.flatMap((r) => r.typeSizes))].sort((a, b) => a - b);
  const halfPixel = allSizes.filter((n) => n % 1 !== 0);
  console.log(`\n type sizes across the game: ${allSizes.join(", ")}`);
  if (halfPixel.length) console.log(` half-pixel sizes (banned): ${halfPixel.join(", ")}`);
  if (briefs.length) {
    const bw = briefs.map((r) => r.totalWords).sort((a, b) => a - b);
    console.log(` brief words: ${bw[0]}–${bw[bw.length - 1]}`);
  }

  /* §C: "any factor scoring zero is a failure regardless of the total". The verdict read
     only the total, so a screen could zero the continuity factor and still be told it
     passed — which is how "92/92 — PASS" was reported three times, on a rubric whose
     weights summed to 92 because two factors were specified and never built. */
  const passed = score >= 80 && fails.length === 0;
  console.log(`\nSCORE ${score}/${maxScore}  —  ${passed ? "PASS" : "FAIL"}`);
  if (fails.length) console.log(`zeroed factors (any one fails): ${fails.join(", ")}`);
  console.log("");
}
main().catch((e) => {
  console.error("measure failed:", e.message);
  process.exit(1);
});
