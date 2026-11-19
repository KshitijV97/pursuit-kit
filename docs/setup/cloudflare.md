# Cloudflare setup

Do this once. The app runs on the Cloudflare Workers free plan. The free plan needs no card, has no fixed monthly cost and allows commercial use (R26).

You need: a Cloudflare account, and access to the GitHub repository settings.

## 1. Create the account

1. Sign up at Cloudflare.
2. Add no payment method. The Worker must stay on the free plan.

## 2. Create an API token for deploys

The deploy workflow uses this token to publish the Worker with `wrangler`.

1. In the Cloudflare dashboard, open My Profile, then API Tokens, then Create Token.
2. Start from a template or a custom token.
3. Give it the Workers Scripts edit permission. Nothing else is needed.
4. Create the token and copy it once. You cannot see it again.
5. Copy your account ID from the dashboard's overview page.

## 3. Add the two secrets to GitHub

1. Add `CLOUDFLARE_API_TOKEN` with the token from step 2.
2. Add `CLOUDFLARE_ACCOUNT_ID` with your account ID.
3. These are repository secrets (or secrets on the `production` environment, if the workflow reads them from there). [secrets.md](secrets.md) records where each one lives.

The deploy workflow only runs when a release is published. [../runbooks/deploy.md](../runbooks/deploy.md) explains what it does.

## 4. Set the Worker secrets

Secrets are never stored in `wrangler.toml`. Set each one with `wrangler secret put`:

1. `SESSION_KEY`
2. `GOOGLE_CLIENT_ID`
3. `GOOGLE_CLIENT_SECRET`
4. `ALLOWED_EMAILS`
5. `ANTHROPIC_API_KEY`
6. `DOC_SERVICE_URL`
7. `DOC_SERVICE_SECRET`

For example: `pnpm exec wrangler secret put SESSION_KEY`. Wrangler prompts for the value and stores it on the Worker.

Notes:

- `SESSION_KEY` must be 32 random bytes, base64 encoded. [local-dev.md](local-dev.md) shows the command to generate it.
- Use the same `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as your local `.dev.vars`, so one OAuth client covers both places.
- `ALLOWED_EMAILS` is comma-separated, holds only Google-verified addresses, and in the MVP holds only your own email.
- `DOC_SERVICE_URL` and `DOC_SERVICE_SECRET` only have real values once the Render service exists. [render.md](render.md) covers that, after the first release.
- Set all seven before the first release deploys, or the Worker will fail at runtime.

## 5. Note your Worker URL

1. The Worker is named in `wrangler.toml`, with `workers_dev = true`.
2. Its URL is `https://<worker-name>.<account>.workers.dev`.
3. That URL is one of the Google redirect URIs. Put it in the OAuth client: see [google-oauth.md](google-oauth.md).

## 6. Check it works

After the first release has deployed:

1. Open `https://<worker-name>.<account>.workers.dev/version`. It returns the released version, not `dev`.
2. Open `/health`. It answers.
3. Open the home page and sign in.
4. In Workers Logs, confirm requests appear and that no posting text, evidence or tokens are in them.

If the Worker returns an error about a missing variable, one of the seven secrets is unset. Set it and redeploy, or ask for a new release.
