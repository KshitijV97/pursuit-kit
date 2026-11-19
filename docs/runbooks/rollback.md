# Roll back a release

Use this when a release is live and wrong, and you need the previous version back now. Roll back first, then fix forward with a new patch release.

Both hosts keep their own history. Roll back each one.

## Before you start

- Note the version that is live now, from `/version` on the Worker.
- Note the version you want, from the Releases page or `CHANGELOG.md`.
- You need the `production` secrets locally for the Worker command: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## 1. Roll back the Worker

The Worker keeps its previous deployments. One command goes back one step:

1. Run `pnpm exec wrangler rollback`.
2. If you need to go back further, list the deployments with `pnpm exec wrangler deployments list`, then run `pnpm exec wrangler rollback <deployment-id>`.

This changes the live Worker only. It does not create a release, and it does not change the tags.

## 2. Roll back the doc service

The Render service runs a tagged image. You point it back at the previous tag.

1. In the Render dashboard, open the doc service, then Settings, then the image setting.
2. Set the tag to the previous version, for example `ghcr.io/<owner>/pursuit-kit-doc:v0.1.0`.
3. Trigger a deploy with the deploy hook: `curl -X POST "$RENDER_DEPLOY_HOOK_URL"`.
4. Wait for the service to finish deploying. A sleeping free service takes up to about a minute to answer.

The deploy hook deploys whichever image the service is set to, so change the tag before calling it.

## 3. Verify

1. Open `https://<worker-name>.<account>.workers.dev/version`. It returns the older version.
2. Open the home page. The footer shows the same older version.
3. Open `https://<your-service>.onrender.com/health`. It answers.
4. Open `/health/ready` with the secret. It reports Tectonic as available.
5. Sign in and open one application. If anything fails, check the Worker secrets first.

## 4. Fix forward

1. Fix the problem on a branch.
2. Land it with a `fix:` commit, so the next release is a patch bump.
3. Cut a release with [release.md](release.md). That deploy brings both hosts forward again.

## What not to do

- Do not delete or move the release tag.
- Do not hand-edit the deployed files.
- Do not roll back the Worker and leave the doc service on the newer image without checking that the two still agree on the shared secret and the request shape. If the release changed the doc-service API, roll both back.
