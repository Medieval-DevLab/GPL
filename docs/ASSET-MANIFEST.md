# GPL — asset manifest

**For whoever generates the artwork, and for whoever wires it in.** Every kind of picture
the game now needs, with a complete copy-paste prompt, exact dimensions, the screen it
lands on, and the region of the frame it must leave alone.

Supersedes `docs/ART-BRIEF.md` for everything except its §1 style string and its §3 locked
character attributes, which are reused here verbatim and re-pointed at the live palette.
`ART-BRIEF.md`'s sprites, three-expression sets and nine painted rooms are dead.

Derived from `docs/SCREEN-TAXONOMY.md` (the five modes and the fourteen screen types),
`docs/GAME-SEQUENCE.md` (the run, chapter by chapter), `src/index.css` (the live palette,
quoted here at its real values) and `public/art/` (what already exists).

Where a figure is my inference rather than measured from the repo or sourced, it is
marked **[inference]**.

| | |
|---|---|
| §0 | The ordering rule — read this first |
| §1 | The two style strings, the live palette, the shared negative |
| §2 | The manifest at a glance: 27 files, in three tiers |
| §3 | Cut-scene plates — 8 |
| §4 | Navigate and debrief backdrops — 4 |
| §5 | Portraits — 3 (and the four that are already wrong) |
| §6 | Optional: stage figures — 7, paper tile — 1 |
| §7 | **Video** — the client's "think of any videos also" |
| §8 | Generation order, cheapest-risk first |
| §9 | Placeholder guidance |
| §10 | Preconditions in code, and four defects found while writing this |

---

## §0 · The ordering rule

**Generate ONE anchor image. Approve it. Then never describe the style again — attach the
anchor as a reference image and describe only what changes.**

This is the first thing in this document because it is the only thing that decides whether
27 images look like one production or like 27 images.

Across five compared consistency methods, **a detailed prompt with a fixed seed holds a
character or a style about 60% of the time and breaks the moment you change any word**,
while **attaching a reference image and describing only the delta holds ~80–85% across 20+
generations**. Every prompt below is therefore written as a *supplement to a reference*,
never as a substitute for one. A prompt in this document that is run without the anchor
attached will produce something plausible and wrong.

### The two anchors

**Anchor 1 — `cut-ch1-city.webp` (§3.1). The style contract for all twelve dark plates.**

It is the anchor rather than one of the navigate backdrops for a specific reason: the
navigate backdrops are deliberately featureless, and **you cannot hold a style off an
anchor that has no detail in it.** There is no linework to match, no material, no falloff.
The chapter-one plate has architecture, one hard light source, a violet bloom, grain, and
the calm-left composition every other plate repeats — so it carries the whole vocabulary
in one frame. It is also the first plate a player sees after the title, so it deserves the
iteration budget.

**Anchor 2 — the Sarah Lim portrait sheet (§5.1). The contract for the other six people.**

Generate a sheet first: front, three-quarter and side, on one image, with the anchor
attached as a style reference. The sheet is not shipped. It exists so that
`portrait-sarah.webp` and `figure-sarah.webp` are provably the same person, and so that
Marcus and Foyle are lit and graded like her.

### What actually makes a set look like one production

Almost never the faces.

1. **One style string, reused verbatim.** §1. Do not paraphrase it between runs, and do
   not "improve" it on image nineteen.
2. **Identical key-light side on every asset.** Hard key from the left, every time, plates
   and people alike. Mismatched light direction is what reads instantly as two different
   productions the moment a figure stands on a plate.
3. **One post-process pass over the whole set at the end** — same levels, same grade, same
   grain amplitude. That rescues a mismatched set faster than re-rolling individual
   images, and it is the cheapest step in this entire document.

---

## §1 · The style strings, the palette and the shared negative

Three blocks. Paste them literally. Where an entry below says `<<STAGE BASE>>` or
`<<PAPER BASE>>`, substitute the whole block, byte-identical — that is the convention
`ART-BRIEF.md` already established and it is the reason the set holds together.

### 1.1 · STYLE STRING — `ART-BRIEF.md` §1, verbatim

```
Editorial illustration, hand-painted digital gouache with visible brush texture and
soft grain. Confident tapered linework, no outlines on skin. Restrained warm-paper
palette with a single deep-violet accent. One hard key light with visible falloff and
long soft shadows. Muted, slightly desaturated, film-still grade. Grounded and adult —
no cartoon proportions, no flat vector shapes, no corporate-Memphis illustration, no
gradients-as-decoration, no lens flare, no text, no logos, no watermark.
```

Two things that string is deliberately doing, and both still hold:

- **"no corporate-Memphis illustration"** is the trap for a consulting game. Flat
  rounded-limb business illustration is the house style of every SaaS landing page and the
  visual cousin of the PowerPoint feel this product exists to escape.
- **"one hard key light"** is what makes a meeting room interesting. Restrict the palette,
  light it harshly, and the one saturated thing on screen carries all the meaning.

### 1.2 · The live palette — from `src/index.css`, not from `ART-BRIEF.md`

`ART-BRIEF.md` §1's palette table is **stale**. The paper ramp was enriched (its three
reading surfaces used to sit within 1.3:1 of each other, which cannot express elevation at
all) and the ink ramp was deepened and moved to OkLCh h 318°. Use these values.

**Paper register** — the seventeen mission screens, the reflection nodes, the portraits.

| Role | Hex | Token |
|---|---|---|
| White | `#ffffff` | `--ref-paper-0` / `--color-surface-card` |
| Paper 1 | `#fdfaf3` | `--ref-paper-1` / `--color-surface-desk` |
| Paper 2 | `#f7eee0` | `--ref-paper-2` |
| Paper 3 | `#e7d9c2` | `--ref-paper-3` / `--color-surface-panel` |
| Paper 4 | `#ded1b9` | `--ref-paper-4` |
| Paper 5 | `#cbb894` | `--ref-paper-5` |
| Paper 6 | `#bfa87f` | `--ref-paper-6` |
| Paper 7 | `#6b6049` | `--ref-paper-7` |
| Paper 8 | `#574d3b` | `--ref-paper-8` |
| Ink 9 | `#5e5462` | `--ref-ink-9` |
| Ink 10 | `#514657` | `--ref-ink-10` |
| Ink 11 | `#3a2e3d` | `--ref-ink-11` |
| Ink 12 | `#1e1621` | `--ref-ink-12` — darkest shadow, hair, suit fabric |

**Stage register** — the dark cinematic ground. Cut scenes, hub, map, recognition,
chapter debrief.

| Role | Hex | Token |
|---|---|---|
| Stage ground | `#180927` | `--color-stage` (OkLCh 0.180 0.060 304) |
| Stage raised | `#28163a` | `--color-stage-raised` (OkLCh 0.245 0.068 304) |
| Stage hairline | `#756887` | `--color-stage-line` — needs 3:1, see §4 |
| Stage ink | `#f5f1fa` | `--color-stage-ink` |
| Stage ink soft | `#aa9ebc` | `--color-stage-ink-soft` |

**Brand violet** — steps 3, 4, 6 and 11 are the Accenture theme verbatim.

| Role | Hex | Token |
|---|---|---|
| Deep violet | `#460073` | `--color-brand-solid` — the accent, one object per scene |
| Brand deep | `#2f064f` | `--color-brand-deep` |
| Bright violet | `#a100ff` | `--color-glow` — a screen, a lit edge, almost never a large area |
| Mid violet | `#c2a3ff` | `--ref-purple-4` — shadow tint in violet-lit scenes |
| Pale violet | `#e6dcff` | `--ref-purple-3` — cool bounce light |

### 1.3 · The hue rule — and it is arithmetic, not taste

> **Artwork may use the brand violet, the ink ramp and the paper ramp, and nothing else.
> Every other hue in this system carries data.**

`index.css` is explicit that "hue means one of two things and they are never the same hue:
BRAND purple identifies the product and carries no data; the three DIMENSION hues carry
magnitude the player reads." The three dimensions are Winability `#cd6d0a` (orange),
Profitability `#339075` (green) and Deliverability `#054e9e` (blue). The two gamification
accents are energy cyan `#00e5ff` and reward gold `#ffc53d`, and the discipline that makes
a reward feel earned is that **its colour appears nowhere else**.

So a plate containing a warm-gold accent light is not a nice warm plate — it is the reward
colour appearing on a screen that has not rewarded anything. A plate containing a cyan rim
light is the progress colour appearing where there is no progress. This is the same
mistake `index.css` records making twice at the token layer, and it costs the same thing
both times.

`ART-BRIEF.md` §1 said "there is no blue and no teal anywhere in this game". That is now
narrower but stronger: cyan and gold **do** exist, on the stage, as accents that mean
something. The artwork must stay off all five non-brand hues.

### 1.4 · STAGE BASE — the block to paste for all twelve dark plates

**[inference]** — `ART-BRIEF.md` §1 describes the paper register only. This clause
overrides its palette sentence for the dark plates and is mine, derived from the
`--color-stage` block in `index.css`.

