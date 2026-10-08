/**
 * Test-only content: six of the eight lever decisions from `docs/STORY-V2.md` (d1, d2, d3, d5,
 * d6, d7), trimmed, with act breaks and the promise ledger in the D-086 shape. It exists so the
 * lever panel, the act-break map and the system views can be built and looked at before the
 * real script lands in `story.ts`. Never imported by the game.
 */
import type { Condition, Content, GameNode, Interlude, LeverMission, Lever, Outcome } from '../../engine/types';
import type { PromiseSettled } from '../ledger';

const priya = { name: 'Priya Sharma', role: 'Client Growth Lead', quote: 'People tell us who matters and papers tell us what hurts.' };
const riya = { name: 'Riya Kapoor', role: 'Engagement Director', quote: 'A deal is worth only the team time it can repay.' };
const arjun = { name: 'Arjun Mehta', role: 'Solutions Director', quote: 'Every piece we add gives Aisha more to deliver.' };
const aisha = { name: 'Aisha Khan', role: 'Delivery Lead', quote: 'Signing commits us to every promise in it.' };

const out = (id: string, headline: string, detail: string, effect: Outcome['effect'], when?: Condition, next?: string): Outcome =>
  ({ id, when, tone: when ? 'strong' : 'mixed', headline, detail, changed: [headline], effect, next });

function mission(m: Pick<LeverMission, 'id' | 'chapter' | 'stage' | 'title' | 'question' | 'situation' | 'advisor' | 'next' | 'saidQuote' | 'advisorLine'> & { levers: Lever[]; outcomes: Outcome[]; because: string; principle: string }): LeverMission {
  return {
    kind: 'levers', id: m.id, chapter: m.chapter, stage: m.stage, title: m.title, eyebrow: m.title, objective: m.question, minutes: 3,
    situation: m.situation, advisor: m.advisor, saidQuote: m.saidQuote, advisorLine: m.advisorLine, question: m.question, next: m.next,
    levers: m.levers, outcomes: m.outcomes, lesson: { principle: m.principle, because: m.because },
  };
}

const d1 = mission({
  id: 'd1', chapter: 1, stage: 'client', title: 'What is really wrong', question: 'What is really wrong at Orion?', next: 'd2', advisor: priya,
  advisorLine: 'People tell us who matters and papers tell us what hurts, and one week buys one of each. Whatever we skip, we walk in on Thursday guessing about it.',
  situation: ['Sarah Lim, the Orion director who holds the budget, sent us that one line and wants to meet next Thursday. We have one week, so choose one group of people to talk to and one set of papers to read.'],
  saidQuote: { text: 'Our customers deserve better than they’re getting. I need a partner who can show my board a difference within a year.', speaker: 'Sarah Lim', role: 'Chief Transformation Officer' },
  levers: [
    { id: 'who', label: 'Who we talk to', options: [
      { id: 'd1-team', label: 'Sarah’s own team', detail: 'Hear what Sarah’s people think is wrong, and who scores the bids.', dims: { win: 3, deliver: -1 }, flags: ['clue:declan'] },
      { id: 'd1-ops', label: 'Orion’s delivery managers', detail: 'A day in the warehouse with the people who send orders.', dims: { win: -1, deliver: 3 }, flags: ['clue:marcus'] },
    ] },
    { id: 'read', label: 'What we read', options: [
      { id: 'd1-complaints', label: 'The complaint records', detail: 'A year of what customers told Orion’s helpline.', dims: { win: 1, profit: -2, deliver: 2 }, flags: ['clue:complaints'] },
      { id: 'd1-budget', label: 'The budget papers', detail: 'What Orion will spend, and by when.', dims: { profit: 3, deliver: -1 }, flags: ['clue:budget'] },
      { id: 'd1-rivals', label: 'The rival firms', detail: 'Who else is bidding, and what they sell.', dims: { win: 2, deliver: -1 }, flags: ['clue:rivals'] },
    ] },
  ],
  outcomes: [
    out('d1-both', 'Solved: the trouble starts after people buy.', 'Because you read the complaints and spent a day in the warehouse, you have both halves.', { dims: { win: 2, deliver: 2 }, flags: ['knows:after_sale'] }, { all: ['clue:complaints', 'clue:marcus'] }),
    out('d1-complaints', 'The complaints are not about the shops.', 'Because you read a year of complaints, you know shoppers hate what comes after they buy.', { dims: { win: 2 }, flags: ['knows:after_sale'] }, { all: ['clue:complaints'] }),
    out('d1-ops', 'The warehouse told you what the brief didn’t.', 'Because you spent a day with the delivery managers, you heard it first hand.', { dims: { deliver: 2 }, flags: ['knows:after_sale'] }, { all: ['clue:marcus'] }),
    out('d1-sarah', 'You know Sarah’s version of the problem, and only hers.', 'Because you spent the week with Sarah’s team, you know who scores the bids.', { dims: { win: 1 } }),
  ],
  principle: 'Understand before you offer.', because: 'What Sarah asked for and what customers complain about were different things.',
});

