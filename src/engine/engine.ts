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
  type SaidQuote,
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
  // A mission opens on its brief; the options come after it.
  return { ...base, phase: "brief" };
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

/**
 * Who is quoted on this brief, given what the player has found out.
 *
 * First matching `quotes` entry wins; `saidQuote` is the unconditional fallback. See
 * `Mission.quotes` for why the conditional list exists at all — the short version is that
 * Marcus Reed must not introduce himself to a player who never asked who he was.
 */
export function resolveSaidQuote(mission: Mission, state: GameState): SaidQuote | undefined {
  for (const q of mission.quotes ?? []) {
    if (evaluateCondition(q.when, state.flags, state.dims)) {
      return { text: q.text, speaker: q.speaker, role: q.role };
    }
  }
  return mission.saidQuote;
}

/**
 * What the colleague says here, given what the player has done.
 *
 * A bare string means "always this", which is what 78 of 78 utterances were. An array is
 * first-match-wins, like every other conditional surface in this content.
 */
export function resolveAdvisorLine(mission: Mission, state: GameState): string | undefined {
  const line = mission.advisorLine;
  if (typeof line === "string" || line === undefined) return line;
  for (const l of line) {
    if (evaluateCondition(l.when, state.flags, state.dims)) return l.text;
  }
  return undefined;
}

