# Art direction: a prestige business drama

October 2026. Supersedes the visual sections of `DESIGN-LANGUAGE.md`, `DESIGN-SYSTEM.md`,
`SCREEN-SYSTEM.md` and `VISUAL-LANGUAGE-AND-WORLD.md`. Their rules about evidence, attribution,
no outcome preview and accessibility still stand. Decision record: `D-077`.

## The problem this replaces

Seen together, the 78 screens of a full run were one composition repeated: a beige page of
bordered text boxes. Three facts explain most of it.

1. **One plane.** Everything sat on the same surface, so there was no foreground, background
   or object to handle. Depth was a 1 px border.
2. **No colour script.** All five chapters used the same warm paper and teal ink. Every act
   looked identical, so progress never registered.
3. **One layout family.** Briefs, decisions, consequences, debriefs and events were the same
   page with different words. Each chapter also used a single photograph, shown three times in
   a row.

## What was studied

Official screenshots from about 35 titles were pulled from their store pages and laid out as
contact sheets. Developer interviews and talk write-ups were read for technique rather than
taste; sources are in `D-077`. The games that informed specific decisions:

| Game | Technique taken |
|---|---|
| Disco Elysium | Dialogue in a tall column beside a visible world. Short, scannable lines. |
| Persona 5 (Atlus) | A separate layout for every menu, never a shared panel. One loud colour per act. Extreme contrast in type scale. Text readable on the first frame of a transition. |
| Citizen Sleeper 1 and 2 | State displayed as instruments (segmented clocks, ticks) placed next to the decision they bear on. |
| Suzerain | World events arrive as newspapers and documents. |
| Papers, Please; Orwell; Not For Broadcast | The tools of the job are the interface: desk, documents, stamp. |
| Hades | Characters as cut-out figures in front of the scene. A portrait is a presence, not an avatar. |
| Reigns | Persistent meters that react, without ever forecasting a choice. |
| 80 Days | The chosen option becomes part of the record; nothing previews where it leads. |
| Pixar colour scripts | Colour carries the arc: each act has its own light. |
| Schell's interest curve | Peaks need valleys. Quiet beats (reflection) must look quiet. |

