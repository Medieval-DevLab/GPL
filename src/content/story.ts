/**
 * GPL — the story.
 *
 * Ten missions, five chapters, one client engagement from first contact to delivery.
 *
 * AUTHORING RULES (enforced by validate.ts, so breaking one fails the build):
 *  · No option is "the right answer". The same move lands differently depending on what
 *    the player knows and what they already committed to.
 *  · `commits`, `pros`, `cons` and `cost` describe the APPROACH and what it costs.
 *    They may never predict the result.
 *  · Every outcome list ends with an unconditional fallback.
 *  · Every mission carries a lesson, so the objective lands on whichever branch is taken.
 *  · No dead ends. Every path reconverges on the next mission.
 *
 * ON LENGTH. Everything the player reads BEFORE deciding is on a word budget (see
 * BUDGET in validate.ts) and the build fails if it is exceeded. Pros and cons are
 * tags, not sentences. A situation is a setup, not a chapter. The briefing is scanned.
 * Outcome prose is deliberately NOT budgeted — the consequence screen has nothing else
 * on it, and that text is the actual teaching.
 *
 * THE SPINE OF COMPOUNDING — what the player learns early changes what happens late:
 *    knows:ops_constraint  → M6 credibility, M7 the workstream that saves delivery, M9, M10
 *    knows:real_pain       → M3 lands, M6 defensible rather than lucky
 *    scope:heavy           → M9 risk severity, M10 crisis
 *    promised:fast         → M9 risk, M10 crisis
 *    discounted            → M10 no budget left to fix anything
 */

import type { Advisor, ClientProfile, Content, GameNode } from "../engine/types";

/* ───────────────────────── recurring cast ───────────────────────── */

/**
 * Your colleagues.
 *
 * Every piece of advice in this game comes from one of these people, by name, with a
 * job and a stake of their own. Nothing in the interface tells the player what to
 * think — you are a first-time pursuit lead, and a colleague briefing you is onboarding
 * rather than lecturing (see docs/STRATEGY.md D1). `steer` is their practical view on
 * the mission at hand; it used to be an unattributed "Tip" in a box.
 *
 * Riya appears in two chapters on purpose. A team the player recognises is continuity;
 * a different face every chapter is decoration.
 */

const PRIYA: Advisor = {
  name: "Priya Sharma",
  role: "Client Growth Lead",
  photo: "portrait-priya",
  quote: "Three names on the table, one team. We don't get to chase all of them.",
};

const RIYA: Advisor = {
  name: "Riya Kapoor",
  role: "Engagement Director",
  photo: "portrait-riya",
  quote: "Not every lead is the right opportunity. Decide early where your people go.",
};

const ARJUN: Advisor = {
  name: "Arjun Mehta",
  role: "Solutions Director",
  photo: "portrait-arjun",
  quote: "Whatever we write down, somebody has to build. I'd rather promise less and mean it.",
};

const RIYA_DEAL: Advisor = {
  name: "Riya Kapoor",
  role: "Engagement Director",
  photo: "portrait-riya",
  quote: "Every concession on price is a concession on what we can do when something breaks.",
};

const AISHA: Advisor = {
  name: "Aisha Khan",
  role: "Delivery Lead",
  photo: "portrait-aisha",
  quote: "My team inherits every sentence in that proposal. Which ones did you mean?",
};

const ORION: ClientProfile = {
  name: "Orion Retail Group",
  monogram: "OR",
  tags: ["Retail", "210 stores", "National"],
  blurb: "Wants to “improve the customer experience”. Nobody has said what that means.",
  image: "thumb-retail-store",
  facts: [
    { icon: "chart", label: "Potential value", value: "High" },
    { icon: "clock", label: "Timeline", value: "6–12 months" },
    { icon: "people", label: "Decision makers", value: "Multiple, unmapped" },
  ],
};

