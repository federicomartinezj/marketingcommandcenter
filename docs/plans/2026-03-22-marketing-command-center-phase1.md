# Lavanti Marketing Command Center — Phase 1 (MVP) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a working Marketing Command Center MVP where the marketing director can create blog posts end-to-end using AI agents (Orchestrator + Copywriter + Brand Guardian), with a polished React dashboard reflecting Lavanti's brand.

**Architecture:** Monorepo with React+TypeScript+Tailwind frontend and Node+Express+TypeScript backend. The backend exposes REST endpoints that orchestrate Claude API calls through specialized agents. Each agent has a system prompt loaded from markdown brand knowledge files, and tool definitions. The frontend is a command center UI with dashboard, content creation flow, and agent activity panel.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Node.js, Express, Claude API (@anthropic-ai/sdk), PostgreSQL (via Prisma), Manrope font.

---

## Task 1: Project Scaffolding — Backend

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/index.ts`
- Create: `backend/.env.example`
- Create: `.gitignore`

**Step 1: Initialize backend package**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools
mkdir -p backend/src
```

Create `backend/package.json`:
```json
{
  "name": "lavanti-marketing-backend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

Create `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

Create `backend/src/index.ts`:
```typescript
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "lavanti-marketing-api" });
});

app.listen(PORT, () => {
  console.log(`Lavanti Marketing API running on port ${PORT}`);
});
```

Create `backend/.env.example`:
```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
```

Create root `.gitignore`:
```
node_modules/
dist/
.env
*.local
.DS_Store
```

**Step 2: Install dependencies**

Run: `cd backend && npm install`
Expected: Clean install, no errors.

**Step 3: Verify backend starts**

Run: `cd backend && npm run dev &` then `curl http://localhost:3001/api/health`
Expected: `{"status":"ok","service":"lavanti-marketing-api"}`

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold backend with Express + TypeScript"
```

---

## Task 2: Project Scaffolding — Frontend

**Files:**
- Create: `frontend/` (via Vite scaffolding)
- Modify: `frontend/tailwind.config.ts` (add Lavanti brand tokens)
- Modify: `frontend/src/index.css` (add Manrope font + Lavanti CSS variables)
- Create: `frontend/src/lib/constants.ts` (brand colors)

**Step 1: Scaffold React app with Vite**

```bash
cd /Users/fmartinezj/Documents/lavanti-tools
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
npm install -D tailwindcss @tailwindcss/vite
npm install zustand
```

**Step 2: Configure Tailwind with Lavanti brand tokens**

Replace `frontend/src/index.css` with:
```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap');

@theme {
  --font-sans: 'Manrope', sans-serif;

  /* Lavanti Corporate Palette */
  --color-near-black: #262626;
  --color-electric-blue: #0D86FF;
  --color-coral: #FF632C;
  --color-neon-yellow: #E5FF4A;
  --color-lime-green: #B4FF00;
  --color-off-white: #F2F2F2;
  --color-light-gray: #EAEAEA;

  /* Multihousing Palette */
  --color-mh-blue: #1DB5DE;
  --color-mh-green: #C2D219;
}

body {
  font-family: 'Manrope', sans-serif;
  background-color: #F2F2F2;
  color: #262626;
}
```

Add Tailwind Vite plugin in `frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

Create `frontend/src/lib/constants.ts`:
```typescript
export const BRAND = {
  colors: {
    corporate: {
      nearBlack: "#262626",
      electricBlue: "#0D86FF",
      coral: "#FF632C",
      neonYellow: "#E5FF4A",
      limeGreen: "#B4FF00",
      offWhite: "#F2F2F2",
      lightGray: "#EAEAEA",
    },
    multihousing: {
      mhBlue: "#1DB5DE",
      mhGreen: "#C2D219",
    },
  },
  lines: ["OPL", "AAS", "MH", "Volta"] as const,
  lineLabels: {
    OPL: "Equipos Industriales",
    AAS: "Laundry as a Service",
    MH: "Lavanderías Compartidas",
    Volta: "Laundromats",
  },
} as const;

export type BusinessLine = (typeof BRAND.lines)[number];
```

**Step 3: Verify frontend starts**

Run: `cd frontend && npm run dev`
Expected: Vite dev server on localhost:5173, page loads with Manrope font.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold frontend with React + Tailwind + Lavanti brand tokens"
```

---

## Task 3: Shared Types

**Files:**
- Create: `shared/types.ts`

**Step 1: Define core shared types**

Create `shared/types.ts`:
```typescript
export type BusinessLine = "OPL" | "AAS" | "MH" | "Volta";

