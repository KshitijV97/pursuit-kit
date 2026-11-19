# Secrets and where they live

Every secret lives in one of four places. Never commit a secret. Only `.dev.vars.example` is committed, and it holds no real values.

| Place              | Used by                        | How you set it                                                            |
| ------------------ | ------------------------------ | ------------------------------------------------------------------------- |
| `.dev.vars`        | `wrangler dev` on your machine | Copy `.dev.vars.example` and fill it in                                   |
| Worker secrets     | the deployed Worker            | `pnpm exec wrangler secret put <NAME>`                                    |
| GitHub secrets     | Actions workflows              | Repository or `production` environment secrets in the repository settings |
| Render environment | the doc service                | Environment variables on the Render service                               |

[reference/env-vars.md](../reference/env-vars.md) has the full table, with an example and a meaning for each name.

## Worker secrets

Set each with `wrangler secret put`:

| Name                   | What breaks without it                                                  |
| ---------------------- | ----------------------------------------------------------------------- |
| `SESSION_KEY`          | No session cookie can be sealed or opened, so nobody can stay signed in |
| `GOOGLE_CLIENT_ID`     | Sign-in cannot build the authorization URL                              |
| `GOOGLE_CLIENT_SECRET` | The code exchange fails, so sign-in never completes                     |
| `ALLOWED_EMAILS`       | The allowlist is empty, so everyone is denied                           |
| `ANTHROPIC_API_KEY`    | Every AI step fails                                                     |
| `DOC_SERVICE_URL`      | The app cannot reach the doc service for extraction or compiles         |
| `DOC_SERVICE_SECRET`   | The doc service rejects every call with 401                             |

`SESSION_KEY` must be 32 random bytes, base64 encoded. Generate it with `openssl rand -base64 32`.

These are set from [cloudflare.md](cloudflare.md). `DOC_SERVICE_URL` and `DOC_SERVICE_SECRET` get their real values from [render.md](render.md), after the first release.

## GitHub secrets

| Name                      | Used by             | Notes                                                                                     |
| ------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`    | the deploy workflow | Workers Scripts edit permission                                                           |
| `CLOUDFLARE_ACCOUNT_ID`   | the deploy workflow | Your Cloudflare account ID                                                                |
| `RELEASE_APP_ID`          | release-please      | The GitHub App's ID                                                                       |
| `RELEASE_APP_PRIVATE_KEY` | release-please      | The App's `.pem` contents, including the BEGIN and END lines                              |
| `RENDER_DEPLOY_HOOK_URL`  | the deploy workflow | Added after the Render service exists; the hook step is skipped with a warning until then |

The plan lists these as repository secrets, and also states that deploy secrets live in the `production` environment. Follow the workflow: add a secret to the `production` environment when the job reads it from there, and keep the release-please secrets as repository secrets because that workflow runs on every push to `main`, outside any environment.

## Render environment

| Name                 | Notes                                          |
| -------------------- | ---------------------------------------------- |
| `DOC_SERVICE_SECRET` | Must be the same string as the Worker's secret |
| `PORT`               | Optional. Defaults to 8080                     |

## What is not a secret

- `GOOGLE_CLIENT_ID` is not sensitive on its own, but keep it out of the code. It lives in `.dev.vars` and as a Worker secret, next to its secret.
- `ALLOWED_EMAILS` is not a credential, but it is personal data. Treat it as a secret and set it with `wrangler secret put`.
- `AI_MODEL_EXTRACTION`, `AI_MODEL_WRITING`, `AI_PRICE_TABLE`, `APP_ENV`, `APP_VERSION`, `DOC_SERVICE_URL` and `FAKE_EXTERNALS` are configuration, not credentials. None of them belongs in a secret store unless the deployment already treats it as one.

## Local file

`.dev.vars` holds the same names for `wrangler dev`. It is git-ignored. Back it up somewhere safe, because losing `SESSION_KEY` signs you out, and losing `GOOGLE_CLIENT_SECRET` means creating a new client secret.

## Rotating a secret

[../runbooks/rotate-secret.md](../runbooks/rotate-secret.md) has the steps for `SESSION_KEY`, `GOOGLE_CLIENT_SECRET`, `DOC_SERVICE_SECRET`, `ANTHROPIC_API_KEY` and the GitHub App private key. Rotate `SESSION_KEY` only when you need to, because it signs everyone out.

## If a secret leaks

1. Revoke it at the source first: Google Cloud, Anthropic, Cloudflare, GitHub or Render.
2. Set the new value everywhere it lives, using the tables above.
3. Release so the Worker picks up the new value, or restart the Render service.
4. Check the logs for use of the old value.
