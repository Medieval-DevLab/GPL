/**
 * Apply / rebuttal — the beat where stored knowledge is the currency.
 *
 * `docs/SCREEN-SPECS.md` §4.3 and `docs/GAME-SEQUENCE.md` §3. Two instances per run: m9a,
 * where procurement asks for a reason to prefer you, and the chapter-five handover, where
 * the delivery lead reads your own commitments back at you. The mission arrives as a prop
 * and neither instance is special-cased here.
 *
 * ── the design point, and the whole reason the screen exists ────────────────────────────
 *
 * **The mechanic already exists and every other screen hides it.** m9a's options carry
 * `requires`, so the game is already deciding what the player may say from what they found
 * out — and `availableOptions` simply drops the ones they did not earn. Four cards become
 * three, which reads as "there were fewer choices on this beat" rather than as the
 * consequence of a decision taken two chapters ago.
 *
 * So this screen renders the locked options too, in their own place in the row: named,
 * dimmed, inert, and carrying the beat where they could have been earned. Seeing the
 * argument you could have made is the lesson, and it needs no new content.
 *
 * Two rules follow, and neither is negotiable:
 *
 *  · **A locked card states what it was AND where it was available.** A lock with no name
 *    is a mystery rather than a goal, and that is the difference between teaching and
 *    punishing.
 *  · **Nothing here predicts.** A card says what you would say and what it rests on. It
 *    never says how it will go — which is G3, and is exactly the line the mockups' own
 *    "Higher win probability" chip crosses.
 *
 * ── the mode grammar (`SCREEN-SPECS.md` §3) ────────────────────────────────────────────
 *
 * DECIDE, and only that — **mount it on the `decide` phase**. The reading half of the beat
 * stays `BriefBody`'s, exactly as it is on the console: the situation is read once, with
 * room, and then the screen narrows to a question. This one opens with the demand instead
 * of a heading because on an apply beat the question is somebody else's.
 *
 * It changes state, so it carries the stake element: `StakeMark` beside the question.
 *
 * ── what is NOT here ───────────────────────────────────────────────────────────────────
 *
 * No game rules. `availableOptions` decides what is playable and `mission.options` is the
 * full set; the difference is what renders locked. This file reads `requires` to *explain*
 * a lock and never evaluates a consequence. No facsimile and no photograph either: the
 * artefact on this beat is the demand at the top, and 124px of drawing per card would cost
 * the locked cards the lines they need in order to say where they were.
 */

import {
  availableOptions,
  resolveAdvisorLine,
  resolveSaidQuote,
  resolveSituation,
} from "../engine/engine";
import {
  DIMENSIONS,
  DIMENSION_META,
  type ChoiceMission,
  type Condition,
  type DimensionId,
  type GameState,
  type Mission,
  type Option,
} from "../engine/types";
import { Icon, Pill } from "./icons";
import { CardButton, StakeMark } from "./mission";
import {
  BEAT_TITLE_ID,
  Monogram,
  RadioGroup,
  UI_LABEL,
  quoted,
  radioTabIndex,
  useTabletBand,
} from "./shell";

/**
 * The four fallback `where` clauses, and the only strings on this screen that did NOT go
 * to `UI_LABEL` with the rest of the block that used to live here.
 *
 * They are not chrome. They are stand-ins for the `where` half of an `EARNED` entry — the
 * beat at which something was for the taking — used when no entry has been authored for a
 * flag yet. That makes them the same kind of thing as the table below, which is authoring
 * bound for `story.ts`, and they should travel with it rather than sit in the interface's
 * vocabulary pretending to be a button label.
 */
const FALLBACK = {
  somethingAsked: "Something you could have asked about",
  somethingCarried: "Something the proposal could have carried",
  somethingPromised: "Something you could have promised",
  somethingEarlier: "Something earlier in the pursuit",
} as const;

/* ────────────────── what a flag was, in the language of the work ──────────────────
   MUST MOVE TO CONTENT. This is authoring, not engineering: it is the human name of a
   thing the player could have found out, and the beat where it was for the taking.

   It lives here only because `story.ts` has no field for it yet. The shape content wants
   is one entry per flag — `{ as, where }` — keyed exactly as below, so moving it is a copy
   and a change of lookup and nothing else.

   `where` is spelled as the chapter plus the left rail's own step name, deliberately. The
   player has read those words in the rail on every beat of that chapter, so "Chapter 1 ·
   Learn what matters" points at a memory rather than at a mission id.                   */