export type AgentRole =
  | "orchestrator"
  | "copywriter"
  | "designer"
  | "ux-strategist"
  | "business-analyst"
  | "seo-specialist"
  | "social-media-manager"
  | "brand-guardian"
  | "data-analyst"
  | "competitive-intel";

export type AgentStatus = "idle" | "working" | "done" | "error";

export interface AgentState {
  role: AgentRole;
  label: string;
  status: AgentStatus;
  lastActivity?: string;
}

export type ContentType =
  | "blog-post"
  | "linkedin-post"
  | "instagram-post"
  | "email"
  | "email-sequence"
  | "landing-page"
  | "social-card";

export type ContentStatus = "draft" | "in-review" | "approved" | "rejected" | "published";

export interface ContentPiece {
  id: string;
  type: ContentType;
  title: string;
  line: BusinessLine;
  audience: string;
  status: ContentStatus;
  content: string;
  brandReview?: BrandReview;
  agentsInvolved: AgentRole[];
  createdAt: string;
  updatedAt: string;
}

export interface BrandReview {
  approved: boolean;
  score: number;
  checks: BrandCheck[];
  reviewedAt: string;
}

export interface BrandCheck {
  name: string;
  passed: boolean;
  detail: string;
  severity: "info" | "warning" | "error";
}

export interface CampaignBrief {
  description: string;
  line: BusinessLine;
  audience: string;
  objective: string;
  channels: string[];
}

export interface ExecutionPlan {
  id: string;
  brief: CampaignBrief;
  steps: ExecutionStep[];
  status: "planning" | "approved" | "executing" | "done";
}

export interface ExecutionStep {
  agent: AgentRole;
  task: string;
  status: AgentStatus;
  output?: string;
}

export interface CreateContentRequest {
  type: ContentType;
  line: BusinessLine;
  audience: string;
  topic: string;
  additionalContext?: string;
}

export interface CreateContentResponse {
  plan: ExecutionPlan;
  content?: ContentPiece;
}
```

**Step 2: Commit**

```bash
git add shared/
git commit -m "feat: add shared types for agents, content, and campaigns"
```

---

## Task 4: Brand Knowledge Base

**Files:**
- Create: `backend/brand-knowledge/brand-core.md`
- Create: `backend/brand-knowledge/opl-guidelines.md`
- Create: `backend/brand-knowledge/aas-guidelines.md`
- Create: `backend/brand-knowledge/multihousing-guidelines.md`
- Create: `backend/brand-knowledge/volta-guidelines.md`
- Create: `backend/brand-knowledge/tone-examples.md`
- Create: `backend/brand-knowledge/way-of-working.md`
- Create: `backend/brand-knowledge/values.md`

**Step 1: Create brand-core.md**

This is the master brand file. Content should include:
- Company identity (Lavanti = Hydrocare SAS, Medellín, Colombia)
- Mission: "Ropa limpia para todos"
- Essence: "Everyday is laundry day"
- Full corporate color palette with hex codes
- Typography: Manrope with weight hierarchy
- Logo versions and rules
- Alliance Laundry Systems relationship (UniMac, Speed Queen, IPSO, Primus, Jensen, Forenta)
- Markets: Colombia, Panamá, expanding to Ecuador, Argentina
- Co-branding rules

**Step 2: Create per-line guideline files**

Each file (opl, aas, mh, volta) should include:
- What the line is
- Target customer and decision maker
- Sales argument
- Emotional promise
- Hero values
- **Exact color palette** (CRITICAL: MH has its OWN palette without Coral)
- Tone adjustments
- SEO keywords
- Email templates/sequences
- Social media specs

**Step 3: Create tone-examples.md**

Include the 6 input→output examples from the brand manual:
1. Email to hotel GM (generic → Lavanti voice)
2. Technical explanation to operator
3. Response to customer complaint
4. LinkedIn post (generic → Lavanti voice)
5. Blog article for investor
6. "Why Lavanti" proposal section

Include the 3 golden rules:
- Starts from client's world?
- Has concrete data?
- Would the pilot read it at the aircraft door?

Prohibited vocabulary list and correct vocabulary list.

**Step 4: Create way-of-working.md**

The 8 principles: Can do will do, Accountability (QB model), Eternal student, Ruthless prioritization, Effective communication (<30 words), Solve the right problem, Ultra-fast iteration, Don't lie to yourself.

**Step 5: Create values.md**

3 pillars with all sub-values:
- Accessibility & Diversity (Community Spaces, Cultural Transformation, Free Time, Space Transformation)
- Protect the Environment (Textile Care, Responsible Resource Use, Equipment Durability)
- Leading Providers (Long-term Relationship, TCO, Support & Warranty, Protect Life, Peace of Mind, Worker Safety)

Rule: Values never sound like empty marketing.

**Step 6: Commit**

```bash
git add backend/brand-knowledge/
git commit -m "feat: add complete brand knowledge base for all agents"
```

---

## Task 5: Brand Knowledge Loader

**Files:**
- Create: `backend/src/brand/loader.ts`
- Create: `backend/src/brand/loader.test.ts`

**Step 1: Write the failing test**

Create `backend/src/brand/loader.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { loadBrandKnowledge, loadLineGuidelines } from "./loader.js";

