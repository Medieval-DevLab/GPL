# Screen taxonomy

> Historical reference, superseded on 22 September 2026 by [Complete game backlog](COMPLETE-GAME-BACKLOG.md), [content coverage](GAME-CONTENT-COVERAGE.md) and [desktop/photo specification](GAME-PHOTO-AND-SCREEN-SPEC.md). Older approval labels, mobile compositions, illustration-only cast, prediction gates and conflicting screen requirements below are not implementation authority.

**For whoever designs or builds a GPL screen.** What screen types exist, what each is for,
how a player knows which one they are looking at, and how many of each a run should
contain. Derived from teardowns of marquee titles, not from preference. Where a figure is
inference rather than sourced, it says so.

---

## 0. The finding that reframes the question

A GPL run today is **76 screen instances across 14 distinct types**. So the complaint that
"the screens are almost the same" was never a shortage of types. It is the distribution:

| Type | Instances per run | Share |
|---|---|---|
| brief / dialogue-listen | 17 | 22% |
| decide / dialogue-reply | 17 | 22% |
| resolving | 17 | 22% |
| consequence | 17 | 22% |
| everything else (title, setup, 5 cut scenes, hub, map, awards, badge, ending) | 8 | **11%** |

**Four types are 89% of everything the player sees**, each repeating seventeen times, while
the variety sits in the 11% they rarely reach. That is the whole problem, and it means the
fix is not "add screen types". It is:

1. a **mode grammar**, so the four repeated types stop looking like one screen (§1);
2. **variation inside** those four, because that is where the experience actually is (§4);
3. **reclaiming slots** from types that do not earn one (§5).

---

## 1. The mode grammar — the crux

> A player must know, before reading a word, whether this screen wants them to **watch**,
> **read**, **decide**, **receive** or **navigate**.

Across every marquee title torn down, the signal is **chrome quantity, monotonically** —
plus exactly one element unique to decisions. Camera and colour are secondary everywhere.
**Do not make colour the primary carrier of mode; none of these games does.**

| Mode | Chrome | Distinguishing element | The rule |
|---|---|---|---|
| **WATCH** | **Removed.** No rails, no meters, no action bar | Full-bleed field; the action sits *on the scene* | Signalled by **subtraction** — the screen is emptier than the modes either side of it |
| **READ** | Present and calm | An **advance affordance** and a persistent mode bar | Chrome, but nothing at stake and no clock |
| **DECIDE** | Present | **One stake element**: the meters that will move, or the prediction gate | Chrome + stake. This is the only mode that shows a cost |
| **RECEIVE** | Present | The **result is the subject** of the screen; input is "continue" only | Chrome, no stake, no choice |
| **NAVIGATE** | **Different ground entirely** (the dark stage) | Outside the fiction's clock | A change of world, not a change of page |

