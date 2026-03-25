import { randomUUID } from "crypto";
import type { IntelReport, IntelCallbacks, BusinessLine } from "../../shared/types.js";
import {
  competitiveIntelAgent,
  parseQueryGenOutput,
  parseIntelReportOutput,
} from "./competitive-intel.js";
import { dataAnalystAgent, parseDataAnalystOutput } from "./data-analyst.js";
import { tavilySearchMultiple } from "../search/tavily.js";

// ─── Market Research ──────────────────────────────────────────────────────────

export async function runMarketResearch(
  query: string,
  line?: BusinessLine,
  callbacks?: IntelCallbacks
): Promise<IntelReport> {
  // Step 1: Generate search queries
  const queryGenResult = await competitiveIntelAgent.run({
    line: line ?? "OPL",
    userMessage: `Genera queries de búsqueda para investigar el siguiente tema:\n\n${query}`,
  });

  const { queries } = parseQueryGenOutput(queryGenResult.content);

  // Step 2: Notify search started
  callbacks?.onSearchStarted?.(queries);

  // Step 3: Execute searches
  const searchResults = await tavilySearchMultiple(queries);

  callbacks?.onSearchCompleted?.(searchResults.length);

  // Step 4: Notify analysis started
  callbacks?.onAnalysisStarted?.();

  // Step 5: Analyze search results and generate report
  const searchResultsText = searchResults
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
    .join("\n\n");

  const analysisResult = await competitiveIntelAgent.run({
    line: line ?? "OPL",
    userMessage: `Analiza los siguientes resultados de búsqueda y genera un reporte de inteligencia competitiva para la consulta: "${query}"\n\nRESULTADOS:\n${searchResultsText}`,
  });

  const reportOutput = parseIntelReportOutput(analysisResult.content);

  // Step 6: Build IntelReport with UUIDs on opportunities
  const report: IntelReport = {
    id: randomUUID(),
    type: "market-research",
    title: reportOutput.title,
    summary: reportOutput.summary,
    line,
    query,
    trends: reportOutput.trends,
    opportunities: reportOutput.opportunities.map((opp) => ({
      ...opp,
      id: randomUUID(),
    })),
    sources: reportOutput.sources,
    status: "ready",
    createdAt: new Date().toISOString(),
  };

  // Step 7: Notify report ready
  callbacks?.onReportReady?.(report);

  return report;
}

// ─── Internal Analysis ────────────────────────────────────────────────────────

export async function runInternalAnalysis(
  systemData: Record<string, unknown>,
  callbacks?: IntelCallbacks
): Promise<IntelReport> {
  // Step 1: Notify analysis started
  callbacks?.onAnalysisStarted?.();

  // Step 2: Format system data as text
  const systemDataText = Object.entries(systemData)
    .map(([key, value]) => `## ${key}\n${JSON.stringify(value, null, 2)}`)
    .join("\n\n");

  // Step 3: Run data analyst agent
  const analysisResult = await dataAnalystAgent.run({
    line: "OPL",
    userMessage: `Analiza los siguientes datos internos del Command Center y genera un reporte de inteligencia:\n\n${systemDataText}`,
  });

  const dataOutput = parseDataAnalystOutput(analysisResult.content);

  // Step 4: Build IntelReport type="internal-analysis"
  const report: IntelReport = {
    id: randomUUID(),
    type: "internal-analysis",
    title: dataOutput.title,
    summary: dataOutput.summary,
    query: "internal-analysis",
    trends: dataOutput.trends,
    opportunities: dataOutput.opportunities.map((opp) => ({
      ...opp,
      id: randomUUID(),
    })),
    sources: [],
    status: "ready",
    createdAt: new Date().toISOString(),
  };

  return report;
}
