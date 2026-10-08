import type { Content, GameState } from '../../engine/types';
import { ledger, ledgerRules, outcomeBecause } from '../../engine/engine';
import { COPY } from '../../content/interface';
import { LEDGER_RULE, MISSION_RULE, RULES } from '../../content/presentation';
import { Glyph } from '../parts';

/** Labels of ledger positions that rest on a given flag — so a cause can point at its card. */
function cardsResting(content: Content, flag: string): string[] {
  return ledgerRules(content).filter(r => r.when.all?.includes(flag)).map(r => r.label);
}

const SHOWN = 4;

/**
 * Where you stand: the player's record, in the engine's own plain-language positions, filed
 * under the three questions every pursuit has to answer. Always in the same place on screen,
 * so the line of thought survives every change of scene (D-080).
 *
 * Values appear only when there is a result to explain — on a consequence, at an act break,
 * at the end — never over a decision, where they would be a scoreboard (G9).
 *
 * `before` is the record as it stood when the player committed. With it the board can mark
 * what this decision added; without it (a reload mid-consequence) it simply shows the record.
 */
export function Board({ state, content, before, values = false, onMore }: { state: GameState; content: Content; before?: readonly string[]; values?: boolean; onMore?(): void }) {
  const entries = ledger(state, content);
  const atResult = state.phase === 'consequence' && !!state.resolution;
  const added = new Set(atResult && before ? entries.map(e => e.label).filter(l => !before.includes(l)) : []);
  const causes = new Set(atResult ? outcomeBecause(state, content).held.flatMap(f => cardsResting(content, f)) : []);
  const active = atResult ? MISSION_RULE[state.nodeId] : undefined;
  const showValues = values || atResult;
  /* Focusable because it can scroll on its own: keyboard users must be able to reach every card. */
  return <aside className="board" aria-labelledby="board-heading" tabIndex={0}>
    <header><h2 id="board-heading">{COPY.stage.board}</h2><p>{COPY.stage.boardNote}</p></header>
    {RULES.map(rule => {
      const mine = entries.filter(e => LEDGER_RULE[e.label] === rule.id);
      /* New and causal cards first, then the rest in the ledger's own order. */
      const ordered = [...mine.filter(e => added.has(e.label) || causes.has(e.label)), ...mine.filter(e => !added.has(e.label) && !causes.has(e.label))];
      const shown = ordered.slice(0, SHOWN);
      const delta = atResult ? state.resolution!.deltas[rule.id] : 0;
      return <section key={rule.id} className={'rule' + (active === rule.id ? ' is-active' : '')} aria-label={rule.question}>
        <div className="rule-head">
          <h3><Glyph name={rule.id} />{rule.question}</h3>
          {showValues && <p className="rule-value"><span className="sr-only">{COPY.dimensions[rule.id].label} </span>{state.dims[rule.id]}{delta ? <em className={delta > 0 ? 'up' : 'down'}>{delta > 0 ? '▲ +' + delta : '▼ −' + -delta}</em> : null}</p>}
        </div>
        {shown.length === 0 ? <p className="rule-empty">{COPY.stage.boardEmpty}</p> : <ul className="cards">
          {shown.map(e => {
            const isNew = added.has(e.label), isCause = causes.has(e.label);
            return <li key={e.label} className={'card' + (isNew ? ' is-new' : '') + (isCause ? ' is-cause' : '')} title={e.detail}>
              {(isNew || isCause) && <span className="tag">{isCause ? COPY.stage.tagWhy : COPY.stage.tagNew}</span>}
              {/* Detail only where it is news: a card the player has already read is a label they can recall. */}
              <strong>{e.label}</strong>{(isNew || isCause || !atResult && shown.length <= 2) && <span>{e.detail}</span>}
            </li>;
          })}
        </ul>}
        {ordered.length > SHOWN && (onMore ? <button className="rule-more" onClick={onMore}>+{ordered.length - SHOWN} {COPY.stage.more}</button> : <p className="rule-more is-text">+{ordered.length - SHOWN} {COPY.stage.more}</p>)}
      </section>;
    })}
  </aside>;
}
