import type { Content, GameState } from '../../engine/types';
import { EARNED } from '../../content/gates';
import { PEOPLE, SCALES, SYSTEM_VIEW, VIEWS } from '../../content/views';
import { handOf, isCard } from '../cards';
import { promiseRules, settledOf, type PromiseStatus } from '../ledger';
import { Portrait } from '../parts';

/**
 * The act's own picture of the system (STRATEGY.md §4), beside your hand on the trail. Each act
 * gets the view that pictures its idea: Orion's people while you are learning who matters, the
 * scales while you trade, the promise calendar once promises start to fall due.
 *
 * Presentation only. Each view reads flags through the maps in `content/views.ts` and the
 * engine's settled ledger; none of them decides anything.
 */
export function ActView({ state, content, chapter }: { state: GameState; content: Content; chapter: number }) {
  const kind = SYSTEM_VIEW[chapter] ?? 'people';
  return <section className={'trail-view view-' + kind} aria-labelledby="view-title">
    <h2 id="view-title" className="mini-head">{VIEWS[kind].title}</h2>
    {kind === 'people' ? <PeopleMap state={state} /> : kind === 'scales' ? <Scales state={state} /> : <PromiseCalendar state={state} content={content} />}
  </section>;
}

const title = (flag?: string) => (flag && EARNED[flag]?.as) || '';

/** Orion's people: greyed until you find them, then green or red, with the card that did it. */
export function PeopleMap({ state }: { state: GameState }) {
  const held = (flags: readonly string[]) => flags.find(f => state.flags.includes(f));
  const P = VIEWS.people;
  return <ul className="people">{PEOPLE.map(p => {
    const found = p.known.length ? held(p.known) : 'start';
    const against = held(p.against), onside = held(p.onside);
    const status = !found ? 'unknown' : against ? 'against' : onside ? 'onside' : 'known';
    const cause = title(against ?? onside ?? found);
    return <li key={p.id} className={'person is-' + status}>
      <span className="person-face"><Portrait name={p.name} /><i aria-hidden="true">{status === 'onside' ? '✓' : status === 'against' ? '!' : status === 'unknown' ? '?' : ''}</i></span>
      <span className="person-part">{p.part}</span>
      {found ? <><strong>{p.name}</strong><small>{p.role}</small></> : <strong>{P.unknown}</strong>}
      <span className="person-status">{P[status]}</span>
      {found && cause && <small className="person-why">{P.because}: {cause}</small>}
    </li>;
  })}</ul>;
}

/** What we gave against what we got back, tipping towards whichever side holds more cards. */
export function Scales({ state }: { state: GameState }) {
  const S = VIEWS.scales;
  const side = (prefixes: readonly string[]) => state.flags.filter(f => isCard(f) && prefixes.some(p => f.startsWith(p)));
  const gave = side(SCALES.gave), got = side(SCALES.got);
  const tilt = Math.max(-2, Math.min(2, gave.length - got.length));
  const pan = (label: string, cards: string[], which: string) => <div className={'pan pan-' + which}>
    <p>{label} <span>{cards.length}</span></p>
    {cards.length ? <ul>{cards.map(f => <li key={f}>{title(f)}</li>)}</ul> : <p className="pan-empty">{S.none}</p>}
  </div>;
  return <div className="scales" style={{ ['--tilt' as string]: tilt }}>
    <div className="scales-rig" aria-hidden="true"><i className="beam" /><i className="post" /></div>
    <div className="scales-pans">{pan(S.gave, gave, 'gave')}{pan(S.got, got, 'got')}</div>
    <p className="scales-read" role="status">{!gave.length && !got.length ? S.empty : tilt > 0 ? S.moreGiven : tilt < 0 ? S.moreGot : S.even}</p>
  </div>;
}

interface Pinned { flag: string; title: string; due: string; order: number; status?: PromiseStatus; line?: string }

/**
 * Every promise you hold, pinned to the month it falls due (`content.promises`). Once the engine
 * has settled the ledger (`state.settled`) each card is stamped kept, late, broken or traded
 * away, with its line. `play` is the act break's version: larger, and stamped one card at a time.
 * Content without a ledger falls back to the hand's own "comes due at" stop.
 */
export function PromiseCalendar({ state, content, play = false }: { state: GameState; content: Content; play?: boolean }) {
  const C = VIEWS.calendar;
  const rules = promiseRules(content), settled = settledOf(state);
  const pins: Pinned[] = settled ? settled.map(s => ({ ...s, title: title(s.flag) || s.flag, order: s.dueMonth }))
    : rules.length ? rules.filter(r => state.flags.includes(r.flag)).map(r => ({ flag: r.flag, title: title(r.flag) || r.flag, due: r.due, order: r.dueMonth })).sort((a, b) => a.order - b.order)
      : handOf(state, content).filter(c => c.pile === 'promise').map((c, i) => ({ flag: c.flag, title: c.title, due: c.next?.at ?? C.undated, order: i }));
  if (!pins.length) return <p className="cal-empty">{C.empty}</p>;
  const months = [...new Set(pins.map(p => p.due))];
  let n = 0;
  return <ol className={'calendar' + (play ? ' is-play' : '')}>{months.map(m => <li key={m} className="cal-month">
    <p className="cal-head">{m}</p>
    <ul>{pins.filter(p => p.due === m).map(p => <li key={p.flag} className={'cal-pin' + (p.status ? ' is-' + p.status : '')} style={{ ['--i' as string]: n++ }}>
      <strong>{p.title}</strong>
      {p.status ? <><span className="stamp">{C.status[p.status]}</span>{p.line && <small>{p.line}</small>}</> : settled ? null : <span className="cal-open">{C.open}</span>}
    </li>)}</ul>
  </li>)}</ol>;
}
