# Update the price table

Use this when a provider changes its prices, or when you add a model. The price table turns token counts into an estimated cost, and each application shows the total (R22).

## Why the table is maintained by hand

The AI provider returns token counts for each call. It does not return the price. So the app keeps a per-model price table in configuration (`AI_PRICE_TABLE`) and multiplies:

- input tokens by the model's input price;
- output tokens by the model's output price.

The table is configuration, not a secret. It lives in the `[vars]` block of `wrangler.toml` and in `.dev.vars` locally, next to the model settings.

## Shape

The exact JSON shape is settled in U3. The intent is one entry per model, with an input and an output price per million tokens. For example:

```json
{
  "<model-id>": {
    "input": "<USD per million input tokens>",
    "output": "<USD per million output tokens>"
  }
}
```

Replace both placeholders with numbers. The example above is a template, not current pricing.

## Steps

1. Look up the current prices on the provider's pricing page. Prices are usually quoted per million tokens, which matches the table.
2. Open `wrangler.toml` and update the entry for each model you use.
3. Update the same value in `.dev.vars`, so local runs estimate the same way.
4. If you added a model, add its entry in the same change as the model setting. See [change-ai-model.md](change-ai-model.md).
5. Run `make test`. The cost tests check the multiplication and the record shape.
6. Run `make check`.
7. Land the change with a Conventional Commit, then cut a release with [release.md](release.md).

## What happens with a missing model

A model that is not in the table still runs. The cost record keeps its token counts and marks the cost unknown, rather than failing the step or guessing. That keeps the generation usable and makes the gap visible when you read the application's cost.

## Verify

1. Open an application and look at its cost.
2. Every step has a model, an input and output token count, and an estimated cost.
3. An unknown cost means the model is missing from the table.
4. A total that looks far too high usually means a price entered per token instead of per million tokens.

## What not to do

- Do not estimate a missing price from a similar model. Leave it out and fix the table.
- Do not delete old entries that applications still reference. Their cost records are already computed, but a regenerate would need the entry.
- Do not hard-code prices in code. The table is the one place.
