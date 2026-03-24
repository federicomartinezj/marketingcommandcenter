import { useCampaignStore } from "../../store/campaign";
import { useEffect } from "react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador", planning: "Planificando...", planned: "Plan listo",
  generating: "Generando...", review: "En revisión", approved: "Aprobada", exported: "Exportada",
};

export function CampaignCards() {
  const { campaigns, fetchCampaigns } = useCampaignStore();

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  if (campaigns.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-bold text-near-black mb-4">Campañas Activas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.slice(0, 4).map((c) => (
          <div key={c.id} className="bg-white border rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold text-sm text-near-black truncate">{c.name || "Nueva campaña"}</div>
              <span className="text-xs px-2 py-1 rounded bg-gray-100">{STATUS_LABELS[c.status] || c.status}</span>
            </div>
            {c.concept && <div className="text-xs text-gray-500 mb-2">"{c.concept}"</div>}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{c.line}</span>
              <span>{c.channels.length} canales</span>
              <span>{new Date(c.createdAt).toLocaleDateString("es-CO")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
