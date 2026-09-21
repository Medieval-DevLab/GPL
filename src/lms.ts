/**
 * When to talk to the LMS.
 *
 * `scorm.ts` is the protocol — what the calls are and what they must never send. This is
 * the other half: at which moments the game makes them. They are separate files because
 * the protocol has to stay testable against a fake LMS with no React anywhere near it,
 * and because the two change for different reasons: the protocol changes if SCORM does,
 * this changes if the game's lifecycle does.
 *
 * THIS FILE EXISTS BECAUSE THE BRIDGE WAS BUILT AND NEVER CONNECTED. `scorm.ts`,
 * `scorm.test.ts` and `tools/scorm-package.mjs` all shipped, the manifest was correct,
 * eight tests passed — and nothing in `src/` imported any of it. An LMS would have
 * accepted the package, launched the game, and reported every learner as *not attempted*
 * for ever, which is worse than having no integration at all: it is an integration that
 * silently reports failure. The tests could not catch it, because a bridge with no
 * traffic over it is exactly what they were testing.
 *
 * FOUR MOMENTS, and the reasoning for each is in the function.
 */

import { useEffect, useRef } from "react";

import { codeFromState } from "./engine/runcode";
import type { Content, GameState } from "./engine/types";
import { scormComplete, scormFinish, scormInit, scormResumeCode, scormSuspend } from "./scorm";

/**
 * The run code an LMS is holding for this learner, or `null`.
 *
 * Read once, before React renders, so the resume decision can be made alongside the one
 * `localStorage` offers rather than after it. This is the reason to have SCORM at all
 * beyond a tick in a report: `localStorage` is per-browser and per-machine, so a learner
 * who starts on a laptop and finishes on a desktop has, without this, started again.
 *
 * Initialising here rather than in an effect is deliberate — `scormInit` marks the
 * attempt `incomplete`, and a learner who opens the module and closes it again should
 * still show as having started.
 */
export function lmsResumeCode(): string | null {
  if (!scormInit()) return null;
  return scormResumeCode();
}

/** What the LMS should be told about this state, if anything. */
export type LmsCall =
  | { kind: "none" }
  | { kind: "suspend"; code: string }
  | { kind: "complete"; code: string };

/**
 * The decision, separated from the effect so it can be tested without a DOM.
 *
 * `parked` is the code the LMS was last given and `finished` whether completion has
 * already been reported. Both matter: `state` changes on every selection toggle, and an
 * LMS that does a network round trip per `LMSCommit` would otherwise get a dozen
 * identical commits per beat.
 */
export function nextLmsCall(
  state: GameState,
  content: Content,
  parked: string | null,
  finished: boolean,
): LmsCall {
  /* No run yet. Writing an empty resume point over a real one loses the learner's place
     rather than keeping it. */
  if (state.phase === "title") return { kind: "none" };

  const code = codeFromState(state, content);
  if (!code) return { kind: "none" };

  /* Completion is reported once, and a run the player WALKED AWAY from still counts.
     That is a legitimate ending here and the PRD is explicit it must sometimes be the
     right one, so reporting it incomplete would tell the LMS the learner failed at the
     moment they may have been most right. No score, ever — see `scorm.ts`. */
  if (state.phase === "ending") {
    return finished ? { kind: "none" } : { kind: "complete", code };
  }

  return code === parked ? { kind: "none" } : { kind: "suspend", code };
}

/**
 * Keep the LMS in step with the run.
 *
 * Call once, near the top of the app. Does nothing at all when no LMS is present, which
 * is the normal case — `dist/` is built to run from a file system and a plain web server,
 * and nothing in the game branches on whether an LMS answered.
 */
export function useLms(state: GameState, content: Content): void {
  /* What the LMS was last told. The suspend call is cheap but not free — some LMSs do a
     network round trip per `LMSCommit` — and `state` changes on every selection toggle,
     which is many times per beat. Parking the same code repeatedly would turn a
     four-selection mission into a dozen commits that all say the same thing. */
  const parked = useRef<string | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    scormInit();
  }, []);

  useEffect(() => {
    const call = nextLmsCall(state, content, parked.current, finished.current);
    if (call.kind === "none") return;
    parked.current = call.code;
    if (call.kind === "complete") {
      finished.current = true;
      /* `scormComplete` parks the code too, so an ending is a resume point and a status
         change in one commit. */
      scormComplete(call.code);
    } else {
      scormSuspend(call.code);
    }
  }, [state, content]);

  /**
   * Close the session on the way out.
   *
   * An LMS may persist nothing until `LMSFinish`, so a learner who closes the tab
   * mid-run can otherwise lose the whole attempt including the `incomplete` status.
   *
   * `pagehide` rather than `beforeunload`: `beforeunload` is unreliable on mobile and is
   * increasingly ignored by browsers unless the page is dirty, whereas `pagehide` fires
   * on the back-forward cache path too. The SCORM calls are synchronous, which is the one
   * situation where that is a virtue — there is no promise to lose.
   */
  useEffect(() => {
    const leave = () => scormFinish();
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      /* Not `scormFinish()` on unmount: in development React mounts twice, and finishing
         a session the game is about to keep using would make every later call a no-op. */
    };
  }, []);
}
