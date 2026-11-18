# 0004. Claude API with structured outputs that cite evidence IDs

- **Status:** Accepted
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD4)

## Context

The AI extracts evidence from sources, matches job requirements, proposes a strategy, asks gap questions and writes documents. The owner pays with their own key (R21). The product's main promise is that no claim goes beyond the owner's evidence (R6, R7, R16).

## Decision

- Use the **Anthropic Claude API** through the official TypeScript SDK, with the key in the server-side `ANTHROPIC_API_KEY` environment variable only.
- Two model roles, each set by environment variable:
  - **extraction model** (default `claude-haiku-5-5`): parsing sources and job postings;
  - **writing model** (default `claude-sonnet-5-5`): matching, strategy, gap questions and document writing.
- Every AI step returns **structured JSON validated against a schema** (Zod), never free text. Invalid output is retried once, then shown as an error.
- Every resume bullet and every cover-letter evidence claim carries the **IDs of the evidence items** it relies on. Cover-letter sentences are typed as evidence claims, hooks from the posting or owner notes, or connective text; only evidence claims need IDs.
- A deterministic validator rejects an evidence claim that cites no evidence, an unknown item or a do-not-claim item; an ownership verb on an item marked shared or needing hedging; a number not present in the cited evidence; any do-not-claim term in the text; and a cover-letter claim citing evidence the resume does not use. It runs after generation, after the humanize rewrite, and after every fit trim; nothing is saved until the final content passes.
- A separate humanize scan flags banned AI phrasing and drives one rewrite pass of the flagged sentences.
- All AI calls go through one module so tests can replace it with recorded responses.

## Consequences

- Accuracy is enforced by code, not only by the prompt.
- The writing model costs more per run. Typical cost per application is a few cents, which fits the owner-pays MVP.
- Switching provider later means re-implementing one module, since the rest of the app sees only typed results.
- Model IDs will change over time and are configuration, not code.

## Alternatives considered

- **Free-text generation with prompt-only rules.** Cheaper to build, but cannot prove that claims trace to evidence.
- **A free-tier model provider.** Rejected in the brainstorm because of quality and rate limits.
