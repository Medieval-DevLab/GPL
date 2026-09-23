# GPL UI redesign backlog

> Historical reference, superseded on 22 September 2026 by [Complete game backlog](COMPLETE-GAME-BACKLOG.md), [content coverage](GAME-CONTENT-COVERAGE.md) and [desktop/photo specification](GAME-PHOTO-AND-SCREEN-SPEC.md). Older approval labels, mobile compositions, illustration-only cast, prediction gates and conflicting screen requirements below are not implementation authority.

**Status:** implementation-ready after the preflight gates below

**Audience:** Astra, design implementation, content, QA

**Scope:** simplify the entire player-facing experience while preserving the deterministic
learning engine and the authored engagement. This is the authoritative backlog for the UI
redesign. The older sections in `docs/BACKLOG.md` are historical audit notes and must not
override this document.

Research basis: [game engagement research](GAME-ENGAGEMENT-RESEARCH.md).

Screen architecture and the decision-workbench composition are defined in
[screen system proposal](SCREEN-SYSTEM.md). This document is the delivery backlog; the
screen system must be approved before Astra implements the visual layer.

## Product outcome

GPL should feel like a polished mobile learning game, not an enterprise dashboard with a
story pasted into it. A learner should always know:

1. where they are in the engagement;
2. what kind of screen they are looking at;
3. what they are being asked to do now;
4. why that action matters;
5. what they learned before moving on.

The player-facing loop is:

```text
HOME → MAP → CHAPTER INTRO → BRIEF → DECISION → RESULT → LESSON → MAP
                         ↘ REFLECTION / STORY TURN ↗
```

The map is the spine. Chapters are milestones. Missions are short activities on the path.
Every screen earns its structure; anything that does not help orientation, decision-making,
story, or learning must be removed.

## Preflight gates before Astra starts

The backlog is detailed enough to begin a bounded prototype, but a full build must not start
until these five inputs are explicitly frozen. They are the remaining places where an
implementation agent would otherwise have to make product decisions mid-build.

### GATE-01 — Freeze the first playable slice (required)

Build and review only this vertical slice first:

```text
new run → setup → map → Chapter 1 intro → first brief → first decision → result → lesson → map
```

The slice must use real Chapter 1 copy and real outcome data. Do not begin by refactoring
all five chapters or polishing every legacy screen.

### GATE-02 — Freeze the visual reference direction (required)

Before implementation, capture one approved reference for each mode: Navigate, Watch, Read,
Decide, and Receive. Each reference must specify viewport, spacing scale, type hierarchy,
surface treatment, illustration/artefact treatment, and motion intent. Astra may interpret the
reference, but must not invent five unrelated visual languages.

### GATE-03 — Freeze the content/state contract (required)

For the first slice, define typed data for: chapter goal, current milestone, brief objective,
choice options, selected choice, result headline, changed dimensions, explanation, carry-forward
cue, and next route. The renderer must consume this contract rather than infer screen meaning
from legacy flags or component names.

### GATE-04 — Freeze the acceptance baseline (required)

Approve the first-slice checklist before scaling out: no prediction language, map handoff is
visible, one primary action per screen, focus moves correctly, reduced motion works, and the
learner can explain what changed after committing. Capture reference screenshots at mobile and
desktop widths.

### GATE-05 — Freeze asset scope (required)

Use a deliberately small first asset set: one pursuit-board treatment, one artefact treatment,
one stakeholder reaction treatment, and the existing icon system. No new art pipeline, audio
system, or illustration library is allowed until the first slice proves the screen grammar.

### GATE-06 — Retire the prediction residue (required)

The visible quiz has been removed from the intended flow, but the repository still contains
legacy prediction assumptions in engine comments/state, engagement analytics, browser-verifier
steps, tests, and player-facing stake copy. Astra must classify each occurrence as one of:

- remove from player experience and new-run state;
- retain only as backward-compatible save migration data; or
- remove entirely from analytics and verification.

The gate is closed only when a repository-wide search finds no player-facing prediction
question, no prediction control in the verifier, and no test that expects prediction-gated
commitment. Winability, Profitability, and Deliverability may remain as post-decision outcome
dimensions, but they must not be framed as a pre-commit guessing task.

## Non-negotiable product decisions

### P0. Remove the prediction quiz completely

The game must not ask the player to predict which of Winability, Profitability, or
Deliverability will move. Those labels may remain as outcome dimensions where they are
useful, but there is no pre-commit question, no prediction chips, no prediction verdict,
and no prediction accuracy on the dashboard.

