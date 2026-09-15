/**
 * GPL engine — pure, deterministic, headless.
 *
 * (GameState, Content, Action) → GameState. No Date.now, no Math.random, no DOM,
 * no React. The same sequence of choices always produces byte-identical state,
 * which is what makes "here is exactly why that happened" a promise we can keep.
 */

import {
  DIMENSIONS,
  isMission,
  type BadgeId,
  type Component,
  type Condition,
  type Content,
  type DimensionId,
  type Effect,
  type Evidence,
  type IconId,
  type GameNode,
  type GameState,
  type HistoryEntry,
  type Mission,
  type Option,
  type Outcome,
  type Resolution,
} from "./types";

export const START_DIMS: Record<DimensionId, number> = { win: 50, profit: 50, deliver: 50 };

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

function zeroDims(): Record<DimensionId, number> {
  return { win: 0, profit: 0, deliver: 0 };
}

/* ───────────────────────────── conditions ───────────────────────────── */

export function evaluateCondition(
  cond: Condition | undefined,
  flags: readonly string[],
  dims: Record<DimensionId, number>,
): boolean {
  if (!cond) return true;
  const has = (f: string) => flags.includes(f);

  if (cond.all && !cond.all.every(has)) return false;
  if (cond.any && !cond.any.some(has)) return false;
  if (cond.none && cond.none.some(has)) return false;

  if (cond.min) {
    for (const d of DIMENSIONS) {
      const floor = cond.min[d];
      if (floor !== undefined && dims[d] < floor) return false;
    }
  }
  if (cond.max) {
    for (const d of DIMENSIONS) {
      const ceil = cond.max[d];
      if (ceil !== undefined && dims[d] > ceil) return false;
    }
  }
  return true;
}

/**
 * First matching outcome wins; the last outcome must be unconditional and acts as
 * the fallback. The content validator enforces that a fallback exists, so this
 * cannot return undefined for valid content.
 */
export function selectOutcome(
  candidates: readonly Outcome[],
  flags: readonly string[],
  dims: Record<DimensionId, number>,
): Outcome {
  for (const o of candidates) {
    if (evaluateCondition(o.when, flags, dims)) return o;
  }
  // Unreachable for validated content. Fail loudly rather than silently mis-teaching.
  throw new Error("selectOutcome: no outcome matched and no fallback was provided");
}

/* ───────────────────────────── effects ───────────────────────────── */

interface Applied {
  dims: Record<DimensionId, number>;
  flags: string[];
  badges: BadgeId[];
  newBadges: BadgeId[];
}

function applyEffect(
  effect: Effect | undefined,
  dims: Record<DimensionId, number>,
  flags: readonly string[],
  badges: readonly BadgeId[],
): Applied {
  const nextDims = { ...dims };
  const nextFlags = [...flags];
  const nextBadges = [...badges];
  const newBadges: BadgeId[] = [];

  if (effect?.dims) {
    for (const d of DIMENSIONS) {
      const delta = effect.dims[d];
      if (delta !== undefined) nextDims[d] = clamp(nextDims[d] + delta);
    }
  }
  if (effect?.flags) {
    for (const f of effect.flags) if (!nextFlags.includes(f)) nextFlags.push(f);
  }
  if (effect?.badge && !nextBadges.includes(effect.badge)) {
    nextBadges.push(effect.badge);
    newBadges.push(effect.badge);
  }

  return { dims: nextDims, flags: nextFlags, badges: nextBadges, newBadges };
}

/* ───────────────────────────── lifecycle ───────────────────────────── */

export function createInitialState(content: Content): GameState {
  return {
    nodeId: content.startNodeId,
    phase: "title",
    dims: { ...START_DIMS },
    flags: [],
    badges: [],
    discovered: [],
    selection: [],
    prediction: null,
    resolution: null,
    history: [],
    completed: [],
  };
}

export function getNode(content: Content, id: string): GameNode {
  const node = content.nodes[id];
  if (!node) throw new Error(`getNode: unknown node "${id}"`);
  return node;
}

function enterNode(state: GameState, content: Content, id: string): GameState {
  const node = getNode(content, id);
  const base: GameState = {
    ...state,
    nodeId: id,
    selection: [],
    prediction: null,
    resolution: null,
  };

  if (node.kind === "setup") return { ...base, phase: "setup" };
  if (node.kind === "interlude") return { ...base, phase: "interlude" };
  if (node.kind === "ending") return { ...base, phase: "ending" };
  return { ...base, phase: "decide" };
}

