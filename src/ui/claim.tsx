/**
 * The debrief's one causal question — backlog 4.5.
 *
 * "Here is what happened in month five. Which of your earlier decisions led to it?"
 * Asked once, at the ending, in the place the causal chains are about to appear. The
 * player answers, the game confirms, and the chains unfold underneath.
 *
 * ── WHAT THIS SCREEN MUST NOT BECOME ──────────────────────────────────────────────────
 *
 * **There is no mark.** Not a tick, not a score, not a running total, not "1 of 1
 * correct", not a colour that means good. This game deleted its score because a
 * meter-greedy policy reached 100/100/100 without reading a word; the debrief refuses to
 * grade; `scorm.ts` refuses to send one to an LMS. A quiz at the ending is the fourth
 * door into that room and by far the most respectable-looking, because a quiz is what
 * e-learning does. `engine.ts` asserts the data carries no score. This file is the other
 * half of that promise, and it is the half that could reintroduce one with a colour.
 *
 * So: the answer is labelled **"This is the one"**, never "Correct"; the player's pick, if
 * it was a different one, is labelled **"Your answer"**, never "Wrong". Same type, same
 * weight, no red and no green — the accent marks the answer because the accent is what
 * this interface uses everywhere for *this is the thing*, and a good/bad colour pair here
 * would be a mark in all but name. The player can see which was which. Nobody says well
 * done.
 *
 * ── WHY IT SITS WHERE THE THREADS GO ──────────────────────────────────────────────────
 *
 * The threads band is the payoff of the whole design and reading it costs nothing, which
 * is also its weakness: a section that hands you every chain for free is read rather
 * than argued with. Asking first turns the same content into something a cohort can
 * disagree over — and disagreement is the only mechanism this game has for making a
 * player state their reasoning out loud.
 *
 * It replaces the band rather than adding one, so on a run that has the item the ending
 * is no taller than on a run that does not. That is a fit constraint, not a preference:
 * the ending is the tightest screen in the game.
 *
 * ── WHAT IT IS NOT ────────────────────────────────────────────────────────────────────
 *
 * No game rules. `causalClaim` in `engine.ts` chooses the item, picks the candidates and
 * fixes their order; this renders what it is given and reports which id was pressed.
 * It cannot be skipped by accident and it cannot be failed.
 */

import { useState } from "react";

import type { CausalClaim } from "../engine/engine";
import { Icon, SectionTitle } from "./icons";

/* TO JOIN `UI_LABEL`. Interface chrome, so it belongs in `src/ui/shell.tsx` with the rest
   — kept local only because that file was being consolidated by another worker as this
   landed, and merging into the middle of that is how a label goes missing.

   Two of these are load-bearing rather than cosmetic. The heading does NOT change when
   the item is answered, and neither result line borrows the word "led": the band
   immediately below is headed "What led to what" and carries the same kind of sentence,
   so two near-identical headings 40px apart read as one section repeating itself. */
const LABEL = {
  /** the section heading, in both states */
  asking: "One thing worth settling",
  /** frames the consequence being asked about */
  happened: "This happened in delivery",
  question: "Which of your decisions led to it?",
  /** the reassurance, said once and plainly, because the screen looks like a test */
  noMark: "Not marked. Nobody is scoring this one.",
  /** the two states an option can end in. Neither is a verdict on the player */
  whatHappened: "This is the one",
  whatYouChose: "Your answer",
  /** when the player got there — stated, never congratulated */
  samePick: "Which is the one you picked.",
  /** the bridge into the threads band */
  andTheRest: "The rest of the chains are below.",
} as const;

/**
 * One candidate.
 *
 * A `button` before the answer and a plain `div` after: once the item is settled there is
 * nothing left to press, and leaving four dead buttons in the tab order makes a keyboard
 * player hunt for an interaction that no longer exists.
 */
