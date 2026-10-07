import type { ReactNode } from 'react';
import type { Chapter, Condition, Content, GameState, Mission, Option } from '../../engine/types';
import { availableOptions, canCommit, requiredSelectionCount, resolveAdvisorLine, resolveSaidQuote } from '../../engine/engine';
import { COPY } from '../../content/interface';
import { EARNED } from '../../content/gates';
import { BACKDROP } from '../../content/presentation';
import { Action, Cutout, Glyph, Heading, Pips, Portrait, World, art, castId, pad2 } from '../parts';

export type DecideFamily = 'table' | 'board' | 'plan' | 'chat' | 'call' | 'case';

/** Which composition a mission is staged in. Presentation only — the engine never sees this. */
export function decideFamily(mission: Mission): DecideFamily {
  if (mission.kind === 'investigate') return 'board';
  if (mission.kind === 'build') return 'plan';
  if (mission.presentation === 'apply') return 'case';
  if (mission.presentation === 'dialogue') return mission.surface === 'call' ? 'call' : 'chat';
  return 'table';
}

interface Props { mission: Mission; state: GameState; content: Content; chapter: Chapter; onToggle(id: string): void; onCommit(): void; onBrief(): void; head?: ReactNode }

/**
 * One layout per kind of decision, never a shared panel (Atlus built a separate program for
 * every Persona 5 menu for the same reason). They share only the question at the top and the
 * command bar at the bottom, so the player always knows where to look and what commits.
 */
export function Decide(props: Props) {
  const { mission, state, content, chapter } = props;
  const family = decideFamily(mission);
  const need = requiredSelectionCount(mission);
  const index = content.missionOrder.indexOf(mission.id) + 1;
  /* Dialogue screens carry their own people; the others take the colleague's steer up top. */
  const steer = family === 'table' || family === 'board' || family === 'plan';
  const head = <header className="decide-head">
    <div className="decide-title">
      <p className="kicker enter-rise">{COPY.stage.decision} {pad2(index)} / {content.missionOrder.length} · {chapter.label}</p>
      <Heading className="display enter-slam">{mission.question}</Heading>
      {mission.prompt && <p className="decide-prompt enter-rise" style={{ ['--i' as string]: 1 }}>{mission.prompt}</p>}
    </div>
    <div className="decide-aside">
      <button className="ghost" onClick={props.onBrief}><Glyph name="file" />{COPY.audit}</button>
      {steer && <Steer mission={mission} state={state} />}
    </div>
  </header>;
  const body = family === 'board' ? <Board {...props} /> : family === 'plan' ? <Plan {...props} /> : family === 'chat' ? <Chat {...props} head={head} /> : family === 'call' ? <Call {...props} head={head} /> : family === 'case' ? <Case {...props} /> : <Table {...props} />;
  const label = mission.kind === 'investigate' ? COPY.investigate : mission.kind === 'build' ? COPY.assemble : mission.presentation === 'dialogue' ? COPY.send : COPY.commit;
  return <section className={'stage scr-decide decide-' + family}>
    <World backdrop={BACKDROP[mission.id]} mood={family === 'plan' ? 'blur' : family === 'board' ? 'dim' : 'room'} />
    {family !== 'chat' && family !== 'call' && head}
    {body}
    <footer className="cmd-bar decide-bar">
      <Summary mission={mission} state={state} need={need} />
      <Action onClick={props.onCommit} disabled={!canCommit(state, content)}>{label}</Action>
    </footer>
  </section>;
}

