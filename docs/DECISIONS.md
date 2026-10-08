# Decision log

Every non-obvious call made while building GPL, why it was made, and what it cost.
Newest first. Superseded direction is kept rather than deleted — knowing what was rejected,
and why, is most of the value of a log like this.

---

## D-091 · The lever panel, the act-break map and the system views
`STRATEGY.md` §4 and §5 call for the interface pieces of the redesign. They were built against
the contracts (`LEVERS.md`, including the D-086 ledger) while the eight-decision script was
written in parallel, then checked on that script once it was merged. A test-only fixture
(`src/ui/__fixtures__/levers.ts`) and a dev-only preview page render the same screens against
six decisions from `STORY-V2.md`; neither is reachable from `index.html`.

**Built.**
- **The lever panel** (`screens/Levers.tsx`) replaces the plain-pick stand-in in `Scene`. It
  sits to the right of the cast column (D-090), with the inline, closable Ask in its header.
  - Each lever is a labelled row of options side by side, and their rows line up (CSS subgrid).
  - Each option shows:
    - its detail;
    - a dot with ▲ or ▼ for each bar it moves (`leverTouches`);
    - the cards it adds, as chips;
    - if it is closed, the card it needs and where that card comes from. A `none` lock names
      the card you hold instead.
  - The commit bar reads the settings back in one line.
  - Keyboard: Tab reaches each lever once, the arrow keys change its setting, a number key jumps
    to a lever, and Enter commits. The hint is read to screen readers with the commit line.
  - It takes its act's medium from `LEVER_MEDIUM` (`content/views.ts`), falling back by act:
    a research board, a staffing board, a draft contract, a delivery calendar. Only the
    stylesheet and two labels differ, so the accessible structure is the same in all four. The
    first two reuse the cork board and the planning wall. On the calendar, the promises you
    already hold are pinned above the levers with their months.
  - All eight decisions fit 1440×900 and 1918×814 without scrolling.
- **The cause-and-effect map** is the first step of every act break (`screens/SystemMap.tsx`),
  before master's guess-and-reveal:
  - three columns from `actLinks`: earlier cards that mattered here, this act's decisions, and
    where this act's cards matter next;
  - SVG curves measured from the cards, fanned out where several meet one decision;
  - "Guess first" before the Later column, unscored, revealed on a guess or on Skip.

  Every link is also said in words on its card, because the curves are hidden when the columns
  stack. Cards that nothing reads again are listed in one line rather than drawn, so all four
  act breaks fit 1440×900 and 1918×814.
- **The act's view** (`screens/Views.tsx`), beside your hand on the trail and beside the map at
  the act break:
  - **the people map** (acts 1–2): faces greyed until found, then green or red, each with the
    card that did it, from `PEOPLE`;
  - **the scales** (act 3): what we gave against what we got back, from `SCALES`;
  - **the promise calendar** (act 4): each promise card pinned to its month from
    `content.promises`. Once `state.settled` exists, each is stamped kept, late, broken or traded
    away, with its line.
- **The calendar beat names each promise.** The settle beat (`Turn`) showed the result lines
  without saying which promise each was. It now shows the calendar: each card by title, its
  month, its stamp and its line, stamped one at a time. The act break no longer repeats the
  calendar as a second step.
- **The deal on one chart** (`screens/DealChart.tsx`), on the ending:
  - Win, Worth and Deliver after every decision, from the history;
  - each promise drawn from the decision that made it to where it came due;
  - the content's ending, summary and extras above it.

  The lines differ by dash as well as colour, and a hidden table gives the figures to screen
  readers.
- **The trail adapts to the content:**
  - one row when there are ten stops or fewer, otherwise two rows split between acts by stop
    count;
  - act counts are read from `content.chapters`;
  - the panels are in story order: what just happened and its quick check (D-089), the next
    stop, then the act's view and your hand. The Go button stays in view at 1440×900.

**Decided beyond the brief, and why.**
- **`ui/ledger.ts` is the one reader of the ledger and the ending.** The views ask it rather
  than reading `state.settled` or calling `finalVerdict` themselves, so content without a
  ledger renders as before.
- **A promise no later decision reads still comes due.** `handOf` gives it its ledger month, so
  the hand and the map stop saying "not needed again" about a card that is about to be called in.
- **On a closed setting, the lock note replaces the cards it would add.** The dashed, disabled
  button already says it is closed. The note says why in one or two lines, which is what lets
  a three-lever decision with a lock fit the screen.
- **The disabled primary is pale act colour, not grey.** Grey read as broken.
- **No face badges, no hover rings, no animated lines.** They were cut to keep the stylesheet
  inside 22 kB. The only motion added is the calendar stamping one card at a time, which
  answers the beat's own action.

**Cost.**
- **Stylesheet: 21.8 kB of 22.** Rules were trimmed, and four sets of styles were deleted
  because no content uses them since the eight-decision script: the plan wall's slots, the
  evidence folder, the comparison facts and the magnet pins. The engine still supports those
  kinds; content that uses them again needs those styles back from history.
- **Interface: 32.5 kB against the old 27 kB cap.** The new screens add about 5.5 kB, a fifth of
  all interface code. They cannot fit the old cap without dropping a view the strategy
  requires, so `tools/size.mjs` now caps the interface at 33. `CLAUDE.md` still says 27; that
  line is left for the user to change.
- **The map's guess comes before master's guess.** The map can hint at which choice decided the
  act before master's question asks it. Swapping the two steps is one condition in `ActBreak`.

**Reversible:** yes. The lever panel renders only for `kind: "levers"`, the act-break map is
one step in `ActBreak`, and the views are additions.

**Amended at merge.**
- **The guess comes first.** The act break used to open on the cause-and-effect map, which draws
  the very chain the act's question asks about, so the answer was on screen before the guess.
  The order is now: the act's summary and guess, the colleague's answer, then "See how it all
  connects" to the map, which carries the spine sentence and the way into the next act.
- **The answered guess collapses.** Once answered, the guess shrinks to "Your guess: …", and the
  way on scrolls into view, so the button is never below the fold at 1440×900.
- **The interface budget** rises from 27 to 33 kB, as recorded above, and `CLAUDE.md` is updated
  to match.

## D-090 · The person you are answering is never behind a panel
The user, at a 1918×814 window, for the fourth time:
- "The image of the stakeholder is hidden behind the container."
- "The pop up doesn't disappear and covers the options."
- "The cards still look shit."

**Why it kept happening.** The causes were structural; restyling a panel never touched them:
- **Faces sat at a fixed 21% of the stage.** On a short window that is behind the question
  card.
- **Figures were anchored to the floor.** For a bust photograph (Riya's face is 42% of her
  image), that pushed the face down to about 58% of the stage, behind the dialogue box.
- **The choice panel was centred across the whole stage, over the cast.** A depth-of-field
  rule also faded and blurred everyone while you chose.

**Fixed by construction.**
- **Measured, not guessed.** The face is placed below the question card's measured bottom edge.
- **Pinned.** A new `pin` frame keeps the face at that height and sizes the figure so its lower
  edge reaches the dialogue box, where it fades out.
- **A column of their own.** While choosing, the person you are answering (the client if one is
  in the room, otherwise your colleague) stands in a reserved left column. The options start
  where that column ends, and nothing fades or blurs the person.
- **Advice in the flow.** It sits below "Your move", pushes the options down instead of
  covering them, has a close button, and closes when you pick an option.
- **Cards.** A crisp header, the line, gains and costs as green and red tags, effort and
  investment as pips, and a tinted, accent-topped selected state.
- **The top bar.** It no longer shows truncated names for other stages, and "Your record" never
  wraps.

**Cost:** the options are narrower by one column on wide screens. **Reversible:** yes.

## D-089 · Quick checks between decisions
The user asked for "quiz-type tests in between the game to simplify the stakes and make it
easier". After each decision, the journey map offers one ten-second question in one of three
formats:
- true or false;
- which bar moves;
- pick one of two or three.

One tap shows whether it was right and a one-line reason (`content/checks.ts`,
`screens/QuickCheck.tsx`).

**Why it works.** Low-stakes retrieval is one of the strongest learning effects measured
(Roediger & Karpicke 2006; Adesope et al. 2017). Elaborated feedback beats right-or-wrong alone
(Van der Kleij et al. 2015). The check also lowers the stakes: the idea is rehearsed in a
question that costs nothing before the decision that does.

**Rules that keep it honest.**
- Never graded, never stored, and it never moves the deal. D-069 warned that a marked quiz
  would bring back the score this game deleted; these checks are unmarked for that reason.
- Always skippable.
- Each check is about the idea or the world, never about which setting would have won, so it
  cannot leak an outcome.
- A test holds the answer index, the word budgets and the formats.

**Cost:** about 10 seconds per decision, optional. **Reversible:** yes.

## D-088 · Recall on return
A player who comes back to a saved run is offered a short warm-up on the welcome screen: one
question for each act they have finished, answered in their head and then revealed. It is
optional, unscored and stored nowhere.

Retrieval strengthens learning more than re-reading (Roediger & Karpicke 2006), and serious
games teach far better over more than one sitting (Clark et al. 2016). The facilitator guide
plans two sittings, and this is the in-game half of that.

**Cost:** one button on the welcome screen when a run is saved. **Reversible:** yes.

## D-087 · Comprehension is measured, not promised
`tools/comprehension.mjs` measures from the content what the newcomer audit counted by hand:
- words read per decision;
- distinct takeaways;
- decisions in total and per act;
- whether every decision is a lever decision.

It checks them against STRATEGY.md's targets: at most 150 words per decision, 4 takeaways, and
8 decisions, two per act. The 1.3.0 content measures 259 words, 53 takeaways and 18 decisions,
which is the baseline the rebuild must beat. `--strict` exits non-zero on a miss, so the meter
joins the release gate once the eight-decision content lands.

**Cost:** none to the player. **Reversible:** yes.

## D-086 · Eight decisions: the promise ledger, endings from content, and STORY-V2 as the story
The 18-decision story is replaced by `docs/STORY-V2.md`: four acts, two lever decisions each,
one idea per act. The engine gains the two capabilities the script needs, specified in the
`LEVERS.md` addendum, and the content glue, tests and release harnesses follow the new shape.
The old story is kept unchanged in `src/content/archive/story-v1.ts`. It is not imported, and
the archive is excluded from typechecking.

**Built in the engine.**
- **The promise ledger.** `Content.promises` holds the rules. Entering a beat marked `settle`
  works through every card the player holds, in month order, and lands each one void, kept,
  late or broken. The effects are applied and the results stored in `state.settled`, once per
  run, with no dice.
- **Endings from content.** `Content.endings`: first match wins, the last is unconditional, and
  extras are filtered by condition. `finalVerdict` takes the content and returns
  `{ title, summary, id?, extras }`. Content without endings keeps the built-in verdicts.
- **The record board as content** (`Content.ledger`). The built-in `LEDGER_RULES` named the first
  story's flags, and seeding those into the validator reported every one as a typo against
  the new story. `engineReadFlags(content)` replaces the constant wherever content is known.
- **`lockOf`** names what shuts a setting, including a `none` lock that is shut by a card the
  player holds ("Declan didn't want us").
