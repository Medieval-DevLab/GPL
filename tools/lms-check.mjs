/**
 * Does the game actually talk to an LMS?
 *
 * Not "is the protocol right" — `src/scorm.test.ts` covers that against a fake API, and
 * it passed for a week while nothing in `src/` imported the bridge at all. Not "is the
 * wiring right" either — `src/lms.test.ts` covers the schedule as a pure function, and a
 * pure function proves nothing about whether React ever calls it.
 *
 * This is the only check that runs the REAL BUILD in a REAL BROWSER against a REAL API
 * object and looks at what the LMS was told. It is the end of the chain the disconnected
 * bridge broke in the middle of, and every link above it was green at the time.
 *
 *   npm run build && node tools/lms-check.mjs
 *
 * The fake API is installed on `window` before any of the game's code runs, which is
 * exactly how an LMS frameset presents it, and every call is recorded. The game is then
 * driven far enough to have a run worth suspending.
 */

import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { access } from "node:fs/promises";
import path from "node:path";

const INDEX = path.resolve("dist/index.html");

try {
  await access(INDEX);
} catch {
  console.error("✗ dist/index.html is missing — run `npm run build` first");
  process.exit(1);
}

const browser = await chromium.launch();
/* Reduced motion, because this check is about what the LMS is told, not how screens move.
   With motion on, a screen change runs through a view transition that applies the new DOM a
   frame later, and this loop's 80 ms poll would grab the outgoing screen's button mid-swap —
   a race in the script that no person clicking can reproduce (D-077). The motion path is
   covered elsewhere: verify-game.mjs's storage-denied and image-failure flows run with motion,
   and the D-077 release record includes a full motion-on playthrough. */
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

/* The API goes on `window` before the document's own scripts, which is what an LMS does
   and what `findApi`'s discovery walk expects to find. Calls are recorded on the page so
   they can be read back after the run. */
await page.addInitScript(() => {
  const w = /** @type {Record<string, unknown>} */ (window);
  const data = /** @type {Record<string, string>} */ ({});
  const calls = /** @type {string[]} */ ([]);
  w.__lms = { data, calls, failNextCommit: false };
  w.API = {
    LMSInitialize: () => {
      calls.push("init");
      return "true";
    },
    LMSFinish: () => {
      calls.push("finish");
      return "true";
    },
    LMSGetValue: (k) => data[k] ?? "",
    LMSSetValue: (k, v) => {
      calls.push(`set ${k}`);
      data[k] = v;
      return "true";
    },
    LMSCommit: () => {
      if (w.__lms.failNextCommit) {
        w.__lms.failNextCommit = false;
        calls.push("commit-failed");
        return "false";
      }
      calls.push("commit");
      return "true";
    },
    LMSGetLastError: () => "0",
  };
});

const url = pathToFileURL(INDEX).href;
await page.goto(url);
await page.waitForSelector("h1", { timeout: 15000 });

const problems = [];
const read = () => page.evaluate(() => window.__lms);

/* ── 1. arrival ─────────────────────────────────────────────────────────────────────
   A learner who opens the module and closes it again must not read as "not attempted".
   This is the assertion that would have failed on the disconnected build. */
let lms = await read();
if (!lms.calls.includes("init")) {
  problems.push("the game never called LMSInitialize — the bridge is not connected");
}
if (lms.data["cmi.core.lesson_status"] !== "incomplete") {
  problems.push(
    `lesson_status on arrival was "${lms.data["cmi.core.lesson_status"] ?? "(unset)"}", expected "incomplete"`,
  );
}

/* ── 2. a run in progress parks a resume point ──────────────────────────────────── */
const click = async (name) => {
  const b = page.getByRole("button", { name, exact: true });
  if ((await b.count()) === 0) return false;
  await b.first().click();
  await page.waitForTimeout(200);
  return true;
};

await click("Begin your engagement");
await page.waitForTimeout(200);
/* Chapter 0: read the two introduction panels, pick a starting advantage, then start. */
for (let i = 0; i < 6; i++) {
  const next = page.locator('main [data-line-next]').first();
  if (!(await next.count())) break;
  await next.click();
  await page.waitForTimeout(150);
}
const teams = page.locator('[data-phase="setup"] button[aria-pressed]');
if ((await teams.count()) > 0) await teams.first().click();
await page.waitForTimeout(120);
await click("Start the pursuit") || await click("Meet your first client");
await page.waitForTimeout(400);

