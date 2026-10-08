import { describe, expect, it } from "vitest";
import { story } from "../content/story";
import { pastSetup, playMission, possibleSelections } from "./analysis";
import { advance, canCommit, commit, finalVerdict, getNode, leverOptionOpen, toggleSelection } from "./engine";
import { withEveryKind } from "./kinds.fixture";
import { decodeSave, encodeSave, SAVE_SCHEMA } from "./save";
import { isMission, type Content, type GameState } from "./types";

function at(id: string, content: Content = story): GameState {
  let state = pastSetup(content);
  for (let guard = 0; state.nodeId !== id && guard < 30; guard++) {
    const node = getNode(content, state.nodeId);
    if (!isMission(node)) throw new Error(`Path ended before ${id}`);
    state = playMission(state, content, possibleSelections(node, state)[0]!);
  }
  if (state.nodeId !== id) throw new Error(`Missing ${id}`);
  return state;
}

/** Press every id of a selection, as a player would, one at a time. */
const press = (state: GameState, ids: readonly string[], content: Content = story): GameState =>
  ids.reduce((s, id) => toggleSelection(s, content, id), state);

describe("commit boundary", () => {
  /* The built-in verdicts, for content with no endings of its own (D-086): a later meter
     falling never rewrites an award as a loss. */
  it("never rewrites an awarded engagement as a lost pursuit because a later meter fell", () => {
    expect(finalVerdict({ win: 20, profit: 60, deliver: 60 }, ["won"]).title).toBe("A workable deal");
    expect(finalVerdict({ win: 90, profit: 60, deliver: 60 }, ["lost"]).title).toBe("They chose someone else");
    expect(finalVerdict({ win: 20, profit: 60, deliver: 60 }, ["won", "walked_away"]).title).toBe("You walked away");
  });

  /* And the story's own: the award is read off the card the price push sets, never off Win. */
  it("reads the story's award off its card, not off the meter", () => {
    expect(finalVerdict({ win: 5, profit: 60, deliver: 60 }, ["signed"], story).title).not.toBe("Orion chose the cheaper firm");
    expect(finalVerdict({ win: 100, profit: 60, deliver: 60 }, ["award:lost"], story).title).toBe("Orion chose the cheaper firm");
  });

  it("needs no prediction and records no prediction data", () => {
    const state = at("d1");
    const node = getNode(story, state.nodeId);
    if (!isMission(node)) throw new Error("Expected mission");
    const selected = press(state, possibleSelections(node, state)[0]!);
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

  it("rejects unknown and locked settings even when injected directly", () => {
    /* d2: "What we found" needs what week one found, and each guest needs their card. With
       no cards at all, all three are locked. */
    const state = at("d2");
    const node = getNode(story, "d2");
    if (node.kind !== "levers") throw new Error("Expected a lever decision");
    const restricted = { ...state, flags: [] };
    const locked = node.levers.flatMap((l) => l.options).filter((o) => !leverOptionOpen(o, restricted));
    expect(locked.map((o) => o.id).sort()).toEqual(["d2-declan", "d2-found", "d2-marcus"]);
    for (const id of ["invented-option", ...locked.map((o) => o.id)]) {
      expect(toggleSelection(restricted, story, id)).toBe(restricted);
      /* A complete-looking panel: the locked setting on its lever, an open one on the other. */
      const other = node.levers.find((l) => !l.options.some((o) => o.id === id))!.options.find((o) => !o.requires)!;
      const injected = { ...restricted, selection: [id, other.id] };
      expect(canCommit(injected, story)).toBe(false);
      expect(commit(injected, story)).toBe(injected);
    }
  });

  it("keeps exactly one setting per lever, and lets a setting be changed", () => {
    const state = at("d5");
    const node = getNode(story, "d5");
    if (node.kind !== "levers") throw new Error("Expected a lever decision");
    const valid = possibleSelections(node, state)[0]!;
    const selected = press(state, valid);
    expect(canCommit(selected, story)).toBe(true);
    /* Changing a lever's setting replaces it; the panel stays complete. */
    const sibling = node.levers[0]!.options.find((o) => o.id !== valid[0] && leverOptionOpen(o, state))!;
    const changed = toggleSelection(selected, story, sibling.id);
    expect(changed.selection).toHaveLength(valid.length);
    expect(changed.selection).toContain(sibling.id);
    expect(changed.selection).not.toContain(valid[0]);
    expect(canCommit(changed, story)).toBe(true);
    /* Re-pressing the current setting does nothing, as with a radio button. */
    expect(toggleSelection(selected, story, valid[0]!)).toBe(selected);
    /* Injected shapes the panel cannot produce are refused: a missing lever, a doubled
       lever, an unknown id. */
    const twoOnOne = [valid[0]!, sibling.id, ...valid.slice(2)];
    for (const selection of [valid.slice(1), twoOnOne, [...valid.slice(0, -1), "unknown"]]) {
      const invalid = { ...state, selection };
      expect(canCommit(invalid, story)).toBe(false);
      expect(commit(invalid, story)).toBe(invalid);
    }
  });

  /* The older kinds, on the fixture chapter (D-086): the story no longer has an investigation
     or a build, and the engine still does. */
  const KINDS = withEveryKind(story);
  it.each(["fx-investigate", "fx-build"])("enforces distinct exact allocation and permits edits at %s", id => {
    const state = at(id, KINDS);
    const node = getNode(KINDS, id);
    if (!isMission(node)) throw new Error("Expected mission");
    const valid = possibleSelections(node, state)[0]!;
    const selected = press(state, valid, KINDS);
    expect(canCommit(selected, KINDS)).toBe(true);
    const allIds = node.kind === "investigate" ? node.evidence.map(e => e.id) : node.kind === "build" ? node.components.map(c => c.id) : [];
    const extra = allIds.find(item => !valid.includes(item))!;
    expect(toggleSelection(selected, KINDS, extra)).toBe(selected);
    const removed = toggleSelection(selected, KINDS, valid[0]!);
    expect(canCommit(removed, KINDS)).toBe(false);
    expect(canCommit(toggleSelection(removed, KINDS, extra), KINDS)).toBe(true);
    for (const selection of [[...valid, extra], valid.slice(1), valid.map(() => valid[0]!), [...valid.slice(1), "unknown"]]) {
      const invalid = { ...state, selection };
      expect(canCommit(invalid, KINDS)).toBe(false);
      expect(commit(invalid, KINDS)).toBe(invalid);
    }
  });

  it("rejects a gated choice option even when injected directly", () => {
    const state = at("fx-apply", KINDS);
    const restricted = { ...state, flags: [] };
    for (const id of ["invented-option", "fx-case-gated"]) {
      expect(toggleSelection(restricted, KINDS, id)).toBe(restricted);
      const injected = { ...restricted, selection: [id] };
      expect(canCommit(injected, KINDS)).toBe(false);
      expect(commit(injected, KINDS)).toBe(injected);
    }
  });

  it("does not move forward from an uncommitted activity", () => {
    const state = at("d1");
    expect(advance(state, story)).toBe(state);
  });
});

describe("legacy prediction removal and defensive restore", () => {
  function result() {
    const state = at("d1");
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
      /* The calendar, when present, is read by the ending screen and must be whole (D-086). */
      { ...good, settled: [{ flag: "promise:trial", status: "maybe", line: "", due: "Month 2", dueMonth: 2 }] },
      { ...good, settled: "kept" },
    ]) expect(decodeSave(JSON.stringify(damaged), story)).toMatchObject({ status: "stale", reason: "unreadable" });
  });
});
