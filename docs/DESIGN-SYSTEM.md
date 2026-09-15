# GPL design system

The colour and type system, with the arithmetic. Tokens live in `src/index.css`; this
document is why they are what they are.

Companion documents: `docs/DENSITY-FRAMEWORK.md` (how much may be on a screen),
`docs/DESIGN-LANGUAGE.md` (the layout language taken from the mockups).

---

## The governing idea

**Hue means identity. Magnitude means length, sign and number.**

The previous palette broke this. It encoded *which dimension* and *how good* in the same
channel — hue — and put the brand accent in the middle of that channel:

| pair | ΔE2000 normal | ΔE2000 deuteranopia |
|---|---|---|
| `win #5b4de8` vs `accent #7c3aed` | 5.9 | **1.2** |

1.2 is roughly half the just-noticeable difference. Winability and the brand were the
same colour to about 6% of men. That is not a taste problem.

So the brand recedes and the three dimensions own the chroma. Neutrals carry no hue,
the brand is ink, and the entire colour budget goes to three dimension hues plus one
alarm red. Surfaces moved from lavender-grey to **warm paper against cool ink** — which
also stops the console reading as a violet framework default.

**Exactly five hues may appear on screen:** ink, Winability, Profitability,
Deliverability, risk.

## Token layers

Three layers, in `src/index.css`. Components may only name layer 2.

- **L1 `--ref-*`** — raw ramps. `paper` 0–8 (warm neutral), `ink` 9–12 (cool), and four
  hue ramps where `-6` is a tint, `-7` a hairline, `-9` a solid fill and `-11` text.
  Never referenced from a component.
- **L2 `--color-surface-* / -text-* / -border-* / -brand-* / -risk-* / -win-* / -profit-* / -deliver-*`**
  — what a thing *is*. This is the vocabulary.
- **Migration aliases** — the old `--color-ink`, `--color-accent`, `--color-good` names,
  repointed at L2. They exist so the repoint was one reviewable diff instead of several
  hundred className edits, and they should empty out over time.

## Contrast, measured

Every text token clears **4.5:1 (WCAG 2.2 AA, 1.4.3) on every surface**. There is no
"faint" tier: the old `--color-faint #948fa6` measured **2.78:1 on panel** and was a live
failure on every screen in the game.

| token | on card | on desk | on page | on panel | on selected |
|---|---|---|---|---|---|
| `text-strong #1b1d26` | 16.80 | 16.10 | 15.16 | 14.14 | 13.02 |
| `text-default #33374a` | 11.76 | 11.27 | 10.61 | 9.90 | 9.11 |
| `text-muted #54586b` | 7.03 | 6.74 | 6.35 | 5.92 | 5.45 |
| `text-subtle #5e6273` | 6.05 | 5.80 | 5.46 | 5.09 | 4.69 |

Non-text, which needs ≥3:1 under 1.4.11:

| token | vs card | vs panel | verdict |
|---|---|---|---|
| `border-control #7b7565` | 4.59 | 3.86 | passes everywhere — use on anything operable |
| `border-subtle #d4cdc1` | 1.58 | 1.33 | **decorative only**, never on a control |

Four failures that shipped and are now fixed:

| what | was | now |
|---|---|---|
| disabled primary button | **1.60:1** | 5.01:1 |
| `.eyebrow` colour | 2.78:1 | 7.03:1 |
| focus ring `#c9b2ff` | **1.86:1** | 16.80:1 (ink + white halo) |
| `--color-line-strong` on controls | 1.52:1 | 4.59:1 |

Also removed: `opacity: 0.45` on `.choice:disabled` and `opacity: 0.38` on a dimmed card.
Opacity silently destroys every measured ratio inside the element, so both are now token
changes instead.

## The three dimensions

| dimension | solid | text | tint | L* |
|---|---|---|---|---|
| **Winability** | `#cd6d0a` | `#8a4708` | `#fbebdc` | 56 |
| **Profitability** | `#339075` | `#0f6249` | `#dcf0e9` | 54 |
| **Deliverability** | `#054e9e` | `#0a4c90` | `#dfe8f6` | 34 |

This is the Okabe–Ito construction — orange / bluish-green / blue — which avoids the
yellow-green band where colour-vision confusion is worst, and carries a deliberate
**lightness split (56 / 54 / 34)** so the pair that converges under deuteranopia stays
separated by brightness instead of hue.

Pairwise ΔE2000 across normal, protan, deutan and tritan vision (Machado 2009 matrices,
severity 1.0):

| | win/profit | win/deliver | profit/deliver | vs risk | vs brand |
|---|---|---|---|---|---|
| normal | 45.7 | 53.4 | 40.6 | 27.5 | 25.2 |
| protanopia | **18.9** | 55.4 | 39.1 | 23.4 | 25.4 |
| deuteranopia | 24.5 | 63.1 | 33.8 | 21.0 | 24.0 |
| tritanopia | 57.7 | 58.2 | **19.0** | 19.0 | 24.3 |

