import { COPY } from '../../content/interface';
import type { Line } from '../script';
import { Portrait } from '../parts';

/** A quotation inside spoken words takes single marks, British style, so a line never ends in ”” . */
const nest = (text: string) => text.replace(/“/g, '‘').replace(/”/g, '’');

/**
 * One line, spoken by one person, on a solid surface you can read. The name plate says who;
 * the person is standing in the scene above it. Advancing is the primary action, so keyboard,
 * pointer and the release harness all move through a scene the same way.
 */
export function DialogueBox({ line, index, count, last, lastLabel, onNext, onSkip, skipLabel, className = '' }: {
  line: Line; index: number; count: number; last: boolean; lastLabel: string; onNext(): void; onSkip?(): void; skipLabel?: string; className?: string;
}) {
  return <div className={'dialogue voice-' + line.voice + ' ' + className}>
    {line.who && <p className="nameplate"><strong>{line.who}</strong><span>{line.role}</span></p>}
    <p className="dialogue-text" aria-live="polite" key={index + line.text.slice(0, 12)}>{line.voice === 'narrate' ? line.text : '“' + nest(line.text) + '”'}</p>
    <div className="dialogue-foot">
      {line.note ? <span className="dialogue-note">{line.note}</span> : <span className="dialogue-count" aria-hidden="true">{index + 1} / {count}</span>}
      <span className="dialogue-actions">
        {onSkip && !last && <button className="text-button" data-line-skip onClick={onSkip}>{skipLabel ?? COPY.say.skip}</button>}
        <button className="primary" data-action="primary" data-line-next={last ? undefined : ''} onClick={event => { if (event.detail < 2) onNext(); }}
          onKeyDown={event => { if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault(); }}>
          <span>{last ? lastLabel : COPY.say.next}</span><span className="arrow" aria-hidden="true">→</span>
        </button>
      </span>
    </div>
  </div>;
}

/** A message thread: every line so far, as it arrived. Used when the decision happens in messages. */
export function Thread({ lines, upTo, title, subtitle }: { lines: readonly Line[]; upTo: number; title: string; subtitle?: string }) {
  return <div className="phone" aria-label={title}>
    <div className="phone-head"><Portrait name={title} className="sm" /><div><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</div></div>
    <ol className="thread" aria-live="polite">
      {lines.slice(0, upTo + 1).map((l, i) => <li key={i} className={'bubble' + (l.who === title ? ' from-them' : ' from-colleague')}>
        {l.who !== title && l.who && <span className="bubble-who">{l.who}</span>}
        <span>{l.text}</span>
      </li>)}
    </ol>
  </div>;
}
