# Phase 5: Optimization + Visual Director — Design Spec

**Date:** 2026-03-25
**Status:** Draft
**Goal:** Elevate the Designer to a Visual Director with campaign-level moodboards, add performance tracking with manual metrics input, and introduce a Business Analyst agent that learns what works from real campaign data.

---

## Context

Phases 1-4 built content creation, campaigns, and market intelligence. Phase 5 closes the loop: visual coherence across campaign pieces (Visual Director), measuring what works (performance tracking), and learning from results (Business Analyst). This turns the Command Center from a content generation tool into a learning marketing system.

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Visual Director | Upgrade Designer with moodboard phase — textual guide for agents + HTML preview for director | Campaign pieces must look like a visual family |
| Metrics input | Manual first, structure ready for Google Search Console + HubSpot APIs later | Works immediately with real data, no API complexity yet |
| A/B tracking | Director marks which variant was published + enters results | Simple, actionable, builds learning dataset |
| Business Analyst | Analyzes accumulated metrics, learns variant performance by line/channel | The most valuable long-term insight: what actually converts |
| Analytics UI | Inside Inteligencia tab as "Performance" report type | Keeps all analysis in one place |

---

## Visual Director (Moodboard Phase)

### New Campaign Pipeline Step

Pipeline phases are renumbered from 3 to 4 to accommodate the moodboard step. `CampaignCallbacks.onPhaseStarted` type changes from `(phase: 1 | 2 | 3)` to `(phase: 1 | 2 | 3 | 4)`.

```
Phase 1: Strategy (UX Strategist → concept + funnel)
Phase 2: Visual Direction (NEW — moodboard + visual guide)
Phase 3: Generation (pieces receive visual guide as context)
Phase 4: Brand Guardian review
```

### Design Choice: Moodboard Storage

The `Moodboard` is intentionally kept **separate** from the `Campaign` object, linked only by `campaignId`. This avoids bloating the Campaign interface and keeps the moodboard lifecycle independent (it can be regenerated without affecting campaign state). The moodboard gate is enforced at the frontend level — the "Generar Contenido" button only appears after the moodboard is approved.

### Moodboard Output

The Designer Agent receives a new call mode — "moodboard mode":

```typescript
interface Moodboard {
  id: string;
  campaignId: string;
  visualConcept: string;           // "Industrial dramático con toques de humanidad"
  photographyStyle: string;        // "Close-ups de manos trabajando, luz cálida lateral"
  colorEmphasis: string[];         // ["#0D86FF para datos", "#FF632C solo en CTAs"]
  typography: string;              // "Manrope 800 headlines, 300 cuerpo"
  mood: string;                    // "Profesional pero empático"
  imagePrompts: string[];          // 2-3 optimized English prompts for AI image generation
  htmlPreview: string;             // Visual moodboard HTML
  status: "generating" | "ready" | "approved";
  createdAt: string;
}
```

### How It Flows

1. After UX Strategist generates concept + funnel, campaign status becomes `planned`
2. Director clicks "Generar Moodboard" → Designer Agent runs in moodboard mode
3. Director sees HTML preview + visual guide → clicks "Aprobar Visual"
4. Moodboard status becomes `approved`, campaign can proceed to content generation
5. All content generation calls (Copywriter, Designer, Social Media Manager) receive the moodboard's visual guide as additional context in their prompts

### Visual Guide Injection

When generating content, each agent receives this additional context:

```
GUÍA VISUAL DE CAMPAÑA:
- Concepto visual: {visualConcept}
- Estilo fotográfico: {photographyStyle}
- Énfasis de color: {colorEmphasis}
- Tipografía: {typography}
- Mood: {mood}
```

This ensures all pieces share the same visual DNA.

---

## Performance Tracking

### CampaignMetrics Model

```typescript
interface CampaignMetrics {
  id: string;
  campaignId: string;
  channelId: string;                   // References ChannelPlan.id
  variantLabel: "A" | "B" | "C";
  platform: string;                    // Mirrors ChannelPlan.channel (ContentType) — redundant but useful for queries without joining
  metrics: PerformanceMetrics;
  notes?: string;
  reportedAt: string;
}

interface PerformanceMetrics {
  impressions?: number;
  clicks?: number;
  ctr?: number;
  leads?: number;
  conversions?: number;
  cost?: number;                     // COP investment
  openRate?: number;                 // Emails
  bounceRate?: number;               // Landing/blog
}
```

### Metrics Form Logic

Different channels show different metric fields:

| Channel Type | Fields Shown |
|-------------|-------------|
| facebook-ad, linkedin-post, instagram-post | impressions, clicks, ctr, leads, cost |
| email, email-sequence | impressions (sends), openRate, clicks, ctr, leads |
| blog-post | impressions (pageviews), bounceRate, leads |
| landing-page | impressions, clicks, ctr, conversions, bounceRate |
| whatsapp | impressions (sends), clicks (link clicks), leads |

### Where Metrics Appear

In CampaignList, when a campaign is `approved` or `exported`:
- Each channel shows "Reportar Resultados" button
- After reporting: shows metric summary inline (impressions, clicks, leads badges)
- Can update/re-report metrics

---

## Business Analyst Agent (Upgrade of Data Analyst)

### Relationship to Existing Data Analyst

The existing `data-analyst` agent (Phase 4) handles internal system analysis (content counts, brand scores). In Phase 5, we **upgrade it** — same agent role `"data-analyst"`, but with an expanded system prompt that adds performance analysis capabilities. No new agent role needed. The Data Analyst now has two modes:
- **Internal analysis** (existing) — system metrics, content gaps
- **Performance analysis** (new) — post-publication campaign metrics, variant effectiveness, channel ROI

