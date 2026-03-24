import type { BrandReview } from "../../shared/types.js";

export function parseBrandReview(raw: string): BrandReview {
  try {
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
    const parsed = JSON.parse(jsonMatch[1]!.trim());
    return {
      approved: parsed.approved ?? false,
      score: parsed.score ?? 0,
      checks: (parsed.checks ?? []).map((c: Record<string, unknown>) => ({
        name: String(c.name ?? ""),
        passed: Boolean(c.passed),
        detail: String(c.detail ?? ""),
        severity: (c.severity as "info" | "warning" | "error") ?? "info",
      })),
      reviewedAt: new Date().toISOString(),
    };
  } catch {
    return {
      approved: false,
      score: 0,
      checks: [{ name: "Parse Error", passed: false, detail: "Could not parse brand review response", severity: "error" as const }],
      reviewedAt: new Date().toISOString(),
    };
  }
}
