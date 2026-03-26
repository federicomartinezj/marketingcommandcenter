import { useState } from "react";

const BUSINESS_LINES = [
  "Todas las líneas",
  "Lavanti Black",
  "Lavanti Home",
  "Lavanti Sport",
  "Lavanti Kids",
];

interface ResearchBarProps {
  onResearch: (query: string, line?: string) => void;
  onInternalAnalysis: () => void;
  onPerformanceAnalysis?: () => void;
  isLoading: boolean;
}

export function ResearchBar({ onResearch, onInternalAnalysis, onPerformanceAnalysis, isLoading }: ResearchBarProps) {
  const [query, setQuery] = useState("");
  const [line, setLine] = useState("Todas las líneas");

  const handleResearch = () => {
    const q = query.trim();
    if (!q) return;
    const selectedLine = line === "Todas las líneas" ? undefined : line;
    onResearch(q, selectedLine);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleResearch();
  };

  return (
    <div className="bg-white border rounded-xl px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Query input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="¿Qué quieres investigar? (ej. tendencias en moda sostenible)"
          disabled={isLoading}
          className="flex-1 border rounded-lg px-4 py-2 text-sm text-near-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric-blue disabled:opacity-50"
        />

        {/* Business line selector */}
        <select
          value={line}
          onChange={(e) => setLine(e.target.value)}
          disabled={isLoading}
          className="border rounded-lg px-3 py-2 text-sm text-near-black focus:outline-none focus:ring-2 focus:ring-electric-blue disabled:opacity-50 bg-white"
        >
          {BUSINESS_LINES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        {/* Primary action */}
        <button
          onClick={handleResearch}
          disabled={isLoading || !query.trim()}
          className="bg-electric-blue text-white px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
        >
          {isLoading ? "Investigando..." : "Investigar"}
        </button>

        {/* Secondary action */}
        <button
          onClick={onInternalAnalysis}
          disabled={isLoading}
          className="border border-gray-300 text-near-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          Análisis Interno
        </button>

        <button onClick={onPerformanceAnalysis} disabled={isLoading} className="text-sm text-gray-500 hover:text-purple-500 font-medium ml-4">
          Analizar Performance
        </button>
      </div>
    </div>
  );
}
