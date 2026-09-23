# GPL visual language and world proposal

> Historical reference, superseded on 22 September 2026 by [Complete game backlog](COMPLETE-GAME-BACKLOG.md), [content coverage](GAME-CONTENT-COVERAGE.md) and [desktop/photo specification](GAME-PHOTO-AND-SCREEN-SPEC.md). Older approval labels, mobile compositions, illustration-only cast, prediction gates and conflicting screen requirements below are not implementation authority.

**Status:** approval required before Astra implementation

**Audience:** product owner, design, Astra, content, QA

## The product promise

GPL is an adult business simulation for Accenture employees. The player is not an avatar
inside a fantasy universe and is not collecting game currency. They are leading one client
engagement and learning how commercial, stakeholder, and delivery judgement compound over
time.

The emotional target is: **“I can see the work, I understand the trade-off, and I can own
the consequence.”**

## World model

The game takes place in a recognisable consulting environment:

- one client account, Orion Retail;
- one engagement team with distinct points of view;
- one evolving client relationship;
- real artefacts: briefs, meeting notes, proposal pages, stakeholder maps, delivery plans,
  risk notes, and handover documents;
- five capabilities represented as milestones: discover, qualify, shape, mobilise, deliver;
- consequences shown through access, momentum, trust, and delivery confidence—not a fantasy
  economy, coins, XP, or leaderboard.

The world is a **living worktable**. The map is an engagement path, not a geographical map.
The player should feel that documents, people, and commitments persist from one screen to the
next.

## Visual north star

**Premium editorial enterprise simulation.**

The reference bar is a well-made executive product: calm, precise, tactile, and confident.
It can be engaging without being childish, noisy, or gamified. Visual interest comes from
meaningful state change: an opened dossier, a stakeholder thread becoming visible, a route
unlocking, or a document changing after a decision.

### Palette

| Role | Token | Use |
|---|---|---|
| Ink | `#132238` | headings, dark stage, primary text |
| Muted | `#607086` | supporting copy, metadata |
| Paper | `#FFFFFF` | primary surfaces |
| Field | `#F7F9FC` | page and reading surfaces |
| Violet | `#5B4BD8` | current state, primary action, focus |
| Lavender | `#EEECFF` | orientation and learning callouts |
| Teal | `#168A83` | progress, completed state, positive change |
| Amber | `#C77B19` | lesson, caution, trade-off |
| Coral | `#C85C57` | risk, tension, negative change |

Colour never carries state alone. Every state also has text, position, icon, or shape.

### Type and density

- one highly legible sans-serif family;
- sentence case for all player-facing headings;
- uppercase is reserved for small orientation labels;
- H1: 28–34px, 750–800 weight;
- body: 13–15px, maximum two or three lines per block;
- metadata: 10–12px;
- minimum touch target: 44px;
- generous whitespace; no permanent three-column dashboard on mobile;
- each screen has one dominant headline, one supporting explanation, and one primary action.

### Surfaces and objects

Use a small number of surfaces with clear jobs:

1. paper surface for reading and decisions;
2. soft field for orientation and supporting content;
3. dark stage for chapter closure and major story turns;
4. artefact surface for documents, notes, and evidence;
5. callout surface for learning interpretation.

Do not use decorative cards simply to fill space. A surface must represent a real object,
state, or decision.

## Screen language

| Screen | Visual register | Job | Primary action |
|---|---|---|---|
| Home | calm workbench | orient | Continue journey |
| Map | sparse route | name the milestone | Enter milestone |
| Chapter intro | editorial briefing | explain capability | Begin chapter |
| Brief | evidence table | prepare | View choices |
| Decision | focused comparison | choose | Commit to approach |
| Result | consequence report | show change | Continue |
| Lesson | annotated interpretation | make meaning | Continue |
| Debrief | dark reflective stage | consolidate | Return to map |

Transitions should preserve the object being discussed. A chosen option should become the
result artefact; a completed chapter should visibly change the map; a new stakeholder should
enter the existing relationship thread.

## Engagement rules

- no prediction quiz for Winnability, Profitability, or Deliverability;
- no coins, XP, energy, timers, streaks, or leaderboard;
- no fantasy geography, cartoon characters, or children’s-game visual language;
- no dense dashboard rails on mobile;
- no wall of prose; use short evidence blocks and artefacts;
- no consequence that appears only as a number—the world must also change;
- no choice without a visible trade-off;
- no result without an explanation and carry-forward cue.

## Approval board

The current visual approval board is [design-preview.png](../design-preview.png). It contains
Home, Journey Map, Chapter Intro, Decision, Result/Lesson, and Chapter Debrief screens. The
editable layout source is [design-preview.svg](../design-preview.svg), with a browser-readable
prototype at [design-preview.html](../design-preview.html).

Approval should cover four questions:

1. Does this feel like a premium adult business simulation rather than a dashboard or a game
   for children?
2. Is the reading order immediately obvious on every screen?
3. Does the map and artefact language make the engagement feel continuous?
4. Are the palette, density, and dark debrief stage right for Accenture employees?

No production implementation should begin until these answers are approved or revised.
