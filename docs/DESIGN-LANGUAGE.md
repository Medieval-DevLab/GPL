# The mockup design language

> Historical reference, superseded on 22 September 2026 by [Complete game backlog](COMPLETE-GAME-BACKLOG.md), [content coverage](GAME-CONTENT-COVERAGE.md) and [desktop/photo specification](GAME-PHOTO-AND-SCREEN-SPEC.md). Older approval labels, mobile compositions, illustration-only cast, prediction gates and conflicting screen requirements below are not implementation authority.

Extracted from the ten mockups in `Mockups/` by reading all of them, zone by zone.
This document describes **what the mockups actually do** — it is observation, not proposal.
`docs/UI-AUDIT.md` is the gap analysis against what we built.

Where this document and my own instincts disagree, this document wins. The mockups are
the brief.

---

## 1. The governing idea

**It is a console, not a document.**

Every mockup is a *fixed-height operations console*: a top bar, a left rail, a main
working area, a right rail, and an action bar — all visible at once, nothing scrolling.
The player is sitting at an instrument, looking at a situation laid out in front of them.

Our build is a *scrolling article* with a rail either side. That single difference is
most of why it "feels like a form" — a form is something you fill in from top to bottom,
a console is something you read across and act on.

Consequences of the console idea:
- Content is **chunked into panels sized to fit**, not paragraphs sized to be read.
- Comparison is **horizontal**. Options sit side by side so their attributes line up.
- The action bar is always in view because the screen never scrolls.

## 2. Frame and surfaces

| Surface | Treatment |
|---|---|
| Page behind everything | light lavender-grey, ~`#F4F3F9` |
| The app itself | a **single rounded white panel**, inset ~12px from the page edge, radius ~16px, one soft shadow. Everything lives inside it. |
| Left rail | white, separated from the main area by a 1px border — not a floating card |
| Main working area | very light grey, ~`#F8F8FC`, acting as a desk for white panels |
| Panels on the desk | white, 1px `#E5E7EB` border, radius ~12px, **no shadow or a barely-there one** |
| Advisory panels | lavender `#F5F3FF`, 1px `#EDE9FE` |
| Warning panels | rose `#FEF2F2`, red icon |
| Sub-panels inside a card | grey `#F9FAFB`, radius ~8px |

The important part: **panels are bordered and flush-adjacent, divided by 1px rules.**
They are not detached cards separated by gaps with drop shadows. The mockups look like a
dashboard; a gap-and-shadow card grid looks like a marketing page.

## 3. Colour

```
Purple   #7C3AED  primary — solid fills: active step, active tab, CTA, selected button,
         #6D28D9  numbered badges, medallion icons
Lavender #F5F3FF  advisory panel fill
         #EDE9FE  medallion backgrounds, borders
Green    #10B981  completed steps, ✓ marks, positive bars, "Complete" pills, ▲ deltas
Rose     #EF4444  ⛔ marks, red circled "!", ▼ deltas
         #FEF2F2  concern panel fill
Amber    #F59E0B  medium-level bars, caution icons
Blue     #3B82F6  a secondary metric colour (star, database icons)
Ink      #111827  headings
         #4B5563  body
         #9CA3AF  labels and muted values
Border   #E5E7EB
```

**Icons are polychrome, and this matters.** In the mockups, four attribute icons on one
card are four different colours — purple cart, purple bars, *green* target, *grey* bars.
On the assessment row: *blue* star, purple target, purple people, purple bars. The colour
is assigned per-meaning, not per-component. This is a large part of why the mockups read
as rich and ours reads as flat: we render every icon in one purple.

**Disabled primary CTA is pale lavender**, not grey. It still reads as the purple button,
just not yet available — an invitation rather than a refusal.

## 4. Type

- **One sans family throughout.** There is no serif anywhere in any mockup.
- H1 ~34px / 700 / tight leading / sentence case
- Lede ~16px / 400 / grey / **two lines, never more**
- Eyebrow ~11px / 600 / uppercase / letterspaced / grey — present above every H1
- Panel heading ~15px / 700 / ink, often with a coloured icon beside it
- Card title ~16–18px / 700
- Body 13–14px
- Label 11–12px / 500 / grey
- Metric number 24–28px / 700

## 5. Component inventory

These are the specific objects the mockups are built from. Numbered because we will need
to refer to them.

**Frame**
1. **Console panel** — the whole app as one inset rounded white sheet
2. **Top bar** — wordmark + product name | stepper | team/score/avatar
3. **Chapter stepper** — numbered circles joined by a **connector track that fills
   behind you**; done = ✓, active = solid purple + label in purple
