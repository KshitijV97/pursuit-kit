# GitHub App for releases

Do this once. release-please opens and updates a release pull request. It needs a GitHub App token so that CI runs on that pull request.

## Why an App is needed

Pull requests opened with the default `GITHUB_TOKEN` do not trigger other workflows. That means CI would never run on the release pull request, and the required `regression-gate` check would never report. The release pull request would then be blocked forever. A GitHub App token is scoped to this repository, does not expire like a personal access token, and does trigger CI.

## 1. Create the App

1. Open GitHub Settings, then Developer settings, then GitHub Apps, then New GitHub App.
2. Name it, for example `pursuit-kit-release`.
3. Turn the webhook off. Nothing needs to receive events.

## 2. Set the repository permissions

1. Contents: read and write.
2. Pull requests: read and write.
3. Metadata: read.

Nothing else. The App does not need access to Actions, secrets or packages.

## 3. Install it

1. Install the App on the `pursuit-kit` repository only.
2. Do not install it on all repositories.

## 4. Generate a private key

1. In the App's settings, generate a private key.
2. Download the `.pem` file. GitHub gives you one copy.
3. Keep it out of the repository. Do not commit it and do not place it in `docs/`.

## 5. Add the two secrets

1. Add the App ID as `RELEASE_APP_ID`.
2. Add the contents of the `.pem` file as `RELEASE_APP_PRIVATE_KEY`.
3. Both are repository secrets, because the release-please workflow runs on every push to `main`, not inside a deployment environment.

[secrets.md](secrets.md) records where each secret lives.

## 6. Check it works

1. Merge a commit to `main` that follows Conventional Commits.
2. The release-please workflow runs and opens or updates the release pull request.
3. On that pull request, CI checks run. You should see the `ci` and `regression-gate` checks appear, not a "waiting for status" state.
4. The workflow log shows which token release-please used.

If the release pull request shows no CI checks, the workflow is still using the default token. Check that the workflow passes the App token to release-please, and that the secrets hold the App ID and the full private key, including the BEGIN and END lines.

## Rotating the key

1. Generate a new private key in the App's settings.
2. Replace `RELEASE_APP_PRIVATE_KEY`.
3. Delete the old key in GitHub.
4. See [../runbooks/rotate-secret.md](../runbooks/rotate-secret.md).
