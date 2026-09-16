/**
 * The conversation surfaces — the second way a mission can be staged.
 *
 * Seventeen missions rendered as one shape: a brief, a row of comparison columns, a
 * consequence. The complaint that produced this file was that the game "doesn't feel
 * dynamic because the screens are almost the same", and they were — so no transition
 * could fix it, because animating between two identical shapes is still the same shape.
 * Variety has to come from RHYTHM, which means some beats stop being a console and become
 * a conversation. See `Presentation` and `Surface` in `engine/types.ts`.
 *
 * **It is our own product's call window, not a visual novel and not Teams.** A painted
 * stage with a character bust was built and thrown away: a VN is a genre transplant onto a
 * consulting game, and it needs 21 sprites and 9 painted rooms that do not exist
 * (`docs/ART-BRIEF.md`). Consultants live in calls and chat threads, so the interface
 * becomes the fiction rather than illustrating it — which costs almost no art, because a
 * call with the cameras off is a grid of initials in circles, and that device is already
 * in the build for the three client voices who have no photograph. It stops being a
 * fallback and becomes the authentic state.
 *
 * Three things this buys, in order of importance:
 *
 *  1. **Dynamism becomes information.** The active-speaker ring, the camera-off chip, the
 *     floor passing to you when the replies open — each one tells the player something.
 *     That was the actual complaint: not that nothing moved, but that nothing *meant*
 *     anything when it did.
 *  2. **The choice mechanic is native to the medium.** A composer offering three things
 *     you could say is simply how anyone answers on a call. `Option.say` is the same
 *     option in the first person; nothing about the decision, the branching or the state
 *     changes.
 *  3. **The commit gate becomes legible.** The reported bug — "cannot get past Commit to
 *     this" — is a layout defect, not a rules defect: the gate needs a selection *and* a
 *     prediction, and the prediction was a 13px question with three chips wedged into the
 *     bottom bar beside a colleague's photograph, where it read as a legend rather than a
 *     control. Here it is sequential and vertical: pick a reply, the reply highlights, the
 *     question appears indented directly beneath that reply, then the action goes live.
 *     Same `canCommit`, same two requirements, nothing weakened.
 *
 * NO GAME RULES LIVE HERE. Which voice speaks is `resolveSaidQuote`; which options exist
 * is `availableOptions`; what the gate is remains `canCommit` in `App.tsx`. This file
 * decides only what the beat looks like.
 *
 * `thread` is deliberately not built. One surface done properly plus a light variant of it
 * beats three half-built ones, so a mission asking for `thread` renders as a call and says
 * so in this comment rather than in a half-drawn screen.
 */

import { useEffect, useState } from "react";

import { availableOptions, resolveSaidQuote } from "../engine/engine";
import type { ChoiceMission, DimensionId, GameState, Mission, Option } from "../engine/types";
import { Icon, Pill, SectionTitle } from "./icons";
import {
  BEAT_TITLE_ID,
  Monogram,
  PREDICTION_QUESTION_ID,
  PredictionChips,
  RadioGroup,
  UI_LABEL,
  artUrl,
  quoted,
  radioTabIndex,
  useReducedMotion,
} from "./shell";

/**
 * Can this mission actually be staged as a conversation?
 *
 * `presentation: "dialogue"` is the author's request and this is the renderer's answer.
 * A conversation needs a set of things you could SAY, which is `Option.say` — and only a
 * `choice` mission has options at all. An investigation is a budget spent across five
 * questions and a build is a proposal assembled from components; both are genuinely
 * comparisons, and columns that line up are the right tool for a comparison. Asked to
 * stage one as a call, the honest answer is to render the console rather than to invent a
 * conversation with no replies in it.
 */
export function isDialogue(mission: Mission): mission is ChoiceMission {
  return mission.presentation === "dialogue" && mission.kind === "choice";
}

/* ───────────────────────── who is talking ─────────────────────────
   Resolved entirely from content that already exists: the client voice the engine
   selects for this state, and the colleague's line for this mission. Restaging a beat
   therefore costs one word in the mission plus a `say` line per option, and never a new
   paragraph of prose.                                                                */

interface Turn {
  speaker: string;
  role: string;
  text: string;
  /** filename in public/art/, for the four colleagues who have a portrait */
  photo?: string;
  /**
   * Said by somebody who is not in the room.
   *
   * On an `internal` beat the client's line still exists and still matters, so it is
   * relayed rather than dropped — a colleague repeating what the sponsor asked for. It is
   * marked because two things must follow from it: the line is labelled as relayed, and
   * the person is NOT given a tile, because they are not on the call.
   */
  outside?: boolean;
}

