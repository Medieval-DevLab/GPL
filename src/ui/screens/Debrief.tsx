import type { Chapter, Content, GameState, Interlude } from '../../engine/types';
import { COPY } from '../../content/interface';
import { BACKDROP } from '../../content/presentation';
import { Action, DIMENSION_ORDER, Glyph, Heading, Paras, World, pad2 } from '../parts';

/** Lessons are first-person; they always carry the name of the colleague who said them (G9b). */
function speakerOf(content: Content, missionId: string) { const n = content.nodes[missionId]; return n && 'advisor' in n ? n.advisor?.name : undefined; }

/**
 * Case closed. The chapter's decisions laid out as a chain of filed cards, each one leading
 * into the next — the shape the game wants the player to carry: one decision constrained
 * the next. The milestone is stamped, and the deal's position shows where the act moved it.
 */
export function Debrief({ node, state, content, chapter, onNext }: { node: Interlude; state: GameState; content: Content; chapter: Chapter; onNext(): void }) {
  const entries = state.history.filter(h => h.chapter === node.chapter);
  const first = entries[0], last = entries.at(-1);
  return <section className="stage scr-debrief">
    <World backdrop={BACKDROP[node.id] ?? 'env-skyline-dusk'} mood="dim" />
    <header className="debrief-head">
      <div>
        <p className="kicker enter-rise">{node.eyebrow}</p>
        <Heading className="display enter-slam">{node.title}</Heading>
        <Paras lines={node.body} className="debrief-body prose enter-rise" />
      </div>
      <div className="milestone enter-stamp" style={{ ['--d' as string]: '320ms' }}>
        <span className="stamp">{COPY.stage.closed}</span>
        <p className="mono">{COPY.stage.milestone}</p>
        <p className="display">{node.milestone ?? chapter.title}</p>
      </div>
    </header>
    <ol className="chain">
      {entries.map((h, i) => <li key={h.missionId} className={'chain-card paper enter-deal tone-' + h.tone} style={{ ['--i' as string]: i, ['--r' as string]: (i % 2 ? 1 : -1) * 1.2 + 'deg' }}>
        <p className="mono">{pad2(content.missionOrder.indexOf(h.missionId) + 1)} · {h.missionTitle}</p>
        <p className="chain-chose"><span className="mono">{COPY.stage.youChose}</span>{h.chosenLabel}</p>
        <p className="chain-headline serif">{h.headline}</p>
        <p className="chain-lesson">“{h.lesson.principle}”{speakerOf(content, h.missionId) && <cite> — {speakerOf(content, h.missionId)}</cite>}</p>
      </li>)}
    </ol>
    {first && last && <div className="chapter-move glass enter-rise" role="group" aria-label={COPY.stage.chapterMoved}>
      <p className="mono">{COPY.stage.chapterMoved}</p>
      {DIMENSION_ORDER.map(d => { const delta = last.dimsAfter[d] - first.dimsBefore[d]; return <p key={d} className="move"><Glyph name={d} /><span>{COPY.dimensions[d].label}</span><b>{first.dimsBefore[d]} → {last.dimsAfter[d]}</b><em className={delta > 0 ? 'up' : delta < 0 ? 'down' : ''}>{delta > 0 ? '▲ +' + delta : delta < 0 ? '▼ −' + -delta : '—'}</em></p>; })}
    </div>}
    <footer className="cmd-bar"><p>{node.chapter < 5 ? 'Next · ' + content.chapters[node.chapter].title : 'Your complete engagement is ready to review.'}</p><Action onClick={onNext}>{node.chapter < 5 ? 'Return to the journey' : 'Review your engagement'}</Action></footer>
  </section>;
}