const EARNED: Record<string, { as: string; where: string }> = {
  /* chapter 0 — the starting advantage */
  "start:connector": { as: "A warm introduction", where: "Chapter 0 · Your team's strength" },
  "start:builder": { as: "Comparable work already delivered", where: "Chapter 0 · Your team's strength" },
  "start:challenger": { as: "A challenger's licence to reframe", where: "Chapter 0 · Your team's strength" },

  /* chapter 1 — find the right client */
  "client:northwind": { as: "A smaller client you can reach", where: "Chapter 1 · Choose a client" },
  late_start: { as: "A late start on a live pursuit", where: "Chapter 1 · Choose a client" },
  spent_effort: { as: "Pursuit effort already spent", where: "Chapter 1 · Choose a client" },
  "knows:real_pain": { as: "Their complaint data", where: "Chapter 1 · Learn what matters" },
  "knows:ops_constraint": { as: "Who owns the systems", where: "Chapter 1 · Learn what matters" },
  "knows:rivals": { as: "Who else is bidding", where: "Chapter 1 · Learn what matters" },
  "knows:budget": { as: "The budget and the deadline", where: "Chapter 1 · Learn what matters" },
  "knows:history": { as: "The programme they cancelled", where: "Chapter 1 · Learn what matters" },
  credibility: { as: "Proof you have done this before", where: "Chapter 1 · Get in the room" },
  learned_late: { as: "The constraint, found late", where: "Chapter 1 · Get in the room" },

  /* chapter 2 — make it an opportunity */
  has_access: { as: "Access to the people who decide", where: "Chapter 2 · Qualify the lead" },
  landed_small: { as: "A small piece of work landed", where: "Chapter 2 · Qualify the lead" },
  reframed: { as: "The problem, reframed", where: "Chapter 2 · Answer the market" },
  "knows:rival_gap": { as: "The gap in the rival's offer", where: "Chapter 2 · Answer the market" },
  ops_engaged: { as: "Operations in the room early", where: "Chapter 2 · Prioritise the work" },
  "has:data": { as: "Their data, checked", where: "Chapter 2 · Prioritise the work" },

  /* chapter 3 — build the response */
  evidenced: { as: "Their own evidence, in the room", where: "Chapter 3 · Define the problem" },
  "scope:postpurchase": { as: "A proposal about what happens after the sale", where: "Chapter 3 · Define the problem" },
  "scope:storefront": { as: "A proposal about the storefront", where: "Chapter 3 · Define the problem" },
  "scope:diagnostic": { as: "A short diagnostic first", where: "Chapter 3 · Define the problem" },
  outcome_based: { as: "A fee tied to the outcome", where: "Chapter 3 · Find another way" },
  reused_asset: { as: "An asset you already own", where: "Chapter 3 · Find another way" },
  conventional: { as: "A conventional shape of deal", where: "Chapter 3 · Find another way" },
  "has:partner": { as: "A partner alongside you", where: "Chapter 3 · Find another way" },
  ops_onside: { as: "Operations on side", where: "Chapter 3 · Assemble the offer" },
  "has:ops_workstream": { as: "An Operations workstream", where: "Chapter 3 · Assemble the offer" },
  "has:training": { as: "Training and adoption", where: "Chapter 3 · Assemble the offer" },
  "has:journey": { as: "The customer journey mapped", where: "Chapter 3 · Assemble the offer" },
  "promised:fast": { as: "An eight-week pilot", where: "Chapter 3 · Assemble the offer" },
  "scope:heavy": { as: "A heavy programme", where: "Chapter 3 · Assemble the offer" },
  unanchored: { as: "A proposal with no route to production", where: "Chapter 3 · Assemble the offer" },
  fragile_timeline: { as: "A timeline that assumes the data is usable", where: "Chapter 3 · Assemble the offer" },
  reviewed: { as: "A review that cleared it", where: "Chapter 3 · Clear the review" },
  overrode_review: { as: "A review you overrode", where: "Chapter 3 · Clear the review" },

  /* chapter 4 — make the deal work */
  descoped: { as: "Scope taken out to hold the price", where: "Chapter 4 · Handle the price" },
  discounted: { as: "A discount given", where: "Chapter 4 · Handle the price" },
  risk_accepted: { as: "A risk accepted in writing", where: "Chapter 4 · Face the risk review" },
  thin_mitigation: { as: "A thinner mitigation than the review asked for", where: "Chapter 4 · Face the risk review" },
  "knows:criteria": { as: "How the bid is being scored", where: "Chapter 4 · Win the decision" },
  won: { as: "The award", where: "Chapter 4 · Win the decision" },
  lost: { as: "A pursuit lost at the award", where: "Chapter 4 · Win the decision" },
  signed: { as: "A signed contract", where: "Chapter 4 · Take it or leave it" },
  walked_away: { as: "A deal you walked away from", where: "Chapter 4 · Take it or leave it" },

  /* chapter 5 — deliver the promise */
  changed_scope: { as: "Scope changed in delivery", where: "Chapter 5 · Month five" },
  crunched: { as: "A team asked to absorb it", where: "Chapter 5 · Month five" },
  undisclosed: { as: "Something the client was not told", where: "Chapter 5 · Month five" },
  broad_base: { as: "More than one person who knows the client", where: "Chapter 5 · The unexpected" },
};

