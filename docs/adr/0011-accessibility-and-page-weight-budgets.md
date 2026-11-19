# 0011. WCAG 2.2 AA and page-weight budgets, enforced in CI

- **Status:** Accepted
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD14)
- **Decisions:** [docs/brainstorms/2026-11-18-technical-setup-decisions.md](../brainstorms/2026-11-18-technical-setup-decisions.md) (D2, D3, D9)

## Context

The owner wants the product to be WCAG 2.0 accessible and lightweight, not bloated (R24, R25). Without a number and an automated check, both goals drift.

## Decision

- **Target WCAG 2.2 Level AA**, which includes everything in WCAG 2.0 AA plus the 2.2 rules on focus visibility, target size and drag alternatives.
- **Automated checks in the regression pack:**
  - `@axe-core/playwright` on every page, with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` (axe has no `wcag22a` tag). Any violation fails the build.
  - Keyboard-only and no-JavaScript Playwright runs that visit every page (core flow, profile import and review, interview, fixed details, edit), checking visible focus.
  - The no-JavaScript progress page uses a 0-second `<noscript>` meta refresh with a visible Continue link. A delayed refresh would fail axe's `meta-refresh` rule and WCAG 2.2.1.
  - A template test that renders every view and checks form labels, image `alt` text and exactly one `<h1>`.
- **Page weight:** each page sends at most **30 KB of JavaScript and 20 KB of CSS, gzipped**. `scripts/check-budget.ts` measures it in the regression pack.
- **No frontend or CSS framework, and system fonts only.** Each new dependency needs a one-line reason in its PR, and `knip` flags unused code.
- **Forms first:** every action is a normal HTML form that works without JavaScript. Scripts only add enhancements.
- **Manual checks:** `AGENTS.md` keeps a short checklist (screen-reader spot check, zoom to 200%, colour contrast for new colours) for changes that tests can't fully judge.

## Consequences

- Automated tools catch about a third to a half of accessibility issues. The keyboard and no-JavaScript flows and the manual checklist cover more, but not everything.
- Interactive features cost more effort without a framework. That's the intended trade.
- The budgets are strict enough that any client-side library has to justify itself.

## Alternatives considered

- **WCAG 2.0 AA only.** Meets the literal ask, but 2.2's added rules cost little on a forms-based app and help keyboard and touch users.
- **Lighthouse scores as the gate.** Scores shift between versions. Byte budgets and axe rules are clearer pass/fail checks.
