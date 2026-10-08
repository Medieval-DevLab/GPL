/**
 * The progression surface, which is derived and must stay derived.
 *
 * Every state here is built by PLAYING — `pastSetup`, `possibleSelections`, `playMission`
 * — rather than by writing a `GameState` literal. A hand-made state proves nothing about
 * a branching graph: the interesting cases in this file are a run that ended three
 * missions early and a run that finished, and neither shape is something a fixture can be
 * trusted to imitate.
 */

import { describe, expect, it } from "vitest";

import { story } from "../content/story";
import { pastSetup, playMission, possibleSelections } from "./analysis";
import { createInitialState, getNode } from "./engine";
import {
  badgeProgress,
  chapters,
  levelFor,
  missionList,
  nodeStatus,
  progressSummary,
  stars,
  starsFrom,
  XP_PER_BADGE,
  XP_PER_MISSION,
  XP_PER_STAR,
} from "./progress";
import { isMission, type Content, type GameState } from "./types";
import { withEveryKind } from "./kinds.fixture";

const content: Content = story;
/**
 * The story with the older decision kinds played first (D-086). The eight-decision story is
 * all lever panels and authors no badge, so the variety of activities and the recognition
 * rules are exercised here, by playing, rather than not at all.
 */
const kinds: Content = withEveryKind(story);

/**
 * What the run should do when it has a choice about whether to keep going.
 *
 * `continue` plays the longest run available, `endEarly` takes the first branch that ends
 * the pursuit, and `badges` prefers whatever earns recognition. All three are deterministic
 * and none of them names a mission or an option, so they keep working when content moves.
 */
type Preference = "continue" | "endEarly" | "badges";

function playForward(state: GameState, prefer: Preference, on: Content = content): GameState {
  let s = state;
  let guard = 0;

  while (guard++ < 40) {
    const node = getNode(on, s.nodeId);
    if (!isMission(node)) break;

    const results = possibleSelections(node, s).map((sel) => playMission(s, on, sel));
    const ended = results.find((r) => r.phase === "ending");
    const going = results.find((r) => r.phase !== "ending");
    const earning = results.find((r) => r.badges.length > s.badges.length);

    const pick =
      prefer === "endEarly"
        ? (ended ?? going)
        : prefer === "badges"
          ? (earning ?? going ?? ended)
          : (going ?? ended);
    if (!pick) break;
    s = pick;
  }
  return s;
}

/** Play the first legal selection at each of the next `n` missions. */
function playSome(state: GameState, n: number): GameState {
  let s = state;
  for (let i = 0; i < n; i++) {
    const node = getNode(content, s.nodeId);
    if (!isMission(node)) break;
    s = playMission(s, content, possibleSelections(node, s)[0] as string[]);
  }
  return s;
}

const ids = (list: { id: string }[]): string[] => list.map((m) => m.id);

describe("the module list", () => {
  it("lists the missions in authored order and no interludes", () => {
    expect(ids(missionList(content))).toEqual(content.missionOrder);
    expect(missionList(content).every((m) => isMission(getNode(content, m.id)))).toBe(true);
  });

  it("carries the minutes and the stage a map needs to draw a beat", () => {
    const first = missionList(content)[0];
    expect(first).toMatchObject({ id: "d1", chapter: 1, stage: "client" });
    expect(first?.minutes).toBeGreaterThan(0);
  });

  /**
   * The point of `activity`: the map has to advertise what the player does on a beat. Every
   * decision in the eight-decision story is a lever panel (D-086) — the variety is in each
   * act's own medium, which the interface draws — so the story reports one activity, and
   * the older kinds still report their own.
   */
  it("names what the player does on each beat", () => {
    expect(new Set(missionList(content).map((m) => m.activity))).toEqual(new Set(["levers"]));
    const byId = new Map(missionList(kinds).map((m) => [m.id, m.activity]));
    expect(byId.get("fx-investigate")).toBe("investigate");
    expect(byId.get("fx-build")).toBe("build");
    expect(byId.get("fx-talk")).toBe("call");
    expect(byId.get("fx-apply")).toBe("apply");
    expect(byId.get("fx-choice")).toBe("choice");
    expect(byId.get("d1")).toBe("levers");
    expect(new Set(byId.values()).size).toBeGreaterThanOrEqual(4);
  });
});

