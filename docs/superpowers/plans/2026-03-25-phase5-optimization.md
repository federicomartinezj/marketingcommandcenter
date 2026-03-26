# Phase 5: Optimization + Visual Director Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add campaign moodboards (Visual Director), manual performance metrics tracking, and a Business Analyst that learns what converts from real campaign data.

**Architecture:** Three subsystems: (1) Moodboard generation as new campaign pipeline phase between strategy and content generation, (2) Metrics reporting per published channel with form logic by content type, (3) Data Analyst upgrade with performance analysis mode. All feeding into a learning loop.

**Tech Stack:** TypeScript, Express, Claude API, React, Zustand, Tailwind

**Spec:** `docs/superpowers/specs/2026-03-25-phase5-optimization-design.md`

---

## File Structure

### Backend — New Files
- `backend/src/agents/moodboard-generator.ts` — Moodboard generation logic (calls Designer in moodboard mode)
- `backend/src/routes/metrics.ts` — Metrics CRUD routes
- `backend/src/routes/analytics.ts` — Performance analysis routes

### Backend — Modified Files
- `shared/types.ts` — Phase 5 types
- `backend/src/agents/designer.ts` — Add moodboard mode to system prompt
- `backend/src/agents/data-analyst.ts` — Add performance analysis mode to system prompt
- `backend/src/agents/campaign-orchestrator.ts` — Inject visual guide into content generation prompts
- `backend/src/routes/campaigns.ts` — Add moodboard endpoints
- `backend/src/index.ts` — Mount new routers

### Frontend — New Files
- `frontend/src/lib/metrics-api.ts` — Metrics + analytics API client
- `frontend/src/components/Campaigns/MoodboardScreen.tsx` — Wizard moodboard screen
- `frontend/src/components/Campaigns/MetricsForm.tsx` — Metrics reporting form
- `frontend/src/components/Intel/PerformanceReportCard.tsx` — Performance report display

### Frontend — Modified Files
- `frontend/src/store/campaign.ts` — Add moodboard + metrics actions
- `frontend/src/store/intel.ts` — Add performance analysis action
- `frontend/src/components/Campaigns/CampaignWizard.tsx` — Add moodboard step
- `frontend/src/components/Campaigns/CampaignList.tsx` — Add metrics reporting UI
- `frontend/src/components/Intel/IntelView.tsx` — Add performance analysis button + reports
- `frontend/src/components/Intel/ResearchBar.tsx` — Add performance button

### Test Files
- `backend/src/agents/moodboard-generator.test.ts`

---

### Task 1: Extend Shared Types

**Files:**
- Modify: `shared/types.ts`

- [ ] **Step 1: Add Phase 5 types**

Add after the Phase 4 section:

```typescript
// === Phase 5: Optimization Types ===

export type MoodboardStatus = "generating" | "ready" | "approved";

export interface Moodboard {
  id: string;
  campaignId: string;
  visualConcept: string;
  photographyStyle: string;
  colorEmphasis: string[];
  typography: string;
  mood: string;
  imagePrompts: string[];
  htmlPreview: string;
  status: MoodboardStatus;
  createdAt: string;
}

export interface PerformanceMetrics {
  impressions?: number;
  clicks?: number;
  ctr?: number;
  leads?: number;
  conversions?: number;
  cost?: number;
  openRate?: number;
  bounceRate?: number;
}

export interface CampaignMetrics {
  id: string;
  campaignId: string;
  channelId: string;
  variantLabel: "A" | "B" | "C";
  platform: string;
  metrics: PerformanceMetrics;
  notes?: string;
  reportedAt: string;
}

export interface PerformanceInsight {
  finding: string;
  recommendation: string;
  impact: "high" | "medium" | "low";
}

export interface LinePerformance {
  line: BusinessLine;
  campaigns: number;
  avgCTR: number;
  totalLeads: number;
  topChannel: string;
}

export interface VariantAnalysis {
  label: "A" | "B" | "C";
  angle: string;
  avgCTR: number;
  timesSelected: number;
  timesPublished: number;
}

export interface PerformanceReport {
  id: string;
  title: string;
  summary: string;
  insights: PerformanceInsight[];
  linePerformance: LinePerformance[];
  variantAnalysis: VariantAnalysis[];
  recommendations: string[];
  createdAt: string;
}
```

- [ ] **Step 2: Update CampaignCallbacks phase type**

Change `onPhaseStarted` from `(phase: 1 | 2 | 3)` to `(phase: 1 | 2 | 3 | 4)`.

