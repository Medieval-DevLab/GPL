/** Title, chapter interludes, and the closing debrief. */

import { useState } from "react";

import { story } from "../content/story";
import { causalClaim, causalThreads, finalVerdict, ledger } from "../engine/engine";
import { codeFromState } from "../engine/runcode";
import {
  STAGES,
  isMission,
  type Advisor,
  type Chapter,
  type GameState,
  type IconId,
  type Interlude,
  type OutcomeTone,
  type Setup,
} from "../engine/types";
import { CausalClaimItem } from "./claim";
import { Facsimile } from "./facsimile";
import { Icon, Pill, SectionTitle } from "./icons";
import { CardButton } from "./mission";
import {
  BEAT_TITLE_ID,
  BadgeChip,
  Eyebrow,
  FactorGrid,
  Hidden,
  LedgerRow,
  PrimaryButton,
  RadioGroup,
  UI_LABEL,
  artUrl,
  quoted,
  radioTabIndex,
} from "./shell";

/* ─────────────────────────── title ─────────────────────────── */

export function TitleScreen({
  onBegin,
  hasSave,
  onResume,
  chapters,
  stale,
  onCode,
}: {
  onBegin: () => void;
  hasSave: boolean;
  onResume: () => void;
  chapters: Chapter[];
  /** a save this build can no longer read, and what can be recovered from it */
  stale?: { message: string; code: string | null; replayable: boolean } | null;
  /** returns an error message, or null when the code was accepted */
  onCode?: (code: string) => string | null;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-5 py-14">
      {/**
       * The title screen arrives as ONE gesture, and this is a reversal worth recording.
       *
       * It had four blocks fading in at 0 / 80 / 140 / 220ms, and the first draft of this
       * work kept the staging and merely tightened it — on the grounds that a screen seen
       * once per run is the one place a frequency gate allows some delight.
       *
       * It is not, and the reason is specific: "animating on first paint when stillness
       * is clearer" is a named tell of a machine-built interface, and this is literally
       * the application's first paint. A staged entrance on the first screen is the single
       * most recognisable thing a generated UI does. Stillness is clearer here, so the
       * page resolves at once and then stops.
       */}
      <div className="m-enter">
        <p className="eyebrow">A short game about winning work</p>
        {/* The brand, in the brand colour. This was ink — the largest element on the
            first screen anyone sees, and the only achromatic thing left on it. */}
        <h1 className="mt-3 text-[56px] font-bold leading-[0.95] tracking-[-0.04em] text-(--color-accent) sm:text-[56px]">
          GPL
        </h1>
        <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.2em] text-(--color-accent)">
          Global Pursuit League
        </p>
        <p className="mt-7 max-w-xl text-[18px] leading-[1.55] text-(--color-ink-soft)">
          You have just been handed your first client to win. A company you have never met is
          about to become a promise someone has to keep.
        </p>
      </div>

      <div
        className="m-enter mt-9 flex flex-wrap items-center gap-1.5"
      >
        {chapters.map((c, i) => (
          <span key={c.number} className="flex items-center gap-1.5">
            <span className="flex items-center gap-2 rounded-full border border-(--color-line) bg-(--color-surface) py-1 pl-1 pr-3">
              <span
                aria-hidden="true"
                className="flex h-[20px] w-[20px] items-center justify-center rounded-full text-[12px] font-bold text-(--color-accent-deep)"
                style={{ background: "var(--color-accent-tint)" }}
              >
                {c.number}
              </span>
              <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-(--color-muted)">
                {c.label}
              </span>
            </span>
            {i < chapters.length - 1 && (
              <span aria-hidden="true" className="text-(--color-line-strong)">
                ›
              </span>
            )}
          </span>
        ))}
      </div>

      <div className="m-enter mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: "scale" as const,
            t: "Every option is defensible",
            /* This used to open by repeating its own heading verbatim, on the first
               screen anyone reads. */
            d: "Whether one works depends on what you know by then, and what you have already promised.",
          },
          {
            icon: "target" as const,
            t: "Nothing is random",
            d: "Every result can be explained. If something goes wrong in month five, you can trace it to the decision that caused it.",
          },
          {
            icon: "clock" as const,
            t: "Call it before you commit",
            d: "You say what each decision will cost before you make it. Then you find out.",
          },
        ].map((c) => (
          <div key={c.t} className="card p-5">
            <span className="text-(--color-accent)">
              <Icon name={c.icon} size={18} />
            </span>
            <p className="mt-2.5 text-[15px] font-bold text-(--color-ink)">{c.t}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-(--color-muted)">{c.d}</p>
          </div>
        ))}
      </div>

      <div
        className="m-enter mt-9 flex flex-wrap items-center gap-4"
      >
        <PrimaryButton onClick={onBegin}>{hasSave ? "Start again" : "Take the brief"}</PrimaryButton>
        {hasSave && (
          <button
            onClick={onResume}
            className="rounded-xl border border-(--color-line-strong) bg-(--color-surface) px-5 py-3 text-[15px] font-semibold text-(--color-ink) transition-colors hover:bg-(--color-surface-sunk)"
          >
            Resume where you left off
          </button>
        )}
      </div>

      {stale && <StaleSave stale={stale} onCode={onCode} />}
    </div>
  );
}

