# GPL complete game implementation backlog

Status: implemented software and release checks are tracked in IMPLEMENTATION-STATUS.md. This document records the original complete scope; it is not a current completion receipt.
Audience: Astra and the implementation team. Prepared 22 September 2026.

## 1. Authority and deliverable

Build the complete desktop learning game for Accenture employees, from first launch through every authored chapter, alternative ending, save/resume path, and training-package export. This is the authoritative implementation backlog. `GAME-CONTENT-COVERAGE.md` and `GAME-PHOTO-AND-SCREEN-SPEC.md` are its implementation contracts. Older backlogs, genre proposals, screen systems and generated previews are historical exploration. Their status labels and statements of approval do not override this package.

The user requested the complete backlog in this pass. Nothing in this document represents implemented software, purchased imagery, tested learning efficacy or user approval of the earlier mockups. Do not reproduce those previews literally: they used portrait panels, schematic characters, unreadable overlays, incorrect chapter counts and invented outcome previews.

Deliver an engaging, photographic business simulation with distinct places, recurring people, readable decisions and consequences that remember the learner's choices. Game depth comes from uncertain information, commitments, constrained resources and visible consequences. Preserve the authored deterministic learning model.

### Locked product decisions

- Primary experience: landscape desktop, reference 1440×900; verify 1366×768, 1440×1024 and 1920×1080. Layout follows viewport size, not screenshot scaling.
- Real photographs of people for the cast and scene-led moments. Consistent identity and suitable source permissions are required; generated faces do not satisfy the request for real people.
- Every chapter announces its name, capability and current step before the learner enters its activities. The journey map appears at chapter boundaries. It is not forced between every mission.
- Remove the question asking players to guess Winnability/Winability, Profitability or Deliverability movements, all prediction chips, accuracy feedback and prediction scoring. Keep the existing three outcome dimensions where they explain actual consequences. Do not invent replacement scores such as Access +4.
- Preserve learning objectives, authored branches, evidence gates, resource limits, ledger, causal chains, replay and walk-away paths. A redesign of presentation does not authorise flattening them into a two-choice demo.
- No results are forecast before commitment. Pre-decision content may show known facts, authored costs, commitments and uncertainty. The earlier “Sarah advances the board slot” preview is prohibited until the engine resolves it.
- No permanent dashboard furniture across every screen. The shared language is photography, type, colour, navigation conventions, character identity and motion—not a universal three-column template.
- No new account system, multiplayer, leaderboard, coins, streaks or backend required. Preserve static/offline/LMS delivery.
- No timing pressure on reading, mandatory drag gestures or autoplay audio. Optional atmosphere must never obstruct comprehension.

## 2. Whole-game experience

First launch → welcome and role → starting advantage → journey map → chapter arrival → mission brief → inspect/choose → commitment → consequence and explanation → next authored node → chapter debrief → map. Continue through all five chapters unless an authored outcome closes the pursuit. A walk-away is a legitimate terminal route, not an unfinished run. The final map/summary marks unvisited chapters as “not reached on this path”, never falsely completed.

A separate lesson or confirmation screen is not mandatory for every mission. Place lesson interpretation within the result and expand longer explanations on demand. Use a confirmation step only for genuinely multi-part commitments; ordinary choices need one explicit commit. Avoid inflating the run with ceremonial clicks.

Resume restores the current unfinished activity and shows its chapter/step immediately. It must not restart the chapter intro, replay completed choices or bypass an unseen result. Mid-chapter “View journey” is non-mutating; Return restores the same selection and phase. Completion moves to a debrief before any next-chapter entry.

### Pacing targets to validate

Use existing authored duration metadata as the baseline; do not promise a shorter run by hiding content. Target first meaningful choice within three minutes in a first-use test. Offer a clear chapter checkpoint and a resume route for interrupted employees. Optional context is available without becoming a prerequisite to every move. Alternate reading, conversation, comparison, constrained assembly and reflective pauses according to actual mission needs. Do not add random surprise events; use the authored rival, award and resignation beats.

## 3. Work item contract

P0 means foundational/critical path; P1 means required later in the complete release, not optional. Every ticket below must close for the complete-game claim. Tickets specify outputs, dependencies and acceptance. Content/asset tables expand their per-node scope.

