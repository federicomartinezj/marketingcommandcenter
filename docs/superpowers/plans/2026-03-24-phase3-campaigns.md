# Phase 3: Campaigns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable full campaign creation where the marketing director describes a campaign in natural language and the system generates a complete multi-channel funnel with A/B variants.

**Architecture:** Phased pipeline — Phase 1 (Orchestrator + UX Strategist sequential) → Phase 2 (parallel content generation per channel with Promise.allSettled) → Phase 3 (Brand Guardian review). Campaign wizard UI with 4 screens: Brief → Plan → Live Generation → Review & Export.

**Tech Stack:** TypeScript, Express, Claude API (Anthropic SDK), React, Zustand, Tailwind, archiver (ZIP generation)

**Spec:** `docs/superpowers/specs/2026-03-24-phase3-campaigns-design.md`

---

## File Structure

### Backend — New Files
- `backend/src/agents/ux-strategist.ts` — UX Strategist agent (concept + funnel generation)
- `backend/src/agents/seo-specialist.ts` — SEO Specialist agent (keyword optimization)
- `backend/src/agents/campaign-orchestrator.ts` — Campaign orchestration (phased pipeline)
- `backend/src/routes/campaigns.ts` — Campaign CRUD + action routes
- `backend/src/export/campaign-exporter.ts` — ZIP package generation

### Backend — Modified Files
- `shared/types.ts` — New types (Campaign, ChannelPlan, etc.) + extend ContentType
- `backend/src/agents/orchestrator.ts` — Add `whatsapp` and `facebook-ad` to routing helpers
- `backend/src/index.ts` — Mount campaign router

### Frontend — New Files
- `frontend/src/store/campaign.ts` — Campaign Zustand store
- `frontend/src/lib/campaign-api.ts` — Campaign API client functions
- `frontend/src/components/Campaigns/CampaignWizard.tsx` — 4-screen wizard modal
- `frontend/src/components/Campaigns/BriefScreen.tsx` — Screen 1: brief input
- `frontend/src/components/Campaigns/PlanScreen.tsx` — Screen 2: review generated plan
- `frontend/src/components/Campaigns/GenerationScreen.tsx` — Screen 3: live progress
- `frontend/src/components/Campaigns/ReviewScreen.tsx` — Screen 4: variant selection + export
- `frontend/src/components/Campaigns/FunnelDiagram.tsx` — Visual funnel stages
- `frontend/src/components/Campaigns/VariantSelector.tsx` — Side-by-side A/B/C variant comparison
- `frontend/src/components/Dashboard/CampaignCards.tsx` — Active campaigns on dashboard

### Frontend — Modified Files
- `frontend/src/App.tsx` — Add campaigns view + wizard routing
- `frontend/src/components/Layout.tsx` — Add "Campañas" tab
- `frontend/src/components/Dashboard/QuickActions.tsx` — Wire "Nueva Campaña" button
- `frontend/src/components/Dashboard/Dashboard.tsx` — Add CampaignCards section

### Test Files
- `backend/src/agents/ux-strategist.test.ts`
- `backend/src/agents/seo-specialist.test.ts`
- `backend/src/agents/campaign-orchestrator.test.ts`
- `backend/src/export/campaign-exporter.test.ts`

---

### Task 1: Extend Shared Types

**Files:**
- Modify: `shared/types.ts`

- [ ] **Step 1: Write test for new types compilation**

Create a simple TypeScript compilation check. Since shared types are used by both backend and frontend, we verify they compile:

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx tsc --noEmit shared/types.ts 2>&1 || echo "Types check"
```

- [ ] **Step 2: Add new ContentType values and Campaign types to shared/types.ts**

Add to `ContentType` union:
```typescript
  | "whatsapp"
  | "facebook-ad"
```

Replace `CampaignBrief` interface with new types. Add after the existing `CreateContentResponse` interface:

```typescript
// === Phase 3: Campaign Types ===

export type CampaignStatus = "draft" | "planning" | "planned" | "generating" | "review" | "approved" | "exported";

export type FunnelStageName = "awareness" | "interest" | "nurture" | "conversion";

export interface FunnelStage {
  stage: FunnelStageName;
  description: string;
  channels: ContentType[];
}

export interface ContentVariant {
  id: string;
  label: "A" | "B" | "C";
  content: string;
  selected: boolean;
}

export interface SEOResult {
  keywords: string[];
  suggestions: string[];
  score: number;
  metaDescription: string;
  optimizedTitle: string;
}

export type ChannelPlanStatus = "pending" | "generating" | "ready" | "error" | "approved";

export interface ChannelPlan {
  id: string;
  channel: ContentType;
  funnelStage: FunnelStageName;
  variants: ContentVariant[];
  designHtml?: string;
  seoOptimization?: SEOResult;
  brandReview?: BrandReview;
  status: ChannelPlanStatus;
}

export interface Campaign {
  id: string;
  name: string;
  brief: string;
  line: BusinessLine;
  audience: string;
  objective: string;
  concept: string;
  funnel: FunnelStage[];
  channels: ChannelPlan[];
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignCallbacks {
  onPhaseStarted?: (phase: 1 | 2 | 3) => void;
  onChannelStarted?: (channelId: string, channel: ContentType) => void;
  onChannelCompleted?: (channelId: string, channel: ContentType) => void;
  onChannelFailed?: (channelId: string, channel: ContentType, error: string) => void;
  onCampaignCompleted?: (campaign: Campaign) => void;
}

export interface CreateCampaignRequest {
  brief: string;
  line: BusinessLine;
  audience: string;
  objective: string;
}
```

- [ ] **Step 3: Keep existing CampaignBrief**

Keep `CampaignBrief` as-is — it is still used by `ExecutionPlan` in the existing content orchestrator. The new `Campaign` interface is separate and does not replace it.

- [ ] **Step 4: Verify compilation**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx tsc --noEmit shared/types.ts
```

- [ ] **Step 5: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add Phase 3 campaign types — Campaign, ChannelPlan, FunnelStage, ContentVariant, SEOResult"
```

---

### Task 2: UX Strategist Agent

**Files:**
- Create: `backend/src/agents/ux-strategist.ts`
- Test: `backend/src/agents/ux-strategist.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// backend/src/agents/ux-strategist.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/ux-strategist.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement UX Strategist agent**

```typescript
// backend/src/agents/ux-strategist.ts
import { BaseAgent } from "./base-agent.js";
import type { FunnelStage } from "../../shared/types.js";

export interface UXStrategyOutput {
  concept: string;
  funnel: FunnelStage[];
  landingStructure?: {
    sections: string[];
    sectionBriefs: Record<string, string>;
  };
}

export function parseUXStrategyOutput(raw: string): UXStrategyOutput {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1]!.trim() : raw.trim();
  const parsed = JSON.parse(jsonStr);

  if (!parsed.concept || !Array.isArray(parsed.funnel)) {
    throw new Error("UX Strategy output missing required fields: concept, funnel");
  }

  return {
    concept: parsed.concept,
    funnel: parsed.funnel.map((f: Record<string, unknown>) => ({
      stage: f.stage as string,
      description: f.description as string,
      channels: f.channels as string[],
    })),
    landingStructure: parsed.landingStructure,
  };
}

function buildUXStrategistSystemPrompt(brandContext: string): string {
  return `Eres el UX Strategist del departamento de marketing de Lavanti (Hydrocare SAS).

Tu rol es diseñar estrategias de embudo (funnel) para campañas de marketing. Recibes un brief y defines:
1. El concepto creativo unificador de la campaña
2. Las etapas del embudo con los canales para cada una
3. La estructura de landing page si aplica

## ETAPAS DEL EMBUDO:
- **awareness**: Primer contacto. Canales de alto alcance (WhatsApp viral, Facebook Ads, social posts)
- **interest**: Captura de atención. Contenido que profundiza (blog posts, artículos)
- **nurture**: Construcción de confianza. Secuencias de email, contenido educativo
- **conversion**: Acción final. Landing pages con CTA claro

## CANALES DISPONIBLES:
- whatsapp: Pieza compartible por WhatsApp
- facebook-ad: Anuncio de Facebook/Instagram
- linkedin-post: Post de LinkedIn
- instagram-post: Post de Instagram
- blog-post: Artículo para aprende.lavanti.com
- email: Email individual
- email-sequence: Secuencia de emails de nurturing
- landing-page: Página de aterrizaje con estructura de conversión

## ESTRUCTURA DE LANDING PAGE (cuando aplique):
Secciones: hero, pain-points, benefits, social-proof, cta
Para cada sección, escribe un brief que el Copywriter usará para generar el copy.

## CONTEXTO DE MARCA:
${brandContext}

## FORMATO DE RESPUESTA:
Responde SIEMPRE en JSON dentro de un bloque de código:

\`\`\`json
{
  "concept": "Concepto creativo unificador en una frase",
  "funnel": [
    {
      "stage": "awareness|interest|nurture|conversion",
      "description": "Descripción de la etapa",
      "channels": ["canal1", "canal2"]
    }
  ],
  "landingStructure": {
    "sections": ["hero", "pain-points", "benefits", "social-proof", "cta"],
    "sectionBriefs": {
      "hero": "Brief para la sección hero",
      "pain-points": "Brief para pain points",
      "benefits": "Brief para beneficios",
      "social-proof": "Brief para prueba social",
      "cta": "Brief para call to action"
    }
  }
}
\`\`\`

REGLAS:
- El concepto debe ser memorable, en español, y conectar emocionalmente con la audiencia
- Mínimo 2 etapas del embudo, máximo 4
- Cada etapa debe tener al menos 1 canal
- Solo incluye landingStructure si "landing-page" es un canal
- Piensa desde el mundo del cliente, no desde Lavanti
`;
}

