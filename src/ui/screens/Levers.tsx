import { useEffect, useRef, type ReactNode } from 'react';
import type { Condition, Content, GameState, LeverMission, LeverOption } from '../../engine/types';
import { canCommit, leverOptionOpen, leverSettings, leverTouches } from '../../engine/engine';
import { COPY } from '../../content/interface';
import { EARNED } from '../../content/gates';
import { VIEWS, leverMediumOf, type LeverMedium } from '../../content/views';
import { isCard, pileOf, sourceOf } from '../cards';
import { promiseRules } from '../ledger';
import { Action, DIMENSION_ORDER, Glyph } from '../parts';

const L = VIEWS.levers;
/* Act 1 and 2 reuse the cork board and the planning wall the older decisions are pinned to. */
const MEDIUM_FRAME: Partial<Record<LeverMedium, string>> = { research: ' corkboard', staffing: ' planwall' };

/**
 * Why an option is closed, naming the card and the stop that gives it. A locked option is the
 * clearest lesson in cause and effect the game has, as long as the player can see the cause.
 * A `none` condition is closed by a card you hold, so it names that card instead.
 */
export function LockNote({ requires, state, content }: { requires?: Condition; state: GameState; content: Content }) {
  const card = (f: string) => { const from = sourceOf(content, f); return (EARNED[f]?.as ?? L.earlier) + (from ? ' (' + COPY.stage.from + ' ' + from + ')' : ''); };
  const all = requires?.all ?? [], any = requires?.any ?? [], held = (requires?.none ?? []).filter(f => state.flags.includes(f));
  const flags = [...all, ...any];
  const why = held.length ? L.closedBy + ': ' + held.map(card).join('; ') + '.'
    : flags.length && flags.every(f => EARNED[f]?.liability) ? COPY.stage.liabilityGate
      : flags.length ? COPY.stage.needs + ': ' + [...all.map(card), ...(any.length ? [COPY.say.oneOf + ' ' + any.map(card).join(' ' + COPY.say.or + ' ')] : [])].join('; ') + '.' : '';
  return <p className="lock-note"><Glyph name="lock" /><span><b>{COPY.stage.lockedTitle}.</b> {why}</span></p>;
}

/** The Reigns dot: which bars a setting moves, and which way, never by how much (D-084). */
export function Touches({ option }: { option: LeverOption }) {
  const t = leverTouches(option);
  const moved = DIMENSION_ORDER.filter(d => t[d]);
  if (!moved.length) return <p className="touch is-none">{L.still}</p>;
  return <ul className="touch" aria-label={L.moves}>{moved.map(d => {
    const up = t[d]! > 0;
    return <li key={d} className={'q-' + d + (up ? ' up' : ' down')}><i aria-hidden="true" /><span aria-hidden="true">{up ? '▲' : '▼'}</span>{COPY.dimensions[d].short}<span className="sr-only"> {up ? L.up : L.down}</span></li>;
  })}</ul>;
}

/**
 * A card as a chip: what a setting would put in your hand. A card with a ledger rule is a promise
 * and says so (its due date is on the calendar strip and the trail, and most promise titles carry
 * it already); any other liability, such as a discount, is a cost carried forward.
 */
export function Chip({ flag, content }: { flag: string; content: Content }) {
  const owed = pileOf(flag) === 'promise';
  return <li className={'chip is-' + pileOf(flag)}><b>{!owed ? L.adds : promiseRules(content).some(r => r.flag === flag) ? L.owes : L.costs}</b> {EARNED[flag].as}</li>;
}

/**
 * A lever decision as a control panel (LEVERS.md). Each lever is a row of options side by side;
 * each option shows what we would do, the bars it moves, the cards it adds and, if it is closed,
 * the card it needs. The commit bar reads the settings back in one line.
 *
 * The panel takes its act's medium (`LEVER_MEDIUM`): a research board, a staffing board, a draft
 * contract, a delivery calendar. Only the stylesheet and two labels differ; the structure, the
 * keyboard and the names a screen reader hears are the same in all four.
 *
 * Keyboard: Tab reaches each lever once; the arrow keys change its setting; a number key jumps to
 * that lever; Enter commits once every lever is set.
 */
