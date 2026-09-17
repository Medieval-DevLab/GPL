/**
 * The chapter debrief.
 *
 * Five per run, one closing each chapter. Stage ground and NO CHROME — no rails, no
 * meters, no action bar — because the chapter is over and this is a change of world
 * rather than another beat on the same desk. Subtraction is the signal, exactly as it is
 * on a cut scene; the difference is that a cut scene opens a chapter looking forward and
 * this one closes it looking back.
 *
 * It carries four things, and the second is the reason it exists:
 *
 *  1. WHAT YOU DID — the chapter's decisions, each with the outcome that fired and the
 *     tone the author gave it.
 *  2. WHAT YOU DID NOT — the path-reveal. Detroit: Become Human ends every chapter with
 *     a flowchart that includes the branches you never saw, and that is the whole reason
 *     its players replay. GPL reveals causality only in the closing debrief, seventeen
 *     decisions after the first one, which is far too late to change how anybody plays.
 *     Showing the road not taken at the end of chapter one changes how chapter two is
 *     played, and that is the point.
 *  3. Stars, from `stars(state, content, missionId)`.
 *  4. Badges earned during this chapter, and the chapter's own verdict from content.
 *
 * WHAT THE PATH-REVEAL MAY AND MAY NOT CLAIM, because this is the one place a debrief
 * could quietly start lying. For an investigate beat the roads not taken are the
 * questions the player did not spend a slot on, and for a build beat they are the
 * components left out: both are exact, because the alternatives are the content itself.
 * For a choice beat the untaken OPTION is exact, but the outcome it would have produced
 * is not knowable here — `selectOutcome` matches conditions against the flags and
 * dimensions as they stood before the commit, and `HistoryEntry` records `dimsBefore`
 * but no flags. Reconstructing them would be a game rule, and game rules do not live in
 * `src/ui`.
 *
 * So the outcome is shown ONLY where it is certain: an option with exactly one outcome
 * and no condition on it has one branch, and that branch is what would have happened.
 * Measured against today's content that is 14 of the 50 choice options, and none of
 * chapter five's eleven. The rest are named without a result, which is honest and still
 * teaches — "you did not take the phased price" is the lesson; inventing its consequence
 * would not add one. See `docs/DECISIONS.md` D-056 for the full count and the two-line
 * change that would close it.
 *
 * NO RULES LIVE HERE. Every number is read from `state.history`, `state.badges` and
 * `progress.ts`; nothing in this file decides a branch or computes a consequence.
 */

import { useMemo } from "react";

import { stars, type Stars } from "../engine/progress";
import {
  BADGE_META,
  isMission,
  type BadgeId,
  type Content,
  type GameState,
  type Interlude,
  type Mission,
  type Outcome,
  type OutcomeTone,
} from "../engine/types";
import { Icon } from "./icons";
import { Celebration } from "./reward";
import { BEAT_TITLE_ID } from "./shell";

/* ───────────────────────── interface labels ─────────────────────────
   MUST MOVE TO `UI_LABEL` in `ui/shell.tsx`. Local only because several agents are
   editing that module in parallel; move them and delete this block.

   None of it is story. Every string names a region, a state or a count — the chapter's
   own words arrive as `verdict`, `title` and `eyebrow` from content. */
const DEBRIEF_LABEL = {
  /** the chapter label, when content has not authored an eyebrow */
  chapter: "Chapter",
  complete: "complete",
  /** the two columns, which are the whole argument of the screen */
  didColumn: "What you did",
  didNotColumn: "What you did not",
  /** the star read-out, where the figure alone would not say what it counts */
  starsOf: "of",
  starsEarned: "stars earned in this chapter",
  /** per-row, for anyone who cannot see three glyphs */
  starsLabel: "stars",
  /** the recognition strip */
  recognition: "Earned in this chapter",
  /** the path-reveal's overflow, when a beat had more roads than the row can hold */
  more: "more",
  /** nothing was left on the table — every road was taken, which a build beat can do */
  nothingUntaken: "Nothing left on the table.",
  /** the one action, and it goes to the map because the loop closes in the same place */
  exit: "Back to the map",
  /** the achievement pill's non-colour redundancy, as on the cut scene */
  milestone: "Milestone reached",
} as const;

