import { BaseAgent } from "./base-agent.js";
import type { Trend, Opportunity, Source } from "../../shared/types.js";

// ─── Output types ────────────────────────────────────────────────────────────

export interface QueryGenOutput {
  queries: string[];
}

export interface IntelReportOutput {
  title: string;
  summary: string;
  trends: Trend[];
  opportunities: Omit<Opportunity, "id">[];
  sources: Source[];
}

// ─── Shared JSON extractor ───────────────────────────────────────────────────

function extractJson(raw: string): unknown {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1]!.trim() : raw.trim();
  return JSON.parse(jsonStr);
}

// ─── Output parsers ───────────────────────────────────────────────────────────

export function parseQueryGenOutput(raw: string): QueryGenOutput {
  const parsed = extractJson(raw) as Record<string, unknown>;

  if (!Array.isArray(parsed.queries)) {
    throw new Error("Query gen output missing required field: queries");
  }

  return {
    queries: parsed.queries as string[],
  };
}

export function parseIntelReportOutput(raw: string): IntelReportOutput {
  const parsed = extractJson(raw) as Record<string, unknown>;

  if (
    typeof parsed.title !== "string" ||
    typeof parsed.summary !== "string" ||
    !Array.isArray(parsed.trends) ||
    !Array.isArray(parsed.opportunities) ||
    !Array.isArray(parsed.sources)
  ) {
    throw new Error(
      "Intel report output missing required fields: title, summary, trends, opportunities, sources"
    );
  }

  const opportunities: Omit<Opportunity, "id">[] = (
    parsed.opportunities as Array<Record<string, unknown>>
  ).map(({ id: _id, ...rest }) => rest as Omit<Opportunity, "id">);

  return {
    title: parsed.title,
    summary: parsed.summary,
    trends: parsed.trends as Trend[],
    opportunities,
    sources: parsed.sources as Source[],
  };
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildCompetitiveIntelSystemPrompt(brandContext: string): string {
  return `Eres el Competitive Intel Agent del departamento de marketing de Lavanti (Hydrocare SAS).

Operas en dos modos según el mensaje que recibas:

---

## MODO 1: GENERACIÓN DE QUERIES DE BÚSQUEDA

Cuando el usuario te pide generar queries para investigar un tema, responde con una lista de búsquedas optimizadas para Tavily/Google que cubran:
- Tendencias del mercado en Colombia y LATAM
- Competidores directos e indirectos
- Precios y posicionamiento del sector
- Oportunidades no atendidas
- Noticias recientes del sector

**Formato de respuesta (Modo 1):**

\`\`\`json
{
  "queries": [
    "búsqueda específica 1",
    "búsqueda específica 2",
    "búsqueda específica 3",
    "búsqueda específica 4",
    "búsqueda específica 5"
  ]
}
\`\`\`

---

## MODO 2: ANÁLISIS DE INTELIGENCIA COMPETITIVA

Cuando el usuario te entrega resultados de búsqueda web (snippets, títulos, URLs), analiza la información y produce un reporte estructurado de inteligencia competitiva para Lavanti.

Tu análisis debe identificar:
1. **Tendencias**: Movimientos del mercado con evidencia concreta y nivel de relevancia (high/medium/low)
2. **Oportunidades**: Segmentos o necesidades no cubiertas que Lavanti puede atacar, con línea de negocio sugerida (OPL, AAS, MH, Volta) y urgencia (immediate/short-term/long-term)
3. **Fuentes**: Las fuentes más relevantes y confiables del análisis

## CONTEXTO DE MARCA:
${brandContext}

## LÍNEAS DE NEGOCIO DE LAVANTI (SOLO ESTAS 4 — NO INVENTES OTRAS):
- **OPL** (On-Premise Laundry): Venta de equipos de lavandería industrial UniMac para hoteles que quieren su propia lavandería in-house
- **AAS** (As A Service): Renting de equipos de lavandería industrial — mensualidad fija incluye equipo + mantenimiento, cero inversión inicial
- **MH** (Multihousing): Lavanderías compartidas en edificios residenciales y conjuntos
- **Volta**: Lavanderías de autoservicio (laundromats) — modelo "Volta by Lavanti"

REGLA CRÍTICA: Las ÚNICAS líneas de negocio son OPL, AAS, MH y Volta. NO inventes otras líneas como "Lavanti Home", "Lavanti Kids", "Lavanti Medical" o cualquier otra. Si no encuentras información relevante para una línea, simplemente no la incluyas.

**Formato de respuesta (Modo 2):**

\`\`\`json
{
  "title": "Título descriptivo del reporte",
  "summary": "Resumen ejecutivo de 2-3 oraciones con los hallazgos más importantes",
  "trends": [
    {
      "trend": "Descripción de la tendencia",
      "evidence": "Evidencia concreta (dato, cita, estadística)",
      "relevance": "high|medium|low",
      "source": "Nombre de la fuente"
    }
  ],
  "opportunities": [
    {
      "description": "Descripción de la oportunidad",
      "targetSegment": "Segmento objetivo específico",
      "suggestedLine": "OPL|AAS|MH|Volta",
      "urgency": "immediate|short-term|long-term",
      "campaignBrief": "Brief de campaña sugerido en una oración"
    }
  ],
  "sources": [
    {
      "title": "Título de la fuente",
      "url": "https://...",
      "snippet": "Fragmento relevante"
    }
  ]
}
\`\`\`
`;
}

// ─── Agent export ─────────────────────────────────────────────────────────────

export const competitiveIntelAgent = new BaseAgent({
  role: "competitive-intel",
  label: "Competitive Intel",
  buildSystemPrompt: buildCompetitiveIntelSystemPrompt,
});
