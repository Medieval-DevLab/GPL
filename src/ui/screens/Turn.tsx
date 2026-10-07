import type { Interlude } from '../../engine/types';
import { COPY } from '../../content/interface';
import { TURN_DRESSING, placeOf } from '../../content/presentation';
import { Action, Heading, art } from '../parts';

/**
 * A story turn: something that happened elsewhere, and the one screen in an act that is not
 * a decision. It earns its screen because the situation has changed. It arrives as the thing
 * it would arrive as, set beside the narration rather than over it.
 */
export function Turn({ node, onNext }: { node: Interlude; onNext(): void }) {
  const dress = TURN_DRESSING[node.id];
  const place = placeOf(node.id);
  return <section className="page scr-turn">
    <div className="frame">
      <div className="turn">
        <div>
          <p className="kicker">{node.eyebrow}</p>
          <Heading className="h1">{node.title}</Heading>
          <div className="read">{node.body.map((p, i) => <p key={i}>{p}</p>)}</div>
          {node.prompt && <p className="turn-pull">{node.prompt}</p>}
        </div>
        {dress?.format === 'press' && <article className="artefact" aria-label={dress.masthead}>
          <div className="masthead"><span className="masthead-name">{dress.masthead}</span><span>{dress.section}</span></div>
          <p className="art-head">{node.title}</p>
          <img src={art(place.photo)} alt="" />
        </article>}
        {dress?.format === 'mail' && <article className="artefact" aria-label={dress.app}>
          <dl className="meta-row"><dt>From</dt><dd>{dress.from}</dd><dt>Received</dt><dd>{node.eyebrow.split(',')[0]}, {dress.time}</dd></dl>
          <p className="mail-subject">{dress.subject}</p>
          <p className="mail-preview">{dress.preview}</p>
        </article>}
        {dress?.format === 'memo' && <article className="artefact" aria-label={dress.label}>
          <p className="org">{dress.organisation} · {dress.label}</p>
          <p className="art-head">{dress.subject}</p>
          <p className="mail-preview">From: {dress.from}</p>
        </article>}
      </div>
    </div>
    <footer className="cmd-bar"><p /><Action onClick={onNext}>{COPY.next}</Action></footer>
  </section>;
}