/**
 * A run this build can no longer read, and what is left of it.
 *
 * The save used to be keyed `gpl.save.v3`, so any content change voided every run in
 * progress silently — ship a typo fix mid-cohort and the room resets with no explanation.
 * Now a stale save says so, and hands back the run code it stored at save time: fourteen
 * characters that replay the whole run, which exist only because the game is
 * deterministic. `replayable` is false when the decision structure itself moved, and then
 * this says that rather than offering a code the build will refuse.
 */
function StaleSave({
  stale,
  onCode,
}: {
  stale: { message: string; code: string | null; replayable: boolean };
  onCode?: (code: string) => string | null;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div
      className="m-swap mt-8 max-w-xl rounded-[14px] border px-5 py-4"
      role="note"
      style={{ borderColor: "var(--color-border-control)", background: "var(--color-panel)" }}
    >
      <p className="text-[13px] leading-relaxed text-(--color-ink-soft)">{stale.message}</p>
      {stale.code && stale.replayable && onCode && (
        <>
          <p className="mt-2.5 text-[12px] font-bold uppercase tracking-[0.07em] text-(--color-muted)">
            {UI_LABEL.runCode}
          </p>
          <p className="mt-1 text-[18px] font-bold tracking-[0.04em] text-(--color-ink)">
            {stale.code}
          </p>
          <button
            onClick={() => setError(onCode(stale.code as string))}
            className="mt-3 rounded-xl border border-(--color-line-strong) bg-(--color-surface) px-4 py-2 text-[13px] font-semibold text-(--color-ink) transition-colors hover:bg-(--color-surface-sunk)"
          >
            {UI_LABEL.continueFromCode}
          </button>
          {error && (
            <p role="alert" className="mt-2 text-[13px] text-(--color-risk-text)">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────── chapter 0 ─────────────────────────── */

/**
 * The starting advantage.
 *
 * Deliberately not styled as a mission: no rails, no prediction gate, no consequence.
 * You are picking who you are, not deciding anything yet — and the PRD's whole argument
 * for this screen is that a beginning state beats a tutorial (p. 55).
 */
export function SetupScreen({
  node,
  chosen,
  onChoose,
}: {
  node: Setup;
  chosen: string | null;
  onChoose: (id: string) => void;
}) {
  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-center px-5 py-8">
      <div className="m-enter">
        <p className="eyebrow" style={{ color: "var(--color-accent)" }}>
          {node.eyebrow}
        </p>
        {/* 4px to the title it belongs to, 14px to the body it heads — the eyebrow was
            further from its own title than the title was from the paragraph below it. See
            the same correction on the mission header in `ui/mission.tsx`. */}
        <h1
          id={BEAT_TITLE_ID}
          className="mt-1 text-[32px] font-bold leading-[1.1] tracking-[-0.025em] text-(--color-ink)"
        >
          {node.title}
        </h1>
        <div className="mt-3.5 max-w-2xl space-y-1.5">
          {node.body.map((p, i) => (
            <p key={i} className="text-[15px] leading-[1.55] text-(--color-ink-soft)">
              {p}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-7">
        <h2 className="text-[18px] font-bold text-(--color-ink)">{node.question}</h2>
        <p className="mt-0.5 text-[13px] text-(--color-muted)">
          Three teams. None of them is good at everything.
        </p>
      </div>

      {/* Same treatment as a mission's option set, because it is the same object and had
          the same defect: three mutually exclusive cards in an unnamed `<div>`, each
          announced as an independent toggle. This is also the first interactive thing
          anyone meets. */}
      <RadioGroup
        label={node.question}
        className="m-deal mt-3 grid items-stretch gap-3 sm:grid-cols-3"
        style={{ gridTemplateRows: "repeat(5, auto)" }}
      >
        {node.options.map((o, i) => {
          const on = chosen === o.id;
          return (
            <button
              key={o.id}
              className="choice grid gap-0 !p-0 text-left"
              style={{ gridRow: "span 5", gridTemplateRows: "subgrid" }}
              data-selected={on}
              role="radio"
              aria-checked={on}
              tabIndex={radioTabIndex(on, i, chosen !== null)}
              aria-labelledby={`team-${o.id}-title`}
              aria-describedby={`team-${o.id}-desc team-${o.id}-trade`}
              onClick={() => onChoose(o.id)}
            >
              <div>
                {o.facsimile ? (
                  <Facsimile kind={o.facsimile} className="h-[96px] w-full" />
                ) : (
                  o.image && (
                    <img
                      src={artUrl(o.image)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-[96px] w-full object-cover"
                    />
                  )
                )}
                <div className="-mt-6 flex justify-center">
                  <span
                    aria-hidden="true"
                    className="flex h-[48px] w-[48px] items-center justify-center rounded-full border-[3px] border-(--color-surface)"
                    style={{
                      background: on ? "var(--color-accent)" : "var(--color-accent-tint)",
                      color: on ? "#fff" : "var(--color-accent)",
                    }}
                  >
                    <Icon name={o.icon} size={23} />
                  </span>
                </div>
              </div>

              <p
                id={`team-${o.id}-title`}
                className="px-4 pt-2 text-center text-[15px] font-bold"
                style={{ color: on ? "var(--color-accent-deep)" : "var(--color-ink)" }}
              >
                {o.title}
              </p>
              <p
                id={`team-${o.id}-desc`}
                className="px-4 pt-1.5 text-center text-[13px] leading-snug text-(--color-muted)"
              >
                {o.description}
              </p>

              <div id={`team-${o.id}-trade`} className="px-4 pt-3">
                <ul className="space-y-1 border-t border-(--color-line) pt-2.5">
                  {o.strengths.map((t) => (
                    <li key={t} className="flex items-start gap-1.5 text-[12px] leading-snug">
                      <span className="mt-[2px] shrink-0 text-(--color-good)">
                        <Icon name="check" size={13} />
                      </span>
                      <span className="font-medium text-(--color-ink-soft)">
                        <Hidden>{UI_LABEL.up} </Hidden>
                        {t}
                        <Hidden>.</Hidden>
                      </span>
                    </li>
                  ))}
                  <li className="flex items-start gap-1.5 text-[12px] leading-snug">
                    <span
                      aria-hidden="true"
                      className="mt-[2px] flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full text-white"
                      style={{ background: "var(--color-bad)" }}
                    >
                      <Icon name="cross" size={9} />
                    </span>
                    <span className="text-(--color-muted)">
                      <Hidden>{UI_LABEL.down} </Hidden>
                      {o.tradeoff}
                      <Hidden>.</Hidden>
                    </span>
                  </li>
                </ul>
              </div>

              {/* Same object as a mission's option card, so it gets the same marker: a
                  rule and a tick when chosen, an outlined button when not. It had the
                  identical defect — a solid `--color-accent` pill saying "This is us" with
                  a solid `--color-accent` pill saying "Start the pursuit" in the action bar
                  below it (backlog 7.6). */}
              <div className="self-end p-4">
                <CardButton selected={on} on="This is us" off="Pick this team" />
              </div>
            </button>
          );
        })}
      </RadioGroup>
    </div>
  );
}

/* ─────────────────────────── interlude ─────────────────────────── */

export function InterludeScreen({
  node,
  chapter,
}: {
  node: Interlude;
  chapter?: Chapter;
}) {
  return (
    <div
      key={node.id}
      className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-5 py-10"
    >
      {/**
       * The interlude is time passing, and it is the slowest beat in the game: 420ms
       * against 220ms everywhere else.
       *
       * It can afford to be. This is the only screen with nothing to decide, nothing to
       * compare and nothing to read across — measured at ~20% ink and 0.13% chroma, it is
       * the emptiest surface in the product, so a slower arrival reads as a pause in the
       * work rather than as the interface being sluggish. It is also the one beat where
       * the motion IS the content: nothing on this screen says "months have passed"
       * except the pacing and the chapter track filling in behind you in the top bar,
       * which starts 260ms after this arrives.
       */}
      <div className="m-enter-slow">
        {/* The chapter number lands. It is the only thing on screen that marks the
            boundary this beat exists to mark. */}
        <span
          aria-hidden="true"
          className="m-land flex h-11 w-11 items-center justify-center rounded-[14px] text-[15px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
          }}
        >
          {node.chapter}
        </span>
        {node.milestone && (
          <p className="mt-5">
            <Pill tone="good">
              <Icon name="check" size={12} />
              {node.milestone}
            </Pill>
          </p>
        )}
        <p className={`eyebrow ${node.milestone ? "mt-3" : "mt-5"}`}>{node.eyebrow}</p>
        <h1
          id={BEAT_TITLE_ID}
          className="mt-1 text-[32px] font-bold leading-[1.08] tracking-[-0.025em] text-(--color-ink)"
        >
          {node.title}
        </h1>
        <div className="mt-6 space-y-3.5">
          {node.body.map((p, i) => (
            <p key={i} className="text-[15px] leading-[1.6] text-(--color-ink-soft)">
              {p}
            </p>
          ))}
        </div>

        {chapter && (
          <ul className="mt-8 flex flex-wrap gap-2">
            {chapter.steps.map((s, i) => (
              <li
                key={s}
                className="flex items-center gap-2 rounded-lg border border-(--color-line) bg-(--color-surface) px-3 py-1.5 text-[13px] text-(--color-ink-soft)"
              >
                <span className="text-[12px] font-bold text-(--color-faint) tabular-nums">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── ending ─────────────────────────── */

/**
 * An outcome's tone, as the SAME medallion vocabulary the consequence beat uses: a tick, a
 * balance, a warning. It used to be a bare coloured dot here — colour carrying the meaning
 * on its own (1.4.1) — and `mixed` was drawn in `--color-warn`, which is ΔE 4.2 from
 * `--color-bad` in normal vision and 3.1 under protanopia. The two most common outcomes in
 * the game were the same dot.
 */
const TONE_MARK: Record<OutcomeTone, { icon: IconId; colour: string }> = {
  strong: { icon: "check", colour: "var(--color-good)" },
  mixed: { icon: "scale", colour: "var(--color-text-muted)" },
  hard: { icon: "warning", colour: "var(--color-bad)" },
};

/** The colleague who briefed a mission, for attributing what they said to watch for. */
function advisorFor(missionId: string): Advisor | undefined {
  const node = story.nodes[missionId];
  return node && isMission(node) ? node.advisor : undefined;
}

/**
 * THE CLOSING DEBRIEF — lean on screen, dense in print. Two views, one data source.
 *
 * What was here overflowed the working area by 2,700px at 1440×900 (3,439 in 739) and by
 * 1,967–2,782px depending on the path taken: 598–657 words, one declared region, 10–12
 * distinct fills, and a concentric gauge that drew Winability 100 as a 408px arc and
 * Deliverability 100 as a 283px one — a 31% error in the last image the game leaves
 * anybody with. It stated the same three numbers twice in two visual languages, swapped
 * the established target / coins / layers pictograms for `◆ ● ▲` after 46 screens, and on
 * some paths sliced the ledger mid-word at the fold.
 *
 * Four decisions, in the order they matter:
 *
 * 1. **The ring is gone.** Concentric arcs cannot compare: equal values are drawn at
 *    different lengths by construction, because circumference is a function of radius.
 *    Its replacement is `FactorGrid` — the same three-panel small multiple the resolving
 *    beat already uses, with three equal-width tracks on a shared baseline, so 100 and 100
 *    are the same length to the pixel. The three numbers are now stated once.
 * 2. **The dense artefact moved to `@media print`, not to a deleted state.** The audit
 *    trail a facilitator needs — every decision, every outcome headline, every
 *    colleague's watch-for, the ledger's detail lines, the run code — is in the DOM and
 *    the print stylesheet in `index.css` reveals it. Nothing is lost; it is deferred to
 *    the medium that has the pages for it.
 * 3. **Full width, on the spine.** It was `max-w-3xl` centred, so its content edge sat at
 *    356px while every other beat in the game sits at 281px, and it used half the window
 *    on the one screen a cohort reads side by side. Two bands and a three-column sheet.
 * 4. **`watchFor` is rendered at last** — 32 lines authored, 0 rendered, 471 words
 *    (backlog 4.3) — inside `Your decisions`, in the voice of the colleague who said it.
 *    Not as an interface caption: 21 of the 30 imperatives in the game live in this field,
 *    and an interface that tells the player what to notice is the lecture this game keeps
 *    removing. A named person with a job and a stake saying it about a decision the player
 *    actually made is a debrief.
 *
 * ── AND THEN THE ACCOUNT GREW (backlog 4.2, twelve more ledger rules) ────────────────
 *
 * 854 in 739 — 115px over the design target, 9px inside the hard limit, with
 * `Your decisions` clipped at the fold. Measured band by band before anything moved:
 * verdict 203 · account 308 · threads 140 · decisions 57 · run code 31, plus 92px of band
 * margins and 24px of padding. Three changes, biggest first:
 *
 * · **bands 3 and 4 share a row (−116px)** — the only place on the screen where two
 *   regions were competing for height rather than for width. See the note on the row.
 * · **the account is four columns (−44px)**, on a measured `minmax(300px, 1fr)` rather
 *   than a breakpoint. See the note on the band; the old three-column rule was buying a
 *   measure it had already lost.
 * · **18px of page rhythm**, which is the only part of this that is taste.
 *
 * Where it lands, 1440×900: 610 with no chains, 653 on the harness's own path, 774 with
 * three chains, 771 with a 21-entry account, 892 with both. The last is over 863 and this
 * fix does not repair it — repairing it means a shorter account, which is content. Band 3
 * is worth 226px at the 739 target and 350px at 863, which is the budget anything that
 * replaces the chains has to live inside.
 */
export function EndingScreen({ state }: { state: GameState }) {
  const verdict = finalVerdict(state.dims, state.flags);
  const threads = causalThreads(state, story);
  /**
   * Backlog 4.5 — the one question the debrief asks, or `null`.
   *
   * Null on a run whose earned threads carry no authored wrong answers, which is about
   * two runs in five; the chains then appear immediately, exactly as they always did.
   * The chains wait for an answer ONLY while there is a question to answer.
   */
  const claim = causalClaim(state, story);
  const [claimAnswered, setClaimAnswered] = useState(false);
  const showThreads = threads.length > 0 && (claim === null || claimAnswered);
  /* Whether the row has a left-hand region at all. It must cost nothing when it does
     not: with neither a question nor chains, `decisions` takes the whole width rather
     than leaving a 1fr hole where a section used to be. */
  const leftColumn = claim !== null || showThreads;
  const account = ledger(state);
  const runCode = codeFromState(state, story);
  /**
   * Whether the run list is open, mirrored out of the native `<details>` rather than
   * driving it.
   *
   * The element stays uncontrolled — `only-print-open` in `index.css` opens it on paper by
   * reaching into `::details-content`, and a React-controlled `open` prop would fight
   * that. All this does is let the layout below know, so that opening an eighteen-row
   * audit trail gives it the page instead of threading it through a 468px column at
   * roughly ninety pixels a row.
   */
  const [runListOpen, setRunListOpen] = useState(false);

  return (
    /* One gesture for the whole debrief, and then it holds still. No cascade: the screen
       now fits, so a stagger would be five animations over one page rather than a sequence
       the reader follows — and `m-enter` is opacity only, so it survives `reduce` as a
       dissolve instead of being deleted. */
    /* The page rhythm is 16px between bands and 10px of edge padding, against 20/24/24 and
       12px before. Worth 18px, which is worth having on the tightest screen in the game
       and is not a legibility loss: every band opens with a bold, coloured `SectionTitle`,
       so the sections are separated by weight rather than by air. Measured, band by band,
       in the docstring above — the structural savings are the 4-column account and the
       tail row, and this is the last 18px, not the argument. */
    /* `py-2` below `lg`, and the two band gaps below go 16 → 10 with it. Air, not
       content: the rhythm this screen documents just above is 16/10 against the 20/24/24
       it replaced, and the tablet band takes the same step again — 10 between bands, 8 at
       the edge. That is the last 16px between four bands and the bottom of a 1,180px
       tablet. No entry, no chain and no word of the account is touched. */
    <div className="m-enter flex min-h-full flex-col px-5 py-2 lg:py-2.5">
      {/* ── band 1 · the verdict, and where it left the three ─────────────────── */}
      <div data-region="verdict" className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <div className="min-w-0 flex-1">
          {/* "How it ended" is load-bearing beyond the copy: `tools/verify.mjs` and
              `tools/measure.mjs` both identify this beat by this exact string. */}
          <Eyebrow>How it ended</Eyebrow>
          <h1
            id={BEAT_TITLE_ID}
            className="mt-1 text-[32px] font-bold leading-[1.1] tracking-[-0.025em] text-(--color-ink)"
          >
            {verdict.title}
          </h1>
          <p className="mt-3.5 max-w-[66ch] text-[15px] leading-[1.6] text-(--color-ink-soft) text-pretty">
            {verdict.summary}
          </p>

          {state.badges.length > 0 && (
            <ul className="mt-3.5 flex flex-wrap items-center gap-1.5">
              <li className="text-[12px] font-bold uppercase tracking-[0.07em] text-(--color-muted)">
                {UI_LABEL.howYouPlayed}
              </li>
              {state.badges.map((b) => (
                <li key={b}>
                  <BadgeChip id={b} compact />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* The one card in band 1, and the only chart on the screen.
            `md:w-[380px]` keeps it BESIDE the verdict in the tablet band instead of
            wrapping under it. Full width it is a 185px band of its own on top of a 158px
            one; beside, the two share the taller of the two heights. The three meters
            need 102px a column at 380 and the widest label ("Deliverability") is 86, so
            nothing in it wraps that did not wrap at 468. */}
        <section
          data-region="standing"
          className="card w-full shrink-0 px-4 py-3 md:w-[380px] lg:w-[468px]"
        >
          <SectionTitle icon="chart" className="mb-2">
            {UI_LABEL.endedUp}
          </SectionTitle>
          <FactorGrid dims={state.dims} />
          <p className="mt-2.5 border-t border-(--color-line) pt-2 text-[13px] leading-snug text-(--color-muted) text-pretty">
            No engagement finishes level on all three. The one that gave is the one you decided
            could.
          </p>
        </section>
      </div>

      {/* ── band 2 · the account ──────────────────────────────────────────────────
          As many ~310px columns as the width holds, which is four at 1440 and one on a
          phone. It was three fixed columns, on the stated grounds that a 437px column kept
          every detail line to one line — measured, it does not: at 437px, twelve of the
          fifteen entries already wrapped to two lines, so the third column was buying a
          measure it no longer had. At 310px every entry is two lines and nothing reaches
          three, which trades one row of five for none and takes 44px off the band. The
          310px floor is what the measurement supports, so it is the number in the rule
          rather than a breakpoint that happens to produce it.
          `flag`, not `layers`: the account is a position, and `layers` belongs to
          Deliverability. */}
      {account.length > 0 && (
        <section data-region="account" className="mt-2 lg:mt-4">
          <SectionTitle icon="flag" className="mb-2">
            {UI_LABEL.account}
          </SectionTitle>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-8 gap-y-1.5 lg:gap-y-2">
            {account.map((e) => (
              <LedgerRow key={e.label} entry={e} size={15} bare />
            ))}
          </ul>
        </section>
      )}

      {/**
       * ── bands 3 and 4, on one row ─────────────────────────────────────────────
       *
       * They used to stack, and stacking is what put the screen 115px over its design
       * budget: `threads` is a wide, short region and `decisions` is a *narrow*, short one
       * — 18 tone marks and a disclosure — so one under the other spent 300px of height on
       * two things that between them fill about a third of the page. Measured band by
       * band, this row is the single largest saving available on the screen (−116px),
       * because it is the only place where two regions were competing for height rather
       * than for width.
       *
       * The right column is 468px because that is the standing card's width in band 1:
       * the page then has one right-hand spine holding the numbers and the record, rather
       * than two arbitrary edges.
       *
       * `threads` is absent on a large minority of runs, so it must cost nothing when it
       * is missing: with no left-hand region, `decisions` takes the whole row rather than
       * leaving a 1fr hole where a section used to be.
       */}
      {/* …and the same row exists in the tablet band, at 300px rather than 468. The
          argument is the one above and it is stronger at this width, not weaker: these
          are two short regions, and one under the other spends 340px of an 1,045px page
          on things that between them fill about a third of it. 300 is what the collapsed
          decisions disclosure needs — a row of 18 tone marks and one line of text. */}
      <div
        className={`mt-2 grid gap-x-8 gap-y-5 lg:mt-4 ${
          leftColumn && !runListOpen
            ? "md:grid-cols-[minmax(0,1fr)_272px] lg:grid-cols-[minmax(0,1fr)_468px]"
            : ""
        }`}
      >
        {/* The question and then the chains it is about, in that order and in ONE track.
            Two grid children would put them in two COLUMNS and push `decisions` onto a
            row of its own — which is the 116px this row was built to reclaim. */}
        {leftColumn && (
          <div className="grid min-w-0 gap-y-5">
            {/* Backlog 4.5, and it sits here rather than below because the chains are the
                answer to it. `ui/claim.tsx` drops from four candidate rows to two once
                answered, so the column does not grow at the moment they arrive. */}
            {claim !== null && (
              <CausalClaimItem claim={claim} onAnswered={() => setClaimAnswered(true)} />
            )}

            {/* The payoff of the whole design. Two across at this column width rather than
                three: `auto-fill` will not open a 272px track for 15px prose, and with one
                thread it still reserves the second track, which keeps a lone chain off a
                117-character measure. */}
            {showThreads && (
              <section data-region="threads">
                <SectionTitle icon="spark" className="mb-2">
                  {UI_LABEL.ledToWhat}
                </SectionTitle>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-x-8 gap-y-3">
                  {threads.map((t, i) => (
                    <div
                      key={i}
                      className="break-inside-avoid border-l-[3px] border-(--color-accent) pl-3 text-[15px] leading-snug"
                    >
                      <p className="text-(--color-ink) text-pretty">{t.because}</p>
                      <p className="mt-1.5 flex items-start gap-1.5 text-(--color-ink-soft) text-pretty">
                        <span
                          aria-hidden="true"
                          className="shrink-0 font-bold text-(--color-accent)"
                        >
                          →
                        </span>
                        {t.soLater}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* The run itself — collapsed on screen, open in print. The summary carries the
            SHAPE of the run as one mark per decision, so the collapsed state still says
            something true: a row of ticks reads differently from a row of warnings across
            a room. */}
        <section data-region="decisions" className="pb-1">
          <SectionTitle icon="clock" className="mb-1.5">
            {UI_LABEL.decisions}
          </SectionTitle>
          <details className="only-print-open">
            {/* The heading is NOT inside the summary: `<summary>` takes phrasing content
                or one heading element, not both, and the run strip has to sit beside the
                affordance rather than inside a heading. Same shape as the rail's ledger
                disclosure, which is the other one in the game. */}
            {/* `w-fit`, so the focus ring encloses the affordance rather than 1,374px of
                empty row. A full-width ring around a half-width control reads as a bug. */}
            {/* The mirror hangs off the summary's click, not off `onToggle`. Measured:
                React's `onToggle` never fired here — `toggle` does not bubble — while a
                native listener on the same element counted one. Activating a summary
                always produces a click, from the keyboard as well as the pointer, so this
                is the event that exists. */}
            <summary
              onClick={() => setRunListOpen((open) => !open)}
              className="flex w-fit min-h-[24px] cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1.5"
            >
              {/* `flex-wrap`. Eighteen marks at 17px are 306px of row, and in the tablet
                  band this column is 272 — so the last two decisions of the run were
                  being clipped by the page edge with no scrollbar, which is D-041's own
                  finding reappearing one band down. The strip is meant to be read as a
                  shape across a room; two rows of it still is, and a truncated one is
                  a different shape. */}
              <span aria-hidden="true" className="flex flex-wrap items-center gap-1">
                {state.history.map((h) => (
                  <span key={h.missionId} style={{ color: TONE_MARK[h.tone].colour }}>
                    <Icon name={TONE_MARK[h.tone].icon} size={13} />
                  </span>
                ))}
              </span>
              <span className="text-[13px] text-(--color-muted)">
                <span className="font-bold text-(--color-ink) tabular-nums">
                  {state.history.length}
                </span>{" "}
                in order <span className="text-(--color-accent)">{UI_LABEL.decisionsOpen}</span>
              </span>
            </summary>

            {/* Two columns when the section has the page, one when it is sharing the row
                with the chains. It was `xl:grid-cols-2`, which is a viewport query and so
                would still have split a 468px column into two 218px ones. */}
            <ol className="mt-2.5 grid grid-cols-[repeat(auto-fill,minmax(560px,1fr))] gap-x-8 gap-y-2.5">
                {state.history.map((h) => {
                  const stage = STAGES.find((s) => s.id === h.stage);
                  const mark = TONE_MARK[h.tone];
                  const advisor = advisorFor(h.missionId);
                  return (
                    <li key={h.missionId} className="flex gap-2.5 break-inside-avoid">
                      <span className="mt-[3px] shrink-0" style={{ color: mark.colour }}>
                        <Icon name={mark.icon} size={15} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold uppercase tracking-[0.07em] text-(--color-muted)">
                          {stage?.label}
                          <span className="ml-2 font-medium normal-case tracking-normal">
                            {h.missionTitle}
                          </span>
                        </p>
                        <p className="text-[13px] font-bold text-(--color-ink) text-pretty">
                          {h.chosenLabel}
                        </p>
                        {/* The outcome headline is the one line of this row a player has
                            already read, on the consequence screen. It is the
                            facilitator's column, so it prints and does not compete on
                            screen. */}
                        <p className="only-print text-[13px] leading-snug text-(--color-ink-soft) text-pretty">
                          {h.headline}
                        </p>
                        {/* 4.3 · what the colleague told you to watch for, in their voice.
                            Never rendered without a name: unattributed, it is the
                            interface telling the player what to notice. */}
                        {h.lesson.watchFor && advisor && (
                          <p className="mt-0.5 text-[13px] leading-snug text-(--color-ink-soft) text-pretty">
                            <span className="font-bold text-(--color-ink)">{advisor.name}: </span>
                            {quoted(h.lesson.watchFor)}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ol>
          </details>

          {/**
           * The run code, at the one moment it is worth anything.
           *
           * Eight base32 characters that replay this exact run, because the game is
           * deterministic — and until now the only screen that ever showed one was the
           * failure path where a save could not be read. It is the mechanism behind peer
           * comparison, facilitator pre-reading and exact bug repro (backlog 8.2), and the
           * debrief is where a cohort actually wants to swap them. On paper it is the
           * difference between an artefact and an anecdote.
           *
           * It sits inside `Your decisions` rather than under its own rule at the foot of
           * the page: it is the same object — the record of this run — and as a band of
           * its own it was 51px of height for one line of 13px text.
           */}
          {runCode && (
            <p className="mt-2.5 border-t border-(--color-line) pt-2.5 text-[13px] text-(--color-muted)">
              <span className="font-bold text-(--color-ink)">{UI_LABEL.runCode}: </span>
              <span className="font-bold tracking-[0.04em] text-(--color-accent-deep)">
                {runCode}
              </span>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
