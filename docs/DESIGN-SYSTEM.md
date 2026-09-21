# GPL design system

The colour and type system, with the arithmetic. Tokens live in `src/index.css`; this
document is why they are what they are.

Companion documents: `docs/DENSITY-FRAMEWORK.md` (how much may be on a screen),
`docs/DESIGN-LANGUAGE.md` (the layout language taken from the mockups).

---

## The governing idea

**Hue means one of two things, and they are never the same hue.**

- **Brand purple** identifies the product. It carries **no data**: wordmark, chapter
  stepper, primary action, focus, selection, section icons, medallions, interludes, title.
- **Three dimension hues** carry magnitude the player reads off them. Winability,
  Profitability, Deliverability must stay separable under protanopia, deuteranopia and
  tritanopia, because the player reads a *value* from them.

Colour never carries meaning alone: position, pictogram and number stay.

### Why it was not always like this

Twice now, a colour that carries no data has been put on a hue axis that carries data.
Both times the arithmetic said so and nobody had run it.

| | what happened | measured |
|---|---|---|
| **First** | the original violet accent `#7c3aed` sat on Winability's axis | `win #5b4de8` vs accent: ΔE2000 **5.9** normal, **1.2** deuteranopia |
| **Second** | the fix — "the brand becomes ink" — moved the brand onto *Deliverability's* axis | `ink-12` at CIELAB h **284.4°**, `deliver-solid #054e9e` at h **284.4°** |

The second is the one worth dwelling on, because it shipped as the solution. The ink ramp
and the Deliverability blue were one hue family. The real floor of that system was
**ΔE 13.4** — `deliver-solid` against `text-muted` under tritanopia — not the 18.9 the
previous version of this document claimed, which only ever compared the three dimensions
with each other and never with the ink they sit on.

It also cost the game its colour. Measured on the shipped build, a decision screen spent
**0.11–0.19%** of its pixels on a chromatic surface and the title screen and both
interludes spent **0.00%**. An all-ink palette on warm paper is a document.

So: the ink ramp moves off the blue axis, and the brand comes back as purple.

## The brand, and the one brand purple this interface cannot use

The brand ramp is the Accenture theme verbatim — `PPT Template.potx`,
`ppt/theme/theme1.xml`, `clrScheme name="Accenture"`:

| slot | hex | used as |
|---|---|---|
| accent3 | `#e6dcff` | `--ref-purple-3` — the wash |
| accent2 | `#c2a3ff` | `--ref-purple-4` — the page gradient's lavender stop |
| dk2 / hlink | `#a100ff` | `--ref-purple-6` — **bright**: selection rim, decorative rules, pulse |
| accent1 | `#7500c0` | **absent — see below** |
| lt2 | `#460073` | `--ref-purple-11` — **solid**: every fill and every purple glyph |

**accent1 `#7500c0` is deliberately unused, and this is the interesting number in the
system.** Purple and blue differ almost entirely by *lightness* under deuteranopia, not by
hue. So the usable purples are not a hue band — they are two shores either side of
Deliverability's lightness (OkLCh L 0.43):

| OkLCh L | purple | ΔE2000 vs `deliver-solid`, deuteranopia |
|---|---|---|
| 0.28 | `#3a0061` | 13.6 |
| **0.32** | **`#460073`** (lt2) | **10.5** ← the dark shore |
| 0.40 | `#6200a0` | **3.7** |
| 0.42 | `#6900aa` | **3.2** ← the floor of the valley |
| 0.46 | `#7500c0` (accent1) | **4.6** |
| 0.50 | `#8600d7` | 7.5 |
| **0.57** | **`#a100ff`** (dk2) | **15.6** ← the bright shore |

A `#7500c0` primary button and a Deliverability meter are the same colour to roughly 6% of
men. The deck's own deep purple and core purple are both safe. Nothing needed inventing;
it needed measuring.

### Two registers, two jobs

`--color-brand-solid` `#460073` is the workhorse because it is the only purple that is
legal **both** as small text on every surface in the system (worst case 10.64:1, on its own
tint) **and** as a fill under white text (13.93:1). A component naming it cannot get it
wrong. `#a100ff` fails 4.5:1 as small text on `surface-panel` (4.39) so it is confined to
fills and borders, where it only has to clear 3:1 — which it does everywhere by ≥35%.

The split is semantic as well as arithmetic:

- **bright violet** `#a100ff` = "you chose this" (selected card rim)
- **deep violet** `#460073` = "the keyboard is here" (focus ring)

Before, those were the same colour.

### Ink is a tinted neutral, not a grey

The ink ramp sits at OkLCh h **318°**: 62° off Deliverability (h 256°) and 14° off the
brand (h 304°), which is the right way round. Being near the brand costs nothing, because
neither the brand nor the type encodes a value. Being near Deliverability cost 13.4.

Lifting the ink off the blue axis raises that pair to **16.6**, and gives every letter on
screen a few points of the brand's chroma — so the shadow under a card is a purple shadow
and the wordmark is a very dark aubergine rather than a blue-black.

A sweep of all 24 ink hues at fixed lightness and chroma says this is close to optimal.
Warm ink (h 60–90°) is *better* against the blue — up to 32.3 — but collapses to **10.5
against risk red**, which is a worse trade: it swaps a collision with a meter for a
collision with the alarm colour.

## Contrast, measured

Computed from the hex, not inherited — and re-derived from the *shipped* `src/index.css` by
parsing the file and resolving the `var()` chains, so this table cannot drift from the
tokens the way the last one did. **Every text token clears 4.5:1 (WCAG 2.2 AA, 1.4.3) on
every surface it renders on**; the lowest in the whole system is **4.66:1** (`win-text` on
`surface-disabled`) and the lowest on a live reading surface is **5.06:1** (`win-text` on
`panel`). There is no "faint" tier: the old `--color-faint #948fa6` measured **2.78:1 on
panel** and was a live failure on every screen in the game.

These numbers are the **enriched** ramp — see "Depth is temperature" below for why the
previous one had to move. Deepening the paper by roughly a third of a stop cost about a
point of contrast at the bottom of the table and bought the first visible elevation the
system has ever had.

