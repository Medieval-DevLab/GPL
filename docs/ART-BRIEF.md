# GPL — art generation brief

> ## ⚠ SUPERSEDED — do not generate from this yet
>
> **The art ask dropped from 30 files to 3.** Written for a visual-novel staging: painted
> rooms, character sprites, a textbox across the bottom. That direction was replaced hours
> later by staging dialogue on **the artefacts of the work** — a call surface and a chat
> surface in our own design language — because a visual novel is a genre transplant onto a
> consulting game, and because a call tile needs a headshot in a rounded rect rather than a
> bottom-anchored sprite with three expressions.
>
> **What is still wanted (optional, 3 files):** headshots for **Sarah Lim**, **Marcus
> Reed** and **Declan Foyle**, matched to the four existing colleague portraits in
> `public/art/portrait-*.webp`. Square-ish, head-and-shoulders, same lighting and grade as
> those four. Filenames `portrait-sarah.webp`, `portrait-marcus.webp`,
> `portrait-foyle.webp`.
>
> Use §1's style string and §3's locked attributes for those three people — those parts are
> still good. **Ignore §2's sprite specs, §4's nine backgrounds, and the three-expression
> set entirely.**
>
> And they are genuinely optional: a real call shows **initials in a circle when the camera
> is off**, which the game already renders for these three. Absent portraits read as
> camera-off, not as missing art.

---


**For the person generating these assets.** Everything here is a spec you can paste into
an image model. Park the finished files in `public/art/` using the exact filenames in the
tables; the code picks them up by name, so a wrong filename is the one mistake that costs
a re-run.

**Total ask: 21 character sprites + 9 backgrounds = 30 files.** That is the whole thing.
The counts are argued for below rather than guessed, and Phase 2 is explicitly optional.

---

## 0. The one rule, before you generate anything

**Generate the style anchor first, approve it, then never re-describe the style again.**

In this order:

1. Generate `scene-client-boardroom` (§4) on its own. Iterate until you like it. **That
   image is now the style contract for the other 29.**
2. Generate Sarah Lim's **character sheet** (§3), using the anchor as a style reference.
   Approve it. That sheet is the contract for the other six people.
3. Everything after that is: anchor image + character sheet + *describe only what changes*.

Why that order matters. Across five compared consistency methods, a detailed prompt with a
fixed seed holds a character about **60% of the time and breaks the moment you change any
word**, while attaching a reference image and describing only the delta holds **~80–85%
across 20+ generations**. So every prompt below is written as a *supplement to a
reference*, never a substitute for one.

**What actually makes 30 images look like one production** — and it is almost never the
faces:

- **One style string, reused verbatim.** §1. Do not paraphrase it between runs.
- **Identical crop point, eye-line and key-light side on every character.** Mismatched
  eye-lines are the thing that reads instantly as "different games" the moment two sprites
  stand on one background.
- **One post-process pass over the whole set at the end** — same levels, same grade, same
  grain. That rescues a mismatched set faster than re-rolling individual images.

---

## 1. The style string

Paste this verbatim into every generation, character and background alike:

```
Editorial illustration, hand-painted digital gouache with visible brush texture and
soft grain. Confident tapered linework, no outlines on skin. Restrained warm-paper
palette with a single deep-violet accent. One hard key light with visible falloff and
long soft shadows. Muted, slightly desaturated, film-still grade. Grounded and adult —
no cartoon proportions, no flat vector shapes, no corporate-Memphis illustration, no
gradients-as-decoration, no lens flare, no text, no logos, no watermark.
```

Two things that string is deliberately doing:

- **"no corporate-Memphis illustration"** is there on purpose. Flat rounded-limb business
  illustration is the exact trap for a consulting game — it is the house style of every
  SaaS landing page and the visual cousin of the PowerPoint feel we are trying to escape.
  (*Office Pace* uses corporate Memphis knowingly, as a foil for a monochrome
  protagonist. Used unknowingly it just looks like clip art.)
- **"one hard key light"** does the heavy lifting on making meeting rooms interesting. It
  is the *Papers, Please* lesson: restrict the palette, light it harshly, and the one
  saturated thing on screen carries all the meaning.

### Palette — use these hex values, not colour names

