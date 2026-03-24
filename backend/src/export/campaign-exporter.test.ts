import { describe, it, expect } from "vitest";
import { buildExportFiles } from "./campaign-exporter.js";
import type { Campaign } from "../../shared/types.js";

describe("Campaign Exporter", () => {
  it("builds file list from campaign", () => {
    const campaign: Campaign = {
      id: "test", name: "Test Campaign", brief: "Test brief", line: "OPL",
      audience: "Test audience", objective: "Test objective", concept: "Test concept",
      funnel: [{ stage: "awareness", description: "Test", channels: ["whatsapp"] }],
      channels: [{
        id: "ch1", channel: "whatsapp", funnelStage: "awareness",
        variants: [
          { id: "v1", label: "A", content: "WhatsApp copy here", selected: true },
          { id: "v2", label: "B", content: "Alt copy", selected: false },
        ],
        designHtml: "<div>Asset</div>", status: "approved",
      }],
      status: "approved", createdAt: "2026-03-24", updatedAt: "2026-03-24",
    };

    const files = buildExportFiles(campaign);
    expect(files.some((f) => f.path === "README.md")).toBe(true);
    expect(files.some((f) => f.path === "awareness/whatsapp/copy.md")).toBe(true);
    expect(files.some((f) => f.path === "awareness/whatsapp/asset.html")).toBe(true);
    expect(files.some((f) => f.path === "brand-review.md")).toBe(true);
  });
});
