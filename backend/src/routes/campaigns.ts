import { Router } from "express";
import { randomUUID } from "crypto";
import type { Campaign, CreateCampaignRequest, Moodboard } from "../../shared/types.js";
import { analyzeCampaignBrief, generateCampaignContent, finalizeCampaignChannel } from "../agents/campaign-orchestrator.js";
import { streamZip } from "../export/campaign-exporter.js";
import { generateMoodboard } from "../agents/moodboard-generator.js";

const router = Router();
const campaignStore: Map<string, Campaign> = new Map();
const moodboardStore: Map<string, Moodboard> = new Map();

// POST / — Create campaign (status: draft)
router.post("/", (req, res) => {
  try {
    const body = req.body as CreateCampaignRequest;

    if (!body.brief || !body.line || !body.audience) {
      res.status(400).json({ error: "Missing required fields: brief, line, audience" });
      return;
    }

    const now = new Date().toISOString();
    const campaign: Campaign = {
      id: randomUUID(),
      name: "",
      brief: body.brief,
      line: body.line,
      audience: body.audience,
      objective: body.objective || "",
      concept: "",
      funnel: [],
      channels: [],
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    campaignStore.set(campaign.id, campaign);
    res.status(201).json(campaign);
  } catch (error) {
    console.error("Campaign creation error:", error);
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// GET / — List campaigns (optional filters: ?line=OPL&status=draft)
router.get("/", (req, res) => {
  let items = Array.from(campaignStore.values());

  if (req.query.line) {
    items = items.filter((c) => c.line === req.query.line);
  }
  if (req.query.status) {
    items = items.filter((c) => c.status === req.query.status);
  }

  res.json(items);
});

// GET /:id/export — Download ZIP
router.get("/:id/export", (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
  if (campaign.status !== "approved" && campaign.status !== "exported") {
    res.status(400).json({ error: "Campaign must be approved to export" }); return;
  }
  campaign.status = "exported";
  campaignStore.set(campaign.id, campaign);
  streamZip(campaign, res);
});

// POST /:id/moodboard — Generate moodboard for a campaign
router.post("/:id/moodboard", async (req, res) => {
  req.setTimeout(300000);
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }

  try {
    console.log(`[moodboard] Generating for campaign ${campaign.id} (${campaign.line}), concept: "${campaign.concept}"`);
    const moodboard = await generateMoodboard(campaign.id, campaign.concept, campaign.line, campaign.audience, campaign.objective);
    console.log(`[moodboard] Success — visual concept: "${moodboard.visualConcept}"`);
    moodboardStore.set(campaign.id, moodboard);
    res.json(moodboard);
  } catch (error) {
    console.error("[moodboard] Error:", error instanceof Error ? error.message : error);
    res.status(500).json({ error: `Moodboard error: ${error instanceof Error ? error.message : "Unknown error"}` });
  }
});

// GET /:id/moodboard — Get moodboard by campaign id
router.get("/:id/moodboard", (req, res) => {
  const moodboard = moodboardStore.get(req.params.id);
  if (!moodboard) { res.status(404).json({ error: "Moodboard not found" }); return; }
  res.json(moodboard);
});

// PUT /:id/moodboard/approve — Approve moodboard
router.put("/:id/moodboard/approve", (req, res) => {
  const moodboard = moodboardStore.get(req.params.id);
  if (!moodboard) { res.status(404).json({ error: "Moodboard not found" }); return; }
  const approved: Moodboard = { ...moodboard, status: "approved" };
  moodboardStore.set(req.params.id, approved);
  res.json(approved);
});

// GET /:id — Get campaign detail
router.get("/:id", (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json(campaign);
});

// POST /:id/analyze — Trigger Phase 1 (must be draft status)
router.post("/:id/analyze", async (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  if (campaign.status !== "draft") {
    res.status(409).json({ error: "Campaign must be in draft status to analyze" });
    return;
  }

  const planning: Campaign = { ...campaign, status: "planning", updatedAt: new Date().toISOString() };
  campaignStore.set(planning.id, planning);

  try {
    const analyzed = await analyzeCampaignBrief(planning);
    campaignStore.set(analyzed.id, analyzed);
    res.json(analyzed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Campaign analyze error:", msg);
    const reset: Campaign = { ...planning, status: "draft", updatedAt: new Date().toISOString() };
    campaignStore.set(reset.id, reset);
    res.status(500).json({ error: `Analyze failed: ${msg}` });
  }
});

// PUT /:id/plan — Modify plan (accepts channels, funnel in body)
router.put("/:id/plan", (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const { channels, funnel } = req.body;
  const updated: Campaign = {
    ...campaign,
    ...(channels !== undefined && { channels }),
    ...(funnel !== undefined && { funnel }),
    updatedAt: new Date().toISOString(),
  };

  campaignStore.set(updated.id, updated);
  res.json(updated);
});

// POST /:id/generate — Trigger Phase 2+3 (must be "planned" status)
router.post("/:id/generate", async (req, res) => {
  req.setTimeout(300000); // 5 minutes — generation makes many Claude API calls
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  if (campaign.status !== "planned") {
    res.status(409).json({ error: "Campaign must be in planned status to generate content" });
    return;
  }

  const generating: Campaign = { ...campaign, status: "generating", updatedAt: new Date().toISOString() };
  campaignStore.set(generating.id, generating);

  try {
    console.log(`[generate] Starting generation for campaign ${campaign.id} with ${campaign.channels.length} channels...`);
    const moodboard = moodboardStore.get(campaign.id);
    let visualGuide: string | undefined;
    if (moodboard?.status === "approved") {
      visualGuide = `GUÍA VISUAL DE CAMPAÑA:\n- Concepto visual: ${moodboard.visualConcept}\n- Estilo fotográfico: ${moodboard.photographyStyle}\n- Énfasis de color: ${moodboard.colorEmphasis.join(", ")}\n- Tipografía: ${moodboard.typography}\n- Mood: ${moodboard.mood}`;
    }
    const generated = await generateCampaignContent(generating, undefined, visualGuide);
    console.log(`[generate] Completed! ${generated.channels.filter(c => c.status === "ready").length} channels ready`);
    campaignStore.set(generated.id, generated);
    res.json(generated);
  } catch (error) {
    console.error("[generate] Campaign generate error:", error);
    const reset: Campaign = { ...generating, status: "planned", updatedAt: new Date().toISOString() };
    campaignStore.set(reset.id, reset);
    res.status(500).json({ error: "Failed to generate campaign content" });
  }
});

// PUT /:id/channels/:channelId/select — Select winning variant (just marks selection, no finalization)
router.put("/:id/channels/:channelId/select", (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const { variantId } = req.body;
  if (!variantId) {
    res.status(400).json({ error: "Missing required field: variantId" });
    return;
  }

  const channelIndex = campaign.channels.findIndex((ch) => ch.id === req.params.channelId);
  if (channelIndex === -1) {
    res.status(404).json({ error: "Channel not found" });
    return;
  }

  const channel = campaign.channels[channelIndex];
  const updatedVariants = channel.variants.map((v) => ({ ...v, selected: v.id === variantId }));
  const updatedChannel = { ...channel, variants: updatedVariants };

  const updatedChannels = [...campaign.channels];
  updatedChannels[channelIndex] = updatedChannel;

  const updated: Campaign = { ...campaign, channels: updatedChannels, updatedAt: new Date().toISOString() };
  campaignStore.set(updated.id, updated);
  res.json(updated);
});

// POST /:id/channels/:channelId/finalize — Generate design + SEO + brand review for selected variant
router.post("/:id/channels/:channelId/finalize", async (req, res) => {
  req.setTimeout(300000);
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }

  const channelIndex = campaign.channels.findIndex((ch) => ch.id === req.params.channelId);
  if (channelIndex === -1) { res.status(404).json({ error: "Channel not found" }); return; }

  const selected = campaign.channels[channelIndex].variants.find((v) => v.selected);
  if (!selected) { res.status(400).json({ error: "No variant selected — select a variant first" }); return; }

  try {
    console.log(`[finalize] Starting for ${campaign.channels[channelIndex].channel} (variant ${selected.label})`);
    const moodboard = moodboardStore.get(campaign.id);
    let visualGuide: string | undefined;
    if (moodboard?.status === "approved") {
      visualGuide = `- Concepto visual: ${moodboard.visualConcept}\n- Estilo fotográfico: ${moodboard.photographyStyle}\n- Énfasis de color: ${moodboard.colorEmphasis.join(", ")}\n- Tipografía: ${moodboard.typography}\n- Mood: ${moodboard.mood}`;
    }

    const finalized = await finalizeCampaignChannel(campaign, req.params.channelId, visualGuide);
    const updatedChannels = [...campaign.channels];
    updatedChannels[channelIndex] = finalized;
    const updated: Campaign = { ...campaign, channels: updatedChannels, updatedAt: new Date().toISOString() };
    campaignStore.set(updated.id, updated);
    res.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[finalize] Error: ${msg}`);
    res.status(500).json({ error: `Finalize failed: ${msg}` });
  }
});

// POST /:id/channels/:channelId/regenerate — Retry failed channel
router.post("/:id/channels/:channelId/regenerate", async (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const channelIndex = campaign.channels.findIndex((ch) => ch.id === req.params.channelId);
  if (channelIndex === -1) {
    res.status(404).json({ error: "Channel not found" });
    return;
  }

  // Set the single channel status to generating
  const updatedChannels = [...campaign.channels];
  updatedChannels[channelIndex] = { ...updatedChannels[channelIndex], status: "generating" };
  const generating: Campaign = { ...campaign, channels: updatedChannels, updatedAt: new Date().toISOString() };
  campaignStore.set(generating.id, generating);

  try {
    // Re-run generation for the full campaign but only the one channel is "generating"
    // We temporarily isolate to a single-channel campaign for regeneration
    const singleChannelCampaign: Campaign = { ...generating, channels: [updatedChannels[channelIndex]] };
    const regenerated = await generateCampaignContent(singleChannelCampaign);

    // Merge the regenerated channel back
    const mergedChannels = [...generating.channels];
    mergedChannels[channelIndex] = regenerated.channels[0];
    const result: Campaign = { ...generating, channels: mergedChannels, updatedAt: new Date().toISOString() };
    campaignStore.set(result.id, result);
    res.json(result);
  } catch (error) {
    console.error("Channel regenerate error:", error);
    const errChannels = [...generating.channels];
    errChannels[channelIndex] = { ...errChannels[channelIndex], status: "error" };
    const errCampaign: Campaign = { ...generating, channels: errChannels, updatedAt: new Date().toISOString() };
    campaignStore.set(errCampaign.id, errCampaign);
    res.status(500).json({ error: "Failed to regenerate channel content" });
  }
});

// PUT /:id/approve — Approve entire campaign
router.put("/:id/approve", (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const approved: Campaign = { ...campaign, status: "approved", updatedAt: new Date().toISOString() };
  campaignStore.set(approved.id, approved);
  res.json(approved);
});

export { router as campaignRouter };
