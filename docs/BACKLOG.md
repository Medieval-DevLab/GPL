# Backlog

What the nine-perspective audit found and what is still outstanding. Sourced from
eighteen reviewer reports (round 1 and round 2, one per perspective). Every item here was
reproduced before being written down; where a claim rests on a reviewer's measurement
rather than an independent one, it says so.

Ordered by **what blocks what**, not by severity. The first section blocks most of the
rest, which is the panel's unanimous conclusion and the reason `src/engine/engagement.ts`
was built first.

---

## 0 · Shipped (for contrast)

`5659a07` prediction key · `2493572` three colour failures · `4dbbf15` tie-break
semantics · `b294bc1` D-034–039 · `5d91608` engagement gate + sweep honesty ·
`15aca16` panel decisions + two lying gates

Also: dead-flag set pinned, engine flag-reads derived from the rule tables, opening
advantage in the ledger, off-scale type removed, token gate made structural, four distinct
portraits, orphaned asset deleted, top-bar Score deleted, `Start over` two-step, selected
state fixed, narrow-screen notice, fit check always measuring.

---

## 1 · The central defect — reading does not pay

**`src/engine/engagement.test.ts` fails on purpose and pins the numbers.** Until the
engagement premium is positive, everything in sections 3–6 improves decoration.

| # | item | evidence |
|---|---|---|
| 1.1 | **DONE** · **The pursuit cannot be lost in any way that teaches.** "You did not win the work" fires on 0.15% of random runs. Build `m9a` "the client decides" between m9 and m9b, `next: "end"`, gated `none: ["evidenced","ops_onside","reframed","knows:rival_gap"]` — flag-only, so the sweep's dedup stays exact. Measured to fire on 18.6% of random runs; target ~20%. `finalVerdict` needs a `lost` branch ahead of `walked_away`. | domain S1 + QA F4 + learning-science S2; `STRATEGY.md:76` already says the game has no "did we win it?" beat |
| 1.2 | **DONE** · **0 of 45 options sit behind a `requires` gate.** Knowledge changes prose and numbers, never what the player may *do*. | verified: `grep -c "requires:"` → 0 |
| 1.3 | **DONE** · **0 conditions read a meter.** The three meters are write-only — a scoreboard beside a questionnaire. Note the ordering constraint: the moment one does, `stateKey` stops being exact. Bucket `win` into deciles in the key; an unpruned walk exhausts 2 GB. | game-systems S1; `validate.ts:188` warns only if this *stops* being true |
| 1.4 | **DONE** · **Three fake choices at m8/m9.** `o-phase` beats `o-discount` on all three dimensions in 90% of 41,724 reachable states, `o-rescope` in 93%, `o-repriceRisk` ▷ `o-rescope-risk` in 92%. `findDominantOptions` returns zero because it compares each option's per-dimension *worst* against a sibling's *best* — a composite profile no single state can produce. **Fix the detector before the content.** | QA F1; game-systems reproduced it exactly and withdrew its own weaker instrument |
| 1.5 | **DONE** · **77% of runs render zero causal threads** — the section `engine.ts` calls "the payoff of the whole design". 5 rules exist; `D-012` claims nine; `slice(0, 3)` is dead code because no run reaches three. Move `THREAD_RULES` to `story.ts` so a writer can fix it. | learning-science S8, QA F6, adoption S1 |

## 2 · The instruments that are still wrong

| # | item | evidence |
|---|---|---|
| 2.1 | **DONE** · **`measure.mjs` counts photography and icons as air.** 204 of 872 sample points land on an image; reported air 0.66, true 0.50. The error is larger than the 0.35–0.65 band it grades. | QA F7 |
| 2.2 | **DONE** · **It scores the median screen**, so out-of-band screens pass while the factor shows full marks (words range to 225 against a 220 cap). | QA F7 |
| 2.3 | **DONE** · **Disclosure share (weight 5) is still unimplemented** — now counted as unearned rather than omitted, but not built. | `DENSITY-FRAMEWORK.md` §C factor 9 |
| 2.4 | **DONE** · **`verify.mjs` plays one path**, so path-dependent overflow is invisible. The ending measured 1,867px of overflow on a reviewer's run and 739-in-739 on the harness path. 15 of 16 missions' alternative branches are never rendered in a browser. | QA; reproduced both ways |
| 2.5 | **DONE** · **The `stations` band was retuned from the documented 5 to 3–4**, which is what lets 3 stations score 10/10. Restore the band or change the document. | ux F2 |
| 2.6 | **PART** · **Nothing measures the bundle.** 121.8 kB gzipped against a documented 94 kB in `CLAUDE.md`. **`tools/size.mjs` measures it and now attributes it** — the flat number sent readers to refactor components, which is the wrong place: React is **69% of the whole budget** before this project runs a line, and the next largest source is the writing. Now **171.44 kB**. **Left: a human call on the budget itself** — re-baseline with the split, swap React for Preact (~60 kB back), or drop the line. Code-splitting is closed by 8.1's `file://` requirement. See D-070. | QA F9 |

