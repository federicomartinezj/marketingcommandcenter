import { Router } from "express";
import { randomUUID } from "crypto";
import type { CampaignMetrics } from "../../shared/types.js";

const router = Router();
const metricsStore: Map<string, CampaignMetrics> = new Map();

// POST /campaigns/:campaignId/channels/:channelId — Report metrics
router.post("/campaigns/:campaignId/channels/:channelId", (req, res) => {
  const { variantLabel, platform, metrics, notes } = req.body;
  if (!variantLabel || !platform || !metrics) {
    res.status(400).json({ error: "Missing required fields" }); return;
  }
  const entry: CampaignMetrics = {
    id: randomUUID(), campaignId: req.params.campaignId, channelId: req.params.channelId,
    variantLabel, platform, metrics, notes, reportedAt: new Date().toISOString(),
  };
  metricsStore.set(entry.id, entry);
  res.status(201).json(entry);
});

// GET / — List all metrics (optional campaignId filter)
router.get("/", (req, res) => {
  let items = Array.from(metricsStore.values());
  if (req.query.campaignId) items = items.filter((m) => m.campaignId === req.query.campaignId);
  res.json(items);
});

export { router as metricsRouter };
