/**
 * Lever decisions (D-084) — the contract in `docs/LEVERS.md`, held to by machine.
 *
 * Built on a fixture rather than on `story.ts`, for the reason `validate.test.ts` gives:
 * the story is authored by someone else while this is written, and today it holds no lever
 * decision at all. A fixture small enough to work out with a pencil is also the only way to
 * check the sweep's answer against arithmetic rather than against a second sweep.
 *
 * The fixture is one choice and one lever decision:
 *
 *   m0  "Do we meet Operations first?"   o-skip | o-meet (o-meet hands over `has:lead`)
 *   m1  "How do we answer on price?"
 *         Price      p-hold | p-match (sets `discounted`)
 *         In return  a-nothing | a-term (sets `asked:term`) | a-lead (needs `has:lead`)
 *
 * m1's outcomes are written over the combination, first match wins:
 *
 *   p-match + a-term  → m1-traded     a-lead (either price) → m1-led
 *   p-match + nothing → m1-gave       p-hold + a-term       → m1-asked
 *   p-hold  + nothing → m1-held (the unconditional fallback)
 *
 * `o-skip` is deliberately the FIRST option of m0. The sweep keeps the first state to reach
 * a dedup key, so if the key ever stopped seeing the lock on `a-lead`, the two m0 branches
 * would collapse onto the o-skip state — the one where `a-lead` is locked — and `m1-led`
 * would be reported dead. Ordered the other way, the omission would be invisible.
 */

import { describe, expect, it } from "vitest";

import {
  findRealisedDominance,
  pastSetup,
  playMission,
  possibleSelections,
  sweep,
} from "./analysis";
import {
  canCommit,
  commit,
  leverOf,
  leverOptionOpen,
  leverSettings,
  leverTouches,
  outcomeBecause,
  requiredSelectionCount,
  toggleSelection,
} from "./engine";
import { missionList } from "./progress";
import {
  codeFromState,
  decodeRun,
  encodeRun,
  replayRun,
  rulesFingerprint,
  shapeFingerprint,
  type Run,
} from "./runcode";
import { decodeSave, encodeSave } from "./save";
import { validateContent, type ValidateOptions } from "./validate";
import {
  isMission,
  type Advisor,
  type Condition,
  type Content,
  type Effect,
  type GameState,
  type LeverMission,
  type LeverOption,
  type Lesson,
  type Outcome,
} from "./types";

/* ─────────────────────────── the fixture ─────────────────────────── */

const ADVISOR: Advisor = { name: "Priya Shah", role: "Pursuit lead", quote: "Set each lever on purpose." };

const outcome = (id: string, effect: Effect, when?: Condition): Outcome => ({
  id,
  ...(when ? { when } : {}),
  tone: "mixed",
  headline: `What happened on ${id}`,
  detail: "Because of the settings on the panel.",
  changed: ["The record now shows what was agreed."],
  effect,
});

const MEET: Lesson = {
  principle: "Meeting the people who run the systems changes what you can offer.",
  because: "Operations could only be named once somebody had met them.",
};
const TRADE: Lesson = {
  principle: "A concession is a trade, so ask for something back.",
  because: "The price moved and the question was what came with it.",
};

