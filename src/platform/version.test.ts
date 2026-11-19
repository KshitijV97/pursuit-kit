import { describe, expect, it } from "vitest";
import { resolveVersion } from "./version.ts";

describe("resolveVersion", () => {
  it("uses the version injected at build time", () => {
    expect(resolveVersion("v0.1.0")).toBe("v0.1.0");
  });

  it("falls back to dev when no version was injected", () => {
    expect(resolveVersion(undefined)).toBe("dev");
  });

  it("treats an empty or blank version as missing", () => {
    expect(resolveVersion("")).toBe("dev");
    expect(resolveVersion("   ")).toBe("dev");
  });
});
