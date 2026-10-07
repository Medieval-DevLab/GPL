# Global Pursuit League — working product backlog

Last reconciled: 8 October 2026. Product owner and implementation lead: the agent continuing this workspace, with the user as final product decision-maker.

This is the canonical **working backlog and cross-tab handoff**. It is a real repository file, not chat memory. Open this file from any tab using the same GPL workspace. Another workspace must open or clone this repository to see it. `AGENTS.md` and `README.md` point here. Keep this file current as work proceeds.

## 1. Product brief and decisions already made

Build a complete, engaging desktop business simulation for adult Accenture employees. The learner leads a client pursuit through five connected chapters: finding the client, qualifying the opportunity, shaping the response, making the deal work and delivering the promise. Teach judgement through evidence, constrained choices, commitments and consequences that return later.

The user has authorised implementation, audits, useful parallel research and publication. The earlier planning-only stage has been superseded. New approval interviews are not needed for routine implementation. Do not infer organisational endorsement or learner validation from that autonomy.

Non-negotiable requirements:

- Desktop-first, readable live text and usable layouts at 1366×768, 1440×900, 1440×1024 and 1920×1080; maintain functional reflow at 200% equivalent zoom.
- Real, locally bundled adult stock photography with provenance and consistent character identity. No fantasy world, children’s treatment or scraped employee portraits.
- A coherent journey: role → team advantage → map → named chapter/objective → brief → decision → consequence/lesson → chapter debrief → next milestone. Legitimate early endings remain complete learning paths.
- Different screen compositions for scenes, messages, meetings, investigations, allocation, evidence-based decisions, consequences and reflection; one shared visual language. Do not turn every activity into the same dashboard.
- Remove the question asking learners to predict winnability, profitability and deliverability. It is already removed. Actual post-decision indicators may explain the simulation; they are not employee scores.
- Preserve all 37 authored nodes, 18 possible decisions, branch prerequisites, constrained selection counts, causal explanations and alternative endings. No outcomes previewed before commitment.
- Preserve static/offline/SCORM delivery, locally saved progress, optional reflections, no mandatory audio, no reading timer and keyboard operation.
- Training value and visual quality both matter. Automated tests alone do not establish engagement, comprehension, accessibility certification or enterprise approval.

## 2. Source of truth and continuity

Read in this order after switching tabs or agents:

1. This file: current scope, work queue, next actions and limitations.
2. `git status --short` and `git log -3 --oneline`: actual local state; preserve existing changes.
3. `docs/RELEASE-VERIFICATION.md`: executed checks with release-specific evidence.
4. `docs/IMPLEMENTATION-STATUS.md`: mapping of the original 38 tickets to implementation.
5. Relevant source for the next ticket; do not rerun the entire discovery process.

`docs/COMPLETE-GAME-BACKLOG.md` remains the original scope contract. Its old implementation anchors, colour proposals and planning-only/approval-stage language are historical where this backlog or the later user instructions supersede them. Other design/backlog files are supporting history, not competing active task lists.

### Verified starting state for this continuation

| Layer | Evidence on 7 October | Interpretation |
|---|---|---|
| Published game | Sites reports version 1, active and owner-private; source commit `e850431812a63ad3a87ef93999fccb85bbe30691` | Version 1.0 is live |
| Live address | https://global-pursuit-league.yogeshwar-singh-2711.chatgpt.site | Preserve the current audience |
| Local source | Uncommitted 1.1 learning-record/restore changes; new `src/debrief.ts` and tests | Implemented locally; not yet a published release |
| Local artifacts | 1.1 ZIPs and a browser report exist from September | They predate the last reflection-order change; rebuild before delivery |
| Existing checks | Prior 1.0: 266 tests, eight browser runs, 19 screen-family audits; prior 1.1: 272 tests before one additional ordering test | Historical evidence, not automatic proof for later edits |
| External validation | No employee pilot, manual assistive-technology acceptance or actual customer-LMS acceptance recorded | Still outstanding; do not fabricate results |

Original preview HTML/SVG/PNG files and scratch probes were already untracked. Preserve them, and exclude them from automated source publication without deleting them. The currently imported UI is `src/ui/game.tsx` / `game.css`; legacy UI files remain historical.

## 3. Prioritisation and completion rules

