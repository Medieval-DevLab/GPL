# Complete game content coverage

Companion to `COMPLETE-GAME-BACKLOG.md`. Audited from actual story data on 22 September 2026. Counts describe current authored data, not future branch test results. Preserve stable IDs unless an explicit save/run-code migration is supplied.

## Inventory and route

37 authored nodes: one setup; 18 missions (15 choice, one investigate, two build); 17 interludes (five chapter opens, five chapter debriefs, four reflections, three story turns); one ending. The choice missions contain 55 approaches; missions contain 111 authored outcomes; 15 causal thread rules exist. Existing mission minute estimates sum to 68 before interludes, so a 20-minute whole-game promise is unsupported.

| Chapter | Required authored route in normal progression |
|---|---|
| Before Chapter 1 | `setup`: Connectors `s-connector`, Builders `s-builder`, Challengers `s-challenger`; then map |
| 1 — Find the right client | `int-1` → `m1` → `m2` → `m3` → `deb-1` → map |
| 2 — Make it an opportunity | `int-2` → `m4` → `turn-rival` → `m5` → `refl-rival` → `m5b` → `deb-2` → map |
| 3 — Build the response | `int-3` → `m6` → `m6b` → `refl-shape` → `m7` → `m7b` → `deb-3` → map |
| 4 — Make the deal work | `int-4` → `m8` → `m9` → `m9a` → `turn-award` → `refl-award` → `m9b` → `deb-4` → map |
| 5 — Deliver the promise | `int-5` → `m10` → `refl-month5` → `m10b` → `m10h` → `turn-sarah` → `m10c` → `deb-5` → `end` |

Each mission includes its brief/decision/result lifecycle. The map is a presentation checkpoint, not currently an authored story node. Persist it separately so a refresh cannot skip it. Four loss outcomes at m9a (`m9a-lost-value`, `m9a-lost-criteria`, `m9a-lost-deliverer`, `m9a-lost-submit`) go directly to `end`. At m9b, `m9b-walk-right` and `m9b-walk-wrong` also go directly to `end`. Do not insert the award/delivery fiction after these outcomes.

## Per-mission production matrix

Every row requires scene/cast bindings, actual copy, all available choices, result variants, checkpoint handling, keyboard coverage and a reference screenshot. Objectives below are editorial intent; reconcile exact displayed wording to story before release. Screen IDs refer to `GAME-PHOTO-AND-SCREEN-SPEC.md`.

| Node/title | Mechanic, required selection | Template and scene | Learning/continuity acceptance |
|---|---|---|---|
| m1 — Three organisations, one team | 1 of 3 | S06 comparison; engagement studio; Priya | Compare Orion Retail, Apex Industrial, Meridian Health with actual costs and context. Preserve `o-northwind` legacy Orion ID. Explain authored convergence back to Orion if a different prospect is initially pursued; don't invent three full client campaigns. |
| m2 — Before you say anything | Investigate exactly 2 of 5 | S07 investigation; account desk; Priya | Show question/category before commitment; reveal only earned findings afterwards. Existing engine selection resolution supplies discovered evidence/flags; merely browsing the drawer must not grant them. |
| m3 — Getting in the room | 1 of 3 | S08 chat; outreach context; resolved advisor/speaker | Use actual reply text and acquired evidence to explain why an opening works. Do not substitute the sample Sarah-versus-Marcus two-option question from rejected previews. |
| m4 — Is this real? | 1 of 3 | S06 comparison; qualification room; Riya | Preserve qualification trade-offs, scoping uncertainty and any delayed follow-up in the outcome. |
| m5 — Someone else moves | 1 of 4 | S09 call; Sarah after rival news | Use `turn-rival` as antecedent. Prior rival knowledge changes the response context; show it without exposing unknown evidence. |
| m5b — Where the team actually goes | Build exactly 2 of 6 | S07 allocation; team planning studio; Riya | Visible two-slot team plan; selected work has opportunity cost. Don't show six fully investigated results before allocation. |
| m6 — What are we actually solving? | 1 of 3 | S09 call; client/operations meeting; Arjun advisor | Conditional speaker resolver governs whether Marcus is known. Learning connects visible customer problem to operational cause. |
| m6b — Is there another way to do this? | 1 of 4 | S06 comparison; solution workshop; Arjun | Distinguish approaches and evidence requirements. Each approach has a real compensating upside/cost. |
| m7 — What goes in the proposal | Build exactly 3 of 6 | S07 assembly; proposal workshop; Arjun | Three-slot proposal; commitments persist to risk, delivery and handover. |
| m7b — The internal review | 1 of 4, one gated | S08 chat; internal review | Preserve earned availability; explain unavailable path through safe requirement wording. |
| m8 — The number is too high | 1 of 4 | S09 call; negotiation room; Riya advisor | Trade pricing/terms against later capacity; actual outcome only after commit. |
| m9 — The review before signature | 1 of 4 | S08 chat; internal commercial review | Scope, speed and budget history determine the risk the team faces. |
| m9a — Their decision, not yours | 1 of 4, three gated | S10 evidence application; procurement review; Declan | Present earned evidence against the scorecard. Four loss outcomes terminate; no award scene on those branches. |
| m9b — Do we take it? | 1 of 3 | S08 chat; internal deal discussion | Walking away sometimes defensible, sometimes costly; both terminate truthfully. |
| m10 — Month five | 1 of 5, one gated | S08 chat; delivery room; Aisha | Five choices must fit through designed layout. Prior scope/speed/margin decisions explain current delivery position. |
| m10b — Two people short | 1 of 3 | S06 comparison; delivery staffing review; Aisha | Show resource shortage and actual context; recovery costs remain visible. |
| m10h — The sentences you wrote | 1 of 5, all gated | S10 handover; Aisha with learner's ledger | Render only valid selectable approaches; named locked states cannot leak protected facts. Read back actual prior commitments, including scope/speed/liability where applicable. |
| m10c — Nobody planned for this | 1 of 3, one gated | S09 call; leadership transition | `turn-sarah` resignation has already occurred; preserve relationship continuity and applicable earned options. |

