import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("the home page loads and axe reports no violations", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Pursuit Kit" })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("Version dev");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});

test("the skip link is the first element reached with Tab", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveClass(/skip-link/);
});

test("the page works without JavaScript", async ({ request }) => {
  const response = await request.get("/");
  const html = await response.text();
  expect(html).toContain("<h1");
  expect(html).not.toContain("<script");
});
