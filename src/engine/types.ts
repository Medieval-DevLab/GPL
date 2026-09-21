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
  | "bulb"
  | "trophy";

/** The three questions every engagement is judged on. */
export type DimensionId = "win" | "profit" | "deliver";

export const DIMENSIONS: readonly DimensionId[] = ["win", "profit", "deliver"] as const;

/**
 * Two colour tokens per dimension, not one, because no single value is legal in both
 * places. `fillVar` is the saturated solid: correct for a bar, a stroke or a chip
 * background, where 1.4.11 asks for 3:1. `textVar` is the darkened variant, the only one
 * legal on type, where 1.4.3 asks for 4.5:1.
 *
 * A single `varName` pointing at `--color-win` shipped instead, and it painted the label
 * "Winability" in the fill colour — #cd6d0a on white, 3.63:1 — on 42 of 45 screens, while
 * DESIGN-SYSTEM.md stated the rule it was breaking. One token cannot do both jobs, so the
 * type no longer offers one that claims to.
 */
export const DIMENSION_META: Record<
  DimensionId,
  {
    label: string;
    question: string;
    glyph: string;
    icon: IconId;
    /** saturated: bar fills, strokes, chip backgrounds. Never on type. */
    fillVar: string;
    /** darkened: labels, numbers, anything read as text. */
    textVar: string;
  }
> = {
  win: {
    label: "Winability",
    question: "Can we win it?",
    glyph: "◆",
    icon: "target",
    fillVar: "--color-win-solid",
    textVar: "--color-win-text",
  },
  profit: {
    label: "Profitability",
    /* "Should we win it?" was wrong, and wrong in a way that matters: that is the
       strategic-value question, of which margin is one input among several. It made the
       beachhead trade — thin margin, high strategic value, take it anyway — unaskable,
       and the game punishes it. Flagged by the pursuit partner on the panel. */
    question: "Is it worth winning?",
    glyph: "●",
    icon: "coins",
    fillVar: "--color-profit-solid",
    textVar: "--color-profit-text",
  },
  deliver: {
    label: "Deliverability",
    question: "Can we deliver it?",
    glyph: "▲",
    icon: "layers",
    fillVar: "--color-deliver-solid",
    textVar: "--color-deliver-text",
  },
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
  good_question: { label: "Asked first", note: "You found information that changed your decision." },
  adapt: { label: "Adapt", note: "You changed course when the situation changed." },
  connected_dots: { label: "Connected the Dots", note: "You used something you learned earlier." },
  smart_tradeoff: { label: "Traded on purpose", note: "You gave something up on purpose, and said why." },
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
  /**
   * Where this branch goes instead of the mission's own `next`.
   *
   * Exists so that walking away from a deal can actually end the pursuit. The PRD is
   * blunt about why this must be possible: "Walking away must sometimes be a good
   * decision. Otherwise the game teaches: Always accept the contract." (p. 132)
   */
  next?: string;
}

/**
 * The document facsimiles, each standing for a real artefact of the work.
 *
 * Deliberately a small closed set. Eight drawings that mean something beat twenty that
 * are merely different, and a union means a typo is a build error rather than a blank
 * card.
 */
export type FacsimileId =
  /** post-purchase complaint volumes — the finding the whole story turns on */
  | "complaints"
  /** weighted evaluation criteria, and the column you are winning */
  | "scorecard"
  /** who owns what, and the person who can stop you */
  | "org"
  /** a contract clause, with the sentence somebody will have to keep */
  | "clause"
  /** a plan where one bar has already crossed the line */
  | "timeline"
  /** a price broken into phases — same total, smaller first decision */
  | "phases"
  /** a proposal's contents, including the workstream nobody asked for */
  | "proposal"
  /** three competitors and a gap none of them covers */
  | "market";

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
  /** card photograph, filename in public/art/ without extension */
  image?: string;
  /**
   * A drawn document facsimile, preferred over `image`.
   *
   * The card used to carry a photograph: 21 crops lifted from the mockups, each upscaled
   * about ×1.43 into its frame and losing ~45% of its detail energy, together taking 9.2%
   * of a decision screen's pixels. A 132px photograph of a generic office cannot carry a
   * fact, and behind a heading it is the visual grammar of a slide deck.
   *
   * A facsimile carries the fact instead — the complaint data, the scorecard, the clause,
   * the plan that has slipped — drawn from geometry so it is sharp at any size and
   * recolours with the palette. See `src/ui/facsimile.tsx`.
   */
  facsimile?: FacsimileId;
  /**
   * The same choice, as a sentence the player SAYS.
   *
   * `title` and `description` are written in the third person for the comparison cards
   * — "The post-purchase experience", "Argue the damage happens after the sale". That is
   * the right register for weighing four approaches side by side, and the wrong one for
   * a conversation: nobody in a meeting says "the post-purchase experience" at another
   * person. So a mission staged as `dialogue` reads this instead, in the first person
   * and in quotes, and the option becomes a reply rather than a row.
   *
   * REQUIRED on every option of a `dialogue` mission; the validator enforces it, because
   * a missing one silently falls back to `title` and the beat quietly stops being a
   * conversation. Same leak rules as `commits`: it may describe what you are doing, never
   * what it will achieve.
   */
  say?: string;
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

