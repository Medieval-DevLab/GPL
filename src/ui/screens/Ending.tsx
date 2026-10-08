import { useState } from 'react';
import type { Content, GameState } from '../../engine/types';
import { causalClaim, causalThreads } from '../../engine/engine';
import { COPY } from '../../content/interface';
import { STORY, placeOf } from '../../content/presentation';
import { ACTION_PLAN_FIELDS, ACTION_PLAN_LIMIT, type ActionPlan, type Session } from '../../session';
import { debriefText, reflectionRecord } from '../../debrief';
import { Action, Backdrop, Heading, pad2 } from '../parts';
import { VIEWS } from '../../content/views';
import { settledOf, verdictOf } from '../ledger';
import { Figure, Measures } from './FrameParts';
import { DealChart } from './DealChart';
import { PromiseCalendar } from './Views';

const E = COPY.frames.ending;

export function downloadSummary(session: Session, content: Content) {
  const url = URL.createObjectURL(new Blob([debriefText(session, content)], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'gpl-engagement-debrief.txt'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * The one causal-claim item, asked BEFORE the threads that answer it (engine.ts `causalClaim`).
 * One pick, then the answer — never "try again", which turned the only open question in the
 * ending into a guessing game. Not scored, and it does not need to say so.
 */
function Attribution({ state, content, answer, onAnswer }: { state: GameState; content: Content; answer: string | null; onAnswer(id: string): void }) {
  const claim = causalClaim(state, content);
  if (!claim) return null;
  const correct = claim.candidates.find(c => c.id === claim.answerId)?.text;
  return <section className="f-end-section attribution">
    <p className="f-kicker">{E.attributionKicker}</p>
    <h2 className="f-h2">{E.attributionTitle}</h2>
    <p className="f-end-lead">{claim.soLater}</p>
    <div className="f-claims">{claim.candidates.map(c => <button key={c.id} aria-pressed={answer === c.id} disabled={answer !== null && answer !== c.id} onClick={() => { if (answer === null) onAnswer(c.id); }}>{c.text}</button>)}</div>
    {answer && <p role="status" className="f-claim-status">{answer === claim.answerId ? E.attributionRight : E.attributionWrong + ' “' + correct + '”'}</p>}
  </section>;
}

function LearningRecord({ session, content, onPlan }: { session: Session; content: Content; onPlan(key: keyof ActionPlan, value: string): void }) {
  const reflections = reflectionRecord(session, content);
  return <>
    <section className="f-end-section reflection-record">
      <p className="f-kicker">{E.reflectionsKicker}</p>
      <h2 className="f-h2">{E.reflectionsTitle}</h2>
      {reflections.length ? <div className="f-reflections">{reflections.map(r => <article key={r.id}><small>{COPY.stage.act} {r.chapter} · {r.title}</small><h3>{r.prompt}</h3><p>{r.answer}</p></article>)}</div>
        : <p className="f-end-lead">{E.reflectionsEmpty}</p>}
    </section>
    <section className="f-end-section action-plan" aria-labelledby="action-plan-heading">
      <p className="f-kicker">{E.planKicker}</p>
      <h2 id="action-plan-heading" className="f-h2">{E.planTitle}</h2>
      <p className="f-end-lead">{E.planLead}</p>
      <p id="plan-privacy" className="f-plan-privacy">{E.planPrivacy}</p>
      <div className="f-plan-fields">{ACTION_PLAN_FIELDS.map(({ key, label, prompt }, i) => <div className="f-plan-field" key={key}>
        <span className="f-plan-n" aria-hidden="true">{pad2(i + 1)}</span>
        <label htmlFor={'plan-' + key}>{label}</label>
        <p id={'plan-' + key + '-hint'}>{prompt}</p>
        <textarea id={'plan-' + key} aria-describedby={'plan-' + key + '-hint plan-privacy'} rows={3} maxLength={ACTION_PLAN_LIMIT} value={session.presentation.actionPlan[key]} onChange={e => onPlan(key, e.target.value)} />
        <small>{session.presentation.actionPlan[key].length}/{ACTION_PLAN_LIMIT} {E.characters}</small>
      </div>)}</div>
      <p className="f-plan-privacy">{E.planNoGrade}</p>
    </section>
  </>;
}

/**
 * The ending. It opens on a cover — the verdict, with the team and the client standing in the
 * store where it began — and answers the question the player set out with: the verdict, and
 * where the deal ended on each of the three questions. Then it reads as the report of one
 * engagement: the chains the player's own choices created, every decision by act, and the
 * reflection and plan that turn the run into something to do on Monday.
 */
export function Ending({ session, content, onPlan, onCode, onHome, onAgain }: { session: Session; content: Content; onPlan(key: keyof ActionPlan, value: string): void; onCode(): void; onHome(): void; onAgain(): void }) {
  const state = session.game;
  const [answer, setAnswer] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const asked = causalClaim(state, content) !== null;
  const speaker = (missionId: string) => { const n = content.nodes[missionId]; return n && 'advisor' in n ? n.advisor?.name : undefined; };
  const verdict = verdictOf(state); const threads = causalThreads(state, content);
  const start = state.history[0]?.dimsBefore;
  return <section className="page f-ending">
    <div className="fs f-cover">
      <Backdrop photo={placeOf('end').photo} />
      <div className="f-cast f-cover-cast">
        {/* Your team, as they finish: two standing behind, two seated in front who hide where the standing photographs end. */}
        <Figure id="arjun" depth="back" enter="rise" delay={300} box={{ left: '56%', width: '13%', top: 0, height: '65.3%' }} frame={{ x: '50%', y: 0.3, face: 0.21 }} />
        <Figure id="priya" depth="back" enter="rise" delay={420} box={{ left: '73%', width: '14%', top: 0, height: '76.6%' }} frame={{ x: '50%', y: 0.171, face: 0.188 }} />
        <Figure id="riya" enter="rise" delay={560} box={{ left: '52%', width: '18%', top: 0, bottom: 0 }} frame={{ x: '50%', y: 0.674, face: 0.164 }} />
        <Figure id="aisha" enter="rise" delay={680} box={{ left: '70%', width: '24%', top: 0, bottom: 0 }} frame={{ x: '50%', y: 0.482, face: 0.157 }} />
      </div>
      <div className="f-verdict sheet ending-hero">
        <p className="f-kicker">{COPY.stage.endKicker}</p>
        <Heading className="f-verdict-h">{verdict.title}</Heading>
        <p className="f-verdict-summary">{[verdict.summary, ...verdict.extras].join(' ')}</p>
        <p className="f-verdict-count"><b>{state.completed.length}</b> {E.made}</p>
        <p className="f-verdict-question"><span>{COPY.stage.setOut}</span> {STORY.question}</p>
        <Measures to={state.dims} from={start} label={COPY.position} className="f-final" />
        <a className="text-link f-read-report" href="#report">{E.readReport}</a>
      </div>
    </div>

    <div className="f-report" id="report" tabIndex={-1}>
      <p className="f-report-title">{E.reportTitle}</p>
      {/* The whole deal on one chart, under the ending it produced (D-091). */}
      <section className="f-end-section f-chart" aria-labelledby="chart-heading">
        <p className="f-kicker">{VIEWS.chart.kicker}</p>
        <h2 id="chart-heading" className="f-h2">{verdict.title}</h2>
        <p className="f-end-lead">{[verdict.summary, ...verdict.extras].join(' ')}</p>
        <p className="meta">{VIEWS.chart.lead}</p>
        <DealChart state={state} content={content} />
      </section>
      {settledOf(state) && <section className="f-end-section" aria-labelledby="calendar-heading">
        <p className="f-kicker">{VIEWS.calendar.title}</p>
        <h2 id="calendar-heading" className="f-h2">{VIEWS.calendar.playTitle}</h2>
        <PromiseCalendar state={state} content={content} />
      </section>}
      <Attribution state={state} content={content} answer={answer} onAnswer={setAnswer} />
      {asked && !answer && !skipped && <p className="f-reveal"><button className="secondary" onClick={() => setSkipped(true)}>{COPY.stage.revealThreads}</button></p>}
      {(!asked || answer || skipped) && <section className="f-end-section">
        <p className="f-kicker">{E.threadsKicker}</p>
        <h2 className="f-h2">{E.threadsTitle}</h2>
        {threads.length ? <div className="f-threads">{threads.map((t, i) => <div className="f-thread" key={i} style={{ ['--i' as string]: i }}>
          <p><small>{E.because}</small>{t.because}</p>
          <span aria-hidden="true" className="f-thread-link" />
          <p><small>{E.soLater}</small>{t.soLater}</p>
        </div>)}</div>
          : <p className="f-end-lead">{E.threadsEmpty}</p>}
      </section>}
      <section className="f-end-section">
        <p className="f-kicker">{E.recordKicker}</p>
        <h2 className="f-h2">{COPY.stage.record}</h2>
        <div className="f-timeline">{content.chapters.map(c => {
          const entries = state.history.filter(h => h.chapter === c.number);
          if (!entries.length) return null;
          return <div key={c.number} className="f-timeline-act" data-chapter={c.number}>
            <p className="f-timeline-label"><b>{COPY.stage.act} {c.number}</b> {c.title}</p>
            <ol>{entries.map(h => <li key={h.missionId}><details><summary><span className="n">{content.missionOrder.indexOf(h.missionId) + 1}</span><span><small>{h.missionTitle} · {h.chosenLabel}</small><strong>{h.headline}</strong></span><span aria-hidden="true" className="plus">+</span></summary><div><h3>“{h.lesson.principle}”{speaker(h.missionId) && <cite> — {speaker(h.missionId)}</cite>}</h3><p>{h.lesson.because}</p>{h.lesson.watchFor && <p>{h.lesson.watchFor}</p>}</div></details></li>)}</ol>
          </div>;
        })}</div>
      </section>
      <LearningRecord session={session} content={content} onPlan={onPlan} />
      <section className="f-end-section f-takeaway">
        <h2 className="f-h2">{E.takeawayTitle}</h2>
        <p className="f-end-lead">{E.takeawayLead}</p>
        <div className="dialog-actions"><button className="secondary" onClick={onCode}>{COPY.code}</button><button className="secondary" onClick={() => downloadSummary(session, content)}>{E.download}</button></div>
      </section>
    </div>
    <footer className="f-endbar"><button className="secondary" onClick={onHome}>{E.home}</button><Action onClick={onAgain}>{E.again}</Action></footer>
  </section>;
}
