import { useEffect, useRef, useState } from 'react';
import type { Chapter, Condition, Content, DimensionId, GameState, Mission, Option } from '../../engine/types';
import { BADGE_META } from '../../engine/types';
import { availableOptions, canCommit, ledger, requiredSelectionCount, resolveAdvisorLine } from '../../engine/engine';
import { COPY } from '../../content/interface';
import { EARNED } from '../../content/gates';
import { RULES, placeOf } from '../../content/presentation';
import { Action, Backdrop, Cutout, Glyph, Heading, Portrait, castId, firstName } from '../parts';
import { briefLines, castOf, outcomeLines, type Line } from '../script';
import { DialogueBox, Thread } from './Dialogue';

export type Family = 'table' | 'board' | 'plan' | 'chat' | 'call' | 'case';
/** Which medium a decision happens in. Presentation only — the engine never sees this. */
export function familyOf(mission: Mission): Family {
  if (mission.kind === 'investigate') return 'board';
  if (mission.kind === 'build') return 'plan';
  if (mission.presentation === 'apply') return 'case';
  if (mission.presentation === 'dialogue') return mission.surface === 'call' ? 'call' : 'chat';
  return 'table';
}

type Stage = { k: 'brief'; i: number } | { k: 'choose' } | { k: 'card' } | { k: 'after'; i: number };

interface Props {
  mission: Mission; state: GameState; content: Content; chapter: Chapter; before?: readonly string[];
  onToggle(id: string): void; onCommit(): void; onNext(): void; onFile(): void;
}

/**
 * A decision, performed (D-081). One scene, four stages, and the screen never jumps:
 *
 *   brief   the people in the room explain, one line at a time
 *   choose  the options arrive in the scene's own medium; your colleague can be asked
 *   card    what happened lands as a title card while the deal's three measures move
 *   after   your colleague tells you what happened, why, and what to keep
 *
 * Every word comes from content via ui/script.ts; this component only stages it.
 */
