/**
 * Tests for the content validator itself.
 *
 * Every test here builds the violation and then asserts the validator SEES it.
 * That direction matters. `D-037` records three gates in this repo that were
 * written for a specific bug and could not see it — a regex that could not
 * follow a template literal, a test that asserted a token was declared when the
 * bug was that it was declared twice, and a glob that excluded the file
 * carrying the defect. All three passed for the same reason: nobody ever made
 * them fail on purpose. A gate that has never been shown to fail is not a gate,
 * it is a comment.
 *
 * So: for each check, one clone of the real content with one thing broken in it.
 * `engine.test.ts` asserts the content as authored is clean; this file asserts
 * the validator would notice if it were not.
 */

import { describe, expect, it } from "vitest";

import { story } from "../content/story";
import {
  LESSON_OVERLAP_LIMIT,
  SAY_TITLE_OVERLAP_LIMIT,
  contentWords,
  overlap,
  validateContent,
  type Issue,
} from "./validate";
import {
  isMission,
  type ChoiceMission,
  type Content,
  type Interlude,
  type Mission,
} from "./types";

/* ── harness ─────────────────────────────────────────────────────── */

const clone = (): Content => structuredClone(story) as Content;

const missionsOf = (c: Content): Mission[] => Object.values(c.nodes).filter(isMission);

const firstChoice = (c: Content): ChoiceMission => {
  const m = missionsOf(c).find((x): x is ChoiceMission => x.kind === "choice");
  if (!m) throw new Error("no choice mission to break");
  return m;
};

const errorsOf = (c: Content): Issue[] =>
  validateContent(c).filter((i) => i.severity === "error");

const key = (i: Issue) => `${i.where}: ${i.message}`;

/**
 * The errors the pristine content already raises, so every assertion below is
 * about the DELTA a deliberate break produces.
 *
 * This is not fastidiousness. `story.ts` is under active authoring by someone
 * else while this file is being written, and an absolute `expect(errors).toBe("")`
 * would make these tests report on their neighbour's half-finished mission
 * instead of on the validator. A gate that goes red for a reason it is not
 * about is a gate that gets skipped.
 */
const BASELINE = new Set(errorsOf(story).map(key));

/** The new errors a broken clone produces, as one searchable block. */
const brokeIt = (c: Content): string =>
  errorsOf(c)
    .map(key)
    .filter((k) => !BASELINE.has(k))
    .join("\n");

const longText = (n: number): string => Array.from({ length: n }, () => "filler").join(" ");

/* ── harness · warnings ──────────────────────────────────────────────
 * The say/title paraphrase check is the one rule in this pass that reports
 * rather than blocks, so the delta has to be taken over warnings as well.
 * Same baseline discipline and for the same reason as `BASELINE`: `story.ts`
 * legitimately carries two classes of warning today. */

const warningsOf = (c: Content): Issue[] =>
  validateContent(c).filter((i) => i.severity === "warning");

const BASELINE_WARNINGS = new Set(warningsOf(story).map(key));

const warnedIt = (c: Content): string =>
  warningsOf(c)
    .map(key)
    .filter((k) => !BASELINE_WARNINGS.has(k))
    .join("\n");

/** Any flag the content actually sets, for building a condition that is not a typo. */
const someFlag = (c: Content): string => {
  for (const m of missionsOf(c)) {
    const outcomes = m.kind === "choice" ? m.options.flatMap((o) => o.outcomes) : m.outcomes;
    for (const o of outcomes) {
      const f = o.effect.flags?.[0];
      if (f) return f;
    }
  }
  throw new Error("no flag in the content to condition on");
};

/**
 * A choice mission restaged as a conversation, with a spoken reply on every
 * option — that is, a VALID `dialogue` beat, built here rather than borrowed.
 *
 * Deliberately not `missionsOf(story).find(m => m.presentation === "dialogue")`.
 * The staging is being authored in `story.ts` while this file is written, so a
 * fixture that waited for it would make every test below report on whether
 * somebody else had finished rather than on whether the validator works — the
 * same reason `BASELINE` exists. It also keeps each test's deliberate break the
 * only broken thing, which is the shape of this whole file.
 */
const REPLY = "Right, let me tell you where I would put our weight.";

const asDialogue = (c: Content): ChoiceMission => {
  const m = firstChoice(c);
  m.presentation = "dialogue";
  m.advisorLine = "Your call. I will back whichever way you go.";
  for (const o of m.options) o.say = REPLY;
  return m;
};

/* ── baseline ────────────────────────────────────────────────────── */

