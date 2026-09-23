# GPL screen system proposal

> Historical reference, superseded on 22 September 2026 by [Complete game backlog](COMPLETE-GAME-BACKLOG.md), [content coverage](GAME-CONTENT-COVERAGE.md) and [desktop/photo specification](GAME-PHOTO-AND-SCREEN-SPEC.md). Older approval labels, mobile compositions, illustration-only cast, prediction gates and conflicting screen requirements below are not implementation authority.

**Status:** design direction for approval; no Astra implementation yet

This document replaces the idea that every screen should be a white card with a header and
button. GPL needs several screen types, each with a different composition, while still
belonging to one world: an adult client-engagement simulation viewed through a living
engagement workspace.

Visual approval board: [screen-system-preview.png](../screen-system-preview.png). Editable
source: [screen-system-preview.svg](../screen-system-preview.svg).

## 1. The shared design language

Every screen is a **workspace state**, not a page template.

The persistent language is:

- a deep ink / slate environment rather than a white application canvas;
- warm paper, acetate, glass, and document surfaces layered into that environment;
- restrained indigo/violet for current focus;
- teal for earned progress and positive movement;
- amber for attention and learning;
- coral for risk and friction;
- editorial typography with short, highly scannable blocks;
- real business objects as visual anchors: brief, message, note, plan, stakeholder, decision;
- depth created by layering, light, texture, and spatial relationships—not by decorative cards;
- one stable orientation strip, with the rest of the composition changing by screen type.

The app should feel like moving around an engagement room: sometimes looking at the route,
sometimes opening a dossier, sometimes watching a message arrive, and sometimes making a
decision at the workbench.

## 2. Screen categories

### A. Orientation screens

These answer “where am I?” and “what happens next?”

1. **Run welcome** — establishes the premise and the player’s role.
2. **Engagement home** — current account, current milestone, next action, carry-forward state.
3. **Journey map** — the five milestone route; current node is the only actionable node.
4. **Chapter entry** — names the capability being entered and previews the chapter rhythm.

Composition: spacious, environmental, map/route-led, low information density. The route and
current state are the visual hero.

### B. Narrative and communication screens

These answer “what changed in the world?”

5. **Cinematic cutscene** — a full-bleed moment done to the player: rival news, internal
   change, award, resignation, or a major client turn.
6. **Message inbox** — an incoming email, note, or alert that introduces new evidence.
7. **Chat / conversation** — a stakeholder exchange with turn-by-turn reveals.
8. **Call / meeting interface** — a live conversation where the player chooses a response or
   listens for a signal.
9. **Stakeholder reaction** — a focused portrait/quote/state-change screen after a decision.

Composition: image, portrait, message thread, or dialogue is dominant. Avoid dashboard rails.
The screen should feel authored and paced, with deliberate pauses and reveals.

### C. Evidence and audit screens

These answer “what do I know, what do I not know, and what should I inspect?”

10. **Client dossier** — account context, sponsor, operator, business problem, constraints.
11. **Evidence board** — notes, facts, assumptions, and open questions arranged spatially.
12. **Stakeholder map** — people, influence, alignment, and missing relationships.
13. **Timeline / delivery view** — sequence, dependencies, timing pressure, and handoffs.
14. **Document reader** — proposal, brief, risk note, or delivery artefact with annotations.

Composition: forensic and inspectable. Use tabs, zoomable artefacts, pinned evidence, and
progressive disclosure. The learner should be able to audit without leaving the engagement
world.

### D. Decision screens

These answer “given what I know, what will I commit to?”

15. **Decision workbench** — the primary learning surface; defined in detail below.
16. **Commitment review** — a short confirmation of the chosen approach, assumptions, and
   promises before the irreversible action.

Composition: highest information density, but still structured. This is the one screen where
the player reads, audits, compares, and decides in one continuous workspace.

### E. Consequence and learning screens

These answer “what happened, why did it happen, and what do I carry forward?”

17. **Outcome reveal** — immediate visible consequence of the player’s commitment.
18. **Advisor interpretation** — explains the business principle using the player’s exact path.
19. **Reflection / transfer** — low-stakes prompt connecting the lesson to real work.
20. **Chapter debrief** — consolidates the capability and returns to the map.
21. **Ending / run review** — shows the pattern of the engagement without turning it into a
   leaderboard or score chase.

