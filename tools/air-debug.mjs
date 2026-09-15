/**
 * Draws the air probe's verdict onto the page and screenshots it.
 *
 * The air factor was wrong for a long time and nobody noticed, because a single number
 * between 0 and 1 looks equally plausible whatever it says. 0.66 and 0.50 are both
 * believable; only one was true. The fix for that class of bug is not a better number, it
 * is being able to LOOK at the number — see D-010, and the repo rule that green tests have
 * never caught a rendering bug here.
 *
 * So this marks every sample point with what `tools/lib/probe.mjs` decided it was. A green
 * dot over a photograph, or a red dot over bare desk, is a bug in the instrument that you
 * can see in one glance instead of arguing about.
 *
 *   node tools/air-debug.mjs                 # first decide screen
 *   node tools/air-debug.mjs --beat=5        # fifth decide screen
 *   node tools/air-debug.mjs --ending        # the densest screen in the game
 *   node tools/air-debug.mjs --out=x.png
 */

import { chromium } from "playwright";
import os from "node:os";
import path from "node:path";
import { PROBE } from "./lib/probe.mjs";

const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:5173";
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const BEAT = Number(arg("beat", 1));
const ENDING = process.argv.includes("--ending");
const TRACE = process.argv.includes("--trace");
const [vw, vh] = (process.env.GPL_VIEWPORT ?? "1440x1024").split("x").map(Number);
const OUT = path.resolve(arg("out", path.join(os.tmpdir(), ENDING ? "gpl-air-ending.png" : `gpl-air-${BEAT}.png`)));

/** One colour per classification, so the legend is the image. */
const COLOURS = {
  text: "#e11d48",
  image: "#d946ef",
  svg: "#f97316",
  gradient: "#8b5cf6",
  "image-fill": "#0ea5e9",
  fill: "#2563eb",
  paper: "#16a34a",
};

const OVERLAY = ({ points, colours }) => {
  const layer = document.createElement("div");
  layer.style.cssText = "position:fixed;inset:0;z-index:99999;pointer-events:none";
  for (const p of points) {
    const dot = document.createElement("i");
    dot.style.cssText = `position:absolute;left:${p.x - 3}px;top:${p.y - 3}px;width:6px;height:6px;border-radius:9px;background:${colours[p.k] ?? "#000"};box-shadow:0 0 0 1px rgba(255,255,255,.85)`;
    layer.appendChild(dot);
  }
  document.body.appendChild(layer);
};

async function btn(page, name) {
  const b = page.getByRole("button", { name, exact: true });
  if ((await b.count()) === 0) return null;
  const f = b.first();
  return (await f.isVisible()) ? f : null;
}

/** Walk the first-option path until the requested screen is on the desk. */
async function navigate(page) {
  const begin = (await btn(page, "Take the brief")) ?? (await btn(page, "Start again"));
  if (begin) await begin.click();
  await page.waitForTimeout(250);
  const start = await btn(page, "Start the pursuit");
  if (start) {
    await page.locator("button.choice").first().click();
    await page.waitForTimeout(80);
    await start.click();
  }

  let decides = 0;
  for (let step = 0; step < 120; step++) {
    await page.waitForTimeout(140);
    if (TRACE) {
      // Read through evaluate, not a locator: `locator.innerText()` waits 30s for an
      // element that is not there, and a trace whose job is to explain a stall must not
      // be the reason the run stalls.
      const h = await page.evaluate(() => document.querySelector("h1")?.textContent ?? "—");
      console.log(`   step ${step}: decides=${decides} h1="${h.trim().slice(0, 40)}"`);
    }
    if ((await page.getByText("How it ended", { exact: true }).count()) > 0) {
      if (ENDING) return "ending";
      throw new Error(`ran out of game before decide screen ${BEAT}`);
    }
    const toOptions = await btn(page, "See your options");
    if (toOptions) {
      await toOptions.click();
      continue;
    }
    const commit = await btn(page, "Commit to this");
    if (commit) {
      decides += 1;
      if (!ENDING && decides === BEAT) {
        return `decide ${decides} · ${(await page.locator("h1").first().innerText()).trim()}`;
      }
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
      await page.waitForTimeout(450);
      await next.click();
      continue;
    }
    const chapter = await btn(page, "Begin the chapter");
    if (chapter) {
      await chapter.click();
      continue;
    }
    await page.waitForTimeout(350);
  }
  throw new Error("navigation stalled");
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: vw || 1440, height: vh || 1024 } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const where = await navigate(page);
  await page.waitForTimeout(400);

  const m = await page.evaluate(PROBE, { debug: true });
  await page.evaluate(OVERLAY, { points: m.points, colours: COLOURS });
  await page.screenshot({ path: OUT });
  await browser.close();

  const total = m.airSampled;
  console.log(`\n${where} — ${total} sample points at ${vw}×${vh}\n`);
  for (const [k, n] of Object.entries(m.airBreakdown)) {
    if (!n) continue;
    console.log(
      `  ${COLOURS[k]}  ${k.padEnd(11)} ${String(n).padStart(4)}  ${String(Math.round((n / total) * 100)).padStart(3)}%`,
    );
  }
  console.log(`\n  air (fixed)  ${m.air}`);
  console.log(`  air (legacy) ${m.airLegacy}   ← what the pre-fix probe reported`);
  console.log(`\n  ${OUT}\n`);
}

main().catch((e) => {
  console.error("air-debug failed:", e.message);
  process.exit(1);
});
