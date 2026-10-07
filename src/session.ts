import type { Content, GameState } from './engine/types';
import { decodeSave, encodeSave, LEGACY_SAVE_KEYS, saveKey, type LoadOutcome } from './engine/save';
import { codeFromState, decodeRun } from './engine/runcode';

export const ACTION_PLAN_LIMIT = 500;
export const ACTION_PLAN_FIELDS = [
  { key: 'action', label: 'One thing I will do differently', prompt: 'A specific question, conversation or commitment.' },
  { key: 'occasion', label: 'When I will try it', prompt: 'An upcoming situation, without client or colleague names.' },
  { key: 'evidence', label: 'How I will know it helped', prompt: 'Something observable, not just a good intention.' },
] as const;
export type ActionPlan = Record<typeof ACTION_PLAN_FIELDS[number]['key'], string>;
export const emptyActionPlan = (): ActionPlan => ({ action: '', occasion: '', evidence: '' });
export function normaliseActionPlan(value: unknown): ActionPlan {
  const result = emptyActionPlan();
  if (!value || typeof value !== 'object') return result;
  for (const { key } of ACTION_PLAN_FIELDS) {
    const text = (value as Record<string, unknown>)[key];
    if (typeof text === 'string') result[key] = text.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').slice(0, ACTION_PLAN_LIMIT);
  }
  return result;
}
export interface PresentationState { view: 'play' | 'map'; advantage: string | null; reflections: Record<string, string>; actionPlan: ActionPlan }
export interface Session { game: GameState; presentation: PresentationState }
export interface SavedSession { source: 'local' | 'lms'; session: Session }
export interface ResumeState { candidates: SavedSession[]; local: LoadOutcome; invalidLms: boolean }
export const emptyPresentation = (): PresentationState => ({ view: 'play', advantage: null, reflections: {}, actionPlan: emptyActionPlan() });
export function serialiseSession(session: Session, content: Content): string {
  return JSON.stringify({ ...JSON.parse(encodeSave(session.game, content)), presentation: { schema: 1, nodeId: session.game.nodeId, phase: session.game.phase, ...session.presentation } });
}
export function presentationFrom(raw: string | null, game: GameState, content: Content): PresentationState {
  const fallback = emptyPresentation();
  const node = content.nodes[game.nodeId];
  try {
    const p = raw ? JSON.parse(raw).presentation : null;
    if (p?.schema !== 1 || p.nodeId !== game.nodeId || p.phase !== game.phase) return fallback;
    const reflections: Record<string, string> = {};
    for (const [id, answer] of Object.entries(p.reflections ?? {})) {
      const reflection = content.nodes[id];
      if (reflection?.kind === 'interlude' && typeof answer === 'string' && reflection.responses?.includes(answer)) reflections[id] = answer;
    }
    return { view: p.view === 'map' && game.phase !== 'setup' && game.phase !== 'title' ? 'map' : 'play',
      advantage: node?.kind === 'setup' && node.options.some(o => o.id === p.advantage) ? p.advantage : null, reflections, actionPlan: normaliseActionPlan(p.actionPlan) };
  } catch { return fallback; }
}
export function readResume(content: Content, storage: Pick<Storage, 'getItem'> | null, lmsCode: string | null): ResumeState {
  let raw: string | null = null;
  try { raw = storage?.getItem(saveKey()) ?? LEGACY_SAVE_KEYS.map(k => storage?.getItem(k)).find(v => v != null) ?? null; } catch { /* storage can be disabled */ }
  const local = decodeSave(raw, content);
  const candidates: SavedSession[] = [];
  if (local.status === 'ok') candidates.push({ source: 'local', session: { game: local.state, presentation: presentationFrom(raw, local.state, content) } });
  let invalidLms = false;
  if (lmsCode) {
    const lms = decodeRun(content, lmsCode);
    if (!lms.ok) invalidLms = true;
    else if (local.status !== 'ok' || codeFromState(local.state, content) !== lmsCode) candidates.push({ source: 'lms', session: { game: lms.state, presentation: presentationFrom(null, lms.state, content) } });
  }
  return { candidates, local, invalidLms };
}