- [ ] **Step 3: Verify and commit**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx tsc --noEmit shared/types.ts
git add shared/types.ts
git commit -m "feat: add Phase 5 types — Moodboard, CampaignMetrics, PerformanceReport"
```

---

### Task 2: Moodboard Generator

**Files:**
- Create: `backend/src/agents/moodboard-generator.ts`
- Create: `backend/src/agents/moodboard-generator.test.ts`
- Modify: `backend/src/agents/designer.ts`

- [ ] **Step 1: Update Designer system prompt with moodboard mode**

Add to the Designer's system prompt (in `designer.ts`), before the OUTPUT instructions:

```
## MODO MOODBOARD:
Cuando te pidan generar un moodboard para una campaña, responde en JSON:

\`\`\`json
{
  "visualConcept": "Descripción del concepto visual",
  "photographyStyle": "Estilo fotográfico detallado",
  "colorEmphasis": ["#HEX para qué uso", "#HEX para qué uso"],
  "typography": "Instrucciones tipográficas específicas",
  "mood": "Descripción del mood/feeling",
  "imagePrompts": [
    "English prompt for image generation model, photorealistic, 8k...",
    "Second English prompt..."
  ],
  "htmlPreview": "<div>HTML completo del moodboard visual</div>"
}
\`\`\`

El htmlPreview debe ser un collage visual que muestre:
- Paleta de colores como bloques
- Ejemplo de tipografía con headlines y body text
- Placeholder de estilo fotográfico con color sólido + descripción
- Mood keywords en un layout atractivo
- Dimensiones: 800x600px contenedor
```

- [ ] **Step 2: Write test**

```typescript
// backend/src/agents/moodboard-generator.test.ts
import { describe, it, expect, vi } from "vitest";
import { generateMoodboard, parseMoodboardOutput } from "./moodboard-generator.js";

describe("Moodboard Generator", () => {
  it("parses valid moodboard output", () => {
    const raw = `\`\`\`json
{
  "visualConcept": "Industrial dramático",
  "photographyStyle": "Close-ups, luz cálida",
  "colorEmphasis": ["#0D86FF datos", "#FF632C CTAs"],
  "typography": "Manrope 800 headlines",
  "mood": "Profesional pero empático",
  "imagePrompts": ["Professional photograph of hotel laundry, 8k"],
  "htmlPreview": "<div style='width:800px'>Moodboard</div>"
}
\`\`\``;
    const result = parseMoodboardOutput(raw);
    expect(result.visualConcept).toBe("Industrial dramático");
    expect(result.imagePrompts).toHaveLength(1);
    expect(result.htmlPreview).toContain("Moodboard");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseMoodboardOutput("not json")).toThrow();
  });
});
```

- [ ] **Step 3: Implement moodboard generator**

```typescript
// backend/src/agents/moodboard-generator.ts
import { randomUUID } from "crypto";
import type { Moodboard } from "../../shared/types.js";
import { designerAgent } from "./designer.js";

export interface MoodboardOutput {
  visualConcept: string;
  photographyStyle: string;
  colorEmphasis: string[];
  typography: string;
  mood: string;
  imagePrompts: string[];
  htmlPreview: string;
}

export function parseMoodboardOutput(raw: string): MoodboardOutput {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1]!.trim() : raw.trim();
  const parsed = JSON.parse(jsonStr);

  if (!parsed.visualConcept || !parsed.htmlPreview) {
    throw new Error("Moodboard output missing required fields");
  }

  return {
    visualConcept: parsed.visualConcept,
    photographyStyle: parsed.photographyStyle || "",
    colorEmphasis: parsed.colorEmphasis || [],
    typography: parsed.typography || "",
    mood: parsed.mood || "",
    imagePrompts: parsed.imagePrompts || [],
    htmlPreview: parsed.htmlPreview,
  };
}