export function LeverPanel({ mission, state, content, onToggle, onCommit, ask }: {
  mission: LeverMission; state: GameState; content: Content; onToggle(id: string): void; onCommit(): void; ask: ReactNode;
}) {
  const medium = leverMediumOf(mission.id, mission.chapter);
  const settings = leverSettings(mission, state.selection);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const box = panel.current, t = e.target as HTMLElement | null;
      if (!box || e.altKey || e.ctrlKey || e.metaKey || document.querySelector('dialog[open]')) return;
      const inside = !!t && box.contains(t);
      if (t && t !== document.body && !inside && !t.matches('h1, h2, main, section')) return;
      if (/^[1-9]$/.test(e.key)) {
        const lever = box.querySelectorAll('[data-lever]')[+e.key - 1];
        const to = lever?.querySelector<HTMLButtonElement>('[aria-pressed="true"]') ?? lever?.querySelector<HTMLButtonElement>('[data-choice]:not(:disabled)');
        if (to) { e.preventDefault(); to.focus(); }
      } else if (inside && t!.matches('[data-choice]') && e.key.startsWith('Arrow')) {
        const open = [...t!.closest('[data-lever]')!.querySelectorAll<HTMLButtonElement>('[data-choice]:not(:disabled)')];
        const to = open[(open.indexOf(t as HTMLButtonElement) + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + open.length) % open.length];
        e.preventDefault(); to.focus(); to.click();
      } else if (e.key === 'Enter') {
        const go = document.querySelector<HTMLButtonElement>('main [data-action="primary"]');
        if (go && !go.disabled) { e.preventDefault(); go.click(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* On the calendar, the promises you already hold are pinned above the levers with their dates. */
  const dated = medium === 'calendar' ? promiseRules(content).filter(r => state.flags.includes(r.flag) && EARNED[r.flag]) : [];
  /* The panel is the whole move: its header carries the instruction and your colleague, so the
     levers get the height (a three-lever decision must fit 1440×900 without scrolling). */
  return <div className="choose choose-levers">
    <div className="choose-body">
      <div ref={panel} className={'levers m-' + medium + (MEDIUM_FRAME[medium] ?? '')}>
        <div className="levers-head">
          <p className="levers-medium">{L.medium[medium]}</p>
          <p className="levers-kicker">{COPY.say.choose} · {mission.prompt ?? L.kicker}</p>
          {ask}
        </div>
        {dated.length > 0 && <ul className="levers-held" aria-label={L.held}>{dated.map(r => <li key={r.flag}><b>{r.due}</b> {EARNED[r.flag].as}</li>)}</ul>}
        {mission.levers.map((lever, li) => {
          const set = lever.options.find(o => state.selection.includes(o.id));
          const first = lever.options.find(o => leverOptionOpen(o, state));
          return <div key={lever.id} className="lever" role="group" aria-labelledby={'lv-' + lever.id} data-lever={li + 1}>
            <p className="lever-label" id={'lv-' + lever.id}><span className="lever-n">{medium === 'contract' ? L.clause : L.lever} {li + 1}</span>{lever.label}</p>
            <ol className="lever-options" style={{ ['--n' as string]: lever.options.length }}>
              {lever.options.map(o => {
                const open = leverOptionOpen(o, state), on = set === o;
                return <li key={o.id} className={'lever-opt' + (on ? ' is-on' : '') + (open ? '' : ' is-locked')}>
                  <button className="lever-hit" data-choice={o.id} aria-pressed={on} disabled={!open} tabIndex={(set ?? first) === o ? 0 : -1} aria-describedby={'ld-' + o.id + ' lf-' + o.id} onClick={() => onToggle(o.id)}>
                    <span className="lever-mark" aria-hidden="true">{on ? '✓' : ''}</span><span>{o.label}</span>
                  </button>
                  <p className="lever-detail" id={'ld-' + o.id}>{o.detail}</p>
                  <div className="lever-facts" id={'lf-' + o.id}>
                    <Touches option={o} />
                    {(o.flags ?? []).some(isCard) && <ul className="adds">{(o.flags ?? []).filter(isCard).map(f => <Chip key={f} flag={f} content={content} />)}</ul>}
                    {!open && <LockNote requires={o.requires} state={state} content={content} />}
                  </div>
                </li>;
              })}
            </ol>
          </div>;
        })}
      </div>
    </div>
    <div className="commit-bar">
      <p role="status">{mission.levers.map((lever, i) => {
        const s = settings.find(o => lever.options.includes(o));
        return <span key={lever.id}>{i > 0 && ' · '}{s ? <b>{s.label}</b> : <span className="is-unset">{lever.label}: {L.notSet}</span>}</span>;
      })}<span className="sr-only">. {L.keys}</span></p>
      <Action onClick={onCommit} disabled={!canCommit(state, content)}>{COPY.commit}</Action>
    </div>
  </div>;
}
