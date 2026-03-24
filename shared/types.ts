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
  designHtml?: string;
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