- **P0:** blocks correct progress, trustworthy delivery or cross-tab continuity. Finish before release.
- **P1:** required quality gap in the existing experience. Finish in this continuation when verified and bounded.
- **P2:** a hypothesis requiring learner evidence or a larger product decision. Keep explicit; do not expand the game speculatively.
- **External:** requires real participants, company systems or a user decision outside available access.

States: `READY`, `IN PROGRESS`, `IMPLEMENTED / VERIFY`, `VERIFIED`, `RELEASED`, `EXTERNAL`, `DEFERRED`. Code existing on disk is not synonymous with deployed. Every closure needs file evidence and a relevant observed result. Publication needs a successful deployment receipt for the matching committed source.

Definition of done for software: acceptance criteria met; suitable checks pass; relevant docs updated; actual release artifacts rebuilt; published version points to the same source; no unresolved critical defect hidden behind a green test count.

## 4. Release queue

Target: **1.1.0 — learning continuity and decision clarity**. Complete the interrupted update, fix verified continuity issues and ship the cohesive result. Keep the existing photographic direction; do not restart the visual design process.

| ID | Priority | Work | State | Dependency |
|---|---|---|---|---|
| PM-01 | P0 | Durable backlog and cross-tab handoff | IN PROGRESS | None |
| LR-01 | P1 | Complete reflection review, action plan and debrief export | IMPLEMENTED / VERIFY | Existing local work |
| SV-01 | P0 | Explicit restore preview and cancellation | IMPLEMENTED / VERIFY | Existing local work |
| SV-02 | P0 | Preserve access to saved progress before restart/restore from home | READY | Audit confirmation |
| LMS-01 | P0 | Report a different completed run restored in the same tab | READY | LMS audit |
| VIS-01 | P0 | Staged-drama presentation rebuild: depth, colour script, distinct screen families (`docs/ART-DIRECTION.md`, D-077) | IMPLEMENTED / VERIFY | User visual sign-off |
| CAU-01 | P1 | Consequence screen names the earlier commitments the outcome depended on (D-078) | IMPLEMENTED / VERIFY | None |
| NAV-01 | P1 | Chapter-specific decision review from the journey | IMPLEMENTED / VERIFY | Current history/account-file components |
| CNT-01 | P1 | Repair the delivery handover timeline | READY | Content audit |
| UI-01 | P1 | Put earned supporting evidence inside application decisions | IMPLEMENTED / VERIFY | Content/gate mappings |
| UI-02 | P1 | Make multi-selection commitments explicit before committing | IMPLEMENTED / VERIFY | Existing exact-count engine |
| QA-01 | P0 | Validate changed flows and regression coverage | READY | Software tickets |
| REL-01 | P0 | Rebuild packages and publish the verified update | READY | QA-01 |
| PILOT-01 | External | Employee engagement and comprehension pilot | EXTERNAL | Representative learners |
| ACCESS-01 | External | Manual assistive-technology acceptance | EXTERNAL | Qualified human evaluation |
| LMS-02 | External | Actual company-LMS acceptance | EXTERNAL | Target LMS/admin access |

### PM-01 — Persistent backlog and handoff

Problem: several historical documents and chat summaries obscure what is live, locally implemented or still outstanding.

Deliverables: root `BACKLOG.md`; an `AGENTS.md` entry point; prominent README link; references from old status/backlog docs. Maintain a handoff checkpoint at the end of this file.

Acceptance:

- A new tab can identify audience, constraints, current release, active tasks and next command without relying on conversation history.
- Every active item has a problem, implementation boundary, acceptance criteria and verification approach.
- Prior user artifacts and local changes remain intact.
- The latest release receipt is distinguished from local work and historical test reports.

### LR-01 — A useful learner record

Problem: reflection answers previously disappeared from the final review, while the ending had no concrete bridge to workplace practice.

Implementation: complete existing `src/debrief.ts`, presentation `actionPlan`, `LearningRecord` and export changes. Render reflections in chapter order, independent of story-file insertion order. Offer optional action / occasion / observable evidence fields, 500 characters each. Preserve old saves with empty defaults.

Acceptance:

- Ending and text export show the learner’s recorded responses in chapter order; skipped or code-restored responses are not invented.
- Notes survive browser reload and are included in the deliberate debrief download.
- Notes do not alter engine outcomes, add scores or enter LMS/run-code data.
- Copy clearly explains where notes are stored and what a restart/restore replaces.
- Older presentation schema-1 saves still resume; malformed fields do not break play.

Verification: session/debrief unit tests; browser fill → reload → resume → download; inspect actual downloaded text. Files: `src/session.ts`, `src/debrief.ts`, `src/ui/game.tsx`, associated tests.

### SV-01 — Safe restoration of a run code

Problem: a valid code used to replace the current engagement immediately.

Implementation: validate without mutation; display incoming committed-decision count; provide Keep current engagement and Replace and restore actions. Clear preview when input changes. Close the dialog after successful restore even if the route stays the same.

Acceptance:

- Invalid codes show useful feedback and never change saved progress.
- Preview and cancellation leave the stored session byte-for-byte unchanged.
- Only explicit confirmation replaces drafts, reflections and notes.
- Keyboard focus stays in the dialog and returns sensibly after cancel/close.
- Restoring a completed code does not pretend it carries reflection responses or private notes.

Verification: browser invalid/preview/cancel/confirm checks, including same-route terminal restoration. Files: `src/ui/game.tsx`, `tools/verify-game.mjs`.

### SV-02 — Recoverable work remains accessible from home

Problem to verify: the welcome screen may have a saved session while its active engine state is still the empty title state; save/restart helpers using only active state cannot expose the saved code or notes.

Implementation boundary: derive available records from the active session or resume candidates. Identify browser versus LMS records when they differ. Offer the recoverable code and a record download before replacement, including a partial-engagement record that does not announce a final verdict.

Acceptance:

- Fresh launch with a saved session exposes that session’s recovery information before restart/restore.
- A completed local record can be downloaded with its notes directly from the replacement flow.
- A partial record says in progress and includes only actual completed decisions/reflections.
- Conflicting browser/LMS candidates are labelled; no automatic choice based on greater progress.
- Cancel preserves the session; confirmed restart creates an empty new engagement once.

Verification: browser reload-to-home → inspect/save record → cancel/restart; partial/terminal record unit tests. Files: `src/ui/game.tsx`, `src/debrief.ts`, session projections.

### LMS-01 — Terminal-to-terminal restore reaches the LMS

Evidence: `src/lms.ts` currently returns early whenever completion was acknowledged, before comparing the new run’s code. Restoring completed run B after completed run A in the same tab can leave the LMS on A.

Implementation: associate the acknowledgement with the current code; retain same-code deduplication and existing retry behaviour. Use existing SCORM bridge semantics.

Acceptance:

- A → B completed restore writes B’s suspend data and completion successfully.
- Repeating the same completed code does not duplicate successful reporting.
- Failed changed-code reporting retries and is not prematurely acknowledged.
- No mastery score or pass/fail is introduced; normal restart and pagehide paths still work.

Verification: focused lifecycle tests for A → B, same-code repeat and failed-write retry. Files: `src/lms.ts`, `src/lms.test.ts`, existing bridge tests.

### NAV-01 — Review the chapter selected on the map

Problem to verify: completed chapter links currently open the general account file; while a mission is active this can open its brief rather than the selected chapter’s decisions.

Implementation: represent account-file intent explicitly (brief/general/chapter review). Filter the existing History component by the selected chapter and label the scope. Do not move the engine or change the current draft.

Acceptance:

- Reviewing chapter 1 while playing chapter 3 opens chapter 1’s actual record.
- Each chapter review is named and contains only that chapter’s completed decisions.
- Closing it returns to the same map or activity with unchanged selection and phase.
- General account-file navigation still provides evidence, commitments and the full record.

Verification: browser chapter-boundary/mid-activity review and return; no new navigation shortcuts into unplayed chapters.

### CNT-01 — A coherent handover timeline

Problem: the handover activity follows Month five and staffing pressure, but its copy can imply the delivery team has not started yet.

Implementation: rewrite the handover as a delivery reset/reconfirmation of scope and responsibilities at the established time. Review its brief, speaker line, options and lessons together. Preserve IDs, flags, conditions, next nodes and outcome effects.

Acceptance:

- The learner can explain when the meeting occurs and why a handover is needed now.
- The scene does not contradict earlier delivery or staffing events.
- Branch-specific claims remain supported by earned choices.
- Run-code structure/rules remain compatible; a prose-only fix does not invalidate prior runs.

Verification: compare content fingerprint and neighbouring narrative; exercise an informed and an underprepared handover.

### UI-01 — Evidence application feels like evidence application

Problem: application decisions use a conversation layout but supporting evidence and the actual commitments are separated into a generic account-file overlay.

Implementation: add a compact, readable supporting-record section to existing application screens, derived from earned prerequisites and actual ledger entries. Retain the character/context and all original argument choices. Show source chapter or decision when available; do not fabricate dossier contents.

Acceptance:

- Learners can inspect relevant earned support beside the procurement/handover choice.
- Unavailable arguments explain what is missing; earned support is never shown before it exists.
- Evidence is factual prior state, not a forecast or recommendation revealing the outcome.
- The screen remains readable at desktop and zoomed widths; content does not become dashboard clutter.

Verification: earned/unearned application variants, keyboard inspection, layout and selected-state preservation. Files: current UI, `src/content/gates.ts`, ledger/evidence projections.

### UI-02 — An explicit plan before commitment

Problem: multi-select screens show a count and selected card styling, but choices may be spread across the page; the learner needs a clear final statement of what is being committed.

Implementation: show selected item names in a concise ordered commitment summary near the commit action. Include remaining selection count and accessible removal controls where useful; keep the exact-count engine as the authority.

Acceptance:

- Investigation shows two chosen questions; discovery shows two workstreams; proposal shows three selected components.
- Summary updates with selection/deselection and survives reload with the draft.
- Unselected items and predicted effects do not appear as committed work.
- The commit action remains disabled until the actual required count is met.
- Summary does not duplicate long card descriptions or shrink decision text.

Verification: partial/full/replaced selections, keyboard use, narrow layout and exact-count regression.

### QA-01 — Evidence proportional to this release

Required checks: TypeScript; full existing deterministic/content suite once after substantive logic changes; new meaningful lifecycle/recovery tests; production build; complete browser policies covering delivery, loss and walk-away; changed-screen/recovery checks; offline and mock-LMS gates. Reuse successful results while their inputs remain unchanged.

Acceptance: no broken runtime assets, horizontal overflow, console failures, unreachable actions or known critical regression. Inspect representative actual screenshots. Report automated accessibility findings accurately without claiming certification. Preserve actual counts and source/build identity in the release record. Do not repeatedly run unchanged expensive checks for appearance of diligence.

### REL-01 — Publish the same game that was verified

Implementation: use existing Site identity and owner-private audience. Build offline and SCORM ZIPs for 1.1.0; verify archive contents and launch; record checksums. Publish exact committed source and matching static artifact using Sites. Preserve 1.0 packages.

Acceptance:

- Current source, packaged assets and hosted version correspond.
- Native deployment status is succeeded and the live address is recorded.
- README and this backlog identify the deliverable and honest remaining external checks.
- New tab can locate the source commit, artifacts, release evidence and next work.
- Credentials are not written to source, docs or files.

## 5. External validation and hypotheses

### PILOT-01 — Employee comprehension and engagement

Use `docs/LEARNER-EVALUATION.md` with representative adult employees. Observe first meaningful decision time, orientation at a new chapter, understanding of an earned/unavailable option, attribution of a consequence and one actionable transfer. Include a late dense activity and an early ending. Log actual observations, severity and follow-up tickets. Exit criterion: critical orientation/reading failures fixed and retested. No participant access is currently available.

### ACCESS-01 — Manual assistive-technology review

Test keyboard-only play with a human and the organisation’s supported screen reader/browser combination, including modal focus, announcements, expanded context, selection counts and 200% enlargement. Record the actual configuration and defects. Automated axe results are supporting evidence only.

### LMS-02 — Company-LMS acceptance

Import the SCORM 1.2 ZIP into the actual target LMS. Test launch, suspension, return on another session, ordinary completion, early ending, same-tab replay and replacement by another completed code. Confirm completion-based reporting and no score. Requires a named platform and appropriate administrative access.

### Deferred product hypotheses (P2)

