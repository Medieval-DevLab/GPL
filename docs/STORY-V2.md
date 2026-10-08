# GPL story, version 2: the script for review

8 October 2026. The eight lever decisions of `STRATEGY.md` §3, written to `LEVERS.md`. Nothing in `src/` is changed; once approved, this becomes `story.ts`.

**How to read it.**
- **W P D** are Win, Worth (`profit`) and Deliver. Each number is the setting's own immediate `dims`.
- **Cards** are flags with a plain title. **Needs** is a `requires`, with where the card is earned.
- Outcomes are checked in order and the first match wins; the last has no condition.
- Every `principle` is the act's idea, word for word; only `because` is written per outcome.

**The spine, word for word, on the title, at every act break and at the end:**
*Every promise that helps you win the work is a cost someone pays later — so choose your promises on purpose.*

---

## The spine in one paragraph

Orion Retail, a chain of 210 shops, asks for help to "improve the customer experience". In week
one you choose who to talk to and what to read, and that decides whether you find what is really
wrong. Customers are not angry about the shops. They are angry about what happens after they buy,
and the man who runs that, Marcus Reed, has never been asked. What you know decides whether Sarah
Lim trusts you, and her trust decides whether Orion pays you to look inside. When a rival shows
off shop screens, what you know decides whether you chase their deal or your own. The offer, written once, turns all of this into **promise cards with due dates**.
When Declan Foyle, Orion's buyer, pushes on price, you trade those promises or give them away.
Orion chooses; you sign or walk. In month five Marcus freezes every change for the summer
sale, and every promise comes due. Whether each one holds goes back to week one: did you find
Marcus, and did you trade for his help?

---

## Setup: your team's strength (existing screen, new cards)

The options and bars are unchanged. Only the cards change, so that each one is read later.

| Option | Card | Read in | New `STRENGTH_LATER` line |
|---|---|---|---|
| Connectors | `start:connector` "A warm introduction" | d2 o2; ending 2 | Act 1: "If you name Orion's real problem, Sarah takes your word for it, because a friend vouched for you." |
| Builders | `start:builder` "Past results you can show" | d5 *Partly on results* | Act 3: "You can offer to be paid partly on results, because you can measure them." |
| Challengers | `clue:rivals` "Who else is bidding" | d6 o4 | Act 3: "When Orion's buyer asks why you cost more, you know what the cheaper bid leaves out." |

---

# Act 1 · Understand before you offer.

**Opener (Priya).** "I'm Priya Sharma, and I find new clients for Northgate. Orion Retail, a
chain of 210 shops, wants help to 'improve the customer experience', and nobody there has said
what that means."

## d1 · What is really wrong at Orion?
*Modelled · Priya · research board*

**Situation.** "Sarah Lim, the Orion director who holds the budget, sent us that one line and
wants to meet next Thursday. We have one week, so choose one group of people to talk to and one
set of papers to read." *(40 words)*

**Sarah.** "Our customers deserve better than they're getting. I need a partner who can show my
board a difference within a year."

**Priya thinks aloud.** "People tell us who matters and papers tell us what hurts, and one
week buys one of each. Whatever we skip, we walk in on Thursday guessing about it."

| Lever | Option | Detail | W P D | Cards | Needs |
|---|---|---|---|---|---|
| **Who we talk to** | Sarah's own team | Hear what Sarah's people think is wrong, and who scores the bids. | +3 0 −1 | `clue:declan` "Who scores the bids" | |
| | Orion's delivery managers | A day in the warehouse with the people who send orders. | −1 0 +3 | `clue:marcus` "Who can stop it" | |
| **What we read** | The complaint records | A year of what customers told Orion's helpline. | +1 −2 +2 | `clue:complaints` "The complaint figures" | |
| | The budget papers | What Orion will spend, and by when. | 0 +3 −1 | `clue:budget` "A fixed budget: £2.6 million" | |
| | The rival firms | Who else is bidding, and what they sell. | +2 0 −1 | `clue:rivals` "Who else is bidding" | |

**Outcomes**
1. **all** `clue:complaints`, `clue:marcus` · **Solved: the trouble starts after people buy.**
   Because you read the complaints and spent a day in the warehouse, you have both halves: half a
   million complaints a year, nearly all about late deliveries, three-week refunds and a helpline
   that cannot see the order. The man who runs all of it, Marcus Reed, Orion's Operations
   Director, has not been in a single meeting.
   *Effect* W+2 D+2 · `knows:after_sale` "What's really wrong: after the sale" · *Because* You
   looked at what customers complain about and who runs it.
2. **all** `clue:complaints` · **The complaints are not about the shops.**
   Because you read a year of complaints, you know shoppers like the shops and hate what comes
   after they buy, and answering them costs Orion about £2.5 million a year. You still don't know who runs
   that part of Orion.
   *Effect* W+2 · `knows:after_sale` · *Because* The complaint figures showed a problem that
   Sarah's one line never mentioned.