lms = await read();
const suspended = lms.data["cmi.suspend_data"];
if (!suspended) {
  problems.push("no resume point was parked after the run started — suspend_data is empty");
} else {
  /* The run code, not a save. SCORM 1.2 caps this field at 4,096 and some LMSs enforce
     that by silently truncating, which would corrupt a resume rather than fail it. */
  if (suspended.length > 64) {
    problems.push(`suspend_data is ${suspended.length} chars — that is a save, not a run code`);
  }
  if (suspended.includes("{")) {
    problems.push("suspend_data looks like serialised JSON, not a run code");
  }
}

/* ── 3. no score, ever ──────────────────────────────────────────────────────────────
   The design decision most likely to be undone by an integration, because every LMS
   dashboard in the world wants `cmi.core.score.raw`. Asserted against what the LMS was
   actually sent, not against what the source says it sends. */
const scoreKeys = lms.calls.filter((c) => c.startsWith("set ") && c.includes("score"));
if (scoreKeys.length > 0) {
  problems.push(`a score was reported: ${scoreKeys.join(", ")}`);
}

// A real ending, not an injected state, must report completion. The presentation exposes
// one semantic primary action per screen; decision options remain proper toggle buttons.
let reachedEnding = false;
let retriedFailure = false;
/* Options are pressed in order, one per attempt, until the commit opens (D-086). "Always the
   first unpressed option" stopped terminating on a lever decision: setting a lever replaces
   its previous setting, so it swapped the first lever between its first two settings for
   ever and never reached the second lever. In order, it sets every lever in turn. */
let attempt = 0, attemptAt = '';
await page.evaluate(() => { window.__lms.failNextCommit = true; });
for (let step = 0; step < 480; step++) { // performed lines (D-081) take several presses per decision
  const screen = page.locator('[data-phase]').first();
  if (await screen.getAttribute('data-phase') === 'ending') { reachedEnding = true; break; }
  const primary = page.locator('[data-action="primary"]:visible').first();
  if (!(await primary.count())) { problems.push(`No primary action at campaign step ${step}`); break; }
  if (await primary.isDisabled()) {
    const where = await page.locator('.gpl-game').evaluate((el) => el.dataset.node + ':' + el.dataset.phase);
    if (where !== attemptAt) { attemptAt = where; attempt = 0; }
    const options = page.locator('main button[aria-pressed]:not(:disabled)');
    if (attempt >= (await options.count())) { problems.push(`No selectable approach at campaign step ${step}`); break; }
    await options.nth(attempt++).click();
  } else { await primary.click(); }
  await page.waitForTimeout(80);
  const snapshot = await read();
  if (!retriedFailure && snapshot.calls.includes('commit-failed')) {
    const committedBeforeRetry = snapshot.calls.filter(c => c === 'commit').length;
    await page.waitForTimeout(5200);
    const retried = await read();
    if (retried.calls.filter(c => c === 'commit').length <= committedBeforeRetry) problems.push('Failed LMS commit was not retried while staying on the same screen');
    retriedFailure = true;
  }
}
if (!reachedEnding) problems.push('The browser did not reach a terminal outcome');
if (!retriedFailure) problems.push('The browser did not exercise a failed LMS commit');
if (reachedEnding) {
  await page.waitForTimeout(200);
  lms = await read();
  if (lms.data['cmi.core.lesson_status'] !== 'completed') problems.push('Ending did not report completed');
  const commitsBefore = lms.calls.filter(c => c === 'commit').length;
  await page.waitForTimeout(5200);
  lms = await read();
  if (lms.calls.filter(c => c === 'commit').length !== commitsBefore) problems.push('Completed run was redundantly committed by retry timer');
}
await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
lms = await read();
if (!lms.calls.includes('finish')) problems.push('Pagehide did not finish the LMS session');
if (lms.calls.some(c => c.startsWith('set ') && c.includes('score'))) problems.push('Campaign reported a score');

await browser.close();

console.log(`\n  ${url}  with a fake SCORM API on window\n`);
console.log(`  LMSInitialize     ${lms.calls.includes("init") ? "called" : "NEVER CALLED"}`);
console.log(`  lesson_status     ${lms.data["cmi.core.lesson_status"] ?? "(unset)"}`);
console.log(`  suspend_data      ${suspended ? `${suspended} (${suspended.length} chars)` : "(empty)"}`);
console.log(`  score reported    ${scoreKeys.length === 0 ? "none, as designed" : scoreKeys.join(", ")}`);
console.log(`  calls             ${lms.calls.length}`);

if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  · ${p}`);
  console.error("");
  process.exit(1);
}

console.log(`\n✓ the game reports to an LMS: started, resumable, and no score\n`);
