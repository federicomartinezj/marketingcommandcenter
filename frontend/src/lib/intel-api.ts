const API_BASE = import.meta.env.VITE_API_URL || "/api";
const BASE = `${API_BASE}/intel`;

export interface IntelTrend {
  trend: string;
  relevance: string;
  detail: string;
}

export interface IntelOpportunity {
  id: string;
  description: string;
  targetSegment: string;
  suggestedLine: string;
  urgency: string;
  campaignBrief: string;
  campaignId?: string;
}

export interface IntelSource {
  title: string;
  url: string;
  snippet: string;
}

export interface IntelReport {
  id: string;
  type: string;
  title: string;
  summary: string;
  line?: string;
  query: string;
  trends: IntelTrend[];
  opportunities: IntelOpportunity[];
  sources: IntelSource[];
  errorMessage?: string;
  status: string;
  createdAt: string;
}

export interface ResearchRequest {
  query: string;
  line?: string;
}

export interface MonthlyResult {
  reports: IntelReport[];
  count: number;
}

export interface CreateCampaignResult {
  report: IntelReport;
  campaign: unknown;
}

async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((error as { error?: string }).error || `API error: ${res.status}`);
  }
  return res.json();
}

export const intelApi = {
  research: (req: ResearchRequest) =>
    apiCall<IntelReport>(`${BASE}/research`, { method: "POST", body: JSON.stringify(req) }),

  internalAnalysis: (systemData: Record<string, unknown>) =>
    apiCall<IntelReport>(`${BASE}/internal-analysis`, { method: "POST", body: JSON.stringify(systemData) }),

  listReports: (filters?: { type?: string; line?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.set("type", filters.type);
    if (filters?.line) params.set("line", filters.line);
    if (filters?.status) params.set("status", filters.status);
    const qs = params.toString();
    return apiCall<IntelReport[]>(`${BASE}/reports${qs ? `?${qs}` : ""}`);
  },

  getReport: (id: string) =>
    apiCall<IntelReport>(`${BASE}/reports/${id}`),

  createCampaign: (reportId: string, opportunityId: string) =>
    apiCall<CreateCampaignResult>(`${BASE}/reports/${reportId}/create-campaign`, {
      method: "POST",
      body: JSON.stringify({ opportunityId }),
    }),

  archiveReport: (id: string) =>
    apiCall<IntelReport>(`${BASE}/reports/${id}/archive`, { method: "PUT" }),

  monthly: (systemData?: Record<string, unknown>) =>
    apiCall<MonthlyResult>(`${BASE}/monthly`, {
      method: "POST",
      body: JSON.stringify(systemData ?? {}),
    }),
};