3. **all** `clue:marcus` · **The warehouse told you what the brief didn't.**
   Because you spent a day with the delivery managers, you heard it first hand: orders leave
   late, refunds wait three weeks, and the helpline can see neither. They work for Marcus Reed,
   the Operations Director, whom nobody has invited to a meeting.
   *Effect* D+2 · `knows:after_sale` · *Because* The people who run deliveries knew what was
   wrong, and nobody had asked them.
4. *(fallback)* · **You know Sarah's version of the problem, and only hers.**
   Because you spent the week with Sarah's team and on papers about the deal, you know who
   scores the bids: Declan Foyle, who buys for Orion. Nobody you met runs anything a customer
   complains about.
   *Effect* W+1 · *Because* You learned about the deal, not about what is going wrong for Orion's customers.

**Lesson** · *Because* What Sarah asked for and what customers complain about were different things.

## d2 · How do we open the first meeting?
*Yours, Ask only · Priya · the meeting room*

**Situation.** "Because of this week's work, we know what Orion's customers are really angry
about. Sarah gives us thirty minutes on Thursday, so choose what we open with and who else we
invite." *(31)* · *If none* `knows:after_sale`, sentence 1 becomes: "This week told us who signs, but not what Orion's customers are angry about."

**Sarah.** "I have thirty minutes and three firms. Tell me something about my business that I don't already know."

| Lever | Option | Detail | W P D | Cards | Needs |
|---|---|---|---|---|---|
| **What we open with** | What we found this week | Open with what is really hurting Orion's customers. | +2 −1 +3 | `led:after_sale` "We named the real problem" | `knows:after_sale` (d1: complaints or warehouse) |
| | The shops, as Sarah asked | The shop experience her one line describes. | +3 +1 −2 | | |
| | Our past work for retailers | A retailer we helped, and what changed for its customers. | +1 +2 0 | | |
| **Who else we invite** | Nobody else, yet | Keep Sarah's full attention on us. | +2 0 −1 | | |
| | Marcus Reed, from Operations | Ask Sarah to bring Marcus, who runs deliveries and warehouses. | −1 0 +3 | `met:marcus` "Marcus has met us" | `clue:marcus` (d1: warehouse) |
| | Declan Foyle, Orion's buyer | Ask to meet Declan, who buys for Orion and scores bids. | −1 +2 0 | `met:declan` "Declan has met us" | `clue:declan` (d1: Sarah's team) |

*d1's first lever is either/or, so each player has one named person open here, plus "Nobody else".*

**Outcomes**
1. **all** `led:after_sale` **any** `clue:complaints`, `met:marcus` · **Sarah: "I have suspected this for a year."**
   Because you opened with what happens after people buy, backed by Orion's own figures or by
   Marcus nodding beside you, Sarah heard her business described from outside. She asked us for a
   written offer.
   *Effect* W+4 · `sarah:trusts` "Sarah trusts us" · *Because* We described her real problem and could show what it rested on.
2. **all** `led:after_sale`, `start:connector` · **Sarah took your word for it, for now.**
   Because the friend who introduced us had vouched for you, Sarah believed you without seeing a
   figure. She asked for an offer, and will want the figures before she signs.
   *Effect* W+2 · `sarah:trusts` · *Because* A warm introduction bought belief, but only until the proof is due.
3. **all** `led:after_sale` · **The right problem, and nothing to show her.**
   Because you named the problem with no figures and nobody from Orion to back it, it sounded
   like a clever guess. Sarah was polite and asked us to come back with proof.
   *Effect* W0 · `sarah:doubts` "Sarah has doubts" · *Because* Understanding counts only when the client can see what it rests on.
4. *(fallback)* · **Sarah heard her own brief read back to her.**
   Because you opened with the shops she asked about, or with our past work, we sounded like the
   other two firms. Sarah was friendly and wrote nothing down.
   *Effect* W+1 · `sarah:doubts` · *Because* We offered before we understood, so nothing we said was new to her.

**Lesson** · *Because* Sarah's trust followed what we knew about her business.

### Act 1 debrief
- **What happened:** Sarah left the first meeting *trusting us* or *with doubts*.
- **Which choice caused it:** What you opened with (d2), and whether you could back it with the figures or with Marcus (d1).
- **The idea:** Understand before you offer.
- **At work:** Any first meeting with someone who wants something fixed.
- **Guess the cause (unscored):** "What do you think decided how Sarah left?" · Who we talked to · What we read · What we opened with · Who else we invited

---

# Act 2 · Not every deal is worth winning.

**Opener (Riya).** "I'm Riya Kapoor, your boss: I decide how our six people spend their weeks.
Orion wants an offer but hasn't agreed to buy anything, so first we decide what it is worth to us."

## d3 · How much of our team does Orion get?
*Modelled · Riya · staffing board*

**Situation.** "Sarah trusts us now and wants a written offer within a month. Every week our
people spend chasing Orion is a week nobody pays for, so choose how many go, and whether we
study Orion first." *(36)* · *If* `sarah:doubts`, sentence 1 becomes: "Sarah has doubts about us, and still wants a written offer within a month."

