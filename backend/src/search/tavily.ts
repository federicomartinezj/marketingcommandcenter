export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export function buildTavilyRequest(query: string, maxResults: number = 5) {
  return { query, max_results: maxResults, search_depth: "basic" as const };
}

export function parseTavilyResponse(raw: { results: Array<{ title: string; url: string; content: string }> }): SearchResult[] {
  return (raw.results || []).map((r) => ({ title: r.title, url: r.url, content: r.content }));
}

export async function tavilySearch(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY environment variable is not set");
  const body = buildTavilyRequest(query, maxResults);
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, api_key: apiKey }),
  });
  if (!response.ok) throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
  const data = await response.json();
  return parseTavilyResponse(data);
}

export async function tavilySearchMultiple(queries: string[], maxResultsPerQuery: number = 5): Promise<SearchResult[]> {
  const results = await Promise.all(queries.map((q) => tavilySearch(q, maxResultsPerQuery).catch(() => [])));
  const seen = new Set<string>();
  const deduped: SearchResult[] = [];
  for (const batch of results) {
    for (const r of batch) {
      if (!seen.has(r.url)) { seen.add(r.url); deduped.push(r); }
    }
  }
  return deduped;
}
