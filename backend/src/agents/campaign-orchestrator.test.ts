import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Campaign, ChannelPlan } from "../../shared/types.js";

// Mock all agents and utilities
vi.mock("./ux-strategist.js", () => ({
  uxStrategistAgent: {
    run: vi.fn(),
  },
  parseUXStrategyOutput: vi.fn(),
}));

vi.mock("./copywriter.js", () => ({
  copywriterAgent: {
    run: vi.fn(),
  },
}));

vi.mock("./social-media-manager.js", () => ({
  socialMediaManagerAgent: {
    run: vi.fn(),
  },
}));

vi.mock("./designer.js", () => ({
  designerAgent: {
    run: vi.fn(),
  },
}));

vi.mock("./seo-specialist.js", () => ({
  seoSpecialistAgent: {
    run: vi.fn(),
  },
  parseSEOOutput: vi.fn(),
}));

vi.mock("./brand-guardian.js", () => ({
  brandGuardianAgent: {
    run: vi.fn(),
  },
  buildReviewMessage: vi.fn((input) => `Review: ${input.content}`),
}));

vi.mock("./orchestrator-utils.js", () => ({
  parseBrandReview: vi.fn(),
}));

import { analyzeCampaignBrief, generateCampaignContent } from "./campaign-orchestrator.js";
import { uxStrategistAgent, parseUXStrategyOutput } from "./ux-strategist.js";
import { copywriterAgent } from "./copywriter.js";
import { socialMediaManagerAgent } from "./social-media-manager.js";
import { designerAgent } from "./designer.js";
import { seoSpecialistAgent, parseSEOOutput } from "./seo-specialist.js";
import { brandGuardianAgent, buildReviewMessage } from "./brand-guardian.js";
import { parseBrandReview } from "./orchestrator-utils.js";