For each completed ticket, record affected files, checks actually run, screenshot/evidence links and remaining defects in `docs/IMPLEMENTATION-STATUS.md`. Start that file with all tickets unchecked. Never mark work complete because a component exists or a screenshot was generated. “Blocked” is allowed only with the exact external input named. No backlog task is treated as implemented by this planning pass.

## 4. Foundation and design tickets

### FND-01 — Reconcile baseline and historical instructions [P0]
Dependencies: none. Inspect the dirty worktree; preserve unrelated user edits and record the starting revision/diff. Generate the actual content graph from typed content, compare to the coverage appendix, and record baseline typecheck, tests, build and browser results. Update stale current docs that still require prediction gates, universal rails or mobile-first screens. Preserve pure-engine and no-outcome-preview rules.
Acceptance: one source of design authority; baseline failures are listed rather than attributed to the redesign; no guessed node totals or silent deletion of user work.

### FND-02 — Freeze presentation/state boundary [P0]
Dependencies: FND-01. Define a typed presentation model separate from engine business state: template ID, scene ID, speaker ID, objective, active evidence reference, UI mode and return target. Business availability, effects, branches and required selection counts remain engine derived. Introduce fields only where a content projection cannot express the intent.
Acceptance: no React component computes a consequence; a content-only copy/image change cannot change rules fingerprints; each playable node maps to an explicit template.

### DES-01 — Desktop foundations and component states [P0]
Dependencies: FND-01. Implement the photo/scene/layout contract in the companion specification. Use bundled Inter, readable body text, eight-point spacing, restrained violet emphasis and colour-independent status. Define normal, hover, keyboard focus, pressed, selected, disabled, loading, missing-image and error states for each control. Remove accidental serif fallbacks.
Acceptance: 1440×900 screenshot shows a landscape scene with legible live text; no tiny type squeezed into rotated documents, token exceptions without explanation, or text painted into photography.

### DES-02 — Complete approval set using actual content [P0]
Dependencies: DES-01, ART-01. Produce full-size landscape screens for S01–S16 in the companion; include decision unselected/selected/evidence-open states, a difficult late mission, and a 1366×768 view. Use real photos and actual first/late mission content. At least one before/after pair must show the same cast and setting across a consequence.
Acceptance: review images open individually at readable resolution; final choices preserve original counts and mechanics. User approval must be recorded explicitly before treating visual direction as locked; never infer approval from “build the backlog”. Preparation and engineering-independent work can proceed while that gate remains open.

### ART-01 — Source and verify real cast photography [P0]
Dependencies: FND-01. Inventory `public/art` with provenance status. Source one consistent real adult model per recurring character, ideally with neutral, listening and concerned/reflective expressions. Use organisation-provided approved photos or properly sourced stock; do not scrape employees' profile pictures. Preserve fictional character names, avoid suggesting the depicted models are named Accenture staff.
Acceptance: every visible person is tied to an asset record with source and permitted use; unknown provenance cannot be called approved. If available photos lack expression variants, use the same real identity with framing and dialogue instead of generating a replacement face.

### ART-02 — Environment, props and image delivery [P0]
Dependencies: ART-01, DES-01. Deliver the environment/cast/prop matrix in the companion. Prepare scene crops, portrait thumbnails, focal points and safe text regions; preserve source originals. Match colour grading and light without making distinct locations identical. Optimise local WebP/AVIF as supported, with fallback.
Acceptance: no hotlinked production image, placeholder initials as final cast, broken crop, watermarked stock, giant preload of all chapters or unreadable overlay. A missing asset has an accessible functional fallback, but fails visual release readiness.

### DES-03 — Motion, atmosphere and transition ownership [P1]
Dependencies: DES-01, ENG-01. Use short scene fades, character/reaction changes, dialogue reveals and explicit map completion transitions. Parent route owns navigation; animation completion cannot commit or unlock anything. Optional sound is off initially, with persistent mute.
Acceptance: reduced motion instantly reaches the same semantic state; rapid Continue never skips content; focus goes to the destination heading and no transition traps input. No mandatory video pipeline or additional runtime animation dependency.

## 5. Screen and interaction tickets

