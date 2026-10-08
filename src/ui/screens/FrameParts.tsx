/**
 * Shared staging for the frame screens around the decisions (title, team, act openers and
 * breaks, story turns, journey, ending). Rendering only: nothing here reads a rule or decides
 * a branch. The scene's own primitives — Backdrop, Cutout, DialogueBox — do the heavy lifting;
 * this adds the two things every frame needs on top of them: a person who walks into the
 * room, and the deal's three measures drawn as they moved.
 */
import { useEffect, type CSSProperties } from 'react';
import type { DimensionId } from '../../engine/types';
import type { CharacterId } from '../../content/characters';
import { COPY } from '../../content/interface';
import { RULES } from '../../content/presentation';
import { Cutout, Glyph, type Frame } from '../parts';

/**
 * A person in a frame screen. `box` is their part of the room, in the stage's coordinates:
 * its bottom edge is the floor (or the table they stand behind), and `frame` places their face
 * inside it. The box carries the entrance, so the cut-out's own placement is never disturbed.
 */
export function Figure({ id, frame, box, enter = 'right', delay = 0, depth = 'front', className = '' }: {
  id: CharacterId | undefined; frame: Frame; box: CSSProperties;
  enter?: 'left' | 'right' | 'rise' | 'none'; delay?: number; depth?: 'front' | 'back'; className?: string;
}) {
  if (!id) return null;
  return <div className={'f-fig f-enter-' + enter + ' is-' + depth + (className ? ' ' + className : '')} style={{ ...box, ['--d' as string]: delay + 'ms' }} aria-hidden="true">
    <Cutout id={id} frame={frame} />
  </div>;
}

/** One of the three questions, as a coloured mark. Each question keeps its own colour everywhere. */
export function RuleMark({ id }: { id: DimensionId }) {
  return <span className={'f-mark q-' + id} aria-hidden="true"><Glyph name={id} /></span>;
}

/**
 * The deal's three measures. With `from`, each bar grows from where it stood to where it
 * stands and says by how much; without it, it simply shows the position. Numbers are the
 * engine's own (E5).
 */
export function Measures({ to, from, label, className = '' }: { to: Record<DimensionId, number>; from?: Record<DimensionId, number>; label: string; className?: string }) {
  return <ul className={'f-measures ' + className} aria-label={label}>
    {RULES.map((rule, i) => {
      const a = from?.[rule.id] ?? to[rule.id], b = to[rule.id], d = b - a;
      return <li key={rule.id} className={'f-measure q-' + rule.id + (d > 0 ? ' up' : d < 0 ? ' down' : '')} style={{ ['--i' as string]: i, ['--from' as string]: a + '%' }}>
        <RuleMark id={rule.id} />
        <span className="f-measure-q">{rule.question}</span>
        <span className="f-measure-bar" aria-hidden="true"><i style={{ width: b + '%' }} /></span>
        <span className="f-measure-v">{from ? <>{a}<span aria-hidden="true"> → </span><span className="sr-only"> {COPY.frames.to} </span>{b}</> : b}</span>
        {from && <span className="f-measure-d">{d > 0 ? '+' + d : d < 0 ? '−' + -d : COPY.frames.noChange}</span>}
      </li>;
    })}
  </ul>;
}

/**
 * Play a spoken frame by keyboard, the way the decision scene plays: Space, Enter or the
 * right arrow presses the screen's primary action. Only when nothing else has focus, so it
 * never fights a button, a field or a drawer, and never on a held key.
 */
export function useAdvanceKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || document.querySelector('dialog[open]')) return;
      if (t && t !== document.body && !t.matches('h1, h2, main, section')) return;
      if (![' ', 'Enter', 'ArrowRight'].includes(e.key)) return;
      const next = document.querySelector<HTMLButtonElement>('main [data-action="primary"]');
      if (next && !next.disabled) { e.preventDefault(); next.click(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/** Split a title into voiced words: connecting words whisper in italic, the last word is set on a label. */
const SMALL = new Set(['a', 'an', 'the', 'it', 'of', 'to', 'and', 'in', 'on', 'for', 'is']);
export function VoicedTitle({ text }: { text: string }) {
  const words = text.split(' ');
  return <>{words.map((w, i) => <span key={i}>
    {i > 0 && ' '}
    {i === words.length - 1 && words.length > 1 ? <span className="w-key" style={{ ['--w' as string]: i }}>{w}</span>
      : SMALL.has(w.toLowerCase()) ? <em className="w-small" style={{ ['--w' as string]: i }}>{w}</em>
        : <span className="w-word" style={{ ['--w' as string]: i }}>{w}</span>}
  </span>)}</>;
}
