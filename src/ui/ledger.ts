/**
 * The promise ledger and the ending, as the interface reads them (`LEVERS.md`, D-086).
 *
 * Reading only: nothing here settles a promise or chooses an ending. The engine does both; this
 * gives the views one place to ask, so content without a ledger renders exactly as before.
 */
import type { Content, GameState, PromiseResult, PromiseRule } from '../engine/types';
import { finalVerdict } from '../engine/engine';

export type { PromiseStatus } from '../engine/types';
/** The part of a `PromiseRule` the calendar shows: which card, and when it falls due. */
export type PromiseDue = Pick<PromiseRule, 'flag' | 'due' | 'dueMonth'>;
export type PromiseSettled = PromiseResult;

export const promiseRules = (content: Content): readonly PromiseDue[] => content.promises ?? [];

/** How every promise came due, in month order, or undefined before the ledger is settled. */
export function settledOf(state: GameState): readonly PromiseSettled[] | undefined {
  return state.settled?.length ? [...state.settled].sort((a, b) => a.dueMonth - b.dueMonth) : undefined;
}

/** The ending exactly as the engine chooses it: the content's rule, with every extra that held. */
export function verdictOf(state: GameState, content: Content): { title: string; summary: string; extras: readonly string[] } {
  const v = finalVerdict(state.dims, state.flags, content);
  return { title: v.title, summary: v.summary, extras: v.extras ?? [] };
}