### UI-01 — Welcome, role and starting advantage [P0]
Dependencies: DES-01, ART-02, FND-02. Build S01 with an inviting photographic scene, premise, player role, expected chapter structure and Start/Resume distinction. Render actual setup advantages and explain what the chosen one represents. Setup is a meaningful starting state, not a fabricated quiz.
Acceptance: all setup options work; confirming enters the map; no choice lost on accidental overlay open/close. Existing saved run is never overwritten by simply visiting Home.

### UI-02 — Five-chapter journey and completion states [P0]
Dependencies: UI-01, ENG-01, CNT-01. Build S02 using five photo-led chapter destinations with clear sequence, one current destination, completed history and future previews. Setup appears before the chapters, never consumes a chapter slot. Chapter history may be inspected read-only; it cannot mutate or replay a completed step.
Acceptance: all five chapters visible; no arbitrary relabelling as a four-stage route; progress comes from completed nodes; early exit and final completion have different honest map states.

### UI-03 — Chapter arrival and cutscenes [P0]
Dependencies: UI-02, ART-02, CNT-02. Build S03/S04 for all chapter openers and the three authored story turns. Give each its location, narrative time and appropriate person/photograph. Chapter entry names the learning objective and upcoming activities. Event scenes explain the external change without asking for an unimplemented response.
Acceptance: eight interludes are accounted for; users advance at their pace; any reveal-skip finishes the current text only, not the next node. The award respects actual walk-away routing.

### UI-04 — Read and inspect a mission brief [P0]
Dependencies: FND-02, DES-02. Build S05 with location/person on one side and an upright, readable account/evidence surface on the other. Summarise the immediate objective and facts; use expandable detail for longer context. Evidence available to view differs from evidence the learner has earned.
Acceptance: all actual brief fields remain reachable; browsing does not award flags; key facts and unknowns are clearly distinguished; the decision retains its brief without requiring reverse navigation.

### UI-05 — Comparison decisions [P0]
Dependencies: UI-04, ENG-02. Build S06 for m1, m4, m6b, m10b. Use an aligned comparison area and supporting photography so facts can be compared without opening each option serially. At smaller desktop sizes allow a controlled detail region rather than shrinking text.
Acceptance: all real options, paired trade-offs, costs and commitments visible/reachable; selected state explicit; reselecting a single choice follows existing semantics; no “recommended” badge or per-option outcome preview.

### UI-06 — Evidence investigation and constrained allocation [P0]
Dependencies: UI-04, ENG-02. Build S07 variants for m2, m5b and m7. Label the actual required count and budget. Distinguish previewing evidence from selecting what to investigate; distinguish resource assignment from dossier reading. Show chosen items in stable slots. Provide click/keyboard alternatives for any drag affordance.
Acceptance: exact content counts and constraints apply; removing/swapping works; locked choices explain their condition without leaking hidden results; commit enabled only for valid complete selections; no over-allocation by fast clicks.

### UI-07 — Chat decisions [P0]
Dependencies: UI-04, ART-01, ENG-02. Build S08 with consistent real portrait, sender name/role, conversation history, short reply choices and a deliberate Send/Commit action. Selected draft stays distinct from a sent reply. Use conditional advisor lines from content.
Acceptance: each chat node renders the correct speaker and all available authored replies; no decorative fake messages or fabricated dates; committing appends once; revisiting evidence does not send the draft.

### UI-08 — Calls and meetings [P0]
Dependencies: UI-07. Build S09 as a large photographic speaker/meeting stage with readable transcript and response area. Clearly frame static photography as a simulated conversation; do not imply a live remote call or functioning microphone.
Acceptance: correct client speaker/branch, all response counts fit/reflow, transcript accessible, no audio required, no ornamental live-call controls that do nothing.

### UI-09 — Evidence application and handover [P0]
Dependencies: UI-06, UI-08, ENG-03. Build S10 for m9a and m10h: stakeholder challenge, earned evidence/ledger commitments and authored reply actions. Show unavailable evidence as named disabled items with acquisition explanation when permitted by content. Handover must cite the learner's real prior promises.
Acceptance: prior choices change available arguments; prerequisites and combinations remain engine validated; handover cannot become a generic agree/disagree card; no invented document implies earned evidence.

### UI-10 — Commitment acknowledgement [P0]
Dependencies: UI-05–09. Give every decision one dominant commit action, current required-count status and selected approach summary. Review stays within the activity unless a multi-part choice benefits from a focused review state. Default commit semantics unchanged by motion.
Acceptance: double click/key repeat commits once; incomplete choices cannot commit; there are no prediction fields or guesses. The user's chosen cost/promise is acknowledged without forecasting success.

