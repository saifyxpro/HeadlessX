# YT-Dude Rebrand + Reliability Design (2026-02-28)

## Goal
Convert this fork from `yt-dude` to `yt-dude`/`yt_dude` everywhere, fix verified extractor regressions, and harden download behavior for long-running scheduled jobs.

## Scope
- Full internal/external rename:
  - Package/module: `yt_dude` -> `yt_dude`
  - CLI/project naming: `yt-dude` -> `yt-dude`
  - Entry scripts and metadata updated to the new names
- Bug fixes:
  - A&E extractor breakages from current site changes
- Reliability improvements:
  - Add a stable programmatic runner for recurring worker usage with retry/backoff and error isolation

## Non-Goals
- Fixing every historical extractor issue across all sites
- Preserving backward compatibility aliases (`yt-dude`, `yt_dude`)

## Approach
1. Rebrand in codebase and packaging
   - Rename package directory and update imports/references
   - Rename launcher scripts and update pyproject script entry
2. Apply extractor reliability fixes
   - A&E: add resilient ID extraction path and fallback IDs
3. Add worker-friendly download API
   - New helper module wrapping core download flow for periodic jobs
   - Deterministic retry policy + jitter + structured result object
4. Validate
   - Syntax compile, targeted test suite, and smoke extraction on known URLs

## Risks & Mitigations
- Risk: Large rename introduces broken import paths
  - Mitigation: global search + compile checks + targeted tests
- Risk: live site variance breaks extractor assumptions
  - Mitigation: fallback extraction paths, tolerant parsing, and graceful failures
- Risk: worker crashes due to unhandled exceptions
  - Mitigation: structured error capture and bounded retries

## Acceptance Criteria
- Project runs as `yt-dude` and imports via `yt_dude`
- Verified A&E extractor issues addressed in code and smoke-tested where possible
- New worker-oriented API exists and works for repeated task execution
- Key local tests pass (or documented blockers if environment lacks deps)
