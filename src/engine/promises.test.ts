/**
 * The promise ledger and endings from content (D-086) — the addendum in `docs/LEVERS.md`.
 *
 * Built on a fixture small enough to settle with a pencil, so every status and every effect
 * below is checked against arithmetic rather than against a second run of the same code, and
 * then on the story itself for the properties that only matter there: that a lever outcome
 * can end the run, that a lock can be shut by a card the player holds, and that run codes
 * and saves carry the calendar across.
 *
 * The fixture is one lever decision and two settle beats:
 *
 *   m1  Trial  t-yes (promise:trial) | t-no
 *       App    a-yes (promise:app)   | a-no
 *       Plan   pl-checked (checked)  | pl-told (told) | pl-none
 *   cal   settle → cal2   settle → end
 *
 *   promise:app    month 5   kept if checked, late if told, else broken (the default effect)
 *   promise:trial  month 2   void for team B; kept if checked; else broken, costing £ and
 *                            setting `fee:charged` instead of `promise:broken`
 *
 * The app rule is authored FIRST and due LAST, so authored order and month order disagree.
 */

import { describe, expect, it } from "vitest";

import { story } from "../content/story";
import { pastSetup, playMission, playScript } from "./analysis";
import {
  advance,
  commit,
  DEFAULT_BROKEN_EFFECT,
  evaluateConditions,
  finalVerdict,
  getNode,
  leverOptionOpen,
  lockOf,
  promiseStatus,
  settlePromises,
} from "./engine";
import { codeFromState, decodeRun, rulesFingerprint, shapeFingerprint } from "./runcode";
import { decodeSave, encodeSave } from "./save";
import { validateContent } from "./validate";
import { isMission, type Content, type GameState, type LeverMission } from "./types";

/* ─────────────────────────── the fixture ─────────────────────────── */