Composition: consequence first, explanation second, next step third. Never bury the lesson in
analytics.

### F. Utility screens

22. **Save/resume** — return the learner to the exact engagement state.
23. **Accessibility and settings** — motion, sound, text size, contrast, and reset controls.
24. **Help / glossary** — definitions for business concepts, available without interrupting
   the main loop.

These screens should be quiet and functional. They must not introduce a second visual world.

## 3. The decision workbench

This is the anchor screen. It is not a row of option cards, a form, or a three-column
dashboard. It is an **engagement workbench** with a clear reading and action sequence.

### Desktop composition

```text
┌────────────────────────────────────────────────────────────────────┐
│ ORIENTATION STRIP: chapter · milestone · objective · evidence status │
├───────────────┬────────────────────────────────┬───────────────────┤
│ EVIDENCE      │ DECISION WORKBENCH            │ CONSEQUENCE LENS  │
│               │                                │                   │
│ account       │ situation / client voice      │ stakeholder       │
│ dossier       │                                │ effect            │
│               │ 3 approach artefacts          │                   │
│ stakeholder   │ compare / inspect / select    │ delivery effect   │
│ thread        │                                │                   │
│               │ selected approach summary     │ assumptions       │
│ timeline      │                                │                   │
├───────────────┴────────────────────────────────┴───────────────────┤
│ TIP / LEARNING SIGNAL                         REVIEW → COMMIT CTA   │
└────────────────────────────────────────────────────────────────────┘
```

#### 1. Orientation strip

Always visible, compact, and dark. Shows:

- chapter and milestone name;
- the capability being practised;
- one-line objective;
- evidence completeness: known / open / assumption.

It prevents the player from losing the plot while inspecting evidence.

#### 2. Evidence rail

This is not a generic sidebar. It is a stack of tappable artefact tabs:

- **Account:** sponsor, operator, client problem, constraints;
- **People:** stakeholder relationship thread;
- **Timeline:** what is urgent, what can wait;
- **Open questions:** what the player has not yet established.

Opening an artefact expands it in place or into a controlled drawer. It never navigates the
player to an unrelated page.

#### 3. Decision workbench

The centre is a large scenario surface. It contains:

- client voice or current situation;
- the decision question in plain language;
- three approaches represented as proposal sheets, meeting plans, or delivery moves;
- inspectable trade-offs: stakeholder, commercial, timing, and delivery implications;
- selected approach visibly placed on the workbench;
- a compact “what you are promising” summary.

The player compares approaches by opening, pinning, and selecting artefacts. There is no
Winnability/Profitability/Deliverability prediction question.

#### 4. Consequence lens

This panel is not a score preview. It shows the consequences the player is choosing to carry:

- whose confidence increases or decreases;
- what becomes easier or harder;
- what assumption remains untested;
- what the next conversation will require.

It uses labels and directional language, not fake precision. It should answer “what will I
have to deal with next?”

#### 5. Commitment bar

The bottom bar contains:

- one contextual tip or learning signal;
- a secondary “review evidence” action;
- one primary “Commit to this approach” action.

The CTA is disabled only when the required selection is incomplete. It is never gated by a
prediction or confidence guess.

### Mobile composition

The same workbench becomes a deliberate sequence, not a compressed desktop layout:

1. orientation strip;
2. client voice and situation;
3. horizontal evidence tabs;
4. approach artefacts as a focused vertical comparison;
5. consequence lens drawer;
6. commitment review;
7. sticky commit action.

The evidence drawer must preserve the player’s selected approach when closed. Nothing important
is hidden only behind a gesture.

## 4. Transitions between categories

- Orientation → Narrative: map node opens into a staged moment.
- Narrative → Evidence: message or conversation leaves a trace on the evidence board.
- Evidence → Decision: the selected evidence remains visible as context on the workbench.
- Decision → Consequence: chosen approach becomes the first object in the outcome reveal.
- Consequence → Learning: the advisor interprets the exact change, not a generic score.
- Learning → Orientation: the map updates visibly and names the next capability.

## 5. Approval sequence

Approve the system in this order:

1. screen categories;
2. shared visual language;
3. decision workbench composition;
4. mobile decision sequence;
5. one narrative screen and one evidence screen;
6. only then the full screen mockup set.

This avoids polishing six unrelated screens before the core interaction is right.
