# Decision log

Every non-obvious call made while building GPL, why it was made, and what it cost.
Newest first. Superseded direction is kept rather than deleted — knowing what was rejected,
and why, is most of the value of a log like this.

---

## D-070 · The bundle budget is 82% over, and the number is not the problem — OPEN
`node tools/size.mjs` reports **171.44 kB of code against the 94 kB in `CLAUDE.md`**. The
tool has been saying so for a while. What it could not say was *where*, and a single
number sends whoever reads it to refactor components, which on this build is the wrong
place to look.

It can now attribute the bundle to the modules it came from, via the sourcemap. Measured:

| | raw | share | gz (est) |
|---|---|---|---|
| framework (React + react-dom) | 222.0 kB | 40.6% | ~65.3 kB |
| interface (`src/ui` + `App.tsx`) | 155.0 kB | 28.4% | ~45.6 kB |
| content (`story.ts`) | 143.8 kB | 26.3% | ~42.3 kB |
| engine | 25.2 kB | 4.6% | ~7.4 kB |

**React is 69% of the entire budget before a line of this project runs.** That is a
standing decision, not drift, and the only lever on it is a smaller runtime. The next
largest single source is the writing, which is the product and the last thing to cut. Our
own interface and engine together are ~53 kB gz across eighteen missions and a dozen
screen types.

**Code-splitting, the obvious remaining lever, is closed.** Backlog 8.1 inlined the module
precisely so `dist/` runs from `file://` inside a locked-down LMS, and dynamic `import()`
from a file URL is the exact thing that was broken. Lazy-loading the ending and the
dashboard would re-break the deployment target this was all packaged for.

**The number has deliberately NOT been moved, and this entry is the reason.** `size.mjs`
says "do not move this to make a build pass" and it is right to. But 94 kB is not
reachable from here without either dropping React or cutting features, so leaving it is
leaving a gate that can only ever be red — which this repo has already decided (D-038) is
worse than no gate. It needs a human call between three options, none of which is free:

1. **Re-baseline with the split**, budgeting framework / interface / engine separately and
   reporting content rather than capping it. Honest, and makes future drift visible again.
   Costs the simplicity of one number.
2. **Swap React for Preact** (~4 kB gz against ~65). Saves roughly 60 kB and would put the
   whole thing near the original budget. A real migration, and React 19 features in use
   would need checking.
3. **Accept it and delete the budget line.** Cheapest, and loses the instrument.

My recommendation is (1), because the measurement above is the useful artefact either way
and (2) is a large change to buy a number we chose ourselves.

**Reversible:** entirely. Nothing in the build depends on the outcome; `size.mjs` is not
wired into `npm run validate`.

Two smaller things landed with the measurement. Sourcemaps are excluded from the size
report, because counting a diagnostic build's `.map` files made the cold-visit total wrong
by half a megabyte in the direction of alarm. And `tools/scorm-package.mjs` now filters
them too — `npm run build` emits none, but packaging after a `--sourcemap` run would have
uploaded this project's full source into someone else's LMS, where it is not ours to
delete.

---

## D-069 · The debrief asks one causal question, and refuses to mark it
Backlog 4.5. Before the threads are revealed, the ending asks: here is what happened in
month five — which of your earlier decisions led to it? The player picks, the game
confirms, the chains appear.

**It is not scored, and `engine.test.ts` asserts the return type carries no field that
could become a score.** That test looks paranoid and is not. This game deleted its score
because a meter-greedy policy reached 100/100/100 without reading a word; the debrief
refuses to give a grade for the same reason; `src/scorm.ts` refuses to send one to an LMS.
A quiz at the ending is the fourth door into the same room, and it is the one that looks
most like good pedagogy from the outside. The item exists to make a cohort argue, not to
tell anyone how they did.

**The wrong answers are authored, not generated.** `CausalThreadRule.insteadOf`. The engine
could assemble distractors from other rules' `because` lines, and the result would be
unusable in both directions: a cause the player plainly never took turns the item into a
memory test, and a cause that *also* contributed makes the "correct" answer a lie an
attentive learner is right to reject. Only the person writing the thread knows which
near-miss is instructive. A rule with no `insteadOf` is never chosen, so the cost of not
authoring one is a quieter ending rather than a bad question.

**The candidate order is a hash, not a shuffle.** `Math.random` is banned in `src/engine`
and the ban earns its keep here specifically: a run has to replay identically from its
fourteen-character code, which is what makes a facilitator's pre-read and an exact bug
repro possible. The order is `fnv1a` over the run's own sorted outcome ids plus the
candidate text — stable for a given run, different between runs, so the answer does not
sit in slot one every time. `fnv1a` moved from `runcode.ts` into `engine.ts` to get there,
because `runcode` already imports the engine and the other direction is a cycle.

**The validator learned about threads in the same change, having never checked them at
all.** That gap is the most expensive content bug this repo has had: a thread naming an
outcome id that does not exist never fires and never complains, so the ending is just
quieter than it was authored to be, on some runs, and nothing has an opinion. Five rules
existed while `D-012` recorded nine. There are now six checks — dangling outcome ids,
dangling flags, the two-outcome minimum `causalThreads` documented and did not enforce,
endorsement language, duplicate candidates, and the two-distractor minimum — and each is
shown failing on purpose in `validate.test.ts`, per `D-037`.

The leak check applied to thread copy is deliberately the *looser* reading. The ending is
the one screen whose job is to say what happened, so naming an outcome there is correct;
what the shared term list buys is its other half, which is that the ending must never say
which decision was the right one. It is the screen the player most wants a verdict from
and therefore the one that must least give one.

**Cost:** one more authored field for whoever writes a thread, and an item that is absent
on any run whose threads have no distractors — which is honest but means two players can
compare endings and one of them never saw the question. The alternative was generating
distractors, which is worse in the way described above. Reversible: the field is optional
and `causalClaim` returns `null` without it.

---

## D-068 · `apply` is a third presentation, not a third mission kind
The apply/rebuttal beat — backlog 5.7, Aisha's "which ones did you mean?" — renders the
options the player did **not** earn, greyed and padlocked, each naming the beat where it
was for the taking. It ships on two beats: the award rebuttal (m9a) and the new handover
(m10h).

**The whole thing is one word in content.** `Presentation` gains `"apply"` beside
`"console"` and `"dialogue"`, and that is the entire content-side change: identical
options, identical outcomes, identical branching, identical state. No analysis, sweep or
validator learns the screen exists, which is the property D-0xx built the presentation flag
for in the first place and the reason this was not a new `Mission.kind`. A kind would have
forced every exhaustive walk, every dominance check and every save migration to reason
about a distinction that is purely about what is on screen.

**Why the screen earns its place.** The console renders an unearned option by omitting it,
and a shorter list reads as *the game offering less* rather than as *the player having
earned less* — the one reading that turns a consequence into a mystery. 85% of runs reach
the handover with at least one option locked and 36% reach m9a that way, so this is the
common case at both beats, not an edge.

**`isApply` refuses the staging when no option is gated**, mirroring `isDialogue`'s refusal
to stage a conversation with no replies in it. A padlock column with nothing in it is an
empty promise of consequence, and the honest fallback is the console.

It mounts on `decide` only — unlike the call, which is one React instance across both
phases so the transcript is not retyped. The apply beat keeps the split because its reading
half is an ordinary brief, and `verify.mjs` caught the first wiring doing otherwise: putting
the padlocks on the brief shows the answers before the demand that gives them meaning.

`has:partner` reached the ledger in the same change. It was a narrative-only flag until the
handover started gating Aisha's card on having anyone who can answer a delivery question —
`ops_onside`, `has:ops_workstream` or a partner. The other two were already on the rail, so
a partnered player saw a card open for a reason the game had never named.

**Cost:** a third staging to keep in step — `ui/apply.tsx` restates `demandOf` rather than
importing dialogue's private copy, and if a fourth screen needs it that resolution should
move to `engine.ts` beside `resolveSaidQuote`. And `EARNED`, the flag→"what it was, and
where" table, is authoring sitting in a component because `story.ts` has no field for it
yet. Both are noted in the file. Reversible: delete the two `presentation` lines and the
beats fall back to the console.

---

## D-067 · The `resolving` phase is deleted from the flow, and the save boundary adopts it
`SCREEN-TAXONOMY.md` §3 names it as the one screen type to cut: a one-second transition
holding **17 of a run's 76 screen instances**, earning its slot purely by being in the way.
`commit` now returns `phase: "consequence"` and `ConsequenceScreen` animates the meters from
`resolution.dimsBefore` on arrival, which is what D-061 built the `from` prop for.

