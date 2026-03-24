# Phase 3: Campañas — Implementation Plan

**Goal:** Enable full campaign creation flow where the marketing director describes a campaign in natural language and the system activates multiple agents to generate a complete execution plan with content, landing pages, SEO strategy, and A/B variants.

**New agents:** UX Strategist, SEO Specialist
**Key features:** Campaign wizard, multi-agent campaign orchestration, A/B copy variants, content pipeline with states, landing page copy generation

---

## Task 1: UX Strategist Agent
Create agent that designs user journeys, landing page structures, and conversion funnels per business line.

## Task 2: SEO Specialist Agent
Create agent that researches keywords, optimizes content, and suggests content clusters for aprende.lavanti.com.

## Task 3: Campaign Types and Shared Types
Add Campaign model to shared types with full lifecycle: brief → plan → execution → review.

## Task 4: Campaign Orchestrator
New orchestration flow for campaigns: receives natural language brief, activates Business Analyst → UX Strategist → SEO → Copywriter → Designer → Social Media → Brand Guardian.

## Task 5: Campaign API Routes
CRUD for campaigns: POST /api/campaigns, GET, PUT status updates, GET /:id with full plan.

## Task 6: A/B Copy Variants
Extend Copywriter agent to generate multiple variants. Add variant selection UI.

## Task 7: Content Pipeline States
Add pipeline view: Idea → Borrador → En Revisión → Aprobado → Publicado. Update content store and list view.

## Task 8: Campaign Wizard UI
Multi-step wizard: describe campaign → see agent plan → approve → track execution → review results.

## Task 9: Campaign Dashboard Cards
Update Dashboard to show active campaigns with progress, and campaign-specific activity in feed.

## Task 10: Landing Page Copy Generator
Specialized flow for generating landing page copy: hero, benefits, social proof, CTA sections.

## Task 11: Integration Polish
Verify all flows, fix issues, final commit.
