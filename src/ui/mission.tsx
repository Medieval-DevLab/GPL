/**
 * The mission briefing — the core gameplay surface.
 *
 * Options are laid out as **side-by-side columns**, not stacked rows. Their checklists
 * line up, so the player compares across in one eye movement instead of reading four
 * bands top to bottom. That is the difference between a hand of cards and a radio list,
 * and it is `docs/UI-AUDIT.md` finding F2.
 *
 * Everything here is sized to fit the console without scrolling. Be careful adding
 * vertical space — `tools/verify.mjs` fails if the working area overflows at 1440×900.
 */

import { story } from "../content/story";
import {
  availableOptions,
  requiredSelectionCount,
  resolveSaidQuote,
  resolveSituation,
} from "../engine/engine";
import type {
  AssessmentFactor,
  ClientProfile,
  GameState,
  Mission,
  Option,
  SaidQuote,
} from "../engine/types";
import { Facsimile } from "./facsimile";
import { Bullet, Icon, IconTile, Pill, SectionTitle } from "./icons";
import {
  BEAT_TITLE_ID,
  Hidden,
  Monogram,
  RadioGroup,
  UI_LABEL,
  artUrl,
  discoveredEvidence,
  quoted,
  radioTabIndex,
} from "./shell";

/* ───────────────────────── header ───────────────────────── */