/** Options whose `requires` condition passes. Others are not shown at all. */
export function availableOptions(mission: Mission, state: GameState): Option[] {
  if (mission.kind !== "choice") return [];
  return mission.options.filter((o) => evaluateCondition(o.requires, state.flags, state.dims));
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

  /**
   * A single-pick option cannot be un-picked.
   *
   * It used to be: activating the selected card cleared the selection. That is wrong for
   * a set where exactly one must be chosen, and it became visible when the option group
   * gained radio semantics — a radio cannot be unchecked by activating it, so Space on
   * the checked card left the group with nothing selected while still announcing itself
   * as a radiogroup. Re-selecting is now a no-op, which is also what the keyboard's
   * selection-follows-focus behaviour needs.
   */
  if (already && limit === 1) return state;

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
 * Which dimension moved least — smallest movement in either direction.
 *
 * The prediction gate used to ask which dimension this would HURT, which has no answer
 * on the 27-of-85 outcomes where nothing goes backwards — so on most of the game's good
 * beats the player's committed claim was discarded and a compliment shown instead.
 * "Moves least" is always answerable, so the gate now pays off everywhere.
 *
 * The magnitude matters: comparing signed deltas answers the OLD question, returning
 * whichever dimension fell furthest. That shipped, and it meant the screen said
 * "Profitability barely moved" beside a tile reading −14. On the 88 authored outcomes
 * the signed comparison names a falling dimension 61 times and contradicts the printed
 * question 52 times, so the one place the player's reasoning is tested returned noise.
 */
export function leastMoved(deltas: Record<DimensionId, number>): DimensionId {
  return leastMovedSet(deltas)[0] as DimensionId;
}

/**
 * EVERY dimension tied for the smallest movement — which is the honest answer, because
 * the question has more than one on 12 of the 88 authored outcomes.
 *
 * Returning a single winner made the tie-break carry meaning it cannot carry. `reduce`
 * keeps the earlier element on a tie and `DIMENSIONS` starts with `win`, so six of those
 * twelve silently keyed to Winability, and "always answer Winability" scored well above
 * chance. Worse, a meter-greedy run clamps all three meters at 100 by mission 14, after
 * which every remaining beat moves nothing at all — and the screen told the player
 * "Winability held" about a beat in which literally nothing did.
 */
export function leastMovedSet(deltas: Record<DimensionId, number>): DimensionId[] {
  const smallest = Math.min(...DIMENSIONS.map((d) => Math.abs(deltas[d])));
  return DIMENSIONS.filter((d) => Math.abs(deltas[d]) === smallest);
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
 *
 * A commit lands on `consequence`, not on `resolving`. It used to take the phase between
 * them, and that phase was a screen: one second of "seeing what happens…" holding 17 of a
 * run's 76 screen instances (`docs/SCREEN-TAXONOMY.md` §3). The meters' travel was the
 * only thing it carried and `ConsequenceScreen` now animates that on arrival from
 * `resolution.dimsBefore`, so the beat has nothing left to do but be in the way.
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
    actualLeastMoved: leastMoved(deltas),
    /* The verdict is the engine's to decide, not the component's: a prediction is right
       if it names ANY dimension tied for the smallest movement. */
    predictionCorrect: state.prediction ? leastMovedSet(deltas).includes(state.prediction) : null,
    nothingMoved: DIMENSIONS.every((d) => deltas[d] === 0),
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
    /* Carried into permanent history so mastery is stable after the beat ends. */
    predictionCorrect: resolution.predictionCorrect,
  };

  return {
    ...state,
    phase: "consequence",
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

    case "brief":
      return isMission(node) ? { ...state, phase: "decide" } : state;

    /**
     * Nothing produces this phase any more, and it is handled anyway.
     *
     * `commit` lands on `consequence` directly, so no run this build plays can be here.
     * A save written by an earlier build can be, and `decodeSave` rewrites it at the load
     * boundary — which is the fix, because a state the interface has no screen for is a
     * dead end no matter what `advance` would have done with it. This case stays as the
     * backstop for anything that reaches the engine by another road (a hand-edited save,
     * a future migration that forgets): forward to the beat the state is already holding
     * the resolution for, rather than silently refusing to move.
     */
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

/**
 * THE RULE THIS TABLE EXISTS TO KEEP: nothing may decide a branch without appearing here.
 *
 * Measured rather than asserted. 29 flags gate a branch somewhere in the story — they
 * appear in an `outcome.when` or an `option.requires` — and 14 of them appeared in no rule
 * in this table. So on those 14 the game silently branched on something it had never shown
 * the player, and a player who then asks "why did that happen?" cannot tell a reasoning
 * error from an information gap. That distinction is the whole teaching mechanism: every
 * outcome has to be attributable, and an outcome turning on invisible state is not.
 *
 * The eleven rules marked `// 4.2` close that gap: 14 invisible gating flags before, 3
 * after. "High traffic" is a measurement, not a judgement — walking every reachable state
 * and toggling each gating flag at each mission counts the visits where that one flag
 * alone changes which outcome fires or which options are offered. The eleven below score
 * 11,960 to 51,144 decisive visits. The three left out score 227, 40 and 0, so the cut
 * line is a 53× drop rather than a preference; `engine.test.ts` pins them with a reason
 * each, so the list cannot grow quietly.
 *
 * TWO CONSTRAINTS ON ANYTHING ADDED HERE
 *
 *  1. **An entry states a POSITION. It never predicts an outcome.** "You overruled the
 *     review" is a position; "this will cost you in delivery" is the consequence screen's
 *     job and telling the player early removes the decision. `validateContent` runs the
 *     same leak check over these strings that it runs over every pre-decision field, so
 *     this is enforced rather than remembered.
 *  2. **Never a bare restatement of the flag name.** A rail row reading "Reviewed" tells
 *     a player nothing they can act on. Each entry names the position in the language of
 *     the work and says what it is worth, or what it costs.
 *
 * WHAT IT COSTS THE LAYOUT, measured rather than guessed: the worst case goes from 13
 * entries to 21, over the same walk in both cases. Read 21 as a floor, not a ceiling —
 * the walk dedupes states on the flags a later mission still reads, so two states that
 * differ only in a flag nothing will read again collapse, and the survivor may be the one
 * with the shorter account. The structural ceiling is 29: every rule at once, less two of
 * the three mutually exclusive ways of getting in.
 *
 * The rail is uncapped, so nothing breaks — but a 21-row account is a scroll, and the
 * group comments below are the seams to cut along if it has to be paged or collapsed by
 * section. The last three rules added (measurement, adoption, payback) are the marginal
 * ones; deleting them costs 3 rows and reopens 3 gates in the handover beat.
 *
 * Order is rail order, and the groups below are the account: how you got in, the award,
 * what you know, where you stand, what you have spent, what you have promised.
 */
export const LEDGER_RULES: LedgerRule[] = [
  /* How you got in. Exactly one of these always matches, so the opening choice stays
     on screen for the whole engagement instead of being a screen the player passes
     through. It is kept separate from the capability it grants, because `knows:rivals`
     can also be earned later in mission 1 — "started as the challenger" and "found out
     afterwards" are different positions and the ledger should not merge them. */
  {
    when: { all: ["start:connector"] },
    label: "You got in on trust",
    detail: "They took your call. Nobody has yet asked you to prove you can build it.",
    tone: "neutral",
    icon: "talk",
  },
  {
    when: { all: ["start:builder"] },
    label: "You got in on evidence",
    detail: "You have done this work before. Selling it is the part you are worse at.",
    tone: "neutral",
    icon: "layers",
  },
  {
    when: { all: ["start:challenger"] },
    label: "You got in on the argument",
    detail: "You read the field and said the awkward thing. You are not yet trusted inside it.",
    tone: "neutral",
    icon: "scale",
  },
  /* The award, and what it was won on.
     `won` and `knows:criteria` could have been listed as narrative-only flags — the
     cheap option, and the wrong one. What you were chosen for is exactly the sort of
     thing a pursuit lead should be able to read off their own position, and knowing the
     evaluation criteria is an asset you carry into the next bid. Putting them here also
     means `ENGINE_READ_FLAGS` picks them up for free, since it is derived from these
     tables rather than hand-listed. */
  {
    when: { all: ["won"] },
    label: "They chose you",
    detail: "The award is yours. Everything after this is about keeping what you said.",
    tone: "good",
    icon: "check",
  },
  {
    when: { all: ["knows:criteria"] },
    label: "How you were scored",
    detail: "You have their evaluation criteria and the weightings. Most bidders never ask.",
    tone: "good",
    icon: "scale",
  },
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
  /* 4.2 — three Operations rows, and they are three different things.
     `ops_engaged` is a meeting, `ops_onside` is a stake, `has:ops_workstream` is a funded
     line in the proposal, and none of the three implies another: `ops_onside` is granted
     at m7 to a player who never met Marcus, and a player who spent a workshop on him can
     still propose nothing he can use. They read as near-duplicates on the rail and were
     nearly merged for that reason — which would have been the wrong fix, because the gap
     between "we have talked" and "they are invested" is one of the things this game is
     about, and m9, m9b and m10c all branch on which of them you actually have. */
  {
    when: { all: ["ops_engaged"] },
    label: "Operations is in the room",
    detail: "Marcus and his leads have met you, before anything was written down.",
    tone: "good",
    icon: "people",
  },
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
  /* 4.2 — the pair that `evidenced` above is deliberately next to. Being believed and
     being able to prove it are different assets, they are spent in different rooms, and
     six branches choose between them. */
  {
    when: { all: ["credibility"] },
    label: "They take your word",
    detail: "Your read of their business is trusted before it is proven. Not the same as evidence.",
    tone: "good",
    icon: "spark",
  },
  /* 4.2 — the reframe. Four of m9a's five losing branches fire on its absence, which
     makes this the most consequential single flag in the game to leave off the rail. */
  {
    when: { all: ["reframed"] },
    label: "You chose the ground",
    detail: "The comparison is about post-purchase now, where the rival's demo says nothing.",
    tone: "good",
    icon: "flag",
  },
  /* 4.2 — the two halves of the internal review, adjacent on purpose: the fork is only
     legible if both of its arms can appear in the same list. */
  {
    when: { all: ["reviewed"] },
    label: "The review is answered",
    detail: "You spent the week the reviewers asked for. Nothing was overruled to get here.",
    tone: "good",
    icon: "shield",
  },
  {
    when: { all: ["overrode_review"] },
    label: "You overruled the review",
    detail: "Their objections are in writing. Every gap they named belongs to you now.",
    tone: "bad",
    icon: "megaphone",
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
  /* 4.2 — what the proposal actually funds: the three unglamorous lines from m7, and the
     highest-traffic invisible state in the game. `has:ops_workstream` alone decides a
     branch on 51,144 reachable visits.
     These three are one group because the handover beat asks about them as one: Aisha's
     "the training, the integration stream, the measurement work" is an option gated on
     exactly these flags, and an option the player cannot take because of something the
     game never showed them reads as a shorter list rather than as a consequence. */
  {
    when: { all: ["has:ops_workstream"] },
    label: "A route into Operations",
    detail: "The proposal pays for getting changes into their release schedule, with their people.",
    tone: "good",
    icon: "rocket",
  },
  {
    when: { all: ["has:data"] },
    label: "Measurement is covered",
    detail: "You know their order and returns data is usable, and something instruments it.",
    tone: "good",
    icon: "chart",
  },
  {
    when: { all: ["has:training"] },
    label: "Adoption is funded",
    detail: "Training for the people who use it daily — and the cheapest line to cut later.",
    tone: "good",
    icon: "bulb",
  },
  /* 4.2 — the third answer to "who can answer a delivery question", and the last of that
     triad to reach the rail. `ops_onside`, `has:ops_workstream` and `has:partner` are what
     the handover's `o-deliverer` gates on, as alternatives; two of the three were already
     visible, so a partnered player saw Aisha's card open for a reason the game had never
     named. It is a bought capability rather than an earned one, which is why it reads
     `neutral` beside their `good` — the margin went somewhere. */
  {
    when: { all: ["has:partner"] },
    label: "A partner who does this",
    detail: "Delivery capability you did not have, on a margin you now share.",
    tone: "neutral",
    icon: "people",
  },
  /* 4.2 — the payback clause. A commercial position rather than a scope one, and the only
     promise in the game whose price is paid in month nine by somebody counting. */
  {
    when: { all: ["outcome_based"] },
    label: "A payback number, in writing",
    detail: "What you earn moves with the fall in support contacts. Somebody has to count it.",
    tone: "neutral",
    icon: "coins",
  },
  /* 4.2 — the counterpart to the rebuild above, and the reason a premium may not hold at
     m8: if the scope is the brief as written, there is nothing in it that is hard to
     compare. Neutral, not bad — proposing what a client asked for is a defensible thing
     to have done, and the rail is an account, not a verdict. */
  {
    when: { all: ["scope:storefront"] },
    label: "Their brief, as written",
    detail: "The storefront work they asked for. The rival is bidding the same thing.",
    tone: "neutral",
    icon: "scale",
  },
  {
    when: { all: ["promised:fast"] },
    label: "Eight weeks promised",
    detail: "Something live and demonstrable, with a board watching.",
    tone: "neutral",
    icon: "block",
  },
  /* 4.2 — how big the first commitment is. Separate from `has_access` above, which is the
     access a paid discovery bought: declining the programme lands this without it. */
  {
    when: { all: ["landed_small"] },
    label: "A narrow first job",
    detail: "The first commitment is a small one, not the programme they first described.",
    tone: "neutral",
    icon: "coins",
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



/**
 * A thread needs at least two outcomes.
 *
 * Four rules used to fire on a single outcome, so a section introduced as "the chains
 * your own decisions created" presented one decision restated as a chain — and one of
 * them simply paraphrased its own outcome's detail text. Two genuine threads read as
 * authored; nine restatements read as padding.
 */
export function causalThreads(state: GameState, content: Content): CausalThread[] {
  const fired = new Set(state.history.map((h) => h.outcomeId));
  const out: CausalThread[] = [];
  for (const rule of content.threads) {
    if (!rule.needsOutcomes.every((id) => fired.has(id))) continue;
    if (rule.needsFlags && !rule.needsFlags.every((f) => state.flags.includes(f))) continue;
    out.push({ because: rule.because, soLater: rule.soLater });
  }
  return out.slice(0, 3);
}

/**
 * Flags the ENGINE branches on, as opposed to content conditions.
 *
 * `validate.ts` finds dead flags by collecting everything content writes and subtracting
 * everything content reads. A flag only the engine reads therefore looks dead — and a
 * warning known to be false is a warning nobody reads, which is how fifteen of these hid
 * the two that were genuinely dead.
 *
 * Derived from the rule tables rather than hand-listed, because a hand-listed allowlist
 * suppresses a real check the moment a ledger rule is deleted and its entry left behind.
 */
export const ENGINE_READ_FLAGS: ReadonlySet<string> = new Set([
  // the final verdict's two branches
  "walked_away",
  "lost",
  ...LEDGER_RULES.flatMap((r) => [
    ...(r.when.all ?? []),
    ...(r.when.any ?? []),
    ...(r.when.none ?? []),
  ]),
  /* The thread table moved to content, so its `needsFlags` are no longer visible from
     here — a module-level constant in the engine cannot read content without a cycle.
     `validateContent` therefore seeds them itself from `content.threads`, which is the
     right place for it: it is the only thing that holds both sides. */
]);

/**
 * The mean of the three meters — the single number the game has ever called "Score".
 *
 * It lived in `src/ui/shell.tsx`, which `CLAUDE.md` forbids in one line: "`src/ui` holds
 * no game rules… a component that computes a consequence or decides a branch is a bug."
 * Collapsing three meters into one figure is a rule, and a consequential one: it decides
 * what the player is told they achieved, and it is the number the engagement gate marks
 * every policy against.
 *
 * Two copies existed. `engagement.ts` carried a private `meanOfMeters` with a comment
 * saying exactly this, because the engine may not import from the UI — so the rule the
 * gate measured against was a *reimplementation* of the rule the screen showed, and
 * nothing would have failed had the two drifted. The rounding alone is enough to part
 * them: `Math.round(sum / 3)` and `Math.round(a/3 + b/3 + c/3)` disagree on real inputs.
 *
 * Kept as a mean rather than the weighted read the ledger implies, because that is what
 * shipped and this move is not the place to change what a number means.
 */
export function scoreOf(dims: Record<DimensionId, number>): number {
  return Math.round(DIMENSIONS.reduce((total, d) => total + dims[d], 0) / DIMENSIONS.length);
}

/** Overall read on the engagement, from the final dimensions and how it ended. */
export function finalVerdict(
  dims: Record<DimensionId, number>,
  flags: readonly string[] = [],
): { title: string; summary: string } {
  const { win, profit, deliver } = dims;

  /**
   * Losing comes first, because it is the one ending whose cause is not in the numbers.
   *
   * A pursuit lost at the award can end with Winability at 85 and every other meter
   * healthy — the old `win < 40` branch below could never carry it, which is why it fired
   * on 0.15% of runs while the game had no losing beat at all. This reads the flag the
   * award decision sets, so the verdict matches what happened rather than inferring it
   * from three numbers that stopped moving.
   */
  if (flags.includes("lost")) {
    return {
      title: "They chose someone else",
      summary:
        "Somebody had to justify this choice in writing, and you did not give them the argument. That is the whole job of a pursuit: not to be the best firm in the room, but to be the one they can defend picking. The work you did was real. It was not, in the end, distinguishable.",
    };
  }

  if (flags.includes("walked_away")) {
    return {
      title: "You walked away",
      summary:
        "No contract, no delivery, and your people are free. Whether that was discipline or timidity depends entirely on what the deal had become by the time you looked at it honestly.",
    };
  }
  const lowest = DIMENSIONS.reduce((a, b) => (dims[a] <= dims[b] ? a : b));

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
  /**
   * "All three at once is unusual" — so it must actually require all three.
   *
   * This was `avg >= 62`, and an average is exactly the wrong test for a verdict whose
   * own summary claims all three held. A run at 100 / 45 / 45 averages 63 and was told it
   * was a deal worth having, while its margin and its deliverability were both a
   * coin-flip from the failure branches twelve lines above. It is also why uniform-random
   * play earned this ending 46% of the time: with three meters starting at 50 and 17
   * mostly-positive beats, an average is nearly free, whereas a floor on the WORST meter
   * is not.
   *
   * 58 rather than 62 on each: a lower bar per meter, a much harder bar to clear on all
   * three. Measured effect on random play is in D-043.
   */
  if (Math.min(win, profit, deliver) >= 58) {
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
