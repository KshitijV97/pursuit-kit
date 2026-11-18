---
title: Technical setup, cost and monetization decisions
date: 2026-11-18
status: settled (owner-approved in grilling session)
amends: docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md
---

# Technical setup, cost and monetization decisions

Decisions settled in a grilling session after the MVP plan was written. Each was put to the owner with a recommendation and accepted unless noted. They supersede the plan wherever the two conflict. Items marked **verify** are facts stated from memory that planning must check.

## Project philosophy

- **D1. Zero fixed cost.** The project costs $0 per month. Only two costs are allowed: Claude (AI) usage, capped by a spend limit in the Anthropic console, and per-transaction payment fees once users pay. Any change that adds a recurring cost needs an ADR.
- **D2. Lightweight, not bloated.** No frontend or CSS framework, and system fonts only. Each page sends at most 30 KB of JavaScript and 20 KB of CSS (gzipped), enforced in CI. Each new dependency needs a one-line reason in its PR. `knip` flags unused dependencies, exports and files.
- **D3. Accessibility: WCAG 2.2 Level AA**, which includes WCAG 2.0 AA. Any axe violation fails the build. A test completes the core flow using only the keyboard. `AGENTS.md` holds a short manual checklist.
- **D4. Every host and service must allow commercial use**, because the product will be monetized. This rules out Vercel Hobby.

## Stack and hosting

- **D5. TypeScript, not Next.js and not Go.** The owner is most comfortable with TypeScript. Go was considered and rejected: it fit the lightweight goal but would be harder to maintain. Next.js was rejected because its baseline JavaScript breaks the D2 budget and Vercel Hobby breaks D4.
- **D6. Hono with server-rendered JSX.** No React runs in the browser. A few small TypeScript enhancement scripts are bundled with esbuild. The package manager is pnpm, and the runtime is the current Node LTS pinned in `.nvmrc` (**verify** the version).
- **D7. Hosting: Cloudflare Workers free plan for the app, plus a Render free web service for the heavy work.** Neither needs a card, and both cost $0.
  - Workers runs Hono: the UI, API routes, sign-in, and calls to Drive and Claude.
  - Render runs a Docker service with Tectonic (LaTeX compile) and PDF/DOCX text extraction. Parsing moves there because of the Workers free-plan CPU limit (about 10 ms per request; **verify** that the remaining Workers work fits).
  - The app wakes the Render service when a posting is pasted and when the strategy, documents and edit pages load. That restores the original plan's wake-up behaviour.
  - Rejected: Cloud Run (needs a card, and charges are possible), Render alone (whole-UI cold starts) and Vercel (no commercial use on the free plan).
  - Consequences for planning: the `googleapis` package and `pino` don't run on Workers, so Drive is called over REST with `fetch` and logs are plain structured JSON. The Anthropic SDK and `arctic` run on Workers. The Render service gets the user's Drive access token with each request so it can read uploaded files. **Verify** that Render's free tier allows commercial use.
- **D8. One step per request (KTD8) stays.** The reason is now resuming after a reload and showing progress; the Vercel time limit no longer applies. Watch the Workers request limits.
- **D9. Works without JavaScript.** Every action is a normal HTML form submission. JavaScript only adds live generation progress and inline saving on the tracker. Without it, the generation page refreshes itself to show progress.
- **D10. Sign-in and sessions.** *(Revised in planning: `arctic` was deprecated in July 2026, so `oauth4webapi` is used instead; see ADR 0002.)* `arctic` handles Google OAuth with PKCE and refresh tokens (**verify** the refresh-token support). The session is an AES-GCM encrypted cookie using Web Crypto: `HttpOnly`, `Secure`, `SameSite=Lax`, with no database. Every form that changes data carries a CSRF token. The allowlist works as in the plan. Auth.js is dropped.
- **D11. Swappable AI provider.** The AI module exposes one provider interface (roughly `generate(role, prompt, schema)`) that returns checked JSON plus token usage. Only Anthropic is built in the MVP. Other providers come in a later stage as one adapter each plus a config setting.
- **D12. Per-application cost tracking in the MVP.** Every AI step records its tokens and estimated cost on the application, and the application page shows "cost of this application". The owner's first 10 real applications set the pack prices.
- **D13. Health endpoints.** `/health` is a quick liveness check and doubles as the wake-up call. `/health/ready` also confirms Tectonic runs and secrets loaded, with no calls to Claude or Google. Both live on the Render service; the Worker has a simple `/health` of its own.
- **D14. Logging.** Structured JSON logs carry a request ID. Posting text, evidence and tokens are never logged. Logs go to the free log views of Cloudflare and Render. No outside tools.

