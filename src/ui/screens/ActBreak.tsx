import type { Chapter, Content, GameState, Interlude } from '../../engine/types';
import { COPY } from '../../content/interface';
import { ACT_QUESTION, CHAPTER_PRESENTATION, MISSION_RULE, ruleOf } from '../../content/presentation';
import { Action, Heading, Paras } from '../parts';
import { Board } from './Board';

/**
 * The act break: one screen where three used to be (debrief → map → next chapter's opener).
 *
 * An act ends with what it decided, in one line per decision, each filed under one of the
 * three questions; the act's reflection question (it used to interrupt the act midway); and
 * the next act's question. The board stands beside it with the deal's position, because this
 * is where a learner should look up and see how the act moved it (D-080).
 */
export function ActBreak({ node, state, content, chapter, reflections, onReflect, onNext }: {
  node: Interlude; state: GameState; content: Content; chapter: Chapter;
  reflections: Record<string, string>; onReflect(nodeId: string, answer: string): void; onNext(): void;
}) {
  const decisions = state.history.filter(h => h.chapter === node.chapter);
  const prompts = Object.values(content.nodes).filter((n): n is Interlude => n.kind === 'interlude' && n.role === 'reflection' && n.chapter === node.chapter);
  const next = content.chapters.find(c => c.number === node.chapter + 1);
  const nextOpen = Object.values(content.nodes).find((n): n is Interlude => n.kind === 'interlude' && n.role === 'chapter-open' && n.chapter === node.chapter + 1);
  return <section className="page scr-act-break">
    <div className="act-break">
      <div>
        <p className="kicker">{COPY.stage.act} {chapter.number} {COPY.stage.of} 5 · {COPY.stage.closed}</p>
        <Heading className="h1">{node.title}</Heading>
        <Paras lines={node.body} className="read" />
        <ol className="act-decisions" aria-label={COPY.stage.actDecided}>
          {decisions.map(h => <li key={h.missionId} className="enter">
            <span className="n">{content.missionOrder.indexOf(h.missionId) + 1}</span>
            <span className="q">{(content.nodes[h.missionId] as { question?: string }).question} · {ruleOf(MISSION_RULE[h.missionId] ?? 'win').question}</span>
            <span className="h">{h.headline}</span>
            <span className="c">{COPY.stage.youChose}: <b>{h.chosenLabel}</b></span>
          </li>)}
        </ol>
        {prompts.map(r => <section className="reflect" key={r.id} aria-labelledby={'q-' + r.id}>
          <h2>{COPY.stage.reflect}{r.advisor ? ' · ' + r.advisor.name : ''}</h2>
          <h3 id={'q-' + r.id}>{r.prompt}</h3>
          <div className="answers" role="group" aria-labelledby={'q-' + r.id}>
            {r.responses?.map(a => <button key={a} data-reflect={r.id} aria-pressed={reflections[r.id] === a} onClick={() => onReflect(r.id, a)}><span className="tick" aria-hidden="true">{reflections[r.id] === a ? '✓' : ''}</span><span>{a}</span></button>)}
          </div>
          <p className="note-text">{COPY.reflectionNote}</p>
        </section>)}
        {next && <section className="next-act">
          <small>{COPY.stage.next} · {COPY.stage.act} {next.number} {COPY.stage.of} 5</small>
          <h2>{nextOpen?.title ?? next.title}</h2>
          <p>{ACT_QUESTION[next.number as 1]}</p>
        </section>}
      </div>
      <Board state={state} content={content} values />
    </div>
    <footer className="cmd-bar">
      <p>{next ? CHAPTER_PRESENTATION[next.number - 1].goal : COPY.stage.complete}</p>
      <Action onClick={onNext}>{next ? COPY.stage.beginAct + ' ' + next.number : COPY.stage.reviewAll}</Action>
    </footer>
  </section>;
}
