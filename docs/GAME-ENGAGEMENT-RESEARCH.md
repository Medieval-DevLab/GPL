# Game engagement research for GPL

> Historical reference, superseded on 22 September 2026 by [Complete game backlog](COMPLETE-GAME-BACKLOG.md), [content coverage](GAME-CONTENT-COVERAGE.md) and [desktop/photo specification](GAME-PHOTO-AND-SCREEN-SPEC.md). Older approval labels, mobile compositions, illustration-only cast, prediction gates and conflicting screen requirements below are not implementation authority.

**Purpose:** understand why polished mobile games feel playful and memorable while GPL
currently feels like boxes and text, then convert the findings into buildable design work.

This is not a request to copy another game's art or monetisation. It is a study of the
interaction patterns that make a small number of controls feel deep, legible, and worth
repeating.

## Executive finding

GPL is currently a document with game rules. The benchmark games are worlds with readable
rules.

```text
GPL today:       read panel → click option → read panel → click next

Engaging target: observe world → make one meaningful move → watch world react
                 → understand what changed → choose the next move
```

The redesign must invest in a visible, reactive engagement world—not add more panels,
meters, badges, or explanatory paragraphs.

## Benchmarks and transferable lessons

### Duolingo — progress becomes a place

Duolingo describes its redesigned home as a linear path of lessons rather than disconnected
story icons. Its learning-method documentation also describes immediate feedback, visible
progress, short activities, and larger reinforcement after a session.