### Exact investigation and build collections

- m2: `ev-pain`, `ev-sponsor`, `ev-rivals`, `ev-budget`, `ev-history`; choose two. Never display unopened evidence contents in a universal “facts” rail.
- m5b: `c-ops-workshop`, `c-benchmark`, `c-reference`, `c-data-audit`, `c-complaints`, `c-stakeholders`; choose two.
- m7: `c-journey`, `c-platform`, `c-ops`, `c-training`, `c-pilot`, `c-data`; choose three.
- Eleven gated approaches occur across m7b, m9a, m10, m10h and m10c. Preserve actual conditions and first-match outcome ordering.

## Narrative instance requirements

| Nodes | Screen/art requirement | Acceptance |
|---|---|---|
| int-1…int-5 | S03, corresponding chapter place and advisor photo | All five entries name the actual chapter/capability; negotiation is Chapter 4, not an invented mobilisation chapter. |
| turn-rival | S04, client/rival announcement environment | External news, not an extra choice. Leaves an authored memory for m5. No invented competitor logos/claims. |
| turn-award | S04, award notification with real cast reaction | Appears only on reachable winning route. Optional email treatment is presentation of this node, not a new mission. |
| turn-sarah | S04, departure message/changed meeting context | Reuse Sarah's identity; no sensational or disparaging stock portrayal. Do not show this departure before the node. |
| refl-rival, refl-shape, refl-award, refl-month5 | S12, calm photographic scene and transfer prompt | Four distinct authored reflections, no score prediction or forced correctness. |
| deb-1…deb-5 | S13, chapter scene recap and actual evidence | Five debriefs implemented, even where early-ending runs do not reach later ones. |
| end | S14, variant-aware final account record | Works for loss, walk-away and delivery; causal history remains truthful. |

## Required branch fixtures

Generate replay fixtures from actual content IDs, not invented flag injection where a real path exists. Minimum named cases: informed Operations path; uninformed Operations path; known rival gap; missing argument at procurement; discount limiting later recovery; protected budget; heavy scope/fast promise crisis; earned handover alternatives; procurement loss; walk-away vindicated; walk-away costly; delivery completion after resignation. Store actual choices and expected endpoint with each fixture. Engine tests exercise exhaustive state logic; browser tests cover rendered branch families and report their coverage rather than claiming exhaustive UI testing.

## Content production checklist per node

Record: canonical ID; actual title and objective; screen ID; chapter; current narrative time; scene ID; known speaker/advisor ID; option/evidence/component IDs; required count; safe locked wording; text budgets; branch outcome IDs; asset variants; next-node rules; persistence expectation; screenshot and fixture reference. No row can be closed with a generic example screen alone.

## Contradictions retired

The old documents' 10/16/17 decision counts are stale. “Every path reconverges” has terminal exceptions. Illustrations of real named characters are superseded by real-person photography. Prior screenshots' “Access/Momentum” numbers, certain pre-commit outcomes, two-choice simplifications, all-known stakeholder board and portrait desktop panels are not approved mechanics or visual standards.
