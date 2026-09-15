# Decision log

Every non-obvious call made while building GPL, why it was made, and what it cost.
Newest first. Superseded direction is kept rather than deleted — knowing what was rejected,
and why, is most of the value of a log like this.

---

## D-033 · Density is a measured band, not a judgement — `docs/DENSITY-FRAMEWORK.md`
"Screens are too densely packed" was unfalsifiable, so `tools/measure.mjs` was pointed at a
real playthrough and the framework it referenced was written against the output. The
baseline, at 1440×1024: **419 words** average on a decide screen (max 499), **12 panels**
(max 16), **8–11 distinct type sizes** per screen and 12 across the game, **4 weights**, up
to **12 fill colours**, fill-coverage index **0.84**. Targets set at ≤220 words, 4–6
top-level regions, 4–5 type sizes, 3 weights, ≤5 fills, ≥35% air, ≥55% of words inside the
decision object, 5 reading stations.

Two findings changed the direction of the fix. **The option count is not the problem** —
Scheibehenne's meta-analysis puts the pooled choice-overload effect at ~0 and Chernev's
moderators (time pressure, hard-to-compare options, preference uncertainty, no commitment)
are all absent here, so 3–5 side-by-side options are defensible and cutting them would
breach G1 and G4 for nothing. And **not one of nine comparable games shows a full briefing
alongside its options**: Reigns, CK3, Frostpunk, Slay the Spire and the rest all occlude,
pause or collapse the world at the moment of choice. Fitting the briefing and the decision
on one screen simultaneously is the structural cause, and E7a is what made it look solved.

Where the research gives no number — words per screen, panels per view, type-size count —
the document says so and labels the target a defensible default derived from reading rate
(238 wpm, Brysbaert 2019) and chunk limits (≈4, Cowan 2001) rather than a finding.
**Cost:** nothing yet; it is a standard, not a change. Every band is reversible by editing
one table, but the numbers should not move to accommodate a screen that fails them.

## D-032 · The lesson screen is deleted; the colleague says it instead
Two independent critics landed on the same thing. Sixteen full screens carrying a moral
in 26px bold under the caption **"Next time."** — no speaker, no artefact, no interaction,
nothing to disagree with. `ENGAGEMENT-MODEL.md` had specified that this screen become "a
claim the player commits, then has confirmed"; instead the `"The point"` eyebrow was
removed and the screen it captioned was kept. That beat was where the feeling of being
lectured at actually lived.

The `lesson` phase is gone. `principle` and `because` now appear on the consequence
screen under the portrait of the colleague who briefed you, in quotation marks, as their
read on what just happened. Same words; the difference is that a named person with a job
and a stake is saying them about a specific event.

This collapsed three separate findings at once. With no lesson screen there is no "Next
time." box re-issuing the question the rail asked before the decision, and no third and
fourth delivery of the same sixteen sentences in the debrief — so **"What this run
taught"** was deleted from the ending too, where it had listed every principle a fourth
time under the most schoolroom heading in the build.
**Cost:** one phase, the `watchFor` field's prominence, and a rewrite of the harness.

## D-031 · The prediction gate asks which dimension moves LEAST
It used to ask which one this would *hurt*. That question has no answer on the **27 of 85**
outcomes where nothing goes backwards — including the best branch of nine missions — so on
most of the game's good beats the player's committed claim was silently discarded and
replaced with "Nothing went backwards. That is rarer than it should be." A compliment,
in place of the one mechanic the research calls the highest-leverage change available.

"Which moves least" is always answerable, so the gate now pays off on every beat.

## D-030 · Advice has to be a stake, not an answer
Attributing the steer to a named colleague fixed the label and not the semantics. On
mission 1 Priya appeared three times on one screen: quoted in the left rail, *"Priya is
asking"* with three open questions in the right rail, and *"Priya:"* in the action bar
answering them. She asked "Is the biggest number the best opportunity?" and then told the
player "there is no perfect client — weigh what they need against what you can
demonstrate." One character interrogating and then patronising the player in the same
breath is worse than an unattributed Tip, not better.