export const uxStrategistAgent = new BaseAgent({
  role: "ux-strategist",
  label: "UX Strategist",
  buildSystemPrompt: buildUXStrategistSystemPrompt,
});
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/ux-strategist.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/agents/ux-strategist.ts backend/src/agents/ux-strategist.test.ts
git commit -m "feat: add UX Strategist agent with funnel and concept generation"
```

---

### Task 3: SEO Specialist Agent

**Files:**
- Create: `backend/src/agents/seo-specialist.ts`
- Test: `backend/src/agents/seo-specialist.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// backend/src/agents/seo-specialist.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/seo-specialist.test.ts
```

- [ ] **Step 3: Implement SEO Specialist agent**

```typescript
// backend/src/agents/seo-specialist.ts
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
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/seo-specialist.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/agents/seo-specialist.ts backend/src/agents/seo-specialist.test.ts
git commit -m "feat: add SEO Specialist agent with keyword optimization"
```

---

### Task 4: Update Existing Orchestrator for New Content Types

**Files:**
- Modify: `backend/src/agents/orchestrator.ts`

- [ ] **Step 1: Add whatsapp and facebook-ad to routing helpers**

In `orchestrator.ts`, update the constants and helper functions:

```typescript
// Add whatsapp and facebook-ad to SOCIAL_TYPES
const SOCIAL_TYPES: ContentType[] = ["linkedin-post", "instagram-post", "social-card", "whatsapp", "facebook-ad"];
```

And update `needsDesigner`:
```typescript
function needsDesigner(type: ContentType): boolean {
  return SOCIAL_TYPES.includes(type) || EMAIL_TYPES.includes(type) || type === "landing-page";
}
```

- [ ] **Step 2: Update buildCopywriterPrompt with new types**

Add entries in the `typeInstructions` record:

```typescript
"whatsapp": "Escribe una pieza compartible por WhatsApp. Corta, impactante, con emoji sparingly. Debe provocar que la reenvíen. Incluye CTA con link.",
"facebook-ad": "Escribe el copy para un anuncio de Facebook/Instagram Ads. Headline corto + texto principal + CTA. Formato: hook en primera línea, beneficio claro, urgencia sutil.",
```

- [ ] **Step 3: Update buildDesignerPrompt with new dimensions**

Add to `platformDimensions`:
```typescript
"whatsapp": "1080x1080px",
"facebook-ad": "1200x628px",
```

- [ ] **Step 4: Extract parseBrandReview to shared utility**

Create `backend/src/agents/orchestrator-utils.ts` by extracting `parseBrandReview` from `orchestrator.ts`:

```typescript
// backend/src/agents/orchestrator-utils.ts
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
```

Then update `orchestrator.ts` to import from `orchestrator-utils.ts` instead of having its own `parseBrandReview`:

```typescript
import { parseBrandReview } from "./orchestrator-utils.js";
```

Delete the local `parseBrandReview` function from `orchestrator.ts`.

- [ ] **Step 5: Run existing orchestrator tests**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/orchestrator.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/agents/orchestrator.ts backend/src/agents/orchestrator-utils.ts
git commit -m "feat: add whatsapp and facebook-ad support, extract parseBrandReview to shared utility"
```

---

### Task 5: Campaign Orchestrator

**Files:**
- Create: `backend/src/agents/campaign-orchestrator.ts`
- Test: `backend/src/agents/campaign-orchestrator.test.ts`

- [ ] **Step 1: Write failing test for Phase 1 (strategy)**