const mockUxStrategistAgent = vi.mocked(uxStrategistAgent);
const mockParseUXStrategyOutput = vi.mocked(parseUXStrategyOutput);
const mockCopywriterAgent = vi.mocked(copywriterAgent);
const mockSocialMediaManagerAgent = vi.mocked(socialMediaManagerAgent);
const mockDesignerAgent = vi.mocked(designerAgent);
const mockSeoSpecialistAgent = vi.mocked(seoSpecialistAgent);
const mockParseSEOOutput = vi.mocked(parseSEOOutput);
const mockBrandGuardianAgent = vi.mocked(brandGuardianAgent);
const mockBuildReviewMessage = vi.mocked(buildReviewMessage);
const mockParseBrandReview = vi.mocked(parseBrandReview);

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: "campaign-1",
    name: "Test Campaign",
    brief: "Launch new OPL product for hotels",
    line: "OPL",
    audience: "Hotel managers",
    objective: "Generate leads",
    concept: "",
    funnel: [],
    channels: [],
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Campaign Orchestrator", () => {
  describe("analyzeCampaignBrief", () => {
    it("creates campaign with concept and funnel from UX Strategist output", async () => {
      const campaign = makeCampaign();
      const callbacks = {
        onPhaseStarted: vi.fn(),
      };

      mockUxStrategistAgent.run.mockResolvedValue({
        role: "ux-strategist",
        content: '```json\n{"concept":"test","funnel":[]}\n```',
      });

      mockParseUXStrategyOutput.mockReturnValue({
        concept: "Deja de apagar incendios",
        funnel: [
          {
            stage: "awareness",
            description: "Pieza viral WhatsApp",
            channels: ["whatsapp", "facebook-ad"],
          },
          {
            stage: "conversion",
            description: "Landing page",
            channels: ["landing-page"],
          },
        ],
      });

      const result = await analyzeCampaignBrief(campaign, callbacks);

      expect(callbacks.onPhaseStarted).toHaveBeenCalledWith(1);
      expect(mockUxStrategistAgent.run).toHaveBeenCalledOnce();
      expect(mockParseUXStrategyOutput).toHaveBeenCalledOnce();

      expect(result.concept).toBe("Deja de apagar incendios");
      expect(result.funnel).toHaveLength(2);
      expect(result.status).toBe("planned");

      // Channels should be built from funnel stages
      expect(result.channels).toHaveLength(3); // whatsapp + facebook-ad + landing-page
      const channelTypes = result.channels.map((c: ChannelPlan) => c.channel);
      expect(channelTypes).toContain("whatsapp");
      expect(channelTypes).toContain("facebook-ad");
      expect(channelTypes).toContain("landing-page");

      // Each channel plan should have correct funnel stage
      const whatsappChannel = result.channels.find((c: ChannelPlan) => c.channel === "whatsapp");
      expect(whatsappChannel?.funnelStage).toBe("awareness");
      expect(whatsappChannel?.status).toBe("pending");
    });
  });

  describe("generateCampaignContent", () => {
    it("generates 3 variants for each channel, design HTML present, callbacks called", async () => {
      const channels: ChannelPlan[] = [
        {
          id: "ch-1",
          channel: "linkedin-post",
          funnelStage: "awareness",
          variants: [],
          status: "pending",
        },
      ];
      const campaign = makeCampaign({ status: "planned", channels });
      const callbacks = {
        onPhaseStarted: vi.fn(),
        onChannelStarted: vi.fn(),
        onChannelCompleted: vi.fn(),
        onChannelFailed: vi.fn(),
      };

      // linkedin-post is social → socialMediaManagerAgent for copy
      mockSocialMediaManagerAgent.run
        .mockResolvedValueOnce({ role: "social-media-manager", content: "Variant A copy" })
        .mockResolvedValueOnce({ role: "social-media-manager", content: "Variant B copy" })
        .mockResolvedValueOnce({ role: "social-media-manager", content: "Variant C copy" });

      // linkedin-post needs designer
      mockDesignerAgent.run.mockResolvedValue({
        role: "designer",
        content: "<html>design</html>",
      });

      // Brand Guardian review
      mockBrandGuardianAgent.run.mockResolvedValue({
        role: "brand-guardian",
        content: '```json\n{"approved":true,"score":90,"checks":[]}\n```',
      });
      mockParseBrandReview.mockReturnValue({
        approved: true,
        score: 90,
        checks: [],
        reviewedAt: new Date().toISOString(),
      });

      const result = await generateCampaignContent(campaign, callbacks);

      expect(callbacks.onPhaseStarted).toHaveBeenCalledWith(2);
      expect(callbacks.onChannelStarted).toHaveBeenCalledWith("ch-1", "linkedin-post");
      expect(callbacks.onChannelCompleted).toHaveBeenCalledWith("ch-1", "linkedin-post");
      expect(callbacks.onChannelFailed).not.toHaveBeenCalled();

      expect(result.status).toBe("review");

      const channelResult = result.channels[0];
      expect(channelResult.variants).toHaveLength(3);
      expect(channelResult.variants[0].label).toBe("A");
      expect(channelResult.variants[1].label).toBe("B");
      expect(channelResult.variants[2].label).toBe("C");
      expect(channelResult.variants[0].content).toBe("Variant A copy");

      expect(channelResult.designHtml).toBe("<html>design</html>");
      expect(channelResult.status).toBe("ready");

      // Brand review should be present
      expect(channelResult.brandReview?.approved).toBe(true);
    });

    it("handles channel failure gracefully with Promise.allSettled", async () => {
      const channels: ChannelPlan[] = [
        {
          id: "ch-ok",
          channel: "email",
          funnelStage: "nurture",
          variants: [],
          status: "pending",
        },
        {
          id: "ch-fail",
          channel: "blog-post",
          funnelStage: "interest",
          variants: [],
          status: "pending",
        },
      ];
      const campaign = makeCampaign({ status: "planned", channels });
      const callbacks = {
        onPhaseStarted: vi.fn(),
        onChannelStarted: vi.fn(),
        onChannelCompleted: vi.fn(),
        onChannelFailed: vi.fn(),
      };

      // email → copywriter succeeds
      mockCopywriterAgent.run
        .mockResolvedValueOnce({ role: "copywriter", content: "Email A copy" })
        .mockResolvedValueOnce({ role: "copywriter", content: "Email B copy" })
        .mockResolvedValueOnce({ role: "copywriter", content: "Email C copy" })
        // blog-post → copywriter fails (3 calls that reject)
        .mockRejectedValueOnce(new Error("API timeout"))
        .mockRejectedValueOnce(new Error("API timeout"))
        .mockRejectedValueOnce(new Error("API timeout"));

      // email needs designer
      mockDesignerAgent.run.mockResolvedValue({
        role: "designer",
        content: "<html>email design</html>",
      });

      // Brand Guardian for the successful email channel
      mockBrandGuardianAgent.run.mockResolvedValue({
        role: "brand-guardian",
        content: '```json\n{"approved":true,"score":85,"checks":[]}\n```',
      });
      mockParseBrandReview.mockReturnValue({
        approved: true,
        score: 85,
        checks: [],
        reviewedAt: new Date().toISOString(),
      });

      const result = await generateCampaignContent(campaign, callbacks);

      expect(result.status).toBe("review");

      const emailChannel = result.channels.find((c) => c.id === "ch-ok");
      const blogChannel = result.channels.find((c) => c.id === "ch-fail");

      expect(emailChannel?.status).toBe("ready");
      expect(blogChannel?.status).toBe("error");

      expect(callbacks.onChannelCompleted).toHaveBeenCalledWith("ch-ok", "email");
      expect(callbacks.onChannelFailed).toHaveBeenCalledWith("ch-fail", "blog-post", expect.any(String));
    });
  });
});
