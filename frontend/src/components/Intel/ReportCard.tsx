import { useState } from "react";
import type { IntelReport } from "../../lib/intel-api";

const TYPE_BADGES: Record<string, string> = {
  market: "bg-blue-100 text-blue-700",
  internal: "bg-purple-100 text-purple-700",
};

const TYPE_LABELS: Record<string, string> = {
  market: "Mercado",
  internal: "Interno",
};

const RELEVANCE_BADGES: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

const RELEVANCE_LABELS: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const URGENCY_BADGES: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

const URGENCY_LABELS: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

interface ReportCardProps {
  report: IntelReport;
  onCreateCampaign: (reportId: string, opportunityId: string) => void;
  onArchive: (reportId: string) => void;
}

export function ReportCard({ report, onCreateCampaign, onArchive }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false);

  const typeBadge = TYPE_BADGES[report.type] ?? "bg-gray-100 text-gray-600";
  const typeLabel = TYPE_LABELS[report.type] ?? report.type;
  const formattedDate = new Date(report.createdAt).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      {/* Header — click to expand */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-bold text-near-black truncate">{report.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadge}`}>
              {typeLabel}
            </span>
            {report.line && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                {report.line}
              </span>
            )}
          </div>
          <div className="flex gap-4 text-xs text-gray-400 mt-1">
            <span>{report.trends.length} tendencias</span>
            <span>{report.opportunities.length} oportunidades</span>
            <span>{formattedDate}</span>
          </div>
        </div>
        <span className="text-gray-400 ml-4 flex-shrink-0">{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t px-5 py-4 space-y-5">
          {/* Summary */}
          {report.summary && (
            <div>
              <h3 className="font-semibold text-sm text-near-black mb-1">Resumen</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{report.summary}</p>
            </div>
          )}

          {/* Trends */}
          {report.trends.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-near-black mb-2">Tendencias</h3>
              <div className="space-y-2">
                {report.trends.map((trend, i) => {
                  const relevanceBadge = RELEVANCE_BADGES[trend.relevance] ?? "bg-gray-100 text-gray-600";
                  const relevanceLabel = RELEVANCE_LABELS[trend.relevance] ?? trend.relevance;
                  return (
                    <div key={i} className="flex items-start gap-3 border rounded-lg px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${relevanceBadge}`}>
                        {relevanceLabel}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-near-black">{trend.trend}</p>
                        {trend.detail && (
                          <p className="text-xs text-gray-500 mt-0.5">{trend.detail}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {report.opportunities.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-near-black mb-2">Oportunidades</h3>
              <div className="space-y-2">
                {report.opportunities.map((opp) => {
                  const urgencyBadge = URGENCY_BADGES[opp.urgency] ?? "bg-gray-100 text-gray-600";
                  const urgencyLabel = URGENCY_LABELS[opp.urgency] ?? opp.urgency;
                  return (
                    <div key={opp.id} className="border rounded-lg px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgencyBadge}`}>
                              Urgencia: {urgencyLabel}
                            </span>
                            {opp.suggestedLine && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {opp.suggestedLine}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-near-black">{opp.description}</p>
                          {opp.targetSegment && (
                            <p className="text-xs text-gray-500 mt-1">Segmento: {opp.targetSegment}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {opp.campaignId ? (
                            <span className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-medium">
                              Campaña creada
                            </span>
                          ) : (
                            <button
                              onClick={() => onCreateCampaign(report.id, opp.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-electric-blue text-white font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                            >
                              Crear Campaña
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sources */}
          {report.sources.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-near-black mb-2">Fuentes</h3>
              <ul className="space-y-1">
                {report.sources.map((source, i) => (
                  <li key={i}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-electric-blue hover:underline truncate block"
                      title={source.snippet}
                    >
                      {source.title || source.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-2 border-t flex justify-end">
            <button
              onClick={() => onArchive(report.id)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Archivar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