```typescript
// backend/src/agents/campaign-orchestrator.test.ts
import { describe, it, expect, vi } from "vitest";
import { analyzeCampaignBrief, generateCampaignContent } from "./campaign-orchestrator.js";
import type { Campaign, CampaignCallbacks } from "../../shared/types.js";

// Mock agents to avoid real API calls
vi.mock("./ux-strategist.js", () => ({
  uxStrategistAgent: {
    run: vi.fn().mockResolvedValue({
      role: "ux-strategist",
      content: '```json\n{"concept":"Test concept","funnel":[{"stage":"awareness","description":"Test","channels":["whatsapp"]}]}\n```',
    }),
  },
  parseUXStrategyOutput: vi.fn().mockReturnValue({
    concept: "Test concept",
    funnel: [{ stage: "awareness", description: "Test", channels: ["whatsapp"] }],
  }),
}));

vi.mock("./social-media-manager.js", () => ({
  socialMediaManagerAgent: {
    run: vi.fn().mockResolvedValue({ role: "social-media-manager", content: "Generated WhatsApp content" }),
  },
}));

vi.mock("./copywriter.js", () => ({
  copywriterAgent: {
    run: vi.fn().mockResolvedValue({ role: "copywriter", content: "Generated copy" }),
  },
}));

vi.mock("./designer.js", () => ({
  designerAgent: {
    run: vi.fn().mockResolvedValue({ role: "designer", content: "<div>Design</div>" }),
  },
}));

vi.mock("./brand-guardian.js", () => ({
  brandGuardianAgent: {
    run: vi.fn().mockResolvedValue({
      role: "brand-guardian",
      content: '```json\n{"approved":true,"score":85,"checks":[]}\n```',
    }),
  },
  buildReviewMessage: vi.fn().mockReturnValue("review message"),
}));

vi.mock("./seo-specialist.js", () => ({
  seoSpecialistAgent: { run: vi.fn().mockResolvedValue({ role: "seo-specialist", content: '{}' }) },
  parseSEOOutput: vi.fn().mockReturnValue({ keywords: [], suggestions: [], score: 80, metaDescription: "", optimizedTitle: "" }),
}));

const baseCampaign: Campaign = {
  id: "test-id",
  name: "",
  brief: "Campaña para jefes de mantenimiento",
  line: "OPL",
  audience: "Jefes de mantenimiento",
  objective: "Vender equipos",
  concept: "",
  funnel: [],
  channels: [],
  status: "draft",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("Campaign Orchestrator", () => {
  it("analyzeCampaignBrief creates campaign with concept and funnel", async () => {
    const callbacks: CampaignCallbacks = { onPhaseStarted: vi.fn() };
    const result = await analyzeCampaignBrief({ ...baseCampaign }, callbacks);
    expect(result.concept).toBe("Test concept");
    expect(result.funnel).toHaveLength(1);
    expect(result.channels).toHaveLength(1);
    expect(result.channels[0].channel).toBe("whatsapp");
    expect(result.channels[0].status).toBe("pending");
    expect(result.status).toBe("planned");
    expect(callbacks.onPhaseStarted).toHaveBeenCalledWith(1);
  });

  it("generateCampaignContent generates variants for each channel", async () => {
    const campaign: Campaign = {
      ...baseCampaign,
      concept: "Test concept",
      funnel: [{ stage: "awareness", description: "Test", channels: ["whatsapp"] }],
      channels: [{ id: "ch1", channel: "whatsapp", funnelStage: "awareness", variants: [], status: "pending" }],
      status: "planned",
    };

    const callbacks: CampaignCallbacks = {
      onPhaseStarted: vi.fn(),
      onChannelStarted: vi.fn(),
      onChannelCompleted: vi.fn(),
      onCampaignCompleted: vi.fn(),
    };

    const result = await generateCampaignContent(campaign, callbacks);
    expect(result.status).toBe("review");
    expect(result.channels[0].variants).toHaveLength(3);
    expect(result.channels[0].status).toBe("ready");
    expect(result.channels[0].designHtml).toBeDefined();
    expect(callbacks.onPhaseStarted).toHaveBeenCalledWith(2);
    expect(callbacks.onChannelCompleted).toHaveBeenCalledWith("ch1", "whatsapp");
  });

  it("handles channel failure gracefully with Promise.allSettled", async () => {
    // Override mock to throw for this test
    const { socialMediaManagerAgent } = await import("./social-media-manager.js");
    vi.mocked(socialMediaManagerAgent.run).mockRejectedValueOnce(new Error("API timeout"));

    const campaign: Campaign = {
      ...baseCampaign,
      concept: "Test concept",
      funnel: [{ stage: "awareness", description: "Test", channels: ["whatsapp"] }],
      channels: [{ id: "ch1", channel: "whatsapp", funnelStage: "awareness", variants: [], status: "pending" }],
      status: "planned",
    };

    const callbacks: CampaignCallbacks = { onChannelFailed: vi.fn() };
    const result = await generateCampaignContent(campaign, callbacks);
    expect(result.channels[0].status).toBe("error");
    expect(callbacks.onChannelFailed).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/campaign-orchestrator.test.ts
```

- [ ] **Step 3: Implement campaign orchestrator — Phase 1 (analyzeCampaignBrief)**

```typescript
// backend/src/agents/campaign-orchestrator.ts
import { randomUUID } from "crypto";
import type { Campaign, CampaignCallbacks, ContentType, ChannelPlan } from "../../shared/types.js";
import { uxStrategistAgent, parseUXStrategyOutput } from "./ux-strategist.js";
import { copywriterAgent } from "./copywriter.js";
import { socialMediaManagerAgent } from "./social-media-manager.js";
import { designerAgent } from "./designer.js";
import { seoSpecialistAgent, parseSEOOutput } from "./seo-specialist.js";
import { brandGuardianAgent, buildReviewMessage } from "./brand-guardian.js";
import { parseBrandReview } from "./orchestrator-utils.js";

const SOCIAL_CHANNELS: ContentType[] = ["whatsapp", "facebook-ad", "linkedin-post", "instagram-post", "social-card"];
const SEO_CHANNELS: ContentType[] = ["blog-post", "landing-page"];
const DESIGN_CHANNELS: ContentType[] = ["whatsapp", "facebook-ad", "linkedin-post", "instagram-post", "social-card", "email", "email-sequence", "landing-page"];

function getContentAgent(channel: ContentType) {
  if (SOCIAL_CHANNELS.includes(channel)) return socialMediaManagerAgent;
  return copywriterAgent;
}

function needsDesigner(channel: ContentType): boolean {
  return DESIGN_CHANNELS.includes(channel);
}

function needsSEO(channel: ContentType): boolean {
  return SEO_CHANNELS.includes(channel);
}

export async function analyzeCampaignBrief(
  campaign: Campaign,
  callbacks?: CampaignCallbacks
): Promise<Campaign> {
  callbacks?.onPhaseStarted?.(1);

  // UX Strategist generates concept + funnel
  const strategyResult = await uxStrategistAgent.run({
    line: campaign.line,
    userMessage: `Analiza este brief de campaña y genera el concepto y embudo:

Brief: ${campaign.brief}
Línea de negocio: ${campaign.line}
Audiencia: ${campaign.audience}
Objetivo: ${campaign.objective}`,
  });

  const strategy = parseUXStrategyOutput(strategyResult.content);

  // Build ChannelPlan[] from funnel
  const channels: ChannelPlan[] = [];
  for (const stage of strategy.funnel) {
    for (const channel of stage.channels) {
      channels.push({
        id: randomUUID(),
        channel: channel as ContentType,
        funnelStage: stage.stage,
        variants: [],
        status: "pending",
      });
    }
  }

  return {
    ...campaign,
    name: campaign.name || `Campaña ${campaign.line} — ${strategy.concept}`,
    concept: strategy.concept,
    funnel: strategy.funnel,
    channels,
    status: "planned",
    updatedAt: new Date().toISOString(),
  };
}

export async function generateCampaignContent(
  campaign: Campaign,
  callbacks?: CampaignCallbacks
): Promise<Campaign> {
  callbacks?.onPhaseStarted?.(2);

  const updatedChannels = [...campaign.channels];

  // Phase 2: Generate content in parallel per channel
  const results = await Promise.allSettled(
    updatedChannels.map(async (channelPlan, index) => {
      callbacks?.onChannelStarted?.(channelPlan.id, channelPlan.channel);
      updatedChannels[index] = { ...channelPlan, status: "generating" };

      // Step 1: Generate 3 copy variants
      const variantPromises = ["A", "B", "C"].map(async (label) => {
        const agent = getContentAgent(channelPlan.channel);
        const result = await agent.run({
          line: campaign.line,
          userMessage: buildChannelPrompt(campaign, channelPlan, label),
        });
        return {
          id: randomUUID(),
          label: label as "A" | "B" | "C",
          content: result.content,
          selected: false,
        };
      });

      const variants = await Promise.all(variantPromises);

      // Step 2: Designer (if needed)
      let designHtml: string | undefined;
      if (needsDesigner(channelPlan.channel)) {
        const designResult = await designerAgent.run({
          line: campaign.line,
          userMessage: `Genera HTML/CSS para ${channelPlan.channel} de la línea ${campaign.line}.
Concepto de campaña: ${campaign.concept}
Audiencia: ${campaign.audience}
Contenido base: ${variants[0].content}`,
        });
        designHtml = designResult.content;
      }

      // Step 3: SEO (if needed)
      let seoOptimization;
      if (needsSEO(channelPlan.channel)) {
        const seoResult = await seoSpecialistAgent.run({
          line: campaign.line,
          userMessage: `Optimiza este contenido para SEO:

Tipo: ${channelPlan.channel}
Línea: ${campaign.line}
Audiencia: ${campaign.audience}

