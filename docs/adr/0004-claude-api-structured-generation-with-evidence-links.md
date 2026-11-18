# 0004. Claude API with structured outputs that cite evidence IDs

- **Status:** Accepted (revised 2026-11-18: provider interface and per-application cost)
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD4)

## Context

The AI extracts evidence from sources, matches job requirements, proposes a strategy, asks gap questions and writes documents. The owner pays with their own key (R21). The product's main promise is that no claim goes beyond the owner's evidence (R6, R7, R16).

## Decision

- All AI calls go through **one provider interface**. Each call names a role, a prompt and a schema, and returns schema-checked data, input and output token counts, and the model ID. The MVP builds one adapter, for the **Anthropic Claude API** through the official TypeScript SDK (which supports Cloudflare Workers). The key is held only in the `ANTHROPIC_API_KEY` Worker secret (R21, R23).
- A configured **price table** (per model, per million input and output tokens) turns token counts into an estimated cost. Every step appends a cost record to its application, and the application page shows the total (R22). A model missing from the table records tokens with cost marked unknown, and the step doesn't fail.
- Two model roles, each set by environment variable:
  - **extraction model** (default `claude-haiku-5-5`): parsing sources and job postings;
  - **writing model** (default `claude-sonnet-5-5`): matching, strategy, gap questions and document writing.
- Every AI step returns **structured JSON validated against a schema** (Zod), never free text. Invalid output is retried once, then shown as an error.
- Every resume bullet and every cover-letter evidence claim carries the **IDs of the evidence items** it relies on. Cover-letter sentences are typed as evidence claims, hooks from the posting or owner notes, or connective text; only evidence claims need IDs.
- A deterministic validator rejects an evidence claim that cites no evidence, an unknown item or a do-not-claim item; an ownership verb on an item marked shared or needing hedging; a number not present in the cited evidence; any do-not-claim term in the text; and a cover-letter claim citing evidence the resume does not use. It runs after generation, after the humanize rewrite, and after every fit trim; nothing is saved until the final content passes.
- A separate humanize scan flags banned AI phrasing and drives one rewrite pass of the flagged sentences.
- Tests use a recorded-response fake that implements the same interface. No test calls a real provider.

## Consequences

- Accuracy is enforced by code, not only by the prompt.
- The writing model costs more per run. Typical cost per application is a few cents, which fits the owner-pays MVP.
- Adding a provider later (a later iteration) means writing one adapter and a config value. Prompts, schemas and the validator stay the same.
- The price table goes stale when provider prices change. A runbook (`docs/runbooks/update-price-table.md`) covers updating it.
- Model IDs will change over time and are configuration, not code.

## Alternatives considered

- **Free-text generation with prompt-only rules.** Cheaper to build, but cannot prove that claims trace to evidence.
- **A free-tier model provider.** Rejected in the brainstorm because of quality and rate limits.