- **Content fields.** `thinkAloud` (the worked example), `Chapter.idea` (the act's idea) and
  `Interlude.reveal` (what a debrief holds back until the guess).
- **Extensions beyond the contract.** These are listed in `LEVERS.md`:
  - `Conditions`, a list of conditions all of which must hold, because the results clause needs
    two `any` tests;
  - `kept` as a list of conditional lines, because the fixed price is kept by the margin or by
    the team's weekends.
- **The validator** holds the calendar, the endings, one idea per act and model-prompt-let-go
  to the rules listed in `LEVERS.md`, plus STRATEGY §2.6's reading budgets: 40 words of
  situation and 120 before the panel. Once the board is content, invisible state is an error,
  and a named card counts as visible because the hand shows it.
- **The sweep and run codes.** The sweep folds the calendar's and the endings' reads and gates
  into every dedup key. It reports every ending, extra, status and line, plus any thin lever,
  and the voices (`quotes`) now enter the key too. The rules fingerprint covers the calendar
  and the endings. `reachableExtremes` climbs each meter as well as their sum, with a beam of
  24, because greed alone understated Win and Worth.

**The script, as amended.** The learning-design review's blockers, should-fixes and nits are
applied as the coordinator gave them:
- the client lines that leaked the winning setting;
- causes that were false for some players (d3's free study split in two, the d5 results
  condition, d6 o1, and the rest);
- month five no longer assumes everyone is late, with the two new situation variants, the new
  "hid the freeze" ending and ending 3 on `promise:broken`;
- the guess comes before the reveal at every act break;
- the card titles, the broken lines that say why, the date move that now costs £100,000, and
  the one Ask line per prompted decision.

Where the script and the engine met, I decided as follows:
- **Challengers also set `start:challenger`.** `clue:rivals` can also be earned in week one, so
  on its own it cannot say which team a run started with, and the run code recovers the starting
  strength from exactly that. The board reads the marker, as it reads the other two.
- **Two endings are two rules each, with one title.** "We walked away" depends on whether the
  deal was bad. "We kept our promises, and paid for it" depends on Worth ≤ 39 or the team's
  weekends. One condition cannot say either-or.
- **d3's "checked what we knew" outcome** also hands over the complaint figures and Marcus's
  name, as the paid study does, at the same Win +2 as the outcome it split from.
- **Effects the script left open.** A late, agreed promise costs nothing. The broken results
  clause costs W−3 P−4 D−3 and sets `promise:broken`. The late fee costs P−4 and does not set
  it, because it is a cost, not a broken promise.
- **What the script does not contain, and the validator requires:**
  - the `changed` bullets, one or two per outcome, stating what the cards say;
  - 14 causal threads, each joining two outcomes on the script's own chain in the words those
    outcomes use;
  - the board positions.
- **The guesses are reflection interludes** (`guess-1` to `guess-4`), which the act break already
  asks and the debrief already records.
- **The calendar is a `turn` beat** (`calendar`) between d8 and the act 4 debrief. Award lost
  (d6) and walking away (d7) go straight to the ending, as scripted.
- **No badges.** The script authors none; the hand is the reward.

**The glue.**
- `gates.ts` has every card in the flag table, with the script's liabilities.
- `presentation.ts` has four routes, the missions filed under win, profit and deliver, the board
  positions, places for every node, the milestones, and the case file on `knows:after_sale`.
  `COMPARE` is empty.
- `STORY.stakes` is the spine.
- `firm.ts` has the four acts and the script's three "makes easier later" lines.
- Act 4 opens on `scene-chapter-5`. `ChapterNumber` is now 1–4, and `SceneNumber` keeps the five
  photographs.
- The four mockup crops only the first story used are removed from `public/art`. The asset test
  forbids shipping unreferenced art, and git keeps them.

**The interface, kept to what play needs.**
- The trail is two rows of two acts.
- The act break asks the guess and then reveals the cause, the idea and the spine.
- The calendar beat lists every card as it came due.
- The ending shows the content ending, its extras, the spine and the calendar.
- The brief speaks the think-aloud.
- The board and the HUD count read the content's board.
- "Act N of 5" is left for the merge, where master already derives it.

**Tests, adapted rather than loosened.**
- A fixture chapter of the older kinds (`kinds.fixture.ts`) is spliced into the story wherever a
  rule exists for a choice, investigation, build, dialogue or apply beat, so those rules still
  have a subject.
- The pinned numbers are re-measured and say what they now measure. The engagement gate's top
  ending is out of reach of every fixed non-reader and within reach of reading. The score
  premium is 0 against a target of 12, pinned as failing.
- `verify-game.mjs` walks away at d7 and double-clicks into d1. `lms-check.mjs` presses options
  in order, because "always the first unpressed" cycled one lever for ever.
- Suite: 395 tests, 393 passing and 2 skipped (the claim item; no thread authors one yet).
- The browser gate passes: 8 decisions, 13 screen types, no violations.

**Cost.**
- Every saved run and run code from the 18-decision story is stale. Saves say so; codes are
  refused as "a version of the story with different decisions".
- The score premium is still nothing: the endings discriminate and the mean of the meters does
  not.
- Until the lever panel lands, the interface shows a lever decision as one list of settings,
  each tagged with its lever.

**Reversible:** yes. The old story is in the archive, and every engine capability is additive:
content without promises, endings or a board behaves exactly as before.
## D-085 · The lever decision in the engine
`docs/LEVERS.md` (D-084) specified a new decision unit: two or three levers, one setting on
each. This adds it to `src/engine` as a fourth mission kind, `kind: "levers"`, with no content
using it yet. The story is unchanged and every existing gate still passes.

**Built, as the contract says.**
- `LeverOption`, `Lever` and `LeverMission` in `types.ts`, in the `Mission` union.
- **Selecting.** `toggleSelection` replaces the setting on the same lever. Re-setting the current
  setting does nothing, as with a radio button. The selection is kept in lever order.
  `canCommit` needs exactly one setting per lever.
- **Committing.** Each setting's `dims` and `flags` are applied in lever order, then the first
  outcome whose `when` holds after them, then that outcome's effect. `chosenIds` are in lever
  order and `chosenLabel` joins the labels with " · ". The deltas include the settings' own bars.
- `leverTouches(option)` returns the sign of each bar a setting moves.
- **The sweep.** `possibleSelections` enumerates every open combination, with the first lever
  varying slowest. Run codes therefore carry lever decisions with no format change.
- **The validator** checks these rules:
  - 2–3 levers of 2–3 settings, with setting ids unique across the decision;
  - an unconditional last outcome;
  - no setting that beats a sibling on every bar by its `dims` alone;
  - every setting's flag is read later or is a named card;
  - the word budgets.

**Decided beyond the contract, and why.**
- **Each setting is applied as its own step, clamped as it lands.** "In lever order" only
  makes a difference at the clamp. From 98, +6 then −3 ends at 97, but the same two summed
  first would end at 100. Applying them in order keeps each lever's movement a separate write
  that can be explained. `budget.ts` accounts for them the same way.
- **`question` moved from each kind onto `MissionBase`.** The contract's `LeverMission`
  has no `question`, but the validator requires one and every renderer heads a decision with
  it. For the existing three kinds the type is unchanged.
- **Every lever needs one setting nothing can lock.** Without one, a player without the cards
  has no legal combination. The decision could not be committed, and the sweep would drop the
  state silently instead of failing. This is a validator error.
- **The dead-flag rule is an error, and "later" means later.** A flag counts as read if one of
  these reads it:
  - this decision's own outcomes;
  - a mission after it in `missionOrder`;
  - the engine;
  - a causal thread.
  
  A read on an earlier beat does not count. The general dead-flag check stays a warning,
  pinned in `engine.test.ts`.
- **The named cards are passed in.** The engine may not import content, so
  `validateContent(content, { cards })` takes them. `engine.test.ts` and `validate.test.ts`
  pass `Object.keys(EARNED)`.
- **Locked settings are in the sweep's dedup key**, as locked choice options already were.
  Leave the lock out of the key, and two states either side of it collapse. The combinations
  only one of them could play would never be swept. `levers.test.ts` orders its fixture so
  that this omission fails the build.
- **Realised dominance covers levers.** `findRealisedDominance` now also compares two settings
  of one lever, with the other levers held, over every reachable state. This finds a setting
  that is free money only once its outcomes are counted, which the static `dims` rule cannot see.
- `missionList` gives a lever decision its own `levers` activity.

**Old run codes still decode.** The canonical text of the existing kinds is unchanged, so
`RUN_CODE_VERSION` stays at 1 and `SAVE_SCHEMA` at 5. `levers.test.ts` pins a fingerprint and a
code minted by the engine before this change.

**Cost.**
- Two type-narrowing lines in `src/ui`, needed so the union typechecks:
  - `Scene.tsx` lists the settings as plain picks, as a stand-in until the lever panel exists;
  - `debrief.tsx` lists the unchosen settings as the roads not taken.
- Content that adopts levers will meet three rules the contract did not state: the
  unlockable setting, the "later" reading and realised dominance.

**Reversible:** yes. No content uses the kind, so removing it changes no run, save or code.

## D-084 · From first principles: one spine, four ideas, eight lever decisions
The user asked for a from-scratch rethink, researched first, with these goals:
- learning that is simpler to synthesise, not more complex;
- decisions split into smaller cause-and-effect variables;
- different kinds of maps showing how everything works as a system;
- an experience that does not stay the same throughout.

Three research agents worked in parallel: learning science, a teardown of the best games, and a
cold newcomer audit of the build. They converged, and the result is `docs/STRATEGY.md`, with
the decision unit specified in `docs/LEVERS.md`.

**Decided.**
- **One spine sentence and four ideas,** one per act and in the same words every time:
  - understand before you offer;
  - not every deal is worth winning;
  - trade, don't give;
  - promise only what your team can deliver.
  
  The current 53 takeaway sentences collapse onto these four.
- **8 decisions instead of 18,** on one causal spine. Each decision is 2–3 *levers*, small
  choices with one cause and one visible effect, so the player still makes about 20 choices.
  Every decision consumes something an earlier one produced and names it.
- **A system view per act:** the people map, the fee waterfall, the scales, the promise
  calendar, a cause-and-effect map at every act break, and one chart at the end.
- **Telegraphing.** A lever setting shows which bars it moves and in which direction. This is
  its own immediate effect, not the outcome, so G3 still holds for outcomes.

**Shipped now, ahead of the rebuild,** because the audit showed the existing game hiding its
causes:
- The "why" line gives the real cause. An outcome with its own lesson keeps its authored
  reason. One that only shares its mission's general lesson (68% of them) now shows the
  engine's account: "It went this way because of what you had: their complaint data."
- A card names the *nearest* later stop that reads it. Before, it named the farthest stop
  where it unlocks an option, so the complaint data claimed to matter at decision 13 when it
  decides decisions 3, 5 and 7.
- The release harness drains spoken lines across view-transition gaps, so it no longer
  mistakes an empty frame for the end of a scene. It also reports where a run stuck, with a
  screenshot.

**Budget.** The stylesheet budget is raised from 18 to 22 kB gzipped. The journey map is a new
screen type: 19.0 kB measured after the dead Journey styles were removed. The per-act system
views will each add one more. The interface and engine budgets are unchanged.

**Cost.** The rebuild retires most of today's content. It stays playable until the new set
passes every gate. The earlier strategy is kept in `STRATEGY-MOCKUP-ERA.md`.

**Reversible:** yes, until the old content is deleted.

## D-083 · The trail and the hand: make the journey and cause-and-effect visible
The user, after D-082:
- "Even now we don't have a map that tells me where we stand through the entire gameplay."
- "Decisions feel like they are made without any logic."
- "Rework this from scratch… rely on your research and analysis of the best games out there."

**Diagnosis.** The engine always had cause and effect. About 50 earned flags record what the
player knows ("their complaint data"), has built ("Operations on side") and has promised ("an
eight-week pilot", "a discount given"). Those flags open and close later options and decide how
outcomes land. None of it was visible, so a player saw choices whose consequences arrived from
nowhere. The structure was also invisible: 18 decisions with no sense of a road.

**What the best games do, and what we took:**
- **The road is the home screen.** *80 Days*, *Oregon Trail* and the *Slay the Spire* map show
  where you are, what you have passed and what lies ahead, and you return to the map between
  events.
- **Resources you can hold.** Card games turn abstract state into objects in your hand, and
  every card says what it is for.
- **Checks that name their requirement.** *Disco Elysium* and *Slay the Spire* show what an
  option needs, so a locked option teaches as much as an open one.
- **Plain, immediate feedback.** *Reigns* moves its meters the moment you choose, and the
  meaning is obvious.
- **Callbacks.** Telltale's "they will remember that": the game says out loud that an earlier
  choice mattered.
- **A question that pulls you on.** Every good story has a mystery.

**Built.**
- **The trail** (`screens/Journey.tsx`, `styles/map.css`). After every decision and every act
  you return to a journey map:
  - two rows snaking through the five stages in their colours, with every stop named
    (`MILESTONE`) and the three news events as landmarks;
  - ticks for what is done, "You are here", and what is ahead;
  - below it, what just happened, and the next stop with its guide and a one-line reason;
  - the HUD's progress strip became the same map in miniature.
- **The hand** (`ui/cards.ts`). Every earned flag the content names becomes a card. Strengths
  are what you know or have built; promises are what you owe or risk. Each card says, worked
  out from the content itself, where it next opens an option, pays off or comes due. A result
  card shows the cards a decision added. A locked option names the card it needs and the stop
  that could have given it.
- **The case file** (`MYSTERY`). "What is really wrong at Orion?" stays open on the map until
  the player holds a clue, then shows the answer.
- **Choices you can compare** (`COMPARE`). The first decision lays the three clients out on
  the same rows: what they want, the prize, our experience, the competition and the pace.
- **The company first.** Setup became an introduction: the firm, how a deal works and its
  trade-offs, then your team's strength, with what each choice makes easier later (`firm.ts`).

**Cost.** One more screen per decision: the map, one press away. Map classes are prefixed
`trail-` after a `.pin` collision with the cork board broke decision 2. This is presentation
only; the engine, saves and run codes are unchanged.

**Reversible:** yes. Routing to the map is one condition in `App.tsx`.
## D-082 · Written for someone who has never sold anything
The user, a marketing professional, played D-081 and could not follow it: "the storyline makes
zero sense", "decisions feel like they are made without any logic, there's no explanation
anywhere, no impact", "too much gyaan before we reach anywhere".

**Why the decisions felt meaningless.** Every one of the 18 tested knowledge the game never
gave:
- Our own firm was never described.
- Sarah and Marcus appeared in decision 2 without an introduction.
- Orion's real problem (the complaints after purchase) was never posed as the mystery.
- Each option's trade-off was folded away behind "Trade-offs and effort".
- The reason after a choice was a sentence assembled from flag labels ("because you already had
  who owns the systems").
- A compulsory aphorism from the colleague sat between the player and every choice.

**Decided.**
- The frame tells one concrete story in plain words:
  - who you are and what our firm does;
  - each act's guide introduces themselves and says what you decide;
  - each act break says what was settled and what comes next.
  
  Aphorisms are cut from act openings, act breaks and turns.
- Decisions m1–m9b were rewritten for a reader with no sales background. Jargon is explained
  on first use, each situation links to what just happened, and options read as what we would
  actually do. m10–m10c keep their D-081 wording; that pass ran out of time.
- The brief is the situation and the client's own words, then the choice. The colleague's steer
  moved under "Ask", as advice you asked for.
- What an option gives and what it costs is always visible.
- After a choice the order is what happened, then why (the authored `because`), then the
  takeaway. The outcome card says in plain words what each moved bar means for the deal ("Orion
  is more likely to choose us").
- Review leaks fixed: the m5b, m6 and m10b tips, the m10b and m10c lines, and m9a-lost-value's
  false detail. m6 and m10 have their own steer.

**Cost.** m10–m10c are less plain than the rest. The robotic `whyLine` remains only as a
fallback. The LMS harness's step cap went from 160 to 480, because spoken lines take more presses.

**Reversible:** yes. Prose and presentation only. Rule fields, run codes and the engine are
unchanged.

## D-081 · Information is performed by people, not handed over in boxes
The user's verdict on D-080: readable, but "containers everywhere and there's no immersion or
transitions or layering". "Whenever we have info coming up, I would rather have a character
come and explain it." "Too many Priya's messages, absolutely incoherent." "All screens are the
same now, you have stripped the game off its entire personality."

**Root cause, stated plainly.** Three builds in a row treated a delivery problem as a layout
problem. Every version handed the player documents: all the information on screen at once, in
boxes of equal weight, with characters as thumbnails beside quotes. D-080 also fixed
readability by deleting the staging, when the fault was only small, tilted text over
photographs.

**Decided.**
- **Performed scenes.** A decision is played out in one room with the people in it. Your
  colleague explains the situation one line at a time in a large, solid dialogue box, and the
  client speaks their own lines (`ui/script.ts` builds the lines from content and decides
  nothing).
- **The medium.** The choice arrives in the decision's own medium: cards on the table, replies
  beside a video call, a message thread on a phone, pins on a cork board, magnets on a planning
  wall, arguments beside an evidence folder.
- **The moment.** Committing lands a title card while the deal's three measures count up and
  the record's new entries pop in. Then the colleague explains what happened, why (one sentence
  built from `outcomeBecause`, including the nearer alternative) and the takeaway, filed under
  one of the three questions.
- **Interactive.** "Ask <colleague>" brings out their questions and anecdotes (the old
  `consider`/`tip` content, now in a person's voice). Number keys pick options; Space, Enter or
  → moves the conversation on.
- **The cast and staging are back, in natural form.** Background-removed figures (no rim light),
  full-bleed daylight rooms, depth of field while reading or choosing, entrance motion for
  people, lines, cards and results. Reduced motion shows finished frames.
- **The HUD carries what is at stake:** the three measures as live bars, and "Your record", which
  opens the board ("Where you stand") in a drawer.
- **Frames by a design agent:** a cast poster for the title, team select, acts that open with
  the guide speaking the act's purpose, act breaks with filed decisions and the reflection asked
  by the guide, story turns as artefacts, a route-style journey and a report-style ending.
- **Script by a content agent:** a rewrite for spoken delivery, within the validator's rules,
  with rule fields untouched. Situations are at most two sentences, outcome details at most
  three, and headlines at most ten words. Each principle answers the question it is filed under.
  Measured against `4843cab`:
  - the longest outcome detail went from 106 words to 53;
  - outcome detail overall fell 15% (4,388 to 3,724 words);
  - the longest headline went from 14 words to 10.
  
  Base situations grew slightly (517 to 571 words) while their longest fell from 42 to 38:
  two-sentence situations are fuller sentences, not fewer of them.
- **Figures are stated as a person would say them.** The m8 price gap went from “£2.6m against
  £2m” to “£600,000 above the cheaper bid, thirty percent more”. Separately, `paginate()` no
  longer splits a sentence at a decimal point or an ellipsis (`ui/script.test.ts`).
- **A brief always ends with the colleague.** A beat without its own `advisorLine` (m6, m10)
  falls back to the colleague's standing quote. This is the old renderer's chain, and a test
  holds it for all 18 decisions.

**Backlog closed along the way.**
- LMS-01: a different completed run restored in the same tab is now reported. Acknowledgement is
  tied to the run's code.
- SV-02: the restart dialog shows each saved engagement's real code and offers its record for
  download; an unfinished record says it is in progress.
- CNT-01: m10h said "Aisha's team starts on Monday" after m10 and m10b had already put the
  team five months into delivery. It is now the month-six re-plan, and Aisha asks which
  promises still stand.

**Cost.** Roughly ten clicks per decision instead of three; "Skip to the choice" and "Show all"
keep it fast. The cut-outs return to the runtime set (+0.76 MB). The release harness plays
through lines with the primary action.

**Reversible:** yes. This is presentation and prose only; the engine and run-code fingerprints
are unchanged.

## D-080 · One story, one scene, daylight: the D-077 look was the wrong answer
The user played D-077 and called it gorgeous, but said:
- the text was not readable in most places;
- the screens were too futuristic for a learning game;
- there were too many screens before any step;
- there was "too much info without any cohesiveness or line of thought and nobody can recall all
  that";
- "Screen change should mean something."

A diagnostic measured all of it. Figures are in `docs/ART-DIRECTION.md`. In short, 34% of words
were below 14 px and 39% sat on tilted cards. 79 screens carried 18 decisions, which came with 53
lesson sentences and 50 record labels and no thread through them. The dark, neon, monospace
look came from my own choice of science-fiction references (Citizen Sleeper, Persona), which
suit a stylised game, not professionals learning a job.

**Decided, with the user:** keep all 18 decisions, restructure around one story, and move to a
daylight editorial look.
- **Spine.** One story question; three questions (win, worth it, deliver) mapped onto the
  engine's existing three indicators; every decision and every ledger position filed under one
  of them; one question per act.
- **Scene grammar.** The situation and the choice are one scene, and the outcome appears in the
  same scene. An act break replaces debrief, journey and next opener. The journey map is on
  request. Mid-act reflections moved to the act break. A run is 48 screens, down from 79.
- **The board.** The engine's `ledger`, filed under the three questions, always on screen. It
  marks *New* and *Why* after each decision.
- **The look.** Paper and ink, one accent per act, serif headlines, 17–18 px reading text,
  daylight photographs in frames. Removed: dark stages, glows, cut-outs, grain, monospace
  labels, rotation, night photography, and two typefaces.

**Engine untouched.** Everything is presentation, and `settle()` in `App.tsx` advances skipped
beats through the ordinary engine, so saves and run codes stay valid. One session test changed:
a restored game now opens on its scene rather than the map.

**What it cost.**
- The D-077 compositions are gone: thirteen screen files and four stylesheets.
- The six night photographs, the seven cut-outs, Archivo and JetBrains Mono were removed from
  the repository. They remain in the `cff5a2a` history if anyone wants them back.
- Runtime photography fell from 3.04 MB to 1.35 MB.

**Reversible:** yes, by reverting to `cff5a2a`. Not recommended.

## D-079 · A pedagogy audit of the rebuild, and what it overturned
The read-only `gpl-pedagogy` reviewer audited the D-077 screens the same day. It found three
structural faults, all of them mine:

- **The causal panel was false on fallbacks.** It said "nothing you carried in changed how this
  landed", on exactly the hard branches that most need explaining. Fixed in the engine (D-078,
  `missed`).
- **Liabilities were styled as assets.** On the cleanest run in the game, six struck-through
  coral "misses" (no discount, no overridden review…). `EARNED` now carries `liability`, and
  liabilities are never ticked, locked or struck.
- **The interface still lectured.** The consequence captioned "What they would tell you" and
  "Carry this forward", and the brief had "Objective", unsigned questions, an unsigned
  assessment and an instruction footer. Every steering sentence now belongs to a named
  colleague: "Riya, afterwards", "Aisha asks", "Riya's read", "Riya noticed". The "Objective"
  label is now "The ask".

Also changed:
- The HUD shows the business indicators only on consequences, debriefs and the journey; over a
  decision they were a scoreboard.
- Consequence wash and sound no longer change with outcome tone.
- The per-card ✓ evidence chips on the argument screen were removed, because they read as a
  rating.
- The ending asks its causal question before revealing the threads, takes one answer, and can be
  skipped.
- Four decision prompts that told the player how to decide now state the count of options.
- One pre-decision forecast ("That is hard to score down.") and one narrator verdict ("Honesty
  is still the right move") were cut from `story.ts`. Prose is outside both run-code
  fingerprints, so no save or code is invalidated.

**Not done, deliberately.** The audit lists many hard-coded strings in screen components. Most
were inherited verbatim from the previous `game.tsx`, and the browser gate asserts on several of
them by exact name. Moving them to content is mechanical but touches the gate; that is the next
cleanup ticket. **Reversible:** yes. All of this is presentation and prose, apart from
`liability` in `gates.ts` and the `missed` field.

## D-078 · The consequence screen says why, from the outcome's own condition
The game's central promise is that a player can trace a consequence to the decision that
caused it. Until now that trace appeared only in the final review. On each consequence screen
the outcome simply arrived, and the player had to take its causes on trust, 18 times.

`outcomeBecause(state, content)` in the engine reads the selected outcome's `when` condition
back against the flags the player carried into the decision. It returns what was **held**
(`all`, plus whichever `any` were present) and what was **lacked** (`none`). It decides
nothing, because `commit` has already chosen the outcome. It also returns the meter thresholds the outcome required, and
**missed**: the earlier sibling outcome that failed by the fewest terms, with exactly what it
needed. Outcomes are first-match, so this is the honest explanation for a fallback. Flags set by this decision's own
selection are excluded: they are this decision, not an earlier one. A `conditional` flag
records whether the chosen approach has more than one outcome, so the screen never says
"on another path it could have" when no path could.

**Cost:** one engine function, and the screen shows only causes that have an `EARNED` label.
`because.test.ts` holds the label coverage above 80%, and asserts over 450 seeded runs that
every named cause was required by the condition and was already carried. **Reversible:**
delete one section of `Result.tsx`.

## D-077 · The presentation layer is rebuilt as a staged drama, and the budgets re-split
Shown together, the 78 screens of a run were one composition: beige paper, bordered boxes,
one photograph per chapter shown three times in a row, and the same palette in all five
chapters. Full reasoning, references and rules are in `docs/ART-DIRECTION.md`. In summary:

- **Depth.** Four planes on every screen: a graded and drifting world, a cast of
  background-removed figures, paper artefacts, and a glass HUD.
- **A colour script.** One light per chapter (daybreak → glass → studio → boardroom → floor).
  The brand vermilion is reserved for the frames around the story.
- **Fourteen-plus compositions** in place of one page template, including four brief variants.
  The brief now arrives as the decision will: an incoming call, messages on a phone, the file
  on the person across the table, or a dossier.
- **Assets.** Nine new location photographs from Pexels, credited in `assets.ts` and
  `PHOTO-PROVENANCE.md`. Seven cut-outs derived from the same licensed portraits at 1400 px
  using rembg (isnet), with face boxes measured by OpenCV YuNet for consistent scale. Three OFL
  typefaces, self-hosted.
- **Implemented backlog items along the way.** UI-01: the argument screen shows your record
  beside the choices, and what each argument is built on. UI-02: the commitment summary sits
  beside the commit button. NAV-01: the journey's "Review this act" opens that chapter's record
  only.

**What it cost.**
- The single-file `game.tsx` (38 kB on 230 lines) became `game.tsx` plus `parts.tsx` and
  eleven screen files. The old `game.css` is kept in the scratchpad, not the repository.
- Stylesheet 8 → 16.1 kB gz; interface JS 46 → 21 kB. The budgets in `size.mjs` and
  `CLAUDE.md` re-split to stylesheet 18 and interface 27, which lowers the combined
  presentation cap from 72 kB to 45 kB.
- Runtime photography rises from 850 kB to 3.0 MB. It is not code-budgeted, but it is real
  download weight for a cold LMS visit.
- Two harness adjustments in `verify-game.mjs`. The prediction-question regex is now scoped to
  single text blocks: it had matched across the whole ending. Screen reads now wait for the
  view-transition frame. Neither weakens an assertion.

**Rejected:** WebGL or a canvas renderer (the static, offline, SCORM delivery target and the
accessibility gate both forbid it), illustrated characters (real-photography provenance is a
non-negotiable in `BACKLOG.md`), and default-on sound.

**Reversible:** yes. The engine, content and session contracts are unchanged apart from D-078.
Restoring the previous `game.tsx` and `game.css` restores the old presentation.

## D-076 · The game does arithmetic, and the premium is what pays back — not the fee
Backlog 5.5. The game contained **no currency figure anywhere**. The value-case option at
the award was called "Build the case in their numbers" and did no arithmetic; its own
losing lesson said the case "read as a brochure", which was also true of the option.

**One model, introduced in exactly one place.** The m2 complaint card — which the player
spends one of two investigation slots to buy — carries half a million post-purchase
contacts a year at roughly £5 each. Every figure downstream is arithmetic on those two and
introduces none of its own, so there is one place to change and no way for two beats to
disagree.

| | |
|---|---|
| contacts × cost | £2.5m a year answering them |
| halved | **£1.25m saving** |
| our fee against the cheaper bid | £2.6m against £2m — exactly the committed 30% |
| the gap | **£600k** |
| payback on the gap | **5.8 months** |
| payback on the whole fee | 25 months |

**The fee does not pay back inside the twelve months the board was promised, and is not
made to.** That was the brief's assumption and it is wrong; no honest set of numbers
reaches it without inventing a benefit pool. What pays back inside twelve months is the
**premium** — £600k of difference against £1.25m a year.

This is the craft rather than a fudge, and it is the better lesson. Foyle's own line is
"explain why I did not take the cheapest": he is not asking anyone to justify the fee, he
is asking them to justify the *difference*, and the difference is the only thing a
premium argument ever has to carry. It also locks into what the game already said — the
cheaper bid is a storefront platform that "does nothing about deliveries, returns or
support", so the £1.25m is precisely the saving the other bid cannot deliver. The premium
is defensible because the comparison is false, and there is now a number proving it.

**Checked against every figure already committed in player prose**, independently of the
author: the premium is exactly 30.0%; "visible improvement inside twelve months" still
holds, because a run-rate saving is visible well inside a year even when payback is not;
and Riya's "eight percent on Meridian" is ~£208k, two months of the saving, which lands
her anecdote at the right scale without stating it.

Round rather than precise — "roughly five pounds" is a credible estimate and "£5.14" is a
fabrication. The three outcomes at the award are the *same* arithmetic at three levels of
evidence, which is what the existing gates already sorted players into: done from their
data, quoted from a sector benchmark, or asked where the half million came from.

**The approved budget stays unquantified, deliberately.** A figure would either put the
fee over it — killing "hold the price" and collapsing that beat from four routes to three
— or comfortably under, which drains it. The constraint works better unpriced.

**Cost:** six places now carry a number, and every one is a place it can be wrong. Nothing
checks the arithmetic — a validator rule could not, since the figures are prose. Four more
sites were rejected for exactly that reason. Reversible only by hand.

---

## D-075 · The claim item is wired, and "fit-neutral by construction" was wrong twice
Backlog 4.5 is complete. `ui/claim.tsx` renders in band 3 of the ending, in the causal
chains' own place, and the chains unfold once it is answered. 60.8% of runs get it; the
rest see the chains immediately, as before.

I claimed twice that the band was fit-neutral by construction, and was wrong both times
in ways only the browser showed.

**First: the layout.** Consequence beside candidates halved the column, so every
candidate wrapped to two lines and the band came out at **320px against the 226px budget**
D-072 left for it, putting the ending 90px over target. Stacking it — consequence full
width, candidates two across — puts most candidates on one line and turns four rows into
two. Same words, 224px.

**Second, and worse: the settled state.** Answering used to keep the cards and merely drop
the ones nobody picked, 224px → 183px. That reads as a shrink and is not one, because the
chains arrive underneath *at the same moment* and they are ~140px — so answering grew the
page by 99px and pushed "What led to what" off the bottom.

**`verify.mjs` cannot see this, and passed throughout.** The harness plays to the ending
and screenshots it; it never clicks the item, so the gate only ever measures the
unanswered state. Found by driving the click by hand. That is the second time in a day a
green gate covered a defect in the thing it does not interact with, after the SCORM
bridge (D-071), and the shape is identical: the tests exercise the units and nothing
exercises the join.

The settled band is now two lines of prose, **224px → 73px**, so answering shrinks it by
more than the chains add. That is also the better reading: once the chains are on screen
they are the subject and the item's answer is a footnote to them. The consequence line
goes too, because `soLater` is the second half of the very chain now printed below it.

**When the player picks correctly the answer is not restated**, because the first chain
below is that same sentence, and "This is the one: X" sitting 40px above "X → Y" reads as
the page stuttering. When they picked something else both are named, in the same type and
the same weight — "This is the one" and "Your answer", never "correct" and "wrong", no red
and no green. `engine.ts` asserts the data carries no score; this file is the half that
could have reintroduced one with a colour.

**Cost:** band 3's budget now has a consumer whose height depends on how long the
authored candidates are — four long ones would push it back over, and nothing measures
that in advance; the fit gate catches it at the next `verify`.

The eight strings joined `UI_LABEL` once `shell.tsx` was free, so the exception D-073's
convention would have had to carry does not exist.

---

## D-074 · The locked card describes the argument, never the player
`src/ui/apply.tsx`, and the strings now in `UI_LABEL`. A pedagogy audit read the apply
beat's locked cards and found them written in the second person and the past tense:
*"You needed"*, *"Your position was short of"*, *"Not available to you"*, and, worst,
*"locked, because it was never earned"*. Up to three of them are on screen at once, at
the award and at the handover — the two beats where the player is most exposed.

The information was right; the grammar was an accusation. A **live** card's provenance
reads "From your file", which names a place. Its locked sibling now does the same:
**"Rests on"**, **"Any one of these opens it"**, **"Needs a position of"**,
**"Not on the table"**. Two related fixes: `neededNothing` was *"Needed nothing you had
to find."* on a card that, for the player who gathered least, is the only one they can
play — now *"Open whatever you found."* And the counting Pill said *"2 of 5 open to
you"*, which is a mark out of five one beat before an ending that deletes its score on
purpose; it now counts the table, and **only draws at two or more locks**. Its condition
used to be "does this beat gate anything", which drew "4 of 4" on a run where nothing was
shut. At one lock the padlock already says it and the fraction adds only the grade; at
two or three the count is doing real work.

Cost: nothing but the words. Reversible in one commit. The thing to note is *how* this
got in — none of these strings passes through `validateContent`'s leak check, because
they are interface strings rather than content. That is an argument for `EARNED` and its
fallbacks moving to `story.ts`, where the checks live.

## D-073 · Ten label blocks into `UI_LABEL`, and what deliberately stayed behind
Nine `src/ui` files had grown a private `LABEL` object while `shell.tsx` was owned by
somebody else, and between them they declared `title` four times, `of` six times and `up`
three times, each meaning something different. Merging them was the easy half; naming
them was the decision.

Three rules, in the order they were applied. **One word, one job, one key** — `of` really
is the same word doing the same work in six places, so it is one key and not `starsOf` +
`boardOf` + `reachableOf`; likewise `stars`, `more`, `chapter`, `complete`, `earned`,
`milestone`. **Same string, different job, two keys** — "Continue" resumes a run in the
hub and dismisses a modal on the reward, so `resume` and `dismiss`, because they will not
stay the same string for ever and a shared key would make that a find-and-replace.
**Read the call site** — `DASH_LABEL.title` is the dashboard's `<h1>`, which already
existed here as `howYouPlayed` and is the same sentence naming the same thing, so it is
one key; `JOURNEY_LABEL.title` became `mapTitle`, because `UI_LABEL.title` says nothing
where it is used. Two existing keys were renamed for the same reason: `standing`
("Where you ended up") became `endedUp` so it could not be confused with the rail's
`whereYouStand`, and `recognition` ("Awards") became `awardsNav` so the word
"Recognition" could be the key that says it.

**`FALLBACK` in `apply.tsx` did not move.** Its four strings are the `where` half of an
`EARNED` entry, used when no entry has been authored for a flag — the same kind of thing
as the table beneath them, which its own comment marks as authoring bound for `story.ts`.
Chrome comes to `UI_LABEL`; authoring waits for content. Moving them here would have put
a sentence about the fiction into the interface's vocabulary and made it harder, not
easier, to move `EARNED` later.

Cost: one large diff across eleven files, and `UI_LABEL` is now 142 keys, which is big
enough that the next person will be tempted to split it. Resist until content has a `ui:`
block; two homes for chrome is the state this change just ended. Fully reversible.

## D-072 · The closing debrief fits again: four columns, and two bands sharing a row
`src/ui/screens.tsx`. Backlog 4.2 added twelve ledger rules, the account went from four
rows to five, and the ending measured **854 in 739** — 115px over the design target and
9px inside the hard limit, with `Your decisions` clipped at the fold. Measured band by
band before anything was changed: verdict 203, account 308, threads 140, decisions 57,
run code 31, plus 92px of band margins and 24px of padding.

Three changes, in order of how much they were worth.

**The tail row (−116px), which is the structural one.** `threads` is a wide, short region
and `decisions` is a narrow, short one — 18 tone marks and a disclosure — so stacked they
spent 300px of height on two things that between them filled about a third of the page.
They now share a row, `1fr` and 468px, and 468 because that is the standing card's width
in band 1, so the page has one right-hand spine holding the numbers and the record. The
run code folded into the decisions block rather than keeping a band of its own for one
line of 13px text. `threads` is absent on a large minority of runs, so when it is missing
`decisions` takes the whole row rather than leaving a hole.

**Four columns in the account (−44px).** The old comment said three columns existed so
each detail line landed on one line at 437px. Measured, that was no longer true: twelve
of fifteen entries already wrapped to two. At 310px every entry is two lines and **none**
reaches three — checked in the browser before choosing it, because the risk was trading
one row for four taller ones. The rule is `repeat(auto-fill, minmax(300px, 1fr))` rather
than a breakpoint, so it is the measure that decides the column count and the same rule
gives one column on a phone.

**18px of page rhythm**, and this is the part that is taste rather than measurement:
16px between bands and 10px of edge padding, against 20/24/24 and 12px. Every band opens
with a bold coloured `SectionTitle`, so the sections are separated by weight.

Where it landed, at 1440×900. The **after** column is measured in a browser; the two
starred **before** figures are arithmetic on measured parts rather than a second run, and
are marked because the distinction matters.

| run | before | after |
|---|---|---|
| no chains (a large minority) | 690\* | **610** |
| one chain — the harness's own path | 854 | **653** |
| three chains | ~870\* | 774 |
| a 21-entry account (the walk's worst case) | 960 | 771 |
| 21 entries **and** three chains | ~976\* | 892 |

The first two are what the gate measures and they are comfortably inside 739. The last
row is still over 863 and is the honest cost of this fix: it improves the structural worst
case by about 84px but does not repair it. Getting *that* under the line needs the account
itself to be shorter, which means either hiding entries — the one thing 4.2 exists to stop
— or shortening the detail lines, which is content.

**What band 3 is now worth: 226px at the 739 target, 350px at 863.** That is the budget
the backlog 4.5 claim item has to live inside, and it is up from the 140px the chains
occupy today.

One side effect, recorded because it is a real cost: opening `Your decisions` in a 468px
column would have made an eighteen-row audit trail a 1,666px block instead of ~940px, so
the row drops to one column while the disclosure is open. React's `onToggle` **does not
fire** on `<details>` here — measured, with a native listener on the same element counting
one toggle and React's handler counting none — so the mirror hangs off the summary's
click, which activation always produces, keyboard included.

## D-071 · The SCORM bridge shipped disconnected, and the test that would have caught it
`src/scorm.ts`, `src/scorm.test.ts` and `tools/scorm-package.mjs` all landed together.
Eight tests green. Manifest correct against the 1.2 schema. `npm run scorm` producing a
package an LMS would accept. **Nothing in `src/` imported any of it**, so the game would
have launched inside an LMS and reported every learner as *not attempted* for ever.

That is worse than no integration, because a missing integration is visible and a silent
one is not — the report simply says nobody finished. It also survived a review in which
I wrote "8.4 DONE" into the backlog, because every artefact I looked at was correct.

**No test could have caught it, and that is the part worth keeping.** `scorm.test.ts`
drives the bridge against a fake LMS and asserts what crosses it. A bridge with no
traffic over it is *precisely* what those tests construct: they supply the traffic
themselves. The unit was never the thing in doubt.

`src/lms.ts` is the missing half — **when** to speak, deliberately separate from
`scorm.ts`'s **what** to say. Two files because they change for different reasons: the
protocol changes if SCORM does, the schedule changes if the game's lifecycle does, and
the protocol has to stay testable with no React anywhere near it.

Four moments. Report arrival (so a learner who opens the module and closes it still shows
as started); park the run code as the run moves; mark completion at any ending *including
walking away*; close the session on `pagehide` rather than `beforeunload`, which browsers
increasingly ignore and which misses the back-forward cache path.

**The resume path is the reason to bother beyond a tick in a report.** `localStorage` is
per-browser and per-machine, so a learner who starts on a laptop and reopens on a desktop
was starting a seventy-minute module again. The LMS copy is consulted only when local
storage is empty, never to override it, and a code from a different content build is
refused rather than replayed — which the fingerprint inside the code is what makes
detectable at all.

`nextLmsCall` is a pure function so the schedule can be tested without a DOM: do not
re-park an unchanged code (some LMSs do a network round trip per `LMSCommit`, and `state`
changes on every selection toggle), and report completion once.

**The connection test took three drafts to become able to fail**, which is the honest
part of this entry:

1. imported `App` and asserted the default export was a function — green whether or not
   App ever calls the bridge, so it would have passed on the very build it exists to catch
2. matched `useLms(` against the raw source — matched the **commented-out** call, and
   stayed green when the bridge was unplugged to check
3. strips comments first, then matches

Exactly the lesson `vite.config.ts` already records for its own HTML guard, which read its
own rationale as the thing it banned. Verified by unplugging: draft 3 goes red, draft 2
did not.

**Cost:** a second file for one feature, and a structural test that reads source rather
than behaviour — which is crude, and will need updating if `App.tsx` is restructured. The
alternative is rendering App against a fake LMS, which needs a DOM environment this
project's test setup does not have and would be a heavier dependency than the problem
warrants. Reversible: delete `lms.ts` and the game loses the LMS, nothing else.

---

## D-070 · The bundle budget is 82% over, and the number is not the problem — RESOLVED
`node tools/size.mjs` reports **171.44 kB of code against the 94 kB in `CLAUDE.md`**. The
tool has been saying so for a while. What it could not say was *where*, and a single
number sends whoever reads it to refactor components, which on this build is the wrong
place to look.

It can now attribute the bundle to the modules it came from, via the sourcemap. Measured:

| | raw | share | gz (est) |
|---|---|---|---|
| framework (React + react-dom) | 222.0 kB | 40.6% | ~65.3 kB |
| interface (`src/ui` + `App.tsx`) | 155.0 kB | 28.4% | ~45.6 kB |
| content (`story.ts`) | 143.8 kB | 26.3% | ~42.3 kB |
| engine | 25.2 kB | 4.6% | ~7.4 kB |

**React is 69% of the entire budget before a line of this project runs.** That is a
standing decision, not drift, and the only lever on it is a smaller runtime. The next
largest single source is the writing, which is the product and the last thing to cut. Our
own interface and engine together are ~53 kB gz across eighteen missions and a dozen
screen types.

**Code-splitting, the obvious remaining lever, is closed by the build itself.** Backlog
8.1 ships one `iife` chunk behind a classic `<script defer>`, because a `type="module"`
script cannot be fetched from a `file:` URL at all — CORS is not available to the scheme,
so `dist/` unzipped from a SCORM package or opened off a shared drive was a blank page
with four console errors. A dynamic import makes Rollup emit a second chunk, and
`vite.config.ts` **throws at build time** when it sees the resulting `modulepreload`.
Lazy-loading the ending and the dashboard would trade the deployment target this was all
packaged for.

That guard checks the shape of the emitted HTML, which is a proxy. `npm run filecheck`
(new, `tools/file-url-check.mjs`) now checks the outcome: it opens the built
`dist/index.html` at a real `file://` URL in Chromium and asserts the game reaches an
interactive title screen with a clean console. It was shown failing on purpose before
being believed — reverting the script tag to `type="module" crossorigin` reproduces 8.1's
exact CORS refusal. `npm run scorm` runs it before writing the manifest, so the package
cannot be built from a `dist/` that would open blank.

**The number has deliberately NOT been moved, and this entry is the reason.** `size.mjs`
says "do not move this to make a build pass" and it is right to. But 94 kB is not
reachable from here without either dropping React or cutting features, so leaving it is
leaving a gate that can only ever be red — which this repo has already decided (D-038) is
worse than no gate. It needs a human call between three options, none of which is free:

1. **Re-baseline with the split**, budgeting framework / interface / engine separately and
   reporting content rather than capping it. Honest, and makes future drift visible again.
   Costs the simplicity of one number.
2. **Swap React for Preact** (~4 kB gz against ~65). Saves roughly 60 kB and would put the
   whole thing near the original budget. A real migration, and React 19 features in use
   would need checking.
3. **Accept it and delete the budget line.** Cheapest, and loses the instrument.

**Resolved as (1).** The budget is now per origin: **framework 70 kB, interface 58,
engine 12, stylesheet 14**, and **content is measured and never capped.** That last one is
the substance of the decision, not a loophole — a single figure over everything
necessarily includes the writing, so it rises every time the game teaches more and the
only way back to green is to delete a mission. A budget that creates that pressure is
worse than none.

Every capped group is inside its own budget on its own merits: 65.2, 46.5, 7.5, 10.8. So
the gate is green without anything being relaxed to make it so — which is the test of
whether a re-baseline was honest, and why the split had to come from measurement rather
than from wanting the build to pass.

**The gate is now the groups, not the total.** `size.mjs` exits 1 if any capped group is
over and names it; the flat figure is printed as information. With no sourcemap there is
nothing to check per group, so a deliberately generous flat guard stands in against a
sudden doubling. Shown failing on purpose: narrowing `interface` to 30 kB makes it exit 1
naming `interface`.

(2) was rejected rather than deferred. Preact would save ~60 kB and put the whole thing
near the original 94, but it is a real migration with React 19 features to re-check,
bought entirely to reach a number we chose ourselves. If the interface budget ever comes
under genuine pressure it becomes the obvious lever again.

`CLAUDE.md` carries the new numbers, and `ASSET-MANIFEST.md` and `DESIGN-SYSTEM.md` have
had their quotations of the old one corrected — both were repeating 94 kB as a live fact.

**Reversible:** entirely. Nothing in the build depends on the outcome; `size.mjs` is not
wired into `npm run validate`.

Two smaller things landed with the measurement. Sourcemaps are excluded from the size
report, because counting a diagnostic build's `.map` files made the cold-visit total wrong
by half a megabyte in the direction of alarm. And `tools/scorm-package.mjs` now filters
them too — `npm run build` emits none, but packaging after a `--sourcemap` run would have
uploaded this project's full source into someone else's LMS, where it is not ours to
delete.

---

## D-069 · The debrief asks one causal question, and refuses to mark it
Backlog 4.5. Before the threads are revealed, the ending asks: here is what happened in
month five — which of your earlier decisions led to it? The player picks, the game
confirms, the chains appear.

**It is not scored, and `engine.test.ts` asserts the return type carries no field that
could become a score.** That test looks paranoid and is not. This game deleted its score
because a meter-greedy policy reached 100/100/100 without reading a word; the debrief
refuses to give a grade for the same reason; `src/scorm.ts` refuses to send one to an LMS.
A quiz at the ending is the fourth door into the same room, and it is the one that looks
most like good pedagogy from the outside. The item exists to make a cohort argue, not to
tell anyone how they did.

**One item, not three, and confirmed immediately rather than in aggregate — which is a
deliberate departure from what both the backlog and `ENGAGEMENT-MODEL.md` asked for.**
Backlog 4.5 specifies "three month-five consequences, which earlier decision caused each,
confirmed in aggregate"; the engagement model ranks it as "confirm N at a time, never per
item", which is Obra Dinn's mechanic and exists there so a player cannot brute-force by
trial and error.

Measured, over 304,432 reachable flag-states: **three threads fire on 5.6% of them.** Two
or more on 27.4%. So the specified shape is unbuildable on 94% of runs, and would have
produced either an item that almost never appears or one padded with consequences that
did not happen — which breaks the rule that nothing here is invented.

Batching is then moot: there is nothing to batch, and Obra Dinn's reason for batching does
not transfer anyway. Its confirmation is withheld because guessing is cheap and repeatable
there. Here the player picks once, nothing is scored, and a second guess is not on offer —
so immediate confirmation costs nothing and delaying it would only separate the answer
from the question that earned it.

**The wrong answers are authored, not generated.** `CausalThreadRule.insteadOf`. The engine
could assemble distractors from other rules' `because` lines, and the result would be
unusable in both directions: a cause the player plainly never took turns the item into a
memory test, and a cause that *also* contributed makes the "correct" answer a lie an
attentive learner is right to reject. Only the person writing the thread knows which
near-miss is instructive. A rule with no `insteadOf` is never chosen, so the cost of not
authoring one is a quieter ending rather than a bad question.

**The candidate order is a hash, not a shuffle.** `Math.random` is banned in `src/engine`
and the ban earns its keep here specifically: a run has to replay identically from its
fourteen-character code, which is what makes a facilitator's pre-read and an exact bug
repro possible. The order is `fnv1a` over the run's own sorted outcome ids plus the
candidate text — stable for a given run, different between runs, so the answer does not
sit in slot one every time. `fnv1a` moved from `runcode.ts` into `engine.ts` to get there,
because `runcode` already imports the engine and the other direction is a cycle.

**The validator learned about threads in the same change, having never checked them at
all.** That gap is the most expensive content bug this repo has had: a thread naming an
outcome id that does not exist never fires and never complains, so the ending is just
quieter than it was authored to be, on some runs, and nothing has an opinion. Five rules
existed while `D-012` recorded nine. There are now six checks — dangling outcome ids,
dangling flags, the two-outcome minimum `causalThreads` documented and did not enforce,
endorsement language, duplicate candidates, and the two-distractor minimum — and each is
shown failing on purpose in `validate.test.ts`, per `D-037`.

The leak check applied to thread copy is deliberately the *looser* reading. The ending is
the one screen whose job is to say what happened, so naming an outcome there is correct;
what the shared term list buys is its other half, which is that the ending must never say
which decision was the right one. It is the screen the player most wants a verdict from
and therefore the one that must least give one.

**Cost:** one more authored field for whoever writes a thread, and an item that is absent
on any run whose threads have no distractors — which is honest but means two players can
compare endings and one of them never saw the question. The alternative was generating
distractors, which is worse in the way described above. Reversible: the field is optional
and `causalClaim` returns `null` without it.

---

## D-068 · `apply` is a third presentation, not a third mission kind
The apply/rebuttal beat — backlog 5.7, Aisha's "which ones did you mean?" — renders the
options the player did **not** earn, greyed and padlocked, each naming the beat where it
was for the taking. It ships on two beats: the award rebuttal (m9a) and the new handover
(m10h).

**The whole thing is one word in content.** `Presentation` gains `"apply"` beside
`"console"` and `"dialogue"`, and that is the entire content-side change: identical
options, identical outcomes, identical branching, identical state. No analysis, sweep or
validator learns the screen exists, which is the property D-0xx built the presentation flag
for in the first place and the reason this was not a new `Mission.kind`. A kind would have
forced every exhaustive walk, every dominance check and every save migration to reason
about a distinction that is purely about what is on screen.

**Why the screen earns its place.** The console renders an unearned option by omitting it,
and a shorter list reads as *the game offering less* rather than as *the player having
earned less* — the one reading that turns a consequence into a mystery. 85% of runs reach
the handover with at least one option locked and 36% reach m9a that way, so this is the
common case at both beats, not an edge.

**`isApply` refuses the staging when no option is gated**, mirroring `isDialogue`'s refusal
to stage a conversation with no replies in it. A padlock column with nothing in it is an
empty promise of consequence, and the honest fallback is the console.

It mounts on `decide` only — unlike the call, which is one React instance across both
phases so the transcript is not retyped. The apply beat keeps the split because its reading
half is an ordinary brief, and `verify.mjs` caught the first wiring doing otherwise: putting
the padlocks on the brief shows the answers before the demand that gives them meaning.

`has:partner` reached the ledger in the same change. It was a narrative-only flag until the
handover started gating Aisha's card on having anyone who can answer a delivery question —
`ops_onside`, `has:ops_workstream` or a partner. The other two were already on the rail, so
a partnered player saw a card open for a reason the game had never named.

**Cost:** a third staging to keep in step — `ui/apply.tsx` restates `demandOf` rather than
importing dialogue's private copy, and if a fourth screen needs it that resolution should
move to `engine.ts` beside `resolveSaidQuote`. And `EARNED`, the flag→"what it was, and
where" table, is authoring sitting in a component because `story.ts` has no field for it
yet. Both are noted in the file. Reversible: delete the two `presentation` lines and the
beats fall back to the console.

---

## D-067 · The `resolving` phase is deleted from the flow, and the save boundary adopts it
`SCREEN-TAXONOMY.md` §3 names it as the one screen type to cut: a one-second transition
holding **17 of a run's 76 screen instances**, earning its slot purely by being in the way.
`commit` now returns `phase: "consequence"` and `ConsequenceScreen` animates the meters from
`resolution.dimsBefore` on arrival, which is what D-061 built the `from` prop for.

**The value stays in the `Phase` union, and that is the substance of this entry.** The
instinct to keep it "so an old save still parses" is right but incomplete — parsing is not
the failure mode. `save.ts` gates on a hand-listed `PHASES` array, so dropping the value
makes `looksPlayable` read a mid-commit save as a **different `GameState` shape** and throw
away a run that is one beat from resumable. Keeping it in the union and in that array only
buys the ability to RECOGNISE such a save; what it then needs is somewhere to go, because a
phase the interface has no screen for is a dead end regardless of what `advance` would do
with it. So `decodeSave` rewrites `resolving` → `consequence` on the way through and reports
`migrated: true`. That rewrite is honest rather than a guess: `commit` applied every effect
and then set the phase, so a `resolving` state **is** a post-commit state and the resolution
the consequence beat draws is in the save beside it.

A `resolving` state carrying no resolution is refused as damage rather than adopted. No
build ever wrote one — `commit` writes the phase and the resolution in the same object — and
a consequence screen with nothing on it is worse than saying the save could not be read.

`advance` still maps `resolving` → `consequence`. It is unreachable in play and kept as a
backstop for anything that arrives by another road, with a test asserting both halves: no
reachable state holds the phase, and a state that holds it still moves.

**Cost:** two mechanisms for one migration — the load boundary and the backstop in
`advance` — which is one more than the problem strictly needs. The alternative was a single
mechanism that leaves a hand-edited or future-migrated state stuck on a blank screen, and a
dead end is a support call while a redundant line is a comment. Also: `playMission` and
`commitSelection` each lost an `advance` call whose absence the following loop would have
covered for, so behaviour is unchanged and the flow now says what it does.

**Reversible:** yes, in one line each in `commit` and `decodeSave`. Nothing about the
deletion is load-bearing for the animation, which lives entirely in the consequence screen.

## D-068 · Eleven ledger rules, because 14 of 29 gating flags decided a branch the player could not see
Backlog 4.2, measured before it was believed. 29 flags gate a branch somewhere in the story
— they appear in an `outcome.when` or an `option.requires` — and **14 of them appeared in no
`LEDGER_RULES` entry**. On those 14 the game silently branched on state it had never shown,
so a player asking "why did that happen?" could not tell a **reasoning error from an
information gap**, and attribution is the whole teaching mechanism. Learning science put it
top of its section and it blocks 1.1.

**High traffic is a measurement, not a judgement.** Walking every reachable state and
toggling each gating flag at each mission counts the visits where that one flag alone
changes which outcome fires or which options are offered. The eleven rules added score
**11,960 to 51,144** decisive visits. The three left invisible score **227, 40 and 0**, so
the cut line is a 53× drop rather than a preference: `knows:rivals` (its readers almost
always have it, and `knows:rival_gap` — already on the rail — is the distinction the game
actually teaches), `changed_scope` (decides anything on 40 visits, one beat after the choice
that sets it), and `broad_base`, which is **dead rather than invisible**: its only writer is
m10c and its only reader is m10, two beats earlier, so the term can never be true when it is
read. The outcome still fires on its `ops_onside` alternative, which is why the sweep never
noticed. That one is content's to fix and is reported, not patched here.

Three of the eleven — measurement, adoption, payback — were added because the handover beat
landed mid-pass and gates an option on exactly those flags. Aisha's *"the training, the
integration stream, the measurement work"* is unavailable to a player who did not fund them,
and an option missing for an invisible reason reads as a shorter list rather than as a
consequence.

**What it costs the layout, measured on the same walk before and after: the worst case
goes from 13 entries to 21.** Read 21 as a floor — the walk dedupes states on the flags a
later mission still reads, so two states differing only in a flag nothing reads again
collapse and the survivor may hold the shorter account. The structural ceiling is 29 (every
rule at once, less two of the three mutually exclusive ways of getting in). The rail is
uncapped so nothing breaks, but a 21-row account is a scroll. The group comments in the table are the seams to cut along; the last three rules are
the marginal ones and deleting them costs 3 rows and reopens 3 gates in the handover.

**Two rules the new copy is held to, and one of them is now mechanical.** An entry states a
POSITION and never predicts an outcome — `validateContent` runs the same leak check over
these strings that it runs over every pre-decision field, because the rail is on screen
while the options are being read and `engine.ts` had no leak check of its own. And never a
bare restatement of the flag name: a row reading "Reviewed" tells a player nothing they can
act on. The second is still a matter of judgement and is not checked — "Risk accepted",
which shipped long ago, would fail any mechanical version of it.

**The gap itself is now a build failure.** `validate.ts` warns per flag that gates a branch
with no ledger rule, and `engine.test.ts` pins the surviving three by name with a reason
each — the same pattern as the dead narrative flags. A warning rather than an error for one
specific reason: `LEDGER_RULES` lives in `engine.ts`, so the only ways to clear an error
would be to edit the engine or to weaken a gate, and *"adding a mission must never require
editing the engine"* is the stronger rule.

**`LEDGER_RULES` belongs in `src/content/story.ts`, for the same reason the `threads` table
moved,** and it is deliberately NOT moved in this pass because another worker owns that file
right now. It is 31 entries of player-facing prose with a tone and an icon, keyed on content
flags, and a writer cannot reach it. The move would also turn the warning above into an
error, which is where it belongs. The one thing it needs first is a decision about
`IconId`: the table is the only place in the engine that names an icon, so moving it makes
content own that vocabulary too.

**Cost:** three Operations rows now exist on one rail (`ops_engaged` a meeting,
`ops_onside` a stake, `has:ops_workstream` a funded line) and they read as near-duplicates
at a glance. Merging them was rejected: none implies another — `ops_onside` is granted at m7
to a player who never met Marcus — and m9, m9b and m10c all branch on which you have.

**Reversible:** yes, per rule. Each is one object in one array, and deleting one restores
exactly the invisibility it removed.

## D-064 · The apply screen renders the options you did not earn, because absence taught nothing
`SCREEN-SPECS.md` §4.3 and `GAME-SEQUENCE.md` §3 asked for the one screen type the taxonomy
found missing: the beat where **stored knowledge is the currency**. The mechanic for it was
already in the game and invisible. m9a's `o-value` carries
`requires: { any: ["knows:real_pain", "evidenced", "ops_onside"] }`, and `availableOptions`
drops it — so a player who never bought the complaint data saw three cards instead of four
and had no way to know a fourth existed. Four beats in the game gate an option this way and
**not one of them says so.**

`src/ui/apply.tsx` renders the full `mission.options` and draws the difference against
`availableOptions` as a locked card **in its own place in the row**: the option's name, the
sentence it would have been, the thing it needed, and the beat where that thing was for the
taking — "Their complaint data · Chapter 1 · Learn what matters". `where` is spelled as the
chapter plus the **left rail's own step name**, so it points at a memory rather than at a
mission id.

**Four calls inside it that were not obvious:**

**The locked card is not a `.choice`.** It is `aria-disabled` with `tabIndex={-1}` inside
the radio group, so Tab always lands on something playable and the arrows still reach the
padlock — measured: `ArrowLeft` from the first live card focuses it and announces *"Build the
case in their numbers — locked, because it was never earned"*, and no selection follows. It
does not take the class because `.choice` carries a hover state and a pointer cursor, and
`tools/verify.mjs` drives the game by clicking `button.choice`.

**Dimmed, never faded.** `--color-surface-disabled` behind `--color-text-disabled`, 5.22:1,
the pair `.choice:disabled` already uses. `opacity` would have invalidated the ratio and
`tokens.test.ts` fails the build on it.

**An `any` clause names ONE requirement in full and counts the rest** as "+ 2 other ways
in", where an `all` clause names two. One of an `any` set would have done, so naming the
nearest one with where it was says everything the player can act on — and four stacked
"thing / where it was" pairs at 12px in a 171px column is a paragraph, not a label. It was
also 45px of the 84px by which the selected state overflowed at 1440×900.

**The gate is in the work area and is one row, not two.** Same reason the conversation
surface moves it off the action bar: the requirement belongs beside the thing it is about.
One row rather than the composer's stacked form, because this surface has the whole 848px
beneath the cards — worth 32px.

**Cost:** a flag needs a human label per entry, and that table (`EARNED`, 50 entries) is in
the component with a comment saying it must move to `story.ts`, which has no field for it
yet. An unlabelled flag degrades to a humanised name and a vague, deliberately non-committal
`where` rather than an invented chapter. Measured after the trims: **0px overflow at
1440×900 and 1440×1024, in both a 17-flag run and a 14-flag run, selected and unselected.**

**Not done, and it is content's:** m9a has exactly **one** gated option today, so a
competent run sees no locked card at all and the screen degrades to a comparison — which
§4.3 names as the failure mode for this type. The screen is ready for more gates; the gates
are authoring.

**Reversible:** yes, entirely. It is one new file and one route in `App.tsx`; removing the
route restores `DecideBody`.

---

## D-061 · `resolving` is folded into the consequence's entrance, and the handover is one prop
`SCREEN-TAXONOMY.md` §3 names `resolving` as the one screen type to cut: a one-second
transition holding **17 of a run's 76 screen instances**, earning its slot purely by being
in the way. The replacement is not a shorter transition — it is the consequence screen
arriving with its meters already travelling.

**The guarantee that made `resolving` exist is the thing to preserve, and it is not about
duration.** A CSS transition needs the same DOM node to hold both values. `resolving` was
built because committing used to unmount both rails, so the three meters did not travel
from 58 to 64 — they were destroyed at 58 and recreated at 64, a cut dressed as feedback.
Keeping the rails mounted across the beat is what makes the movement exist at all, and
that is `App.tsx`'s job and still is.

**The centre is the new part, and it cannot inherit a value from the DOM**, because the
result band does not exist until the screen arrives. So it paints `from` for exactly one
frame and then sets the target — `useFirstFrame` in `ui/consequence.tsx`, a four-line local
copy of `useSettled`, which `ui/shell.tsx` keeps private.

**The prop is `from?: Record<DimensionId, number>`, not `animate: boolean`.** Same shape
the rail already takes, so `App.tsx` passes the same expression to both and the two are
visibly one event. It is a prop rather than being read off `resolution.dimsBefore` because
only the caller knows whether this mount is the arrival: reading it inside would re-run the
whole 900ms travel on any remount — a resumed save, or a return from the map.

Measured, sampling every ~95ms through a commit: figures 55 → 59 and the bar 0.550 → 0.590
scaleX over ~700ms, with **the band and the rail within 0.002 of each other at every
sample**. One event in two places.

**Cost:** `ResolvingScreen` is still exported and still routed to, because `App.tsx` is
owned by another worker mid-change; until they drop the phase the game shows the travel
twice — once on the resolving beat and settled values on the consequence. **Reversible:**
yes. Omit `from` and the consequence renders settled, which is exactly what it does today.

---

## D-062 · The three modes are separated by what is on the screen, never by a hue
Brief, decide and consequence shared chrome, ground and action position — three modes in
one costume across 66 of 76 screens, which is the whole of "it feels like static pages".
`SCREEN-TAXONOMY.md` §1 is explicit that the carrier is **chrome quantity, monotonically**,
and that colour is secondary everywhere. The test applied was the thumbnail test: three
screenshots, shrunk to 170px wide until the text is unreadable, side by side.

**READ (brief).** Calm means FLUSH. The four assessment cards became a 1px-divided fact
strip, the concerns lost their rose panel, and the colleague's bordered card became the
last flush section of one white sheet. Nothing floats. The rose panel had to go on a rule
rather than on taste: a filled alarm-tinted panel is a cost signal, and READ is the mode
where nothing may suggest a price. It keeps the mission photograph. **~70px of height came
back**, which is what paid for the result band below.

**DECIDE.** One element no other screen in the game has — `StakeMark`, beside the question,
carrying the three dimension pictograms and the words *"Committing is final"*. The words
are about irreversibility rather than magnitude, deliberately: a commit is always final,
whereas "this moves all three" is false on the `nothingMoved` outcomes. It is not a
prediction and says nothing about which option does what (G3). The mission `eyebrow` came
off this beat to pay for it — an all-caps kicker over a heading, on 17 screens, repeating a
string the brief showed thirty seconds earlier. Net **−22px** per console decide beat.

**RECEIVE.** Three things, and the first is a subtraction: the consequence stopped
rendering `mission.hero`. It was the **same image file the brief renders, in the same
place, at a similar size** — a picture of the situation standing in for a picture of the
outcome, and the single biggest reason the two were indistinguishable in a thumbnail. In
its place: the three figures at the 56px display step, flush and full width, divided by 1px
rules, which is the only place in the run where a numeral outranks a heading. Then the
verdict on the player's own call full width, then the read and what changed side by side.

**Two other arrangements were built and looked at, and both were worse.** Giving the spare
height to the read panel put a 350px field of lavender under 140px of type. Giving it to
the result band left the three figures floating in the middle of a void that grew to ~500px
at 1440×1024. A document that ends, with desk under it, is the one that reads as finished.

**Cost:** the consequence has no art at all now, and the decide beat has lost a line of
content framing. **Reversible:** both, in a line each — `hero` is still in the props.

---

## D-063 · Under reduced motion every meter in the game reads 100
Found by looking at the render with `reducedMotion: "reduce"`, not by any test.

`index.css` collapses reduced motion with `transform: none !important` on `*`. Every meter
in GPL draws its value as `transform: scaleX(v/100)` from a left origin — correctly, because
of width, height, margin and padding Linear's engineering write-up says "never animate
those. I mean never." But an inline style cannot outrank `!important`, so under `reduce` a
`scaleX` bar renders **unscaled, which is full width**. A player who asked the operating
system for less movement is shown three bars at 100 whatever the numbers beside them say.

Four sites: `MeterTrack` and `ChapterStepper` in `ui/shell.tsx`, the level bar in
`ui/reward.tsx`, and the new result band in `ui/consequence.tsx`.

**Fixed in the result band only**, because that is the owned file: `useReducedMotion()`
picks `width: v%` when there is nothing to animate and `scaleX` when there is. Under
`reduce` a width is static, so it costs no layout and the number is right. The screenshot
at `docs/modes/reduce/mode-receive.png` shows the fix and the bug side by side — the band
reads 59 / 52 / 50 and the rail eight inches away still reads full.

**Cost:** the same two lines are needed in two other files and are not written. **Reversible:**
irrelevant; the current behaviour is a defect, not a decision.

---

## D-056 · The path-reveal shows an untaken outcome only where it is certain
The chapter debrief's second column is the reveal Detroit: Become Human ends every chapter
with — the branch you did not take — and the brief for it asked for "the sibling outcomes
that did not fire". Two thirds of that is exact and one third is not, and the split is
worth recording because the tempting version is the one that lies.

**Exact, from the content itself.** On an investigate beat the roads not taken are the
questions the player did not spend a slot on; on a build beat they are the components left
out. `HistoryEntry.chosenIds` minus the authored list is the answer, and it is the best
teaching on the screen — *"Who else is in the room?"* sitting unasked next to what the
player did ask is the whole lesson of m2 in one line.

**Not knowable here.** For a `choice` beat, the OPTION not taken is exact, but the outcome
it would have produced is selected by matching conditions against the flags and dimensions
as they stood before the commit. `HistoryEntry` records `dimsBefore` and no flags, and
flags are only ever added — so they could be reconstructed by subtracting the ones later
beats set. That reconstruction is a game rule, and rules do not live in `src/ui` (E2). The
alternatives were worse: printing each option's LAST outcome, the unconditional fallback,
would be a plausible-looking headline that on a third of options is not what would have
happened, which is the exact class of quiet mis-teaching the whole engine is built to
prevent.

So the rule is **show the result only where the branch has exactly one outcome and no
condition on it.** Measured against today's content that is **14 of the 50 choice options**
— 3 in chapter one, 2 in two, 6 in three, 3 in four and **none in chapter five**, whose
eleven options all branch. The ones without a result are still named, because *"you did not
take the phased price"* is the lesson and inventing its consequence would not add one.
Chapters one, two and three each also hold an investigate or build beat, whose entire
untaken list is exact; **chapter five holds neither and has no certain option**, so its
debrief is the one that shows names and no results at all. That is the screen to look at
first if this rule is ever revisited.

The certain ones carry their authored tone as their colour, which is how a cyan *"It is
duller, and it will hold"* ends up sitting beside a `hard` decision in chapter three. That
single line is the most useful thing on the screen, and it is also the argument for fixing
the other 36.

**Cost:** 36 of 50 choice branches are named without a result, chapter five's entirely, and
a reviewer cannot tell from the screen which ones those are. **Reversible:** yes, and
cheaply — the moment `HistoryEntry` carries the flags as they stood at commit, `untakenOn`
can call `selectOutcome` and every branch gets its real headline. One field and one call.

---

## D-057 · The reflection's missing meters are silent for the eye and spoken for the ear
`SCREEN-SPECS.md` §4.5 makes the absent meters load-bearing: meters mean stakes, so no
meters means nothing is at stake, and the player learns it without being told. The first
build of the screen printed *"Nothing on this screen changes your position."* at 12px under
the responses, which explains the joke to the only people who can already see it.

But an absence is not perceivable on the audio channel at all. A screen-reader user meets a
reflection as an ordinary beat with a person, a question and two buttons, and has no "where
the meters used to be" to notice. So the sentence stayed and became `sr-only`: **the visual
channel carries it by subtraction and the spoken channel carries it in words.** Same
information, two encodings, neither redundant.

The mechanism is also structural rather than conditional. `ReflectionRail` is a separate
export that renders "Your file" and nothing else, and `App.tsx` passes it in place of
`InsightRail`. Hiding a block inside `InsightRail` on a `role === "reflection"` test would
have put the rule somewhere a future edit could silently undo.

**One measured correction while building it.** "Paper, warmer" was first done as a radial
wash of `--color-accent-tint` at 78% over the desk, and it was invisible on a screenshot —
that lavender is within about 1.1:1 of the desk it sits on, which is the same mistake this
palette has already recorded twice, for the meter tracks and for the page wash. Washing
toward `--color-surface-panel` instead — the warm paper step, 1.39:1 against white — makes
the room visibly different while leaving the white card the lightest thing on screen.

**Cost:** one string that will read as dead weight to anyone who greps for it without
reading the comment. **Reversible:** yes, one element.

---

## D-058 · On the stage the dimension fills invert, so the arc is drawn in the `-line` tokens
`--color-deliver-solid` is `#054e9e`. On paper that is a legal fill — 3.90:1 on white — and
on `--color-stage` it is **2.34:1**, which fails 1.4.11 for a line that carries meaning. So
the three paper solids are not a set on the dark ground: Winability measures 5.23,
Profitability 4.87 and Deliverability 2.34, one of them invisible and the trio incoherent.

The step-7 `-line` values clear it on all three — **5.59 / 5.19 / 4.58** — and sit within
1.2 stops of each other, so the arc reads as one family rather than one bright line and two
murky ones. `ui/dashboard.tsx` therefore draws every stroke, marker and bar in
`--color-<dim>-line`, and the header comment carries the measurements so the next person
does not re-derive them.

Note this is a **pre-existing condition, not a new one**: `HubScreen`'s `StageMeter` paints
its Deliverability bar in `deliver-solid` on the same ground today, at the same 2.34:1.

**Cost:** two spellings of "the Deliverability colour" depending on the ground, which is
exactly the ambiguity `--color-glow-ink` exists to remove for violet. The real fix is a
`--color-<dim>-stage` triad in the token layer; until it exists, `-line` is the honest role
name for a stroke. **Reversible:** yes — one object, three lines, in one file.

---

## D-059 · The arc measures its box; it does not scale into it
The obvious way to draw a chart that has to be 340px tall at 1440×900 and 466px tall at
1440×1024 is a `viewBox` with `preserveAspectRatio`, and it is wrong here. Uniform scaling
scales the type too: at the 739px height the box is 892×340 against a 880×470 canvas, a
0.72 factor that puts the 13px axis labels at 9.4px and the 12px chapter labels at 8.7px —
under the scale's own 12px floor, on the screen whose whole job is to be read.

So the canvas is sized in real pixels from a `ResizeObserver` on its container and the
geometry is derived from that. The SVG is absolutely positioned inside the box it measures,
so a taller chart cannot make a taller box and there is no feedback loop.

**Cost:** one observer and one piece of state in a component that would otherwise be pure
render, plus a chart that has a floor (560×236) below which it scrolls horizontally rather
than shrinking — which is what happens at 390px wide, where the direct end labels would
otherwise be cut off and the non-colour carrier lost with them. **Reversible:** yes, but
only by accepting sub-12px axis type.

---

## D-060 · The reachable range's ceiling is 100 on all three meters, so the floor is the story
`reachableExtremes(story)` today returns **win 41–100, profit 17–100, deliver 0–100**. Every
ceiling is the cap, which was not the expectation: the dashboard's headline comparator was
meant to be "84 of a reachable 100", and against a ceiling of 100 on every meter that
sentence carries almost no information.

The information is at the other end. A greedy policy can drive Deliverability to **0** and
Profitability to **17**, and cannot pull Winability below **41** — so what the range
actually says is *how far down each meter can be pushed*, which is a statement about where
this story's risk lives. The bar therefore renders the whole witnessed band as a shaded
region behind the player's value rather than only a ceiling tick, and the caption names the
band rather than the maximum: "a floor and a witnessed ceiling, not a theoretical one."

Measured cost of asking: **22–80ms** for the whole replay, memoised per `Content` object in
a `WeakMap`, so it is paid once per session and not once per open.

**Cost:** the phrase "of a reachable 100" reads as flat on all three rows until content
changes make a meter genuinely uncappable. **Reversible:** yes — and it reverses itself, as
it reads whatever the engine reports.

---

## D-055 · The blank floor was a layout fault, and I had diagnosed it as a content shortage
Three times I moved that empty space around the chat surface and three times I described it
as "not enough content to fill a beat" — ~190px below the replies on m9, ~420px on m3,
recorded in D-052 and D-054 as a cost worth paying. It was not a content problem. **The
whole block was top-aligned inside a taller container, so every spare pixel collected at
the bottom, underneath the replies**, which is the one place it reads as a screen somebody
did not finish.

No client lays out that way, and the fix is the shape every one of them uses: the thread
takes all the height, its messages sit at the BOTTOM of it against the composer, and the
slack collects ABOVE the first message — where the same pixels read as *the start of the
conversation*. Measured floor, bottom of the last region to the bottom of the working
area: **m3, m9 and m10 are all 0px, at 1440×900 and at 1440×1024**, on the listening beat
and on all three states of the gate. The composer now also sits in the same place on every
chat beat instead of floating up and down with the length of the thread.

**The slack is a real spacer element, not `justify-end` and not `mt-auto`.** Content
distribution and auto margins in a scroll container put the overflow past the *start* edge,
which is historically unreachable — so on month five, the one beat whose thread genuinely
overflows, the relayed message would have become unscrollable. A `grow basis-0` child takes
the slack when there is any and collapses to nothing when there is not, and the scrollbar
stays ordinary.

**The call needed nothing**, and it is worth saying why rather than leaving it as an
omission: its flexible region is the tile wall, which sits ABOVE the captions and the
composer, so the slack was already collecting in the middle of the window where a call
window's slack belongs. Measured at 0px floor on both viewports before this change.
Stretching the tiles to eat the remaining air would make them portrait at three
participants, which is not what a tile is.

**What this supersedes:** D-052's "a chat beat with one message leaves 270px of empty desk"
and D-054's "the thread is sized to its content and the surplus becomes desk". Both were
descriptions of a bug I had rationalised. `data-region="reply"` is on the composer now, so
the floor is measurable rather than eyeballed.

**Cost:** none paid in content, type or padding — the same words in the same sizes.
**Reversible:** yes, one class on the thread and one child element.

---

## D-054 · On a chat surface the situation IS the thread — and two smaller corrections
Three refinements to D-052, the first of which supersedes part of it.

**1 · The empty floor was a symptom, and the disclosure was the cause.** D-052 put
`situation` behind the console's one-line "— the brief" disclosure on both surfaces and
left ~270px of empty desk on a sparse chat beat. Shrinking or padding that floor would
have been treating the symptom: a thread whose entire history is one line, with the actual
context hidden behind a "show" link, is *a thread pretending to have no history*. So on the
chat surface the paragraphs are the history — earlier messages from whoever is speaking,
above their closing line — and the disclosure is gone. The call keeps it, because a
transcript can only hold what was actually said and scrollback we invented would be
putting words in somebody's mouth.

The split is dictated by the prose, not chosen: in all five chat beats the **first**
paragraph is the narrator setting the scene — "Everything is agreed. Nothing is signed." —
and on month five it says *"the delivery lead wants thirty minutes"* while the delivery
lead is the person talking. So paragraph one becomes the thread's unattributed subject and
everything after it becomes hers. A single-paragraph beat (m3) has no narrator line, so it
becomes a message. Capped at three, oldest first; nothing authored reaches it today, but a
five-paragraph variant would otherwise bury the line the replies answer. Consecutive
messages from one person group under one avatar — how every client renders it, and 22px per
message handed back to a thread that has to sit above a five-reply composer. Measured:
m9 and m10 are **0px over at both 1440×900 and 1440×1024**, and month five still shrinks
and scrolls rather than pushing the composer off.

**2 · The player's own tile said "Y".** A monogram of the word "You" is a letter in a
circle, and it read as a placeholder somebody forgot to finish — on every conversation
beat. It is now a person silhouette, `PersonGlyph` in `ui/icons.tsx`, deliberately NOT an
`IconId`: that union lives in `engine/types.ts`, which a rendering detail has no business
widening, and `people` already means "participants" in the same window's header with a
number beside it. `Monogram` split into `Disc` + initials so there is one gradient circle
in the build rather than two.

**3 · The steer could not come back, and here is the number.** D-053 dropped
`mission.tip` for the second half of a console decide beat and flagged it as the trade to
revisit. Revisited, measured, and reverted: bringing the card back the moment the gate is
satisfied wraps the action bar to **two rows — 137px against 73px** — at 1440×900 on
mission one, and the 64px it costs overflows a decide screen that fits to the pixel, by
15px. Holding the return to `xl` fixed 1024 and did nothing for the viewport that matters.
The measurement is now a comment at the site, so the next person does not retry it blind.

**One real bug fell out of measuring this.** The chosen prediction chip grew by ~20px when
its tick appeared — the chip the player had just clicked shoving its neighbours — and at
1024px wide that wrapped the row and measured as a 35px overflow on the beat where the gate
opens. The tick's space is now reserved with `invisible`, so the box is constant in both
states.

**Cost:** m3, the shortest mission in the game, still leaves ~420px of desk on its
listening beat — one paragraph of situation and one line of dialogue is all the content
there is, and inventing more would be worse. At the minimum supported window (1024×768) a
conversation beat needs 35px of inner scroll, against 420px for a console decide beat at
the same size; below 1000px tall the working area is allowed to scroll inside the console
(D-024). **Reversible:** yes — `history()` is one function and the call surface never
calls it.

---

## D-053 · The commit gate was a legend, not a control — and the bug was on mission one
The reported defect is "cannot get past Commit to this". `canCommit` needs a selection AND
a prediction, and the second requirement was a 13px question with three 12px chips wedged
into the action bar between a 360px photographed quote and a 280px button, at the far edge
of a 1,440px bar. Select an option, press the button, nothing happens, nothing on screen
says why: `onBlocked` announced the reason to a live region and drew nothing. The ten new
conversation beats do not include m1 or m2, so fixing it only in the new staging would have
left the bug exactly where it does the most damage — on a first-time player's first
decision.

Four changes, none of which touches the gate:

1. **The requirement is an object, against the button.** A bordered lavender panel with the
   question at 15px/bold, `ml-auto` so it sits beside the control it is blocking. The first
   attempt put it where the colleague's card used to be, at the far left — which is the
   corner the report says nobody looks at. (Two `ml-auto` items SPLIT the free space, so the
   button's own auto margin is now conditional; that is why the panel first landed floating
   in the middle of the bar.)
2. **The chips look pressable**: 32px tall, 13px type, 1.5px border, and the chosen one
   carries a tick as well as a tint. They were 22px and 12px in a hairline.
3. **A blocked press is drawn, not only spoken.** Re-keying the panel restarts its
   entrance, so the requirement lands again — measured in the browser as `gpl-land`, 260ms,
   on the element containing the question, on both stagings.
4. **The colleague's steer stands down while the requirement is up.** Good content
   competing with the one thing the player must do — and at 1280px the two of them plus the
   button do not fit on one line, so keeping both would wrap the bar and take height off the
   working area. It still appears on every decide beat before a selection is made, and on
   the resolving beat.

**Cost:** `mission.tip` is off screen for the second half of a console decide beat. That is
the trade I would revisit first. **Not paid:** `canCommit` is untouched — the prediction is
the game's "before" and removing it would delete the learning loop, so the fix is
legibility only. **Reversible:** yes, all four are local to `ActionBar`/`PredictionStrip`.

---

## D-052 · Conversation beats are staged in the artefacts of the work, not on a painted stage
Seventeen missions rendered as one shape, and the complaint was that "the screens are almost
the same". They were, so no transition could fix it: animating between two identical shapes
is the same shape. `presentation: "dialogue"` (D-051) makes ten of them a conversation, and
this is what a conversation looks like.

**A visual novel was built and thrown away.** Blurred hero, bottom-anchored character bust,
textbox across the bottom — the shipped Ren'Py geometry. Two things were wrong with it: it
is a genre transplant onto a consulting game, and it needs the 21 sprites and 9 painted
rooms `docs/ART-BRIEF.md` prices and nobody has drawn. Consultants live in calls and chat
threads, so the interface becomes the fiction instead of illustrating it — and that needs
no art at all, because **a call with the cameras off is a grid of initials in circles**, and
the monogram built for the three client voices who have no photograph stops being a
fallback and becomes the authentic state. The tile is labelled "Camera off" and means it.

What the surfaces are:

- **`call`** — a window header (Live, the mission title, the participant count), a tile
  wall, live captions, a composer. The **active-speaker ring** is the load-bearing state:
  it says who is talking without a word being read, and it **moves to the player's own tile
  the moment the replies open**, which is the floor passing to them. Ring + chip +
  attribution, so it never rests on hue (E6).
- **`chat`** — same frame, same composer, bubbles instead of tiles, and your chosen reply
  lands as a right-aligned draft marked *Not sent yet*, which is exactly what it is.
- **`thread`** is deliberately not built. One surface done properly plus a light variant
  beats three half-done ones.

Four things that are not obvious and were each got wrong once first:

1. **One component, both phases.** `brief` and `decide` stay two engine phases — the gate
   requires it — but they are one screen and one mounted instance, so the window, the
   participants and the typed caption survive the phase change. Two slots in `App.tsx`
   would unmount and remount the call, which is a cut dressed as a conversation and would
   retype the line the player just read.
2. **The typed line is three copies of the string**: `sr-only` in full for assistive
   technology from the first frame, a `visibility: hidden` ruler so the box cannot change
   size mid-sentence (the tile wall is the flexible region — it would have resized twice per
   line), and the animated run. Reduced motion shows it whole — replacement, not removal.
3. **Nothing is deleted from the beat.** `situation` and `concerns` sit behind the same
   one-line disclosure the console decide beat uses, open while listening and closed once
   the replies are up; the colleague's `consider` questions occupy the composer's slot on
   the beat before there are replies, so the click that opens the replies changes what that
   region is *for*. `room: "internal"` keeps the client's line as a **Relayed** message and
   keeps them off the tile wall — they are quoted, not present.
4. **A short thread does not stretch.** Sized to content with the surplus left as desk; it
   shrinks and scrolls on month five, where five replies and three messages do not fit. Both
   of the first two attempts — bottom-anchored, then top-anchored and stretched — were a
   500px hole with a bubble stuck to one edge of it.

**Cost:** the hero photograph is unused on these ten beats, and a chat beat with one message
leaves 270px of empty desk at 1440×900 (390px at 1024). The 160px portraits are never
upscaled — they sit in a 104px circle — which is why no tile carries video. **Reversible:**
entirely. `presentation` is one word per mission and `isDialogue()` renders the console for
anything it cannot stage as a conversation.

---

## D-051 · The dialogue staging is enforced, and one of the five rules is a warning
`Presentation` makes a beat a conversation by changing one word, which is the property that
makes it affordable — and also the property that makes it fail silently. With
`presentation: "dialogue"` set and `option.say` absent, the renderer falls back to `title`,
which is written in the third person for a comparison card: *"The post-purchase
experience"*. Nothing crashes, nothing looks broken enough to report, and the beat quietly
renders a row of captions where a person should be talking. Same failure class as a
condition reading `knows:ops_constriant` — the check that earns its place in this file.

Five rules, four of them errors:

1. **Every option of a dialogue mission needs a non-empty `say`**, and the message names the
   mission and the option, because the fix is in one option of one mission. Not evaded by
   `""` or `"   "`, which is the evasion `pros: [""]` used until it was closed per entry.
2. **`say` is leak-checked** on the same surface as `commits` — and *regardless of staging*.
   Parking a prediction in `say` while the beat is `console`, where no screen shows it and
   no reviewer reads it, then restaging the beat later with one word, is a leak with a
   delayed fuse. G3 is a property of the content, not of what is currently on screen.
3. **`say` is budgeted at 20 words.** Observed max across the 37 authored replies: **20**. So
   unlike every other number in `BUDGET` this one sits exactly ON the authored maximum
   rather than above it — deliberate, because 20 words is where the stacked full-width row
   wraps to a third line. The next line over it is a fit problem, not a style preference.
4. **A dialogue beat must have somebody to speak first**, checked in the renderer's own
   resolution order: a `quotes` entry, then `saidQuote`, then `advisorLine`, then
   `advisor.quote`. Blank-but-present openers count as silence. **Known residual:** a beat
   whose ONLY opener is a *conditional* quote passes and still opens silent in the states
   where the condition fails. Deciding that statically means asking whether a reachable
   state satisfies the condition, which is the sweep's job — `analysis.test.ts` already
   fails on a line of dialogue no reachable state can hear, so the hole is closed from the
   other end rather than guessed at from this one.

5. **`say` must not merely restate `title`** — and this one is a **warning**, the only one
   this pass adds. Judging paraphrase is a reviewer's job: a reply is *answering* the thing
   the title names and will often pick the noun phrase back up, so a hard gate would fire on
   prose doing exactly the right thing. It reuses the existing
   `normalise`/`contentWords`/`overlap` machinery rather than introducing a second
   similarity measure, because two ways of asking whether two sentences match is two
   answers, and the second one is the one nobody recalibrates.

**The threshold was measured, not picked**, on the authored replies rather than on a guess
about them. Across all 37: the closest `say`/`title` pair sits at **0.21**, the next at 0.20,
and **30 of the 37 below 0.10**. The worst case is always the same shape — a reply that
echoes the verb and the noun of a four-word title while saying something new about them,
which is exactly the register the field exists for. Nothing authored reaches 0.34, so
`SAY_TITLE_OVERLAP_LIMIT = 0.7` sits at better than **three times** the observed maximum with
the whole band beneath it empty, and still catches what it is for: the title with one word
bolted onto it scores 0.75. `validate.test.ts` pins the measurement against half the limit,
as it does for `LESSON_OVERLAP_LIMIT`. Tolerance is wider than that check's because two
lessons have no business sharing vocabulary at all, whereas a reply answers the thing the
title names.

Note what "warning" costs here, because it is not free: `engine.test.ts` pins the set of
non-flag warnings to empty, so a warning that fires on *today's* content stops the build
exactly as an error does. The severity is soft only for the author of the next mission, who
gets told rather than blocked.

One more thing the gate is worth: the noise floor is applied to the **spoken** bag only, not
to both. Titles are three or four content words by budget, so a floor on the title bag would
have skipped the check on most of the game. Jaccard already handles the size difference in
the safe direction — a genuinely new sentence that happens to reuse the title's noun scores
low because it brings words of its own.

**Cost:** 140 lines in `validate.ts`, most of them the calibration comments rather than the
checks, and 358 in `validate.test.ts` — 23 tests, including the vacuity guard, because five
rules enforced against zero beats staged would be the `watchFor` failure in reverse. No
existing gate retuned or weakened. **Reversible:** yes, per rule; rule 1 is the only one
whose removal would matter, and what it protects is the reason the staging exists at all.

---

## D-050 · `maxWorkers: 4` was an incomplete diagnosis, and the failure came back
The suite has exited 1 with every test passing, on and off, for a fortnight:
`[vitest-worker]: Timeout calling "onTaskUpdate"`. D-043 read that as a main thread too
busy to answer an RPC and capped the pool at four workers. The suite went green and three
times faster, so the diagnosis looked confirmed. **It was half right, and the half it
missed is the half that matters.**

`onTaskUpdate` is a round trip. A worker blocked in a twenty-second synchronous sweep
cannot read the REPLY to its own call either, so the measured latency exceeds birpc's
deadline however idle the main thread is. Capping the pool bought headroom; it never
removed the race. The failure returned the moment anything else was using the machine
— in this case an ordinary browser, which is the normal condition and not an exotic one.

Measured, all three with a browser open:

| | duration | exit |
|---|---|---|
| 4 workers, 9 files | 143s | **1** |
| 2 workers, the 2 heavy files only | 148s | **1** |
| serial, 9 files | 150s | **0** |

So on a busy machine parallelism buys **nothing** — the heavy files saturate the cores
either way — and costs the exit code. It is only faster on an idle machine (35s), and a
suite that needs four spare cores to report itself green is not a gate, it is a coin toss.
`fileParallelism: false`.

Belt and braces, because serialising is a statement about today's content: the exhaustive
walk is now the generator `sweepWalk`, and `analysis.test.ts` drives it and awaits a
macrotask between breadth-first levels. One level could not blow the deadline even if the
config line were deleted. **The scheduling lives in the test, not the engine**, and the
purity check now bans `setTimeout`/`setInterval`/`setImmediate`/`queueMicrotask` in
`src/engine` to keep it there — a timer in the engine is how a replayable walk quietly
acquires a dependency on how busy the machine is. `sweep` itself is unchanged for every
caller and remains the single implementation.

**Cost:** ~110s of wall clock on an idle machine, and `npx vitest run <file>` is still fast
for iteration. **Not paid:** no assertion weakened. The alternative repeatedly on the table
was making the determinism check cheaper, and that one compares two independent sweeps of
the entire reachable state space — if it ever fails, a result has stopped being
attributable to the player's decisions, which is the whole premise of the game.
**Reversible:** yes, one line.

---

## D-049 · Conditional client dialogue, because Marcus must not introduce himself
`saidQuote` renders unconditionally, which was fine while all four of them were the
sponsor — she is on screen in chapter one and owns the budget. It is not fine for the two
client people who actually decide the outcome. **Marcus Reed owns every system that would
have to change**, and finding that out is the reward for spending a question on "who can
stop this?" at m2. An unconditional quote from him would have handed his name, his job and
his scepticism to a player who never asked, which is the single discovery the first two
chapters are built around.

Per `CLAUDE.md` this is a missing engine capability rather than something to work around,
so: `Mission.quotes` — a first-match-wins list of `ConditionalQuote`, with `saidQuote` as
the unconditional fallback. **Kept orthogonal to `variants`** on purpose. A person speaking
up is not the same event as the scene being rewritten, and coupling them would force an
author to fork three paragraphs of prose to add one line of dialogue.

The gate that matters is the coverage one. A shadowed entry — a broad `when` sitting above
a narrow one — silences the narrow quote permanently, and because the fallback still
renders, **the brief looks completely normal**. So `sweep` tracks `firedQuotes` exactly as
it tracks `firedVariants`, and `analysis.test.ts` fails the build on a line of dialogue no
reachable state can hear. `validate.ts` also leak-checks, word-budgets and
unset-flag-checks the new field, because a conditional surface that skips those is three
known bug classes re-opened.

**Cost:** one engine function, one tracked set, ~20 lines. **Reversible:** yes — delete the
field and the three authored entries fall back to `saidQuote`.

---

## D-048 · The teaching was attributed and still read like a wall poster
The original complaint about this game was that it sounded condescending. Every previous
pass attacked the *framing*: an unattributed "Tip." box became a named colleague with a
job, a photograph and a stake. That was correct and it shipped. What it exposed is that
**framing was only half the problem**, and the remaining half was measurable.

Each advisor speaks in two places. Their `quote` and `advisorLine` were written as speech —
*"Whatever we write down, somebody has to build. I'd rather promise less and mean it."*
Their `lesson.principle` was written as a proverb — *"Price is not a number, it is a
position."* Both render under the same name and the same photograph, inside quotation
marks, on the same screen. Measured by `tools/voice.mjs`:

| | first person | unsituated maxim |
|---|---|---|
| `quote` / `advisorLine` | 73% | 1 of 15 |
| `principle` | **0 of 41** | **30 of 41** |

So the defect was never that the teaching lacked an author. It is that **one named person
spoke in two registers depending on which field the words were stored in** — 3 of 4
advisors had zero first-person teaching lines against majority-first-person speech. Putting
a proverb in a real person's mouth and a photograph beside it arguably made it worse.

All 41 rewritten in the voice of whoever says them, teaching unchanged: *"A price is a
position I have to hold for months, not a number we fill in tonight."* Split speakers 3 of
4 → **0 of 4**; unsituated maxims 30 of 41 → **0 of 41**.

Two things learned the hard way. The overlap gate's stopword filter drops words of ≤2
characters, so `we`/`us`/`my`/`I` are free but **`our` counts as a content word** — leaning
on "our" in all 41 would have walked every pair toward `LESSON_OVERLAP_LIMIT`. And the
maxim detector over-reported badly on its own: *"A price is a position I have to hold"*
matches the copula shape, so the honest test is tenseless AND impersonal AND **containing
nothing that points at the event**. The grammatical shape was never the defect; being
unsituated was.

**Cost:** 41 lines rewritten, ~1.1 kB of content. **Reversible:** yes, but the old lines
are only in git — the measurement is the reason not to go back.

---

## D-047 · The decide screen has no reading stations, and that is the finding
`DENSITY-FRAMEWORK.md` §B specifies a five-station reading order and ranks the devices
that enforce it, strongest first: **a shared rule**, a container border, an air step, a
size step, one accent fill. The instrument only ever counted the last two — prominent type
and saturated fills — and `DESIGN-SYSTEM.md` permits exactly one C\*>60 fill per screen
while the type step above the 18px option title is 24px, the question's own size. So
stations 1 to 3 were structurally invisible and every screen scored 1 of a 5–6 band.

That looked like an instrument artefact, so the probe now counts separators too, which is
the device the spec ranks **first**. It then found **none**. Measured directly on the
decide screen: zero elements spanning ≥55% of the 1,414px work area carry a top border or
render as a hairline. The borders in this design are all on the option cards, which are
163–205px wide.

**So the screen genuinely has one station: a 24px heading, then a row of cards.** There is
nothing dividing it into reading stops. That is the most literal available form of the
complaint that started this work — "no system to read the flow" — and it survived four
rounds of fixes aimed at colour, copy length, the brief/decide split and a density rubric.

Kept rather than reverted, because the instrument now matches its own specification and
will count a rule the day one exists. **Cost:** stations scores 0/10 honestly instead of
10/10 dishonestly. **Not fixed here:** adding the separators is a layout change, and it is
the next thing this screen needs.

## D-046 · Declaration is not resolution, for the third time — `@theme static`
Tailwind v4 emits only the `@theme` variables it can find, by scanning source for the
literal token name. Half this palette is named from a template literal —
`var(--color-${d}-tint)` for the meter tracks, `var(${meta.fillVar})` for their fills — and
a scanner cannot follow that. Resolved in a real browser, **21 of 114 declared tokens were
the empty string**, and two were load-bearing: `--color-profit-tint` and
`--color-deliver-tint` were blank, so **two of the three meter tracks had no fill on any of
the 31 beats** while `DESIGN-SYSTEM.md` documents the tinted track as deliberate.
`--color-win-tint` survived only because the string appears in a **code comment** about an
earlier bug in the same file.

Nothing could see it. `tokens.test.ts` parses `index.css` and asserts each tint is declared
exactly once and is not self-referential — both true, and both beside the point. This is
the same failure as D-010 and D-037 and the self-referential tints of D-036: **a test that
checks a name is not a test that checks a value.**

`@theme static` makes the palette's documentation and its runtime agree. **Cost**, measured
by building both ways: the 19 genuinely unused tokens it also emits take the stylesheet
from 7.98 to 8.15 kB gzipped, **+0.17 kB**. **Reversible** in one word, at the price of a
palette that cannot be trusted.

## D-045 · The closing debrief is two views of one data source; the ring is deleted
The debrief overflowed its box by **2,700px** at 1440×900 and by 1,967–2,782px depending on
the path, and by 2,576px at 1440×1024 where the fit rule is actually enforced — a hard
build failure. 598–657 words in one column, one declared region, 10–12 distinct fills, and
a concentric gauge that drew Winability 100 as a **408px** arc and Deliverability 100 as a
**283px** one: a 31% error in the last image the game leaves anyone with, animated over
1.1 seconds, the longest motion in the product.

Concentric arcs cannot compare, because circumference is a function of radius, so equal
values are drawn unequal **by construction**. The ring is replaced by the same three-panel
small multiple the resolving beat already uses — equal tracks on a shared baseline, where
100 and 100 are the same length to the pixel — and the established `target`/`coins`/`layers`
pictograms return in place of `◆ ● ▲`.

The audit trail a facilitator needs stays in the DOM and is revealed by `@media print`,
which also opens the disclosure: every decision, every outcome headline, every colleague's
`watchFor`, the ledger detail, and the run code at the foot. Measured at A4's 688px content
width it is 3 pages / 50 kB. On screen: **254 words, 6 regions, 8 fills, 0px of overflow.**

This is also where `watchFor` finally renders — 32 lines authored, 0 shown, 471 words of the
only conditional knowledge in the game — attributed to the colleague who said it, and
guarded so it can never appear unattributed. 21 of the 30 imperatives in the content live in
that field, and an unattributed imperative is the lecture this project keeps deleting.
**Cost:** the dense form needs a printer or a click. **Reversible**, but not without
re-deriving the geometry: the previous form failed the fit gate at every enforced height.

## D-044 · Five columns is a different card
m10 became a five-option beat so that "price the change" could exist as an answer at all
(backlog 5.1 — the game had no change-control answer at all). At four options a card is 205px wide; at five it is 163px, and the poster was
authored for the wider one — the card needed 620px of a 568px row and the primary label was
**clipped mid-word** by the console's bottom edge, which is worse than an overflow: an
unreadable control on the object the screen exists for.

Three changes, scoped to five columns or more: body 15px → 13px, medallion 60px → 48px,
"Select this option" → "Select". The type step is not a concession — `DESIGN-SYSTEM.md`
assigns 15px at a ≤66ch measure and 13px to card body at ≤46ch, and a 163px column is
**22ch**, below Bringhurst's 45ch floor. 15px there was the wrong step, not the right step
shaved. 620px → 545px, nothing clipped, no content cut, and at 3–4 options the card is
byte-identical to before. **The alternative was cutting one of the five options**, and two
of them are the ways to pay for a change and two the ways not to — the beat's whole lesson
is the contrast.


## D-041 · Below 1024px the game says so, rather than reflowing into a layout nobody designed
At 390px the console rendered as a 2,700px vertical stack with the primary action **250px
clipped** inside an `overflow-hidden` shell, and focusing a prediction chip scrolled the
whole application sideways with no scrollbar to get back. The screenshot harness captured
45 images of this and passed, because it checks *vertical* overflow of the working area
and the document reports no horizontal overflow when the shell clips.

That reconciliation is the finding: **`overflow: hidden` converts a reflow failure into an
invisible clip that satisfies both WCAG 1.4.10 and this repo's own fit gate.** An
accessibility audit scored 1.4.10 a pass at 390px, correctly, by measuring the document;
the UX audit measured the shell and found the button unreachable.

Verified clean at 1024×768, 1152×800, 1280×800 and 1366×768, so the floor is measured
rather than assumed. Below it, a designed notice. Also fixed regardless of width:
`[data-region=commit]` now wraps — three fixed-width children gave it a ~640px hard
minimum, and `gap-y-2` was already present, so wrapping was always the intent.

**The panel split and the dissent is recorded.** The accessibility reviewer's position is
that "desktop-only in the README" is not available for mandatory training, because it
reaches people on loaned and personal devices and a README line is not a reasonable
adjustment. That is right, and it is why this entry says a small-screen design is a
**precondition for required deployment** rather than a backlog item. What ships today is
honest about its limits; it is not sufficient for a compliance context.
**Cost:** phone and tablet players get a notice. **Reversible:** yes — it is one branch.

## D-040 · A gate that skips itself reports green
`tools/verify.mjs` is mandatory per `CLAUDE.md`. Its fit check opened with
`if (!ENFORCE_FIT) return;`, where `ENFORCE_FIT = DESKTOP && VIEWPORT.height >= 1000` and
the default viewport is **1440×900** — so for every run of the documented workflow the
fits-one-screen rule, which the file's own docstring calls what separates the console from
a form, returned on its first line. It was also never *called* on the consequence screens
or the ending: the screen carrying 100% of the teaching, and the densest screen in the
game, were both unmeasured at any height.

Now it always measures, calls on every screen type, and fails at the enforcement height
while reporting below it. Reporting rather than failing below 1000px is a deliberate
compromise — the rule is authored for a taller screen, and making the default run red
would simply get the flag flipped back.

**One thing this did not fix, and it is worth stating.** The harness plays exactly **one
path**, so path-dependent overflow is still invisible: an auditor measured the ending
overflowing by 1,867px on their run, and on the harness's first-option path it measures
739 in 739. Two other reviewers reported the ending's ledger sliced mid-word, both noting
it was path-dependent. Multi-path rendering is the outstanding gap.
**Cost:** none. **Reversible:** trivially.

## D-039 · Nine perspectives audited the finished game; the diagnosis was none of the four things previously fixed
Four rounds of feedback — "feels like a form", "too much text" ×3, "too densely packed, no
system to read the flow" — had produced four fixes: colour, copy length, the brief/decide
split, and the density rubric. The complaint did not move. So nine reviewers audited the
build independently, each from one named perspective (learning science, game systems,
narrative, UX architecture, visual design, accessibility, domain authenticity, adversarial
QA, product adoption), each required to cite a file, a line or a reproduction.

They converged from nine directions on one thing nobody had measured: **the game does not
respond to the player, and its read-outs cannot distinguish a thinking player from a
coin-flipper.** The evidence, all independently reproduced before being accepted:

- **0 of 45 options** sit behind a `requires` gate. Knowledge changes the prose and the
  numbers; it never changes what the player may *do*.
- **0 conditions read a dimension.** The three meters are write-only — a scoreboard
  attached to the side of a questionnaire, which `validate.ts` warns about only if it
  *stops* being true.
- **`win` never falls below 55** across all reachable endings, so `finalVerdict`'s
  `win < 40` branch — the failure ending for the game's first four chapters — is
  unreachable. It is unit-tested with synthetic dimensions, which is why it looked alive.
- **Five separate non-reader policies** (always-index-*n*, cheapest cost pips, dearest cost
  pips, meter-greedy) all reach the best verdict in the game. The engagement premium — the
  gap between the best reader and the best non-reader — is *negative*.
- **77% of runs render zero causal threads**, the section the code calls "the payoff of the
  whole design".
- The first **situation variant appears at mission 10 of 16**; the first nine beats read
  identically no matter what the player knows, promised or spent.

**Cost:** the density work was not wasted but it was not the fix, and three rounds of
effort went into the wrong layer. **Reversible:** the findings are recorded; acting on them
is the next decision, not this one.

## D-038 · The density rubric was scored out of 92, and its reading-flow factor was never built
`tools/measure.mjs` reported **92/92 PASS** and that number was reported upward three
times. The weights sum to **92**, not the 100 its own docstring claims. Two factors from
`DENSITY-FRAMEWORK.md` §C were specified, marked "✅ Auto", and never implemented:
disclosure share (weight 5) and **between-beat overlap** (weight 3) — the single factor in
the whole framework that measures continuity *between* screens. Measured by hand it scores
**0.50 against its own 0.85 threshold**: it is the one factor that would have failed, and
the one that speaks directly to "no system to read the flow".

The `stations` band also moved from the documented **5 (max 6)** to an implemented **3–4**,
which is what lets three stations score 10/10. D-033 closed with "the numbers should not
move to accommodate a screen that fails them", and then they did.

**The lesson is about instruments, not about density:** a rubric whose bands are tuned
after seeing the build measures the build's opinion of itself. **Cost:** the 92/92 claim
was worthless and has to be re-earned. **Reversible:** yes — implement both factors, restore
the documented bands, and re-score.

## D-037 · Gates must be structural, because three written for a specific bug could not see it
Three colour failures shipped past the test written to catch them, and the reasons
generalise:

- **A regex cannot follow a template literal.** The white-on-solid test matched
  `color: "#fff"` near `background: "var(--color-win…"` as literal source text. All three
  real offenders built the value as `` `var(${meta.fillVar})` ``. Fixed by making the rule
  structural instead: components may no longer name a role-ambiguous token at all.
- **Declaration is not resolution.** The triad test asserted `--color-win-tint:` appeared in
  the CSS. It appeared **twice** — the second as `var(--color-win-tint)`, a self-reference,
  which is invalid at computed-value time and destroyed the first. All three dimension
  tints resolved to the empty string while the test passed. Now checked for self-reference
  and duplicate declaration, and the computed values are read in a real browser.
- **A glob is a scope decision.** The sweep globbed `../ui/*.tsx`, so `App.tsx` was never
  swept and carried `text-[12.5px]` at two sites. Now `../**/*.tsx`.

A fourth, from the same family: `ENFORCE_FIT = DESKTOP && VIEWPORT.height >= 1000` in
`tools/verify.mjs`, whose default viewport is 900. The fits-one-screen rule — which the
tool's docstring calls "what separates this from a form" — does not run in the mandatory
workflow, and screens do overflow at 1440×900.

**Cost:** four gates rewritten, and a standing suspicion of the rest. **Note:** the new
tests initially failed on their own rationale, because each rule is documented at the site
it governs and the banned spelling appears in the explanation. Comments are stripped before
every sweep; the alternative was deleting the explanations.

## D-036 · Two colour tokens per dimension, because one cannot be legal in both places
`DIMENSION_META` carried a single `varName` per dimension pointing at `--color-win`, the
migration alias for `--color-win-solid`. Components used it for the bar fill *and* the 13px
label, so the label was painted in the fill colour: **#cd6d0a on white at 3.63:1** and
**#339075 at 3.90:1**, on 42 of 45 screens, while `DESIGN-SYSTEM.md` stated the rule being
broken. White text on the Winability solid appeared in two more places.

Split into `fillVar` (bars, strokes, chip backgrounds — 3:1 under 1.4.11) and `textVar`
(labels, numbers — 4.5:1 under 1.4.3). **The alias layer was the mechanism**: `--color-win`
reads as "the Winability colour", which is not a thing. There is a fill colour and a text
colour and they are different values.

**Cost:** one field became two at every call site. **Reversible:** no, and it should not be.

## D-035 · The prediction gate answers the question it prints
The gate asks "which of the three will move least?" and the consequence screen says "X
barely moved". The key compared **signed** deltas — which answers the question it used to
ask, "which will this hurt?" — and so returned whichever dimension *fell furthest*. Across
the 88 authored outcomes it named a falling dimension **61 times (69%)** and contradicted
the printed question **52 times (59%)**. The screen said "Profitability barely moved" beside
a tile reading **−14**.

The first fix compared magnitude and left a subtler bug of the same shape: returning a
single winner made the **tie-break** carry meaning. `reduce` keeps the earlier element and
`DIMENSIONS` begins with `win`, so 6 of the 12 tied outcomes keyed to Winability and
"always answer Winability" beat chance. At the meter ceiling — reachable by mission 14 — all
three deltas are zero and the screen claimed Winability held.

So `leastMovedSet` returns every tied dimension, the **engine** decides
`predictionCorrect` (a component comparing two ids cannot know a tie has several right
answers, and a component deciding a verdict is a rule in the UI), and `nothingMoved` gets
its own honest sentence. **Cost:** one field became four. **Why it mattered most:** this is
the only place in the game where the player commits a claim and is marked on it, so it is
the only thing here that can be *wrong* rather than merely unclear — and feedback that
contradicts the numbers beside it teaches the player to stop reading that channel.

## D-034 · The palette and type scale are derived, not chosen — `docs/DESIGN-SYSTEM.md`
Winability `#5b4de8` and the brand accent `#7c3aed` measured **ΔE2000 1.2 apart under
deuteranopia** — roughly half a just-noticeable difference, i.e. the same colour to about
6% of men, with the brand sitting in the middle of the channel that was supposed to carry
dimension identity. So the brand recedes to ink, the three dimensions own the chroma on an
Okabe–Ito triad (orange / bluish-green / blue, with a deliberate 56/54/34 lightness split),
and the worst pairwise separation across normal, protan, deutan and tritan vision becomes
**18.9**. Surfaces moved from lavender-grey to warm paper against cool ink.

Four live WCAG failures fixed at the same time: a **1.60:1** disabled button, a **2.78:1**
eyebrow, a **1.86:1** focus ring and a **1.52:1** border on controls. Type went from 27
sizes — including 9px and a run of half-pixels — to **seven integer steps**, because 1.25
from 12px gives 15/18.75/23.4/29.3 and non-integers are how half-pixels get born.

Three more failures were found later by audit and are recorded in D-036. **Cost:** dark mode
is deferred, because lightening the triad for a dark ground collapses its separation to
ΔE 3.5 — it needs a second independently optimised triad, not a token swap.
**Sources:** Okabe & Ito palette construction · Radix Colors scale semantics · Atlassian
token anatomy · Carbon type sets · W3C Understanding 1.4.11 · APCA 0.1.9 · Machado et al.
2009 CVD matrices · Bringhurst and Baymard on measure · Tinker 1955 on all-caps.

## D-033 · Density is a measured band, not a judgement — `docs/DENSITY-FRAMEWORK.md`
"Screens are too densely packed" was unfalsifiable, so `tools/measure.mjs` was pointed at a
real playthrough and the framework it referenced was written against the output. The
baseline, at 1440×1024: **419 words** average on a decide screen (max 499), **12 panels**
(max 16), **8–11 distinct type sizes** per screen and 12 across the game, **4 weights**, up
to **12 fill colours**, fill-coverage index **0.84**. Targets set at ≤220 words, 4–6
top-level regions, 4–5 type sizes, 3 weights, ≤5 fills, ≥35% air, ≥55% of words inside the
decision object, 5 reading stations.

Two findings changed the direction of the fix. **The option count is not the problem** —
Scheibehenne's meta-analysis puts the pooled choice-overload effect at ~0 and Chernev's
moderators (time pressure, hard-to-compare options, preference uncertainty, no commitment)
are all absent here, so 3–5 side-by-side options are defensible and cutting them would
breach G1 and G4 for nothing. And **not one of nine comparable games shows a full briefing
alongside its options**: Reigns, CK3, Frostpunk, Slay the Spire and the rest all occlude,
pause or collapse the world at the moment of choice. Fitting the briefing and the decision
on one screen simultaneously is the structural cause, and E7a is what made it look solved.

Where the research gives no number — words per screen, panels per view, type-size count —
the document says so and labels the target a defensible default derived from reading rate
(238 wpm, Brysbaert 2019) and chunk limits (≈4, Cowan 2001) rather than a finding.
**Cost:** nothing yet; it is a standard, not a change. Every band is reversible by editing
one table, but the numbers should not move to accommodate a screen that fails them.

## D-032 · The lesson screen is deleted; the colleague says it instead
Two independent critics landed on the same thing. Sixteen full screens carrying a moral
in 26px bold under the caption **"Next time."** — no speaker, no artefact, no interaction,
nothing to disagree with. `ENGAGEMENT-MODEL.md` had specified that this screen become "a
claim the player commits, then has confirmed"; instead the `"The point"` eyebrow was
removed and the screen it captioned was kept. That beat was where the feeling of being
lectured at actually lived.

The `lesson` phase is gone. `principle` and `because` now appear on the consequence
screen under the portrait of the colleague who briefed you, in quotation marks, as their
read on what just happened. Same words; the difference is that a named person with a job
and a stake is saying them about a specific event.

This collapsed three separate findings at once. With no lesson screen there is no "Next
time." box re-issuing the question the rail asked before the decision, and no third and
fourth delivery of the same sixteen sentences in the debrief — so **"What this run
taught"** was deleted from the ending too, where it had listed every principle a fourth
time under the most schoolroom heading in the build.
**Cost:** one phase, the `watchFor` field's prominence, and a rewrite of the harness.

## D-031 · The prediction gate asks which dimension moves LEAST
It used to ask which one this would *hurt*. That question has no answer on the **27 of 85**
outcomes where nothing goes backwards — including the best branch of nine missions — so on
most of the game's good beats the player's committed claim was silently discarded and
replaced with "Nothing went backwards. That is rarer than it should be." A compliment,
in place of the one mechanic the research calls the highest-leverage change available.

"Which moves least" is always answerable, so the gate now pays off on every beat.

## D-030 · Advice has to be a stake, not an answer
Attributing the steer to a named colleague fixed the label and not the semantics. On
mission 1 Priya appeared three times on one screen: quoted in the left rail, *"Priya is
asking"* with three open questions in the right rail, and *"Priya:"* in the action bar
answering them. She asked "Is the biggest number the best opportunity?" and then told the
player "there is no perfect client — weigh what they need against what you can
demonstrate." One character interrogating and then patronising the player in the same
breath is worse than an unattributed Tip, not better.

Every `tip` is now a **stake**: a partial, arguable view from someone with skin in the
game. *"I put Meridian forward last year and it never closed. I would still take it."*
*"I have walked away from one deal in nine years. I think about it more than the ones I
signed."* None of them resolves the rail's questions.

Also: `advisorLine` lets a colleague say something specific to the mission at hand. Aisha
was repeating one sentence about the proposal across four consecutive screens, including
the one where the sponsor resigns and the proposal is not in question. Frozen is not the
same as consistent.

## D-029 · The debrief ring shows balance, not a grade
The mockups put a letter grade in a circular progress ring, and the PRD does the same
("Round Grade B+"). `docs/ENGAGEMENT-MODEL.md` rejects an end-of-run grade outright — it
invites the player to optimise the grader instead of reading the world.

We kept the geometry and dropped the letter: three concentric arcs, one per dimension,
with the run's score in the middle. It says more than a grade would, because you can see
at a glance *which one took the strain* rather than being handed a verdict on yourself.

## D-028 · Chapter 0 is its own node kind, not a mission
The starting advantage has nothing to resolve and nothing to teach yet, so routing it
through `commit` would have produced an empty consequence beat and a meaningless lesson.
It is a `setup` node with its own phase and a `chooseSetup` action.

Each advantage grants a flag that real conditions later read — a Connector starts with
`credibility`, so they walk into the competitor mission already able to hold their nerve;
a Builder starts with `has:data`, which is what makes an outcome-based deal honest in
`m6b`. The choice therefore keeps mattering rather than being flavour.
**Cost:** the sweep has to branch on it, and `playScript` needed an advantage parameter.
It also sits outside the chapter stepper, so `validate.ts` exempts it from the chapter
check. PRD p. 55: "starting with a beginning state is much stronger than starting with a
tutorial."

## D-027 · A truncated sweep now throws instead of continuing
Adding six missions pushed the exhaustive sweep past its frontier ceiling at mission 10 of
16. It carried on regardless and reported four perfectly reachable outcomes as dead
content — a false alarm that cost real time to diagnose.

Two changes. The dedup key now uses only flags that some condition READS, and only those
read by the current mission **or a later one**: `knows:real_pain` matters up to the
solution missions and is inert afterwards, so carrying it past that point splits states
that can no longer behave differently. Both exclusions are exact, and together they took
the peak frontier from 60,000-capped to a true 19,836 — the sweep also got 10× faster.

And the cap now **throws**. A sweep that has been cut short makes every "is this
reachable?" answer unsound, so silence is the one thing it must not do. If it fires, the
fix is to narrow the key further, not to raise the ceiling.
**Also:** the frontier is grouped by node each round, because a branch can now divert the
whole game and states can sit at different nodes simultaneously. The old loop sampled one
state and assumed the whole level was at the same node.

## D-026 · Option cards are laid out on a CSS subgrid
Columns alone did not deliver the cross-comparison that F2 exists for. A two-line title in
one card pushed its checklist 36px below its neighbours', so the eye could not read across
a row — the critic measured checklist row 1 starting at y≈557/557/573/**593** on mission 8.

Each card is now `grid-row: span 6; grid-template-rows: subgrid` against a parent
declaring `repeat(6, auto)`: media, title, blurb, checklist, cost, button. Every card's
checklist and button now sit on a shared baseline whatever the text length.
**Cost:** the card is locked to six rows, so adding a section means touching `CARD_ROWS`
and every card kind. Worth it — this is the mechanism the whole layout is for.

## D-025 · Advice is attributed, but it keeps the mockups' slot
The mockups carry an unattributed "Tip" in the action bar on every decision screen. The
research says that furniture is the condescension, and removing it left the action bar 90%
empty — a case of fixing the tone by breaking the layout.

Resolution: keep the mockups' treatment exactly — portrait, label, two lines, bottom-left
of the action bar — and make the label **a person's name**. "Tip: there is no single right
answer" becomes *Riya: "No single right answer. Weigh the value against what you would risk."*
Same words, same slot, and the interface no longer speaks in its own voice.
Also: "Your objective" became **"The brief"**, and the discovered-evidence accordion moved
out of the centre column into the rail as **"Your file"** — reference material on the desk,
present and never tested.

## D-024 · The fits-one-screen rule is enforced at 1440×1024, not 900
The mockups are drawn for a 1536×1024 window and their densest briefing needs ~835px of
working area. At 1440×900 the console leaves ~745px. Matching their type and image scale
and fitting a 900px window are mutually exclusive — the first attempt fitted 900 by
rendering everything 15–35% smaller than the reference, which the critic correctly called
"a miniature of the mockup with the furniture removed".

We chose the reference scale. `verify.mjs` enforces the fit rule at heights ≥1000px, and
below that the working area may scroll **inside** the console — the chrome never moves, so
the console still reads as an instrument rather than a page.
**Cost:** a 900px-tall laptop scrolls on the three densest missions.
**Reversible:** yes, by shrinking the scale again, at the price of the miniature problem.

## D-023 · The mockup photography is reused, extracted by a committed script
`tools/extract-art.py` crops 22 images out of the mockup PNGs into `public/art/` — hero
shots, client premises, option-card scenes, advisor portraits. 139 kB total as WebP.
Confirmed licensed and appropriate for the product (STRATEGY-MOCKUP-ERA.md D4). This closes
`UI-AUDIT.md` finding F3: a quarter of the pixels above the fold in every mockup are
photographic and we had none.

The first version detected photographs automatically — the UI is flat, photographs are
colourful. It failed: these renders are heavily desaturated (mean saturation 0.05–0.10,
barely above the flat purple chrome), so the mask came out sparse and morphological
closing merged three separate option-card photos together with the panel between them.
Replaced with a hand-written manifest of crop boxes plus a **contact sheet** that gets
looked at. Two passes were needed — the first left stray UI in nine crops (headline
fragments, the purple quote rule, a "Recommended" ribbon).
**Cost:** boxes are hand-maintained and tied to the mockups' 1536×1024 coordinates.
**Constraint:** images are separate lazily-loaded assets and must never block first paint.

## D-022 · Six project-local agents, because plugin installs are blocked
`claude plugin install` refuses every plugin in `claude-plugins-official` — blocked by
organisation policy. So the review system is built in-repo as `.claude/agents/`:
`gpl-design`, `gpl-content`, `gpl-engine`, `gpl-verify`, and two **read-only** critics,
`gpl-visual-critic` and `gpl-pedagogy`.

The read-only critics are the point. Every genuine failure on this project was caught by
looking at a rendered screen — never by a test — and the author of a change is unreliable
at judging it against a reference. The critics cannot edit, so they cannot rationalise.
Anthropic's own `frontend-design` skill was read from a local clone as a reference; it
names five traits that mark a design as AI-generated and we exhibited all five.

## D-021 · The player is a first-time pursuit lead
The source PRD is team-based end to end and **never defines a single-player role**; when
MPL became GPL nobody decided who the player is, and the build inherited no answer.
This was the root of "it doesn't feel cohesive".

Naming the role as *newly handed your first client to win* resolves the condescension
problem structurally rather than cosmetically: a colleague briefing a new lead is
onboarding, not patronising. So the advisory furniture gets **attributed** rather than
deleted — every piece of advice comes from a named person with a stake, and **the
interface never speaks**. "Tip:" becomes Priya saying something.

## D-020 · Scope goes back up to ~15 decisions plus the frame
D-006 cut 21 missions to 10. A page-cited reading of the PRD shows **what was cut was
mostly frame, not repetition** — Chapter 0's starting advantage, the journey map,
milestones and unlocks, the deal decision (*"Walking away must sometimes be a good
decision. Otherwise the game teaches: Always accept the contract"*, p. 132), and the
recovery beat. Those beats are short; cutting them removed the game's spine while leaving
ten interchangeable question screens.

Restoring them plus five named decision missions (prioritisation, innovation, solution
review, capacity, unexpected situation) lands at ~15 decisions / ~70 min.
**Supersedes D-006.**

## D-019 · Pre-decision copy is on a word budget, enforced by the build
Colour alone did not fix "too much text", because the problem was the text. Counting the
mockups: an option card there is an icon, a three-word title and **one short sentence**.
Ours were a two-line description, four bulleted clauses, a commitment sentence and a cost
row — roughly 60 words each, ~240 on a four-option screen.

`BUDGET` in `validate.ts` now caps every string the player reads *before* deciding:
situation 55 words total, description 18, pros/cons 6 each and at most two of each,
consider 13, tip 20, assessment note 11, concern 11, client blurb 20, commits 14.
Over budget is a build error naming the field and the count, which turned the content
rewrite into a worklist rather than a judgement call.

Two matching UI changes: **pros and cons render as tinted chips**, not bulleted sentences —
at six words they are tags, and a row of green-then-red chips is read in one pass. And
`commits` now appears **only on the selected card**, which is a two-step commit and keeps
three unread commitment lines off the screen.

**Outcome prose is deliberately not budgeted.** The consequence screen has nothing else on
it, and that text is the teaching.
**Cost:** writing is harder, and some nuance went. That is the trade — the nuance was not
being read.

## D-018 · Colour carries hierarchy, so the page can be scanned instead of read
"It feels like I have to read everything" was the symptom. The cause was that every
label on the page was the same faint grey uppercase `.eyebrow`, every card was white on
near-white, and every icon was grey — so nothing had more weight than anything else and
the only way to find information was to read all of it.

Four changes, taken from the mockups:

1. **`.eyebrow` is now reserved for the kicker above a headline.** Section headings are
   `.section-title` — dark, bold, with a coloured icon beside them. This is most of the win.
2. **`.chip` — a filled status pill.** Assessment levels, client tags, badges and the
   selection counter are now tinted chips. A chip is read in peripheral vision; coloured
   body text still has to be read word by word.
3. **`--color-panel` for regions.** Both rails and the client fact strip sit on it, so
   "supporting information" is distinguishable from "the thing I am deciding" without
   reading either.
4. **Icons are purple by default**, semantic where it means something (green good, amber
   warn, red bad). Every semantic colour gained a `-tint` so it can fill a chip.

Also: the brief became **one card with divided bands** instead of six floating cards, and
option cards put pros beside cons rather than stacked — stacked, a four-item list made
every card 60px taller than its content needed.

**Cost:** more colour to keep disciplined. The guard is that every tint is a token, and
`Pill`/`SectionTitle` are the only ways to apply them.
**Not adopted from the mockups:** photographs, tab strips, and per-option impact previews.
The last of those would breach G3.

## D-017 · A sticky action bar cannot be a grid item
The confirm bar is `position: sticky; bottom: 0`. Placed inside the layout grid it never
pinned, because a sticky grid item is constrained to its own grid area and that area is
exactly the item's height — no room to move. It now sits outside the grid, as a sibling,
where its containing block is the page.
**Related:** on a phone the rails stack *after* the mission (`order-2`/`order-3`), because
rails-first pushed the headline half a screen down.

## D-016 · Screenshots un-stick sticky elements before capture
A full-page Playwright capture resolves `position: sticky` against the viewport, so the top
bar and the confirm bar landed in the middle of the image, on top of real content. That is
indistinguishable from a layout bug and cost real time. `shot()` now walks the DOM, drops
anything computing to `sticky` into `position: relative`, captures, and restores.
**Cost:** the screenshots no longer show what the bars look like while pinned. Worth it —
the alternative was a false positive on every single frame.

## D-015 · Pros/cons must come in pairs, and everything pre-decision is leak-checked
Option cards now carry `pros`, `cons` and a `cost` of time/investment. That is a lot of new
surface on which to accidentally tell the player the answer, so the validator was widened:
`description`, `pros`, `cons`, `tip`, `objective` and every `consider` line are scanned for
outcome-leak terms, and an option listing pros without cons (or the reverse) is an error —
a one-sided card presents itself as the right answer.
**Cost:** writing options is slower. That is the point.

## D-014 · The game frame is the product, not the page
"This feels like a form, not a game" was correct. A centred column of text with radio
buttons is a questionnaire no matter how good the writing is. The shell now carries a
chapter stepper, a live score, a left rail (chapter, mission checklist with ticks,
objective, estimated time, a named advisor with a line of dialogue) and a right rail
(the three factors, open questions, recognitions earned). The centre column is the only
thing that changes between beats.
**Deliberately not copied from the mockups:** their density. No photographs, no per-option
impact previews (those would leak the outcome), no team panel — this is single-player.

## D-013 · Missions carry a briefing, and the validator requires one
`eyebrow`, `minutes`, `tip`, `advisor` and at least two `consider` lines are now *required*
on every mission, plus optional `client`, `assessment`, `saidQuote` and `concerns`. The shell
renders each of these unconditionally, so a missing one is a visible hole rather than a
graceful degradation — better to fail the build.
**Why two consider lines minimum:** one reads as an instruction. Two read as a genuine
tension the player has to resolve.

## D-012 · Causal threads are derived, never authored per-run
The closing debrief shows the specific chains the player created ("you met them on price →
you could not fund the mitigation → month five went underwater"). Each thread declares the
outcomes that must *both* have fired before it can appear, so a thread can never claim a
causal link the player did not actually cause. No generated prose, no approximation.
**Cost:** threads must be hand-written per pairing. Nine exist; more can be added cheaply.

## D-011 · No `motion` / animation library
Considered `motion` (the framer-motion successor, React 19 compatible). Skipped. Every beat
this game needs — meter fill, staggered reveal, card lift, the resolving shimmer — is a CSS
transition or keyframe. Adding a 30 kB animation runtime to avoid writing twelve lines of CSS
is a bad trade in a game whose entire bundle is 94 kB gzipped.
**Reversible:** yes, trivially, if card-stack gestures are ever added.

## D-010 · Stylesheet must use explicit cascade layers
Found via screenshot, not via types: the "Begin" button rendered with dark text on purple.
Cause — a bare `button { color: inherit }` in base CSS is *unlayered*, and unlayered CSS
outranks every layered Tailwind utility, so it silently beat `text-white`. All base styles
now live in `@layer base`, components in `@layer components`, animation helpers in
`@layer utilities`.
**Lesson worth keeping:** typecheck and tests were both green while this was broken. Only
looking at the rendered page caught it.

## D-009 · Exhaustive state sweep, deduplicated on flags only
The naive sweep enumerated ~4.1 million playthroughs and exhausted the Node heap. Keying the
dedup on flags alone (ignoring dimension values) collapses it to a few thousand states, and is
**exact** here because no branch gates on a numeric value — only on flags.
`validateContent()` emits a warning if a dimension gate is ever introduced, because the sweep
would silently stop being exhaustive at that point.
**Cost:** a future dimension-gated branch requires widening the dedup key.

## D-008 · Dominance detection as the mechanical test for "no right answer"
An option whose *worst* outcome beats another option's *best* outcome on all three dimensions
is a fake choice. The test caught three real ones on first run: at mission 1, Northwind
strictly dominated both alternatives; at mission 3, the point-of-view play strictly dominated
the campaign. Fixed by giving the alternatives genuine compensating upside rather than by
weakening the strong option — chasing a stretch client really does teach the team something,
and a broad campaign really is the option that does not burn senior people.
**This is the single most valuable check in the suite.** Without it, "no right answers" is an
aspiration rather than a property.

## D-007 · Situation text varies by state
The mission 9 risk review names *the risk the player's own proposal created*, and the mission
10 crisis names *the promise they actually made*. Implemented as `variants` on a mission —
first matching condition wins, static `situation` is the fallback.
**Why:** without this, the payoff mission reads as a generic event rather than as a
consequence, and the whole compounding design is invisible at exactly the moment it matters.

## D-006 · Ten missions, not twenty-one
The earlier direction specified 21 missions across 5–6 chapters in a two-hour session. At a
realistic 5–6 minutes per mission that is nearly three hours, and much of it was repetition —
several missions taught the same thing at different points in the value chain. GPL covers each
of the six stages exactly once, plus the four pivotal moments (qualification, competitor
event, pricing pressure, risk review). Ten missions, ~25 minutes, no redundancy.
**Cost:** less total content. **Benefit:** it gets finished.

## D-005 · No randomness anywhere
Uncertainty comes entirely from information the player does not have. No dice, no probability
rolls, no hidden variance.
**Why:** a player who can attribute a bad outcome to luck learns nothing from it, and a game
built to teach through consequence cannot afford dismissible results. It also makes the whole
run reproducible and the test suite exact.
**Cost:** replay variety must come from branching and from what the player chooses to
investigate, rather than from variance. That is a better source anyway.

## D-004 · Pure client-side: Vite + React + TypeScript + Tailwind
No backend, no database, no auth, no accounts. Progress in `localStorage`. Ships as static
files.
**Why:** single-player with no persistence requirement has no honest need for a server, and
every piece of infrastructure added here would be infrastructure to maintain, secure and host.
Rejected: Next.js (server features unused), the existing `C:\mpl` stack (its Prisma/Postgres/
auth layer exists to serve a multiplayer league that no longer exists).

## D-003 · Greenfield, with principles salvaged from `C:\mpl` rather than code
The predecessor is a mature Next.js/Prisma B2B marketing *simulation*. Almost none of its game
is in scope now. What was taken:
- **Determinism as a discipline**, and specifically its hard-won rule that *randomness must
  not be the only source of uncertainty, because pure noise destroys attribution* — which is
  what led to D-005 removing randomness entirely.
- **"Advisory, never blocking"** — a simulation that prevents a bad decision cannot teach that
  it was bad.
- **The variance-bridge shape** — *what you chose → what happened → why → what changed* — now
  the fixed structure of every consequence screen.
- **"Never invent a number"** and **one model, one answer**.
- The design tokens (`#6D35E8`, Inter, the 8px scale).

What was left behind: attraction/power-share maths, segments, capabilities, levers, Enterprise
Value, Rule of 40, bots, the league, and the entire executive-simulator framing.

## D-002 · Single-player
No teams, no facilitator, no cohort, no multiplayer sync.
**Why:** the loop has to be proven engaging for one person before any of that is worth
building, and team play was adding real-time synchronisation complexity to a product whose
core mechanic had never been played by anyone.
**Not closed:** team play remains a reasonable v2. The engine is pure and serialisable, so
the state is already in a shape that could be shared.

## D-001 · Reigns, not Markstrat
The north star is a tiny decision surface, a few meters in visible tension, immediate
consequence, and a run that finishes in one sitting — not an executive dashboard.
The supplied mockups were treated as reference, not as specification, on instruction.

---

## Superseded

**The team-based two-hour simulation.** An earlier pass in this session produced a PRD for a
16-mission, cohort-play, facilitator-led product with a behavioural analytics layer. That
direction was corrected by the product owner before any of it was built: GPL is single-player,
shorter, and simpler. Those documents were removed rather than archived, because a plausible
but wrong spec sitting next to a correct one is a trap for the next reader.

Two findings from that pass survive and are recorded here because they will recur:
1. **Content is the critical path, not code.** Ten missions with branching consequences is
   roughly 120 authored pieces of business prose. The engine took hours; the writing is the
   expensive part and always will be.
2. **Team play and individual behavioural assessment undermine each other.** If people suspect
   they are being individually profiled, candour drops and the bonding objective dies. If team
   play is ever added, keep analytics at team level.
