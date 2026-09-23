import { useEffect, useRef, useState, type ReactNode } from 'react';
import { availableOptions, canCommit, causalClaim, causalThreads, finalVerdict, ledger, requiredSelectionCount, resolveAdvisorLine, resolveSaidQuote, resolveSituation } from '../engine/engine';
import { codeFromState } from '../engine/runcode';
import { BADGE_META, isMission, type Content, type GameNode, type GameState, type Mission, type Option } from '../engine/types';
import { COPY } from '../content/interface';
import { EARNED } from '../content/gates';
import { CHARACTERS, characterByName } from '../content/characters';
import { CHAPTER_PRESENTATION } from '../content/presentation';
import { PHOTO_CREDITS, PHOTO_LICENCE } from '../content/assets';
import type { ResumeState, Session } from '../session';

interface Props {
  session: Session; node: GameNode; content: Content; home: boolean; resume: ResumeState; saveError: boolean;
  onAdvance(): void; onStart(): void; onResume(s: Session): void; onView(view: 'play' | 'map'): void;
  onToggle(id: string): void; onAdvantage(id: string): void; onSetup(): void; onCommit(): void;
  onReflect(answer: string): void; onFinish(): void; onCode(code: string): string | null;
}
type Drawer = 'file' | 'help' | 'settings' | 'code' | 'restart' | null;
const scene = (chapter: number) => './art/scene-chapter-' + chapter + '.webp';
const photo = (name: string) => { const character = characterByName(name); return character ? './art/' + character.portrait + '.webp' : scene(2); };
const goals = CHAPTER_PRESENTATION.map(chapter => chapter.goal);
function Heading({ children }: { children: ReactNode }) { return <h1 id="game-heading" tabIndex={-1}>{children}</h1>; }
function Paras({ lines }: { lines: readonly string[] }) { return <>{lines.map((line, i) => <p key={i}>{line}</p>)}</>; }
function Action({ children, onClick, disabled = false }: { children: ReactNode; onClick(): void; disabled?: boolean }) {
  return <button className="primary" data-primary data-action="primary" onClick={event => { if (event.detail < 2) onClick(); }} onKeyDown={event => { if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault(); }} disabled={disabled}>{children}<span aria-hidden="true">↗</span></button>;
}
function Photo({ src, className = '' }: { src: string; className?: string }) {
  const character = Object.values(CHARACTERS).find(c => src.endsWith(c.portrait + '.webp'));
  return <img className={'photo ' + className} src={src} alt="" decoding="async" style={character ? { objectPosition: character.focus } : undefined} onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />;
}
function Person({ name, role, line, large = false }: { name: string; role: string; line?: string; large?: boolean }) {
  return <div className={'person ' + (large ? 'person-large' : '')}><Photo src={photo(name)} /><div><strong>{name}</strong><small>{role}</small>{line && <p>“{line}”</p>}</div></div>;
}
function BriefText({ mission, state, complete = false }: { mission: Mission; state: GameState; complete?: boolean }) {
  const quote = resolveSaidQuote(mission, state);
  const advice = resolveAdvisorLine(mission, state);
  return <div className="brief-text"><Paras lines={resolveSituation(mission, state)} />
    {mission.context && <dl className="facts">{mission.context.map(c => <div key={c.label}><dt>{c.label}</dt><dd>{c.value}</dd></div>)}</dl>}
    {quote && <blockquote><p>“{quote.text}”</p><cite>{quote.speaker} · {quote.role}</cite></blockquote>}
    {mission.advisor && advice && <Person name={mission.advisor.name} role={mission.advisor.role} line={advice} />}
    {complete && <>
      {mission.client && <section><h3>{mission.client.name}</h3><p>{mission.client.blurb}</p><dl className="facts">{mission.client.facts.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl></section>}
      {mission.concerns && <section><h3>What matters to the client</h3><ul>{mission.concerns.map(x => <li key={x}>{x}</li>)}</ul></section>}
      {mission.consider && <section><h3>Questions to consider</h3><ul>{mission.consider.map(x => <li key={x}>{x}</li>)}</ul></section>}
      {mission.assessment && <section><h3>The situation now</h3>{mission.assessment.map(x => <p key={x.label}><strong>{x.label} · {x.level}</strong><br />{x.note}</p>)}</section>}
      {mission.tip && <p className="note">{mission.tip}</p>}
    </>}
  </div>;
}
function History({ state, chapter }: { state: GameState; chapter?: number }) {
  const history = state.history.filter(h => chapter == null || h.chapter === chapter);
  return <div className="history">{history.length === 0 && <p>{COPY.emptyHistory}</p>}{history.map((h, i) => <details key={h.missionId}><summary><span className="sequence">{String(i + 1).padStart(2, '0')}</span><span><small>{h.missionTitle}</small><strong>{h.headline}</strong></span><span aria-hidden="true">+</span></summary><div><p><b>{COPY.chosen}:</b> {h.chosenLabel}</p><h3>{h.lesson.principle}</h3><p>{h.lesson.because}</p>{h.lesson.watchFor && <p>{h.lesson.watchFor}</p>}</div></details>)}</div>;
}
function AccountFile({ state, content, mission }: { state: GameState; content: Content; mission?: Mission }) {
  const [tab, setTab] = useState(mission ? 'Brief' : 'Decisions');
  const tabs = [...(mission ? ['Brief'] : []), 'Evidence', 'Commitments', 'Decisions', 'Recognition'];
  const evidence = Object.values(content.nodes).flatMap(n => n.kind === 'investigate' ? n.evidence.filter(e => state.discovered.includes(e.id)) : []);
  const entries = ledger(state);
  return <><div className="tab-row" aria-label="Account file sections">{tabs.map(t => <button key={t} aria-pressed={t === tab} onClick={() => setTab(t)}>{t}{t === 'Evidence' && ' · ' + evidence.length}</button>)}</div>
    {tab === 'Brief' && mission && <><h3>{mission.title}</h3><p className="objective">{mission.objective}</p><BriefText mission={mission} state={state} complete /></>}
    {tab === 'Evidence' && <>{evidence.length === 0 && <p>{COPY.emptyEvidence}</p>}{evidence.map(e => <section className="file-entry" key={e.id}><small>Investigated · Chapter 1</small><h3>{e.label}</h3><p>{e.reveals}</p></section>)}</>}
    {tab === 'Commitments' && <>{entries.length === 0 && <p>{COPY.emptyLedger}</p>}{entries.map((e, i) => <section className="file-entry" key={i}><h3>{e.label}</h3><p>{e.detail}</p></section>)}</>}
    {tab === 'Decisions' && <History state={state} />}
    {tab === 'Recognition' && <>{state.badges.length === 0 && <p>Recognition appears here when your decisions earn it.</p>}{state.badges.map(id => <section className="file-entry" key={id}><small>Recognition earned</small><h3>{BADGE_META[id].label}</h3><p>{BADGE_META[id].note}</p></section>)}</>}
  </>;
}
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose(): void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; const previous = document.activeElement as HTMLElement | null; dialog?.showModal(); return () => { dialog?.close(); previous?.focus(); }; }, []);
  return <dialog className="game-dialog" ref={ref} onCancel={onClose} aria-labelledby="dialog-heading" onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(element => element.checkVisibility?.() ?? (element.getClientRects().length > 0 && (element.tagName === 'SUMMARY' || !element.closest('details:not([open])'))));
    const first = controls[0]; const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}><header><h2 id="dialog-heading">{title}</h2><button onClick={onClose} aria-label={COPY.close}>×</button></header><div className="dialog-body">{children}</div></dialog>;
}
function RunCode({ state, content, onCode }: { state: GameState; content: Content; onCode(code: string): string | null }) {
  const [value, setValue] = useState(''); const [message, setMessage] = useState(''); const code = codeFromState(state, content);
  return <><p>{COPY.codeHelp}</p>{code ? <><label htmlFor="current-code">Your current run code</label><input id="current-code" readOnly value={code} onFocus={e => e.currentTarget.select()} /><button className="secondary" onClick={async () => { try { await navigator.clipboard.writeText(code); setMessage(COPY.copied); } catch { setMessage('Select the code above and copy it manually.'); } }}>{COPY.copy}</button></> : <p>{COPY.noCode}</p>}
    <form onSubmit={e => { e.preventDefault(); setMessage(onCode(value) ?? 'Engagement restored.'); }}><label htmlFor="restore-code">Enter a run code</label><input id="restore-code" value={value} onChange={e => setValue(e.target.value)} maxLength={200} autoComplete="off" spellCheck={false} required /><button className="primary" type="submit">{COPY.restore}</button></form><p role="status">{message}</p></>;
}
function ChoiceCard({ option, selected, enabled, dialogue, onToggle, index }: { option: Option; selected: boolean; enabled: boolean; dialogue: boolean; onToggle(): void; index: number }) {
  return <div className={'choice-card ' + (selected ? 'is-selected ' : '') + (!enabled ? 'is-locked' : '')}>
    <button className="choice-select" data-choice={option.id} aria-pressed={selected} disabled={!enabled} onClick={onToggle}>
      <span className="option-number">{selected ? '✓' : String(index + 1).padStart(2, '0')}</span>
      <span><strong>{option.title}</strong><span className="option-description">{dialogue && option.say ? '“' + option.say + '”' : option.description}</span></span>
    </button>
    {option.commits && <p className="commitment"><small>{COPY.cost}</small>{option.commits}</p>}
    {!enabled && <div className="gate-note"><b>Unavailable on this path.</b><p>{COPY.unavailable}</p>{option.requires?.all?.map(flag => <p key={flag}>Requires {EARNED[flag]?.as ?? 'an earlier commitment'}<small>{EARNED[flag]?.where}</small></p>)}{option.requires?.any && <p>Requires one of: {option.requires.any.map(flag => EARNED[flag]?.as ?? 'an earlier commitment').join(' or ')}.</p>}</div>}
    {(option.pros?.length || option.cons?.length || option.cost) ? <details><summary>Inspect the approach</summary><div className="approach-detail">{option.pros && <><b>What the approach offers</b><ul>{option.pros.map(x => <li key={x}>{x}</li>)}</ul></>}{option.cons && <><b>What you give up</b><ul>{option.cons.map(x => <li key={x}>{x}</li>)}</ul></>}{option.cost && <p>Relative effort: {option.cost.time}/3 · Investment: {option.cost.investment}/3</p>}</div></details> : null}
  </div>;
}
function Attribution({ state, content }: { state: GameState; content: Content }) {
  const claim = causalClaim(state, content); const [answer, setAnswer] = useState<string | null>(null);
  if (!claim) return null;
  return <section className="attribution"><p className="eyebrow">OPTIONAL · CONNECT THE MOMENTS</p><h2>What set this in motion?</h2><p>{claim.soLater}</p><div className="reflection-options">{claim.candidates.map(c => <button key={c.id} aria-pressed={answer === c.id} onClick={() => setAnswer(c.id)}>{c.text}</button>)}</div>{answer && <p role="status">{answer === claim.answerId ? 'That is the connection this run demonstrated.' : 'That is not the causal link demonstrated here. Revisit the moments above and try again.'}</p>}<small>This reflection is not scored.</small></section>;
}
function downloadSummary(state: GameState, content: Content) {
  const verdict = finalVerdict(state.dims, state.flags);
  const text = [COPY.brand, 'Engagement debrief — fictional learning simulation', '', verdict.title, verdict.summary, '', ...state.history.flatMap(h => [h.missionTitle, 'Your commitment: ' + h.chosenLabel, h.headline, h.lesson.principle, h.lesson.because, h.lesson.watchFor ?? '', '']), ...causalThreads(state, content).flatMap(t => ['Because: ' + t.because, 'So later: ' + t.soLater, '']), 'Run code: ' + (codeFromState(state, content) ?? ''), 'Run codes contain decisions, not your identity. No certification or pass score is implied.'].join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'gpl-engagement-debrief.txt'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Game(props: Props) {
  const { session, node, content } = props; const { game: state, presentation } = session;
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [reducedMotion, setReducedMotion] = useState(() => { try { return localStorage.getItem('gpl.motion') === 'reduced'; } catch { return false; } });
  const [largeText, setLargeText] = useState(() => { try { return localStorage.getItem('gpl.reading') === 'large'; } catch { return false; } });
  const mission = isMission(node) ? node : undefined;
  const currentChapter = 'chapter' in node ? node.chapter : state.history.at(-1)?.chapter ?? 1;
  const chapter = content.chapters.find(c => c.number === currentChapter) ?? content.chapters[0];
  const atHome = state.phase === 'title' || props.home;
  const atMap = !atHome && presentation.view === 'map';
  const screen = atHome ? 'welcome' : atMap ? 'journey' : node.kind === 'interlude' ? node.role ?? 'chapter-open' : state.phase === 'decide' && mission ? mission.presentation === 'dialogue' ? mission.surface ?? 'call' : mission.presentation === 'apply' ? 'apply' : mission.kind : state.phase;
  const route = screen + ':' + state.nodeId + ':' + state.phase;
  useEffect(() => { setDrawer(null); }, [route]);
  const openFile = () => setDrawer('file');
  const start = () => { if (props.resume.candidates.length || state.phase !== 'title') setDrawer('restart'); else props.onStart(); };
  let body: ReactNode = null;

  if (atHome) body = <section className="welcome">
    <Photo src={scene(1)} className="welcome-photo" /><div className="welcome-shade" />
    <div className="welcome-copy"><p className="eyebrow">THE ENGAGEMENT · AN INTERACTIVE BUSINESS STORY</p><Heading>{COPY.welcome}</Heading><p className="welcome-premise">{COPY.premise}</p><p className="role-line">{COPY.role}</p>
      {props.resume.candidates.length > 1 && <p className="notice">{COPY.conflict}</p>}
      <div className="welcome-actions">{props.resume.candidates.map(saved => <div className="resume-choice" key={saved.source}><Action onClick={() => props.onResume(saved.session)}>{props.resume.candidates.length === 1 ? COPY.resume : saved.source === 'local' ? 'Continue browser engagement' : 'Continue learning-platform engagement'}</Action><small>{saved.session.game.completed.length} decisions made · {content.nodes[saved.session.game.nodeId].kind === "ending" ? "Completed engagement" : "title" in content.nodes[saved.session.game.nodeId] ? (content.nodes[saved.session.game.nodeId] as { title: string }).title : "Engagement in progress"}</small></div>)}
        <button className={props.resume.candidates.length ? 'text-button' : 'primary'} data-primary={!props.resume.candidates.length || undefined} onClick={start}>{props.resume.candidates.length ? COPY.restart : COPY.start}<span aria-hidden="true">↗</span></button></div>
      {props.resume.local.status === 'stale' && <p className="notice">{props.resume.local.message}{props.resume.local.code && <><br />Saved code: <code>{props.resume.local.code}</code></>}</p>}
      {props.resume.invalidLms && <p className="notice">{COPY.invalidLms}</p>}
      <div className="format-line"><b>{COPY.format}</b><small>{COPY.duration}</small></div></div>
    <div className="welcome-caption"><span className="scene-dot" />ORION RETAIL<small>One client. A relationship you build.</small></div>
    <div className="chapter-preview">{content.chapters.map(c => <div key={c.number}><span>0{c.number}</span><p>{c.label}</p></div>)}</div>
  </section>;

  else if (atMap) body = <section className="journey-screen page">
    <div className="page-title"><div><p className="eyebrow">YOUR ENGAGEMENT · THE BIG PICTURE</p><Heading>Every step changes the next.</Heading></div><p>{state.completed.length} of {content.missionOrder.length} decisions made<br /><span className="muted">A journey from first contact to delivery.</span></p></div>
    <div className="chapter-path">{content.chapters.map(c => {
      const count = c.missionIds.filter(id => state.completed.includes(id)).length;
      const done = count === c.missionIds.length; const current = c.number === currentChapter && state.phase !== 'ending';
      return <article className={'chapter-stop ' + (current ? 'current ' : '') + (done ? 'done' : '')} key={c.number}>
        <div className="chapter-image"><Photo src={scene(c.number)} /><span className="chapter-number">0{c.number}</span><span className="chapter-state">{done ? 'Completed' : current ? 'You are here' : state.phase === 'ending' ? count > 0 ? 'Ended here' : 'Not reached on this path' : 'Ahead'}</span></div>
        <div className="chapter-copy"><p className="eyebrow">{c.label}</p><h2>{c.title}</h2><p>{goals[c.number - 1]}</p><small>{count}/{c.missionIds.length} decisions</small>
          {current && <Action onClick={() => props.onView('play')}>{node.kind === 'interlude' && node.role === 'chapter-open' ? COPY.enter : COPY.back}</Action>}
          {done && <button className="text-button" onClick={openFile}>Review your decisions ↗</button>}
        </div></article>;
    })}</div>
    <section className="journey-note"><span className="large-mark">↗</span><div><h2>Your choices travel with you.</h2><p>Information you uncover, people you involve and promises you make will return in later chapters. There is no timer. Take the time to read the room.</p></div>{state.phase === 'ending' && <button className="secondary" onClick={() => props.onView('play')}>Return to your debrief</button>}</section>
  </section>;

  else if (node.kind === 'setup') body = <section className="setup-screen page">
    <div className="setup-intro"><div><p className="eyebrow">BEFORE YOU BEGIN · YOUR TEAM</p><Heading>{node.title}</Heading><Paras lines={node.body} /></div><div className="setup-photo"><Photo src={scene(2)} /><span>A team to lead.<br />A starting point to choose.</span></div></div>
    <h2 className="question">{node.question}</h2><div className="setup-options">{node.options.map((o, i) => <button className={'setup-option ' + (presentation.advantage === o.id ? 'is-selected' : '')} data-choice={o.id} aria-pressed={presentation.advantage === o.id} onClick={() => props.onAdvantage(o.id)} key={o.id}><span className="option-number">{presentation.advantage === o.id ? '✓' : '0' + (i + 1)}</span><h3>{o.title}</h3><p>{o.description}</p><div className="strengths">{o.strengths.map(x => <span key={x}>{x}</span>)}</div><p className="tradeoff"><b>The trade-off</b><br />{o.tradeoff}</p></button>)}</div>
    <div className="action-footer"><p>Different strengths. Different starting conversations.</p><Action disabled={!presentation.advantage} onClick={props.onSetup}>{COPY.setup}</Action></div>
  </section>;

  else if (node.kind === 'interlude' && node.role === 'chapter-debrief') body = <section className="debrief-screen page"><div className="debrief-top"><div><p className="eyebrow">CHAPTER {node.chapter} · DEBRIEF</p><Heading>{node.title}</Heading><Paras lines={node.body} /></div><div className="milestone"><span aria-hidden="true">✦</span><small>MILESTONE REACHED</small><h2>{node.milestone ?? chapter.title}</h2><p>{state.history.filter(h => h.chapter === node.chapter).length} decisions, carried forward.</p></div></div><History state={state} chapter={node.chapter} /><div className="action-footer"><p>{node.chapter < 5 ? 'Next · ' + content.chapters[node.chapter].title : 'Your complete engagement is ready to review.'}</p><Action onClick={props.onAdvance}>{node.chapter < 5 ? 'Return to the journey' : 'Review your engagement'}</Action></div></section>;

  else if (node.kind === 'interlude' && node.role === 'reflection') body = <section className="reflection-screen"><div className="reflection-image"><Photo src={scene(node.chapter)} /><div><p className="eyebrow">A MOMENT BETWEEN DECISIONS</p><p>Pause.<br />Look back.<br />Take it forward.</p></div></div><div className="reflection-copy"><p className="eyebrow">CHAPTER {node.chapter} · REFLECTION</p><Heading>{node.title}</Heading><Paras lines={node.body} />{node.advisor && <Person name={node.advisor.name} role={node.advisor.role} />}<h2>{node.prompt}</h2><div className="reflection-options">{node.responses?.map(answer => <button key={answer} aria-pressed={presentation.reflections[node.id] === answer} onClick={() => props.onReflect(answer)}>{presentation.reflections[node.id] === answer ? '✓ ' : ''}{answer}</button>)}</div><p className="muted">{COPY.reflectionNote}</p><Action onClick={props.onAdvance}>{presentation.reflections[node.id] ? COPY.next : 'Continue without a response'}</Action></div></section>;

  else if (node.kind === 'interlude') body = <section className={'cinematic ' + (node.role === 'turn' ? 'story-turn' : '')}><Photo src={scene(node.chapter)} /><div className="cinematic-shade" /><div className="cinematic-copy"><p className="eyebrow">{node.role === 'turn' ? 'THE SITUATION HAS CHANGED' : 'CHAPTER 0' + node.chapter + ' / 05 · ' + chapter.label}</p><Heading>{node.title}</Heading><div className="cinematic-body"><Paras lines={node.body} /></div>{node.prompt && <blockquote>{node.prompt}</blockquote>}{node.role !== 'turn' && <p className="chapter-goal">{goals[node.chapter - 1]}</p>}<Action onClick={props.onAdvance}>{node.role === 'turn' ? COPY.next : COPY.begin}</Action></div>{node.role !== 'turn' && <aside className="chapter-agenda"><p className="eyebrow">IN THIS CHAPTER</p><ol>{chapter.steps.map((step, i) => <li key={step}><span>0{i + 1}</span>{step}</li>)}</ol><Person name={CHARACTERS[CHAPTER_PRESENTATION[node.chapter - 1].advisor].name} role={CHARACTERS[CHAPTER_PRESENTATION[node.chapter - 1].advisor].role} /></aside>}</section>;

  else if (state.phase === 'brief' && mission) body = <section className="brief-screen"><div className="brief-scene"><Photo src={scene(mission.chapter)} /><div className="brief-scene-shade" /><div className="brief-scene-copy"><p className="eyebrow">CHAPTER 0{mission.chapter} · {chapter.label}</p><p className="scene-title">{mission.title}</p><p>{mission.objective}</p><span className="scene-label">{mission.minutes} MIN · READ THE SITUATION</span></div></div><div className="brief-reading"><p className="eyebrow">DECISION {content.missionOrder.indexOf(mission.id) + 1} OF {content.missionOrder.length} · YOUR BRIEF</p><Heading>{mission.title}</Heading><BriefText mission={mission} state={state} /><details className="supporting-brief"><summary>Client context and questions to consider</summary><div>{mission.client && <><h3>{mission.client.name}</h3><p>{mission.client.blurb}</p>{mission.client.facts.map(f => <p key={f.label}><b>{f.label}:</b> {f.value}</p>)}</>}{mission.concerns && <ul>{mission.concerns.map(x => <li key={x}>{x}</li>)}</ul>}{mission.consider && <ul>{mission.consider.map(x => <li key={x}>{x}</li>)}</ul>}{mission.assessment?.map(f => <p key={f.label}><b>{f.label} · {f.level}</b><br />{f.note}</p>)}{mission.tip && <p>{mission.tip}</p>}</div></details><div className="brief-action"><p className="objective">{mission.objective}</p><Action onClick={props.onAdvance}>{COPY.choices}</Action></div></div></section>;

  else if (state.phase === 'decide' && mission) {
    const allowed = new Set(availableOptions(mission, state).map(o => o.id));
    const dialogue = mission.presentation === 'dialogue'; const apply = mission.presentation === 'apply';
    const quote = resolveSaidQuote(mission, state);
    const advisor = mission.advisor;
    const internal = mission.room === 'internal' || !quote;
    const speaker = internal ? advisor?.name ?? 'Your colleague' : quote!.speaker;
    const speakerRole = internal ? advisor?.role ?? 'Engagement team' : quote!.role;
    const line = internal ? resolveAdvisorLine(mission, state) : quote!.text;
    const need = requiredSelectionCount(mission);
    const options = mission.kind === 'choice' ? <div className={'choice-grid ' + (dialogue || apply ? 'replies' : '')}>{mission.options.map((o, i) => <ChoiceCard key={o.id} option={o} index={i} selected={state.selection.includes(o.id)} enabled={allowed.has(o.id)} dialogue={dialogue || apply} onToggle={() => props.onToggle(o.id)} />)}</div> :
      <div className="allocation-grid">{(mission.kind === 'investigate' ? mission.evidence.map(e => ({ id: e.id, title: e.label, description: e.question, tag: 'Question to investigate' })) : mission.components).map((o, i) => <button key={o.id} className={'allocation-card ' + (state.selection.includes(o.id) ? 'is-selected' : '')} data-choice={o.id} aria-pressed={state.selection.includes(o.id)} onClick={() => props.onToggle(o.id)}><span className="option-number">{state.selection.includes(o.id) ? '✓' : '0' + (i + 1)}</span><small>{o.tag}</small><h3>{o.title}</h3><p>{o.description}</p></button>)}</div>;
    body = <section className={'decision-screen page ' + (dialogue ? 'conversation ' + (mission.surface ?? 'call') : apply ? 'application' : mission.kind)}>
      <div className="decision-heading"><div><p className="eyebrow">CHAPTER 0{mission.chapter} · DECISION {content.missionOrder.indexOf(mission.id) + 1} / {content.missionOrder.length}</p><Heading>{mission.question}</Heading>{mission.prompt && <p>{mission.prompt}</p>}</div><button className="secondary" onClick={openFile}>{COPY.audit} ↗</button></div>
      <div className="decision-stage">{(dialogue || apply) ? <aside className="conversation-person"><div className="portrait-stage"><Photo src={photo(speaker)} /><span className="scene-label">{apply ? 'YOUR EVIDENCE, IN THE ROOM' : mission.surface === 'call' ? 'CLIENT MEETING · TEXT SIMULATION' : 'ENGAGEMENT MESSAGES'}</span></div><div className="speaker-copy"><strong>{speaker}</strong><small>{speakerRole}</small>{line && <blockquote>“{line}”</blockquote>}{internal && quote && <details><summary>Message from {quote.speaker}</summary><p>“{quote.text}”</p></details>}</div></aside> : <div className="decision-context"><Photo src={scene(mission.chapter)} /><div><p className="eyebrow">{mission.kind === 'investigate' ? 'YOUR DISCOVERY WINDOW' : mission.kind === 'build' ? 'BUILD THE WORK, NOT A WISH LIST' : 'THE CHOICE IN FRONT OF YOU'}</p><p>{mission.objective}</p></div></div>}
        <div className="decision-options"><div className="selection-guide"><b>{mission.kind === 'choice' ? 'Choose one approach' : 'Choose exactly ' + need}</b><span role="status">{state.selection.length} of {need} selected</span></div>{options}</div></div>
      <div className="action-footer"><p>{state.selection.length === need ? 'Review your selection. Committing moves the story forward.' : mission.kind === 'choice' ? 'Select an approach to continue.' : 'Select ' + need + ' items. Select an item again to remove it.'}</p><Action onClick={props.onCommit} disabled={!canCommit(state, content)}>{mission.kind === 'investigate' ? COPY.investigate : mission.kind === 'build' ? COPY.assemble : dialogue ? COPY.send : COPY.commit}</Action></div>
    </section>;
  }

  else if (state.phase === 'consequence' && state.resolution) {
    const result = state.resolution;
    body = <section className={'result-screen page ' + result.outcome.tone}><div className="result-layout"><aside className="result-scene"><Photo src={scene(currentChapter)} /><div><p className="eyebrow">DECISION COMMITTED</p><h2>{result.chosenLabel}</h2><p>This is now part of your engagement.</p></div></aside><div className="result-content"><p className="eyebrow">WHAT HAPPENED · CHAPTER {currentChapter}</p><Heading>{result.outcome.headline}</Heading><p className="result-detail">{result.outcome.detail}</p><ul className="changed-list">{result.outcome.changed.map(x => <li key={x}>{x}</li>)}</ul>
      {result.revealed.length > 0 && <section className="findings"><h2>Added to your account file</h2>{result.revealed.map(e => <div key={e.id}><h3>{e.label}</h3><p>{e.reveals}</p></div>)}</section>}
      <section className="lesson"><p className="eyebrow">{COPY.why}</p><h2>{result.lesson.principle}</h2><p>{result.lesson.because}</p>{result.lesson.watchFor && <p><b>{COPY.forward}:</b> {result.lesson.watchFor}</p>}</section>
      <details className="outcome-dimensions"><summary>Business position after this decision</summary><p>These are simulation indicators, not a personal score or a prediction.</p><dl className="facts">{(['win', 'profit', 'deliver'] as const).map(d => <div key={d}><dt>{{ win: 'Winability', profit: 'Profitability', deliver: 'Deliverability' }[d]}</dt><dd>{result.dimsBefore[d]} → {result.dimsAfter[d]} / 100</dd></div>)}</dl></details>{result.newBadges.map(id => <div className="recognition" key={id}><span aria-hidden="true">✦</span><div><small>RECOGNITION EARNED</small><h3>{BADGE_META[id].label}</h3><p>{BADGE_META[id].note}</p></div></div>)}
    </div></div><div className="action-footer"><button className="text-button" onClick={openFile}>Open your updated account file ↗</button><Action onClick={props.onAdvance}>{COPY.next}</Action></div></section>;
  }

  else if (state.phase === 'ending') {
    const verdict = finalVerdict(state.dims, state.flags); const threads = causalThreads(state, content);
    body = <section className="ending-screen page"><div className="ending-hero"><Photo src={scene(currentChapter)} /><div><p className="eyebrow">YOUR ENGAGEMENT · THE COMPLETE PICTURE</p><Heading>{verdict.title}</Heading><p>{verdict.summary}</p><span>{state.completed.length} decisions made · {state.badges.length} recognitions earned</span></div></div><div className="ending-body"><section><p className="eyebrow">THE MEMORY OF YOUR DECISIONS</p><h2>Earlier, you chose. Later, it mattered.</h2>{threads.length ? threads.map((t, i) => <div className="causal-thread" key={i}><p><small>BECAUSE</small>{t.because}</p><span aria-hidden="true">→</span><p><small>SO LATER</small>{t.soLater}</p></div>) : <p>Review the decisions below to see what each approach changed. Try a different path to explore how earlier commitments can return later.</p>}</section><section><p className="eyebrow">YOUR DECISION RECORD</p><History state={state} /></section><Attribution state={state} content={content} /><section className="takeaway"><h2>Take the learning into your next engagement.</h2><p>What would you ask earlier? Which promise would you make differently? Use your decision record to discuss those moments with your team.</p><div className="dialog-actions"><button className="secondary" onClick={() => setDrawer('code')}>{COPY.code}</button><button className="secondary" onClick={() => downloadSummary(state, content)}>Download your debrief</button></div></section></div><div className="action-footer"><button className="secondary" onClick={props.onFinish}>Return to the home screen</button><Action onClick={start}>Explore a different path</Action></div></section>;
  }
  return <div className={'gpl-game ' + (largeText ? 'large-reading ' : '') + (reducedMotion ? 'reduce-motion' : '')} data-screen={screen} data-node={node.id} data-phase={state.phase}>
    <a className="skip-link" href="#game-heading">Skip to the activity</a><header className="topbar"><a className="wordmark" href="#game-heading" aria-label={COPY.brand}><span className="brand-mark">gpl<span>.</span></span><span>{COPY.brand}<small>{COPY.subtitle}</small></span></a><nav aria-label="Game navigation">{!atHome && state.phase !== 'setup' && <button aria-pressed={atMap} onClick={() => props.onView(atMap ? 'play' : 'map')}>{COPY.journey}<span className="nav-count">{state.completed.length}/{content.missionOrder.length}</span></button>}{!atHome && <button onClick={openFile}>{COPY.record}</button>}<button onClick={() => setDrawer('help')}>{COPY.help}</button><button className="icon-button" aria-label={COPY.settings} onClick={() => setDrawer('settings')}>⚙</button></nav></header>
    {props.saveError && <div className="save-warning" role="status">{COPY.saving} <button onClick={() => setDrawer('code')}>{COPY.code}</button></div>}
    <main key={route} className="screen-transition">{body}</main>
    <footer className="site-footer"><span>{COPY.brand} · Learning through decisions</span><span>Fictional scenario · No timer · No audio required</span><button onClick={() => setDrawer('code')}>{COPY.code} ↗</button></footer>
    {drawer && <Modal title={drawer === 'file' ? COPY.record : drawer === 'help' ? COPY.help : drawer === 'settings' ? COPY.settings : drawer === 'restart' ? COPY.restart : COPY.code} onClose={() => setDrawer(null)}>
      {drawer === 'file' && <AccountFile state={state} content={content} mission={mission} />}
      {drawer === 'help' && <>{COPY.helpItems.map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}<h2>Business glossary</h2>{COPY.glossary.map(([title, text]) => <details key={title}><summary>{title}</summary><p>{text}</p></details>)}<p className="note">{COPY.fiction}</p><details><summary>Photography credits and licence</summary><p>Photographs are bundled locally under the <a href={PHOTO_LICENCE} target="_blank" rel="noreferrer">Pexels licence</a>.</p><ul>{PHOTO_CREDITS.map(credit => <li key={credit.asset}><a href={credit.source} target="_blank" rel="noreferrer">{credit.photographer}</a> · {credit.asset.startsWith("photo-") ? "Character portrait" : "Chapter environment"}</li>)}</ul></details></>}
      {drawer === 'settings' && <><label className="preference"><input type="checkbox" checked={reducedMotion} onChange={e => { setReducedMotion(e.target.checked); try { localStorage.setItem('gpl.motion', e.target.checked ? 'reduced' : 'default'); } catch { /* local preference still works */ } }} /><span><strong>Reduce motion</strong><small>Remove screen entrance animations. Your system preference is also respected.</small></span></label><label className="preference"><input type="checkbox" checked={largeText} onChange={e => { setLargeText(e.target.checked); try { localStorage.setItem('gpl.reading', e.target.checked ? 'large' : 'default'); } catch { /* local preference still works */ } }} /><span><strong>Larger reading text</strong><small>More room for the words. You can also use your browser’s zoom.</small></span></label><p className="note">Progress is stored in this browser, not in a personal account. On a shared computer, keep your run code and start a new engagement for the next learner.</p><button className="secondary" onClick={() => setDrawer('restart')}>{COPY.restart}</button></>}
      {drawer === 'code' && <RunCode state={state} content={content} onCode={props.onCode} />}
      {drawer === 'restart' && <><p>{COPY.restartWarning}</p>{codeFromState(state, content) && <p>Your current code: <code>{codeFromState(state, content)}</code></p>}<div className="dialog-actions"><button className="secondary" onClick={() => setDrawer(null)}>Keep this engagement</button><button className="primary" onClick={() => { setDrawer(null); props.onStart(); }}>Start a new engagement</button></div></>}
    </Modal>}
  </div>;
}
