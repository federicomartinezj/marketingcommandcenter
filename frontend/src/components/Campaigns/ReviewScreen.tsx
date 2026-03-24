import type { Campaign } from "../../lib/campaign-api";
import { VariantSelector } from "./VariantSelector";
import { campaignApi } from "../../lib/campaign-api";

interface ReviewScreenProps {
  campaign: Campaign;
  onSelectVariant: (channelId: string, variantId: string) => void;
  onRegenerate: (channelId: string) => void;
  onApprove: () => void;
  isLoading: boolean;
}

export function ReviewScreen({ campaign, onSelectVariant, onRegenerate, onApprove, isLoading }: ReviewScreenProps) {
  const allSelected = campaign.channels
    .filter((c) => c.status === "ready" || c.status === "approved")
    .every((c) => c.variants.some((v) => v.selected));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-near-black">Revisión de Campaña</h2>
        <p className="text-sm text-gray-500 mt-1">Selecciona la mejor variante para cada canal</p>
      </div>
      {campaign.channels.map((channel) => (
        <div key={channel.id} className="border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
            <div>
              <span className="font-semibold text-sm">{channel.channel}</span>
              <span className="text-xs text-gray-500 ml-2">({channel.funnelStage})</span>
            </div>
            <div className="flex items-center gap-3">
              {channel.brandReview && (
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  channel.brandReview.approved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>Brand: {channel.brandReview.score}/100</span>
              )}
              {channel.status === "error" && (
                <button onClick={() => onRegenerate(channel.id)}
                  className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Regenerar</button>
              )}
            </div>
          </div>
          <div className="p-4">
            {channel.variants.length > 0 ? (
              <VariantSelector variants={channel.variants}
                onSelect={(variantId) => onSelectVariant(channel.id, variantId)} />
            ) : (
              <div className="text-sm text-gray-400 text-center py-4">
                {channel.status === "error" ? "Error generando este canal" : "Sin variantes"}
              </div>
            )}
          </div>
        </div>
      ))}
      <div className="flex gap-3">
        <button onClick={onApprove} disabled={!allSelected || isLoading}
          className="flex-1 bg-blue-500 text-white rounded-lg px-6 py-3 font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50">
          Aprobar Campaña
        </button>
        <a href={campaign.status === "approved" || campaign.status === "exported" ? campaignApi.exportUrl(campaign.id) : "#"}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            campaign.status === "approved" || campaign.status === "exported"
              ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-200 text-gray-400 pointer-events-none"
          }`}>Exportar ZIP</a>
      </div>
    </div>
  );
}