function fixture(): Content {
  return {
    startNodeId: "s0",
    missionOrder: ["m1"],
    chapters: [{ number: 1, label: "One", title: "The calendar", missionIds: ["m1"], steps: ["Promise"] }],
    threads: [],
    /* Its own board, empty, so the built-in one — written for the first story — is not read. */
    ledger: [],
    promises: [
      {
        flag: "promise:app",
        due: "Month 5",
        dueMonth: 5,
        keptWhen: { all: ["checked"] },
        kept: [{ when: { all: ["start:b"] }, text: "App kept, by team B." }, { text: "App kept." }],
        lateWhen: { all: ["told"] },
        late: "App late, agreed.",
        broken: "App broken.",
      },
      {
        flag: "promise:trial",
        due: "Month 2",
        dueMonth: 2,
        voidWhen: { all: ["start:b"] },
        voided: "Trial traded away.",
        keptWhen: { all: ["checked"] },
        kept: "Trial kept.",
        broken: "Trial broken.",
        brokenEffect: { dims: { profit: -4 }, flags: ["fee:charged"] },
      },
    ],
    endings: [
      { id: "bad", title: "Broken", summary: "A promise broke.", when: { all: ["promise:broken"] } },
      { id: "thin", title: "Thin", summary: "It barely paid.", when: { max: { profit: 39 } } },
      {
        id: "good",
        title: "Good",
        summary: "It paid.",
        extras: [
          { when: { all: ["start:a"] }, text: "Team A was here." },
          { when: { min: { win: 60 } }, text: "They want us back." },
        ],
      },
    ],
    nodes: {
      s0: {
        kind: "setup",
        id: "s0",
        eyebrow: "Before you start",
        title: "Your team",
        body: ["Choose a team."],
        question: "Which team?",
        options: [
          { id: "s-a", title: "Team A", description: "One team.", icon: "talk", strengths: ["A"], tradeoff: "Not B.", flags: ["start:a"] },
          { id: "s-b", title: "Team B", description: "The other team.", icon: "layers", strengths: ["B"], tradeoff: "Not A.", flags: ["start:b"] },
        ],
        next: "m1",
      },
      m1: {
        kind: "levers",
        id: "m1",
        chapter: 1,
        stage: "deal",
        title: "The offer",
        eyebrow: "The offer",
        objective: "Choose what we promise.",
        minutes: 1,
        situation: ["Choose what goes in the offer."],
        question: "What do we promise?",
        advisor: { name: "Aisha Khan", role: "Delivery Lead", quote: "Every promise comes due." },
        thinkAloud: "Each promise is a date somebody has to meet.",
        lesson: { principle: "Promise only what your team can deliver.", because: "Every card came due." },
        levers: [
          {
            id: "trial",
            label: "Trial",
            options: [
              { id: "t-yes", label: "Promise a trial", detail: "A trial by month two.", dims: { win: 2, deliver: -2 }, flags: ["promise:trial"] },
              { id: "t-no", label: "No trial", detail: "Nothing early.", dims: { win: -2, deliver: 2 } },
            ],
          },
          {
            id: "app",
            label: "App",
            options: [
              { id: "a-yes", label: "Promise an app", detail: "An app by month five.", dims: { win: 2, deliver: -2 }, flags: ["promise:app"] },
              { id: "a-no", label: "No app", detail: "No app.", dims: { win: -2, deliver: 2 } },
            ],
          },
          {
            id: "plan",
            label: "Plan",
            options: [
              { id: "pl-checked", label: "Check the records", detail: "Check first.", dims: { profit: -2, deliver: 2 }, flags: ["checked"] },
              { id: "pl-told", label: "Tell them early", detail: "Say so early.", dims: { win: -2, deliver: 1 }, flags: ["told"] },
              { id: "pl-none", label: "Neither", detail: "Neither.", dims: { win: 1, profit: 1 } },
            ],
          },
        ],
        outcomes: [
          { id: "m1-done", tone: "mixed", headline: "Committed.", detail: "Because you set the levers.", changed: ["The offer is set"], effect: {} },
        ],
        next: "cal",
      },
      cal: { kind: "interlude", id: "cal", role: "turn", chapter: 1, settle: true, eyebrow: "Month five", title: "Due", body: ["Everything comes due."], next: "cal2" },
      cal2: { kind: "interlude", id: "cal2", role: "turn", chapter: 1, settle: true, eyebrow: "Month six", title: "Due again", body: ["Nothing comes due twice."], next: "end" },
      end: { kind: "ending", id: "end" },
    },
  };
}

const F = fixture();

/** Commit `selection` at m1 and stop on the first settle beat, before going any further. */
function atCalendar(advantage: string, selection: string[], content: Content = F): GameState {
  let s = pastSetup(content, advantage);
  s = commit({ ...s, selection }, content);
  s = advance(s, content);
  expect(s.nodeId).toBe("cal");
  return s;
}

const statuses = (s: GameState) => (s.settled ?? []).map((r) => `${r.flag}/${r.status}`);

/* ─────────────────────────── settlement ─────────────────────────── */

