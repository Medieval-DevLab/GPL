/**
 * The promise ledger and the ending, as the interface reads them (`LEVERS.md`, D-086).
 *
 * The engine is gaining `content.promises`, `state.settled` and `content.endings` in parallel
 * with this interface. These readers are written against that contract, structurally, so the
 * interface renders the new content the moment it is merged and renders today's content
 * (which has none of them) without a special case. Once the engine's own types land, the casts
 * below become no-ops and can be replaced by the engine's names.
 *
 * Reading only: nothing here settles a promise or chooses an ending. The engine does both.
 */
import type { Condition, Content, GameState } from '../engine/types';
import { evaluateCondition, finalVerdict } from '../engine/engine';

export type PromiseStatus = 'kept' | 'late' | 'broken' | 'void';
/** The part of a `PromiseRule` the calendar shows: which card, and when it falls due. */
export interface PromiseDue { flag: string; due: string; dueMonth: number }
/** A `PromiseResult`: how one card came due, and the line that says why. */
export interface PromiseSettled extends PromiseDue { status: PromiseStatus; line: string }

export function promiseRules(content: Content): readonly PromiseDue[] {
  return (content as Content & { promises?: readonly PromiseDue[] }).promises ?? [];
}

export function settledOf(state: GameState): readonly PromiseSettled[] | undefined {
  const settled = (state as GameState & { settled?: readonly PromiseSettled[] }).settled;
  return settled?.length ? [...settled].sort((a, b) => a.dueMonth - b.dueMonth) : undefined;
}

type Extra = { when?: Condition; text: string };

/**
 * The ending, exactly as `finalVerdict` returns it. With `content.endings` the engine returns the
 * matching `EndingRule`, whose extras each carry a condition; the contract has the ending screen
 * show every extra whose condition holds, so they are read here with the engine's own evaluator.
 * If the engine's signature gains the content, this is the one call to change.
 */
export function verdictOf(state: GameState): { title: string; summary: string; extras: string[] } {
  const v = finalVerdict(state.dims, state.flags) as { title: string; summary: string; extras?: readonly (Extra | string)[] };
  const extras = (v.extras ?? []).filter(x => typeof x === 'string' || evaluateCondition(x.when, state.flags, state.dims)).map(x => typeof x === 'string' ? x : x.text);
  return { title: v.title, summary: v.summary, extras };
}
