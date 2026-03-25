import { Router } from "express";
import { randomUUID } from "crypto";
import http from "http";
import type { IntelReport } from "../../shared/types.js";
import { runMarketResearch, runInternalAnalysis } from "../agents/intel-orchestrator.js";

const router = Router();
const reportStore: Map<string, IntelReport> = new Map();

// Helper for internal HTTP calls
function httpPost(url: string, body: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };
    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error(`Failed to parse response: ${raw}`)); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// POST /research — run market research, store and return report
router.post("/research", async (req, res) => {
  req.setTimeout(300000);
  const { query, line } = req.body as { query?: string; line?: string };

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    res.status(400).json({ error: "Missing required field: query" });
    return;
  }

  try {
    const report = await runMarketResearch(query.trim(), line as never);
    reportStore.set(report.id, report);
    res.status(201).json(report);
  } catch (error) {
    console.error("[intel] Market research error:", error);
    res.status(500).json({ error: "Failed to run market research" });
  }
});

// POST /internal-analysis — run internal analysis, store and return report
router.post("/internal-analysis", async (req, res) => {
  req.setTimeout(300000);
  const systemData = req.body as Record<string, unknown>;

  try {
    const report = await runInternalAnalysis(systemData);
    reportStore.set(report.id, report);
    res.status(201).json(report);
  } catch (error) {
    console.error("[intel] Internal analysis error:", error);
    res.status(500).json({ error: "Failed to run internal analysis" });
  }
});

// GET /reports — list with optional filters: type, line, status
router.get("/reports", (req, res) => {
  let items = Array.from(reportStore.values());

  if (req.query.type) {
    items = items.filter((r) => r.type === req.query.type);
  }
  if (req.query.line) {
    items = items.filter((r) => r.line === req.query.line);
  }
  if (req.query.status) {
    items = items.filter((r) => r.status === req.query.status);
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(items);
});

// GET /reports/:id — detail, 404 if missing
router.get("/reports/:id", (req, res) => {
  const report = reportStore.get(req.params.id);
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(report);
});

// POST /reports/:id/create-campaign — find opportunity, create + analyze campaign
router.post("/reports/:id/create-campaign", async (req, res) => {
  req.setTimeout(300000);
  const report = reportStore.get(req.params.id);
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  const { opportunityId } = req.body as { opportunityId?: string };
  if (!opportunityId) {
    res.status(400).json({ error: "Missing required field: opportunityId" });
    return;
  }

  const opportunity = report.opportunities.find((o) => o.id === opportunityId);
  if (!opportunity) {
    res.status(404).json({ error: "Opportunity not found in report" });
    return;
  }

  const PORT = process.env.PORT || 3001;
  const baseUrl = `http://localhost:${PORT}`;

  try {
    // Create campaign
    const campaignPayload = {
      brief: opportunity.campaignBrief,
      line: opportunity.suggestedLine,
      audience: opportunity.targetSegment,
      objective: opportunity.description,
    };

    const campaign = await httpPost(`${baseUrl}/api/campaigns`, campaignPayload) as { id: string };

    // Analyze campaign
    const analyzed = await httpPost(`${baseUrl}/api/campaigns/${campaign.id}/analyze`, {}) as { id: string };

    // Link campaignId to opportunity in report
    const updatedOpportunities = report.opportunities.map((o) =>
      o.id === opportunityId ? { ...o, campaignId: analyzed.id } : o
    );
    const updatedReport: IntelReport = { ...report, opportunities: updatedOpportunities };
    reportStore.set(report.id, updatedReport);

    res.status(201).json({ report: updatedReport, campaign: analyzed });
  } catch (error) {
    console.error("[intel] Create campaign from opportunity error:", error);
    res.status(500).json({ error: "Failed to create campaign from opportunity" });
  }
});

// PUT /reports/:id/archive — set status to "archived"
router.put("/reports/:id/archive", (req, res) => {
  const report = reportStore.get(req.params.id);
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  const archived: IntelReport = { ...report, status: "archived" };
  reportStore.set(archived.id, archived);
  res.json(archived);
});

// POST /monthly — run research for all business lines + internal analysis
router.post("/monthly", async (req, res) => {
  req.setTimeout(600000);

  const lineQueries: Array<{ line: "OPL" | "AAS" | "MH" | "Volta"; query: string }> = [
    { line: "OPL", query: "tendencias y competencia en el mercado de hoteles boutique en Colombia 2025" },
    { line: "AAS", query: "tendencias en servicios de automatización y administración para hoteles en Colombia 2025" },
    { line: "MH", query: "tendencias en el mercado de casas de descanso y glamping en Colombia 2025" },
    { line: "Volta", query: "tendencias en movilidad eléctrica y estaciones de carga en Colombia 2025" },
  ];

  const internalData = (req.body && Object.keys(req.body).length > 0)
    ? req.body as Record<string, unknown>
    : { note: "Monthly automated internal analysis", date: new Date().toISOString() };

  try {
    const researchResults = await Promise.allSettled(
      lineQueries.map(({ line, query }) => runMarketResearch(query, line))
    );

    const internalResult = await runInternalAnalysis(internalData).catch((err) => {
      console.error("[intel] Monthly internal analysis error:", err);
      return null;
    });

    const reports: IntelReport[] = [];

    for (const result of researchResults) {
      if (result.status === "fulfilled") {
        reportStore.set(result.value.id, result.value);
        reports.push(result.value);
      } else {
        console.error("[intel] Monthly research error:", result.reason);
        const errorReport: IntelReport = {
          id: randomUUID(),
          type: "market-research",
          title: "Error en investigación mensual",
          summary: String(result.reason),
          query: "monthly",
          trends: [],
          opportunities: [],
          sources: [],
          status: "error",
          errorMessage: String(result.reason),
          createdAt: new Date().toISOString(),
        };
        reportStore.set(errorReport.id, errorReport);
        reports.push(errorReport);
      }
    }

    if (internalResult) {
      reportStore.set(internalResult.id, internalResult);
      reports.push(internalResult);
    }

    res.status(201).json({ reports, count: reports.length });
  } catch (error) {
    console.error("[intel] Monthly run error:", error);
    res.status(500).json({ error: "Failed to run monthly intelligence" });
  }
});

export { router as intelRouter };