**The value stays in the `Phase` union, and that is the substance of this entry.** The
instinct to keep it "so an old save still parses" is right but incomplete — parsing is not
the failure mode. `save.ts` gates on a hand-listed `PHASES` array, so dropping the value
makes `looksPlayable` read a mid-commit save as a **different `GameState` shape** and throw
away a run that is one beat from resumable. Keeping it in the union and in that array only
buys the ability to RECOGNISE such a save; what it then needs is somewhere to go, because a
phase the interface has no screen for is a dead end regardless of what `advance` would do
with it. So `decodeSave` rewrites `resolving` → `consequence` on the way through and reports
`migrated: true`. That rewrite is honest rather than a guess: `commit` applied every effect
and then set the phase, so a `resolving` state **is** a post-commit state and the resolution
the consequence beat draws is in the save beside it.

A `resolving` state carrying no resolution is refused as damage rather than adopted. No
build ever wrote one — `commit` writes the phase and the resolution in the same object — and
a consequence screen with nothing on it is worse than saying the save could not be read.

`advance` still maps `resolving` → `consequence`. It is unreachable in play and kept as a
backstop for anything that arrives by another road, with a test asserting both halves: no
reachable state holds the phase, and a state that holds it still moves.

**Cost:** two mechanisms for one migration — the load boundary and the backstop in
`advance` — which is one more than the problem strictly needs. The alternative was a single
mechanism that leaves a hand-edited or future-migrated state stuck on a blank screen, and a
dead end is a support call while a redundant line is a comment. Also: `playMission` and
`commitSelection` each lost an `advance` call whose absence the following loop would have
covered for, so behaviour is unchanged and the flow now says what it does.

**Reversible:** yes, in one line each in `commit` and `decodeSave`. Nothing about the
deletion is load-bearing for the animation, which lives entirely in the consequence screen.

## D-068 · Eleven ledger rules, because 14 of 29 gating flags decided a branch the player could not see
Backlog 4.2, measured before it was believed. 29 flags gate a branch somewhere in the story
— they appear in an `outcome.when` or an `option.requires` — and **14 of them appeared in no
`LEDGER_RULES` entry**. On those 14 the game silently branched on state it had never shown,
so a player asking "why did that happen?" could not tell a **reasoning error from an
information gap**, and attribution is the whole teaching mechanism. Learning science put it
top of its section and it blocks 1.1.

**High traffic is a measurement, not a judgement.** Walking every reachable state and
toggling each gating flag at each mission counts the visits where that one flag alone
changes which outcome fires or which options are offered. The eleven rules added score
**11,960 to 51,144** decisive visits. The three left invisible score **227, 40 and 0**, so
the cut line is a 53× drop rather than a preference: `knows:rivals` (its readers almost
always have it, and `knows:rival_gap` — already on the rail — is the distinction the game
actually teaches), `changed_scope` (decides anything on 40 visits, one beat after the choice
that sets it), and `broad_base`, which is **dead rather than invisible**: its only writer is
m10c and its only reader is m10, two beats earlier, so the term can never be true when it is
read. The outcome still fires on its `ops_onside` alternative, which is why the sweep never
noticed. That one is content's to fix and is reported, not patched here.

Three of the eleven — measurement, adoption, payback — were added because the handover beat
landed mid-pass and gates an option on exactly those flags. Aisha's *"the training, the
integration stream, the measurement work"* is unavailable to a player who did not fund them,
and an option missing for an invisible reason reads as a shorter list rather than as a
consequence.

**What it costs the layout, measured on the same walk before and after: the worst case
goes from 13 entries to 21.** Read 21 as a floor — the walk dedupes states on the flags a
later mission still reads, so two states differing only in a flag nothing reads again
collapse and the survivor may hold the shorter account. The structural ceiling is 29 (every
rule at once, less two of the three mutually exclusive ways of getting in). The rail is
uncapped so nothing breaks, but a 21-row account is a scroll. The group comments in the table are the seams to cut along; the last three rules are
the marginal ones and deleting them costs 3 rows and reopens 3 gates in the handover.

**Two rules the new copy is held to, and one of them is now mechanical.** An entry states a
POSITION and never predicts an outcome — `validateContent` runs the same leak check over
these strings that it runs over every pre-decision field, because the rail is on screen
while the options are being read and `engine.ts` had no leak check of its own. And never a
bare restatement of the flag name: a row reading "Reviewed" tells a player nothing they can
act on. The second is still a matter of judgement and is not checked — "Risk accepted",
which shipped long ago, would fail any mechanical version of it.

**The gap itself is now a build failure.** `validate.ts` warns per flag that gates a branch
with no ledger rule, and `engine.test.ts` pins the surviving three by name with a reason
each — the same pattern as the dead narrative flags. A warning rather than an error for one
specific reason: `LEDGER_RULES` lives in `engine.ts`, so the only ways to clear an error
would be to edit the engine or to weaken a gate, and *"adding a mission must never require
editing the engine"* is the stronger rule.

**`LEDGER_RULES` belongs in `src/content/story.ts`, for the same reason the `threads` table
moved,** and it is deliberately NOT moved in this pass because another worker owns that file
right now. It is 31 entries of player-facing prose with a tone and an icon, keyed on content
flags, and a writer cannot reach it. The move would also turn the warning above into an
error, which is where it belongs. The one thing it needs first is a decision about
`IconId`: the table is the only place in the engine that names an icon, so moving it makes
content own that vocabulary too.

**Cost:** three Operations rows now exist on one rail (`ops_engaged` a meeting,
`ops_onside` a stake, `has:ops_workstream` a funded line) and they read as near-duplicates
at a glance. Merging them was rejected: none implies another — `ops_onside` is granted at m7
to a player who never met Marcus — and m9, m9b and m10c all branch on which you have.

**Reversible:** yes, per rule. Each is one object in one array, and deleting one restores
exactly the invisibility it removed.

## D-064 · The apply screen renders the options you did not earn, because absence taught nothing
`SCREEN-SPECS.md` §4.3 and `GAME-SEQUENCE.md` §3 asked for the one screen type the taxonomy
found missing: the beat where **stored knowledge is the currency**. The mechanic for it was
already in the game and invisible. m9a's `o-value` carries
`requires: { any: ["knows:real_pain", "evidenced", "ops_onside"] }`, and `availableOptions`
drops it — so a player who never bought the complaint data saw three cards instead of four
and had no way to know a fourth existed. Four beats in the game gate an option this way and
**not one of them says so.**

`src/ui/apply.tsx` renders the full `mission.options` and draws the difference against
`availableOptions` as a locked card **in its own place in the row**: the option's name, the
sentence it would have been, the thing it needed, and the beat where that thing was for the
taking — "Their complaint data · Chapter 1 · Learn what matters". `where` is spelled as the
chapter plus the **left rail's own step name**, so it points at a memory rather than at a
mission id.

**Four calls inside it that were not obvious:**

**The locked card is not a `.choice`.** It is `aria-disabled` with `tabIndex={-1}` inside
the radio group, so Tab always lands on something playable and the arrows still reach the
padlock — measured: `ArrowLeft` from the first live card focuses it and announces *"Build the
case in their numbers — locked, because it was never earned"*, and no selection follows. It
does not take the class because `.choice` carries a hover state and a pointer cursor, and
`tools/verify.mjs` drives the game by clicking `button.choice`.

**Dimmed, never faded.** `--color-surface-disabled` behind `--color-text-disabled`, 5.22:1,
the pair `.choice:disabled` already uses. `opacity` would have invalidated the ratio and
`tokens.test.ts` fails the build on it.

**An `any` clause names ONE requirement in full and counts the rest** as "+ 2 other ways
in", where an `all` clause names two. One of an `any` set would have done, so naming the
nearest one with where it was says everything the player can act on — and four stacked
"thing / where it was" pairs at 12px in a 171px column is a paragraph, not a label. It was
also 45px of the 84px by which the selected state overflowed at 1440×900.

**The gate is in the work area and is one row, not two.** Same reason the conversation
surface moves it off the action bar: the requirement belongs beside the thing it is about.
One row rather than the composer's stacked form, because this surface has the whole 848px
beneath the cards — worth 32px.

**Cost:** a flag needs a human label per entry, and that table (`EARNED`, 50 entries) is in
the component with a comment saying it must move to `story.ts`, which has no field for it
yet. An unlabelled flag degrades to a humanised name and a vague, deliberately non-committal
`where` rather than an invented chapter. Measured after the trims: **0px overflow at
1440×900 and 1440×1024, in both a 17-flag run and a 14-flag run, selected and unselected.**