| Role | Hex | Where it belongs |
|---|---|---|
| Deep violet (primary accent) | `#460073` | one object per scene, maximum — a chair, a folder, a tie, a screen glow |
| Bright violet (rare highlight) | `#a100ff` | a screen, a lit edge. Almost never a large area |
| Mid violet | `#c2a3ff` | shadow tint in violet-lit scenes |
| Pale violet | `#e6dcff` | cool bounce light |
| Paper, light to dark | `#fdfbf7` `#f6f2ea` `#efe9de` `#e6dfd1` `#ddd5c5` | walls, paper, most surfaces |
| Warm grey | `#7b7565` | furniture, mid-tones |
| Ink | `#5e5462` `#403443` `#221925` | darkest shadows, hair, suit fabric |

These are the game's live interface tokens, so art generated to them sits on the UI
without a colour clash.

**The palette is warm paper plus violet. There is no blue and no teal anywhere in this
game** — if a generation comes back blue-grey, re-roll it.

---

## 2. Technical specs

### Character sprites

| | Spec |
|---|---|
| Filename | `sprite-<person>-<expression>.png` — e.g. `sprite-sarah-concerned.png` |
| Size | **1024 × 1536 px** (2:3). If your tool does 2×, deliver 2048 × 3072 |
| Format | **PNG with real alpha.** No matte, no white box, no baked-in drop shadow |
| Crop | **Waist-up.** Top of head ~6% down from the top edge; bottom edge cuts at the hip |
| Anchor | **Bottom-centred.** Figure fills the full frame height — trim dead transparent space to the edges |
| Eye-line | **28% down from the top of the frame, for every single character** |
| Key light | **From the left, every time** |
| Pose | Upright, lighting-neutral, three-quarter turn toward camera. One pose per person |
| Gaze | Toward the viewer |

Two of those are load-bearing and worth not improvising on:

- **Waist-up, bottom-anchored, cut at the hip.** The sprite is deliberately taller than
  its visible area so the hips sit *behind* the dialogue box instead of the figure
  floating above it. "Sprites cut off at the textbox edge" and "mismatched visual scale
  between characters and backgrounds" are the two most-cited faults in amateur visual
  novels.
- **Minimal transparent padding.** Empty pixels inside the frame waste texture and, more
  importantly, break bottom-anchoring — the figure appears to hover.

### Backgrounds

| | Spec |
|---|---|
| Filename | `scene-<place>.webp` (PNG is fine, I will convert) |
| Size | **2560 × 1440 px** (16:9) |
| Composition | **Off-axis one- or two-point perspective from seated eye height.** Never flat-on, never centred — flat elevation is precisely what makes a meeting room read as a slide |
| Lower third | **Compositionally calm.** No focal detail, no faces, no text below the halfway line |
| People | **None.** Backgrounds are empty rooms; the cast is composited on top |

The calm-lower-third rule is not fussiness. The dialogue box covers roughly the **bottom
26%** of the frame and the sprites stand in front of the lower half, so any detail down
there is either hidden or fighting the text. Professional practice is to design the
background *around* the textbox and mock the composition up before commissioning art —
which is what this brief is.

---

## 3. The cast — 7 people, 3 expressions each = 21 sprites

### Why three, and exactly these three

The game already sorts every outcome into one of three tones in code — `strong`, `mixed`,
`hard`. So the expression set is not a guess: it maps 1:1 onto a distinction the content
already makes, which means the renderer picks the right face with no new authoring.

| Expression | Fires on | Reads as |
|---|---|---|
| `neutral` | every briefing, and `mixed` outcomes | attentive, unreadable, waiting |
| `pleased` | `strong` outcomes | quiet approval. **Not** a grin — a professional who is satisfied |
| `concerned` | `hard` outcomes | a problem being weighed. **Not** anger, not shock — these are adults at work |

Eight expressions per character is the figure for full visual-novel productions. For a
short game, **one pose and three to four expressions per character is the realistic
floor**, and three is what our content can currently address. Phase 2 adds a fourth.

### Locked attributes

Fix these per person and never vary them. Put the hex codes in the prompt every time.

#### Our team — the four colleagues who brief the player

**`priya`** — Priya Sharma, Client Growth Lead. Indian woman, late 30s. Shoulder-length
black hair (`#221925`), tucked behind one ear. Charcoal blazer over a cream shirt
(`#f6f2ea`). One thin gold necklace. Brisk, direct, slightly impatient.

**`riya`** — Riya Kapoor, Engagement Director. Indian woman, mid 40s. Dark brown hair
(`#403443`) in a low bun. Deep violet blazer (`#460073`) — **she is the one person who
wears the accent colour**, because she is the most senior voice in the game. No jewellery.
Composed, watchful, has made the mistake herself.