```
Editorial illustration, hand-painted digital gouache with visible brush texture and
soft grain. Confident tapered linework, no outlines on skin. One hard key light with
visible falloff and long soft shadows. Muted, slightly desaturated, film-still grade.
Grounded and adult — no cartoon proportions, no flat vector shapes, no
corporate-Memphis illustration, no gradients-as-decoration, no lens flare, no text,
no logos, no watermark.

NIGHT REGISTER. The ground is violet-black #180927; the deepest shadows fall to
#0f0518; mid-tones sit at #28163a. The only light in the frame is deep violet #460073
rising to bright violet #a100ff at its hottest point, plus a bone-white #f5f1fa
specular on no more than two edges. Warm paper tones #cbb894 and #bfa87f appear only
as dust or haze inside the light, never as a surface. Low overall exposure: this is a
lit stage in a dark room, not a dim photograph. Hard key light from the LEFT.
```

### 1.5 · PAPER BASE — the block to paste for the seven people and the paper tile

```
Editorial illustration, hand-painted digital gouache with visible brush texture and
soft grain. Confident tapered linework, no outlines on skin. Restrained warm-paper
palette with a single deep-violet accent. One hard key light with visible falloff and
long soft shadows. Muted, slightly desaturated, film-still grade. Grounded and adult —
no cartoon proportions, no flat vector shapes, no corporate-Memphis illustration, no
gradients-as-decoration, no lens flare, no text, no logos, no watermark.

PALETTE. Surfaces and clothing are drawn from the paper ramp #fdfaf3 #f7eee0 #e7d9c2
#ded1b9 #cbb894 #bfa87f #6b6049 #574d3b. Shadows, hair and dark fabric are drawn from
the ink ramp #5e5462 #514657 #3a2e3d #1e1621. The one accent, where an entry calls for
it, is deep violet #460073. Hard key light from the LEFT.
```

### 1.6 · SHARED NEGATIVE — paste into every generation, every category

```
no text, no lettering, no numerals, no signage, no shop fascias, no nameplates,
no logos, no brand marks, no watermark, no signature;
no people, no faces, no hands, no human silhouettes, no figures reflected in glass;
no blue, no teal, no cyan, no green, no orange, no amber, no saturated gold;
no neon, no holograms, no sci-fi, no lens flare, no light rays, no bokeh light bubbles;
no charts, no graphs, no slide decks, no whiteboard diagrams, no screens with content on them;
no flat vector shapes, no corporate-Memphis illustration, no cartoon proportions,
no gradients-as-decoration;
no vignette baked into the image, no letterbox bars, no frame, no border, no drop shadow,
no matte, no mockup, no device frame.
```

"No people" is load-bearing on the twelve plates: the figure is composited on top in the
browser, and a painted person in the plate would stand behind the real one. "No signage"
is load-bearing because **the existing hero photographs have the word ORION baked into
them** — see §10.

---

## §2 · The manifest at a glance

**27 files, in three tiers.** Tier 1 is what the design docs require. Tier 2 fixes an
inconsistency that already exists and will get worse the moment Tier 1 ships. Tier 3 is
optional and I would still do it.

| Tier | Category | Files | § |
|---|---|---|---|
| **1** | Cut-scene plates | **8** | §3 |
| **1** | Navigate backdrops (hub, map, recognition) | **3** | §4 |
| **1** | Chapter-debrief backdrop | **1** | §4.4 |
| **1** | Client portraits — Sarah, Marcus, Foyle | **3** | §5 |
| | **Tier 1 total** | **15** | |
| **2** | Colleague portraits regenerated — Priya, Riya, Arjun, Aisha | **4** | §5.5 |
| | **Tier 1 + 2** | **19** | |
| **3** | Stage figures, all seven characters | **7** | §6.1 |
| **3** | Seamless paper grain tile | **1** | §6.2 |
| | **Total** | **27** | |

Weight, at the specified compressions: roughly **2.4 MB across 27 files**, none of it on
first paint. The title screen loads no artwork at all, and every plate is `loading="lazy"`.
For scale, the whole JavaScript and CSS bundle is about 173 kB gzipped (D-070 re-baselined
the budget per origin; it was quoted as 94 kB here) — the art budget is about
25× the code budget, which is normal for this kind of product and is fine precisely
because it is lazy and cached. It stops being fine the moment anything eager is added, and
§7 is largely about that.

### What I decided, and why

**8 cut scenes, not 5.** `GAME-SEQUENCE.md` §2 places five chapter openers plus three
story turns — the rival moves (chapter 2), the award lands (chapter 4), Sarah resigns
(chapter 5). All three are moments done *to* the player, which `SCREEN-TAXONOMY.md` §2a
gives as the definition of the type. 5 + 3 = 8, and that matches the taxonomy's own
"5 → **8**" row.

**4 navigate-register plates, not 3.** The brief named hub, journey map and "performance
dashboard". In the repo the third surface is the **recognition board** — six badge slots,
`RecognitionBoard` in `src/ui/reward.tsx`, reached from the hub's second door. I have
named it `stage-recognition.webp`. The fourth is the chapter debrief, which
`GAME-SEQUENCE.md` §4 puts on the dark stage as "a node graph, not prose"; it is specified
as a **variant** of the map plate rather than a fresh generation, because a time-of-day or
mood variant keeps the geometry identical and that is the whole point of a variant.

**The title screen gets nothing.** It is the one navigate-mode screen on the *paper*
register — `index.css` notes that the title renders outside the console so "the page IS
the screen", and `D-055`-era work in `screens.tsx` records a deliberate reversal towards
stillness there: "a staged entrance on the first screen is the single most recognisable
thing a generated UI does". An image behind it would undo that. **[inference]**, but a
well-supported one.

**No call-surface environment plates. This is a decline, and it is deliberate.** I checked
`src/ui/dialogue.tsx`: `CallTile` fills with `--color-panel` or `--color-canvas-deep` and
nothing else, and the file's own header argues the point — the call window is "our own
product's call window, not a visual novel and not Teams", and "a call with the cameras off
is a grid of initials in circles, and that device is already in the build". Painting a
room behind a call tile would make the camera-off state a lie, would reintroduce the
visual-novel genre transplant that was already rejected once, and would put decorative
detail on a **decide** screen, where `SCREEN-TAXONOMY.md` rule 1 says the only thing that
should be added is the stake element. Zero files.

**No reward-moment asset.** `Celebration` in `reward.tsx` is a CSS burst over whatever
surface is beneath it, and the six badges render from `Icon` glyphs. Nothing to generate.

**No ending-debrief plate.** It is a paper screen with a print stylesheet behind it; a
background image there is toner.

---

## §3 · Cut-scene plates — 8

### Shared specification

| | Spec | Why |
|---|---|---|
| Filename | `cut-<slug>.webp` | New kind, new prefix. `cut-` matches the `CutScene` component and sorts away from `hero-` |
| **Format** | **WebP. Not negotiable.** | `artUrl()` in `src/ui/shell.tsx` is `` `${BASE_URL}art/${name}.webp` `` — the extension is hard-coded. A PNG 404s silently and the plate simply does not appear |
| Size | **1920 × 1080 (16:9)** | Covers a 1920 viewport at DPR 1 and the verified 1440×900 viewport at DPR 1.33 with no upscale. Beyond that is wasted: the plate is composited at `opacity: 0.3` under `grayscale(0.7) brightness(0.62)`, so the browser throws the extra detail away before a player could see it. 16:9 rather than the existing heroes' 1.7:1 because this beat is full-bleed and 16:9 is the only ratio that does not letterbox a 1920×1080 or 1440×810 stage |
| Compression | q72, **≤ 140 kB each** | 8 × 140 kB ≈ 1.1 MB, all lazy, one visible at a time |
| Where | `src/ui/cutscene.tsx`, full-bleed `<img>` at `inset-0 object-cover`, behind a 104° scrim | |
| Mode | **watch** — chrome removed, no rails, one action | |

### The composition constraint, measured

Read off `cutscene.tsx`, not guessed:

- **CALM ZONE — the left 50% of the frame, full height.** The type column is
  `max-w-[700px]` with `px-12` inside a full-bleed section: at 1440 px it occupies
  x 48–748 px. Over it sits the eyebrow (13 px, cyan), the **96 px chapter numeral** with a
  64 px violet text-shadow, the 32 px title, up to four body paragraphs and the
  "what happens in this chapter" chip row. A `linear-gradient(104deg, …)` scrim takes the
  plate to **96% stage** at the left edge and 80% at 44% across. **Detail you put on the
  left is deleted by the scrim before it is seen.** Composing there is paying for pixels
  the browser discards.
- **FIGURE OCCLUSION — a circle of radius 15% of frame width, centred at x 77%, y 45%.**
  The figure container is `absolute inset-y-0 right-0 w-[46%]` (so x 54–100%, centre 77%)
  holding a 400 × 400 radially-masked bust, vertically centred. Nothing with a focal point
  goes there.
- **INTEREST BAND — x 55–100%, in the top 35% and the bottom 40%.** Around the figure, not
  behind its head.
- **A 640 × 640 violet radial bloom is already drawn at right 4%, top −10%.** Do not put a
  second bright source in the top-right corner or the two stack into a blowout.
- **Below 1024 px the figure is hidden and the type column goes full width.** At the
  verified 390 × 844 phone pass the *whole* plate sits behind type. That is the strongest
  argument for keeping every plate low-detail overall: it has to survive being 100%
  background.

