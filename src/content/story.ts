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
 * questions out of five, six activities and room for two — and columns that line up are
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
  quote: "Three names on the table, one team. We don’t get to chase all of them.",
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
  quote: "Whatever we write down, somebody has to build. I’drather promise less and mean it.",
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

/* The client-side speakers, written once. Four hand-copied copies of Sarah’s had already
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
        flags: ["start:connector", "credibility"],
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
        flags: ["start:builder", "has:data"],
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
    title: "Find a client",
    body: [
      "I’m Priya — I find new clients for our firm. Three companies want help this quarter, and our six people can only chase one.",
      "You pick one, find out what it really needs, and get a first meeting with the person who decides.",
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
    objective: "Pick the one company your team will try to win as a client.",
    minutes: 3,
    hero: "hero-boardroom",
    situation: [
      "Three companies want outside help this quarter, and our six people can only chase one of them properly.",
      "Pick one, because the other two go to other firms, and we only know what each says it wants.",
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
        text: "You know this market. For each of the three, tell me what it costs us if we chase it and lose.",
      },
      {
        when: { all: ["start:connector"] },
        text: "People take your call, so we can get a meeting almost anywhere. Which of these meetings is worth having?",
      },
      /* A question, like the other two. This one read "Find the one where that is the
         whole argument", so of the three starting strengths the Builders were the one
         being told what to pick. */
      { text: "Your team can show past results. For each company, ask what they would need to see before trusting us." },
    ],
    advisor: PRIYA,
    consider: [
      "How long might each company take to say yes or no?",
      "What would Apex need to see before taking us seriously?",
      "If we chase the wrong one, what does that cost us?",
    ],
    tip: "I put Meridian forward last year and they never signed anything. I would still put them forward.",
    prompt: "One team, one company to chase. Three very different bets.",
    question: "Which company do you try to win?",
    options: [
      {
        id: "o-northwind",
        title: "Go after Orion Retail",
        icon: "target",
        facsimile: "complaints",
        description: "A chain of 210 shops with a real budget. We have done similar work before.",
        commits: "We join late — two other firms are already talking to them.",
        pros: ["Like work we’ve done", "The money looks real"],
        cons: ["Two rival firms got there first"],
        cost: { time: 2, investment: 2 },
        outcomes: [
          {
            id: "m1-nw",
            tone: "strong",
            headline: "Orion takes the meeting despite the rivals.",
            detail:
              "Orion took the meeting. Two other firms were already talking to them, but your past work is close enough to what they’re asking for that nobody wondered why you were in the room.",
            changed: ["Orion is now the client you are chasing", "You start level with the rivals, not behind"],
            effect: { dims: { win: 4, profit: 2 }, flags: ["client:northwind"] },
          },
        ],
      },
      {
        id: "o-apex",
        title: "Go after Apex Industrial",
        icon: "layers",
        facsimile: "timeline",
        description:
          "The biggest contract of the three. It needs factory engineering skills our team does not have.",
        commits: "Six weeks of the whole team on work we have never done.",
        pros: ["Biggest contract on offer", "Team learns a new skill"],
        cons: ["No past clients to vouch", "Six weeks of everyone’s time"],
        cost: { time: 3, investment: 3 },
        outcomes: [
          {
            id: "m1-apex-read",
            when: { any: ["start:challenger", "knows:rivals"] },
            tone: "mixed",
            headline: "Apex said no, but they’ll take your call next time.",
            detail:
              "Apex still picked its shortlist on factory experience, and we still don’t have it. But you went in knowing that, led with the specialist partner we’dbring, and came away with a name to call next time — and Orion is the client we’re chasing now, six weeks late.",
            changed: [
              "Six weeks spent, deliberately",
              "Orion is your pursuit, six weeks late",
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
            headline: "Apex wanted past factory clients. You had none.",
            detail:
              "Apex asked for three past clients who could vouch for similar factory work, and we had none, so the meeting was polite and short. Six weeks went, and Orion — still open — spent them talking to our competitors.",
            changed: [
              "You lost six weeks",
              "Orion is your pursuit, but late",
              "You know the competitive field far better",
            ],
            effect: {
              dims: { win: -8, profit: -3, deliver: 4 },
              flags: ["client:northwind", "late_start", "knows:rivals"],
            },
            lesson: {
              principle: "The biggest contract is only worth chasing if we have a real chance of winning it.",
              because:
                "Apex was worth more than Orion on paper, but with no past factory clients that money was never really on offer to us.",
              watchFor:
                "Before size, ask: is there a real overlap between what they need and what we can actually prove?",
            },
          },
        ],
      },
      {
        id: "o-meridian",
        title: "Go after Meridian Health",
        icon: "shield",
        facsimile: "clause",
        description: "A small, keen hospital group. Hospitals take months to approve any outside spending.",
        commits: "Weeks of waiting on their approvals, with no date promised.",
        pros: ["Keen, ambitious client", "Opens up healthcare work"],
        cons: ["Approvals may stall for months", "Smallest contract today"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m1-mer",
            tone: "mixed",
            headline: "Meridian stuck in approvals, so you walked away.",
            detail:
              "Their team liked us; their approvals didn’t move. After a month you walked away before more time was wasted, and picked up Orion, which was still open.",
            changed: [
              "A month spent, nothing to show",
              "Stopped before more time was wasted",
              "Orion is your pursuit, team intact",
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
      principle: "A firm wins work where what the client needs matches what it has already done before.",
      because:
        "All three companies had real money to spend, but only some of it was money your team could win this quarter.",
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
    objective: "Choose the two things to find out before we meet Orion.",
    minutes: 4,
    /* Was `hero-storefront-wide`, which was BYTE-IDENTICAL to this file — two beats
       establishing two different places from one photograph, under two names. Repointed
       and the duplicate deleted, so the repo stops claiming seven distinct heroes while
       shipping six. m2 wants its own plate; `docs/ASSET-MANIFEST.md` specifies it. */
    hero: "hero-retail-exterior",
    situation: [
      "So it’s Orion, and Sarah Lim, the senior executive who wants this project and answers to her board, sent one line: “improve the customer experience”.",
      "We only have time to find out two things before we meet her, so the other three stay unknown.",
    ],
    client: ORION,
    /* She watched where the last six weeks went, and says so. The fallback is the line
       this beat has always carried, which is the right one when nothing was spent. */
    advisorLine: [
      {
        when: { any: ["late_start"] },
        text: "We lost six weeks on Apex. That is why we only have time for two questions.",
      },
      {
        when: { any: ["spent_effort"] },
        text: "A month waiting on Meridian’s approvals taught us nothing about Orion. Which of these do we know least about?",
      },
      { text: "Sarah’s one line tells us what she wants. Pick the two answers that could change what we say to her." },
    ],
    advisor: PRIYA,
    consider: [
      "Which answer would change what we offer Orion?",
      "Which could we find out later, once we are inside?",
      "Which would we regret not knowing in the first meeting?",
    ],
    tip: "My last three deals fell apart over the budget, not the pitch. I would spend one question on money.",
    prompt: "You have time for two of the five.",
    question: "Which two things do you find out?",
    slots: 2,
    evidence: [
      {
        id: "ev-pain",
        label: "The complaints",
        question: "What are Orion’s customers actually complaining about?",
        /* The whole financial spine of the game starts on this card, and starts here
           deliberately: half a million contacts at roughly five pounds each is the only
           place the raw figures are introduced, and it is a thing the player SPENDS one
           of two questions to learn. Everything downstream — the value case at m9a, the
           premium defence at m8, the payback clause — is arithmetic on these two
           numbers and adds none of its own. Round rather than precise, because
           "roughly five pounds" is a credible estimate and "£5.14" is a fabrication. */
        reveals:
          "Hardly anyone complains about the shops. Nearly all the complaints are about what happens after they buy — deliveries that arrive late, refunds that take three weeks, a helpline that cannot see the order. Their service team handles about half a million of these a year, at roughly five pounds a contact to answer. The shop floor is not the problem.",
        flags: ["knows:real_pain"],
      },
      {
        id: "ev-sponsor",
        label: "The decision-makers",
        question: "Who is pushing for this, and who could stop it?",
        reveals:
          "Sarah Lim, the Chief Transformation Officer, is pushing for it and controls the money. But the shops, warehouses and deliveries that would have to change are run by Marcus Reed, the Operations Director, who has not been in a single meeting so far.",
        flags: ["knows:ops_constraint"],
      },
      {
        id: "ev-rivals",
        label: "The rival firms",
        question: "Who else is trying to win this work?",
        reveals:
          "Two other firms. One is well ahead and offering to redo the shops — a new app, new screens in every shop, and a flashy demo.",
        flags: ["knows:rivals"],
      },
      {
        id: "ev-budget",
        label: "The money",
        question: "How much will they spend, and by when?",
        reveals:
          "The budget is real and fixed — there is no more money behind it. The board has been promised visible improvement inside twelve months.",
        flags: ["knows:budget"],
      },
      {
        id: "ev-history",
        label: "The last attempt",
        question: "Have they tried this before?",
        reveals:
          "Two years ago. A similar project was cancelled in month five after the operations team refused to make the changes. Nobody mentions it unless asked.",
        flags: ["knows:history", "knows:ops_constraint"],
      },
    ],
    outcomes: [
      {
        id: "m2-both",
        when: { all: ["knows:real_pain", "knows:ops_constraint"] },
        tone: "strong",
        headline: "You know this account better than anyone pitching it.",
        detail:
          "The pain is after the sale, not in the store. And whatever we propose has to get past Marcus Reed, the Operations Director nobody has asked yet — neither fact is in the brief.",
        changed: ["You can talk about their real problem", "You know who can quietly kill this"],
        effect: { dims: { win: 5, deliver: 4 }, badge: "good_question" },
      },
      {
        id: "m2-ops",
        when: { all: ["knows:ops_constraint"] },
        tone: "strong",
        headline: "You found the person who can stop this.",
        detail:
          "Sarah Lim controls the money, but Marcus Reed runs the shops, warehouses and deliveries that would have to change. Most rival firms won’t find that out until they’ve already promised a solution.",
        changed: ["You know where the real constraint sits"],
        effect: { dims: { deliver: 5, win: 2 }, badge: "good_question" },
      },
      {
        id: "m2-pain",
        when: { all: ["knows:real_pain"] },
        tone: "strong",
        headline: "You found the real problem.",
        detail:
          "They asked about the stores, but their complaints are about what happens after the sale. The gap between what they asked for and what’s actually hurting them is where our work is.",
        changed: ["You know what is actually hurting them"],
        effect: { dims: { win: 5, profit: 2 }, badge: "good_question" },
      },
      {
        id: "m2-surface",
        tone: "mixed",
        headline: "Useful, but still their version of the problem.",
        detail:
          "What you found was worth knowing; it just isn’t what decides this deal. You’ll walk into the first meeting describing the problem the way they do, not the way it really is.",
        changed: [
          "You know more than you did",
          "You still describe it their way",
        ],
        effect: { dims: { win: 1 } },
        lesson: {
          principle: "Knowing about rivals and budgets tells us about the race, not about what is wrong at Orion.",
          because:
            "You spent both questions on the rivals and the money, so you still do not know what is hurting Orion or who has to agree to change it.",
          watchFor: "Ask yourself who has not been in the room — and why.",
        },
      },
    ],
    lesson: {
      principle: "The firm that knows something the others don’t usually has the better thing to say to the client.",
      because:
        "You could only find out two of five things, and you had to pick before you knew any of the answers.",
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
    objective: "Get a first meeting with Orion.",
    minutes: 3,
    hero: "hero-retail-plaza",
    situation: [
      "You’ve found out what you could, and Orion is now willing to hear from firms like ours.",
      "Choose how we make first contact, because whatever they see first is what they’ll think we are.",
    ],
    presentation: "dialogue",
    /* Surface, mission by mission, and the split is not decorative: a `call` is live,
       multi-person and cannot be taken back, a `chat` is quick, internal and
       low-ceremony. Client-facing beats are calls — m5, m6, m8, m9a, m10c. The
       internal ones are chats — this beat, m7b, m9, m9b and month five, where the
       sponsor’s line arrives relayed rather than in the room. `thread` is authored
       nowhere and rendered nowhere; see src/ui/dialogue.tsx. */
    surface: "chat",
    client: ORION,
    /* What the two questions bought, named by the person who told you to spend them. The
       first branch is the only place in chapter one where Marcus Reed’s name is said out
       loud by our own side, and it is said only to the player who found him. */
    advisorLine: [
      {
        when: { all: ["knows:real_pain", "knows:ops_constraint"] },
        text: "You know what their customers complain about, and who runs the shops. Which way in can we afford to get wrong?",
      },
      {
        when: { all: ["knows:ops_constraint"] },
        text: "You have learned about Marcus Reed. Now weigh what each way in costs us, in time and in favours.",
      },
      {
        when: { all: ["knows:real_pain"] },
        /* Was "It is the one thing here they have not read in a pitch", which ranks the
           option set — and only one option can use that flag, so "the one thing here"
           was a star beside it. The fact about the client stays; the ranking goes. */
        text: "You know what their customers complain about. Now weigh how long each way in takes, and who it reaches.",
      },
      { text: "What do we need most from Orion right now: their attention, a meeting, or their trust?" },
    ],
    advisor: PRIYA,
    consider: [
      "Who at Orion do we most need to reach?",
      "What does each way in cost if nobody replies?",
      "Would this approach work if we knew nothing about Orion?",
    ],
    tip: "Sarah won’t read a long article herself. Her deputy will, and he writes the notes she reads.",
    prompt: "Three ways to get the first meeting.",
    question: "How do you make first contact?",
    options: [
      {
        id: "o-pov",
        title: "Write them a short article",
        icon: "spark",
        facsimile: "proposal",
        description: "A short, specific piece on what is going wrong for shops like theirs, sent to their leaders.",
        say: "Then I want the first thing they read to be about their problem, not about us.",
        commits: "A week or two of writing before anyone replies.",
        pros: ["Shows we know their business", "Several of them read it"],
        cons: ["Only as good as our facts", "Slowest way in"],
        cost: { time: 3, investment: 1 },
        outcomes: [
          {
            id: "m3-pov-hit",
            when: { all: ["knows:real_pain"] },
            tone: "strong",
            headline: "Sarah forwards it internally with one line: “this is us”.",
            detail:
              "Because you wrote about what happens after the sale, not the shops, it read as if we’dalready been inside the business. Sarah invited us in, and asked us to take it to Marcus Reed in Operations too.",
            changed: [
              "You’re in, describing the problem your way",
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
            headline: "Well written, but about the wrong problem.",
            detail:
              "It got read. But it was about the shops — which they already believe is the problem — so it told them nothing new. You got a meeting, not a supporter.",
            changed: [
              "You have a first meeting",
              "You told them nothing new",
            ],
            effect: { dims: { win: 3 } },
          },
        ],
      },
      {
        id: "o-direct",
        title: "Meet Sarah Lim directly",
        icon: "talk",
        facsimile: "org",
        description: "A friend of ours introduces us. Thirty minutes with Sarah, making our case in person.",
        say:
          "Then I use our one introduction now and make the case to Sarah myself. Thirty minutes, one shot.",
        commits: "Uses up a favour we can only ask once.",
        pros: ["Straight to who holds the money", "A real two-way conversation"],
        cons: ["Uses our only introduction", "Hears only Sarah’s view"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m3-direct-informed",
            when: { all: ["knows:ops_constraint"] },
            tone: "strong",
            headline: "You asked the question nobody else had.",
            detail:
              "Halfway through, you asked Sarah who runs the parts of the business that would have to change. She paused, called it a fair question, and booked a second meeting with Marcus Reed from Operations in it.",
            changed: ["You are trusted early", "Operations is now in the room"],
            effect: { dims: { win: 5, deliver: 3 }, flags: ["ops_engaged", "credibility"] },
          },
          {
            id: "m3-direct-blind",
            tone: "mixed",
            headline: "Sarah was keen, then added a condition.",
            detail:
              "It went well until the last minute, when Sarah said, “You’ll need Operations comfortable with this before we can move.” You hadn’t planned for a second decision-maker, and now you’re meeting them late.",
            changed: [
              "You have Sarah’s interest",
              "A second decision-maker, found late",
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
        title: "Advertise to all retailers",
        icon: "megaphone",
        facsimile: "market",
        description: "Run adverts and emails aimed at every big retailer, Orion included, and see who replies.",
        say: "I would rather not bet it all on one meeting. Put it out widely and see who answers.",
        commits: "Reaches many people, few of whom can sign anything.",
        pros: ["Cheapest by far", "Our senior people stay free"],
        cons: ["Nothing personal to Orion", "Few readers can buy"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m3-campaign",
            tone: "mixed",
            headline: "Plenty of replies. Very few from Orion.",
            detail:
              "The adverts looked great by every number you’dput in a report. It reached people who were interested but couldn’t buy, and got one lukewarm reply from an Orion manager two levels below Sarah.",
            changed: [
              "A lot of activity",
              "Little progress with Orion itself",
              "Senior people stayed free",
            ],
            effect: { dims: { win: 1, profit: 3 } },
            lesson: {
              principle: "Our adverts were easy to count, but they only mattered if someone reading them could hire us.",
              because:
                "The adverts reached more people than an article or a meeting would have, and none of them could hire us.",
              watchFor:
                "Before choosing a channel, name the single person you need to move — then ask whether this reaches them.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "Deals are won by convincing the few people who can say yes, not by reaching the most people.",
      because:
        "An article earns trust, a meeting gets a decision, and adverts get noticed; each one suits a different need.",
      watchFor: "Ask what you actually need from the next conversation before choosing how to start it.",
    },
    next: "deb-1",
  },

  /**
   * The chapter debriefs.
   *
   * One line each, and one line only. The rest of the screen is the player’s own history
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
      "You chose where to spend your team’s time, found out what you could about Orion, and got a first meeting.",
      "Next, Riya wants to know whether Orion will really pay for help, and how many of our people it deserves.",
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
    title: "Is it worth chasing?",
    body: [
      "I’m Riya — I run this team and decide where its people go. Orion has agreed to talk to us, but it has not agreed to buy anything.",
      "You decide how much of our team’s time Orion gets, before we know whether there is a real contract here.",
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
    objective: "Decide how many of your people to put on Orion.",
    minutes: 4,
    hero: "hero-retail-exterior",
    situation: [
      "Orion liked the first contact, and now they want a proposal — a written offer saying what we’d do and what it costs.",
      "A serious one ties up several of my people for weeks, unpaid, and we may still lose.",
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
        note: "Close to past work, but their request is vague.",
      },
      {
        icon: "people",
        label: "Rivals",
        level: "medium",
        tone: "bad",
        note: "Two other firms are already talking to them.",
      },
      {
        icon: "chart",
        label: "Value",
        level: "high",
        tone: "good",
        note: "Several years of work, if the first part goes well.",
      },
    ],
    /* Riya decides where her people go, so what she notices here is how much of the
       problem somebody has already tested. The middle branch is the whole of chapter one
       coming back: if the player bought neither the complaints nor the constraint, she
       says so before they commit six weeks of her team. */
    advisorLine: [
      {
        when: { any: ["ops_engaged"] },
        text: "Marcus, who runs their shops and deliveries, already knows us. Getting that far usually takes us three months.",
      },
      {
        when: { none: ["knows:real_pain", "knows:ops_constraint"] },
        text: "We still don’t know what Orion’s customers complain about, or who could block this. Whatever you choose starts from there.",
      },
      { text: "I have six people. Tell me how many of them this is worth, and for how long." },
    ],
    advisor: RIYA,
    consider: [
      "If Orion picks a rival, what have we lost?",
      "Do we know enough to put a price on it?",
      "How long can my people be away from paid work?",
    ],
    tip: "I have said yes to two jobs like this from a one-line request. One of them paid for our year.",
    prompt: "Three ways to answer a one-line request.",
    question: "How much do you put into Orion now?",
    options: [
      {
        id: "o-pursue",
        title: "Write the full proposal now",
        icon: "rocket",
        description: "Put our best people on it and write the full offer, with a price, straight away.",
        commits: "Our strongest people, unavailable to anyone else for weeks.",
        pros: ["First offer on their desk", "Shows we’re serious"],
        cons: ["Best people tied up", "Pricing work nobody’s defined"],
        cost: { time: 3, investment: 3 },
        outcomes: [
          {
            id: "m4-pursue-good",
            when: { any: ["knows:real_pain", "credibility"] },
            tone: "strong",
            headline: "You’re first in front of them with a real proposal.",
            detail:
              "You already understood the problem, so committing early was a bet on something you could see, not a hope. We were the first firm with a serious proposal on their desk — and my best people are tied up until it lands.",
            changed: [
              "You set the terms of the conversation",
              "Your best people are fully committed",
            ],
            effect: { dims: { win: 5, profit: -4 } },
          },
          {
            id: "m4-pursue-blind",
            tone: "mixed",
            headline: "All in, and still guessing.",
            detail:
              "My team is working hard on a proposal built from a one-line request. Every guess in it is ours, not theirs, and several will be wrong.",
            changed: ["A lot of effort spent", "Built on guesses nobody has checked"],
            effect: { dims: { win: 3, profit: -6, deliver: -3 } },
          },
        ],
      },
      {
        id: "o-workshop",
        title: "Offer a paid discovery first",
        icon: "search",
        description: "They pay us for two weeks to find the real problem, before we price the big job.",
        commits: "Two weeks slower, and a rival may send an offer meanwhile.",
        pros: ["Gets us inside Orion", "We’re paid while learning"],
        cons: ["Much smaller first contract", "Rivals can move first"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m4-workshop-blind",
            when: { none: ["knows:real_pain", "knows:ops_constraint", "has_access"] },
            tone: "mixed",
            headline: "They agreed, and week one went on catching up.",
            detail:
              "The paid discovery got us in, but we pointed it at a business we hadn’t looked into at all. Week one went on questions we could have answered from outside; week two on the ones that mattered.",
            changed: ["A smaller, safer first commitment", "Half the discovery spent catching up"],
            effect: {
              dims: { profit: 3, deliver: 3, win: -2 },
              flags: ["landed_small", "has_access"],
            },
          },
          {
            id: "m4-workshop",
            tone: "strong",
            headline: "They said yes, and they’re paying you to learn.",
            detail:
              "It’s a smaller first contract than anyone hoped for. But we’re now paid, and allowed, to see the parts of the business nobody shows you in a sales meeting.",
            changed: [
              "A smaller, safer first commitment",
              "Real access to the business",
              "Our guesses get checked before the big contract",
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
        title: "Turn down the big job for now",
        icon: "block",
        description: "Tell them honestly that nobody can put a fair price on a one-line request yet.",
        commits: "We may be remembered as the firm that said no.",
        pros: ["Keeps our people and profit safe", "They remember the honesty"],
        cons: ["Rivals keep moving", "May look half-hearted"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m4-decline",
            tone: "mixed",
            headline: "They were surprised. Then they came back.",
            detail:
              "Turning down work nobody could define came across as good judgement. Two weeks later Sarah came back with a narrower, clearer request — but the firm that said yes was now ahead.",
            changed: [
              "Your judgement is taken seriously",
              "A narrower, better-defined opportunity",
              "Ground lost to a faster rival",
            ],
            effect: { dims: { profit: 7, deliver: 3, win: -7 }, flags: ["landed_small"] },
            lesson: {
              principle: "Turning down work nobody can price yet protects our profit, at the cost of falling behind.",
              because:
                "Saying no lost you ground to the rival and got you a clearer request, and whether that was worth it depends on how much you needed the work.",
              watchFor: "Notice when you are bidding on something nobody has actually defined yet.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "Chasing a client costs our people’s time, so we decide early how much of it a client gets.",
      because:
        "Commit too much too early and you spend your best people on a guess; commit too late and a rival is already in front of the client.",
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
   * turn that describes a choice is a decision wearing a cut scene’s clothes.
   */
  {
    kind: "interlude",
    id: "turn-rival",
    role: "turn",
    chapter: 2,
    eyebrow: "Tuesday, 07:00",
    title: "Somebody else announces first",
    body: [
      "At seven this morning a rival consultancy announced a partnership with a well-known company that makes technology for shops.",
      "By eleven they were showing off a flashy demo of screens and gadgets inside a shop. It never mentions Orion.",
      "It did not need to. By lunchtime, two of Orion’s board members had sent it to Sarah.",
    ],
    prompt: "Sarah’s board now has a rival’s demo in front of it, and nothing from us.",
    next: "m5",
  },

  {
    kind: "choice",
    id: "m5",
    chapter: 2,
    stage: "opportunity",
    title: "Someone else moves",
    eyebrow: "They are not alone",
    objective: "Answer Sarah after the rival firm’s big announcement.",
    minutes: 4,
    hero: "hero-client-meeting",
    situation: [
      "The rival firm just showed off a flashy in-shop technology demo, and two of Sarah’s board sent it straight to her.",
      "She’s on the call now asking why she should still pick us, so decide how we answer.",
    ],
    presentation: "dialogue",
    surface: "call",
    saidQuote: {
      text: "We like your perspective, but this looks impressive and my board has already seen it. Help me understand how you are different.",
      ...SARAH,
    },
    concerns: [
      "A famous technology company is attached",
      "A demo that is easy to show a board",
      "Nobody has said plainly how we differ",
    ],
    /* A press release is easier to answer when somebody already did the reading, and
       harder to be frightened by from inside a paid engagement. Both branches are things
       the player bought in the two beats before this one. */
    advisorLine: [
      {
        when: { any: ["knows:rivals"] },
        text: "You found out earlier that this rival sells screens and apps for shops. Sarah wants an answer today, not next week.",
      },
      {
        when: { any: ["has_access"] },
        text: "We are already working inside Orion on the paid study. Sarah’s board, though, has only seen the rival’s demo.",
      },
      { text: "Sarah has to say something to her board this week. What do you want her to be able to say?" },
    ],
    advisor: RIYA,
    consider: [
      "What does Sarah need to tell her board this week?",
      "What does the rival’s demo leave out?",
      "What does it cost us to say nothing for now?",
    ],
    tip: "I have seen three announcements like this one. Two of them never delivered anything.",
    prompt: "Four ways to answer the rival’s announcement.",
    question: "How do you answer Sarah?",
    options: [
      {
        id: "o-investigate-rival",
        title: "Find out what they offered",
        icon: "search",
        description: "Spend a few days learning exactly what the rival is offering before we answer.",
        say: "I would rather not answer that today. Let me find out what they have actually offered you.",
        commits: "Several days while Sarah waits for an answer.",
        pros: ["Answer with facts", "Finds what they miss"],
        cons: ["Sarah is left waiting", "Days we can’t get back"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m5-inv-known",
            when: { all: ["knows:rivals"] },
            tone: "strong",
            headline: "You already knew their angle. Now you know its limit.",
            detail:
              "Their offer is in-shop technology — genuinely good at what it does, and silent on deliveries, refunds and the helpline. You could say so precisely, because you’ddone the reading earlier.",
            changed: ["You can name what their offer misses"],
            effect: { dims: { win: 5 }, flags: ["knows:rival_gap"], badge: "connected_dots" },
          },
          {
            id: "m5-inv-new",
            tone: "mixed",
            headline: "You found out what it is, a little late.",
            detail:
              "It’s in-shop technology that never touches deliveries, refunds or the helpline — useful to know. But the days it took cost you some of Sarah’s confidence; she wanted a view, not a research project.",
            changed: [
              "You understand the rival’s offer",
              "You looked slow when it mattered",
            ],
            effect: { dims: { win: 1 }, flags: ["knows:rival_gap"] },
          },
        ],
      },
      {
        id: "o-accelerate",
        title: "Meet Sarah this week",
        icon: "rocket",
        description: "Book a meeting in the next few days and make our case before her board settles.",
        say: "Give me thirty minutes this week and I will answer that in person, not in a document.",
        commits: "Presenting before our answer is fully worked out.",
        pros: ["Speed looks confident", "Keeps us in the race"],
        cons: ["We haven’t studied their offer"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m5-accel",
            tone: "mixed",
            headline: "In the room in two days, with half an argument.",
            detail:
              "Speed read as confidence, and Sarah appreciated it. But you were arguing against something you hadn’t examined, and twice you had to promise to come back with detail.",
            changed: ["You held the relationship", "You spent credibility to do it"],
            effect: { dims: { win: 3, deliver: -2 } },
          },
        ],
      },
      {
        id: "o-reframe",
        title: "Point her at a different problem",
        icon: "scale",
        description: "Steer Sarah to what happens after customers buy, which the rival’s demo never touches.",
        say:
          "Their demo is a shopfront. Ask them what happens to your customer three weeks after she buys something.",
        commits: "Moves away from what Orion asked us for.",
        pros: ["Compete on our strengths", "Makes their demo matter less"],
        cons: ["Contradicts their request", "Needs proof we have"],
        cost: { time: 2, investment: 2 },
        outcomes: [
          {
            id: "m5-reframe-strong",
            when: { all: ["knows:real_pain"] },
            tone: "strong",
            headline: "You changed the question, and Sarah followed.",
            detail:
              "You pointed out that a beautiful shop doesn’t fix a three-week refund. With their complaint data behind you it landed as analysis, not a sales line — and now the rival is answering your question.",
            changed: [
              "The race is on ground you chose",
              "The rival’s best asset matters less",
            ],
            effect: { dims: { win: 8, profit: 3 }, flags: ["reframed"], badge: "adapt" },
          },
          {
            id: "m5-reframe-weak",
            tone: "mixed",
            headline: "It sounded like a deflection, because you couldn’t prove it.",
            detail:
              "The argument was right, but you had no evidence behind it, so it sounded like a firm losing a comparison and changing the subject. Sarah is unconvinced, though not unfriendly.",
            changed: ["You raised the right issue", "You could not back it up"],
            effect: { dims: { win: -2 } },
          },
        ],
      },
      {
        id: "o-hold",
        title: "Stick to our plan",
        icon: "shield",
        description: "Don’t react. Carry on with what we were already doing.",
        say: "Nothing has actually been built yet. I am not going to redraw our plan around an announcement.",
        commits: "Sarah hears nothing from us while her board talks about it.",
        pros: ["Costs nothing", "Calm can reassure"],
        cons: ["Needs Sarah’s existing trust", "Their story goes unanswered"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m5-hold-ok",
            when: { any: ["credibility", "has_access"] },
            tone: "strong",
            headline: "Nothing broke, because Sarah already trusted you.",
            detail:
              "Sarah already trusted you enough that a rival’s announcement didn’t move her. Your steadiness read as confidence, not absence.",
            changed: ["You spent nothing and lost nothing"],
            effect: { dims: { win: 1, profit: 3 }, badge: "held_nerve" },
          },
          {
            id: "m5-hold-risky",
            tone: "hard",
            headline: "Three weeks of silence, and the rival filled it.",
            detail:
              "For three weeks the only firm with a story about Orion’s future was the other one. By the time you got back in touch, “in-shop technology” was how Orion’s own staff described the project.",
            changed: ["The rival’s framing is now Orion’s", "You’re arguing uphill"],
            effect: { dims: { win: -9 } },
            lesson: {
              principle: "While we said nothing, the rival got to describe Orion’s problem for us.",
              because:
                "Holding steady works when the client already trusts you, and without that trust three weeks of silence let the rival’s idea become Orion’s.",
              watchFor: "Ask whether you are holding your nerve or simply hoping.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "When a rival makes a move, the client wants to hear quickly how we are different.",
      because:
        "Changing everything after a rival’s announcement wastes time, and saying nothing lets the rival describe the problem for you.",
      watchFor: "A press release is a claim about the future. It is not evidence that anything shipped.",
    },
    next: "refl-rival",
  },

  /**
   * The four reflection nodes.
   *
   * Each sits after its chapter’s hardest beat, because recovery belongs after the blow
   * rather than before it. Neither response changes a flag, a dimension or a badge — this
   * is a breath, and the absent meters on the screen are what say so.
   *
   * The questions are Thiagi’s debrief phases four and five, "how does this relate to the
   * real world?" and "what if?", which are the two where transfer actually happens and the
   * two a vendor course leaves out. So each prompt pulls OUT of Orion and into the
   * player’s own working life, and both answers are honest — one of them is not the
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
      "At work, has a rival’s news ever landed halfway through your plan? Did you change course?",
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
    title: "Write the proposal",
    body: [
      "I’m Arjun — I design what our firm sells. We know more about Orion now, so next we put an offer in writing.",
      "You decide which problem we say we will fix, how we will fix it, and what we promise to deliver.",
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
    objective: "Choose which problem our offer promises to fix.",
    minutes: 4,
    hero: "hero-retail-interior",
    situation: [
      "Now I write the offer we’ll send Orion, and their request still just says “improve the customer experience”.",
      "Tell me which problem we promise to fix, because that is exactly what my team will have to build.",
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
    advisorLine: "Their request is one sentence that can mean three things. Whichever you pick, my team plans that work on Monday.",
    consider: [
      "What evidence do we have for each reading?",
      "Could we prove it if we told Orion they were wrong?",
      "Would our offer look the same as the rival’s?",
    ],
    tip: "I’ve read three client requests this year that said ‘customer experience’. Each one meant something different.",
    prompt: "Three readings of the same one-line request.",
    question: "Which problem do you offer to fix?",
    options: [
      {
        id: "o-asked",
        title: "Fix what they asked for",
        icon: "check",
        facsimile: "proposal",
        description: "Redesign the shops and the app, exactly as their request says.",
        say: "We answer the request as written — shops and app. I am not going to tell Sarah she is wrong.",
        commits: "Goes head to head with the rival’s demo.",
        pros: ["Nobody can say we missed", "Easy for them to approve"],
        cons: ["Looks just like the rival", "Cheapest offer may win"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m6-asked",
            tone: "mixed",
            headline: "Safe, and just like the rival.",
            detail:
              "Nobody can say you missed what they asked for. But now two firms offer much the same thing, the other has a demo and a famous technology partner, and the decision will come down to price.",
            changed: ["Orion can compare you line by line with the rival", "Price becomes the deciding factor"],
            effect: { dims: { win: 1, profit: -4 }, flags: ["scope:storefront"] },
            lesson: {
              principle: "If we offer exactly what Orion asked for and their real problem is elsewhere, we fix nothing they need.",
              because:
                "Offering the same thing as the rival left Orion only one way to choose between us, which was price.",
              watchFor:
                "If your proposal could have your competitor’s logo on it, it is not a proposal, it is a quote.",
            },
          },
        ],
      },
      {
        id: "o-real",
        title: "Fix what happens after they buy",
        icon: "target",
        facsimile: "complaints",
        description: "Argue the trouble is after the sale — late deliveries, slow refunds, an unanswered helpline.",
        say:
          "The trouble is after the sale, not in the shops. I would rather say so than flatter their request.",
        commits: "Tells Orion in writing that their own request is wrong.",
        pros: ["No rival is offering it", "Aims past the shops"],
        cons: ["Contradicts their request", "Needs proof"],
        cost: { time: 2, investment: 2 },
        outcomes: [
          {
            id: "m6-real-evidenced",
            when: { all: ["knows:real_pain"] },
            tone: "strong",
            headline: "You showed them their own data, and the room changed.",
            detail:
              "You opened with their own complaint numbers instead of our track record, and nobody argues with their own evidence. Sarah said quietly she’dsuspected this for a year and couldn’t get it funded.",
            changed: [
              "No longer compared to the in-shop offer",
              "Sarah has the argument she needed",
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
            headline: "You’re right, and you can’t prove it.",
            detail:
              "It’s the right read, but you asked them to drop their own request on your instinct — and instinct is what they’re paying to avoid. They asked for evidence we don’t have.",
            changed: ["The right idea, poorly supported", "Asked to come back with proof"],
            effect: { dims: { win: 2, deliver: -2 }, flags: ["scope:postpurchase"] },
            lesson: {
              principle: "Telling a client their request is wrong only works if we can show them proof.",
              because:
                "You had the right idea but no evidence, so Orion heard your opinion against theirs rather than a fact about their business.",
              watchFor:
                "Before challenging a client’s framing, ask what you would need in your hand to make it stick.",
            },
          },
        ],
      },
      {
        id: "o-diagnostic",
        title: "Offer to find out first",
        icon: "search",
        facsimile: "timeline",
        description: "Six weeks of study to show whether the shops or the after-sale service is costing them.",
        say:
          "I am not betting this on my instinct. Six weeks to find out which problem is actually costing them.",
        commits: "Pushes the big decision back six weeks.",
        pros: ["Low risk", "Gets us real proof"],
        cons: ["Six weeks with nothing fixed", "Can look unsure"],
        cost: { time: 3, investment: 1 },
        outcomes: [
          {
            id: "m6-diag",
            tone: "mixed",
            headline: "Professional, cautious, and slightly disappointing.",
            detail:
              "They accepted, because it’s sensible. But they brought us in as people who’dseen this before, and asking six weeks to form a view says we haven’t. The bigger work gets pushed out.",
            changed: ["A safe, easy-to-defend path", "Six weeks before anything real happens"],
            effect: { dims: { deliver: 4, win: -3, profit: -2 }, flags: ["scope:diagnostic"] },
          },
        ],
      },
    ],
    lesson: {
      principle: "What a client asks for and what is actually costing them can be two different things.",
      because:
        "Orion’s request described the part of the business they could see, and the complaints pointed somewhere else.",
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
    objective: "Pick three pieces of work to offer Orion. Our budget covers three, not six.",
    minutes: 5,
    hero: "solution-workshop",
    situation: [
      "We’re writing the proposal now — the document that tells Orion what we’ll do and for how much — and there’s money for three of these six pieces of work. Some help us win, some help us actually deliver, and Aisha’s team must build whichever three we promise.",
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
     * `m7-anchored`’s gate and there is a card on this screen called "Operations
     * integration workstream", so a colleague who mentions Marcus here is not reacting,
     * he is pointing — the same defect as the m10b line whose condition was character for
     * character its outcome’s. `has:data` is in `m7-fast-thin`’s `none` for the same
     * reason. So Arjun reacts to commitments already made elsewhere — the outcome deal,
     * the partner, the fortnight inside the business — and says nothing about which three.
     */
    advisorLine: [
      {
        when: { any: ["outcome_based"] },
        text: "A third of our fee now depends on complaints falling, so every piece we promise must be one we can actually do.",
      },
      {
        when: { any: ["has:partner"] },
        text: "The specialist firm is working with us now. Whatever goes in, I tell them on Monday which parts they do.",
      },
      {
        when: { any: ["has_access", "landed_small"] },
        text: "We have spent two weeks inside their business. Use what we saw there, not guesses.",
      },
      {
        text: "The three pieces we leave out will not be added later. Be sure you know what each one was for.",
      },
    ],
    advisor: ARJUN,
    consider: [
      "For each piece, who actually does the work?",
      "Which pieces win Orion over, and which make the work possible?",
      "What does each piece cost us in people and time?",
    ],
    tip: "Aisha’s team must deliver whatever this document promises. She reads every line, and she remembers.",
    prompt: "Three of six.",
    question: "Which three pieces of work do we offer?",
    pick: 3,
    components: [
      {
        id: "c-journey",
        title: "Redesign the shopping experience",
        description: "Rework every step a customer takes, from browsing to buying. Easy to show, easy to sell.",
        tag: "Visible",
        dims: { win: 5, deliver: -4 },
        flags: ["has:journey"],
      },
      {
        id: "c-platform",
        title: "Rebuild the refunds and helpline systems",
        description: "Replace the computer systems behind the complaints. A big job: many months and many people.",
        tag: "Heavy",
        dims: { win: 5, profit: -6, deliver: -9 },
        flags: ["scope:heavy"],
      },
      {
        id: "c-ops",
        title: "Work alongside Marcus’s operations team",
        description: "A small team that plans each change with the shops, warehouses and delivery staff, on their timetable.",
        tag: "Unglamorous",
        dims: { deliver: 8, win: 1, profit: -5 },
        flags: ["has:ops_workstream"],
      },
      {
        id: "c-training",
        title: "Train the staff",
        description: "Teach shop and helpline staff the new ways of working. A few weeks of trainers’ time.",
        tag: "Adoption",
        dims: { deliver: 5, win: 1, profit: -2 },
        flags: ["has:training"],
      },
      {
        id: "c-pilot",
        title: "Run an eight-week trial",
        description: "Try the change in a few shops within two months, so Sarah can show her board something working.",
        tag: "Fast",
        dims: { win: 6, deliver: -5, profit: -2 },
        flags: ["promised:fast"],
      },
      {
        id: "c-data",
        title: "Set up the numbers to measure progress",
        description: "Track delivery times, refund times and complaints, so we can prove things got better. Rarely what wins bids.",
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
        headline: "Marcus Reed read it and stopped objecting.",
        detail:
          "You put a workstream in the proposal with his people’s names against it, before he had to ask. That turned the person best placed to block this into someone with a stake in it working.",
        changed: [
          "Operations is invested, not resistant",
          "The old failure point has an owner",
        ],
        effect: { dims: { deliver: 4, win: 3 }, flags: ["ops_onside"], badge: "connected_dots" },
      },
      {
        id: "m7-overreach",
        when: { all: ["scope:heavy"], none: ["has:ops_workstream"] },
        tone: "hard",
        headline: "A big promise with nobody to make it happen.",
        detail:
          "You’ve promised to replace the systems at the centre of their business, and nothing in the document says how those changes reach the shops, warehouses and helpline that use them. Everyone nods; nobody has checked.",
        changed: ["A large, attractive promise", "No route through Operations"],
        effect: { dims: { deliver: -6 }, flags: ["unanchored"] },
        lesson: {
          principle: "We promised something big that only Marcus’s team can carry out, and our proposal never says how.",
          because:
            "Rebuilding Orion’s systems was the most impressive piece you chose, and it cannot reach the shops without Marcus’s team, whom the proposal leaves out.",
          watchFor: "For each thing you propose, name who delivers it and check they know.",
        },
      },
      {
        id: "m7-fast-thin",
        when: { all: ["promised:fast"], none: ["has:data", "has:ops_workstream"] },
        tone: "mixed",
        headline: "A quick result with nothing underneath it.",
        detail:
          "The eight-week trial is the most attractive line in the document. It also assumes access to systems and data nobody has confirmed, and nothing in the proposal goes and gets it.",
        changed: ["A compelling headline", "A timeline on untested assumptions"],
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
          "It isn’t the flashiest document in the pile. It includes the parts of the work that let the rest survive contact with a real organisation, which is rarer than it should be.",
        changed: ["Attractive and deliverable at once"],
        effect: { dims: { deliver: 2, profit: 2 } },
      },
    ],
    lesson: {
      principle: "Everything a proposal promises becomes work somebody has to do after the contract is signed.",
      because:
        "Each piece of work made the bid more attractive to Orion, harder for us to deliver, or more costly to us, and only three could go in.",
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
      "I’m Riya again — the team’s money is my problem. Orion has our proposal, and now it wants a lower price.",
      "You decide the price and terms — what is included, and who carries the risk — and whether to sign if Orion chooses us.",
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
    objective: "Answer Orion on price without giving away what we keep.",
    minutes: 4,
    hero: "hero-negotiation",
    situation: [
      /* "Thirty percent above" was the whole of the price beat and it is an abstraction:
         the argument the player is about to have is with a gap, and a gap has a size.
         £600,000 over a £2m bid keeps the committed thirty percent exactly and makes the
         number they are defending sayable. Stated as the gap rather than as £2.6m against
         £2m because a colleague says a gap aloud more easily than a decimal. (The paginator
         once split "£2.6m" at its point; it no longer does — D-081.) */
      "Orion has read the proposal and says we cost £600,000 more than the rival, and Declan in their buying team has the two prices side by side.",
      "Sarah still wants us, so we must decide how to answer — and every pound we cut comes straight off what we keep after paying our people.",
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
        text: "You found out their budget is fixed, with no more money behind it. That stays true whichever way we answer.",
      },
      {
        when: { any: ["outcome_based"] },
        text: "A third of our fee already depends on complaints falling. Part of our price is at risk before we start.",
      },
      {
        when: { any: ["scope:heavy"] },
        text: "Rebuilding their refunds and helpline systems is the biggest cost I have approved this year. Nothing said today makes it smaller.",
      },
      {
        when: { any: ["credibility"] },
        text: "Sarah likes us. Declan, who compares the bids on paper, has never met us.",
      },
      { text: "£600,000 is a gap somebody has to explain to Sarah’s board. Ask yourself who ends up doing it." },
    ],
    advisor: RIYA_DEAL,
    consider: [
      "What exactly is Orion comparing us with?",
      "If we cut the price, what can we not afford later?",
      "What does Sarah need to show her board?",
    ],
    tip: "I once cut our price by eight percent for Meridian. We spent the next year explaining it.",
    prompt: "Four ways to answer on price.",
    question: "How do we answer on price?",
    options: [
      {
        id: "o-hold-price",
        title: "Keep the price",
        icon: "shield",
        description: "Explain what the extra £600,000 buys them, and don’t lower it.",
        say:
          "I am not moving. Give your board the two proposals side by side and let them see the difference.",
        commits: "Nothing left to offer if they aren’t convinced.",
        pros: ["We keep every pound", "No bidding war on price"],
        cons: ["Needs a difference they see", "Nothing left to give"],
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
              "The other bid never touches deliveries, returns or support, where Orion spends two and a half million a year handling complaints. Halving that would save twice our £600,000 difference, every year, so the premium stops being one. Procurement didn’t enjoy it; Sarah has a straight answer for her board.",
            changed: ["Full margin protected", "The comparison is neutralised"],
            effect: { dims: { profit: 10, win: 1 }, badge: "held_nerve" },
          },
          {
            id: "m8-hold-weak",
            tone: "hard",
            headline: "With no difference they can see, it looks stubborn.",
            detail:
              "You said our proposal was worth more, and they asked why. The reasons were real but general, and general reasons lose to a specific number; the relationship cooled noticeably.",
            changed: ["Margin intact", "Now the expensive bid, unexplained"],
            effect: { dims: { win: -12, profit: 4 } },
          },
        ],
      },
      {
        id: "o-discount",
        title: "Cut the price to match",
        icon: "coins",
        description: "Lower our price to the rival’s and get the contract signed.",
        say: "I will come down to their number. That money was our cushion, and I am spending it here.",
        commits: "£600,000 we can’t win back later.",
        pros: ["Price complaint gone", "Quickest route to signing"],
        cons: ["Spends our spare money", "Orion expects low prices later"],
        cost: { time: 1, investment: 3 },
        outcomes: [
          {
            id: "m8-discount",
            tone: "mixed",
            headline: "The gap closes. So does your room to manoeuvre.",
            detail:
              "Procurement is satisfied and the deal moves. But you funded the discount from the contingency we’dneed if anything went wrong in delivery — and something usually does.",
            changed: ["Price objection removed", "No financial slack left"],
            effect: { dims: { win: 6, profit: -14 }, flags: ["discounted"] },
            lesson: {
              principle: "A price cut wins the deal now and leaves us short of money when the work runs into trouble.",
              because:
                "The £600,000 you gave away was the spare money that would have paid for problems later, and the work itself got no cheaper.",
              watchFor: "Before discounting, ask what that contingency was for.",
            },
          },
        ],
      },
      {
        id: "o-rescope",
        title: "Do less work for less money",
        icon: "cross",
        description: "Keep our daily rates, and remove work from the proposal until the price matches.",
        say:
          "I can reach their number by taking work out. You would be defending a smaller programme, not a discount.",
        commits: "Work we thought necessary leaves the contract.",
        pros: ["Lower price, honestly earned", "Our rates stay the same"],
        cons: ["The cut work held things up"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m8-rescope",
            tone: "mixed",
            headline: "You hit the number by promising less.",
            detail:
              "It’s the honest version of a discount: the price falls because the work does. But what left was the least visible piece, and that’s usually the piece that made the rest work.",
            changed: [
              "Price matched, margin kept",
              "Less in it than it needs",
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
        title: "Split it into two stages",
        icon: "layers",
        description: "Orion signs for a smaller first stage now, and buys the second only if it works.",
        say:
          "Give your board a smaller first cheque. Same rate, same total — they commit to less in this meeting.",
        commits: "Weeks of re-planning, and stage two must be won again.",
        pros: ["Smaller cheque for the board", "Price and work unchanged"],
        cons: ["Weeks of re-planning", "Stage two may not come"],
        cost: { time: 3, investment: 2 },
        outcomes: [
          {
            id: "m8-phase-good",
            when: { any: ["has_access", "ops_onside", "evidenced", "landed_small"] },
            tone: "strong",
            headline: "The board approved it because the first cheque was small.",
            detail:
              "You didn’t move the rate or cut the work — you changed what they had to commit to today. Sarah got a number her board could approve, and we’re well placed to win phase two.",
            changed: [
              "Margin protected",
              "A smaller decision for Orion",
              "The rest of the work still ahead",
            ],
            effect: { dims: { profit: 8, win: 5, deliver: 2 }, badge: "smart_tradeoff" },
          },
          {
            id: "m8-phase-thin",
            tone: "mixed",
            headline: "A clever structure on a shaky foundation.",
            detail:
              "Phasing was the right instinct, but you asked them to trust that phase two would be worth it without giving them much reason to. They agreed to phase one and reserved judgement.",
            changed: ["Deal moves forward", "Phase two is genuinely at risk"],
            effect: { dims: { profit: 5, win: 1 } },
          },
        ],
      },
    ],
    lesson: {
      principle: "A client pays more than the cheapest bid only when they can see what the extra money buys.",
      because:
        "Every other way to reach their number costs us money, work we meant to do, or weeks of re-planning.",
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
    objective: "Decide what to do about the gap our own experts found.",
    minutes: 4,
    hero: "hero-boardroom",
    situation: [
      "I’ll run the project if we win, so I’ve read our risk review — our own experts checking the plan before we sign.",
      "They found a gap: we change systems other Orion teams rely on, and never say how those changes get installed.",
    ],
    presentation: "dialogue",
    surface: "chat",
    variants: [
      /**
       * The liability finding, first because it outranks the others.
       *
       * All four findings below are FEASIBILITY findings — can we do this. A real
       * pre-signature review has two halves, and the second is the one that ends careers:
       * what happens to us if we don’t. The content had zero occurrences of liability,
       * indemnity, cap, service credit, penalty, warranty or IP, so the game taught that
       * half does not exist — and `m9b`’s own `o-modify` offers to reopen "the two clauses
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
          "I’ll run the project if we win, so I’ve read our risk review — our own experts checking the plan before we sign.",
          "Our lawyers say a third of our fee depends on hitting the promised result — miss it for any reason, and we’re paid less.",
        ],
      },
      {
        when: { all: ["scope:heavy"], none: ["has:ops_workstream"] },
        situation: [
          "I’ll run the project if we win, so I’ve read our risk review — our own experts checking the plan before we sign.",
          "We promise to rebuild Orion’s main systems with no plan for Marcus’s people to install them — which is what sank Orion’s last project.",
        ],
      },
      {
        when: { all: ["promised:fast"], none: ["has:data"] },
        situation: [
          "I’ll run the project if we win, so I’ve read our risk review — our own experts checking the plan before we sign.",
          "The eight-week trial needs Orion’s order records, and nobody has checked they’re usable — four weeks fixing them and we’re late from day one.",
        ],
      },
      {
        when: { all: ["descoped"] },
        situation: [
          "I’ll run the project if we win, so I’ve read our risk review — our own experts checking the plan before we sign.",
          "The work we cut to reach their price was holding other parts up, and they want to know how we still deliver what the contract promises.",
        ],
      },
      {
        when: { all: ["has:ops_workstream"] },
        situation: [
          "I’ll run the project if we win, so I’ve read our risk review — our own experts checking the plan before we sign.",
          "It’s a small finding: our team working with Marcus covers the hard part, but nobody has booked the time of two Orion specialists we need.",
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
        text: "We came down £600,000 to match the rival’s price. Keep that in mind when you weigh what each answer costs us.",
      },
      {
        when: { any: ["ops_onside", "has:ops_workstream"] },
        text: "Our work with Marcus’s team covers most of what they found. Two Orion specialists we need still aren’t booked.",
      },
      { text: "If we win, every gap in that review lands on my team. Tell me which ones you will actually fix." },
    ],
    advisor: AISHA,
    consider: [
      "Are we fixing this gap, or just writing it down?",
      "What does this cost to fix now, and once work starts?",
      "Do we still have the money to fix it?",
    ],
    tip: "The reviewers gain nothing if we win this. That is exactly why I read their notes twice.",
    prompt: "Four ways to answer a review finding.",
    question: "What do we do about the gap?",
    options: [
      {
        id: "o-accept-risk",
        title: "Write it down and carry on",
        icon: "warning",
        description: "Record the gap officially, sign as planned, and deal with it if it happens.",
        say:
          "We record it and move on. If it arrives, it arrives in your month, and I won’t pretend otherwise.",
        commits: "If it happens, Aisha meets it with no plan.",
        pros: ["Signing stays on schedule", "Costs nothing today"],
        cons: ["Problem may grow later", "On record that we knew"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m9-accept-loaded",
            when: { any: ["scope:heavy", "promised:fast", "unanchored", "fragile_timeline"] },
            tone: "hard",
            headline: "Written down in full, and nobody fixing it.",
            detail:
              "The review flagged exactly where your proposal is thinnest, and writing it down doesn’t make it smaller. It will arrive in delivery, on my watch, with a paper trail showing we knew.",
            changed: ["The risk is on record, unfunded", "A known problem heading for delivery"],
            effect: { dims: { win: 3, deliver: -12 }, flags: ["risk_accepted"] },
          },
          {
            id: "m9-accept-ok",
            tone: "mixed",
            headline: "Recorded. The risk is real but survivable.",
            detail:
              "Your proposal is solid enough that this is a risk we can carry. Accepting it keeps momentum, and there’s slack elsewhere to absorb it.",
            changed: ["The risk is accepted on record", "A risk you can probably carry"],
            effect: { dims: { win: 3, deliver: -4 }, flags: ["risk_accepted"] },
          },
        ],
      },
      {
        id: "o-mitigate",
        title: "Pay to close the gap",
        icon: "shield",
        description: "Add the spare money, people or extra work needed to cover the gap.",
        say: "Tell me what covering it properly needs and I will find the money in the commercial case.",
        commits: "Paid from our own money, which may already be spent.",
        pros: ["Cheaper fixed now", "Aisha gets a plan"],
        cons: ["Comes out of our earnings", "Only works if money’s left"],
        cost: { time: 2, investment: 3 },
        outcomes: [
          {
            id: "m9-mitigate-broke",
            when: { all: ["discounted"] },
            tone: "hard",
            headline: "You can’t afford the fix you just agreed to.",
            detail:
              "Mitigation costs money, and the money’s gone — you gave it to procurement to close the price gap. So we add a thinner fix than the review asked for and hope the difference doesn’t matter.",
            changed: [
              "Partial mitigation",
              "No margin left for error",
            ],
            effect: { dims: { deliver: 3, profit: -9 }, flags: ["thin_mitigation"] },
            lesson: {
              principle:
                "What we agree on price decides what my team can afford to fix later.",
              because:
                "The money you gave away to win the deal is the money you now need to fix the risk the review found.",
              watchFor: "When you concede on price, note what you are giving up the ability to do later.",
            },
          },
          {
            id: "m9-mitigate",
            tone: "strong",
            headline: "It costs you, and it holds.",
            detail:
              "You put real money and real work behind the risk while it’s still cheap. It’s the least satisfying line in the commercial case, and it gives my team a plan for the month it bites.",
            changed: ["Risk properly covered", "Lower margin, by choice"],
            effect: { dims: { deliver: 7, profit: -6 }, badge: "smart_tradeoff" },
          },
        ],
      },
      {
        id: "o-rescope-risk",
        title: "Take the risky part out",
        icon: "cross",
        description: "Remove the piece of work that causes the gap, and deliver the rest well.",
        say: "Then I pull that piece rather than hand you something nobody can run. Sarah hears it from me.",
        commits: "Orion loses something we promised them.",
        pros: ["The gap disappears", "A project Aisha can run"],
        cons: ["Breaking a promise", "Sarah will remember"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m9-rescope",
            tone: "mixed",
            headline: "A smaller, safer programme, and a slightly disappointed client.",
            detail:
              "Taking it out removes the exposure. It also removes the most exciting thing you promised, so you had to go back and explain why — and they accepted it, and will remember.",
            changed: ["Exposure removed", "A visible promise withdrawn early"],
            /* Deliverability above re-pricing’s +9, deliberately: re-pricing FUNDS the
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
        title: "Ask Orion to pay more",
        icon: "scale",
        description: "Tell Orion the gap is real and fixing it properly raises the price.",
        say: "I meant all of it. So I go back and ask them to pay for covering it properly.",
        commits: "Reopens a price talk we had already finished.",
        pros: ["Orion pays for the fix", "Honest, and they see it"],
        cons: ["Price talks start again", "Looks like we quoted low"],
        cost: { time: 2, investment: 2 },
        outcomes: [
          {
            id: "m9-reprice-strong",
            when: { any: ["evidenced", "ops_onside", "credibility", "ops_engaged"] },
            tone: "strong",
            headline: "They took it seriously, because you’dbeen straight before.",
            detail:
              "Reopening price after agreeing terms only works if the client believes you, and they did. The number went up slightly, the risk is covered, and your honesty became part of why Sarah trusts us.",
            changed: ["Risk funded properly", "Trust strengthened rather than spent"],
            effect: { dims: { profit: 6, deliver: 6, win: -2 }, badge: "smart_tradeoff" },
          },
          {
            id: "m9-reprice-weak",
            tone: "hard",
            headline: "It looked like you were moving the goalposts.",
            detail:
              "To procurement, a firm that raises its price after agreeing terms under-quoted to get in. You got the increase, and spent most of our goodwill getting it.",
            changed: ["Risk funded", "The relationship is now transactional"],
            effect: { dims: { profit: 5, deliver: 5, win: -10 } },
          },
        ],
      },
    ],
    lesson: {
      principle: "A problem found before signing is cheaper to fix than the same problem found mid-project.",
      because:
        "Before signing, fixing it costs money, work or goodwill; after signing, it costs all three plus a late project.",
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
    title: "Do the work",
    body: [
      "I’m Aisha — I run the project now the contract is signed. It is month five, and the promises you made are coming due.",
      "You decide how to handle each problem as it lands, and how to keep my team doing what you promised.",
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
    objective: "Decide what to tell Orion about the late plan and the board’s new request.",
    minutes: 4,
    hero: "solution-in-store-tech",
    situation: [
      "We signed, and it’s now month five: two Orion specialists our plan needs were moved to other work, so we’re three weeks late.",
      "Sarah’s board has also asked for one more thing, and we must decide what we tell Orion.",
    ],
    presentation: "dialogue",
    surface: "chat",
    variants: [
      {
        when: { any: ["unanchored", "risk_accepted"], all: ["scope:heavy"] },
        situation: [
          "We signed, and it’s now month five: the new refunds and helpline systems are built, but Marcus won’t switch them on without six weeks of testing.",
          "Our review warned us, nobody planned those six weeks, and Sarah’s board now wants one more thing; we must decide what to tell Orion.",
        ],
      },
      {
        when: { any: ["fragile_timeline", "promised:fast"] },
        situation: [
          "We signed, and it’s now month five: the eight-week trial still can’t start, because Orion’s order records are taking months to clean up.",
          "We’re late on our quickest promise, Sarah’s board now wants one more thing too, and we must decide what to tell Orion.",
        ],
      },
      {
        when: { all: ["descoped"] },
        situation: [
          "We signed, and it’s now month five: Orion’s staff keep asking for the work we cut before signing.",
          "Every “no” makes the project feel smaller than what we sold, Sarah’s board now wants one more thing, and we must decide what to tell Orion.",
        ],
      },
      {
        when: { all: ["ops_onside", "has:training"] },
        situation: [
          "We signed, and it’s now month five: staff in the first shops are taking up the new ways of working faster than planned.",
          "Three regions want to start early, which needs people we don’t have, Sarah’s board wants one more thing, and we must decide what to tell Orion.",
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
    advisorLine: "I have thirty minutes and a team waiting on Monday. Tell me what I’m telling them.",
    advisor: AISHA,
    consider: [
      "Which of our earlier decisions led to this?",
      "What can we still afford, in money and in goodwill?",
      "What happens if Orion hears it from someone else first?",
    ],
    tip: "Sarah has already shown her board our dates. Whatever we decide, she has to explain it to them.",
    prompt: "Aisha has thirty minutes, and her team needs an answer by Monday.",
    question: "What do we tell Orion?",
    options: [
      {
        id: "o-reset",
        title: "Tell Sarah the real dates",
        icon: "talk",
        description: "Go to Sarah now, explain honestly what slipped, and agree a new plan together.",
        say:
          "I want the real dates in front of Sarah this week, with a re-plan already drafted. No surprises.",
        commits: "Saying out loud that a promise will not hold.",
        pros: ["Sarah hears it from us", "Costs little money"],
        cons: ["You have to admit it", "Invites closer checking"],
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
             * sweep’s dedup silently stops being able to tell the two sides apart —
             * `analysis.ts` now throws rather than let that pass quietly. And exactly one
             * gate, because two consume a third of `MAX_FRONTIER` and three breach it.
             */
            id: "m10-reset-trust",
            when: {
              any: ["ops_onside", "evidenced", "credibility"],
              min: { deliver: 60 },
            },
            tone: "strong",
            headline: "A difficult meeting, and it worked.",
            detail:
              "You went early, with a clear account of what changed and a new plan already drafted. Because you’ve been accurate with Orion since the first conversation, they treated it as a project being run properly, not as a failure.",
            changed: ["Plan reset with Orion’s agreement", "The relationship survives intact"],
            effect: { dims: { deliver: 6, win: 2, profit: -2 }, badge: "recovered" },
          },
          {
            id: "m10-reset-cold",
            tone: "mixed",
            headline: "Orion accepted it, and started checking everything.",
            detail:
              "Saying it out loud still cost you. With little reason yet to trust us, Orion answered with weekly check-in meetings, a named person to complain to, and a committee of its managers watching the project.",
            changed: ["Plan reset", "You’re now managed closely"],
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
        title: "Charge for the extra work",
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
        description: "The board’s request was never in the contract. Put a price on it and let Orion decide.",
        say: "What the board wants was never in the contract. I’ll put a price on it and let them choose.",
        commits: "Asking a client who is already unhappy to pay more.",
        pros: ["We are paid for extra work", "The contract stays honest"],
        cons: ["Can look like cashing in", "Needs proof it was never included"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m10-change-clean",
            when: { all: ["evidenced"], any: ["ops_onside", "reviewed", "knows:criteria"] },
            tone: "strong",
            headline: "Orion paid, because the contract proved it was extra.",
            detail:
              "You brought the contract, the dated email where the board’s request first appeared, and a price. Sarah didn’t enjoy it and approved it anyway, because the alternative was asking us to work for nothing. The project grew, and our profit on it held.",
            changed: ["Extra work paid for", "What the contract covers is in writing"],
            effect: { dims: { profit: 9, deliver: 3, win: -2 }, flags: ["changed_scope"], badge: "smart_tradeoff" },
            lesson: {
              principle: "We could charge Orion for the extra work only because the contract showed it was never included.",
              because:
                "The work was going to be done either way, and the written contract decided whether Orion paid for it or we did.",
              watchFor: "When delivery is asked for something extra, ask first whether it was ever in the contract.",
            },
          },
          {
            id: "m10-change-thin",
            tone: "mixed",
            headline: "Orion paid for part of it, after an argument.",
            detail:
              "You were right that it was extra, but you couldn’t point to where the contract said so. It became an argument about who remembered what, not about money. Orion paid for part of it, and Sarah was a little cooler afterwards.",
            changed: ["Extra work partly paid for", "An argument you shouldn’t have needed"],
            effect: { dims: { profit: 4, win: -5, deliver: 1 }, flags: ["changed_scope"] },
            lesson: {
              principle: "Our request for payment was only as strong as what we had written down, and we had written little.",
              because:
                "Without a written limit on the work, you were asking Orion to trust your memory of a conversation from four months ago.",
              watchFor: "Write down what the work includes while everyone agrees, not once they are arguing.",
            },
          },
        ],
      },
      {
        id: "o-absorb",
        title: "Put more people on it",
        icon: "people",
        description: "Keep the date by adding people to the team, and pay for them ourselves.",
        say: "We add people and pay for them ourselves. Orion gets its date; our profit takes the hit.",
        commits: "The extra people come out of our profit on this contract.",
        pros: ["Orion sees us deliver", "Orion may recommend us"],
        cons: ["Our profit pays for it", "Needs money left to spend"],
        cost: { time: 1, investment: 3 },
        outcomes: [
          {
            id: "m10-absorb-broke",
            when: { any: ["discounted", "thin_mitigation"] },
            tone: "hard",
            headline: "There is no money left to pay for people.",
            detail:
              "Adding people is the obvious fix, and we can’t pay for it. The money we gave away on price before signing was the money for exactly this, so we add two people instead of five and the date slips anyway.",
            changed: ["Two people added, not five", "Date missed regardless", "The contract now loses money"],
            effect: { dims: { profit: -13, deliver: 2 } },
            lesson: {
              principle: "The money we gave away to win the contract is the money this project now needs.",
              because:
                "The spare money you needed in month five was spent months earlier to match the rival’s price.",
              watchFor: "When you give something up to win, write down what you have made impossible.",
            },
          },
          {
            id: "m10-absorb",
            tone: "mixed",
            headline: "You held the date by paying for it.",
            detail:
              "Orion sees a project doing what we said it would, and our profit quietly takes the hit. That’s a fair trade, because Orion will now vouch for us to other clients, but it isn’t free.",
            changed: ["Promise kept", "Much less profit on the contract"],
            effect: { dims: { deliver: 5, profit: -10, win: 3 } },
          },
        ],
      },
      {
        id: "o-push",
        title: "Hold the team to the date",
        icon: "clock",
        description: "We promised the date. Ask the team to win back the three weeks with longer hours.",
        say: "The date stands. Tell the team I am asking them to find three weeks that are not there.",
        commits: "Long hours from the people doing the work.",
        pros: ["Keeps the promised date", "Nothing to explain to Orion"],
        cons: ["The team pays in hours", "Rushed work has mistakes"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m10-push-fragile",
            when: { any: ["scope:heavy", "promised:fast", "risk_accepted", "unanchored"] },
            tone: "hard",
            headline: "You hit the date, but what went live barely works.",
            detail:
              "Something went live on the promised day, but it was thin and not connected to the systems that matter. Within three weeks the queue of customers waiting on the helpline was longer than before, and two of my team have asked to move to other projects.",
            changed: [
              "The date was met",
              "What went live barely works",
              "Orion’s real problem is unsolved",
            ],
            effect: { dims: { deliver: -14, win: -6, profit: 2 } },
          },
          {
            id: "m10-push-ok",
            tone: "mixed",
            headline: "The date held, and my team paid for it.",
            detail:
              "The plan was sound enough that longer hours alone got it done. Orion got what it was promised; my team paid in evenings and weekends, and you’ll spend time repairing that.",
            changed: ["Date met", "The delivery team is worn down", "Two people ask to leave the project"],
            /* Was `deliver +2, profit +3, win +1` -- net +6 for a choice whose own cons say
               "Paid by the team", with nothing anywhere charging for it. Attrition is the
               cost, and it lands on Deliverability, because the people who know the
               programme are the ones who leave. */
            effect: { dims: { deliver: -4, profit: 3, win: 1 }, flags: ["crunched"] },
            lesson: {
              principle: "We saved the date with my team’s long hours, and they are the ones paying for it.",
              because:
                "The plan was sound, so extra hours were enough, but two people who know how it was built now want to leave.",
              watchFor: "Before holding a date by effort, ask who is paying and whether they agreed to.",
            },
          },
        ],
      },
      {
        id: "o-quiet",
        title: "Cut some work without telling Orion",
        icon: "block",
        description: "Quietly drop a few smaller pieces from what we deliver, and don’t raise it with Orion.",
        say: "Drop what the team can from this release. We don’t need to put it on Sarah’s agenda.",
        commits: "Orion may find out without us telling them.",
        pros: ["Takes the pressure off now", "No awkward meeting"],
        cons: ["Orion may notice", "Hard to explain later"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m10-quiet-covered",
            when: { any: ["ops_onside", "broad_base"] },
            tone: "mixed",
            headline: "Nobody complained, because Marcus’s team knew why.",
            detail:
              "Marcus’s operations team knew what was dropped and why, and they’re who Orion’s staff ask. It held, but you’re now relying on Marcus’s people to explain a decision you chose not to announce.",
            changed: [
              "Short-term pressure relieved",
              "Marcus’s team gives an explanation you didn’t",
            ],
            effect: { dims: { deliver: 2, win: -4, profit: 4 }, flags: ["undisclosed"] },
            lesson: {
              principle: "When someone else explains our decision for us, we are spending their goodwill.",
              because:
                "It held only because Marcus’s team answered the question you chose not to raise, and you never asked them to.",
              watchFor: "If a decision needs somebody else to explain it, ask why you are not explaining it.",
            },
          },
          {
            id: "m10-quiet",
            tone: "hard",
            headline: "It worked until someone compared it with the proposal.",
            detail:
              "The pressure vanished. Four weeks later an Orion manager compared what we delivered with what we’dpromised and asked about it in writing, and the problem stopped being the missing work and became that we hadn’t told them.",
            changed: [
              "Short-term pressure relieved",
              "Trust damaged, and hard to repair",
            ],
            effect: { dims: { deliver: 1, win: -14, profit: 4 } },
            lesson: {
              principle:
                "Delivering less is often fine, but hiding it makes the client doubt everything else we say.",
              because:
                "Cutting the work was a reasonable call, and doing it quietly made Orion ask what else we hadn’t told them.",
              watchFor: "If you would not want the client to read the decision log, reconsider the decision.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "Most of our problems in month five were set up by choices we made before signing.",
      because:
        "Each problem in month five came from something chosen earlier: what we promised, the price we agreed, or the risk we accepted.",
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
      "Looking at month five, which of your own decisions would you take back now?",
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
    eyebrow: "Two of six",
    objective: "Pick two of six jobs for the team before the offer is written.",
    minutes: 4,
    hero: "solution-workshop",
    situation: [
      "Sarah has handed us six things she wants covered, and my people have two weeks before we write our offer.",
      "That is time for two jobs, so pick them, because the other four simply won’t get done.",
    ],
    /* The beat where the sponsor asks for six things had no sponsor in it. She is also
       the one being squeezed — the fortnight is not her choice either. */
    saidQuote: {
      text: "There are six things I need covered before you put anything in writing. I gather you have a fortnight.",
      ...SARAH,
    },
    /* She is pricing a fortnight of her own people, so she notices what the fortnight no
       longer has to buy — ground already taken, or a door already open. */
    advisorLine: [
      {
        when: { any: ["reframed"] },
        text: "You got Sarah talking about deliveries and refunds instead of the shops. Now we have two weeks to back that up.",
      },
      {
        when: { any: ["has_access"] },
        text: "We are already inside Orion on the paid study. Think about what that already tells us, and what it doesn’t.",
      },
      { text: "Two weeks of my team’s time. Tell me what each job buys us." },
    ],
    advisor: RIYA,
    consider: [
      "Which of these would change what we offer Orion?",
      "What do we still not know?",
      "Which would we regret skipping once the work starts?",
    ],
    tip: "Whatever you fund, my people start Monday. Give me a reason for each, not a feeling.",
    prompt: "Two of six. The other four do not happen.",
    question: "Which two jobs does the team do?",
    pick: 2,
    components: [
      {
        id: "c-ops-workshop",
        title: "Meet the operations team",
        description: "A working session with Marcus Reed, Orion’s operations director, and his managers, before we write anything.",
        tag: "Unglamorous",
        dims: { deliver: 5, win: 1, profit: -2 },
        flags: ["ops_engaged"],
      },
      {
        id: "c-benchmark",
        title: "Study the rival’s offer",
        description: "Work out exactly what the rival’s in-shop technology does and does not cover.",
        tag: "Intelligence",
        dims: { win: 4, profit: -1 },
        flags: ["knows:rival_gap"],
      },
      {
        id: "c-reference",
        title: "Show Sarah a past client",
        description: "Take Sarah to visit a retailer where we have already done this kind of work.",
        tag: "Proof",
        dims: { win: 5, profit: -3 },
        flags: ["credibility"],
      },
      {
        id: "c-data-audit",
        title: "Check their records",
        description: "Find out whether Orion’s order and refund records are complete enough to use.",
        tag: "Foundation",
        dims: { deliver: 4, profit: 3, win: -2 },
        flags: ["has:data"],
      },
      {
        id: "c-complaints",
        title: "Count their complaints",
        description: "Get the real numbers of calls and emails customers send after buying.",
        tag: "Evidence",
        dims: { win: 3, deliver: 1, profit: -2 },
        flags: ["knows:real_pain"],
      },
      {
        id: "c-stakeholders",
        title: "Map who decides",
        description: "Find out who at Orion signs, who could block it, and who lives with it afterwards.",
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
          "Operations has sat in a room with us, and we know what their data can really support. Neither impresses in a pitch; together they’re the difference between a proposal and a promise.",
        changed: [
          "Operations has met you before proposing",
          "You know what the data can do",
        ],
        effect: { dims: { deliver: 3 }, badge: "smart_tradeoff" },
        /* This beat printed the mission’s fallback lesson on all three of its outcomes,
           including the two that are nearly opposite. Winning the room with nothing
           tested and grounding the work in what Operations can actually take are not the
           same experience, and they were being given the same sentence. */
        lesson: {
          principle:
            "Two weeks on dull groundwork cost us less than putting a price on work nobody had checked.",
          because:
            "Marcus’s team has now met us and we know what Orion’s records can show, so the offer can describe work that is real.",
          watchFor:
            "The unglamorous option is usually the one that removes an assumption instead of adding a claim.",
        },
      },
      {
        id: "m5b-persuasion",
        when: { all: ["credibility", "knows:rival_gap"] },
        tone: "strong",
        headline: "You’ve built the argument, not the plan.",
        detail:
          "You have proof of past work and the gap in the rival’s offer, so Sarah’s case for us is stronger. What we still lack is Operations involved and checked data — the ground a delivery plan stands on.",
        changed: ["A stronger case with Sarah", "The delivery foundation is incomplete"],
        effect: { dims: { win: 3, deliver: -3 } },
        lesson: {
          principle:
            "A good reason for Orion to choose us is not the same as a plan for doing the work.",
          because:
            "A past client and the rival’s gaps help Sarah choose us, but without Marcus’s team involved and checked records we still cannot say how the work gets done.",
          watchFor:
            "Check which delivery assumptions still need evidence, even when the case for choosing you is strong.",
        },
      },
      {
        id: "m5b-spread",
        tone: "mixed",
        headline: "Two useful weeks, and you chose which gaps remain.",
        detail:
          "Both pieces of work landed, and four things stayed unfunded. Some of those gaps your earlier work already covers; the rest belong in the proposal as assumptions we say out loud.",
        changed: ["Two activities completed", "Four left unfunded this time"],
        effect: { dims: { win: 1, deliver: 1 } },
      },
    ],
    lesson: {
      principle: "A team never has time for everything, so choosing what not to do is part of the job.",
      because:
        "All six jobs were useful, and picking two meant four gaps that the offer now has to admit to.",
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
      "You decided how hard to chase Orion, how to answer the rival, and where your six people spent their time.",
      "Next you write the proposal: the document that says what we will do for Orion, how, and what we promise. It can only use what your people found.",
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
    objective: "Decide how our offer will be delivered and paid for.",
    minutes: 4,
    hero: "solution-screen",
    situation: [
      "We’ve picked the problem, and the rival firm is offering something similar.",
      "Now choose who does the work, what we reuse and how we get paid, because each changes what Orion gets and what we earn.",
    ],
    /* Arjun’s opening depends on what the last beat settled. With their own evidence on
       the table there is room to move the shape; having answered the brief as written,
       the shape is the only thing left to move. */
    advisorLine: [
      {
        when: { all: ["evidenced"] },
        text: "You showed Orion their own complaint numbers. That gives us room to change who does the work and how we are paid.",
      },
      {
        when: { all: ["scope:storefront"] },
        text: "We offered to fix the shops, like the rivals. Who does the work and how we are paid is what’s left.",
      },
      { text: "The rival is offering much the same work as us. What else about our offer could be different?" },
    ],
    advisor: ARJUN,
    consider: [
      "What if we lacked the people to do it ourselves?",
      "Has anyone, us included, already built part of this?",
      "What would make Orion feel only we could do this?",
    ],
    tip: "We built a refunds system for another retailer last year. I’m not saying reuse it; I’m saying it exists.",
    prompt: "Four shapes of answer. Two firms are already writing the fifth.",
    question: "How do you build the offer?",
    options: [
      {
        id: "o-partner",
        title: "Team up with a delivery specialist",
        icon: "talk",
        description: "Work with a specialist firm that already handles deliveries and refunds at this size.",
        commits: "We share our profit, and rely on a firm we don’t run.",
        pros: ["Experts who do this daily", "Believable from day one"],
        cons: ["Profit shared with them", "We rely on another firm"],
        cost: { time: 2, investment: 2 },
        outcomes: [
          {
            id: "m6b-partner-fit",
            when: { any: ["knows:real_pain", "has:data", "knows:rivals"] },
            tone: "strong",
            headline: "The partner makes your weakest claim your strongest.",
            detail:
              "You know the pain is operational, and now the operational answer comes from people who do it for a living. Sarah stopped asking whether we can deliver it and started asking when — though the partner takes a share of the margin.",
            changed: ["Delivery capability is no longer a question", "Margin shared with a partner"],
            effect: { dims: { win: 6, deliver: 5, profit: -6 }, flags: ["has:partner"] },
          },
          {
            id: "m6b-partner-loose",
            tone: "mixed",
            headline: "A capable partner, attached to a fuzzy problem.",
            detail:
              "They’re good, and they’re expensive. Without a clear read on what’s broken, we’re paying a specialist to solve a problem we’ve only described in general terms.",
            changed: ["Capability bought", "Margin shared before the problem is clear"],
            effect: { dims: { win: 3, deliver: 3, profit: -7 }, flags: ["has:partner"] },
          },
        ],
      },
      {
        id: "o-reuse",
        title: "Reuse something we already built",
        icon: "layers",
        description: "Adapt the refunds system our team built for another retailer.",
        commits: "A system designed around somebody else’s business.",
        pros: ["Fast and cheap", "Already worked once"],
        cons: ["Built for another client", "Looks second-hand"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m6b-reuse",
            tone: "mixed",
            headline: "Cheap, fast, and visibly second-hand.",
            detail:
              "It works, at a fraction of the cost of building new. But it solves the last client’s problem, not this one, and Sarah noticed the gap between what it does and what she asked for.",
            changed: ["Strong margin", "A solution that fits imperfectly"],
            effect: { dims: { profit: 10, deliver: 3, win: -5 }, flags: ["reused_asset"] },
            lesson: {
              principle: "Reusing something we built saves money, but only if it fits this client’s problem.",
              because:
                "The old refunds system was real and cheap to reuse, but it was built for another retailer’s problem, not Orion’s.",
              watchFor: "Check whether you are reusing the solution or reusing the diagnosis.",
            },
          },
        ],
      },
      {
        id: "o-outcome-deal",
        title: "Get paid on results",
        icon: "scale",
        description: "A third of our fee depends on how far complaint calls and emails fall.",
        commits: "A third of our fee is only paid if complaints fall.",
        pros: ["No rival will offer it", "We win only if Orion wins"],
        cons: ["We carry the risk", "Needs a way to count complaints"],
        cost: { time: 2, investment: 3 },
        outcomes: [
          {
            id: "m6b-outcome-measurable",
            when: { all: ["has:data"] },
            tone: "strong",
            headline: "You can offer it because you can measure it.",
            detail:
              "An outcome deal is only honest if both sides trust the number, and you’daudited their data: half a million contacts a year, counted the same way by both of us. A third of the fee moves against that, and Sarah’s board found it very hard to refuse.",
            changed: ["A proposal nobody can compare", "Your fee partly rides on results"],
            effect: {
              dims: { win: 8, profit: -3, deliver: 1 },
              flags: ["outcome_based"],
              badge: "connected_dots",
            },
          },
          {
            id: "m6b-outcome-blind",
            tone: "hard",
            headline: "A third of the fee, bet on an uncounted number.",
            detail:
              "The idea is strong, but nobody has counted the contacts, so there’s no baseline either side can point at. The first argument of delivery will be about what a support contact even is — with a third of our fee on the table.",
            changed: ["A distinctive offer", "Fee tied to an undefined number"],
            effect: { dims: { win: 4, profit: -10, deliver: -4 }, flags: ["outcome_based"] },
          },
        ],
      },
      {
        id: "o-conventional",
        title: "Keep it standard",
        icon: "shield",
        description: "Our own people, a normal fee, and a well-built version of the usual offer.",
        commits: "We compete on price and doing it well, nothing else.",
        pros: ["Nothing to explain", "Lowest risk"],
        cons: ["Looks like every rival", "No special reason to pick us"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m6b-conventional",
            tone: "mixed",
            headline: "Solid, and entirely expected.",
            detail:
              "Nothing’s wrong with it, which is the problem. Three firms now offer the same shape of answer, so the only variables left are price and who the client likes.",
            changed: ["A defensible proposal", "Nothing that distinguishes it"],
            effect: { dims: { deliver: 3, profit: 3, win: -4 }, flags: ["conventional"] },
          },
        ],
      },
    ],
    lesson: {
      principle: "Who does the work and how the fee is paid change both what the client buys and what we earn.",
      because:
        "Partner, reuse, payment on results and the standard offer each traded a different mix of profit, risk and believability.",
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
      "Have you seen an offer win on its ideas, not its price? What made it different?",
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
    objective: "Decide how to spend the last week before the proposal goes to Orion.",
    minutes: 3,
    hero: "hero-boardroom",
    situation: [
      "The proposal is written, and before it goes to Orion our own reviewers — senior people from outside the bid team — have read it and marked its weakest points.",
      "We have one week left, and we can only spend it fixing one thing.",
    ],
    presentation: "dialogue",
    surface: "chat",
    variants: [
      {
        when: { all: ["scope:heavy"], none: ["has:ops_workstream"] },
        situation: [
          "The proposal is written, and our own reviewers — senior people from outside the bid team — have read it before it goes to Orion.",
          "They keep asking one thing: we promise to rebuild Orion’s main systems, so who installs the changes in their shops and warehouses, and when?",
        ],
      },
      {
        // Gated on promised:fast, not on discounted — m7b runs BEFORE the pricing
        // mission, so a flag written in m8 can never be set here. The sweep caught it.
        when: { all: ["promised:fast"] },
        situation: [
          "The proposal is written, and our own reviewers — senior people from outside the bid team — have read it before it goes to Orion.",
          "They all like the eight-week trial, but nothing says how we’ll get Orion’s sales and complaints figures in time to run it.",
        ],
      },
      {
        when: { all: ["ops_onside", "evidenced"] },
        situation: [
          "The proposal is written, and our own reviewers — senior people from outside the bid team — have read it and mostly like it.",
          "Their question is whether we’ve played it too safe: is this offer big enough to beat the rival’s?",
        ],
      },
    ],
    advisorLine: "I would rather the reviewers argue with me now than blame me later. Which of their points worries you most?",
    advisor: ARJUN,
    consider: [
      "Is our weakest point winning, delivering, or making money?",
      "What does fixing one weak point cost the others?",
      "Are the reviewers right, or just being careful?",
    ],
    tip: "I have overruled a review twice. Once I was right, and I still think about the other one.",
    prompt: "One week, one fix — or none.",
    question: "What do we do with the last week?",
    options: [
      {
        id: "o-shore-deliver",
        title: "Fill in how we’ll do the work",
        /* "Add the integration detail, the named people, the testing plan" — none of
           which you can add if you never found out who owns the systems. */
        requires: { any: ["knows:ops_constraint", "ops_onside", "has:ops_workstream"] },
        icon: "shield",
        description: "Add who does each task, when, and how we’ll test each change before customers see it.",
        say: "You’re right to push. Give me the week and it comes back with names, dates and a testing plan.",
        commits: "A longer, duller document and a week not spent persuading.",
        pros: ["Answers the reviewers", "Aisha gets a real plan"],
        cons: ["Reads as cautious", "A week not spent persuading"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m7b-shore",
            tone: "strong",
            headline: "Duller to read, but the plan holds up.",
            detail:
              "Nobody wins a pitch on a testing plan. But the reviewers stopped objecting, and Aisha’s team can now see how the work is meant to happen.",
            changed: ["Delivery risk much reduced", "A week not spent on Orion"],
            effect: { dims: { deliver: 6, win: -3 }, flags: ["reviewed"] },
          },
        ],
      },
      {
        id: "o-sharpen-win",
        title: "Make the pitch more persuasive",
        icon: "spark",
        description: "Spend the week rewriting the proposal so it convinces Sarah’s board.",
        say:
          "Then argue with me about the pitch, because that is where the week goes. Sarah’s board decides this.",
        commits: "The weak points the reviewers found stay in.",
        pros: ["Stronger case to Orion", "Sarah gets arguments to use"],
        cons: ["Weak points stay unfixed", "Reviewers stay unhappy"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m7b-sharpen-risky",
            when: { any: ["scope:heavy", "promised:fast", "discounted"] },
            tone: "hard",
            headline: "A better pitch for a proposal with real holes.",
            detail:
              "You made the document more persuasive without making it more true. The reviewers put their concerns in writing and stopped arguing, which is worse than them arguing.",
            changed: ["A stronger pitch", "An internal objection, overruled on record"],
            effect: { dims: { win: 5, deliver: -7 }, flags: ["overrode_review"] },
          },
          {
            id: "m7b-sharpen-ok",
            tone: "mixed",
            headline: "The case is tighter. The gaps are the same size.",
            detail:
              "It reads better, and the proposal underneath hasn’t changed. It was reasonably solid to begin with, so that’s a defensible use of a week.",
            changed: ["A more persuasive proposal", "The same underlying gaps"],
            effect: { dims: { win: 5, deliver: -2 } },
          },
        ],
      },
      {
        id: "o-trim-profit",
        title: "Protect what we earn",
        icon: "coins",
        description: "Rework the price and staffing so we still make money if one month goes badly.",
        say: "I would rather hand you a smaller job with room in it than a big one with none.",
        commits: "A smaller offer than the one the bid team wrote.",
        pros: ["Spare money for surprises", "Survives a bad month"],
        cons: ["Less offered to Orion", "Looks smaller than the rival’s"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m7b-trim",
            tone: "mixed",
            headline: "The numbers work. The proposal is smaller.",
            detail:
              "You put spare money back into the price, so one bad month won’t sink us — the most useful thing you can do for a project that hasn’t started. It also means offering less than the rival firm.",
            changed: ["Spare money for surprises is back", "A less ambitious offer"],
            effect: { dims: { profit: 10, win: -5, deliver: 2 }, flags: ["reviewed"] },
          },
        ],
      },
      {
        id: "o-defend",
        title: "Send it as it is",
        icon: "block",
        description: "Tell the reviewers we’ve heard them and the proposal goes out unchanged.",
        say: "I have heard the objections. It goes out as it is, and that is on me.",
        commits: "Every gap the reviewers flagged is yours to answer for.",
        pros: ["Saves the week", "Proposal stays as written"],
        cons: ["Every flagged gap is yours", "Reviewers may be right"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m7b-defend-earned",
            when: { all: ["ops_onside"], none: ["scope:heavy", "discounted"] },
            tone: "strong",
            headline: "You had good reason to say no, and did.",
            detail:
              "The reviewers were being careful, which is their job. But Marcus’s operations team was already inside the proposal and the price had room in it, so there was nothing to fix and a week to save.",
            changed: ["A week saved", "You backed your own judgement"],
            effect: { dims: { win: 3, profit: 4 }, badge: "held_nerve" },
          },
          {
            id: "m7b-defend-hubris",
            tone: "hard",
            headline: "You overruled the only people with nothing to sell you.",
            detail:
              "The reviewers had no stake in the pitch or the price. They read it cold, told you what was wrong, and you decided you knew better.",
            changed: ["A week saved", "Every flagged gap is now yours"],
            effect: { dims: { deliver: -9, win: 1 }, flags: ["overrode_review"] },
            lesson: {
              principle: "Our reviewers gained nothing from the deal, which is why they saw problems we missed.",
              because:
                "The bid team wanted to win and the reviewers did not care either way, which is exactly why their warnings were worth acting on.",
              watchFor: "When you overrule a review, write down what you are betting will not happen.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "A gap fixed before the client signs costs days; the same gap found after signing costs months.",
      because:
        "Once the contract is signed, changing what we promised means asking Orion to agree all over again, and they may say no.",
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
      "The proposal is finished. Every promise in it is now a job for someone in Aisha’s team, whoever wrote it.",
      "Next, Orion will push on the price, and you decide what you can agree to and still make money.",
    ],
    next: "int-4",
  },

  /**
   * The beat the game did not have: the client decides.
   *
   * `docs/STRATEGY.md` already said it — "we have no 'did we win it?' beat at all; the
   * contract is signed inside m9’s outcome prose". m9b is the SELLER’s gate, do we take
   * it. Nothing anywhere adjudicated whether they wanted us, which is why Winability was
   * a one-way ratchet: it entered m9 at 83–100 and m10c at 97–100, and "You did not win
   * the work" fired on 0.15% of runs. A game in which a competently run pursuit always
   * wins teaches that competence converts. It does not, and losing well is most of the
   * job — which is the entire reason qualification discipline exists.
   *
   * So this is the award decision, and it can be lost. The loss is CAUSED, never rolled:
   * `m9a-lost` fires when the player never built a reason to be preferred — no evidence
   * of their own, Operations not brought inside, the problem never reframed, the rival’s
   * gap never found — and their Winability is not high enough to carry them anyway. It
   * carries `next: "end"`, so the run stops here, as walking away does.
   *
   * The gate is on flags alone, deliberately. A first draft added `max: { win: 92 }` to
   * tune the rate down, which would have made this the first condition in the game to
   * read a meter — and `validate.ts` immediately warned that the sweep’s dedup drops
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
   * first time the game lets the player argue from the client’s own arithmetic, which is
   * how a premium is actually defended.
   */
  {
    kind: "choice",
    id: "m9a",
    chapter: 4,
    stage: "deal",
    title: "Their decision, not yours",
    eyebrow: "The award",
    objective: "Give Foyle a written reason to choose us over the cheapest bid.",
    minutes: 4,
    hero: "hero-boardroom",
    situation: [
      "Our proposal is in and Sarah wants us, but Declan Foyle in procurement — Orion’s buying team, who score each bid on paper — makes the pick.",
      "He must explain in writing why he skipped the cheapest bid, so we choose now what to hand him.",
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
          "Our proposal is in, and Declan Foyle — Orion’s buying team, who score each bid on paper — will read it as sensible work any firm could offer.",
          "Nothing in it says it must be us, so we choose now what to give him besides price.",
        ],
      },
      {
        when: { all: ["ops_onside", "evidenced"] },
        situation: [
          "Our proposal is in, and it alone names the systems Orion must change and who owns each one.",
          "Declan Foyle, Orion’s buyer who scores the bids on paper, still has to justify skipping the cheapest, so we choose what to hand him.",
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
    advisorLine: "Declan isn’t against us. He has to save Orion money, and nobody has helped him explain paying more.",
    advisor: RIYA_DEAL,
    consider: [
      "What is Declan actually comparing us against?",
      "What will he write to explain picking us?",
      "Who at Orion has to defend that choice?",
    ],
    tip: "I have lost two bids like this to firms with worse ideas that scored better on the buyer’s form.",
    prompt: "Four things you could hand Foyle.",
    question: "What do you give Foyle to justify choosing us?",
    options: [
      {
        id: "o-value",
        title: "Turn their complaint numbers into money",
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
        description: "Half a million after-sale complaints a year at £5 each; show Foyle what halving them saves Orion.",
        say: "Complaints cost Orion two and a half million a year. Write that down, and we halve it.",
        commits: "You will be held to a saving you wrote down.",
        pros: ["Gives Foyle a figure", "Answers “why pay more?”"],
        cons: ["Only as good as your data", "A saving you must deliver"],
        cost: { time: 3, investment: 1 },
        outcomes: [
          {
            id: "m9a-lost-value",
            when: { none: ["evidenced", "ops_onside", "reframed", "knows:rival_gap"] },
            tone: "hard",
            headline: "Foyle marked your saving as unevidenced.",
            detail:
              "You had the complaint volumes, but nothing else in our submission stood on them. Foyle read a payback sum bolted onto a generic proposal, marked it unevidenced, and the award went elsewhere.",
            changed: ["Not selected", "A quarter’s pursuit cost written off"],
            effect: { dims: { win: -30, profit: -8 }, flags: ["lost"] },
            next: "end",
            lesson: {
              principle: "Our saving only persuades if the whole proposal is built on Orion’s numbers, not added at the end.",
              because:
                "You had their numbers but never built the proposal on them, so the saving looked like a claim added at the end.",
              watchFor: "Before promising a payback, ask whose number the baseline is.",
            },
          },
          {
            id: "m9a-value-strong",
            when: { any: ["evidenced", "knows:real_pain"] },
            tone: "strong",
            headline: "Ours was the only bid with a saving attached.",
            detail:
              "From Orion’s own complaint data: half a million contacts a year at about five pounds each, so two and a half million pounds a year. Halve that and Orion keeps one and a quarter million a year against our £600,000 premium, which pays back inside six months. You wrote Foyle’s justification for him.",
            changed: ["Selected", "A payback number now in the contract"],
            effect: { dims: { win: 8, profit: 4 }, flags: ["won", "outcome_based"], badge: "connected_dots" },
          },
          {
            id: "m9a-value-thin",
            tone: "mixed",
            headline: "Chosen, but the saving rests on an estimate.",
            detail:
              "The structure was right; the baseline was soft. Half a million contacts is what a retailer this size usually runs, not a figure anyone at Orion counted — so Foyle scored you above the cheapest bid and asked you to stand behind the number in writing.",
            changed: ["Selected", "Committed to a payback you estimated"],
            effect: { dims: { win: 4, profit: -2 }, flags: ["won", "outcome_based"] },
          },
        ],
      },
      {
        id: "o-criteria",
        title: "Ask how bids are scored, then rewrite",
        icon: "search",
        /* Anybody can ask. Whether the weightings come back in time to re-cut a
           submission depends on there being somebody client-side who picks up — a sponsor
           who trusts you, an Operations team you brought into the room, or a paid
           engagement that already has you inside. A firm that ran a campaign and never
           got into a room is asking a stranger for the marking scheme in the last week.
           `m9a-lost-criteria` is the earned version of the same move: he sends them, and
           they are unkind. */
        requires: { any: ["credibility", "ops_engaged", "has_access"] },
        description: "Ask Foyle how many points each part of a bid is worth, then rewrite ours to match.",
        say:
          "Tell me how many points each section carries, and I’ll answer the test you’re actually setting.",
        commits: "A week spent rewriting to their marking sheet instead of selling.",
        pros: ["Answers what is scored", "Costs little money"],
        cons: ["Loses a week", "Can look like gaming it"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m9a-lost-criteria",
            when: { none: ["evidenced", "ops_onside", "reframed", "knows:rival_gap"] },
            tone: "hard",
            headline: "You learned exactly how you lost.",
            detail:
              "Foyle sent the weightings, and they were unkind: forty percent on proven delivery of comparable systems. You can’t manufacture that in a week, and the firm that could was already ahead.",
            changed: ["Not selected", "You know precisely why"],
            effect: { dims: { win: -28, profit: -4 }, flags: ["lost", "knows:criteria"] },
            next: "end",
            lesson: {
              principle: "The buyer scores every bid against a marking sheet, so we ask to see it at the start.",
              because:
                "The marking sheet was never secret, and asking for it in the last week only showed you what asking in the first week could have changed.",
              watchFor: "Ask how it will be scored before you decide what to write.",
            },
          },
          {
            id: "m9a-criteria-good",
            tone: "strong",
            headline: "You answered the test Foyle was actually setting.",
            detail:
              "The weightings favoured operational continuity over price. Operations was already in our proposal, so the re-cut was a reorder, not a rewrite — and Foyle scored us first on two of four criteria.",
            changed: ["Selected", "You know how you were scored"],
            effect: { dims: { win: 6, profit: 1 }, flags: ["won", "knows:criteria"], badge: "good_question" },
          },
        ],
      },
      {
        id: "o-deliverer",
        title: "Send Aisha, who would run the project",
        icon: "people",
        /* Aisha can only answer Foyle’s questions about how the changes reach production
           if somebody has planned it: her own integration workstream, Marcus’s people
           inside the proposal, or a partner who runs returns for a living. With none of
           the three there is nobody to send — the card would be an invitation to walk
           your most truthful person into a room with nothing to be truthful about, which
           is a trap rather than a decision. Locked and named, it says where she could
           have been given something to say. */
        requires: { any: ["ops_onside", "has:ops_workstream", "has:partner"] },
        description: "Aisha, who would run the work after signing, answers Foyle’s questions instead of you.",
        say: "I’ll bring Aisha, who would run this for you. Ask her anything; she won’t dress it up.",
        commits: "Aisha will say what she thinks, including what isn’t settled.",
        pros: ["Foyle hears from the doer", "Nothing oversold"],
        cons: ["You can’t steer her answers", "She won’t make it sound better"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m9a-lost-deliverer",
            when: { none: ["evidenced", "ops_onside", "reframed", "knows:rival_gap"] },
            tone: "hard",
            headline: "Aisha told the truth, and it lost the bid.",
            detail:
              "Asked how the changes reach production, Aisha said truthfully that it depends on teams nobody has spoken to yet. It was the right answer, Foyle scored it down, and the award went to the bid that claimed certainty.",
            changed: ["Not selected", "Nothing was oversold"],
            effect: { dims: { win: -26, deliver: 3 }, flags: ["lost"] },
            next: "end",
            lesson: {
              principle: "Sending Aisha only helps if she can describe a settled plan, and ours still depended on teams nobody had asked.",
              because:
                "Aisha could only describe the plan you had actually built, and since nobody had spoken to the teams involved, her honesty sounded like doubt.",
              watchFor: "Before bringing delivery in, ask what they will have to admit.",
            },
          },
          {
            id: "m9a-deliverer-good",
            when: { any: ["ops_onside", "has:ops_workstream"] },
            tone: "strong",
            headline: "Aisha named the three teams, and Foyle relaxed.",
            detail:
              "Aisha walked through how the changes reach production, who signs them off, and what she’dalready agreed with Marcus. Foyle stopped asking about risk; it was the shortest scoring session of the three.",
            changed: ["Selected", "Delivery credibility before signature"],
            effect: { dims: { win: 6, deliver: 4 }, flags: ["won"], badge: "held_nerve" },
          },
          {
            id: "m9a-deliverer-plain",
            tone: "mixed",
            headline: "Foyle believed Aisha, but price still counted against us.",
            detail:
              "She was straight about what’s agreed and what isn’t, and Foyle believed her — worth more than it looks. He still scored the cheaper bid higher on price.",
            changed: ["Selected", "Credible, but not preferred on price"],
            effect: { dims: { win: 3, deliver: 2 }, flags: ["won"] },
          },
        ],
      },
      {
        id: "o-submit",
        title: "Send it in and wait for the score",
        icon: "clock",
        description: "Add nothing more; let Foyle score our proposal as written, alongside the other two.",
        say: "Everything we have is in the proposal. Score it as it stands; I won’t keep pitching.",
        commits: "The document as sent is your whole case.",
        pros: ["No new promises to keep", "Follows their rules"],
        cons: ["You learn the result by email", "Adds no reason to pick us"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m9a-lost-submit",
            when: { none: ["evidenced", "ops_onside", "reframed", "knows:rival_gap"] },
            tone: "hard",
            headline: "Three similar bids, and ours cost the most.",
            detail:
              "With nothing to separate the bids on substance, Foyle separated them on price — that’s what a scorecard does when every column is level. We were told on a Thursday, by email.",
            changed: ["Not selected", "Nothing said why it must be you"],
            effect: { dims: { win: -32, profit: -6 }, flags: ["lost"] },
            next: "end",
            lesson: {
              principle: "When we give the buyer nothing else to separate the bids, he picks the cheapest.",
              because:
                "Every week of chasing Orion was a chance to give them a reason to prefer us, and the proposal showed how few of those chances you took.",
              watchFor: "Ask what is in the proposal that a competitor could not write.",
            },
          },
          {
            id: "m9a-submit-good",
            when: { all: ["evidenced", "ops_onside"] },
            tone: "strong",
            headline: "The proposal won without us in the room.",
            detail:
              "The proposal argues from their data and names the people who have to change, so it persuades without us there. That’s the test of a document, and ours passed.",
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
            headline: "You won narrowly, because Sarah backed us.",
            detail:
              "Foyle scored the bids close to level and Sarah’s recommendation carried it. We have the work and we’ve learned nothing about why, which is a poor place to start next time.",
            changed: ["Selected", "Won on Sarah’s preference, not the scorecard"],
            effect: { dims: { win: 2, deliver: 3 }, flags: ["won"] },
          },
        ],
      },
    ],
    lesson: {
      principle: "We get chosen when someone at Orion can explain the choice in writing to people who never met us.",
      because:
        "Foyle has to justify paying more than the cheapest bid, so Orion’s own figures, a named owner for each change or a top score on his sheet help him more than another page about us.",
      watchFor: "Ask who has to defend this decision internally, and what you have given them.",
    },
    next: "turn-award",
  },

  /**
   * The award, written so it reads whichever way it went.
   *
   * Four of m9a’s outcomes carry their own `next: "end"` — a pursuit lost at the award
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
      "On Tuesday, four people at Orion scored the three firms’ offers on paper: Declan Foyle from procurement, two from finance and one from operations.",
      "It took forty minutes. None of them spoke to any of the firms.",
      "On Thursday at 08:14, every firm got the same email with the result. Sarah forwarded ours eleven minutes later, with no note.",
    ],
    prompt: "Four people chose in forty minutes, and you have met only one of them.",
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
      "Has a decision about your work ever gone against you in a room you were not in?",
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
    objective: "Decide whether to sign, change or refuse the contract.",
    minutes: 4,
    hero: "hero-negotiation",
    situation: [
      "Orion has picked us, but nothing is signed yet, so I can still change or refuse the deal.",
      "Once we sign, every promise in the contract is ours to keep, so check it’s still a deal we’d want.",
    ],
    presentation: "dialogue",
    surface: "chat",
    variants: [
      {
        when: { any: ["discounted", "thin_mitigation"], all: ["risk_accepted"] },
        situation: [
          "Orion has picked us, but nothing is signed, and look at what the deal has become.",
          "We gave away profit to close a gap and accepted a known risk nobody has paid to fix; once signed, both are ours to carry.",
        ],
      },
      {
        when: { all: ["ops_onside", "evidenced"] },
        situation: [
          "Orion has picked us and nothing is signed yet, and this deal is in good shape.",
          "Marcus’s operations people helped shape it and Orion’s own figures back it, so the only question is whether we want the work as written.",
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
    advisorLine: "I have signed contracts I should not have. Before you answer Sarah, read what this one now says, line by line.",
    advisor: RIYA_DEAL,
    consider: [
      "Would you put your own people on this contract?",
      "What have we given away since the first meeting?",
      "What happens to us if we say no now?",
    ],
    tip: "I have walked away from one deal in nine years. I think about it more than the ones I signed.",
    prompt: "Three answers for Sarah, and one ends our work with Orion.",
    question: "What do you tell Sarah?",
    options: [
      {
        id: "o-proceed",
        title: "Sign it as it stands",
        icon: "flag",
        description: "Sign the contract as written and start the work on the agreed date.",
        say: "I’m not holding anything back. Let’s sign, and every line in there becomes ours to keep.",
        commits: "Every line in the contract becomes a promise we must keep.",
        pros: ["Work starts on time", "Sarah stays warm"],
        cons: ["Every gap is now in writing"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m9b-proceed-sound",
            when: { any: ["ops_onside", "evidenced", "reviewed"] },
            tone: "strong",
            headline: "Signed, on work we understand.",
            detail:
              "You’re taking on work you understand, with the people who must deliver it already involved. That’s a better position than most teams have on the day they sign.",
            changed: ["Contract signed", "Delivery starts from ground you built"],
            effect: { dims: { win: 4, profit: 2 }, flags: ["signed"] },
          },
          {
            id: "m9b-proceed-loaded",
            tone: "mixed",
            headline: "Signed, with every unfixed gap now in writing.",
            detail:
              "The deal is real, and so are its gaps. None is fatal alone; the question is how many arrive in the same month.",
            changed: ["Contract signed", "The known gaps are now contractual"],
            effect: { dims: { win: 5, deliver: -3 }, flags: ["signed"] },
          },
        ],
      },
      {
        id: "o-modify",
        title: "Change two terms before signing",
        icon: "scale",
        description: "Ask Sarah to reopen the two contract terms that worry you most before anyone signs.",
        say:
          "Two terms in here worry me, and I’d rather say so before we sign than after.",
        commits: "A fortnight’s delay, and a client who may cool on us.",
        pros: ["Fixes it while cheap", "Honest about the risk"],
        cons: ["Delays the start", "Reopens an agreed deal"],
        cost: { time: 2, investment: 2 },
        outcomes: [
          {
            id: "m9b-modify-trusted",
            when: { any: ["credibility", "ops_engaged", "evidenced"] },
            tone: "strong",
            headline: "Sarah agreed to both changes, because she trusted you.",
            detail:
              "Reopening an agreed deal only works if the client believes you’re doing it for the programme, not the margin. Sarah didn’t argue, and both clauses moved.",
            changed: ["Two real risks removed before signing", "Two weeks lost"],
            effect: {
              dims: { deliver: 6, profit: 4, win: -2 },
              flags: ["signed", "reviewed"],
              badge: "smart_tradeoff",
            },
          },
          {
            id: "m9b-modify-cold",
            tone: "mixed",
            headline: "You got one change of two, and lost goodwill.",
            detail:
              "Procurement treated a late change as a grab for a better position. You kept the clause that mattered most and dropped the other to keep the deal moving.",
            changed: ["One risk removed", "A more transactional relationship"],
            effect: { dims: { deliver: 3, win: -5 }, flags: ["signed"] },
          },
        ],
      },
      {
        id: "o-walk",
        title: "Turn the contract down",
        icon: "block",
        description: "Tell Sarah honestly that we won’t sign this contract.",
        say: "Then here’s the problem: I wouldn’t put my own people on this, so I’m not signing.",
        commits: "No contract, and three months of pursuit cost gone for good.",
        pros: ["Spares your team bad work", "Sarah sees you’re straight"],
        cons: ["Nothing to show for the quarter", "Sarah may stop calling"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m9b-walk-right",
            when: { any: ["risk_accepted", "thin_mitigation", "unanchored", "overrode_review"] },
            tone: "strong",
            headline: "You refused a deal that would have hurt.",
            detail:
              "This deal had grown into a shape nobody would have chosen on purpose. Saying so cost a quarter and saved a year, and Sarah didn’t argue with a word of it.",
            changed: [
              "No contract, and no loss-making delivery",
              "Your people are free for better work",
              "Sarah will call about the next one",
            ],
            effect: {
              dims: { win: -18, profit: 16, deliver: 13 },
              flags: ["walked_away"],
              badge: "held_nerve",
            },
            lesson: {
              principle: "We turned down a deal that wasn’t worth having, and that was a decision, not a failure.",
              because:
                "A known risk that nobody had paid to fix was still in the deal, and walking away stopped it becoming a signed promise.",
              watchFor:
                "Before signing, ask whether you would staff this yourself. If the answer is no, say so while saying no is still cheap.",
            },
            next: "end",
          },
          {
            id: "m9b-walk-wrong",
            tone: "hard",
            headline: "You turned down a deal that was sound.",
            detail:
              "Caution isn’t judgement. Nothing in this engagement had established the kind of risk that justifies refusing, so you walked without a specific commitment you couldn’t carry.",
            changed: [
              "No contract",
              "A quarter’s pursuit cost written off",
              "Orion will be slower to call",
            ],
            effect: { dims: { win: -22, profit: -6, deliver: 5 }, flags: ["walked_away"] },
            lesson: {
              principle: "Turning down a deal only makes sense if we can name the risk we are refusing.",
              because:
                "Nothing in this deal was a risk we could not carry, so walking away gave up sound work for no reason you could name.",
              watchFor: "Before you decline, name the specific thing you are unwilling to carry.",
            },
            next: "end",
          },
        ],
      },
    ],
    lesson: {
      principle: "Before I sign, I check the deal is still one I’d choose, because winning it took concessions.",
      because:
        "Until the signature I can still change or refuse the deal, and afterwards every promise in it is Aisha’s team’s to keep.",
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
      "The price, the terms and the risks you accepted are now in a signed contract with Orion.",
      "Next, Aisha’s team starts the work, and has to deliver every promise in it.",
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
    objective: "Find two people to do the work we promised Orion.",
    minutes: 3,
    hero: "solution-workshop",
    situation: [
      "That same month, two of my best people are being moved to a bigger client, and their replacements can’t start for six weeks.",
      "Decide who fills those two places now, because whoever it is will be doing the work we promised Orion.",
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
        text: "I have been through our budget for this contract twice. Whatever we do here comes out of what is left.",
      },
      {
        when: { any: ["ops_onside", "has:training"] },
        text: "My team knows two places are empty. They want names by Friday, and so will Orion.",
      },
      { text: "I can fill these places with people who are free now, or wait for the ones the plan named. Not both." },
    ],
    advisor: AISHA,
    consider: [
      "Which parts of this work need someone experienced?",
      "What does each choice take from you personally?",
      "Does Orion need to know, and who tells Sarah?",
    ],
    tip: "Every way of filling those places costs us money, time or the date. Which one can you spare?",
    prompt: "Two empty places on the team, and three ways to fill them.",
    question: "Who fills the two empty places?",
    options: [
      {
        id: "o-juniors",
        title: "Use two graduates and check their work",
        icon: "people",
        description: "Two recent graduates start now, and you spend extra hours checking everything they do.",
        commits: "Hours of your own time, every week, until the end.",
        pros: ["Can start on Monday", "Costs us little"],
        cons: ["Slower, with mistakes to fix", "Takes your own time"],
        cost: { time: 3, investment: 1 },
        outcomes: [
          {
            id: "m10b-juniors-held",
            when: { any: ["has:training", "ops_onside"] },
            tone: "strong",
            headline: "It works, because they had support around them.",
            detail:
              "Graduates learn fast on a project that has staff training built in, or a client team that is already helping; without either, they’re a risk. You had at least one.",
            changed: ["Both places filled", "Your time goes on checking work"],
            effect: { dims: { deliver: 3, profit: 6, win: -1 } },
          },
          {
            id: "m10b-juniors-thin",
            tone: "mixed",
            headline: "Both places filled, slower, and leaning on you.",
            detail:
              "The work gets done, with the mistakes you’dexpect to fix. Everything they do is checked by you, so if you are ill or busy, the whole project stalls.",
            changed: ["Both places filled", "Everything waits for your checks"],
            effect: { dims: { deliver: -2, profit: 7 } },
          },
        ],
      },
      {
        id: "o-contractors",
        title: "Hire two contractors",
        icon: "coins",
        description: "Two experienced freelancers who start next week, at twice what our own people cost.",
        commits: "Twice the daily cost, and they leave when their contract ends.",
        pros: ["Experienced, and start next week", "Need no training"],
        cons: ["Twice the daily cost", "What they learn leaves with them"],
        cost: { time: 1, investment: 3 },
        outcomes: [
          {
            id: "m10b-contractors-broke",
            when: { any: ["discounted", "thin_mitigation"] },
            tone: "hard",
            headline: "There is only money for one contractor.",
            detail:
              "Contractors at twice the cost need spare money in the contract, and ours has none left after the price cut. So it’s one contractor instead of two, and my team quietly covers the gap.",
            changed: ["Only one place filled", "The contract is close to losing money"],
            effect: { dims: { profit: -11, deliver: 1 } },
          },
          {
            id: "m10b-contractors",
            tone: "mixed",
            headline: "Both places filled, at a cost we never planned.",
            detail:
              "We have the people we need from next week, at a cost our budget never planned for. And in nine months, everything they learned will have left with them.",
            changed: ["Both places filled", "Less profit on the contract", "What they learn will leave with them"],
            effect: { dims: { deliver: 5, profit: -8 } },
          },
        ],
      },
      {
        id: "o-slip",
        title: "Wait for our own people",
        icon: "clock",
        description: "Wait six weeks for our own experienced people, and ask Orion to move the date.",
        commits: "Moving a date Sarah has already given her board.",
        pros: ["The right people do it", "Nothing rushed"],
        cons: ["Sarah’s board knows the date", "Six weeks of waiting"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m10b-slip-ok",
            when: { any: ["credibility", "ops_onside", "evidenced"] },
            tone: "strong",
            headline: "Orion moved the date, because you asked early.",
            detail:
              "Asking for six more weeks is an easy conversation the day you find out, and a hard one the week the date arrives. You asked straight away, and Orion already trusted what we told them, so the date moved and nothing else did.",
            changed: ["The right team", "Date moved with Orion’s agreement"],
            effect: { dims: { deliver: 6, profit: 3, win: -3 }, badge: "recovered" },
          },
          {
            id: "m10b-slip-cold",
            when: { any: ["promised:fast", "overrode_review"] },
            tone: "hard",
            headline: "That date was why Orion picked us.",
            detail:
              "Speed was the most attractive thing in your proposal, and now we’re asking for six more weeks. Sarah has to go back to a board that approved this because of the dates.",
            changed: ["The right team, eventually", "The speed you sold them is gone"],
            effect: { dims: { win: -12, deliver: 4 } },
          },
          {
            id: "m10b-slip",
            tone: "mixed",
            headline: "Orion agreed to the new date, and noted why.",
            detail:
              "The date moved without much drama. But it’s now on record, halfway through, that the plan was written for a team we didn’t have.",
            changed: ["The right team", "Six weeks later than planned"],
            effect: { dims: { deliver: 3, win: -6 } },
          },
        ],
      },
    ],
    lesson: {
      principle: "Our plan only holds if named people are free to do each part of it.",
      because:
        "The plan assumed the right people would stay free, and when two were moved away, the team doing the work had to cover the gap.",
      watchFor: "When you commit to a date, ask who specifically is going to be sitting there.",
    },
    next: "m10h",
  },

  /**
   * Backlog 5.7 — the handover. The one beat whose currency is what the player already
   * has rather than what they would prefer.
   *
   * Aisha’s standing line has been in this file since the cast was written: "My team
   * inherits every sentence in that proposal. Which ones did you mean?" It was rhetorical
   * for seventeen beats. Here it is the question, and the answers are the player’s OWN
   * commitments read back at them — so every option carries a `requires`, and which
   * sentences you are entitled to stand behind is a consequence of the run rather than a
   * menu. An option nobody earned renders locked and named (`ui/apply.tsx`); seeing the
   * answer you could have given is the teaching.
   *
   * WHY THE FALLBACK IS GATED TOO. `o-meant-all-of-it` requires `won`, which every path
   * reaching this node carries: every m9a branch that does not divert to the ending
   * writes it, and m9b’s two walk-away branches divert as well. So the beat is always
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
   *
   * WHEN IT HAPPENS (CNT-01). Not at the start of delivery: m10 and m10b have already put
   * the team five months in. It is the month-six re-plan, where Aisha takes the second half
   * off the pursuit lead’s hands for good and first asks which of the promises still stand.
   * So nothing here may say her team "starts on Monday" — what starts on Monday is month
   * six, which is also the Monday `turn-sarah` opens on.
   */
  {
    kind: "choice",
    id: "m10h",
    chapter: 5,
    stage: "delivery",
    title: "The sentences you wrote",
    eyebrow: "The handover",
    objective: "Tell Aisha which promises in your proposal you meant.",
    minutes: 4,
    hero: "solution-workshop",
    situation: [
      "Now the two empty places are dealt with, I take over planning on Monday, and every promise in our proposal becomes mine to keep. I’ve marked the lines I can’t plan around yet, so tell me which ones you meant, because my team builds exactly those.",
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
          "Now the two empty places are dealt with, I take over planning on Monday, and your promises become mine to keep.",
          "We promised to rebuild Orion’s refunds and helpline systems, yet Marcus’s team never agreed to install them, so tell me what you meant; I plan to your answer.",
        ],
      },
      {
        when: { all: ["promised:fast"], none: ["has:data"] },
        situation: [
          "Now the two empty places are dealt with, I take over planning on Monday, and your promises become mine to keep.",
          "I’ve marked the eight-week trial, which assumed Orion’s order records were usable, and they still aren’t; tell me whether you meant it, because I plan to your answer.",
        ],
      },
      {
        when: { all: ["outcome_based"] },
        situation: [
          "Now the two empty places are dealt with, I take over planning on Monday, and your promises become mine to keep.",
          "A third of our fee depends on complaints falling, a target we wrote into the contract; tell me whether you meant it, because my plan depends on it.",
        ],
      },
      {
        when: { all: ["ops_onside", "evidenced"] },
        situation: [
          "Now the two empty places are dealt with, I take over planning on Monday, and your promises become mine to keep.",
          "I’ve marked almost nothing, so my question is smaller: which lines are fixed, and which may I change when the plan needs room?",
        ],
      },
    ],
    advisorLine: [
      {
        when: { any: ["unanchored", "risk_accepted", "fragile_timeline"] },
        text: "I’ve read the review notes on this proposal. Before you answer, tell me which of these lines you would still sign today.",
      },
      {
        when: { all: ["ops_onside", "evidenced"] },
        text: "Most of this I can plan to already. I’dstill rather hear it from you than guess.",
      },
      { text: "Tell me which of your promises you actually meant, and I’ll plan the rest of the project around your answer." },
    ],
    advisor: AISHA,
    consider: [
      "Which lines did you write to win, rather than to deliver?",
      "Who has to be told if you take one back?",
      /* First person: `consider` renders inside the colleague block, under her own name
         and photograph, and the advisor on this beat is Aisha. Asking the player what
         Aisha would stop planning for, in Aisha’s voice, was the one place in fourteen
         of these lists where the speaker talked about herself in the third person. */
      "What do I stop planning for if you add conditions?",
    ],
    tip: "I am not trying to catch you out. I need a plan my team can actually keep to.",
    prompt: "Aisha needs one answer. Every other line stays exactly as written.",
    question: "Which of your promises did you mean?",
    options: [
      {
        id: "o-meant-the-date",
        title: "Keep the eight-week trial date",
        icon: "clock",
        /* The pilot, and only the pilot — a date you never promised is not a sentence
           anybody can read back at you. */
        requires: { any: ["promised:fast", "fragile_timeline"] },
        description: "The trial date is in the contract, and Sarah has shown it to her board. Keep it.",
        say: "I meant the eight weeks. Plan to that date and tell me what it needs.",
        commits: "Aisha’s team must hit the date, whatever it takes.",
        pros: ["Orion keeps what it bought", "No promise taken back"],
        cons: ["The team covers any shortfall", "No fresh check that it holds"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m10h-date-founded",
            when: { any: ["has:data", "ops_onside"] },
            tone: "strong",
            headline: "Aisha plans to the date, because someone had checked it.",
            detail:
              "The date rests on something real: the check of Orion’s records, or Marcus’s team already working with us. I don’t have to take your word for it; I can see what it depends on, so I’ll plan the rest of the project to it and stop asking.",
            changed: [
              "The date is now a plan",
              "The firm is committed to resourcing it",
            ],
            effect: { dims: { win: 5, deliver: 2, profit: -4 }, badge: "connected_dots" },
            lesson: {
              principle: "I can plan to a date somebody checked, but not to one somebody hoped for.",
              because:
                "The eight weeks held because, months earlier, you paid for the dull work that made it possible, so standing behind it cost only money.",
              watchFor: "Before repeating a date out loud, ask what it is resting on.",
            },
          },
          {
            id: "m10h-date-hollow",
            tone: "hard",
            headline: "Aisha keeps the date, and her team pays for it.",
            detail:
              "Nothing behind the eight weeks has changed since you wrote it, so the only thing left to adjust is how hard my team works. My plan now has my two most experienced people working weekends until the trial starts, and none of them was there when the date was agreed.",
            changed: [
              "The date survives",
              "The plan depends on weekend working",
              "Aisha has your answer in writing",
            ],
            effect: { dims: { win: 3, deliver: -10, profit: -2 } },
            lesson: {
              principle: "Confirming a promise you haven’t checked is free for you and expensive for whoever keeps it.",
              because:
                "You repeated a date nobody had re-checked, so the work got no easier and the extra effort now falls on Aisha’s team.",
              watchFor:
                "When you confirm a commitment, ask what has changed since you made it. If the answer is nothing, nothing is fixed.",
            },
          },
        ],
      },
      {
        id: "o-meant-with-conditions",
        title: "Keep the promise, but add conditions",
        icon: "scale",
        /* You can only attach conditions to a promise large enough to have them. All
           three of these record a proposal that reached further than its plan. */
        requires: { any: ["scope:heavy", "unanchored", "risk_accepted"] },
        description: "Keep the big promise, and write down what Orion must do first, such as Marcus’s team helping.",
        say: "I meant the rebuild, but not without Marcus’s team helping. Write down what we need from them.",
        commits: "Sarah reads conditions that weren’t in the signed contract.",
        pros: ["The promise stays, with limits", "Aisha knows what it needs"],
        cons: ["New conditions after signing", "Can look like backing off"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m10h-qualify-heard",
            when: { any: ["ops_onside", "evidenced", "credibility", "reviewed"] },
            tone: "strong",
            headline: "The conditions go in, and nobody calls them excuses.",
            detail:
              "You’ve been accurate with Orion all along, so a list of what the rebuild needs reads as a plan, not as a firm looking for a way out. Sarah agreed them within a week, and now I know what has to be true, and I can move the date if it isn’t.",
            changed: [
              "The promise carries written conditions",
              "Sarah has seen the new conditions",
              "Aisha can re-plan without negotiating",
            ],
            effect: { dims: { deliver: 9, win: -3 }, badge: "smart_tradeoff" },
            lesson: {
              principle: "A promise with its conditions written beside it is the only kind I can actually manage.",
              because:
                "You kept the rebuild and said what it needs, and because Orion trusted you, that took one conversation rather than a new contract.",
              watchFor: "The cheapest moment to attach a condition is before anybody has planned around its absence.",
            },
          },
          {
            id: "m10h-qualify-late",
            tone: "mixed",
            headline: "Orion accepts the conditions, then starts checking our work.",
            detail:
              "You’re right that the rebuild depends on things nobody agreed to. But you’ve raised it five months after signing, to a client with little reason to give us the benefit of the doubt, so the conditions went in along with a review meeting every two weeks that we didn’t ask for.",
            changed: [
              "The conditions are written down",
              "Orion now checks the project closely",
            ],
            effect: { dims: { deliver: 6, win: -6, profit: -1 } },
            lesson: {
              principle: "Adding conditions to a promise uses up the client’s trust, and we had little to use.",
              because:
                "The conditions were the same either way, and how Orion took them depended on how much it already trusted us, which was settled months ago.",
              watchFor: "Notice which conversations you are able to have because of how the earlier ones went.",
            },
          },
        ],
      },
      {
        id: "o-meant-the-dull-lines",
        title: "Protect the unglamorous work",
        icon: "layers",
        /* You cannot ring-fence a workstream you never bought. These are the three
           unglamorous things m5b and m7 let the player pay for. */
        requires: { any: ["has:training", "has:ops_workstream", "has:data"] },
        description: "Staff training, working with Marcus’s team, measuring results: none of it gets cut to save time.",
        say: "Those dull lines weren’t padding. Nobody cuts them to save a date, me included.",
        commits: "Gives up the easiest savings if money gets tight.",
        pros: ["The groundwork stays in place", "Nothing reopened with Orion"],
        cons: ["Their costs all stay", "Nothing new for Orion"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m10h-dull-kept",
            when: { any: ["ops_onside", "has:training", "has:ops_workstream"] },
            tone: "strong",
            headline: "You protected the first thing anybody cuts.",
            detail:
              "Training and the work with Marcus’s team are always what goes when a project needs to save two weeks, because nobody outside my team notices they’ve gone. You’ve said in advance that they don’t move, so when someone asks me to find those two weeks, I have your answer ready.",
            changed: [
              "Training and operations work protected",
              "Their cost stays on our side",
            ],
            effect: { dims: { deliver: 7, profit: -6, win: 1 }, badge: "connected_dots" },
            lesson: {
              principle: "The work nobody outside my team would miss is the first to be cut, unless someone protects it out loud.",
              because:
                "You paid for that work months ago and have now ruled it out as a saving, which is why month nine will be calm.",
              watchFor: "Notice which parts of a plan nobody outside your own team would miss. Those are the ones that vanish.",
            },
          },
          {
            id: "m10h-dull-thin",
            tone: "mixed",
            headline: "You protected the measuring, and little else was there.",
            detail:
              "The measuring stays, so someone can prove whether this worked. But it’s the only dull line we have, since training and the work with Marcus’s team were never bought, so there’s little holding up the rest of the plan.",
            changed: [
              "Measuring work protected",
              "Less underneath than Aisha hoped",
            ],
            effect: { dims: { deliver: 4, profit: -5, win: -2 } },
          },
        ],
      },
      {
        id: "o-did-not-mean-the-number",
        title: "Withdraw the complaints target",
        icon: "cross",
        /* Only available to a player who put a figure in a contract — at m6b by pricing
           on the outcome, or at m9a by writing Foyle his justification. */
        requires: { all: ["outcome_based"] },
        description: "Ask Sarah to remove the complaints target that a third of our fee depends on.",
        say: "That figure was my number, not theirs. I’d rather withdraw it now than miss it in month nine.",
        commits: "Withdrawing something Orion agreed to in writing.",
        pros: ["Our fee no longer at risk", "Aisha stops planning around it"],
        cons: ["Takes back a written promise", "Sarah sold it to her board"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m10h-payback-cold",
            when: { any: ["evidenced", "has:data"] },
            tone: "hard",
            headline: "You take back the one number they trusted.",
            detail:
              "That figure rested on complaint numbers you’dactually checked, which is exactly why Sarah could show it to her board. Withdrawing it now doesn’t look careful; it looks like a firm that no longer believes its own promise.",
            changed: [
              "The fee no longer moves with results",
              "Sarah must go back to her board",
              "The one thing only we offered is gone",
            ],
            effect: { dims: { win: -12, profit: 5, deliver: 3 } },
            lesson: {
              principle: "We took back the one promise no rival firm had been willing to make.",
              because:
                "The figure was sound because you had checked the numbers under it, so withdrawing it removed little risk and cost us the reason Orion chose us.",
              watchFor: "Before withdrawing a promise, check whether it was the promise that was weak or your nerve.",
            },
          },
          {
            id: "m10h-payback-right",
            tone: "strong",
            headline: "Sarah isn’t pleased. Aisha is relieved.",
            detail:
              "Nobody ever agreed what counts as a complaint, or counted them before we started, so nearly a million pounds of our fee turned on halving a number nobody had written down. Taking it out cost you a hard half hour with Sarah; leaving it in would have cost me the whole of month nine.",
            changed: [
              "The fee no longer rides on guesswork",
              "Sarah is cooler, and clear why",
            ],
            effect: { dims: { profit: 8, deliver: 4, win: -7 }, badge: "smart_tradeoff" },
            lesson: {
              principle: "An awkward half hour now is cheaper for us than an argument about the numbers in month nine.",
              because:
                "Nobody had counted complaints before we started, so the target could never be proved either way, and removing it cost goodwill but ended the argument.",
              watchFor: "A number in a contract is only as good as the thing everybody has agreed to count.",
            },
          },
        ],
      },
      {
        id: "o-meant-all-of-it",
        title: "Stand behind every line",
        icon: "flag",
        /* The unconditional answer, and still gated — on the one thing every run that
           reaches this beat has done. `won` rather than `signed`, though both are
           guaranteed here, because `won` is on the rail: the ledger has been telling the
           player "everything after this is about keeping what you said" since the award,
           so the card’s provenance points at something they have already read rather than
           at invisible state. See the note above the mission. */
        requires: { all: ["won"] },
        description: "You wrote it and you meant it, and you are not going through it line by line.",
        say: "All of it. I wrote every line and I meant it. I am not unpicking it now.",
        commits: "Aisha must plan for every promise in the document.",
        pros: ["Nothing reopened with Orion", "The proposal stays as written"],
        cons: ["Aisha plans around all of it", "You re-check none of it"],
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
              "I went through it line by line and found a proposal that promises only what we have the people and money to do: nothing oversold, nothing cut to hit a price, no review warning left unpaid for. Saying every line stands took four minutes, because it’s true.",
            changed: [
              "The whole document stands, and holds",
              "Aisha plans from it, not around it",
            ],
            effect: { dims: { win: 4, deliver: 3, profit: 2 }, badge: "held_nerve" },
            lesson: {
              principle: "This meeting was short because, months earlier, we promised only what we could afford to do.",
              because:
                "Nothing needed conditions because nothing had been oversold, and that was settled when we chose the work and the price.",
              watchFor: "Whether this conversation is short is decided months before anybody has it.",
            },
          },
          {
            id: "m10h-all-loaded",
            tone: "hard",
            headline: "You confirmed every line, including the shaky ones.",
            detail:
              "I asked which lines you meant and you said all of them, the one answer that gives me nothing to work with. So I plan to the whole document, and every call about which promises were real is mine to make alone, in the same month we were two people short.",
            changed: [
              "Every sentence is now a commitment",
              "Aisha decides alone which were real",
              "Nothing reopened with Orion",
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
              principle: "Saying every promise stands hands the hard choices to me, because I have to deliver them.",
              because:
                "You treated every line as equally meant, so Aisha can no longer tell the promises written to win from the ones written to deliver.",
              watchFor: "If you cannot name which of your own promises was the weakest, somebody else will have to.",
            },
          },
        ],
      },
    ],
    lesson: {
      principle: "Aisha delivers what we promised, so she needs to know which of our promises were real.",
      because:
        "The proposal did not change today, but Aisha now knows which lines you will defend and which you hoped nobody would read closely.",
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
      "Orion told its staff on Monday: Sarah Lim, who chose us and wanted this project, leaves for a bigger job in three weeks.",
      "She had known for a month and could not tell anyone, including us.",
      "Nobody has been named to replace her. Without her, nobody at Orion is in charge of our project or its budget.",
    ],
    prompt: "Sarah leaves in three weeks, and nobody has been named to take over our project.",
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
    objective: "Decide how to use Sarah’s last three weeks at Orion.",
    minutes: 3,
    hero: "solution-in-store-tech",
    situation: [
      "Sarah has resigned and leaves in three weeks, and she is the one person at Orion who chose us, holds our budget and argues for us.",
      "Decide what we do with those three weeks, because her replacement can keep or cancel the project.",
    ],
    presentation: "dialogue",
    surface: "call",
    variants: [
      /* How month five was handled now reaches the sponsor-succession beat. These three
         also make `crunched`, `undisclosed` and `changed_scope` genuinely READ, rather
         than being declared narrative-only — which was the cheap option and the wrong
         one, since each records a real position the player’s successor inherits. */
      {
        when: { all: ["crunched"] },
        situation: [
          "Sarah leaves in three weeks, and she is the one person at Orion who chose us, holds our budget and argues for us.",
          "The two of my team who worked weekends in month five have also asked to leave, so decide how we use those three weeks.",
        ],
      },
      {
        when: { all: ["undisclosed"] },
        situation: [
          "Sarah leaves in three weeks, and she is the one person at Orion who chose us, holds our budget and argues for us.",
          "Her replacement will read our original proposal, not what we delivered, and nobody has written down why they differ; decide how we use those three weeks.",
        ],
      },
      {
        when: { all: ["changed_scope"] },
        situation: [
          "Sarah leaves in three weeks, and she is the one person at Orion who chose us, holds our budget and argues for us.",
          "One thing helps: the extra work we charged for in month five is signed and dated, so decide how we use those three weeks.",
        ],
      },
      {
        when: { all: ["ops_onside"] },
        situation: [
          "Sarah leaves in three weeks, and she is the one person at Orion who chose us, holds our budget and argues for us.",
          "One thing helps: Marcus Reed’s team already works with us and Marcus is staying, so decide how we use those three weeks.",
        ],
      },
      {
        when: { all: ["outcome_based"] },
        situation: [
          "Sarah leaves in three weeks, and she is the one person at Orion who chose us, holds our budget and argues for us.",
          "She agreed a third of our fee depends on complaints falling, and her replacement inherits that without agreeing to it; decide how we use those weeks.",
        ],
      },
    ],
    saidQuote: {
      text: "I have told them this programme matters. After that it is not in my hands, and my successor will make their own mind up.",
      ...SARAH,
    },
    concerns: [
      "The person holding the budget is leaving",
      "Nobody else has publicly backed this",
      "Her replacement will have their own priorities",
    ],
    advisorLine: "I have lost the person backing a project twice before. Both times, their last three weeks decided what survived.",
    advisor: AISHA,
    consider: [
      "Who else at Orion already cares whether this succeeds?",
      "What would Sarah’s replacement be likeliest to cancel?",
      "What can we prove in three weeks?",
    ],
    tip: "Sarah leaves, Marcus stays, and the budget waits for whoever replaces her. Which of those can you change?",
    prompt: "Sarah has three weeks left, and nobody has replaced her yet.",
    question: "What do you do with the three weeks?",
    options: [
      {
        id: "o-broaden",
        title: "Get more of Orion’s leaders backing it",
        icon: "people",
        description: "Spend the three weeks getting two more senior people at Orion to back the project.",
        say:
          "Then I need more than one person backing this. I’ll spend three weeks with Marcus and the other directors.",
        commits: "Three weeks of meetings instead of delivering work.",
        pros: ["Survives one person leaving", "More people argue for us"],
        cons: ["Three weeks not delivering", "More people must agree decisions"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m10c-broaden-ops",
            when: { any: ["ops_onside", "has:ops_workstream"] },
            tone: "strong",
            headline: "Marcus takes over backing the project, and he’s staying.",
            detail:
              "The person best placed to back this was the one you brought into the proposal months ago. Involving his team then is why the project survives Sarah leaving now.",
            changed: [
              "Three people now back the project",
              "Marcus backs the work his team runs",
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
            headline: "You found two new backers, but neither cares much.",
            detail:
              "Three weeks of introductions produced two people who won’t block the project, not two who’ll defend it. And you started those relationships from nothing, at the worst possible moment.",
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
        description: "Put something working in front of Orion’s staff while Sarah is still there to see it.",
        say: "Then I want something live before you go. Three weeks, one region, a thing that actually runs.",
        commits: "Three weeks of long hours for Aisha’s team.",
        pros: ["Something real to point at", "Working things are harder to cancel"],
        cons: ["Rushed and unfinished", "Tires the team out"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m10c-prove-ready",
            when: { any: ["has:data", "promised:fast", "ops_onside", "changed_scope"] },
            tone: "strong",
            headline: "Something real went live, and it stays after she goes.",
            detail:
              "You had the groundwork to move fast, so three weeks was enough to put a working thing in front of Orion’s staff. A new boss can cancel a plan easily; cancelling something that already works is a much harder meeting.",
            changed: ["A live result on the record", "The team is tired"],
            /* Winability well above the handover memo’s +6, because this is the only
               option that converts belief into evidence while the believer is still in
               post — her successor arrives to a thing that works rather than a document
               arguing that it will. Deliverability pays for the rush, which is honest,
               and the cost stays in profit. It was +10/+2/-3 against the memo’s
               +6/+3/+2, i.e. beaten on two dimensions of three and dominated in 91% of
               reachable states. */
            effect: { dims: { win: 10, deliver: -2, profit: -3 } },
          },
          {
            id: "m10c-prove-thin",
            tone: "hard",
            headline: "You shipped a demo, and it convinced nobody.",
            detail:
              "Three weeks wasn’t enough to build anything properly, so Sarah saw an early version with the hard parts missing. Her replacement read it as a project with nothing to show after six months.",
            changed: ["Something shipped", "It made the programme look weaker"],
            /* Deliverability POSITIVE even on the thin branch, which is the point of
               the option: something exists and runs. It is unimpressive and it is real,
               and a successor arriving to a working increment is in a better delivery
               position than one arriving to a plan — whatever they think of the increment.
               At -4/-5/-1 this branch was beaten on all three by `o-broaden`’s cold
               branch (+3/0/+1) in 94% of reachable states, which made the whole option a
               trap rather than a choice. */
            effect: { dims: { win: -4, deliver: 2, profit: -1 } },
          },
        ],
      },
      {
        id: "o-handover",
        title: "Put the case in writing for her successor",
        /* A document that makes the case without Sarah in the room needs a case that
           stands on its own. Without evidence there is nothing to write down. */
        requires: { any: ["evidenced", "outcome_based", "knows:criteria"] },
        icon: "layers",
        description: "A short document, built on Orion’s own figures, that argues for the project after Sarah goes.",
        say: "Then I write it all down properly, in your own figures, so the argument does not depend on you.",
        commits: "Depends on her replacement reading it.",
        pros: ["Cheap and honest", "Works without anyone selling it"],
        cons: ["Only as good as its reader", "Nobody argues for it"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m10c-handover-evidenced",
            when: { any: ["evidenced", "has:data"] },
            tone: "strong",
            headline: "The case stands up without anybody selling it.",
            detail:
              "We argued for this project from Orion’s own figures from the start, so the handover is one page of their numbers and what has improved since. A new boss reading it cold has very little to disagree with.",
            changed: ["A case that survives on paper", "No advocate, but no argument either"],
            effect: { dims: { win: 4, deliver: 2, profit: 2 } },
          },
          {
            id: "m10c-handover-thin",
            tone: "mixed",
            headline: "A good document, waiting for a reader who cares.",
            detail:
              "It’s honest, clear and almost free. It also depends entirely on someone new choosing to back a project they didn’t start, on the strength of a handover note.",
            changed: ["The case is written down", "Nobody is carrying it"],
            effect: { dims: { win: -2, profit: 3 } },
          },
        ],
      },
    ],
    lesson: {
      principle: "Our project was backed by only one person at Orion, so it was in danger the day she left.",
      because:
        "Nothing about the work changed, but the project’s future was tied to Sarah alone, so her leaving put it at risk.",
      watchFor: "The person backing a project at a client often moves on within eighteen months. Projects rarely finish faster than that.",
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
      "The trouble at month five, the gap in Aisha’s team, the new plan and Sarah leaving all hit what you had agreed in earlier acts.",
      "Next you see how the whole deal ended: whether you won, whether it made money, and whether we delivered.",
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
   * restated as a chain, and one simply paraphrased its own outcome’s detail text.
   *
   * ON `insteadOf` — the wrong answers for the debrief’s one causal-claim item.
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
   *    against the flags the outcome’s own `when` reads, and against the ones every
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
   * observation rather than an event, or whose only honest cause is the thread’s own
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
         is left is the proposal’s showier half and the shape of the deal. */
      insteadOf: [
        "You put an eight-week pilot in the proposal so the board could see something.",
        "You restructured the deal into phases so the board’s first cheque was small.",
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
        "You put a fortnight into working out exactly where the rival’s platform stops.",
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
        "You put an eight-week pilot in, so Sarah’s board would see something inside two months.",
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
         half of the same outcome’s detail — "work you understand" — and it points at
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
         conventional shape is not here, because that outcome’s own prose already says
         three firms ended up offering the same answer — it would have been true. The
         third says "document" so that the answer is not the only candidate about the
         thing being scored. */
      insteadOf: [
        "You put a campaign into the market, and kept your senior people free for other work.",
        "You took Sarah to see the work you had already done for another retailer.",
        "You spent the internal review week making the document argue harder for Sarah’s board.",
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
         risk and the overruled review are all excluded — `m10h-all-sound`’s `none` list
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
