import type { Chapter, Content, GameState, Mission } from '../../engine/types';
import { resolveAdvisorLine, resolveSaidQuote, resolveSituation } from '../../engine/engine';
import { COPY } from '../../content/interface';
import { BACKDROP, CHAPTER_LIGHT } from '../../content/presentation';
import { Action, Cutout, Heading, Portrait, World, art, castId, pad2 } from '../parts';
import { decideFamily } from './Decide';

interface Props { mission: Mission; state: GameState; content: Content; chapter: Chapter; onNext(): void }

/**
 * The brief arrives the way the decision will happen.
 *
 * Eighteen identical dossiers in a row were most of what made the game read as a stack of
 * containers. So a call is briefed as an incoming call, a message thread as notifications on
 * your phone, an argument with procurement as the file on the person across the table — and
 * only the table, board and planning decisions, which really are paperwork, get the dossier.
 * Every variant carries the same content: the situation, the facts, the client's words, your
 * colleague's steer and the open questions. Only the object they arrive in changes.
 */
export function Brief(props: Props) {
  const family = decideFamily(props.mission);
  if (family === 'call') return <CallBrief {...props} />;
  if (family === 'chat') return <ChatBrief {...props} />;
  if (family === 'case') return <CaseBrief {...props} />;
  return <DossierBrief {...props} />;
}

/** Who the decision is with: the client in the room, or your own colleague. */
function counterpart(mission: Mission, state: GameState) {
  const quote = resolveSaidQuote(mission, state);
  const internal = mission.room === 'internal' || !quote;
  return { quote, internal, name: internal ? mission.advisor?.name : quote!.speaker, role: internal ? mission.advisor?.role : quote!.role };
}

function Facts({ mission }: { mission: Mission }) {
  return mission.context?.length ? <dl className="dossier-facts">{mission.context.map(c => <div key={c.label}><dt className="mono">{c.label}</dt><dd>{c.value}</dd></div>)}</dl> : null;
}

function Objective({ mission }: { mission: Mission }) {
  return <p className="dossier-objective"><span className="mono">{COPY.stage.objective}</span><mark>{mission.objective}</mark></p>;
}

/** Your colleague's note, stuck on top. */
function Sticky({ mission, state, line = true, r = '-2.5deg', d = '320ms' }: { mission: Mission; state: GameState; line?: boolean; r?: string; d?: string }) {
  const advice = line ? resolveAdvisorLine(mission, state) : undefined;
  if (!mission.advisor || (!advice && !mission.tip)) return null;
  return <aside className="sticky enter-deal" style={{ ['--r' as string]: r, ['--d' as string]: d }} aria-label={'Note from ' + mission.advisor.name}>
    {advice && <p className="sticky-line">“{advice}”</p>}
    {mission.tip && <p className="sticky-tip">{mission.tip}</p>}
    <p className="sticky-sign"><Portrait name={mission.advisor.name} /><span><strong>{mission.advisor.name}</strong><small>{mission.advisor.role}</small></span></p>
  </aside>;
}