## 3 · Accessibility — six AA failures, one Level A

| # | item | evidence |
|---|---|---|
| 3.1 | **DONE** · **No live regions anywhere (4.1.3).** Meters move 58→64 silently; the prediction verdict is never announced. A blind player makes 16 predictions and is told the result of none. Two `aria-live` elements, ~10 lines. **The cheapest high-value item in this file.** | accessibility S1, verified on the rendered DOM |
| 3.2 | **DONE** · **Single-character shortcuts `1`–`9`/`w`/`p`/`d` with no off switch (2.1.4, Level A).** They also only work for a player who has not touched the mouse, since the handler ignores events whose target is a `BUTTON` and the last-clicked button keeps focus. Both reviewers concluded: delete, −40 lines. | accessibility S7 + QA F10 |
| 3.3 | **DONE** · **Focus lands on `<body>` 48 times in one run.** No `<main>` landmark; the `h1` is never the first heading. One `ref` + `tabIndex={-1}` + `aria-labelledby` on the beat container fixes all three. | accessibility S3/S6, ux F8 |
| 3.4 | **DONE** · **The option set has no group semantics** and card accessible names run 170–240 characters, re-spoken on every focus return. `role="radiogroup"`/`radio` for single-choice; `aria-labelledby` + `aria-describedby` so the name is the title. | accessibility S5, ux F9 |
| 3.5 | **DONE** · **The disabled commit button is unfocusable**, so a screen-reader user cannot discover why they cannot proceed; the hint is an unassociated `<span>` last in the DOM. Keep it enabled, `aria-describedby` the hint, announce on activation. | accessibility S4, ux F13 |
| 3.6 | **DONE** · **`<summary>` target is 20px (2.5.8).** Needs 24. | accessibility S10 |
| 3.7 | **A real small-screen design.** Today's notice is honest, not sufficient — it is a precondition for deploying this as required training, per the recorded dissent in `D-041`. **Was marked DONE in error and is corrected here:** `App.tsx` still renders `NarrowScreen` below 1024px, and the 390px screenshots in `docs/screenshots-390/` are from a superseded build — they show "Mission 1 of 16" and the pre-stage-register palette, so they are evidence of a layout that no longer exists rather than of one that does. | accessibility, dissenting from ux |

## 4 · Reading flow — the complaint that started this