describe("Brand Knowledge Loader", () => {
  it("loads brand-core.md", async () => {
    const content = await loadBrandKnowledge("brand-core");
    expect(content).toContain("Ropa limpia para todos");
    expect(content).toContain("#262626");
  });

  it("loads line-specific guidelines", async () => {
    const opl = await loadLineGuidelines("OPL");
    expect(opl).toContain("OPL");

    const mh = await loadLineGuidelines("MH");
    expect(mh).toContain("#1DB5DE");
    expect(mh).not.toContain("paleta corporativa");
  });

  it("throws on unknown file", async () => {
    await expect(loadBrandKnowledge("nonexistent")).rejects.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run src/brand/loader.test.ts`
Expected: FAIL — module not found.

**Step 3: Write minimal implementation**

Create `backend/src/brand/loader.ts`:
```typescript
import { readFile } from "fs/promises";
import { join } from "path";
import type { BusinessLine } from "../../shared/types.js";

const BRAND_DIR = join(import.meta.dirname, "../../brand-knowledge");

const LINE_FILE_MAP: Record<BusinessLine, string> = {
  OPL: "opl-guidelines",
  AAS: "aas-guidelines",
  MH: "multihousing-guidelines",
  Volta: "volta-guidelines",
};

export async function loadBrandKnowledge(name: string): Promise<string> {
  const filePath = join(BRAND_DIR, `${name}.md`);
  return readFile(filePath, "utf-8");
}

export async function loadLineGuidelines(line: BusinessLine): Promise<string> {
  const fileName = LINE_FILE_MAP[line];
  return loadBrandKnowledge(fileName);
}

export async function loadAllBrandContext(line: BusinessLine): Promise<string> {
  const [core, lineGuide, tone, values] = await Promise.all([
    loadBrandKnowledge("brand-core"),
    loadLineGuidelines(line),
    loadBrandKnowledge("tone-examples"),
    loadBrandKnowledge("values"),
  ]);
  return [core, lineGuide, tone, values].join("\n\n---\n\n");
}
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run src/brand/loader.test.ts`
Expected: All 3 tests PASS.

**Step 5: Commit**

```bash
git add backend/src/brand/
git commit -m "feat: add brand knowledge loader with tests"
```

---

## Task 6: Agent Base Class + Copywriter Agent

**Files:**
- Create: `backend/src/agents/base-agent.ts`
- Create: `backend/src/agents/copywriter.ts`
- Create: `backend/src/agents/copywriter.test.ts`

**Step 1: Create base agent abstraction**

Create `backend/src/agents/base-agent.ts`:
```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { AgentRole, BusinessLine } from "../../shared/types.js";
import { loadAllBrandContext } from "../brand/loader.js";

export interface AgentConfig {
  role: AgentRole;
  label: string;
  buildSystemPrompt: (brandContext: string) => string;
  tools?: Anthropic.Tool[];
}

export interface AgentInput {
  line: BusinessLine;
  userMessage: string;
}

export interface AgentOutput {
  role: AgentRole;
  content: string;
  toolResults?: Record<string, unknown>[];
}

export class BaseAgent {
  private client: Anthropic;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.client = new Anthropic();
    this.config = config;
  }

  get role() {
    return this.config.role;
  }

  async run(input: AgentInput): Promise<AgentOutput> {
    const brandContext = await loadAllBrandContext(input.line);
    const systemPrompt = this.config.buildSystemPrompt(brandContext);

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: input.userMessage }],
    });

    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return {
      role: this.config.role,
      content: textContent,
    };
  }
}
```

**Step 2: Create the Copywriter agent**

Create `backend/src/agents/copywriter.ts`:
```typescript
import { BaseAgent } from "./base-agent.js";