### UI-11 — Consequence and explanation [P0]
Dependencies: UI-10, ENG-03, CNT-03. Build S11 using scene/person reaction plus an upright outcome reading surface. Sequence chosen approach → actual result → reason → changed state → carry-forward. Existing outcome dimensions show only engine values after resolution, quietly and with labels.
Acceptance: strong, mixed and hard variants receive equally legible treatment; none is automatically green/correct; no generic invented reaction contradicts the outcome; result and subsequent explanation survive reload without recommitting.

### UI-12 — Reflection and chapter debrief [P1]
Dependencies: UI-11, CNT-03. Build S12/S13 for the four reflection nodes and five debriefs. Reflections support low-pressure workplace transfer. Debriefs name the capability, cite actual choices and identify an actionable carry-forward. Mark omitted paths without implying all alternatives should have been chosen.
Acceptance: reflection does not alter outcome dimensions or gate on correctness; all debriefs return to a visibly updated map except terminal handoff to the final review; no arbitrary extra quiz replaces prediction removal.

### UI-13 — Ending, run review and replay [P1]
Dependencies: UI-12, ENG-03. Build S14 for all terminal outcomes, including walk-away. Preserve causal chains and optional existing attribution interaction as learning, never as score prediction. Let learners inspect their history and export run code/available summary. Restart clearly creates a new run after deliberate confirmation.
Acceptance: both delivery and walk-away routes reach completion; unvisited work is not reported done; no leaderboards or summed business score; replay does not mutate the finished run.

### UI-14 — Evidence drawer, ledger, glossary, help and settings [P1]
Dependencies: FND-02, UI-04. Build S15/S16 as shared overlays with stable close/return, focus containment, escape, clear labels and active evidence state. Bring forward existing ledger, history and recognition rather than deleting them to simplify screenshots. Glossary definitions come from content, only for terms actually used.
Acceptance: overlay preserves draft choices and scroll; no time penalty; keyboard can reach all controls; images do not contain essential text; utility paths do not count as progression.

## 6. Content, state and platform tickets

### CNT-01 — Exact chapter and mission coverage [P0]
Dependencies: FND-01. Use `GAME-CONTENT-COVERAGE.md` to map every node to template, scene, cast, objective, predecessor, successor, outcome family and test path. Resolve apparent client-selection continuity in m1 before final copy: if options concern approaching Orion rather than picking a new continuing client, say so explicitly.
Acceptance: no placeholder example mission replaces authored content; totals generated from actual graph; all branches remain reachable; new screen routing cannot silently skip a required chapter.

### CNT-02 — Coherent narration and communication pass [P0]
Dependencies: CNT-01. Write chapter intro goals and bridge lines, update UI vocabulary centrally and apply British English. Keep actual roles: Priya Client Growth Lead, Riya Engagement Director, Arjun Solutions Director, Aisha Delivery Lead, Sarah CTO, Marcus Operations Director, Declan Procurement. Define when each becomes known. Separate historical example copy from approved content.
Acceptance: every transition can answer why this person is speaking now and why this activity follows the previous one; no unexplained shifts of client, time, role or mission count; no internal implementation terms in player copy.

### CNT-03 — Branch-specific learning and remembered consequences [P0]
Dependencies: CNT-01, ENG-03. Audit the causal chains for operational evidence, scope, speed promises, discounts and outcome-based liability. Author reaction/visual bindings to actual outcomes, not guesses from selected option IDs. Each chapter concludes with a transfer-worthy principle.
Acceptance: identical choices in different earned contexts can produce different explained outcomes; visual state follows resolved outcome; a learner can trace a late consequence to an earlier commitment.

### CNT-04 — Training/facilitator materials [P1]
Dependencies: CNT-03, UI-13. Update facilitator guide with chapter goals, approximate duration, discussion prompts, walk-away interpretation, run-code use and troubleshooting. Explain score dimensions as trade-offs and clarify that the fictional cast uses model photography. Distinguish completion from demonstrated workplace competence.
Acceptance: a facilitator can run a session using the shipped game and guide without obsolete prediction instructions or invented completion guarantees.

