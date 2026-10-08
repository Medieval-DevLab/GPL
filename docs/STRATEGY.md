# GPL from first principles

8 October 2026. This document sets out what GPL should be if it were designed today from
nothing, using what learning science and the best games know. It records the research, the
principles, the design and the build plan. Decisions that follow from it are logged in
`DECISIONS.md` (D-084 onwards). It replaces the mockup-era strategy, which is kept
unchanged in `STRATEGY-MOCKUP-ERA.md`.

**The brief.** The owner, a marketing professional, could not follow the game. The learning
must become *simpler* to synthesise, learn and engage with, never more complex. The audience
knows nothing about sales, marketing or consulting. The decisions must be small cause-and-effect
choices a player can reason about. The game must show how everything works *as a system*, with
different kinds of maps, and it must not look the same throughout.

---

## 1. What the research says

There were two research passes: one on learning science, one tearing down well-known games.
The full reports and sources are in the session record. The findings that decide the design:

| Finding | Evidence | What it means for GPL |
|---|---|---|
| People keep one core idea plus a few sub-ideas | Heath & Heath 2007; Wiggins & McTighe 2005 | One spine sentence, four ideas, the same words every time |
| Working memory holds about four new things | Cowan 2001; Sweller 1988 | Three meters plus one new idea at a time; at most one new term per decision |
| Learn the parts before the interactions | Pollock, Chandler & Sweller 2002; Mayer 2021 | Meters arrive one at a time; trade-offs come later |
| Extra story and decoration reduce learning | Clark et al. 2016; Adams et al. 2012; Sundararajan & Adesope 2020 | Every line is situation, choice or consequence; no texture text |
| Novices need a worked example, then fading | Kirschner, Sweller & Clark 2006; Renkl & Atkinson 2003 | For each idea: modelled first, prompted second, unaided third |
| Learning should *be* the mechanic | Habgood & Ainsworth 2011 (7× voluntary play) | The meters moving for a stated reason is the curriculum |
| Feedback should be immediate, explanatory and about the task | Van der Kleij et al. 2015 (0.49 vs 0.05); Kluger & DeNisi 1996 | The first words of every consequence name its cause |
| Stories help when they are chains of causes | Willingham 2004; Trabasso & van den Broek 1985 | Every beat links to an earlier one, or it is cut |
| Debriefing is where play becomes knowledge | Tannenbaum & Cerasoli 2013 (d = 0.67); Kolb 1984 | A short structured debrief after every act |
| Retrieval and generation beat re-reading | Roediger & Karpicke 2006; Slamecka & Graf 1978 | The player guesses the cause before it is revealed |
| Transfer comes from comparing two different cases | Gentner, Loewenstein & Thompson 2003 | Each idea appears in two situations that look different, then they are compared |
| Difficulty belongs in the decision, not in the reading | Bjork 1994; Chen et al. 2018; Hamari et al. 2016 | Reading effortless; the trade-off is the only hard part |

From the games:

| Game | The mechanic that does the work | GPL use |
|---|---|---|
| *Reigns* | Dots show which meters a choice will touch, never by how much | Telegraph every lever |
| *Into the Breach* | Every enemy intent shown before you act | Show what Orion will do next; choices become trade-offs, not guesses |
| *Frostpunk* | A law shows its effect, is permanent, and returns as an event | Promises are signed clauses that come back with a due date |
| *Game Dev Tycoon* | Sliders, then reviews that give reasons | Decisions as levers, scored by Orion's people in their own words |
| *Papers, Please* / *Mini Metro* | One new rule at a time, the old ones stay in force | One idea per act; meters introduced one by one |
| *80 Days* / *Slay the Spire* | The whole route visible, each fork with its price | The trail (built in D-083) |
| *Plague Inc.* | Faces and a world that change colour as you act | Orion's people as a map that turns green or red |
| *Disco Elysium* | Checks show their requirements before you try | A locked option names the card it needs (built in D-083) |
| *Hades* / Telltale | Characters notice your history | Callbacks name the earlier choice |
| The Beer Game | The debrief shows the system caused the swings | The cause-and-effect map at every act break |