/** A fresh copy every call, so a test may break it without cloning. */
function fixture(): Content {
  return {
    startNodeId: "s0",
    missionOrder: ["m0", "m1"],
    chapters: [{ number: 1, label: "One", title: "The deal", missionIds: ["m0", "m1"], steps: ["Meet", "Price"] }],
    threads: [],
    nodes: {
      s0: {
        kind: "setup",
        id: "s0",
        eyebrow: "CHAPTER 0",
        title: "Your strength",
        body: ["Choose where you start."],
        question: "What do we bring?",
        options: [
          {
            id: "s-a",
            title: "Relationships",
            description: "You know the sponsor.",
            icon: "talk",
            strengths: ["A warm introduction"],
            tradeoff: "Nobody has seen your work.",
            flags: ["start:a"],
          },
          {
            id: "s-b",
            title: "Delivery record",
            description: "You have done this before.",
            icon: "layers",
            strengths: ["Comparable work"],
            tradeoff: "You sell it less well.",
            flags: ["start:b"],
          },
        ],
        next: "m0",
      },
      m0: {
        kind: "choice",
        id: "m0",
        chapter: 1,
        stage: "opportunity",
        title: "Meet Operations",
        eyebrow: "THE SITUATION",
        objective: "Decide whether to meet Operations first.",
        minutes: 1,
        situation: ["Operations owns every system the work would touch."],
        question: "Do we meet Operations first?",
        tip: "A meeting costs a week.",
        advisor: ADVISOR,
        consider: ["Who has to live with it?", "What does a week cost?"],
        lesson: MEET,
        next: "m1",
        options: [
          {
            id: "o-skip",
            title: "Go straight to the offer",
            description: "Write the offer without meeting them.",
            pros: ["A week saved"],
            cons: ["Nobody named"],
            outcomes: [outcome("m0-skipped", { dims: { win: 5, deliver: -5 } })],
          },
          {
            id: "o-meet",
            title: "Meet them first",
            description: "Spend a week with the Operations leads.",
            pros: ["They know you"],
            cons: ["A week gone"],
            outcomes: [outcome("m0-met", { dims: { win: -5, deliver: 5 }, flags: ["has:lead"] })],
          },
        ],
      },
      m1: {
        kind: "levers",
        id: "m1",
        chapter: 1,
        stage: "deal",
        title: "The price push",
        eyebrow: "THE SITUATION",
        objective: "Answer the price push without giving the work away.",
        minutes: 2,
        situation: ["Their procurement lead has a cheaper bid on the table."],
        question: "How do we answer on price?",
        /* The first lever decision of its act, so it is modelled: the colleague thinks
           aloud and gives no hints (D-086). */
        thinkAloud: "Every lever moves something, so we decide what we can afford to give.",
        advisor: ADVISOR,
        lesson: TRADE,
        next: "end",
        levers: [
          {
            id: "price",
            label: "Price",
            options: [
              { id: "p-hold", label: "Hold", detail: "Keep the price where we put it.", dims: { win: -4, profit: 4 } },
              {
                id: "p-match",
                label: "Match the cheaper bid",
                detail: "Cut to the rival's number.",
                dims: { win: 6, profit: -4 },
                flags: ["discounted"],
              },
            ],
          },
          {
            id: "ask",
            label: "In return",
            options: [
              { id: "a-nothing", label: "Nothing", detail: "Ask for nothing back." },
              {
                id: "a-term",
                label: "A longer contract",
                detail: "Ask for three years instead of two.",
                dims: { profit: 5, win: -3 },
                flags: ["asked:term"],
              },
              {
                id: "a-lead",
                label: "A named Operations lead",
                detail: "Ask for one person who can say yes.",
                dims: { deliver: 5, win: -2 },
                flags: ["asked:lead"],
                requires: { all: ["has:lead"] },
              },
            ],
          },
        ],
        outcomes: [
          outcome("m1-traded", { dims: { profit: 3 } }, { all: ["discounted", "asked:term"] }),
          outcome("m1-led", { dims: { deliver: 3 } }, { all: ["asked:lead"] }),
          outcome("m1-gave", { dims: { profit: -3 } }, { all: ["discounted"] }),
          outcome("m1-asked", { dims: { win: -2 } }, { all: ["asked:term"] }),
          outcome("m1-held", {}),
        ],
      },
      end: { kind: "ending", id: "end" },
    },
  };
}

const F = fixture();

const leversOf = (c: Content): LeverMission => {
  const m = c.nodes.m1;
  if (!m || m.kind !== "levers") throw new Error("fixture: m1 is not a lever decision");
  return m;
};
const setting = (c: Content, id: string): LeverOption => {
  const o = leversOf(c).levers.flatMap((l) => l.options).find((x) => x.id === id);
  if (!o) throw new Error(`fixture: no setting ${id}`);
  return o;
};

