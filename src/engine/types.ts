/**
 * GPL — content and state types.
 *
 * DESIGN LAW ENCODED HERE:
 *  1. There is no randomness. An outcome is selected by matching CONDITIONS against
 *     accumulated state. Uncertainty comes from information the player does not have,
 *     never from dice. This keeps every result attributable — the player can always be
 *     told exactly why it happened, which is the entire teaching mechanism.
 *  2. An option carries no intrinsic score. Its outcome depends on context, so the same
 *     move can be right in one situation and wrong in another.
 *  3. Every mission carries a `lesson`. Whichever branch the player takes, the learning
 *     objective is surfaced. The teaching lives in the consequence, not in the scoring.
 */

/** The three questions every engagement is judged on. */
export type DimensionId = "win" | "profit" | "deliver";

export const DIMENSIONS: readonly DimensionId[] = ["win", "profit", "deliver"] as const;

export const DIMENSION_META: Record<
  DimensionId,
  { label: string; question: string; glyph: string; varName: string }
> = {
  win: { label: "Winability", question: "Can we win it?", glyph: "◆", varName: "--color-win" },
  profit: { label: "Profitability", question: "Should we win it?", glyph: "●", varName: "--color-profit" },
  deliver: { label: "Deliverability", question: "Can we deliver it?", glyph: "▲", varName: "--color-deliver" },
};

/** Stages of the client journey. Used for the progress rail. */
export type StageId = "client" | "lead" | "opportunity" | "solution" | "deal" | "delivery";

export const STAGES: readonly { id: StageId; label: string }[] = [
  { id: "client", label: "Client" },
  { id: "lead", label: "Lead" },
  { id: "opportunity", label: "Opportunity" },
  { id: "solution", label: "Solution" },
  { id: "deal", label: "Deal" },
  { id: "delivery", label: "Delivery" },
] as const;

export type BadgeId =
  | "good_question"
  | "adapt"
  | "connected_dots"
  | "smart_tradeoff"
  | "recovered"
  | "held_nerve";

export const BADGE_META: Record<BadgeId, { label: string; note: string }> = {
  good_question: { label: "Good Question", note: "You found information that changed your decision." },
  adapt: { label: "Adapt", note: "You changed course when the situation changed." },
  connected_dots: { label: "Connected the Dots", note: "You used something you learned earlier." },
  smart_tradeoff: { label: "Smart Trade-off", note: "You gave something up on purpose, and said why." },
  recovered: { label: "Recovered", note: "You turned a bad position around." },
  held_nerve: { label: "Held Your Nerve", note: "You stayed with a plan under pressure, and it held." },
};

/** Matched against accumulated state to select an outcome. All present clauses must pass. */
export interface Condition {
  /** every flag must be set */
  all?: string[];
  /** at least one flag must be set */
  any?: string[];
  /** none of these flags may be set */
  none?: string[];
  /** dimension must be at least this */
  min?: Partial<Record<DimensionId, number>>;
  /** dimension must be at most this */
  max?: Partial<Record<DimensionId, number>>;
}

export interface Effect {
  /** signed deltas, applied then clamped to 0..100 */
  dims?: Partial<Record<DimensionId, number>>;
  /** flags to set */
  flags?: string[];
  /** recognition, awarded only when genuinely earned */
  badge?: BadgeId;
}

export type OutcomeTone = "strong" | "mixed" | "hard";

/** The transferable lesson. Short by design — five seconds, not a lecture. */
export interface Lesson {
  /** the rule, stated generally */
  principle: string;
  /** why it applied to what just happened */
  because: string;
  /** what to notice next time */
  watchFor?: string;
}

export interface Outcome {
  id: string;
  /** omitted on the final fallback outcome, which must always exist */
  when?: Condition;
  tone: OutcomeTone;
  /** what happened */
  headline: string;
  /** why it happened */
  detail: string;
  /** what is now different — prose bullets, not numbers */
  changed: string[];
  effect: Effect;
  /** overrides the mission lesson on this branch */
  lesson?: Lesson;
}

/** Icon keys. Rendered as inline SVG — no image assets anywhere in this game. */
export type IconId =
  | "target"
  | "search"
  | "people"
  | "talk"
  | "megaphone"
  | "shield"
  | "spark"
  | "chart"
  | "clock"
  | "coins"
  | "warning"
  | "check"
  | "cross"
  | "block"
  | "rocket"
  | "layers"
  | "scale"
  | "flag"
  | "bulb";

export interface Option {
  id: string;
  title: string;
  description: string;
  icon?: IconId;
  /**
   * What this costs or locks in. ALLOWED before the decision.
   * Predicted outcomes are NOT — never write "improves winability" here.
   */
  commits?: string;
  /** Upsides of the APPROACH — what it is for. Not a prediction of the result. */
  pros?: string[];
  /** What you give up by choosing it. Again: cost, not outcome. */
  cons?: string[];
  /** Relative cost, 1–3 dots. Honest about effort, silent about payoff. */
  cost?: { time: 1 | 2 | 3; investment: 1 | 2 | 3 };
  /** option is hidden unless this passes */
  requires?: Condition;
  outcomes: Outcome[];
}

export interface Evidence {
  id: string;
  label: string;
  /** the question you would actually ask */
  question: string;
  /** what you learn */
  reveals: string;
  flags?: string[];
}

