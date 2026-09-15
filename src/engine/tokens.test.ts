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

import { describe, expect, it } from "vitest";

import css from "../index.css?raw";

/**
 * Sources are pulled in as strings through Vite rather than `node:fs`, so this needs no
 * `@types/node` and no new dependency — the bundle stays at its current size and the
 * test stays typed.
 */
const uiModules = import.meta.glob("../ui/*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const uiFiles = Object.entries(uiModules).map(([p, text]) => ({
  name: p.split("/").pop() as string,
  text,
}));

/** The seven steps. See docs/DESIGN-SYSTEM.md. */
const SCALE = [12, 13, 15, 18, 24, 32, 56];

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
  it("uses only the seven scale steps", () => {
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
   */
  it("never puts white text on the win or profit solids", () => {
    const offenders: string[] = [];
    for (const { name, text } of uiFiles) {
      const risky =
        /color:\s*"#fff"[^}]*background:\s*"var\(--color-(win|profit)/.test(text) ||
        /background:\s*"var\(--color-(win|profit)-solid\)"[^}]*color:\s*"#fff"/.test(text);
      if (risky) offenders.push(name);
    }
    expect(offenders).toEqual([]);
  });

  it("keeps the reference ramp out of components", () => {
    const offenders: string[] = [];
    for (const { name, text } of uiFiles) {
      if (text.includes("--ref-")) offenders.push(name);
    }
    expect(offenders).toEqual([]);
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

  /** Amber was deleted: red and amber measure ΔE 4.1 under deuteranopia. */
  it("has no amber and no violet accent left in the reference ramps", () => {
    expect(css).not.toMatch(/--ref-amber/);
    expect(css).not.toMatch(/--ref-violet/);
  });

  it("keeps a border token that is legal on controls", () => {
    expect(css).toContain("--color-border-control:");
    expect(css).toContain("--color-border-subtle:");
  });
});
