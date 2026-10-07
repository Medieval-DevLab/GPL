import type { Content } from '../../engine/types';
import { COPY } from '../../content/interface';
import { RULES, STORY } from '../../content/presentation';
import type { ResumeState, Session } from '../../session';
import { Action, Glyph, Heading, art } from '../parts';

/**
 * The title states the whole game in four lines: the client's ask, the question the player
 * is answering, what is at stake, and the three questions every decision will turn on. A
 * learner who reads only this screen knows what to listen for for the next hour (D-080).
 */
export function Title({ content, resume, onResume, onStart }: { content: Content; resume: ResumeState; onResume(s: Session): void; onStart(): void }) {
  const saved = resume.candidates;
  return <section className="page scr-title">
    <div className="frame">
      <div className="title">
        <div>
          <p className="kicker">{COPY.stage.kicker}</p>
          <Heading className="h1">{COPY.welcome}</Heading>
          <p className="lead">{STORY.question}</p>
          <p className="read">{STORY.ask} {STORY.stakes}</p>
          {saved.length > 1 && <p className="notice">{COPY.conflict}</p>}
          <div className="title-actions">
            {saved.map(s => {
              const node = content.nodes[s.session.game.nodeId];
              const where = node.kind === 'ending' ? 'Completed engagement' : 'title' in node ? node.title : 'Engagement in progress';
              return <div className="resume-choice" key={s.source}>
                <Action onClick={() => onResume(s.session)}>{saved.length === 1 ? COPY.resume : s.source === 'local' ? 'Continue browser engagement' : 'Continue learning-platform engagement'}</Action>
                <small>{s.session.game.completed.length} decisions made · {where}</small>
              </div>;
            })}
            {saved.length ? <button className="text-link" onClick={onStart}>{COPY.restart}</button> : <Action onClick={onStart}>{COPY.start}</Action>}
          </div>
          {resume.local.status === 'stale' && <p className="notice">{resume.local.message}{resume.local.code && <><br />Saved code: <code>{resume.local.code}</code></>}</p>}
          {resume.invalidLms && <p className="notice">{COPY.invalidLms}</p>}
          <p className="title-format"><b>{COPY.format}</b> · {COPY.duration}</p>
        </div>
        <div>
          <figure className="photo-frame title-photo"><img src={art('scene-chapter-1')} alt="" /><figcaption>{COPY.stage.client}</figcaption></figure>
          <p className="kicker" style={{ marginTop: 22 }}>{COPY.stage.threeQuestions}</p>
          <ul className="three">{RULES.map(r => <li key={r.id}><Glyph name={r.id} /><strong>{r.question}</strong><span>{r.plain}</span></li>)}</ul>
        </div>
      </div>
      <ol className="acts-strip" aria-label="The five acts">
        {content.chapters.map(c => <li key={c.number} data-chapter={c.number}><small>{COPY.stage.act} {c.number}</small>{c.title}</li>)}
      </ol>
    </div>
  </section>;
}