/* ───────────────────────── the dark register ─────────────────────────
   Named once, as `ui/journey.tsx` does, so this file cannot spell a colour nobody
   measured. `--color-glow` is 3.58:1 on the stage: a fill, a border and a display
   numeral, never small type. */
const T = {
  base: "var(--color-stage)",
  raised: "var(--color-stage-raised)",
  ink: "var(--color-stage-ink)",
  inkSoft: "var(--color-stage-ink-soft)",
  line: "var(--color-stage-line)",
  lineSoft: "color-mix(in oklab, var(--color-stage-line) 55%, transparent)",
  glow: "var(--color-glow)",
  energy: "var(--color-energy)",
  reward: "var(--color-reward)",
} as const;

/**
 * Tone on the stage, carried by a colour AND a glyph — never colour alone.
 *
 * Not the consequence screen's palette, because that one is measured on paper: `mixed`
 * there is `--color-text-muted`, which is ink and invisible here, and `hard` is the solid
 * red, which is 2.6:1 on a violet-black ground. The stage's answers are the ones
 * `ScoreTally` already established — cyan for the good news, the pale rose of the risk
 * ramp for the bad — so a reader moving between the two dark surfaces learns one system.
 */
const TONE: Record<OutcomeTone, { colour: string; icon: "check" | "scale" | "warning" }> = {
  strong: { colour: T.energy, icon: "check" },
  mixed: { colour: T.inkSoft, icon: "scale" },
  hard: { colour: "var(--color-risk-tint)", icon: "warning" },
};

/* ───────────────────────────── derived shape ───────────────────────────── */

/** A road the player did not take, named from content. */
interface UntakenBranch {
  id: string;
  label: string;
  /** set only where the branch has exactly one, unconditional outcome — see the header */
  outcome: { headline: string; tone: OutcomeTone } | null;
}

interface DebriefRow {
  missionId: string;
  missionTitle: string;
  chosenLabel: string;
  headline: string;
  tone: OutcomeTone;
  stars: Stars;
  untaken: UntakenBranch[];
}

/** The outcome an id names, wherever the mission keeps it. */
function outcomeById(mission: Mission, id: string): Outcome | undefined {
  if (mission.kind === "choice") {
    for (const option of mission.options) {
      const hit = option.outcomes.find((o) => o.id === id);
      if (hit) return hit;
    }
    return undefined;
  }
  return mission.outcomes.find((o) => o.id === id);
}

/**
 * The roads not taken on one beat.
 *
 * Exact for evidence and components, because the alternatives ARE the content. For a
 * choice, exact about the option and silent about its result unless the option has a
 * single unconditional outcome — see the file header for why that line is drawn there.
 */
function untakenOn(mission: Mission, chosenIds: readonly string[]): UntakenBranch[] {
  if (mission.kind === "choice") {
    return mission.options
      .filter((o) => !chosenIds.includes(o.id))
      .map((o) => {
        const only = o.outcomes.length === 1 ? o.outcomes[0] : undefined;
        return {
          id: o.id,
          label: o.title,
          outcome:
            only && !only.when ? { headline: only.headline, tone: only.tone } : null,
        };
      });
  }
  if (mission.kind === "investigate") {
    return mission.evidence
      .filter((e) => !chosenIds.includes(e.id))
      .map((e) => ({ id: e.id, label: e.question, outcome: null }));
  }
  return mission.components
    .filter((c) => !chosenIds.includes(c.id))
    .map((c) => ({ id: c.id, label: c.title, outcome: null }));
}

/**
 * The badges this chapter is responsible for.
 *
 * `state.badges` is cumulative and carries no chapter, so a badge is attributed to the
 * beat that FIRST named it: history is walked in order, each entry's fired outcome is
 * looked up, and the first appearance wins. That is the same rule the engine applies when
 * it declines to award a badge twice, read back off the record rather than recomputed.
 */
function badgesEarnedIn(state: GameState, content: Content, chapter: number): BadgeId[] {
  const seen = new Set<BadgeId>();
  const here: BadgeId[] = [];
  for (const entry of state.history) {
    const node = content.nodes[entry.missionId];
    if (!node || !isMission(node)) continue;
    const badge = outcomeById(node, entry.outcomeId)?.effect.badge;
    if (!badge || seen.has(badge)) continue;
    seen.add(badge);
    if (entry.chapter === chapter && state.badges.includes(badge)) here.push(badge);
  }
  return here;
}

