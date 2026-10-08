import type { ReactNode } from 'react';
import type { Setup as SetupNode } from '../../engine/types';
import { COPY } from '../../content/interface';
import { placeOf } from '../../content/presentation';
import { Action, Backdrop, Heading, Paras } from '../parts';
import { Figure } from './FrameParts';

/** What each kind of team is good at, drawn. Keyed by the content's own icon id. */
const ICON: Record<string, ReactNode> = {
  talk: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v4a2.5 2.5 0 0 1-2.5 2.5H9l-3.5 3v-3A2.5 2.5 0 0 1 4 10.5Z" /><path d="M18 9.5h.5A1.5 1.5 0 0 1 20 11v4a1.5 1.5 0 0 1-1.5 1.5H18v2.5l-3-2.5h-3" /></>,
  layers: <><path d="M12 3 21 8l-9 5-9-5 9-5Z" /><path d="m3 12.5 9 5 9-5" /><path d="m3 17 9 5 9-5" /></>,
  scale: <><path d="M12 4v16M7 20h10M5 7h14" /><path d="m5 7-3 6a3 3 0 0 0 6 0Z" /><path d="m19 7-3 6a3 3 0 0 0 6 0Z" /></>,
};

/**
 * The one choice made before the story starts. Your team stands in the office behind the
 * three ways it could be good, and you pick which one it is. The cards are the choice; the
 * people are the reason it matters, because they are who you will be working with for five acts.
 */
export function Setup({ node, selected, onPick, onConfirm }: { node: SetupNode; selected: string | null; onPick(id: string): void; onConfirm(): void }) {
  const F = COPY.frames.setup;
  return <section className="page fs f-setup">
    <Backdrop photo={placeOf('setup').photo} />
    <div className="f-cast f-setup-team">
      <Figure id="arjun" enter="rise" delay={200} box={{ left: '41%', width: '18%', top: 0, bottom: 0 }} frame={{ x: '50%', y: 0.2, face: 0.2 }} />
      <Figure id="riya" enter="rise" delay={320} box={{ left: '54%', width: '18%', top: 0, bottom: 0 }} frame={{ x: '50%', y: 0.4, face: 0.24 }} />
      <Figure id="priya" enter="rise" delay={440} box={{ left: '67%', width: '16%', top: 0, bottom: 0 }} frame={{ x: '50%', y: 0.16, face: 0.2 }} />
      <Figure id="aisha" enter="rise" delay={560} box={{ left: '78%', width: '22%', top: 0, bottom: 0 }} frame={{ x: '50%', y: 0.36, face: 0.23 }} />
    </div>

    <header className="f-setup-head sheet">
      <p className="f-kicker">{node.eyebrow} · {F.team}</p>
      <Heading className="f-h1">{node.title}</Heading>
      <Paras lines={node.body} className="f-read" />
    </header>

    <div className="f-setup-choice">
      <h2 className="f-setup-q" id="setup-question">{node.question}</h2>
      <div className="f-team-cards" role="group" aria-labelledby="setup-question">
        {node.options.map((o, i) => {
          const on = selected === o.id;
          return <button key={o.id} className={'f-team-card' + (on ? ' is-on' : '')} style={{ ['--i' as string]: i }} data-choice={o.id} aria-pressed={on} onClick={() => onPick(o.id)}>
            <span className="f-team-top">
              <span className={'f-team-icon icon-' + i} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{ICON[o.icon] ?? ICON.layers}</svg></span>
              <span className="f-team-name">{o.title}</span>
            </span>
            <span className="f-team-desc">{o.description}</span>
            <span className="f-team-tags">{o.strengths.map(s => <span key={s}>{s}</span>)}</span>
            <span className="f-team-trade"><b>{F.tradeoff}</b> {o.tradeoff}</span>
            <span className="f-team-mark" aria-hidden="true">{on ? '✓ ' + F.chosen : F.choose}</span>
          </button>;
        })}
      </div>
    </div>

    <footer className="f-bar sheet"><p>{F.footer}</p><Action disabled={!selected} onClick={onConfirm}>{COPY.setup}</Action></footer>
  </section>;
}
