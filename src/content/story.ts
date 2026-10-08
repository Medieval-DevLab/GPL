/**
 * GPL — the story, version 2 (D-086).
 *
 * Eight lever decisions in four acts, one idea per act, on one causal chain from week one at
 * Orion Retail to month five of the delivery. The script is `docs/STORY-V2.md`, as amended by
 * the learning-design review recorded in D-086; the eighteen-decision story it replaced is
 * kept, unchanged and unimported, in `archive/story-v1.ts`.
 *
 * THE SPINE, word for word on the title, at every act break and at the end:
 *   Every promise that helps you win the work is a cost someone pays later — so choose your
 *   promises on purpose.
 *
 * THE FOUR IDEAS, one per act, carried as every lesson's `principle` in exactly these words
 * (the validator holds every lesson in an act to its `Chapter.idea`):
 *   1 · Understand before you offer.
 *   2 · Not every deal is worth winning.
 *   3 · Trade, don’t give.
 *   4 · Promise only what your team can deliver.
 *
 * MODEL, PROMPT, LET GO. The first decision of each act is modelled — the colleague thinks
 * aloud (`thinkAloud`) and gives no hints. The second is prompted: exactly one hint, under
 * "Ask" (`consider`). The validator enforces both.
 *
 * AUTHORING RULES (enforced by validate.ts, so breaking one fails the build):
 *  · A setting's `dims` are its own immediate effect and are shown before the decision as
 *    a direction, never an amount. No setting may beat a sibling on every bar.
 *  · Every outcome list ends with an unconditional fallback; first match wins, read after
 *    the settings have landed.
 *  · The first words of every consequence name its cause: "Because you…".
 *  · Every flag a condition reads is set somewhere, and every card is named in `gates.ts`.
 *
 * THE CAUSAL CHAIN — each decision consumes what an earlier one produced:
 *    d1 who we talk to, what we read → the clues, and whether we know what is wrong
 *    d2 what we open with             → Sarah's trust, or her doubt
 *    d3 how much we bet               → whether we have seen inside Orion
 *    d4 how we answer the demo        → which problem the bid is about
 *    d5 what goes in the offer        → the promise cards, with due dates
 *    d6 the price push                → the award, and what we kept
 *    d7 sign or walk                  → the contract
 *    d8 month five                    → the promise calendar settles, and the ending
 */

import type {
  Advisor,
  CausalThreadRule,
  Condition,
  Content,
  EndingRule,
  GameNode,
  LedgerRule,
  Lesson,
  PromiseRule,
} from "../engine/types";

/* ───────────────────────── the spine and the four ideas ───────────────────────── */

export const SPINE =
  "Every promise that helps you win the work is a cost someone pays later — so choose your promises on purpose.";

const IDEA_1 = "Understand before you offer.";
const IDEA_2 = "Not every deal is worth winning.";
const IDEA_3 = "Trade, don’t give.";
const IDEA_4 = "Promise only what your team can deliver.";

/** Every lesson in an act carries its idea, word for word; only `because` is written per branch. */
const taught = (principle: string, because: string): Lesson => ({ principle, because });

/* ───────────────────────── recurring cast ───────────────────────── */

/**
 * Your colleagues. Every piece of advice in the game comes from one of them, by name, never
 * from the interface (G9b).
 */
const PRIYA: Advisor = {
  name: "Priya Sharma",
  role: "Client Growth Lead",
  photo: "portrait-priya",
  quote: "Nobody at Orion has said what is wrong yet. We get one week to find out.",
};

const RIYA: Advisor = {
  name: "Riya Kapoor",
  role: "Engagement Director",
  photo: "portrait-riya",
  quote: "Not every lead is worth the same to us. I decide early where my people go.",
};

const ARJUN: Advisor = {
  name: "Arjun Mehta",
  role: "Solutions Director",
  photo: "portrait-arjun",
  quote: "Whatever we write down, somebody has to build. I’d rather promise less and mean it.",
};

const AISHA: Advisor = {
  name: "Aisha Khan",
  role: "Delivery Lead",
  photo: "portrait-aisha",
  quote: "My team inherits every promise in that offer. Which ones did you mean?",
};

/* The client-side speakers, written once. */
const SARAH = { speaker: "Sarah Lim", role: "Chief Transformation Officer" };
const MARCUS = { speaker: "Marcus Reed", role: "Operations Director" };
const DECLAN = { speaker: "Declan Foyle", role: "Procurement" };

/**
 * "Planned": any of the three ways a player can have planned around Orion's real calendar —
 * one of Marcus's managers on the team, half the shops first, or every date a month later.
 * The promise calendar reads it on three cards.
 */
const PLANNED: Condition = { any: ["got:ops_lead", "dropped:shops", "dates:moved"] };

