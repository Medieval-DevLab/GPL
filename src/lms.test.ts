/**
 * When the game talks to the LMS — and, first, THAT IT DOES AT ALL.
 *
 * `scorm.test.ts` tests the protocol against a fake LMS and passes with eight green
 * assertions. It passed for a week while nothing in `src/` imported `scorm.ts`: the
 * package was correct, the manifest was correct, and an LMS would have launched the
 * game and reported every learner as *not attempted* for ever. That is worse than no
 * integration, because it is an integration that silently reports failure.
 *
 * No test could catch it, because a bridge with no traffic over it is precisely what
 * those tests were testing. The first test here is the one that would have.
 */

import { describe, expect, it } from "vitest";

import { story } from "./content/story";
import { nextLmsCall, synchroniseLms, type LmsAcknowledgement } from "./lms";
import { pastSetup, playMission, possibleSelections } from "./engine/analysis";
import { advance, createInitialState, getNode } from "./engine/engine";
import { codeFromState } from "./engine/runcode";
import { isMission, type GameState } from "./engine/types";

const content = story;

/**
 * `App.tsx` with its comments removed.
 *
 * A source-reading gate that does not strip comments is not a gate: matching
 * `useLms(` against raw source matches the commented-out call just as happily as the
 * live one, which is how the draft of this passed with the bridge unplugged. Same
 * lesson `vite.config.ts` records for its own HTML guard, which read its own rationale
 * as the thing it banned.
 */
async function appSource(): Promise<string> {
  const raw = (await import("./App.tsx?raw")).default as string;
  return raw.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, " ");
}

/** Play one legal selection at each beat (the first, unless told otherwise) until `stop`. */
function playTo(stop: (s: GameState) => boolean, pick: (options: string[][]) => number = () => 0): GameState {
  let s = pastSetup(content);
  for (let i = 0; i < 40 && !stop(s); i++) {
    const node = getNode(content, s.nodeId);
    if (!isMission(node)) {
      const next = advance(s, content);
      if (next.nodeId === s.nodeId && next.phase === s.phase) break;
      s = next;
      continue;
    }
    const options = possibleSelections(node, s);
    s = playMission(s, content, options[pick(options)] as string[]);
  }
  return s;
}

