# Global Pursuit League

**Continue work from [BACKLOG.md](BACKLOG.md).** It contains the current priorities, detailed acceptance criteria, release state and handoff notes for any tab or agent using this workspace. Historical specifications remain under docs/.

A desktop-first business learning simulation for adult employees, written for people with no sales or consulting background. You lead a six-person team at Northgate, a small consultancy, through one deal with Orion Retail. It runs in four acts of two decisions each: understand before you offer, decide whether the deal is worth winning, trade rather than give, and promise only what your team can deliver.

**Play it:** https://medieval-devlab.github.io/GPL/ (published from `master` by `.github/workflows/pages.yml` on every push).

**Designed from first principles** (version 2.0). [docs/STRATEGY.md](docs/STRATEGY.md) records the learning-science and game-design research behind the game. [docs/LEVERS.md](docs/LEVERS.md) specifies the decision unit, and [docs/STORY-V2.md](docs/STORY-V2.md) is the script.

Allow about 40 minutes, ideally in two sittings (acts 1–2, then acts 3–4); the facilitator guide explains why. Losing the award and walking away are legitimate shorter endings. Duration is an estimate, not a measured learner average.

## Play and build

Requires Node 20.19+ or 22.12+ and npm. Use npm.cmd in PowerShell if npm.ps1 is blocked by execution policy.

```text
npm ci
npm run dev
npm run validate
npm run verify
npm run scorm
node tools/comprehension.mjs
```

- dev starts the local development server.
- validate runs TypeScript, unit/content/branch tests and the production build.
- verify serves the production build locally and plays multiple paths at four desktop sizes plus a 200%-equivalent reflow viewport. It captures screens and audits accessibility with axe.
- scorm builds and verifies standalone offline and SCORM 1.2 ZIPs under dist-release/, with checksums.
- comprehension measures, from the content, what a newcomer has to read and hold: words per decision, distinct takeaways, decisions per act. It reports against the targets in STRATEGY.md; `--strict` fails when one is missed.

Open an extracted offline package's index.html directly, or serve dist/ on a static host. All runtime photographs and fonts are local. There is no application backend, employee account, leaderboard or mandatory audio.

## Experience

The game answers one question: can you win Orion's work, make it worth winning, and still deliver what you promised? Three bars show where the deal stands: Win, Worth and Deliver. Setup introduces the firm, how a deal works and your team's strength.

- **Decisions are levers.** Each decision is two or three small choices on a panel shaped like the act's work: a research board, a staffing board, a contract with clauses, a delivery calendar. Every setting shows which bars it moves and which cards it adds or needs. The person you are answering stands beside the panel.
- **Your hand.** What you know and what you promise become cards. A promise carries a due date and comes due on the delivery calendar, where it is kept, late with agreement, or broken, each time with the reason.
- **The journey map** sits between decisions. It shows every stop, what just happened, a ten-second quick check (never graded), Orion's people as a map that turns green or red, and an open case file: "What is really wrong at Orion?"
- **Act breaks.** You guess what decided the act before your colleague tells you, then see a cause-and-effect map of how the act's choices connect to earlier and later ones.
- **The ending** draws the whole deal on one chart, with every promise from where it was made to where it came due.

Every consequence opens by naming its cause. The look is daylight editorial, with readable type and real photographs. Interface sound is optional and off by default.

## Progress and privacy

This browser stores the precise screen, current selection, chapter-map checkpoint, reflection choices and optional personal action plan. Browser storage can be unavailable or cleared: keep a run code before changing device or browser. Run codes preserve committed decisions, not unfinished drafts, reflections, action-plan notes or the exact screen. The game offers a choice when local and LMS resumes differ, and restoring a code previews the incoming progress and requires explicit confirmation before replacing the current engagement.

The final debrief brings back saved reflections and offers a three-part workplace action plan. The downloaded text includes decisions, reflections and that plan. Avoid confidential details or client/colleague names; review notes before sharing. Notes are not transmitted to the LMS. Download the debrief before a restart or restore if you want to retain notes. Old browser saves remain compatible with the new optional fields.

SCORM 1.2 reports completion and a portable resume code, never a mastery score or pass/fail. Test in your organisation's actual LMS before assigning a cohort. The shipped automated LMS test uses a mock API.

Photographs depict stock models in fictional roles, not actual Accenture employees or endorsements. See [photo provenance](docs/PHOTO-PROVENANCE.md). The application does not collect identity or send gameplay analytics; a hosting provider or LMS may have its own access logs and policies.

## Source structure

- src/engine: pure state transitions, conditions, outcomes, migration, run codes and exhaustive coverage.
- src/content: authored story, interface language, gate explanations, cast, photo credits and presentation metadata.
- src/session.ts: versioned presentation checkpoint and local/LMS resume arbitration.
- src/App.tsx: persistence, lifecycle and action orchestration.
- src/ui/game.tsx: the shell, HUD and screen routing. src/ui/screens/: the scene and the lever panel (every decision), the system views, the board, the act break, story turns and the frames around them. src/ui/parts.tsx: shared parts. src/ui/styles/: tokens, base, scene, frames and reflow. See [art direction](docs/ART-DIRECTION.md). The pre-D-077 interface (16 files no entry point imported) was removed in 1.3; it is in git history.
- src/lms.ts and scorm.ts: retry-safe completion and resume reporting.
- tools/verify-game.mjs: current browser gate. tools/verify.mjs is the historical UI harness.
- .openai/hosting.json: persistent Sites project identity and static output configuration; no credentials.

## Training and release evidence

See [implementation status](docs/IMPLEMENTATION-STATUS.md), [facilitator guide](docs/FACILITATOR-GUIDE.md), [release verification](docs/RELEASE-VERIFICATION.md) and [learner evaluation protocol](docs/LEARNER-EVALUATION.md).

Automated tests are not proof of learning efficacy, enjoyment, formal accessibility certification or Accenture approval. A human employee pilot and customer-LMS acceptance remain external rollout checks.
