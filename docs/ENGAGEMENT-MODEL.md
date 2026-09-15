# Engagement without condescension

Research findings on how learning games hold attention while teaching, and why
educational software feels patronising. Sources at the end.

This document exists because of a specific complaint: the game teaches correctly but
lectures. That is a craft problem with known solutions.

---

## The central tension in this project

**The mockups are schoolroom-framed. That framing is the condescension.**

The mockup left rail reads, literally: *Your objective · Estimated time · Team discussion
— Recommended · Learning in progress · Tip · Things to consider · Think about…*

That is a worksheet. And the research is unambiguous that this furniture — not the
content — is what makes training software feel patronising to a competent adult. Knowles'
andragogy: adult learners move from dependency to self-direction, from subject-centred to
problem-centred. Words like *objective*, *tip* and *advisor* place the player as a student.

So the resolution is not "follow the mockups" or "ignore the mockups". It is:

> **Adopt the mockups' visual system wholesale. Reject their vocabulary and semantics.**

Take the console frame, the option columns, the icon medallions, the polychrome icons, the
imagery, the pip meters, the full-width card buttons, the sentiment-tinted panels. Then
re-skin every label as a **work artefact** rather than a lesson artefact:

| Mockup / ours now | Becomes |
|---|---|
| "Your objective" | the engagement brief, or nothing — the H1 already says it |
| "Estimated time: 5 minutes" | cut, or a diegetic clock ("board meeting in 3 weeks") |
| "Tip: there is no single right answer" | cut. It is the narrator telling you how to feel. |
| "Things to consider" | a colleague's open questions, attributed to a person |
| "Learning in progress" | what you know — a file of facts you paid for |
| "Advisor" | a partner with her own agenda, who can be wrong |
| The lesson screen | a claim the player commits, then has confirmed |

## How the best ones do it

**Papers, Please.** The rulebook is a document on your desk, never quizzed. New rules
arrive by bulletin and you learn the edge cases by being fined. Lucas Pope: *"I made a
concerted effort to keep things vague and non-judgemental throughout."* Consequence
arrives as an end-of-day **bill** — rent, heat, medicine — never as a grade. This is the
closest single model for GPL.

**Return of the Obra Dinn.** Fates validate only in **sets of three**. This solves the
hardest problem in deduction design: confirming a correct inference without the
confirmation leaking the answer. You learn that *some* three were right, not which.

**Orwell.** You file evidence; conflicting items are never marked true or false. The
designers: *"imposing a defined sense of 'right' or 'wrong' on available datachunks would
have removed any moral ambiguity from choices."* Feedback is a superior who **reacts**,
with several scripted variants depending on the whole file. Reaction-as-feedback is far
cheaper than branching and reads as consequence rather than marking.

**Reigns.** Four meters, and you die at **empty or full**. Cards are filtered by state.
The economic insight: when only a minority of cards acknowledge prior choices, players
perceive *the entire game* as authored. We need far fewer callbacks than we think.

**Brilliant.org** (not Duolingo). You manipulate the diagram and commit an answer
**before** any explanation appears, because passive explanation produces false confidence.
Duolingo's streaks and "Great job!" are loss-aversion machinery and are exactly where it
turns patronising — and a 35-minute game has no retention problem to solve with streaks.

**KSP / Factorio / Universal Paperclips.** Teach by never explaining. KSP's feedback is
honest physics, often four hours after the mistake — which itself teaches that errors
caught early are cheaper. Paperclips reveals systems by **plateauing**: growth stalls and
you must invent the next mechanism. Late missions should get harder by *removing options*,
not adding metrics.

**Clinical simulation debriefing** — the most transferable body of craft here, and it is
not a game. Rudolph et al., *Debriefing with Good Judgment*, pairs **advocacy** (state
the observation and your judgement plainly) with **inquiry** (ask genuinely what the
person was thinking), taking a *"stance of curiosity in which trainees' mistakes are
puzzles to be solved"*, and warns instructors to resist *"the urge to fix the learner"*.
Their companion paper is titled **"There's no such thing as nonjudgmental debriefing"** —
hiding your judgement reads as condescension too. The fix is not to soften the lesson. It
is to state it plainly *and* ask what the player was thinking.

## Why it feels condescending — mechanism by mechanism

1. **The labelled lesson.** A screen captioned "The point:" tells the player what they
   just felt. → Delete the label. Deliver it as the world's reaction; let the player name
   it.
2. **Praise inflation.** Deci, Koestner & Ryan's meta-analysis of 128 studies: expected
   extrinsic rewards reliably *reduce* intrinsic motivation; informational feedback does
   not. → Report state, never approval. "The client cut the scope", not "Well done".
3. **Explaining what the player already worked out.** → All help on demand, nothing
   volunteered twice.
4. **Student framing.** → Rename the furniture as work artefacts (table above).
5. **Scored feedback that moralises.** Any end-of-run rank invites optimising the grader
   instead of the world. → An itemised account: what you spent, what you own, what you owe.
6. **Chocolate-covered broccoli** (Bruckman, 1999) — fun bolted onto content. → The
   decision must be interesting *as a decision* before any teaching intent.
