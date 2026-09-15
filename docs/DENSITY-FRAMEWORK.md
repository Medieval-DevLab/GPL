# Decision-screen density framework

A measurable rubric for the moment of choice. Every factor has a number, a mechanical
measure, and a failure mode at both ends. `tools/measure.mjs` emits most of it; the rest
needs one `data-` attribute or a ruler on a screenshot.

**Measured baseline, 16 decide screens at 1440×1024** (`node tools/measure.mjs`):
words avg **419** / max 499 · panels avg **12** / max 16 · distinct type sizes **8–11** per
screen (12 across the game) · font weights **4** · fill colours up to **12** · fill
coverage index avg **0.84**. Options per screen: 3–5.

So the feedback is right, and it is not about the option count. Four options is inside
every defensible band in the literature. **419 words, 12 panels and 10 type sizes are
outside all of them.** The diagnosis is region count and undifferentiated context, not choice.

---

## A. The factors

Ranked by effect on *perceived* density. Fix in this order.

### 1 · Distinct information regions — weight 18
A "region" is what a player perceives as one box: a bordered or filled area, or a group
separated by a rule or ≥24px of air. Working memory holds about **4 chunks**, not 7
(Cowan 2001), and region count is what determines how many chunks the screen asks for.
- **Target: 4–6 top-level regions. Hard max 7.** Nested sub-panels don't count if they sit
  inside a parent region and share its surface.
- **Measure:** count elements carrying `data-region`, or in the DOM, filled/bordered
  elements ≥80×40px *with no filled/bordered ancestor* inside `[data-work-area]`.
  `measure.mjs` currently counts nested ones too, which is why it reports 12–16.
- **Too few (<3):** everything reads as one undifferentiated slab; no entry point.
- **Too many (>7):** the "packed" complaint. Each region demands a decision about whether
  to read it, before any game decision is made.

### 2 · Words visible at the decision moment — weight 16
Adults read non-fiction at **238 wpm** (Brysbaert 2019, 190 studies). A decision beat
should be comprehensible in **≤45 seconds** of reading, leaving thinking time inside a
70-minute, 16-beat run. 45 s × 238 wpm ≈ 180 words; allow scanning and round up.
- **Target: 160–220 words total, including chrome and both rails. Hard max 260.**
- **Measure:** `measure.mjs` `totalWords`.
- **Too few (<100):** the situation stops constraining the choice, so the decision becomes
  arbitrary and the outcome unattributable — fatal for this game's teaching mechanism.
- **Too many (>260):** players switch to F-pattern scanning and miss the constraint anyway
  (NN/g). Mayer's coherence principle is the strongest result in the whole multimedia
  literature — removing extraneous material helped in **23 of 23** experiments, median
  effect size **0.86**. Cutting words is the highest-confidence intervention available.

### 3 · Fill coverage / air — weight 12
- **Target: fill coverage 35–55% of the work area; equivalently air ≥ 35%.** On the
  existing `inkRatio` index (which double-counts nested fills, hence values >1) that is
  **≤0.60**. Current average 0.84 means tint stacked on tint.
- **Measure:** sample `document.elementFromPoint` on a 24px grid across the work area; a
  point is air if the element at it has no own text and a transparent or canvas background.
- **Too much air (>65%):** the console reads as an unfinished web page; relationships
  weaken because proximity has nothing to contrast against.
- **Too little (<35%):** no perceptual figure/ground, so grouping collapses and the eye has
  nowhere to rest. This is the mechanical definition of "crammed".

### 4 · Decision-critical vs contextual information — weight 12
- **Target: ≥55% of visible words inside the decision object** (question + option cards).
  Context ≤45%. Put differently: **≤0.8 context words per option word.**
- **Measure:** words inside `[data-decision]` ÷ `totalWords`.
- **Too low (<40%):** the screen is a briefing document with buttons at the bottom — which
  is what "too much info" usually means. The player cannot tell which text is load-bearing.
- **Too high (>80%):** options float free of a situation; correctness stops being contextual
  (breaks G2).

