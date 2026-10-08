import type { Content, GameState } from '../../engine/types';
import { COPY } from '../../content/interface';
import { EARNED } from '../../content/gates';
import { MILESTONE } from '../../content/presentation';
import { VIEWS } from '../../content/views';
import { handOf, madeAt, readAt } from '../cards';
import { promiseRules, settledOf, type PromiseStatus } from '../ledger';
import { DIMENSION_ORDER } from '../parts';

const C = VIEWS.chart;

/**
 * The deal on one chart (STRATEGY.md §4): Win, Worth and Deliver after every decision of the run,
 * from the engine's own `dimsBefore` and `dimsAfter`, and under it each promise card drawn from the
 * decision that made it to where it came due. Settled promises end on their stamp; unsettled ones
 * end at the first later decision that read them.
 *
 * Lines are told apart by dash as well as colour, and the figures are repeated in a table for
 * screen readers (E6). Labels are live text, never SVG text, so they never shrink below 14px.
 */
export function DealChart({ state, content }: { state: GameState; content: Content }) {
  const h = state.history;
  if (!h.length) return null;
  const n = h.length, points = [h[0].dimsBefore, ...h.map(e => e.dimsAfter)];
  const at = (i: number) => (i / n) * 100;
  const acts = h.reduce<{ chapter: number; from: number; to: number }[]>((a, e, i) => {
    const last = a.at(-1);
    if (last?.chapter === e.chapter) last.to = i + 1; else a.push({ chapter: e.chapter, from: i, to: i + 1 });
    return a;
  }, []);
  const settled = settledOf(state), rules = promiseRules(content);
  const promises: { flag: string; title: string; due?: string; status?: PromiseStatus }[] = settled
    ? settled.map(s => ({ ...s, title: EARNED[s.flag]?.as ?? s.flag }))
    : handOf(state, content).filter(c => c.pile === 'promise' && (!rules.length || rules.some(r => r.flag === c.flag))).map(c => ({ flag: c.flag, title: c.title, due: rules.find(r => r.flag === c.flag)?.due }));
  const lanes = promises.map(p => {
    const made = madeAt(state, content, p.flag), read = settled ? -1 : readAt(state, content, p.flag, made);
    return { ...p, made, read, x1: at(made + 1), x2: settled ? 100 : read >= 0 ? at(read + 0.5) : 100 };
  });
  const num = (id: string) => content.missionOrder.indexOf(id) + 1;
  return <figure className="deal-chart">
    <div className="dc-grid">
      <ol className="dc-y" aria-hidden="true"><li>100</li><li>50</li><li>0</li></ol>
      <div className="dc-plot">
        {acts.map(a => <span key={a.chapter} className="dc-act" data-chapter={a.chapter} style={{ left: at(a.from) + '%', width: at(a.to - a.from) + '%' }}>{COPY.stage.act} {a.chapter}</span>)}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {[25, 50, 75].map(y => <line key={y} x1="0" x2="100" y1={y} y2={y} className="dc-rule" vectorEffect="non-scaling-stroke" />)}
          {DIMENSION_ORDER.map(d => <polyline key={d} className={'dc-line q-' + d} vectorEffect="non-scaling-stroke" points={points.map((p, i) => at(i) + ',' + (100 - p[d])).join(' ')} />)}
        </svg>
        {DIMENSION_ORDER.map(d => points.map((p, i) => <i key={d + i} className={'dc-dot q-' + d} style={{ left: at(i) + '%', top: 100 - p[d] + '%' }} />))}
      </div>
      <span />
      <ol className="dc-x" aria-hidden="true">{h.map((e, i) => <li key={e.missionId} style={{ left: at(i + 0.5) + '%' }}>{num(e.missionId)}</li>)}</ol>
    </div>
    <ul className="dc-legend">{DIMENSION_ORDER.map(d => {
      const a = points[0][d], b = points[n][d];
      return <li key={d} className={'q-' + d}><svg viewBox="0 0 28 8" aria-hidden="true"><line x1="0" x2="28" y1="4" y2="4" className={'dc-line q-' + d} /></svg>{COPY.dimensions[d].short} <b>{a} → {b}</b> {b !== a && <em>{b > a ? '+' : '−'}{Math.abs(b - a)}</em>}</li>;
    })}</ul>
    {lanes.length > 0 && <div className="dc-promises">
      <p className="mini-head">{C.promises}</p>
      <ol>{lanes.map(l => <li key={l.flag} className="dc-lane">
        <p><strong>{l.title}</strong><small>{l.made >= 0 ? C.made + ' ' + num(h[l.made].missionId) : MILESTONE.setup}{l.due ? ' · ' + l.due : ''}{l.read >= 0 ? ' · ' + C.due + ': ' + COPY.stage.decision + ' ' + num(h[l.read].missionId) : ''}</small></p>
        <span className="dc-track" aria-hidden="true">
          <i className={'dc-span' + (l.status ? ' is-' + l.status : l.read < 0 ? ' is-open' : '')} style={{ left: l.x1 + '%', width: Math.max(0, l.x2 - l.x1) + '%' }} />
          <i className="dc-made" style={{ left: l.x1 + '%' }} />
          {(l.status || l.read >= 0) && <b className={'dc-due' + (l.status ? ' is-' + l.status : '')} style={{ left: l.x2 + '%' }}>{l.status ? VIEWS.calendar.status[l.status] : C.due}</b>}
        </span>
        {l.status && <span className="sr-only">{VIEWS.calendar.status[l.status]}</span>}
      </li>)}</ol>
    </div>}
    <table className="sr-only">
      <caption>{C.table}</caption>
      <thead><tr><th scope="col">{C.decision}</th>{DIMENSION_ORDER.map(d => <th key={d} scope="col">{COPY.dimensions[d].short}</th>)}</tr></thead>
      <tbody>{points.map((p, i) => <tr key={i}><th scope="row">{i ? num(h[i - 1].missionId) + ' · ' + (MILESTONE[h[i - 1].missionId] ?? h[i - 1].missionTitle) : C.start}</th>{DIMENSION_ORDER.map(d => <td key={d}>{p[d]}</td>)}</tr>)}</tbody>
    </table>
  </figure>;
}