### Text — needs 4.5:1

| token | card | desk | page | panel | selected | disabled | brand tint |
|---|---|---|---|---|---|---|---|
| `text-strong #1e1621` | 17.62 | 16.90 | 15.03 | 12.67 | 13.78 | 11.68 | 13.46 |
| `text-default #3a2e3d` | 12.82 | 12.30 | 10.93 | 9.22 | 10.03 | 8.50 | 9.80 |
| `text-muted #514657` | 8.88 | 8.52 | 7.58 | 6.39 | 6.95 | 5.89 | 6.79 |
| `text-subtle #5e5462` | 7.19 | 6.90 | 6.13 | 5.17 | 5.62 | 4.77 | 5.49 |
| `text-disabled #4f4a51` | 8.64 | 8.29 | 7.37 | 6.21 | 6.76 | **5.73** | 6.60 |
| `accent #460073` | 13.93 | 13.36 | 11.88 | 10.01 | 10.89 | 9.24 | 10.64 |
| `accent-deep #2f064f` | 16.67 | 15.99 | 14.22 | 11.99 | 13.04 | 11.05 | 12.74 |
| `win-text #8a4708` | 7.03 | 6.75 | 6.00 | **5.06** | 5.50 | **4.66** | 5.37 |
| `profit-text #0f6249` | 7.33 | 7.03 | 6.25 | 5.27 | 5.74 | 4.86 | 5.60 |
| `deliver-text #0a4c90` | 8.57 | 8.22 | 7.31 | 6.17 | 6.71 | 5.69 | 6.55 |
| `risk-text #8e1212` | 9.35 | 8.97 | 7.98 | 6.73 | 7.31 | 6.20 | 7.15 |

On their own tints: `win-text` 5.87 · `profit-text` 6.02 · `deliver-text` 6.52 ·
`risk-text` 7.18.

White text on a fill: `accent` 13.93 · `accent-deep` / `brand-lip` 16.67 ·
`good` (= `text-strong`) 17.62 · `risk-solid` 7.85 · `brand-bright` 5.30.

`surface-disabled` is the tightest ground in the light register and it is why the paper
ramp stops where it does: one step deeper, `win-text` on a disabled choice card measures
4.32:1 and the game has a 1.4.3 failure on every mission where an option is unavailable.

### Non-text — needs 3:1 (1.4.11)

| token | vs card | vs desk | vs page | vs panel | vs selected | vs hover |
|---|---|---|---|---|---|---|
| `border-control #6b6049` | 6.19 | 5.93 | 5.28 | 4.45 | 4.84 | 5.38 |
| `border-strong #574d3b` | 8.30 | 7.96 | 7.08 | 5.97 | 6.49 | 7.22 |
| `border-subtle #bfa87f` | 2.30 | 2.21 | 1.96 | 1.66 | 1.80 | 2.00 |
| `brand-bright #a100ff` | 5.30 | 5.09 | 4.52 | 3.81 | 4.15 | 4.61 |
| `brand-line #c2a3ff` | 2.10 | 2.02 | 1.80 | 1.51 | 1.65 | 1.83 |
| `win-solid #cd6d0a` | 3.63 | 3.48 | 3.09 | *2.61* | *2.84* | 3.16 |
| `profit-solid #339075` | 3.90 | 3.74 | 3.32 | *2.80* | *3.05* | 3.39 |
| `deliver-solid #054e9e` | 8.11 | 7.78 | 6.92 | 5.83 | 6.34 | 7.05 |
| `risk-solid #a31515` | 7.85 | 7.53 | 6.69 | 5.64 | 6.14 | 6.83 |

Meter fill against its own track: `win` **3.03** · `profit` 3.20 · `deliver` 6.17 ·
`risk` 6.02. That 3.03 is the tightest graphical pair in the system and it is what caps how
much chroma the tracks may carry: a deeper gold track is a prettier band and an unreadable
value.

Two rules fall out of the italics. `border-subtle` and `brand-line` are **decorative only**
and must never bound a control — a 1px rule between two panels is not a UI component
boundary. And **a dimension solid renders on the card or on its own track, never on the
panel**: `win-solid` measures 2.61 there. The three meters live in the white rail, so this
is a rule about where a chip or a dot may go, not a live failure.

### Where WCAG 2.x and APCA disagree, and which we followed

Both were computed for every pair. APCA (0.1.9) is reported as Lc; its rough guidance is
Lc ≥ 75 for body text, ≥ 60 for large or non-body, ≥ 45 for non-text.

They agree on ranking almost everywhere, and disagree in exactly one direction that
matters here — **saturated mid-tones**, which is the known failure mode of the WCAG 2
formula because it uses a luminance ratio that ignores chroma:

| pair | WCAG | APCA Lc | disagreement |
|---|---|---|---|
| `win-solid` on card | 3.63 | 63.3 | WCAG says "fill only"; APCA says this would pass as large text |
| `profit-solid` on card | 3.90 | 66.1 | same direction |
| `brand-bright` on `brand-tint` | 4.05 | 56.0 | WCAG says "close to text-legal"; APCA says clearly not |
| `text-muted` on `disabled` | 5.42 | 66.5 | WCAG comfortable; APCA marginal for body text |
| `text-disabled` on `disabled` | 5.22 | 65.5 | WCAG comfortable; APCA marginal |

**We followed WCAG 2.x as the gate and used APCA as a tie-breaker**, because 2.2 AA is the
conformance target a client can be held to and APCA is still a draft. Where APCA was the
stricter of the two we took the stricter reading: that is why `brand-bright` is barred from
type even though it would clear 4.5:1 on white, and why `text-muted` is not used for body
copy on `surface-disabled`. Where WCAG was stricter — the two dimension solids — we kept
the WCAG rule and they remain fills.

## The three dimensions

