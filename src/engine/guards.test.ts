import { describe, expect, it } from "vitest";
import { story } from "../content/story";
import { pastSetup, playMission, possibleSelections } from "./analysis";
import { advance, availableOptions, canCommit, commit, finalVerdict, getNode, toggleSelection } from "./engine";
import { decodeSave, encodeSave, SAVE_SCHEMA } from "./save";
import { isMission, type GameState } from "./types";

function at(id: string): GameState {
  let state = pastSetup(story);
  for (let guard = 0; state.nodeId !== id && guard < 30; guard++) {
    const node = getNode(story, state.nodeId);
    if (!isMission(node)) throw new Error(`Path ended before ${id}`);
    state = playMission(state, story, possibleSelections(node, state)[0]!);
  }
  if (state.nodeId !== id) throw new Error(`Missing ${id}`);
  return state;
}

describe("commit boundary", () => {
  it("never rewrites an awarded engagement as a lost pursuit because a later meter fell", () => {
    expect(finalVerdict({ win: 20, profit: 60, deliver: 60 }, ["won"]).title).toBe("A workable deal");
    expect(finalVerdict({ win: 90, profit: 60, deliver: 60 }, ["lost"]).title).toBe("They chose someone else");
    expect(finalVerdict({ win: 20, profit: 60, deliver: 60 }, ["won", "walked_away"]).title).toBe("You walked away");
  });
  it("needs no prediction and records no prediction data", () => {
    const state = at("m1");
    const node = getNode(story, state.nodeId);
    if (!isMission(node)) throw new Error("Expected mission");
    const selected = toggleSelection(state, story, possibleSelections(node, state)[0]![0]!);
    expect(canCommit(selected, story)).toBe(true);
    const result = commit(selected, story);
    expect(result.phase).toBe("consequence");
    expect(result).not.toHaveProperty("prediction");
    expect(result.resolution).not.toHaveProperty("predicted");
    expect(result.resolution).not.toHaveProperty("predictionCorrect");
    expect(result.history[0]).not.toHaveProperty("predictionCorrect");
    expect(commit(result, story)).toBe(result);
    expect(toggleSelection(result, story, "anything")).toBe(result);
  });

  it("rejects unknown and gated ids even when injected directly", () => {
    const state = at("m9a");
    const node = getNode(story, state.nodeId);
    if (node.kind !== "choice") throw new Error("Expected choice");
    const restricted = { ...state, flags: [] };
    const unavailable = node.options.filter(o => !availableOptions(node, restricted).includes(o));
    expect(unavailable.length).toBeGreaterThan(0);
    for (const id of ["invented-option", ...unavailable.map(o => o.id)]) {
      expect(toggleSelection(restricted, story, id)).toBe(restricted);
      const injected = { ...restricted, selection: [id] };
      expect(canCommit(injected, story)).toBe(false);
      expect(commit(injected, story)).toBe(injected);
    }
  });

  it.each(["m2", "m5b", "m7"])("enforces distinct exact allocation and permits edits at %s", id => {
    const state = at(id);
    const node = getNode(story, id);
    if (!isMission(node)) throw new Error("Expected mission");
    const valid = possibleSelections(node, state)[0]!;
    let selected = state;
    for (const item of valid) selected = toggleSelection(selected, story, item);
    expect(canCommit(selected, story)).toBe(true);
    const allIds = node.kind === "investigate" ? node.evidence.map(e => e.id) : node.kind === "build" ? node.components.map(c => c.id) : [];
    const extra = allIds.find(item => !valid.includes(item))!;
    expect(toggleSelection(selected, story, extra)).toBe(selected);
    const removed = toggleSelection(selected, story, valid[0]!);
    expect(canCommit(removed, story)).toBe(false);
    expect(canCommit(toggleSelection(removed, story, extra), story)).toBe(true);
    for (const selection of [[...valid, extra], valid.slice(1), valid.map(() => valid[0]!), [...valid.slice(1), "unknown"]]) {
      const invalid = { ...state, selection };
      expect(canCommit(invalid, story)).toBe(false);
      expect(commit(invalid, story)).toBe(invalid);
    }
  });

  it("does not move forward from an uncommitted activity", () => {
    const state = at("m1");
    expect(advance(state, story)).toBe(state);
  });
});

describe("legacy prediction removal and defensive restore", () => {
  function result() {
    const state = at("m1");
    const node = getNode(story, state.nodeId);
    if (!isMission(node)) throw new Error("Expected mission");
    return commit({ ...state, selection: possibleSelections(node, state)[0]! }, story);
  }

  it("migrates schema 4 without changing the run or its outcome", () => {
    const state = result();
    const envelope = JSON.parse(encodeSave(state, story));
    envelope.schema = 4;
    envelope.state.phase = "resolving";
    envelope.state.prediction = "win";
    envelope.state.history[0].predictionCorrect = false;
    Object.assign(envelope.state.resolution, { predicted: "win", actualLeastMoved: "profit", predictionCorrect: false });
    const loaded = decodeSave(JSON.stringify(envelope), story);
    expect(SAVE_SCHEMA).toBe(5);
    expect(loaded).toMatchObject({ status: "ok", migrated: true });
    if (loaded.status !== "ok") return;
    expect(loaded.state).toEqual(state);
    expect(JSON.stringify(loaded.state)).not.toContain("prediction");
  });

  it("refuses malformed results before a renderer can read them", () => {
    const good = result();
    for (const damaged of [
      { ...good, resolution: null },
      { ...good, resolution: { ...good.resolution, outcome: {} } },
      { ...good, resolution: { ...good.resolution, lesson: null } },
      { ...good, history: [{ ...good.history[0], lesson: null }] },
      { ...good, badges: ["not-a-badge"] },
      { ...good, selection: ["unknown"] },
      { ...good, nodeId: "end", phase: "decide" },
    ]) expect(decodeSave(JSON.stringify(damaged), story)).toMatchObject({ status: "stale", reason: "unreadable" });
  });
});
