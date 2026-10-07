# Working in this repository

GPL is a short single-player learning game. Read `README.md` for what it is and
`docs/DESIGN-RULES.md` for the rules that govern content and code. Both are short.

## Before you change anything

- **Content lives in `src/content/story.ts`.** Adding or editing a mission must never require
  touching `src/engine`. If it does, the engine is missing a capability — add it deliberately.
- **`src/engine` is pure.** No React, no DOM, no `Date.now`, no `Math.random`, no `fetch`.
- **`src/ui` holds no game rules.** Components render state and dispatch actions. A component
  that computes a consequence or decides a branch is a bug.

## Before you say you are done

```bash
npm run typecheck
npm test                       # engine, content validity, pedagogy, exhaustive sweep
npm run dev                    # in one terminal…
npm run verify                 # …then this, in another
```

`npm run verify` plays a complete run in a real browser and screenshots all 31 beats.
**It is not optional.** Typecheck and tests were both green while the primary button was
rendering dark text on a purple background; only the screenshot caught it. See `D-010` in
`docs/DECISIONS.md`.

## Things the tests will catch, so do not argue with them

- An option that beats a sibling on all three dimensions in every case is a **fake choice**
  and fails the build. Fix it by giving the weaker option a genuine compensating upside, not
  by nerfing the strong one.
- A condition reading a flag that nothing sets fails the build. This is otherwise a silent
  failure that just quietly stops the game teaching.
- Every outcome list must end with an unconditional fallback.
- Every mission needs a `lesson`, so the objective lands on whichever branch is taken.
- `commits` text may describe cost. It may never predict the outcome.

## Conventions

- Record non-obvious decisions in `docs/DECISIONS.md`, newest first, including what the
  decision cost and whether it is reversible.
- Player-facing prose lives in content, never as string literals in components.
- British English throughout, in both copy and code comments.
- No new runtime dependency without a line explaining why the problem is not already solved
  in-repo. `node tools/size.mjs` holds the bundle to a budget **per origin** — framework 70 kB
  gzipped, interface 27, engine 12, stylesheet 18 (re-split in `D-077`). **Content is measured and never capped**,
  because a budget on the writing is a budget on how much the game can teach.
  This replaced a single 94 kB figure that had been red for a long time while pointing at the
  wrong thing: React alone is ~65 kB, so two thirds of the old budget was spent before any of
  this code ran, and "82% over" sent readers to refactor components that were never the
  problem. See `D-070`. Run it after a `--sourcemap` build to get the split.
