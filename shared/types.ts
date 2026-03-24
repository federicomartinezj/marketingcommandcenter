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
  | "social-card"
  | "whatsapp"
  | "facebook-ad";

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

// === Phase 3: Campaign Types ===

export type CampaignStatus = "draft" | "planning" | "planned" | "generating" | "review" | "approved" | "exported";

export type FunnelStageName = "awareness" | "interest" | "nurture" | "conversion";

export interface FunnelStage {
  stage: FunnelStageName;
  description: string;
  channels: ContentType[];
}

export interface ContentVariant {
  id: string;
  label: "A" | "B" | "C";
  content: string;
  selected: boolean;
}

export interface SEOResult {
  keywords: string[];
  suggestions: string[];
  score: number;
  metaDescription: string;
  optimizedTitle: string;
}

export type ChannelPlanStatus = "pending" | "generating" | "ready" | "error" | "approved";

export interface ChannelPlan {
  id: string;
  channel: ContentType;
  funnelStage: FunnelStageName;
  variants: ContentVariant[];
  designHtml?: string;
  seoOptimization?: SEOResult;
  brandReview?: BrandReview;
  status: ChannelPlanStatus;
}

export interface Campaign {
  id: string;
  name: string;
  brief: string;
  line: BusinessLine;
  audience: string;
  objective: string;
  concept: string;
  funnel: FunnelStage[];
  channels: ChannelPlan[];
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignCallbacks {
  onPhaseStarted?: (phase: 1 | 2 | 3) => void;
  onChannelStarted?: (channelId: string, channel: ContentType) => void;
  onChannelCompleted?: (channelId: string, channel: ContentType) => void;
  onChannelFailed?: (channelId: string, channel: ContentType, error: string) => void;
  onCampaignCompleted?: (campaign: Campaign) => void;
}

export interface CreateCampaignRequest {
  brief: string;
  line: BusinessLine;
  audience: string;
  objective: string;
}
