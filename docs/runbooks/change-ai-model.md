# Change the AI model

Use this when you want a different model for extraction or writing. Model IDs come from configuration, so no product behaviour changes (R23). The claim rules, the validator and the output shape stay the same.

## Which setting does what

| Setting               | Default             | Used for                                                             |
| --------------------- | ------------------- | -------------------------------------------------------------------- |
| `AI_MODEL_EXTRACTION` | `claude-haiku-5-5`  | Reading postings and sources, and turning them into structured items |
| `AI_MODEL_WRITING`    | `claude-sonnet-5-5` | Matching, strategy, documents, humanize and trims                    |

Both live in the `[vars]` block of `wrangler.toml`, and in `.dev.vars` for local runs. [../reference/env-vars.md](../reference/env-vars.md) lists them with the rest.

## Steps

1. Pick the model ID exactly as the provider writes it. A wrong ID fails the step with a typed error; it does not fall back to another model.
2. Add that model to the price table first. If you skip this, calls still succeed but their cost is recorded as unknown. See [update-price-table.md](update-price-table.md).
3. Change the value in `wrangler.toml` under `[vars]`.
4. Change the same value in `.dev.vars`, so local runs use it too.
5. Run `make test`. The cost and provider tests check that the configured model ID is the one sent, and that the price lookup finds it.
6. Run `make check` before you push.
7. Land the change with a Conventional Commit, then cut a release with [release.md](release.md). The Worker picks up the new `[vars]` value on deploy.

## Per-step override

The plan allows an optional override for a single step, which is R23's "for each step". The shape of that override is settled in U3. Until then, the two settings above are the only knobs.

## Verify

1. Open an application that has run generation.
2. Its cost records show the model ID for each step.
3. The estimated cost is a number, not unknown.
4. If the step failed with a schema error, the model may not support the structured response the app asks for. Switch back and check the provider's documentation.

## What not to change

- Do not change the model name inside a prompt or in code. Configuration is the only place.
- Do not change the output schema to suit a model. The schema is the product's contract, and the validator depends on it.
- Do not remove a model from the price table while an application still uses it, unless you accept unknown costs for those steps.
