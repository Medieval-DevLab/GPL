# GPL strategy

Synthesis of three independent analyses:
- `docs/DESIGN-LANGUAGE.md` — the visual system the mockups use
- `docs/UI-AUDIT.md` — where the build fails it
- `docs/ENGAGEMENT-MODEL.md` — how learning games engage without condescending
- plus a page-cited reading of `Remember-MPL-Project.pdf` (237pp, the source PRD)

Nothing here is built yet. This is the plan and the open decisions.

---

## 1. The convergent diagnosis

Three sources, examined separately, point at the same thing from three directions:

| Source | Finding |
|---|---|
| The PRD | The loop lost its middle. Intended: Situation → **Explore** → **Think** → Decide → Consequence → Learn → **Progress**. Built: decide → resolving → consequence → lesson. |
| The research | The highest-leverage mechanic available is **predict-before-reveal** — commit a hypothesis, *then* see the result. |
| The mockups | It is a **console**, not a document. The layout exists so you can *work on* a situation before choosing. |

> **The thesis: GPL has no "before". Everything happens at or after the decision.**
>
> That single absence is simultaneously the cohesion problem, the condescension problem
> and the feels-like-a-form problem.

- **Cohesion** fails because a mission with no "before" is just a question, and ten questions in a row are siblings, not a journey.
- **Condescension** happens because with no hypothesis from the player, the only thing the game can do at the consequence is *tell* them. The PRD already specified the fix — *"BEFORE YOU DECIDE: What evidence supports your choice? What assumption are you making?"* (p. 221) — and it was never built.
- **Form-feel** follows because a screen whose only interaction is "pick one and press Confirm" is a form, regardless of its styling. The PRD's rule 1 of 7: **"Never ask a question when we can let the player act"** (p. 183).

The PRD predicted our exact failure in advance:

> *"If we make 21 missions and every mission requires: Read → investigate → decide → outcome → lesson we'll create fatigue."* (p. 182)
>
> *"we will still end up with a polished e-learning quiz"* (p. 170)

We hard-coded that loop for all ten missions.

## 2. What we got right, and should not touch

- **The single-client spine is correct.** The PRD: *"the first four missions one coherent mini-story… the player should finish Mission 4 feeling that they have actually started a client relationship"* (p. 194). Multiple simultaneous opportunities were explicitly removed (p. 185). Cohesion is failing at the **frame and rhythm**, not the spine.
- **Flag-based compounding** is what the PRD specified (p. 176).
- **No-right-answers, enforced mechanically.** PRD p. 169 makes this a hard rule; our `findDominantOptions()` enforces it. Better than specified.
- **The reflection template.** Our `principle / because / watchFor` is exactly the PRD's `principle / takeaway / transferCue` (pp. 222, 226).
- **Determinism, the exhaustive sweep, flag-reference integrity, word budgets.** None specified; all load-bearing.
- **Derived causal threads.** Not in the PRD or the mockups. The best thing in the build.

## 3. The five workstreams

### W1 · Build the "before" — **the priority**
Add a pre-decision beat to every mission. Three candidate mechanics, in order of value:

1. **Predict-before-reveal.** After selecting, before committing: *which of the three will this cost you?* One tap. The consequence then confirms or corrects a claim the player made, which converts the lesson from a lecture into feedback on their own reasoning.
2. **Name your assumption.** Pick from 3–4 assumptions implied by your choice (PRD p. 221). Cheap, and it makes the *reasoning* visible, which is what clinical debriefing (Rudolph et al.) actually works on.
3. **Explore before deciding.** Let the player open parts of the situation — a stakeholder, a document, the history — at a cost. Currently only `m2` does this; the PRD intends it throughout.

This also kills the worst thing in the current UI: a "Things to consider" rail that poses questions and a "Tip" bar that answers them before the player has thought.