**Evidence.** Cut scenes are signalled by letterboxing *because* the bars simultaneously
notify the player and hide gameplay chrome — subtraction is the message. Ace Attorney keeps
four commands (Examine / Move / Talk / Present) permanently on screen so the investigation
mode is legible before a word is read: **a persistent command bar is a mode declaration.**
And every marquee decision screen adds exactly one thing the other modes never have — a
timer (Telltale's shrinking line, Frostpunk's event clock, Kahoot's countdown), meters
(Reigns' four gauges above one card), or an irreversibility mark (Disco Elysium colour-codes
white checks as retryable and red as not).

**Where GPL fails this today:** brief, decide and consequence share chrome, ground and
action position. Three modes, one grammar. That is why 66 of 76 screens feel like one
screen.

**Our stake element is already built and should be the marker:** the prediction gate. It
appears on decide beats and nowhere else. It is our shrinking line.

---

## 2. The three the question asked about

### (a) Pure cut scene — **watch**
No input but "continue". Chrome removed, full bleed. Used for exactly three jobs:
**establishing** a situation, **transitioning** time or place, and **delivering a
consequence the player cannot alter**.

Worth knowing: across 16,214 catalogued screens from shipped titles, there is **no "cut
scene" category at all** — the industry treats cinematics as *sequences between* screens,
not as screens. So a cut scene should never be a page you sit on; it is a passage you move
through.

**In GPL:** the 5 chapter openers. Candidates to add: the award decision and the sponsor's
resignation — both are moments the player cannot alter, which is the definition.

### (b) Interactive message screen — **read**
You advance lines and may pick a reply, but **nothing is at stake**. Chrome present, no
clock, no meters moving. Disco Elysium surfaces reversibility as a visible property; that is
the honest version of this mode.

**In GPL:** the listening half of every call and chat beat. **The trap we must avoid is
making these look like decisions** — a reply that costs nothing must not wear the decide
grammar, or the stake element stops meaning anything.

### (c) Real decision — **decide**
A consequential, marked choice. Chrome **plus** the stake element. In GPL that is the
prediction gate plus the three meters that are about to move.

**In GPL:** 17 of these, and that is the core of the game. They should not all be the same
shape — see §4.

---

## 3. The catalogue

Sorted by mode. "Earns it" applies the rule that **a type justifies its recognition cost
only if it recurs roughly three or more times per session** (inference, flagged as such) —
except types that need no learning at all, like a title or an ending.

| # | Type | Mode | Input | Duration | Per run | Have it? |
|---|---|---|---|---|---|---|
| 1 | Title / attract | navigate | one press | seconds | 1 | ✅ |
| 2 | Hub | navigate | navigate, take stock | 30 s | on demand | ✅ new |
| 3 | Journey map | navigate | pick / review | 10–20 s | on demand | ✅ new |
| 4 | Recognition board | navigate | browse | 20 s | on demand | ✅ new |
| 5 | Codex — "Your file" | read | browse, opt-in | untimed | always present | ✅ (as a rail) |
| 6 | **Cut scene** | watch | continue | 15–40 s | 5 → **8** | ✅ |
| 7 | Reward moment | watch | dismiss | 3–5 s | 2–6 | ✅ new |
| 8 | Brief / dialogue-listen | read | advance | 20–40 s | 17 | ✅ |
| 9 | Comparison decision | decide | 1 of 3–5 | 30–60 s | 7 | ✅ |
| 10 | Reply decision | decide | 1 of 3–5 | 30–60 s | 10 | ✅ |
| 11 | Allocation | decide | N of M | 60 s | 3 | ✅ (m2, m5b, m7) |
| 12 | **Apply / rebuttal** | decide | present stored evidence | 60–90 s | **0 → 2** | ❌ **missing** |
| 13 | Consequence | receive | continue | 15–30 s | 17 | ✅ |
| 14 | **Reflection node** | read | cheap binary | 10–15 s | **0 → 4** | ❌ **missing** |
| 15 | **Chapter debrief / path-reveal** | receive | browse | 30–60 s | **0 → 5** | ❌ **missing** |
| 16 | Ending debrief | receive | browse | 2 min | 1 | ✅ |
| 17 | ~~Resolving~~ | — | none | 1 s | 17 → **0** | ⚠️ **cut** |

### The three genuinely missing types, in priority order

**12 · Apply / rebuttal — the most important gap.** This is the beat where **stored
knowledge is the currency** — Danganronpa's Class Trial firing Truth Bullets at weak points,
Ace Attorney's cross-examination presenting evidence against a claim. It is the only marquee
type where what you *learned earlier* is the resource, rather than preference or reflex, and
it is therefore the single most relevant type to a business simulation.

GPL already has everything it needs: `discovered` evidence, 32 knowledge flags, and a
`ledger` of commitments. **The player has never once been asked to use them explicitly.**
The obvious home is the handover — Aisha's *"my team inherits every sentence in that
proposal, which ones did you mean?"* — where she reads back the player's own promises and
they must stand behind them. That line is already the best in the game and is currently
rhetorical.

**14 · Reflection node.** Slay the Spire *guarantees* a rest site at floor 15 of every act;
rest sites are 12% of all rooms. GPL runs 17 consequential decisions back to back with no
breath between them. A cheap, low-stakes binary — a moment with a colleague, a choice that
costs nothing — is what makes the next decision feel like a decision. It is also the correct
home for Thiagi's debrief questions **"how does this relate to the real world?"** and **"what
if?"**, which are where transfer actually happens and which vendor products routinely omit.

**15 · Chapter debrief / path-reveal.** Detroit: Become Human ends every chapter with a
flowchart of the branches, including the ones you did not take, annotated with the
percentage of players who found them. GPL reveals causality **only at the very end**, which
is too late to change how anyone plays. A per-chapter reveal is also the natural place to
land the celebration: Attensi fires its stars and confetti **on the map**, not inside the
module.

### The type to cut

**17 · Resolving.** A one-second transition currently occupying **17 of 76 slots** — a full
screen type earning its place purely by being in the way. It should be the consequence
screen's *entrance*, not a screen. That reclaims 22% of the run's screen instances at no
cost to anything.

---

## 4. Pacing — and why the 17 decisions must not be one shape

Marquee loops are deliberately **not** uniform. Slay the Spire's act is 17 floors of which
15 are navigable, composed at Ascension 0 of **53% normal combat, 22% unknown, 12% rest,
8% elite, 5% merchant** — with fixed anchors: floor 1 is always an easy fight, floor 9 is
always treasure, floor 15 is always a rest. The variety is *scheduled*, not random, and the
anchors give the act a shape you can feel.

GPL's equivalent, as a target composition per run:

```
  17 decisions, deliberately unequal:
      7  comparison        the analytical beats — columns are right for these
     10  reply             call and chat
      3  allocation        (a subtype of comparison: N of M)
      2  apply/rebuttal    ← new, and the ones the run should build toward

  paced by:
      8  cut scenes        5 chapter openers + 3 story turns the player cannot alter
      4  reflection nodes  ← new, one between chapters 1-2, 2-3, 3-4, 4-5
      5  chapter debriefs  ← new, where the celebration lands
```

**Anchors, borrowed from the Slay the Spire principle:** chapter one opens on a cut scene
and its first beat is always a comparison (the easiest mode to learn). The apply/rebuttal
beats sit late — one at the deal, one at the handover — so the run builds toward using what
you gathered. Every chapter ends on a debrief, so the shape repeats and becomes legible.

**Session length.** Axonify's 3–5 minute sweet spot is derived from ~4 million sessions
across 360,000 employees; Papers Please days run 3–8 minutes of real time. GPL's chapters
are 3–4 beats, which lands in the same band and is right.

**One principle worth stealing outright:** in Papers Please, **booth prep is untimed by
design** — reading the rulebook costs no clock. Our brief must never feel rushed for the
same reason: pressure belongs on the decision, not on the reading.

**Not verified, and I will not invent it:** no published source gives a cut-scene : dialogue
: decision ratio for any narrative game, nor a "time between meaningful decisions" figure,
nor the longest input-free stretch a marquee game allows. Sid Meier's "series of interesting
decisions" gives no interval. The composition above is our design, informed by Slay the
Spire's published distribution — not a copied industry standard.

---

## 5. Rules

1. **Mode is carried by chrome, monotonically.** Watch removes it, read keeps it calm,
   decide adds a stake element. Never signal mode by colour alone.
2. **The prediction gate is our stake element.** It appears on decide beats and nowhere
   else. If it ever appears on a read beat, the grammar is broken.
3. **A cut scene is a passage, not a page.** No chrome, no rails, one action, and the player
   moves through it rather than sitting on it.
4. **An interactive message screen must not wear the decide grammar.** If nothing is at
   stake, nothing may suggest cost.
5. **A type earns its place at roughly three appearances per session**, unless it needs no
   learning (title, ending). A type appearing once is paying rent without earning it.
6. **Celebration lands on the map**, not inside the beat — Attensi's pattern, and it makes
   the map worth returning to.
7. **Failure is not a screen.** Game-over screens are 1.3% of catalogued screens across
   16,214. Hades makes death the loop; Papers Please puts a bad day on the end-of-day
   ledger; Disco Elysium makes a failed red check into the story. GPL already does this —
   walking away is an ending, not a failure — and it should stay that way.
8. **Reading is never on a clock.** Pressure belongs on the decision.

---

## 6. What this changes, in order

1. **Cut `resolving` into the consequence's entrance.** Reclaims 22% of screen instances.
   Cheapest, largest structural win.
2. **Apply the mode grammar to the four repeated types.** Brief, decide and consequence
   currently share chrome, ground and action position; separating them is what stops 66
   screens reading as one.
3. **Add the 4 reflection nodes.** Cheap to build, and they are where transfer happens.
4. **Add the 5 chapter debriefs** and move the celebration onto them.
5. **Add the 2 apply/rebuttal beats**, starting with the handover. Highest ceiling, highest
   cost, and the one type that makes a business sim teach rather than test.
6. **Promote 3 story turns to cut scenes** — the award, the resignation, one more.

---

## Sources

Interface In Game's catalogue of 16,214 screens across 21 tags · Slay the Spire wiki (map
generation, room distribution, fixed floors) · Hades wiki (chambers per biome) · Ace Attorney
wiki (investigation command bar) · Danganronpa wiki (Class Trial structure) · Papers Please
day structure and untimed booth prep · Telltale's timed choice line · Frostpunk event timers ·
Reigns' four-gauge single card · Disco Elysium colour-coded check reversibility · Detroit:
Become Human end-of-chapter flowchart · Duolingo path → lesson → interstitial · Kahoot's
four-screen question cycle · Axonify's 3–5 minute session data · Attensi star bands and
map-side celebration · Thiagi's six-phase debrief · Sid Meier, GDC 2012.

**Unverified and flagged as such:** any ratio of cut scene to dialogue to decision; a maximum
learnable screen-type count; the longest input-free stretch in a marquee game; Gamelearn's
screen sequence, which is not publicly documented anywhere.
