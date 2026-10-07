import { describe, expect, it } from "vitest";
import { story } from "../content/story";
import { EARNED } from "../content/gates";
import { pastSetup, possibleSelections } from "./analysis";
import { advance, commit, evaluateCondition, getNode, outcomeBecause } from "./engine";
import { isMission, type GameState, type Mission } from "./types";

/** Flags a selection itself adds before outcomes are evaluated. */
function selectionFlags(node: Mission, ids: readonly string[]): string[] {
  if (node.kind === "investigate") return node.evidence.filter((e) => ids.includes(e.id)).flatMap((e) => e.flags ?? []);
  if (node.kind === "build") return node.components.filter((c) => ids.includes(c.id)).flatMap((c) => c.flags ?? []);
  return [];
}

/**
 * Walk seeded runs and hand every consequence beat to `inspect`, with the record the
 * outcome conditions were actually evaluated against.
 */
function eachConsequence(runs: number, inspect: (at: GameState, carried: readonly string[], record: readonly string[], node: Mission) => void) {
  const advantages = ["s-connector", "s-builder", "s-challenger"];
  for (let run = 1; run <= runs; run++) {
    let seed = run * 7919;
    const pick = (count: number) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      return Math.floor(((seed >>> 0) / 0x100000000) * count);
    };
    let state = pastSetup(story, advantages[run % advantages.length]);
    for (let guard = 0; guard < 60 && state.phase !== "ending"; guard++) {
      if (state.phase === "brief" || state.phase === "interlude") { state = advance(state, story); continue; }
      const node = getNode(story, state.nodeId);
      if (!isMission(node) || state.phase !== "decide") throw new Error(`Unexpected ${state.phase} at ${node.id}`);
      const legal = possibleSelections(node, state);
      const selection = legal[pick(legal.length)]!;
      const carried = [...state.flags];
      const record = [...new Set([...carried, ...selectionFlags(node, selection)])];
      const at = commit({ ...state, selection }, story);
      expect(at.phase).toBe("consequence");
      inspect(at, carried, record, node);
      state = advance(at, story);
    }
    expect(state.phase).toBe("ending");
  }
}

const outcomesOf = (node: Mission, at: GameState) =>
  node.kind === "choice" ? node.options.find((o) => o.id === at.history.at(-1)!.chosenIds[0])!.outcomes : node.outcomes;

describe("outcomeBecause", () => {
  it("is empty outside the consequence beat", () => {
    expect(outcomeBecause(pastSetup(story, "s-connector"), story)).toEqual({ held: [], lacked: [], dims: [], missed: null, conditional: false });
  });

  it("names only causes the selected outcome required and the player already carried in", () => {
    let explained = 0;
    eachConsequence(300, (at, carried) => {
      const { held, lacked } = outcomeBecause(at, story);
      const when = at.resolution!.outcome.when;
      for (const flag of held) {
        expect(carried).toContain(flag);
        expect([...(when?.all ?? []), ...(when?.any ?? [])]).toContain(flag);
      }
      for (const flag of lacked) {
        expect(when?.none ?? []).toContain(flag);
        expect(carried).not.toContain(flag);
      }
      if (!when) expect(held.length + lacked.length).toBe(0);
      if (when) expect(outcomeBecause(at, story).conditional).toBe(true);
      if (held.length || lacked.length) explained++;
    });
    expect(explained).toBeGreaterThan(300);
  });

  it("explains every non-first outcome by the nearest sibling it failed, and never invents a miss", () => {
    let fallbacks = 0;
    eachConsequence(300, (at, _carried, record, node) => {
      const list = outcomesOf(node, at);
      const index = list.findIndex((o) => o.id === at.resolution!.outcome.id);
      const { missed } = outcomeBecause(at, story);
      if (index === 0) { expect(missed).toBeNull(); return; }
      /* First-match: every earlier sibling really failed on this record. */
      for (const earlier of list.slice(0, index)) expect(evaluateCondition(earlier.when, record, at.resolution!.dimsBefore)).toBe(false);
      expect(missed).not.toBeNull();
      for (const f of missed!.needed) expect(record).not.toContain(f);
      for (const f of missed!.oneOf) expect(record).not.toContain(f);
      for (const f of missed!.without) expect(record).toContain(f);
      if (!at.resolution!.outcome.when) fallbacks++;
    });
    /* The case the first version got wrong: fallbacks are common, and each now has a reason. */
    expect(fallbacks).toBeGreaterThan(200);
  });

  it("leaves most named causes with a player-facing label", () => {
    const named = new Set<string>();
    for (const node of Object.values(story.nodes)) {
      if (!isMission(node)) continue;
      const outcomes = node.kind === "choice" ? node.options.flatMap((o) => o.outcomes) : node.outcomes;
      for (const o of outcomes) for (const f of [...(o.when?.all ?? []), ...(o.when?.any ?? []), ...(o.when?.none ?? [])]) named.add(f);
    }
    const labelled = [...named].filter((f) => EARNED[f]);
    expect(labelled.length / named.size).toBeGreaterThan(0.8);
  });
});
