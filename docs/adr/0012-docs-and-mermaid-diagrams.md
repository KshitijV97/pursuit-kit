# 0012. Documentation layout, Mermaid-only diagrams, and AGENTS.md

- **Status:** Accepted
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD15)
- **Decisions:** [docs/brainstorms/2026-11-18-technical-setup-decisions.md](../brainstorms/2026-11-18-technical-setup-decisions.md) (D28–D30)

## Context

The owner wants technical design kept in Mermaid, and plain instructions to follow when coming back to the project later. Coding agents need one instruction file. Docs that live apart from the code drift unless a rule ties them to changes.

## Decision

- **Diagrams are Mermaid only**, in fenced blocks inside Markdown. There are no image or draw.io files. `docs/architecture.md` is the source of truth for the system's current shape, and the plan and ADRs link to it. It starts with nine diagrams:
  1. System context and containers.
  2. Google sign-in and token refresh.
  3. The per-job pipeline with its checks.
  4. One generation step with save and resume.
  5. The application status lifecycle.
  6. The data model.
  7. The Drive folder layout.
  8. The delivery pipeline.
  9. Infrastructure resources.
- **`docs/` layout:**
  - `README.md` (index) and `architecture.md`;
  - `setup/`: one-time setup checklists;
  - `runbooks/`: repeatable tasks such as release, deploy, rollback, rotating a secret, changing the AI model and updating the price table;
  - `reference/`: environment variables, Make targets, the data model, and later pricing and credit rules;
  - `adr/`, `plans/` and `brainstorms/`.
- **Writing style:** plain English and step-by-step checklists, written for the owner.
- **`AGENTS.md`**, about 100 lines, is the instruction file for any coding agent: commands, rules, where things live and what "done" means. `CLAUDE.md` is a symlink to it.
- **Rule:** a PR that changes a component, flow, data shape, pipeline, setup step, command or repeatable task updates the matching diagram or doc in the same PR.
- **CI check:** a separate job checks Mermaid syntax with `@mermaid-js/mermaid-cli` when Markdown files change.

## Consequences

- Diagrams render on GitHub and show up in diffs.
- Whether a diagram matches the code is checked in review, not automatically. Only syntax is checked.
- The Mermaid check needs headless Chromium, which is why it runs in its own job and only when Markdown changes.

## Alternatives considered

- **Diagrams in each plan and ADR only.** They go stale independently. One current file is easier to trust.
- **Image-based diagrams.** Can't be diffed or reviewed as text.
- **A lighter Mermaid parser.** The official parser package covers only some diagram types.