### 5 · Distinct type sizes and weights — weight 10
Three to five levels of emphasis is the practitioner consensus; there is no controlled study
giving an exact number, so this is a defensible default, chosen because it is countable.
- **Target: 4–5 distinct sizes per screen** (e.g. 32 / 24 / 15 / 13 / 11), **≤6 across the
  whole game**, and **3 weights** (400 / 600 / 700). Any size used for <2% of the text
  should be merged into its neighbour.
- **Measure:** `typeSizes.length`, `fontWeights.length`. Currently 8–11 sizes on a screen
  and 12 across the game, with 11 / 11.5 and 13 / 13.5 / 14 / 14.5 as invisible near-duplicates.
- **Too few (≤2):** no hierarchy; the layer-cake scan has no rungs.
- **Too many (>6):** sizes stop encoding rank. 0.5px differences are cost with no signal —
  this is pure extraneous load in Sweller's sense.

### 6 · Reading-order stations — weight 10
A "station" is a deliberate stop the layout forces. Same 4-chunk logic as regions, but
about *sequence* rather than count.
- **Target: exactly 5** (see B). Hard max 6.
- **Measure:** count elements in the work area with font-size ≥1.4× body (≥19px) **or** a
  saturated accent fill >2000px². One per station, no more.
- **Too few (≤3):** everything is simultaneous; the player decides where to start, which is
  the "no system to read the flow" complaint.
- **Too many (>6):** the screen becomes a queue, and late stations get F-pattern-truncated.

### 7 · Distinct hues and filled-colour areas — weight 8
- **Target: ≤5 hues on screen** (ink, accent, plus at most three semantic: good / warn /
  bad), **≤3 hues in areas >5000px²**, and **exactly one saturated accent fill** at the
  primary action. Tints of one hue count once.
- **Measure:** `fillColours` (target ≤5, currently up to 12); bucket hues to 30° and weight
  by area for the large-area check.
- **Too few:** semantic encoding is lost — this repo has already been bitten by monochrome
  icons reading as flat (UI-AUDIT F4).
- **Too many:** every panel claims priority; the squint test returns mush. Note the
  asymmetry: adding a *hue* is cheap, adding a *large filled area* of that hue is expensive.

### 8 · Simultaneous options — weight 6
Choice overload does **not** reliably occur: Scheibehenne et al.'s meta-analysis of 63
conditions (N≈5,000) found a mean effect near **zero**. Chernev et al. (2015, 99
observations) found it appears only under four moderators — time pressure, hard-to-compare
alternatives, preference uncertainty, and no commitment to choosing. A considered,
untimed, row-aligned comparison triggers none of them.
- **Target: 3–5, preferably 3–4. Hard max 6.** Instructional-design practice for branching
  scenarios converges on 3 (good / acceptable / poor, without signalling which).
- **Measure:** count of `button.choice`; plus a content assertion that every option exposes
  the *same* attribute keys, so comparison is row-wise.
- **Too few (2):** binary framings collapse into right/wrong, which G1 forbids. Reigns gets
  away with two because it has ~2,000 of them and no comparison surface at all.
- **Too many (>6):** at six-plus, comparability is the thing that breaks, not motivation —
  so fix alignment before cutting options.

### 9 · Progressive disclosure share — weight 5
Shneiderman's mantra: **overview first, zoom and filter, details on demand.** NN/g's
counter-caution: when all content is relevant, showing it beats making people click.
- **Target: 25–40% of briefing words behind one affordance**, via **at most two disclosure
  controls** on the screen, and **0% of decision-critical content hidden**. Detail-on-demand
  or a two-tab segmented control — not accordions, and never a modal that hides the options
  you are comparing against.
- **Measure:** hidden words ÷ (visible + hidden); assert no `[data-decision]` descendant is
  initially collapsed.
- **Too little (0%, today):** every word competes at all times.
- **Too much (>50%):** you have hidden the decision. The test: if a player can commit
  without the hidden content and get a *surprising* outcome, it was not disclosure, it was
  concealment.

