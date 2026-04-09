import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

// POST /campaigns/:campaignId/channels/:channelId — Report metrics
router.post("/campaigns/:campaignId/channels/:channelId", async (req, res) => {
  const { variantLabel, platform, metrics, notes } = req.body;
  if (!variantLabel || !platform || !metrics) {
    res.status(400).json({ error: "Missing required fields" }); return;
  }
  const entry = await prisma.campaignMetric.create({
    data: {
      campaignId: req.params.campaignId,
      channelId: req.params.channelId,
      variantLabel, platform, metrics, notes,
    },
  });
  res.status(201).json({ ...entry, reportedAt: entry.reportedAt.toISOString() });
});

// GET / — List all metrics (optional campaignId filter)
router.get("/", async (req, res) => {
  const where = req.query.campaignId ? { campaignId: req.query.campaignId as string } : {};
  const items = await prisma.campaignMetric.findMany({ where });
  res.json(items.map((m) => ({ ...m, reportedAt: m.reportedAt.toISOString() })));
});

export { router as metricsRouter };