**Not done, and it is content's:** m9a has exactly **one** gated option today, so a
competent run sees no locked card at all and the screen degrades to a comparison — which
§4.3 names as the failure mode for this type. The screen is ready for more gates; the gates
are authoring.

**Reversible:** yes, entirely. It is one new file and one route in `App.tsx`; removing the
route restores `DecideBody`.

---

## D-061 · `resolving` is folded into the consequence's entrance, and the handover is one prop
`SCREEN-TAXONOMY.md` §3 names `resolving` as the one screen type to cut: a one-second
transition holding **17 of a run's 76 screen instances**, earning its slot purely by being
in the way. The replacement is not a shorter transition — it is the consequence screen
arriving with its meters already travelling.

**The guarantee that made `resolving` exist is the thing to preserve, and it is not about
duration.** A CSS transition needs the same DOM node to hold both values. `resolving` was
built because committing used to unmount both rails, so the three meters did not travel
from 58 to 64 — they were destroyed at 58 and recreated at 64, a cut dressed as feedback.
Keeping the rails mounted across the beat is what makes the movement exist at all, and
that is `App.tsx`'s job and still is.

**The centre is the new part, and it cannot inherit a value from the DOM**, because the
result band does not exist until the screen arrives. So it paints `from` for exactly one
frame and then sets the target — `useFirstFrame` in `ui/consequence.tsx`, a four-line local
copy of `useSettled`, which `ui/shell.tsx` keeps private.

**The prop is `from?: Record<DimensionId, number>`, not `animate: boolean`.** Same shape
the rail already takes, so `App.tsx` passes the same expression to both and the two are
visibly one event. It is a prop rather than being read off `resolution.dimsBefore` because
only the caller knows whether this mount is the arrival: reading it inside would re-run the
whole 900ms travel on any remount — a resumed save, or a return from the map.

Measured, sampling every ~95ms through a commit: figures 55 → 59 and the bar 0.550 → 0.590
scaleX over ~700ms, with **the band and the rail within 0.002 of each other at every
sample**. One event in two places.

**Cost:** `ResolvingScreen` is still exported and still routed to, because `App.tsx` is
owned by another worker mid-change; until they drop the phase the game shows the travel
twice — once on the resolving beat and settled values on the consequence. **Reversible:**
yes. Omit `from` and the consequence renders settled, which is exactly what it does today.

---

## D-062 · The three modes are separated by what is on the screen, never by a hue
Brief, decide and consequence shared chrome, ground and action position — three modes in
one costume across 66 of 76 screens, which is the whole of "it feels like static pages".
`SCREEN-TAXONOMY.md` §1 is explicit that the carrier is **chrome quantity, monotonically**,
and that colour is secondary everywhere. The test applied was the thumbnail test: three
screenshots, shrunk to 170px wide until the text is unreadable, side by side.

**READ (brief).** Calm means FLUSH. The four assessment cards became a 1px-divided fact
strip, the concerns lost their rose panel, and the colleague's bordered card became the
last flush section of one white sheet. Nothing floats. The rose panel had to go on a rule
rather than on taste: a filled alarm-tinted panel is a cost signal, and READ is the mode
where nothing may suggest a price. It keeps the mission photograph. **~70px of height came
back**, which is what paid for the result band below.

**DECIDE.** One element no other screen in the game has — `StakeMark`, beside the question,
carrying the three dimension pictograms and the words *"Committing is final"*. The words
are about irreversibility rather than magnitude, deliberately: a commit is always final,
whereas "this moves all three" is false on the `nothingMoved` outcomes. It is not a
prediction and says nothing about which option does what (G3). The mission `eyebrow` came
off this beat to pay for it — an all-caps kicker over a heading, on 17 screens, repeating a
string the brief showed thirty seconds earlier. Net **−22px** per console decide beat.

**RECEIVE.** Three things, and the first is a subtraction: the consequence stopped
rendering `mission.hero`. It was the **same image file the brief renders, in the same
place, at a similar size** — a picture of the situation standing in for a picture of the
outcome, and the single biggest reason the two were indistinguishable in a thumbnail. In
its place: the three figures at the 56px display step, flush and full width, divided by 1px
rules, which is the only place in the run where a numeral outranks a heading. Then the
verdict on the player's own call full width, then the read and what changed side by side.

**Two other arrangements were built and looked at, and both were worse.** Giving the spare
height to the read panel put a 350px field of lavender under 140px of type. Giving it to
the result band left the three figures floating in the middle of a void that grew to ~500px
at 1440×1024. A document that ends, with desk under it, is the one that reads as finished.

**Cost:** the consequence has no art at all now, and the decide beat has lost a line of
content framing. **Reversible:** both, in a line each — `hero` is still in the props.

---

## D-063 · Under reduced motion every meter in the game reads 100
Found by looking at the render with `reducedMotion: "reduce"`, not by any test.

`index.css` collapses reduced motion with `transform: none !important` on `*`. Every meter
in GPL draws its value as `transform: scaleX(v/100)` from a left origin — correctly, because
of width, height, margin and padding Linear's engineering write-up says "never animate
those. I mean never." But an inline style cannot outrank `!important`, so under `reduce` a
`scaleX` bar renders **unscaled, which is full width**. A player who asked the operating
system for less movement is shown three bars at 100 whatever the numbers beside them say.

Four sites: `MeterTrack` and `ChapterStepper` in `ui/shell.tsx`, the level bar in
`ui/reward.tsx`, and the new result band in `ui/consequence.tsx`.

**Fixed in the result band only**, because that is the owned file: `useReducedMotion()`
picks `width: v%` when there is nothing to animate and `scaleX` when there is. Under
`reduce` a width is static, so it costs no layout and the number is right. The screenshot
at `docs/modes/reduce/mode-receive.png` shows the fix and the bug side by side — the band
reads 59 / 52 / 50 and the rail eight inches away still reads full.

**Cost:** the same two lines are needed in two other files and are not written. **Reversible:**
irrelevant; the current behaviour is a defect, not a decision.

---

## D-056 · The path-reveal shows an untaken outcome only where it is certain
The chapter debrief's second column is the reveal Detroit: Become Human ends every chapter
with — the branch you did not take — and the brief for it asked for "the sibling outcomes
that did not fire". Two thirds of that is exact and one third is not, and the split is
worth recording because the tempting version is the one that lies.

**Exact, from the content itself.** On an investigate beat the roads not taken are the
questions the player did not spend a slot on; on a build beat they are the components left
out. `HistoryEntry.chosenIds` minus the authored list is the answer, and it is the best
teaching on the screen — *"Who else is in the room?"* sitting unasked next to what the
player did ask is the whole lesson of m2 in one line.

**Not knowable here.** For a `choice` beat, the OPTION not taken is exact, but the outcome
it would have produced is selected by matching conditions against the flags and dimensions
as they stood before the commit. `HistoryEntry` records `dimsBefore` and no flags, and
flags are only ever added — so they could be reconstructed by subtracting the ones later
beats set. That reconstruction is a game rule, and rules do not live in `src/ui` (E2). The
alternatives were worse: printing each option's LAST outcome, the unconditional fallback,
would be a plausible-looking headline that on a third of options is not what would have
happened, which is the exact class of quiet mis-teaching the whole engine is built to
prevent.

So the rule is **show the result only where the branch has exactly one outcome and no
condition on it.** Measured against today's content that is **14 of the 50 choice options**
— 3 in chapter one, 2 in two, 6 in three, 3 in four and **none in chapter five**, whose
eleven options all branch. The ones without a result are still named, because *"you did not
take the phased price"* is the lesson and inventing its consequence would not add one.
Chapters one, two and three each also hold an investigate or build beat, whose entire
untaken list is exact; **chapter five holds neither and has no certain option**, so its
debrief is the one that shows names and no results at all. That is the screen to look at
first if this rule is ever revisited.

The certain ones carry their authored tone as their colour, which is how a cyan *"It is
duller, and it will hold"* ends up sitting beside a `hard` decision in chapter three. That
single line is the most useful thing on the screen, and it is also the argument for fixing
the other 36.

**Cost:** 36 of 50 choice branches are named without a result, chapter five's entirely, and
a reviewer cannot tell from the screen which ones those are. **Reversible:** yes, and
cheaply — the moment `HistoryEntry` carries the flags as they stood at commit, `untakenOn`
can call `selectOutcome` and every branch gets its real headline. One field and one call.