export interface Component {
  id: string;
  title: string;
  description: string;
  tag: string;
  flags?: string[];
  dims?: Partial<Record<DimensionId, number>>;
}

export interface ContextChip {
  label: string;
  value: string;
}

/**
 * An alternative framing of the scenario, selected by state.
 *
 * This is what makes a late mission land as "oh — THAT is why". The risk review
 * names the risk the player's own proposal actually created; the delivery crisis
 * names the promise they actually made. First match wins; `situation` is the fallback.
 */
export interface SituationVariant {
  when?: Condition;
  situation: string[];
}

/** A colleague who gives you a steer. Adds a human voice without a tutorial. */
export interface Advisor {
  name: string;
  role: string;
  quote: string;
}

/** The client, shown as a profile strip. Monogram + gradient, never a photo. */
export interface ClientProfile {
  name: string;
  monogram: string;
  tags: string[];
  blurb: string;
  facts: { icon: IconId; label: string; value: string }[];
}

export type FactorLevel = "low" | "medium" | "high" | "strong";

/** A read on the situation, shown as a labelled bar. Describes NOW, not the future. */
export interface AssessmentFactor {
  icon: IconId;
  label: string;
  level: FactorLevel;
  note: string;
}

interface MissionBase {
  id: string;
  chapter: number;
  stage: StageId;
  title: string;
  /** small label above the headline, e.g. "THE SITUATION" */
  eyebrow: string;
  /** what the player is trying to do, in plain words */
  objective: string;
  /** roughly how long this mission takes, in minutes */
  minutes: number;
  /** the scenario, as paragraphs — used when no variant matches */
  situation: string[];
  /** state-dependent rewrites of the scenario, checked before `situation` */
  variants?: SituationVariant[];
  /** known facts, shown as chips */
  context?: ContextChip[];
  /** the client, where relevant */
  client?: ClientProfile;
  /** a read on the current situation, shown as bars */
  assessment?: AssessmentFactor[];
  /** something the client actually said */
  saidQuote?: { text: string; attribution: string };
  /** what is worrying them */
  concerns?: string[];
  /** a colleague's steer */
  advisor?: Advisor;
  /** open questions, shown in the right rail — never answers */
  consider?: string[];
  /** the nudge in the bottom bar */
  tip?: string;
  /** fallback lesson — guarantees the objective lands on every branch */
  lesson: Lesson;
  next: string;
}

/** A chapter groups missions and drives the top stepper and the left rail. */
export interface Chapter {
  number: number;
  label: string;
  title: string;
  missionIds: string[];
  /** short human names for the left-rail checklist, one per mission */
  steps: string[];
}

export interface ChoiceMission extends MissionBase {
  kind: "choice";
  /** the single human question */
  question: string;
  options: Option[];
}

export interface InvestigateMission extends MissionBase {
  kind: "investigate";
  question: string;
  /** how many you may look at — fewer than the list, always */
  slots: number;
  evidence: Evidence[];
  outcomes: Outcome[];
}

export interface BuildMission extends MissionBase {
  kind: "build";
  question: string;
  /** exactly this many components */
  pick: number;
  components: Component[];
  outcomes: Outcome[];
}

export type Mission = ChoiceMission | InvestigateMission | BuildMission;

export interface Interlude {
  kind: "interlude";
  id: string;
  chapter: number;
  eyebrow: string;
  title: string;
  body: string[];
  next: string;
}

export interface Ending {
  kind: "ending";
  id: string;
}

export type GameNode = Mission | Interlude | Ending;

export function isMission(node: GameNode): node is Mission {
  return node.kind === "choice" || node.kind === "investigate" || node.kind === "build";
}

/* ─────────────────────────── runtime state ─────────────────────────── */

export type Phase =
  | "title"
  | "interlude"
  | "decide"
  | "resolving"
  | "consequence"
  | "lesson"
  | "ending";

export interface HistoryEntry {
  missionId: string;
  missionTitle: string;
  stage: StageId;
  chapter: number;
  /** what the player picked, in words */
  chosenLabel: string;
  chosenIds: string[];
  outcomeId: string;
  tone: OutcomeTone;
  headline: string;
  lesson: Lesson;
  dimsBefore: Record<DimensionId, number>;
  dimsAfter: Record<DimensionId, number>;
}

export interface Resolution {
  outcome: Outcome;
  chosenLabel: string;
  lesson: Lesson;
  dimsBefore: Record<DimensionId, number>;
  dimsAfter: Record<DimensionId, number>;
  deltas: Record<DimensionId, number>;
  newBadges: BadgeId[];
  /** populated for investigate missions */
  revealed: Evidence[];
}

export interface GameState {
  nodeId: string;
  phase: Phase;
  dims: Record<DimensionId, number>;
  flags: string[];
  badges: BadgeId[];
  /** ids of evidence the player has paid to see, across the whole run */
  discovered: string[];
  /** in-progress selection on the current mission */
  selection: string[];
  resolution: Resolution | null;
  history: HistoryEntry[];
  /** missions completed, for the progress rail */
  completed: string[];
}

export interface Content {
  nodes: Record<string, GameNode>;
  startNodeId: string;
  /** ordered mission ids, for progress display */
  missionOrder: string[];
  /** chapter structure — drives the top stepper and the left rail */
  chapters: Chapter[];
}
