import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { story } from "./content/story";
import {
  advance,
  canCommit,
  commit,
  createInitialState,
  getNode,
  selectableIds,
  toggleSelection,
} from "./engine/engine";
import { isMission, type GameState, type Interlude, type StageId } from "./engine/types";
import { TopBar } from "./ui/chrome";
import { ConsequenceScreen, LessonScreen, ResolvingScreen } from "./ui/consequence";
import { MissionScreen } from "./ui/mission";
import { EndingScreen, InterludeScreen, TitleScreen } from "./ui/screens";

const STORAGE_KEY = "gpl.save.v2";
const content = story;

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

  const stage: StageId | null = useMemo(() => {
    if (isMission(node)) return node.stage;
    const last = state.history[state.history.length - 1];
    return last ? last.stage : null;
  }, [node, state.history]);

  const isLastMission =
    isMission(node) && content.missionOrder.indexOf(node.id) === content.missionOrder.length - 1;

  return (
    <div className="min-h-full">
      {state.phase !== "title" && (
        <TopBar
          dims={state.dims}
          stage={stage}
          missionNumber={missionNumber}
          totalMissions={content.missionOrder.length}
          onRestart={doRestart}
          showMeters={state.history.length > 0}
        />
      )}

      <main>
        {state.phase === "title" && (
          <TitleScreen onBegin={doAdvance} hasSave={hasSave} onResume={doResume} />
        )}

        {state.phase === "interlude" && node.kind === "interlude" && (
          <InterludeScreen node={node as Interlude} onContinue={doAdvance} />
        )}

        {state.phase === "decide" && isMission(node) && (
          <MissionScreen
            mission={node}
            state={state}
            content={content}
            missionNumber={missionNumber ?? 1}
            totalMissions={content.missionOrder.length}
            onToggle={doToggle}
            onCommit={doCommit}
          />
        )}

        {state.phase === "resolving" && <ResolvingScreen onDone={doAdvance} />}

        {state.phase === "consequence" && state.resolution && (
          <ConsequenceScreen resolution={state.resolution} onContinue={doAdvance} />
        )}

        {state.phase === "lesson" && state.resolution && (
          <LessonScreen
            resolution={state.resolution}
            onContinue={doAdvance}
            isLast={isLastMission}
          />
        )}

        {state.phase === "ending" && <EndingScreen state={state} onRestart={doRestart} />}
      </main>
    </div>
  );
}