function Header({
  mission,
  situation,
  said,
}: {
  mission: Mission;
  situation: string[];
  /* Resolved by the engine, not read off the mission: which client voice speaks here
     depends on what the player has found out. See `resolveSaidQuote`. */
  said?: SaidQuote;
}) {
  return (
    <div className="flex items-stretch gap-5">
      {/**
       * Proximity, corrected. The eyebrow belonged to the title and was further from it
       * than the title was from the body it heads: measured ink gaps of 10.6px and 13.6px,
       * a ratio of 1.28:1 where grouping needs at least 2:1, so the three lines read as
       * three things rather than as a label, its heading and its paragraph.
       *
       * 4px and 14px of margin, which lands as ~8.6px and ~19.6px of ink gap — the line
       * boxes contribute the rest, and that is why the margins do not look like the
       * numbers. Ratio 2.3:1. Held to +2px of total height, because the brief already
       * fills the working area to the pixel at 1440×900.
       */}
      <div className="min-w-0 flex-1 px-5 pt-3">
        <p className="eyebrow" style={{ color: "var(--color-accent)" }}>
          {mission.eyebrow}
        </p>
        <h1
          id={BEAT_TITLE_ID}
          className="mt-1 text-[32px] font-bold leading-[1.1] tracking-[-0.015em] text-(--color-ink)"
        >
          {mission.title}
        </h1>
        <div className="mt-3.5 space-y-1">
          {situation.map((p, i) => (
            <p key={i} className="text-[15px] leading-[1.5] text-(--color-ink-soft)">
              {p}
            </p>
          ))}
        </div>
      </div>

      {said && (
        <div className="hidden w-[186px] shrink-0 py-4 pr-5 lg:block">
          <blockquote className="border-l-[3px] border-(--color-accent) pl-3 text-[13px] italic leading-snug text-(--color-ink-soft) text-pretty">
            {quoted(said.text)}
          </blockquote>
          {/**
           * The client side gets a face, and it is deliberately not a photograph.
           *
           * Four colleagues have portraits because they brief the player directly. The
           * three client voices had nothing — which read as a hierarchy where the people
           * whose money and systems are at stake matter less than the people advising on
           * them. The obvious fix was a fifth stock portrait for the sponsor; the reason
           * not to is that upscaled stock photography was already 9.2% of the pixels in
           * this game and is the measured cause of "it looks like a PPT".
           *
           * So: the monogram device the client card already uses, drawn from the name in
           * content. `aria-hidden`, because the name it abbreviates is the next element.
           *
           * It lives in `ui/shell.tsx` now, because the call surface needs the same device
           * for the same three people — see `Monogram` there, and `ui/dialogue.tsx` for
           * the reason a camera-off tile makes it authentic rather than a substitute.
           */}
          <div className="mt-2.5 flex items-start gap-2 pl-3">
            <span className="mt-px">
              <Monogram name={said.speaker} size={24} />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-bold leading-tight text-(--color-ink)">
                {said.speaker}
              </span>
              <span className="block text-[12px] leading-tight text-(--color-text-muted)">
                {said.role}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Bleeds to the top-right corner, as in every mockup. */}
      {mission.hero && (
        <img
          src={artUrl(mission.hero)}
          alt=""
          loading="eager"
          decoding="async"
          className={`hidden h-[212px] shrink-0 object-cover md:block ${said ? "w-[30%]" : "w-[40%]"}`}
          style={{
            maskImage: "linear-gradient(to right, transparent, #000 22%)",
            WebkitMaskImage: "linear-gradient(to right, transparent, #000 22%)",
          }}
        />
      )}
    </div>
  );
}

/* ───────────────────────── situation panels ───────────────────────── */

/**
 * When an assessment is also on screen it already characterises the situation, so the
 * client's one-line blurb is redundant — and dropping it is what lets mission 4, the
 * densest briefing in the game, fit one screen.
 */
function ClientStrip({ client, compact }: { client: ClientProfile; compact?: boolean }) {
  return (
    <section className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-(--color-line) px-5 py-2">
      {client.image ? (
        <img
          src={artUrl(client.image)}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-[74px] w-[150px] shrink-0 rounded-[10px] object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[11px] text-[13px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
          }}
        >
          {client.monogram}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2 className="text-[15px] font-bold leading-tight text-(--color-ink)">{client.name}</h2>
          {client.tags.map((t) => (
            <Pill key={t} tone="accent">
              {t}
            </Pill>
          ))}
        </div>
        {!compact && (
          <p className="mt-1 text-[13px] leading-snug text-(--color-muted)">{client.blurb}</p>
        )}
      </div>

      <dl className="flex shrink-0 flex-wrap gap-x-6 gap-y-2 border-(--color-line) lg:border-l lg:pl-6">
        {client.facts.map((f) => (
          <div key={f.label} className="flex items-center gap-2">
            <span className="shrink-0 text-(--color-accent)">
              <Icon name={f.icon} size={16} />
            </span>
            <div>
              <dt className="text-[12px] font-semibold text-(--color-muted)">{f.label}</dt>
              <dd className="text-[13px] font-bold leading-tight text-(--color-ink)">{f.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Level → a chip and a matching bar, and each factor carries its own icon colour.
 * Polychrome icons are a large part of what makes the mockups read as rich (F4).
 */
const LEVEL: Record<AssessmentFactor["level"], { pct: number; word: string }> = {
  low: { pct: 26, word: "Low" },
  medium: { pct: 54, word: "Medium" },
  high: { pct: 80, word: "High" },
  strong: { pct: 96, word: "Strong" },
};

function Assessment({ factors }: { factors: AssessmentFactor[] }) {
  return (
    <section className="border-t border-(--color-line) px-5 py-2">
      <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">
        {factors.map((f) => {
          const l = LEVEL[f.level];
          const iconTone = f.tone;
          return (
            <div key={f.label} className="card px-3 py-1.5">
              <div className="flex items-center gap-2">
                <IconTile name={f.icon} tone={iconTone} size={30} />
                <span className="min-w-0 flex-1 text-[13px] font-bold leading-tight text-(--color-ink)">
                  {f.label}
                </span>
              </div>
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: "var(--color-canvas-deep)" }}
              >
                <div
                  className="h-full rounded-full bg-(--color-border-strong) transition-[width] duration-700 ease-out"
                  style={{ width: `${l.pct}%` }}
                />
              </div>
              <p className="mt-1 text-[15px] font-bold leading-none text-(--color-text-strong)">
                {l.word}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-(--color-muted)">{f.note}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Only the concerns. The client's own words are in the header pull-quote, where every
 * mockup puts them — rendering both was the same quote twice on one screen.
 */
function Concerns({ concerns }: { concerns?: string[] }) {
  if (!concerns?.length) return null;
  return (
    <section className="border-t border-(--color-line) px-5 py-2">
      <div
        className="rounded-xl px-4 py-2"
        style={{ background: "var(--color-bad-tint)" }}
      >
        <SectionTitle icon="warning" tone="bad" className="mb-1.5">
          Key concerns
        </SectionTitle>
        <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {concerns.map((c) => (
            <li key={c} className="flex gap-2 text-[13px] leading-snug text-(--color-ink-soft)">
              <Bullet className="mt-[7px]" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────────────────────────── cost rows ───────────────────────────── */

/**
 * Magnitude, in text as well as in dots.
 *
 * The ●●○ row is `aria-hidden`, and the `aria-label` that used to sit on this `<div>`
 * was inert: an `aria-label` on an element with no role is not exposed as content, so
 * the cost of an option — the only number on the card — produced nothing at all when
 * read. It survived only inside the button's concatenated name, which is exactly the
 * 240-character run this card is being taken apart to fix.
 */
function CostRow({ label, value }: { label: string; value: number }) {
  /**
   * TWO defects, one row.
   *
   * The icons are gone. `coins` labelled "Investment" here while also being
   * Profitability's pictogram in the rail eight inches away — the same drawing standing
   * for "what this costs you" and for "is it worth winning?", on one screen. `clock`
   * had the same problem with the rail's "About 12 min". Neither icon was carrying
   * anything the word beside it did not already say, so the cheapest fix is also the
   * right one: the label is words, the magnitude is dots, and the three dimension
   * pictograms go back to meaning exactly one thing each.
   *
   * And the size is declared on the ROW. Without it the visually-hidden magnitude below
   * inherited from `.choice`, which sets no font size, so it computed at the browser
   * default of 16px — an off-scale sixth type size on every decide screen in the game,
   * invisible on screen and counted by `tools/measure.mjs`, which is exactly the kind of
   * thing that makes an instrument look wrong when it is not.
   */
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="flex-1 font-medium text-(--color-muted)">{label}</span>
      <Hidden>
        {value} {UI_LABEL.outOf} 3.
      </Hidden>
      {/* Spent dots are FILLED, unspent ones are RINGS.
          Two fills of two greys said "low" and "high" with colour alone, which is exactly
          what 1.4.1 forbids and what a 6px mark can least afford; filled-versus-hollow is
          the pip idiom every dice face uses and it survives greyscale, low vision and a
          projector. It also takes a colour off the screen: `border-control` was one of the
          six distinct fills on a decide screen against a five-fill budget, spent entirely
          on three 6px circles. */}
      <span aria-hidden="true" className="flex gap-[3px]">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className="h-[6px] w-[6px] rounded-full border"
            style={
              n <= value
                ? { background: "var(--color-accent)", borderColor: "var(--color-accent)" }
                : { borderColor: "var(--color-border-control)" }
            }
          />
        ))}
      </span>
    </div>
  );
}

/* ───────────────────────────── option cards ───────────────────────────── */

/**
 * An option, as a vertical poster: media, medallion, title, blurb, checklist, cost, button.
 *
 * Laid out on a CSS **subgrid** so that every card's checklist, cost panel and button sit
 * on the same baseline as its neighbours' regardless of how many lines the title or
 * description takes. Without that, comparing across columns — the entire reason options
 * are columns (UI-AUDIT F2) — silently stops working: one two-line title pushed the
 * checklists 36px out of step.
 */
const CARD_ROWS = 6;

/**
 * The card's accessible name is its title, and nothing else.
 *
 * Name-from-content concatenated the whole poster: 170–240 characters, re-spoken in full
 * every time focus returned to the card, with no terminal punctuation anywhere, so it
 * arrived as one unbroken run — "Apex Industrial The biggest number on the table… Resource
 * cost Time: 3 of 3 Investment: 3 of 3 Select this option". A name is for telling this
 * control apart from its three neighbours. Everything else is a description, which a
 * screen reader can be told to skip and will not repeat on every revisit.
 */
const titleId = (id: string) => `opt-${id}-title`;
const bodyIds = (id: string) => `opt-${id}-desc opt-${id}-trade opt-${id}-cost`;

/**
 * FIVE COLUMNS IS A DIFFERENT CARD, and it has to be.
 *
 * At four options a card is 205px wide; at five it is **163px**, and the poster was
 * authored for the wider one. Measured on m10 ("Month five"), which content made a
 * five-option beat so that "price the change" could exist as an answer: the card needed
 * 620px of a 568px row and the primary label was **clipped mid-word** — "Select this /
 * option" with the second line cut off by the console's bottom edge. That is not a fit
 * failure, it is an unreadable control on the object the whole screen exists for.
 *
 * Three things change, and none of them is a smaller type step chosen to win pixels:
 *
 *  · **The body drops 15px → 13px.** DESIGN-SYSTEM.md assigns 15px to "the situation —
 *    the one thing they must read" at a **≤66ch** measure, and 13px to "card body" at
 *    ≤46ch. A 163px column is **22ch**. 15px there is not the specified size being
 *    shaved, it is the wrong step being used: below Bringhurst's 45ch floor and a third
 *    of the measure the step was chosen for. 13px is what the spec already says to use.
 *  · **The medallion goes 60px → 48px.** A 60px disc is 37% of a 163px card's width; the
 *    smaller one is the same proportion of the narrower card that 60px was of the wide one.
 *  · **"Select this option" becomes "Select".** Three words do not fit on one 163px line
 *    and the second was the one being clipped.
 *
 * Together: 620px → 560px, inside the row, nothing clipped. The 18px title, the checklist,
 * the cost rows and every word of content are untouched, and at three or four options the
 * card is exactly what it was.
 */
const NARROW_COLUMNS = 5;

function OptionCard({
  option,
  selected,
  anySelected,
  index,
  narrow,
  onToggle,
}: {
  option: Option;
  selected: boolean;
  /** roving tabindex: the group is one tab stop, not four */
  anySelected: boolean;
  index: number;
  /** five columns or more, so the card is 163px rather than 205px */
  narrow: boolean;
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
      {/* 1 · media + medallion
          A drawn artefact where there is one, a photograph only as a fallback. The cards
          carried 21 mockup crops, every one upscaled about ×1.43 into this frame and
          losing ~45% of its detail energy, together taking 9.2% of the screen — and a
          132px photograph of a generic office cannot carry a fact. Behind a heading it is
          also, exactly, the visual grammar of a slide deck. The facsimile carries the
          option's own point instead: the complaint volumes, the scorecard, the man who
          can stop you. See `src/ui/facsimile.tsx`.

          124px, not 132. The decide screen for m6 overflowed the working area by exactly
          7px on all three paths — structural, not content. The facsimile has no
          `preserveAspectRatio`, so the SVG default letterboxes it: a 320x96 canvas fitted
          to a 258px-wide card draws 77px tall and centres it, leaving ~27px of EMPTY
          panel above and below. Trimming 8px takes it from the letterbox and never
          touches the drawing, which is why this is not the usual shaving. */}
      <div className="relative">
        {option.facsimile ? (
          <Facsimile kind={option.facsimile} className="h-[124px] w-full" />
        ) : (
          option.image && (
            <img
              src={artUrl(option.image)}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-[124px] w-full object-cover"
            />
          )
        )}
        <div
          className={`flex justify-center px-3 ${
            option.facsimile || option.image ? (narrow ? "-mt-7" : "-mt-8") : narrow ? "pt-3" : "pt-4"
          }`}
        >
          <span
            aria-hidden="true"
            className={`flex items-center justify-center rounded-full border-[3px] border-(--color-surface) ${
              narrow ? "h-[48px] w-[48px]" : "h-[60px] w-[60px]"
            }`}
            style={{ background: "var(--color-accent-tint)", color: "var(--color-accent)" }}
          >
            {/* `flag` is the fallback, not `target`. An option with no authored icon was
                being drawn with Winability's pictogram, on the same screen as the
                Winability meter — the interface labelling an approach with the name of a
                dimension. `flag` means "the position you would take", which is the same
                thing "Where you stand" means, so it adds no fifth meaning to the set.
                Twelve options DO author a reserved pictogram; those are content, listed in
                the report. */}
            <Icon name={option.icon ?? "flag"} size={narrow ? 23 : 28} />
          </span>
        </div>
      </div>

      {/* 2 · title — the only thing the mockups centre */}
      <p
        id={titleId(option.id)}
        className="px-4 pt-2.5 text-center text-[18px] font-bold leading-snug"
        style={{ color: selected ? "var(--color-accent-deep)" : "var(--color-ink)" }}
      >
        {option.title}
      </p>

      {/* 3 · what it is */}
      <p
        id={`opt-${option.id}-desc`}
        className={`px-4 pt-2 leading-snug text-(--color-muted) ${narrow ? "text-[13px]" : "text-[15px]"}`}
      >
        {option.description}
      </p>

      {/* 4 · what it trades.
          Polarity was carried by a tick and a red cross, and the cross is `aria-hidden`,
          so a pro and a con read identically: "Budget looks real", "Two rivals ahead of
          you". Colour and shape alone (1.4.1), and here not even that. */}
      <div id={`opt-${option.id}-trade`} className="px-4 pt-3">
        {(option.pros?.length || option.cons?.length) && (
          <ul className="space-y-1.5 border-t border-(--color-line) pt-3">
            {option.pros?.map((t) => (
              <li key={t} className="flex items-start gap-2 text-[13px] leading-snug">
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
            {option.cons?.map((t) => (
              <li key={t} className="flex items-start gap-2 text-[13px] leading-snug">
                <span
                  aria-hidden="true"
                  className="mt-[2px] flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full text-white"
                  style={{ background: "var(--color-bad)" }}
                >
                  <Icon name="cross" size={9} />
                </span>
                <span className="text-(--color-muted)">
                  <Hidden>{UI_LABEL.down} </Hidden>
                  {t}
                  <Hidden>.</Hidden>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 5 · what it costs — never what it returns */}
      <div id={`opt-${option.id}-cost`} className="px-4 pt-3">
        {option.cost && (
          <div className="space-y-1.5 border-t border-(--color-line) pt-3">
            <p className="text-[13px] font-bold text-(--color-ink-soft)">Resource cost</p>
            <CostRow label="Time" value={option.cost.time} />
            <CostRow label="Investment" value={option.cost.investment} />
          </div>
        )}
      </div>

      {/* 6 · the card's own marker carries the selected state.
             "Select this option" is three words and needs two lines in a 163px column —
             and the second line was the one being clipped by the console's bottom edge on
             the five-option beat. One word fits, and the card it sits in is the object it
             refers to, so "this option" was doing nothing the position did not. */}
      <div className={`self-end px-4 ${narrow ? "pb-3 pt-3" : "pb-4 pt-4"}`}>
        <CardButton
          selected={selected}
          on="Selected"
          off={narrow ? UI_LABEL.selectShort : UI_LABEL.select}
        />
      </div>
    </button>
  );
}

/**
 * Unselected: an outlined button. Selected: a rule and a tick.
 *
 * These used to be the same object. A selected card said "Selected →" in white on a solid
 * `--color-accent` pill, and the action bar said "Commit to this →" in white on a solid
 * `--color-accent` pill — same fill, same weight, same radius family, same arrow,
 * measured 120px apart. Two states of the world that could not be more different —
 * *already done* and *do the next thing* — were drawn as one object, and the hierarchy
 * rule the palette is built on allows exactly one saturated fill per screen anyway
 * (DESIGN-SYSTEM.md §hierarchy 6). The player's eye had two primaries and no primary.
 *
 * So the card's marker stops being a button. Selecting is finished: what is left is a
 * statement, and a statement is a rule with a tick on it. The arrow goes with the fill —
 * an arrow means "and then this happens", which is now true in exactly one place.
 *
 * Height is held constant across both states on purpose. The cards sit in a `subgrid`
 * row whose whole purpose is that every card's parts line up with its neighbours', so a
 * marker shorter than the button it replaces would move the row it is in.
 */
export function CardButton({
  selected,
  on,
  off,
}: {
  selected: boolean;
  on: string;
  off: string;
}) {
  if (selected) {
    /* 2px rule + 10 + 10 is the same 22px of box as 1px border + 10 + 10, so the two
       states are the same height to the pixel and the subgrid row cannot move. */
    return (
      <span
        className="flex w-full items-center justify-center gap-1.5 border-t-2 py-2.5 text-[13px] font-bold"
        style={{ borderColor: "var(--color-text-strong)", color: "var(--color-text-strong)" }}
      >
        <Icon name="check" size={14} />
        {on}
      </span>
    );
  }
  return (
    <span
      className="flex w-full items-center justify-center gap-2 rounded-[10px] border px-3 py-2.5 text-[13px] font-bold transition-colors"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-line-strong)",
        color: "var(--color-accent)",
      }}
    >
      {off}
      {/* The brief has an arrow on the card button. It stays on the unselected state,
          which is the one that still leads somewhere. */}
      <span aria-hidden="true">→</span>
    </span>
  );
}

/** Column count. Four options at ~205px each is the mockups' own arrangement. */
function columns(n: number): string {
  if (n <= 2) return "sm:grid-cols-2";
  if (n === 3) return "sm:grid-cols-2 lg:grid-cols-3";
  if (n === 4) return "sm:grid-cols-2 lg:grid-cols-4";
  if (n === 5) return "sm:grid-cols-3 lg:grid-cols-5";
  return "sm:grid-cols-3";
}

function ChoiceList({
  mission,
  state,
  onToggle,
}: {
  mission: Mission & { kind: "choice" };
  state: GameState;
  onToggle: (id: string) => void;
}) {
  const options = availableOptions(mission, state);
  const chosen = state.selection[0];
  const anySelected = options.some((o) => o.id === chosen);
  /* `availableOptions`, not `mission.options`: a `requires` gate can take the fifth card
     away, and a card sized for five columns rendered in four would be needlessly small. */
  const narrow = options.length >= NARROW_COLUMNS;

  return (
    <RadioGroup
      label={mission.question}
      /* `m-deal`: 45ms apart, left to right. The cards are compared ACROSS (F2), so the
         stagger has to assemble the row without implying an order to read it in — which
         is why it is at the bottom of the 30–80ms band and not the top. */
      className={`m-deal grid items-stretch gap-3 ${columns(options.length)}`}
      style={{ gridTemplateRows: `repeat(${CARD_ROWS}, auto)` }}
    >
      {options.map((o, i) => (
        <OptionCard
          key={o.id}
          option={o}
          selected={chosen === o.id}
          anySelected={anySelected}
          index={i}
          narrow={narrow}
          onToggle={() => onToggle(o.id)}
        />
      ))}
    </RadioGroup>
  );
}

function EvidenceList({
  mission,
  state,
  onToggle,
}: {
  mission: Mission & { kind: "investigate" };
  state: GameState;
  onToggle: (id: string) => void;
}) {
  const full = state.selection.length >= mission.slots;

  /* `role="group"` and `aria-pressed`, not a radiogroup: an investigation really is
     multi-select — you buy several questions out of a smaller budget of slots — so
     "pressed" is the honest state and mutual exclusion would be a lie. */
  return (
    <div
      role="group"
      aria-label={mission.question}
      className={`m-deal grid items-stretch gap-3 ${columns(mission.evidence.length)}`}
    >
      {mission.evidence.map((e) => {
        const selected = state.selection.includes(e.id);
        return (
          <button
            key={e.id}
            className="choice flex flex-col"
            data-selected={selected}
            data-dimmed={!selected && full}
            onClick={() => onToggle(e.id)}
            aria-pressed={selected}
            aria-labelledby={`ev-${e.id}-q`}
            aria-describedby={`ev-${e.id}-label`}
          >
            <IconTile name="search" tone="accent" size={30} />
            <p id={`ev-${e.id}-label`} className="mt-2 text-[12px] font-bold text-(--color-accent)">
              {e.label}
            </p>
            <p
              id={`ev-${e.id}-q`}
              className="mt-0.5 text-[13px] font-bold leading-snug text-(--color-ink)"
            >
              {e.question}
            </p>
            <div className="mt-auto pt-2.5">
              <CardButton selected={selected} on="Chosen" off="Look into this" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ComponentList({
  mission,
  state,
  onToggle,
}: {
  mission: Mission & { kind: "build" };
  state: GameState;
  onToggle: (id: string) => void;
}) {
  const full = state.selection.length >= mission.pick;

  /* Also genuinely multi-select — a proposal is several components — so `aria-pressed`
     stays and the container only has to say where the set begins and what it is for. */
  return (
    <div
      role="group"
      aria-label={mission.question}
      className={`m-deal grid items-stretch gap-3 ${columns(mission.components.length)}`}
    >
      {mission.components.map((c) => {
        const selected = state.selection.includes(c.id);
        return (
          <button
            key={c.id}
            className="choice flex flex-col"
            data-selected={selected}
            data-dimmed={!selected && full}
            onClick={() => onToggle(c.id)}
            aria-pressed={selected}
            aria-labelledby={`cmp-${c.id}-title`}
            aria-describedby={`cmp-${c.id}-desc cmp-${c.id}-tag`}
          >
            <div className="flex items-start justify-between gap-2">
              <p
                id={`cmp-${c.id}-title`}
                className="text-[13px] font-bold leading-snug text-(--color-ink)"
              >
                {c.title}
              </p>
              <span id={`cmp-${c.id}-tag`}>
                <Pill tone={selected ? "accent" : "neutral"}>{c.tag}</Pill>
              </span>
            </div>
            <p
              id={`cmp-${c.id}-desc`}
              className="mt-1.5 text-[13px] leading-snug text-(--color-muted)"
            >
              {c.description}
            </p>
            <div className="mt-auto pt-2.5">
              <CardButton selected={selected} on="In the proposal" off="Include this" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── beat continuity ───────────────────────────── */

/**
 * The one line of situation that survives into the decision — and, behind it, the two
 * things the decide beat was deleting.
 *
 * Backlog 4.1, measured at 0.50 continuity against a 0.85 target. Moving from the brief to
 * the decide screen dropped the mission's `objective` and every `file` entry the player had
 * paid for, so the beat that uses information was the beat that could not see it. Nothing
 * here is newly written and nothing is moved out of the brief: it is the same `objective`
 * string and the same evidence labels, on the beat that needs them.
 *
 * **The disclosure is the line that was already there.** A `<summary>` wrapping the prompt
 * costs zero layout pixels, because the prompt was a `<p>` on this exact line already —
 * which is the constraint that made this restoration acceptable at all on a screen that
 * overflows at 1440×900. It also gives the affordance a 40px-tall target rather than the
 * 24px minimum, and 2.5.8 is measured on the short axis.
 *
 * The evidence is labels only. `reveals` is the finding itself and belongs on the brief,
 * where there is room to read it; a label is enough to remember that you have it. What
 * deliberately does NOT come back: the situation paragraphs, `concerns`, `assessment` and
 * `consider`. Those are reading, and reading belongs on the reading beat.
 */
function Continuity({
  mission,
  state,
  fallback,
}: {
  mission: Mission;
  state: GameState;
  fallback?: string;
}) {
  const file = discoveredEvidence(story, state.discovered);
  const prompt = mission.prompt ?? fallback;

  return (
    <details className="min-w-0 flex-1">
      <summary className="flex w-fit min-h-[24px] cursor-pointer list-none items-baseline gap-1.5 text-[13px] text-(--color-muted)">
        <span>
          {prompt} <span className="text-(--color-accent)">{UI_LABEL.showBrief}</span>
        </span>
      </summary>
      <p className="mt-2 max-w-[66ch] text-[13px] leading-snug text-(--color-ink-soft)">
        <span className="font-bold text-(--color-ink)">{UI_LABEL.objective} </span>
        {mission.objective}
      </p>
      {file.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {file.map((e) => (
            <li key={e.id}>
              <Pill tone="accent">
                <Icon name="search" size={12} />
                {e.label}
              </Pill>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

/* ───────────────────────────── the two screens ───────────────────────────── */

/**
 * Station 1 and 2 — what is true, and what is pressing.
 *
 * The whole situation, with room to read it. Nothing to decide here, which is the point:
 * every comparable game collapses the world before showing the options
 * (docs/DENSITY-FRAMEWORK.md, teardown table). Reading and choosing are different jobs
 * and they were competing for one screen.
 */
export function BriefBody({ mission, state }: { mission: Mission; state: GameState }) {
  const situation = resolveSituation(mission, state);

  return (
    /**
     * A new mission arrives as ONE gesture — 220ms, opacity only, on the whole work area.
     *
     * Not a stagger, and not a rise. Six sections fading and sliding up in turn is the
     * pattern `docs/UI-AUDIT.md` Z15 names as the generic machine-generated default, and
     * this screen has seven: header, client strip, assessment, concerns, colleague,
     * questions, hero. The brief is a situation to read, not a set of things arriving, so
     * the whole desk resolves at once and then holds still while it is read.
     *
     * The shell does the work of continuity here. Top bar, stepper, both rails and the
     * action bar are all the same DOM across every beat of a mission, so only the centre
     * changes — which is what actually happened, and is why a fade of the centre reads as
     * a panel updating rather than as a page load.
     */
    <div key={mission.id} className="m-enter flex min-h-full flex-col">
      <div data-region="situation" className="bg-(--color-surface)">
        <Header mission={mission} situation={situation} said={resolveSaidQuote(mission, state)} />
        {mission.client && (
          <ClientStrip client={mission.client} compact={Boolean(mission.assessment)} />
        )}
        {mission.assessment && <Assessment factors={mission.assessment} />}
        <Concerns concerns={mission.concerns} />
      </div>

      {/* The colleague's view and their open questions. On the brief, where there is room
          to read them — not beside the options, where they competed with the decision. */}
      {mission.advisor && (
        <div data-region="colleague" className="px-5 py-5">
          <div className="flex w-full items-start gap-4 rounded-[14px] border border-(--color-line) bg-(--color-surface) p-5">
            {mission.advisor.photo && (
              <img
                src={artUrl(mission.advisor.photo)}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-[56px] w-[56px] shrink-0 rounded-full object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-(--color-ink)">
                {mission.advisor.name}
                <span className="ml-2 font-medium text-(--color-accent)">
                  {mission.advisor.role}
                </span>
              </p>
              <p className="mt-1.5 text-[15px] italic leading-relaxed text-(--color-ink-soft) text-pretty">
                {quoted(mission.advisorLine ?? mission.advisor.quote)}
              </p>
              {mission.consider && mission.consider.length > 0 && (
                <ul className="mt-3 grid gap-x-8 gap-y-1.5 border-t border-(--color-line) pt-3 sm:grid-cols-2">
                  {mission.consider.map((c) => (
                    <li
                      key={c}
                      className="flex gap-2 text-[13px] leading-snug text-(--color-ink-soft)"
                    >
                      <span aria-hidden="true" className="shrink-0 font-bold text-(--color-accent)">
                        +
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Stations 3, 4 and 5 — the question, the options, the commit.
 *
 * Deliberately sparse. The brief has already been read, so this screen carries a
 * one-line reminder of the situation and then gets out of the way: the framework wants
 * ≥55% of the words on a decision screen to be inside the options themselves.
 */
export function DecideBody({
  mission,
  state,
  onToggle,
}: {
  mission: Mission;
  state: GameState;
  onToggle: (id: string) => void;
}) {
  const situation = resolveSituation(mission, state);
  const need = requiredSelectionCount(mission);
  const have = state.selection.length;
  const ready = have === need;

  return (
    /**
     * brief → decide is the same beat narrowing to a question, so it is deliberately NOT
     * a transition of the whole screen.
     *
     * The wrapper does not animate at all. The question band cross-fades in 160ms, in the
     * same position and on the same white surface the brief's header band occupied, so it
     * reads as that band updating rather than as one screen replacing another. Then the
     * options deal in underneath it. Two parts, in that order, because that is the shape
     * of the event: the situation collapsed to one question, and a hand of cards arrived.
     *
     * A single fade over both parts — which is what was here — makes the narrowing and
     * the arrival the same thing, and the arrival is the half the player is waiting for.
     */
    <div key={mission.id} className="flex min-h-full flex-col">
      {/* Station 3 — the question, under a rule. Uniform connectedness beats a gap.

          `px-5`, not `px-6`. The left content edge sat at 285px here and 281px on the
          brief — a 4px step, invisible on any one screen and taken 32 times a run, in the
          one place a console cannot afford it: the spine the eye returns to after every
          beat change. One gutter, both beats. */}
      {/* `py-2.5`, down from `py-4`. The band grew twice in this change — 6px of proximity
          correction between the question and the line under it, and 6px because the
          disclosure's `<summary>` has to clear 24px for 2.5.8 — and two decide screens in
          the game already overflow at 1440×900. Ten pixels came back out of the band's own
          padding, which is internal space, rather than out of the 20px air step between
          this station and the option row, which is what does the grouping. Net: every
          decide screen is 2px SHORTER than before the change. */}
      <div data-region="question" className="m-swap border-b border-(--color-line) bg-(--color-surface) px-5 py-2.5">
        <p className="eyebrow" style={{ color: "var(--color-accent)" }}>
          {mission.eyebrow}
        </p>
        <h1
          id={BEAT_TITLE_ID}
          className="mt-1 text-[24px] font-bold leading-[1.15] tracking-[-0.02em] text-(--color-ink)"
        >
          {mission.question}
        </h1>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
          <Continuity mission={mission} state={state} fallback={situation[0]} />
          {mission.kind !== "choice" && (
            <Pill tone={ready ? "good" : "accent"}>
              {mission.kind === "investigate" ? "Choose" : "Pick"} {need} · {have}/{need}
            </Pill>
          )}
        </div>
      </div>

      {/* Station 4 — the options. The only place on this screen with real word count. */}
      <div data-region="options" data-decision className="flex-1 px-5 py-5">
        {mission.kind === "choice" && (
          <ChoiceList mission={mission} state={state} onToggle={onToggle} />
        )}
        {mission.kind === "investigate" && (
          <EvidenceList mission={mission} state={state} onToggle={onToggle} />
        )}
        {mission.kind === "build" && (
          <ComponentList mission={mission} state={state} onToggle={onToggle} />
        )}
      </div>
    </div>
  );
}