const nodes: GameNode[] = [
  /* ══════════════════════════ BEFORE YOU START ══════════════════════════ */

  /**
   * The starting strength. The options and bars are unchanged from the first story; only the
   * cards change, so that each one is read later (STORY-V2, "Setup").
   *
   * `start:challenger` is a marker beside the Challengers' card, `clue:rivals`. The card can
   * also be earned in week one, so on its own it cannot say which team a run started with,
   * and `runcode.ts` recovers the starting strength from exactly that. The ledger reads it,
   * as it reads the other two.
   */
  {
    kind: "setup",
    id: "setup",
    eyebrow: "Before you start",
    title: "What is your team good at?",
    body: [
      "You lead six people at a consultancy, a firm that companies pay to fix their problems. Your job is to win a client and make sure your team can do what you promised.",
      "Every team is strong at one thing and short of another. Pick what yours is good at. It stays true until the last month.",
    ],
    question: "What is your team’s strength?",
    options: [
      {
        id: "s-connector",
        title: "Connectors",
        icon: "talk",
        facsimile: "org",
        description: "You know people at many companies, and they take your call.",
        strengths: ["Trusted early", "Doors open"],
        tradeoff: "You are better at getting in the room than at proving what you can build.",
        flags: ["start:connector"],
        dims: { win: 5 },
      },
      {
        id: "s-builder",
        title: "Builders",
        icon: "layers",
        facsimile: "proposal",
        description: "You have done this kind of work before, and can show the results.",
        strengths: ["Evidence to hand", "Delivery is real"],
        tradeoff: "You are better at showing the work than at selling it.",
        flags: ["start:builder"],
        dims: { deliver: 5 },
      },
      {
        id: "s-challenger",
        title: "Challengers",
        icon: "scale",
        facsimile: "market",
        description: "You know the market and your rivals, and you say the awkward thing.",
        strengths: ["Know the field", "Say the hard thing"],
        tradeoff: "You are better at reading the field than at being trusted inside it.",
        flags: ["start:challenger", "clue:rivals"],
        dims: { profit: 8 },
      },
    ],
    next: "int-1",
  },

  /* ══════════════════════════ ACT 1 · UNDERSTAND BEFORE YOU OFFER ══════════════════════════ */
  {
    kind: "interlude",
    id: "int-1",
    role: "chapter-open",
    chapter: 1,
    advisor: PRIYA,
    eyebrow: "Act One",
    title: "Understand before you offer",
    body: [
      "I’m Priya Sharma, and I find new clients for Northgate. Orion Retail, a chain of 210 shops, wants help to “improve the customer experience”, and nobody there has said what that means.",
    ],
    next: "d1",
  },

  /** d1 · Modelled. Priya thinks aloud; the research board. */
  {
    kind: "levers",
    id: "d1",
    chapter: 1,
    stage: "client",
    title: "Find what is really wrong",
    eyebrow: "Week one",
    objective: "Choose who to talk to and what to read before Thursday’s meeting.",
    minutes: 4,
    question: "What is really wrong at Orion?",
    situation: [
      "Sarah Lim, the Orion director who holds the budget, sent us that one line and wants to meet next Thursday. We have one week, so choose one group of people to talk to and one set of papers to read.",
    ],
    saidQuote: {
      ...SARAH,
      text: "Our customers deserve better than they’re getting. I need a partner who can show my board a difference within a year.",
    },
    advisor: PRIYA,
    thinkAloud:
      "People tell us who matters and papers tell us what hurts, and one week buys one of each. Whatever we skip, we walk in on Thursday guessing about it.",
    levers: [
      {
        id: "talk",
        label: "Who we talk to",
        options: [
          {
            id: "d1-sarah-team",
            label: "Sarah’s own team",
            detail: "Hear what Sarah’s team wants fixed, and who judges the bids.",
            dims: { win: 3, deliver: -1 },
            flags: ["clue:declan"],
          },
          {
            id: "d1-delivery",
            label: "Orion’s delivery managers",
            detail: "A day in the warehouse with the people who send orders.",
            dims: { win: -1, deliver: 3 },
            flags: ["clue:marcus"],
          },
        ],
      },
      {
        id: "read",
        label: "What we read",
        options: [
          {
            id: "d1-complaints",
            label: "The complaint records",
            detail: "A year of what customers told Orion’s helpline.",
            dims: { win: 1, profit: -2, deliver: 2 },
            flags: ["clue:complaints"],
          },
          {
            id: "d1-budget",
            label: "The budget papers",
            detail: "What Orion will spend, and by when.",
            dims: { profit: 3, deliver: -1 },
            flags: ["clue:budget"],
          },
          {
            id: "d1-rivals",
            label: "The rival firms",
            detail: "Who else is bidding, and what they sell.",
            dims: { win: 2, deliver: -1 },
            flags: ["clue:rivals"],
          },
        ],
      },
    ],
    outcomes: [
      {
        id: "d1-solved",
        when: { all: ["clue:complaints", "clue:marcus"] },
        tone: "strong",
        headline: "Solved: the trouble starts after people buy.",
        detail:
          "Because you read the complaints and spent a day in the warehouse, you have both halves: half a million complaints a year, nearly all about late deliveries, three-week refunds and a helpline that cannot see the order. The man who runs all of it, Marcus Reed, Orion’s Operations Director, has not been in a single meeting.",
        changed: ["We know what is really wrong: what happens after the sale", "We know who runs it: Marcus Reed"],
        effect: { dims: { win: 2, deliver: 2 }, flags: ["knows:after_sale"] },
        lesson: taught(IDEA_1, "You looked at what customers complain about and who runs it."),
      },
      {
        id: "d1-complaints",
        when: { all: ["clue:complaints"] },
        tone: "mixed",
        headline: "The complaints are not about the shops.",
        detail:
          "Because you read a year of complaints, you know shoppers like the shops and hate what comes after they buy, and answering them costs Orion about £2.5 million a year. You still don’t know who runs that part of Orion.",
        changed: ["We know what is really wrong: what happens after the sale", "Nobody has told us who runs it"],
        effect: { dims: { win: 2 }, flags: ["knows:after_sale"] },
        lesson: taught(IDEA_1, "The complaint figures showed a problem that Sarah’s one line never mentioned."),
      },
      {
        id: "d1-warehouse",
        when: { all: ["clue:marcus"] },
        tone: "mixed",
        headline: "The warehouse told you what the brief didn’t.",
        detail:
          "Because you spent a day with the delivery managers, you heard it first hand: orders leave late, refunds wait three weeks, and the helpline can see neither. They work for Marcus Reed, the Operations Director, whom nobody has invited to a meeting.",
        changed: ["We know what is really wrong: what happens after the sale", "We have no figures to show Sarah yet"],
        effect: { dims: { deliver: 2 }, flags: ["knows:after_sale"] },
        lesson: taught(IDEA_1, "The people who run deliveries knew what was wrong, and nobody had asked them."),
      },
      {
        id: "d1-sarahs-version",
        tone: "hard",
        headline: "You know Sarah’s version of the problem, and only hers.",
        detail:
          "Because you spent the week with Sarah’s team and on papers about the deal, you know who scores the bids: Declan Foyle, who buys for Orion. Nobody you met runs anything a customer complains about.",
        changed: ["We know who scores the bids: Declan Foyle", "We still don’t know what customers are angry about"],
        effect: { dims: { win: 1 } },
        lesson: taught(IDEA_1, "You learned about the deal, not about what is going wrong for Orion’s customers."),
      },
    ],
    lesson: taught(IDEA_1, "What Sarah asked for and what customers complain about were different things."),
    next: "d2",
  },

  /** d2 · Prompted. One hint from Priya; the meeting room. */
  {
    kind: "levers",
    id: "d2",
    chapter: 1,
    stage: "lead",
    title: "The first meeting",
    eyebrow: "Thursday",
    objective: "Choose what we open with and who else comes to Sarah’s meeting.",
    minutes: 4,
    question: "How do we open the first meeting?",
    situation: [
      "Because of this week’s work, we know what Orion’s customers are really angry about. Sarah gives us thirty minutes on Thursday, so choose what we open with and who else we invite.",
    ],
    variants: [
      {
        when: { none: ["knows:after_sale"] },
        situation: [
          "This week told us who scores the bids, but not what Orion’s customers are angry about. Sarah gives us thirty minutes on Thursday, so choose what we open with and who else we invite.",
        ],
      },
    ],
    saidQuote: {
      ...SARAH,
      text: "I have thirty minutes and three firms. My board wants to hear about the shops.",
    },
    advisor: PRIYA,
    consider: ["What will Sarah remember from thirty minutes with us?"],
    levers: [
      {
        id: "open",
        label: "What we open with",
        options: [
          {
            id: "d2-found",
            label: "What we found this week",
            detail: "Open with what is really hurting Orion’s customers.",
            dims: { win: 2, profit: -1, deliver: 3 },
            flags: ["led:after_sale"],
            requires: { all: ["knows:after_sale"] },
          },
          {
            id: "d2-shops",
            label: "The shops, as Sarah asked",
            detail: "The shop experience her one line describes.",
            dims: { win: 3, profit: 1, deliver: -2 },
          },
          {
            id: "d2-past",
            label: "Our past work for retailers",
            detail: "A retailer we helped, and what changed for its customers.",
            dims: { win: 1, profit: 2 },
          },
        ],
      },
      {
        id: "invite",
        label: "Who else we invite",
        options: [
          {
            id: "d2-nobody",
            label: "Nobody else, yet",
            detail: "Keep Sarah’s full attention on us.",
            dims: { win: 2, deliver: -1 },
          },
          {
            id: "d2-marcus",
            label: "Marcus Reed, from Operations",
            detail: "Ask Sarah to bring Marcus, who runs deliveries and warehouses.",
            dims: { win: -1, deliver: 3 },
            flags: ["met:marcus"],
            requires: { all: ["clue:marcus"] },
          },
          {
            id: "d2-declan",
            label: "Declan Foyle, Orion’s buyer",
            detail: "Ask to meet Declan, who buys for Orion and scores bids.",
            dims: { win: -1, profit: 2 },
            flags: ["met:declan"],
            requires: { all: ["clue:declan"] },
          },
        ],
      },
    ],
    outcomes: [
      {
        id: "d2-trusted",
        when: { all: ["led:after_sale"], any: ["clue:complaints", "met:marcus"] },
        tone: "strong",
        headline: "Sarah: “I have suspected this for a year.”",
        detail:
          "Because you opened with what happens after people buy, backed by Orion’s own figures or by Marcus nodding beside you, Sarah heard her business described from outside. She asked us for a written offer.",
        changed: ["Sarah trusts us", "She has asked for a written offer"],
        effect: { dims: { win: 4 }, flags: ["sarah:trusts"] },
        lesson: taught(IDEA_1, "We described her real problem and could show what it rested on."),
      },
      {
        id: "d2-vouched",
        when: { all: ["led:after_sale", "start:connector"] },
        tone: "mixed",
        headline: "Sarah took your word for it, for now.",
        detail:
          "Because the friend who introduced us had vouched for you, Sarah believed you without seeing a figure. She asked for an offer, and will want the figures before she signs.",
        changed: ["Sarah trusts us, on a friend’s word", "She will want figures before she signs"],
        effect: { dims: { win: 2 }, flags: ["sarah:trusts"] },
        lesson: taught(IDEA_1, "A warm introduction bought belief, but only until the proof is due."),
      },
      {
        id: "d2-guess",
        when: { all: ["led:after_sale"] },
        tone: "hard",
        headline: "The right problem, and nothing to show her.",
        detail:
          "Because you named the problem with no figures and nobody from Orion to back it, it sounded like a clever guess. Sarah was polite and asked us to come back with proof.",
        changed: ["Sarah has doubts", "She wants proof before anything else"],
        effect: { flags: ["sarah:doubts"] },
        lesson: taught(IDEA_1, "We named the problem but had nothing she could check."),
      },
      {
        id: "d2-brief",
        tone: "hard",
        headline: "Sarah heard her own brief read back to her.",
        detail:
          "Because you opened with the shops she asked about, or with our past work, we sounded like the other two firms. Sarah was friendly and wrote nothing down. She still asked all three firms for a written offer.",
        changed: ["Sarah has doubts", "We sound like the other two firms"],
        effect: { dims: { win: 1 }, flags: ["sarah:doubts"] },
        lesson: taught(IDEA_1, "We told her what she already believed, so nothing we said was new to her."),
      },
    ],
    lesson: taught(IDEA_1, "Sarah’s trust followed what we knew about her business."),
    next: "guess-1",
  },

  /**
   * Guess, then see (STRATEGY §2.8). Asked at the act break before the debrief reveals the
   * cause; unscored, and no answer changes the game. The interface stages every reflection
   * of an act on its break.
   */
  {
    kind: "interlude",
    id: "guess-1",
    role: "reflection",
    chapter: 1,
    advisor: PRIYA,
    eyebrow: "Guess the cause",
    title: "How Sarah left",
    body: ["Before I tell you, take a guess. Nothing is scored."],
    prompt: "What do you think decided how Sarah left?",
    responses: [
      "Who we talked to",
      "What we read",
      "What we opened with",
      "Who else we invited",
      "Your team’s strength",
    ],
    next: "deb-1",
  },

  {
    kind: "interlude",
    id: "deb-1",
    role: "chapter-debrief",
    chapter: 1,
    eyebrow: "Act one, closed",
    title: "What Sarah heard",
    body: ["Sarah left the first meeting either trusting us or with doubts."],
    reveal: [
      "What decided it: what you opened with (decision 2), and what backed it: Orion’s figures (decision 1), Marcus in the room (decision 2), or a friend’s introduction (your team’s strength).",
      IDEA_1,
      "At work: any first meeting with someone who wants something fixed.",
    ],
    next: "int-2",
  },

  /* ══════════════════════════ ACT 2 · NOT EVERY DEAL IS WORTH WINNING ══════════════════════════ */
  {
    kind: "interlude",
    id: "int-2",
    role: "chapter-open",
    chapter: 2,
    advisor: RIYA,
    eyebrow: "Act Two",
    title: "Not every deal is worth winning",
    body: [
      "I’m Riya Kapoor, your boss: I decide how our six people spend their weeks. Orion wants an offer but hasn’t agreed to buy anything, so first we decide what it is worth to us.",
    ],
    next: "d3",
  },

  /** d3 · Modelled. Riya thinks aloud; the staffing board. */
  {
    kind: "levers",
    id: "d3",
    chapter: 2,
    stage: "opportunity",
    title: "How much do we bet?",
    eyebrow: "The next month",
    objective: "Choose how many of our people go after Orion, and whether we study first.",
    minutes: 4,
    question: "How much of our team does Orion get?",
    situation: [
      "Sarah trusts us now and wants a written offer within a month. Every week our people spend chasing Orion is a week nobody pays for, so choose how many go, and whether we study Orion first.",
    ],
    variants: [
      {
        when: { all: ["sarah:doubts"] },
        situation: [
          "Sarah has doubts about us, and still wants a written offer within a month. Every week our people spend chasing Orion is a week nobody pays for, so choose how many go, and whether we study Orion first.",
        ],
      },
    ],
    advisor: RIYA,
    thinkAloud:
      "Two people keep the rest of us earning but may look half-hearted, and four make losing cost us a month of their pay. A study teaches us more, and it costs either Orion’s money or ours.",
    levers: [
      {
        id: "people",
        label: "People on Orion",
        options: [
          {
            id: "d3-two",
            label: "Two of our six",
            detail: "Two people on Orion for a month; four stay on paid work.",
            dims: { win: -2, profit: 3, deliver: -1 },
          },
          {
            id: "d3-four",
            label: "Four of our six",
            detail: "Four people on Orion for a month; two stay on paid work.",
            dims: { win: 2, profit: -3, deliver: 1 },
            flags: ["bet:four"],
          },
        ],
      },
      {
        id: "study",
        label: "A study first?",
        options: [
          {
            id: "d3-no-study",
            label: "No study: write the offer",
            detail: "Start the offer now, from what we already know.",
            dims: { win: 2, deliver: -2 },
          },
          {
            id: "d3-paid",
            label: "Orion pays for a study",
            detail: "Orion pays us for two weeks inside its business.",
            dims: { win: -2, profit: 3, deliver: 2 },
            flags: ["study:paid", "inside:orion"],
            requires: { all: ["sarah:trusts"] },
          },
          {
            id: "d3-free",
            label: "We study for free",
            detail: "Two unpaid weeks in Orion’s warehouses and on its helpline.",
            dims: { win: -1, profit: -4, deliver: 3 },
            flags: ["study:free", "inside:orion"],
          },
        ],
      },
    ],
    outcomes: [
      {
        id: "d3-paid",
        when: { all: ["study:paid"] },
        tone: "strong",
        headline: "Orion is paying us to look inside.",
        detail:
          "Because Sarah trusts us, she paid for two weeks inside Orion. We checked the order records our plan depends on, and met the managers of Marcus Reed, the Operations Director who runs deliveries.",
        changed: ["We have seen inside Orion, at Orion’s cost", "We have Orion’s own complaint figures"],
        effect: { dims: { profit: 2, deliver: 1 }, flags: ["clue:marcus", "clue:complaints"] },
        lesson: taught(IDEA_2, "Sarah’s trust turned the cost of finding out into paid work."),
      },
      {
        id: "d3-free-found",
        when: { all: ["study:free"], none: ["knows:after_sale"] },
        tone: "mixed",
        headline: "Two free weeks, and now we know what’s wrong.",
        detail:
          "Because we gave our time for nothing, Sarah let us in, and we found it: customers are angry about late deliveries, slow refunds and the helpline, not the shops, and the people behind all three told us so. They work for Marcus Reed, who runs Orion’s deliveries. Two weeks of our pay bought what a week of reading could have.",
        changed: ["We know what is really wrong: what happens after the sale", "Two weeks of our pay went on finding it"],
        effect: { dims: { win: 2 }, flags: ["knows:after_sale", "clue:complaints", "clue:marcus"] },
        lesson: taught(IDEA_2, "Finding out late cost money we need not have spent in week one."),
      },
      {
        id: "d3-free-checked",
        when: { all: ["study:free"] },
        tone: "mixed",
        headline: "Two free weeks to check what we knew.",
        detail: "Because we gave two unpaid weeks, we checked the order records our plan depends on.",
        changed: ["We have checked the order records our plan depends on", "Two weeks of our pay went on checking"],
        effect: { dims: { win: 2 }, flags: ["clue:complaints", "clue:marcus"] },
        lesson: taught(IDEA_2, "Checking cost us two weeks’ pay, and now we know where the plan starts."),
      },
      {
        id: "d3-four-doubts",
        when: { all: ["bet:four", "sarah:doubts"] },
        tone: "hard",
        headline: "Four people, unpaid, on a client with doubts.",
        detail:
          "Because you put four of our six on Orion while Sarah still doubts us, a month of their pay rides on a client who isn’t sure.",
        changed: ["Four of our six are on Orion", "A month of their pay rides on a doubtful client"],
        effect: { dims: { profit: -3 } },
        lesson: taught(IDEA_2, "We spent the most where we had the least reason to believe."),
      },
      {
        id: "d3-four-trusted",
        when: { all: ["bet:four"] },
        tone: "mixed",
        headline: "Four people on a client who wants us.",
        detail:
          "Because Sarah trusts us, four people tells her we mean it, and leaves spare hands for checking. Two paying clients are short-staffed for a month.",
        changed: ["Four of our six are on Orion", "Two paying clients are short-staffed"],
        effect: { dims: { win: 2 } },
        lesson: taught(IDEA_2, "A big bet suited a client who had already shown she trusted us."),
      },
      {
        id: "d3-two",
        tone: "mixed",
        headline: "Two people on it, and four still earning.",
        detail:
          "Because you kept four of our six on paid work, this month is safe whatever Orion decides. Nobody is spare to check what the offer rests on.",
        changed: ["Two of our six are on Orion", "This month’s paid work is safe"],
        effect: { dims: { profit: 1 } },
        lesson: taught(IDEA_2, "A small bet kept the month safe and left nothing spare."),
      },
    ],
    lesson: taught(IDEA_2, "A deal is worth only the team time it can repay."),
    next: "d4",
  },

  /** d4 · Prompted. One hint from Riya; the staffing board. */
  {
    kind: "levers",
    id: "d4",
    chapter: 2,
    stage: "opportunity",
    title: "The rival’s demo",
    eyebrow: "Two weeks later",
    objective: "Choose how we answer a rival’s demo, and what we bring to Sarah.",
    minutes: 4,
    question: "How do we answer the rival’s demo?",
    situation: [
      "Two weeks later, a rival firm showed Sarah’s board a demo: screens in every shop and a new app, made with a famous technology company. Sarah wants our answer by Friday, so choose how we answer and what we bring.",
    ],
    quotes: [
      {
        when: { all: ["sarah:trusts"] },
        ...SARAH,
        text: "My board has seen their demo. I haven’t changed my mind, but they’ll ask me why.",
      },
    ],
    saidQuote: {
      ...SARAH,
      text: "My board has seen their demo, and it looks impressive. Tell me why I should still be talking to you.",
    },
    advisor: RIYA,
    consider: ["What would answering the demo cost us, and what would ignoring it?"],
    levers: [
      {
        id: "answer",
        label: "How we answer",
        options: [
          {
            id: "d4-match",
            label: "Match it",
            detail: "Add shop screens and an app to our offer.",
            dims: { win: 3, profit: -3, deliver: -3 },
            flags: ["bid:shops"],
          },
          {
            id: "d4-quiet",
            label: "Don’t mention it",
            detail: "Keep to our plan and say nothing about their demo.",
            dims: { win: -2, profit: 2, deliver: 1 },
          },
          {
            id: "d4-reframe",
            label: "Change the question",
            detail: "Show Sarah what their demo leaves out.",
            dims: { win: 2, deliver: 1 },
            flags: ["bid:after_sale"],
            requires: { all: ["knows:after_sale"] },
          },
        ],
      },
      {
        id: "bring",
        label: "What we bring",
        options: [
          {
            id: "d4-note",
            label: "A one-page note",
            detail: "One page by Friday, in plain words.",
            dims: { win: -1, profit: 2 },
          },
          {
            id: "d4-figures",
            label: "Her own complaint figures",
            detail: "What answering complaints costs Orion every year.",
            dims: { win: 3, profit: -1 },
            flags: ["showed:figures"],
            requires: { all: ["clue:complaints"] },
          },
          {
            id: "d4-visit",
            label: "A visit to a past client",
            detail: "Take Sarah to a retailer we have already helped.",
            dims: { win: 2, profit: -2, deliver: 1 },
            flags: ["showed:visit"],
          },
        ],
      },
    ],
    outcomes: [
      {
        id: "d4-match",
        when: { all: ["bid:shops"] },
        tone: "hard",
        headline: "Two firms selling screens, and theirs has the famous partner.",
        detail:
          "Because you matched the demo, we are bidding to build screens and an app, which our team has never done, against a firm that has.",
        changed: ["The bid is about the shops now", "We are offering work our team has never done"],
        effect: { dims: { win: 1, profit: -2 }, flags: ["problem:shops"] },
        lesson: taught(IDEA_2, "We chased the rival’s deal, which we could neither win cheaply nor deliver well."),
      },
      {
        id: "d4-reframed",
        when: { all: ["bid:after_sale"], any: ["showed:figures", "showed:visit"] },
        tone: "strong",
        headline: "Sarah stopped comparing us with the demo.",
        detail:
          "Because you showed what the demo leaves out, with proof she could check, the screens now look like an answer to a different question.",
        changed: ["The bid is about what happens after the sale", "Sarah has proof she can check"],
        effect: { dims: { win: 4 }, flags: ["problem:after_sale"] },
        lesson: taught(IDEA_2, "We chased only the deal we could win on what we know."),
      },
      {
        id: "d4-reframed-thin",
        when: { all: ["bid:after_sale"] },
        tone: "mixed",
        headline: "Sarah agreed, and asked for proof.",
        detail:
          "Because you pointed Sarah at what happens after people buy, she agreed the demo misses it. She wants figures in the offer.",
        changed: ["The bid is about what happens after the sale", "Sarah wants figures in the offer"],
        effect: { dims: { win: 1 }, flags: ["problem:after_sale"] },
        lesson: taught(IDEA_2, "We picked the right deal and brought too little to make it stick."),
      },
      {
        id: "d4-unmoved",
        when: { all: ["sarah:trusts"] },
        tone: "strong",
        headline: "Sarah didn’t need an answer. She already trusted us.",
        detail:
          "Because you said nothing about the demo and Sarah already trusted us, it didn’t move her. We spent nothing on it.",
        changed: ["The bid is about what happens after the sale", "We spent nothing answering the demo"],
        effect: { dims: { profit: 2 }, flags: ["problem:after_sale"] },
        lesson: taught(IDEA_2, "Sarah’s trust let us ignore a deal we didn’t want."),
      },
      {
        id: "d4-silence",
        tone: "hard",
        headline: "We said nothing, and the demo became the project.",
        detail:
          "Because we said nothing about the demo while Sarah had doubts, her board judged us on the rival’s terms. By Friday Orion’s staff called it “the shop screens project”.",
        changed: ["The bid is about the shops now", "Orion’s staff call it the shop screens project"],
        effect: { dims: { win: -4 }, flags: ["problem:shops"] },
        lesson: taught(IDEA_2, "Our silence let the rival choose which deal Orion thinks it is buying."),
      },
    ],
    lesson: taught(IDEA_2, "The screens deal was one we could neither win cheaply nor deliver."),
    next: "guess-2",
  },

  {
    kind: "interlude",
    id: "guess-2",
    role: "reflection",
    chapter: 2,
    advisor: RIYA,
    eyebrow: "Guess the cause",
    title: "What the bid became",
    body: ["Before I tell you, take a guess. Nothing is scored."],
    prompt: "Which choice do you think settled what the bid is about?",
    responses: [
      "How many people we put on it",
      "Whether we studied Orion",
      "How we answered the demo",
      "The first meeting",
    ],
    next: "deb-2",
  },

  {
    kind: "interlude",
    id: "deb-2",
    role: "chapter-debrief",
    chapter: 2,
    eyebrow: "Act two, closed",
    title: "What the bid is about",
    body: [
      "The bid is now about what happens after people buy, or about the shops, with two or four of our people on it.",
    ],
    reveal: [
      "What decided it: how you answered the demo (decision 4), and whether Sarah already trusted you (decision 2).",
      IDEA_2,
      "At work: when a competitor or a louder colleague sets the agenda.",
    ],
    next: "int-3",
  },

  /* ══════════════════════════ ACT 3 · TRADE, DON’T GIVE ══════════════════════════ */
  {
    kind: "interlude",
    id: "int-3",
    role: "chapter-open",
    chapter: 3,
    advisor: RIYA,
    eyebrow: "Act Three",
    title: "Trade, don’t give",
    body: [
      "Now we write the offer, once. Arjun Mehta, who designs what we sell, will build it with you, and then Orion’s buyer will want a lower price.",
    ],
    next: "d5",
  },

  /** d5 · Modelled. Arjun thinks aloud; the contract with clauses. */
  {
    kind: "levers",
    id: "d5",
    chapter: 3,
    stage: "solution",
    title: "Build the offer",
    eyebrow: "The offer",
    objective: "Choose what the offer fixes, how fast we promise it, and how Orion pays.",
    minutes: 4,
    question: "What goes in our offer?",
    situation: [
      "Because the bid is now about the shops, I’m writing our offer this week, once. Choose what we fix, how fast we promise it, and how Orion pays us.",
    ],
    variants: [
      {
        when: { all: ["problem:after_sale"] },
        situation: [
          "Because the bid is now about what happens after people buy, I’m writing our offer this week, once. Choose what we fix, how fast we promise it, and how Orion pays us.",
        ],
      },
    ],
    quotes: [
      {
        when: { all: ["met:marcus"] },
        ...MARCUS,
        text: "Every plan like this brings work for my people and no time for them. The last plan like this was stopped in month six.",
      },
    ],
    saidQuote: { ...SARAH, text: "Whatever you write, my board will read as a promise." },
    advisor: ARJUN,
    thinkAloud:
      "Every piece we add makes the offer easier to choose and gives Aisha Khan, who runs the work once we sign, more to deliver. A faster date or a fixed price makes Orion keener, and if it slips, we pay.",
    levers: [
      {
        id: "fix",
        label: "What we fix",
        options: [
          {
            id: "d5-shops-app",
            label: "The shops and the app",
            detail: "New screens in every shop, and a new app.",
            dims: { win: 3, profit: 1, deliver: -4 },
            flags: ["promise:screens"],
          },
          {
            id: "d5-app",
            label: "The app only",
            detail: "A new app; the shops stay as they are.",
            dims: { win: 1, profit: 2, deliver: -2 },
            flags: ["promise:app"],
          },
          {
            id: "d5-after-sale",
            label: "Everything after people buy",
            detail: "Deliveries, refunds and the helpline, fixed together.",
            dims: { win: 2, profit: -1, deliver: 2 },
            flags: ["promise:refunds"],
            requires: { all: ["knows:after_sale"] },
          },
        ],
      },
      {
        id: "fast",
        label: "How fast",
        options: [
          {
            id: "d5-trial",
            label: "A trial in eight weeks",
            detail: "Ten shops trying it within eight weeks of signing.",
            dims: { win: 3, profit: -1, deliver: -3 },
            flags: ["promise:trial"],
          },
          {
            id: "d5-month-five",
            label: "One date: month five",
            detail: "Everything finished together by the end of month five.",
            dims: { profit: 1, deliver: 1 },
          },
        ],
      },
      {
        id: "pay",
        label: "How Orion pays",
        options: [
          {
            id: "d5-fixed",
            label: "One fixed price",
            detail: "£2.6 million, whatever the work turns out to need.",
            dims: { win: 2, profit: -2 },
            flags: ["promise:fixed"],
          },
          {
            id: "d5-by-day",
            label: "By the day",
            detail: "Orion pays for the days we work: about £2.6 million if all goes well.",
            dims: { win: -2, profit: 2 },
          },
          {
            id: "d5-results",
            label: "Partly on results",
            detail: "A third of our fee only if complaints fall by a fifth.",
            dims: { win: 3, profit: -3, deliver: -1 },
            flags: ["promise:results"],
            requires: { any: ["start:builder", "inside:orion"] },
          },
        ],
      },
    ],
    outcomes: [
      {
        id: "d5-new-work",
        when: { any: ["promise:screens", "promise:app"] },
        tone: "hard",
        headline: "An offer for work our team has never done.",
        detail:
          "Because the offer promises screens or an app, we need a technology partner we don’t have. Aisha asked who on our team has built an app. Nobody has.",
        changed: ["The offer promises work our team has never done", "Aisha has nobody who has built an app"],
        effect: { dims: { deliver: -2 } },
        lesson: taught(IDEA_3, "We gave Orion what it asked to see, and took on work our team cannot do."),
      },
      {
        id: "d5-two-gifts",
        when: { all: ["promise:trial", "promise:fixed"] },
        tone: "hard",
        headline: "A fast date, and we pay if it slips.",
        detail:
          "Because you promised a trial in eight weeks at a fixed price, every week it slips comes out of our money, not Orion’s.",
        changed: ["A ten-shop trial is promised by week eight", "The price will not change, whatever it takes"],
        effect: { dims: { profit: -2 } },
        lesson: taught(IDEA_3, "Speed and a fixed price were two gifts, and we got nothing for either."),
      },
      {
        id: "d5-results-measured",
        when: { all: ["promise:results"], any: ["inside:orion", "clue:complaints"] },
        tone: "strong",
        headline: "Paid on results we have already measured.",
        detail:
          "Because we have Orion’s own complaint figures, a fee tied to cutting them is a bet we can see. Declan, Orion’s buyer, will score it as a saving.",
        changed: ["A third of our fee rides on complaints falling", "We know where the complaint figures start"],
        effect: { dims: { win: 2, profit: 2 } },
        lesson: taught(IDEA_3, "We took a risk we had measured, and got a reason for Orion to choose us."),
      },
      {
        id: "d5-results-blind",
        when: { all: ["promise:results"] },
        tone: "mixed",
        headline: "Our fee rides on a figure we haven’t seen.",
        detail:
          "Because you tied a third of our fee to complaints falling, Sarah’s board likes the offer. Nobody here has seen Orion’s own figure, so we don’t know where we start.",
        changed: ["A third of our fee rides on complaints falling", "Nobody here has seen Orion’s complaint figure"],
        effect: { dims: { win: 2 } },
        lesson: taught(IDEA_3, "We gave a guarantee before we knew what it would cost us."),
      },
      {
        id: "d5-priced",
        tone: "strong",
        headline: "An offer where every extra has a price.",
        detail:
          "Because you didn’t pair a fast date with a fixed price, no promise in the offer is a gift. Aisha can plan every line of it.",
        changed: ["No promise in the offer is given away", "Aisha can plan every line of it"],
        effect: { dims: { profit: 2, deliver: 1 } },
        lesson: taught(IDEA_3, "Each thing we promised was priced in, so nothing was given away."),
      },
    ],
    lesson: taught(IDEA_3, "Each extra was a cost we either priced in or gave away."),
    next: "d6",
  },

  /** d6 · Prompted. One hint from Riya; the contract with clauses. Orion chooses here. */
  {
    kind: "levers",
    id: "d6",
    chapter: 3,
    stage: "deal",
    title: "The price push",
    eyebrow: "Monday",
    objective: "Choose our price, what we drop, and what we ask for in return.",
    minutes: 4,
    question: "How do we answer on price?",
    situation: [
      "Our offer went in on Monday, and Declan Foyle, who buys for Orion, has it beside the rival’s, which is £600,000 cheaper. Sarah still wants us, so choose our price, what we drop, and what we ask for in return.",
    ],
    variants: [
      {
        when: { all: ["problem:shops"] },
        situation: [
          "Our offer went in on Monday, and Declan Foyle, who buys for Orion, has it beside the rival’s, which is £600,000 cheaper. Sarah likes both offers, so choose our price, what we drop, and what we ask for in return.",
        ],
      },
    ],
    saidQuote: {
      ...DECLAN,
      text: "I have two offers and a savings target. The cheaper one meets my target.",
    },
    advisor: RIYA,
    consider: ["What is each pound off worth to Declan, and to us?"],
    levers: [
      {
        id: "price",
        label: "Our price",
        options: [
          {
            id: "d6-hold",
            label: "Hold at £2.6 million",
            detail: "Keep the price, and explain what the extra buys.",
            dims: { win: -3, profit: 4, deliver: 1 },
          },
          {
            id: "d6-half",
            label: "Halfway: £2.3 million",
            detail: "Cut £300,000 and keep the rest.",
            dims: { win: 1, profit: -1 },
            flags: ["discount:half"],
          },
          {
            id: "d6-match",
            label: "Match them: £2 million",
            detail: "Cut £600,000 to equal the cheaper bid.",
            dims: { win: 4, profit: -6, deliver: -2 },
            flags: ["discount:full"],
          },
        ],
      },
      {
        id: "drop",
        label: "What we drop",
        options: [
          {
            id: "d6-drop-nothing",
            label: "Nothing",
            detail: "Orion gets everything in the offer.",
            dims: { win: 1, profit: -1, deliver: -1 },
          },
          {
            id: "d6-drop-trial",
            label: "The eight-week trial",
            detail: "Take the trial out; the main work stays.",
            dims: { win: -1, profit: 1, deliver: 2 },
            flags: ["dropped:trial"],
            requires: { all: ["promise:trial"] },
          },
          {
            id: "d6-drop-shops",
            label: "Half the shops",
            detail: "Roll the work out to 100 shops now, not 210.",
            dims: { win: -3, profit: 2, deliver: 1 },
            flags: ["dropped:shops"],
          },
        ],
      },
      {
        id: "ask",
        label: "What we ask back",
        options: [
          {
            id: "d6-ask-nothing",
            label: "Nothing",
            detail: "Ask for nothing in return.",
            dims: { win: 2, deliver: -1 },
          },
          {
            id: "d6-second-year",
            label: "A second year",
            detail: "Orion signs now for a second year of work.",
            dims: { win: -2, profit: 3 },
            flags: ["got:second_year"],
          },
          {
            id: "d6-ops-lead",
            label: "One of Marcus’s managers",
            detail: "An Orion operations manager on our team, full time.",
            dims: { win: -1, deliver: 4 },
            flags: ["got:ops_lead"],
            requires: { all: ["clue:marcus"] },
          },
        ],
      },
    ],
    outcomes: [
      {
        id: "d6-lost",
        when: { any: ["promise:screens", "promise:app"], none: ["discount:full"] },
        tone: "hard",
        headline: "Orion chose the cheaper firm.",
        detail:
          "Because both offers promised a new app, Declan could only compare prices, and theirs was lower. Orion chose the rival.",
        changed: ["Orion chose the rival", "There is no contract to sign"],
        effect: { flags: ["award:lost"] },
        lesson: taught(IDEA_3, "We offered what the rival offered, so we had nothing to trade but price."),
        next: "end",
      },
      {
        id: "d6-gave",
        when: {
          any: ["discount:half", "discount:full"],
          none: ["dropped:trial", "dropped:shops", "got:second_year", "got:ops_lead"],
        },
        tone: "hard",
        headline: "We cut the price, and got nothing for it.",
        detail:
          "Because you came down and asked for nothing back, Declan took the cut. Orion chose us, and the money for fixing surprises is gone.",
        changed: ["Orion chose us", "The money for fixing surprises is gone"],
        effect: { dims: { win: 1 }, flags: ["award:won"] },
        lesson: taught(IDEA_3, "We gave money away and asked for nothing in return."),
      },
      {
        id: "d6-traded",
        when: { any: ["discount:half", "discount:full"] },
        tone: "strong",
        headline: "Every pound we cut bought something back.",
        detail:
          "Because you came down only in exchange for less work, a second year or Marcus’s manager, Declan could show a saving and we kept what the money was for. Orion chose us.",
        changed: ["Orion chose us", "Every cut came with something back"],
        effect: { dims: { win: 2, profit: 2 }, flags: ["award:won"] },
        lesson: taught(IDEA_3, "Each thing we gave came with something we got."),
      },
      {
        id: "d6-held",
        when: {
          all: ["promise:refunds"],
          none: ["problem:shops"],
          any: ["showed:figures", "clue:rivals", "met:declan", "clue:budget"],
        },
        tone: "strong",
        headline: "We held the price, and Declan could write down why.",
        detail:
          "Because Declan had something to write down (what the cheaper bid leaves out, what complaints cost, that our price fits his budget, or what he heard from us in person), he could justify us. Orion chose us at full price.",
        changed: ["Orion chose us at full price", "Declan has a reason he can write down"],
        effect: { dims: { profit: 2 }, flags: ["award:won"] },
        lesson: taught(IDEA_3, "We held our price because Orion could see what the extra money bought."),
      },
      {
        id: "d6-wrong-question",
        when: { all: ["problem:shops"] },
        tone: "hard",
        headline: "Our figures answered a question Declan wasn’t asking.",
        detail:
          "Because the bid was still about the shops, nothing about refunds helped Declan. Sarah overruled her own buyer. He will write the contract.",
        changed: ["Orion chose us, against its buyer’s advice", "Declan will write the contract"],
        effect: { dims: { win: -2 }, flags: ["award:won", "declan:sore"] },
        lesson: taught(IDEA_3, "We held a price for one problem while the bid was about another."),
      },
      {
        id: "d6-overruled",
        tone: "hard",
        headline: "Sarah chose us against Declan’s advice.",
        detail:
          "Because we held the price with nothing Declan could write down, Sarah overruled her own buyer. He will write the contract.",
        changed: ["Orion chose us, against its buyer’s advice", "Declan will write the contract"],
        effect: { dims: { win: -2 }, flags: ["award:won", "declan:sore"] },
        lesson: taught(IDEA_3, "We held the price without a reason, so the cost moved into the contract."),
      },
    ],
    lesson: taught(IDEA_3, "Only the cuts we traded for something came back to us."),
    next: "guess-3",
  },

  {
    kind: "interlude",
    id: "guess-3",
    role: "reflection",
    chapter: 3,
    advisor: ARJUN,
    eyebrow: "Guess the cause",
    title: "How Declan chose",
    body: ["Before I tell you, take a guess. Nothing is scored."],
    prompt: "Which choice do you think decided how Declan chose?",
    responses: [
      "Our price",
      "What we dropped",
      "What we asked back",
      "What we showed Sarah about the demo",
      "What we put in the offer",
    ],
    next: "deb-3",
  },

  {
    kind: "interlude",
    id: "deb-3",
    role: "chapter-debrief",
    chapter: 3,
    eyebrow: "Act three, closed",
    title: "What Declan wrote down",
    body: ["Orion chose us, at our full price or with a cut. We gave some things, and got some back."],
    reveal: [
      "What decided it: what you put in the offer (decision 5), what you asked back (decision 6), and whether Declan had a reason he could write down (decisions 1, 2 and 4).",
      IDEA_3,
      "At work: whenever someone asks for a discount, an earlier date or “one small extra”.",
    ],
    next: "int-4",
  },

  /* ══════════════════════════ ACT 4 · PROMISE ONLY WHAT YOUR TEAM CAN DELIVER ══════════════════════════ */
  {
    kind: "interlude",
    id: "int-4",
    role: "chapter-open",
    chapter: 4,
    advisor: AISHA,
    eyebrow: "Act Four",
    title: "Promise only what your team can deliver",
    body: [
      "I’m Aisha Khan, and I run the work once a client signs. Orion has chosen us, so every promise in that offer is about to become my team’s job.",
    ],
    next: "d7",
  },

  /** d7 · Modelled. Aisha thinks aloud; the delivery calendar. */
  {
    kind: "levers",
    id: "d7",
    chapter: 4,
    stage: "deal",
    title: "Sign or walk",
    eyebrow: "The contract",
    objective: "Choose the one clause we change, then sign or walk away.",
    minutes: 4,
    question: "Do we sign this contract?",
    situation: [
      "Because Orion chose us, Declan has sent the contract: every promise we made, now in writing, plus a charge of £20,000 for each week we’re late. We can change one clause, then sign or walk away.",
    ],
    variants: [
      {
        when: { all: ["declan:sore"] },
        situation: [
          "Because Sarah overruled him, Declan wrote the contract himself, with a £20,000 charge for each week we’re late that he won’t discuss. We can change one clause, then sign or walk away.",
        ],
      },
    ],
    saidQuote: {
      ...DECLAN,
      text: "Standard terms. If you’re late, Orion is paid £20,000 a week. I assume that won’t be a problem.",
    },
    advisor: AISHA,
    thinkAloud:
      "Changing a clause costs us goodwill with Declan now, and leaving it costs my team later. Walking away loses the work, and signing commits us to every promise in it.",
    levers: [
      {
        id: "clause",
        label: "The clause we change",
        options: [
          {
            id: "d7-as-written",
            label: "None: leave it as written",
            detail: "Accept every clause, including the late charge.",
            dims: { win: 2, deliver: -2 },
            flags: ["promise:late_fee"],
          },
          {
            id: "d7-no-late-fee",
            label: "Remove the late charge",
            detail: "No £20,000 a week if we are late.",
            dims: { win: -2, profit: 2 },
            requires: { none: ["declan:sore"] },
          },
          {
            id: "d7-later",
            label: "Every date a month later",
            detail: "Move every date back a month; Declan takes £100,000 off.",
            dims: { win: -1, profit: -3, deliver: 3 },
            flags: ["promise:late_fee", "dates:moved"],
          },
        ],
      },
      {
        id: "sign",
        label: "Sign or walk",
        options: [
          {
            id: "d7-sign",
            label: "Sign it",
            detail: "Sign today; Aisha’s team starts on Monday.",
            dims: { win: 4, deliver: -2 },
            flags: ["signed"],
          },
          {
            id: "d7-walk",
            label: "Walk away",
            detail: "Tell Sarah no, and why, in writing.",
            dims: { win: -8, profit: 2, deliver: 4 },
            flags: ["walked"],
          },
        ],
      },
    ],
    outcomes: [
      {
        id: "d7-walk-right",
        when: { all: ["walked"], any: ["promise:screens", "promise:app", "discount:full"] },
        tone: "strong",
        headline: "We walked away from a deal that would cost us.",
        detail:
          "Because the contract held work our team has never built, or a price £600,000 below cost, signing meant promising what we couldn’t keep.",
        changed: ["There is no contract", "No promise is owed to Orion"],
        effect: {},
        lesson: taught(IDEA_4, "The deal couldn’t pay or couldn’t be delivered, so not signing was the promise we could keep."),
        next: "end",
      },
      {
        id: "d7-walk-wrong",
        when: { all: ["walked"] },
        tone: "hard",
        headline: "We walked away from work we could have done.",
        detail: "Because you walked away from promises my team could keep, the work went to the rival.",
        changed: ["There is no contract", "The rival is doing the work"],
        effect: {},
        lesson: taught(IDEA_4, "The promises were ones we could deliver, so walking away gave up good work."),
        next: "end",
      },
      {
        id: "d7-signed-new-work",
        when: { all: ["signed"], any: ["promise:screens", "promise:app"] },
        tone: "hard",
        headline: "Signed: promises our team has never kept before.",
        detail:
          "Because you signed for screens or an app, my team owes Orion work none of us has done, by month five.",
        changed: ["The contract is signed", "My team owes work none of us has done"],
        effect: { dims: { deliver: -3 } },
        lesson: taught(IDEA_4, "We signed for what Orion wanted to see, not for what my team can build."),
      },
      {
        id: "d7-signed-no-fee",
        when: { all: ["signed"], none: ["promise:late_fee"] },
        tone: "strong",
        headline: "Signed, and lateness won’t cost us £20,000 a week.",
        detail: "Because you took out the late charge before signing, a slip will cost us goodwill, not money.",
        changed: ["The contract is signed", "There is no late charge"],
        effect: { dims: { profit: 2 } },
        lesson: taught(IDEA_4, "We removed the clause we couldn’t be sure of keeping before it became a promise."),
      },
      {
        id: "d7-signed",
        tone: "mixed",
        headline: "Signed. Every promise is now my team’s.",
        detail:
          "Because you signed, every promise card in your hand now has a due date in the contract. Each week we’re late costs £20,000.",
        changed: ["The contract is signed", "Each week we’re late costs £20,000"],
        effect: { dims: { win: 2 } },
        lesson: taught(IDEA_4, "Signing turned every promise into a date my team has to meet."),
      },
    ],
    lesson: taught(IDEA_4, "The contract turned every promise into a date."),
    next: "d8",
  },

  /** d8 · Prompted. One hint from Aisha; the delivery calendar plays out. */
  {
    kind: "levers",
    id: "d8",
    chapter: 4,
    stage: "delivery",
    title: "Month five",
    eyebrow: "Month five",
    objective: "Choose what we tell Sarah, and who covers the three weeks.",
    minutes: 4,
    question: "Month five: what do we do?",
    situation: [
      "It’s month five, and Marcus Reed, who runs Orion’s deliveries, has frozen every change to his warehouses until the summer sale ends. Nobody told us it was coming, so we’re three weeks behind, and Sarah’s board meets on Friday.",
    ],
    variants: [
      {
        when: { all: ["got:ops_lead"] },
        situation: [
          "It’s month five, and Orion’s summer sale has frozen every change to the warehouses. Marcus’s manager warned us in month two, so we planned for it, and Sarah’s board meets on Friday.",
        ],
      },
      {
        when: { any: ["dates:moved", "dropped:shops"] },
        situation: [
          "It’s month five, and Marcus Reed, who runs Orion’s deliveries, has frozen every change to his warehouses for the summer sale. We’re three weeks behind our own plan, but the contract still has room.",
        ],
      },
    ],
    quotes: [
      {
        when: { all: ["got:ops_lead"] },
        ...MARCUS,
        text: "My manager told you about the freeze in month two. I’d like to hear you planned for it.",
      },
      {
        /* The trial was due in month two, so by month five Sarah already knows whether it held:
           this is the trial's own broken condition, read off the cards that decide it. */
        when: { all: ["promise:trial"], none: ["dropped:trial", "inside:orion", "bet:four", "dates:moved"] },
        ...SARAH,
        text: "Your trial started a month late. On Friday I need to know which other dates are real.",
      },
      {
        when: { any: ["dates:moved", "dropped:shops"] },
        ...SARAH,
        text: "My board meets on Friday. I’d like to tell them everything is on track.",
      },
    ],
    saidQuote: { ...SARAH, text: "My board has your dates. On Friday I need to know which of them are real." },
    advisor: AISHA,
    consider: ["Who pays for the three weeks: us, our team or Orion?"],
    levers: [
      {
        id: "tell",
        label: "What we tell Sarah",
        options: [
          {
            id: "d8-tell",
            label: "The real dates, now",
            detail: "Tell Sarah this week which promises will slip.",
            dims: { win: -2, deliver: 3 },
            flags: ["told:sarah"],
          },
          {
            id: "d8-quiet",
            label: "Nothing until we catch up",
            detail: "Work quietly, and tell her once we have caught up.",
            dims: { win: 2, profit: 1, deliver: -3 },
            flags: ["kept:quiet"],
          },
        ],
      },
      {
        id: "cover",
        label: "Who covers the gap",
        options: [
          {
            id: "d8-weekends",
            label: "Our team, at weekends",
            detail: "The same six people, six weekends in a row.",
            dims: { win: 1, profit: 1, deliver: -3 },
            flags: ["team:weekends"],
          },
          {
            id: "d8-contractors",
            label: "Two contractors, at our cost",
            detail: "Hire two people for two months, and we pay.",
            dims: { profit: -4, deliver: 3 },
            flags: ["team:extra"],
          },
          {
            id: "d8-orion-pays",
            label: "Ask Orion to pay",
            detail: "Ask Sarah to pay for the extra weeks of work.",
            dims: { win: -3, profit: 2, deliver: 2 },
            flags: ["team:orion_pays"],
            requires: { none: ["promise:fixed"] },
          },
        ],
      },
    ],
    outcomes: [
      {
        id: "d8-heard-from-marcus",
        when: { all: ["kept:quiet"] },
        tone: "hard",
        headline: "Sarah heard it from Marcus first.",
        detail:
          "Because we said nothing, Marcus told Sarah’s board the dates were slipping, and she found out in front of them. Any promise that slips now counts as broken, not late.",
        changed: ["Sarah heard about the freeze from Marcus", "Any promise that slips now counts as broken"],
        effect: { dims: { win: -6 } },
        lesson: taught(IDEA_4, "We hid a promise we couldn’t keep, and the client heard it from someone else."),
      },
      {
        id: "d8-planned",
        when: { all: ["told:sarah", "got:ops_lead"] },
        tone: "strong",
        headline: "Bad news, a plan, and Marcus on our side.",
        detail:
          "Because Marcus’s manager warned us in month two and you told Sarah first, the board kept every date.",
        changed: ["Sarah heard it from us first", "The board kept every date"],
        effect: { dims: { win: 4, deliver: 3 } },
        lesson: taught(IDEA_4, "We had promised around Orion’s real calendar, and said early when a date moved."),
      },
      {
        id: "d8-thin",
        when: { all: ["team:extra", "discount:full"] },
        tone: "hard",
        headline: "Contractors paid from money we’d already given away.",
        detail:
          "Because we cut £600,000 to win, the contractors are paid from a contract that was already thin. Orion now costs us more than it pays.",
        changed: ["Two contractors are on Orion, at our cost", "Orion now costs us more than it pays"],
        effect: { dims: { profit: -6 } },
        lesson: taught(IDEA_4, "The money that should have paid for this went on winning the deal."),
      },
      {
        id: "d8-staffed",
        when: { all: ["told:sarah"], any: ["team:extra", "team:orion_pays"] },
        tone: "strong",
        headline: "Late, honest, and properly staffed.",
        detail:
          "Because you told Sarah the real dates and put proper people on the gap, her board agreed new dates in one meeting.",
        changed: ["Sarah heard it from us first", "Her board agreed new dates"],
        effect: { dims: { win: 2, deliver: 2 } },
        lesson: taught(IDEA_4, "We said what we could deliver, and paid for the people to deliver it."),
      },
      {
        id: "d8-weekends",
        tone: "mixed",
        headline: "Sarah has the real dates. My team has the weekends.",
        detail:
          "Because you told Sarah but asked our six to cover the gap at weekends, the board is calm. Two of my team have asked to come off Orion.",
        changed: ["Sarah heard it from us first", "Two of the team have asked to come off Orion"],
        effect: { dims: { deliver: -3 } },
        lesson: taught(IDEA_4, "We kept our word to Orion with time our team didn’t have."),
      },
    ],
    lesson: taught(IDEA_4, "Only the promises planned around Orion’s calendar held."),
    next: "calendar",
  },

  /**
   * The promise calendar comes due (D-086). Entering this beat settles every promise card the
   * player holds, in month order; the screen shows how each one landed.
   */
  {
    kind: "interlude",
    id: "calendar",
    role: "turn",
    chapter: 4,
    settle: true,
    eyebrow: "End of month five",
    title: "Every promise comes due",
    body: [
      "The summer sale is over, and the delivery calendar has played out.",
      "Each promise in your hand landed one of four ways: kept, late with Sarah’s agreement, broken, or traded away before it was owed.",
    ],
    prompt: "Here is how every promise we made came due.",
    next: "guess-4",
  },

  {
    kind: "interlude",
    id: "guess-4",
    role: "reflection",
    chapter: 4,
    advisor: AISHA,
    eyebrow: "Guess the cause",
    title: "What shaped month five",
    body: ["Before I tell you, take a guess. Nothing is scored."],
    prompt: "Which earlier choice do you think shaped month five most?",
    responses: [
      "Who we talked to in week one",
      "What we asked back on price",
      "Whether we moved the dates",
      "What we told Sarah",
    ],
    next: "deb-4",
  },

  {
    kind: "interlude",
    id: "deb-4",
    role: "chapter-debrief",
    chapter: 4,
    eyebrow: "Act four, closed",
    title: "What came due",
    body: ["Each promise came due: kept, late and agreed, or broken."],
    reveal: [
      "What decided it: the promises you made in decisions 5 to 7, whether you had planned around Marcus’s calendar (decisions 1 and 6), and what you told Sarah in month five (decision 8).",
      IDEA_4,
      "At work: every deadline you give, and every “yes, we can do that” said in a meeting.",
    ],
    next: "end",
  },

  { kind: "ending", id: "end" },
];

