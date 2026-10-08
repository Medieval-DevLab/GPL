import { describe, expect, it } from "vitest";

import { story } from "../content/story";
import { EARNED } from "../content/gates";
import {
  advance,
  causalClaim,
  causalThreads,
  commit,
  createInitialState,
  finalVerdict,
  getNode,
} from "./engine";
import {
  findDominantOptions,
  pastSetup,
  playMission,
  playScript,
  possibleSelections,
} from "./analysis";
import { codeFromState, decodeRun, replayRun } from "./runcode";
import { formatIssues, validateContent } from "./validate";
import { isMission } from "./types";

const content = story;

describe("content validity", () => {
  /* The named cards are passed because the engine may not import content: they are what
     lets a lever setting's flag be a card in the player's hand rather than dead state. */
  const issues = validateContent(content, { cards: Object.keys(EARNED) });
  const errors = issues.filter((i) => i.severity === "error");

  it("has no structural errors", () => {
    expect(formatIssues(errors)).toBe("content is valid");
  });

  /**
   * A flag written by an outcome and read by nothing is usually a bug — a condition that
   * was meant to gate on it, or a rename that only got done on one side.
   *
   * The set is pinned rather than merely printed, and for the eight-decision story it is
   * empty: every flag the script sets is read somewhere — by a later decision, the promise
   * calendar, an ending or the record board — which is the flag table in `STORY-V2.md`
   * made mechanical. Adding a flag nothing reads now fails here.
   */
  const NARRATIVE_ONLY_FLAGS: string[] = [];

  it("has no dead flags beyond the narrative ones", () => {
    const warnings = issues.filter((i) => i.severity === "warning");
    const dead = warnings
      .map((w) => /flag "([^"]+)" is set but never read/.exec(w.message)?.[1])
      .filter((f): f is string => Boolean(f));
    expect(dead.sort()).toEqual([...NARRATIVE_ONLY_FLAGS].sort());

    /*
     * The dimension gates, pinned by where they are. All four are at the end of the run
     * (D-086): the script chooses an ending on a bar ("Worth ≤ 39"), and three endings add
     * a line when Win is 60 or more. Every one sits on a twenty-point boundary, which is
     * what the sweep's buckets need to see both sides of it, and the sweep reports every
     * ending and every extra as reached — so the cost the warning describes was paid and
     * measured rather than assumed.
     */
    const other = warnings.filter((w) => !/is set but never read/.test(w.message));
    const dimGates = other.filter((w) => /gates on a dimension value/.test(w.message)).map((w) => w.where);
    expect(dimGates.sort()).toEqual(
      ["endings[5]", "endings[5]/extras[1]", "endings[6]/extras[0]", "endings[7]/extras[1]"].sort(),
    );

    /**
     * Claim items where exactly one candidate names a person. The eight-decision story's
     * threads carry no claim item yet, so none can.
     */
    const nameTells = other.filter((w) => /names a person/.test(w.message));
    expect(nameTells).toEqual([]);

    const unexpected = other.filter(
      (w) => !/gates on a dimension value/.test(w.message) && !/names a person/.test(w.message),
    );
    if (unexpected.length) console.log("content warnings:\n" + formatIssues(unexpected));
    expect(unexpected).toEqual([]);
  });

  /**
   * Backlog 4.2: state the game branches on and never shows.
   *
   * Since the record board became content (D-086) this is an ERROR rather than a pinned
   * warning list: a flag that decides a branch must be a named card in the hand or a
   * position on the board. The first story carried three such flags with a reason each;
   * this one carries none, so the error class is empty — and "has no structural errors"
   * above is what holds it there.
   */
  it("shows the player the state it branches on", () => {
    const invisible = issues
      .map((w) => /flag "([^"]+)" decides a branch/.exec(w.message)?.[1])
      .filter((f): f is string => Boolean(f));
    expect(invisible).toEqual([]);
  });

  it("has eight decisions, two in each of four acts", () => {
    expect(content.missionOrder).toHaveLength(8);
    expect(content.chapters).toHaveLength(4);
    for (const c of content.chapters) expect(c.missionIds).toHaveLength(2);
    /* Every decision is a lever panel: the contract in `LEVERS.md`. */
    for (const id of content.missionOrder) expect(getNode(content, id).kind).toBe("levers");
  });

  /**
   * The story is full of curly quotes, en dashes and em dashes. Any tool that
   * reads the file as Latin-1 and writes it back as UTF-8 turns “ into â€œ, and
   * nothing else in the pipeline notices — it typechecks, it builds, it ships,
   * and it is only visible if someone happens to look at that paragraph.
   * A PowerShell `Get-Content | Set-Content -Encoding utf8` did exactly that.
   */
  it("has no mis-decoded characters anywhere in the content", () => {
    /* `Â` was added when the content gained its first currency symbols. A pound sign
       read as Latin-1 and written back as UTF-8 becomes `Â£`, and the three sequences
       beside it did not cover that. `Â` prefixes every character in the A0–BF range
       mangled that way, so it catches the whole class rather than one more example of it,
       and it cannot appear legitimately in British English prose. */
    const suspect = /â€|Ã‚|Ã©|Â|�/;
    const bad: string[] = [];

    const walk = (value: unknown, path: string) => {
      if (typeof value === "string") {
        if (suspect.test(value)) bad.push(`${path}: ${value.slice(0, 80)}`);
      } else if (Array.isArray(value)) {
        value.forEach((v, i) => walk(v, `${path}[${i}]`));
      } else if (value && typeof value === "object") {
        for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
      }
    };

    walk(content, "story");
    expect(bad).toEqual([]);
  });
});

