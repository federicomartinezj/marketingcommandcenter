# Phase 4: Intelligence — Design Spec

**Date:** 2026-03-24
**Status:** Draft
**Goal:** Add market research and internal analysis capabilities so the marketing director can discover trends, detect opportunities, and create campaigns directly from insights — powered by web search and AI analysis.

---

## Context

Lavanti's Marketing Command Center can now create individual content (Phase 1-2) and full campaigns (Phase 3). Phase 4 adds the intelligence layer: the system proactively researches the market, analyzes internal data, and surfaces actionable opportunities that connect directly to campaign creation.

### Example Flow

> Director asks: "Investiga el mercado hotelero de la Costa Caribe para OPL"
>
> System searches the web for hotel trends in Colombia's Caribbean coast, crosses findings with Lavanti's brand knowledge, and produces a report with 4 opportunities — each with a ready-to-use campaign brief. Director clicks "Crear Campaña" on the best opportunity and the system launches the Phase 3 campaign wizard with the brief pre-filled.

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Focus | Market research + opportunity reports | Director needs external intelligence to drive campaigns |
| Data sources | Internal knowledge + web search (Tavily API) | Cross-referencing gives richer insights |
| Output | Report + campaign suggestions with direct action | Intelligence must convert to action, not just reading |
| Frequency | On-demand + monthly manual (automate later) | Start simple, add cron when proven |
| Web search provider | Tavily API (free tier: 1,000/month) | Simple API, designed for AI agents, generous free tier |
| Agents | Competitive Intel + Data Analyst | Business Analyst deferred to Phase 5 (needs conversion data) |

---

## Data Model

### IntelReport

```typescript
type IntelReportType = "market-research" | "internal-analysis";
type IntelReportStatus = "generating" | "ready" | "archived";

interface IntelReport {
  id: string;
  type: IntelReportType;
  title: string;
  summary: string;
  line?: BusinessLine;
  query: string;
  trends: Trend[];
  opportunities: Opportunity[];
  sources: Source[];
  status: IntelReportStatus;
  createdAt: string;
}
```

### Trend

```typescript
type TrendRelevance = "high" | "medium" | "low";

interface Trend {
  trend: string;                    // "Crecimiento del turismo médico en Medellín"
  evidence: string;                 // Supporting data
  relevance: TrendRelevance;
  source: string;                   // URL or reference
}
```

### Opportunity

```typescript
type OpportunityUrgency = "immediate" | "short-term" | "long-term";

interface Opportunity {
  id: string;
  description: string;              // "Hoteles de turismo médico necesitan lavandería certificada"
  targetSegment: string;            // "Hoteles de salud 50-150 habitaciones"
  suggestedLine: BusinessLine;
  urgency: OpportunityUrgency;
  campaignBrief: string;            // Ready-to-use brief for campaign creation
  campaignId?: string;              // Filled when user creates campaign from this opportunity
}
```

### Source

```typescript
interface Source {
  title: string;
  url: string;
  snippet: string;
}
```

### Report Status Flow

```
generating → ready → archived
```

---

## New Agents

### Competitive Intel Agent

- **Role:** Market researcher. Generates smart search queries, processes web results, crosses with brand knowledge, produces structured report.
- **When:** On-demand research requests and monthly analysis.
- **Input:** Research topic/query + optional business line + brand context
- **Process:**
  1. Generates 3-5 targeted search queries from the research topic
  2. Backend executes queries via Tavily API (in parallel)
  3. Agent receives aggregated search results + brand knowledge
  4. Produces structured IntelReport JSON
- **Output format:** JSON parsed into IntelReport fields:
  ```typescript
  {
    title: string,
    summary: string,
    trends: Trend[],
    opportunities: Opportunity[],  // Each with campaignBrief
    sources: Source[]
  }
  ```
- **Brand context:** Loaded via `loadAllBrandContext(line)` like existing agents.
- **Parsing:** Orchestrator parses JSON from `AgentOutput.content`. If parsing fails, report status stays `generating` and error is surfaced.

### Data Analyst Agent

- **Role:** Analyzes internal Command Center data — campaigns created, content pieces, brand scores, channel usage, line activity — and generates insights.
- **When:** On-demand internal analysis requests.
- **Input:** Aggregated system data (campaign count, content count, brand scores, etc.) + brand context
- **Output format:** JSON parsed into IntelReport fields:
  ```typescript
  {
    title: string,
    summary: string,
    trends: Trend[],               // Internal trends (e.g., "OPL campaigns outperform AAS")
    opportunities: Opportunity[],   // Suggested campaigns based on gaps
    sources: []                     // Empty for internal analysis
  }
  ```

---

## Web Search Integration

### Tavily API

- **Endpoint:** `POST https://api.tavily.com/search`
- **Auth:** API key via `TAVILY_API_KEY` env var
- **Free tier:** 1,000 searches/month
- **Integration wrapper:**

