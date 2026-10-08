import type { CharacterId } from "./characters";
import type { DimensionId } from "../engine/types";
import { CHAPTER_SCENES, type BackdropAsset, type ChapterNumber, type SceneAsset } from "./assets";

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

/** Canonical authored route. Future milestones are previews, never navigation shortcuts. */
export const CHAPTER_PRESENTATION: readonly ChapterPresentation[] = [
  { chapter: 1, title: "Find the right client", goal: "Pick one company to chase, find out what it needs, and get a first meeting.", scene: "scene-chapter-1", advisor: "priya", route: ["int-1", "m1", "m2", "m3", "deb-1"], activities: ["Pick a client", "Find out two things", "Ask for a first meeting"] },
  { chapter: 2, title: "Make it an opportunity", goal: "Decide whether Orion is worth chasing, and how many of your people to put on it.", scene: "scene-chapter-2", advisor: "riya", route: ["int-2", "m4", "turn-rival", "m5", "refl-rival", "m5b", "deb-2"], activities: ["Decide how hard to chase", "Answer a rival firm", "Choose where your people go"] },
  { chapter: 3, title: "Build the response", goal: "Write the proposal: what you will do for Orion, how, and what you promise.", scene: "scene-chapter-3", advisor: "arjun", route: ["int-3", "m6", "m6b", "refl-shape", "m7", "m7b", "deb-3"], activities: ["Name Orion’s real problem", "Choose how the work gets done", "Write and check the proposal"] },
  { chapter: 4, title: "Make the deal work", goal: "Agree a price and terms, find out if Orion chooses you, and decide whether to sign.", scene: "scene-chapter-4", advisor: "riya", route: ["int-4", "m8", "m9", "m9a", "turn-award", "refl-award", "m9b", "deb-4"], activities: ["Agree the price and what is included", "Make the case to Orion’s buyer", "Decide whether to sign"] },
  { chapter: 5, title: "Deliver the promise", goal: "Do the work you signed up for, as each promise comes due.", scene: "scene-chapter-5", advisor: "aisha", route: ["int-5", "m10", "refl-month5", "m10b", "m10h", "turn-sarah", "m10c", "deb-5", "end"], activities: ["Deal with trouble on the project", "Fill a gap in the team", "Keep the work going when people leave"] },
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
  "int-1": node(1, "arrival", "Understand your role and the three decisions ahead."),
  m1: node(1, "comparison", "Choose one organisation for your team's initial attention."),
  m2: node(1, "investigation", "Choose two questions to investigate before making an approach."),
  m3: node(1, "chat", "Choose how to open the client conversation using what you know."),
  "deb-1": node(1, "debrief", "Review how your focus and research shaped the first conversation."),
  "int-2": node(2, "arrival", "Move from an interested client to a qualified opportunity."),
  m4: node(2, "comparison", "Decide how far to commit before the brief is fully understood."),
  "turn-rival": node(2, "event", "Read the announcement before deciding how to respond."),
  m5: node(2, "meeting", "Respond to the rival's move with an approach you can support."),
  "refl-rival": node(2, "reflection", "Consider what competitive pressure changed in your reasoning."),
  m5b: node(2, "allocation", "Allocate your team to two discovery workstreams."),
  "deb-2": node(2, "debrief", "Review what you chose to learn and what remains uncertain."),
  "int-3": node(3, "arrival", "Translate the opportunity into a practical response."),
  m6: node(3, "meeting", "Frame the problem your proposal will address."),
  m6b: node(3, "comparison", "Choose an approach to delivering the solution."),
  "refl-shape": node(3, "reflection", "Consider the assumptions behind the approach you chose."),
  m7: node(3, "allocation", "Select three components for the proposal your team will deliver."),
  m7b: node(3, "chat", "Respond to the internal review of your proposal."),
  "deb-3": node(3, "debrief", "Read back what the proposal now commits your team to."),
  "int-4": node(4, "arrival", "Turn the proposal into terms both sides can work with."),
  m8: node(4, "meeting", "Respond to the price challenge and define the terms of your offer."),
  m9: node(4, "chat", "Decide how to handle the risk identified before signature.", "aisha"),
  m9a: node(4, "evidence", "Build the procurement case from evidence you have earned."),
  "turn-award": node(4, "event", "Read the panel's decision and what it asks of your team."),
  "refl-award": node(4, "reflection", "Consider what winning the work means for the promises you made."),
  m9b: node(4, "chat", "Decide whether to accept, modify or walk away from the deal."),
  "deb-4": node(4, "debrief", "Review the commercial terms and commitments going into delivery."),
  "int-5": node(5, "arrival", "Take responsibility for delivering the commitments already made."),
  m10: node(5, "chat", "Choose how to respond to the delivery situation in month five."),
  "refl-month5": node(5, "reflection", "Connect the current delivery pressure to earlier commitments."),
  m10b: node(5, "comparison", "Choose how to cover the staffing gap and its practical cost."),
  m10h: node(5, "evidence", "Use your actual commitment record to answer the handover challenge."),
  "turn-sarah": node(5, "event", "Read the sponsor's update before planning the next step."),
  m10c: node(5, "meeting", "Choose how to protect continuity through the sponsor transition."),
  "deb-5": node(5, "debrief", "Trace the choices that shaped the final delivery position."),
  end: node(5, "ending", "Review your engagement outcome and take one lesson into your next project."),
};

