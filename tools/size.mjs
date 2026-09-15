/**
 * Bundle size, as a gate.
 *
 * `CLAUDE.md` says "the whole bundle is 94 kB gzipped; keep it that way", and nothing
 * measured it, so nothing kept it that way. A documented budget with no instrument behind
 * it is a comment, and this one drifted by a third without anyone having to argue for the
 * bytes — which is the same failure as a rubric nobody scored (D-038), in a different
 * currency.
 *
 * Reported in three groups, because "the bundle" means different things to a reviewer and
 * to a player on hotel wifi:
 *
 *   code     the JS and CSS the browser must have before anything renders. This is the
 *            number the 94 kB budget is about, and the one the backlog quotes (114.67 +
 *            7.13 = 121.8 kB), so it is what the gate compares against.
 *   markup   index.html, which carries the inlined boot script.
 *   media    photography and fonts. Not in the code budget, but it is what a cohort
 *            actually downloads, so it is printed rather than ignored.
 *
 * The budget is NOT adjusted here. Backlog 7.1 replaces 22 upscaled photo crops with
 * inline SVG facsimiles (−130 kB WebP / +20 kB SVG) and is expected to retire most of the
 * overrun on its own, so renegotiating the number now would be paying for a fix twice.
 *
 *   node tools/size.mjs                  # read dist/, compare against the budget
 *   node tools/size.mjs --json
 */

import { gzipSync } from "node:zlib";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

/** Documented in CLAUDE.md. Do not move this to make a build pass. */
const BUDGET_KB = 94;

const DIST = path.resolve("dist");
const SRC = path.resolve("src");
const AS_JSON = process.argv.includes("--json");

/**
 * Level 9 — best-case gzip. Measured against Vite's own build summary it reads about
 * 0.3 kB lower on the JS bundle (119.04 against 119.34), because Vite gzips at the default
 * level; a real host at nginx defaults will land nearer Vite's figure and a host with
 * brotli will beat both. At a 32 kB overrun none of that changes the verdict, and the
 * best case is the right one to hold a budget against: if the kindest possible measurement
 * is over, it is over.
 */
const gz = (buf) => gzipSync(buf, { level: 9 }).length;

const CODE = new Set([".js", ".mjs", ".css"]);
const MARKUP = new Set([".html"]);
/**
 * WebP, woff2 and friends are already compressed, and gzipping them again adds bytes
 * rather than removing them — the first version of this report showed 15.61 kB of
 * photography becoming 15.63 kB, which is not a measurement of anything a server does.
 * For these, the transfer size IS the file size.
 */
const PRECOMPRESSED = new Set([".webp", ".woff2", ".woff", ".png", ".jpg", ".jpeg", ".avif", ".mp4", ".gz"]);

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

/** Newest mtime under a tree, for the staleness check. */
async function newest(dir) {
  let t = 0;
  for (const f of await walk(dir)) {
    const s = await stat(f);
    if (s.mtimeMs > t) t = s.mtimeMs;
  }
  return t;
}