/**
 * A colleague. Every piece of advice in the game comes from one of these, never from
 * the interface — a colleague briefing a new pursuit lead is onboarding, whereas the
 * same words in a box labelled "Tip" are condescending.
 */
export interface Advisor {
  name: string;
  role: string;
  quote: string;
  /** their practical steer on this mission — still their voice, not the game's */
  steer?: string;
  /** filename in public/art/, without extension */
  photo?: string;
}

/** The client, shown as a profile strip. */
export interface ClientProfile {
  name: string;
  monogram: string;
  tags: string[];
  blurb: string;
  facts: { icon: IconId; label: string; value: string }[];
  /** filename in public/art/, without extension */
  image?: string;
}

/**
 * Something a client-side person actually said, and who they are.
 *
 * `speaker` and `role` are separate fields because they were one string for a while
 * — "Sarah Lim · Chief Transformation Officer, Orion Retail" — which put a typographic
 * separator inside authored prose and left the UI unable to tell a name from a job
 * title. So the name could not be weighted differently from the role, and it could not
 * be reduced to initials. Content says who spoke; the interface decides how that looks.
 */
export interface SaidQuote {
  text: string;
  speaker: string;
  role: string;
}

/**
 * A colleague's line that depends on what the player has done.
 *
 * `advisorLine` was a bare string, so across 78 colleague utterances NOT ONE reacted to
 * anything — the same steer arrived whether the player had found the constraint or walked
 * past it. The client quotes gained conditions first (`ConditionalQuote`); this is the same
 * capability for our own side of the room, and the reason it is separate is only that a
 * colleague has no `speaker`/`role` to carry: they are already named by `advisor`.
 *
 * First match wins; a bare string remains legal and means "always this".
 */
export interface ConditionalLine {
  when?: Condition;
  text: string;
}

/**
 * A client-side line of dialogue, shown only when `when` passes.
 *
 * Extends `SaidQuote` so the two are interchangeable where they are rendered, and an
 * author can promote an unconditional quote to a conditional one without touching the UI.
 */
export interface ConditionalQuote extends SaidQuote {
  when?: Condition;
}

/**
 * How a mission is staged. The engine does not care; only the renderer does.
 *
 * Seventeen missions all rendered as `console` — a brief, a row of comparison cards, a
 * consequence — and the complaint that produced this type was that the game "doesn't feel
 * dynamic because the screens are almost the same". They were: same rails, same card row,
 * same geometry, seventeen times. Transitions cannot fix that, because animating between
 * two identical shapes is still the same shape. Variety has to come from RHYTHM.
 *
 * So some beats are staged as a conversation instead. Deliberately a presentation flag and
 * nothing more: identical options, identical outcomes, identical branching, identical
 * state. A beat can be restaged by changing one word, and no analysis, sweep or test that
 * reasons about the game's structure needs to know this field exists.
 *
 * `console` is right where the player is COMPARING — evidence to buy, a proposal to
 * assemble, five workstreams and room for two. Columns that line up are genuinely the
 * best tool for that and are not the problem.
 * `dialogue` is right where the player is ANSWERING somebody.
 * `apply` is right where the question is WHAT DID YOU BRING. The console renders an
 * option the player cannot take as a shorter list, which reads as the game offering less
 * rather than as the player having earned less; apply renders it as a named padlock
 * saying where it could have been earned. Only worth the third staging on a beat whose
 * options are genuinely gated — 85% of runs reach the handover with something locked.
 */
export type Presentation = "console" | "dialogue" | "apply";

