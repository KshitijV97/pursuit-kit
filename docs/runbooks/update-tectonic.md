# Update Tectonic

Use this when Tectonic publishes a new release you want, or when a compile bug is fixed upstream. The doc service image pins one Tectonic version, so it changes only when you change it.

## Why the version is pinned by hand

- **Repeatable builds.** A new Tectonic release can change how a resume lays out. Pinning means the PDFs change only in a PR you can check.
- **No rate limit.** Looking up "the latest release" needs GitHub's API, which allows 60 anonymous calls an hour per IP address. GitHub's runners share addresses, so the build failed with HTTP 403 whenever others had used them up (#26). Downloading a named release doesn't use the API.
- **Dependabot can't see it.** Dependabot bumps the Node base image, but not a version in a Dockerfile `ARG`, so this one is manual.

## Steps

1. Find the new version on the [Tectonic releases page](https://github.com/tectonic-typesetting/tectonic/releases). Releases are tagged `tectonic@<version>`; check that one has an `x86_64-unknown-linux-musl.tar.gz` file.
2. On a branch, change `ARG TECTONIC_VERSION=` in `services/doc/Dockerfile` to the new version.
3. Run `make doc-service-test`. It builds the image with the new Tectonic and runs the doc service's tests inside it.
4. Once U7 has landed, compile a sample resume and cover letter and check the page count and layout look the same.
5. Open a PR titled `build(doc): update Tectonic to <version>`. The regression pack runs the Docker tests again after merge.
