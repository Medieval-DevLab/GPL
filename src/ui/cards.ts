/**
 * Your hand (D-083): what the run has given you, as cards you can see.
 *
 * The engine has always tracked what the player knows, has built and has promised, as flags,
 * and those flags quietly open and close options later. Players could not see any of it, so
 * cause and effect looked like chance. Here each flag the content names becomes a card in one
 * of two piles:
 * - Strengths: things you know or have built.
 * - Promises: things you owe, or risks you carry.
 *
 * Each card also says where it next matters, worked out from the content itself.
 *
 * Presentation only: this reads content and state and decides nothing.
 */
import type { Condition, Content, GameNode, GameState, Interlude } from '../engine/types';
import { EARNED } from '../content/gates';
import { MILESTONE } from '../content/presentation';

export type Pile = 'strength' | 'promise';
export interface Card { flag: string; title: string; where: string; pile: Pile; next?: { kind: 'opens' | 'pays' | 'due'; at: string } }

/* Flags that record a route rather than something you hold: shown elsewhere, never as a card. */
const NOT_A_CARD = new Set(['client:northwind', 'spent_effort', 'won', 'lost', 'signed', 'walked_away', 'scope:postpurchase', 'scope:storefront', 'scope:diagnostic', 'conventional']);
/* Not marked as a liability, but it is a promise: a third of the fee rides on a number. */
const ALSO_OWED = new Set(['outcome_based']);

const named = (c?: Condition) => [...(c?.all ?? []), ...(c?.any ?? [])];

/** Every flag a node reads in a way that unlocks an option, and every flag that steers how it lands. */
function reads(node: GameNode): { opens: Set<string>; steers: Set<string> } {
  const opens = new Set<string>(), steers = new Set<string>();
  if (node.kind === 'choice') for (const o of node.options) {
    named(o.requires).forEach(f => opens.add(f));
    o.outcomes.forEach(x => named(x.when).forEach(f => steers.add(f)));
  }
  if (node.kind === 'levers') node.levers.forEach(l => l.options.forEach(o => named(o.requires).forEach(f => opens.add(f))));
  if ('outcomes' in node && Array.isArray(node.outcomes)) node.outcomes.forEach((x: { when?: Condition }) => named(x.when).forEach(f => steers.add(f)));
  if ('variants' in node && Array.isArray(node.variants)) node.variants.forEach((v: { when?: Condition }) => named(v.when).forEach(f => steers.add(f)));
  return { opens, steers };
}

export function pileOf(flag: string): Pile { return EARNED[flag]?.liability || ALSO_OWED.has(flag) ? 'promise' : 'strength'; }
export const isCard = (flag: string) => !!EARNED[flag] && !NOT_A_CARD.has(flag);

/** The stops still ahead of the player, in order, with what each one reads. */
function ahead(state: GameState, content: Content) {
  return content.missionOrder.filter(id => !state.completed.includes(id) && id !== state.nodeId).map(id => ({ id, ...reads(content.nodes[id]) }));
}

/** Your hand, newest last: each card with the next stop where it opens an option, pays off, or comes due. */
export function handOf(state: GameState, content: Content): Card[] {
  const later = ahead(state, content);
  return state.flags.filter(isCard).map(flag => {
    const pile = pileOf(flag);
    /* The nearest later stop that reads the card, whichever way it reads it: a card that
       decides the next decision must not claim to matter only at the thirteenth (audit). */
    const hit = later.find(s => s.opens.has(flag) || s.steers.has(flag));
    const kind = pile === 'promise' ? 'due' : hit?.opens.has(flag) ? 'opens' : 'pays';
    return { flag, title: EARNED[flag].as, where: EARNED[flag].where, pile, next: hit ? { kind, at: MILESTONE[hit.id] ?? hit.id } : undefined };
  });
}

/** The cards one decision added, for the moment it lands. */
export function newCards(before: readonly string[], state: GameState, content: Content): Card[] {
  return handOf(state, content).filter(c => !before.includes(c.flag));
}

/** The flags a past decision set, read from the outcome it landed on. */
export function flagsSetBy(content: Content, missionId: string, outcomeId: string): string[] {
  const node = content.nodes[missionId];
  const outcomes = node.kind === 'choice' ? node.options.flatMap(o => o.outcomes) : 'outcomes' in node && Array.isArray(node.outcomes) ? node.outcomes : [];
  return (outcomes as { id: string; effect?: { flags?: string[] } }[]).find(o => o.id === outcomeId)?.effect?.flags ?? [];
}

/** A stage's name is the title its opening scene gave it, so the map, the top bar and the act agree. */
export function stageNameOf(content: Content, chapter: number): string {
  return Object.values(content.nodes).find((n): n is Interlude => n.kind === 'interlude' && n.role === 'chapter-open' && n.chapter === chapter)?.title
    ?? content.chapters.find(c => c.number === chapter)?.title ?? '';
}

