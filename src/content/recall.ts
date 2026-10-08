/**
 * Recall on return (D-088). When a player comes back to a saved run, the welcome screen offers
 * one question for each act they have finished: answer it in your head, then reveal. Retrieving
 * what you learned strengthens it more than reading it again (Roediger & Karpicke 2006), and
 * the evidence favours playing in two sittings (Clark et al. 2016). It is optional and
 * unscored, and nothing is stored.
 *
 * Keyed by the act just finished. The answers are the act's idea, in its own words.
 */
export const RECALL: Readonly<Record<number, { question: string; answer: string }>> = {
  1: {
    question: "What did Sarah’s trust in us depend on?",
    answer: "What we knew about her business, and whether she could see what it rested on. Understand before you offer.",
  },
  2: {
    question: "When is walking away from a deal a good decision?",
    answer: "When it will not pay, or your team cannot deliver it. Not every deal is worth winning.",
  },
  3: {
    question: "You give the client a discount or something extra. What should you do in the same breath?",
    answer: "Get something back for it, or price it in. Trade, don’t give.",
  },
  4: {
    question: "Before you promise a client a date, who should you check it with?",
    answer: "The people who will have to deliver it. Promise only what your team can deliver.",
  },
};

export const RECALL_COPY = {
  open: "Warm up: what do you remember?",
  lead: "Answer in your head first, then check.",
  show: "Show the answer",
  next: "Next question",
  finish: "Done",
  done: "Ready when you are.",
  of: "of",
} as const;
