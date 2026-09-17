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

import { useEffect, useRef, useState } from "react";

import { availableOptions, resolveSaidQuote, resolveSituation } from "../engine/engine";
import type { ChoiceMission, DimensionId, GameState, Mission, Option } from "../engine/types";
import { Bullet, Icon, PersonGlyph, Pill, SectionTitle } from "./icons";
import { StakeMark } from "./mission";
import {
  BEAT_TITLE_ID,
  Disc,
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

/**
 * On a chat surface the situation IS the thread's history.
 *
 * The first version put `situation` behind the console's one-line disclosure on both
 * surfaces. That is right on a call — a transcript can only contain what was said — and
 * wrong in a thread: a channel whose entire history is one line, with the actual context
 * hidden behind a "show" link, is a thread pretending to have no history. It also left
 * 270px of empty floor, which is the symptom that found the mistake.
 *
 * The split is the same in all five chat beats, because the prose has one shape: the
 * FIRST paragraph is the narrator setting the scene — "Before signature it goes to
 * internal quality and risk review", "Everything is agreed. Nothing is signed." — and on
 * month five it says "the delivery lead wants thirty minutes" while the delivery lead is
 * the person talking. So the first paragraph becomes the thread's subject, unattributed,
 * and everything after it becomes messages from whoever is speaking. Nothing is rewritten
 * and nothing is invented; the same strings land in a different place.
 *
 * Capped at three, oldest first. No authored beat has more than one message's worth
 * today, but a five-paragraph variant would otherwise bury the line the replies answer.
 */
const HISTORY_LIMIT = 3;

function history(situation: string[], speaker: Turn | undefined): { topic?: string; earlier: Turn[] } {
  if (!speaker || situation.length === 0) return { topic: situation[0], earlier: [] };
  /* One paragraph is the speaker's own message and the thread has no separate subject:
     m3's single line — "Orion is open to talking to partners. You get roughly one shot" —
     is a colleague talking, not a narrator. */
  if (situation.length === 1) return { earlier: [{ ...speaker, text: situation[0] as string }] };
  return {
    topic: situation[0],
    earlier: situation
      .slice(1, 1 + HISTORY_LIMIT)
      .map((text) => ({ ...speaker, text })),
  };
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

/**
 * The skip, as a control rather than as a click anywhere.
 *
 * The surfaces both let a pointer click the transcript to finish the line, and a pointer
 * is not everybody: 2.1.1 wants the same action from the keyboard, which means a real
 * button with a real name. One component so the two surfaces cannot drift into having
 * one each.
 */
function SkipTyping({ onSkip }: { onSkip: () => void }) {
  return (
    <button
      onClick={onSkip}
      className="shrink-0 rounded-lg px-1.5 py-0.5 text-[12px] font-bold text-(--color-accent)"
    >
      {UI_LABEL.showWholeLine}
    </button>
  );
}

/**
 * What this conversation is about — the one thing a conversation surface would otherwise
 * delete.
 *
 * `situation` is the largest thing on a console brief and there is no room for it beside a
 * transcript, so it takes the device the console's own decide beat already uses: one line,
 * with the rest behind a disclosure that costs no layout when closed
 * (`Continuity` in `ui/mission.tsx`, backlog 4.1). `concerns` comes with it, because four
 * of the ten conversation beats have them.
 *
 * Open on the listening beat and closed once the replies are up, which is both the right
 * default — reading first, answering second — and what hands the composer its height.
 * `key` on the phase so the change of default actually takes effect; the `open` prop is
 * not re-applied between renders, so a player who closes or opens it is left alone.
 */
function Subject({
  mission,
  state,
  phase,
}: {
  mission: Mission;
  state: GameState;
  phase: "listen" | "reply";
}) {
  const situation = resolveSituation(mission, state);
  const lead = mission.prompt ?? situation[0];
  const rest = mission.prompt ? situation : situation.slice(1);
  const concerns = mission.concerns ?? [];
  if (!lead) return null;

  return (
    <details
      key={phase}
      open={phase === "listen"}
      className="shrink-0 border-b border-(--color-line) bg-(--color-surface) px-5 py-2"
    >
      <summary className="flex min-h-[24px] cursor-pointer list-none items-baseline gap-1.5 text-[13px] text-(--color-muted)">
        <span className="line-clamp-1">
          {lead} <span className="font-medium text-(--color-accent)">{UI_LABEL.showBrief}</span>
        </span>
      </summary>
      <div className="mt-1.5 space-y-1">
        {rest.map((p, i) => (
          <p key={i} className="max-w-[92ch] text-[13px] leading-[1.5] text-(--color-ink-soft)">
            {p}
          </p>
        ))}
        {concerns.length > 0 && (
          <ul className="flex flex-wrap gap-x-6 gap-y-1 pt-0.5">
            {concerns.map((c) => (
              <li
                key={c}
                className="flex gap-2 text-[13px] leading-snug text-(--color-ink-soft)"
              >
                <Bullet className="mt-[7px] text-(--color-bad)" />
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
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
        ) : person.self ? (
          /* The player has no name, so there are no initials to draw. A monogram built
             from the word "You" is the letter Y in a circle, which reads as a placeholder
             somebody forgot to finish. */
          <Disc size={104}>
            <PersonGlyph size={44} />
          </Disc>
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
        {!typed.done && <SkipTyping onSkip={typed.skip} />}
      </div>
      {/* NOT `quoted()` here, and the bug that taught me why is worth naming: the typed
          run is a slice of the raw string, so quoting only the ruler copy made the two
          disagree — the opening mark was in the layout and never in the text. A caption
          is attributed by the name above it anyway, which is what quotation marks are for
          in the pull-quote and are not needed for here. */}
      <TypedLine
        text={live.text}
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
  topic,
  concerns,
  typed,
  draft,
}: {
  turns: Turn[];
  /**
   * The thread's subject — the scene-setting first line of `situation`, unattributed.
   *
   * It is the one paragraph that cannot be anybody's message: every conversation beat's
   * opening line is written in the narrator's voice, and on month five it says "the
   * delivery lead wants thirty minutes" while the delivery lead is the person talking.
   * Everything after it is hers, and arrives as `turns`. See `history()`.
   */
  topic?: string;
  /** what is worrying them, which the call surface shows in its subject strip */
  concerns?: string[];
  typed: { shown: string; done: boolean; skip: () => void };
  draft?: string;
}) {
  const last = turns.length - 1;
  const box = useRef<HTMLDivElement>(null);

  /**
   * Stay with the newest message.
   *
   * Top-anchoring is right until the thread is taller than its region — which happens on
   * month five, where five replies leave the thread about 180px and the draft bubble was
   * simply clipped off the bottom edge. A message list that does not follow its own
   * newest message is broken in the one way every player will recognise, so it scrolls,
   * on the same two things that change its height: the line being typed and the draft
   * arriving.
   */
  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [draft, typed.shown]);

  return (
    /**
     * The thread takes every spare pixel, and its messages sit at the BOTTOM of it.
     *
     * Three attempts, and the first two were the same mistake from opposite ends. Sizing
     * the thread to its content left the slack below the replies — ~190px on m9 and 420px
     * on m3 — which reads as a screen somebody did not finish, and it moved the composer
     * up and down between beats. Stretching the thread and top-aligning the messages put
     * the same hole between the last message and the composer.
     *
     * No client lays out either way. The thread owns the height, the messages hug the
     * composer, and the slack collects ABOVE the first message — where it reads as the
     * start of a conversation rather than as something missing. The composer is then
     * pinned to the bottom of the work area on all five chat beats, whatever the thread
     * does.
     *
     * The slack is a real SPACER element rather than `justify-end` or `mt-auto`, and that
     * is deliberate: content-distribution and auto margins in a scroll container put the
     * overflow past the *start* edge, which is historically unreachable — so on month
     * five, the one beat whose thread does overflow, the relayed message would have been
     * unscrollable. A `grow basis-0` child takes the slack when there is any and collapses
     * to nothing when there is not, and the scroll stays ordinary.
     */
    <div
      ref={box}
      onClick={typed.done ? undefined : typed.skip}
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4"
    >
      <div aria-hidden="true" className="grow basis-0" />
      {/* The thread's subject line. A hairline under it rather than a bubble around it,
          because it is the channel's topic and not something anybody said. */}
      {topic && (
        <div className="border-b border-(--color-line) pb-3">
          <p className="max-w-[92ch] text-[13px] leading-[1.5] text-(--color-muted)">{topic}</p>
          {concerns && concerns.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
              {concerns.map((c) => (
                <li key={c} className="flex gap-2 text-[13px] leading-snug text-(--color-ink-soft)">
                  <Bullet className="mt-[7px] text-(--color-bad)" />
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {turns.map((t, i) => {
        /* Consecutive messages from one person group under one avatar, as they do in
           every client — and here it is also 22px of height per message given back to a
           thread that has to fit above a five-reply composer. */
        const before = turns[i - 1];
        const grouped =
          i > 0 && before?.speaker === t.speaker && Boolean(before?.outside) === Boolean(t.outside);
        return (
        <div key={`${t.speaker}-${i}`} className={`flex items-start gap-2.5 ${grouped ? "-mt-2" : ""}`}>
          {grouped ? (
            <span aria-hidden="true" className="w-[32px] shrink-0" />
          ) : t.photo ? (
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
            <p className={`flex items-baseline gap-2 ${grouped ? "sr-only" : ""}`}>
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
            {/* The bubble is a TINT, not white with a border. On white with a hairline and
                a caret at the end of the line it read as a text input the player was
                expected to type into — on the one screen whose whole subject is that
                somebody else is talking. */}
            <div
              className="mt-1 max-w-[70ch] rounded-[12px] rounded-tl-[4px] px-3.5 py-2.5"
              style={{
                /* A relayed message sits a step further back again, with a hairline, so
                   the thread reads in two levels: in the room, and passed into it. */
                background: t.outside ? "var(--color-surface)" : "var(--color-panel)",
                border: t.outside ? "1px solid var(--color-line)" : undefined,
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
            {/* The skip sits under the message being typed, not in the name row — the
                name row is `sr-only` on a grouped message, which is exactly the message
                that is usually the one still arriving. */}
            {i === last && !typed.done && (
              <span className="mt-1 flex">
                <SkipTyping onSkip={typed.skip} />
              </span>
            )}
          </div>
        </div>
        );
      })}

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
          <Disc size={32}>
            <PersonGlyph size={17} />
          </Disc>
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
 *
 * It is also the LOUDEST thing on the screen after the replies themselves, and that is a
 * requirement rather than a preference (`SCREEN-SPECS.md` §3): the gate is the only thing
 * in the game that marks a change of state, so on the surface where it lives in the work
 * area it is drawn as a 2px-rimmed object with the question at the body step, not as a
 * caption. It was 13px inside a 1px hairline, and the reported bug — "cannot get past
 * Commit to this" — was somebody not seeing it.
 */
function PredictionGate({
  prediction,
  onPredict,
  nudge,
}: {
  prediction: DimensionId | null;
  onPredict: (d: DimensionId) => void;
  /**
   * How many times the player has pressed a commit button that was not ready.
   *
   * Pressing it must answer, and on this surface the answer cannot be in the action bar
   * because the requirement is not there — it is here, under the reply. Re-keying on the
   * count restarts the entrance, so the gate lands again where the player is looking.
   * The same mechanism as `ActionBar`'s own panel, driven by the same counter in
   * `App.tsx`.
   */
  nudge: number;
}) {
  return (
    <div
      key={nudge}
      className={`ml-9 mt-2 rounded-[12px] border-2 px-4 py-2.5 ${nudge > 0 ? "m-land" : "m-swap"}`}
      style={{ borderColor: "var(--color-accent-ring)", background: "var(--color-accent-tint)" }}
    >
      <p id={PREDICTION_QUESTION_ID} className="text-[15px] font-bold text-(--color-ink)">
        {UI_LABEL.predictQuestion}
      </p>
      <div className="mt-2">
        <PredictionChips prediction={prediction} onPredict={onPredict} />
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
  nudge,
  onToggle,
  onPredict,
}: {
  mission: ChoiceMission;
  options: Option[];
  chosen?: string;
  prediction: DimensionId | null;
  nudge: number;
  onToggle: (id: string) => void;
  onPredict: (d: DimensionId) => void;
}) {
  const anySelected = options.some((o) => o.id === chosen);

  return (
    <div className="m-swap">
      {/* The stake element, in its one-row form. It is the constant declaration that this
          beat changes the game state — the gate below is the interactive half, and it only
          exists once a reply is chosen, so without this the listening beat and the
          answering beat were the same screen until the player clicked something. Same
          component as the console's question band uses; see `ui/mission.tsx`. */}
      <div className="flex items-center justify-between gap-4">
        <SectionTitle icon="talk">{mission.question}</SectionTitle>
        <StakeMark inline />
      </div>
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
              {selected && (
                <PredictionGate prediction={prediction} onPredict={onPredict} nudge={nudge} />
              )}
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
  nudge,
  onToggle,
  onPredict,
}: {
  mission: ChoiceMission;
  state: GameState;
  /** `listen` is the brief beat, `reply` is the decide beat */
  phase: "listen" | "reply";
  /** blocked presses of the primary action, so the gate can answer one */
  nudge: number;
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

  /* The thread's history, on the chat surface only — see `history()` for why a call does
     not get one: a transcript can only hold what was said, and scrollback we invented
     would be putting words in somebody's mouth. */
  const past = chat
    ? history(resolveSituation(mission, state), live)
    : { topic: undefined, earlier: [] as Turn[] };

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

      {/* Call only. On a chat beat this content is the thread itself. */}
      {!chat && <Subject mission={mission} state={state} phase={phase} />}

      {/* The conversation. Everything above the composer, and the only flexible region on
          the screen — so a four-option composer takes its space from here rather than
          from the bottom of the console. */}
      {chat ? (
        <ChatThread
          turns={[...past.earlier, ...turns]}
          topic={past.topic}
          concerns={mission.concerns}
          typed={typed}
          draft={reply ? draft?.say ?? draft?.title : undefined}
        />
      ) : (
        <>
          <TileWall people={people} speakerName={speakerName} />
          {live && <Captions previous={previous} live={live} typed={typed} />}
        </>
      )}

      {/* Station 4 — what you say. Bordered and flush against the region above it, not a
          detached card with a gap: that is the mockups' own construction. */}
      <div
        data-region="reply"
        className="shrink-0 border-t border-(--color-line) bg-(--color-surface) px-5 py-3"
      >
        {reply ? (
          <Composer
            mission={mission}
            options={options}
            chosen={chosen}
            prediction={state.prediction}
            nudge={nudge}
            onToggle={onToggle}
            onPredict={onPredict}
          />
        ) : mission.advisor && mission.consider && mission.consider.length > 0 ? (
          <OpenQuestions from={mission.advisor.name} questions={mission.consider} />
        ) : null}
      </div>

      {/* No spacer under the composer. There used to be one, for the surplus a
          content-sized thread left over; the thread claims it now. The call never needed
          one — its tile wall is the flexible region and is above the captions. */}
    </div>
  );
}