const d2 = mission({
  id: 'd2', chapter: 1, stage: 'lead', title: 'The first meeting', question: 'How do we open the first meeting?', next: 'deb-1', advisor: priya,
  situation: ['Sarah gives us thirty minutes on Thursday, so choose what we open with and who else we invite.'],
  saidQuote: { text: 'I have thirty minutes and three firms. Tell me something about my business that I don’t already know.', speaker: 'Sarah Lim', role: 'Chief Transformation Officer' },
  levers: [
    { id: 'open', label: 'What we open with', options: [
      { id: 'd2-found', label: 'What we found this week', detail: 'Open with what is really hurting Orion’s customers.', dims: { win: 2, profit: -1, deliver: 3 }, flags: ['led:after_sale'], requires: { all: ['knows:after_sale'] } },
      { id: 'd2-shops', label: 'The shops, as Sarah asked', detail: 'The shop experience her one line describes.', dims: { win: 3, profit: 1, deliver: -2 } },
      { id: 'd2-past', label: 'Our past work for retailers', detail: 'A retailer we helped, and what changed for its customers.', dims: { win: 1, profit: 2 } },
    ] },
    { id: 'invite', label: 'Who else we invite', options: [
      { id: 'd2-none', label: 'Nobody else, yet', detail: 'Keep Sarah’s full attention on us.', dims: { win: 2, deliver: -1 } },
      { id: 'd2-marcus', label: 'Marcus Reed, from Operations', detail: 'Ask Sarah to bring Marcus, who runs deliveries and warehouses.', dims: { win: -1, deliver: 3 }, flags: ['met:marcus'], requires: { all: ['clue:marcus'] } },
      { id: 'd2-declan', label: 'Declan Foyle, Orion’s buyer', detail: 'Ask to meet Declan, who buys for Orion and scores bids.', dims: { win: -1, profit: 2 }, flags: ['met:declan'], requires: { all: ['clue:declan'] } },
    ] },
  ],
  outcomes: [
    out('d2-trust', 'Sarah: “I have suspected this for a year.”', 'Because you opened with what happens after people buy, Sarah heard her business described from outside.', { dims: { win: 4 }, flags: ['sarah:trusts'] }, { all: ['led:after_sale'], any: ['clue:complaints', 'met:marcus'] }),
    out('d2-word', 'Sarah took your word for it, for now.', 'Because the friend who introduced us had vouched for you, Sarah believed you.', { dims: { win: 2 }, flags: ['sarah:trusts'] }, { all: ['led:after_sale', 'start:connector'] }),
    out('d2-guess', 'The right problem, and nothing to show her.', 'Because you named the problem with no figures, it sounded like a clever guess.', { flags: ['sarah:doubts'] }, { all: ['led:after_sale'] }),
    out('d2-brief', 'Sarah heard her own brief read back to her.', 'Because you opened with the shops she asked about, we sounded like the other two firms.', { dims: { win: 1 }, flags: ['sarah:doubts'] }),
  ],
  principle: 'Understand before you offer.', because: 'Sarah’s trust followed what we knew about her business.',
});