/**
 * The story's spine. Every screen hangs off one question, and every decision is filed under
 * one of the three questions the game already measures. Before this, a run carried 53
 * different lesson sentences and 50 record labels, and a player could recall none of it
 * (D-080). Three questions can be carried out of the room.
 *
 * `ask` is the client's own words. It deliberately does not reveal the real need behind it
 * (that is earned in chapters 1 and 3), so stating it up front gives the line of thought
 * without answering any decision.
 */
export const STORY = {
  client: "Orion Retail",
  ask: "You lead a six-person team at a consultancy, a firm that companies pay to fix their problems. Orion Retail, a chain of 210 shops, wants help to “improve the customer experience”, and nobody there agrees what that means.",
  question: "Can you win Orion’s work, make it worth winning, and still deliver what you promised?",
  stakes: "Every promise you make to win the work, your own colleagues will have to keep.",
} as const;

export interface Rule { id: DimensionId; question: string; name: string; plain: string }
/** The three questions, in the order a pursuit meets them. Names match `COPY.dimensions`. */
export const RULES: readonly Rule[] = [
  { id: "win", question: "Can we win it?", name: "Win it", plain: "Who you know, what you know, and why they would choose you." },
  { id: "profit", question: "Is it worth winning?", name: "Make it worth it", plain: "What it costs you, and what you give away to get it." },
  { id: "deliver", question: "Can we deliver it?", name: "Deliver it", plain: "Whether the people, data and plan behind each promise exist." },
];
export const ruleOf = (id: DimensionId): Rule => RULES.find((r) => r.id === id)!;

/** Which of the three questions each decision is really about. Its lesson is filed under it. */
export const MISSION_RULE: Readonly<Record<string, DimensionId>> = {
  m1: "win", m2: "win", m3: "win",
  m4: "profit", m5: "win", m5b: "profit",
  m6: "deliver", m6b: "profit", m7: "deliver", m7b: "deliver",
  m8: "profit", m9: "deliver", m9a: "win", m9b: "profit",
  m10: "deliver", m10b: "deliver", m10h: "deliver", m10c: "win",
};

/**
 * Every position the engine's ledger can report, filed under one question. The ledger is the
 * player's record in plain language; this is what turns it into a board of three columns.
 * Keyed by label because the label is the ledger's identity; `presentation.test.ts` fails if a
 * ledger rule is added without a home here.
 */