Contenido:
${variants[0].content}`,
        });
        seoOptimization = parseSEOOutput(seoResult.content);
      }

      callbacks?.onChannelCompleted?.(channelPlan.id, channelPlan.channel);
      return { index, variants, designHtml, seoOptimization };
    })
  );

  // Process results
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      const { index, variants, designHtml, seoOptimization } = result.value;
      updatedChannels[index] = {
        ...updatedChannels[index],
        variants,
        designHtml,
        seoOptimization,
        status: "ready",
      };
    } else {
      updatedChannels[i] = {
        ...updatedChannels[i],
        status: "error",
      };
      callbacks?.onChannelFailed?.(
        updatedChannels[i].id,
        updatedChannels[i].channel,
        result.reason?.message || "Unknown error"
      );
    }
  }

  // Phase 3: Brand Guardian review
  callbacks?.onPhaseStarted?.(3);
  for (let i = 0; i < updatedChannels.length; i++) {
    const ch = updatedChannels[i];
    if (ch.status !== "ready" || ch.variants.length === 0) continue;

    const reviewResult = await brandGuardianAgent.run({
      line: campaign.line,
      userMessage: buildReviewMessage({
        content: ch.variants[0].content,
        line: campaign.line,
        contentType: ch.channel,
        audience: campaign.audience,
      }),
    });

    updatedChannels[i] = {
      ...ch,
      brandReview: parseBrandReview(reviewResult.content),
    };
  }

  callbacks?.onCampaignCompleted?.({
    ...campaign,
    channels: updatedChannels,
    status: "review",
  });

  return {
    ...campaign,
    channels: updatedChannels,
    status: "review",
    updatedAt: new Date().toISOString(),
  };
}

function buildChannelPrompt(campaign: Campaign, channelPlan: ChannelPlan, variantLabel: string): string {
  return `Genera el contenido (variante ${variantLabel}) para un ${channelPlan.channel} como parte de una campaña.

CONTEXTO DE CAMPAÑA:
- Concepto: ${campaign.concept}
- Línea: ${campaign.line}
- Audiencia: ${campaign.audience}
- Objetivo: ${campaign.objective}
- Etapa del embudo: ${channelPlan.funnelStage}

Genera una variante ÚNICA y diferente. Variante ${variantLabel} debe tener un ángulo distinto:
- A: Enfoque emocional (dolor/alivio)
- B: Enfoque racional (datos/ROI)
- C: Enfoque social (testimonios/casos)

Escribe SOLO el contenido, sin explicaciones.`;
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/campaign-orchestrator.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/agents/campaign-orchestrator.ts backend/src/agents/campaign-orchestrator.test.ts backend/src/agents/orchestrator-utils.ts backend/src/agents/orchestrator.ts
git commit -m "feat: add campaign orchestrator with phased pipeline — strategy, parallel generation, brand review"
```

---

### Task 6: Campaign API Routes

**Files:**
- Create: `backend/src/routes/campaigns.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Implement campaign routes**

```typescript
// backend/src/routes/campaigns.ts
import { Router } from "express";
import { randomUUID } from "crypto";
import type { Campaign, CreateCampaignRequest } from "../../shared/types.js";
import { analyzeCampaignBrief, generateCampaignContent } from "../agents/campaign-orchestrator.js";

const router = Router();
const campaignStore: Map<string, Campaign> = new Map();

// POST /api/campaigns — Create campaign
router.post("/", (req, res) => {
  const body = req.body as CreateCampaignRequest;
  if (!body.brief || !body.line || !body.audience) {
    res.status(400).json({ error: "Missing required fields: brief, line, audience" });
    return;
  }

  const campaign: Campaign = {
    id: randomUUID(),
    name: "",
    brief: body.brief,
    line: body.line,
    audience: body.audience,
    objective: body.objective || "",
    concept: "",
    funnel: [],
    channels: [],
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  campaignStore.set(campaign.id, campaign);
  res.status(201).json(campaign);
});

// GET /api/campaigns — List campaigns
router.get("/", (req, res) => {
  let campaigns = Array.from(campaignStore.values());
  const { line, status } = req.query;
  if (line) campaigns = campaigns.filter((c) => c.line === line);
  if (status) campaigns = campaigns.filter((c) => c.status === status);
  res.json(campaigns);
});

// GET /api/campaigns/:id — Get campaign detail
router.get("/:id", (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
  res.json(campaign);
});

// POST /api/campaigns/:id/analyze — Trigger Phase 1
router.post("/:id/analyze", async (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
  if (campaign.status !== "draft") {
    res.status(400).json({ error: "Campaign must be in draft status to analyze" });
    return;
  }

  try {
    campaign.status = "planning";
    campaignStore.set(campaign.id, campaign);
    const updated = await analyzeCampaignBrief(campaign);
    campaignStore.set(updated.id, updated);
    res.json(updated);
  } catch (error) {
    campaign.status = "draft";
    campaignStore.set(campaign.id, campaign);
    console.error("Campaign analysis error:", error);
    res.status(500).json({ error: "Failed to analyze campaign brief" });
  }
});

// PUT /api/campaigns/:id/plan — Modify plan (add/remove channels)
router.put("/:id/plan", (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }

  const { channels, funnel } = req.body;
  if (channels) campaign.channels = channels;
  if (funnel) campaign.funnel = funnel;
  campaign.updatedAt = new Date().toISOString();
  campaignStore.set(campaign.id, campaign);
  res.json(campaign);
});

// POST /api/campaigns/:id/generate — Trigger Phase 2+3
router.post("/:id/generate", async (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
  if (campaign.status !== "planned") {
    res.status(400).json({ error: "Campaign must be in planned status to generate" });
    return;
  }

  try {
    campaign.status = "generating";
    campaignStore.set(campaign.id, campaign);
    const updated = await generateCampaignContent(campaign);
    campaignStore.set(updated.id, updated);
    res.json(updated);
  } catch (error) {
    campaign.status = "planned";
    campaignStore.set(campaign.id, campaign);
    console.error("Campaign generation error:", error);
    res.status(500).json({ error: "Failed to generate campaign content" });
  }
});

// PUT /api/campaigns/:id/channels/:channelId/select — Select variant
router.put("/:id/channels/:channelId/select", (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }

  const channel = campaign.channels.find((c) => c.id === req.params.channelId);
  if (!channel) { res.status(404).json({ error: "Channel not found" }); return; }

  const { variantId } = req.body;
  channel.variants.forEach((v) => (v.selected = v.id === variantId));
  channel.status = "approved";
  campaign.updatedAt = new Date().toISOString();
  campaignStore.set(campaign.id, campaign);
  res.json(campaign);
});

// POST /api/campaigns/:id/channels/:channelId/regenerate — Retry failed channel
router.post("/:id/channels/:channelId/regenerate", async (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }

  const channelIndex = campaign.channels.findIndex((c) => c.id === req.params.channelId);
  if (channelIndex === -1) { res.status(404).json({ error: "Channel not found" }); return; }

  try {
    campaign.channels[channelIndex].status = "generating";
    // Re-run generation for just this channel using generateCampaignContent with single channel
    const singleChannelCampaign = { ...campaign, channels: [campaign.channels[channelIndex]] };
    const result = await generateCampaignContent(singleChannelCampaign);
    campaign.channels[channelIndex] = result.channels[0];
    campaign.updatedAt = new Date().toISOString();
    campaignStore.set(campaign.id, campaign);
    res.json(campaign);
  } catch (error) {
    campaign.channels[channelIndex].status = "error";
    campaignStore.set(campaign.id, campaign);
    res.status(500).json({ error: "Failed to regenerate channel" });
  }
});

// PUT /api/campaigns/:id/approve — Approve campaign
router.put("/:id/approve", (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }

  campaign.status = "approved";
  campaign.updatedAt = new Date().toISOString();
  campaignStore.set(campaign.id, campaign);
  res.json(campaign);
});

export { router as campaignRouter };
```

- [ ] **Step 2: Mount campaign router in index.ts**

Add to `backend/src/index.ts`:
```typescript
import { campaignRouter } from "./routes/campaigns.js";
// ... after existing routes
app.use("/api/campaigns", campaignRouter);
```

- [ ] **Step 3: Verify server starts**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools/backend && npx tsx src/index.ts &
sleep 2 && curl -s http://localhost:3001/api/health && kill %1
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/campaigns.ts backend/src/index.ts
git commit -m "feat: add campaign CRUD API routes with analyze, generate, select, and regenerate"
```

