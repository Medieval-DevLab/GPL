import type { CharacterId } from "./characters";
import type { DimensionId } from "../engine/types";
import { CHAPTER_SCENES, type BackdropAsset, type ChapterNumber, type SceneAsset } from "./assets";
import { SPINE } from "./story";

export type ScreenFamily = "setup" | "arrival" | "comparison" | "investigation" | "allocation" | "chat" | "meeting" | "evidence" | "event" | "reflection" | "debrief" | "ending";

export interface ChapterPresentation {
  chapter: ChapterNumber;
  title: string;
  goal: string;
  scene: SceneAsset;
  advisor: CharacterId;
  route: readonly string[];
  activities: readonly string[];
}

/**
 * Canonical authored route: four acts, two decisions each (D-086). Future milestones are
 * previews, never navigation shortcuts. Each act's guide is the colleague who leads its first,
 * modelled decision.
 */
export const CHAPTER_PRESENTATION: readonly ChapterPresentation[] = [
  { chapter: 1, title: "Understand before you offer", goal: "Find out what is really wrong at Orion, then open the first meeting with it.", scene: CHAPTER_SCENES[1], advisor: "priya", route: ["int-1", "d1", "d2", "guess-1", "deb-1"], activities: ["Choose who to talk to and what to read", "Open the first meeting with Sarah"] },
  { chapter: 2, title: "Not every deal is worth winning", goal: "Decide how much of the team Orion is worth, and which deal we chase.", scene: CHAPTER_SCENES[2], advisor: "riya", route: ["int-2", "d3", "d4", "guess-2", "deb-2"], activities: ["Choose how many people go, and whether we study", "Answer a rival’s demo"] },
  { chapter: 3, title: "Trade, don’t give", goal: "Write the offer once, then answer Orion’s buyer when he pushes on price.", scene: CHAPTER_SCENES[3], advisor: "arjun", route: ["int-3", "d5", "d6", "guess-3", "deb-3"], activities: ["Build the offer, clause by clause", "Answer on price, and ask for something back"] },
  { chapter: 4, title: "Promise only what your team can deliver", goal: "Sign or walk away, then keep every promise as it comes due in month five.", scene: CHAPTER_SCENES[4], advisor: "aisha", route: ["int-4", "d7", "d8", "calendar", "guess-4", "deb-4", "end"], activities: ["Change one clause, then sign or walk", "Decide what to do when month five slips"] },
];

export interface NodePresentation {
  screen: ScreenFamily;
  chapter: ChapterNumber;
  scene: SceneAsset;
  /** Advisor is always a colleague. Resolve conditional client speakers from story separately. */
  advisor: CharacterId;
  goal: string;
}

function node(chapter: ChapterNumber, screen: ScreenFamily, goal: string, advisor?: CharacterId): NodePresentation {
  return { chapter, screen, goal, scene: CHAPTER_SCENES[chapter], advisor: advisor ?? CHAPTER_PRESENTATION[chapter - 1].advisor };
}

/** Entry objectives describe the task without forecasting which choice succeeds. */
export const NODE_PRESENTATION: Readonly<Record<string, NodePresentation>> = {
  setup: node(1, "setup", "Choose the starting strength of the team you will lead."),
  "int-1": node(1, "arrival", "Understand your role and what this act asks."),
  d1: node(1, "investigation", "Choose who to talk to and what to read in week one."),
  d2: node(1, "meeting", "Choose how to open the first meeting with what you know."),
  "guess-1": node(1, "reflection", "Guess which choice decided how Sarah left."),
  "deb-1": node(1, "debrief", "See what decided how Sarah left the first meeting."),
  "int-2": node(2, "arrival", "Decide what the deal is worth to us before we chase it."),
  d3: node(2, "allocation", "Choose how much of the team Orion gets, and whether we study first."),
  d4: node(2, "meeting", "Answer a rival’s demo with an approach you can support."),
  "guess-2": node(2, "reflection", "Guess which choice settled what the bid is about."),
  "deb-2": node(2, "debrief", "See what settled which deal we are chasing."),
  "int-3": node(3, "arrival", "Write the offer once, then defend it on price.", "riya"),
  d5: node(3, "allocation", "Choose what the offer fixes, how fast, and how Orion pays."),
  d6: node(3, "meeting", "Answer Orion’s buyer on price, and choose what we ask back.", "riya"),
  "guess-3": node(3, "reflection", "Guess which choice decided how Declan chose."),
  "deb-3": node(3, "debrief", "See what we gave, and what we got back."),
  "int-4": node(4, "arrival", "Take responsibility for every promise in the offer."),
  d7: node(4, "evidence", "Change one clause, then sign or walk away."),
  d8: node(4, "chat", "Choose what to tell Sarah and who covers the gap in month five."),
  calendar: node(4, "event", "See how every promise came due."),
  "guess-4": node(4, "reflection", "Guess which earlier choice shaped month five most."),
  "deb-4": node(4, "debrief", "Trace each promise back to the choice that made it."),
  end: node(4, "ending", "Review your engagement and take one idea into your next project."),
};

