import { describe, expect, it } from "vitest";
import { createDocApp } from "../src/app.ts";

const secret = "test-secret";
const app = createDocApp({ secret });
/** Set by the Docker integration test, where real Tectonic is installed in the image. */
const expectTectonic = process.env.EXPECT_TECTONIC === "1";

describe("doc service health", () => {
  it("answers /health without the secret", async () => {
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("reports readiness, including whether Tectonic runs", async () => {
    const response = await app.request("/health/ready");
    expect(response.status).toBe(expectTectonic ? 200 : 503);

    const body = (await response.json()) as {
      ready: boolean;
      checks: Array<{ name: string; ok: boolean; detail?: string }>;
    };

    expect(body.ready).toBe(expectTectonic);
    const tectonic = body.checks.find((check) => check.name === "tectonic");
    expect(tectonic?.ok).toBe(expectTectonic);
    expect(tectonic?.detail).toBeTruthy();
    expect(body.checks.find((check) => check.name === "secret")?.ok).toBe(true);
  });

  it("rejects any other route without the shared secret", async () => {
    const response = await app.request("/compile", { method: "POST" });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
  });

  it("rejects a wrong shared secret", async () => {
    const response = await app.request("/compile", {
      method: "POST",
      headers: { authorization: "Bearer wrong" },
    });
    expect(response.status).toBe(401);
  });

  it("passes the secret check to the route", async () => {
    const response = await app.request("/compile", {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
    });
    expect(response.status).toBe(501);
  });

  it("refuses everything when the secret is not configured", async () => {
    const unconfigured = createDocApp({ secret: undefined });
    const response = await unconfigured.request("/compile", {
      method: "POST",
      headers: { authorization: "Bearer anything" },
    });
    expect(response.status).toBe(401);
  });
});
