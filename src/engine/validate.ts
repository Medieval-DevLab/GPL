/**
 * Content validator.
 *
 * These are the design rules made mechanical. If a rule can be checked by a
 * machine, a human should never be the thing standing between a broken mission
 * and a player. Run in the test suite; a failure blocks the build.
 *
 * The most valuable check here is FLAG REFERENCE INTEGRITY. A condition that
 * reads `knows:ops_constriant` will never match, the branch silently never
 * fires, and nothing crashes — the game just quietly stops teaching. Static
 * cross-checking of every flag read against every flag written catches that.
 */

import { conditionList, DEFAULT_BROKEN_EFFECT, engineReadFlags, ledgerRules } from "./engine";
import {
  DIMENSIONS,
  isMission,
  type Condition,
  type Conditions,
  type Content,
  type DimensionId,
  type GameNode,
  type LeverMission,
  type LeverOption,
  type Mission,
  type Outcome,
} from "./types";

export interface Issue {
  severity: "error" | "warning";
  where: string;
  message: string;
}

/**
 * Word budgets for everything the player reads BEFORE deciding.
 *
 * The decide screen is a briefing, not an essay. Left unbounded it grew to the
 * point where the only way to find anything was to read all of it — which is
 * the opposite of a game. These are deliberately tight: pros and cons are tags,
 * not sentences, and the situation is a setup, not a chapter.
 *
 * Outcome PROSE is NOT budgeted: `headline` and `detail` have the consequence
 * screen to themselves and that text is the actual teaching. `changed` is the
 * exception, because it is a scanned list sitting beside the meters rather than
 * prose — the same argument that caps pros and cons at six words each.
 *
 * Every number below with a comment giving an observed maximum was calibrated
 * against the content as it stood, not guessed. A budget nobody has measured
 * either does nothing or fires on arrival, and both are worse than no budget.
 */
const BUDGET = {
  situation: 55, // total across all paragraphs
  objective: 16,
  description: 18,
  prosCons: 6, // per entry
  consider: 13, // per entry
  tip: 20,
  note: 11, // per assessment factor
  concern: 11, // per entry
  blurb: 20,
  commits: 14,
  /** one line under the question, so the same shape as `objective`. Observed max 13. */
  prompt: 16,
  /** the advisor's italic utterance — two lines in the rail card. Observed max 17. */
  advisorLine: 24,
  /** a client pull-quote, which gets its own block and may run longer. Observed max 28. */
  saidQuote: 34,
  /**
   * the option as a spoken reply, on a `dialogue` beat.
   *
   * Tighter than `saidQuote` for a layout reason rather than a prose one: the
   * replies render as stacked full-width rows, three or four of them one under
   * the other, so a long one wraps to three lines and the list stops being
   * scannable at a glance. Roughly a breath of speech.
   *
   * Observed max 20, across 37 authored replies — so unlike every other number
   * here this one sits exactly ON the authored maximum rather than above it.
   * Deliberate: 20 words is where the row wraps, not a style preference, so the
   * next line over it is a fit problem and the author should hear about it.
   */
  say: 20,
  /** per `changed` bullet. Observed max 12. */
  changed: 18,
  /**
   * Lever decisions (D-084, `docs/LEVERS.md`). Not calibrated against authored content,
   * because there is none yet: these are the contract's numbers, set from the layout the
   * contract describes — a lever is a row of segmented options, each a short value with
   * one line of detail under it, and three of them sit side by side.
   */
  leverLabel: 4,
  settingLabel: 6,
  settingDetail: 14,
  /**
   * The colleague thinking aloud on a modelled decision (D-086). Spoken as one line of the
   * brief, so it is a breath longer than the advisor's rail line. The four in the script
   * run 29–41 words.
   */
  thinkAloud: 45,
  /**
   * `docs/STRATEGY.md` §2.6, made mechanical for the decision unit it was written for: at
   * most 40 words before the first thing you do in a scene, and 120 before any choice.
   * The first is the situation, on every variant; the second is everything the brief speaks
   * before the panel opens — the situation, the client's line and the think-aloud.
   */
  leverSituation: 40,
  beforeChoice: 120,
} as const;

/** Two or three levers, each with two or three settings: at most 27 combinations. */
const LEVERS_MIN = 2;
const LEVERS_MAX = 3;
const SETTINGS_MIN = 2;
const SETTINGS_MAX = 3;

/**
 * What the caller knows that the content bundle does not carry.
 *
 * `cards` are the flags the interface names as cards in the player's hand — the keys of
 * `EARNED` in `src/content/gates.ts`. The engine may not import content, so the caller
 * hands them in. Only the lever dead-flag rule reads them: a setting's flag that nothing
 * branches on is still not dead if the player can see it in their hand, because then it
 * is the record of a promise rather than state nobody looks at.
 */
export interface ValidateOptions {
  cards?: Iterable<string>;
}

/**
 * Known limit: this counts whitespace-separated tokens, so an em-dashed clause
 * — like this one — costs one word and forty characters. Every budget in this
 * file is therefore a lower bound on rendered length, and the actual fit is
 * measured in a browser by `verify.mjs` `checkFit`.
 */
function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Words that would leak a predicted outcome into pre-decision copy.
 *
 * Read the limit of this honestly: it is a nine-item deny-list against an
 * unbounded space. "This is the one that gets you there" and "the safe bet"
 * both predict an outcome and neither appears below. What the list does catch
 * is the vocabulary a writer reaches for when they forget the rule — the
 * dimension names and the four ways of saying "recommended" — and it now
 * catches them on the WHOLE pre-decision surface rather than on six fields of
 * thirteen, which was the actual defect. Widening the surface was worth more
 * than lengthening the list; judging a sentence still needs a reviewer.
 */
const OUTCOME_LEAK_TERMS = [
  "winability",
  "profitability",
  "deliverability",
  "recommended",
  "best option",
  "best choice",
  "optimal",
  "you should",
  "correct choice",
];

/** Lowercased, punctuation stripped, whitespace collapsed. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * The stop list used when asking whether two sentences say the same thing.
 *
 * Deliberately small and general: it exists so that "the" and "you" do not make
 * every pair of maxims look alike. It is not a lexicon, and no check here
 * depends on it being complete — a missing stop word can only make two
 * sentences look MORE similar, which is the direction that fails safe.
 */
const STOP_WORDS = new Set(
  "and are but for from had has have its not that the their them then there they this was were what when which who will with you your".split(
    " ",
  ),
);

/** Exported only so `validate.test.ts` can pin the calibration below against the
    real content with the real function, rather than a second copy of it. */
export function contentWords(text: string): Set<string> {
  return new Set(
    normalise(text)
      .split(" ")
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
}

/** Jaccard overlap of content words: 1 is the same sentence, 0 shares nothing. */
export function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / (a.size + b.size - shared);
}

/**
 * How much two lesson lines may overlap before they are the same lesson.
 *
 * Calibrated, not guessed: across today's sixteen missions the closest pair of
 * `principle` lines overlaps at 0.17 and the closest pair of `because` lines at
 * 0.18. See `validate.test.ts`, which pins the measurement so that a future
 * author who legitimately narrows the gap finds out here rather than in a
 * mystery build failure.
 */
export const LESSON_OVERLAP_LIMIT = 0.7;

/** Below this many content words, overlap is noise and only exact matches count. */
const LESSON_MIN_WORDS = 4;

/**
 * How much a spoken `say` line may overlap the card `title` of the same option
 * before it is the title with quotation marks round it.
 *
 * A WARNING rather than an error, deliberately, and the only check in this file
 * that is. The others are properties of the content — a flag nothing sets, an
 * absent fallback, a word count — and a machine settles them. Whether a
 * sentence is a fresh line or a restatement is a judgement about register, and
 * a hard gate on it would fire on prose that is doing exactly the right thing:
 * a reply that picks up the noun phrase it is answering ("Then let's own the
 * post-purchase experience end to end") is natural speech, not laziness. So
 * this flags the pair for a reviewer and blocks nothing on its own — though see
 * `validate.test.ts`, where `engine.test.ts`'s empty-warning pin means a
 * warning that fires today still stops the build.
 *
 * Calibrated, not guessed. Measured across all 37 authored replies: the closest
 * `say`/`title` pair sits at 0.21, the next at 0.20, and 30 of the 37 are below
 * 0.10. The worst case is always the same shape — a reply that echoes both the
 * verb and the noun of a four-word title while saying something new about them,
 * which is the register the field exists for. Nothing authored reaches 0.34, so
 * the limit sits at better than three times the observed maximum and the whole
 * band beneath it is empty. `validate.test.ts` pins that measurement, so an
 * author who narrows it legitimately hears about it in one line rather than
 * through a warning firing on innocent prose.
 *
 * Tolerance is wider than `LESSON_OVERLAP_LIMIT`'s for a reason worth knowing:
 * two lessons have no business sharing vocabulary at all, whereas a reply is
 * *answering* the thing the title names and will often pick its noun back up.
 * The limit is still low enough to catch what it is for — the title with one
 * word bolted onto it scores 0.75.
 *
 * Note the asymmetry in how it is applied: the noise floor is checked on the
 * SPOKEN bag only, not on both. Titles are three or four content words by
 * budget, so a floor on the title bag would have skipped the check on most of
 * the game. Jaccard already handles the size difference in the safe direction —
 * a genuinely new sentence that happens to reuse the title's noun scores low
 * because it brings words of its own.
 */