**Riya thinks aloud.** "Two people keep the rest of us earning but may look half-hearted, and
four make losing cost us a month of their pay. A study teaches us more, and it costs either
Orion's money or ours."

| Lever | Option | Detail | W P D | Cards | Needs |
|---|---|---|---|---|---|
| **People on Orion** | Two of our six | Two people on Orion for a month; four stay on paid work. | −2 +3 −1 | | |
| | Four of our six | Four people on Orion for a month; two stay on paid work. | +2 −3 +1 | `bet:four` "Four people on the bid" | |
| **A study first?** | No study: write the offer | Start the offer now, from what we already know. | +2 0 −2 | | |
| | Orion pays for a study | Orion pays us for two weeks inside its business. | −2 +3 +2 | `study:paid` "A paid study", `inside:orion` "We've seen inside Orion" | `sarah:trusts` (d2) |
| | We study for free | Two unpaid weeks in Orion's warehouses and on its helpline. | −1 −4 +3 | `study:free` "A free study", `inside:orion` | |

**Outcomes**
1. **all** `study:paid` · **Orion is paying us to look inside.**
   Because Sarah trusts us, she paid for two weeks inside Orion. We checked the order records our
   plan depends on, and met the managers of Marcus Reed, the Operations Director who runs deliveries.
   *Effect* P+2 D+1 · `clue:marcus`, `clue:complaints` · *Because* Sarah's trust turned the cost of finding out into paid work.
2. **all** `study:free` · **Two free weeks, and now we know what's wrong.**
   Because we gave our time for nothing, Sarah let us in, and we found it: customers are angry
   about late deliveries, slow refunds and the helpline, not the shops. Two weeks of our pay bought
   what a week of reading could have.
   *Effect* W+2 · `knows:after_sale`, `clue:complaints`, `clue:marcus` · *Because* Finding out late cost money we need not have spent in week one.
3. **all** `bet:four`, `sarah:doubts` · **Four people, unpaid, on a client with doubts.**
   Because you put four of our six on Orion while Sarah still doubts us, a month of their pay
   rides on a client who isn't sure.
   *Effect* P−3 · *Because* We spent the most where we had the least reason to believe.
4. **all** `bet:four` · **Four people on a client who wants us.**
   Because Sarah trusts us, four people tells her we mean it, and leaves spare hands for checking.
   Two paying clients are short-staffed for a month.
   *Effect* W+2 · *Because* A big bet suited a client who had already shown she trusted us.
5. *(fallback)* · **Two people on it, and four still earning.**
   Because you kept four of our six on paid work, this month is safe whatever Orion decides. Nobody
   is spare to check what the offer rests on.
   *Effect* P+1 · *Because* A small bet kept the month safe and left nothing spare.

**Lesson** · *Because* A deal is worth only the team time it can repay.

## d4 · How do we answer the rival's demo?
*Yours, Ask only · Riya · staffing board*

**Situation.** "Two weeks later, a rival firm showed Sarah's board a demo: screens in every shop
and a new app, made with a famous technology company. Sarah wants our answer by Friday, so choose
how we answer and what we bring." *(40)*

**Sarah.** "My board has seen their demo, and it looks impressive. Tell me why I should still be talking to you."

| Lever | Option | Detail | W P D | Cards | Needs |
|---|---|---|---|---|---|
| **How we answer** | Match it | Add shop screens and an app to our offer. | +3 −3 −3 | `bid:shops` "We're chasing the screens deal" | |
| | Don't mention it | Keep to our plan and say nothing about their demo. | −2 +2 +1 | | |
| | Change the question | Show Sarah what their demo leaves out. | +2 0 +1 | `bid:after_sale` "We're chasing our own deal" | `knows:after_sale` (d1, or a d3 study) |
| **What we bring** | A one-page note | One page by Friday, in plain words. | −1 +2 0 | | |
| | Her own complaint figures | What answering complaints costs Orion every year. | +3 −1 0 | `showed:figures` "Sarah has seen the cost" | `clue:complaints` (d1, or a d3 study) |
| | A visit to a past client | Take Sarah to a retailer we have already helped. | +2 −2 +1 | `showed:visit` "Sarah has seen our work" | |

**Outcomes**
1. **all** `bid:shops` · **Two firms selling screens, and theirs has the famous partner.**
   Because you matched the demo, we are bidding to build screens and an app, which our team has
   never done, against a firm that has.
   *Effect* W+1 P−2 · `problem:shops` "The bid is about the shops" · *Because* We chased the rival's deal, which we could neither win cheaply nor deliver well.
2. **all** `bid:after_sale` **any** `showed:figures`, `showed:visit` · **Sarah stopped comparing us with the demo.**
   Because you showed what the demo leaves out, with proof she could check, the screens now look
   like an answer to a different question.
   *Effect* W+4 · `problem:after_sale` "The bid is about after the sale" · *Because* We chased only the deal we could win on what we know.
