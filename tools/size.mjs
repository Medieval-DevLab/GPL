/**
 * Bundle size, as a gate.
 *
 * `CLAUDE.md` says "the whole bundle is 94 kB gzipped; keep it that way", and nothing
 * measured it, so nothing kept it that way. A documented budget with no instrument behind
 * it is a comment, and this one drifted by a third without anyone having to argue for the
 * bytes — which is the same failure as a rubric nobody scored (D-038), in a different
 * currency.
 *
 * Reported by delivery group, because "the bundle" means different things to a reviewer
 * and to a player on hotel wifi:
 *
 *   code     the JS and CSS the browser must have before anything renders.
 *   markup   index.html, which carries the inlined boot script.
 *   media    photography and fonts. Not in the code budget, but it is what a cohort
 *            actually downloads, so it is printed rather than ignored.
 *
 * AND, when a sourcemap is present, by ORIGIN — framework, interface, engine, content.
 * That second split is where the budgets now live, and `BUDGETS_KB` explains why: one
 * number over everything had been red for a long while and was pointing at the wrong
 * thing, because two thirds of it is React.
 *
 *   npx vite build --sourcemap && node tools/size.mjs   # with the origin split
 *   node tools/size.mjs                                 # totals only
 *   node tools/size.mjs --json
 */

import { gzipSync } from "node:zlib";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Four budgets, replacing the single 94 kB — D-070, and the reasoning matters more than
 * the numbers.
 *
 * 94 kB was one figure over JS + CSS together, and it had been red for a long time
 * (171 kB) while pointing at the wrong thing. Attributing the bundle by sourcemap showed
 * why: React is ~65 kB of it, which is 69% of the old budget spent before a line of this
 * project runs. Whoever read "82% over" went looking for bloated components, and the
 * components are not where it is.
 *
 * So the split is not a licence granted to make a build pass. Each number below is the
 * measured figure plus stated headroom, and the two that can actually regress are held
 * tight:
 *
 *   framework  a dependency choice, not drift. It moves when someone swaps React, which
 *              is a decision with a name, not an accident. Preact is ~4 kB against ~65
 *              and would put the whole thing near the original 94 — rejected for now as
 *              a real migration bought to reach a number we chose ourselves.
 *   interface  ours, and the one most likely to creep. Was ~46 kB across a dozen screen
 *              types with 58 allowed. The October rebuild (D-077) moved composition out of
 *              components and into the stylesheet: measured 21.0 kB, so 27 (~28% headroom).
 *              D-091: 33 — the lever panel, the act-break map, three system views and the
 *              deal chart are new screens the strategy requires (32.5 kB measured, ~1.5% headroom).
 *   stylesheet was 14 on a ~8 kB sheet that painted one page template. The rebuild ships
 *              fourteen distinct compositions; measured 16.1 kB, so 18 (~12% headroom).
 *              D-084: 22 — the journey map is a new screen type (19.0 kB measured), and
 *              the per-act system views in STRATEGY.md will each add one.
 *              Interface + stylesheet together are now capped at 45 kB, down from 72 —
 *              the presentation budget got tighter, it moved between columns.
 *   engine     ours, and small. ~7 kB; 12 is generous and will still catch a blunder.
 *   content    THE PRODUCT. Reported, never capped. A budget on the writing is a budget
 *              on how much the game can teach, and the day that number blocks a build is
 *              the day somebody deletes a mission to go green.
 *
 * Code-splitting is not available as a lever: the build ships one iife chunk behind a
 * classic script so `dist/` opens from `file://` inside an LMS, and `vite.config.ts`
 * throws if a dynamic import makes Rollup emit a second chunk.
 */
const BUDGETS_KB = { framework: 70, interface: 33, engine: 12, stylesheet: 22 };
/** Only feeds the coarse guard used when no sourcemap exists; the real gate is per group. */
const BUDGET_KB = BUDGETS_KB.framework + BUDGETS_KB.interface + BUDGETS_KB.engine;

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

/* ─────────────────────── where the code weight actually is ───────────────────────
 * A single "code: 171 kB against 94" sends whoever reads it to refactor components, and
 * on this build that is the wrong place to look. So when a sourcemap is present the
 * bundle's bytes are attributed to the modules they came from.
 *
 *   npx vite build --sourcemap && node tools/size.mjs
 *
 * Without one, the flat number is still printed — the attribution is a diagnostic, not a
 * precondition, and `dist/` must not ship `.map` files to an LMS.
 *
 * The gzip column is the group's share of the real gzipped total, which is an estimate
 * and slightly unkind to prose: English compresses better than minified JS, so content's
 * true share is a little lower than shown and the framework's a little higher. Good to
 * about a kilobyte, which is the resolution the question needs.
 */
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeVlq(segment) {
  const out = [];
  let shift = 0;
  let value = 0;
  for (const ch of segment) {
    const d = B64.indexOf(ch);
    if (d < 0) return out;
    value += (d & 31) << shift;
    if (d & 32) {
      shift += 5;
    } else {
      out.push(value & 1 ? -(value >> 1) : value >> 1);
      value = 0;
      shift = 0;
    }
  }
  return out;
}

/** Which part of the project a source path belongs to. */
function originOf(src) {
  if (src.includes("node_modules")) return "framework";
  if (src.includes("/content/")) return "content";
  if (src.includes("/engine/")) return "engine";
  if (src.includes("/ui/") || src.endsWith("App.tsx")) return "interface";
  return "other";
}