**The cut plates cannot break contrast, and it is worth knowing why they are the easy
category.** Push a plate pixel to pure white and the compositor
(`opacity .3` × `brightness .62` × `grayscale .7` over `#180927`, then the scrim) lands it
at about `#312839` at the far right edge, where `--color-stage-ink-soft` `#aa9ebc` still
measures **5.58:1** against the 4.5 floor. The constraint on these eight is compositional,
not photometric. The four in §4 are the opposite, and they are the hard ones.

### Shared negative for all eight

Paste §1.6 **plus**:

```
no focal detail in the left half of the frame; no focal detail in the centre-right where
a figure will stand; nothing bright in the top-right corner; no horizon line through the
middle of the frame; no symmetry; no centred one-point perspective; no flat-on elevation.
```

The last three are the *Papers, Please* lesson restated: a room shot flat-on and centred
reads as a slide every single time, which is the exact feel this product is escaping.

---

### §3.1 · `cut-ch1-city.webp` — **THE ANCHOR. GENERATE THIS FIRST.**

| | |
|---|---|
| Chapter | 1 — "Find the right client" |
| Beat | The chapter-one opener, immediately after the title screen |
| Figure composited on top | Priya Sharma |
| Mode | watch |
| Replaces | the current stand-in, `hero-retail-plaza` |

`GAME-SEQUENCE.md` §2 marks this beat "Priya at 400px, city plate". It is the first
artwork in the run and the only one every player sees before they have decided anything.

**Fully expanded prompt** — this is the one entry where the base blocks are written out in
place, so there is no ambiguity about what an assembled prompt looks like. Every other
entry uses the `<<STAGE BASE>>` token.

```
Editorial illustration, hand-painted digital gouache with visible brush texture and
soft grain. Confident tapered linework, no outlines on skin. One hard key light with
visible falloff and long soft shadows. Muted, slightly desaturated, film-still grade.
Grounded and adult — no cartoon proportions, no flat vector shapes, no
corporate-Memphis illustration, no gradients-as-decoration, no lens flare, no text,
no logos, no watermark.

NIGHT REGISTER. The ground is violet-black #180927; the deepest shadows fall to
#0f0518; mid-tones sit at #28163a. The only light in the frame is deep violet #460073
rising to bright violet #a100ff at its hottest point, plus a bone-white #f5f1fa
specular on no more than two edges. Warm paper tones #cbb894 and #bfa87f appear only
as dust or haze inside the light, never as a surface. Low overall exposure: this is a
lit stage in a dark room, not a dim photograph. Hard key light from the LEFT.

SCENE. The edge of an empty upper-floor open-plan office, very early morning, looking
out through a full-height wall of glass onto a dense city that is still lit. Desks in
the near dark, angled, unoccupied. The city is a field of small violet and bone-white
window lights receding into haze — no single landmark, no recognisable skyline. One
structural column in the near right. The glass carries a faint vertical smear of
reflected interior light.

COMPOSITION. Off-axis two-point perspective from standing eye height, camera turned
away from the back wall. The city and the glass occupy the right 45% of the frame; the
left half falls away into near-black office interior with no described object in it.
Horizon low, at roughly 62% down the frame. Signs of recent use in the right third
only: one chair turned out from a desk, one mug.

16:9, 1920x1080.
```

**Must not contain.** §1.6 + the cut-scene negative, and specifically: no ORION, no shop
fascia, no window signage, no aircraft warning lights (red), no blue hour — the sky is
violet-black, not blue.

**Composition constraint.** Calm: x 0–50%. Figure occlusion: circle r=15% at (77%, 45%) —
which is exactly where the brightest part of the cityscape wants to go, so pull the
brightest window cluster down to y 70–85% and out to x 85–100%.

---

### §3.2 · `cut-ch2-boardroom.webp`

| | |
|---|---|
| Chapter | 2 — "Make it an opportunity" |
| Figure | Arjun Mehta |
| Replaces | `hero-client-meeting` |

```
<<STAGE BASE>>

SCENE. Orion's main boardroom, empty, late in the day. A long table running away from
camera, twelve chairs, one wall of glass with the city beyond. Venetian blinds half
drawn, throwing hard parallel stripes of violet light across the table surface. A water
carafe and two upturned glasses. Papers squared at one seat and scattered at another.

COMPOSITION. Off-axis two-point perspective from seated eye height, the table entering
from the lower left and vanishing to the upper right. The blind stripes are the only
high-contrast element and they run across the right third. The left half is the dark
end of the room: no described object, no visible chair, no table edge.

16:9, 1920x1080.
```

**Must not contain.** §1.6 + cut-scene negative, and: no screen or display on the wall, no
projector image, no papers with anything written on them, no view of a legible building.

**Composition constraint.** Calm: x 0–50% — the far, unlit end of the table. Figure
occlusion at (77%, 45%): route the blind stripes *below* it, across y 55–80%, so the
stripes read as a floor for the figure rather than as bars across its face.

---

### §3.3 · `cut-turn-rival.webp` — story turn, chapter 2

| | |
|---|---|
| Beat | "the rival moves" — `GAME-SEQUENCE.md` §2, chapter 2, marked **New** |
| Figure | none, or Sarah Lim if `App.tsx` passes the upcoming advisor |
| Mode | watch — done to you, you cannot alter it |

The brief for this plate is a hard one: show that a competitor has been here, with no
people and no logos. The answer is the room afterwards.

```
<<STAGE BASE>>

SCENE. The same client boardroom, but somebody else has just used it. Two chairs on the
far side pulled right out and left turned. A second set of coffee cups, used, pushed to
one side. A thick glossy document lying face-down and square in the middle of the table,
its back cover blank. The blinds now fully closed. The door at the far right stands ajar
with cold corridor light falling through the gap in a hard wedge across the carpet.

COMPOSITION. Off-axis, from seated eye height, lower than the chapter two plate and
turned further right so the open door and its wedge of light are the subject. The wedge
of corridor light enters at the right edge at roughly y 55% and stops before the centre
of the frame. Everything left of x 50% is the unlit room.

16:9, 1920x1080.
```

**Must not contain.** §1.6 + cut-scene negative, and: no visible cover artwork or title on
the document, no branded cups, no person in the doorway, no shadow of a person, no warm
tungsten corridor light — the corridor light is bone-white `#f5f1fa` falling to violet.

**Composition constraint.** Calm: x 0–50%. Figure occlusion at (77%, 45%) — the door gap
must sit **below and right** of it, centred near (88%, 62%), so the figure stands between
the player and the door rather than in front of it.

---

### §3.4 · `cut-ch3-warroom.webp`

| | |
|---|---|
| Chapter | 3 — "Build the response" |
| Figure | Riya Kapoor |
| Replaces | `solution-workshop` |

```
<<STAGE BASE>>

SCENE. Our own meeting room, mid-argument, everyone just stepped out. A whiteboard
covered in a half-finished diagram rendered only as abstract marks, loops and
connecting strokes with no letters or numbers anywhere. Sticky notes in pale violet
#c2a3ff and warm paper #ded1b9 clustered off-centre. Chairs pushed back at angles.
Three coffee cups at three different levels. A pendant lamp low over the table is the
single light source.

COMPOSITION. Off-axis two-point perspective from seated eye height. The pendant lamp
hangs at roughly x 70%, y 18%, and its cone of light falls onto the table below it,
leaving the whiteboard half in shadow. The left half of the frame is the dark corner of
the room, empty. The whiteboard occupies x 58% to the right edge.

16:9, 1920x1080.
```

**Must not contain.** §1.6 + cut-scene negative, and — this one matters most here —
**absolutely no legible writing, no letters, no numerals, no arrows with labels, no
readable diagram.** Marks only. Also: no Post-it yellow, no green or orange notes.

**Composition constraint.** Calm: x 0–50%. Figure occlusion at (77%, 45%) lands on the
whiteboard, which is correct — a whiteboard is exactly what a figure should stand in front
of — but push the densest cluster of marks to x 60–70% and x 88–100% so the diagram reads
around the silhouette.

---

### §3.5 · `cut-ch4-deal-room.webp`

| | |
|---|---|
| Chapter | 4 — "Make the deal work" |
| Figure | Aisha Khan |
| Replaces | `hero-negotiation` |

```
<<STAGE BASE>>

SCENE. A small negotiation room at night. One table, too big for the room. Two chairs
on one side, three on the other, none matching. A printed contract fanned into a short
stack, face-down. One pen lying across it. A phone face-down beside the stack. A single
recessed ceiling downlight directly over the table; the corners of the room fall to
#0f0518. One deep violet #460073 folder is the only saturated object in the frame.

COMPOSITION. Off-axis, low, from seated eye height on the side with two chairs, so the
table foreshortens away to the upper right and the three-chair side reads as the other
party. The downlight pool sits at roughly x 62%, y 58%. The left third is the wall and
the door, unlit and undescribed.

16:9, 1920x1080.
```

**Must not contain.** §1.6 + cut-scene negative, and: no text on the contract, no
signature line, no clock, no window, no phone screen lit, no gold pen.

**Composition constraint.** Calm: x 0–50%. Figure occlusion at (77%, 45%): keep the three
chairs on the far side at x 55–70% and 85–100% so the figure occupies the gap in the row —
the composition should read as the figure standing in the space the other party left.

---

### §3.6 · `cut-turn-award.webp` — story turn, chapter 4

| | |
|---|---|
| Beat | "the award lands" — `GAME-SEQUENCE.md` §2, chapter 4, marked **New**. Their decision, not yours |
| Figure | Declan Foyle, or none |

