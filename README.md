# Global Pursuit League

**Continue work from [BACKLOG.md](BACKLOG.md).** It contains the current priorities, detailed acceptance criteria, release state and handoff notes for any tab or agent using this workspace. Historical specifications remain under docs/.

A desktop-first business learning simulation for adult employees. Lead a fictional client engagement through five chapters and 18 connected decisions: find a client, qualify the opportunity, shape the response, negotiate the deal and deliver the promise.

Allow around 70–90 minutes for the full delivery path, or play one chapter at a time. Procurement loss and walking away are legitimate shorter endings. Duration is an estimate, not a measured learner average.

## Play and build

Requires Node 20.19+ or 22.12+ and npm. Use npm.cmd in PowerShell if npm.ps1 is blocked by execution policy.

```text
npm ci
npm run dev
npm run validate
npm run verify
npm run scorm
```

- dev starts the local development server.
- validate runs TypeScript, unit/content/branch tests and the production build.
- verify serves the production build locally and plays multiple paths at four desktop sizes plus a 200%-equivalent reflow viewport. It captures screens and audits accessibility with axe.
- scorm builds and verifies standalone offline and SCORM 1.2 ZIPs under dist-release/, with checksums.

Open an extracted offline package's index.html directly, or serve dist/ on a static host. All runtime photographs and fonts are local. There is no application backend, employee account, leaderboard or mandatory audio.

## Experience

The game is staged as a business drama. Each chapter has its own light, from the market at daybreak to the delivery floor. Each kind of beat has its own composition: case files, incoming calls, message threads, a cork board, a planning wall, the argument across the table, trade press and memos. Every consequence names the earlier commitments it depended on. Interface sound is optional and off by default.

The welcome establishes the learner's role. A starting team advantage leads to the five-chapter journey. Every chapter has an arrival and objective. Activities use distinct brief, comparison, investigation, allocation, chat, meeting and evidence-application layouts. Each commitment produces an explained consequence. Reflections, chapter debriefs and a final causal review connect decisions to workplace practice.

The old question predicting Winability, Profitability or Deliverability has been removed, including prediction scoring. Actual business indicators are available after a result; they are not employee scores. The engine is deterministic: the same choice can land differently according to the evidence and commitments already earned.

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
- src/ui/game.tsx: the shell, HUD and screen routing. src/ui/screens/: one composition per kind of beat. src/ui/parts.tsx: world, cut-out, meter and action parts. src/ui/styles/: tokens (brand palette and colour script), stage (depth planes), compositions and reflow. See [art direction](docs/ART-DIRECTION.md). Older UI files are retained as historical implementation, not imported by the production entry point.
- src/lms.ts and scorm.ts: retry-safe completion and resume reporting.
- tools/verify-game.mjs: current browser gate. tools/verify.mjs is the historical UI harness.
- .openai/hosting.json: persistent Sites project identity and static output configuration; no credentials.

## Training and release evidence

See [implementation status](docs/IMPLEMENTATION-STATUS.md), [facilitator guide](docs/FACILITATOR-GUIDE.md), [release verification](docs/RELEASE-VERIFICATION.md) and [learner evaluation protocol](docs/LEARNER-EVALUATION.md).

Automated tests are not proof of learning efficacy, enjoyment, formal accessibility certification or Accenture approval. A human employee pilot and customer-LMS acceptance remain external rollout checks.