| dimension | solid | text | tint | line | L* |
|---|---|---|---|---|---|
| **Winability** | `#cd6d0a` | `#8a4708` | `#fbebdc` | `#b8803c` | 56 |
| **Profitability** | `#339075` | `#0f6249` | `#d7f5e8` | `#37957a` | 54 |
| **Deliverability** | `#054e9e` | `#0a4c90` | `#dae9ff` | `#4d7fbb` | 34 |
| Risk | `#a31515` | `#8e1212` | `#ffe3df` | `#c2574c` | 35 |

**The solids, texts and lines are unchanged, and that is a finding rather than an
omission.** Okabe–Ito construction — orange / bluish-green / blue — avoids the yellow-green
band where colour-vision confusion is worst and carries a deliberate lightness split
(56 / 54 / 34) so the pair that converges under deuteranopia stays separated by brightness.

Every attempt to open the purple gap by moving the blue toward Okabe–Ito's own `#0072b2`
cost more than it bought:

| candidate `deliver-solid` | vs Profitability (worst CVD) | vs brand `#460073` |
|---|---|---|
| **`#054e9e` (kept)** | **19.0** | 10.5 |
| `#0b5c96` | 15.5 | 12.6 |
| `#06628f` | 14.2 | 13.7 |
| `#0072b2` (Okabe–Ito) | **8.3** | 19.8 |

So the blue stays exactly where it is and the brand moves instead. Only the four `-6` tints
were deepened, to make a chip or a prediction pill a visible chromatic surface rather than
a near-white one.

### Colour-vision separation, recomputed

Pairwise ΔE2000 under Machado, Oliveira & Fernandes (2009) matrices at severity 1.0,
applied in linear RGB. **Ink-versus-hue pairs are included**, which the previous table
omitted; they are where the real floor was.

| pair | normal | protan | deutan | tritan | **min** |
|---|---|---|---|---|---|
| `deliver-solid` / `brand-solid` | 23.8 | 14.3 | **10.5** | 37.5 | **10.5** |
| `text-default` / `text-muted` | 10.7 | 10.8 | 10.8 | 10.7 | 10.7 |
| `brand-solid` / `text-default` | 20.8 | 15.3 | 16.9 | 11.3 | 11.3 |
| `deliver-solid` / `brand-bright` | 26.6 | 12.8 | 15.6 | 34.3 | 12.8 |
| `deliver-solid` / `text-muted` | 22.8 | 16.6 | 18.6 | 30.6 | 16.6 |
| `profit-solid` / `text-muted` | 36.5 | 25.0 | 16.7 | 41.9 | 16.7 |
| `brand-solid` / `text-muted` | 25.6 | 20.2 | 21.2 | 17.8 | 17.8 |
| **`win-solid` / `profit-solid`** | 45.6 | **18.9** | 24.5 | 57.7 | **18.9** |
| `win-solid` / `risk-solid` | 27.5 | 23.4 | 21.0 | 19.0 | 19.0 |
| **`profit-solid` / `deliver-solid`** | 40.6 | 39.1 | 33.8 | **19.0** | **19.0** |
| `deliver-solid` / `text-default` | 24.0 | 19.4 | 19.7 | 34.9 | 19.4 |
| `brand-bright` / `text-muted` | 29.3 | 23.8 | 24.5 | 20.2 | 20.2 |
| `profit-solid` / `risk-solid` | 59.8 | 28.3 | 23.3 | 60.3 | 23.3 |
| `brand-solid` / `brand-bright` | 23.9 | 25.1 | 25.4 | 23.9 | 23.9 |
| `risk-solid` / `text-default` | 29.0 | 26.0 | 31.8 | 28.3 | 26.0 |
| `win-solid` / `brand-solid` | 59.6 | 62.2 | 66.5 | 39.3 | 39.3 |
| `win-solid` / `deliver-solid` | 53.4 | 55.4 | 63.1 | 58.2 | 53.4 |

*(the remaining 11 pairs are all ≥ 26.0)*

**Worst case: 10.5 — `deliver-solid` against `brand-solid`, deuteranopia.** State it
plainly: **this is worse than the 13.4 the all-ink system achieved, and it is the price of
having a brand colour at all.** Three things make it the right price:

1. It is ~4.5× the just-noticeable difference (≈2.3), not below it. The 1.2 that started
   all this was *half* a JND.
2. It is paid by a 280×48 button with a word on it, a 32px wordmark and a 2px rule — never
   by a meter. Deliverability's own marks are 19.4 and 16.6 from the ink they sit on, and
   always carry a pictogram, a label and a number.
3. Of the two other pairs below 13.4, one is `text-default`/`text-muted` at 10.7 — two
   adjacent steps of one neutral ramp, which are *supposed* to be close — and the other is
   `brand-solid`/`text-default` at 11.3, both of which are ink-family and neither of which
   encodes a value.

**Non-colour encoding (1.4.1).** Colour never carries meaning alone:
1. **Fixed order** — Winability, Profitability, Deliverability, left to right, every
   meter, every card, every screen. Position is the primary identifier.
2. **A distinct pictogram per dimension** — target / coins / layers.
3. **The number**, always rendered, tabular, with a sign and an arrow on deltas.

## Valence is not a hue — and this part stands

Green belongs to Profitability and gold to Winability, and `FactorBars` renders a positive
delta chip **in the same row as the meter it is not about**. A green "+6" eight pixels from
a green Profitability bar would claim a relationship that does not exist. So:

- a **positive** is a fact — ink, with a tick
- a **negative** genuinely *is* a risk, and keeps the one alarm hue
- **amber stays deleted.** Red and amber measure ΔE 4.1 under deuteranopia
- assessment levels carry magnitude as bar length and a bold word, never as a colour

What changed is the **ground** under all of it, which is a surface and therefore free:

- `--color-good-tint` was a warm grey, so 37 of the game's 99 outcomes resolved onto a grey
  medallion while the 21 hard ones got a rose panel. The interface was more colourful about
  failing than about succeeding. It is now the brand wash.
- `--color-warn-tint` was the *same rose* as `--color-bad-tint`, so `mixed` — the modal
  outcome, 41 of 99 — was indistinguishable from `hard`. Caution now reads as a note on
  paper; only a real risk gets rose.