```
<<STAGE BASE>>

SCENE. The client boardroom immediately after a decision has been taken. Twelve chairs:
eleven pushed neatly in, one turned out and left. The blinds now fully open so the city
reads as a cold violet field through the glass. One closed folder placed square and
alone in the exact centre of the table. Everything else cleared. The table surface is
wiped and reflective.

COMPOSITION. Off-axis two-point perspective from standing eye height — higher than
every other plate in this set, looking slightly down on the table, because the player is
looking at a decision rather than sitting in it. The closed folder sits at roughly
x 58%, y 62%. The one turned-out chair is at x 84%. The left half is the dark end of the
room and the doorway, undescribed.

16:9, 1920x1080.
```

**Must not contain.** §1.6 + cut-scene negative, and: no text or crest on the folder, no
trophy, no ribbon, no gold anything — the reward gold `#ffc53d` is reserved for earned
surfaces and this beat is explicitly not one. No celebration, no confetti; the celebration
lands on the map, never inside the beat.

**Composition constraint.** Calm: x 0–50%. Figure occlusion at (77%, 45%): keep the folder
and the turned-out chair either side of it. The raised camera is the one intentional
deviation from the set and it is the whole point of the shot — flag it to the client if
the plate reads as inconsistent, because reverting it costs nothing.

---

### §3.7 · `cut-ch5-back-of-house.webp`

| | |
|---|---|
| Chapter | 5 — "Deliver the promise" |
| Figure | Priya Sharma |
| Replaces | `hero-retail-interior` |

`GAME-SEQUENCE.md` marks chapter 5's first beat "Month five, internal room", and the
chapter belongs to Marcus's world — the part of the client that inherits the promise.

```
<<STAGE BASE>>

SCENE. A retail stockroom and receiving bay. Cage trolleys in a loose row, half loaded.
Roller shutter closed at the far end. A wall-mounted terminal on a swing arm, its screen
dark. Concrete floor with a painted bay line worn thin. Cardboard flattened and stacked.
A single high sodium-free strip light at the far right, cold and hard, throwing long
trolley shadows toward camera.

COMPOSITION. Off-axis two-point perspective from standing eye height. The trolley row
runs from lower left to upper right. Long hard shadows rake toward the lower left across
the concrete. The strip light is at roughly x 88%, y 12%. The left 45% is the shadowed
end of the bay with the shutter, undescribed and near-black.

16:9, 1920x1080.
```

**Must not contain.** §1.6 + cut-scene negative, and: no barcodes, no labels, no shipping
marks, no printing on the cardboard, no hi-vis yellow or orange, no warm sodium light (it
is a warm-gold source and gold is reserved), no screen content on the terminal.

**Composition constraint.** Calm: x 0–45%. Figure occlusion at (77%, 45%): the trolley row
should pass behind the figure position, not stop at it.

---

### §3.8 · `cut-turn-resignation.webp` — story turn, chapter 5

| | |
|---|---|
| Beat | "Sarah resigns" — `GAME-SEQUENCE.md` §2, chapter 5, marked **New**. Done to you |
| Figure | Aisha Khan, or none |

This is the last plate in the run and the one carrying the most weight. It is Sarah's own
room with Sarah subtracted, and it works because `ART-BRIEF.md` §4 already established what
that room contains: "smaller, warmer, one round table, a shelf of awards, her coat still
over the back of a chair". Every one of those details is inverted here.

```
<<STAGE BASE>>

SCENE. A small client meeting room, cleared. One round table, bare. A shelf along the
back wall holding a row of award objects with one conspicuous gap in the middle of the
row. A chair with nothing over the back of it. A flattened cardboard box leaning against
the wall. Evening light through one window on the right, violet and falling.

COMPOSITION. Off-axis, from seated eye height, turned toward the shelf. The gap in the
shelf sits at roughly x 66%, y 34%. The window is at x 90%. The round table enters from
the bottom edge at the lower left and is cropped by the frame. The left 50% is the
emptied side of the room: wall, floor, nothing on either.

16:9, 1920x1080.
```

**Must not contain.** §1.6 + cut-scene negative, and: the award objects are abstract
forms — **no engraved plates, no text, no trophy cups, no human figures on the awards, no
gold or brass.** No coat, no handbag, no personal object of any kind; the subtraction is
the subject. No sunset orange.

**Composition constraint.** Calm: x 0–50%. Figure occlusion at (77%, 45%): the shelf gap at
(66%, 34%) is deliberately just outside it, so the gap stays visible past the figure's
shoulder. If the figure is omitted on this beat, nothing breaks.

---

## §4 · Navigate and debrief backdrops — 4

**This is the category the client's instruction is actually about.** The hub, the map and
the recognition board today are flat `--color-stage` with CSS radial washes on top and no
image asset at all — `grep artUrl src/ui/*.tsx` returns nothing in `hub.tsx` or
`journey.tsx`. "Not just solid colours" is a literally accurate description of these three
screens.

### Shared specification

| | Spec | Why |
|---|---|---|
| Filename | `stage-<surface>.webp` | `stage-` matches `--color-stage` and the `data-stage` attribute that switches the focus ring. Unambiguous against `cut-` and `hero-` |
| Format | **WebP**, same hard-coded-extension reason as §3 | |
| Size | **2048 × 1152 (16:9)** | Wider than the cut plates because these are full-viewport on a desktop that may be 2048 logical px, and because there is no figure to set a detail budget. It costs almost nothing: a plate with no high-frequency detail compresses to a fraction of a detailed one |
| Compression | q60, **≤ 80 kB each** | Achievable *only* if grain amplitude stays low. Grain is high-frequency and is the single thing that will blow this budget. If a plate lands above 80 kB, take grain out of the image and add it in CSS |
| Where | full-viewport, beneath all navigate chrome | |
| Mode | **navigate** — "a change of world, not a change of page" |

### The composition constraint — and here it is arithmetic

**There is no calm zone, because the whole frame is a calm zone.** Dense UI covers all of
it: an opaque raised header strip across the top, an opaque raised right column on the hub,
five flush chapter cells and a winding node track on the map, 96 px numerals, three meters,
badge slots. Nothing in the plate may compete, and the exact crop moves with the viewport,
so "no focal detail anywhere" is the only safe instruction.

**BRIGHTNESS CEILING — no pixel brighter than `#2e1a43`.** This is not a feel; it is the
point at which `index.css`'s measured contrast guarantees stop holding, and the binding
token is the hairline, not the type:

| | Hex | Relative luminance Y |
|---|---|---|
| `--color-stage` (the ground) | `#180927` | 0.0055 |
| `--color-stage-raised` | `#28163a` | 0.0133 |
| **Ceiling** | **`#2e1a43`** | **0.0171** |
| `--color-stage-line` (hairline) | `#756887` | 0.1533 |

`--color-stage-line` must clear **3:1** as a graphical object. Solving
`(0.1533 + 0.05) / (Y + 0.05) = 3` gives a maximum ground luminance of **Y = 0.0178**;
`#2e1a43` measures Y 0.0171, giving **3.03:1**. So the plate has roughly **one
raised-surface step of headroom and no more**. `--color-stage-ink-soft` type is not the
constraint — it still clears 4.5:1 well above this — the 1 px hairline is.

Put this in the prompt as an instruction and then **verify it in a browser**, not in the
image viewer. `D-010` in `docs/DECISIONS.md` is the record of typecheck and tests being
green while the primary button rendered dark text on purple; only the screenshot caught it.
A plate that is 4% too bright is exactly that class of defect.

### Shared negative for all four

Paste §1.6 **plus**:

```
no focal point anywhere in the frame; no subject; no object; no architecture; no horizon;
no recognisable place; no foreground; nothing in focus; no high contrast; no bright
highlight; no white; no light source visible in frame; no stars; no particles; no
vertical or horizontal lines; no pattern; no repetition; no texture large enough to be
identified.
```

---

### §4.1 · `stage-hub.webp`

| | |
|---|---|
| Screen | The hub — `src/ui/hub.tsx`. The game's front door |
| Mode | navigate |
| Over it | an opaque header strip, an opaque right column, a 96 px mission counter, three dimension meters, two outlined doors, one loud primary action, and a CSS radial violet wash at 26% |

```
<<STAGE BASE>>

A completely abstract field, not a place. Violet-black #180927 across the whole frame,
lifting very slightly and very softly toward #28163a in one broad, shapeless bloom whose
centre sits low and left of centre, at roughly x 34%, y 68%. The bloom has no edge, no
circle, no rim: it is a change of density, not a shape. Beneath the bloom, the faintest
possible suggestion of a city at great distance and far out of focus, reduced almost to
nothing, occupying only the bottom 14% of the frame and never rising above 3% contrast
against the ground.

Very fine hand-painted grain across the whole frame, low amplitude. Slight unevenness in
the paint so the field is never mathematically flat.

CRITICAL: no pixel in this image may be brighter than #2e1a43. Nothing in the frame is
in focus. There is no subject.

16:9, 2048x1152.
```

**Must not contain.** §1.6 + the navigate negative, and: no window lights bright enough to
count as points, no skyline silhouette with a readable edge, no moon, no reflections.

**Composition constraint.** Whole frame. The only positional instruction is that the bloom
sits **low and left** — because the hub's right column is an opaque raised surface and a
bloom placed there would be generated and then covered. Put the density where the plate is
visible. **[inference]** on the exact 34%/68%; derived from the hub's layout, not measured
from a screenshot.