### 10 · Between-beat change — weight 3
Sixteen structurally identical decisions in ~70 minutes. Serious-games work (Lindsey,
Moffat & Shabalina 2020) shows repeated choices measurably degrade later performance, so
per-beat interface cost should be as close to zero as possible. Variety belongs in content.
- **Target: ≥85% region-set overlap between consecutive decide screens** (Jaccard on
  `data-region` names), shared regions moving **<24px**, and words / panels / stations
  within **±20% of the game's median**. Current word range 266–499 fails this; panels 7–16
  fails it badly.
- **Too little change (<70% would be fine; identical is fine):** there is no such thing as
  too consistent here. The failure at this end is *content* sameness, not layout sameness.
- **Too much (<85% overlap):** every beat re-teaches the layout.

### 11 · Interactive targets — gate only, no weight
**Target 4–9, exactly one primary action.** Currently 3–6: healthy, leave it alone.

---

## B. The reading-flow model

Five stations, full-width, stacked, each separated by a 1px rule and 24px of air — a
deliberate **layer cake**, which is the scan pattern you want, because it fixates headings
and dips into body text by choice. F-pattern is what you get when formatting is absent;
it is a symptom, not a shape to design for.

1. **What is true** — eyebrow, H1 (32px), two-line lede, hero bleeding right. One station,
   ≤45 words. No panel border: it is the ground, not a figure.
2. **What is pressing** — exactly one tinted panel, ≤30 words, the client's own voice or the
   concern. This is the constraint the decision must answer. Only tinted region above the
   question.
3. **The question** — H2 (24px), above a full-width rule, with the selection counter as the
   only pill on screen. The rule is the device: uniform connectedness beats a gap.
4. **The options** — 3–4 equal columns on a subgrid so attributes align row-wise (already
   built). Identical internal order in every card. No card is tinted until selected.
5. **The commit** — one saturated accent button, bottom right, permanently in view.

Enforcement devices, in order of strength: **a shared horizontal rule** (uniform
connectedness) > **a single container border** (common region) > **an air step** (24px
between stations, 8px within) > **size step** (32 → 24 → 15 → 13 → 11) > **one accent fill,
once**. Not used: numbered stations, motion, or arrows — sequence should be inferable while
standing still.

The rails are **not stations**. Left rail = persistent orientation, greyscale, no accent
fills, unchanged between beats. Right rail = station 2's detail-on-demand, collapsed by
default past the first two lines. Anything in a rail that changes per beat and is
decision-critical is mis-placed: Wickens' proximity compatibility principle says
information that must be integrated for one judgement belongs close together — so if the
player needs a "consider" line *while* comparing options, it belongs in station 2 or 3.

---

## C. Scoring rubric

Score 100. **Pass ≥ 80.** Any factor scoring 0 is a build failure regardless of total.
Score each: full weight inside target, half weight within 25% of the band edge, 0 beyond.

| # | Factor | Wt | Measure | Pass band | Auto |
|---|---|---|---|---|---|
| 1 | Top-level regions | 18 | `data-region` count | 4–6 | ✅ |
| 2 | Words on screen | 16 | `totalWords` | 160–220 | ✅ |
| 3 | Air | 12 | 24px grid sample | 35–65% | ✅ |
| 4 | Decision-critical share | 12 | `[data-decision]` words ÷ total | ≥55% | ✅ |
| 5 | Type sizes / weights | 10 | `typeSizes`, `fontWeights` | 4–5 / ≤3 | ✅ |
| 6 | Stations | 10 | size ≥19px or accent fill >2000px² | 5 (max 6) | ✅ |
| 7 | Hues / large fills | 8 | `fillColours`; hue buckets by area | ≤5 / ≤3 | ✅ |
| 8 | Options | 6 | `button.choice` count + shared keys | 3–5 | ✅ |
| 9 | Disclosure share | 5 | hidden ÷ total words; 0% critical | 25–40% | ✅ |
| 10 | Between-beat overlap | 3 | Jaccard on region names | ≥0.85 | ✅ |
| 11 | Targets | 0 | interactive count | 4–9, one primary | ✅ |

