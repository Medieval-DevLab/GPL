/**
 * Does the probe's station counter work?
 *
 * D-037 is three gates written for a specific bug that could not see it, and the station
 * factor was a fourth of the same family: it counted four prominence tiers against a
 * documented band of **5 (max 6)**, so the factor could not report a pass at all — and
 * rather than fix the instrument, the band was retuned to 3–4 to fit what the instrument
 * could produce. D-038 recorded that as the mistake and D-033 had already closed with "the
 * numbers should not move to accommodate a screen that fails them".
 *
 * A fixed instrument therefore needs its own evidence, and measuring the live build cannot
 * supply it: the build has ONE station on its decide screens, so a detector that always
 * returned 1 would agree with every observation. This runs the real `PROBE`, unmodified,
 * against synthetic pages whose station count is known by construction — a five-station
 * layer cake, a six, a seven, and the four specific ways the count could be wrong.
 *
 *   node tools/probe-selftest.mjs
 *
 * No dev server needed. Exits non-zero on the first disagreement.
 */

import { chromium } from "playwright";
import { PROBE } from "./lib/probe.mjs";

/**
 * One station: a full-width band with a prominent mark in it, separated from its
 * neighbours by §B's 24px air step. `gap` is a parameter so a case can put two marks
 * closer than the step and check they merge into one stop.
 */
const station = (label, { px = 24, gap = 40, fill = null } = {}) =>
  fill
    ? `<div style="margin-top:${gap}px;width:600px;height:48px;background:${fill}"></div>`
    : `<div style="margin-top:${gap}px"><p style="font-size:${px}px;margin:0">${label}</p></div>`;

const page = (body) => `<!doctype html><html><body style="margin:0;font-size:13px">
<div data-console style="width:1200px">
  <header><p style="font-size:32px;margin:0">FURNITURE — a 32px header that is not a station</p></header>
  <div style="display:flex">
    <aside style="width:240px"><p style="font-size:28px;margin:0">RAIL — not a station either</p></aside>
    <main data-work-area style="width:900px">${body}</main>
  </div>
</div></body></html>`;

const CASES = [
  {
    name: "five stacked stations — the §B layer cake",
    body: [
      station("What is true", { px: 32 }),
      station("What is pressing", { px: 20 }),
      station("The question", { px: 24 }),
      station("An option title", { px: 19 }),
      station("", { fill: "rgb(30,26,44)" }),
    ].join(""),
    stations: 5,
  },
  {
    name: "six is the hard max, and must be distinguishable from five",
    body: Array.from({ length: 6 }, (_, i) => station(`Station ${i + 1}`, { px: 24 })).join(""),
    stations: 6,
  },
  {
    name: "seven must read as over the max, not clamp to it",
    body: Array.from({ length: 7 }, (_, i) => station(`Station ${i + 1}`, { px: 24 })).join(""),
    stations: 7,
  },
  {
    name: "four option titles side by side are ONE stop, not four",
    body:
      station("The question", { px: 24 }) +
      `<div style="margin-top:40px;display:flex;gap:16px">${Array.from(
        { length: 4 },
        (_, i) => `<p style="font-size:19px;margin:0;width:200px">Option ${i + 1}</p>`,
      ).join("")}</div>`,
    stations: 2,
  },
  {
    name: "two marks 8px apart are one stop — §B's step is 24px between, 8px within",
    body: station("Heading", { px: 24 }) + station("Subheading", { px: 19, gap: 8 }),
    stations: 1,
  },
  {
    name: "18px type is not a station, because §A's threshold is 19px",
    body: station("Nearly prominent", { px: 18 }) + station("Also nearly", { px: 18 }),
    stations: 0,
  },
  {
    name: "a transparent background is not a dark accent fill",
    body: `<div style="width:600px;height:400px;background:rgba(0,0,0,0)"></div>`,
    stations: 0,
  },
  {
    name: "a pale tint is not an accent fill — it is neither saturated nor dark",
    body: station("", { fill: "rgb(230,220,255)" }),
    stations: 0,
  },
  {
    name: "a full-bleed dark ground is not a station, and must not swallow the ones inside it",
    body: `<div style="background:rgb(20,18,31);padding:1px">${[
      station("Inside one", { px: 32 }),
      station("Inside two", { px: 24 }),
      station("Inside three", { px: 19 }),
    ].join("")}</div>`,
    stations: 3,
  },
  {
    name: "the header and the rails are furniture, whatever size their type is",
    body: station("The only station", { px: 32 }),
    stations: 1,
  },
];

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1440, height: 2400 } });

let failed = 0;
for (const c of CASES) {
  await tab.setContent(page(c.body));
  const probed = await tab.evaluate(PROBE);
  const ok = probed.stations === c.stations;
  if (!ok) failed += 1;
  console.log(
    `${ok ? " ✓" : " ✗"} ${String(probed.stations).padStart(2)} (want ${c.stations})  ${c.name}`,
  );
  if (!ok) for (const label of probed.stationLabels) console.log(`      ${label}`);
}

await browser.close();
console.log(
  failed
    ? `\n${failed} of ${CASES.length} station cases disagree — the factor is measuring something else.\n`
    : `\nall ${CASES.length} station cases agree.\n`,
);
process.exit(failed ? 1 : 0);
