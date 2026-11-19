# Google OAuth client setup

Do this once. It creates the OAuth client the app signs you in with. The app requests only four scopes: `openid`, `email`, `profile` and `drive.file`. Nothing wider is ever requested.

You need: your Google account, and the `workers.dev` URL of your Worker (for example `https://pursuit-kit.<your-account>.workers.dev`).

You can create the client before the app can sign in. Sign-in itself is built by unit U1, so the last section only passes once U1 has landed.

## 1. Create a Google Cloud project

1. Open the Google Cloud console.
2. Create a project. Any name works, for example `pursuit-kit`.
3. Select the new project.

## 2. Enable the Drive API

1. Go to APIs and services, then Library.
2. Find the Google Drive API and enable it.

## 3. Configure the consent screen

1. Go to APIs and services, then OAuth consent screen.
2. Choose the user type for a personal project. External is the usual choice.
3. Fill in the app name, your support email and your developer contact email.
4. Add the same four scopes: `openid`, `email`, `profile` and `https://www.googleapis.com/auth/drive.file`.
5. Publish the app: click "Publish app" and set the publishing status to "In production".

## 4. Create the Web OAuth client

1. Go to APIs and services, then Credentials, then Create credentials, then OAuth client ID.
2. Choose the application type Web application.
3. Add these authorised redirect URIs, exactly:
   - `http://localhost:8787/auth/callback`
   - `https://<worker-name>.<account>.workers.dev/auth/callback`
4. Create the client.
5. Copy the client ID and client secret.

## 5. Store the client ID and secret

1. Locally, put them in `.dev.vars` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
2. For the deployed Worker, set them as Worker secrets with `wrangler secret put`. See [cloudflare.md](cloudflare.md).
3. Never commit either value. [secrets.md](secrets.md) records where each one lives.

## Why "In production" and why no verification

- Only non-sensitive scopes are requested. `drive.file` lets the app see only files it created, or files you open through the picker. Google treats it as non-sensitive, so the app needs no verification review, now or when it opens to other users.
- "Testing" is the wrong choice. While the consent screen is in testing, Google expires refresh tokens after 7 days, so the app would lose Drive access every week.
- Without brand verification the consent screen shows no logo and shows the app name only. That is acceptable while you are the only user and there is no domain.

## Check it works

1. Run `make dev` and open `http://localhost:8787`.
2. Sign in with your Google account.
3. Approve the consent screen. It lists the four scopes.
4. You land back in the app signed in, and the app creates the `Pursuit Kit` folder in your Drive.
5. Sign in with an account that is not in `ALLOWED_EMAILS`. You must see the denied page and no data.

## If sign-in fails

- A `redirect_uri_mismatch` error means the URI in the client does not match the one the app sent. Check the port (8787 locally) and the exact path `/auth/callback`.
- A sign-in that works and then forgets you means the consent screen was left in testing, or `SESSION_KEY` changed between restarts. Fix the first here; for the second, keep `SESSION_KEY` stable.
- An allowlist rejection with a verified account means the email is spelled differently in `ALLOWED_EMAILS`. The check lowercases both sides, so case alone is not the problem.