3. **all** `bid:after_sale` · **Sarah agreed, and asked for proof.**
   Because you pointed Sarah at what happens after people buy, she agreed the demo misses it. She
   wants figures in the offer.
   *Effect* W+1 · `problem:after_sale` · *Because* We picked the right deal and brought too little to make it stick.
4. **all** `sarah:trusts` · **Sarah didn't need an answer. She already trusted us.**
   Because Sarah trusted us after the first meeting, the demo didn't move her. We spent nothing on it.
   *Effect* P+2 · `problem:after_sale` · *Because* Sarah's trust let us ignore a deal we didn't want.
5. *(fallback)* · **We said nothing, and the demo became the project.**
   Because we stayed quiet while Sarah had doubts, her board heard only the rival's story. By
   Friday Orion's staff called it "the shop screens project".
   *Effect* W−4 · `problem:shops` · *Because* Our silence let the rival choose which deal Orion thinks it is buying.

**Lesson** · *Because* The screens deal was one we could neither win cheaply nor deliver.

### Act 2 debrief
- **What happened:** The bid is about *what happens after people buy* or *the shops*, with *two* or *four* of our people on it.
- **Which choice caused it:** How you answered the demo (d4), and whether Sarah already trusted you (d2).
- **The idea:** Not every deal is worth winning.
- **At work:** When a competitor or a louder colleague sets the agenda.
- **Guess the cause (unscored):** "Which choice do you think settled what the bid is about?" · How many people we put on it · Whether we studied Orion · How we answered the demo · The first meeting

---

# Act 3 · Trade, don't give.

**Opener (Riya).** "Now we write the offer, once. Arjun Mehta, who designs what we sell, will
build it with you, and then Orion's buyer will want a lower price."

## d5 · What goes in our offer?
*Modelled · Arjun · contract with clauses*

**Situation, when** `problem:after_sale`: "Because the bid is now about what happens after people
buy, I'm writing our offer this week, once. Choose what we fix, how fast we promise it, and how
Orion pays us." *(33)* · *Otherwise (*`problem:shops`*)*: "Because the bid is now about the shops, …"

**Marcus, when** `met:marcus`: "Every plan like this brings work for my people and no time for them. Ask me how the last one went."
**Sarah, otherwise:** "Whatever you write, my board will read as a promise."

**Arjun thinks aloud.** "Every piece we add makes the offer easier to choose and gives Aisha
Khan, who runs the work once we sign, more to deliver. A faster date or a fixed price makes Orion
keener, and if it slips, we pay."

| Lever | Option | Detail | W P D | Cards | Needs |
|---|---|---|---|---|---|
| **What we fix** | The shops and the app | New screens in every shop, and a new app. | +3 +1 −4 | `promise:screens` "Screens and an app, by month five" | |
| | The app only | A new app; the shops stay as they are. | +1 +2 −2 | `promise:app` "A new app, by month five" | |
| | Everything after people buy | Deliveries, refunds and the helpline, fixed together. | +2 −1 +2 | `promise:refunds` "Refunds in five days, by month five" | `knows:after_sale` |
| **How fast** | A trial in eight weeks | Ten shops trying it within eight weeks of signing. | +3 −1 −3 | `promise:trial` "A ten-shop trial by week eight" | |
| | One date: month five | Everything finished together by the end of month five. | 0 +1 +1 | | |
| **How Orion pays** | One fixed price | £2.6 million, whatever the work turns out to need. | +2 −2 0 | `promise:fixed` "The price won't change" | |
| | By the day | Orion pays for the days we actually work. | −2 +2 0 | | |
| | Partly on results | A third of our fee only if complaints fall by a fifth. | +3 −3 −1 | `promise:results` "Complaints down a fifth by month five" | `start:builder` (setup) **or** `inside:orion` (d3) |

*"The app only" gives a player who never solved the mystery a real choice on the first lever.*

**Outcomes**
1. **any** `promise:screens`, `promise:app` · **An offer for work our team has never done.**
   Because the offer promises screens or an app, we need a technology partner we don't have.
   Aisha asked who on our team has built an app. Nobody has.
   *Effect* D−2 · *Because* We gave Orion what it asked to see, and took on work our team cannot do.
2. **all** `promise:trial`, `promise:fixed` · **A fast date, and we pay if it slips.**
   Because you promised a trial in eight weeks at a fixed price, every week it slips comes out of
   our money, not Orion's.
   *Effect* P−2 · *Because* Speed and a fixed price were two gifts, and we got nothing for either.
3. **all** `promise:results`, `inside:orion` · **Paid on results we have already measured.**
   Because we spent two weeks inside Orion, we know today's complaint figure, so a fee tied to
   cutting it is a bet we can see. Declan, Orion's buyer, will score it as a saving.
   *Effect* W+2 P+2 · *Because* We took a risk we had measured, and got a reason for Orion to choose us.