---

### Task 7: Campaign Export (ZIP)

**Files:**
- Create: `backend/src/export/campaign-exporter.ts`
- Test: `backend/src/export/campaign-exporter.test.ts`
- Modify: `backend/src/routes/campaigns.ts`

- [ ] **Step 1: Install archiver**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools/backend && npm install archiver && npm install -D @types/archiver
```

- [ ] **Step 2: Write failing test**

```typescript
// backend/src/export/campaign-exporter.test.ts
import { describe, it, expect } from "vitest";
import { buildExportFiles } from "./campaign-exporter.js";
import type { Campaign } from "../../shared/types.js";

describe("Campaign Exporter", () => {
  it("builds file list from campaign", () => {
    const campaign: Campaign = {
      id: "test",
      name: "Test Campaign",
      brief: "Test brief",
      line: "OPL",
      audience: "Test audience",
      objective: "Test objective",
      concept: "Test concept",
      funnel: [{ stage: "awareness", description: "Test", channels: ["whatsapp"] }],
      channels: [{
        id: "ch1",
        channel: "whatsapp",
        funnelStage: "awareness",
        variants: [
          { id: "v1", label: "A", content: "WhatsApp copy here", selected: true },
          { id: "v2", label: "B", content: "Alt copy", selected: false },
        ],
        designHtml: "<div>Asset</div>",
        status: "approved",
      }],
      status: "approved",
      createdAt: "2026-03-24",
      updatedAt: "2026-03-24",
    };

    const files = buildExportFiles(campaign);
    expect(files.some((f) => f.path === "README.md")).toBe(true);
    expect(files.some((f) => f.path === "awareness/whatsapp/copy.md")).toBe(true);
    expect(files.some((f) => f.path === "awareness/whatsapp/asset.html")).toBe(true);
    expect(files.some((f) => f.path === "brand-review.md")).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/export/campaign-exporter.test.ts
```

- [ ] **Step 4: Implement campaign exporter**

```typescript
// backend/src/export/campaign-exporter.ts
import archiver from "archiver";
import type { Response } from "express";
import type { Campaign, ChannelPlan } from "../../shared/types.js";

export interface ExportFile {
  path: string;
  content: string;
}

export function buildExportFiles(campaign: Campaign): ExportFile[] {
  const files: ExportFile[] = [];

  // README
  files.push({
    path: "README.md",
    content: `# ${campaign.name}

**Concepto:** ${campaign.concept}
**Línea:** ${campaign.line}
**Audiencia:** ${campaign.audience}
**Objetivo:** ${campaign.objective}

## Embudo
${campaign.funnel.map((f) => `- **${f.stage}**: ${f.description} (${f.channels.join(", ")})`).join("\n")}
`,
  });

  // Channel files organized by funnel stage
  for (const channel of campaign.channels) {
    const selected = channel.variants.find((v) => v.selected) || channel.variants[0];
    if (!selected) continue;

    const dir = `${channel.funnelStage}/${channel.channel}`;

    files.push({ path: `${dir}/copy.md`, content: selected.content });

    if (channel.designHtml) {
      files.push({ path: `${dir}/asset.html`, content: channel.designHtml });
    }

    if (channel.seoOptimization) {
      const seo = channel.seoOptimization;
      files.push({
        path: `${dir}/seo-brief.md`,
        content: `# SEO Brief

**Título optimizado:** ${seo.optimizedTitle}
**Meta description:** ${seo.metaDescription}
**Score:** ${seo.score}/100

## Keywords
${seo.keywords.map((k) => `- ${k}`).join("\n")}

## Sugerencias
${seo.suggestions.map((s) => `- ${s}`).join("\n")}
`,
      });
    }
  }

  // Brand review consolidated
  const reviewLines = campaign.channels
    .filter((ch) => ch.brandReview)
    .map((ch) => `### ${ch.channel} (${ch.funnelStage})
- Score: ${ch.brandReview!.score}/100
- Approved: ${ch.brandReview!.approved ? "Yes" : "No"}
${ch.brandReview!.checks.map((c) => `- [${c.passed ? "x" : " "}] ${c.name}: ${c.detail}`).join("\n")}`);

  files.push({
    path: "brand-review.md",
    content: `# Brand Review\n\n${reviewLines.join("\n\n")}`,
  });

  return files;
}

export function streamZip(campaign: Campaign, res: Response): void {
  const files = buildExportFiles(campaign);
  const slug = campaign.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${slug}.zip"`);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);

  for (const file of files) {
    archive.append(file.content, { name: file.path });
  }

  archive.finalize();
}
```

- [ ] **Step 5: Add export route to campaigns.ts**

Add to `backend/src/routes/campaigns.ts`:

```typescript
import { streamZip } from "../export/campaign-exporter.js";

// GET /api/campaigns/:id/export — Download ZIP
router.get("/:id/export", (req, res) => {
  const campaign = campaignStore.get(req.params.id);
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
  if (campaign.status !== "approved" && campaign.status !== "exported") {
    res.status(400).json({ error: "Campaign must be approved to export" });
    return;
  }

  campaign.status = "exported";
  campaignStore.set(campaign.id, campaign);
  streamZip(campaign, res);
});
```

- [ ] **Step 6: Run tests**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/export/campaign-exporter.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/export/ backend/src/routes/campaigns.ts backend/package.json backend/package-lock.json
git commit -m "feat: add campaign ZIP export with archiver — organized by funnel stage and channel"
```

---

### Task 8: Campaign API Client (Frontend)

**Files:**
- Create: `frontend/src/lib/campaign-api.ts`

- [ ] **Step 1: Create campaign API client**

```typescript
// frontend/src/lib/campaign-api.ts
const BASE = "/api/campaigns";

export interface Campaign {
  id: string;
  name: string;
  brief: string;
  line: string;
  audience: string;
  objective: string;
  concept: string;
  funnel: Array<{ stage: string; description: string; channels: string[] }>;
  channels: Array<{
    id: string;
    channel: string;
    funnelStage: string;
    variants: Array<{ id: string; label: string; content: string; selected: boolean }>;
    designHtml?: string;
    seoOptimization?: { keywords: string[]; suggestions: string[]; score: number; metaDescription: string; optimizedTitle: string };
    brandReview?: { approved: boolean; score: number; checks: Array<{ name: string; passed: boolean; detail: string; severity: string }>; reviewedAt: string };
    status: string;
  }>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignRequest {
  brief: string;
  line: string;
  audience: string;
  objective: string;
}

async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error: ${res.status}`);
  }
  return res.json();
}

export const campaignApi = {
  create: (req: CreateCampaignRequest) =>
    apiCall<Campaign>(BASE, { method: "POST", body: JSON.stringify(req) }),

  list: (filters?: { line?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.line) params.set("line", filters.line);
    if (filters?.status) params.set("status", filters.status);
    const qs = params.toString();
    return apiCall<Campaign[]>(`${BASE}${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) => apiCall<Campaign>(`${BASE}/${id}`),

  analyze: (id: string) =>
    apiCall<Campaign>(`${BASE}/${id}/analyze`, { method: "POST" }),

  updatePlan: (id: string, data: { channels?: unknown[]; funnel?: unknown[] }) =>
    apiCall<Campaign>(`${BASE}/${id}/plan`, { method: "PUT", body: JSON.stringify(data) }),

  generate: (id: string) =>
    apiCall<Campaign>(`${BASE}/${id}/generate`, { method: "POST" }),

  selectVariant: (id: string, channelId: string, variantId: string) =>
    apiCall<Campaign>(`${BASE}/${id}/channels/${channelId}/select`, {
      method: "PUT", body: JSON.stringify({ variantId }),
    }),

  regenerateChannel: (id: string, channelId: string) =>
    apiCall<Campaign>(`${BASE}/${id}/channels/${channelId}/regenerate`, { method: "POST" }),

  approve: (id: string) =>
    apiCall<Campaign>(`${BASE}/${id}/approve`, { method: "PUT" }),

  exportUrl: (id: string) => `${BASE}/${id}/export`,
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/campaign-api.ts
git commit -m "feat: add campaign API client with all endpoints"
```

---

### Task 9: Campaign Zustand Store

**Files:**
- Create: `frontend/src/store/campaign.ts`

- [ ] **Step 1: Create campaign store**

```typescript
// frontend/src/store/campaign.ts
import { create } from "zustand";
import { campaignApi } from "../lib/campaign-api";
import type { Campaign } from "../lib/campaign-api";
import { useActivityStore } from "./activity";

type WizardStep = "brief" | "plan" | "generating" | "review";

interface CampaignStore {
  campaigns: Campaign[];
  current: Campaign | null;
  wizardStep: WizardStep;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCampaigns: () => Promise<void>;
  createCampaign: (brief: string, line: string, audience: string, objective: string) => Promise<void>;
  analyzeBrief: () => Promise<void>;
  generateContent: () => Promise<void>;
  selectVariant: (channelId: string, variantId: string) => Promise<void>;
  regenerateChannel: (channelId: string) => Promise<void>;
  approveCampaign: () => Promise<void>;
  refreshCurrent: () => Promise<void>;
  setWizardStep: (step: WizardStep) => void;
  clearCurrent: () => void;
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  campaigns: [],
  current: null,
  wizardStep: "brief",
  isLoading: false,
  error: null,

  fetchCampaigns: async () => {
    const campaigns = await campaignApi.list();
    set({ campaigns });
  },

  createCampaign: async (brief, line, audience, objective) => {
    const addActivity = useActivityStore.getState().addActivity;
    set({ isLoading: true, error: null });
    try {
      const campaign = await campaignApi.create({ brief, line, audience, objective });
      set({ current: campaign, isLoading: false });
      addActivity("working", `Nueva campaña creada para ${line}`);

      // Immediately analyze
      set({ isLoading: true });
      const analyzed = await campaignApi.analyze(campaign.id);
      set({ current: analyzed, wizardStep: "plan", isLoading: false });
      addActivity("success", `Concepto generado: "${analyzed.concept}"`);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
      addActivity("error", `Error creando campaña: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  analyzeBrief: async () => {
    const { current } = get();
    if (!current) return;
    set({ isLoading: true, error: null });
    try {
      const analyzed = await campaignApi.analyze(current.id);
      set({ current: analyzed, wizardStep: "plan", isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
    }
  },

  generateContent: async () => {
    const { current } = get();
    if (!current) return;
    const addActivity = useActivityStore.getState().addActivity;
    set({ isLoading: true, error: null, wizardStep: "generating" });
    addActivity("working", `Generando contenido para ${current.channels.length} canales...`);
    try {
      const updated = await campaignApi.generate(current.id);
      set({ current: updated, wizardStep: "review", isLoading: false });
      const readyCount = updated.channels.filter((c) => c.status === "ready").length;
      addActivity("success", `${readyCount} canales generados para "${updated.concept}"`);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
      addActivity("error", `Error generando campaña: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  selectVariant: async (channelId, variantId) => {
    const { current } = get();
    if (!current) return;
    const updated = await campaignApi.selectVariant(current.id, channelId, variantId);
    set({ current: updated });
  },

  regenerateChannel: async (channelId) => {
    const { current } = get();
    if (!current) return;
    set({ isLoading: true });
    try {
      const updated = await campaignApi.regenerateChannel(current.id, channelId);
      set({ current: updated, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
    }
  },

  approveCampaign: async () => {
    const { current } = get();
    if (!current) return;
    const addActivity = useActivityStore.getState().addActivity;
    const updated = await campaignApi.approve(current.id);
    set((state) => ({
      current: updated,
      campaigns: [updated, ...state.campaigns.filter((c) => c.id !== updated.id)],
    }));
    addActivity("success", `Campaña "${updated.name}" aprobada`);
  },

  refreshCurrent: async () => {
    const { current } = get();
    if (!current) return;
    const updated = await campaignApi.get(current.id);
    set({ current: updated });
  },

  setWizardStep: (step) => set({ wizardStep: step }),
  clearCurrent: () => set({ current: null, wizardStep: "brief", error: null }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/store/campaign.ts
git commit -m "feat: add campaign Zustand store with full wizard lifecycle"
```

---

### Task 10: Campaign Wizard UI — Brief Screen

**Files:**
- Create: `frontend/src/components/Campaigns/BriefScreen.tsx`
- Create: `frontend/src/components/Campaigns/CampaignWizard.tsx`

- [ ] **Step 1: Create BriefScreen component**

```typescript
// frontend/src/components/Campaigns/BriefScreen.tsx
import { useState } from "react";

interface BriefScreenProps {
  onSubmit: (brief: string, line: string, audience: string, objective: string) => void;
  isLoading: boolean;
}

const LINES = [
  { value: "OPL", label: "OPL — Venta de equipos" },
  { value: "AAS", label: "AAS — Renting / LaaS" },
  { value: "MH", label: "Multihousing" },
  { value: "Volta", label: "Volta — Lavanderías" },
];

export function BriefScreen({ onSubmit, isLoading }: BriefScreenProps) {
  const [brief, setBrief] = useState("");
  const [line, setLine] = useState("OPL");
  const [audience, setAudience] = useState("");
  const [objective, setObjective] = useState("");

  const canSubmit = brief.trim() && line && audience.trim();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-near-black">Nueva Campaña</h2>
        <p className="text-sm text-gray-500 mt-1">Describe tu campaña y el sistema generará el plan</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-near-black mb-2">Brief de la campaña</label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={5}
          placeholder="Describe la campaña: a quién va dirigida, qué quieres comunicar, qué acción quieres que tomen..."
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-near-black mb-2">Línea de negocio</label>
          <select
            value={line}
            onChange={(e) => setLine(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
          >
            {LINES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-near-black mb-2">Audiencia / Target</label>
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Ej: Jefes de mantenimiento hotelero"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-near-black mb-2">Objetivo (opcional)</label>
        <input
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Ej: Generar 20 leads calificados en 30 días"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
        />
      </div>

      <button
        onClick={() => onSubmit(brief, line, audience, objective)}
        disabled={!canSubmit || isLoading}
        className="w-full bg-electric-blue text-white rounded-lg px-6 py-3 font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
      >
        {isLoading ? "Analizando brief..." : "Analizar Brief"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create CampaignWizard shell**

```typescript
// frontend/src/components/Campaigns/CampaignWizard.tsx
import { useCampaignStore } from "../../store/campaign";
import { BriefScreen } from "./BriefScreen";

interface CampaignWizardProps {
  onClose: () => void;
}

export function CampaignWizard({ onClose }: CampaignWizardProps) {
  const { wizardStep, current, isLoading, error, createCampaign, clearCurrent } = useCampaignStore();

  const handleClose = () => {
    clearCurrent();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            {["brief", "plan", "generating", "review"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === wizardStep ? "bg-electric-blue text-white" :
                  ["brief", "plan", "generating", "review"].indexOf(wizardStep) > i ? "bg-green-500 text-white" :
                  "bg-gray-200 text-gray-500"
                }`}>
                  {i + 1}
                </div>
                {i < 3 && <div className="w-8 h-px bg-gray-300" />}
              </div>
            ))}
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {/* Content */}
        <div className="p-6">
          {wizardStep === "brief" && (
            <BriefScreen onSubmit={createCampaign} isLoading={isLoading} />
          )}
          {wizardStep === "plan" && current && (
            <div className="text-center text-gray-500 py-12">Plan Screen — next task</div>
          )}
          {wizardStep === "generating" && (
            <div className="text-center text-gray-500 py-12">Generation Screen — next task</div>
          )}
          {wizardStep === "review" && current && (
            <div className="text-center text-gray-500 py-12">Review Screen — next task</div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Campaigns/
git commit -m "feat: add CampaignWizard with BriefScreen — step 1 of 4-screen wizard"
```

---

### Task 11: Campaign Wizard — Plan Screen

**Files:**
- Create: `frontend/src/components/Campaigns/PlanScreen.tsx`
- Create: `frontend/src/components/Campaigns/FunnelDiagram.tsx`
- Modify: `frontend/src/components/Campaigns/CampaignWizard.tsx`

- [ ] **Step 1: Create FunnelDiagram component**

```typescript
// frontend/src/components/Campaigns/FunnelDiagram.tsx
const STAGE_COLORS: Record<string, string> = {
  awareness: "bg-coral/20 text-coral border-coral/30",
  interest: "bg-electric-blue/20 text-electric-blue border-electric-blue/30",
  nurture: "bg-lime-green/20 text-green-700 border-lime-green/30",
  conversion: "bg-neon-yellow/20 text-yellow-700 border-neon-yellow/30",
};

const STAGE_LABELS: Record<string, string> = {
  awareness: "Awareness",
  interest: "Interés",
  nurture: "Nutrición",
  conversion: "Conversión",
};

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: "📱",
  "facebook-ad": "📘",
  "linkedin-post": "💼",
  "instagram-post": "📸",
  "blog-post": "📝",
  email: "📧",
  "email-sequence": "📧",
  "landing-page": "🌐",
  "social-card": "🎨",
};

interface FunnelDiagramProps {
  funnel: Array<{ stage: string; description: string; channels: string[] }>;
}

export function FunnelDiagram({ funnel }: FunnelDiagramProps) {
  return (
    <div className="space-y-3">
      {funnel.map((stage, i) => (
        <div key={stage.stage} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${STAGE_COLORS[stage.stage] || "bg-gray-100"}`}>
              {i + 1}
            </div>
            {i < funnel.length - 1 && <div className="w-px h-6 bg-gray-300" />}
          </div>
          <div className="flex-1 pb-2">
            <div className="font-semibold text-sm text-near-black">{STAGE_LABELS[stage.stage] || stage.stage}</div>
            <div className="text-xs text-gray-500 mb-2">{stage.description}</div>
            <div className="flex flex-wrap gap-2">
              {stage.channels.map((ch) => (
                <span key={ch} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                  <span>{CHANNEL_ICONS[ch] || "📄"}</span>
                  <span>{ch}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create PlanScreen component**

```typescript
// frontend/src/components/Campaigns/PlanScreen.tsx
import type { Campaign } from "../../lib/campaign-api";
import { FunnelDiagram } from "./FunnelDiagram";

interface PlanScreenProps {
  campaign: Campaign;
  onApprove: () => void;
  isLoading: boolean;
}

export function PlanScreen({ campaign, onApprove, isLoading }: PlanScreenProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-near-black">Plan de Campaña</h2>
        <p className="text-sm text-gray-500 mt-1">Revisa el plan generado antes de generar contenido</p>
      </div>

      {/* Concept */}
      <div className="bg-gradient-to-r from-electric-blue/10 to-coral/10 rounded-xl p-5">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Concepto</div>
        <div className="text-lg font-bold text-near-black">"{campaign.concept}"</div>
      </div>

      {/* Campaign info */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Línea</div>
          <div className="font-semibold">{campaign.line}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Audiencia</div>
          <div className="font-semibold">{campaign.audience}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Piezas a generar</div>
          <div className="font-semibold">{campaign.channels.length} canales</div>
        </div>
      </div>

      {/* Funnel */}
      <div>
        <h3 className="font-semibold text-near-black mb-3">Embudo</h3>
        <FunnelDiagram funnel={campaign.funnel} />
      </div>

      <button
        onClick={onApprove}
        disabled={isLoading}
        className="w-full bg-electric-blue text-white rounded-lg px-6 py-3 font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
      >
        {isLoading ? "Generando contenido..." : "Aprobar Plan y Generar Contenido"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Wire PlanScreen into CampaignWizard**

Update the `plan` case in `CampaignWizard.tsx`:

```typescript
{wizardStep === "plan" && current && (
  <PlanScreen campaign={current} onApprove={generateContent} isLoading={isLoading} />
)}
```

Add `generateContent` to the destructured store values.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Campaigns/
git commit -m "feat: add PlanScreen with FunnelDiagram — campaign plan review before generation"
```

---

### Task 12: Campaign Wizard — Generation Screen

**Files:**
- Create: `frontend/src/components/Campaigns/GenerationScreen.tsx`
- Modify: `frontend/src/components/Campaigns/CampaignWizard.tsx`

- [ ] **Step 1: Create GenerationScreen component**

```typescript
// frontend/src/components/Campaigns/GenerationScreen.tsx
import type { Campaign } from "../../lib/campaign-api";

const STATUS_DISPLAY: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "En espera", color: "text-gray-400", icon: "⏳" },
  generating: { label: "Generando...", color: "text-electric-blue", icon: "⚡" },
  ready: { label: "Listo", color: "text-green-600", icon: "✓" },
  error: { label: "Error", color: "text-red-500", icon: "✕" },
  approved: { label: "Aprobado", color: "text-green-600", icon: "✓" },
};

interface GenerationScreenProps {
  campaign: Campaign;
}

export function GenerationScreen({ campaign }: GenerationScreenProps) {
  const totalChannels = campaign.channels.length;
  const readyCount = campaign.channels.filter((c) => c.status === "ready" || c.status === "approved").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-near-black">Generando Campaña</h2>
        <p className="text-sm text-gray-500 mt-1">"{campaign.concept}"</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>{readyCount} de {totalChannels} canales</span>
          <span>{Math.round((readyCount / totalChannels) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-electric-blue rounded-full transition-all duration-500"
            style={{ width: `${(readyCount / totalChannels) * 100}%` }}
          />
        </div>
      </div>

      {/* Channel list */}
      <div className="space-y-3">
        {campaign.channels.map((channel) => {
          const display = STATUS_DISPLAY[channel.status] || STATUS_DISPLAY.pending;
          return (
            <div key={channel.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">{display.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-near-black">{channel.channel}</div>
                  <div className="text-xs text-gray-500">{channel.funnelStage}</div>
                </div>
              </div>
              <span className={`text-sm font-medium ${display.color}`}>{display.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into CampaignWizard**

Replace the generating placeholder:
```typescript
{wizardStep === "generating" && current && (
  <GenerationScreen campaign={current} />
)}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Campaigns/
git commit -m "feat: add GenerationScreen with per-channel progress tracking"
```

---

### Task 13: Campaign Wizard — Review Screen with Variant Selector

**Files:**
- Create: `frontend/src/components/Campaigns/VariantSelector.tsx`
- Create: `frontend/src/components/Campaigns/ReviewScreen.tsx`
- Modify: `frontend/src/components/Campaigns/CampaignWizard.tsx`

- [ ] **Step 1: Create VariantSelector component**

```typescript
// frontend/src/components/Campaigns/VariantSelector.tsx
interface Variant {
  id: string;
  label: string;
  content: string;
  selected: boolean;
}

interface VariantSelectorProps {
  variants: Variant[];
  onSelect: (variantId: string) => void;
}

export function VariantSelector({ variants, onSelect }: VariantSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {variants.map((v) => (
        <button
          key={v.id}
          onClick={() => onSelect(v.id)}
          className={`text-left p-4 rounded-lg border-2 transition-colors ${
            v.selected
              ? "border-electric-blue bg-electric-blue/5"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-bold ${v.selected ? "text-electric-blue" : "text-gray-500"}`}>
              Variante {v.label}
            </span>
            {v.selected && <span className="text-electric-blue text-sm">✓ Seleccionada</span>}
          </div>
          <div className="text-xs text-gray-600 line-clamp-6 whitespace-pre-wrap">{v.content}</div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create ReviewScreen component**

```typescript
// frontend/src/components/Campaigns/ReviewScreen.tsx
import type { Campaign } from "../../lib/campaign-api";
import { VariantSelector } from "./VariantSelector";
import { campaignApi } from "../../lib/campaign-api";

interface ReviewScreenProps {
  campaign: Campaign;
  onSelectVariant: (channelId: string, variantId: string) => void;
  onRegenerate: (channelId: string) => void;
  onApprove: () => void;
  isLoading: boolean;
}

export function ReviewScreen({ campaign, onSelectVariant, onRegenerate, onApprove, isLoading }: ReviewScreenProps) {
  const allSelected = campaign.channels
    .filter((c) => c.status === "ready" || c.status === "approved")
    .every((c) => c.variants.some((v) => v.selected));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-near-black">Revisión de Campaña</h2>
        <p className="text-sm text-gray-500 mt-1">Selecciona la mejor variante para cada canal</p>
      </div>

      {campaign.channels.map((channel) => (
        <div key={channel.id} className="border rounded-xl overflow-hidden">
          {/* Channel header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
            <div>
              <span className="font-semibold text-sm">{channel.channel}</span>
              <span className="text-xs text-gray-500 ml-2">({channel.funnelStage})</span>
            </div>
            <div className="flex items-center gap-3">
              {channel.brandReview && (
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  channel.brandReview.approved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  Brand: {channel.brandReview.score}/100
                </span>
              )}
              {channel.status === "error" && (
                <button
                  onClick={() => onRegenerate(channel.id)}
                  className="text-xs bg-coral text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Regenerar
                </button>
              )}
            </div>
          </div>

          {/* Variants */}
          <div className="p-4">
            {channel.variants.length > 0 ? (
              <VariantSelector
                variants={channel.variants}
                onSelect={(variantId) => onSelectVariant(channel.id, variantId)}
              />
            ) : (
              <div className="text-sm text-gray-400 text-center py-4">
                {channel.status === "error" ? "Error generando este canal" : "Sin variantes"}
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <button
          onClick={onApprove}
          disabled={!allSelected || isLoading}
          className="flex-1 bg-electric-blue text-white rounded-lg px-6 py-3 font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          Aprobar Campaña
        </button>
        <a
          href={campaign.status === "approved" || campaign.status === "exported" ? campaignApi.exportUrl(campaign.id) : "#"}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            campaign.status === "approved" || campaign.status === "exported"
              ? "bg-near-black text-white hover:bg-gray-800"
              : "bg-gray-200 text-gray-400 pointer-events-none"
          }`}
        >
          Exportar ZIP
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire into CampaignWizard**

Replace the review placeholder:
```typescript
{wizardStep === "review" && current && (
  <ReviewScreen
    campaign={current}
    onSelectVariant={selectVariant}
    onRegenerate={regenerateChannel}
    onApprove={approveCampaign}
    isLoading={isLoading}
  />
)}
```

Add `selectVariant`, `regenerateChannel`, `approveCampaign` to destructured store.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Campaigns/
git commit -m "feat: add ReviewScreen with VariantSelector — A/B/C variant selection and export"
```

---

### Task 14: Wire Campaign Wizard into App

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Layout.tsx`
- Modify: `frontend/src/components/Dashboard/QuickActions.tsx`
- Modify: `frontend/src/components/Dashboard/Dashboard.tsx`

- [ ] **Step 1: Add "campaigns" to ViewType and Layout**

In `Layout.tsx`, add "campaigns" to `ViewType` and the tab list.

- [ ] **Step 2: Update App.tsx**

Add campaign wizard state and campaigns view:

```typescript
// In App.tsx, add:
import { CampaignWizard } from "./components/Campaigns/CampaignWizard";

// Add state:
const [showCampaignWizard, setShowCampaignWizard] = useState(false);

// Add to JSX (inside Layout):
{currentView === "campaigns" && <div className="text-center py-12 text-gray-500">Campaign list — future task</div>}
{showCampaignWizard && <CampaignWizard onClose={() => setShowCampaignWizard(false)} />}
```

Pass `setShowCampaignWizard` down to Dashboard.

- [ ] **Step 3: Wire QuickActions "Nueva Campaña" button**

In `QuickActions.tsx`, update the "Nueva Campaña" action:
```typescript
{ label: "Nueva Campaña", icon: "📋", onClick: () => onCreateCampaign?.() },
```

Add `onCreateCampaign` prop.

- [ ] **Step 4: Update Dashboard to pass campaign handler**

In `Dashboard.tsx`, accept and pass `onCreateCampaign` through to `QuickActions`.

- [ ] **Step 5: Verify the app compiles**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools/frontend && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/Layout.tsx frontend/src/components/Dashboard/QuickActions.tsx frontend/src/components/Dashboard/Dashboard.tsx
git commit -m "feat: wire CampaignWizard into app — nueva campaña button and campaigns tab"
```

---

### Task 15: Dashboard Campaign Cards

**Files:**
- Create: `frontend/src/components/Dashboard/CampaignCards.tsx`
- Modify: `frontend/src/components/Dashboard/Dashboard.tsx`

- [ ] **Step 1: Create CampaignCards component**

```typescript
// frontend/src/components/Dashboard/CampaignCards.tsx
import { useCampaignStore } from "../../store/campaign";
import { useEffect } from "react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  planning: "Planificando...",
  planned: "Plan listo",
  generating: "Generando...",
  review: "En revisión",
  approved: "Aprobada",
  exported: "Exportada",
};

export function CampaignCards() {
  const { campaigns, fetchCampaigns } = useCampaignStore();

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  if (campaigns.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-bold text-near-black mb-4">Campañas Activas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.slice(0, 4).map((c) => (
          <div key={c.id} className="bg-white border rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold text-sm text-near-black truncate">{c.name || "Nueva campaña"}</div>
              <span className="text-xs px-2 py-1 rounded bg-gray-100">{STATUS_LABELS[c.status] || c.status}</span>
            </div>
            {c.concept && <div className="text-xs text-gray-500 mb-2">"{c.concept}"</div>}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{c.line}</span>
              <span>{c.channels.length} canales</span>
              <span>{new Date(c.createdAt).toLocaleDateString("es-CO")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add CampaignCards to Dashboard**

In `Dashboard.tsx`, import and render `<CampaignCards />` between StatCards and QuickActions.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Dashboard/CampaignCards.tsx frontend/src/components/Dashboard/Dashboard.tsx
git commit -m "feat: add CampaignCards to dashboard — show active campaigns with status"
```

---

### Task 16: Integration Test & Polish

**Files:**
- All modified files

- [ ] **Step 1: Run all backend tests**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run
```

Expected: All PASS

- [ ] **Step 2: Verify frontend compiles**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools/frontend && npx tsc --noEmit
```

- [ ] **Step 3: Start backend and test campaign flow manually**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools/backend && npx tsx src/index.ts &
sleep 2

# Create campaign
curl -s -X POST http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{"brief":"Campaña para jefes de mantenimiento cansados de reparar equipos","line":"OPL","audience":"Jefes de mantenimiento hotelero","objective":"Generar leads"}' | jq .

kill %1
```

- [ ] **Step 4: Fix any issues found**

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Phase 3 campaigns — integration polish and fixes"
```

---

## Deferred Scope

- **AgentPanel per-campaign activity:** The spec mentions "Agent panel shows which agents are active per campaign." This requires real-time WebSocket or SSE integration to push agent status updates to the frontend. Deferred to a follow-up since the current MVP uses polling via `GET /campaigns/:id`.
- **Frontend tests:** Wizard screens and Zustand store tests deferred to post-MVP.
- **Campaign list page:** The "campaigns" tab currently shows a placeholder. A full campaign list with filters can be built as a follow-up, similar to ContentList.
