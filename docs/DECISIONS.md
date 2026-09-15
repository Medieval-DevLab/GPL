# Decision log

Every non-obvious call made while building GPL, why it was made, and what it cost.
Newest first. Superseded direction is kept rather than deleted — knowing what was rejected,
and why, is most of the value of a log like this.

---

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
