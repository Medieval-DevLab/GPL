import type { Chapter, Condition, Content, GameState, Mission, Option } from '../../engine/types';
import { BADGE_META } from '../../engine/types';
import { availableOptions, canCommit, outcomeBecause, requiredSelectionCount, resolveAdvisorLine, resolveSaidQuote, resolveSituation, type DimTest } from '../../engine/engine';
import { COPY } from '../../content/interface';
import { EARNED } from '../../content/gates';
import { MISSION_RULE, placeOf, ruleOf } from '../../content/presentation';
import { Action, Glyph, Heading, Paras, Pips, Place, Portrait, firstName } from '../parts';
import { Board } from './Board';

interface Props {
  mission: Mission; state: GameState; content: Content; chapter: Chapter; before?: readonly string[];
  onToggle(id: string): void; onCommit(): void; onNext(): void; onFile(): void;
}

/** How the person reaches you. The scene layout never changes; only this label does. */
function medium(mission: Mission) {
  if (mission.presentation === 'apply') return COPY.stage.facing;
  if (mission.presentation === 'dialogue') return mission.surface === 'call' ? COPY.stage.onCall : COPY.stage.message;
  return undefined;
}

/**
 * Who is in the room, and what they said. The client when the client is speaking; otherwise
 * your colleague. A forwarded client message stays attributed to the client.
 */
function people(mission: Mission, state: GameState) {
  const quote = resolveSaidQuote(mission, state);
  const advice = resolveAdvisorLine(mission, state);
  const internal = mission.room === 'internal' || !quote;
  if (!internal && quote) return { lead: { name: quote.speaker, role: quote.role, words: quote.text }, forwarded: undefined, steer: mission.advisor && advice ? { name: mission.advisor.name, role: mission.advisor.role, words: advice } : undefined };
  return {
    lead: mission.advisor && advice ? { name: mission.advisor.name, role: mission.advisor.role, words: advice } : undefined,
    forwarded: quote, steer: undefined,
  };
}

/**
 * The scene: one layout for all eighteen decisions (D-080).
 *
 * The brief and the decision used to be two screens showing the same people saying the same
 * things. Now the situation and the choice share one scene, and committing does not change
 * the screen — the room answers in the same place the options were, and the board on the
 * right marks what changed and why. A new screen means the story moved.
 */
export function Scene(props: Props) {
  const { mission, state, content, chapter } = props;
  const place = placeOf(mission.id);
  const who = people(mission, state);
  const via = medium(mission);
  const index = content.missionOrder.indexOf(mission.id) + 1;
  const result = state.phase === 'consequence' ? state.resolution : null;
  return <section className="page scr-scene">
    <div className="scene">
      <div className="place">
        <Place photo={place.photo} name={place.name} detail={COPY.stage.act + ' ' + chapter.number + ' · ' + chapter.label} />
        {who.lead && <div className="person enter" style={{ ['--i' as string]: 1 }}>
          <Portrait name={who.lead.name} />
          <strong>{who.lead.name}</strong>
          <small>{who.lead.role}</small>
          {via && <p className="medium">{via}</p>}
          <blockquote>“{who.lead.words}”</blockquote>
          {who.forwarded && <p className="meta">{COPY.stage.forwarded} {who.forwarded.speaker}, {who.forwarded.role}: “{who.forwarded.text}”</p>}
        </div>}
      </div>

      <div className="decision">
        <header className="decision-head">
          <div className="row"><p className="kicker">{COPY.stage.decision} {index} {COPY.stage.of} {content.missionOrder.length}</p>
            <button className="ghost" onClick={props.onFile}><Glyph name="file" />{COPY.audit}</button></div>
          <Heading className="h1">{mission.question}</Heading>
        </header>
        {/* After you commit, the situation has been read and acted on: the room's answer takes its place
            at the top, and the brief stays one click away in the account file. */}
        {!result && <Paras lines={resolveSituation(mission, state)} className="read situation" />}
        {!result && who.steer && <div className="steer"><Portrait name={who.steer.name} className="sm" /><div><p>“{who.steer.words}”</p><small>{who.steer.name} · {who.steer.role}</small></div></div>}
        {result ? <Outcome {...props} /> : <Choices {...props} />}
      </div>

      <Board state={state} content={content} before={props.before} onMore={props.onFile} />
    </div>
    <footer className="cmd-bar">
      {result
        ? <><button className="text-link" onClick={props.onFile}>{COPY.stage.fileLink}</button><Action onClick={props.onNext}>{COPY.next}</Action></>
        : <><p role="status">{selectionStatus(mission, state)}</p><Action onClick={props.onCommit} disabled={!canCommit(state, content)}>{commitLabel(mission)}</Action></>}
    </footer>
  </section>;
}