/**
 * The messages every check added in this pass can emit.
 *
 * Asserting that none of them fires on today's content is the claim that
 * matters: these checks close doors, they do not report breaches. Stated as
 * message patterns rather than as "no errors at all", because the content is
 * being edited concurrently and an unrelated error would otherwise be
 * misattributed to a door being closed here.
 */
const NEW_CHECKS: RegExp[] = [
  /diverts to ".*", which does not exist/,
  /* Every leak message, not a list of the field names added in this pass. The
     point of the door was that the list of fields was the bug; a test that
     names a list of fields reintroduces it one layer up. */
  /predicts the outcome/,
  /"(prompt|advisorLine|advisor\.quote|advisor\.steer|saidQuote)" is \d+ words/,
  /lists neither pros nor cons/,
  /cons without pros/,
  /"(pros|cons)\[\d+\]" is empty/,
  /"changed\[\d+\]" is empty/,
  /"changed\[\d+\]" repeats an earlier entry/,
  /"changed\[\d+\]" is \d+ words/,
  /things that changed — more than four/,
  /states a signed number/,
  /states a score movement/,
  /puts a number next to a dimension name/,
  /lesson\.(principle|because) is the same as/,
  /lesson\.(principle|because) is a paraphrase of/,
  /overrides the lesson with the mission's own lesson/,
];

/**
 * Every message the dialogue-staging checks can emit, errors and warning alike.
 *
 * Same claim as `NEW_CHECKS` one pass later: these rules close doors, they do
 * not report breaches on the content as it stands.
 */
const DIALOGUE_CHECKS: RegExp[] = [
  /has no "say"/,
  /"say" predicts the outcome/,
  /"say" is \d+ words/,
  /nobody to speak first/,
  /"say" (restates|is the) "title"/,
];

describe("the content as authored", () => {
  it("trips none of the checks added in this pass", () => {
    const tripped = [...BASELINE].filter((k) => NEW_CHECKS.some((r) => r.test(k)));
    expect(tripped).toEqual([]);
  });

  it("trips none of the dialogue-staging checks either", () => {
    /* Warnings included, because the paraphrase check reports rather than
       blocks and would otherwise be the one rule in this file nothing holds to
       the authored content. */
    const tripped = [...BASELINE, ...BASELINE_WARNINGS].filter((k) =>
      DIALOGUE_CHECKS.some((r) => r.test(k)),
    );
    expect(tripped).toEqual([]);
  });

  /**
   * Recorded because it changes what "warning" means in `validate.ts`.
   *
   * `engine.test.ts` pins the set of non-flag warnings to empty, so a WARNING
   * that fires on current content stops the build exactly as an ERROR does. The
   * severity field here is therefore a statement of intent — is this a defect or
   * a thing to look at — and not a statement of consequence. A new warning is
   * not a soft landing for a check that fires today.
   */
  it("raises warnings only in the three classes that already have owners", () => {
    const unowned = validateContent(story).filter(
      (i) =>
        i.severity === "warning" &&
        !/is set but never read/.test(i.message) &&
        !/gates on a dimension value/.test(i.message) &&
        /* The third class, added with the ledger rules for backlog 4.2: a flag that
           decides a branch and appears in no ledger rule. Three remain, each pinned by
           name with a reason in `engine.test.ts` — so this class is owned in exactly the
           same way as the dead narrative flags above, by a list somebody has to edit
           deliberately rather than by a warning nobody reads. */
        !/no ledger rule/.test(i.message),
    );
    expect(unowned).toEqual([]);
  });
});

/* ── door 1 · outcome.next ───────────────────────────────────────── */

describe("outcome.next is part of the graph", () => {
  it("names the field when a divert points at nothing", () => {
    const c = clone();
    const m = firstChoice(c);
    m.options[0].outcomes[0].next = "en"; // the typo for "end"
    expect(brokeIt(c)).toMatch(/diverts to "en", which does not exist/);
  });

  it("catches it even on a conditional branch nothing reachable takes", () => {
    /* The reason this check has to be static. A divert on a rarely-matched
       `when` is exactly the one that escapes the sweep for longest. */
    const c = clone();
    const m = firstChoice(c);
    const last = m.options[0].outcomes[m.options[0].outcomes.length - 1];
    m.options[0].outcomes.unshift({
      ...structuredClone(last),
      id: "never-fires",
      when: { all: ["flag:that:cannot:be:set"] },
      next: "nowhere",
    });
    expect(brokeIt(c)).toMatch(/diverts to "nowhere", which does not exist/);
  });

  it("does not call a node an orphan when only a divert reaches it", () => {
    const c = clone();
    const detour: Interlude = {
      kind: "interlude",
      id: "detour",
      chapter: 1,
      eyebrow: "Aside",
      title: "The pursuit ends here",
      body: ["You walked away."],
      next: "end",
    };
    c.nodes.detour = detour;
    firstChoice(c).options[0].outcomes[0].next = "detour";
    expect(brokeIt(c)).not.toMatch(/orphan/);
  });

  it("still calls a node an orphan when nothing reaches it at all", () => {
    /* The other half of the same change. Widening the walk must not have turned
       the orphan check into a no-op — that is the D-037 "glob is a scope
       decision" failure in a different costume. */
    const c = clone();
    c.nodes.stranded = {
      kind: "interlude",
      id: "stranded",
      chapter: 1,
      eyebrow: "Aside",
      title: "Nobody comes here",
      body: ["."],
      next: "end",
    } satisfies Interlude;
    expect(brokeIt(c)).toMatch(/stranded: orphan/);
  });
});

