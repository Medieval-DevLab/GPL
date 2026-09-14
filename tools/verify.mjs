/**
 * Browser verification.
 *
 * Typecheck and unit tests cannot tell you whether a screen actually renders,
 * whether a button is reachable, or whether the game can be finished by a human.
 * This plays a complete run in a real browser, screenshots every beat, and fails
 * on any console error.
 *
 *   node tools/verify.mjs                 # against http://localhost:5173
 *   node tools/verify.mjs http://host     # against anything else
 */

import { chromium } from "playwright";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:5173";
const SHOTS = path.resolve("docs/screenshots");
const MAX_STEPS = 80;

const problems = [];
let shotIndex = 0;

async function shot(page, name) {
  shotIndex += 1;
  const file = path.join(SHOTS, `${String(shotIndex).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`   📸 ${path.basename(file)}`);
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
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`console error: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`page error: ${e.message}`));
  page.on("requestfailed", (r) => {
    const url = r.url();
    if (url.startsWith(BASE)) problems.push(`request failed: ${url}`);
  });

  console.log(`\n▶ verifying ${BASE}\n`);
  await page.goto(BASE, { waitUntil: "networkidle" });

  // Title
  await page.waitForSelector("h1");
  const title = (await page.locator("h1").first().innerText()).trim();
  if (title !== "GPL") problems.push(`title screen h1 was "${title}", expected "GPL"`);
  await shot(page, "title");

  const begin = (await button(page, "Begin")) ?? (await button(page, "Start again"));
  if (!begin) throw new Error("no Begin button on the title screen");
  await begin.click();

  let missionsSeen = 0;
  let consequencesSeen = 0;
  let lessonsSeen = 0;
  let interludesSeen = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    await page.waitForTimeout(160);

    // Ending?
    if ((await page.getByText("How it ended", { exact: true }).count()) > 0) {
      await page.waitForTimeout(500);
      await shot(page, "ending");
      console.log("\n✓ reached the ending");
      break;
    }

    // Decide
    const commit = await button(page, "Commit");
    if (commit) {
      missionsSeen += 1;
      const heading = (await page.locator("h1").first().innerText()).trim();
      console.log(`\n── mission ${missionsSeen}: ${heading}`);
      await shot(page, `mission-${missionsSeen}-decide`);

      const choices = page.locator("button.choice");
      const count = await choices.count();
      if (count < 2) problems.push(`${heading}: only ${count} choices rendered`);

      // Click options until Commit becomes enabled.
      let clicked = 0;
      for (let i = 0; i < count && clicked < 4; i++) {
        if (await commit.isEnabled()) break;
        await choices.nth(i).click();
        clicked += 1;
        await page.waitForTimeout(80);
      }

      if (!(await commit.isEnabled())) {
        problems.push(`${heading}: Commit never became enabled after ${clicked} selections`);
        break;
      }
      await shot(page, `mission-${missionsSeen}-selected`);
      await commit.click();
      continue;
    }

    // Consequence
    const why = await button(page, "Why did that happen?");
    if (why) {
      consequencesSeen += 1;
      await page.waitForTimeout(700); // let meters animate
      if (consequencesSeen <= 2 || consequencesSeen === 10) {
        await shot(page, `consequence-${consequencesSeen}`);
      }
      await why.click();
      continue;
    }

    // Lesson
    const seeHow = await button(page, "See how it went");
    const cont = await button(page, "Continue");
    if (seeHow || cont) {
      // A lesson screen always has the "The point" eyebrow; an interlude does not.
      const isLesson = (await page.getByText("The point", { exact: true }).count()) > 0;
      if (isLesson) {
        lessonsSeen += 1;
        if (lessonsSeen <= 2) await shot(page, `lesson-${lessonsSeen}`);
      } else {
        interludesSeen += 1;
        if (interludesSeen <= 2) await shot(page, `interlude-${interludesSeen}`);
      }
      await (seeHow ?? cont).click();
      continue;
    }

    // Resolving beat — just wait.
    if ((await page.getByText("Seeing what happens…").count()) > 0) {
      if (shotIndex < 6) await shot(page, "resolving");
      await page.waitForTimeout(500);
      continue;
    }

    problems.push(`stuck at step ${step}: no recognised control on screen`);
    await shot(page, `stuck-${step}`);
    break;
  }

  /* ── assertions ─────────────────────────────────────────── */
  if (missionsSeen !== 10) problems.push(`played ${missionsSeen} missions, expected 10`);
  if (consequencesSeen !== 10) problems.push(`saw ${consequencesSeen} consequences, expected 10`);
  if (lessonsSeen !== 10) problems.push(`saw ${lessonsSeen} lessons, expected 10`);
  if (interludesSeen !== 5) problems.push(`saw ${interludesSeen} interludes, expected 5`);

  // Ending content. Compared case-insensitively: several labels are uppercased
  // by CSS, and innerText reports the transformed text.
  const bodyText = (await page.locator("body").innerText()).toLowerCase();
  for (const expected of ["your decisions", "what this run taught", "play again"]) {
    if (!bodyText.includes(expected)) problems.push(`ending is missing "${expected}"`);
  }

  // Accessibility smoke: every interactive control must have an accessible name.
  const unnamed = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("button, a[href], [role='button']")) {
      const name = (el.getAttribute("aria-label") || el.textContent || "").trim();
      if (!name) out.push(el.outerHTML.slice(0, 90));
    }
    return out;
  });
  for (const u of unnamed) problems.push(`control without an accessible name: ${u}`);

  await browser.close();

  console.log(
    `\nmissions ${missionsSeen} · consequences ${consequencesSeen} · lessons ${lessonsSeen} · interludes ${interludesSeen}`,
  );

  if (problems.length) {
    console.error(`\n✗ ${problems.length} problem(s):\n`);
    for (const p of problems) console.error(`  · ${p}`);
    process.exit(1);
  }
  console.log(`\n✓ full playthrough clean — ${shotIndex} screenshots in docs/screenshots\n`);
}

main().catch((e) => {
  console.error("\n✗ verification crashed:", e.message);
  process.exit(1);
});
