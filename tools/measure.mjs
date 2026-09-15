/**
 * Screen density measurement.
 *
 * "Too densely packed" is a judgement until it has numbers attached. This walks a real
 * playthrough and, on each decide screen, counts what is actually on it: words, panels,
 * distinct type sizes, distinct colours, interactive targets, and how much of the desk
 * is ink versus air.
 *
 * It exists so that a density target can be a build gate rather than an opinion — see
 * docs/DENSITY-FRAMEWORK.md for the target ranges.
 *
 *   node tools/measure.mjs                      # against http://localhost:5173
 *   node tools/measure.mjs --json               # machine-readable
 */

import { chromium } from "playwright";

const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:5173";
const AS_JSON = process.argv.includes("--json");
const [vw, vh] = (process.env.GPL_VIEWPORT ?? "1440x1024").split("x").map(Number);

/** Everything measurable about one rendered screen. */
const PROBE = () => {
  const rootRectOf = (el) => el.getBoundingClientRect();
  const root = document.querySelector("[data-work-area]") ?? document.body;
  const all = [...root.querySelectorAll("*")];
  const visible = all.filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  });

  /** Text nodes only, so a wrapper's text is not counted twice. */
  const ownText = (el) =>
    [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();

  const words = visible.reduce((n, el) => {
    const t = ownText(el);
    return n + (t ? t.split(/\s+/).filter(Boolean).length : 0);
  }, 0);

  const sizes = new Set();
  const weights = new Set();
  const colours = new Set();
  const fills = new Set();
  let inkArea = 0;

  for (const el of visible) {
    const cs = getComputedStyle(el);
    if (ownText(el)) {
      sizes.add(Math.round(parseFloat(cs.fontSize) * 10) / 10);
      weights.add(cs.fontWeight);
      colours.add(cs.color);
    }
    const bg = cs.backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
      fills.add(bg);
      const r = el.getBoundingClientRect();
      inkArea += r.width * r.height;
    }
  }

  /**
   * A REGION is what a player perceives as one box: a bordered or filled area ≥80×40
   * with no bordered-or-filled ancestor. The nested count (which an earlier version of
   * this tool reported) overstates badly — it counted every chip inside every card.
   */
  const boxy = (el) => {
    const cs = getComputedStyle(el);
    const bordered = parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0;
    const filled = cs.backgroundColor !== "rgba(0, 0, 0, 0)";
    const r = el.getBoundingClientRect();
    return (bordered || filled) && r.width > 80 && r.height > 40;
  };
  const nestedPanels = visible.filter(boxy).length;
  const topLevel = visible.filter((el) => {
    if (!boxy(el)) return false;
    for (let a = el.parentElement; a && a !== root; a = a.parentElement) if (boxy(a)) return false;
    return true;
  });
  // Declared regions win when content opts in; otherwise fall back to the DOM heuristic.
  const declared = [...document.querySelectorAll("[data-region]")].filter(
    (el) => el.getBoundingClientRect().height > 1,
  );
  const regionNames = declared.map((el) => el.getAttribute("data-region"));
  const regions = declared.length || topLevel.length;

  /** Air, by sampling rather than by summing overlapping rectangles. */
  let sampled = 0;
  let airPoints = 0;
  for (let y = rootRectOf(root).top + 12; y < rootRectOf(root).bottom; y += 24) {
    for (let x = rootRectOf(root).left + 12; x < rootRectOf(root).right; x += 24) {
      const el = document.elementFromPoint(x, y);
      if (!el) continue;
      sampled += 1;
      const cs = getComputedStyle(el);
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      const bg = cs.backgroundColor;
      const transparent = !bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent";
      if (!own && transparent) airPoints += 1;
    }
  }
  const air = sampled ? Math.round((airPoints / sampled) * 100) / 100 : 0;

  /** Words inside the decision object — the question and the option cards. */
  const decisionWords = [...document.querySelectorAll("[data-decision]")].reduce((n, el) => {
    const t = el.innerText?.trim();
    return n + (t ? t.split(/\s+/).filter(Boolean).length : 0);
  }, 0);

  /**
   * A station is a deliberate stop the layout forces. Counted as the number of distinct
   * PROMINENCE TIERS present, not the number of elements — three option titles are one
   * station, not three.
   *
   * Counted across the whole console, because the commit button is a station and it
   * lives in the action bar rather than on the desk. The fill test accepts either a
   * saturated hue or a dark solid: the brand used to be a saturated violet and is now
   * ink, and a probe that only recognises saturation was measuring the old design.
   */
  const consoleEls = [...document.querySelectorAll("body *")].filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none";
  });

  const tiers = new Set();
  for (const el of consoleEls) {
    const cs = getComputedStyle(el);
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (hasText) {
      const px = parseFloat(cs.fontSize);
      if (px >= 30) tiers.add("display");
      else if (px >= 22) tiers.add("title");
      else if (px >= 17) tiers.add("subtitle");
    }
    const r = el.getBoundingClientRect();
    const m = /^rgba?\((\d+), (\d+), (\d+)/.exec(cs.backgroundColor || "");
    if (!m || r.width * r.height < 2000) continue;
    const [rr, gg, bb] = [+m[1], +m[2], +m[3]];
    const mx = Math.max(rr, gg, bb);
    const mn = Math.min(rr, gg, bb);
    const lum = (0.2126 * rr + 0.7152 * gg + 0.0722 * bb) / 255;
    const saturated = mx > 40 && (mx - mn) / mx > 0.45;
    if (saturated || lum < 0.3) tiers.add("fill");
  }
  const stations = tiers.size;

  const targets = [...root.querySelectorAll("button, a[href], summary, [role='button']")].filter(
    (el) => el.getBoundingClientRect().width > 1,
  ).length;

  // Whole-console counts, for the numbers that are about the screen not the desk.
  const chromeWords = [...document.querySelectorAll("aside, header")].reduce((n, el) => {
    const t = el.innerText?.trim();
    return n + (t ? t.split(/\s+/).filter(Boolean).length : 0);
  }, 0);

  const rootRect = rootRectOf(root);
  const totalWords = words + chromeWords;

  return {
    words,
    chromeWords,
    totalWords,
    regions,
    regionNames,
    nestedPanels,
    stations,
    targets,
    air,
    decisionShare: totalWords ? Math.round((decisionWords / totalWords) * 100) / 100 : 0,
    typeSizes: [...sizes].sort((a, b) => a - b),
    fontWeights: [...weights].sort(),
    textColours: colours.size,
    fillColours: fills.size,
    inkRatio: Math.round((inkArea / (rootRect.width * rootRect.height)) * 100) / 100,
    workArea: { w: Math.round(rootRect.width), h: Math.round(rootRect.height) },
  };
};

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

  for (let step = 0; step < 90; step++) {
    await page.waitForTimeout(140);
    if ((await page.getByText("How it ended", { exact: true }).count()) > 0) {
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
   * The rubric from docs/DENSITY-FRAMEWORK.md §C. 100 points, pass ≥80, and any factor
   * scoring zero is a failure regardless of the total.
   *
   * Scored on the DECIDE screens only. The brief is a reading beat and is allowed to
   * carry more words; what it may not do is carry the options.
   */
  const FACTORS = [
    { id: "regions", wt: 18, get: (r) => r.regions, lo: 4, hi: 6 },
    { id: "words", wt: 16, get: (r) => r.totalWords, lo: 160, hi: 220 },
    { id: "air", wt: 12, get: (r) => r.air, lo: 0.35, hi: 0.65 },
    { id: "decisionShare", wt: 12, get: (r) => r.decisionShare, lo: 0.55, hi: 1 },
    { id: "typeSizes", wt: 6, get: (r) => r.typeSizes.length, lo: 3, hi: 5 },
    { id: "weights", wt: 4, get: (r) => r.fontWeights.length, lo: 2, hi: 3 },
    { id: "stations", wt: 10, get: (r) => r.stations, lo: 3, hi: 4 },
    { id: "fills", wt: 8, get: (r) => r.fillColours, lo: 1, hi: 5 },
    { id: "options", wt: 6, get: (r) => r.targets - 1, lo: 3, hi: 5 },
    { id: "targets", wt: 0, get: (r) => r.targets, lo: 3, hi: 9 },
  ];

  const worst = (f) => {
    const vals = decides.map(f.get);
    // Score the median screen, and report the range so outliers are visible.
    const sorted = [...vals].sort((a, b) => a - b);
    return {
      median: sorted[Math.floor(sorted.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
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
  );
  for (const r of rows) {
    console.log(
      pad(r.screen.slice(0, 43), 44),
      pad(r.totalWords, 6),
      pad(r.regions, 5),
      pad(r.air, 5),
      pad(r.decisionShare, 5),
      pad(r.stations, 4),
      pad(r.typeSizes.length, 6),
      pad(r.fillColours, 5),
    );
  }

  let score = 0;
  let maxScore = 0;
  const fails = [];
  console.log(`\nRUBRIC — ${decides.length} decide screens (median, with range)\n`);
  for (const f of FACTORS) {
    const { median, min, max } = worst(f);
    const span = f.hi - f.lo;
    const inBand = median >= f.lo && median <= f.hi;
    const near =
      !inBand && median >= f.lo - span * 0.25 && median <= f.hi + span * 0.25;
    const got = inBand ? f.wt : near ? f.wt / 2 : 0;
    score += got;
    maxScore += f.wt;
    if (f.wt > 0 && got === 0) fails.push(f.id);
    const mark = inBand ? "✓" : near ? "~" : "✗";
    console.log(
      ` ${mark} ${pad(f.id, 16)} ${pad(median, 7)} target ${pad(`${f.lo}–${f.hi}`, 10)} range ${pad(`${min}–${max}`, 12)} ${got}/${f.wt}`,
    );
  }

  const allSizes = [...new Set(decides.flatMap((r) => r.typeSizes))].sort((a, b) => a - b);
  const halfPixel = allSizes.filter((n) => n % 1 !== 0);
  console.log(`\n type sizes across the game: ${allSizes.join(", ")}`);
  if (halfPixel.length) console.log(` half-pixel sizes (banned): ${halfPixel.join(", ")}`);
  if (briefs.length) {
    const bw = briefs.map((r) => r.totalWords).sort((a, b) => a - b);
    console.log(` brief words: ${bw[0]}–${bw[bw.length - 1]}`);
  }

  console.log(`\nSCORE ${score}/${maxScore}  —  ${score >= 80 ? "PASS" : "FAIL"}`);
  if (fails.length) console.log(`zeroed factors (build failure): ${fails.join(", ")}`);
  console.log("");
}
main().catch((e) => {
  console.error("measure failed:", e.message);
  process.exit(1);
});
