export const EARNED: Record<string, { as: string; where: string }> = {
  /* chapter 0 — the starting advantage */
  "start:connector": { as: "A warm introduction", where: "Chapter 0 · Your team's strength" },
  "start:builder": { as: "Comparable work already delivered", where: "Chapter 0 · Your team's strength" },
  "start:challenger": { as: "A challenger's licence to reframe", where: "Chapter 0 · Your team's strength" },

  /* chapter 1 — find the right client */
  "client:northwind": { as: "A smaller client you can reach", where: "Chapter 1 · Choose a client" },
  late_start: { as: "A late start on a live pursuit", where: "Chapter 1 · Choose a client" },
  spent_effort: { as: "Pursuit effort already spent", where: "Chapter 1 · Choose a client" },
  "knows:real_pain": { as: "Their complaint data", where: "Chapter 1 · Learn what matters" },
  "knows:ops_constraint": { as: "Who owns the systems", where: "Chapter 1 · Learn what matters" },
  "knows:rivals": { as: "Who else is bidding", where: "Chapter 1 · Learn what matters" },
  "knows:budget": { as: "The budget and the deadline", where: "Chapter 1 · Learn what matters" },
  "knows:history": { as: "The programme they cancelled", where: "Chapter 1 · Learn what matters" },
  credibility: { as: "Proof you have done this before", where: "Chapter 1 · Get in the room" },
  learned_late: { as: "The constraint, found late", where: "Chapter 1 · Get in the room" },

  /* chapter 2 — make it an opportunity */
  has_access: { as: "Access to the people who decide", where: "Chapter 2 · Qualify the lead" },
  landed_small: { as: "A small piece of work landed", where: "Chapter 2 · Qualify the lead" },
  reframed: { as: "The problem, reframed", where: "Chapter 2 · Answer the market" },
  "knows:rival_gap": { as: "The gap in the rival's offer", where: "Chapter 2 · Answer the market" },
  ops_engaged: { as: "Operations in the room early", where: "Chapter 2 · Prioritise the work" },
  "has:data": { as: "Their data, checked", where: "Chapter 2 · Prioritise the work" },

  /* chapter 3 — build the response */
  evidenced: { as: "Their own evidence, in the room", where: "Chapter 3 · Define the problem" },
  "scope:postpurchase": { as: "A proposal about what happens after the sale", where: "Chapter 3 · Define the problem" },
  "scope:storefront": { as: "A proposal about the storefront", where: "Chapter 3 · Define the problem" },
  "scope:diagnostic": { as: "A short diagnostic first", where: "Chapter 3 · Define the problem" },
  outcome_based: { as: "A fee tied to the outcome", where: "Chapter 3 · Find another way" },
  reused_asset: { as: "An asset you already own", where: "Chapter 3 · Find another way" },
  conventional: { as: "A conventional shape of deal", where: "Chapter 3 · Find another way" },
  "has:partner": { as: "A partner alongside you", where: "Chapter 3 · Find another way" },
  ops_onside: { as: "Operations on side", where: "Chapter 3 · Assemble the offer" },
  "has:ops_workstream": { as: "An Operations workstream", where: "Chapter 3 · Assemble the offer" },
  "has:training": { as: "Training and adoption", where: "Chapter 3 · Assemble the offer" },
  "has:journey": { as: "The customer journey mapped", where: "Chapter 3 · Assemble the offer" },
  "promised:fast": { as: "An eight-week pilot", where: "Chapter 3 · Assemble the offer" },
  "scope:heavy": { as: "A heavy programme", where: "Chapter 3 · Assemble the offer" },
  unanchored: { as: "A proposal with no route to production", where: "Chapter 3 · Assemble the offer" },
  fragile_timeline: { as: "A timeline that assumes the data is usable", where: "Chapter 3 · Assemble the offer" },
  reviewed: { as: "A review that cleared it", where: "Chapter 3 · Clear the review" },
  overrode_review: { as: "A review you overrode", where: "Chapter 3 · Clear the review" },

  /* chapter 4 — make the deal work */
  descoped: { as: "Scope taken out to hold the price", where: "Chapter 4 · Handle the price" },
  discounted: { as: "A discount given", where: "Chapter 4 · Handle the price" },
  risk_accepted: { as: "A risk accepted in writing", where: "Chapter 4 · Face the risk review" },
  thin_mitigation: { as: "A thinner mitigation than the review asked for", where: "Chapter 4 · Face the risk review" },
  "knows:criteria": { as: "How the bid is being scored", where: "Chapter 4 · Win the decision" },
  won: { as: "The award", where: "Chapter 4 · Win the decision" },
  lost: { as: "A pursuit lost at the award", where: "Chapter 4 · Win the decision" },
  signed: { as: "A signed contract", where: "Chapter 4 · Take it or leave it" },
  walked_away: { as: "A deal you walked away from", where: "Chapter 4 · Take it or leave it" },

  /* chapter 5 — deliver the promise */
  changed_scope: { as: "Scope changed in delivery", where: "Chapter 5 · Month five" },
  crunched: { as: "A team asked to absorb it", where: "Chapter 5 · Month five" },
  undisclosed: { as: "Something the client was not told", where: "Chapter 5 · Month five" },
  broad_base: { as: "More than one person who knows the client", where: "Chapter 5 · The unexpected" },
};
