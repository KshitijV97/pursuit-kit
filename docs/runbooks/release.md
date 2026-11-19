# Release a new version

Use this when the changes on `main` are ready to go to production. A release is the only thing that deploys.

Publishing a release does three things: it deploys the Worker, builds and pushes the doc-service image, and tells Render to deploy that image. See [deploy.md](deploy.md) for what happens after you merge.

## Before you start

- Your changes are merged to `main` through squash-merged pull requests with Conventional Commits titles. release-please reads those titles to build the version and `CHANGELOG.md`.
- The regression pack passed on `main`. A failing regression run blocks the release pull request.
- The GitHub App secrets exist: `RELEASE_APP_ID` and `RELEASE_APP_PRIVATE_KEY`. Without them the release pull request gets no CI. See [../setup/github-app-for-releases.md](../setup/github-app-for-releases.md).

## Versions

- The project uses Semantic Versioning: `MAJOR.MINOR.PATCH`.
- The first release is `v0.1.0`. It stays below `1.0.0` until the MVP's success criteria are met.
- Commit types set the bump: `fix:` is a patch, `feat:` is a minor, and a `BREAKING CHANGE:` footer is a major.
- release-please keeps a single release pull request open and updates it as more commits land. You do not open it and you do not merge it early.

## Steps

1. Check the open release pull request. It is titled like `chore(main): release 0.2.0`.
2. Read the generated `CHANGELOG.md` section in the pull request. It is grouped from the commit titles.
3. Add or edit the "What's new" section in the pull request body. Write it in plain English for you, not for a changelog. This is the text the GitHub Release will show.
4. Do this last. Any push to `main` regenerates the release pull request body, so a "What's new" section written earlier is overwritten.
5. Wait for the `ci` and `regression-gate` checks to pass on the pull request.
6. Squash-merge the pull request.
7. Merging bumps the version, updates `CHANGELOG.md`, tags the commit and publishes the GitHub Release.
8. Publishing the release starts the deploy workflow. Watch it in the Actions tab.

## Check it worked

1. The release appears under Releases with your "What's new" text and the version tag.
2. The deploy workflow run for that release is green.
3. Open `https://<worker-name>.<account>.workers.dev/version`. It returns the new version, and the footer shows the same version.
4. Open the doc service's `/health`. It answers.

If the doc-service hook step was skipped with a warning, `RENDER_DEPLOY_HOOK_URL` is unset. That is expected before the Render service exists; see [../setup/render.md](../setup/render.md).

## If a release is wrong

Do not edit or delete the tag. Follow [rollback.md](rollback.md) to put the previous version back, then fix forward with a new patch release.

## What not to do

- Do not merge the release pull request to "clear" it before the changes are ready.
- Do not hand-edit `CHANGELOG.md` or the version in `package.json`. release-please owns both.
- Do not deploy by hand. Deploys happen only from a published release, so production always matches a tagged, regression-passed commit.