/**
 * Which conversation surface a `dialogue` beat is staged on.
 *
 * The first draft of this staged dialogue as a visual novel: a painted room, a character
 * bust, a textbox across the bottom. That is a GENRE TRANSPLANT. Consultants do not stand
 * in front of painted backdrops; they live in video calls, chat threads and email. Staging
 * the beat in the artefacts of the actual work makes the interface diegetic — it stops
 * representing the fiction and becomes it.
 *
 * Three things follow, and the first is why this replaced the earlier plan outright:
 *
 *  1. It needs almost no art. A tile is a headshot in a rounded rect, and a real call
 *     shows INITIALS IN A CIRCLE when someone's camera is off — so the monogram already
 *     built for the three client voices stops being a fallback and becomes authentic.
 *     `docs/ART-BRIEF.md` asked for 21 sprites and 9 painted rooms; this needs neither.
 *  2. Dynamism becomes information rather than decoration, which was the actual
 *     complaint. An active-speaker ring, a participant joining mid-call, a camera off, a
 *     typing indicator: all of them tell the player something.
 *  3. The choice mechanic is native. A composer offering three things you could say is
 *     simply how anyone answers in this medium.
 *
 * Choosing the surface is itself a statement about the beat's formality and stakes: a
 * `call` is live and multi-person and you cannot take it back; a `chat` is quick, internal
 * and low-ceremony; a `thread` is written, slow and on the record.
 */
export type Surface = "call" | "chat" | "thread";

/**
 * Whose room this is — which decides who the player's replies are addressed to.
 *
 * Not cosmetic. The renderer's default is to open a conversation with whoever already
 * speaks on the beat, preferring the client's `saidQuote`/`quotes` over the colleague's
 * `advisorLine`, and on nine of the ten conversation beats that is exactly right. On m10
 * it is exactly wrong: the situation puts the player in thirty minutes with the delivery
 * lead, so the replies are addressed to her and refer to the client in the third person
 * — "what THEY are asking for was never in the contract". Opening that beat with the
 * client on screen would have the player discussing them as though they were not there.
 *
 * So the room is authored rather than inferred. `internal` also earns the client's quote
 * a better job than being dropped: it becomes context arriving from outside the room
 * while your own colleague is in front of you, which is nearer to how month five
 * actually feels.
 */
export type Room = "client" | "internal";

export type FactorLevel = "low" | "medium" | "high" | "strong";

/** Semantic colour for an icon. Assigned by meaning in content, never by position. */
export type IconTone = "accent" | "good" | "warn" | "bad" | "neutral";