The decision loop is now:

```text
read the situation → choose an approach → review your commitment → commit → see what happened
```

The commitment is the learning moment. Do not replace the deleted quiz with another
score-guessing question.

### P0. The map is a required route, not an optional overlay

The map appears:

- after the initial team setup;
- after every chapter debrief;
- when the learner chooses “View journey” from Home;
- when resuming at a chapter boundary.

Only the highlighted next node is actionable. Completed nodes are history. Locked nodes
show what is ahead, not an unexplained disabled button.

### P0. One screen, one job

Every screen has one dominant verb:

| Type | Verb | Player question | Primary action |
|---|---|---|---|
| Home | orient | Where am I and what is next? | Continue journey |
| Map | choose | Which milestone am I entering? | Enter highlighted step |
| Chapter intro | understand | What is this chapter about? | Begin chapter |
| Brief | prepare | What do I need to understand? | View choices |
| Decision | choose | Which approach will I take? | Commit choice |
| Result | receive | What happened because of that? | Continue |
| Reflection | transfer | Where does this apply in my work? | Respond |
| Story turn | watch | What changed outside my control? | Continue |
| Chapter debrief | consolidate | What did this chapter teach me? | Return to map |
| Ending | review | What pattern did my run create? | Finish / restart |

No screen may present two competing primary actions. Secondary actions must be visually and
semantically subordinate.

### P0. Chrome is a mode signal

Do not use the same rails, card density, headers, and bottom bar everywhere.

- **Navigate:** dark, spacious, map-first, no mission rails.
- **Watch:** full-bleed scene, no dashboard furniture.
- **Read:** calm paper surface, one heading, one supporting region, one advance action.
- **Decide:** focused work surface, options are the visual centre, one commit action.
- **Receive:** result and explanation are the visual centre; no choices disguised as cards.

Colour is secondary. The layout and available action must identify the mode before the copy
is read.

## Target information architecture

### Home

Home is a return point, not a second dashboard. It contains:

- engagement name and one-sentence premise;
- current chapter and next step;
- one prominent “Continue” button;
- compact path preview;
- optional doors to Map and Recognition.

Remove duplicate meters, duplicate progress numbers, and any panel that does not answer
“where am I?” or “what do I do next?”. Recognition must never compete with Continue.

### Map

The map is five milestone columns or stations, read left-to-right. Each chapter station
contains:

- chapter number and plain-language title;
- a one-line learning goal;
- a milestone label;
- a short vertical path of mission nodes;
- completed/current/locked state;
- the current step’s objective and estimated time.

The map must remain legible at a glance. It is not a dense flowchart and not a list of
every internal node property. Hide implementation details such as stage IDs, flags, and
raw dimension names.

### Chapter intro

The intro is a short, cinematic orientation card. It must state:

- “You are entering Chapter N”;
- the chapter title;
- what capability the learner will practise;
- the three-to-four steps ahead;
- one meaningful transition line from the story.

It must not repeat the whole map or the first mission brief. “Begin chapter” is the only
primary action.

### Mission brief

The brief prepares the learner without simulating a decision. It contains:

- a short situation (maximum three readable chunks);
- the objective in plain language;
- the relevant person or artefact;
- at most three open questions or facts to consider;
- one “View choices” action.

Remove decorative side panels, redundant client facts, and any copy that predicts the
correct outcome. The brief should be comfortable to scan on a phone-sized card even when
the full desktop layout has rails.

### Decision

The decision surface is the only screen with dense interaction. It contains:

- the decision question at the top;
- 2–5 choices with short titles and one-line descriptions;
- trade-offs expressed as compact pros/cons or commitment tags;
- a visible selected state;
- one commit action that becomes available once the required selection is complete.

Delete the Winability/Profitability/Deliverability question everywhere. The three outcome
meters may appear after commit as feedback, never as a quiz or pre-choice target.

### Result

The result screen follows a stable teaching order:

1. what happened (headline);
2. what changed (compact delta summary);
3. why it happened (named colleague’s interpretation);
4. what to carry forward (lesson / watch-for);
5. one continue action.

Do not show another option grid, a prediction verdict, or a second decision on this screen.
The learner should be able to explain the consequence before pressing Continue.

### Chapter debrief

The debrief is a milestone landing page, not a report dump. It contains:

- milestone reached;
- the chapter’s learning objective;
- the learner’s actual path through the chapter;
- one or two consequential observations;
- earned recognition, if any;
- one “Return to map” action.

