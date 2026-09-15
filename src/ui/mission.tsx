/**
 * The decide screen — the core gameplay surface.
 *
 * The centre column reads top to bottom as a briefing: who you are dealing
 * with, what is true right now, what they said, and then the question. The
 * option cards carry cost and trade-off but never a prediction — `pros` and
 * `cons` describe the APPROACH. The validator enforces that.
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

/* ───────────────────────── briefing blocks ───────────────────────── */

/** A divided band inside the briefing card. Keeps the brief as one object. */
function Band({
  title,
  icon,
  tone = "accent",
  children,
}: {
  title: string;
  icon: Parameters<typeof SectionTitle>[0]["icon"];
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-(--color-line) px-5 py-4 sm:px-6">
      <SectionTitle icon={icon} tone={tone} className="mb-3">
        {title}
      </SectionTitle>
      {children}
    </section>
  );
}

function ClientStrip({ client }: { client: ClientProfile }) {
  return (
    <>
      <section className="border-t border-(--color-line) px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3.5">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] text-[16px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
            }}
          >
            {client.monogram}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-bold leading-tight text-(--color-ink)">
              {client.name}
            </h2>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {client.tags.map((t) => (
                <Pill key={t} tone="accent">
                  {t}
                </Pill>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-(--color-ink-soft)">{client.blurb}</p>
      </section>

      {/* Separators run horizontally when stacked and vertically when side by
          side, so the divider follows the layout rather than the source order. */}
      <dl
        className="grid grid-cols-1 border-t border-(--color-line) sm:grid-cols-3"
        style={{ background: "var(--color-panel)" }}
      >
        {client.facts.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-2.5 border-t border-(--color-line) px-5 py-3 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0"
          >
            <span className="shrink-0 text-(--color-accent)">
              <Icon name={f.icon} size={17} />
            </span>
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold text-(--color-muted)">{f.label}</dt>
              <dd className="text-[14px] font-bold text-(--color-ink)">{f.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </>
  );
}

/** Level → a filled chip and a matching bar. Two encodings, one glance. */
const LEVEL: Record<
  AssessmentFactor["level"],
  { pct: number; tone: Tone; colour: string; word: string }
> = {
  low: { pct: 28, tone: "neutral", colour: "var(--color-faint)", word: "Low" },
  medium: { pct: 55, tone: "warn", colour: "var(--color-warn)", word: "Medium" },
  high: { pct: 80, tone: "accent", colour: "var(--color-accent)", word: "High" },
  strong: { pct: 96, tone: "good", colour: "var(--color-good)", word: "Strong" },
};

function Assessment({ factors }: { factors: AssessmentFactor[] }) {
  return (
    <Band title="Where this stands today" icon="chart">
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {factors.map((f) => {
          const l = LEVEL[f.level];
          return (
            <div key={f.label}>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-(--color-accent)">
                  <Icon name={f.icon} size={15} />
                </span>
                <span className="flex-1 text-[13.5px] font-bold text-(--color-ink)">
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
              <p className="mt-1.5 text-[12.5px] leading-snug text-(--color-muted)">{f.note}</p>
            </div>
          );
        })}
      </div>
    </Band>
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
        <section className="px-5 py-4 sm:px-6">
          <SectionTitle icon="megaphone" className="mb-2.5">
            What they said
          </SectionTitle>
          <blockquote
            className="rounded-xl px-4 py-3 text-[14.5px] italic leading-relaxed text-(--color-ink)"
            style={{ background: "var(--color-accent-tint)" }}
          >
            “{said.text}”
            <footer className="mt-2 text-[12px] font-bold not-italic text-(--color-accent-deep)">
              {said.attribution}
            </footer>
          </blockquote>
        </section>
      )}
      {concerns && concerns.length > 0 && (
        <section className="border-t border-(--color-line) px-5 py-4 sm:px-6 lg:border-l lg:border-t-0">
          <SectionTitle icon="warning" tone="warn" className="mb-2.5">
            Key concerns
          </SectionTitle>
          <ul className="space-y-2">
            {concerns.map((c) => (
              <li
                key={c}
                className="flex gap-2.5 text-[13.5px] leading-relaxed text-(--color-ink-soft)"
              >
                <span className="mt-[3px] shrink-0 text-(--color-warn)">
                  <Icon name="warning" size={13} />
                </span>
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
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 transition-colors hover:bg-(--color-surface-sunk) sm:px-6">
        <span
          className="shrink-0 transition-transform group-open:rotate-90 text-(--color-accent)"
          aria-hidden="true"
        >
          ▸
        </span>
        <span className="shrink-0 text-(--color-accent)">
          <Icon name="search" size={16} />
        </span>
        <span className="text-[15px] font-bold text-(--color-ink)">What you found out</span>
        <Pill tone="accent">{items.length}</Pill>
      </summary>
      <div
        className="space-y-3 border-t border-(--color-line) px-5 py-4 sm:px-6"
        style={{ background: "var(--color-surface-sunk)" }}
      >
        {items.map((e) => (
          <div key={e.id}>
            <p className="text-[12px] font-bold text-(--color-accent-deep)">{e.label}</p>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-(--color-ink-soft)">
              {e.reveals}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}

/* ───────────────────────────── cost dots ───────────────────────────── */

function CostDots({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5" aria-label={`${label}: ${value} of 3`}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-(--color-faint)">
        {label}
      </span>
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
    </span>
  );
}

/* ───────────────────────────── option cards ───────────────────────────── */

function OptionCard({
  option,
  index,
  selected,
  onToggle,
}: {
  option: Option;
  index: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const hasTradeoffs = Boolean(option.pros?.length || option.cons?.length);

  return (
    <button className="choice" data-selected={selected} onClick={onToggle} aria-pressed={selected}>
      {/* header — the scan line. Icon and title carry the weight; everything
          below is detail you only read once a title has caught your eye. */}
      <div className="flex items-center gap-3">
        <IconTile name={option.icon ?? "target"} tone="accent" size={38} />
        <p className="min-w-0 flex-1 text-[16.5px] font-bold leading-snug text-(--color-ink)">
          {option.title}
        </p>
        <span
          aria-hidden="true"
          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 text-white transition-colors"
          style={{
            borderColor: selected ? "var(--color-accent)" : "var(--color-line-strong)",
            background: selected ? "var(--color-accent)" : "transparent",
          }}
        >
          {selected && <Icon name="check" size={13} />}
        </span>
      </div>

      <p className="mt-1.5 text-[13.5px] leading-snug text-(--color-muted)">
        {option.description}
      </p>

      {/* Trade-offs as tags, not sentences. Four bulleted clauses per card put
          ~240 words on a four-option screen, and the only way through it was to
          read all of it. Budgets in validate.ts keep them short. */}
      {hasTradeoffs && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {option.pros?.map((p) => (
            <Pill key={p} tone="good">
              <Icon name="check" size={11} />
              {p}
            </Pill>
          ))}
          {option.cons?.map((c) => (
            <Pill key={c} tone="bad">
              <Icon name="cross" size={11} />
              {c}
            </Pill>
          ))}
        </div>
      )}

      {/* footer: what it costs — never what it returns */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-(--color-line) pt-2.5">
        {/* The game is keyboard playable; this is where you find that out. */}
        <kbd
          className="hidden h-[19px] min-w-[19px] shrink-0 items-center justify-center rounded-[5px] border border-(--color-line-strong) px-1 font-sans text-[10.5px] font-bold text-(--color-faint) sm:flex"
          style={{ background: "var(--color-surface)" }}
        >
          {index + 1}
        </kbd>
        {option.cost && (
          <>
            <CostDots label="Time" value={option.cost.time} />
            <CostDots label="Investment" value={option.cost.investment} />
          </>
        )}
        <span
          className="ml-auto flex shrink-0 items-center gap-1.5 text-[12.5px] font-bold"
          style={{ color: selected ? "var(--color-accent-deep)" : "var(--color-accent)" }}
        >
          {selected ? "Selected" : `Select this option`}
          <span aria-hidden="true">{selected ? "✓" : "→"}</span>
        </span>
      </div>

      {/* What you are locking in. Only on the chosen card — a two-step commit,
          and it keeps three unread commitment lines off the screen. */}
      {selected && option.commits && (
        <p
          className="anim-fade mt-2.5 rounded-lg px-3 py-2 text-[12.5px] leading-snug"
          style={{ background: "var(--color-surface)", color: "var(--color-ink-soft)" }}
        >
          <span className="font-bold text-(--color-accent-deep)">This commits you: </span>
          {option.commits}
        </p>
      )}
    </button>
  );
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

  // Stacked, not gridded. Three options in a two-column grid leaves a lonely
  // third card, and the trade-off columns need the width anyway.
  return (
    <div className="stagger space-y-3">
      {options.map((o, i) => (
        <OptionCard
          key={o.id}
          option={o}
          index={i}
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
    <div className="stagger grid gap-3 sm:grid-cols-2">
      {mission.evidence.map((e) => {
        const selected = state.selection.includes(e.id);
        return (
          <button
            key={e.id}
            className="choice"
            data-selected={selected}
            data-dimmed={!selected && full}
            onClick={() => onToggle(e.id)}
            aria-pressed={selected}
          >
            <div className="flex items-start gap-3">
              <IconTile name="search" tone="accent" size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11.5px] font-bold text-(--color-accent)">{e.label}</p>
                  {/* Square, not round: this is multi-select. `rounded-md` is
                      12px under our theme, which reads as a radio button. */}
                  <span
                    aria-hidden="true"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 text-white transition-colors"
                    style={{
                      borderColor: selected ? "var(--color-accent)" : "var(--color-line-strong)",
                      background: selected ? "var(--color-accent)" : "transparent",
                    }}
                  >
                    {selected && <Icon name="check" size={12} />}
                  </span>
                </div>
                <p className="mt-1 text-[15px] font-bold leading-snug text-(--color-ink)">
                  {e.question}
                </p>
              </div>
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
    <div className="stagger grid gap-3 sm:grid-cols-2">
      {mission.components.map((c) => {
        const selected = state.selection.includes(c.id);
        return (
          <button
            key={c.id}
            className="choice"
            data-selected={selected}
            data-dimmed={!selected && full}
            onClick={() => onToggle(c.id)}
            aria-pressed={selected}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[15.5px] font-bold leading-snug text-(--color-ink)">{c.title}</p>
              <span
                aria-hidden="true"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 text-white transition-colors"
                style={{
                  borderColor: selected ? "var(--color-accent)" : "var(--color-line-strong)",
                  background: selected ? "var(--color-accent)" : "transparent",
                }}
              >
                {selected && <Icon name="check" size={12} />}
              </span>
            </div>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-(--color-muted)">
              {c.description}
            </p>
            <div className="mt-3 border-t border-(--color-line) pt-2.5">
              <Pill tone={selected ? "accent" : "neutral"}>{c.tag}</Pill>
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
    <div key={mission.id} className="anim-rise">
      {/* THE BRIEF — one card, divided into bands. Previously these were six
          separate floating cards, which gave the page no structure to scan and
          made everything feel equally important. */}
      <section className="card overflow-hidden">
        <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
          <p className="eyebrow" style={{ color: "var(--color-accent)" }}>
            {mission.eyebrow}
          </p>
          <h1 className="display mt-1.5 text-[29px] text-(--color-ink) sm:text-[34px]">
            {mission.title}
          </h1>

          <div className="mt-3.5 space-y-3">
            {situation.map((p, i) => (
              <p key={i} className="text-[15.5px] leading-[1.65] text-(--color-ink-soft)">
                {p}
              </p>
            ))}
          </div>

          {mission.context && mission.context.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {mission.context.map((c) => (
                <span
                  key={c.label}
                  className="rounded-lg px-3 py-1.5 text-[12.5px]"
                  style={{ background: "var(--color-panel)" }}
                >
                  <span className="text-(--color-muted)">{c.label}: </span>
                  <span className="font-bold text-(--color-ink)">{c.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {mission.client && <ClientStrip client={mission.client} />}
        {mission.assessment && <Assessment factors={mission.assessment} />}
        <SaidAndConcerns said={mission.saidQuote} concerns={mission.concerns} />
        <Notes discovered={state.discovered} content={content} />
      </section>

      {/* THE DECISION */}
      <div className="mb-3.5 mt-7 flex flex-wrap items-center justify-between gap-3">
        <h2 className="display text-[22px] text-(--color-ink)">{mission.question}</h2>
        {mission.kind !== "choice" && (
          <Pill tone={ready ? "good" : "accent"}>
            {ready ? "✓ " : ""}
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
  );
}
