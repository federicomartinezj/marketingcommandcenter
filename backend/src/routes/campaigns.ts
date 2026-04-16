import { Router } from "express";
import type { Campaign, ChannelPlan, ContentVariant, CreateCampaignRequest, Moodboard } from "../../shared/types.js";
import { analyzeCampaignBrief, generateCampaignContent, finalizeCampaignChannel } from "../agents/campaign-orchestrator.js";
import { streamZip } from "../export/campaign-exporter.js";
import { generateMoodboard } from "../agents/moodboard-generator.js";
import { prisma } from "../db.js";
const router = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON columns need runtime-serialized values
const toJson = (v: unknown): any => JSON.parse(JSON.stringify(v));

function toCampaign(row: Record<string, unknown>): Campaign {
  return {
    ...row,
    funnel: row.funnel as Campaign["funnel"],
    channels: row.channels as Campaign["channels"],
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  } as Campaign;
}

function toMoodboard(row: Record<string, unknown>): Moodboard {
  return {
    ...row,
    colorEmphasis: row.colorEmphasis as string[],
    imagePrompts: row.imagePrompts as string[],
    createdAt: (row.createdAt as Date).toISOString(),
  } as Moodboard;
}

// POST / — Create campaign (status: draft)
router.post("/", async (req, res) => {
  try {
    const body = req.body as CreateCampaignRequest;

    if (!body.brief || !body.line || !body.audience) {
      res.status(400).json({ error: "Missing required fields: brief, line, audience" });
      return;
    }

    const row = await prisma.campaign.create({
      data: {
        brief: body.brief,
        line: body.line,
        audience: body.audience,
        objective: body.objective || "",
      },
    });

    res.status(201).json(toCampaign(row as any));
  } catch (error) {
    console.error("Campaign creation error:", error);
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// GET / — List campaigns (optional filters: ?line=OPL&status=draft)
router.get("/", async (req, res) => {
  const where: Record<string, string> = {};
  if (req.query.line) where.line = req.query.line as string;
  if (req.query.status) where.status = req.query.status as string;

  const rows = await prisma.campaign.findMany({ where });
  res.json(rows.map((r) => toCampaign(r as any)));
});

// GET /:id/export — Download ZIP
router.get("/:id/export", async (req, res) => {
  const row = await prisma.campaign.findUnique({ where: { id: req.params.id } });
  if (!row) { res.status(404).json({ error: "Campaign not found" }); return; }
  const channels = row.channels as unknown[];
  if (!channels || channels.length === 0) {
    res.status(400).json({ error: "Campaign has no content to export" }); return;
  }
  const campaign = toCampaign(row as any);
  streamZip(campaign, res);
});

// POST /:id/moodboard — Generate moodboard for a campaign
router.post("/:id/moodboard", async (req, res) => {
  req.setTimeout(300000);
  const row = await prisma.campaign.findUnique({ where: { id: req.params.id } });
  if (!row) { res.status(404).json({ error: "Campaign not found" }); return; }

  try {
    console.log(`[moodboard] Generating for campaign ${row.id} (${row.line}), concept: "${row.concept}"`);
    const moodboard = await generateMoodboard(row.id, row.concept, row.line, row.audience, row.objective);
    console.log(`[moodboard] Success — visual concept: "${moodboard.visualConcept}"`);

    const saved = await prisma.moodboard.upsert({
      where: { campaignId: row.id },
      create: {
        campaignId: row.id,
        visualConcept: moodboard.visualConcept,
        photographyStyle: moodboard.photographyStyle,
        colorEmphasis: moodboard.colorEmphasis,
        typography: moodboard.typography,
        mood: moodboard.mood,
        imagePrompts: moodboard.imagePrompts,
        htmlPreview: moodboard.htmlPreview,
        status: moodboard.status,
      },
      update: {
        visualConcept: moodboard.visualConcept,
        photographyStyle: moodboard.photographyStyle,
        colorEmphasis: moodboard.colorEmphasis,
        typography: moodboard.typography,
        mood: moodboard.mood,
        imagePrompts: moodboard.imagePrompts,
        htmlPreview: moodboard.htmlPreview,
        status: moodboard.status,
      },
    });
    res.json(toMoodboard(saved as any));
  } catch (error) {
    console.error("[moodboard] Error:", error instanceof Error ? error.message : error);
    res.status(500).json({ error: `Moodboard error: ${error instanceof Error ? error.message : "Unknown error"}` });
  }
});

// GET /:id/moodboard — Get moodboard by campaign id
router.get("/:id/moodboard", async (req, res) => {
  const row = await prisma.moodboard.findUnique({ where: { campaignId: req.params.id } });
  if (!row) { res.status(404).json({ error: "Moodboard not found" }); return; }
  res.json(toMoodboard(row as any));
});

// PUT /:id/moodboard/approve — Approve moodboard
router.put("/:id/moodboard/approve", async (req, res) => {
  const row = await prisma.moodboard.findUnique({ where: { campaignId: req.params.id } });
  if (!row) { res.status(404).json({ error: "Moodboard not found" }); return; }
  const updated = await prisma.moodboard.update({
    where: { campaignId: req.params.id },
    data: { status: "approved" },
  });
  res.json(toMoodboard(updated as any));
});

// GET /:id — Get campaign detail
router.get("/:id", async (req, res) => {
  const row = await prisma.campaign.findUnique({ where: { id: req.params.id } });
  if (!row) { res.status(404).json({ error: "Campaign not found" }); return; }
  res.json(toCampaign(row as any));
});

// POST /:id/analyze — Trigger Phase 1 (must be draft status)
router.post("/:id/analyze", async (req, res) => {
  const row = await prisma.campaign.findUnique({ where: { id: req.params.id } });
  if (!row) { res.status(404).json({ error: "Campaign not found" }); return; }
  if (row.status !== "draft") {
    res.status(409).json({ error: "Campaign must be in draft status to analyze" }); return;
  }

  await prisma.campaign.update({ where: { id: row.id }, data: { status: "planning" } });
  const planning = toCampaign({ ...row, status: "planning" } as any);

  try {
    const analyzed = await analyzeCampaignBrief(planning);
    const saved = await prisma.campaign.update({
      where: { id: analyzed.id },
      data: {
        name: analyzed.name,
        concept: analyzed.concept,
        funnel: analyzed.funnel as any,
        channels: analyzed.channels as any,
        status: analyzed.status,
      },
    });
    res.json(toCampaign(saved as any));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Campaign analyze error:", msg);
    await prisma.campaign.update({ where: { id: row.id }, data: { status: "draft" } });
    res.status(500).json({ error: `Analyze failed: ${msg}` });
  }
});

// PUT /:id/plan — Modify plan (accepts channels, funnel in body)
router.put("/:id/plan", async (req, res) => {
  const row = await prisma.campaign.findUnique({ where: { id: req.params.id } });
  if (!row) { res.status(404).json({ error: "Campaign not found" }); return; }

  const { channels, funnel } = req.body;
  const data: Record<string, unknown> = {};
  if (channels !== undefined) data.channels = channels;
  if (funnel !== undefined) data.funnel = funnel;

  const updated = await prisma.campaign.update({ where: { id: row.id }, data });
  res.json(toCampaign(updated as any));
});

// POST /:id/generate — Trigger Phase 2+3 (must be "planned" status)
router.post("/:id/generate", async (req, res) => {
  req.setTimeout(300000);
  const row = await prisma.campaign.findUnique({ where: { id: req.params.id } });
  if (!row) { res.status(404).json({ error: "Campaign not found" }); return; }
  if (row.status !== "planned") {
    res.status(409).json({ error: "Campaign must be in planned status to generate content" }); return;
  }

  await prisma.campaign.update({ where: { id: row.id }, data: { status: "generating" } });
  const generating = toCampaign({ ...row, status: "generating" } as any);

  try {
    console.log(`[generate] Starting generation for campaign ${row.id} with ${(row.channels as unknown[]).length} channels...`);
    const moodboard = await prisma.moodboard.findUnique({ where: { campaignId: row.id } });
    let visualGuide: string | undefined;
    if (moodboard?.status === "approved") {
      const colors = moodboard.colorEmphasis as string[];
      visualGuide = `GUÍA VISUAL DE CAMPAÑA:\n- Concepto visual: ${moodboard.visualConcept}\n- Estilo fotográfico: ${moodboard.photographyStyle}\n- Énfasis de color: ${colors.join(", ")}\n- Tipografía: ${moodboard.typography}\n- Mood: ${moodboard.mood}`;
    }
    const generated = await generateCampaignContent(generating, undefined, visualGuide);
    console.log(`[generate] Completed! ${generated.channels.filter((c: ChannelPlan) => c.status === "ready").length} channels ready`);
    const saved = await prisma.campaign.update({
      where: { id: generated.id },
      data: {
        channels: generated.channels as any,
        status: generated.status,
      },
    });
    res.json(toCampaign(saved as any));
  } catch (error) {
    console.error("[generate] Campaign generate error:", error);
    await prisma.campaign.update({ where: { id: row.id }, data: { status: "planned" } });
    res.status(500).json({ error: "Failed to generate campaign content" });
  }
});

// PUT /:id/channels/:channelId/select — Select winning variant
router.put("/:id/channels/:channelId/select", async (req, res) => {
  const row = await prisma.campaign.findUnique({ where: { id: req.params.id } });
  if (!row) { res.status(404).json({ error: "Campaign not found" }); return; }

  const { variantId } = req.body;
  if (!variantId) { res.status(400).json({ error: "Missing required field: variantId" }); return; }

  const campaign = toCampaign(row as any);
  const channelIndex = campaign.channels.findIndex((ch: ChannelPlan) => ch.id === req.params.channelId);
  if (channelIndex === -1) { res.status(404).json({ error: "Channel not found" }); return; }

  const channel = campaign.channels[channelIndex];
  const updatedVariants = channel.variants.map((v: ContentVariant) => ({ ...v, selected: v.id === variantId }));
  const updatedChannel = { ...channel, variants: updatedVariants };
  const updatedChannels = [...campaign.channels];
  updatedChannels[channelIndex] = updatedChannel;

  const saved = await prisma.campaign.update({
    where: { id: row.id },
    data: { channels: updatedChannels as any },
  });
  res.json(toCampaign(saved as any));
});

// POST /:id/channels/:channelId/finalize — Generate design + SEO + brand review for selected variant
router.post("/:id/channels/:channelId/finalize", async (req, res) => {
  req.setTimeout(300000);
  const row = await prisma.campaign.findUnique({ where: { id: req.params.id } });
  if (!row) { res.status(404).json({ error: "Campaign not found" }); return; }

  const campaign = toCampaign(row as any);
  const channelIndex = campaign.channels.findIndex((ch: ChannelPlan) => ch.id === req.params.channelId);
  if (channelIndex === -1) { res.status(404).json({ error: "Channel not found" }); return; }

  const selected = campaign.channels[channelIndex].variants.find((v: ContentVariant) => v.selected);
  if (!selected) { res.status(400).json({ error: "No variant selected — select a variant first" }); return; }

  try {
    console.log(`[finalize] Starting for ${campaign.channels[channelIndex].channel} (variant ${selected.label})`);
    const moodboard = await prisma.moodboard.findUnique({ where: { campaignId: row.id } });
    let visualGuide: string | undefined;
    if (moodboard?.status === "approved") {
      const colors = moodboard.colorEmphasis as string[];
      visualGuide = `- Concepto visual: ${moodboard.visualConcept}\n- Estilo fotográfico: ${moodboard.photographyStyle}\n- Énfasis de color: ${colors.join(", ")}\n- Tipografía: ${moodboard.typography}\n- Mood: ${moodboard.mood}`;
    }

    const finalized = await finalizeCampaignChannel(campaign, req.params.channelId, visualGuide);
    const updatedChannels = [...campaign.channels];
    updatedChannels[channelIndex] = finalized;

    const saved = await prisma.campaign.update({
      where: { id: row.id },
      data: { channels: updatedChannels as any },
    });
    res.json(toCampaign(saved as any));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[finalize] Error: ${msg}`);
    res.status(500).json({ error: `Finalize failed: ${msg}` });
  }
});

// POST /:id/channels/:channelId/regenerate — Retry failed channel
router.post("/:id/channels/:channelId/regenerate", async (req, res) => {
  const row = await prisma.campaign.findUnique({ where: { id: req.params.id } });
  if (!row) { res.status(404).json({ error: "Campaign not found" }); return; }

  const campaign = toCampaign(row as any);
  const channelIndex = campaign.channels.findIndex((ch: ChannelPlan) => ch.id === req.params.channelId);
  if (channelIndex === -1) { res.status(404).json({ error: "Channel not found" }); return; }

  const updatedChannels = [...campaign.channels];
  updatedChannels[channelIndex] = { ...updatedChannels[channelIndex], status: "generating" };
  await prisma.campaign.update({
    where: { id: row.id },
    data: { channels: updatedChannels as any },
  });

  const generating = { ...campaign, channels: updatedChannels };

  try {
    const singleChannelCampaign: Campaign = { ...generating, channels: [updatedChannels[channelIndex]] };
    const regenerated = await generateCampaignContent(singleChannelCampaign);

    const mergedChannels = [...updatedChannels];
    mergedChannels[channelIndex] = regenerated.channels[0];

    const saved = await prisma.campaign.update({
      where: { id: row.id },
      data: { channels: mergedChannels as any },
    });
    res.json(toCampaign(saved as any));
  } catch (error) {
    console.error("Channel regenerate error:", error);
    const errChannels = [...updatedChannels];
    errChannels[channelIndex] = { ...errChannels[channelIndex], status: "error" };
    await prisma.campaign.update({
      where: { id: row.id },
      data: { channels: errChannels as any },
    });
    res.status(500).json({ error: "Failed to regenerate channel content" });
  }
});

// PUT /:id/approve — Approve entire campaign + populate Content & Calendar
router.put("/:id/approve", async (req, res) => {
  const row = await prisma.campaign.findUnique({ where: { id: req.params.id } });
  if (!row) { res.status(404).json({ error: "Campaign not found" }); return; }

  const saved = await prisma.campaign.update({
    where: { id: row.id },
    data: { status: "approved" },
  });

  const campaign = toCampaign(saved as any);

  // Sync approved channels to Content and Calendar tables
  try {
    const today = new Date();
    let dayOffset = 0;

    for (const channel of campaign.channels) {
      const selected = channel.variants.find((v: ContentVariant) => v.selected);
      if (!selected) continue;

      // Create Content entry
      await prisma.content.create({
        data: {
          type: channel.channel,
          title: `${campaign.name} — ${channel.channel} (${channel.funnelStage})`,
          line: campaign.line,
          audience: campaign.audience,
          status: "approved",
          content: selected.content,
          designHtml: channel.designHtml,
          brandReview: channel.brandReview ? toJson(channel.brandReview) : undefined,
          agentsInvolved: ["copywriter", "designer", "brand-guardian"] as any,
        },
      });

      // Create Calendar entry — spread channels across upcoming days
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);
      const dateStr = date.toISOString().split("T")[0];
      dayOffset += 2; // space channels 2 days apart

      await prisma.calendarItem.create({
        data: {
          date: dateStr,
          channel: channel.channel,
          line: campaign.line,
          title: `${campaign.name} — ${channel.channel}`,
          status: "planned",
        },
      });
    }
    console.log(`[approve] Synced ${campaign.channels.length} channels to Content + Calendar`);
  } catch (err) {
    // Don't fail the approval if sync has issues
    console.error("[approve] Error syncing to Content/Calendar:", err);
  }

  res.json(campaign);
});

export { router as campaignRouter };
