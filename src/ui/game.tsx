/**
 * The game shell: HUD, screen routing, transitions, preferences and drawers.
 *
 * Every screen is its own composition in ./screens (one layout per kind of beat, never a
 * shared page template). This file decides WHICH screen to show from engine state; it never
 * decides anything about the game.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { isMission, type Content, type GameNode } from '../engine/types';
import { codeFromState } from '../engine/runcode';
import { COPY } from '../content/interface';
import type { ActionPlan, ResumeState, Session } from '../session';
import { DIMENSION_ORDER, Glyph, Meter, pad2 } from './parts';
import { useCountUp } from './screens/Result';
import { play, type Cue } from './sound';
import { Title } from './screens/Title';
import { Setup } from './screens/Setup';
import { Journey } from './screens/Journey';
import { ChapterOpen } from './screens/ChapterOpen';
import { Brief } from './screens/Brief';
import { Decide } from './screens/Decide';
import { Result } from './screens/Result';
import { Turn } from './screens/Turn';
import { Reflection } from './screens/Reflection';
import { Debrief } from './screens/Debrief';
import { Ending } from './screens/Ending';
import { AccountFile, Help, Modal, RunCode, Settings, type Preferences } from './screens/Overlays';

interface Props {
  session: Session; node: GameNode; content: Content; home: boolean; resume: ResumeState; saveError: boolean;
  onAdvance(): void; onStart(): void; onResume(s: Session): void; onView(view: 'play' | 'map'): void;
  onToggle(id: string): void; onAdvantage(id: string): void; onSetup(): void; onCommit(): void;
  onReflect(answer: string): void; onFinish(): void; onCode(code: string): string | null;
  onPlan(key: keyof ActionPlan, value: string): void;
}
type Drawer = { kind: 'file'; chapter?: number } | { kind: 'help' | 'settings' | 'code' | 'restart' } | null;

const readFlag = (key: string, on: string) => { try { return localStorage.getItem(key) === on; } catch { return false; } };
const writeFlag = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* the preference still applies for this session */ } };
const systemStill = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

/**
 * Screen changes go through the View Transitions API where it exists: the old screen and the
 * new one cross-fade, and a card that was committed morphs into the stamped card on the
 * consequence screen (80 Days' "the chosen option melts into the prose"). Progressive: with no
 * API, or with reduced motion, the state simply changes.
 */
function transition(change: () => void, still: boolean) {
  const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
  if (still || typeof doc.startViewTransition !== 'function') { change(); return; }
  doc.startViewTransition(() => flushSync(change));
}

