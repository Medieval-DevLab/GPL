# The game sequence

**For whoever builds or sequences a GPL beat.** The complete run, beat by beat, with every
screen type placed and every mode marked. Companion to `SCREEN-TAXONOMY.md`, which defines
the types; this places them.

---

## 0. The line between gameplay and everything else

> **Exactly one screen type changes the game state. That type is the gameplay. Everything
> else is framing.**

That is the whole distinction, and it is mechanically testable rather than a matter of
taste:

| | Screens | Player input | Changes `dims` / `flags` / `badges`? |
|---|---|---|---|
| **Gameplay** | 17 decisions | picks an option, commits a prediction | **Yes** |
| Framing — watch | 8 cut scenes | continue | No |
| Framing — read | 17 briefs, 4 reflections | advance, browse | No |
| Framing — receive | 17 consequences, 5 debriefs, 1 ending | continue | No |
| Framing — navigate | hub, map, awards | move | No |

**17 of roughly 85 screens are the game. The other 68 are the theatre around it.** Both
have to exist — a run of 17 bare decisions is a form, and 68 screens of theatre is a film —
but they must never be mistaken for each other:

- **Framing that looks like gameplay** makes the player brace for a decision that never
  comes, and they stop trusting the signal.
- **Gameplay that looks like framing** gets clicked through, and a consequential choice is
  made without attention. This is the worse failure and it is the one we currently have.

The enforcement rule is in `SCREEN-TAXONOMY.md` §1 and it is one line: **a screen carries
the stake element if and only if it changes state.** Our stake element already exists — the
prediction gate. It appears on all 17 decisions and nowhere else.

---

## 1. The chapter engine

Every chapter is the same machine, so the shape becomes legible by chapter two:

```
   ┌── CUT SCENE ─────────── watch ······ chrome removed, full bleed
   │
   │   ┌── brief ─────────── read ······· chrome calm, no stake
   │   │   DECIDE ────────── decide ····· chrome + prediction gate    ← the game
   │   └── consequence ───── receive ···· result is the subject
   │        × 3–4 beats
   │
   │   REFLECTION ─────────── read ······ once per chapter, after the hardest beat
   │
   └── CHAPTER DEBRIEF ────── receive ···· what you did, what you missed, stars
       MAP ──────────────────  navigate ·· the celebration lands here
```

**Anchors**, borrowed from Slay the Spire's principle that variety is scheduled rather than
random (floor 1 always an easy fight, floor 9 always treasure, floor 15 always a rest):

- Chapter 1's first beat is always a **comparison** — the easiest mode to learn.
- The **reflection node follows the chapter's hardest beat**, not the boss-adjacent slot
  Slay the Spire uses. Our content is emotional rather than attritional, so recovery
  belongs *after* the blow.
- Every chapter **ends on a debrief and returns to the map**, so the loop closes in the
  same place every time.
- The two **apply/rebuttal** beats sit late — chapters 4 and 5 — so the run builds toward
  spending what you gathered.

---

## 2. The run, beat by beat

`◆` = gameplay (changes state) · `·` = framing

### Chapter 1 — Find the right client
| | Screen | Mode | Note |
|---|---|---|---|
| · | **Cut scene** — "Chapter One: Find the client" | watch | Priya at 400px, city plate |
| · | brief | read | |
| ◆ | **m1 · comparison**, 3 options | decide | The teaching beat: three clients, one team |
| · | consequence | receive | |
| · | brief | read | |
| ◆ | **m2 · allocation**, 2 of 5 evidence | decide | Spend two questions before you speak |
| · | consequence | receive | |
| · | brief | read | |
| ◆ | **m3 · reply (chat)**, 3 options | decide | Priya, internal |
| · | consequence | receive | |
| · | **Chapter debrief** | receive | First stars, first path-reveal |
| · | Map | navigate | Chapter 1 fills in gold |

### Chapter 2 — Make it an opportunity
| | Screen | Mode | Note |
|---|---|---|---|
| · | **Cut scene** — chapter open | watch | |
| · | brief · ◆ **m4 · comparison** · consequence | | Is this real? |
| · | **Cut scene** — *the rival moves* | watch | **New.** Done to you; you cannot alter it |
| · | brief · ◆ **m5 · reply (call)**, 4 options | | Sarah, under board pressure |
| · | consequence | receive | |
| · | **Reflection** — after the rival beat | read | **New.** "Does this change anything real?" |
| · | brief · ◆ **m5b · allocation**, 2 of 5 · consequence | | Where the team actually goes |
| · | **Chapter debrief** → Map | receive → navigate | |

### Chapter 3 — Build the response
| | Screen | Mode | Note |
|---|---|---|---|
| · | **Cut scene** — chapter open | watch | |
| · | brief · ◆ **m6 · reply (call)** · consequence | | Marcus, if you found him |
| · | brief · ◆ **m6b · comparison**, 4 options · consequence | | Another way to do this |
| · | **Reflection** | read | **New.** Mid-chapter breath, four beats is the longest run |
| · | brief · ◆ **m7 · allocation**, 3 of N · consequence | | What goes in the proposal |
| · | brief · ◆ **m7b · reply (chat)** · consequence | | The internal review |
| · | **Chapter debrief** → Map | | |

