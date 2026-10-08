import type { Content, GameNode, GameState, Mission } from '../../engine/types';
import type { ChapterNumber } from '../../content/assets';
import { COPY } from '../../content/interface';
import { ACT_QUESTION, CHAPTER_PRESENTATION, MILESTONE, MYSTERY, RULES, placeOf } from '../../content/presentation';
import { CHARACTERS } from '../../content/characters';
import { Action, Backdrop, Heading, Portrait } from '../parts';
import { flagsSetBy, handOf, stageNameOf, type Card } from '../cards';
import { CHECKS } from '../../content/checks';
import { QuickCheck } from './QuickCheck';
import { ActView } from './Views';

/**
 * The trail (D-083): home base between decisions.
 *
 * Every stop on the journey has a name, and the map shows them all at once: the five stages of
 * a deal in their own colours, the stops you have passed (ticked), where you are, and what lies
 * ahead. Below it, the next stop: who is with you there and what you decide. Beside that, the
 * act's own picture of the system (D-090), and your hand: what you have earned and what you owe,
 * each card saying where it next matters.
 *
 * Laid out like a board-game track, two rows snaking through the stages, because a player
 * who can see the whole road can tell how far they have come and why the next step matters.
 */
type Status = 'done' | 'here' | 'ahead' | 'missed';
interface Stop { id: string; chapter: number; event: boolean; status: Status }

/**
 * The board's rows, from however many acts the content has. Ten stops or fewer fit one row. More
 * than that snake back on a second row, split between acts so the first row holds the first half
 * of the stops (an act never breaks across the turn).
 */
function rowsOf(stops: Stop[]): Stop[][] {
  if (stops.length <= 10) return [stops];
  const acts = [...new Set(stops.map(s => s.chapter))];
  let count = 0, cut = acts.length - 1;
  for (let i = 0; i < acts.length - 1; i++) {
    count += stops.filter(s => s.chapter === acts[i]).length;
    if (count >= stops.length / 2) { cut = i + 1; break; }
  }
  const first = new Set(acts.slice(0, cut));
  return [stops.filter(s => first.has(s.chapter)), stops.filter(s => !first.has(s.chapter))];
}

function stopsOf(state: GameState, content: Content): Stop[] {
  const ended = state.phase === 'ending';
  /* Only acts and stops this content has: the presentation table may still list an act it dropped. */
  const all = CHAPTER_PRESENTATION.filter(p => content.chapters.some(c => c.number === p.chapter)).flatMap(p => p.route.filter(id => MILESTONE[id] && content.nodes[id]).map(id => ({ id, chapter: p.chapter, event: content.nodes[id]?.kind === 'interlude' })));
  const at = all.findIndex(s => s.id === state.nodeId);
  const firstOpen = all.findIndex(s => !s.event && !state.completed.includes(s.id));
  const here = ended ? -1 : at >= 0 ? at : firstOpen;
  const lastDone = all.reduce((n, s, i) => state.completed.includes(s.id) ? i : n, -1);
  return all.map((s, i) => ({ ...s, status: here === i ? 'here' : (s.event ? i < (here < 0 ? lastDone + 1 : here) : state.completed.includes(s.id)) ? 'done' : ended ? 'missed' : 'ahead' }));
}