/** "knows:rival_gap" → "Rival gap". Only reached when no label has been authored. */
function humanise(flag: string): string {
  const bare = (flag.includes(":") ? flag.slice(flag.indexOf(":") + 1) : flag).replace(/_/g, " ");
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

/**
 * The fallback `where`, by prefix, so an unlabelled flag is still pointed somewhere.
 *
 * Vague rather than wrong: a missing `EARNED` entry is a content gap, and inventing a
 * chapter for it would put a confident falsehood on the one card whose whole job is to be
 * trustworthy about where something was.
 */
function whereFallback(flag: string): string {
  if (flag.startsWith("knows:")) return FALLBACK.somethingAsked;
  if (flag.startsWith("has:") || flag.startsWith("scope:")) return FALLBACK.somethingCarried;
  if (flag.startsWith("promised:")) return FALLBACK.somethingPromised;
  return FALLBACK.somethingEarlier;
}

interface Gap {
  key: string;
  /** what it was */
  as: string;
  /** and where it was available */
  where: string;
}

const gapFor = (flag: string): Gap => ({
  key: flag,
  as: EARNED[flag]?.as ?? humanise(flag),
  where: EARNED[flag]?.where ?? whereFallback(flag),
});

interface Lock {
  /** which kind of requirement went unmet, in words */
  lead: string;
  gaps: Gap[];
  /** how many of them this card names in full — see `NAMED_GAPS` */
  show: number;
  /** what the unnamed remainder is called, given how many of them there are */
  moreWord: (n: number) => string;
}

/**
 * How many requirements a card names before it falls back to a count, and why it depends
 * on the clause.
 *
 * On an `all` clause every one of them was necessary, so naming two and counting the rest
 * is the least a card can honestly say. On an `any` clause **one would have done** — so
 * naming the nearest one in full, with where it was, says everything the player can act on,
 * and the others are a count of further ways in rather than a list of things they missed.
 *
 * It is also 45px of the 84px by which the sparse run overflowed at 1440x900, and it is the
 * only one of those savings that makes the card read better rather than merely shorter: four
 * stacked "thing / where it was" pairs at 12px in a 171px column is a paragraph, not a label.
 */
const NAMED_GAPS = 2;
const ANY_GAPS = 1;

/**
 * Why this option is not on the table, read off `requires`.
 *
 * It does NOT decide availability — `availableOptions` does that, in the engine, and this
 * is only ever called for an option that function has already left out. What it does is
 * compare the requirement against the flags the player holds, so the card can say which
 * clause it fell on, in the order a person would explain it: the things you had to have,
 * then the things any one of which would have done, then the thing that ruled it out, then
 * the position you needed.
 */
/* "+ 1 other ways in" was on screen at the handover. The alternatives clause is the only
   one that can legitimately show a remainder of one, because it names two of its options
   and most `any` gates have exactly three. */
const plainMore = () => UI_LABEL.more;
const anotherWayIn = (n: number) => (n === 1 ? UI_LABEL.otherWayIn : UI_LABEL.otherWaysIn);

function lockFor(
  requires: Condition | undefined,
  flags: string[],
  dims: Record<DimensionId, number>,
): Lock {
  const held = new Set(flags);

  const missing = (requires?.all ?? []).filter((f) => !held.has(f));
    if (missing.length) {
    return { lead: UI_LABEL.restsOn, gaps: missing.map(gapFor), show: NAMED_GAPS, moreWord: plainMore };
  }

  const any = requires?.any ?? [];
  if (any.length && !any.some((f) => held.has(f))) {
    return { lead: UI_LABEL.anyOneOf, gaps: any.map(gapFor), show: ANY_GAPS, moreWord: anotherWayIn };
  }

  const blocked = (requires?.none ?? []).filter((f) => held.has(f));
    if (blocked.length) {
    return { lead: UI_LABEL.ruledOutBy, gaps: blocked.map(gapFor), show: NAMED_GAPS, moreWord: plainMore };
  }

  /* A dimension gate. None exists in content today — m9a's own note in `story.ts` explains
     why the award gate stayed on flags — but `requires` allows one, and a lock this screen
     could not name would be exactly the mystery it was built to remove. */
  const short: Gap[] = [];
  for (const d of DIMENSIONS) {
    const label = DIMENSION_META[d].label;
    const min = requires?.min?.[d];
    if (min !== undefined && dims[d] < min) {
      short.push({
        key: `min-${d}`,
        as: `${label} ${UI_LABEL.atLeast} ${min}`,
        where: UI_LABEL.positionWhere,
      });
    }
    const max = requires?.max?.[d];
    if (max !== undefined && dims[d] > max) {
      short.push({
        key: `max-${d}`,
        as: `${label} ${UI_LABEL.atMost} ${max}`,
        where: UI_LABEL.positionWhere,
      });
    }
  }
  if (short.length) return { lead: UI_LABEL.needsPosition, gaps: short, show: NAMED_GAPS, moreWord: plainMore };

  return { lead: UI_LABEL.unexplained, gaps: [], show: NAMED_GAPS, moreWord: plainMore };
}

/** Which of an option's requirements the player actually holds — the live card's provenance. */
function heldFor(requires: Condition | undefined, flags: string[]): Gap[] {
  const held = new Set(flags);
  return [...(requires?.all ?? []), ...(requires?.any ?? [])]
    .filter((f) => held.has(f))
    .map(gapFor);
}

/* ───────────────────────────── the padlock ───────────────────────────── */

/**
 * Drawn here rather than added to `IconId`.
 *
 * `IconId` is content's vocabulary, in `engine/types.ts`, and a padlock is not something a
 * mission author ever picks — it is this screen's own report on state. The journey map
 * draws its own for the same reason; this is the same shape at a different size.
 */
function LockGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/* ───────────────────────────── the demand ───────────────────────────── */

interface Demand {
  speaker: string;
  role: string;
  text: string;
}

/**
 * Whoever is asking, and what they are asking for.
 *
 * Resolved the way the conversation surface resolves its live turn, because it is the same
 * question — who is the player answering? In a client room the client speaks last; in an
 * internal room your own colleague is in front of you. `ui/dialogue.tsx` keeps its version
 * private and this worker does not own that file, so the rule is restated rather than
 * imported. If a third screen ever needs it, it should move to `engine/engine.ts` beside
 * `resolveSaidQuote`, where the resolution properly belongs.
 */
function demandOf(mission: Mission, state: GameState): Demand | null {
  const said = resolveSaidQuote(mission, state);
  const advisor = mission.advisor;
  const line = resolveAdvisorLine(mission, state) ?? advisor?.quote;
  const colleague: Demand | null =
    advisor && line ? { speaker: advisor.name, role: advisor.role, text: line } : null;
  const client: Demand | null = said
    ? { speaker: said.speaker, role: said.role, text: said.text }
    : null;
  const room = mission.room ?? (client ? "client" : "internal");
  if (room === "internal") return colleague ?? client;
  return client ?? colleague;
}

/* ───────────────────────────── the cards ───────────────────────────── */

/**
 * Five rows on a subgrid: medallion, title, sentence, provenance, action.
 *
 * The subgrid is what makes a locked card and a live card comparable — their provenance
 * blocks and their action rows sit on the same two baselines, so the row reads as one
 * object with pieces missing rather than as two kinds of card that happen to be adjacent.
 * Without it a three-line "where it was" pushes one card's action row 40px below its
 * neighbours', which is the defect `ui/mission.tsx` documents on the comparison card.
 */
const CARD_ROWS = 5;

/** Five across is a 163px column, so the title takes the smaller step — as on m10. */
const NARROW_COLUMNS = 5;

const titleId = (id: string) => `apply-${id}-title`;
const bodyIds = (id: string) => `apply-${id}-say apply-${id}-rests`;

/** How much of the scenario stands beside the demand. See the call site. */
const SITUATION_LIMIT = 2;

/**
 * Column count. The whole set, locked included — a lock holds its place in the row.
 *
 * Same wrap as the comparison card below `lg`, and for the same reason — see `columns`
 * in `ui/mission.tsx`. It matters more here: this is the screen the handover is on, five
 * cards wide, and a locked card has to say what it was *and* where it was available, so
 * it is the tallest card in the game at the narrowest measure in the game.
 */
function columns(n: number): string {
  if (n <= 2) return "sm:grid-cols-2";
  if (n === 3) return "sm:grid-cols-2 md:grid-cols-3";
  if (n === 4) return "sm:grid-cols-2 lg:grid-cols-4";
  return "sm:grid-cols-3 lg:grid-cols-5";
}

function PlayableCard({
  option,
  selected,
  anySelected,
  index,
  narrow,
  gated,
  held,
  onToggle,
}: {
  option: Option;
  selected: boolean;
  anySelected: boolean;
  /** position among the PLAYABLE cards, so the roving tab stop is never an inert one */
  index: number;
  narrow: boolean;
  /** does this mission gate anything at all? If not, "needed nothing" says nothing */
  gated: boolean;
  held: Gap[];
  onToggle: () => void;
}) {
  return (
    <button
      className="choice grid gap-0 !p-0 text-left"
      style={{ gridRow: `span ${CARD_ROWS}`, gridTemplateRows: "subgrid" }}
      data-selected={selected}
      onClick={onToggle}
      role="radio"
      aria-checked={selected}
      tabIndex={radioTabIndex(selected, index, anySelected)}
      aria-labelledby={titleId(option.id)}
      aria-describedby={bodyIds(option.id)}
    >
      {/* 1 · the move's own pictogram, in the medallion the mockups put on every card */}
      <div className={`flex justify-center ${narrow ? "pt-1.5" : "pt-2.5"}`}>
        <span
          aria-hidden="true"
          /* 40px, not the comparison card's 60. That medallion overlaps a 124px
             facsimile and is sized against it; this card has no media band, so the disc
             is the first thing on the card and 60px of it is a poster's proportion on
             something that is not a poster. */
          className={`flex items-center justify-center rounded-full ${
            narrow ? "h-[36px] w-[36px]" : "h-[40px] w-[40px]"
          }`}
          style={{ background: "var(--color-accent-tint)", color: "var(--color-accent)" }}
        >
          <Icon name={option.icon ?? "flag"} size={narrow ? 19 : 21} />
        </span>
      </div>

      {/* 2 · what the move is — third person, and the only thing the mockups centre */}
      <p
        id={titleId(option.id)}
        className={`px-3.5 pt-2 text-center font-bold leading-snug ${
          narrow ? "text-[15px]" : "text-[18px]"
        }`}
        style={{ color: selected ? "var(--color-accent-deep)" : "var(--color-ink)" }}
      >
        {option.title}
      </p>

      {/* 3 · what you actually say. First person and in quotes, because on this beat an
             option IS a sentence addressed to the person at the top of the screen. */}
      <p
        id={`apply-${option.id}-say`}
        className="px-3.5 pt-2 text-[13px] leading-[1.45] text-(--color-ink-soft)"
      >
        {option.say ? quoted(option.say) : option.description}
      </p>

      {/* 4 · what it rests on — the point of the whole screen, on the cards that earned it.
             `justify-end`: the subgrid row is as tall as the tallest provenance block on the
             row, which is always a locked card's "and here is where it was". That leaves the
             live cards ~90px of slack, and it belongs ABOVE this block rather than between
             it and the button — the provenance and the marker are both the card's footer,
             and air between them would break the one group they form. */}
      <div
        id={`apply-${option.id}-rests`}
        className={`flex flex-col justify-end px-3.5 ${narrow ? "pt-2.5" : "pt-3"}`}
      >
        {held.length > 0 ? (
          <div className="border-t border-(--color-line) pt-2.5">
            <p className="flex items-center gap-1.5 text-[12px] font-bold text-(--color-text-strong)">
              <span className="shrink-0 text-(--color-good)">
                <Icon name="check" size={13} />
              </span>
              {UI_LABEL.fromYourFile}
            </p>
            <ul className="mt-1 space-y-0.5">
              {held.slice(0, NAMED_GAPS).map((g) => (
                <li key={g.key} className="text-[12px] leading-snug text-(--color-ink-soft)">
                  {g.as}
                </li>
              ))}
              {held.length > NAMED_GAPS && (
                <li className="text-[12px] leading-snug text-(--color-muted)">
                  + {held.length - NAMED_GAPS} {UI_LABEL.more}
                </li>
              )}
            </ul>
          </div>
        ) : (
          gated && (
            <p className="border-t border-(--color-line) pt-2.5 text-[12px] leading-snug text-(--color-muted)">
              {UI_LABEL.neededNothing}
            </p>
          )
        )}
      </div>

      {/* 5 · the card's own full-width marker, as on every other decide beat */}
      <div className={`self-end px-3.5 ${narrow ? "pb-2 pt-2" : "pb-3 pt-3"}`}>
        <CardButton selected={selected} on={UI_LABEL.chosen} off={UI_LABEL.sayThis} />
      </div>
    </button>
  );
}

/**
 * The argument you could have made.
 *
 * Three things about this card are requirements rather than styling:
 *
 *  · **It is dimmed, never faded.** `opacity` on text invalidates every ratio in
 *    `DESIGN-SYSTEM.md` and `engine/tokens.test.ts` fails the build on it, so the greying
 *    is `--color-surface-disabled` behind `--color-text-disabled` — 5.22:1, measured, and
 *    the same pair `.choice:disabled` already uses.
 *  · **It is reachable by keyboard.** `aria-disabled` rather than `disabled`, so the state
 *    is announced instead of the control vanishing, and `tabIndex={-1}` inside the radio
 *    group means the arrow keys still land on it while the group's single tab stop stays
 *    on something playable. The journey map's locked nodes do exactly this.
 *  · **It is not a `.choice`.** That class carries a hover state and a pointer cursor, and
 *    `tools/verify.mjs` selects `button.choice` to play the game with — an inert card
 *    answering that selector would have the harness clicking a dead object.
 */
function LockedCard({ option, lock, narrow }: { option: Option; lock: Lock; narrow: boolean }) {
  return (
    <button
      type="button"
      /* No `onClick`. A locked card is inert by construction rather than by a guard. */
      role="radio"
      aria-checked={false}
      aria-disabled={true}
      tabIndex={-1}
      aria-label={`${option.title} — ${UI_LABEL.lockedSpoken}`}
      aria-describedby={`apply-${option.id}-lock`}
      className="grid gap-0 overflow-hidden rounded-[12px] border text-left"
      style={{
        gridRow: `span ${CARD_ROWS}`,
        gridTemplateRows: "subgrid",
        background: "var(--color-surface-disabled)",
        borderColor: "var(--color-border-subtle)",
        cursor: "default",
      }}
    >
      {/* 1 · the padlock stands where the move's pictogram would be */}
      <div className={`flex justify-center ${narrow ? "pt-1.5" : "pt-2.5"}`}>
        <span
          aria-hidden="true"
          className={`flex items-center justify-center rounded-full ${
            narrow ? "h-[36px] w-[36px]" : "h-[40px] w-[40px]"
          }`}
          style={{ background: "var(--color-canvas-deep)", color: "var(--color-text-disabled)" }}
        >
          <LockGlyph size={narrow ? 17 : 19} />
        </span>
      </div>

      {/* 2 · NAMED. This is the whole difference between teaching and punishing. */}
      <p
        className={`px-3.5 pt-2 text-center font-bold leading-snug ${
          narrow ? "text-[15px]" : "text-[18px]"
        }`}
        style={{ color: "var(--color-text-disabled)" }}
      >
        {option.title}
      </p>

      {/* 3 · and the sentence itself, because seeing the argument IS the lesson */}
      <p
        className="px-3.5 pt-2 text-[13px] leading-[1.45]"
        style={{ color: "var(--color-text-disabled)" }}
      >
        {option.say ? quoted(option.say) : option.description}
      </p>

      {/* 4 · what it needed, and where that was for the taking */}
      <div id={`apply-${option.id}-lock`} className="flex flex-col justify-end px-3.5 pt-3">
        <div className="border-t pt-2.5" style={{ borderColor: "var(--color-border-subtle)" }}>
          <p
            className="text-[12px] font-bold leading-snug"
            style={{ color: "var(--color-text-disabled)" }}
          >
            {lock.lead}
          </p>
          <ul className={`mt-1 ${narrow ? "space-y-1" : "space-y-1.5"}`}>
            {lock.gaps.slice(0, lock.show).map((g) => (
              <li key={g.key} className="text-[12px] leading-snug">
                <span className="font-bold" style={{ color: "var(--color-text-disabled)" }}>
                  {g.as}
                </span>
                <span className="block" style={{ color: "var(--color-text-disabled)" }}>
                  {g.where}
                </span>
              </li>
            ))}
            {lock.gaps.length > lock.show && (
              <li
                className="text-[12px] leading-snug"
                style={{ color: "var(--color-text-disabled)" }}
              >
                + {lock.gaps.length - lock.show} {lock.moreWord(lock.gaps.length - lock.show)}
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* 5 · where a live card has its button. The same box, so the row cannot step. */}
      <div className={`self-end px-3.5 ${narrow ? "pb-2 pt-2" : "pb-3 pt-3"}`}>
        <span
          className="flex w-full items-center justify-center gap-1.5 border-t-2 py-2.5 text-[13px] font-bold"
          style={{ borderColor: "var(--color-text-disabled)", color: "var(--color-text-disabled)" }}
        >
          <LockGlyph size={14} />
          {UI_LABEL.notAvailable}
        </span>
      </div>
    </button>
  );
}

/* ───────────────────────────── the gate ───────────────────────────── */

/* ───────────────────────────── the screen ───────────────────────────── */

/**
 * Can this mission actually be staged as an apply beat?
 *
 * `presentation: "apply"` is the author's request; this is the renderer's answer, and it
 * mirrors `isDialogue` deliberately. The screen's whole subject is the option you did not
 * earn, so it needs options with `requires` on them. Asked to stage a beat with no gates,
 * the honest answer is the console: every card would be live and the padlock column would
 * be an empty promise of consequence.
 */
export function isApply(mission: Mission): mission is ChoiceMission {
  return (
    mission.presentation === "apply" &&
    mission.kind === "choice" &&
    mission.options.some((o) => o.requires)
  );
}

export function ApplyScreen({
  mission,
  state,
  onToggle,
}: {
  mission: Mission;
  state: GameState;
  onToggle: (id: string) => void;
}) {
  /* Not a choice mission: nothing to apply anything to. The caller routes this screen, so
     this is a guard rather than a branch — and the question band renders regardless, so
     the work area's `aria-labelledby` always resolves to something. */
  const options = mission.kind === "choice" ? mission.options : [];
  const playable = new Set(availableOptions(mission, state).map((o) => o.id));
  const gated = options.some((o) => o.requires);
  const chosen = state.selection[0];
  const anySelected = options.some((o) => o.id === chosen && playable.has(o.id));
  /* Narrow by measure, not by count — the tablet band never gives this row a column
     wider than 250px. See the same line in `ChoiceList`. `tablet` is kept separately
     because the question band's layout depends on the BAND and not on the card: five
     options at 1440 are narrow cards in a band that still has room beside the heading. */
  const tablet = useTabletBand();
  const narrow = tablet || options.length >= NARROW_COLUMNS;
  const demand = demandOf(mission, state);
  const situation = resolveSituation(mission, state);
  const question = mission.kind === "choice" ? mission.question : mission.title;

  /* Index among the PLAYABLE cards only. The roving tab stop has to land on something the
     player can act on, and `options.indexOf` would put it on a padlock whenever the first
     option in content order is the one they did not earn. */
  let playableIndex = -1;

  return (
    <div key={mission.id} className="flex min-h-full flex-col">
      {/* ── the demand ───────────────────────────────────────────────────────────────
          Whoever is asking, first and largest, because everything below it is an answer
          to this sentence. The situation sits beside it rather than under it: those two
          lines are the state-aware half of the beat — on m9a they change depending on
          whether the player's submission names the systems that have to change — and
          stacking them would cost the card row 36px it does not have. */}
      {demand && (
        <section
          data-region="demand"
          className="m-swap flex items-start gap-5 border-b border-(--color-line) bg-(--color-surface) px-5 py-2 lg:py-2.5"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Monogram name={demand.speaker} size={26} />
              <span className="min-w-0 text-[13px] font-bold leading-tight text-(--color-ink)">
                {demand.speaker}
                <span className="ml-2 font-medium text-(--color-muted)">{demand.role}</span>
              </span>
            </div>
            {/* 16px below `lg`. The demand is the largest thing on the screen and stays
                the largest thing on the screen — the heading under it is 24px there and
                24px here — but at 18px in a 560px band it runs to three lines on the
                handover, and the three lines are paid for out of a card row that is
                already the tightest in the game. */}
            <blockquote className="mt-2 border-l-[3px] border-(--color-accent) pl-3 text-[18px] italic leading-[1.4] text-(--color-ink) text-pretty lg:text-[18px]">
              {quoted(demand.text)}
            </blockquote>
          </div>

          {situation.length > 0 && (
            <div className="hidden w-[248px] shrink-0 border-l border-(--color-line) pl-4 lg:block">
              {/* Two paragraphs, for the same reason `ui/dialogue.tsx` caps its thread
                  history at three: no authored beat has more, and a five-paragraph variant
                  would push this band past the row's budget rather than being read. */}
              {situation.slice(0, SITUATION_LIMIT).map((p, i) => (
                <p
                  key={i}
                  className={`text-[13px] leading-snug text-(--color-muted) ${i > 0 ? "mt-1.5" : ""}`}
                >
                  {p}
                </p>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── the question, and the count that makes the row legible ─────────────────── */}
      <div
        data-region="question"
        className="flex items-start gap-5 border-b border-(--color-line) bg-(--color-surface) px-5 py-2"
      >
        <div className="min-w-0 flex-1">
          <h1
            id={BEAT_TITLE_ID}
            className="text-[24px] font-bold leading-[1.15] tracking-[-0.02em] text-(--color-ink)"
          >
            {question}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {mission.prompt && <p className="text-[13px] text-(--color-muted)">{mission.prompt}</p>}
            {/**
             * Only where two or more cards are actually shut, and that threshold is the
             * point rather than tidiness.
             *
             * It used to be `gated` — whether the BEAT gates anything — which drew
             * "4 of 4" on a run where nothing was locked: a statistic about nothing. But
             * at one lock it is no better, because the padlock beside the card already
             * says everything the fraction says, and what the fraction adds is a mark out
             * of five, sitting above the locks, one beat before an ending that deletes
             * its score on purpose. At two or three locks the count is doing real work —
             * it tells you the row is mostly shut before you read four cards to find out.
             */}
            {options.length - playable.size >= 2 && (
              <Pill tone="accent">
                {playable.size} {UI_LABEL.of} {options.length} {UI_LABEL.onTheTable}
              </Pill>
            )}
            {/* In the tablet band it drops onto this line, for the reason given on
                `stakeBelow` in `ui/mission.tsx`: beside a 24px heading in a 560px band it
                costs the heading a second line, and this row had the space. One of these
                in the DOM, never two. */}
            {tablet && <StakeMark />}
          </div>
        </div>
        {/* The work-area half of the stake element, beside the question, exactly as the
            console decide beat has it. The gate below is the interactive half. */}
        {!tablet && <StakeMark />}
      </div>

      {/* ── what you can put on the table, and what you cannot ────────────────────── */}
      <div data-region="options" data-decision className="flex-1 px-5 py-2 lg:py-4">
        <RadioGroup
          label={question}
          className={`m-deal grid items-stretch gap-3 ${columns(options.length)}`}
          style={{ gridTemplateRows: `repeat(${CARD_ROWS}, auto)` }}
        >
          {options.map((o) => {
            if (!playable.has(o.id)) {
              return (
                <LockedCard
                  key={o.id}
                  option={o}
                  lock={lockFor(o.requires, state.flags, state.dims)}
                  narrow={narrow}
                />
              );
            }
            playableIndex += 1;
            return (
              <PlayableCard
                key={o.id}
                option={o}
                selected={chosen === o.id}
                anySelected={anySelected}
                index={playableIndex}
                narrow={narrow}
                gated={gated}
                held={heldFor(o.requires, state.flags)}
                onToggle={() => onToggle(o.id)}
              />
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
}