export async function generateMoodboard(
  campaignId: string,
  concept: string,
  line: string,
  audience: string,
  objective: string
): Promise<Moodboard> {
  const result = await designerAgent.run({
    line: line as "OPL" | "AAS" | "MH" | "Volta",
    userMessage: `MODO MOODBOARD: Genera un moodboard visual para esta campaña.

Concepto de campaña: ${concept}
Línea de negocio: ${line}
Audiencia: ${audience}
Objetivo: ${objective}

Genera el JSON con el moodboard completo incluyendo htmlPreview visual y image prompts en inglés para fotografía profesional.`,
  });

  const parsed = parseMoodboardOutput(result.content);

  return {
    id: randomUUID(),
    campaignId,
    ...parsed,
    status: "ready",
    createdAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Run tests and commit**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/moodboard-generator.test.ts
git add backend/src/agents/moodboard-generator.ts backend/src/agents/moodboard-generator.test.ts backend/src/agents/designer.ts
git commit -m "feat: add moodboard generator with Designer moodboard mode"
```

---

### Task 3: Inject Visual Guide into Campaign Orchestrator

**Files:**
- Modify: `backend/src/agents/campaign-orchestrator.ts`

- [ ] **Step 1: Add moodboard context parameter to generateCampaignContent**

Update the function signature to accept an optional moodboard visual guide:

```typescript
export async function generateCampaignContent(
  campaign: Campaign,
  callbacks?: CampaignCallbacks,
  visualGuide?: string  // NEW — moodboard visual context
): Promise<Campaign> {
```

- [ ] **Step 2: Inject visual guide into all content generation prompts**

In `buildChannelPrompt`, add the visual guide:

```typescript
function buildChannelPrompt(campaign: Campaign, channelPlan: ChannelPlan, variantLabel: string, visualGuide?: string): string {
  let prompt = `Genera el contenido (variante ${variantLabel}) para un ${channelPlan.channel}...`;
  // ... existing prompt content ...

  if (visualGuide) {
    prompt += `\n\n${visualGuide}`;
  }

  return prompt;
}
```

Also inject it into the Designer call for HTML generation.

- [ ] **Step 3: Run tests and commit**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/campaign-orchestrator.test.ts
git add backend/src/agents/campaign-orchestrator.ts
git commit -m "feat: inject moodboard visual guide into campaign content generation"
```

---

### Task 4: Moodboard + Metrics Routes

**Files:**
- Modify: `backend/src/routes/campaigns.ts` — moodboard endpoints
- Create: `backend/src/routes/metrics.ts` — metrics CRUD
- Create: `backend/src/routes/analytics.ts` — performance analysis
- Modify: `backend/src/index.ts` — mount new routers

- [ ] **Step 1: Add moodboard routes to campaigns.ts**

Add to `backend/src/routes/campaigns.ts`:

```typescript
import { generateMoodboard } from "../agents/moodboard-generator.js";
import type { Moodboard } from "../../shared/types.js";

const moodboardStore: Map<string, Moodboard> = new Map();

// POST /:id/moodboard — Generate moodboard
router.post("/:id/moodboard", async (req, res) => {
  req.setTimeout(300000);
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }

  try {
    const moodboard = await generateMoodboard(
      campaign.id, campaign.concept, campaign.line, campaign.audience, campaign.objective
    );
    moodboardStore.set(campaign.id, moodboard);
    res.json(moodboard);
  } catch (error) {
    console.error("[moodboard] Error:", error);
    res.status(500).json({ error: "Failed to generate moodboard" });
  }
});

// GET /:id/moodboard — Get moodboard
router.get("/:id/moodboard", (req, res) => {
  const moodboard = moodboardStore.get(req.params.id);
  if (!moodboard) { res.status(404).json({ error: "Moodboard not found" }); return; }
  res.json(moodboard);
});

// PUT /:id/moodboard/approve — Approve moodboard
router.put("/:id/moodboard/approve", (req, res) => {
  const moodboard = moodboardStore.get(req.params.id);
  if (!moodboard) { res.status(404).json({ error: "Moodboard not found" }); return; }
  moodboard.status = "approved";
  moodboardStore.set(req.params.id, moodboard);
  res.json(moodboard);
});
```

IMPORTANT: Place these routes BEFORE the `/:id` catch-all GET route.

- [ ] **Step 2: Update generate route to pass visual guide**

In the `POST /:id/generate` handler, fetch the moodboard and build the visual guide string:

```typescript
// Inside the generate handler, before calling generateCampaignContent:
const moodboard = moodboardStore.get(campaign.id);
let visualGuide: string | undefined;
if (moodboard?.status === "approved") {
  visualGuide = `GUÍA VISUAL DE CAMPAÑA:\n- Concepto visual: ${moodboard.visualConcept}\n- Estilo fotográfico: ${moodboard.photographyStyle}\n- Énfasis de color: ${moodboard.colorEmphasis.join(", ")}\n- Tipografía: ${moodboard.typography}\n- Mood: ${moodboard.mood}`;
}
const generated = await generateCampaignContent(generating, undefined, visualGuide);
```

- [ ] **Step 3: Create metrics routes**

```typescript
// backend/src/routes/metrics.ts
import { Router } from "express";
import { randomUUID } from "crypto";
import type { CampaignMetrics } from "../../shared/types.js";

const router = Router();
const metricsStore: Map<string, CampaignMetrics> = new Map();

// POST /campaigns/:campaignId/channels/:channelId — Report metrics
router.post("/campaigns/:campaignId/channels/:channelId", (req, res) => {
  const { variantLabel, platform, metrics, notes } = req.body;
  if (!variantLabel || !platform || !metrics) {
    res.status(400).json({ error: "Missing required fields: variantLabel, platform, metrics" });
    return;
  }

  const entry: CampaignMetrics = {
    id: randomUUID(),
    campaignId: req.params.campaignId,
    channelId: req.params.channelId,
    variantLabel,
    platform,
    metrics,
    notes,
    reportedAt: new Date().toISOString(),
  };

  metricsStore.set(entry.id, entry);
  res.status(201).json(entry);
});

// GET / — List all metrics (optional filter by campaignId)
router.get("/", (req, res) => {
  let items = Array.from(metricsStore.values());
  if (req.query.campaignId) {
    items = items.filter((m) => m.campaignId === req.query.campaignId);
  }
  res.json(items);
});

export { router as metricsRouter };
```

- [ ] **Step 4: Create analytics routes**

```typescript
// backend/src/routes/analytics.ts
import { Router } from "express";
import { randomUUID } from "crypto";
import type { PerformanceReport, CampaignMetrics } from "../../shared/types.js";
import { dataAnalystAgent } from "../agents/data-analyst.js";

const router = Router();
const analyticsStore: Map<string, PerformanceReport> = new Map();

// POST /performance — Run Business Analyst
router.post("/performance", async (req, res) => {
  req.setTimeout(300000);
  try {
    // Fetch all metrics from metrics endpoint
    const port = process.env.PORT || 3001;
    const metricsRes = await fetch(`http://localhost:${port}/api/metrics`);
    const allMetrics: CampaignMetrics[] = await metricsRes.json();

    if (allMetrics.length === 0) {
      res.status(400).json({ error: "No hay métricas reportadas para analizar" });
      return;
    }

    const metricsContext = allMetrics.map((m) =>
      `Campaign: ${m.campaignId}, Channel: ${m.platform}, Variant: ${m.variantLabel}, Metrics: ${JSON.stringify(m.metrics)}`
    ).join("\n");

    const result = await dataAnalystAgent.run({
      line: "OPL",
      userMessage: `MODO PERFORMANCE: Analiza las métricas de performance de estas campañas publicadas y genera un reporte con insights sobre qué funciona mejor.

MÉTRICAS REPORTADAS:
${metricsContext}

Responde en JSON con: title, summary, insights (finding + recommendation + impact), linePerformance (line + campaigns + avgCTR + totalLeads + topChannel), variantAnalysis (label A/B/C + angle emocional/racional/social + avgCTR + timesSelected + timesPublished), recommendations.`,
    });

    const jsonMatch = result.content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1]!.trim() : result.content.trim();
    const parsed = JSON.parse(jsonStr);

    const report: PerformanceReport = {
      id: randomUUID(),
      title: parsed.title || "Análisis de Performance",
      summary: parsed.summary || "",
      insights: parsed.insights || [],
      linePerformance: parsed.linePerformance || [],
      variantAnalysis: parsed.variantAnalysis || [],
      recommendations: parsed.recommendations || [],
      createdAt: new Date().toISOString(),
    };

    analyticsStore.set(report.id, report);
    res.json(report);
  } catch (error) {
    console.error("[analytics] Performance error:", error);
    res.status(500).json({ error: "Failed to run performance analysis" });
  }
});

