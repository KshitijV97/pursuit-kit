# Deploy a release

Use this to understand what happens when a release is published, and to check that it worked. You do not run the deploy by hand.

## What starts it

The `deploy.yml` workflow runs on `release: published`, which happens when you merge the release pull request. See [release.md](release.md).

Before deploying, the workflow checks again that the regression pack passed for the released commit's parent. A failing regression blocks the deploy.

## What the workflow does

1. Deploys the Worker with `wrangler`, using `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The version is injected at build time, so the footer and `/version` show the release version instead of `dev`.
2. Builds the doc-service image from `services/doc/Dockerfile`, tags it with the release version, and pushes it to GitHub Container Registry.
3. Calls Render's deploy hook with the new image URL, using `RENDER_DEPLOY_HOOK_URL`.
4. Skips the Render step with a warning when `RENDER_DEPLOY_HOOK_URL` is unset. This is expected before the Render service exists, which is the first release.

Third-party actions are pinned to commit SHAs. The workflow declares least-privilege permissions. Deploy secrets live in the `production` environment.

## Check the Worker

1. Open `https://<worker-name>.<account>.workers.dev/version`. It returns the released version, for example `0.1.0`.
2. Open the home page. The footer shows the same version.
3. Open `/health`. It answers.
4. Sign in and open one application.

## Check the doc service

1. Open `https://<your-service>.onrender.com/health`. It returns 200 without the secret.
2. Open `/health/ready`. It reports whether Tectonic runs and whether the secret is set. It needs no secret itself.
3. In the app, run one generation. A compile that works means the whole path is live.
4. Render's dashboard shows the deployed image tag. It should match the release version.

## Check the logs

1. Cloudflare Workers Logs show requests with a request ID.
2. Render's log view shows doc-service requests.
3. Neither log contains posting text, evidence or tokens.

## If the workflow fails

- A `wrangler` authentication error means `CLOUDFLARE_API_TOKEN` is missing, expired or lacks the Workers Scripts edit permission.
- A build failure means the code does not build. Run `make check` locally, fix, and land a new commit and release.
- A GHCR push failure usually means the workflow's package permission is wrong. Do not add a personal token; fix the permission.
- A Render hook failure means `RENDER_DEPLOY_HOOK_URL` is wrong. Copy it again from the Render service settings.
- A Worker that deploys but errors at runtime usually has a missing Worker secret. See [../setup/secrets.md](../setup/secrets.md).

## Rolling back

If the deploy is live but wrong, follow [rollback.md](rollback.md). Do not re-run an old workflow by hand.