/** UI-02: what will be committed, in the order chosen, next to the button that commits it. */
function Summary({ mission, state, need }: { mission: Mission; state: GameState; need: number }) {
  const titleOf = (id: string) => mission.kind === 'choice' ? mission.options.find(o => o.id === id)?.title
    : mission.kind === 'investigate' ? mission.evidence.find(e => e.id === id)?.label : mission.components.find(c => c.id === id)?.title;
  const slots = Array.from({ length: need }, (_, i) => state.selection[i]);
  return <div className="plan-summary">
    <p className="mono" role="status">{need === 1 ? COPY.stage.pickOne : COPY.stage.pickExactly + ' ' + need} · {state.selection.length} of {need} {COPY.stage.selected}</p>
    <ol aria-label="Your selection">{slots.map((id, i) => <li key={i} className={id ? 'is-filled' : ''}><span className="mono">{pad2(i + 1)}</span>{id ? titleOf(id) : '—'}</li>)}</ol>
  </div>;
}

/* ── Shared pieces ─────────────────────────────────────────────────────────── */

function needs(condition: Condition | undefined) {
  const all = condition?.all ?? [], any = condition?.any ?? [];
  return { all, any };
}

/** Cost and commitment: the only things a player may see before deciding (rule G3). */
function Tradeoffs({ option, compact = false }: { option: Option; compact?: boolean }) {
  return <>
    {option.commits && <p className="opt-commits"><span className="mono">{COPY.stage.commits}</span>{option.commits}</p>}
    {(option.pros?.length || option.cons?.length) ? <ul className="opt-tags">
      {option.pros?.map(p => <li key={p} className="pro"><span aria-hidden="true">+</span><span className="sr-only">{COPY.stage.offers}: </span>{p}</li>)}
      {option.cons?.map(c => <li key={c} className="con"><span aria-hidden="true">−</span><span className="sr-only">{COPY.stage.givesUp}: </span>{c}</li>)}
    </ul> : null}
    {option.cost && !compact && <p className="opt-cost mono"><span>{COPY.stage.effort} <Pips value={option.cost.time} label={COPY.stage.effort} /></span><span>{COPY.stage.investment} <Pips value={option.cost.investment} label={COPY.stage.investment} /></span></p>}
  </>;
}

function LockNote({ option }: { option: Option }) {
  const { all, any } = needs(option.requires);
  const flags = [...all, ...any];
  if (flags.length > 0 && flags.every(f => EARNED[f]?.liability)) return <div className="lock-note"><p><Glyph name="lock" /><b>{COPY.stage.lockedTitle}</b></p><p>{COPY.stage.liabilityGate}</p></div>;
  return <div className="lock-note">
    <p><Glyph name="lock" /><b>{COPY.stage.lockedTitle}</b></p>
    {all.map(f => <p key={f}>{COPY.stage.needs}: {EARNED[f]?.as ?? 'an earlier commitment'}{EARNED[f] && <small>{EARNED[f].where}</small>}</p>)}
    {any.length > 0 && <p>{COPY.stage.needsOne}: {any.map(f => EARNED[f]?.as ?? 'an earlier commitment').join(' or ')}{any.some(f => EARNED[f]) && <small>{[...new Set(any.map(f => EARNED[f]?.where).filter(Boolean))].join(' · ')}</small>}</p>}
  </div>;
}

/**
 * A choosable item. The button carries a short accessible name (the title); the rest of the
 * card is its description, and a stretched hit area makes the whole card clickable.
 */
function Choice({ id, title, selected, enabled, onToggle, number, className = '', children, style, morph = false }: {
  id: string; title: ReactNode; selected: boolean; enabled: boolean; onToggle(): void; number: number; className?: string; children?: ReactNode; style?: React.CSSProperties; morph?: boolean;
}) {
  const desc = 'desc-' + id;
  /* The selected single choice carries the view-transition name the stamped card on the
     consequence screen also carries, so committing visibly turns this card into that one. */
  const named = morph && selected ? { ...style, viewTransitionName: 'committed' } : style;
  return <article className={'choice ' + className + (selected ? ' is-selected' : '') + (!enabled ? ' is-locked' : '')} style={named}>
    <button className="choice-hit" data-choice={id} aria-pressed={selected} disabled={!enabled} aria-describedby={desc} onClick={onToggle}>
      <span className="choice-num mono" aria-hidden="true">{selected ? '✓' : pad2(number)}</span>
      <span className="choice-title">{title}</span>
    </button>
    <div className="choice-desc" id={desc}>{children}</div>
  </article>;
}