### Role

Analyzes accumulated performance metrics from published campaigns. Identifies what works: which lines convert best, which variant angles (emotional/rational/social) perform better by channel, which channels give best ROI.

### Input

All reported CampaignMetrics + campaign context (line, audience, concept, variant labels)

### Output

```typescript
interface PerformanceReport {
  id: string;
  type: "performance";               // Stored as IntelReport with type "performance"
  title: string;
  summary: string;
  insights: PerformanceInsight[];
  linePerformance: LinePerformance[];
  variantAnalysis: VariantAnalysis[];
  recommendations: string[];
  createdAt: string;
}

interface PerformanceInsight {
  finding: string;
  recommendation: string;
  impact: "high" | "medium" | "low";
}

interface LinePerformance {
  line: BusinessLine;
  campaigns: number;
  avgCTR: number;
  totalLeads: number;
  topChannel: string;
}

interface VariantAnalysis {
  label: "A" | "B" | "C";
  angle: string;                       // "emocional", "racional", "social" — derived from prompt strategy, not hardcoded in type
  avgCTR: number;
  timesSelected: number;
  timesPublished: number;
}
```

### System Prompt Focus

The Business Analyst's key insight: over time it can say "for OPL, use emotional variant in email and rational in LinkedIn" — based on real Lavanti data. The prompt emphasizes:
- Pattern recognition across campaigns
- Variant performance comparison with statistical thinking
- Channel-line affinity detection
- ROI calculation when cost data is available
- Actionable recommendations (not just observations)

---

## API Routes

### Moodboard

```
POST   /api/campaigns/:id/moodboard           # Generate moodboard (Designer in moodboard mode)
GET    /api/campaigns/:id/moodboard            # Get moodboard for campaign
PUT    /api/campaigns/:id/moodboard/approve     # Approve moodboard
```

### Metrics

```
POST   /api/campaigns/:id/channels/:chId/metrics   # Report metrics for a channel
GET    /api/metrics                                  # All metrics (for Business Analyst)
GET    /api/metrics?campaignId=X                     # Metrics for a campaign
```

### Analytics

```
POST   /api/analytics/performance              # Run Business Analyst
GET    /api/analytics/reports                   # List performance reports
GET    /api/analytics/reports/:id               # Report detail
```

### Updated Campaign Flow

1. `POST /campaigns` → create draft
2. `POST /campaigns/:id/analyze` → UX Strategist (Phase 1)
3. `PUT /campaigns/:id/plan` → director adjusts
4. **`POST /campaigns/:id/moodboard`** → Designer moodboard mode (Phase 1.5)
5. **`PUT /campaigns/:id/moodboard/approve`** → director approves visual
6. `POST /campaigns/:id/generate` → content generation with visual guide (Phase 2)
7. Brand Guardian review (Phase 3)
8. Select variants → Approve → Export
9. **`POST /campaigns/:id/channels/:chId/metrics`** → report results after publishing
10. **`POST /api/analytics/performance`** → Business Analyst analyzes all metrics

### Storage

- `moodboardStore: Map<campaignId, Moodboard>`
- `metricsStore: Map<id, CampaignMetrics>`
- `analyticsStore: Map<id, PerformanceReport>` (own store — PerformanceReport has different fields from IntelReport, so reusing intelStore would break type safety)

---

## UI Changes

### Campaign Wizard — 5 Steps

```
Brief → Plan → Moodboard (NEW) → Generating → Review
```

**New Screen: Moodboard**
- Visual concept, photography style, mood, color emphasis displayed as styled cards
- HTML preview rendered (like social card preview)
- Image prompts listed with copy-to-clipboard
- "Aprobar Visual y Generar Contenido" button
- "Regenerar Moodboard" button if director doesn't like it

### CampaignList — Metrics Reporting

Campaigns with status `approved` or `exported` show per channel:
- "Reportar Resultados" button → inline form with relevant metrics fields
- After reporting: metric badges (impressions, clicks, leads) displayed inline
- Can re-report to update numbers

### Inteligencia Tab — Performance Analytics

Add to existing IntelView:
- "Analizar Performance" button next to "Análisis Interno"
- Performance reports appear in report list with type badge "Performance" (purple)
- Expanded report shows: insights with impact badges, line performance table, variant analysis chart (A vs B vs C)

### Zustand Store Updates

**useCampaignStore** — add:
```typescript
generateMoodboard: () => Promise<void>;
approveMoodboard: () => Promise<void>;
reportMetrics: (channelId: string, metrics: PerformanceMetrics, variantLabel: string, platform: string, notes?: string) => Promise<void>;
```

**useIntelStore** — add:
```typescript
runPerformanceAnalysis: () => Promise<void>;
```

---

## Shared Types Addition

Add to `shared/types.ts` under `// === Phase 5: Optimization Types ===`:

- `Moodboard`
- `CampaignMetrics`, `PerformanceMetrics`
- `PerformanceReport`, `PerformanceInsight`, `LinePerformance`, `VariantAnalysis`

`PerformanceReport` is a standalone type with its own store — NOT an extension of `IntelReport`. The Inteligencia UI renders both report types but from separate stores.

---

## Future: API Integrations (Not in this phase)

Structure is ready for:
- **Google Search Console API** — replace manual blog metrics with real pageviews, impressions, keyword rankings
- **HubSpot API** — replace manual lead counts with real contact/deal data linked to campaigns
- **Meta Ads API** — replace manual Facebook/Instagram metrics with real ad performance

Each integration would be a module in `backend/src/integrations/` that feeds into the same `CampaignMetrics` model. The Business Analyst doesn't care where the data comes from — manual or API, the analysis is the same.