const d3 = mission({
  id: 'd3', chapter: 2, stage: 'opportunity', title: 'How much do we bet', question: 'How much of our team does Orion get?', next: 'deb-2', advisor: riya,
  situation: ['Every week our people spend chasing Orion is a week nobody pays for, so choose how many go, and whether we study Orion first.'],
  levers: [
    { id: 'people', label: 'People on Orion', options: [
      { id: 'd3-two', label: 'Two of our six', detail: 'Two people on Orion for a month; four stay on paid work.', dims: { win: -2, profit: 3, deliver: -1 } },
      { id: 'd3-four', label: 'Four of our six', detail: 'Four people on Orion for a month; two stay on paid work.', dims: { win: 2, profit: -3, deliver: 1 }, flags: ['bet:four'] },
    ] },
    { id: 'study', label: 'A study first?', options: [
      { id: 'd3-none', label: 'No study: write the offer', detail: 'Start the offer now, from what we already know.', dims: { win: 2, deliver: -2 } },
      { id: 'd3-paid', label: 'Orion pays for a study', detail: 'Orion pays us for two weeks inside its business.', dims: { win: -2, profit: 3, deliver: 2 }, flags: ['study:paid', 'inside:orion'], requires: { all: ['sarah:trusts'] } },
      { id: 'd3-free', label: 'We study for free', detail: 'Two unpaid weeks in Orion’s warehouses and on its helpline.', dims: { win: -1, profit: -4, deliver: 3 }, flags: ['study:free', 'inside:orion'] },
    ] },
  ],
  outcomes: [
    out('d3-paid', 'Orion is paying us to look inside.', 'Because Sarah trusts us, she paid for two weeks inside Orion.', { dims: { profit: 2, deliver: 1 }, flags: ['clue:marcus', 'clue:complaints'] }, { all: ['study:paid'] }),
    out('d3-free', 'Two free weeks, and now we know what’s wrong.', 'Because we gave our time for nothing, Sarah let us in.', { dims: { win: 2 }, flags: ['knows:after_sale', 'clue:complaints', 'clue:marcus'] }, { all: ['study:free'] }),
    out('d3-four', 'Four people on a client who wants us.', 'Because Sarah trusts us, four people tells her we mean it.', { dims: { win: 2 } }, { all: ['bet:four'] }),
    out('d3-two', 'Two people on it, and four still earning.', 'Because you kept four of our six on paid work, this month is safe.', { dims: { profit: 1 } }),
  ],
  principle: 'Not every deal is worth winning.', because: 'A deal is worth only the team time it can repay.',
});

