import type { Setup as SetupNode } from '../../engine/types';
import { COPY } from '../../content/interface';
import { Action, Heading, Paras } from '../parts';

/** The one choice made before the story starts: what your team is good at, and what it is not. */
export function Setup({ node, selected, onPick, onConfirm }: { node: SetupNode; selected: string | null; onPick(id: string): void; onConfirm(): void }) {
  return <section className="page scr-setup">
    <div className="frame">
      <header className="setup-head">
        <p className="kicker">{node.eyebrow} · {COPY.stage.yourTeam}</p>
        <Heading className="h1">{node.title}</Heading>
        <Paras lines={node.body} className="read" />
      </header>
      <h2 className="setup-q">{node.question}</h2>
      <div className="team-cards" role="group" aria-label={node.question}>
        {node.options.map((o, i) => {
          const on = selected === o.id;
          return <button key={o.id} className={'team-card enter' + (on ? ' is-selected' : '')} style={{ ['--i' as string]: i }} data-choice={o.id} aria-pressed={on} onClick={() => onPick(o.id)}>
            <span className="name">{o.title}</span>
            <span className="desc">{o.description}</span>
            <span className="tags">{o.strengths.map(s => <span key={s}>{s}</span>)}</span>
            <span className="trade"><b>The trade-off</b>{o.tradeoff}</span>
            <span className="mark" aria-hidden="true">{on ? '✓ Chosen' : 'Choose'}</span>
          </button>;
        })}
      </div>
    </div>
    <footer className="cmd-bar"><p>Different strengths. Different starting conversations.</p><Action disabled={!selected} onClick={onConfirm}>{COPY.setup}</Action></footer>
  </section>;
}
