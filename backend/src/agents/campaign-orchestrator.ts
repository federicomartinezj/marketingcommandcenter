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

// Phase 1: Analyze brief → concept + funnel
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

// Phase 2: Generate ONLY copy variants (no design, no SEO, no brand review)
export async function generateCampaignContent(
  campaign: Campaign,
  callbacks?: CampaignCallbacks,
  visualGuide?: string
): Promise<Campaign> {
  callbacks?.onPhaseStarted?.(2);

  const updatedChannels = [...campaign.channels];

  const results = await Promise.allSettled(
    updatedChannels.map(async (channelPlan, index) => {
      callbacks?.onChannelStarted?.(channelPlan.id, channelPlan.channel);
      updatedChannels[index] = { ...channelPlan, status: "generating" };

      // Only generate copy variants — design comes later after selection
      const variantPromises = ["A", "B", "C"].map(async (label) => {
        const agent = getContentAgent(channelPlan.channel);
        const result = await agent.run({
          line: campaign.line,
          userMessage: buildChannelPrompt(campaign, channelPlan, label, visualGuide),
        });
        return { id: randomUUID(), label: label as "A" | "B" | "C", content: result.content, selected: false };
      });

      const variants = await Promise.all(variantPromises);

      callbacks?.onChannelCompleted?.(channelPlan.id, channelPlan.channel);
      return { index, variants };
    })
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      const { index, variants } = result.value;
      updatedChannels[index] = { ...updatedChannels[index], variants, status: "ready" };
    } else {
      updatedChannels[i] = { ...updatedChannels[i], status: "error" };
      callbacks?.onChannelFailed?.(updatedChannels[i].id, updatedChannels[i].channel, result.reason?.message || "Unknown error");
    }
  }

  return { ...campaign, channels: updatedChannels, status: "review", updatedAt: new Date().toISOString() };
}

// Phase 3: Finalize — generate design + SEO + brand review for SELECTED variant only
export async function finalizeCampaignChannel(
  campaign: Campaign,
  channelId: string,
  visualGuide?: string
): Promise<ChannelPlan> {
  const channel = campaign.channels.find((ch) => ch.id === channelId);
  if (!channel) throw new Error("Channel not found");

  const selected = channel.variants.find((v) => v.selected);
  if (!selected) throw new Error("No variant selected");

  console.log(`[finalize] Generating design + SEO + brand review for ${channel.channel} (variant ${selected.label})`);

  // Generate design HTML for selected variant
  let designHtml: string | undefined;
  if (needsDesigner(channel.channel)) {
    try {
      const designResult = await designerAgent.run({
        line: campaign.line,
        userMessage: `Genera HTML/CSS para ${channel.channel} de la línea ${campaign.line}.\nConcepto de campaña: ${campaign.concept}\nAudiencia: ${campaign.audience}\nContenido base: ${selected.content}\n\nIMPORTANTE: Asegúrate de que el texto sea VISIBLE (texto blanco sobre fondo oscuro, o texto oscuro sobre fondo claro). Donde se necesite una fotografía, incluye un IMAGE_PROMPT en comentario HTML con un prompt en inglés optimizado para generación de imágenes fotorrealistas. Responde SOLO con HTML, sin explicaciones.${visualGuide ? `\n\nGUÍA VISUAL DE CAMPAÑA (aplica este estilo):\n${visualGuide}` : ""}`,
      });

      const html = designResult.content?.trim();
      if (!html) {
        console.error(`[finalize] Designer returned empty response for ${channel.channel}`);
      } else if (!html.includes("<")) {
        console.error(`[finalize] Designer did not return HTML for ${channel.channel}: "${html.substring(0, 150)}"`);
      } else if (designResult.truncated) {
        // Try to close any unclosed tags for truncated responses
        console.warn(`[finalize] Designer response truncated for ${channel.channel}, attempting to salvage`);
        designHtml = html + "\n</div></body></html>";
      } else {
        designHtml = html;
      }
    } catch (err) {
      console.error(`[finalize] Designer error for ${channel.channel}:`, err instanceof Error ? err.message : err);
    }
  }

  // SEO optimization for selected variant
  let seoOptimization;
  if (needsSEO(channel.channel)) {
    try {
      const seoResult = await seoSpecialistAgent.run({
        line: campaign.line,
        userMessage: `Optimiza este contenido para SEO:\n\nTipo: ${channel.channel}\nLínea: ${campaign.line}\nAudiencia: ${campaign.audience}\n\nContenido:\n${selected.content}`,
      });
      seoOptimization = parseSEOOutput(seoResult.content);
    } catch (err) {
      console.error(`[finalize] SEO error for ${channel.channel}:`, err instanceof Error ? err.message : err);
    }
  }

  // Brand Guardian review of selected variant
  let brandReview;
  try {
    const reviewResult = await brandGuardianAgent.run({
      line: campaign.line,
      userMessage: buildReviewMessage({ content: selected.content, line: campaign.line, contentType: channel.channel, audience: campaign.audience }),
    });
    brandReview = parseBrandReview(reviewResult.content);
  } catch (err) {
    console.error(`[finalize] Brand review error for ${channel.channel}:`, err instanceof Error ? err.message : err);
    brandReview = {
      approved: false,
      score: 0,
      checks: [{ name: "Error", passed: false, detail: `Brand review failed: ${err instanceof Error ? err.message : String(err)}`, severity: "error" as const }],
      reviewedAt: new Date().toISOString(),
    };
  }

  const errors: string[] = [];
  if (needsDesigner(channel.channel) && !designHtml) errors.push("HTML no generado");
  if (needsSEO(channel.channel) && !seoOptimization) errors.push("SEO no generado");

  if (errors.length > 0) {
    console.warn(`[finalize] ${channel.channel} completed with issues: ${errors.join(", ")}`);
  }

  console.log(`[finalize] Done — ${channel.channel} | HTML: ${designHtml ? "OK" : "MISSING"} | SEO: ${seoOptimization ? "OK" : "N/A"} | Brand: ${brandReview.score}/100`);

  return {
    ...channel,
    designHtml,
    seoOptimization,
    brandReview,
    status: designHtml || !needsDesigner(channel.channel) ? "approved" : "error",
  };
}

function buildChannelPrompt(campaign: Campaign, channelPlan: ChannelPlan, variantLabel: string, visualGuide?: string): string {
  let prompt = `Genera el contenido (variante ${variantLabel}) para un ${channelPlan.channel} como parte de una campaña.\n\nCONTEXTO DE CAMPAÑA:\n- Concepto: ${campaign.concept}\n- Línea: ${campaign.line}\n- Audiencia: ${campaign.audience}\n- Objetivo: ${campaign.objective}\n- Etapa del embudo: ${channelPlan.funnelStage}\n\nGenera una variante ÚNICA y diferente. Variante ${variantLabel} debe tener un ángulo distinto:\n- A: Enfoque emocional (dolor/alivio)\n- B: Enfoque racional (datos/ROI)\n- C: Enfoque social (testimonios/casos)\n\nEscribe SOLO el contenido, sin explicaciones.`;

  if (visualGuide) {
    prompt += `\n\nGUÍA VISUAL DE CAMPAÑA (úsala para alinear el tono y referencias visuales del copy):\n${visualGuide}`;
  }

  return prompt;
}