export function Scene(props: Props) {
  const { mission, state, content } = props;
  const family = familyOf(mission);
  const brief = briefLines(mission, state);
  const after = state.phase === 'consequence' ? outcomeLines(mission, state, content) : [];
  const [stage, setStage] = useState<Stage>(() =>
    state.phase === 'consequence' ? { k: 'card' } : state.selection.length || brief.length === 0 ? { k: 'choose' } : { k: 'brief', i: 0 });
  const phase = useRef(state.phase);
  useEffect(() => { if (phase.current !== state.phase) { phase.current = state.phase; if (state.phase === 'consequence') setStage({ k: 'card' }); } }, [state.phase]);

  const { advisor, counterpart } = castOf(mission, state);
  const place = placeOf(mission.id);
  const index = content.missionOrder.indexOf(mission.id) + 1;
  const line: Line | undefined = stage.k === 'brief' ? brief[stage.i] : stage.k === 'after' ? after[stage.i] : undefined;
  const speaking = line?.who;
  const nextBrief = () => setStage(s => s.k === 'brief' && s.i + 1 < brief.length ? { k: 'brief', i: s.i + 1 } : { k: 'choose' });
  const nextAfter = () => setStage(s => s.k === 'after' && s.i + 1 < after.length ? { k: 'after', i: s.i + 1 } : s);
  const lastAfter = stage.k === 'after' && stage.i === after.length - 1;
  const inCall = family === 'call' && (stage.k === 'brief' || stage.k === 'choose');
  const inChat = family === 'chat' && (stage.k === 'brief' || stage.k === 'choose');

  /* When the stage changes inside the scene, keep keyboard and screen-reader focus with it. */
  const firstStage = useRef(true);
  useEffect(() => {
    if (firstStage.current) { firstStage.current = false; return; }
    const target = stage.k === 'card' ? document.getElementById('outcome-heading') : stage.k === 'choose' ? document.querySelector<HTMLElement>('main [data-choice]:not(:disabled)') : document.querySelector<HTMLElement>('main [data-action="primary"]');
    target?.focus({ preventScroll: true });
  }, [stage.k]);

  /* Play by keyboard: Space, Enter or → moves the conversation on; number keys pick an option.
     Only when nothing else has focus, so it never fights a button, a field or a drawer. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.altKey || e.ctrlKey || e.metaKey || document.querySelector('dialog[open]')) return;
      if (t && t !== document.body && !t.matches('h1, h2, main, section, [data-choice]')) return;
      if ((stage.k === 'brief' || stage.k === 'card' || stage.k === 'after') && [' ', 'Enter', 'ArrowRight'].includes(e.key)) {
        const next = document.querySelector<HTMLButtonElement>('main [data-action="primary"]');
        if (next && !next.disabled) { e.preventDefault(); next.click(); }
      } else if (stage.k === 'choose' && /^[1-9]$/.test(e.key)) {
        const pick = document.querySelectorAll<HTMLButtonElement>('main [data-choice]')[+e.key - 1];
        if (pick && !pick.disabled) { e.preventDefault(); pick.click(); pick.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage.k]);

  /* Who stands in the room. In a call or a thread the client is on the device, not in the room. */
  const room: { id: ReturnType<typeof castId>; name: string; side: 'left' | 'right' }[] = [];
  /* A thread with your colleague is the colleague: they are on the phone, not also in the room. */
  const threadWithAdvisor = inChat && !counterpart;
  if (advisor && !threadWithAdvisor) room.push({ id: castId(advisor.name), name: advisor.name, side: family === 'case' || inCall || inChat ? 'right' : 'left' });
  if (counterpart && !inCall && !inChat && stage.k !== 'after') room.push({ id: castId(counterpart.name), name: counterpart.name, side: family === 'case' ? 'left' : 'right' });
  const solo = room.length === 1;

  return <section className={'page scene2 fam-' + family + ' st-' + stage.k}>
    <Backdrop photo={place.photo} focus={stage.k === 'brief' ? 'room' : stage.k === 'card' ? 'deep' : 'soft'} />
    <div className="cast" aria-hidden="true">
      {room.map(p => <Cutout key={p.name} id={p.id}
        frame={{ x: p.side === 'left' ? (solo ? '33%' : '19%') : (solo && !inCall && !inChat ? '74%' : '82%'), y: 0.21, face: 0.16 }}
        className={'actor side-' + p.side + (speaking === p.name ? ' is-speaking' : speaking ? ' is-quiet' : '')} />)}
    </div>

    <header className="scene-title">
      <p className="scene-where"><span>{place.name}</span><span>{COPY.stage.decision} {index} {COPY.stage.of} {content.missionOrder.length}</span></p>
      <Heading className="scene-q">{mission.question}</Heading>
      <button className="chip-button" onClick={props.onFile}><Glyph name="file" />{COPY.audit}</button>
    </header>

    {inCall && counterpart && <CallFrame name={counterpart.name} role={counterpart.role} speaking={speaking === counterpart.name} />}
    {inChat && <div className="chat-stage"><Thread lines={brief} upTo={stage.k === 'brief' ? stage.i : brief.length - 1} title={counterpart?.name ?? advisor?.name ?? ''} subtitle={counterpart?.role ?? advisor?.role} /></div>}

    {stage.k === 'brief' && line && <DialogueBox className={inCall ? 'as-caption' : inChat ? 'as-chat' : ''} line={line} index={stage.i} count={brief.length} last={false} lastLabel={COPY.say.next} onNext={nextBrief} onSkip={() => setStage({ k: 'choose' })} />}

    {stage.k === 'choose' && <Choose {...props} family={family} />}
    {stage.k === 'card' && <OutcomeCard state={state} before={props.before} onNext={() => setStage(after.length ? { k: 'after', i: 0 } : { k: 'card' })} />}
    {stage.k === 'after' && line && <>
      <DialogueBox line={line} index={stage.i} count={after.length} last={lastAfter} lastLabel={COPY.next} onNext={lastAfter ? props.onNext : nextAfter} onSkip={() => setStage({ k: 'after', i: after.length - 1 })} skipLabel={COPY.say.skipAll} />
      {line.voice === 'lesson' && state.resolution!.newBadges.map(id => <p key={id} className="toast"><Glyph name="spark" /><span>{firstName(advisor?.name) ?? ''} {COPY.stage.noticed}: <b>{BADGE_META[id].label}</b> · {BADGE_META[id].note}</span></p>)}
    </>}
  </section>;
}