/** At m1's options, having taken `advantage` and then `first` at m0. */
function atLevers(advantage = "s-b", first = "o-meet", content: Content = F): GameState {
  const s = playMission(pastSetup(content, advantage), content, [first]);
  expect(s.nodeId).toBe("m1");
  expect(s.phase).toBe("decide");
  return s;
}

const press = (s: GameState, ...ids: string[]): GameState =>
  ids.reduce((acc, id) => toggleSelection(acc, F, id), s);

/* ─────────────────────────── selecting ─────────────────────────── */

describe("setting a lever", () => {
  it("replaces that lever's setting and leaves the other lever alone", () => {
    let s = atLevers();
    s = press(s, "a-term");
    expect(s.selection).toEqual(["a-term"]);
    s = press(s, "p-match");
    // lever order, not click order: Price first, whatever was pressed first
    expect(s.selection).toEqual(["p-match", "a-term"]);
    s = press(s, "p-hold");
    expect(s.selection).toEqual(["p-hold", "a-term"]);
    s = press(s, "a-lead");
    expect(s.selection).toEqual(["p-hold", "a-lead"]);
  });

  it("is a radio: re-setting the current setting, or an id on no lever, changes nothing", () => {
    const s = press(atLevers(), "p-hold", "a-nothing");
    expect(toggleSelection(s, F, "a-nothing")).toBe(s);
    expect(toggleSelection(s, F, "o-meet")).toBe(s);
    expect(toggleSelection(s, F, "no-such-setting")).toBe(s);
  });

  it("refuses a locked setting, and opens it once the card is held", () => {
    const without = atLevers("s-a", "o-skip");
    expect(leverOptionOpen(setting(F, "a-lead"), without)).toBe(false);
    expect(toggleSelection(without, F, "a-lead")).toBe(without);

    const withCard = atLevers("s-a", "o-meet");
    expect(leverOptionOpen(setting(F, "a-lead"), withCard)).toBe(true);
    expect(press(withCard, "a-lead").selection).toEqual(["a-lead"]);
  });

  it("does nothing outside the decide phase", () => {
    const brief = { ...atLevers(), phase: "brief" as const };
    expect(toggleSelection(brief, F, "p-hold")).toBe(brief);
  });

  it("finds the lever a setting belongs to, and reads the settings back in lever order", () => {
    const m = leversOf(F);
    expect(leverOf(m, "a-lead")?.id).toBe("ask");
    expect(leverOf(m, "p-hold")?.id).toBe("price");
    expect(leverOf(m, "o-meet")).toBeUndefined();
    expect(leverSettings(m, ["a-term", "p-match"]).map((o) => o.id)).toEqual(["p-match", "a-term"]);
  });
});

describe("canCommit", () => {
  it("needs one setting on every lever", () => {
    const m = leversOf(F);
    expect(requiredSelectionCount(m)).toBe(2);

    const s = atLevers();
    expect(canCommit(s, F)).toBe(false);
    expect(canCommit(press(s, "p-hold"), F)).toBe(false);
    expect(canCommit(press(s, "a-term"), F)).toBe(false);
    expect(canCommit(press(s, "p-hold", "a-term"), F)).toBe(true);
  });

  it("refuses the right number of settings on the wrong levers", () => {
    /* Two settings of one lever is the count `requiredSelectionCount` asks for, and is not
       a decision. `toggleSelection` cannot produce it; a hand-built state can. */
    const s = { ...atLevers(), selection: ["p-hold", "p-match"] };
    expect(canCommit(s, F)).toBe(false);
    expect(commit(s, F)).toBe(s);
  });

  it("refuses a locked setting smuggled into the selection", () => {
    const s = { ...atLevers("s-a", "o-skip"), selection: ["p-hold", "a-lead"] };
    expect(canCommit(s, F)).toBe(false);
  });
});

/* ─────────────────────────── committing ─────────────────────────── */

