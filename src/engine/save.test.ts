/**
 * Saves, and specifically the four ways one can stop being valid.
 *
 * The behaviour under test is not "does it store a state" — it is what happens at eleven
 * o'clock on the morning of a cohort when somebody ships a patch. A prose fix must change
 * nothing. A rules change must say so and hand back the run code. A shape change must
 * admit the code cannot be played. And the bare state written by the build before this one
 * must survive, because that cohort is the reason the item was raised.
 */

import { describe, expect, it } from "vitest";

import { story } from "../content/story";
import { playMission, possibleSelections } from "./analysis";
import { advance, chooseSetup, commit, createInitialState, getNode } from "./engine";
import { decodeRun, encodeRun, runFromState } from "./runcode";
import { decodeSave, encodeSave, LEGACY_SAVE_KEYS, SAVE_SCHEMA, saveKey } from "./save";
import { isMission, type Content, type GameState } from "./types";

const content = story;

/** A state four decisions into a run, played with the public engine only. */
function midRun(c: Content, decisions = 4): GameState {
  let s = createInitialState(c);
  s = advance(s, c);
  const node = getNode(c, s.nodeId);
  if (node.kind !== "setup") throw new Error("expected chapter 0");
  s = chooseSetup(s, c, (node.options[1] ?? node.options[0])!.id);
  let guard = 0;
  while ((s.phase === "interlude" || s.phase === "brief") && guard++ < 20) s = advance(s, c);
  for (let i = 0; i < decisions; i++) {
    const n = getNode(c, s.nodeId);
    if (!isMission(n)) break;
    const legal = possibleSelections(n, s);
    s = playMission(s, c, legal[i % legal.length]!);
  }
  return s;
}

describe("a save that is still good", () => {
  it("round-trips, and says it did not need migrating", () => {
    const state = midRun(content);
    const outcome = decodeSave(encodeSave(state, content), content);
    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;
    expect(outcome.migrated).toBe(false);
    expect(outcome.state.nodeId).toBe(state.nodeId);
    expect(outcome.state.history.map((h) => h.outcomeId)).toEqual(
      state.history.map((h) => h.outcomeId),
    );
  });

  it("carries the run code, so a stale save can always offer one", () => {
    const state = midRun(content);
    const envelope = JSON.parse(encodeSave(state, content)) as { code: string };
    expect(envelope.code).toBe(encodeRun(content, runFromState(state, content)!));
    expect(decodeRun(content, envelope.code).ok).toBe(true);
  });

  /** The headline case for the whole item: a typo fix must cost nobody their run. */
  it("survives a prose fix", () => {
    const state = midRun(content);
    const raw = encodeSave(state, content);

    const edited = structuredClone(content) as Content;
    for (const node of Object.values(edited.nodes)) {
      if (!isMission(node)) continue;
      node.title = `${node.title} (fixed)`;
      node.situation = node.situation.map((p) => p.replace("the", "The"));
      const outcomes =
        node.kind === "choice" ? node.options.flatMap((o) => o.outcomes) : node.outcomes;
      for (const o of outcomes) o.headline = `${o.headline} `;
    }

    const outcome = decodeSave(raw, edited);
    expect(outcome.status).toBe("ok");
  });
});

describe("a save that has stopped being good", () => {
  it("explains a schema change and offers a playable code", () => {
    const state = midRun(content);
    const envelope = JSON.parse(encodeSave(state, content)) as Record<string, unknown>;
    envelope.schema = SAVE_SCHEMA + 1;
    const outcome = decodeSave(JSON.stringify(envelope), content);
    expect(outcome.status).toBe("stale");
    if (outcome.status !== "stale") return;
    expect(outcome.reason).toBe("schema");
    expect(outcome.replayable).toBe(true);
    expect(outcome.message).toMatch(/earlier version/);
    expect(decodeRun(content, outcome.code!).ok).toBe(true);
  });

  it("explains a rules change, and the code it offers still plays", () => {
    const state = midRun(content);
    const raw = encodeSave(state, content);

    const retuned = structuredClone(content) as Content;
    const mission = Object.values(retuned.nodes).find((n) => isMission(n));
    if (!mission || !isMission(mission)) throw new Error("no missions");
    const outcomes = mission.kind === "choice" ? mission.options[0]!.outcomes : mission.outcomes;
    outcomes[0]!.effect = { ...outcomes[0]!.effect, dims: { win: 17 } };

    const outcome = decodeSave(raw, retuned);
    expect(outcome.status).toBe("stale");
    if (outcome.status !== "stale") return;
    expect(outcome.reason).toBe("story");
    /* The decisions still index the same way, so the run survives the patch even though
       the arithmetic behind it does not. */
    expect(outcome.replayable).toBe(true);
    const read = decodeRun(retuned, outcome.code!);
    expect(read.ok).toBe(true);
    if (read.ok) {
      expect(read.run.selections.length).toBe(state.history.length);
    }
  });

  it("admits when the code cannot be carried across either", () => {
    const state = midRun(content);
    const raw = encodeSave(state, content);

    const restructured = structuredClone(content) as Content;
    const choice = Object.values(restructured.nodes).find(
      (n) => isMission(n) && n.kind === "choice" && n.options.length > 2,
    );
    if (!choice || !isMission(choice) || choice.kind !== "choice") throw new Error("no choice");
    choice.options.splice(1, 1);

    const outcome = decodeSave(raw, restructured);
    expect(outcome.status).toBe("stale");
    if (outcome.status !== "stale") return;
    expect(outcome.reason).toBe("story");
    expect(outcome.replayable).toBe(false);
    /* Still handed back, because a facilitator can write it down even when this build
       cannot replay it. */
    expect(outcome.code).toBeTruthy();
    expect(decodeRun(restructured, outcome.code!).ok).toBe(false);
  });
});

