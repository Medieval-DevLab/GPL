import { useEffect, useState } from 'react';
import type { Content, GameState, Mission } from '../../engine/types';
import { BADGE_META } from '../../engine/types';
import { outcomeBecause, type DimTest } from '../../engine/engine';
import { COPY } from '../../content/interface';
import { EARNED } from '../../content/gates';
import { BACKDROP } from '../../content/presentation';
import { Action, Cutout, DIMENSION_ORDER, Glyph, Heading, Portrait, World, castId } from '../parts';

/** Count a number from one value to another; instant when motion is reduced. */
export function useCountUp(from: number, to: number, delay: number, still: boolean) {
  const [value, setValue] = useState(still ? to : from);
  useEffect(() => {
    if (still || from === to) { setValue(to); return; }
    let frame = 0; const start = performance.now() + delay; const span = 900;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / span));
      setValue(Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [from, to, delay, still]);
  return value;
}

function Dial({ dim, before, after, still, index }: { dim: 'win' | 'profit' | 'deliver'; before: number; after: number; still: boolean; index: number }) {
  const meta = COPY.dimensions[dim];
  const value = useCountUp(before, after, 520 + index * 120, still);
  const delta = after - before;
  const r = 34, c = 2 * Math.PI * r;
  return <div className={'dial' + (delta ? ' has-moved' : '')}>
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r={r} className="dial-track" />
      <circle cx="40" cy="40" r={r} className="dial-fill" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
    </svg>
    <div className="dial-read"><Glyph name={dim} /><b className="display">{value}</b></div>
    <p className="dial-label"><strong>{meta.label}</strong><span>{meta.question}</span></p>
    <p className={'dial-delta mono ' + (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat')}>
      <span className="sr-only">{meta.label} {before} to {after}: </span>{delta > 0 ? '▲ +' + delta : delta < 0 ? '▼ −' + Math.abs(delta) : 'No change'}
    </p>
  </div>;
}

/**
 * The room responds. The order is the teaching order (G5): what you chose → what happened →
 * why it happened → what is now different. The causes are the run's own history, read back
 * by the engine; the lesson is voiced by the colleague who has been briefing you, with a face,
 * because advice from the interface is condescending and advice from a person is onboarding.
 */
export function Result({ state, content, mission, still, onNext, onFile }: { state: GameState; content: Content; mission: Mission | undefined; still: boolean; onNext(): void; onFile(): void }) {
  const result = state.resolution!;
  const because = outcomeBecause(state, content);
  const label = (f: string) => EARNED[f];
  const held = because.held.filter(label), lacked = because.lacked.filter(label);
  const missed = because.missed && {
    needed: because.missed.needed.filter(label), oneOf: because.missed.oneOf.filter(label),
    without: because.missed.without.filter(label), dims: because.missed.dims,
  };
  const hasMissed = !!missed && (missed.needed.length + missed.oneOf.length + missed.without.length + missed.dims.length) > 0;
  const remembered = (result.outcome.effect.flags ?? []).filter(f => EARNED[f] && !because.held.includes(f));
  const advisor = mission?.advisor;
  const first = advisor?.name.split(' ')[0];
  const dimLine = (t: DimTest) => COPY.dimensions[t.dim].label + ' ' + t.value + ' ' + (t.at === 'min' ? COPY.stage.atLeast : COPY.stage.atMost);
  const row = (f: string, lead: string) => <li key={lead + f} className={EARNED[f].liability ? 'is-liability' : ''}><span>{lead}</span><strong>{EARNED[f].as}</strong><small>{EARNED[f].where}</small></li>;
  return <section className="stage scr-result">
    <World backdrop={BACKDROP[state.nodeId] ?? 'env-skyline-dusk'} mood="dim" />
    <div className="tone-wash" aria-hidden="true" />
    <div className="result-grid">
      <div className="result-left">
        <div className="committed paper enter-shake" style={{ viewTransitionName: 'committed' }}>
          <p className="mono">{COPY.stage.youChose}</p>
          <p className="committed-title display">{result.chosenLabel}</p>
          <span className="stamp enter-stamp" aria-hidden="true">{COPY.stage.committed}</span>
        </div>
        <div className="position glass" role="group" aria-label={COPY.position}>
          <p className="mono">{COPY.position}</p>
          <div className="dials">{DIMENSION_ORDER.map((d, i) => <Dial key={d} dim={d} index={i} before={result.dimsBefore[d]} after={result.dimsAfter[d]} still={still} />)}</div>
        </div>
        {result.newBadges.map(id => <div className="badge" key={id}><Glyph name="spark" /><div><small className="mono">{first ? first + ' ' + COPY.stage.noticed : COPY.stage.noticed}</small><strong>{BADGE_META[id].label}</strong><span>{BADGE_META[id].note}</span></div></div>)}
      </div>

      <div className="result-main">
        <p className="kicker enter-rise">{COPY.stage.happened}</p>
        <Heading className="result-headline display enter-slam" >{result.outcome.headline}</Heading>
        <p className="result-detail serif enter-rise" style={{ ['--i' as string]: 1 }}>{result.outcome.detail}</p>
        <section className="result-changed enter-rise" style={{ ['--i' as string]: 2 }} aria-label={COPY.stage.changed}>
          <p className="mono">{COPY.stage.changed}</p>
          <ul>{result.outcome.changed.map(x => <li key={x}>{x}</li>)}</ul>
        </section>
        {/* Why it landed this way: the outcome's own condition, then — for anything that was not
            the first way it could land — the nearest other way and what it would have taken.
            Neutral throughout: a liability's absence is not a shortfall (D-078). */}
        <section className="because enter-rise" style={{ ['--i' as string]: 3 }}>
          <p className="mono"><Glyph name="link" />{COPY.stage.because}</p>
          {(held.length || lacked.length || because.dims.length) ? <ul>
            {held.map(f => row(f, COPY.stage.becauseHeld))}
            {lacked.map(f => row(f, COPY.stage.becauseLacked))}
            {because.dims.map(t => <li key={t.dim + t.at}><span>{COPY.stage.becauseDims}</span><strong>{dimLine(t)}</strong></li>)}
          </ul> : null}
          {hasMissed && <div className="missed">
            <p>{COPY.stage.missedWith}</p>
            <ul>
              {missed!.needed.map(f => <li key={f}><strong>{EARNED[f].as}</strong><small>{EARNED[f].where}</small></li>)}
              {missed!.oneOf.length > 0 && <li><strong>{COPY.stage.missedOneOf} {missed!.oneOf.map(f => EARNED[f].as).join(' · ')}</strong></li>}
              {missed!.dims.map(t => <li key={t.dim + t.at}><strong>{dimLine(t)}</strong></li>)}
              {missed!.without.map(f => <li key={'w' + f}><span>{COPY.stage.missedWithout}</span><strong>{EARNED[f].as}</strong><small>{EARNED[f].where}</small></li>)}
            </ul>
          </div>}
          {!held.length && !lacked.length && !because.dims.length && !hasMissed && <p className="because-none">{because.conditional ? COPY.stage.becauseNone : COPY.stage.becauseFixed}</p>}
        </section>
        {(result.revealed.length > 0 || remembered.length > 0) && <section className="remembered enter-rise" style={{ ['--i' as string]: 4 }}>
          <p className="mono"><Glyph name="file" />{COPY.stage.remembered}</p>
          <ul>
            {result.revealed.map(e => <li key={e.id}><strong>{e.label}</strong><span>{e.reveals}</span></li>)}
            {remembered.map(f => <li key={f}><strong>{EARNED[f].as}</strong></li>)}
          </ul>
        </section>}
      </div>

      {/* The colleague talking to you afterwards — every sentence inside their quote, nothing
          captioned by the interface as "the lesson" (G9b; pedagogy audit B4). */}
      <aside className="lesson enter-rise" style={{ ['--i' as string]: 3 }} aria-label={first ? first + ' ' + COPY.stage.afterwards : COPY.stage.afterwardsAlone}>
        {advisor && <div className="lesson-frame" aria-hidden="true"><Cutout id={castId(advisor.name)} frame={{ x: '72%', y: 0.12, face: 0.5 }} /></div>}
        <div className="lesson-card">
          <p className="mono">{first ? first + ', ' + COPY.stage.afterwards : COPY.stage.afterwardsAlone}</p>
          <blockquote>
            <p className="serif lesson-principle">“{result.lesson.principle}</p>
            <p className="lesson-because">{result.lesson.because}</p>
            {result.lesson.watchFor && <p className="lesson-forward">{result.lesson.watchFor}”</p>}
            {!result.lesson.watchFor && <span className="lesson-close" aria-hidden="true">”</span>}
            {advisor && <cite><Portrait name={advisor.name} /><span><strong>{advisor.name}</strong><small>{advisor.role}</small></span></cite>}
          </blockquote>
        </div>
      </aside>
    </div>
    <footer className="cmd-bar"><button className="text-link" onClick={onFile}>{COPY.stage.fileLink}</button><Action onClick={onNext}>{COPY.next}</Action></footer>
  </section>;
}
