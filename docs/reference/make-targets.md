# Make targets

Use these instead of raw pnpm commands. Each target wraps one or more pnpm scripts, so the commands stay stable if a tool changes. [../../AGENTS.md](../../AGENTS.md) lists the ones you need most days.

| Target                  | What it runs                                                                                                                                         | When you use it                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `make install`           | `pnpm install`, which also runs the `prepare` script that installs the hooks                                                     | Once after cloning, and after a dependency change |
| `make dev`              | `wrangler dev` on `http://localhost:8787`                                                                                                            | Day-to-day local work                           |
| `make sanity`           | The pre-commit pack: the hello-page smoke test, version resolution, the page-budget script tests and the Mermaid extraction tests; later units add their critical tests | Automatically before each commit; also by hand  |
| `make lint`             | Biome check over the repo, including the restricted-import rule on `src/core/`                                                                       | Before a commit, and by hand                    |
| `make typecheck`        | `tsc --noEmit`                                                                                                                                       | Before a push, and by hand                      |
| `make test`             | Vitest over the app tests, inside the Workers runtime                                                                                                | Before a push                                   |
| `make build`            | The Worker build, as a dry-run deploy                                                                                                                | Before a push                                   |
| `make check`            | lint, typecheck, test and build                                                                                                                      | The pre-push gate                               |
| `make docs-check`       | Mermaid syntax check over the Markdown files                                                                                                         | When you change any Markdown                    |
| `make doc-service-test` | The doc service's Docker integration tests, with real Tectonic and real extraction                                                                   | When you touch `services/doc/` or the templates |
| `make e2e`              | Playwright against `wrangler dev`, with `FAKE_EXTERNALS` set; axe runs on every page it visits                                                        | When you change a flow or a page                |
| `make budget`           | The page-weight check: 30 KB of script and 20 KB of styles per page, gzipped                                                                         | When you change a view or a script              |
| `make knip`             | Finds unused code, exports, files and dependencies                                                                                                   | Before opening a pull request                   |
| `make audit`            | `pnpm audit` at the high severity level                                                                                                              | Before opening a pull request                   |
| `make regression`       | Everything the after-merge pack runs: doc-service tests, e2e, budget, knip and the dependency audit                                                  | Before you believe a merge is safe              |

## The three packs

- **`make sanity`** is the pre-commit pack. It must stay under 10 seconds. It starts small and grows only with tests that protect accuracy, security or escaping: the claim validator, the allowlist, session crypto, CSRF, humanize and LaTeX escaping.
- **`make check`** is the pre-push gate. It must stay under 60 seconds. It runs lint, typecheck, unit tests and build.
- **`make regression`** is the after-merge pack. It runs the slow checks once, on `main`, instead of on every push: the doc-service Docker tests, the Playwright flows, the budgets, knip and the dependency audit. A failure opens or updates the `regression` issue and blocks the next release.

The hooks run the first two for you: pre-commit runs `make sanity`; pre-push runs `make check`. CI repeats the important checks, because local hooks can be skipped.

## Notes

- Tests never call the real AI provider, Google or the deployed doc service. Fakes stand in, and `FAKE_EXTERNALS` switches them on for `wrangler dev`.
- App tests run inside the Workers runtime through the Vitest Workers pool, so a passing test says something about the real runtime.
- `make e2e` needs the Playwright browsers once: `pnpm exec playwright install`.
- `make regression` also runs `make audit`, so a failing dependency audit blocks a release.
- The Makefile owns these targets. If a target is missing, the unit that adds it has not landed yet. [../README.md](../README.md) links the rest of the docs.
