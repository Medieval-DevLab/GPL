import type { Content } from '../../engine/types';
import { COPY } from '../../content/interface';
import { RULES, STORY } from '../../content/presentation';
import type { ResumeState, Session } from '../../session';
import { Action, Backdrop, Heading } from '../parts';
import { Figure, RuleMark } from './FrameParts';
import { Recall } from './Recall';

/**
 * The title is a poster. The people the player is about to meet stand in the client's store,
 * and the whole game is stated on one solid sheet in front of them: the question the player
 * is answering, the client's ask, what is at stake. Along the counter at the foot of the
 * poster run the three questions every decision turns on and the five acts it takes (D-080's
 * spine, staged as D-081 stages a decision).
 */
export function Title({ content, resume, onResume, onStart }: { content: Content; resume: ResumeState; onResume(s: Session): void; onStart(): void }) {
  const saved = resume.candidates;
  const F = COPY.frames.title;
  const words = COPY.welcome.split(' ');
  return <section className="page fs f-title">
    <Backdrop photo="scene-chapter-1" />
    <div className="f-cast f-title-cast">
      {/* Back row first: each stands directly behind someone in front, who hides where the photograph ends. */}
      <Figure id="marcus" depth="back" enter="rise" delay={520} box={{ left: '43.5%', width: '10%', top: 0, height: '75%' }} frame={{ x: '50%', y: 0.62, face: 0.14 }} />
      <Figure id="declan" depth="back" enter="rise" delay={640} box={{ left: '80%', width: '15%', top: 0, height: '75%' }} frame={{ x: '50%', y: 0.62, face: 0.14 }} />
      <Figure id="sarah" enter="right" delay={780} box={{ left: '66%', width: '34%', top: '24%', bottom: 0 }} frame={{ x: '62%', y: 0.12, face: 0.27 }} />
      <Figure id="priya" enter="left" delay={920} box={{ left: '44%', width: '30%', top: 0, bottom: 0 }} frame={{ x: '50%', y: 0.08, face: 0.17 }} />
    </div>

    <div className="f-title-card sheet">
      <p className="f-kicker">{COPY.stage.kicker} · {COPY.stage.client}</p>
      <Heading className="f-title-h">{words.map((w, i) => <span key={i}>{i > 0 && ' '}<span className="w" style={{ ['--w' as string]: i }}>{w}</span></span>)}</Heading>
      <p className="f-title-q">{STORY.question}</p>
      <p className="f-title-ask">{STORY.ask} {STORY.stakes}</p>
      {saved.length > 1 && <p className="notice">{COPY.conflict}</p>}
      <div className="f-title-actions">
        {saved.map(s => {
          const node = content.nodes[s.session.game.nodeId];
          const where = node.kind === 'ending' ? F.completed : 'title' in node ? node.title : F.inProgress;
          return <div className="f-resume" key={s.source}>
            <Action onClick={() => onResume(s.session)}>{saved.length === 1 ? COPY.resume : s.source === 'local' ? F.continueLocal : F.continueLms}</Action>
            <small>{s.session.game.completed.length} {F.made} · {where}</small>
          </div>;
        })}
        {saved.length ? <button className="text-link" onClick={onStart}>{COPY.restart}</button> : <Action onClick={onStart}>{COPY.start}</Action>}
      </div>
      {saved.length === 1 && <Recall content={content} game={saved[0].session.game} />}
      {resume.local.status === 'stale' && <p className="notice">{resume.local.message}{resume.local.code && <><br />{F.savedCode} <code>{resume.local.code}</code></>}</p>}
      {resume.invalidLms && <p className="notice">{COPY.invalidLms}</p>}
      <p className="f-title-format"><b>{COPY.format}</b> · {COPY.duration}</p>
    </div>

    <div className="f-counter">
      <section className="f-three" aria-labelledby="three-heading">
        <h2 id="three-heading">{COPY.stage.threeQuestions}</h2>
        <ul>{RULES.map((r, i) => <li key={r.id} style={{ ['--i' as string]: i }}><RuleMark id={r.id} /><strong>{r.question}</strong><span>{r.plain}</span></li>)}</ul>
      </section>
      <section className="f-acts" aria-labelledby="acts-heading">
        <h2 id="acts-heading">{F.acts}</h2>
        <ol>{content.chapters.map((c, i) => <li key={c.number} data-chapter={c.number} style={{ ['--i' as string]: i }}><b>{c.number}</b><span>{c.title}</span></li>)}</ol>
      </section>
    </div>
  </section>;
}
