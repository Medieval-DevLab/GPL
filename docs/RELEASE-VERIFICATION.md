# Release verification

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