### ENG-01 — Route and presentation lifecycle [P0]
Dependencies: FND-02. Refactor route coordination in App without creating a parallel gameplay engine. Represent map/overlay/introduction state consistently; chapter progress comes from actual engine history. Define close, back, continue, resume, finish and restart events with safe invalid-event behaviour. Current App keeps the journey map only in React state: refreshing after setup/debrief can bypass it. Persist a versioned presentation checkpoint alongside the business save, including active node/phase, map boundary, result-reading stage and dialogue position where necessary. Validate it against the restored engine state; discard only incompatible presentation data, never a valid business run.
Acceptance: interruption at every boundary resumes correctly; reading an old chapter is non-mutating; terminal branches cannot be pushed into the next chapter by a generic Continue handler.

### ENG-02 — Complete prediction retirement [P0]
Dependencies: FND-01. Audit types, engine setters, analysis policies, history, dashboard/ending, verifier, tests and copy. Remove new-run prediction APIs and accuracy analytics, including prediction-dependent recognition/stars. Read legacy fields solely through an explicit migration boundary where needed. Keep only unrelated analysis helpers that have real remaining consumers. Search guards must allow the unrelated content-validation rule prohibiting outcome predictions; a blanket ban on the word would remove a useful safeguard.
Acceptance: a valid selection alone enables commitment; new runs do not collect predictions; legacy fixtures load or offer a truthful recovery path; production controls and learner reports contain no prediction accuracy; tests no longer require the deleted mechanic.

### ENG-03 — Earned evidence, ledger and ending integrity [P0]
Dependencies: FND-02, ENG-02. Preserve gates and validate outcome fallbacks, resource rules, append-only commitment history and optional attribution answers. Add deterministic derived visual bindings to resolved state and content. Do not use photos, CSS classes or screen titles to choose a branch.
Acceptance: exhaustive/content tests retain contextual trade-offs, reachable outcomes and terminal paths; selected evidence and ledger survive save/load; every displayed number has an engine source.

### PLT-01 — Local save, recovery and portable run codes [P0]
Dependencies: ENG-01–03. Preserve versioned envelope, fingerprints, legacy save recovery and run-code validation. Document schema changes. Migrate current schema 4 before validating the new shape; explicitly handle legacy prediction fields and `resolving` phases. Restore pending presentation at sensible boundaries; if portable code only encodes committed choices, state that and resume at the next valid activity without pretending draft recovery. Handle unavailable storage and invalid/stale codes visibly. Fix local/LMS arbitration: prefer the sole valid source; if both valid and identical restore local presentation; if both differ, present chapter/progress/source and let the learner select without overwriting either first. Invalid local data must not suppress a valid LMS record, and invalid LMS code must not be silently treated as an empty run.
Acceptance: copy-only update does not invalidate a run; rule/shape changes produce truthful recovery; no silent reset, repeated commitment or cross-seat overwrite introduced by redesign.

### PLT-02 — LMS/SCORM lifecycle and offline package [P0]
Dependencies: PLT-01, UI-13. Preserve initialise, suspend, resume, complete and finish wiring in App/lms/scorm. Update acknowledged/finished markers only after successful bridge calls, retry failed writes safely, and reset run-local acknowledgement state on a same-tab restart. Package fonts, imagery and asset manifest locally with relative URLs. Preserve current classic-script/file-compatible build or explicitly test any replacement. Retain existing protocol/data-minimisation behaviour; no new score submission inferred from the visual redesign.
Acceptance: standalone, file launch and existing SCORM tests pass; real end and walk-away complete exactly once; changing a draft is not a completion event; refresh on an ending does not duplicate reporting; missing LMS does not block standalone play. Test failed suspend/complete, retry, same-tab second run and pagehide recovery. Current `tools/scorm-package.mjs` creates the manifest but not a distributable ZIP: add archive creation with root `imsmanifest.xml`, all runtime assets, version/checksum and no authoring-only files; unzip and verify actual launch.

### PLT-03 — Desktop layout, zoom and input support [P0]
Dependencies: DES-01, UI-05–09. Design 1366×768 minimum tested desktop, reference 1440×900 and roomy 1920×1080. Use CSS viewport adaptations, not transformed whole-screen scaling. At smaller effective widths/200% zoom, readable linear reflow is acceptable and preferable to unreadable fit. Below the supported gameplay width provide a truthful resume-safe notice if functional reflow is unavailable; mobile redesign is outside the desktop release scope.
Acceptance: no clipped choice/CTA at tested desktop sizes; browser zoom and keyboard work; essential information remains accessible even where the scene reduces or detail scrolls.