// GET /reports — List performance reports
router.get("/reports", (_req, res) => {
  const reports = Array.from(analyticsStore.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(reports);
});

// GET /reports/:id — Report detail
router.get("/reports/:id", (req, res) => {
  const report = analyticsStore.get(req.params.id);
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }
  res.json(report);
});

export { router as analyticsRouter };
```

- [ ] **Step 5: Mount routers in index.ts**

```typescript
import { metricsRouter } from "./routes/metrics.js";
import { analyticsRouter } from "./routes/analytics.js";
app.use("/api/metrics", metricsRouter);
app.use("/api/analytics", analyticsRouter);
```

- [ ] **Step 6: Update Data Analyst prompt**

Add performance analysis mode to `backend/src/agents/data-analyst.ts` system prompt:

```
## MODO PERFORMANCE:
Cuando recibas métricas de campañas publicadas, analiza:
1. Qué líneas de negocio convierten mejor (CTR, leads)
2. Qué tipo de variante funciona mejor (A=emocional, B=racional, C=social) por canal
3. Qué canales dan mejor ROI cuando hay datos de costo
4. Patrones entre audiencia y engagement

Responde en JSON:
\`\`\`json
{
  "title": "Análisis de Performance",
  "summary": "Resumen ejecutivo",
  "insights": [{ "finding": "...", "recommendation": "...", "impact": "high|medium|low" }],
  "linePerformance": [{ "line": "OPL", "campaigns": 5, "avgCTR": 3.8, "totalLeads": 42, "topChannel": "email" }],
  "variantAnalysis": [{ "label": "A", "angle": "emocional", "avgCTR": 4.1, "timesSelected": 12, "timesPublished": 8 }],
  "recommendations": ["Recomendación 1", "Recomendación 2"]
}
\`\`\`
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/routes/campaigns.ts backend/src/routes/metrics.ts backend/src/routes/analytics.ts backend/src/index.ts backend/src/agents/data-analyst.ts
git commit -m "feat: add moodboard, metrics, and analytics routes — performance tracking backend"
```

