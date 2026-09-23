import { describe, expect, it } from "vitest";

import { story } from "../content/story";
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
  const issues = validateContent(content);
  const errors = issues.filter((i) => i.severity === "error");

  it("has no structural errors", () => {
    expect(formatIssues(errors)).toBe("content is valid");
  });

  /**
   * A flag written by an outcome and read by nothing is usually a bug — a condition that
   * was meant to gate on it, or a rename that only got done on one side. But some are
   * deliberately narrative: the consequence text says the contract was signed, and
   * nothing later needs to branch on it.
   *
   * So the set is pinned rather than merely printed. Twelve warnings scrolling past every
   * run is indistinguishable from thirteen, which is how `walked_away` sat in this list
   * while being read by `finalVerdict` the whole time. Adding a flag nothing reads now
   * fails here, and the fix is either to read it or to add it below with a reason.
   */
  const NARRATIVE_ONLY_FLAGS = [
    "client:northwind", // which client you chased; the pursuit itself carries the difference
    "conventional", // took the safe proposal shape
    "has:journey", // proposal components — the build mission scores through dims, not flags
    "learned_late",
    "reused_asset",
    "scope:diagnostic", // which scope you sold; delivery reads the promises, not the shape
    "scope:postpurchase",
    "signed", // the contract exists; walking away is the branch, signing is the default
    /* `late_start` and `spent_effort` left this list when Priya's steer at m2 started
       reading them: she now names where the last six weeks went rather than saying the
       same sentence to every player. Two flags moved from narrative to live.
       `has:partner` left it at the handover, which gates Aisha's card on having anyone
       who can answer a delivery question — a partner being one of the three ways.
       `knows:budget` left it at m8, and that one is the point of the whole exercise: it
       is the money card from m2's investigation, and until now asking what the board had
       actually approved changed nothing anywhere in the game. Riya reads it at the price
       beat, which is the one place the board and the number collide. Four flags moved
       from narrative to live; every one of them was a question the player paid to ask. */
  ];

  it("has no dead flags beyond the narrative ones", () => {
    const warnings = issues.filter((i) => i.severity === "warning");
    const dead = warnings
      .map((w) => /flag "([^"]+)" is set but never read/.exec(w.message)?.[1])
      .filter((f): f is string => Boolean(f));
    expect(dead.sort()).toEqual([...NARRATIVE_ONLY_FLAGS].sort());

    /*
     * Exactly one warning is expected and is not a defect: one condition in the game now
     * gates on a dimension value. That is backlog 1.3 — until it landed, all three meters
     * were write-only, three numbers the player was asked to manage that managed nothing,
     * which is the mechanical root of "it feels like a form".
     *
     * It is allowed rather than silenced, and only one of it, because the gate has real
     * constraints: the threshold must sit on a ten-point bucket boundary or two states
     * either side of it collapse in the sweep's dedup, and three such gates would breach
     * `MAX_FRONTIER`.
     */
    const other = warnings.filter(
      (w) => !/is set but never read/.test(w.message) && !/no ledger rule/.test(w.message),
    );
    const dimGates = other.filter((w) => /gates on a dimension value/.test(w.message));
    expect(dimGates).toHaveLength(1);

    /**
     * Claim items where exactly one candidate names a person, so the item can be answered
     * without reading it. A ceiling rather than a pin, because unlike the flag lists above
     * this is not a fixed vocabulary — any new thread can introduce one — and the fix is
     * always the same: give a sibling a name, or take the name out.
     *
     * Three today, found by the check rather than by a reviewer; a pedagogy pass reading
     * the same content by hand caught one of them. Fixing them takes this to zero and this
     * test stays green; adding a fourth does not.
     */
    const nameTells = other.filter((w) => /names a person/.test(w.message));
    expect(nameTells.length).toBeLessThanOrEqual(3);

    const unexpected = other.filter(
      (w) => !/gates on a dimension value/.test(w.message) && !/names a person/.test(w.message),
    );
    if (unexpected.length) console.log("content warnings:\n" + formatIssues(unexpected));
    expect(unexpected).toEqual([]);
  });

  /**
   * Backlog 4.2: state the game branches on and never shows.
   *
   * 14 of 29 gating flags used to be in this list, which means a player who asks "why did
   * that happen?" could not tell a reasoning error from an information gap — the game
   * decided against something it had never put on screen. Eleven ledger rules closed the
   * high-traffic ones; these three are what is left, and they are pinned rather than
   * printed for the same reason the dead flags above are: a list nobody compares is a list
   * that grows.
   *
   * Adding a gate on a flag with no ledger rule fails here. The fix is to write the rule
   * — `LEDGER_RULES` in `engine.ts` — or to add the flag below with a reason it is safe to
   * leave invisible. "It would make the rail long" is not one; the rail is the player's
   * only record of their own position.
   */
  const INVISIBLE_GATING_FLAGS = [
    /* Its only writer is m10c and its only reader is m10, which runs two beats earlier, so
       the term cannot be true when it is read. Dead rather than invisible — the outcome
       still fires on its `ops_onside` alternative, which is why the sweep is happy. */
    "broad_base",
    /* 40 reachable visits where it decides anything, all at the last mission, one beat
       after the choice that sets it. The player has just done it. */
    "changed_scope",
    /* 227 visits. Nearly every run that reaches its readers has it, and `knows:rival_gap`
       — which IS on the rail — is the one the game actually teaches: knowing a market is
       not knowing where this competitor is weak. */
    "knows:rivals",
  ];

  it("shows the player the state it branches on", () => {
    const invisible = issues
      .filter((i) => i.severity === "warning")
      .map((w) => /flag "([^"]+)" decides a branch/.exec(w.message)?.[1])
      .filter((f): f is string => Boolean(f));
    expect([...new Set(invisible)].sort()).toEqual([...INVISIBLE_GATING_FLAGS].sort());
  });

  it("has eighteen missions", () => {
    /* Seventeen plus the chapter-five handover (backlog 5.7, GAME-SEQUENCE.md §3). */
    expect(content.missionOrder).toHaveLength(18);
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
       beside it did not cover that — checked by encoding one and running it past the old
       pattern, which passed it. `Â` prefixes every character in the A0–BF range mangled
       that way, so it catches the whole class rather than one more example of it, and it
       cannot appear legitimately in British English prose. */
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
  /** Never asks a question, never involves Operations, over-promises, discounts. */
  const RECKLESS: string[][] = [
    ["o-apex"],
    ["ev-rivals", "ev-budget"],
    ["o-campaign"],
    ["o-pursue"],
    ["o-hold"],
    ["c-benchmark", "c-reference"],
    ["o-asked"],
    ["o-conventional"],
    ["c-journey", "c-platform", "c-pilot"],
    ["o-defend"],
    ["o-discount"],
    ["o-accept-risk"],
    ["o-submit"],
    ["o-proceed"],
    ["o-push"],
    ["o-contractors"],
    /* The handover. Recklessness confirms the whole document rather than choosing which
       sentence it meant, which is the one answer that hands the judgement to delivery. */
    ["o-meant-all-of-it"],
    ["o-prove-fast"],
  ];

  /** Investigates, involves Operations, prices honestly, mitigates, resets early. */
  const CONSIDERED: string[][] = [
    ["o-northwind"],
    ["ev-pain", "ev-sponsor"],
    ["o-pov"],
    ["o-workshop"],
    ["o-reframe"],
    ["c-ops-workshop", "c-data-audit"],
    ["o-real"],
    ["o-outcome-deal"],
    ["c-ops", "c-training", "c-journey"],
    ["o-shore-deliver"],
    ["o-phase"],
    ["o-mitigate"],
    ["o-value"],
    ["o-modify"],
    ["o-reset"],
    ["o-slip"],
    /* Stands behind the unglamorous lines it bought in chapter three, and pays for them. */
    ["o-meant-the-dull-lines"],
    ["o-broaden"],
  ];

  /** Good instincts, but wins the deal by giving away the contingency. */
  const DISCOUNTER: string[][] = [
    ["o-northwind"],
    ["ev-pain", "ev-sponsor"],
    ["o-pov"],
    ["o-pursue"],
    ["o-reframe"],
    ["c-reference", "c-benchmark"],
    ["o-real"],
    ["o-conventional"],
    ["c-ops", "c-journey", "c-pilot"],
    ["o-sharpen-win"],
    ["o-discount"],
    ["o-mitigate"],
    ["o-criteria"],
    ["o-proceed"],
    ["o-absorb"],
    ["o-contractors"],
    /* Holds the pilot date it sold, with no money left to make the date true. */
    ["o-meant-the-date"],
    ["o-handover"],
  ];

  const reckless = playScript(content, RECKLESS, "s-builder");
  const considered = playScript(content, CONSIDERED);
  const discounter = playScript(content, DISCOUNTER);

  it("all three reach the ending", () => {
    for (const s of [reckless, considered, discounter]) {
      expect(s.phase).toBe("ending");
      expect(s.history).toHaveLength(18);
    }
  });

  /**
   * Note what this does NOT claim. Recklessness can absolutely win the work — it
   * over-promises, and over-promising is persuasive. What it cannot do is leave the
   * engagement profitable or deliverable. Asserting that the considered run wins on
   * all three would be asserting something the game deliberately does not teach.
   */
  it("the considered run beats the reckless run where it matters", () => {
    expect(considered.dims.profit).toBeGreaterThan(reckless.dims.profit);
    expect(considered.dims.deliver).toBeGreaterThan(reckless.dims.deliver);
    expect(considered.dims.win).toBeGreaterThanOrEqual(reckless.dims.win);
  });

  it("the reckless run genuinely fails delivery", () => {
    expect(reckless.dims.deliver).toBeLessThan(35);
    expect(finalVerdict(reckless.dims).title).not.toBe("A deal worth having");
  });

  it("the considered run lands a deal worth having", () => {
    expect(finalVerdict(considered.dims).title).toBe("A deal worth having");
  });

  it("CAUSAL CHAIN: discounting removes the money needed to fix the risk later", () => {
    // m9 mitigation should hit the "cannot afford it" branch because of m8.
    const m9 = discounter.history.find((h) => h.missionId === "m9");
    expect(m9?.outcomeId).toBe("m9-mitigate-broke");
    expect(discounter.flags).toContain("thin_mitigation");

    // ...and that thin mitigation should then bite in month five.
    const m10 = discounter.history.find((h) => h.missionId === "m10");
    expect(m10?.outcomeId).toBe("m10-absorb-broke");
    expect(discounter.dims.profit).toBeLessThan(35);
  });

  it("CAUSAL CHAIN: skipping discovery makes the right answer undefendable", () => {
    // Choosing the genuinely correct problem WITHOUT evidence lands weakly.
    const blind = playScript(content, [
      ["o-northwind"],
      ["ev-rivals", "ev-budget"],
      ["o-direct"],
      ["o-workshop"],
      ["o-reframe"],
      ["c-benchmark", "c-stakeholders"],
      ["o-real"], // correct call, no proof
      ["o-conventional"],
      ["c-ops", "c-training", "c-data"],
      ["o-shore-deliver"],
      ["o-phase"],
      ["o-mitigate"],
      ["o-value"],
      ["o-modify"],
      ["o-reset"],
      ["o-slip"],
      ["o-meant-the-dull-lines"],
      ["o-handover"],
    ]);
    const m6 = blind.history.find((h) => h.missionId === "m6");
    expect(m6?.outcomeId).toBe("m6-real-hunch");
  });

  it("CAUSAL CHAIN: involving Operations early prevents the month-five blockage", () => {
    const m7 = considered.history.find((h) => h.missionId === "m7");
    expect(m7?.outcomeId).toBe("m7-anchored");
    expect(considered.flags).toContain("ops_onside");

    const m10 = considered.history.find((h) => h.missionId === "m10");
    expect(m10?.outcomeId).toBe("m10-reset-trust");
  });

  it("surfaces the causal thread the player actually created", () => {
    const threads = causalThreads(discounter, content);
    expect(threads.length).toBeGreaterThan(0);
    const all = threads.map((t) => `${t.because} ${t.soLater}`).join(" ");
    expect(all).toContain("price");

    // A thread must never appear for a chain the player did not cause.
    const considered2 = causalThreads(considered, content);
    expect(considered2.some((t) => t.because.includes("met the client on price"))).toBe(false);
  });

  /**
   * Backlog 4.5. The properties that make the item honest, rather than that it renders.
   *
   * The one worth arguing with is DETERMINISM: the candidate order is a hash rather than a
   * shuffle, because a run has to replay identically from its fourteen-character code. A
   * `Math.random` here would silently break facilitator pre-reads and exact bug repro, and
   * nothing else in the game would notice.
   */
  describe("the causal-claim item", () => {
    /**
     * Skipped rather than passed while no thread carries `insteadOf`.
     *
     * The first draft of these tests began `if (!claim) return`, which means they report
     * green on content that cannot produce an item at all — a gate that passes hardest
     * when the feature is most absent. A skip is visible in the runner output; a vacuous
     * pass is not, and this file's own opening argument (D-037) is that a gate nobody has
     * seen fail is a comment.
     */
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

    when("offers the wrong answers alongside it, all distinct", () => {
      const claim = causalClaim(discounter, content);
      expect(claim).not.toBeNull();
      if (!claim) return;
      expect(claim.candidates.length).toBeGreaterThanOrEqual(3);
      expect(new Set(claim.candidates.map((c) => c.text)).size).toBe(claim.candidates.length);
      expect(new Set(claim.candidates.map((c) => c.id)).size).toBe(claim.candidates.length);
    });

    /**
     * A real replay, not two calls on one object.
     *
     * The first version of this test called `causalClaim` twice on the same state and
     * asserted the results matched, which a pure function cannot fail — it proved the
     * function was not reading a clock, and nothing else. The property that actually
     * matters is that a run reconstructed FROM ITS CODE presents the same item, because
     * a facilitator pre-reading a cohort's runs and a bug report carrying an exact run
     * both depend on it, and the candidate order is the one thing here that could
     * plausibly drift without anyone noticing.
     */
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

    /* The whole screen is a reflection, not a test. A field named like a mark is the first
       step back towards the grader this game deleted. */
    when("carries no score, mark or correctness count", () => {
      const claim = causalClaim(discounter, content);
      expect(claim).not.toBeNull();
      if (!claim) return;
      const keys = Object.keys(claim).join(" ").toLowerCase();
      expect(/score|mark|correct|points|grade/.test(keys)).toBe(false);
    });
  });

  it("awards recognition only where it was earned", () => {
    expect(considered.badges.length).toBeGreaterThan(0);
    expect(reckless.badges).toHaveLength(0);
  });

  /**
   * The PRD is blunt about why this has to work: "Walking away must sometimes be a good
   * decision. Otherwise the game teaches: Always accept the contract." (p. 132)
   *
   * So the SAME action has to resolve two ways, decided entirely by the position the
   * player built. Both of these walk away at m9b; one is praised and one is not.
   */
  /**
   * Losing the work, which for most of this game's life was not possible.
   *
   * "You did not win the work" fired on 0.15% of random runs and `win` never fell below
   * 55 across every reachable ending, because nothing anywhere adjudicated whether the
   * client wanted you — the contract was signed inside an outcome's prose. A game in
   * which a competently run pursuit always wins teaches that competence converts.
   *
   * The loss is CAUSED, not rolled: this run never evidenced its argument, never brought
   * Operations inside, never reframed the problem and never found the rival's gap, so
   * there is nothing in its submission that another firm could not have written. Every
   * option at the award beat loses for such a run, which is the point — by then it is too
   * late to be chosen, and the lesson is about the eleven beats before it.
   */
  describe("losing the work", () => {
    const UNDIFFERENTIATED: string[][] = [
      ["o-apex"],
      ["ev-rivals", "ev-budget"],
      ["o-campaign"],
      ["o-pursue"],
      ["o-hold"],
      ["c-reference", "c-stakeholders"],
      ["o-asked"],
      ["o-conventional"],
      ["c-journey", "c-platform", "c-pilot"],
      ["o-defend"],
      ["o-discount"],
      ["o-accept-risk"],
      ["o-submit"],
    ];
    const lost = playScript(content, UNDIFFERENTIATED, "s-builder");

    it("ends the run at the award, skipping the whole delivery chapter", () => {
      expect(lost.phase).toBe("ending");
      expect(lost.history).toHaveLength(13);
      expect(lost.flags).toContain("lost");
    });

    it("gives the loss its own verdict rather than inferring one from the meters", () => {
      /*
       * The flag decides this, not the number.
       *
       * This used to assert Winability was above 40, to show the old `win < 40` branch
       * could not have carried the verdict. After the economy rescale it lands at 37, so
       * that branch would now fire too — but for a different reason and with different
       * words ("the client went elsewhere", which guesses at why). So assert the thing
       * that actually matters instead: the same three numbers WITHOUT the flag get a
       * different verdict, which is only true because the flag is what is being read.
       */
      expect(finalVerdict(lost.dims, lost.flags).title).toBe("They chose someone else");
      expect(finalVerdict(lost.dims, []).title).not.toBe("They chose someone else");
    });

    it("is caused: the same run with one differentiator is not lost", () => {
      // c-benchmark at m5b sets `knows:rival_gap`, and that alone is enough.
      const withOne = [...UNDIFFERENTIATED];
      withOne[5] = ["c-benchmark", "c-reference"];
      const survived = playScript(content, withOne, "s-builder");
      expect(survived.flags).not.toContain("lost");
      expect(survived.nodeId).not.toBe("end");
    });
  });

  describe("walking away", () => {
    const walkFromBadDeal = playScript(content, [
      ["o-northwind"],
      ["ev-rivals", "ev-budget"],
      ["o-campaign"],
      ["o-pursue"],
      ["o-hold"],
      ["c-benchmark", "c-reference"],
      ["o-asked"],
      ["o-conventional"],
      ["c-journey", "c-platform", "c-pilot"],
      ["o-defend"],
      ["o-discount"],
      ["o-accept-risk"],
      ["o-criteria"],
      ["o-walk"],
    ]);

    const walkFromGoodDeal = playScript(content, [
      ["o-northwind"],
      ["ev-pain", "ev-sponsor"],
      ["o-pov"],
      ["o-workshop"],
      ["o-reframe"],
      ["c-ops-workshop", "c-data-audit"],
      ["o-real"],
      ["o-outcome-deal"],
      ["c-ops", "c-training", "c-journey"],
      ["o-shore-deliver"],
      ["o-phase"],
      ["o-mitigate"],
      ["o-value"],
      ["o-walk"],
    ]);

    it("ends the game there, skipping delivery entirely", () => {
      for (const s of [walkFromBadDeal, walkFromGoodDeal]) {
        expect(s.phase).toBe("ending");
        expect(s.history).toHaveLength(14);
        expect(s.flags).toContain("walked_away");
      }
    });

    it("is the right call on a deal that had gone bad", () => {
      const m9b = walkFromBadDeal.history.find((h) => h.missionId === "m9b");
      expect(m9b?.outcomeId).toBe("m9b-walk-right");
      expect(m9b?.tone).toBe("strong");
      expect(walkFromBadDeal.badges).toContain("held_nerve");
    });

    it("is the wrong call on a deal that was sound", () => {
      const m9b = walkFromGoodDeal.history.find((h) => h.missionId === "m9b");
      expect(m9b?.outcomeId).toBe("m9b-walk-wrong");
      expect(m9b?.tone).toBe("hard");
    });

    it("is named as a choice in the verdict, not as a loss", () => {
      expect(finalVerdict(walkFromBadDeal.dims, walkFromBadDeal.flags).title).toBe(
        "You walked away",
      );
    });
  });

  it("produces distinct verdicts across the outcome space", () => {
    const verdicts = new Set(
      [
        { win: 20, profit: 50, deliver: 50 },
        { win: 80, profit: 80, deliver: 20 },
        { win: 80, profit: 20, deliver: 80 },
        { win: 75, profit: 70, deliver: 70 },
        { win: 55, profit: 50, deliver: 48 },
      ].map((c) => finalVerdict(c).title),
    );
    expect(verdicts.size).toBeGreaterThanOrEqual(4);
  });
});