describe("the promise ledger", () => {
  it("is a valid calendar under the validator", () => {
    const errors = validateContent(F, { cards: ["promise:trial", "promise:app", "promise:broken", "checked", "told", "start:a", "start:b", "fee:charged"] })
      .filter((i) => i.severity === "error");
    expect(errors).toEqual([]);
  });

  it("settles nothing before the settle beat", () => {
    const s = commit({ ...pastSetup(F, "s-a"), selection: ["t-yes", "a-yes", "pl-told"] }, F);
    expect(s.settled).toBeUndefined();
  });

  it("settles every card held on arrival, in month order rather than authored order", () => {
    const s = atCalendar("s-a", ["t-yes", "a-yes", "pl-told"]);
    expect(statuses(s)).toEqual(["promise:trial/broken", "promise:app/late"]);
    expect(s.settled?.map((r) => r.due)).toEqual(["Month 2", "Month 5"]);
    expect(s.settled?.map((r) => r.line)).toEqual(["Trial broken.", "App late, agreed."]);
  });

  it("applies a rule's own broken effect instead of the default", () => {
    const before = commit({ ...pastSetup(F, "s-a"), selection: ["t-yes", "a-no", "pl-none"] }, F);
    const s = atCalendar("s-a", ["t-yes", "a-no", "pl-none"]);
    expect(statuses(s)).toEqual(["promise:trial/broken"]);
    expect(s.dims.profit).toBe(before.dims.profit - 4);
    expect(s.flags).toContain("fee:charged");
    /* A cost, not a broken promise: the endings read `promise:broken`, and this did not set it. */
    expect(s.flags).not.toContain("promise:broken");
  });

  it("applies the default broken effect when the rule names none", () => {
    const before = commit({ ...pastSetup(F, "s-a"), selection: ["t-no", "a-yes", "pl-none"] }, F);
    const s = atCalendar("s-a", ["t-no", "a-yes", "pl-none"]);
    expect(statuses(s)).toEqual(["promise:app/broken"]);
    expect(s.dims.win).toBe(before.dims.win + (DEFAULT_BROKEN_EFFECT.dims?.win ?? 0));
    expect(s.dims.deliver).toBe(before.dims.deliver + (DEFAULT_BROKEN_EFFECT.dims?.deliver ?? 0));
    expect(s.flags).toContain("promise:broken");
  });

  it("checks void before kept, and void costs nothing", () => {
    const before = commit({ ...pastSetup(F, "s-b"), selection: ["t-yes", "a-no", "pl-checked"] }, F);
    const s = atCalendar("s-b", ["t-yes", "a-no", "pl-checked"]);
    /* Team B voids the trial even though the records were checked and it would be kept. */
    expect(statuses(s)).toEqual(["promise:trial/void"]);
    expect(s.settled?.[0]?.line).toBe("Trial traded away.");
    expect(s.dims).toEqual(before.dims);
  });

  it("chooses the kept line first match wins, like every conditional line", () => {
    expect(atCalendar("s-b", ["t-no", "a-yes", "pl-checked"]).settled?.[0]?.line).toBe("App kept, by team B.");
    expect(atCalendar("s-a", ["t-no", "a-yes", "pl-checked"]).settled?.[0]?.line).toBe("App kept.");
  });

  it("settles no card the player does not hold, and says so with an empty list", () => {
    const s = atCalendar("s-a", ["t-no", "a-no", "pl-checked"]);
    expect(s.settled).toEqual([]);
  });

  it("settles once, however many settle beats a run passes through", () => {
    const at = atCalendar("s-a", ["t-no", "a-yes", "pl-none"]);
    const again = advance(at, F);
    expect(again.nodeId).toBe("cal2");
    expect(again.settled).toEqual(at.settled);
    expect(again.dims).toEqual(at.dims);
    expect(again.flags).toEqual(at.flags);
  });

  it("reads each rule against the record as earlier rules left it", () => {
    /* Two rules: the first breaks and sets `promise:broken`; the second is kept only while
       nothing has broken. Read against the record before settlement, the second would be
       kept. Read in month order, which is the contract, it is not. */
    const content: Content = {
      ...F,
      promises: [
        { flag: "a", due: "Month 1", dueMonth: 1, keptWhen: { all: ["never"] }, kept: "A kept.", broken: "A broken." },
        { flag: "b", due: "Month 2", dueMonth: 2, keptWhen: { none: ["promise:broken"] }, kept: "B kept.", broken: "B broken." },
      ],
    };
    const state = { ...pastSetup(F, "s-a"), flags: ["a", "b"] };
    expect(promiseStatus(content.promises![1]!, state.flags, state.dims).status).toBe("kept");
    expect(statuses(settlePromises(state, content))).toEqual(["a/broken", "b/broken"]);
  });

  it("clamps each effect as it lands, as a lever's settings are", () => {
    const content: Content = {
      ...F,
      promises: [
        { flag: "a", due: "Month 1", dueMonth: 1, keptWhen: { all: ["never"] }, kept: "A kept.", broken: "A broken.", brokenEffect: { dims: { profit: -9 } } },
        { flag: "b", due: "Month 2", dueMonth: 2, keptWhen: { all: ["never"] }, kept: "B kept.", broken: "B broken.", brokenEffect: { dims: { profit: 6 } } },
      ],
    };
    const state = { ...pastSetup(F, "s-a"), flags: ["a", "b"], dims: { win: 50, profit: 5, deliver: 50 } };
    /* 5 − 9 clamps at 0, then +6. Summed first it would be 2. */
    expect(settlePromises(state, content).dims.profit).toBe(6);
  });

  it("reads a list of conditions as all of them", () => {
    const dims = { win: 50, profit: 50, deliver: 50 };
    const both = [{ all: ["x"] }, { any: ["y", "z"] }];
    expect(evaluateConditions(both, ["x", "z"], dims)).toBe(true);
    expect(evaluateConditions(both, ["x"], dims)).toBe(false);
    expect(evaluateConditions(both, ["z"], dims)).toBe(false);
    expect(evaluateConditions(undefined, [], dims)).toBe(true);
  });
});

