import { useEffect, useState } from "react";
import { campaignApi } from "../../lib/campaign-api";
import type { Campaign } from "../../lib/campaign-api";
import { FunnelDiagram } from "./FunnelDiagram";
import { VariantSelector } from "./VariantSelector";
import { MetricsForm } from "./MetricsForm";
import { metricsApi } from "../../lib/metrics-api";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "bg-gray-100 text-gray-600" },
  planning: { label: "Planificando...", color: "bg-blue-100 text-blue-700" },
  planned: { label: "Plan listo", color: "bg-blue-100 text-blue-700" },
  generating: { label: "Generando...", color: "bg-yellow-100 text-yellow-700" },
  review: { label: "En revisión", color: "bg-orange-100 text-orange-700" },
  approved: { label: "Aprobada", color: "bg-green-100 text-green-700" },
  exported: { label: "Exportada", color: "bg-green-100 text-green-700" },
};

export function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [metricsChannel, setMetricsChannel] = useState<string | null>(null);

  const fetchAll = async () => {
    const data = await campaignApi.list();
    setCampaigns(data);
  };

  useEffect(() => { fetchAll(); }, []);

  const [finalizingChannel, setFinalizingChannel] = useState<string | null>(null);

  // Auto-poll every 5s when something is in progress
  const hasActiveWork = loading !== null || finalizingChannel !== null ||
    campaigns.some((c) => c.status === "generating" || c.status === "planning");

  useEffect(() => {
    if (!hasActiveWork) return;
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [hasActiveWork]);

  const handleGenerate = async (id: string) => {
    setLoading(id);
    try {
      await campaignApi.generate(id);
      await fetchAll();
    } catch (err) {
      alert(`Error generando: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoading(null);
  };

  const handleFinalize = async (campaignId: string, channelId: string) => {
    setFinalizingChannel(channelId);
    try {
      await campaignApi.finalizeChannel(campaignId, channelId);
      await fetchAll();
    } catch (err) {
      alert(`Error finalizando: ${err instanceof Error ? err.message : String(err)}`);
    }
    setFinalizingChannel(null);
  };

  const handleApprove = async (id: string) => {
    await campaignApi.approve(id);
    await fetchAll();
  };

  const handleSelectVariant = async (campaignId: string, channelId: string, variantId: string) => {
    await campaignApi.selectVariant(campaignId, channelId, variantId);
    await fetchAll();
    // Auto-finalize: generate HTML + SEO + Brand Review for selected variant
    setFinalizingChannel(channelId);
    try {
      await campaignApi.finalizeChannel(campaignId, channelId);
      await fetchAll();
    } catch {
      // Silent fail — user can retry manually
    }
    setFinalizingChannel(null);
  };

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">📋</div>
        <h2 className="text-lg font-bold text-near-black mb-2">No hay campañas</h2>
        <p className="text-sm text-gray-500">Crea una nueva campaña desde el Dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-near-black">Campañas</h1>

      {campaigns.map((campaign) => {
        const status = STATUS_LABELS[campaign.status] || STATUS_LABELS.draft;
        const isExpanded = expanded === campaign.id;
        const isGenerating = loading === campaign.id;

        return (
          <div key={campaign.id} className="bg-white border rounded-xl overflow-hidden">
            {/* Header — click to expand */}
            <button
              onClick={() => setExpanded(isExpanded ? null : campaign.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-near-black truncate">
                    {campaign.name || "Campaña sin nombre"}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                {campaign.concept && (
                  <div className="text-sm text-gray-500">"{campaign.concept}"</div>
                )}
                <div className="flex gap-4 text-xs text-gray-400 mt-1">
                  <span>{campaign.line}</span>
                  <span>{campaign.audience}</span>
                  <span>{campaign.channels.length} canales</span>
                  <span>{new Date(campaign.createdAt).toLocaleDateString("es-CO")}</span>
                </div>
              </div>
              <span className="text-gray-400 ml-4">{isExpanded ? "▲" : "▼"}</span>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="border-t px-5 py-4 space-y-5">
                {/* Funnel */}
                {campaign.funnel.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-near-black mb-3">Embudo</h3>
                    <FunnelDiagram funnel={campaign.funnel} />
                  </div>
                )}

                {/* Channels with variants */}
                {campaign.channels.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-near-black mb-3">Canales</h3>
                    <div className="space-y-3">
                      {campaign.channels.map((channel) => (
                        <div key={channel.id} className="border rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{channel.channel}</span>
                              <span className="text-xs text-gray-400">({channel.funnelStage})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {channel.brandReview && (
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  channel.brandReview.approved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}>
                                  Brand: {channel.brandReview.score}/100
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                STATUS_LABELS[channel.status]?.color || "bg-gray-100 text-gray-600"
                              }`}>
                                {STATUS_LABELS[channel.status]?.label || channel.status}
                              </span>
                            </div>
                          </div>
                          {channel.variants.length > 0 && (
                            <div className="p-3">
                              <VariantSelector
                                variants={channel.variants}
                                onSelect={(variantId) => handleSelectVariant(campaign.id, channel.id, variantId)}
                              />
                            </div>
                          )}
                          {/* Finalize button — generates design + SEO + brand review for selected variant */}
                          {channel.variants.some((v) => v.selected) && !channel.designHtml && !channel.brandReview && (
                            <div className="px-3 pb-3">
                              {finalizingChannel === channel.id ? (
                                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                                  <span className="text-sm text-yellow-700 font-medium animate-pulse">
                                    Generando diseño HTML + SEO + Brand Review para variante seleccionada...
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleFinalize(campaign.id, channel.id)}
                                  className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                                >
                                  Generar Pieza Final (HTML + SEO + Brand Review)
                                </button>
                              )}
                            </div>
                          )}
                          {/* Finalized badge + download */}
                          {channel.designHtml && (
                            <div className="px-3 pb-2 flex items-center gap-3">
                              {channel.brandReview && (
                                <span className="text-xs text-green-600 font-medium">✓ Pieza finalizada</span>
                              )}
                              <button
                                onClick={() => {
                                  const w = window.open("", "_blank");
                                  if (w) { w.document.write(channel.designHtml!); w.document.close(); }
                                }}
                                className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                              >
                                Ver HTML
                              </button>
                              <button
                                onClick={() => {
                                  const blob = new Blob([channel.designHtml!], { type: "text/html" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `${campaign.name || "campaign"}-${channel.channel}-${channel.funnelStage}.html`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="text-xs text-green-600 hover:text-green-800 font-medium"
                              >
                                Descargar HTML
                              </button>
                              {channel.variants.find((v) => v.selected) && (
                                <button
                                  onClick={() => {
                                    const selected = channel.variants.find((v) => v.selected);
                                    if (!selected) return;
                                    const blob = new Blob([selected.content], { type: "text/markdown" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `${campaign.name || "campaign"}-${channel.channel}-copy.md`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                                >
                                  Descargar Copy
                                </button>
                              )}
                            </div>
                          )}
                          {/* Image Prompts extracted from designHtml */}
                          {channel.designHtml && (() => {
                            const prompts = [...channel.designHtml.matchAll(/<!--\s*IMAGE_PROMPT:\s*([\s\S]*?)\s*-->/g)].map(m => m[1].trim());
                            if (prompts.length === 0) return null;
                            return (
                              <div className="px-3 pb-3">
                                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Prompts de Imagen</div>
                                <div className="space-y-2">
                                  {prompts.map((prompt, i) => (
                                    <div key={i} className="bg-purple-50 rounded-lg p-3 flex items-start gap-2">
                                      <span className="text-xs text-gray-700 flex-1 font-mono leading-relaxed">{prompt}</span>
                                      <button
                                        onClick={() => navigator.clipboard.writeText(prompt)}
                                        className="text-xs text-purple-600 hover:text-purple-800 font-semibold shrink-0"
                                      >
                                        Copiar
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                          {(campaign.status === "approved" || campaign.status === "exported") && (
                            <div className="px-3 pb-3">
                              {metricsChannel !== channel.id ? (
                                <button
                                  onClick={() => setMetricsChannel(channel.id)}
                                  className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                                >
                                  Reportar Resultados
                                </button>
                              ) : (
                                <MetricsForm
                                  channel={channel.channel}
                                  variants={channel.variants.map((v) => ({ label: v.label, selected: v.selected }))}
                                  onSubmit={async (data) => {
                                    await metricsApi.report(campaign.id, channel.id, data);
                                    setMetricsChannel(null);
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress summary */}
                {campaign.status === "review" && (() => {
                  const total = campaign.channels.filter((ch) => ch.variants.length > 0).length;
                  const selected = campaign.channels.filter((ch) => ch.variants.some((v) => v.selected)).length;
                  const finalized = campaign.channels.filter((ch) => ch.designHtml || ch.brandReview).length;
                  const finalizing = finalizingChannel ? 1 : 0;
                  return (
                    <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                      <span className="font-semibold">Progreso:</span> {selected}/{total} variantes seleccionadas · {finalized}/{total} piezas finalizadas
                      {finalizing > 0 && <span className="animate-pulse"> · Generando pieza...</span>}
                      {finalized === total && total > 0 && <span className="text-green-600 font-semibold"> · ¡Listo para aprobar!</span>}
                    </div>
                  );
                })()}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {campaign.status === "planned" && (
                    <button
                      onClick={() => handleGenerate(campaign.id)}
                      disabled={isGenerating}
                      className="bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isGenerating ? "Generando variantes de copy..." : "Generar Variantes de Copy"}
                    </button>
                  )}
                  {(campaign.status === "review" || campaign.status === "generating") && (() => {
                    const allFinalized = campaign.channels.every((ch) => ch.variants.length === 0 || (ch.designHtml || ch.brandReview));
                    return (
                      <button
                        onClick={() => handleApprove(campaign.id)}
                        disabled={!allFinalized}
                        className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                      >
                        {allFinalized ? "Aprobar Campaña" : "Selecciona variantes para aprobar"}
                      </button>
                    );
                  })()}
                  {(campaign.status === "approved" || campaign.status === "exported") && (
                    <a
                      href={campaignApi.exportUrl(campaign.id)}
                      className="bg-near-black text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800"
                    >
                      Descargar ZIP
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
