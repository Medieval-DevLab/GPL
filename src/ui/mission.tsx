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
import { Icon, IconTile } from "./icons";

/* ───────────────────────── briefing blocks ───────────────────────── */

function ClientStrip({ client }: { client: ClientProfile }) {
  return (
    <section className="card mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center gap-4 p-4">
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
          <h2 className="text-[17px] font-bold leading-tight text-(--color-ink)">{client.name}</h2>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {client.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: "var(--color-canvas-deep)", color: "var(--color-muted)" }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="border-t border-(--color-line) px-4 py-3 text-[14px] leading-relaxed text-(--color-ink-soft)">
        {client.blurb}
      </p>
      {/* Separators run horizontally when stacked and vertically when side by
          side, so the divider follows the layout rather than the source order. */}
      <dl
        className="grid grid-cols-1 border-t border-(--color-line) sm:grid-cols-3"
        style={{ background: "var(--color-surface-sunk)" }}
      >
        {client.facts.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-2.5 border-t border-(--color-line) px-4 py-3 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0"
          >
            <span className="shrink-0 text-(--color-accent)">
              <Icon name={f.icon} size={16} />
            </span>
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-(--color-faint)">
                {f.label}
              </dt>
              <dd className="text-[13.5px] font-bold text-(--color-ink)">{f.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

const LEVEL_FILL: Record<AssessmentFactor["level"], { pct: number; colour: string; word: string }> =
  {
    low: { pct: 28, colour: "var(--color-faint)", word: "Low" },
    medium: { pct: 55, colour: "var(--color-warn)", word: "Medium" },
    high: { pct: 80, colour: "var(--color-deliver)", word: "High" },
    strong: { pct: 96, colour: "var(--color-good)", word: "Strong" },
  };

function Assessment({ factors }: { factors: AssessmentFactor[] }) {
  return (
    <section className="mt-6">
      <h2 className="eyebrow mb-2.5">Where this stands today</h2>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {factors.map((f) => {
          const l = LEVEL_FILL[f.level];
          return (
            <div key={f.label} className="card p-3.5">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-(--color-muted)">
                  <Icon name={f.icon} size={15} />
                </span>
                <span className="flex-1 text-[13px] font-bold text-(--color-ink)">{f.label}</span>
                <span className="text-[11px] font-bold uppercase" style={{ color: l.colour }}>
                  {l.word}
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
              <p className="mt-2 text-[12.5px] leading-snug text-(--color-muted)">{f.note}</p>
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
    <div className="mt-6 grid gap-3.5 lg:grid-cols-2">
      {said && (
        <section
          className="rounded-[14px] border p-4"
          style={{ borderColor: "var(--color-accent-ring)", background: "var(--color-accent-tint)" }}
        >
          <h2 className="eyebrow mb-2 flex items-center gap-1.5" style={{ color: "var(--color-accent)" }}>
            <Icon name="megaphone" size={13} />
            What they said
          </h2>
          <blockquote className="text-[14.5px] italic leading-relaxed text-(--color-ink)">
            “{said.text}”
          </blockquote>
          <p className="mt-2 text-[12px] font-semibold text-(--color-accent-deep)">
            {said.attribution}
          </p>
        </section>
      )}
      {concerns && concerns.length > 0 && (
        <section className="card p-4">
          <h2 className="eyebrow mb-2 flex items-center gap-1.5">
            <Icon name="warning" size={13} />
            Key concerns
          </h2>
          <ul className="space-y-1.5">
            {concerns.map((c) => (
              <li
                key={c}
                className="flex gap-2 text-[13.5px] leading-relaxed text-(--color-ink-soft)"
              >
                <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-(--color-warn)" />
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
    <details className="card group mt-6 overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[13px] font-semibold text-(--color-ink-soft) transition-colors hover:bg-(--color-surface-sunk)">
        <span className="transition-transform group-open:rotate-90" aria-hidden="true">
          ▸
        </span>
        <Icon name="search" size={14} />
        What you found out
        <span className="font-normal text-(--color-faint)">({items.length})</span>
      </summary>
      <div className="space-y-3 border-t border-(--color-line) px-4 py-3.5">
        {items.map((e) => (
          <div key={e.id}>
            <p className="eyebrow">{e.label}</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-(--color-ink-soft)">{e.reveals}</p>
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
      {/* header */}
      <div className="flex items-center gap-3">
        {option.icon ? (
          <IconTile name={option.icon} tone={selected ? "accent" : "neutral"} size={36} />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[14px] font-bold"
            style={{ background: "var(--color-canvas-deep)", color: "var(--color-muted)" }}
          >
            {index + 1}
          </span>
        )}
        <p className="min-w-0 flex-1 text-[16px] font-bold leading-snug text-(--color-ink)">
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

      {/* body: what it is | what it trades */}
      <div className={`mt-3 gap-x-6 gap-y-3 ${hasTradeoffs ? "sm:flex" : ""}`}>
        <p className="flex-1 text-[14px] leading-relaxed text-(--color-ink-soft)">
          {option.description}
        </p>
        {hasTradeoffs && (
          <ul className="mt-3 shrink-0 space-y-1 sm:mt-0 sm:w-[46%]">
            {option.pros?.map((p) => (
              <li key={p} className="flex items-start gap-2 text-[13px] leading-snug">
                <span className="mt-[3px] shrink-0 text-(--color-good)">
                  <Icon name="check" size={12} />
                </span>
                <span className="text-(--color-ink-soft)">{p}</span>
              </li>
            ))}
            {option.cons?.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[13px] leading-snug">
                <span className="mt-[3px] shrink-0 text-(--color-bad)">
                  <Icon name="cross" size={12} />
                </span>
                <span className="text-(--color-muted)">{c}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* footer: what it costs — never what it returns */}
      {(option.cost || option.commits) && (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-(--color-line) pt-3">
          {option.cost && (
            <>
              <CostDots label="Time" value={option.cost.time} />
              <CostDots label="Investment" value={option.cost.investment} />
            </>
          )}
          {/* Full width until there is room beside the dots — squeezed into the
              leftover inches it wraps to two words a line. */}
          {option.commits && (
            <span className="w-full text-[12.5px] leading-snug text-(--color-muted) md:w-auto md:min-w-0 md:flex-1">
              {option.commits}
            </span>
          )}
        </div>
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
              <IconTile name="search" tone={selected ? "accent" : "neutral"} size={34} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="eyebrow">{e.label}</p>
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
                <p className="mt-1 text-[14.5px] font-semibold leading-snug text-(--color-ink)">
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
              <p className="text-[15px] font-bold leading-snug text-(--color-ink)">{c.title}</p>
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
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-(--color-ink-soft)">
              {c.description}
            </p>
            <span
              className="mt-2.5 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide"
              style={{ background: "var(--color-canvas-deep)", color: "var(--color-muted)" }}
            >
              {c.tag}
            </span>
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
      <p className="eyebrow" style={{ color: "var(--color-accent)" }}>
        {mission.eyebrow}
      </p>
      <h1 className="display mt-1.5 text-[30px] text-(--color-ink) sm:text-[36px]">
        {mission.title}
      </h1>

      <div className="mt-4 space-y-3">
        {situation.map((p, i) => (
          <p key={i} className="text-[16px] leading-[1.65] text-(--color-ink-soft)">
            {p}
          </p>
        ))}
      </div>

      {mission.context && mission.context.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {mission.context.map((c) => (
            <span
              key={c.label}
              className="rounded-lg border border-(--color-line) bg-(--color-surface) px-3 py-1.5 text-[12.5px]"
            >
              <span className="text-(--color-muted)">{c.label}: </span>
              <span className="font-semibold text-(--color-ink)">{c.value}</span>
            </span>
          ))}
        </div>
      )}

      {mission.client && <ClientStrip client={mission.client} />}
      {mission.assessment && <Assessment factors={mission.assessment} />}
      <SaidAndConcerns said={mission.saidQuote} concerns={mission.concerns} />
      <Notes discovered={state.discovered} content={content} />

      <div className="mt-8 mb-4 flex flex-wrap items-baseline justify-between gap-3 border-t border-(--color-line) pt-6">
        <h2 className="display text-[22px] text-(--color-ink)">{mission.question}</h2>
        {mission.kind !== "choice" && (
          <span
            className="rounded-full px-3 py-1 text-[12px] font-bold"
            style={{
              background: ready ? "var(--color-accent-tint)" : "var(--color-canvas-deep)",
              color: ready ? "var(--color-accent-deep)" : "var(--color-muted)",
            }}
          >
            {mission.kind === "investigate" ? "Choose" : "Pick"} {need} · {have}/{need}
          </span>
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