function rowsFor(state: GameState, content: Content, chapter: number): DebriefRow[] {
  const rows: DebriefRow[] = [];
  for (const entry of state.history) {
    if (entry.chapter !== chapter) continue;
    const node = content.nodes[entry.missionId];
    const mission = node && isMission(node) ? node : null;
    rows.push({
      missionId: entry.missionId,
      missionTitle: entry.missionTitle,
      chosenLabel: entry.chosenLabel,
      headline: entry.headline,
      tone: entry.tone,
      stars: stars(state, content, entry.missionId),
      untaken: mission ? untakenOn(mission, entry.chosenIds) : [],
    });
  }
  return rows;
}

/* ───────────────────────────── pieces ───────────────────────────── */

/**
 * Three stars, gold for earned.
 *
 * `spark` rather than the map's dots, because this is the screen that AWARDS them and a
 * dot is a progress pip. The count is spoken beside it rather than inferred from three
 * glyphs of two colours.
 */
function StarRow({ count, size = 15 }: { count: Stars; size?: number }) {
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      <span className="sr-only">
        {count} {DEBRIEF_LABEL.starsOf} 3 {DEBRIEF_LABEL.starsLabel}
      </span>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className="block"
          style={{ color: n <= count ? T.reward : T.lineSoft }}
        >
          <Icon name="spark" size={size} />
        </span>
      ))}
    </span>
  );
}

/**
 * The tone, as a glyph in a ring. Decorative, and deliberately.
 *
 * E6 says meaning is never carried by colour alone, and here it is not: the glyph differs
 * per tone, and the row's star count is spoken in words beside it. What this does NOT do
 * is put a tone WORD on screen. `ui/consequence.tsx` refuses the same thing for the same
 * reason — "THAT WORKED" in tracked caps above a headline is the interface grading the
 * decision — and a debrief that graded four of them in a column would be worse, not
 * better, for being retrospective.
 */
function ToneMark({ tone }: { tone: OutcomeTone }) {
  const t = TONE[tone];
  return (
    <span
      aria-hidden="true"
      className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border"
      style={{
        color: t.colour,
        borderColor: `color-mix(in oklab, ${t.colour} 62%, transparent)`,
        background: `color-mix(in oklab, ${t.colour} 16%, transparent)`,
      }}
    >
      <Icon name={t.icon} size={13} />
    </span>
  );
}

/**
 * A column header, built like `.section-title` rather than like a table's.
 *
 * Sentence case with a coloured icon, not 12px tracked capitals. `DESIGN-RULES.md` E8a
 * bans faint uppercase for headings and it is right to: the first draft of this screen had
 * "WHAT YOU DID" and "WHAT YOU DID NOT" in tracked caps, which is the device the mockups
 * use nowhere and which costs 10–20% reading speed for the privilege. The two icons are
 * the polychrome pair that carries the whole argument — a flag on the road taken, a stop
 * on the one that was there.
 */
function ColumnHead({
  icon,
  tint,
  lit,
  children,
}: {
  icon: "flag" | "block";
  tint: string;
  lit: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold"
      style={{ background: lit ? T.raised : T.base, color: lit ? T.ink : T.inkSoft }}
    >
      <span aria-hidden="true" className="shrink-0" style={{ color: tint }}>
        <Icon name={icon} size={15} />
      </span>
      {children}
    </div>
  );
}

/* ───────────────────────────── the screen ───────────────────────────── */