function Steer({ mission, state }: { mission: Mission; state: GameState }) {
  const line = resolveAdvisorLine(mission, state);
  if (!mission.advisor || !line) return null;
  return <aside className="steer glass enter-rise" style={{ ['--d' as string]: '220ms' }}>
    <Portrait name={mission.advisor.name} />
    <div><p className="mono">{mission.advisor.name} · {mission.advisor.role}</p><p className="steer-line">“{line}”</p></div>
  </aside>;
}

/* ── Table: three or four approaches dealt as cards on a table ─────────────── */
function Table({ mission, state, onToggle }: Props) {
  if (mission.kind !== 'choice') return null;
  const allowed = new Set(availableOptions(mission, state).map(o => o.id));
  const n = mission.options.length;
  return <div className="table-wrap">
    <div className="table" style={{ ['--n' as string]: n }}>
      {mission.options.map((o, i) => <Choice key={o.id} id={o.id} number={i + 1} title={o.title} selected={state.selection.includes(o.id)} enabled={allowed.has(o.id)} onToggle={() => onToggle(o.id)} morph
        className="card paper enter-deal" style={{ ['--i' as string]: i, ['--r' as string]: ((i - (n - 1) / 2) * 1.6).toFixed(1) + 'deg' }}>
        <p className="card-line">{o.description}</p>
        {allowed.has(o.id) ? <Tradeoffs option={o} /> : <LockNote option={o} />}
      </Choice>)}
    </div>
  </div>;
}

/* ── Board: questions pinned around the client, strings to what you chose ──── */
function boardSlots(n: number) {
  const top = Math.ceil(n / 2), bottom = n - top;
  const row = (count: number, y: number, inset: number) => Array.from({ length: count }, (_, i) => ({ x: count === 1 ? 50 : inset + (i * (100 - inset * 2)) / (count - 1), y }));
  return [...row(top, 24, 15), ...row(bottom, 74, bottom === 2 ? 22 : 15)];
}
function Board({ mission, state, onToggle }: Props) {
  if (mission.kind !== 'investigate') return null;
  const slots = boardSlots(mission.evidence.length);
  const hub = { x: 50, y: 62 };
  return <div className="board-wrap">
    <div className="board">
      <svg className="strings" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {mission.evidence.map((e, i) => state.selection.includes(e.id) ? <line key={e.id} x1={hub.x} y1={hub.y - 8} x2={slots[i].x} y2={slots[i].y} /> : null)}
      </svg>
      <figure className="board-hub polaroid" style={{ left: hub.x + '%', top: hub.y + '%' }} aria-hidden="true">
        <img src={art(BACKDROP[mission.id])} alt="" /><figcaption className="mono">{mission.client?.name ?? 'Orion Retail'}</figcaption>
      </figure>
      {mission.evidence.map((e, i) => <Choice key={e.id} id={e.id} number={i + 1} title={e.label} selected={state.selection.includes(e.id)} enabled onToggle={() => onToggle(e.id)}
        className="pin-card paper enter-deal" style={{ left: slots[i].x + '%', top: slots[i].y + '%', ['--i' as string]: i, ['--r' as string]: [-3, 2, -1.5, 2.5, -2, 1.5][i % 6] + 'deg' }}>
        <span className="pin" aria-hidden="true" />
        <p className="serif">{e.question}</p>
      </Choice>)}
    </div>
  </div>;
}

