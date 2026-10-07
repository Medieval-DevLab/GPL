# Art direction: a daylight business story

8 October 2026. This document describes how GPL looks and moves, and why. It replaces the dark,
cinematic direction of D-077, which was itself replaced the same day by D-080. Rules on evidence,
attribution, outcome previews and accessibility in `DESIGN-RULES.md` still apply.

## What went wrong, measured

The user found the D-077 build "gorgeous" but unreadable, too futuristic, and impossible to
follow. A diagnostic run measured every visible word across a full playthrough at 1440×900,
including its real contrast against the pixels behind it:

| Measure | D-077 (dark) | D-080 (daylight) |
|---|---:|---:|
| Screens per run | 79 | 48 |
| Screens before the first decision | 5 | 3 |
| Non-decision screens between decisions | 2–5 | 1–2 |
| Words below 14 px | 34% | 0% |
| Words on rotated surfaces | 39% | 0% |
| Words set over photographs | 20% | 0% |
| Words in tracked monospace capitals | 12% | 0% |
| Words failing real contrast | 11% | 0%¹ |
| Distinct layouts for a decision | 14 | 1 |

¹ The diagnostic flags about 2% of words. All of them were scrolled under the sticky command
bar when the screenshot was taken; none is visible text with low contrast.

The structural cause mattered more than any single visual choice. The game had no spine: 18
standalone cases, 53 different lesson sentences, 50 record labels, and 14 layouts. A screen
changed because the format changed, not because the story did.

## The spine

- **One question** on the title, the journey and the ending: *Can you win Orion's work, make it
  worth winning, and still deliver what you promised?* (`STORY` in `presentation.ts`).
- **Three questions** under it, matching the three indicators the engine already tracks: *Can
  we win it? Is it worth winning? Can we deliver it?* (`RULES`).
  - Every decision is filed under one of them (`MISSION_RULE`). Its consequence says so: "Filed
    under Can we deliver it?".
  - Every position in the player's record is filed under one too (`LEDGER_RULE`). A test fails
    if a new ledger rule is added without a home.
- **One question per act** (`ACT_QUESTION`), each a step towards the main one.

## Scene grammar: a new screen means the story moved

- **A decision is one scene.** The situation and the choice share a screen. Committing does not
  change the screen: the room's answer takes the situation's place, and the board marks what
  changed (*New*) and what caused it (*Why*).
- **One layout for all 18 decisions.** The place and the people sit on the left, the decision in
  the centre and the board on the right. Only the place, the people and how they reach you ("On
  a call", "In a message", "Across the table") change between scenes, so the change is
  information.
- **An act break is one screen.** It replaces the old debrief → journey map → chapter opener
  sequence. It shows what the act decided (one line per decision, filed under a question), the
  act's reflection question (which used to interrupt mid-act), the next act's question, and the
  board with the deal's position.
- **Story turns keep a screen**, because news arriving from elsewhere is the situation changing.
- **The journey map is on request** (the progress track in the header), never forced.

None of this changes the engine. `App.tsx` `settle()` advances through the brief phase, the
mid-act reflection beat and the next act's opener with ordinary `advance` calls, so state,
saves and run codes are exactly what they were.

## The board ("Where you stand")

The player's record, in the engine's own plain-language positions (`ledger`), filed under the
three questions and always in the same place. It replaces the hidden 50-label account file as
the thing a learner carries in their head.

- At most four cards per question. Detail shows only where it is news; older cards are labels.
- Values appear only on a consequence, an act break, the journey and the ending, never over a
  decision (G9).
- Liabilities are reported as positions, never styled as gains or shortfalls.

## The look

A good business magazine, not a game HUD.

| Element | Choice |
|---|---|
| Page | Warm paper `#f6f3ed`, white cards, hairline `#ded7ca` |
| Text | Ink `#16181c` (16:1); secondary `#474c55` (7.8:1); tertiary `#5c616a` (5.6:1, 14 px minimum) |
| Accent | One per act, used for the act label, the active question, the selected option and the primary action. Act 1 amber `#985400`, act 2 teal `#0b6673`, act 3 indigo `#4a42ad`, act 4 crimson `#a32547`, act 5 green `#1d6c45`. All are at least 5.8:1 as text on white, and white is at least 5.8:1 on them. |
| Brand | Vermilion `#c2381e`, on the frames around the story only |
| Type | Newsreader (serif) for headlines and voices; Inter for reading and interface. Reading text 17–18 px, nothing below 14 px. No tracked capitals, no rotation, no condensed display face. |
| Photographs | Daylight only, framed as photographs with the place named in live text beneath. Never full-bleed, never behind text. Night cityscapes and background-removed cut-outs were removed. |
| Motion | A fade and a 10 px rise on entry; a two-second outline on new board cards; a cross-fade between scenes. Nothing loops. Reduced motion shows finished screens. |
| Sound | Off by default. Select, page, stamp and act-change cues only. |

## Rules that keep this from decaying

- A new beat is a scene in the same layout, or it does not get a screen.
- No text over a photograph, no rotated text, nothing below 14 px, no tracked capitals.
- Every new decision gets a `MISSION_RULE`, and every new ledger rule a `LEDGER_RULE`; the tests
  enforce both.
- Anything that steers comes from a named colleague. The interface reports; it never advises
  (G9b).
- Re-run the readability diagnostic (`docs/RELEASE-VERIFICATION.md` describes it) after any
  layout change, and look at the screenshots.