function CallFrame({ name, role, speaking }: { name: string; role: string; speaking: boolean }) {
  return <div className={'call-frame' + (speaking ? ' is-speaking' : '')}>
    <div className="call-video">
      <Cutout id={castId(name)} frame={{ x: '50%', y: 0.1, face: 0.3, close: true }} />
      <p className="call-lower"><span className="live">● {COPY.say.live}</span><strong>{name}</strong><small>{role}</small></p>
      <div className="call-self"><span aria-hidden="true">{COPY.say.you.slice(0, 1)}</span><small>{COPY.say.cameraOff}</small></div>
    </div>
  </div>;
}

/* ── Choosing ─────────────────────────────────────────────────────────────── */

function needs(condition: Condition | undefined) { return { all: condition?.all ?? [], any: condition?.any ?? [] }; }

function LockNote({ option }: { option: Option }) {
  const { all, any } = needs(option.requires);
  const flags = [...all, ...any];
  if (flags.length > 0 && flags.every(f => EARNED[f]?.liability)) return <p className="lock-note"><Glyph name="lock" /><span><b>{COPY.stage.lockedTitle}.</b> {COPY.stage.liabilityGate}</span></p>;
  const what = [...all.map(f => EARNED[f]?.as ?? 'an earlier commitment'), ...(any.length ? [COPY.say.oneOf + ' ' + any.map(f => EARNED[f]?.as ?? 'an earlier commitment').join(' ' + COPY.say.or + ' ')] : [])];
  return <p className="lock-note"><Glyph name="lock" /><span><b>{COPY.stage.lockedTitle}.</b> {COPY.stage.needs}: {what.join('; ')}.</span></p>;
}

function Weigh({ option }: { option: Option }) {
  if (!option.pros?.length && !option.cons?.length && !option.cost) return null;
  /* Always open: what an option gives and what it costs is the logic of the decision, not a footnote. */
  return <div className="weigh">
    <div className="weigh-body">
      {option.pros?.length ? <div><p className="weigh-head">{COPY.stage.offers}</p><ul className="pro">{option.pros.map(p => <li key={p}>{p}</li>)}</ul></div> : null}
      {option.cons?.length ? <div><p className="weigh-head">{COPY.stage.givesUp}</p><ul className="con">{option.cons.map(c => <li key={c}>{c}</li>)}</ul></div> : null}
    </div>
  </div>;
}

interface Item { id: string; title: string; line: string; spoken: boolean; option?: Option; enabled: boolean; tag?: string }

function itemsOf(mission: Mission, state: GameState): Item[] {
  const allowed = new Set(mission.kind === 'choice' ? availableOptions(mission, state).map(o => o.id) : []);
  const spoken = mission.presentation === 'dialogue' || mission.presentation === 'apply';
  if (mission.kind === 'choice') return mission.options.map(o => ({ id: o.id, title: o.title, line: spoken && o.say ? o.say : o.description, spoken: spoken && !!o.say, option: o, enabled: allowed.has(o.id) }));
  if (mission.kind === 'investigate') return mission.evidence.map(e => ({ id: e.id, title: e.label, line: e.question, spoken: false, enabled: true }));
  return mission.components.map(c => ({ id: c.id, title: c.title, line: c.description, spoken: false, enabled: true, tag: c.tag }));
}

/** A choosable thing. The button carries the short name; the rest describes it. */
function ChoiceItem({ it, n, on, multi, onToggle, className = '' }: { it: Item; n: number; on: boolean; multi: boolean; onToggle(): void; className?: string }) {
  return <li className={'pick ' + className + (on ? ' is-on' : '') + (!it.enabled ? ' is-locked' : '')} style={{ ['--i' as string]: n }}>
    <button className="pick-hit" data-choice={it.id} aria-pressed={on} disabled={!it.enabled} aria-describedby={'d-' + it.id} onClick={onToggle}>
      <span className={'pick-mark' + (multi ? ' multi' : '')} aria-hidden="true">{on ? '✓' : n + 1}</span>
      <span className="pick-title">{it.title}</span>
    </button>
    <div className="pick-body" id={'d-' + it.id}>
      <p className={'pick-line' + (it.spoken ? ' spoken' : '')}>{it.spoken ? '“' + it.line + '”' : it.line}</p>
      {it.tag && <p className="pick-tag">{it.tag}</p>}
      {it.option && (it.enabled ? <>{it.option.commits && <p className="pick-cost"><b>{COPY.stage.commits}:</b> {it.option.commits}</p>}<Weigh option={it.option} /></> : <LockNote option={it.option} />)}
    </div>
  </li>;
}

