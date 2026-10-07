import type { Setup as SetupNode } from '../../engine/types';
import { COPY } from '../../content/interface';
import { Action, Cutout, Heading, Paras, World, pad2 } from '../parts';

/**
 * Character select, in the grammar of a game's opening choice: three tall cards held up in
 * front of the team that will live with the answer. The team stands behind the cards, out
 * of focus — they are the people this strength belongs to.
 */
export function Setup({ node, selected, onPick, onConfirm }: { node: SetupNode; selected: string | null; onPick(id: string): void; onConfirm(): void }) {
  return <section className="stage scr-setup">
    <World backdrop="env-glass-office" mood="dim" />
    <div className="setup-team" aria-hidden="true">
      <Cutout id="aisha" frame={{ x: '14%', y: 0.22, face: 0.16 }} className="is-back" />
      <Cutout id="arjun" frame={{ x: '50%', y: 0.12, face: 0.17 }} className="is-back" />
      <Cutout id="priya" frame={{ x: '86%', y: 0.16, face: 0.16 }} className="is-back" />
    </div>
    <header className="setup-head">
      <p className="kicker enter-rise">{node.eyebrow} · {COPY.stage.yourTeam}</p>
      <Heading className="display enter-slam">{node.title}</Heading>
      <Paras lines={node.body} className="setup-body prose enter-rise" />
    </header>
    <div className="setup-cards" role="group" aria-label={node.question}>
      <h2 className="setup-question">{node.question}</h2>
      {node.options.map((o, i) => {
        const on = selected === o.id;
        return <button key={o.id} className={'team-card enter-deal' + (on ? ' is-selected' : '') + (selected && !on ? ' is-dimmed' : '')} style={{ ['--i' as string]: i, ['--r' as string]: (i - 1) * 2 + 'deg' }}
          data-choice={o.id} aria-pressed={on} onClick={() => onPick(o.id)}>
          <span className="team-num mono">{pad2(i + 1)}</span>
          <span className="team-name display">{o.title}</span>
          <span className="team-desc">{o.description}</span>
          <span className="team-tags">{o.strengths.map(s => <span key={s}>{s}</span>)}</span>
          <span className="team-trade"><b>The trade-off</b>{o.tradeoff}</span>
          <span className="team-check" aria-hidden="true">{on ? 'Chosen' : 'Choose'}</span>
        </button>;
      })}
    </div>
    <footer className="cmd-bar"><p>Different strengths. Different starting conversations.</p><Action disabled={!selected} onClick={onConfirm}>{COPY.setup}</Action></footer>
  </section>;
}