describe("commit", () => {
  it("lands every setting before choosing the outcome, so the outcome reads the settings' cards", () => {
    /* m1-traded needs `discounted` AND `asked:term`, and nothing but the two settings sets
       either. If the outcome were chosen before the settings landed, it could not fire. */
    const s = press(atLevers(), "a-term", "p-match"); // pressed in reverse order
    const before = { ...s.dims };
    const after = commit(s, F);

    expect(after.phase).toBe("consequence");
    expect(after.resolution?.outcome.id).toBe("m1-traded");
    expect(after.flags).toEqual(expect.arrayContaining(["has:lead", "discounted", "asked:term"]));

    // dimsBefore/dimsAfter include the settings' own effects, then the outcome's.
    const expected = {
      win: before.win + 6 - 3,
      profit: before.profit - 4 + 5 + 3,
      deliver: before.deliver,
    };
    expect(after.resolution?.dimsBefore).toEqual(before);
    expect(after.resolution?.dimsAfter).toEqual(expected);
    expect(after.resolution?.deltas).toEqual({ win: 3, profit: 4, deliver: 0 });
    expect(after.dims).toEqual(expected);

    const entry = after.history.at(-1);
    expect(entry?.chosenIds).toEqual(["p-match", "a-term"]);
    expect(entry?.chosenLabel).toBe("Match the cheaper bid · A longer contract");
    expect(after.resolution?.chosenLabel).toBe("Match the cheaper bid · A longer contract");
    expect(entry?.dimsBefore).toEqual(before);
    expect(entry?.dimsAfter).toEqual(expected);
    expect(entry?.lesson).toEqual(TRADE);
  });

  it("applies the settings one lever at a time, so the clamp sees each write", () => {
    /* From 98: Price +6 hits the ceiling at 100, then In return −3 leaves 97. Summed first
       it would be +3 from 98 — 100 — and the contract says "in lever order". */
    const s = { ...press(atLevers("s-a", "o-skip"), "p-match", "a-term"), dims: { win: 98, profit: 50, deliver: 50 } };
    const after = commit(s, F);
    expect(after.resolution?.outcome.id).toBe("m1-traded");
    expect(after.dims).toEqual({ win: 97, profit: 54, deliver: 50 });
  });

  it("chooses first-match over the combination, for every combination", () => {
    const expected: Record<string, string> = {
      "p-hold,a-nothing": "m1-held",
      "p-hold,a-term": "m1-asked",
      "p-hold,a-lead": "m1-led",
      "p-match,a-nothing": "m1-gave",
      "p-match,a-term": "m1-traded",
      "p-match,a-lead": "m1-led",
    };
    const s = atLevers();
    for (const [combo, id] of Object.entries(expected)) {
      const after = commit(press(s, ...combo.split(",")), F);
      expect(after.resolution?.outcome.id, combo).toBe(id);
    }
  });

  it("explains the outcome from the record after the settings, without crediting them as history", () => {
    /* m1-gave fired on Match + Nothing. `discounted` is this decision's own card, so it is
       not something the player "held"; and the nearest miss is m1-traded, which needed
       only `asked:term` — `discounted` was already there, set by the setting. */
    const after = commit(press(atLevers(), "p-match", "a-nothing"), F);
    expect(after.resolution?.outcome.id).toBe("m1-gave");
    const why = outcomeBecause(after, F);
    expect(why.held).toEqual([]);
    expect(why.missed?.needed).toEqual(["asked:term"]);
    expect(why.conditional).toBe(true);
  });
});

describe("leverTouches", () => {
  it("gives the sign of each bar a setting moves, and omits the ones it does not", () => {
    expect(leverTouches(setting(F, "p-match"))).toEqual({ win: 1, profit: -1 });
    expect(leverTouches(setting(F, "a-lead"))).toEqual({ deliver: 1, win: -1 });
    expect(leverTouches(setting(F, "a-nothing"))).toEqual({});
    expect(leverTouches({ id: "x", label: "x", detail: "x", dims: { win: 0, profit: 12, deliver: -1 } })).toEqual({
      profit: 1,
      deliver: -1,
    });
  });
});

