# Release verification

## Local build, 8 October 2026: presentation rebuild (unreleased)

This build is not published. The live site still serves 1.0, and no SCORM or offline ZIPs were rebuilt. Changes: VIS-01 (D-077), CAU-01 (D-078), and UI-01, UI-02 and NAV-01 inside the new screens. Engine outcomes, content and run codes are unchanged; `outcomeBecause` reads state and decides nothing.

Checks run on 8 October, all passing:

- **TypeScript and tests.** TypeScript clean. 278 tests in 18 files, including the new `because.test.ts`, which checks causes over 450 seeded runs, and the extended presentation contract (every node has a credited backdrop and every turn has a dressing).
- **Production build and `file://`.** The production build passes. `npm run filecheck` reached the title from `file://` with a clean console. Font URLs are emitted relative (`../fonts/`).
- **Browser matrix.** `node tools/verify-game.mjs --matrix` completed eight runs:

  | Viewport | Policy | Decisions | Ending |
  |---|---|---:|---|
  | 1440×900 | first | 18 | A workable deal |
  | 1440×900 | last | 13 | They chose someone else |
  | 1440×900 | middle, keyboard | 18 | You won it, but not well |
  | 1440×900 | walk, keyboard | 14 | You walked away |
  | 1366×768 | first | 18 | A workable deal |
  | 1440×1024 | first | 18 | A workable deal |
  | 1920×1080 | first | 18 | A workable deal |
  | 720×450 (200% reflow) | first | 18 | A workable deal |

  The matrix also passed reload and resume on every screen type, plan export and restore boundaries, utility focus traps, storage denial and image failure. Axe (WCAG 2.1 AA) found **zero violations across 20 screen types**. A first matrix run found one real contrast failure in the evidence folder: "not on file" was shown with opacity, at 3.56:1 and 2.42:1. It was fixed (6.47:1) and re-run.
- **Mock LMS.** `node tools/lms-check.mjs` passed: initialised, resume code `101D-3F6` (8 characters), completed, no score, and a failed commit retried. It now runs under reduced motion; see the note in the file.
- **Size.** `node tools/size.mjs` after a `--sourcemap` build: framework 67.3, interface 22.4 of 27, engine 7.5 of 12, stylesheet 17.1 of 18 kB gz. Content 52.0 kB, uncapped. Photography 3.04 MB in 28 runtime files.
- **Manual review.** Screenshots of all 79 screens of a full run were reviewed at 1440×900, with every screen type checked at 1366×768 and 720×450. A full motion-on playthrough (view transitions, entrances, count-ups) had no console errors and no horizontal overflow.

Still outstanding: SV-02, LMS-01 and CNT-01; rebuilding the packages; publication; the user's visual sign-off; an employee pilot; and manual assistive-technology review.

## Version 1.1.0 — 24 September 2026

Follow-up audit found that saved reflection responses were absent from the final record, and a valid run code could replace browser progress immediately. This release adds:

- Saved reflections in the ending and human-readable debrief export.
- An optional three-part workplace action plan, bounded to 500 characters per field, retained in local presentation saves. Old schema-1 presentation saves load with empty optional fields.
- Explicit confidentiality guidance and a distinction between browser notes, downloadable records and decision-only run codes/LMS resume.
- A non-mutating restore preview, cancellation and explicit replacement confirmation. Successful restore closes the dialog even when the underlying route is unchanged.
- Regression coverage for plan reload/download, reflection export, old saves, malformed notes and restore boundaries. No gameplay rules, outcomes or scoring were changed.

TypeScript and production build passed. Automated suite: 272 tests in 17 files passed. The actual UI with mock SCORM API reached completion, retained a resume code and reported no score. Both new ZIPs passed entry/hash verification, extraction and offline launch. Employee pilot, manual assistive-technology review and real-LMS acceptance remain external.

| Version 1.1.0 archive | Bytes | SHA-256 |
|---|---:|---|
| gpl-1.1.0-offline.zip | 1,089,592 | d477fcfb614a51152df274adca8372d944759f918eef175bb09751c108cc9c3c |
| gpl-1.1.0-scorm12.zip | 1,090,202 | 4ea523abd9ebc8a9fbd30d65b92f97056f5b98f642ff0792c345afa223de2365 |

## Version 1.0.0 baseline

Date: 23 September 2026. Baseline repository revision: 505bcdd54d302d951877c0f3bf21f22b60c16523. The starting worktree already contained modified game/UI files and prior planning/mockup artifacts. Unrelated preview artifacts and original artwork were preserved.

## Executed checks