export function Game(props: Props) {
  const { session, node, content } = props; const { game: state, presentation } = session;
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [prefs, setPrefs] = useState<Preferences>(() => ({ reducedMotion: readFlag('gpl.motion', 'reduced'), largeText: readFlag('gpl.reading', 'large'), sound: readFlag('gpl.sound', 'on') }));
  const still = prefs.reducedMotion || systemStill();
  const cue = (c: Cue) => play(c, prefs.sound);
  const go = (change: () => void, sound?: Cue) => { if (sound) cue(sound); transition(change, still); };

  const mission = isMission(node) ? node : undefined;
  const currentChapter = 'chapter' in node ? node.chapter : state.history.at(-1)?.chapter ?? 1;
  const chapter = content.chapters.find(c => c.number === currentChapter) ?? content.chapters[0];
  const atHome = state.phase === 'title' || props.home;
  const atMap = !atHome && presentation.view === 'map';
  const screen = atHome ? 'welcome' : atMap ? 'journey' : node.kind === 'interlude' ? node.role ?? 'chapter-open'
    : state.phase === 'decide' && mission ? (mission.presentation === 'dialogue' ? mission.surface ?? 'call' : mission.presentation === 'apply' ? 'apply' : mission.kind) : state.phase;
  const route = screen + ':' + state.nodeId + ':' + state.phase;
  /* The brand light belongs to the frames around the story; a chapter's light to its beats. */
  const themed = !['welcome', 'journey', 'setup', 'ending'].includes(screen);

  useEffect(() => { setDrawer(null); }, [route]);
  const lastRoute = useRef(route);
  useEffect(() => {
    if (lastRoute.current === route) return; lastRoute.current = route;
    if (screen === 'chapter-open') cue('shutter');
    /* One cue for every consequence: a verdict sound would grade the decision before a word is read. */
    if (screen === 'consequence') cue('page');
  });

  const setPref = (p: Partial<Preferences>) => setPrefs(current => {
    const next = { ...current, ...p };
    writeFlag('gpl.motion', next.reducedMotion ? 'reduced' : 'default'); writeFlag('gpl.reading', next.largeText ? 'large' : 'default'); writeFlag('gpl.sound', next.sound ? 'on' : 'off');
    return next;
  });
  const openFile = (chapterNumber?: number) => setDrawer({ kind: 'file', chapter: chapterNumber });
  const start = () => { if (props.resume.candidates.length || state.phase !== 'title') setDrawer({ kind: 'restart' }); else go(props.onStart, 'page'); };
  const advance = () => go(props.onAdvance, 'page');

  let body: ReactNode = null;
  if (atHome) body = <Title content={content} resume={props.resume} onResume={s => go(() => props.onResume(s), 'page')} onStart={start} />;
  else if (atMap) body = <Journey state={state} content={content} node={node} currentChapter={currentChapter} onPlay={() => go(() => props.onView('play'), 'page')} onReview={openFile} />;
  else if (node.kind === 'setup') body = <Setup node={node} selected={presentation.advantage} onPick={id => { cue('select'); props.onAdvantage(id); }} onConfirm={() => go(props.onSetup, 'stamp')} />;
  else if (node.kind === 'interlude' && node.role === 'chapter-debrief') body = <Debrief node={node} state={state} content={content} chapter={chapter} onNext={advance} />;
  else if (node.kind === 'interlude' && node.role === 'reflection') body = <Reflection node={node} answer={presentation.reflections[node.id]} onAnswer={a => { cue('select'); props.onReflect(a); }} onNext={advance} />;
  else if (node.kind === 'interlude' && node.role === 'turn') body = <Turn node={node} onNext={advance} />;
  else if (node.kind === 'interlude') body = <ChapterOpen node={node} chapter={chapter} onBegin={advance} />;
  else if (state.phase === 'brief' && mission) body = <Brief mission={mission} state={state} content={content} chapter={chapter} onNext={advance} />;
  else if (state.phase === 'decide' && mission) body = <Decide mission={mission} state={state} content={content} chapter={chapter} onToggle={id => { cue('select'); props.onToggle(id); }} onCommit={() => go(props.onCommit, 'stamp')} onBrief={() => openFile()} />;
  else if (state.phase === 'consequence' && state.resolution) body = <Result state={state} content={content} mission={mission} still={still} onNext={advance} onFile={() => openFile()} />;
  else if (state.phase === 'ending') body = <Ending session={session} content={content} onPlan={props.onPlan} onCode={() => setDrawer({ kind: 'code' })} onHome={props.onFinish} onAgain={start} />;

  const drawerTitle = drawer?.kind === 'file' ? COPY.record : drawer?.kind === 'help' ? COPY.help : drawer?.kind === 'settings' ? COPY.settings : drawer?.kind === 'restart' ? COPY.restart : COPY.code;
  return <div className={'gpl-game' + (prefs.largeText ? ' large-reading' : '') + (prefs.reducedMotion ? ' reduce-motion' : '')}
    data-screen={screen} data-node={node.id} data-phase={state.phase} data-chapter={themed ? currentChapter : undefined}>
    <a className="skip-link" href="#game-heading">Skip to the activity</a>
    <Hud session={session} content={content} screen={screen} atHome={atHome} atMap={atMap} still={still} chapterLabel={themed ? chapter.label : undefined} currentChapter={currentChapter}
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
        {codeFromState(state, content) && <p>Your current code: <code className="mono">{codeFromState(state, content)}</code></p>}
        <div className="dialog-actions"><button className="secondary" onClick={() => setDrawer(null)}>Keep this engagement</button><button className="secondary is-strong" onClick={() => { setDrawer(null); go(props.onStart, 'page'); }}>Start a new engagement</button></div>
      </>}
    </Modal>}
  </div>;
}