---

### Task 5: Frontend API Client + Store Updates

**Files:**
- Create: `frontend/src/lib/metrics-api.ts`
- Modify: `frontend/src/store/campaign.ts`
- Modify: `frontend/src/store/intel.ts`
- Modify: `frontend/src/lib/campaign-api.ts`

- [ ] **Step 1: Create metrics/analytics API client**

```typescript
// frontend/src/lib/metrics-api.ts
const METRICS_BASE = "/api/metrics";
const ANALYTICS_BASE = "/api/analytics";

export interface CampaignMetrics {
  id: string; campaignId: string; channelId: string;
  variantLabel: string; platform: string;
  metrics: Record<string, number | undefined>;
  notes?: string; reportedAt: string;
}

export interface PerformanceReport {
  id: string; title: string; summary: string;
  insights: Array<{ finding: string; recommendation: string; impact: string }>;
  linePerformance: Array<{ line: string; campaigns: number; avgCTR: number; totalLeads: number; topChannel: string }>;
  variantAnalysis: Array<{ label: string; angle: string; avgCTR: number; timesSelected: number; timesPublished: number }>;
  recommendations: string[];
  createdAt: string;
}

async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Unknown" })); throw new Error(e.error || `API error: ${res.status}`); }
  return res.json();
}

export const metricsApi = {
  report: (campaignId: string, channelId: string, data: { variantLabel: string; platform: string; metrics: Record<string, number | undefined>; notes?: string }) =>
    apiCall<CampaignMetrics>(`${METRICS_BASE}/campaigns/${campaignId}/channels/${channelId}`, { method: "POST", body: JSON.stringify(data) }),
  list: (campaignId?: string) => {
    const qs = campaignId ? `?campaignId=${campaignId}` : "";
    return apiCall<CampaignMetrics[]>(`${METRICS_BASE}${qs}`);
  },
};

export const analyticsApi = {
  runPerformance: () => apiCall<PerformanceReport>(`${ANALYTICS_BASE}/performance`, { method: "POST" }),
  listReports: () => apiCall<PerformanceReport[]>(`${ANALYTICS_BASE}/reports`),
  getReport: (id: string) => apiCall<PerformanceReport>(`${ANALYTICS_BASE}/reports/${id}`),
};
```

- [ ] **Step 2: Add moodboard methods to campaign-api.ts**

```typescript
// Add to campaignApi object in frontend/src/lib/campaign-api.ts:
generateMoodboard: (id: string) =>
  apiCall<unknown>(`${BASE}/${id}/moodboard`, { method: "POST" }),
getMoodboard: (id: string) =>
  apiCall<unknown>(`${BASE}/${id}/moodboard`),
approveMoodboard: (id: string) =>
  apiCall<unknown>(`${BASE}/${id}/moodboard/approve`, { method: "PUT" }),
```

- [ ] **Step 3: Update campaign store with moodboard + metrics actions**

Add to `frontend/src/store/campaign.ts`:

```typescript
// Add to interface:
moodboard: unknown | null;
generateMoodboard: () => Promise<void>;
approveMoodboard: () => Promise<void>;
reportMetrics: (channelId: string, data: { variantLabel: string; platform: string; metrics: Record<string, number | undefined>; notes?: string }) => Promise<void>;

// Add to store implementation:
moodboard: null,

generateMoodboard: async () => {
  const { current } = get();
  if (!current) return;
  set({ isLoading: true, error: null });
  try {
    const moodboard = await campaignApi.generateMoodboard(current.id);
    set({ moodboard, wizardStep: "moodboard", isLoading: false });
  } catch (err) {
    set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
  }
},

approveMoodboard: async () => {
  const { current } = get();
  if (!current) return;
  await campaignApi.approveMoodboard(current.id);
  set((state) => ({ moodboard: { ...(state.moodboard as Record<string,unknown>), status: "approved" } }));
},

reportMetrics: async (channelId, data) => {
  const { current } = get();
  if (!current) return;
  const { metricsApi } = await import("../lib/metrics-api");
  await metricsApi.report(current.id, channelId, data);
},
```

- [ ] **Step 4: Update intel store with performance action**

Add to `frontend/src/store/intel.ts`:

```typescript
// Add to interface:
performanceReports: PerformanceReport[];
runPerformanceAnalysis: () => Promise<void>;
fetchPerformanceReports: () => Promise<void>;

// Implementation:
performanceReports: [],

runPerformanceAnalysis: async () => {
  const addActivity = useActivityStore.getState().addActivity;
  set({ isLoading: true, error: null });
  addActivity("working", "Analizando performance de campañas...");
  try {
    const { analyticsApi } = await import("../lib/metrics-api");
    const report = await analyticsApi.runPerformance();
    set((state) => ({ performanceReports: [report, ...state.performanceReports], isLoading: false }));
    addActivity("success", `Análisis de performance: ${report.insights.length} insights generados`);
  } catch (err) {
    set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
    addActivity("error", `Error en análisis: ${err instanceof Error ? err.message : String(err)}`);
  }
},

fetchPerformanceReports: async () => {
  const { analyticsApi } = await import("../lib/metrics-api");
  const reports = await analyticsApi.listReports();
  set({ performanceReports: reports });
},
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/metrics-api.ts frontend/src/lib/campaign-api.ts frontend/src/store/campaign.ts frontend/src/store/intel.ts
git commit -m "feat: add metrics API client, moodboard + metrics store actions"
```

---

### Task 6: Moodboard Screen in Campaign Wizard

**Files:**
- Create: `frontend/src/components/Campaigns/MoodboardScreen.tsx`
- Modify: `frontend/src/components/Campaigns/CampaignWizard.tsx`

- [ ] **Step 1: Create MoodboardScreen**

```tsx
// frontend/src/components/Campaigns/MoodboardScreen.tsx
interface MoodboardScreenProps {
  moodboard: {
    visualConcept: string; photographyStyle: string; colorEmphasis: string[];
    typography: string; mood: string; imagePrompts: string[]; htmlPreview: string; status: string;
  };
  onApprove: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
}

export function MoodboardScreen({ moodboard, onApprove, onRegenerate, isLoading }: MoodboardScreenProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-near-black">Dirección Visual</h2>
        <p className="text-sm text-gray-500 mt-1">Revisa el moodboard antes de generar las piezas</p>
      </div>

      {/* Visual Guide Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Concepto Visual</div>
          <div className="text-sm text-near-black">{moodboard.visualConcept}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Mood</div>
          <div className="text-sm text-near-black">{moodboard.mood}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Estilo Fotográfico</div>
          <div className="text-sm text-near-black">{moodboard.photographyStyle}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Tipografía</div>
          <div className="text-sm text-near-black">{moodboard.typography}</div>
        </div>
      </div>

      {/* Color Emphasis */}
      {moodboard.colorEmphasis.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Énfasis de Color</div>
          <div className="flex flex-wrap gap-2">
            {moodboard.colorEmphasis.map((c, i) => (
              <span key={i} className="text-xs bg-gray-100 px-3 py-1 rounded">{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* HTML Preview */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Preview Visual</div>
        <div className="border rounded-lg overflow-hidden bg-white"
          dangerouslySetInnerHTML={{ __html: moodboard.htmlPreview }} />
      </div>

      {/* Image Prompts */}
      {moodboard.imagePrompts.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Prompts de Imagen</div>
          <div className="space-y-2">
            {moodboard.imagePrompts.map((prompt, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 flex items-start gap-2">
                <span className="text-xs text-gray-600 flex-1 font-mono">{prompt}</span>
                <button onClick={() => navigator.clipboard.writeText(prompt)}
                  className="text-xs text-blue-500 hover:text-blue-700 shrink-0">Copiar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onApprove} disabled={isLoading}
          className="flex-1 bg-blue-500 text-white rounded-lg px-6 py-3 font-semibold hover:bg-blue-600 disabled:opacity-50">
          Aprobar Visual y Generar Contenido
        </button>
        <button onClick={onRegenerate} disabled={isLoading}
          className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          Regenerar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update CampaignWizard with moodboard step**

Update the STEPS array to 5 steps and add the moodboard screen. Update wizard step type to include "moodboard". Wire `generateMoodboard` and `approveMoodboard` from the store.

The PlanScreen's "Aprobar Plan" button should now call `generateMoodboard` instead of `generateContent`. After moodboard approval, `approveMoodboard` then `generateContent` fires.

- [ ] **Step 3: Update campaign store wizardStep type**

Change `WizardStep` from `"brief" | "plan" | "generating" | "review"` to `"brief" | "plan" | "moodboard" | "generating" | "review"`.

Update `createCampaign` to go `brief → plan` (existing).
Add flow: PlanScreen approve → `generateMoodboard()` → set wizardStep "moodboard".
MoodboardScreen approve → `approveMoodboard()` then `generateContent()`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Campaigns/MoodboardScreen.tsx frontend/src/components/Campaigns/CampaignWizard.tsx frontend/src/store/campaign.ts
git commit -m "feat: add MoodboardScreen to campaign wizard — 5-step flow with visual direction"
```

