/**
 * The game shell: HUD, screen routing, transitions, preferences and drawers.
 *
 * Screen grammar (D-080): a screen is a scene, and a new screen means the story moved —
 * a new place, new people, a new act, or news from elsewhere. Committing a decision does not
 * change the screen; the scene answers in place. This file decides WHICH screen to show from
 * engine state; it never decides anything about the game.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { isMission, type Content, type GameNode } from '../engine/types';
import { stageNameOf } from './cards';
import { ledger } from '../engine/engine';
import { codeFromState } from '../engine/runcode';
import { COPY } from '../content/interface';
import { RULES } from '../content/presentation';
import type { ActionPlan, ResumeState, Session } from '../session';
import { debriefText } from '../debrief';
import { Glyph } from './parts';
import { play, type Cue } from './sound';
import { Title } from './screens/Title';
import { Setup } from './screens/Setup';
import { Journey } from './screens/Journey';
import { ChapterOpen } from './screens/ChapterOpen';
import { Scene } from './screens/Scene';
import { Turn } from './screens/Turn';
import { ActBreak } from './screens/ActBreak';
import { Ending } from './screens/Ending';
import { AccountFile, Help, Modal, RunCode, Settings, type Preferences } from './screens/Overlays';

interface Props {
  session: Session; node: GameNode; content: Content; home: boolean; resume: ResumeState; saveError: boolean;
  onAdvance(): void; onStart(): void; onResume(s: Session): void; onView(view: 'play' | 'map'): void;
  onToggle(id: string): void; onAdvantage(id: string): void; onSetup(): void; onCommit(): void;
  onReflect(nodeId: string, answer: string): void; onFinish(): void; onCode(code: string): string | null;
  onPlan(key: keyof ActionPlan, value: string): void;
}
type Drawer = { kind: 'file'; chapter?: number } | { kind: 'help' | 'settings' | 'code' | 'restart' } | null;

const readFlag = (key: string, on: string) => { try { return localStorage.getItem(key) === on; } catch { return false; } };
const writeFlag = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* the preference still applies for this session */ } };
const systemStill = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