/** A read on the situation, shown as a labelled bar. Describes NOW, not the future. */
export interface AssessmentFactor {
  icon: IconId;
  label: string;
  level: FactorLevel;
  note: string;
  /**
   * Icon colour. MUST be set from what the factor means.
   *
   * This was previously assigned by array index, which painted "Value: High" with a red
   * icon — misinforming the player, which is worse than a monochrome row.
   */
  tone: IconTone;
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
  /** one line under the question, telling the player how to read the options */
  prompt?: string;
  /** roughly how long this mission takes, in minutes */
  minutes: number;
  /** header photograph, filename in public/art/ without extension */
  hero?: string;
  /** the scenario, as paragraphs — used when no variant matches */
  situation: string[];
  /**
   * How this beat is staged. Defaults to `console`.
   *
   * The spoken opening needs no new content: a `dialogue` beat is opened by whoever
   * already talks on it — the client's `saidQuote`/`quotes` if one resolves, otherwise the
   * colleague's `advisorLine`. Both are authored already, which is why restaging a beat
   * costs one word here plus a `say` line per option.
   */
  presentation?: Presentation;
  /** Which conversation surface, when `presentation` is `dialogue`. Defaults to `call`. */
  surface?: Surface;
  /**
   * Whose room it is. Defaults to `client` when a client quote resolves, else `internal`.
   *
   * Set it explicitly to override that inference — the replies have to be addressed to
   * somebody, and only the author knows who.
   */
  room?: Room;
  /** state-dependent rewrites of the scenario, checked before `situation` */
  variants?: SituationVariant[];
  /** known facts, shown as chips */
  context?: ContextChip[];
  /** the client, where relevant */
  client?: ClientProfile;
  /** a read on the current situation, shown as bars */
  assessment?: AssessmentFactor[];
  /** something the client actually said */
  saidQuote?: SaidQuote;
  /**
   * Client-side voices that only speak once the player knows they exist.
   *
   * `saidQuote` is unconditional, which was fine while every one of them was the sponsor
   * — she introduces herself in chapter one. It is not fine for the two client people who
   * actually decide the outcome. Marcus Reed owns every system that would have to change
   * and is the reason the programme can be stopped; finding him is the *reward* for asking
   * who owns the systems at m2, and an unconditional quote would have handed his name to
   * players who never asked, which is the discovery this game is built on.
   *
   * So: first entry whose `when` passes wins, and `saidQuote` is the fallback. Orthogonal
   * to `variants` on purpose — a person speaking up is not the same event as the scene
   * being rewritten, and coupling them would force an author to fork the prose to add a
   * line of dialogue.
   */
  quotes?: ConditionalQuote[];
  /** what is worrying them */
  concerns?: string[];
  /** a colleague's steer */
  advisor?: Advisor;
  /**
   * What that colleague says on THIS mission, overriding their standing quote.
   *
   * Without it an advisor repeats one sentence across every mission they own — Aisha
   * said the same thing about the proposal on four consecutive screens, including the
   * one where the sponsor resigns and the proposal is not in question. Frozen is not
   * the same as consistent.
   */
  advisorLine?: string | ConditionalLine[];
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

/**
 * Chapter 0 — the starting advantage.
 *
 * Not a decision with a consequence: character creation. The PRD is explicit that
 * "starting with a 'beginning state' is much stronger than starting with a tutorial"
 * (p. 55) and that the player should feel "these are our starting strengths" (p. 56).
 * It sits before the chapter stepper begins, so it is its own node kind rather than a
 * mission — there is nothing to resolve and nothing to learn from yet.
 */
export interface SetupOption {
  id: string;
  title: string;
  description: string;
  icon: IconId;
  image?: string;
  /** a drawn artefact, preferred over `image` — see `Option.facsimile` */
  facsimile?: FacsimileId;
  /** what this advantage means in play, as short tags */
  strengths: string[];
  /** and what it costs you */
  tradeoff: string;
  flags: string[];
  dims?: Partial<Record<DimensionId, number>>;
}

export interface Setup {
  kind: "setup";
  id: string;
  eyebrow: string;
  title: string;
  body: string[];
  question: string;
  options: SetupOption[];
  next: string;
}

/**
 * What an interlude is FOR, which decides how it is staged.
 *
 * Four different screens, one node kind. `GAME-SEQUENCE.md` calls for chapter openers,
 * reflection nodes, chapter debriefs and three story turns the player cannot alter — and
 * every one of them is the same thing mechanically: a beat with prose and no decision,
 * sitting between missions in the graph.
 *
 * So they share `kind: "interlude"` rather than adding four node kinds. That costs one
 * optional field and buys a great deal: the exhaustive sweep, the validator, `next`
 * resolution and the save format all keep working untouched, because nothing about the
 * STATE MACHINE changed — only the renderer reads this.
 */
export type InterludeRole =
  /** opens a chapter. Full-bleed cut scene with a figure. The default. */
  | "chapter-open"
  /** a breath after the chapter's hardest beat. Paper, and the METERS ARE REMOVED. */
  | "reflection"
  /** closes a chapter: what you did, what you missed, stars. Stage ground. */
  | "chapter-debrief"
  /** a story turn done TO the player — the rival moves, the award lands, she resigns. */
  | "turn";

export interface Interlude {
  kind: "interlude";
  id: string;
  /** How this beat is staged. Defaults to `chapter-open`. */
  role?: InterludeRole;
  /**
   * The colleague who speaks, on the roles that have a voice.
   *
   * A reflection node is a person asking you something; a chapter opener has a figure in
   * it. Both need someone, and an interlude has no advisor of its own.
   */
  advisor?: Advisor;
  /** What they say. Reflection nodes are a question; turns are a line of narration. */
  prompt?: string;
  /** The player's possible answers on a reflection. NONE of them changes state. */
  responses?: string[];
  /**
   * The full-bleed plate behind a cut scene or a turn, filename without extension.
   *
   * Content, not a component constant, because which room a beat happens in is an
   * authoring decision — and because `tokens.test.ts` fails the build on any art file
   * nothing references, so a plate named only inside a component would have reported
   * every cut-scene image as an orphan the day the artwork arrived.
   */
  plate?: string;
  chapter: number;
  eyebrow: string;
  title: string;
  body: string[];
  /**
   * What the player just achieved, named. The PRD asks for milestones — FIRST LEAD,
   * FIRST DELIVERY (p. 224) — because five identical chapter cards are not a
   * progression system.
   */
  milestone?: string;
  next: string;
}

export interface Ending {
  kind: "ending";
  id: string;
}

export type GameNode = Mission | Interlude | Ending | Setup;

export function isMission(node: GameNode): node is Mission {
  return node.kind === "choice" || node.kind === "investigate" || node.kind === "build";
}

/* ─────────────────────────── runtime state ─────────────────────────── */

export type Phase =
  | "title"
  | "setup"
  /**
   * Read the situation. Separate from "decide" on purpose.
   *
   * Nine comparable games were torn down for docs/DENSITY-FRAMEWORK.md — Reigns, Papers
   * Please, CK3, Slay the Spire, Into the Breach, Citizen Sleeper, Frostpunk, Disco
   * Elysium, XCOM 2 — and not one of them shows a full briefing alongside its options.
   * They all occlude, pause or collapse the world at the moment of choice. We showed
   * both, which put 419 words and up to 16 panels on a single screen.
   */
  | "brief"
  | "interlude"
  | "decide"
  | "resolving"
  | "consequence"
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
  /**
   * Whether the player read the trade correctly, kept permanently.
   *
   * It already existed on `Resolution`, but `enterNode` clears that on leaving the
   * mission, so it was knowable for the current beat and unknowable a minute later. That
   * made a mastery rating unstable: `progress.ts` would award three stars on the
   * consequence screen and two for the same mission seen from the hub. A mastery figure
   * that changes when you walk away from it is not a mastery figure.
   *
   * So it is recorded here, where history is permanent. Costs one boolean per beat.
   */
  predictionCorrect: boolean | null;
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
  /** which dimension the player said would move least, before committing */
  predicted: DimensionId | null;
  /** which one actually did. Named for the question asked, so the two cannot drift again. */
  actualLeastMoved: DimensionId | null;
  /**
   * Whether the prediction was right — decided here rather than in the component, because
   * a tie has several right answers and a component comparing two ids cannot know that.
   */
  predictionCorrect: boolean | null;
  /** All three deltas are zero, so there is no "one that held" to name. */
  nothingMoved: boolean;
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
  /**
   * The player's call, before committing, on which dimension this will cost most.
   *
   * This is the game's "before". Without it the consequence screen can only TELL the
   * player what happened, which is what made the game feel like it was lecturing. With
   * it, the consequence confirms or corrects a claim they made themselves.
   */
  prediction: DimensionId | null;
  resolution: Resolution | null;
  history: HistoryEntry[];
  /** missions completed, for the progress rail */
  completed: string[];
}

