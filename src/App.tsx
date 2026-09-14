import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { story } from "./content/story";
import {
  advance,
  canCommit,
  commit,
  createInitialState,
  getNode,
  requiredSelectionCount,
  selectableIds,
  toggleSelection,
} from "./engine/engine";
import { isMission, type Chapter, type GameState, type Interlude } from "./engine/types";
import { ConsequenceScreen, LessonScreen, ResolvingScreen } from "./ui/consequence";
import { MissionBody } from "./ui/mission";
import { EndingScreen, InterludeScreen, TitleScreen } from "./ui/screens";
import { ActionBar, GameLayout, InsightRail, MissionRail, TopBar, scoreOf } from "./ui/shell";

const STORAGE_KEY = "gpl.save.v2";
const content = story;

function chapterFor(number: number): Chapter {
  return content.chapters.find((c) => c.number === number) ?? content.chapters[0];
}

function loadSave(): GameState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    // Cheap sanity check — a save from older content must not half-load.
    if (!parsed || typeof parsed.nodeId !== "string" || !content.nodes[parsed.nodeId]) return null;
    if (parsed.phase === "title") return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function App() {
  const [state, setState] = useState<GameState>(() => createInitialState(content));
  const savedRef = useRef<GameState | null>(null);
  const [hasSave, setHasSave] = useState(false);

  // Read any previous run once, on mount.
  useEffect(() => {
    const save = loadSave();
    savedRef.current = save;
    setHasSave(save !== null);
  }, []);

  // Persist every meaningful state change.
  useEffect(() => {
    if (state.phase === "title") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — the game still works, it just will not resume */
    }
  }, [state]);

  // Each beat starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [state.phase, state.nodeId]);

  const node = getNode(content, state.nodeId);

  const doAdvance = useCallback(() => setState((s) => advance(s, content)), []);
  const doCommit = useCallback(() => setState((s) => commit(s, content)), []);
  const doToggle = useCallback(
    (id: string) => setState((s) => toggleSelection(s, content, id)),
    [],
  );

  const doRestart = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    savedRef.current = null;
    setHasSave(false);
    setState(createInitialState(content));
  }, []);

  const doResume = useCallback(() => {
    if (savedRef.current) setState(savedRef.current);
  }, []);

  /**
   * Keyboard play.
   *   1–9   select the nth option on a decide screen
   *   Enter commit when ready, or advance any non-interactive beat
   * Ignored while focus is in a control, so Space/Enter on a focused button
   * keeps its normal meaning for keyboard and screen-reader users.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "BUTTON" || tag === "SUMMARY" || tag === "INPUT" || tag === "TEXTAREA") return;

      if (state.phase === "decide" && isMission(node)) {
        const index = Number.parseInt(e.key, 10);
        if (Number.isInteger(index) && index >= 1 && index <= 9) {
          const ids = selectableIds(node, state);
          const id = ids[index - 1];
          if (id) {
            e.preventDefault();
            doToggle(id);
          }
          return;
        }
        if (e.key === "Enter" && canCommit(state, content)) {
          e.preventDefault();
          doCommit();
        }
        return;
      }

      const advanceable =
        state.phase === "interlude" ||
        state.phase === "consequence" ||
        state.phase === "lesson" ||
        state.phase === "title";
      if (e.key === "Enter" && advanceable) {
        e.preventDefault();
        doAdvance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, node, doAdvance, doCommit, doToggle]);

  const missionNumber = useMemo(() => {
    if (isMission(node)) return content.missionOrder.indexOf(node.id) + 1;
    if (state.phase === "title") return null;
    return Math.min(state.completed.length + 1, content.missionOrder.length);
  }, [node, state.phase, state.completed.length]);

  /** Which chapter the stepper highlights. Interludes carry their own. */
  const currentChapter = useMemo(() => {
    if (node.kind === "ending") return content.chapters.length;
    if (node.kind === "interlude") return node.chapter;
    if (isMission(node)) return node.chapter;
    return 1;
  }, [node]);

  const isLastMission =
    isMission(node) && content.missionOrder.indexOf(node.id) === content.missionOrder.length - 1;

  const onDecideScreen = state.phase === "decide" && isMission(node);

  return (
    <div className="min-h-full">
      {state.phase !== "title" && (
        <TopBar
          chapters={content.chapters}
          currentChapter={currentChapter}
          score={scoreOf(state.dims)}
          showScore={state.history.length > 0}
          onRestart={doRestart}
        />
      )}

      <main>
        {state.phase === "title" && (
          <TitleScreen
            onBegin={doAdvance}
            hasSave={hasSave}
            onResume={doResume}
            chapters={content.chapters}
          />
        )}

        {state.phase === "interlude" && node.kind === "interlude" && (
          <InterludeScreen
            node={node as Interlude}
            chapter={chapterFor(node.chapter)}
            onContinue={doAdvance}
          />
        )}

        {onDecideScreen && isMission(node) && (
          <DecideScreen
            state={state}
            missionNumber={missionNumber ?? 1}
            onToggle={doToggle}
            onCommit={doCommit}
            node={node}
          />
        )}

        {state.phase === "resolving" && <ResolvingScreen onDone={doAdvance} />}

        {state.phase === "consequence" && state.resolution && (
          <ConsequenceScreen resolution={state.resolution} onContinue={doAdvance} />
        )}

        {state.phase === "lesson" && state.resolution && (
          <LessonScreen resolution={state.resolution} onContinue={doAdvance} isLast={isLastMission} />
        )}

        {state.phase === "ending" && <EndingScreen state={state} onRestart={doRestart} />}
      </main>
    </div>
  );
}

/** The briefing: rails on both sides, the mission in the middle, confirm at the bottom. */
function DecideScreen({
  node,
  state,
  missionNumber,
  onToggle,
  onCommit,
}: {
  node: ReturnType<typeof getNode>;
  state: GameState;
  missionNumber: number;
  onToggle: (id: string) => void;
  onCommit: () => void;
}) {
  if (!isMission(node)) return null;

  const need = requiredSelectionCount(node);
  const have = state.selection.length;
  const ready = have === need;
  const hint = ready
    ? undefined
    : node.kind === "choice"
      ? "Pick one to continue"
      : `${have} of ${need} chosen`;

  return (
    <GameLayout
      left={
        <MissionRail
          chapter={chapterFor(node.chapter)}
          missionId={node.id}
          missionNumber={missionNumber}
          totalMissions={content.missionOrder.length}
          completed={state.completed}
          objective={node.objective}
          minutes={node.minutes}
          advisor={node.advisor}
        />
      }
      right={
        <InsightRail
          dims={state.dims}
          consider={node.consider}
          badges={state.badges}
          knownCount={state.discovered.length}
        />
      }
      bottom={
        <ActionBar
          tip={node.tip}
          hint={hint}
          label="Confirm decision"
          onAction={onCommit}
          disabled={!ready}
        />
      }
    >
      <MissionBody mission={node} state={state} content={content} onToggle={onToggle} />
    </GameLayout>
  );
}
