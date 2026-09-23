import { expect, it } from "vitest";
import { story } from "../content/story";
import { pastSetup, playMission, possibleSelections } from "./analysis";
import { causalThreads, getNode } from "./engine";
import { isMission } from "./types";

it("witnesses every authored causal rule in completed, replayable engagements", () => {
  const witnessed = new Set<number>();
  const advantages = ["s-connector", "s-builder", "s-challenger"];
  for (let run = 1; run <= 3000; run++) {
    let seed = run;
    const pick = (count: number) => {
      seed = Math.imul(seed, 1664525) + 1013904223 | 0;
      return Math.floor(((seed >>> 0) / 0x100000000) * count);
    };
    let state = pastSetup(story, advantages[run % advantages.length]);
    for (let guard = 0; guard < 30 && state.phase !== "ending"; guard++) {
      const node = getNode(story, state.nodeId);
      if (!isMission(node)) throw new Error(`Unexpected node ${node.id}`);
      const legal = possibleSelections(node, state);
      state = playMission(state, story, legal[pick(legal.length)]!);
    }
    expect(state.phase).toBe("ending");
    expect(new Set(state.completed).size).toBe(state.history.length);
    const outcomes = new Set(state.history.map(entry => entry.outcomeId));
    const earned = story.threads.filter((rule, index) => {
      const applies = rule.needsOutcomes.every(id => outcomes.has(id)) && (rule.needsFlags ?? []).every(flag => state.flags.includes(flag));
      if (applies) witnessed.add(index);
      return applies;
    });
    expect(causalThreads(state, story)).toEqual(earned.slice(0, 3).map(({ because, soLater }) => ({ because, soLater })));
  }
  expect(story.threads.filter((_, i) => !witnessed.has(i)).map(rule => rule.because)).toEqual([]);
}, 120_000);