/** The questions a good colleague would ask, on an index card. */
function IndexCard({ mission, d = '440ms' }: { mission: Mission; d?: string }) {
  if (!mission.consider?.length && !mission.concerns?.length && !mission.client) return null;
  return <aside className="index-card paper enter-deal" style={{ ['--r' as string]: '1.5deg', ['--d' as string]: d }}>
    {mission.client && <section><h2 className="mono">{mission.client.name}</h2><p>{mission.client.blurb}</p><dl>{mission.client.facts.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl></section>}
    {mission.concerns?.length ? <section><h2 className="mono">{COPY.stage.matters}</h2><ul>{mission.concerns.map(c => <li key={c}>{c}</li>)}</ul></section> : null}
    {mission.consider?.length ? <section><h2 className="mono">{mission.advisor ? mission.advisor.name.split(' ')[0] + ' ' + COPY.stage.asks : COPY.stage.consider}</h2><ul className="serif">{mission.consider.map(c => <li key={c}>{c}</li>)}</ul></section> : null}
  </aside>;
}

/** A graded read is only ever somebody's read: the colleague's name and face are on it (G9b). */
function Assessment({ mission }: { mission: Mission }) {
  if (!mission.assessment?.length) return null;
  const who = mission.advisor ? mission.advisor.name.split(' ')[0] + COPY.stage.read : undefined;
  return <div className="brief-assessment glass">{mission.advisor && <Portrait name={mission.advisor.name} />}{mission.assessment.map(a => <p key={a.label}><span className="mono">{who ? who + ' · ' : ''}{a.label} · {a.level}</span>{a.note}</p>)}</div>;
}

function Footer({ label, onNext }: { mission: Mission; label: string; onNext(): void }) {
  return <footer className="cmd-bar"><p /><Action onClick={onNext}>{label}</Action></footer>;
}

function caseLine(content: Content, mission: Mission, chapter: Chapter) {
  return COPY.stage.caseFile + ' · ' + COPY.stage.decision + ' ' + pad2(content.missionOrder.indexOf(mission.id) + 1) + ' / ' + content.missionOrder.length + ' · ' + chapter.label;
}

/* ── Dossier: paperwork decisions ───────────────────────────────────────────── */
function DossierBrief({ mission, state, content, chapter, onNext }: Props) {
  const quote = resolveSaidQuote(mission, state);
  return <section className="stage scr-brief brief-dossier">
    <World backdrop={BACKDROP[mission.id]} mood="blur" />
    <Cutout id={castId(mission.advisor?.name)} frame={{ x: '64%', y: 0.16, face: 0.16 }} className="brief-guide enter-cast" style={{ ['--d' as string]: '380ms' }} />
    <div className="desk">
      <article className="dossier paper enter-slide">
        <header className="dossier-head">
          <span className="mono">{caseLine(content, mission, chapter)}</span>
          <span className="mono">{CHAPTER_LIGHT[mission.chapter as 1]}</span>
        </header>
        <p className="dossier-eyebrow mono">{mission.eyebrow}</p>
        <Heading className="dossier-title serif">{mission.title}</Heading>
        <div className="dossier-text serif">{resolveSituation(mission, state).map((line, i) => <p key={i}>{line}</p>)}</div>
        <Facts mission={mission} />
        {quote && <blockquote className="dossier-quote"><p className="serif">“{quote.text}”</p><cite className="mono">{quote.speaker} · {quote.role}</cite></blockquote>}
        <Objective mission={mission} />
      </article>
      <div className="desk-side">
        <figure className="polaroid enter-deal" style={{ ['--r' as string]: '3deg', ['--d' as string]: '200ms' }} aria-hidden="true">
          <span className="tape" />
          <img src={art(BACKDROP[mission.id])} alt="" />
          <figcaption className="mono">{mission.client?.name ?? chapter.label}</figcaption>
        </figure>
        <Sticky mission={mission} state={state} />
        <IndexCard mission={mission} />
      </div>
    </div>
    <Assessment mission={mission} />
    <Footer mission={mission} label={COPY.choices} onNext={onNext} />
  </section>;
}

/* ── Incoming call ───────────────────────────────────────────────────────────── */
function CallBrief({ mission, state, content, chapter, onNext }: Props) {
  const who = counterpart(mission, state);
  return <section className="stage scr-brief brief-call">
    <World backdrop={BACKDROP[mission.id]} mood="dim" />
    <div className="incoming-wrap">
      <div className="incoming enter-fade">
        <img className="call-room" src={art(BACKDROP[mission.id])} alt="" aria-hidden="true" />
        <Cutout id={castId(who.name)} frame={{ x: '50%', y: 0.16, face: 0.3, close: true }} className="enter-cast" style={{ ['--d' as string]: '160ms' }} />
        <div className="incoming-id">
          <span className="ring" aria-hidden="true"><i /><i /><i /></span>
          <p className="mono">{COPY.stage.incoming}</p>
          <p className="incoming-name display">{who.name}</p>
          <p className="incoming-role">{who.role}</p>
        </div>
      </div>
      <div className="incoming-notes">
        <article className="call-notes paper enter-slide" style={{ ['--d' as string]: '120ms' }}>
          <p className="mono notes-head">{caseLine(content, mission, chapter)}</p>
          <p className="mono notes-kicker">{COPY.stage.beforeCall}</p>
          <Heading className="notes-title serif">{mission.title}</Heading>
          <div className="dossier-text serif">{resolveSituation(mission, state).map((line, i) => <p key={i}>{line}</p>)}</div>
          <Facts mission={mission} />
          {who.quote && <blockquote className="dossier-quote"><p className="serif">“{who.quote.text}”</p><cite className="mono">{who.quote.speaker} · {who.quote.role}</cite></blockquote>}
          <Objective mission={mission} />
        </article>
        <div className="notes-side">
          <Sticky mission={mission} state={state} r="2deg" />
          <IndexCard mission={mission} />
        </div>
      </div>
    </div>
    <Assessment mission={mission} />
    <Footer mission={mission} label={COPY.stage.joinCall} onNext={onNext} />
  </section>;
}

/* ── Messages arriving ───────────────────────────────────────────────────────── */
function ChatBrief({ mission, state, content, chapter, onNext }: Props) {
  const who = counterpart(mission, state);
  const advice = resolveAdvisorLine(mission, state);
  const messages = [
    ...(who.quote ? [{ from: who.quote.speaker, role: who.quote.role, text: who.quote.text }] : []),
    ...(mission.advisor && advice ? [{ from: mission.advisor.name, role: mission.advisor.role, text: advice }] : []),
  ];
  return <section className="stage scr-brief brief-chat">
    <World backdrop={BACKDROP[mission.id]} mood="blur" />
    <Cutout id={castId(who.name)} frame={{ x: '86%', y: 0.06, face: 0.2 }} className="brief-guide enter-cast" style={{ ['--d' as string]: '380ms' }} />
    <div className="chat-brief">
      <div className="phone brief-phone enter-deal" style={{ ['--r' as string]: '-3deg' }}>
        <div className="phone-screen">
          <p className="phone-date mono">{COPY.stage.messages}</p>
          <p className="phone-time phone-label display">{mission.eyebrow}</p>
          <ul className="notification-stack" aria-label={COPY.stage.messages}>
            {messages.map((m, i) => <li key={i} className="notification glass enter-rise" style={{ ['--i' as string]: i + 2 }}>
              <p className="mono">{COPY.stage.message} · {m.role}</p>
              <span className="notification-from"><Portrait name={m.from} /><strong>{m.from}</strong></span>
              <span className="notification-text">{m.text}</span>
            </li>)}
          </ul>
        </div>
      </div>
      <article className="call-notes paper enter-slide" style={{ ['--d' as string]: '160ms' }}>
        <p className="mono notes-head">{caseLine(content, mission, chapter)}</p>
        <p className="mono notes-kicker">{mission.eyebrow}</p>
        <Heading className="notes-title serif">{mission.title}</Heading>
        <div className="dossier-text serif">{resolveSituation(mission, state).map((line, i) => <p key={i}>{line}</p>)}</div>
        <Facts mission={mission} />
        <Objective mission={mission} />
      </article>
      <div className="notes-side">
        <Sticky mission={mission} state={state} line={false} r="2deg" />
        <IndexCard mission={mission} d="300ms" />
      </div>
    </div>
    <Assessment mission={mission} />
    <Footer mission={mission} label={COPY.stage.openThread} onNext={onNext} />
  </section>;
}

/* ── The file on the person across the table ─────────────────────────────────── */
function CaseBrief({ mission, state, content, chapter, onNext }: Props) {
  const who = counterpart(mission, state);
  return <section className="stage scr-brief brief-case">
    <World backdrop={BACKDROP[mission.id]} mood="dim" />
    <div className="case-brief">
      <div className="case-subject">
        <Cutout id={castId(who.name)} frame={{ x: '50%', y: 0.08, face: 0.24 }} className="enter-cast" />
        {who.quote && <blockquote className="case-challenge enter-rise" style={{ ['--d' as string]: '260ms' }}><p className="serif">“{who.quote.text}”</p><cite className="mono">{who.quote.speaker} · {who.quote.role}</cite></blockquote>}
      </div>
      <article className="subject-file enter-slide" style={{ ['--d' as string]: '120ms' }}>
        <p className="folder-tab mono">{COPY.stage.facing} · {who.name}</p>
        <div className="subject-sheet paper">
          <p className="mono notes-head">{caseLine(content, mission, chapter)}</p>
          <p className="mono notes-kicker">{mission.eyebrow}</p>
          <Heading className="notes-title serif">{mission.title}</Heading>
          <div className="dossier-text serif">{resolveSituation(mission, state).map((line, i) => <p key={i}>{line}</p>)}</div>
          <Facts mission={mission} />
          <Objective mission={mission} />
        </div>
      </article>
      <div className="notes-side">
        <Sticky mission={mission} state={state} r="-2deg" />
        <IndexCard mission={mission} />
      </div>
    </div>
    <Assessment mission={mission} />
    <Footer mission={mission} label={COPY.stage.makeCase} onNext={onNext} />
  </section>;
}
