import { describe, it, expect } from "vitest";
import { designerAgent } from "./designer.js";

describe("Designer Agent", () => {
  it("has the correct role", () => {
    expect(designerAgent.role).toBe("designer");
  });
});
