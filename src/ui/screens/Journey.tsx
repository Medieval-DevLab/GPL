import type { Content, GameNode, GameState } from '../../engine/types';
import { COPY } from '../../content/interface';
import { ACT_QUESTION, CHAPTER_PRESENTATION, STORY } from '../../content/presentation';
import { Action, Heading, art } from '../parts';
import { Board } from './Board';

/** The whole engagement on one page — opened on request, never forced between acts. */
export function Journey({ state, content, node, currentChapter, onPlay, onReview }: {
  state: GameState; content: Content; node: GameNode; currentChapter: number; onPlay(): void; onReview(chapter: number): void;
}) {
  const ended = state.phase === 'ending';
  return <section className="page scr-journey">
    <div className="act-break">
      <div>
        <div className="journey-head">
          <div><p className="kicker">{COPY.stage.episodes}</p><Heading className="h1">{COPY.stage.journeyTitle}</Heading><p className="lead">{STORY.question}</p></div>
          <p className="journey-count"><b>{state.completed.length}</b>{COPY.stage.of} {content.missionOrder.length} decisions</p>
        </div>
        <ol className="acts">
          {content.chapters.map((c, i) => {
            const done = c.missionIds.filter(id => state.completed.includes(id));
            const complete = done.length === c.missionIds.length;
            const current = c.number === currentChapter && !ended;
            const status = complete ? COPY.stage.done : current ? COPY.stage.here : ended ? (done.length ? COPY.stage.endedHere : COPY.stage.notReached) : COPY.stage.ahead;
            return <li key={c.number} data-chapter={c.number} className={'act-row' + (current ? ' is-current' : '') + (!current && !complete ? ' is-ahead' : '')}>
              <img src={art(CHAPTER_PRESENTATION[i].scene)} alt="" />
              <div>
                <p className="status">{COPY.stage.act} {c.number} · {status}</p>
                <h2>{c.title}</h2>
                <p className="q">{ACT_QUESTION[c.number as 1]}</p>
                <div className="ticks" role="img" aria-label={done.length + ' of ' + c.missionIds.length + ' decisions'}>{c.missionIds.map(id => <i key={id} className={state.completed.includes(id) ? 'on' : ''} />)}</div>
              </div>
              <div>{(complete || (ended && done.length > 0)) && <button className="ghost" onClick={() => onReview(c.number)}>{COPY.stage.review}</button>}</div>
            </li>;
          })}
        </ol>
      </div>
      <Board state={state} content={content} values />
    </div>
    <footer className="cmd-bar"><p /><Action onClick={onPlay}>{ended ? 'Return to your debrief' : node.kind === 'interlude' && node.role === 'chapter-open' ? COPY.enter : COPY.back}</Action></footer>
  </section>;
}
