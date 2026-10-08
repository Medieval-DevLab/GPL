import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Content, GameState, Mission } from '../../engine/types';
import { BADGE_META } from '../../engine/types';
import { ledger, resolveAdvisorLine, resolveSaidQuote, resolveSituation } from '../../engine/engine';
import { codeFromState, decodeRun } from '../../engine/runcode';
import { COPY } from '../../content/interface';
import { PHOTO_CREDITS, PHOTO_LICENCE } from '../../content/assets';
import { Board } from './Board';

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose(): void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; const previous = document.activeElement as HTMLElement | null; dialog?.showModal(); return () => { dialog?.close(); previous?.focus(); }; }, []);
  return <dialog className="game-dialog" ref={ref} onCancel={onClose} aria-labelledby="dialog-heading" onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')]
      .filter(element => element.checkVisibility?.() ?? (element.getClientRects().length > 0 && (element.tagName === 'SUMMARY' || !element.closest('details:not([open])'))));
    const first = controls[0]; const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}><header><h2 id="dialog-heading">{title}</h2><button onClick={onClose} aria-label={COPY.close}>×</button></header><div className="dialog-body">{children}</div></dialog>;
}

export function History({ state, content, chapter }: { state: GameState; content: Content; chapter?: number }) {
  const speaker = (missionId: string) => { const n = content.nodes[missionId]; return n && 'advisor' in n ? n.advisor?.name : undefined; };
  const history = state.history.filter(h => chapter == null || h.chapter === chapter);
  return <div className="history">{history.length === 0 && <p>{COPY.emptyHistory}</p>}{history.map((h, i) => <details key={h.missionId}>
    <summary><span className="sequence">{String(i + 1).padStart(2, '0')}</span><span><small>{h.missionTitle}</small><strong>{h.headline}</strong></span><span aria-hidden="true">+</span></summary>
    <div><p><b>{COPY.chosen}:</b> {h.chosenLabel}</p><h3>“{h.lesson.principle}”{speaker(h.missionId) && <cite> — {speaker(h.missionId)}</cite>}</h3><p>{h.lesson.because}</p>{h.lesson.watchFor && <p>{h.lesson.watchFor}</p>}</div>
  </details>)}</div>;
}

/**
 * The account file. `chapter` scopes it to one act's decisions (NAV-01): reviewing chapter
 * one while playing chapter three shows chapter one, named as such, and nothing else.
 */
export function AccountFile({ state, content, mission, chapter }: { state: GameState; content: Content; mission?: Mission; chapter?: number }) {
  const [tab, setTab] = useState(chapter ? 'Decisions' : 'Where you stand');
  if (chapter) return <><p className="file-scope">{COPY.stage.chapterReview} {chapter} · {content.chapters[chapter - 1]?.title}</p><History state={state} content={content} chapter={chapter} /></>;
  const tabs = ['Where you stand', ...(mission ? ['Brief'] : []), 'Evidence', 'Decisions', 'Recognition'];
  const evidence = Object.values(content.nodes).flatMap(n => n.kind === 'investigate' ? n.evidence.filter(e => state.discovered.includes(e.id)) : []);
  const entries = ledger(state);
  const quote = mission ? resolveSaidQuote(mission, state) : undefined;
  const advice = mission ? resolveAdvisorLine(mission, state) : undefined;
  return <>
    <div className="tab-row" aria-label="Account file sections">{tabs.map(t => <button key={t} aria-pressed={t === tab} onClick={() => setTab(t)}>{t}{t === 'Evidence' && ' · ' + evidence.length}</button>)}</div>
    {tab === 'Where you stand' && <Board state={state} content={content} values />}
    {tab === 'Brief' && mission && <>
      <h3>{mission.title}</h3><p>{mission.objective}</p>
      {resolveSituation(mission, state).map((line, i) => <p key={i}>{line}</p>)}
      {mission.context && <div className="file-entry">{mission.context.map(c => <p key={c.label}><b>{c.label}:</b> {c.value}</p>)}</div>}
      {quote && <div className="file-entry"><small>{quote.speaker} · {quote.role}</small><p>“{quote.text}”</p></div>}
      {mission.advisor && advice && <div className="file-entry"><small>{mission.advisor.name} · {mission.advisor.role}</small><p>“{advice}”</p></div>}
      {mission.client && <div className="file-entry"><h3>{mission.client.name}</h3><p>{mission.client.blurb}</p>{mission.client.facts.map(f => <p key={f.label}><b>{f.label}:</b> {f.value}</p>)}</div>}
      {mission.concerns && <div className="file-entry"><h3>What matters to the client</h3><ul>{mission.concerns.map(x => <li key={x}>{x}</li>)}</ul></div>}
      {mission.consider && <div className="file-entry"><h3>{mission.advisor ? mission.advisor.name.split(' ')[0] + ' ' + COPY.stage.asks : COPY.stage.consider}</h3><ul>{mission.consider.map(x => <li key={x}>{x}</li>)}</ul></div>}
      {mission.assessment && <div className="file-entry"><h3>The situation now</h3>{mission.assessment.map(x => <p key={x.label}><b>{x.label} · {x.level}</b><br />{x.note}</p>)}</div>}
      {mission.tip && mission.advisor && <div className="file-entry"><small>{mission.advisor.name}</small><p>{mission.tip}</p></div>}
    </>}
    {tab === 'Evidence' && <>{evidence.length === 0 && <p>{COPY.emptyEvidence}</p>}{evidence.map(e => <section className="file-entry" key={e.id}><small>Investigated · Chapter 1</small><h3>{e.label}</h3><p>{e.reveals}</p></section>)}</>}
    {tab === 'Commitments' && <>{entries.length === 0 && <p>{COPY.emptyLedger}</p>}{entries.map((e, i) => <section className="file-entry" key={i}><h3>{e.label}</h3><p>{e.detail}</p></section>)}</>}
    {tab === 'Decisions' && <History state={state} content={content} />}
    {tab === 'Recognition' && <>{state.badges.length === 0 && <p>{COPY.stage.nothingNoted}</p>}{state.badges.map(id => <section className="file-entry" key={id}><small>{COPY.stage.noticed}</small><h3>{BADGE_META[id].label}</h3><p>{BADGE_META[id].note}</p></section>)}</>}
  </>;
}

