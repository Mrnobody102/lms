import { describe, it, expect } from "vitest";

describe("Shared Package", () => {
  it("should pass a basic truthy test", () => {
    expect(true).toBe(true);
  });

  it("should be able to perform basic arithmetic", () => {
    expect(1 + 1).toBe(2);
  });
});
