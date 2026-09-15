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

import { useMemo } from "react";

import { availableOptions, requiredSelectionCount, resolveSituation } from "../engine/engine";
import type {
  AssessmentFactor,
  ClientProfile,
  Content,
  Evidence,
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
        <h1 className="mt-1.5 text-[27px] font-bold leading-[1.12] tracking-[-0.015em] text-(--color-ink)">
          {mission.title}
        </h1>
        <div className="mt-2 space-y-1">
          {situation.map((p, i) => (
            <p key={i} className="text-[13.5px] leading-[1.5] text-(--color-ink-soft)">
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
          className="hidden h-[150px] w-[38%] shrink-0 object-cover md:block"
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
          className="h-[46px] w-[82px] shrink-0 rounded-[8px] object-cover"
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
          <h2 className="text-[15px] font-bold leading-tight text-(--color-ink)">{client.name}</h2>
          {client.tags.map((t) => (
            <Pill key={t} tone="accent">
              {t}
            </Pill>
          ))}
        </div>
        {!compact && (
          <p className="mt-1 text-[12.5px] leading-snug text-(--color-muted)">{client.blurb}</p>
        )}
      </div>

      <dl className="flex shrink-0 flex-wrap gap-x-6 gap-y-2 border-(--color-line) lg:border-l lg:pl-6">
        {client.facts.map((f) => (
          <div key={f.label} className="flex items-center gap-2">
            <span className="shrink-0 text-(--color-accent)">
              <Icon name={f.icon} size={16} />
            </span>
            <div>
              <dt className="text-[10.5px] font-semibold text-(--color-muted)">{f.label}</dt>
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
const LEVEL: Record<
  AssessmentFactor["level"],
  { pct: number; tone: Tone; colour: string; word: string }
> = {
  low: { pct: 26, tone: "neutral", colour: "var(--color-faint)", word: "Low" },
  medium: { pct: 54, tone: "warn", colour: "var(--color-warn)", word: "Medium" },
  high: { pct: 80, tone: "accent", colour: "var(--color-accent)", word: "High" },
  strong: { pct: 96, tone: "good", colour: "var(--color-good)", word: "Strong" },
};

const FACTOR_ICON_TONE: Tone[] = ["accent", "good", "warn", "bad", "neutral"];

function Assessment({ factors }: { factors: AssessmentFactor[] }) {
  return (
    <section className="border-t border-(--color-line) px-5 py-2.5">
      <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">
        {factors.map((f, i) => {
          const l = LEVEL[f.level];
          const iconTone = FACTOR_ICON_TONE[i % FACTOR_ICON_TONE.length];
          return (
            <div key={f.label}>
              <div className="flex items-center gap-2">
                <IconTile name={f.icon} tone={iconTone} size={26} />
                <span className="min-w-0 flex-1 text-[12.5px] font-bold leading-tight text-(--color-ink)">
                  {f.label}
                </span>
                <Pill tone={l.tone}>{l.word}</Pill>
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
              <p className="mt-1 text-[11px] leading-snug text-(--color-muted)">{f.note}</p>
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
        <section className="px-5 py-3">
          <div className="flex gap-2.5">
            <IconTile name="talk" tone="accent" size={30} />
            <div className="min-w-0">
              <blockquote className="text-[13.5px] italic leading-snug text-(--color-ink)">
                “{said.text}”
              </blockquote>
              <p className="mt-1 text-[11.5px] font-bold text-(--color-accent-deep)">
                {said.attribution}
              </p>
            </div>
          </div>
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
                className="flex gap-2 text-[12.5px] leading-snug text-(--color-ink-soft)"
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

function Notes({ discovered, content }: { discovered: string[]; content: Content }) {
  const items = useMemo(() => {
    const found: Evidence[] = [];
    for (const node of Object.values(content.nodes)) {
      if (node.kind !== "investigate") continue;
      for (const e of node.evidence) if (discovered.includes(e.id)) found.push(e);
    }
    return found;
  }, [discovered, content]);

  if (items.length === 0) return null;

  return (
    <details className="group border-t border-(--color-line)">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-2 transition-colors hover:bg-(--color-surface-sunk)">
        <span
          className="shrink-0 text-(--color-accent) transition-transform group-open:rotate-90"
          aria-hidden="true"
        >
          ▸
        </span>
        <span className="shrink-0 text-(--color-accent)">
          <Icon name="search" size={15} />
        </span>
        <span className="text-[13.5px] font-bold text-(--color-ink)">Your file</span>
        <Pill tone="accent">{items.length}</Pill>
      </summary>
      <div
        className="space-y-2 border-t border-(--color-line) px-5 py-3"
        style={{ background: "var(--color-surface-sunk)" }}
      >
        {items.map((e) => (
          <div key={e.id}>
            <p className="text-[11.5px] font-bold text-(--color-accent-deep)">{e.label}</p>
            <p className="text-[12.5px] leading-snug text-(--color-ink-soft)">{e.reveals}</p>
          </div>
        ))}
      </div>
    </details>
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
      className="choice flex flex-col !p-0 text-left"
      data-selected={selected}
      onClick={onToggle}
      aria-pressed={selected}
    >
      {option.image && (
        <img
          src={artUrl(option.image)}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-[64px] w-full shrink-0 object-cover"
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col p-3">
        {/* Medallion overlaps the photo's lower edge, as the mockups do. */}
        <div className={option.image ? "-mt-7 mb-1" : "mb-1"}>
          <span
            aria-hidden="true"
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full border-2 border-(--color-surface)"
            style={{
              background: selected ? "var(--color-accent)" : "var(--color-accent-tint)",
              color: selected ? "#fff" : "var(--color-accent)",
            }}
          >
            <Icon name={option.icon ?? "target"} size={18} />
          </span>
        </div>

        <p className="text-[14.5px] font-bold leading-snug text-(--color-ink)">{option.title}</p>
        <p className="mt-1 text-[12px] leading-snug text-(--color-muted)">{option.description}</p>

        {(option.pros?.length || option.cons?.length) && (
          <ul className="mt-2 space-y-0.5 border-t border-(--color-line) pt-2">
            {option.pros?.map((p) => (
              <li key={p} className="flex items-start gap-1.5 text-[11.5px] leading-snug">
                <span className="mt-[2px] shrink-0 text-(--color-good)">
                  <Icon name="check" size={12} />
                </span>
                <span className="font-medium text-(--color-ink-soft)">{p}</span>
              </li>
            ))}
            {option.cons?.map((c) => (
              <li key={c} className="flex items-start gap-1.5 text-[11.5px] leading-snug">
                <span className="mt-[2px] shrink-0 text-(--color-bad)">
                  <Icon name="cross" size={12} />
                </span>
                <span className="text-(--color-muted)">{c}</span>
              </li>
            ))}
          </ul>
        )}

        {option.cost && (
          <div
            className="mt-2 space-y-1 rounded-lg px-2.5 py-1.5"
            style={{ background: "var(--color-surface-sunk)" }}
          >
            <CostRow icon="clock" label="Time" value={option.cost.time} />
            <CostRow icon="coins" label="Investment" value={option.cost.investment} />
          </div>
        )}

        {/* The card's own button carries the selected state — outlined, then solid. */}
        <div className="mt-auto pt-2.5">
          <CardButton selected={selected} on="Selected" off="Select this option" />
        </div>
      </div>
    </button>
  );
}

/**
 * The selected state lives on the card's own button, as in every mockup. Kept in one
 * place because three different card kinds use it and they must not drift apart.
 */
function CardButton({
  selected,
  on,
  off,
}: {
  selected: boolean;
  on: string;
  off: string;
}) {
  return (
    <span
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[12.5px] font-bold transition-colors"
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
      {selected && <Icon name="check" size={13} />}
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
    <div className={`grid items-stretch gap-3 ${columns(options.length)}`}>
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
  content,
  onToggle,
}: {
  mission: Mission;
  state: GameState;
  content: Content;
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
        <Notes discovered={state.discovered} content={content} />
      </div>

      {/* The decision */}
      <div className="flex-1 px-5 pb-3 pt-3">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[19px] font-bold tracking-[-0.01em] text-(--color-ink)">
            {mission.question}
          </h2>
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
