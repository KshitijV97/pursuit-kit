import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

export const SCRIPT_BUDGET_BYTES = 30 * 1024;
export const STYLE_BUDGET_BYTES = 20 * 1024;

export type PageBudget = {
  page: string;
  scriptBytes: number;
  styleBytes: number;
};

export type BudgetFailure = {
  page: string;
  kind: "script" | "style";
  bytes: number;
  limit: number;
};

export function gzippedSize(content: string): number {
  return gzipSync(Buffer.from(content, "utf8"), { level: 9 }).length;
}

function inlineContent(html: string, tag: "script" | "style"): string {
  const matches = html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "gi"));
  return [...matches].map((match) => match[1] ?? "").join("");
}

/**
 * Measures the inline script and style a page carries, gzipped (KTD14).
 * External assets are counted by the pages that include them, so a page never hides its weight.
 */
export function measurePage(page: string, html: string): PageBudget {
  return {
    page,
    scriptBytes: gzippedSize(inlineContent(html, "script")),
    styleBytes: gzippedSize(inlineContent(html, "style")),
  };
}

export function checkBudget(budgets: readonly PageBudget[]): BudgetFailure[] {
  const failures: BudgetFailure[] = [];

  for (const budget of budgets) {
    if (budget.scriptBytes > SCRIPT_BUDGET_BYTES) {
      failures.push({
        page: budget.page,
        kind: "script",
        bytes: budget.scriptBytes,
        limit: SCRIPT_BUDGET_BYTES,
      });
    }

    if (budget.styleBytes > STYLE_BUDGET_BYTES) {
      failures.push({
        page: budget.page,
        kind: "style",
        bytes: budget.styleBytes,
        limit: STYLE_BUDGET_BYTES,
      });
    }
  }

  return failures;
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB gzipped`;
}

async function main(): Promise<void> {
  const directory = process.argv[2] ?? ".budget";
  const entries = await readdir(directory).catch(() => [] as string[]);
  const pages = entries.filter((entry) => entry.endsWith(".html")).sort();

  if (pages.length === 0) {
    throw new Error(
      `No HTML pages found in ${directory}. Run this through "make budget", which saves the rendered pages first.`,
    );
  }

  const budgets: PageBudget[] = [];
  for (const page of pages) {
    const html = await readFile(join(directory, page), "utf8");
    budgets.push(measurePage(page, html));
  }

  const failures = checkBudget(budgets);

  for (const budget of budgets) {
    const marker = failures.some((failure) => failure.page === budget.page) ? "FAIL" : "ok";
    console.log(
      `${marker}  ${budget.page}  script ${formatSize(budget.scriptBytes)} / ${formatSize(
        SCRIPT_BUDGET_BYTES,
      )}  style ${formatSize(budget.styleBytes)} / ${formatSize(STYLE_BUDGET_BYTES)}`,
    );
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(
        `${failure.page}: ${failure.kind} is ${formatSize(failure.bytes)}, over the ${formatSize(
          failure.limit,
        )} budget`,
      );
    }
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;

if (invokedPath) {
  await main();
}
