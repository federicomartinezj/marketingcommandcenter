import { useEffect } from "react";
import { useIntelStore } from "../../store/intel";
import { ResearchBar } from "./ResearchBar";
import { ReportCard } from "./ReportCard";
import { PerformanceReportCard } from "./PerformanceReportCard";

export function IntelView() {
  const { reports, isLoading, error, fetchReports, runResearch, runInternalAnalysis, createCampaignFromOpportunity, archiveReport, performanceReports, runPerformanceAnalysis, fetchPerformanceReports } =
    useIntelStore();

  useEffect(() => {
    fetchReports();
    fetchPerformanceReports();
  }, [fetchReports, fetchPerformanceReports]);

  const handleResearch = (query: string, line?: string) => {
    runResearch(query, line);
  };

  const handleInternalAnalysis = () => {
    runInternalAnalysis({});
  };

  const activeReports = reports.filter((r) => r.status !== "archived");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-near-black">Inteligencia de Mercado</h1>

      <ResearchBar
        onResearch={handleResearch}
        onInternalAnalysis={handleInternalAnalysis}
        onPerformanceAnalysis={runPerformanceAnalysis}
        isLoading={isLoading}
      />

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Performance reports */}
      {performanceReports.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-near-black">Performance</h2>
          {performanceReports.map((r) => <PerformanceReportCard key={r.id} report={r} />)}
        </div>
      )}

      {/* Report list */}
      {activeReports.length === 0 && !isLoading ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-lg font-bold text-near-black mb-2">No hay reportes</h2>
          <p className="text-sm text-gray-500">
            Usa el buscador para investigar tendencias de mercado o ejecuta un análisis interno.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onCreateCampaign={createCampaignFromOpportunity}
              onArchive={archiveReport}
            />
          ))}
        </div>
      )}
    </div>
  );
}