Every `tip` is now a **stake**: a partial, arguable view from someone with skin in the
game. *"I put Meridian forward last year and it never closed. I would still take it."*
*"I have walked away from one deal in nine years. I think about it more than the ones I
signed."* None of them resolves the rail's questions.

Also: `advisorLine` lets a colleague say something specific to the mission at hand. Aisha
was repeating one sentence about the proposal across four consecutive screens, including
the one where the sponsor resigns and the proposal is not in question. Frozen is not the
same as consistent.

## D-029 · The debrief ring shows balance, not a grade
The mockups put a letter grade in a circular progress ring, and the PRD does the same
("Round Grade B+"). `docs/ENGAGEMENT-MODEL.md` rejects an end-of-run grade outright — it
invites the player to optimise the grader instead of reading the world.

We kept the geometry and dropped the letter: three concentric arcs, one per dimension,
with the run's score in the middle. It says more than a grade would, because you can see
at a glance *which one took the strain* rather than being handed a verdict on yourself.

## D-028 · Chapter 0 is its own node kind, not a mission
The starting advantage has nothing to resolve and nothing to teach yet, so routing it
through `commit` would have produced an empty consequence beat and a meaningless lesson.
It is a `setup` node with its own phase and a `chooseSetup` action.

Each advantage grants a flag that real conditions later read — a Connector starts with
`credibility`, so they walk into the competitor mission already able to hold their nerve;
a Builder starts with `has:data`, which is what makes an outcome-based deal honest in
`m6b`. The choice therefore keeps mattering rather than being flavour.
**Cost:** the sweep has to branch on it, and `playScript` needed an advantage parameter.
It also sits outside the chapter stepper, so `validate.ts` exempts it from the chapter
check. PRD p. 55: "starting with a beginning state is much stronger than starting with a
tutorial."

## D-027 · A truncated sweep now throws instead of continuing
Adding six missions pushed the exhaustive sweep past its frontier ceiling at mission 10 of
16. It carried on regardless and reported four perfectly reachable outcomes as dead
content — a false alarm that cost real time to diagnose.

Two changes. The dedup key now uses only flags that some condition READS, and only those
read by the current mission **or a later one**: `knows:real_pain` matters up to the
solution missions and is inert afterwards, so carrying it past that point splits states
that can no longer behave differently. Both exclusions are exact, and together they took
the peak frontier from 60,000-capped to a true 19,836 — the sweep also got 10× faster.

And the cap now **throws**. A sweep that has been cut short makes every "is this
reachable?" answer unsound, so silence is the one thing it must not do. If it fires, the
fix is to narrow the key further, not to raise the ceiling.
**Also:** the frontier is grouped by node each round, because a branch can now divert the
whole game and states can sit at different nodes simultaneously. The old loop sampled one
state and assumed the whole level was at the same node.