function buildCopywriterSystemPrompt(brandContext: string): string {
  return `Eres el Copywriter del departamento de marketing de Lavanti (Hydrocare SAS).

Tu rol es escribir contenido textual excepcional: blog posts, emails, posts de redes sociales, propuestas, landing pages, y scripts de video.

## TU VOZ: EL PILOTO EXPERTO
Conoces cada detalle técnico del negocio de lavandería industrial, pero hablas con calidez y empatía. Te adaptas a la audiencia.

## REGLAS DE ORO (NUNCA LAS ROMPAS):
1. SIEMPRE empieza desde el mundo del cliente, NUNCA desde Lavanti.
2. SIEMPRE incluye al menos un dato o hecho concreto.
3. Pregúntate: "¿Lo leería un piloto experimentado parado en la puerta del avión?" Si suena rígido o corporativo, reescríbelo.

## VOCABULARIO PROHIBIDO:
- Superlativos vacíos: "el mejor", "incomparable", "líder mundial"
- Voz pasiva: "se puede", "es posible que"
- Filler corporativo: "en el marco de", "a nivel de", "de cara a"
- "Estimado Cliente" como apertura

## VOCABULARIO CORRECTO:
- "costo por kilo", "costo total de propiedad (TCO)", "disponibilidad operativa"
- "tranquilidad", "respaldo", "ropa limpia genera dignidad", "liberamos tiempo"

## FORMATO COLOMBIANO:
- Miles: punto → $1.200.000
- Decimales: coma → 12,5%
- Moneda: COP preferida; USD para contexto internacional

## CONTEXTO DE MARCA:
${brandContext}

## INSTRUCCIONES DE OUTPUT:
- Responde SOLO con el contenido solicitado.
- Usa markdown para estructura (H1, H2, bullets, etc.)
- Incluye sugerencia de CTA al final cuando aplique.
- Si el tipo es "blog-post": H1 → H2 → H3, primer párrafo = problema real, dato concreto, CTA al final, voz activa.
- Si es "linkedin-post": máximo 1300 caracteres, storytelling con datos, hashtags al final.
- Si es "email": subject line + body, tono según audiencia, firma "Equipo Lavanti".
`;
}

export const copywriterAgent = new BaseAgent({
  role: "copywriter",
  label: "Copywriter",
  buildSystemPrompt: buildCopywriterSystemPrompt,
});
```

**Step 3: Write a basic integration test**

Create `backend/src/agents/copywriter.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { copywriterAgent } from "./copywriter.js";

describe("Copywriter Agent", () => {
  it("has the correct role", () => {
    expect(copywriterAgent.role).toBe("copywriter");
  });

  // Integration test — only run with ANTHROPIC_API_KEY
  it.skipIf(!process.env.ANTHROPIC_API_KEY)(
    "generates a LinkedIn post for OPL",
    async () => {
      const result = await copywriterAgent.run({
        line: "OPL",
        userMessage:
          'Escribe un post de LinkedIn sobre por qué un hotel debería invertir en lavandería interna. Audiencia: gerentes generales de hoteles de 100+ habitaciones.',
      });

      expect(result.role).toBe("copywriter");
      expect(result.content.length).toBeGreaterThan(100);
      // Should NOT start with "En Lavanti..." (brand rule)
      expect(result.content).not.toMatch(/^En Lavanti/);
    },
    30000
  );
});
```

**Step 4: Run tests**

Run: `cd backend && npx vitest run src/agents/copywriter.test.ts`
Expected: Unit test passes. Integration test skipped (or passes if API key is set).

**Step 5: Commit**

```bash
git add backend/src/agents/
git commit -m "feat: add base agent class and copywriter agent with brand context"
```

---

## Task 7: Brand Guardian Agent

**Files:**
- Create: `backend/src/agents/brand-guardian.ts`
- Create: `backend/src/agents/brand-guardian.test.ts`

**Step 1: Create the Brand Guardian agent**

Create `backend/src/agents/brand-guardian.ts`:
```typescript
import { BaseAgent } from "./base-agent.js";
import type { BusinessLine } from "../../shared/types.js";

