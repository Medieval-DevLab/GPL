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

## Addendum: the promise ledger and endings from content (D-086)

The eight-decision script (`docs/STORY-V2.md`) needs two more engine capabilities.

### Promise ledger

```ts
export interface PromiseRule {
  flag: string;            // the promise card, e.g. "promise:trial"
  due: string;             // shown on the calendar: "Month 2"
  dueMonth: number;        // ordering on the calendar
  voidWhen?: Condition;    // e.g. traded away; then `voided` is shown and nothing is owed
  voided?: string;
  keptWhen?: Condition;    // omitted = always kept
  kept: string;            // the line shown when kept
  lateWhen?: Condition;    // checked only if not kept
  late?: string;
  broken?: string;         // shown if neither kept nor late
  brokenEffect?: Effect;   // default { dims: { win: -3, deliver: -3 }, flags: ["promise:broken"] }
  lateEffect?: Effect;
}
export interface PromiseResult { flag: string; status: "kept" | "late" | "broken" | "void"; line: string; due: string; dueMonth: number }
// Content gains `promises?: PromiseRule[]`; GameState gains `settled?: PromiseResult[]`.
```

When a node with `settle: true` is entered (the script puts it after d8), the engine works
through every rule whose `flag` the player holds, in `dueMonth` order:
- **void** if `voidWhen` holds;
- otherwise **kept** if `keptWhen` holds or is absent;
- otherwise **late** if `lateWhen` holds;
- otherwise **broken**.

It applies the effects, stores `settled`, and does this deterministically: there are no dice.
The release sweep and run codes cover it.

### Endings from content

```ts
export interface EndingRule { id: string; title: string; summary: string; when?: Condition; extras?: { when: Condition; text: string }[] }
// Content gains `endings?: EndingRule[]`, checked in order, last unconditional.
```

`finalVerdict` uses `content.endings` when it is present; the existing logic stays for content
without it. The ending screen shows the title and summary, plus every extra whose `when` holds.

### As built (D-086)

The engine implements the addendum as written, with these extensions. Each one is a superset of
the contract, so content written to the contract above is still valid.

- **`Conditions`.** `voidWhen`, `keptWhen` and `lateWhen` take a condition or a list of conditions,
  all of which must hold. The results clause is kept only with Orion's own figures (one of two
  cards) *and* a plan for the freeze (one of three), and one `any` cannot carry both.
- **`kept` may be a list of lines,** first match wins, the last unconditional, like `advisorLine`.
  The fixed price is always kept, and the calendar says who paid for it.
- **Order.** Rules settle in `dueMonth` order, ties in authored order. Each rule reads the record
  as the rules before it left it, and each effect is clamped as it lands.
- **Once per run.** `settle` may sit on an interlude or on the ending. A run that passes a second
  settle beat does not settle again.
- **`finalVerdict(dims, flags, content?)`** returns `{ title, summary, id?, extras }`.
- **The record board is content too:** `Content.ledger?: LedgerRule[]`. The engine's built-in
  table named the first story's flags.
- **`lockOf(condition, state)`** says why a setting is shut: `needs` (the `all` cards missing),
  `oneOf` (the `any` list, when none is held), `held` (the `none` cards held) and `dims`. The
  interface names these and never works them out.
- **Three content fields.** `Mission.thinkAloud` is the modelled decision's worked example,
  spoken as the last line of the brief. `Chapter.idea` is the act's idea, which every lesson in
  the act carries word for word. `Interlude.reveal` holds the lines a debrief keeps back until the
  act's guess is answered.

**The validator** also checks the following:
- every promise rule's card is set somewhere, and every flag its conditions read is set;
- one rule per card;
- a line for every status the rule can reach (void, late and broken), and none for a status it
  cannot;
- a settle beat exists if there are rules, and rules exist if there is a settle beat;
- endings end unconditionally, and no unconditional ending sits before the last;
- ending ids are unique, and every extra has a condition;
- one idea per act, word for word;
- model, prompt, let go: the first lever decision of an act thinks aloud and gives no hint, the
  second gives exactly one, and none carries a `tip` or an `advisorLine`;
- 40 words of situation on every variant, and 120 before the panel opens.

Once content carries its own board, a flag that decides a branch and is neither a named card nor
a board position is an error.

**The sweep** keys on every flag and bar the calendar and the endings read, from the first decision
on. It records every ending, extra, settled status and calendar line some reachable run reaches,
and any lever that a reachable state leaves with one open setting.

**Run codes** are unchanged in shape. The rules fingerprint adds the promise rules, the ending
conditions and `settle`. Content without them keeps every older fingerprint.
