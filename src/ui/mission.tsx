/** The decide screen — the core gameplay surface. One question, a few real options. */

import { useMemo } from "react";

import {
  availableOptions,
  requiredSelectionCount,
  resolveSituation,
  selectableIds,
} from "../engine/engine";
import type { Content, Evidence, GameState, Mission } from "../engine/types";
import { Eyebrow, PrimaryButton } from "./chrome";

/* ─────────────────────── your notes ─────────────────────── */

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
    <details className="card group mb-7 overflow-hidden">
      <summary className="cursor-pointer list-none px-5 py-3.5 text-[13px] font-semibold text-ink-soft transition-colors hover:bg-surface-sunk">
        <span className="mr-2 inline-block transition-transform group-open:rotate-90" aria-hidden="true">
          ▸
        </span>
        What you found out
        <span className="ml-2 font-normal text-faint">({items.length})</span>
      </summary>
      <div className="space-y-3.5 border-t border-line px-5 py-4">
        {items.map((e) => (
          <div key={e.id}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">{e.label}</p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">{e.reveals}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

/* ─────────────────────── option lists ─────────────────────── */

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
    <div className="stagger space-y-3.5">
      {options.map((o) => {
        const selected = chosen === o.id;
        return (
          <button
            key={o.id}
            className="choice"
            data-selected={selected}
            onClick={() => onToggle(o.id)}
            aria-pressed={selected}
          >
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                style={{
                  borderColor: selected ? "var(--color-accent)" : "var(--color-line-strong)",
                  background: selected ? "var(--color-accent)" : "transparent",
                }}
              >
                {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <div className="min-w-0">
                <p className="text-[16px] font-bold leading-snug text-ink">{o.title}</p>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-soft">{o.description}</p>
                {o.commits && (
                  <p className="mt-3.5 border-t border-line pt-3 text-[13px] leading-snug text-muted">
                    <span className="font-semibold text-ink-soft">This costs you: </span>
                    {o.commits}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
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
    <div className="stagger grid gap-3.5 sm:grid-cols-2">
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
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-[11px] font-bold text-white transition-colors"
                style={{
                  borderColor: selected ? "var(--color-accent)" : "var(--color-line-strong)",
                  background: selected ? "var(--color-accent)" : "transparent",
                }}
              >
                {selected ? "✓" : ""}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-faint">{e.label}</p>
                <p className="mt-1 text-[15px] font-semibold leading-snug text-ink">{e.question}</p>
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
    <div className="stagger grid gap-3.5 sm:grid-cols-2">
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
              <p className="text-[15.5px] font-bold leading-snug text-ink">{c.title}</p>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide"
                style={{ background: "var(--color-canvas-deep)", color: "var(--color-muted)" }}
              >
                {c.tag}
              </span>
            </div>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{c.description}</p>
          </button>
        );
      })}
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 rounded border border-line-strong bg-surface px-1.5 py-0.5 font-sans text-[11px] font-semibold text-muted">
      {children}
    </kbd>
  );
}

/* ─────────────────────── the screen ─────────────────────── */

export function MissionScreen({
  mission,
  state,
  content,
  missionNumber,
  totalMissions,
  onToggle,
  onCommit,
}: {
  mission: Mission;
  state: GameState;
  content: Content;
  missionNumber: number;
  totalMissions: number;
  onToggle: (id: string) => void;
  onCommit: () => void;
}) {
  const situation = resolveSituation(mission, state);
  const need = requiredSelectionCount(mission);
  const have = state.selection.length;
  const ready = have === need;
  const optionCount = selectableIds(mission, state).length;

  const hint =
    mission.kind === "choice"
      ? ready
        ? undefined
        : "Pick one to continue"
      : `${have} of ${need} chosen`;

  return (
    <div key={mission.id} className="anim-rise mx-auto max-w-3xl px-5 pb-24 pt-10">
      <Eyebrow>
        Mission {missionNumber} of {totalMissions}
      </Eyebrow>
      <h1 className="display mt-2 text-[34px] text-ink sm:text-[40px]">{mission.title}</h1>
      <p className="mt-3 text-[15px] font-medium text-accent-deep">{mission.objective}</p>

      <div className="mt-8 space-y-4">
        {situation.map((p, i) => (
          <p key={i} className="text-[17px] leading-[1.68] text-ink-soft">
            {p}
          </p>
        ))}
      </div>

      {mission.context && mission.context.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2.5">
          {mission.context.map((c) => (
            <span
              key={c.label}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px]"
            >
              <span className="text-muted">{c.label}: </span>
              <span className="font-semibold text-ink">{c.value}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-9">
        <Notes discovered={state.discovered} content={content} />
      </div>

      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-t border-line pt-7">
        <h2 className="display text-[24px] text-ink">{mission.question}</h2>
        {mission.kind !== "choice" && (
          <span
            className="rounded-full px-3 py-1 text-[12px] font-bold"
            style={{
              background: ready ? "var(--color-accent-tint)" : "var(--color-canvas-deep)",
              color: ready ? "var(--color-accent-deep)" : "var(--color-muted)",
            }}
          >
            {mission.kind === "investigate" ? `Choose ${need}` : `Pick ${need}`} · {have}/{need}
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

      <div className="mt-9">
        <PrimaryButton onClick={onCommit} disabled={!ready} hint={ready ? undefined : hint}>
          Commit
        </PrimaryButton>
        <p className="mt-4 text-[12.5px] text-faint">
          Keyboard: press <Key>1</Key>–<Key>{String(optionCount)}</Key> to choose, <Key>Enter</Key>{" "}
          to commit.
        </p>
      </div>
    </div>
  );
}
