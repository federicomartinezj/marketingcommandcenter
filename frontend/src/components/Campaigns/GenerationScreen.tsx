import type { Campaign } from "../../lib/campaign-api";

const STATUS_DISPLAY: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "En espera", color: "text-gray-400", icon: "⏳" },
  generating: { label: "Generando...", color: "text-blue-500", icon: "⚡" },
  ready: { label: "Listo", color: "text-green-600", icon: "✓" },
  error: { label: "Error", color: "text-red-500", icon: "✕" },
  approved: { label: "Aprobado", color: "text-green-600", icon: "✓" },
};

interface GenerationScreenProps { campaign: Campaign; }

export function GenerationScreen({ campaign }: GenerationScreenProps) {
  const totalChannels = campaign.channels.length;
  const readyCount = campaign.channels.filter((c) => c.status === "ready" || c.status === "approved").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-near-black">Generando Campaña</h2>
        <p className="text-sm text-gray-500 mt-1">"{campaign.concept}"</p>
      </div>
      <div>
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>{readyCount} de {totalChannels} canales</span>
          <span>{Math.round((readyCount / totalChannels) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(readyCount / totalChannels) * 100}%` }} />
        </div>
      </div>
      <div className="space-y-3">
        {campaign.channels.map((channel) => {
          const display = STATUS_DISPLAY[channel.status] || STATUS_DISPLAY.pending;
          return (
            <div key={channel.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">{display.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-near-black">{channel.channel}</div>
                  <div className="text-xs text-gray-500">{channel.funnelStage}</div>
                </div>
              </div>
              <span className={`text-sm font-medium ${display.color}`}>{display.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
