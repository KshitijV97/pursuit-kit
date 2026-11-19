export type TemplateIssue = {
  rule: "one-h1" | "heading-order" | "labelled-controls" | "image-alt";
  detail: string;
};

const HEADING = /<h([1-6])\b[^>]*>/gi;
const CONTROL = /<(input|select|textarea)\b([^>]*)>/gi;
const IMAGE = /<img\b([^>]*)>/gi;
const LABEL_FOR = /<label\b[^>]*\bfor="([^"]+)"/gi;

function attribute(attributes: string, name: string): string | undefined {
  const match = new RegExp(`\\b${name}="([^"]*)"`, "i").exec(attributes);
  return match?.[1];
}

/**
 * Checks the rules every rendered page must pass (KTD14, R24): one h1, headings that do not
 * skip levels, a label for every visible form control, and alt text on every image.
 * Used by the template test; the e2e pack adds axe, keyboard and no-JavaScript checks.
 */
export function templateIssues(html: string): TemplateIssue[] {
  const issues: TemplateIssue[] = [];

  const headings = [...html.matchAll(HEADING)].map((match) => Number(match[1]));
  const h1Count = headings.filter((level) => level === 1).length;

  if (h1Count !== 1) {
    issues.push({ rule: "one-h1", detail: `expected exactly one h1, found ${h1Count}` });
  }

  let previous = 0;
  for (const level of headings) {
    if (previous > 0 && level > previous + 1) {
      issues.push({
        rule: "heading-order",
        detail: `h${level} follows h${previous}, which skips a level`,
      });
    }
    previous = level;
  }

  const labelTargets = new Set(
    [...html.matchAll(LABEL_FOR)]
      .map((match) => match[1])
      .filter((id): id is string => Boolean(id)),
  );

  for (const match of html.matchAll(CONTROL)) {
    const tag = (match[1] ?? "").toLowerCase();
    const attributes = match[2] ?? "";
    const type = attribute(attributes, "type")?.toLowerCase();

    if (
      tag === "input" &&
      type &&
      ["hidden", "submit", "button", "reset", "image"].includes(type)
    ) {
      continue;
    }

    const id = attribute(attributes, "id");
    const labelled =
      attribute(attributes, "aria-label") !== undefined ||
      attribute(attributes, "aria-labelledby") !== undefined ||
      (id !== undefined && labelTargets.has(id));

    if (!labelled) {
      issues.push({
        rule: "labelled-controls",
        detail: `<${tag}${id ? ` id="${id}"` : ""}> has no label, aria-label or aria-labelledby`,
      });
    }
  }

  for (const match of html.matchAll(IMAGE)) {
    if (attribute(match[1] ?? "", "alt") === undefined) {
      issues.push({ rule: "image-alt", detail: "<img> has no alt attribute" });
    }
  }

  return issues;
}
