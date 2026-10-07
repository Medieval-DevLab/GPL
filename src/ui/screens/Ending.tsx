import { useState } from 'react';
import type { Content, GameState } from '../../engine/types';
import { causalClaim, causalThreads, finalVerdict } from '../../engine/engine';
import { COPY } from '../../content/interface';
import { RULES, STORY } from '../../content/presentation';
import { ACTION_PLAN_FIELDS, ACTION_PLAN_LIMIT, type ActionPlan, type Session } from '../../session';
import { debriefText, reflectionRecord } from '../../debrief';
import { Action, Glyph, Heading, pad2 } from '../parts';

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
  return <section className="end-section attribution">
    <p className="kicker">Optional · Connect the moments</p>
    <h2 className="h2">What set this in motion?</h2>
    <p className="lead">{claim.soLater}</p>
    <div className="claim-options">{claim.candidates.map(c => <button key={c.id} aria-pressed={answer === c.id} disabled={answer !== null && answer !== c.id} onClick={() => { if (answer === null) onAnswer(c.id); }}>{c.text}</button>)}</div>
    {answer && <p role="status" className="claim-status">{answer === claim.answerId ? 'That is what set it in motion.' : 'It was not that. This is what set it in motion: “' + correct + '”'}</p>}
  </section>;
}

function LearningRecord({ session, content, onPlan }: { session: Session; content: Content; onPlan(key: keyof ActionPlan, value: string): void }) {
  const reflections = reflectionRecord(session, content);
  return <>
    <section className="end-section reflection-record">
      <p className="kicker">Your reflections</p>
      <h2 className="h2">What you noticed along the way.</h2>
      {reflections.length ? <div className="reflection-grid">{reflections.map(r => <article key={r.id}><small>Chapter {r.chapter} · {r.title}</small><h3>{r.prompt}</h3><p>{r.answer}</p></article>)}</div>
        : <p>No reflection responses were saved in this browser for this engagement. You can still make a plan below.</p>}
    </section>
    <section className="end-section action-plan" aria-labelledby="action-plan-heading">
      <p className="kicker">Optional · Your next engagement</p>
      <h2 id="action-plan-heading" className="h2">Turn one insight into a habit.</h2>
      <p className="end-lead">Choose one thing to try in your next real conversation.</p>
      <p id="plan-privacy" className="plan-privacy">Notes stay in this browser when saving is available. They are not sent to your learning platform or included in run codes. Your debrief download includes them: avoid confidential details and client or colleague names.</p>
      <div className="plan-fields">{ACTION_PLAN_FIELDS.map(({ key, label, prompt }, i) => <div className="plan-field" key={key}>
        <span className="h2" aria-hidden="true">{pad2(i + 1)}</span>
        <label htmlFor={'plan-' + key}>{label}</label>
        <p id={'plan-' + key + '-hint'}>{prompt}</p>
        <textarea id={'plan-' + key} aria-describedby={'plan-' + key + '-hint plan-privacy'} rows={3} maxLength={ACTION_PLAN_LIMIT} value={session.presentation.actionPlan[key]} onChange={e => onPlan(key, e.target.value)} />
        <small>{session.presentation.actionPlan[key].length}/{ACTION_PLAN_LIMIT} characters</small>
      </div>)}</div>
      <p className="plan-privacy">No grade, required answer or submission. You can download your debrief and leave whenever you are ready.</p>
    </section>
  </>;
}

/**
 * The final report. It opens by answering the question the player set out with — the verdict,
 * and where the deal ended on each of the three questions — then reads as the record of one
 * engagement: the chains the player's own choices created, every decision by act, and the
 * reflection and plan that turn the run into something to do on Monday.
 */
export function Ending({ session, content, onPlan, onCode, onHome, onAgain }: { session: Session; content: Content; onPlan(key: keyof ActionPlan, value: string): void; onCode(): void; onHome(): void; onAgain(): void }) {
  const state = session.game;
  const [answer, setAnswer] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const asked = causalClaim(state, content) !== null;
  const speaker = (missionId: string) => { const n = content.nodes[missionId]; return n && 'advisor' in n ? n.advisor?.name : undefined; };
  const verdict = finalVerdict(state.dims, state.flags); const threads = causalThreads(state, content);
  return <section className="page scr-ending">
    <div className="frame ending">
      <div className="ending-cover ending-hero">
        <div>
          <p className="kicker">{COPY.stage.endKicker}</p>
          <Heading className="h1">{verdict.title}</Heading>
          <p className="lead ending-summary">{verdict.summary}</p>
          <p className="ending-count">{state.completed.length} decisions made</p>
          <p className="ending-question">{COPY.stage.setOut} {STORY.question}</p>
        </div>
        <ul className="final-three" aria-label={COPY.position}>
          {RULES.map(r => <li key={r.id}><Glyph name={r.id} /><span>{r.question}</span><b>{state.dims[r.id]}</b></li>)}
        </ul>
      </div>
      <Attribution state={state} content={content} answer={answer} onAnswer={setAnswer} />
      {asked && !answer && !skipped && <p><button className="ghost" onClick={() => setSkipped(true)}>{COPY.stage.revealThreads}</button></p>}
      {(!asked || answer || skipped) && <section className="end-section">
        <p className="kicker">The memory of your decisions</p>
        <h2 className="h2">Earlier, you chose. Later, it mattered.</h2>
        {threads.length ? <div className="threads">{threads.map((t, i) => <div className="thread-pair" key={i}><p><small>Because</small>{t.because}</p><span aria-hidden="true" className="thread-arrow">→</span><p><small>So later</small>{t.soLater}</p></div>)}</div>
          : <p className="end-lead">Review the decisions below to see what each approach changed. Try a different path to explore how earlier commitments can return later.</p>}
      </section>}
      <section className="end-section">
        <p className="kicker">Your decision record</p>
        <h2 className="h2">{COPY.stage.record}</h2>
        <div className="timeline">{content.chapters.map(c => {
          const entries = state.history.filter(h => h.chapter === c.number);
          if (!entries.length) return null;
          return <div key={c.number} className="timeline-act" data-chapter={c.number}>
            <p className="timeline-act-label">{COPY.stage.act} {c.number} · {c.title}</p>
            <ol>{entries.map(h => <li key={h.missionId}><details><summary><span>{content.missionOrder.indexOf(h.missionId) + 1}</span><span><small>{h.missionTitle} · {h.chosenLabel}</small><strong>{h.headline}</strong></span><span aria-hidden="true">+</span></summary><div><h3>“{h.lesson.principle}”{speaker(h.missionId) && <cite> — {speaker(h.missionId)}</cite>}</h3><p>{h.lesson.because}</p>{h.lesson.watchFor && <p>{h.lesson.watchFor}</p>}</div></details></li>)}</ol>
          </div>;
        })}</div>
      </section>
      <LearningRecord session={session} content={content} onPlan={onPlan} />
      <section className="end-section takeaway">
        <h2 className="h2">Keep the record. Try another path.</h2>
        <p className="end-lead">Your download includes this decision record, saved reflections and personal action plan. Review your notes before sharing it with anyone.</p>
        <div className="dialog-actions"><button className="secondary" onClick={onCode}>{COPY.code}</button><button className="secondary" onClick={() => downloadSummary(session, content)}>Download your debrief</button></div>
      </section>
    </div>
    <footer className="cmd-bar"><button className="ghost" onClick={onHome}>Return to the home screen</button><Action onClick={onAgain}>Explore a different path</Action></footer>
  </section>;
}
