/**
 * Run codes, and the rule that the engine stays pure.
 *
 * The properties that matter are not "does it round-trip once" but the four promises the
 * code makes to a room full of people: the same decisions always give the same code, a
 * mistyped code fails loudly, a code from a different story is refused rather than
 * misplayed, and a prose fix does not invalidate anything. Each of those has a test here,
 * and the round-trip is exercised over a few hundred seeded random runs rather than one
 * happy path.
 */

import { describe, expect, it } from "vitest";

import { story } from "../content/story";
import { playMission, possibleSelections } from "./analysis";
import { chooseSetup, getNode } from "./engine";
import {
  codeFromState,
  decodeRun,
  encodeRun,
  replayRun,
  RUN_CODE_VERSION,
  rulesFingerprint,
  runFromState,
  shapeFingerprint,
  type Run,
} from "./runcode";
import { advance, createInitialState } from "./engine";
import { isMission, type Content, type GameState, type Setup } from "./types";

const content = story;

/** Deterministic PRNG (mulberry32), so a sampled failure replays from its seed. */
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const setup = (c: Content): Setup => {
  let s = createInitialState(c);
  s = advance(s, c);
  const node = getNode(c, s.nodeId);
  if (node.kind !== "setup") throw new Error("expected chapter 0 to be a setup node");
  return node;
};

/** Play a random legal run of up to `limit` decisions, using only the public engine. */
function randomRun(c: Content, rng: () => number, limit = Infinity): { run: Run; state: GameState } {
  const options = setup(c).options;
  const advantage = options[Math.floor(rng() * options.length)] as { id: string };
  let s = createInitialState(c);
  s = advance(s, c);
  s = chooseSetup(s, c, advantage.id);
  let guard = 0;
  while ((s.phase === "interlude" || s.phase === "brief") && guard++ < 20) s = advance(s, c);

  const selections: string[][] = [];
  while (selections.length < limit) {
    const node = getNode(c, s.nodeId);
    if (!isMission(node)) break;
    const legal = possibleSelections(node, s);
    const pick = legal[Math.floor(rng() * legal.length)] as string[];
    selections.push([...pick]);
    s = playMission(s, c, pick);
  }
  return { run: { advantage: advantage.id, selections }, state: s };
}

/** What has to be the same for two states to be the same position in the same run. */
function position(s: GameState) {
  return {
    nodeId: s.nodeId,
    dims: s.dims,
    flags: [...s.flags].sort(),
    badges: [...s.badges].sort(),
    discovered: [...s.discovered].sort(),
    outcomes: s.history.map((h) => h.outcomeId),
    chosen: s.history.map((h) => [...h.chosenIds].sort()),
  };
}

