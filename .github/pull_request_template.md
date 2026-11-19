## What changed

<!-- One paragraph. What a user of the app can do now that they could not before. -->

## Why

<!-- The requirement (R1-R27) or unit (U0-U10) this serves, and the ADR if a decision changed. -->

## Verification

- [ ] `make check` passes (lint, types, tests, build).
- [ ] `make sanity` runs in under 10 seconds on a one-file change.
- [ ] The test scenarios named in the plan unit exist and pass.
- [ ] `make regression` passes locally when this touches the doc service, a page or a script.
- [ ] The PR description records a manual smoke run against real services when this touches sign-in, Drive, AI or the doc service.

## Docs and accessibility

- [ ] `docs/architecture.md` diagrams and the matching docs in `docs/` match what was built.
- [ ] Any KTD that changed has its ADR updated in this change.
- [ ] Pages touched pass the accessibility checklist in `AGENTS.md` (one `h1`, labels, errors as text, keyboard, `alt`).
- [ ] `knip` passes: no unused code, dependencies or commented-out experiments.
- [ ] Every new dependency has a one-line reason here.

## Notes for the reviewer

<!-- Anything risky, deferred, or worth a second look. -->
