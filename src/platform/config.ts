/** Bindings and variables the Worker receives. See docs/reference/env-vars.md. */
export type AppBindings = {
  APP_ENV?: string;
  APP_VERSION?: string;
  ALLOWED_EMAILS?: string;
  AI_MODEL_EXTRACTION?: string;
  AI_MODEL_WRITING?: string;
  AI_PRICE_TABLE?: string;
  DOC_SERVICE_URL?: string;
  /** Test-only. Set by vitest and `make e2e`, never in production. */
  FAKE_EXTERNALS?: string;
};

export type AppConfig = {
  appEnv: "development" | "production";
  allowedEmails: readonly string[];
  ai: {
    extractionModel: string;
    writingModel: string;
  };
  docServiceUrl: string;
  fakeExternals: boolean;
};

const DEFAULT_EXTRACTION_MODEL = "claude-haiku-5-5";
const DEFAULT_WRITING_MODEL = "claude-sonnet-5-5";

/** Anything other than `production` is treated as development, so a typo never enables production behaviour. */
function resolveAppEnv(value: string | undefined): "development" | "production" {
  return value === "production" ? "production" : "development";
}

/** The allowlist is a comma-separated list. Matching is case-insensitive; Google-verified emails only (ADR 0002). */
function parseAllowlist(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function readConfig(env: AppBindings): AppConfig {
  return {
    appEnv: resolveAppEnv(env.APP_ENV),
    allowedEmails: parseAllowlist(env.ALLOWED_EMAILS),
    ai: {
      extractionModel: env.AI_MODEL_EXTRACTION ?? DEFAULT_EXTRACTION_MODEL,
      writingModel: env.AI_MODEL_WRITING ?? DEFAULT_WRITING_MODEL,
    },
    docServiceUrl: env.DOC_SERVICE_URL ?? "",
    fakeExternals: env.FAKE_EXTERNALS === "true",
  };
}
