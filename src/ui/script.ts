/**
 * The script: a decision's content, performed by the people in the scene, one line at a time.
 *
 * GPL used to hand the player documents — the situation, the client's words, a colleague's
 * steer, the consequence, the reason and the lesson, all on screen at once in separate boxes
 * of equal weight. Nobody could tell what mattered. Here the same content is spoken: your
 * colleague explains, the client says their piece, and after you commit your colleague tells
 * you what happened, why, and what to keep (D-081).
 *
 * Presentation only. It reads content and engine state and decides nothing; every word is
 * authored content or interface copy.
 */
import type { Content, GameState, Mission } from '../engine/types';
import { outcomeBecause, resolveAdvisorLine, resolveSaidQuote, resolveSituation, type DimTest } from '../engine/engine';
import { COPY } from '../content/interface';
import { EARNED } from '../content/gates';
import { MISSION_RULE, ruleOf } from '../content/presentation';

export type Voice = 'say' | 'narrate' | 'why' | 'lesson';
export interface Line { who?: string; role?: string; text: string; voice: Voice; note?: string }

/**
 * Split long prose at sentence boundaries into pages a person can read at a glance.
 * A stop only ends a sentence when space or the end of the text follows it (after any
 * closing quote), so “£2.6m” and “Wait...” stay whole.
 */
export function paginate(text: string, max = 42): string[] {
  const sentences = text.match(/(?:[^.!?]|[.!?](?=[^\s"”’)]))+(?:[.!?]+["”’)]*|$)\s*/g)?.map(s => s.trim()).filter(Boolean) ?? [text];
  const pages: string[] = []; let page = '';
  for (const s of sentences) {
    const words = (page + ' ' + s).trim().split(/\s+/).length;
    if (page && words > max) { pages.push(page); page = s; } else page = (page + ' ' + s).trim();
  }
  if (page) pages.push(page);
  return pages;
}

/** Who stands in the scene: your colleague, and the person the decision is with. */
export function castOf(mission: Mission, state: GameState) {
  const quote = resolveSaidQuote(mission, state);
  const advisor = mission.advisor;
  const counterpart = quote && quote.speaker !== advisor?.name ? { name: quote.speaker, role: quote.role } : undefined;
  return { advisor, counterpart, quote };
}

/** Before the choice: your colleague sets it up, the client speaks, your colleague steers. */
export function briefLines(mission: Mission, state: GameState): Line[] {
  const { advisor, quote } = castOf(mission, state);
  const lines: Line[] = [];
  const situation = resolveSituation(mission, state).join(' ');
  for (const page of paginate(situation)) lines.push(advisor ? { who: advisor.name, role: advisor.role, text: page, voice: 'say' } : { text: page, voice: 'narrate' });
  if (quote) lines.push({ who: quote.speaker, role: quote.role, text: quote.text, voice: 'say' });
  /* The same chain the old renderer used: a beat without its own line hears the colleague's standing one. */
  const steer = resolveAdvisorLine(mission, state) ?? advisor?.quote;
  if (advisor && steer) lines.push({ who: advisor.name, role: advisor.role, text: steer, voice: 'say' });
  return lines;
}

const list = (items: string[]) => items.length <= 1 ? items.join('') : items.slice(0, -1).join(', ') + ' ' + COPY.say.and + ' ' + items.at(-1);
const dimText = (t: DimTest) => COPY.dimensions[t.dim].label.toLowerCase() + ' ' + (t.at === 'min' ? COPY.say.atLeast : COPY.say.atMost) + ' ' + t.value;

/** One sentence, in your colleague's voice, saying why it landed the way it did. */
export function whyLine(state: GameState, content: Content): string {
  const b = outcomeBecause(state, content);
  const name = (f: string) => EARNED[f]?.as.toLowerCase();
  const held = b.held.map(name).filter(Boolean) as string[];
  const lacked = b.lacked.map(name).filter(Boolean) as string[];
  const parts: string[] = [];
  if (held.length) parts.push(COPY.say.becauseHad + ' ' + list(held));
  if (lacked.length) parts.push((held.length ? COPY.say.andNot : COPY.say.becauseNot) + ' ' + list(lacked));
  if (b.dims.length) parts.push((parts.length ? COPY.say.andWith : COPY.say.becauseWith) + ' ' + list(b.dims.map(dimText)));
  let text = parts.length ? parts.join(', ') + '.' : '';
  const m = b.missed;
  const missed = m ? [...m.needed.map(name), ...(m.oneOf.length ? [COPY.say.oneOf + ' ' + m.oneOf.map(name).filter(Boolean).join(' ' + COPY.say.or + ' ')] : []), ...m.dims.map(dimText)].filter(Boolean) as string[] : [];
  const without = m ? m.without.map(name).filter(Boolean) as string[] : [];
  if (missed.length || without.length) {
    const alt = [missed.length ? COPY.say.differentWith + ' ' + list(missed) : '', without.length ? (missed.length ? COPY.say.orWithout : COPY.say.differentWithout) + ' ' + list(without) : ''].filter(Boolean).join(' ');
    text = (text ? text + ' ' : '') + alt + '.';
  }
  if (!text) text = b.conditional ? COPY.say.noDifference : COPY.say.alwaysSame;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** After the choice: what happened, why, and what to keep — from the colleague who briefed you. */
export function outcomeLines(mission: Mission, state: GameState, content: Content): Line[] {
  const result = state.resolution;
  if (!result) return [];
  const advisor = mission.advisor;
  const voice = (text: string, v: Voice, note?: string): Line => advisor ? { who: advisor.name, role: advisor.role, text, voice: v, note } : { text, voice: v === 'say' ? 'narrate' : v, note };
  const lines = paginate(result.outcome.detail).map(page => voice(page, 'say'));
  lines.push(voice(whyLine(state, content), 'why'));
  lines.push(voice(result.lesson.principle, 'lesson', COPY.say.filed + ' ' + ruleOf(MISSION_RULE[mission.id] ?? 'win').question));
  return lines;
}