| # | item | evidence |
|---|---|---|
| 4.1 | **DONE** · **Beat continuity is 0.50 against a 0.85 target** (now measured, factor 10). The decide screen deletes the objective, the evidence file and the ledger's `detail` lines. Restore inside the existing `<details>` — **≤50 words, all moved, none written**, 0 layout px. This is what the continuity factor is failing on. | ux F3/F4, learning-science S4, accessibility S8 |
| 4.2 | **DONE** · **25 of 40 branch points hide the state that decides them.** 13 flags gate outcomes and appear in no ledger rule, so a player cannot distinguish a reasoning error from an information gap. Blocks 1.1: a caused loss needs a readable cause.  **Closed with twelve ledger rules: 14 invisible gating flags down to 3**, and the three left score 227, 40 and 0 decisive visits against 11,960–51,144 for the ones added — a 53× drop, so the cut line is measured rather than preferred. `engine.test.ts` pins all three with a reason each. | learning-science S5 |
| 4.3 | **DONE** · **`watchFor`: 32 authored, 0 rendered.** 471 words, and the only conditional knowledge in the game. Belongs in the debrief item's feedback, not as a caption. | learning-science S3, narrative N8 |
| 4.4 | **PART** · **The first situation variant appears at mission 10 of 16.** Nine beats read identically regardless of what the player knows. `advisorLine`/`tip` have no variant mechanism at all — 78 utterances, 0 reactive.  **`ConditionalLine[]` built and 10 of 14 advisor lines now react, including all of m1–m5**, so the player meets state-aware prose on the first beat rather than the tenth. Situation variants reach 7 of 18 missions. **Left: m7 and m8 are the only two beats with no reactive surface at all** — no conditional advisor line, no variant, no conditional quote. Down from nine. | narrative N4 |
| 4.5 | **DONE** · **One causal-claim item at the debrief**: three month-five consequences, which earlier decision caused each, confirmed in aggregate before the threads are revealed. Turns the 77%-empty section into the one artefact a cohort can argue over. No interlude items — three reviewers agreed five is where the quiz lives.  **Engine, validator and content built** (`causalClaim`, D-069): one item, drawn from a thread the player actually earned, deterministic so a run still replays from its code, and returning no score of any kind. Eleven of fifteen threads carry authored wrong answers, so the item appears on **60.8% of runs** over 600 seeded runs. Screen wired (D-075): it occupies the chains' own place and collapses to two lines when answered, 224px → 73px, so answering shrinks the band by more than the chains add. The 77% figure is stale — 1.5 took it to **33.5% empty** over 304,432 reachable flag-states. **Built as ONE item, not three, and not “confirmed in aggregate” — a deliberate deviation from this row.** Three consequences needs three threads to have fired, which happens on **5.6% of reachable states**; two or more on 27.4%. So the specified shape is unbuildable on 94% of runs, and batching the confirmation is meaningless for a single item. See D-069. | learning-science C, narrative and adoption concurring |

## 5 · Truthfulness of the domain

These matter because a learner carries them into a real meeting.

| # | item | evidence |
|---|---|---|
| 5.1 | **DONE** · **No change control anywhere.** Zero occurrences of change request, SOW, MSA. At m10 the options are absorb, push, reset, conceal — the real first answer, *price the change*, is absent. A new joiner will give work away. One option card. | domain S2 |
| 5.2 | **DONE** · **Concealment is net-rewarded and nothing names it.** `m10-quiet-covered` is dims +3 net, tone "mixed", and carries **no `lesson`**, so it inherits a generic one that never mentions candour. Same shape for crunch at `m10-push-ok` (+6 net, "paid by the team" never charged). | domain S3 |
| 5.3 | **PART** · **Procurement is weather, not a person.** No evaluation criteria, no weights, no shortlist, no orals. MEDDICC Decision Criteria / Decision Process / Paper Process entirely absent. One named character with a mandate; trade away the CIO, incumbent and CFO. | domain S4 |
| 5.4 | **DONE** · **The risk review finds only feasibility risk.** Zero occurrences of liability, indemnity, cap, service credit, warranty or IP. m9b offers to reopen "the two clauses you are least comfortable with" and never names either. | domain S6 |
| 5.5 | **PART** · **No value case is ever constructed.** The price defence is always qualitative. The game holds the complaint volumes and never turns them into money, teaching that differentiation is a story rather than a sum. | domain S7 |
| 5.6 | **DONE** · **A Chapter 0 posture defends a 30% premium at m11.** `m8-hold-strong` fires on `knows:rivals`, which `s-challenger` grants on the first screen. Tighten to `evidenced` or `knows:rival_gap`. | domain S8 |
| 5.7 | **DONE** · **The handover is narrated, not played.** Aisha's "my team inherits every sentence — which ones did you mean?" is the best line in the game and the player never answers it.  **Built as `m10h`, staged on the new apply screen** (D-068): the options are the promises in your own proposal, and the ones you never funded render locked and named where they could have been earned. 85% of runs arrive with at least one locked. | domain S10 |
| 5.8 | Smaller: Operations owns the systems (a CIO would); pre-contact access to internal complaint data reads as information you should not have; the client's outcome is never shown. | domain S11/S12 |

## 6 · Voice

