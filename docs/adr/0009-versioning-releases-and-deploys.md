# 0009. Semantic Versioning with release-please, and deploys only from releases

- **Status:** Accepted
- **Date:** 2026-11-18
- **Plan:** [docs/plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md](../plans/2026-11-18-1641-feat-pursuit-kit-mvp-plan.md) (KTD12)
- **Decisions:** [docs/brainstorms/2026-11-18-technical-setup-decisions.md](../brainstorms/2026-11-18-technical-setup-decisions.md) (D19–D23)

## Context

The owner wants proper versioning based on releases, release notes, and production that changes only on purpose. There's one developer, a public GitHub repo and no staging environment.

## Decision

- **Branching:** `main` is protected. Changes land through squash-merged PRs whose titles follow Conventional Commits.
- **Versions:** Semantic Versioning from `v0.1.0`, staying below 1.0 until the MVP's success criteria are met.
- **Release PR:** **release-please-action v5** (`release-type: node`, manifest config) keeps a release PR open. Merging it bumps the version, updates `CHANGELOG.md`, tags the commit and publishes a GitHub Release.
- **Token:** the action runs with a **GitHub App token**. PRs opened with the default `GITHUB_TOKEN` don't trigger CI, so the required `regression-gate` check would never run on the release PR. The owner creates the App once (`docs/setup/github-app-for-releases.md`).
- **Release notes in two layers:**
  - the generated `CHANGELOG.md`;
  - a plain-English "What's new" section the owner writes in the release PR body before merging. The GitHub Release body comes from that PR body, and any push to `main` regenerates it, so the owner edits it last.
- **Deploys happen only when a release is published:**
  - the Worker deploys with `wrangler`;
  - the doc-service image is built, tagged with the version, pushed to GitHub Container Registry (free for public packages) and deployed by calling Render's deploy hook with that image.
- **Version display:** the version is built into the app and shown in the footer and at `/version`.
- **Rollback:** redeploy the previous tag on each host, one documented command each (`docs/runbooks/rollback.md`).
- **Updates:** Dependabot opens grouped weekly PRs for npm packages, GitHub Actions and the Docker base image. Security updates come right away.

## Consequences

- Production always matches a tagged, regression-passed commit.
- There's no staging. Changes are tried locally before release. A staging Worker can be added at stage 3 for little extra cost.
- The GitHub App's private key is a secret to keep and rotate.

## Alternatives considered

- **Deploying on every merge.** Simpler, but production would change without a release note or version.
- **Manual tags with a hand-written changelog.** Easy to forget, and inconsistent.
- **A personal access token for release-please.** Works, but expires and is tied to the person. A GitHub App token is scoped to the repo.