/* ── Plan: a planning wall with a fixed number of funded slots ─────────────── */
function Plan({ mission, state, onToggle }: Props) {
  if (mission.kind !== 'build') return null;
  const quote = resolveSaidQuote(mission, state);
  return <div className="plan-wrap">
    <div className="wall paper">
      <div className="wall-grid">
        {mission.components.map((c, i) => <Choice key={c.id} id={c.id} number={i + 1} title={c.title} selected={state.selection.includes(c.id)} enabled onToggle={() => onToggle(c.id)}
          className="magnet enter-deal" style={{ ['--i' as string]: i }}>
          <span className="magnet-tag mono">{c.tag}</span>
          <p>{c.description}</p>
        </Choice>)}
      </div>
    </div>
    {quote && <div className="plan-side">
      <blockquote className="sticky enter-deal" style={{ ['--r' as string]: '2deg' }}><p className="sticky-line">“{quote.text}”</p><p className="sticky-sign"><Portrait name={quote.speaker} /><span><strong>{quote.speaker}</strong><small>{quote.role}</small></span></p></blockquote>
    </div>}
  </div>;
}

/** Who is speaking on a dialogue beat: the client in the room, or your own colleague. */
function speakerOf(mission: Mission, state: GameState) {
  const quote = resolveSaidQuote(mission, state);
  const internal = mission.room === 'internal' || !quote;
  return {
    quote, internal,
    name: internal ? mission.advisor?.name ?? 'Your colleague' : quote!.speaker,
    role: internal ? mission.advisor?.role ?? 'Engagement team' : quote!.role,
    line: internal ? resolveAdvisorLine(mission, state) : quote!.text,
  };
}

function Replies({ mission, state, onToggle, variant }: Props & { variant: 'bubble' | 'line' }) {
  if (mission.kind !== 'choice') return null;
  const allowed = new Set(availableOptions(mission, state).map(o => o.id));
  return <div className={'replies replies-' + variant}>
    {mission.options.map((o, i) => <Choice key={o.id} id={o.id} number={i + 1} title={o.title} selected={state.selection.includes(o.id)} enabled={allowed.has(o.id)} onToggle={() => onToggle(o.id)} morph
      className={'reply enter-rise'} style={{ ['--i' as string]: i, ['--d' as string]: '200ms' }}>
      {o.say && <p className="reply-say serif">“{o.say}”</p>}
      {allowed.has(o.id) ? <Tradeoffs option={o} compact={variant === 'bubble'} /> : <LockNote option={o} />}
    </Choice>)}
  </div>;
}

/* ── Chat: a messaging thread in a column, the person standing in the room ─── */
function Chat(props: Props) {
  const { mission, state } = props;
  const s = speakerOf(mission, state);
  return <div className="chat-wrap">
    <div className="chat-left">
      {props.head}
      <div className="chat-cast" aria-hidden="true">
        <Cutout id={castId(s.name)} frame={{ x: '46%', y: 0.06, face: 0.2 }} className="enter-cast" />
        <span className="cast-name">{s.name.split(' ')[0]}</span>
      </div>
    </div>
    <div className="messenger glass enter-slide" style={{ ['--d' as string]: '80ms' }}>
      <header className="messenger-head"><Portrait name={s.name} /><div><strong>{s.name}</strong><small>{s.role}</small></div><span className="mono">{COPY.stage.online}</span></header>
      <div className="thread">
        {s.internal && s.quote && <div className="bubble forwarded"><p className="mono">Forwarded · {s.quote.speaker}, {s.quote.role}</p><p>“{s.quote.text}”</p></div>}
        {s.line && <div className="bubble incoming"><Portrait name={s.name} /><p>{s.line}</p></div>}
        {!s.internal && mission.advisor && resolveAdvisorLine(mission, state) && <div className="bubble aside"><Portrait name={mission.advisor.name} /><p><span className="mono">{mission.advisor.name} · {mission.advisor.role}</span>{resolveAdvisorLine(mission, state)}</p></div>}
      </div>
      <div className="composer"><p className="mono">{COPY.stage.replyAs}</p><Replies {...props} variant="bubble" /></div>
    </div>
  </div>;
}