/** Your colleague, asked: their questions first, then the story behind them. Optional, and in their voice. */
function Ask({ mission, state }: { mission: Mission; state: GameState }) {
  /* Their steer first — it used to be a compulsory line before every choice, and read as a lecture. */
  const steer = resolveAdvisorLine(mission, state);
  const asks = [...(steer ? [steer] : []), ...(mission.consider ?? []), ...(mission.tip ? [mission.tip] : [])];
  const [n, setN] = useState(-1);
  if (!mission.advisor || !asks.length) return null;
  const who = firstName(mission.advisor.name);
  return <div className="ask">
    <button className="ask-button" onClick={() => setN(i => (i + 1) % asks.length)}><Portrait name={mission.advisor.name} className="sm" /><span>{n < 0 ? COPY.say.ask + ' ' + who : COPY.say.askAgain}</span></button>
    {n >= 0 && <p className="ask-bubble" key={n} aria-live="polite"><b>{who}</b>“{asks[n]}”</p>}
  </div>;
}

function Choose(props: Props & { family: Family }) {
  const { mission, state, content, family, onToggle } = props;
  const items = itemsOf(mission, state);
  const multi = mission.kind !== 'choice';
  const need = requiredSelectionCount(mission);
  const commitLabel = mission.kind === 'investigate' ? COPY.investigate : mission.kind === 'build' ? COPY.assemble : mission.presentation === 'dialogue' ? COPY.send : COPY.commit;
  const list = <ol className={'picks picks-' + family} aria-label={mission.question} style={{ ['--n' as string]: items.length }}>
    {items.map((it, i) => <ChoiceItem key={it.id} it={it} n={i} on={state.selection.includes(it.id)} multi={multi} onToggle={() => onToggle(it.id)} className={family === 'board' ? 'pin' : family === 'plan' ? 'magnet' : ''} />)}
  </ol>;
  const chosen = state.selection.map(id => items.find(it => it.id === id)?.title).filter(Boolean) as string[];
  return <div className={'choose choose-' + family}>
    <div className="choose-head">
      <p className="choose-kicker">{COPY.say.choose}{mission.prompt ? ' · ' + mission.prompt : ''}</p>
      <Ask mission={mission} state={state} />
    </div>
    <div className="choose-body">
      {family === 'board' ? <div className="corkboard">{list}</div>
        : family === 'plan' ? <div className="planwall"><ol className="slots" aria-hidden="true">{Array.from({ length: need }, (_, i) => <li key={i} className={chosen[i] ? 'is-filled' : ''}>{chosen[i] ?? '—'}</li>)}</ol>{list}</div>
          : family === 'case' ? <div className="case-grid"><Folder mission={mission} state={state} />{list}</div>
            : list}
    </div>
    <div className="commit-bar">
      <p role="status">{need === 1 ? COPY.stage.pickOne : COPY.stage.pickExactly + ' ' + (COPY.stage.numbers[need] ?? need)} · {state.selection.length} {COPY.stage.of} {need} {COPY.stage.selected}</p>
      <Action onClick={props.onCommit} disabled={!canCommit(state, content)}>{commitLabel}</Action>
    </div>
  </div>;
}

/** What you bring to an argument: the evidence the options draw on, from your record. */
function Folder({ mission, state }: { mission: Mission; state: GameState }) {
  if (mission.kind !== 'choice') return null;
  const flags = [...new Set(mission.options.flatMap(o => [...needs(o.requires).all, ...needs(o.requires).any]))].filter(f => EARNED[f]);
  return <aside className="folder" aria-label={COPY.say.onRecord}>
    <p className="folder-tab">{COPY.say.onRecord}</p>
    {flags.length === 0 ? <p>{COPY.stage.evidenceNone}</p> : <ul>{flags.map(f => {
      const has = state.flags.includes(f), liability = !!EARNED[f].liability;
      return <li key={f} className={liability ? 'is-neutral' : has ? 'is-held' : 'is-missing'}>
        <Glyph name={liability ? 'file' : has ? 'check' : 'lock'} /><span><strong>{EARNED[f].as}</strong><small>{has ? EARNED[f].where : liability ? COPY.stage.notInRecord : COPY.stage.missing}</small></span>
      </li>;
    })}</ul>}
  </aside>;
}

