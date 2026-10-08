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
  type CausalThreadRule,
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
  type Lever,
  type LeverMission,
  type LeverOption,
  type Mission,
  type Option,
  type Outcome,
  type Resolution,
  type SaidQuote,
} from "./types";

export const START_DIMS: Record<DimensionId, number> = { win: 50, profit: 50, deliver: 50 };

/**
 * FNV-1a, 32-bit. Not cryptographic and does not need to be: it guards typos and drift,
 * and orders the debrief's claim candidates.
 *
 * It lives here rather than in `runcode.ts`, where it was written, because the engine now
 * needs it too and `runcode` already imports the engine — the other direction is a cycle.
 */
export function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

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

/**
 * Apply a list of effects in order, each clamped as it lands.
 *
 * One step for every kind but `levers`, which is one step per lever: the contract
 * (`docs/LEVERS.md`) applies each chosen setting "in lever order", and the order is only
 * observable at the clamp — a +5 then a −5 from 98 ends at 95, the same two summed first
 * would end at 98. Each lever's movement is a separate, attributable write, so it is
 * applied as one.
 */
function applySteps(
  steps: readonly Effect[],
  dims: Record<DimensionId, number>,
  flags: readonly string[],
  badges: readonly BadgeId[],
): Applied {
  let acc: Applied = { dims: { ...dims }, flags: [...flags], badges: [...badges], newBadges: [] };
  for (const step of steps) {
    const next = applyEffect(step, acc.dims, acc.flags, acc.badges);
    acc = { ...next, newBadges: [...acc.newBadges, ...next.newBadges] };
  }
  return acc;
}

/* ───────────────────────────── levers ───────────────────────────── */

/**
 * Which bars a setting moves, and which way — never by how much.
 *
 * The *Reigns* dot, and the reason a lever panel can be telegraphed without breaking G3:
 * this is the immediate, deterministic effect of the setting itself, which lands whatever
 * the outcome turns out to be. The outcome stays unpreviewed. Zero entries are omitted, so
 * an empty object means "this setting moves no bar on its own".
 */
export function leverTouches(option: LeverOption): Partial<Record<DimensionId, 1 | -1>> {
  const out: Partial<Record<DimensionId, 1 | -1>> = {};
  for (const d of DIMENSIONS) {
    const v = option.dims?.[d];
    if (v === undefined || v === 0 || Number.isNaN(v)) continue;
    out[d] = v > 0 ? 1 : -1;
  }
  return out;
}

/** The lever an option id belongs to, or undefined if no lever on this mission has it. */
export function leverOf(mission: LeverMission, optionId: string): Lever | undefined {
  return mission.levers.find((l) => l.options.some((o) => o.id === optionId));
}

/**
 * The settings a selection makes, in lever order — at most one per lever.
 *
 * Lever order rather than selection order, so the history, the label and the commit bar
 * read the same however the player happened to click: "Hold · Drop the pilot · Ask for a
 * named lead". A lever with nothing selected contributes nothing; `selectionComplete`
 * refuses to commit in that case, so a committed selection always yields one per lever.
 */
export function leverSettings(mission: LeverMission, selection: readonly string[]): LeverOption[] {
  const out: LeverOption[] = [];
  for (const lever of mission.levers) {
    const chosen = lever.options.find((o) => selection.includes(o.id));
    if (chosen) out.push(chosen);
  }
  return out;
}

/** Is this setting open in this state? A locked one is shown, named and unselectable. */
export function leverOptionOpen(option: LeverOption, state: GameState): boolean {
  return evaluateCondition(option.requires, state.flags, state.dims);
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
    case "levers":
      /* One setting per lever. The count alone is not sufficient — two settings of one
         lever is the right number and the wrong selection — so `selectionComplete` also
         checks that every lever is covered. */
      return mission.levers.length;
  }
}

/** Is the selection complete, distinct and currently available under the authored rules? */
export function selectionComplete(state: GameState, content: Content): boolean {
  const node = getNode(content, state.nodeId);
  if (!isMission(node) || state.phase !== "decide") return false;
  if (state.selection.length !== requiredSelectionCount(node)) return false;
  if (new Set(state.selection).size !== state.selection.length) return false;
  const legal = selectableIds(node, state);
  if (!state.selection.every((id) => legal.includes(id))) return false;
  if (node.kind === "levers") {
    return node.levers.every(
      (l) => l.options.filter((o) => state.selection.includes(o.id)).length === 1,
    );
  }
  return true;
}