/* ── Call: the speaker on camera; your possible lines in a column beside them ─ */
function Call(props: Props) {
  const { mission, state } = props;
  const s = speakerOf(mission, state);
  const steer = !s.internal && mission.advisor ? resolveAdvisorLine(mission, state) : undefined;
  return <div className="call-wrap">
    <div className="call-video enter-fade">
      <img className="call-room" src={art(BACKDROP[mission.id])} alt="" aria-hidden="true" />
      <Cutout id={castId(s.name)} frame={{ x: '50%', y: 0.12, face: 0.3, close: true }} className="enter-cast" style={{ ['--d' as string]: '160ms' }} />
      <div className="call-lower"><span className="live mono">● Live</span><strong>{s.name}</strong><small>{s.role}</small></div>
      {s.line && <p className="call-caption serif">“{s.line}”</p>}
      <div className="call-self"><span className="portrait portrait-empty">{COPY.stage.you.slice(0, 1)}</span><small>{COPY.stage.you} · {COPY.stage.cameraOff}</small></div>
      {steer && mission.advisor && <div className="call-aside glass"><Portrait name={mission.advisor.name} /><p><span className="mono">{COPY.stage.steer} · {mission.advisor.name}</span>{steer}</p></div>}
    </div>
    <div className="call-column">
      {props.head}
      <p className="mono">{COPY.stage.onCall} · {COPY.stage.replyAs}</p>
      <Replies {...props} variant="line" />
    </div>
  </div>;
}

/* ── Case: across the table from the person you must persuade, evidence in hand ─ */
function Case(props: Props) {
  const { mission, state, onToggle } = props;
  if (mission.kind !== 'choice') return null;
  const s = speakerOf(mission, state);
  const allowed = new Set(availableOptions(mission, state).map(o => o.id));
  const relevant = [...new Set(mission.options.flatMap(o => [...needs(o.requires).all, ...needs(o.requires).any]))].filter(f => EARNED[f]);
  return <div className="case-wrap">
    <div className="case-opponent">
      <Cutout id={castId(s.name)} frame={{ x: '46%', y: 0.04, face: 0.22 }} className="enter-cast" style={{ ['--from' as string]: '-40px' }} />
      {s.line && <blockquote className="case-challenge enter-rise" style={{ ['--d' as string]: '240ms' }}><p className="serif">“{s.line}”</p><cite className="mono">{s.name} · {s.role}</cite></blockquote>}
    </div>
    <aside className="folder enter-slide" aria-label={COPY.stage.evidence}>
      <p className="folder-tab mono">{COPY.stage.evidence}</p>
      {relevant.length === 0 ? <p>{COPY.stage.evidenceNone}</p> : <ul>{relevant.map(f => {
        const has = state.flags.includes(f), liability = !!EARNED[f].liability;
        if (liability) return <li key={f} className={'is-liability' + (has ? '' : ' is-absent')}><Glyph name="pin" /><span><strong>{EARNED[f].as}</strong><small>{has ? EARNED[f].where : COPY.stage.notInRecord}</small></span></li>;
        return <li key={f} className={has ? 'is-earned' : 'is-missing'}><Glyph name={has ? 'check' : 'lock'} /><span><strong>{EARNED[f].as}</strong><small>{has ? EARNED[f].where : COPY.stage.missing}</small></span></li>;
      })}</ul>}
    </aside>
    <div className="arguments">
      {mission.options.map((o, i) => {
        return <Choice key={o.id} id={o.id} number={i + 1} title={o.title} selected={state.selection.includes(o.id)} enabled={allowed.has(o.id)} onToggle={() => onToggle(o.id)} morph
          className="argument enter-rise" style={{ ['--i' as string]: i, ['--d' as string]: '180ms' }}>
          {o.say && <p className="reply-say serif">“{o.say}”</p>}
          {allowed.has(o.id) ? <Tradeoffs option={o} compact /> : <LockNote option={o} />}
        </Choice>;
      })}
    </div>
  </div>;
}
