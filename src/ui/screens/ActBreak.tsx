import type { Chapter, Content, GameState, Interlude } from '../../engine/types';
import type { ChapterNumber } from '../../content/assets';
import { COPY } from '../../content/interface';
import { ACT_QUESTION, CHAPTER_PRESENTATION, MISSION_RULE, STORY, placeOf, ruleOf } from '../../content/presentation';
import { CHARACTERS } from '../../content/characters';
import { Action, Backdrop, Heading, castId, pad2 } from '../parts';
import { Figure, Measures, RuleMark } from './FrameParts';

/**
 * The act break: one screen where three used to be (debrief → map → next opener, D-080).
 *
 * The act's decisions are filed as a chain of cards, one leading into the next, and the act
 * is stamped closed. Beside it, how the act moved the deal. Below, the act's guide sits down
 * with you and asks the act's reflection question (or, in an act without one, says what the
 * act was for); and the next act waits, in its own colour, with its question.
 */
export function ActBreak({ node, state, content, reflections, onReflect, onNext }: {
  node: Interlude; state: GameState; content: Content; chapter: Chapter;
  reflections: Record<string, string>; onReflect(nodeId: string, answer: string): void; onNext(): void;
}) {
  const F = COPY.frames.actBreak;
  const n = node.chapter as ChapterNumber;
  const decisions = state.history.filter(h => h.chapter === node.chapter);
  const first = decisions[0], lastDecision = decisions.at(-1);
  const prompts = Object.values(content.nodes).filter((x): x is Interlude => x.kind === 'interlude' && x.role === 'reflection' && x.chapter === node.chapter);
  const next = content.chapters.find(c => c.number === node.chapter + 1);
  const nextOpen = Object.values(content.nodes).find((x): x is Interlude => x.kind === 'interlude' && x.role === 'chapter-open' && x.chapter === node.chapter + 1);
  const guide = prompts[0]?.advisor ?? CHARACTERS[CHAPTER_PRESENTATION[n - 1].advisor];
  /* An act with a reflection is asked it; an act without one is summed up, by the same person. */
  const summed = prompts.length === 0;
  /* Guess, then see (D-086): what decided the act is held back until every guess is in, then
     the guide says it, and the act's idea, in their own voice. */
  const guessed = prompts.every(r => !!reflections[r.id]);
  return <section className="page fs f-break" style={{ ['--n' as string]: decisions.length }}>
    <Backdrop photo={placeOf(node.id).photo} focus="soft" />
    <Figure id={castId(guide.name)} className="f-break-guide" enter="left" delay={900} box={{ left: 0, width: 'var(--guide-w)', top: '46%', bottom: 0 }} frame={{ x: '52%', y: 0.12, face: 0.3 }} />

    <header className="f-break-head sheet">
      <p className="f-kicker">{COPY.stage.act} {n} {COPY.stage.of} 5 · {F.closed}</p>
      <Heading className="f-h1">{node.title}</Heading>
      {!summed && node.body.map((line, i) => <p key={i} className="f-read">{line}</p>)}
      <span className="f-stamp" aria-hidden="true"><small>{COPY.stage.act} {n}</small>{F.stamp}</span>
    </header>

    {first && lastDecision && <section className="f-break-moved sheet" aria-labelledby="moved-heading">
      <h2 id="moved-heading">{F.moved}</h2>
      <Measures from={first.dimsBefore} to={lastDecision.dimsAfter} label={F.moved} />
    </section>}

    <ol className="f-chain" aria-label={COPY.stage.actDecided}>
      {decisions.map((h, i) => {
        const rule = MISSION_RULE[h.missionId] ?? 'win';
        return <li key={h.missionId} className="f-filed" style={{ ['--i' as string]: i }}>
          <p className="f-filed-top"><span>{F.decision} {pad2(content.missionOrder.indexOf(h.missionId) + 1)}</span><RuleMark id={rule} /><span className="sr-only">{COPY.say.filed} {ruleOf(rule).question}</span></p>
          <p className="f-filed-q">{(content.nodes[h.missionId] as { question?: string }).question}</p>
          <p className="f-filed-h">{h.headline}</p>
          <p className="f-filed-c">{COPY.stage.youChose}: <b>{h.chosenLabel}</b></p>
        </li>;
      })}
    </ol>

    <div className="f-talk sheet">
      <p className="nameplate"><strong>{guide.name}</strong><span>{guide.role}</span></p>
      {summed && node.body.map((line, i) => <p key={i} className="f-talk-line">“{line}”</p>)}
      {prompts.map(r => <section className="f-reflect" key={r.id} aria-labelledby={'q-' + r.id}>
        <h2 id={'q-' + r.id}>“{r.prompt}”</h2>
        <div className="f-answers" role="group" aria-labelledby={'q-' + r.id}>
          {r.responses?.map(a => {
            const on = reflections[r.id] === a;
            return <button key={a} data-reflect={r.id} aria-pressed={on} onClick={() => onReflect(r.id, a)}>
              <span className="tick" aria-hidden="true">{on ? '✓' : ''}</span><span>{a}</span>
            </button>;
          })}
        </div>
        <p className="f-note">{node.reveal ? F.guessNote : COPY.reflectionNote}</p>
      </section>)}
      {/* The live region is there before the guess, so the reveal is announced when it lands. */}
      {node.reveal && <div className="f-reveal-lines" aria-live="polite">
        {guessed && node.reveal.map((line, i) => <p key={i} className="f-talk-line">“{line}”</p>)}
        {guessed && <p className="f-spine"><span className="sr-only">{F.spine}: </span>{STORY.spine}</p>}
      </div>}
    </div>

    <aside className="f-next sheet" data-chapter={next?.number} aria-labelledby="next-heading">
      {next ? <>
        <div className="f-next-band">
          <p>{F.next} · {COPY.stage.act} {next.number} {COPY.stage.of} 5</p>
          <h2 id="next-heading">{nextOpen?.title ?? next.title}</h2>
        </div>
        <p className="f-next-q">{ACT_QUESTION[next.number as ChapterNumber]}</p>
        <Action onClick={onNext}>{COPY.stage.beginAct + ' ' + next.number}</Action>
      </> : <>
        <div className="f-next-band"><h2 id="next-heading">{COPY.stage.complete}</h2></div>
        <Action onClick={onNext}>{COPY.stage.reviewAll}</Action>
      </>}
    </aside>
  </section>;
}