describe("the save written by the build before this one", () => {
  it("is a bare GameState, and is adopted rather than thrown away", () => {
    const state = midRun(content);
    const outcome = decodeSave(JSON.stringify(state), content);
    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;
    expect(outcome.migrated).toBe(true);
    expect(outcome.state.nodeId).toBe(state.nodeId);
  });

  it("is still read from its old key", () => {
    expect(LEGACY_SAVE_KEYS).toContain("gpl.save.v3");
    expect(saveKey()).not.toBe("gpl.save.v3");
  });

  it("is refused if it is not a state this content could be in", () => {
    const state = midRun(content);
    const cases: Record<string, unknown> = {
      "unknown node": { ...state, nodeId: "m-does-not-exist" },
      "impossible phase": { ...state, phase: "wandering" },
      "missing meters": { ...state, dims: { win: 50 } },
      "meter off scale": { ...state, dims: { ...state.dims, profit: 140 } },
      "history from other content": {
        ...state,
        history: [{ ...state.history[0]!, missionId: "m-gone" }],
      },
      "history with no choice in it": {
        ...state,
        history: [{ ...state.history[0]!, chosenIds: [] }],
      },
      "not a save at all": { hello: "world" },
    };
    for (const [name, value] of Object.entries(cases)) {
      const outcome = decodeSave(JSON.stringify(value), content);
      expect(outcome.status, name).toBe("stale");
      if (outcome.status === "stale") expect(outcome.reason, name).toBe("unreadable");
    }
  });
});

/**
 * The cohort mid-commit when the `resolving` phase was deleted.
 *
 * Nobody sits on that beat for long — it was one second — but somebody closes a laptop
 * during it, and the save they wrote names a phase this build has no screen for. It is
 * adopted into the consequence, which is where that state already belongs: `commit`
 * applied every effect and then set the phase, and the resolution the consequence draws
 * is in the save beside it.
 */
describe("a save written in the phase that no longer exists", () => {
  /** Exactly what the previous build wrote: a committed state, one beat early. */
  function inFlight(): GameState {
    const s = midRun(content, 3);
    const node = getNode(content, s.nodeId);
    if (!isMission(node)) throw new Error("expected a mission");
    const selection = possibleSelections(node, s)[0]!;
    const committed = commit({ ...s, selection, prediction: "win" }, content);
    expect(committed.resolution).not.toBeNull();
    return { ...committed, phase: "resolving" };
  }

  it("resumes on the consequence, with the result intact", () => {
    const state = inFlight();
    const outcome = decodeSave(encodeSave(state, content), content);
    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;
    expect(outcome.state.phase).toBe("consequence");
    expect(outcome.migrated).toBe(true);
    expect(outcome.state.nodeId).toBe(state.nodeId);
    expect(outcome.state.resolution?.outcome.id).toBe(state.resolution?.outcome.id);
    /* The meters must still have somewhere to travel from, or the entrance animation the
       fold depends on has nothing to animate. */
    expect(outcome.state.resolution?.dimsBefore).toEqual(state.resolution?.dimsBefore);
  });

  it("is adopted from a bare state too", () => {
    const outcome = decodeSave(JSON.stringify(inFlight()), content);
    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;
    expect(outcome.state.phase).toBe("consequence");
  });

  /* No build ever wrote one — `commit` writes the phase and the resolution in the same
     object — so this is damage, and a consequence beat with nothing to show is worse
     than saying so. */
  it("is refused when it carries no result to show", () => {
    const orphan = { ...inFlight(), resolution: null };
    expect(decodeSave(encodeSave(orphan, content), content)).toMatchObject({
      status: "stale",
      reason: "unreadable",
    });
    expect(decodeSave(JSON.stringify(orphan), content)).toMatchObject({
      status: "stale",
      reason: "unreadable",
    });
  });
});

describe("the edges of storage", () => {
  it("treats nothing as nothing, and the title screen as nothing to resume", () => {
    expect(decodeSave(null, content)).toEqual({ status: "empty" });
    expect(decodeSave("", content)).toEqual({ status: "empty" });
    expect(decodeSave("   ", content)).toEqual({ status: "empty" });
    expect(decodeSave(JSON.stringify(createInitialState(content)), content)).toEqual({
      status: "empty",
    });
  });

  it("does not throw on damage", () => {
    expect(decodeSave("{not json", content)).toMatchObject({
      status: "stale",
      reason: "unreadable",
    });
    expect(decodeSave("42", content)).toMatchObject({ status: "stale", reason: "unreadable" });
    expect(decodeSave("null", content)).toMatchObject({ status: "empty" });
  });

  it("gives each seat its own slot, and never trusts the label", () => {
    expect(saveKey()).toBe("gpl.save");
    expect(saveKey("Priya")).toBe("gpl.save.priya");
    expect(saveKey("Desk 4")).toBe("gpl.save.desk-4");
    expect(saveKey("  ")).toBe("gpl.save");
    expect(saveKey("../../evil")).toBe("gpl.save.evil");
    expect(saveKey("x".repeat(200)).length).toBeLessThan(50);
    expect(saveKey("Priya")).not.toBe(saveKey("Arjun"));
  });
});