/**
 * The turns of the conversation, oldest first — and whose room it is.
 *
 * The live turn is the LAST one, because that is the person the replies answer, and
 * everything else on screen follows from it: the active-speaker ring, the caption
 * attribution, the typed line.
 *
 * `room` decides who that is. In a client room the colleague sets the scene and the client
 * speaks last; in an internal room your colleague is in front of you and the client's line
 * arrives relayed from outside. It is authored rather than inferred on the one beat where
 * the inference is wrong — see `Room` in `engine/types.ts` for m10, where every reply
 * refers to the client in the third person.
 *
 * The fallback chain is `advisorLine ?? advisor.quote`, and both halves are load-bearing:
 * three of the ten conversation beats have no `advisorLine`, and `m9` opens on the
 * standing quote alone.
 */
function conversation(mission: Mission, state: GameState): Turn[] {
  const said = resolveSaidQuote(mission, state);
  const advisor = mission.advisor;
  const line = mission.advisorLine ?? advisor?.quote;

  const client: Turn | null = said
    ? { speaker: said.speaker, role: said.role, text: said.text }
    : null;
  const colleague: Turn | null =
    advisor && line
      ? { speaker: advisor.name, role: advisor.role, text: line, photo: advisor.photo }
      : null;

  const room = mission.room ?? (client ? "client" : "internal");

  if (room === "internal") {
    /* No colleague to be in the room with is content the validator rejects, but if it
       ever happened the client would be the only voice — and a voice you are answering is
       in the room by definition, relayed or not. */
    if (!colleague) return client ? [client] : [];
    return client ? [{ ...client, outside: true }, colleague] : [colleague];
  }
  return [...(colleague ? [colleague] : []), ...(client ? [client] : [])];
}

interface Person {
  name: string;
  role?: string;
  photo?: string;
  /** the player's own tile. Always last, as it is in every conferencing product. */
  self?: boolean;
}

/** Who has a tile. Relayed voices do not: they are quoted, not present. */
function participants(turns: Turn[]): Person[] {
  const out: Person[] = [];
  for (const t of turns) {
    if (t.outside) continue;
    if (!out.some((p) => p.name === t.speaker)) {
      out.push({ name: t.speaker, role: t.role, photo: t.photo });
    }
  }
  out.push({ name: UI_LABEL.you, self: true });
  return out;
}

/* ───────────────────────── the typed line ───────────────────────── */

/** ~36 characters a second, which is the middle of the visual-novel convention. */
const MS_PER_CHAR = 28;

/**
 * Text arriving as it is spoken, and the two ways it must be able to not do that.
 *
 * `complete` is passed true the moment the replies open: once the player is choosing what
 * to say, they have heard the line, and a caption still crawling underneath the composer
 * is the interface arguing with them.
 *
 * Under `prefers-reduced-motion` the whole string is there from the first frame —
 * replacement, not removal, which is what WCAG 2.3.3's intent and Apple's own guidance
 * both ask for. Nothing is lost, because the animation was never carrying meaning.
 */
function useTypedText(text: string, complete: boolean): { shown: string; done: boolean; skip: () => void } {
  const reduced = useReducedMotion();
  const instant = reduced || complete;
  const [count, setCount] = useState(() => (instant ? text.length : 0));

  useEffect(() => {
    if (instant) setCount(text.length);
    else setCount(0);
  }, [text, instant]);

  useEffect(() => {
    if (instant || count >= text.length) return;
    const t = window.setTimeout(() => setCount((c) => c + 1), MS_PER_CHAR);
    return () => window.clearTimeout(t);
  }, [count, instant, text.length]);

  return {
    shown: text.slice(0, count),
    done: count >= text.length,
    skip: () => setCount(text.length),
  };
}

/**
 * The line, in a box that does not change size while it is typed.
 *
 * Three copies of the same string, and each one is load-bearing:
 *
 *  · `sr-only` — the WHOLE line, in the accessibility tree from the first frame. A screen
 *    reader must never be made to wait for an animation, and reading a string that grows
 *    one character at a time would be unusable even if it did.
 *  · `invisible` — the whole line again, taking up its space. `visibility: hidden` keeps
 *    the layout and is not exposed to assistive technology, so this is a ruler. Without
 *    it the caption would grow line by line as it typed, and since the tile wall above is
 *    the flexible region, every tile on screen would resize twice mid-sentence.
 *  · the absolutely-positioned run — what the eye reads. `aria-hidden`, because the first
 *    copy has already said it.
 */
