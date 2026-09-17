# Screen specifications

**For whoever builds a GPL screen.** The template every screen is defined by, then every
screen defined against it. Companion to `SCREEN-TAXONOMY.md` (what the types are) and
`GAME-SEQUENCE.md` (where they sit in the run).

Confirmed context: **solo play, one sitting, resumable.** No leaderboard — a performance
dashboard instead (§4.4), because there is no backend and an invented cohort is a lie a
learner will spot.

---

## 1. The grid

Measured, not proposed. Every number below is what the console actually renders.

```
1440 × 900                                    1440 × 1024
┌──────────────────────────────────────────┐
│ top bar                            66px  │  66px
├────────┬────────────────────┬────────────┤
│ left   │ centre             │ right      │
│ rail   │                    │ rail       │   work area
│ 248px  │ 888px              │ 264px      │   1400 × 739        1400 × 863
│        │                    │            │
├────────┴────────────────────┴────────────┤
│ action bar      66px · 97px with the gate│  66 / 97px
└──────────────────────────────────────────┘
```

**Fit is enforced at 1440×1024 and reported at 1440×900.** A screen that overflows the work
area fails `npm run verify`. Budget accordingly: **739px is the number to design to**, and
863px is the number that must not break.

---

## 2. The template

Every screen is defined by these fifteen fields. A screen that cannot fill them in is not
designed yet.

