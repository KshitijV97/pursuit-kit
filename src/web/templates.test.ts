import { describe, expect, it } from "vitest";
import { HomePage } from "./home.tsx";
import { templateIssues } from "./templates.ts";

const helloPage = HomePage({ version: "dev" }).toString();

describe("template rules", () => {
  it("passes the hello page", () => {
    expect(templateIssues(helloPage)).toEqual([]);
  });

  it("fails a page with no h1", () => {
    expect(templateIssues("<main><h2>Only a subheading</h2></main>")).toContainEqual(
      expect.objectContaining({ rule: "one-h1" }),
    );
  });

  it("fails a page with two h1 elements", () => {
    const issues = templateIssues("<h1>One</h1><h1>Two</h1>");
    expect(issues).toContainEqual(expect.objectContaining({ rule: "one-h1" }));
  });

  it("fails an input with no label", () => {
    const issues = templateIssues('<h1>Form</h1><input id="email" name="email">');
    expect(issues).toContainEqual(expect.objectContaining({ rule: "labelled-controls" }));
  });

  it("accepts an input with a label or an aria-label", () => {
    expect(
      templateIssues('<h1>Form</h1><label for="email">Email</label><input id="email">'),
    ).toEqual([]);
    expect(templateIssues('<h1>Form</h1><input aria-label="Email">')).toEqual([]);
  });

  it("fails an image with no alt text", () => {
    const issues = templateIssues('<h1>Logo</h1><img src="/logo.svg">');
    expect(issues).toContainEqual(expect.objectContaining({ rule: "image-alt" }));
  });

  it("accepts a decorative image with an empty alt", () => {
    expect(templateIssues('<h1>Logo</h1><img src="/rule.svg" alt="">')).toEqual([]);
  });

  it("fails headings that skip a level", () => {
    const issues = templateIssues("<h1>One</h1><h3>Three</h3>");
    expect(issues).toContainEqual(expect.objectContaining({ rule: "heading-order" }));
  });
});
