/**
 * The older decision kinds, as a fixture chapter (D-086).
 *
 * The eight-decision story is made entirely of lever decisions, so nothing in it exercises a
 * `choice`, an `investigate` or a `build` mission, or a choice staged as `dialogue` or
 * `apply`. The engine still supports all of them — no run, save or code was invalidated by
 * the rebuild — and the validator, the guards and the run codes still have rules for each.
 * A rule nothing exercises is a comment, so this is the smallest valid content of every older
 * kind, spliced into a CLONE of whatever content a test hands it, straight after chapter 0.
 *
 * Imported by tests only. It is valid under every rule in `validate.ts`, so a test can break
 * one thing in it and see exactly one new error.
 */

import type { Advisor, Content, Effect, Outcome } from "./types";

const ADVISOR: Advisor = {
  name: "Priya Sharma",
  role: "Client Growth Lead",
  quote: "Each of these costs something before it pays.",
};

const SPEAKER = { speaker: "Sarah Lim", role: "Chief Transformation Officer" };

const outcome = (id: string, effect: Effect): Outcome => ({
  id,
  tone: "mixed",
  headline: `The fixture landed on ${id}.`,
  detail: "Because of what was chosen, and nothing else.",
  changed: [`The record shows ${id}`],
  effect,
});

/** The fixture's mission ids, in play order. */
export const FIXTURE_MISSIONS = ["fx-choice", "fx-talk", "fx-apply", "fx-investigate", "fx-build"] as const;

/** The flag the fixture sets and gates on, and the ledger position that shows it. */
export const FIXTURE_FLAG = "fx:met";

/**
 * A clone of `content` with the fixture chapter played straight after chapter 0. Chapter 5,
 * with no `idea`, so the act-idea and coaching rules — which are about lever decisions in
 * the real acts — leave it alone.
 */