function TypedLine({
  text,
  shown,
  done,
  className,
}: {
  text: string;
  shown: string;
  done: boolean;
  className: string;
}) {
  return (
    <p className={`relative ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="invisible">
        {text}
      </span>
      <span aria-hidden="true" className="absolute inset-0">
        {shown}
        {!done && (
          /* A static caret, not a blinking one. It marks where the line has got to
             without adding a keyframe that would have to be collapsed again. */
          <span
            className="ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[1px] rounded-[1px]"
            style={{ background: "var(--color-accent)" }}
          />
        )}
      </span>
    </p>
  );
}

/* ───────────────────────── the call ───────────────────────── */

/**
 * One tile, and the reason it is an avatar rather than a video frame.
 *
 * The four colleague portraits are 160×160 files. Filling a 400px tile with one is a
 * ×2.5 upscale, and upscaled stock photography is the measured cause of "it looks like a
 * PowerPoint" in this project — 21 crops at ×1.43 were removed from the option cards for
 * exactly that reason. So no tile ever stretches a photograph: the portrait sits in a
 * circle at or below its native size, which is sharp, and is also what a call looks like
 * when nobody's camera is on. The people with no portrait at all get the monogram and a
 * chip that says why.
 *
 * The active-speaker ring is the most important state on this screen, because it tells
 * the player who is talking without reading anything. It is a ring AND a chip AND the
 * attribution on the caption below, so it never rests on colour alone (E6).
 */
function CallTile({ person, speaking, floor }: { person: Person; speaking: boolean; floor: boolean }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[14px] border"
      style={{
        aspectRatio: "16 / 10",
        maxHeight: "100%",
        borderColor: speaking ? "var(--color-accent)" : "var(--color-line)",
        background: person.self ? "var(--color-canvas-deep)" : "var(--color-panel)",
        boxShadow: speaking ? "0 0 0 2px var(--color-accent)" : undefined,
      }}
    >
      <div className="flex h-full w-full items-center justify-center">
        {person.photo ? (
          <img
            src={artUrl(person.photo)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-[104px] w-[104px] rounded-full object-cover"
            style={{ objectPosition: "50% 28%" }}
          />
        ) : (
          <Monogram name={person.name} size={104} />
        )}
      </div>

      {!person.photo && (
        <span className="absolute left-2.5 top-2.5">
          <Pill tone="neutral">
            <Icon name="block" size={12} />
            {UI_LABEL.cameraOff}
          </Pill>
        </span>
      )}

      {/* The name plate. Dark bar rather than a light one: it is the same treatment
          whether the circle behind it is a photograph or a monogram, and white on ink at
          72% measures better than 6:1 over either. */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-2.5 py-1.5"
        style={{ background: "color-mix(in srgb, var(--color-ink) 72%, transparent)" }}
      >
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-bold leading-tight text-white">
            {person.name}
          </span>
          {person.role && (
            <span className="block truncate text-[12px] leading-tight text-white">
              {person.role}
            </span>
          )}
        </span>
        {speaking && (
          <span className="chip shrink-0" style={{ background: "var(--color-accent)", color: "#fff" }}>
            <Icon name="talk" size={12} />
            {floor ? UI_LABEL.yourTurn : UI_LABEL.speaking}
          </span>
        )}
      </div>
    </div>
  );
}

function TileWall({
  people,
  speakerName,
}: {
  people: Person[];
  /** whoever currently holds the floor — the live speaker, or the player once it is theirs */
  speakerName: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 items-stretch gap-3 px-5 py-3">
      {people.map((p) => (
        <div key={p.name} className="flex min-w-0 flex-1 items-center justify-center">
          <CallTile person={p} speaking={p.name === speakerName} floor={Boolean(p.self)} />
        </div>
      ))}
    </div>
  );
}

/**
 * Live captions — what a call actually shows, and where the spoken line goes.
 *
 * Two turns at most: the colleague's read of the situation, clamped to two lines because
 * it is context, and the live line underneath it in full. Clicking anywhere in the strip
 * finishes the line; the button beside the attribution is the same action for anyone not
 * using a pointer, which is what keeps 2.1.1 honest.
 */
function Captions({
  previous,
  live,
  typed,
}: {
  previous?: Turn;
  live: Turn;
  typed: { shown: string; done: boolean; skip: () => void };
}) {
  return (
    <div
      onClick={typed.done ? undefined : typed.skip}
      className="shrink-0 border-t border-(--color-line) bg-(--color-surface) px-5 py-3"
    >
      {previous && (
        <p className="line-clamp-2 text-[13px] leading-snug text-(--color-muted)">
          {/* Relayed, so it is labelled and the speaker has no tile: on an internal beat
              the sponsor's line is a colleague repeating what she asked for, and putting
              her on the call would have the player discussing her in front of her. */}
          {previous.outside && (
            <span className="mr-1.5 align-[1px]">
              <Pill tone="neutral">
                <Icon name="megaphone" size={12} />
                {UI_LABEL.relayed}
              </Pill>
            </span>
          )}
          <span className="font-bold text-(--color-ink-soft)">{previous.speaker}: </span>
          {quoted(previous.text)}
        </p>
      )}
      <div className={`flex items-baseline gap-2.5 ${previous ? "mt-2" : ""}`}>
        <span className="text-[13px] font-bold text-(--color-ink)">{live.speaker}</span>
        <span className="min-w-0 flex-1 truncate text-[12px] text-(--color-muted)">{live.role}</span>
        {!typed.done && (
          <button
            onClick={typed.skip}
            className="shrink-0 rounded-lg px-1.5 py-0.5 text-[12px] font-bold text-(--color-accent)"
          >
            {UI_LABEL.showWholeLine}
          </button>
        )}
      </div>
      <TypedLine
        text={quoted(live.text)}
        shown={typed.shown}
        done={typed.done}
        className="mt-1 max-w-[76ch] text-[15px] leading-[1.5] text-(--color-ink-soft)"
      />
    </div>
  );
}

/* ───────────────────────── the chat ───────────────────────── */

/**
 * The same conversation as a thread, for the short internal beats.
 *
 * Same frame, same composer, same states — a different register, not a second design.
 * Your own selected reply lands here as a bubble that says it has not been sent, which is
 * the truth: the reply is chosen and the decision is not yet committed.
 */
function ChatThread({
  turns,
  typed,
  draft,
}: {
  turns: Turn[];
  typed: { shown: string; done: boolean; skip: () => void };
  draft?: string;
}) {
  const last = turns.length - 1;
  return (
    <div
      onClick={typed.done ? undefined : typed.skip}
      className="flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-y-auto px-5 py-4"
    >
      {turns.map((t, i) => (
        <div key={`${t.speaker}-${i}`} className="flex items-start gap-2.5">
          {t.photo ? (
            <img
              src={artUrl(t.photo)}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-[32px] w-[32px] shrink-0 rounded-full object-cover"
              style={{ objectPosition: "50% 28%" }}
            />
          ) : (
            <Monogram name={t.speaker} size={32} />
          )}
          <div className="min-w-0">
            <p className="flex items-baseline gap-2">
              <span className="text-[13px] font-bold text-(--color-ink)">{t.speaker}</span>
              <span className="truncate text-[12px] text-(--color-muted)">{t.role}</span>
              {/* Forwarded into the thread rather than written in it. */}
              {t.outside && (
                <Pill tone="neutral">
                  <Icon name="megaphone" size={12} />
                  {UI_LABEL.relayed}
                </Pill>
              )}
            </p>
            <div
              className="mt-1 max-w-[70ch] rounded-[12px] rounded-tl-[4px] border px-3.5 py-2.5"
              style={{
                borderColor: "var(--color-line)",
                /* A relayed message sits on the panel tint — the same device the rails use
                   to mean "supporting information", so the thread reads in two levels. */
                background: t.outside ? "var(--color-panel)" : "var(--color-surface)",
              }}
            >
              {i === last ? (
                <TypedLine
                  text={t.text}
                  shown={typed.shown}
                  done={typed.done}
                  className="text-[15px] leading-[1.5] text-(--color-ink-soft)"
                />
              ) : (
                <p className="text-[15px] leading-[1.5] text-(--color-ink-soft)">{t.text}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {draft && (
        <div className="m-swap flex items-start justify-end gap-2.5">
          <div className="min-w-0">
            <p className="flex items-baseline justify-end gap-2">
              <span className="text-[13px] font-bold text-(--color-ink)">{UI_LABEL.you}</span>
              <span className="text-[12px] font-medium text-(--color-accent-deep)">
                {UI_LABEL.draft}
              </span>
            </p>
            <div
              className="mt-1 max-w-[70ch] rounded-[12px] rounded-tr-[4px] border px-3.5 py-2.5"
              style={{
                borderColor: "var(--color-accent-ring)",
                background: "var(--color-accent-tint)",
              }}
            >
              <p className="text-[15px] leading-[1.5] text-(--color-ink)">{quoted(draft)}</p>
            </div>
          </div>
          <Monogram name={UI_LABEL.you} size={32} />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── the composer ───────────────────────── */

/**
 * The gate, vertical.
 *
 * It renders inside the reply list, indented under the reply it is asking about, and it
 * carries `PREDICTION_QUESTION_ID` — which is what the action bar's `aria-describedby`
 * points at, so the button says what it is waiting for rather than repeating it.
 */
function PredictionGate({
  prediction,
  onPredict,
}: {
  prediction: DimensionId | null;
  onPredict: (d: DimensionId) => void;
}) {
  return (
    <div
      className="m-swap ml-9 mt-2 rounded-[12px] border px-3.5 py-2.5"
      style={{ borderColor: "var(--color-accent-ring)", background: "var(--color-accent-tint)" }}
    >
      <p id={PREDICTION_QUESTION_ID} className="text-[13px] font-bold text-(--color-ink)">
        {UI_LABEL.predictQuestion}
      </p>
      <div className="mt-2">
        <PredictionChips prediction={prediction} onPredict={onPredict} size="block" />
      </div>
    </div>
  );
}

/**
 * Your reply, as a list of things you could say.
 *
 * Stacked full-width rows in the first person and in quotes — not columns and not cards.
 * The console's side-by-side columns exist so four options' checklists line up and can be
 * compared across in one eye movement; speech is not compared that way. What is on a row
 * is the sentence, and nothing else: no facsimile, no pros and cons grid, no cost dots.
 * The trade-offs are still authored and still true, and `commits` is still in the right
 * rail under "If you commit" — this beat asks the player to answer a person, which is a
 * different act from auditing four proposals.
 *
 * Radio semantics, exactly as the option row has them: one tab stop for the set, arrows
 * between members, selection following focus. The wrapper `<div>` around each row is
 * presentational — `role="radio"` stays on the button, which is what `RadioGroup`'s key
 * handler looks for and what `tools/verify.mjs` clicks.
 */
function Composer({
  mission,
  options,
  chosen,
  prediction,
  onToggle,
  onPredict,
}: {
  mission: ChoiceMission;
  options: Option[];
  chosen?: string;
  prediction: DimensionId | null;
  onToggle: (id: string) => void;
  onPredict: (d: DimensionId) => void;
}) {
  const anySelected = options.some((o) => o.id === chosen);

  return (
    <div className="m-swap">
      <SectionTitle icon="talk">{mission.question}</SectionTitle>
      <RadioGroup label={mission.question} className="m-deal mt-2 space-y-2">
        {options.map((o, i) => {
          const selected = chosen === o.id;
          return (
            <div key={o.id}>
              <button
                className="choice flex items-start gap-3 px-4 py-2.5"
                data-selected={selected}
                onClick={() => onToggle(o.id)}
                role="radio"
                aria-checked={selected}
                tabIndex={radioTabIndex(selected, i, anySelected)}
              >
                <span
                  aria-hidden="true"
                  className="mt-[3px] shrink-0"
                  style={{ color: selected ? "var(--color-accent-deep)" : "var(--color-accent)" }}
                >
                  <Icon name={o.icon ?? "talk"} size={16} />
                </span>
                <span
                  className="min-w-0 flex-1 text-[15px] leading-[1.45]"
                  style={{ color: selected ? "var(--color-accent-deep)" : "var(--color-ink)" }}
                >
                  {quoted(o.say ?? o.title)}
                </span>
                {/* `aria-hidden`: the row is a radio and `aria-checked` has already said
                    this, so a second announcement would be the same fact twice. */}
                {selected && (
                  <span aria-hidden="true" className="mt-[3px] shrink-0 text-(--color-text-strong)">
                    <Icon name="check" size={16} />
                  </span>
                )}
              </button>
              {selected && <PredictionGate prediction={prediction} onPredict={onPredict} />}
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}

/**
 * The beat before the replies open, in the slot the composer will occupy.
 *
 * The colleague's open questions, which on a console brief live in the panel under their
 * quote. They are the one thing a conversation surface would otherwise delete, and they
 * are required furniture (E8) as well as the rule that the interface never tells the
 * player what to think (G9b) — so they are attributed, and they are questions.
 *
 * Putting them here is also what makes the click mean something: the same region stops
 * being what to weigh and becomes what to say.
 */
function OpenQuestions({ from, questions }: { from: string; questions: string[] }) {
  return (
    <div className="m-swap">
      <SectionTitle icon="bulb">
        {UI_LABEL.openQuestionsFrom} {from}
      </SectionTitle>
      <ul className="mt-2 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
        {questions.map((q) => (
          <li key={q} className="flex gap-2 text-[13px] leading-snug text-(--color-ink-soft)">
            <span aria-hidden="true" className="shrink-0 font-bold text-(--color-accent)">
              +
            </span>
            {q}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────── the scene ───────────────────────── */

/**
 * One component for both beats of the mission, and that is the point.
 *
 * `brief` and `decide` are two phases in the engine and one screen here: the call does not
 * end and restart when the player is ready to answer. It is the same window, the same
 * participants and the same caption — the floor passes to the player, and the region that
 * held the colleague's questions becomes the composer. Nothing on screen is replaced,
 * which is why it reads as a conversation continuing rather than as a page turning.
 */
export function DialogueScene({
  mission,
  state,
  phase,
  onToggle,
  onPredict,
}: {
  mission: ChoiceMission;
  state: GameState;
  /** `listen` is the brief beat, `reply` is the decide beat */
  phase: "listen" | "reply";
  onToggle: (id: string) => void;
  onPredict: (d: DimensionId) => void;
}) {
  const turns = conversation(mission, state);
  const live = turns[turns.length - 1];
  const previous = turns.length > 1 ? turns[turns.length - 2] : undefined;
  const people = participants(turns);
  const options = availableOptions(mission, state);
  const chosen = state.selection[0];
  const reply = phase === "reply";

  /* Completed the moment the replies open: by then the line has been heard, and a caption
     still crawling under the composer would be the interface arguing with the player. */
  const typed = useTypedText(live?.text ?? "", reply);

  /* The floor. On the brief beat it is whoever is speaking; from the moment the replies
     are on screen it is the player's, and the ring moving across the wall is the screen
     saying so without a word. */
  const speakerName = reply ? UI_LABEL.you : (live?.speaker ?? "");
  const chat = mission.surface === "chat";
  const draft = options.find((o) => o.id === chosen);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* The window's own header: what this is, what it is called, who is on it. Thin on
          purpose — every pixel here comes off the tile wall, which is the only region
          with any give in it. */}
      <header className="flex shrink-0 items-center gap-3 border-b border-(--color-line) bg-(--color-surface) px-5 py-2.5">
        {chat ? (
          <Pill tone="accent">
            <Icon name="talk" size={12} />
            {UI_LABEL.teamChat}
          </Pill>
        ) : (
          <Pill tone="accent">
            <span
              aria-hidden="true"
              className="h-[6px] w-[6px] rounded-full"
              style={{ background: "var(--color-accent)" }}
            />
            {UI_LABEL.live}
          </Pill>
        )}
        <h1
          id={BEAT_TITLE_ID}
          className="min-w-0 flex-1 truncate text-[18px] font-bold leading-tight tracking-[-0.01em] text-(--color-ink)"
        >
          {mission.title}
        </h1>
        <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-(--color-muted)">
          <Icon name="people" size={14} />
          {people.length} {chat ? UI_LABEL.inChat : UI_LABEL.onCall}
        </span>
      </header>

      {/* The conversation. Everything above the composer, and the only flexible region on
          the screen — so a five-option composer takes its space from here rather than
          from the bottom of the console. */}
      {chat ? (
        <ChatThread turns={turns} typed={typed} draft={reply ? draft?.say ?? draft?.title : undefined} />
      ) : (
        <>
          <TileWall people={people} speakerName={speakerName} />
          {live && <Captions previous={previous} live={live} typed={typed} />}
        </>
      )}

      {/* Station 4 — what you say. Bordered and flush against the region above it, not a
          detached card with a gap: that is the mockups' own construction. */}
      <div className="shrink-0 border-t border-(--color-line) bg-(--color-surface) px-5 py-3">
        {reply ? (
          <Composer
            mission={mission}
            options={options}
            chosen={chosen}
            prediction={state.prediction}
            onToggle={onToggle}
            onPredict={onPredict}
          />
        ) : mission.advisor && mission.consider && mission.consider.length > 0 ? (
          <OpenQuestions from={mission.advisor.name} questions={mission.consider} />
        ) : null}
      </div>
    </div>
  );
}