function selectableIds(mission: Mission, state: GameState): string[] {
  switch (mission.kind) {
    case "choice":
      return availableOptions(mission, state).map((o) => o.id);
    case "investigate":
      return mission.evidence.map((e) => e.id);
    case "build":
      return mission.components.map((c) => c.id);
    case "levers":
      return mission.levers.flatMap((l) =>
        l.options.filter((o) => leverOptionOpen(o, state)).map((o) => o.id),
      );
  }
}

export function canCommit(state: GameState, content: Content): boolean {
  return selectionComplete(state, content);
}

/** Toggle an id in the current selection, respecting the mission's limit. */
export function toggleSelection(state: GameState, content: Content, id: string): GameState {
  const node = getNode(content, state.nodeId);
  if (!isMission(node) || state.phase !== "decide") return state;
  if (!selectableIds(node, state).includes(id)) return state;

  /**
   * A lever is a radio group of its own: setting it replaces that lever's previous
   * setting and leaves the other levers alone. Re-setting the current one is a no-op, for
   * the same reason as a single-pick card below — a radio cannot be unchecked by
   * activating it. The selection is kept in lever order, so what the commit bar lists and
   * what history records are the same sequence whatever the click order.
   */
  if (node.kind === "levers") {
    const lever = leverOf(node, id);
    if (!lever || state.selection.includes(id)) return state;
    const siblings = new Set(lever.options.map((o) => o.id));
    const kept = state.selection.filter((s) => !siblings.has(s));
    return { ...state, selection: leverSettings(node, [...kept, id]).map((o) => o.id) };
  }

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

  if (already) {
    return { ...state, selection: state.selection.filter((s) => s !== id) };
  }
  if (limit === 1) {
    // Single-pick missions swap rather than block — less fiddly for the player.
    return { ...state, selection: [id] };
  }
  if (state.selection.length >= limit) return state;
  return { ...state, selection: [...state.selection, id] };
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

/* ───────────────────────────── resolution ───────────────────────────── */

/**
 * What a selection does on its own, before any outcome is chosen.
 *
 *   steps   — the effects to apply, in order. One for every kind but `levers`, which has
 *             one per lever; see `applySteps` for why the order is observable.
 *   flags   — every flag the steps set, for `outcomeBecause` to tell this decision's own
 *             cards from the ones carried in.
 *   ids     — the selection in its canonical order. Selection order for the older kinds,
 *             which is what history has always recorded; lever order for levers.
 */
function selectionEffects(
  mission: Mission,
  selection: readonly string[],
): { steps: Effect[]; flags: string[]; ids: string[]; revealed: Evidence[]; label: string } {
  if (mission.kind === "levers") {
    const settings = leverSettings(mission, selection);
    const flags: string[] = [];
    for (const o of settings) for (const f of o.flags ?? []) if (!flags.includes(f)) flags.push(f);
    return {
      steps: settings.map((o) => ({ dims: { ...o.dims }, flags: [...(o.flags ?? [])] })),
      flags,
      ids: settings.map((o) => o.id),
      revealed: [],
      label: settings.map((o) => o.label).join(" · "),
    };
  }

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

  return {
    steps: [{ dims, flags }],
    flags,
    ids: [...selection],
    revealed,
    label: labels.join(" + "),
  };
}

/**
 * Commit the current selection.
 *
 * Order matters and is deliberate:
 *   1. apply the selection's own effects (component stats, evidence flags, and each lever
 *      setting's dims and flags in lever order)
 *   2. select the outcome against that updated state — so an outcome can react to
 *      what the player just discovered, built or set
 *   3. apply the outcome's effects
 *
 * `dimsBefore` is taken before step 1, so the resolution's deltas include what the
 * selection itself moved — for a lever decision, the settings' own bars as well as the
 * outcome's.
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
  if (!selectionComplete(state, content)) return state;

  const dimsBefore = { ...state.dims };

  const sel = selectionEffects(node, state.selection);
  const afterSelection = applySteps(sel.steps, state.dims, state.flags, state.badges);

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
    nothingMoved: DIMENSIONS.every((d) => deltas[d] === 0),
  };

  const entry: HistoryEntry = {
    missionId: node.id,
    missionTitle: node.title,
    stage: node.stage,
    chapter: node.chapter,
    chosenLabel: sel.label,
    chosenIds: sel.ids,
    outcomeId: outcome.id,
    tone: outcome.tone,
    headline: outcome.headline,
    lesson,
    dimsBefore,
    dimsAfter: afterOutcome.dims,
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
  return firedThreads(state, content)
    .slice(0, 3)
    .map(({ because, soLater }) => ({ because, soLater }));
}

/** Every rule this run earned, in authored order. */
function firedThreads(state: GameState, content: Content): CausalThreadRule[] {
  const fired = new Set(state.history.map((h) => h.outcomeId));
  return content.threads.filter(
    (r) =>
      r.needsOutcomes.every((id) => fired.has(id)) &&
      (!r.needsFlags || r.needsFlags.every((f) => state.flags.includes(f))),
  );
}

/**
 * The debrief's one causal-claim item — backlog 4.5.
 *
 * "Here is something that happened in month five. Which of your earlier decisions led to
 * it?" Asked BEFORE the threads are revealed, because a section that hands the player
 * every chain for free is a section they read rather than argue with, and the item turns
 * the same content into the one artefact a cohort can disagree over.
 *
 * FOUR THINGS THIS DELIBERATELY IS NOT:
 *
 *  1. **Not scored, and not scoreable.** It returns the answer and nothing else; whoever
 *     renders it confirms and moves on. This game deleted its score because a meter-greedy
 *     policy reached 100/100/100 without reading a word, and a graded quiz at the ending
 *     would reintroduce exactly that, at the one moment the player is finally reflecting
 *     rather than optimising.
 *  2. **Not invented.** The consequence really happened on this run and the answer really
 *     caused it — both come from a thread the player earned. An item about a plausible
 *     consequence would teach a rule the game did not actually apply.
 *  3. **Not random.** No `Math.random` in here, and none is wanted: the run must replay
 *     identically from its code, which is what makes a facilitator's pre-read and an exact
 *     bug repro possible at all. The candidate order is a hash of the run's own outcomes,
 *     so it is stable for a given run and differs between runs — the correct answer does
 *     not sit in the same slot every time.
 *  4. **Not always there.** `null` on a run that earned no thread carrying distractors,
 *     which is the 33.5% that end with no thread at all plus any rule the author has not
 *     given an `insteadOf` to. The caller renders nothing.
 *
 * Only the FIRST eligible thread becomes the item. Three items would be a test; one is a
 * question, and the reviewers who asked for this were explicit that five is where the quiz
 * lives and that there is exactly one of it.
 */
export interface CausalClaim {
  /** what happened, in the language of the debrief */
  soLater: string;
  /** the real cause and its near-misses, in a stable per-run order */
  candidates: { id: string; text: string }[];
  /** which `candidates[].id` actually caused it */
  answerId: string;
}

export function causalClaim(state: GameState, content: Content): CausalClaim | null {
  const rule = firedThreads(state, content).find((r) => (r.insteadOf?.length ?? 0) > 0);
  if (!rule) return null;

  /* Seeded on what the player DID, not on the rule, so two runs that earn the same thread
     by different routes do not present the same arrangement. */
  const seed = [...state.history.map((h) => h.outcomeId)].sort().join("|");
  const texts = [rule.because, ...(rule.insteadOf ?? [])];
  const candidates = texts
    .map((text) => ({ id: `c${fnv1a(text).toString(36)}`, text, at: fnv1a(seed + text) }))
    .sort((a, b) => a.at - b.at)
    .map(({ id, text }) => ({ id, text }));

  return { soLater: rule.soLater, candidates, answerId: `c${fnv1a(rule.because).toString(36)}` };
}

/**
 * Why the consequence on screen is the one that happened — the earlier commitments the
 * selected outcome depended on, read at the consequence beat.
 *
 * This is the game's central promise made visible at the moment it is kept: "if something
 * goes wrong in month five, the player must be able to trace it to the decision that caused
 * it". Before this, the trace existed only in the final review; on the consequence screen
 * the same outcome simply arrived, and the player had to take its causes on trust.
 *
 * It decides nothing. `commit` has already chosen the outcome; this reads that outcome's own
 * condition back against the flags the player carried in. Flags set by the selection itself
 * (two questions investigated, three components funded) are excluded — they are this
 * decision, not an earlier one, and crediting them as history would misattribute the cause.
 *
 *   held    — flags the outcome required (`all`, or the `any` that were present)
 *   lacked  — flags whose ABSENCE the outcome required (`none`)
 *
 * A fallback outcome has no condition of its own, but it is not causeless: outcomes are
 * first-match, so it landed because the record failed every sibling listed before it. The
 * first version said "nothing you carried in changed how this landed" there, which was false
 * on exactly the hard and mixed branches where the teaching matters most (pedagogy audit,
 * 8 October). `missed` therefore names the nearest earlier sibling and what it needed.
 *
 * Polarity is the caller's business: a flag can be an asset or a liability (`EARNED[f].liability`),
 * and "your record does not show a discount" is good news. The engine reports state only.
 */
export interface DimTest {
  dim: DimensionId;
  at: "min" | "max";
  value: number;
}
export interface Because {
  /** flags the selected outcome required, carried in from earlier decisions */
  held: string[];
  /** flags whose absence the selected outcome required */
  lacked: string[];
  /** meter thresholds the selected outcome required */
  dims: DimTest[];
  /**
   * The nearest other way this decision could have landed — the earlier sibling outcome
   * whose condition failed by the fewest terms — and exactly what it would have taken.
   * First-match semantics make this the honest answer for a fallback: it landed this way
   * because the record met none of the ways listed before it.
   */
  missed: { needed: string[]; oneOf: string[]; without: string[]; dims: DimTest[] } | null;
  /** false when the chosen approach has only one outcome, so no history could have changed it */
  conditional: boolean;
}

function dimTests(cond: Condition | undefined): DimTest[] {
  const tests: DimTest[] = [];
  for (const d of DIMENSIONS) {
    if (cond?.min?.[d] !== undefined) tests.push({ dim: d, at: "min", value: cond.min[d]! });
    if (cond?.max?.[d] !== undefined) tests.push({ dim: d, at: "max", value: cond.max[d]! });
  }
  return tests;
}

export function outcomeBecause(state: GameState, content: Content): Because {
  const none: Because = { held: [], lacked: [], dims: [], missed: null, conditional: false };
  const node = content.nodes[state.nodeId];
  const result = state.resolution;
  const entry = state.history.at(-1);
  if (state.phase !== "consequence" || !result || !node || !isMission(node) || entry?.missionId !== node.id) return none;
  const candidates = node.kind === "choice" ? node.options.find((o) => o.id === entry.chosenIds[0])?.outcomes ?? [] : node.outcomes;
  const index = candidates.findIndex((o) => o.id === result.outcome.id);

  /* Reconstruct exactly what the conditions were evaluated against: the record after this
     decision's selection effects, before the outcome's own effects. */
  const sel = selectionEffects(node, entry.chosenIds);
  const selFlags = new Set(sel.flags);
  const outcomeOnly = new Set((result.outcome.effect.flags ?? []).filter((f) => !selFlags.has(f)));
  const flagsAt = state.flags.filter((f) => !outcomeOnly.has(f));
  const dimsAt = applySteps(sel.steps, result.dimsBefore, [], []).dims;

  const when = result.outcome.when;
  const own = new Set([...selFlags, ...outcomeOnly]);
  const held = [...(when?.all ?? []), ...(when?.any ?? []).filter((f) => flagsAt.includes(f))]
    .filter((f, i, all) => !own.has(f) && all.indexOf(f) === i);
  const lacked = (when?.none ?? []).filter((f, i, all) => all.indexOf(f) === i);

  let missed: Because["missed"] = null, fewest = Infinity;
  for (const earlier of candidates.slice(0, Math.max(0, index))) {
    const c = earlier.when;
    const needed = (c?.all ?? []).filter((f) => !flagsAt.includes(f));
    const oneOf = c?.any && !c.any.some((f) => flagsAt.includes(f)) ? [...c.any] : [];
    const without = (c?.none ?? []).filter((f) => flagsAt.includes(f));
    const dims = dimTests(c).filter((t) => (t.at === "min" ? dimsAt[t.dim] < t.value : dimsAt[t.dim] > t.value));
    const size = needed.length + (oneOf.length ? 1 : 0) + without.length + dims.length;
    if (size > 0 && size < fewest) { fewest = size; missed = { needed, oneOf, without, dims }; }
  }
  return { held, lacked, dims: dimTests(when), missed, conditional: candidates.length > 1 };
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
  "won",
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

  // A later relationship setback cannot undo the award that actually happened.
  if (win < 40 && !flags.includes("won")) {
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