**Screenshot-and-ruler version** (5 minutes, no tooling): squint until text is unreadable.
Count the boxes you can still see — should be **4–6**. Count the things that still look
like headings — **5**. Count saturated colour patches — **1**. Then unsquint, count
words in the two rails and the work area — **≤220** — and count the distinct text sizes
by eye; if you cannot tell two apart at a glance, they are the same size and one of them
is waste.

---

## D. What the evidence does NOT support

- **"7±2 items per screen."** Miller's limit was about unidimensional stimuli and immediate
  recall, and he publicly disowned the UI reading. Visible options need recognition, not
  recall — NN/g notes link-rich pages outperform sparse ones. Use 4–6 *regions* because of
  chunking (Cowan), not 7 items because of Miller.
- **"Fewer options are always kinder."** The jam study did not generalise; the pooled effect
  is ~0. Cutting 4 options to 2 would damage this game (G1, G4) and buy nothing.
- **"Hick's law says minimise choices."** Hick–Hyman models reaction time for prepared
  responses to unordered stimuli. It does not model a 30-second reasoned trade-off, and
  scanning strategies break its assumptions. Do not cite it to justify two options.
- **"Maximise data-ink; borders are chartjunk."** Tufte's ratio was never empirically
  validated and does not transfer to interfaces: borders are how common region creates
  grouping, and redundant labels/icons are how meaning survives colour-blindness (E6). One
  border that groups four things earns its ink.
- **"It fits one screen, so density is solved."** Fitting is a floor (E7a), not a goal —
  cramming satisfies it. Overview-first-then-details is the standard; a screen that fits by
  shrinking everything to 11px has failed while passing the fit check.
- **"Progressive disclosure means accordions."** NN/g's guidance is the opposite for
  desktop, all-relevant content. Use one segmented control or detail-on-demand; never hide
  what the options must be compared against.
- **"Consistent screens get boring, so vary them."** No evidence supports varying layout
  across repeated beats, and decision-fatigue findings argue against it. Hold layout
  constant; vary situation, stakes and the shape of the trade-off.
- **Unsupported precision to avoid claiming:** there is no research giving an optimal words-
  per-screen, panels-per-view, or type-size count. Factors 2, 3, 5, 6, 9 and 10 are
  *defensible defaults* derived from reading rate, chunk limits and measurability — they are
  calibration targets, not findings. Factors 1, 4, 7 and 8 rest on published results.

---

## E. Sources

