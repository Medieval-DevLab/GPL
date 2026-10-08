/**
 * Quick checks (D-089): one ten-second question after each decision, on the journey map.
 *
 * Low-stakes retrieval between decisions is among the strongest learning effects measured (the
 * testing effect: Roediger & Karpicke 2006; Adesope et al. 2017). It also lowers the stakes: the
 * player rehearses an idea in a question that costs nothing before a decision that does.
 *
 * Rules:
 * - Never graded, never stored, never changes the deal.
 * - Always skippable.
 * - Answering shows right or not, and why, at once (elaborated feedback: Van der Kleij et al.
 *   2015).
 * - Each check is about the idea or the world, never about which setting would have won, so it
 *   cannot leak an outcome.
 *
 * Keyed by the decision just made. Three formats, kept deliberately simple.
 */
export type CheckKind = "truefalse" | "bar" | "pick";
export interface QuickCheck {
  kind: CheckKind;
  prompt: string;
  /** truefalse: ["True", "False"]; bar: the three bars; pick: two or three plain options */
  options: readonly string[];
  answer: number;
  why: string;
}

const BARS = ["Win", "Worth", "Deliver"] as const;
const TF = ["True", "False"] as const;

export const CHECKS: Readonly<Record<string, QuickCheck>> = {
  d1: {
    kind: "truefalse",
    prompt: "Most of Orion’s customer complaints are about the shops.",
    options: TF, answer: 1,
    why: "Most are about what happens after people buy: late deliveries, slow refunds and a helpline that cannot see the order.",
  },
  d2: {
    kind: "pick",
    prompt: "What makes a client like Sarah trust one firm over another?",
    options: ["The firm that offers the most", "The firm that shows it understands her business, and what that rests on", "The cheapest firm"],
    answer: 1,
    why: "Understand before you offer. Clients choose the team that understood their problem.",
  },
  d3: {
    kind: "bar",
    prompt: "Our people spend weeks on a client who has not agreed to pay anything. Which bar falls?",
    options: BARS, answer: 1,
    why: "Time spent chasing work nobody has agreed to pay for is money the firm does not get back.",
  },
  d4: {
    kind: "truefalse",
    prompt: "When a rival shows something impressive, the best answer is to copy it.",
    options: TF, answer: 1,
    why: "You can answer on your own ground: the problem the rival’s demo does not touch.",
  },
  d5: {
    kind: "pick",
    prompt: "Which of these is a promise someone on our team will have to keep?",
    options: ["“We understand your customers.”", "“A ten-shop trial by week eight.”", "“We are excited to work with you.”"],
    answer: 1,
    why: "A date and a thing to deliver is a promise. It goes on the delivery calendar.",
  },
  d6: {
    kind: "pick",
    prompt: "Orion’s buyer asks for £200,000 off. What does “trade, don’t give” mean here?",
    options: ["Agree, to keep him happy", "Agree only if we get something back, such as fewer shops or a longer contract", "Refuse to talk about price"],
    answer: 1,
    why: "A discount is a cost. Get something back for it, or price it in.",
  },
  d7: {
    kind: "truefalse",
    prompt: "Walking away from a deal the client is ready to sign is always a failure.",
    options: TF, answer: 1,
    why: "If it will not pay or cannot be delivered, walking away protects the firm and its word.",
  },
  d8: {
    kind: "bar",
    prompt: "We promised refunds in five days, and our team cannot do it in time. Which bar falls?",
    options: BARS, answer: 2,
    why: "That bar measures whether our people can really do what we promised.",
  },
};

export const CHECK_COPY = {
  kicker: "Quick check",
  lead: "Ten seconds, no score.",
  kinds: { truefalse: "True or false?", bar: "Which bar?", pick: "Pick one" },
  right: "Right.",
  notQuite: "Not quite.",
  answerWas: "The answer:",
  skip: "Skip",
} as const;