async function main() {
  const files = await walk(DIST);
  if (files.length === 0) {
    console.error(
      `no build output in ${path.relative(process.cwd(), DIST)} — run \`npx vite build\` first`,
    );
    process.exit(1);
  }

  const assets = [];
  for (const f of files) {
    const buf = await readFile(f);
    const ext = path.extname(f).toLowerCase();
    assets.push({
      file: path.relative(DIST, f).split(path.sep).join("/"),
      group: CODE.has(ext) ? "code" : MARKUP.has(ext) ? "markup" : "media",
      raw: buf.length,
      /** What crosses the wire: gzipped if a server would gzip it, as-is if not. */
      gzip: PRECOMPRESSED.has(ext) ? buf.length : gz(buf),
      precompressed: PRECOMPRESSED.has(ext),
    });
  }
  assets.sort((a, b) => b.gzip - a.gzip);

  const sum = (group) =>
    assets.filter((a) => (group ? a.group === group : true)).reduce((n, a) => n + a.gzip, 0);
  const kb = (n) => (n / 1000).toFixed(2);
  const code = sum("code");
  const over = code - BUDGET_KB * 1000;

  if (AS_JSON) {
    console.log(
      JSON.stringify(
        {
          budgetKb: BUDGET_KB,
          codeGzip: code,
          markupGzip: sum("markup"),
          mediaGzip: sum("media"),
          totalGzip: sum(),
          overBudgetBytes: over,
          pass: over <= 0,
          assets,
        },
        null,
        2,
      ),
    );
    process.exit(over > 0 ? 1 : 0);
  }

  /* A size report on a stale build is worse than no size report, because it reads as a
     measurement of what you just changed. */
  const distTime = await newest(DIST);
  const srcTime = await newest(SRC);
  if (srcTime > distTime) {
    console.log(
      `\n⚠ src/ is newer than dist/ — these numbers are from an earlier build. Run \`npx vite build\`.`,
    );
  }

  console.log(
    `\n${path.relative(process.cwd(), DIST)} — transfer size (gzip level 9; · = already compressed)\n`,
  );
  const pad = (s, n) => String(s).padEnd(n);
  const lpad = (s, n) => String(s).padStart(n);
  for (const group of ["code", "markup", "media"]) {
    const rows = assets.filter((a) => a.group === group);
    if (!rows.length) continue;
    console.log(` ${group}`);
    for (const a of rows) {
      console.log(
        `   ${pad(a.file, 40)} ${lpad(kb(a.raw), 9)} kB ${a.precompressed ? "·" : "→"} ${lpad(kb(a.gzip), 8)} kB`,
      );
    }
    console.log(`   ${pad("", 40)} ${lpad("", 9)}      ${lpad(kb(sum(group)), 8)} kB\n`);
  }

  const art = assets.filter((a) => a.group === "media" && a.file.startsWith("art/"));
  const fonts = assets.filter((a) => a.group === "media" && a.file.startsWith("fonts/"));
  const tot = (rows) => rows.reduce((n, a) => n + a.gzip, 0);

  console.log(` code (JS + CSS)   ${lpad(kb(code), 8)} kB   budget ${BUDGET_KB} kB`);
  console.log(` markup            ${lpad(kb(sum("markup")), 8)} kB`);
  console.log(` photography       ${lpad(kb(tot(art)), 8)} kB   ${art.length} files`);
  console.log(` fonts             ${lpad(kb(tot(fonts)), 8)} kB   ${fonts.length} files`);
  console.log(` everything        ${lpad(kb(sum()), 8)} kB   what a player downloads on a cold visit`);

  if (over > 0) {
    const pct = Math.round((over / (BUDGET_KB * 1000)) * 100);
    console.log(
      `\n✗ OVER BUDGET by ${kb(over)} kB (${pct}%) — ${kb(code)} kB of code against ${BUDGET_KB} kB documented in CLAUDE.md`,
    );
    /**
     * Said plainly, because the backlog currently expects this overrun to be retired by
     * something that cannot retire it. 7.1 replaces the photo crops with inline SVG
     * facsimiles and claims it "also retires 2.6": the photographs are media, and
     * facsimiles authored in content land INSIDE the JS bundle, so that trade takes the
     * measured photography weight off a cold visit and pushes the code number the wrong
     * way. Both are worth doing. They are not the same budget.
     */
    console.log(
      `  Not a licence to move the number — but note what this overrun is not.` +
        `\n  Backlog 7.1 (22 photo crops → inline SVG facsimiles) takes ${kb(tot(art))} kB off` +
        `\n  PHOTOGRAPHY, and authoring facsimiles in content adds to the CODE bundle, which is` +
        `\n  what the ${BUDGET_KB} kB budget measures. The code overrun needs its own answer.`,
    );
    process.exit(1);
  }
  console.log(`\n✓ within budget — ${kb(code)} kB of ${BUDGET_KB} kB\n`);
}

main().catch((e) => {
  console.error("size failed:", e.message);
  process.exit(1);
});
