import type { ContentType, CreateContentRequest, ExecutionPlan, ExecutionStep, ContentPiece, BrandReview, BrandCheck } from "../../shared/types.js";
import { copywriterAgent } from "./copywriter.js";
import { brandGuardianAgent, buildReviewMessage } from "./brand-guardian.js";
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
