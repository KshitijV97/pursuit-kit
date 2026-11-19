/**
 * The version is substituted into the bundle at build time by `wrangler --define`.
 * Local and test builds have no substitution, so they report `dev`.
 */
declare const __APP_VERSION__: string | undefined;

export function resolveVersion(injected: string | undefined): string {
  const trimmed = injected?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "dev";
}

export function appVersion(): string {
  return resolveVersion(typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : undefined);
}
