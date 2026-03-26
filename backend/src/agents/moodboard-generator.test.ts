import { describe, it, expect } from "vitest";
import { parseMoodboardOutput } from "./moodboard-generator.js";

const VALID_MOODBOARD_JSON = `
\`\`\`json
{
  "visualConcept": "Industrial elegance meets operational precision",
  "photographyStyle": "High-contrast commercial photography with dramatic lighting",
  "colorEmphasis": ["#262626 para fondos principales", "#0D86FF para highlights y CTAs"],
  "typography": "Manrope 800 extrabold para headlines, 400 regular para body",
  "mood": "Confianza, eficiencia, liderazgo industrial",
  "imagePrompts": [
    "Professional photograph of a modern industrial laundry facility with rows of stainless steel washing machines, dramatic overhead lighting, photorealistic, 8k",
    "Close-up shot of hotel linen folding process, clean white towels, warm light, professional, photorealistic, high resolution, 8k"
  ],
  "htmlPreview": "<div style='width:800px;height:600px;background:#262626;color:#fff;font-family:Manrope,sans-serif;padding:32px;box-sizing:border-box'><h1 style='color:#0D86FF'>INDUSTRIAL ELEGANCE</h1><p>Mood preview</p></div>"
}
\`\`\`
`;

describe("parseMoodboardOutput", () => {
  it("parses a valid moodboard JSON from markdown code block", () => {
    const result = parseMoodboardOutput(VALID_MOODBOARD_JSON);

    expect(result.visualConcept).toBe("Industrial elegance meets operational precision");
    expect(result.photographyStyle).toBe("High-contrast commercial photography with dramatic lighting");
    expect(result.colorEmphasis).toHaveLength(2);
    expect(result.colorEmphasis[0]).toBe("#262626 para fondos principales");
    expect(result.typography).toBe("Manrope 800 extrabold para headlines, 400 regular para body");
    expect(result.mood).toBe("Confianza, eficiencia, liderazgo industrial");
    expect(result.imagePrompts).toHaveLength(2);
    expect(result.imagePrompts[0]).toContain("photorealistic");
    expect(result.htmlPreview).toContain("<div");
    expect(result.htmlPreview).toContain("INDUSTRIAL ELEGANCE");
  });

  it("throws on invalid or missing moodboard fields", () => {
    const invalidRaw = `
\`\`\`json
{
  "visualConcept": "Only this field"
}
\`\`\`
`;
    expect(() => parseMoodboardOutput(invalidRaw)).toThrow();
  });
});