Move celebration here and onto the map. Do not add confetti to mission decisions.

## Visual simplification backlog

### UI-01 — Establish a small visual system (P0)

**Owner:** design/UI

Define one compact token set for:

- stage/background surfaces;
- paper/work surfaces;
- primary action;
- secondary action;
- text hierarchy;
- status (complete/current/locked/warning);
- spacing scale;
- corner radii;
- elevation and borders;
- motion timings.

Acceptance:

- no component invents a one-off colour, radius, shadow, or spacing value;
- repeated regions share the same geometry;
- the visual hierarchy can be understood in grayscale;
- the token names describe roles, not individual screens.

### UI-02 — Remove dashboard furniture from gameplay (P0)

Audit `Console`, `TopBar`, `MissionRail`, `InsightRail`, and `ActionBar`.

Remove or collapse:

- duplicate chapter and mission progress;
- decorative labels that repeat the heading;
- persistent panels that are not needed for the current screen type;
- meters from briefs, reflections, and story turns;
- empty rail regions created by optional content.

Acceptance: a mission screenshot has one focal area, one support area, and one action area.
No region exists solely because the old shell expected it.

### UI-03 — Make the map the dominant navigation surface (P0)

Refine `JourneyMap` so it feels like a mobile level path:

- current node has the strongest emphasis;
- completed nodes show earned state without looking clickable;
- locked nodes preview the learning goal rather than appearing dead;
- chapter columns have consistent height and rhythm;
- map header names the current milestone and next step;
- map has an explicit empty/new-run state.

Acceptance: a first-time learner can name the current chapter and next action within five
seconds, with no facilitator explanation.

### UI-04 — Simplify Home (P0)

Refine `HubScreen` to a single “continue the journey” composition. Retain only:

- engagement identity;
- current milestone;
- next mission objective;
- one Continue button;
- small Map and Recognition links.

Acceptance: Continue is the largest and highest-contrast action. The learner does not have
to choose between three equally weighted panels.

### UI-05 — Simplify mission rails (P0)

Replace the always-on information wall with a responsive mission context strip:

- chapter and step number;
- mission title;
- objective when preparing;
- estimated time only where it helps planning;
- advisor identity only where a person is speaking.

Acceptance: no mission requires reading a narrow 200px rail to understand the task.

### UI-06 — Normalize option components (P0)

Create one option primitive with variants for comparison, conversation, allocation, and
apply/rebuttal. Variants change content arrangement, not selection semantics.

Acceptance:

- selected state is unmistakable without relying on colour;
- a choice has one primary interaction, not a nested “Selected” button plus Commit button;
- all options fit the reference viewport without clipping;
- the component has one accessible name and one focus target.

### UI-07 — Simplify outcome meters (P1)

Keep the three dimensions as post-decision feedback, but make them quiet and explanatory:

- show only dimensions that changed prominently;
- show unchanged dimensions in a compact “held steady” row;
- use labels and glyphs, not colour alone;
- animate once on arrival, never as fake loading;
- do not expose them as a pre-choice quiz.

Acceptance: the result reads as a consequence explanation, not a score screen.

## Screen-by-screen build backlog

### UI-10 — New-run welcome (P1)

Create a short welcome state before setup that explains the premise in three beats:

1. you are leading one client pursuit;
2. each decision changes what the team can carry;
3. the map will show the journey.

Acceptance: first-time learners understand the contract of the game before choosing a team.
Returning learners bypass this state.

### UI-11 — Team setup as “starting advantage” (P1)

Keep the three team choices, but make their communication parallel:

- strength;
- limitation;
- what this makes easier first;
- what the learner must compensate for later.

Do not present setup as a hidden rules screen. After confirmation, transition into the map
with the first chapter highlighted.

### UI-12 — Chapter intro transition (P0)

Rebuild `CutScene` as a reusable chapter-entry template. Include a short entrance motion,
chapter numeral, title, capability statement, and step preview.

Acceptance: every chapter intro tells the player which step they are entering before the
first mission appears. No top bar or mission rail is visible on the cinematic surface.

### UI-13 — Brief → decision transition (P0)

Implement a consistent hand-off:

- brief action becomes a clear “See choices” or “Open decision” affordance;
- the situation remains visually continuous;
- the question and choices enter with a short directional transition;
- focus lands on the choice group;
- no prediction panel appears.

Acceptance: the learner can tell that the task changed from reading to choosing without a
new page feeling like a reset.

### UI-14 — Decision → result transition (P0)