| # | Field | Why it exists |
|---|---|---|
| 1 | **Mode** | watch · read · decide · receive · navigate |
| 2 | **Changes state** | yes = gameplay, no = framing. The single most important row |
| 3 | **Instances per run** | a type earns its recognition cost at ~3+, unless it needs no learning |
| 4 | **Ground** | paper (work) or stage (dark, outside the fiction's clock) |
| 5 | **Chrome** | none · rails only · rails + meters · own |
| 6 | **Regions** | named `data-region` zones and their widths — the probe measures these |
| 7 | **Stake element** | present only if field 2 is *yes*. Non-negotiable |
| 8 | **Primary action** | exact label and where it sits |
| 9 | **Enter / exit** | the transition, with duration |
| 10 | **Content consumed** | which `story.ts` fields. Nothing invented in a component |
| 11 | **Art** | which asset, or none |
| 12 | **Motion** | what moves, and the reduced-motion replacement |
| 13 | **Accessibility** | roles, focus, live regions, contrast obligations |
| 14 | **Fit budget** | max height at 739 / 863 |
| 15 | **Failure mode** | what breaks if authored wrong, and which gate catches it |

---

## 3. All screens at a glance

| Screen | Mode | State? | /run | Ground | Chrome | Gate |
|---|---|---|---|---|---|---|
| Title | navigate | no | 1 | stage | own | — |
| Setup — pick your team | decide | **yes** | 1 | paper | rails | **yes** |
| Hub | navigate | no | on demand | stage | own | — |
| Journey map | navigate | no | 5+ | stage | own | — |
| **Performance dashboard** | navigate | no | on demand | stage | own | — |
| **Cut scene** | watch | no | 8 | stage | **none** | — |
| Reward modal | watch | no | 2–6 | stage overlay | none | — |
| Brief (console) | read | no | 7 | paper | rails + meters | — |
| Dialogue listen — call | read | no | 5 | paper | rails + meters | — |
| Dialogue listen — chat | read | no | 5 | paper | rails + meters | — |
| **Reflection node** | read | no | 4 | paper | **rails only** | — |
| **Comparison decision** | decide | **yes** | 7 | paper | rails + meters | **yes** |
| **Allocation decision** | decide | **yes** | 3 | paper | rails + meters | **yes** |
| **Reply decision** | decide | **yes** | 10 | paper | rails + meters | **yes** |
| **Apply / rebuttal** | decide | **yes** | 2 | paper | rails + meters | **yes** |
| Consequence | receive | no | 17 | paper | rails + meters | — |
| **Chapter debrief** | receive | no | 5 | stage | none | — |
| Ending debrief | receive | no | 1 | paper | rails | — |

**18 decisions carry the gate. Nothing else does.** That is the entire mode grammar in one
column, and it is checkable by a test.

---

## 4. The screens that are new or central

### 4.1 Comparison decision — the reference gameplay screen

Everything else is measured against this one. 7 per run.

```
┌ left rail 248 ─┬─ centre 888 ─────────────────────────┬ right 264 ┐
│ Chapter        │ ▸ question, 24px bold                │ Key       │
│ Mission n/17   │   prompt line, 13px                  │ factors   │
│ ───────────    │ ──────── a rule, full width ──────── │ ▸ 3 meters│
│ beat list      │                                      │           │
│ ───────────    │ ┌────────┐┌────────┐┌────────┐       │ If you    │
│ The brief      │ │facsimile││        ││        │      │ commit    │
│ ───────────    │ │ 124px  ││        ││        │       │ ▸ cost    │
│ Your file      │ │ medal  ││        ││        │       │           │
│  (codex)       │ │ title  ││        ││        │       │ Where you │
│                │ │ desc   ││        ││        │       │ stand     │
│                │ │ ✓ ✗    ││        ││        │       │ ▸ ledger  │
│                │ │ cost   ││        ││        │       │           │
│                │ │[Select]││[Select]││[Select]│       │           │
│                │ └────────┘└────────┘└────────┘       │           │
└────────────────┴──────────────────────────────────────┴───────────┘
┌ action bar ─────────────────────────────────────────────────────┐
│ [colleague steer]   ┃ WHICH WILL MOVE LEAST? ◆ ● ▲ ┃  [Commit] │
└──────────────────────────────────────────────────────────────────┘
                        ↑ THE STAKE ELEMENT
```

| Field | Value |
|---|---|
| Mode / state | decide / **yes** |
| Regions | `question` `options` `commit` + rails `orientation` `account` `standing` |
| Columns | 3–5. At 5 the card is 545px tall with 13px body — a 163px column is 22ch, below Bringhurst's 45ch floor, so the smaller step is correct, not shaving |
| Stake | prediction gate in the action bar, bordered panel against the button |
| Primary action | "Commit to this", action bar right. **Pale until the gate is satisfied** |
| Enter / exit | question band cross-fades 160ms in place; options deal in beneath, 70ms stagger |
| Content | `question` `prompt` `options[]` `commits` `pros` `cons` `cost` `facsimile` |
| Art | inline SVG facsimile, 124px band. Never a photograph |
| Fit | ≤739 / ≤863. m6 was 7px over until the letterbox trim |
| Failure | a fake choice — an option dominating a sibling on all three dimensions in every case — fails the build |

### 4.2 Reply decision — call and chat

10 per run. Same mode, different medium. The composer is shared; the frame differs.

```
CALL                                    CHAT
┌─ ● Live · title · 3 on the call ─┐   ┌─ Team chat · title · 2 in chat ─┐
│ ┌──────┐┌──────┐┌──────┐          │   │ subject line                    │
│ │ tile ││ tile ││ YOU  │          │   │ ┌──┐ Name                       │
│ │      ││ SL   ││ ◉    │ ← ring   │   │ │pic│ ▭ message                 │
│ └──────┘└──────┘└──────┘          │   │     ▭ message                   │
│ ── captions, typed ──             │   │              ▭ your draft ──►   │
├────────────────────────────────────┤   ├──────────── thread takes slack ─┤
│ What do you do?                    │   │ How do you respond?             │
│ ▭ "reply one"                      │   │ ▭ "reply one"                   │
│ ▭ "reply two"            ← chosen  │   │ ▭ "reply two"                   │
│   ┏ WHICH WILL MOVE LEAST? ◆●▲ ┓   │   │   ┏ gate ┓                      │
│ ▭ "reply three"                    │   │ ▭ "reply three"                 │
└────────────────────────────────────┘   └─────────────────────────────────┘
```

| Field | Value |
|---|---|
| Stake | gate appears **directly beneath the chosen reply**, not in the bar — on this surface that is where the requirement is |
| Replies | 3–5, stacked full-width, first person, in quotes. Max 20 words — the wrap point |
| Composer | pinned to the bottom; the thread takes the slack **above** the first message |
| Active speaker | ring moves to the player's own tile when replies open, labelled "Your turn" |
| Content | `advisorLine` / `saidQuote` / `quotes`, `option.say`, `resolveSituation` as thread history |
| Failure | a dialogue option without `say` falls back to the third-person title and the beat silently stops being a conversation — **validator error** |

### 4.3 Apply / rebuttal — NEW, 2 per run

The type where **stored knowledge is the currency**. The one screen that makes this a
business simulation rather than a quiz.

```
┌ left rail ─┬─ centre 888 ────────────────────────┬ right ┐
│            │ Foyle: "Give me something to write  │       │
│  Your file │  in the box."                       │ meters│
│  ▸ what    │ ─────────────────────────────────── │       │
│    you     │ WHAT YOU CAN PUT ON THE TABLE       │       │
│    found   │ ┌─────────────┐ ┌─────────────┐     │       │
│            │ │ ✓ Complaint │ │ ✓ Operations│     │ ledger│
│            │ │   data      │ │   named     │     │       │
│            │ │ EARNED m2   │ │ EARNED m5b  │     │       │
│            │ └─────────────┘ └─────────────┘     │       │
│            │ ┌─────────────┐ ┌─────────────┐     │       │
│            │ │ 🔒 Rival gap│ │ 🔒 Reframed │     │       │
│            │ │ NOT GATHERED│ │ NOT GATHERED│     │       │
│            │ └─────────────┘ └─────────────┘     │       │
│            │   ┏ gate ┓                          │       │
└────────────┴──────────────────────────────────────┴───────┘
```

**The design point, and it needs no new content.** m9a's options are *already* gated on
`evidenced`, `ops_onside`, `reframed` and `knows:rival_gap`. The game already decides what
you may say based on what you found out — and never tells you. Today an unearned option is
simply **absent**, which reads as "fewer choices" rather than as a consequence.

So: **render the locked ones, greyed and named, with the beat where they could have been
earned.** Seeing the argument you could have made is the lesson. One screen change.

| Field | Value |
|---|---|
| Instances | 2 — m9a (reframed, no content change) and the handover (new beat) |
| Content | `option.requires` read as *earnable*, `discovered`, `ledger(state)` |
| Locked card | must state **what it was and where it was available**. A lock with no name is a mystery, not a goal |
| Failure | if every option is available the screen is just a comparison — needs ≥1 locked on most paths to earn its type |

### 4.4 Performance dashboard — NEW, replaces the leaderboard

No backend, so **no social comparison**. The benchmark is the *achievable range*, which we
already compute in `analysis.ts` (`reachableExtremes`) — a genuinely better comparator than
a cohort, because it answers "how well could this have gone?" rather than "who else is here?"

```
┌ stage, full width ──────────────────────────────────────────────┐
│  HOW YOU PLAYED                                                  │
│                                                                  │
│   11        73%          4 of 6        LEVEL 5                   │
│   /17      read the      badges                                  │
│   done     trade right                                           │
│                                                                  │
│  ── the arc of the run ──────────────────────────────────────    │
│   100 ┤                                    ╭── Winability        │
│       │        ╭─────╮              ╭──────╯                     │
│    50 ┤───────╯       ╰──╮    ╭─────╯  ╰──── Deliverability      │
│       │                   ╰────╯       ╰──── Profitability       │
│     0 └────┬────┬────┬────┬────┬────┬────┬───                    │
│           ch1  ch2  ch3  ch4  ch5                                │
│                                                                  │
│  ── against what was reachable ──────────────────────────────    │
│   Winability   ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░  84 of a reachable 100           │
│   Profitability ▓▓▓▓▓░░░░░░░░░░  28 of a reachable 100           │
│                                                                  │
│  ── stars by chapter ──   ★★★ ★★☆ ★★★ ★☆☆ ★★☆                    │
└──────────────────────────────────────────────────────────────────┘
```

| Field | Value |
|---|---|
| Content | `progressSummary`, `levelFor`, `badgeProgress`, `stars`, `state.history`, `reachableExtremes(content)` |
| The arc | a line per dimension across the run, from `history[].dimsAfter`. **This is the artefact** — it shows the shape of the run, which no other screen does |
| Prediction accuracy | `history[].predictionCorrect` — the honest self-measure, and unfarmable |
| Not shown | no aggregate score. A score invites optimising the grader; a meter-greedy policy drove the old one to 100/100/100 without reading a word |
| Numerals | `--text-mega` 96 / `--text-hero` 72, tabular |

### 4.5 Reflection node — NEW, 4 per run

The only paper screen with the **meters removed**. That absence is the teaching: meters mean
stakes, so no meters means nothing is at stake here.

```
┌ left rail ─┬─ centre 888 ───────────────────────┬ right rail ─┐
│  Chapter   │      ┌────────────────────┐        │  (empty —   │
│  beat list │      │  ┌──┐  Riya Kapoor  │        │   NO METERS)│
│            │      │  │pic│ Engagement   │        │             │
│            │      │  └──┘  Director     │        │  Your file  │
│            │      │                     │        │  stays      │
│            │      │ "That one cost you  │        │             │
│            │      │  something. Where   │        │             │
│            │      │  have you seen this │        │             │
│            │      │  happen for real?"  │        │             │
│            │      │                     │        │             │
│            │      │ ▭ a thought         │        │             │
│            │      │ ▭ another           │        │             │
│            │      └────────────────────┘        │             │
└────────────┴─────────────────────────────────────┴─────────────┘
```

| Field | Value |
|---|---|
| Placement | after the chapter's **hardest** beat — recovery belongs after the blow |
| Content | **new** — one colleague prompt + 2 responses per node. Neither response changes state |
| The questions | Thiagi's phases 4 and 5 — *"how does this relate to the real world?"* and *"what if?"* — the two where transfer happens and which vendor products routinely omit |
| Failure | if it ever moves a meter it has become a decision wearing a reflection's clothes. **The absent meters are load-bearing** |

### 4.6 Chapter debrief — NEW, 5 per run

Stage ground, no chrome — a change of world, because the chapter is over. The celebration
lands here and on the map, not inside the beat.

| Field | Value |
|---|---|
| Carries | the chapter's decisions with their tone; **the branch you did not take**; stars awarded; badges earned |
| Path-reveal | Detroit ends every chapter with a flowchart including untaken branches. Ours reveals only at the very end — too late to change how anyone plays |
| Content | `state.history` filtered to the chapter, plus the sibling outcomes not fired |
| Exit | to the **map**, where the chapter fills in gold. Closes the loop in the same place every time |

### 4.7 Cut scene — 8 per run

Specified in full in `GAME-SEQUENCE.md`. The one rule that governs it: **chrome removed** —
no rails, no meters, no action bar. Subtraction is the signal. The action sits on the scene,
and the player moves *through* rather than sitting on it.

Three of the eight are moments done **to** the player — the rival moves, the award lands,
the sponsor resigns. None can be altered, so none may be staged as though it could.

---

## 5. What is authored where

Per `CLAUDE.md`: player-facing prose lives in `story.ts`, interface strings in `UI_LABEL`,
and `src/ui` holds no game rules.

| Screen | New content needed |
|---|---|
| Reflection ×4 | 4 prompts + 8 responses, in a colleague's voice |
| Chapter debrief ×5 | a one-line chapter verdict each; the rest is derived |
| Handover apply | a full beat — opener, 4 replies, outcomes, lesson |
| Cut scenes ×3 | one screen of prose each |
| Everything else | derived from existing content |

---

## 6. The checkable rules

1. `changes state` ⇔ the gate is present. **Testable**, and should be a test.
2. Reflection nodes never render meters.
3. Cut scenes never render rails, meters or the action bar.
4. Every screen fits 739 / 863 — `npm run verify`.
5. No hex literals in components; role-named tokens only.
6. Type scale 12/13/15/18/24/32/56/72/96 and nothing else.
7. Reading is never on a clock. Pressure belongs on the decision.
