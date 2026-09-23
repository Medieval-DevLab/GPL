/**
 * SCORM 1.2 — the thinnest wrapper that is honest.
 *
 * Backlog 8.4, deliberately deferred until the game was worth packaging: adoption's own
 * verdict was that "packaging a game a sceptic can speed-run burns the one pilot you get."
 * Reading now pays, so it is worth packaging.
 *
 * FOUR DECISIONS WORTH KNOWING, because each one is a thing a SCORM wrapper usually gets
 * wrong:
 *
 * 1. **It reports completion and never a score.** SCORM offers `cmi.core.score.raw` and
 *    every LMS dashboard in the world wants it. This game deleted its score on purpose —
 *    four reviewers asked for it, a meter-greedy policy drove it to 100/100/100 without
 *    reading a word, and the debrief refuses to give a grade for the same reason. Sending
 *    one to the LMS would reintroduce the grader through the back door, where the player
 *    cannot see it and the designers cannot argue with it. `lesson_status` only.
 *
 * 2. **`suspend_data` carries the RUN CODE, not the save.** SCORM 1.2 caps
 *    `cmi.suspend_data` at 4,096 characters, and that cap is a hard conformance limit that
 *    some LMSs enforce by silently truncating — which would corrupt a resume rather than
 *    fail it. The run code is 13–14 characters, is already the portable resume token this
 *    game designed, and carries a shape and a rules fingerprint so a code from a different
 *    content build is REJECTED rather than mis-read. The full envelope goes to
 *    `localStorage` as it always has; the LMS gets the token.
 *
 * 3. **No LMS is not an error.** `dist/` is built to run from a file system and from a web
 *    server with no LMS anywhere, and that has to keep working. Every function here is a
 *    no-op that returns `false` when no API is found, and nothing in the game branches on
 *    it.
 *
 * 4. **It is not in `src/engine`.** The engine is pure — no DOM, no network, no timers,
 *    enforced by a test. An LMS bridge is all three of those things, so it lives out here
 *    and the engine never learns it exists.
 */

const MAX_SUSPEND_DATA = 4096;

/** The subset of the SCORM 1.2 RTE this game uses. */
interface ScormApi {
  LMSInitialize: (arg: "") => string;
  LMSFinish: (arg: "") => string;
  LMSGetValue: (key: string) => string;
  LMSSetValue: (key: string, value: string) => string;
  LMSCommit: (arg: "") => string;
  LMSGetLastError: () => string;
}

/**
 * Not `extends Window`: the DOM lib declares `opener` as required and `parent` as
 * `Window`, so narrowing either is an illegal extension. This is a structural view of the
 * two properties the discovery walk needs, which is all it should ever see.
 */
interface ScormWindow {
  API?: ScormApi;
  parent?: ScormWindow;
  opener?: ScormWindow | null;
}

let api: ScormApi | null = null;
let live = false;
let completedCodeAcknowledged: string | null = null;

/**
 * Walk up the opener and parent chain looking for `window.API`.
 *
 * This is the documented discovery algorithm and it is genuinely this ugly: an LMS may
 * put the API on the frameset that opened the content, arbitrarily far up. The depth cap
 * exists because a malformed frameset can otherwise make `parent` cycle forever.
 */
function findApi(start: ScormWindow | undefined): ScormApi | null {
  let win = start;
  for (let depth = 0; win && depth < 10; depth++) {
    try {
      if (win.API) return win.API;
      if (win.parent === win) break;
      win = win.parent;
    } catch { return null; } // Cross-origin frames must not prevent standalone play.
  }
  return null;
}

/** True when an LMS is present and initialised. Safe to call more than once. */
export function scormInit(): boolean {
  if (live) return true;
  if (typeof window === "undefined") return false;
  const w = window as unknown as ScormWindow;
  api = findApi(w);
  if (!api) { try { api = findApi(w.opener ?? undefined); } catch { return false; } }
  if (!api) return false;
  try {
  live = api.LMSInitialize("") === "true";
  if (live) {
    /* `incomplete` on arrival, so an LMS that reports "not attempted" until told
       otherwise shows the learner as having started. Overwritten by `scormComplete`. */
    const status = api.LMSGetValue("cmi.core.lesson_status");
    completedCodeAcknowledged = status === "completed" ? api.LMSGetValue("cmi.suspend_data") : null;
    if (!status || status === "not attempted") {
      api.LMSSetValue("cmi.core.lesson_status", "incomplete");
      api.LMSCommit("");
    }
  }
  return live;
  } catch { live = false; return false; }
}

/** The run code the LMS is holding for this learner, if any. */
export function scormResumeCode(): string | null {
  if (!live || !api) return null;
  try {
    const raw = api.LMSGetValue("cmi.suspend_data");
    return raw && raw.trim().length > 0 ? raw.trim() : null;
  } catch { return null; }
}

/**
 * Park the run code with the LMS.
 *
 * Refuses rather than truncates if a code ever grows past the cap: a silently shortened
 * resume token decodes to a *different valid-looking* run, which is worse than no resume
 * at all. 14 characters against a 4,096 limit, so this is a guard against a future change,
 * not a live risk.
 */
export function scormSuspend(runCode: string | null): boolean {
  if (!live || !api || !runCode) return false;
  if (runCode.length > MAX_SUSPEND_DATA) return false;
  completedCodeAcknowledged = null;
  return writeAndCommit([
    ["cmi.suspend_data", runCode],
    ["cmi.core.lesson_status", "incomplete"],
    ["cmi.core.exit", "suspend"],
  ]);
}

/**
 * Mark the module complete. No score, by design — see the header.
 *
 * Called when the player reaches an ending, INCLUDING walking away. Walking away is a
 * legitimate outcome in this game and the PRD is explicit that it must sometimes be the
 * right one, so reporting it as incomplete would tell the LMS the learner failed at the
 * one moment they may have been most right.
 */
export function scormComplete(runCode: string | null): boolean {
  if (!live || !api) return false;
  if (runCode && runCode.length > MAX_SUSPEND_DATA) return false;
  if (runCode && completedCodeAcknowledged === runCode) return true;
  const success = writeAndCommit([
    ...(runCode ? [["cmi.suspend_data", runCode] as [string, string]] : []),
    ["cmi.core.lesson_status", "completed"],
    ["cmi.core.exit", ""],
  ]);
  if (success) completedCodeAcknowledged = runCode;
  return success;
}

/** A failed SetValue is a failure even when the subsequent Commit would succeed. */
function writeAndCommit(values: [string, string][]): boolean {
  if (!live || !api) return false;
  try {
    for (const [key, value] of values) {
      if (api.LMSSetValue(key, value) !== "true") return false;
    }
    return api.LMSCommit("") === "true";
  } catch { return false; }
}

/** Close the session. An LMS may not persist anything until this lands. */
export function scormFinish(): void {
  if (!live || !api) return;
  try {
    api.LMSCommit("");
    if (api.LMSFinish("") === "true") live = false;
  } catch { /* Closing an LMS window must never crash the game. */ }
}

/** Exposed for the test, so the cap is asserted rather than trusted to a comment. */
export const SCORM_LIMITS = { suspendData: MAX_SUSPEND_DATA } as const;