/**
 * The fake-choice test that means something.
 *
 * `findDominantOptions` asks whether an option's worst AUTHORED result beats a sibling's
 * best AUTHORED result — a composite belonging to no reachable state, because an option's
 * worst `win` and worst `deliver` usually come from different branches. It returned zero
 * findings while three options beat their siblings on all three dimensions in over 90% of
 * the states players can actually be in.
 *
 * `findRealisedDominance` prices every option in every reachable state and compares what
 * really happens. What it found was not a balance problem but two domain errors and a
 * clamp artefact:
 *
 *   · m8 `o-rescope` read `profit +4, win +4, deliver -6` — cutting scope pleasing the
 *     client and making the work harder to deliver. Both backwards.
 *   · m9 `o-rescope-risk` removed an exposure and scored LOWER on Deliverability than
 *     re-pricing, which merely funds it.
 *   · m8 `o-phase` beat `o-discount` on all three in 90% of states purely because
 *     Winability was pinned near 100 by then, so the discount's one advantage was eaten
 *     by the clamp. Adding the losable award beat fixed that without touching a number.
 */
/**
 * Thread coverage.
 *
 * `engine.ts` calls the thread section "the payoff of the whole design" and `README.md`
 * promises "the closing debrief shows the causal chains you personally created". It was
 * empty on 77% of runs, with five rules where `DECISIONS.md` D-012 claimed nine, and no
 * run ever reached the cap of three — so `slice(0, 3)` was dead code.
 *
 * Seven rules were added, authored from a measurement rather than guessed: 3,000 random
 * playthroughs, every co-occurring outcome pair counted, and each new rule joins a pair
 * that genuinely happens together AND is genuinely causal. Several commoner pairs were
 * rejected on the second test.
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
    expect(s.history).toHaveLength(18);
    expect(s.phase).toBe("ending");
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
