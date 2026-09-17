/**
 * Browser verification.
 *
 * Typecheck and unit tests cannot tell you whether a screen renders, whether a button is
 * reachable, or whether a human can finish the game. This plays complete runs in a real
 * browser, screenshots every beat, and fails on any console error.
 *
 * It also enforces the console rule: at desktop width the working area must not overflow.
 * "A mission fits one screen" is the property that separates this from a form, so it is
 * checked mechanically rather than left to judgement.
 *
 *   node tools/verify.mjs                 # against http://localhost:5173
 *   node tools/verify.mjs http://host     # against anything else
 *   GPL_VIEWPORT=390x844 node tools/...   # phone pass
 *   node tools/verify.mjs --all-paths     # three policies, not one (see below)
 *   GPL_PATHS=all node tools/verify.mjs   # same, for CI
 */

import { chromium } from "playwright";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:5173";
/**
 * A deadlock stop, not an expectation of run length.
 *
 * At 90 it was quietly asserting "no more than about sixteen missions": a run needs four
 * or five steps per mission, so the seventeenth (m9a) walked the whole game, reached the
 * last consequence, and then ran out of budget one click from the ending — reported as
 * "the run never reached the ending", which is a true statement about the harness and a
 * false one about the game. Generous, because the only thing it protects against is an
 * unrecognised screen, and the loop already reports that case itself.
 */
const MAX_STEPS = 240;
const ALL_PATHS = process.argv.includes("--all-paths") || process.env.GPL_PATHS === "all";

const [vw, vh] = (process.env.GPL_VIEWPORT ?? "1440x900").split("x").map(Number);
const VIEWPORT = { width: vw || 1440, height: vh || 900 };
const DESKTOP = VIEWPORT.width >= 1024;
/**
 * "A mission fits one screen" is only enforced at the reference height.
 *
 * The mockups are drawn for a 1536x1024 window; their densest briefing needs ~835px of
 * working area. At 1440x900 we have ~745px, so matching their type and image scale and
 * fitting 900px are mutually exclusive. We chose their scale: the fit rule is enforced at
 * >=1000px tall, and below that the working area is allowed to scroll inside the console
 * — the chrome still never moves. See docs/DECISIONS.md D-024.
 */
const FIT_MIN_HEIGHT = 1000;
const ENFORCE_FIT = DESKTOP && VIEWPORT.height >= FIT_MIN_HEIGHT;
const SHOTS = path.resolve(
  VIEWPORT.width === 1440 ? "docs/screenshots" : `docs/screenshots-${VIEWPORT.width}`,
);

/**
 * THE PATHS — one run is not a verification of a branching game.
 *
 * D-040 closed by naming this as the outstanding gap: the harness played exactly one
 * path, so 15 of 16 missions' alternative branches had never been rendered in a browser
 * at all, and path-dependent overflow was invisible. A reviewer measured the ending
 * overflowing by 1,867px on their run while the harness measured it at 739-in-739 on its
 * own. Both numbers were right. Only one was being looked at.
 *
 * So there are three policies. They are deliberately crude — first, last, and middle
 * option — because the purpose is not to play well, it is to render different outcomes,
 * and an option-index policy is deterministic, needs no knowledge of content, and cannot
 * drift when content changes. Each also predicts a different meter, which is the only way
 * the other two prediction chips have ever been clicked in a browser.
 *
 * `first` stays the default and stays fully screenshotted, so `npm run verify` costs
 * exactly what it did before. The other two run on `--all-paths` and screenshot only what
 * fails or what they are the first to render — a shot of an identical screen proves
 * nothing and costs a second.
 */
const POLICIES = [
  {
    id: "first",
    label: "first option",
    predict: "Deliverability",
    /** Click order over n options: the harness's original behaviour. */
    order: (n) => [...Array(n).keys()],
    shotAll: true,
  },
  {
    id: "last",
    label: "last option",
    predict: "Winability",
    order: (n) => [...Array(n).keys()].reverse(),
    shotAll: false,
  },
  {
    id: "middle",
    label: "middle option",
    predict: "Profitability",
    /** Outward from the middle, so multi-select missions still reach their slot count. */
    order: (n) => {
      const out = [];
      const m = Math.floor((n - 1) / 2);
      for (let d = 0; d < n; d++) {
        if (m + d < n) out.push(m + d);
        if (d > 0 && m - d >= 0) out.push(m - d);
      }
      return out;
    },
    shotAll: false,
  },
];