function Candidate({
  text,
  state,
  onPick,
}: {
  text: string;
  state: "open" | "answer" | "chosen-not-answer";
  onPick?: () => void;
}) {
  /* Deliberately NOT a good/bad colour pair. `answer` is the accent the whole interface
     uses for "this is the thing"; `chosen-not-answer` is a neutral outline. Green and red
     here would be a mark in everything but name. */
  const border =
    state === "answer"
      ? "var(--color-accent)"
      : state === "chosen-not-answer"
        ? "var(--color-ink-soft)"
        : "var(--color-line)";

  const body = (
    <>
      <span
        className="mt-[3px] shrink-0"
        style={{
          color: state === "answer" ? "var(--color-accent)" : "var(--color-muted)",
        }}
      >
        {state === "answer" ? (
          <Icon name="spark" size={15} />
        ) : state === "chosen-not-answer" ? (
          <Icon name="talk" size={15} />
        ) : (
          /* Holds the column before the answer, so the row does not shift left when a
             glyph appears. */
          <span className="block h-[15px] w-[15px]" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] leading-snug text-(--color-ink) text-pretty">
          {text}
        </span>
        {state === "answer" && (
          <span className="mt-0.5 block text-[12px] font-bold uppercase tracking-[0.06em] text-(--color-accent)">
            {LABEL.whatHappened}
          </span>
        )}
        {state === "chosen-not-answer" && (
          <span className="mt-0.5 block text-[12px] font-bold uppercase tracking-[0.06em] text-(--color-muted)">
            {LABEL.whatYouChose}
          </span>
        )}
      </span>
    </>
  );

  const shape = "flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left";

  if (state === "open") {
    return (
      <button
        type="button"
        onClick={onPick}
        className={`${shape} transition-colors hover:border-(--color-accent) hover:bg-(--color-surface-raised)`}
        style={{ borderColor: border }}
      >
        {body}
      </button>
    );
  }
  return (
    <div className={shape} style={{ borderColor: border }}>
      {body}
    </div>
  );
}

export function CausalClaimItem({
  claim,
  onAnswered,
}: {
  claim: CausalClaim;
  /** fired once, so the ending can reveal the threads band beneath */
  onAnswered?: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const settled = picked !== null;

  const pick = (id: string) => {
    if (settled) return;
    setPicked(id);
    onAnswered?.();
  };

  const rightFirstTime = picked === claim.answerId;

  /**
   * Once settled, the candidates the player did NOT pick are dropped.
   *
   * This is a fit decision and a teaching one, and they agree for once. The ending is the
   * tightest screen in the game and this band sits where the threads go — so if answering
   * added rows, a run WITH the item would be taller than a run without, and the budget
   * argument for putting it here collapses. It also happens to be the right reading:
   * the moment worth holding is "I thought that, it was actually this", and the two
   * options nobody chose are noise in it.
   */
  const shown = settled
    ? claim.candidates.filter((c) => c.id === claim.answerId || c.id === picked)
    : claim.candidates;

  return (
    <section data-region="claim" className="mt-6">
      <SectionTitle icon="bulb" className="mb-2">
        {LABEL.asking}
      </SectionTitle>

      <div className="grid gap-x-8 gap-y-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* the consequence, which really happened on this run */}
        <div className="border-l-[3px] border-(--color-accent) pl-3">
          <p className="text-[12px] font-bold uppercase tracking-[0.07em] text-(--color-muted)">
            {LABEL.happened}
          </p>
          <p className="mt-1 text-[15px] leading-snug text-(--color-ink) text-pretty">
            {claim.soLater}
          </p>
          {!settled && (
            <>
              <p className="mt-2 text-[15px] font-bold leading-snug text-(--color-ink)">
                {LABEL.question}
              </p>
              {/* Said plainly and once. The screen looks like a test and is not one, and a
                  player who thinks they are being marked answers differently. */}
              <p className="mt-1 text-[13px] text-(--color-muted)">{LABEL.noMark}</p>
            </>
          )}
          {settled && (
            <p className="mt-2 text-[13px] leading-snug text-(--color-muted) text-pretty">
              {rightFirstTime ? `${LABEL.samePick} ` : ""}
              {LABEL.andTheRest}
            </p>
          )}
        </div>

        {/* the candidates */}
        <ul
          className="grid gap-2"
          /* A list, and announced as the question's answers, so a screen reader reaching
             this band is told what it is being asked before it reads four sentences. */
          aria-label={LABEL.question}
        >
          {shown.map((c) => (
            <li key={c.id}>
              <Candidate
                text={c.text}
                state={
                  !settled ? "open" : c.id === claim.answerId ? "answer" : "chosen-not-answer"
                }
                onPick={() => pick(c.id)}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* One live region, so the answer is spoken rather than merely rendered — the
          whole band changes in place and a screen-reader user would otherwise have to go
          looking for what moved. */}
      <p aria-live="polite" className="sr-only">
        {settled
          ? `${LABEL.whatHappened}: ${claim.candidates.find((c) => c.id === claim.answerId)?.text ?? ""}`
          : ""}
      </p>
    </section>
  );
}