/* ─────────────────────────── endings ─────────────────────────── */

describe("endings from content", () => {
  const dims = { win: 50, profit: 50, deliver: 50 };

  it("chooses the first ending whose condition holds", () => {
    expect(finalVerdict(dims, ["promise:broken"], F).id).toBe("bad");
    expect(finalVerdict({ ...dims, profit: 39 }, [], F).id).toBe("thin");
    expect(finalVerdict({ ...dims, profit: 40 }, [], F).id).toBe("good");
  });

  it("shows every extra whose condition holds, in order", () => {
    expect(finalVerdict(dims, ["start:a"], F).extras).toEqual(["Team A was here."]);
    expect(finalVerdict({ ...dims, win: 60 }, ["start:a"], F).extras).toEqual(["Team A was here.", "They want us back."]);
    expect(finalVerdict(dims, [], F).extras).toEqual([]);
  });

  it("keeps the built-in verdicts for content with no endings of its own", () => {
    const legacy = finalVerdict({ win: 100, profit: 100, deliver: 100 }, []);
    expect(legacy.title).toBe("A deal worth having");
    expect(legacy.id).toBeUndefined();
    expect(legacy.extras).toEqual([]);
  });

  it("settles and then ends a whole run, deterministically", () => {
    const run = () => playScript(F, [["t-no", "a-yes", "pl-none"]], "s-a");
    const s = run();
    expect(s.phase).toBe("ending");
    expect(finalVerdict(s.dims, s.flags, F).id).toBe("bad");
    expect(JSON.stringify(run())).toBe(JSON.stringify(s));
  });
});

/* ─────────────────────────── on the story ─────────────────────────── */