const problems = [];
/* Fit overruns measured below the enforcement height: reported, not fatal. */
const overflows = [];
let shotIndex = 0;
/** Mission headings any path has already rendered, so later paths only shoot new ground. */
const seenHeadings = new Set();

async function shot(page, name) {
  shotIndex += 1;
  await page.waitForTimeout(400);
  await page
    .evaluate(() => {
      // Infinite animations (the resolving shimmer) never settle, so exclude them or
      // this waits forever.
      const finite = document.getAnimations().filter((a) => {
        const t = a.effect?.getComputedTiming?.();
        return t && t.iterations !== Infinity;
      });
      return Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
    })
    .catch(() => undefined);

  const file = path.join(SHOTS, `${String(shotIndex).padStart(2, "0")}-${name}.png`);
  // Not fullPage: the console owns the viewport and scrolls its own working area, so the
  // viewport IS the screen. Overflow is caught by checkFit instead.
  await page.screenshot({ path: file, fullPage: !DESKTOP });
  console.log(`   📸 ${path.basename(file)}`);
}

/**
 * The console rule, as a test.
 *
 * `ENFORCE_FIT` requires a viewport at least 1000px tall and the default is 900, so for
 * every run of the documented workflow this function returned on its first line. The
 * fits-one-screen rule — which the docstring at the top of this file calls what separates
 * the console from a form — has not been checked by the mandatory gate at all, and screens
 * do overflow at 1440×900: a decide screen by 26px, a consequence by 64–113px depending on
 * the path, and the ending by 1,967–2,782px depending on the path. A gate that skips itself
 * is worse than no gate, because it reports green.
 *
 * So the measurement now always runs. Below the enforcement height it reports rather than
 * fails, because the rule is authored for a taller screen and turning the default run red
 * would just get this flag flipped back. The numbers being visible is the point.
 */
async function checkFit(page, where) {
  const fit = await page.evaluate(() => {
    const el = document.querySelector("[data-work-area]");
    if (!el) return null;
    return { scroll: el.scrollHeight, client: el.clientHeight };
  });
  if (!fit) {
    problems.push(`${where}: no [data-work-area] — the console shell is missing`);
    return;
  }
  const over = fit.scroll - fit.client;
  if (over > 4) {
    const note =
      `${where}: working area overflows by ${over}px (${fit.scroll} in ${fit.client}). ` +
      `A mission must fit one screen — see docs/UI-AUDIT.md F1.`;
    if (ENFORCE_FIT) problems.push(note);
    else overflows.push(note);
  }
}

/** Is a button with this exact accessible name present and enabled? */
async function button(page, name) {
  const b = page.getByRole("button", { name, exact: true });
  if ((await b.count()) === 0) return null;
  const first = b.first();
  return (await first.isVisible()) ? first : null;
}

/**
 * What the game says about its own shape, read off the mission rail.
 *
 * The counts used to be literals — 16 missions, 16 briefs, 16 consequences, 5 interludes
 * — and a single content change (m9a, backlog 1.1) turned the mandatory gate red with
 * three false problems, which is the fastest way to teach a team to ignore it. Reading
 * "Mission 3 of 17" and "Chapter 2" out of the rail costs one evaluate and makes the
 * expectation the content's own.
 *
 * It is also a stronger check than importing `missionOrder` would be, and the reason is
 * worth stating: this compares the total the PLAYER is shown against the number of beats
 * the game actually delivers. An import would take both numbers from the same place and
 * could never disagree with itself.
 */
async function readRail(page) {
  return page.evaluate(() => {
    const text = document.body.innerText ?? "";
    const m = /Mission\s+(\d+)\s+of\s+(\d+)/.exec(text);
    const c = /Chapter\s+(\d+)/.exec(text);
    return {
      mission: m ? +m[1] : null,
      total: m ? +m[2] : null,
      chapter: c ? +c[1] : null,
    };
  });
}