Implement a meaningful result arrival:

- selected choice compresses into a commitment summary;
- the result headline arrives first;
- consequence details and deltas reveal in sequence;
- the action bar changes from Commit to Continue;
- focus moves to the result heading.

Do not use a fake network spinner or a full-screen “resolving” page.

### UI-15 — Result → lesson transition (P0)

Keep the result and lesson on one coherent receive screen, but stage them in order. The
named advisor should connect the lesson to the learner’s exact decision. `watchFor` belongs
under “Carry this forward”, not in a generic tip box.

Acceptance: every branch leaves the learner with a concrete principle and a next-time cue.

### UI-16 — Reflection screen (P1)

Make reflections feel like a breath between missions:

- warmer, quieter surface;
- no meters;
- one transfer question;
- two equally respectable responses;
- immediate acknowledgement, then map/next step.

Acceptance: it never looks like a graded decision and never blocks progress on “correctness”.

### UI-17 — Story-turn transition (P1)

Use full-bleed transitions for moments done to the learner: rival announcement, award,
resignation, and other authored turns. The scene should have one action and no rails.

Acceptance: the player understands that this event was outside their control.

### UI-18 — Chapter debrief redesign (P0)

Reduce the debrief to a milestone landing. Convert path history into a small readable
sequence, not a table of every internal outcome. Show one lesson and one “what changed”.

Acceptance: the learner can explain the chapter’s capability before returning to the map.

### UI-19 — Ending redesign (P1)

Give the ending the same hierarchy as a chapter debrief:

- where the engagement landed;
- the three most important causal threads;
- what the learner would repeat or change;
- recognition and run code only as secondary material.

Move long detail into expandable sections or print/debrief output. No giant wall of prose.

## Motion and transition system

### MOT-01 — Define transition vocabulary (P0)

Use only four motion families:

| Motion | Used for | Duration target |
|---|---|---:|
| Enter | new screen or chapter | 240–420ms |
| Handoff | brief to decision, choice to result | 180–300ms |
| Reveal | lesson, delta, recognition | 120–240ms stagger |
| Settle | map current node / completed node | 300–500ms |

Acceptance: no arbitrary per-component animation durations; reduced-motion mode removes
movement while preserving order and state changes.

### MOT-02 — Transition ownership (P0)

The parent screen owns route transitions. Child components may animate their own content but
must not independently navigate, delay state, or create fake loading. Engine state changes
remain immediate and deterministic; animation is presentation only.

### MOT-03 — Focus and announcement choreography (P0)

For every transition:

- focus the new heading or first meaningful control;
- announce the new mode in a live region where appropriate;
- never leave focus on a removed button;
- preserve keyboard order through the animation;
- make the entire transition safe under reduced motion.

## Communication and content backlog

### COPY-01 — Establish plain-language UI vocabulary (P0)

Prefer verbs and concrete work language:

- “Choose where to spend the team” over “Select a pursuit strategy”;
- “What do you know?” over “Evidence allocation”;
- “Commit this approach” over “Submit response”;
- “What changed?” over “Resolution”.

Create a central UI copy table in `src/ui/shell.tsx` or a dedicated content module. No
player-facing labels should be invented inside leaf components.

### COPY-02 — Name every chapter as a capability (P0)

Each chapter needs:

- a plain-language title;
- a one-line capability statement;
- a milestone label;
- a transfer cue for real work.

Acceptance: the map title and chapter intro use the same language; no chapter has a title,
eyebrow, milestone, and objective that describe four different concepts.

### COPY-03 — Remove score-first language (P0)

Remove “prediction”, “accuracy”, “which meter will move least”, and similar quiz language
from player-facing copy, dashboards, accessibility announcements, verification scripts, and
design documentation. Keep internal legacy fields only if needed for save migration, and
mark them deprecated.

### COPY-04 — Advisor voice pass (P1)

Give each recurring advisor a distinct communication role:

- Priya: qualification and focus;
- Riya: commercial discipline;
- Arjun: delivery reality;
- Aisha: ownership and handover.

Every result lesson should sound like a person noticing the learner’s move, not like a
course author reciting a maxim.

### COPY-05 — Tighten every screen to one message (P0)

For each screen, identify the one sentence the learner must remember. Remove secondary copy
that repeats the same fact in a rail, card, header, and footer. Preserve authored facts in
the most useful location only.

## Responsive and mobile-simulator behaviour

### RESP-01 — Treat mobile as a first-class composition (P0)

