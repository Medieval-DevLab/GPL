# GPL workspace continuity

Read [BACKLOG.md](BACKLOG.md) first. It is the canonical working backlog, product brief and cross-tab handoff. It supersedes conflicting status/next-step claims in historical backlog and mockup documents, while preserving their useful specifications.

Before editing, inspect `git status --short` and preserve existing changes. The current production UI is `src/ui/game.tsx` and `src/ui/game.css`; several older UI files are retained but not imported. Do not infer the live release from package.json alone: compare the release receipt and current Sites version.

Keep BACKLOG.md ticket states and its final handoff checkpoint current. Record executed checks in `docs/RELEASE-VERIFICATION.md`. Distinguish implemented, verified and published work. Do not fabricate employee-pilot, accessibility-certification or company-LMS results.

Preserve deterministic business rules, all authored routes, real photography/provenance, desktop readability, offline/SCORM operation and removal of the prediction question. Keep browser-only notes separate from run codes and LMS reporting. Do not silently overwrite another learner’s saved engagement.

Only the primary Site-owning agent edits this checkout and publishes. Delegate bounded read-only audits, research or assets with explicit file boundaries. The existing `.openai/hosting.json` is the Site identity; reuse it and preserve its audience. Never commit credentials or unrelated preview/scratch artifacts.
