/** Title, chapter interludes, and the closing debrief. */

import { useState } from "react";

import { story } from "../content/story";
import { causalThreads, finalVerdict, ledger } from "../engine/engine";
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
 */
export function EndingScreen({ state }: { state: GameState }) {
  const verdict = finalVerdict(state.dims, state.flags);
  const threads = causalThreads(state, story);
  const account = ledger(state);
  const runCode = codeFromState(state, story);

  return (
    /* One gesture for the whole debrief, and then it holds still. No cascade: the screen
       now fits, so a stagger would be five animations over one page rather than a sequence
       the reader follows — and `m-enter` is opacity only, so it survives `reduce` as a
       dissolve instead of being deleted. */
    <div className="m-enter flex min-h-full flex-col px-5 py-3">
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

        {/* The one card in band 1, and the only chart on the screen. */}
        <section data-region="standing" className="card w-full shrink-0 px-4 py-3 lg:w-[468px]">
          <SectionTitle icon="chart" className="mb-2">
            {UI_LABEL.standing}
          </SectionTitle>
          <FactorGrid dims={state.dims} />
          <p className="mt-2.5 border-t border-(--color-line) pt-2 text-[13px] leading-snug text-(--color-muted) text-pretty">
            No engagement finishes level on all three. The one that gave is the one you decided
            could.
          </p>
        </section>
      </div>

      {/* ── band 2 · the account ──────────────────────────────────────────────────
          Three columns at this width, so every entry's detail line lands on one line
          instead of a 660px measure reflowing into two. `flag`, not `layers`: the account
          is a position, and `layers` belongs to Deliverability. */}
      {account.length > 0 && (
        <section data-region="account" className="mt-5">
          <SectionTitle icon="flag" className="mb-2">
            {UI_LABEL.account}
          </SectionTitle>
          <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {account.map((e) => (
              <LedgerRow key={e.label} entry={e} size={15} bare />
            ))}
          </ul>
        </section>
      )}

      {/* ── band 3 · what led to what ────────────────────────────────────────────
          The payoff of the whole design, and empty on 77% of runs (backlog 1.5), so it
          must cost nothing when it is absent. Three across rather than three down. */}
      {threads.length > 0 && (
        <section data-region="threads" className="mt-6">
          <SectionTitle icon="spark" className="mb-2">
            {UI_LABEL.ledToWhat}
          </SectionTitle>
          <div className="grid gap-x-8 gap-y-3 lg:grid-cols-2 xl:grid-cols-3">
            {threads.map((t, i) => (
              <div
                key={i}
                className="break-inside-avoid border-l-[3px] border-(--color-accent) pl-3 text-[15px] leading-snug"
              >
                <p className="text-(--color-ink) text-pretty">{t.because}</p>
                <p className="mt-1.5 flex items-start gap-1.5 text-(--color-ink-soft) text-pretty">
                  <span aria-hidden="true" className="shrink-0 font-bold text-(--color-accent)">
                    →
                  </span>
                  {t.soLater}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── band 4 · the run itself ──────────────────────────────────────────────
          Collapsed on screen, open in print. The summary carries the SHAPE of the run as
          one mark per decision, so the collapsed state still says something true: a row of
          ticks reads differently from a row of warnings across a room. */}
      <section data-region="decisions" className="mt-6 pb-1">
        <SectionTitle icon="clock" className="mb-1.5">
          {UI_LABEL.decisions}
        </SectionTitle>
        <details className="only-print-open">
          {/* The heading is NOT inside the summary: `<summary>` takes phrasing content or
              one heading element, not both, and the run strip has to sit beside the
              affordance rather than inside a heading. Same shape as the rail's ledger
              disclosure, which is the other one in the game. */}
          {/* `w-fit`, so the focus ring encloses the affordance rather than 1,374px of
              empty row. A full-width ring around a half-width control reads as a bug. */}
          <summary className="flex w-fit min-h-[24px] cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1.5">
            <span aria-hidden="true" className="flex items-center gap-1">
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

          <ol className="mt-2.5 grid gap-x-8 gap-y-2.5 xl:grid-cols-2">
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
                        already read, on the consequence screen. It is the facilitator's
                        column, so it prints and does not compete on screen. */}
                    <p className="only-print text-[13px] leading-snug text-(--color-ink-soft) text-pretty">
                      {h.headline}
                    </p>
                    {/* 4.3 · what the colleague told you to watch for, in their voice.
                        Never rendered without a name: unattributed, it is the interface
                        telling the player what to notice. */}
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
      </section>

      {/**
       * The run code, at the one moment it is worth anything.
       *
       * Eight base32 characters that replay this exact run, because the game is
       * deterministic — and until now the only screen that ever showed one was the
       * failure path where a save could not be read. It is the mechanism behind peer
       * comparison, facilitator pre-reading and exact bug repro (backlog 8.2), and the
       * debrief is where a cohort actually wants to swap them. On paper it is the
       * difference between an artefact and an anecdote.
       */}
      {runCode && (
        <p className="mt-6 border-t border-(--color-line) pt-2.5 text-[13px] text-(--color-muted)">
          <span className="font-bold text-(--color-ink)">{UI_LABEL.runCode}: </span>
          <span className="font-bold tracking-[0.04em] text-(--color-accent-deep)">{runCode}</span>
        </p>
      )}
    </div>
  );
}
