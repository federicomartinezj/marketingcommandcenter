const API_BASE = import.meta.env.VITE_API_URL || "/api";
const BASE = `${API_BASE}/campaigns`;

export interface Campaign {
  id: string;
  name: string;
  brief: string;
  line: string;
  audience: string;
  objective: string;
  concept: string;
  funnel: Array<{ stage: string; description: string; channels: string[] }>;
  channels: Array<{
    id: string;
    channel: string;
    funnelStage: string;
    variants: Array<{ id: string; label: string; content: string; selected: boolean }>;
    designHtml?: string;
    seoOptimization?: { keywords: string[]; suggestions: string[]; score: number; metaDescription: string; optimizedTitle: string };
    brandReview?: { approved: boolean; score: number; checks: Array<{ name: string; passed: boolean; detail: string; severity: string }>; reviewedAt: string };
    status: string;
  }>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignRequest {
  brief: string;
  line: string;
  audience: string;
  objective: string;
}

async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error: ${res.status}`);
  }
  return res.json();
}

export const campaignApi = {
  create: (req: CreateCampaignRequest) =>
    apiCall<Campaign>(BASE, { method: "POST", body: JSON.stringify(req) }),
  list: (filters?: { line?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.line) params.set("line", filters.line);
    if (filters?.status) params.set("status", filters.status);
    const qs = params.toString();
    return apiCall<Campaign[]>(`${BASE}${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => apiCall<Campaign>(`${BASE}/${id}`),
  analyze: (id: string) => apiCall<Campaign>(`${BASE}/${id}/analyze`, { method: "POST" }),
  updatePlan: (id: string, data: { channels?: unknown[]; funnel?: unknown[] }) =>
    apiCall<Campaign>(`${BASE}/${id}/plan`, { method: "PUT", body: JSON.stringify(data) }),
  generate: (id: string) => apiCall<Campaign>(`${BASE}/${id}/generate`, { method: "POST" }),
  selectVariant: (id: string, channelId: string, variantId: string) =>
    apiCall<Campaign>(`${BASE}/${id}/channels/${channelId}/select`, { method: "PUT", body: JSON.stringify({ variantId }) }),
  regenerateChannel: (id: string, channelId: string) =>
    apiCall<Campaign>(`${BASE}/${id}/channels/${channelId}/regenerate`, { method: "POST" }),
  approve: (id: string) => apiCall<Campaign>(`${BASE}/${id}/approve`, { method: "PUT" }),
  exportUrl: (id: string) => `${BASE}/${id}/export`,
  generateMoodboard: (id: string) =>
    apiCall<unknown>(`${BASE}/${id}/moodboard`, { method: "POST" }),
  getMoodboard: (id: string) =>
    apiCall<unknown>(`${BASE}/${id}/moodboard`),
  approveMoodboard: (id: string) =>
    apiCall<unknown>(`${BASE}/${id}/moodboard/approve`, { method: "PUT" }),
};
