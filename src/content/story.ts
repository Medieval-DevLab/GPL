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
      "Is the biggest number the best opportunity?",
      "What does being wrong cost us?",
    ],
    tip: "There is no perfect client. Weigh what they need against what you can demonstrate.",
    prompt: "Each is a different bet. One team, one pursuit.",
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
    advisor: PRIYA,
    consider: [
      "What could change our mind?",
      "Who has not been in the room, and why?",
      "Is the ask the same as the problem?",
    ],
    tip: "Spend questions on what could change your answer, not what confirms it.",
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
        "When information is limited, spend it on what could change your mind — not on what confirms it.",
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
    advisor: PRIYA,
    consider: [
      "Do we need attention, access, or credibility?",
      "Who exactly are we trying to move?",
      "Would this work if we knew nothing about them?",
    ],
    tip: "Reach, access and credibility are three different goals. Pick the one you need first.",
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
    tip: "No single right answer. Weigh the value against what you would risk to chase it.",
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
      watchFor: "Ask what it would cost to be wrong about this one.",
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
    advisor: RIYA,
    consider: [
      "What changed — the facts, or the noise?",
      "Can we name what their offer misses?",
      "What does silence cost us?",
    ],
    tip: "React to everything and you look panicked. React to nothing and you look absent.",
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
      watchFor: "Ask what actually changed — the facts, or just the noise.",
    },
    next: "int-3",
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
    tip: "A brief describes the symptom they can see. That is not always where the damage is.",
    prompt: "Everything after this serves the problem you name here.",
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
      watchFor: "Ask what evidence you would need before you are allowed to disagree with the brief.",
    },
    next: "m7",
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
    tip: "Everything in a proposal is a promise somebody else has to keep.",
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
        dims: { deliver: 13, win: 1 },
        flags: ["has:ops_workstream"],
      },
      {
        id: "c-training",
        title: "Staff training and adoption",
        description: "Make sure the people who use it every day actually do. Cheap and effective.",
        tag: "Adoption",
        dims: { deliver: 7, win: 2, profit: 1 },
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
        "Every component you chose made the proposal more attractive, harder to deliver, or less profitable. There was no option that did all three well — that is not a flaw in the choices, it is the actual job.",
      watchFor: "Notice which parts of a proposal exist to win it, and which exist to survive it.",
    },
    next: "int-4",
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
    tip: "A discount is spent twice — once to win the work, and again when delivery needs it.",
    prompt: "Every route to their number costs you something.",
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
              any: ["evidenced", "ops_onside", "reframed", "knows:rival_gap"],
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
            effect: { dims: { profit: 4, win: 4, deliver: -6 }, flags: ["descoped"] },
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
    tip: "Risk is cheapest before you sign. Everything after that costs more.",
    prompt: "Cheaper to handle now than in month five.",
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
            effect: { dims: { deliver: 9, win: -6, profit: 3 }, flags: ["descoped"] },
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
    next: "int-5",
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
    tip: "Whatever is on the table now was decided long before anyone started building.",
    prompt: "Whatever is on the table was decided months ago.",
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
    next: "end",
  },

  { kind: "ending", id: "end" },
];

export const story: Content = {
  startNodeId: "int-1",
  missionOrder: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10"],
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
      missionIds: ["m4", "m5"],
      steps: ["Qualify the lead", "Answer the market"],
    },
    {
      number: 3,
      label: "Solution",
      title: "Build the response",
      missionIds: ["m6", "m7"],
      steps: ["Define the problem", "Assemble the offer"],
    },
    {
      number: 4,
      label: "Deal",
      title: "Make the deal work",
      missionIds: ["m8", "m9"],
      steps: ["Handle the price", "Clear the review"],
    },
    {
      number: 5,
      label: "Delivery",
      title: "Deliver the promise",
      missionIds: ["m10"],
      steps: ["Month five"],
    },
  ],
  nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
};