## Quality gates

- **D15. Hooks run through lefthook.**
  - pre-commit: under 10 s. Biome format and lint on staged files, gitleaks, `tofu fmt` on staged `.tf` files, and the **sanity pack**: unit tests for the claim validator, the allowlist check and LaTeX escaping.
  - commit-msg: Conventional Commits format check.
  - pre-push: under 60 s. Full lint, `tsc --noEmit`, all unit tests, build.
- **D16. CI on GitHub Actions** (the repo is public, so minutes are free).
  - Every PR runs the same checks as pre-push, plus the Mermaid syntax check when Markdown changes and the OpenTofu checks when `infra/` changes.
  - After a merge to `main`, the **regression pack** runs, under 10 min: everything above, the compile and parsing integration test against the Render service's Docker image, the Playwright end-to-end core flow against mocks, `@axe-core/playwright` on every page, the keyboard-only flow, the page-weight budget, `pnpm audit` and `knip`.
  - A failed regression run opens a GitHub issue labelled `regression`, or comments on the existing one. It also blocks the release PR, which requires a passing regression run on the current `main`.
- **D17. Tools.** Biome for TypeScript, CSS and JSON (replacing ESLint and Prettier). `tsc --noEmit`, Vitest, Playwright and `@axe-core/playwright`, gitleaks, `pnpm audit` and `knip`. A template test renders every page and checks that form inputs have labels, images have `alt` text and each page has exactly one `<h1>`. Browser and test tools are dev dependencies only.
- **D18. No real Claude or Google calls in tests** (unchanged from KTD9).

## Workflow, versioning and releases

- **D19. `main` is protected.** Changes land only through PRs, squash-merged, with Conventional Commit PR titles.
- **D20. Semantic Versioning from `v0.1.0`**, staying below 1.0 until the MVP success criteria are met. release-please keeps a release PR open; merging it bumps the version, tags it and publishes a GitHub Release. The version is built into the app and shown in the footer and at `/version`.
- **D21. Release notes in two layers.** `CHANGELOG.md` is generated from commits. The GitHub Release body carries a plain-English "What's new" section, which the owner edits on the release PR before merging it.
- **D22. Deploys happen only from releases.** Publishing a release deploys the Worker with `wrangler` (API token in GitHub secrets) and the Render service through its deploy hook or API. There's no staging until stage 3; try changes with a local run. Rollback is one documented command per host.
- **D23. Dependabot** checks weekly, with grouped PRs for npm packages, GitHub Actions and the Docker base image. Security updates arrive right away.
- **D24. Delivery order.** A new unit, U0 (repository foundation), merges first in its own PR: project skeleton, Makefile, lefthook, empty sanity and regression packs, CI and release workflows, Dockerfile, OpenTofu skeleton, `AGENTS.md` and the docs skeleton. U1–U10 follow in a second PR.

## Infrastructure as code

