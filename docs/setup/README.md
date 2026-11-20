# Owner setup

These steps need your accounts. They are tracked as GitHub issues labelled [`owner-setup`](https://github.com/KshitijV97/pursuit-kit/issues?q=is%3Aissue+is%3Aopen+label%3Aowner-setup), so the open list and its current state live there rather than in a file that drifts.

The docs in this folder hold the instructions. The issue holds the state and the stage it blocks. When a step is done, close its issue; anyone can then see what is still outstanding.

## Open steps

| Issue | Blocks | Instructions |
|---|---|---|
| #15 Create the Google OAuth client | U1 sign-in, and the manual smoke any sign-in change needs | [google-oauth.md](google-oauth.md) |
| #16 Set `SESSION_KEY` and `ALLOWED_EMAILS` | U1, from the first sign-in | [secrets.md](secrets.md) |
| #17 Anthropic key and monthly spend limit | U3 and every real generation; starts a recurring cost | [../runbooks/change-ai-model.md](../runbooks/change-ai-model.md) |
| #18 Cloudflare account and deploy secrets | The first deploy, and U10's CPU-time check in Workers Logs | [cloudflare.md](cloudflare.md) |
| #19 Point the app at a local doc service | U7 and U8 compile smoke locally | [local-dev.md](local-dev.md) |
| #20 GitHub App for release-please | The first release | [github-app-for-releases.md](github-app-for-releases.md) |
| #21 Render service | The doc service in production, after the first release | [render.md](render.md) |

## Already done

- Node 26, pnpm through corepack, Docker Desktop, gitleaks and lefthook: [local-dev.md](local-dev.md).
- Playwright browsers: `pnpm exec playwright install chromium`.
- Branch protection and merge settings on GitHub (#22): [github-repo-settings.md](github-repo-settings.md).

## Why issues rather than a checklist file

- Closing the issue is the status change, so there is one place to look and nothing to keep in sync.
- Issues survive context loss, are searchable, and can be named in a PR description.
- The instructions stay in `docs/`, where they belong; the issue links to them and says what the step unblocks, so the two cannot drift apart.
