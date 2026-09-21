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
import { SectionTitle } from "./icons";
import { UI_LABEL } from "./shell";

/**
 * One candidate, before the item is answered.
 *
 * There is no answered variant, and there was: the settled state used to keep these cards
 * with the answer and the player's pick marked on them. That cost 183px at the exact
 * moment the causal chains arrive underneath, which pushed the ending past the fold. Two
 * lines of prose say the same thing in a third of the height, so the cards exist only
 * while there is something to press.
 */
function Candidate({ text, onPick }: { text: string; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full items-start rounded-lg border border-(--color-line) px-3 py-1.5 text-left transition-colors hover:border-(--color-accent) hover:bg-(--color-surface-raised)"
    >
      <span className="min-w-0 text-[15px] leading-snug text-(--color-ink) text-pretty">
        {text}
      </span>
    </button>
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
  const answer = claim.candidates.find((c) => c.id === claim.answerId);
  const yours = claim.candidates.find((c) => c.id === picked);

  return (
    <section data-region="claim">
      <SectionTitle icon="bulb" className="mb-2">
        {UI_LABEL.claimAsking}
      </SectionTitle>

      {/**
       * ANSWERED, the band collapses to two lines of prose. Measured, and a correction of
       * my own reasoning.
       *
       * The first version kept the cards and merely dropped the ones nobody picked: 224px
       * down to 183px. That looked fit-neutral and was not, because the chains arrive
       * underneath at the same moment and they are ~140px — so answering grew the page by
       * 99px and pushed "What led to what" off the bottom. `verify.mjs` could not see it:
       * the harness never clicks the item, so the gate only ever measures the unanswered
       * state. It took driving the click by hand.
       *
       * Two lines instead of two cards is ~50px, so answering now SHRINKS the band by more
       * than the chains add. It is also the better reading — once the chains are on screen
       * they are the subject, and the item's answer is a footnote to them. The consequence
       * itself goes too, because `soLater` is the second half of the very chain now
       * printed below it.
       */}
      {settled ? (
        <div className="border-l-[3px] border-(--color-accent) pl-3">
          {/* The answer is NOT restated when the player got it, because the first chain
              printed directly below is that same sentence — "This is the one: X" sitting
              40px above "X → Y" reads as the page stuttering. When they picked something
              else, both are named, because the whole value of the item is the gap. */}
          {rightFirstTime ? (
            <p className="text-[15px] leading-snug text-(--color-ink) text-pretty">
              {UI_LABEL.claimSamePick}
            </p>
          ) : (
            <>
              <p className="text-[15px] leading-snug text-(--color-ink) text-pretty">
                <span className="font-bold">{UI_LABEL.claimAnswer}: </span>
                {answer?.text}
              </p>
              <p className="mt-1 text-[15px] leading-snug text-(--color-muted) text-pretty">
                <span className="font-bold">{UI_LABEL.claimYours}: </span>
                {yours?.text}
              </p>
            </>
          )}
          <p className="mt-1 text-[13px] leading-snug text-(--color-muted)">
            {UI_LABEL.claimRest}
          </p>
        </div>
      ) : (
        <>
          {/**
           * Stacked, not side by side — also measured. The first version put the
           * consequence beside the candidates, which halved the column: every candidate
           * wrapped to two lines and the band came out at 320px against a 226px budget,
           * pushing the ending 90px over target. Full width lets most candidates sit on
           * one line, and two across turns four rows into two.
           */}
          <div className="border-l-[3px] border-(--color-accent) pl-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.07em] text-(--color-muted)">
              {UI_LABEL.claimHappened}
            </p>
            <p className="mt-1 text-[15px] leading-snug text-(--color-ink) text-pretty">
              {claim.soLater}
            </p>
            <p className="mt-1.5 text-[15px] font-bold leading-snug text-(--color-ink)">
              {UI_LABEL.claimQuestion}{" "}
              {/* Said plainly and once. The screen looks like a test and is not one, and
                  a player who thinks they are being marked answers differently. */}
              <span className="font-normal text-(--color-muted)">{UI_LABEL.claimNoMark}</span>
            </p>
          </div>

          <ul
            className="mt-2 grid gap-1.5 sm:grid-cols-2"
            /* A list, and announced as the question's answers, so a screen reader reaching
               this band is told what it is being asked before it reads four sentences. */
            aria-label={UI_LABEL.claimQuestion}
          >
            {claim.candidates.map((c) => (
              <li key={c.id} className="grid">
                <Candidate text={c.text} onPick={() => pick(c.id)} />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* One live region, so the answer is spoken rather than merely rendered — the
          whole band changes in place and a screen-reader user would otherwise have to go
          looking for what moved. */}
      <p aria-live="polite" className="sr-only">
        {settled
          ? `${UI_LABEL.claimAnswer}: ${claim.candidates.find((c) => c.id === claim.answerId)?.text ?? ""}`
          : ""}
      </p>
    </section>
  );
}
