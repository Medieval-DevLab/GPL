import type { Content } from '../../engine/types';
import { COPY } from '../../content/interface';
import { CHAPTER_LIGHT } from '../../content/presentation';
import type { ResumeState, Session } from '../../session';
import { Action, Cutout, Heading, World, pad2 } from '../parts';

/**
 * The title is a poster, not a landing page: the people the player is about to meet stand
 * in the city they will spend the next hour in. Every face here appears in the story.
 */
export function Title({ content, resume, onResume, onStart }: { content: Content; resume: ResumeState; onResume(s: Session): void; onStart(): void }) {
  const saved = resume.candidates;
  return <section className="stage scr-title">
    <World backdrop="env-skyline-dusk" mood="vivid" />
    <div className="title-cast" aria-hidden="true">
      <Cutout id="marcus" frame={{ x: '16%', y: 0.2, face: 0.12 }} className="is-back enter-cast" style={{ ['--d' as string]: '420ms' }} />
      <Cutout id="declan" frame={{ x: '86%', y: 0.16, face: 0.13 }} className="is-back enter-cast" style={{ ['--d' as string]: '520ms' }} />
      <Cutout id="priya" frame={{ x: '40%', y: 0.13, face: 0.15 }} className="enter-cast" style={{ ['--d' as string]: '160ms', ['--from' as string]: '-40px' }} />
      <Cutout id="sarah" frame={{ x: '68%', y: 0.3, face: 0.19 }} className="enter-cast" style={{ ['--d' as string]: '300ms' }} />
    </div>
    <div className="title-copy">
      <p className="kicker enter-rise">{COPY.stage.kicker} · {COPY.stage.client}</p>
      <Heading className="title-head display enter-slam">{COPY.welcome}</Heading>
      <p className="title-premise enter-rise" style={{ ['--i' as string]: 2 }}>{COPY.premise}</p>
      <p className="title-role enter-rise" style={{ ['--i' as string]: 3 }}>{COPY.role}</p>
      {saved.length > 1 && <p className="notice">{COPY.conflict}</p>}
      <div className="title-actions enter-rise" style={{ ['--i' as string]: 4 }}>
        {saved.map(s => {
          const node = content.nodes[s.session.game.nodeId];
          const where = node.kind === 'ending' ? 'Completed engagement' : 'title' in node ? node.title : 'Engagement in progress';
          return <div className="resume-choice" key={s.source}>
            <Action onClick={() => onResume(s.session)}>{saved.length === 1 ? COPY.resume : s.source === 'local' ? 'Continue browser engagement' : 'Continue learning-platform engagement'}</Action>
            <small>{s.session.game.completed.length} decisions made · {where}</small>
          </div>;
        })}
        {saved.length
          ? <button className="text-link" onClick={onStart}>{COPY.restart}</button>
          : <Action onClick={onStart}>{COPY.start}</Action>}
      </div>
      {resume.local.status === 'stale' && <p className="notice">{resume.local.message}{resume.local.code && <><br />Saved code: <code>{resume.local.code}</code></>}</p>}
      {resume.invalidLms && <p className="notice">{COPY.invalidLms}</p>}
      <p className="title-format enter-rise" style={{ ['--i' as string]: 5 }}><b>{COPY.format}</b> · {COPY.duration}</p>
    </div>
    <ol className="title-acts enter-fade" style={{ ['--d' as string]: '500ms' }} aria-label="The five chapters">
      {content.chapters.map(c => <li key={c.number} data-chapter={c.number}><span className="mono">{pad2(c.number)} · {CHAPTER_LIGHT[c.number as 1]}</span>{c.label}</li>)}
    </ol>
  </section>;
}
