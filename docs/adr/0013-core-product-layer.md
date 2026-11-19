# 0013. A core product layer, independent of the web UI, ready for a later MCP server

- **Status:** Accepted
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD9)
- **Decisions:** [docs/brainstorms/2026-11-18-technical-setup-decisions.md](../brainstorms/2026-11-18-technical-setup-decisions.md) (D38)

## Context

In a later iteration, the owner wants users to drive Pursuit Kit from AI coding tools such as Claude Code and Codex through an MCP server, with the same claim rules and, once paid, the same credits (R27). That server gets its own ADRs when its stage is planned. The MVP only has to avoid making it a rewrite.

## Decision

- **Product actions live in `src/core/`:**
  - profile import and review;
  - claim rules and the interview;
  - job intake, match, questions and strategy;
  - starting and advancing a generation run;
  - edits and regeneration;
  - tracker updates;
  - the claim validator and renderers.
- **Explicit dependencies:** core functions receive one context (the signed-in user, Drive client, AI provider, doc-service client, clock and config) and return typed results. They never read requests or return HTML.
- **Thin web layer:** `src/web/` parses requests, checks the session and CSRF, calls core, and renders JSX.
- **Enforced boundary:** a Biome restricted-import rule fails lint if anything in `src/core/` imports Hono or `src/web/`.
- **Adapters:** `src/adapters/` holds the outside services (Drive, the AI provider, the doc service, Google OAuth) behind interfaces that core depends on.

## Consequences

- A later MCP server becomes another thin layer that maps tools to the same core functions.
- Core is testable without HTTP, which suits the many accuracy tests.
- There's a little more structure than a single-route app would need. Lint enforces it, so it doesn't erode.

## Alternatives considered

- **Logic inside route handlers.** Less code today, but an MCP server would have to copy or untangle it.
- **Building the MCP server now.** Out of MVP scope, and its sign-in and billing design depends on stage 3.