const d5 = mission({
  id: 'd5', chapter: 3, stage: 'solution', title: 'Build the offer', question: 'What goes in our offer?', next: 'd6', advisor: arjun,
  advisorLine: 'Every piece we add makes the offer easier to choose and gives Aisha more to deliver. A faster date or a fixed price makes Orion keener, and if it slips, we pay.',
  situation: ['Because the bid is now about what happens after people buy, I’m writing our offer this week, once. Choose what we fix, how fast we promise it, and how Orion pays us.'],
  levers: [
    { id: 'fix', label: 'What we fix', options: [
      { id: 'd5-screens', label: 'The shops and the app', detail: 'New screens in every shop, and a new app.', dims: { win: 3, profit: 1, deliver: -4 }, flags: ['promise:screens'] },
      { id: 'd5-app', label: 'The app only', detail: 'A new app; the shops stay as they are.', dims: { win: 1, profit: 2, deliver: -2 }, flags: ['promise:app'] },
      { id: 'd5-after', label: 'Everything after people buy', detail: 'Deliveries, refunds and the helpline, fixed together.', dims: { win: 2, profit: -1, deliver: 2 }, flags: ['promise:refunds'], requires: { all: ['knows:after_sale'] } },
    ] },
    { id: 'fast', label: 'How fast', options: [
      { id: 'd5-trial', label: 'A trial in eight weeks', detail: 'Ten shops trying it within eight weeks of signing.', dims: { win: 3, profit: -1, deliver: -3 }, flags: ['promise:trial'] },
      { id: 'd5-date', label: 'One date: month five', detail: 'Everything finished together by the end of month five.', dims: { profit: 1, deliver: 1 } },
    ] },
    { id: 'pay', label: 'How Orion pays', options: [
      { id: 'd5-fixed', label: 'One fixed price', detail: '£2.6 million, whatever the work turns out to need.', dims: { win: 2, profit: -2 }, flags: ['promise:fixed'] },
      { id: 'd5-day', label: 'By the day', detail: 'Orion pays for the days we actually work.', dims: { win: -2, profit: 2 } },
      { id: 'd5-results', label: 'Partly on results', detail: 'A third of our fee only if complaints fall by a fifth.', dims: { win: 3, profit: -3, deliver: -1 }, flags: ['promise:results'], requires: { any: ['start:builder', 'inside:orion'] } },
    ] },
  ],
  outcomes: [
    out('d5-new', 'An offer for work our team has never done.', 'Because the offer promises screens or an app, we need a partner we don’t have.', { dims: { deliver: -2 } }, { any: ['promise:screens', 'promise:app'] }),
    out('d5-gifts', 'A fast date, and we pay if it slips.', 'Because you promised a trial in eight weeks at a fixed price, every week it slips is ours.', { dims: { profit: -2 } }, { all: ['promise:trial', 'promise:fixed'] }),
    out('d5-priced', 'An offer where every extra has a price.', 'Because every extra is either charged for or left out, nothing in the offer is a gift.', { dims: { profit: 2, deliver: 1 } }),
  ],
  principle: 'Trade, don’t give.', because: 'Each extra was a cost we either priced in or gave away.',
});

const d6 = mission({
  id: 'd6', chapter: 3, stage: 'deal', title: 'The price push', question: 'How do we answer on price?', next: 'deb-3', advisor: riya,
  situation: ['Declan Foyle has our offer beside the rival’s, which is £600,000 cheaper. Choose our price, what we drop, and what we ask for in return.'],
  saidQuote: { text: 'I have two offers and a savings target. Give me a reason I can write down for not taking the cheaper one.', speaker: 'Declan Foyle', role: 'Procurement' },
  levers: [
    { id: 'price', label: 'Our price', options: [
      { id: 'd6-hold', label: 'Hold at £2.6 million', detail: 'Keep the price, and explain what the extra buys.', dims: { win: -3, profit: 4, deliver: 1 } },
      { id: 'd6-half', label: 'Halfway: £2.3 million', detail: 'Cut £300,000 and keep the rest.', dims: { win: 1, profit: -1 }, flags: ['discount:half'] },
      { id: 'd6-match', label: 'Match them: £2 million', detail: 'Cut £600,000 to equal the cheaper bid.', dims: { win: 4, profit: -6, deliver: -2 }, flags: ['discount:full'] },
    ] },
    { id: 'drop', label: 'What we drop', options: [
      { id: 'd6-keep', label: 'Nothing', detail: 'Orion gets everything in the offer.', dims: { win: 1, profit: -1, deliver: -1 } },
      { id: 'd6-trial', label: 'The eight-week trial', detail: 'Take the trial out; the main work stays.', dims: { win: -1, profit: 1, deliver: 2 }, flags: ['dropped:trial'], requires: { all: ['promise:trial'] } },
      { id: 'd6-shops', label: 'Half the shops', detail: 'Cover 100 shops now, not all 210.', dims: { win: -3, profit: 2, deliver: 1 }, flags: ['dropped:shops'] },
    ] },
    { id: 'ask', label: 'What we ask back', options: [
      { id: 'd6-nothing', label: 'Nothing', detail: 'Ask for nothing in return.', dims: { win: 2, deliver: -1 } },
      { id: 'd6-year', label: 'A second year', detail: 'Orion signs now for a second year of work.', dims: { win: -2, profit: 3 }, flags: ['got:second_year'] },
      { id: 'd6-ops', label: 'One of Marcus’s managers', detail: 'An Orion operations manager on our team, full time.', dims: { win: -1, deliver: 4 }, flags: ['got:ops_lead'], requires: { all: ['clue:marcus'] } },
    ] },
  ],
  outcomes: [
    out('d6-lost', 'Orion chose the cheaper firm.', 'Because both offers were for screens and an app, Declan could only compare prices.', { flags: ['award:lost'] }, { any: ['promise:screens', 'promise:app'], none: ['discount:full'] }, 'end'),
    out('d6-gave', 'We cut the price, and got nothing for it.', 'Because you came down and asked for nothing back, Declan banked the cut.', { dims: { win: 1 }, flags: ['award:won'] }, { any: ['discount:half', 'discount:full'], none: ['dropped:trial', 'dropped:shops', 'got:second_year', 'got:ops_lead'] }),
    out('d6-traded', 'Every pound we cut bought something back.', 'Because you came down only in exchange for something, Declan could show a saving.', { dims: { win: 2, profit: 2 }, flags: ['award:won'] }, { any: ['discount:half', 'discount:full'] }),
    out('d6-sore', 'Sarah chose us against Declan’s advice.', 'Because we held the price with nothing Declan could write down, Sarah overruled her own buyer.', { dims: { win: -2 }, flags: ['award:won', 'declan:sore'] }),
  ],
  principle: 'Trade, don’t give.', because: 'Only the cuts we traded for something came back to us.',
});