export function withEveryKind(content: Content): Content {
  const c = structuredClone(content) as Content;
  const setup = Object.values(c.nodes).find((n) => n.kind === "setup");
  if (!setup || setup.kind !== "setup") throw new Error("withEveryKind: the content has no chapter 0");
  const after = setup.next;
  setup.next = FIXTURE_MISSIONS[0];

  const base = {
    chapter: 5,
    eyebrow: "Fixture",
    minutes: 1,
    advisor: ADVISOR,
    tip: "Each approach costs something.",
  };

  c.nodes["fx-choice"] = {
    ...base,
    kind: "choice",
    id: "fx-choice",
    stage: "client",
    title: "Two ways in",
    objective: "Choose one of two ways into the account.",
    situation: ["Two ways into the account are open, and each costs something different."],
    question: "Which way in do we take?",
    consider: ["What does each way cost us?", "Who has to live with it afterwards?"],
    lesson: {
      principle: "Every way into an account costs something before it pays.",
      because: "Each way in spent a different resource to get there.",
    },
    options: [
      {
        id: "fx-front",
        title: "Through the front door",
        description: "Ask the sponsor for a meeting.",
        pros: ["Quick to arrange"],
        cons: ["Nobody else hears it"],
        outcomes: [outcome("fx-front", { dims: { win: 2, deliver: -2 } })],
      },
      {
        id: "fx-side",
        title: "Through the operations team",
        description: "Spend a day with the people who run it.",
        pros: ["They know us"],
        cons: ["A day gone"],
        /* The one badge in the fixture: the eight-decision story authors none, and the
           recognition rules still need a run that earns one. */
        outcomes: [outcome("fx-side", { dims: { win: -2, deliver: 2 }, flags: [FIXTURE_FLAG], badge: "good_question" })],
      },
    ],
    next: "fx-talk",
  };

  c.nodes["fx-talk"] = {
    ...base,
    kind: "choice",
    id: "fx-talk",
    stage: "lead",
    presentation: "dialogue",
    surface: "call",
    title: "The call",
    objective: "Answer the sponsor on the call.",
    situation: ["The sponsor has ten minutes and one question for us."],
    question: "What do we say?",
    saidQuote: { ...SPEAKER, text: "Tell me in a sentence why I should keep talking to you." },
    consider: ["What will she remember?", "What would we have to prove?"],
    lesson: {
      principle: "A short answer is only as strong as what stands behind it.",
      because: "The reply was weighed against what we could show.",
    },
    options: [
      {
        id: "fx-say-short",
        title: "Keep it short",
        description: "One sentence about what we found.",
        say: "Your customers are angry after they buy, and we can show you where.",
        pros: ["Easy to remember"],
        cons: ["Nothing to check"],
        outcomes: [outcome("fx-say-short", { dims: { win: 2, profit: -1 } })],
      },
      {
        id: "fx-say-long",
        title: "Walk her through it",
        description: "Ten minutes on the figures.",
        say: "Let me take you through the figures one line at a time.",
        pros: ["Every claim is checked"],
        cons: ["She may stop listening"],
        outcomes: [outcome("fx-say-long", { dims: { win: -1, deliver: 2 } })],
      },
    ],
    next: "fx-apply",
  };

  c.nodes["fx-apply"] = {
    ...base,
    kind: "choice",
    id: "fx-apply",
    stage: "opportunity",
    presentation: "apply",
    title: "Make the case",
    objective: "Make the case with what is on the record.",
    situation: ["The buyer wants a reason he can write down."],
    question: "What do we put in front of him?",
    consider: ["What can he check?", "What did we earn earlier?"],
    lesson: {
      principle: "A case is made from what you earned before the meeting.",
      because: "Only the evidence on the record could be put on the table.",
    },
    options: [
      {
        id: "fx-case-open",
        title: "Our own summary",
        description: "A page we wrote ourselves.",
        pros: ["Ready today"],
        cons: ["Nothing independent"],
        outcomes: [outcome("fx-case-open", { dims: { win: 1 } })],
      },
      {
        id: "fx-case-gated",
        title: "Operations’ own words",
        description: "What their team told us, in their words.",
        pros: ["Hard to argue with"],
        cons: ["Needs their say-so"],
        requires: { all: [FIXTURE_FLAG] },
        outcomes: [outcome("fx-case-gated", { dims: { win: 3, profit: -1 } })],
      },
    ],
    next: "fx-investigate",
  };

  c.nodes["fx-investigate"] = {
    ...base,
    kind: "investigate",
    id: "fx-investigate",
    stage: "opportunity",
    title: "Two questions",
    objective: "Spend two questions on what matters most.",
    situation: ["There is time to ask two things before the offer goes in."],
    question: "What do we ask?",
    consider: ["What would change the offer?", "What do we already know?"],
    lesson: {
      principle: "Two questions spent well are worth a week of guessing.",
      because: "The questions chosen decided what the offer could rest on.",
    },
    slots: 2,
    evidence: [
      { id: "fx-ev-log", label: "The complaint log", question: "What do customers complain about?", reveals: "Deliveries, mostly." },
      { id: "fx-ev-chart", label: "The organisation chart", question: "Who runs deliveries?", reveals: "Operations, and nobody has asked them." },
      { id: "fx-ev-budget", label: "The budget", question: "What can they spend?", reveals: "Less than the brief implies." },
    ],
    outcomes: [outcome("fx-asked", { dims: { deliver: 1 } })],
    next: "fx-build",
  };

  c.nodes["fx-build"] = {
    ...base,
    kind: "build",
    id: "fx-build",
    stage: "solution",
    title: "Two lines",
    objective: "Put two lines in the offer.",
    situation: ["The offer has room for two lines of work, and there are three."],
    question: "Which two go in?",
    consider: ["Which line is hardest to deliver?", "Which line would they miss?"],
    lesson: {
      principle: "What goes into an offer is what somebody later has to deliver.",
      because: "Each line chosen became work for the delivery team.",
    },
    pick: 2,
    components: [
      { id: "fx-c-refunds", title: "Refunds", description: "Faster refunds.", tag: "Operations", dims: { deliver: -1 } },
      { id: "fx-c-helpline", title: "Helpline", description: "A helpline that sees the order.", tag: "Service", dims: { profit: -1 } },
      { id: "fx-c-app", title: "An app", description: "A new app.", tag: "Technology", dims: { win: 1, deliver: -2 } },
    ],
    outcomes: [outcome("fx-built", { dims: { profit: 1 } })],
    next: after,
  };

  c.missionOrder = [...FIXTURE_MISSIONS, ...c.missionOrder];
  c.chapters = [
    ...c.chapters,
    {
      number: 5,
      label: "Fixture",
      title: "The older kinds",
      missionIds: [...FIXTURE_MISSIONS],
      steps: ["Two ways in", "The call", "Make the case", "Two questions", "Two lines"],
    },
  ];
  if (c.ledger) {
    c.ledger = [
      ...c.ledger,
      { when: { all: [FIXTURE_FLAG] }, label: "Operations know us", detail: "We spent a day with the people who run it.", tone: "good", icon: "people" },
    ];
  }
  return c;
}