describe("the chapters", () => {
  const grouped = chapters(content);

  it("places every mission in exactly one chapter", () => {
    expect(grouped.flatMap((c) => ids(c.missions))).toHaveLength(missionList(content).length);
    expect(new Set(grouped.flatMap((c) => ids(c.missions))).size).toBe(content.missionOrder.length);
  });

  it("takes each chapter's header from its interlude", () => {
    /* Each act opens on its idea (D-086), and the script names no milestone for any of them. */
    expect(grouped.map((c) => c.interludeTitle)).toEqual([
      "Understand before you offer",
      "Not every deal is worth winning",
      "Trade, don’t give",
      "Promise only what your team can deliver",
    ]);
    expect(grouped.map((c) => c.milestone)).toEqual([null, null, null, null]);
  });
});

describe("where the player is", () => {
  it("has nothing done and the first mission current on a fresh run", () => {
    const fresh = pastSetup(content);
    const summary = progressSummary(fresh, content);

    expect(summary.completed).toBe(0);
    expect(summary.percentage).toBe(0);
    expect(summary.total).toBe(content.missionOrder.length);
    expect(nodeStatus(fresh, content, "d1")).toBe("current");

    const rest = missionList(content).filter((m) => m.id !== "d1");
    expect(rest.filter((m) => nodeStatus(fresh, content, m.id) !== "locked")).toEqual([]);
  });

  /**
   * The title screen is not standing on a mission, so nothing is `current` — and the next
   * mission still has to be found, which is the walk through `setup` and `int-1` to `d1`.
   */
  it("points at the first mission from the title screen without making it current", () => {
    const title = createInitialState(content);
    expect(nodeStatus(title, content, "d1")).toBe("locked");
    expect(progressSummary(title, content).nextMissionId).toBe("d1");
  });

  it("marks the played missions done and the one the player stands on current", () => {
    const s = playSome(pastSetup(content), 3);
    const played = s.history.map((h) => h.missionId);

    expect(played).toHaveLength(3);
    expect(played.map((id) => nodeStatus(s, content, id))).toEqual(["done", "done", "done"]);
    expect(nodeStatus(s, content, s.nodeId)).toBe("current");
    expect(progressSummary(s, content).completed).toBe(3);
    expect(progressSummary(s, content).nextMissionId).toBe(s.nodeId);
  });

  it("counts the furthest chapter reached, not the one the node happens to carry", () => {
    const s = playSome(pastSetup(content), 4);
    expect(progressSummary(s, content).chapter).toBeGreaterThanOrEqual(2);
    expect(progressSummary(s, content).chapterCount).toBe(content.chapters.length);
  });

  /**
   * THE BRANCHING CASE, and the reason `nodeStatus` compares no indices.
   *
   * An `Outcome.next` can send the run to the ending — walking away from the deal is
   * supposed to be a real option, so chapter five may never happen. Every mission the run
   * did not reach must read `locked`, including the ones the player skipped past rather
   * than merely has not got to yet.
   */
  it("leaves the missions a branch skipped locked, not current and not done", () => {
    const ended = playForward(pastSetup(content), "endEarly");
    expect(ended.phase).toBe("ending");

    const missed = missionList(content).filter((m) => !ended.completed.includes(m.id));
    expect(missed.length, "this run has to skip something or it proves nothing").toBeGreaterThan(0);
    expect(missed.filter((m) => nodeStatus(ended, content, m.id) !== "locked")).toEqual([]);

    // And the ones it did play are done, so "locked" is not simply what this returns.
    const done = missionList(content).filter((m) => ended.completed.includes(m.id));
    expect(done.filter((m) => nodeStatus(ended, content, m.id) !== "done")).toEqual([]);
  });

  it("reports no next mission once the run is over", () => {
    const finished = playForward(pastSetup(content), "continue");
    expect(finished.phase).toBe("ending");

    const summary = progressSummary(finished, content);
    expect(summary.nextMissionId).toBeNull();
    expect(summary.nextMissionTitle).toBeNull();
    expect(summary.completed).toBeGreaterThan(0);
    expect(summary.percentage).toBe(
      Math.round((summary.completed / summary.total) * 100),
    );
  });

  it("throws on a node id nothing in the story knows", () => {
    expect(() => nodeStatus(pastSetup(content), content, "m99")).toThrow(/m99/);
  });
});

