# 0010. No infrastructure as code in the MVP; wrangler.toml and setup checklists instead

- **Status:** Accepted
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD13)
- **Decisions:** [docs/brainstorms/2026-11-18-technical-setup-decisions.md](../brainstorms/2026-11-18-technical-setup-decisions.md) (D25, D26, reversed by this ADR)

## Context

The owner first chose OpenTofu to manage the Cloudflare and Render resources. Research then found three problems:
- Render's official provider (`render-oss/render`) can't create free-plan services: the API blocks it as an anti-abuse measure. It also fails on every update to an existing free service (issues #44 and #80).
- Cloudflare R2, the natural free place to store OpenTofu state, needs a payment method to enable, which breaks the $0, no-card rule.
- What's left for OpenTofu to manage is one Worker, its settings and secret names, and `wrangler.toml` already declares all of those.

## Decision

- No OpenTofu, Terraform or Pulumi in the MVP.
- **`wrangler.toml`** is the record of the Cloudflare setup: the Worker, its variables, compatibility settings and, at stage 3, the D1 binding.
- The **Render service** is created once by hand from `docs/setup/render.md` and deployed by its deploy hook (ADR 0009).
- Secret values are set with one documented command each (`docs/setup/secrets.md`).
- The owner approved this reversal after seeing the research.

## Consequences

- There's no state to store and no extra tool to learn.
- Drift on Render isn't detected automatically. The setup checklist is the reference.
- Revisit this at stage 3, when paid Render plans (which the provider supports), D1 and a staging environment make infrastructure as code worth it.

## Alternatives considered

- **OpenTofu with local state.** Works, but the state file holds sensitive values and lives on one laptop, and it would still manage only Cloudflare.
- **OpenTofu with a state backend served by a Worker over KV or D1.** Card-free, but it's custom code just to store state.
- **R2 state backend.** Needs a card.