### Chapter 4 — Make the deal work
| | Screen | Mode | Note |
|---|---|---|---|
| · | **Cut scene** — chapter open | watch | |
| · | brief · ◆ **m8 · reply (call)** · consequence | | The number is too high |
| · | brief · ◆ **m9 · reply (chat)** · consequence | | The review before signature |
| · | brief · ◆ **m9a · APPLY/REBUTTAL**, 4 options | decide | **Reframed.** See §3 |
| · | **Cut scene** — *the award lands* | watch | **New.** Their decision, not yours |
| · | **Reflection** | read | **New.** After the biggest swing in the game |
| · | brief · ◆ **m9b · reply (chat)** · consequence | | Do we take it? |
| · | **Chapter debrief** → Map | | |

### Chapter 5 — Deliver the promise
| | Screen | Mode | Note |
|---|---|---|---|
| · | **Cut scene** — chapter open | watch | |
| · | brief · ◆ **m10 · reply (chat)**, 5 options · consequence | | Month five, internal room |
| · | **Reflection** | read | **New.** Fourth and last |
| · | brief · ◆ **m10b · comparison** · consequence | | Two people short |
| · | brief · ◆ **HANDOVER · APPLY/REBUTTAL** | decide | **New beat.** See §3 |
| · | **Cut scene** — *Sarah resigns* | watch | **New.** Done to you |
| · | brief · ◆ **m10c · reply (call)** · consequence | | Nobody planned for this |
| · | **Ending debrief** | receive | The existing one, plus the claim item below |

**Totals:** 18 decisions (17 existing + the handover) · 8 cut scenes · 4 reflections ·
5 chapter debriefs · 1 ending. `resolving` is gone — folded into the consequence's
entrance, reclaiming 17 slots.

**One more thing happens inside the ending, on 60.8% of runs.** Before the causal chains
are revealed, the debrief asks a single question — *here is what happened in delivery,
which of your decisions led to it?* — and unfolds the chains once it is answered. It is
not a screen and not a beat: it is a band that occupies the chains' own space, so it
costs the ending no height. `SCREEN-SPECS.md` §4.7. A run whose threads carry no authored
wrong answers simply sees the chains directly, which is why the figure is not 100%.

It is the only `decide` in the game with no prediction gate, because it is the only one
that changes nothing — and **it is not marked**. That is not politeness: a graded
question is answered defensively, and the point of asking is to make a cohort argue.

---

## 3. The two apply/rebuttal beats

This is the type the taxonomy identified as most relevant to a business simulation and
entirely absent: **the beat where stored knowledge is the currency**, rather than
preference or reflex. Danganronpa's Class Trial, Ace Attorney's cross-examination.

### m9a — reframed, not rewritten
**The mechanic already exists and the screen hides it.** m9a's options are gated on
`evidenced`, `ops_onside`, `reframed` and `knows:rival_gap` — so the game is *already*
deciding what you may say based on what you found out, and never tells you. Today an option
you did not earn is simply absent, which reads as there being fewer choices rather than as
a consequence.

The apply staging makes the existing mechanic visible: Foyle states his scorecard, and the
player **presents evidence against it** — with the things they gathered shown as available,
and the things they did not gather shown as **greyed and named**. Seeing the argument you
*could* have made is the lesson. No content change; one screen change.

### The handover — a new beat
Aisha's *"my team inherits every sentence in that proposal — which ones did you mean?"* is
the best line in the game and is currently rhetorical. As an apply beat she reads back the
player's **own commitments from the ledger** and they must stand behind, qualify or withdraw
each. It is the only beat that could use the ledger as an input rather than a display, and
it is backlog item 5.7.

---

## 4. What each screen looks like, in one line

| Screen | Ground | Chrome | Primary action | Unmistakable because |
|---|---|---|---|---|
| Cut scene | dark stage, full bleed | **none** | on the scene | nothing else in the game removes the rails |
| Brief / listen | paper | rails + meters, calm | bottom bar | no gate under the options |
| **Decision** | paper | rails + meters | bottom bar | **the prediction gate** |
| Consequence | paper | rails + meters | bottom bar | the result occupies the centre |
| Reflection | paper, warmer | rails only, **no meters** | on the card | the meters are absent — nothing is at stake |
| Chapter debrief | dark stage | none | on the scene | a node graph, not prose |
| Map / hub / awards | dark stage | own chrome | on the map | outside the fiction's clock |

The two rows doing the real work are **decision** (the only one with the gate) and
**reflection** (the only paper screen with the meters *removed*). Between them they teach
the player, without a word, that meters mean stakes.

---

## 5. Build order

Cheapest structural win first; each is independently shippable.

1. **Fold `resolving` into the consequence entrance.** Reclaims 22% of screen instances.
2. **Apply the mode grammar** to brief / decide / consequence — they currently share
   chrome, ground and action position. This is what stops 66 screens reading as one.
3. **Chapter debriefs ×5**, and move the celebration onto the map where it lands.
4. **Reflection nodes ×4** — cheap, and the right home for the two transfer questions
   ("how does this relate to the real world?", "what if?") that vendor products omit.
5. **Cut scenes ×3** — the rival, the award, the resignation. All three are moments done
   *to* the player, which is the definition of the type.
6. **m9a reframed as apply** — no content change, one screen.
7. **The handover beat** — highest ceiling, highest cost, and the one that makes the game
   teach rather than test.

---

## 6. The rules this sequence must not break

1. **The gate appears on all 18 decisions and nowhere else.** It is the only thing marking
   state change.
2. **Reflection nodes never show meters.** If a screen has no stake, it must not display
   the instrument of stakes.
3. **Cut scenes are passages, not pages** — no rails, one action, and the player moves
   through rather than sitting.
4. **Reading is never on a clock.** In Papers Please, booth prep is untimed by design;
   pressure belongs on the decision.
5. **Celebration lands on the map**, not inside the beat.
6. **No failure screen.** Walking away is an ending, not a failure, and it already is one.