7. **The assigned debrief.** → Make the player commit a diagnosis, then confirm it.

## Mechanics worth stealing, ranked

1. **Predict-before-reveal.** One tap before the consequence: which dimension will this
   hurt? Converts a lecture into a test the player set themselves. *Low cost — one field
   per option and one extra beat.* **This is the highest-leverage change available.**
2. **Commit-a-causal-claim debrief, confirmed in batches.** "Which earlier decision caused
   this?" — confirm N at a time, never per item. Obra Dinn's mechanic doing Rudolph's job.
   *Medium — needs a cause-link field on outcomes.*
3. **Diegetic ledger instead of a score.** Hours owed, margin spent, people committed.
   *Low — a re-render of state we already hold.*
4. **Tension band, not a scoreboard.** A dimension that is too high is also a failure
   state. *Low — G9 already half-implies it.*
5. **Verbatim callbacks.** Month five quotes your month-one words back at you. *Low-medium.*
6. **Purchasable information.** Spend time to learn a fact; hidden information becomes a
   resource rather than a gotcha. *Medium — we half-have this in the investigate mission.*
7. **Visible clocks for delayed consequence** (Citizen Sleeper). *Low.*
8. **Replay through knowledge, not branches.** End with what you never saw. *Medium.*

**Reject despite the conventional advice:** XP, badges, streaks (overjustification, and no
retention problem in 35 minutes) · a final grade or rank · branching endings as the replay
driver (forcing players to contradict their own reasoning for marginal content) ·
difficulty settings · timers.

Note this puts our six **badges** on the chopping block. They are informational rather
than inflated ("You found information that changed your decision"), which is the
defensible end of the spectrum — but they are still approval, and they are awarded by a
narrator.

## UI patterns, with provenance

- **A desk with a cross-referenceable rulebook** — *Papers, Please*. Reference present,
  never tested.
- **An end-of-day receipt** — *Papers, Please*. Consequence as an itemised bill.
- **A card deck, one decision per card, physical commit gesture** — *Reigns*.
- **Drag a fact into a file; conflicting facts, none marked correct** — *Orwell*.
- **A player-maintained journal with struck-out entries** — *Obra Dinn*. Not a progress bar.
- **Ticking clocks, all state visible at a glance** — *Citizen Sleeper*.
- **Manipulate, then explain. One concept per screen** — *Brilliant*.
- **Diegetic framing taxonomy** — Fagerholt & Lorentzon 2009; Pip-Boy, Dead Space's RIG,
  Far Cry 2's paper map.

## Anti-patterns to kill

Chocolate-covered broccoli · the Lesson Caption · "Great job!" · **a Tip rail that answers
the question the Consider rail just asked** (we do this) · ⭐ Recommended · the end-of-run
grade · re-explaining a mechanic already used · the moralising narrator · the words
*objective*, *tip*, *student*, *advisor* on the player surface · fake choices · the
quiz-at-the-end · streaks and XP · a progress bar as the only sense of motion ·
unskippable prose.

## Sources

Papers, Please design: gamedeveloper.com/design/designing-the-bleak-genius-of-i-papers-please-i- ·
dissectinggamedesign.substack.com/p/papers-please-and-non-diegetic-morality ·
Obra Dinn: whynowgaming.com/obra-dinn-the-rule-of-three ·
intermittentmechanism.blog/2024/05/21/confirmation-in-the-return-of-obra-dinn/ ·
Reigns: gamedeveloper.com/design/game-design-deep-dive-creating-an-adaptive-narrative-in-i-reigns-i- ·
Orwell: gamedeveloper.com/design/game-design-deep-dive-decisions-that-matter-in-i-orwell-i- ·
Her Story: herstorygame.com/about/ ·
Rudolph et al., *Debriefing with Good Judgment* (PDF, squarespace static) ·
*There's no such thing as "nonjudgmental" debriefing*, Simulation in Healthcare 2006 ·
Knowles / andragogy: infed.org/dir/welcome/malcolm-knowles-informal-adult-education-self-direction-and-andragogy/ ·
Overjustification: en.wikipedia.org/wiki/Overjustification_effect ·
Chocolate-covered broccoli: tedium.co/2019/05/09/edutainment-math-blaster-chocolate-covered-broccoli/ ·
Brilliant: brilliant.org/about/ ·
Universal Paperclips: if50.substack.com/p/2017-universal-paperclips ·
Narrative replayability: gamedeveloper.com/design/narrative-replayability ·
Perfect information: jeremiahgames.com/2019/03/04/perfect-information-the-killer-feature-of-slay-the-spire-and-into-the-breach/ ·
Citizen Sleeper: gamedeveloper.com/business/how-citizen-sleeper-was-inspired-by-tabletop-rpgs-and-gig-work ·
Diegetic UI: nastyrodent.com/diegetic-and-non-diegetic-ui/ ·
Harvard PON role-play simulations: pon.harvard.edu/daily/teaching-negotiation-daily/teaching-the-fundamentals-the-best-introductory-negotiation-role-play-simulations/
