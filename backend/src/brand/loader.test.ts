import { describe, it, expect } from "vitest";
import { loadBrandKnowledge, loadLineGuidelines } from "./loader.js";

describe("Brand Knowledge Loader", () => {
  it("loads brand-core.md", async () => {
    const content = await loadBrandKnowledge("brand-core");
    expect(content).toContain("Ropa limpia para todos");
    expect(content).toContain("#262626");
  });

  it("loads line-specific guidelines", async () => {
    const opl = await loadLineGuidelines("OPL");
    expect(opl).toContain("OPL");

    const mh = await loadLineGuidelines("MH");
    expect(mh).toContain("#1DB5DE");
  });

  it("throws on unknown file", async () => {
    await expect(loadBrandKnowledge("nonexistent")).rejects.toThrow();
  });
});
