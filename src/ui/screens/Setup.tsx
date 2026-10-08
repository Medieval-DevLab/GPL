import { useEffect, useState, type ReactNode } from 'react';
import type { DimensionId, Setup as SetupNode, SetupOption } from '../../engine/types';
import { COPY } from '../../content/interface';
import { CHARACTERS, type CharacterId } from '../../content/characters';
import { CHAPTER_PRESENTATION, RULES, STORY } from '../../content/presentation';
import { COLLEAGUES, DEAL, FIRM_NAME, MEET, SETUP_FLOW, STRENGTH, STRENGTH_LATER } from '../../content/firm';
import { firstName, Glyph, Heading, Portrait, type Frame } from '../parts';
import { Figure, RuleMark, useAdvanceKeys } from './FrameParts';

/** Drawn marks for this screen. Keyed by the content's own icon ids where there are some. */
const ICON: Record<string, ReactNode> = {
  talk: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v4a2.5 2.5 0 0 1-2.5 2.5H9l-3.5 3v-3A2.5 2.5 0 0 1 4 10.5Z" /><path d="M18 9.5h.5A1.5 1.5 0 0 1 20 11v4a1.5 1.5 0 0 1-1.5 1.5H18v2.5l-3-2.5h-3" /></>,
  layers: <><path d="M12 3 21 8l-9 5-9-5 9-5Z" /><path d="m3 12.5 9 5 9-5" /><path d="m3 17 9 5 9-5" /></>,
  scale: <><path d="M12 4v16M7 20h10M5 7h14" /><path d="m5 7-3 6a3 3 0 0 0 6 0Z" /><path d="m19 7-3 6a3 3 0 0 0 6 0Z" /></>,
  team: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><circle cx="17" cy="9" r="2.4" /><path d="M15.6 14.1A4.6 4.6 0 0 1 21 18.6" /></>,
  person: <><circle cx="12" cy="7.5" r="3.6" /><path d="M5 20.5a7 7 0 0 1 14 0" /></>,
  good: <path d="M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8Z" />,
  raises: <><path d="M4 20h16" /><path d="M7 16v-4M12 16V8M17 16V5" /></>,
  later: <><path d="M7 17 17 7" /><path d="M9 7h8v8" /></>,
  short: <><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></>,
};
const Mark = ({ name }: { name: string }) =>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICON[name]}</svg>;

/** Where each colleague's face sits in their portrait tile: same eye line, same size. */
const FRAME: Record<CharacterId, Frame> = Object.fromEntries(
  (Object.keys(CHARACTERS) as CharacterId[]).map(id => [id, { x: '50%', y: 0.13, face: 0.25 }]),
) as Record<CharacterId, Frame>;

/** The acts a colleague guides, from the story's own running order. */
const actsOf = (id: CharacterId) => CHAPTER_PRESENTATION.filter(c => c.advisor === id).map(c => c.chapter);
const actsLabel = (acts: readonly number[]) => acts.length < 2 ? MEET.people.act + ' ' + acts.join('')
  : MEET.people.acts + ' ' + acts.slice(0, -1).join(', ') + ' ' + MEET.people.and + ' ' + acts[acts.length - 1];
const signed = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);
const raisedBy = (o: SetupOption) => (Object.entries(o.dims ?? {}) as [DimensionId, number][]).filter(([, n]) => n);

/**
 * The screen's one forward action. Each intermediate step is a spoken-line advance as far as
 * the harnesses and the keyboard are concerned (`data-line-next`); the last is the confirm.
 * A double-click must not skip a panel.
 */
function Forward({ children, onClick, disabled = false, line = false }: { children: ReactNode; onClick(): void; disabled?: boolean; line?: boolean }) {
  return <button className="primary" data-primary data-action="primary" data-line-next={line || undefined} disabled={disabled}
    onClick={event => { if (event.detail < 2) onClick(); }}
    onKeyDown={event => { if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault(); }}>
    {children}
  </button>;
}

