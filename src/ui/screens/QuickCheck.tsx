import { useState } from 'react';
import { CHECK_COPY, type QuickCheck as Check } from '../../content/checks';

/**
 * A quick check (D-089): one question, one tap, then whether it was right and why. It is never
 * graded or stored, it never moves the deal, and it can be skipped. It is a rehearsal, not a
 * test.
 */
export function QuickCheck({ check, id }: { check: Check; id: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [skipped, setSkipped] = useState(false);
  if (skipped) return null;
  const done = picked !== null;
  const right = picked === check.answer;
  return <section className={'quick-check is-' + check.kind + (done ? (right ? ' is-right' : ' is-wrong') : '')} aria-labelledby={'qc-' + id}>
    <p className="qc-kicker"><b>{CHECK_COPY.kicker}</b> · {CHECK_COPY.kinds[check.kind]} · {CHECK_COPY.lead}</p>
    <h3 id={'qc-' + id} className="qc-prompt">{check.prompt}</h3>
    <div className="qc-options" role="group" aria-labelledby={'qc-' + id}>
      {check.options.map((o, i) => <button key={o} data-check={id} disabled={done}
        className={'qc-option' + (done && i === check.answer ? ' is-answer' : '') + (done && i === picked && !right ? ' is-picked' : '')}
        onClick={() => setPicked(i)}>{o}</button>)}
    </div>
    {done ? <p className="qc-why" role="status"><b>{right ? CHECK_COPY.right : CHECK_COPY.notQuite}</b> {!right && <>{CHECK_COPY.answerWas} {check.options[check.answer]}. </>}{check.why}</p>
      : <button className="text-button qc-skip" onClick={() => setSkipped(true)}>{CHECK_COPY.skip}</button>}
  </section>;
}