Worst case **18.9** — about 8× the just-noticeable difference — against **1.2** before.

**Never put white text on `win-solid` or `profit-solid`.** They measure 3.63:1 and 3.90:1
on white: enough for a fill under 1.4.11, not enough for type under 1.4.3. Coloured chips
are a `tint` fill with ink text.

**Non-colour encoding (1.4.1).** Colour never carries meaning alone:
1. **Fixed order** — Winability, Profitability, Deliverability, left to right, every
   meter, every card, every screen. Position is the primary identifier.
2. **A distinct pictogram per dimension** — target / coins / layers.
3. **The number**, always rendered, tabular, with a sign and an arrow on deltas.

## Valence is not a hue

Green belongs to Profitability and gold to Winability. A green tick beside a green meter
on the same screen would claim a relationship that does not exist. So:

- a **positive** is just a fact — ink, with a tick
- a **negative** genuinely *is* a risk — it gets the one alarm hue
- **amber is deleted.** Red and amber measure ΔE 4.1 under deuteranopia, which is not a
  distinction. Caution reads as risk.
- assessment levels carry magnitude as **bar length and a bold word**, not as a colour

## Type

Seven integer steps, three weights. The previous build had 27 sizes including 9px, 10.5px
and a run of half-pixels — which is not a hierarchy, it is the residue of shaving pixels
to satisfy the fits-one-screen gate.

| px | weight | line-height | tracking | measure | for |
|---|---|---|---|---|---|
| 12 | 700 | 16 | +0.07em | ≤24ch | eyebrows, labels, chips. **Max 3 words** |
| 13 | 400/500 | 18–20 | 0 | ≤46ch | card body, rail items, meta |
| 15 | 400/700 | 24 | 0 | **≤66ch** | the situation — the one thing they must read |
| 18 | 700 | 24 | −0.011em | ≤34ch | card title, panel heading |
| 24 | 700 | 30 | −0.018em | ≤28ch | the question, metric values |
| 32 | 700 | 38 | −0.022em | ≤24ch | chapter and brief titles |
| 56 | 700 | 56 | −0.032em | — | title screen only |

Why not a constant ratio: 1.25 from 12px gives 15 / 18.75 / 23.4 / 29.3 — non-integers,
which is exactly how half-pixels get born. The step widens as it climbs (≈1.08 between UI
steps, 1.33 at display), integer-snapped, which is what Carbon does.

66ch for body sits mid-range of Bringhurst's 45–75; Baymard found descriptions wider than
80ch were skipped 41% more often. Tracking goes negative only above 18px, where Inter's
default fit is too loose. `label` is the only tracked-out style: all-caps costs 10–20%
reading speed (Tinker 1955) because word shape is lost, so it is confined to three words
or fewer, where the label is recognised as a glyph rather than read.

## Hierarchy rules — enforceable

1. **Max four sizes per screen**, drawn from the seven. Five is a bug.
2. **Weight before size.** To promote something, go 400 → 700 at the same size first.
3. **Colour may only carry hierarchy downward**: strong → default → muted → subtle. A hue
   may never make something *more* important, because hue means identity.
4. **One 700-weight element per panel.** Two bold things in a box is zero bold things.
5. **Space is a level.** Prefer an 8px gap change over a 2px size change.
6. **Banned:** any px not in the scale · any fractional px · anything under 12px ·
   uppercase runs over three words · `letter-spacing` above 0.08em · `opacity` to lighten
   text · white text on `win-solid` or `profit-solid` · `border-subtle` on anything
   operable · a hue on text other than the four `*-text` tokens.

→ Checked by `src/engine/tokens.test.ts`, which sweeps `src/ui/**` for off-scale sizes,
sub-12px type, opacity-on-text and raw hex values.

## Dark mode: deliberately not yet

Lightening the three hues for a dark ground collapses their separation to **ΔE 3.5**
(tritan win/risk) against 18.9 in light mode, because the lightness spread that makes the
triad safe is unavailable when everything must sit *above* the background. Dark mode here
is not a token swap — it needs a second, independently optimised triad and a re-derived
`border-control`. Deferred rather than done badly.

## Sources

Radix Colors scale semantics · Atlassian token anatomy · Carbon type sets ·
W3C Understanding 1.4.11 · APCA introduction (why WCAG 2 misjudges saturated mid-tones) ·
Okabe & Ito palette construction · Colour Blind Awareness prevalence figures ·
Baymard and UXPin on line length · Tinker 1955 on all-caps · Google Fonts `opsz`.
Full URLs are in `docs/DECISIONS.md` D-034.