function buildBrandGuardianSystemPrompt(brandContext: string): string {
  return `Eres el Brand Guardian del departamento de marketing de Lavanti (Hydrocare SAS).

Tu rol es revisar TODO el contenido generado antes de que se publique. Tienes poder de veto.

## TU CHECKLIST DE REVISIÓN (evalúa CADA punto):

1. **Paleta correcta**: ¿Los colores mencionados o implícitos corresponden a la línea de negocio?
   - OPL/AAS: Near Black #262626 + Electric Blue #0D86FF + Coral #FF632C (acento)
   - MH: MH Blue #1DB5DE + MH Green #C2D219 — SIN CORAL NUNCA
   - Volta: Paleta propia — lockup "Volta by Lavanti"
   ⚠️ NUNCA se mezclan paletas entre líneas.

2. **Tono Expert Pilot**: ¿Suena como un piloto experimentado, cercano pero profesional?
   - NO suena corporativo rígido
   - NO suena casual/informal en exceso (excepto MH que es más fresco)

3. **Empieza desde el cliente**: ¿El contenido abre desde el mundo del lector, NO desde "En Lavanti..."?

4. **Dato concreto**: ¿Hay al menos un dato, número, porcentaje o hecho verificable?

5. **Sin vocabulario prohibido**: Verificar que NO aparezcan:
   - Superlativos vacíos: "el mejor", "incomparable", "líder mundial"
   - Voz pasiva: "se puede", "es posible que"
   - Filler: "en el marco de", "a nivel de", "de cara a"
   - "Estimado Cliente"

6. **CTA clara**: ¿Hay un llamado a la acción específico y relevante?

7. **Formato colombiano**: Miles con punto, decimales con coma, COP.

8. **Valores no vacíos**: Si menciona pilares de marca, ¿lo hace con contexto real? ("Proteger la Vida" solo en hospitales/higiene)

## CONTEXTO DE MARCA:
${brandContext}

## FORMATO DE RESPUESTA:
Responde SIEMPRE en este formato JSON exacto:

\`\`\`json
{
  "approved": true/false,
  "score": 0-100,
  "checks": [
    {
      "name": "Nombre del check",
      "passed": true/false,
      "detail": "Explicación breve",
      "severity": "info|warning|error"
    }
  ],
  "summary": "Resumen de una línea",
  "suggestions": ["Sugerencia 1", "Sugerencia 2"]
}
\`\`\`

- score >= 80 Y ningún check con severity "error" → approved: true
- Cualquier check con severity "error" → approved: false independientemente del score
`;
}

export const brandGuardianAgent = new BaseAgent({
  role: "brand-guardian",
  label: "Brand Guardian",
  buildSystemPrompt: buildBrandGuardianSystemPrompt,
});

export interface BrandGuardianInput {
  content: string;
  line: BusinessLine;
  contentType: string;
  audience: string;
}

export function buildReviewMessage(input: BrandGuardianInput): string {
  return `Revisa el siguiente contenido de marketing para la línea ${input.line}.

Tipo de contenido: ${input.contentType}
Audiencia: ${input.audience}
Línea de negocio: ${input.line}

--- CONTENIDO A REVISAR ---
${input.content}
--- FIN DEL CONTENIDO ---

Evalúa según tu checklist completa y responde en el formato JSON especificado.`;
}
```

**Step 2: Write test**

Create `backend/src/agents/brand-guardian.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { brandGuardianAgent, buildReviewMessage } from "./brand-guardian.js";

describe("Brand Guardian Agent", () => {
  it("has the correct role", () => {
    expect(brandGuardianAgent.role).toBe("brand-guardian");
  });

  it("builds review message with all context", () => {
    const msg = buildReviewMessage({
      content: "Test content",
      line: "OPL",
      contentType: "blog-post",
      audience: "hotel managers",
    });
    expect(msg).toContain("OPL");
    expect(msg).toContain("Test content");
    expect(msg).toContain("blog-post");
  });
});
```

**Step 3: Run test**

Run: `cd backend && npx vitest run src/agents/brand-guardian.test.ts`
Expected: PASS.

**Step 4: Commit**

```bash
git add backend/src/agents/brand-guardian*
git commit -m "feat: add brand guardian agent with review checklist"
```

---

## Task 8: Orchestrator Agent

**Files:**
- Create: `backend/src/agents/orchestrator.ts`
- Create: `backend/src/agents/orchestrator.test.ts`

**Step 1: Create the Orchestrator**

Create `backend/src/agents/orchestrator.ts`:
```typescript
import type {
  BusinessLine,
  ContentType,
  CreateContentRequest,
  ExecutionPlan,
  ExecutionStep,
  ContentPiece,
  BrandReview,
} from "../../shared/types.js";
import { copywriterAgent } from "./copywriter.js";
import {
  brandGuardianAgent,
  buildReviewMessage,
} from "./brand-guardian.js";
import { randomUUID } from "crypto";

export interface OrchestratorCallbacks {
  onPlanCreated?: (plan: ExecutionPlan) => void;
  onStepStarted?: (stepIndex: number, step: ExecutionStep) => void;
  onStepCompleted?: (stepIndex: number, step: ExecutionStep) => void;
}