describe("the game teaches what it claims to teach", () => {
  /** Never asks a question, sells the rival's deal, gives the price away, hides the slip. */
  const RECKLESS: string[][] = [
    ["d1-sarah-team", "d1-rivals"],
    ["d2-shops", "d2-nobody"],
    ["d3-four", "d3-no-study"],
    ["d4-match", "d4-note"],
    ["d5-shops-app", "d5-trial", "d5-fixed"],
    ["d6-match", "d6-drop-nothing", "d6-ask-nothing"],
    ["d7-as-written", "d7-sign"],
    ["d8-quiet", "d8-weekends"],
  ];

  /** Finds what is wrong, is paid to look inside, prices every extra, trades every cut. */
  const CONSIDERED: string[][] = [
    ["d1-delivery", "d1-complaints"],
    ["d2-found", "d2-marcus"],
    ["d3-two", "d3-paid"],
    ["d4-reframe", "d4-figures"],
    ["d5-after-sale", "d5-month-five", "d5-by-day"],
    ["d6-half", "d6-drop-nothing", "d6-ops-lead"],
    ["d7-no-late-fee", "d7-sign"],
    ["d8-tell", "d8-contractors"],
  ];

  /** The same good first half, then gives two gifts in the offer and the price away. */
  const DISCOUNTER: string[][] = [
    ["d1-delivery", "d1-complaints"],
    ["d2-found", "d2-marcus"],
    ["d3-two", "d3-paid"],
    ["d4-reframe", "d4-figures"],
    ["d5-after-sale", "d5-trial", "d5-fixed"],
    ["d6-match", "d6-drop-nothing", "d6-ask-nothing"],
    ["d7-as-written", "d7-sign"],
    ["d8-tell", "d8-contractors"],
  ];

  const reckless = playScript(content, RECKLESS, "s-builder");
  const considered = playScript(content, CONSIDERED, "s-connector");
  const discounter = playScript(content, DISCOUNTER, "s-connector");
  const verdictOf = (s: typeof reckless) => finalVerdict(s.dims, s.flags, content);

  it("all three reach the ending", () => {
    for (const s of [reckless, considered, discounter]) {
      expect(s.phase).toBe("ending");
      expect(s.history).toHaveLength(8);
      /* Every one of them came through the promise calendar. */
      expect(s.settled).toBeDefined();
    }
  });

  /**
   * Note what this does NOT claim. Recklessness can absolutely win the work — it
   * over-promises and it matches the cheaper price, and both are persuasive; the reckless
   * run finishes with more Win than the considered one. What it cannot do is leave the
   * engagement worth having or deliverable.
   */
  it("the considered run beats the reckless run where it matters", () => {
    expect(considered.dims.profit).toBeGreaterThan(reckless.dims.profit);
    expect(considered.dims.deliver).toBeGreaterThan(reckless.dims.deliver);
  });

  it("the reckless run breaks its promises, and the calendar says which", () => {
    expect(reckless.dims.deliver).toBeLessThan(35);
    expect(reckless.flags).toContain("promise:broken");
    expect(reckless.settled?.find((r) => r.flag === "promise:screens")?.status).toBe("broken");
    expect(verdictOf(reckless).title).toBe("We broke our promises");
  });

  it("the considered run keeps its promises, and it pays", () => {
    expect(considered.settled?.map((r) => `${r.flag}/${r.status}`)).toEqual(["promise:refunds/kept"]);
    expect(verdictOf(considered)).toMatchObject({ id: "kept", title: "We kept our promises, and it paid" });
  });

  it("CAUSAL CHAIN: giving the price away leaves nothing to pay for month five", () => {
    // d6 gives £600,000 for nothing…
    expect(discounter.history.find((h) => h.missionId === "d6")?.outcomeId).toBe("d6-gave");
    expect(discounter.flags).toContain("discount:full");
    // …so the contractors in month five come out of a contract that was already thin.
    expect(discounter.history.find((h) => h.missionId === "d8")?.outcomeId).toBe("d8-thin");
    expect(discounter.dims.profit).toBeLessThan(40);
    expect(verdictOf(discounter)).toMatchObject({ id: "paid-thin", title: "We kept our promises, and paid for it" });
  });

  it("CAUSAL CHAIN: skipping the research leaves the real problem out of reach", () => {
    /* Sarah's team and the budget papers find who scores the bids and what Orion will
       spend, and nothing about what customers complain about — so the first meeting cannot
       open with the real problem, and Sarah hears her own brief read back. */
    const blind = playScript(content, [["d1-sarah-team", "d1-budget"]], "s-builder");
    expect(blind.history[0]?.outcomeId).toBe("d1-sarahs-version");
    const d2 = getNode(content, "d2");
    if (!isMission(d2)) throw new Error("d2 is a decision");
    expect(possibleSelections(d2, blind).some((s) => s.includes("d2-found"))).toBe(false);
    const met = playMission(blind, content, ["d2-shops", "d2-declan"]);
    expect(met.history.at(-1)?.outcomeId).toBe("d2-brief");
  });

  it("CAUSAL CHAIN: trading a cut for Marcus's manager is what makes month five hold", () => {
    expect(considered.history.find((h) => h.missionId === "d6")?.outcomeId).toBe("d6-traded");
    expect(considered.flags).toContain("got:ops_lead");
    expect(considered.history.find((h) => h.missionId === "d8")?.outcomeId).toBe("d8-planned");
    /* And the same run without the manager does not plan for the freeze: the refunds
       promise lands late rather than kept. */
    const without = playScript(
      content,
      CONSIDERED.map((s, i) => (i === 5 ? ["d6-half", "d6-drop-nothing", "d6-second-year"] : s)),
      "s-connector",
    );
    expect(without.settled?.find((r) => r.flag === "promise:refunds")?.status).toBe("late");
  });

  it("surfaces the causal thread the player actually created", () => {
    const threads = causalThreads(discounter, content);
    expect(threads.length).toBeGreaterThan(0);
    const all = threads.map((t) => `${t.because} ${t.soLater}`).join(" ");
    expect(all).toContain("£2 million");

    // A thread must never appear for a chain the player did not cause.
    expect(causalThreads(considered, content).some((t) => t.because.includes("asked for nothing back"))).toBe(false);
  });

  /**
   * Backlog 4.5. The properties that make the item honest, rather than that it renders.
   *
   * The eight-decision story's threads carry no `insteadOf` yet — the act breaks ask their
   * own unscored guess instead (D-086) — so the item tests are skipped rather than passed,
   * as this file's own rule requires: a skip is visible in the runner output, a vacuous
   * pass is not.
   */
  describe("the causal-claim item", () => {
    const authored = content.threads.some((t) => (t.insteadOf?.length ?? 0) > 0);
    const when = authored ? it : it.skip;

    when("asks about something that really happened, and the answer really caused it", () => {
      const claim = causalClaim(discounter, content);
      expect(claim).not.toBeNull();
      if (!claim) return;
      const threads = causalThreads(discounter, content);
      expect(threads.some((t) => t.soLater === claim.soLater)).toBe(true);
      const answer = claim.candidates.find((c) => c.id === claim.answerId);
      expect(answer).toBeDefined();
      expect(threads.some((t) => t.because === answer?.text)).toBe(true);
    });

    when("survives a round trip through the run code", () => {
      const code = codeFromState(discounter, content);
      expect(code).not.toBeNull();
      const decoded = decodeRun(content, code as string);
      expect(decoded.ok).toBe(true);
      if (!decoded.ok) return;
      const replayed = replayRun(content, decoded.run);
      expect(causalClaim(replayed, content)).toEqual(causalClaim(discounter, content));
    });

    it("is null rather than invented when the run earned no eligible thread", () => {
      const fresh = createInitialState(content);
      expect(causalClaim(fresh, content)).toBeNull();
    });
  });

  /**
   * Recognition. The eight-decision script authors no badge: what the player earns is a
   * card in their hand, which says what it is for, and a badge beside it would be a second
   * reward for the same thing. So no run earns one, and a badge appearing would mean an
   * effect the script does not contain.
   */
  it("awards no badge the script does not author", () => {
    for (const s of [reckless, considered, discounter]) expect(s.badges).toEqual([]);
  });

  /**
   * Losing the work, which is a branch and not a wall (STRATEGY §2.9).
   *
   * The loss is CAUSED, not rolled: this run knows what is wrong and still offers an app,
   * as the rival does, so Declan can only compare prices, and theirs is lower. The ending
   * says what would have changed it.
   */
  describe("losing the work", () => {
    const UNDIFFERENTIATED: string[][] = [
      ["d1-sarah-team", "d1-complaints"],
      ["d2-shops", "d2-declan"],
      ["d3-two", "d3-no-study"],
      ["d4-quiet", "d4-note"],
      ["d5-app", "d5-month-five", "d5-by-day"],
      ["d6-hold", "d6-drop-nothing", "d6-ask-nothing"],
    ];
    const lost = playScript(content, UNDIFFERENTIATED, "s-builder");

    it("ends the run at the price push, skipping the whole delivery act", () => {
      expect(lost.phase).toBe("ending");
      expect(lost.history).toHaveLength(6);
      expect(lost.flags).toContain("award:lost");
      expect(lost.settled).toBeUndefined();
    });

    it("gives the loss its own ending, chosen by the flag rather than the meters", () => {
      expect(finalVerdict(lost.dims, lost.flags, content)).toMatchObject({ id: "lost", title: "Orion chose the cheaper firm" });
      expect(finalVerdict(lost.dims, lost.flags.filter((f) => f !== "award:lost"), content).id).not.toBe("lost");
    });

    it("is caused: the same run offering what happens after people buy is not lost", () => {
      const withOne = UNDIFFERENTIATED.map((s, i) => (i === 4 ? ["d5-after-sale", "d5-month-five", "d5-by-day"] : s));
      const survived = playScript(content, withOne, "s-builder");
      expect(survived.flags).not.toContain("award:lost");
      expect(survived.flags).toContain("award:won");
      expect(survived.nodeId).toBe("d7");
    });
  });

  /**
   * The PRD is blunt about why this has to work: "Walking away must sometimes be a good
   * decision. Otherwise the game teaches: Always accept the contract." (p. 132)
   *
   * So the SAME setting has to resolve two ways, decided entirely by the position the
   * player built. Both of these walk away at d7; one is vindicated and one is not.
   */
  describe("walking away", () => {
    const walkFromBadDeal = playScript(content, [...RECKLESS.slice(0, 6), ["d7-as-written", "d7-walk"]], "s-builder");
    const walkFromGoodDeal = playScript(content, [...CONSIDERED.slice(0, 6), ["d7-no-late-fee", "d7-walk"]], "s-connector");

    it("ends the game there, skipping month five and the calendar", () => {
      for (const s of [walkFromBadDeal, walkFromGoodDeal]) {
        expect(s.phase).toBe("ending");
        expect(s.history).toHaveLength(7);
        expect(s.flags).toContain("walked");
        expect(s.settled).toBeUndefined();
      }
    });

    it("is the right call on a deal that had gone bad", () => {
      const d7 = walkFromBadDeal.history.find((h) => h.missionId === "d7");
      expect(d7?.outcomeId).toBe("d7-walk-right");
      expect(d7?.tone).toBe("strong");
    });

    it("is the wrong call on a deal that was sound", () => {
      const d7 = walkFromGoodDeal.history.find((h) => h.missionId === "d7");
      expect(d7?.outcomeId).toBe("d7-walk-wrong");
      expect(d7?.tone).toBe("hard");
    });

    it("is named as a choice in the ending, and the ending knows which", () => {
      const bad = finalVerdict(walkFromBadDeal.dims, walkFromBadDeal.flags, content);
      const good = finalVerdict(walkFromGoodDeal.dims, walkFromGoodDeal.flags, content);
      expect(bad).toMatchObject({ id: "walked-right", title: "We walked away" });
      expect(good).toMatchObject({ id: "walked-wrong", title: "We walked away" });
      expect(bad.summary).not.toBe(good.summary);
    });
  });

  it("produces distinct endings across the outcome space", () => {
    const at = { win: 70, profit: 60, deliver: 60 };
    const titles = new Set(
      [
        ["award:lost"],
        ["walked", "discount:full"],
        ["signed", "promise:broken"],
        ["signed", "kept:quiet"],
        ["signed", "team:weekends"],
        ["signed"],
      ].map((flags) => finalVerdict(at, flags, content).title),
    );
    expect(titles.size).toBe(6);
  });
});