const d7 = mission({
  id: 'd7', chapter: 4, stage: 'deal', title: 'Sign or walk', question: 'Do we sign this contract?', next: 'deb-4', advisor: aisha,
  situation: ['Declan has sent the contract: every promise we made, now in writing, plus a charge of £20,000 for each week we’re late. We can change one clause, then sign or walk away.'],
  levers: [
    { id: 'clause', label: 'The clause we change', options: [
      { id: 'd7-none', label: 'None: leave it as written', detail: 'Accept every clause, including the late charge.', dims: { win: 2, deliver: -2 }, flags: ['promise:late_fee'] },
      { id: 'd7-fee', label: 'Remove the late charge', detail: 'No £20,000 a week if we are late.', dims: { win: -2, profit: 2 }, requires: { none: ['declan:sore'] } },
      { id: 'd7-later', label: 'Every date a month later', detail: 'Move every date in the contract back one month.', dims: { win: -2, deliver: 3 }, flags: ['promise:late_fee', 'dates:moved'] },
    ] },
    { id: 'sign', label: 'Sign or walk', options: [
      { id: 'd7-sign', label: 'Sign it', detail: 'Sign today; Aisha’s team starts on Monday.', dims: { win: 4, deliver: -2 }, flags: ['signed'] },
      { id: 'd7-walk', label: 'Walk away', detail: 'Tell Sarah no, and why, in writing.', dims: { win: -8, profit: 2, deliver: 4 }, flags: ['walked'] },
    ] },
  ],
  outcomes: [
    out('d7-walked', 'We walked away.', 'Because you walked away, the work went to the rival.', {}, { all: ['walked'] }, 'end'),
    out('d7-signed', 'Signed. Every promise is now my team’s.', 'Because you signed, every promise card in your hand now has a due date.', { dims: { win: 2 } }),
  ],
  principle: 'Promise only what your team can deliver.', because: 'The contract turned every promise into a date.',
});

const brk = (chapter: number, title: string, next: string, body: string): Interlude =>
  ({ kind: 'interlude', id: 'deb-' + chapter, role: 'chapter-debrief', chapter, eyebrow: 'Act ' + chapter, title, body: [body], next });

