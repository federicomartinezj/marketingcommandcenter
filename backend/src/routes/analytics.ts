import { Router } from "express";
import { randomUUID } from "crypto";
import type { PerformanceReport, CampaignMetrics } from "../../shared/types.js";
import { dataAnalystAgent } from "../agents/data-analyst.js";

const router = Router();
const analyticsStore: Map<string, PerformanceReport> = new Map();

// POST /performance — Run performance analysis
router.post("/performance", async (req, res) => {
  req.setTimeout(300000);
  try {
    const port = process.env.PORT || 3001;
    const metricsRes = await fetch(`http://localhost:${port}/api/metrics`);
    const allMetrics: CampaignMetrics[] = await metricsRes.json();
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

    const report: PerformanceReport = {
      id: randomUUID(),
      title: parsed.title || "Análisis de Performance",
      summary: parsed.summary || "",
      insights: parsed.insights || [],
      linePerformance: parsed.linePerformance || [],
      variantAnalysis: parsed.variantAnalysis || [],
      recommendations: parsed.recommendations || [],
      createdAt: new Date().toISOString(),
    };
    analyticsStore.set(report.id, report);
    res.json(report);
  } catch (error) {
    console.error("[analytics] Error:", error);
    res.status(500).json({ error: "Failed to run performance analysis" });
  }
});

// GET /reports — List
router.get("/reports", (_req, res) => {
  res.json(Array.from(analyticsStore.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

// GET /reports/:id
router.get("/reports/:id", (req, res) => {
  const r = analyticsStore.get(req.params.id);
  if (!r) { res.status(404).json({ error: "Report not found" }); return; }
  res.json(r);
});

export { router as analyticsRouter };