---

### Task 7: Metrics Form in CampaignList

**Files:**
- Create: `frontend/src/components/Campaigns/MetricsForm.tsx`
- Modify: `frontend/src/components/Campaigns/CampaignList.tsx`

- [ ] **Step 1: Create MetricsForm**

```tsx
// frontend/src/components/Campaigns/MetricsForm.tsx
import { useState } from "react";

const CHANNEL_FIELDS: Record<string, string[]> = {
  "facebook-ad": ["impressions", "clicks", "ctr", "leads", "cost"],
  "linkedin-post": ["impressions", "clicks", "ctr", "leads", "cost"],
  "instagram-post": ["impressions", "clicks", "ctr", "leads", "cost"],
  "email": ["impressions", "openRate", "clicks", "ctr", "leads"],
  "email-sequence": ["impressions", "openRate", "clicks", "ctr", "leads"],
  "blog-post": ["impressions", "bounceRate", "leads"],
  "landing-page": ["impressions", "clicks", "ctr", "conversions", "bounceRate"],
  "whatsapp": ["impressions", "clicks", "leads"],
};

const FIELD_LABELS: Record<string, string> = {
  impressions: "Impresiones", clicks: "Clicks", ctr: "CTR (%)",
  leads: "Leads", conversions: "Conversiones", cost: "Inversión (COP)",
  openRate: "Open Rate (%)", bounceRate: "Bounce Rate (%)",
};

interface MetricsFormProps {
  channel: string;
  variants: Array<{ label: string; selected: boolean }>;
  onSubmit: (data: { variantLabel: string; platform: string; metrics: Record<string, number | undefined>; notes?: string }) => void;
}

export function MetricsForm({ channel, variants, onSubmit }: MetricsFormProps) {
  const fields = CHANNEL_FIELDS[channel] || ["impressions", "clicks", "leads"];
  const selectedVariant = variants.find((v) => v.selected)?.label || "A";
  const [variantLabel, setVariantLabel] = useState(selectedVariant);
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    const parsed: Record<string, number | undefined> = {};
    for (const field of fields) {
      parsed[field] = metrics[field] ? Number(metrics[field]) : undefined;
    }
    onSubmit({ variantLabel, platform: channel, metrics: parsed, notes: notes || undefined });
  };

  return (
    <div className="bg-blue-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500">Variante publicada</label>
          <select value={variantLabel} onChange={(e) => setVariantLabel(e.target.value)}
            className="block mt-1 rounded border border-gray-300 px-2 py-1 text-sm">
            {["A", "B", "C"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {fields.map((field) => (
          <div key={field}>
            <label className="text-xs text-gray-500">{FIELD_LABELS[field] || field}</label>
            <input type="number" value={metrics[field] || ""}
              onChange={(e) => setMetrics({ ...metrics, [field]: e.target.value })}
              className="block w-full mt-1 rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="0" />
          </div>
        ))}
      </div>
      <div>
        <label className="text-xs text-gray-500">Notas (opcional)</label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)}
          className="block w-full mt-1 rounded border border-gray-300 px-2 py-1 text-sm"
          placeholder="Observaciones..." />
      </div>
      <button onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-600">
        Guardar Métricas
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add MetricsForm to CampaignList**

In CampaignList, for approved/exported campaigns, add a "Reportar Resultados" toggle per channel that shows the MetricsForm inline. Wire the submit to `metricsApi.report()`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Campaigns/MetricsForm.tsx frontend/src/components/Campaigns/CampaignList.tsx
git commit -m "feat: add MetricsForm for post-publication performance tracking per channel"
```