---

### §4.2 · `stage-map.webp`

| | |
|---|---|
| Screen | The journey map — `src/ui/journey.tsx`. Five chapter cells, a winding node track, per-node violet glows at 40% |
| Mode | navigate. **This is where the celebration lands** (`SCREEN-TAXONOMY.md` rule 6) |

Generated from `stage-hub.webp` as a reference, changing only the drift. The two must read
as one continuous world, because the player moves between them constantly.

```
<<STAGE BASE>>

A completely abstract field, not a place. Violet-black #180927 across the whole frame.
A single very soft diagonal drift of slightly denser violet running from the lower left
to the upper right, as though a broad, weak light were crossing a dark surface at an
oblique angle. No edge to it, no beam, no ray: a gradual thickening and thinning of the
dark. Its densest point sits at roughly x 52%, y 46% and it never exceeds #2e1a43.

Very fine hand-painted grain across the whole frame, low amplitude. Slight unevenness in
the paint so the field is never mathematically flat.

CRITICAL: no pixel in this image may be brighter than #2e1a43. Nothing in the frame is
in focus. There is no subject, no horizon and no architecture of any kind.

16:9, 2048x1152.
```

**Must not contain.** §1.6 + navigate negative, and: **no path, no road, no trail, no line,
no route, no map, no constellation, no connected dots.** The map's path is drawn by the UI
in `journey.tsx`; a painted one underneath would be a second, wrong path.

**Composition constraint.** Whole frame. The diagonal runs lower-left to upper-right
because the chapter cells read left to right and the node track winds within them — a
counter-diagonal would fight the reading direction. **[inference]**.

---

### §4.3 · `stage-recognition.webp`

| | |
|---|---|
| Screen | The recognition board — `RecognitionBoard` in `src/ui/reward.tsx`. Six badge slots, earned and unearned |
| Mode | navigate. This is the surface the client called the "performance dashboard" |

```
<<STAGE BASE>>

A completely abstract field, not a place. Violet-black #180927 across the whole frame.
A single very broad, very soft vertical column of slightly denser violet rising from the
bottom edge through the centre of the frame, widest at the bottom and dissipating
entirely before it reaches the top third. No edge, no beam, no shaft with sides: only a
gradual thickening of the dark, centred at x 50% and never exceeding #2e1a43.

Very fine hand-painted grain across the whole frame, low amplitude. Slight unevenness in
the paint so the field is never mathematically flat.

CRITICAL: no pixel in this image may be brighter than #2e1a43. Nothing in the frame is
in focus. There is no subject.

16:9, 2048x1152.
```

**Must not contain.** §1.6 + navigate negative, and emphatically: **no gold, no brass, no
warm light, no glow, no medal, no trophy, no laurel, no star, no badge shape, no plinth,
no spotlight cone.** The six badges are rendered in `--color-reward` `#ffc53d` by the UI,
and `index.css` is explicit that the reward gold must appear nowhere else. A gold wash in
the plate spends the one colour the badges are paid in.

**Composition constraint.** Whole frame; the vertical centre so the six badge slots read as
lit from behind rather than lit from one side. **[inference]**.

---

### §4.4 · `stage-debrief.webp`

| | |
|---|---|
| Screen | The chapter debrief — 5 instances per run, one at the end of each chapter |
| Mode | receive, on the navigate register. `GAME-SEQUENCE.md` §4: "dark stage, no chrome, a node graph, not prose" |
| Status | **missing screen type** (`SCREEN-TAXONOMY.md` type 15, 0 → 5). The plate can be generated before the screen exists |

**Do this as an edit of `stage-map.webp`, not as a fresh prompt.** Same reason
`ART-BRIEF.md` gave for its night variant: generating a variant is what keeps the field
identical, and identity is the entire point. The debrief is the map's world stopped for a
moment, which is also the narrative relationship between the two screens.

```
Reference image: stage-map.webp.

Keep the field, the grain and the diagonal drift EXACTLY as they are. Change only this:
darken the four corners by a further 15% toward #0f0518, and pull the densest point of
the diagonal from x 52%, y 46% in to x 50%, y 50%.

Nothing else changes. No new element, no new light, no new texture.

CRITICAL: no pixel in this image may be brighter than #2e1a43.

16:9, 2048x1152.
```

**Must not contain.** As `stage-map.webp`, plus: no node shapes, no graph, no flowchart, no
branches. The path-reveal graph is UI.

**Composition constraint.** Whole frame. The inward pull and the darker corners exist so a
node graph reads as sitting *in* the frame rather than floating on it — this is a
`vignette` in effect, which §1.6 otherwise bans, and it is allowed here **only** because
this plate never has a figure or a full-bleed photograph on it. **[inference]**.

---

## §5 · Portraits — 3

### Shared specification

| | Spec | Why |
|---|---|---|
| Filename | `portrait-sarah.webp`, `portrait-marcus.webp`, `portrait-foyle.webp` | The existing convention, and the names `ART-BRIEF.md` already promised |
| Size | **512 × 512** | The call tile in `dialogue.tsx` renders the portrait in a **104 px** circle, which needs **208 device px at DPR 2**. The four existing files are **160 × 160** — below that, so every colleague's face is upscaled 1.3× and visibly soft on any retina laptop. 512 gives headroom and downsamples cleanly to the 160 the existing four use |
| Format | WebP q80, **≤ 40 kB each** | |
| Crop | **Head and shoulders.** Top of head 8% down from the top edge; crop at mid-chest; head centred at x 50% | |
| **Eye-line** | **34% down from the top of the frame, on all three** | Not `ART-BRIEF.md`'s 28% — that figure was for a waist-up 2:3 sprite. At a square head-and-shoulders crop, 34% puts the eyes on the upper third of a circle masked at 50% and is what makes three tiles look like one call |
| Key light | **Hard, from the LEFT**, on all three | |
| Gaze | Toward the viewer | |
| Ground | A flat field of `--color-stage-raised` `#28163a`, edge to edge, no gradient | See below |
| Where | `CallTile` (104 px circle) in `dialogue.tsx`; `Turn` avatars in the chat thread; the `Figure` in `cutscene.tsx` (see §6.1) |

**Why a flat `#28163a` ground rather than a room or a transparent cut-out.** The tile is a
circle, so anything outside the circle is discarded — a painted room behind the head is
generated and then thrown away. A flat dark field costs nothing, keeps every file under
40 kB, and reads correctly as a video tile. It is also the only option that makes seven
portraits match, since matching seven invented rooms is not achievable.

### 5.1 · The framing standard, stated once

All three, and all four in §5.5, are generated to exactly this. Deviating on any line is
what produces "different games on one call".

- Square, 512 × 512, head and shoulders
- Head centred at x 50%; **eye-line at 34%** from the top
- Head height (chin to crown) = **44% of frame height**
- Hard key from the **left**, fill at roughly one third of key, no rim light
- Flat `#28163a` ground, no gradient, no shadow cast on the ground
- Expression **neutral**: attentive, unreadable, waiting. Not smiling, not frowning
- Three-quarter turn of about 15° toward the camera; gaze straight at the viewer
- Shoulders cropped at the frame edge on both sides

### 5.2 · `portrait-sarah.webp` — **generate the character sheet first**

Sarah Lim, Chief Transformation Officer at Orion. Locked attributes from `ART-BRIEF.md`
§3, re-pointed to the live palette.

```
<<PAPER BASE>>

Head-and-shoulders portrait of Sarah Lim: an East Asian woman in her early fifties with
a sharp grey bob at #6b6049, wearing an immaculate ivory blazer at #f7eee0 over a paler
shirt at #fdfaf3, with reading glasses on a fine chain resting on her chest. Warm, and
running out of room.

Expression: neutral. Attentive, unreadable, waiting. Not smiling.
Three-quarter turn of about 15 degrees toward camera; gaze straight at the viewer.
Hard key light from the LEFT with visible falloff; fill at one third of key; no rim
light; no shadow cast on the ground behind her.
Eye-line 34% down from the top of the frame. Head centred horizontally. Chin-to-crown
height equal to 44% of the frame height. Shoulders cropped at both frame edges; crop at
mid-chest.
Flat background of a single solid violet-black #28163a, edge to edge, with no gradient,
no texture and no object in it.

Square, 512x512.
```

**Must not contain.** §1.6, and: no jewellery beyond the glasses chain, no lanyard, no
badge, no visible collar pin, no background, no gradient behind the head, no drop shadow,
no vignette, no smile, no teeth, no hands, no desk, no chair back, no blue or grey-blue
cast to the ivory.

**Composition constraint.** The circular mask in `CallTile` crops to a circle inscribed in
the square, and `objectPosition: 50% 28%` is applied — so **anything below y 78% is cut and
anything above y 6% is cut.** Keep the crown of the head below y 8% or it is beheaded in
the tile.

### 5.3 · `portrait-marcus.webp`

Marcus Reed, Operations Director. The only person in the cast who visibly works in a
building rather than an office.