/**
 * The scenario text for this mission given current state.
 * First matching variant wins; `mission.situation` is the fallback.
 */
export function resolveSituation(mission: Mission, state: GameState): string[] {
  for (const v of mission.variants ?? []) {
    if (evaluateCondition(v.when, state.flags, state.dims)) return v.situation;
  }
  return mission.situation;
}

/** Options whose `requires` condition passes. Others are not shown at all. */
export function availableOptions(mission: Mission, state: GameState): Option[] {
  if (mission.kind !== "choice") return [];
  return mission.options.filter((o) => evaluateCondition(o.requires, state.flags, state.dims));
}

/** Everything selectable on this mission, in display order. Drives keyboard shortcuts. */
export function selectableIds(mission: Mission, state: GameState): string[] {
  switch (mission.kind) {
    case "choice":
      return availableOptions(mission, state).map((o) => o.id);
    case "investigate":
      return mission.evidence.map((e) => e.id);
    case "build":
      return mission.components.map((c) => c.id);
  }
}

/** How many things the current mission expects the player to select. */
export function requiredSelectionCount(mission: Mission): number {
  switch (mission.kind) {
    case "choice":
      return 1;
    case "investigate":
      return mission.slots;
    case "build":
      return mission.pick;
  }
}

/** Has the player made their selection? Prediction is a separate gate. */
export function selectionComplete(state: GameState, content: Content): boolean {
  const node = getNode(content, state.nodeId);
  if (!isMission(node) || state.phase !== "decide") return false;
  return state.selection.length === requiredSelectionCount(node);
}

export function canCommit(state: GameState, content: Content): boolean {
  return selectionComplete(state, content) && state.prediction !== null;
}

/** Toggle an id in the current selection, respecting the mission's limit. */
export function toggleSelection(state: GameState, content: Content, id: string): GameState {
  const node = getNode(content, state.nodeId);
  if (!isMission(node) || state.phase !== "decide") return state;

  const limit = requiredSelectionCount(node);
  const already = state.selection.includes(id);

  // Changing your mind about the choice invalidates the call you made about it.
  if (already) {
    return { ...state, selection: state.selection.filter((s) => s !== id), prediction: null };
  }
  if (limit === 1) {
    // Single-pick missions swap rather than block — less fiddly for the player.
    return { ...state, selection: [id], prediction: null };
  }
  if (state.selection.length >= limit) return state;
  return { ...state, selection: [...state.selection, id], prediction: null };
}

/**
 * Chapter 0 — take your starting advantage and begin.
 *
 * Not a decision with a consequence, so it does not go through `commit`: there is
 * nothing to resolve and nothing to learn from yet. The PRD's point is ownership —
 * "a beginning state is much stronger than a tutorial" (p. 55).
 */
export function chooseSetup(state: GameState, content: Content, optionId: string): GameState {
  const node = getNode(content, state.nodeId);
  if (node.kind !== "setup" || state.phase !== "setup") return state;
  const option = node.options.find((o) => o.id === optionId);
  if (!option) return state;

  const applied = applyEffect(
    { dims: option.dims, flags: option.flags },
    state.dims,
    state.flags,
    state.badges,
  );
  return enterNode(
    { ...state, dims: applied.dims, flags: applied.flags, badges: applied.badges },
    content,
    node.next,
  );
}

/** Record the player's call on which dimension this will cost most. */
export function setPrediction(state: GameState, dim: DimensionId): GameState {
  if (state.phase !== "decide") return state;
  return { ...state, prediction: state.prediction === dim ? null : dim };
}

/**
 * Which dimension moved least.
 *
 * The prediction gate used to ask which dimension this would HURT, which has no answer
 * on the 27-of-85 outcomes where nothing goes backwards — so on most of the game's good
 * beats the player's committed claim was discarded and a compliment shown instead.
 * "Moves least" is always answerable, so the gate now pays off everywhere.
 */
export function leastMoved(deltas: Record<DimensionId, number>): DimensionId {
  return DIMENSIONS.reduce((a, b) => (deltas[a] <= deltas[b] ? a : b));
}

