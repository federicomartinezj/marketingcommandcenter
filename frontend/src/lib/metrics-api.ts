const METRICS_BASE = "/api/metrics";
const ANALYTICS_BASE = "/api/analytics";

export interface CampaignMetrics {
  id: string; campaignId: string; channelId: string;
  variantLabel: string; platform: string;
  metrics: Record<string, number | undefined>;
  notes?: string; reportedAt: string;
}

export interface PerformanceReport {
  id: string; title: string; summary: string;
  insights: Array<{ finding: string; recommendation: string; impact: string }>;
  linePerformance: Array<{ line: string; campaigns: number; avgCTR: number; totalLeads: number; topChannel: string }>;
  variantAnalysis: Array<{ label: string; angle: string; avgCTR: number; timesSelected: number; timesPublished: number }>;
  recommendations: string[];
  createdAt: string;
}

async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Unknown" })); throw new Error(e.error || `API error: ${res.status}`); }
  return res.json();
}

export const metricsApi = {
  report: (campaignId: string, channelId: string, data: { variantLabel: string; platform: string; metrics: Record<string, number | undefined>; notes?: string }) =>
    apiCall<CampaignMetrics>(`${METRICS_BASE}/campaigns/${campaignId}/channels/${channelId}`, { method: "POST", body: JSON.stringify(data) }),
  list: (campaignId?: string) => {
    const qs = campaignId ? `?campaignId=${campaignId}` : "";
    return apiCall<CampaignMetrics[]>(`${METRICS_BASE}${qs}`);
  },
};

export const analyticsApi = {
  runPerformance: () => apiCall<PerformanceReport>(`${ANALYTICS_BASE}/performance`, { method: "POST" }),
  listReports: () => apiCall<PerformanceReport[]>(`${ANALYTICS_BASE}/reports`),
  getReport: (id: string) => apiCall<PerformanceReport>(`${ANALYTICS_BASE}/reports/${id}`),
};
