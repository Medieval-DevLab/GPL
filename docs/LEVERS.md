# Lever decisions: the contract (D-084)

This is the shared specification for the new decision unit in `STRATEGY.md`. The engine
implements it, the content uses it and the interface renders it. Change it only by a decision
in `DECISIONS.md`.

## What a lever decision is

A decision is two or three **levers**. Each lever is one small choice with one cause, and the
player sets one option on every lever before committing. Example:

> **How do we answer on price?**
> - *Price:* hold · meet them halfway · match the cheaper bid
> - *What's included:* everything · drop the training · drop the pilot
> - *In return we ask for:* nothing · a longer contract · a named Operations lead

## Data shape (`src/engine/types.ts`)

```ts
export interface LeverOption {
  id: string;              // unique across the whole mission
  label: string;           // ≤ 6 words, a plain verb phrase or value
  detail: string;          // ≤ 14 words: what we would actually do
  dims?: Partial<Record<DimensionId, number>>;   // the immediate effect of this setting
  flags?: string[];        // cards this setting puts in your hand (promises included)
  requires?: Condition;    // locked unless held; the UI names the missing card
  say?: string;            // optional: what the player says to the client, ≤ 20 words
}

export interface Lever {
  id: string;
  label: string;           // ≤ 4 words: "Price", "What's included"
  options: LeverOption[];  // 2–3 options
}

export interface LeverMission extends MissionBase {
  kind: "levers";
  levers: Lever[];         // 2–3 levers
  outcomes: Outcome[];     // read the flags the settings set, plus earlier flags; last is unconditional
}
```

## How it resolves (the engine)

1. **Selecting.** `toggleSelection` on a lever option selects it and deselects any other option
   of the same lever. `canCommit` is true when every lever has exactly one selection.
2. **Committing.** The engine applies, in this order:
   - each chosen option's `dims` and `flags`, in lever order;
   - the first outcome whose `when` holds, read *after* the settings are applied;
   - that outcome's `effect`.
   
   The usual resolution, history, record and run code follow.
3. **Telegraphing.** `leverTouches(option)` returns the sign of each `dims` entry. The UI shows
   which bars a setting moves, and in which direction. This is the immediate, deterministic
   effect of the setting itself, not a preview of the outcome, so it does not break G3.
   Outcomes stay unpreviewed.
4. **History.** `chosenIds` are the chosen option ids, in lever order. `chosenLabel` is the
   chosen labels joined with " · ".

## Rules the validator enforces

- 2–3 levers, each with 2–3 options; option ids unique within the mission.
- Every outcome list ends with an unconditional outcome.
- **No dominant setting:** within a lever, no option may beat a sibling on all three bars by
  its `dims` alone, the lever-level version of the fake-choice rule.
- **No dead flags:** every flag a lever option sets is read somewhere later, or is a named
  card in `gates.ts`.
- Budgets: `label` ≤ 6 words, `detail` ≤ 14 words, lever `label` ≤ 4 words, `say` ≤ 20 words.
- The exhaustive sweep enumerates every combination of settings: at most 3 × 3 × 3 = 27 per
  decision.

## How the interface shows it

A lever decision is a control panel in the decision's own medium:
- a research board in act 1;
- a staffing board in act 2;
- a contract with clauses in act 3;
- a delivery calendar in act 4.

Each lever is a row of segmented options. Each option shows its detail line, and a dot for each
bar it moves (▲ or ▼). The cards it adds are shown as small chips, and a locked option names
the card it needs. The commit bar lists the settings in one line: "Hold · Drop the pilot ·
Ask for a named lead".