/**
 * One "because → so later" pair in the closing debrief.
 *
 * `because` names something the player did; `soLater` names what it caused. A rule fires
 * only when every id in `needsOutcomes` fired on this run, so a thread is never a
 * generality — it is an account of two things that both actually happened.
 */
export interface CausalThreadRule {
  /** every one of these outcomes must have fired */
  needsOutcomes: string[];
  /** and every one of these flags must be set */
  needsFlags?: string[];
  because: string;
  soLater: string;
  /**
   * Wrong answers for the debrief's causal-claim item (backlog 4.5), in the same register
   * as `because`.
   *
   * Authored rather than generated, and that is the whole point of the field. The engine
   * could assemble distractors from other rules' `because` lines, but each is then either
   * something the player plainly never did — which makes the item a memory test — or
   * something they did that ALSO contributed, which makes the item wrong. Only the person
   * writing the thread knows which near-miss is instructive.
   *
   * Two or three. A rule with none is simply never chosen as the item.
   */
  insteadOf?: string[];
}

export interface Content {
  nodes: Record<string, GameNode>;
  startNodeId: string;
  /** ordered mission ids, for progress display */
  missionOrder: string[];
  /** chapter structure — drives the top stepper and the left rail */
  chapters: Chapter[];
  /**
   * The causal threads, which live here rather than in the engine.
   *
   * They were a `const` inside `engine.ts`, which made the single most content-shaped
   * table in the game unreachable to whoever writes the content — and it showed: five
   * rules existed, `DECISIONS.md` D-012 claimed nine, and 77% of runs ended with the
   * section the code calls "the payoff of the whole design" completely empty. Adding a
   * thread is authoring, not engineering, so it belongs where the authoring is.
   */
  threads: CausalThreadRule[];
}
