import { randomUUID } from "crypto";
import type { Campaign, CampaignCallbacks, ContentType, ChannelPlan } from "../../shared/types.js";
import { uxStrategistAgent, parseUXStrategyOutput } from "./ux-strategist.js";
import { copywriterAgent } from "./copywriter.js";
import { socialMediaManagerAgent } from "./social-media-manager.js";
import { designerAgent } from "./designer.js";
import { seoSpecialistAgent, parseSEOOutput } from "./seo-specialist.js";
import { brandGuardianAgent, buildReviewMessage } from "./brand-guardian.js";
import { parseBrandReview } from "./orchestrator-utils.js";

const SOCIAL_CHANNELS: ContentType[] = ["whatsapp", "facebook-ad", "linkedin-post", "instagram-post", "social-card"];
const SEO_CHANNELS: ContentType[] = ["blog-post", "landing-page"];
const DESIGN_CHANNELS: ContentType[] = ["whatsapp", "facebook-ad", "linkedin-post", "instagram-post", "social-card", "email", "email-sequence", "landing-page"];

function getContentAgent(channel: ContentType) {
  if (SOCIAL_CHANNELS.includes(channel)) return socialMediaManagerAgent;
  return copywriterAgent;
}

function needsDesigner(channel: ContentType): boolean {
  return DESIGN_CHANNELS.includes(channel);
}

function needsSEO(channel: ContentType): boolean {
  return SEO_CHANNELS.includes(channel);
}

export async function analyzeCampaignBrief(
  campaign: Campaign,
  callbacks?: CampaignCallbacks
): Promise<Campaign> {
  callbacks?.onPhaseStarted?.(1);

  const strategyResult = await uxStrategistAgent.run({
    line: campaign.line,
    userMessage: `Analiza este brief de campaña y genera el concepto y embudo:\n\nBrief: ${campaign.brief}\nLínea de negocio: ${campaign.line}\nAudiencia: ${campaign.audience}\nObjetivo: ${campaign.objective}`,
  });

  const strategy = parseUXStrategyOutput(strategyResult.content);

  const channels: ChannelPlan[] = [];
  for (const stage of strategy.funnel) {
    for (const channel of stage.channels) {
      channels.push({
        id: randomUUID(),
        channel: channel as ContentType,
        funnelStage: stage.stage,
        variants: [],
        status: "pending",
      });
    }
  }

  return {
    ...campaign,
    name: campaign.name || `Campaña ${campaign.line} — ${strategy.concept}`,
    concept: strategy.concept,
    funnel: strategy.funnel,
    channels,
    status: "planned",
    updatedAt: new Date().toISOString(),
  };
}

export async function generateCampaignContent(
  campaign: Campaign,
  callbacks?: CampaignCallbacks
): Promise<Campaign> {
  callbacks?.onPhaseStarted?.(2);

  const updatedChannels = [...campaign.channels];

  const results = await Promise.allSettled(
    updatedChannels.map(async (channelPlan, index) => {
      callbacks?.onChannelStarted?.(channelPlan.id, channelPlan.channel);
      updatedChannels[index] = { ...channelPlan, status: "generating" };

      const variantPromises = ["A", "B", "C"].map(async (label) => {
        const agent = getContentAgent(channelPlan.channel);
        const result = await agent.run({
          line: campaign.line,
          userMessage: buildChannelPrompt(campaign, channelPlan, label),
        });
        return { id: randomUUID(), label: label as "A" | "B" | "C", content: result.content, selected: false };
      });

      const variants = await Promise.all(variantPromises);

      let designHtml: string | undefined;
      if (needsDesigner(channelPlan.channel)) {
        const designResult = await designerAgent.run({
          line: campaign.line,
          userMessage: `Genera HTML/CSS para ${channelPlan.channel} de la línea ${campaign.line}.\nConcepto de campaña: ${campaign.concept}\nAudiencia: ${campaign.audience}\nContenido base: ${variants[0].content}`,
        });
        designHtml = designResult.content;
      }

      let seoOptimization;
      if (needsSEO(channelPlan.channel)) {
        const seoResult = await seoSpecialistAgent.run({
          line: campaign.line,
          userMessage: `Optimiza este contenido para SEO:\n\nTipo: ${channelPlan.channel}\nLínea: ${campaign.line}\nAudiencia: ${campaign.audience}\n\nContenido:\n${variants[0].content}`,
        });
        seoOptimization = parseSEOOutput(seoResult.content);
      }

      callbacks?.onChannelCompleted?.(channelPlan.id, channelPlan.channel);
      return { index, variants, designHtml, seoOptimization };
    })
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      const { index, variants, designHtml, seoOptimization } = result.value;
      updatedChannels[index] = { ...updatedChannels[index], variants, designHtml, seoOptimization, status: "ready" };
    } else {
      updatedChannels[i] = { ...updatedChannels[i], status: "error" };
      callbacks?.onChannelFailed?.(updatedChannels[i].id, updatedChannels[i].channel, result.reason?.message || "Unknown error");
    }
  }

  callbacks?.onPhaseStarted?.(3);
  for (let i = 0; i < updatedChannels.length; i++) {
    const ch = updatedChannels[i];
    if (ch.status !== "ready" || ch.variants.length === 0) continue;

    const reviewResult = await brandGuardianAgent.run({
      line: campaign.line,
      userMessage: buildReviewMessage({ content: ch.variants[0].content, line: campaign.line, contentType: ch.channel, audience: campaign.audience }),
    });

    updatedChannels[i] = { ...ch, brandReview: parseBrandReview(reviewResult.content) };
  }

  callbacks?.onCampaignCompleted?.({ ...campaign, channels: updatedChannels, status: "review" });

  return { ...campaign, channels: updatedChannels, status: "review", updatedAt: new Date().toISOString() };
}

function buildChannelPrompt(campaign: Campaign, channelPlan: ChannelPlan, variantLabel: string): string {
  return `Genera el contenido (variante ${variantLabel}) para un ${channelPlan.channel} como parte de una campaña.\n\nCONTEXTO DE CAMPAÑA:\n- Concepto: ${campaign.concept}\n- Línea: ${campaign.line}\n- Audiencia: ${campaign.audience}\n- Objetivo: ${campaign.objective}\n- Etapa del embudo: ${channelPlan.funnelStage}\n\nGenera una variante ÚNICA y diferente. Variante ${variantLabel} debe tener un ángulo distinto:\n- A: Enfoque emocional (dolor/alivio)\n- B: Enfoque racional (datos/ROI)\n- C: Enfoque social (testimonios/casos)\n\nEscribe SOLO el contenido, sin explicaciones.`;
}