- Shorter run, fewer clicks or optional accelerated briefings: change only after observed pacing problems; do not hide essential learning material to promise a duration.
- New scenarios, multiplayer, leaderboards, artificial currencies, voice/video, accounts or analytics: outside the current release; no evidence these solve the reported problems.
- New art direction or expression variants: test current readability and engagement first; retain licensed real photography and consistent identity.
- Formal brand alignment and broad company sharing: require the organisation’s brand/access decisions; the current styling does not claim official Accenture approval.

## 6. Verification commands and file map

PowerShell uses `npm.cmd` where npm.ps1 is blocked. Current scripts: `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run verify`, `node tools/lms-check.mjs`, `node tools/scorm-package.mjs`. The browser harness serves the existing production build; build before browser checks when source changed.

| Concern | Files |
|---|---|
| Current UI and visual language | `src/ui/game.tsx`, `src/ui/game.css` |
| Game orchestration | `src/App.tsx` |
| Local checkpoints and recovery | `src/session.ts`, `src/engine/save.ts`, `src/engine/runcode.ts` |
| Learner record | `src/debrief.ts`, `src/debrief.test.ts` |
| Business rules/content | `src/engine/*`, `src/content/story.ts`, `gates.ts`, `presentation.ts` |
| LMS lifecycle | `src/lms.ts`, `src/scorm.ts`, associated tests |
| Browser and delivery gates | `tools/verify-game.mjs`, `file-url-check.mjs`, `lms-check.mjs`, `scorm-package.mjs` |
| Art licences | `docs/PHOTO-PROVENANCE.md`, `src/content/assets.ts` |
| Regenerable outputs | `dist/`, `dist-release/`, `docs/screenshots-release/` (ignored) |
| Site identity | `.openai/hosting.json` (preserve; no secrets) |

## 7. Current handoff checkpoint

8 October, presentation-rebuild checkpoint. The user's verdict was that the game looked "shit": the colours were wrong, every screen had the same style, it felt like reading containers, and there was no depth or layering anywhere. They asked for research into how acclaimed narrative games are built, a finalised brand palette, and distinct screen styles. Done locally, not yet published:

- **VIS-01.** `src/ui/game.tsx` is now a shell over `src/ui/parts.tsx` and eleven files in `src/ui/screens/`. Styles live in `src/ui/styles/` (tokens, base, stage, screens-frame, screens-play, responsive). The reasoning, references and rules are in `docs/ART-DIRECTION.md`; the decision and its costs are D-077.
- **CAU-01.** The engine has a new function, `outcomeBecause` (D-078), tested in `src/engine/because.test.ts`.
- **UI-01, UI-02 and NAV-01** are implemented inside the new screens: the evidence folder on argument screens, the commitment summary beside the commit button, and the journey's "Review this act", which is scoped to that chapter.
- **New assets.** Nine Pexels locations, seven cut-outs and three OFL fonts. Provenance is in `docs/PHOTO-PROVENANCE.md`.
- **Budgets** re-split in `tools/size.mjs`: interface 27, stylesheet 18.
- **Pedagogy audit.** The `gpl-pedagogy` reviewer audited the rebuild; D-079 records its findings and fixes. Outstanding from it: moving hard-coded strings out of components and into content. Several are asserted by exact name in `verify-game.mjs`, so the harness has to move with them.

Evidence on 8 October: TypeScript clean; 278 tests in 18 files (prior 1.1 baseline: 272 in 17); production build; the `file://` check; the full browser matrix (`verify-game.mjs --matrix`), whose results are recorded in `docs/RELEASE-VERIFICATION.md`; and a manual screenshot review of all 79 screens at 1440×900, with spot checks at 1366×768 and 720×450.

Not done:
- SV-02, LMS-01 and CNT-01 are still READY. SCORM ZIPs were not rebuilt.
- Nothing has been published; the live site still serves 1.0.
- The user has not yet given visual sign-off on VIS-01.
- No employee has played it.

Next actions:
1. Get the user's visual sign-off on VIS-01.
2. Fix LMS-01, which is a one-function change in `src/lms.ts`.
3. SV-02, then CNT-01.
4. `npm run scorm` and publish through the existing Site identity.
5. Consider halving the screen count. Each decision is still brief → decide → consequence; showing the brief as a collapsible layer of the decision screen would cut a run from 79 screens to about 61. That is a pacing change and needs learner evidence (PILOT-01) before it ships.
