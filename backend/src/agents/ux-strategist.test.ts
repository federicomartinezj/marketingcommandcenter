import { describe, it, expect } from "vitest";
import { uxStrategistAgent, parseUXStrategyOutput } from "./ux-strategist.js";

describe("UX Strategist Agent", () => {
  it("has correct role", () => {
    expect(uxStrategistAgent.role).toBe("ux-strategist");
  });

  it("parses valid JSON output into strategy", () => {
    const raw = `\`\`\`json
{
  "concept": "Deja de apagar incendios",
  "funnel": [
    { "stage": "awareness", "description": "Pieza viral WhatsApp", "channels": ["whatsapp", "facebook-ad"] },
    { "stage": "nurture", "description": "Email sequence + blog educativo", "channels": ["email-sequence", "blog-post"] },
    { "stage": "conversion", "description": "Landing page con cotizador", "channels": ["landing-page"] }
  ],
  "landingStructure": {
    "sections": ["hero", "pain-points", "benefits", "social-proof", "cta"],
    "sectionBriefs": {
      "hero": "Headline sobre el costo oculto de equipos viejos",
      "pain-points": "3 dolores del jefe de mantenimiento",
      "benefits": "Beneficios de equipos nuevos UniMac",
      "social-proof": "Caso Hotel Dann Carlton",
      "cta": "Cotiza tu equipo hoy"
    }
  }
}
\`\`\``;

    const result = parseUXStrategyOutput(raw);
    expect(result.concept).toBe("Deja de apagar incendios");
    expect(result.funnel).toHaveLength(3);
    expect(result.funnel[0].stage).toBe("awareness");
    expect(result.funnel[0].channels).toContain("whatsapp");
    expect(result.landingStructure?.sections).toHaveLength(5);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseUXStrategyOutput("not json")).toThrow();
  });
});
