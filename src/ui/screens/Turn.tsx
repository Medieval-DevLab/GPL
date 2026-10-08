import type { Interlude } from '../../engine/types';
import type { ChapterNumber } from '../../content/assets';
import { COPY } from '../../content/interface';
import { CHAPTER_PRESENTATION, TURN_DRESSING, placeOf } from '../../content/presentation';
import { CHARACTERS } from '../../content/characters';
import { Backdrop, Heading, art } from '../parts';
import { DialogueBox } from './Dialogue';
import { Figure, useAdvanceKeys } from './FrameParts';

/**
 * A story turn: news from somewhere else, arriving as the thing it would arrive as — the trade
 * paper sliding across the desk, a notification dropping onto a phone, a memo put down in
 * front of you. The narration is the content and is never paraphrased; the artefact invents
 * nothing the story does not say. Then the act's guide, who saw it too, says the one line
 * that matters, and that line's action moves the story on.
 */
export function Turn({ node, onNext }: { node: Interlude; onNext(): void }) {
  const dress = TURN_DRESSING[node.id] ?? { format: 'memo', organisation: 'Orion Retail', label: '', subject: node.title, from: '' } as const;
  const place = placeOf(node.id);
  const guide = CHARACTERS[CHAPTER_PRESENTATION[(node.chapter as ChapterNumber) - 1].advisor];
  const T = COPY.frames.turn;
  useAdvanceKeys();
  const line = { who: guide.name, role: guide.role, text: node.prompt ?? node.title, voice: 'say' as const };

  const narration = <>
    <p className="f-kicker">{node.eyebrow}</p>
    <Heading className="f-h1">{node.title}</Heading>
    <div className="f-turn-body">{node.body.map((p, i) => <p key={i} style={{ ['--i' as string]: i }}>{p}</p>)}</div>
  </>;

  return <section className={'page fs f-turn is-' + dress.format}>
    <Backdrop photo={place.photo} focus="soft" />
    <Figure id={guide.id} className="f-turn-guide" enter="right" delay={dress.format === 'press' ? 900 : 1100} box={{ right: 0, width: 'var(--guide-w)', top: 0, bottom: 0 }} frame={{ x: '50%', y: 0.1, face: 0.19 }} />

    {dress.format === 'press' ? <>
      <div className="f-paper-stack">
      <div className="f-paper-under" aria-hidden="true" /><div className="f-paper-under is-second" aria-hidden="true" />
      <article className="f-paper" aria-label={dress.masthead}>
        <header className="f-masthead">
          <span>{node.eyebrow}</span>
          <strong>{dress.masthead}</strong>
          <span>{dress.section}</span>
        </header>
        <p className="f-paper-kicker">{dress.kicker}</p>
        <Heading className="f-paper-head">{node.title}</Heading>
        <div className="f-paper-body">
          <img src={art(place.photo)} alt="" decoding="async" />
          <div className="f-paper-cols">{node.body.map((p, i) => <p key={i}>{p}</p>)}</div>
        </div>
      </article>
      </div>
    </> : <>
      <div className="f-turn-text sheet">{narration}</div>
      {dress.format === 'mail'
        ? <div className="f-phone" aria-label={dress.app}>
            <div className="f-phone-screen">
              <p className="f-phone-time" aria-hidden="true">{dress.time}</p>
              <p className="f-phone-day" aria-hidden="true">{node.eyebrow.split(',')[0]}</p>
              <div className="f-notice" role="group" aria-label={dress.app}>
                <p className="f-notice-app"><span>{dress.app}</span><span>{T.now}</span></p>
                <p className="f-notice-from">{dress.from}</p>
                <p className="f-notice-subject">{dress.subject}</p>
                <p className="f-notice-preview">{dress.preview}</p>
              </div>
              <span className="f-phone-bar" aria-hidden="true" />
            </div>
          </div>
        : <article className="f-memo" aria-label={dress.label}>
            <p className="f-memo-org">{dress.organisation}<span>{dress.label}</span></p>
            <p className="f-memo-subject">{dress.subject}</p>
            <dl className="f-memo-meta"><dt>{T.from}</dt><dd>{dress.from}</dd></dl>
            <div className="f-memo-lines" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
          </article>}
    </>}

    <DialogueBox className="f-say f-turn-say" line={line} index={0} count={1} last lastLabel={COPY.next} onNext={onNext} />
  </section>;
}