describe("run codes", () => {
  it("round-trips every length of run, over 300 seeded runs", () => {
    const rng = seededRng(20260915);
    for (let i = 0; i < 300; i++) {
      const limit = i % 18; // 0..17 decisions, so partial and complete runs are both covered
      const { run, state } = randomRun(content, rng, limit);
      const code = encodeRun(content, run);
      const read = decodeRun(content, code);
      expect(read.ok, `${code} → ${read.ok ? "" : read.reason}`).toBe(true);
      if (!read.ok) return;
      expect(read.run.advantage).toBe(run.advantage);
      expect(read.run.selections.map((s) => [...s].sort())).toEqual(
        run.selections.map((s) => [...s].sort()),
      );
      /* And the decoded run reaches the same place the player did — the point of the
         exercise is the position, not the string. */
      expect(position(read.state)).toEqual(position(state));
      expect(position(replayRun(content, read.run))).toEqual(position(state));
    }
  });

  it("is the same code whatever order the player clicked in", () => {
    const rng = seededRng(7);
    for (let i = 0; i < 40; i++) {
      const { run } = randomRun(content, rng);
      const shuffled: Run = {
        advantage: run.advantage,
        selections: run.selections.map((s) => [...s].reverse()),
      };
      expect(encodeRun(content, shuffled)).toBe(encodeRun(content, run));
    }
  });

  it("is short enough to read down a phone, and to fit SCORM's suspend_data", () => {
    const rng = seededRng(99);
    let longest = 0;
    let longestJson = 0;
    for (let i = 0; i < 40; i++) {
      const { run, state } = randomRun(content, rng);
      const code = encodeRun(content, run);
      longest = Math.max(longest, code.replace(/-/g, "").length);
      longestJson = Math.max(longestJson, JSON.stringify(state).length);
    }
    /* Measured at 14 characters for a complete run: one version, three of content
       fingerprint, eight of packed decisions, two of checksum. The state it replaces is
       ~12,000 characters, and SCORM 1.2 allows 4,096. */
    expect(longest).toBeLessThanOrEqual(16);
    expect(longestJson).toBeGreaterThan(4096);
  });

  it("survives being dictated: case, spacing, hyphens, O/0 and I/L/1", () => {
    const { run } = randomRun(content, seededRng(3));
    const code = encodeRun(content, run);
    const spoken = code
      .toLowerCase()
      .replace(/-/g, " ")
      .replace(/0/g, "O")
      .replace(/1/g, "l");
    const read = decodeRun(content, spoken);
    expect(read.ok).toBe(true);
    if (read.ok) expect(encodeRun(content, read.run)).toBe(code);
  });

  it("rejects a mistyped character at least 99% of the time", () => {
    const rng = seededRng(1234);
    const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    let tried = 0;
    let accepted = 0;
    for (let i = 0; i < 30; i++) {
      const { run } = randomRun(content, rng);
      const code = encodeRun(content, run);
      const body = code.replace(/-/g, "");
      for (let pos = 0; pos < body.length; pos++) {
        for (let d = 1; d < 32; d += 7) {
          const at = alphabet.indexOf(body[pos] as string);
          const swapped = alphabet[(at + d) % 32] as string;
          const typo = body.slice(0, pos) + swapped + body.slice(pos + 1);
          tried++;
          const read = decodeRun(content, typo);
          if (read.ok) {
            accepted++;
            /* If a typo does slip through the checksum it must at least not claim to be
               the run that was typed — that would be the silent misplay. */
            expect(encodeRun(content, read.run)).not.toBe(code);
          }
        }
      }
    }
    expect(tried).toBeGreaterThan(1000);
    expect(accepted / tried).toBeLessThan(0.01);
  });

  it("refuses a code from another format version", () => {
    const { run } = randomRun(content, seededRng(11));
    const body = encodeRun(content, run).replace(/-/g, "");
    const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    const bumped = (alphabet[RUN_CODE_VERSION + 1] as string) + body.slice(1, body.length - 2);
    /* Re-checksum it, so the only thing wrong is the version — otherwise this tests the
       checksum again rather than the version gate. */
    const rebuilt = bumped;
    const read = decodeRun(content, rebuilt + checksumOf(rebuilt));
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.reason).toBe("version");
  });

  it("refuses nonsense, empties and stubs with a reason for each", () => {
    expect(decodeRun(content, "")).toMatchObject({ ok: false, reason: "empty" });
    expect(decodeRun(content, "   ")).toMatchObject({ ok: false, reason: "empty" });
    expect(decodeRun(content, "1AB!-CDEF")).toMatchObject({ ok: false, reason: "charset" });
    expect(decodeRun(content, "1AB")).toMatchObject({ ok: false, reason: "shape" });
  });

  it("throws on a run this content cannot play", () => {
    const { run } = randomRun(content, seededRng(5));
    expect(() => encodeRun(content, { ...run, advantage: "s-nobody" })).toThrow(/advantage/);
    expect(() =>
      encodeRun(content, { advantage: run.advantage, selections: [["not-an-option"]]}),
    ).toThrow(/not a legal selection/);
    const tooMany: Run = {
      advantage: run.advantage,
      selections: [...run.selections, ...run.selections],
    };
    expect(() => encodeRun(content, tooMany)).toThrow(/decisions/);
  });
});

/** The checksum, re-implemented here so the tests do not have to trust the module's. */
function checksumOf(body: string): string {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let h = 0x811c9dc5;
  for (let i = 0; i < body.length; i++) {
    h ^= body.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const v = (h >>> 0) % 1024;
  return (alphabet[Math.floor(v / 32)] as string) + (alphabet[v % 32] as string);
}

describe("the two fingerprints", () => {
  it("are eight hex characters and stable across calls", () => {
    expect(shapeFingerprint(content)).toMatch(/^[0-9a-f]{8}$/);
    expect(rulesFingerprint(content)).toMatch(/^[0-9a-f]{8}$/);
    expect(shapeFingerprint(content)).toBe(shapeFingerprint(content));
    expect(shapeFingerprint(content)).not.toBe(rulesFingerprint(content));
  });

  /**
   * The point of the whole exercise: a typo fix mid-cohort must not reset the room.
   *
   * Everything a writer can touch without touching the decisions is edited here at once.
   * If either fingerprint moves, some save somewhere is about to be thrown away for a
   * comma.
   */
  it("ignore prose, so a copy fix invalidates nothing", () => {
    const edited = structuredClone(content) as Content;
    for (const node of Object.values(edited.nodes)) {
      if (node.kind === "interlude" || node.kind === "setup") {
        node.title = `${node.title}!`;
        node.body = node.body.map((p) => `${p} (edited)`);
        continue;
      }
      if (!isMission(node)) continue;
      node.title = `${node.title}!`;
      node.objective = "rewritten objective";
      node.situation = node.situation.map((p) => `${p} — rewritten`);
      node.eyebrow = "NEW EYEBROW";
      node.lesson = { principle: "new principle", because: "new because" };
      if (node.advisorLine) node.advisorLine = "a new line for the advisor";
      if (node.tip) node.tip = "a new tip";
      const outcomes = node.kind === "choice" ? node.options.flatMap((o) => o.outcomes) : node.outcomes;
      for (const o of outcomes) {
        o.headline = "rewritten headline";
        o.detail = "rewritten detail";
        o.changed = ["rewritten"];
        o.tone = "mixed";
      }
    }
    expect(shapeFingerprint(edited)).toBe(shapeFingerprint(content));
    expect(rulesFingerprint(edited)).toBe(rulesFingerprint(content));
  });

  it("separate a rules change from a shape change", () => {
    const retuned = structuredClone(content) as Content;
    const first = Object.values(retuned.nodes).find((n) => isMission(n));
    if (!first || !isMission(first)) throw new Error("no missions");
    const outcomes = first.kind === "choice" ? first.options[0]?.outcomes : first.outcomes;
    const target = outcomes?.[0];
    if (!target) throw new Error("no outcomes");
    target.effect = { ...target.effect, dims: { ...target.effect.dims, win: 99 } };

    /* Same decisions, different arithmetic: the code still means what it says, the saved
       state does not. */
    expect(shapeFingerprint(retuned)).toBe(shapeFingerprint(content));
    expect(rulesFingerprint(retuned)).not.toBe(rulesFingerprint(content));

    const { run } = randomRun(content, seededRng(42));
    const code = encodeRun(content, run);
    const read = decodeRun(retuned, code);
    expect(read.ok).toBe(true);
  });

  it("refuse a code whose decisions no longer line up", () => {
    const restructured = structuredClone(content) as Content;
    const choice = Object.values(restructured.nodes).find(
      (n) => isMission(n) && n.kind === "choice" && n.options.length > 2,
    );
    if (!choice || !isMission(choice) || choice.kind !== "choice") throw new Error("no choice mission");
    /* One option removed is enough: every index after it now means a different option, so
       decoding an old code against this content would play a run nobody had. */
    choice.options.splice(1, 1);

    expect(shapeFingerprint(restructured)).not.toBe(shapeFingerprint(content));

    const { run } = randomRun(content, seededRng(43));
    const code = encodeRun(content, run);
    const read = decodeRun(restructured, code);
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.reason).toBe("content");
  });
});