function commitLabel(mission: Mission) {
  return mission.kind === 'investigate' ? COPY.investigate : mission.kind === 'build' ? COPY.assemble : mission.presentation === 'dialogue' ? COPY.send : COPY.commit;
}

function selectionStatus(mission: Mission, state: GameState) {
  const need = requiredSelectionCount(mission);
  return (need === 1 ? COPY.stage.pickOne : COPY.stage.pickExactly + ' ' + (COPY.stage.numbers[need] ?? need)) + ' · ' + state.selection.length + ' ' + COPY.stage.of + ' ' + need + ' ' + COPY.stage.selected;
}

function needs(condition: Condition | undefined) {
  return { all: condition?.all ?? [], any: condition?.any ?? [] };
}

function LockNote({ option }: { option: Option }) {
  const { all, any } = needs(option.requires);
  const flags = [...all, ...any];
  if (flags.length > 0 && flags.every(f => EARNED[f]?.liability)) return <div className="lock-note"><b>{COPY.stage.lockedTitle}</b><span>{COPY.stage.liabilityGate}</span></div>;
  return <div className="lock-note">
    <b>{COPY.stage.lockedTitle}</b>
    {all.map(f => <span key={f}>{COPY.stage.needs}: {EARNED[f]?.as ?? 'an earlier commitment'}{EARNED[f] && <small>{EARNED[f].where}</small>}</span>)}
    {any.length > 0 && <span>{COPY.stage.needsOne}: {any.map(f => EARNED[f]?.as ?? 'an earlier commitment').join(' or ')}</span>}
  </div>;
}

/** Title, one sentence and what it costs. Pros, cons and effort are one tap away (G3c). */
function Choices({ mission, state, onToggle }: Props) {
  const multi = mission.kind !== 'choice';
  const allowed = new Set(mission.kind === 'choice' ? availableOptions(mission, state).map(o => o.id) : []);
  interface Item { id: string; title: string; line: string; say: boolean; option?: Option; enabled: boolean; tag?: string }
  const spoken = mission.presentation === 'dialogue' || mission.presentation === 'apply';
  const items: Item[] = mission.kind === 'choice'
    ? mission.options.map(o => ({ id: o.id, title: o.title, line: spoken && o.say ? '“' + o.say + '”' : o.description, say: spoken && !!o.say, option: o, enabled: allowed.has(o.id) }))
    : mission.kind === 'investigate'
      ? mission.evidence.map(e => ({ id: e.id, title: e.label, line: e.question, say: false, enabled: true }))
      : mission.components.map(c => ({ id: c.id, title: c.title, line: c.description, say: false, enabled: true, tag: c.tag }));
  return <div className="choose">
    <p className="choose-label">{mission.prompt ?? (multi ? '' : COPY.stage.pickOne)}</p>
    <ol className="choices" aria-label={mission.question}>
      {items.map((it, i) => {
        const on = state.selection.includes(it.id);
        return <li key={it.id} className={'choice enter' + (multi ? ' multi' : '') + (on ? ' is-selected' : '') + (!it.enabled ? ' is-locked' : '')} style={{ ['--i' as string]: i }}>
          <button className="choice-hit" data-choice={it.id} aria-pressed={on} disabled={!it.enabled} aria-describedby={'d-' + it.id} onClick={() => onToggle(it.id)}>
            <span className="choice-mark" aria-hidden="true">{on ? '✓' : i + 1}</span>
            <span className="choice-title">{it.title}</span>
          </button>
          <div className="choice-body" id={'d-' + it.id}>
            <p className={'choice-line' + (it.say ? ' say' : '')}>{it.line}</p>
            {it.tag && <p className="meta">{it.tag}</p>}
            {it.option && (it.enabled ? <Cost option={it.option} /> : <LockNote option={it.option} />)}
          </div>
        </li>;
      })}
    </ol>
  </div>;
}