4. **Score chip** — trophy icon + "Score" + a big purple number

**Left rail (identical on every mission screen)**
5. Chapter label, chapter title, "Mission N of M"
6. **Numbered step checklist** — done = green circle + white ✓; active = purple circle +
   number + lavender pill behind the row; upcoming = grey circle + grey number
7. **"Your objective"** — target icon + heading + two lines
8. **Estimated time** — clock icon + label + bold value
9. **"Team discussion — Recommended"** — people icon + label
10. **Advisor card** — **a photograph**, name, role, italic quote

**Header block**
11. Eyebrow → H1 → two-line lede, occupying the left ~60%
12. **Hero photograph**, ~16:9, occupying the right ~40%, **bleeding to the panel's top
    and right edges**
13. **Client pull-quote** — purple left rule, italic quote, name, role, company

**Situation panels**
14. **Client identity strip** — photo thumbnail | name + tag pills + one-line description
    | vertical divider | 3–4 icon+label+value facts
15. **Tab / segmented control** — e.g. "Client overview | Comparison view"; active tab is
    solid purple with white text
16. **Factor cards, four across** — large coloured icon, label, progress bar, bold level
    word, two-line note
17. **Metric tile row** — icon + label + big number + coloured delta with ▲/▼
18. **"What they said"** — lavender panel, speech-bubble icon in a circular medallion,
    italic quote
19. **"Key concerns"** — **rose panel**, red circled "!", short bullets

**The option card — the centrepiece**
20. Options are **side-by-side columns**, three or four across, equal height. Never a
    stacked list.
21. Card anatomy, top to bottom:
    - optional **photo header**, full card width, ~95–105px tall
    - **circular icon medallion** (~56px, lavender fill, purple icon) overlapping the
      photo's bottom edge — or a **lettered badge** (A / B / C) beside the title
    - optional **"Recommended" ribbon pill** in purple
    - **title** (~17px bold) and optional subtitle
    - **description**, 2–3 short lines
    - a divider
    - **✓ / ⛔ checklist**, 4–5 items, one short line each — green check, red circled minus
    - a grey **sub-panel**: either "Resource cost" with Time/Investment dot rows, or a
      **pip-meter block** — 4 labelled rows of ~8 discrete segments
    - optional **footer facts in two columns** — "Estimated investment $4M–$6M | Timeline
      4–6 months"
    - **full-width button**: outlined with purple text normally, **solid purple when
      selected**
22. Selected card = 2px purple border + very faint lavender fill + solid purple button.

**Right rail**
23. **Icon-led consider list** — every item has **its own coloured icon** (bulb, people,
    warning triangle, bar chart). Not bullets.
24. **"Think about…" / "What to think about"** — lavender panel, bulb icon, **purple
    heading**, items prefixed with a small `+`
25. **"Impact on key factors"** — icon + label + bar per factor
26. **"How the options compare"** — a grouped bar chart across all options
27. **"Learning in progress"** — book icon in a lavender medallion + two lines

**Action bar**
28. **Tip** — graduation-cap icon in a grey rounded-square tile, "Tip" label, two lines
29. **Primary CTA** — large solid purple, right-aligned, pale lavender when disabled

**Result screens**
30. **Outcome banner** — large green circled ✓ + eyebrow + headline + two lines, on a
    green-tinted panel
31. **"Key outcomes"** — circular coloured icon badge (green ↗ / amber −) + bold title +
    two lines
32. **Grade ring** — a big letter grade inside a circular progress ring
33. **"What's next?"** — lavender panel with checkbox icons
34. **Standings table** — rank, coloured dot per competitor, values, ▲/▼ movement
35. **Chevron rows** — a clickable list of items with `›` at the right

## 6. Interaction and motion

- **Selection is a two-state card**, and the state is carried by the card's own button
  changing from outlined to solid. Not a radio dot.
- **Tabs** switch the content of a panel in place. Progressive disclosure is done by
  tabs and "View details" / "View full client brief" buttons, not accordions.
- Motion is not visible in static mockups, but the structure implies **one thing changing
  at a time in place** rather than whole pages animating in.

## 7. What the mockups deliberately do NOT do

- No serif type anywhere.
- No per-option prediction of the outcome. "Recommended" appears, and "Higher win
  probability" appears as a chip on an *offer* — but those are the client-facing framing
  of a negotiation, not a score preview. (We must not import these; they would breach our
  own rule G3.)
- No long prose. The longest body text in any mockup is three short lines.
- No drop-shadowed floating card grid.
- Nothing is centred except option card titles.