export function ChapterDebrief({
  state,
  content,
  chapter,
  node,
  verdict,
  onExit,
  titleId = BEAT_TITLE_ID,
}: {
  state: GameState;
  content: Content;
  /** which chapter is closing. Defaults to the node's own. */
  chapter?: number;
  /** the `chapter-debrief` interlude, where content has authored one */
  node?: Interlude;
  /** the one-line chapter verdict. Falls back to the node's first body line. */
  verdict?: string;
  /** to the map, where the chapter fills in gold */
  onExit?: () => void;
  titleId?: string;
}) {
  const number = chapter ?? node?.chapter ?? 1;
  const rows = useMemo(() => rowsFor(state, content, number), [state, content, number]);
  const badges = useMemo(() => badgesEarnedIn(state, content, number), [state, content, number]);

  const earned = rows.reduce((total, r) => total + r.stars, 0);
  const possible = rows.length * 3;
  /* The celebration belongs here and on the map, never inside a beat — so it fires on
     the two things that are genuinely rare: recognition, and a beat read perfectly. */
  const celebrate = badges.length > 0 || rows.some((r) => r.stars === 3);

  const authored = content.chapters.find((c) => c.number === number);
  const eyebrow = node?.eyebrow ?? `${DEBRIEF_LABEL.chapter} ${number}`;
  const title = node?.title ?? authored?.title ?? "";
  const line = verdict ?? node?.body?.[0];

  /* Four decisions is the longest chapter, and a fourth row has to come from somewhere.
     It comes from the path column, which is a list rather than prose and degrades into a
     count without losing its argument. */
  const untakenLimit = rows.length > 3 ? 2 : 3;

  return (
    <section
      data-region="debrief"
      aria-label={`${eyebrow}: ${title}`}
      className="m-enter relative isolate flex h-full min-h-[560px] w-full flex-col overflow-hidden px-10 py-8"
      style={{ background: T.base }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-60 -right-32 h-[620px] w-[620px]"
        style={{
          background: `radial-gradient(circle at 50% 50%, color-mix(in oklab, ${T.glow} 34%, transparent) 0%, transparent 68%)`,
        }}
      />

      {/* ── who this was and how it went ── */}
      <header data-region="verdict" className="relative flex items-start justify-between gap-10">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: T.energy }}>
            {eyebrow}
            <span aria-hidden="true" style={{ color: T.line }}>
              ·
            </span>
            <span style={{ color: T.inkSoft }}>{DEBRIEF_LABEL.complete}</span>
          </p>
          <h1
            id={titleId}
            className="mt-1.5 text-[32px] leading-[1.1] font-bold tracking-[-0.025em]"
            style={{ color: T.ink }}
          >
            {title}
          </h1>
          {line && (
            <p className="mt-2.5 max-w-[62ch] text-[15px] leading-[1.55]" style={{ color: T.inkSoft }}>
              {line}
            </p>
          )}
          {node?.milestone && (
            <span
              className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold"
              style={{
                color: T.reward,
                background: `color-mix(in oklab, ${T.reward} 16%, transparent)`,
                borderColor: `color-mix(in oklab, ${T.reward} 42%, transparent)`,
              }}
            >
              <Icon name="check" size={13} />
              <span className="sr-only">{DEBRIEF_LABEL.milestone}: </span>
              {node.milestone}
            </span>
          )}
        </div>

        {rows.length > 0 && (
          <div className="relative shrink-0 pt-1 text-right">
            {celebrate && <Celebration size={128} />}
            <p className="relative flex items-baseline justify-end gap-2">
              <span
                className="numeral text-[length:var(--text-display)]"
                style={{
                  color: T.reward,
                  textShadow: `0 0 46px color-mix(in oklab, ${T.reward} 42%, transparent)`,
                }}
              >
                {earned}
              </span>
              <span className="text-[18px] font-semibold" style={{ color: T.inkSoft }}>
                {DEBRIEF_LABEL.starsOf} {possible}
              </span>
            </p>
            <p className="relative mt-1 text-[12px]" style={{ color: T.inkSoft }}>
              {DEBRIEF_LABEL.starsEarned}
            </p>
          </div>
        )}
      </header>

      {/* ── what you did, beside what you did not ──
             Flush-adjacent cells divided by 1px rules: the hairlines are the grid's own
             background showing through a 1px gap, not eight detached cards. The lit
             column is the road taken; the unlit one is the road that was there. */}
      {rows.length > 0 && (
        <div
          data-region="decisions"
          className="relative mt-6 grid min-h-0 flex-1 gap-px overflow-hidden rounded-xl border"
          style={{
            gridTemplateColumns: "minmax(0,1fr) minmax(0,0.84fr)",
            gridTemplateRows: `auto repeat(${rows.length}, minmax(0, 1fr))`,
            background: T.line,
            borderColor: T.line,
          }}
        >
          <ColumnHead icon="flag" tint={T.energy} lit>
            {DEBRIEF_LABEL.didColumn}
          </ColumnHead>
          <ColumnHead icon="block" tint="var(--color-glow-ink)" lit={false}>
            {DEBRIEF_LABEL.didNotColumn}
          </ColumnHead>

          {rows.map((row) => {
            const shown = row.untaken.slice(0, untakenLimit);
            const rest = row.untaken.length - shown.length;
            return [
              <div
                key={`${row.missionId}-did`}
                /* `overflow-hidden` is the backstop, not the layout. The rows are
                   `minmax(0, 1fr)`, so a cell whose content is taller than its track
                   would otherwise paint over the row beneath it — and at 739 with four
                   decisions a two-line headline is within ~6px of doing exactly that.
                   The line clamps bound each field; this bounds their sum. */
                className="flex min-w-0 flex-col justify-center gap-1.5 overflow-hidden px-5 py-3"
                style={{ background: T.raised }}
              >
                <div className="flex items-center gap-2.5">
                  <ToneMark tone={row.tone} />
                  <p className="min-w-0 flex-1 truncate text-[12px] font-medium" style={{ color: T.inkSoft }}>
                    {row.missionTitle}
                  </p>
                  <StarRow count={row.stars} />
                </div>
                <p className="line-clamp-1 text-[15px] leading-snug font-bold" style={{ color: T.ink }}>
                  {row.chosenLabel}
                </p>
                <p className="line-clamp-2 text-[13px] leading-snug" style={{ color: T.inkSoft }}>
                  {row.headline}
                </p>
              </div>,

              <div
                key={`${row.missionId}-not`}
                data-region="path"
                className="flex min-w-0 flex-col justify-center gap-1.5 overflow-hidden px-5 py-3"
                style={{ background: T.base }}
              >
                {shown.length === 0 && (
                  <p className="text-[13px]" style={{ color: T.inkSoft }}>
                    {DEBRIEF_LABEL.nothingUntaken}
                  </p>
                )}
                {shown.map((b) => (
                  <div key={b.id} className="min-w-0">
                    <p className="flex min-w-0 items-baseline gap-2 text-[13px] leading-snug">
                      {/* Violet, not the hairline grey it was: at `--color-stage-line`
                          the marker was a 3.2:1 dot nobody could see, and this column is
                          a list of roads rather than a paragraph. */}
                      <span
                        aria-hidden="true"
                        className="shrink-0"
                        style={{ color: "var(--color-glow-ink)" }}
                      >
                        ·
                      </span>
                      <span className="line-clamp-1" style={{ color: T.ink }}>
                        {b.label}
                      </span>
                    </p>
                    {b.outcome && (
                      <p
                        className="ml-3.5 line-clamp-1 text-[12px] leading-snug"
                        style={{ color: TONE[b.outcome.tone].colour }}
                      >
                        {b.outcome.headline}
                      </p>
                    )}
                  </div>
                ))}
                {rest > 0 && (
                  <p className="ml-3.5 text-[12px]" style={{ color: T.inkSoft }}>
                    +{rest} {DEBRIEF_LABEL.more}
                  </p>
                )}
              </div>,
            ];
          })}
        </div>
      )}

      {/* ── recognition, and the way out ── */}
      <footer className="relative mt-5 flex items-center justify-between gap-8">
        <div data-region="recognition" className="flex min-w-0 flex-wrap items-center gap-2">
          {badges.length > 0 && (
            <span className="text-[12px] font-semibold" style={{ color: T.inkSoft }}>
              {DEBRIEF_LABEL.recognition}
            </span>
          )}
          {badges.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold"
              style={{
                color: T.reward,
                background: `color-mix(in oklab, ${T.reward} 16%, transparent)`,
                borderColor: `color-mix(in oklab, ${T.reward} 42%, transparent)`,
              }}
            >
              <Icon name="trophy" size={14} />
              {BADGE_META[id].label}
            </span>
          ))}
        </div>

        <button type="button" className="btn-game shrink-0" data-variant="glow" onClick={onExit}>
          {DEBRIEF_LABEL.exit}
        </button>
      </footer>
    </section>
  );
}
