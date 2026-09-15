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

import { ENGINE_READ_FLAGS } from "./engine";
import {
  isMission,
  type Condition,
  type Content,
  type GameNode,
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
 * Outcome prose is NOT budgeted. The consequence screen has nothing else on it,
 * and that text is the actual teaching.
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
} as const;

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Words that would leak a predicted outcome into pre-decision copy. */
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

function conditionFlags(c: Condition | undefined): string[] {
  if (!c) return [];
  return [...(c.all ?? []), ...(c.any ?? []), ...(c.none ?? [])];
}

function missionOutcomes(m: Mission): { outcome: Outcome; where: string }[] {
  if (m.kind === "choice") {
    return m.options.flatMap((o) =>
      o.outcomes.map((outcome) => ({ outcome, where: `${m.id}/${o.id}` })),
    );
  }
  return m.outcomes.map((outcome) => ({ outcome, where: m.id }));
}

export function validateContent(content: Content): Issue[] {
  const issues: Issue[] = [];
  const err = (where: string, message: string) =>
    issues.push({ severity: "error", where, message });
  const warn = (where: string, message: string) =>
    issues.push({ severity: "warning", where, message });

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

  // Reachability from the start node.
  const reached = new Set<string>();
  const queue: string[] = [content.startNodeId];
  while (queue.length) {
    const id = queue.shift() as string;
    if (reached.has(id) || !ids.has(id)) continue;
    reached.add(id);
    const node = content.nodes[id];
    if (node && node.kind !== "ending") {
      queue.push((node as Exclude<GameNode, { kind: "ending" }>).next);
    }
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
  // a flag that very much is read. See ENGINE_READ_FLAGS in engine.ts.
  for (const f of ENGINE_READ_FLAGS) read.set(f, "engine");

  // Chapter 0 writes flags too, and it is not a mission.
  for (const node of nodes) {
    if (node.kind === "setup") for (const o of node.options) for (const f of o.flags) written.add(f);
  }

  for (const node of nodes) {
    if (!isMission(node)) continue;

    if (node.kind === "investigate") {
      for (const e of node.evidence) for (const f of e.flags ?? []) written.add(f);
    }
    if (node.kind === "build") {
      for (const c of node.components) for (const f of c.flags ?? []) written.add(f);
    }
    for (const { outcome } of missionOutcomes(node)) {
      for (const f of outcome.effect.flags ?? []) written.add(f);
    }

    const noteRead = (c: Condition | undefined, where: string) => {
      for (const f of conditionFlags(c)) if (!read.has(f)) read.set(f, where);
    };

    for (const v of node.variants ?? []) noteRead(v.when, `${node.id}/variant`);
    if (node.kind === "choice") {
      for (const o of node.options) {
        noteRead(o.requires, `${node.id}/${o.id}/requires`);
        for (const oc of o.outcomes) noteRead(oc.when, `${node.id}/${o.id}/${oc.id}`);
      }
    } else {
      for (const oc of node.outcomes) noteRead(oc.when, `${node.id}/${oc.id}`);
    }
  }

  for (const [flag, where] of read) {
    if (!written.has(flag)) {
      err(where, `condition reads flag "${flag}", which nothing ever sets (likely a typo)`);
    }
  }
  for (const flag of written) {
    if (!read.has(flag)) {
      warn("content", `flag "${flag}" is set but never read — dead state`);
    }
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
    if (node.kind === "choice") {
      for (const o of node.options) {
        checkDimGate(o.requires, `${node.id}/${o.id}/requires`);
        for (const oc of o.outcomes) checkDimGate(oc.when, `${node.id}/${o.id}/${oc.id}`);
      }
    } else {
      for (const oc of node.outcomes) checkDimGate(oc.when, `${node.id}/${oc.id}`);
    }
  }
  for (const where of dimGated) {
    warn(
      where,
      "condition gates on a dimension value — analysis.ts dedupes on flags only, so sweep coverage is no longer exhaustive. Widen the dedup key or remove the dimension gate.",
    );
  }

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
    if (!m.tip) err(m.id, "missing tip — the action bar renders one on every mission");
    if (!m.advisor) err(m.id, "missing advisor — the left rail renders one on every mission");
    if (!m.consider || m.consider.length < 2) {
      err(m.id, "needs at least two things to consider — one reads as an instruction");
    }

    /* Every pre-decision surface is leak-checked, not just `commits`. Anything
       the player reads BEFORE choosing may describe cost, never effect. */
    const leakCheck = (text: string | undefined, where: string, field: string) => {
      if (!text) return;
      const lower = text.toLowerCase();
      for (const term of OUTCOME_LEAK_TERMS) {
        if (lower.includes(term)) {
          err(where, `"${field}" predicts the outcome ("${term}") — describe cost, never effect`);
        }
      }
    };
    for (const c of m.consider ?? []) leakCheck(c, m.id, "consider");
    leakCheck(m.tip, m.id, "tip");
    leakCheck(m.objective, m.id, "objective");

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
        const optLeak = (text: string | undefined, field: string) => {
          if (!text) return;
          const lower = text.toLowerCase();
          for (const term of OUTCOME_LEAK_TERMS) {
            if (lower.includes(term)) {
              err(
                `${m.id}/${o.id}`,
                `"${field}" predicts the outcome ("${term}") — it may describe cost, never effect`,
              );
            }
          }
        };
        optLeak(o.commits, "commits");
        optLeak(o.description, "description");
        for (const p of o.pros ?? []) optLeak(p, "pros");
        for (const c of o.cons ?? []) optLeak(c, "cons");

        /* Density. A card is scanned, so pros and cons are tags, not sentences. */
        const oWhere = `${m.id}/${o.id}`;
        const oBudget = (text: string | undefined, max: number, field: string) => {
          if (!text) return;
          const n = words(text);
          if (n > max) err(oWhere, `"${field}" is ${n} words, budget is ${max} — cut it`);
        };
        oBudget(o.description, BUDGET.description, "description");
        oBudget(o.commits, BUDGET.commits, "commits");
        for (const p of o.pros ?? []) oBudget(p, BUDGET.prosCons, "pros");
        for (const c of o.cons ?? []) oBudget(c, BUDGET.prosCons, "cons");
        if ((o.pros?.length ?? 0) > 2) err(oWhere, "more than two pros — a card is scanned, not read");
        if ((o.cons?.length ?? 0) > 2) err(oWhere, "more than two cons — a card is scanned, not read");

        // Cards render pros above cons. One without the other reads as a verdict.
        const hasPros = (o.pros?.length ?? 0) > 0;
        const hasCons = (o.cons?.length ?? 0) > 0;
        if (hasPros !== hasCons) {
          err(
            `${m.id}/${o.id}`,
            "an option lists pros without cons (or the reverse) — that presents it as the right answer",
          );
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

    for (const { outcome, where } of missionOutcomes(m)) {
      if (!outcome.headline) err(where, `outcome "${outcome.id}" has no headline (what happened)`);
      if (!outcome.detail) err(where, `outcome "${outcome.id}" has no detail (why it happened)`);
      if (outcome.changed.length === 0) {
        err(where, `outcome "${outcome.id}" lists nothing that changed`);
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
    for (const o of node.options) {
      if (o.flags.length === 0) {
        err(`${node.id}/${o.id}`, "a starting advantage that sets no flags is not an advantage");
      }
      if (o.strengths.length === 0) err(`${node.id}/${o.id}`, "missing strengths");
      if (!o.tradeoff) {
        err(`${node.id}/${o.id}`, "missing tradeoff — every advantage costs something");
      }
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