```
<<PAPER BASE>>

Head-and-shoulders portrait of Marcus Reed: a heavy-set white man in his late forties
with close-cropped greying hair at #6b6049, no jacket, a pale shirt at #f7eee0 with the
sleeves rolled, collar open, and a plain ID badge on a clip at his chest. Guarded; has
been promised things before.

Expression: neutral. Attentive, unreadable, waiting. Not smiling.
Three-quarter turn of about 15 degrees toward camera; gaze straight at the viewer.
Hard key light from the LEFT with visible falloff; fill at one third of key; no rim
light; no shadow cast on the ground behind him.
Eye-line 34% down from the top of the frame. Head centred horizontally. Chin-to-crown
height equal to 44% of the frame height. Shoulders cropped at both frame edges; crop at
mid-chest.
Flat background of a single solid violet-black #28163a, edge to edge, with no gradient,
no texture and no object in it.

Square, 512x512.
```

**Must not contain.** §1.6, and: **no text, photograph, barcode or logo on the ID badge** —
it is a blank pale rectangle. No hi-vis, no hard hat, no tie, no jacket, no tattoo, no
background, no gradient, no smile.

**Composition constraint.** As §5.2. The badge must sit below y 78% so the circular mask
removes it — it is characterisation for the chat avatar and the cut-scene figure, not for
the call tile.

### 5.4 · `portrait-foyle.webp`

Declan Foyle, Procurement. **Not a villain** — a man with a savings target and a scorecard
nobody has helped him hit. This is the single most important note in the entry: a
procurement lead drawn as an antagonist makes the m9a apply/rebuttal beat a fight instead
of a negotiation, and that beat is the one the whole run builds toward.

```
<<PAPER BASE>>

Head-and-shoulders portrait of Declan Foyle: a white man in his fifties with thinning
hair at #574d3b and rimless glasses, wearing a cheap, slightly ill-fitting grey suit at
#6b6049, buttoned, over a plain shirt at #ded1b9. Tired, procedural and fair — a man
doing a job, not an opponent.

Expression: neutral. Attentive, unreadable, waiting. Not smiling, and NOT stern,
disapproving, smug or hostile.
Three-quarter turn of about 15 degrees toward camera; gaze straight at the viewer.
Hard key light from the LEFT with visible falloff; fill at one third of key; no rim
light; no shadow cast on the ground behind him.
Eye-line 34% down from the top of the frame. Head centred horizontally. Chin-to-crown
height equal to 44% of the frame height. Shoulders cropped at both frame edges; crop at
mid-chest.
Flat background of a single solid violet-black #28163a, edge to edge, with no gradient,
no texture and no object in it.

Square, 512x512.
```

**Must not contain.** §1.6, and: no clipboard, no folder, no pen (those belong to the
`figure-foyle` crop in §6.1, not to a head-and-shoulders tile), no frown, no raised
eyebrow, no arms crossed, no sneer, no harsh under-lighting, no villain framing of any
kind, no background.

**Composition constraint.** As §5.2.

### 5.5 · The four existing colleague portraits — Tier 2, and a problem

**The instruction "match the four existing colleague portraits: same framing, same
lighting direction, same grade" cannot be followed, because the four do not match each
other.** I opened all four. They are four unrelated stock photographs:

| File | What it actually is | Matches its locked attributes? |
|---|---|---|
| `portrait-priya.webp` | Young woman, long curly dark hair, large hoop earrings, broad smile, near-black studio ground | **No.** Spec is "Indian woman, late 30s, shoulder-length black hair tucked behind one ear, charcoal blazer over a cream shirt, one thin gold necklace" |
| `portrait-riya.webp` | Older woman, pale beige wall, soft flat frontal light, patterned top | **No.** Spec is "deep violet blazer `#460073` — **she is the one person who wears the accent colour**, because she is the most senior voice in the game". She is not wearing it |
| `portrait-arjun.webp` | Young man, grey suit **with a tie**, lapel pin, warm orange bokeh interior | **No.** Spec is "early 40s, neat full beard, **no tie, top button open**, mid-grey shirt, wire glasses" |
| `portrait-aisha.webp` | Woman with auburn hair, **arms crossed, three-quarter body**, mid-grey studio | **No.** Spec is "black hair in a high ponytail, deep green shirt, lanyard" — and the crop is not head-and-shoulders at all |

Four different grounds (near-black, beige, warm bokeh, mid-grey), four different lighting
directions, four different crops, four different grades. There is no common standard to
match, so §5.1 **defines** one and the three new portraits are generated to it.

**My recommendation: regenerate all four, in the same batch, to §5.1.** Four extra files.
The reasons are not aesthetic:

1. **Riya's violet blazer is load-bearing content, not costume.** She is the one character
   who wears the brand accent because she is the most senior voice. That information is
   currently not on screen at all.
2. **A painted portrait can honour a locked attribute; a stock photograph cannot.** This is
   the whole argument for generating rather than sourcing.
3. **160 × 160 is below the DPR-2 requirement** for a 104 px tile and 5× below what the
   cut-scene `Figure` renders it at. `cutscene.tsx`'s own docstring says so: "the four
   portraits are 160×160 — so 'render it bigger' is not available as a photograph", which
   is why that component carries a duotone plate, a radial mask and a 4 px diagonal grain
   purely to hide the interpolation.
4. **The mixed register is worse than the current one.** Ship three painted faces beside
   four stock photographs and m5's call tile wall shows both at once.

**Prompts.** Identical to §5.2–5.4 in every line except the person, using the locked
attributes from `ART-BRIEF.md` §3 with the hair hexes re-pointed to the live ink ramp
(`#221925` → `#1e1621`, `#403443` → `#3a2e3d`):

- **`portrait-priya.webp`** — Priya Sharma, Client Growth Lead. Indian woman, late 30s.
  Shoulder-length black hair `#1e1621`, tucked behind one ear. Charcoal blazer `#3a2e3d`
  over a cream shirt `#f7eee0`. One thin gold necklace. Brisk, direct, slightly impatient.
- **`portrait-riya.webp`** — Riya Kapoor, Engagement Director. Indian woman, mid 40s. Dark
  brown hair `#3a2e3d` in a low bun. **Deep violet blazer `#460073`.** No jewellery.
  Composed, watchful, has made the mistake herself.
- **`portrait-arjun.webp`** — Arjun Mehta, Solutions Director. Indian man, early 40s. Short
  black hair `#1e1621`, neat full beard. **No tie, top button open**, mid-grey shirt
  `#6b6049`, sleeves pushed up. Wire glasses. Sceptical, likes being argued with.
- **`portrait-aisha.webp`** — Aisha Khan, Delivery Lead. South Asian woman, early 30s.
  Black hair `#1e1621` in a high ponytail. Deep green shirt — **substitute
  `#574d3b`**, because green is Profitability's hue and §1.3 keeps artwork off it. Sleeves
  rolled, plain lanyard. Direct, slightly weary, concrete.

The Aisha substitution is a real content change and the only place this manifest overrides
`ART-BRIEF.md` §3's locked attributes. Flag it to the client: her shirt stops being green.
**[inference]** that the hue rule should win over the character note; the alternative is a
Profitability-green garment 8 px from a Profitability meter.

**If the client will only fund three**, generate §5.2–5.4 **photographically instead of
painted** — swap `<<PAPER BASE>>` for the block below and keep every other line of every
prompt byte-identical. A photographic Sarah beside a photographic Priya is merely
inconsistent; a painted Sarah beside a photographic Priya is broken.

```
Photographic corporate headshot, 85mm lens, shallow depth of field, natural skin
texture, muted and slightly desaturated film-still grade. Hard key light from the LEFT
with visible falloff; fill at one third of key; no rim light. No warm or cool colour
cast. No text, no logos, no watermark.
```

---

## §6 · Optional

### 6.1 · Stage figures — 7 files

**The cut-scene component is currently rendering a 160 px source at 400 CSS px — a 5×
upscale, 10× at DPR 2 — and the component's own comment says so.** The duotone plate, the
`luminosity` blend, the radial mask and the 3 px diagonal grain in `cutscene.tsx`'s
`Figure` exist to hide that interpolation. They work, and they are a workaround.

| | Spec | Why |
|---|---|---|
| Filename | `figure-<person>.webp` — `figure-priya`, `figure-riya`, `figure-arjun`, `figure-aisha`, `figure-sarah`, `figure-marcus`, `figure-foyle` | |
| Size | **1024 × 1024** | The `Figure` box is `400 × 400` CSS with `object-cover`; at DPR 2 that is 800 device px. A square source means `object-cover` performs no crop, which is what makes the mask land where it is designed to |
| Format | WebP q78, **≤ 90 kB each** | |
| **Eye-line** | **38% down from the top; head centred at x 52%** | Derived, not chosen: the component's mask is `radial-gradient(48% 54% at 52% 42%, …)`, so the mask's own centre is (52%, 42%) and `objectPosition` is `50% 14%`. Putting the eyes at 38% lands them just above the mask centre, where a face should sit |
| Crop | Head to **upper chest**, wider than the portrait — the mask eats the edges, so there must be material for it to eat | |
| Ground | Flat `#180927` (the stage ground, **not** the raised `#28163a` of the portraits) | The figure is masked into the plate, not into a tile |
| Generated | In the same run as that person's portrait, from the same approved sheet | Seven extra files, zero extra character design |

Prompt: the person's §5 prompt, changed in exactly four lines —

```
Eye-line 38% down from the top of the frame. Head centred at 52% of the frame width.
Chin-to-crown height equal to 34% of the frame height. Crop at the upper chest,
including both shoulders in full with clear space outside them on all four sides.
Flat background of a single solid violet-black #180927, edge to edge.

Square, 1024x1024.
```