/* ───────────────────────── the promise ledger ───────────────────────── */

/**
 * How each promise card comes due (STORY-V2, "The promise ledger"), settled on entering the
 * `calendar` beat after month five. "Planned" is any of `got:ops_lead`, `dropped:shops`,
 * `dates:moved`. Late, agreed needs `told:sarah`. A broken card costs W−3 D−3 and sets
 * `promise:broken` unless the rule says otherwise.
 */
const promises: PromiseRule[] = [
  {
    flag: "promise:trial",
    due: "Month 2",
    dueMonth: 2,
    voidWhen: { all: ["dropped:trial"] },
    voided: "Traded away in decision 6.",
    keptWhen: { any: ["inside:orion", "bet:four", "dates:moved"] },
    kept: "Kept. Someone had checked the order records first.",
    broken: "Broken. It started in week twelve: the order records needed a month of cleaning, and nobody had checked them.",
  },
  {
    flag: "promise:refunds",
    due: "Month 5",
    dueMonth: 5,
    keptWhen: PLANNED,
    kept: "Kept. We had planned around the summer freeze.",
    lateWhen: { all: ["told:sarah"] },
    late: "Moved to month six, because you told Sarah early.",
    broken: "Broken. We didn’t plan for the summer freeze or warn Sarah. Refunds still take two weeks.",
  },
  {
    flag: "promise:screens",
    due: "Month 5",
    dueMonth: 5,
    keptWhen: { any: ["team:extra", "team:orion_pays"] },
    kept: "Kept, just: someone paid for the extra weeks it took.",
    lateWhen: { all: ["told:sarah"] },
    late: "Late, agreed: three shops done, the rest in month seven, because you told Sarah early.",
    broken: "Broken. Screens are in three shops. Nobody on our team had built one.",
  },
  {
    flag: "promise:app",
    due: "Month 5",
    dueMonth: 5,
    keptWhen: { any: ["team:extra", "team:orion_pays"] },
    kept: "Kept, just: someone paid for the extra weeks it took.",
    lateWhen: { all: ["told:sarah"] },
    late: "Late, agreed: a first version in month seven, because you told Sarah early.",
    broken: "Broken. The app is half built: nobody here had built one, and nobody was brought in who had.",
  },
  {
    /* Always kept: a fixed price is kept by definition. What the calendar shows is who paid
       for it. Asking Orion to pay is locked by this card, so the gap was covered by our
       margin or by the team's weekends. */
    flag: "promise:fixed",
    due: "Month 5",
    dueMonth: 5,
    kept: [
      { when: { all: ["team:extra"] }, text: "Kept. The contractors came out of our side." },
      { text: "Kept. Our team paid in weekends." },
    ],
  },
  {
    /* Two separate "one of" tests, which one condition cannot carry: Orion's own figures,
       and a plan for the freeze. */
    flag: "promise:results",
    due: "Month 5",
    dueMonth: 5,
    keptWhen: [{ all: ["promise:refunds"], any: ["inside:orion", "clue:complaints"] }, PLANNED],
    kept: "Kept, against Orion’s own complaint figures.",
    broken: "Broken. A fifth needed Orion’s figures, the refunds work and a plan for the freeze. A third of our fee went.",
    brokenEffect: { dims: { win: -3, profit: -4, deliver: -3 }, flags: ["promise:broken"] },
  },
  {
    /* A cost, not a broken promise: the clause fires, the money goes, and nothing is
       owed to anyone's trust. So no `promise:broken`. */
    flag: "promise:late_fee",
    due: "Month 5",
    dueMonth: 5,
    keptWhen: PLANNED,
    kept: "Not charged. Nothing in month five was late.",
    broken: "Charged: three weeks late, £60,000.",
    brokenEffect: { dims: { profit: -4 } },
  },
];

