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
 * ON STAGING. Eleven beats are `presentation: "dialogue"` — m3, m5, m6, m7b, m8, m9, m9a,
 * m9b, m10, m10h, m10c — because on each of them the player is ANSWERING somebody who has
 * just spoken: a sponsor with a board, a procurement lead with a scorecard, a delivery lead
 * who inherits the sentences. Those carry a `say` line per option, which is the same choice
 * written as a reply, first person, twenty words at most, and it may describe what you are
 * doing but never what it will achieve. The other seven stay `console` on purpose: m1, m2,
 * m4, m5b, m6b, m7 and m10b are beats where the player is COMPARING — three clients, two
 * questions out of six, five workstreams and room for two — and columns that line up are
 * genuinely the right tool for that.
 *
 * ON REACTION. `advisorLine` is `string | ConditionalLine[]`, and ten beats use the list
 * form — m1, m2, m3, m4, m5, m5b, m6b, m9, m10b, m10h. First match wins and the entry
 * with no `when` is the fallback, so every branch is a whole utterance rather than a
 * template with a hole in it. The point of them is that a colleague should sound like
 * somebody who NOTICED: Priya knows where the last six weeks went, Riya knows whether
 * anyone has tested the brief she is about to fund, Aisha has read the commercial case.
 * The first of them is on beat one, because chapters one and two used to read identically
 * whatever the player knew.
 *
 * THE SPINE OF COMPOUNDING — what the player learns early changes what happens late:
 *    knows:ops_constraint  → M6 credibility, M7 the workstream that saves delivery, M9, M10
 *    knows:real_pain       → M3 lands, M6 defensible rather than lucky
 *    scope:heavy           → M9 risk severity, M10 crisis, the handover
 *    promised:fast         → M9 risk, M10 crisis, the handover
 *    discounted            → M10 no budget left to fix anything
 *    outcome_based         → M9 liability finding, and a number to unsay at the handover
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
  quote: "Not every lead is worth the same to us. I decide early where my people go.",
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

/* The client-side speakers, written once. Four hand-copied copies of Sarah's had already
   accumulated in the file; none had drifted yet, which is luck rather than a system. */
/* Roles without ", Orion Retail". There is exactly one client in this game and it is
   named on the same screen; the suffix cost a whole extra line in a 186px column. */