**`arjun`** — Arjun Mehta, Solutions Director. Indian man, early 40s. Short black hair,
neat full beard. No tie, top button open, mid-grey shirt with the sleeves pushed up. Wire
glasses. Sceptical, likes being argued with.

**`aisha`** — Aisha Khan, Delivery Lead. South Asian woman, early 30s. Black hair in a
high ponytail. Deep green shirt, sleeves rolled, lanyard. Direct, slightly weary,
concrete. The one who inherits every promise.

#### The client — Orion Retail Group

**`sarah`** — Sarah Lim, Chief Transformation Officer. East Asian woman, early 50s. Sharp
grey bob (`#7b7565`). Immaculate ivory blazer. Reading glasses on a chain. **She is the
sponsor and she is under pressure from her own board** — her `concerned` face is the most
important single expression in this set. Warm, and running out of room.

**`marcus`** — Marcus Reed, Operations Director. White man, late 40s, heavy-set,
close-cropped greying hair. **No jacket** — pale shirt, sleeves rolled, ID badge clipped
at the belt. He is the only person in the cast who visibly works in a building rather
than an office. Guarded; has been promised things before.

**`foyle`** — Declan Foyle, Procurement. White man, 50s, thinning hair, rimless glasses.
Cheap, slightly ill-fitting grey suit, buttoned. Holds a clipboard or folder. **Not a
villain** — a man with a savings target and a scorecard nobody has helped him hit. Tired,
procedural, fair.

### Prompt template

Replace `<<…>>`. Keep everything else byte-identical between runs.

```
<<STYLE STRING FROM §1>>

Waist-up character portrait of <<LOCKED ATTRIBUTES FROM ABOVE>>.
Three-quarter turn toward camera, upright, standing, looking at the viewer.
Expression: <<neutral | quietly pleased | concerned, weighing a problem>>.
Hard key light from the left with visible falloff.
Eye-line 28% down from the top of the frame. Cropped at the hip.
Fully transparent background. No background elements, no shadow on the ground,
no props except those named. No text.
```

### Deliverables — 21 files

| | `neutral` | `pleased` | `concerned` |
|---|---|---|---|
| Priya | `sprite-priya-neutral.png` | `sprite-priya-pleased.png` | `sprite-priya-concerned.png` |
| Riya | `sprite-riya-neutral.png` | `sprite-riya-pleased.png` | `sprite-riya-concerned.png` |
| Arjun | `sprite-arjun-neutral.png` | `sprite-arjun-pleased.png` | `sprite-arjun-concerned.png` |
| Aisha | `sprite-aisha-neutral.png` | `sprite-aisha-pleased.png` | `sprite-aisha-concerned.png` |
| Sarah | `sprite-sarah-neutral.png` | `sprite-sarah-pleased.png` | `sprite-sarah-concerned.png` |
| Marcus | `sprite-marcus-neutral.png` | `sprite-marcus-pleased.png` | `sprite-marcus-concerned.png` |
| Foyle | `sprite-foyle-neutral.png` | `sprite-foyle-pleased.png` | `sprite-foyle-concerned.png` |

**Workflow per person:** generate a **character sheet first** — front / three-quarter /
side plus the three expressions in one image — approve it, then use that sheet as the
reference for the three final sprites. The sheet is not shipped; it exists so the three
sprites are the same person.

If you train a LoRA instead, use **15–30 deliberately varied images** (several angles,
several lights, several expressions). Thirty near-identical frontal shots produce a
character who can only ever be drawn frontally.

---

## 4. Backgrounds — 9 scenes

Each maps to beats that already exist. The "used by" column is why this is 9 and not 22.