/**
 * Before the story: who we are, how a deal works, and what your team is good at. Three short
 * panels for someone who has never sold anything, so that the first decision lands on a player
 * who knows what the firm does, who the four colleagues are, what the three bars mean and why
 * they pull against each other. The last panel is the one choice made before the story starts.
 *
 * Rendering only. Every number shown is the content's own; nothing here decides anything.
 */
export function Setup({ node, selected, onPick, onConfirm }: { node: SetupNode; selected: string | null; onPick(id: string): void; onConfirm(): void }) {
  const last = SETUP_FLOW.steps.length - 1;
  /* A player coming back to a team already picked lands on the choice, not the introduction. */
  const [step, setStep] = useState(selected ? last : 0);
  const [back, setBack] = useState(false);
  const go = (to: number) => { if (to === step || to < 0 || to > last) return; setBack(to < step); setStep(to); };

  /* Each panel is a new page: it opens at its top, and a screen reader starts at its heading.
     Also on arrival — the title screen and this one share a route, so nothing else resets them,
     and in one column the player would otherwise land halfway down the first panel. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('game-heading')?.focus({ preventScroll: true });
  }, [step]);
  useAdvanceKeys();
  /* ← goes back a panel; 1–3 pick a team on the last one. Never while typing or in a drawer. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || document.querySelector('dialog[open]')) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'ArrowLeft' && step > 0 && (!t || t === document.body || t.matches('h1, h2, main, section'))) { e.preventDefault(); go(step - 1); return; }
      const n = Number(e.key);
      if (step === last && Number.isInteger(n) && n >= 1 && n <= node.options.length) { e.preventDefault(); onPick(node.options[n - 1].id); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return <section className="page f-setup">
    <header className="f-setup-top">
      <p className="f-firm"><span className="f-firm-logo" aria-hidden="true">{FIRM_NAME.charAt(0)}</span><span><b>{FIRM_NAME}</b><small>{SETUP_FLOW.label}</small></span></p>
      <ol className="f-steps" aria-label={SETUP_FLOW.label}>
        {SETUP_FLOW.steps.map((label, i) => {
          const state = i < step ? 'is-done' : i === step ? 'is-here' : 'is-ahead';
          const body = <><span className="n">{i < step ? <Glyph name="check" /> : i + 1}</span><span className="f-step-label">{label}</span></>;
          return <li key={label} className={state} aria-current={i === step ? 'step' : undefined}>
            {i < step ? <button className="f-step" onClick={() => go(i)}>{body}</button> : <span className="f-step">{body}</span>}
          </li>;
        })}
      </ol>
    </header>

    <div className={'f-setup-desk' + (back ? ' is-back' : '')} key={step}>
      {step === 0 && <Meet />}
      {step === 1 && <Deal />}
      {step === 2 && <Strength node={node} selected={selected} onPick={onPick} />}
    </div>

    <footer className="f-setup-bar">
      <p>{SETUP_FLOW.bar[step]}</p>
      <div className="f-setup-actions">
        {step > 0 && <button className="secondary" onClick={() => go(step - 1)}>{SETUP_FLOW.back}</button>}
        {step < last
          ? <Forward key={'next-' + step} line onClick={() => go(step + 1)}>{SETUP_FLOW.next[step]}</Forward>
          : <Forward key="confirm" disabled={!selected} onClick={onConfirm}>{COPY.setup}</Forward>}
      </div>
    </footer>
  </section>;
}

/** Panel 1: the firm, how it makes money, your job, and the four people you will meet. */
function Meet() {
  const M = MEET;
  return <div className="f-sheet f-meet">
    <div className="f-meet-intro">
      <Heading className="f-setup-h1">{M.title}</Heading>
      <p className="f-setup-lede">{M.lede}</p>

      <section className="f-fact" aria-labelledby="f-money-h">
        <h2 className="f-fact-h" id="f-money-h"><span className="f-medal is-profit"><Glyph name="profit" /></span>{M.money.title}</h2>
        <ol className="f-flow">{M.money.flow.map(s => <li key={s}>{s}</li>)}</ol>
        <div className="f-fee">
          <p className="f-fee-label">{M.money.fee}</p>
          <p className="f-fee-bar"><span className="is-people">{M.money.people}</span><span className="is-keep">{M.money.keep}</span></p>
        </div>
        <p className="f-fact-p">{M.money.note}</p>
      </section>

      <section className="f-fact" aria-labelledby="f-job-h">
        <div className="f-fact-top">
          <h2 className="f-fact-h" id="f-job-h"><span className="f-medal is-deliver"><Mark name="team" /></span>{M.job.title}</h2>
          <ul className="f-six" aria-hidden="true">{Array.from({ length: M.job.size }, (_, i) => <li key={i}><Mark name="person" /></li>)}</ul>
        </div>
        <p className="f-fact-p">{M.job.body}</p>
      </section>

      <aside className="f-catch" aria-label={M.catch}>
        <span className="f-catch-mark" aria-hidden="true">!</span>
        <p><b>{M.catch}</b> {STORY.stakes}</p>
      </aside>
    </div>

    <section className="f-meet-people" aria-labelledby="f-people-h">
      <div className="f-people-head"><h2 id="f-people-h">{M.people.title}</h2><p>{M.people.note}</p></div>
      <ul className="f-people">
        {COLLEAGUES.map((c, i) => {
          const who = CHARACTERS[c.id];
          const acts = actsOf(c.id);
          return <li key={c.id} className="f-person" data-chapter={acts[0]}>
            <div className="f-person-photo">
              <Figure id={c.id} enter="rise" delay={150 + i * 120} box={{ inset: 0 }} frame={FRAME[c.id]} />
              <p className="f-person-act">{actsLabel(acts)}</p>
            </div>
            <div className="f-person-text">
              <h3>{who.name}</h3>
              <p className="f-person-role">{who.role}</p>
              <p className="f-person-line">{c.line}</p>
            </div>
          </li>;
        })}
      </ul>
    </section>
  </div>;
}

/** Panel 2: five stages as a route, the three bars, and the trade every decision makes. */
function Deal() {
  const D = DEAL;
  const short = (id: DimensionId) => COPY.dimensions[id].short;
  return <div className="f-sheet f-deal">
    <div className="f-panel-top">
      <Heading className="f-setup-h1">{D.title}</Heading>
      <p className="f-setup-lede">{D.lede}</p>
    </div>

    <ol className="f-stages">
      {D.stages.map((s, i) => {
        const guide = CHAPTER_PRESENTATION[i]?.advisor;
        const name = guide ? CHARACTERS[guide].name : undefined;
        return <li key={s.name} data-chapter={i + 1} style={{ ['--i' as string]: i }}>
          <span className="f-stage-n" aria-hidden="true">{i + 1}</span>
          <p className="f-stage-act">{D.act} {i + 1}{name && <> · <Portrait name={name} className="sm" /> {D.with} {firstName(name)}</>}</p>
          <h2 className="f-stage-name">{s.name}</h2>
          <p className="f-stage-line">{s.line}</p>
        </li>;
      })}
    </ol>

    <div className="f-deal-low">
      <section className="f-bars" aria-labelledby="f-bars-h">
        <div className="f-panel-head"><h2 className="f-panel-h" id="f-bars-h">{D.bars.title}</h2><p>{D.bars.note}</p></div>
        <ul>
          {RULES.map(r => <li key={r.id} className={'f-bar-row q-' + r.id}>
            <RuleMark id={r.id} />
            <b className="f-bar-name">{short(r.id)}</b>
            <p>{D.bars.items[r.id].meaning}</p>
            <p className="f-bar-eg">{D.bars.example} {D.bars.items[r.id].example}</p>
          </li>)}
        </ul>
      </section>

      <section className="f-trade" aria-labelledby="f-trade-h">
        <h2 className="f-panel-h" id="f-trade-h">{D.trade.title}</h2>
        <div className="f-seesaws">
          {D.trade.pairs.map((p, i) => <figure key={p.lever} className="f-seesaw" style={{ ['--i' as string]: i }}>
            <figcaption>{p.lever}</figcaption>
            <div className="f-rig" aria-hidden="true">
              <div className="f-beam">
                <span className={'f-weight is-up q-' + p.up}><Glyph name={p.up} />{short(p.up)} <i>▲</i></span>
                <span className={'f-weight is-down q-' + p.down}><Glyph name={p.down} />{short(p.down)} <i>▼</i></span>
              </div>
              <span className="f-pivot" />
            </div>
            <p className="sr-only">{short(p.up)} {D.trade.up}. {short(p.down)} {D.trade.down}.</p>
            <p className="f-seesaw-line">{p.line}</p>
          </figure>)}
        </div>
        <p className="f-trade-close">{D.trade.close}</p>
      </section>
    </div>
  </div>;
}

/** Panel 3: the choice. Three columns whose rows line up, so they compare across. */
function Strength({ node, selected, onPick }: { node: SetupNode; selected: string | null; onPick(id: string): void }) {
  const S = STRENGTH;
  return <div className="f-sheet f-strength">
    <div className="f-panel-top">
      <Heading className="f-setup-h1">{S.title}</Heading>
      <p className="f-setup-lede">{S.lede}</p>
    </div>
    <div className="f-teams" role="group" aria-label={node.question}>
      {node.options.map((o, i) => {
        const on = selected === o.id;
        const raised = raisedBy(o);
        return <article key={o.id} className={'f-team' + (on ? ' is-on' : '')} style={{ ['--i' as string]: i }} onClick={() => onPick(o.id)}>
          <header className="f-team-head">
            <span className={'f-medal q-' + (raised[0]?.[0] ?? 'win')}><Mark name={o.icon in ICON ? o.icon : 'layers'} /></span>
            <h2>{o.title}</h2>
            <kbd className="f-key" aria-hidden="true">{i + 1}</kbd>
          </header>
          <div className="f-team-row">
            <p className="f-row-label is-good"><Mark name="good" />{S.goodAt}</p>
            <p className="f-team-desc">{o.description}</p>
            <p className="f-tags">{o.strengths.map(s => <span key={s}>{s}</span>)}</p>
          </div>
          <div className="f-team-row is-inline">
            <p className="f-row-label is-raises"><Mark name="raises" />{S.raises}</p>
            <p className="f-raise">{raised.map(([d, n]) => <span key={d} className={'q-' + d}><RuleMark id={d} /><b>{COPY.dimensions[d].short}</b><strong>{signed(n)}</strong></span>)}</p>
          </div>
          <div className="f-team-row">
            <p className="f-row-label is-later"><Mark name="later" />{S.later}</p>
            <ul className="f-later">{(STRENGTH_LATER[o.id] ?? []).map(l => <li key={l.text} data-chapter={l.act}><span className="f-act-pill">{DEAL.act} {l.act}</span><span>{l.text}</span></li>)}</ul>
          </div>
          <div className="f-team-row">
            <p className="f-row-label is-short"><Mark name="short" />{S.short}</p>
            <p className="f-team-short">{o.tradeoff}</p>
          </div>
          <button className="f-team-pick" data-choice={o.id} aria-pressed={on} onClick={e => { e.stopPropagation(); onPick(o.id); }}>
            {on ? <><Glyph name="check" />{o.title} {S.chosen}</> : S.choose + ' ' + o.title}
          </button>
        </article>;
      })}
    </div>
  </div>;
}
