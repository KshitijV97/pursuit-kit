import { describe, expect, it } from "vitest";
import { extractMermaidBlocks } from "./check-mermaid.ts";

describe("Mermaid extraction", () => {
  it("finds every fenced Mermaid block in a document", () => {
    const markdown = [
      "# Doc",
      "",
      "```mermaid",
      "flowchart TB",
      "  A --> B",
      "```",
      "",
      "Some prose with a ```js block that is not Mermaid.",
      "",
      "```mermaid",
      "sequenceDiagram",
      "  A->>B: hi",
      "```",
    ].join("\n");

    expect(extractMermaidBlocks(markdown)).toEqual([
      "flowchart TB\n  A --> B",
      "sequenceDiagram\n  A->>B: hi",
    ]);
  });

  it("ignores empty fences", () => {
    expect(extractMermaidBlocks("```mermaid\n\n```")).toEqual([]);
  });

  it("returns nothing when the document has no diagrams", () => {
    expect(extractMermaidBlocks("# Just prose\n\nText.")).toEqual([]);
  });
});