/* ─────────────────────────── the validator ─────────────────────────── */

/**
 * The fixture's errors, less the engine's own.
 *
 * The ledger and the verdict read flags the story sets (`ENGINE_READ_FLAGS`), so against
 * any content but the story the validator reports each of them as read and never written,
 * at `where: "engine"`. True and irrelevant here: they are about the story, not about
 * lever decisions, and `engine.test.ts` holds the story to them.
 */
const errorsOf = (c: Content, opts?: ValidateOptions): string =>
  validateContent(c, opts)
    .filter((i) => i.severity === "error" && i.where !== "engine")
    .map((i) => `${i.where}: ${i.message}`)
    .join("\n");

const words = (n: number): string => Array.from({ length: n }, () => "word").join(" ");

describe("the validator's lever rules", () => {
  it("passes the fixture as authored", () => {
    expect(errorsOf(F)).toBe("");
  });

  it("needs two or three levers", () => {
    const one = fixture();
    leversOf(one).levers.pop();
    expect(errorsOf(one)).toMatch(/needs 2 to 3 levers, and this has 1/);

    const four = fixture();
    const m = leversOf(four);
    for (const n of [1, 2]) {
      m.levers.push({
        id: `extra${n}`,
        label: `Extra ${n}`,
        options: [
          { id: `x${n}-a`, label: "This", detail: "One way.", dims: { win: 1, profit: -1 } },
          { id: `x${n}-b`, label: "That", detail: "The other way.", dims: { win: -1, profit: 1 } },
        ],
      });
    }
    expect(errorsOf(four)).toMatch(/needs 2 to 3 levers, and this has 4/);
    m.levers.pop();
    expect(errorsOf(four)).toBe(""); // three is legal
  });

  it("needs two or three settings on every lever", () => {
    const one = fixture();
    leversOf(one).levers[0]!.options.pop();
    expect(errorsOf(one)).toMatch(/m1\/price: a lever needs 2 to 3 settings, and this has 1/);

    const four = fixture();
    leversOf(four).levers[1]!.options.push({ id: "a-more", label: "More", detail: "Ask for more.", dims: { win: -1, deliver: 1 } });
    expect(errorsOf(four)).toMatch(/m1\/ask: a lever needs 2 to 3 settings, and this has 4/);
  });

  it("needs setting ids unique across the whole decision, not just the lever", () => {
    const c = fixture();
    leversOf(c).levers[1]!.options[0]!.id = "p-hold";
    expect(errorsOf(c)).toMatch(/duplicate setting id "p-hold"/);
  });

  it("needs an unconditional last outcome", () => {
    const c = fixture();
    leversOf(c).outcomes.pop();
    expect(errorsOf(c)).toMatch(/m1: needs an unconditional fallback outcome/);
  });

  it("rejects a setting that beats a sibling on every bar by its dims alone", () => {
    const c = fixture();
    setting(c, "a-term").dims = { profit: 5 }; // now free money beside "Nothing"
    expect(errorsOf(c)).toMatch(/setting "a-term" beats "a-nothing" on every bar by its dims alone/);
  });

  it("does not call a trade-off, or two equal settings, a fake choice", () => {
    expect(errorsOf(F)).not.toMatch(/beats/);
    const c = fixture();
    setting(c, "a-term").dims = {}; // equal to "Nothing" on every bar; they differ in the card
    expect(errorsOf(c)).not.toMatch(/beats/);
  });

  it("rejects a setting's flag that nothing reads later and is not a named card", () => {
    const c = fixture();
    setting(c, "a-term").flags = ["asked:term", "promised:nothing"];
    expect(errorsOf(c)).toMatch(/m1\/ask\/a-term: setting "a-term" sets flag "promised:nothing", which nothing reads later/);
  });

  it("accepts it when the interface names it as a card", () => {
    const c = fixture();
    setting(c, "a-term").flags = ["asked:term", "promised:nothing"];
    expect(errorsOf(c, { cards: ["promised:nothing"] })).toBe("");
  });

  it("accepts it when a later beat or the debrief reads it", () => {
    // the decision's own outcomes are later: that is how the fixture is written
    expect(errorsOf(F)).not.toMatch(/nothing reads later/);

    const thread = fixture();
    setting(thread, "a-term").flags = ["asked:term", "promised:term"];
    thread.threads = [{ needsOutcomes: ["m0-met", "m1-asked"], needsFlags: ["promised:term"], because: "You met them.", soLater: "They agreed the term." }];
    expect(errorsOf(thread)).toBe("");
  });

  it("does not count a read on an EARLIER beat", () => {
    const c = fixture();
    setting(c, "a-term").flags = ["asked:term", "asked:early"];
    const m0 = c.nodes.m0;
    if (m0?.kind !== "choice") throw new Error("fixture: m0");
    m0.options[0]!.outcomes.unshift(outcome("m0-early", {}, { all: ["asked:early"] }));
    expect(errorsOf(c)).toMatch(/sets flag "asked:early", which nothing reads later/);
  });

  it("still catches a lock that reads a flag nothing sets", () => {
    const c = fixture();
    setting(c, "a-lead").requires = { all: ["has:laed"] };
    expect(errorsOf(c)).toMatch(/condition reads flag "has:laed", which nothing ever sets/);
  });

  it("needs one setting on every lever that nothing can lock", () => {
    const c = fixture();
    for (const o of leversOf(c).levers[1]!.options) o.requires = { all: ["has:lead"] };
    expect(errorsOf(c)).toMatch(/m1\/ask: every setting on this lever can be locked/);
  });

  it("holds the word budgets, at the limit and one over", () => {
    const at = fixture();
    leversOf(at).levers[0]!.label = words(4);
    setting(at, "p-hold").label = words(6);
    setting(at, "p-hold").detail = words(14);
    setting(at, "p-hold").say = words(20);
    expect(errorsOf(at)).toBe("");

    const over = fixture();
    leversOf(over).levers[0]!.label = words(5);
    setting(over, "p-hold").label = words(7);
    setting(over, "p-hold").detail = words(15);
    setting(over, "p-hold").say = words(21);
    const found = errorsOf(over);
    expect(found).toMatch(/m1\/price: "lever label" is 5 words, budget is 4/);
    expect(found).toMatch(/m1\/price\/p-hold: "label" is 7 words, budget is 6/);
    expect(found).toMatch(/m1\/price\/p-hold: "detail" is 15 words, budget is 14/);
    expect(found).toMatch(/m1\/price\/p-hold: "say" is 21 words, budget is 20/);
  });

  it("leak-checks every setting's copy, because all of it is read before deciding", () => {
    const c = fixture();
    setting(c, "p-hold").detail = "The recommended answer.";
    setting(c, "p-match").say = "This is the optimal cut.";
    leversOf(c).levers[1]!.label = "Best choice";
    const found = errorsOf(c);
    expect(found).toMatch(/m1\/price\/p-hold: "detail" predicts the outcome \("recommended"\)/);
    expect(found).toMatch(/m1\/price\/p-match: "say" predicts the outcome \("optimal"\)/);
    expect(found).toMatch(/m1\/ask: "lever label" predicts the outcome \("best choice"\)/);
  });

  it("needs a label and a detail on every setting", () => {
    const c = fixture();
    setting(c, "p-hold").label = " ";
    setting(c, "p-hold").detail = "";
    const found = errorsOf(c);
    expect(found).toMatch(/m1\/price\/p-hold: setting has no label/);
    expect(found).toMatch(/m1\/price\/p-hold: setting has no detail/);
  });
});

