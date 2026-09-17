import { useCallback, useEffect, useMemo, useState, useRef } from "react";

import { story } from "./content/story";
import { decodeRun } from "./engine/runcode";
import {
  LEGACY_SAVE_KEYS,
  decodeSave,
  encodeSave,
  saveKey,
  type LoadOutcome,
} from "./engine/save";
import {
  advance,
  canCommit,
  chooseSetup,
  commit,
  createInitialState,
  getNode,
  ledger,
  selectionComplete,
  setPrediction,
  toggleSelection,
} from "./engine/engine";
import {
  isMission,
  type Chapter,
  type DimensionId,
  type GameState,
  type Interlude,
  type Mission,
  type Setup,
} from "./engine/types";
import {
  ConsequenceScreen,
  ResolvingScreen,
  resolutionAnnouncement,
} from "./ui/consequence";
import { DialogueScene, isDialogue } from "./ui/dialogue";
import { BriefBody, DecideBody } from "./ui/mission";
import { CutScene } from "./ui/cutscene";
import { PerformanceDashboard } from "./ui/dashboard";
import { ChapterDebrief } from "./ui/debrief";
import { ReflectionRail, ReflectionScreen } from "./ui/reflection";
import { HubScreen } from "./ui/hub";
import { JourneyMap } from "./ui/journey";
import { BadgeEarned } from "./ui/reward";
import {
  EndingScreen,
  SetupScreen,
  TitleScreen,
} from "./ui/screens";
import {
  ActionBar,
  BEAT_TITLE_ID,
  Console,
  InsightRail,
  MissionRail,
  PREDICTION_QUESTION_ID,
  PredictionStrip,
  TopBar,
  UI_LABEL,
} from "./ui/shell";

/**
 * The save key no longer carries a version, because the version is now inside the file.
 *
 * It was `gpl.save.v3`, which meant every content change silently voided every
 * in-progress save: ship a typo fix mid-cohort and the room resets with no message. The
 * envelope carries a schema version and two content fingerprints instead, so a stale save
 * can say so — and can hand the player the run code it stored at save time, which is
 * fourteen characters and replays the whole run.
 */
const STORAGE_KEY = saveKey();
const content = story;

/** How many beats there are to do, derived so it cannot drift from the content. */
const missionTotal = Object.values(content.nodes).filter((n) => isMission(n)).length;

function chapterFor(number: number): Chapter {
  return (
    content.chapters.find((c) => c.number === number) ?? content.chapters[0]
  );
}

function loadSave(): LoadOutcome {
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      LEGACY_SAVE_KEYS.map((k) => window.localStorage.getItem(k)).find((v) => v !== null) ??
      null;
    return decodeSave(raw, content);
  } catch {
    return { status: "empty" };
  }
}

/**
 * Is the window wide enough for the console?
 *
 * A media query rather than `lg:hidden`, because hiding with CSS leaves the narrow-screen
 * heading in the DOM at every width — two `h1`s on every screen, which is an accessibility
 * defect in its own right and broke the browser harness, whose first `h1` was suddenly an
 * invisible one. One tree renders, not two.
 */
function useWideEnough(): boolean {
  const query = "(min-width: 1024px)";
  const [wide, setWide] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setWide(e.matches);
    mq.addEventListener("change", onChange);
    setWide(mq.matches);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return wide;
}

/**
 * Below 1024px the game is not supported, and says so.
 *
 * The console is six regions visible at once by design; the option card alone is five
 * information layers in a 274px column. At 390px the whole thing was rendering as a
 * 2,700px vertical stack with the primary action clipped and the page silently scrolled
 * 250px sideways inside an `overflow-hidden` shell — a layout nobody designed, which
 * looked supported.
 *
 * The panel split on this. The UX reviewer's position — a reflow nobody designed is the
 * one dishonest option — is what ships, because a phone architecture is a second design
 * to author and test. The accessibility reviewer's objection is recorded and stands: a
 * README line is not a reasonable adjustment, so a real mobile layout is a precondition
 * for any mandatory deployment, not a nice-to-have. Verified clean at 1024×768 and up.
 */
function NarrowScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 items-center justify-center rounded-[13px] text-[13px] font-bold text-white"
        style={{ background: "var(--color-brand-solid)" }}
      >
        GPL
      </span>
      <h1 className="text-[24px] font-bold leading-tight text-(--color-text-strong)">
        This one needs a bigger screen
      </h1>
      <p className="max-w-[34ch] text-[15px] leading-relaxed text-(--color-text-muted)">
        GPL puts the brief, your options and where you stand side by side, which
        needs a laptop or desktop window at least 1024px wide.
      </p>
      <p className="max-w-[34ch] text-[13px] text-(--color-text-subtle)">
        Nothing is lost — a run in progress is saved in this browser and will be
        waiting.
      </p>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<GameState>(() =>
    createInitialState(content),
  );
  const [saved, setSaved] = useState<LoadOutcome>({ status: "empty" });

  useEffect(() => {
    setSaved(loadSave());
  }, []);

  useEffect(() => {
    if (state.phase === "title") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, encodeSave(state, content));
      /* The migration only closes once the old copy is gone, or a later load would keep
         adopting a bare state that has no fingerprint and cannot be checked. */
      for (const k of LEGACY_SAVE_KEYS) window.localStorage.removeItem(k);
    } catch {
      /* storage unavailable — the game still works, it just will not resume */
    }
  }, [state]);

  const node = getNode(content, state.nodeId);

  const doAdvance = useCallback(() => setState((s) => advance(s, content)), []);
  const doCommit = useCallback(() => setState((s) => commit(s, content)), []);
  const doToggle = useCallback(
    (id: string) => setState((s) => toggleSelection(s, content, id)),
    [],
  );
  const doPredict = useCallback(
    (d: DimensionId) => setState((s) => setPrediction(s, d)),
    [],
  );
  // Chapter 0 picks in two steps like everything else: choose, then confirm.
  const [advantage, setAdvantage] = useState<string | null>(null);
  const doSetup = useCallback(() => {
    if (advantage) setState((s) => chooseSetup(s, content, advantage));
  }, [advantage]);

  const doRestart = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      for (const k of LEGACY_SAVE_KEYS) window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
    setSaved({ status: "empty" });
    setState(createInitialState(content));
  }, []);

  const doResume = useCallback(() => {
    if (saved.status === "ok") setState(saved.state);
  }, [saved]);

  /**
   * Resume from a run code.
   *
   * The whole run is fourteen characters, because the game is deterministic: the code is
   * the list of decisions, not the state. That is what makes a stale save recoverable, a
   * bug reproducible from a bug report, and a cohort comparable without a backend.
   * `decodeRun` returns a reason rather than throwing, so a mistyped code says which
   * character class failed instead of quietly playing somebody else's run.
   */
  const doCode = useCallback((code: string): string | null => {
    const read = decodeRun(content, code);
    if (!read.ok) return read.message;
    setState(read.state);
    return null;
  }, []);

  /**
   * There used to be a window `keydown` handler here binding `1`–`9`, `w`, `p`, `d` and
   * `Enter`. It is deleted, not rescoped, and about forty lines went with it.
   *
   * It was a Level A failure of 2.1.4: single-character shortcuts with no way to turn
   * them off, no modifier and no requirement that anything be focused. It suppressed
   * itself only when `e.target.tagName` was BUTTON, SUMMARY, INPUT or TEXTAREA — so it
   * fired on every keypress that reached `<body>`, which is precisely where a
   * screen-reader user in browse mode lives. `d` is NVDA's landmark key and `1` its
   * heading key; navigating this game by heading silently selected option one.
   *
   * It was also already broken for the player it was built for. After any mouse click
   * the clicked button keeps focus, so `e.target` stayed a BUTTON and the handler
   * ignored every subsequent keypress for the rest of the run.
   *
   * Nothing is lost. Every option is a real `<button>` in a `radiogroup` — one tab stop,
   * arrows to move between cards, Space to choose — and the primary action is the last
   * tab stop on every beat. `Enter` is gone too: on the title screen it meant "start
   * again", which discarded a saved run on a keystroke, and it advanced interludes and
   * consequences but not briefs. An inconsistent shortcut that destroys progress is
   * worse than no shortcut. (Backlog 3.2, and 8.6 falls out with it.)
   */

  /**
   * What the two live regions say. See `LiveRegions` in `ui/shell.tsx` for why they
   * exist at all; this is the only place that knows enough to fill them.
   */
  const announce =
    state.phase === "consequence" && state.resolution
      ? resolutionAnnouncement(state.resolution)
      : "";

  /* Bumped when a gated button is activated, to re-speak a requirement that has not
     changed. Doing nothing in response to a keypress is not an answer. */
  const [gateNudge, setGateNudge] = useState(0);
  const nudgeGate = useCallback(() => setGateNudge((n) => n + 1), []);

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
    isMission(node) &&
    content.missionOrder.indexOf(node.id) === content.missionOrder.length - 1;

  /**
   * Where the player is LOOKING, which is not where they are in the pursuit.
   *
   * Deliberately React state and not a `Phase`. Opening the map or the awards board is
   * not a move in the game — it changes nothing, costs nothing and must be leavable with
   * the state exactly as it was. Making it a phase would have put a view preference into
   * the save file and into every exhaustive sweep of the state space.
   */
  const [view, setView] = useState<"play" | "journey" | "awards">("play");
  const backToPlay = useCallback(() => setView("play"), []);

  /**
   * The badge the player has just earned, if any, shown once.
   *
   * `resolution.newBadges` has existed since the engine was written and no screen has
   * ever read it — six badges that the game awards and never once mentions. A ref, not a
   * flag in state: the modal is a presentation event, and it must not re-fire when the
   * consequence screen re-renders.
   */
  const shownBadge = useRef<string | null>(null);
  const freshBadge = state.resolution?.newBadges?.[0] ?? null;
  const badgeKey = freshBadge ? `${state.nodeId}:${freshBadge}` : null;
  const [dismissedBadge, setDismissedBadge] = useState<string | null>(null);
  if (badgeKey && shownBadge.current !== badgeKey) shownBadge.current = badgeKey;
  const badgeToShow =
    state.phase === "consequence" && freshBadge && dismissedBadge !== badgeKey ? freshBadge : null;

  /**
   * Who fronts this cut scene: the colleague who briefs the chapter it opens.
   *
   * An interlude has no advisor of its own, and a cinematic beat with no face in it is
   * the chapter card we are replacing. So look forward to the first mission of the
   * chapter and borrow its advisor — which is also who the player is about to hear from,
   * so the figure introduces the voice rather than decorating the screen.
   */
  const nextAdvisor = useMemo(() => {
    if (node.kind !== "interlude") return undefined;
    const first = content.missionOrder
      .map((id) => content.nodes[id])
      .find((m) => m && isMission(m) && m.chapter === node.chapter);
    return first && isMission(first) ? first.advisor : undefined;
  }, [node]);

  /** Which of the four interlude screens this beat is. `chapter-open` is the default. */
  const interludeRole = node.kind === "interlude" ? (node.role ?? "chapter-open") : null;

  const wideEnough = useWideEnough();

  /* The hub, once there is a run to come back to. A first-time player still meets the
     title screen, because a hub with every number at zero explains nothing. */
  if (state.phase === "title" && state.completed.length > 0) {
    return wideEnough ? (
      <HubScreen
        state={state}
        onContinue={doAdvance}
        onViewJourney={() => setView("journey")}
        onViewRecognition={() => setView("awards")}
      />
    ) : (
      <NarrowScreen />
    );
  }

  if (state.phase === "title") {
    return wideEnough ? (
      <TitleScreen
        onBegin={doAdvance}
        hasSave={saved.status === "ok"}
        onResume={doResume}
        stale={saved.status === "stale" ? saved : null}
        onCode={doCode}
        chapters={content.chapters}
      />
    ) : (
      <NarrowScreen />
    );
  }

  const onBrief = state.phase === "brief" && isMission(node);
  const onDecide = state.phase === "decide" && isMission(node);
  const mission = isMission(node) ? node : null;
  /* On a consequence beat the node has not moved yet, so `mission` is still the one just
     played — which is exactly whose rail, advisor and hero photo belong on screen. */
  const onResult = state.phase === "consequence" && mission !== null;
  /**
   * The resolving beat is now inside the frame, and that one change is what makes the
   * meters move rather than merely differ.
   *
   * It used to be outside it: `framed` excluded `resolving`, so committing a decision
   * unmounted both rails and the action bar for one second and then mounted them again.
   * The three meters the player had been looking at for the whole decision therefore did
   * not travel from 58 to 64 — they were destroyed at 58 and recreated at 64, with a
   * full-width shimmer screen in between. There was no animation to get wrong, because
   * there were no persistent elements left to animate. A CSS transition needs the same
   * DOM node at both values.
   *
   * Keeping the frame up also holds every edge of the console still from the decision
   * through to the result, which is the other half of the "static screen changes"
   * complaint: the rails and the bottom bar were flickering in and out around the one
   * beat that is supposed to feel continuous.
   */
  const onResolving = state.phase === "resolving" && mission !== null;
  /* A reflection is framed too — it is a paper beat inside the console. The other three
     interlude roles are full-bleed and take no frame. */
  const onReflection = state.phase === "interlude" && interludeRole === "reflection";
  const framed = onBrief || onDecide || onResolving || onResult || onReflection;
  /** The meters have just moved on exactly these two beats, and only they pass `from`. */
  const moved = (onResolving || onResult) && state.resolution ? state.resolution : null;
  const need = mission ? requiredCount(mission) : 0;
  const ready = canCommit(state, content);
  const selected = selectionComplete(state, content);
  /**
   * Is this beat staged as a conversation?
   *
   * One flag, read in two places: it swaps the work area for the call surface, and it
   * moves the prediction gate off the action bar and into the composer. Nothing else in
   * this file changes — same phases, same `canCommit`, same rails, same primary action.
   * See `ui/dialogue.tsx`.
   */
  const conversation = mission !== null && isDialogue(mission) ? mission : null;
  const dialogue = conversation !== null;

  const bars = (
    <TopBar
      chapters={content.chapters}
      currentChapter={currentChapter}
      onRestart={doRestart}
      /* Progress, not a score. The mean-of-meters figure that used to live in this bar
         was deleted because it invited the player to optimise the grader; "n of 17
         done" cannot be gamed, because the only way to move it is to play the beats. */
      progress={{ done: state.completed.length, total: missionTotal }}
      badgeCount={state.badges.length}
      onJourney={() => setView(view === "journey" ? "play" : "journey")}
      onRecognition={() => setView(view === "awards" ? "play" : "awards")}
    />
  );

  /**
   * What still stands between the player and committing, in words.
   *
   * One expression, used three ways: rendered in the action bar when there is no
   * prediction strip up, pointed at by the button's `aria-describedby`, and spoken by
   * the gate's live region as it changes. It was previously only the first of those,
   * as a `<span>` associated with nothing.
   */
  const gate = onDecide
    ? !selected
      ? mission?.kind === "choice"
        ? UI_LABEL.chooseApproach
        : `${state.selection.length} of ${need} chosen`
      : state.prediction === null
        ? /* The prediction strip is on screen and asks it; do not write it twice. */
          "Which of the three will move least?"
        : UI_LABEL.ready
    : state.phase === "setup"
      ? advantage
        ? UI_LABEL.teamPicked
        : UI_LABEL.pickTeam
      : "";

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
        onBlocked={nudgeGate}
        /* When the strip is up it already states the requirement, so the button points
           at that sentence rather than putting a second copy in the bar. */
        hint={selected ? undefined : gate}
        hintId={selected ? PREDICTION_QUESTION_ID : undefined}
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
        {/* On a conversation beat the gate is NOT here. It sits indented under the reply
            the player has just chosen, which is the fix for the reported "cannot get past
            Commit to this" — the requirement was legible as a legend and not as a
            control. `PREDICTION_QUESTION_ID` moves with it, so the button still points at
            whichever copy of the question is on screen and there is only ever one. */}
        {selected && !dialogue ? (
          <PredictionStrip
            prediction={state.prediction}
            onPredict={doPredict}
          />
        ) : null}
      </ActionBar>
    );
  } else if (state.phase === "resolving") {
    /* No button — there is nothing to do for this one second, and offering a control that
       does nothing would be worse than offering none. But the bar stays up carrying the
       colleague's steer, which is still their advice about the decision just taken, so
       the console's bottom edge does not drop 66px and come back. */
    bottom = (
      <ActionBar
        aside={
          mission?.tip && mission.advisor
            ? { from: mission.advisor.name, text: mission.tip, photo: mission.advisor.photo }
            : undefined
        }
      />
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
    /* No action bar. The cut scene is a full-bleed change of place and carries its own
       Begin, so the bar was putting a second identical button 250px below the first. A
       cinematic beat with console furniture bolted under it is not a cut scene. */
    bottom = null;
  } else if (state.phase === "setup") {
    bottom = (
      <ActionBar
        label="Start the pursuit"
        onAction={doSetup}
        disabled={!advantage}
        onBlocked={nudgeGate}
        hint={advantage ? UI_LABEL.teamPicked : UI_LABEL.pickTeam}
      />
    );
  }

  if (!wideEnough) return <NarrowScreen />;

  return (
    <Console
      bars={bars}
      bottom={bottom}
      live={{ announce, gate, gateKey: gateNudge }}
      /* A new beat is a new screen, so focus goes to the work area. Includes `phase`,
         because brief→decide is the same node and is very much a new screen. */
      focusKey={`${state.nodeId}:${state.phase}`}
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
            /* From the resolving beat, not the consequence: the evidence was discovered
               at the moment of commit, so this is when it honestly appears — and it lands
               on the beat whose subject is what the decision did, rather than arriving as
               an extra insertion underneath the result while the result is being read. */
            file={onBrief || onResolving || onResult ? discoveredFile(state) : undefined}
          />
        ) : undefined
      }
      right={
        /**
         * `ReflectionRail`, not `InsightRail` with the meters hidden.
         *
         * A reflection is the only paper screen with the meters REMOVED, and that absence
         * is the teaching: meters mean stakes, so no meters means nothing is at stake. It
         * is a different component rather than a flag on this one so that a later edit
         * inside `InsightRail` cannot quietly undo the single rule the screen exists for.
         */
        onReflection ? (
          <ReflectionRail file={discoveredFile(state)} />
        ) : framed && mission ? (
          <InsightRail
            dims={state.dims}
            /* `state.dims` is ALREADY the new values by the time the phase is
               `resolving` — `commit` applies them and then sets the phase — so the rail
               needs telling where they came from before it can show them arriving. */
            from={moved?.dimsBefore}
            entries={ledger(state)}
            /* The colleague's questions live on the brief now. Beside the options they
               were station-2 content sitting in a rail, which is exactly the
               mis-placement the framework warns about. */
            /* Stays collapsed through resolving on purpose. Opening the ledger is a
               ~120px change of shape in this rail, and if it happened on commit it would
               be the loudest thing on screen at the exact moment the three meters are
               supposed to be the only thing moving. It opens one beat later, with the
               result, where it is the quietest change on a screen that is all change. */
            collapsed={onDecide || onResolving}
            commits={onDecide ? selectedCommits(mission, state) : undefined}
          />
        ) : undefined
      }
    >
      {/**
       * A conversation beat is ONE screen across two phases, and that is why it is one
       * slot in this list rather than two.
       *
       * `brief` and `decide` are two phases in the engine — they have to be, because the
       * whole game gates a commit on a selection that only the second one offers. But a
       * call does not end and restart when you are ready to answer. Keeping the element
       * in a single position keeps React's instance alive across the phase change, so the
       * window, the participants and the caption are literally the same DOM: the floor
       * passes to the player and the region under the transcript becomes the composer.
       * Splitting it into two slots would unmount and remount the call, which is a cut
       * dressed as a conversation and would retype the line the player just read.
       */}
      {(onBrief || onDecide) && conversation && (
        <DialogueScene
          key={conversation.id}
          mission={conversation}
          state={state}
          phase={onDecide ? "reply" : "listen"}
          /* The same counter the live region uses to re-speak the requirement. Here it
             re-lands the gate under the chosen reply, because on this surface that is
             where the requirement is — the action bar has nothing to flash. */
          nudge={gateNudge}
          onToggle={doToggle}
          onPredict={doPredict}
        />
      )}

      {onBrief && mission && !dialogue && <BriefBody mission={mission} state={state} />}

      {onDecide && mission && !dialogue && (
        <DecideBody mission={mission} state={state} onToggle={doToggle} />
      )}

      {state.phase === "setup" && node.kind === "setup" && (
        <SetupScreen
          node={node as Setup}
          chosen={advantage}
          onChoose={setAdvantage}
        />
      )}

      {/* The chapter card becomes a cut scene: a full-bleed change of place, a figure at
          400px rather than a 104px circle, and a Begin action. `InterludeScreen` is kept
          for the print debrief, which must stay paper. */}
      {/**
        * Four screens, one node kind, routed on `role`.
        *
        * Twelve interludes were added to the graph and every one of them rendered as a
        * chapter opener until this existed — so the reflections and the chapter debriefs
        * were in the run, reachable, and invisible, and `verify` reported "17 interludes
        * for 5 chapters" without being able to say why.
        */}
      {state.phase === "interlude" && node.kind === "interlude" && (
        <>
          {interludeRole === "reflection" && (
            <ReflectionScreen node={node as Interlude} onRespond={doAdvance} />
          )}
          {interludeRole === "chapter-debrief" && (
            <ChapterDebrief
              state={state}
              content={content}
              node={node as Interlude}
              onExit={doAdvance}
            />
          )}
          {(interludeRole === "chapter-open" || interludeRole === "turn") && (
            <CutScene
              node={node as Interlude}
              chapter={chapterFor(node.chapter)}
              /* A turn is something done TO the player, so it carries no figure — nobody
                 is briefing you when the rival moves or the sponsor resigns. */
              person={interludeRole === "turn" ? undefined : nextAdvisor}
              onBegin={doAdvance}
              titleId={BEAT_TITLE_ID}
            />
          )}
        </>
      )}

      {state.phase === "resolving" && (
        <ResolvingScreen resolution={state.resolution} onDone={doAdvance} />
      )}

      {state.phase === "consequence" && state.resolution && (
        <ConsequenceScreen
          resolution={state.resolution}
          advisor={mission?.advisor}
          /* The same expression the rail gets, so the centre band and the rail read as
             one event rather than two things that happen to agree. */
          from={state.resolution.dimsBefore}
        />
      )}

      {state.phase === "ending" && <EndingScreen state={state} />}

      {/* Stepping out. Both are overlays on the working area rather than routes, so the
          beat underneath keeps its state and returning costs nothing. */}
      {view === "journey" && (
        <JourneyMap state={state} content={content} onSelectMission={backToPlay} />
      )}
      {/* The dashboard, not a leaderboard: there is no backend, and an invented cohort
          is a lie a learner spots. It carries the recognition board inside it. */}
      {view === "awards" && <PerformanceDashboard state={state} content={content} onDismiss={backToPlay} />}

      {/* Six badges the engine has always awarded and no screen has ever mentioned. */}
      {badgeToShow && (
        <BadgeEarned badge={badgeToShow} onDismiss={() => setDismissedBadge(badgeKey)} />
      )}
    </Console>
  );
}

function requiredCount(mission: Mission): number {
  return mission.kind === "choice"
    ? 1
    : mission.kind === "investigate"
      ? mission.slots
      : mission.pick;
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
      if (state.discovered.includes(e.id))
        out.push({ id: e.id, label: e.label, reveals: e.reveals });
    }
  }
  return out;
}

/** What the selected option would lock in, for the rail's "If you commit" preview. */
function selectedCommits(
  mission: Mission,
  state: GameState,
): string | undefined {
  if (mission.kind !== "choice") return undefined;
  return mission.options.find((o) => o.id === state.selection[0])?.commits;
}
