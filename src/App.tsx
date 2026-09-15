import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { story } from "./content/story";
import {
  advance,
  canCommit,
  chooseSetup,
  commit,
  createInitialState,
  getNode,
  ledger,
  selectableIds,
  selectionComplete,
  setPrediction,
  toggleSelection,
} from "./engine/engine";
import {
  DIMENSIONS,
  isMission,
  type Chapter,
  type DimensionId,
  type GameState,
  type Interlude,
  type Mission,
  type Setup,
} from "./engine/types";
import { ConsequenceScreen, ResolvingScreen } from "./ui/consequence";
import { BriefBody, DecideBody } from "./ui/mission";
import { EndingScreen, InterludeScreen, SetupScreen, TitleScreen } from "./ui/screens";
import {
  ActionBar,
  Console,
  InsightRail,
  MissionRail,
  PredictionStrip,
  TopBar,
  scoreOf,
} from "./ui/shell";

const STORAGE_KEY = "gpl.save.v3";
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

  useEffect(() => {
    const save = loadSave();
    savedRef.current = save;
    setHasSave(save !== null);
  }, []);

  useEffect(() => {
    if (state.phase === "title") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — the game still works, it just will not resume */
    }
  }, [state]);

  const node = getNode(content, state.nodeId);

  const doAdvance = useCallback(() => setState((s) => advance(s, content)), []);
  const doCommit = useCallback(() => setState((s) => commit(s, content)), []);
  const doToggle = useCallback((id: string) => setState((s) => toggleSelection(s, content, id)), []);
  const doPredict = useCallback((d: DimensionId) => setState((s) => setPrediction(s, d)), []);
  // Chapter 0 picks in two steps like everything else: choose, then confirm.
  const [advantage, setAdvantage] = useState<string | null>(null);
  const doSetup = useCallback(() => {
    if (advantage) setState((s) => chooseSetup(s, content, advantage));
  }, [advantage]);

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
   *   1–9   select the nth option
   *   w/p/d call which dimension this will cost
   *   Enter commit when ready, or advance any non-interactive beat
   * Ignored while focus is in a control, so Space/Enter on a focused button keeps its
   * normal meaning for keyboard and screen-reader users.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "BUTTON" || tag === "SUMMARY" || tag === "INPUT" || tag === "TEXTAREA") return;

      if (state.phase === "decide" && isMission(node)) {
        const index = Number.parseInt(e.key, 10);
        if (Number.isInteger(index) && index >= 1 && index <= 9) {
          const id = selectableIds(node, state)[index - 1];
          if (id) {
            e.preventDefault();
            doToggle(id);
          }
          return;
        }
        const dim = { w: "win", p: "profit", d: "deliver" }[e.key.toLowerCase()] as
          | DimensionId
          | undefined;
        if (dim && DIMENSIONS.includes(dim) && selectionComplete(state, content)) {
          e.preventDefault();
          doPredict(dim);
          return;
        }
        if (e.key === "Enter" && canCommit(state, content)) {
          e.preventDefault();
          doCommit();
        }
        return;
      }

      const advanceable =
        state.phase === "interlude" || state.phase === "consequence" || state.phase === "title";
      if (e.key === "Enter" && advanceable) {
        e.preventDefault();
        doAdvance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, node, doAdvance, doCommit, doToggle, doPredict]);

  const missionNumber = useMemo(() => {
    if (isMission(node)) return content.missionOrder.indexOf(node.id) + 1;
    if (state.phase === "title") return null;
    return Math.min(state.completed.length + 1, content.missionOrder.length);
  }, [node, state.phase, state.completed.length]);

  const currentChapter = useMemo(() => {
    if (node.kind === "ending") return content.chapters.length;
    return node.kind === "interlude" || isMission(node) ? node.chapter : 1;
  }, [node]);

  const isLastMission =
    isMission(node) && content.missionOrder.indexOf(node.id) === content.missionOrder.length - 1;

  if (state.phase === "title") {
    return (
      <TitleScreen
        onBegin={doAdvance}
        hasSave={hasSave}
        onResume={doResume}
        chapters={content.chapters}
      />
    );
  }

  const onBrief = state.phase === "brief" && isMission(node);
  const onDecide = state.phase === "decide" && isMission(node);
  const mission = isMission(node) ? node : null;
  /* On a consequence beat the node has not moved yet, so `mission` is still the one just
     played — which is exactly whose rail, advisor and hero photo belong on screen. */
  const onResult = state.phase === "consequence" && mission !== null;
  const framed = onBrief || onDecide || onResult;
  const need = mission ? requiredCount(mission) : 0;
  const ready = canCommit(state, content);
  const selected = selectionComplete(state, content);

  const bars = (
    <TopBar
      chapters={content.chapters}
      currentChapter={currentChapter}
      score={scoreOf(state.dims)}
      showScore={state.history.length > 0}
      onRestart={doRestart}
    />
  );

  /* The action bar is part of the console, so it never scrolls away. Its label names
     exactly what happens, and on a decide screen the prediction gate sits beside it. */
  let bottom: React.ReactNode = null;
  if (onBrief) {
    bottom = <ActionBar label="See your options" onAction={doAdvance} />;
  } else if (onDecide) {
    bottom = (
      <ActionBar
        label="Commit to this"
        onAction={doCommit}
        disabled={!ready}
        aside={
          mission?.tip && mission.advisor
            ? {
                from: mission.advisor.name,
                text: mission.tip,
                photo: mission.advisor.photo,
              }
            : undefined
        }
      >
        {selected ? (
          <PredictionStrip prediction={state.prediction} onPredict={doPredict} />
        ) : (
          <span className="text-[12.5px] text-(--color-muted)">
            {mission?.kind === "choice"
              ? "Choose an approach to continue"
              : `${state.selection.length} of ${need} chosen`}
          </span>
        )}
      </ActionBar>
    );
  } else if (state.phase === "consequence") {
    bottom = (
      <ActionBar
        label={isLastMission ? "See how it went" : "Next mission"}
        onAction={doAdvance}
      />
    );
  } else if (state.phase === "ending") {
    bottom = <ActionBar label="Take a new brief" onAction={doRestart} />;
  } else if (state.phase === "interlude") {
    bottom = <ActionBar label="Begin the chapter" onAction={doAdvance} />;
  } else if (state.phase === "setup") {
    bottom = (
      <ActionBar label="Start the pursuit" onAction={doSetup} disabled={!advantage}>
        <span className="text-[12.5px] text-(--color-muted)">
          {advantage ? "This is who you are for the rest of the run." : "Pick your team's strength"}
        </span>
      </ActionBar>
    );
  }

  return (
    <Console
      bars={bars}
      bottom={bottom}
      left={
        framed && mission ? (
          <MissionRail
            chapter={chapterFor(mission.chapter)}
            missionId={mission.id}
            missionNumber={missionNumber ?? 1}
            totalMissions={content.missionOrder.length}
            completed={state.completed}
            /* Orientation only on the decision beat: greyscale, unchanged between beats,
               nothing the player has to read while comparing options. */
            objective={onBrief ? mission.objective : undefined}
            minutes={onBrief ? mission.minutes : undefined}
            file={onBrief || onResult ? discoveredFile(state) : undefined}
          />
        ) : undefined
      }
      right={
        framed && mission ? (
          <InsightRail
            dims={state.dims}
            entries={ledger(state)}
            /* The colleague's questions live on the brief now. Beside the options they
               were station-2 content sitting in a rail, which is exactly the
               mis-placement the framework warns about. */
            collapsed={onDecide}
            commits={onDecide ? selectedCommits(mission, state) : undefined}
          />
        ) : undefined
      }
    >
      {onBrief && mission && <BriefBody mission={mission} state={state} />}

      {onDecide && mission && (
        <DecideBody mission={mission} state={state} onToggle={doToggle} />
      )}

      {state.phase === "setup" && node.kind === "setup" && (
        <SetupScreen node={node as Setup} chosen={advantage} onChoose={setAdvantage} />
      )}

      {state.phase === "interlude" && node.kind === "interlude" && (
        <InterludeScreen node={node as Interlude} chapter={chapterFor(node.chapter)} />
      )}

      {state.phase === "resolving" && <ResolvingScreen onDone={doAdvance} />}

      {state.phase === "consequence" && state.resolution && (
        <ConsequenceScreen
          resolution={state.resolution}
          advisor={mission?.advisor}
          hero={mission?.hero}
        />
      )}

      {state.phase === "ending" && <EndingScreen state={state} />}
    </Console>
  );
}

function requiredCount(mission: Mission): number {
  return mission.kind === "choice" ? 1 : mission.kind === "investigate" ? mission.slots : mission.pick;
}

/**
 * Everything the player has paid to find out, for the rail's file. Reference material
 * that is present and never tested — see docs/ENGAGEMENT-MODEL.md on Papers, Please.
 */
function discoveredFile(state: GameState) {
  const out: { id: string; label: string; reveals: string }[] = [];
  for (const node of Object.values(content.nodes)) {
    if (node.kind !== "investigate") continue;
    for (const e of node.evidence) {
      if (state.discovered.includes(e.id)) out.push({ id: e.id, label: e.label, reveals: e.reveals });
    }
  }
  return out;
}

/** What the selected option would lock in, for the rail's "If you commit" preview. */
function selectedCommits(mission: Mission, state: GameState): string | undefined {
  if (mission.kind !== "choice") return undefined;
  return mission.options.find((o) => o.id === state.selection[0])?.commits;
}