**Must not contain.** As the person's portrait entry, and: nothing within 12% of any frame
edge — the radial mask fades everything outside a 48% × 54% ellipse and any detail out
there is deleted.

### 6.2 · `texture-paper.webp` — 1 file

**[inference].** `GAME-SEQUENCE.md` §4 gives the reflection node's ground as "paper,
warmer" and its distinguishing feature as the meters being absent. Four reflection nodes
per run, all of them on a flat `--color-surface-desk` `#fdfaf3`. A seamless grain tile is
the paper-register answer to "not just solid colours", and it is the cheapest asset in this
document.

| | Spec |
|---|---|
| Filename | `texture-paper.webp` |
| Size | **512 × 512, seamlessly tileable** |
| Format | WebP q70, **≤ 12 kB** |
| Where | `background-image` + `background-repeat: repeat` on the reflection node's card, at low opacity. Reusable on every paper surface |

```
<<PAPER BASE>>

A seamlessly tileable paper texture and nothing else. Uncoated warm laid paper at
#fdfaf3 with very fine visible fibre, faint irregular tooth, and the softest possible
unevenness in tone between #fdfaf3 and #f7eee0. No fold, no crease, no tear, no edge,
no stain, no watermark, no deckle.

The tile must repeat seamlessly on all four edges with no visible seam and no
recognisable feature that would read as a repeat when tiled.

Square, 512x512.
```

**Must not contain.** §1.6, and: no seam, no directional grain, no visible motif, no
repeating mark, no shadow, no vignette, no colour cast, no violet.

**Composition constraint.** No composition — any feature large or distinct enough to be
recognised becomes a visible repeat the moment it tiles. Contrast range must stay inside
`#fdfaf3`–`#f7eee0`, which is under 1.05:1, so it cannot affect any measured text contrast
on the paper register.

---

## §7 · Video

> The client asked: "Think of any videos also that we can add."

**Recommendation, in one sentence: ship no video inside the run, animate the eight
cut-scene plates instead with Ken Burns and two-layer parallax in CSS at zero new asset
cost, and commission at most one 45–60 second captioned trailer that lives outside the
game entirely, on the LMS tile and in the launch email.**

Here is the reasoning, because "no" is only a useful answer with the arithmetic attached.

### 7.1 · What the marquee gamified-learning products actually do

Neither of the two vendors named in `SCREEN-TAXONOMY.md` uses video as a teaching surface.

**Gamelearn** builds 3D-modelled graphic adventures delivered in HTML5 — *Merchants*
(negotiation), *Triskelion* (time management, structured as 21 simulated days) and
*Pacific* (leadership, which took over a year and a reported €2 m). Their video output is
**marketing**: the demo reels on YouTube. The product itself is rendered, not filmed.

**Attensi** builds real-time 3D simulations with AI role-play and positions itself
explicitly *against* video, arguing that gamified training "provides real understanding
that more passive webinars or training videos simply can't match", and citing 26+ plays per
module. A rendered frame depends on the learner's choice; a video frame cannot.

That is the pattern and it is not an accident. **In an interactive product, video is the
one asset that cannot respond to the player.** Both vendors spend their budget on the thing
that can.

### 7.2 · Where video earns its place, and it is a real place

The strongest case for video is **behaviour modelling**, and it is well founded:
Bandura's social-cognitive account of observational learning, and a body of video-modelling
research finding faster skill acquisition and better generalisation than live modelling.
The thing a still image cannot do is show *how a person behaves over time* — the pause
before an answer, the tone, the face that does not agree with the words.

GPL's entire subject is conversations. So the case is genuinely live, and it points at
exactly one slot: **after the player has committed**, showing a real practitioner handle
the same moment. That is the Thiagi transfer question `SCREEN-TAXONOMY.md` §3 already
identifies as missing — "how does this relate to the real world?" — and it belongs on the
chapter debrief or a reflection node, never on a brief and never on a decision.

### 7.3 · Where video is a liability — five specific costs

**1 · File size. This is the decisive number.** A background or ambient loop is
conventionally budgeted at **5–8 MB**; a still is 100–200 kB. GPL's entire JavaScript and
CSS bundle is **about 173 kB gzipped**, budgeted per origin since D-070. **One 6 MB loop
is roughly 64× the whole application.** There is no version of that trade that is worth an
atmosphere.

**2 · It puts reading on a clock, which breaks a stated rule.**
`SCREEN-TAXONOMY.md` rule 8 is "Reading is never on a clock", borrowed from *Papers,
Please*, where booth prep is untimed by design. `GAME-SEQUENCE.md` rule 4 repeats it. Video
is a clock by construction. A video brief is therefore not a stylistic preference against
the design — it is a rule violation, and it lands on the 17 briefs, which are 22% of the
run.

**3 · Accessibility obligations compound.** GPL holds WCAG AA throughout; `index.css`
measures every token pair and names its floor at 5.22:1. Adding one piece of synchronised
media adds **1.2.2 Captions (Level A)**, **1.2.3 (Level A)** and — the expensive one —
**1.2.5 Audio Description at Level AA**, where a transcript alone no longer suffices. Audio
description is a second recorded track, written and voiced, re-done every time the clip
changes.

