# 0007. TypeScript and Hono on Cloudflare Workers, with a doc service on Render, at zero fixed cost

- **Status:** Accepted. Supersedes [0001](0001-hosting-vercel-app-render-compile-service.md).
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD1, KTD8)
- **Decisions:** [docs/brainstorms/2026-11-18-technical-setup-decisions.md](../brainstorms/2026-11-18-technical-setup-decisions.md) (D1, D4–D9, D13, D14)

## Context

The owner set four constraints after the first plan:
- **$0 fixed monthly cost.** Only AI usage and future payment fees are allowed, and there's no card on file (R26).
- **Hosts must allow commercial use**, because the product will be monetized.
- **Pages must be light and work without JavaScript** (R25).
- **The stack must be one the owner can maintain.** The owner is most comfortable in TypeScript.

ADR 0001's Next.js on Vercel Hobby fails three of these: Hobby forbids commercial use, Next.js's baseline JavaScript breaks the 30 KB budget, and the framework is heavier than this app needs.

## Decision

- **App:** TypeScript with **Hono**, with pages rendered on the server using Hono's JSX. No React runs in the browser, and a few small enhancement scripts are bundled with esbuild. pnpm manages packages, and Node 26 LTS is used for tooling and the doc service.
- **Hosting the app:** the **Cloudflare Workers free plan**. Its limits are 10 ms of CPU per request (network waits don't count), no wall-clock cap while the client is connected, a 100 MB request body and 100k requests a day. It needs no card and allows commercial use.
- **Doc service:** a Docker image (Node 26, Hono, Tectonic, `unpdf`, `mammoth`) on **Render's free tier**. It runs everything CPU-heavy: LaTeX compiles and PDF/DOCX text extraction.
  - It has `/health` (the wake call) and `/health/ready`.
  - Every other route needs a shared secret.
- **Waking the doc service:** the app wakes it, using `waitUntil`, when a posting is pasted and when the strategy, documents and edit pages load. Render sleeps after 15 idle minutes and takes up to about a minute to wake.
- **Long work:** each step (one AI call or one compile) is its own request through an idempotent advance endpoint driven by a run token. The progress page uses a script when JavaScript is available. Without it, a `<noscript>` 0-second meta refresh plus a Continue link drive the steps (plan KTD8). A step lease in `application.json` stops a reload or second tab from paying for the same step twice. Uploads stream through the Worker to the doc service, which writes them to Drive (ADR 0003).
- **Logs:** structured JSON with a request ID, viewed in Workers Logs and Render's log view. Posting text, evidence and tokens are never logged.

## Consequences

- The UI never cold-starts. The first compile after a quiet period may wait for Render to wake.
- There are two deploy targets. The doc service is stateless and rarely changes.
- The 10 ms CPU limit shapes the code. Parsing and compiling stay on the doc service, and each request does one step.
- Render's free tier allows 5 GB of outbound transfer a month and advises against production use. That's enough for the MVP. The owner will pay for Render at stage 3.
- Libraries must run on Workers. Drive is called over REST with `fetch` (ADR 0003), and sign-in uses `oauth4webapi` (ADR 0002).
- Stage 3 needs a database for the credit ledger. Cloudflare D1's free tier fits this setup.

## Alternatives considered

- **Next.js on Vercel Hobby (ADR 0001).** No commercial use, and too much baseline JavaScript.
- **Go with `html/template`.** Very light, but the owner maintains TypeScript more comfortably.
- **Google Cloud Run free tier.** The best developer experience, but it needs a card, and charges are possible.
- **One container on Render free.** Truly $0, but the whole UI would cold-start after every idle period.
- **Astro.** Ships no JavaScript by default, but brings a Vite toolchain this app doesn't need.
