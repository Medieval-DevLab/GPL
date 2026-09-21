/**
 * The SCORM bridge, tested against a fake LMS.
 *
 * Two things here are worth more than the rest: that NO LMS IS NOT AN ERROR — the build
 * has to keep running from a file system and a plain web server — and that **no score is
 * ever reported**, because that is a design decision an LMS integration is the most likely
 * place to quietly undo.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { SCORM_LIMITS } from "./scorm";

/** A minimal SCORM 1.2 RTE that records what it was told. */
function fakeLms() {
  const data: Record<string, string> = {};
  const calls: string[] = [];
  return {
    data,
    calls,
    api: {
      LMSInitialize: vi.fn(() => {
        calls.push("init");
        return "true";
      }),
      LMSFinish: vi.fn(() => {
        calls.push("finish");
        return "true";
      }),
      LMSGetValue: vi.fn((k: string) => data[k] ?? ""),
      LMSSetValue: vi.fn((k: string, v: string) => {
        data[k] = v;
        return "true";
      }),
      LMSCommit: vi.fn(() => {
        calls.push("commit");
        return "true";
      }),
      LMSGetLastError: vi.fn(() => "0"),
    },
  };
}

/** Fresh module each time: the bridge memoises the API it found, as it should. */
async function load(withLms: ReturnType<typeof fakeLms> | null) {
  vi.resetModules();
  const g = globalThis as unknown as { window?: unknown };
  const win: Record<string, unknown> = {};
  win.parent = win;
  if (withLms) win.API = withLms.api;
  g.window = win;
  return await import("./scorm");
}

describe("the SCORM bridge", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("treats no LMS as normal, not as a failure", async () => {
    const s = await load(null);
    expect(s.scormInit()).toBe(false);
    /* Every entry point must be a safe no-op, because `dist/` is built to run with no LMS
       anywhere and nothing in the game branches on its presence. */
    expect(s.scormResumeCode()).toBeNull();
    expect(s.scormSuspend("14TK-9CBT-HEQV-QV")).toBe(false);
    expect(s.scormComplete("14TK-9CBT-HEQV-QV")).toBe(false);
    expect(() => s.scormFinish()).not.toThrow();
  });

  it("finds the API, initialises, and reports incomplete on arrival", async () => {
    const lms = fakeLms();
    const s = await load(lms);
    expect(s.scormInit()).toBe(true);
    expect(lms.data["cmi.core.lesson_status"]).toBe("incomplete");
  });

  it("does not overwrite a status the LMS already has", async () => {
    const lms = fakeLms();
    lms.data["cmi.core.lesson_status"] = "completed";
    const s = await load(lms);
    s.scormInit();
    expect(lms.data["cmi.core.lesson_status"]).toBe("completed");
  });

  it("parks the run code in suspend_data and reads it back", async () => {
    const lms = fakeLms();
    const s = await load(lms);
    s.scormInit();
    expect(s.scormSuspend("14TK-9CBT-HEQV-QV")).toBe(true);
    expect(lms.data["cmi.suspend_data"]).toBe("14TK-9CBT-HEQV-QV");
    expect(s.scormResumeCode()).toBe("14TK-9CBT-HEQV-QV");
  });

  /**
   * The cap is a hard SCORM 1.2 conformance limit, and some LMSs enforce it by SILENTLY
   * TRUNCATING. A shortened run code does not fail to decode — it decodes to a different
   * valid-looking run, which is worse than no resume at all. So refuse.
   */
  it("refuses to write past the 4,096 character suspend_data cap", async () => {
    const lms = fakeLms();
    const s = await load(lms);
    s.scormInit();
    expect(s.scormSuspend("x".repeat(SCORM_LIMITS.suspendData + 1))).toBe(false);
    expect(lms.data["cmi.suspend_data"]).toBeUndefined();
    expect(s.scormSuspend("x".repeat(SCORM_LIMITS.suspendData))).toBe(true);
  });

  /**
   * The one that matters most.
   *
   * This game deleted its score on purpose — a meter-greedy policy drove it to 100/100/100
   * without reading a word, and the debrief refuses to give a grade for the same reason.
   * An LMS integration is exactly where that would come back, invisibly, because every LMS
   * dashboard wants `cmi.core.score.raw`.
   */
  it("never reports a score, in any form", async () => {
    const lms = fakeLms();
    const s = await load(lms);
    s.scormInit();
    s.scormComplete("14TK-9CBT-HEQV-QV");
    s.scormFinish();
    const keysTouched = lms.api.LMSSetValue.mock.calls.map((c) => c[0] as string);
    expect(keysTouched.filter((k) => k.includes("score"))).toEqual([]);
    expect(lms.data["cmi.core.score.raw"]).toBeUndefined();
    expect(lms.data["cmi.core.score.min"]).toBeUndefined();
    expect(lms.data["cmi.core.score.max"]).toBeUndefined();
  });

  /**
   * Walking away is a legitimate ending in this game, and the PRD is explicit that it must
   * sometimes be the right call. Reporting it as incomplete would tell the LMS the learner
   * failed at the one moment they may have been most right.
   */
  it("marks a run complete even when the player walked away", async () => {
    const lms = fakeLms();
    const s = await load(lms);
    s.scormInit();
    expect(s.scormComplete(null)).toBe(true);
    expect(lms.data["cmi.core.lesson_status"]).toBe("completed");
  });

  it("commits before finishing, because an LMS may persist nothing until then", async () => {
    const lms = fakeLms();
    const s = await load(lms);
    s.scormInit();
    s.scormFinish();
    expect(lms.calls.slice(-2)).toEqual(["commit", "finish"]);
  });
});
