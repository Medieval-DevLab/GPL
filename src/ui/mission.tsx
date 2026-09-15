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
import { Icon, IconTile, Pill, SectionTitle, type Tone } from "./icons";
import { artUrl } from "./shell";

/* ───────────────────────── header ───────────────────────── */

function Header({ mission, situation }: { mission: Mission; situation: string[] }) {
  return (
    <div className="flex items-stretch gap-5">
      <div className="min-w-0 flex-1 px-5 pt-4">
        <p className="eyebrow" style={{ color: "var(--color-accent)" }}>
          {mission.eyebrow}
        </p>
        <h1 className="mt-1.5 text-[32px] font-bold leading-[1.1] tracking-[-0.015em] text-(--color-ink)">
          {mission.title}
        </h1>
        <div className="mt-2 space-y-1">
          {situation.map((p, i) => (
            <p key={i} className="text-[15px] leading-[1.52] text-(--color-ink-soft)">
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* Bleeds to the top-right corner, as in every mockup. */}
      {mission.hero && (
        <img
          src={artUrl(mission.hero)}
          alt=""
          loading="eager"
          decoding="async"
          className="hidden h-[172px] w-[40%] shrink-0 object-cover md:block"
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
    <section className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-(--color-line) px-5 py-2.5">
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
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[11px] text-[14px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
          }}
        >
          {client.monogram}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2 className="text-[17px] font-bold leading-tight text-(--color-ink)">{client.name}</h2>
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
              <dt className="text-[11px] font-semibold text-(--color-muted)">{f.label}</dt>
              <dd className="text-[14px] font-bold leading-tight text-(--color-ink)">{f.value}</dd>
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
const LEVEL: Record<
  AssessmentFactor["level"],
  { pct: number; tone: Tone; colour: string; word: string }
> = {
  low: { pct: 26, tone: "neutral", colour: "var(--color-faint)", word: "Low" },
  medium: { pct: 54, tone: "warn", colour: "var(--color-warn)", word: "Medium" },
  high: { pct: 80, tone: "accent", colour: "var(--color-accent)", word: "High" },
  strong: { pct: 96, tone: "good", colour: "var(--color-good)", word: "Strong" },
};

function Assessment({ factors }: { factors: AssessmentFactor[] }) {
  return (
    <section className="border-t border-(--color-line) px-5 py-2.5">
      <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">
        {factors.map((f) => {
          const l = LEVEL[f.level];
          const iconTone = f.tone;
          return (
            <div key={f.label} className="card px-3 py-2">
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
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${l.pct}%`, background: l.colour }}
                />
              </div>
              <p className="mt-1 text-[14px] font-bold leading-none" style={{ color: l.colour }}>
                {l.word}
              </p>
              <p className="mt-1 text-[11.5px] leading-snug text-(--color-muted)">{f.note}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SaidAndConcerns({
  said,
  concerns,
}: {
  said?: { text: string; attribution: string };
  concerns?: string[];
}) {
  if (!said && !concerns?.length) return null;
  return (
    <div className="grid border-t border-(--color-line) lg:grid-cols-2">
      {said && (
        <section className="px-5 py-3" style={{ background: "var(--color-accent-tint)" }}>
          <SectionTitle icon="talk" className="mb-2">
            What they said
          </SectionTitle>
          <blockquote className="text-[14px] italic leading-snug text-(--color-ink)">
            “{said.text}”
          </blockquote>
          <p className="mt-1.5 text-[12px] font-bold text-(--color-accent-deep)">
            {said.attribution}
          </p>
        </section>
      )}
      {concerns && concerns.length > 0 && (
        // Rose panel: sentiment is encoded by the surface, not just the icon.
        <section
          className="border-t border-(--color-line) px-5 py-3 lg:border-l lg:border-t-0"
          style={{ background: "var(--color-bad-tint)" }}
        >
          <SectionTitle icon="warning" tone="bad" className="mb-1.5">
            Key concerns
          </SectionTitle>
          <ul className="space-y-1">
            {concerns.map((c) => (
              <li
                key={c}
                className="flex gap-2 text-[13px] leading-snug text-(--color-ink-soft)"
              >
                <span
                  aria-hidden="true"
                  className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-(--color-bad)"
                />
                {c}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ───────────────────────────── cost rows ───────────────────────────── */

function CostRow({ icon, label, value }: { icon: "clock" | "coins"; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`${label}: ${value} of 3`}>
      <span className="shrink-0 text-(--color-muted)">
        <Icon name={icon} size={13} />
      </span>
      <span className="flex-1 text-[11px] font-medium text-(--color-muted)">{label}</span>
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

function OptionCard({
  option,
  selected,
  onToggle,
}: {
  option: Option;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="choice grid gap-0 !p-0 text-left"
      style={{ gridRow: `span ${CARD_ROWS}`, gridTemplateRows: "subgrid" }}
      data-selected={selected}
      onClick={onToggle}
      aria-pressed={selected}
    >
      {/* 1 · media + medallion */}
      <div className="relative">
        {option.image && (
          <img
            src={artUrl(option.image)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-[88px] w-full object-cover"
          />
        )}
        <div className={`flex justify-center px-3 ${option.image ? "-mt-6" : "pt-3"}`}>
          <span
            aria-hidden="true"
            className="flex h-[48px] w-[48px] items-center justify-center rounded-full border-[3px] border-(--color-surface)"
            style={{
              background: selected ? "var(--color-accent)" : "var(--color-accent-tint)",
              color: selected ? "#fff" : "var(--color-accent)",
            }}
          >
            <Icon name={option.icon ?? "target"} size={23} />
          </span>
        </div>
      </div>

      {/* 2 · title — the only thing the mockups centre */}
      <p
        className="px-3.5 pt-2 text-center text-[16px] font-bold leading-snug"
        style={{ color: selected ? "var(--color-accent-deep)" : "var(--color-ink)" }}
      >
        {option.title}
      </p>

      {/* 3 · what it is */}
      <p className="px-3.5 pt-1.5 text-center text-[12.5px] leading-snug text-(--color-muted)">
        {option.description}
      </p>

      {/* 4 · what it trades */}
      <div className="px-3.5 pt-2.5">
        {(option.pros?.length || option.cons?.length) && (
          <ul className="space-y-1 border-t border-(--color-line) pt-2.5">
            {option.pros?.map((t) => (
              <li key={t} className="flex items-start gap-1.5 text-[12px] leading-snug">
                <span className="mt-[2px] shrink-0 text-(--color-good)">
                  <Icon name="check" size={13} />
                </span>
                <span className="font-medium text-(--color-ink-soft)">{t}</span>
              </li>
            ))}
            {option.cons?.map((t) => (
              <li key={t} className="flex items-start gap-1.5 text-[12px] leading-snug">
                <span className="mt-[2px] shrink-0 text-(--color-bad)">
                  <Icon name="cross" size={13} />
                </span>
                <span className="text-(--color-muted)">{t}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 5 · what it costs — never what it returns */}
      <div className="px-3.5 pt-2.5">
        {option.cost && (
          <div
            className="space-y-1 rounded-lg px-2.5 py-2"
            style={{ background: "var(--color-surface-sunk)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-(--color-faint)">
              Resource cost
            </p>
            <CostRow icon="clock" label="Time" value={option.cost.time} />
            <CostRow icon="coins" label="Investment" value={option.cost.investment} />
          </div>
        )}
      </div>

      {/* 6 · the card's own button carries the selected state */}
      <div className="self-end px-3.5 pb-3.5 pt-3">
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
      className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border px-2 py-[7px] text-[12.5px] font-bold transition-colors"
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
      {/* The brief has an arrow on every card button. DESIGN-LANGUAGE says the brief wins. */}
      <span aria-hidden="true">{selected ? "✓" : "→"}</span>
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

  return (
    <div
      className={`grid items-stretch gap-3 ${columns(options.length)}`}
      style={{ gridTemplateRows: `repeat(${CARD_ROWS}, auto)` }}
    >
      {options.map((o) => (
        <OptionCard
          key={o.id}
          option={o}
          selected={chosen === o.id}
          onToggle={() => onToggle(o.id)}
        />
      ))}
    </div>
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

  return (
    <div className={`grid items-stretch gap-3 ${columns(mission.evidence.length)}`}>
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
          >
            <IconTile name="search" tone="accent" size={30} />
            <p className="mt-2 text-[11px] font-bold text-(--color-accent)">{e.label}</p>
            <p className="mt-0.5 text-[13.5px] font-bold leading-snug text-(--color-ink)">
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

  return (
    <div className={`grid items-stretch gap-3 ${columns(mission.components.length)}`}>
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
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13.5px] font-bold leading-snug text-(--color-ink)">{c.title}</p>
              <Pill tone={selected ? "accent" : "neutral"}>{c.tag}</Pill>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-snug text-(--color-muted)">
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

/* ───────────────────────────── the screen ───────────────────────────── */

export function MissionBody({
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
      {/* The brief — bands divided by rules, on one continuous surface. */}
      <div className="bg-(--color-surface)">
        <Header mission={mission} situation={situation} />
        {mission.client && (
          <ClientStrip client={mission.client} compact={Boolean(mission.assessment)} />
        )}
        {mission.assessment && <Assessment factors={mission.assessment} />}
        <SaidAndConcerns said={mission.saidQuote} concerns={mission.concerns} />
      </div>

      {/* The decision */}
      <div className="flex-1 px-5 pb-3 pt-3">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[24px] font-bold tracking-[-0.015em] text-(--color-ink)">
              {mission.question}
            </h2>
            {mission.prompt && (
              <p className="mt-0.5 text-[13.5px] text-(--color-muted)">{mission.prompt}</p>
            )}
          </div>
          {mission.kind !== "choice" && (
            <Pill tone={ready ? "good" : "accent"}>
              {mission.kind === "investigate" ? "Choose" : "Pick"} {need} · {have}/{need}
            </Pill>
          )}
        </div>

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
