import { useEffect, useRef, useState } from 'react';
import { story } from './content/story';
import { advance, chooseSetup, commit, createInitialState, toggleSelection } from './engine/engine';
import { decodeRun } from './engine/runcode';
import { saveKey } from './engine/save';
import { lmsResumeCode, useLms } from './lms';
import { emptyPresentation, normaliseActionPlan, presentationFrom, readResume, serialiseSession, type ResumeState, type Session } from './session';
import { Game } from './ui/game';

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
  const routeKey = [home, session.presentation.view, session.game.nodeId, session.game.phase].join(':');
  useEffect(() => {
    transitionLock.current = false;
    document.getElementById('game-heading')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [routeKey]);
  const node = story.nodes[session.game.nodeId];
  const next = () => {
    if (transitionLock.current) return;
    transitionLock.current = true;
    setSession(s => {
      const current = story.nodes[s.game.nodeId];
      const game = advance(s.game, story);
      return { game, presentation: { ...s.presentation, view: current.kind === 'interlude' && current.role === 'chapter-debrief' && game.phase !== 'ending' ? 'map' : 'play' } };
    });
  };
  const reset = () => {
    setSession({ game: advance(createInitialState(story), story), presentation: emptyPresentation() });
    setResume({ candidates: [], local: { status: 'empty' }, invalidLms: false });
    setHome(false);
  };
  return <Game session={session} node={node} content={story} home={home} resume={resume} saveError={saveError}
    onAdvance={next} onStart={reset}
    onResume={value => { setSession(value); setHome(false); }}
    onView={view => setSession(s => ({ ...s, presentation: { ...s.presentation, view } }))}
    onToggle={id => setSession(s => ({ ...s, game: toggleSelection(s.game, story, id) }))}
    onAdvantage={advantage => setSession(s => ({ ...s, presentation: { ...s.presentation, advantage } }))}
    onSetup={() => setSession(s => s.presentation.advantage ? { game: chooseSetup(s.game, story, s.presentation.advantage), presentation: { ...s.presentation, view: 'map' } } : s)}
    onCommit={() => setSession(s => ({ ...s, game: commit(s.game, story) }))}
    onReflect={answer => setSession(s => ({ ...s, presentation: { ...s.presentation, reflections: { ...s.presentation.reflections, [s.game.nodeId]: answer } } }))}
    onPlan={(key, value) => setSession(s => ({ ...s, presentation: { ...s.presentation, actionPlan: normaliseActionPlan({ ...s.presentation.actionPlan, [key]: value }) } }))}
    onFinish={() => { setHome(true); setResume({ candidates: [{ source: 'local', session }], local: { status: 'empty' }, invalidLms: false }); }}
    onCode={code => {
      const read = decodeRun(story, code);
      if (!read.ok) return read.message;
      setSession({ game: read.state, presentation: presentationFrom(null, read.state, story) });
      setHome(false);
      return null;
    }} />;
}
