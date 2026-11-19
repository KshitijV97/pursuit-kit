# 0008. Quality gates: lefthook hooks, a sanity pack before commit, a regression pack after merge

- **Status:** Accepted
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD10, KTD11)
- **Decisions:** [docs/brainstorms/2026-11-18-technical-setup-decisions.md](../brainstorms/2026-11-18-technical-setup-decisions.md) (D15–D18)

## Context

The owner wants hooks for linting, pre-commit and pre-push. They want a very small sanity pack before each commit and a regression pack after each merge. Hooks that are slow get skipped, and local hooks can be bypassed, so CI must repeat the important checks.

## Decision

- **lefthook** runs the git hooks from one `lefthook.yml`. It's installed through a `prepare` script, because current pnpm blocks its postinstall otherwise.
  - **pre-commit (under 10 s):**
    - Biome format and lint on staged files;
    - gitleaks;
    - the **sanity pack**: smoke tests plus the allowlist, session crypto, CSRF, claim validator, humanize and LaTeX-escaping tests.
  - **commit-msg:** the Conventional Commits format.
  - **pre-push (under 60 s):** full lint, `tsc --noEmit`, all unit tests and the build.
- **GitHub Actions** (free for this public repo):
  - **On every PR:** the same checks as pre-push, plus `pnpm audit`.
  - **When Markdown changes:** a separate docs job checks Mermaid syntax with `@mermaid-js/mermaid-cli`, which needs headless Chromium.
  - **After each merge to `main`:** the **regression pack** (under 10 min):
    - the doc service's Docker tests with real Tectonic and extraction;
    - Playwright end-to-end, keyboard-only and no-JavaScript flows with `@axe-core/playwright`;
    - page-weight budgets;
    - `knip`.
  - **When regression fails:** the workflow opens or comments on a GitHub issue labelled `regression`. The `regression-gate` check stops the release PR from merging until `main` passes again.
- **Tools:**
  - Biome replaces ESLint and Prettier.
  - Vitest runs app tests inside the Workers runtime through `@cloudflare/vitest-pool-workers`.
  - Playwright, `@axe-core/playwright`, gitleaks and `knip` cover the rest.
  - All are dev dependencies only.
- **No test calls the real AI provider, Google or the deployed doc service.** Fakes implement the same interfaces, and a test-only `FAKE_EXTERNALS` binding switches them on for `wrangler dev`.

## Consequences

- Commits stay fast, and slow checks run once after merge, not on every push.
- A regression is found after merge, not before. The issue and the release gate stop it from shipping.
- Every new critical module must decide whether its tests belong in the sanity pack. `AGENTS.md` states the rule: accuracy, security and escaping tests do.

## Alternatives considered

- **husky or pre-commit (Python).** Each adds a runtime dependency. lefthook is one binary.
- **Running the full suite on every PR.** It slows every PR to cover changes that rarely break the slow paths.
- **ESLint and Prettier.** Slower and two tools. Biome keeps pre-commit under budget.
