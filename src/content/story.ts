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
    title: "What is your team good at?",
    body: [
      "You lead six people at a consultancy, a firm that companies pay to fix their problems. Your job is to win a client and make sure your team can do what you promised.",
      "Every team is strong at one thing and short of another. Pick what yours is good at. It stays true until the last month.",
    ],
    question: "What is your team's strength?",
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
        pros: ["Like work we've done", "The money looks real"],
        cons: ["Two rival firms got there first"],
        cost: { time: 2, investment: 2 },
        outcomes: [
          {
            id: "m1-nw",
            tone: "strong",
            headline: "Orion takes the meeting despite the rivals.",
            detail:
              "Orion took the meeting. Two other firms were already talking to them, but your past work is close enough to what they're asking for that nobody wondered why you were in the room.",
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
        cons: ["No past clients to vouch", "Six weeks of everyone's time"],
        cost: { time: 3, investment: 3 },
        outcomes: [
          {
            id: "m1-apex-read",
            when: { any: ["start:challenger", "knows:rivals"] },
            tone: "mixed",
            headline: "Apex said no, but they'll take your call next time.",
            detail:
              "Apex still picked its shortlist on factory experience, and we still don't have it. But you went in knowing that, led with the specialist partner we'd bring, and came away with a name to call next time — and Orion is the client we're chasing now, six weeks late.",
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
              principle: "The biggest number on the table only counts if we can credibly win it.",
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
              "Their team liked us; their approvals didn't move. After a month you walked away before more time was wasted, and picked up Orion, which was still open.",
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
          "Sarah Lim controls the money, but Marcus Reed runs the shops, warehouses and deliveries that would have to change. Most rival firms won't find that out until they've already promised a solution.",
        changed: ["You know where the real constraint sits"],
        effect: { dims: { deliver: 5, win: 2 }, badge: "good_question" },
      },
      {
        id: "m2-pain",
        when: { all: ["knows:real_pain"] },
        tone: "strong",
        headline: "You found the real problem.",
        detail:
          "They asked about the stores, but their complaints are about what happens after the sale. The gap between what they asked for and what's actually hurting them is where our work is.",
        changed: ["You know what is actually hurting them"],
        effect: { dims: { win: 5, profit: 2 }, badge: "good_question" },
      },
      {
        id: "m2-surface",
        tone: "mixed",
        headline: "Useful, but still their version of the problem.",
        detail:
          "What you found was worth knowing; it just isn't what decides this deal. You'll walk into the first meeting describing the problem the way they do, not the way it really is.",
        changed: [
          "You know more than you did",
          "You still describe it their way",
        ],
        effect: { dims: { win: 1 } },
        lesson: {
          principle: "The question that wins a client is usually the one nobody in the room has asked yet.",
          because:
            "Competitive and budget information tells you about the race. It does not tell you what is actually wrong, or who has to agree before anything can change.",
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
        text: "You know the pain and who owns the systems. Now choose who hears it first.",
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
              "Because you wrote about what happens after the sale, not the shops, it read as if we'd already been inside the business. Sarah invited us in, and asked us to take it to Marcus Reed in Operations too.",
            changed: [
              "You're in, describing the problem your way",
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
        cons: ["Uses our only introduction", "Hears only Sarah's view"],
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
              "It went well until the last minute, when Sarah said, “You'll need Operations comfortable with this before we can move.” You hadn't planned for a second decision-maker, and now you're meeting them late.",
            changed: [
              "You have Sarah's interest",
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
              "The adverts looked great by every number you'd put in a report. It reached people who were interested but couldn't buy, and got one lukewarm reply from an Orion manager two levels below Sarah.",
            changed: [
              "A lot of activity",
              "Little progress with Orion itself",
              "Senior people stayed free",
            ],
            effect: { dims: { win: 1, profit: 3 } },
            lesson: {
              principle: "Reach is easy to count, so we keep mistaking it for reaching the one person who decides.",
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
    tip: "I have said yes to two of these off a one-line request. One paid for the year.",
    prompt: "Three ways to answer a one-line request.",
    question: "How much do you put into Orion now?",
    options: [
      {
        id: "o-pursue",
        title: "Write the full proposal now",
        icon: "rocket",
        description: "Put our best people on it and write the full offer, with a price, straight away.",
        commits: "Our strongest people, unavailable to anyone else for weeks.",
        pros: ["First offer on their desk", "Shows we're serious"],
        cons: ["Best people tied up", "Pricing work nobody's defined"],
        cost: { time: 3, investment: 3 },
        outcomes: [
          {
            id: "m4-pursue-good",
            when: { any: ["knows:real_pain", "credibility"] },
            tone: "strong",
            headline: "You're first in front of them with a real proposal.",
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
        pros: ["Gets us inside Orion", "We're paid while learning"],
        cons: ["Much smaller first contract", "Rivals can move first"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m4-workshop-blind",
            when: { none: ["knows:real_pain", "knows:ops_constraint", "has_access"] },
            tone: "mixed",
            headline: "They agreed, and week one went on catching up.",
            detail:
              "The paid discovery got us in, but we pointed it at a business we hadn't looked into at all. Week one went on questions we could have answered from outside; week two on the ones that mattered.",
            changed: ["A smaller, safer first commitment", "Half the discovery spent catching up"],
            effect: {
              dims: { profit: 3, deliver: 3, win: -2 },
              flags: ["landed_small", "has_access"],
            },
          },
          {
            id: "m4-workshop",
            tone: "strong",
            headline: "They said yes, and they're paying you to learn.",
            detail:
              "It's a smaller first contract than anyone hoped for. But we're now paid, and allowed, to see the parts of the business nobody shows you in a sales meeting.",
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
              principle: "Saying no to work nobody can price yet protects our margin, and I'd defend that trade again.",
              because:
                "Declining cost you momentum and bought you a better-defined problem. Whether that trade was right depends on how badly you needed the win.",
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
        cons: ["Sarah is left waiting", "Days we can't get back"],
        cost: { time: 2, investment: 1 },
        outcomes: [
          {
            id: "m5-inv-known",
            when: { all: ["knows:rivals"] },
            tone: "strong",
            headline: "You already knew their angle. Now you know its limit.",
            detail:
              "Their offer is in-shop technology — genuinely good at what it does, and silent on deliveries, refunds and the helpline. You could say so precisely, because you'd done the reading earlier.",
            changed: ["You can name what their offer misses"],
            effect: { dims: { win: 5 }, flags: ["knows:rival_gap"], badge: "connected_dots" },
          },
          {
            id: "m5-inv-new",
            tone: "mixed",
            headline: "You found out what it is, a little late.",
            detail:
              "It's in-shop technology that never touches deliveries, refunds or the helpline — useful to know. But the days it took cost you some of Sarah's confidence; she wanted a view, not a research project.",
            changed: [
              "You understand the rival's offer",
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
        cons: ["We haven't studied their offer"],
        cost: { time: 1, investment: 2 },
        outcomes: [
          {
            id: "m5-accel",
            tone: "mixed",
            headline: "In the room in two days, with half an argument.",
            detail:
              "Speed read as confidence, and Sarah appreciated it. But you were arguing against something you hadn't examined, and twice you had to promise to come back with detail.",
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
              "You pointed out that a beautiful shop doesn't fix a three-week refund. With their complaint data behind you it landed as analysis, not a sales line — and now the rival is answering your question.",
            changed: [
              "The race is on ground you chose",
              "The rival's best asset matters less",
            ],
            effect: { dims: { win: 8, profit: 3 }, flags: ["reframed"], badge: "adapt" },
          },
          {
            id: "m5-reframe-weak",
            tone: "mixed",
            headline: "It sounded like a deflection, because you couldn't prove it.",
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
        cons: ["Needs Sarah's existing trust", "Their story goes unanswered"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m5-hold-ok",
            when: { any: ["credibility", "has_access"] },
            tone: "strong",
            headline: "Nothing broke, because Sarah already trusted you.",
            detail:
              "Sarah already trusted you enough that a rival's announcement didn't move her. Your steadiness read as confidence, not absence.",
            changed: ["You spent nothing and lost nothing"],
            effect: { dims: { win: 1, profit: 3 }, badge: "held_nerve" },
          },
          {
            id: "m5-hold-risky",
            tone: "hard",
            headline: "Three weeks of silence, and the rival filled it.",
            detail:
              "For three weeks the only firm with a story about Orion's future was the other one. By the time you got back in touch, “in-shop technology” was how Orion's own staff described the project.",
            changed: ["The rival's framing is now Orion's", "You're arguing uphill"],
            effect: { dims: { win: -9 } },
            lesson: {
              principle: "Staying quiet is a decision too, and in a race it hands the other side the story.",
              because:
                "Holding your plan is right when you have the standing to absorb the hit. Without that, silence hands your competitor the definition of the problem.",
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
    advisorLine: "One sentence, three readings. Whichever you pick, I'm the one scoping it on Monday.",
    consider: [
      "Is what they asked for where they lose money?",
      "What would let us disagree with them?",
      "Would the rival's offer look the same?",
    ],
    tip: "I've read three briefs this year that said ‘customer experience’. Each meant something different.",
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
        commits: "Goes head to head with the rival's demo.",
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
              principle: "If we deliver exactly what was asked and the damage is somewhere else, we've delivered nothing they needed.",
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
              "You opened with their own complaint numbers instead of our track record, and nobody argues with their own evidence. Sarah said quietly she'd suspected this for a year and couldn't get it funded.",
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
            headline: "You're right, and you can't prove it.",
            detail:
              "It's the right read, but you asked them to drop their own request on your instinct — and instinct is what they're paying to avoid. They asked for evidence we don't have.",
            changed: ["The right idea, poorly supported", "Asked to come back with proof"],
            effect: { dims: { win: 2, deliver: -2 }, flags: ["scope:postpurchase"] },
            lesson: {
              principle: "Being right about the problem isn't enough to build on; I need evidence the client will sign up to.",
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
              "They accepted, because it's sensible. But they brought us in as people who'd seen this before, and asking six weeks to form a view says we haven't. The bigger work gets pushed out.",
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
          "You put a workstream in the proposal with his people's names against it, before he had to ask. That turned the person best placed to block this into someone with a stake in it working.",
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
          "You've promised to replace the systems at the centre of their business, and nothing in the document says how those changes reach the shops, warehouses and helpline that use them. Everyone nods; nobody has checked.",
        changed: ["A large, attractive promise", "No route through Operations"],
        effect: { dims: { deliver: -6 }, flags: ["unanchored"] },
        lesson: {
          principle: "Every promise in a proposal is work somebody else has to deliver, and usually it's Aisha's team.",
          because:
            "The most impressive element you included is also the one that has to pass through the team you have not involved.",
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
          "It isn't the flashiest document in the pile. It includes the parts of the work that let the rest survive contact with a real organisation, which is rarer than it should be.",
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
              "The other bid never touches deliveries, returns or support, where Orion spends two and a half million a year handling complaints. Halving that would save twice our £600,000 difference, every year, so the premium stops being one. Procurement didn't enjoy it; Sarah has a straight answer for her board.",
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
              "Procurement is satisfied and the deal moves. But you funded the discount from the contingency we'd need if anything went wrong in delivery — and something usually does.",
            changed: ["Price objection removed", "No financial slack left"],
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
              "It's the honest version of a discount: the price falls because the work does. But what left was the least visible piece, and that's usually the piece that made the rest work.",
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
              "You didn't move the rate or cut the work — you changed what they had to commit to today. Sarah got a number her board could approve, and we're well placed to win phase two.",
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
      "I'll run the project if we win, so I've read our risk review — our own experts checking the plan before we sign.",
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
          "I'll run the project if we win, so I've read our risk review — our own experts checking the plan before we sign.",
          "Our lawyers say a third of our fee depends on hitting the promised result — miss it for any reason, and we're paid less.",
        ],
      },
      {
        when: { all: ["scope:heavy"], none: ["has:ops_workstream"] },
        situation: [
          "I'll run the project if we win, so I've read our risk review — our own experts checking the plan before we sign.",
          "We promise to rebuild Orion's main systems with no plan for Marcus's people to install them — which is what sank Orion's last project.",
        ],
      },
      {
        when: { all: ["promised:fast"], none: ["has:data"] },
        situation: [
          "I'll run the project if we win, so I've read our risk review — our own experts checking the plan before we sign.",
          "The eight-week trial needs Orion's order records, and nobody has checked they're usable — four weeks fixing them and we're late from day one.",
        ],
      },
      {
        when: { all: ["descoped"] },
        situation: [
          "I'll run the project if we win, so I've read our risk review — our own experts checking the plan before we sign.",
          "The work we cut to reach their price was holding other parts up, and they want to know how we still deliver what the contract promises.",
        ],
      },
      {
        when: { all: ["has:ops_workstream"] },
        situation: [
          "I'll run the project if we win, so I've read our risk review — our own experts checking the plan before we sign.",
          "It's a small finding: our team working with Marcus covers the hard part, but nobody has booked the time of two Orion specialists we need.",
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
    question: "What do we do about the gap?",
    options: [
      {
        id: "o-accept-risk",
        title: "Write it down and carry on",
        icon: "warning",
        description: "Record the gap officially, sign as planned, and deal with it if it happens.",
        say:
          "We record it and move on. If it arrives, it arrives in your month, and I won't pretend otherwise.",
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
              "The review flagged exactly where your proposal is thinnest, and writing it down doesn't make it smaller. It will arrive in delivery, on my watch, with a paper trail showing we knew.",
            changed: ["The risk is on record, unfunded", "A known problem heading for delivery"],
            effect: { dims: { win: 3, deliver: -12 }, flags: ["risk_accepted"] },
          },
          {
            id: "m9-accept-ok",
            tone: "mixed",
            headline: "Recorded. The risk is real but survivable.",
            detail:
              "Your proposal is solid enough that this is a risk we can carry. Accepting it keeps momentum, and there's slack elsewhere to absorb it.",
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
            headline: "You can't afford the fix you just agreed to.",
            detail:
              "Mitigation costs money, and the money's gone — you gave it to procurement to close the price gap. So we add a thinner fix than the review asked for and hope the difference doesn't matter.",
            changed: [
              "Partial mitigation",
              "No margin left for error",
            ],
            effect: { dims: { deliver: 3, profit: -9 }, flags: ["thin_mitigation"] },
            lesson: {
              principle:
                "What you settle commercially, my team lives with operationally — same decision, different month.",
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
              "You put real money and real work behind the risk while it's still cheap. It's the least satisfying line in the commercial case, and it gives my team a plan for the month it bites.",
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
            headline: "They took it seriously, because you'd been straight before.",
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
    objective: "Decide what we tell Orion now the plan has slipped.",
    minutes: 4,
    hero: "solution-in-store-tech",
    situation: [
      "We signed, and it's now month five: two Orion specialists our plan needs were moved to other work, so we're three weeks late.",
      "Sarah's board has also asked for one more thing, and we must decide what we tell Orion.",
    ],
    presentation: "dialogue",
    surface: "chat",
    variants: [
      {
        when: { any: ["unanchored", "risk_accepted"], all: ["scope:heavy"] },
        situation: [
          "We signed, and it's now month five: the new refunds and helpline systems are built, but Marcus won't switch them on without six weeks of testing.",
          "Nobody planned that time — it's the gap our review flagged — and Sarah's board now wants one more thing too.",
        ],
      },
      {
        when: { any: ["fragile_timeline", "promised:fast"] },
        situation: [
          "We signed, and it's now month five: the eight-week trial still can't start, because Orion's order records are taking months to clean up.",
          "We're late on our quickest promise, and Sarah's board now wants one more thing too.",
        ],
      },
      {
        when: { all: ["descoped"] },
        situation: [
          "We signed, and it's now month five: Orion's staff keep asking for the work we cut to reach their price.",
          "Every “no” makes the project feel smaller than what was sold, and Sarah's board now wants one more thing too.",
        ],
      },
      {
        when: { all: ["ops_onside", "has:training"] },
        situation: [
          "We signed, and it's now month five: staff in the trial shops are using the new ways faster than planned.",
          "Three regions want to start early, which needs people we don't have, and Sarah's board now wants one more thing too.",
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
    advisorLine: "I have thirty minutes and a team waiting on Monday. Tell me what I'm telling them.",
    advisor: AISHA,
    consider: [
      "Which decision created this?",
      "What can we still afford to do?",
      "What if they hear it from someone else?",
    ],
    tip: "Whatever you decide, I have to tell the team on Monday. Tell me what to say.",
    prompt: "Aisha has thirty minutes and needs a decision to take back to the team.",
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
            headline: "A difficult meeting, and it worked.",
            detail:
              "You went early, with a clear account of what changed and a re-plan already drafted. Because you've been accurate with Orion since the first conversation, they treated it as management, not failure.",
            changed: ["Plan reset with Orion's agreement", "The relationship survives intact"],
            effect: { dims: { deliver: 6, win: 2, profit: -2 }, badge: "recovered" },
          },
          {
            id: "m10-reset-cold",
            tone: "mixed",
            headline: "They accepted it, and started checking everything.",
            detail:
              "Saying it out loud still cost you. Without much track record to draw on, Orion responded with governance — weekly reviews, escalation paths, a steering committee.",
            changed: ["Plan reset", "You're now managed closely"],
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
            headline: "They paid, because it was provably out of scope.",
            detail:
              "You brought the original scope, the dated note where the extra ask first appeared, and a price. Sarah didn't enjoy it and approved it anyway, because the alternative was asking us to work for nothing. The programme grew and the margin held.",
            changed: ["Extra work funded", "The scope boundary is in writing"],
            effect: { dims: { profit: 9, deliver: 3, win: -2 }, flags: ["changed_scope"], badge: "smart_tradeoff" },
            lesson: {
              principle: "Extra work is a transaction, not a favour, and we could only say so because the boundary was written down.",
              because:
                "The work was always going to be done. Raising it as a change decided whether your margin paid or their budget did — and you could only raise it because the original boundary was written down.",
              watchFor: "When delivery is asked for something extra, ask first whether it was ever in the contract.",
            },
          },
          {
            id: "m10-change-thin",
            tone: "mixed",
            headline: "The conversation was harder than the arithmetic.",
            detail:
              "You were right that it's out of scope, but you couldn't point to where we said so. It became a negotiation about memory, not money — they part-funded it, and the relationship cooled a degree.",
            changed: ["Extra work part-funded", "An argument you shouldn't have needed"],
            effect: { dims: { profit: 4, win: -5, deliver: 1 }, flags: ["changed_scope"] },
            lesson: {
              principle: "A change request is only as strong as the scope somebody wrote down, and ours was thin.",
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
              "Adding people is the obvious fix, and you can't fund it. The commercial calls made before signing removed the option, so we add two people instead of five and the date slips anyway.",
            changed: ["Partial cover", "Date missed regardless", "The contract is now loss-making"],
            effect: { dims: { profit: -13, deliver: 2 } },
            lesson: {
              principle: "Delivery inherits every commercial decision made before it starts, and this one arrived with no room in it.",
              because:
                "The flexibility you needed in month five was sold in the pricing conversation, months earlier, to close a gap.",
              watchFor: "When you give something up to win, write down what you have made impossible.",
            },
          },
          {
            id: "m10-absorb",
            tone: "mixed",
            headline: "You held the date by paying for it.",
            detail:
              "Orion sees a programme delivering what it said it would, and our margin takes the hit quietly. That's a legitimate trade — it buys a reference and a relationship — but it isn't free.",
            changed: ["Promise kept", "Margin materially reduced"],
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
            headline: "You hit the date and missed the point.",
            detail:
              "Something went live on the promised day — thin, and not connected to the systems that matter. Within three weeks the support queue was worse than before, and two of my team have asked to roll off.",
            changed: [
              "The date was met",
              "The outcome was not",
              "Orion's real problem is unsolved",
            ],
            effect: { dims: { deliver: -14, win: -6, profit: 2 } },
          },
          {
            id: "m10-push-ok",
            tone: "mixed",
            headline: "Tight, and it landed.",
            detail:
              "The programme was built well enough that pressure alone got it over the line. Orion got what it was promised; my team paid in goodwill, and you'll spend time repairing that.",
            changed: ["Date met", "The delivery team is worn down", "Two people ask to roll off"],
            /* Was `deliver +2, profit +3, win +1` -- net +6 for a choice whose own cons say
               "Paid by the team", with nothing anywhere charging for it. Attrition is the
               cost, and it lands on Deliverability, because the people who know the
               programme are the ones who leave. */
            effect: { dims: { deliver: -4, profit: 3, win: 1 }, flags: ["crunched"] },
            lesson: {
              principle: "We held that date on borrowed goodwill, and the people who lent it decide when it's repaid.",
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
            headline: "Nobody noticed, because Operations was in on it.",
            detail:
              "Operations knows what was trimmed and why, and they're who the business asks. It held — but you're now relying on other people to explain a decision you chose not to announce.",
            changed: [
              "Short-term pressure relieved",
              "Operations carries an explanation you didn't give",
            ],
            effect: { dims: { deliver: 2, win: -4, profit: 4 }, flags: ["undisclosed"] },
            lesson: {
              principle: "Someone covering for us isn't the same as us being straight, and the people covering know the difference.",
              because:
                "It held because Operations absorbed the question you chose not to answer. That works exactly as long as their goodwill lasts, and you have spent some of it without asking.",
              watchFor: "If a decision needs somebody else to explain it, ask why you are not explaining it.",
            },
          },
          {
            id: "m10-quiet",
            tone: "hard",
            headline: "It worked until somebody opened the original proposal.",
            detail:
              "The pressure vanished. Four weeks later an Orion manager compared what shipped with what was proposed and asked a question in writing — and the issue stopped being scope and became that you hadn't said.",
            changed: [
              "Short-term pressure relieved",
              "Trust damaged, and hard to repair",
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
      principle: "Month five's problems are decided before signature; delivery is just where they arrive.",
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
          "Operations has sat in a room with us, and we know what their data can really support. Neither impresses in a pitch; together they're the difference between a proposal and a promise.",
        changed: [
          "Operations has met you before proposing",
          "You know what the data can do",
        ],
        effect: { dims: { deliver: 3 }, badge: "smart_tradeoff" },
        /* This beat printed the mission's fallback lesson on all three of its outcomes,
           including the two that are nearly opposite. Winning the room with nothing
           tested and grounding the work in what Operations can actually take are not the
           same experience, and they were being given the same sentence. */
        lesson: {
          principle:
            "A fortnight on the dull foundations is cheap next to pricing work we haven't checked.",
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
        headline: "You've built the argument, not the plan.",
        detail:
          "You have proof of past work and the gap in the rival's offer, so Sarah's case for us is stronger. What we still lack is Operations involved and checked data — the ground a delivery plan stands on.",
        changed: ["A stronger case with Sarah", "The delivery foundation is incomplete"],
        effect: { dims: { win: 3, deliver: -3 } },
        lesson: {
          principle:
            "An argument for choosing us isn't a plan for doing the work, and only the plan tells us what it costs.",
          because:
            "Credibility and competitor insight support the buying conversation. They do not replace the combination of operational involvement and checked data needed for delivery.",
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
    question: "How do you build the offer?",
    options: [
      {
        id: "o-partner",
        title: "Team up with a delivery specialist",
        icon: "talk",
        description: "Work with a specialist firm that already handles deliveries and refunds at this size.",
        commits: "We share our profit, and rely on a firm we don't run.",
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
              "They're good, and they're expensive. Without a clear read on what's broken, we're paying a specialist to solve a problem we've only described in general terms.",
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
        commits: "A system designed around somebody else's business.",
        pros: ["Fast and cheap", "Already worked once"],
        cons: ["Built for another client", "Looks second-hand"],
        cost: { time: 1, investment: 1 },
        outcomes: [
          {
            id: "m6b-reuse",
            tone: "mixed",
            headline: "Cheap, fast, and visibly second-hand.",
            detail:
              "It works, at a fraction of the cost of building new. But it solves the last client's problem, not this one, and Sarah noticed the gap between what it does and what she asked for.",
            changed: ["Strong margin", "A solution that fits imperfectly"],
            effect: { dims: { profit: 10, deliver: 3, win: -5 }, flags: ["reused_asset"] },
            lesson: {
              principle: "Reuse is cheap margin right up until it replaces thinking, and I've shipped that mistake.",
              because:
                "The asset was real and the saving was real. It answered a question this client had not asked.",
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
              "An outcome deal is only honest if both sides trust the number, and you'd audited their data: half a million contacts a year, counted the same way by both of us. A third of the fee moves against that, and Sarah's board found it very hard to refuse.",
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
              "The idea is strong, but nobody has counted the contacts, so there's no baseline either side can point at. The first argument of delivery will be about what a support contact even is — with a third of our fee on the table.",
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
              "Nothing's wrong with it, which is the problem. Three firms now offer the same shape of answer, so the only variables left are price and who the client likes.",
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
    advisorLine: "I would rather they argue with me now than agree now and blame me later.",
    advisor: ARJUN,
    consider: [
      "Which of the three is actually weakest?",
      "What would fixing it cost the other two?",
      "Is the review right, or just cautious?",
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
        say: "You're right to push. Give me the week and it comes back with names, dates and a testing plan.",
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
              "Nobody wins a pitch on a testing plan. But the reviewers stopped objecting, and Aisha's team can now see how the work is meant to happen.",
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
          "Then argue with me about the pitch, because that is where the week goes. Sarah's board decides this.",
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
              "It reads better, and the proposal underneath hasn't changed. It was reasonably solid to begin with, so that's a defensible use of a week.",
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
              "You put spare money back into the price, so one bad month won't sink us — the most useful thing you can do for a project that hasn't started. It also means offering less than the rival firm.",
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
              "The reviewers were being careful, which is their job. But Marcus's operations team was already inside the proposal and the price had room in it, so there was nothing to fix and a week to save.",
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
              principle: "Reviewers with nothing to sell us are the best early warning on delivery we'll ever get.",
              because:
                "The deal team wanted to win it and the reviewers did not care whether you did. That is precisely what made them worth listening to.",
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
    advisorLine: "Foyle is not the obstacle. He has a number to hit and nobody has helped him hit it.",
    advisor: RIYA_DEAL,
    consider: [
      "What is he actually comparing us against?",
      "Whose numbers is our case built from?",
      "Who loses if he picks us?",
    ],
    tip: "I have lost two of these to firms with a worse answer and a better-scored submission.",
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
            changed: ["Not selected", "A quarter's pursuit cost written off"],
            effect: { dims: { win: -30, profit: -8 }, flags: ["lost"] },
            next: "end",
            lesson: {
              principle: "A saving only persuades when the whole proposal is built on the client’s numbers, not added at the end.",
              because:
                "You had their numbers but never built the proposal on them, so the payback read as a late claim.",
              watchFor: "Before promising a payback, ask whose number the baseline is.",
            },
          },
          {
            id: "m9a-value-strong",
            when: { any: ["evidenced", "knows:real_pain"] },
            tone: "strong",
            headline: "Ours was the only bid with a saving attached.",
            detail:
              "From Orion's own complaint data: half a million contacts a year at about five pounds each, so two and a half million pounds a year. Halve that and Orion keeps one and a quarter million a year against our £600,000 premium, which pays back inside six months. You wrote Foyle's justification for him.",
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
              "Foyle sent the weightings, and they were unkind: forty percent on proven delivery of comparable systems. You can't manufacture that in a week, and the firm that could was already ahead.",
            changed: ["Not selected", "You know precisely why"],
            effect: { dims: { win: -28, profit: -4 }, flags: ["lost", "knows:criteria"] },
            next: "end",
            lesson: {
              principle: "The scoring criteria decide the award whether we ask for them or not, so I ask in week one.",
              because:
                "Asking in the last week told you what asking in the first week would have changed. Nothing about the weightings was secret; you simply bid against an imagined test.",
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
        /* Aisha can only answer Foyle's questions about how the changes reach production
           if somebody has planned it: her own integration workstream, Marcus's people
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
              principle: "Honesty in the room only wins when the homework behind it is done, and this time it wasn't.",
              because:
                "Aisha could only describe the position you had actually built. Putting your most truthful person in front of the client is a strength when there is something to be truthful about, and an admission when there is not.",
              watchFor: "Before bringing delivery in, ask what they will have to admit.",
            },
          },
          {
            id: "m9a-deliverer-good",
            when: { any: ["ops_onside", "has:ops_workstream"] },
            tone: "strong",
            headline: "Aisha named the three teams, and Foyle relaxed.",
            detail:
              "Aisha walked through how the changes reach production, who signs them off, and what she'd already agreed with Marcus. Foyle stopped asking about risk; it was the shortest scoring session of the three.",
            changed: ["Selected", "Delivery credibility before signature"],
            effect: { dims: { win: 6, deliver: 4 }, flags: ["won"], badge: "held_nerve" },
          },
          {
            id: "m9a-deliverer-plain",
            tone: "mixed",
            headline: "Foyle believed Aisha, but price still counted against us.",
            detail:
              "She was straight about what's agreed and what isn't, and Foyle believed her — worth more than it looks. He still scored the cheaper bid higher on price.",
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
              "With nothing to separate the bids on substance, Foyle separated them on price — that's what a scorecard does when every column is level. We were told on a Thursday, by email.",
            changed: ["Not selected", "Nothing said why it must be you"],
            effect: { dims: { win: -32, profit: -6 }, flags: ["lost"] },
            next: "end",
            lesson: {
              principle: "Price decides whenever we give the scorecard nothing else to work with.",
              because:
                "Every week of this pursuit was a chance to build a reason to be preferred, and the submission records how many of them you took. Respecting the process is not a substitute for giving it something to score.",
              watchFor: "Ask what is in the proposal that a competitor could not write.",
            },
          },
          {
            id: "m9a-submit-good",
            when: { all: ["evidenced", "ops_onside"] },
            tone: "strong",
            headline: "The proposal won without us in the room.",
            detail:
              "The proposal argues from their data and names the people who have to change, so it persuades without us there. That's the test of a document, and ours passed.",
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
              "Foyle scored the bids close to level and Sarah's recommendation carried it. We have the work and we've learned nothing about why, which is a poor place to start next time.",
            changed: ["Selected", "Won on Sarah's preference, not the scorecard"],
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
    advisorLine: "I have signed things I should not have. Nobody ever remembers the deals you declined.",
    advisor: RIYA_DEAL,
    consider: [
      "Would we staff this ourselves?",
      "What has the deal become since we started?",
      "Is saying no still available?",
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
              "You're taking on work you understand, with the people who must deliver it already involved. That's a better position than most teams have on the day they sign.",
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
              "Reopening an agreed deal only works if the client believes you're doing it for the programme, not the margin. Sarah didn't argue, and both clauses moved.",
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
              "This deal had grown into a shape nobody would have chosen on purpose. Saying so cost a quarter and saved a year, and Sarah didn't argue with a word of it.",
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
              principle: "Walking away from a deal that isn't worth having is a decision, and I want it recorded as one.",
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
            headline: "You turned down a deal that was sound.",
            detail:
              "Caution isn't judgement. Nothing in this engagement had established the kind of risk that justifies refusing, so you walked without a specific commitment you couldn't carry.",
            changed: [
              "No contract",
              "A quarter's pursuit cost written off",
              "Orion will be slower to call",
            ],
            effect: { dims: { win: -22, profit: -6, deliver: 5 }, flags: ["walked_away"] },
            lesson: {
              principle: "Walking away is discipline only when we can name the exposure we're refusing; otherwise it's nerves.",
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
      "On top of the slip, two of our best are moving to a bigger account, and their replacements can't start for six weeks.",
      "We must decide who fills those two seats now, because they'll be doing the work we promised.",
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
        text: "Training's in the plan and Operations knows us. Neither tells me who sits in those two seats on Monday.",
      },
      { text: "I can staff this with the people who exist, or the people in the plan. Not both." },
    ],
    advisor: AISHA,
    consider: [
      "Who actually has to be senior here?",
      "What happens to the rest of the firm?",
      "Does the client need to know?",
    ],
    tip: "Every way of filling those seats costs us money, time or the date. Which one can you spare?",
    prompt: "Somebody is going to be disappointed.",
    question: "Who fills the two seats?",
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
              "Putting graduates on a programme with training built in, or an engaged client team, is a development opportunity; without either, it's a risk. You had at least one.",
            changed: ["Fully staffed", "Your time goes on reviewing"],
            effect: { dims: { deliver: 3, profit: 6, win: -1 } },
          },
          {
            id: "m10b-juniors-thin",
            tone: "mixed",
            headline: "Staffed, slower, and leaning on you.",
            detail:
              "The work gets done, with the rework you'd expect. Every review runs through you, so the programme now has a single point of failure: your calendar.",
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
            headline: "You can't fund the obvious answer. Again.",
            detail:
              "Contractors at twice the rate need a contract with room in it, and ours has none. So it's one contractor instead of two, and the plan quietly absorbs the difference.",
            changed: ["Half-staffed", "The contract is close to loss-making"],
            effect: { dims: { profit: -11, deliver: 1 } },
          },
          {
            id: "m10b-contractors",
            tone: "mixed",
            headline: "Staffed properly, and it shows in the numbers.",
            detail:
              "We have the people we need from next week, at a cost the commercial case never planned for. And in nine months, nothing they learned will still be in the building.",
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
            headline: "Orion moved the date, because you asked early.",
            detail:
              "Six weeks is a manageable conversation the day you know, and an impossible one the week it bites. You raised it straight away, with the standing to be believed, so the plan moved and nothing else did.",
            changed: ["The right team", "Date moved with Orion's agreement"],
            effect: { dims: { deliver: 6, profit: 3, win: -3 }, badge: "recovered" },
          },
          {
            id: "m10b-slip-cold",
            when: { any: ["promised:fast", "overrode_review"] },
            tone: "hard",
            headline: "That date was the reason they picked you.",
            detail:
              "Speed was the most attractive thing in your proposal, and now we're asking for six more weeks. Sarah has to go back to a board that approved this on the timeline.",
            changed: ["The right team eventually", "The thing you sold on is gone"],
            effect: { dims: { win: -12, deliver: 4 } },
          },
          {
            id: "m10b-slip",
            tone: "mixed",
            headline: "Accepted, and noted.",
            detail:
              "The date moved without much drama. But it's now on record, halfway through, that the plan was written for a team we didn't have.",
            changed: ["The right team", "Six weeks later than planned"],
            effect: { dims: { deliver: 3, win: -6 } },
          },
        ],
      },
    ],
    lesson: {
      principle: "A plan is a promise about people, so I want names against it, not headcount.",
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
   *
   * WHEN IT HAPPENS (CNT-01). Not at the start of delivery: m10 and m10b have already put
   * the team five months in. It is the month-six re-plan, where Aisha takes the second half
   * off the pursuit lead's hands for good and first asks which of the promises still stand.
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
    objective: "Answer for the promises in your own proposal.",
    minutes: 4,
    hero: "solution-workshop",
    situation: [
      "Month six starts on Monday and I'm re-planning the second half — after this, your promises are mine to keep. I've highlighted the lines I still can't plan around.",
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
          "Month six starts on Monday and I'm re-planning the second half, so your promises become mine.",
          "We still promise the platform rebuild, and five months in nobody in Operations has agreed to take it.",
        ],
      },
      {
        when: { all: ["promised:fast"], none: ["has:data"] },
        situation: [
          "Month six starts on Monday and I'm re-planning the second half, so your promises become mine.",
          "Two lines are highlighted: the eight-week pilot, and the claim the order data was available — it still isn't.",
        ],
      },
      {
        when: { all: ["outcome_based"] },
        situation: [
          "Month six starts on Monday and I'm re-planning the second half, so your promises become mine.",
          "The contract ties a third of our fee to the support-contact figure, and I'd like to know who chose it.",
        ],
      },
      {
        when: { all: ["ops_onside", "evidenced"] },
        situation: [
          "Month six starts on Monday and I'm re-planning the second half, so your promises become mine.",
          "Almost nothing is highlighted, and my question is narrower than I expected: which lines are fixed, and which may I re-plan?",
        ],
      },
    ],
    advisorLine: [
      {
        when: { any: ["unanchored", "risk_accepted", "fragile_timeline"] },
        text: "Three lines in here still have no owner. I'm not starting month six pretending otherwise.",
      },
      {
        when: { all: ["ops_onside", "evidenced"] },
        text: "Most of this I can plan to. I'd still rather hear it from you than assume it.",
      },
      { text: "Tell me which of your promises you actually meant, and I'll plan the second half around the answer." },
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
            headline: "She takes the date, because somebody had checked it.",
            detail:
              "The date rests on something real — the data audit, or Operations already inside the programme. I don't have to take your word for it; I can see what it depends on, so I'll plan the second half to it and stop asking.",
            changed: [
              "The date is now a plan",
              "The firm is committed to resourcing it",
            ],
            effect: { dims: { win: 5, deliver: 2, profit: -4 }, badge: "connected_dots" },
            lesson: {
              principle: "I can plan to a date somebody checked, but not to one somebody hoped for.",
              because:
                "The eight weeks held because months earlier you funded the dull thing that made it true — the audit, or the Operations stream. Standing behind it therefore cost you money and nothing else.",
              watchFor: "Before repeating a date out loud, ask what it is resting on.",
            },
          },
          {
            id: "m10h-date-hollow",
            tone: "hard",
            headline: "She writes the date down, then what it costs.",
            detail:
              "Nothing under the eight weeks has changed since you wrote it, so the only variable left is how hard my team works. My plan now has my two most experienced people working weekends until the pilot ships, and nobody who has to hit that date was there when it was agreed.",
            changed: [
              "The date survives",
              "The plan depends on weekend working",
              "Aisha has your answer in writing",
            ],
            effect: { dims: { win: 3, deliver: -10, profit: -2 } },
            lesson: {
              principle: "Confirming a promise you haven't checked is free for you and expensive for whoever keeps it.",
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
            headline: "The conditions go in, and nobody calls them an excuse.",
            detail:
              "You've been accurate with Orion all along, so a list of dependencies reads as a delivery plan, not a firm reaching for the exit. Sarah signed them off inside a week, and now I know what has to be true — and I can move the date if it isn't.",
            changed: [
              "The promise carries written conditions",
              "Sarah has seen a new caveat",
              "Aisha can re-plan without negotiating",
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
              "You're right that the rebuild depends on things nobody agreed to. But you've raised it five months after signing, to a client with little reason to give us the benefit of the doubt — so the conditions went in, along with a fortnightly review we didn't ask for.",
            changed: [
              "The conditions are written down",
              "Orion now checks the programme closely",
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
            headline: "You protected the first thing anybody cuts.",
            detail:
              "Training and integration are always what goes when a programme needs to find a fortnight, because nobody outside delivery notices they've gone. You've said in advance that they don't move, so when someone asks me to find that fortnight, I have your answer ready.",
            changed: [
              "Adoption and integration work ring-fenced",
              "Their cost stays on our side",
            ],
            effect: { dims: { deliver: 7, profit: -6, win: 1 }, badge: "connected_dots" },
            lesson: {
              principle: "The lines nobody outside delivery would miss are the first to go, unless someone protects them out loud.",
              because:
                "You bought those lines months ago and have now said they are not available as savings. That is worth nothing in a pitch and it is the reason month nine will be quiet.",
              watchFor: "Notice which parts of a plan nobody outside your own team would miss. Those are the ones that vanish.",
            },
          },
          {
            id: "m10h-dull-thin",
            tone: "mixed",
            headline: "You protected measurement, and there was little else to protect.",
            detail:
              "The measurement work stays, so someone will be able to prove whether this worked. But it's the only unglamorous line we have — adoption and integration were never bought — so there's little scaffolding under the promise you're standing behind.",
            changed: [
              "Measurement work ring-fenced",
              "Less underneath than Aisha hoped",
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
              "That figure rested on a baseline you'd actually audited, which is exactly why Sarah could put it in front of her board. Withdrawing it now doesn't read as prudence; it reads as a firm losing confidence in its own commitment.",
            changed: [
              "The fee no longer moves with results",
              "Sarah must go back to her board",
              "The bid's one distinctive feature is gone",
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
            headline: "Sarah isn't pleased. Aisha is relieved.",
            detail:
              "Nobody ever agreed what a support contact was, or counted them before we started, so the better part of a million pounds turned on halving a number nobody wrote down. Taking it out cost you a hard half hour with Sarah; leaving it in would have cost me the whole of month nine.",
            changed: [
              "The fee no longer rides on guesswork",
              "Sarah is cooler, and clear why",
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
              "I went through it line by line and found a proposal that promises what the programme is resourced to do: nothing oversold, nothing cut to hit a price, no review finding left unfunded. Saying every sentence stands took four minutes, because it's true.",
            changed: [
              "The whole document stands, and holds",
              "Aisha plans from it, not around it",
            ],
            effect: { dims: { win: 4, deliver: 3, profit: 2 }, badge: "held_nerve" },
            lesson: {
              principle: "The short version of this meeting is earned months earlier, in the scoping and the pricing.",
              because:
                "Nothing had to be qualified because nothing had been oversold. That was settled in the scoping and the pricing, not by anything you said to Aisha this morning.",
              watchFor: "Whether this conversation is short is decided months before anybody has it.",
            },
          },
          {
            id: "m10h-all-loaded",
            tone: "hard",
            headline: "You confirmed all of it, unread parts included.",
            detail:
              "I asked which sentences you meant and you said all of them — the one answer that gives me nothing to work with. So I plan to the whole document, and every call about which promises were real is mine to make alone, in the week we're two people short.",
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
      principle: "Every sentence we write to win is one somebody has to deliver, so say which ones you meant.",
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
    objective: "Respond to something outside the plan.",
    minutes: 3,
    hero: "solution-in-store-tech",
    situation: [
      "Sarah finishes in three weeks, and she was our sponsor, budget holder and advocate in one.",
      "Whoever replaces her, we'll have to win this programme all over again.",
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
          "Sarah finishes in three weeks, and she was our sponsor, budget holder and advocate in one.",
          "And the two who held the date in month five just asked to roll off — sponsor and memory, gone together.",
        ],
      },
      {
        when: { all: ["undisclosed"] },
        situation: [
          "Sarah finishes in three weeks, and she was our sponsor, budget holder and advocate in one.",
          "Her successor will read the original proposal, not what shipped, and nobody has written down why they differ.",
        ],
      },
      {
        when: { all: ["changed_scope"] },
        situation: [
          "Sarah finishes in three weeks, and she was our sponsor, budget holder and advocate in one.",
          "One thing helps: the change you priced in month five is signed and dated — a boundary, not an argument.",
        ],
      },
      {
        when: { all: ["ops_onside"] },
        situation: [
          "Sarah finishes in three weeks, and she was our sponsor, budget holder and advocate in one.",
          "One thing helps: Marcus Reed's team is already inside this programme, and Marcus isn't going anywhere.",
        ],
      },
      {
        when: { all: ["outcome_based"] },
        situation: [
          "Sarah finishes in three weeks.",
          "She agreed that a third of our fee depends on support contacts falling, and her successor inherits that clause without ever having agreed to it.",
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
    advisorLine: "I have had two sponsors leave mid-programme. Both times, the last three weeks decided what survived.",
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
            headline: "Marcus becomes the sponsor, and he isn't leaving.",
            detail:
              "The person best placed to own this was the one you brought into the proposal months ago. What was a courtesy then is now why the programme survives a change of leadership.",
            changed: [
              "Ownership spread across three people",
              "Operations sponsors the work it runs",
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
            headline: "You found two names. Neither is invested.",
            detail:
              "Three weeks of introductions produced two people who won't block the programme — not two who'll defend it. And you started those relationships from nothing, at the worst possible moment.",
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
            headline: "Something real went live, and it outlives her.",
            detail:
              "You had the foundations to move fast, so three weeks was enough to put a working thing in front of the business. A new sponsor can cancel a plan easily; cancelling something that already works is a much harder meeting.",
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
            headline: "You shipped a demo, and it convinced nobody.",
            detail:
              "Three weeks wasn't enough to stand anything up properly, so Sarah saw a prototype with the hard parts stubbed out. Her successor read it as a programme with nothing to show after six months.",
            changed: ["Something shipped", "It made the programme look weaker"],
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
              "The programme was argued from Orion's own evidence from the start, so the handover is a page of their data and what's changed since. A new sponsor reading that cold has very little to disagree with.",
            changed: ["A case that survives on paper", "No advocate, but no argument either"],
            effect: { dims: { win: 4, deliver: 2, profit: 2 } },
          },
          {
            id: "m10c-handover-thin",
            tone: "mixed",
            headline: "A good document, waiting for a reader who cares.",
            detail:
              "It's honest, clear and almost free. It also depends entirely on someone new choosing to back a programme they didn't start, on the strength of a handover note.",
            changed: ["The case is written down", "Nobody is carrying it"],
            effect: { dims: { win: -2, profit: 3 } },
          },
        ],
      },
    ],
    lesson: {
      principle: "We keep a client by being backed by more than one person, because sponsors leave and programmes don't.",
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