4. **all** `promise:results` · **Our fee rides on a figure we haven't seen.**
   Because you tied a third of our fee to complaints falling, Sarah's board likes the offer. Nobody
   here has seen Orion's own figure, so we don't know where we start.
   *Effect* W+2 · *Because* We gave a guarantee before we knew what it would cost us.
5. *(fallback)* · **An offer where every extra has a price.**
   Because every extra is either charged for or left out, nothing in the offer is a gift. Aisha
   can plan every line of it.
   *Effect* P+2 D+1 · *Because* Each thing we promised was priced in, so nothing was given away.

**Lesson** · *Because* Each extra was a cost we either priced in or gave away.

## d6 · How do we answer on price?
*Yours, Ask only · Riya · contract with clauses*

**Situation.** "Our offer went in on Monday, and Declan Foyle, who buys for Orion, has it beside
the rival's, which is £600,000 cheaper. Sarah still wants us, so choose our price, what we drop,
and what we ask for in return." *(38)* · *If* `problem:shops`: "Sarah likes both offers, so …"

**Declan.** "I have two offers and a savings target. Give me a reason I can write down for not taking the cheaper one."

| Lever | Option | Detail | W P D | Cards | Needs |
|---|---|---|---|---|---|
| **Our price** | Hold at £2.6 million | Keep the price, and explain what the extra buys. | −3 +4 +1 | | |
| | Halfway: £2.3 million | Cut £300,000 and keep the rest. | +1 −1 0 | `discount:half` "£300,000 off our price" | |
| | Match them: £2 million | Cut £600,000 to equal the cheaper bid. | +4 −6 −2 | `discount:full` "£600,000 off our price" | |
| **What we drop** | Nothing | Orion gets everything in the offer. | +1 −1 −1 | | |
| | The eight-week trial | Take the trial out; the main work stays. | −1 +1 +2 | `dropped:trial` "The trial, traded away" | `promise:trial` (d5) |
| | Half the shops | Cover 100 shops now, not all 210. | −3 +2 +1 | `dropped:shops` "100 shops, not 210" | |
| **What we ask back** | Nothing | Ask for nothing in return. | +2 0 −1 | | |
| | A second year | Orion signs now for a second year of work. | −2 +3 0 | `got:second_year` "A second year, signed" | |
| | One of Marcus's managers | An Orion operations manager on our team, full time. | −1 0 +4 | `got:ops_lead` "Marcus's manager on our team" | `clue:marcus` (d1 warehouse, or a d3 study) |

**Outcomes.** Orion chooses here, before any contract exists.
1. **any** `promise:screens`, `promise:app` **none** `discount:full` · **Orion chose the cheaper firm.** → *ending*
   Because both offers were for screens and an app, Declan could only compare prices, and theirs
   was lower. Orion chose the rival.
   *Effect* `award:lost` "Orion chose the rival" · *Because* We offered what the rival offered, so we had nothing to trade but price.
2. **any** `discount:half`, `discount:full` **none** `dropped:trial`, `dropped:shops`, `got:second_year`, `got:ops_lead` · **We cut the price, and got nothing for it.**
   Because you came down and asked for nothing back, Declan banked the cut. Orion chose us, and
   the money for fixing surprises is gone.
   *Effect* W+1 · `award:won` "Orion chose us" · *Because* We gave money away and asked for nothing in return.
3. **any** `discount:half`, `discount:full` · **Every pound we cut bought something back.**
   Because you came down only in exchange for less work, a second year or Marcus's manager, Declan
   could show a saving and we kept what the money was for. Orion chose us.
   *Effect* W+2 P+2 · `award:won` · *Because* Each thing we gave came with something we got.
4. **all** `promise:refunds` **none** `problem:shops` **any** `showed:figures`, `clue:rivals`, `met:declan`, `clue:budget` · **We held the price, and Declan could write down why.**
   Because Declan had something to write down (what the cheaper bid leaves out, what complaints
   cost, or that our price fits his budget), he could justify us. Orion chose us at full price.
   *Effect* P+2 · `award:won` · *Because* We held our price because Orion could see what the extra money bought.
5. *(fallback)* · **Sarah chose us against Declan's advice.**
   Because we held the price with nothing Declan could write down, Sarah overruled her own buyer.
   He will write the contract.
   *Effect* W−2 · `award:won`, `declan:sore` "Declan didn't want us" · *Because* We held the price without a reason, so the cost moved into the contract.

**Lesson** · *Because* Only the cuts we traded for something came back to us.

### Act 3 debrief
- **What happened:** *Orion chose us at £X* or *Orion chose the cheaper firm*. We gave *Y* and got back *Z*.
- **Which choice caused it:** What you asked for in return (d6), and whether Declan had a reason he could write down (d1, d2, d4).
- **The idea:** Trade, don't give.
- **At work:** Whenever someone asks for a discount, an earlier date or "one small extra".
- **Guess the cause (unscored):** "Which choice do you think decided how Declan chose?" · Our price · What we dropped · What we asked back · What we showed Sarah about the demo

---

# Act 4 · Promise only what your team can deliver.