One consequence of moving the brand off ink is worth naming: the chapter stepper's
**"done" and "active" nodes were both `#1b1d26`**, because `--color-good` and
`--color-accent` resolved to the same ink. Done is now ink and active is purple, ΔE 39+.
That defect is fixed by the repoint rather than by a rule.

## How much of a screen should carry colour

A target taken from the brief rather than invented. Measuring the ten mockups in `Mockups/`
— the document `docs/DESIGN-LANGUAGE.md` calls "the brief" — for the fraction of pixels
that are both **flat** (a UI fill, not a photograph or a glyph edge) and **chromatic**
(CIELAB C\* > 8):

| | flat & C\* > 8 | flat & C\* > 24 | hue of the chroma |
|---|---|---|---|
| the ten mockups | **2.27%** | 1.53% | 92.6% in the 240–330° purple/blue band |
| the shipped build | **0.39%** | 0.25% | scattered; most of it was the *ink* |
| title screen, shipped | **0.00%** | 0.00% | — |
| interludes, shipped | **0.00%** | 0.00% | — |

So the build carried about a sixth of the brief's chromatic surface, and on the two screens
whose only job is atmosphere it carried none.

**The rule: a chromatic surface, not chromatic text.** A 13px coloured label is almost all
antialiased edge; it costs the reader effort and buys almost no colour. A tinted panel is
read in peripheral vision and costs nothing. The measurement separates the two on purpose,
and `edge & C* > 8` — chromatic *type* — is a number to keep *low*.

**Targets:** ≥ 2.0% flat chromatic surface on a console screen; ≥ 1.0% at C\* > 24 for the
saturated moments; a majority of it inside the brand band.

### What this palette actually measures

Driven in a real browser at 1440×900, same instrument as the baseline above:

| screen | before | after | at C\* > 24 | brand band |
|---|---|---|---|---|
| title | 0.00% | **71.26%** | 0.41% | 100% |
| interlude | 0.00% | 3.79% | 1.04% | 100% |
| setup | 0.49% | 9.13% | 0.10% | 100% |
| brief | 0.49–1.50% | 5.63–9.22% | ~1.1% | 46–98% |
| decide | 0.11–2.28% | 4.78–6.45% | 0.24–1.74% | 97–98% |
| decide, selected | 0.11–2.28% | 12.95–15.23% | 1.58–3.35% | 99% |
| consequence | 0.49–0.97% | 14.25–15.08% | 1.08–1.21% | 99% |
| ending | 0.51% | 4.30% | 1.45% | 92% |
| **mean** | **0.39%** | **13.28%** | **1.22%** | **92.5%** |

**Read that honestly rather than as a win.** Two surfaces dominate the headline and neither
is a *mark*:

1. The **12px page mat** around the console is 4.3% of a 1440×900 screen on its own. It is
   most of every unselected console screen's figure.
2. Whichever **one large tint panel** is on screen — the selected option card, or the
   consequence's advisor panel — is another 9–10%.

Strip those and the mark-level chroma is around 1%, which is *below* the brief's 2.27%, not
above it. The cleanest single number is the **C\* > 24 column: 1.22% against the brief's
1.53%** — the saturated moments are still slightly under budget, which is the right side to
err on. And the title screen's 71% is one token: it is ground, not marks.

Chromatic *text* went the right way too. The mockups spend **9.63%** of their pixels on
chromatic edges; this palette spends **5.66%** (up from 3.49%, because eyebrows, chapter
labels and section icons moved from ink to purple — all at ≥10.6:1). More chromatic
surface and less chromatic text than the brief is the shape we wanted.

### Concentration is the better metric

Budget is the wrong question. Measured across real product UIs, the *share of saturated
pixels sitting in the single largest contiguous region* separates products that read as
designed from products that read as documents far more cleanly than total coverage does:
Things 3 82.4%, Figma 92.7%, Monzo 92.8%, Superhuman 92.7% — against `docs.stripe.com` at
6.8% spread over 16 blobs and the Radix docs at 5.0% over 18. **Same chroma budget,
opposite read.** Duolingo above the fold is the purest case: 92.26% of pixels pure white,
one hue at 1.98%, every other mark under 0.2%.

So, for pixels above OKLCh C 0.12, the largest region's share:

| screen | C > 0.12 | regions | top-1 share | top-3 |
|---|---|---|---|---|
| title | 0.63% | 14 | **77.1%** | 78.5% |
| interlude | 1.26% | **4** | **76.7%** | 92.0% |
| brief | 1.84% | 11 | 52.7% | 61.3% |
| ending | 1.86% | 10 | 52.4% | 73.3% |
| consequence | 2.19% | 15 | 44.9% | 55.5% |
| decide, selected | 2.62% | 26 | 37.4% | 65.5% |
| **decide (photographs)** | 0.74% | **23** | **8.2%** | 23.5% |
| the ten mockups | 0.9–3.4% | 57–111 | 9.6–51.1% | 22.6–68.6% |

Two findings fall out of this.

**The palette concentrates better than the brief does.** The mockups scatter chroma across
57–111 regions — that is what "icons are polychrome" costs — and their top-1 share has a
median around 35%. The screens here run 37–77%.

**The one bad row is the one with photographs on it.** Screens with no photography
concentrate at 76–77% in 4–14 regions; screens with photographic option cards collapse to
8–52% across 23–26. A turbine sky is scattered high-chroma area that means nothing, and it
swamps the marks that do. That is a measured argument for `src/ui/facsimile.tsx`: drawing
the option-card imagery from these tokens removes the scatter and leaves only deliberate
marks. **Concentration, not coverage, is the number to watch when that lands.**

### What the rest of the industry actually does

Corroboration gathered after the decisions above, not before — it changed none of them, but
two items sharpen the reasoning and one contradicts a choice we made anyway.

