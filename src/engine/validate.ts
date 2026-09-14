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
        if (o.commits) {
          const lower = o.commits.toLowerCase();
          for (const term of OUTCOME_LEAK_TERMS) {
            if (lower.includes(term)) {
              err(
                `${m.id}/${o.id}`,
                `"commits" predicts the outcome ("${term}") — it may describe cost, never effect`,
              );
            }
          }
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

  return issues;
}

export function formatIssues(issues: Issue[]): string {
  if (issues.length === 0) return "content is valid";
  return issues
    .map((i) => `${i.severity.toUpperCase()}  ${i.where}\n        ${i.message}`)
    .join("\n");
}
