import type { ContentType, CreateContentRequest, ExecutionPlan, ExecutionStep, ContentPiece, BrandReview } from "../../shared/types.js";
import { copywriterAgent } from "./copywriter.js";
import { socialMediaManagerAgent } from "./social-media-manager.js";
import { designerAgent } from "./designer.js";
import { brandGuardianAgent, buildReviewMessage } from "./brand-guardian.js";
import { randomUUID } from "crypto";

const SOCIAL_TYPES: ContentType[] = ["linkedin-post", "instagram-post", "social-card"];
const EMAIL_TYPES: ContentType[] = ["email", "email-sequence"];

function getContentAgent(type: ContentType) {
  if (SOCIAL_TYPES.includes(type)) return socialMediaManagerAgent;
  return copywriterAgent;
}

function getContentAgentName(type: ContentType): string {
  if (SOCIAL_TYPES.includes(type)) return "social-media-manager";
  return "copywriter";
}

function needsDesigner(type: ContentType): boolean {
  return SOCIAL_TYPES.includes(type) || EMAIL_TYPES.includes(type);
}

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

  const contentAgentName = getContentAgentName(request.type);
  const contentAgent = getContentAgent(request.type);
  const includeDesigner = needsDesigner(request.type);

  const steps: ExecutionStep[] = [
    { agent: contentAgentName, task: `Generate ${request.type} about: ${request.topic}`, status: "idle" },
  ];

  if (includeDesigner) {
    steps.push({ agent: "designer", task: "Generate visual HTML/CSS for content", status: "idle" });
  }

  steps.push({ agent: "brand-guardian", task: "Review content for brand compliance", status: "idle" });

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

  let stepIndex = 0;

  // Step 1: Content agent generates content
  steps[stepIndex].status = "working";
  callbacks?.onStepStarted?.(stepIndex, steps[stepIndex]);

  const copywriterPrompt = buildCopywriterPrompt(request);
  const copyResult = await contentAgent.run({
    line: request.line,
    userMessage: copywriterPrompt,
  });

  steps[stepIndex].status = "done";
  steps[stepIndex].output = copyResult.content;
  callbacks?.onStepCompleted?.(stepIndex, steps[stepIndex]);
  stepIndex++;

  // Step 2 (optional): Designer generates HTML
  let designHtml: string | undefined;

  if (includeDesigner) {
    steps[stepIndex].status = "working";
    callbacks?.onStepStarted?.(stepIndex, steps[stepIndex]);

    const designerPrompt = buildDesignerPrompt(request, copyResult.content);
    const designResult = await designerAgent.run({
      line: request.line,
      userMessage: designerPrompt,
    });

    designHtml = designResult.content;
    steps[stepIndex].status = "done";
    steps[stepIndex].output = designResult.content;
    callbacks?.onStepCompleted?.(stepIndex, steps[stepIndex]);
    stepIndex++;
  }

  // Final step: Brand Guardian reviews
  steps[stepIndex].status = "working";
  callbacks?.onStepStarted?.(stepIndex, steps[stepIndex]);

  const reviewResult = await brandGuardianAgent.run({
    line: request.line,
    userMessage: buildReviewMessage({
      content: copyResult.content,
      line: request.line,
      contentType: request.type,
      audience: request.audience,
    }),
  });

  steps[stepIndex].status = "done";
  steps[stepIndex].output = reviewResult.content;
  callbacks?.onStepCompleted?.(stepIndex, steps[stepIndex]);

  const brandReview = parseBrandReview(reviewResult.content);

  plan.status = "done";

  const agentsInvolved: string[] = ["orchestrator", contentAgentName];
  if (includeDesigner) agentsInvolved.push("designer");
  agentsInvolved.push("brand-guardian");

  return {
    id: randomUUID(),
    type: request.type,
    title: request.topic,
    line: request.line,
    audience: request.audience,
    status: brandReview.approved ? "approved" : "in-review",
    content: copyResult.content,
    designHtml,
    brandReview,
    agentsInvolved,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function buildDesignerPrompt(request: CreateContentRequest, content: string): string {
  const platformDimensions: Record<string, string> = {
    "linkedin-post": "1200x628px",
    "instagram-post": "1080x1080px",
    "social-card": "1200x628px",
    "email": "600px width",
    "email-sequence": "600px width",
  };
  const dims = platformDimensions[request.type] || "1200x628px";

  return `Genera el HTML/CSS para un asset visual de marketing.

Tipo: ${request.type}
Línea: ${request.line}
Dimensiones: ${dims}
Audiencia: ${request.audience}

Contenido del post/email:
${content}

Genera HTML completo con estilos inline que pueda renderizarse directamente. Usa la paleta correcta para la línea ${request.line}. Fuente: Manrope.`;
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