### W2 · Break the uniform rhythm
The PRD specifies **twelve** interaction types (p. 219), **nine** mission-specific visual treatments, *"Do not force every mission into cards"* (p. 233), and deliberately uneven mission lengths — quick 2–3 min / standard 5–7 / major 8–12 (p. 182).

We have three interaction kinds and one card layout. Target: 6–7 distinct interactions, each with its own visual treatment. Highest-value additions:
- **Prioritise** (PRD M8) — rank or allocate under a cap
- **Diagnose** — match symptoms to causes
- **Negotiate** — a two-sided exchange, not a menu
- **Sequence** — order the work
- **Recover** — a staged second chance after a bad outcome (PRD pp. 174–175)

### W3 · Restore the frame
The PRD's four screen types (p. 34): **Journey Map / Mission / Outcome / Team-League.** We built one and a half. The Journey Map was called *"probably the most important UI decision"* (p. 27).

- **Chapter 0 — Starting advantage.** Connector / Builder / Challenger (pp. 68, 80, 124). *"Starting with a 'beginning state' is much stronger than starting with a tutorial"* (p. 55).
- **Journey Map** as the home surface, with a persistent journey bar.
- **Milestones and unlocks** — FIRST LEAD … FIRST DELIVERY (p. 224), "NEW AREA UNLOCKED" (p. 101). Chapter interludes are not a progression system.
- **The deal decision.** PRD M17: *"DO WE TAKE THE DEAL? Proceed / Modify / Walk away"* (p. 132) and *"Walking away must sometimes be a good decision. Otherwise the game teaches: Always accept the contract."* (p. 132). **We have no "did we win it?" beat at all** — the contract is signed inside m9's outcome prose.
- **Scaffolding that is felt.** *"The UI evolves with the player"* (p. 34); Guided → Assisted → Trade-offs → Dynamic → Autonomy. Chapter 1 and Chapter 5 currently present identically.

### W4 · Rebuild the visual system as a console
From `UI-AUDIT.md`, in dependency order:
1. **Console frame** — the app as one inset rounded panel (cheap, changes the register immediately)
2. **Options as side-by-side columns** with full-width card buttons — the single biggest feel change
3. **Fit a mission to one screen**, no scrolling
4. **Polychrome icons** — colour assigned per meaning
5. **Sentiment-tinted panels** — rose for concerns, lavender for voice
6. **Drop the serif.** No mockup contains one; I introduced Fraunces and never checked.
7. **Figure/ground** — white rails, tinted working area (we have it inverted)
8. **Cut ambient motion** — keep motion that answers an action
9. **Imagery** — see open decision D4

### W5 · De-condescend the surface
Re-skin the furniture as work artefacts, not lesson artefacts:

| Now | Becomes |
|---|---|
| "Your objective" | cut — the headline already says it |
| "Estimated time: 4 min" | cut, or a diegetic clock ("board meets in three weeks") |
| "Tip: there is no single right answer" | **cut.** The narrator telling you how to feel. |
| "Things to consider" | a named colleague's open questions |
| "Learning in progress" | your file — facts you paid for |
| "Advisor" | a partner with her own agenda, who can be wrong |
| "The point" lesson screen | confirmation of a claim the player committed |
| Badges | candidate for replacement by a diegetic ledger — see D3 |

Also: make the cast **continuous**. The PRD specifies stakeholders with `priority / concern / influence / currentSentiment` moving Concerned → Advocating (p. 218). We have five advisors, one line each, who never reappear. Elena and Marcus — the two people who actually decide this deal — exist only as investigation text.

## 4. Sequencing

**Phase 1 — Prove the feel on one mission.** Rebuild `m4` alone as a console: columns, one screen, predict-before-reveal, polychrome icons, no tip, no objective rail. Screenshot it beside the mockup. **Do not touch the other nine until this is agreed.** Every previous attempt failed because I changed all ten at once and the direction was wrong.

**Phase 2 — Frame.** Chapter 0, Journey Map, milestones, the deal decision, the recovery beat.

