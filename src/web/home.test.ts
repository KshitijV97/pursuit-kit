import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("hello page", () => {
  it("renders one h1, a skip link first and the main landmark", async () => {
    const response = await SELF.fetch("https://example.com/");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const html = await response.text();
    const h1s = html.match(/<h1\b/g) ?? [];
    expect(h1s).toHaveLength(1);
    expect(html).toContain('href="#main"');
    expect(html).toContain('id="main"');

    const skipLink = html.indexOf('class="skip-link"');
    const navigation = html.indexOf("<nav");
    expect(skipLink).toBeGreaterThan(-1);
    expect(skipLink).toBeLessThan(navigation);
  });

  it("shows the build version in the footer and serves it from /version", async () => {
    const page = await SELF.fetch("https://example.com/");
    expect(await page.text()).toContain("Version dev");

    const version = await SELF.fetch("https://example.com/version");
    expect(version.status).toBe(200);
    expect((await version.text()).trim()).toBe("dev");
  });

  it("answers the health check", async () => {
    const response = await SELF.fetch("https://example.com/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "ok",
      env: "development",
      version: "dev",
    });
  });

  it("returns 404 for a path that does not exist yet", async () => {
    const response = await SELF.fetch("https://example.com/applications");
    expect(response.status).toBe(404);
  });

  it("sets a request ID, no-store caching and no-JavaScript headers", async () => {
    const response = await SELF.fetch("https://example.com/");
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");

    const html = await response.text();
    expect(html).not.toContain("<script");
  });
});