export function RunCode({ state, content, onCode, onRestored }: { state: GameState; content: Content; onCode(code: string): string | null; onRestored(): void }) {
  const [value, setValue] = useState(''); const [message, setMessage] = useState(''); const code = codeFromState(state, content);
  const [pending, setPending] = useState<{ code: string; count: number } | null>(null);
  const previewRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (pending) previewRef.current?.focus(); }, [pending]);
  return <>
    <p>{COPY.codeHelp}</p>
    {code ? <><label htmlFor="current-code">Your current run code</label><input id="current-code" readOnly value={code} onFocus={e => e.currentTarget.select()} />
      <div className="dialog-actions"><button className="secondary" onClick={async () => { try { await navigator.clipboard.writeText(code); setMessage(COPY.copied); } catch { setMessage('Select the code above and copy it manually.'); } }}>{COPY.copy}</button></div></> : <p>{COPY.noCode}</p>}
    <form onSubmit={e => { e.preventDefault(); const result = decodeRun(content, value); if (!result.ok) { setPending(null); setMessage(result.message); } else { setMessage(''); setPending({ code: value, count: result.state.completed.length }); } }}>
      <label htmlFor="restore-code">Enter a run code</label>
      <input id="restore-code" value={value} onChange={e => { setValue(e.target.value); setPending(null); setMessage(''); }} maxLength={200} autoComplete="off" spellCheck={false} required />
      <div className="dialog-actions"><button className="secondary" type="submit">{COPY.restore}</button></div>
    </form>
    <p role="status">{message}</p>
    {pending && <section className="restore-preview" aria-labelledby="restore-heading">
      <h3 id="restore-heading" ref={previewRef} tabIndex={-1}>Replace this browser’s engagement?</h3>
      <p>The incoming run contains {pending.count} committed decisions. Restoring it replaces your current saved progress, unfinished choices, reflections and personal action plan.</p>
      <p>A run code cannot recover your notes. Download your debrief first if you want to keep them.</p>
      <div className="dialog-actions"><button className="secondary" onClick={() => { setPending(null); document.getElementById('restore-code')?.focus(); }}>Keep current engagement</button><button className="secondary is-strong" onClick={() => { const error = onCode(pending.code); if (error) setMessage(error); else onRestored(); }}>Replace and restore</button></div>
    </section>}
  </>;
}

export function Help() {
  return <>
    {COPY.helpItems.map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}
    <section><h3>{COPY.position}</h3><p>Three indicators show the state of the deal — {COPY.dimensions.win.question.toLowerCase()} {COPY.dimensions.profit.question.toLowerCase()} {COPY.dimensions.deliver.question.toLowerCase()} {COPY.positionNote}</p></section>
    <h3>Business glossary</h3>
    {COPY.glossary.map(([title, text]) => <details key={title}><summary>{title}</summary><p>{text}</p></details>)}
    <p className="note-text">{COPY.fiction}</p>
    <details><summary>Photography credits and licence</summary><p>Photographs are bundled locally under the <a href={PHOTO_LICENCE} target="_blank" rel="noreferrer">Pexels licence</a>. Cut-out portraits are background-removed versions of the same photographs.</p>
      <ul>{PHOTO_CREDITS.map(credit => <li key={credit.asset}><a href={credit.source} target="_blank" rel="noreferrer">{credit.photographer}</a> · {credit.asset.startsWith('photo-') ? 'Character portrait' : credit.asset.startsWith('cut-') ? 'Character cut-out' : 'Location'}</li>)}</ul></details>
  </>;
}

export interface Preferences { reducedMotion: boolean; largeText: boolean; sound: boolean }
export function Settings({ prefs, onChange, onRestart }: { prefs: Preferences; onChange(p: Partial<Preferences>): void; onRestart(): void }) {
  return <>
    <label className="preference"><input type="checkbox" checked={prefs.reducedMotion} onChange={e => onChange({ reducedMotion: e.target.checked })} /><span><strong>Reduce motion</strong><small>Remove screen entrance animations. Your system preference is also respected.</small></span></label>
    <label className="preference"><input type="checkbox" checked={prefs.largeText} onChange={e => onChange({ largeText: e.target.checked })} /><span><strong>Larger reading text</strong><small>More room for the words. You can also use your browser’s zoom.</small></span></label>
    <label className="preference"><input type="checkbox" checked={prefs.sound} onChange={e => onChange({ sound: e.target.checked })} /><span><strong>Interface sound</strong><small>Quiet sounds for selecting, committing and turning pages. Off by default; nothing in the game depends on it.</small></span></label>
    <p className="note-text">Progress is stored in this browser, not in a personal account. On a shared computer, keep your run code and start a new engagement for the next learner.</p>
    <div className="dialog-actions"><button className="secondary" onClick={onRestart}>{COPY.restart}</button></div>
  </>;
}