describe("a run code from a state", () => {
  it("is recoverable from any state past chapter 0, and matches the run that made it", () => {
    const rng = seededRng(2024);
    for (let i = 0; i < 20; i++) {
      const { run, state } = randomRun(content, rng, i);
      const recovered = runFromState(state, content);
      expect(recovered).not.toBeNull();
      expect(recovered?.advantage).toBe(run.advantage);
      expect(codeFromState(state, content)).toBe(encodeRun(content, run));
    }
  });

  it("is null before the advantage is taken, because there is no run yet", () => {
    const fresh = createInitialState(content);
    expect(runFromState(fresh, content)).toBeNull();
    expect(codeFromState(fresh, content)).toBeNull();
  });

  it("rests on an unread brief, so a resumed player is not dropped mid-decision", () => {
    const { run } = randomRun(content, seededRng(8), 4);
    const state = replayRun(content, run);
    expect(state.phase).toBe("brief");
    expect(state.selection).toEqual([]);
    expect(state.prediction).toBeNull();
  });

  it("reaches the ending when the run is complete", () => {
    const { run } = randomRun(content, seededRng(9));
    expect(replayRun(content, run).phase).toBe("ending");
  });
});

/**
 * The engine is pure, and until now nothing checked it.
 *
 * `CLAUDE.md` states the rule — no React, no DOM, no `Date.now`, no `Math.random`, no
 * `fetch` in `src/engine` — and it was being kept by hand. It is the load-bearing property
 * of the whole design: every screen is a projection of engine state, the exhaustive sweep
 * is only exact because nothing rolls dice, and a run code only exists because a run is
 * reproducible. A single `Date.now` would quietly end all three.
 */
describe("engine purity", () => {
  const modules = import.meta.glob("./*.ts", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  /* Comments are stripped first, because every rule below is explained in a comment that
     has to name the thing it bans. */
  const sources = Object.entries(modules)
    .filter(([path]) => !path.endsWith(".test.ts"))
    .map(([path, text]) => ({
      path,
      text: text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, ""),
    }));

  const BANNED: [RegExp, string][] = [
    [/\bMath\.random\b/, "Math.random — uncertainty comes from information, never dice (D-005)"],
    [/\bDate\.now\b|\bnew Date\b|\bperformance\.now\b/, "a clock — the engine must be replayable"],
    [/\bfetch\s*\(|\bXMLHttpRequest\b/, "a network call — there is no backend (D-004)"],
    [/\bdocument\.|\bwindow\.|\blocalStorage\b|\bsessionStorage\b/, "the DOM"],
    [/from\s+"react|from\s+'react/, "React"],
  ];

  it("loaded the engine sources", () => {
    expect(sources.length).toBeGreaterThan(4);
    expect(sources.every((s) => s.text.length > 200)).toBe(true);
  });

  it("has no impure call anywhere in src/engine", () => {
    const found: string[] = [];
    for (const { path, text } of sources) {
      for (const [pattern, why] of BANNED) {
        if (pattern.test(text)) found.push(`${path}: ${why}`);
      }
    }
    expect(found).toEqual([]);
  });
});