/* ── door 2 · the pre-decision prose surface ─────────────────────── */

describe("every pre-decision field is leak-checked", () => {
  const leaks: [string, (m: Mission) => void][] = [
    ["prompt", (m) => void (m.prompt = "Pick the optimal route.")],
    ["advisorLine", (m) => void (m.advisorLine = "You should phase it.")],
    ["advisor.quote", (m) => void (m.advisor && (m.advisor.quote = "The best option is speed."))],
    ["advisor.steer", (m) => void (m.advisor && (m.advisor.steer = "Take the recommended path."))],
    [
      "saidQuote",
      (m) => void (m.saidQuote = { text: "Give us the best choice.", speaker: "Sarah Lim", role: "CTO" }),
    ],
    ["concerns", (m) => void (m.concerns = ["You should hurry."])],
    [
      "client.blurb",
      (m) =>
        void (m.client = {
          name: "Northwind",
          monogram: "NW",
          tags: [],
          blurb: "The recommended supplier.",
          facts: [],
        }),
    ],
    [
      "assessment note",
      (m) =>
        void (m.assessment = [
          { icon: "chart", label: "Value", level: "high", note: "The optimal read.", tone: "good" },
        ]),
    ],
  ];

  for (const [field, breakIt] of leaks) {
    it(`fails on an outcome prediction in ${field}`, () => {
      const c = clone();
      breakIt(firstChoice(c));
      expect(brokeIt(c)).toMatch(/predicts the outcome/);
    });
  }

  it("fails on an outcome prediction in an option title", () => {
    const c = clone();
    firstChoice(c).options[0].title = "Phase it — the best choice";
    expect(brokeIt(c)).toMatch(/"title" predicts the outcome/);
  });

  it("still fails on the fields that were already covered", () => {
    const c = clone();
    firstChoice(c).options[0].commits = "Improves profitability";
    expect(brokeIt(c)).toMatch(/"commits" predicts the outcome/);
  });

  it("fails on a leak in the situation, the largest pre-decision block of all", () => {
    const c = clone();
    firstChoice(c).situation = ["Phasing is the optimal move here."];
    expect(brokeIt(c)).toMatch(/"situation" predicts the outcome/);
  });

  it("fails on a leak in a situation variant", () => {
    const c = clone();
    const m = firstChoice(c);
    m.variants = [{ situation: ["You should hold the price."] }];
    expect(brokeIt(c)).toMatch(/variant: "situation" predicts the outcome/);
  });

  it("fails on a leak in an evidence card, which is an option by another name", () => {
    const c = clone();
    const m = missionsOf(c).find((x) => x.kind === "investigate");
    if (m?.kind !== "investigate") throw new Error("no investigate mission");
    m.evidence[0].question = "What is the best option here?";
    expect(brokeIt(c)).toMatch(/"question" predicts the outcome/);
  });

  it("fails on a leak in a proposal component", () => {
    const c = clone();
    const m = missionsOf(c).find((x) => x.kind === "build");
    if (m?.kind !== "build") throw new Error("no build mission");
    m.components[0].description = "The recommended inclusion.";
    expect(brokeIt(c)).toMatch(/"description" predicts the outcome/);
  });

  it("fails on a leak in chapter 0, which is entirely pre-decision", () => {
    const c = clone();
    for (const node of Object.values(c.nodes)) {
      if (node.kind !== "setup") continue;
      node.options[0].tradeoff = "Not the optimal start.";
    }
    expect(brokeIt(c)).toMatch(/"tradeoff" predicts the outcome/);
  });
});

