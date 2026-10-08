/**
 * The system views (D-091): how each act pictures the deal as a system, and the medium a lever
 * decision is played in (`STRATEGY.md` §4 and §5, `LEVERS.md`).
 *
 * Presentation content only. Nothing here decides an outcome: these maps say which flags make a
 * face turn green or red, which cards sit on which side of the scales, and what the labels say.
 * Every flag named here is one the eight-decision script sets (`STORY-V2.md`); a flag nobody
 * sets simply never lights anything, which is the safe failure for a picture.
 *
 * It lives in its own file rather than in `presentation.ts` and `interface.ts` because it is one
 * family of pictures, and keeping it together keeps those two files about the story and the frame.
 */
import type { CharacterId } from "./characters";

/** The four mediums a lever panel takes, one per act. They share one accessible structure. */
export type LeverMedium = "research" | "staffing" | "contract" | "calendar";

/** By mission id, as the script names them. Anything not listed takes its act's medium. */
export const LEVER_MEDIUM: Readonly<Record<string, LeverMedium>> = {
  d1: "research", d2: "research",
  d3: "staffing", d4: "staffing",
  d5: "contract", d6: "contract",
  d7: "calendar", d8: "calendar",
};
const BY_ACT: Readonly<Record<number, LeverMedium>> = { 1: "research", 2: "staffing", 3: "contract", 4: "calendar", 5: "calendar" };
export const leverMediumOf = (missionId: string, chapter: number): LeverMedium =>
  LEVER_MEDIUM[missionId] ?? BY_ACT[chapter] ?? "research";

/** Which picture of the system the trail shows beside your hand, by act. */
export type SystemView = "people" | "scales" | "calendar";
export const SYSTEM_VIEW: Readonly<Record<number, SystemView>> = { 1: "people", 2: "people", 3: "scales", 4: "calendar", 5: "calendar" };

/**
 * Orion's people, as the act 1 and 2 map shows them.
 *
 * - `known` empty means known from the start: Sarah sends the brief.
 * - Until a `known` flag is held, the face is greyed and the name withheld. Marcus Reed must not
 *   introduce himself to a player who never went looking (the same rule as `Mission.quotes`).
 * - `against` outranks `onside`: a buyer you met and then overruled is sore, not on side.
 * - `part` is who they are in any deal: who pays, who decides, who has to live with it.
 */
export interface Person {
  id: CharacterId; name: string; role: string; part: string;
  known: readonly string[]; onside: readonly string[]; against: readonly string[];
}
export const PEOPLE: readonly Person[] = [
  { id: "sarah", name: "Sarah Lim", role: "Holds the budget", part: "Who pays", known: [], onside: ["sarah:trusts"], against: ["sarah:doubts"] },
  { id: "declan", name: "Declan Foyle", role: "Buys for Orion and scores the bids", part: "Who decides", known: ["clue:declan", "met:declan"], onside: ["met:declan"], against: ["declan:sore"] },
  { id: "marcus", name: "Marcus Reed", role: "Runs deliveries, refunds and the helpline", part: "Who has to live with it", known: ["clue:marcus", "met:marcus"], onside: ["met:marcus", "got:ops_lead"], against: [] },
];

/**
 * The act 3 scales, by flag prefix. A cut in price is what we give. What a cut can buy back is
 * less work (a dropped part of the offer) or something Orion signs up to (`got:*`): the script's
 * price decision counts both as "something in return", so both sit on that side.
 */
export const SCALES = { gave: ["discount:"], got: ["got:", "dropped:"] } as const;

/** Every word the system views say. British English; nothing below reads as advice. */
export const VIEWS = {
  levers: {
    kicker: "Set one option on each lever",
    keys: "Arrows change a setting · number keys pick a lever · Enter commits",
    lever: "Lever",
    notSet: "not set yet",
    moves: "Moves",
    up: "up",
    down: "down",
    still: "Moves no bar on its own",
    adds: "Adds",
    owes: "Promise",
    costs: "Costs",
    closedBy: "Closed because you hold",
    earlier: "an earlier commitment",
    held: "On the calendar",
    medium: { research: "Research board", staffing: "Staffing board", contract: "Our offer to Orion", calendar: "Delivery calendar" },
    clause: "Clause",
  },
  map: {
    kicker: "How this act worked",
    lead: "Each line runs from a cause to what it changed.",
    earlier: "Earlier",
    earlierNote: "Cards from before that mattered here",
    now: "This act",
    nowNote: "What you decided",
    later: "Later",
    laterNote: "Where this act’s cards matter next",
    from: "From",
    usedIn: "Used in",
    chose: "You chose",
    noneEarlier: "Nothing from earlier decided this act. It turned on what you chose here.",
    noneLater: "Nothing this act gave you is read again on this path.",
    notAgain: "Not needed again on this path",
    guess: "Guess first: which of this act’s choices will come back later?",
    guessNote: "Not scored. Guessing before you look helps it stick.",
    skip: "Skip and show me",
    yourGuess: "Your guess",
    youGuessed: "You guessed",
    next: "See what the act decided",
    connect: "See how it all connects",
    guessFirst: "Answer the question first",
  },
  people: {
    title: "Orion’s people",
    unknown: "Not found yet",
    known: "Known, not yet on side",
    onside: "On side",
    against: "Doubtful",
    because: "Because",
  },
  scales: {
    title: "What we gave and what we got back",
    gave: "We gave",
    got: "We got back",
    empty: "Nothing traded yet.",
    none: "Nothing yet",
    moreGiven: "We have given more than we got back.",
    moreGot: "We have got back more than we gave.",
    even: "Each thing we gave bought something back.",
  },
  calendar: {
    title: "The promise calendar",
    empty: "No promises yet. Every promise you make to win the work will be pinned here on the month it falls due.",
    undated: "No date yet",
    status: { kept: "Kept", late: "Late, agreed", broken: "Broken", void: "Traded away" },
    playTitle: "Every promise comes due",
    playLead: "The calendar plays out, one promise at a time. Each line names what decided it.",
    open: "Still due",
  },
  chart: {
    kicker: "The deal on one chart",
    lead: "Win, Worth and Deliver after every decision. Below, each promise from where you made it to where it came due.",
    decision: "Decision",
    start: "Start",
    made: "Made at decision",
    due: "Came due",
    dueZone: "Promises come due",
    promises: "Your promises",
    table: "The three bars after each decision",
  },
} as const;
