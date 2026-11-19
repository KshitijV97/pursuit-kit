# Rotate a secret

Use this when a secret leaks, when a provider asks you to rotate it, or when you want a clean start. Rotate one secret at a time and check the app after each.

[../setup/secrets.md](../setup/secrets.md) lists where every secret lives.

## SESSION_KEY

This key seals the session cookie. Rotating it makes every existing cookie unreadable, so it signs you out. There is one user, so that is the whole effect.

1. Generate a new value: `openssl rand -base64 32`.
2. Set it on the Worker: `pnpm exec wrangler secret put SESSION_KEY`.
3. Update `.dev.vars` too, or local runs will fail to open cookies sealed with the old key.
4. Sign in again. If sign-in loops, the value is not 32 base64 bytes.

## GOOGLE_CLIENT_SECRET

This secret completes the sign-in code exchange.

1. In the Google Cloud console, open APIs and services, then Credentials, then your OAuth client.
2. Add a new client secret. Do not delete the old one yet; both work during the change.
3. Set the new value on the Worker: `pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET`.
4. Update `.dev.vars`.
5. Sign in and confirm you reach the app.
6. Delete the old secret in the Google Cloud console.
7. If sign-in fails after deleting the old one, the Worker still holds the old value. Set it again and retry.

## DOC_SERVICE_SECRET

This is the shared secret between the Worker and the doc service. Both sides must hold the same value, so change them back to back.

1. Generate a new long random string.
2. Set it on the Worker: `pnpm exec wrangler secret put DOC_SERVICE_SECRET`.
3. Set the same value on the Render service, in its environment variables, and let it redeploy.
4. Update `.dev.vars` if you run the doc service locally.
5. Until both sides match, every doc-service route returns 401. That is expected during the change.

Verify:

1. Open `/health/ready` on the doc service. It reports whether Tectonic runs and whether the secret is set.
2. In the app, run one generation so a compile happens.

## ANTHROPIC_API_KEY

This key pays for every AI call. The spend limit lives in the Anthropic console, not on the key.

1. In the Anthropic console, create a new API key.
2. Set it on the Worker: `pnpm exec wrangler secret put ANTHROPIC_API_KEY`.
3. Update `.dev.vars`.
4. Run one generation in the app and confirm it completes and records a cost.
5. Revoke the old key in the Anthropic console.
6. Check that the new key's monthly spend limit is set before you generate much.

While both keys exist, a leaked key still works. Keep the window short.

## GitHub App private key

This key lets release-please open release pull requests that trigger CI.

1. In the App's settings, generate a new private key.
2. Replace the repository secret `RELEASE_APP_PRIVATE_KEY` with the new file's contents, including the BEGIN and END lines.
3. Delete the old key in the App's settings.
4. Wait for the next push to `main`, or re-run the release-please workflow.

Verify: the release pull request shows the `ci` and `regression-gate` checks. If it shows none, the secret is wrong or the workflow is not using the App token. See [../setup/github-app-for-releases.md](../setup/github-app-for-releases.md).

## After any rotation

1. Confirm the app still signs in, opens an application and runs one step.
2. Check the Worker and Render logs for authentication errors.
3. If a secret might have leaked, rotate it at the source first, then everywhere above.
