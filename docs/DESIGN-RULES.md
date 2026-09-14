# GPL design rules

Rules for anyone — human or AI agent — writing content or code for this game.
Where a rule can be checked by a machine, it is, and the check is named.

---

## Purpose

**P1 — It is a learning product, not a simulation.**
Hierarchy is *Learning → Engagement → Fidelity*. When realism and comprehension conflict,
comprehension wins. We are not modelling a business; we are teaching how one works.

**P2 — The player is a newcomer.**
Assume no business vocabulary. Terms like *Rule of 40*, *ROCE*, *CAC*, *NRR*, *EBITDA* are
banned from the player surface permanently. There is no later point at which they become fine.

**P3 — Success is an explainable mental model, not a score.**
A run succeeds if the player can afterwards describe how work moves from client to delivery,
and name one decision that constrained a later one.

**P4 — Respect the player's time.**
Ten missions, ~25 minutes. Any new mission must displace an existing one unless it teaches
something genuinely absent.

---

## Game design

**G1 — Never design an option as "the correct answer".**
`A = timid / B = sensible / C = reckless` is forbidden. If a reviewer can pick the intended
answer from the option text alone, without the scenario, the mission is rejected.
→ *Checked by* `findDominantOptions()` — an option that beats a sibling on all three
dimensions in every case fails the build.

**G2 — Correctness is contextual, resolved by the scenario, never by the option.**
An option carries no intrinsic score. Outcomes are selected by matching conditions against
what the player knows and has already committed to.

**G2a — But the lesson is not contextual.**
Every mission declares one `lesson`. Whichever branch is taken, that objective must land.
The teaching lives in the consequence, never in the scoring.
→ *Checked by* `validateContent()` — a mission without a lesson fails.

**G3 — Never reveal a projected outcome before the decision.**
Before committing, the player may see **cost and commitment** (`commits`). They may never see
predicted effect. No "+12 Winability", no "Risk: Medium", no ⭐ *Recommended*.
→ *Checked by* `validateContent()` — outcome-predicting words in `commits` fail the build.

**G4 — Every decision carries a real trade-off.**
Free, reversible and strictly better is not a decision. Delete it or price it.

**G5 — Every consequence states what changed and why.**
Fixed shape: *what you chose → what happened → why it happened → what is now different.*
"Good choice" is not a consequence.
→ *Checked by* `validateContent()` — missing `headline`, `detail` or `changed` fails.

**G6 — Failure is a branch, never a wall.**
No game over, no dead ends. A poor decision produces a worse position *and* a way forward.
→ *Checked by* the exhaustive sweep — every path must reach the ending.

**G7 — Branches reconverge.**
Fork to change experience, rejoin at the next learning objective. Fully divergent storylines
are unauthorable and unaffordable.

**G8 — Complexity comes from conflicting priorities, not more numbers.**
The way to make a late mission harder is scarcer options and competing goals, never more
metrics on screen.

**G9 — The three dimensions are a tension, not a scoreboard.**
Rendered so the player feels they cannot maximise all three. Never summed into a single
player-facing number.

**G10 — No randomness.**
No dice, anywhere. Uncertainty comes from information the player does not have. This is what
makes every outcome attributable, and attribution is the entire teaching mechanism.
→ *Checked by* the determinism test — repeated sweeps must match exactly.

---

## Engineering

**E1 — The engine is pure, deterministic and headless.**
`(state, content, action) → state`. No `Date.now`, no `Math.random`, no `fetch`, no DOM, no
React inside `src/engine`. A run is reproducible from its ordered list of choices.

**E2 — Game rules never live in UI components.**
A React component renders state and dispatches actions. It does not compute a consequence,
mutate game state, or decide a branch.

**E3 — Content is data, not code.**
Adding a mission must never require editing the engine.

**E4 — Invalid content cannot reach a player.**
Orphan nodes, unreachable outcomes, missing fallbacks, absent lessons and flag typos are
build failures, not review comments.

**E5 — Never invent a number.**
If the engine does not produce it, it is not displayed.

**E6 — Accessibility is a gate, not a phase.**
Keyboard operable, visible focus, `prefers-reduced-motion` honoured, no meaning carried by
colour alone (each dimension has a glyph as well as a hue).
→ *Partly checked by* `verify.mjs` — any control without an accessible name fails.

**E7 — Verify by running, not by claiming.**
A screen is not done when it compiles. It is done when it has been loaded in a real browser
and screenshotted.

---

## The one rule behind most of the others

> **If something goes wrong in month five, the player must be able to trace it to the decision
> that caused it.**

Randomness breaks this. Hidden modifiers break this. Predicted outcomes shown before a choice
break it from the other direction, by removing the decision. Almost every rule above exists to
protect that single property.