/** Generated bytes per origin, or null when no sourcemap was built. */
async function attribute(jsPath) {
  let map;
  try {
    map = JSON.parse(await readFile(jsPath + ".map", "utf8"));
  } catch {
    return null;
  }
  const code = await readFile(jsPath, "utf8");

  const lineStart = [0];
  for (let i = 0; i < code.length; i++) if (code[i] === "\n") lineStart.push(i + 1);

  const points = [];
  let srcIndex = 0;
  map.mappings.split(";").forEach((segs, line) => {
    let col = 0;
    if (!segs) return;
    for (const seg of segs.split(",")) {
      if (!seg) continue;
      const v = decodeVlq(seg);
      if (v.length === 0) continue;
      col += v[0];
      if (v.length >= 4) {
        srcIndex += v[1];
        points.push({ at: (lineStart[line] ?? 0) + col, srcIndex });
      }
    }
  });
  if (points.length === 0) return null;
  points.sort((a, b) => a.at - b.at);

  /* Bytes from one mapping to the next belong to the source that mapping points at. */
  const byOrigin = new Map();
  const bySource = new Map();
  for (let i = 0; i < points.length; i++) {
    const end = i + 1 < points.length ? points[i + 1].at : code.length;
    const n = Math.max(0, end - points[i].at);
    const src = map.sources[points[i].srcIndex] ?? "?";
    byOrigin.set(originOf(src), (byOrigin.get(originOf(src)) ?? 0) + n);
    bySource.set(src, (bySource.get(src) ?? 0) + n);
  }
  return { byOrigin, bySource, raw: code.length, gzip: gz(Buffer.from(code)) };
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
    /* A sourcemap is a measuring instrument, not a shipped asset — `npm run build` does
       not emit one, and counting the ones from a `--sourcemap` diagnostic run would make
       the cold-visit total wrong by half a megabyte in the direction of alarm. */
    if (f.endsWith(".map")) continue;
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

  /* Where the code weight is, when a sourcemap was built. See `attribute`. */
  const biggestJs = assets
    .filter((a) => a.file.endsWith(".js"))
    .sort((a, b) => b.raw - a.raw)[0];
  const split = biggestJs ? await attribute(path.join(DIST, biggestJs.file)) : null;
  const overByGroup = [];
  if (split) {
    const total = [...split.byOrigin.values()].reduce((n, x) => n + x, 0);
    console.log(` where the JS comes from   gz kB (est)     budget`);
    for (const [origin, n] of [...split.byOrigin.entries()].sort((a, b) => b[1] - a[1])) {
      const gzip = split.gzip * (n / total);
      const cap = BUDGETS_KB[origin];
      /* Content is reported and never capped — see the note on `BUDGETS_KB`. A budget on
         the writing is a budget on how much the game can teach. */
      const verdict =
        cap === undefined
          ? origin === "content"
            ? "the product, not capped"
            : ""
          : gzip > cap * 1000
            ? `OVER ${cap} kB by ${kb(gzip - cap * 1000)}`
            : `${cap} kB — ${kb(cap * 1000 - gzip)} spare`;
      console.log(`   ${pad(origin, 22)} ${lpad(kb(gzip), 10)}   ${verdict}`);
      if (cap !== undefined && gzip > cap * 1000) overByGroup.push(origin);
    }
    console.log("");
  }

  const css = assets.filter((a) => a.file.endsWith(".css")).reduce((n, a) => n + a.gzip, 0);
  if (css > BUDGETS_KB.stylesheet * 1000) overByGroup.push("stylesheet");

  console.log(` stylesheet        ${lpad(kb(css), 8)} kB   budget ${BUDGETS_KB.stylesheet} kB`);
  console.log(` code (JS + CSS)   ${lpad(kb(code), 8)} kB   all of the above plus content`);
  console.log(` markup            ${lpad(kb(sum("markup")), 8)} kB`);
  console.log(` photography       ${lpad(kb(tot(art)), 8)} kB   ${art.length} files`);
  console.log(` fonts             ${lpad(kb(tot(fonts)), 8)} kB   ${fonts.length} files`);
  console.log(` everything        ${lpad(kb(sum()), 8)} kB   what a player downloads on a cold visit`);

  /**
   * THE GATE IS THE GROUPS, NOT THE TOTAL, and that distinction is the whole of D-070.
   *
   * A single figure over everything necessarily includes the writing, so it grows every
   * time the game teaches more and the only way back to green is to delete content.
   * That is exactly the pressure a budget must not create here. Each group that can
   * regress carries its own cap; content is reported and never capped.
   *
   * With no sourcemap there is nothing to check per group, so a deliberately generous
   * flat guard stands in against a sudden doubling.
   */
  if (split) {
    if (overByGroup.length > 0) {
      console.log(`
✗ OVER BUDGET — ${overByGroup.join(", ")}`);
      console.log(
        `  Each group carries its own cap for a reason; see BUDGETS_KB. Before reaching` +
          `
  for the components: the framework is a dependency choice rather than drift,` +
          `
  and the only lever on it is a smaller runtime. Code-splitting is unavailable,` +
          `
  because the build ships one iife chunk so dist/ opens from file:// in an LMS.
`,
      );
      process.exit(1);
    }
    console.log(`
✓ every capped group is inside its budget; content is reported, not capped
`);
    return;
  }

  const coarse = BUDGET_KB * 1000 + 80_000;
  if (code > coarse) {
    console.log(
      `
✗ ${kb(code)} kB of code, past the ${kb(coarse)} kB no-sourcemap guard.` +
        `
  For where the weight is: npx vite build --sourcemap && node tools/size.mjs
`,
    );
    process.exit(1);
  }
  console.log(
    `
✓ ${kb(code)} kB of code, inside the coarse guard. Per-group budgets need a` +
      `
  sourcemap: npx vite build --sourcemap && node tools/size.mjs
`,
  );
}

main().catch((e) => {
  console.error("size failed:", e.message);
  process.exit(1);
});