- TypeScript production build passes.
- Full automated suite: 266 tests in 16 files passed, including the final presentation-contract additions. Includes exhaustive reachable branch/option/quote/variant coverage, all 15 causal rules witnessed across 3,000 deterministic runs, save migration and invalid-action guards.
- Presentation/session tests verify exact draft and map restoration, reflection validation, local/LMS conflict choice and invalid/unavailable storage recovery.
- Browser matrix: complete 18-decision runs at 1440×900, 1366×768, 1440×1024, 1920×1080 and 720×450 (the effective layout viewport for 200% desktop zoom). Additional 1440×900 policies reached procurement loss after 13 decisions and a different 18-decision delivery ending.
- Final matrix: eight complete runs, including a 14-decision deliberate walk-away route. Both the middle-choice full game and walk-away route passed using keyboard activation. Rapid double-click navigation did not skip the next screen.
- Nineteen gameplay and utility screen families audited with axe WCAG A/AA rules: zero violations after correcting low-contrast secondary labels. This is automated coverage, not a claim of full WCAG conformance.
- Browser checks verify one primary heading, no horizontal overflow, no broken images, no JavaScript/console errors, read-only account-file return, and reload/resume at each lifecycle family.
- file:// launch passed with clean console and no runtime HTTP dependencies.
- Actual UI with mock SCORM API reached completion, wrote a portable resume code, retried failed writes, and reported no score.
- Dependency audit after the Vitest security update: zero known vulnerabilities.

Detailed regenerable screenshots and machine results are under docs/screenshots-release/. Run npm run verify to regenerate them against the current dist build.

## Corrections made during verification

1. Removed the prediction API/runtime state and migrated old schema-4/resolving saves to schema 5.
2. Added validated presentation checkpoints; browser and LMS states no longer silently overwrite one another.
3. Corrected the final verdict so a won engagement cannot be described as lost solely because of a later business indicator.
4. Corrected m5b's six-activity/two-selection language and stopped asserting specific purchases from pre-existing flags.
5. Corrected walk-away lessons that had asserted several risks when their condition required only one.
6. Made commit/Continue actions ignore second-click events and held-key repeats; engine guards independently prevent duplicate commits.
7. Replaced low-resolution, unknown-provenance runtime mockup crops with 12 documented stock photographs. Old source images remain in the repository but are excluded from generated delivery.
8. Fixed secondary-label contrast and retained no-timer, no-audio, reduced-motion, larger-text and keyboard paths.
9. Removed hover translation from the persistent decision action after a pointer-stability regression; the previously failing 18-decision route passed on rerun.
10. Corrected modal Tab containment to exclude links inside closed details panels, which can have layout rectangles despite being hidden. Help, preferences and run-code keyboard/escape/return tests passed.

The utility regression suite additionally passed damaged-save disclosure, invalid-code feedback, persisted preferences, storage-denied continued play and missing-image continued play.

## Performance and packaging

The complete photographic set is 850,424 bytes. Only the active scene/cast and visible map destinations are requested; there is no global photography preload. Font is locally bundled Inter with its OFL licence. The classic-script production build works in extracted ZIPs without a server.

The origin-attributed size check (vite build --sourcemap followed by tools/size.mjs) passed: framework ~68.05 KB gzip, interface ~10.34 KB, engine ~7.38 KB, stylesheet 8.44 KB. Story/content ~50.25 KB is reported, not capped. Complete cold transfer is ~1.07 MB, not including HTTP headers. Production artifacts are rebuilt without diagnostic sourcemaps.

Both release archives were built twice deterministically, verified by entry CRC and SHA-256, extracted into isolated temporary folders, and successfully launched from file://:

| Archive | Bytes | Entries | SHA-256 |
|---|---:|---:|---|
| gpl-1.0.0-offline.zip | 1,087,633 | 23 | 5078cbc605090b26d0514749ec688f86403d65baf94faf49819e03268240762c |
| gpl-1.0.0-scorm12.zip | 1,088,246 | 24 | 9609629dcc71c602cbaf329a457244b52ffa7850eda6b697ef7b6c96b663ec74 |

The archives include photography provenance, the facilitator guide and the unperformed learner-evaluation protocol. dist-release/checksums.json is the machine-readable receipt.

## Honest limits

- A human employee learning/engagement pilot has not been conducted. Protocol and observation sheet are ready; do not invent participant results.
- Manual screen-reader validation and acceptance in the customer's actual LMS/browser policies remain organisational rollout checks.
- Stock provenance records the provider's published licence; it is not an independently obtained model release or company endorsement.
- The hosted Sites audience remains owner-private unless the user deliberately changes sharing. Offline and SCORM packages provide separate handoff routes.
