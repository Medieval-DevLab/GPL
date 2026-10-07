/** Shared stage parts. Rendering only: nothing here reads a rule or decides a branch. */
import type { CSSProperties, ReactNode } from 'react';
import type { DimensionId } from '../engine/types';
import { CUTOUT_FRAME, type BackdropAsset } from '../content/assets';
import { characterByName, type CharacterId } from '../content/characters';
import { COPY } from '../content/interface';

export const art = (asset: string) => './art/' + asset + '.webp';
export const castId = (name: string | undefined): CharacterId | undefined => characterByName(name)?.id;
export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Hide a failed image rather than show a broken icon; the live text never depends on it. */
const hideOnError = (event: React.SyntheticEvent<HTMLImageElement>) => { event.currentTarget.style.visibility = 'hidden'; };

export type WorldMood = 'room' | 'dim' | 'blur' | 'night' | 'vivid';
/** Plane 1: the graded location photograph. Always decorative. */
export function World({ backdrop, mood = 'room' }: { backdrop: BackdropAsset; mood?: WorldMood }) {
  return <div className={'world is-' + mood} aria-hidden="true">
    <img className="world-photo" src={art(backdrop)} alt="" decoding="async" onError={hideOnError} />
    <div className="world-grade" /><div className="world-light" /><div className="world-shade" /><div className="world-grain" />
  </div>;
}

/**
 * Plane 2: a person standing in the room. Decorative — their name is always in live text nearby.
 *
 * Framed by the face, in the coordinates of the containing frame: `x` is where the face is
 * centred horizontally (any CSS length), `y` is where the top of the face sits (fraction of
 * the frame's height) and `face` its height (same units).
 *
 * A figure must never float mid-air, so its bottom always reaches the bottom of the frame.
 * A long crop does that naturally and simply runs out of frame. A close crop (a head and
 * shoulders) cannot, so it is allowed to grow at most 30% past the target face size and then
 * sits lower in the frame instead — nearer the camera, which is what a close crop is. `close`
 * lifts that cap for the shots that want a full close-up, such as a video call.
 */
export interface Frame { x: string; y: number; face: number; close?: boolean }
export function Cutout({ id, frame, className = '', style }: { id: CharacterId | undefined; frame: Frame; className?: string; style?: CSSProperties }) {
  if (!id) return null;
  const m = CUTOUT_FRAME[id];
  const byFace = frame.face / m.size, toFloor = (1 - frame.y) / (1 - m.top);
  const height = toFloor <= byFace ? byFace : frame.close ? toFloor : Math.min(toFloor, byFace * 1.3);
  const top = toFloor <= byFace || frame.close ? frame.y - m.top * height : 1 - height;
  return <img className={'cutout ' + className} data-cast={id} src={art('cut-' + id)} alt="" decoding="async" onError={hideOnError}
    style={{ height: (height * 100).toFixed(2) + '%', top: (top * 100).toFixed(2) + '%', left: frame.x, translate: (-m.centre * 100).toFixed(1) + '% 0', ...style }} />;
}

/** A framed photograph of a person, for tiles and notes. */
export function Portrait({ name, className = '' }: { name: string | undefined; className?: string }) {
  const character = characterByName(name);
  if (!character) return <span className={'portrait portrait-empty ' + className} aria-hidden="true">{(name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2)}</span>;
  return <img className={'portrait ' + className} src={art(character.portrait)} alt="" decoding="async" style={{ objectPosition: character.focus }} onError={hideOnError} />;
}

export function Heading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h1 id="game-heading" tabIndex={-1} className={className}>{children}</h1>;
}

export function Paras({ lines, className }: { lines: readonly string[]; className?: string }) {
  return <div className={className}>{lines.map((line, i) => <p key={i}>{line}</p>)}</div>;
}

/**
 * The one decisive action on a screen. A double-click or a held Enter must not skip the
 * next beat — the transition lock in App catches most of it, this catches the rest.
 */
export function Action({ children, onClick, disabled = false, className = '' }: { children: ReactNode; onClick(): void; disabled?: boolean; className?: string }) {
  return <button className={'primary ' + className} data-primary data-action="primary" disabled={disabled}
    onClick={event => { if (event.detail < 2) onClick(); }}
    onKeyDown={event => { if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault(); }}>
    <span>{children}</span><span className="arrow" aria-hidden="true">→</span>
  </button>;
}

/** Effort and investment, 1–3. The only quantities a player sees before committing. */
export function Pips({ value, label }: { value: number; label: string }) {
  return <span className="pips" role="img" aria-label={label + ': ' + value + ' of 3'}>{[1, 2, 3].map(i => <i key={i} className={i <= value ? 'on' : ''} />)}</span>;
}

const ICONS: Record<string, ReactNode> = {
  win: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /></>,
  profit: <><ellipse cx="12" cy="6.5" rx="7" ry="2.8" /><path d="M5 6.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5" /><path d="M5 11.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5" /></>,
  deliver: <><path d="M12 3 21 8l-9 5-9-5 9-5Z" /><path d="m3 12.5 9 5 9-5" /><path d="m3 17 9 5 9-5" /></>,
  file: <><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.2h8.5A1.5 1.5 0 0 1 21 8.7v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5Z" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.9v.5" /><circle cx="12" cy="17.2" r=".9" fill="currentColor" /></>,
  settings: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2.2" /><circle cx="10" cy="17" r="2.2" /></>,
  save: <><path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" /><path d="M14 4h6v6" /><path d="m20 4-9 9" /></>,
  map: <><circle cx="6" cy="18" r="2.2" /><circle cx="18" cy="6" r="2.2" /><path d="M8 17c6-1 2-7 8-9" strokeDasharray="2 2.5" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="9.5" rx="1.6" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
  check: <path d="m5 12.5 4.2 4.2L19 7" />,
  pin: <><circle cx="12" cy="8" r="4.5" /><path d="M12 12.5V21" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  spark: <path d="M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8Z" />,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>,
};
export function Glyph({ name, className }: { name: keyof typeof ICONS | string; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name]}</svg>;
}

export const DIMENSION_ORDER: readonly DimensionId[] = ['win', 'profit', 'deliver'];

/** One business indicator. Glyph + label + number: hue never carries the meaning. */
export function Meter({ dim, value, delta, moving = false }: { dim: DimensionId; value: number; delta?: number; moving?: boolean }) {
  const meta = COPY.dimensions[dim];
  return <div className={'meter' + (moving ? ' is-moving' : '')} title={meta.question}>
    <Glyph name={dim} />
    <span className="label">{meta.short}</span>
    <span className="value"><span className="sr-only">{meta.label}: </span>{value}<span className="sr-only"> out of 100</span></span>
    <span className="bar" aria-hidden="true"><i style={{ transform: 'scaleX(' + value / 100 + ')' }} /></span>
    {delta ? <span className={'delta ' + (delta > 0 ? 'up' : 'down')}><span aria-hidden="true">{delta > 0 ? '▲' : '▼'}</span>{(delta > 0 ? '+' : '−') + Math.abs(delta)}</span> : null}
  </div>;
}