/* ───────────────────────── the endings ───────────────────────── */

/**
 * How the run ends (STORY-V2, "The endings", as amended). Checked in order; the last is
 * unconditional. Bars run from 0 to 100, and every threshold sits on a twenty-point boundary
 * so the sweep can see both sides of it.
 *
 * "We walked away" and "We kept our promises, and paid for it" are each two rules with one
 * title, because each is chosen by an either/or that one condition cannot say: walking from a
 * bad deal or a good one, and paying in margin or in weekends.
 */
const NEXT_YEAR = { when: { min: { win: 60 } }, text: "Sarah has asked us to bid for next year’s work." };

const endings: EndingRule[] = [
  {
    id: "lost",
    title: "Orion chose the cheaper firm",
    when: { all: ["award:lost"] },
    summary:
      "The rival is doing the shops. Both offers promised an app, so Declan compared only prices. An offer built on what happens after people buy would have given him something else to compare.",
  },
  {
    id: "walked-right",
    title: "We walked away",
    when: { all: ["walked"], any: ["promise:screens", "promise:app", "discount:full"] },
    summary: "It would have cost more than it paid. Walking away kept our word.",
    extras: [
      { when: { any: ["promise:screens", "promise:app"] }, text: "And it promised an app nobody here had built." },
      { when: { all: ["start:connector"] }, text: "Sarah will still take your call next year." },
    ],
  },
  {
    id: "walked-wrong",
    title: "We walked away",
    when: { all: ["walked"] },
    summary: "Aisha’s team could have kept those promises. The rival is doing the work, for less.",
  },
  {
    id: "broke",
    title: "We broke our promises",
    when: { all: ["signed", "promise:broken"] },
    summary:
      "In month six Sarah’s board paused the work: the second project like this Orion has stopped in two years. Each broken card shows the decision that made it.",
  },
  {
    id: "hid",
    title: "We kept the dates and hid the freeze",
    when: { all: ["signed", "kept:quiet"] },
    summary:
      "Every promise held, but Sarah heard about the freeze from Marcus, in front of her board. She checks every date we give her now.",
  },
  {
    id: "paid-thin",
    title: "We kept our promises, and paid for it",
    when: { all: ["signed"], max: { profit: 39 } },
    summary:
      "Every promise held, or moved with Sarah’s agreement. Northgate made little or nothing. The calendar shows where the cost came from.",
    extras: [{ when: { all: ["team:weekends"] }, text: "The team gave six weekends to keep it." }, NEXT_YEAR],
  },
  {
    id: "paid-weekends",
    title: "We kept our promises, and paid for it",
    when: { all: ["signed", "team:weekends"] },
    summary:
      "Every promise held, or moved with Sarah’s agreement. The team gave six weekends to keep it. The calendar shows where the cost came from.",
    extras: [NEXT_YEAR],
  },
  {
    id: "kept",
    title: "We kept our promises, and it paid",
    summary: "Every promise held, or moved with Sarah’s agreement, and the work paid for itself.",
    extras: [{ when: { all: ["got:second_year"] }, text: "The second year is already signed." }, NEXT_YEAR],
  },
];

