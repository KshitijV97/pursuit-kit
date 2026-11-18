# 0001. Host the app on Vercel Hobby and the LaTeX compiler on Render free

- **Status:** Superseded by [0007](0007-typescript-hono-workers-and-render-doc-service.md)
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD1)

## Context

The MVP must run on free hosting. It has two very different workloads:

- a web UI plus API routes that call Google and the AI provider (short, I/O-bound requests, a few that run 30–90 seconds while the AI writes);
- LaTeX compilation, which needs a native TeX engine and fonts that do not fit in a serverless function bundle.

Cloudflare Workers are V8 isolates and cannot run a native TeX engine. Vercel Hobby functions are free and always warm for the UI, but are not a place to install TeX. Render's free web services run any Docker image but sleep after 15 minutes idle and take up to about a minute to wake.

## Decision

- Run the Next.js app (UI and API routes) on **Vercel Hobby**.
- Run a small **compile service** (a Docker image with Tectonic) on **Render's free web service tier**. The app calls it over HTTPS with a shared secret.
- The app sends a wake-up request to the compile service (with Next.js `after()`, so it is not dropped when the response is sent) as soon as the owner pastes a job posting, and again when the strategy, documents or edit pages load. The compile client allows about 60 seconds for a cold wake.

## Consequences

- The UI never cold-starts. The first compile in a session may wait for the compile service to wake if the wake-up call came too late.
- Two deploy targets instead of one. The compile service is stateless and tiny, so it rarely changes.
- Long AI calls must finish within the Vercel function time limit. Each step (match, questions, strategy, generate, humanize, each fit attempt, save) is its own request that saves its output before returning, and the browser drives the sequence.
- Free-tier terms can change. Both pieces are standard (a Next.js app, a Docker image), so either can move host without code changes beyond configuration.

## Alternatives considered

- **Everything in one Docker container on Render free.** Simplest deploy, but the whole UI would sleep and cold-start after every 15 idle minutes.
- **Google Cloud Run for the compile service.** Starts in seconds and has a generous free tier, but needs a billing account on file. This is the fallback if Render's wake time hurts the 10-minute target.
- **Compiling LaTeX in the browser (WASM TeX).** No server needed, but a large download on every visit and fragile font handling.
- **A paid LaTeX API.** Not free.
