import type { Content, GameNode, GameState } from '../../engine/types';
import { COPY } from '../../content/interface';
import { CHAPTER_LIGHT, CHAPTER_PRESENTATION } from '../../content/presentation';
import { Action, Glyph, Heading, World, art, pad2 } from '../parts';

/**
 * The engagement as a season of five acts. Each act is graded in its own light, so the
 * whole colour script — daybreak to the delivery floor — is visible at once, and the
 * player can see the day move as they progress. Completed acts carry what happened in them.
 */
export function Journey({ state, content, node, currentChapter, onPlay, onReview }: {
  state: GameState; content: Content; node: GameNode; currentChapter: number; onPlay(): void; onReview(chapter: number): void;
}) {
  const ended = state.phase === 'ending';
  return <section className="stage scr-journey">
    <World backdrop="env-skyline-dusk" mood="dim" />
    <header className="journey-head">
      <div>
        <p className="kicker enter-rise">{COPY.stage.episodes}</p>
        <Heading className="display enter-slam">Every step changes the next.</Heading>
      </div>
      <p className="journey-count enter-rise"><b className="display">{state.completed.length}</b><span>of {content.missionOrder.length}<br />decisions made</span></p>
    </header>
    <ol className="season">
      {content.chapters.map((c, i) => {
        const done = c.missionIds.filter(id => state.completed.includes(id));
        const complete = done.length === c.missionIds.length;
        const current = c.number === currentChapter && !ended;
        const status = complete ? COPY.stage.done : current ? COPY.stage.here : ended ? (done.length ? COPY.stage.endedHere : COPY.stage.notReached) : COPY.stage.ahead;
        const headlines = state.history.filter(h => h.chapter === c.number);
        return <li key={c.number} data-chapter={c.number} className={'episode enter-deal' + (current ? ' is-current' : '') + (complete ? ' is-done' : '') + (!current && !complete ? ' is-ahead' : '')} style={{ ['--i' as string]: i }}>
          <div className="episode-photo" aria-hidden="true"><img src={art(CHAPTER_PRESENTATION[i].scene)} alt="" /></div>
          <span className="episode-num display" aria-hidden="true">{pad2(c.number)}</span>
          <div className="episode-body">
            <p className="mono episode-light">{CHAPTER_LIGHT[c.number as 1]} · {status}</p>
            <h2 className="display">{c.title}</h2>
            <div className="episode-ticks" role="img" aria-label={done.length + ' of ' + c.missionIds.length + ' decisions'}>{c.missionIds.map(id => <i key={id} className={state.completed.includes(id) ? 'on' : ''} />)}</div>
            {current && <p className="episode-goal">{CHAPTER_PRESENTATION[i].goal}</p>}
            {complete && <ul className="episode-headlines">{headlines.map(h => <li key={h.missionId}>{h.headline}</li>)}</ul>}
            {current && <Action onClick={onPlay}>{node.kind === 'interlude' && node.role === 'chapter-open' ? COPY.enter : COPY.back}</Action>}
            {(complete || (ended && done.length > 0)) && <button className="ghost" onClick={() => onReview(c.number)}><Glyph name="file" />{COPY.stage.review}</button>}
          </div>
        </li>;
      })}
    </ol>
    <footer className="cmd-bar journey-foot">
      <p>Information you uncover, people you involve and promises you make return in later chapters. There is no timer.</p>
      {ended && <button className="ghost" onClick={onPlay}>Return to your debrief</button>}
    </footer>
  </section>;
}