- https://www.cambridge.org/core/services/aop-cambridge-core/content/view/44023F1147D4A1D44BDC0AD226838496/S0140525X01003922a.pdf — Cowan 2001, capacity ≈4 chunks; basis for factors 1 and 6.
- https://uxmyths.com/post/931925744/myth-23-choices-should-always-be-limited-to-seven — Miller's own rejection of the 7±2 UI reading, with NN/g's menu position.
- https://www.nngroup.com/videos/magical-number-7-ux/ — NN/g on why recognition-based screens are not bound by recall limits.
- https://scheibehenne.com/ScheibehenneGreifenederTodd2010.pdf — meta-analysis, 63 conditions, mean choice-overload effect ≈0.
- https://www.sciencedirect.com/science/article/abs/pii/S1057740814000916 — Chernev et al. 2015, the four moderators that make more options actually hurt.
- https://business.columbia.edu/faculty/research/when-choice-demotivating-can-one-desire-too-much-good-thing — Iyengar & Lepper 2000, the original 6-vs-24 jam result.
- https://ixdf.org/literature/article/the-hick-hyman-law-an-argument-against-complexity-in-user-interface-design — Hick–Hyman and the scanning-strategy limits on applying it to UI.
- https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/principles-for-reducing-extraneous-processing-in-multimedia-learning-coherence-signaling-redundancy-spatial-contiguity-and-temporal-contiguity-principles/CD5B7AE1279A9AB81F8EEBB53DBEC86E — Mayer: coherence 23/23 tests, median d 0.86; signalling and contiguity.
- https://www.sciencedirect.com/science/article/abs/pii/S0749596X19300786 — Brysbaert 2019, 238 wpm non-fiction; the derivation behind the word budget.
- https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/ — F-pattern as a symptom of unformatted text; the eight devices that break it.
- https://www.nngroup.com/articles/layer-cake-pattern-scanning/ — layer-cake scanning and what produces it; the model behind section B.
- https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/ — the four scan patterns and when commitment reading occurs.
- https://www.nngroup.com/articles/common-region/ — borders create groups and override proximity; the strongest enforcement device.
- https://www.nngroup.com/articles/gestalt-proximity/ — proximity beats colour and shape similarity; the air-step rule.
- https://journals.sagepub.com/doi/10.1518/001872095779049408 — Wickens & Carswell, proximity compatibility principle; why integrated judgements need co-located information.
- https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf — Shneiderman 1996, overview first / zoom and filter / details on demand.
- https://medium.com/@MattDuignan/why-tuftes-wrong-a9bd6a14ff8e — the empirical case against transplanting data-ink maximisation into UI.
- https://www.nngroup.com/videos/squint-test/ — the squint test as a hierarchy check; basis for the manual rubric.
- https://researchonline.gcu.ac.uk/en/publications/could-decision-fatigue-be-a-problem-for-serious-games/ — Lindsey, Moffat & Shabalina 2020: repeated choices degrade later serious-game performance.
- https://christytuckerlearning.com/how-many-options-in-branching-scenario-decisions/ — branching-scenario practice: three meaningful options per decision.
- https://www.gamedeveloper.com/design/game-design-deep-dive-creating-an-adaptive-narrative-in-i-reigns-i- — Reigns: two options, one card, no comparison surface.
- https://dukope.com/devlogs/papers-please/mobile/ — Papers, Please: the desk is deliberately too small; occlusion as the mechanic.
- https://jeremiahgames.com/2019/03/04/perfect-information-the-killer-feature-of-slay-the-spire-and-into-the-breach/ — perfect information with low simultaneous density; 3 card rewards, telegraphed intents.
- https://www.gameuidatabase.com/gameData.php?id=1462 — Citizen Sleeper screens: dice row + clocks, one panel at a time.
- https://forum.paradoxplaza.com/forum/developer-diary/crusader-kings-3-dev-diary-30-event-scripting.1397140/ — CK3 event anatomy: title, description, portrait, 1–4 options in a modal that occludes everything.
- https://www.gamedeveloper.com/design/learning-and-improving-upon-this-war-of-mine-a-ux-ui-analysis — This War of Mine UX teardown; 11bit's two-option dilemma popups.

### Teardown summary (counts at the moment of choice)

| Game | Options | Words | Panels | Hidden until asked |
|---|---|---|---|---|
| Reigns | 2 | 20–40 | 1 card + 4 meters | everything; no detail view exists |
| Papers, Please | 2 (stamp) | 30–80 | desk, occluded by design | rulebook, and any paper under another |
| CK3 / EU4 event | 1–4 | 60–150 | 1 modal over the map | tooltips carry all the maths |
| Slay the Spire reward | 3 | ~40 | 1 overlay | deck, relic details, map beyond next row |
| Into the Breach | 5–8 acts | ~15 | grid + 3 mech bars | damage previews appear only on hover |
| Citizen Sleeper | 1 node at a time | 60–120 | dice row, clocks, one drive panel | all other nodes collapsed |
| Frostpunk popup | 2 | 50–90 | 1 modal, game paused | city state behind the modal |
| Disco Elysium check | 2–5 | 80–200 | dialogue column + 1 check card | odds shown only on the check itself |
| XCOM 2 ability bar | 4–8 | ~20 | soldier card, ability bar, preview | percentages on hover only |

The pattern across all nine: **the decision moment occludes, pauses or collapses the world
rather than presenting it alongside.** Not one of them shows a full briefing and the options
simultaneously. GPL currently does — that is the structural finding.