function Cost({ option }: { option: Option }) {
  const hasMore = !!(option.pros?.length || option.cons?.length || option.cost);
  return <>
    {option.commits && <p className="choice-cost"><b>{COPY.stage.commits}:</b> {option.commits}</p>}
    {hasMore && <details className="choice-more">
      <summary>{COPY.stage.tradeoffs}</summary>
      <div className="tradeoffs">
        {option.pros?.length ? <div><h4>{COPY.stage.offers}</h4><ul className="pro">{option.pros.map(p => <li key={p}>{p}</li>)}</ul></div> : null}
        {option.cons?.length ? <div><h4>{COPY.stage.givesUp}</h4><ul className="con">{option.cons.map(c => <li key={c}>{c}</li>)}</ul></div> : null}
        {option.cost && <p className="effort"><span>{COPY.stage.effort} <Pips value={option.cost.time} label={COPY.stage.effort} /></span><span>{COPY.stage.investment} <Pips value={option.cost.investment} label={COPY.stage.investment} /></span></p>}
      </div>
    </details>}
  </>;
}

/**
 * What happened, in the order the game teaches (G5): what you chose → what happened → why it
 * landed this way → what your colleague makes of it, filed under one of the three questions.
 */
function Outcome({ mission, state, content }: Props) {
  const result = state.resolution!;
  const because = outcomeBecause(state, content);
  const rule = ruleOf(MISSION_RULE[mission.id] ?? 'win');
  const advisor = mission.advisor;
  const dimLine = (t: DimTest) => COPY.dimensions[t.dim].label + ' ' + t.value + ' ' + (t.at === 'min' ? COPY.stage.atLeast : COPY.stage.atMost);
  const label = (f: string) => EARNED[f]?.as;
  const held = because.held.map(label).filter(Boolean) as string[];
  const lacked = because.lacked.map(label).filter(Boolean) as string[];
  const missed = because.missed;
  const missedText = missed ? [
    ...missed.needed.map(label).filter(Boolean),
    ...(missed.oneOf.length ? [COPY.stage.missedOneOf + ' ' + missed.oneOf.map(label).filter(Boolean).join(' or ')] : []),
    ...missed.dims.map(dimLine),
  ] as string[] : [];
  const missedWithout = missed ? missed.without.map(label).filter(Boolean) as string[] : [];
  return <div className="outcome" aria-live="polite">
    <p className="outcome-chose">{COPY.stage.youChose}: <b>{result.chosenLabel}</b></p>
    <h2 className="h2 enter" id="outcome-heading" tabIndex={-1}>{result.outcome.headline}</h2>
    <p className="read enter" style={{ ['--i' as string]: 1 }}>{result.outcome.detail}</p>
    <ul className="changed enter" style={{ ['--i' as string]: 2 }} aria-label={COPY.stage.changed}>{result.outcome.changed.map(x => <li key={x}>{x}</li>)}</ul>
    <section className="why enter" style={{ ['--i' as string]: 3 }}>
      <h3>{COPY.stage.because}</h3>
      {held.length > 0 && <p>{COPY.stage.becauseHeld}: <b>{held.join('; ')}</b>.</p>}
      {lacked.length > 0 && <p>{COPY.stage.becauseLacked}: <b>{lacked.join('; ')}</b>.</p>}
      {because.dims.length > 0 && <p>{COPY.stage.becauseDims}: <b>{because.dims.map(dimLine).join('; ')}</b>.</p>}
      {(missedText.length > 0 || missedWithout.length > 0) && <p>{COPY.stage.missedWith}: <b>{missedText.join('; ')}</b>{missedWithout.length > 0 && <>{missedText.length ? ' — ' : ''}{COPY.stage.missedWithout} <b>{missedWithout.join('; ')}</b></>}.</p>}
      {!held.length && !lacked.length && !because.dims.length && !missedText.length && !missedWithout.length && <p>{because.conditional ? COPY.stage.becauseNone : COPY.stage.becauseFixed}</p>}
    </section>
    <section className="afterwards enter" style={{ ['--i' as string]: 4 }} aria-label={(firstName(advisor?.name) ?? '') + ' ' + COPY.stage.afterwards}>
      <Portrait name={advisor?.name} />
      <small>{advisor ? firstName(advisor.name) + ', ' + COPY.stage.afterwards : COPY.stage.afterwardsAlone}</small>
      <blockquote>“{result.lesson.principle}”</blockquote>
      <p className="filed">{COPY.stage.filedUnder} <b>{rule.question}</b></p>
    </section>
    {result.newBadges.map(id => <p className="noticed" key={id}><Glyph name="spark" />{advisor ? firstName(advisor.name) + ' ' + COPY.stage.noticed : COPY.stage.noticed}: <b>{BADGE_META[id].label}</b> — {BADGE_META[id].note}</p>)}
  </div>;
}