**Opener (Aisha).** "I'm Aisha Khan, and I run the work once a client signs. Orion has chosen us,
so every promise in that offer is about to become my team's job."

## d7 · Do we sign this contract?
*Modelled · Aisha · delivery calendar*

**Situation.** "Because Orion chose us, Declan has sent the contract: every promise we made, now
in writing, plus a charge of £20,000 for each week we're late. We can change one clause, then
sign or walk away." *(37)* · *If* `declan:sore`, sentence 1 becomes: "Because Sarah overruled him, Declan wrote the contract himself, with a £20,000 charge for each week we're late that he won't discuss."

**Declan.** "Standard terms. If you're late, Orion is paid £20,000 a week. I assume that won't be a problem."

**Aisha thinks aloud.** "Changing a clause costs us goodwill with Declan now, and leaving it costs
my team later. Walking away loses the work, and signing commits us to every promise in it."

| Lever | Option | Detail | W P D | Cards | Needs |
|---|---|---|---|---|---|
| **The clause we change** | None: leave it as written | Accept every clause, including the late charge. | +2 0 −2 | `promise:late_fee` "£20,000 a week if we're late" | |
| | Remove the late charge | No £20,000 a week if we are late. | −2 +2 0 | | not holding `declan:sore` (d6 o5) |
| | Every date a month later | Move every date in the contract back one month. | −2 0 +3 | `promise:late_fee`, `dates:moved` "Every date a month later" | |
| **Sign or walk** | Sign it | Sign today; Aisha's team starts on Monday. | +4 0 −2 | `signed` "A signed contract" | |
| | Walk away | Tell Sarah no, and why, in writing. | −8 +2 +4 | `walked` "We walked away" | |

**Outcomes**
1. **all** `walked` **any** `promise:screens`, `promise:app`, `discount:full` · **We walked away from a deal that would cost us.** → *ending*
   Because the contract held work our team has never built, or a price £600,000 below cost, signing
   meant promising what we couldn't keep.
   *Because* The deal couldn't pay or couldn't be delivered, so not signing was the promise we could keep.
2. **all** `walked` · **We walked away from work we could have done.** → *ending*
   Because you walked away from promises my team could keep, the work went to the rival.
   *Because* The promises were ones we could deliver, so walking away gave up good work.
3. **all** `signed` **any** `promise:screens`, `promise:app` · **Signed: promises our team has never kept before.**
   Because you signed for screens or an app, my team owes Orion work none of us has done, by month
   five.
   *Effect* D−3 · *Because* We signed for what Orion wanted to see, not for what my team can build.
4. **all** `signed` **none** `promise:late_fee` · **Signed, and lateness won't cost us £20,000 a week.**
   Because you took out the late charge before signing, a slip will cost us goodwill, not money.
   *Effect* P+2 · *Because* We removed the clause we couldn't be sure of keeping before it became a promise.
5. *(fallback)* · **Signed. Every promise is now my team's.**
   Because you signed, every promise card in your hand now has a due date in the contract. Each
   week we're late costs £20,000.
   *Effect* W+2 · *Because* Signing turned every promise into a date my team has to meet.

**Lesson** · *Because* The contract turned every promise into a date.

## d8 · Month five: what do we do?
*Yours, Ask only · Aisha · the delivery calendar plays out*

**Situation.** "It's month five, and Marcus Reed, who runs Orion's deliveries, has frozen every
change to his warehouses until the summer sale ends. Nobody told us it was coming, so we're three
weeks behind, and Sarah's board meets on Friday." *(40)*
*If* `got:ops_lead`: "It's month five, and Orion's summer sale has frozen every change to the
warehouses. Marcus's manager warned us in month two, so we're one week behind, not three, and
Sarah's board meets on Friday."

**Sarah (default):** "My board has your dates. On Friday I need to know which of them are real."
**Marcus, when** `got:ops_lead`: "My manager told you about the freeze in month two. I'd like to hear you planned for it."

| Lever | Option | Detail | W P D | Cards | Needs |
|---|---|---|---|---|---|
| **What we tell Sarah** | The real dates, now | Tell Sarah this week which promises will slip. | −2 0 +3 | `told:sarah` "Sarah heard it from us" | |
| | Nothing until we catch up | Work quietly, and tell her once we have caught up. | +2 +1 −3 | `kept:quiet` "Sarah wasn't told" | |
| **Who covers the gap** | Our team, at weekends | The same six people, six weekends in a row. | +1 +1 −3 | `team:weekends` "The team on weekends" | |
| | Two contractors, at our cost | Hire two people for two months, and we pay. | 0 −4 +3 | `team:extra` "Two contractors, at our cost" | |
| | Ask Orion to pay | Ask Sarah to pay for the extra weeks of work. | −3 +2 +2 | `team:orion_pays` "Orion pays for the extra weeks" | not holding `promise:fixed` (d5) |