describe("the LMS bridge is actually connected", () => {
  /**
   * A structural test, and the only one in this file that is not about behaviour.
   *
   * It asserts that something in the application imports the bridge. That sounds like
   * testing the obvious right up until the moment it is not true, which is how this
   * shipped: every unit was correct and nothing called any of them.
   */
  it("is imported by the application, not merely exported", async () => {
    /* Read as source rather than imported as a module, deliberately. The first version of
       this test did `await import("./App")` and asserted the default export was a
       function — which passes whether or not App ever calls the bridge, and so would
       have gone green on the very build it exists to catch. The link is what is being
       tested, so the link is what is read.
       And read with the comments taken OUT: the second version matched the commented-out
       call `// useLms(state, content)` and stayed green when the bridge was deliberately
       unplugged to check. Three drafts, two of which could not fail. */
    const source = await appSource();
    expect(source).toMatch(/import\s*\{[^}]*\buseLms\b[^}]*\}\s*from\s*["']\.\/lms["']/);
    expect(source).toMatch(/\buseLms\s*\(/);
    /* And the resume path, which is the only reason to integrate beyond a tick in a
       report: `localStorage` is per-machine, so without this a learner who changes
       machine starts the seventy-minute module again. */
    expect(source).toMatch(/\blmsResumeCode\s*\(/);
  });

  it("routes through lms.ts rather than reaching for the protocol directly", async () => {
    /* `scorm.ts` is the protocol and `lms.ts` decides when to speak. A component calling
       `scormComplete` itself would put a game rule in the interface and bypass the
       once-only and don't-re-park guards that `nextLmsCall` exists to hold. */
    const source = await appSource();
    expect(source).not.toMatch(/from\s*["']\.\/scorm["']/);
    const lms = await import("./lms");
    expect(lms.useLms).toBeTypeOf("function");
    expect(lms.lmsResumeCode).toBeTypeOf("function");
  });
});

describe("what the LMS is told, and when", () => {
  it("retries failed writes and acknowledges only a successful suspend", () => {
    const s = playTo((x) => x.completed.length >= 2);
    const ack: LmsAcknowledgement = { parked: null, finished: false };
    synchroniseLms(s, content, ack, () => false);
    expect(ack.parked).toBeNull();
    synchroniseLms(s, content, ack, () => true);
    expect(ack.parked).toBe(codeFromState(s, content));
  });

  it("retries completion and resets completion for a same-tab second run", () => {
    const end = playTo((x) => x.phase === "ending");
    const ack: LmsAcknowledgement = { parked: null, finished: false };
    synchroniseLms(end, content, ack, () => false);
    expect(ack.finished).toBe(false);
    synchroniseLms(end, content, ack, () => true);
    expect(ack.finished).toBe(true);
    synchroniseLms(pastSetup(content), content, ack, () => true);
    expect(ack.finished).toBe(false);
    let completions = 0;
    synchroniseLms(end, content, ack, (call) => { if (call.kind === "complete") completions++; return true; });
    synchroniseLms(end, content, ack, () => { completions++; return true; });
    expect(completions).toBe(1);
  });
  it("says nothing at the title screen, where there is no run to resume", () => {
    const fresh = createInitialState(content);
    expect(nextLmsCall(fresh, content, null, false).kind).toBe("none");
  });

  it("parks a resume point once the run has started", () => {
    const s = playTo((x) => x.completed.length >= 2);
    const call = nextLmsCall(s, content, null, false);
    expect(call.kind).toBe("suspend");
    if (call.kind !== "suspend") return;
    expect(call.code).toBe(codeFromState(s, content));
  });

  /**
   * `state` changes on every selection toggle, and some LMSs do a network round trip per
   * `LMSCommit`. Re-parking an unchanged code would turn one four-option beat into a
   * dozen commits that all say the same thing.
   */
  it("does not re-park a code the LMS already has", () => {
    const s = playTo((x) => x.completed.length >= 2);
    const code = codeFromState(s, content);
    expect(nextLmsCall(s, content, code, false).kind).toBe("none");
  });

  it("reports completion at an ending", () => {
    const end = playTo((x) => x.phase === "ending");
    expect(end.phase).toBe("ending");
    const call = nextLmsCall(end, content, null, false);
    expect(call.kind).toBe("complete");
  });

  it("reports completion only once per run", () => {
    const end = playTo((x) => x.phase === "ending");
    const code = codeFromState(end, content);
    expect(nextLmsCall(end, content, code, true).kind).toBe("none");
  });

  /** LMS-01: completed run B restored over completed run A, in the same tab. */
  it("reports a different completed run restored after a completion, and retries it if the write fails", () => {
    const a = playTo((x) => x.phase === "ending");
    const b = playTo((x) => x.phase === "ending", (options) => options.length - 1);
    const codeA = codeFromState(a, content), codeB = codeFromState(b, content);
    expect(codeB).not.toBe(codeA);
    const ack: LmsAcknowledgement = { parked: null, finished: false };
    const sent: string[] = [];
    synchroniseLms(a, content, ack, (call) => { sent.push(call.kind + ':' + call.code); return true; });
    synchroniseLms(b, content, ack, () => false);
    expect(ack.parked).toBe(codeA);
    synchroniseLms(b, content, ack, (call) => { sent.push(call.kind + ':' + call.code); return true; });
    synchroniseLms(b, content, ack, (call) => { sent.push(call.kind + ':' + call.code); return true; });
    expect(sent).toEqual(['complete:' + codeA, 'complete:' + codeB]);
    expect(ack).toEqual({ parked: codeB, finished: true });
  });

  /**
   * Walking away is a legitimate ending and the PRD is explicit that it must sometimes be
   * the right call. Reporting it incomplete would tell the LMS the learner failed at the
   * one moment they may have been most right.
   */
  it("reports completion for a run that walked away, not incompletion", () => {
    const end = playTo((x) => x.phase === "ending");
    const walked: GameState = { ...end, flags: [...end.flags, "walked_away"] };
    expect(nextLmsCall(walked, content, null, false).kind).toBe("complete");
  });

  /**
   * The code is the whole run in fourteen characters, which is the only reason
   * `suspend_data` is a sane place to put it — SCORM 1.2 caps that field at 4,096, and a
   * serialised `GameState` does not fit.
   */
  it("sends a run code, not a save", () => {
    const end = playTo((x) => x.phase === "ending");
    const call = nextLmsCall(end, content, null, false);
    if (call.kind === "none") throw new Error("expected a call");
    expect(call.code.length).toBeLessThan(64);
    expect(call.code).not.toContain("{");
  });
});