---

## D-057 · The reflection's missing meters are silent for the eye and spoken for the ear
`SCREEN-SPECS.md` §4.5 makes the absent meters load-bearing: meters mean stakes, so no
meters means nothing is at stake, and the player learns it without being told. The first
build of the screen printed *"Nothing on this screen changes your position."* at 12px under
the responses, which explains the joke to the only people who can already see it.

But an absence is not perceivable on the audio channel at all. A screen-reader user meets a
reflection as an ordinary beat with a person, a question and two buttons, and has no "where
the meters used to be" to notice. So the sentence stayed and became `sr-only`: **the visual
channel carries it by subtraction and the spoken channel carries it in words.** Same
information, two encodings, neither redundant.

The mechanism is also structural rather than conditional. `ReflectionRail` is a separate
export that renders "Your file" and nothing else, and `App.tsx` passes it in place of
`InsightRail`. Hiding a block inside `InsightRail` on a `role === "reflection"` test would
have put the rule somewhere a future edit could silently undo.

**One measured correction while building it.** "Paper, warmer" was first done as a radial
wash of `--color-accent-tint` at 78% over the desk, and it was invisible on a screenshot —
that lavender is within about 1.1:1 of the desk it sits on, which is the same mistake this
palette has already recorded twice, for the meter tracks and for the page wash. Washing
toward `--color-surface-panel` instead — the warm paper step, 1.39:1 against white — makes
the room visibly different while leaving the white card the lightest thing on screen.

**Cost:** one string that will read as dead weight to anyone who greps for it without
reading the comment. **Reversible:** yes, one element.

---

## D-058 · On the stage the dimension fills invert, so the arc is drawn in the `-line` tokens
`--color-deliver-solid` is `#054e9e`. On paper that is a legal fill — 3.90:1 on white — and
on `--color-stage` it is **2.34:1**, which fails 1.4.11 for a line that carries meaning. So
the three paper solids are not a set on the dark ground: Winability measures 5.23,
Profitability 4.87 and Deliverability 2.34, one of them invisible and the trio incoherent.

The step-7 `-line` values clear it on all three — **5.59 / 5.19 / 4.58** — and sit within
1.2 stops of each other, so the arc reads as one family rather than one bright line and two
murky ones. `ui/dashboard.tsx` therefore draws every stroke, marker and bar in
`--color-<dim>-line`, and the header comment carries the measurements so the next person
does not re-derive them.

Note this is a **pre-existing condition, not a new one**: `HubScreen`'s `StageMeter` paints
its Deliverability bar in `deliver-solid` on the same ground today, at the same 2.34:1.

**Cost:** two spellings of "the Deliverability colour" depending on the ground, which is
exactly the ambiguity `--color-glow-ink` exists to remove for violet. The real fix is a
`--color-<dim>-stage` triad in the token layer; until it exists, `-line` is the honest role
name for a stroke. **Reversible:** yes — one object, three lines, in one file.

---

## D-059 · The arc measures its box; it does not scale into it
The obvious way to draw a chart that has to be 340px tall at 1440×900 and 466px tall at
1440×1024 is a `viewBox` with `preserveAspectRatio`, and it is wrong here. Uniform scaling
scales the type too: at the 739px height the box is 892×340 against a 880×470 canvas, a
0.72 factor that puts the 13px axis labels at 9.4px and the 12px chapter labels at 8.7px —
under the scale's own 12px floor, on the screen whose whole job is to be read.

So the canvas is sized in real pixels from a `ResizeObserver` on its container and the
geometry is derived from that. The SVG is absolutely positioned inside the box it measures,
so a taller chart cannot make a taller box and there is no feedback loop.

**Cost:** one observer and one piece of state in a component that would otherwise be pure
render, plus a chart that has a floor (560×236) below which it scrolls horizontally rather
than shrinking — which is what happens at 390px wide, where the direct end labels would
otherwise be cut off and the non-colour carrier lost with them. **Reversible:** yes, but
only by accepting sub-12px axis type.

---

## D-060 · The reachable range's ceiling is 100 on all three meters, so the floor is the story
`reachableExtremes(story)` today returns **win 41–100, profit 17–100, deliver 0–100**. Every
ceiling is the cap, which was not the expectation: the dashboard's headline comparator was
meant to be "84 of a reachable 100", and against a ceiling of 100 on every meter that
sentence carries almost no information.

The information is at the other end. A greedy policy can drive Deliverability to **0** and
Profitability to **17**, and cannot pull Winability below **41** — so what the range
actually says is *how far down each meter can be pushed*, which is a statement about where
this story's risk lives. The bar therefore renders the whole witnessed band as a shaded
region behind the player's value rather than only a ceiling tick, and the caption names the
band rather than the maximum: "a floor and a witnessed ceiling, not a theoretical one."

Measured cost of asking: **22–80ms** for the whole replay, memoised per `Content` object in
a `WeakMap`, so it is paid once per session and not once per open.

**Cost:** the phrase "of a reachable 100" reads as flat on all three rows until content
changes make a meter genuinely uncappable. **Reversible:** yes — and it reverses itself, as
it reads whatever the engine reports.

---

## D-055 · The blank floor was a layout fault, and I had diagnosed it as a content shortage
Three times I moved that empty space around the chat surface and three times I described it
as "not enough content to fill a beat" — ~190px below the replies on m9, ~420px on m3,
recorded in D-052 and D-054 as a cost worth paying. It was not a content problem. **The
whole block was top-aligned inside a taller container, so every spare pixel collected at
the bottom, underneath the replies**, which is the one place it reads as a screen somebody
did not finish.

No client lays out that way, and the fix is the shape every one of them uses: the thread
takes all the height, its messages sit at the BOTTOM of it against the composer, and the
slack collects ABOVE the first message — where the same pixels read as *the start of the
conversation*. Measured floor, bottom of the last region to the bottom of the working
area: **m3, m9 and m10 are all 0px, at 1440×900 and at 1440×1024**, on the listening beat
and on all three states of the gate. The composer now also sits in the same place on every
chat beat instead of floating up and down with the length of the thread.

**The slack is a real spacer element, not `justify-end` and not `mt-auto`.** Content
distribution and auto margins in a scroll container put the overflow past the *start* edge,
which is historically unreachable — so on month five, the one beat whose thread genuinely
overflows, the relayed message would have become unscrollable. A `grow basis-0` child takes
the slack when there is any and collapses to nothing when there is not, and the scrollbar
stays ordinary.

**The call needed nothing**, and it is worth saying why rather than leaving it as an
omission: its flexible region is the tile wall, which sits ABOVE the captions and the
composer, so the slack was already collecting in the middle of the window where a call
window's slack belongs. Measured at 0px floor on both viewports before this change.
Stretching the tiles to eat the remaining air would make them portrait at three
participants, which is not what a tile is.

**What this supersedes:** D-052's "a chat beat with one message leaves 270px of empty desk"
and D-054's "the thread is sized to its content and the surplus becomes desk". Both were
descriptions of a bug I had rationalised. `data-region="reply"` is on the composer now, so
the floor is measurable rather than eyeballed.

**Cost:** none paid in content, type or padding — the same words in the same sizes.
**Reversible:** yes, one class on the thread and one child element.

---

## D-054 · On a chat surface the situation IS the thread — and two smaller corrections
Three refinements to D-052, the first of which supersedes part of it.

**1 · The empty floor was a symptom, and the disclosure was the cause.** D-052 put
`situation` behind the console's one-line "— the brief" disclosure on both surfaces and
left ~270px of empty desk on a sparse chat beat. Shrinking or padding that floor would
have been treating the symptom: a thread whose entire history is one line, with the actual
context hidden behind a "show" link, is *a thread pretending to have no history*. So on the
chat surface the paragraphs are the history — earlier messages from whoever is speaking,
above their closing line — and the disclosure is gone. The call keeps it, because a
transcript can only hold what was actually said and scrollback we invented would be
putting words in somebody's mouth.

The split is dictated by the prose, not chosen: in all five chat beats the **first**
paragraph is the narrator setting the scene — "Everything is agreed. Nothing is signed." —
and on month five it says *"the delivery lead wants thirty minutes"* while the delivery
lead is the person talking. So paragraph one becomes the thread's unattributed subject and
everything after it becomes hers. A single-paragraph beat (m3) has no narrator line, so it
becomes a message. Capped at three, oldest first; nothing authored reaches it today, but a
five-paragraph variant would otherwise bury the line the replies answer. Consecutive
messages from one person group under one avatar — how every client renders it, and 22px per
message handed back to a thread that has to sit above a five-reply composer. Measured:
m9 and m10 are **0px over at both 1440×900 and 1440×1024**, and month five still shrinks
and scrolls rather than pushing the composer off.

