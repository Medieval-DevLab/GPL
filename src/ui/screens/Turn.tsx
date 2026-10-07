import type { Interlude } from '../../engine/types';
import { COPY } from '../../content/interface';
import { BACKDROP, TURN_DRESSING } from '../../content/presentation';
import { Action, Heading, World, art } from '../parts';

/**
 * A story turn arrives as the thing it would arrive as. Suzerain carries its world through
 * newspapers; Papers, Please opens each day with one. The narration is the content and is
 * never paraphrased; the artefact around it invents nothing the story does not say.
 */
export function Turn({ node, onNext }: { node: Interlude; onNext(): void }) {
  const dress = TURN_DRESSING[node.id] ?? { format: 'memo', organisation: 'Orion Retail', label: 'Update', subject: node.title, from: '' } as const;
  const backdrop = BACKDROP[node.id] ?? 'env-skyline-dusk';
  if (dress.format === 'press') return <section className="stage scr-turn turn-press">
    <World backdrop={backdrop} mood="blur" />
    <article className="newspaper paper enter-slide">
      <header className="masthead">
        <p className="mono">{node.eyebrow}</p>
        <p className="masthead-name serif">{dress.masthead}</p>
        <p className="mono">{dress.section}</p>
      </header>
      <p className="press-kicker mono">{dress.kicker}</p>
      <Heading className="press-headline serif">{node.title}</Heading>
      <div className="press-body">
        <figure className="press-photo" aria-hidden="true"><img src={art(backdrop)} alt="" /></figure>
        <div className="press-columns serif">{node.body.map((p, i) => <p key={i}>{p}</p>)}</div>
      </div>
      {node.prompt && <p className="press-pull serif">{node.prompt}</p>}
    </article>
    <footer className="cmd-bar"><p /><Action onClick={onNext}>{COPY.next}</Action></footer>
  </section>;

  return <section className={'stage scr-turn turn-' + dress.format}>
    <World backdrop={backdrop} mood="dim" />
    <div className="turn-grid">
      <div className="turn-narration">
        <p className="kicker enter-rise">{node.eyebrow}</p>
        <Heading className="display enter-slam">{node.title}</Heading>
        <div className="turn-body serif">{node.body.map((p, i) => <p key={i} className="enter-rise" style={{ ['--i' as string]: i + 1 }}>{p}</p>)}</div>
        {node.prompt && <p className="turn-pull enter-rise" style={{ ['--i' as string]: node.body.length + 1 }}>{node.prompt}</p>}
      </div>
      {dress.format === 'mail'
        ? <div className="phone enter-deal" style={{ ['--r' as string]: '-4deg' }} aria-hidden="true">
            <div className="phone-screen">
              <p className="phone-time display">{dress.time}</p>
              <p className="phone-date mono">{node.eyebrow.split(',')[0]}</p>
              <div className="notification glass"><p className="mono">{dress.app} · now</p><strong>{dress.from}</strong><b>{dress.subject}</b><span>{dress.preview}</span></div>
            </div>
          </div>
        : dress.format === 'memo'
          ? <article className="memo paper enter-deal" style={{ ['--r' as string]: '2deg' }} aria-hidden="true">
              <p className="memo-org mono">{dress.organisation} · {dress.label}</p>
              <p className="memo-subject serif">{dress.subject}</p>
              <p className="memo-from mono">From: {dress.from}</p>
              <div className="memo-lines"><i /><i /><i /><i /><i /></div>
            </article>
          : null}
    </div>
    <footer className="cmd-bar"><p /><Action onClick={onNext}>{COPY.next}</Action></footer>
  </section>;
}