Do not simply stack the desktop dashboard. Define mobile compositions for:

- Home;
- Map;
- chapter intro;
- brief;
- decision;
- result;
- reflection;
- debrief.

At narrow widths, the player should see one focal card and one action, with a compact top
progress indicator. Rails become disclosures or inline context, never squeezed columns.

### RESP-02 — Touch targets and gesture restraint (P0)

All actions must have a 44px minimum target. Do not require swipe gestures to advance or
select. Support tap, keyboard, and screen-reader interaction equally.

### RESP-03 — Orientation and safe-area handling (P1)

The game must remain usable in portrait and landscape tablet views. Bottom actions must
remain reachable above browser safe areas. Avoid fixed-height regions that clip the lesson.

### RESP-04 — Device QA matrix (P0)

Verify at minimum:

- 390×844 portrait;
- 768×1024 tablet;
- 1024×768 landscape tablet;
- 1440×900 desktop;
- 1440×1024 reference desktop.

Every screen type must be captured at every supported width. No screenshot may show clipped
primary actions, horizontal overflow, or a hidden heading.

## Accessibility backlog

### A11Y-01 — Mode and heading semantics (P0)

Every screen has one meaningful heading. Map, cinematic, and console surfaces use distinct
landmarks. The mode is available to assistive technology without relying on colour or
animation.

### A11Y-02 — Selection semantics (P0)

Choice groups expose one clear radiogroup/listbox model. Multi-select investigations expose
the required count and selected state. Locked evidence is not focusable and explains where
it could have been earned.

### A11Y-03 — Motion and timing (P0)

Respect `prefers-reduced-motion`. No learning content may disappear before it can be read.
Animations must never be the only indication that a consequence arrived.

### A11Y-04 — Contrast and non-colour status (P0)

Current, completed, locked, selected, and warning states each have shape, text, or icon
support in addition to colour.

## Engine/content compatibility backlog

### ENG-01 — Preserve deterministic progression (P0)

The UI redesign must not move branching, consequence selection, or flag logic into React.
The map derives from content and state. A new mission should still be authored in content
without editing the UI engine.

### ENG-02 — Deprecate prediction state safely (P1)

Keep old save/run-code fields readable for migration if required, but stop writing or
displaying prediction claims in new runs. Add a migration test and a new-run invariant that
no prediction question can become actionable.

### ENG-03 — Make screen mode explicit (P1)

Represent presentation intent in typed content or a derived mode model so components do not
infer mode from incidental combinations of `phase`, `presentation`, and `surface`.

Acceptance: the renderer can answer `watch | read | decide | receive | navigate` for every
screen and tests can assert the correct chrome/action contract.

## Astra implementation map

Use this ownership map to avoid spreading the redesign across unrelated files:

| Area | Primary files | Responsibility |
|---|---|---|
| State transitions | `src/App.tsx`, `src/engine/engine.ts` | Route setup, map boundaries, phases, and focus keys |
| Story and learning copy | `src/content/story.ts` | Chapter goals, mission objectives, lessons, advisor voice |
| Shared chrome | `src/ui/shell.tsx` | Tokens, landmarks, action bar, top-level mode furniture |
| Journey | `src/ui/journey.tsx`, `src/ui/hub.tsx` | Home, map, current node, chapter milestone presentation |
| Mission modes | `src/ui/mission.tsx`, `src/ui/dialogue.tsx`, `src/ui/apply.tsx` | Brief, comparison, conversation, allocation, apply/rebuttal |
| Receive modes | `src/ui/consequence.tsx`, `src/ui/debrief.tsx` | Result, lesson, chapter recap, recognition |
| Watch/reflection | `src/ui/cutscene.tsx`, `src/ui/reflection.tsx` | Full-bleed turns and low-stakes transfer prompts |
| Motion | `src/motion.css` and small component hooks | Enter, handoff, reveal, settle; no new animation dependency |
| Browser QA | `tools/verify.mjs`, `tools/measure.mjs` | Full sequence, screenshots, fit, accessibility, no prediction UI |
| Documentation | `docs/GAME-SEQUENCE.md`, `docs/SCREEN-TAXONOMY.md`, `docs/SCREEN-SPECS.md` | Keep the written contract in sync with the implementation |

### Required transition contract

The implementation should make these transitions explicit and testable:

| From | Event | To | Required presentation |
|---|---|---|---|
| Home | Continue | Map or current chapter intro | current milestone is named |
| Setup | Confirm team | Map | Chapter 1 current node highlighted |
| Map | Enter current node | Chapter intro | chapter capability and steps shown |
| Chapter intro | Begin | Brief | first mission objective visible |
| Brief | View choices | Decision | choice group receives focus |
| Decision | Commit | Result | selected approach is acknowledged |
| Result | Continue | Brief / reflection / story turn / debrief | next destination is unambiguous |
| Reflection | Respond | next brief or map | no score, no correctness state |
| Debrief | Return to map | Map | completed chapter marked, next chapter previewed |
| Map | Choose next | Chapter intro | no silent bypass of milestone |
| Ending | Finish | Summary / Home | clear stop state and optional restart |

### Explicitly do not build

- no XP economy, coins, energy, countdown timers, or leaderboard;
- no generic “correct answer” celebration on a business judgement;
- no separate prediction, confidence, or meter-guessing quiz;
- no permanent three-column dashboard on a phone;
- no full-screen loading/resolving interstitial without real asynchronous work;
- no autoplay audio or motion required to understand a consequence;
- no branching map that lets the learner skip required lessons;
- no new art pipeline or runtime dependency before the screen grammar is validated.

## Verification backlog

### QA-01 — Screen inventory test (P0)

The browser verifier must assert the expected screen sequence for a complete run:

- map at every chapter boundary;
- five chapter intros;
- every mission has brief, decision, result;
- four reflections;
- story turns;
- five debriefs;
- ending;
- no prediction controls anywhere.

### QA-02 — Visual regression suite (P0)

Capture stable reference screenshots for every screen type and viewport. Review screenshots
for hierarchy, clipping, repeated furniture, and transitions—not only DOM correctness.

### QA-03 — Content communication checks (P0)

Add automated checks for:

- every chapter has a capability statement and milestone;
- every mission has one objective and one lesson;
- every decision has a complete selection path;
- every result has headline, change, reason, and carry-forward cue;
- no player-facing prediction language.

### QA-04 — Accessibility walkthrough (P0)

Run keyboard-only and screen-reader-oriented sweeps through a full run. Verify that focus,
announcements, locked nodes, map status, and reduced motion all remain coherent.

### QA-05 — Performance and bundle check (P1)

Transitions must not add a runtime animation dependency. Keep the existing per-origin bundle
budgets and test on a throttled mobile profile. A cinematic must not preload every image in
the run.

## Implementation sequence for Astra

### Phase 1 — Remove noise and lock the grammar (P0)

Implement GATE-01 through GATE-05, UI-01, UI-02, UI-06, FUN-01, FUN-02, FUN-09, P0
prediction removal, COPY-01, COPY-03, MOT-01, MOT-03, A11Y-01, A11Y-02, and QA-01.

Deliverable: the approved first playable slice with visibly distinct
Navigate/Read/Decide/Receive/Watch modes, no prediction UI, and no unexplained shell furniture.

### Phase 2 — Build the journey spine (P0)

Implement UI-03, UI-04, UI-11, UI-12, UI-18, FUN-04, ENG-03, and RESP-04.

Deliverable: a learner can enter, complete, and close each chapter through the map without
being silently routed past a milestone.

### Phase 3 — Rebuild the mission loop (P0)

Implement UI-05, UI-07, UI-13, UI-14, UI-15, FUN-03, FUN-05, COPY-02, COPY-05, and QA-02.

Deliverable: brief → decision → result reads as one coherent learning interaction, with a
single focal action on every screen.

### Phase 4 — Add breathing room and story rhythm (P1)

Implement UI-16, UI-17, UI-19, MOT-02, COPY-04, and RESP-01–03.

Deliverable: the run has deliberate pacing and mobile-friendly compositions, not a desktop
dashboard collapsed into a column.

### Phase 5 — Harden content and delivery (P0/P1)

Implement ENG-01, ENG-02, QA-03, QA-04, QA-05. Update `README.md`, `GAME-SEQUENCE.md`,
`SCREEN-TAXONOMY.md`, and `SCREEN-SPECS.md` so they describe the shipped grammar rather than
the retired prediction gate.

Deliverable: tests, screenshots, accessibility checks, and design documents agree.

## Definition of done

The redesign is not done when the components compile. It is done when a first-time learner
can complete the opening chapter and answer, without help:

- What am I trying to learn?
- Where am I in the client engagement?
- What am I doing on this screen?
- What changed because of my choice?
- What do I carry into the next step?

The visual test is equally strict: remove any panel, label, badge, meter, or animation that
does not help answer one of those questions.