**Phase 3 — Rhythm.** New interaction types, uneven mission lengths, per-mission visual treatments.

**Phase 4 — Scaffolding and replay.** UI that evolves, end-of-run "how you played", replay through knowledge.

## 5. Proposed agent roster

Six project-local agents in `.claude/agents/` (plugin installs are blocked by org policy, so we build our own):

| Agent | Job | Tools |
|---|---|---|
| `gpl-design` | Owns `DESIGN-LANGUAGE.md`. Implements UI against the mockups; refuses changes that drift. | read/write/edit, bash |
| `gpl-visual-critic` | **Read-only.** Screenshots a screen, puts it beside the named mockup, reports the delta zone by zone. Never edits. | read, bash, glob |
| `gpl-content` | Writes missions inside the word budgets and the no-leak rules. Owns `story.ts`. | read/write/edit |
| `gpl-engine` | Engine, validator, analysis. Guards determinism and purity. | read/write/edit, bash |
| `gpl-pedagogy` | **Read-only.** Audits against `ENGAGEMENT-MODEL.md` and the PRD quotes — flags condescension, lesson labels, praise inflation, fake choices. | read, grep, glob |
| `gpl-verify` | Runs typecheck/tests/build and both browser passes; reports failures with evidence. | bash, read |

The two read-only critics matter most. Every failure in this project so far was caught by *looking*, never by tests — and I am unreliable at judging my own output against a reference.

## 6. Locked decisions

Answered 2026-09-15. These govern everything downstream.

**D1 · The player is a first-time pursuit lead.** You have just been handed your first
client to win. This resolves the condescension problem structurally rather than
cosmetically: a colleague briefing a new lead is **onboarding, not patronising**, so the
advisory furniture can be *re-framed and attributed* instead of deleted. It also gives
the run a growth arc, and it gives the advisors a reason to exist.

Consequences: every piece of advice must come **from a named person with a stake**, never
from the interface. "Tip:" becomes Priya saying something. The UI never speaks.

**D2 · ~15 decisions plus the frame.** Roughly 70 minutes. Keep the ten built missions,
restore the framing beats, and add back the decision missions the PRD names and we cut:

| Add | PRD | Why |
|---|---|---|
| Chapter 0 — starting advantage | pp. 68, 80, 124 | ownership before tutorial (p. 55) |
| Prioritisation | M8 | "we can't do everything" |
| Innovation / creative | M12 | "no single obvious button" |
| Solution review | M13 | the three dimensions revealed together |
| Capacity problem | M18 | delivery is currently one beat |
| Unexpected situation | M19 | the event engine, felt once |
| **The deal decision** | M17, p. 132 | proceed / modify / **walk away** |
| A recovery beat | pp. 174–175 | failure currently has no second chance |
| Milestones + unlocks | p. 224, p. 101 | progression the player can feel |
| Journey map | p. 27, p. 34 | *"probably the most important UI decision"* |

**D3 · Build all three read-outs.** Score, badges *and* a diegetic ledger. They are not
actually in conflict once each is given a distinct job:

| System | Job | Where |
|---|---|---|
| **Ledger** | the primary in-world read-out — margin spent, hours owed, people committed, reputation | always visible, in the console |
| **Score** | coarse progress, mockup fidelity | top bar |
| **Badges** | an account of *how* you played | **the debrief only, never mid-run** |

Moving badges to the debrief is what defuses the praise-inflation objection: recognition
delivered at the end reads as an account of your play, not a pat on the head between
missions.

**D4 · Reuse the mockup photography.** Crop the hero shots, client storefronts and
advisor portraits out of the mockup PNGs and commit them. Confirmed as licensed and
appropriate for the product. This unblocks W4's imagery gap immediately and is the
fastest route to mockup fidelity.

Budget rule: the bundle is currently 101 kB gzipped. Images are separate assets, lazily
loaded, and must not block first paint.