**Outcomes.** Afterwards, the promise calendar settles every card (see the ledger below).
1. **all** `kept:quiet` · **Sarah heard it from Marcus first.**
   Because we said nothing, Marcus told Sarah's board the dates were slipping, and she found out in
   front of them. Every promise due now counts as broken, not late.
   *Effect* W−6 · *Because* We hid a promise we couldn't keep, and the client heard it from someone else.
2. **all** `told:sarah`, `got:ops_lead` · **Bad news, a plan, and Marcus on our side.**
   Because Marcus's manager warned us in month two and you told Sarah first, the board moved one
   date and kept the rest.
   *Effect* W+4 D+3 · *Because* We had promised around Orion's real calendar, and said early when a date moved.
3. **all** `team:extra`, `discount:full` · **Contractors paid from money we'd already given away.**
   Because we cut £600,000 to win, the contractors are paid from a contract that was already thin.
   Orion now costs us more than it pays.
   *Effect* P−6 · *Because* The money that should have paid for this went on winning the deal.
4. **all** `told:sarah` **any** `team:extra`, `team:orion_pays` · **Late, honest, and properly staffed.**
   Because you told Sarah the real dates and put proper people on the gap, her board agreed new
   dates in one meeting.
   *Effect* W+2 D+2 · *Because* We said what we could deliver, and paid for the people to deliver it.
5. *(fallback)* · **Sarah has the real dates. My team has the weekends.**
   Because you told Sarah but asked our six to cover the gap at weekends, the board is calm. Two of
   my team have asked to come off Orion.
   *Effect* D−3 · *Because* We kept our word to Orion with time our team didn't have.

**Lesson** · *Because* Only the promises planned around Orion's calendar held.

### Act 4 debrief
- **What happened:** Each promise came due: *kept*, *late and agreed*, or *broken*.
- **Which choice caused it:** The promises you made in d5 to d7, and whether you had planned around Marcus's calendar (d1, d6).
- **The idea:** Promise only what your team can deliver.
- **At work:** Every deadline you give, and every "yes, we can do that" said in a meeting.
- **Guess the cause (unscored):** "Which earlier choice do you think shaped month five most?" · Who we talked to in week one · What we asked back on price · Whether we moved the dates · What we told Sarah

---

## The promise ledger: how each card comes due

One line for each card held, shown on the delivery calendar. **Planned** means **any** `got:ops_lead`,
`dropped:shops`, `dates:moved`. A broken card sets `promise:broken` (proposed effect: W−3 D−3).
**Late, agreed** needs `told:sarah`.

| Card (d5 unless noted) | Due | Kept when | Kept | Late, agreed | Broken |
|---|---|---|---|---|---|
| A ten-shop trial by week eight | Month 2 | **any** `inside:orion`, `bet:four`, `dates:moved`; *void if* `dropped:trial` ("Traded away in decision 6.") | "Kept. Someone had checked the order records first." | — | "Broken. It started in week fourteen: the order records needed six weeks of cleaning, and nobody had checked them." |
| Refunds in five days, by month five | Month 5 | Planned | "Kept. We had planned around the summer freeze." | "Moved to month six, because you told Sarah early." | "Broken. Refunds still take two weeks." |
| Screens and an app, by month five | Month 5 | **any** `team:extra`, `team:orion_pays` | "Kept, just. Two contractors built what our team couldn't." | "Three shops done; the rest wait." | "Broken. Screens are in three shops. Nobody on our team had built one." |
| A new app, by month five | Month 5 | **any** `team:extra`, `team:orion_pays` | "Kept, just. Two contractors built it." | "A first version, two months late." | "Broken. The app is half built." |
| The price won't change | Month 5 | Always | `team:extra`: "Kept. The contractors came out of our side." `team:weekends`: "Kept. Our team paid in weekends." | — | — |
| Complaints down a fifth by month five | Month 5 | **all** `inside:orion`, `promise:refunds`, and Planned | "Kept, against the figure we took in the study." | — | "Broken. Complaints fell, but not by a fifth, and a third of our fee went with them." |
| £20,000 a week if we're late (d7) | Month 5 | Planned | "Not charged. Nothing was late." | — | "Charged: three weeks late, £60,000." *(A cost, not a broken promise: P−4.)* |

---

## The endings

Checked in order. Bars run from 0 to 100.

| # | Ending | When | What it says |
|---|---|---|---|
| 1 | **Orion chose the cheaper firm** | `award:lost` | "The rival is doing the shops. An offer about what happens after people buy, or a reason Declan could write down, would have changed it." |
| 2 | **We walked away** | `walked` | *If any* `promise:screens`, `promise:app`, `discount:full`: "It would have cost more than it paid, and promised what we couldn't build. Walking away kept our word." With `start:connector`, add: "Sarah will still take your call next year." *Otherwise:* "Aisha's team could have kept those promises. The rival is doing the work, for less." |
| 3 | **We broke our promises** | `signed` **any** `promise:broken`, `kept:quiet` | "In month six Sarah's board paused the work: the second project like this Orion has stopped in two years. Each broken card shows the decision that made it." |
| 4 | **We kept our promises, and paid for it** | `signed` **and** (Worth ≤ 39 **or** `team:weekends`) | "Every promise held. Northgate made little or nothing, and the team is tired. The calendar shows where the cost came from." |
| 5 | **We kept our promises, and it paid** | `signed`, `award:won`; also the fallback | "Every promise held, and the work paid for itself." With `got:second_year`, add: "The second year is already signed." |