/* ───────────────────────── where you stand ───────────────────────── */

/**
 * The record board's positions (D-086), in rail order. Each states a position in the
 * language of the work and never predicts an outcome; `LEDGER_RULE` in `presentation.ts`
 * files each one under one of the three questions.
 */
const ledger: LedgerRule[] = [
  /* How you got in. Exactly one always matches. */
  { when: { all: ["start:connector"] }, label: "You got in on trust", detail: "A friend introduced us. Nobody at Orion has yet asked what we can show.", tone: "neutral", icon: "talk" },
  { when: { all: ["start:builder"] }, label: "You got in on results", detail: "We have done this work before, and can show what changed.", tone: "neutral", icon: "layers" },
  { when: { all: ["start:challenger"] }, label: "You got in on the argument", detail: "We know who else is bidding, and we say the awkward thing.", tone: "neutral", icon: "scale" },
  /* What you know. */
  { when: { all: ["knows:after_sale"] }, label: "What’s really wrong", detail: "Customers are angry about deliveries, refunds and the helpline, not the shops.", tone: "good", icon: "search" },
  { when: { all: ["clue:complaints"] }, label: "The complaint figures", detail: "Half a million complaints a year, nearly all about what happens after people buy.", tone: "good", icon: "chart" },
  { when: { all: ["clue:marcus"] }, label: "Who runs deliveries", detail: "Marcus Reed runs Orion’s deliveries and warehouses.", tone: "good", icon: "people" },
  { when: { all: ["clue:declan"] }, label: "Who scores the bids", detail: "Declan Foyle buys for Orion and scores every bid.", tone: "neutral", icon: "scale" },
  { when: { all: ["clue:budget"] }, label: "What Orion will spend", detail: "A fixed budget of £2.6 million, and when it must be spent.", tone: "neutral", icon: "coins" },
  { when: { all: ["clue:rivals"] }, label: "Who else is bidding", detail: "Two other firms, and what each of them sells.", tone: "neutral", icon: "flag" },
  { when: { all: ["inside:orion"] }, label: "We’ve seen inside Orion", detail: "Two weeks with Orion’s order records, warehouses and helpline.", tone: "good", icon: "target" },
  /* Where you stand with Orion's people. */
  { when: { all: ["sarah:trusts"] }, label: "Sarah trusts us", detail: "She believes we understand her business.", tone: "good", icon: "check" },
  { when: { all: ["sarah:doubts"] }, label: "Sarah has doubts", detail: "She has not yet heard anything from us she didn’t already know.", tone: "bad", icon: "warning" },
  { when: { all: ["met:marcus"] }, label: "Marcus has met us", detail: "Orion’s Operations Director heard our plan before anything was written.", tone: "good", icon: "people" },
  { when: { all: ["met:declan"] }, label: "Declan has met us", detail: "Orion’s buyer has heard our case in person.", tone: "good", icon: "talk" },
  { when: { all: ["problem:after_sale"] }, label: "The bid: after the sale", detail: "Deliveries, refunds and the helpline: the part the rival’s demo leaves out.", tone: "good", icon: "flag" },
  { when: { all: ["problem:shops"] }, label: "The bid: the shops", detail: "Screens and an app, which the rival’s partner has built before.", tone: "bad", icon: "scale" },
  { when: { all: ["award:won"] }, label: "Orion chose us", detail: "The work is ours. Everything after this is about keeping what we said.", tone: "good", icon: "trophy" },
  { when: { all: ["declan:sore"] }, label: "Declan didn’t want us", detail: "Sarah overruled her own buyer, and he writes the contract.", tone: "bad", icon: "megaphone" },
  /* What you have spent, and what you got back. */
  { when: { all: ["bet:four"] }, label: "Four people on the bid", detail: "Two paying clients are short-staffed while we chase Orion.", tone: "neutral", icon: "people" },
  { when: { all: ["discount:half"] }, label: "£300,000 off our price", detail: "Less money to absorb a surprise.", tone: "bad", icon: "coins" },
  { when: { all: ["discount:full"] }, label: "£600,000 off our price", detail: "We matched the cheaper bid. Nothing is left to absorb a surprise.", tone: "bad", icon: "coins" },
  { when: { all: ["got:second_year"] }, label: "A second year, signed", detail: "Orion has signed for a second year of work.", tone: "good", icon: "check" },
  { when: { all: ["got:ops_lead"] }, label: "Marcus’s manager on our team", detail: "An Orion operations manager works with us full time.", tone: "good", icon: "people" },
  { when: { all: ["dropped:trial"] }, label: "The trial, traded away", detail: "The eight-week trial left the offer in exchange for the price.", tone: "neutral", icon: "cross" },
  { when: { all: ["dropped:shops"] }, label: "100 shops, not 210", detail: "The work rolls out to 100 shops first, in exchange for the price.", tone: "neutral", icon: "layers" },
  /* What you have promised. */
  { when: { all: ["promise:screens"] }, label: "Screens and an app promised", detail: "New screens in every shop and a new app, due by the end of month five.", tone: "neutral", icon: "clock" },
  { when: { all: ["promise:app"] }, label: "A new app promised", detail: "A new app, due by the end of month five. The shops stay as they are.", tone: "neutral", icon: "clock" },
  { when: { all: ["promise:refunds"] }, label: "Refunds in five days promised", detail: "Deliveries, refunds and the helpline, fixed together by the end of month five.", tone: "neutral", icon: "clock" },
  { when: { all: ["promise:trial"] }, label: "A trial by week eight", detail: "Ten shops trying it within eight weeks of signing.", tone: "neutral", icon: "block" },
  { when: { all: ["promise:fixed"] }, label: "The price won’t change", detail: "If the work needs more than planned, the extra comes out of our side.", tone: "neutral", icon: "coins" },
  { when: { all: ["promise:results"] }, label: "A third of our fee on results", detail: "We are paid in full only if complaints fall by a fifth by month five.", tone: "neutral", icon: "coins" },
  { when: { all: ["promise:late_fee"] }, label: "£20,000 a week if we’re late", detail: "The contract charges us £20,000 for every week we are late.", tone: "neutral", icon: "clock" },
  { when: { all: ["dates:moved"] }, label: "Every date a month later", detail: "The contract’s dates moved back a month, and Declan took £100,000 off.", tone: "good", icon: "clock" },
  { when: { all: ["signed"] }, label: "A signed contract", detail: "Every promise in the offer now has a date in the contract.", tone: "neutral", icon: "check" },
  /* Month five. */
  { when: { all: ["told:sarah"] }, label: "Sarah heard it from us", detail: "We told Sarah which dates would slip before anyone else did.", tone: "good", icon: "talk" },
  { when: { all: ["kept:quiet"] }, label: "Sarah wasn’t told", detail: "We worked on quietly and told Sarah nothing about the freeze.", tone: "bad", icon: "warning" },
  { when: { all: ["team:weekends"] }, label: "The team on weekends", detail: "Our six people are covering the gap, six weekends in a row.", tone: "bad", icon: "people" },
  { when: { all: ["team:extra"] }, label: "Two contractors, at our cost", detail: "Two people hired for two months, paid for by us.", tone: "neutral", icon: "people" },
  { when: { all: ["team:orion_pays"] }, label: "Orion pays for extra weeks", detail: "Sarah agreed to pay for the extra weeks of work.", tone: "good", icon: "coins" },
  { when: { all: ["promise:broken"] }, label: "A promise broken", detail: "At least one promise came due and was not kept.", tone: "bad", icon: "cross" },
];