/** Business position in the HUD. On a consequence it counts from before to after, once. */
function HudMeters({ session, still }: { session: Session; still: boolean }) {
  const state = session.game; const result = state.phase === 'consequence' ? state.resolution : null;
  return <div className="hud-meters" role="group" aria-label={COPY.position}>
    {DIMENSION_ORDER.map((d, i) => <HudMeter key={d} dim={d} from={result ? result.dimsBefore[d] : state.dims[d]} to={state.dims[d]} delta={result?.deltas[d]} index={i} still={still} />)}
  </div>;
}
function HudMeter({ dim, from, to, delta, index, still }: { dim: 'win' | 'profit' | 'deliver'; from: number; to: number; delta?: number; index: number; still: boolean }) {
  const value = useCountUp(from, to, 620 + index * 120, still);
  return <Meter dim={dim} value={value} delta={delta || undefined} moving={!!delta && !still} />;
}

function Hud({ session, content, screen, atHome, atMap, still, chapterLabel, currentChapter, onMap, onFile, onHelp, onSettings, onCode }: {
  session: Session; content: Content; screen: string; atHome: boolean; atMap: boolean; still: boolean; chapterLabel?: string; currentChapter: number;
  onMap(): void; onFile(): void; onHelp(): void; onSettings(): void; onCode(): void;
}) {
  const state = session.game;
  const playing = !atHome && state.phase !== 'setup';
  const nowId = state.phase === 'brief' || state.phase === 'decide' ? state.nodeId : undefined;
  return <header className="hud">
    <a className="hud-brand" href="#game-heading" aria-label={COPY.brand}>gpl<i /></a>
    {chapterLabel && <div className="hud-chapter"><span className="mono">CH {pad2(currentChapter)}</span><strong>{chapterLabel}</strong></div>}
    {playing && <button className="hud-track" aria-pressed={atMap} onClick={onMap} aria-label={COPY.journey + ', ' + state.completed.length + ' of ' + content.missionOrder.length + ' decisions'}>
      <span className="ticks" aria-hidden="true">{content.chapters.map(c => <span className="act" key={c.number}>{c.missionIds.map(id => <i key={id} className={'tick' + (state.completed.includes(id) ? ' done' : id === nowId ? ' now' : '')} />)}</span>)}</span>
      <span className="count" aria-hidden="true"><b>{state.completed.length}</b>/{content.missionOrder.length}</span>
    </button>}
    {/* The deal's position appears where it explains something — after a result, at a debrief, on
        the journey — never as furniture over a brief or a decision (COMPLETE-GAME-BACKLOG §scope). */}
    {playing && (screen === 'consequence' || screen === 'chapter-debrief' || screen === 'journey') && <HudMeters session={session} still={still} />}
    <nav className="hud-tools" aria-label="Game tools" style={playing ? undefined : { marginLeft: 'auto' }}>
      {!atHome && <button className="icon-button" onClick={onFile} aria-label={COPY.record} title={COPY.record}><Glyph name="file" /></button>}
      <button className="icon-button" onClick={onHelp} aria-label={COPY.help} title={COPY.help}><Glyph name="help" /></button>
      <button className="icon-button" onClick={onSettings} aria-label={COPY.settings} title={COPY.settings}><Glyph name="settings" /></button>
      <button className="icon-button" onClick={onCode} aria-label={COPY.code} title={COPY.code}><Glyph name="save" /></button>
    </nav>
  </header>;
}
