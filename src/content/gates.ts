/**
 * Every card the player can hold (D-086): the flag, its plain title, and where it is earned.
 * The hand (`ui/cards.ts`) shows these; a lever setting's flag that is a named card here is a
 * thing the player can see even before anything reads it.
 *
 * `liability` marks a flag that records a cost carried forward — a promise owed, a discount
 * given, a client with doubts — rather than something earned. The interface must never style
 * its presence as a gain or its absence as a shortfall: "your record does not show a
 * discount" is good news. Every `promise:*` card is one, as the script says.
 */
export const EARNED: Record<string, { as: string; where: string; liability?: true }> = {
  /* before you start — your team's strength */
  "start:connector": { as: "A warm introduction", where: "Your team’s strength" },
  "start:builder": { as: "Past results you can show", where: "Your team’s strength" },

  /* act 1 — understand before you offer */
  "clue:rivals": { as: "Who else is bidding", where: "Your team’s strength, or Act 1 · Find what is really wrong" },
  "clue:declan": { as: "Who scores the bids", where: "Act 1 · Find what is really wrong" },
  "clue:marcus": { as: "Who runs deliveries", where: "Act 1 · Find what is really wrong" },
  "clue:complaints": { as: "The complaint figures", where: "Act 1 · Find what is really wrong" },
  "clue:budget": { as: "What Orion will spend", where: "Act 1 · Find what is really wrong" },
  "knows:after_sale": { as: "What’s really wrong: after the sale", where: "Act 1 · Find what is really wrong" },
  "led:after_sale": { as: "We named the real problem", where: "Act 1 · The first meeting" },
  "met:marcus": { as: "Marcus has met us", where: "Act 1 · The first meeting" },
  "met:declan": { as: "Declan has met us", where: "Act 1 · The first meeting" },
  "sarah:trusts": { as: "Sarah trusts us", where: "Act 1 · The first meeting" },
  "sarah:doubts": { as: "Sarah has doubts", where: "Act 1 · The first meeting", liability: true },

  /* act 2 — not every deal is worth winning */
  "bet:four": { as: "Four people on the bid", where: "Act 2 · How much do we bet?" },
  "study:paid": { as: "A paid study", where: "Act 2 · How much do we bet?" },
  "study:free": { as: "A free study", where: "Act 2 · How much do we bet?" },
  "inside:orion": { as: "We’ve seen inside Orion", where: "Act 2 · How much do we bet?" },
  "bid:shops": { as: "We’re chasing the screens deal", where: "Act 2 · The rival’s demo" },
  "bid:after_sale": { as: "We’re chasing our own deal", where: "Act 2 · The rival’s demo" },
  "showed:figures": { as: "Sarah has seen the cost", where: "Act 2 · The rival’s demo" },
  "showed:visit": { as: "Sarah has seen our work", where: "Act 2 · The rival’s demo" },
  "problem:after_sale": { as: "The bid is about after the sale", where: "Act 2 · The rival’s demo" },
  "problem:shops": { as: "The bid is about the shops", where: "Act 2 · The rival’s demo", liability: true },

  /* act 3 — trade, don't give */
  "promise:screens": { as: "Screens and an app, by month five", where: "Act 3 · Build the offer", liability: true },
  "promise:app": { as: "A new app, by month five", where: "Act 3 · Build the offer", liability: true },
  "promise:refunds": { as: "Refunds in five days, by month five", where: "Act 3 · Build the offer", liability: true },
  "promise:trial": { as: "A ten-shop trial by week eight", where: "Act 3 · Build the offer", liability: true },
  "promise:fixed": { as: "The price won’t change", where: "Act 3 · Build the offer", liability: true },
  "promise:results": { as: "Complaints down a fifth by month five", where: "Act 3 · Build the offer", liability: true },
  "discount:half": { as: "£300,000 off our price", where: "Act 3 · The price push", liability: true },
  "discount:full": { as: "£600,000 off our price", where: "Act 3 · The price push", liability: true },
  "dropped:trial": { as: "The trial, traded away", where: "Act 3 · The price push" },
  "dropped:shops": { as: "100 shops, not 210", where: "Act 3 · The price push" },
  "got:second_year": { as: "A second year, signed", where: "Act 3 · The price push" },
  "got:ops_lead": { as: "Marcus’s manager on our team", where: "Act 3 · The price push" },
  "award:won": { as: "Orion chose us", where: "Act 3 · The price push" },
  "award:lost": { as: "Orion chose the rival", where: "Act 3 · The price push" },
  "declan:sore": { as: "Declan didn’t want us", where: "Act 3 · The price push", liability: true },

  /* act 4 — promise only what your team can deliver */
  "promise:late_fee": { as: "£20,000 a week if we’re late", where: "Act 4 · Sign or walk", liability: true },
  "dates:moved": { as: "Every date a month later", where: "Act 4 · Sign or walk" },
  signed: { as: "A signed contract", where: "Act 4 · Sign or walk" },
  walked: { as: "We walked away", where: "Act 4 · Sign or walk" },
  "told:sarah": { as: "Sarah heard it from us", where: "Act 4 · Month five" },
  "kept:quiet": { as: "Sarah wasn’t told", where: "Act 4 · Month five", liability: true },
  "team:weekends": { as: "The team on weekends", where: "Act 4 · Month five" },
  "team:extra": { as: "Two contractors, at our cost", where: "Act 4 · Month five" },
  "team:orion_pays": { as: "Orion pays for the extra weeks", where: "Act 4 · Month five" },
  "promise:broken": { as: "A promise broken", where: "Act 4 · Every promise comes due", liability: true },
};