**4 · An ambient loop costs the mode grammar.** WCAG **2.2.2 Pause, Stop, Hide** is Level
A and applies to anything moving automatically for more than five seconds. A looping
backdrop on the hub or the map therefore needs a visible pause control. But
`SCREEN-TAXONOMY.md` §1's central finding is that **mode is carried by chrome quantity,
monotonically** — and the navigate surfaces are meant to read as "a change of world".
Bolting a media control onto them adds chrome to the two screens whose whole argument is
that they have their own. `index.css` has already deleted two animations for failing 2.2.2
("an infinite shimmer with no pause control is a 2.2.2 failure at Level A whether or not it
looks nice"); a video loop is the same failure, larger.

**5 · Cost to re-record when content changes, and it hits this repo harder than most.**
Industry practice is to budget **15–20% of original development cost annually** for
maintenance, with localisation at roughly **$2,000–$8,000 per language for text alone** and
dubbing described as highly labour-intensive. GPL's first rule is that content lives in one
file and that adding or editing a mission must never require touching the engine. **A video
of a beat welds the prose to a recorded take**: change one sentence in `story.ts` and the
video is silently wrong, with no test that can catch it. That is a direct contradiction of
the repository's central design rule, and it is the argument I would lead with to the
client.

### 7.4 · Is a looping ambient background video worth it over a still?

**No.** It is 5–8 MB against 80 kB, it needs a pause control that costs the mode grammar,
it needs a poster still anyway (so you generate the still regardless), it needs a separate
static fallback on mobile, and `prefers-reduced-motion` has no graceful substitute for it
except — again — the still. You pay four times to arrive back at the asset you already had.

### 7.5 · What to do instead: animate the stills

An animated still is a legitimate answer here, not a consolation. Three techniques, all
CSS, all zero new assets:

- **Ken Burns on the cut-scene plate.** `transform: scale(1.00) → scale(1.06)` over 18 s,
  `linear`, no loop. 1920 px of source into a 1440 px frame means the 6% is real pixels,
  not upscale. The plate is already at `opacity: 0.3` behind a scrim, so even a visible
  seam would not be visible.
- **Two-layer parallax.** The plate and the composited figure are already separate elements
  in `cutscene.tsx`. Move them at 0.4× and 1.0× against pointer position, clamped to ±8 px.
  That is the "something must look different after every click" rule from `ART-BRIEF.md` §7
  satisfied for the cost of one transform.
- **Grain, already specified in-image** in §1.4 and §3. `cutscene.tsx` already layers a
  4 px diagonal repeating gradient over the figure and records that 52%/3 px read as a
  glitched hologram while 24%/4 px reads as a print treatment — so the amplitude question
  is already answered in the repo.

**Cost: 0 new files, roughly 0.4 kB of CSS, no new runtime dependency.** And the
implementation pattern is already in the file: `cutscene.tsx` writes its motion *inside*
`@media (prefers-reduced-motion: no-preference)` rather than declaring it and overriding
it, so the reduced-motion default is the final state and the animation is the addition.
Follow that; it is the one detail that makes this safe to ship.

### 7.6 · The one video I would actually commission

**One 45–60 second trailer, outside the game.** Not a beat, not a background, not a
cinematic — the thing that gets someone to press start. It sits on the LMS tile, in the
launch email and in the internal comms deck. It is the only place video's real strength
(getting attention before anyone has committed attention) applies, and it is the only place
where being uninterruptible costs nothing.

**Conditions I would attach:** burned-in **and** sidecar captions (1.2.2); a written
transcript; an audio-description track **or** a script written so that nothing visual is
load-bearing, which is the cheap way to satisfy 1.2.5 and is entirely achievable for a
trailer; no autoplay; no audio on by default; and it must be built from the eight cut-scene
plates you are already generating, so that when the content changes, only the voiceover is
re-cut.

**Explicitly not recommended, and why, so nobody re-proposes them:** talking-head
introductions from an executive sponsor (obsolete within a reorganisation and re-recording
means booking the executive); recorded scenario dramatisations of the beats (welded to
`story.ts`, and it is the 2.2.2 and "reading on a clock" violation); a video-based m9a
rebuttal beat (the whole point of apply/rebuttal is that the player controls the pace while
searching stored evidence); any looping ambient background anywhere.

### 7.7 · Sources for §7

Attensi on gamified simulation versus "passive webinars or training videos", and its 26+
plays per module · Gamelearn's 3D-modelled HTML5 titles *Merchants*, *Triskelion* and
*Pacific*, and *Pacific*'s reported year-plus and €2 m build · W3C WCAG 2.2, success
criteria 1.2.2 Captions (A), 1.2.3 (A), 1.2.5 Audio Description (AA) and 2.2.2 Pause, Stop,
Hide (A) · industry background-video budgets of 5–8 MB against 100–200 kB for a still, and
the 720p / 10–30 s loop convention · eLearning maintenance at 15–20% of original build cost
annually, and localisation at roughly $2,000–$8,000 per language for text alone · Bandura's
social-cognitive account of observational learning and the video-modelling literature on
acquisition and generalisation.

**Flagged as unverified:** no published source gives a video-to-still engagement figure for
a narrative business simulation specifically, and the video-modelling evidence base is
drawn largely from social-skills and clinical education rather than from corporate soft
skills. The recommendation in §7 is a judgement built on those inputs, not a finding copied
from one.

---

## §8 · Generation order

Cheapest-risk first, and each step independently useful. Two anchors, then the technically
constrained but artistically empty plates, then the plates with subject matter, then faces
last — because a face is the highest-variance generation in the set and you want the style
locked before you judge one.

| # | Do | Files | Risk / why here |
|---|---|---|---|
| 1 | **`cut-ch1-city.webp` — the anchor.** Iterate until approved | 1 | Highest iteration cost; everything downstream depends on it. Do not start anything else |
| 2 | **`stage-hub.webp`** | 1 | Lowest artistic risk in the set — it has no subject. Its job at this point is to **validate the technical constraints in a browser**: the `#2e1a43` ceiling, the ≤80 kB budget, and the `.webp` wiring |
| 3 | `stage-map.webp`, `stage-recognition.webp` | 2 | Variants of #2 with no geometry, so they cannot drift |
| 4 | `stage-debrief.webp` | 1 | An **edit** of `stage-map.webp`, not a fresh prompt |
| 5 | `cut-ch2` · `cut-ch3` · `cut-ch4` · `cut-ch5` | 4 | Anchor + delta. Locations only |
| 6 | `cut-turn-rival` · `cut-turn-award` · `cut-turn-resignation` | 3 | The three hardest compositions — an absence rendered with no people in frame. Do them with four approved siblings behind you, not before |
| 7 | **Sarah Lim character sheet.** Approve. Not shipped | 0 | Anchor 2 |
| 8 | `portrait-sarah` + `figure-sarah` | 2 | Two crops, one approved face |
| 9 | `portrait-marcus` + `figure-marcus`, `portrait-foyle` + `figure-foyle` | 4 | |
| 10 | Tier 2: the four colleagues, portraits + figures | 8 | The batch to cut if budget bites — but see §5.5 |
| 11 | `texture-paper.webp` | 1 | Trivial, and nothing depends on it |
| 12 | **One post-process pass over all 27.** Same levels, same grade, same grain | — | The cheapest step in the document and the one that rescues a mismatched set |

---

## §9 · Placeholder guidance

**Two files let us wire and verify everything before the other 25 exist.** Both are
throwaway.

**1 · `stage-hub.webp` — a flat field of `#221338` noise at 2048 × 1152.** No art required;
generate it in any tool in a minute. What it proves:

- That the `.webp` filename wiring works end to end and `artUrl()` resolves.
- That the `#2e1a43` brightness ceiling is real **in a browser** — put the placeholder in,
  screenshot the hub, and check that the 1 px `--color-stage-line` hairlines are still
  visible. This is the check `D-010` exists to insist on: typecheck and 45 tests were green
  while the primary button rendered dark text on purple, and only the screenshot caught it.
- That the plate does not fight the 96 px numerals or the three meters.
- That it **fails `tokens.test.ts`** — see §10. Finding that out with one throwaway file is
  the point.

**2 · `cut-ch1-city.webp` — any 1920 × 1080 dark image with an obvious bright blob at
(77%, 45%).** Deliberately wrong, so the occlusion is visible. What it proves:

- That the left-50% calm zone is correct at the verified **1440 × 900** viewport, by
  screenshotting the chapter-one interlude.
- That the figure at (77%, 45%) sits where this document says it does, because the blob
  should disappear behind it.
- That the plate survives the **390 × 844** phone pass, where the figure is hidden and the
  type column goes full width over the whole plate.

Run both through `npm run verify`, which plays a complete run in a real browser and
screenshots all 31 beats. Per `CLAUDE.md`, it is not optional — and for artwork it is the
only check that exists at all.

---

## §10 · Preconditions in code, and four defects found while writing this

None of these are art tasks. All four are things the generator will hit if nobody fixes
them first.

### 10.1 · **BLOCKER — dropping the new files into `public/art/` will fail the build**

`src/engine/tokens.test.ts` asserts:

```
it("ships no asset that nothing references", () => {
  const orphans = artFiles.filter((name) => !storySource.includes(`"${name}"`));
  expect(orphans).toEqual([]);
});
```

It scans **`src/content/story.ts` only**. But:

- The 8 `cut-*` plates would be selected by `CHAPTER_STAGE` in `src/ui/cutscene.tsx`, which
  the test does not read.
- The 4 `stage-*` plates are not story at all — the hub, map, recognition board and chapter
  debrief sit outside the fiction's clock, so they cannot be referenced from `story.ts`
  even in principle.
- The 7 `figure-*` files are chosen by the renderer.

So **19 of 27 new files would be reported as orphans and the build would go red**, for
files that are wired correctly.

Two changes, and `CLAUDE.md` decides the shape of the first one. Its rule is that content
lives in `story.ts` and that if adding content requires touching `src/engine`, "the engine
is missing a capability — add it deliberately." This is exactly that case:

1. Add an optional `plate?: string` field to `Interlude` in `src/engine/types.ts` and set
   it per interlude in `story.ts`. Content then owns which plate a chapter opens on, and
   `cutscene.tsx`'s `CHAPTER_STAGE` presentation-default table can go — its own comment
   already says it exists only "because content has no field for either and a UI file may
   not invent story".
2. Widen the orphan scan in `tokens.test.ts` to include `src/ui/*.tsx`, so the four
   `stage-*` plates and the `figure-*` files are found where they are actually named.

### 10.2 · `hero-retail-exterior.webp` and `hero-storefront-wide.webp` are byte-identical

Same MD5 (`6ff03e41…`), same 69.4 kB, same 800 × 472. Two different missions show the same
picture under two different names, and one of them is dead weight in the bundle.

The `artwork` test catches exactly this class of bug — its comment records that five
portraits shipped as crops of one woman — but it asserts distinctness **only for
`portrait-*`**. The same mistake, one prefix over, is invisible to it. Widening that
assertion to every prefix is a one-line change and would have caught this.

### 10.3 · The existing hero photographs contain baked-in text and a fictional logo

`docs/art-contact-sheet.png` shows the word **ORION** rendered into the shop fascia of at
least four heroes, and a legible headline ("A more connected retail future") in
`solution-screen`. That is text in an image: unlocalisable, unsearchable, invisible to a
screen reader, and directly contrary to the "no text, no logos" line that has been in
`ART-BRIEF.md` §1 since it was written.

It also means the seven heroes are a **blue-grey photographic** register while these 27
files are a **violet painted** one. `ART-BRIEF.md` §1 says "if a generation comes back
blue-grey, re-roll it", and the shipped set is blue-grey. **This is the one question I
cannot answer without the client:** either accept a mixed register (painted cut scenes and
painted faces, photographic corner-bleeds on the mission screens) or add a Tier 4 of
**11 files** to bring `hero-*`, `solution-*` and `thumb-*` into the same language. I have
not specified Tier 4 here; it is roughly a day's generation once the anchor is approved.

### 10.4 · `ART-BRIEF.md` §1's palette table and §3's hair hexes are stale

The paper ramp (`#fdfbf7 #f6f2ea #efe9de #e6dfd1 #ddd5c5`) and the ink ramp
(`#5e5462 #403443 #221925`) in that table predate the enrichment recorded in `index.css`.
Anyone pasting `ART-BRIEF.md` §3 verbatim will generate Priya with `#221925` hair on a
palette whose darkest ink is `#1e1621`. §1.2 and §5.5 of this document carry the live
values. The two-line fix is to add a pointer in `ART-BRIEF.md` §1 to this file.

---

## Where the files go

```
public/art/
  cut-<slug>.webp         8 files, 16:9, 1920x1080, <=140 kB
  stage-<surface>.webp    4 files, 16:9, 2048x1152, <=80 kB, no pixel above #2e1a43
  portrait-<person>.webp  7 files, square, 512x512, <=40 kB   (3 new + 4 regenerated)
  figure-<person>.webp    7 files, square, 1024x1024, <=90 kB (optional)
  texture-paper.webp      1 file,  square, 512x512 seamless, <=12 kB (optional)
```

**WebP only.** `artUrl()` in `src/ui/shell.tsx` hard-codes the extension; a PNG dropped in
here does not render and does not error. A wrong filename is the one mistake that costs a
re-run, so check the table before you export, not after.