const nodes: Record<string, GameNode> = {
  d1, d2, d3, d5, d6, d7,
  'deb-1': brk(1, 'Who Orion really is', 'd3', 'You found out what was really wrong, and Sarah heard it from us first.'),
  'deb-2': brk(2, 'A bet we can afford', 'd5', 'We decided how much of the team Orion is worth.'),
  'deb-3': brk(3, 'Traded, not given', 'd7', 'The offer is written and the price is agreed.'),
  'deb-4': brk(4, 'Every promise came due', 'end', 'Month five has been and gone.'),
  end: { kind: 'ending', id: 'end' },
};

/** The ledger rules, in the shape of `PromiseRule` (LEVERS.md, D-086). */
const planned = { any: ['got:ops_lead', 'dropped:shops', 'dates:moved'] };
export const PROMISES = [
  { flag: 'promise:trial', due: 'Month 2', dueMonth: 2, voidWhen: { all: ['dropped:trial'] }, voided: 'Traded away in decision 6.', keptWhen: { any: ['inside:orion', 'bet:four', 'dates:moved'] }, kept: 'Kept. Someone had checked the order records first.', broken: 'Broken. It started in week fourteen: the order records needed six weeks of cleaning, and nobody had checked them.' },
  { flag: 'promise:refunds', due: 'Month 5', dueMonth: 5, keptWhen: planned, kept: 'Kept. We had planned around the summer freeze.', lateWhen: { all: ['told:sarah'] }, late: 'Moved to month six, because you told Sarah early.', broken: 'Broken. Refunds still take two weeks.' },
  { flag: 'promise:screens', due: 'Month 5', dueMonth: 5, keptWhen: { any: ['team:extra'] }, kept: 'Kept, just. Two contractors built what our team couldn’t.', broken: 'Broken. Screens are in three shops. Nobody on our team had built one.' },
  { flag: 'promise:app', due: 'Month 5', dueMonth: 5, keptWhen: { any: ['team:extra'] }, kept: 'Kept, just. Two contractors built it.', broken: 'Broken. The app is half built.' },
  { flag: 'promise:fixed', due: 'Month 5', dueMonth: 5, kept: 'Kept. Our team paid in weekends.' },
  { flag: 'promise:results', due: 'Month 5', dueMonth: 5, keptWhen: { all: ['inside:orion', 'promise:refunds'] }, kept: 'Kept, against the figure we took in the study.', broken: 'Broken. Complaints fell, but not by a fifth, and a third of our fee went with them.' },
  { flag: 'promise:late_fee', due: 'Month 5', dueMonth: 5, keptWhen: planned, kept: 'Not charged. Nothing was late.', broken: 'Charged: three weeks late, £60,000.' },
];

export const fixture: Content & { promises: typeof PROMISES } = {
  nodes, startNodeId: 'd1', missionOrder: ['d1', 'd2', 'd3', 'd5', 'd6', 'd7'], threads: [], promises: PROMISES,
  chapters: [
    { number: 1, label: 'Act 1', title: 'Understand before you offer', missionIds: ['d1', 'd2'], steps: ['Find what is wrong', 'The first meeting'] },
    { number: 2, label: 'Act 2', title: 'Not every deal is worth winning', missionIds: ['d3'], steps: ['How much we bet'] },
    { number: 3, label: 'Act 3', title: 'Trade, don’t give', missionIds: ['d5', 'd6'], steps: ['Build the offer', 'The price push'] },
    { number: 4, label: 'Act 4', title: 'Promise only what you can deliver', missionIds: ['d7'], steps: ['Sign or walk'] },
  ],
};