describe("the four unbudgeted briefing fields", () => {
  it("budgets prompt", () => {
    const c = clone();
    firstChoice(c).prompt = longText(40);
    expect(brokeIt(c)).toMatch(/"prompt" is 40 words/);
  });

  it("budgets advisorLine", () => {
    const c = clone();
    firstChoice(c).advisorLine = longText(40);
    expect(brokeIt(c)).toMatch(/"advisorLine" is 40 words/);
  });

  it("budgets the advisor's standing quote, which renders in the same slot", () => {
    const c = clone();
    const m = firstChoice(c);
    if (m.advisor) m.advisor.quote = longText(40);
    expect(brokeIt(c)).toMatch(/"advisor\.quote" is 40 words/);
  });

  it("budgets advisor.steer", () => {
    const c = clone();
    const m = firstChoice(c);
    if (m.advisor) m.advisor.steer = longText(40);
    expect(brokeIt(c)).toMatch(/"advisor\.steer" is 40 words/);
  });

  it("budgets saidQuote", () => {
    const c = clone();
    firstChoice(c).saidQuote = { text: longText(40), speaker: "Sarah Lim", role: "CTO" };
    expect(brokeIt(c)).toMatch(/"saidQuote" is 40 words/);
  });
});

/* ── door 3 · pros and cons in pairs ─────────────────────────────── */

describe("G3a covers the option that lists neither", () => {
  it("fails on an option with neither pros nor cons", () => {
    /* The old test was `hasPros !== hasCons`, so this — the cheapest possible
       evasion of the rule, deleting both lists — passed silently. */
    const c = clone();
    const o = firstChoice(c).options[0];
    delete o.pros;
    delete o.cons;
    expect(brokeIt(c)).toMatch(/lists neither pros nor cons/);
  });

  it("fails on empty arrays as well as absent ones", () => {
    const c = clone();
    const o = firstChoice(c).options[0];
    o.pros = [];
    o.cons = [];
    expect(brokeIt(c)).toMatch(/lists neither pros nor cons/);
  });

  it("fails on arrays of empty strings, which have a length but say nothing", () => {
    /* The cheapest evasion of the fixed check, found by asking the question
       D-037 exists to make people ask: `[""]` has length 1, so every length
       test in this file passed it while the card rendered two blank bullets. */
    const c = clone();
    const o = firstChoice(c).options[0];
    o.pros = [""];
    o.cons = ["   "];
    const errs = brokeIt(c);
    expect(errs).toMatch(/"pros\[0\]" is empty/);
    expect(errs).toMatch(/"cons\[0\]" is empty/);
    expect(errs).toMatch(/lists neither pros nor cons/);
  });

  it("still fails on pros without cons", () => {
    const c = clone();
    delete firstChoice(c).options[0].cons;
    expect(brokeIt(c)).toMatch(/pros without cons/);
  });

  it("still fails on cons without pros", () => {
    const c = clone();
    delete firstChoice(c).options[0].pros;
    expect(brokeIt(c)).toMatch(/cons without pros/);
  });
});

/* ── door 4 · outcome.changed ────────────────────────────────────── */

describe("outcome.changed is checked as a list, not just for emptiness", () => {
  const breakChanged = (c: Content, changed: string[]) => {
    firstChoice(c).options[0].outcomes[0].changed = changed;
  };

  it("fails on an entry that is empty", () => {
    const c = clone();
    breakChanged(c, ["The sponsor is gone.", "   "]);
    expect(brokeIt(c)).toMatch(/"changed\[1\]" is empty/);
  });

  it("fails on a repeated entry, including one repunctuated", () => {
    const c = clone();
    breakChanged(c, ["The sponsor is gone.", "The sponsor is gone"]);
    expect(brokeIt(c)).toMatch(/"changed\[1\]" repeats an earlier entry/);
  });

  it("budgets each entry", () => {
    const c = clone();
    breakChanged(c, [longText(25)]);
    expect(brokeIt(c)).toMatch(/"changed\[0\]" is 25 words/);
  });

  it("fails on more than four entries", () => {
    const c = clone();
    breakChanged(c, ["One thing.", "Two things.", "Three.", "Four.", "Five."]);
    expect(brokeIt(c)).toMatch(/lists 5 things that changed/);
  });

  it("fails on a signed number, which the meters already own", () => {
    const c = clone();
    breakChanged(c, ["Your margin moved -6 on this deal."]);
    expect(brokeIt(c)).toMatch(/states a signed number/);
  });

  it("fails on a score movement in points or percent", () => {
    const c = clone();
    breakChanged(c, ["You gave up 12 points of margin."]);
    expect(brokeIt(c)).toMatch(/states a score movement/);
  });

  it("fails on a number sitting next to a dimension name", () => {
    const c = clone();
    breakChanged(c, ["Winability now sits at 64."]);
    expect(brokeIt(c)).toMatch(/puts a number next to a dimension name/);
  });

  it("leaves ordinary prose with a number in it alone", () => {
    /* Calibration in the other direction. "Three of six" is a fact about the
       world, not a restatement of a meter, and a gate that cannot tell the
       difference gets deleted by the first author it annoys. */
    const c = clone();
    breakChanged(c, ["Three of the six workstreams are now yours.", "Marcus Reed is watching."]);
    expect(brokeIt(c)).toBe("");
  });
});