Sources: [path redesign](https://blog.duolingo.com/new-home-screen-design/),
[Duolingo method whitepaper](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf).

Take for GPL: a path should show what capability is next; activities should be short and
varied; completion should create a satisfying, understandable landing.

Do not copy streak anxiety, hearts, leagues, or XP as a substitute for understanding.

### Reigns — one gesture, delayed consequences

Reigns presents a simple decision action whose effects are felt across several factions and
whose consequences can return later. Sources: [official Reigns site](https://www.reignsgames.com/),
[Devolver game page](https://www.devolverdigital.com/games/reigns).

Take for GPL: each moment should have one clear action; commitment should feel final; later
people and events should remember what the player did.

Do not copy random punishment or opaque meters as the only feedback. GPL must preserve
deterministic attribution: a learner can trace a later problem to an earlier choice.

### Mini Metro — minimalist world, deep system

Mini Metro uses a clean map, a small visual vocabulary, simple controls, rising pressure,
and meaningful upgrades. New stations change the same interface without requiring a new
control scheme. Sources: [official site](https://minimetro.io/),
[design discussion](https://www.gamedeveloper.com/design/video-behind-the-minimalistic-visual-design-of-i-mini-metro-i-).

Take for GPL: one coherent visual metaphor; icons and spatial relationships that carry
meaning before prose; stable controls with increasing strategic depth; visible bottlenecks
instead of an abstract dashboard.

Do not build a cosmetic map that is only a level selector.

### 80 Days — the map is the narrative engine

Inkle describes 80 Days as interactive fiction combined with a globe-based board game: the
player plans routes, manages resources, meets people, and makes remembered choices. Its
postmortem describes a board-game-like structure whose narrative adapts to circumstances.
Sources: [80 Days](https://www.inklestudios.com/80days/),
[GDC postmortem](https://www.gdcvault.com/play/1021666/80-DAYS-Post-mortem-Letting).

Take for GPL: make the map a living representation of the pursuit; let route position,
evidence, and stakeholder state change the story; make the learner feel they are travelling
through an engagement rather than paging through modules.

### Monument Valley — visual metaphor teaches

GameDeveloper’s account of Monument Valley 2 describes using colour, level design, and
changing mechanics to communicate character development rather than explaining everything
in text. Source: [Monument Valley 2 design article](https://www.gamedeveloper.com/design/telling-an-emotional-tale-through-mechanics-in-i-monument-valley-2-i-).

Take for GPL: let chapter changes alter the board; let documents become complete, damaged,
or constrained; reserve text for nuance and reflection, not basic orientation.

### Learning simulations — feedback must serve learning

The U.S. Government Printing Office review of simulation and gaming describes the value of
repeated anticipation-feedback cycles and feedback based on empirical data. CRESST argues
that instructional mechanisms and game mechanisms must be designed together.

Sources: [simulation and gaming report](https://www.govinfo.gov/content/pkg/GOVPUB-C13-4cd9ae2da63b648f6896904d7dfcb1e9/pdf/GOVPUB-C13-4cd9ae2da63b648f6896904d7dfcb1e9.pdf),
[CRESST alignment report](https://eric.ed.gov/?id=ED520432).

Take for GPL: every decision needs a feedback moment; feedback should be evidence from the
simulated engagement, not a hidden grade; reflection should follow a meaningful consequence
while it is fresh.

## Why the benchmark games engage

### A tiny action vocabulary

Players understand the basic action in seconds: swipe, draw, tap a path node, choose a route,
or select a response. Complexity comes from the situation and consequences, not from
learning the interface.

GPL’s equivalent verbs are: inspect an artefact, choose an approach, allocate attention,
assemble a proposal, answer a person, and stand behind a commitment.

### A world that reacts in front of the player

Engaging games render state as movement, sound, layout, changed routes, character reaction,
or newly available possibilities. GPL applies state in the engine but mostly renders it as
new paragraphs and meter numbers.

The target is a pursuit board where the relationship warms or stalls, evidence pins and
documents accumulate, capacity becomes visible, promises attach to a proposal, and later
scenes reference earlier commitments.

### Anticipation → action → consequence → interpretation

The old prediction question was artificial anticipation: it asked learners to guess a meter.
GPL should make anticipation human and operational instead:

- Sarah’s board has seen the rival’s demo. What will you defend?
- Operations has not approved the timeline. What will you put in writing?
- Aisha inherits this sentence. Which promise can the team own?

The learner anticipates a stakeholder or delivery response, commits, sees it happen, and
receives an interpretation they can reuse.

### Spatial and personal progress

The map shows the engagement’s position. The proposal and evidence file show the learner’s
history. The cast remembers what was promised. The milestone names a capability earned.

### Scheduled variation

Each chapter should teach one interaction, introduce one wrinkle, and end in synthesis:

```text
chapter entry → easy comparison → human conversation → evidence/assembly
→ unexpected event → reflection → milestone landing
```

### Delight as feedback, not noise

Use small purposeful changes: a pin lands on the map, a document gains a stamp, a character
changes stance, a route connects, or a milestone unlocks. Avoid confetti that competes with
the lesson.

## GPL’s engagement gap

| Current symptom | Underlying problem | Response |
|---|---|---|
| Boxes and text everywhere | No visual world owns state | Build a living pursuit board and artefact system |
| Similar furniture on every mission | Screen type is not legible | Distinct Watch/Read/Decide/Receive/Navigate compositions |
| Map feels optional | Progress is a route behind the UI | Make it the chapter hand-off and current location |
| Meters dominate attention | Abstract feedback arrives before understanding | Show outcomes after commitment, in context |
| Choices feel like forms | Choosing has no physical identity | Use conversation, evidence, proposal, and handover modes |
| Consequences are paragraphs | State is calculated but not staged | Show world/artefact reaction before explanation |
| Learning feels like being told | Lessons are detached from action | Let the advisor interpret the exact commitment |
| Run feels flat | No short-term goal or landing | Add micro-goals, turns, and chapter milestones |

## Research-derived design pillars

### PILLAR A — One living board

The pursuit board is Home, Map, and memory system. It must not be a decorative background
behind cards.

### PILLAR B — Tactile business artefacts

Use a small set of meaningful objects: client dossier, evidence pins, proposal pages,
procurement brief, risk note, and delivery handover. Interacting with one must reveal,
compare, attach, or commit something; never add an artefact that is only a picture.

### PILLAR C — People are the feedback system

Characters should react specifically to the player’s move. An advisor is a stakeholder with
a point of view, not a tip container.

### PILLAR D — Simple controls, deep consequences

Each screen has one interaction grammar. Depth comes from information, trade-offs, timing,
and remembered commitments—not from managing a dense UI and dense business problem at once.

### PILLAR E — Learning is the reward

The learner should feel smarter after a result because they can name the causal mechanism.
Recognition and visual changes reinforce that realisation; they never substitute for it.

## Research-derived backlog additions

These extend [the UI redesign backlog](UI-REDESIGN-BACKLOG.md) after the P0 screen grammar
has a stable prototype.

### FUN-01 — Prototype the pursuit board (P0)

Create a vertical slice for Chapter 1 with a living map showing client, team, evidence, and
next action. Test it with no mission cards visible first.

**Done when:** a new learner can point to the client, current milestone, open question, and
next action without opening a panel.

### FUN-02 — Turn the opening into a tactile comparison (P0)

Replace the opening client card wall with three dossier tiles on the board. Selecting one
moves the team focus marker and exposes its trade-off. Commit pins the chosen client to the
route.

**Done when:** the first meaningful action feels like sending a team somewhere, not choosing
a radio button.

### FUN-03 — Build visual artefact progression (P1)

Map authored flags to visual states for the evidence file, proposal, and handover. Two runs
should produce visibly different histories without inventing unsupported information.

### FUN-04 — Stage stakeholder reactions (P0)

For every consequence, choose one visible reaction: client reply, document stamp, route
change, team member joining/withdrawing, or new constraint. The reaction arrives before the
explanation text.

**Done when:** a screenshot with explanatory copy hidden still communicates what changed.

### FUN-05 — Add chapter micro-goals (P1)

Give every chapter a three-part goal, such as “find a problem worth solving”, “make the work
credible”, or “make the promise deliverable”. Mission progress advances that goal, not just
a count.

### FUN-06 — Add one authored surprise per chapter (P1)

Introduce one event that changes context without invalidating the previous decision: a rival,
stakeholder absence, budget constraint, delivery capacity problem, or sponsor change. The
player responds using what they built.

**Done when:** the turn is a memorable world event, not random punishment or a UI gimmick.

### FUN-07 — Build a reveal ledger (P1)

Create a visual “what we know now” ledger for evidence, commitments, and unresolved
assumptions. Entries should land on the board when earned and explain late consequences.

### FUN-08 — Animate only meaningful map change (P1)

On returning to the map, animate the node and artefacts that changed, settle the milestone,
then reveal the next chapter preview. No generic confetti burst.

### FUN-09 — Prototype the first five minutes (P0)

Build only welcome, setup, Chapter 1 map, chapter intro, first dossier comparison, and first
result. Test time to first action, goal comprehension, consequence comprehension, voluntary
map opening, and “what do I do next?” questions.

**Gate:** do not rebuild all missions until this slice is engaging without facilitator
explanation.

## Practical “better than boxes” test

Hide all prose except labels in the first mission screenshot. The experience must still
communicate current place, object under consideration, available action, selected state, and
post-commit consequence state. If it cannot, it is still a document with decoration.