export function Journey({ state, content, node, currentChapter, onPlay, onReview }: {
  state: GameState; content: Content; node: GameNode; currentChapter: number; onPlay(): void; onReview(chapter: number): void;
}) {
  const T = COPY.frames.trail;
  const ended = state.phase === 'ending';
  const stops = stopsOf(state, content);
  const here = stops.find(s => s.status === 'here');
  const hereIndex = here ? stops.indexOf(here) : -1;
  const chapter = here?.chapter ?? currentChapter;
  const guide = CHARACTERS[CHAPTER_PRESENTATION[chapter - 1].advisor];
  const nextNode = here ? content.nodes[here.id] : undefined;
  const teaser = nextNode?.kind === 'interlude' ? nextNode.prompt : (nextNode as Mission | undefined)?.objective;
  const last = state.history.at(-1);
  /* "Just happened" only when the decision you just made is the stop before this one. */
  const previous = hereIndex > 0 ? stops.slice(0, hereIndex).reverse().find(s => !s.event) : undefined;
  const justHappened = last && previous && last.missionId === previous.id ? last : undefined;
  const newStage = !!justHappened && here && previous && previous.chapter !== here.chapter;
  const hand = handOf(state, content);
  const have = hand.filter(c => c.pile === 'strength'), owe = hand.filter(c => c.pile === 'promise');
  const fresh = new Set(justHappened ? flagsSetBy(content, justHappened.missionId, justHappened.outcomeId) : []);
  const rows = rowsOf(stops);
  const solved = MYSTERY.clues.some(f => state.flags.includes(f));

  return <section className="page trail" data-chapter={chapter}>
    <Backdrop photo={placeOf(node.id).photo} focus="deep" />
    <header className="trail-head">
      <div>
        <p className="trail-kicker">{T.kicker} · {state.completed.length} {COPY.stage.of} {content.missionOrder.length} {COPY.frames.journey.decisions}</p>
        <Heading className="trail-title">{ended ? COPY.stage.complete : <>{T.stage} {chapter}: {stageNameOf(content, chapter)}</>}</Heading>
      </div>
      <div className={'trail-case' + (solved ? ' is-solved' : '')}>
        <p className="trail-case-q"><span>{solved ? COPY.frames.trail.caseSolved : COPY.frames.trail.caseOpen}</span>{MYSTERY.question}</p>
        <p className="trail-case-a">{solved ? MYSTERY.solved : MYSTERY.unknown}</p>
      </div>
      <ul className="trail-standing" aria-label={COPY.position}>{RULES.map(r => <li key={r.id}>
        <span>{r.question}</span><span className="bar" aria-hidden="true"><i style={{ width: state.dims[r.id] + '%' }} /></span><b>{state.dims[r.id]}</b>
      </li>)}</ul>
    </header>

    <div className={'trail-board' + (rows.length === 1 ? ' is-one-row' : '')} role="group" aria-label={T.kicker}>
      {rows.map((row, r) => <div key={r} className={'trail-board-row' + (r === 1 ? ' is-back' : '')}>
        {CHAPTER_PRESENTATION.filter(p => row.some(s => s.chapter === p.chapter)).map(p => {
          const inRegion = row.filter(s => s.chapter === p.chapter);
          const regionDone = inRegion.every(s => s.status === 'done');
          return <div key={p.chapter} className={'trail-region' + (p.chapter === chapter && !ended ? ' is-here' : '') + (regionDone ? ' is-done' : '')} data-chapter={p.chapter} style={{ flexGrow: inRegion.length + (rows.length === 1 ? 1 : 0) }}>
            <p className="trail-region-name">
              {regionDone ? <button className="trail-region-link" onClick={() => onReview(p.chapter)}><span>{p.chapter}</span>{stageNameOf(content, p.chapter)}</button> : <><span>{p.chapter}</span>{stageNameOf(content, p.chapter)}</>}
            </p>
            <ol className="trail-stops">{inRegion.map(s => {
              const n = s.event ? null : content.missionOrder.indexOf(s.id) + 1;
              return <li key={s.id} className={'trail-stop is-' + s.status + (s.event ? ' is-event' : '')} aria-current={s.status === 'here' ? 'step' : undefined}>
                {s.status === 'here' && <span className="trail-pin" aria-hidden="true">{T.youAreHere}</span>}
                <span className="trail-dot" aria-hidden="true">{s.status === 'done' ? '✓' : s.event ? '!' : n}</span>
                <span className="trail-stop-name">{MILESTONE[s.id]}<span className="sr-only"> · {s.status === 'done' ? T.done : s.status === 'here' ? T.youAreHere : s.status === 'missed' ? T.notReached : T.ahead}</span></span>
              </li>;
            })}</ol>
          </div>;
        })}
      </div>)}
    </div>

    {/* Three columns in story order: what just happened (and its quick check, D-089), the next
        stop with its Go, then the act's picture of the system beside your hand (D-090). The Go
        stays in view at 1440×900 however long the other two columns run. */}
    <div className="trail-panels">
      {justHappened && <div className="trail-recent">
        <div className="trail-just">
          <p className="mini-head">{T.justHappened}</p>
          <p className="trail-just-head">{justHappened.headline}</p>
          <p className="trail-just-chose">{T.youChose}: {justHappened.chosenLabel}</p>
        </div>
        {CHECKS[justHappened.missionId] && <QuickCheck key={justHappened.missionId} id={justHappened.missionId} check={CHECKS[justHappened.missionId]} />}
      </div>}
      <article className="trail-next-stop" aria-labelledby="next-stop-title">
        {ended ? <>
          <h2 id="next-stop-title" className="trail-next-name">{T.finish}</h2>
          <Action onClick={onPlay}>{T.backToEnd}</Action>
        </> : <>
          <p className="mini-head">{newStage ? T.newStage + ' · ' : ''}{T.nextStop} · {COPY.stage.act} {chapter}</p>
          <h2 id="next-stop-title" className="trail-next-name">{here ? MILESTONE[here.id] : ''}</h2>
          {newStage && <p className="trail-next-question">{ACT_QUESTION[chapter as ChapterNumber]}</p>}
          <div className="trail-next-guide">
            <Portrait name={guide.name} />
            <p><b>{guide.name}</b><span>{guide.role}</span>{teaser && <q>{teaser}</q>}</p>
          </div>
          <Action onClick={onPlay}>{state.completed.length === 0 && !justHappened ? T.begin : T.go + ': ' + (here ? MILESTONE[here.id] : '')}</Action>
        </>}
      </article>

      <div className="trail-side">
        <ActView state={state} content={content} chapter={chapter} />
        <aside className="trail-hand" aria-labelledby="hand-title">
          <h2 id="hand-title" className="mini-head">{T.hand}</h2>
          <Pile title={T.have} cards={have} empty={T.emptyHave} fresh={fresh} />
          <Pile title={T.owe} cards={owe} empty={T.emptyOwe} fresh={fresh} />
        </aside>
      </div>
    </div>
  </section>;
}

function Pile({ title, cards, empty, fresh }: { title: string; cards: Card[]; empty: string; fresh: Set<string> }) {
  const T = COPY.frames.trail;
  return <section className={'trail-pile pile-' + (cards[0]?.pile ?? 'empty')}>
    <h3>{title} <span>{cards.length}</span></h3>
    {cards.length === 0 ? <p className="trail-pile-empty">{empty}</p> : <ul>{cards.map((c, i) => <li key={c.flag} className={'trail-card is-' + c.pile + (fresh.has(c.flag) ? ' is-new' : '')} style={{ ['--i' as string]: i }}>
      <strong>{c.title}</strong>
      {c.next && <small>{c.next.kind === 'opens' ? T.opens : c.next.kind === 'pays' ? T.pays : T.due}: {c.next.at}</small>}
    </li>)}</ul>}
  </section>;
}
