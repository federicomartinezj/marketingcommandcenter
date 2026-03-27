import { randomUUID } from "crypto";
import type { Moodboard, BusinessLine } from "../../shared/types.js";
import { designerAgent } from "./designer.js";

interface MoodboardFields {
  visualConcept: string;
  photographyStyle: string;
  colorEmphasis: string[];
  typography: string;
  mood: string;
  imagePrompts: string[];
  htmlPreview: string;
}

export function parseMoodboardOutput(raw: string): MoodboardFields {
  // Try extracting JSON from markdown code block (greedy to capture full content)
  const match = raw.match(/```(?:json)?\s*([\s\S]*)```/);
  let jsonStr = match ? match[1].trim() : null;

  // If no closing ```, take everything after opening ```json
  if (!jsonStr) {
    const openMatch = raw.match(/```(?:json)?\s*([\s\S]*)/);
    if (openMatch) {
      jsonStr = openMatch[1].trim();
      // Remove trailing ``` if present
      jsonStr = jsonStr.replace(/```\s*$/, "").trim();
    }
  }

  // If no code block at all, try finding JSON object directly
  if (!jsonStr) {
    const jsonMatch = raw.match(/\{[\s\S]*"visualConcept"[\s\S]*\}/);
    jsonStr = jsonMatch ? jsonMatch[0] : null;
  }

  if (!jsonStr) {
    throw new Error("No JSON found in moodboard output. Raw response starts with: " + raw.substring(0, 200));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr.trim());
  } catch (e) {
    throw new Error(`Failed to parse moodboard JSON: ${(e as Error).message}. Content starts with: ${jsonStr.substring(0, 200)}`);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Moodboard output is not a JSON object");
  }

  const obj = parsed as Record<string, unknown>;

  const requiredFields: (keyof MoodboardFields)[] = [
    "visualConcept",
    "photographyStyle",
    "colorEmphasis",
    "typography",
    "mood",
    "imagePrompts",
    "htmlPreview",
  ];

  for (const field of requiredFields) {
    if (!(field in obj)) {
      throw new Error(`Moodboard output missing required field: ${field}`);
    }
  }

  if (!Array.isArray(obj.colorEmphasis)) {
    throw new Error("Moodboard field 'colorEmphasis' must be an array");
  }
  if (!Array.isArray(obj.imagePrompts)) {
    throw new Error("Moodboard field 'imagePrompts' must be an array");
  }

  return {
    visualConcept: String(obj.visualConcept),
    photographyStyle: String(obj.photographyStyle),
    colorEmphasis: (obj.colorEmphasis as unknown[]).map(String),
    typography: String(obj.typography),
    mood: String(obj.mood),
    imagePrompts: (obj.imagePrompts as unknown[]).map(String),
    htmlPreview: String(obj.htmlPreview),
  };
}

export async function generateMoodboard(
  campaignId: string,
  concept: string,
  line: BusinessLine,
  audience: string,
  objective: string
): Promise<Moodboard> {
  const result = await designerAgent.run({
    line,
    userMessage: `MODO MOODBOARD — Genera un moodboard visual para esta campaña.

CAMPAÑA:
- Concepto: ${concept}
- Línea: ${line}
- Audiencia: ${audience}
- Objetivo: ${objective}

IMPORTANTE: Responde ÚNICAMENTE con un bloque JSON dentro de \`\`\`json ... \`\`\` con estos campos exactos:
- visualConcept (string)
- photographyStyle (string)
- colorEmphasis (array de strings)
- typography (string)
- mood (string)
- imagePrompts (array de strings en inglés para generación de imágenes)
- htmlPreview (string con HTML completo de un moodboard visual de 800x600px)

El htmlPreview debe incluir: bloques de colores, tipografía de ejemplo, mood keywords, y usar la paleta correcta de la línea ${line}. Texto visible siempre.

NO respondas con HTML suelto. Responde SOLO con el JSON.`,
  });

  const fields = parseMoodboardOutput(result.content);

  return {
    id: randomUUID(),
    campaignId,
    ...fields,
    status: "ready",
    createdAt: new Date().toISOString(),
  };
}