/* ─────────────────────────── the sweep ─────────────────────────── */

describe("the sweep and lever decisions", () => {
  const result = sweep(F);

  it("enumerates every open combination, first lever slowest", () => {
    expect(possibleSelections(leversOf(F), atLevers("s-a", "o-skip"))).toEqual([
      ["p-hold", "a-nothing"],
      ["p-hold", "a-term"],
      ["p-match", "a-nothing"],
      ["p-match", "a-term"],
    ]);
    expect(possibleSelections(leversOf(F), atLevers("s-a", "o-meet"))).toHaveLength(6);
  });

  it("plays every combination of settings", () => {
    const played = [...result.exercisedSettings].filter((k) => k.startsWith("m1/")).sort();
    expect(played).toEqual(
      [
        "m1/p-hold,a-nothing",
        "m1/p-hold,a-term",
        "m1/p-hold,a-lead",
        "m1/p-match,a-nothing",
        "m1/p-match,a-term",
        "m1/p-match,a-lead",
      ].sort(),
    );
  });

  it("exercises every setting and fires every authored outcome", () => {
    const settings = leversOf(F).levers.flatMap((l) => l.options.map((o) => `m1/${o.id}`));
    expect(settings.filter((id) => !result.exercisedOptions.has(id))).toEqual([]);

    const declared = Object.values(F.nodes).flatMap((n) =>
      !isMission(n) ? [] : n.kind === "choice" ? n.options.flatMap((o) => o.outcomes.map((x) => x.id)) : n.outcomes.map((x) => x.id),
    );
    expect(declared.filter((id) => !result.firedOutcomes.has(id))).toEqual([]);
    expect(result.reachableFlags).toEqual(new Set(["start:a", "start:b", "has:lead", "discounted", "asked:term", "asked:lead"]));
  });

  it("would report a combination's outcome dead if no combination reached it", () => {
    /* The gate failing on purpose. Lock `a-term` behind a condition no record can meet
       and the two outcomes written over it can never fire. */
    const c = fixture();
    setting(c, "a-term").requires = { all: ["has:lead"], none: ["has:lead"] };
    const fired = sweep(c).firedOutcomes;
    expect(fired.has("m1-traded")).toBe(false);
    expect(fired.has("m1-asked")).toBe(false);
  });

  it("is deterministic", () => {
    const again = sweep(F);
    expect([...again.exercisedSettings]).toEqual([...result.exercisedSettings]);
    expect([...again.firedOutcomes]).toEqual([...result.firedOutcomes]);
    expect(again.statesAtMission).toEqual(result.statesAtMission);
  });

  it("finds a setting that is free money once the outcomes are counted", () => {
    /* The static rule is dims alone; this is the half only the walk sees. Give both
       outcomes written over "A longer contract" a large win on every bar and the setting
       beats "Nothing" in every reachable comparison with the price held. */
    const c = fixture();
    for (const o of leversOf(c).outcomes) {
      if (o.id === "m1-traded" || o.id === "m1-asked") o.effect = { dims: { win: 20, profit: 20, deliver: 20 } };
    }
    expect(findRealisedDominance(F)).toEqual([]);
    const found = findRealisedDominance(c).map((f) => `${f.mission}:${f.dominant}>${f.dominated}:${f.share}`);
    expect(found).toContain("m1:a-term>a-nothing:1");
  });

  it("gives a lever decision its own glyph on the map", () => {
    expect(missionList(F).map((m) => m.activity)).toEqual(["choice", "levers"]);
  });
});

