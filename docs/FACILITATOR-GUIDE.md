# Running GPL with a group

**For whoever is facilitating.** You do not need to have played it, and you do not need to
know consulting. You do need to know the three things the game refuses to do, because a
group will ask you about all three within the first ten minutes.

Everything here is about the discussion. The install instructions are at the end.

---

## 1. What it is, in one paragraph you can read aloud

You are on a pursuit team chasing one client through five chapters — finding them,
qualifying them, building a proposal, doing the deal, and delivering what you sold.
Eighteen decisions. Three meters move: **can we win it, is it worth winning, can we
deliver it**. There is no right answer and there is no score. It takes about **70 minutes**
played honestly, and the game saves as you go.

---

## 2. The three things it refuses to do

Hold these. They are not omissions and a group will test all of them.

**It will not tell anyone they were right.** There is no score, no grade, no leaderboard,
no percentage. This is deliberate and it was tested: an earlier build had a score, and a
player optimising for it reached 100/100/100 **without reading a single brief**. Meters
measure position, not performance. If a participant asks "so how did I do?", the honest
answer is "you tell me — what did you give up?"

**It will not let anyone win everything.** Every option costs something on another
dimension. A choice that beat its siblings on all three would fail the build — literally,
there is a test. So "what was the best option on mission 7" has no answer, and asking the
group to find one is the one discussion that will go nowhere.

**Walking away is a real ending.** Mission 14 lets a player decline the contract. The game
does not punish this, and one of the seven endings is *You walked away*. If someone takes it,
do not treat it as quitting. Ask whether the deal had become one worth declining — that is
the beat the whole middle of the game is building towards.

---

## 3. The shape of a session

### If you have 90 minutes

| | |
|---|---|
| 0:00 | Frame it. Section 2, read aloud. Two minutes, no longer |
| 0:05 | Play, solo, silent |
| 1:15 | Endings on the table — see below |
| 1:30 | Close |

### If you have half a day

Play solo before the session, or in a first hour. Then spend the rest on §4 and §5. The
game is the reading; the discussion is the teaching.

### Playing in pairs

Works, and changes what you get. Pairs argue before committing, which surfaces reasoning
that solo play keeps internal. It also roughly doubles the clock. Do not do threes — the
third person stops participating around chapter three.

---

## 4. The discussion, once everyone has finished

Start here, not with "what did you get".

**"Read out your ending title."** There are seven. The spread in the room is the entire
opening move, and you want it visible before anyone explains themselves.

| Ending | What it means |
|---|---|
| A deal worth having | All three meters ≥ 58. Uncommon, and it should be |
| A workable deal | The most common. One meter took the strain |
| You won it, but not well | Margin went |
| You won it, and it hurt | Delivery went |
| They chose someone else | Lost at the award, on the argument |
| You did not win the work | Rare — winability collapsed rather than the award being lost |
| You walked away | Declined the contract |

**Then: "who has a different ending from the person next to them, and where did you
diverge?"** This is the question that does the work. Two people who diverged at mission 4
and landed in different endings is the game's whole argument in one exchange.

**Then, the three that reliably open people up:**

- *"What did you find out that you wish you had found out earlier?"* Chapter 1 spends two
  questions out of five. Everybody under-buys information, and everybody discovers it in
  chapter 4.
- *"Where did you promise something you could not fund?"* This is the handover beat
  (mission 17). Options are locked if you never paid for them, and the screen names where
  they could have been earned. **85% of the positions a player can reach by that beat have
  at least one promise locked**, so in a room of any size somebody will have one.
- *"Did anyone conceal something?"* Mission 15 offers it. The game lets you, and the
  consequence arrives later rather than immediately, which is the point.

### The one item the game asks them

Before the ending reveals the causal chains, it asks each player one question: here is
something that happened in month five — which of your earlier decisions led to it?

**It is not marked and you should not mark it either.** Ask who got it, ask who picked a
different one and why, and let the disagreement stand if it is a good one. Not everyone is
asked — a player has to have built a chain for there to be a question about one, and a
third of runs build none. That asymmetry is worth naming in the room rather than letting
someone assume they missed a screen.

---

## 5. The four things a group usually gets wrong

Useful because you can predict them, so you can ask about them before anyone confesses.

1. **They buy too little information.** Two evidence slots feel like plenty in chapter 1
   and are not. The proposal is worse three chapters later, and the link is invisible at
   the time.
2. **They fund what is visible.** Training and measurement are the cheapest lines to cut
   and the ones the handover asks about.
3. **They treat procurement as weather.** Mission 13 puts a named person with a scorecard
   in front of them. Most players argue value at somebody whose job is comparability.
4. **They under-rate Operations.** Marcus Reed owns every system that has to change and is
   easy to never meet.

---

## 6. Questions you will be asked, with answers

**"Is there a best path?"** No, and not as a design coyness — it is enforced by a test that
fails the build. There are better-argued paths.

**"Why don't I get a score?"** Because scoring changed behaviour in the wrong direction
when it existed. See §2.

**"Can I replay it?"** Yes, and it is worth it — start over from the top bar. The second
run is where people deliberately buy different information.

**"Did my choices actually matter or is it on rails?"** They matter, and you can prove it
in front of the room: every run has a **run code** at the ending, 13–14 characters. Two
players reading theirs out will have different codes. The code replays the whole run
exactly, so a participant can hand you theirs and you can walk their exact game.

**"What if I can't finish?"** It saves automatically. The run code also carries the run to
another machine.

---

## 7. What it does not teach

Say this if it comes up, rather than letting someone discover it and distrust the rest.

It is one pursuit, one client, one market, and a **fictional** one. It does not carry your
firm's methodology, pricing model, approval thresholds or delivery model, and it should not
be used to settle an argument about any of them. Procurement is one named person rather
than a committee. There is no legal review worth the name.

What it does carry is the shape of the trade: that information bought early is cheaper than
information bought late, that a promise is a cost, and that the person who delivers it is
not usually the person who sold it.

---

## 8. Running it

The build is a folder of static files. No server, no network, no accounts, no data leaves
the machine.

**From a shared drive or a web server.** Copy `dist/` and open `index.html`. That is all.

**From an LMS.** `npm run scorm` writes a SCORM 1.2 manifest into `dist/`. Zip the
**contents** of `dist/` — the manifest must be at the root of the archive, not inside a
folder — and upload.

What the LMS gets: **completion, and nothing else.** It reports `incomplete` on arrival and
`completed` at any ending, walking away included. **It reports no score, by design** — if
your LMS report is expected to show a mark, know now that it will not, and §2 is the reason
to give. Resume is carried as the run code, which is a handful of characters rather than a
save file.

**Accessibility.** Keyboard-playable end to end, screen-reader labelled, AA contrast. It
wants a laptop — below about 1100px wide it will tell the player so rather than render
something misleading. Tablets in landscape are fine; phones are not.

**Printing the debrief.** The ending prints, and prints expanded — the collapsed run
history opens in the print stylesheet. Useful if you want people to bring their ending to a
later session.