/**
 * Play one complete run under one policy.
 *
 * Each path gets a fresh context, because the game persists to `localStorage`
 * (`gpl.save.v3`) and a second run in the same context would resume the first.
 */
async function runPath(browser, policy) {
  const tag = (s) => (policy.id === "first" ? s : `[${policy.id}] ${s}`);
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  page.on("console", (m) => {
    if (m.type() === "error") problems.push(tag(`console error: ${m.text()}`));
  });
  page.on("pageerror", (e) => problems.push(tag(`page error: ${e.message}`)));
  page.on("requestfailed", (r) => {
    if (r.url().startsWith(BASE)) problems.push(tag(`request failed: ${r.url()}`));
  });

  const run = {
    missions: 0,
    briefs: 0,
    consequences: 0,
    interludes: 0,
    openers: 0,
    rewards: 0,
    debriefs: 0,
    reflections: 0,
    total: null,
    chapters: new Set(),
    routedToEnding: false,
    reachedEnding: false,
  };
  /**
   * Screenshot rule for the alternative paths: only what failed, or what this path is the
   * first to render. A second picture of an identical screen proves nothing and costs a
   * second — and at three paths × 40 beats, pictures are most of the runtime.
   */
  const marker = () => problems.length + overflows.length;
  const shotIf = async (name, since, isNew) => {
    if (marker() !== since || isNew) await shot(page, name);
  };

  console.log(`\n▶ ${BASE} at ${VIEWPORT.width}×${VIEWPORT.height} — path: ${policy.label}\n`);
  await page.goto(BASE, { waitUntil: "networkidle" });

  await page.waitForSelector("h1");
  const title = (await page.locator("h1").first().innerText()).trim();
  if (title !== "GPL") problems.push(tag(`title screen h1 was "${title}", expected "GPL"`));
  if (policy.shotAll) await shot(page, "title");

  const begin = (await button(page, "Take the brief")) ?? (await button(page, "Start again"));
  if (!begin) throw new Error("no start button on the title screen");
  await begin.click();

  // Chapter 0 — the starting advantage. Must gate on a pick, like every other beat.
  await page.waitForTimeout(250);
  const start = await button(page, "Start the pursuit");
  if (!start) {
    problems.push(tag("no chapter 0 starting-advantage screen after the title"));
  } else {
    if (await start.isEnabled()) {
      problems.push(tag("chapter 0: the pursuit could start before a team was picked"));
    }
    const teams = page.locator("button.choice");
    const teamCount = await teams.count();
    if (teamCount < 2) problems.push(tag("chapter 0: fewer than two starting advantages"));
    const since = marker();
    await checkFit(page, tag("chapter 0"));
    if (policy.shotAll) await shot(page, "setup");
    else await shotIf(`${policy.id}-setup`, since, false);
    // The starting advantage is itself a branch: each path takes a different team.
    await teams.nth(policy.order(teamCount)[0]).click();
    await page.waitForTimeout(80);
    if (policy.shotAll) await shot(page, "setup-selected");
    if (!(await start.isEnabled())) {
      problems.push(tag("chapter 0: still blocked after picking a team"));
    }
    await start.click();
  }

  /** Consecutive polls with nothing recognised on screen — see the stuck branch below. */
  let misses = 0;
  for (let step = 0; step < MAX_STEPS; step++) {
    /**
     * Dismiss a reward modal before looking for the beat underneath it.
     *
     * The game now interrupts with a badge when one is earned, and the modal takes a
     * focus trap and a full-screen scrim. Without this the harness sat clicking the beat
     * behind the scrim until Playwright timed out — which is not a bug in the game, it is
     * the harness failing to behave like a player. A real one dismisses it and carries on,
     * so counting the interruptions is also a free check that they actually fire.
     */
    const modal = page.locator('[role="dialog"]');
    if ((await modal.count()) > 0 && (await modal.first().isVisible())) {
      run.rewards += 1;
      if (policy.shotAll && run.rewards === 1) await shot(page, "reward-badge");
      const dismiss = modal.first().getByRole("button").first();
      await dismiss.click();
      await page.waitForTimeout(200);
      continue;
    }

    await page.waitForTimeout(150);

    if ((await page.getByText("How it ended", { exact: true }).count()) > 0) {
      await page.waitForTimeout(450);
      run.reachedEnding = true;
      const since = marker();
      await checkFit(page, tag("the ending"));
      if (policy.shotAll) await shot(page, "ending");
      else await shotIf(`${policy.id}-ending`, since, false);
      console.log("\n✓ reached the ending");
      break;
    }

    // ── brief ──────────────────────────────────────────────
    const toOptions = await button(page, "See your options");
    if (toOptions) {
      misses = 0;
      run.briefs += 1;
      const heading = (await page.locator("h1").first().innerText()).trim();
      const rail = await readRail(page);
      if (rail.total) run.total = rail.total;
      if (rail.chapter) run.chapters.add(rail.chapter);
      console.log(`\n── mission ${run.briefs}: ${heading}`);

      // The game shell must be present on every briefing, not just the first.
      for (const required of ["Chapter", "Key factors", "Where you stand"]) {
        if ((await page.getByText(required, { exact: false }).count()) === 0) {
          problems.push(tag(`brief ${run.briefs}: shell is missing "${required}"`));
        }
      }
      // Advice must be attributed to a person, never spoken by the interface.
      if ((await page.getByText("Tip.", { exact: false }).count()) > 0) {
        problems.push(tag(`brief ${run.briefs}: an unattributed "Tip." is on screen`));
      }
      // Reading and choosing are separate beats — the brief must not carry the options.
      if ((await page.locator("button.choice").count()) > 0) {
        problems.push(tag(`brief ${run.briefs}: options are on the brief, which is the beat before`));
      }

      const since = marker();
      await checkFit(page, tag(`brief ${run.briefs} (${heading})`));
      const isNew = !seenHeadings.has(`brief:${heading}`);
      seenHeadings.add(`brief:${heading}`);
      if (policy.shotAll) {
        /**
         * Which briefs get photographed, decided by what is on them.
         *
         * This was `run.briefs <= 3 || run.briefs === 11` — the first three for the
         * onboarding shape, and 11 because that is where the sponsor's pull-quote was the
         * day the list was written. Index 11 is not a property of anything; it is a
         * snapshot of the content order, and the content order has changed twice since,
         * once by inserting a whole beat at m9a. Conditional client dialogue now exists
         * and the brief that carries it is the brief worth looking at, so ask the DOM.
         */
        const hasQuote = (await page.locator("blockquote").count()) > 0;
        if (run.briefs <= 3 || hasQuote) await shot(page, `brief-${run.briefs}`);
      } else {
        await shotIf(`${policy.id}-brief-${run.briefs}`, since, isNew);
      }
      await toOptions.click();
      continue;
    }

    // ── decide ─────────────────────────────────────────────
    const commit = await button(page, "Commit to this");
    if (commit) {
      misses = 0;
      run.missions += 1;
      const heading = (await page.locator("h1").first().innerText()).trim();

      const since = marker();
      await checkFit(page, tag(`mission ${run.missions} (${heading})`));
      const isNew = !seenHeadings.has(`decide:${heading}`);
      seenHeadings.add(`decide:${heading}`);
      if (policy.shotAll) await shot(page, `mission-${run.missions}-decide`);
      else await shotIf(`${policy.id}-mission-${run.missions}-decide`, since, isNew);

      const choices = page.locator("button.choice");
      const count = await choices.count();
      if (count < 2) problems.push(tag(`${heading}: only ${count} choices rendered`));

      // Select in this path's order until the prediction gate becomes available.
      let clicked = 0;
      for (const i of policy.order(count)) {
        if (clicked >= 4) break;
        if ((await page.getByText("will move least?", { exact: false }).count()) > 0) break;
        await choices.nth(i).click();
        clicked += 1;
        await page.waitForTimeout(70);
      }

      // The prediction is the game's "before" — commit must be gated on it.
      if (await commit.isEnabled()) {
        problems.push(tag(`${heading}: Commit was enabled before a prediction was made`));
      }
      // Each path predicts a different meter; fall back so a missing chip is reported as
      // a missing control rather than silently skipping the gate.
      let predict = await button(page, policy.predict);
      if (!predict) {
        for (const alt of ["Deliverability", "Winability", "Profitability"]) {
          predict = predict ?? (await button(page, alt));
        }
      }
      if (!predict) {
        problems.push(tag(`${heading}: no prediction control after selecting`));
        await shot(page, `${policy.id}-stuck-predict-${run.missions}`);
        break;
      }
      await predict.click();
      await page.waitForTimeout(70);

      if (!(await commit.isEnabled())) {
        problems.push(
          tag(`${heading}: Commit never enabled after ${clicked} selections + prediction`),
        );
        break;
      }
      const since2 = marker();
      await checkFit(page, tag(`mission ${run.missions} selected (${heading})`));
      if (policy.shotAll) await shot(page, `mission-${run.missions}-selected`);
      else await shotIf(`${policy.id}-mission-${run.missions}-selected`, since2, false);
      await commit.click();
      continue;
    }

    // ── consequence ────────────────────────────────────────
    // "See how it went" instead of "Next mission" means the game itself has routed to the
    // ending: this consequence is the last beat of the run. That is how a legitimately
    // short path — `m9a`'s losing outcomes end the game at mission 13 — is told apart
    // from a harness that lost its way, and it is also how the last consequence is
    // identified for a screenshot now that "the sixteenth" no longer means the last one.
    const nextMission = await button(page, "Next mission");
    const toEnding = nextMission ? null : await button(page, "See how it went");
    const next = nextMission ?? toEnding;
    if (toEnding) run.routedToEnding = true;
    if (next) {
      misses = 0;
      run.consequences += 1;
      await page.waitForTimeout(650); // let the meters animate

      // The teaching must come from a named person, not from the interface. There used
      // to be a separate unattributed "lesson" screen here; if it ever comes back, or
      // the advisor read goes missing, this catches it.
      const named = await page.evaluate(() => {
        const el = document.querySelector("[data-work-area]");
        return el ? /[A-Z][a-z]+ [A-Z][a-z]+/.test(el.textContent ?? "") : false;
      });
      if (!named) {
        problems.push(tag(`consequence ${run.consequences}: no attributed read on the outcome`));
      }
      if ((await page.getByText("Next time.", { exact: false }).count()) > 0) {
        problems.push(
          tag(`consequence ${run.consequences}: the unattributed "Next time." caption is back`),
        );
      }

      /* Fit is measured on EVERY consequence. It used to be measured on the first two and
         on the sixteenth, which is how a 113px overflow on consequence 2's alternative
         outcomes went unseen — and when content grew to 17 missions, "=== 16" stopped
         being the last one anyway. Measuring is an evaluate; only the screenshot is slow. */
      const since = marker();
      await checkFit(page, tag(`consequence ${run.consequences}`));
      if (policy.shotAll) {
        if (run.consequences <= 2 || run.routedToEnding) {
          await shot(page, `consequence-${run.consequences}`);
        }
      } else {
        await shotIf(`${policy.id}-consequence-${run.consequences}`, since, false);
      }
      await next.click();
      continue;
    }

    /**
     * The chapter debrief — a stage screen with one action, "Back to the map".
     *
     * Counted separately from interludes so the run summary can say whether all five
     * fired. Without this the harness stopped dead at step 25 with "no recognised control
     * on screen": the debriefs were in the graph, rendering correctly, and invisible to
     * the only gate that plays the game.
     */
    const toMap = await button(page, "Back to the map");
    if (toMap) {
      misses = 0;
      run.debriefs += 1;
      if (policy.shotAll && run.debriefs <= 2) await shot(page, `debrief-${run.debriefs}`);
      await checkFit(page, tag(`debrief ${run.debriefs}`));
      await toMap.click();
      continue;
    }

    /**
     * A reflection node. Its responses are authored prose, so there is no fixed label to
     * look for — the screen is identified by its region and any response advances it,
     * because none of them changes state. That is the whole point of the beat.
     */
    const reflection = page.locator('[data-region="reflection"]');
    if ((await reflection.count()) > 0 && (await reflection.first().isVisible())) {
      misses = 0;
      run.reflections += 1;
      if (policy.shotAll && run.reflections <= 2) await shot(page, `reflection-${run.reflections}`);
      await checkFit(page, tag(`reflection ${run.reflections}`));
      const answer = reflection.first().getByRole("button").first();
      if ((await answer.count()) === 0) {
        problems.push(tag(`reflection ${run.reflections}: no response to give`));
        break;
      }
      await answer.click();
      await page.waitForTimeout(200);
      continue;
    }

    // ── interlude ──────────────────────────────────────────
    const begins = await button(page, "Begin the chapter");
    if (begins) {
      misses = 0;
      run.interludes += 1;
      /* Only the openers are one-per-chapter; the three story turns share this screen
         because both are things the player watches. */
      if ((await page.locator('[data-beat="chapter-open"]').count()) > 0) run.openers += 1;
      if (policy.shotAll && run.interludes <= 2) await shot(page, `interlude-${run.interludes}`);
      await begins.click();
      continue;
    }

    // ── resolving ──────────────────────────────────────────
    if ((await page.getByText("Seeing what happens…").count()) > 0) {
      if (policy.shotAll && shotIndex < 6) await shot(page, "resolving");
      await page.waitForTimeout(450);
      misses = 0;
      continue;
    }

    /**
     * A frame with nothing recognisable on it is not the same thing as being stuck.
     *
     * Beats mount in stages — the shimmer text goes before the consequence's primary
     * button arrives — so there is a window of a few hundred milliseconds where every
     * branch above misses. The original single path never landed in that window because
     * it stopped for a 400ms screenshot at almost every beat; the alternative paths
     * screenshot almost nothing, poll faster, and hit it. The first sweep duly reported a
     * "stuck" screen whose screenshot showed a perfectly rendered consequence with its
     * "Next mission" button in plain view, and four cascading assertion failures behind it.
     *
     * So the gate now waits for the screen to settle before calling it stuck: ~3s of
     * nothing, not one unlucky frame. A genuinely dead screen still fails, and a false
     * positive here would be worse than a slow run — it is the kind of noise that gets a
     * mandatory gate switched off.
     */
    misses += 1;
    if (misses < 8) {
      await page.waitForTimeout(350);
      continue;
    }
    problems.push(
      tag(`stuck at step ${step}: no recognised control on screen after ${misses} polls`),
    );
    await shot(page, `${policy.id}-stuck-${step}`);
    break;
  }

  /* ── assertions ─────────────────────────────────────────── */

  /**
   * Every mission renders all three of its beats. This is the invariant that holds on
   * every path regardless of branching, and it is the one worth failing on.
   */
  if (run.briefs !== run.missions || run.consequences !== run.missions) {
    problems.push(
      tag(
        `beats do not line up: ${run.briefs} briefs, ${run.missions} decides, ` +
          `${run.consequences} consequences — every mission needs all three`,
      ),
    );
  }
  if (!run.reachedEnding) problems.push(tag("the run never reached the ending"));

  /**
   * How long the run should be is now the content's business, not this file's. A path may
   * legitimately stop early — `m9a`'s losing outcomes carry `next: "end"`, so a player who
   * arrives at the award decision with nothing to show loses it and never sees delivery.
   * That is the game working. What must not happen is stopping early *without* the game
   * having said so, which is why `routedToEnding` is tracked from the button's own label.
   */
  if (run.total && run.missions > run.total) {
    problems.push(tag(`played ${run.missions} missions but the rail advertises ${run.total}`));
  }
  /**
   * A short run is legitimate exactly when the GAME ended it, and the mechanical proof of
   * that is the ending screen rendering: a harness that has lost its way never gets there.
   *
   * The first version of this looked for the last consequence's button to read "See how it
   * went" instead of "Next mission" — and the last-option path proved that wrong on its
   * first sweep. It loses the award at `m9a`, whose losing outcomes carry `next: "end"`,
   * and the button still says "Next mission" because nothing in the outcome tells the
   * button it is the last one. The run was correct, reached the ending at mission 13 of
   * 17, and was reported as a failure. Hence: `reachedEnding` is the assertion, the
   * button label is only used to pick the final consequence's screenshot, and the short
   * run is printed in the summary so it is visible rather than silently accepted.
   */
  if (run.total && run.missions < run.total && !run.reachedEnding) {
    problems.push(
      tag(`stopped after ${run.missions} of ${run.total} missions without reaching the ending`),
    );
  }
  /* One interlude opens each chapter the run visits. Derived, so adding a chapter does
     not make this file wrong. */
  if (run.chapters.size && run.openers !== run.chapters.size) {
    problems.push(
      tag(
        `saw ${run.openers} chapter openers for ${run.chapters.size} chapters ` +
          `(${[...run.chapters].join(", ")}) — one opens each chapter`,
      ),
    );
  }

  const body = (await page.locator("body").innerText()).toLowerCase();
  for (const t of ["your decisions", "the account", "how it ended"]) {
    if (!body.includes(t)) problems.push(tag(`ending is missing "${t}"`));
  }

  // Every interactive control must have an accessible name.
  const unnamed = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("button, a[href], [role='button']")) {
      const name = (el.getAttribute("aria-label") || el.textContent || "").trim();
      if (!name) out.push(el.outerHTML.slice(0, 90));
    }
    return out;
  });
  for (const u of unnamed) problems.push(tag(`control without an accessible name: ${u}`));

  // Photography must actually load — a broken <img> is invisible in a screenshot.
  const brokenImages = await page.evaluate(() =>
    [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
  );
  for (const src of brokenImages) problems.push(tag(`image failed to decode: ${src}`));

  await context.close();
  return run;
}