---

## Every flag: where it is set and where it is read

Card titles are given where each flag is set, above.

| Flag | Set in | Read in |
|---|---|---|
| `start:connector` | Setup | d2 o2; ending 2 |
| `start:builder` | Setup | d5 *Partly on results* |
| `clue:rivals` | Setup (Challengers); d1 | d6 o4 |
| `clue:declan` | d1 *Sarah's team* | d2 *Declan Foyle* |
| `clue:marcus` | d1 *delivery managers*; d3 o1, o2 | d1 o1, o3; d2 *Marcus Reed*; d6 *Marcus's managers* |
| `clue:complaints` | d1 *complaints*; d3 o1, o2 | d1 o1, o2; d2 o1; d4 *Her figures* |
| `clue:budget` | d1 *budget* | d6 o4 |
| `knows:after_sale` | d1 o1–o3; d3 o2 | d2 *What we found*, situation; d4 *Change the question*; d5 *Everything after* |
| `led:after_sale` | d2 | d2 o1–o3 |
| `met:marcus` | d2 | d2 o1; d5 Marcus's line |
| `met:declan` | d2 | d6 o4 |
| `sarah:trusts` | d2 o1, o2 | d3 *Orion pays*; d4 o4 |
| `sarah:doubts` | d2 o3, o4 | d3 situation, o3 |
| `bet:four` | d3 | d3 o3, o4; ledger (trial) |
| `study:paid` / `study:free` | d3 | d3 o1 / o2 |
| `inside:orion` | d3 *either study* | d5 *Partly on results*, o3; ledger (trial, results) |
| `bid:shops` / `bid:after_sale` | d4 | d4 o1 / o2, o3 |
| `showed:figures` | d4 | d4 o2; d6 o4 |
| `showed:visit` | d4 | d4 o2 |
| `problem:after_sale` | d4 o2–o4 | d5 situation |
| `problem:shops` | d4 o1, o5 | d6 situation, o4 |
| `promise:screens`, `promise:app` | d5 | d5 o1; d6 o1; d7 o1, o3; ledger; ending 2 |
| `promise:refunds` | d5 | d6 o4; ledger |
| `promise:trial` | d5 | d5 o2; d6 *The trial*; ledger |
| `promise:fixed` | d5 | d5 o2; d8 *Ask Orion to pay*; ledger |
| `promise:results` | d5 | d5 o3, o4; ledger |
| `discount:half` | d6 | d6 o2, o3 |
| `discount:full` | d6 | d6 o1–o3; d7 o1; d8 o3; ending 2 |
| `dropped:trial` | d6 | d6 o2; ledger |
| `dropped:shops` | d6 | d6 o2; ledger (Planned) |
| `got:second_year` | d6 | d6 o2; ending 5 |
| `got:ops_lead` | d6 | d6 o2; d8 situation, Marcus's line, o2; ledger (Planned) |
| `award:won` / `award:lost` | d6 o2–o5 / o1 | ending 5 / ending 1 |
| `declan:sore` | d6 o5 | d7 situation, *Remove the late charge* |
| `promise:late_fee` | d7 | d7 o4; ledger |
| `dates:moved` | d7 | ledger (trial, Planned) |
| `signed` / `walked` | d7 | d7 o3–o5, endings 3–5 / d7 o1, o2, ending 2 |
| `told:sarah` | d8 | d8 o2, o4; ledger (late, agreed) |
| `kept:quiet` | d8 | d8 o1; ending 3 |
| `team:weekends` | d8 | ledger (fixed price); ending 4 |
| `team:extra` | d8 | d8 o3, o4; ledger |
| `team:orion_pays` | d8 | d8 o4; ledger |
| `promise:broken` | promise calendar, after d8 | ending 3 |

Mark these as `liability` in `gates.ts`: `sarah:doubts`, `problem:shops`, both discounts,
`declan:sore`, `kept:quiet`, `promise:broken`, and every `promise:*`.

---

## What this script assumes the engine can do

1. **Promise cards carry a due date and ledger lines**; the calendar settles them after d8 and sets `promise:broken`.
2. **A lever outcome can end the run** (`next: "end"`: d6 o1, d7 o1, o2), as m9a already does.
3. **`requires` can use `none`**, and the lock then names the card held: "Locked: Declan didn't want us (decision 6)."
4. **Endings are chosen by condition**, including a bar threshold (ending 4).
5. **The case file** (`MYSTERY.clues` in `presentation.ts`) reads `knows:after_sale`.
6. **No lever is left with one open option.** Checked by hand; a sweep check should keep it so.
