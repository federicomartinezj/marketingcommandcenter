import { describe, it, expect } from "vitest";
import { parseTavilyResponse, buildTavilyRequest } from "./tavily.js";

describe("Tavily Search", () => {
  it("builds correct request body", () => {
    const req = buildTavilyRequest("hoteles Colombia 2026", 5);
    expect(req.query).toBe("hoteles Colombia 2026");
    expect(req.max_results).toBe(5);
    expect(req.search_depth).toBe("basic");
  });

  it("parses Tavily response into SearchResult[]", () => {
    const raw = {
      results: [
        { title: "Hotel news", url: "https://example.com/1", content: "Hotels are growing" },
        { title: "Laundry trends", url: "https://example.com/2", content: "Industrial laundry demand up" },
      ],
    };
    const results = parseTavilyResponse(raw);
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe("Hotel news");
  });

  it("handles empty results", () => {
    expect(parseTavilyResponse({ results: [] })).toHaveLength(0);
  });
});