/** Card titles from the script, standing in for `gates.ts` until the real cards land there. */
export const CARDS: Record<string, { as: string; where: string; liability?: true }> = {
  'start:builder': { as: 'Past results you can show', where: 'Setup' },
  'start:connector': { as: 'A warm introduction', where: 'Setup' },
  'clue:declan': { as: 'Who scores the bids', where: 'Act 1' },
  'clue:marcus': { as: 'Who can stop it', where: 'Act 1' },
  'clue:complaints': { as: 'The complaint figures', where: 'Act 1' },
  'clue:budget': { as: 'A fixed budget: £2.6 million', where: 'Act 1' },
  'clue:rivals': { as: 'Who else is bidding', where: 'Act 1' },
  'knows:after_sale': { as: 'What’s really wrong: after the sale', where: 'Act 1' },
  'led:after_sale': { as: 'We named the real problem', where: 'Act 1' },
  'met:marcus': { as: 'Marcus has met us', where: 'Act 1' },
  'met:declan': { as: 'Declan has met us', where: 'Act 1' },
  'sarah:trusts': { as: 'Sarah trusts us', where: 'Act 1' },
  'sarah:doubts': { as: 'Sarah has doubts', where: 'Act 1', liability: true },
  'bet:four': { as: 'Four people on the bid', where: 'Act 2' },
  'study:paid': { as: 'A paid study', where: 'Act 2' },
  'study:free': { as: 'A free study', where: 'Act 2' },
  'inside:orion': { as: 'We’ve seen inside Orion', where: 'Act 2' },
  'promise:screens': { as: 'Screens and an app, by month five', where: 'Act 3', liability: true },
  'promise:app': { as: 'A new app, by month five', where: 'Act 3', liability: true },
  'promise:refunds': { as: 'Refunds in five days, by month five', where: 'Act 3', liability: true },
  'promise:trial': { as: 'A ten-shop trial by week eight', where: 'Act 3', liability: true },
  'promise:fixed': { as: 'The price won’t change', where: 'Act 3', liability: true },
  'promise:results': { as: 'Complaints down a fifth by month five', where: 'Act 3', liability: true },
  'discount:half': { as: '£300,000 off our price', where: 'Act 3', liability: true },
  'discount:full': { as: '£600,000 off our price', where: 'Act 3', liability: true },
  'dropped:trial': { as: 'The trial, traded away', where: 'Act 3' },
  'dropped:shops': { as: '100 shops, not 210', where: 'Act 3' },
  'got:second_year': { as: 'A second year, signed', where: 'Act 3' },
  'got:ops_lead': { as: 'Marcus’s manager on our team', where: 'Act 3' },
  'declan:sore': { as: 'Declan didn’t want us', where: 'Act 3', liability: true },
  'promise:late_fee': { as: '£20,000 a week if we’re late', where: 'Act 4', liability: true },
  'dates:moved': { as: 'Every date a month later', where: 'Act 4' },
};

export const STOPS: Record<string, string> = {
  setup: 'Your team’s strength', d1: 'Find what is really wrong', d2: 'The first meeting', d3: 'How much do we bet?',
  d5: 'Build the offer', d6: 'The price push', d7: 'Sign or walk',
};

/** One scripted run, setting by setting, used by the preview and the tests. */
export const RUN: Record<string, string[]> = {
  d1: ['d1-ops', 'd1-complaints'], d2: ['d2-found', 'd2-marcus'], d3: ['d3-four', 'd3-paid'],
  d5: ['d5-after', 'd5-trial', 'd5-fixed'], d6: ['d6-half', 'd6-keep', 'd6-year'], d7: ['d7-none', 'd7-sign'],
};

/**
 * How that run's promises came due, written out by hand from the ledger table in STORY-V2, as
 * the engine will produce it once D-086 is built. The trial was kept (the study checked the
 * records); refunds and the late charge were not planned around the freeze.
 */
export const SETTLED: PromiseSettled[] = [
  { flag: 'promise:trial', due: 'Month 2', dueMonth: 2, status: 'kept', line: PROMISES[0].kept },
  { flag: 'promise:refunds', due: 'Month 5', dueMonth: 5, status: 'broken', line: PROMISES[1].broken! },
  { flag: 'promise:fixed', due: 'Month 5', dueMonth: 5, status: 'kept', line: PROMISES[4].kept },
  { flag: 'promise:late_fee', due: 'Month 5', dueMonth: 5, status: 'broken', line: PROMISES[6].broken! },
];