export const LEDGER_RULE: Readonly<Record<string, DimensionId>> = {
  "You got in on trust": "win", "You got in on evidence": "win", "You got in on the argument": "win",
  "They chose you": "win", "How you were scored": "win", "Their real problem": "win",
  "The rival's blind spot": "win", "Argued from their data": "win", "They take your word": "win",
  "You chose the ground": "win", "Inside the business": "win", "Their brief, as written": "win",
  "Discount given": "profit", "Scope removed": "profit", "A partner who does this": "profit",
  "A payback number, in writing": "profit", "A narrow first job": "profit",
  "Who can stop this": "deliver", "The last attempt": "deliver", "Operations is in the room": "deliver",
  "Operations invested": "deliver", "The review is answered": "deliver", "You overruled the review": "deliver",
  "Risk accepted": "deliver", "Mitigation underfunded": "deliver", "Platform rebuild promised": "deliver",
  "A route into Operations": "deliver", "Measurement is covered": "deliver", "Adoption is funded": "deliver",
  "Eight weeks promised": "deliver", "No route to production": "deliver", "Timeline assumes access": "deliver",
};

/** One question per act, each a step towards `STORY.question`. Asks; never answers (G3b). */
export const ACT_QUESTION: Readonly<Record<ChapterNumber, string>> = {
  1: "Which company should your team chase, and how do you get a first meeting?",
  2: "Is Orion worth chasing, and how many of your people should work on it?",
  3: "What will you offer Orion, and what exactly will you promise?",
  4: "What price and terms will you agree to, and will you sign?",
  5: "Can your team do everything you promised in order to win?",
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
    "They pull against each other. Promise more and we win more easily, but the work gets harder. Charge less and we win more easily, but earn less.",
    "You will not be on your own. Riya runs our team and its money, Arjun designs what we sell, and Aisha runs the project once it is signed.",
  ],
  2: ["We have six people. Every week they spend chasing Orion is a week they are not on work that already pays."],
  3: ["Anything you write into the proposal, Aisha’s team will have to do later."],
  4: ["Orion will push the price down. Every pound we give away comes straight out of what this deal is worth to us."],
  5: ["Every promise in the contract now has a date on it and one of my people doing it."],
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
  workshop: { photo: "scene-chapter-3", name: "The proposal workshop" },
  orionRoom: { photo: "scene-chapter-4", name: "Orion’s meeting room" },
  headOffice: { photo: "env-boardroom", name: "Orion head office" },
  depot: { photo: "env-warehouse", name: "Orion’s distribution centre" },
  delivery: { photo: "scene-chapter-5", name: "The delivery team’s room" },
} as const satisfies Record<string, { photo: BackdropAsset; name: string }>;
type PlaceId = keyof typeof PLACE;

const SCENE_PLACE: Readonly<Record<string, PlaceId>> = {
  setup: "office", "int-1": "store", m1: "office", m2: "store", m3: "office", "deb-1": "store",
  "int-2": "projectRoom", m4: "projectRoom", "turn-rival": "store", m5: "headOffice", "refl-rival": "projectRoom", m5b: "projectRoom", "deb-2": "projectRoom",
  "int-3": "workshop", m6: "headOffice", m6b: "workshop", "refl-shape": "workshop", m7: "workshop", m7b: "office", "deb-3": "workshop",
  "int-4": "orionRoom", m8: "orionRoom", m9: "office", m9a: "orionRoom", "turn-award": "headOffice", "refl-award": "office", m9b: "headOffice", "deb-4": "orionRoom",
  "int-5": "depot", m10: "depot", "refl-month5": "delivery", m10b: "delivery", m10h: "delivery", "turn-sarah": "headOffice", m10c: "headOffice", "deb-5": "delivery",
  end: "store",
};

export const placeOf = (nodeId: string) => PLACE[SCENE_PLACE[nodeId] ?? "office"];

/** Kept for the presentation contract: every node has a credited photograph. */
export const BACKDROP: Readonly<Record<string, BackdropAsset>> = Object.fromEntries(
  Object.entries(SCENE_PLACE).map(([id, place]) => [id, PLACE[place].photo]),
);

/** Chapter lighting names. The colour script itself lives in the stylesheet as tokens. */
export const CHAPTER_LIGHT: Readonly<Record<ChapterNumber, string>> = {
  1: "Daybreak", 2: "Glass", 3: "Studio", 4: "Boardroom", 5: "Floor",
};

