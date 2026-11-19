# Render setup for the doc service

Do this after the first release, not before. The doc service runs on Render's free tier and does the CPU-heavy work: the LaTeX compile and PDF/DOCX text extraction. The first release's deploy skips the Render hook with a warning, because the service does not exist yet.

You need: a Render account, the first published release, and access to the GitHub repository settings.

## 1. Wait for the first release image

1. Publish the first release. See [../runbooks/release.md](../runbooks/release.md).
2. The deploy workflow builds the doc-service image and pushes it to GitHub Container Registry (GHCR), tagged with the version.
3. Open the repository's Packages page and confirm the package exists.

## 2. Make the package public

1. Open the package settings for the doc-service image.
2. Change its visibility to public.

Render pulls the image without a registry login, so a private package will not deploy.

## 3. Create the web service

1. In Render, create a new Web Service and choose to deploy an existing image.
2. Use the GHCR image URL with the released version tag, for example `ghcr.io/<owner>/pursuit-kit-doc:v0.1.0`.
3. Choose the free instance type.
4. Set `DOC_SERVICE_SECRET` to a long random string. Use the same value you set on the Worker.
5. Deploy.

The image listens on `PORT`, which defaults to 8080. Every route except `/health` and `/health/ready` requires the shared secret.

## 4. Point the Worker at it

1. Copy the service's public URL, for example `https://pursuit-kit-doc.onrender.com`.
2. Set it on the Worker: `pnpm exec wrangler secret put DOC_SERVICE_URL`.
3. Confirm `DOC_SERVICE_SECRET` on the Worker is the same string as on Render. A mismatch returns 401 from every doc-service route.

## 5. Add the deploy hook

1. In the Render service settings, copy its deploy hook URL.
2. Add it to GitHub as the secret `RENDER_DEPLOY_HOOK_URL`.
3. From the next release on, the deploy workflow calls the hook with the new image URL. Until the secret is set, the hook step is skipped with a warning.

## 6. Check it works

1. Open `https://<your-service>.onrender.com/health`. It returns 200 without the secret. This is also the wake call.
2. Open `/health/ready`. It reports whether Tectonic runs and whether the secret is set. It needs no secret itself.
3. In the app, paste a posting and let a generation run. The first compile may show a waking message.
4. In Render's log view, confirm requests arrive and carry no posting text, evidence or tokens.

## What the free tier means day to day

- The service sleeps after 15 idle minutes.
- Waking takes up to about a minute.
- The app wakes it when a posting is pasted and when the strategy, documents and edit pages load, so the wait usually overlaps with your own reading.
- The doc-service client waits through a slow wake instead of failing.
- The free tier allows 5 GB of outbound transfer a month. A few MB per application is well inside that.

## If the deploy fails

- An image pull error means the package is still private, or the tag does not exist.
- A 401 from every route means the two `DOC_SERVICE_SECRET` values differ.
- A compile route that times out is a stop condition in the plan. Note the timing and stop rather than raising the instance type, because a paid plan adds a recurring cost (R26).
