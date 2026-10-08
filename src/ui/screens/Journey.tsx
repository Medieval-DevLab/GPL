import type { Content, GameNode, GameState } from '../../engine/types';
import type { ChapterNumber } from '../../content/assets';
import { COPY } from '../../content/interface';
import { ACT_QUESTION, CHAPTER_PRESENTATION, STORY, placeOf } from '../../content/presentation';
import { CHARACTERS } from '../../content/characters';
import { Action, Backdrop, Heading, Portrait, art } from '../parts';

/**
 * The whole engagement as a route through five acts, each in its own colour — opened on
 * request from the progress track, never forced between acts (D-080). Where you are is lit;
 * the acts behind you can be reopened; the acts ahead wait in grey with their questions.
 */
export function Journey({ state, content, node, currentChapter, onPlay, onReview }: {
  state: GameState; content: Content; node: GameNode; currentChapter: number; onPlay(): void; onReview(chapter: number): void;
}) {
  const ended = state.phase === 'ending';
  const J = COPY.frames.journey;
  const reached = content.chapters.filter(c => c.missionIds.some(id => state.completed.includes(id)) || (c.number === currentChapter && !ended)).length;
  return <section className="page fs f-journey" style={{ ['--reached' as string]: reached }}>
    <Backdrop photo={placeOf(node.id).photo} focus="deep" />
    <header className="f-journey-head sheet">
      <div>
        <p className="f-kicker">{COPY.stage.episodes}</p>
        <Heading className="f-h1">{COPY.stage.journeyTitle}</Heading>
        <p className="f-journey-q">{STORY.question}</p>
      </div>
      <p className="f-journey-count"><b>{state.completed.length}</b><span>{COPY.stage.of} {content.missionOrder.length} {J.decisions}</span></p>
    </header>

    <ol className="f-route">
      {content.chapters.map((c, i) => {
        const done = c.missionIds.filter(id => state.completed.includes(id));
        const complete = done.length === c.missionIds.length;
        const current = c.number === currentChapter && !ended;
        const status = complete ? COPY.stage.done : current ? COPY.stage.here : ended ? (done.length ? COPY.stage.endedHere : COPY.stage.notReached) : COPY.stage.ahead;
        const guide = CHARACTERS[CHAPTER_PRESENTATION[i].advisor];
        return <li key={c.number} data-chapter={c.number} style={{ ['--i' as string]: i }}
          className={'f-stop' + (current ? ' is-current' : '') + (complete ? ' is-done' : '') + (!current && !complete ? ' is-ahead' : '')}>
          <span className="f-stop-dot" aria-hidden="true">{complete ? '✓' : c.number}</span>
          <div className="f-stop-card">
            <img src={art(CHAPTER_PRESENTATION[i].scene)} alt="" decoding="async" />
            <div className="f-stop-body">
              <p className="f-stop-status">{COPY.stage.act} {c.number} · {status}</p>
              <h2>{c.title}</h2>
              <p className="f-stop-q">{ACT_QUESTION[c.number as ChapterNumber]}</p>
              <p className="f-stop-guide"><Portrait name={guide.name} className="sm" /><span>{J.with} {guide.name}</span></p>
              <div className="f-stop-ticks" role="img" aria-label={done.length + ' ' + COPY.stage.of + ' ' + c.missionIds.length + ' ' + J.decisions}>{c.missionIds.map(id => <i key={id} className={state.completed.includes(id) ? 'on' : ''} />)}</div>
              {(complete || (ended && done.length > 0)) && <button className="secondary" onClick={() => onReview(c.number)}>{COPY.stage.review}</button>}
            </div>
          </div>
        </li>;
      })}
    </ol>

    <footer className="f-bar sheet"><p>{STORY.stakes}</p><Action onClick={onPlay}>{ended ? J.backToDebrief : node.kind === 'interlude' && node.role === 'chapter-open' ? COPY.enter : COPY.back}</Action></footer>
  </section>;
}
