import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all dependencies before importing the module under test
vi.mock("./competitive-intel.js", () => ({
  competitiveIntelAgent: {
    run: vi.fn(),
  },
  parseQueryGenOutput: vi.fn(),
  parseIntelReportOutput: vi.fn(),
}));

vi.mock("../search/tavily.js", () => ({
  tavilySearchMultiple: vi.fn(),
}));

vi.mock("./data-analyst.js", () => ({
  dataAnalystAgent: {
    run: vi.fn(),
  },
  parseDataAnalystOutput: vi.fn(),
}));

import { runMarketResearch, runInternalAnalysis } from "./intel-orchestrator.js";
import { competitiveIntelAgent, parseQueryGenOutput, parseIntelReportOutput } from "./competitive-intel.js";
import { tavilySearchMultiple } from "../search/tavily.js";
import { dataAnalystAgent, parseDataAnalystOutput } from "./data-analyst.js";

const mockCompetitiveIntelAgent = vi.mocked(competitiveIntelAgent);
const mockParseQueryGenOutput = vi.mocked(parseQueryGenOutput);
const mockParseIntelReportOutput = vi.mocked(parseIntelReportOutput);
const mockTavilySearchMultiple = vi.mocked(tavilySearchMultiple);
const mockDataAnalystAgent = vi.mocked(dataAnalystAgent);
const mockParseDataAnalystOutput = vi.mocked(parseDataAnalystOutput);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Intel Orchestrator", () => {
  describe("runMarketResearch", () => {
    it("produces a complete report", async () => {
      const callbacks = {
        onSearchStarted: vi.fn(),
        onSearchCompleted: vi.fn(),
        onAnalysisStarted: vi.fn(),
        onReportReady: vi.fn(),
      };

      // First call: query generation
      mockCompetitiveIntelAgent.run
        .mockResolvedValueOnce({
          role: "competitive-intel",
          content: '```json\n{"queries":["q1","q2","q3"]}\n```',
        })
        // Second call: analysis
        .mockResolvedValueOnce({
          role: "competitive-intel",
          content: '```json\n{"title":"Report","summary":"Summary","trends":[],"opportunities":[],"sources":[]}\n```',
        });

      mockParseQueryGenOutput.mockReturnValue({
        queries: ["market trend Colombia", "competidores lavandería hoteles", "oportunidades OPL"],
      });

      mockTavilySearchMultiple.mockResolvedValue([
        { title: "Result 1", url: "https://example.com/1", content: "Content 1" },
        { title: "Result 2", url: "https://example.com/2", content: "Content 2" },
      ]);

      mockParseIntelReportOutput.mockReturnValue({
        title: "Reporte de Mercado OPL Colombia",
        summary: "El mercado hotelero muestra crecimiento sostenido con oportunidades en lavandería.",
        trends: [
          {
            trend: "Crecimiento del sector hotelero",
            evidence: "15% de incremento en ocupación hotelera en 2024",
            relevance: "high",
            source: "Cotelco",
          },
        ],
        opportunities: [
          {
            description: "Hoteles boutique sin solución de lavandería",
            targetSegment: "Hoteles boutique 3-4 estrellas",
            suggestedLine: "OPL",
            urgency: "immediate",
            campaignBrief: "Campaña de prospección a hoteles boutique en Medellín y Bogotá",
          },
          {
            description: "Expansión a clínicas pequeñas",
            targetSegment: "Clínicas privadas nivel 2",
            suggestedLine: "MH",
            urgency: "short-term",
            campaignBrief: "Propuesta de valor para clínicas que externalizan lavandería",
          },
        ],
        sources: [
          {
            title: "Informe hotelero 2024",
            url: "https://cotelco.com/informe2024",
            snippet: "El sector creció un 15% en el último año",
          },
        ],
      });

      const report = await runMarketResearch("lavandería hotelera Colombia", "OPL", callbacks);

      // Verify type and status
      expect(report.type).toBe("market-research");
      expect(report.status).toBe("ready");

      // Verify trends populated
      expect(report.trends).toHaveLength(1);
      expect(report.trends[0].trend).toBe("Crecimiento del sector hotelero");
      expect(report.trends[0].relevance).toBe("high");

      // Verify opportunities populated and have ids
      expect(report.opportunities).toHaveLength(2);
      expect(report.opportunities[0].id).toBeDefined();
      expect(typeof report.opportunities[0].id).toBe("string");
      expect(report.opportunities[0].id.length).toBeGreaterThan(0);
      expect(report.opportunities[1].id).toBeDefined();
      expect(report.opportunities[0].id).not.toBe(report.opportunities[1].id);
      expect(report.opportunities[0].description).toBe("Hoteles boutique sin solución de lavandería");

      // Verify callbacks called
      expect(callbacks.onSearchStarted).toHaveBeenCalledWith([
        "market trend Colombia",
        "competidores lavandería hoteles",
        "oportunidades OPL",
      ]);
      expect(callbacks.onSearchCompleted).toHaveBeenCalledWith(2);
      expect(callbacks.onAnalysisStarted).toHaveBeenCalledOnce();
      expect(callbacks.onReportReady).toHaveBeenCalledWith(report);

      // Verify agent called twice
      expect(mockCompetitiveIntelAgent.run).toHaveBeenCalledTimes(2);
      expect(mockParseQueryGenOutput).toHaveBeenCalledOnce();
      expect(mockParseIntelReportOutput).toHaveBeenCalledOnce();
      expect(mockTavilySearchMultiple).toHaveBeenCalledOnce();
    });
  });

  describe("runInternalAnalysis", () => {
    it("produces a report", async () => {
      const callbacks = {
        onAnalysisStarted: vi.fn(),
      };

      mockDataAnalystAgent.run.mockResolvedValue({
        role: "data-analyst",
        content: '```json\n{"title":"Análisis Interno","summary":"Resumen","trends":[],"opportunities":[]}\n```',
      });

      mockParseDataAnalystOutput.mockReturnValue({
        title: "Análisis de Performance Interno Q1 2026",
        summary: "Las campañas OPL muestran el mejor ROI del trimestre.",
        trends: [
          {
            trend: "OPL supera en conversión a otras líneas",
            evidence: "CTR promedio OPL 4.2% vs 2.1% sector",
            relevance: "high",
            source: "Analytics Command Center",
          },
        ],
        opportunities: [
          {
            description: "Escalar campañas OPL con mayor presupuesto",
            targetSegment: "Hoteles 4-5 estrellas Bogotá",
            suggestedLine: "OPL",
            urgency: "immediate",
            campaignBrief: "Duplicar inversión en campañas OPL que ya muestran ROI positivo",
          },
        ],
      });

      const systemData = {
        campaigns: [{ id: "c1", line: "OPL", ctr: 4.2, conversions: 12 }],
        brandScores: [{ date: "2026-03-01", score: 87 }],
      };

      const report = await runInternalAnalysis(systemData, callbacks);

      // Verify type and status
      expect(report.type).toBe("internal-analysis");
      expect(report.status).toBe("ready");

      // Verify sources is empty array
      expect(report.sources).toEqual([]);

      // Verify report fields populated
      expect(report.title).toBe("Análisis de Performance Interno Q1 2026");
      expect(report.summary).toBe("Las campañas OPL muestran el mejor ROI del trimestre.");
      expect(report.trends).toHaveLength(1);
      expect(report.opportunities).toHaveLength(1);
      expect(report.opportunities[0].id).toBeDefined();
      expect(typeof report.opportunities[0].id).toBe("string");

      // Verify callbacks called
      expect(callbacks.onAnalysisStarted).toHaveBeenCalledOnce();

      // Verify agent called once
      expect(mockDataAnalystAgent.run).toHaveBeenCalledOnce();
      expect(mockParseDataAnalystOutput).toHaveBeenCalledOnce();
    });
  });
});