/**
 * The static fake-choice test, on the kinds it can see. It reads choice missions, and the
 * eight-decision story has none; the lever-level rule is the validator's ("no setting may
 * beat a sibling on every bar"), and the realised one is `findRealisedDominance`, swept in
 * `analysis.test.ts`.
 */
describe("no fake choices", () => {
  it("has no option that beats a sibling on all three dimensions in every case", () => {
    const findings = findDominantOptions(content);
    const readable = findings.map((f) => `${f.mission}: ${f.note}`);
    expect(readable).toEqual([]);
  });
});

describe("engine mechanics", () => {
  it("starts at the title, then at chapter 0", () => {
    const s0 = createInitialState(content);
    expect(s0.phase).toBe("title");
    const s1 = advance(s0, content);
    expect(s1.phase).toBe("setup");
  });

  it("takes a starting advantage before the first mission", () => {
    const s = pastSetup(content, "s-builder");
    expect(s.phase).toBe("decide");
    expect(s.flags).toContain("start:builder");
    expect(s.dims.deliver).toBeGreaterThan(50);
  });

  it("will not commit without a complete selection", () => {
    const s = pastSetup(content);
    const mission = getNode(content, s.nodeId);
    expect(isMission(mission)).toBe(true);
    // no selection made
    const attempted = playMission({ ...s, selection: [] }, content, []);
    expect(attempted.phase).toBe("decide");
  });

  it("records one history entry per completed mission", () => {
    let s = pastSetup(content);
    let guard = 0;
    while (isMission(getNode(content, s.nodeId)) && guard++ < 50) {
      const mission = getNode(content, s.nodeId);
      if (!isMission(mission)) break;
      const selection = possibleSelections(mission, s)[0];
      if (!selection) break;
      s = playMission(s, content, selection);
    }
    expect(s.phase).toBe("ending");
    expect(s.history.map((h) => h.missionId)).toEqual(s.completed);
    expect(s.history.length).toBeGreaterThan(0);
  });

  /**
   * Committing lands on the consequence, and there is no beat in between.
   *
   * `resolving` was a phase and therefore a screen: one second of "seeing what happens…"
   * holding 17 of a run's 76 screen instances, whose only content was the three meters
   * travelling. They travel on the consequence's entrance now, from `dimsBefore`, which
   * this asserts is on the state — without it the fold would silently take the animation
   * with it and nobody would see a meter move again.
   */
  it("commits straight to the consequence, carrying where the meters came from", () => {
    const s = pastSetup(content);
    const mission = getNode(content, s.nodeId);
    if (!isMission(mission)) throw new Error("expected a mission after chapter 0");
    const selection = possibleSelections(mission, s)[0] as string[];

    const committed = commit({ ...s, selection }, content);
    expect(committed.phase).toBe("consequence");
    expect(committed.resolution).not.toBeNull();
    expect(committed.resolution?.dimsBefore).toEqual(s.dims);
    expect(committed.resolution?.dimsAfter).toEqual(committed.dims);

    // One advance from here is the next node, not a second screen for the same result.
    expect(advance(committed, content).nodeId).not.toBe(committed.nodeId);
  });

  // Only the save boundary recognises and migrates the removed legacy phase.
  it("never produces the resolving phase", () => {
    let s = pastSetup(content);
    let guard = 0;
    while (isMission(getNode(content, s.nodeId)) && guard++ < 50) {
      const mission = getNode(content, s.nodeId);
      if (!isMission(mission)) break;
      const selection = possibleSelections(mission, s)[0];
      if (!selection) break;
      const committed = commit({ ...s, selection }, content);
      expect(committed.phase).not.toBe("resolving");
      s = playMission(s, content, selection);
      expect(s.phase).not.toBe("resolving");
    }
  });
});
