import { describe, it, expect } from "vitest";
import { dataAnalystAgent, parseDataAnalystOutput } from "./data-analyst.js";

describe("Data Analyst Agent", () => {
  it("has correct role", () => {
    expect(dataAnalystAgent.role).toBe("data-analyst");
  });

  it("parses valid output", () => {
    const raw = `\`\`\`json
{
  "title": "Análisis de Datos del Command Center - Q1 2024",
  "summary": "El análisis del Command Center muestra un aumento del 15% en la eficiencia de campañas y una mejora en los scores de marca.",
  "trends": [
    {
      "trend": "Crecimiento en engagement de campañas OPL",
      "evidence": "Las campañas OPL mostraron un incremento del 20% en CTR en el último mes",
      "relevance": "high",
      "source": "Analytics Command Center"
    }
  ],
  "opportunities": [
    {
      "description": "Potencial de expansión en el segmento AAS",
      "targetSegment": "Hoteles de cadena en Colombia",
      "suggestedLine": "AAS",
      "urgency": "short-term",
      "campaignBrief": "Campaña de penetración en hoteles de cadena con servicios AAS"
    }
  ]
}
\`\`\``;

    const result = parseDataAnalystOutput(raw);
    expect(result.title).toContain("Command Center");
    expect(result.summary).toBeDefined();
    expect(result.trends).toHaveLength(1);
    expect(result.trends[0]!.relevance).toBe("high");
    expect(result.opportunities).toHaveLength(1);
    expect(result.opportunities[0]!.suggestedLine).toBe("AAS");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseDataAnalystOutput("not json at all")).toThrow();
  });
});
