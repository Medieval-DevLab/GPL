# UI audit — where we are failing

Comparison of the shipped build (commit `c3e1a4f`) against `docs/DESIGN-LANGUAGE.md`,
taken zone by zone. Evidence is `docs/screenshots/` at 1440×900 and the ten mockups.

Severity: **P0** breaks the core feel · **P1** visible and cheap · **P2** polish.

---

## The four findings that matter

Everything below reduces to four things. If only these were fixed, the rest would
mostly stop mattering.

### F1 · We built a scrolling article; the mockups are a fixed console — **P0**
Every mockup fits in one screen with no scrolling: top bar, left rail, working area,
right rail, action bar, all visible simultaneously. Our mission 4 screen is **1,650px
tall at 1440 wide** and mission 8 was worse before the density pass. The player scrolls
past the brief, scrolls through options, scrolls to the button.

A form is a thing you go down. A console is a thing you look across. This is the single
biggest reason it reads as a form, and no amount of colour or copy-trimming will fix it.

### F2 · Our options are stacked rows; the mockups are side-by-side columns — **P0**
This is the specific mechanic of F1 and deserves naming separately.

In the mockups, three or four options are **equal-height columns**. Their checklists line
up row-wise, so you compare *across* — "this one builds trust, that one conserves
resources" — in one eye movement. Each column is a self-contained object: photo, icon
medallion, title, checklist, cost meter, its own button. It looks like **a hand of cards
you are choosing between**.

Ours are full-width horizontal bands, read top to bottom, one at a time, with a text link
at the right end. That is a radio-button list wearing a card's clothing.

### F3 · No imagery whatsoever — **P0**
Every mockup carries: a hero photograph in the header (~40% of the header block), a client
photo in the identity strip, an advisor photograph in the left rail, and on two screens a
photo header per option card. Roughly **25–30% of the pixels above the fold are
photographic**.

We have zero images. Our decision (D-011 lineage: "no asset files, no network request")
gave us inline SVG icons and a monogram instead of a face. That was a reasonable
engineering call and it is a large part of why the screens feel clinical. The mockups'
warmth is substantially photographic.

### F4 · Every icon is the same purple — **P1**
The mockups assign icon colour **per meaning**: on one card, purple cart / purple bars /
*green* target / *grey* bars. On the assessment row, *blue* star / purple target / purple
people / purple bars. On "Things to consider", four items carry four different coloured
icons (bulb, people, warning, chart).

We render every icon in `--color-accent`. Monochrome icons plus uniform card treatment is
exactly the flat, undifferentiated surface the user is reacting to.

---

## Zone-by-zone

### Z1 · Page frame — **P0**
| | Mockup | Ours |
|---|---|---|
| Structure | One inset rounded white console panel, radius 16px, on a lavender-grey page | Full-bleed page, no frame |
| Effect | The app is an instrument on a desk | The app is a web page |

We never established a frame. Adding one is cheap and immediately changes the register.

### Z2 · Top bar — **P1**
Ours is structurally right (wordmark, stepper, score, restart). Differences: the mockups
have a **trophy icon** beside the score and a **user avatar**, and the wordmark is a real
logo mark with the product name spelled out beside it. Our score chip is a bordered pill;
theirs is bare icon + label + large purple number.

### Z3 · Chapter stepper — **P1**
Close, with two gaps. The mockups' connector is a **track that fills behind you** —
a continuous line in purple/green to the left of the active node, grey to the right. Ours
is five separate 2px dashes. And their done-state label stays dark; ours greys out.

### Z4 · Left rail — **P1**
Mostly correct — chapter, title, "Mission N of M", numbered checklist with green ticks,
objective, estimated time, advisor. Gaps:
- **Advisor has a photograph**, we have a monogram (F3)
- Mockups add a **"Team discussion — Recommended"** row we omit
- Ours sits on a tinted panel; the mockups' rail is **white**, and the *main area* is the
  tinted surface. We have the figure/ground inverted.

### Z5 · Header block — **P0**
| | Mockup | Ours |
|---|---|---|
| Layout | H1 + lede on the left 60%; **hero photo bleeding to the top-right corner**; client pull-quote right of it | H1 + situation paragraphs, full width |
| Lede | Exactly two lines | Two paragraphs |
| Client voice | Always present in the header, as a quote with a purple left rule | Only on two missions, mid-page |

The header is where the mockups spend their visual budget, and ours is the plainest part
of the page.

### Z6 · Client identity strip — **P1**
We have name, monogram, tag pills, blurb and three facts — the right elements. The mockups
add a **photo thumbnail** (F3) and lay the facts out horizontally *beside* the identity
with a vertical divider, rather than as a band underneath. Theirs reads as one object;
ours reads as two stacked ones.

### Z7 · Assessment / factors — **P1**
Mockups: **four cards across**, each with a large polychrome icon, label, bar, bold level
word and a two-line note.
Ours: a 2×2 grid with small monochrome icons, a chip, a bar and a note.

Ours is actually close. The gaps are icon size (15px vs ~24px), icon colour (F4), and
four-across versus 2×2.

### Z8 · Voice panels — **P1**
"What they said" — mockups use a lavender panel with a **speech-bubble icon in a circular
medallion**. Ours has a small inline icon and a tinted blockquote. Close.

"Key concerns" — mockups use a **rose/pink panel with a red circled "!"**. Ours is a plain
white panel with a small amber icon. **We lose the sentiment encoding entirely**, which is
a cheap and high-value fix.