**2 · The player's own tile said "Y".** A monogram of the word "You" is a letter in a
circle, and it read as a placeholder somebody forgot to finish — on every conversation
beat. It is now a person silhouette, `PersonGlyph` in `ui/icons.tsx`, deliberately NOT an
`IconId`: that union lives in `engine/types.ts`, which a rendering detail has no business
widening, and `people` already means "participants" in the same window's header with a
number beside it. `Monogram` split into `Disc` + initials so there is one gradient circle
in the build rather than two.

**3 · The steer could not come back, and here is the number.** D-053 dropped
`mission.tip` for the second half of a console decide beat and flagged it as the trade to
revisit. Revisited, measured, and reverted: bringing the card back the moment the gate is
satisfied wraps the action bar to **two rows — 137px against 73px** — at 1440×900 on
mission one, and the 64px it costs overflows a decide screen that fits to the pixel, by
15px. Holding the return to `xl` fixed 1024 and did nothing for the viewport that matters.
The measurement is now a comment at the site, so the next person does not retry it blind.

**One real bug fell out of measuring this.** The chosen prediction chip grew by ~20px when
its tick appeared — the chip the player had just clicked shoving its neighbours — and at
1024px wide that wrapped the row and measured as a 35px overflow on the beat where the gate
opens. The tick's space is now reserved with `invisible`, so the box is constant in both
states.

**Cost:** m3, the shortest mission in the game, still leaves ~420px of desk on its
listening beat — one paragraph of situation and one line of dialogue is all the content
there is, and inventing more would be worse. At the minimum supported window (1024×768) a
conversation beat needs 35px of inner scroll, against 420px for a console decide beat at
the same size; below 1000px tall the working area is allowed to scroll inside the console
(D-024). **Reversible:** yes — `history()` is one function and the call surface never
calls it.

---

## D-053 · The commit gate was a legend, not a control — and the bug was on mission one
The reported defect is "cannot get past Commit to this". `canCommit` needs a selection AND
a prediction, and the second requirement was a 13px question with three 12px chips wedged
into the action bar between a 360px photographed quote and a 280px button, at the far edge
of a 1,440px bar. Select an option, press the button, nothing happens, nothing on screen
says why: `onBlocked` announced the reason to a live region and drew nothing. The ten new
conversation beats do not include m1 or m2, so fixing it only in the new staging would have
left the bug exactly where it does the most damage — on a first-time player's first
decision.

Four changes, none of which touches the gate:

1. **The requirement is an object, against the button.** A bordered lavender panel with the
   question at 15px/bold, `ml-auto` so it sits beside the control it is blocking. The first
   attempt put it where the colleague's card used to be, at the far left — which is the
   corner the report says nobody looks at. (Two `ml-auto` items SPLIT the free space, so the
   button's own auto margin is now conditional; that is why the panel first landed floating
   in the middle of the bar.)
2. **The chips look pressable**: 32px tall, 13px type, 1.5px border, and the chosen one
   carries a tick as well as a tint. They were 22px and 12px in a hairline.
3. **A blocked press is drawn, not only spoken.** Re-keying the panel restarts its
   entrance, so the requirement lands again — measured in the browser as `gpl-land`, 260ms,
   on the element containing the question, on both stagings.
4. **The colleague's steer stands down while the requirement is up.** Good content
   competing with the one thing the player must do — and at 1280px the two of them plus the
   button do not fit on one line, so keeping both would wrap the bar and take height off the
   working area. It still appears on every decide beat before a selection is made, and on
   the resolving beat.

**Cost:** `mission.tip` is off screen for the second half of a console decide beat. That is
the trade I would revisit first. **Not paid:** `canCommit` is untouched — the prediction is
the game's "before" and removing it would delete the learning loop, so the fix is
legibility only. **Reversible:** yes, all four are local to `ActionBar`/`PredictionStrip`.

---

## D-052 · Conversation beats are staged in the artefacts of the work, not on a painted stage
Seventeen missions rendered as one shape, and the complaint was that "the screens are almost
the same". They were, so no transition could fix it: animating between two identical shapes
is the same shape. `presentation: "dialogue"` (D-051) makes ten of them a conversation, and
this is what a conversation looks like.

**A visual novel was built and thrown away.** Blurred hero, bottom-anchored character bust,
textbox across the bottom — the shipped Ren'Py geometry. Two things were wrong with it: it
is a genre transplant onto a consulting game, and it needs the 21 sprites and 9 painted
rooms `docs/ART-BRIEF.md` prices and nobody has drawn. Consultants live in calls and chat
threads, so the interface becomes the fiction instead of illustrating it — and that needs
no art at all, because **a call with the cameras off is a grid of initials in circles**, and
the monogram built for the three client voices who have no photograph stops being a
fallback and becomes the authentic state. The tile is labelled "Camera off" and means it.

What the surfaces are:

- **`call`** — a window header (Live, the mission title, the participant count), a tile
  wall, live captions, a composer. The **active-speaker ring** is the load-bearing state:
  it says who is talking without a word being read, and it **moves to the player's own tile
  the moment the replies open**, which is the floor passing to them. Ring + chip +
  attribution, so it never rests on hue (E6).
- **`chat`** — same frame, same composer, bubbles instead of tiles, and your chosen reply
  lands as a right-aligned draft marked *Not sent yet*, which is exactly what it is.
- **`thread`** is deliberately not built. One surface done properly plus a light variant
  beats three half-done ones.

Four things that are not obvious and were each got wrong once first:

1. **One component, both phases.** `brief` and `decide` stay two engine phases — the gate
   requires it — but they are one screen and one mounted instance, so the window, the
   participants and the typed caption survive the phase change. Two slots in `App.tsx`
   would unmount and remount the call, which is a cut dressed as a conversation and would
   retype the line the player just read.
2. **The typed line is three copies of the string**: `sr-only` in full for assistive
   technology from the first frame, a `visibility: hidden` ruler so the box cannot change
   size mid-sentence (the tile wall is the flexible region — it would have resized twice per
   line), and the animated run. Reduced motion shows it whole — replacement, not removal.
3. **Nothing is deleted from the beat.** `situation` and `concerns` sit behind the same
   one-line disclosure the console decide beat uses, open while listening and closed once
   the replies are up; the colleague's `consider` questions occupy the composer's slot on
   the beat before there are replies, so the click that opens the replies changes what that
   region is *for*. `room: "internal"` keeps the client's line as a **Relayed** message and
   keeps them off the tile wall — they are quoted, not present.
4. **A short thread does not stretch.** Sized to content with the surplus left as desk; it
   shrinks and scrolls on month five, where five replies and three messages do not fit. Both
   of the first two attempts — bottom-anchored, then top-anchored and stretched — were a
   500px hole with a bubble stuck to one edge of it.

**Cost:** the hero photograph is unused on these ten beats, and a chat beat with one message
leaves 270px of empty desk at 1440×900 (390px at 1024). The 160px portraits are never
upscaled — they sit in a 104px circle — which is why no tile carries video. **Reversible:**
entirely. `presentation` is one word per mission and `isDialogue()` renders the console for
anything it cannot stage as a conversation.

---

## D-051 · The dialogue staging is enforced, and one of the five rules is a warning
`Presentation` makes a beat a conversation by changing one word, which is the property that
makes it affordable — and also the property that makes it fail silently. With
`presentation: "dialogue"` set and `option.say` absent, the renderer falls back to `title`,
which is written in the third person for a comparison card: *"The post-purchase
experience"*. Nothing crashes, nothing looks broken enough to report, and the beat quietly
renders a row of captions where a person should be talking. Same failure class as a
condition reading `knows:ops_constriant` — the check that earns its place in this file.

Five rules, four of them errors:

1. **Every option of a dialogue mission needs a non-empty `say`**, and the message names the
   mission and the option, because the fix is in one option of one mission. Not evaded by
   `""` or `"   "`, which is the evasion `pros: [""]` used until it was closed per entry.
2. **`say` is leak-checked** on the same surface as `commits` — and *regardless of staging*.
   Parking a prediction in `say` while the beat is `console`, where no screen shows it and
   no reviewer reads it, then restaging the beat later with one word, is a leak with a
   delayed fuse. G3 is a property of the content, not of what is currently on screen.