| # | item | evidence |
|---|---|---|
| 6.1 | **DONE** · **32 of 32 `lesson.principle` lines are timeless maxims and 0 refer to anything that happened.** 36 of 64 lesson lines say *you*; **0 say *we***, because they were never written for a person to say. A colleague reciting a definition in quotation marks under a portrait is the lecture with a face on it. Strip them from the consequence screen; the principle goes into the player's hands via 4.5. | narrative N1, conceded by learning-science on placement |
| 6.2 | **DONE** · **One voice, four names.** 12 of 25 advisor utterances are role-locked; 9 share one template (numbered past experience + rueful reversal). Nobody interrupts, jokes, or is frightened. | narrative N2 |
| 6.3 | **DONE** · **Marcus Reed: 8 mentions, 0 lines.** The game turns on his consent and the player never looks him in the eye. | narrative N3 |
| 6.4 | **DONE** · **Sarah Lim is never under pressure** and never asks a question the player cannot answer well. A game about the pressure that corrupts judgement never dramatises it. | narrative N6 |
| 6.5 | **DONE** · **`story.ts:2656`** — a delivery lead says "depends on what you did in chapter three". | verified |
| 6.6 | **DONE** · **m5b is a dramatic dead spot**: spread 2, no negative outcome exists, and it closes chapter 2. | narrative N5 |
| 6.7 | **DONE** · 11 of 16 eyebrows are methodology headings ("Opportunity assessment", "Prioritisation"). | narrative N8 |
| 6.8 | **DONE** · Sarah Lim has no portrait — no suitable image found, recorded rather than fudged. | this session |

## 7 · Craft

| # | item | evidence |
|---|---|---|
| 7.1 | **DONE** · **All 22 option-card crops are upscaled ×1.43 and lose 45% of their detail energy.** Replace with 274×132 inline-SVG document facsimiles (complaint chart, RFP header, org fragment) — which double as the persistent fact strip 4.1 needs. Net −130 kB WebP / +20 kB SVG, which also retires 2.6. | visual S3, unanimous |
| 7.2 | **DONE** · **16 verified landscape images are staged and unused** (`scratchpad/img-new`, 2× the render box). One full-bleed hero per brief, assigned per beat — `hero-boardroom` currently appears on three of the first four screens, and the sponsor-resignation beat is illustrated with a till. | this session + visual S3 |
| 7.3 | **DONE** · **Committing a decision fires a skeleton shimmer** — 1150ms of fake latency in a deterministic game with no network. Animate the meter deltas in place instead. | visual S6 |
| 7.4 | **DONE** · **The ending is the worst screen in the game**: 598 words, 0.28 air, 10 fills, 1 region, and the concentric ring draws two equal values 31% apart in arc length. Lean on screen, dense in a print stylesheet. | visual S9, adoption S6 |
| 7.5 | **DONE** · Icons: no optical sizing (`strokeWidth` 1.7 at every size = 3.1× apparent weight range); `layers` carries four meanings; `check` used as an identity badge, which reads as the interface endorsing an answer. | visual S10 |
| 7.6 | **DONE** · Two identical black pills per decide screen — the selected card's "Selected →" and "Commit to this →" are the same object. | visual S11 |
| 7.7 | **DONE** · Spine inconsistency: the left content edge moves 281→285px between brief and decide, 32 times a run. Orphaned closing quote marks on every consequence (three sibling text nodes). `brand-tint` is the wrong temperature (h 300° against warm paper). | visual S7 |

## 8 · Product surface