- **IBM Carbon leaves its own brand colour out of the data sequence.** The categorical
  palette runs Purple70 `#6929c4`, Cyan50 `#1192e8`, Teal70 `#005d5d`, Magenta70 `#9f1853`
  … and IBM's brand blue (Blue 60 `#0f62fe`) is **absent**; position 8 uses Blue 80
  `#002d9c` instead. Status colours are a separate list again. This is the closest thing to
  a documented "brand hue is not a data hue" rule that exists, and it is the same move as
  ours — including the detail that where the brand's hue family *is* needed for data, it
  appears at a different lightness step.
- **And Carbon's CVD safeguard is lightness, not hue.** Consecutive entries in its sequence
  differ by a median ~20 percentage points of OKLCh L. Its own Purple70 vs Cyan50 measures
  ΔE 23.9 normal and **7.1 under deuteranopia**; what keeps the sequence readable is the
  lightness stagger. That is independent confirmation of the lightness-valley result above,
  arrived at from a completely different direction.
- **Radix tells you to tint the neutral toward the accent**: "choose the gray scale which is
  saturated with the hue closest to your accent hue." Our ink at h 318° against a brand at
  h 304° is exactly that, and Radix's own `mauve` family sits at OKLCh C 0.002–0.019 over
  h 298–318. Our ink runs C 0.024–0.030 — slightly *above* Radix mauve, below Tailwind's
  `slate` (up to 0.046). Within the mainstream envelope, at the confident end of it.
- **A chromatic surface runs at roughly a sixth of the solid's chroma.** Across all 25
  Radix accent scales in light mode, step 3 ("UI element background") has a median **16%**
  of step 9's chroma, step 4 26%, step 5 36%. Ours: `brand-tint` C\* 18.6 against
  `brand-bright` C\* 121.5 = **15%**. `surface-selected` = 10%. We landed on the Radix
  ratio without aiming at it.
- **Chromatic shadows are normal.** Stripe's base shadow is `rgb(64 68 82 / 8%)` — `#404452`
  is C 0.024 at h 273, near its own brand hue. Ours is cast from the purple-tinted ink for
  the same reason.
- **Notion is the purest tint-the-fill-never-the-type system**: collection backgrounds
  `#FFE2DD`, `#FDECC8`, `#D1E5F9` and one declared literally as the full-chroma hue at 4%
  alpha (`#2383e20a`), while every text token is pure black at varying alpha — C exactly
  0.000. Linear ships the same idea as a named token, `--color-accent-tint #F1F1FF`
  (C 0.019) against `--color-accent #7170FF` (C 0.207).
- **Accent discipline is widely documented.** Radix Themes permits exactly one accent
  ("the most dominant color in your theme… primary buttons, links and other interactive
  elements"), auto-paired with a complementary grey. Refactoring UI: "Most sites need one,
  maybe two colors that are used for primary actions… The darkest shade of a color is
  usually reserved for text, while the lightest shade might be used to tint the background
  of an element."
- **The 60-30-10 rule has no empirical basis** that anyone publishes — no origin, no study,
  and read as pixel coverage it is about an order of magnitude too high: real product UIs
  measure 0–4% of pixels above OKLCh C 0.05 and 0–1.6% above C 0.10. It is not used here.
- **What contradicts us, honestly:** Linear's light-mode greys are C exactly 0.000 (it tints
  only in dark mode), and Vercel's Geist grey ramp is deliberately zero-chroma throughout.
  A tinted light-mode neutral is a choice, not a consensus. We took it because the brand is
  strong and the paper is already warm, so a neutral ink would have been the only
  temperature-free thing on screen.

One cautionary data point worth keeping in view: Duolingo's white label on `#58CC02`
measures **2.09:1**, which fails AA even at the large-text 3:1 threshold. A single
saturated moment is not a licence to stop measuring it.

And one deliberate exception: **the page is the brand's ground.** On a console screen
`--color-surface-page` shows only as the 12px mat around the shell and contributes almost
nothing. On the title screen, which renders outside the console directly on the body, it is
the whole field — so the game opens on its own colour instead of on off-white. That single
token is why the title screen's figure is dominated by ground rather than by marks, and the
C\* > 24 column is the honest way to read it.

The body carries two soft radial washes over that ground — brand lavender from the
top-left, paper warmth from the bottom-right — so the title screen has a light source
rather than a flat field. The lavender is capped at **0.30 alpha and not a point higher**,
and the number is not a taste judgement: composited over the page it lands on `#e6d8ff`,
where `text-subtle` measures **4.53:1**. At 0.42 it is 4.21 and the title screen has an
illegal ground.

## Depth is temperature — and now also elevation

Four grounds, three temperatures, forward is lighter and cooler:

| surface | hex | vs white | what it is |
|---|---|---|---|
| page | `#f3e9ff` | 1.17 | the brand's mat, behind everything |
| desk | `#fdfaf3` | 1.04 | the work area — paper |
| hover | `#f7eee0` | 1.15 | a surface sinking under the pointer |
| panel | `#e7d9c2` | **1.39** | supporting regions — paper, deeper |
| card | `#ffffff` | 1.00 | the thing you are deciding |

**The old ramp could not express elevation at all, and that is the diagnosis behind "very
pale".** Desk, hover and panel measured 1.04, 1.13 and 1.29 against white: three reading
surfaces inside 1.3:1 of each other, which is to say one surface wearing three names. A
card could not read as raised because there was nothing for it to be raised above, so the
only thing distinguishing a region from a card was a 1.55:1 hairline — and a screen whose
entire structure is carried by hairlines reads as a printed form. Paleness was not a
saturation problem first; it was a *flatness* problem.

So the panel goes to 1.39:1 against the card, chroma roughly doubles at every step of the
ramp, and the ink deepens a step to pay for it. 1.39 is not a taste judgement either: it is
the floor imposed by `win-text` at 5.06:1 on the panel, with the next step down landing at
4.9 and the one after that illegal.

Shadows are cast by the ink, which carries the brand's hue, so the shadow under a white
card is a purple shadow. There are now three of them, as `.elev-1/2/3`, stacked two or
three deep: past three shadows the difference is imperceptible and the paint cost is not.
`.elev-3` is for a thing genuinely above the page — a reward card, a modal — and `.elev-1`
is a resting card. On the stage a shadow cannot darken anything, so `.elev-stage` is a
brand-hued bloom *under* the surface plus the hairline on top of it, which is why
`--color-stage-line` has to clear 3:1 rather than merely exist.

