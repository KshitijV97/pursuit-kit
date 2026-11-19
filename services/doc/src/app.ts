import { Hono } from "hono";
import { isReady, readiness } from "./health.ts";

export type DocServiceOptions = {
  /** The shared secret the app sends on every route except the health checks. */
  secret: string | undefined;
};

/**
 * The doc service holds the CPU-heavy work (KTD1): LaTeX compilation and text extraction.
 * /health is the wake call Render and the app use; /health/ready proves Tectonic runs.
 * Every other route needs the shared secret.
 */
export function createDocApp(options: DocServiceOptions) {
  const app = new Hono();

  app.get("/health", (c) => c.json({ status: "ok" }));

  app.get("/health/ready", async (c) => {
    const checks = await readiness(options.secret);
    return c.json({ ready: isReady(checks), checks }, isReady(checks) ? 200 : 503);
  });

  app.use("*", async (c, next) => {
    const expected = options.secret;
    const offered = c.req.header("authorization")?.replace(/^Bearer\s+/i, "");

    if (!expected || offered !== expected) {
      return c.json({ error: "unauthorized" }, 401);
    }

    await next();
  });

  // U7 replaces this with the Tectonic compile route. The route exists now so the auth
  // boundary is real and testable.
  app.post("/compile", (c) => c.json({ error: "compile is not implemented yet" }, 501));

  app.notFound((c) => c.json({ error: "not found" }, 404));

  return app;
}
