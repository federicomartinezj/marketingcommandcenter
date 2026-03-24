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
    // Import dynamically to avoid circular deps
    const { loadAllBrandContext } = await import("../brand/loader.js");
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