| # | Filename | The room | Used by |
|---|---|---|---|
| 1 | `scene-client-boardroom.webp` | **THE STYLE ANCHOR — generate this first.** Orion's main boardroom. Long table, twelve chairs, one wall of glass with city beyond, blinds half-drawn throwing hard stripes across the table | m1, m9, m7b, m9a |
| 2 | `scene-client-office.webp` | Sarah's own meeting room. Smaller, warmer, one round table, a shelf of awards, her coat still over the back of a chair | m5, m8, m10c |
| 3 | `scene-our-office.webp` | Our open-plan floor. Desks at angles, monitors, a pinboard, plants that need water. Daytime | int-1, int-2, m4 |
| 4 | `scene-war-room.webp` | Our meeting room mid-argument. Whiteboard covered in a half-finished diagram, sticky notes, chairs pushed out, three coffee cups | m7, m5b, m10b, int-3 |
| 5 | `scene-store-floor.webp` | Orion store interior, from the shop floor. Rails of clothing, a till counter mid-shift, overhead track lighting | m6, m6b |
| 6 | `scene-store-front.webp` | Orion storefront from the pavement opposite. Wet ground, reflections, early evening, a bus going past out of focus | m2, m3 |
| 7 | `scene-procurement.webp` | Foyle's room. Deliberately drab — strip light, stacked ring binders, one small window, a table too big for the room | m9a, int-4 |
| 8 | `scene-back-of-house.webp` | Marcus's world. Stockroom and receiving bay, cage trolleys, a wall-mounted terminal running an old interface, concrete floor | m10, m10c |
| 9 | `scene-our-office-night.webp` | **A variant of #3**, after hours. Same room, same angle, lights off except one desk lamp and the city outside | int-5, m9b, ending |

**Do #9 as an edit of #3, not a fresh prompt.** Time-of-day variants are the standard and
cheapest way to multiply a background set, and generating it as a variation is what keeps
the geometry identical — which is the entire point of a variant.

### Prompt template

```
<<STYLE STRING FROM §1>>

Empty interior, no people. <<ROOM DESCRIPTION FROM THE TABLE>>.
Off-axis two-point perspective from seated eye height, camera turned away from the
back wall. One hard light source: <<the window / the strip light / the desk lamp>>,
with visible falloff and long shadows.
Signs of recent use: <<papers left out, a chair at an angle, a half-drunk coffee>>.
The lower third of the frame is calm and free of focal detail.
16:9. No text, no signage, no logos, no people.
```

The "signs of recent use" line is not decoration — a room that looks like someone just
left it is the difference between a location and a stock photograph. Same for the
off-axis camera: a meeting room shot flat-on and centred reads as a slide every time.

---

## 5. Where to park the files

```
public/art/
  sprite-<person>-<expression>.png     21 files, transparent PNG, 1024x1536
  scene-<place>.webp                    9 files, 16:9, 2560x1440
```

Drop them in and tell me. `tokens.test.ts` already fails the build on any art file nothing
references and on duplicate portraits, so a mis-named or accidentally duplicated file gets
caught rather than silently shipped.

**Placeholders are fine.** If you want to see the dialogue pages working before the real
art exists, give me *any* two sprites and one background at the right dimensions and I
will build against those, then swap.

---

## 6. Phase 2 — optional, only if Phase 1 lands well

Do not start any of this until the 30 files above are in.

- **A fourth expression per character**: `sceptical` (7 files). Twenty-one of the
  colleagues' watch-for lines are imperatives, and a sceptical face suits them better than
  a concerned one.
- **Blurred duplicates of each background** (9 files) for depth-of-field while a character
  speaks. I can also do this in CSS at zero asset cost, so this is genuinely last.
- **Two more locations**: a corridor or lift lobby for the in-between conversations, and a
  taxi or train interior for travel beats.

---

## 7. What I build when the files arrive

So you know what the 30 files buy, and that this brief is not speculative:

1. A **dialogue scene beat** — background, one or two sprites, a nameplate, a dialogue box
   across the bottom ~26%, text typed out, and a continue affordance. Bottom-anchored
   sprites; the background blurs and darkens behind the box so text stays legible.
2. **The five interludes become dialogue scenes.** They are currently chapter-title cards
   with no art at all, which makes them the cheapest possible place to start: the beats
   already exist in the story graph, so nothing needs rewiring.
3. **Dialogue scenes at the four beats where a client speaks** — the rival's move (m5), the
   price pushback (m8), the award decision (m9a) and the sponsor's resignation (m10c). All
   four already have authored client dialogue, currently rendered as a small pull-quote in
   a sidebar.
4. The existing decision screens **stay as they are.** The dialogue pages go *between*
   them. That is the structure every narrative sim uses — a scene, then a choice — and it
   is why this is an addition rather than a rewrite.

One rule I will hold the implementation to, from a developer who played 100+ visual novels
and wrote up what separates a scene from a slide: **something on screen must look
different after every click** — the sprite changes expression, or shifts position, or the
camera moves. A dialogue page where only the text changes is a slide with extra steps,
which is the problem we started from.
