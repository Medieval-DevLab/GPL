import { useEffect, useRef, useState } from 'react';
import { story } from './content/story';
import { advance, chooseSetup, commit, createInitialState, toggleSelection } from './engine/engine';
import type { GameState } from './engine/types';
import { decodeRun } from './engine/runcode';
import { saveKey } from './engine/save';
import { lmsResumeCode, useLms } from './lms';
import { emptyPresentation, normaliseActionPlan, presentationFrom, readResume, serialiseSession, type ResumeState, type Session } from './session';
import { Game } from './ui/game';

/**
 * Scene grammar (D-080): a new screen appears only when something happens in the story.
 *
 * The engine keeps its full beat sequence. This is presentation flow, and it decides nothing.
 * Three kinds of engine beat no longer get a screen of their own:
 *  - a mission's `brief` phase: the situation and the choice are one scene;
 *  - a mid-chapter `reflection`: its question is asked at the end of the act instead;
 *  - a `chapter-open` reached from the previous act's debrief: the act break already
 *    introduces the next act.
 * Every step still runs through `advance`, so the engine state, run codes and saves are
 * exactly what they were.
 */
function settle(game: GameState, fromDebrief = false): GameState {
  let g = game;
  for (let guard = 0; guard < 6; guard++) {
    const node = story.nodes[g.nodeId];
    if (g.phase === 'brief') { g = advance(g, story); continue; }
    if (node?.kind === 'interlude' && node.role === 'reflection') { g = advance(g, story); continue; }
    if (fromDebrief && node?.kind === 'interlude' && node.role === 'chapter-open') { g = advance(g, story); continue; }
    break;
  }
  return g;
}

export default function App() {
  const [session, setSession] = useState<Session>(() => ({ game: createInitialState(story), presentation: emptyPresentation() }));
  const [resume, setResume] = useState<ResumeState>({ candidates: [], local: { status: 'empty' }, invalidLms: false });
  const [saveError, setSaveError] = useState(false);
  const [home, setHome] = useState(false);
  const transitionLock = useRef(false);
  useLms(session.game, story);
  useEffect(() => {
    let storage: Storage | null = null;
    try { storage = window.localStorage; } catch { setSaveError(true); }
    setResume(readResume(story, storage, lmsResumeCode()));
  }, []);
  useEffect(() => {
    if (session.game.phase === 'title') return;
    const save = () => {
      try { window.localStorage.setItem(saveKey(), serialiseSession(session, story)); setSaveError(false); }
      catch { setSaveError(true); }
    };
    save();
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, [session]);
  const routeKey = [home, session.presentation.view, session.game.nodeId].join(':');
  useEffect(() => {
    transitionLock.current = false;
    document.getElementById('game-heading')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [routeKey]);
  /* A commit keeps the scene; only the decision area changes. Release the lock on phase too. */
  useEffect(() => { transitionLock.current = false; }, [session.game.phase]);
  const node = story.nodes[session.game.nodeId];
  const next = () => {
    if (transitionLock.current) return;
    transitionLock.current = true;
    setSession(s => {
      const current = story.nodes[s.game.nodeId];
      const fromDebrief = current.kind === 'interlude' && current.role === 'chapter-debrief';
      const game = settle(advance(s.game, story), fromDebrief);
      /* The trail (D-083): after every decision and every act, you come back to the map and see
         the step you took before taking the next. Not before an act break, which is its own
         look back, and not at the end. Presentation only; the engine never knows. */
      const landed = story.nodes[game.nodeId];
      const toMap = (s.game.phase === 'consequence' || fromDebrief) && game.phase !== 'ending' && !(landed.kind === 'interlude' && landed.role === 'chapter-debrief');
      return { game, presentation: { ...s.presentation, view: toMap ? 'map' : 'play' } };
    });
  };
  const reset = () => {
    setSession({ game: advance(createInitialState(story), story), presentation: emptyPresentation() });
    setResume({ candidates: [], local: { status: 'empty' }, invalidLms: false });
    setHome(false);
  };
  return <Game session={session} node={node} content={story} home={home} resume={resume} saveError={saveError}
    onAdvance={next} onStart={reset}
    onResume={value => { setSession({ ...value, game: settle(value.game) }); setHome(false); }}
    onView={view => setSession(s => ({ ...s, presentation: { ...s.presentation, view } }))}
    onToggle={id => setSession(s => ({ ...s, game: toggleSelection(s.game, story, id) }))}
    onAdvantage={advantage => setSession(s => ({ ...s, presentation: { ...s.presentation, advantage } }))}
    onSetup={() => setSession(s => s.presentation.advantage ? { game: chooseSetup(s.game, story, s.presentation.advantage), presentation: { ...s.presentation, view: 'map' } } : s)}
    onCommit={() => setSession(s => ({ ...s, game: commit(s.game, story) }))}
    onReflect={(nodeId, answer) => setSession(s => ({ ...s, presentation: { ...s.presentation, reflections: { ...s.presentation.reflections, [nodeId]: answer } } }))}
    onPlan={(key, value) => setSession(s => ({ ...s, presentation: { ...s.presentation, actionPlan: normaliseActionPlan({ ...s.presentation.actionPlan, [key]: value }) } }))}
    onFinish={() => { setHome(true); setResume({ candidates: [{ source: 'local', session }], local: { status: 'empty' }, invalidLms: false }); }}
    onCode={code => {
      const read = decodeRun(story, code);
      if (!read.ok) return read.message;
      setSession({ game: settle(read.state), presentation: presentationFrom(null, read.state, story) });
      setHome(false);
      return null;
    }} />;
}
