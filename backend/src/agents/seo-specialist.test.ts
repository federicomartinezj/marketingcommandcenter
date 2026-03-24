import { describe, it, expect } from "vitest";
import { seoSpecialistAgent, parseSEOOutput } from "./seo-specialist.js";

describe("SEO Specialist Agent", () => {
  it("has correct role", () => {
    expect(seoSpecialistAgent.role).toBe("seo-specialist");
  });

  it("parses valid JSON output into SEOResult", () => {
    const raw = `\`\`\`json
{
  "keywords": ["mantenimiento lavadoras industriales", "costo equipo parado hotel"],
  "suggestions": ["Agregar internal link a guía de mantenimiento", "Incluir datos de tiempo de inactividad"],
  "score": 78,
  "metaDescription": "Descubre el costo real de mantener equipos de lavandería viejos en tu hotel y cómo reducirlo.",
  "optimizedTitle": "El Costo Oculto de los Equipos de Lavandería Viejos en tu Hotel"
}
\`\`\``;

    const result = parseSEOOutput(raw);
    expect(result.keywords).toHaveLength(2);
    expect(result.score).toBe(78);
    expect(result.metaDescription).toContain("costo real");
    expect(result.optimizedTitle).toContain("Costo Oculto");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseSEOOutput("not json")).toThrow();
  });
});