/* ───────────────────────────── resolution ───────────────────────────── */

function selectionEffects(
  mission: Mission,
  selection: readonly string[],
): { effect: Effect; revealed: Evidence[]; label: string } {
  const dims = zeroDims();
  const flags: string[] = [];
  const revealed: Evidence[] = [];
  const labels: string[] = [];

  if (mission.kind === "investigate") {
    for (const id of selection) {
      const ev = mission.evidence.find((e) => e.id === id);
      if (!ev) continue;
      revealed.push(ev);
      labels.push(ev.label);
      for (const f of ev.flags ?? []) if (!flags.includes(f)) flags.push(f);
    }
  }

  if (mission.kind === "build") {
    for (const id of selection) {
      const c: Component | undefined = mission.components.find((x) => x.id === id);
      if (!c) continue;
      labels.push(c.title);
      for (const f of c.flags ?? []) if (!flags.includes(f)) flags.push(f);
      for (const d of DIMENSIONS) {
        const delta = c.dims?.[d];
        if (delta !== undefined) dims[d] += delta;
      }
    }
  }

  if (mission.kind === "choice") {
    const opt = mission.options.find((o) => o.id === selection[0]);
    if (opt) labels.push(opt.title);
  }

  return { effect: { dims, flags }, revealed, label: labels.join(" + ") };
}

/**
 * Commit the current selection.
 *
 * Order matters and is deliberate:
 *   1. apply the selection's own effects (component stats, evidence flags)
 *   2. select the outcome against that updated state — so an outcome can react to
 *      what the player just discovered or built
 *   3. apply the outcome's effects
 */
export function commit(state: GameState, content: Content): GameState {
  const node = getNode(content, state.nodeId);
  if (!isMission(node) || state.phase !== "decide") return state;
  if (state.selection.length !== requiredSelectionCount(node)) return state;

  const dimsBefore = { ...state.dims };

  const sel = selectionEffects(node, state.selection);
  const afterSelection = applyEffect(sel.effect, state.dims, state.flags, state.badges);

  const candidates: readonly Outcome[] =
    node.kind === "choice"
      ? (node.options.find((o) => o.id === state.selection[0])?.outcomes ?? [])
      : node.outcomes;

  const outcome = selectOutcome(candidates, afterSelection.flags, afterSelection.dims);

  const afterOutcome = applyEffect(
    outcome.effect,
    afterSelection.dims,
    afterSelection.flags,
    afterSelection.badges,
  );

  const deltas = zeroDims();
  for (const d of DIMENSIONS) deltas[d] = afterOutcome.dims[d] - dimsBefore[d];

  const lesson = outcome.lesson ?? node.lesson;

  const resolution: Resolution = {
    outcome,
    chosenLabel: sel.label,
    lesson,
    dimsBefore,
    dimsAfter: afterOutcome.dims,
    deltas,
    newBadges: [...afterSelection.newBadges, ...afterOutcome.newBadges],
    revealed: sel.revealed,
    predicted: state.prediction,
    actualWorst: leastMoved(deltas),
  };

  const entry: HistoryEntry = {
    missionId: node.id,
    missionTitle: node.title,
    stage: node.stage,
    chapter: node.chapter,
    chosenLabel: sel.label,
    chosenIds: [...state.selection],
    outcomeId: outcome.id,
    tone: outcome.tone,
    headline: outcome.headline,
    lesson,
    dimsBefore,
    dimsAfter: afterOutcome.dims,
  };

  return {
    ...state,
    phase: "resolving",
    dims: afterOutcome.dims,
    flags: afterOutcome.flags,
    badges: afterOutcome.badges,
    discovered: [...state.discovered, ...sel.revealed.map((e) => e.id)],
    resolution,
    history: [...state.history, entry],
    completed: state.completed.includes(node.id) ? state.completed : [...state.completed, node.id],
  };
}

/** Move the game forward one beat. */
export function advance(state: GameState, content: Content): GameState {
  const node = getNode(content, state.nodeId);

  switch (state.phase) {
    case "title":
      return enterNode(state, content, content.startNodeId);

    case "interlude":
      return node.kind === "interlude" ? enterNode(state, content, node.next) : state;

    case "resolving":
      return { ...state, phase: "consequence" };

    case "consequence": {
      if (!isMission(node)) return state;
      // A branch may divert the whole game — walking away from the deal skips delivery.
      const to = state.resolution?.outcome.next ?? node.next;
      return enterNode(state, content, to);
    }

    case "setup":
    case "decide":
    case "ending":
      return state;
  }
}

