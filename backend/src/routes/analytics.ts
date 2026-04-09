import { Router } from "express";
import type { PerformanceReport, CampaignMetrics } from "../../shared/types.js";
import { dataAnalystAgent } from "../agents/data-analyst.js";
import { prisma } from "../db.js";

const router = Router();

// POST /performance — Run performance analysis
router.post("/performance", async (req, res) => {
  req.setTimeout(300000);
  try {
    const allMetrics = await prisma.campaignMetric.findMany();
    if (allMetrics.length === 0) { res.status(400).json({ error: "No hay métricas reportadas" }); return; }

    const metricsContext = allMetrics.map((m) =>
      `Campaign: ${m.campaignId}, Channel: ${m.platform}, Variant: ${m.variantLabel}, Metrics: ${JSON.stringify(m.metrics)}`
    ).join("\n");

    const result = await dataAnalystAgent.run({
      line: "OPL",
      userMessage: `MODO PERFORMANCE: Analiza las métricas de performance de campañas publicadas.\n\nMÉTRICAS:\n${metricsContext}\n\nResponde en JSON con: title, summary, insights (finding+recommendation+impact), linePerformance (line+campaigns+avgCTR+totalLeads+topChannel), variantAnalysis (label A/B/C + angle emocional/racional/social + avgCTR + timesSelected + timesPublished), recommendations.`,
    });

    const jsonMatch = result.content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1]!.trim() : result.content.trim();
    const parsed = JSON.parse(jsonStr);

    const report = await prisma.performanceReport.create({
      data: {
        title: parsed.title || "Análisis de Performance",
        summary: parsed.summary || "",
        insights: parsed.insights || [],
        linePerformance: parsed.linePerformance || [],
        variantAnalysis: parsed.variantAnalysis || [],
        recommendations: parsed.recommendations || [],
      },
    });

    res.json({
      ...report,
      createdAt: report.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[analytics] Error:", error);
    res.status(500).json({ error: "Failed to run performance analysis" });
  }
});

// GET /reports — List
router.get("/reports", async (_req, res) => {
  const rows = await prisma.performanceReport.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

// GET /reports/:id
router.get("/reports/:id", async (req, res) => {
  const r = await prisma.performanceReport.findUnique({ where: { id: req.params.id } });
  if (!r) { res.status(404).json({ error: "Report not found" }); return; }
  res.json({ ...r, createdAt: r.createdAt.toISOString() });
});

export { router as analyticsRouter };
