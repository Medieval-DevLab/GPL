/**
 * Browser verification.
 *
 * Typecheck and unit tests cannot tell you whether a screen renders, whether a button is
 * reachable, or whether a human can finish the game. This plays a complete run in a real
 * browser, screenshots every beat, and fails on any console error.
 *
 * It also enforces the console rule: at desktop width the working area must not overflow.
 * "A mission fits one screen" is the property that separates this from a form, so it is
 * checked mechanically rather than left to judgement.
 *
 *   node tools/verify.mjs                 # against http://localhost:5173
 *   node tools/verify.mjs http://host     # against anything else
 *   GPL_VIEWPORT=390x844 node tools/...   # phone pass
 */

import { chromium } from "playwright";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:5173";
const MAX_STEPS = 90;

const [vw, vh] = (process.env.GPL_VIEWPORT ?? "1440x900").split("x").map(Number);
const VIEWPORT = { width: vw || 1440, height: vh || 900 };
const DESKTOP = VIEWPORT.width >= 1024;
const SHOTS = path.resolve(
  VIEWPORT.width === 1440 ? "docs/screenshots" : `docs/screenshots-${VIEWPORT.width}`,
);

const problems = [];
let shotIndex = 0;

async function shot(page, name) {
  shotIndex += 1;
  await page.waitForTimeout(400);
  await page
    .evaluate(() => {
      // Infinite animations (the resolving shimmer) never settle, so exclude them or
      // this waits forever.
      const finite = document.getAnimations().filter((a) => {
        const t = a.effect?.getComputedTiming?.();
        return t && t.iterations !== Infinity;
      });
      return Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
    })
    .catch(() => undefined);

  const file = path.join(SHOTS, `${String(shotIndex).padStart(2, "0")}-${name}.png`);
  // Not fullPage: the console owns the viewport and scrolls its own working area, so the
  // viewport IS the screen. Overflow is caught by checkFit instead.
  await page.screenshot({ path: file, fullPage: !DESKTOP });
  console.log(`   📸 ${path.basename(file)}`);
}

/** The console rule, as a test. */
async function checkFit(page, where) {
  if (!DESKTOP) return;
  const fit = await page.evaluate(() => {
    const el = document.querySelector("[data-work-area]");
    if (!el) return null;
    return { scroll: el.scrollHeight, client: el.clientHeight };
  });
  if (!fit) {
    problems.push(`${where}: no [data-work-area] — the console shell is missing`);
    return;
  }
  const over = fit.scroll - fit.client;
  if (over > 4) {
    problems.push(
      `${where}: working area overflows by ${over}px (${fit.scroll} in ${fit.client}). ` +
        `A mission must fit one screen — see docs/UI-AUDIT.md F1.`,
    );
  }
}

/** Is a button with this exact accessible name present and enabled? */
async function button(page, name) {
  const b = page.getByRole("button", { name, exact: true });
  if ((await b.count()) === 0) return null;
  const first = b.first();
  return (await first.isVisible()) ? first : null;
}

