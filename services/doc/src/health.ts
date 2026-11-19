import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

export type ReadinessCheck = {
  name: "tectonic" | "secret";
  ok: boolean;
  detail?: string;
};

/** Tectonic is the LaTeX engine. The image builds its packages in at build time (KTD5). */
async function tectonicVersion(timeoutMs = 5_000): Promise<string | null> {
  try {
    const { stdout } = await run("tectonic", ["--version"], { timeout: timeoutMs });
    const version = stdout.trim().split("\n")[0];
    return version && version.length > 0 ? version : null;
  } catch {
    return null;
  }
}

export async function readiness(secret: string | undefined): Promise<ReadinessCheck[]> {
  const version = await tectonicVersion();

  return [
    {
      name: "tectonic",
      ok: version !== null,
      detail: version ?? "tectonic --version did not run",
    },
    {
      name: "secret",
      ok: typeof secret === "string" && secret.length > 0,
      detail: secret ? "shared secret is set" : "DOC_SERVICE_SECRET is not set",
    },
  ];
}

export function isReady(checks: readonly ReadinessCheck[]): boolean {
  return checks.every((check) => check.ok);
}