/* ─────────────────────────── run codes and saves ─────────────────────────── */

describe("run codes carry lever decisions", () => {
  const run: Run = { advantage: "s-b", selections: [["o-meet"], ["a-lead", "p-match"]] };

  it("round-trips, reading the settings back in lever order", () => {
    const code = encodeRun(F, run);
    const read = decodeRun(F, code);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.run).toEqual({ advantage: "s-b", selections: [["o-meet"], ["p-match", "a-lead"]] });
    expect(JSON.stringify(read.state)).toBe(JSON.stringify(replayRun(F, run)));
    expect(read.state.history.at(-1)?.outcomeId).toBe("m1-led");
    expect(codeFromState(read.state, F)).toBe(code);
  });

  it("gives every complete run its own code, and every code its own run", () => {
    const codes = new Map<string, string>();
    for (const advantage of ["s-a", "s-b"]) {
      for (const first of ["o-skip", "o-meet"]) {
        const at = atLevers(advantage, first);
        for (const combo of possibleSelections(leversOf(F), at)) {
          const r: Run = { advantage, selections: [[first], combo] };
          const code = encodeRun(F, r);
          const read = decodeRun(F, code);
          expect(read.ok && read.run).toEqual(r);
          expect(codes.has(code), code).toBe(false);
          codes.set(code, JSON.stringify(r));
        }
      }
    }
    expect(codes.size).toBe(2 * (4 + 6));
  });

  it("refuses a code once a lever's shape moves, and keeps it through a rules retune", () => {
    const code = encodeRun(F, run);

    const reshaped = fixture();
    leversOf(reshaped).levers[0]!.options.push({ id: "p-half", label: "Meet them halfway", detail: "Split the difference.", dims: { win: 2, profit: -2 } });
    expect(shapeFingerprint(reshaped)).not.toBe(shapeFingerprint(F));
    const read = decodeRun(reshaped, code);
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.reason).toBe("content");

    const relocked = fixture();
    setting(relocked, "a-lead").requires = { all: ["start:b"] };
    expect(shapeFingerprint(relocked)).not.toBe(shapeFingerprint(F));

    const retuned = fixture();
    setting(retuned, "p-match").dims = { win: 7, profit: -4 };
    expect(shapeFingerprint(retuned)).toBe(shapeFingerprint(F));
    expect(rulesFingerprint(retuned)).not.toBe(rulesFingerprint(F));
    expect(decodeRun(retuned, code).ok).toBe(true);
  });

  /**
   * "Old codes must still decode." The fingerprints and a code below were minted by the
   * engine as it stood BEFORE lever decisions existed (commit a9e1f6f), over this fixture
   * with the lever decision taken out. If adding the kind had moved the canonical text of
   * any existing kind, or the packing, these would move with it — and every code a cohort
   * has written down would stop reading.
   */
  it("reads a code minted before levers existed", () => {
    const pre = fixture();
    delete pre.nodes.m1;
    const m0 = pre.nodes.m0;
    if (m0?.kind !== "choice") throw new Error("fixture: m0");
    m0.next = "end";
    pre.missionOrder = ["m0"];
    pre.chapters = [{ number: 1, label: "One", title: "The deal", missionIds: ["m0"], steps: ["Meet"] }];

    expect(shapeFingerprint(pre)).toBe(PRE_LEVERS.shape);
    expect(rulesFingerprint(pre)).toBe(PRE_LEVERS.rules);
    expect(encodeRun(pre, { advantage: "s-b", selections: [["o-meet"]] })).toBe(PRE_LEVERS.code);
    const read = decodeRun(pre, PRE_LEVERS.code);
    expect(read.ok && read.run).toEqual({ advantage: "s-b", selections: [["o-meet"]] });
  });
});

describe("saves at a lever decision", () => {
  it("keep a half-set panel, and refuse two settings on one lever", () => {
    const half = press(atLevers(), "p-hold");
    const kept = decodeSave(encodeSave(half, F), F);
    expect(kept.status).toBe("ok");
    if (kept.status === "ok") expect(kept.state.selection).toEqual(["p-hold"]);

    const twice = { ...half, selection: ["p-hold", "p-match"] };
    expect(decodeSave(encodeSave(twice, F), F).status).toBe("stale");
  });

  it("resume at the consequence of a lever decision", () => {
    const at = commit(press(atLevers(), "p-match", "a-term"), F);
    const back = decodeSave(encodeSave(at, F), F);
    expect(back.status).toBe("ok");
    if (back.status === "ok") expect(back.state).toEqual(at);
  });
});

/**
 * Minted by the pre-lever engine — `src/engine` at a9e1f6f, run over the same lever-free
 * fixture — and copied here by hand. See "reads a code minted before levers existed".
 */
const PRE_LEVERS = { shape: "77c888e3", rules: "bc61a036", code: "1EZ4-7TP" };
