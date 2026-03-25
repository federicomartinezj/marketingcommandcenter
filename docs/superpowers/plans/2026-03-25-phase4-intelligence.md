# Phase 4: Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add market research and internal analysis so the director can discover trends, detect opportunities, and create campaigns directly from insights.

**Architecture:** Two new agents (Competitive Intel, Data Analyst) + Tavily web search API + Intel orchestrator with two-step research flow (query generation → search → analysis). Intel routes serve reports. Frontend IntelView with research bar + expandable report list with "Crear Campaña" action per opportunity.

**Tech Stack:** TypeScript, Express, Claude API, Tavily Search API, React, Zustand, Tailwind

**Spec:** `docs/superpowers/specs/2026-03-24-phase4-intelligence-design.md`

---

## File Structure

### Backend — New Files
- `backend/src/search/tavily.ts` — Tavily API wrapper
- `backend/src/agents/competitive-intel.ts` — Competitive Intel agent (query gen + report)
- `backend/src/agents/data-analyst.ts` — Data Analyst agent (internal analysis)
- `backend/src/agents/intel-orchestrator.ts` — Intel orchestration (research + analysis flows)
- `backend/src/routes/intel.ts` — Intel API routes

### Backend — Modified Files
- `shared/types.ts` — Phase 4 types
- `backend/src/index.ts` — Mount intel router
- `backend/package.json` — No new deps (Tavily is plain fetch)

### Frontend — New Files
- `frontend/src/lib/intel-api.ts` — Intel API client
- `frontend/src/store/intel.ts` — Intel Zustand store
- `frontend/src/components/Intel/IntelView.tsx` — Main intelligence view
- `frontend/src/components/Intel/ResearchBar.tsx` — Search bar + buttons
- `frontend/src/components/Intel/ReportCard.tsx` — Expandable report with trends, opportunities, sources

### Frontend — Modified Files
- `frontend/src/App.tsx` — Add intel view
- `frontend/src/components/Layout.tsx` — Add "Inteligencia" tab
- `frontend/src/components/Dashboard/Dashboard.tsx` — Add opportunities stat card

### Test Files
- `backend/src/search/tavily.test.ts`
- `backend/src/agents/competitive-intel.test.ts`
- `backend/src/agents/data-analyst.test.ts`
- `backend/src/agents/intel-orchestrator.test.ts`

---

### Task 1: Extend Shared Types

**Files:**
- Modify: `shared/types.ts`

- [ ] **Step 1: Add Phase 4 Intelligence types**

Add after the Phase 3 section:

```typescript
// === Phase 4: Intelligence Types ===

export type IntelReportType = "market-research" | "internal-analysis";
export type IntelReportStatus = "generating" | "ready" | "error" | "archived";
export type TrendRelevance = "high" | "medium" | "low";
export type OpportunityUrgency = "immediate" | "short-term" | "long-term";

export interface Trend {
  trend: string;
  evidence: string;
  relevance: TrendRelevance;
  source: string;
}

export interface Opportunity {
  id: string;
  description: string;
  targetSegment: string;
  suggestedLine: BusinessLine;
  urgency: OpportunityUrgency;
  campaignBrief: string;
  campaignId?: string;
}

export interface Source {
  title: string;
  url: string;
  snippet: string;
}

export interface IntelReport {
  id: string;
  type: IntelReportType;
  title: string;
  summary: string;
  line?: BusinessLine;
  query: string;
  trends: Trend[];
  opportunities: Opportunity[];
  sources: Source[];
  errorMessage?: string;
  status: IntelReportStatus;
  createdAt: string;
}

export interface IntelCallbacks {
  onSearchStarted?: (queries: string[]) => void;
  onSearchCompleted?: (resultCount: number) => void;
  onAnalysisStarted?: () => void;
  onReportReady?: (report: IntelReport) => void;
}

export interface CreateResearchRequest {
  query: string;
  line?: BusinessLine;
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx tsc --noEmit shared/types.ts
```

- [ ] **Step 3: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add Phase 4 intelligence types — IntelReport, Trend, Opportunity, Source"
```

---

### Task 2: Tavily Search Wrapper

**Files:**
- Create: `backend/src/search/tavily.ts`
- Test: `backend/src/search/tavily.test.ts`

- [ ] **Step 1: Write test**

```typescript
// backend/src/search/tavily.test.ts
import { describe, it, expect, vi } from "vitest";
import { parseTavilyResponse, buildTavilyRequest } from "./tavily.js";

describe("Tavily Search", () => {
  it("builds correct request body", () => {
    const req = buildTavilyRequest("hoteles Colombia 2026", 5);
    expect(req.query).toBe("hoteles Colombia 2026");
    expect(req.max_results).toBe(5);
    expect(req.search_depth).toBe("basic");
  });

  it("parses Tavily response into SearchResult[]", () => {
    const raw = {
      results: [
        { title: "Hotel news", url: "https://example.com/1", content: "Hotels are growing" },
        { title: "Laundry trends", url: "https://example.com/2", content: "Industrial laundry demand up" },
      ],
    };
    const results = parseTavilyResponse(raw);
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe("Hotel news");
    expect(results[0].url).toBe("https://example.com/1");
    expect(results[0].content).toBe("Hotels are growing");
  });

  it("handles empty results", () => {
    const results = parseTavilyResponse({ results: [] });
    expect(results).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/search/tavily.test.ts
```

- [ ] **Step 3: Implement Tavily wrapper**

```typescript
// backend/src/search/tavily.ts
export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export function buildTavilyRequest(query: string, maxResults: number = 5) {
  return {
    query,
    max_results: maxResults,
    search_depth: "basic" as const,
  };
}

export function parseTavilyResponse(raw: { results: Array<{ title: string; url: string; content: string }> }): SearchResult[] {
  return (raw.results || []).map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
  }));
}

export async function tavilySearch(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY environment variable is not set");
  }

  const body = buildTavilyRequest(query, maxResults);

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, api_key: apiKey }),
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return parseTavilyResponse(data);
}