/* ── door 5 · sixteen missions, sixteen lessons ──────────────────── */

describe("lessons must be distinct across missions", () => {
  const twoMissions = (c: Content): [Mission, Mission] => {
    const all = missionsOf(c);
    return [all[0], all[1]];
  };

  it("fails when two missions carry the same principle", () => {
    const c = clone();
    const [a, b] = twoMissions(c);
    b.lesson.principle = a.lesson.principle;
    expect(brokeIt(c)).toMatch(/lesson\.principle is the same as/);
  });

  it("fails when two missions carry the same because", () => {
    const c = clone();
    const [a, b] = twoMissions(c);
    b.lesson.because = a.lesson.because;
    expect(brokeIt(c)).toMatch(/lesson\.because is the same as/);
  });

  it("is not evaded by punctuation, which defeats an exact-string check", () => {
    const c = clone();
    const [a, b] = twoMissions(c);
    b.lesson.principle = `  ${a.lesson.principle.replace(/\.$/, "")}!  `;
    expect(brokeIt(c)).toMatch(/lesson\.principle is the same as/);
  });

  it("is not evaded by adding a word, which defeats a normalised check", () => {
    const c = clone();
    const [a, b] = twoMissions(c);
    b.lesson.principle = `${a.lesson.principle} Usually.`;
    expect(brokeIt(c)).toMatch(/lesson\.principle is a paraphrase of/);
  });

  it("would fail if all sixteen taught one sentence — the stated door", () => {
    const c = clone();
    const all = missionsOf(c);
    for (const m of all) m.lesson = { ...all[0].lesson };
    const errs = errorsOf(c).filter((e) => /lesson\.(principle|because) is the same as/.test(e.message));
    expect(errs.length).toBeGreaterThan(0);
  });

  it("fails when an outcome override restates the mission's own lesson", () => {
    const c = clone();
    const m = firstChoice(c);
    m.options[0].outcomes[0].lesson = { ...m.lesson };
    expect(brokeIt(c)).toMatch(/overrides the lesson with the mission's own lesson/);
  });

  /**
   * The calibration, pinned.
   *
   * `LESSON_OVERLAP_LIMIT` is only defensible if there is measured headroom
   * between it and the closest legitimate pair. Measured on arrival: 0.17 for
   * `principle`, 0.18 for `because`. If a future author narrows that, this test
   * says so in one line instead of the gate firing on innocent prose and being
   * loosened in irritation.
   */
  it("keeps real headroom between the closest authored pair and the limit", () => {
    const missions = missionsOf(story);
    const worst = (pick: (m: Mission) => string) => {
      const bags = missions.map(pick).map(contentWords);
      let max = 0;
      for (let i = 0; i < bags.length; i++) {
        for (let j = i + 1; j < bags.length; j++) max = Math.max(max, overlap(bags[i], bags[j]));
      }
      return max;
    };
    const principle = worst((m) => m.lesson.principle);
    const because = worst((m) => m.lesson.because);
    expect(principle).toBeLessThan(LESSON_OVERLAP_LIMIT / 2);
    expect(because).toBeLessThan(LESSON_OVERLAP_LIMIT / 2);
  });
});

/* ── door 6 · advisor.steer ──────────────────────────────────────── */

describe("advisor.steer", () => {
  /**
   * Dead API, not an unbuilt feature. `MissionBase.advisorLine` does the same
   * job one level up — "what that colleague says on THIS mission" — and it is
   * the field `mission.tsx` actually renders (`mission.advisorLine ??
   * mission.advisor.quote`). `steer` is the earlier spelling of the same idea,
   * left behind when the override moved off the shared advisor object, which is
   * where it had to move: advisors are shared constants, so a per-mission steer
   * on a shared object is a field that cannot hold sixteen different values.
   *
   * It is not deleted here because `types.ts` is owned elsewhere. This test is
   * the interim guard, and it guards the thing that actually hurts: content
   * written into a field no player will ever see. That has already happened
   * once in this repo — `watchFor`, 32 authored, 0 rendered, 471 words.
   *
   * If this fails, one of two things is true. Either somebody wired `steer`
   * into the UI, in which case delete this test; or somebody wrote prose into
   * it, in which case move the prose to `advisorLine`.
   */
  it("is used by no mission, because nothing renders it", () => {
    const using = missionsOf(story)
      .filter((m) => m.advisor?.steer)
      .map((m) => m.id);
    expect(using).toEqual([]);
  });
});

/* ── door 7 · a dialogue beat must actually speak ─────────────────── */

describe("every option of a dialogue mission carries a spoken reply", () => {
  it("passes when every option speaks and somebody opens the scene", () => {
    /* The fixture itself, unbroken. Without this the tests below could all be
       passing on the restaging rather than on the thing each one breaks. */
    const c = clone();
    asDialogue(c);
    expect(brokeIt(c)).toBe("");
    expect(warnedIt(c)).toBe("");
  });

  it("fails, naming both ids, when one option has no say", () => {
    /* An error and not a warning: with `say` absent the renderer falls back to
       the third-person `title` and the beat silently stops being a
       conversation. Nothing crashes and nothing looks broken enough to
       report. */
    const c = clone();
    const m = asDialogue(c);
    delete m.options[1].say;
    expect(brokeIt(c)).toMatch(
      new RegExp(`option "${m.options[1].id}" of dialogue mission "${m.id}" has no "say"`),
    );
  });

  it("is not evaded by an empty string, which satisfies a presence check", () => {
    const c = clone();
    const m = asDialogue(c);
    m.options[0].say = "";
    expect(brokeIt(c)).toMatch(/has no "say"/);
  });

  it("is not evaded by whitespace, which even has a length", () => {
    /* The same evasion `pros: [""]` used until it was closed per entry. */
    const c = clone();
    const m = asDialogue(c);
    m.options[0].say = "   ";
    expect(brokeIt(c)).toMatch(/has no "say"/);
  });

  it("catches every silent option, not just the first", () => {
    const c = clone();
    const m = asDialogue(c);
    for (const o of m.options) delete o.say;
    const fired = brokeIt(c)
      .split("\n")
      .filter((l) => /has no "say"/.test(l));
    expect(fired).toHaveLength(m.options.length);
  });

  it("asks nothing of a console beat, which renders title and description", () => {
    /* The complement, so the rule is shown to be scoped rather than merely
       unfired. A console option with no `say` is not missing anything. */
    const c = clone();
    const m = firstChoice(c);
    delete m.presentation;
    for (const o of m.options) delete o.say;
    expect(brokeIt(c)).toBe("");
  });
});

describe("say is leak-checked on the same surface as commits", () => {
  it("fails on an outcome prediction in a spoken reply", () => {
    const c = clone();
    const m = asDialogue(c);
    m.options[0].say = "Let us take the optimal route and be done with it.";
    expect(brokeIt(c)).toMatch(/"say" predicts the outcome/);
  });

  it("checks it on a console beat too, where nothing renders it yet", () => {
    /* The evasion this closes: park a prediction in `say` while the beat is
       staged `console`, where no screen shows it and no reviewer reads it, then
       restage the beat later with one word and the leak goes live. G3 is a
       property of the content, not of what is currently on screen. */
    const c = clone();
    const m = firstChoice(c);
    delete m.presentation;
    m.options[0].say = "This is the recommended way in.";
    expect(brokeIt(c)).toMatch(/"say" predicts the outcome/);
  });
});

describe("say is on the tightest briefing budget", () => {
  it("fails over twenty words, because the replies are stacked full-width rows", () => {
    const c = clone();
    const m = asDialogue(c);
    m.options[0].say = longText(21);
    expect(brokeIt(c)).toMatch(/"say" is 21 words, budget is 20 — cut it/);
  });

  it("allows exactly twenty, so the boundary is where it is documented", () => {
    const c = clone();
    const m = asDialogue(c);
    m.options[0].say = longText(20);
    expect(brokeIt(c)).toBe("");
  });

  it("budgets it on a console beat as well", () => {
    const c = clone();
    const m = firstChoice(c);
    delete m.presentation;
    m.options[0].say = longText(30);
    expect(brokeIt(c)).toMatch(/"say" is 30 words/);
  });
});

describe("a dialogue beat needs somebody to speak first", () => {
  /** Strip every opener the renderer would resolve, in its order. */
  const silence = (m: ChoiceMission) => {
    delete m.saidQuote;
    delete m.quotes;
    delete m.advisorLine;
    if (m.advisor) m.advisor.quote = "";
  };

  it("fails when none of the four openers is present", () => {
    const c = clone();
    const m = asDialogue(c);
    silence(m);
    expect(brokeIt(c)).toMatch(/nobody to speak first/);
  });

  it("is not evaded by openers that are present but blank", () => {
    /* All four authored, all four saying nothing. A presence check passes this
       and the scene still opens on silence. */
    const c = clone();
    const m = asDialogue(c);
    m.saidQuote = { text: "  ", speaker: "Sarah Lim", role: "CTO" };
    m.quotes = [{ text: "", speaker: "Sarah Lim", role: "CTO" }];
    m.advisorLine = "   ";
    if (m.advisor) m.advisor.quote = " ";
    expect(brokeIt(c)).toMatch(/nobody to speak first/);
  });

  it("accepts the advisor's standing quote, the last link in the chain", () => {
    /* The link most likely to be dropped from a hand-written check, because it
       is the fallback of a fallback — and `mission.tsx` really does resolve
       `advisorLine ?? advisor.quote`. */
    const c = clone();
    const m = asDialogue(c);
    silence(m);
    if (m.advisor) m.advisor.quote = "Whatever we write down, somebody has to build.";
    expect(brokeIt(c)).not.toMatch(/nobody to speak first/);
  });

  it("accepts a conditional quotes entry, as the renderer does", () => {
    /* Documented residual, pinned here so it is a known limit rather than a
       surprise: a beat whose ONLY opener is conditional passes this check and
       still opens silent in the states where the condition fails. Deciding that
       statically means asking whether a reachable state satisfies the
       condition, which is the sweep's job — `analysis.test.ts` fails on a line
       of dialogue no reachable state can hear. */
    const c = clone();
    const m = asDialogue(c);
    silence(m);
    m.quotes = [
      {
        when: { all: [someFlag(c)] },
        text: "Then we are agreed on the sequence, at least.",
        speaker: "Sarah Lim",
        role: "CTO",
      },
    ];
    expect(brokeIt(c)).not.toMatch(/nobody to speak first/);
  });

  it("wants the advisor object too, not just a line attributed to nobody", () => {
    /* `dialogue.tsx` pushes the colleague's turn on `advisor && (advisorLine ??
       advisor.quote)`, because a turn needs a name and a job title beside the
       words. So a line with no advisor to say it is silence, and this check
       reads the renderer's condition rather than a paraphrase of it. */
    const c = clone();
    const m = asDialogue(c);
    delete m.saidQuote;
    delete m.quotes;
    delete m.advisor;
    m.advisorLine = "Your call. I will back whichever way you go.";
    expect(brokeIt(c)).toMatch(/nobody to speak first/);
  });

  it("asks nothing of a console beat with no quotes and no advisor line", () => {
    const c = clone();
    const m = firstChoice(c);
    delete m.presentation;
    silence(m);
    expect(brokeIt(c)).not.toMatch(/nobody to speak first/);
  });
});

describe("say must be a reply, not the title in quotation marks", () => {
  /**
   * A warning, not an error, and the only one this pass adds.
   *
   * Judging paraphrase is a reviewer's job: a reply that picks up the noun
   * phrase it is answering is natural speech, and a hard gate would fire on
   * prose doing exactly the right thing. Note that a warning is not a soft
   * landing — `engine.test.ts` pins the non-flag warning set to empty, so one
   * that fires on today's content still stops the build. It is soft only for
   * the author of the next mission, who gets told rather than blocked.
   */
  it("warns when the spoken line is the title reworded by punctuation alone", () => {
    const c = clone();
    const m = asDialogue(c);
    const o = m.options[0];
    o.say = `"${o.title}!"`;
    expect(warnedIt(c)).toMatch(/"say" is the "title" reworded only by punctuation/);
    expect(brokeIt(c)).toBe("");
  });

  it("is not evaded by adding a word, which defeats a normalised check", () => {
    /* The same two-step evasion the lesson check documents: punctuation beats
       an exact-string comparison, one extra word beats normalising. Hence the
       overlap measure, and hence the SAME overlap measure — two ways of asking
       whether two sentences match is two answers, and the second one is the one
       nobody recalibrates. */
    const c = clone();
    const m = asDialogue(c);
    const o = m.options[0];
    o.title = "Phase the rollout by region";
    o.say = "Let us phase the rollout by region.";
    expect(warnedIt(c)).toMatch(/"say" restates "title"/);
  });

  it("leaves a reply that merely picks up the title's noun phrase alone", () => {
    /* Calibration in the other direction, as the `changed` checks have for
       numbers. A gate that cannot tell speech from restatement gets deleted by
       the first author it annoys. */
    const c = clone();
    const m = asDialogue(c);
    const o = m.options[0];
    o.title = "The post-purchase experience";
    o.say = "Then let us fix what happens after somebody has paid us. Returns, refunds, the lot.";
    expect(warnedIt(c)).toBe("");
    expect(brokeIt(c)).toBe("");
  });
});

describe("the dialogue rules are not vacuous", () => {
  const stagedDialogue = missionsOf(story).filter((m) => m.presentation === "dialogue");

  const authoredReplies = (): { where: string; say: string; title: string }[] =>
    missionsOf(story)
      .filter((m): m is ChoiceMission => m.kind === "choice")
      .flatMap((m) =>
        m.options
          .filter((o) => (o.say ?? "").trim().length > 0)
          .map((o) => ({ where: `${m.id}/${o.id}`, say: o.say as string, title: o.title })),
      );

  it("govern beats that exist, and every option of those beats speaks", () => {
    /* The vacuity guard, and the `watchFor` failure in reverse: that was 32
       lines authored and 0 rendered; this would be five rules enforced and 0
       beats staged. Either the staging is in use or it is dead API. */
    expect(stagedDialogue.map((m) => m.id).length).toBeGreaterThan(0);
    const silent = stagedDialogue
      .filter((m): m is ChoiceMission => m.kind === "choice")
      .flatMap((m) => m.options.filter((o) => !(o.say ?? "").trim()).map((o) => `${m.id}/${o.id}`));
    expect(silent).toEqual([]);
  });

  it("keep real headroom between the closest authored say/title pair and the limit", () => {
    /* `SAY_TITLE_OVERLAP_LIMIT` is only defensible if there is measured
       headroom under it, exactly as `LESSON_OVERLAP_LIMIT` is. Measured on
       arrival: see the comment on the constant. A future author who
       legitimately narrows the gap finds out in this one line, rather than in a
       warning that fires on innocent prose and gets loosened in irritation. */
    const replies = authoredReplies();
    expect(replies.length).toBeGreaterThan(0);
    let worst = 0;
    let worstWhere = "";
    for (const r of replies) {
      const o = overlap(contentWords(r.say), contentWords(r.title));
      if (o > worst) {
        worst = o;
        worstWhere = r.where;
      }
    }
    expect(worst, `closest authored say/title pair: ${worstWhere}`).toBeLessThan(
      SAY_TITLE_OVERLAP_LIMIT / 2,
    );
  });
});

/* ── the causal threads ──────────────────────────────────────────────
 * These had no checks at all until 4.5 needed one, and the cost of that is on the
 * record: five rules existed, `DECISIONS.md` claimed nine, and the ending's payoff
 * section was empty on 77% of runs. A thread naming an outcome that does not exist
 * simply never fires — no error, no warning, a quieter ending. Each check below is
 * therefore shown failing on purpose, per this file's opening note. */

describe("the causal threads", () => {
  const firstThread = (c: Content) => {
    const t = c.threads[0];
    if (!t) throw new Error("no thread to break");
    return t;
  };

  it("catches a thread that waits on an outcome no mission produces", () => {
    const c = clone();
    firstThread(c).needsOutcomes = ["m7-anchored", "o-typo-that-never-fires"];
    expect(brokeIt(c)).toContain("can never fire");
  });

  it("catches a thread that waits on a flag nothing sets", () => {
    const c = clone();
    firstThread(c).needsFlags = ["never_written_by_anything"];
    expect(brokeIt(c)).toContain("can never fire");
  });

  it("catches one decision restated as a chain", () => {
    const c = clone();
    firstThread(c).needsOutcomes = ["m7-anchored"];
    expect(brokeIt(c)).toContain("at least two outcomes");
  });

  /* Not the pre-decision leak rule — the ending is the one screen where naming what
     happened is the entire job. What the shared check buys here is the other half of its
     term list: the ending must never tell the player which decision was the right one,
     and it is the screen most likely to try. */
  it("catches thread copy that endorses a decision", () => {
    const c = clone();
    firstThread(c).soLater = "Reopening it was the best choice available to you.";
    expect(brokeIt(c)).toContain("best choice");
  });

  /* 4.5. The item offers `[because, ...insteadOf]` and confirms one of them. A
     duplicate makes the player right and the game wrong, which is worse than no item. */
  it("catches a wrong answer that repeats the right one", () => {
    const c = clone();
    const t = firstThread(c);
    t.insteadOf = [t.because, "Something else entirely, for the arity check."];
    expect(brokeIt(c)).toContain("two right answers");
  });

  it("catches a single wrong answer, which is a coin toss", () => {
    const c = clone();
    firstThread(c).insteadOf = ["Only one alternative."];
    expect(brokeIt(c)).toContain("coin toss");
  });
});