```typescript
interface TavilySearchResult {
  title: string;
  url: string;
  content: string;    // Long snippet, ideal for Claude analysis
}

interface TavilyClient {
  search(query: string, maxResults?: number): Promise<TavilySearchResult[]>;
}
```

### Query Generation Flow

The Competitive Intel Agent generates 3-5 specific queries from a broad research topic. Example for "mercado hotelero Costa Caribe":
1. "nuevos hoteles Cartagena Santa Marta 2026"
2. "inversión hotelera Colombia Caribe tendencias"
3. "lavandería industrial hoteles Colombia"

Queries are executed in parallel via `Promise.all`. Results are deduplicated and consolidated before passing to Claude for analysis.

---

## API Routes

```
POST   /api/intel/research                        # Market research on-demand
GET    /api/intel/reports                          # List reports (filter: type, line, status)
GET    /api/intel/reports/:id                      # Report detail
POST   /api/intel/reports/:id/create-campaign      # Create campaign from opportunity
PUT    /api/intel/reports/:id/archive              # Archive report
POST   /api/intel/internal-analysis                # Internal analysis (Data Analyst)
POST   /api/intel/monthly                          # Run monthly analysis for all lines
```

### Flow: Market Research

1. `POST /intel/research` with `{ query: "mercado hotelero Costa Caribe", line: "OPL" }`
2. Competitive Intel Agent generates 3-5 search queries
3. Backend executes queries via Tavily API in parallel
4. Competitive Intel Agent analyzes results + brand knowledge → produces IntelReport
5. Report saved with status `ready`, returned to client

### Flow: Internal Analysis

1. `POST /intel/internal-analysis`
2. Backend aggregates system data (campaigns, content, activity from in-memory stores)
3. Data Analyst Agent analyzes data + brand context → produces IntelReport
4. Report saved with status `ready`, returned to client

### Flow: Create Campaign from Opportunity

1. `POST /intel/reports/:id/create-campaign` with `{ opportunityId: "..." }`
2. Finds opportunity's `campaignBrief` and `suggestedLine`
3. Creates campaign via existing campaign creation flow (POST /campaigns + POST /campaigns/:id/analyze)
4. Sets `opportunity.campaignId` on the report
5. Returns the created campaign

### Flow: Monthly Analysis

1. `POST /intel/monthly`
2. Runs market research for each business line with predefined queries:
   - OPL: "tendencias lavandería hotelera Colombia equipos industriales"
   - AAS: "renting equipos industriales Colombia tendencias outsourcing"
   - MH: "lavanderías compartidas residenciales Colombia tendencias"
   - Volta: "lavanderías autoservicio Colombia negocios rentables"
3. Also runs one internal analysis
4. Returns array of generated reports

### Storage

In-memory Map (consistent with existing MVP pattern). Reports stored in `intelStore: Map<string, IntelReport>`.

---

## UI

### New Tab: "Inteligencia"

Added to Layout navigation alongside Dashboard, Calendario, Contenido, Campañas.

### IntelView Component

**Section 1 — Research Bar (top)**
- Large input: "¿Qué quieres investigar?"
- Optional business line selector
- "Investigar" button → triggers POST /intel/research
- "Análisis Interno" secondary button → triggers POST /intel/internal-analysis
- Loading state while generating

**Section 2 — Reports List (expandable, same pattern as CampaignList)**
- Each report card shows: title, type badge (market/internal), date, # of opportunities
- Expand to see:
  - Summary text
  - Trends with relevance indicator (high=red, medium=yellow, low=gray)
  - Opportunities list — each with description, target segment, urgency badge, suggested line
  - **"Crear Campaña" button** per opportunity → calls create-campaign endpoint, then opens campaign in Campañas tab
  - "Campaña creada" badge if opportunity already has a linked campaign
  - Sources section with clickable links

**Section 3 — Actions per report**
- "Archivar" button to hide old reports

### Dashboard Integration

- Update StatCard "Campañas Activas" or add new card: "Oportunidades Detectadas" showing count of unactioned opportunities across all ready reports
- Activity feed shows new reports: "Reporte de mercado generado: Costa Caribe — 4 oportunidades detectadas"

---

## Orchestration

### Intel Orchestrator

New file: `backend/src/agents/intel-orchestrator.ts`

Two main functions:

**`runMarketResearch(query, line?, callbacks?)`**
1. Call Competitive Intel Agent to generate search queries
2. Execute queries via Tavily API in parallel
3. Call Competitive Intel Agent with search results + brand context
4. Parse output into IntelReport
5. Return report

**`runInternalAnalysis(callbacks?)`**
1. Aggregate data from campaign store and content store
2. Call Data Analyst Agent with aggregated data + brand context
3. Parse output into IntelReport
4. Return report

### Callback Pattern

```typescript
interface IntelCallbacks {
  onSearchStarted?: (queries: string[]) => void;
  onSearchCompleted?: (resultCount: number) => void;
  onAnalysisStarted?: () => void;
  onReportReady?: (report: IntelReport) => void;
}
```