### PLT-04 — Accessibility and resilient scenes [P0]
Dependencies: all UI templates. Use landmarks/headings, appropriate selection semantics, visible keyboard focus, labelled controls and non-colour status. Keep essential text upright/live DOM, decorative photos hidden from assistive tech, and meaningful portraits named through adjacent text. Announce result once, not every animated numeric frame. Add image-failure and reduced-motion cases.
Acceptance: complete keyboard path reaches both endings; no hover-only or drag-only information; normal text contrast at least 4.5:1 and meaningful non-text states at least 3:1; transcript available without audio; no flashing scene transitions.

### PLT-05 — Asset loading and performance [P1]
Dependencies: ART-02, PLT-02. Lazy-load future chapter scenes, eagerly load the current scene, prefetch only a likely next scene after essential content. Measure rather than guess file sizes and latency. Initial design budget: current environment ≤350 KB, character cutout ≤200 KB, avatar ≤25 KB, initial visible imagery ≤1.5 MB, total image package ≤20 MB; any exception must be documented with measured benefit/cost. These are new target budgets, not measured current performance.
Acceptance: no layout shifts caused by missing image dimensions; controls available during art loading; current repository per-origin JS/CSS size gates retained or explicitly justified; whole campaign is not fetched at launch; offline package contains every used asset.

## 7. Verification and release tickets

### QA-01 — Content/transition coverage suite [P0]
Dependencies: CNT-01, ENG-01–03. Assert template mapping and coverage for each node, selection count, branch gate and terminal route. Use fixtures for operationally informed/uninformed, heavy/light scope, discounted/protected margin, evidence-present/absent and walk-away branches. Keep existing exhaustive checks; do not replace them with one happy path.
Acceptance: no reachable node missing screen/asset/copy mapping; no outcome leaked before commitment; all necessary debrief/map handoffs observed on actual routes.

### QA-02 — Full desktop visual and interaction verification [P0]
Dependencies: all screen tickets. Update browser verification to test the new layouts without requiring removed rails, stale accessible names or prediction chips. Capture full-size screenshots for every template at reference desktop, the densest decision at 1366×768, and outcome/context variants. Inspect photos, contrast, crop, readability and actual state.
Acceptance: photos contain real people with approved provenance, choices are readable, no geometric stand-ins or stacked phone mockups accepted as desktop release evidence. Screenshot tests and human visual review both pass.

### QA-03 — Recovery, offline and LMS regression [P0]
Dependencies: PLT-01–04. Test reload at setup, briefing, partial multi-select, committed result, reflection, debrief, map and terminal screens; corrupted and legacy save; invalid run code; unavailable storage; image failure; offline file launch; LMS resume/complete.
Acceptance: each test has expected/actual outcome; no committed action repeated; recoverable state not discarded; correct completion in both terminal routes.

### QA-04 — Learner comprehension and engagement test [P1]
Dependencies: DES-02 prototype, then full game. Use at least five representative adult learners for formative review (a proposed test sample, not a claim of statistical proof). Observe unassisted first chapter and a late activity; record first-decision time, repeated backtracking, confusion and reading difficulty. Ask what stage they entered, what choice they made, why the consequence occurred and how it applies at work. Avoid relying solely on “looks nice”.
Acceptance: critical orientation or readability failures are fixed; test notes distinguish learner statements from inference; the full release has evidence beyond developer self-review. If participants are unavailable, mark empirical validation outstanding, never fabricate it.

### REL-01 — Complete release package and handoff [P1]
Dependencies: all tickets. Run appropriate current scripts: typecheck, tests, build, browser verify, filecheck, lmscheck, SCORM packaging and per-origin size measurement. Update README, facilitator materials and current design/sequence documentation. Supply all assets/provenance, tested screenshots, release notes, known limitations and reproducible build instructions.
Acceptance: final artifact starts without development server, all required tickets have evidence, no blocking defects/placeholder imagery remain, and the manifest identifies all five chapters and branch-supported endings. No external deployment is required by the backlog request.

## 8. Implementation order and agent boundaries