3. **`say` is budgeted at 20 words.** Observed max across the 37 authored replies: **20**. So
   unlike every other number in `BUDGET` this one sits exactly ON the authored maximum
   rather than above it — deliberate, because 20 words is where the stacked full-width row
   wraps to a third line. The next line over it is a fit problem, not a style preference.
4. **A dialogue beat must have somebody to speak first**, checked in the renderer's own
   resolution order: a `quotes` entry, then `saidQuote`, then `advisorLine`, then
   `advisor.quote`. Blank-but-present openers count as silence. **Known residual:** a beat
   whose ONLY opener is a *conditional* quote passes and still opens silent in the states
   where the condition fails. Deciding that statically means asking whether a reachable
   state satisfies the condition, which is the sweep's job — `analysis.test.ts` already
   fails on a line of dialogue no reachable state can hear, so the hole is closed from the
   other end rather than guessed at from this one.

5. **`say` must not merely restate `title`** — and this one is a **warning**, the only one
   this pass adds. Judging paraphrase is a reviewer's job: a reply is *answering* the thing
   the title names and will often pick the noun phrase back up, so a hard gate would fire on
   prose doing exactly the right thing. It reuses the existing
   `normalise`/`contentWords`/`overlap` machinery rather than introducing a second
   similarity measure, because two ways of asking whether two sentences match is two
   answers, and the second one is the one nobody recalibrates.

**The threshold was measured, not picked**, on the authored replies rather than on a guess
about them. Across all 37: the closest `say`/`title` pair sits at **0.21**, the next at 0.20,
and **30 of the 37 below 0.10**. The worst case is always the same shape — a reply that
echoes the verb and the noun of a four-word title while saying something new about them,
which is exactly the register the field exists for. Nothing authored reaches 0.34, so
`SAY_TITLE_OVERLAP_LIMIT = 0.7` sits at better than **three times** the observed maximum with
the whole band beneath it empty, and still catches what it is for: the title with one word
bolted onto it scores 0.75. `validate.test.ts` pins the measurement against half the limit,
as it does for `LESSON_OVERLAP_LIMIT`. Tolerance is wider than that check's because two
lessons have no business sharing vocabulary at all, whereas a reply answers the thing the
title names.

Note what "warning" costs here, because it is not free: `engine.test.ts` pins the set of
non-flag warnings to empty, so a warning that fires on *today's* content stops the build
exactly as an error does. The severity is soft only for the author of the next mission, who
gets told rather than blocked.

One more thing the gate is worth: the noise floor is applied to the **spoken** bag only, not
to both. Titles are three or four content words by budget, so a floor on the title bag would
have skipped the check on most of the game. Jaccard already handles the size difference in
the safe direction — a genuinely new sentence that happens to reuse the title's noun scores
low because it brings words of its own.

**Cost:** 140 lines in `validate.ts`, most of them the calibration comments rather than the
checks, and 358 in `validate.test.ts` — 23 tests, including the vacuity guard, because five
rules enforced against zero beats staged would be the `watchFor` failure in reverse. No
existing gate retuned or weakened. **Reversible:** yes, per rule; rule 1 is the only one
whose removal would matter, and what it protects is the reason the staging exists at all.

---

## D-050 · `maxWorkers: 4` was an incomplete diagnosis, and the failure came back
The suite has exited 1 with every test passing, on and off, for a fortnight:
`[vitest-worker]: Timeout calling "onTaskUpdate"`. D-043 read that as a main thread too
busy to answer an RPC and capped the pool at four workers. The suite went green and three
times faster, so the diagnosis looked confirmed. **It was half right, and the half it
missed is the half that matters.**

`onTaskUpdate` is a round trip. A worker blocked in a twenty-second synchronous sweep
cannot read the REPLY to its own call either, so the measured latency exceeds birpc's
deadline however idle the main thread is. Capping the pool bought headroom; it never
removed the race. The failure returned the moment anything else was using the machine
— in this case an ordinary browser, which is the normal condition and not an exotic one.

Measured, all three with a browser open:

| | duration | exit |
|---|---|---|
| 4 workers, 9 files | 143s | **1** |
| 2 workers, the 2 heavy files only | 148s | **1** |
| serial, 9 files | 150s | **0** |

So on a busy machine parallelism buys **nothing** — the heavy files saturate the cores
either way — and costs the exit code. It is only faster on an idle machine (35s), and a
suite that needs four spare cores to report itself green is not a gate, it is a coin toss.
`fileParallelism: false`.

Belt and braces, because serialising is a statement about today's content: the exhaustive
walk is now the generator `sweepWalk`, and `analysis.test.ts` drives it and awaits a
macrotask between breadth-first levels. One level could not blow the deadline even if the
config line were deleted. **The scheduling lives in the test, not the engine**, and the
purity check now bans `setTimeout`/`setInterval`/`setImmediate`/`queueMicrotask` in
`src/engine` to keep it there — a timer in the engine is how a replayable walk quietly
acquires a dependency on how busy the machine is. `sweep` itself is unchanged for every
caller and remains the single implementation.

**Cost:** ~110s of wall clock on an idle machine, and `npx vitest run <file>` is still fast
for iteration. **Not paid:** no assertion weakened. The alternative repeatedly on the table
was making the determinism check cheaper, and that one compares two independent sweeps of
the entire reachable state space — if it ever fails, a result has stopped being
attributable to the player's decisions, which is the whole premise of the game.
**Reversible:** yes, one line.

---

## D-049 · Conditional client dialogue, because Marcus must not introduce himself
`saidQuote` renders unconditionally, which was fine while all four of them were the
sponsor — she is on screen in chapter one and owns the budget. It is not fine for the two
client people who actually decide the outcome. **Marcus Reed owns every system that would
have to change**, and finding that out is the reward for spending a question on "who can
stop this?" at m2. An unconditional quote from him would have handed his name, his job and
his scepticism to a player who never asked, which is the single discovery the first two
chapters are built around.

Per `CLAUDE.md` this is a missing engine capability rather than something to work around,
so: `Mission.quotes` — a first-match-wins list of `ConditionalQuote`, with `saidQuote` as
the unconditional fallback. **Kept orthogonal to `variants`** on purpose. A person speaking
up is not the same event as the scene being rewritten, and coupling them would force an
author to fork three paragraphs of prose to add one line of dialogue.

The gate that matters is the coverage one. A shadowed entry — a broad `when` sitting above
a narrow one — silences the narrow quote permanently, and because the fallback still
renders, **the brief looks completely normal**. So `sweep` tracks `firedQuotes` exactly as
it tracks `firedVariants`, and `analysis.test.ts` fails the build on a line of dialogue no
reachable state can hear. `validate.ts` also leak-checks, word-budgets and
unset-flag-checks the new field, because a conditional surface that skips those is three
known bug classes re-opened.

**Cost:** one engine function, one tracked set, ~20 lines. **Reversible:** yes — delete the
field and the three authored entries fall back to `saidQuote`.

---

## D-048 · The teaching was attributed and still read like a wall poster
The original complaint about this game was that it sounded condescending. Every previous
pass attacked the *framing*: an unattributed "Tip." box became a named colleague with a
job, a photograph and a stake. That was correct and it shipped. What it exposed is that
**framing was only half the problem**, and the remaining half was measurable.

Each advisor speaks in two places. Their `quote` and `advisorLine` were written as speech —
*"Whatever we write down, somebody has to build. I'd rather promise less and mean it."*
Their `lesson.principle` was written as a proverb — *"Price is not a number, it is a
position."* Both render under the same name and the same photograph, inside quotation
marks, on the same screen. Measured by `tools/voice.mjs`:

| | first person | unsituated maxim |
|---|---|---|
| `quote` / `advisorLine` | 73% | 1 of 15 |
| `principle` | **0 of 41** | **30 of 41** |

So the defect was never that the teaching lacked an author. It is that **one named person
spoke in two registers depending on which field the words were stored in** — 3 of 4
advisors had zero first-person teaching lines against majority-first-person speech. Putting
a proverb in a real person's mouth and a photograph beside it arguably made it worse.

All 41 rewritten in the voice of whoever says them, teaching unchanged: *"A price is a
position I have to hold for months, not a number we fill in tonight."* Split speakers 3 of
4 → **0 of 4**; unsituated maxims 30 of 41 → **0 of 41**.