async function main() {
  await rm(SHOTS, { recursive: true, force: true });
  await mkdir(SHOTS, { recursive: true });

  const browser = await chromium.launch();
  const paths = ALL_PATHS ? POLICIES : POLICIES.slice(0, 1);
  const runs = [];
  for (const policy of paths) {
    const t0 = Date.now();
    const run = await runPath(browser, policy);
    runs.push({ policy, run, seconds: Math.round((Date.now() - t0) / 1000) });
  }
  await browser.close();

  console.log("");
  for (const { policy, run, seconds } of runs) {
    /* A short run is legitimate only when the game reached its own ending. Saying "ended
       early on a terminal outcome" for a run that simply stopped would be the harness
       explaining away its own failure. */
    const early =
      run.total && run.missions < run.total
        ? run.reachedEnding
          ? " ← ended early on a terminal outcome"
          : " (STOPPED EARLY — see problems)"
        : "";
    console.log(
      `${policy.label.padEnd(14)} missions ${run.missions}/${run.total ?? "?"}${early} · ` +
        `consequences ${run.consequences} · interludes ${run.interludes} · ` +
      `reflections ${run.reflections} · debriefs ${run.debriefs} · rewards ${run.rewards} · ${seconds}s`,
    );
  }
  if (!ALL_PATHS) {
    console.log(
      `\nonly the ${POLICIES[0].label} path ran. --all-paths (or GPL_PATHS=all) also plays ` +
        `${POLICIES.slice(1).map((p) => p.label).join(" and ")}.`,
    );
  }

  /* Overruns below the enforcement height are reported, not fatal — D-040. Printed after
     the summary so they are visible on a green run, which is the only reason they were
     ever found. */
  if (overflows.length) {
    console.log(
      `\n⚠ ${overflows.length} fit overrun(s) below the ${FIT_MIN_HEIGHT}px enforcement height:\n`,
    );
    for (const o of overflows) console.log(`  · ${o}`);
  }

  if (problems.length) {
    console.error(`\n✗ ${problems.length} problem(s):\n`);
    for (const p of problems) console.error(`  · ${p}`);
    process.exit(1);
  }
  console.log(
    `\n✓ clean ${runs.length === 1 ? "playthrough" : `playthroughs (${runs.length} paths)`} at ` +
      `${VIEWPORT.width}×${VIEWPORT.height} — ${shotIndex} screenshots in ${path.relative(process.cwd(), SHOTS)}\n`,
  );
}

main().catch((e) => {
  console.error("\n✗ verification crashed:", e.message);
  process.exit(1);
});
