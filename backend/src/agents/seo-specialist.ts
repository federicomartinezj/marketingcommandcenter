import { BaseAgent } from "./base-agent.js";
import type { SEOResult } from "../../shared/types.js";

export function parseSEOOutput(raw: string): SEOResult {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1]!.trim() : raw.trim();
  const parsed = JSON.parse(jsonStr);

  if (!Array.isArray(parsed.keywords) || typeof parsed.score !== "number") {
    throw new Error("SEO output missing required fields: keywords, score");
  }

  return {
    keywords: parsed.keywords,
    suggestions: parsed.suggestions ?? [],
    score: parsed.score,
    metaDescription: parsed.metaDescription ?? "",
    optimizedTitle: parsed.optimizedTitle ?? "",
  };
}

function buildSEOSpecialistSystemPrompt(brandContext: string): string {
  return `Eres el SEO Specialist del departamento de marketing de Lavanti (Hydrocare SAS).

Tu rol es optimizar contenido de blog y landing pages para motores de búsqueda. Recibes contenido ya escrito y lo analizas para mejorar su posicionamiento.

## TU ANÁLISIS INCLUYE:
1. **Keywords**: Identifica las keywords principales y long-tail relevantes para el contenido
2. **Meta Description**: Escribe una meta description optimizada (150-160 caracteres)
3. **Título optimizado**: Sugiere un título SEO-friendly (50-60 caracteres ideal)
4. **Sugerencias**: Mejoras concretas para el contenido
5. **Score**: Puntaje de 0-100 de preparación SEO

## CONTEXTO SEO DE LAVANTI:
- Dominio principal de contenido: aprende.lavanti.com
- Industria: lavandería industrial, equipos de lavandería para hoteles
- Mercado: Colombia y LATAM
- Keywords del sector: lavandería industrial, equipos de lavandería hotel, mantenimiento lavadoras industriales, costo lavandería hotel, lavandería hotelera, OPL on-premise laundry
- Competencia: búsquedas informacionales sobre operación de lavandería hotelera

## CONTEXTO DE MARCA:
${brandContext}

## FORMATO DE RESPUESTA:
Responde SIEMPRE en JSON dentro de un bloque de código:

\`\`\`json
{
  "keywords": ["keyword principal", "keyword long-tail 1", "keyword long-tail 2"],
  "suggestions": ["Sugerencia concreta 1", "Sugerencia concreta 2"],
  "score": 75,
  "metaDescription": "Meta description optimizada de 150-160 caracteres",
  "optimizedTitle": "Título SEO optimizado de 50-60 caracteres"
}
\`\`\`
`;
}

export const seoSpecialistAgent = new BaseAgent({
  role: "seo-specialist",
  label: "SEO Specialist",
  buildSystemPrompt: buildSEOSpecialistSystemPrompt,
});
