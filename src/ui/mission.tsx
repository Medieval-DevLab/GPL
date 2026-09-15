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

import { availableOptions, requiredSelectionCount, resolveSituation } from "../engine/engine";
import type {
  AssessmentFactor,
  ClientProfile,
  GameState,
  Mission,
  Option,
} from "../engine/types";
import { Icon, IconTile, Pill, SectionTitle } from "./icons";
import {
  BEAT_TITLE_ID,
  Hidden,
  RadioGroup,
  UI_LABEL,
  artUrl,
  radioTabIndex,
} from "./shell";

/* ───────────────────────── header ───────────────────────── */

function Header({ mission, situation }: { mission: Mission; situation: string[] }) {
  return (
    <div className="flex items-stretch gap-5">
      <div className="min-w-0 flex-1 px-5 pt-3.5">
        <p className="eyebrow" style={{ color: "var(--color-accent)" }}>
          {mission.eyebrow}
        </p>
        <h1
          id={BEAT_TITLE_ID}
          className="mt-1.5 text-[32px] font-bold leading-[1.1] tracking-[-0.015em] text-(--color-ink)"
        >
          {mission.title}
        </h1>
        <div className="mt-2 space-y-1">
          {situation.map((p, i) => (
            <p key={i} className="text-[15px] leading-[1.5] text-(--color-ink-soft)">
              {p}
            </p>
          ))}
        </div>
      </div>

      {mission.saidQuote && (
        <div className="hidden w-[186px] shrink-0 py-4 pr-5 lg:block">
          <blockquote className="border-l-[3px] border-(--color-accent) pl-3 text-[13px] italic leading-snug text-(--color-ink-soft)">
            “{mission.saidQuote.text}”
          </blockquote>
          <p className="mt-2 pl-3 text-[12px] font-bold text-(--color-ink)">
            {mission.saidQuote.attribution}
          </p>
        </div>
      )}

      {/* Bleeds to the top-right corner, as in every mockup. */}
      {mission.hero && (
        <img
          src={artUrl(mission.hero)}
          alt=""
          loading="eager"
          decoding="async"
          className={`hidden h-[212px] shrink-0 object-cover md:block ${mission.saidQuote ? "w-[30%]" : "w-[40%]"}`}
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
              <span
                aria-hidden="true"
                className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-(--color-bad)"
              />
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
function CostRow({ icon, label, value }: { icon: "clock" | "coins"; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-(--color-muted)">
        <Icon name={icon} size={13} />
      </span>
      <span className="flex-1 text-[12px] font-medium text-(--color-muted)">{label}</span>
      <Hidden>
        {value} {UI_LABEL.outOf} 3.
      </Hidden>
      <span aria-hidden="true" className="flex gap-[3px]">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className="h-[6px] w-[6px] rounded-full"
            style={{
              background: n <= value ? "var(--color-accent)" : "var(--color-line-strong)",
            }}
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

function OptionCard({
  option,
  selected,
  anySelected,
  index,
  onToggle,
}: {
  option: Option;
  selected: boolean;
  /** roving tabindex: the group is one tab stop, not four */
  anySelected: boolean;
  index: number;
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
      {/* 1 · media + medallion */}
      <div className="relative">
        {option.image && (
          <img
            src={artUrl(option.image)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-[132px] w-full object-cover"
          />
        )}
        <div className={`flex justify-center px-3 ${option.image ? "-mt-8" : "pt-4"}`}>
          <span
            aria-hidden="true"
            className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-[3px] border-(--color-surface)"
            style={{ background: "var(--color-accent-tint)", color: "var(--color-accent)" }}
          >
            <Icon name={option.icon ?? "target"} size={28} />
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
        className="px-4 pt-2 text-[15px] leading-snug text-(--color-muted)"
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
            <CostRow icon="clock" label="Time" value={option.cost.time} />
            <CostRow icon="coins" label="Investment" value={option.cost.investment} />
          </div>
        )}
      </div>

      {/* 6 · the card's own button carries the selected state */}
      <div className="self-end px-4 pb-4 pt-4">
        <CardButton selected={selected} on="Selected" off="Select this option" />
      </div>
    </button>
  );
}

/**
 * The selected state lives on the card's own button, as in every mockup: outlined with
 * purple text, then solid purple. Kept in one place because three card kinds use it.
 */
function CardButton({ selected, on, off }: { selected: boolean; on: string; off: string }) {
  return (
    <span
      className="flex w-full items-center justify-center gap-2 rounded-[10px] border px-3 py-2.5 text-[13px] font-bold transition-colors"
      style={
        selected
          ? { background: "var(--color-accent)", borderColor: "var(--color-accent)", color: "#fff" }
          : {
              background: "var(--color-surface)",
              borderColor: "var(--color-line-strong)",
              color: "var(--color-accent)",
            }
      }
    >
      {selected ? on : off}
      {/* The brief has an arrow on every card button, selected or not. */}
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

  return (
    <RadioGroup
      label={mission.question}
      className={`grid items-stretch gap-3 ${columns(options.length)}`}
      style={{ gridTemplateRows: `repeat(${CARD_ROWS}, auto)` }}
    >
      {options.map((o, i) => (
        <OptionCard
          key={o.id}
          option={o}
          selected={chosen === o.id}
          anySelected={anySelected}
          index={i}
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
      className={`grid items-stretch gap-3 ${columns(mission.evidence.length)}`}
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
      className={`grid items-stretch gap-3 ${columns(mission.components.length)}`}
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
    <div key={mission.id} className="anim-fade flex min-h-full flex-col">
      <div data-region="situation" className="bg-(--color-surface)">
        <Header mission={mission} situation={situation} />
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
              <p className="mt-1.5 text-[15px] italic leading-relaxed text-(--color-ink-soft)">
                “{mission.advisorLine ?? mission.advisor.quote}”
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
    <div key={mission.id} className="anim-fade flex min-h-full flex-col">
      {/* Station 3 — the question, under a rule. Uniform connectedness beats a gap. */}
      <div data-region="question" className="border-b border-(--color-line) bg-(--color-surface) px-6 py-4">
        <p className="eyebrow" style={{ color: "var(--color-accent)" }}>
          {mission.eyebrow}
        </p>
        <h1
          id={BEAT_TITLE_ID}
          className="mt-1 text-[24px] font-bold leading-[1.15] tracking-[-0.02em] text-(--color-ink)"
        >
          {mission.question}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-[13px] text-(--color-muted)">{mission.prompt ?? situation[0]}</p>
          {mission.kind !== "choice" && (
            <Pill tone={ready ? "good" : "accent"}>
              {mission.kind === "investigate" ? "Choose" : "Pick"} {need} · {have}/{need}
            </Pill>
          )}
        </div>
      </div>

      {/* Station 4 — the options. The only place on this screen with real word count. */}
      <div data-region="options" data-decision className="flex-1 px-6 py-5">
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
