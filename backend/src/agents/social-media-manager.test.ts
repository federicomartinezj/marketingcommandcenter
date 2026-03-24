import { describe, it, expect } from "vitest";
import { socialMediaManagerAgent } from "./social-media-manager.js";

describe("Social Media Manager Agent", () => {
  it("has the correct role", () => {
    expect(socialMediaManagerAgent.role).toBe("social-media-manager");
  });
});