const SARAH = { speaker: "Sarah Lim", role: "Chief Transformation Officer" };
const MARCUS = { speaker: "Marcus Reed", role: "Operations Director" };
const FOYLE = { speaker: "Declan Foyle", role: "Procurement" };

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
        facsimile: "org",
        description: "You know people, and people take your call.",
        strengths: ["Trusted early", "Doors open"],
        tradeoff: "You are better at getting in the room than at proving what you can build.",
        flags: ["start:connector", "credibility"],
        dims: { win: 5 },
      },
      {
        id: "s-builder",
        title: "Builders",
        icon: "layers",
        facsimile: "proposal",
        description: "You have delivered this kind of work, and it shows.",
        strengths: ["Evidence to hand", "Delivery is real"],
        tradeoff: "You are better at showing the work than at selling it.",
        flags: ["start:builder", "has:data"],
        dims: { deliver: 5 },
      },
      {
        id: "s-challenger",
        title: "Challengers",
        icon: "scale",
        facsimile: "market",
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
    role: "chapter-open",
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
    /**
     * The first state-dependent prose in the game, and it arrives on beat one.
     *
     * Chapter 0 is the only thing that has happened yet, so this is the only thing there
     * is to notice — and noticing it is the point: Priya is looking at the same three
     * names the player is, and weighing them against the team she has actually been
     * given. Two branches plus the fallback rather than three `when` clauses, because
     * there are exactly three advantages and an unreachable fallback is dead content; the
     * Builders line is the one that carries it. If a fourth advantage is ever added, this
     * is the sentence that will need re-reading.
     */
    advisorLine: [
      {
        when: { all: ["start:challenger"] },
        text: "You read markets. Read these three and tell me which one we could actually take.",
      },
      {
        when: { all: ["start:connector"] },
        text: "People take your call, which gets us a meeting. It does not tell us whose.",
      },
      /* A question, like the other two. This one read "Find the one where that is the
         whole argument", so of the three starting strengths the Builders were the one
         being told what to pick. */
      { text: "You have delivered work like this. Which of the three would let that be the whole argument?" },
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
        facsimile: "complaints",
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
            effect: { dims: { win: 4, profit: 2 }, flags: ["client:northwind"] },
          },
        ],
      },
      {
        id: "o-apex",
        title: "Apex Industrial",
        icon: "layers",
        facsimile: "timeline",
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
              dims: { win: -4, profit: -2, deliver: 4 },
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
              dims: { win: -8, profit: -3, deliver: 4 },
              flags: ["client:northwind", "late_start", "knows:rivals"],
            },
            lesson: {
              principle: "The biggest number on the table is not automatically the one I would send us after.",
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
        facsimile: "clause",
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
              dims: { profit: -5, win: -2, deliver: 3 },
              flags: ["client:northwind", "spent_effort"],
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "I look for the overlap between what they need and what we can prove. That is all fit means.",
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
    /* Was `hero-storefront-wide`, which was BYTE-IDENTICAL to this file — two beats
       establishing two different places from one photograph, under two names. Repointed
       and the duplicate deleted, so the repo stops claiming seven distinct heroes while
       shipping six. m2 wants its own plate; `docs/ASSET-MANIFEST.md` specifies it. */
    hero: "hero-retail-exterior",
    situation: [
      "Orion's brief is one line: “improve the customer experience across our stores”.",
      "You can dig into two things. Not five. Choosing what to ignore is the job.",
    ],
    client: ORION,
    /* She watched where the last six weeks went, and says so. The fallback is the line
       this beat has always carried, which is the right one when nothing was spent. */
    advisorLine: [
      {
        when: { any: ["late_start"] },
        text: "We have already lost six weeks at Apex. Two questions is what that leaves us.",
      },
      {
        when: { any: ["spent_effort"] },
        text: "A month in Meridian's procurement taught us nothing about Orion. Start where we are blind.",
      },
      { text: "I would rather go in knowing one awkward thing than five comfortable ones." },
    ],
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
        /* The whole financial spine of the game starts on this card, and starts here
           deliberately: half a million contacts at roughly five pounds each is the only
           place the raw figures are introduced, and it is a thing the player SPENDS one
           of two questions to learn. Everything downstream — the value case at m9a, the
           premium defence at m8, the payback clause — is arithmetic on these two
           numbers and adds none of its own. Round rather than precise, because
           "roughly five pounds" is a credible estimate and "£5.14" is a fabrication. */
        reveals:
          "Store experience barely registers. The complaints are overwhelmingly post-purchase — deliveries that arrive late, returns that take three weeks, support that cannot see the order. Their service team handles about half a million of these a year, at roughly five pounds a contact to answer. The shop floor is not the problem.",
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
        effect: { dims: { win: 5, deliver: 4 }, badge: "good_question" },
      },
      {
        id: "m2-ops",
        when: { all: ["knows:ops_constraint"] },
        tone: "strong",
        headline: "You have found the person who can stop this.",
        detail:
          "Sarah holds the budget, but Operations holds the systems. Most teams pitching this account will not discover that until they are already committed to a shape of solution.",
        changed: ["You know where the real constraint sits"],
        effect: { dims: { deliver: 5, win: 2 }, badge: "good_question" },
      },
      {
        id: "m2-pain",
        when: { all: ["knows:real_pain"] },
        tone: "strong",
        headline: "You have found the real problem.",
        detail:
          "They asked about the store experience. The evidence says the damage is happening after the sale. That gap between the stated request and the actual problem is where the work is.",
        changed: ["You know what is actually hurting them"],
        effect: { dims: { win: 5, profit: 2 }, badge: "good_question" },
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
        effect: { dims: { win: 1 } },
        lesson: {
          principle: "The question worth asking is usually the one nobody in that room has asked yet.",
          because:
            "Competitive and budget information tells you about the race. It does not tell you what is actually wrong, or who has to agree before anything can change.",
          watchFor: "Ask yourself who has not been in the room — and why.",
        },
      },
    ],
    lesson: {
      principle: "I settle what I need to know before I settle what to do. It saves a lot of reversing later.",
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
    presentation: "dialogue",
    /* Surface, mission by mission, and the split is not decorative: a `call` is live,
       multi-person and cannot be taken back, a `chat` is quick, internal and
       low-ceremony. Client-facing beats are calls — m5, m6, m8, m9a, m10c. The
       internal ones are chats — this beat, m7b, m9, m9b and month five, where the
       sponsor's line arrives relayed rather than in the room. `thread` is authored
       nowhere and rendered nowhere; see src/ui/dialogue.tsx. */
    surface: "chat",
    client: ORION,
    /* What the two questions bought, named by the person who told you to spend them. The
       first branch is the only place in chapter one where Marcus Reed's name is said out
       loud by our own side, and it is said only to the player who found him. */
    advisorLine: [
      {
        when: { all: ["knows:real_pain", "knows:ops_constraint"] },
        text: "You know the pain and you know who owns the systems. Decide who you want in the room.",
      },
      {
        when: { all: ["knows:ops_constraint"] },
        text: "You found Marcus. Nobody else pitching this has. First contact decides who hears it.",
      },
      {
        when: { all: ["knows:real_pain"] },
        /* Was "It is the one thing here they have not read in a pitch", which ranks the
           option set — and only one option can use that flag, so "the one thing here"
           was a star beside it. The fact about the client stays; the ranking goes. */
        text: "You have their complaint data. Nobody else pitching this account has read it.",
      },
      { text: "First contact sets what they think we are. It is very hard to move afterwards." },
    ],
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
        facsimile: "proposal",
        description: "A short, specific piece on what is going wrong for retailers like them.",
        say: "Then I want the first thing they read to be about their problem, not our capabilities.",
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
              dims: { win: 6, deliver: 3 },
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
            effect: { dims: { win: 3 } },
          },
        ],
      },
      {
        id: "o-direct",
        title: "Go straight to the sponsor",
        icon: "talk",
        facsimile: "org",
        description: "A warm introduction, thirty minutes with the sponsor, the case made in person.",
        say:
          "Then I use the warm introduction now and make the case to Sarah myself. Thirty minutes, one shot.",
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
            effect: { dims: { win: 5, deliver: 3 }, flags: ["ops_engaged", "credibility"] },
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
              dims: { win: 4, deliver: -3 },
              flags: ["knows:ops_constraint", "learned_late"],
            },
          },
        ],
      },
      {
        id: "o-campaign",
        title: "Run a broad campaign",
        icon: "megaphone",
        facsimile: "market",
        description: "Put a retail transformation campaign into the market and let interest come.",
        say: "I would rather not bet it all on one meeting. Put it in the market and see who answers.",
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
              "The campaign performs well by every measure you would put in a report. It generates conversations with people who are interested but cannot buy, and one lukewarm reply from an Orion manager two levels below the sponsor.",
            changed: [
              "A lot of activity",
              "Barely any progress on the account you chose",
              "Your senior people stayed free for other work",
            ],
            effect: { dims: { win: 1, profit: 3 } },
            lesson: {
              principle: "Reach is easy to count, which is why we keep mistaking it for relevance.",
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
      principle: "How we go in has to match what we want out of it. That is one decision, not two.",
      because:
        "Broad reach, direct access and a sharp point of view are three different tools. Which one is right depends on whether you need attention, a decision, or credibility.",
      watchFor: "Ask what you actually need from the next conversation before choosing how to start it.",
    },
    next: "deb-1",
  },

  /**
   * The chapter debriefs.
   *
   * One line each, and one line only. The rest of the screen is the player's own history
   * for the chapter — what they chose, what tone it landed on, which sibling branch never
   * fired — which the renderer derives from state. What cannot be derived is a sentence
   * naming what the chapter was FOR, so that is what is authored here.
   *
   * None of them congratulates. A debrief that reports only the good half is a scoreboard.
   */
  {
    kind: "interlude",
    id: "deb-1",
    role: "chapter-debrief",
    chapter: 1,
    eyebrow: "Chapter one, closed",
    title: "Three names, one team",
    body: [
      "Three clients wanted a partner and you could back one. What you know about Orion is what you bought by not chasing the others.",
    ],
    next: "int-2",
  },

  /* ══════════════════════════ CHAPTER 2 ══════════════════════════ */
  {
    kind: "interlude",
    id: "int-2",
    role: "chapter-open",
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
    eyebrow: "Worth chasing?",
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
    /* Riya decides where her people go, so what she notices here is how much of the
       problem somebody has already tested. The middle branch is the whole of chapter one
       coming back: if the player bought neither the complaints nor the constraint, she
       says so before they commit six weeks of her team. */
    advisorLine: [
      {
        when: { any: ["ops_engaged"] },
        text: "Operations is already in the room. That is the part that usually costs us three months.",
      },
      {
        when: { none: ["knows:real_pain", "knows:ops_constraint"] },
        text: "Nobody has tested that one-line brief yet, and you are about to put a price on it.",
      },
      { text: "I have six people. Tell me how many of them this is worth, and for how long." },
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
            effect: { dims: { win: 5, profit: -4 } },
          },
          {
            id: "m4-pursue-blind",
            tone: "mixed",
            headline: "You are committed, and you are still guessing.",
            detail:
              "The team is working hard on a proposal built from a one-line brief. Every assumption in it is yours, not theirs, and several of them are going to be wrong.",
            changed: ["Significant effort committed", "Built on assumptions you have not tested"],
            effect: { dims: { win: 3, profit: -6, deliver: -3 } },
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
              dims: { profit: 3, deliver: 3, win: -2 },
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
              dims: { profit: 6, deliver: 5, win: -2 },
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
            effect: { dims: { profit: 7, deliver: 3, win: -7 }, flags: ["landed_small"] },
            lesson: {
              principle: "Turning down the wrong shape of work is a decision I have had to defend, and I would defend it again.",
              because:
                "Declining cost you momentum and bought you a better-defined problem. Whether that trade was right depends on how badly you needed the win.",
              watchFor: "Notice when you are bidding on something nobody has actually defined yet.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "I cannot give every lead the same amount of my team, so I decide early which one gets it.",
      because:
        "Qualifying is deciding how much to risk before you know whether you will win. Commit too early and you spend your best people on a guess; commit too late and someone else is already in front of the client.",
      watchFor: "Six weeks of your best people is the most expensive thing you can spend without approval.",
    },
    next: "turn-rival",
  },

  /**
   * The three story turns.
   *
   * Moments done TO the player, which is the whole definition of the type: the rival
   * announces, the panel decides, the sponsor leaves. None of them can be altered, so none
   * of them is staged as though it could be — no options, no gate, nothing to commit.
   *
   * They are written as reports of things that have already happened somewhere else. A
   * turn that describes a choice is a decision wearing a cut scene's clothes.
   */
  {
    kind: "interlude",
    id: "turn-rival",
    role: "turn",
    chapter: 2,
    eyebrow: "Tuesday, 07:00",
    title: "Somebody else announces first",
    body: [
      "A competitor put out a press release at seven in the morning. They have partnered with a retail technology vendor whose name everyone in the sector knows.",
      "By eleven there was a launch event with a stage and a storefront demo running on a loop. By one, three people inside Orion had forwarded it to each other.",
      "None of it mentions Orion by name. It did not have to. Sarah's board had seen it by lunchtime, and two of them sent it to her.",
    ],
    prompt: "The vendor's logo is on that slide. Yours is not.",
    next: "m5",
  },

  {
    kind: "choice",
    id: "m5",
    chapter: 2,
    stage: "opportunity",
    title: "Someone else moves",
    eyebrow: "They are not alone",
    objective: "React to a competitor changing the race.",
    minutes: 4,
    hero: "hero-client-meeting",
    situation: [
      "A rival announces a partnership with a well-known retail technology vendor. Press release, launch event, glossy storefront demo.",
      "Your sponsor forwards it with four words: “should we be worried?”",
    ],
    presentation: "dialogue",
    surface: "call",
    saidQuote: {
      text: "We like your perspective, but this looks impressive and my board has already seen it. Help me understand how you are different.",
      ...SARAH,
    },
    concerns: [
      "A recognisable vendor name attached",
      "A demo that is easy to show a board",
      "Your difference has not been stated plainly",
    ],
    /* A press release is easier to answer when somebody already did the reading, and
       harder to be frightened by from inside a paid engagement. Both branches are things
       the player bought in the two beats before this one. */
    advisorLine: [
      {
        when: { any: ["knows:rivals"] },
        text: "You already know who that vendor is. Most people reacting to this today do not.",
      },
      {
        when: { any: ["has_access"] },
        text: "We are inside on a paid discovery. A press release does not change what we can see.",
      },
      { text: "Something changed in the market. Whether it changed anything real is your call." },
    ],
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
        say: "I would rather not answer that today. Let me find out what they have actually sold you.",
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
            effect: { dims: { win: 5 }, flags: ["knows:rival_gap"], badge: "connected_dots" },
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
            effect: { dims: { win: 1 }, flags: ["knows:rival_gap"] },
          },
        ],
      },
      {
        id: "o-accelerate",
        title: "Get in front of them now",
        icon: "rocket",
        description: "Book the meeting and make your case before the story settles.",
        say: "Give me thirty minutes this week and I will answer that in person, not in a document.",
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
            effect: { dims: { win: 3, deliver: -2 } },
          },
        ],
      },
      {
        id: "o-reframe",
        title: "Change the question",
        icon: "scale",
        description: "Move the conversation to the part of the experience their offer cannot reach.",
        say:
          "Their demo is a shopfront. Ask them what happens to your customer three weeks after she buys something.",
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
            effect: { dims: { win: 8, profit: 3 }, flags: ["reframed"], badge: "adapt" },
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
        say: "Nothing has actually shipped yet. I am not going to redraw our plan around a press release.",
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
            effect: { dims: { win: 1, profit: 3 }, badge: "held_nerve" },
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
              principle: "Sitting still was a decision too. I have watched that cost as much as moving.",
              because:
                "Holding your plan is right when you have the standing to absorb the hit. Without that, silence hands your competitor the definition of the problem.",
              watchFor: "Ask whether you are holding your nerve or simply hoping.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "When the ground moves, somebody has to say out loud whether the plan still fits it.",
      because:
        "A competitor's move is information, and this one was. Reacting to all of it makes you thrash; reacting to none of it makes you irrelevant.",
      watchFor: "A press release is a claim about the future. It is not evidence that anything shipped.",
    },
    next: "refl-rival",
  },

  /**
   * The four reflection nodes.
   *
   * Each sits after its chapter's hardest beat, because recovery belongs after the blow
   * rather than before it. Neither response changes a flag, a dimension or a badge — this
   * is a breath, and the absent meters on the screen are what say so.
   *
   * The questions are Thiagi's debrief phases four and five, "how does this relate to the
   * real world?" and "what if?", which are the two where transfer actually happens and the
   * two a vendor course leaves out. So each prompt pulls OUT of Orion and into the
   * player's own working life, and both answers are honest — one of them is not the
   * grown-up one.
   */
  {
    kind: "interlude",
    id: "refl-rival",
    role: "reflection",
    chapter: 2,
    eyebrow: "A moment",
    title: "After the announcement",
    advisor: RIYA,
    body: ["Riya stays on the line after Sarah drops off."],
    prompt:
      "Somewhere you have worked, a competitor's announcement landed mid-plan. Did anyone change course, and were they right to?",
    responses: [
      "We changed everything, and it cost six weeks we never got back.",
      "We held the plan, and I still cannot say if that was nerve or stubbornness.",
    ],
    next: "m5b",
  },

  /* ══════════════════════════ CHAPTER 3 ══════════════════════════ */
  {
    kind: "interlude",
    id: "int-3",
    role: "chapter-open",
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
    eyebrow: "What is actually wrong",
    objective: "Choose the problem your proposal answers.",
    minutes: 4,
    hero: "hero-retail-interior",
    situation: [
      "The brief still says “improve the customer experience across our stores”.",
      "Everything follows from how you read that sentence. Get it wrong and every good decision after it serves the wrong goal.",
    ],
    presentation: "dialogue",
    surface: "call",
    client: ORION,
    /*
     * The first time Marcus Reed says anything, in nineteen beats of being the reason
     * this programme can be stopped. Gated on `knows:ops_constraint`, which is set only
     * by asking who owns the systems at m2 — so the player who did the work hears from
     * the man himself, and the player who did not still does not know he exists.
     */
    quotes: [
      {
        when: { all: ["knows:ops_constraint"] },
        text: "Every programme like this arrives with a plan for my systems and none for my people. I have agreed to two of them. Ask me how those went.",
        ...MARCUS,
      },
    ],
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
        facsimile: "proposal",
        description: "A store and digital experience redesign. What the brief says.",
        say: "We answer the brief as written — stores and app. I am not going to tell Sarah she is wrong.",
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
            effect: { dims: { win: 1, profit: -4 }, flags: ["scope:storefront"] },
            lesson: {
              principle: "Answer exactly what was asked and we become easy to compare. Easy to compare is where price wins.",
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
        facsimile: "complaints",
        description: "Argue the damage happens after the sale — deliveries, returns, support.",
        say:
          "The damage is after the sale, not in the store. I would rather say so than flatter their brief.",
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
              dims: { win: 8, profit: 5 },
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
            effect: { dims: { win: 2, deliver: -2 }, flags: ["scope:postpurchase"] },
            lesson: {
              principle: "We were right. I have been right and lost anyway, so I stopped treating that as enough.",
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
        facsimile: "timeline",
        description: "A short diagnostic to establish which of the two problems is costing them.",
        say:
          "I am not betting this on my instinct. Six weeks to find out which problem is actually costing them.",
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
            effect: { dims: { deliver: 4, win: -3, profit: -2 }, flags: ["scope:diagnostic"] },
          },
        ],
      },
    ],
    lesson: {
      principle: "What they asked for and what they need are two different things here. Noticing that gap is our job.",
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
    eyebrow: "What you are selling",
    objective: "Pick three components. You cannot afford six.",
    minutes: 5,
    hero: "solution-workshop",
    situation: [
      "You have a shape. Every element you add makes the proposal more attractive and harder to deliver at the same time.",
    ],
    /**
     * Backlog 4.4. One of the two beats in the game that reacted to nothing, on a screen
     * where what the player already holds is the entire substance of the moment.
     *
     * A list rather than a `variant`, because nothing about the SITUATION changes — it is
     * three of six whatever happened, and the constraint is the beat. What changes is what
     * the document is being written against, and that is an observation a person makes.
     *
     * WHAT THESE DELIBERATELY DO NOT READ. `knows:ops_constraint` is half of
     * `m7-anchored`'s gate and there is a card on this screen called "Operations
     * integration workstream", so a colleague who mentions Marcus here is not reacting,
     * he is pointing — the same defect as the m10b line whose condition was character for
     * character its outcome's. `has:data` is in `m7-fast-thin`'s `none` for the same
     * reason. So Arjun reacts to commitments already made elsewhere — the outcome deal,
     * the partner, the fortnight inside the business — and says nothing about which three.
     */
    advisorLine: [
      {
        when: { any: ["outcome_based"] },
        text: "A third of the fee moves with the result now. I am reading this list as a plan, not a menu.",
      },
      {
        when: { any: ["has:partner"] },
        text: "The partner is in this now. Whatever goes in, somebody tells them on Monday which parts are theirs.",
      },
      {
        when: { any: ["has_access", "landed_small"] },
        text: "We have had a fortnight inside their business, so nothing on this list has to be guesswork.",
      },
      {
        text: "The three you leave out do not come back later. I would rather that was a decision than an accident.",
      },
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
        dims: { win: 5, deliver: -4 },
        flags: ["has:journey"],
      },
      {
        id: "c-platform",
        title: "Returns and support platform rebuild",
        description: "Replace the systems behind the actual complaints. Large, expensive, slow.",
        tag: "Heavy",
        dims: { win: 5, profit: -6, deliver: -9 },
        flags: ["scope:heavy"],
      },
      {
        id: "c-ops",
        title: "Operations integration workstream",
        description: "A stream to get changes into Operations' release schedule, with their people.",
        tag: "Unglamorous",
        dims: { deliver: 8, win: 1, profit: -5 },
        flags: ["has:ops_workstream"],
      },
      {
        id: "c-training",
        title: "Staff training and adoption",
        description: "Make sure the people who use it every day actually do. Cheap and effective.",
        tag: "Adoption",
        dims: { deliver: 5, win: 1, profit: -2 },
        flags: ["has:training"],
      },
      {
        id: "c-pilot",
        title: "An eight-week pilot",
        description: "Something live and demonstrable inside two months. Boards love this.",
        tag: "Fast",
        dims: { win: 6, deliver: -5, profit: -2 },
        flags: ["promised:fast"],
      },
      {
        id: "c-data",
        title: "Data and measurement foundation",
        description: "Instrument everything so improvement can be proven. Nobody pitches this.",
        tag: "Foundation",
        dims: { profit: 6, deliver: 3, win: -3 },
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
        effect: { dims: { deliver: 4, win: 3 }, flags: ["ops_onside"], badge: "connected_dots" },
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
          principle: "Every promise in there is a commitment somebody else has to keep, and it is usually Aisha's team.",
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
        effect: { dims: { win: 1, deliver: -3 }, flags: ["fragile_timeline"] },
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
        effect: { dims: { deliver: 2, profit: 2 } },
      },
    ],
    lesson: {
      principle: "I would rather argue about what we can build than what we can describe. Describing is cheap.",
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
    role: "chapter-open",
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
    eyebrow: "The number",
    objective: "Answer the price without giving away the margin.",
    minutes: 4,
    hero: "hero-negotiation",
    situation: [
      /* "Thirty percent above" was the whole of the price beat and it is an abstraction:
         the argument the player is about to have is with a gap, and a gap has a size.
         £2.6m against £2m keeps the committed thirty percent exactly and makes the
         number they are defending — six hundred thousand — sayable. */
      "Orion comes back. You are thirty percent above the alternative — £2.6m against their £2m — and procurement has said so in writing.",
      "Sarah still wants you. She needs something she can take to her board.",
    ],
    presentation: "dialogue",
    surface: "call",
    saidQuote: {
      text: "I am not asking you to be the cheapest. I am asking for something I can defend in a board meeting that has already seen a smaller number.",
      ...SARAH,
    },
    concerns: [
      "Procurement has the comparison in writing",
      "The board has seen the lower figure",
      "The difference between proposals is invisible",
    ],
    /**
     * Backlog 4.4, and the harder half of it.
     *
     * This is the beat where a steer turns into a recommendation fastest: four routes to
     * a number are on screen, and `m8-hold-strong` opens on `evidenced`, `ops_onside`,
     * `reframed` or `knows:rival_gap` while `m8-phase-good` opens on `has_access`,
     * `ops_onside`, `evidenced` or `landed_small`. A colleague conditioned on any of
     * those six is reading the answer key aloud three inches from the card it selects.
     * All six are therefore untouched here.
     *
     * What Riya reacts to instead is the shape the deal has already taken — a fee that
     * is partly conditional, a cost line that does not shrink because somebody asks, a
     * client who likes you. None of them nominates a route. The first two are facts
     * about cost, which is the half of a position the player is allowed to see; the
     * third is her correcting an assumption she has watched cost people money, which is
     * what a colleague with nine years of this is for.
     *
     * THE FIRST BRANCH IS THE POINT OF THE BEAT. `knows:budget` is bought at m2, with
     * one of the two slots in the investigation, and until this line existed it was
     * read by nothing: a player who spent a question on what the board had approved got
     * a paragraph of prose and no other part of the game ever behaved differently. It
     * sits first because this is the one screen where that answer is worth having, and
     * it is safe for the same reason the other six flags are not — a fixed ceiling does
     * not tell you whether to hold, cut, phase or come down, so the clause that says so
     * is doing load-bearing work rather than softening the line.
     */
    advisorLine: [
      {
        when: { any: ["knows:budget"] },
        text: "You asked what the board had actually approved. There is nothing behind that number, whichever way we answer them.",
      },
      {
        when: { any: ["outcome_based"] },
        text: "A third of this fee already moves with the result. Some of our price is conditional before we start.",
      },
      {
        when: { any: ["scope:heavy"] },
        text: "The platform rebuild is the biggest cost line I have signed off this year. Nothing said today makes it smaller.",
      },
      {
        when: { any: ["credibility"] },
        text: "They like us. I have watched that be worth a great deal in a room and nothing at all in a procurement file.",
      },
      { text: "Thirty percent is a number somebody has to explain upwards. The question is which of us ends up doing it." },
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
        say:
          "I am not moving. Give your board the two proposals side by side and let them see the difference.",
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
            /* `knows:rivals` used to be in this list, and it is granted by the
               "Challengers" pick on the first screen of the game — so a posture chosen
               before the player had met the client was enough to hold a 30% premium at
               mission 11, for the largest profit delta of the four options. Knowing a
               market is not knowing where this particular competitor is weak, which is
               what `knows:rival_gap` records. */
            when: {
              any: ["evidenced", "ops_onside", "reframed", "knows:rival_gap"],
              none: ["scope:storefront"],
            },
            tone: "strong",
            headline: "The difference is defensible, so the price holds.",
            detail:
              "You are not comparing like with like, and you can show it. The other proposal does not touch deliveries, returns or support, which is where the two and a half million a year of contact handling is going. Set six hundred thousand of difference against an operational saving twice that size every year and the premium stops being a premium. Procurement does not enjoy it, but Sarah now has a straight answer for her board.",
            changed: ["Full margin protected", "The comparison is neutralised"],
            effect: { dims: { profit: 10, win: 1 }, badge: "held_nerve" },
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
        say: "I will come down to their number. That money was our cushion, and I am spending it here.",
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
            effect: { dims: { win: 6, profit: -14 }, flags: ["discounted"] },
            lesson: {
              principle: "We spend a discount twice — once to win the work, and again when delivery comes asking where the money went.",
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
        say:
          "I can reach their number by taking work out. You would be defending a smaller programme, not a discount.",
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
            effect: { dims: { profit: 6, win: -2, deliver: 3 }, flags: ["descoped"] },
          },
        ],
      },
      {
        id: "o-phase",
        title: "Restructure it into phases",
        icon: "layers",
        description: "Smaller first phase, rest contingent on it working. Same total, different risk.",
        say:
          "Give your board a smaller first cheque. Same rate, same total — they commit to less in this meeting.",
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
            effect: { dims: { profit: 8, win: 5, deliver: 2 }, badge: "smart_tradeoff" },
          },
          {
            id: "m8-phase-thin",
            tone: "mixed",
            headline: "A clever structure on a shaky foundation.",
            detail:
              "Phasing is the right instinct. But you are asking them to trust that phase two will be worth it, and you have not yet given them much reason to believe that. They agree to phase one and reserve judgement.",
            changed: ["Deal moves forward", "Phase two is genuinely at risk"],
            effect: { dims: { profit: 5, win: 1 } },
          },
        ],
      },
    ],
    lesson: {
      principle: "A price is a position I have to hold for months, not a number we fill in tonight.",
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
    presentation: "dialogue",
    surface: "chat",
    variants: [
      /**
       * The liability finding, first because it outranks the others.
       *
       * All four findings below are FEASIBILITY findings — can we do this. A real
       * pre-signature review has two halves, and the second is the one that ends careers:
       * what happens to us if we don't. The content had zero occurrences of liability,
       * indemnity, cap, service credit, penalty, warranty or IP, so the game taught that
       * half does not exist — and `m9b`'s own `o-modify` offers to reopen "the two clauses
       * you are least comfortable with" without ever naming either, which is the content
       * conceding the gap.
       *
       * It fires on `outcome_based`, set when the player wins the award by committing to a
       * payback figure. That is the honest trigger: a number in a contract is an exposure,
       * and it is one they chose.
       */
      {
        when: { all: ["outcome_based"] },
        situation: [
          "Before signature it goes to internal quality and risk review.",
          "The finding is not whether you can build it. It is the payback figure you put in the proposal, which legal reads as a commitment and has attached a service credit to. Miss it and the fee reduces automatically, whatever the reason.",
        ],
      },
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
    /**
     * The one place a colleague reacts to the PRICE the player agreed.
     *
     * "Build in a mitigation" turns entirely on whether the money still exists, and until
     * now the deal team heard the same sentence from Aisha whether they had held the price
     * or funded the gap out of the contingency. She reads the commercial case; she would
     * mention it.
     */
    advisorLine: [
      {
        when: { all: ["discounted"] },
        text: "Before you promise me a fix, tell me what is left in the commercial case. I looked.",
      },
      {
        when: { any: ["ops_onside", "has:ops_workstream"] },
        text: "Marcus's stream absorbs most of that list. It is the two names nobody booked that worry me.",
      },
      { text: "Every line on that finding lands in my month. Tell me which ones you intend to fix." },
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
        say:
          "We record it and sign. If it arrives, it arrives in your month, and I am not pretending otherwise.",
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
            effect: { dims: { win: 3, deliver: -12 }, flags: ["risk_accepted"] },
          },
          {
            id: "m9-accept-ok",
            tone: "mixed",
            headline: "Signed. The risk is real but survivable.",
            detail:
              "Your proposal is solid enough that the flagged risk is a manageable one. Accepting it keeps momentum, and you have enough slack elsewhere to absorb it.",
            changed: ["Contract signed", "A documented risk you can probably carry"],
            effect: { dims: { win: 3, deliver: -4 }, flags: ["risk_accepted"] },
          },
        ],
      },
      {
        id: "o-mitigate",
        title: "Build in a mitigation",
        icon: "shield",
        description: "Add the contingency, people or integration work needed to cover it.",
        say: "Tell me what covering it properly needs and I will find the money in the commercial case.",
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
            effect: { dims: { deliver: 3, profit: -9 }, flags: ["thin_mitigation"] },
            lesson: {
              principle:
                "What you settle commercially, my team lives with operationally. Same decision, different month.",
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
            effect: { dims: { deliver: 7, profit: -6 }, badge: "smart_tradeoff" },
          },
        ],
      },
      {
        id: "o-rescope-risk",
        title: "Take the risky part out",
        icon: "cross",
        description: "Remove what creates the exposure and deliver the rest well.",
        say: "Then I pull that piece rather than hand you something nobody can run. Sarah hears it from me.",
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
            effect: { dims: { deliver: 9, win: -6, profit: 3 }, flags: ["descoped"] },
          },
        ],
      },
      {
        id: "o-repriceRisk",
        title: "Go back and re-price it",
        icon: "scale",
        description: "Tell them the risk is real and covering it properly costs more.",
        say: "I meant all of it. So I go back and ask them to pay for covering it properly.",
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
            effect: { dims: { profit: 6, deliver: 6, win: -2 }, badge: "smart_tradeoff" },
          },
          {
            id: "m9-reprice-weak",
            tone: "hard",
            headline: "It looks like you are moving the goalposts.",
            detail:
              "From where procurement sits, a firm that raises its price after winning is a firm that under-quoted to get in. You get the increase, and you spend most of the goodwill you had to get it.",
            changed: ["Risk funded", "The relationship is now transactional"],
            effect: { dims: { profit: 5, deliver: 5, win: -10 } },
          },
        ],
      },
    ],
    lesson: {
      principle: "Everything on that list is cheaper to deal with today than it will be the morning after we sign.",
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
    role: "chapter-open",
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
    eyebrow: "Month five",
    /* Internal, despite a client quote resolving here. The player is in thirty minutes
       with the delivery lead, and every reply on this beat refers to the client in the
       third person, so opening on Marcus or Sarah would have the player discussing them
       while they are on screen. Their line becomes context from outside the room. */
    room: "internal",
    objective: "Deal with a decision you made months ago.",
    minutes: 4,
    hero: "solution-in-store-tech",
    situation: [
      "Delivery is underway and something has given. The delivery lead wants thirty minutes.",
      "Two Orion specialists the plan depends on have been pulled onto another priority. You are three weeks behind and the gap is widening.",
    ],
    presentation: "dialogue",
    surface: "chat",
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
    /* Two voices, and which one you get is the whole of chapter two arriving late. If
       Operations was brought onside, the man whose people are three weeks into this says
       so himself; if it was not, the sponsor is the one carrying it, and she is carrying
       it to a board. */
    quotes: [
      {
        when: { all: ["ops_onside"] },
        text: "My people are re-planning around this for the second time. I backed you in that room, and I would rather not have to explain why.",
        ...MARCUS,
      },
    ],
    saidQuote: {
      text: "The board has asked for one more thing and I said I would put it to you. I am aware of what I am asking.",
      ...SARAH,
    },
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
        say:
          "I want the real dates in front of Sarah this week, with a re-plan already drafted. No surprises.",
        commits: "Saying out loud that a promise will not hold.",
        pros: ["Client inside the problem", "Cheapest if trust exists"],
        cons: ["You have to admit it", "Invites scrutiny"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            /**
             * The one place a meter decides something.
             *
             * Going early works when there is trust to spend AND a programme worth
             * re-planning — `min: { deliver: 60 }` is the second half of that, and it is
             * the first condition in the game to read a meter rather than a flag. Until
             * now Winability, Profitability and Deliverability were write-only: three
             * numbers the player was asked to manage that managed nothing, which is the
             * mechanical root of "it feels like a form".
             *
             * 60 because a gate threshold has to sit on a ten-point bucket boundary or the
             * sweep's dedup silently stops being able to tell the two sides apart —
             * `analysis.ts` now throws rather than let that pass quietly. And exactly one
             * gate, because two consume a third of `MAX_FRONTIER` and three breach it.
             */
            id: "m10-reset-trust",
            when: {
              any: ["ops_onside", "evidenced", "credibility"],
              min: { deliver: 60 },
            },
            tone: "strong",
            headline: "It is a difficult meeting, and it works.",
            detail:
              "You go early, with a clear account of what changed and a revised plan already drafted. Because you have been accurate with this client from the first conversation, they treat it as management rather than as failure.",
            changed: ["Plan reset with the client's agreement", "The relationship survives intact"],
            effect: { dims: { deliver: 6, win: 2, profit: -2 }, badge: "recovered" },
          },
          {
            id: "m10-reset-cold",
            tone: "mixed",
            headline: "They accept it. They also start checking everything.",
            detail:
              "Honesty is still the right move, and it still costs you. Without much of a track record to draw on, the client responds by adding governance — weekly reviews, escalation paths, a steering committee.",
            changed: ["Plan reset", "You are now being managed closely"],
            effect: { dims: { deliver: 4, profit: -5, win: -3 } },
          },
        ],
      },
      {
        /**
         * The option the game did not have, and the most actionable gap the domain review
         * found.
         *
         * Zero occurrences of "change request", "statement of work", "MSA" or "framework"
         * anywhere in the content. At month five the four answers were: absorb the cost,
         * push the team, reset expectations, or quietly trim — and the real first answer,
         * *price the change and let them buy it*, was absent. So a learner left this game
         * believing delivery scope pressure is something you ABSORB rather than something
         * you TRANSACT, and that is how a new joiner gives work away for free, every time.
         *
         * It is not a free win. Raising a change request is the correct move and it is a
         * commercial conversation with a client who is already unhappy, which is why the
         * outcome turns on whether you documented the original scope — `descoped` and
         * `evidenced` — rather than on whether you were brave.
         */
        id: "o-change",
        title: "Raise it as a change",
        icon: "scale",
        /**
         * Gated, and for two reasons that happen to agree.
         *
         * The domain one: you cannot price a change against a scope nobody wrote down.
         * Without `evidenced` or `reviewed` this is not a commercial conversation, it is
         * an argument about what was said four months ago — which is exactly what the
         * weak branch below describes, and not a choice worth offering as a fifth card.
         *
         * The interface one: adding it unconditionally made m10 a five-option screen and
         * the working area overflowed by 60px at 1440×900. The panel called this in
         * advance — "make change control a variant swap, not a permanent fifth card;
         * accessibility is right about five columns". Gating it keeps m10 at four options
         * for players who cannot use it and offers a fourth knowledge gate to players who
         * can, which is backlog 1.2 rather than a workaround.
         */
        requires: { any: ["evidenced", "reviewed"] },
        description: "What they are asking for is not in the contract. Price it and let them decide.",
        say: "What they are asking for was never in the contract. I will price it and let them decide.",
        commits: "A commercial conversation with a client who is already unhappy.",
        pros: ["Paid for the work", "Scope stays honest"],
        cons: ["Reads as opportunism", "Needs the original scope in writing"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m10-change-clean",
            when: { all: ["evidenced"], any: ["ops_onside", "reviewed", "knows:criteria"] },
            tone: "strong",
            headline: "They buy it, because you can show it was never in scope.",
            detail:
              "You bring the original scope, the dated note where the extra ask first appeared, and a price. Sarah does not enjoy it and she approves it, because the alternative is asking you to work for nothing and she knows it. The programme gets bigger and the margin holds.",
            changed: ["Extra work funded", "Scope boundary now established in writing"],
            effect: { dims: { profit: 9, deliver: 3, win: -2 }, flags: ["changed_scope"], badge: "smart_tradeoff" },
            lesson: {
              principle: "That was a transaction, not a favour. Somebody pays for extra scope, and this time we said who.",
              because:
                "The work was always going to be done. Raising it as a change decided whether your margin paid or their budget did — and you could only raise it because the original boundary was written down.",
              watchFor: "When delivery is asked for something extra, ask first whether it was ever in the contract.",
            },
          },
          {
            id: "m10-change-thin",
            tone: "mixed",
            headline: "The conversation is harder than the arithmetic.",
            detail:
              "You are right that it is out of scope, and you cannot point to where you said so. It becomes a negotiation about memory rather than about money. They part-fund it and the relationship cools a degree.",
            changed: ["Extra work part-funded", "An argument you should not have had to have"],
            effect: { dims: { profit: 4, win: -5, deliver: 1 }, flags: ["changed_scope"] },
            lesson: {
              principle: "I can only raise a change against a scope somebody wrote down properly, and this one was thin.",
              because:
                "Nobody disputes a boundary that was written down at the time. Without it you were asking them to accept your account of a conversation from four months ago, which is a weaker position than being wrong would have been.",
              watchFor: "Write the boundary down when it is uncontroversial, not when it is contested.",
            },
          },
        ],
      },
      {
        id: "o-absorb",
        title: "Put more people on it",
        icon: "people",
        description: "Hold the promise by adding capacity and absorbing the cost.",
        say: "We add people and carry the cost ourselves. They get the date, and our margin pays for it.",
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
            effect: { dims: { profit: -13, deliver: 2 } },
            lesson: {
              principle: "We inherit every commercial decision made before we started, and this one reached us with no room in it.",
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
            effect: { dims: { deliver: 5, profit: -10, win: 3 } },
          },
        ],
      },
      {
        id: "o-push",
        title: "Push the team to hit it",
        icon: "clock",
        description: "The commitment was made. Hold everyone to it.",
        say: "The date stands. Tell the team I am asking them to find three weeks that are not there.",
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
            changed: ["Date met", "The delivery team is worn down", "Two people ask to roll off at the next gate"],
            /* Was `deliver +2, profit +3, win +1` -- net +6 for a choice whose own cons say
               "Paid by the team", with nothing anywhere charging for it. Attrition is the
               cost, and it lands on Deliverability, because the people who know the
               programme are the ones who leave. */
            effect: { dims: { deliver: -4, profit: 3, win: 1 }, flags: ["crunched"] },
            lesson: {
              principle: "We held that date on goodwill. Goodwill is borrowed, and the people lending it set the terms.",
              because:
                "The programme was sound enough that pressure worked. What it cost is two people who know how it was built, and you will feel that at the next gate rather than this one.",
              watchFor: "Before holding a date by effort, ask who is paying and whether they agreed to.",
            },
          },
        ],
      },
      {
        id: "o-quiet",
        title: "Quietly reduce what ships",
        icon: "block",
        description: "Trim the scope without making it a formal conversation.",
        say: "Trim what the team can from the release and do not make an agenda item of it.",
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
            effect: { dims: { deliver: 2, win: -4, profit: 4 }, flags: ["undisclosed"] },
            lesson: {
              principle: "Somebody covered for us, which is not the same as us being straight with them. They know the difference.",
              because:
                "It held because Operations absorbed the question you chose not to answer. That works exactly as long as their goodwill lasts, and you have spent some of it without asking.",
              watchFor: "If a decision needs somebody else to explain it, ask why you are not explaining it.",
            },
          },
          {
            id: "m10-quiet",
            tone: "hard",
            headline: "It works until somebody opens the original document.",
            detail:
              "The immediate pressure disappears. Four weeks later, an Orion manager compares what was delivered with what was proposed and asks a question in writing. The issue is no longer the scope; it is that you did not say.",
            changed: [
              "Short-term pressure relieved",
              "Trust damaged in a way that is hard to repair",
            ],
            effect: { dims: { deliver: 1, win: -14, profit: 4 } },
            lesson: {
              principle:
                "A delivery problem turns into a relationship problem the moment we stop talking about it.",
              because:
                "Reducing scope is often correct. Reducing it quietly turns a manageable delivery decision into a question about whether you can be trusted.",
              watchFor: "If you would not want the client to read the decision log, reconsider the decision.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "Everything promised back then is somebody's Monday morning now, and mostly it is mine.",
      because:
        "What went wrong in month five was not a delivery mistake. It was the arithmetic of choices made during qualification, solutioning and pricing, arriving on schedule.",
      watchFor: "When you make a commitment, ask who has to keep it and whether they know yet.",
    },
    next: "refl-month5",
  },

  {
    kind: "interlude",
    id: "refl-month5",
    role: "reflection",
    chapter: 5,
    eyebrow: "A moment",
    title: "After month five",
    advisor: AISHA,
    body: ["Aisha stays on the call after the others have dropped off."],
    prompt:
      "I have been handed month five on four programmes. Which of your own decisions would you unmake now?",
    responses: [
      "The date. I agreed one before anybody had checked it could be met.",
      "None of them yet. I want to see how this one lands first.",
    ],
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
    eyebrow: "Two of five",
    objective: "Fund two of five before the proposal.",
    minutes: 4,
    hero: "solution-workshop",
    situation: [
      "Sarah wants five things done before you propose. Your people have a fortnight and there is room for two.",
      "Nobody will tell you which two. The other three simply will not happen.",
    ],
    /* The beat where the sponsor asks for five things had no sponsor in it. She is also
       the one being squeezed — the fortnight is not her choice either. */
    saidQuote: {
      text: "There are five things I need covered before you put anything in writing. I gather you have a fortnight.",
      ...SARAH,
    },
    /* She is pricing a fortnight of her own people, so she notices what the fortnight no
       longer has to buy — ground already taken, or a door already open. */
    advisorLine: [
      {
        when: { any: ["reframed"] },
        text: "You moved them onto the post-purchase ground. Two weeks is what you have to stand it up.",
      },
      {
        when: { any: ["has_access"] },
        text: "We are already inside. I would not spend a day of this getting in again.",
      },
      { text: "Two weeks of my team's time. Tell me what it is buying." },
    ],
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
        dims: { deliver: 5, win: 1, profit: -2 },
        flags: ["ops_engaged"],
      },
      {
        id: "c-benchmark",
        title: "Benchmark the competition",
        description: "Work out precisely what the rival's platform does and does not cover.",
        tag: "Intelligence",
        dims: { win: 4, profit: -1 },
        flags: ["knows:rival_gap"],
      },
      {
        id: "c-reference",
        title: "A reference visit",
        description: "Take Sarah to a retailer where you have already done this.",
        tag: "Proof",
        dims: { win: 5, profit: -3 },
        flags: ["credibility"],
      },
      {
        id: "c-data-audit",
        title: "Audit their data",
        description: "Find out whether the order and returns data is usable at all.",
        tag: "Foundation",
        dims: { deliver: 4, profit: 3, win: -2 },
        flags: ["has:data"],
      },
      {
        id: "c-complaints",
        title: "Pull their complaint data",
        description: "Get the actual post-purchase contact volumes out of their systems.",
        tag: "Evidence",
        dims: { win: 3, deliver: 1, profit: -2 },
        flags: ["knows:real_pain"],
      },
      {
        id: "c-stakeholders",
        title: "Map the stakeholders",
        description: "Who signs, who blocks, who has to live with it afterwards.",
        tag: "Political",
        dims: { deliver: 3, win: 2 },
        flags: ["knows:ops_constraint"],
      },
    ],
    outcomes: [
      {
        id: "m5b-grounded",
        when: { all: ["ops_engaged", "has:data"] },
        tone: "strong",
        /* "You bought…" until the pedagogy pass: this outcome opens on `all:
           ["ops_engaged", "has:data"]`, and a build outcome is matched against the flags
           the player HOLDS, not the components they just ticked. A Builder who took the
           point-of-view route arrives with both and lands here whatever they fund, so
           the headline was telling some players what they had purchased and was wrong.
           The detail and the bullets below were already written as state, which is why
           only this line needed changing. The full fix is a flag of its own on each of
           the two components — `funded:ops_workshop`, `funded:data_audit` — so the
           condition can ask what was bought rather than what is held; that changes
           branch selection, so it wants its own pass and its own sweep rather than
           riding along with a copy change. `m5b-persuasion` has the same defect. */
        headline: "You have the two things nobody else will have.",
        detail:
          "Operations has been in a room with you, and you know what their data can actually support. Neither is impressive in a pitch. Both are the difference between a proposal and a promise.",
        changed: [
          "Operations has met you before the proposal lands",
          "You know what the data can and cannot do",
        ],
        effect: { dims: { deliver: 3 }, badge: "smart_tradeoff" },
        /* This beat printed the mission's fallback lesson on all three of its outcomes,
           including the two that are nearly opposite. Winning the room with nothing
           tested and grounding the work in what Operations can actually take are not the
           same experience, and they were being given the same sentence. */
        lesson: {
          principle:
            "Ground the proposal in what the people and the data can support.",
          because:
            "You now have Operations involved and checked data to work from. Whether established earlier or through this investment, that foundation gives the proposal something real to describe.",
          watchFor:
            "The unglamorous option is usually the one that removes an assumption instead of adding a claim.",
        },
      },
      {
        id: "m5b-persuasion",
        when: { all: ["credibility", "knows:rival_gap"] },
        tone: "strong",
        headline: "You have built the argument, not the plan.",
        detail:
          "You have credible examples of your work and you understand a gap in the rival’s offer. That strengthens the case with Sarah. But the engagement does not yet have both Operations involved and checked client data to ground the delivery plan.",
        changed: ["A stronger case with the sponsor", "The delivery foundation remains incomplete"],
        effect: { dims: { win: 3, deliver: -3 } },
        lesson: {
          principle:
            "An argument for choosing you is not yet a plan for delivering the work.",
          because:
            "Credibility and competitor insight support the buying conversation. They do not replace the combination of operational involvement and checked data needed for delivery.",
          watchFor:
            "Check which delivery assumptions still need evidence, even when the case for choosing you is strong.",
        },
      },
      {
        id: "m5b-spread",
        tone: "mixed",
        headline: "Two useful weeks, and the gaps that are left are the ones you chose.",
        detail:
          "Both pieces of work land. Four other activities remain unfunded in this window. Check which gaps your earlier work already covered, and make the remaining assumptions explicit in the proposal.",
        changed: ["Two activities completed", "Four activities left outside this investment"],
        effect: { dims: { win: 1, deliver: 1 } },
      },
    ],
    lesson: {
      principle: "Choosing what we drop is the harder half of this, and it is the half people skip.",
      because:
        "Every one of those six activities was worth considering. Choosing two meant leaving four unfunded in this window. Earlier discoveries may cover some gaps; the rest need to be acknowledged.",
      watchFor: "When you cannot do everything, name what you are choosing to be ignorant about.",
    },
    next: "deb-2",
  },

  {
    kind: "interlude",
    id: "deb-2",
    role: "chapter-debrief",
    chapter: 2,
    eyebrow: "Chapter two, closed",
    title: "Where the team actually went",
    body: [
      "Interest became an opportunity here, and the decisions that did it were about where your people went, not what you said to the client.",
    ],
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
    /* Arjun's opening depends on what the last beat settled. With their own evidence on
       the table there is room to move the shape; having answered the brief as written,
       the shape is the only thing left to move. */
    advisorLine: [
      {
        when: { all: ["evidenced"] },
        text: "You have their own numbers on the table. That lets us move the shape, not just the words.",
      },
      {
        when: { all: ["scope:storefront"] },
        text: "We answered the brief as written. So did everybody else. The shape is what is left.",
      },
      { text: "Everyone is answering the question as asked. That is usually an opening." },
    ],
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
            effect: { dims: { win: 6, deliver: 5, profit: -6 }, flags: ["has:partner"] },
          },
          {
            id: "m6b-partner-loose",
            tone: "mixed",
            headline: "A capable partner, attached to a problem you have not pinned down.",
            detail:
              "They are good and they are expensive. Without a clear read on what is actually broken, you are paying a specialist to solve a problem you have described in general terms.",
            changed: ["Capability bought", "Margin shared before the problem is clear"],
            effect: { dims: { win: 3, deliver: 3, profit: -7 }, flags: ["has:partner"] },
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
            effect: { dims: { profit: 10, deliver: 3, win: -5 }, flags: ["reused_asset"] },
            lesson: {
              principle: "Reuse is leverage right up to the point where it replaces thinking. I have shipped that mistake.",
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
              "An outcome deal is only honest if both sides trust the number. You audited their data, so there is a baseline everyone believes: half a million post-purchase contacts a year, counted the same way by them and by you, from the same system. A third of the fee moves against that and both sides know what moving it looks like. Sarah's board finds it very hard to say no to.",
            changed: ["A proposal nobody can compare", "A third of the fee now depends on results"],
            effect: {
              dims: { win: 8, profit: -3, deliver: 1 },
              flags: ["outcome_based"],
              badge: "connected_dots",
            },
          },
          {
            id: "m6b-outcome-blind",
            tone: "hard",
            headline: "You have bet a third of the fee on a number nobody can agree.",
            detail:
              "The idea is genuinely strong. But nobody has counted the contacts, so there is no baseline either side can point at — your half a million and their half a million will not be the same half a million, and neither of you will find that out until the first measurement. The first argument of the delivery will be about what a support contact is, and you will be having it with a third of the fee on the table.",
            changed: ["A distinctive offer", "A third of the fee tied to an undefined number"],
            effect: { dims: { win: 4, profit: -10, deliver: -4 }, flags: ["outcome_based"] },
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
            effect: { dims: { deliver: 3, profit: 3, win: -4 }, flags: ["conventional"] },
          },
        ],
      },
    ],
    lesson: {
      principle: "We design the shape of a deal. Nobody hands it to us finished.",
      because:
        "Who delivers it, what you reuse, and how you get paid are all choices — and each one changes what you are competing on.",
      watchFor: "When every firm is answering the same question, look at what else could be moved.",
    },
    next: "refl-shape",
  },

  {
    kind: "interlude",
    id: "refl-shape",
    role: "reflection",
    chapter: 3,
    eyebrow: "A moment",
    title: "Before the proposal",
    advisor: ARJUN,
    body: ["Arjun is still at the whiteboard when everyone else has gone."],
    prompt:
      "When did you last see a bid win on shape rather than price? What was different about it?",
    responses: [
      "Once. They answered a question the client had not thought to ask.",
      "Never, honestly. Everything I have watched came down to the number.",
    ],
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
    presentation: "dialogue",
    surface: "chat",
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
        /* "Add the integration detail, the named people, the testing plan" — none of
           which you can add if you never found out who owns the systems. */
        requires: { any: ["knows:ops_constraint", "ops_onside", "has:ops_workstream"] },
        icon: "shield",
        description: "Add the integration detail, the named people, the testing plan.",
        say: "You are right about the integration. Give me the week and it comes back with names and dates.",
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
            effect: { dims: { deliver: 6, win: -3 }, flags: ["reviewed"] },
          },
        ],
      },
      {
        id: "o-sharpen-win",
        title: "Sharpen the argument",
        icon: "spark",
        description: "Spend the week making the case land harder with Sarah's board.",
        say:
          "Then argue with me about the pitch, because that is where the week goes. Sarah's board decides this.",
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
            effect: { dims: { win: 5, deliver: -7 }, flags: ["overrode_review"] },
          },
          {
            id: "m7b-sharpen-ok",
            tone: "mixed",
            headline: "The case is tighter. The gaps are the same size.",
            detail:
              "It is a better read than it was, and the underlying proposal has not changed. Since it was reasonably solid to begin with, that is a defensible use of a week.",
            changed: ["A more persuasive proposal", "The same underlying gaps"],
            effect: { dims: { win: 5, deliver: -2 } },
          },
        ],
      },
      {
        id: "o-trim-profit",
        title: "Protect the margin",
        icon: "coins",
        description: "Rework the commercial case so the numbers survive a bad month.",
        say: "I would rather hand you a smaller job with room in it than a big one with none.",
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
            effect: { dims: { profit: 10, win: -5, deliver: 2 }, flags: ["reviewed"] },
          },
        ],
      },
      {
        id: "o-defend",
        title: "Defend it as it stands",
        icon: "block",
        description: "Tell the review you have weighed this and you are comfortable.",
        say: "I have heard the objections. It goes out as it is, and that is on me.",
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
            effect: { dims: { win: 3, profit: 4 }, badge: "held_nerve" },
          },
          {
            id: "m7b-defend-hubris",
            tone: "hard",
            headline: "You overruled the only people who had nothing to sell you.",
            detail:
              "The review had no interest in the pitch and no stake in the number. They read the document cold and told you what was wrong with it, and you decided you knew better.",
            changed: ["A week saved", "Every flagged gap is now yours"],
            effect: { dims: { deliver: -9, win: 1 }, flags: ["overrode_review"] },
            lesson: {
              principle: "Those people had nothing to sell us. I would have taken the advice.",
              because:
                "The deal team wanted to win it and the reviewers did not care whether you did. That is precisely what made them worth listening to.",
              watchFor: "When you overrule a review, write down what you are betting will not happen.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "A week of this before signature buys more than a month of it afterwards.",
      because:
        "Whatever you spent the week on, it was cheap. The same fix during delivery costs a renegotiation, and the same gap left open costs a client.",
      watchFor: "The reviewers do not care whether you win. That is the whole value of them.",
    },
    next: "deb-3",
  },

  {
    kind: "interlude",
    id: "deb-3",
    role: "chapter-debrief",
    chapter: 3,
    eyebrow: "Chapter three, closed",
    title: "The document you now own",
    body: [
      "This is where the pursuit stopped being a conversation and became a document. Every line in it is now somebody's job, whoever wrote it.",
    ],
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
    /* The rebuttal. Foyle is scoring what you brought, so the screen has to show what you
       brought — including the argument you cannot make because you never went and got the
       evidence for it. Staged as a call, that argument was simply absent from the
       composer, and an absent reply reads as the game offering three options rather than
       as the player having earned three of four. */
    presentation: "apply",
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
    /* He has been named in this brief since the beat was written and has never once
       spoken. The lesson here is that they pick the bid somebody can defend picking — so
       the person who has to defend it should be audible while the player still has a
       decision to make. */
    saidQuote: {
      text: "I have three proposals, a scorecard and a savings target. Give me something to write in the box that explains why I did not take the cheapest.",
      ...FOYLE,
    },
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
        /* The first `requires` gate in the game. 0 of 45 options had one, so knowledge
           changed the prose and the numbers and never once changed what the player could
           DO — the whole run was a corridor with reactive text. This one is not a
           preference, it is arithmetic: a payback case needs their complaint data, and a
           player who never got it cannot write one.
           It is now one of three on this beat. `SCREEN-SPECS.md` §4.3 described m9a as
           already gated on four flags and therefore needing no content change to stage as
           an apply beat; that was a misreading of the file — those four flags condition
           the OUTCOMES, and only this option had a `requires`. So on a competent run the
           apply screen showed nothing locked and degraded into a comparison, which §4.3
           itself names as the failure mode of the type. `o-criteria` and `o-deliverer`
           now carry the gates their own prose already assumed. `o-submit` deliberately
           carries none: there is always a submission, and for a player who gathered
           nothing it is the only card on the table, with the other three named beside it. */
        requires: { any: ["knows:real_pain", "evidenced", "ops_onside"] },
        /* This option was called "Build the case in their numbers" and contained no
           number. It described arithmetic — "returns cost Orion a known amount" — and
           never did any, which is the defect the whole spine exists to close: the game
           held the complaint volumes for eleven beats and never once turned them into
           money. The three outcomes below are the same sum at three different levels of
           evidence, which is what the existing gates already sorted players into. */
        description: "Half a million post-purchase contacts a year, at five pounds each. Show what halving that is worth.",
        say: "Let me write that box out of your own numbers — two and a half million a year, halved.",
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
              "The case is built on a contact volume you took from a sector benchmark and a cost per contact you took from another client. Foyle asks where the half a million came from. It is the first question anybody would ask, you cannot answer it out of anything Orion gave you, and he marks the whole case unevidenced and scores the cheaper bid higher. The award goes elsewhere.",
            changed: ["Not selected", "A quarter of pursuit cost written off"],
            effect: { dims: { win: -30, profit: -8 }, flags: ["lost"] },
            next: "end",
            lesson: {
              principle: "We built that case out of assumptions we made up, so it read as a brochure. Built from theirs it would have been an argument.",
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
              "You put it in front of him in three lines, out of his own complaint data. Half a million post-purchase contacts a year. About five pounds to answer each one, so two and a half million a year spent answering them. Halve that and Orion keeps one and a quarter million a year, against six hundred thousand of difference between your bid and the cheaper one. The gap pays for itself inside six months, and the whole fee a little past its second year. He does not have to like you. He has to justify a choice, and you have just written his justification for him.",
            changed: ["Selected", "A payback number now in the contract"],
            effect: { dims: { win: 8, profit: 4 }, flags: ["won", "outcome_based"], badge: "connected_dots" },
          },
          {
            id: "m9a-value-thin",
            tone: "mixed",
            headline: "A good case, lightly evidenced.",
            detail:
              "The structure is right and the baseline is soft. Half a million contacts a year is the figure a retailer of this size usually runs, and it is not a figure anybody at Orion has counted, so the one and a quarter million rests on your estimate rather than their record. Foyle scores it above the cheapest bid and below where it could have been, and asks you to stand behind the number in writing.",
            changed: ["Selected", "Committed to a payback you estimated"],
            effect: { dims: { win: 4, profit: -2 }, flags: ["won", "outcome_based"] },
          },
        ],
      },
      {
        id: "o-criteria",
        title: "Ask for the criteria and re-cut",
        icon: "search",
        /* Anybody can ask. Whether the weightings come back in time to re-cut a
           submission depends on there being somebody client-side who picks up — a sponsor
           who trusts you, an Operations team you brought into the room, or a paid
           engagement that already has you inside. A firm that ran a campaign and never
           got into a room is asking a stranger for the marking scheme in the last week.
           `m9a-lost-criteria` is the earned version of the same move: he sends them, and
           they are unkind. */
        requires: { any: ["credibility", "ops_engaged", "has_access"] },
        description: "Find out how it is being scored, then answer that.",
        say:
          "Send me the weightings and I will answer the test you are actually setting, not the one I imagined.",
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
              principle: "Those criteria were there for the asking. They decided this whether we asked or not.",
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
            effect: { dims: { win: 6, profit: 1 }, flags: ["won", "knows:criteria"], badge: "good_question" },
          },
        ],
      },
      {
        id: "o-deliverer",
        title: "Put the delivery lead in the room",
        icon: "people",
        /* Aisha can only answer Foyle's questions about how the changes reach production
           if somebody has planned it: her own integration workstream, Marcus's people
           inside the proposal, or a partner who runs returns for a living. With none of
           the three there is nobody to send — the card would be an invitation to walk
           your most truthful person into a room with nothing to be truthful about, which
           is a trap rather than a decision. Locked and named, it says where she could
           have been given something to say. */
        requires: { any: ["ops_onside", "has:ops_workstream", "has:partner"] },
        description: "Aisha answers their questions instead of you.",
        say: "I will bring the person who has to deliver it. Ask her anything — she will not dress it up.",
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
            effect: { dims: { win: -26, deliver: 3 }, flags: ["lost"] },
            next: "end",
            lesson: {
              principle: "Being straight in the room only helps us when the homework behind it is done. This time it was not.",
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
            effect: { dims: { win: 6, deliver: 4 }, flags: ["won"], badge: "held_nerve" },
          },
          {
            id: "m9a-deliverer-plain",
            tone: "mixed",
            headline: "Believable, and short of decisive.",
            detail:
              "She is straight about what is agreed and what is not. Foyle believes her, which is worth more than it looks, and still scores the incumbent higher on price.",
            changed: ["Selected", "Credible but not preferred on price"],
            effect: { dims: { win: 3, deliver: 2 }, flags: ["won"] },
          },
        ],
      },
      {
        id: "o-submit",
        title: "Submit it and let it be scored",
        icon: "clock",
        description: "The proposal is good. Stop selling and let procurement work.",
        say: "Everything I have is in the submission. Score it — I am not going to keep selling at you.",
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
              principle: "Nothing separated the bids, so price decided. It always does when we give it nothing else to work with.",
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
            effect: { dims: { win: 5, profit: 3, deliver: 3 }, flags: ["won"] },
          },
          {
            id: "m9a-submit-plain",
            tone: "mixed",
            headline: "You win it, narrowly, on Sarah's preference.",
            detail:
              "Foyle scores the bids close to level and Sarah's recommendation carries it. You have the work and you have learned nothing about why, which is a poor position to be in next time.",
            changed: ["Selected", "Won on the sponsor's preference, not the scorecard"],
            effect: { dims: { win: 2, deliver: 3 }, flags: ["won"] },
          },
        ],
      },
    ],
    lesson: {
      principle: "They do not pick the best proposal. They pick the one somebody can defend picking, in a room we are not in.",
      because:
        "Somebody has to justify this in writing to people who were never in the room. Everything that makes that easy for them — their own numbers, a named owner for every change, a criterion you score first on — is worth more than another page about your capability.",
      watchFor: "Ask who has to defend this decision internally, and what you have given them.",
    },
    next: "turn-award",
  },

  /**
   * The award, written so it reads whichever way it went.
   *
   * Four of m9a's outcomes carry their own `next: "end"` — a pursuit lost at the award
   * stops there, as walking away does — so in practice this node is reached by the
   * branches that won. It is still written without a verdict in it, because the point of
   * the beat is that the verdict was reached in a room the player was not in, and a scene
   * that opens by announcing the result is describing the wrong thing.
   */
  {
    kind: "interlude",
    id: "turn-award",
    role: "turn",
    chapter: 4,
    eyebrow: "Thursday, 08:14",
    title: "The panel has decided",
    body: [
      "The evaluation panel sat on Tuesday afternoon. Foyle, two people from finance, and someone from operations who read the submissions on the train.",
      "It took forty minutes. The scorecard was completed, signed and filed, and nobody in that room spoke to any of the three firms.",
      "The email went out on Thursday morning at 08:14, to all of them, in the same words. Sarah forwarded hers eleven minutes later with nothing added.",
    ],
    prompt: "Four people, three of whom you have never met, settled this on a Tuesday afternoon.",
    next: "refl-award",
  },

  {
    kind: "interlude",
    id: "refl-award",
    role: "reflection",
    chapter: 4,
    eyebrow: "A moment",
    title: "After the award",
    advisor: RIYA_DEAL,
    body: ["Riya reads the email twice, then puts her phone face down."],
    prompt:
      "Someone had to defend this choice in a room you were not in. When has that gone against you?",
    responses: [
      "More than once. I never did find out who was arguing for us.",
      "It has gone my way too, and I could not tell you why.",
    ],
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
    presentation: "dialogue",
    surface: "chat",
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
      ...SARAH,
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
        say: "There is nothing I am holding back. Sign it, and every sentence in there becomes mine to keep.",
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
            effect: { dims: { win: 4, profit: 2 }, flags: ["signed"] },
          },
          {
            id: "m9b-proceed-loaded",
            tone: "mixed",
            headline: "Signed, with everything you did not fix now written down.",
            detail:
              "The deal is real and so are its gaps. Nothing here is fatal on its own; the question is how many of them arrive in the same month.",
            changed: ["Contract signed", "The known gaps are now contractual"],
            effect: { dims: { win: 5, deliver: -3 }, flags: ["signed"] },
          },
        ],
      },
      {
        id: "o-modify",
        title: "Modify before signing",
        icon: "scale",
        description: "Reopen the two clauses you are least comfortable with.",
        say:
          "Two clauses, then. I am not comfortable with them, and I would rather say so before the signature.",
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
              dims: { deliver: 6, profit: 4, win: -2 },
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
            effect: { dims: { deliver: 3, win: -5 }, flags: ["signed"] },
          },
        ],
      },
      {
        id: "o-walk",
        title: "Walk away",
        icon: "block",
        description: "Tell them honestly that this one is not worth signing.",
        say: "Then here is the problem — I would not put my own people on this. I am not signing.",
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
              dims: { win: -18, profit: 16, deliver: 13 },
              flags: ["walked_away"],
              badge: "held_nerve",
            },
            lesson: {
              principle: "We walked. I want that written down as a decision, not as a failure to make one.",
              because:
                "An unresolved delivery risk or an unsupported commitment had survived into the final deal. Walking away stopped that exposure becoming a signed obligation.",
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
              "Caution is not the same as judgement. The risks that would justify refusing this deal had not been established in your engagement. You walked away without a specific unresolved commitment to support that decision.",
            changed: [
              "No contract",
              "A quarter of pursuit cost written off",
              "A client who will be slower to call next time",
            ],
            effect: { dims: { win: -22, profit: -6, deliver: 5 }, flags: ["walked_away"] },
            lesson: {
              principle: "Discipline and nerves look identical from outside. The only way to tell them apart is to check the position we left.",
              because:
                "Walking away is justified by a concrete exposure you cannot responsibly accept. In this run, the engagement had not established the unresolved risks that would make refusal the stronger choice.",
              watchFor: "Before you decline, name the specific thing you are unwilling to carry.",
            },
            next: "end",
          },
        ],
      },
    ],
    lesson: {
      principle: "Signing is a decision. So is not signing, and I have had to make that one in front of a partner.",
      because:
        "Everything before this was reversible. The signature is the line after which the promises belong to somebody else.",
      watchFor: "A pursuit accumulates concessions. Nobody ever decides to end up where you ended up.",
    },
    next: "deb-4",
  },

  {
    kind: "interlude",
    id: "deb-4",
    role: "chapter-debrief",
    chapter: 4,
    eyebrow: "Chapter four, closed",
    title: "Decided elsewhere",
    body: [
      "Price, risk, and a decision made by people you never met. What you could say in each room was fixed weeks earlier.",
    ],
    next: "int-5",
  },

  /** PRD M18 — the capacity problem. */
  {
    kind: "choice",
    id: "m10b",
    chapter: 5,
    stage: "delivery",
    title: "Two people short",
    eyebrow: "Two people short",
    objective: "Resource the programme you actually sold.",
    minutes: 3,
    hero: "solution-workshop",
    situation: [
      "The plan needs two more people than the firm has spare. One of your best is being pulled onto a bigger account and the replacement is available in six weeks.",
    ],
    /* Staffing is the beat where the pricing conversation finally arrives in a room with
       the delivery lead in it, so she names it. The second branch is the reason graduates
       are a reasonable bet on this programme and not on the last one.

       The first branch used to read "Before you say contractors: there is no money in
       this contract for contractors" — and its condition is character for character the
       condition on `m10b-contractors-broke`. So the colleague fired on exactly the flags
       that select the hard outcome, named the card it was about to punish, and did it
       before the decision: G3 wearing a face, and it removed the trade-off from the only
       players whose earlier discount made it interesting. She still reacts and she still
       has the stake. She states the position and leaves the choice alone. */
    advisorLine: [
      {
        when: { any: ["discounted", "thin_mitigation"] },
        text: "I have been through the commercial case twice. Whatever we do here comes out of what is left of it.",
      },
      {
        when: { any: ["ops_onside", "has:training"] },
        text: "Marcus's people are already in this. That changes what I can reasonably ask of a graduate.",
      },
      { text: "I can staff this with the people who exist, or the people in the plan. Not both." },
    ],
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
            effect: { dims: { deliver: 3, profit: 6, win: -1 } },
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
            effect: { dims: { deliver: 5, profit: -8 } },
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
            effect: { dims: { deliver: 6, profit: 3, win: -3 }, badge: "recovered" },
          },
          {
            id: "m10b-slip-cold",
            when: { any: ["promised:fast", "overrode_review"] },
            tone: "hard",
            headline: "That date was the reason they picked you.",
            detail:
              "Speed was the most attractive thing in your proposal, and the first thing you have done is ask for six more weeks. Sarah has to go back to a board that approved this on the timeline.",
            changed: ["The right team eventually", "The thing you sold on is gone"],
            effect: { dims: { win: -12, deliver: 4 } },
          },
          {
            id: "m10b-slip",
            tone: "mixed",
            headline: "Accepted, and noted.",
            detail:
              "The date moves without much drama. It does establish, in month two, that your plan was written for a team you did not have.",
            changed: ["The right team", "Six weeks late from the start"],
            effect: { dims: { deliver: 3, win: -6 } },
          },
        ],
      },
    ],
    lesson: {
      principle: "Every plan I am handed is a set of assumptions about people. I would like them to be named people.",
      because:
        "The programme was scoped as though the right people would be free. Whether that was optimism or an oversight, the delivery team is the one that finds out.",
      watchFor: "When you commit to a date, ask who specifically is going to be sitting there.",
    },
    next: "m10h",
  },

  /**
   * Backlog 5.7 — the handover. The one beat whose currency is what the player already
   * has rather than what they would prefer.
   *
   * Aisha's standing line has been in this file since the cast was written: "My team
   * inherits every sentence in that proposal. Which ones did you mean?" It was rhetorical
   * for seventeen beats. Here it is the question, and the answers are the player's OWN
   * commitments read back at them — so every option carries a `requires`, and which
   * sentences you are entitled to stand behind is a consequence of the run rather than a
   * menu. An option nobody earned renders locked and named (`ui/apply.tsx`); seeing the
   * answer you could have given is the teaching.
   *
   * WHY THE FALLBACK IS GATED TOO. `o-meant-all-of-it` requires `won`, which every path
   * reaching this node carries: every m9a branch that does not divert to the ending
   * writes it, and m9b's two walk-away branches divert as well. So the beat is always
   * playable AND nothing on it is ungated, which is the rule it exists to make visible —
   * and the one commitment nobody here can disown is the document that won the work.
   *
   * NO STANCE IS SAFE, and the arithmetic is deliberate. Standing behind an overreach
   * costs Deliverability, because somebody then plans to it. Withdrawing costs Winability,
   * because the client agreed to the thing being taken back. Qualifying costs less of
   * both and introduces a caveat after signature. Each option owns one dimension it is
   * always worst on, which is what keeps five answers out of a ranking.
   *
   * IT WRITES NO FLAGS, deliberately. Every other beat in chapter five accumulates
   * something a later one reads; this one spends. The only downstream reader is m10c, and
   * inventing a flag for it would put a second cause under a variant that already has an
   * honest one. What this beat leaves behind is three threads in the closing debrief.
   */
  {
    kind: "choice",
    id: "m10h",
    chapter: 5,
    stage: "delivery",
    title: "The sentences you wrote",
    eyebrow: "The handover",
    objective: "Answer for the promises in your own proposal.",
    minutes: 4,
    hero: "solution-workshop",
    situation: [
      "Aisha's team starts on Monday. She has the proposal open, the lines she cannot plan around highlighted, and thirty minutes.",
    ],
    /* Backlog 5.7. Aisha asks which of your promises you meant, and the honest answer is
       constrained by which ones you actually funded — so every line she cannot plan
       around has to be on screen, named, whether or not you can still stand behind it.
       85% of runs arrive here with at least one option locked, which is the whole beat:
       the proposal is the thing being read back to you. */
    presentation: "apply",
    /* Her thread, her team, her question. The client is not in this room and is not meant
       to be: the whole point of the beat is that it happens before anybody tells Orion
       anything at all. */
    room: "internal",
    variants: [
      {
        when: { all: ["scope:heavy"], none: ["has:ops_workstream"] },
        situation: [
          "Aisha's team starts on Monday. She has the proposal open at the platform rebuild, and she wants the name of the person in Operations who agreed to take it.",
          "There is not one in the document.",
        ],
      },
      {
        when: { all: ["promised:fast"], none: ["has:data"] },
        situation: [
          "Aisha's team starts on Monday. Two lines are highlighted: the eight-week pilot, and the sentence saying the order data is available.",
          "She has spent a week looking for that data. It is not available.",
        ],
      },
      {
        when: { all: ["outcome_based"] },
        situation: [
          "Aisha's team starts on Monday. She has the contract open at the clause where a third of the fee moves with the support contact figure.",
          "She would like to know who chose the number.",
        ],
      },
      {
        when: { all: ["ops_onside", "evidenced"] },
        situation: [
          "Aisha's team starts on Monday. She has the proposal open and almost nothing highlighted.",
          "Her question is narrower than she expected: which of these are commitments, and which may she re-plan?",
        ],
      },
    ],
    advisorLine: [
      {
        when: { any: ["unanchored", "risk_accepted", "fragile_timeline"] },
        text: "Three lines in here have no owner. I am not starting Monday pretending otherwise.",
      },
      {
        when: { all: ["ops_onside", "evidenced"] },
        text: "Most of this I can plan to. I would still like to hear which parts are fixed.",
      },
      { text: "I have marked the sentences I cannot plan around. Tell me which of them you actually meant." },
    ],
    advisor: AISHA,
    consider: [
      "Which of these did you write to win, not to do?",
      "Who has to be told if you take one back?",
      /* First person: `consider` renders inside the colleague block, under her own name
         and photograph, and the advisor on this beat is Aisha. Asking the player what
         Aisha would stop planning for, in Aisha's voice, was the one place in fourteen
         of these lists where the speaker talked about herself in the third person. */
      "What do I stop planning for if you qualify it?",
    ],
    tip: "I am not trying to catch you out. I am trying to write a plan I can hold.",
    prompt: "She needs one answer to take away. The rest stay exactly as written.",
    question: "Which ones did you mean?",
    options: [
      {
        id: "o-meant-the-date",
        title: "Stand behind the date",
        icon: "clock",
        /* The pilot, and only the pilot — a date you never promised is not a sentence
           anybody can read back at you. */
        requires: { any: ["promised:fast", "fragile_timeline"] },
        description: "The pilot date is in the contract and on Sarah's board slide. It holds.",
        say: "The eight weeks was a commitment, not a flourish. Plan to it and tell me what it needs.",
        commits: "Aisha plans against a date nobody has tested.",
        pros: ["The client keeps what they bought", "No promise reopened"],
        cons: ["The team absorbs the difference", "You have not checked it holds"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m10h-date-founded",
            when: { any: ["has:data", "ops_onside"] },
            tone: "strong",
            headline: "She takes the date, because somebody had already checked it.",
            detail:
              "You are standing behind a date that rests on something — the data audit, or an Operations team already inside the programme. Aisha does not have to believe you. She can look at the thing the date depends on and see that it exists, which is a different conversation from the one she was expecting. She plans to the eight weeks and stops asking.",
            changed: [
              "The date is now a plan rather than a promise",
              "You have committed the firm to resourcing it",
            ],
            effect: { dims: { win: 5, deliver: 2, profit: -4 }, badge: "connected_dots" },
            lesson: {
              principle: "I can plan to a date somebody checked. I cannot plan to one somebody hoped for.",
              because:
                "The eight weeks held because months earlier you funded the dull thing that made it true — the audit, or the Operations stream. Standing behind it therefore cost you money and nothing else.",
              watchFor: "Before repeating a date out loud, ask what it is resting on.",
            },
          },
          {
            id: "m10h-date-hollow",
            tone: "hard",
            headline: "She writes the date down, and then writes down what it will cost.",
            detail:
              "Nothing underneath the eight weeks has changed since you wrote it, so the only variable left is how hard her team works. Aisha plans to it because you told her to, and the plan she produces has the two people who understand the programme best on it every weekend until the pilot ships. Sarah's board keeps its date. Nobody who has to hit it was in the room when it was agreed.",
            changed: [
              "The date survives",
              "The plan behind it depends on people working weekends",
              "Aisha has your answer in writing",
            ],
            effect: { dims: { win: 3, deliver: -10, profit: -2 } },
            lesson: {
              principle: "Standing behind a promise is free for me and expensive for whoever keeps it.",
              because:
                "You repeated a date you had never tested, so nothing about the work got easier and nothing about the plan got firmer. That is not a commitment, it is a transfer.",
              watchFor:
                "When you confirm a commitment, ask what has changed since you made it. If the answer is nothing, nothing is fixed.",
            },
          },
        ],
      },
      {
        id: "o-meant-with-conditions",
        title: "Name what it depends on",
        icon: "scale",
        /* You can only attach conditions to a promise large enough to have them. All
           three of these record a proposal that reached further than its plan. */
        requires: { any: ["scope:heavy", "unanchored", "risk_accepted"] },
        description: "Keep the promise and write down the things that have to be true first.",
        say: "I meant the rebuild. I did not mean it without Operations. Put the conditions in writing.",
        commits: "Sarah reads a caveat that was not there at signature.",
        pros: ["The promise survives with limits", "Delivery inherits a boundary"],
        cons: ["A condition appears after signature", "Reads as a retreat"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m10h-qualify-heard",
            when: { any: ["ops_onside", "evidenced", "credibility", "reviewed"] },
            tone: "strong",
            headline: "The conditions go in, and nobody treats them as an excuse.",
            detail:
              "You have a record of being accurate with this client, so a list of dependencies reads as a delivery plan rather than as a firm reaching for the exit. Sarah signs them off inside a week. Aisha now has a document saying what has to be true, and a date she is permitted to move if it is not.",
            changed: [
              "The promise now carries written conditions",
              "Sarah has seen a caveat she had not seen before",
              "Aisha can re-plan without a negotiation",
            ],
            effect: { dims: { deliver: 9, win: -3 }, badge: "smart_tradeoff" },
            lesson: {
              principle: "A promise with its conditions written beside it is the only kind I can actually manage.",
              because:
                "You did not take the rebuild back. You said out loud what it needs, and because this client had reason to read you generously that cost a conversation rather than a renegotiation.",
              watchFor: "The cheapest moment to attach a condition is before anybody has planned around its absence.",
            },
          },
          {
            id: "m10h-qualify-late",
            tone: "mixed",
            headline: "They accept the conditions and read them as a warning.",
            detail:
              "You are right that the rebuild depends on things nobody has agreed to. You are also introducing that fact after the signature, to a client with no particular reason to give you the benefit of the doubt. The conditions go in. So does a fortnightly review you did not ask for.",
            changed: [
              "The conditions are written down",
              "The client now checks the programme far more closely",
            ],
            effect: { dims: { deliver: 6, win: -6, profit: -1 } },
            lesson: {
              principle: "Qualifying a promise spends whatever standing we have, and this time we were spending on credit.",
              because:
                "The conditions were the same conditions either way. What decided how they landed was whether this client had any reason to read you generously, and that was settled months ago.",
              watchFor: "Notice which conversations you are able to have because of how the earlier ones went.",
            },
          },
        ],
      },
      {
        id: "o-meant-the-dull-lines",
        title: "Stand behind the dull lines",
        icon: "layers",
        /* You cannot ring-fence a workstream you never bought. These are the three
           unglamorous things m5b and m7 let the player pay for. */
        requires: { any: ["has:training", "has:ops_workstream", "has:data"] },
        description: "The training, the integration stream, the measurement work. None of it gets trimmed.",
        say: "The unglamorous lines were not padding. Nobody trims them to make a date, including me.",
        commits: "You give up the easiest thing to cut later.",
        pros: ["Delivery keeps its scaffolding", "Nothing reopened"],
        cons: ["The cost lines all stay", "Nothing new for the client"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m10h-dull-kept",
            when: { any: ["ops_onside", "has:training", "has:ops_workstream"] },
            tone: "strong",
            headline: "The first thing anybody cuts is the first thing you protected.",
            detail:
              "Training and integration are always what goes when a programme needs to find a fortnight, because nobody outside the delivery team ever notices they have gone. You have said in advance that they do not move. Aisha now has an answer ready for the first person who asks her to find the fortnight, and it is your answer rather than hers.",
            changed: [
              "The adoption and integration work is ring-fenced",
              "The cost of it stays on your side of the page",
            ],
            effect: { dims: { deliver: 7, profit: -6, win: 1 }, badge: "connected_dots" },
            lesson: {
              principle: "I have had the training workstream taken off me twice, and both times by somebody who meant well.",
              because:
                "You bought those lines months ago and have now said they are not available as savings. That is worth nothing in a pitch and it is the reason month nine will be quiet.",
              watchFor: "Notice which parts of a plan nobody outside your own team would miss. Those are the ones that vanish.",
            },
          },
          {
            id: "m10h-dull-thin",
            tone: "mixed",
            headline: "You protect the measurement work, and there is not much else to protect.",
            detail:
              "The instrumentation stays, so somebody will eventually be able to prove whether this programme worked. That is a real thing to have defended. It is also the only unglamorous line in the document — the adoption work and the integration stream were never bought, so there is very little scaffold underneath the promise you are standing behind.",
            changed: [
              "The measurement work is ring-fenced",
              "There is less underneath it than Aisha had hoped",
            ],
            effect: { dims: { deliver: 4, profit: -5, win: -2 } },
          },
        ],
      },
      {
        id: "o-did-not-mean-the-number",
        title: "Take the number back",
        icon: "cross",
        /* Only available to a player who put a figure in a contract — at m6b by pricing
           on the outcome, or at m9a by writing Foyle his justification. */
        requires: { all: ["outcome_based"] },
        description: "Go to Sarah and remove the figure a third of the fee hangs on.",
        say: "The payback figure was mine, not theirs. I would rather unsay it now than miss it in month nine.",
        commits: "Withdrawing something the client agreed to in writing.",
        pros: ["The exposure disappears", "Aisha stops planning around it"],
        cons: ["Withdrawing a written commitment", "Sarah defended that number internally"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m10h-payback-cold",
            when: { any: ["evidenced", "has:data"] },
            tone: "hard",
            headline: "You take back the one number they trusted.",
            detail:
              "The payback figure rested on a baseline you had actually audited — half a million contacts a year, counted out of their own system — which is exactly why Sarah could put it in front of her board. Withdrawing it now does not read as prudence. It reads as a firm that has looked at its own commitment and lost confidence in it, and the first person to say so out loud is you.",
            changed: [
              "The fee no longer moves with the result",
              "Sarah has to go back to a board that approved it",
              "The one distinctive thing in the bid is gone",
            ],
            effect: { dims: { win: -12, profit: 5, deliver: 3 } },
            lesson: {
              principle: "We withdrew the only commitment nobody else in that race would have made.",
              because:
                "The number was defensible, because you had the baseline underneath it. Unsaying a promise you could have kept buys back an exposure you were not really carrying and costs you the reason they chose you.",
              watchFor: "Before withdrawing a promise, check whether it was the promise that was weak or your nerve.",
            },
          },
          {
            id: "m10h-payback-right",
            tone: "strong",
            headline: "She is not pleased, and she is relieved.",
            detail:
              "Nobody ever agreed what a support contact was, or counted how many of them there were before you started. So the better part of a million pounds turns on halving a number neither side has ever written down. The clause was going to produce its first argument in month nine, with your own fee on the table and no baseline either side could point at. Taking it out now costs you a difficult half hour with a sponsor who defended it. Leaving it in would have cost Aisha the whole of month nine.",
            changed: [
              "A third of the fee no longer turns on an undefined number",
              "Sarah is cooler, and clear about why",
            ],
            effect: { dims: { profit: 8, deliver: 4, win: -7 }, badge: "smart_tradeoff" },
            lesson: {
              principle: "I would rather have a hard half hour now than an argument about measurement in month nine.",
              because:
                "There was never a baseline both sides believed, so the clause was an argument with a date on it. Withdrawing it spent goodwill and removed the argument, which is a trade worth making in that order.",
              watchFor: "A number in a contract is only as good as the thing everybody has agreed to count.",
            },
          },
        ],
      },
      {
        id: "o-meant-all-of-it",
        title: "All of it stands",
        icon: "flag",
        /* The unconditional answer, and still gated — on the one thing every run that
           reaches this beat has done. `won` rather than `signed`, though both are
           guaranteed here, because `won` is on the rail: the ledger has been telling the
           player "everything after this is about keeping what you said" since the award,
           so the card's provenance points at something they have already read rather than
           at invisible state. See the note above the mission. */
        requires: { all: ["won"] },
        description: "You wrote it and you meant it, and you are not going through it line by line.",
        say: "All of it. I wrote every line and I meant it. I am not unpicking it now.",
        commits: "Aisha gets no help narrowing what she has to keep.",
        pros: ["Nothing reopened with the client", "The document stays whole"],
        cons: ["Aisha plans around all of it", "You have checked none of it"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m10h-all-sound",
            when: {
              none: ["scope:heavy", "promised:fast", "descoped", "risk_accepted", "discounted", "overrode_review"],
            },
            tone: "strong",
            headline: "There was nothing in there you needed to take back.",
            detail:
              "Aisha goes through it line by line and finds a proposal that promises what the programme is resourced to do. Nothing was oversold to win the argument, nothing was cut to reach a price, and no review finding went in unfunded. Saying that every sentence stands takes four minutes, because it happens to be true.",
            changed: [
              "The whole document stands, and it holds",
              "Aisha plans from the proposal rather than around it",
            ],
            effect: { dims: { win: 4, deliver: 3, profit: 2 }, badge: "held_nerve" },
            lesson: {
              principle: "The best version of this meeting is the short one, and I have only had it twice.",
              because:
                "Nothing had to be qualified because nothing had been oversold. That was settled in the scoping and the pricing, not by anything you said to Aisha this morning.",
              watchFor: "Whether this conversation is short is decided months before anybody has it.",
            },
          },
          {
            id: "m10h-all-loaded",
            tone: "hard",
            headline: "You confirm all of it, including the parts you have not read since.",
            detail:
              "She asked which sentences you meant and you told her all of them, which is the one answer that gives her nothing to work with. So she plans to the whole document: the date, the reach, the finding the review left open. Every judgement about which promises were commitments and which were enthusiasm now belongs to her, and she will make them alone, in the week she is two people short.",
            changed: [
              "Every sentence is now a commitment",
              "Aisha is deciding on her own which ones were real",
              "Nothing was reopened with the client",
            ],
            /* Winability +2 rather than +5, and the difference is the whole reading of
               this branch: confirming everything buys the ABSENCE of a bad conversation,
               not the presence of a good one. Nothing reached the client, so nothing about
               their view of you improved — whereas `m10h-all-sound` genuinely confirms a
               document that holds, and is paid for it. It still carries the highest
               Winability of the five loaded branches, which is what keeps the option from
               being dominated: every other answer here costs the client something visible. */
            effect: { dims: { win: 2, deliver: -12, profit: 1 } },
            lesson: {
              principle: "Confirming everything is the same as deciding nothing, and I am the one who finds that out.",
              because:
                "You had the whole pursuit in front of you and treated every line as equally meant. The sentences written to win and the sentences written to do are now indistinguishable to the person delivering them.",
              watchFor: "If you cannot name which of your own promises was the weakest, somebody else will have to.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "Every sentence in there is a promise somebody keeps, and I would rather be told which ones you meant.",
      because:
        "Nothing in the proposal changed today. What changed is that somebody who has to deliver it now knows which lines you would defend and which you were hoping nobody would read closely.",
      watchFor:
        "The person who inherits a promise is rarely the person who made it. Say which ones were real while saying it is still cheap.",
    },
    next: "turn-sarah",
  },

  {
    kind: "interlude",
    id: "turn-sarah",
    role: "turn",
    chapter: 5,
    eyebrow: "Monday, month six",
    title: "Sarah resigns",
    body: [
      "Orion announced it internally on a Monday morning. Sarah Lim is leaving for a bigger role elsewhere and finishes in three weeks.",
      "She had known for a month. She could not say, and she did not, to her team or to you.",
      "Her calendar empties over the following week and no successor is named. The programme she put her name to stays exactly where it is, with her name still on it.",
    ],
    prompt: "Three weeks of handover, and nobody has been appointed to receive it.",
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
    presentation: "dialogue",
    surface: "call",
    variants: [
      /* How month five was handled now reaches the sponsor-succession beat. These three
         also make `crunched`, `undisclosed` and `changed_scope` genuinely READ, rather
         than being declared narrative-only — which was the cheap option and the wrong
         one, since each records a real position the player's successor inherits. */
      {
        when: { all: ["crunched"] },
        situation: [
          "Sarah is leaving. She finishes in three weeks, and she was your sponsor, your budget holder and your advocate.",
          "And the two people who held the date in month five put their roll-off requests in the same week. The programme is losing its sponsor and its memory together.",
        ],
      },
      {
        when: { all: ["undisclosed"] },
        situation: [
          "Sarah is leaving. She finishes in three weeks, and she was your sponsor, your budget holder and your advocate.",
          "Whoever replaces her will read the original proposal rather than the version that shipped, and nobody has written down why those differ.",
        ],
      },
      {
        when: { all: ["changed_scope"] },
        situation: [
          "Sarah is leaving. She finishes in three weeks, and she was your sponsor, your budget holder and your advocate.",
          "One thing is in your favour: the change you priced in month five is signed and dated, so her successor inherits a boundary rather than an argument.",
        ],
      },
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
      ...SARAH,
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
    tip: "Marcus is staying. Whether that is a rope or a wall depends on whether he has people on this.",
    prompt: "Three weeks before the room changes.",
    question: "What do you do with the three weeks?",
    options: [
      {
        id: "o-broaden",
        title: "Broaden the base",
        icon: "people",
        description: "Get the programme owned by three people instead of one.",
        say:
          "Then I need more than one person who cares. Three weeks getting Marcus and his peers to own this.",
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
              dims: { win: 6, deliver: 5 },
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
            changed: ["Two more names attached", "Neither of them owns it", "Three weeks spent on introductions"],
            /* Was `win +3, deliver +1`, which does not match its own prose: three weeks
               spent producing two people who will not block the programme, relationships
               started from nothing at the worst possible moment. That is a poor result and
               the numbers said it was a decent one — which is how `o-broaden` came to beat
               `o-prove-fast` on all three dimensions in 91% of reachable states. The
               correction is to the number, not to the option that lost to it: you got two
               names, and you spent your last three weeks not shipping anything. */
            effect: { dims: { win: 1, deliver: -2 } },
          },
        ],
      },
      {
        id: "o-prove-fast",
        title: "Get something live before she goes",
        icon: "rocket",
        description: "Ship whatever is demonstrable while the sponsor is still there.",
        say: "Then I want something live before you go. Three weeks, one region, a thing that actually runs.",
        commits: "Three weeks of pressure on the delivery team.",
        pros: ["A result on the record", "Hard to cancel a working thing"],
        cons: ["Rushed and partial", "Costs the team"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m10c-prove-ready",
            when: { any: ["has:data", "promised:fast", "ops_onside", "changed_scope"] },
            tone: "strong",
            headline: "Something real goes live, and it outlives her.",
            detail:
              "You had the foundations to move quickly, so three weeks was enough to put a working thing in front of the business. A new sponsor can cancel a plan easily. Cancelling something that already works is a much harder meeting.",
            changed: ["A live result on the record", "The team is tired"],
            /* Winability well above the handover memo's +6, because this is the only
               option that converts belief into evidence while the believer is still in
               post — her successor arrives to a thing that works rather than a document
               arguing that it will. Deliverability pays for the rush, which is honest,
               and the cost stays in profit. It was +10/+2/-3 against the memo's
               +6/+3/+2, i.e. beaten on two dimensions of three and dominated in 91% of
               reachable states. */
            effect: { dims: { win: 10, deliver: -2, profit: -3 } },
          },
          {
            id: "m10c-prove-thin",
            tone: "hard",
            headline: "You ship a demo and it convinces nobody.",
            detail:
              "Three weeks was not enough to stand anything up properly, so what goes in front of Sarah is a prototype with the difficult parts stubbed out. Her successor reads it as a programme with nothing to show after five months.",
            changed: ["Something shipped", "It made the programme look weaker, not stronger"],
            /* Deliverability POSITIVE even on the thin branch, which is the point of
               the option: something exists and runs. It is unimpressive and it is real,
               and a successor arriving to a working increment is in a better delivery
               position than one arriving to a plan — whatever they think of the increment.
               At -4/-5/-1 this branch was beaten on all three by `o-broaden`'s cold
               branch (+3/0/+1) in 94% of reachable states, which made the whole option a
               trap rather than a choice. */
            effect: { dims: { win: -4, deliver: 2, profit: -1 } },
          },
        ],
      },
      {
        id: "o-handover",
        title: "Write the handover she needs",
        /* A document that makes the case without Sarah in the room needs a case that
           stands on its own. Without evidence there is nothing to write down. */
        requires: { any: ["evidenced", "outcome_based", "knows:criteria"] },
        icon: "layers",
        description: "Give Sarah the document that makes the case without her in the room.",
        say: "Then I write the case down properly, in your own data, so the argument does not depend on you.",
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
            effect: { dims: { win: 4, deliver: 2, profit: 2 } },
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
      principle: "Relationships are infrastructure. We had one route into this client, and she is leaving.",
      because:
        "Nothing about the work changed. One person left, and the programme's future changed with them — because its future was attached to that one person.",
      watchFor: "Sponsors move roughly every eighteen months. Programmes rarely finish faster than that.",
    },
    next: "deb-5",
  },

  {
    kind: "interlude",
    id: "deb-5",
    role: "chapter-debrief",
    chapter: 5,
    eyebrow: "Chapter five, closed",
    title: "What was already true",
    body: [
      "Nothing in this chapter was new. Month five, the staffing and the resignation all arrived out of decisions taken when they cost nothing.",
    ],
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
    "m10h",
    "m10c",
  ],

  /**
   * The causal threads — "because you did this, later that happened".
   *
   * These lived in `engine.ts` as a `const`, which put the most content-shaped table in
   * the game beyond the reach of whoever writes the content. It showed: five rules
   * existed, `DECISIONS.md` D-012 claimed nine, and **77% of runs ended with this
   * section empty** — the section `engine.ts` itself calls "the payoff of the whole
   * design".
   *
   * The seven added below were not guessed. Three thousand random playthroughs were
   * walked and every co-occurring pair of outcomes counted, so each new rule joins two
   * things that genuinely happen together often — `m2-ops + m7-anchored` co-occurs on
   * 24% of runs, `m3-campaign + m5b-spread` on 20% — and each pair had to be a real
   * cause, not merely a frequent coincidence. Several commoner pairs were rejected for
   * exactly that reason.
   *
   * A rule needs at least two outcomes. Four once fired on a single outcome, so a
   * section introduced as "the chains your own decisions created" presented one decision
   * restated as a chain, and one simply paraphrased its own outcome's detail text.
   *
   * ON `insteadOf` — the wrong answers for the debrief's one causal-claim item.
   *
   * The item shows `soLater` and asks which earlier decision led to it, so each entry has
   * to be a decision the player could believe caused this and did not. Two failure modes
   * were steered around deliberately, and both make the item worthless:
   *
   *  · THE "I NEVER DID THAT" DISTRACTOR. A wrong answer describing something the player
   *    plainly never chose is eliminated without a thought about causation, and the item
   *    degrades into a memory test. So every entry below is a decision that is either
   *    forced by the same chain — a player standing behind the pilot date necessarily put
   *    a pilot in the proposal — or drawn from the multi-pick beats, where three of six
   *    and two of six make any given component a coin toss rather than a long shot.
   *  · ACCIDENTALLY TRUE. If the wrong answer also fed the consequence, the attentive
   *    learner is right and the game tells them they are wrong. Each entry was checked
   *    against the flags the outcome's own `when` reads, and against the ones every
   *    outcome on the path between reads. That check removed more candidates than it
   *    kept: the workshop with Marcus is out of the Operations threads because it does
   *    make Operations invested; `o-conventional` is out of the level-scorecard thread
   *    because its own outcome prose says the bids became indistinguishable; the review
   *    week spent on the integration detail is out of the date thread because a testing
   *    plan genuinely does hold a date up.
   *
   * Four rules carry none, which is the field working as intended rather than a gap: a
   * rule with no `insteadOf` is never chosen as the item. `m9-mitigate-broke` fires only
   * on `discounted`, which only `m8-discount` sets, so rule two cannot fire unless rule
   * one has already fired and taken the item — writing distractors for it would author
   * copy no player can reach. The other three are threads whose `soLater` is an
   * observation rather than an event, or whose only honest cause is the thread's own
   * other half. Eleven of fifteen carry them, which puts the item on about three runs in
   * five; the rest end with the threads and no question, as they did before.
   */
  threads: [
    {
      needsOutcomes: ["m8-discount", "m9-mitigate-broke"],
      because: "You met the client on price to close the gap.",
      /* "…had already been spent winning the deal" until the pedagogy pass, which is the
         answer restated: only one candidate is about winning, so the item was decidable
         on the echo rather than on the causation. The clause was decoration — the chain
         still reads without it. */
      soLater:
        "When the review found a real risk, the money that would have covered it was already gone.",
      /* The near-miss is an expensive programme mistaken for a spent contingency. Every
         run reaches a review finding of some kind, so the decision that shaped WHICH
         finding it was is not the decision that made the finding unaffordable. */
      insteadOf: [
        "You took two weeks of paid discovery rather than pitching the full programme.",
        "You promised to rebuild the systems the whole operation runs on.",
        "You spent the internal review week on the pitch rather than on putting slack back in the commercial case.",
      ],
    },
    {
      needsOutcomes: ["m9-mitigate-broke", "m10-absorb-broke"],
      because: "The mitigation you could afford was thinner than the one the review asked for.",
      soLater:
        "In month five there was nothing left to absorb the problem, and the contract went underwater.",
    },
    {
      needsOutcomes: ["m7-anchored", "m10-reset-trust"],
      because: "You put an Operations workstream in the proposal before anyone asked for one.",
      /* The stem used to name Operations, which the answer also names and no distractor
         could name without becoming true. Saying it the long way keeps the chain
         readable in the band and stops the item being decidable on one word. */
      soLater:
        "When delivery needed to be re-planned, the people who would have had to absorb it were already inside the programme — so a hard conversation was treated as management rather than failure.",
      /* Two, not three: `m10-reset-trust` also opens on `evidenced` and on `credibility`,
         which rules out every distractor about their own data, the reference visit, the
         point of view and the warm introduction — all of them would have been true. What
         is left is the proposal's showier half and the shape of the deal. */
      insteadOf: [
        "You put an eight-week pilot in the proposal so the board could see something.",
        "You restructured the deal into phases so the board's first cheque was small.",
      ],
    },
    {
      needsOutcomes: ["m7-overreach", "m10-push-fragile"],
      /* The fault clause — "with no route into production" — came off, and the stem lost
         "could not reach the business it was built for", which was the same sentence
         said twice. One candidate carrying its own indictment is not a question. What
         is left is a promise and what happened, both of them true, and the item is now
         which of four promises produced that. */
      because: "You promised to rebuild the systems at the centre of their operation.",
      soLater:
        "Something shipped on the promised date. Three weeks later the support queue was worse than it had been before, and two of the delivery team had asked to come off it.",
      /* The pilot and the accepted risk are both absent on purpose: `m10-push-fragile`
         opens on `promised:fast` and on `risk_accepted` as well, so either would have
         been a second true answer. These three are the ambition, the dependency and the
         price — the three things a player blames before they blame the missing stream. */
      insteadOf: [
        "You put the customer journey redesign in alongside it, as the most visible piece in the document.",
        "You brought in a logistics partner who already runs returns at this scale.",
        "You met their number by coming down on price rather than taking work out.",
      ],
    },
    {
      needsOutcomes: ["m2-both", "m6-real-evidenced"],
      because: "You spent your two questions on the complaints and on who actually decides.",
      soLater:
        "You could open the solution conversation with their own evidence, which is why nobody argued with you.",
      /* All three are ways of being believed that are not evidence — the introduction,
         the reference, the competitor work. The outcome they are wrong about says so
         itself: "you open with their complaint volumes rather than your credentials".
         Two of the three come from the fortnight, where two of six are funded, so they
         cannot both be dismissed from memory the way two single-pick beats can. Sarah
         is named twice on purpose: one candidate naming a person and three not is a
         tell of its own. */
      insteadOf: [
        "You used your warm introduction on thirty minutes with Sarah.",
        "You spent a fortnight taking Sarah to a retailer where you had already delivered.",
        "You put a fortnight into working out exactly where the rival's platform stops.",
      ],
    },

    /* ── added from the co-occurrence measurement ───────────────────────────── */
    {
      needsOutcomes: ["m2-ops", "m7-anchored"],
      because: "You used a question to find out who could stop this, and it was Marcus Reed.",
      soLater:
        "The proposal named his systems and his people, so the person best placed to object had nothing left to object to.",
      /* Three plausible ways to quiet an Operations Director, none of which is giving his
         team a named role. The workshop with his leads is deliberately not among them:
         it would have quieted him too. Two of the three say Sarah, because the answer
         says Marcus and a stem about "his systems and his people" makes the only
         candidate naming anybody findable without reading it. */
      insteadOf: [
        "You told Sarah the damage happened after the sale, not on the shop floor.",
        "You put an eight-week pilot in, so Sarah's board would see something inside two months.",
        "You brought in a logistics partner who already runs returns at this scale.",
      ],
    },
    {
      needsOutcomes: ["m2-ops", "m6-asked"],
      because: "You learned who could stop this, and then proposed the thing they had already asked for.",
      soLater:
        "The information was in your hands and not in the document. Knowing who matters is only worth what you do with it.",
    },
    {
      needsOutcomes: ["m3-campaign", "m5b-spread"],
      because: "You went wide to get attention, then spread your two discovery weeks thin.",
      /* "Breadth twice over." opened this and has come off: the answer is the only
         candidate naming two decisions, so a stem announcing that there were two of
         them answered its own question. The rest of the line carries the thread. */
      soLater:
        "You entered the solution phase knowing a little about a lot, which is the position every competitor was also in.",
      /* The game has two fortnights in it and only one of them was spent thin, which is
         the whole near-miss. All three are decisions to go and find something out — the
         wrong answer is that any of them is what left you shallow. The early questions
         are not offered: spending those on the race rather than the problem genuinely
         does leave you here. Three rather than two, because all of them come from
         single-pick beats and two could be dismissed from memory together. */
      insteadOf: [
        "You spent days working out exactly what the rival had actually sold them.",
        "You took two weeks of paid discovery rather than pitching the full programme.",
        "You spent six weeks on Apex before you came back to this one.",
      ],
    },
    {
      needsOutcomes: ["m5b-spread", "m7-overreach"],
      because: "You funded a little of everything rather than two things properly.",
      soLater:
        "With nothing proven, the proposal had to promise instead — and promising is what you do when you cannot demonstrate.",
    },
    {
      needsOutcomes: ["m7-anchored", "m9b-proceed-sound"],
      because: "Operations had people named in the proposal before signature.",
      /* The reason clause used to be "because the part most likely to fail already had
         an owner", which is the answer with the nouns changed. This one is the other
         half of the same outcome's detail — "work you understand" — and it points at
         the paid discovery rather than at the answer, which is what a reason clause in
         a stem should do. */
      soLater:
        "Signing was a defensible decision rather than a hopeful one, because you were taking on work you already understood.",
      /* Written without "you", because `because` is: a distractor in a different voice
         from the answer is findable on style alone, which is the oldest flaw in multiple
         choice. Each is a real reduction in what signing risked, and none of them gave
         anything an owner. */
      insteadOf: [
        "An eight-week pilot was in the proposal, with a date attached to it.",
        "The programme had been split into phases before it went to the board.",
        "A paid discovery had already put your team inside the business.",
      ],
    },
    {
      /* Repointed. This rule used to pair `m5b-grounded` with `m9a-value-strong` and
         credit the fortnight for the award, which was wrong twice over. `m9a-value-strong`
         opens on `evidenced` or `knows:real_pain` and on neither of the flags
         `m5b-grounded` needs, so the fortnight was never its cause — and `m5b-grounded`
         gates on flags rather than on picks, so a Builder who took the point-of-view
         route arrives holding `has:data` and `ops_engaged` already and the outcome fires
         whatever they fund. The ending was telling those players they had bought two
         things they had not. This pair is the chain that actually runs. */
      needsOutcomes: ["m6-real-evidenced", "m9a-value-strong"],
      because: "You opened the solution conversation with their complaint volumes rather than your credentials.",
      soLater:
        "At the award you could argue from their own numbers. Procurement did not have to like you; it had to be able to justify you.",
    },
    {
      needsOutcomes: ["m6-asked", "m9a-lost-submit"],
      because: "You proposed what they asked for, and then let the submission speak for itself.",
      soLater:
        "Three capable proposals arrived and nothing separated them but price. A scorecard with every column level is decided on cost.",
      /* Three efforts aimed at people, against a decision made on a form. Keeping the
         conventional shape is not here, because that outcome's own prose already says
         three firms ended up offering the same answer — it would have been true. The
         third says "document" so that the answer is not the only candidate about the
         thing being scored. */
      insteadOf: [
        "You put a campaign into the market, and kept your senior people free for other work.",
        "You took Sarah to see the work you had already done for another retailer.",
        "You spent the internal review week making the document argue harder for Sarah's board.",
      ],
    },

    /* ── the handover, which is where the pursuit finally answers for itself ───── */
    {
      needsOutcomes: ["m7-overreach", "m10h-all-loaded"],
      because: "You confirmed every sentence in a proposal that had no route into production.",
      /* "Aisha planned to all of it" has come off the front: "all of it" and "every
         sentence" are the same claim, and the two distractors that remained were about
         staffing and dates, so exactly one candidate was about the document. The stem
         now says what happened and leaves which decision caused it genuinely open, and
         it baits the staffing answer rather than the right one. */
      soLater:
        "The judgement about which promises were real ended up being made by the person who had to keep them, on her own, in the week she was two people short.",
      /* Three decisions about the document she inherited, one of them true. The
         discount, the pilot, the part taken out to reach their number, the accepted
         risk and the overruled review are all excluded — `m10h-all-sound`'s `none` list
         names every one of them, so each is a reason this branch fired rather than its
         sibling. */
      insteadOf: [
        "You wrote a payback figure into the bid for procurement to score.",
        "You signed it as it stood rather than reopening the clauses you liked least.",
        "You staffed the gap with two graduates and your own time reviewing their work.",
      ],
    },
    {
      needsOutcomes: ["m6b-outcome-blind", "m10h-payback-right"],
      because: "You tied a third of the fee to a figure nobody had a baseline for.",
      /* "argue about measurement" has gone, because the answer is the only candidate
         about a number and the stem was pointing straight at it. What is left is the
         position — a thing that can only be settled by an argument you will be paying
         for — and one distractor now gives away part of the fee as well, so "your own
         fee" stops being diagnostic. */
      soLater:
        "At the handover the only options were to unsay it or to spend month nine arguing about it, with your own fee riding on how the argument went.",
      /* Three other commitments of the same size, and the item is which kind of promise
         can only be settled by an argument: a date can be checked, a price is a price,
         and a number nobody has defined is a disagreement with a date on it. */
      insteadOf: [
        "You promised something live inside eight weeks, and put the date in the contract.",
        "You committed to rebuilding the returns and support systems the business runs on.",
        "You gave up part of the fee to close the gap with the cheaper bid.",
      ],
    },
    {
      needsOutcomes: ["m5b-grounded", "m10h-date-founded"],
      /* Was "You spent a fortnight on a workshop and a data audit instead of on the
         pitch", which is false on the runs that reach `m5b-grounded` holding `has:data`
         from the Builders strength and `ops_engaged` from the point of view — the
         outcome gates on flags, not on picks, so it fires whatever they funded. This
         line states what every such run is actually carrying, which is what the m5b
         screen told them at the time. */
      because: "You had Operations in a room and a view of their data before anybody wrote a date down.",
      soLater:
        "Months later you could say the pilot date out loud and be believed, because it rested on more than your own confidence.",
      /* The first is guaranteed — standing behind the pilot date means a pilot went in
         the proposal — and it is still wrong, because putting a date in a document is
         not the same as knowing what it rests on. The other two buy capacity, which is
         the commonest thing to mistake for having checked. */
      insteadOf: [
        "You put an eight-week pilot in the proposal so something would be live early.",
        "You brought in two experienced contractors at twice the rate to fill the gap.",
        "You added people to the programme and carried the cost of them yourselves.",
      ],
    },
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
      missionIds: ["m10", "m10b", "m10h", "m10c"],
      steps: ["Month five", "Two people short", "The handover", "The unexpected"],
    },
  ],
  nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
};