/* ── The moment it lands ──────────────────────────────────────────────────── */

function useCount(from: number, to: number, delay: number) {
  const [v, setV] = useState(from);
  useEffect(() => {
    const still = !!document.querySelector('.reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || from === to) { setV(to); return; }
    let raf = 0; const t0 = performance.now() + delay;
    const tick = (t: number) => { const k = Math.min(1, Math.max(0, (t - t0) / 900)); setV(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [from, to, delay]);
  return v;
}

function Gauge({ label, from, to, i }: { label: string; from: number; to: number; i: number }) {
  const v = useCount(from, to, 500 + i * 140);
  const d = to - from;
  return <li className={'gauge' + (d > 0 ? ' up' : d < 0 ? ' down' : '')} style={{ ['--i' as string]: i }}>
    <span className="gauge-label">{label}</span>
    <span className="gauge-bar" aria-hidden="true"><i style={{ width: v + '%' }} /></span>
    <span className="gauge-value">{v}<span className="sr-only"> {COPY.stage.of} 100</span></span>
    <span className="gauge-delta">{d > 0 ? '▲ +' + d : d < 0 ? '▼ −' + -d : COPY.say.noChange}</span>
  </li>;
}

/** Each measure that moved, said in plain words: what a rise or a fall means for the deal. */
function impactOf(before: Record<DimensionId, number>, after: Record<DimensionId, number>) {
  return RULES.filter(r => after[r.id] !== before[r.id]).map(r => {
    const up = after[r.id] > before[r.id];
    return { id: r.id, up, text: COPY.impact[r.id][up ? 'up' : 'down'] };
  });
}

function OutcomeCard({ state, before, onNext }: { state: GameState; before?: readonly string[]; onNext(): void }) {
  const r = state.resolution!;
  const added = before ? ledger(state).filter(e => !before.includes(e.label)) : [];
  return <div className="outcome-card" role="group" aria-labelledby="outcome-heading">
    <p className="outcome-chose">{COPY.say.youChose}: <b>{r.chosenLabel}</b></p>
    <h2 className="outcome-head" id="outcome-heading" tabIndex={-1}>{r.outcome.headline.split(' ').map((w, i) => <span key={i} style={{ ['--w' as string]: i }}>{w} </span>)}</h2>
    <div className="outcome-grid">
      <ul className="gauges" aria-label={COPY.position}>{RULES.map((rule, i) => <Gauge key={rule.id} i={i} label={rule.question} from={r.dimsBefore[rule.id]} to={r.dimsAfter[rule.id]} />)}</ul>
      <div className="outcome-side">
        {impactOf(r.dimsBefore, r.dimsAfter).length > 0 && <><p className="mini-head">{COPY.impact.title}</p>
          <ul className="impact">{impactOf(r.dimsBefore, r.dimsAfter).map((x, i) => <li key={x.id} className={x.up ? 'up' : 'down'} style={{ ['--i' as string]: i }}><b>{COPY.dimensions[x.id].short} {x.up ? '↑' : '↓'}</b> {x.text}</li>)}</ul></>}
        <p className="mini-head">{COPY.say.whatsDifferent}</p>
        <ul className="changed">{r.outcome.changed.map((x, i) => <li key={x} style={{ ['--i' as string]: i }}>{x}</li>)}</ul>
        {added.length > 0 && <><p className="mini-head">{COPY.say.addedToRecord}</p><ul className="added">{added.map((e, i) => <li key={e.label} style={{ ['--i' as string]: i }}>{e.label}</li>)}</ul></>}
      </div>
    </div>
    <div className="outcome-foot"><button className="primary" data-action="primary" data-line-next onClick={event => { if (event.detail < 2) onNext(); }}><span>{COPY.say.hearWhy}</span><span className="arrow" aria-hidden="true">→</span></button></div>
  </div>;
}
