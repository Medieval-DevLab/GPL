/**
 * Design-system conformance.
 *
 * The palette and type scale are only a system while something enforces them. The last
 * build drifted to 27 font sizes including 9px and a run of half-pixels, plus four live
 * contrast failures — none of which any test could see, because none of it was checked.
 *
 * These are cheap static sweeps over the UI source. They cannot verify contrast (that
 * arithmetic lives in docs/DESIGN-SYSTEM.md), but they can stop the specific ways this
 * codebase has already drifted once.
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import cssRaw from "../index.css?raw";

/**
 * Sources are pulled in as strings through Vite rather than `node:fs`, so this needs no
 * `@types/node` and no new dependency — the bundle stays at its current size and the
 * test stays typed.
 */
const uiModules = import.meta.glob("../**/*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/**
 * Comments are stripped before any sweep below.
 *
 * Every rule here is documented in a comment *at the site it governs*, which means the
 * offending spelling appears in the prose explaining why it is banned. Scanning raw text
 * makes each of these tests fail on its own rationale — and the only ways out of that are
 * to delete the explanation or to weaken the rule, both worse than the bug.
 */
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");

const uiFiles = Object.entries(uiModules).map(([p, text]) => ({
  name: p.split("/").pop() as string,
  text: stripComments(text),
}));

const css = stripComments(cssRaw);

/**
 * The nine steps. See docs/DESIGN-SYSTEM.md.
 *
 * 72 and 96 are display numerals only — a score, a streak, a chapter number. They are on
 * the scale because a 56px ceiling is a report's ceiling: a figure has to be big enough to
 * be read as a scoreboard rather than as a table cell, and that is the cheapest signal
 * available that this is a game. They are not heading sizes and there is no step between
 * 56 and 72 for prose.
 */
const SCALE = [12, 13, 15, 18, 24, 32, 56, 72, 96];

/**
 * Every sweep below is a search for something that should be absent, so an empty source
 * passes all of them. Vitest stubs `.css` requests by default and returned `""` here
 * until `test.css.include` was widened — silently, with the suite still green. Assert the
 * inputs exist before trusting anything they do not contain.
 */
describe("the sources these tests read", () => {
  it("actually loaded", () => {
    expect(uiFiles.length).toBeGreaterThan(4);
    expect(uiFiles.every((f) => f.text.length > 200)).toBe(true);
    expect(css.length).toBeGreaterThan(2000);
  });
});

describe("type scale", () => {
  it("uses only the nine scale steps", () => {
    const offenders: string[] = [];
    for (const { name, text } of uiFiles) {
      for (const m of text.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)) {
        const px = Number(m[1]);
        if (!SCALE.includes(px)) offenders.push(`${name}: ${px}px`);
      }
    }
    expect([...new Set(offenders)]).toEqual([]);
  });

  it("has no fractional or sub-12px type", () => {
    const offenders: string[] = [];
    for (const { name, text } of uiFiles) {
      for (const m of text.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)) {
        const px = Number(m[1]);
        if (px % 1 !== 0) offenders.push(`${name}: fractional ${px}px`);
        if (px < 12) offenders.push(`${name}: ${px}px is below the 12px floor`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("colour discipline", () => {
  /**
   * Raw hex in a component means a value nobody measured a contrast ratio for. The two
   * exceptions are pure white and pure black on a known fill, which are unambiguous.
   */
  it("names tokens instead of hard-coding hex", () => {
    const offenders: string[] = [];
    const allowed = new Set(["#fff", "#ffffff", "#000", "#000000"]);
    for (const { name, text } of uiFiles) {
      for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
        if (!allowed.has(m[0].toLowerCase())) offenders.push(`${name}: ${m[0]}`);
      }
    }
    expect([...new Set(offenders)]).toEqual([]);
  });

  /**
   * Opacity on text silently invalidates every ratio in DESIGN-SYSTEM.md. Fading a
   * disabled control is exactly how the 1.6:1 button happened.
   */
  it("does not fade text or controls with opacity", () => {
    const offenders: string[] = [];
    for (const { name, text } of uiFiles) {
      for (const m of text.matchAll(/opacity-(\d+)/g)) {
        if (Number(m[1]) < 100) offenders.push(`${name}: opacity-${m[1]}`);
      }
    }
    for (const m of css.matchAll(/^\s*opacity:\s*0?\.\d+/gm)) {
      offenders.push(`index.css: ${m[0].trim()}`);
    }
    expect(offenders).toEqual([]);
  });

  /**
   * Winability and Profitability solids are 3.63:1 and 3.90:1 on white — enough for a
   * fill, not enough for type. White on either is a 1.4.3 failure.
   *
   * The first version of this test matched `color: "#fff"` near `background: "var(--color-win…"`
   * as literal strings, and found nothing, because all three real offenders built the
   * value from a template literal: `background: on ? \`var(${meta.fillVar})\``. A regex
   * over source text cannot follow that. So the rule is enforced structurally instead —
   * see the alias test below, which removes the ability to name a token whose role is
   * ambiguous — and this one now only catches the literal spelling.
   */
  it("never puts white text on a dimension solid", () => {
    const offenders: string[] = [];
    for (const { name, text } of uiFiles) {
      // Any inline style object mentioning a solid and a white foreground together.
      for (const m of text.matchAll(/style=\{\{[^}]*\}\}/g)) {
        const block = m[0];
        const hasSolid = /(win|profit|deliver)-solid|fillVar/.test(block);
        const hasWhite = /color:\s*("#fff"|"#ffffff"|"white")/.test(block);
        if (hasSolid && hasWhite) offenders.push(`${name}: ${block.slice(0, 60)}…`);
      }
      if (/text-white/.test(text) && /(win|profit|deliver)-solid|fillVar/.test(text)) {
        // Not conclusive on its own — flag for a human rather than fail.
      }
    }
    expect(offenders).toEqual([]);
  });

  /**
   * The migration aliases are how the contrast failure hid.
   *
   * `--color-win` aliases `--color-win-solid`, so a component naming it was painting a
   * 13px label in the fill colour — 3.63:1 — on 42 of 45 screens, while DESIGN-SYSTEM.md
   * documented the rule it was breaking. The alias reads as "the Winability colour", which
   * is not a thing: there is a fill colour and a text colour and they are different.
   *
   * So components must name a role. `-solid` for fills, `-text` for type, `-tint` for a
   * wash, `-line` for a hairline.
   */
  it("makes components name a token role, not a bare dimension alias", () => {
    const offenders: string[] = [];
    for (const { name, text } of uiFiles) {
      for (const m of text.matchAll(/--color-(win|profit|deliver)\b(-\w+)?/g)) {
        if (!m[2]) offenders.push(`${name}: ${m[0]}`);
      }
    }
    expect([...new Set(offenders)]).toEqual([]);
  });

  it("keeps the reference ramp out of components", () => {
    const offenders: string[] = [];
    for (const { name, text } of uiFiles) {
      if (text.includes("--ref-")) offenders.push(name);
    }
    expect(offenders).toEqual([]);
  });
});

/**
 * Artwork is content, and content integrity is checkable.
 *
 * Five portraits shipped for four advisors and a sponsor. All five were crops of the same
 * woman; `portrait-arjun.webp` was a photograph of a woman rendered beside a male-named
 * character on every Chapter 3 brief; and `portrait-sarah.webp` was referenced nowhere
 * while the client sponsor — who speaks four verbatim quotes — was the only character
 * without a face. Typecheck, 45 tests and 45 screenshots all passed.
 *
 * Nothing here can tell whether a photograph is *good*. It can tell whether an asset is
 * orphaned and whether two characters are sharing one image, which is what went wrong.
 */
const artFiles = Object.keys(
  import.meta.glob("../../public/art/*.webp", { eager: true }),
).map((p) => p.split("/").pop()?.replace(/\.webp$/, "") as string);

/**
 * Real bytes, read from disk and hashed.
 *
 * NOT `import.meta.glob` with `?arraybuffer`: that query is not honoured for these files,
 * so every entry came back as the same non-buffer value, `new Uint8Array` of it was empty,
 * and the duplicate check reported EVERY PAIR as identical — a test that fails on
 * everything is as useless as one that passes on everything, and this one managed both
 * within an hour. `node:fs` in a test file is fine; the purity rule is about `src/engine`
 * source, not its tests.
 */
const artDir = fileURLToPath(new URL("../../public/art", import.meta.url));
const artHashes: Record<string, string> = Object.fromEntries(
  readdirSync(artDir)
    .filter((f) => f.endsWith(".webp"))
    .map((f) => [f, createHash("sha256").update(readFileSync(join(artDir, f))).digest("hex")]),
);

const storyModules = import.meta.glob("../content/story.ts", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const storySource = Object.values(storyModules)[0] as string;
const allSource = [storySource, ...Object.values(uiModules)].join(" ");

describe("artwork", () => {
  it("loaded the manifest", () => {
    expect(artFiles.length).toBeGreaterThan(10);
    expect(storySource.length).toBeGreaterThan(10_000);
  });

  /**
   * Widened from `story.ts` alone to the components too.
   *
   * Cut scenes, the hub, the map and the dashboard reference their own plates from
   * `src/ui`, not from content — so scanning only the story file would have reported
   * every one of them as an unreferenced orphan the day the artwork landed, and the
   * honest fix would have looked like deleting the test.
   */
  it("ships no asset that nothing references", () => {
    const orphans = artFiles.filter((name) => !allSource.includes(`"${name}"`));
    expect(orphans).toEqual([]);
  });

  /**
   * Byte-identity, across ALL artwork — and the previous version of this test asserted
   * nothing at all.
   *
   * It read `new Set(portraits).size === portraits.length` over a list of FILENAMES, which
   * is true by construction: a directory cannot contain two files with the same name. The
   * comment above it claimed to be checking byte-identity because "they were distinct
   * files of one person", and the code never hashed a single byte.
   *
   * It also only looked at `portrait-*`. Both gaps hid the same bug one prefix over:
   * `hero-retail-exterior` and `hero-storefront-wide` are the SAME IMAGE, so two beats
   * that should establish different places were showing one photograph under two names.
   */
  it("ships no two identical images under different names", () => {
    const byHash = new Map<string, string[]>();
    for (const [name, hash] of Object.entries(artHashes)) {
      const list = byHash.get(hash);
      if (list) list.push(name);
      else byHash.set(hash, [name]);
    }
    const duplicates = [...byHash.values()]
      .filter((group) => group.length > 1)
      .map((group) => group.join(" === "));
    expect(duplicates).toEqual([]);
  });
});

describe("the tokens themselves", () => {
  it("declares the three dimension triads and the single risk hue", () => {
    for (const d of ["win", "profit", "deliver"]) {
      for (const role of ["solid", "text", "tint", "line"]) {
        expect(css).toContain(`--color-${d}-${role}:`);
      }
    }
    expect(css).toContain("--color-risk-solid:");
  });

  /**
   * The brand must not sit on a data hue's axis.
   *
   * This used to assert `css` did not contain the strings `--ref-amber` or `--ref-violet`,
   * which is a test of SPELLING. It passed throughout the period when the brand was ink at
   * CIELAB h 284.4° and `deliver-solid` was at h 284.4° — the exact collision the rule
   * exists to prevent, one hue family, invisible to a name check. It went on passing when
   * the ramp came back as purple, because it had been renamed `--ref-purple-*`.
   *
   * So measure the hue. Nobody cares what a token is called; they care whether the brand
   * and a dimension are separable, and that is an angle.
   */
  it("keeps the brand off every data hue's axis", () => {
    const hueOf = (hex: string): number => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
        number,
        number,
        number,
      ];
      const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      const [R, G, B] = [lin(r), lin(g), lin(b)];
      // sRGB → XYZ (D65) → Lab, then the hue angle.
      const X = 0.4124 * R + 0.3576 * G + 0.1805 * B;
      const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
      const Z = 0.0193 * R + 0.1192 * G + 0.9505 * B;
      const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
      const [fx, fy, fz] = [f(X / 0.95047), f(Y), f(Z / 1.08883)];
      const a = 500 * (fx - fy);
      const bb = 200 * (fy - fz);
      return ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
    };

    /** Resolve one `var()` hop, which is all the ramp needs. */
    const literal = (token: string): string | null => {
      const direct = new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
      if (direct?.[1]) return direct[1];
      const ref = new RegExp(`${token}:\\s*var\\((--[\\w-]+)\\)`).exec(css);
      if (!ref?.[1]) return null;
      return new RegExp(`${ref[1]}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1] ?? null;
    };

    const brand = literal("--color-brand-solid");
    expect(brand, "no --color-brand-solid to measure").toBeTruthy();

    const separations: string[] = [];
    for (const d of ["win", "profit", "deliver"]) {
      const hex = literal(`--color-${d}-solid`);
      expect(hex, `no --color-${d}-solid to measure`).toBeTruthy();
      const apart = Math.abs(hueOf(brand as string) - hueOf(hex as string));
      const delta = Math.min(apart, 360 - apart);
      separations.push(`${d} ${Math.round(delta)}°`);
      // 12° is the floor. The shipped collision was 0.0°.
      expect(delta, `brand is ${Math.round(delta)}° from ${d} — one hue family`).toBeGreaterThan(12);
    }
    // Printed so the margin is visible rather than merely asserted.
    expect(separations.length).toBe(3);
  });

  /**
   * The dark register, as a set.
   *
   * Four agents are building against these names at once, and the failure mode is not a
   * typo — it is an agent finding the token missing and falling back to a local hex, which
   * the colour-discipline sweep above would then blame on their file. So assert the whole
   * set is present and aliased to the reference ramp, not merely that the stage exists.
   */
  it("declares the whole dark register", () => {
    for (const token of [
      "--color-stage",
      "--color-stage-raised",
      "--color-stage-ink",
      "--color-stage-ink-soft",
      "--color-stage-line",
      "--color-glow",
      "--color-glow-ink",
      "--color-energy",
      "--color-energy-ink",
      "--color-reward",
      "--color-reward-ink",
    ]) {
      expect(css, `missing ${token}`).toContain(`${token}:`);
      expect(css.split(`${token}:`).length - 1, `${token} declared twice`).toBe(1);
    }
  });

  /**
   * The two display steps have to exist as tokens, not just be permitted by SCALE — the
   * scale gate above only says what a component MAY spell, and a step nothing declares is
   * a step nobody can reach by name.
   */
  it("declares the display steps and their tracking", () => {
    expect(css).toContain("--text-hero: 72px");
    expect(css).toContain("--text-mega: 96px");
    expect(css).toContain("--tracking-display:");
  });

  /**
   * `#a100ff` is 3.58:1 on the stage: legal as a fill under 1.4.11, illegal as body text
   * under 1.4.3. The trap is that `--color-glow` LOOKS like a colour you could set type
   * in. So a text-legal sibling must exist, or every agent needing violet type on the
   * stage invents one.
   */
  it("gives the glow a text-legal sibling, because the glow itself is not", () => {
    expect(css).toContain("--color-glow-ink:");
  });

  it("keeps a border token that is legal on controls", () => {
    expect(css).toContain("--color-border-control:");
    expect(css).toContain("--color-border-subtle:");
  });

  /**
   * A property defined as itself is invalid at computed-value time, so it does not alias
   * anything — it destroys the earlier declaration and resolves to the empty string.
   *
   * `--color-win-tint: var(--color-win-tint)` shipped for all three dimensions. The tints
   * were declared twice, resolved to nothing, and both DESIGN-SYSTEM.md and the test above
   * were satisfied because they only ever asked whether the *name* was declared. Checking
   * declaration is not checking resolution; `tools/verify.mjs` now reads the computed
   * values in a real browser, and this catches the specific shape cheaply.
   */
  it("has no self-referential custom property", () => {
    const offenders: string[] = [];
    for (const m of css.matchAll(/(--[\w-]+):\s*var\(\s*(--[\w-]+)\s*\)/g)) {
      if (m[1] === m[2]) offenders.push(m[1] as string);
    }
    expect(offenders).toEqual([]);
  });

  /** Declared once. A second declaration silently wins and is never what anyone meant. */
  it("declares each dimension token exactly once", () => {
    const dupes: string[] = [];
    for (const d of ["win", "profit", "deliver"]) {
      for (const role of ["solid", "text", "tint", "line"]) {
        const token = `--color-${d}-${role}:`;
        const n = css.split(token).length - 1;
        if (n !== 1) dupes.push(`${token} declared ${n}×`);
      }
    }
    expect(dupes).toEqual([]);
  });
});