### Z9 · Question header — **P2**
Mockups: bold H2 + a one-line instruction beneath it ("Choose the response that best fits
your strategy"). Ours: H2 alone, in a **serif** face. The mockups use no serif anywhere.

### Z10 · Option cards — **P0**
Covered as F2. Itemising what each card is missing:

| Element | Mockup | Ours |
|---|---|---|
| Arrangement | 3–4 equal columns | full-width stacked rows |
| Photo header | on 2 of 10 screens | none |
| Icon | 56px circular medallion, or lettered A/B/C badge | 38px rounded-square tile |
| Title | 17px bold, sometimes centred, purple when selected | 16.5px bold, always ink |
| Checklist | ✓ / ⛔ vertical list, 4–5 items, aligned across cards | wrapping chips, max 2+2 |
| Cost | grey sub-panel, "Resource cost", Time/Investment dot rows | inline dots in the footer |
| Pip meters | 4 labelled rows of ~8 discrete segments | none |
| Footer facts | two columns (investment / timeline) | none |
| CTA | **full-width button**, outlined → solid purple when selected | a text link, "Select this option →" |
| Ribbon | "Recommended" purple pill | none |

Our recent change to chips **moved us further from the mockups**, not closer: the mockups'
checklists are vertical lists precisely so they align across columns. Chips only made
sense because our options were rows. Fixing F2 makes the vertical list correct again.

### Z11 · Right rail — **P1**
- "Things to consider": mockups give **each item its own coloured icon**; ours uses
  identical purple dots.
- "Think about…": mockups use a lavender panel with a **purple heading** and `+`
  prefixes; ours is a white card with a dark heading.
- Mockups have **"How the options compare"** — a grouped bar chart. We have nothing
  comparative anywhere.

### Z12 · Action bar — **P1**
Mockups: Tip with a **graduation-cap icon in a grey rounded-square tile**, then a large
solid purple CTA, **pale lavender when disabled**. Ours: bulb icon in a lavender pill, CTA
goes **grey** when disabled. Grey reads as broken; pale lavender reads as not-yet.

### Z13 · Consequence screen — **P1**
Mockups have a genuine result celebration: a **large green circled ✓**, a green-tinted
banner, then **"Key outcomes"** as circular icon badges with titles, and a **metric tile
row** with big numbers and ▲/▼ deltas.

Ours: a tone-tinted header strip, headline, prose, an arrow list, and a factor grid. The
elements roughly correspond but the *scale* is wrong — theirs is a scoreboard, ours is a
paragraph. No celebration moment.

### Z14 · Ending screen — **P1**
Mockups have a **letter grade in a circular progress ring** (`B+`) — an instantly legible
verdict. Ours has a prose verdict headline and three numbers. We also have no equivalent
of their standings table or chevron rows.

### Z15 · Motion — **P2**
We apply `.anim-rise` fade-and-slide to nearly every section and a hover lift to every
card. Anthropic's own `frontend-design` skill names this exact pattern as a generic AI
tell: *"fade-and-slide-up entrances on each section and hover transitions on every card
are the generic default and read as AI-generated."* We should keep motion that answers an
action (selection, meter fill, reveal) and cut the ambient entrance animations.

### Z16 · Type — **P1**
We use **Fraunces, a serif, for all display type**. No mockup contains a serif. This is a
deliberate divergence I introduced and never checked against the brief — it is a
significant part of why the screens don't look like the mockups even when the layout is
similar.

### Z17 · Colour — **P1**
Our tokens are close (purple `#6D35E8` vs their `#7C3AED`; same green, amber, rose
families). The failures are in **application**, not palette: monochrome icons (F4), no
sentiment-tinted panels (Z8), grey disabled CTA (Z12), and figure/ground inversion on the
rails (Z4).

---

## Things we have that the mockups do not

Worth protecting — these are ours, and several are better:

- **The no-outcome-preview rule (G3).** The mockups show "Higher win probability" and
  "Recommended" on option cards. We must not copy that; it would remove the decision.
- **The word budgets (D-019).** The mockups are terse by hand; we enforce it.
- **Situation variants.** Late missions rewrite themselves based on what you did. No
  mockup shows this.
- **Causal threads in the debrief.** Derived, not authored. Nothing in the mockups does
  this and it is the best thing in our build.
- **Determinism and the exhaustive sweep.** Not visible, but it is why the teaching works.
- **Keyboard play and the accessibility floor.**

## Also relevant: the "generic tells" check

Anthropic's `frontend-design` skill lists the traits that mark a design as AI-generated.
We currently exhibit four of them:

1. ✅ **"the SaaS-card kit"** — identical rounded cards, one radius on everything, the same
   soft grey shadow under each, separated by gaps. This is precisely our current UI.
2. ✅ **"a tracked-out ALL-CAPS eyebrow label above every heading."** We reduced this in
   D-018 but it is still on every mission and every ending section.
3. ✅ **"meta strings joined with middle dots ('A · B · C')"** — our ending timeline and
   selection counters.
4. ✅ **"a '→' appended to link and button text"** — every button we have.
5. ✅ **fade-and-slide entrances + hover transitions on every card** (Z15).

The mockups avoid 1, 4 and 5. They *do* use eyebrows and middle dots — so on those two,
the brief overrides the general guidance. On the SaaS-card kit, the arrow suffix and the
ambient motion, the mockups and the skill agree against us.
