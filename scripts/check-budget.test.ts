import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  checkBudget,
  measurePage,
  SCRIPT_BUDGET_BYTES,
  STYLE_BUDGET_BYTES,
} from "./check-budget.ts";

const helloPage = `<!doctype html>
<html lang="en">
  <head><style>body{font-family:system-ui,sans-serif}main{max-width:60rem;margin:0 auto}</style></head>
  <body><main><h1>Pursuit Kit</h1><script>document.body.dataset.ready="true";</script></main></body>
</html>`;

describe("page budgets", () => {
  it("passes the hello page", () => {
    expect(checkBudget([measurePage("home.html", helloPage)])).toEqual([]);
  });

  it("fails a page carrying more than 30 KB of gzipped script", () => {
    const script = randomBytes(31 * 1024).toString("base64");
    const budget = measurePage("heavy.html", `<h1>Heavy</h1><script>${script}</script>`);

    expect(budget.scriptBytes).toBeGreaterThan(SCRIPT_BUDGET_BYTES);
    expect(checkBudget([budget])).toContainEqual(
      expect.objectContaining({ kind: "script", page: "heavy.html" }),
    );
  });

  it("fails a page carrying more than 20 KB of gzipped styles", () => {
    const styles = randomBytes(21 * 1024).toString("base64");
    const budget = measurePage("heavy.html", `<style>${styles}</style><h1>Heavy</h1>`);

    expect(budget.styleBytes).toBeGreaterThan(STYLE_BUDGET_BYTES);
    expect(checkBudget([budget])).toContainEqual(
      expect.objectContaining({ kind: "style", page: "heavy.html" }),
    );
  });

  it("counts every script block on the page", () => {
    const one = measurePage("one.html", "<script>const a = 1;</script><h1>One</h1>");
    const two = measurePage(
      "two.html",
      "<script>const a = 1;</script><h1>One</h1><script>const b = 2;</script>",
    );

    expect(two.scriptBytes).toBeGreaterThan(one.scriptBytes);
  });
});