export function restart(content: Content): GameState {
  return createInitialState(content);
}

/* ───────────────────────────── the ledger ───────────────────────────── */

/**
 * What you have actually committed to, in the language of the work.
 *
 * The three dimensions are an abstraction; this is the concrete account behind them —
 * what you know, what you have promised, what you have spent. It exists because a score
 * invites the player to optimise the grader, whereas a ledger invites them to read their
 * own position. Derived entirely from flags, so it cannot disagree with the game state.
 */
export interface LedgerEntry {
  label: string;
  detail: string;
  tone: "good" | "neutral" | "bad";
  /** its own pictogram — the rail was six identical dots before */
  icon: IconId;
}

interface LedgerRule extends LedgerEntry {
  when: Condition;
}

const LEDGER_RULES: LedgerRule[] = [
  // What you know
  {
    when: { all: ["knows:real_pain"] },
    label: "Their real problem",
    detail: "The damage is post-purchase, not in-store. You have their complaint data.",
    tone: "good",
    icon: "search",
  },
  {
    when: { all: ["knows:ops_constraint"] },
    label: "Who can stop this",
    detail: "Marcus Reed owns every system that would have to change.",
    tone: "good",
    icon: "people",
  },
  {
    when: { all: ["knows:rival_gap"] },
    label: "The rival's blind spot",
    detail: "Their platform does nothing about deliveries, returns or support.",
    tone: "good",
    icon: "scale",
  },
  {
    when: { all: ["knows:history"] },
    label: "The last attempt",
    detail: "Cancelled at month five when Operations refused the changes.",
    tone: "neutral",
    icon: "clock",
  },
  // Where you stand
  {
    when: { all: ["ops_onside"] },
    label: "Operations invested",
    detail: "Marcus has people named in the proposal. He has a stake in it working.",
    tone: "good",
    icon: "check",
  },
  {
    when: { all: ["evidenced"] },
    label: "Argued from their data",
    detail: "Your position is defensible without you in the room.",
    tone: "good",
    icon: "chart",
  },
  {
    when: { all: ["has_access"] },
    label: "Inside the business",
    detail: "Paid discovery bought you access nobody else has.",
    tone: "good",
    icon: "target",
  },
  // What you have spent
  {
    when: { all: ["discounted"] },
    label: "Discount given",
    detail: "The contingency is gone. There is nothing to absorb a problem with.",
    tone: "bad",
    icon: "coins",
  },
  {
    when: { all: ["descoped"] },
    label: "Scope removed",
    detail: "Something load-bearing left the contract to reach their number.",
    tone: "bad",
    icon: "cross",
  },
  {
    when: { all: ["risk_accepted"] },
    label: "Risk accepted",
    detail: "Documented, unmanaged, and on the record that you knew.",
    tone: "bad",
    icon: "warning",
  },
  {
    when: { all: ["thin_mitigation"] },
    label: "Mitigation underfunded",
    detail: "Thinner than the review asked for. No margin for error.",
    tone: "bad",
    icon: "layers",
  },
  // What you have promised
  {
    when: { all: ["scope:heavy"] },
    label: "Platform rebuild promised",
    detail: "The systems at the centre of their operation.",
    tone: "neutral",
    icon: "clock",
  },
  {
    when: { all: ["promised:fast"] },
    label: "Eight weeks promised",
    detail: "Something live and demonstrable, with a board watching.",
    tone: "neutral",
    icon: "block",
  },
  {
    when: { all: ["unanchored"] },
    label: "No route to production",
    detail: "Nothing in the proposal says how the changes reach the business.",
    tone: "bad",
    icon: "warning",
  },
  {
    when: { all: ["fragile_timeline"] },
    label: "Timeline assumes access",
    detail: "Nobody has confirmed the data exists in a usable form.",
    tone: "bad",
    icon: "clock",
  },
];

export function ledger(state: GameState): LedgerEntry[] {
  return LEDGER_RULES.filter((r) => evaluateCondition(r.when, state.flags, state.dims)).map(
    ({ label, detail, tone, icon }) => ({ label, detail, tone, icon }),
  );
}

