import { describe, it, expect } from "vitest";
import { copywriterAgent } from "./copywriter.js";

describe("Copywriter Agent", () => {
  it("has the correct role", () => {
    expect(copywriterAgent.role).toBe("copywriter");
  });
});