/* ───────────────────────── the causal threads ───────────────────────── */

/**
 * "Because you did this, later that happened", for the ending. Each joins two outcomes on the
 * script's own causal chain, and each is said in the words the two outcomes already use, so
 * the ending repeats a cause the player has heard rather than inventing one.
 */
const threads: CausalThreadRule[] = [
  {
    needsOutcomes: ["d1-solved", "d2-trusted"],
    because: "In week one you read the complaints and spent a day in the warehouse.",
    soLater: "In the first meeting Sarah heard her own business described from outside, and trusted us.",
  },
  {
    needsOutcomes: ["d1-complaints", "d2-trusted"],
    because: "In week one you read a year of Orion’s complaints.",
    soLater: "In the first meeting you could show Sarah her own figures, and she trusted us.",
  },
  {
    needsOutcomes: ["d1-warehouse", "d2-trusted"],
    needsFlags: ["met:marcus"],
    because: "In week one you spent a day with Orion’s delivery managers.",
    soLater: "You could bring Marcus Reed to the first meeting, and Sarah trusted what he backed.",
  },
  {
    needsOutcomes: ["d1-sarahs-version", "d2-brief"],
    because: "You spent week one on Sarah’s version of the problem.",
    soLater: "In the first meeting you had nothing new to tell her, and she wrote nothing down.",
  },
  {
    needsOutcomes: ["d2-trusted", "d3-paid"],
    because: "Sarah left the first meeting trusting us.",
    soLater: "She paid for two weeks inside Orion, so finding out cost her money, not ours.",
  },
  {
    needsOutcomes: ["d2-brief", "d4-silence"],
    because: "You opened the first meeting with what Sarah had already asked for.",
    soLater: "When the rival showed its demo, Sarah’s board judged us on the rival’s terms.",
  },
  {
    needsOutcomes: ["d4-reframed", "d6-held"],
    because: "You showed Sarah what the rival’s demo leaves out, with proof she could check.",
    soLater: "When Declan pushed on price, he had a reason to write down, and Orion chose us at full price.",
  },
  {
    needsOutcomes: ["d3-paid", "d5-results-measured"],
    because: "Orion paid for two weeks inside its own business.",
    soLater: "You could tie a third of the fee to complaints, because you knew where the figures started.",
  },
  {
    needsOutcomes: ["d5-new-work", "d6-lost"],
    because: "You put an app in the offer, as the rival had.",
    soLater: "Declan could only compare prices, and Orion chose the cheaper firm.",
  },
  {
    needsOutcomes: ["d6-traded", "d8-planned"],
    needsFlags: ["got:ops_lead"],
    because: "You traded a price cut for one of Marcus’s managers.",
    soLater: "In month two he warned us about the summer freeze, and in month five the board kept every date.",
  },
  {
    needsOutcomes: ["d6-gave", "d8-thin"],
    because: "You cut the price to £2 million and asked for nothing back.",
    soLater: "In month five the contractors came out of a contract that was already thin.",
  },
  {
    needsOutcomes: ["d6-gave", "d7-walk-right"],
    needsFlags: ["discount:full"],
    because: "You cut the price to £2 million and asked for nothing back.",
    soLater: "Signing would have meant promising what we couldn’t keep, so walking away kept our word.",
  },
  {
    needsOutcomes: ["d6-overruled", "d7-signed"],
    because: "You held the price with nothing Declan could write down.",
    soLater: "Declan wrote the contract himself, with a late charge he would not discuss.",
  },
  {
    needsOutcomes: ["d5-two-gifts", "d8-weekends"],
    because: "You promised a fast trial at a fixed price.",
    soLater: "When month five slipped, Orion could not be asked to pay, and the team gave its weekends.",
  },
];

export const story: Content = {
  startNodeId: "setup",
  missionOrder: ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"],
  threads,
  promises,
  endings,
  ledger,
  chapters: [
    {
      number: 1,
      label: "Understand",
      title: "Understand before you offer",
      idea: IDEA_1,
      missionIds: ["d1", "d2"],
      steps: ["Find what is really wrong", "The first meeting"],
    },
    {
      number: 2,
      label: "Worth it?",
      title: "Not every deal is worth winning",
      idea: IDEA_2,
      missionIds: ["d3", "d4"],
      steps: ["How much do we bet?", "The rival’s demo"],
    },
    {
      number: 3,
      label: "Trade",
      title: "Trade, don’t give",
      idea: IDEA_3,
      missionIds: ["d5", "d6"],
      steps: ["Build the offer", "The price push"],
    },
    {
      number: 4,
      label: "Deliver",
      title: "Promise only what your team can deliver",
      idea: IDEA_4,
      missionIds: ["d7", "d8"],
      steps: ["Sign or walk", "Month five"],
    },
  ],
  nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
};