| # | item | evidence |
|---|---|---|
| 8.1 | **DONE** · **`dist` does not run from `file://`** (module CORS → blank page) and fetches Inter from `fonts.googleapis.com` at runtime, so in a locked-down LMS the measured type system is not what a cohort sees. Self-host the font and inline the module **before** anyone writes a manifest. | QA F8, adoption's own correction |
| 8.2 | **DONE** · **Run codes** — 8 base32 characters encode a whole playthrough (36.2 bits), only possible because the game is deterministic. Unlocks peer comparison, facilitator pre-reading, LMS resume, exact bug repro. | adoption S3 |
| 8.3 | **DONE** · **Save invalidation is silent.** Any content patch voids every in-progress save (`gpl.save.v3`); `localStorage` is per-browser, so runs collide on shared machines. | adoption S2 |
| 8.4 | **DONE** · **SCORM 1.2 package, completion signal, printable debrief, facilitator guide** — all deliberately deferred by adoption's own round 2: "packaging a game a sceptic can speed-run burns the one pilot you get." Blocked on section 1.  **Package and completion signal built** (`src/scorm.ts`, `tools/scorm-package.mjs`, `npm run scorm`): reports `lesson_status` and **never a score**, asserted by a test rather than trusted to a comment, because an LMS bridge is exactly where the deleted grader comes back invisibly. `suspend_data` carries the 13–14 char run code, not the save. Printable debrief exists. **The bridge was also unwired when this was first marked done** — every unit correct, nothing in `src/` importing any of it, so an LMS would have reported every learner *not attempted* for ever; `src/lms.ts` connects it and `src/lms.test.ts` asserts the connection. Facilitator guide written (`docs/FACILITATOR-GUIDE.md`) — written for whoever runs the session rather than for us, so it leads with the three things the game refuses to do, because a group tests all three in the first ten minutes. | adoption |
| 8.5 | **DONE** · `scoreOf` lives in `src/ui/shell.tsx`. A score is a game rule; `CLAUDE.md` puts rules in the engine. | this session |
| 8.6 | **DONE** · `Enter` on the title screen means "start again", and advances interludes and consequences but not briefs. | QA F10, adoption S2 |

## 9 · Open validator doors

Not live breaches — today's content is disciplined in these fields — but unchecked:
`outcome.next` is never validated against the node set (a typo surfaces as a raw exception
mid-sweep); `prompt`, `advisorLine`, `advisor.steer`, `saidQuote`, `concerns`,
`client.blurb` and `assessment.note` are pre-decision prose and none is leak-checked;
an option with neither pros nor cons passes; identical `lesson` text on all 16 missions
passes. `advisor.steer` is declared in `types.ts` and used by zero missions. *(QA F11)*

---

## Sequencing

1. **1.4 then 1.1** — fix the dominance detector first, because `o-phase` structurally dominating its siblings is part of why winability ratchets, and a loss gate tuned against a broken beat is tuned against noise.
2. **4.2 then 1.1** — a caused loss needs an inspectable cause.
3. **1.3 needs the decile bucketing** in `stateKey` or the sweep silently stops being exhaustive.
4. **3.1, 3.2, 3.3** are cheap, independent of everything above, and one is Level A. No reason to wait.
5. **7.1** pays for itself twice: it is the fact strip 4.1 needs and it retires the bundle overrun.
6. Section 8 waits on section 1, by adoption's own argument.

---

## Status, as of the last commit

**46 of 52 shipped. 4 open, 2 partial.** Counted rather than estimated, by grepping the
repo for each item.

| section | shipped | open |
|---|---|---|
| 1 · reading does not pay | 4 of 5 | **1.3** — still no condition reads a meter, so the meters remain write-only for branching |
| 2 · the instruments | 5 of 6 | **2.5** — the `stations` band is still 3–4 against a documented 5 |
| 3 · accessibility | 6 of 7 | **3.7** — no small-screen design; desktop-only is declared, not solved |
| 4 · reading flow | **0 of 5** | all of it. 4.1 continuity still measures 0.50 against 0.85 |
| 5 · domain truth | 0 of 8, 2 partial | change control, concealment, liability, the m8 gate, the handover |
| 6 · voice | **0 of 8** | all of it, including a one-line fourth-wall break |
| 7 · craft | 3 of 7 | the ending screen still overflows by 2,700px |
| 8 · product surface | 4 of 6 | SCORM deferred by design; `scoreOf` still lives in the UI |
| 9 · validator doors | all | — |

**And the gate that started this still fails.** `engagement.test.ts` is red on purpose:
14 of 18 non-reader runs still reach the top verdict, and the best non-reader still scores
100. The award beat made the distribution wider at both ends rather than closing it —
3 of 18 now lose outright, but the survivors collect its winning deltas. Closing it needs
the outcome economy rebalanced, which is 88 authored deltas and the largest single piece
of content work left.

**Two claims in this file were wrong and are corrected above:** 7.4's "0.28 air" was an
instrument artefact (it measures 0.80 — out of band at the opposite end), and 7.1 does not
retire the bundle overrun, because photographs are media and facsimiles are code.