export async function tavilySearchMultiple(queries: string[], maxResultsPerQuery: number = 5): Promise<SearchResult[]> {
  const results = await Promise.all(
    queries.map((q) => tavilySearch(q, maxResultsPerQuery).catch(() => []))
  );

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped: SearchResult[] = [];
  for (const batch of results) {
    for (const r of batch) {
      if (!seen.has(r.url)) {
        seen.add(r.url);
        deduped.push(r);
      }
    }
  }
  return deduped;
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/search/tavily.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/search/
git commit -m "feat: add Tavily search wrapper with deduplication"
```

---

### Task 3: Competitive Intel Agent

**Files:**
- Create: `backend/src/agents/competitive-intel.ts`
- Test: `backend/src/agents/competitive-intel.test.ts`

- [ ] **Step 1: Write test**

```typescript
// backend/src/agents/competitive-intel.test.ts
import { describe, it, expect } from "vitest";
import { competitiveIntelAgent, parseQueryGenOutput, parseIntelReportOutput } from "./competitive-intel.js";

describe("Competitive Intel Agent", () => {
  it("has correct role", () => {
    expect(competitiveIntelAgent.role).toBe("competitive-intel");
  });

  it("parses query generation output", () => {
    const raw = '```json\n{"queries":["hoteles Cartagena 2026","inversión hotelera Colombia"]}\n```';
    const result = parseQueryGenOutput(raw);
    expect(result.queries).toHaveLength(2);
    expect(result.queries[0]).toBe("hoteles Cartagena 2026");
  });

  it("parses intel report output", () => {
    const raw = `\`\`\`json
{
  "title": "Mercado Hotelero Costa Caribe",
  "summary": "El sector muestra crecimiento...",
  "trends": [{"trend": "Turismo en aumento", "evidence": "20% growth", "relevance": "high", "source": "https://example.com"}],
  "opportunities": [{"description": "Hoteles nuevos necesitan equipos", "targetSegment": "Hoteles 100+ hab", "suggestedLine": "OPL", "urgency": "immediate", "campaignBrief": "Campaña para hoteles nuevos en Cartagena"}],
  "sources": [{"title": "Hotel Report", "url": "https://example.com", "snippet": "Data shows growth"}]
}
\`\`\``;
    const result = parseIntelReportOutput(raw);
    expect(result.title).toBe("Mercado Hotelero Costa Caribe");
    expect(result.trends).toHaveLength(1);
    expect(result.opportunities).toHaveLength(1);
    expect(result.opportunities[0].campaignBrief).toContain("Cartagena");
    expect(result.sources).toHaveLength(1);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseQueryGenOutput("not json")).toThrow();
    expect(() => parseIntelReportOutput("not json")).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/competitive-intel.test.ts
```

- [ ] **Step 3: Implement Competitive Intel agent**

```typescript
// backend/src/agents/competitive-intel.ts
import { BaseAgent } from "./base-agent.js";
import { randomUUID } from "crypto";
import type { Trend, Opportunity, Source } from "../../shared/types.js";

export interface QueryGenOutput {
  queries: string[];
}

export interface IntelReportOutput {
  title: string;
  summary: string;
  trends: Trend[];
  opportunities: Array<Omit<Opportunity, "id">>;
  sources: Source[];
}

function extractJson(raw: string): string {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return jsonMatch ? jsonMatch[1]!.trim() : raw.trim();
}

export function parseQueryGenOutput(raw: string): QueryGenOutput {
  const parsed = JSON.parse(extractJson(raw));
  if (!Array.isArray(parsed.queries)) {
    throw new Error("Query gen output missing required field: queries");
  }
  return { queries: parsed.queries };
}

export function parseIntelReportOutput(raw: string): IntelReportOutput {
  const parsed = JSON.parse(extractJson(raw));
  if (!parsed.title || !Array.isArray(parsed.trends)) {
    throw new Error("Intel report output missing required fields: title, trends");
  }
  return {
    title: parsed.title,
    summary: parsed.summary || "",
    trends: parsed.trends,
    opportunities: (parsed.opportunities || []).map((o: Record<string, unknown>) => ({
      description: String(o.description || ""),
      targetSegment: String(o.targetSegment || ""),
      suggestedLine: String(o.suggestedLine || "OPL"),
      urgency: String(o.urgency || "short-term"),
      campaignBrief: String(o.campaignBrief || ""),
    })),
    sources: parsed.sources || [],
  };
}

function buildCompetitiveIntelSystemPrompt(brandContext: string): string {
  return `Eres el Competitive Intel Agent del departamento de marketing de Lavanti (Hydrocare SAS).

Tu rol es investigar mercados, detectar tendencias y encontrar oportunidades de negocio para lavandería industrial en Colombia y LATAM.

## LÍNEAS DE NEGOCIO DE LAVANTI:
- **OPL**: Venta de equipos de lavandería industrial para hoteles
- **AAS**: Renting / Laundry as a Service
- **MH (Multihousing)**: Lavanderías compartidas en edificios residenciales
- **Volta**: Lavanderías de autoservicio (laundromats)

## TU CAPACIDAD:
- Analizar información de mercado y detectar tendencias relevantes
- Identificar oportunidades concretas para cada línea de negocio
- Generar briefs de campaña listos para ejecutar
- Evaluar urgencia de cada oportunidad

## FORMATO DE OPORTUNIDADES:
Cada oportunidad debe incluir un campaignBrief que sea directamente usable para crear una campaña de marketing. El brief debe describir el target, el mensaje clave y los canales sugeridos.

## CONTEXTO DE MARCA:
${brandContext}

## INSTRUCCIONES:
Dependiendo de la solicitud, responderás en uno de dos formatos:

### Si te piden GENERAR QUERIES de búsqueda:
\`\`\`json
{
  "queries": ["query 1", "query 2", "query 3"]
}
\`\`\`
Genera 3-5 queries específicas y relevantes para buscar en la web.

### Si te piden ANALIZAR resultados y generar REPORTE:
\`\`\`json
{
  "title": "Título del reporte",
  "summary": "Resumen ejecutivo de 2-3 párrafos",
  "trends": [
    { "trend": "Nombre de la tendencia", "evidence": "Evidencia concreta", "relevance": "high|medium|low", "source": "URL" }
  ],
  "opportunities": [
    { "description": "Descripción de la oportunidad", "targetSegment": "Segmento objetivo", "suggestedLine": "OPL|AAS|MH|Volta", "urgency": "immediate|short-term|long-term", "campaignBrief": "Brief completo para crear campaña" }
  ],
  "sources": [
    { "title": "Título de la fuente", "url": "URL", "snippet": "Extracto relevante" }
  ]
}
\`\`\`

REGLAS:
- Mínimo 2 tendencias, mínimo 1 oportunidad
- Cada oportunidad debe tener un campaignBrief concreto y accionable
- Evalúa urgencia realísticamente
- Sugiere la línea de negocio más apropiada
- Escribe en español
`;
}

export const competitiveIntelAgent = new BaseAgent({
  role: "competitive-intel",
  label: "Competitive Intel",
  buildSystemPrompt: buildCompetitiveIntelSystemPrompt,
});
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/competitive-intel.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/agents/competitive-intel.ts backend/src/agents/competitive-intel.test.ts
git commit -m "feat: add Competitive Intel agent with query generation and report parsing"
```

---

### Task 4: Data Analyst Agent

**Files:**
- Create: `backend/src/agents/data-analyst.ts`
- Test: `backend/src/agents/data-analyst.test.ts`

- [ ] **Step 1: Write test**

```typescript
// backend/src/agents/data-analyst.test.ts
import { describe, it, expect } from "vitest";
import { dataAnalystAgent, parseDataAnalystOutput } from "./data-analyst.js";

describe("Data Analyst Agent", () => {
  it("has correct role", () => {
    expect(dataAnalystAgent.role).toBe("data-analyst");
  });

  it("parses valid analysis output", () => {
    const raw = `\`\`\`json
{
  "title": "Análisis Interno Marzo 2026",
  "summary": "El sistema ha generado 15 campañas...",
  "trends": [{"trend": "OPL domina en campañas", "evidence": "8 de 15 campañas", "relevance": "high", "source": "internal"}],
  "opportunities": [{"description": "AAS sin campañas recientes", "targetSegment": "Hoteles medianos", "suggestedLine": "AAS", "urgency": "short-term", "campaignBrief": "Campaña AAS para hoteles medianos que no conocen el modelo de renting"}]
}
\`\`\``;
    const result = parseDataAnalystOutput(raw);
    expect(result.title).toContain("Análisis Interno");
    expect(result.trends).toHaveLength(1);
    expect(result.opportunities).toHaveLength(1);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseDataAnalystOutput("not json")).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/data-analyst.test.ts
```

- [ ] **Step 3: Implement Data Analyst agent**

```typescript
// backend/src/agents/data-analyst.ts
import { BaseAgent } from "./base-agent.js";
import type { Trend, Opportunity } from "../../shared/types.js";

export interface DataAnalystOutput {
  title: string;
  summary: string;
  trends: Trend[];
  opportunities: Array<Omit<Opportunity, "id">>;
}

export function parseDataAnalystOutput(raw: string): DataAnalystOutput {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1]!.trim() : raw.trim();
  const parsed = JSON.parse(jsonStr);

  if (!parsed.title || !Array.isArray(parsed.trends)) {
    throw new Error("Data analyst output missing required fields: title, trends");
  }

  return {
    title: parsed.title,
    summary: parsed.summary || "",
    trends: parsed.trends,
    opportunities: (parsed.opportunities || []).map((o: Record<string, unknown>) => ({
      description: String(o.description || ""),
      targetSegment: String(o.targetSegment || ""),
      suggestedLine: String(o.suggestedLine || "OPL"),
      urgency: String(o.urgency || "short-term"),
      campaignBrief: String(o.campaignBrief || ""),
    })),
  };
}

function buildDataAnalystSystemPrompt(brandContext: string): string {
  return `Eres el Data Analyst del departamento de marketing de Lavanti (Hydrocare SAS).

Tu rol es analizar los datos internos del Marketing Command Center y generar insights accionables.

## DATOS QUE RECIBIRÁS:
- Número de campañas creadas por línea de negocio
- Número de piezas de contenido generadas
- Brand scores promedio
- Canales más utilizados
- Líneas de negocio con más/menos actividad

## TU ANÁLISIS DEBE:
1. Identificar tendencias internas (qué líneas están activas, cuáles dormidas)
2. Detectar oportunidades (líneas sin campañas recientes, canales subutilizados)
3. Sugerir campañas concretas basadas en los gaps encontrados

## CONTEXTO DE MARCA:
${brandContext}

## FORMATO DE RESPUESTA:
\`\`\`json
{
  "title": "Título del análisis",
  "summary": "Resumen ejecutivo",
  "trends": [
    { "trend": "Tendencia detectada", "evidence": "Datos que la soportan", "relevance": "high|medium|low", "source": "internal" }
  ],
  "opportunities": [
    { "description": "Oportunidad detectada", "targetSegment": "Segmento", "suggestedLine": "OPL|AAS|MH|Volta", "urgency": "immediate|short-term|long-term", "campaignBrief": "Brief para crear campaña" }
  ]
}
\`\`\`

REGLAS:
- Basa tus insights SOLO en los datos proporcionados
- Cada oportunidad debe tener un campaignBrief concreto
- Escribe en español
`;
}

export const dataAnalystAgent = new BaseAgent({
  role: "data-analyst",
  label: "Data Analyst",
  buildSystemPrompt: buildDataAnalystSystemPrompt,
});
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/data-analyst.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/agents/data-analyst.ts backend/src/agents/data-analyst.test.ts
git commit -m "feat: add Data Analyst agent with internal analysis and opportunity detection"
```

---

### Task 5: Intel Orchestrator

**Files:**
- Create: `backend/src/agents/intel-orchestrator.ts`
- Test: `backend/src/agents/intel-orchestrator.test.ts`

- [ ] **Step 1: Write test**

```typescript
// backend/src/agents/intel-orchestrator.test.ts
import { describe, it, expect, vi } from "vitest";
import { runMarketResearch, runInternalAnalysis } from "./intel-orchestrator.js";
import type { IntelCallbacks } from "../../shared/types.js";

vi.mock("./competitive-intel.js", () => ({
  competitiveIntelAgent: {
    run: vi.fn()
      .mockResolvedValueOnce({ role: "competitive-intel", content: '```json\n{"queries":["test query 1","test query 2"]}\n```' })
      .mockResolvedValueOnce({ role: "competitive-intel", content: '```json\n{"title":"Test Report","summary":"Summary","trends":[{"trend":"T1","evidence":"E1","relevance":"high","source":"https://example.com"}],"opportunities":[{"description":"Opp1","targetSegment":"Seg1","suggestedLine":"OPL","urgency":"immediate","campaignBrief":"Brief1"}],"sources":[{"title":"S1","url":"https://example.com","snippet":"Snippet"}]}\n```' }),
  },
  parseQueryGenOutput: vi.fn().mockReturnValue({ queries: ["test query 1", "test query 2"] }),
  parseIntelReportOutput: vi.fn().mockReturnValue({
    title: "Test Report", summary: "Summary",
    trends: [{ trend: "T1", evidence: "E1", relevance: "high", source: "https://example.com" }],
    opportunities: [{ description: "Opp1", targetSegment: "Seg1", suggestedLine: "OPL", urgency: "immediate", campaignBrief: "Brief1" }],
    sources: [{ title: "S1", url: "https://example.com", snippet: "Snippet" }],
  }),
}));

vi.mock("../search/tavily.js", () => ({
  tavilySearchMultiple: vi.fn().mockResolvedValue([
    { title: "Result 1", url: "https://example.com/1", content: "Content 1" },
  ]),
}));

vi.mock("./data-analyst.js", () => ({
  dataAnalystAgent: {
    run: vi.fn().mockResolvedValue({ role: "data-analyst", content: '```json\n{"title":"Internal Report","summary":"Summary","trends":[],"opportunities":[]}\n```' }),
  },
  parseDataAnalystOutput: vi.fn().mockReturnValue({ title: "Internal Report", summary: "Summary", trends: [], opportunities: [] }),
}));

describe("Intel Orchestrator", () => {
  it("runMarketResearch produces a complete report", async () => {
    const callbacks: IntelCallbacks = {
      onSearchStarted: vi.fn(),
      onSearchCompleted: vi.fn(),
      onAnalysisStarted: vi.fn(),
      onReportReady: vi.fn(),
    };

    const report = await runMarketResearch("mercado hotelero", "OPL", callbacks);
    expect(report.type).toBe("market-research");
    expect(report.title).toBe("Test Report");
    expect(report.status).toBe("ready");
    expect(report.trends).toHaveLength(1);
    expect(report.opportunities).toHaveLength(1);
    expect(report.opportunities[0].id).toBeDefined();
    expect(callbacks.onSearchStarted).toHaveBeenCalled();
    expect(callbacks.onReportReady).toHaveBeenCalled();
  });

  it("runInternalAnalysis produces a report", async () => {
    const report = await runInternalAnalysis({ campaignCount: 5, contentCount: 20 });
    expect(report.type).toBe("internal-analysis");
    expect(report.status).toBe("ready");
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/intel-orchestrator.test.ts
```

- [ ] **Step 3: Implement intel orchestrator**

```typescript
// backend/src/agents/intel-orchestrator.ts
import { randomUUID } from "crypto";
import type { IntelReport, IntelCallbacks, BusinessLine } from "../../shared/types.js";
import { competitiveIntelAgent, parseQueryGenOutput, parseIntelReportOutput } from "./competitive-intel.js";
import { dataAnalystAgent, parseDataAnalystOutput } from "./data-analyst.js";
import { tavilySearchMultiple } from "../search/tavily.js";

export async function runMarketResearch(
  query: string,
  line?: BusinessLine,
  callbacks?: IntelCallbacks
): Promise<IntelReport> {
  const brandLine = line ?? "OPL";

  // Step 1: Generate search queries
  const queryGenResult = await competitiveIntelAgent.run({
    line: brandLine,
    userMessage: `Genera 3-5 queries de búsqueda web para investigar: "${query}"${line ? ` (enfocado en línea ${line})` : ""}.\n\nResponde con el formato de queries.`,
  });

  const { queries } = parseQueryGenOutput(queryGenResult.content);
  callbacks?.onSearchStarted?.(queries);

  // Step 2: Search web via Tavily
  const searchResults = await tavilySearchMultiple(queries, 5);
  callbacks?.onSearchCompleted?.(searchResults.length);

  // Step 3: Analyze results
  callbacks?.onAnalysisStarted?.();

  const searchContext = searchResults
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
    .join("\n\n---\n\n");

  const analysisResult = await competitiveIntelAgent.run({
    line: brandLine,
    userMessage: `Analiza estos resultados de búsqueda y genera un reporte de mercado sobre: "${query}".\n\nRESULTADOS DE BÚSQUEDA:\n${searchContext}\n\nResponde con el formato de reporte completo.`,
  });

  const parsed = parseIntelReportOutput(analysisResult.content);

  const report: IntelReport = {
    id: randomUUID(),
    type: "market-research",
    title: parsed.title,
    summary: parsed.summary,
    line,
    query,
    trends: parsed.trends,
    opportunities: parsed.opportunities.map((o) => ({ ...o, id: randomUUID() })),
    sources: parsed.sources,
    status: "ready",
    createdAt: new Date().toISOString(),
  };

  callbacks?.onReportReady?.(report);
  return report;
}

export async function runInternalAnalysis(
  systemData: Record<string, unknown>,
  callbacks?: IntelCallbacks
): Promise<IntelReport> {
  callbacks?.onAnalysisStarted?.();

  const dataContext = Object.entries(systemData)
    .map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`)
    .join("\n");

  const result = await dataAnalystAgent.run({
    line: "OPL",
    userMessage: `Analiza los datos internos del Marketing Command Center y genera un reporte con insights y oportunidades.\n\nDATOS DEL SISTEMA:\n${dataContext}`,
  });

  const parsed = parseDataAnalystOutput(result.content);

  const report: IntelReport = {
    id: randomUUID(),
    type: "internal-analysis",
    title: parsed.title,
    summary: parsed.summary,
    query: "internal-analysis",
    trends: parsed.trends,
    opportunities: parsed.opportunities.map((o) => ({ ...o, id: randomUUID() })),
    sources: [],
    status: "ready",
    createdAt: new Date().toISOString(),
  };

  callbacks?.onReportReady?.(report);
  return report;
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run backend/src/agents/intel-orchestrator.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/agents/intel-orchestrator.ts backend/src/agents/intel-orchestrator.test.ts
git commit -m "feat: add intel orchestrator with market research and internal analysis flows"
```

---

### Task 6: Intel API Routes

**Files:**
- Create: `backend/src/routes/intel.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Create intel routes**

```typescript
// backend/src/routes/intel.ts
import { Router } from "express";
import type { IntelReport, CreateResearchRequest, BusinessLine } from "../../shared/types.js";
import { runMarketResearch, runInternalAnalysis } from "../agents/intel-orchestrator.js";

const router = Router();
const intelStore: Map<string, IntelReport> = new Map();

// POST /research — Market research on-demand
router.post("/research", async (req, res) => {
  req.setTimeout(300000);
  const { query, line } = req.body as CreateResearchRequest;
  if (!query) { res.status(400).json({ error: "Missing required field: query" }); return; }

  try {
    console.log(`[intel] Starting market research: "${query}" (line: ${line || "all"})`);
    const report = await runMarketResearch(query, line as BusinessLine | undefined);
    intelStore.set(report.id, report);
    console.log(`[intel] Research complete: ${report.trends.length} trends, ${report.opportunities.length} opportunities`);
    res.json(report);
  } catch (error) {
    console.error("[intel] Research error:", error);
    res.status(500).json({ error: "Failed to complete market research" });
  }
});

// POST /internal-analysis — Internal analysis
router.post("/internal-analysis", async (req, res) => {
  req.setTimeout(300000);
  try {
    // Aggregate system data — for MVP, pass basic counts
    // In the future this would query the actual stores
    const systemData = {
      note: "In-memory MVP — aggregate data from campaign and content stores when available",
      timestamp: new Date().toISOString(),
    };

    const report = await runInternalAnalysis(systemData);
    intelStore.set(report.id, report);
    res.json(report);
  } catch (error) {
    console.error("[intel] Internal analysis error:", error);
    res.status(500).json({ error: "Failed to complete internal analysis" });
  }
});

// GET /reports — List reports
router.get("/reports", (req, res) => {
  let reports = Array.from(intelStore.values());
  const { type, line, status } = req.query;
  if (type) reports = reports.filter((r) => r.type === type);
  if (line) reports = reports.filter((r) => r.line === line);
  if (status) reports = reports.filter((r) => r.status === status);
  reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(reports);
});

// GET /reports/:id — Report detail
router.get("/reports/:id", (req, res) => {
  const report = intelStore.get(req.params.id);
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }
  res.json(report);
});

// POST /reports/:id/create-campaign — Create campaign from opportunity
router.post("/reports/:id/create-campaign", async (req, res) => {
  req.setTimeout(300000);
  const report = intelStore.get(req.params.id);
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }

  const { opportunityId } = req.body;
  const opportunity = report.opportunities.find((o) => o.id === opportunityId);
  if (!opportunity) { res.status(404).json({ error: "Opportunity not found" }); return; }
  if (opportunity.campaignId) { res.status(400).json({ error: "Campaign already created for this opportunity" }); return; }

  try {
    const port = process.env.PORT || 3001;
    const baseUrl = `http://localhost:${port}/api`;

    // Create campaign
    const createRes = await fetch(`${baseUrl}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brief: opportunity.campaignBrief,
        line: opportunity.suggestedLine,
        audience: opportunity.targetSegment,
        objective: opportunity.description,
      }),
    });
    const campaign = await createRes.json();

    // Analyze campaign
    const analyzeRes = await fetch(`${baseUrl}/campaigns/${campaign.id}/analyze`, { method: "POST" });
    const analyzed = await analyzeRes.json();

    // Link opportunity to campaign
    opportunity.campaignId = analyzed.id;
    intelStore.set(report.id, report);

    res.json(analyzed);
  } catch (error) {
    console.error("[intel] Create campaign error:", error);
    res.status(500).json({ error: "Failed to create campaign from opportunity" });
  }
});

// PUT /reports/:id/archive — Archive report
router.put("/reports/:id/archive", (req, res) => {
  const report = intelStore.get(req.params.id);
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }
  report.status = "archived";
  intelStore.set(report.id, report);
  res.json(report);
});

// POST /monthly — Run monthly analysis for all lines
router.post("/monthly", async (req, res) => {
  req.setTimeout(600000);
  const monthlyQueries: Record<string, string> = {
    OPL: "tendencias lavandería hotelera Colombia equipos industriales",
    AAS: "renting equipos industriales Colombia tendencias outsourcing",
    MH: "lavanderías compartidas residenciales Colombia tendencias",
    Volta: "lavanderías autoservicio Colombia negocios rentables",
  };

  try {
    const reports: IntelReport[] = [];
    for (const [line, query] of Object.entries(monthlyQueries)) {
      console.log(`[intel/monthly] Running research for ${line}...`);
      const report = await runMarketResearch(query, line as BusinessLine);
      intelStore.set(report.id, report);
      reports.push(report);
    }

    // Internal analysis
    const internal = await runInternalAnalysis({ timestamp: new Date().toISOString() });
    intelStore.set(internal.id, internal);
    reports.push(internal);

    res.json(reports);
  } catch (error) {
    console.error("[intel/monthly] Error:", error);
    res.status(500).json({ error: "Failed to complete monthly analysis" });
  }
});

export { router as intelRouter };
```

- [ ] **Step 2: Mount in index.ts**

Add to `backend/src/index.ts`:
```typescript
import { intelRouter } from "./routes/intel.js";
app.use("/api/intel", intelRouter);
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/intel.ts backend/src/index.ts
git commit -m "feat: add intel API routes — research, internal analysis, create-campaign, monthly"
```

---

### Task 7: Intel API Client (Frontend)

**Files:**
- Create: `frontend/src/lib/intel-api.ts`

- [ ] **Step 1: Create API client**

```typescript
// frontend/src/lib/intel-api.ts
const BASE = "/api/intel";

export interface IntelReport {
  id: string;
  type: string;
  title: string;
  summary: string;
  line?: string;
  query: string;
  trends: Array<{ trend: string; evidence: string; relevance: string; source: string }>;
  opportunities: Array<{
    id: string; description: string; targetSegment: string;
    suggestedLine: string; urgency: string; campaignBrief: string; campaignId?: string;
  }>;
  sources: Array<{ title: string; url: string; snippet: string }>;
  errorMessage?: string;
  status: string;
  createdAt: string;
}

async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error: ${res.status}`);
  }
  return res.json();
}

export const intelApi = {
  research: (query: string, line?: string) =>
    apiCall<IntelReport>(`${BASE}/research`, { method: "POST", body: JSON.stringify({ query, line }) }),
  internalAnalysis: () =>
    apiCall<IntelReport>(`${BASE}/internal-analysis`, { method: "POST" }),
  listReports: (filters?: { type?: string; line?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.set("type", filters.type);
    if (filters?.line) params.set("line", filters.line);
    if (filters?.status) params.set("status", filters.status);
    const qs = params.toString();
    return apiCall<IntelReport[]>(`${BASE}/reports${qs ? `?${qs}` : ""}`);
  },
  getReport: (id: string) => apiCall<IntelReport>(`${BASE}/reports/${id}`),
  createCampaign: (reportId: string, opportunityId: string) =>
    apiCall<unknown>(`${BASE}/reports/${reportId}/create-campaign`, {
      method: "POST", body: JSON.stringify({ opportunityId }),
    }),
  archiveReport: (id: string) =>
    apiCall<IntelReport>(`${BASE}/reports/${id}/archive`, { method: "PUT" }),
  monthly: () => apiCall<IntelReport[]>(`${BASE}/monthly`, { method: "POST" }),
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/intel-api.ts
git commit -m "feat: add intel API client"
```

---

### Task 8: Intel Zustand Store

**Files:**
- Create: `frontend/src/store/intel.ts`

- [ ] **Step 1: Create store**

```typescript
// frontend/src/store/intel.ts
import { create } from "zustand";
import { intelApi } from "../lib/intel-api";
import type { IntelReport } from "../lib/intel-api";
import { useActivityStore } from "./activity";

interface IntelStore {
  reports: IntelReport[];
  isLoading: boolean;
  error: string | null;
  fetchReports: () => Promise<void>;
  runResearch: (query: string, line?: string) => Promise<void>;
  runInternalAnalysis: () => Promise<void>;
  createCampaignFromOpportunity: (reportId: string, opportunityId: string) => Promise<void>;
  archiveReport: (reportId: string) => Promise<void>;
}

export const useIntelStore = create<IntelStore>((set) => ({
  reports: [],
  isLoading: false,
  error: null,

  fetchReports: async () => {
    const reports = await intelApi.listReports();
    set({ reports });
  },

  runResearch: async (query, line) => {
    const addActivity = useActivityStore.getState().addActivity;
    set({ isLoading: true, error: null });
    addActivity("working", `Investigando: "${query}"...`);
    try {
      const report = await intelApi.research(query, line);
      set((state) => ({ reports: [report, ...state.reports], isLoading: false }));
      addActivity("success", `Reporte generado: ${report.title} — ${report.opportunities.length} oportunidades`);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
      addActivity("error", `Error en investigación: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  runInternalAnalysis: async () => {
    const addActivity = useActivityStore.getState().addActivity;
    set({ isLoading: true, error: null });
    addActivity("working", "Analizando datos internos...");
    try {
      const report = await intelApi.internalAnalysis();
      set((state) => ({ reports: [report, ...state.reports], isLoading: false }));
      addActivity("success", `Análisis interno completado: ${report.opportunities.length} oportunidades`);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
      addActivity("error", `Error en análisis: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  createCampaignFromOpportunity: async (reportId, opportunityId) => {
    const addActivity = useActivityStore.getState().addActivity;
    try {
      await intelApi.createCampaign(reportId, opportunityId);
      // Refresh reports to show linked campaign
      const reports = await intelApi.listReports();
      set({ reports });
      addActivity("success", "Campaña creada desde oportunidad de inteligencia");
    } catch (err) {
      addActivity("error", `Error creando campaña: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  archiveReport: async (reportId) => {
    await intelApi.archiveReport(reportId);
    const reports = await intelApi.listReports();
    set({ reports });
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/store/intel.ts
git commit -m "feat: add intel Zustand store with research, analysis, and campaign creation"
```

---

### Task 9: Intel UI — ResearchBar + ReportCard

**Files:**
- Create: `frontend/src/components/Intel/ResearchBar.tsx`
- Create: `frontend/src/components/Intel/ReportCard.tsx`

- [ ] **Step 1: Create ResearchBar**

```tsx
// frontend/src/components/Intel/ResearchBar.tsx
import { useState } from "react";

interface ResearchBarProps {
  onResearch: (query: string, line?: string) => void;
  onInternalAnalysis: () => void;
  isLoading: boolean;
}

const LINES = [
  { value: "", label: "Todas las líneas" },
  { value: "OPL", label: "OPL" },
  { value: "AAS", label: "AAS" },
  { value: "MH", label: "Multihousing" },
  { value: "Volta", label: "Volta" },
];

export function ResearchBar({ onResearch, onInternalAnalysis, isLoading }: ResearchBarProps) {
  const [query, setQuery] = useState("");
  const [line, setLine] = useState("");

  return (
    <div className="bg-white border rounded-xl p-5 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-near-black">Investigación de Mercado</h2>
        <p className="text-sm text-gray-500 mt-1">Busca tendencias, oportunidades y genera campañas desde insights</p>
      </div>
      <div className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿Qué quieres investigar? Ej: mercado hotelero Costa Caribe"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === "Enter" && query.trim() && onResearch(query, line || undefined)}
        />
        <select
          value={line}
          onChange={(e) => setLine(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {LINES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <button
          onClick={() => query.trim() && onResearch(query, line || undefined)}
          disabled={!query.trim() || isLoading}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? "Investigando..." : "Investigar"}
        </button>
      </div>
      <button
        onClick={onInternalAnalysis}
        disabled={isLoading}
        className="text-sm text-gray-500 hover:text-blue-500 font-medium"
      >
        Análisis Interno del Sistema
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create ReportCard**

```tsx
// frontend/src/components/Intel/ReportCard.tsx
import { useState } from "react";

interface ReportCardProps {
  report: {
    id: string; type: string; title: string; summary: string; line?: string;
    trends: Array<{ trend: string; evidence: string; relevance: string; source: string }>;
    opportunities: Array<{ id: string; description: string; targetSegment: string; suggestedLine: string; urgency: string; campaignBrief: string; campaignId?: string }>;
    sources: Array<{ title: string; url: string; snippet: string }>;
    status: string; createdAt: string;
  };
  onCreateCampaign: (reportId: string, opportunityId: string) => void;
  onArchive: (reportId: string) => void;
}

const RELEVANCE_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

const URGENCY_COLORS: Record<string, string> = {
  immediate: "bg-red-100 text-red-700",
  "short-term": "bg-orange-100 text-orange-700",
  "long-term": "bg-blue-100 text-blue-700",
};

export function ReportCard({ report, onCreateCampaign, onArchive }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-bold text-near-black truncate">{report.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              report.type === "market-research" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
            }`}>
              {report.type === "market-research" ? "Mercado" : "Interno"}
            </span>
            {report.line && <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{report.line}</span>}
          </div>
          <div className="flex gap-4 text-xs text-gray-400">
            <span>{report.trends.length} tendencias</span>
            <span>{report.opportunities.length} oportunidades</span>
            <span>{new Date(report.createdAt).toLocaleDateString("es-CO")}</span>
          </div>
        </div>
        <span className="text-gray-400 ml-4">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t px-5 py-4 space-y-5">
          {/* Summary */}
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.summary}</p>

          {/* Trends */}
          {report.trends.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-near-black mb-2">Tendencias</h4>
              <div className="space-y-2">
                {report.trends.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium mt-0.5 ${RELEVANCE_COLORS[t.relevance] || RELEVANCE_COLORS.low}`}>
                      {t.relevance}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-near-black">{t.trend}</div>
                      <div className="text-xs text-gray-500 mt-1">{t.evidence}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {report.opportunities.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-near-black mb-2">Oportunidades</h4>
              <div className="space-y-3">
                {report.opportunities.map((opp) => (
                  <div key={opp.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-near-black">{opp.description}</div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{opp.suggestedLine}</span>
                          <span className="text-xs text-gray-500">{opp.targetSegment}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${URGENCY_COLORS[opp.urgency] || ""}`}>
                            {opp.urgency}
                          </span>
                        </div>
                      </div>
                      {opp.campaignId ? (
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded font-medium">Campaña creada</span>
                      ) : (
                        <button
                          onClick={() => onCreateCampaign(report.id, opp.id)}
                          className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded font-semibold hover:bg-blue-600"
                        >
                          Crear Campaña
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-2 bg-gray-50 rounded p-2">
                      <span className="font-medium">Brief: </span>{opp.campaignBrief}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {report.sources.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-near-black mb-2">Fuentes</h4>
              <div className="space-y-2">
                {report.sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="block bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <div className="text-sm font-medium text-blue-600">{s.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.snippet}</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            <button
              onClick={() => onArchive(report.id)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Archivar reporte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Intel/
git commit -m "feat: add ResearchBar and ReportCard components for intelligence view"
```

---

### Task 10: Intel View + Wire into App

**Files:**
- Create: `frontend/src/components/Intel/IntelView.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Layout.tsx`
- Modify: `frontend/src/components/Dashboard/Dashboard.tsx`

- [ ] **Step 1: Create IntelView**

```tsx
// frontend/src/components/Intel/IntelView.tsx
import { useEffect } from "react";
import { useIntelStore } from "../../store/intel";
import { ResearchBar } from "./ResearchBar";
import { ReportCard } from "./ReportCard";

export function IntelView() {
  const { reports, isLoading, error, fetchReports, runResearch, runInternalAnalysis, createCampaignFromOpportunity, archiveReport } = useIntelStore();

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const activeReports = reports.filter((r) => r.status !== "archived");

  return (
    <div className="space-y-6">
      <ResearchBar onResearch={runResearch} onInternalAnalysis={runInternalAnalysis} isLoading={isLoading} />

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {activeReports.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-near-black">Reportes</h2>
          {activeReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onCreateCampaign={createCampaignFromOpportunity}
              onArchive={archiveReport}
            />
          ))}
        </div>
      ) : !isLoading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🔍</div>
          <p>No hay reportes aún. Haz una investigación para empezar.</p>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Add "Inteligencia" tab to Layout.tsx**

Add `"intel"` to the `ViewType` type and `NAV_ITEMS` array:
```typescript
export type ViewType = "dashboard" | "calendar" | "content" | "campaigns" | "intel";

{ view: "intel", label: "Inteligencia" },
```

- [ ] **Step 3: Wire IntelView into App.tsx**

Add import and view:
```typescript
import { IntelView } from "./components/Intel/IntelView";

{currentView === "intel" && <IntelView />}
```

- [ ] **Step 4: Add opportunities stat to Dashboard**

In Dashboard.tsx, add or update a StatCard to show opportunities. For MVP, a static card that links to the intel tab:
```tsx
<StatCard label="Inteligencia" value="🔍" icon="📊" />
```

- [ ] **Step 5: Verify frontend compiles**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools/frontend && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Intel/ frontend/src/App.tsx frontend/src/components/Layout.tsx frontend/src/components/Dashboard/Dashboard.tsx
git commit -m "feat: add IntelView with research bar and report list — wire into app with Inteligencia tab"
```

---

### Task 11: Integration Test & Polish

**Files:** All

- [ ] **Step 1: Run all backend tests**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools && npx vitest run
```

- [ ] **Step 2: Verify frontend compiles**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools/frontend && npx tsc --noEmit
```

- [ ] **Step 3: Test API manually**

```bash
curl -s -X POST http://localhost:3001/api/intel/research \
  -H "Content-Type: application/json" \
  -d '{"query":"mercado hotelero Colombia","line":"OPL"}' | head -c 500
```

- [ ] **Step 4: Fix any issues**

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Phase 4 Intelligence — integration polish and fixes"
```

---

## Deferred Scope

- **Automated monthly cron:** The `/api/intel/monthly` endpoint exists but runs manually. Automate with node-cron or external scheduler later.
- **Real internal data aggregation:** Currently passes minimal system data to Data Analyst. When campaign/content stores are persistent (PostgreSQL), aggregate real metrics.
- **Dashboard opportunities counter:** Requires cross-store query. For MVP, a static link to Intel tab.
