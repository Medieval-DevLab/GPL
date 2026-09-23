import type { CharacterId } from "./characters";
import { CHAPTER_SCENES, type ChapterNumber, type SceneAsset } from "./assets";

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
  { chapter: 2, title: "Make it an opportunity", goal: "Test whether the opportunity is real before committing your team's time.", scene: "scene-chapter-2", advisor: "riya", route: ["int-2", "m4", "turn-rival", "m5", "refl-rival", "m5b", "deb-2"], activities: ["Qualify the brief", "Respond to new competition", "Allocate the team"] },
  { chapter: 3, title: "Build the response", goal: "Turn evidence into a solution and a proposal your team can stand behind.", scene: "scene-chapter-3", advisor: "arjun", route: ["int-3", "m6", "m6b", "refl-shape", "m7", "m7b", "deb-3"], activities: ["Frame the real problem", "Explore delivery approaches", "Build and review the proposal"] },
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

export function presentationForNode(nodeId: string): NodePresentation | undefined {
  return NODE_PRESENTATION[nodeId];
}

export function chapterPresentation(chapter: number): ChapterPresentation | undefined {
  return CHAPTER_PRESENTATION.find((item) => item.chapter === chapter);
}
