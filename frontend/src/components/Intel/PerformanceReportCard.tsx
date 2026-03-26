import { useState } from "react";

interface PerformanceReportCardProps {
  report: {
    id: string; title: string; summary: string;
    insights: Array<{ finding: string; recommendation: string; impact: string }>;
    linePerformance: Array<{ line: string; campaigns: number; avgCTR: number; totalLeads: number; topChannel: string }>;
    variantAnalysis: Array<{ label: string; angle: string; avgCTR: number; timesSelected: number; timesPublished: number }>;
    recommendations: string[];
    createdAt: string;
  };
}

const IMPACT_COLORS: Record<string, string> = { high: "bg-red-100 text-red-700", medium: "bg-yellow-100 text-yellow-700", low: "bg-gray-100 text-gray-600" };

export function PerformanceReportCard({ report }: PerformanceReportCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-bold text-near-black truncate">{report.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">Performance</span>
          </div>
          <div className="flex gap-4 text-xs text-gray-400">
            <span>{report.insights.length} insights</span>
            <span>{report.recommendations.length} recomendaciones</span>
            <span>{new Date(report.createdAt).toLocaleDateString("es-CO")}</span>
          </div>
        </div>
        <span className="text-gray-400 ml-4">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="border-t px-5 py-4 space-y-5">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.summary}</p>
          {report.insights.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-near-black mb-2">Insights</h4>
              <div className="space-y-2">
                {report.insights.map((ins, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 flex items-start gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${IMPACT_COLORS[ins.impact] || ""}`}>{ins.impact}</span>
                    <div><div className="text-sm font-medium text-near-black">{ins.finding}</div><div className="text-xs text-gray-500 mt-1">{ins.recommendation}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {report.variantAnalysis.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-near-black mb-2">Variantes A/B/C</h4>
              <div className="grid grid-cols-3 gap-3">
                {report.variantAnalysis.map((v) => (
                  <div key={v.label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-near-black">{v.label}</div>
                    <div className="text-xs text-gray-500">{v.angle}</div>
                    <div className="text-sm font-semibold text-blue-600 mt-1">CTR: {v.avgCTR}%</div>
                    <div className="text-xs text-gray-400">Publicada {v.timesPublished}x</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {report.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-near-black mb-2">Recomendaciones</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">{report.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
