import { describe, it, expect } from "vitest";
import { brandGuardianAgent, buildReviewMessage } from "./brand-guardian.js";

describe("Brand Guardian Agent", () => {
  it("has the correct role", () => {
    expect(brandGuardianAgent.role).toBe("brand-guardian");
  });

  it("builds review message with all context", () => {
    const msg = buildReviewMessage({
      content: "Test content here",
      line: "OPL",
      contentType: "blog-post",
      audience: "hotel managers",
    });
    expect(msg).toContain("OPL");
    expect(msg).toContain("Test content here");
    expect(msg).toContain("blog-post");
    expect(msg).toContain("hotel managers");
  });
});
