import type { Campaign } from "../../lib/campaign-api";
import { FunnelDiagram } from "./FunnelDiagram";

interface PlanScreenProps {
  campaign: Campaign;
  onApprove: () => void;
  isLoading: boolean;
}

export function PlanScreen({ campaign, onApprove, isLoading }: PlanScreenProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-near-black">Plan de Campaña</h2>
        <p className="text-sm text-gray-500 mt-1">Revisa el plan generado antes de generar contenido</p>
      </div>
      <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-5">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Concepto</div>
        <div className="text-lg font-bold text-near-black">"{campaign.concept}"</div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Línea</div>
          <div className="font-semibold">{campaign.line}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Audiencia</div>
          <div className="font-semibold">{campaign.audience}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Piezas a generar</div>
          <div className="font-semibold">{campaign.channels.length} canales</div>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-near-black mb-3">Embudo</h3>
        <FunnelDiagram funnel={campaign.funnel} />
      </div>
      <button onClick={onApprove} disabled={isLoading}
        className="w-full bg-electric-blue text-white rounded-lg px-6 py-3 font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50">
        {isLoading ? "Generando contenido..." : "Aprobar Plan y Generar Contenido"}
      </button>
    </div>
  );
}
