import type { Interlude } from '../../engine/types';
import { COPY } from '../../content/interface';
import { BACKDROP } from '../../content/presentation';
import { Action, Heading, Paras, Portrait, World } from '../parts';

/**
 * The valley in the interest curve. After a peak, the screen goes quiet: night, one lit
 * window, a notebook page and one question. Nothing here moves the deal, and the screen says
 * so by looking like nothing else in the game.
 */
export function Reflection({ node, answer, onAnswer, onNext }: { node: Interlude; answer: string | undefined; onAnswer(a: string): void; onNext(): void }) {
  return <section className="stage scr-reflect">
    <World backdrop={BACKDROP[node.id] ?? 'env-windows-night'} mood="night" />
    <div className="notebook paper enter-fade">
      <p className="mono notebook-head">{COPY.stage.reflect} · Chapter {node.chapter}</p>
      <Heading className="notebook-title serif">{node.title}</Heading>
      <Paras lines={node.body} className="notebook-body serif" />
      {node.advisor && <p className="notebook-from"><Portrait name={node.advisor.name} /><span><strong>{node.advisor.name}</strong><small>{node.advisor.role}</small></span></p>}
      {node.prompt && <h2 className="notebook-prompt serif">{node.prompt}</h2>}
      <div className="answers" role="group" aria-label={node.prompt}>
        {node.responses?.map(r => <button key={r} aria-pressed={answer === r} onClick={() => onAnswer(r)}><span className="tick" aria-hidden="true">{answer === r ? '✓' : ''}</span><span className="serif">{r}</span></button>)}
      </div>
      <p className="notebook-note">{COPY.reflectionNote}</p>
    </div>
    <footer className="cmd-bar"><p /><Action onClick={onNext}>{answer ? COPY.next : COPY.stage.noResponse}</Action></footer>
  </section>;
}