Two things learned the hard way. The overlap gate's stopword filter drops words of ≤2
characters, so `we`/`us`/`my`/`I` are free but **`our` counts as a content word** — leaning
on "our" in all 41 would have walked every pair toward `LESSON_OVERLAP_LIMIT`. And the
maxim detector over-reported badly on its own: *"A price is a position I have to hold"*
matches the copula shape, so the honest test is tenseless AND impersonal AND **containing
nothing that points at the event**. The grammatical shape was never the defect; being
unsituated was.

**Cost:** 41 lines rewritten, ~1.1 kB of content. **Reversible:** yes, but the old lines
are only in git — the measurement is the reason not to go back.

---

## D-047 · The decide screen has no reading stations, and that is the finding
`DENSITY-FRAMEWORK.md` §B specifies a five-station reading order and ranks the devices
that enforce it, strongest first: **a shared rule**, a container border, an air step, a
size step, one accent fill. The instrument only ever counted the last two — prominent type
and saturated fills — and `DESIGN-SYSTEM.md` permits exactly one C\*>60 fill per screen
while the type step above the 18px option title is 24px, the question's own size. So
stations 1 to 3 were structurally invisible and every screen scored 1 of a 5–6 band.

That looked like an instrument artefact, so the probe now counts separators too, which is
the device the spec ranks **first**. It then found **none**. Measured directly on the
decide screen: zero elements spanning ≥55% of the 1,414px work area carry a top border or
render as a hairline. The borders in this design are all on the option cards, which are
163–205px wide.

**So the screen genuinely has one station: a 24px heading, then a row of cards.** There is
nothing dividing it into reading stops. That is the most literal available form of the
complaint that started this work — "no system to read the flow" — and it survived four
rounds of fixes aimed at colour, copy length, the brief/decide split and a density rubric.

Kept rather than reverted, because the instrument now matches its own specification and
will count a rule the day one exists. **Cost:** stations scores 0/10 honestly instead of
10/10 dishonestly. **Not fixed here:** adding the separators is a layout change, and it is
the next thing this screen needs.

## D-046 · Declaration is not resolution, for the third time — `@theme static`
Tailwind v4 emits only the `@theme` variables it can find, by scanning source for the
literal token name. Half this palette is named from a template literal —
`var(--color-${d}-tint)` for the meter tracks, `var(${meta.fillVar})` for their fills — and
a scanner cannot follow that. Resolved in a real browser, **21 of 114 declared tokens were
the empty string**, and two were load-bearing: `--color-profit-tint` and
`--color-deliver-tint` were blank, so **two of the three meter tracks had no fill on any of
the 31 beats** while `DESIGN-SYSTEM.md` documents the tinted track as deliberate.
`--color-win-tint` survived only because the string appears in a **code comment** about an
earlier bug in the same file.

Nothing could see it. `tokens.test.ts` parses `index.css` and asserts each tint is declared
exactly once and is not self-referential — both true, and both beside the point. This is
the same failure as D-010 and D-037 and the self-referential tints of D-036: **a test that
checks a name is not a test that checks a value.**

`@theme static` makes the palette's documentation and its runtime agree. **Cost**, measured
by building both ways: the 19 genuinely unused tokens it also emits take the stylesheet
from 7.98 to 8.15 kB gzipped, **+0.17 kB**. **Reversible** in one word, at the price of a
palette that cannot be trusted.

## D-045 · The closing debrief is two views of one data source; the ring is deleted
The debrief overflowed its box by **2,700px** at 1440×900 and by 1,967–2,782px depending on
the path, and by 2,576px at 1440×1024 where the fit rule is actually enforced — a hard
build failure. 598–657 words in one column, one declared region, 10–12 distinct fills, and
a concentric gauge that drew Winability 100 as a **408px** arc and Deliverability 100 as a
**283px** one: a 31% error in the last image the game leaves anyone with, animated over
1.1 seconds, the longest motion in the product.

Concentric arcs cannot compare, because circumference is a function of radius, so equal
values are drawn unequal **by construction**. The ring is replaced by the same three-panel
small multiple the resolving beat already uses — equal tracks on a shared baseline, where
100 and 100 are the same length to the pixel — and the established `target`/`coins`/`layers`
pictograms return in place of `◆ ● ▲`.

The audit trail a facilitator needs stays in the DOM and is revealed by `@media print`,
which also opens the disclosure: every decision, every outcome headline, every colleague's
`watchFor`, the ledger detail, and the run code at the foot. Measured at A4's 688px content
width it is 3 pages / 50 kB. On screen: **254 words, 6 regions, 8 fills, 0px of overflow.**

This is also where `watchFor` finally renders — 32 lines authored, 0 shown, 471 words of the
only conditional knowledge in the game — attributed to the colleague who said it, and
guarded so it can never appear unattributed. 21 of the 30 imperatives in the content live in
that field, and an unattributed imperative is the lecture this project keeps deleting.
**Cost:** the dense form needs a printer or a click. **Reversible**, but not without
re-deriving the geometry: the previous form failed the fit gate at every enforced height.

## D-044 · Five columns is a different card
m10 became a five-option beat so that "price the change" could exist as an answer at all
(backlog 5.1 — the game had no change-control answer at all). At four options a card is 205px wide; at five it is 163px, and the poster was
authored for the wider one — the card needed 620px of a 568px row and the primary label was
**clipped mid-word** by the console's bottom edge, which is worse than an overflow: an
unreadable control on the object the screen exists for.

Three changes, scoped to five columns or more: body 15px → 13px, medallion 60px → 48px,
"Select this option" → "Select". The type step is not a concession — `DESIGN-SYSTEM.md`
assigns 15px at a ≤66ch measure and 13px to card body at ≤46ch, and a 163px column is
**22ch**, below Bringhurst's 45ch floor. 15px there was the wrong step, not the right step
shaved. 620px → 545px, nothing clipped, no content cut, and at 3–4 options the card is
byte-identical to before. **The alternative was cutting one of the five options**, and two
of them are the ways to pay for a change and two the ways not to — the beat's whole lesson
is the contrast.


## D-041 · Below 1024px the game says so, rather than reflowing into a layout nobody designed
At 390px the console rendered as a 2,700px vertical stack with the primary action **250px
clipped** inside an `overflow-hidden` shell, and focusing a prediction chip scrolled the
whole application sideways with no scrollbar to get back. The screenshot harness captured
45 images of this and passed, because it checks *vertical* overflow of the working area
and the document reports no horizontal overflow when the shell clips.

That reconciliation is the finding: **`overflow: hidden` converts a reflow failure into an
invisible clip that satisfies both WCAG 1.4.10 and this repo's own fit gate.** An
accessibility audit scored 1.4.10 a pass at 390px, correctly, by measuring the document;
the UX audit measured the shell and found the button unreachable.

Verified clean at 1024×768, 1152×800, 1280×800 and 1366×768, so the floor is measured
rather than assumed. Below it, a designed notice. Also fixed regardless of width:
`[data-region=commit]` now wraps — three fixed-width children gave it a ~640px hard
minimum, and `gap-y-2` was already present, so wrapping was always the intent.

**The panel split and the dissent is recorded.** The accessibility reviewer's position is
that "desktop-only in the README" is not available for mandatory training, because it
reaches people on loaned and personal devices and a README line is not a reasonable
adjustment. That is right, and it is why this entry says a small-screen design is a
**precondition for required deployment** rather than a backlog item. What ships today is
honest about its limits; it is not sufficient for a compliance context.
**Cost:** phone and tablet players get a notice. **Reversible:** yes — it is one branch.

## D-040 · A gate that skips itself reports green
`tools/verify.mjs` is mandatory per `CLAUDE.md`. Its fit check opened with
`if (!ENFORCE_FIT) return;`, where `ENFORCE_FIT = DESKTOP && VIEWPORT.height >= 1000` and
the default viewport is **1440×900** — so for every run of the documented workflow the
fits-one-screen rule, which the file's own docstring calls what separates the console from
a form, returned on its first line. It was also never *called* on the consequence screens
or the ending: the screen carrying 100% of the teaching, and the densest screen in the
game, were both unmeasured at any height.

Now it always measures, calls on every screen type, and fails at the enforcement height
while reporting below it. Reporting rather than failing below 1000px is a deliberate
compromise — the rule is authored for a taller screen, and making the default run red
would simply get the flag flipped back.

**One thing this did not fix, and it is worth stating.** The harness plays exactly **one
path**, so path-dependent overflow is still invisible: an auditor measured the ending
overflowing by 1,867px on their run, and on the harness's first-option path it measures
739 in 739. Two other reviewers reported the ending's ledger sliced mid-word, both noting
it was path-dependent. Multi-path rendering is the outstanding gap.
**Cost:** none. **Reversible:** trivially.