**The diagnosis in one line.** GPL does not lack content; it lacks *telegraphing*. Players
cannot see what a choice will touch, cannot see a promise travel forward to the day it falls
due, and read before they act.

**What a cold audit of the current build measured.** A third agent played the game as a newcomer
and counted:

| Measure | Now | Target |
|---|---:|---:|
| Concepts a newcomer must hold | ≈ 90 (54 business terms, 36 mechanics) | ≤ 15 |
| Words per decision | 272 average, 359 maximum | ≤ 150 |
| Presses per decision | 9.2 | ≤ 5 |
| Distinct takeaway sentences | 53 | 4 |
| Outcomes whose "why" is a generic line, not the real cause | 68% | 0% |
| Names for one act | 3 | 1 |

It also found the story contradicting itself:
- the proposal is "written" five times;
- price is negotiated before Orion has chosen anyone;
- two back-to-back "two people gone" crises;
- a promise the player never made is asserted as history.

Its verdict matches the research: far fewer decisions on one causal chain, each consuming
something an earlier one produced, *and saying so by name at the moment it pays off*.

---

## 2. The principles we will hold the game to

1. **One spine.** *Every promise that helps you win the work is a cost someone pays later — so
   choose your promises on purpose.* It appears on the title, at every act break and at the
   end, word for word.
2. **Four ideas, one per act, always in the same words.**
   1. **Understand before you offer.** Clients choose the team that understood their problem.
      *(Win)*
   2. **Not every deal is worth winning.** If it will not pay or cannot be delivered, walking
      away is a good decision. *(Worth)*
   3. **Trade, don't give.** A lower price, extra work or a faster date is a cost; get
      something back or price it in. *(Worth against Win)*
   4. **Promise only what your team can deliver.** Promises come due. *(Deliver)*
   
   Every lesson in the game is filed under one of these four. A lesson that fits none is cut.
3. **Small levers, visible effects.** A decision is two or three small choices ("levers"), each
   with one cause and one effect. Before you commit, each lever shows which meters it will
   touch (direction, not amount) and which cards it adds or needs.
4. **Cause first.** The first sentence of every consequence names its cause: "Because you
   promised June…".
5. **Show, then tell.** Every act has its own way of picturing the system (section 4), so the
   screen changes because the idea changed.
6. **Reading is effortless.** At most 40 words before the first thing you do in a scene, and
   120 before any choice. One new term per decision, explained in 12 words or fewer.
7. **Model, prompt, let go.** For each idea, the first decision has the colleague think aloud,
   the second gives one hint, and the third is yours alone.
8. **Guess, then see.** Before each act's debrief reveals the cause, the player taps their
   guess. It is unscored and is never a grade.
9. **Failure branches, it does not end.** Losing the award is a chapter, not a game over, and
   the debrief shows what would have changed it.
10. **Characters notice.** Sarah, Marcus and Aisha refer back to what you did.

---

## 3. The game, redesigned

**Length and shape.** About 35 minutes, in four acts after the onboarding (built in D-083).
Each act teaches one idea through **two decisions**: the first modelled (the colleague thinks
aloud), the second yours alone. That is **8 decisions instead of 18**. Each decision is a
panel of two or three small levers, so the player still makes about 20 choices, but every
one has a single cause and a single visible effect.

**The causal spine.** Every decision uses something an earlier one produced, and names it:

| Act and idea | Decision | Its levers | It consumes | It produces |
|---|---|---|---|---|
| 1 · Understand before you offer | **Find what is really wrong** | who you talk to · what data you pull | – | clues: the complaints, who decides |
| | **The first meeting** | what you lead with · who you bring | the clues | Sarah's trust, or her doubt |
| 2 · Not every deal is worth winning | **How much do we bet?** | people · weeks · paid study or not | Sarah's trust | your team's time left |
| | **The rival's demo** | answer it · ignore it · change the question | the clues, time left | the problem the bid is about |
| 3 · Trade, don't give | **Build the offer** | what's in · how fast · how we're paid | the problem, time left | promises, with due dates |
| | **The price push** | price · what's dropped · what we ask back | the promises | the fee, and what we keep |
| 4 · Promise only what you can deliver | **Sign or walk** | which clauses we fix · sign or not | promises, fee | the contract |
| | **Month five** | tell them · staff it · protect what we promised | every promise, team weeks | the ending |