/**
 * A story turn is a report of something that already happened elsewhere, so each is staged
 * as the artefact it would actually arrive as: trade press, a forwarded email, an internal
 * memo. The narration stays the content; the artefact is dressing and invents no facts the
 * story does not state (08:25 is the story's 08:14 plus the "eleven minutes later").
 */
export type TurnDressing =
  | { format: "press"; masthead: string; section: string; kicker: string }
  | { format: "mail"; app: string; from: string; subject: string; preview: string; time: string }
  | { format: "memo"; organisation: string; label: string; subject: string; from: string };

export const TURN_DRESSING: Readonly<Record<string, TurnDressing>> = {
  "turn-rival": { format: "press", masthead: "The Retail Ledger", section: "Technology · Partnerships", kicker: "This morning" },
  "turn-award": { format: "mail", app: "Mail", from: "Sarah Lim", subject: "Fwd: Evaluation outcome", preview: "Forwarded message from Orion Retail Procurement. No note added.", time: "08:25" },
  "turn-sarah": { format: "memo", organisation: "Orion Retail", label: "Internal announcement", subject: "Leadership update", from: "Internal communications" },
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
  m1: "Choose the client",
  m2: "Research Orion",
  m3: "Get the first meeting",
  m4: "Decide how hard to chase",
  "turn-rival": "A rival strikes",
  m5: "Answer the rival",
  m5b: "Spend the team’s fortnight",
  m6: "Pick the problem to solve",
  m6b: "Shape the offer",
  m7: "Fill the proposal",
  m7b: "Pass our own review",
  m8: "Hold the price",
  m9: "Fix the gap before signing",
  m9a: "Win Orion’s scoring",
  "turn-award": "Orion decides",
  m9b: "Sign or walk away",
  m10: "Month five slips",
  m10b: "Fill two empty seats",
  m10h: "Hand over the promises",
  "turn-sarah": "Sarah resigns",
  m10c: "Keep the work alive",
};

/**
 * Side-by-side facts for a choice that is a comparison (D-083). The first decision is
 * picking a client, and a newcomer can only pick well if the three are described on the same
 * rows. Facts only: no row says which client is right; each one has a real upside.
 */
export const COMPARE: Readonly<Record<string, readonly { label: string; values: Readonly<Record<string, string>> }[]>> = {
  m1: [
    { label: "What they want", values: { "o-northwind": "A better experience for shoppers across 210 shops", "o-apex": "New systems for its factories", "o-meridian": "Better contact with patients at a small hospital group" } },
    { label: "Size of the prize", values: { "o-northwind": "Large, and the budget is already set", "o-apex": "The largest of the three", "o-meridian": "The smallest today, and it could grow" } },
    { label: "Have we done this before?", values: { "o-northwind": "Yes: similar work for other retailers", "o-apex": "No: it needs factory engineering", "o-meridian": "Not in healthcare" } },
    { label: "Who we are up against", values: { "o-northwind": "Two firms already talking to them", "o-apex": "Specialists with factory clients", "o-meridian": "Few rivals" } },
    { label: "How fast they decide", values: { "o-northwind": "This quarter", "o-apex": "A six-week bid", "o-meridian": "Months of approvals" } },
  ],
};

/**
 * The question under the whole story (D-083). Orion's brief is one vague line; what is really
 * wrong (customers angry about what happens after they buy) is there to be found, and finding
 * it is what makes the later choices make sense. The map keeps it open as a case file until
 * the player holds one of the clues.
 */
export const MYSTERY = {
  question: "What is really wrong at Orion?",
  unknown: "Nobody knows yet. Orion’s brief says “improve the customer experience”. That could mean the shops, the website, or something nobody has looked at.",
  solved: "Customers are not unhappy with the shops. They are angry about what happens after they buy: late deliveries, slow refunds and a helpline nobody answers.",
  clues: ["knows:real_pain", "evidenced"],
} as const;