/** The stop that can give you a flag: the first decision whose outcome, evidence or setup sets it. */
export function sourceOf(content: Content, flag: string): string | undefined {
  for (const id of content.missionOrder) {
    const node = content.nodes[id];
    const outcomes = node.kind === 'choice' ? node.options.flatMap(o => o.outcomes) : 'outcomes' in node && Array.isArray(node.outcomes) ? node.outcomes : [];
    const parts: { flags?: string[] }[] = node.kind === 'investigate' ? node.evidence : node.kind === 'build' ? node.components : node.kind === 'levers' ? node.levers.flatMap(l => l.options) : [];
    const sets = (outcomes as { effect?: { flags?: string[] } }[]).some(o => o.effect?.flags?.includes(flag)) || parts.some(e => e.flags?.includes(flag));
    if (sets) return MILESTONE[id];
  }
  const setup = Object.values(content.nodes).find(n => n.kind === 'setup');
  return setup?.kind === 'setup' && setup.options.some(o => o.flags?.includes(flag)) ? MILESTONE.setup : undefined;
}

/** The cards a resolution put in your hand: from the outcome, and from any evidence it revealed. */
export function cardsFrom(state: GameState, content: Content): Card[] {
  const r = state.resolution;
  if (!r) return [];
  const node = content.nodes[state.nodeId];
  const built = node.kind === 'build' ? node.components.filter(c => state.selection.includes(c.id)).flatMap(c => c.flags ?? [])
    : node.kind === 'levers' ? node.levers.flatMap(l => l.options).filter(o => state.selection.includes(o.id)).flatMap(o => o.flags ?? []) : [];
  const flags = new Set([...(r.outcome.effect.flags ?? []), ...r.revealed.flatMap(e => e.flags ?? []), ...built]);
  return handOf(state, content).filter(c => flags.has(c.flag));
}

export interface Link { card: Card; from: string; to?: string }
export interface ActLinks { decisions: { id: string; name: string; chose: string }[]; incoming: Link[]; outgoing: Link[] }

/** The flags one past decision put in your hand: from its outcome, and from what it picked. */
function setByEntry(content: Content, missionId: string, outcomeId: string, chosenIds: readonly string[]): string[] {
  const node = content.nodes[missionId];
  const picked: { id: string; flags?: string[] }[] = node.kind === 'investigate' ? node.evidence : node.kind === 'build' ? node.components : node.kind === 'levers' ? node.levers.flatMap(l => l.options) : [];
  return [...flagsSetBy(content, missionId, outcomeId), ...picked.filter(p => chosenIds.includes(p.id)).flatMap(p => p.flags ?? [])];
}

/** Where in the run a card was made: the index of the decision that put it in your hand, or -1. */
export const madeAt = (state: GameState, content: Content, flag: string) =>
  state.history.findIndex(h => setByEntry(content, h.missionId, h.outcomeId, h.chosenIds).includes(flag));

/** The first decision after `after` that read the card, as an index into the history, or -1. */
export function readAt(state: GameState, content: Content, flag: string, after: number): number {
  for (let i = after + 1; i < state.history.length; i++) {
    const { opens, steers } = reads(content.nodes[state.history[i].missionId]);
    if (opens.has(flag) || steers.has(flag)) return i;
  }
  return -1;
}

/**
 * One act as a system (D-084): what came into it from earlier, what it decided, and what it
 * sends forward. Incoming: cards earned before this act that this act's decisions read.
 * Outgoing: cards this act put in your hand, each with the later stop where it next matters.
 */
export function actLinks(state: GameState, content: Content, chapter: number): ActLinks {
  const entries = state.history.filter(h => h.chapter === chapter);
  const hand = new Map(handOf(state, content).map(c => [c.flag, c]));
  const card = (flag: string): Card => hand.get(flag) ?? { flag, title: EARNED[flag]?.as ?? flag, where: EARNED[flag]?.where ?? '', pile: pileOf(flag) };
  const earlierFlags = new Set(state.history.filter(h => h.chapter < chapter).flatMap(h => setByEntry(content, h.missionId, h.outcomeId, h.chosenIds)));
  state.flags.filter(f => f.startsWith('start:')).forEach(f => earlierFlags.add(f));
  const incoming: Link[] = [], outgoing: Link[] = [];
  for (const h of entries) {
    const { opens, steers } = reads(content.nodes[h.missionId]);
    for (const f of new Set([...opens, ...steers])) if (isCard(f) && earlierFlags.has(f) && state.flags.includes(f) && !incoming.some(l => l.card.flag === f)) incoming.push({ card: card(f), from: sourceOf(content, f) ?? '', to: h.missionId });
    for (const f of setByEntry(content, h.missionId, h.outcomeId, h.chosenIds)) if (isCard(f) && state.flags.includes(f) && !outgoing.some(l => l.card.flag === f)) outgoing.push({ card: card(f), from: h.missionId, to: hand.get(f)?.next?.at });
  }
  return { decisions: entries.map(h => ({ id: h.missionId, name: MILESTONE[h.missionId] ?? h.missionTitle, chose: h.chosenLabel })), incoming, outgoing };
}