const nodes: GameNode[] = [
  /* ══════════════════════════ CHAPTER 0 ══════════════════════════ */

  /**
   * The starting advantage — the only setup stage in the game.
   *
   * PRD p. 55: "Starting with a 'beginning state' is much stronger than starting with
   * a tutorial." p. 56: the player should feel "these are our starting strengths."
   *
   * Each advantage grants a flag that real conditions later read, so the choice keeps
   * mattering — a Connector walks into the competitor mission already able to hold
   * their nerve; a Builder can offer an outcome-based deal because they can measure it.
   */
  {
    kind: "setup",
    id: "setup",
    eyebrow: "Before you start",
    title: "What kind of team is this?",
    body: [
      "You have been handed your first client to win, and six people to do it with.",
      "Every team is good at something and short somewhere else. Pick what yours is good at — it will still be true in month five.",
    ],
    question: "What is your team's strength?",
    options: [
      {
        id: "s-connector",
        title: "Connectors",
        icon: "talk",
        image: "approach-networking",
        description: "You know people, and people take your call.",
        strengths: ["Trusted early", "Doors open"],
        tradeoff: "You are better at getting in the room than at proving what you can build.",
        flags: ["start:connector", "credibility"],
        dims: { win: 8 },
      },
      {
        id: "s-builder",
        title: "Builders",
        icon: "layers",
        image: "solution-in-store-tech",
        description: "You have delivered this kind of work, and it shows.",
        strengths: ["Evidence to hand", "Delivery is real"],
        tradeoff: "You are better at showing the work than at selling it.",
        flags: ["start:builder", "has:data"],
        dims: { deliver: 8 },
      },
      {
        id: "s-challenger",
        title: "Challengers",
        icon: "scale",
        image: "hero-boardroom",
        description: "You read the market, and you say the awkward thing.",
        strengths: ["Know the field", "Say the hard thing"],
        tradeoff: "You are better at reading the field than at being trusted inside it.",
        flags: ["start:challenger", "knows:rivals"],
        dims: { profit: 8 },
      },
    ],
    next: "int-1",
  },

  /* ══════════════════════════ CHAPTER 1 ══════════════════════════ */
  {
    kind: "interlude",
    id: "int-1",
    chapter: 1,
    eyebrow: "Chapter One",
    title: "Find the client",
    body: [
      "You have joined the team that finds and wins new work.",
      "Nobody is going to tell you which opportunity is the good one. That is the job.",
    ],
    next: "m1",
  },

  {
    kind: "choice",
    id: "m1",
    chapter: 1,
    stage: "client",
    title: "Three organisations, one team",
    eyebrow: "The situation",
    objective: "Decide where your team spends this quarter.",
    minutes: 3,
    hero: "hero-boardroom",
    situation: [
      "Three organisations want a partner. You can properly pursue one.",
      "You know what each says it wants. You do not know what any of them needs.",
    ],
    context: [
      { label: "Your team", value: "6 people" },
      { label: "Pursuits you can run", value: "One" },
    ],
    advisor: PRIYA,
    consider: [
      "Which needs something we can already prove?",
      "What would Apex need to see to shortlist us?",
      "What does being wrong cost us?",
    ],
    tip: "I put Meridian forward last year and it never closed. I would still take it.",
    prompt: "One team, one pursuit. Three very different bets.",
    question: "Who do you go after?",
    options: [
      {
        id: "o-northwind",
        title: "Orion Retail",
        icon: "target",
        image: "client-retail-store",
        description: "210 stores, real budget, vague timeline. You have done work shaped like this.",
        commits: "A crowded field — two other firms are already talking.",
        pros: ["Close to proven work", "Budget looks real"],
        cons: ["Two rivals ahead of you"],
        cost: { time: 2, investment: 2 },
        outcomes: [
          {
            id: "m1-nw",
            tone: "strong",
            headline: "You are in the conversation early.",
            detail:
              "Orion takes the meeting. Your previous work is close enough to what they are asking for that you do not have to explain why you are in the room.",
            changed: ["Orion is now your active pursuit", "You are early, not chasing"],
            effect: { dims: { win: 6, profit: 2 }, flags: ["client:northwind"] },
          },
        ],
      },
      {
        id: "o-apex",
        title: "Apex Industrial",
        icon: "layers",
        image: "client-energy-turbines",
        description:
          "The biggest number on the table. Needs industrial engineering your team does not have.",
        commits: "Stretches the team past anything it has delivered.",
        pros: ["Largest opportunity", "Builds new capability"],
        cons: ["No comparable references", "Six weeks committed"],
        cost: { time: 3, investment: 3 },
        outcomes: [
          {
            id: "m1-apex-read",
            when: { any: ["start:challenger", "knows:rivals"] },
            tone: "mixed",
            headline: "You knew the field, so you knew what to lead with.",
            detail:
              "Apex still shortlists on industrial depth and you still do not have it. But you went in knowing that, led with the partner you would bring, and left with a name to call in eighteen months rather than a polite no.",
            changed: [
              "Six weeks spent deliberately",
              "Orion is your pursuit",
              "Apex will take your call next cycle",
            ],
            effect: {
              dims: { win: -4, profit: -2, deliver: 6 },
              flags: ["client:northwind", "late_start", "knows:rivals"],
            },
          },
          {
            id: "m1-apex",
            tone: "hard",
            headline: "Apex shortlists on industrial depth. You are not on the list.",
            detail:
              "They ask for three comparable references. You have none. The meeting is polite and short. Six weeks are gone, and Orion — still open — has been talking to your competitors the whole time.",
            changed: [
              "You lost six weeks",
              "Orion is now your pursuit, but you are late to it",
              "The team came back knowing the competitive field far better",
            ],
            effect: {
              dims: { win: -8, profit: -3, deliver: 6 },
              flags: ["client:northwind", "late_start", "knows:rivals"],
            },
            lesson: {
              principle: "The biggest opportunity is not automatically the best one.",
              because:
                "Apex was worth more than Orion on paper. But value you cannot credibly go after is not value available to you.",
              watchFor:
                "Before size, ask: is there a real overlap between what they need and what we can actually prove?",
            },
          },
        ],
      },
      {
        id: "o-meridian",
        title: "Meridian Health",
        icon: "shield",
        image: "client-health-campus",
        description: "Patient engagement. Smaller, fast-moving, and healthcare procurement is slow.",
        commits: "Long and unpredictable approval cycles.",
        pros: ["Ambitious client", "A sector you want"],
        cons: ["Procurement may stall", "Smallest today"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m1-mer",
            tone: "mixed",
            headline: "Meridian stalls in procurement. You park it.",
            detail:
              "The team likes you. The process does not move. After a month of effort you make the call to park Meridian and pick up Orion, which is still live.",
            changed: [
              "A month of effort spent with nothing to show",
              "You stopped before it became a sunk cost",
              "Orion becomes your pursuit, with your capacity intact",
            ],
            effect: {
              dims: { profit: -5, win: -2, deliver: 4 },
              flags: ["client:northwind", "spent_effort"],
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "Fit is where what they need overlaps what you can prove.",
      because:
        "Every one of those three was a real opportunity. They were not equally real for your team, with your people, this quarter.",
      watchFor: "When something looks too good to pass up, check whether you could actually win it.",
    },
    next: "m2",
  },

  {
    kind: "investigate",
    id: "m2",
    chapter: 1,
    stage: "client",
    title: "Before you say anything",
    eyebrow: "Understand the client",
    objective: "Work out what you need to know first.",
    minutes: 4,
    hero: "hero-storefront-wide",
    situation: [
      "Orion's brief is one line: “improve the customer experience across our stores”.",
      "You can dig into two things. Not five. Choosing what to ignore is the job.",
    ],
    client: ORION,
    advisorLine: "I would rather go in knowing one awkward thing than five comfortable ones.",
    advisor: PRIYA,
    consider: [
      "What could change our mind?",
      "Who has not been in the room, and why?",
      "Is the ask the same as the problem?",
    ],
    tip: "I would spend one on the money. My last three deals died in procurement, not the pitch.",
    prompt: "You have time for two. Choose what could change your mind.",
    question: "What do you look into?",
    slots: 2,
    evidence: [
      {
        id: "ev-pain",
        label: "The complaints",
        question: "What are customers actually unhappy about?",
        reveals:
          "Store experience barely registers. The complaints are overwhelmingly post-purchase — deliveries that arrive late, returns that take three weeks, support that cannot see the order. The shop floor is not the problem.",
        flags: ["knows:real_pain"],
      },
      {
        id: "ev-sponsor",
        label: "The decision",
        question: "Who is driving this, and who can stop it?",
        reveals:
          "Sarah Lim, the Chief Transformation Officer, is sponsoring it and owns the budget. But every system that would have to change sits under Marcus Reed, the Operations Director, who has not been in a single meeting so far.",
        flags: ["knows:ops_constraint"],
      },
      {
        id: "ev-rivals",
        label: "The competition",
        question: "Who else is in the room?",
        reveals:
          "Two other firms. One is well ahead and pitching a storefront redesign — new app, new in-store screens, strong visuals.",
        flags: ["knows:rivals"],
      },
      {
        id: "ev-budget",
        label: "The money",
        question: "What is the budget, and what is the deadline?",
        reveals:
          "The budget is real and fixed — there is no more behind it. The board has been promised visible improvement inside twelve months.",
        flags: ["knows:budget"],
      },
      {
        id: "ev-history",
        label: "The last attempt",
        question: "Have they tried this before?",
        reveals:
          "Two years ago. A similar programme was cancelled at month five after Operations refused to take the changes into their release schedule. Nobody mentions it unprompted.",
        flags: ["knows:history", "knows:ops_constraint"],
      },
    ],
    outcomes: [
      {
        id: "m2-both",
        when: { all: ["knows:real_pain", "knows:ops_constraint"] },
        tone: "strong",
        headline: "You now understand this account better than the people pitching it.",
        detail:
          "You know the pain is post-purchase, not in-store. And you know that whatever gets proposed has to survive an Operations Director who has not been asked yet. Neither of those is in the brief.",
        changed: ["You can talk about their real problem", "You know who can quietly kill this"],
        effect: { dims: { win: 8, deliver: 6 }, badge: "good_question" },
      },
      {
        id: "m2-ops",
        when: { all: ["knows:ops_constraint"] },
        tone: "strong",
        headline: "You have found the person who can stop this.",
        detail:
          "Sarah holds the budget, but Operations holds the systems. Most teams pitching this account will not discover that until they are already committed to a shape of solution.",
        changed: ["You know where the real constraint sits"],
        effect: { dims: { deliver: 7, win: 3 }, badge: "good_question" },
      },
      {
        id: "m2-pain",
        when: { all: ["knows:real_pain"] },
        tone: "strong",
        headline: "You have found the real problem.",
        detail:
          "They asked about the store experience. The evidence says the damage is happening after the sale. That gap between the stated request and the actual problem is where the work is.",
        changed: ["You know what is actually hurting them"],
        effect: { dims: { win: 7, profit: 2 }, badge: "good_question" },
      },
      {
        id: "m2-surface",
        tone: "mixed",
        headline: "Useful, but you are still working from their version of the problem.",
        detail:
          "What you looked at was worth knowing. It just was not the thing that decides this deal. You will go into the first conversation with their framing rather than your own.",
        changed: [
          "You know more than you did",
          "You are still describing the problem in their words",
        ],
        effect: { dims: { win: 2 } },
        lesson: {
          principle: "The most valuable question is usually the one nobody has asked yet.",
          because:
            "Competitive and budget information tells you about the race. It does not tell you what is actually wrong, or who has to agree before anything can change.",
          watchFor: "Ask yourself who has not been in the room — and why.",
        },
      },
    ],
    lesson: {
      principle: "Decide what you need to know before you decide what to do.",
      because:
        "You were never going to get all five. Choosing which two mattered was the real decision, and you made it before you knew the answers.",
      watchFor:
        "Marcus Reed was in none of the five cards you could open. That is usually where the constraint is.",
    },
    next: "m3",
  },

  {
    kind: "choice",
    id: "m3",
    chapter: 1,
    stage: "lead",
    title: "Getting in the room",
    eyebrow: "First contact",
    objective: "Turn a name on a list into a conversation.",
    minutes: 3,
    hero: "hero-retail-plaza",
    situation: [
      "Orion is open to talking to partners. You get roughly one shot at a first impression worth following up.",
    ],
    client: ORION,
    advisorLine: "First contact sets what they think we are. It is very hard to move afterwards.",
    advisor: PRIYA,
    consider: [
      "Do we need attention, access, or credibility?",
      "Who exactly are we trying to move?",
      "Would this work if we knew nothing about them?",
    ],
    tip: "Sarah will not read a white paper. Her deputy will, and he writes her briefings.",
    prompt: "Match the approach to what you need from the next conversation.",
    question: "How do you approach them?",
    options: [
      {
        id: "o-pov",
        title: "Publish a point of view",
        icon: "spark",
        image: "approach-networking",
        description: "A short, specific piece on what is going wrong for retailers like them.",
        commits: "Real preparation time before anything happens.",
        pros: ["Shows you know their world", "Reaches several people"],
        cons: ["Limited by what you know", "Slowest to land"],
        cost: { time: 3, investment: 1 },
        outcomes: [
          {
            id: "m3-pov-hit",
            when: { all: ["knows:real_pain"] },
            tone: "strong",
            headline: "Sarah forwards it internally with one line: “this is us”.",
            detail:
              "Because you wrote about post-purchase rather than storefronts, it read as though you had already been inside the business. You are invited in — and asked to bring it to Operations as well.",
            changed: [
              "You are in, on your framing rather than theirs",
              "Operations is now in the room",
            ],
            effect: {
              dims: { win: 10, deliver: 4 },
              flags: ["ops_engaged", "credibility"],
              badge: "connected_dots",
            },
          },
          {
            id: "m3-pov-miss",
            tone: "mixed",
            headline: "Well made, slightly off target.",
            detail:
              "It is a good piece of work and it gets read. But it argues about the store experience, which is the thing they already believe, so it reads as agreement rather than insight. You get a meeting, not an advocate.",
            changed: [
              "You have a first meeting",
              "You have not said anything they did not already think",
            ],
            effect: { dims: { win: 4 } },
          },
        ],
      },
      {
        id: "o-direct",
        title: "Go straight to the sponsor",
        icon: "talk",
        image: "approach-one-to-one",
        description: "A warm introduction, thirty minutes with the sponsor, the case made in person.",
        commits: "Spends a relationship you cannot spend twice.",
        pros: ["Fastest to the budget holder", "A real conversation"],
        cons: ["Burns your introduction", "One stakeholder's view"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m3-direct-informed",
            when: { all: ["knows:ops_constraint"] },
            tone: "strong",
            headline: "You ask the question nobody else has asked.",
            detail:
              "Halfway through you ask who owns the systems that would have to change. Sarah pauses, and says that is a fair question. You leave with a second meeting that includes Operations.",
            changed: ["You are trusted early", "Operations is now in the room"],
            effect: { dims: { win: 8, deliver: 5 }, flags: ["ops_engaged", "credibility"] },
          },
          {
            id: "m3-direct-blind",
            tone: "mixed",
            headline: "Sarah is enthusiastic. Then adds a condition.",
            detail:
              "It goes well right up to the last minute, when Sarah says: “you will need Operations comfortable with this before we can move.” You had not planned for a second stakeholder, and now you are learning about them late.",
            changed: [
              "You have the sponsor's interest",
              "You have discovered a second decision-maker, late",
            ],
            effect: {
              dims: { win: 6, deliver: -3 },
              flags: ["knows:ops_constraint", "learned_late"],
            },
          },
        ],
      },
      {
        id: "o-campaign",
        title: "Run a broad campaign",
        icon: "megaphone",
        image: "approach-billboard",
        description: "Put a retail transformation campaign into the market and let interest come.",
        commits: "Reaches many people, few of whom decide anything.",
        pros: ["Cheapest by far", "Senior people stay free"],
        cons: ["Impersonal", "Few will be buyers"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m3-campaign",
            tone: "mixed",
            headline: "Plenty of interest. Very little of it from Orion.",
            detail:
              "The campaign performs well by every measure you would put in a report. It generates conversations with people who are interested but cannot buy, and one lukewarm reply from a Orion manager two levels below the sponsor.",
            changed: [
              "A lot of activity",
              "Barely any progress on the account you chose",
              "Your senior people stayed free for other work",
            ],
            effect: { dims: { win: 1, profit: 3 } },
            lesson: {
              principle: "Reach and relevance are not the same thing.",
              because:
                "You reached more people than either alternative would have. None of them was the person who decides.",
              watchFor:
                "Before choosing a channel, name the single person you need to move — then ask whether this reaches them.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "Match the approach to what you are trying to achieve.",
      because:
        "Broad reach, direct access and a sharp point of view are three different tools. Which one is right depends on whether you need attention, a decision, or credibility.",
      watchFor: "Ask what you actually need from the next conversation before choosing how to start it.",
    },
    next: "int-2",
  },

  /* ══════════════════════════ CHAPTER 2 ══════════════════════════ */
  {
    kind: "interlude",
    id: "int-2",
    chapter: 2,
    eyebrow: "Chapter Two",
    title: "Make it an opportunity",
    body: [
      "You have their attention. That is not the same as having a deal.",
      "Interest becomes an opportunity when someone is willing to spend money, and you are willing to spend effort.",
    ],
    milestone: "Lead generated",
    next: "m4",
  },

  {
    kind: "choice",
    id: "m4",
    chapter: 2,
    stage: "opportunity",
    title: "Is this real?",
    eyebrow: "Opportunity assessment",
    objective: "Decide how much of your team to commit.",
    minutes: 4,
    hero: "hero-retail-exterior",
    situation: [
      "Orion wants a proposal. Writing a serious one occupies several people for weeks, with no guarantee at the end.",
      "All of this is still their version of the problem.",
    ],
    client: ORION,
    // Icon tone comes from what the factor MEANS: a real need and real value are good
    // news, an undefined brief and two rivals are cautions.
    assessment: [
      {
        icon: "flag",
        label: "Client need",
        level: "high",
        tone: "good",
        note: "Something is wrong, and they have said so.",
      },
      {
        icon: "target",
        label: "Our fit",
        level: "medium",
        tone: "warn",
        note: "Close to past work, but the brief is undefined.",
      },
      {
        icon: "people",
        label: "Competition",
        level: "medium",
        tone: "bad",
        note: "Two firms actively in the conversation.",
      },
      {
        icon: "chart",
        label: "Value",
        level: "high",
        tone: "good",
        note: "Multi-year, if the first phase works.",
      },
    ],
    advisor: RIYA,
    consider: [
      "What does being wrong cost us?",
      "Do we know enough to price it?",
      "Is there a smaller version to commit to?",
    ],
    tip: "I have qualified two of these off a one-line brief. One paid for the year.",
    prompt: "Weigh the value against what you would risk to chase it.",
    question: "How do you take this forward?",
    options: [
      {
        id: "o-pursue",
        title: "Commit and go for it",
        icon: "rocket",
        description: "Put your best people on it and write the full proposal now.",
        commits: "Your strongest team, unavailable for weeks.",
        pros: ["Fastest to a proposal", "Signals real intent"],
        cons: ["Best people locked up", "Pricing an undefined brief"],
        cost: { time: 3, investment: 3 },
        outcomes: [
          {
            id: "m4-pursue-good",
            when: { any: ["knows:real_pain", "credibility"] },
            tone: "strong",
            headline: "You move faster than anyone else in the race.",
            detail:
              "Because you already understand the problem, committing early is a bet on something you can see rather than a hope. You are the first firm with a substantive proposal in front of them.",
            changed: [
              "You set the terms of the conversation",
              "Your best people are now fully committed",
            ],
            effect: { dims: { win: 8, profit: -4 } },
          },
          {
            id: "m4-pursue-blind",
            tone: "mixed",
            headline: "You are committed, and you are still guessing.",
            detail:
              "The team is working hard on a proposal built from a one-line brief. Every assumption in it is yours, not theirs, and several of them are going to be wrong.",
            changed: ["Significant effort committed", "Built on assumptions you have not tested"],
            effect: { dims: { win: 4, profit: -6, deliver: -3 } },
          },
        ],
      },
      {
        id: "o-workshop",
        title: "Propose a paid discovery",
        icon: "search",
        description: "Two weeks of structured work to define the problem, programme to follow.",
        commits: "Slower, and a rival may propose meanwhile.",
        pros: ["Gets you inside", "Paid learning"],
        cons: ["Much smaller first number", "Rivals can move"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m4-workshop-blind",
            when: { none: ["knows:real_pain", "knows:ops_constraint", "has_access"] },
            tone: "mixed",
            headline: "They agree, and you spend two weeks learning what you could have asked.",
            detail:
              "A paid discovery is the right instrument. Pointed at a business you have not examined at all, the first week goes on questions you could have answered from the outside, and the second on the ones that actually mattered.",
            changed: ["A smaller, safer first commitment", "Half the discovery spent catching up"],
            effect: {
              dims: { profit: 3, deliver: 4, win: -2 },
              flags: ["landed_small", "has_access"],
            },
          },
          {
            id: "m4-workshop",
            tone: "strong",
            headline: "They agree — and you get paid to learn.",
            detail:
              "Orion accepts. It is a smaller first number than anyone hoped for, but you now have access, budget and permission to look at the parts of the business nobody was going to show you in a sales meeting.",
            changed: [
              "A smaller, safer first commitment",
              "Real access to the business",
              "Your assumptions get tested before they go in a contract",
            ],
            effect: {
              dims: { profit: 6, deliver: 8, win: -2 },
              flags: ["landed_small", "has_access"],
              badge: "smart_tradeoff",
            },
          },
        ],
      },
      {
        id: "o-decline",
        title: "Decline the full programme",
        icon: "block",
        description: "Say honestly that nobody could price this brief responsibly yet.",
        commits: "You may be remembered as the firm that said no.",
        pros: ["Protects people and margin", "Judgement they remember"],
        cons: ["Momentum goes elsewhere", "May read as reluctance"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m4-decline",
            tone: "mixed",
            headline: "They are surprised. Then they come back.",
            detail:
              "Turning down work you cannot scope is a defensible thing to do, and it registers. Two weeks later Sarah calls back with a narrower ask and a more honest description of the problem — but you have lost momentum against the firm that just said yes.",
            changed: [
              "Your judgement is taken seriously",
              "A narrower, better-defined opportunity",
              "You lost ground to a faster competitor",
            ],
            effect: { dims: { profit: 7, deliver: 5, win: -7 }, flags: ["landed_small"] },
            lesson: {
              principle: "Saying no to the wrong shape of work is a real option.",
              because:
                "Declining cost you momentum and bought you a better-defined problem. Whether that trade was right depends on how badly you needed the win.",
              watchFor: "Notice when you are bidding on something nobody has actually defined yet.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "Not every lead deserves the same amount of your team.",
      because:
        "Qualifying is deciding how much to risk before you know whether you will win. Commit too early and you spend your best people on a guess; commit too late and someone else is already in front of the client.",
      watchFor: "Six weeks of your best people is the most expensive thing you can spend without approval.",
    },
    next: "m5",
  },

  {
    kind: "choice",
    id: "m5",
    chapter: 2,
    stage: "opportunity",
    title: "Someone else moves",
    eyebrow: "Market response",
    objective: "React to a competitor changing the race.",
    minutes: 4,
    hero: "hero-client-meeting",
    situation: [
      "A rival announces a partnership with a well-known retail technology vendor. Press release, launch event, glossy storefront demo.",
      "Your sponsor forwards it with four words: “should we be worried?”",
    ],
    saidQuote: {
      text: "We like your perspective, but this looks impressive and my board has already seen it. Help me understand how you are different.",
      attribution: "Sarah Lim · Chief Transformation Officer, Orion Retail",
    },
    concerns: [
      "A recognisable vendor name attached",
      "A demo that is easy to show a board",
      "Your difference has not been stated plainly",
    ],
    advisorLine: "Something changed in the market. Whether it changed anything real is your call.",
    advisor: RIYA,
    consider: [
      "What changed — the facts, or the noise?",
      "Can we name what their offer misses?",
      "What does silence cost us?",
    ],
    tip: "I have seen three of these announcements. Two of them never shipped anything.",
    prompt: "Decide whether the facts changed, or only the noise.",
    question: "What do you do?",
    options: [
      {
        id: "o-investigate-rival",
        title: "Find out what they offered",
        icon: "search",
        description: "Understand what is really on the table before reacting.",
        commits: "Several days while the client waits.",
        pros: ["Respond to facts", "Finds the gap"],
        cons: ["Client is waiting", "Days you cannot recover"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m5-inv-known",
            when: { all: ["knows:rivals"] },
            tone: "strong",
            headline: "You already knew their angle. Now you know its limit.",
            detail:
              "The partnership is a storefront platform. It is genuinely good at what it does, and it does nothing about deliveries, returns or support. You can say so precisely, because you did the work earlier.",
            changed: ["You can name exactly what their offer does not cover"],
            effect: { dims: { win: 7 }, flags: ["knows:rival_gap"], badge: "connected_dots" },
          },
          {
            id: "m5-inv-new",
            tone: "mixed",
            headline: "You learn what it is, a little late.",
            detail:
              "It is a storefront platform, and it does not touch the operational side. Useful to know. The delay in answering cost you some of Sarah's confidence — she wanted a view, not a research project.",
            changed: [
              "You understand the rival's offer",
              "You looked slow at a moment that needed conviction",
            ],
            effect: { dims: { win: 2 }, flags: ["knows:rival_gap"] },
          },
        ],
      },
      {
        id: "o-accelerate",
        title: "Get in front of them now",
        icon: "rocket",
        description: "Book the meeting and make your case before the story settles.",
        commits: "Presenting before your thinking is finished.",
        pros: ["Speed reads as confidence", "Keeps you in play"],
        cons: ["Arguing against the unexamined"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m5-accel",
            tone: "mixed",
            headline: "You are in the room within two days, with a half-formed argument.",
            detail:
              "Speed reads as confidence, and Sarah appreciates it. But you are arguing against something you have not examined, and twice you have to say you will come back with detail.",
            changed: ["You held the relationship", "You spent credibility to do it"],
            effect: { dims: { win: 4, deliver: -2 } },
          },
        ],
      },
      {
        id: "o-reframe",
        title: "Change the question",
        icon: "scale",
        description: "Move the conversation to the part of the experience their offer cannot reach.",
        commits: "Moves away from what the client asked for.",
        pros: ["Contest on your ground", "Neutralises their asset"],
        cons: ["Contradicts their brief", "Needs evidence"],
        cost: { time: 2, investment: 2 },
        outcomes: [
          {
            id: "m5-reframe-strong",
            when: { all: ["knows:real_pain"] },
            tone: "strong",
            headline: "You move the goalposts, and the client follows.",
            detail:
              "You point out that a beautiful storefront does not fix a three-week return. Because you have the complaint data, this lands as analysis rather than as a sales tactic. The rival is now answering your question instead of the other way round.",
            changed: [
              "The evaluation is now on ground you chose",
              "The rival's strongest asset matters less",
            ],
            effect: { dims: { win: 12, profit: 3 }, flags: ["reframed"], badge: "adapt" },
          },
          {
            id: "m5-reframe-weak",
            tone: "mixed",
            headline: "It sounds like a deflection, because you cannot prove it.",
            detail:
              "The argument is correct. You simply do not have the evidence to support it, so it comes across as a firm losing a comparison and changing the subject. Sarah is unconvinced but not unfriendly.",
            changed: ["You raised the right issue", "You could not back it up"],
            effect: { dims: { win: -2 } },
          },
        ],
      },
      {
        id: "o-hold",
        title: "Hold your plan",
        icon: "shield",
        description: "One announcement is not a decision. Carry on.",
        commits: "The client hears nothing while the story is live.",
        pros: ["Costs nothing", "Steadiness can reassure"],
        cons: ["Needs existing standing", "Their story goes unanswered"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m5-hold-ok",
            when: { any: ["credibility", "has_access"] },
            tone: "strong",
            headline: "Nothing breaks, because the relationship holds it.",
            detail:
              "You already have enough standing with this client that a competitor's press release does not move them. Steadiness reads as confidence rather than absence.",
            changed: ["You spent nothing and lost nothing"],
            effect: { dims: { win: 2, profit: 3 }, badge: "held_nerve" },
          },
          {
            id: "m5-hold-risky",
            tone: "hard",
            headline: "Silence gets filled by whoever is talking.",
            detail:
              "For three weeks the only firm with a story about Orion's future is the other one. By the time you re-engage, the storefront framing has hardened into how the client describes the project internally.",
            changed: ["The rival's framing is now the client's framing", "You are arguing uphill"],
            effect: { dims: { win: -9 } },
            lesson: {
              principle: "Not reacting is a decision, and it costs something.",
              because:
                "Holding your plan is right when you have the standing to absorb the hit. Without that, silence hands your competitor the definition of the problem.",
              watchFor: "Ask whether you are holding your nerve or simply hoping.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "When the situation changes, you have to decide whether your plan still fits it.",
      because:
        "A competitor's move is information. Reacting to all of it makes you thrash; reacting to none of it makes you irrelevant.",
      watchFor: "A press release is a claim about the future. It is not evidence that anything shipped.",
    },
    next: "m5b",
  },

  /* ══════════════════════════ CHAPTER 3 ══════════════════════════ */
  {
    kind: "interlude",
    id: "int-3",
    chapter: 3,
    eyebrow: "Chapter Three",
    title: "Build the response",
    body: [
      "Now you have to say what you would actually do.",
      "This is where a deal stops being a conversation and starts being a promise.",
    ],
    milestone: "Opportunity created",
    next: "m6",
  },

  {
    kind: "choice",
    id: "m6",
    chapter: 3,
    stage: "solution",
    title: "What are we actually solving?",
    eyebrow: "Define the problem",
    objective: "Choose the problem your proposal answers.",
    minutes: 4,
    hero: "hero-retail-interior",
    situation: [
      "The brief still says “improve the customer experience across our stores”.",
      "Everything follows from how you read that sentence. Get it wrong and every good decision after it serves the wrong goal.",
    ],
    client: ORION,
    advisor: ARJUN,
    consider: [
      "Is the ask where the money is leaking?",
      "What would let us disagree with their brief?",
      "Would our rival's proposal look the same?",
    ],
    tip: "I read their complaints last night. The store barely comes up. Make of that what you like.",
    prompt: "Three readings of the same one-line brief.",
    question: "What do you propose to fix?",
    options: [
      {
        id: "o-asked",
        title: "The thing they asked for",
        icon: "check",
        image: "solution-screen",
        description: "A store and digital experience redesign. What the brief says.",
        commits: "A direct comparison against a vendor partnership.",
        pros: ["Nobody can say you missed", "Easy to approve"],
        cons: ["Directly comparable", "Decision moves to price"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m6-asked",
            tone: "mixed",
            headline: "Safe, and indistinguishable.",
            detail:
              "Nobody can accuse you of missing the brief. You are also now one of two firms proposing broadly the same thing, and the other one has a demo and a vendor logo. The decision will come down to price.",
            changed: ["You are comparable to your competitor", "Price becomes the deciding factor"],
            effect: { dims: { win: 2, profit: -4 }, flags: ["scope:storefront"] },
            lesson: {
              principle: "Answering the question exactly as asked makes you easy to compare.",
              because:
                "Proposing what everyone else is proposing moves the decision onto the one dimension where you have least control: price.",
              watchFor:
                "If your proposal could have your competitor's logo on it, it is not a proposal, it is a quote.",
            },
          },
        ],
      },
      {
        id: "o-real",
        title: "The post-purchase experience",
        icon: "target",
        image: "solution-in-store-tech",
        description: "Argue the damage happens after the sale — deliveries, returns, support.",
        commits: "Contradicts the client's own brief in writing.",
        pros: ["Nobody else proposing it", "Hits the real problem"],
        cons: ["Contradicts their brief", "Needs evidence"],
        cost: { time: 2, investment: 2 },
        outcomes: [
          {
            id: "m6-real-evidenced",
            when: { all: ["knows:real_pain"] },
            tone: "strong",
            headline: "You show them their own data, and the room changes.",
            detail:
              "You open with their complaint volumes rather than your credentials. Nobody argues, because it is their own evidence. Sarah says quietly that she has suspected this for a year and could not get it funded.",
            changed: [
              "You are no longer being compared to the storefront proposal",
              "The sponsor now has the argument she needed internally",
            ],
            effect: {
              dims: { win: 12, profit: 5 },
              flags: ["scope:postpurchase", "evidenced"],
              badge: "connected_dots",
            },
          },
          {
            id: "m6-real-hunch",
            tone: "mixed",
            headline: "You are right, and you cannot prove it.",
            detail:
              "It is the correct read. But you are asking them to abandon their own brief on the strength of your instinct, and instinct is exactly what they are paying to avoid. They ask for evidence you do not have.",
            changed: ["The right idea, poorly supported", "You are asked to come back with proof"],
            effect: { dims: { win: 3, deliver: -2 }, flags: ["scope:postpurchase"] },
            lesson: {
              principle: "Being right is not the same as being persuasive.",
              because:
                "You reached the correct conclusion without the evidence to defend it, so it landed as an opinion competing with theirs rather than as a finding.",
              watchFor:
                "Before challenging a client's framing, ask what you would need in your hand to make it stick.",
            },
          },
        ],
      },
      {
        id: "o-diagnostic",
        title: "Propose to find out first",
        icon: "search",
        image: "solution-workshop",
        description: "A short diagnostic to establish which of the two problems is costing them.",
        commits: "Delays the real decision by six weeks.",
        pros: ["Low risk", "Buys the evidence"],
        cons: ["Six weeks of nothing", "Can read as indecision"],
        cost: { time: 3, investment: 1 },
        outcomes: [
          {
            id: "m6-diag",
            tone: "mixed",
            headline: "Professional, cautious, and slightly disappointing.",
            detail:
              "They accept, because it is sensible. But you were brought in as people who had seen this before, and asking for six weeks to form a view reads as though you have not. The commercial upside gets pushed out.",
            changed: ["A defensible, low-risk path", "Six weeks before anything substantial happens"],
            effect: { dims: { deliver: 6, win: -3, profit: -2 }, flags: ["scope:diagnostic"] },
          },
        ],
      },
    ],
    lesson: {
      principle: "What a client asks for and what a client needs are often two different things.",
      because:
        "Their brief described a symptom they could see. The job is to work out whether that is where the damage actually is — and then to be able to show it.",
      watchFor: "A client who wrote the brief has usually already suspected it was wrong.",
    },
    next: "m6b",
  },

  {
    kind: "build",
    id: "m7",
    chapter: 3,
    stage: "solution",
    title: "What goes in the proposal",
    eyebrow: "Assemble the offer",
    objective: "Pick three components. You cannot afford six.",
    minutes: 5,
    hero: "solution-workshop",
    situation: [
      "You have a shape. Every element you add makes the proposal more attractive and harder to deliver at the same time.",
    ],
    advisor: ARJUN,
    consider: [
      "For each item, who actually delivers it?",
      "Which wins the deal, and which survives it?",
      "What happens if Operations says no?",
    ],
    tip: "Aisha will inherit this document. She reads every line and she remembers.",
    prompt: "Three of six. Each makes the offer stronger somewhere and weaker elsewhere.",
    question: "What do you put in?",
    pick: 3,
    components: [
      {
        id: "c-journey",
        title: "Customer journey redesign",
        description: "Map and rebuild the end-to-end experience. Highly visible, highly sellable.",
        tag: "Visible",
        dims: { win: 7, deliver: -4 },
        flags: ["has:journey"],
      },
      {
        id: "c-platform",
        title: "Returns and support platform rebuild",
        description: "Replace the systems behind the actual complaints. Large, expensive, slow.",
        tag: "Heavy",
        dims: { win: 8, profit: -6, deliver: -9 },
        flags: ["scope:heavy"],
      },
      {
        id: "c-ops",
        title: "Operations integration workstream",
        description: "A stream to get changes into Operations' release schedule, with their people.",
        tag: "Unglamorous",
        dims: { deliver: 13, win: 1, profit: -5 },
        flags: ["has:ops_workstream"],
      },
      {
        id: "c-training",
        title: "Staff training and adoption",
        description: "Make sure the people who use it every day actually do. Cheap and effective.",
        tag: "Adoption",
        dims: { deliver: 7, win: 2, profit: -2 },
        flags: ["has:training"],
      },
      {
        id: "c-pilot",
        title: "An eight-week pilot",
        description: "Something live and demonstrable inside two months. Boards love this.",
        tag: "Fast",
        dims: { win: 9, deliver: -5, profit: -2 },
        flags: ["promised:fast"],
      },
      {
        id: "c-data",
        title: "Data and measurement foundation",
        description: "Instrument everything so improvement can be proven. Nobody pitches this.",
        tag: "Foundation",
        dims: { profit: 6, deliver: 4, win: -3 },
        flags: ["has:data"],
      },
    ],
    outcomes: [
      {
        id: "m7-anchored",
        when: { all: ["has:ops_workstream", "knows:ops_constraint"] },
        tone: "strong",
        headline: "Marcus Reed reads it and stops objecting.",
        detail:
          "You put a workstream in the proposal with his people's names against it, before he had to ask. That single decision turns the person most able to block this into someone with a stake in it working.",
        changed: [
          "Operations is invested rather than resistant",
          "The thing that killed the last programme has an owner this time",
        ],
        effect: { dims: { deliver: 6, win: 4 }, flags: ["ops_onside"], badge: "connected_dots" },
      },
      {
        id: "m7-overreach",
        when: { all: ["scope:heavy"], none: ["has:ops_workstream"] },
        tone: "hard",
        headline: "An ambitious proposal with nobody to land it.",
        detail:
          "You have promised to replace the systems at the centre of their operation, and there is no line in the document explaining how those changes reach production. Everyone nods. Nobody has checked.",
        changed: ["A large, attractive promise", "No route through Operations"],
        effect: { dims: { deliver: -6 }, flags: ["unanchored"] },
        lesson: {
          principle: "Every promise in a proposal is a commitment someone else has to keep.",
          because:
            "The most impressive element you included is also the one that has to pass through the team you have not involved.",
          watchFor: "For each thing you propose, name who delivers it and check they know.",
        },
      },
      {
        id: "m7-fast-thin",
        when: { all: ["promised:fast"], none: ["has:data", "has:ops_workstream"] },
        tone: "mixed",
        headline: "A quick win with nothing underneath it.",
        detail:
          "The eight-week pilot is the most attractive thing in the document. It also assumes access to systems and data that nobody has confirmed, and there is no workstream in the proposal to get it.",
        changed: ["A compelling headline", "A timeline resting on untested assumptions"],
        effect: { dims: { win: 2, deliver: -3 }, flags: ["fragile_timeline"] },
      },
      {
        // Fallback. Reaching here means the proposal contains at least one of
        // training / data / operations — the unglamorous parts that make the
        // rest survive. Every all-surface combination is caught above.
        id: "m7-balanced",
        tone: "strong",
        headline: "A proposal that could actually be delivered.",
        detail:
          "It is not the flashiest document in the pile. It includes the parts of the work that make the other parts survive contact with a real organisation, which is rarer than it should be.",
        changed: ["Attractive and deliverable at the same time"],
        effect: { dims: { deliver: 3, profit: 2 } },
      },
    ],
    lesson: {
      principle: "A solution is what you can deliver, not what you can describe.",
      because:
        "Every component made the proposal more attractive, harder to deliver, or less profitable. Three of six was the constraint; which three was the decision.",
      watchFor: "The parts that win a proposal and the parts that survive it are rarely the same three.",
    },
    next: "m7b",
  },

  /* ══════════════════════════ CHAPTER 4 ══════════════════════════ */
  {
    kind: "interlude",
    id: "int-4",
    chapter: 4,
    eyebrow: "Chapter Four",
    title: "Make the deal work",
    body: [
      "A proposal the client loves and you cannot profitably deliver is not a win.",
      "Now the three questions start pulling against each other in public.",
    ],
    milestone: "Solution designed",
    next: "m8",
  },

  {
    kind: "choice",
    id: "m8",
    chapter: 4,
    stage: "deal",
    title: "The number is too high",
    eyebrow: "Commercial pressure",
    objective: "Answer the price without giving away the margin.",
    minutes: 4,
    hero: "hero-negotiation",
    situation: [
      "Orion comes back. You are thirty percent above the alternative, and procurement has said so in writing.",
      "Sarah still wants you. She needs something she can take to her board.",
    ],
    saidQuote: {
      text: "I am not asking you to be the cheapest. I am asking for something I can defend in a board meeting that has already seen a smaller number.",
      attribution: "Sarah Lim · Chief Transformation Officer, Orion Retail",
    },
    concerns: [
      "Procurement has the comparison in writing",
      "The board has seen the lower figure",
      "The difference between proposals is invisible",
    ],
    advisor: RIYA_DEAL,
    consider: [
      "What exactly are they comparing us to?",
      "If we discount, what becomes impossible later?",
      "Can we lower commitment without lowering rate?",
    ],
    tip: "I gave eight percent away on Meridian. We spent the next year explaining it.",
    prompt: "Four routes to their number.",
    question: "How do you respond?",
    options: [
      {
        id: "o-hold-price",
        title: "Hold the price",
        icon: "shield",
        description: "Explain what the difference buys them, and do not move.",
        commits: "Nothing left to offer if it does not land.",
        pros: ["Full margin protected", "No race to the bottom"],
        cons: ["Needs a visible difference", "Nothing left to concede"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m8-hold-strong",
            // You can only hold a premium if the client can SEE the difference.
            // Proposing the same thing as the competitor removes that difference,
            // whatever else you have going for you.
            when: {
              any: ["evidenced", "ops_onside", "reframed", "knows:rival_gap", "knows:rivals"],
              none: ["scope:storefront"],
            },
            tone: "strong",
            headline: "The difference is defensible, so the price holds.",
            detail:
              "You are not comparing like with like, and you can show it. The other proposal does not touch the operational work. Procurement does not enjoy it, but Sarah now has a straight answer for her board.",
            changed: ["Full margin protected", "The comparison is neutralised"],
            effect: { dims: { profit: 10, win: 2 }, badge: "held_nerve" },
          },
          {
            id: "m8-hold-weak",
            tone: "hard",
            headline: "Without a difference they can see, it reads as stubbornness.",
            detail:
              "You say your proposal is worth more. They ask why. The reasons are real but general, and general reasons lose to a specific number. The relationship cools noticeably.",
            changed: ["Margin intact", "You are now the expensive option with no explanation"],
            effect: { dims: { win: -12, profit: 4 } },
          },
        ],
      },
      {
        id: "o-discount",
        title: "Meet them on price",
        icon: "coins",
        description: "Come down, close the gap, get it signed.",
        commits: "The margin does not come back later.",
        pros: ["Objection gone", "Best chance of signature"],
        cons: ["Spends your contingency", "Sets phase two expectation"],
        cost: { time: 1, investment: 3 },
        outcomes: [
          {
            id: "m8-discount",
            tone: "mixed",
            headline: "The gap closes. So does your room to manoeuvre.",
            detail:
              "Procurement is satisfied and the deal moves. You have also just funded the discount out of the contingency you were going to need if anything went wrong in delivery — and something usually does.",
            changed: ["Price objection removed", "No financial slack left in the programme"],
            effect: { dims: { win: 9, profit: -14 }, flags: ["discounted"] },
            lesson: {
              principle: "A discount is spent twice — once to win, and again when delivery needs it.",
              because:
                "The money you gave away was the same money that would have absorbed a problem later. Nothing about the work got cheaper.",
              watchFor: "Before discounting, ask what that contingency was for.",
            },
          },
        ],
      },
      {
        id: "o-rescope",
        title: "Take something out",
        icon: "cross",
        description: "Hold your rate and reduce what is included to reach their number.",
        commits: "Something you thought necessary leaves the contract.",
        pros: ["Price falls honestly", "Rate preserved"],
        cons: ["What leaves is load-bearing"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m8-rescope",
            tone: "mixed",
            headline: "You hit the number by promising less.",
            detail:
              "It is the honest version of a discount: the price falls because the work does. What leaves the scope is the least visible thing, which is usually the thing that made the rest work.",
            changed: [
              "Price matched without losing margin",
              "Less in the programme than you thought it needed",
            ],
            /* Was `profit +4, win +4, deliver -6`, which said that cutting scope pleases
               the client and makes the work harder to deliver. Both are backwards: they
               got less than they were promised, and there is less to build. The real cost
               is that what left was load-bearing — which is what `descoped` carries into
               month five, not a penalty invented here. Phasing beat this on all three in
               93% of reachable states while the numbers pointed the wrong way. */
            effect: { dims: { profit: 6, win: -2, deliver: 4 }, flags: ["descoped"] },
          },
        ],
      },
      {
        id: "o-phase",
        title: "Restructure it into phases",
        icon: "layers",
        description: "Smaller first phase, rest contingent on it working. Same total, different risk.",
        commits: "Re-planning, and phase two must be earned.",
        pros: ["Smaller board decision", "Rate and scope intact"],
        cons: ["Significant re-planning", "Phase two at risk"],
        cost: { time: 3, investment: 2 },
        outcomes: [
          {
            id: "m8-phase-good",
            when: { any: ["has_access", "ops_onside", "evidenced", "landed_small"] },
            tone: "strong",
            headline: "The board approves it because the first cheque is small.",
            detail:
              "You have not moved your rate and you have not cut the work — you have changed what they have to commit to today. Sarah gets an approvable number, and you get a second phase you are well placed to win.",
            changed: [
              "Margin protected",
              "Smaller decision for the client to make",
              "The rest of the work still ahead of you",
            ],
            effect: { dims: { profit: 8, win: 7, deliver: 3 }, badge: "smart_tradeoff" },
          },
          {
            id: "m8-phase-thin",
            tone: "mixed",
            headline: "A clever structure on a shaky foundation.",
            detail:
              "Phasing is the right instinct. But you are asking them to trust that phase two will be worth it, and you have not yet given them much reason to believe that. They agree to phase one and reserve judgement.",
            changed: ["Deal moves forward", "Phase two is genuinely at risk"],
            effect: { dims: { profit: 5, win: 2 } },
          },
        ],
      },
    ],
    lesson: {
      principle: "Price is not a number, it is a position.",
      because:
        "Every route to their number costs you something — margin, scope, or the work of restructuring. The only one that costs nothing is a difference the client can actually see.",
      watchFor: "When pushed on price, ask what specifically they are comparing you to.",
    },
    next: "m9",
  },

  {
    kind: "choice",
    id: "m9",
    chapter: 4,
    stage: "deal",
    title: "The review before signature",
    eyebrow: "Quality and risk review",
    objective: "Handle the risk your own review just raised.",
    minutes: 4,
    hero: "hero-boardroom",
    situation: [
      "Before signature it goes to internal quality and risk review, whose job is to ask what the deal team has stopped asking.",
      "The finding: the programme changes systems other teams depend on, and the proposal never says how those changes reach production.",
    ],
    variants: [
      {
        when: { all: ["scope:heavy"], none: ["has:ops_workstream"] },
        situation: [
          "Before signature it goes to internal quality and risk review.",
          "The finding is blunt. You committed to rebuilding the systems at the centre of Orion's operation, and no workstream gets those changes through Operations. The reviewer also found that the last programme here died for exactly that reason.",
        ],
      },
      {
        when: { all: ["promised:fast"], none: ["has:data"] },
        situation: [
          "Before signature it goes to internal quality and risk review.",
          "The finding is about the eight-week pilot. It assumes order and returns data nobody has confirmed exists in usable form. If that takes four weeks to arrange, the pilot is late on the day you sign.",
        ],
      },
      {
        when: { all: ["descoped"] },
        situation: [
          "Before signature it goes to internal quality and risk review.",
          "The finding is about what is no longer in the proposal. What you removed to reach their number was load-bearing, and the reviewer wants to know what now delivers the outcome the contract still promises.",
        ],
      },
      {
        when: { all: ["has:ops_workstream"] },
        situation: [
          "Before signature it goes to internal quality and risk review.",
          "The finding is modest. Your integration workstream handles the hard part, so what remains is a dependency on two Orion specialists whose time has not been formally committed.",
        ],
      },
    ],
    advisor: AISHA,
    consider: [
      "Are we solving this, or recording it?",
      "What does this cost now versus month five?",
      "Do we still have the money to fix it?",
    ],
    tip: "The reviewers have no stake in this closing. That is exactly why I read them twice.",
    prompt: "Four ways to answer a review finding.",
    question: "What do you do about it?",
    options: [
      {
        id: "o-accept-risk",
        title: "Accept the risk and sign",
        icon: "warning",
        description: "Note it formally, carry on, deal with it if it happens.",
        commits: "It lands in delivery with no plan behind it.",
        pros: ["Keeps momentum", "Costs nothing today"],
        cons: ["Arrives later, larger", "On record that you knew"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m9-accept-loaded",
            when: { any: ["scope:heavy", "promised:fast", "unanchored", "fragile_timeline"] },
            tone: "hard",
            headline: "Signed, with the risk fully documented and entirely unmanaged.",
            detail:
              "The review flagged exactly the thing your proposal was thinnest on. Writing it down does not make it smaller. It will now arrive during delivery, on someone else's watch, with a paper trail showing you knew.",
            changed: ["Contract signed", "A known problem walking into delivery"],
            effect: { dims: { win: 4, deliver: -12 }, flags: ["risk_accepted"] },
          },
          {
            id: "m9-accept-ok",
            tone: "mixed",
            headline: "Signed. The risk is real but survivable.",
            detail:
              "Your proposal is solid enough that the flagged risk is a manageable one. Accepting it keeps momentum, and you have enough slack elsewhere to absorb it.",
            changed: ["Contract signed", "A documented risk you can probably carry"],
            effect: { dims: { win: 4, deliver: -4 }, flags: ["risk_accepted"] },
          },
        ],
      },
      {
        id: "o-mitigate",
        title: "Build in a mitigation",
        icon: "shield",
        description: "Add the contingency, people or integration work needed to cover it.",
        commits: "Costs margin you may not have.",
        pros: ["Cheap while it is early", "Delivery gets a plan"],
        cons: ["Straight out of margin", "Needs money to exist"],
        cost: { time: 2, investment: 3 },
        outcomes: [
          {
            id: "m9-mitigate-broke",
            when: { all: ["discounted"] },
            tone: "hard",
            headline: "You cannot afford the fix you just agreed to.",
            detail:
              "Mitigation costs money, and the money is gone — you gave it to procurement to close the price gap. You add a thinner version than the review asked for and hope the difference does not matter.",
            changed: [
              "Partial mitigation",
              "The programme is now running with no margin for error",
            ],
            effect: { dims: { deliver: 4, profit: -9 }, flags: ["thin_mitigation"] },
            lesson: {
              principle:
                "Commercial decisions and delivery decisions are the same decision, made at different times.",
              because:
                "The discount that won the deal is the reason you cannot properly fix the risk that threatens it.",
              watchFor: "When you concede on price, note what you are giving up the ability to do later.",
            },
          },
          {
            id: "m9-mitigate",
            tone: "strong",
            headline: "It costs you, and it holds.",
            detail:
              "You put real work and real money behind the risk before signature, while it is still cheap. It is the least satisfying line in the commercial case and the reason the programme will survive month five.",
            changed: ["Risk properly covered", "Lower margin, by choice"],
            effect: { dims: { deliver: 11, profit: -6 }, badge: "smart_tradeoff" },
          },
        ],
      },
      {
        id: "o-rescope-risk",
        title: "Take the risky part out",
        icon: "cross",
        description: "Remove what creates the exposure and deliver the rest well.",
        commits: "The client loses something they were promised.",
        pros: ["Exposure gone", "A programme you can run"],
        cons: ["Withdrawing a promise", "They will remember"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m9-rescope",
            tone: "mixed",
            headline: "A smaller, safer programme, and a slightly disappointed client.",
            detail:
              "Removing the exposure removes the problem. It also removes the most exciting thing you promised, and you have to go back and explain why. They accept it, and they remember it.",
            changed: ["Exposure removed", "A visible promise withdrawn before you even started"],
            /* Deliverability above re-pricing's +9, deliberately: re-pricing FUNDS the
               exposure and removing it ELIMINATES it, so the safer programme has to read
               as safer. It did not, and `o-repriceRisk` therefore beat this option on all
               three dimensions in 93% of reachable states — a fake choice the authored
               best-versus-worst detector could not see. The cost is unchanged and real:
               a promise withdrawn, and `descoped`, which month five reads. */
            effect: { dims: { deliver: 14, win: -6, profit: 3 }, flags: ["descoped"] },
          },
        ],
      },
      {
        id: "o-repriceRisk",
        title: "Go back and re-price it",
        icon: "scale",
        description: "Tell them the risk is real and covering it properly costs more.",
        commits: "Reopens a conversation you had closed.",
        pros: ["Funds the fix", "Honest, and they know it"],
        cons: ["Reopens the negotiation", "Can look like under-quoting"],
        cost: { time: 2, investment: 2 },
        outcomes: [
          {
            id: "m9-reprice-strong",
            when: { any: ["evidenced", "ops_onside", "credibility", "ops_engaged"] },
            tone: "strong",
            headline: "They take it seriously, because you have been straight with them before.",
            detail:
              "Reopening price after agreement is only survivable if the client believes you. They do. The number goes up slightly, the risk gets covered, and the honesty becomes part of why they picked you.",
            changed: ["Risk funded properly", "Trust strengthened rather than spent"],
            effect: { dims: { profit: 6, deliver: 9, win: -2 }, badge: "smart_tradeoff" },
          },
          {
            id: "m9-reprice-weak",
            tone: "hard",
            headline: "It looks like you are moving the goalposts.",
            detail:
              "From where procurement sits, a firm that raises its price after winning is a firm that under-quoted to get in. You get the increase, and you spend most of the goodwill you had to get it.",
            changed: ["Risk funded", "The relationship is now transactional"],
            effect: { dims: { profit: 5, deliver: 7, win: -10 } },
          },
        ],
      },
    ],
    lesson: {
      principle: "Risk is cheapest to deal with before you sign.",
      because:
        "Every option here cost something — margin, scope, or goodwill. All of them cost less now than the same problem will cost in month five of delivery.",
      watchFor: "When a review flags something, notice whether you are solving it or just recording it.",
    },
    next: "m9a",
  },

  /* ══════════════════════════ CHAPTER 5 ══════════════════════════ */
  {
    kind: "interlude",
    id: "int-5",
    chapter: 5,
    eyebrow: "Chapter Five",
    title: "Deliver the promise",
    body: [
      "The contract is signed. A different set of people now has to keep everything you said.",
      "This is where you find out what you actually agreed to.",
    ],
    milestone: "Contract signed",
    next: "m10",
  },

  {
    kind: "choice",
    id: "m10",
    chapter: 5,
    stage: "delivery",
    title: "Month five",
    eyebrow: "Delivery reality",
    objective: "Deal with a decision you made months ago.",
    minutes: 4,
    hero: "solution-in-store-tech",
    situation: [
      "Delivery is underway and something has given. The delivery lead wants thirty minutes.",
      "Two Orion specialists the plan depends on have been pulled onto another priority. You are three weeks behind and the gap is widening.",
    ],
    variants: [
      {
        when: { any: ["unanchored", "risk_accepted"], all: ["scope:heavy"] },
        situation: [
          "Delivery is underway and something has given. The delivery lead wants thirty minutes.",
          "The platform work is built and cannot go anywhere. Operations will not take it into a release without six weeks of testing nobody scheduled, because nobody asked them. This is the risk the review flagged, arriving as described.",
        ],
      },
      {
        when: { any: ["fragile_timeline", "promised:fast"] },
        situation: [
          "Delivery is underway and something has given. The delivery lead wants thirty minutes.",
          "The pilot is in week six and the data is not ready. Getting usable order data out of the existing systems is taking far longer than the plan assumed — because the plan assumed rather than checked it.",
        ],
      },
      {
        when: { all: ["descoped"] },
        situation: [
          "Delivery is underway and something has given. The delivery lead wants thirty minutes.",
          "What was cut to reach the price is now missing in the worst way. The team is asked daily for the thing that is not in the contract, and saying no is making the whole programme feel smaller than what was sold.",
        ],
      },
      {
        when: { all: ["ops_onside", "has:training"] },
        situation: [
          "Delivery is underway, and it is a good problem. The delivery lead wants thirty minutes.",
          "Adoption in the pilot stores is well ahead of plan and three regions want to be added early. That would pull the rollout forward by a quarter, and the plan does not have the people in it.",
        ],
      },
    ],
    advisor: AISHA,
    consider: [
      "Which decision created this?",
      "What can we still afford to do?",
      "What if they hear it from someone else?",
    ],
    tip: "Whatever you decide, I have to tell the team on Monday. Tell me what to say.",
    prompt: "The delivery lead has thirty minutes and needs a decision to take away.",
    question: "How do you respond?",
    options: [
      {
        id: "o-reset",
        title: "Reset expectations",
        icon: "talk",
        description: "Go to the sponsor early, explain honestly, re-plan together.",
        commits: "Saying out loud that a promise will not hold.",
        pros: ["Client inside the problem", "Cheapest if trust exists"],
        cons: ["You have to admit it", "Invites scrutiny"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m10-reset-trust",
            when: { any: ["ops_onside", "evidenced", "credibility"] },
            tone: "strong",
            headline: "It is a difficult meeting, and it works.",
            detail:
              "You go early, with a clear account of what changed and a revised plan already drafted. Because you have been accurate with this client from the first conversation, they treat it as management rather than as failure.",
            changed: ["Plan reset with the client's agreement", "The relationship survives intact"],
            effect: { dims: { deliver: 10, win: 3, profit: -2 }, badge: "recovered" },
          },
          {
            id: "m10-reset-cold",
            tone: "mixed",
            headline: "They accept it. They also start checking everything.",
            detail:
              "Honesty is still the right move, and it still costs you. Without much of a track record to draw on, the client responds by adding governance — weekly reviews, escalation paths, a steering committee.",
            changed: ["Plan reset", "You are now being managed closely"],
            effect: { dims: { deliver: 6, profit: -5, win: -3 } },
          },
        ],
      },
      {
        id: "o-absorb",
        title: "Put more people on it",
        icon: "people",
        description: "Hold the promise by adding capacity and absorbing the cost.",
        commits: "Straight out of the margin on this contract.",
        pros: ["Client sees delivery", "Buys a reference"],
        cons: ["Straight out of margin", "Needs margin to exist"],
        cost: { time: 1, investment: 3 },
        outcomes: [
          {
            id: "m10-absorb-broke",
            when: { any: ["discounted", "thin_mitigation"] },
            tone: "hard",
            headline: "There is no margin left to spend.",
            detail:
              "Adding people is the obvious fix and you cannot fund it. The commercial decisions made before signature have removed the option, so you add two people instead of five and the date slips anyway.",
            changed: ["Partial cover", "Date missed regardless", "The contract is now loss-making"],
            effect: { dims: { profit: -13, deliver: 3 } },
            lesson: {
              principle: "Delivery inherits every commercial decision made before it started.",
              because:
                "The flexibility you needed in month five was sold in the pricing conversation, months earlier, to close a gap.",
              watchFor: "When you give something up to win, write down what you have made impossible.",
            },
          },
          {
            id: "m10-absorb",
            tone: "mixed",
            headline: "You hold the date by paying for it.",
            detail:
              "The client sees a programme delivering what it said it would. Your margin takes the hit quietly, which is a legitimate choice — it buys a reference and a relationship. It is not free.",
            changed: ["Promise kept", "Profitability materially reduced"],
            effect: { dims: { deliver: 8, profit: -10, win: 4 } },
          },
        ],
      },
      {
        id: "o-push",
        title: "Push the team to hit it",
        icon: "clock",
        description: "The commitment was made. Hold everyone to it.",
        commits: "Whatever it costs the people doing the work.",
        pros: ["Date is met", "No concession"],
        cons: ["Paid by the team", "Quality goes first"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m10-push-fragile",
            when: { any: ["scope:heavy", "promised:fast", "risk_accepted", "unanchored"] },
            tone: "hard",
            headline: "You hit the date and miss the point.",
            detail:
              "Something goes live on the day promised. It is thin, it is not integrated with the systems that matter, and within three weeks the support queue is worse than before. Two people from the delivery team have asked to roll off.",
            changed: [
              "The date was met",
              "The outcome was not",
              "The client's actual problem is unsolved",
            ],
            effect: { dims: { deliver: -14, win: -6, profit: 2 } },
          },
          {
            id: "m10-push-ok",
            tone: "mixed",
            headline: "It is tight, and it lands.",
            detail:
              "The programme is well enough built that pressure alone gets it over the line. It costs goodwill inside the team, and you will need to spend time repairing that, but the client gets what they were promised.",
            changed: ["Date met", "The delivery team is worn down"],
            effect: { dims: { deliver: 2, profit: 3, win: 1 } },
          },
        ],
      },
      {
        id: "o-quiet",
        title: "Quietly reduce what ships",
        icon: "block",
        description: "Trim the scope without making it a formal conversation.",
        commits: "The client finds out on their own terms.",
        pros: ["Pressure disappears", "No hard meeting"],
        cons: ["They will find out", "Becomes a trust problem"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m10-quiet-covered",
            when: { any: ["ops_onside", "broad_base"] },
            tone: "mixed",
            headline: "Nobody notices, because the people who would have noticed are inside it.",
            detail:
              "Operations knows what was trimmed and why, and they are the ones the business asks. It holds — but you are now relying on other people to explain a decision you chose not to announce.",
            changed: [
              "Short-term pressure relieved",
              "Operations is carrying an explanation you did not give",
            ],
            effect: { dims: { deliver: 3, win: -4, profit: 4 } },
          },
          {
            id: "m10-quiet",
            tone: "hard",
            headline: "It works until somebody opens the original document.",
            detail:
              "The immediate pressure disappears. Four weeks later, a Orion manager compares what was delivered with what was proposed and asks a question in writing. The issue is no longer the scope; it is that you did not say.",
            changed: [
              "Short-term pressure relieved",
              "Trust damaged in a way that is hard to repair",
            ],
            effect: { dims: { deliver: 2, win: -14, profit: 4 } },
            lesson: {
              principle:
                "Delivery problems become relationship problems the moment you stop talking about them.",
              because:
                "Reducing scope is often correct. Reducing it quietly turns a manageable delivery decision into a question about whether you can be trusted.",
              watchFor: "If you would not want the client to read the decision log, reconsider the decision.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "Everything you promise becomes somebody's problem later.",
      because:
        "What went wrong in month five was not a delivery mistake. It was the arithmetic of choices made during qualification, solutioning and pricing, arriving on schedule.",
      watchFor: "When you make a commitment, ask who has to keep it and whether they know yet.",
    },
    next: "m10b",
  },

  /* ═════════════ missions restored from the PRD (see D-020) ═════════════ */

  /**
   * PRD M8 — prioritisation. "Where should we spend our limited attention?"
   *
   * Doubles as the recovery beat: everything here feeds a flag that a later mission
   * reads, so a player who spent their two questions badly in M2 gets one more chance
   * to acquire what they need. Failure has a route forward (PRD pp. 174–175).
   */
  {
    kind: "build",
    id: "m5b",
    chapter: 2,
    stage: "opportunity",
    title: "Where the team actually goes",
    eyebrow: "Prioritisation",
    objective: "Fund two of five before the proposal.",
    minutes: 4,
    hero: "solution-workshop",
    situation: [
      "Sarah wants five things done before you propose. Your people have a fortnight and there is room for two.",
      "Nobody will tell you which two. The other three simply will not happen.",
    ],
    advisorLine: "Two weeks of my team's time. Tell me what it is buying.",
    advisor: RIYA,
    consider: [
      "Which of these changes what we propose?",
      "What do we still not know?",
      "Which would we regret skipping in month five?",
    ],
    tip: "I would take the workshop. Marcus has killed one of these before and I was there.",
    prompt: "Two of five. The other three do not happen.",
    question: "What do you fund?",
    pick: 2,
    components: [
      {
        id: "c-ops-workshop",
        title: "A workshop with Operations",
        description: "Get Marcus Reed and his leads in a room before anything is written down.",
        tag: "Unglamorous",
        dims: { deliver: 8, win: 2, profit: -2 },
        flags: ["ops_engaged"],
      },
      {
        id: "c-benchmark",
        title: "Benchmark the competition",
        description: "Work out precisely what the rival's platform does and does not cover.",
        tag: "Intelligence",
        dims: { win: 6, profit: -1 },
        flags: ["knows:rival_gap"],
      },
      {
        id: "c-reference",
        title: "A reference visit",
        description: "Take Sarah to a retailer where you have already done this.",
        tag: "Proof",
        dims: { win: 7, profit: -3 },
        flags: ["credibility"],
      },
      {
        id: "c-data-audit",
        title: "Audit their data",
        description: "Find out whether the order and returns data is usable at all.",
        tag: "Foundation",
        dims: { deliver: 6, profit: 3, win: -2 },
        flags: ["has:data"],
      },
      {
        id: "c-complaints",
        title: "Pull their complaint data",
        description: "Get the actual post-purchase contact volumes out of their systems.",
        tag: "Evidence",
        dims: { win: 5, deliver: 2, profit: -2 },
        flags: ["knows:real_pain"],
      },
      {
        id: "c-stakeholders",
        title: "Map the stakeholders",
        description: "Who signs, who blocks, who has to live with it afterwards.",
        tag: "Political",
        dims: { deliver: 5, win: 3 },
        flags: ["knows:ops_constraint"],
      },
    ],
    outcomes: [
      {
        id: "m5b-grounded",
        when: { all: ["ops_engaged", "has:data"] },
        tone: "strong",
        headline: "You bought the two things nobody else will have.",
        detail:
          "Operations has been in a room with you, and you know what their data can actually support. Neither is impressive in a pitch. Both are the difference between a proposal and a promise.",
        changed: [
          "Operations has met you before the proposal lands",
          "You know what the data can and cannot do",
        ],
        effect: { dims: { deliver: 4 }, badge: "smart_tradeoff" },
      },
      {
        id: "m5b-persuasion",
        when: { all: ["credibility", "knows:rival_gap"] },
        tone: "strong",
        headline: "You have built the argument, not the plan.",
        detail:
          "Sarah has seen the work in a real store and you can name exactly where the rival falls short. You are going to win the room. Nobody has yet checked whether you can deliver what you are about to promise.",
        changed: ["A strong case with the sponsor", "Nothing tested about delivery"],
        effect: { dims: { win: 5, deliver: -3 } },
      },
      {
        id: "m5b-spread",
        tone: "mixed",
        headline: "Two useful weeks, and the gaps that are left are the ones you chose.",
        detail:
          "Both pieces of work land. What matters now is the three you did not fund — because the proposal has to be written as though you know those things anyway.",
        changed: ["Two things you now know", "Three assumptions still standing"],
        effect: { dims: { win: 2, deliver: 1 } },
      },
    ],
    lesson: {
      principle: "Deciding what not to do is the harder half of prioritising.",
      because:
        "Every one of those five was worth doing. Choosing two meant deciding which three gaps you were willing to carry into a contract.",
      watchFor: "When you cannot do everything, name what you are choosing to be ignorant about.",
    },
    next: "int-3",
  },

  /** PRD M12 — the innovation mission: "no single obvious button". */
  {
    kind: "choice",
    id: "m6b",
    chapter: 3,
    stage: "solution",
    title: "Is there another way to do this?",
    eyebrow: "Think differently",
    objective: "Find a shape nobody else will propose.",
    minutes: 4,
    hero: "solution-screen",
    situation: [
      "Two firms are proposing versions of the same thing. There is a third way to answer this, and it is not on anybody's slide yet.",
    ],
    advisorLine: "Everyone is answering the question as asked. That is usually an opening.",
    advisor: ARJUN,
    consider: [
      "What would we do if we could not staff it?",
      "Who else already solved part of this?",
      "What would make us the only credible answer?",
    ],
    tip: "Our returns platform is sitting there. I am not saying use it. I am saying it exists.",
    prompt: "Four shapes of answer. Two firms are already writing the fifth.",
    question: "What do you bring them?",
    options: [
      {
        id: "o-partner",
        title: "Bring in a logistics partner",
        icon: "talk",
        description: "Team with a specialist who already runs returns at this scale.",
        commits: "Shared margin and a dependency you do not control.",
        pros: ["Real delivery capability", "Credible immediately"],
        cons: ["Margin split", "A dependency you cannot control"],
        cost: { time: 2, investment: 2 },
        outcomes: [
          {
            id: "m6b-partner-fit",
            when: { any: ["knows:real_pain", "has:data", "knows:rivals"] },
            tone: "strong",
            headline: "The partner makes your weakest claim your strongest.",
            detail:
              "You know the pain is operational, and now the operational answer comes from people who do it for a living. Sarah stops asking whether you can deliver it and starts asking when.",
            changed: ["Delivery capability is no longer a question", "Margin shared with a partner"],
            effect: { dims: { win: 9, deliver: 8, profit: -6 }, flags: ["has:partner"] },
          },
          {
            id: "m6b-partner-loose",
            tone: "mixed",
            headline: "A capable partner, attached to a problem you have not pinned down.",
            detail:
              "They are good and they are expensive. Without a clear read on what is actually broken, you are paying a specialist to solve a problem you have described in general terms.",
            changed: ["Capability bought", "Margin shared before the problem is clear"],
            effect: { dims: { win: 4, deliver: 4, profit: -7 }, flags: ["has:partner"] },
          },
        ],
      },
      {
        id: "o-reuse",
        title: "Reuse what you already built",
        icon: "layers",
        description: "Adapt the returns platform your team built for another retailer.",
        commits: "A solution shaped by somebody else's business.",
        pros: ["Fast and cheap", "Already proven once"],
        cons: ["Fits another client's shape", "Looks off-the-shelf"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m6b-reuse",
            tone: "mixed",
            headline: "Cheap, fast, and visibly second-hand.",
            detail:
              "It works, and it costs a fraction of building new. It also solves the last client's problem rather than this one, and Sarah notices the gap between what it does and what she asked for.",
            changed: ["Strong margin", "A solution that fits imperfectly"],
            effect: { dims: { profit: 10, deliver: 5, win: -5 }, flags: ["reused_asset"] },
            lesson: {
              principle: "Reuse is leverage until it becomes a substitute for thinking.",
              because:
                "The asset was real and the saving was real. It answered a question this client had not asked.",
              watchFor: "Check whether you are reusing the solution or reusing the diagnosis.",
            },
          },
        ],
      },
      {
        id: "o-outcome-deal",
        title: "Price it on the outcome",
        icon: "scale",
        description: "Tie a third of the fee to the fall in support contacts.",
        commits: "You get paid only if it works.",
        pros: ["Nobody else will offer it", "Total alignment"],
        cons: ["You carry the risk", "Needs measurement to exist"],
        cost: { time: 2, investment: 3 },
        outcomes: [
          {
            id: "m6b-outcome-measurable",
            when: { all: ["has:data"] },
            tone: "strong",
            headline: "You can offer it because you can measure it.",
            detail:
              "An outcome deal is only honest if both sides trust the number. You audited their data, so there is a baseline everyone believes. Sarah's board finds it very hard to say no to.",
            changed: ["A proposal nobody can compare", "A third of the fee now depends on results"],
            effect: {
              dims: { win: 13, profit: -3, deliver: 2 },
              flags: ["outcome_based"],
              badge: "connected_dots",
            },
          },
          {
            id: "m6b-outcome-blind",
            tone: "hard",
            headline: "You have bet a third of the fee on a number nobody can agree.",
            detail:
              "The idea is genuinely strong. But there is no trusted baseline for support contacts, so the first argument of the delivery will be about what the measurement means — and you will be having it with your own money on the table.",
            changed: ["A distinctive offer", "A third of the fee tied to an undefined number"],
            effect: { dims: { win: 6, profit: -10, deliver: -4 }, flags: ["outcome_based"] },
          },
        ],
      },
      {
        id: "o-conventional",
        title: "Keep it conventional",
        icon: "shield",
        description: "A well-built version of what everyone else is proposing.",
        commits: "You compete on execution and price alone.",
        pros: ["Nothing to explain", "Lowest risk"],
        cons: ["Directly comparable", "No reason to pick you"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m6b-conventional",
            tone: "mixed",
            headline: "Solid, and entirely expected.",
            detail:
              "There is nothing wrong with it, which is the problem. Three firms are now offering the same shape of answer, and the only remaining variables are price and who the client likes.",
            changed: ["A defensible proposal", "Nothing that distinguishes it"],
            effect: { dims: { deliver: 4, profit: 3, win: -4 }, flags: ["conventional"] },
          },
        ],
      },
    ],
    lesson: {
      principle: "The shape of a deal is a design decision, not a given.",
      because:
        "Who delivers it, what you reuse, and how you get paid are all choices — and each one changes what you are competing on.",
      watchFor: "When every firm is answering the same question, look at what else could be moved.",
    },
    next: "m7",
  },

  /**
   * PRD M13 — the solution review. "The first time all three become visible together."
   *
   * The player has been watching the three factors all game, so the reveal the PRD
   * intended is spent. What this mission does instead is make the imbalance *actionable*:
   * the review names which one is weakest and asks what you will give up to fix it.
   */
  {
    kind: "choice",
    id: "m7b",
    chapter: 3,
    stage: "solution",
    title: "The internal review",
    eyebrow: "Before it goes out",
    objective: "Rebalance the proposal, or defend it.",
    minutes: 3,
    hero: "hero-boardroom",
    situation: [
      "Your own people read the proposal before the client does. They are not impressed by it and they are not trying to be.",
      "One of the three is visibly weaker than the others. You can spend a week fixing it.",
    ],
    variants: [
      {
        when: { all: ["scope:heavy"], none: ["has:ops_workstream"] },
        situation: [
          "Your own people read the proposal before the client does.",
          "The room keeps returning to the same thing: this promises to rebuild the systems at the centre of their operation, and nothing in it says how those changes reach production.",
        ],
      },
      {
        // Gated on promised:fast, not on discounted — m7b runs BEFORE the pricing
        // mission, so a flag written in m8 can never be set here. The sweep caught it.
        when: { all: ["promised:fast"] },
        situation: [
          "Your own people read the proposal before the client does.",
          "The eight-week pilot is what the room keeps coming back to. Everyone likes it. Nobody can point at the line that says how the data gets ready in time.",
        ],
      },
      {
        when: { all: ["ops_onside", "evidenced"] },
        situation: [
          "Your own people read the proposal before the client does.",
          "It is a good document. The challenge from the room is the opposite of the usual one: is it ambitious enough to be worth their year, or have you priced yourself into a safe, small piece of work?",
        ],
      },
    ],
    advisorLine: "I would rather be argued with now than agreed with and then blamed.",
    advisor: ARJUN,
    consider: [
      "Which of the three is actually weakest?",
      "What would fixing it cost the other two?",
      "Is the review right, or just cautious?",
    ],
    tip: "I have overruled a review twice. Once I was right, and I still think about the other one.",
    prompt: "A week to spend, or a case to make.",
    question: "What do you do with the week?",
    options: [
      {
        id: "o-shore-deliver",
        title: "Shore up the delivery case",
        icon: "shield",
        description: "Add the integration detail, the named people, the testing plan.",
        commits: "A longer, less exciting document.",
        pros: ["Survives the review", "Delivery inherits a plan"],
        cons: ["Reads as cautious", "Costs a week of selling"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m7b-shore",
            tone: "strong",
            headline: "It is duller, and it will hold.",
            detail:
              "Nobody wins a pitch on a testing plan. But the reviewers stop objecting, and the people who will deliver this can now see how it is meant to work.",
            changed: ["Delivery risk materially reduced", "A week not spent on the client"],
            effect: { dims: { deliver: 10, win: -3 }, flags: ["reviewed"] },
          },
        ],
      },
      {
        id: "o-sharpen-win",
        title: "Sharpen the argument",
        icon: "spark",
        description: "Spend the week making the case land harder with Sarah's board.",
        commits: "The weaknesses stay where they are.",
        pros: ["Better chance of winning", "Sponsor gets ammunition"],
        cons: ["Nothing underneath improves", "Reviewers stay unhappy"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m7b-sharpen-risky",
            when: { any: ["scope:heavy", "promised:fast", "discounted"] },
            tone: "hard",
            headline: "A better pitch for a proposal that was already thin.",
            detail:
              "You have made the document more persuasive without making it more true. The reviewers put their concerns in writing and stop arguing, which is worse than them arguing.",
            changed: ["A stronger pitch", "A documented internal objection you overrode"],
            effect: { dims: { win: 8, deliver: -7 }, flags: ["overrode_review"] },
          },
          {
            id: "m7b-sharpen-ok",
            tone: "mixed",
            headline: "The case is tighter. The gaps are the same size.",
            detail:
              "It is a better read than it was, and the underlying proposal has not changed. Since it was reasonably solid to begin with, that is a defensible use of a week.",
            changed: ["A more persuasive proposal", "The same underlying gaps"],
            effect: { dims: { win: 7, deliver: -2 } },
          },
        ],
      },
      {
        id: "o-trim-profit",
        title: "Protect the margin",
        icon: "coins",
        description: "Rework the commercial case so the numbers survive a bad month.",
        commits: "A smaller, more careful offer.",
        pros: ["Contingency restored", "Survives a surprise"],
        cons: ["Less to offer the client", "Reads as small"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m7b-trim",
            tone: "mixed",
            headline: "The numbers work. The proposal is smaller.",
            detail:
              "You have put slack back into the commercial case, which is the single most useful thing you can do for a programme that has not started. It also means offering less than the firm across town.",
            changed: ["Contingency restored", "A less ambitious offer"],
            effect: { dims: { profit: 10, win: -5, deliver: 3 }, flags: ["reviewed"] },
          },
        ],
      },
      {
        id: "o-defend",
        title: "Defend it as it stands",
        icon: "block",
        description: "Tell the review you have weighed this and you are comfortable.",
        commits: "You own the objections from here.",
        pros: ["Keeps the week", "Goes out on your terms"],
        cons: ["You own every gap", "Only right if you are right"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m7b-defend-earned",
            when: { all: ["ops_onside"], none: ["scope:heavy", "discounted"] },
            tone: "strong",
            headline: "You had the standing to say no, and you used it.",
            detail:
              "The reviewers were being careful, which is their job. Your proposal already has Operations inside it and a commercial case with room in it, so there was nothing to fix and a week to save.",
            changed: ["A week saved", "You backed your own judgement"],
            effect: { dims: { win: 4, profit: 4 }, badge: "held_nerve" },
          },
          {
            id: "m7b-defend-hubris",
            tone: "hard",
            headline: "You overruled the only people who had nothing to sell you.",
            detail:
              "The review had no interest in the pitch and no stake in the number. They read the document cold and told you what was wrong with it, and you decided you knew better.",
            changed: ["A week saved", "Every flagged gap is now yours"],
            effect: { dims: { deliver: -9, win: 2 }, flags: ["overrode_review"] },
            lesson: {
              principle: "Take the free advice from the people with nothing to sell you.",
              because:
                "The deal team wanted to win it and the reviewers did not care whether you did. That is precisely what made them worth listening to.",
              watchFor: "When you overrule a review, write down what you are betting will not happen.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "A week before signature buys more than a month after it.",
      because:
        "Whatever you spent the week on, it was cheap. The same fix during delivery costs a renegotiation, and the same gap left open costs a client.",
      watchFor: "The reviewers do not care whether you win. That is the whole value of them.",
    },
    next: "int-4",
  },

  /**
   * The beat the game did not have: the client decides.
   *
   * `docs/STRATEGY.md` already said it — "we have no 'did we win it?' beat at all; the
   * contract is signed inside m9's outcome prose". m9b is the SELLER's gate, do we take
   * it. Nothing anywhere adjudicated whether they wanted us, which is why Winability was
   * a one-way ratchet: it entered m9 at 83–100 and m10c at 97–100, and "You did not win
   * the work" fired on 0.15% of runs. A game in which a competently run pursuit always
   * wins teaches that competence converts. It does not, and losing well is most of the
   * job — which is the entire reason qualification discipline exists.
   *
   * So this is the award decision, and it can be lost. The loss is CAUSED, never rolled:
   * `m9a-lost` fires when the player never built a reason to be preferred — no evidence
   * of their own, Operations not brought inside, the problem never reframed, the rival's
   * gap never found — and their Winability is not high enough to carry them anyway. It
   * carries `next: "end"`, so the run stops here, as walking away does.
   *
   * The gate is on flags alone, deliberately. A first draft added `max: { win: 92 }` to
   * tune the rate down, which would have made this the first condition in the game to
   * read a meter — and `validate.ts` immediately warned that the sweep's dedup drops
   * dimensions, so coverage would have silently stopped being exhaustive. `analysis.ts`
   * can now bucket a gated dimension into the key, so the option is there; it is not
   * taken, because the flag clause alone fires on 18.6% of random runs and the target was
   * ~20%. The ceiling would have tuned it DOWN to 10.7%. Flag-only is both closer to the
   * mark and cheaper to reason about.
   *
   * `finalVerdict` does need a `lost` branch ahead of `walked_away`: a pursuit lost at the
   * award can end with Winability at 85 and everything else healthy, which the old
   * `win < 40` branch could never carry.
   *
   * It also pays two domain debts. Procurement existed only as weather — six mentions,
   * always acting from off-stage, never a person you could engage — so Declan Foyle has
   * a name and a mandate. And the price defence was always qualitative; `o-value` is the
   * first time the game lets the player argue from the client's own arithmetic, which is
   * how a premium is actually defended.
   */
  {
    kind: "choice",
    id: "m9a",
    chapter: 4,
    stage: "deal",
    title: "Their decision, not yours",
    eyebrow: "The award",
    objective: "Give them a reason to prefer you that survives a scorecard.",
    minutes: 4,
    hero: "hero-boardroom",
    situation: [
      "Declan Foyle in procurement has a scorecard, a savings target and two other proposals.",
      "Sarah wants you. Sarah does not score the submissions.",
    ],
    variants: [
      {
        when: { none: ["evidenced", "ops_onside", "reframed", "knows:rival_gap"] },
        situation: [
          "Declan Foyle in procurement has a scorecard, a savings target and two other proposals.",
          "Read your own submission as he will: a capable firm proposing sensible work. Nothing in it says why it has to be you.",
        ],
      },
      {
        when: { all: ["ops_onside", "evidenced"] },
        situation: [
          "Declan Foyle in procurement has a scorecard, a savings target and two other proposals.",
          "You are the only bidder whose proposal names the systems that have to change and the people who own them. That is hard to score down.",
        ],
      },
    ],
    advisorLine: "Foyle is not the obstacle. He has a number to hit and nobody has helped him hit it.",
    advisor: RIYA_DEAL,
    consider: [
      "What is he actually comparing us against?",
      "Whose numbers is our case built from?",
      "Who loses if he picks us?",
    ],
    tip: "I have lost two of these to firms with a worse answer and a better-scored submission.",
    prompt: "Four ways to be chosen.",
    question: "How do you win the decision?",
    options: [
      {
        id: "o-value",
        title: "Build the case in their numbers",
        icon: "chart",
        description: "Returns cost Orion a known amount. Show what half of it is worth.",
        commits: "You are held to an arithmetic you wrote down.",
        pros: ["Scores on value", "Hard to argue with"],
        cons: ["Needs their data", "A number you must hit later"],
        cost: { time: 3, investment: 1 },
        outcomes: [
          {
            id: "m9a-lost-value",
            when: { none: ["evidenced", "ops_onside", "reframed", "knows:rival_gap"] },
            tone: "hard",
            headline: "Your arithmetic, their scepticism.",
            detail:
              "You have built a payback case out of numbers you assumed rather than numbers they gave you. Foyle marks it unevidenced and scores the cheaper bid higher. The award goes elsewhere.",
            changed: ["Not selected", "A quarter of pursuit cost written off"],
            effect: { dims: { win: -30, profit: -8 }, flags: ["lost"] },
            next: "end",
            lesson: {
              principle: "A value case built from your assumptions is a brochure. Built from theirs, it is an argument.",
              because:
                "You never had their complaint data, so every figure in the case was yours to defend and theirs to doubt. The cheaper bid did not have to be better, only harder to fault.",
              watchFor: "Before promising a payback, ask whose number the baseline is.",
            },
          },
          {
            id: "m9a-value-strong",
            when: { any: ["evidenced", "knows:real_pain"] },
            tone: "strong",
            headline: "You are the only bid with a number attached.",
            detail:
              "You show Foyle what the current failure costs from his own complaint data, and what removing half of it is worth. He does not have to like you. He has to justify a choice, and you have just written his justification for him.",
            changed: ["Selected", "A payback number now in the contract"],
            effect: { dims: { win: 12, profit: 4 }, flags: ["won", "outcome_based"], badge: "connected_dots" },
          },
          {
            id: "m9a-value-thin",
            tone: "mixed",
            headline: "A good case, lightly evidenced.",
            detail:
              "The structure is right and the baseline is soft. Foyle scores it above the cheapest bid and below where it could have been, and asks you to stand behind the number in writing.",
            changed: ["Selected", "Committed to a payback you estimated"],
            effect: { dims: { win: 6, profit: -2 }, flags: ["won", "outcome_based"] },
          },
        ],
      },
      {
        id: "o-criteria",
        title: "Ask for the criteria and re-cut",
        icon: "search",
        description: "Find out how it is being scored, then answer that.",
        commits: "A week spent answering their form rather than your pitch.",
        pros: ["Answers the real test", "Cheap to do"],
        cons: ["A week gone", "Reads as tactical"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m9a-lost-criteria",
            when: { none: ["evidenced", "ops_onside", "reframed", "knows:rival_gap"] },
            tone: "hard",
            headline: "You learn exactly how you lost.",
            detail:
              "Foyle sends the weightings, and they are unkind: forty percent on demonstrated delivery of comparable systems. You cannot manufacture that in a week, and the firm that can is already ahead of you.",
            changed: ["Not selected", "You know precisely why"],
            effect: { dims: { win: -28, profit: -4 }, flags: ["lost", "knows:criteria"] },
            next: "end",
            lesson: {
              principle: "Evaluation criteria are public if you ask. They are decisive whether you ask or not.",
              because:
                "Asking in the last week told you what asking in the first week would have changed. Nothing about the weightings was secret; you simply bid against an imagined test.",
              watchFor: "Ask how it will be scored before you decide what to write.",
            },
          },
          {
            id: "m9a-criteria-good",
            tone: "strong",
            headline: "You answer the test they are actually setting.",
            detail:
              "The weightings put more on operational continuity than on price. You already have Operations in the proposal, so the re-cut is a reordering rather than a rewrite. Foyle scores you first on two of four criteria.",
            changed: ["Selected", "You know how you were scored"],
            effect: { dims: { win: 10, profit: 1 }, flags: ["won", "knows:criteria"], badge: "good_question" },
          },
        ],
      },
      {
        id: "o-deliverer",
        title: "Put the delivery lead in the room",
        icon: "people",
        description: "Aisha answers their questions instead of you.",
        commits: "She will say what she actually thinks.",
        pros: ["Credible on delivery", "Nothing oversold"],
        cons: ["You lose control of the room", "She will not embellish"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m9a-lost-deliverer",
            when: { none: ["evidenced", "ops_onside", "reframed", "knows:rival_gap"] },
            tone: "hard",
            headline: "She is honest, and it costs you the deal.",
            detail:
              "Asked how the changes reach production, Aisha says truthfully that it depends on teams nobody has spoken to yet. It is the correct answer and it is the one Foyle scores down. The award goes to the bid that claimed certainty.",
            changed: ["Not selected", "Nothing was oversold"],
            effect: { dims: { win: -26, deliver: 4 }, flags: ["lost"] },
            next: "end",
            lesson: {
              principle: "Honesty in the room is only an asset if the homework behind it is done.",
              because:
                "Aisha could only describe the position you had actually built. Putting your most truthful person in front of the client is a strength when there is something to be truthful about, and an admission when there is not.",
              watchFor: "Before bringing delivery in, ask what they will have to admit.",
            },
          },
          {
            id: "m9a-deliverer-good",
            when: { any: ["ops_onside", "has:ops_workstream"] },
            tone: "strong",
            headline: "She names the three teams by name, and the room relaxes.",
            detail:
              "Aisha walks through how the changes reach production, which teams sign them off, and what she has already agreed with Marcus. Foyle stops asking about risk. It is the shortest scoring session of the three.",
            changed: ["Selected", "Delivery credibility established before signature"],
            effect: { dims: { win: 9, deliver: 6 }, flags: ["won"], badge: "held_nerve" },
          },
          {
            id: "m9a-deliverer-plain",
            tone: "mixed",
            headline: "Believable, and short of decisive.",
            detail:
              "She is straight about what is agreed and what is not. Foyle believes her, which is worth more than it looks, and still scores the incumbent higher on price.",
            changed: ["Selected", "Credible but not preferred on price"],
            effect: { dims: { win: 4, deliver: 3 }, flags: ["won"] },
          },
        ],
      },
      {
        id: "o-submit",
        title: "Submit it and let it be scored",
        icon: "clock",
        description: "The proposal is good. Stop selling and let procurement work.",
        commits: "Whatever is in the document is your whole case.",
        pros: ["No new commitments", "Respects their process"],
        cons: ["You find out with everyone else", "No reason to prefer you"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m9a-lost-submit",
            when: { none: ["evidenced", "ops_onside", "reframed", "knows:rival_gap"] },
            tone: "hard",
            headline: "Three capable proposals, and yours is the dearest.",
            detail:
              "With nothing to separate the bids on substance, Foyle separates them on price, which is what a scorecard does when every column is level. You are told on a Thursday, by email.",
            changed: ["Not selected", "Nothing in the submission said why it had to be you"],
            effect: { dims: { win: -32, profit: -6 }, flags: ["lost"] },
            next: "end",
            lesson: {
              principle: "If nothing distinguishes the bids, price decides. Price always decides by default.",
              because:
                "Every week of this pursuit was a chance to build a reason to be preferred, and the submission records how many of them you took. Respecting the process is not a substitute for giving it something to score.",
              watchFor: "Ask what is in the proposal that a competitor could not write.",
            },
          },
          {
            id: "m9a-submit-good",
            when: { all: ["evidenced", "ops_onside"] },
            tone: "strong",
            headline: "It scores well without you in the room.",
            detail:
              "The proposal argues from their data and names the people who have to change, so it does not need you present to be persuasive. That is the test of a document, and it passes it.",
            changed: ["Selected", "Won on the document alone", "Nothing promised beyond the proposal"],
            /* Deliverability, because submitting creates no obligation the other three do:
               `o-value` commits to a payback figure, `o-criteria` to a re-cut, `o-deliverer`
               to whatever Aisha said in the room. Delivery starts from a clean sheet. That
               is the honest upside of not selling harder, and without it this option lost
               to the other three on all three dimensions in 76–85% of reachable states. */
            effect: { dims: { win: 8, profit: 3, deliver: 4 }, flags: ["won"] },
          },
          {
            id: "m9a-submit-plain",
            tone: "mixed",
            headline: "You win it, narrowly, on Sarah's preference.",
            detail:
              "Foyle scores the bids close to level and Sarah's recommendation carries it. You have the work and you have learned nothing about why, which is a poor position to be in next time.",
            changed: ["Selected", "Won on the sponsor's preference, not the scorecard"],
            effect: { dims: { win: 3, deliver: 4 }, flags: ["won"] },
          },
        ],
      },
    ],
    lesson: {
      principle: "A client does not choose the best proposal. They choose the one they can defend choosing.",
      because:
        "Somebody has to justify this in writing to people who were never in the room. Everything that makes that easy for them — their own numbers, a named owner for every change, a criterion you score first on — is worth more than another page about your capability.",
      watchFor: "Ask who has to defend this decision internally, and what you have given them.",
    },
    next: "m9b",
  },

  /**
   * PRD M17 — the deal decision, and the reason it has to exist:
   *
   *   "Walking away must sometimes be a good decision. Otherwise the game teaches:
   *    Always accept the contract." (p. 132)
   *
   * So walking away is genuinely strong when the deal has become bad, and genuinely
   * costly when it has not. `m9b-walk-right` and `m9b-walk-wrong` are the same action
   * with opposite verdicts, decided entirely by what the player did earlier.
   */
  {
    kind: "choice",
    id: "m9b",
    chapter: 4,
    stage: "deal",
    title: "Do we take it?",
    eyebrow: "The last gate",
    objective: "Decide whether this is a deal worth signing.",
    minutes: 4,
    hero: "hero-negotiation",
    situation: [
      "Everything is agreed. Nothing is signed.",
      "Sarah’s board has the date. Your reviewers have their concerns in writing.",
    ],
    variants: [
      {
        when: { any: ["discounted", "thin_mitigation"], all: ["risk_accepted"] },
        situation: [
          "Everything is agreed. Nothing is signed.",
          "Look at what this has become: margin given away to close a gap, and a risk the review flagged that nobody has funded. Somebody will deliver this, and it will not be the team that sold it.",
        ],
      },
      {
        when: { all: ["ops_onside", "evidenced"] },
        situation: [
          "Everything is agreed. Nothing is signed.",
          "This one is in good shape. Operations is inside the proposal, the argument came from their own data, and the commercial case has room in it. The only question left is whether you want the work.",
        ],
      },
    ],
    saidQuote: {
      text: "We are ready to sign. I would rather hear a problem from you now than in six months.",
      attribution: "Sarah Lim · Chief Transformation Officer, Orion Retail",
    },
    concerns: [
      "Everything after this is expensive to change",
      "Delivery inherits every sentence",
      "Procurement has already scheduled the kickoff",
    ],
    advisorLine: "I have signed things I should not have. Nobody ever remembers the deals you declined.",
    advisor: RIYA_DEAL,
    consider: [
      "Would we staff this ourselves?",
      "What has the deal become since we started?",
      "Is saying no still available?",
    ],
    tip: "I have walked away from one deal in nine years. I think about it more than the ones I signed.",
    prompt: "Three ways to answer, and one of them ends it.",
    question: "What is your call?",
    options: [
      {
        id: "o-proceed",
        title: "Proceed as agreed",
        icon: "flag",
        description: "Sign it as it stands and get on with the work.",
        commits: "Everything in the document becomes a commitment.",
        pros: ["Momentum kept", "Relationship intact"],
        cons: ["Every gap is now contractual"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m9b-proceed-sound",
            when: { any: ["ops_onside", "evidenced", "reviewed"] },
            tone: "strong",
            headline: "Signed, and worth signing.",
            detail:
              "You are taking on work you understand, with the people who have to deliver it already involved. That is a better position than most teams are in on the day they sign.",
            changed: ["Contract signed", "Delivery starts from a position you built"],
            effect: { dims: { win: 6, profit: 2 }, flags: ["signed"] },
          },
          {
            id: "m9b-proceed-loaded",
            tone: "mixed",
            headline: "Signed, with everything you did not fix now written down.",
            detail:
              "The deal is real and so are its gaps. Nothing here is fatal on its own; the question is how many of them arrive in the same month.",
            changed: ["Contract signed", "The known gaps are now contractual"],
            effect: { dims: { win: 7, deliver: -3 }, flags: ["signed"] },
          },
        ],
      },
      {
        id: "o-modify",
        title: "Modify before signing",
        icon: "scale",
        description: "Reopen the two clauses you are least comfortable with.",
        commits: "A fortnight of delay and a slightly cooler client.",
        pros: ["Fixes it while it is cheap", "Honest about the risk"],
        cons: ["Delays the start", "Reopens a settled deal"],
        cost: { time: 2, investment: 2 },
        outcomes: [
          {
            id: "m9b-modify-trusted",
            when: { any: ["credibility", "ops_engaged", "evidenced"] },
            tone: "strong",
            headline: "She takes the call, because you have earned it.",
            detail:
              "Reopening a signed-in-principle deal is only survivable if the client believes you are doing it for the programme rather than for the margin. Sarah does not argue. Both clauses move.",
            changed: ["Two real risks removed before signature", "Two weeks lost"],
            effect: {
              dims: { deliver: 9, profit: 4, win: -2 },
              flags: ["signed", "reviewed"],
              badge: "smart_tradeoff",
            },
          },
          {
            id: "m9b-modify-cold",
            tone: "mixed",
            headline: "You get one of the two, and it costs you warmth.",
            detail:
              "Procurement treats a late change as an attempt to improve your position. You get the clause that matters most and drop the other to keep the deal moving.",
            changed: ["One risk removed", "The relationship is more transactional"],
            effect: { dims: { deliver: 5, win: -5 }, flags: ["signed"] },
          },
        ],
      },
      {
        id: "o-walk",
        title: "Walk away",
        icon: "block",
        description: "Tell them honestly that this one is not worth signing.",
        commits: "No contract, and the pursuit cost is gone for good.",
        pros: ["Protects your people", "They will remember the honesty"],
        cons: ["Nothing to show for the quarter", "The relationship cools"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m9b-walk-right",
            when: { any: ["risk_accepted", "thin_mitigation", "unanchored", "overrode_review"] },
            tone: "strong",
            headline: "You stopped something that was going to hurt.",
            detail:
              "This deal had accumulated a shape nobody would have chosen deliberately. Saying so cost you a quarter and saved you a year, and Sarah does not argue with a word of it.",
            changed: [
              "No contract, and no loss-making delivery",
              "Your people are free for work you can do well",
              "Sarah will call you about the next one",
            ],
            effect: {
              dims: { win: -18, profit: 16, deliver: 20 },
              flags: ["walked_away"],
              badge: "held_nerve",
            },
            lesson: {
              principle: "Walking away is a decision, not a failure to decide.",
              because:
                "By the time you looked at this honestly it had a discount, an unfunded risk and no route into production. Signing it would have been the easy call and the wrong one.",
              watchFor:
                "Before signing, ask whether you would staff this yourself. If the answer is no, say so while saying no is still cheap.",
            },
            next: "end",
          },
          {
            id: "m9b-walk-wrong",
            tone: "hard",
            headline: "You walked away from a deal that was fine.",
            detail:
              "Caution is not the same as judgement. This engagement was in decent shape — the people who had to deliver it were involved and the numbers worked — and you talked yourself out of a year of good work.",
            changed: [
              "No contract",
              "A quarter of pursuit cost written off",
              "A client who will be slower to call next time",
            ],
            effect: { dims: { win: -22, profit: -6, deliver: 8 }, flags: ["walked_away"] },
            lesson: {
              principle: "Discipline and timidity look identical until you check the position.",
              because:
                "Walking away is right when the deal has become bad. This one had not — you refused work you could have delivered well.",
              watchFor: "Before you decline, name the specific thing you are unwilling to carry.",
            },
            next: "end",
          },
        ],
      },
    ],
    lesson: {
      principle: "Signing is a decision, and so is not signing.",
      because:
        "Everything before this was reversible. The signature is the line after which the promises belong to somebody else.",
      watchFor: "A pursuit accumulates concessions. Nobody ever decides to end up where you ended up.",
    },
    next: "int-5",
  },

  /** PRD M18 — the capacity problem. */
  {
    kind: "choice",
    id: "m10b",
    chapter: 5,
    stage: "delivery",
    title: "Two people short",
    eyebrow: "Capacity",
    objective: "Resource the programme you actually sold.",
    minutes: 3,
    hero: "solution-workshop",
    situation: [
      "The plan needs two more people than the firm has spare. One of your best is being pulled onto a bigger account and the replacement is available in six weeks.",
    ],
    advisorLine: "I can staff this with the people who exist, or the people in the plan. Not both.",
    advisor: AISHA,
    consider: [
      "Who actually has to be senior here?",
      "What happens to the rest of the firm?",
      "Does the client need to know?",
    ],
    tip: "The two graduates are good. They are also going to need someone, and that someone is you.",
    prompt: "Somebody is going to be disappointed.",
    question: "How do you staff it?",
    options: [
      {
        id: "o-juniors",
        title: "Staff it with juniors and supervise",
        icon: "people",
        description: "Two graduates plus more of your own time reviewing their work.",
        commits: "Your attention, for the whole programme.",
        pros: ["Available now", "Cheap"],
        cons: ["Slower and more rework", "Costs your attention"],
        cost: { time: 3, investment: 1 },
        outcomes: [
          {
            id: "m10b-juniors-held",
            when: { any: ["has:training", "ops_onside"] },
            tone: "strong",
            headline: "It works, because the scaffolding was already there.",
            detail:
              "Juniors on a programme with a training workstream and an engaged client team is a development opportunity. On a programme without either it is a risk. You had one.",
            changed: ["Fully staffed", "Your time is committed to reviewing"],
            effect: { dims: { deliver: 5, profit: 6, win: -1 } },
          },
          {
            id: "m10b-juniors-thin",
            tone: "mixed",
            headline: "Staffed, slower, and leaning on you.",
            detail:
              "The work gets done and the rework rate is what you would expect. Every review cycle runs through you, which means the programme now has a single point of failure and it is your calendar.",
            changed: ["Fully staffed", "Everything routes through you"],
            effect: { dims: { deliver: -2, profit: 7 } },
          },
        ],
      },
      {
        id: "o-contractors",
        title: "Bring in contractors",
        icon: "coins",
        description: "Two experienced people, available next week, at twice the rate.",
        commits: "Margin, and knowledge that leaves when they do.",
        pros: ["Experienced and immediate", "No ramp-up"],
        cons: ["Twice the rate", "The knowledge leaves with them"],
        cost: { time: 1, investment: 3 },
        outcomes: [
          {
            id: "m10b-contractors-broke",
            when: { any: ["discounted", "thin_mitigation"] },
            tone: "hard",
            headline: "You cannot fund the obvious answer. Again.",
            detail:
              "Contractors at twice the rate need a contract with room in it. This one has none, so you take one contractor instead of two and the plan quietly absorbs the difference.",
            changed: ["Half-staffed", "The contract is close to loss-making"],
            effect: { dims: { profit: -11, deliver: 1 } },
          },
          {
            id: "m10b-contractors",
            tone: "mixed",
            headline: "Staffed properly, and it shows in the numbers.",
            detail:
              "The programme has the people it needs from next week. It also has a cost base the commercial case did not anticipate, and in nine months nothing they learned will still be in the building.",
            changed: ["Properly staffed", "Margin reduced", "Knowledge will leave with them"],
            effect: { dims: { deliver: 8, profit: -8 } },
          },
        ],
      },
      {
        id: "o-slip",
        title: "Move the date",
        icon: "clock",
        description: "Wait six weeks for the right people and re-plan around it.",
        commits: "A date the client has already told their board.",
        pros: ["Right team, no compromise", "Nothing rushed"],
        cons: ["A date already announced", "Six weeks of nothing"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m10b-slip-ok",
            when: { any: ["credibility", "ops_onside", "evidenced"] },
            tone: "strong",
            headline: "They move the date, because you asked early.",
            detail:
              "Six weeks is a manageable conversation in month two and an impossible one in month five. Because you went early and had the standing to be believed, the plan moves and nothing else does.",
            changed: ["The right team", "The date moved with the client's agreement"],
            effect: { dims: { deliver: 9, profit: 3, win: -3 }, badge: "recovered" },
          },
          {
            id: "m10b-slip-cold",
            when: { any: ["promised:fast", "overrode_review"] },
            tone: "hard",
            headline: "That date was the reason they picked you.",
            detail:
              "Speed was the most attractive thing in your proposal, and the first thing you have done is ask for six more weeks. Sarah has to go back to a board that approved this on the timeline.",
            changed: ["The right team eventually", "The thing you sold on is gone"],
            effect: { dims: { win: -12, deliver: 6 } },
          },
          {
            id: "m10b-slip",
            tone: "mixed",
            headline: "Accepted, and noted.",
            detail:
              "The date moves without much drama. It does establish, in month two, that your plan was written for a team you did not have.",
            changed: ["The right team", "Six weeks late from the start"],
            effect: { dims: { deliver: 5, win: -6 } },
          },
        ],
      },
    ],
    lesson: {
      principle: "A plan is a set of assumptions about people.",
      because:
        "The programme was scoped as though the right people would be free. Whether that was optimism or an oversight, the delivery team is the one that finds out.",
      watchFor: "When you commit to a date, ask who specifically is going to be sitting there.",
    },
    next: "m10c",
  },

  /** PRD M19 — the unexpected situation. The one beat the player cannot plan for. */
  {
    kind: "choice",
    id: "m10c",
    chapter: 5,
    stage: "delivery",
    title: "Nobody planned for this",
    eyebrow: "The unexpected",
    objective: "Respond to something outside the plan.",
    minutes: 3,
    hero: "solution-in-store-tech",
    situation: [
      "Sarah is leaving. She has taken a bigger role elsewhere and finishes in three weeks.",
      "Your sponsor, your budget holder and the person who believed in this are all the same person.",
    ],
    variants: [
      {
        when: { all: ["ops_onside"] },
        situation: [
          "Sarah is leaving. She finishes in three weeks, and she was your sponsor, your budget holder and your advocate.",
          "One thing is in your favour: Marcus Reed's team is already inside this programme, and Marcus is not going anywhere.",
        ],
      },
      {
        when: { all: ["outcome_based"] },
        situation: [
          "Sarah is leaving in three weeks.",
          "She is also the person who agreed that a third of your fee depends on a fall in support contacts. Her successor will inherit that clause without having agreed to it.",
        ],
      },
    ],
    saidQuote: {
      text: "I have told them this programme matters. After that it is not in my hands, and my successor will make their own mind up.",
      attribution: "Sarah Lim · Chief Transformation Officer, Orion Retail",
    },
    concerns: [
      "The budget holder is leaving",
      "Nobody else has publicly backed this",
      "A new sponsor will want their own priorities",
    ],
    advisorLine: "I have had two sponsors leave mid-programme. The one that survived had three names on it.",
    advisor: AISHA,
    consider: [
      "Who else already has a stake in this?",
      "What would a new sponsor cancel first?",
      "What can we prove in three weeks?",
    ],
    tip: "Marcus is not going anywhere. Whether that helps depends on what you did in chapter three.",
    prompt: "Three weeks before the room changes.",
    question: "What do you do with the three weeks?",
    options: [
      {
        id: "o-broaden",
        title: "Broaden the base",
        icon: "people",
        description: "Get the programme owned by three people instead of one.",
        commits: "Three weeks of politics instead of delivery.",
        pros: ["Survives any one departure", "Builds real advocates"],
        cons: ["Three weeks not delivering", "Slower decisions afterwards"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m10c-broaden-ops",
            when: { any: ["ops_onside", "has:ops_workstream"] },
            tone: "strong",
            headline: "Marcus becomes the sponsor, and he was never going to leave.",
            detail:
              "The person best placed to own this was the one you brought inside the proposal months ago. What was a courtesy then is now the reason the programme survives a change of leadership.",
            changed: [
              "Ownership spread across three people",
              "Operations now sponsors the work it has to run",
            ],
            effect: {
              dims: { win: 9, deliver: 8 },
              flags: ["broad_base"],
              badge: "connected_dots",
            },
          },
          {
            id: "m10c-broaden-cold",
            tone: "mixed",
            headline: "You find two names. Neither of them is invested.",
            detail:
              "Three weeks of introductions produces two people who will not block the programme. That is not the same as two people who will defend it, and you are starting those relationships from nothing at the worst possible moment.",
            changed: ["Two more names attached", "Neither of them owns it"],
            effect: { dims: { win: 3, deliver: 1 } },
          },
        ],
      },
      {
        id: "o-prove-fast",
        title: "Get something live before she goes",
        icon: "rocket",
        description: "Ship whatever is demonstrable while the sponsor is still there.",
        commits: "Three weeks of pressure on the delivery team.",
        pros: ["A result on the record", "Hard to cancel a working thing"],
        cons: ["Rushed and partial", "Costs the team"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m10c-prove-ready",
            when: { any: ["has:data", "promised:fast"] },
            tone: "strong",
            headline: "Something real goes live, and it outlives her.",
            detail:
              "You had the foundations to move quickly, so three weeks was enough to put a working thing in front of the business. A new sponsor can cancel a plan easily. Cancelling something that already works is a much harder meeting.",
            changed: ["A live result on the record", "The team is tired"],
            effect: { dims: { win: 10, deliver: 2, profit: -3 } },
          },
          {
            id: "m10c-prove-thin",
            tone: "hard",
            headline: "You ship a demo and it convinces nobody.",
            detail:
              "Three weeks was not enough to stand anything up properly, so what goes in front of Sarah is a prototype with the difficult parts stubbed out. Her successor reads it as a programme with nothing to show after five months.",
            changed: ["Something shipped", "It made the programme look weaker, not stronger"],
            effect: { dims: { win: -8, deliver: -5, profit: -2 } },
          },
        ],
      },
      {
        id: "o-handover",
        title: "Write the handover she needs",
        icon: "layers",
        description: "Give Sarah the document that makes the case without her in the room.",
        commits: "It works only if somebody reads it.",
        pros: ["Cheap and honest", "Survives on its own terms"],
        cons: ["Only as good as its reader", "No advocate behind it"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m10c-handover-evidenced",
            when: { any: ["evidenced", "has:data"] },
            tone: "strong",
            headline: "The case stands up without anybody selling it.",
            detail:
              "Because the programme was argued from Orion's own evidence in the first place, the handover is a page of their data and what has changed since. A new sponsor reading that cold has very little to disagree with.",
            changed: ["A case that survives on paper", "No advocate, but no argument either"],
            effect: { dims: { win: 6, deliver: 3, profit: 2 } },
          },
          {
            id: "m10c-handover-thin",
            tone: "mixed",
            headline: "A good document, waiting for a reader who cares.",
            detail:
              "It is honest and clear and it costs you almost nothing. It also relies entirely on somebody new choosing to back a programme they did not start, on the strength of a handover note.",
            changed: ["The case is written down", "Nobody is carrying it"],
            effect: { dims: { win: -2, profit: 3 } },
          },
        ],
      },
    ],
    lesson: {
      principle: "Relationships are infrastructure, and single points of failure are real.",
      because:
        "Nothing about the work changed. One person left, and the programme's future changed with them — because its future was attached to that one person.",
      watchFor: "Sponsors move roughly every eighteen months. Programmes rarely finish faster than that.",
    },
    next: "end",
  },

  { kind: "ending", id: "end" },
];