---

### Task 8: Performance Reports in Intel View

**Files:**
- Create: `frontend/src/components/Intel/PerformanceReportCard.tsx`
- Modify: `frontend/src/components/Intel/IntelView.tsx`
- Modify: `frontend/src/components/Intel/ResearchBar.tsx`

- [ ] **Step 1: Create PerformanceReportCard**

```tsx
// frontend/src/components/Intel/PerformanceReportCard.tsx
import { useState } from "react";
import type { PerformanceReport } from "../../lib/metrics-api";

interface PerformanceReportCardProps {
  report: PerformanceReport;
}

const IMPACT_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

export function PerformanceReportCard({ report }: PerformanceReportCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-bold text-near-black truncate">{report.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">Performance</span>
          </div>
          <div className="flex gap-4 text-xs text-gray-400">
            <span>{report.insights.length} insights</span>
            <span>{report.recommendations.length} recomendaciones</span>
            <span>{new Date(report.createdAt).toLocaleDateString("es-CO")}</span>
          </div>
        </div>
        <span className="text-gray-400 ml-4">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t px-5 py-4 space-y-5">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.summary}</p>

          {/* Insights */}
          {report.insights.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-near-black mb-2">Insights</h4>
              <div className="space-y-2">
                {report.insights.map((ins, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${IMPACT_COLORS[ins.impact] || ""}`}>{ins.impact}</span>
                      <div>
                        <div className="text-sm font-medium text-near-black">{ins.finding}</div>
                        <div className="text-xs text-gray-500 mt-1">{ins.recommendation}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variant Analysis */}
          {report.variantAnalysis.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-near-black mb-2">Análisis de Variantes A/B/C</h4>
              <div className="grid grid-cols-3 gap-3">
                {report.variantAnalysis.map((v) => (
                  <div key={v.label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-near-black">{v.label}</div>
                    <div className="text-xs text-gray-500">{v.angle}</div>
                    <div className="text-sm font-semibold text-blue-600 mt-1">CTR: {v.avgCTR}%</div>
                    <div className="text-xs text-gray-400">Publicada {v.timesPublished}x</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-near-black mb-2">Recomendaciones</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {report.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add "Analizar Performance" to ResearchBar**

Add a third button to ResearchBar:
```tsx
<button onClick={onPerformanceAnalysis} disabled={isLoading}
  className="text-sm text-gray-500 hover:text-purple-500 font-medium ml-4">
  Analizar Performance
</button>
```

Add `onPerformanceAnalysis` to props.

- [ ] **Step 3: Wire performance reports into IntelView**

In IntelView, fetch performance reports on mount, render PerformanceReportCard for each. Wire the "Analizar Performance" button to `runPerformanceAnalysis` from intel store.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Intel/PerformanceReportCard.tsx frontend/src/components/Intel/IntelView.tsx frontend/src/components/Intel/ResearchBar.tsx
git commit -m "feat: add PerformanceReportCard and wire performance analysis into Intel view"
```

---

### Task 9: Integration Test & Polish

**Files:** All

- [ ] **Step 1: Run all backend tests**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run
```

- [ ] **Step 2: Verify frontend compiles**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools/frontend && npx tsc --noEmit
```

- [ ] **Step 3: Fix any issues**

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: Phase 5 Optimization + Visual Director — integration polish"
```

---

## Deferred Scope

- **Google Search Console integration:** Module in `backend/src/integrations/gsc.ts` that feeds blog metrics automatically
- **HubSpot integration:** Module in `backend/src/integrations/hubspot.ts` that feeds lead/deal data
- **Meta Ads API:** Module for Facebook/Instagram ad performance
- **Automated monthly performance reports:** Cron job running Business Analyst monthly
