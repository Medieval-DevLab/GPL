/**
 * Dev-only preview: the real screens, rendered against the lever fixture, one view per URL.
 * Open `/src/ui/__fixtures__/preview.html?v=lever-d5` on the dev server. Never part of the build
 * (the build's only entry is `index.html`).
 *
 *   lever-<id>   a lever decision, live: click, use the keyboard, commit
 *   trail-<id>   the trail before decision <id>, with the act's system view
 *   break-<n>    the act break closing act <n> (break-4 has a settled ledger)
 *   ending       the ending, with the chart and the settled calendar
 */
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../game.css';
import { advance, commit, createInitialState, toggleSelection } from '../../engine/engine';
import { isMission, type GameState } from '../../engine/types';
import { EARNED } from '../../content/gates';
import { CHAPTER_PRESENTATION, MILESTONE } from '../../content/presentation';
import { emptyPresentation } from '../../session';
import { Scene } from '../screens/Scene';
import { Journey } from '../screens/Journey';
import { ActBreak } from '../screens/ActBreak';
import { Ending } from '../screens/Ending';
import { CARDS, RUN, SETTLED, STOPS, fixture } from './levers';

/* The fixture's cards and stops stand in for the real script's until it lands. */
Object.assign(EARNED, CARDS);
Object.assign(MILESTONE as Record<string, string>, STOPS);
const ROUTES: Record<number, string[]> = { 1: ['d1', 'd2'], 2: ['d3'], 3: ['d5', 'd6'], 4: ['d7'], 5: [] };
for (const p of CHAPTER_PRESENTATION) (p as { route: readonly string[] }).route = ROUTES[p.chapter];

/** The scripted run, through the real engine, stopping as it enters `stop`. */
function playTo(stop: string, run = RUN): GameState {
  let s: GameState = advance({ ...createInitialState(fixture), flags: ['start:builder'] }, fixture);
  for (let guard = 0; guard < 60 && s.nodeId !== stop && s.phase !== 'ending'; guard++) {
    if (s.phase === 'decide') { for (const id of run[s.nodeId]) s = toggleSelection(s, fixture, id); s = commit(s, fixture); }
    else s = advance(s, fixture);
  }
  return s;
}

const noop = () => {};
const view = new URLSearchParams(location.search).get('v') ?? 'lever-d1';
const [kind, arg] = view.split('-');

function Lever({ id }: { id: string }) {
  const [state, setState] = useState(() => { const s = playTo(id); return s.phase === 'brief' ? advance(s, fixture) : s; });
  const node = fixture.nodes[state.nodeId];
  if (!isMission(node)) return null;
  const chapter = fixture.chapters.find(c => c.number === node.chapter)!;
  return <Frame chapter={node.chapter}><Scene key={node.id} mission={node} state={state} content={fixture} chapter={chapter}
    onToggle={x => setState(s => toggleSelection(s, fixture, x))} onCommit={() => setState(s => commit(s, fixture))} onNext={noop} onFile={noop} /></Frame>;
}

function Frame({ chapter, children }: { chapter?: number; children: React.ReactNode }) {
  return <div className="gpl-game" data-chapter={chapter}>
    <header className="hud"><span className="hud-brand">gpl<i /></span></header>
    <main className="screen">{children}</main>
  </div>;
}

function App() {
  if (kind === 'lever') return <Lever id={arg} />;
  if (kind === 'trail') {
    const state = playTo(arg), node = fixture.nodes[state.nodeId];
    return <Frame><Journey state={state} content={fixture} node={node} currentChapter={'chapter' in node ? node.chapter : 1} onPlay={noop} onReview={noop} /></Frame>;
  }
  if (kind === 'break') {
    const n = +arg, base = playTo('deb-' + n), state = n === 4 ? { ...base, settled: SETTLED } : base;
    const node = fixture.nodes['deb-' + n];
    if (node.kind !== 'interlude') return null;
    return <Frame chapter={n}><ActBreak node={node} state={state} content={fixture} chapter={fixture.chapters[n - 1]} reflections={{}} onReflect={noop} onNext={noop} /></Frame>;
  }
  const game = { ...playTo('end'), settled: SETTLED };
  return <Frame><Ending session={{ game, presentation: emptyPresentation() }} content={fixture} onPlan={noop} onCode={noop} onHome={noop} onAgain={noop} /></Frame>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
