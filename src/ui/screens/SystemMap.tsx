import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Content, GameState } from '../../engine/types';
import { COPY } from '../../content/interface';
import { MILESTONE } from '../../content/presentation';
import { VIEWS } from '../../content/views';
import { actLinks, type Card, type Link } from '../cards';

const M = VIEWS.map, T = COPY.frames.trail;
const nextText = (c: Card) => c.next ? (c.next.kind === 'opens' ? T.opens : c.next.kind === 'pays' ? T.pays : T.due) + ': ' + c.next.at : M.notAgain;

/**
 * The cause-and-effect map at an act break (STRATEGY.md §4, the Beer Game debrief): the act as a
 * system, in three columns. Earlier: cards from before that this act read. This act: what you
 * decided. Later: where this act's cards matter next. Curves join each card to the decision that
 * read it or made it.
 *
 * Before the Later column is shown the player guesses which choice will come back (principle 8,
 * guess then see). The guess is never marked; it only makes the reveal something to check.
 *
 * Every connection is also said in words on its card ("Used in", "From"), so nothing depends on
 * the lines, which are hidden where the columns stack. Reads `actLinks` and decides nothing.
 */
export function SystemMap({ state, content, chapter }: { state: GameState; content: Content; chapter: number }) {
  const links = useMemo(() => actLinks(state, content, chapter), [state, content, chapter]);
  const [guess, setGuess] = useState<string | null | undefined>(undefined);
  const shown = guess !== undefined;
  const name = (id?: string) => (id && (MILESTONE[id] ?? links.decisions.find(d => d.id === id)?.name)) || '';
  const box = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<{ d: string; out: boolean }[]>([]);
  /* Cards read again later get a card and a line; the rest are listed once, so the column stays short. */
  const onward = useMemo(() => links.outgoing.filter(l => l.card.next), [links]);
  const done = links.outgoing.filter(l => !l.card.next);

  /* Curves are measured from the cards themselves, so they follow wrapping text and any width. */
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const draw = () => {
      const o = el.getBoundingClientRect();
      const at = (sel: string) => el.querySelector(sel)?.getBoundingClientRect();
      /* Where several lines meet one decision they fan out down its edge rather than leave as one rope. */
      const fan = (r: DOMRect, k: number, n: number) => r.top - o.top + r.height * (n < 2 ? 0.5 : 0.25 + 0.5 * k / (n - 1));
      const curve = (a: DOMRect | undefined, b: DOMRect | undefined, out: boolean, k: number, n: number) => {
        if (!a || !b || b.left <= a.right) return [];
        const x1 = a.right - o.left, x2 = b.left - o.left, c = (x2 - x1) / 2;
        const y1 = out ? fan(a, k, n) : a.top + a.height / 2 - o.top, y2 = out ? b.top + b.height / 2 - o.top : fan(b, k, n);
        return [{ d: `M${x1} ${y1}C${x1 + c} ${y1} ${x2 - c} ${y2} ${x2} ${y2}`, out }];
      };
      const nth = (list: Link[], key: 'from' | 'to', l: Link) => { const same = list.filter(x => x[key] === l[key]); return [same.indexOf(l), same.length] as const; };
      setPaths([
        ...links.incoming.flatMap(l => curve(at(`[data-in="${l.card.flag}"]`), at(`[data-dec="${l.to}"]`), false, ...nth(links.incoming, 'to', l))),
        ...(shown ? onward.flatMap(l => curve(at(`[data-dec="${l.from}"]`), at(`[data-out="${l.card.flag}"]`), true, ...nth(onward, 'from', l))) : []),
      ]);
    };
    draw();
    const watch = new ResizeObserver(draw); watch.observe(el);
    return () => watch.disconnect();
  }, [links, onward, shown]);

  return <div className={'sysmap sheet' + (links.incoming.length ? '' : ' no-earlier')} ref={box}>
    <svg className="sysmap-lines" aria-hidden="true">{paths.map((p, i) => <path key={i} d={p.d} className={p.out ? 'is-out' : 'is-in'} />)}</svg>
    <section className="sysmap-col" aria-labelledby="sm-earlier">
      <h2 id="sm-earlier">{M.earlier}<small>{M.earlierNote}</small></h2>
      {links.incoming.length ? <ul>{links.incoming.map(l => <li key={l.card.flag} className={'sm-card is-' + l.card.pile} data-in={l.card.flag}>
        <strong>{l.card.title}</strong>
        {/* One line where there is room; it wraps where there is not. */}
        <small>{l.from && <>{M.from}: {l.from} · </>}{M.usedIn}: {name(l.to)}</small>
      </li>)}</ul> : <p className="sm-empty">{M.noneEarlier}</p>}
    </section>
    <section className="sysmap-col is-now" aria-labelledby="sm-now">
      <h2 id="sm-now">{M.now}<small>{M.nowNote}</small></h2>
      <ol>{links.decisions.map(d => <li key={d.id} className={'sm-decision' + (guess === d.id ? ' is-guess' : '')} data-dec={d.id}>
        <span className="sm-n">{COPY.stage.decision} {content.missionOrder.indexOf(d.id) + 1}{guess === d.id && <em>{M.yourGuess}</em>}</span>
        <strong>{d.name}</strong>
        <small>{M.chose}: <b>{d.chose}</b></small>
      </li>)}</ol>
    </section>
    <section className="sysmap-col" aria-labelledby="sm-later" aria-live="polite">
      <h2 id="sm-later">{M.later}<small>{M.laterNote}</small></h2>
      {!shown ? <div className="sm-guess">
        <p className="sm-guess-q">{M.guess}</p>
        <div className="sm-guess-options">{links.decisions.map(d => <button key={d.id} className="secondary" onClick={() => setGuess(d.id)}>{d.name}</button>)}</div>
        <p className="sm-guess-note">{M.guessNote}</p>
        <button className="text-button" onClick={() => setGuess(null)}>{M.skip}</button>
      </div> : <>
        {guess && <p className="sm-guessed">{M.youGuessed}: <b>{name(guess)}</b></p>}
        {onward.length ? <ul>{onward.map(l => <li key={l.card.flag} className={'sm-card is-' + l.card.pile} data-out={l.card.flag}>
          <strong>{l.card.title}</strong>
          <small>{nextText(l.card)}</small>
          <small>{M.from}: {name(l.from)}</small>
        </li>)}</ul> : <p className="sm-empty">{M.noneLater}</p>}
        {done.length > 0 && <p className="sm-done"><b>{M.notAgain}:</b> {done.map(l => l.card.title).join(' · ')}</p>}
      </>}
    </section>
  </div>;
}
