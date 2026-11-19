# Local development setup

Do this once per machine. It installs the tools, creates your local secrets file and gets the app running on `http://localhost:8787`.

You need: a Mac with Homebrew, and your Google account.

## 1. Install Node 26

The repo pins Node 26 in `.nvmrc` (currently 26.13.1). Node 26 is the Active LTS line. The app's TypeScript runs through Node's built-in type stripping, which is why the code uses no enums and no tsconfig `paths`.

With nvm:

1. Install nvm if you don't have it.
2. Run `nvm install` in the repo root. It reads `.nvmrc`.
3. Run `nvm use` in the repo root.
4. Check with `node --version`. It should print a 26.x version.

With fnm, run `fnm install` and then `fnm use`. Both read `.nvmrc`.

## 2. Install pnpm through corepack

1. Run `corepack enable`.
2. The `packageManager` field in `package.json` pins the pnpm version, so corepack uses that version without a separate install.

## 3. Install Docker Desktop

The doc service runs as a Docker image, and `make doc-service-test` runs the real Tectonic compile and the real text extraction inside it.

1. Run `brew install --cask docker`.
2. Open Docker Desktop once and let it finish starting.

## 4. Install gitleaks and lefthook

1. Run `brew install gitleaks lefthook`.
2. lefthook runs the git hooks. gitleaks is the secrets scan that runs before each commit.

## 5. Install the packages and the hooks

1. Run `make install` in the repo root.
2. It runs `pnpm install`, and the `prepare` script runs `lefthook install`, which writes the hooks into `.git/hooks`.
3. Check that `.git/hooks/pre-commit` exists. If it doesn't, run `pnpm exec lefthook install`.

The hooks do three things:

- pre-commit, under 10 s: Biome on staged files, gitleaks, and `make sanity`.
- commit-msg: checks the Conventional Commits format.
- pre-push, under 60 s: `make check`.

## 6. Create your local secrets file

1. Copy the template: `cp .dev.vars.example .dev.vars`.
2. Fill in each value. [reference/env-vars.md](../reference/env-vars.md) explains every one.
3. Get the Google values from [google-oauth.md](google-oauth.md): `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
4. Set `ALLOWED_EMAILS` to your own Google address.
5. Set `ANTHROPIC_API_KEY`. Set a monthly spend limit in the Anthropic console first.
6. Generate `SESSION_KEY` with `openssl rand -base64 32`. It must be 32 random bytes, base64 encoded.
7. Set `DOC_SERVICE_SECRET` to any long random string. Use the same value when you run the doc service locally.
8. Leave `DOC_SERVICE_URL` as `http://127.0.0.1:8080` while you work locally.

`.dev.vars` is git-ignored. Never commit it. Only `.dev.vars.example` is committed, and it holds no real values.

## 7. Run the app

1. Run `make dev`. It starts `wrangler dev` on port 8787.
2. Open `http://localhost:8787`.
3. The footer shows the build version. Locally it reads `dev`, because no version was injected.
4. `/version` returns the same string and `/health` answers.

## 8. Run the doc service locally, if you need it

The app calls the doc service for text extraction and LaTeX compiles. You only need it locally when you work on those paths. For example:

1. Build the image from the repo root: `docker build -f services/doc/Dockerfile -t pursuit-kit-doc .`.
2. Run it with the shared secret: `docker run --rm -p 8080:8080 -e DOC_SERVICE_SECRET=local-secret pursuit-kit-doc`.
3. Check `http://127.0.0.1:8080/health`. It must answer without the secret.
4. Check `/health/ready`. It reports whether Tectonic runs and whether the secret is set. It needs no secret itself.
5. Keep `DOC_SERVICE_URL` and `DOC_SERVICE_SECRET` in `.dev.vars` pointing at it.

The Makefile is the stable entry point. `make doc-service-test` builds the image and runs the integration tests inside it.

## 9. Run the checks

- `make check` is the pre-push gate: lint, typecheck, unit tests and build, under 60 s.
- `make sanity` is the pre-commit pack, under 10 s.
- `make e2e` runs the Playwright tests against `wrangler dev` with the external services replaced by recorded fakes.
- Before the first `make e2e`, install the browsers once with `pnpm exec playwright install`.
- `make regression` runs everything the after-merge pack runs. Expect it to take minutes, because it builds the doc-service image.

See [reference/make-targets.md](../reference/make-targets.md) for every target.

## Troubleshooting

- A hook fails with "command not found": lefthook or gitleaks is missing from your `PATH`. Repeat step 4 and run `pnpm exec lefthook install`.
- `wrangler dev` starts but pages fail with a session error: `SESSION_KEY` is empty or not 32 base64 bytes. Regenerate it.
- The app cannot reach the doc service: check that the container is running and that `DOC_SERVICE_URL` matches its port.
