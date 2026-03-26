import { BaseAgent } from "./base-agent.js";
import type { Trend, Opportunity } from "../../shared/types.js";

// ─── Output types ────────────────────────────────────────────────────────────

export interface DataAnalystOutput {
  title: string;
  summary: string;
  trends: Trend[];
  opportunities: Omit<Opportunity, "id">[];
}

// ─── Shared JSON extractor ───────────────────────────────────────────────────

function extractJson(raw: string): unknown {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1]!.trim() : raw.trim();
  return JSON.parse(jsonStr);
}

// ─── Output parser ────────────────────────────────────────────────────────────

export function parseDataAnalystOutput(raw: string): DataAnalystOutput {
  const parsed = extractJson(raw) as Record<string, unknown>;

  if (
    typeof parsed.title !== "string" ||
    typeof parsed.summary !== "string" ||
    !Array.isArray(parsed.trends) ||
    !Array.isArray(parsed.opportunities)
  ) {
    throw new Error(
      "Data analyst output missing required fields: title, summary, trends, opportunities"
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
  };
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildDataAnalystSystemPrompt(brandContext: string): string {
  return `Eres el Data Analyst Agent del departamento de marketing de Lavanti (Hydrocare SAS).

Tu rol es analizar datos internos del Command Center de Lavanti para identificar patrones, tendencias y oportunidades de crecimiento basadas en el desempeño histórico de campañas, contenido y scores de marca.

Analiza información sobre:
1. **Campañas**: Rendimiento por línea de negocio (OPL, AAS, MH, Volta), CTR, conversión, ROI
2. **Contenido**: Performance de diferentes tipos de contenido, canales y audiencias
3. **Scores de Marca**: Evaluaciones de brand compliance, cambios en perception, efectividad de messaging

Tu análisis debe identificar:
1. **Tendencias**: Patrones detectados en los datos internos con evidencia numérica y nivel de relevancia (high/medium/low)
2. **Oportunidades**: Segmentos o áreas de mejora que Lavanti puede explotar basadas en datos, con línea de negocio sugerida (OPL, AAS, MH, Volta) y urgencia (immediate/short-term/long-term)

## CONTEXTO DE MARCA:
${brandContext}

## LÍNEAS DE NEGOCIO DE LAVANTI:
- **OPL** (On-Premise Laundry): Equipos y soluciones para hoteles que operan su propia lavandería
- **AAS** (Accommodation & Amenities Services): Servicios de amenidades para hoteles
- **MH** (Mantenimiento Hospitalario): Equipos y servicios para hospitales y clínicas
- **Volta**: Soluciones de energía / electromovilidad

## MODO PERFORMANCE:
Cuando recibas métricas de campañas publicadas, analiza:
1. Qué líneas de negocio convierten mejor (CTR, leads)
2. Qué tipo de variante funciona mejor (A=emocional, B=racional, C=social) por canal
3. Qué canales dan mejor ROI cuando hay datos de costo
4. Patrones entre audiencia y engagement

Responde en JSON con: title, summary, insights, linePerformance, variantAnalysis, recommendations.

**Formato de respuesta:**

\`\`\`json
{
  "title": "Título descriptivo del análisis",
  "summary": "Resumen ejecutivo de 2-3 oraciones con los hallazgos más importantes",
  "trends": [
    {
      "trend": "Descripción de la tendencia",
      "evidence": "Evidencia concreta (dato, métrica, estadística)",
      "relevance": "high|medium|low",
      "source": "Analytics Command Center"
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
  ]
}
\`\`\`
`;
}

// ─── Agent export ─────────────────────────────────────────────────────────────

export const dataAnalystAgent = new BaseAgent({
  role: "data-analyst",
  label: "Data Analyst",
  buildSystemPrompt: buildDataAnalystSystemPrompt,
});