/**
 * The story's spine. Every screen hangs off one question, and the one sentence the game
 * wants carried out of the room is `spine`, word for word on the title, at every act break
 * and at the end (`docs/STRATEGY.md` §2.1).
 *
 * `ask` is the client's own words. It deliberately does not reveal the real need behind it
 * (that is earned in week one), so stating it up front gives the line of thought without
 * answering any decision.
 */
export const STORY = {
  client: "Orion Retail",
  ask: "You lead a six-person team at a consultancy, a firm that companies pay to fix their problems. Orion Retail, a chain of 210 shops, wants help to “improve the customer experience”, and nobody there agrees what that means.",
  question: "Can you win Orion’s work, make it worth winning, and still deliver what you promised?",
  /** What is at stake, said once beside the ask. Since D-086 it is the spine itself. */
  stakes: SPINE,
  spine: SPINE,
} as const;

export interface Rule { id: DimensionId; question: string; name: string; plain: string }
/** The three questions, in the order a pursuit meets them. Names match `COPY.dimensions`. */
export const RULES: readonly Rule[] = [
  { id: "win", question: "Can we win it?", name: "Win it", plain: "Who you know, what you know, and why they would choose you." },
  { id: "profit", question: "Is it worth winning?", name: "Make it worth it", plain: "What it costs you, and what you give away to get it." },
  { id: "deliver", question: "Can we deliver it?", name: "Deliver it", plain: "Whether the people, data and plan behind each promise exist." },
];
export const ruleOf = (id: DimensionId): Rule => RULES.find((r) => r.id === id)!;

/**
 * Which of the three questions each decision is really about. Act 1 is the Win question,
 * act 2 the Worth question, act 3 Worth against Win — the offer is a matter of cost, the
 * price push of who chooses us — and act 4 the Deliver question.
 */
export const MISSION_RULE: Readonly<Record<string, DimensionId>> = {
  d1: "win", d2: "win",
  d3: "profit", d4: "profit",
  d5: "profit", d6: "win",
  d7: "deliver", d8: "deliver",
};

/**
 * Every position the record board can show, filed under one question. Keyed by label, the
 * ledger's identity; `presentation.test.ts` fails if a position is added without a home here.
 */
export const LEDGER_RULE: Readonly<Record<string, DimensionId>> = {
  "You got in on trust": "win", "You got in on results": "win", "You got in on the argument": "win",
  "What’s really wrong": "win", "The complaint figures": "win", "Who scores the bids": "win",
  "Who else is bidding": "win", "Sarah trusts us": "win", "Sarah has doubts": "win",
  "Declan has met us": "win", "The bid: after the sale": "win", "The bid: the shops": "win",
  "Orion chose us": "win", "Declan didn’t want us": "win", "Sarah heard it from us": "win",
  "Sarah wasn’t told": "win", "A promise broken": "win",
  "What Orion will spend": "profit", "Four people on the bid": "profit", "£300,000 off our price": "profit",
  "£600,000 off our price": "profit", "A second year, signed": "profit", "The price won’t change": "profit",
  "A third of our fee on results": "profit", "£20,000 a week if we’re late": "profit",
  "Two contractors, at our cost": "profit", "Orion pays for extra weeks": "profit",
  "Who runs deliveries": "deliver", "We’ve seen inside Orion": "deliver", "Marcus has met us": "deliver",
  "Marcus’s manager on our team": "deliver", "The trial, traded away": "deliver", "100 shops, not 210": "deliver",
  "Screens and an app promised": "deliver", "A new app promised": "deliver", "Refunds in five days promised": "deliver",
  "A trial by week eight": "deliver", "Every date a month later": "deliver", "A signed contract": "deliver",
  "The team on weekends": "deliver",
};

/** One question per act, each a step towards `STORY.question`. Asks; never answers (G3b). */
export const ACT_QUESTION: Readonly<Record<ChapterNumber, string>> = {
  1: "What is really wrong at Orion, and how do we show Sarah we know it?",
  2: "How much of our team is Orion worth, and which deal do we chase?",
  3: "What do we promise, and what do we get back for every cut?",
  4: "Do we sign, and can our team keep every promise when it comes due?",
};

/**
 * What the act's guide says when the act opens, after the act's own opening lines. Spoken by a
 * named colleague, never by the interface (G9b). Act 1 is where a newcomer learns what the
 * game is measuring, so it is said by a person, once, in plain words. Nothing here forecasts
 * an outcome; the lines name what to watch, not what to pick.
 */
export const ACT_BRIEFING: Readonly<Record<ChapterNumber, readonly string[]>> = {
  1: [
    "Watch the three bars. Win is how likely the client is to choose us. Worth is whether the deal makes our firm money. Deliver is whether our people can really do what we promise.",
    "Each decision is two or three small levers. Every setting shows which bars it moves, and which way, before you commit.",
    "You will not be on your own. Riya runs our team and its money, Arjun designs what we sell, and Aisha runs the work once it is signed.",
  ],
  2: ["We have six people. Every week they spend chasing Orion is a week they are not on work that already pays."],
  3: ["Anything you write into the offer, Aisha’s team will have to do later."],
  4: ["Every promise in the contract now has a date on it and one of my people doing it."],
};