- **D25. OpenTofu in `infra/`** *(Reversed in planning with the owner's approval: no infrastructure as code in the MVP; see ADR 0010.)*, using the Cloudflare and Render providers (no Google Cloud resources besides the OAuth client). State lives in a free backend. **Verify** the option; a Cloudflare R2 bucket on its free tier is the likely choice, created once by a bootstrap script.
  - Managed: the Worker, its routes and settings, the Render service, and later the D1 database.
  - Not managed:
    - The Google OAuth client and consent screen, created in the console.
    - Secret values, set with one documented command each.
    - The deployed code versions, which the release workflow sets.
- **D26. The owner applies infrastructure changes from a laptop** *(Moot while D25 is reversed.)* (`make infra-plan` and `make infra-apply`). CI never applies them. On PRs that touch `infra/`, CI runs `tofu fmt -check`, `tofu validate` and `tflint`, and posts `tofu plan` as a PR comment using read-only credentials. Agents never run `tofu apply`.

## Alerting

- **D27. Alerting is deferred to the monetization stage.** No uptime checks, alert policies, Telegram, Pub/Sub or alert emails in the MVP. GitHub's own emails about failed workflow runs are the only notifications.

## Documentation

- **D28. Diagrams are Mermaid only, in `docs/architecture.md`.** That file is the source of truth for the system's current shape; the plan and ADRs link to it. Required diagrams:
  1. System context and containers (flowchart).
  2. Google sign-in and token refresh (sequence).
  3. Per-job pipeline with checks (flowchart).
  4. One generation step with save and resume (sequence).
  5. Application status lifecycle (state).
  6. Data model (ER).
  7. Drive folder layout (flowchart).
  8. Delivery pipeline (flowchart).
  9. Infrastructure resources (flowchart).

  A PR that changes a component, flow, data shape or pipeline updates its diagram. PR CI checks Mermaid syntax with `@mermaid-js/mermaid-cli` when Markdown changes.
- **D29. The `docs/` structure:**
  - `README.md`: index.
  - `architecture.md`.
  - `setup/`: one-time setup (local dev, Google OAuth client, Cloudflare, Render, secrets, OpenTofu bootstrap).
  - `runbooks/`: release, deploy, rollback, rotate a secret, change the AI model or provider, grant credits, apply infrastructure.
  - `reference/`: environment variables, Make targets, data model, pricing and credit rules.
  - `adr/` and `plans/`.

  Docs are plain-English, step-by-step checklists written for the owner. A change that alters a setup step, command or task updates its doc in the same PR.
- **D30. `AGENTS.md`** is about 100 lines covering commands, rules (D1–D4, D18, D19, D26, D28, D29), where things live and what "done" means. It points to the plan and ADRs rather than repeating them. `CLAUDE.md` is a symlink to `AGENTS.md`.

## Monetization (product scope for later stages)

- **D31. Target markets: the United States, Canada, the United Kingdom and India.** Paying from India and Canada is a functional requirement for the open-access stage.
- **D32. Business registration is deferred.** Nothing is registered now, and the MVP charges no one. Before charging, the owner, an Indian student on a Canadian study permit, consults a licensed immigration consultant (RCIC) about whether earning income or running a business is allowed on the permit, and a cross-border Canada/India accountant about tax residency. The default plan is to sell as an individual through a merchant of record (for example Paddle, Lemon Squeezy or Dodo Payments), which collects and files US sales tax, UK VAT, Canadian GST/HST and Indian GST. Payments sit behind a provider interface so the merchant of record can be changed.
- **D33. Pricing model: free credits, then prepaid credit packs, with no subscriptions at launch.** Subscriptions are avoided because India's recurring-card rules (RBI e-mandates) make them unreliable. Packs avoid losing most of a small sale to the merchant of record's per-transaction fee. Packs are priced regionally (INR for India; USD, CAD and GBP elsewhere), and credits never expire. Placeholder prices are 5 credits at $4.99 / ₹249 and 15 credits at $11.99 / ₹599, finalized from D12's measured costs.
- **D34. One credit buys one tailored application:** the resume plus the cover letter in all three formats. It's charged only when documents are successfully saved, with up to 5 regenerations included. Hand edits, profile import and the guided interview are always free.
- **D35. Free allowance and owner controls.** Each Google account gets 3 free applications. The owner controls a global "everything free" switch, the free allowance amount and per-user credit grants. Coupons come in a later iteration as another source of credits.
- **D36. A credit ledger.** Every grant, purchase, coupon, use and refund is one row, and the balance is the sum of a user's rows. It's stored server-side in Cloudflare D1's free tier, never in the user's Drive. Built at the open-access stage; the MVP needs no database.
- **D37. Stages after the MVP:**
  - Stage 2: quality loop (unchanged).
  - Stage 3: open access, payments (D31–D36) and alerting.
  - Later iterations: coupons and other AI providers.

- **D38. MCP server in a later iteration.** Users will drive Pursuit Kit from AI coding tools (Claude Code, Codex and others) through an MCP server, with the same claim rules and credits. It gets its own ADRs when that stage is planned. From now on, every product action lives in a core layer (`src/core/`-style modules) that the web routes call and that never imports web or page code, so MCP tools can wrap the same functions later.

## Open facts for planning to verify

- Workers' free-plan CPU budget against the work left in the Worker: JSX rendering, Zod checks, crypto, Drive and Claude calls.
- Render's free tier: commercial use, the sleep and wake behaviour, and CPU speed for the compile time budget.
- The current Node LTS version.
- `arctic`'s Google refresh-token and PKCE support, and whether it runs on Workers.
- The Anthropic TypeScript SDK running on Workers.
- Whether Google OAuth with only the `drive.file` scope can open to public users without Google verification.
- A free OpenTofu state backend (R2) and the maturity of the Render OpenTofu/Terraform provider.
- release-please setup for a pnpm repo with squash merges.