describe("on the eight-decision story", () => {
  const lever = (id: string): LeverMission => {
    const n = getNode(story, id);
    if (!isMission(n) || n.kind !== "levers") throw new Error(`${id} is not a lever decision`);
    return n;
  };

  it("lets a lever outcome end the run", () => {
    const toD6 = playScript(
      story,
      [
        ["d1-sarah-team", "d1-complaints"],
        ["d2-shops", "d2-declan"],
        ["d3-two", "d3-no-study"],
        ["d4-quiet", "d4-note"],
        ["d5-app", "d5-month-five", "d5-by-day"],
      ],
      "s-builder",
    );
    expect(toD6.nodeId).toBe("d6");
    const s = commit({ ...advance(toD6, story), selection: ["d6-hold", "d6-drop-nothing", "d6-ask-nothing"] }, story);
    expect(s.resolution?.outcome.id).toBe("d6-lost");
    const ended = advance(s, story);
    expect(ended.nodeId).toBe("end");
    expect(ended.phase).toBe("ending");
  });

  it("shuts a setting with a card the player holds, and names that card", () => {
    const noFee = lever("d7").levers[0]!.options.find((o) => o.id === "d7-no-late-fee")!;
    const sore = { ...pastSetup(story), flags: ["declan:sore"] };
    expect(leverOptionOpen(noFee, sore)).toBe(false);
    expect(lockOf(noFee.requires, sore)).toEqual({ needs: [], oneOf: [], held: ["declan:sore"], dims: [] });
    const fine = { ...sore, flags: [] };
    expect(leverOptionOpen(noFee, fine)).toBe(true);
    expect(lockOf(noFee.requires, fine)).toBeNull();
  });

  it("names what is missing on a lock that needs a card, too", () => {
    const results = lever("d5").levers[2]!.options.find((o) => o.id === "d5-results")!;
    expect(lockOf(results.requires, { flags: [], dims: { win: 50, profit: 50, deliver: 50 } })).toEqual({
      needs: [],
      oneOf: ["start:builder", "inside:orion"],
      held: [],
      dims: [],
    });
  });

  const FULL_RUN: string[][] = [
    ["d1-sarah-team", "d1-rivals"],
    ["d2-shops", "d2-nobody"],
    ["d3-four", "d3-no-study"],
    ["d4-match", "d4-note"],
    ["d5-shops-app", "d5-trial", "d5-fixed"],
    ["d6-match", "d6-drop-nothing", "d6-ask-nothing"],
    ["d7-as-written", "d7-sign"],
    ["d8-quiet", "d8-weekends"],
  ];

  it("carries the calendar and the ending through a run code", () => {
    const played = playScript(story, FULL_RUN, "s-builder");
    expect(played.settled?.length).toBeGreaterThan(0);
    const code = codeFromState(played, story);
    expect(code).not.toBeNull();
    const decoded = decodeRun(story, code as string);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.state.settled).toEqual(played.settled);
    expect(decoded.state.dims).toEqual(played.dims);
    expect(finalVerdict(decoded.state.dims, decoded.state.flags, story)).toEqual(finalVerdict(played.dims, played.flags, story));
  });

  it("carries the calendar through a save, and refuses a damaged one", () => {
    const played = playScript(story, FULL_RUN, "s-builder");
    const loaded = decodeSave(encodeSave(played, story), story);
    expect(loaded.status).toBe("ok");
    if (loaded.status === "ok") expect(loaded.state.settled).toEqual(played.settled);

    const damaged = JSON.parse(encodeSave(played, story));
    damaged.state.settled[0].status = "maybe";
    expect(decodeSave(JSON.stringify(damaged), story)).toMatchObject({ status: "stale", reason: "unreadable" });
  });

  it("counts a change to a promise rule as a change of rules, not of shape", () => {
    const changed = structuredClone(story) as Content;
    changed.promises![0]!.keptWhen = { any: ["inside:orion"] };
    expect(shapeFingerprint(changed)).toBe(shapeFingerprint(story));
    expect(rulesFingerprint(changed)).not.toBe(rulesFingerprint(story));

    /* Prose is not a rule: a calendar line can be corrected mid-cohort. */
    const reworded = structuredClone(story) as Content;
    reworded.promises![0]!.broken = "Broken, in other words.";
    reworded.endings![0]!.summary = "In other words.";
    expect(rulesFingerprint(reworded)).toBe(rulesFingerprint(story));

    /* Moving the settle beat moves where a replay lands. */
    const unsettled = structuredClone(story) as Content;
    const cal = unsettled.nodes.calendar;
    if (cal?.kind === "interlude") delete cal.settle;
    expect(rulesFingerprint(unsettled)).not.toBe(rulesFingerprint(story));
  });

  it("settles the story's calendar only after month five", () => {
    let s = pastSetup(story, "s-builder");
    for (const selection of FULL_RUN.slice(0, 7)) {
      s = playMission(s, story, selection);
      expect(s.settled).toBeUndefined();
    }
    s = playMission(s, story, FULL_RUN[7]!);
    expect(s.settled?.map((r) => r.flag)).toEqual(["promise:trial", "promise:screens", "promise:fixed", "promise:late_fee"]);
  });
});