describe("the star rule", () => {
  it("scores nothing for a mission the player has not played", () => {
    expect(stars(pastSetup(content), content, "d1")).toBe(0);
    expect(stars(pastSetup(content), content, "d8")).toBe(0);
  });

  it("scores every completed mission between one and three", () => {
    const s = playForward(pastSetup(content), "continue");
    const scored = s.completed.map((id) => stars(s, content, id));

    expect(scored.length).toBeGreaterThan(0);
    expect(scored.filter((n) => n < 1 || n > 3)).toEqual([]);
  });

  it("bands the actual outcome without a prediction assessment", () => {
    const s = playSome(pastSetup(content), 1);
    const entry = s.history[0];
    expect(entry, "nothing was played, so this asserts nothing").toBeDefined();
    const e = entry as NonNullable<typeof entry>;
    expect(stars(s, content, e.missionId)).toBe(starsFrom(e.tone));
  });

  it("keeps a mastery figure stable after the beat has ended", () => {
    // History, not the transient resolution, owns the completed outcome.
    const one = playSome(pastSetup(content), 1);
    const first = one.history[0] as NonNullable<(typeof one.history)[0]>;
    const scoredThen = stars(one, content, first.missionId);
    const later = playForward(one, "continue");
    expect(stars(later, content, first.missionId)).toBe(scoredThen);
  });

  it("bands only the actual outcome", () => {
    expect(starsFrom("strong")).toBe(3);
    expect(starsFrom("mixed")).toBe(2);
    expect(starsFrom("hard")).toBe(1);
  });
});

describe("recognition and the big number", () => {
  it("agrees with state.badges on a run that earned one", () => {
    const s = playForward(pastSetup(kinds), "badges", kinds);
    expect(s.badges.length, "this run has to earn a badge or it proves nothing").toBeGreaterThan(0);

    const progress = badgeProgress(s);
    expect(progress).toHaveLength(6);
    expect(progress.filter((b) => b.earned).map((b) => b.id).sort()).toEqual([...s.badges].sort());
    expect(progress.every((b) => b.label.length > 0)).toBe(true);
  });

  it("earns nothing on a fresh run", () => {
    expect(badgeProgress(pastSetup(content)).filter((b) => b.earned)).toEqual([]);
    expect(levelFor(pastSetup(content), content)).toMatchObject({ level: 1, xp: 0 });
  });

  it("adds up completions, stars and badges", () => {
    const s = playForward(pastSetup(kinds), "badges", kinds);
    const { xp, xpIntoLevel } = levelFor(s, kinds);

    const byHand =
      s.completed.length * XP_PER_MISSION +
      s.completed.reduce((n, id) => n + XP_PER_STAR * stars(s, kinds, id), 0) +
      s.badges.length * XP_PER_BADGE;

    expect(s.badges.length).toBeGreaterThan(0);
    expect(xp).toBe(byHand);
    expect(xpIntoLevel).toBe(xp % 100);
  });

  /**
   * The scale claim in `levelFor`'s comment was calibrated on eighteen decisions: a complete
   * run around level 3, a perfect one at 6. Eight decisions and no badges halve the figure
   * (D-086) — a complete run of the story is worth 120 to 200 XP, so level 2 or 3 — and
   * nothing the player sees reads it any more. Pinned so the next content change has to say
   * what the number is for rather than drift.
   */
  it("puts a complete run of the story at level 2 or 3", () => {
    const s = playForward(pastSetup(content), "continue");
    expect(s.phase).toBe("ending");
    const { level } = levelFor(s, content);
    expect(level).toBeGreaterThanOrEqual(2);
    expect(level).toBeLessThanOrEqual(3);
  });
});

/**
 * Purity, which is the whole reason these facts are derived rather than stored.
 *
 * Twice through every function on the same state: identical answers, and the state that
 * went in is byte-for-byte the state that comes out.
 */
describe("purity", () => {
  it("answers identically twice over and mutates nothing", () => {
    const s = playSome(pastSetup(content), 5);
    const before = structuredClone(s);

    const all = (state: GameState) => ({
      missions: missionList(content),
      chapters: chapters(content),
      statuses: missionList(content).map((m) => nodeStatus(state, content, m.id)),
      summary: progressSummary(state, content),
      stars: missionList(content).map((m) => stars(state, content, m.id)),
      badges: badgeProgress(state),
      level: levelFor(state, content),
    });

    expect(all(s)).toEqual(all(s));
    expect(s).toEqual(before);
  });
});
