# AGENTS.md

Instructions for any coding agent working in this repo. `CLAUDE.md` is a symlink to this file; edit this one.

Pursuit Kit is a single-user web app that turns a job posting into a tailored resume and cover letter (LaTeX, Google Doc, PDF), with every claim traced to the owner's recorded evidence, plus an application tracker. Storage is the owner's Google Drive. There is no database.

## Status

U0 (repository foundation, PR 1) is in place: tooling, Make targets, the Worker hello page, the doc-service health checks, the CI and regression workflows, and the docs skeleton. U1–U10 follow in PR 2. A command listed here exists unless the unit that adds it has not landed yet; when a unit changes a command, update this file in the same PR.

## Sources of truth

Read the relevant source before changing behaviour. Where they disagree, this order wins:

1. `docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md`: Product Contract (R1–R27, AE1–AE12) wins on product behaviour; Key Technical Decisions (KTD1–KTD15) win on mechanism; Implementation Units (U0–U10) give files, tests and verification per unit.
2. `docs/adr/`: why each KTD was chosen. Changing a KTD means updating its ADR in the same change.
3. `docs/brainstorms/2026-11-18-technical-setup-decisions.md` (D1–D38): owner-settled setup decisions. The plan's KTDs record where planning deliberately changed one (KTD2, KTD13).
4. `docs/architecture.md`: Mermaid diagrams of the system's current shape.

## Stop and ask

Stop and ask the owner before:

- adding anything with a recurring cost, or a host that forbids commercial use (D1, D4);
- requesting any Google scope wider than `drive.file`;
- a step that still exceeds the Workers 10 ms CPU limit after its heavy work moves to the doc service;
- anything needing the owner's accounts (Google Cloud, Cloudflare, Render, GitHub App, Anthropic). Those steps are GitHub issues labelled `owner-setup`; `docs/setup/` holds the instructions. Check the open issues before assuming a step is missing.

## Stack

- App: TypeScript, Hono with server-rendered JSX on the Cloudflare Workers free plan. No React or framework in the browser; a few small enhancement scripts bundled with esbuild.
- Doc service (`services/doc/`): Hono on Node in Docker on Render's free tier, running Tectonic and PDF/DOCX text extraction.
- Node 26 (Active LTS, pinned in `.nvmrc`), pnpm via corepack. Node's type stripping runs the code, so write TypeScript without enums or tsconfig `paths`.
- Google OAuth via `oauth4webapi`; session in an AES-GCM encrypted cookie. Drive via REST with `fetch` (`googleapis` and `pino` don't run on Workers).
- AI through one provider interface (`generate(role, prompt, schema)` returning Zod-checked JSON plus token counts); only the Anthropic adapter exists. Model IDs and prices come from config.

## Where things live

- `src/core/`: every product action and the claim rules. Receives one explicit context (user, Drive client, AI provider, doc-service client, clock, config). Imports nothing from `hono` or `src/web/`; Biome enforces this.
- `src/web/`: routes, JSX views, CSS, enhancement scripts. Parses the request, calls core, renders. Holds no product logic.
- `src/adapters/`: drive, ai (provider, anthropic), docservice, google-oauth.
- `src/platform/`: session crypto, CSRF, config, logging, version.
- `services/doc/`: the doc service and its Docker integration tests.
- `tests/fixtures/` (recorded AI and Drive responses, sample inputs), `tests/e2e/` (Playwright).
- `scripts/`: the page-budget check and the Mermaid renderer used by the gates.
- `.github/`: CI, regression, docs, release and deploy workflows; Dependabot; PR template.
- `docs/`: `setup/` one-time checklists, `runbooks/` repeatable tasks, `reference/` env vars, Make targets, data model; `adr/`, `plans/`, `brainstorms/`.

## Commands

Use the Make targets; they wrap the pnpm scripts.

- `make install`: `pnpm install`, which also runs the `prepare` script that installs the hooks.
- `make sanity`: pre-commit pack (hello-page smoke test, version resolution, budget and Mermaid extraction tests; later units add the claim validator, allowlist, LaTeX escaping), under 10 s.
- `make lint`, `make typecheck`, `make test`, `make build`.
- `make check`: the pre-push gate (lint, typecheck, unit tests, build), under 60 s.
- `make docs-check`: renders every Mermaid diagram in `docs/`; needs `@mermaid-js/mermaid-cli`.
- `make doc-service-test`, `make e2e`, `make budget`, `make knip`, `make audit`.
- `make regression`: everything the post-merge regression pack runs.
- Local app: `make dev` (`wrangler dev`, port 8787). Secrets template: `.dev.vars.example`.
- Local doc service: `docker build -f services/doc/Dockerfile -t pursuit-kit-doc .` then `docker run --rm -p 8080:8080 -e DOC_SERVICE_SECRET=dev pursuit-kit-doc`. `make doc-service-test` runs its tests with real Tectonic.

## Rules

- **Accuracy first.** Every generated claim carries evidence IDs, checked by the deterministic validator in `src/core/claims/`. Do-not-claim items never reach output. Priority order: accuracy, relevance, impact, keyword match, brevity.
- **The app is the master copy.** `application.json` holds one content model; LaTeX, HTML and the Google Doc are pure renders of it. Escape every user value in LaTeX.
- **One step per request.** Long work runs through the idempotent advance endpoint (KTD8): one AI call or one compile per request, with a step lease saved before the work starts.
- **Tests use fakes.** No test calls the real AI provider, Google or the deployed doc service. App tests run in the Workers pool; e2e runs against `wrangler dev` with `FAKE_EXTERNALS`.
- **Lightweight.** System fonts, no CSS or frontend framework. Each page stays under 30 KB gzipped script and 20 KB gzipped CSS. Every new dependency gets a one-line reason in its PR.
- **Works without JavaScript.** Every action is a plain HTML form post; JavaScript only enhances.
- **Logs** are structured JSON with a request ID. Posting text, evidence and tokens stay out of logs.
- **Secrets** live in `.dev.vars` locally and in Wrangler, GitHub and Render secrets. Commit only `.dev.vars.example`.
- **Docs move with code.** A change to a component, flow, data shape, pipeline, setup step, command or repeatable task updates the matching diagram in `docs/architecture.md` or doc in `docs/` in the same PR. Diagrams are Mermaid only. Docs are plain English checklists written for the owner.

## Accessibility checklist (WCAG 2.2 AA)

axe, keyboard and no-JavaScript tests run in the regression pack. Also check by hand on any page you touch:

- One `<h1>`; headings in order; skip link and landmarks from the shared layout.
- Every input has a visible label; errors use the shared error summary, link to their field and are tied with `aria-describedby`.
- State and errors are shown in text as well as colour; contrast meets AA.
- Every control works with the keyboard alone, with a visible focus indicator.
- Images have meaningful `alt` text, or empty `alt` when decorative.

## Git workflow

- `main` is protected. Work on a branch; changes land by squash-merged PR.
- Commit messages and PR titles follow Conventional Commits (the commit-msg hook checks). release-please builds versions and `CHANGELOG.md` from them.
- Deploys happen only from published releases. Agents don't deploy, publish releases or set production secrets.

## Done means

- The unit's test scenarios from the plan exist and pass, and `make check` is green.
- Docs, diagrams, ADRs and this file match what was built.
- `knip` passes: no unused code, dependencies or commented-out experiments left behind.
- The PR description records a manual smoke run against real services when the change touches sign-in, Drive, AI or the doc service.
