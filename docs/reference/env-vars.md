# Environment variables and secrets

Every variable the app, the doc service or a workflow reads. [../setup/secrets.md](../setup/secrets.md) covers where secret values live and how to set them.

## Application variables

These are read by the Worker. Locally they come from `.dev.vars`; when deployed they come from `wrangler.toml` `[vars]` or from a Worker secret.

| Name                   | Example                                | Where set                                      | Required             | Meaning                                                                                                            | Secret |
| ---------------------- | -------------------------------------- | ---------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------ | ------ |
| `APP_ENV`              | `production`                           | `wrangler.toml` `[vars]` (development); the deploy workflow sets `production`; `.dev.vars` locally | Yes                  | Which environment this is. `development` locally, `production` when deployed.                                      | No     |
| `APP_VERSION`          | `0.1.0`                                | Injected at build time by the deploy workflow  | No                   | Version shown in the footer and returned by `/version`. Defaults to `dev`.                                         | No     |
| `FAKE_EXTERNALS`       | `true`                                 | Test configuration only: vitest and `make e2e` | No                   | Replaces the real AI, Google and doc-service clients with recorded fakes. Never set in production.                 | No     |
| `SESSION_KEY`          | 32 random bytes, base64                | `.dev.vars`; Worker secret                     | Yes                  | AES-GCM key that seals the session cookie. Changing it signs everyone out.                                         | Yes    |
| `GOOGLE_CLIENT_ID`     | `1234-abc.apps.googleusercontent.com`  | `.dev.vars`; Worker secret                     | Yes                  | The OAuth client ID.                                                                                               | No     |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...`                           | `.dev.vars`; Worker secret                     | Yes                  | The OAuth client secret, used in the code exchange and refresh.                                                    | Yes    |
| `ALLOWED_EMAILS`       | `owner@example.com`                    | `.dev.vars`; Worker secret                     | Yes                  | Comma-separated list of Google-verified email addresses allowed to sign in. In the MVP it holds only your address. | Yes    |
| `ANTHROPIC_API_KEY`    | `sk-ant-...`                           | `.dev.vars`; Worker secret                     | Yes                  | Pays for every AI call. Set a monthly spend limit in the Anthropic console.                                        | Yes    |
| `AI_MODEL_EXTRACTION`  | `claude-haiku-5-5`                     | `wrangler.toml` `[vars]`; `.dev.vars` locally  | No                   | Model for extraction steps. This is the default.                                                                   | No     |
| `AI_MODEL_WRITING`     | `claude-sonnet-5-5`                    | `wrangler.toml` `[vars]`; `.dev.vars` locally  | No                   | Model for writing steps. This is the default.                                                                      | No     |
| `AI_PRICE_TABLE`       | JSON, see below                        | `wrangler.toml` `[vars]`; `.dev.vars` locally  | Yes for cost records | Per-model input and output prices per million tokens.                                                              | No     |
| `DOC_SERVICE_URL`      | `https://pursuit-kit-doc.onrender.com` | `.dev.vars`; Worker secret                     | Yes                  | Base URL of the doc service. Locally `http://127.0.0.1:8080`.                                                      | No     |
| `DOC_SERVICE_SECRET`   | a long random string                   | `.dev.vars`; Worker secret; Render environment | Yes                  | Shared secret between the Worker and the doc service. Every doc-service route except `/health` requires it.        | Yes    |

## Doc service variables

These are read only by the service in `services/doc/`.

| Name                 | Example              | Where set                            | Required | Meaning                                                        | Secret |
| -------------------- | -------------------- | ------------------------------------ | -------- | -------------------------------------------------------------- | ------ |
| `PORT`               | `8080`               | Render environment; local Docker run | No       | Port the doc service listens on. Defaults to 8080.             | No     |
| `DOC_SERVICE_SECRET` | a long random string | Render environment; local Docker run | Yes      | The same value as the Worker's secret. A mismatch returns 401. | Yes    |

## GitHub-only secrets

These are never read by the app. They belong to the workflows.

| Name                      | Example                             | Where set                                            | Required         | Meaning                                                                              | Secret |
| ------------------------- | ----------------------------------- | ---------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------ | ------ |
| `CLOUDFLARE_API_TOKEN`    | a token value                       | GitHub repository or `production` environment secret | Yes for deploys  | Deploys the Worker. Needs the Workers Scripts edit permission.                       | Yes    |
| `CLOUDFLARE_ACCOUNT_ID`   | a 32-character hex ID               | GitHub repository or `production` environment secret | Yes for deploys  | Tells `wrangler` which account to deploy to.                                         | No     |
| `RELEASE_APP_ID`          | `123456`                            | GitHub repository secret                             | Yes for releases | The GitHub App used by release-please.                                               | No     |
| `RELEASE_APP_PRIVATE_KEY` | the `.pem` contents                 | GitHub repository secret                             | Yes for releases | The App's private key. Include the BEGIN and END lines.                              | Yes    |
| `RENDER_DEPLOY_HOOK_URL`  | `https://api.render.com/deploy/...` | GitHub repository or `production` environment secret | No               | Tells Render to deploy the new image. The step is skipped with a warning when unset. | Yes    |

## The price table

`AI_PRICE_TABLE` is JSON in one value. The exact shape is settled in U3; the intent is one entry per model with an input and an output price per million tokens:

```json
{
  "<model-id>": {
    "input": "<USD per million input tokens>",
    "output": "<USD per million output tokens>"
  }
}
```

The placeholders are a template, not current prices. See [../runbooks/update-price-table.md](../runbooks/update-price-table.md).

## Rules

- Only `.dev.vars.example` is committed. `.dev.vars` is git-ignored.
- `FAKE_EXTERNALS` is never set on the deployed Worker. Tests set it, and `make e2e` sets it for `wrangler dev`.
- A missing required value fails loudly. Do not add silent fallbacks.
- Rotating a value has its own steps: [../runbooks/rotate-secret.md](../runbooks/rotate-secret.md).
