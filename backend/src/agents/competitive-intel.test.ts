import { describe, it, expect } from "vitest";
import { competitiveIntelAgent, parseQueryGenOutput, parseIntelReportOutput } from "./competitive-intel.js";

describe("Competitive Intel Agent", () => {
  it("has correct role", () => {
    expect(competitiveIntelAgent.role).toBe("competitive-intel");
  });

  it("parses query generation output", () => {
    const raw = `\`\`\`json
{
  "queries": [
    "lavandería industrial hotelera Colombia 2024",
    "equipos lavandería hotel precio Colombia",
    "OPL vs outsourcing lavandería hotel"
  ]
}
\`\`\``;

    const result = parseQueryGenOutput(raw);
    expect(result.queries).toHaveLength(3);
    expect(result.queries[0]).toContain("lavandería");
  });

  it("parses intel report output", () => {
    const raw = `\`\`\`json
{
  "title": "Mercado de Lavandería Industrial en Colombia 2024",
  "summary": "El mercado de lavandería industrial muestra crecimiento sostenido impulsado por el sector hotelero.",
  "trends": [
    {
      "trend": "Adopción de equipos de bajo consumo energético",
      "evidence": "30% de hoteles nuevos instalan equipos eficientes",
      "relevance": "high",
      "source": "Informe sectorial Cotelco 2024"
    }
  ],
  "opportunities": [
    {
      "description": "Hoteles boutique en Medellín buscan soluciones OPL compactas",
      "targetSegment": "Hoteles boutique 30-80 hab",
      "suggestedLine": "OPL",
      "urgency": "short-term",
      "campaignBrief": "Campaña dirigida a hoteles boutique en expansión en Medellín"
    }
  ],
  "sources": [
    {
      "title": "Informe Cotelco 2024",
      "url": "https://cotelco.org/informe-2024",
      "snippet": "El sector hotelero colombiano creció 12% en 2024"
    }
  ]
}
\`\`\``;

    const result = parseIntelReportOutput(raw);
    expect(result.title).toContain("Colombia");
    expect(result.trends).toHaveLength(1);
    expect(result.trends[0]!.relevance).toBe("high");
    expect(result.opportunities).toHaveLength(1);
    expect(result.opportunities[0]!.suggestedLine).toBe("OPL");
    expect(result.sources).toHaveLength(1);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseQueryGenOutput("not json at all")).toThrow();
    expect(() => parseIntelReportOutput("not json at all")).toThrow();
  });
});
