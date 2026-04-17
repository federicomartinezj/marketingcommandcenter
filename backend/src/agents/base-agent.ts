import Anthropic from "@anthropic-ai/sdk";

type BusinessLine = "OPL" | "AAS" | "MH" | "Volta";
type AgentRole = "orchestrator" | "copywriter" | "designer" | "ux-strategist" | "business-analyst" | "seo-specialist" | "social-media-manager" | "brand-guardian" | "data-analyst" | "competitive-intel";

export interface AgentConfig {
  role: AgentRole;
  label: string;
  buildSystemPrompt: (brandContext: string) => string;
}

export interface AgentInput {
  line: BusinessLine;
  userMessage: string;
}

export interface AgentOutput {
  role: AgentRole;
  content: string;
  truncated: boolean;
}

// Agents that need maximum quality use Sonnet; structured/simple tasks use Haiku
const MODEL_MAP: Partial<Record<AgentRole, string>> = {
  designer: "claude-opus-4-6",
  copywriter: "claude-sonnet-4-6",
  "social-media-manager": "claude-sonnet-4-6",
  "ux-strategist": "claude-sonnet-4-6",
  // These do structured JSON output or simple analysis — Haiku is sufficient
  "seo-specialist": "claude-haiku-4-5-20251001",
  "brand-guardian": "claude-haiku-4-5-20251001",
  "data-analyst": "claude-haiku-4-5-20251001",
  "competitive-intel": "claude-sonnet-4-6",
};

const TOKEN_LIMITS: Partial<Record<AgentRole, number>> = {
  designer: 32768,
};

// Roles that need streaming (long responses that may exceed API timeout)
const USE_STREAMING = new Set<AgentRole>(["designer"]);

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
    const { loadBrandContextForRole } = await import("../brand/loader.js");
    const brandContext = await loadBrandContextForRole(input.line, this.config.role);
    const systemPrompt = this.config.buildSystemPrompt(brandContext);

    const maxTokens = TOKEN_LIMITS[this.config.role] ?? 8192;
    const model = MODEL_MAP[this.config.role] ?? "claude-sonnet-4-6";

    if (USE_STREAMING.has(this.config.role)) {
      return this.runStreaming(systemPrompt, input.userMessage, model, maxTokens);
    }

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: input.userMessage }],
    });

    const truncated = response.stop_reason === "max_tokens";
    if (truncated) {
      console.warn(`[${this.config.role}] Response truncated at ${maxTokens} tokens (model: ${model})`);
    }

    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return { role: this.config.role, content: textContent, truncated };
  }

  private async runStreaming(systemPrompt: string, userMessage: string, model: string, maxTokens: number): Promise<AgentOutput> {
    const stream = this.client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const response = await stream.finalMessage();

    const truncated = response.stop_reason === "max_tokens";
    if (truncated) {
      console.warn(`[${this.config.role}] Streamed response truncated at ${maxTokens} tokens (model: ${model})`);
    }

    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return { role: this.config.role, content: textContent, truncated };
  }
}