/* ───────────────────────────── debrief ───────────────────────────── */

export interface DebriefLine {
  stage: string;
  title: string;
  chosen: string;
  headline: string;
  tone: string;
}

/**
 * The causal threads the player actually lived.
 *
 * This is the payoff of the whole design — the "oh, THAT is why" moment. It is
 * derived, not authored per-run: each thread declares the pair of things that
 * must have happened, so a thread can only appear if the player genuinely
 * caused it. Nothing here is generated or approximate.
 */
export interface CausalThread {
  because: string;
  soLater: string;
}

interface ThreadRule extends CausalThread {
  needsOutcomes: string[];
  needsFlags?: string[];
}

const THREAD_RULES: ThreadRule[] = [
  {
    needsOutcomes: ["m8-discount", "m9-mitigate-broke"],
    because: "You met the client on price to close the gap.",
    soLater:
      "When the review found a real risk, the money that would have covered it had already been spent winning the deal.",
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
    soLater:
      "When delivery needed to be re-planned, Operations was already invested — so a hard conversation was treated as management rather than failure.",
  },
  {
    needsOutcomes: ["m7-overreach", "m10-push-fragile"],
    because: "You promised to rebuild the systems at the centre of their operation with no route into production.",
    soLater:
      "Something shipped on the promised date that could not actually reach the business it was built for.",
  },
  {
    needsOutcomes: ["m2-both", "m6-real-evidenced"],
    because: "You spent your two questions on the complaints and on who actually decides.",
    soLater:
      "You could open the solution conversation with their own evidence, which is why nobody argued with you.",
  },
];

/**
 * A thread needs at least two outcomes.
 *
 * Four rules used to fire on a single outcome, so a section introduced as "the chains
 * your own decisions created" presented one decision restated as a chain — and one of
 * them simply paraphrased its own outcome's detail text. Two genuine threads read as
 * authored; nine restatements read as padding.
 */
export function causalThreads(state: GameState): CausalThread[] {
  const fired = new Set(state.history.map((h) => h.outcomeId));
  const out: CausalThread[] = [];
  for (const rule of THREAD_RULES) {
    if (!rule.needsOutcomes.every((id) => fired.has(id))) continue;
    if (rule.needsFlags && !rule.needsFlags.every((f) => state.flags.includes(f))) continue;
    out.push({ because: rule.because, soLater: rule.soLater });
  }
  return out.slice(0, 3);
}

/** Overall read on the engagement, from the final dimensions and how it ended. */
export function finalVerdict(
  dims: Record<DimensionId, number>,
  flags: readonly string[] = [],
): { title: string; summary: string } {
  const { win, profit, deliver } = dims;

  if (flags.includes("walked_away")) {
    return {
      title: "You walked away",
      summary:
        "No contract, no delivery, and your people are free. Whether that was discipline or timidity depends entirely on what the deal had become by the time you looked at it honestly.",
    };
  }
  const lowest = DIMENSIONS.reduce((a, b) => (dims[a] <= dims[b] ? a : b));
  const avg = Math.round((win + profit + deliver) / 3);

  if (win < 40) {
    return {
      title: "You did not win the work",
      summary:
        "The client went elsewhere. That is a real outcome, and often the right one — the question worth asking is whether you lost it on price, on understanding, or on trust.",
    };
  }
  if (deliver < 35) {
    return {
      title: "You won it, and it hurt",
      summary:
        "The contract was signed and then delivery paid for it. Everything you promised became someone else's problem — which is exactly how a won deal turns into a lost client.",
    };
  }
  if (profit < 35) {
    return {
      title: "You won it, but not well",
      summary:
        "You have the logo and very little else. Work that cannot be run at a sensible margin crowds out work that can.",
    };
  }
  if (avg >= 62) {
    return {
      title: "A deal worth having",
      summary:
        "You won work you understood, priced honestly and could deliver. All three at once is unusual.",
    };
  }
  return {
    title: "A workable deal",
    summary: `You got it over the line with compromises, and ${
      lowest === "win" ? "winability" : lowest === "profit" ? "profitability" : "deliverability"
    } took most of the strain. Which one gave was a choice you made, several times.`,
  };
}