export async function orchestrateContentCreation(
  request: CreateContentRequest,
  callbacks?: OrchestratorCallbacks
): Promise<ContentPiece> {
  const planId = randomUUID();

  // Build execution plan
  const steps: ExecutionStep[] = [
    { agent: "copywriter", task: `Generate ${request.type} about: ${request.topic}`, status: "idle" },
    { agent: "brand-guardian", task: "Review content for brand compliance", status: "idle" },
  ];

  const plan: ExecutionPlan = {
    id: planId,
    brief: {
      description: request.topic,
      line: request.line,
      audience: request.audience,
      objective: `Create ${request.type}`,
      channels: [request.type],
    },
    steps,
    status: "executing",
  };

  callbacks?.onPlanCreated?.(plan);

  // Step 1: Copywriter generates content
  steps[0].status = "working";
  callbacks?.onStepStarted?.(0, steps[0]);

  const copywriterPrompt = buildCopywriterPrompt(request);
  const copyResult = await copywriterAgent.run({
    line: request.line,
    userMessage: copywriterPrompt,
  });

  steps[0].status = "done";
  steps[0].output = copyResult.content;
  callbacks?.onStepCompleted?.(0, steps[0]);

  // Step 2: Brand Guardian reviews
  steps[1].status = "working";
  callbacks?.onStepStarted?.(1, steps[1]);

  const reviewResult = await brandGuardianAgent.run({
    line: request.line,
    userMessage: buildReviewMessage({
      content: copyResult.content,
      line: request.line,
      contentType: request.type,
      audience: request.audience,
    }),
  });

  steps[1].status = "done";
  steps[1].output = reviewResult.content;
  callbacks?.onStepCompleted?.(1, steps[1]);

  // Parse brand review
  const brandReview = parseBrandReview(reviewResult.content);

  plan.status = "done";

  return {
    id: randomUUID(),
    type: request.type,
    title: request.topic,
    line: request.line,
    audience: request.audience,
    status: brandReview.approved ? "approved" : "in-review",
    content: copyResult.content,
    brandReview,
    agentsInvolved: ["orchestrator", "copywriter", "brand-guardian"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function buildCopywriterPrompt(request: CreateContentRequest): string {
  const typeInstructions: Record<ContentType, string> = {
    "blog-post": "Escribe un blog post para aprende.lavanti.com. Estructura: H1 → H2 → H3. Primer párrafo = problema real del cliente. Incluye datos concretos. CTA al final.",
    "linkedin-post": "Escribe un post de LinkedIn. Máximo 1300 caracteres. Storytelling con datos. Hashtags relevantes al final. Abre con un hook que detenga el scroll.",
    "instagram-post": "Escribe el caption de un post de Instagram. Conciso, visual, con emojis sparingly. Hashtags al final.",
    "email": "Escribe un email de marketing. Incluye subject line. Tono según la audiencia. Breve y con CTA claro.",
    "email-sequence": "Escribe una secuencia de emails de nurturing. Cada email con subject y body.",
    "landing-page": "Escribe el copy de una landing page. Hero section con headline + subheadline, beneficios, prueba social, CTA.",
    "social-card": "Escribe el texto para una tarjeta social visual. Headline corto e impactante + subtítulo con dato.",
  };

  return `${typeInstructions[request.type]}

Línea de negocio: ${request.line}
Audiencia: ${request.audience}
Tema: ${request.topic}
${request.additionalContext ? `Contexto adicional: ${request.additionalContext}` : ""}`;
}

function parseBrandReview(raw: string): BrandReview {
  try {
    // Extract JSON from potential markdown code blocks
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
      checks: [{ name: "Parse Error", passed: false, detail: "Could not parse brand review response", severity: "error" }],
      reviewedAt: new Date().toISOString(),
    };
  }
}
```

**Step 2: Write test**

Create `backend/src/agents/orchestrator.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { orchestrateContentCreation } from "./orchestrator.js";

describe("Orchestrator", () => {
  it.skipIf(!process.env.ANTHROPIC_API_KEY)(
    "creates a blog post end-to-end",
    async () => {
      const stepsStarted: number[] = [];

      const result = await orchestrateContentCreation(
        {
          type: "blog-post",
          line: "OPL",
          audience: "Gerentes generales de hoteles",
          topic: "5 señales de que tu hotel necesita su propia lavandería",
        },
        {
          onStepStarted: (i) => stepsStarted.push(i),
        }
      );

      expect(result.type).toBe("blog-post");
      expect(result.line).toBe("OPL");
      expect(result.content.length).toBeGreaterThan(200);
      expect(result.brandReview).toBeDefined();
      expect(result.agentsInvolved).toContain("copywriter");
      expect(result.agentsInvolved).toContain("brand-guardian");
      expect(stepsStarted).toEqual([0, 1]);
    },
    60000
  );
});
```

**Step 3: Run test**

Run: `cd backend && npx vitest run src/agents/orchestrator.test.ts`
Expected: PASS (or skipped without API key).

**Step 4: Commit**

```bash
git add backend/src/agents/orchestrator*
git commit -m "feat: add orchestrator for end-to-end content creation flow"
```

---

## Task 9: API Routes — Content Creation

**Files:**
- Create: `backend/src/routes/content.ts`
- Modify: `backend/src/index.ts` (add routes)

**Step 1: Create content routes**

Create `backend/src/routes/content.ts`:
```typescript
import { Router } from "express";
import { orchestrateContentCreation } from "../agents/orchestrator.js";
import type { CreateContentRequest } from "../../shared/types.js";

const router = Router();

// In-memory store for MVP
const contentStore: Map<string, unknown> = new Map();

router.post("/", async (req, res) => {
  try {
    const request = req.body as CreateContentRequest;

    if (!request.type || !request.line || !request.audience || !request.topic) {
      res.status(400).json({ error: "Missing required fields: type, line, audience, topic" });
      return;
    }

    const result = await orchestrateContentCreation(request);
    contentStore.set(result.id, result);
    res.json(result);
  } catch (error) {
    console.error("Content creation error:", error);
    res.status(500).json({ error: "Failed to create content" });
  }
});

router.get("/", (_req, res) => {
  const items = Array.from(contentStore.values());
  res.json(items);
});

router.get("/:id", (req, res) => {
  const item = contentStore.get(req.params.id);
  if (!item) {
    res.status(404).json({ error: "Content not found" });
    return;
  }
  res.json(item);
});

export { router as contentRouter };
```

**Step 2: Register routes in index.ts**

Update `backend/src/index.ts` to add:
```typescript
import { contentRouter } from "./routes/content.js";

// After the existing middleware
app.use("/api/content", contentRouter);
```

**Step 3: Commit**

```bash
git add backend/src/routes/ backend/src/index.ts
git commit -m "feat: add REST API routes for content creation"
```

---

## Task 10: Frontend — Layout Shell + Dashboard

**Files:**
- Create: `frontend/src/components/Layout.tsx`
- Create: `frontend/src/components/Dashboard/Dashboard.tsx`
- Create: `frontend/src/components/Dashboard/StatCard.tsx`
- Create: `frontend/src/components/Dashboard/QuickActions.tsx`
- Create: `frontend/src/components/Dashboard/AgentPanel.tsx`
- Create: `frontend/src/components/Dashboard/ActivityFeed.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: Create the Layout shell**

Create `frontend/src/components/Layout.tsx`:
```tsx
import { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-off-white font-sans">
      {/* Top Nav */}
      <header className="bg-near-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">
            LAVANTI
          </span>
          <span className="text-electric-blue font-semibold text-sm">
            MARKETING COMMAND CENTER
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Directora: Ana</span>
          <div className="w-8 h-8 rounded-full bg-electric-blue flex items-center justify-center text-sm font-bold">
            A
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
```

**Step 2: Create Dashboard components**

Create `StatCard.tsx`, `QuickActions.tsx`, `AgentPanel.tsx`, `ActivityFeed.tsx`, and the main `Dashboard.tsx` that composes them. The Dashboard should show:

- 4 stat cards (Campañas Activas, Contenido Este Mes, Pipeline Leads, Brand Score)
- Quick actions grid (Nueva Campaña, Crear Contenido, Reporte, Email Sequence, Post Social, Blog Post, Análisis Competitivo, Calendario Editorial)
- Agent status panel (10 agents with green/idle indicators)
- Activity feed (recent events)

Design specs:
- Background: `bg-off-white` (#F2F2F2)
- Cards: white background, subtle shadow, rounded-xl
- Stat numbers: `text-electric-blue` large and bold
- Quick action buttons: `bg-near-black text-white hover:bg-electric-blue` transition
- Agent indicators: green dots for idle, blue spinning for working
- Font: Manrope everywhere (already set globally)

**Step 3: Wire up App.tsx**

Replace `frontend/src/App.tsx`:
```tsx
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard/Dashboard";

export default function App() {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}
```

**Step 4: Verify UI renders**

Run: `cd frontend && npm run dev`
Expected: Dashboard visible at localhost:5173 with Lavanti branding.

**Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add dashboard layout with stat cards, quick actions, agents panel"
```

---

## Task 11: Frontend — Content Creation Flow

**Files:**
- Create: `frontend/src/components/ContentStudio/CreateContentModal.tsx`
- Create: `frontend/src/components/ContentStudio/ContentPreview.tsx`
- Create: `frontend/src/components/ContentStudio/BrandReviewCard.tsx`
- Create: `frontend/src/store/content.ts`
- Create: `frontend/src/lib/api.ts`

**Step 1: Create API client**

Create `frontend/src/lib/api.ts`:
```typescript
import type { CreateContentRequest, ContentPiece } from "../../../shared/types";

const BASE = "/api";

export async function createContent(request: CreateContentRequest): Promise<ContentPiece> {
  const res = await fetch(`${BASE}/content`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function listContent(): Promise<ContentPiece[]> {
  const res = await fetch(`${BASE}/content`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

**Step 2: Create Zustand store**

Create `frontend/src/store/content.ts`:
```typescript
import { create } from "zustand";
import type { ContentPiece, CreateContentRequest, ExecutionStep } from "../../../shared/types";
import { createContent } from "../lib/api";

interface ContentStore {
  pieces: ContentPiece[];
  isCreating: boolean;
  currentSteps: ExecutionStep[];
  error: string | null;
  createNewContent: (request: CreateContentRequest) => Promise<void>;
}

export const useContentStore = create<ContentStore>((set) => ({
  pieces: [],
  isCreating: false,
  currentSteps: [],
  error: null,

  createNewContent: async (request) => {
    set({ isCreating: true, error: null, currentSteps: [] });
    try {
      const piece = await createContent(request);
      set((state) => ({
        pieces: [piece, ...state.pieces],
        isCreating: false,
      }));
    } catch (err) {
      set({ error: String(err), isCreating: false });
    }
  },
}));
```

**Step 3: Create the modal and preview components**

`CreateContentModal.tsx`: A form modal with:
- Content type select (Blog Post, LinkedIn Post, Email, etc.)
- Business line select (OPL, AAS, MH, Volta) — with visual color indicator per line
- Audience text input
- Topic textarea
- Submit button that shows agent progress (Copywriter working... Brand Guardian reviewing...)

`ContentPreview.tsx`: Shows the generated content with markdown rendering.

`BrandReviewCard.tsx`: Shows the brand review results:
- Approved/Rejected badge with score
- List of checks with pass/fail icons
- Suggestions if any
- Approve / Edit / Regenerate buttons

**Step 4: Connect "Crear Contenido" quick action to the modal**

When user clicks "Crear Contenido" in Dashboard, the modal opens.

**Step 5: Verify end-to-end flow**

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Click "Crear Contenido" → fill form → submit → see agent progress → see content + brand review

**Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: add content creation flow with modal, preview, and brand review"
```

---

## Task 12: Frontend — Activity Feed (Live Updates)

**Files:**
- Modify: `frontend/src/components/Dashboard/ActivityFeed.tsx`
- Create: `frontend/src/store/activity.ts`

**Step 1: Create activity store**

```typescript
import { create } from "zustand";

export interface ActivityItem {
  id: string;
  type: "success" | "working" | "warning" | "error";
  message: string;
  timestamp: string;
}

interface ActivityStore {
  items: ActivityItem[];
  addActivity: (item: Omit<ActivityItem, "id" | "timestamp">) => void;
}

export const useActivityStore = create<ActivityStore>((set) => ({
  items: [],
  addActivity: (item) =>
    set((state) => ({
      items: [
        {
          ...item,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
        ...state.items,
      ].slice(0, 50),
    })),
}));
```

**Step 2: Update ActivityFeed to use store**

Show real-time activity as content is created: agent started, agent completed, brand review result.

**Step 3: Connect content creation to activity feed**

When `createNewContent` runs, push activity items for each step.

**Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: add live activity feed connected to content creation"
```

---

## Task 13: Integration Test + Polish

**Step 1: End-to-end manual test**

1. `cd backend && npm run dev`
2. `cd frontend && npm run dev`
3. Open http://localhost:5173
4. Verify: Dashboard renders with Lavanti branding (Manrope, Near Black header, Electric Blue accents)
5. Click "Crear Contenido"
6. Select "Blog Post", Line "OPL", Audience "Gerentes de hotel", Topic "Por qué la lavandería interna ahorra dinero"
7. Verify: Content is generated, Brand Guardian review shows, activity feed updates

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: phase 1 MVP complete - marketing command center with AI agents"
```

---

## Summary: Phase 1 Deliverables

| Component | Status |
|-----------|--------|
| Backend scaffold (Express + TS) | Task 1 |
| Frontend scaffold (React + Tailwind + Lavanti brand) | Task 2 |
| Shared types | Task 3 |
| Brand knowledge base (8 markdown files) | Task 4 |
| Brand knowledge loader + tests | Task 5 |
| Copywriter agent + tests | Task 6 |
| Brand Guardian agent + tests | Task 7 |
| Orchestrator (coordinates agents) + tests | Task 8 |
| REST API routes | Task 9 |
| Dashboard UI (stats, quick actions, agents, feed) | Task 10 |
| Content creation flow (modal → preview → review) | Task 11 |
| Live activity feed | Task 12 |
| Integration test + polish | Task 13 |

**Total: 13 tasks, ~40 commits, working MVP where the marketing director can create brand-compliant content through AI agents.**