export const SAY_TITLE_OVERLAP_LIMIT = 0.7;

function conditionFlags(c: Condition | undefined): string[] {
  if (!c) return [];
  return [...(c.all ?? []), ...(c.any ?? []), ...(c.none ?? [])];
}

function conditionsFlags(c: Conditions | undefined): string[] {
  return conditionList(c).flatMap(conditionFlags);
}

/**
 * Every condition a mission evaluates, wherever it sits — briefing, options, settings,
 * outcomes. Used where the question is "does anything here read this flag?", so missing a
 * surface would report a live flag as dead.
 */
function missionConditions(m: Mission): (Condition | undefined)[] {
  const out: (Condition | undefined)[] = [];
  for (const v of m.variants ?? []) out.push(v.when);
  for (const q of m.quotes ?? []) out.push(q.when);
  if (Array.isArray(m.advisorLine)) for (const l of m.advisorLine) out.push(l.when);
  if (m.kind === "choice") {
    for (const o of m.options) {
      out.push(o.requires);
      for (const oc of o.outcomes) out.push(oc.when);
    }
  } else {
    if (m.kind === "levers") for (const l of m.levers) for (const o of l.options) out.push(o.requires);
    for (const oc of m.outcomes) out.push(oc.when);
  }
  return out;
}

function missionOutcomes(m: Mission): { outcome: Outcome; where: string }[] {
  if (m.kind === "choice") {
    return m.options.flatMap((o) =>
      o.outcomes.map((outcome) => ({ outcome, where: `${m.id}/${o.id}` })),
    );
  }
  return m.outcomes.map((outcome) => ({ outcome, where: m.id }));
}

/**
 * Every node this one can lead to.
 *
 * `node.next` is the ordinary path. An outcome may also carry its own `next`,
 * which diverts the whole game — that is how walking away from the deal skips
 * delivery (`engine.ts`: `state.resolution?.outcome.next ?? node.next`). Both
 * edges are real, so both have to be in the graph the validator walks;
 * otherwise a node that only a walk-away branch reaches reads as an orphan.
 */
function successors(node: GameNode): string[] {
  if (node.kind === "ending") return [];
  const out = [(node as Exclude<GameNode, { kind: "ending" }>).next];
  if (isMission(node)) {
    for (const { outcome } of missionOutcomes(node)) if (outcome.next) out.push(outcome.next);
  }
  return out;
}