async function main() {
  await rm(SHOTS, { recursive: true, force: true });
  await mkdir(SHOTS, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`console error: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`page error: ${e.message}`));
  page.on("requestfailed", (r) => {
    if (r.url().startsWith(BASE)) problems.push(`request failed: ${r.url()}`);
  });

  console.log(`\n▶ verifying ${BASE} at ${VIEWPORT.width}×${VIEWPORT.height}\n`);
  await page.goto(BASE, { waitUntil: "networkidle" });

  await page.waitForSelector("h1");
  const title = (await page.locator("h1").first().innerText()).trim();
  if (title !== "GPL") problems.push(`title screen h1 was "${title}", expected "GPL"`);
  await shot(page, "title");

  const begin = (await button(page, "Take the brief")) ?? (await button(page, "Start again"));
  if (!begin) throw new Error("no start button on the title screen");
  await begin.click();

  let missions = 0;
  let consequences = 0;
  let lessons = 0;
  let interludes = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    await page.waitForTimeout(150);

    if ((await page.getByText("How it ended", { exact: true }).count()) > 0) {
      await page.waitForTimeout(450);
      await shot(page, "ending");
      console.log("\n✓ reached the ending");
      break;
    }

    // ── decide ─────────────────────────────────────────────
    const commit = await button(page, "Commit to this");
    if (commit) {
      missions += 1;
      const heading = (await page.locator("h1").first().innerText()).trim();
      console.log(`\n── mission ${missions}: ${heading}`);

      // The game shell must be present on every briefing, not just the first.
      for (const required of ["Chapter", "Key factors", "Where you stand"]) {
        if ((await page.getByText(required, { exact: false }).count()) === 0) {
          problems.push(`${heading}: shell is missing "${required}"`);
        }
      }
      // Advice must be attributed to a person, never spoken by the interface.
      if ((await page.getByText("Tip.", { exact: false }).count()) > 0) {
        problems.push(`${heading}: an unattributed "Tip." is on screen`);
      }

      await checkFit(page, `mission ${missions} (${heading})`);
      await shot(page, `mission-${missions}-decide`);

      const choices = page.locator("button.choice");
      const count = await choices.count();
      if (count < 2) problems.push(`${heading}: only ${count} choices rendered`);

      // Select until the prediction gate becomes available.
      let clicked = 0;
      for (let i = 0; i < count && clicked < 4; i++) {
        if ((await page.getByText("what will this cost most?", { exact: false }).count()) > 0) break;
        await choices.nth(i).click();
        clicked += 1;
        await page.waitForTimeout(70);
      }

      // The prediction is the game's "before" — commit must be gated on it.
      if (await commit.isEnabled()) {
        problems.push(`${heading}: Commit was enabled before a prediction was made`);
      }
      const predict = await button(page, "Deliverability");
      if (!predict) {
        problems.push(`${heading}: no prediction control after selecting`);
        await shot(page, `stuck-predict-${missions}`);
        break;
      }
      await predict.click();
      await page.waitForTimeout(70);

      if (!(await commit.isEnabled())) {
        problems.push(`${heading}: Commit never enabled after ${clicked} selections + prediction`);
        break;
      }
      await checkFit(page, `mission ${missions} selected (${heading})`);
      await shot(page, `mission-${missions}-selected`);
      await commit.click();
      continue;
    }

    // ── consequence ────────────────────────────────────────
    const why = await button(page, "Why did that happen?");
    if (why) {
      consequences += 1;
      await page.waitForTimeout(650); // let the meters animate
      if (consequences <= 2 || consequences === 10) await shot(page, `consequence-${consequences}`);
      await why.click();
      continue;
    }

    // ── lesson ─────────────────────────────────────────────
    const next = (await button(page, "Next mission")) ?? (await button(page, "See how it went"));
    if (next) {
      lessons += 1;
      if (lessons <= 2) await shot(page, `lesson-${lessons}`);
      await next.click();
      continue;
    }

    // ── interlude ──────────────────────────────────────────
    const begins = await button(page, "Begin the chapter");
    if (begins) {
      interludes += 1;
      if (interludes <= 2) await shot(page, `interlude-${interludes}`);
      await begins.click();
      continue;
    }

    // ── resolving ──────────────────────────────────────────
    if ((await page.getByText("Seeing what happens…").count()) > 0) {
      if (shotIndex < 6) await shot(page, "resolving");
      await page.waitForTimeout(450);
      continue;
    }

    problems.push(`stuck at step ${step}: no recognised control on screen`);
    await shot(page, `stuck-${step}`);
    break;
  }

  /* ── assertions ─────────────────────────────────────────── */
  const expected = 10;
  if (missions !== expected) problems.push(`played ${missions} missions, expected ${expected}`);
  if (consequences !== expected) problems.push(`saw ${consequences} consequences, expected ${expected}`);
  if (lessons !== expected) problems.push(`saw ${lessons} lessons, expected ${expected}`);
  if (interludes !== 5) problems.push(`saw ${interludes} interludes, expected 5`);

  const body = (await page.locator("body").innerText()).toLowerCase();
  for (const t of ["your decisions", "what this run taught", "the account", "take a new brief"]) {
    if (!body.includes(t)) problems.push(`ending is missing "${t}"`);
  }

  // Every interactive control must have an accessible name.
  const unnamed = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("button, a[href], [role='button']")) {
      const name = (el.getAttribute("aria-label") || el.textContent || "").trim();
      if (!name) out.push(el.outerHTML.slice(0, 90));
    }
    return out;
  });
  for (const u of unnamed) problems.push(`control without an accessible name: ${u}`);

  // Photography must actually load — a broken <img> is invisible in a screenshot.
  const brokenImages = await page.evaluate(() =>
    [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
  );
  for (const src of brokenImages) problems.push(`image failed to decode: ${src}`);

  await browser.close();

  console.log(
    `\nmissions ${missions} · consequences ${consequences} · lessons ${lessons} · interludes ${interludes}`,
  );

  if (problems.length) {
    console.error(`\n✗ ${problems.length} problem(s):\n`);
    for (const p of problems) console.error(`  · ${p}`);
    process.exit(1);
  }
  console.log(
    `\n✓ clean playthrough at ${VIEWPORT.width}×${VIEWPORT.height} — ${shotIndex} screenshots in ${path.relative(process.cwd(), SHOTS)}\n`,
  );
}

main().catch((e) => {
  console.error("\n✗ verification crashed:", e.message);
  process.exit(1);
});