function downloadRecord(saved: Session, content: Content) {
  const url = URL.createObjectURL(new Blob([debriefText(saved, content)], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'gpl-engagement-debrief.txt'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Screen changes cross-fade through the View Transitions API where it exists; otherwise they simply change. */
function transition(change: () => void, still: boolean) {
  const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
  if (still || typeof doc.startViewTransition !== 'function') { change(); return; }
  doc.startViewTransition(() => flushSync(change));
}

export function Game(props: Props) {
  const { session, node, content } = props; const { game: state, presentation } = session;
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [prefs, setPrefs] = useState<Preferences>(() => ({ reducedMotion: readFlag('gpl.motion', 'reduced'), largeText: readFlag('gpl.reading', 'large'), sound: readFlag('gpl.sound', 'on') }));
  /* The record as it stood at the moment of commitment, so the board can mark what changed. */
  const before = useRef<{ node: string; labels: string[] } | null>(null);
  const still = prefs.reducedMotion || systemStill();
  const cue = (c: Cue) => play(c, prefs.sound);
  const go = (change: () => void, sound?: Cue) => { if (sound) cue(sound); transition(change, still); };

  const mission = isMission(node) ? node : undefined;
  const currentChapter = 'chapter' in node ? node.chapter : state.history.at(-1)?.chapter ?? 1;
  const chapter = content.chapters.find(c => c.number === currentChapter) ?? content.chapters[0];
  const atHome = state.phase === 'title' || props.home;
  const atMap = !atHome && presentation.view === 'map';
  const screen = atHome ? 'welcome' : atMap ? 'journey' : node.kind === 'interlude' ? node.role ?? 'chapter-open'
    : state.phase === 'consequence' ? 'consequence'
    : mission ? (mission.presentation === 'dialogue' ? mission.surface ?? 'call' : mission.presentation === 'apply' ? 'apply' : mission.kind) : state.phase;
  /* A scene is keyed by its node: committing changes the phase, not the scene. */
  const route = (atHome ? 'home' : atMap ? 'map' : state.nodeId);
  const themed = !atHome && !atMap && node.kind !== 'setup' && state.phase !== 'ending';

  useEffect(() => { setDrawer(null); }, [route, state.phase]);
  /* Committing keeps the scene; bring its answer into view and to the reader. */
  const lastPhase = useRef(state.phase);
  useEffect(() => {
    if (lastPhase.current === state.phase) return;
    const was = lastPhase.current; lastPhase.current = state.phase;
    if (was === 'decide' && state.phase === 'consequence') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.getElementById('outcome-heading')?.focus({ preventScroll: true });
    }
  }, [state.phase]);
  const lastRoute = useRef(route);
  useEffect(() => {
    if (lastRoute.current === route) return; lastRoute.current = route;
    if (screen === 'chapter-open' || screen === 'chapter-debrief') cue('shutter');
  });

  const setPref = (p: Partial<Preferences>) => setPrefs(current => {
    const next = { ...current, ...p };
    writeFlag('gpl.motion', next.reducedMotion ? 'reduced' : 'default'); writeFlag('gpl.reading', next.largeText ? 'large' : 'default'); writeFlag('gpl.sound', next.sound ? 'on' : 'off');
    return next;
  });
  const openFile = (chapterNumber?: number) => setDrawer({ kind: 'file', chapter: chapterNumber });
  const start = () => { if (props.resume.candidates.length || state.phase !== 'title') setDrawer({ kind: 'restart' }); else go(props.onStart, 'page'); };
  const advance = () => go(props.onAdvance, 'page');
  const commit = () => { before.current = { node: state.nodeId, labels: ledger(state, content).map(e => e.label) }; cue('stamp'); props.onCommit(); };

  let body: ReactNode = null;
  if (atHome) body = <Title content={content} resume={props.resume} onResume={s => go(() => props.onResume(s), 'page')} onStart={start} />;
  else if (atMap) body = <Journey state={state} content={content} node={node} currentChapter={currentChapter} onPlay={() => go(() => props.onView('play'), 'page')} onReview={openFile} />;
  else if (node.kind === 'setup') body = <Setup node={node} selected={presentation.advantage} onPick={id => { cue('select'); props.onAdvantage(id); }} onConfirm={() => go(props.onSetup, 'stamp')} />;
  else if (node.kind === 'interlude' && node.role === 'chapter-debrief') body = <ActBreak node={node} state={state} content={content} chapter={chapter} reflections={presentation.reflections} onReflect={(id, a) => { cue('select'); props.onReflect(id, a); }} onNext={advance} />;
  else if (node.kind === 'interlude' && node.role === 'turn') body = <Turn node={node} settled={state.settled} onNext={advance} />;
  else if (node.kind === 'interlude') body = <ChapterOpen node={node} chapter={chapter} onBegin={advance} />;
  else if (mission && (state.phase === 'decide' || state.phase === 'consequence' || state.phase === 'brief')) body = <Scene mission={mission} state={state} content={content} chapter={chapter}
    before={before.current?.node === state.nodeId ? before.current.labels : undefined}
    onToggle={id => { cue('select'); props.onToggle(id); }} onCommit={commit} onNext={advance} onFile={() => openFile()} />;
  else if (state.phase === 'ending') body = <Ending session={session} content={content} onPlan={props.onPlan} onCode={() => setDrawer({ kind: 'code' })} onHome={props.onFinish} onAgain={start} />;

  const drawerTitle = drawer?.kind === 'file' ? COPY.record : drawer?.kind === 'help' ? COPY.help : drawer?.kind === 'settings' ? COPY.settings : drawer?.kind === 'restart' ? COPY.restart : COPY.code;
  return <div className={'gpl-game' + (prefs.largeText ? ' large-reading' : '') + (prefs.reducedMotion ? ' reduce-motion' : '')}
    data-screen={screen} data-node={node.id} data-phase={state.phase} data-chapter={themed ? currentChapter : undefined}>
    <a className="skip-link" href="#game-heading">Skip to the decision</a>
    <Hud session={session} content={content} atHome={atHome} atMap={atMap} chapterNumber={themed ? currentChapter : undefined} chapterTitle={chapter.title}
      onMap={() => go(() => props.onView(atMap ? 'play' : 'map'), 'page')} onFile={() => openFile()} onHelp={() => setDrawer({ kind: 'help' })} onSettings={() => setDrawer({ kind: 'settings' })} onCode={() => setDrawer({ kind: 'code' })} />
    {props.saveError && <div className="save-warning" role="status">{COPY.saving} <button onClick={() => setDrawer({ kind: 'code' })}>{COPY.code}</button></div>}
    <main key={route} className="screen">{body}</main>
    {drawer && <Modal title={drawerTitle} onClose={() => setDrawer(null)}>
      {drawer.kind === 'file' && <AccountFile state={state} content={content} mission={drawer.chapter ? undefined : mission} chapter={drawer.chapter} />}
      {drawer.kind === 'help' && <Help />}
      {drawer.kind === 'settings' && <Settings prefs={prefs} onChange={setPref} onRestart={() => setDrawer({ kind: 'restart' })} />}
      {drawer.kind === 'code' && <RunCode state={state} content={content} onCode={props.onCode} onRestored={() => setDrawer(null)} />}
      {drawer.kind === 'restart' && <>
        <p>{COPY.restartWarning}</p>
        {/* SV-02: from the home screen the active state is empty; what would be lost is the saved
            engagement. Show its real code and let the learner keep its record before replacing it. */}
        {(state.phase === 'title' || props.home ? props.resume.candidates.map(c => c.session) : [session]).map((saved, i, all) => {
          const code = codeFromState(saved.game, content);
          const source = all.length > 1 ? (props.resume.candidates[i]?.source === 'lms' ? COPY.keep.lms : COPY.keep.browser) : COPY.keep.yours;
          return code ? <div className="file-entry" key={i}>
            <small>{source} · {saved.game.completed.length} {COPY.keep.decisions} · {saved.game.phase === 'ending' ? COPY.keep.complete : COPY.keep.inProgress}</small>
            <p>{COPY.keep.code} <code>{code}</code></p>
            <div className="dialog-actions"><button className="secondary" onClick={() => downloadRecord(saved, content)}>{COPY.keep.download}</button></div>
          </div> : null;
        })}
        <div className="dialog-actions"><button className="secondary" onClick={() => setDrawer(null)}>Keep this engagement</button><button className="secondary is-strong" onClick={() => { setDrawer(null); go(props.onStart, 'page'); }}>Start a new engagement</button></div>
      </>}
    </Modal>}
  </div>;
}

/**
 * Where you are and what is at stake: the act, your progress, the deal's three measures and
 * your record. The measures are the state of the deal, not a score; they sit here because a
 * player has to see what their decisions are moving (D-081).
 */
function Hud({ session, content, atHome, atMap, chapterNumber, chapterTitle, onMap, onFile, onHelp, onSettings, onCode }: {
  session: Session; content: Content; atHome: boolean; atMap: boolean; chapterNumber?: number; chapterTitle: string;
  onMap(): void; onFile(): void; onHelp(): void; onSettings(): void; onCode(): void;
}) {
  const state = session.game;
  const playing = !atHome && state.phase !== 'setup' && state.phase !== 'title';
  const nowId = state.phase === 'decide' || state.phase === 'consequence' ? state.nodeId : undefined;
  const records = ledger(state, content).length;
  const seen = useRef(records);
  const [fresh, setFresh] = useState(false);
  useEffect(() => { if (records > seen.current) setFresh(true); seen.current = records; }, [records]);
  const moving = state.phase === 'consequence' ? state.resolution?.deltas : undefined;
  return <header className="hud">
    <a className="hud-brand" href="#game-heading" aria-label={COPY.brand}>gpl<i /></a>
    {/* The map: the five stages of a deal, a dot per decision, and where you are. Always on screen,
        so a player can see at a glance how far through the story they are and what comes next. */}
    {playing ? <button className="hud-map" aria-pressed={atMap} onClick={onMap} aria-label={COPY.journey + ': ' + COPY.stage.act + ' ' + (chapterNumber ?? 1) + ' ' + COPY.stage.of + ' ' + content.chapters.length + ', ' + state.completed.length + ' ' + COPY.stage.of + ' ' + content.missionOrder.length + ' ' + COPY.frames.journey.decisions}>
      {content.chapters.map(c => {
        const done = c.missionIds.every(id => state.completed.includes(id));
        const here = c.number === chapterNumber;
        const name = stageNameOf(content, c.number);
        return <span key={c.number} className={'hud-stage' + (here ? ' is-here' : done ? ' is-done' : ' is-ahead')} title={COPY.stage.act + ' ' + c.number + ' · ' + name} aria-hidden="true">
          <span className="n">{done && !here ? '✓' : c.number}</span>
          <span className="name">{name}</span>
          <span className="dots">{c.missionIds.map(id => <i key={id} className={id === nowId ? 'now' : state.completed.includes(id) ? 'done' : ''} />)}</span>
        </span>;
      })}
    </button> : chapterNumber ? <div className="hud-act"><small>{COPY.stage.act} {chapterNumber} {COPY.stage.of} {content.chapters.length}</small><strong>{chapterTitle}</strong></div> : null}
    {playing && <div className="hud-gauges" role="group" aria-label={COPY.position}>
      {RULES.map(r => <span key={r.id} className={'hud-gauge' + (moving?.[r.id] ? ' is-moving' : '')} title={r.question}>
        <span>{COPY.dimensions[r.id].short}</span><span className="bar" aria-hidden="true"><i style={{ width: state.dims[r.id] + '%' }} /></span><b>{state.dims[r.id]}</b>
      </span>)}
    </div>}
    <nav className="hud-tools" aria-label="Game tools" style={playing ? undefined : { marginLeft: 'auto' }}>
      {!atHome && state.phase !== 'title' && <button className={'hud-record' + (fresh ? ' is-new' : '')} onClick={() => { setFresh(false); onFile(); }} aria-label={COPY.record + ', ' + records}><Glyph name="file" /><span>{COPY.say.record}</span><span className="n">{records}</span></button>}
      <button className="icon-button" onClick={onHelp} aria-label={COPY.help} title={COPY.help}><Glyph name="help" /></button>
      <button className="icon-button" onClick={onSettings} aria-label={COPY.settings} title={COPY.settings}><Glyph name="settings" /></button>
      <button className="icon-button" onClick={onCode} aria-label={COPY.code} title={COPY.code}><Glyph name="save" /></button>
    </nav>
  </header>;
}