## D-039 · Nine perspectives audited the finished game; the diagnosis was none of the four things previously fixed
Four rounds of feedback — "feels like a form", "too much text" ×3, "too densely packed, no
system to read the flow" — had produced four fixes: colour, copy length, the brief/decide
split, and the density rubric. The complaint did not move. So nine reviewers audited the
build independently, each from one named perspective (learning science, game systems,
narrative, UX architecture, visual design, accessibility, domain authenticity, adversarial
QA, product adoption), each required to cite a file, a line or a reproduction.

They converged from nine directions on one thing nobody had measured: **the game does not
respond to the player, and its read-outs cannot distinguish a thinking player from a
coin-flipper.** The evidence, all independently reproduced before being accepted:

- **0 of 45 options** sit behind a `requires` gate. Knowledge changes the prose and the
  numbers; it never changes what the player may *do*.
- **0 conditions read a dimension.** The three meters are write-only — a scoreboard
  attached to the side of a questionnaire, which `validate.ts` warns about only if it
  *stops* being true.
- **`win` never falls below 55** across all reachable endings, so `finalVerdict`'s
  `win < 40` branch — the failure ending for the game's first four chapters — is
  unreachable. It is unit-tested with synthetic dimensions, which is why it looked alive.
- **Five separate non-reader policies** (always-index-*n*, cheapest cost pips, dearest cost
  pips, meter-greedy) all reach the best verdict in the game. The engagement premium — the
  gap between the best reader and the best non-reader — is *negative*.
- **77% of runs render zero causal threads**, the section the code calls "the payoff of the
  whole design".
- The first **situation variant appears at mission 10 of 16**; the first nine beats read
  identically no matter what the player knows, promised or spent.

**Cost:** the density work was not wasted but it was not the fix, and three rounds of
effort went into the wrong layer. **Reversible:** the findings are recorded; acting on them
is the next decision, not this one.

## D-038 · The density rubric was scored out of 92, and its reading-flow factor was never built
`tools/measure.mjs` reported **92/92 PASS** and that number was reported upward three
times. The weights sum to **92**, not the 100 its own docstring claims. Two factors from
`DENSITY-FRAMEWORK.md` §C were specified, marked "✅ Auto", and never implemented:
disclosure share (weight 5) and **between-beat overlap** (weight 3) — the single factor in
the whole framework that measures continuity *between* screens. Measured by hand it scores
**0.50 against its own 0.85 threshold**: it is the one factor that would have failed, and
the one that speaks directly to "no system to read the flow".

The `stations` band also moved from the documented **5 (max 6)** to an implemented **3–4**,
which is what lets three stations score 10/10. D-033 closed with "the numbers should not
move to accommodate a screen that fails them", and then they did.

**The lesson is about instruments, not about density:** a rubric whose bands are tuned
after seeing the build measures the build's opinion of itself. **Cost:** the 92/92 claim
was worthless and has to be re-earned. **Reversible:** yes — implement both factors, restore
the documented bands, and re-score.

## D-037 · Gates must be structural, because three written for a specific bug could not see it
Three colour failures shipped past the test written to catch them, and the reasons
generalise:

- **A regex cannot follow a template literal.** The white-on-solid test matched
  `color: "#fff"` near `background: "var(--color-win…"` as literal source text. All three
  real offenders built the value as `` `var(${meta.fillVar})` ``. Fixed by making the rule
  structural instead: components may no longer name a role-ambiguous token at all.
- **Declaration is not resolution.** The triad test asserted `--color-win-tint:` appeared in
  the CSS. It appeared **twice** — the second as `var(--color-win-tint)`, a self-reference,
  which is invalid at computed-value time and destroyed the first. All three dimension
  tints resolved to the empty string while the test passed. Now checked for self-reference
  and duplicate declaration, and the computed values are read in a real browser.
- **A glob is a scope decision.** The sweep globbed `../ui/*.tsx`, so `App.tsx` was never
  swept and carried `text-[12.5px]` at two sites. Now `../**/*.tsx`.

A fourth, from the same family: `ENFORCE_FIT = DESKTOP && VIEWPORT.height >= 1000` in
`tools/verify.mjs`, whose default viewport is 900. The fits-one-screen rule — which the
tool's docstring calls "what separates this from a form" — does not run in the mandatory
workflow, and screens do overflow at 1440×900.

**Cost:** four gates rewritten, and a standing suspicion of the rest. **Note:** the new
tests initially failed on their own rationale, because each rule is documented at the site
it governs and the banned spelling appears in the explanation. Comments are stripped before
every sweep; the alternative was deleting the explanations.

## D-036 · Two colour tokens per dimension, because one cannot be legal in both places
`DIMENSION_META` carried a single `varName` per dimension pointing at `--color-win`, the
migration alias for `--color-win-solid`. Components used it for the bar fill *and* the 13px
label, so the label was painted in the fill colour: **#cd6d0a on white at 3.63:1** and
**#339075 at 3.90:1**, on 42 of 45 screens, while `DESIGN-SYSTEM.md` stated the rule being
broken. White text on the Winability solid appeared in two more places.

Split into `fillVar` (bars, strokes, chip backgrounds — 3:1 under 1.4.11) and `textVar`
(labels, numbers — 4.5:1 under 1.4.3). **The alias layer was the mechanism**: `--color-win`
reads as "the Winability colour", which is not a thing. There is a fill colour and a text
colour and they are different values.

**Cost:** one field became two at every call site. **Reversible:** no, and it should not be.

## D-035 · The prediction gate answers the question it prints
The gate asks "which of the three will move least?" and the consequence screen says "X
barely moved". The key compared **signed** deltas — which answers the question it used to
ask, "which will this hurt?" — and so returned whichever dimension *fell furthest*. Across
the 88 authored outcomes it named a falling dimension **61 times (69%)** and contradicted
the printed question **52 times (59%)**. The screen said "Profitability barely moved" beside
a tile reading **−14**.

The first fix compared magnitude and left a subtler bug of the same shape: returning a
single winner made the **tie-break** carry meaning. `reduce` keeps the earlier element and
`DIMENSIONS` begins with `win`, so 6 of the 12 tied outcomes keyed to Winability and
"always answer Winability" beat chance. At the meter ceiling — reachable by mission 14 — all
three deltas are zero and the screen claimed Winability held.

So `leastMovedSet` returns every tied dimension, the **engine** decides
`predictionCorrect` (a component comparing two ids cannot know a tie has several right
answers, and a component deciding a verdict is a rule in the UI), and `nothingMoved` gets
its own honest sentence. **Cost:** one field became four. **Why it mattered most:** this is
the only place in the game where the player commits a claim and is marked on it, so it is
the only thing here that can be *wrong* rather than merely unclear — and feedback that
contradicts the numbers beside it teaches the player to stop reading that channel.

## D-034 · The palette and type scale are derived, not chosen — `docs/DESIGN-SYSTEM.md`
Winability `#5b4de8` and the brand accent `#7c3aed` measured **ΔE2000 1.2 apart under
deuteranopia** — roughly half a just-noticeable difference, i.e. the same colour to about
6% of men, with the brand sitting in the middle of the channel that was supposed to carry
dimension identity. So the brand recedes to ink, the three dimensions own the chroma on an
Okabe–Ito triad (orange / bluish-green / blue, with a deliberate 56/54/34 lightness split),
and the worst pairwise separation across normal, protan, deutan and tritan vision becomes
**18.9**. Surfaces moved from lavender-grey to warm paper against cool ink.

Four live WCAG failures fixed at the same time: a **1.60:1** disabled button, a **2.78:1**
eyebrow, a **1.86:1** focus ring and a **1.52:1** border on controls. Type went from 27
sizes — including 9px and a run of half-pixels — to **seven integer steps**, because 1.25
from 12px gives 15/18.75/23.4/29.3 and non-integers are how half-pixels get born.

Three more failures were found later by audit and are recorded in D-036. **Cost:** dark mode
is deferred, because lightening the triad for a dark ground collapses its separation to
ΔE 3.5 — it needs a second independently optimised triad, not a token swap.
**Sources:** Okabe & Ito palette construction · Radix Colors scale semantics · Atlassian
token anatomy · Carbon type sets · W3C Understanding 1.4.11 · APCA 0.1.9 · Machado et al.
2009 CVD matrices · Bringhurst and Baymard on measure · Tinker 1955 on all-caps.

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
