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

const TOKEN_LIMITS: Partial<Record<AgentRole, number>> = {
  designer: 16384,
};

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
    const { loadAllBrandContext } = await import("../brand/loader.js");
    const brandContext = await loadAllBrandContext(input.line);
    const systemPrompt = this.config.buildSystemPrompt(brandContext);

    const maxTokens = TOKEN_LIMITS[this.config.role] ?? 8192;

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: input.userMessage }],
    });

    const truncated = response.stop_reason === "max_tokens";
    if (truncated) {
      console.warn(`[${this.config.role}] Response truncated at ${maxTokens} tokens`);
    }

    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return {
      role: this.config.role,
      content: textContent,
      truncated,
    };
  }
}
