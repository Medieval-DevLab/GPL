import type { CharacterId } from "./characters";
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
  { chapter: 1, title: "Find the right client", goal: "Choose where to focus, investigate the account and earn a first conversation.", scene: "scene-chapter-1", advisor: "priya", route: ["int-1", "m1", "m2", "m3", "deb-1"], activities: ["Choose a client", "Investigate two questions", "Make the first approach"] },
  { chapter: 2, title: "Make it an opportunity", goal: "Decide how much of your team this opportunity is worth.", scene: "scene-chapter-2", advisor: "riya", route: ["int-2", "m4", "turn-rival", "m5", "refl-rival", "m5b", "deb-2"], activities: ["Qualify the brief", "Respond to new competition", "Allocate the team"] },
  { chapter: 3, title: "Build the response", goal: "Decide what you will propose, and what you will promise to deliver.", scene: "scene-chapter-3", advisor: "arjun", route: ["int-3", "m6", "m6b", "refl-shape", "m7", "m7b", "deb-3"], activities: ["Frame the real problem", "Explore delivery approaches", "Build and review the proposal"] },
  { chapter: 4, title: "Make the deal work", goal: "Negotiate the commercial terms and decide whether this is a deal worth signing.", scene: "scene-chapter-4", advisor: "riya", route: ["int-4", "m8", "m9", "m9a", "turn-award", "refl-award", "m9b", "deb-4"], activities: ["Negotiate price and scope", "Make the procurement case", "Decide whether to sign"] },
  { chapter: 5, title: "Deliver the promise", goal: "Handle the consequences of your commitments as the engagement changes.", scene: "scene-chapter-5", advisor: "aisha", route: ["int-5", "m10", "refl-month5", "m10b", "m10h", "turn-sarah", "m10c", "deb-5", "end"], activities: ["Respond to delivery pressure", "Own the handover", "Protect continuity"] },
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
 * Where each beat is staged. A chapter used to be one photograph shown on every screen it
 * contained, three times in a row, which is a large part of why the game read as one page
 * repeated 78 times. Locations now move with the story: the market at dusk while choosing a
 * client, a dark desk for messages, a lit tower for calls, the warehouse once delivery starts.
 * Decorative only — a backdrop never carries evidence or instructions.
 */
export const BACKDROP: Readonly<Record<string, BackdropAsset>> = {
  setup: "env-glass-office",
  "int-1": "env-storefront-night", m1: "env-skyline-dusk", m2: "scene-chapter-1", m3: "env-desk-night", "deb-1": "scene-chapter-1",
  "int-2": "env-skyline-blue", m4: "env-glass-office", "turn-rival": "env-storefront-night", m5: "env-tower-night", "refl-rival": "env-windows-night", m5b: "scene-chapter-2", "deb-2": "scene-chapter-2",
  "int-3": "scene-chapter-3", m6: "env-tower-night", m6b: "scene-chapter-3", "refl-shape": "env-windows-night", m7: "scene-chapter-3", m7b: "env-desk-night", "deb-3": "scene-chapter-3",
  "int-4": "env-boardroom", m8: "env-boardroom", m9: "env-desk-night", m9a: "scene-chapter-4", "turn-award": "env-skyline-dusk", "refl-award": "env-windows-night", m9b: "env-skyline-blue", "deb-4": "scene-chapter-4",
  "int-5": "env-warehouse", m10: "env-warehouse", "refl-month5": "env-windows-night", m10b: "scene-chapter-5", m10h: "scene-chapter-5", "turn-sarah": "env-skyline-dusk", m10c: "env-tower-night", "deb-5": "scene-chapter-5",
  end: "env-skyline-dusk",
};

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