Note the deliberate asymmetry: page and selected surfaces are **chromatic**; desk, panel,
hover and track are **tinted neutrals**. A tinted neutral is not a chromatic surface and
must not be counted as one — the desk is 43% of a decision screen's pixels and tipping it
fully chromatic would make the metric meaningless and the reading surface tiring.

**The brand wash means "you chose this" and nothing else.** `surface-hover` was briefly
lavender too, and at C\* 9.1 against a selected fill of C\* 12.3 it made an unchosen card
under the pointer look chosen — the same defect as the `.choice` specificity bug, arrived at
from the other direction. Hover is now paper (C\* 4.3): it sinks rather than tinting.

## The document facsimiles

`src/ui/facsimile.tsx` draws the option-card imagery from these tokens, so a palette change
recolours the artwork — which the photographs it replaced could never do. Its ground is
`--color-surface-desk` and its accents are one dimension hue each. Verified against this
palette at 318×96, with the previous palette's figures for comparison:

| element | was | now |
|---|---|---|
| panel node fill vs desk ground | 1.14 | 1.17 |
| `border-subtle` hairline vs ground | 1.51 | 1.54 |
| ink sponsor node vs ground | 16.10 | 16.47 |
| ruled body lines (subtle @ 0.55) vs ground | 2.32 | 2.33 |

No regression: every element is equal or marginally better, and the hue accents are
untouched. Two things about that file are worth knowing rather than fixing here:

- The plain `org` child nodes are the faintest objects in the set, at 1.17:1 fill and
  1.54:1 hairline. That is inherent in `surface-panel` on `surface-desk` and is not
  something the palette can fix; `border-control` would make them 4.44:1.
- The `org` blocker's white name bar sits on `--color-win-solid` at **3.63:1**. It is a
  `rect`, not type, so 1.4.11's 3:1 applies and it passes — but it is the only white mark
  on a dimension solid in the codebase, and the system's rule is phrased as a ban.

## Token layers

Three layers, in `src/index.css`. Components may only name layer 2.

- **L1 `--ref-*`** — raw ramps. `paper` 0–8 (warm, h 85°), `ink` 9–12 (purple-cast,
  h 318°), `purple` 1–12 (the brand deck), and four data hues where `-6` is a tint, `-7` a
  hairline, `-9` a solid fill and `-11` text. Never referenced from a component.
- **L2 `--color-surface-* / -text-* / -border-* / -brand-* / -risk-* / -win-* / -profit-* / -deliver-*`**
  — what a thing *is*. This is the vocabulary.
- **Migration aliases** — the old `--color-ink`, `--color-accent`, `--color-good` names,
  repointed at L2.

The aliases are not just historical convenience. **`--color-accent` is named by 37 sites,
and repointing that one line moves the wordmark, the stepper, the primary action, the
option medallions, the rail, every section icon and the selection — with no component
edit.** That is the whole purpose of the layer, and it is the only reason a palette this
different could be a single-file diff.

## Type

Nine integer steps, three weights. The previous build had 27 sizes including 9px, 10.5px
and a run of half-pixels — which is not a hierarchy, it is the residue of shaving pixels
to satisfy the fits-one-screen gate.

The top two steps are new and they are **display numerals only**. A 56px ceiling is a
report's ceiling: a score, a streak or a chapter number set at 32px is read as a table cell
and the same figure at 96px is read as a scoreboard, and nothing else on the screen has to
change for that to happen. It is the cheapest available signal that this is a game, which
is exactly why it is worth two scale steps. There is no step between 56 and 72 for prose,
and there never will be — `--text-hero` and `--text-mega` take `.numeral` (tabular, lining,
tight) or they are being misused.

| px | weight | line-height | tracking | measure | for |
|---|---|---|---|---|---|
| 12 | 700 | 16 | +0.07em | ≤24ch | eyebrows, labels, chips. **Max 3 words** |
| 13 | 400/500 | 18–20 | 0 | ≤46ch | card body, rail items, meta |
| 15 | 400/700 | 24 | 0 | **≤66ch** | the situation — the one thing they must read |
| 18 | 700 | 24 | −0.011em | ≤34ch | card title, panel heading |
| 24 | 700 | 30 | −0.018em | ≤28ch | the question, metric values |
| 32 | 700 | 38 | −0.022em | ≤24ch | chapter and brief titles |
| 56 | 700 | 56 | −0.032em | — | title screen only |
| 72 | 700 | 0.92 | −0.022em | — | **numerals only** — score, streak, progress |
| 96 | 700 | 0.92 | −0.022em | — | **numerals only** — the one figure a screen is about |

Tracking is a token — `--tracking-display`, `--tracking-tight`, `--tracking-label` —
because nobody hand-rolls it correctly. The optical rule runs both ways: tracking tightens
as size rises, and an all-caps label set without extra tracking looks cramped at 12px.

Why not a constant ratio: 1.25 from 12px gives 15 / 18.75 / 23.4 / 29.3 — non-integers,
which is exactly how half-pixels get born. The step widens as it climbs (≈1.08 between UI
steps, 1.33 at display), integer-snapped, which is what Carbon does.

66ch for body sits mid-range of Bringhurst's 45–75; Baymard found descriptions wider than
80ch were skipped 41% more often. Tracking goes negative only above 18px, where Inter's
default fit is too loose. `.eyebrow` is the only tracked-out style: all-caps costs 10–20%
reading speed (Tinker 1955) because word shape is lost, so it is confined to three words
or fewer, where the label is recognised as a glyph rather than read. It is now brand purple
rather than grey (12.56:1 on the page), which is what gives the title screen and the
interludes — which have no meters and no cards — a mark in the brand's own colour.

The brand's own type is Graphik-Semibold / Graphik Regular (`fontScheme` in the same
theme file). We ship Inter, because Graphik is licensed and the bundle is budgeted tightly (D-070).
Worth revisiting if a licence exists.

