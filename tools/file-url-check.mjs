/**
 * Does the built game actually run from `file://`?
 *
 * Backlog 8.1 found that it did not: ES module CORS rules make a browser refuse a
 * `<script type="module" src="...">` loaded from a file URL, so `dist/index.html` opened
 * off a shared drive or unzipped out of a SCORM package was a blank page. The fix was to
 * inline the module. Nothing has re-checked it since, and it is the kind of thing that
 * breaks silently the moment a build setting changes — the dev server and `npm run
 * preview` both serve over HTTP and would never show it.
 *
 * This is the deployment target, not a nicety: a locked-down LMS may unzip the package
 * and open `index.html` directly, and a corporate shared drive certainly will.
 *
 *   npm run build && node tools/file-url-check.mjs
 *
 * It asserts the game reaches an interactive title screen, not merely that something
 * rendered — a blank page with no console error would otherwise pass.
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

const url = pathToFileURL(INDEX).href;
const browser = await chromium.launch();
const page = await browser.newPage();

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(url);
/* The title screen's primary action. If the module never executed, this never appears —
   which is precisely the 8.1 failure, and it arrives with no visible error of its own. */
const started = await page
  .getByRole("button")
  .first()
  .waitFor({ state: "visible", timeout: 15000 })
  .then(() => true)
  .catch(() => false);

const heading = started ? (await page.locator("h1").first().innerText().catch(() => "")).trim() : "";
await browser.close();

console.log(`\n  ${url}`);

/* A CORS refusal on a module script is reported by the browser as an error whose text
   varies by engine, so the interactive check above is the real gate and this is detail
   for whoever has to fix it. */
const fatal = errors.filter((e) => !/favicon|net::ERR_FILE_NOT_FOUND.*favicon/i.test(e));

if (!started) {
  console.error(`\n✗ the game did not start from a file URL — this is backlog 8.1 regressing`);
  if (fatal.length) fatal.forEach((e) => console.error(`    ${e}`));
  else console.error("    no console error either, which is exactly how 8.1 presented");
  process.exit(1);
}

if (fatal.length) {
  console.error(`\n✗ started, but the console is not clean from a file URL:`);
  fatal.forEach((e) => console.error(`    ${e}`));
  process.exit(1);
}

console.log(`\n✓ runs from file:// — reached "${heading}", console clean`);
console.log("  so dist/ works unzipped on a shared drive and inside an LMS that does the same\n");
