const BASE = "/api";

export interface ContentPiece {
  id: string;
  type: string;
  title: string;
  line: string;
  audience: string;
  status: string;
  content: string;
  designHtml?: string;
  brandReview?: {
    approved: boolean;
    score: number;
    checks: Array<{
      name: string;
      passed: boolean;
      detail: string;
      severity: "info" | "warning" | "error";
    }>;
    reviewedAt: string;
  };
  agentsInvolved: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentRequest {
  type: string;
  line: string;
  audience: string;
  topic: string;
  additionalContext?: string;
}

export async function createContent(request: CreateContentRequest): Promise<ContentPiece> {
  const res = await fetch(`${BASE}/content`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error: ${res.status}`);
  }
  return res.json();
}

export async function listContent(): Promise<ContentPiece[]> {
  const res = await fetch(`${BASE}/content`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