/**
 * Where each beat happens. A screen's place changes only when the story moves somewhere, so
 * a change of place is itself information. Photographs are framed as photographs, with the
 * place named beneath — never full-bleed behind text (readability audit, D-080).
 */
const PLACE = {
  office: { photo: "env-glass-office", name: "Your team’s office" },
  store: { photo: "scene-chapter-1", name: "One of Orion’s 210 stores" },
  projectRoom: { photo: "scene-chapter-2", name: "Your project room" },
  workshop: { photo: "scene-chapter-3", name: "The offer workshop" },
  orionRoom: { photo: "scene-chapter-4", name: "Orion’s meeting room" },
  headOffice: { photo: "env-boardroom", name: "Orion head office" },
  depot: { photo: "env-warehouse", name: "Orion’s distribution centre" },
  delivery: { photo: "scene-chapter-5", name: "The delivery team’s room" },
} as const satisfies Record<string, { photo: BackdropAsset; name: string }>;
type PlaceId = keyof typeof PLACE;

const SCENE_PLACE: Readonly<Record<string, PlaceId>> = {
  setup: "office",
  "int-1": "store", d1: "office", d2: "headOffice", "guess-1": "office", "deb-1": "store",
  "int-2": "projectRoom", d3: "projectRoom", d4: "office", "guess-2": "projectRoom", "deb-2": "projectRoom",
  "int-3": "workshop", d5: "workshop", d6: "orionRoom", "guess-3": "workshop", "deb-3": "workshop",
  "int-4": "delivery", d7: "orionRoom", d8: "depot", calendar: "delivery", "guess-4": "delivery", "deb-4": "delivery",
  end: "store",
};

export const placeOf = (nodeId: string) => PLACE[SCENE_PLACE[nodeId] ?? "office"];

/** Kept for the presentation contract: every node has a credited photograph. */
export const BACKDROP: Readonly<Record<string, BackdropAsset>> = Object.fromEntries(
  Object.entries(SCENE_PLACE).map(([id, place]) => [id, PLACE[place].photo]),
);

/** Chapter lighting names. The colour script itself lives in the stylesheet as tokens. */
export const CHAPTER_LIGHT: Readonly<Record<ChapterNumber, string>> = {
  1: "Daybreak", 2: "Glass", 3: "Studio", 4: "Floor",
};

/**
 * A story turn is a report of something that already happened elsewhere, so each is staged
 * as the artefact it would actually arrive as: trade press, a forwarded email, an internal
 * memo. The narration stays the content; the artefact is dressing and invents no facts the
 * story does not state.
 */
export type TurnDressing =
  | { format: "press"; masthead: string; section: string; kicker: string }
  | { format: "mail"; app: string; from: string; subject: string; preview: string; time: string }
  | { format: "memo"; organisation: string; label: string; subject: string; from: string };

export const TURN_DRESSING: Readonly<Record<string, TurnDressing>> = {
  calendar: { format: "memo", organisation: "Northgate", label: "Delivery calendar", subject: "Month five: every promise comes due", from: "Aisha Khan" },
};

export function presentationForNode(nodeId: string): NodePresentation | undefined {
  return NODE_PRESENTATION[nodeId];
}

export function chapterPresentation(chapter: number): ChapterPresentation | undefined {
  return CHAPTER_PRESENTATION.find((item) => item.chapter === chapter);
}

/**
 * The trail (D-083). Every decision and every turn is a named stop on the journey map, in the
 * player's words: a verb and a thing, short enough to sit under a dot. The map, the top bar and
 * the "next stop" card all read these, so a stop is called the same thing everywhere.
 */
export const MILESTONE: Readonly<Record<string, string>> = {
  setup: "Your team’s strength",
  d1: "Find what is really wrong",
  d2: "The first meeting",
  d3: "How much do we bet?",
  d4: "The rival’s demo",
  d5: "Build the offer",
  d6: "The price push",
  d7: "Sign or walk",
  d8: "Month five",
  calendar: "Every promise comes due",
};

/**
 * Side-by-side facts for a choice that is a comparison (D-083). The eight-decision story has
 * no decision between named alternatives of the same kind — every lever setting carries its
 * own detail line — so there is nothing to lay out in rows. Kept as a capability.
 */
export const COMPARE: Readonly<Record<string, readonly { label: string; values: Readonly<Record<string, string>> }[]>> = {};

/**
 * The question under the whole story (D-083). Orion's brief is one vague line; what is really
 * wrong (customers angry about what happens after they buy) is there to be found in week one,
 * and finding it is what makes the later choices make sense. The map keeps it open as a case
 * file until the player knows.
 */
export const MYSTERY = {
  question: "What is really wrong at Orion?",
  unknown: "Nobody knows yet. Orion’s brief says “improve the customer experience”. That could mean the shops, the app, or something nobody has looked at.",
  solved: "Customers are not unhappy with the shops. They are angry about what happens after they buy: late deliveries, slow refunds and a helpline that cannot see the order.",
  clues: ["knows:after_sale"],
} as const;