## Hierarchy rules — enforceable

1. **Max four sizes per screen**, drawn from the seven. Five is a bug.
2. **Weight before size.** To promote something, go 400 → 700 at the same size first.
3. **Colour may only carry hierarchy downward**: strong → default → muted → subtle. A
   *data* hue may never make something more important, because a data hue means identity.
   The brand hue may, because it means nothing else.
4. **One 700-weight element per panel.** Two bold things in a box is zero bold things.
5. **Space is a level.** Prefer an 8px gap change over a 2px size change.
6. **One saturated moment per screen.** Exactly one object may carry a C\* > 60 fill: the
   primary action, or the selected card, or the outcome medallion. Not two.
7. **Banned:** any px not in the scale · any fractional px · anything under 12px ·
   uppercase runs over three words · `letter-spacing` above 0.08em · `opacity` to lighten
   text · white *text* on `win-solid` or `profit-solid` · `border-subtle` on anything
   operable · `brand-bright` on text · a data hue on text other than the four `*-text`
   tokens.

→ Checked by `src/engine/tokens.test.ts`, which sweeps `src/ui/**` for off-scale sizes,
sub-12px type, opacity-on-text, raw hex values, bare dimension aliases, self-referential
properties and duplicate declarations.

**That test has one assertion that is now wrong in principle**, and it is left alone here
because this revision does not own the file: it asserts `css` does not match
`/--ref-violet/`. A name-based ban is not the property anyone cares about — the property is
*hue distance from a dimension*, and a purple named `--ref-purple` passes the regex while a
safe colour named `--ref-violet` would fail it. The replacement it should carry:

```ts
/** No reference hue may sit on a dimension's hue axis — the D-034 defect, twice over. */
it("keeps every non-data hue off the data hue axes", () => {
  const h = (hex: string) => /* OkLCh hue of hex */ 0;
  const data = ["--ref-gold-9", "--ref-green-9", "--ref-blue-9"].map(readTokenHue);
  for (const token of ["--ref-purple-6", "--ref-purple-11", "--ref-ink-11", "--ref-ink-12"]) {
    for (const d of data) expect(hueDistance(readTokenHue(token), d)).toBeGreaterThan(25);
  }
});
```

## Two registers: paper and stage

The game is two things at once, so the palette is two registers.

**The light register is the work.** Seventeen mission screens, the dialogues, the
consequences, the debrief. It stays on warm paper, because that is where every number in
the table above was measured and because the work of a client engagement is read, not
watched.

**The dark register is the game.** The hub, the journey map, the cut scenes and the reward
moments render on `--color-stage`: the brand's own hue taken to OkLCh L 0.18 rather than a
neutral black, so a violet glow on it reads as the brand's light and not as a sticker.

This is **not dark mode.** Dark mode is a token swap over the same screens, and that is
still deferred for the reason it always was: lightening the three dimension hues for a dark
ground collapses their separation to **ΔE 3.5** (tritan win/risk) against 18.9 in light,
because the lightness spread that makes the triad safe is unavailable when everything must
sit *above* the background. The stage sidesteps that entirely by carrying **no dimension
hues at all**. Nothing on the stage encodes a value the player reads off a colour.

### Measured — every ink on both stage grounds

| token | hex | on `stage` | on `stage-raised` | floor | job |
|---|---|---|---|---|---|
| `stage` | `#180927` | — | — | — | the ground. OkLCh 0.180 0.060 304 |
| `stage-raised` | `#28163a` | — | — | — | the elevated plane. OkLCh 0.245 0.068 304 |
| `stage-ink` | `#f5f1fa` | **17.02** | **14.88** | 4.5 | primary type |
| `stage-ink-soft` | `#aa9ebc` | **7.52** | **6.58** | 4.5 | secondary type |
| `stage-line` | `#756887` | **3.69** | **3.23** | 3.0 | hairline |
| `glow` | `#a100ff` | **3.58** | **3.13** | 3.0 | **fills, borders, glow — never body text** |
| `glow-ink` | `#c77dff` | **7.05** | **6.17** | 4.5 | violet type on the stage |
| `energy` | `#00e5ff` | **12.33** | **10.78** | 4.5 | progress, live, in-play |
| `reward` | `#ffc53d` | **12.02** | **10.51** | 4.5 | earned, badge, achievement |

**The trap is `--color-glow`.** `#a100ff` is the mandated Accenture bright and it measures
3.58:1 on the stage: it passes 1.4.11 and **fails 1.4.3**. It is legal as a fill, a border,
a glow and a display numeral at 24px or above (18.66px if bold, where large-text AA is
3:1), and it is illegal as body text. `--color-glow-ink` exists so that "I need violet type
here" has a token as its answer rather than a guess. This is the single most likely way a
vivid rebuild fails an audit.

Only two stage surfaces ship, and that is deliberate: a third would have to be measured
against all eight of these, and at OkLCh L 0.30 the glow drops to 2.64 and stops being
legal even as a border.

### The two gamification accents, and where they may appear

Exactly two saturated accents, each with one fixed job, and **confined to earned /
progress / celebration surfaces**. An enterprise palette carries one accent; a game palette
carries five to seven, each semantic. What makes a reward feel earned is not the gold — it
is that the gold appears nowhere else. So neither of these is available as general chrome,
and neither may ever encode a dimension.

**Cyan, not lime, and the choice is arithmetic.** Lime lands in the yellow-green band
Okabe–Ito builds its whole set to avoid, and converges with Winability's gold under
deuteranopia. Cyan at CIELAB h 215° sits 69° off Deliverability (h 284°) and 46° off
Profitability (h 169°), with L\* 83.6 against their 33.9 and 54.0 — separated by hue *and*
by 30–50 points of lightness, so it cannot be misread as a dimension value. It is also
purple's split-complement, which is why it reads as voltage rather than as a second brand.

The reward gold **does** share Winability's hue family — h 83° against h 62° — and it is
the one adjacency this palette accepts. It is paid for by lightness (L\* 82.7 against 56.0)
and by containment: reward renders on the hub and the celebration surfaces, which have no
meters on them.

