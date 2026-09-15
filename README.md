# GPL

**A short, single-player game about how work actually moves through a consulting firm.**

You have just been handed your first client to win. A company you have never met is about
to become a promise someone has to keep. Sixteen decisions stand between those two things.
Roughly 70 minutes, start to finish.

```
Client → Lead → Opportunity → Solution → Deal → Delivery
```

---

## Play it

```bash
npm install
npm run dev          # http://localhost:5173
```

Ship it anywhere that serves static files:

```bash
npm run build        # → dist/
npm run preview      # serve dist/ at :4173
```

No backend, no database, no accounts. Progress is saved to `localStorage`.

---

## What it is

A learning game, not a business simulation. The complexity lives under the hood; the surface
stays simple enough that someone with no business background can start playing immediately.

**Three questions, in tension.** Every engagement is judged on *Winability* (can we win it?),
*Profitability* (should we?), *Deliverability* (can we actually do it?). You cannot max all
three. Finding out which one gives is the game.

**No right answers.** Options are different strategies, not a quality ladder. The same move
is strong in one situation and weak in another, depending on what you know and what you already
committed to. There is a mechanical test for this — see *no fake choices* below.

**No randomness at all.** Nothing rolls dice. Uncertainty comes from information you do not
have, never from luck. That is a deliberate design choice: it means every outcome is fully
attributable, so the game can always tell you *exactly* why something happened. A game that
teaches through consequence cannot afford results the player can dismiss as bad luck.

**Decisions compound.** What you learn in mission 2 changes what is possible in mission 7, and
what you promise in mission 8 arrives on your desk in mission 10. The closing debrief shows
the causal chains you personally created.

---

## How it is built

```
src/
  engine/          pure, deterministic, headless — no React, no DOM
    types.ts       content + state types
    engine.ts      the reducer, outcome selection, verdict, causal threads
    validate.ts    content rules, enforced mechanically
    analysis.ts    exhaustive playthrough sweep + dominance detection
    engine.test.ts 30 tests
  content/
    story.ts       chapter 0 + sixteen missions, five chapters — data, not code
  ui/              React. Renders state and dispatches actions. No game rules.
    shell.tsx      the persistent frame: stepper, rails, action bar
    mission.tsx    the briefing and the option cards
    consequence.tsx  resolving → what happened → what it teaches
    screens.tsx    title, chapter interludes, closing debrief
    icons.tsx      inline SVG. No icon library, no image assets, no requests.
tools/
  verify.mjs       plays a full run in a real browser and screenshots every beat
```

The split is the important part. `src/engine` is a pure function of
`(state, content, action) → state`. It has no imports from React, no `Date.now`, no
`Math.random`, no `fetch`. Every screen is a projection of engine state, and a whole run is
reproducible from the ordered list of choices.

### Three layers of verification

| Layer | Command | Catches |
|---|---|---|
| Types | `npm run typecheck` | the usual |
| Content + engine | `npm test` | broken narrative, unreachable outcomes, fake choices |
| Real browser | `npm run verify` | screens that do not render, dead ends, console errors, a mission that does not fit one screen |

`npm run validate` runs typecheck + tests + build together.

**`npm test` is doing more than it looks like.** It exhaustively enumerates every reachable
game state (deduplicated on flags, which is exact here because no branch gates on a numeric
value) and then asserts:

- every authored outcome fires on some path — no dead content
- every option is reachable
- every situation variant fires
- **no fake choices** — no option beats a sibling on all three dimensions in every case
- specific causal chains actually work, e.g. *discounting in mission 8 must make the mitigation
  in mission 9 unaffordable, which must then bite in mission 10*

That last group is the real test suite. It checks the pedagogy, not the plumbing.

**`npm run verify`** needs the app running (`npm run dev` in another terminal), then plays a
complete sixteen-mission run in headless Chromium, screenshots every beat into
`docs/screenshots/`, and fails on any console error, any unreachable control, any briefing
missing part of the game shell, a Commit that was not gated on a prediction, an
unattributed "Tip.", a broken image, or any button without an accessible name.

It also enforces the console rule — **a mission must fit one screen** at the reference
height, measured rather than eyeballed.

```bash
GPL_VIEWPORT=1440x1024 npm run verify    # the reference window; enforces the fit rule
GPL_VIEWPORT=390x844 npm run verify      # phone-width pass → docs/screenshots-390/
npm run verify http://localhost:4173     # against the production build
```

---

## Editing the story

All content is in `src/content/story.ts` as typed data. Adding or changing a mission never
requires touching the engine.

One `setup` node (chapter 0 — the starting advantage) and three kinds of mission:

| Kind | The player… | Example |
|---|---|---|
| `choice` | picks one of 3–4 strategies | *Who do you go after?* |
| `investigate` | spends limited slots on what to find out | *You can look into two things. Not five.* |
| `build` | assembles from components, or prioritises under a cap | *Pick three things for the proposal* |

An `Outcome` may also carry its own `next`, which lets a branch divert the whole game —
that is how walking away from the deal actually ends the pursuit instead of politely
continuing to delivery.

Every mission also carries its briefing. These are **required** — the shell renders each one
unconditionally, so a missing field is a hole in the screen, not a graceful degradation:

| Field | Renders as |
|---|---|
| `eyebrow`, `minutes` | the label above the headline, and the time estimate in the rail |
| `objective` | "The brief" in the left rail |
| `advisor` | a named colleague, with their photograph and a line of dialogue |
| `consider` | the open questions that colleague is asking — never answers (min. 2) |
| `tip` | their practical steer, in the action bar, attributed to them by name |
| `prompt` | one line under the question, telling the player how to read the options |
| `client`, `assessment` | the client profile strip and the factor bars *(optional)* |
| `saidQuote`, `concerns` | "What they said" and "Key concerns" *(optional)* |

Options carry `icon`, `pros`, `cons` and a `cost` of `{ time, investment }` on a 1–3 scale.
All of those describe the **approach and what it costs** — never the result. Pros without
cons fails the build, because a one-sided card presents itself as the right answer.

An outcome is chosen by matching `when` conditions against accumulated flags — **first match
wins, and the last outcome must be unconditional**. That is how the same option produces a
different result for different players:

```ts
outcomes: [
  {
    id: "m6-real-evidenced",
    when: { all: ["knows:real_pain"] },      // you did the discovery
    tone: "strong",
    headline: "You show them their own data, and the room changes.",
    // ...
  },
  {
    id: "m6-real-hunch",                      // fallback: right, but unprovable
    tone: "mixed",
    headline: "You are right, and you cannot prove it.",
    // ...
  },
],
```

The validator will reject content that breaks the rules — including a condition that reads a
flag nothing ever sets, which is otherwise a silent failure that just quietly stops the game
teaching.

Rules for authors are in [`docs/DESIGN-RULES.md`](docs/DESIGN-RULES.md).
Why things are the way they are is in [`docs/DECISIONS.md`](docs/DECISIONS.md).

---

## Deliberately not here

Multiplayer, teams, a facilitator console, accounts, a backend, analytics, an LMS integration,
XP, coins, levels, energy, timers, or a persistent economy. Several of those may be worth
adding; none of them was worth adding *before* the core loop was proven to be fun and to teach.

---

## Commands

| Command | Does |
|---|---|
| `npm run dev` | dev server |
| `npm test` | engine + content + pedagogy tests |
| `npm run typecheck` | types |
| `npm run build` | production build to `dist/` |
| `npm run preview` | serve the production build |
| `npm run verify` | full playthrough in a real browser + screenshots |
| `npm run validate` | typecheck + test + build |
