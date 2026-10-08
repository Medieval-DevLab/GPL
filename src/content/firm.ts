/**
 * Northgate: the firm the player works for, introduced before the story starts.
 *
 * Written for someone who has never sold anything, bought consulting or read a proposal.
 * The setup screen is three short panels: who we are and who you will work with; how one
 * deal moves and what the three bars mean; and the one choice made before the story, with
 * what each choice is good for and what it leaves you short of.
 *
 * Player-facing prose only. The choice itself — titles, descriptions, trade-offs, the flags
 * it grants and the bar it raises — lives in the `setup` node in `story.ts`, and the screen
 * reads those from there so nothing is said twice.
 */
import type { CharacterId } from './characters';
import type { DimensionId } from '../engine/types';

export const FIRM_NAME = 'Northgate';

/** The frame around the three panels: where you are, and the way on. */
export const SETUP_FLOW = {
  label: 'Before you start',
  steps: ['Meet your firm', 'How a deal works', 'Your team’s strength'],
  stepOf: 'Step',
  of: 'of',
  back: 'Back',
  /** One per panel that has a panel after it. */
  next: ['Next: how a deal works', 'Next: your team’s strength'],
  /** The line beside the action, one per panel. */
  bar: [
    'Three short screens, then the story starts.',
    'Keep these three bars in mind. They move with every decision you make.',
    'Whatever your team starts without, you can still earn later. It costs time or money.',
  ],
} as const;

/** Panel 1: who we are, how we make money, your job, and the four people you will meet. */
export const MEET = {
  title: 'Meet your firm.',
  lede: 'You work at Northgate, a small consultancy. Companies pay us to fix how they serve their customers.',
  money: {
    title: 'How Northgate makes money',
    flow: ['Win a contract', 'Do the work', 'Keep what’s left'],
    fee: 'What the client pays us',
    people: 'Paying our people',
    keep: 'What we keep',
    note: 'Most of the fee pays for our people’s time. What is left over is what Northgate keeps.',
  },
  job: {
    title: 'Your job',
    body: 'You lead a team of six. You decide which client to chase, what to promise and what to charge.',
    team: 'Your team of six',
    size: 6,
  },
  /** Above the stakes line, which is the story's own (`STORY.stakes`). */
  catch: 'The catch',
  people: {
    title: 'The four people you will work with',
    note: 'Each of them is with you for part of the story.',
    with: 'With you in',
    act: 'Act',
    acts: 'Acts',
    and: 'and',
  },
} as const;

/** One plain line each. Names and job titles come from `characters.ts`. */
export const COLLEAGUES: readonly { id: CharacterId; line: string }[] = [
  { id: 'priya', line: 'Finds new clients for Northgate.' },
  { id: 'riya', line: 'Your boss. She controls the team’s time and money.' },
  { id: 'arjun', line: 'Designs what we sell.' },
  { id: 'aisha', line: 'Runs the work once a client signs. Your promises become her job.' },
];

/** Panel 2: the five stages, the three bars, and the trade at the heart of every decision. */
export const DEAL = {
  title: 'How a deal works.',
  lede: 'Every deal moves through the same five stages. The story follows one deal through all of them.',
  act: 'Act',
  with: 'With',
  stages: [
    { name: 'Find a client', line: 'Pick a company that needs help, and get a first meeting.' },
    { name: 'Is it worth chasing?', line: 'Decide how much of your team’s time it deserves.' },
    { name: 'Write the proposal', line: 'Set out in writing what we will do, and how.' },
    { name: 'Agree the deal', line: 'Settle the price and the terms, then decide whether to sign.' },
    { name: 'Do the work', line: 'Keep the promises you made to win.' },
  ],
  bars: {
    title: 'The three bars you will watch',
    note: 'They sit at the top of the screen once the story starts.',
    example: 'For example:',
    items: {
      win: {
        meaning: 'How likely the client is to choose us.',
        example: 'show them a shop where our work already helped, and Win goes up.',
      },
      profit: {
        meaning: 'Whether the deal makes Northgate money.',
        example: 'cut the price to close faster, and Worth goes down.',
      },
      deliver: {
        meaning: 'Whether our people can really do what we promised.',
        example: 'promise results in eight weeks without checking their records, and Deliver goes down.',
      },
    } satisfies Record<DimensionId, { meaning: string; example: string }>,
  },
  trade: {
    title: 'Every decision is a trade',
    up: 'goes up',
    down: 'goes down',
    pairs: [
      { lever: 'Promise more', up: 'win', down: 'deliver', line: 'The client is keener, but our people have more to do.' },
      { lever: 'Charge less', up: 'win', down: 'profit', line: 'The client is keener, but the deal earns us less.' },
    ] satisfies readonly { lever: string; up: DimensionId; down: DimensionId; line: string }[],
    close: 'Nearly every decision moves one bar up and another one down.',
  },
} as const;

/** Panel 3: the starting strength. The options themselves are the `setup` node's. */
export const STRENGTH = {
  title: 'Build your team’s strength.',
  lede: 'Every team is strong at one thing and short of another. Pick what yours is good at. It stays true for the whole story.',
  goodAt: 'Good at',
  raises: 'Raises at the start',
  later: 'Makes easier later',
  short: 'Leaves you short of',
  choose: 'Choose',
  chosen: 'chosen',
} as const;

/**
 * Real moments later in the story where each starting strength helps. Every line is backed
 * by a condition in `story.ts` that reads a flag the choice grants; if that condition goes,
 * the line must go with it. None of them says the choice is the best one — each strength
 * helps in different places, and each leaves you short of what the other two have.
 *
 *   s-connector  `credibility`   m4-pursue-good (act 2), o-criteria `requires` (act 4)
 *   s-builder    `has:data`      m6b-outcome-measurable (act 3), m10h-date-founded (act 5)
 *   s-challenger `knows:rivals`  m5-inv-known (act 2), m6b-partner-fit (act 3)
 */
export const STRENGTH_LATER: Readonly<Record<string, readonly { act: number; text: string }[]>> = {
  's-connector': [
    { act: 2, text: 'Sending a full proposal early is less of a gamble, because Orion trusts you.' },
    { act: 4, text: 'You can ask Orion’s buyer how bids are scored, because Orion trusts you.' },
  ],
  's-builder': [
    { act: 3, text: 'You can offer to be paid partly on results, because you can measure them.' },
    { act: 5, text: 'You can stand behind a quick deadline, because you can show what it rests on.' },
  ],
  's-challenger': [
    { act: 2, text: 'When a rival firm makes a big announcement, you already know who they are.' },
    { act: 3, text: 'Teaming up with a specialist firm makes sense, because you know who is good.' },
  ],
};
