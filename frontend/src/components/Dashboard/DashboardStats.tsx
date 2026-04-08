import { useEffect, useState } from "react";
import { StatCard } from "./StatCard";
import { listContent } from "../../lib/api";
import { campaignApi } from "../../lib/campaign-api";
import { intelApi } from "../../lib/intel-api";

interface Stats {
  activeCampaigns: number;
  contentPieces: number;
  avgBrandScore: string;
  opportunities: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    activeCampaigns: 0,
    contentPieces: 0,
    avgBrandScore: "—",
    opportunities: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const [content, campaigns, reports] = await Promise.all([
          listContent().catch(() => []),
          campaignApi.list().catch(() => []),
          intelApi.listReports().catch(() => []),
        ]);

        // Active campaigns (not archived/exported)
        const activeCampaigns = campaigns.filter(
          (c) => c.status !== "exported"
        ).length;

        // Content pieces this month
        const now = new Date();
        const thisMonth = content.filter((c) => {
          const d = new Date(c.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });

        // Average brand score across all content with reviews
        const scores = content
          .filter((c) => c.brandReview?.score != null)
          .map((c) => c.brandReview!.score);
        const avgScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

        // Unactioned opportunities
        const readyReports = reports.filter((r) => r.status === "ready");
        const totalOpps = readyReports.reduce((sum, r) => {
          return sum + r.opportunities.filter((o) => !o.campaignId).length;
        }, 0);

        setStats({
          activeCampaigns,
          contentPieces: thisMonth.length,
          avgBrandScore: scores.length > 0 ? `${avgScore}/100` : "—",
          opportunities: totalOpps,
        });
      } catch {
        // Keep defaults on error
      }
    }
    load();
    // Refresh stats every 30s
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Campañas Activas" value={stats.activeCampaigns} icon="📣" />
      <StatCard label="Contenido Este Mes" value={stats.contentPieces} icon="📝" />
      <StatCard label="Brand Score Prom." value={stats.avgBrandScore} icon="🛡️" />
      <StatCard label="Oportunidades" value={stats.opportunities} icon="🔍" />
    </div>
  );
}
