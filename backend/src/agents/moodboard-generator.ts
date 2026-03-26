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
  // Extract JSON from markdown code block
  const match = raw.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) {
    throw new Error("No JSON code block found in moodboard output");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[1]);
  } catch (e) {
    throw new Error(`Failed to parse moodboard JSON: ${(e as Error).message}`);
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
    userMessage: `Genera un moodboard para esta campaña. Responde en el formato JSON especificado en MODO MOODBOARD.

CAMPAÑA:
- Concepto: ${concept}
- Línea: ${line}
- Audiencia: ${audience}
- Objetivo: ${objective}

Asegúrate de que el htmlPreview sea un collage visual completo de 800x600px con la paleta de colores, tipografía, y mood de la línea ${line}.`,
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