## D-026 · Option cards are laid out on a CSS subgrid
Columns alone did not deliver the cross-comparison that F2 exists for. A two-line title in
one card pushed its checklist 36px below its neighbours', so the eye could not read across
a row — the critic measured checklist row 1 starting at y≈557/557/573/**593** on mission 8.

Each card is now `grid-row: span 6; grid-template-rows: subgrid` against a parent
declaring `repeat(6, auto)`: media, title, blurb, checklist, cost, button. Every card's
checklist and button now sit on a shared baseline whatever the text length.
**Cost:** the card is locked to six rows, so adding a section means touching `CARD_ROWS`
and every card kind. Worth it — this is the mechanism the whole layout is for.

## D-025 · Advice is attributed, but it keeps the mockups' slot
The mockups carry an unattributed "Tip" in the action bar on every decision screen. The
research says that furniture is the condescension, and removing it left the action bar 90%
empty — a case of fixing the tone by breaking the layout.

Resolution: keep the mockups' treatment exactly — portrait, label, two lines, bottom-left
of the action bar — and make the label **a person's name**. "Tip: there is no single right
answer" becomes *Riya: "No single right answer. Weigh the value against what you would risk."*
Same words, same slot, and the interface no longer speaks in its own voice.
Also: "Your objective" became **"The brief"**, and the discovered-evidence accordion moved
out of the centre column into the rail as **"Your file"** — reference material on the desk,
present and never tested.

## D-024 · The fits-one-screen rule is enforced at 1440×1024, not 900
The mockups are drawn for a 1536×1024 window and their densest briefing needs ~835px of
working area. At 1440×900 the console leaves ~745px. Matching their type and image scale
and fitting a 900px window are mutually exclusive — the first attempt fitted 900 by
rendering everything 15–35% smaller than the reference, which the critic correctly called
"a miniature of the mockup with the furniture removed".

We chose the reference scale. `verify.mjs` enforces the fit rule at heights ≥1000px, and
below that the working area may scroll **inside** the console — the chrome never moves, so
the console still reads as an instrument rather than a page.
**Cost:** a 900px-tall laptop scrolls on the three densest missions.
**Reversible:** yes, by shrinking the scale again, at the price of the miniature problem.

## D-023 · The mockup photography is reused, extracted by a committed script
`tools/extract-art.py` crops 22 images out of the mockup PNGs into `public/art/` — hero
shots, client premises, option-card scenes, advisor portraits. 139 kB total as WebP.
Confirmed licensed and appropriate for the product (STRATEGY.md D4). This closes
`UI-AUDIT.md` finding F3: a quarter of the pixels above the fold in every mockup are
photographic and we had none.

The first version detected photographs automatically — the UI is flat, photographs are
colourful. It failed: these renders are heavily desaturated (mean saturation 0.05–0.10,
barely above the flat purple chrome), so the mask came out sparse and morphological
closing merged three separate option-card photos together with the panel between them.
Replaced with a hand-written manifest of crop boxes plus a **contact sheet** that gets
looked at. Two passes were needed — the first left stray UI in nine crops (headline
fragments, the purple quote rule, a "Recommended" ribbon).
**Cost:** boxes are hand-maintained and tied to the mockups' 1536×1024 coordinates.
**Constraint:** images are separate lazily-loaded assets and must never block first paint.

## D-022 · Six project-local agents, because plugin installs are blocked
`claude plugin install` refuses every plugin in `claude-plugins-official` — blocked by
organisation policy. So the review system is built in-repo as `.claude/agents/`:
`gpl-design`, `gpl-content`, `gpl-engine`, `gpl-verify`, and two **read-only** critics,
`gpl-visual-critic` and `gpl-pedagogy`.

The read-only critics are the point. Every genuine failure on this project was caught by
looking at a rendered screen — never by a test — and the author of a change is unreliable
at judging it against a reference. The critics cannot edit, so they cannot rationalise.
Anthropic's own `frontend-design` skill was read from a local clone as a reference; it
names five traits that mark a design as AI-generated and we exhibited all five.

## D-021 · The player is a first-time pursuit lead
The source PRD is team-based end to end and **never defines a single-player role**; when
MPL became GPL nobody decided who the player is, and the build inherited no answer.
This was the root of "it doesn't feel cohesive".

Naming the role as *newly handed your first client to win* resolves the condescension
problem structurally rather than cosmetically: a colleague briefing a new lead is
onboarding, not patronising. So the advisory furniture gets **attributed** rather than
deleted — every piece of advice comes from a named person with a stake, and **the
interface never speaks**. "Tip:" becomes Priya saying something.

## D-020 · Scope goes back up to ~15 decisions plus the frame
D-006 cut 21 missions to 10. A page-cited reading of the PRD shows **what was cut was
mostly frame, not repetition** — Chapter 0's starting advantage, the journey map,
milestones and unlocks, the deal decision (*"Walking away must sometimes be a good
decision. Otherwise the game teaches: Always accept the contract"*, p. 132), and the
recovery beat. Those beats are short; cutting them removed the game's spine while leaving
ten interchangeable question screens.

Restoring them plus five named decision missions (prioritisation, innovation, solution
review, capacity, unexpected situation) lands at ~15 decisions / ~70 min.
**Supersedes D-006.**

## D-019 · Pre-decision copy is on a word budget, enforced by the build
Colour alone did not fix "too much text", because the problem was the text. Counting the
mockups: an option card there is an icon, a three-word title and **one short sentence**.
Ours were a two-line description, four bulleted clauses, a commitment sentence and a cost
row — roughly 60 words each, ~240 on a four-option screen.

`BUDGET` in `validate.ts` now caps every string the player reads *before* deciding:
situation 55 words total, description 18, pros/cons 6 each and at most two of each,
consider 13, tip 20, assessment note 11, concern 11, client blurb 20, commits 14.
Over budget is a build error naming the field and the count, which turned the content
rewrite into a worklist rather than a judgement call.

Two matching UI changes: **pros and cons render as tinted chips**, not bulleted sentences —
at six words they are tags, and a row of green-then-red chips is read in one pass. And
`commits` now appears **only on the selected card**, which is a two-step commit and keeps
three unread commitment lines off the screen.

**Outcome prose is deliberately not budgeted.** The consequence screen has nothing else on
it, and that text is the teaching.
**Cost:** writing is harder, and some nuance went. That is the trade — the nuance was not
being read.

## D-018 · Colour carries hierarchy, so the page can be scanned instead of read
"It feels like I have to read everything" was the symptom. The cause was that every
label on the page was the same faint grey uppercase `.eyebrow`, every card was white on
near-white, and every icon was grey — so nothing had more weight than anything else and
the only way to find information was to read all of it.

Four changes, taken from the mockups:

1. **`.eyebrow` is now reserved for the kicker above a headline.** Section headings are
   `.section-title` — dark, bold, with a coloured icon beside them. This is most of the win.
2. **`.chip` — a filled status pill.** Assessment levels, client tags, badges and the
   selection counter are now tinted chips. A chip is read in peripheral vision; coloured
   body text still has to be read word by word.
3. **`--color-panel` for regions.** Both rails and the client fact strip sit on it, so
   "supporting information" is distinguishable from "the thing I am deciding" without
   reading either.
4. **Icons are purple by default**, semantic where it means something (green good, amber
   warn, red bad). Every semantic colour gained a `-tint` so it can fill a chip.

Also: the brief became **one card with divided bands** instead of six floating cards, and
option cards put pros beside cons rather than stacked — stacked, a four-item list made
every card 60px taller than its content needed.

**Cost:** more colour to keep disciplined. The guard is that every tint is a token, and
`Pill`/`SectionTitle` are the only ways to apply them.
**Not adopted from the mockups:** photographs, tab strips, and per-option impact previews.
The last of those would breach G3.

## D-017 · A sticky action bar cannot be a grid item
The confirm bar is `position: sticky; bottom: 0`. Placed inside the layout grid it never
pinned, because a sticky grid item is constrained to its own grid area and that area is
exactly the item's height — no room to move. It now sits outside the grid, as a sibling,
where its containing block is the page.
**Related:** on a phone the rails stack *after* the mission (`order-2`/`order-3`), because
rails-first pushed the headline half a screen down.

## D-016 · Screenshots un-stick sticky elements before capture
A full-page Playwright capture resolves `position: sticky` against the viewport, so the top
bar and the confirm bar landed in the middle of the image, on top of real content. That is
indistinguishable from a layout bug and cost real time. `shot()` now walks the DOM, drops
anything computing to `sticky` into `position: relative`, captures, and restores.
**Cost:** the screenshots no longer show what the bars look like while pinned. Worth it —
the alternative was a false positive on every single frame.

## D-015 · Pros/cons must come in pairs, and everything pre-decision is leak-checked
Option cards now carry `pros`, `cons` and a `cost` of time/investment. That is a lot of new
surface on which to accidentally tell the player the answer, so the validator was widened:
`description`, `pros`, `cons`, `tip`, `objective` and every `consider` line are scanned for
outcome-leak terms, and an option listing pros without cons (or the reverse) is an error —
a one-sided card presents itself as the right answer.
**Cost:** writing options is slower. That is the point.

## D-014 · The game frame is the product, not the page
"This feels like a form, not a game" was correct. A centred column of text with radio
buttons is a questionnaire no matter how good the writing is. The shell now carries a
chapter stepper, a live score, a left rail (chapter, mission checklist with ticks,
objective, estimated time, a named advisor with a line of dialogue) and a right rail
(the three factors, open questions, recognitions earned). The centre column is the only
thing that changes between beats.
**Deliberately not copied from the mockups:** their density. No photographs, no per-option
impact previews (those would leak the outcome), no team panel — this is single-player.

## D-013 · Missions carry a briefing, and the validator requires one
`eyebrow`, `minutes`, `tip`, `advisor` and at least two `consider` lines are now *required*
on every mission, plus optional `client`, `assessment`, `saidQuote` and `concerns`. The shell
renders each of these unconditionally, so a missing one is a visible hole rather than a
graceful degradation — better to fail the build.
**Why two consider lines minimum:** one reads as an instruction. Two read as a genuine
tension the player has to resolve.

## D-012 · Causal threads are derived, never authored per-run
The closing debrief shows the specific chains the player created ("you met them on price →
you could not fund the mitigation → month five went underwater"). Each thread declares the
outcomes that must *both* have fired before it can appear, so a thread can never claim a
causal link the player did not actually cause. No generated prose, no approximation.
**Cost:** threads must be hand-written per pairing. Nine exist; more can be added cheaply.

## D-011 · No `motion` / animation library
Considered `motion` (the framer-motion successor, React 19 compatible). Skipped. Every beat
this game needs — meter fill, staggered reveal, card lift, the resolving shimmer — is a CSS
transition or keyframe. Adding a 30 kB animation runtime to avoid writing twelve lines of CSS
is a bad trade in a game whose entire bundle is 94 kB gzipped.
**Reversible:** yes, trivially, if card-stack gestures are ever added.

## D-010 · Stylesheet must use explicit cascade layers
Found via screenshot, not via types: the "Begin" button rendered with dark text on purple.
Cause — a bare `button { color: inherit }` in base CSS is *unlayered*, and unlayered CSS
outranks every layered Tailwind utility, so it silently beat `text-white`. All base styles
now live in `@layer base`, components in `@layer components`, animation helpers in
`@layer utilities`.
**Lesson worth keeping:** typecheck and tests were both green while this was broken. Only
looking at the rendered page caught it.

## D-009 · Exhaustive state sweep, deduplicated on flags only
The naive sweep enumerated ~4.1 million playthroughs and exhausted the Node heap. Keying the
dedup on flags alone (ignoring dimension values) collapses it to a few thousand states, and is
**exact** here because no branch gates on a numeric value — only on flags.
`validateContent()` emits a warning if a dimension gate is ever introduced, because the sweep
would silently stop being exhaustive at that point.
**Cost:** a future dimension-gated branch requires widening the dedup key.

## D-008 · Dominance detection as the mechanical test for "no right answer"
An option whose *worst* outcome beats another option's *best* outcome on all three dimensions
is a fake choice. The test caught three real ones on first run: at mission 1, Northwind
strictly dominated both alternatives; at mission 3, the point-of-view play strictly dominated
the campaign. Fixed by giving the alternatives genuine compensating upside rather than by
weakening the strong option — chasing a stretch client really does teach the team something,
and a broad campaign really is the option that does not burn senior people.
**This is the single most valuable check in the suite.** Without it, "no right answers" is an
aspiration rather than a property.

## D-007 · Situation text varies by state
The mission 9 risk review names *the risk the player's own proposal created*, and the mission
10 crisis names *the promise they actually made*. Implemented as `variants` on a mission —
first matching condition wins, static `situation` is the fallback.
**Why:** without this, the payoff mission reads as a generic event rather than as a
consequence, and the whole compounding design is invisible at exactly the moment it matters.

## D-006 · Ten missions, not twenty-one
The earlier direction specified 21 missions across 5–6 chapters in a two-hour session. At a
realistic 5–6 minutes per mission that is nearly three hours, and much of it was repetition —
several missions taught the same thing at different points in the value chain. GPL covers each
of the six stages exactly once, plus the four pivotal moments (qualification, competitor
event, pricing pressure, risk review). Ten missions, ~25 minutes, no redundancy.
**Cost:** less total content. **Benefit:** it gets finished.

## D-005 · No randomness anywhere
Uncertainty comes entirely from information the player does not have. No dice, no probability
rolls, no hidden variance.
**Why:** a player who can attribute a bad outcome to luck learns nothing from it, and a game
built to teach through consequence cannot afford dismissible results. It also makes the whole
run reproducible and the test suite exact.
**Cost:** replay variety must come from branching and from what the player chooses to
investigate, rather than from variance. That is a better source anyway.

## D-004 · Pure client-side: Vite + React + TypeScript + Tailwind
No backend, no database, no auth, no accounts. Progress in `localStorage`. Ships as static
files.
**Why:** single-player with no persistence requirement has no honest need for a server, and
every piece of infrastructure added here would be infrastructure to maintain, secure and host.
Rejected: Next.js (server features unused), the existing `C:\mpl` stack (its Prisma/Postgres/
auth layer exists to serve a multiplayer league that no longer exists).

## D-003 · Greenfield, with principles salvaged from `C:\mpl` rather than code
The predecessor is a mature Next.js/Prisma B2B marketing *simulation*. Almost none of its game
is in scope now. What was taken:
- **Determinism as a discipline**, and specifically its hard-won rule that *randomness must
  not be the only source of uncertainty, because pure noise destroys attribution* — which is
  what led to D-005 removing randomness entirely.
- **"Advisory, never blocking"** — a simulation that prevents a bad decision cannot teach that
  it was bad.
- **The variance-bridge shape** — *what you chose → what happened → why → what changed* — now
  the fixed structure of every consequence screen.
- **"Never invent a number"** and **one model, one answer**.
- The design tokens (`#6D35E8`, Inter, the 8px scale).

What was left behind: attraction/power-share maths, segments, capabilities, levers, Enterprise
Value, Rule of 40, bots, the league, and the entire executive-simulator framing.

## D-002 · Single-player
No teams, no facilitator, no cohort, no multiplayer sync.
**Why:** the loop has to be proven engaging for one person before any of that is worth
building, and team play was adding real-time synchronisation complexity to a product whose
core mechanic had never been played by anyone.
**Not closed:** team play remains a reasonable v2. The engine is pure and serialisable, so
the state is already in a shape that could be shared.

## D-001 · Reigns, not Markstrat
The north star is a tiny decision surface, a few meters in visible tension, immediate
consequence, and a run that finishes in one sitting — not an executive dashboard.
The supplied mockups were treated as reference, not as specification, on instruction.

---

## Superseded

**The team-based two-hour simulation.** An earlier pass in this session produced a PRD for a
16-mission, cohort-play, facilitator-led product with a behavioural analytics layer. That
direction was corrected by the product owner before any of it was built: GPL is single-player,
shorter, and simpler. Those documents were removed rather than archived, because a plausible
but wrong spec sitting next to a correct one is a trap for the next reader.

Two findings from that pass survive and are recorded here because they will recur:
1. **Content is the critical path, not code.** Ten missions with branching consequences is
   roughly 120 authored pieces of business prose. The engine took hours; the writing is the
   expensive part and always will be.
2. **Team play and individual behavioural assessment undermine each other.** If people suspect
   they are being individually profiled, candour drops and the bonding objective dies. If team
   play is ever added, keep analytics at team level.