The four ideas are the only takeaways, in the same words every time. The ending shows the
whole chain on one chart.

**The decision unit: levers.** Each decision is a small control panel of two or three levers.
Each lever is one cause:

> *How do we answer on price?*
> - **Price:** hold · meet them halfway · match the cheaper bid *(touches Win ▲ Worth ▼)*
> - **What's included:** everything · drop the training · drop the pilot *(touches Worth ▲ Deliver ▼, and adds a promise card)*
> - **In return we ask for:** nothing · a longer contract · a named Operations lead *(touches Worth ▲ Win ▼, and needs a card)*

The player sets the levers, sees the dots, and commits. Orion's people then answer in their
own words, each naming the lever that moved them, and the meters move with a one-line reason
per lever.

**The resources you can feel.**
- **Three meters.** Win, Worth and Deliver, introduced one per act in the HUD.
- **Your hand.** Strengths and promises as cards (built in D-083).
- **Team weeks.** In the delivery act, Deliver becomes a row of team-week tokens. Every promise
  card comes due as a cost in tokens; when the tokens run out, the next promise breaks in
  front of the client.

---

## 4. Many maps, one system

The owner asked for different kinds of maps and effects that show how everything works as a
system. Each act gets its own signature view, chosen because it pictures that act's idea:

| Where | The view | What it shows |
|---|---|---|
| Between decisions | **The trail** (built) | Where you are in the deal and what is next |
| Act 1 · Understand | **The people map** | Orion's people (who pays, who decides, who has to live with it), turning green or red as your choices land. The unknown person (Marcus) is greyed until you find him |
| Act 2 · Worth it? | **The fee waterfall** | How the fee splits into our people's time and what we keep. Each lever pours into or out of the margin |
| Act 3 · Trade | **The scales** | What we give against what we get back, tipping as levers move |
| Act 4 · Promise | **The promise calendar** | Each promise pinned to the week it falls due; team-week tokens below; the calendar plays out in delivery |
| Every act break | **The cause-and-effect map** | Your actual chain, drawn as a flow: choice → card → what it changed later. This is the system made visible, as in the Beer Game debrief |
| The end | **The deal on one chart** | Win, Worth and Deliver across the whole deal, with your promises marked where they were made and where they came due |

---

## 5. Build plan

**Variety is part of the design, not decoration.** No two acts look alike:
- each has its own signature system view (section 4);
- each lever panel takes the form of its act: a research board in act 1, a staffing board in
  act 2, a contract with clauses in act 3, a delivery calendar in act 4;
- the trail between decisions changes as the deal does, from an open road to a calendar of
  due dates.

The work is staged so that every stage ships, playable and verified:

1. **The system views on the existing decisions** (first):
   - the cause-and-effect map at act breaks, from the engine's existing causal threads and
     the hand;
   - lever-style telegraphing on current options (dots for the meters a choice touches,
     cards added or needed);
   - the cause-first line;
   - the guess-then-see tap at act breaks.
2. **The four views with their own look.** The people map in act 1, the fee waterfall and the
   scales in the deal acts, and the promise calendar with team-week tokens in delivery.
3. **The lever decisions.** A new engine kind (one choice per lever, outcomes over the
   combination), then the content rebuilt to the 8 decisions of the causal spine under the
   four ideas. The exhaustive sweep is extended to lever combinations. The current 18
   decisions stay playable until the new set passes every gate, then are retired.
4. **Spine and debriefs.** The four ideas, word for word, on every lesson; a three-question
   retrieval opener for a second sitting.

Each stage is checked against the principles above:
- the word budgets;
- one new term per decision;
- every consequence opens with its cause;
- a screenshot of every beat at three sizes.