1. Baseline/graph: FND-01, CNT-01 and initial asset provenance audit.
2. Contracts/design: FND-02, DES-01/02, ART-01/02, CNT-02, ENG-01/02. Produce reviewable landscape references here.
3. First integrated chapter: UI-01–07, UI-10/11, route/save and accessibility foundations. This is a validation checkpoint, not scope completion.
4. All remaining chapters: UI-08/09/12/13/14, CNT-03, ENG-03. Exercise at least one difficult evidence-dependent late branch immediately.
5. Complete training delivery: PLT-02–05, DES-03, CNT-04; verify actual offline and LMS packaging.
6. Full verification and release evidence: QA-01–04, REL-01. Do not end after a polished opening chapter.

Parallel team ownership: engine/state agent owns `src/engine`, platform agent owns `src/lms.ts`, `src/scorm.ts` and platform tools, content/assets agent owns story/photo manifests, UI lead owns App and shared shells. Assign individual UI files explicitly before parallel edits. Integration lead owns route contracts and resolves overlaps. All agents consume the same content IDs, template IDs and asset IDs; no independent rewrite of shared types or story.

## 9. Completion definition

### Repository ownership map

| Work | Existing implementation anchors | Expected deliverable |
|---|---|---|
| Routes/checkpoints | `src/App.tsx`, `src/engine/save.ts`, `src/engine/runcode.ts` | Tested business/presentation separation and resume arbitration |
| Engine/prediction/gates | `src/engine/engine.ts`, `types.ts`, `progress.ts`, `analysis.ts`, `engagement.ts` and tests | Removed guessing/reward dependency with deterministic rules retained |
| Story/presentation | `src/content/story.ts`; proposed `characters.ts`, `presentation.ts`, `assets.ts` | Typed identity/scene bindings and per-node copy/asset contract |
| Home/map | `src/ui/hub.tsx`, `journey.tsx`, `screens.tsx` | Actual five-chapter journey and truthful terminal states |
| Decisions/evidence | `src/ui/mission.tsx`, `dialogue.tsx`, `apply.tsx`, `facsimile.tsx` | All comparison, chat, call, investigation, build and apply variants |
| Results/review | `src/ui/consequence.tsx`, `debrief.tsx`, `reflection.tsx`, `cutscene.tsx`, `claim.tsx`, `reward.tsx`, `dashboard.tsx` | Correct result/learning/ending surfaces with no prediction reporting |
| Shared layout | `src/ui/shell.tsx`, `icons.tsx`, `src/index.css`, `src/motion.css` | Accessible screen-specific compositions and shared tokens |
| Platform | `src/lms.ts`, `src/scorm.ts`, `vite.config.ts`, associated tests/tools | Reliable resume/completion, offline art and distributable archive |
| Verification | `tools/verify.mjs`, `measure.mjs`, `size.mjs`, `file-url-check.mjs`, `lms-check.mjs`, `scorm-package.mjs` | Updated assertions, measured layouts and release artifact evidence |

### Presentation data contract to implement

Each node binding supplies `nodeId`, `templateId`, `sceneId`, `advisorCharacterId`, safe speaker resolution, objective, evidence references and outcome-to-scene bindings. Each asset supplies local path, dimensions, focal point and alternative-text policy. A presentation checkpoint supplies its schema, engine node/phase identity, boundary mode, dialogue/reveal index where needed and active overlay return target. It may store UI inspection state, never fabricate `discovered` evidence or duplicate gameplay effects. Required bindings fail authoring validation rather than falling back silently to a generic white card.

Source fields that are already correct must be reused instead of copied into divergent content: actual required count, `requires`, `commits`, `say`, `advisorLine`, conditional quotes, outcome detail/changed/effect/next and existing causal rules. Before selecting a concrete schema, audit current types and keep the simplest typed extension that fulfils this contract.

### Release assertion

“Complete” means the learner can start, understand their role, enter named milestones, read and audit facts, exercise every supported mechanic, observe remembered consequences, close every reached chapter, resume after interruption and finish an authored ending. Photos and environments must be real deliverables with consistent cast identity; every screen type must be distinct and readable on desktop. All five authored chapters are implemented even though valid early-exit runs do not visit them all.

Tests, screenshots, chapter coverage, asset provenance and export verification are part of delivery. A speculative visual bible, small first chapter, title screen, or collection of static mockups cannot satisfy this definition.