Both have a type-legal sibling, and each is legal on the ground its base colour is not:

| token | hex | on card | on panel | on its own fill |
|---|---|---|---|---|
| `energy-ink` | `#0a5462` | 8.55 | 6.78 | 5.56 |
| `reward-ink` | `#5c3d05` | 9.88 | 7.84 | 6.26 |

On the stage the vivid values already clear 10:1 and need no help, so the `-ink` variants
are for **paper** — a cyan progress label in the rail, a gold badge in the debrief — and
for type sitting *on* the vivid fill, which is the same value. A cyan pill and a gold badge
each have exactly one legal label colour and it is the one named after them.

### Focus on the stage, and the one place WCAG 2.2 fights the aesthetic

The deep purple focus ring is 1.4:1 on a violet-black ground, so any container marked
`data-stage` switches the ring to cyan at 12.33:1 and the halo to the stage colour.

WCAG 2.2 adds **2.4.11 Focus Appearance** at AA: the indicator needs a perimeter of at
least 2 CSS px and 3:1 between the focused and unfocused states. **A soft glow satisfies
1.4.11 and fails 2.4.11**, because a blurred halo has no perimeter to measure. So the ring
is a solid 2px line and any bloom goes *outside* it as decoration — that is what
`.glow-focus` is for, and it is never the indicator itself.

## The lip, and why every button has one

The cheapest single difference between a game button and an enterprise button is a solid
4px edge along the bottom in a darker shade of the button's own fill. The control stops
being a rectangle of colour and becomes a moulded key with a side to it. On press the lip
vanishes and the face travels down into it, plus a 5% darken — and the darken matters more
than the travel, because it is the half that survives a screenshot.

`.btn-game` ships it. Three notes on the implementation, each of which is a decision:

- The lip is **`box-shadow`, not `border-bottom`.** A border is in layout and would add 4px
  to forty buttons, which is how a fits-one-screen gate breaks. A shadow is outside layout,
  so the lip costs zero reflow. The cost is that a parent with `overflow: hidden` clips it;
  set the lip to transparent there rather than reaching for a border.
- Fill, lip and label are custom properties, so `.btn-game` alone is the primary action and
  `data-variant="reward"` or `"energy"` is a one-attribute change. White on
  `--color-brand-lip` is 16.67:1, so the label stays legal for the 120ms the button is held.
- On the stage, `data-variant="glow"` is the primary action: the deep brand purple is a
  2:1 edge against a violet-black ground, which is a button nobody can find. The bright
  shore fills it and the deep one lips it, so the object is still unmistakably the brand's.
- **Disabled is pale lavender, never grey.** Grey reads as broken, and the disabled primary
  action still has to look like the primary action: `brand-solid` on `brand-tint` is
  10.64:1. The opacity route is how the 1.6:1 button happened.

## Motion added with the stage

`.sweep` is one pass of light across an earned thing, at the moment it is earned. Finite
and 900ms: an infinite shimmer with no pause control is a 2.2.2 failure at Level A whether
or not it looks nice, which is why the previous `.shimmer` was deleted rather than
restyled. Under `prefers-reduced-motion` it is **replaced, not removed** — the travel
becomes a pulse of light in place, which WCAG 2.3.3's own Intent states is not motion
animation at all.

## Sources

The palette: `PPT Template.potx` → `ppt/theme/theme1.xml`, `clrScheme name="Accenture"`
(read directly, not transcribed). The mockups in `Mockups/`, measured.

Colour science: Machado, Oliveira & Fernandes 2009 (CVD simulation matrices) · CIEDE2000 ·
Okabe & Ito palette construction · APCA 0.1.9 (Myndex) · W3C Understanding 1.4.3 and 1.4.11
· Colour Blind Awareness prevalence figures · Baymard and UXPin on line length · Tinker
1955 on all-caps · Atlassian token anatomy · Carbon type sets.

Cross-industry comparison, with the caveat that the numbers attributed to shipped products
below were measured off their shipped CSS and screenshots rather than taken from their
documentation:

- IBM Carbon data-visualization colour palettes —
  <https://carbondesignsystem.com/data-visualization/color-palettes/> (brand blue absent
  from the categorical sequence; lightness stagger as the CVD safeguard)
- Radix Colors, understanding the 12-step scale —
  <https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale>
- Radix Colors, composing a palette (pair the grey to the accent hue) —
  <https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette>
- Radix Themes colour (one accent per theme) —
  <https://www.radix-ui.com/themes/docs/theme/color>
- Refactoring UI, building your colour palette —
  <https://www.refactoringui.com/previews/building-your-color-palette>
- Linear, how we redesigned the Linear UI ("limiting how much chrome… was used in the
  calculations applied to our color system") — <https://linear.app/now/how-we-redesigned-the-linear-ui>
- Material 2 dark theme (primary colour "limited to one or two branded elements") and
  Material 3's surface-tint opacity table · Apple HIG Dark Mode base/elevated surfaces —
  both read via secondary sources, as the primary pages are JavaScript-rendered
- Measured off shipped CSS: Tailwind v4 `theme.css` OKLCh grey ramps · Vercel Geist
  `--ds-gray-*` and `--ds-blue-*` · Linear `--color-bg-level-*` and `--color-accent-tint` ·
  Stripe `--…-hue-gray*` and `--…-shadow-base` · Notion collection backgrounds · Monzo
  `--calc-chart-*`

Not useful, recorded so the time is not spent twice: `aiuxplayground.com` (process
language, no numeric rules) · `21st.dev` (a component registry, deliberately
theme-agnostic) · `mobbin.com` and `refero.design` (login-walled).

The arithmetic in this document was computed from the hex values, not copied. The
implementation is checked against reference values before use: WCAG reproduces
`#767676` on white at 4.54:1, APCA reproduces black-on-white at Lc 106.0 and
`#888` on white at Lc 63.1, and ΔE2000 reproduces this project's own previously
documented `win`/`accent` figures of 5.9 and 1.2 exactly.
