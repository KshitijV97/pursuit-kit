# Pursuit Kit documentation

This folder holds the written record of how Pursuit Kit works and how to run it. Start with [architecture.md](architecture.md) to see the system's shape, then use the folder that matches what you need.

Pursuit Kit is a single-user web app that turns a job posting into a tailored resume and cover letter. Every claim in the output traces back to evidence you recorded. Storage is your own Google Drive, and there is no database.

## What each folder holds

- `setup/`: one-time setup. Follow these once per machine or account. Open steps are GitHub issues labelled `owner-setup`; [setup/README.md](setup/README.md) lists them and what each blocks.
  - [local-dev.md](setup/local-dev.md): Node 26, pnpm, Docker, gitleaks, lefthook, and your local secrets.
  - [google-oauth.md](setup/google-oauth.md): the Google Cloud project, the OAuth client and its scopes.
  - [cloudflare.md](setup/cloudflare.md): the Cloudflare account, API token and Worker secrets.
  - [render.md](setup/render.md): the doc service on Render, done after the first release.
  - [github-app-for-releases.md](setup/github-app-for-releases.md): the GitHub App that release-please uses.
  - [github-repo-settings.md](setup/github-repo-settings.md): merge settings and branch protection on `main`.
  - [secrets.md](setup/secrets.md): every variable and secret, and where it lives.
- `runbooks/`: repeatable tasks. Follow these each time you do the task.
  - [release.md](runbooks/release.md): cut a release with release-please.
  - [deploy.md](runbooks/deploy.md): what the deploy workflow does and how to check it.
  - [rollback.md](runbooks/rollback.md): put the previous version back on each host.
  - [rotate-secret.md](runbooks/rotate-secret.md): replace a secret safely.
  - [change-ai-model.md](runbooks/change-ai-model.md): change the model used for extraction or writing.
  - [update-price-table.md](runbooks/update-price-table.md): keep the token price table current.
- `reference/`: facts you look up rather than follow.
  - [env-vars.md](reference/env-vars.md): every environment variable and secret.
  - [make-targets.md](reference/make-targets.md): every Make target and what it runs.
  - [data-model.md](reference/data-model.md): the JSON files in your Drive.
- `adr/`: architecture decision records. Each one records a decision and why it was made, in numbered form. The [decisions index](#architecture-decisions) below lists them.
- `plans/`: the current product and technical plan, [2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md). It holds the requirements (R1–R27), the acceptance examples (AE1–AE12), the key technical decisions (KTD1–KTD15) and the implementation units (U0–U10).
- `brainstorms/`: the settled setup decisions behind the plan, [2026-11-18-technical-setup-decisions.md](brainstorms/2026-11-18-technical-setup-decisions.md) (D1–D38).

## Where the rules live

- [architecture.md](architecture.md) is the source of truth for the system's current shape. It holds the Mermaid diagrams, and no other file keeps a second copy.
- [../AGENTS.md](../AGENTS.md) is the instruction file for any coding agent. `CLAUDE.md` is a symlink to it.
- The plan wins on product behaviour and mechanism. The ADRs record why. Where a doc and the plan disagree, the plan wins and the doc is wrong.

## Architecture decisions

- [0001](adr/0001-hosting-vercel-app-render-compile-service.md): hosting on Vercel and Render. Superseded by 0007.
- [0002](adr/0002-google-sign-in-allowlist-cookie-session.md): Google sign-in, allowlist and cookie session.
- [0003](adr/0003-drive-file-scope-and-visible-data-layout.md): the `drive.file` scope and the visible Drive folder.
- [0004](adr/0004-claude-api-structured-generation-with-evidence-links.md): structured AI generation with evidence links.
- [0005](adr/0005-tectonic-latex-compile-and-page-fit-loop.md): Tectonic compile and the page-fit loop.
- [0006](adr/0006-google-doc-via-html-conversion.md): the Google Doc is made from HTML.
- [0007](adr/0007-typescript-hono-workers-and-render-doc-service.md): TypeScript and Hono on Workers, with a doc service on Render.
- [0008](adr/0008-quality-gates-and-test-packs.md): hooks, the sanity pack and the regression pack.
- [0009](adr/0009-versioning-releases-and-deploys.md): Semantic Versioning, release-please and deploys from releases.
- [0010](adr/0010-no-infrastructure-as-code-in-mvp.md): no infrastructure as code in the MVP.
- [0011](adr/0011-accessibility-and-page-weight-budgets.md): WCAG 2.2 AA and page-weight budgets.
- [0012](adr/0012-docs-and-mermaid-diagrams.md): this docs layout and Mermaid-only diagrams.
- [0013](adr/0013-core-product-layer.md): the core product layer that a later MCP server can reuse.

## Rule: docs move with code

A change to a component, flow, data shape, pipeline, setup step, command or repeatable task updates the matching diagram in [architecture.md](architecture.md) or the matching doc here, in the same pull request. Diagrams are Mermaid only. Docs are plain English checklists written for you, the owner.

If a key technical decision changes, update its ADR in the same change.