export function validateContent(content: Content, opts: ValidateOptions = {}): Issue[] {
  const issues: Issue[] = [];
  const err = (where: string, message: string) =>
    issues.push({ severity: "error", where, message });
  const warn = (where: string, message: string) =>
    issues.push({ severity: "warning", where, message });

  /**
   * G3: text shown BEFORE a decision may describe cost, never effect.
   *
   * One copy of this rule, called from every pre-decision field. There were two,
   * one for mission-level prose and one for option cards, and they had already
   * drifted apart in wording; two copies of a rule is two rules, and the second
   * one is the one that stops being updated.
   */
  /**
   * Every form an `advisorLine` can take, as plain strings.
   *
   * It became `string | ConditionalLine[]` so a colleague could finally react to what the
   * player had done. Each branch is a separate utterance the player can be shown, so each
   * one has to be leak-checked and budgeted independently — checking only the first, or
   * only the string case, would leave the conditional branches as the one pre-decision
   * surface in the game with no gate on it at all.
   */
  const advisorLines = (m: Mission): string[] =>
    typeof m.advisorLine === "string"
      ? [m.advisorLine]
      : (m.advisorLine ?? []).map((l) => l.text);

  const leakCheck = (text: string | undefined, where: string, field: string) => {
    if (!text) return;
    const lower = text.toLowerCase();
    for (const term of OUTCOME_LEAK_TERMS) {
      if (lower.includes(term)) {
        err(where, `"${field}" predicts the outcome ("${term}") — describe cost, never effect`);
      }
    }
  };

  const nodes = Object.values(content.nodes);
  const ids = new Set(nodes.map((n) => n.id));

  /* ── graph integrity ─────────────────────────────────────────── */

  if (!ids.has(content.startNodeId)) {
    err("content", `startNodeId "${content.startNodeId}" is not a node`);
  }

  for (const node of nodes) {
    if (node.kind === "ending") continue;
    const next = (node as Exclude<GameNode, { kind: "ending" }>).next;
    if (!ids.has(next)) {
      err(node.id, `next points at "${next}", which does not exist`);
    }
  }

  /* An outcome's own `next` is a graph edge too, and it was the only one not
     checked. A typo there does not surface as a validator message naming the
     field: it surfaces as `getNode: unknown node "en"` thrown from the middle
     of the 20-second exhaustive sweep, on whichever run first happens to take
     that branch. Same class of defect as a bad `node.next`, same severity. */
  for (const node of nodes) {
    if (!isMission(node)) continue;
    for (const { outcome, where } of missionOutcomes(node)) {
      if (outcome.next !== undefined && !ids.has(outcome.next)) {
        err(
          where,
          `outcome "${outcome.id}" diverts to "${outcome.next}", which does not exist`,
        );
      }
    }
  }

  // Reachability from the start node — along both kinds of edge. See `successors`.
  const reached = new Set<string>();
  const queue: string[] = [content.startNodeId];
  while (queue.length) {
    const id = queue.shift() as string;
    if (reached.has(id) || !ids.has(id)) continue;
    reached.add(id);
    const node = content.nodes[id];
    if (node) queue.push(...successors(node));
  }
  for (const node of nodes) {
    if (!reached.has(node.id)) err(node.id, "orphan — unreachable from the start node");
  }

  const hasEnding = nodes.some((n) => n.kind === "ending" && reached.has(n.id));
  if (!hasEnding) err("content", "no reachable ending — the game cannot be finished");

  /* ── flag reference integrity ────────────────────────────────── */

  const written = new Set<string>();
  const read = new Map<string, string>(); // flag -> first place it is read

  // Some flags are read by the engine rather than by a content condition — the final
  // verdict branches on `walked_away`. Seed them, or the dead-state check below reports
  // a flag that very much is read. See `engineReadFlags` in engine.ts: each table is the
  // content's own when it carries one (D-086), and is named as such, so a typo in an
  // ending or a promise rule points at the ending or the rule rather than at "engine".
  const engineReads = engineReadFlags(content);
  for (const f of engineReads.verdict) read.set(f, content.endings ? "endings" : "engine");
  for (const f of engineReads.ledger) if (!read.has(f)) read.set(f, content.ledger ? "ledger" : "engine");
  for (const f of engineReads.promises) if (!read.has(f)) read.set(f, "promises");

  // Chapter 0 writes flags too, and it is not a mission.
  for (const node of nodes) {
    if (node.kind === "setup") for (const o of node.options) for (const f of o.flags) written.add(f);
  }

  /* And so does the promise calendar: what a broken or late promise sets is real state the
     endings read. The default broken effect counts only where a rule can actually break —
     one with no `keptWhen` is always kept and sets nothing. */
  for (const p of content.promises ?? []) {
    for (const f of p.lateEffect?.flags ?? []) written.add(f);
    if (p.keptWhen) for (const f of (p.brokenEffect ?? DEFAULT_BROKEN_EFFECT).flags ?? []) written.add(f);
  }

  for (const node of nodes) {
    if (!isMission(node)) continue;

    if (node.kind === "investigate") {
      for (const e of node.evidence) for (const f of e.flags ?? []) written.add(f);
    }
    if (node.kind === "build") {
      for (const c of node.components) for (const f of c.flags ?? []) written.add(f);
    }
    if (node.kind === "levers") {
      for (const l of node.levers) for (const o of l.options) for (const f of o.flags ?? []) written.add(f);
    }
    for (const { outcome } of missionOutcomes(node)) {
      for (const f of outcome.effect.flags ?? []) written.add(f);
    }

    const noteRead = (c: Condition | undefined, where: string) => {
      for (const f of conditionFlags(c)) if (!read.has(f)) read.set(f, where);
    };

    for (const v of node.variants ?? []) noteRead(v.when, `${node.id}/variant`);
    for (const q of node.quotes ?? []) noteRead(q.when, `${node.id}/quote`);
    if (Array.isArray(node.advisorLine)) {
      for (const l of node.advisorLine) noteRead(l.when, `${node.id}/advisorLine`);
    }
    if (node.kind === "choice") {
      for (const o of node.options) {
        noteRead(o.requires, `${node.id}/${o.id}/requires`);
        for (const oc of o.outcomes) noteRead(oc.when, `${node.id}/${o.id}/${oc.id}`);
      }
    } else {
      if (node.kind === "levers") {
        for (const l of node.levers) {
          for (const o of l.options) noteRead(o.requires, `${node.id}/${l.id}/${o.id}/requires`);
        }
      }
      for (const oc of node.outcomes) noteRead(oc.when, `${node.id}/${oc.id}`);
    }
  }

  for (const [flag, where] of read) {
    if (!written.has(flag)) {
      err(
        where,
        where === "promises" && (content.promises ?? []).some((p) => p.flag === flag)
          ? `promise rule is for flag "${flag}", which nothing ever sets — this card can never come due`
          : `condition reads flag "${flag}", which nothing ever sets (likely a typo)`,
      );
    }
  }
  for (const flag of written) {
    if (!read.has(flag)) {
      warn("content", `flag "${flag}" is set but never read — dead state`);
    }
  }

  /* ── invisible state ─────────────────────────────────────────
   * A flag that decides a branch and appears in no ledger rule is state the game
   * branches on and never shows. The player then cannot tell a reasoning error from an
   * information gap — they made a call with information the game had and they did not —
   * and every outcome being attributable is the whole teaching mechanism. 14 of 29
   * gating flags were in this position when it was first measured.
   *
   * A WARNING rather than an error, for one specific reason: `LEDGER_RULES` still lives
   * in `engine.ts`, so the only ways to clear an error here would be to edit the engine
   * or to weaken a gate, and "adding a mission must never require editing the engine" is
   * the stronger rule. `engine.test.ts` pins the set instead — same pattern as the dead
   * narrative flags — so the list cannot grow quietly, which is what actually matters.
   * If the table moves to content, this becomes an error and the pin goes away.
   *
   * It has (D-086). Content that carries its own `ledger` gets an error, because the only fix
   * now lives where the content is. And a named card counts as on screen: the hand shows
   * every card in `EARNED`, so a flag the player holds as a card is not invisible state
   * whether or not the board files it too. */
  const cardsShown = new Set(opts.cards ?? []);
  const ledgerFlags = new Set([...ledgerRules(content).flatMap((r) => conditionFlags(r.when)), ...cardsShown]);
  const invisible = content.ledger ? err : warn;
  const gating = new Map<string, string>(); // flag -> the first branch it decides
  for (const node of nodes) {
    if (!isMission(node)) continue;
    const noteGate = (c: Condition | undefined, where: string) => {
      for (const f of conditionFlags(c)) if (!gating.has(f)) gating.set(f, where);
    };
    if (node.kind === "choice") {
      for (const o of node.options) {
        noteGate(o.requires, `${node.id}/${o.id}/requires`);
        for (const oc of o.outcomes) noteGate(oc.when, `${node.id}/${o.id}/${oc.id}`);
      }
    } else {
      /* A locked setting is a branch the player sees decided against them, so its card has
         to be on the rail for the same reason a locked option's does. */
      if (node.kind === "levers") {
        for (const l of node.levers) {
          for (const o of l.options) noteGate(o.requires, `${node.id}/${l.id}/${o.id}/requires`);
        }
      }
      for (const oc of node.outcomes) noteGate(oc.when, `${node.id}/${oc.id}`);
    }
  }
  /* The calendar and the endings branch too: a promise kept or broken on a card the player
     cannot see is the same failure as an outcome that turns on one. */
  (content.promises ?? []).forEach((p, i) => {
    for (const f of [p.flag, ...conditionsFlags(p.voidWhen), ...conditionsFlags(p.keptWhen), ...conditionsFlags(p.lateWhen)]) {
      if (!gating.has(f)) gating.set(f, `promises[${i}]`);
    }
  });
  (content.endings ?? []).forEach((e, i) => {
    for (const f of conditionFlags(e.when)) if (!gating.has(f)) gating.set(f, `endings[${i}]`);
  });
  for (const [flag, where] of gating) {
    if (!ledgerFlags.has(flag)) {
      invisible(
        where,
        `flag "${flag}" decides a branch here and appears in no ledger rule — the player cannot see the state it turns on`,
      );
    }
  }

  /* ── the ledger's own copy ───────────────────────────────────
   * The rail is a pre-decision surface: it is on screen, collapsed, while the options
   * are being read. So the same rule applies to it as to every other pre-decision
   * field — it may state a position and a cost, never an effect — and it gets the same
   * check rather than a second, drifting copy of the rule. `engine.ts` has no leak check
   * of its own, which is precisely why these strings had none.
   *
   * The lengths are the rail: 248px at 12px type is about 35 characters a line, and a
   * row stops being glanceable past three of them. Measured against the table as it
   * stands — longest label 28, longest detail 85 — so these are budgets with headroom
   * rather than numbers that fire on arrival. */
  const seenLabels = new Set<string>();
  for (const rule of ledgerRules(content)) {
    const where = `${content.ledger ? "ledger" : "engine/ledger"}/${rule.label}`;
    leakCheck(rule.label, where, "ledger label");
    leakCheck(rule.detail, where, "ledger detail");
    if (!rule.detail.trim()) {
      err(where, "ledger entry has no detail — a bare label is a restatement, not a position");
    }
    if (rule.label.length > 30) err(where, `ledger label is ${rule.label.length} chars (max 30)`);
    if (rule.detail.length > 95) {
      err(where, `ledger detail is ${rule.detail.length} chars (max 95)`);
    }
    if (conditionFlags(rule.when).length === 0) {
      err(where, "ledger rule has no flag condition, so it would be on the rail from the start");
    }
    if (seenLabels.has(rule.label)) err(where, "two ledger rules share a label");
    seenLabels.add(rule.label);
  }

  /* ── the causal threads ──────────────────────────────────────
   * These had NO checks at all, which is how the section `engine.ts` calls "the payoff
   * of the whole design" came to be empty on 77% of runs while `DECISIONS.md` recorded
   * nine rules and five existed. A thread naming an outcome id that does not exist never
   * fires and never complains: the ending is simply quieter than it was authored to be,
   * on some runs, and nothing in the build has an opinion. That is the most expensive
   * kind of content bug this repo has had, so it gets an error rather than a warning. */
  /* Everyone the game gives a name to, derived rather than listed — a hardcoded cast
     silently stops matching the day somebody is renamed, and this check would then go
     quiet rather than wrong, which is the failure mode hardest to notice. Surnames count
     too: half the game calls him Marcus and half Marcus Reed. */
  const cast = new Set<string>();
  for (const node of nodes) {
    if (!isMission(node)) continue;
    const people = [node.advisor?.name, node.saidQuote?.speaker, ...(node.quotes ?? []).map((q) => q.speaker)];
    for (const p of people) {
      if (!p) continue;
      for (const part of p.split(/\s+/)) if (part.length > 2) cast.add(part);
    }
  }

  const outcomeIds = new Set<string>();
  for (const node of nodes) {
    if (!isMission(node)) continue;
    for (const { outcome } of missionOutcomes(node)) outcomeIds.add(outcome.id);
  }

  content.threads.forEach((rule, i) => {
    const where = `threads[${i}]`;
    /* Not the pre-decision rule, which would be a category error here: the ending is the
       one screen whose job IS to say what happened. What the shared term list buys is its
       other half — the ending must never name which decision was the right one, and being
       the screen the player most wants a verdict from, it is the likeliest to try. */
    leakCheck(rule.because, where, "thread because");
    leakCheck(rule.soLater, where, "thread soLater");

    for (const id of rule.needsOutcomes) {
      if (!outcomeIds.has(id)) {
        err(where, `needs outcome "${id}", which no mission produces — this thread can never fire`);
      }
    }
    for (const f of rule.needsFlags ?? []) {
      if (!written.has(f)) {
        err(where, `needs flag "${f}", which nothing sets — this thread can never fire`);
      }
    }
    /* The rule `causalThreads` documents and did not enforce: one outcome restated as a
       chain is not a chain, and four rules were doing exactly that. */
    if (rule.needsOutcomes.length < 2) {
      err(where, "a thread needs at least two outcomes, or it restates one decision as a chain");
    }

    /* 4.5 — the claim item's wrong answers. A distractor identical to the answer makes the
       item unanswerable, and the player is right and the game says otherwise. */
    const seen = new Set([normalise(rule.because)]);
    (rule.insteadOf ?? []).forEach((alt, j) => {
      leakCheck(alt, where, `thread insteadOf[${j}]`);
      const key = normalise(alt);
      if (seen.has(key)) {
        err(where, `insteadOf[${j}] repeats another candidate — the item has two right answers`);
      }
      seen.add(key);
    });
    if (rule.insteadOf && rule.insteadOf.length < 2) {
      err(where, "insteadOf needs at least two wrong answers, or the item is a coin toss");
    }

    /**
     * The one structural tell a machine can see.
     *
     * A pedagogy pass found six ways the claim item was answerable without thinking about
     * causation — the stem was about a document and one candidate was about a document,
     * the stem said "his systems" and one candidate named a person, and so on. Those are
     * CATEGORY matches, and measuring them was tried and abandoned: Jaccard overlap
     * between each candidate and the stem is at most 0.063 across every authored item and
     * is zero on four of the six flagged ones, so a lexical gate would have passed on
     * exactly the items the human reading caught. Length and clause count are no better —
     * the authored set is uniform on both, which is a compliment to the writing and
     * useless as a signal.
     *
     * A proper noun is the exception, because it is a hard token rather than a category.
     * If exactly one candidate names somebody, that candidate is findable by a player who
     * has stopped reading, whichever one it is — so this fires on a lonely distractor as
     * well as a lonely answer. Warning, not error: a beat genuinely about one named
     * person may have no honest way to avoid it, and this is the sort of judgement
     * `SAY_TITLE_OVERLAP_LIMIT` is also left as a warning for.
     *
     * The other five stay a human's job. Recorded here rather than approximated, because
     * a gate that catches one in six teaches whoever reads it green that the other five
     * were looked for.
     */
    if (rule.insteadOf && rule.insteadOf.length >= 2) {
      const candidates = [rule.because, ...rule.insteadOf];
      const named = candidates.filter((c) => [...cast].some((n) => c.includes(n)));
      if (named.length === 1) {
        warn(
          where,
          `only one of the ${candidates.length} claim candidates names a person, so it is findable ` +
            `without reading: "${named[0]?.slice(0, 60)}…"`,
        );
      }
    }
  });

  /* ── the promise calendar (D-086) ────────────────────────────
   * A promise rule fails silently in every way an outcome can, and in two of its own. A rule
   * for a card nothing sets never comes due (caught above, by the flag-integrity pass). A
   * rule with a `lateWhen` and no `late` line puts a blank row on the calendar, and one with
   * no `keptWhen` is always kept, so anything it says about being late or broken is copy no
   * player can reach. And a calendar nothing settles is a list of promises that never fall
   * due, which is the one thing this game exists to show. */
  const settleNodes = nodes.filter((n) => (n.kind === "interlude" || n.kind === "ending") && n.settle);
  const promises = content.promises ?? [];
  if (promises.length > 0 && settleNodes.length === 0) {
    err("promises", "promise rules exist but no beat is marked `settle`, so no promise ever comes due");
  }
  if (promises.length === 0) {
    for (const n of settleNodes) err(n.id, "marked `settle`, but the content has no promise rules to settle");
  }
  const seenPromise = new Set<string>();
  promises.forEach((p, i) => {
    const where = `promises[${i}]`;
    if (!p.flag?.trim()) err(where, "promise rule has no flag");
    if (seenPromise.has(p.flag)) err(where, `two promise rules for "${p.flag}" — a card comes due once`);
    seenPromise.add(p.flag);
    if (!p.due?.trim()) err(where, `"${p.flag}" has no due label for the calendar`);
    if (!Number.isFinite(p.dueMonth)) err(where, `"${p.flag}" has no dueMonth, so it cannot be placed in order`);
    const keptLines = typeof p.kept === "string" ? [{ text: p.kept }] : p.kept;
    if (keptLines.length === 0 || keptLines.some((l) => !l.text?.trim())) err(where, `"${p.flag}" has an empty kept line`);
    if (typeof p.kept !== "string" && p.kept.length > 0 && p.kept[p.kept.length - 1]?.when !== undefined) {
      err(where, `"${p.flag}" kept lines end on a condition — the last must be unconditional`);
    }
    if (p.voidWhen && !p.voided?.trim()) err(where, `"${p.flag}" can be void but has no voided line`);
    if (!p.voidWhen && p.voided) err(where, `"${p.flag}" has a voided line but nothing voids it`);
    if (p.lateWhen && !p.late?.trim()) err(where, `"${p.flag}" can be late but has no late line`);
    if (!p.lateWhen && (p.late || p.lateEffect)) err(where, `"${p.flag}" has a late line or effect but nothing makes it late`);
    if (!p.keptWhen) {
      if (p.lateWhen || p.broken || p.brokenEffect) {
        err(where, `"${p.flag}" has no keptWhen, so it is always kept and its late or broken copy can never show`);
      }
    } else if (!p.broken?.trim()) {
      err(where, `"${p.flag}" can break but has no broken line — the calendar would show a blank row`);
    }
    /* Post-decision prose, so not the pre-decision rule; the shared list still catches the
       calendar naming a decision as the right one. */
    for (const l of keptLines) leakCheck(l.text, where, "kept");
    leakCheck(p.late, where, "late");
    leakCheck(p.broken, where, "broken");
    leakCheck(p.voided, where, "voided");
  });

  /* ── the endings (D-086) ─────────────────────────────────────
   * First match wins and the last is unconditional, as for every outcome list. One check the
   * outcome lists cannot have: an unconditional ending ANYWHERE but last shadows every ending
   * after it, which is unreachability the validator can see without a sweep. */
  const endings = content.endings ?? [];
  if (content.endings && endings.length === 0) err("endings", "endings is present but empty");
  const seenEnding = new Set<string>();
  endings.forEach((e, i) => {
    const where = `endings[${i}]`;
    if (!e.id?.trim()) err(where, "ending has no id");
    if (seenEnding.has(e.id)) err(where, `duplicate ending id "${e.id}"`);
    seenEnding.add(e.id);
    if (!e.title?.trim()) err(where, `ending "${e.id}" has no title`);
    if (!e.summary?.trim()) err(where, `ending "${e.id}" has no summary`);
    if (i < endings.length - 1 && !e.when) {
      err(where, `ending "${e.id}" is unconditional but not last, so no ending after it can ever be reached`);
    }
    leakCheck(e.title, where, "ending title");
    leakCheck(e.summary, where, "ending summary");
    (e.extras ?? []).forEach((x, j) => {
      if (!x.text?.trim()) err(`${where}/extras[${j}]`, "extra has no text");
      if (!x.when || conditionFlags(x.when).length + Object.keys(x.when.min ?? {}).length + Object.keys(x.when.max ?? {}).length === 0) {
        err(`${where}/extras[${j}]`, "extra has no condition, so it belongs in the summary");
      }
      leakCheck(x.text, `${where}/extras[${j}]`, "ending extra");
    });
  });
  if (endings.length > 0 && endings[endings.length - 1]?.when !== undefined) {
    err(`endings[${endings.length - 1}]`, "the last ending is conditional — the endings need an unconditional fallback");
  }

  /* ── analysis assumption ─────────────────────────────────────
   * analysis.ts dedupes the exhaustive sweep on flags alone, which is exact
   * only while no branch gates on a dimension value. If that changes, branch
   * coverage silently stops being complete — so say so loudly. */
  const dimGated: string[] = [];
  const checkDimGate = (c: Condition | undefined, where: string) => {
    if (c && (c.min || c.max)) dimGated.push(where);
  };
  for (const node of nodes) {
    if (!isMission(node)) continue;
    for (const v of node.variants ?? []) checkDimGate(v.when, `${node.id}/variant`);
    for (const q of node.quotes ?? []) checkDimGate(q.when, `${node.id}/quote`);
    if (Array.isArray(node.advisorLine)) {
      for (const l of node.advisorLine) checkDimGate(l.when, `${node.id}/advisorLine`);
    }
    if (node.kind === "choice") {
      for (const o of node.options) {
        checkDimGate(o.requires, `${node.id}/${o.id}/requires`);
        for (const oc of o.outcomes) checkDimGate(oc.when, `${node.id}/${o.id}/${oc.id}`);
      }
    } else {
      if (node.kind === "levers") {
        for (const l of node.levers) {
          for (const o of l.options) checkDimGate(o.requires, `${node.id}/${l.id}/${o.id}/requires`);
        }
      }
      for (const oc of node.outcomes) checkDimGate(oc.when, `${node.id}/${oc.id}`);
    }
  }
  /* The end of the run gates too, and the sweep has to key on it from the first decision
     (`analysis.ts` folds these into every mission's suffix), so it carries the same cost. */
  (content.promises ?? []).forEach((p, i) => {
    for (const c of [...conditionList(p.voidWhen), ...conditionList(p.keptWhen), ...conditionList(p.lateWhen)]) {
      checkDimGate(c, `promises[${i}]`);
    }
    if (typeof p.kept !== "string") for (const l of p.kept) checkDimGate(l.when, `promises[${i}]/kept`);
  });
  (content.endings ?? []).forEach((e, i) => {
    checkDimGate(e.when, `endings[${i}]`);
    (e.extras ?? []).forEach((x, j) => checkDimGate(x.when, `endings[${i}]/extras[${j}]`));
  });
  for (const where of dimGated) {
    warn(
      where,
      "condition gates on a dimension value. `analysis.ts` now buckets a gated dimension " +
        "into the dedup key, so coverage survives this — but at a cost, and with one rule. " +
        "The cost: one gate takes the sweep from ~162k states to ~520k; two use a third of " +
        "MAX_FRONTIER and three breach it. The rule: the threshold must sit on a ten-point " +
        "bucket boundary, or two states either side of it collapse into one and the branch " +
        "silently stops being reachable. The sweep throws if it does not.",
    );
  }

  /* ── what a lever setting's flag can be read by ──────────────────
   * The lever dead-flag rule (below) is stricter than the warning above in two ways, and
   * both are deliberate. It is an ERROR, because a setting's flag is a card the player is
   * handed on purpose — "your promise" — and one nothing ever reads is a promise the game
   * silently forgets. And it asks whether the flag is read LATER: by this decision's own
   * outcomes, which are chosen after the settings land, or by a mission after this one in
   * `missionOrder`, or by the engine, or by a causal thread. A read on an earlier beat is
   * no read at all. A flag the interface shows as a named card is exempt, because then it
   * is on screen even when nothing branches on it — see `ValidateOptions.cards`. */
  const cards = new Set(opts.cards ?? []);
  const alwaysRead = new Set<string>([
    ...engineReads.verdict,
    ...engineReads.ledger,
    ...engineReads.promises,
    ...content.threads.flatMap((t) => t.needsFlags ?? []),
  ]);
  const readsOf = new Map<string, Set<string>>();
  for (const node of nodes) {
    if (isMission(node)) readsOf.set(node.id, new Set(missionConditions(node).flatMap(conditionFlags)));
  }
  const readAfter = (m: LeverMission): Set<string> => {
    const out = new Set(alwaysRead);
    for (const oc of m.outcomes) for (const f of conditionFlags(oc.when)) out.add(f);
    const at = content.missionOrder.indexOf(m.id);
    /* Not in the order is its own error further down; read it as "anything else" here so
       this rule does not pile a second, misleading message on top of the real one. */
    const later = at < 0 ? [...readsOf.keys()].filter((id) => id !== m.id) : content.missionOrder.slice(at + 1);
    for (const id of later) for (const f of readsOf.get(id) ?? []) out.add(f);
    return out;
  };

  /* ── mission rules ───────────────────────────────────────────── */

  for (const node of nodes) {
    if (!isMission(node)) continue;
    const m = node;

    if (!m.lesson?.principle || !m.lesson?.because) {
      err(m.id, "missing lesson — the objective must land on every branch");
    }
    if (m.situation.length === 0) err(m.id, "missing situation text");
    if (!m.objective) err(m.id, "missing objective");
    if (!m.question) err(m.id, "missing question");

    /* Briefing furniture. The shell renders a rail, a tip bar and a consider
       panel on every mission; a missing one leaves a visible hole. */
    if (!m.eyebrow) err(m.id, "missing eyebrow — the shell renders one above every headline");
    if (!m.minutes || m.minutes < 1) err(m.id, "minutes must be a positive estimate");
    if (!m.advisor) err(m.id, "missing advisor — the left rail renders one on every mission");
    /* A lever decision is coached by its place in the act, not by the shell (D-086): the
       rail that needed a tip and two questions on every screen is superseded, and STRATEGY
       §2.7 replaces it with "model, prompt, let go" — see `coaching` below. */
    if (m.kind !== "levers") {
      if (!m.tip) err(m.id, "missing tip — the action bar renders one on every mission");
      if (!m.consider || m.consider.length < 2) {
        err(m.id, "needs at least two things to consider — one reads as an instruction");
      }
    }
    leakCheck(m.thinkAloud, m.id, "thinkAloud");

    /* A `dialogue` beat is opened by whoever already speaks on the mission, in
       the order the renderer resolves them: the first matching `quotes` entry,
       then `saidQuote` (both via `resolveSaidQuote` in engine.ts), then the
       colleague's `advisorLine`, then their standing `advisor.quote`. Stage a
       beat with none of the four and nothing throws — the scene simply opens
       with nobody having said anything, and the options answer a question the
       player was never asked.

       Known residual: a mission whose ONLY opener is a CONDITIONAL `quotes`
       entry passes here and still opens silent in the states where that
       condition fails. Deciding that statically means asking whether a
       reachable state satisfies the condition, which is the sweep's job rather
       than this file's — `analysis.test.ts` already fails on a line of
       dialogue no reachable state can hear, which closes the same hole from
       the other end. */
    if (m.presentation === "dialogue") {
      /* The colleague's two fields are conditioned on the advisor OBJECT as
         well, because `dialogue.tsx` is: it pushes that turn on
         `advisor && (advisorLine ?? advisor.quote)`, since a turn needs a name
         and a job title beside the words. A missing advisor is already an error
         above, so this cannot fire on otherwise-sound content — it is here so
         the condition is the renderer's condition rather than a paraphrase of
         it. */
      const clientSpeaks =
        Boolean(m.saidQuote?.text?.trim()) ||
        (m.quotes ?? []).some((q) => q.text.trim().length > 0);
      const colleagueSpeaks =
        Boolean(m.advisor) &&
        (advisorLines(m).some((l) => l.trim().length > 0) ||
          Boolean(m.advisor?.quote?.trim()));
      const canOpen = clientSpeaks || colleagueSpeaks;
      if (!canOpen) {
        err(
          m.id,
          'staged as "dialogue" with nobody to speak first — a dialogue beat opens with a ' +
            "quotes entry, a saidQuote, an advisorLine or the advisor's own quote, and this " +
            "mission has none of them",
        );
      }
    }

    /* Every pre-decision surface is leak-checked, not just `commits`. Anything
       the player reads BEFORE choosing may describe cost, never effect.

       "Every" used to mean six fields out of thirteen. The briefing screen also
       carries a prompt, an advisor utterance, a client quote, the client's
       concerns, the client blurb and the assessment notes — all of them read
       before the decision, none of them checked. G3 is a property of the whole
       pre-decision surface or it is nothing: a leak is just as damaging in the
       advisor's mouth as in `commits`, and rather more persuasive there. */
    for (const c of m.consider ?? []) leakCheck(c, m.id, "consider");
    leakCheck(m.tip, m.id, "tip");
    leakCheck(m.objective, m.id, "objective");
    leakCheck(m.prompt, m.id, "prompt");
    advisorLines(m).forEach((l, i) =>
      leakCheck(l, m.id, m.advisorLine instanceof Array ? `advisorLine[${i}]` : "advisorLine"),
    );
    /* `advisor.quote` is what renders when `advisorLine` is absent — the same
       italic line in the same slot — so checking only the override would leave
       the default open. `steer` is checked though nothing renders it today; the
       check costs nothing and is live the moment someone wires it up. */
    leakCheck(m.advisor?.quote, m.id, "advisor.quote");
    leakCheck(m.advisor?.steer, m.id, "advisor.steer");
    leakCheck(m.saidQuote?.text, m.id, "saidQuote");
    (m.quotes ?? []).forEach((q, i) => leakCheck(q.text, m.id, `quotes[${i}]`));
    for (const c of m.concerns ?? []) leakCheck(c, m.id, "concerns");
    leakCheck(m.client?.blurb, m.id, "client.blurb");
    for (const f of m.assessment ?? []) leakCheck(f.note, m.id, `assessment/${f.label}`);
    /* And the rest of the briefing, so that "every pre-decision surface" is a
       statement about the content rather than about a list of field names
       somebody once wrote down. `situation` is the largest block of prose the
       player reads before choosing and was budgeted but never leak-checked. */
    leakCheck(m.question, m.id, "question");
    for (const s of m.situation) leakCheck(s, m.id, "situation");
    for (const v of m.variants ?? []) {
      for (const s of v.situation) leakCheck(s, `${m.id}/variant`, "situation");
    }
    for (const ch of m.context ?? []) leakCheck(ch.value, m.id, `context/${ch.label}`);
    /* Evidence cards and proposal components are options by another name — the
       player picks from them, so they are pre-decision copy with the same rule.
       `Evidence.reveals` is deliberately absent: that is what you learn AFTER
       spending a slot, which makes it outcome prose. */
    if (m.kind === "investigate") {
      for (const e of m.evidence) {
        leakCheck(e.label, `${m.id}/${e.id}`, "label");
        leakCheck(e.question, `${m.id}/${e.id}`, "question");
      }
    }
    if (m.kind === "build") {
      for (const comp of m.components) {
        leakCheck(comp.title, `${m.id}/${comp.id}`, "title");
        leakCheck(comp.description, `${m.id}/${comp.id}`, "description");
        leakCheck(comp.tag, `${m.id}/${comp.id}`, "tag");
      }
    }

    /* Density. See BUDGET. */
    const budget = (text: string | undefined, max: number, where: string, field: string) => {
      if (!text) return;
      const n = words(text);
      if (n > max) err(where, `"${field}" is ${n} words, budget is ${max} — cut it`);
    };

    budget(m.situation.join(" "), BUDGET.situation, m.id, "situation");
    for (const v of m.variants ?? []) {
      budget(v.situation.join(" "), BUDGET.situation, `${m.id}/variant`, "situation");
    }
    budget(m.objective, BUDGET.objective, m.id, "objective");
    budget(m.tip, BUDGET.tip, m.id, "tip");
    for (const c of m.consider ?? []) budget(c, BUDGET.consider, m.id, "consider");
    for (const c of m.concerns ?? []) budget(c, BUDGET.concern, m.id, "concerns");
    for (const f of m.assessment ?? []) budget(f.note, BUDGET.note, m.id, `assessment/${f.label}`);
    if (m.client) budget(m.client.blurb, BUDGET.blurb, m.id, "client.blurb");
    /* The four briefing fields that had no budget at all. Each of them renders
       into a box of fixed size — one line under the question, two lines in the
       advisor card, a pull-quote block — so an unbudgeted one does not read as
       long, it reads as broken. */
    budget(m.prompt, BUDGET.prompt, m.id, "prompt");
    advisorLines(m).forEach((l, i) =>
      budget(
        l,
        BUDGET.advisorLine,
        m.id,
        m.advisorLine instanceof Array ? `advisorLine[${i}]` : "advisorLine",
      ),
    );
    budget(m.advisor?.quote, BUDGET.advisorLine, m.id, "advisor.quote");
    budget(m.advisor?.steer, BUDGET.advisorLine, m.id, "advisor.steer");
    budget(m.saidQuote?.text, BUDGET.saidQuote, m.id, "saidQuote");
    (m.quotes ?? []).forEach((q, i) => budget(q.text, BUDGET.saidQuote, m.id, `quotes[${i}]`));
    budget(m.thinkAloud, BUDGET.thinkAloud, m.id, "thinkAloud");

    /* Reading is effortless (STRATEGY §2.6), on the decision unit it was written for. Every
       variant of the situation is held to 40 words, and the longest brief a player can be
       read — the longest situation, the longest line any client speaks here, and the
       colleague's think-aloud — to 120 before the panel opens. Measured on the longest of
       each rather than on a reachable combination, so it can only be stricter than play. */
    if (m.kind === "levers") {
      const situations = [m.situation, ...(m.variants ?? []).map((v) => v.situation)];
      for (const s of situations) budget(s.join(" "), BUDGET.leverSituation, m.id, "situation");
      const longest = (xs: (string | undefined)[]) => Math.max(0, ...xs.map((x) => (x ? words(x) : 0)));
      const spoken =
        longest(situations.map((s) => s.join(" "))) +
        longest([m.saidQuote?.text, ...(m.quotes ?? []).map((q) => q.text)]) +
        (m.thinkAloud ? words(m.thinkAloud) : 0);
      if (spoken > BUDGET.beforeChoice) {
        err(m.id, `the brief can run to ${spoken} words before the choice, budget is ${BUDGET.beforeChoice} — cut it`);
      }
    }

    if (m.kind === "choice") {
      if (m.options.length < 2) err(m.id, "a choice needs at least two options");
      const optIds = new Set<string>();
      for (const o of m.options) {
        if (optIds.has(o.id)) err(m.id, `duplicate option id "${o.id}"`);
        optIds.add(o.id);
        if (o.outcomes.length === 0) err(`${m.id}/${o.id}`, "option has no outcomes");
        const last = o.outcomes[o.outcomes.length - 1];
        if (last && last.when !== undefined) {
          err(
            `${m.id}/${o.id}`,
            "last outcome is conditional — every option needs an unconditional fallback",
          );
        }
        leakCheck(o.commits, `${m.id}/${o.id}`, "commits");
        leakCheck(o.description, `${m.id}/${o.id}`, "description");
        leakCheck(o.title, `${m.id}/${o.id}`, "title");
        /* `say` is pre-decision copy like any other: on a dialogue beat it is
           the ONLY thing the player reads about the option, so a prediction
           there is the leak with the largest audience, not the smallest. */
        leakCheck(o.say, `${m.id}/${o.id}`, "say");
        for (const p of o.pros ?? []) leakCheck(p, `${m.id}/${o.id}`, "pros");
        for (const c of o.cons ?? []) leakCheck(c, `${m.id}/${o.id}`, "cons");

        /* Density. A card is scanned, so pros and cons are tags, not sentences. */
        const oWhere = `${m.id}/${o.id}`;
        const oBudget = (text: string | undefined, max: number, field: string) => {
          if (!text) return;
          const n = words(text);
          if (n > max) err(oWhere, `"${field}" is ${n} words, budget is ${max} — cut it`);
        };
        oBudget(o.description, BUDGET.description, "description");
        oBudget(o.commits, BUDGET.commits, "commits");
        oBudget(o.say, BUDGET.say, "say");

        /* The option as a spoken reply.

           REQUIRED on every option of a dialogue mission, and an error rather
           than a warning, because the failure is silent and total: with `say`
           absent the renderer falls back to `title`, which is written in the
           third person for a comparison card — "The post-purchase experience"
           — so the beat renders a row of captions where a person should be
           talking. Nothing crashes, nothing looks broken enough to report, and
           the one thing the staging exists to do has quietly stopped
           happening. Same failure class as a condition reading a flag nothing
           sets. The message names both ids because the fix is in one option of
           one mission and the fastest route there is the pair. */
        if (m.presentation === "dialogue" && !o.say?.trim()) {
          err(
            oWhere,
            `option "${o.id}" of dialogue mission "${m.id}" has no "say" — it would fall back ` +
              `to the third-person "title" and the beat would stop being a conversation`,
          );
        }

        /* And `say` must be a fresh line, not the title in quotation marks.
           Same normalise/contentWords/overlap machinery as the lesson check
           above rather than a second similarity measure — two ways of asking
           whether two sentences say the same thing is two answers, and the
           second one is the one nobody recalibrates. See
           SAY_TITLE_OVERLAP_LIMIT for why this is a warning. */
        if (o.say?.trim() && o.title.trim()) {
          const spoken = contentWords(o.say);
          const captioned = contentWords(o.title);
          const same = normalise(o.say) === normalise(o.title);
          const shared = overlap(spoken, captioned);
          if (same) {
            warn(oWhere, `"say" is the "title" reworded only by punctuation — write the reply`);
          } else if (spoken.size >= LESSON_MIN_WORDS && shared >= SAY_TITLE_OVERLAP_LIMIT) {
            warn(
              oWhere,
              `"say" restates "title" (${shared.toFixed(2)} word overlap against a ${SAY_TITLE_OVERLAP_LIMIT} limit) — a reply should add the speaker's own words`,
            );
          }
        }
        for (const p of o.pros ?? []) oBudget(p, BUDGET.prosCons, "pros");
        for (const c of o.cons ?? []) oBudget(c, BUDGET.prosCons, "cons");
        if ((o.pros?.length ?? 0) > 2) err(oWhere, "more than two pros — a card is scanned, not read");
        if ((o.cons?.length ?? 0) > 2) err(oWhere, "more than two cons — a card is scanned, not read");

        /* Cards render pros above cons. One without the other reads as a verdict.
           The pairing was tested as `hasPros !== hasCons`, which is true only
           when exactly one side is present — so an option with NEITHER passed,
           and passed silently. That is the cheapest way to evade G3a entirely:
           delete both lists and the rule has nothing to compare. It is also a
           card with a title, a sentence and no grounds for choosing it, sitting
           beside siblings that show their costs, which is how the player learns
           to read the blank one as the safe one. Require both. */
        /* Counted on entries that actually say something. `pros: [""]` has
           length 1, so it satisfied every length test here while rendering a
           bullet with nothing beside it — the same evasion `changed` allowed
           until this pass, and the reason emptiness is now checked per entry
           rather than per list. */
        for (const [i, p] of (o.pros ?? []).entries()) {
          if (!p.trim()) err(oWhere, `"pros[${i}]" is empty — it renders as a bullet with no tag`);
        }
        for (const [i, cc] of (o.cons ?? []).entries()) {
          if (!cc.trim()) err(oWhere, `"cons[${i}]" is empty — it renders as a bullet with no tag`);
        }
        const hasPros = (o.pros ?? []).some((p) => p.trim().length > 0);
        const hasCons = (o.cons ?? []).some((c2) => c2.trim().length > 0);
        if (!hasPros && !hasCons) {
          err(oWhere, "an option lists neither pros nor cons — the player is choosing blind");
        } else if (!hasCons) {
          err(oWhere, "an option lists pros without cons — that presents it as the right answer");
        } else if (!hasPros) {
          err(oWhere, "an option lists cons without pros — that presents it as the wrong answer");
        }
      }
    }

    if (m.kind === "investigate") {
      if (m.slots >= m.evidence.length) {
        err(m.id, `slots (${m.slots}) must be fewer than evidence (${m.evidence.length}) — otherwise there is no trade-off`);
      }
      if (m.slots < 1) err(m.id, "slots must be at least 1");
      const last = m.outcomes[m.outcomes.length - 1];
      if (!last || last.when !== undefined) err(m.id, "needs an unconditional fallback outcome");
    }

    if (m.kind === "build") {
      if (m.pick >= m.components.length) {
        err(m.id, `pick (${m.pick}) must be fewer than components (${m.components.length})`);
      }
      if (m.pick < 1) err(m.id, "pick must be at least 1");
      const last = m.outcomes[m.outcomes.length - 1];
      if (!last || last.when !== undefined) err(m.id, "needs an unconditional fallback outcome");
    }

    /* Lever decisions — the rules in `docs/LEVERS.md` (D-084), made mechanical. */
    if (m.kind === "levers") {
      if (m.levers.length < LEVERS_MIN || m.levers.length > LEVERS_MAX) {
        err(
          m.id,
          `a lever decision needs ${LEVERS_MIN} to ${LEVERS_MAX} levers, and this has ${m.levers.length}`,
        );
      }
      const after = readAfter(m);
      const leverIds = new Set<string>();
      const settingIds = new Set<string>();
      const touch = (o: LeverOption, d: DimensionId): number => o.dims?.[d] ?? 0;

      for (const l of m.levers) {
        const lWhere = `${m.id}/${l.id}`;
        if (leverIds.has(l.id)) err(m.id, `duplicate lever id "${l.id}"`);
        leverIds.add(l.id);
        if (!l.label?.trim()) err(lWhere, "lever has no label — the row would have no name");
        leakCheck(l.label, lWhere, "lever label");
        budget(l.label, BUDGET.leverLabel, lWhere, "lever label");

        if (l.options.length < SETTINGS_MIN || l.options.length > SETTINGS_MAX) {
          err(
            lWhere,
            `a lever needs ${SETTINGS_MIN} to ${SETTINGS_MAX} settings, and this has ${l.options.length}`,
          );
        }
        /* Not in the contract, and needed by it. A lever whose every setting is locked
           leaves a player without the cards no combination at all: the decision cannot be
           committed, `possibleSelections` returns nothing, and the sweep quietly drops the
           state rather than failing — so the one run that hits it simply stops. */
        if (l.options.length > 0 && l.options.every((o) => o.requires !== undefined)) {
          err(
            lWhere,
            "every setting on this lever can be locked, so a player without the cards could not " +
              "set it and the decision could not be committed — leave one setting unconditional",
          );
        }

        for (const o of l.options) {
          const oWhere = `${lWhere}/${o.id}`;
          if (settingIds.has(o.id)) {
            err(
              m.id,
              `duplicate setting id "${o.id}" — ids are unique across the whole decision, because ` +
                `history records them without their lever`,
            );
          }
          settingIds.add(o.id);
          if (!o.label?.trim()) err(oWhere, "setting has no label");
          if (!o.detail?.trim()) err(oWhere, "setting has no detail — say what we would actually do");
          /* All three are read before the decision, so G3 applies to all three. */
          leakCheck(o.label, oWhere, "label");
          leakCheck(o.detail, oWhere, "detail");
          leakCheck(o.say, oWhere, "say");
          budget(o.label, BUDGET.settingLabel, oWhere, "label");
          budget(o.detail, BUDGET.settingDetail, oWhere, "detail");
          budget(o.say, BUDGET.say, oWhere, "say");

          for (const f of o.flags ?? []) {
            if (!after.has(f) && !cards.has(f)) {
              err(
                oWhere,
                `setting "${o.id}" sets flag "${f}", which nothing reads later and which is not a ` +
                  `named card — the player is handed something that does nothing and cannot be seen`,
              );
            }
          }
        }

        /* No dominant setting: the lever-level fake choice, by `dims` alone because that is
           all the panel shows — a dot per bar a setting moves. A setting that is at least
           as good on every bar and better on one is visibly free, whatever its flags do
           later. CLAUDE.md's fix applies: give the weaker setting a genuine upside rather
           than weakening the stronger one. Equal settings are not a finding; they differ,
           if at all, in the cards they hand over. */
        for (const a of l.options) {
          for (const b of l.options) {
            if (a === b) continue;
            const atLeast = DIMENSIONS.every((d) => touch(a, d) >= touch(b, d));
            const better = DIMENSIONS.some((d) => touch(a, d) > touch(b, d));
            if (atLeast && better) {
              err(
                lWhere,
                `setting "${a.id}" beats "${b.id}" on every bar by its dims alone — "${b.label}" is ` +
                  `a fake choice; give it a genuine upside rather than weakening "${a.label}"`,
              );
            }
          }
        }
      }

      const last = m.outcomes[m.outcomes.length - 1];
      if (!last || last.when !== undefined) err(m.id, "needs an unconditional fallback outcome");
    }

    for (const { outcome, where } of missionOutcomes(m)) {
      if (!outcome.headline) err(where, `outcome "${outcome.id}" has no headline (what happened)`);
      if (!outcome.detail) err(where, `outcome "${outcome.id}" has no detail (why it happened)`);

      /* `changed` answers "what is now different" — the last of G5's four parts,
         and the only one rendered as a list. Emptiness was the only thing
         checked, so `changed: ["", ""]` satisfied it: two bullet glyphs with no
         text beside them. Everything below is a property of that list rather
         than of its prose, which is why the consequence screen's deliberate
         exemption from word budgets does not cover it. */
      if (outcome.changed.length === 0) {
        err(where, `outcome "${outcome.id}" lists nothing that changed`);
      }
      if (outcome.changed.length > 4) {
        err(
          where,
          `outcome "${outcome.id}" lists ${outcome.changed.length} things that changed — more than four is a wall, not a list`,
        );
      }
      const seenChanged = new Set<string>();
      for (const [i, entry] of outcome.changed.entries()) {
        const cWhere = `${where}/${outcome.id}`;
        if (!entry.trim()) {
          err(cWhere, `"changed[${i}]" is empty — it renders as a bullet with nothing after it`);
          continue;
        }
        budget(entry, BUDGET.changed, cWhere, `changed[${i}]`);

        /* A duplicate is a copy-paste that was never finished: the same line
           twice under "What is now different", which reads as a stutter and
           costs the player one of the few slots that carry consequence. */
        const key = normalise(entry);
        if (seenChanged.has(key)) {
          err(cWhere, `"changed[${i}]" repeats an earlier entry — ${JSON.stringify(entry)}`);
        }
        seenChanged.add(key);

        /* E5, never invent a number — and here the engine is producing the real
           one six inches away. These bullets sit directly beneath the animated
           meter deltas, so a hand-written "+8 winability" is a second, rival
           source for a figure the engine owns. The moment anyone retunes
           `effect.dims` the prose becomes a lie, and nothing will ever correct
           it, because no test compares prose to arithmetic. State the change in
           the world; let the meters state their own. */
        if (/(?:^|\s)[+\-−–]\d/.test(entry)) {
          err(cWhere, `"changed[${i}]" states a signed number — the meters own the deltas`);
        }
        if (/\d+\s*(?:%|points?\b|pts?\b)/i.test(entry)) {
          err(cWhere, `"changed[${i}]" states a score movement — the meters own the deltas`);
        }
        if (/\d[^.]{0,24}(winability|profitability|deliverability)/i.test(entry) ||
            /(winability|profitability|deliverability)[^.]{0,24}\d/i.test(entry)) {
          err(cWhere, `"changed[${i}]" puts a number next to a dimension name — the meters own that`);
        }
      }
    }
  }

  /* ── lesson distinctness ──────────────────────────────────────
   * G2a requires every mission to declare a lesson, and that was the whole of
   * the check: sixteen missions could have carried the SAME sentence and the
   * validator, the pedagogy tests and the exhaustive sweep would all have
   * stayed green. A curriculum is a set of distinct objectives. A game that
   * teaches one thing sixteen times is one mission and fifteen reprises, and
   * the failure is invisible from inside any single mission — which is exactly
   * the kind of defect a whole-content pass exists to find.
   *
   * Compared three ways, because each is the cheapest evasion of the one
   * before it: identical text, then normalised text (an exact-string check is
   * defeated by adding a full stop), then content-word overlap (normalising is
   * defeated by changing one word). If a reprise is ever deliberate, the two
   * missions should share one lesson object rather than paraphrase it. */

  const missionsInOrder = nodes.filter(isMission);

  /* One exception, and it is the act's idea (D-086). An act teaches one idea through two
     decisions, so its decisions share a principle by design, in the same words — which is
     what `Chapter.idea` declares and what the check after this one holds them to. The same
     sentence in two DIFFERENT acts is still two lessons teaching one, and a paraphrase is
     never a deliberate reprise anywhere: the whole point of the idea is that it is not
     reworded. */
  const ideaOf = new Map(content.chapters.filter((c) => c.idea).map((c) => [c.number, c.idea as string]));
  for (const field of ["principle", "because"] as const) {
    const lines = missionsInOrder.map((m) => ({
      id: m.id,
      chapter: m.chapter,
      text: m.lesson?.[field] ?? "",
      key: normalise(m.lesson?.[field] ?? ""),
      bag: contentWords(m.lesson?.[field] ?? ""),
    }));
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const a = lines[i];
        const b = lines[j];
        if (!a.key || !b.key) continue; // absent lessons are already an error above
        const actIdea =
          field === "principle" &&
          a.chapter === b.chapter &&
          ideaOf.has(a.chapter) &&
          a.text === ideaOf.get(a.chapter) &&
          b.text === a.text;
        if (actIdea) continue;
        if (a.key === b.key) {
          err(
            a.id,
            `lesson.${field} is the same as "${b.id}" — two missions cannot teach one sentence`,
          );
          continue;
        }
        if (a.bag.size < LESSON_MIN_WORDS || b.bag.size < LESSON_MIN_WORDS) continue;
        const o = overlap(a.bag, b.bag);
        if (o >= LESSON_OVERLAP_LIMIT) {
          err(
            a.id,
            `lesson.${field} is a paraphrase of "${b.id}" (${o.toFixed(2)} word overlap against a ${LESSON_OVERLAP_LIMIT} limit) — make it a different lesson or share one`,
          );
        }
      }
    }
  }

  /* An outcome `lesson` exists to say something the mission's own lesson cannot
     say on that branch. One that is byte-identical to the mission lesson is an
     override that overrides nothing — invariably a paste that was going to be
     edited. It is silent, because the player sees exactly the right words; what
     is lost is the branch-specific teaching somebody meant to write. */
  for (const m of missionsInOrder) {
    for (const { outcome, where } of missionOutcomes(m)) {
      if (!outcome.lesson || !m.lesson) continue;
      if (
        normalise(outcome.lesson.principle) === normalise(m.lesson.principle) &&
        normalise(outcome.lesson.because) === normalise(m.lesson.because)
      ) {
        err(
          where,
          `outcome "${outcome.id}" overrides the lesson with the mission's own lesson — delete it or write the branch's lesson`,
        );
      }
    }
  }

  /* ── mission order ───────────────────────────────────────────── */

  const actualMissions = nodes.filter(isMission).map((m) => m.id);
  for (const id of content.missionOrder) {
    if (!actualMissions.includes(id)) err("content", `missionOrder lists "${id}", which is not a mission`);
  }
  for (const id of actualMissions) {
    if (!content.missionOrder.includes(id)) err("content", `mission "${id}" is missing from missionOrder`);
  }

  /* ── chapters ────────────────────────────────────────────────
   * The stepper and the left-rail checklist are both generated from this,
   * so a mismatch shows up as a mission with no step name or a chapter
   * that never lights up. */

  if (content.chapters.length === 0) err("content", "no chapters — the stepper would be empty");

  const claimed = new Map<string, number>();
  for (const ch of content.chapters) {
    const where = `chapter ${ch.number}`;
    if (!ch.label || !ch.title) err(where, "chapter needs both a short label and a title");
    if (ch.missionIds.length === 0) err(where, "chapter contains no missions");
    if (ch.steps.length !== ch.missionIds.length) {
      err(
        where,
        `${ch.steps.length} step names for ${ch.missionIds.length} missions — the rail checklist needs one each`,
      );
    }
    for (const id of ch.missionIds) {
      const mission = content.nodes[id];
      if (!mission || !isMission(mission)) {
        err(where, `lists "${id}", which is not a mission`);
        continue;
      }
      if (mission.chapter !== ch.number) {
        err(where, `lists "${id}", but that mission declares chapter ${mission.chapter}`);
      }
      if (claimed.has(id)) {
        err(where, `"${id}" is already claimed by chapter ${claimed.get(id)}`);
      }
      claimed.set(id, ch.number);
    }
  }
  for (const id of actualMissions) {
    if (!claimed.has(id)) err("content", `mission "${id}" belongs to no chapter`);
  }

  /* ── one idea per act, in the same words (D-086) ─────────────
   * STRATEGY §2.2: four ideas, one per act, always in the same words, and every lesson in
   * the game filed under one of them. Where an act declares its idea, every lesson in it —
   * the decision's own and every outcome's override — carries that idea as its principle,
   * exactly; the per-branch teaching lives in `because`. And no two acts share an idea. */
  const ideas = new Map<string, number>();
  for (const ch of content.chapters) {
    if (!ch.idea) continue;
    if (!ch.idea.trim()) err(`chapter ${ch.number}`, "chapter idea is empty");
    if (ideas.has(normalise(ch.idea))) err(`chapter ${ch.number}`, `shares its idea with chapter ${ideas.get(normalise(ch.idea))}`);
    ideas.set(normalise(ch.idea), ch.number);
    leakCheck(ch.idea, `chapter ${ch.number}`, "idea");
    for (const id of ch.missionIds) {
      const m = content.nodes[id];
      if (!m || !isMission(m)) continue;
      if (m.lesson?.principle !== ch.idea) {
        err(m.id, `lesson.principle must be the act's idea word for word: "${ch.idea}"`);
      }
      for (const { outcome, where } of missionOutcomes(m)) {
        if (outcome.lesson && outcome.lesson.principle !== ch.idea) {
          err(where, `outcome "${outcome.id}" teaches a principle that is not the act's idea: "${ch.idea}"`);
        }
      }
    }
  }

  /* ── model, prompt, let go (D-086) ───────────────────────────
   * STRATEGY §2.7, for lever decisions: in each act the first decision is MODELLED (the
   * colleague thinks aloud and gives no hints), the second is PROMPTED (exactly one hint,
   * under "Ask", and no think-aloud), and any after that are the player's own (neither).
   * `tip` and `advisorLine` are hints by another name — they render under the same "Ask" —
   * so a lever decision carries neither, and the one hint is its single `consider` line. */
  for (const ch of content.chapters) {
    const levers = content.missionOrder
      .filter((id) => ch.missionIds.includes(id))
      .map((id) => content.nodes[id])
      .filter((n): n is LeverMission => !!n && isMission(n) && n.kind === "levers");
    levers.forEach((m, i) => {
      const hints = m.consider?.length ?? 0;
      if (m.tip) err(m.id, "a lever decision carries no tip — it is a second hint under \"Ask\"");
      if (m.advisorLine !== undefined) err(m.id, "a lever decision carries no advisorLine — its colleague models with thinkAloud or prompts with one consider line");
      if (i === 0) {
        if (!m.thinkAloud) err(m.id, "the first decision of an act is modelled: its colleague needs a thinkAloud");
        if (hints > 0) err(m.id, "a modelled decision gives no hints; the think-aloud is the help");
      } else if (i === 1) {
        if (m.thinkAloud) err(m.id, "the second decision of an act is prompted, not modelled: drop the thinkAloud");
        if (hints !== 1) err(m.id, `a prompted decision gives exactly one hint, and this has ${hints}`);
      } else if (m.thinkAloud || hints > 0) {
        err(m.id, "from the third decision of an act the player is on their own: no think-aloud and no hints");
      }
    });
  }

  const chapterNumbers = new Set(content.chapters.map((c) => c.number));
  for (const node of nodes) {
    // Chapter 0 deliberately sits outside the stepper, and the ending outside the
    // chapters entirely.
    if (node.kind === "ending" || node.kind === "setup") continue;
    if (!chapterNumbers.has(node.chapter)) {
      err(node.id, `declares chapter ${node.chapter}, which is not in content.chapters`);
    }
  }

  /* ── chapter 0 ────────────────────────────────────────────── */

  for (const node of nodes) {
    if (node.kind !== "setup") continue;
    if (node.options.length < 2) err(node.id, "a starting advantage needs at least two options");
    /* Chapter 0 is the one screen that is entirely pre-decision, and it was the
       one screen with no leak check on it. "The recommended starting position"
       on a character-creation card is G3 broken before the game begins. */
    for (const b of node.body) leakCheck(b, node.id, "body");
    leakCheck(node.question, node.id, "question");
    for (const o of node.options) {
      if (o.flags.length === 0) {
        err(`${node.id}/${o.id}`, "a starting advantage that sets no flags is not an advantage");
      }
      if (o.strengths.length === 0) err(`${node.id}/${o.id}`, "missing strengths");
      if (!o.tradeoff) {
        err(`${node.id}/${o.id}`, "missing tradeoff — every advantage costs something");
      }
      leakCheck(o.title, `${node.id}/${o.id}`, "title");
      leakCheck(o.description, `${node.id}/${o.id}`, "description");
      leakCheck(o.tradeoff, `${node.id}/${o.id}`, "tradeoff");
      for (const s of o.strengths) leakCheck(s, `${node.id}/${o.id}`, "strengths");
      const n = words(o.description);
      if (n > BUDGET.description) {
        err(`${node.id}/${o.id}`, `"description" is ${n} words, budget is ${BUDGET.description}`);
      }
    }
  }

  return issues;
}

export function formatIssues(issues: Issue[]): string {
  if (issues.length === 0) return "content is valid";
  return issues
    .map((i) => `${i.severity.toUpperCase()}  ${i.where}\n        ${i.message}`)
    .join("\n");
}