The anti-patterns these developers name have all occurred in this project before: legibility
sacrificed to style (Persona's first menus), "everything is a container", and juice that wastes
time. The rules below guard against each.

## Brand system

Four colour families, and each means exactly one thing (`src/ui/styles/tokens.css`):

| Family | Values | Meaning |
|---|---|---|
| **Ink** | `#0b0e13` stage, `#161b24` → `#3d4859` raised | The room. Never carries data. |
| **Paper** | `#f4eee3`, note yellow `#ffe17a`, manila `#d8b77a` | Artefacts the player handles. |
| **Signal** | vermilion `#ff5a36` | The brand: title, logo, frames around the story, the stamp. |
| **Light** | one accent per chapter | Grades the photography, carries focus and the primary action for that act. |

Rise and fall deltas use mint `#72f0b4` and coral `#ff8f80`. They always come with ▲/▼ and a
sign, so colour never carries the meaning alone.

### The colour script

The five acts run through one working day:

| Chapter | Light | Accent | Mood |
|---|---|---|---|
| 1 · Find client | Daybreak | amber `#ffb547` | the market in the morning |
| 2 · Opportunity | Glass | cyan `#3dd6ea` | cool analysis |
| 3 · Solution | Studio | violet `#ad91ff` | the workshop |
| 4 · Deal | Boardroom | rose `#ff5f8f` | evening, pressure |
| 5 · Delivery | Floor | mint `#52e3a0` | the shop floor, first light |

Every accent is at least 6.5:1 against its ink text, and every accent used as text on the stage
is at least 6:1. The ratios were computed rather than asserted, and axe found no violations in
the browser gate. A chapter's light applies only inside that chapter. The frames around the
story (title, journey, team select, ending) use the brand signal.

### Type

| Role | Face | Why |
|---|---|---|
| Display | Archivo, condensed (wdth 62–78%), 800–900 weight | Headline weight without width: titles can be enormous and still fit. |
| Document | Newsreader | Paper artefacts read as documents, and voices read as voices. |
| Interface and body | Inter | Unchanged. The reading face the existing measurements were taken in. |
| Labels | JetBrains Mono, tracked uppercase | Case-file metadata, kickers, HUD. |

All four are SIL OFL, self-hosted in `public/fonts` and recorded in `OFL.txt`. Nothing is
fetched at runtime.

## Depth: four planes

Every screen is composed back to front (`stage.css`):

1. **World.** The location photograph, desaturated and pulled into the chapter light with a
   `color` blend, then a light bloom, vignette, animated grain and a slow 38-second drift. Five
   moods (room, dim, blur, night, vivid) set how present the room is.
2. **Cast.** Background-removed figures of the same licensed portraits, rim-lit in the chapter
   colour and seated with a cast shadow. They are framed by the face (see below).
3. **Artefacts.** Paper with tooth, tape, pins, polaroids, sticky notes, index cards, folders,
   phones, a cork board, a planning wall, a stamp.
4. **HUD.** Glass, always on top: brand, chapter, an 18-tick progress strip grouped by act, and
   tools. The three business indicators appear in the HUD only where they explain something:
   on consequences, chapter debriefs and the journey. Over a brief or a decision they would be
   dashboard furniture and a scoreboard to optimise (G9; the original scope contract).

### Framing people by the face

The seven source photographs are cropped very differently. Priya is nearly full length; Sarah
is head and shoulders. At equal heights they read as a giant and a child. Each cut-out's face
box was measured with OpenCV's YuNet detector and stored in `CUTOUT_FRAME`. A screen asks for
"face here, this big", and the figure is scaled to that. A figure's base never floats: a close
crop sits lower in the frame, as nearer the camera.

## Screen families

Each kind of beat has its own composition. Only the question header and the command bar are
shared, so the player always knows where to look and what commits.

| Beat | Composition |
|---|---|
| Title | A cast poster over the city at dusk; the five acts as a light strip. |
| Team select | Three tall cut-corner cards; the chosen one floods with the brand colour. |
| Journey | A "season" of five skewed episode panels, each graded in its own light. |
| Chapter open | The one screen flooded with the chapter colour. Mixed-voice title type, with the guide standing in the scene. |
| Brief: paperwork | A case file, a polaroid, a colleague's sticky note and an index card of questions. |
| Brief: call | An incoming call ringing, with your notes beside it. |
| Brief: messages | A phone with the messages arriving, beside the context. |
| Brief: argument | The person you face, their challenge, and the file you keep on them. |
| Decide: table | Approaches dealt as cards; the chosen card lifts and is underlined in light. |
| Decide: board | Questions pinned to a cork board around the client, with red string to what you chose. |
| Decide: plan | Components as magnets on a planning wall. |
| Decide: chat | The person in the room; the thread in a column; your replies as outgoing bubbles. |
| Decide: call | The speaker on camera with captions and your colleague's aside; your lines in a column. |
| Decide: case | Across the table from the person to persuade; your record in a folder; each argument shows what it is built on. |
| Consequence | Your choice stamped; the deal's position counts up on dials; what happened; **why it landed this way**, including what the nearest other outcome needed; then your colleague, afterwards, in their own words with nothing captioned "lesson". |
| Story turn | The artefact it would arrive as: a trade-press front page, a lock-screen email, an internal memo. |
| Reflection | Night, one lit window, a notebook page. Deliberately the quietest screen in the game. |
| Debrief | "Closed" stamp; the act's decisions as a chain of filed cards; how the act moved the deal. |
| Ending | A cover with the verdict and final position, then the report: causal threads, a timeline coloured by act, reflections, the plan. |

## Motion and feedback

- **Easing.** Expo-out (`cubic-bezier(.16, 1, .3, 1)`) for arrivals; a small overshoot
  (`.34, 1.56, .64, 1`) for things that land, such as cards and stamps. Never linear.
- **Entrances** are staggered by role: the headline slams in, cards are dealt, paper slides
  in, the cast walks in, the stamp lands, the chapter title wipes.
- **Screen changes** use the View Transitions API where it exists. On commit, the chosen card
  morphs into the stamped card on the consequence screen.
- **Numbers count.** On a consequence, the HUD and dials count from before to after, under one
  wash in the chapter light. The wash is not coloured by outcome tone: a mint/coral flood graded
  the decision before a word was read (pedagogy audit, 8 October).
- **Reduced motion** (the system setting or the in-game preference) shows the finished screen
  with no animation. The resting state is the CSS default, so nothing depends on an animation
  completing.

### Sound

Synthesised with Web Audio; there are no audio files. Four cues: select, page, stamp and
shutter. Every consequence gets the same page cue. Rise and fall cues were cut because a
verdict sound is a buzzer. Sound is **off by default** and nothing depends on it. The game is played at desks,
and constant interface sound is an irritant its own sources warn about.

## Rules that keep this from decaying

- A new beat gets a composition, not a container. If it really is paperwork, it uses the
  dossier.
- Colour comes only from tokens. A chapter's light applies only inside that chapter.
- Opacity never means "missing" or "locked"; use text, a strike or a glyph. The browser gate
  failed exactly this once.
- Cut-outs are placed only through `<Cutout frame>`, never by raw height.
- Every new screen is captured at 1440×900, 1366×768 and 720×450 and looked at.

## Voice rules from the pedagogy audit (8 October)

- The interface never voices advice, praise or "the lesson". Anything that steers comes from a named colleague, with face and job title: steers, the questions card ("Aisha asks"), assessments ("Riya's read"), lessons ("Riya, afterwards") and badges ("Riya noticed").
- Liabilities (`EARNED[f].liability`) are never styled as gains, and their absence is never styled as a shortfall: no ✓, no lock, no strike.
- No per-option evidence ticks on decision cards. A row of ✓s reads as a rating. The record lives in the folder.
- The ending asks its causal question before the threads that answer it. It takes one answer, then reveals. Players can skip it and still see every thread.