export const story: Content = {
  startNodeId: "setup",
  missionOrder: [
    "m1",
    "m2",
    "m3",
    "m4",
    "m5",
    "m5b",
    "m6",
    "m6b",
    "m7",
    "m7b",
    "m8",
    "m9",
    "m9a",
    "m9b",
    "m10",
    "m10b",
    "m10c",
  ],
  chapters: [
    {
      number: 1,
      label: "Find client",
      title: "Find the right client",
      missionIds: ["m1", "m2", "m3"],
      steps: ["Choose a client", "Learn what matters", "Get in the room"],
    },
    {
      number: 2,
      label: "Opportunity",
      title: "Make it an opportunity",
      missionIds: ["m4", "m5", "m5b"],
      steps: ["Qualify the lead", "Answer the market", "Prioritise the work"],
    },
    {
      number: 3,
      label: "Solution",
      title: "Build the response",
      missionIds: ["m6", "m6b", "m7", "m7b"],
      steps: ["Define the problem", "Find another way", "Assemble the offer", "Clear the review"],
    },
    {
      number: 4,
      label: "Deal",
      title: "Make the deal work",
      missionIds: ["m8", "m9", "m9a", "m9b"],
      steps: [
        "Handle the price",
        "Face the risk review",
        "Win the decision",
        "Take it or leave it",
      ],
    },
    {
      number: 5,
      label: "Delivery",
      title: "Deliver the promise",
      missionIds: ["m10", "m10b", "m10c"],
      steps: ["Month five", "Two people short", "The unexpected"],
    },
  ],
  nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
};
