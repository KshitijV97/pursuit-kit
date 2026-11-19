import { Hono } from "hono";
import { type AppBindings, readConfig } from "./platform/config.ts";
import { createLogger } from "./platform/log.ts";
import { appVersion } from "./platform/version.ts";
import { HomePage } from "./web/home.tsx";

type AppEnv = {
  Bindings: AppBindings;
  Variables: {
    requestId: string;
  };
};

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  const requestId = c.req.header("cf-ray") ?? crypto.randomUUID();
  const logger = createLogger(requestId);
  const startedAt = Date.now();
  c.set("requestId", requestId);
  c.header("x-request-id", requestId);

  await next();

  logger.info("request", {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Date.now() - startedAt,
  });
});

app.use("*", async (c, next) => {
  await next();
  c.header("x-content-type-options", "nosniff");
  c.header("referrer-policy", "strict-origin-when-cross-origin");
  c.header("x-frame-options", "DENY");
  c.header("cache-control", "no-store");
});

app.get("/health", (c) => {
  const config = readConfig(c.env);
  return c.json({ status: "ok", env: config.appEnv, version: appVersion() });
});

app.get("/version", (c) => c.text(appVersion()));

app.get("/", (c) => c.html(HomePage({ version: appVersion() })));

app.notFound((c) => c.text("Not found", 404));

app.onError((error, c) => {
  createLogger(c.get("requestId")).error("unhandled", {
    message: error.message,
    path: c.req.path,
  });
  return c.text("Something went wrong", 500);
});

export default app;
