import { useState } from "react";

interface BriefScreenProps {
  onSubmit: (brief: string, line: string, audience: string, objective: string) => void;
  isLoading: boolean;
}

const LINES = [
  { value: "OPL", label: "OPL — Venta de equipos" },
  { value: "AAS", label: "AAS — Renting / LaaS" },
  { value: "MH", label: "Multihousing" },
  { value: "Volta", label: "Volta — Lavanderías" },
];

export function BriefScreen({ onSubmit, isLoading }: BriefScreenProps) {
  const [brief, setBrief] = useState("");
  const [line, setLine] = useState("OPL");
  const [audience, setAudience] = useState("");
  const [objective, setObjective] = useState("");

  const canSubmit = brief.trim() && line && audience.trim();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-near-black">Nueva Campaña</h2>
        <p className="text-sm text-gray-500 mt-1">Describe tu campaña y el sistema generará el plan</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-near-black mb-2">Brief de la campaña</label>
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={5}
          placeholder="Describe la campaña: a quién va dirigida, qué quieres comunicar, qué acción quieres que tomen..."
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-near-black mb-2">Línea de negocio</label>
          <select value={line} onChange={(e) => setLine(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue">
            {LINES.map((l) => (<option key={l.value} value={l.value}>{l.label}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-near-black mb-2">Audiencia / Target</label>
          <input value={audience} onChange={(e) => setAudience(e.target.value)}
            placeholder="Ej: Jefes de mantenimiento hotelero"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-near-black mb-2">Objetivo (opcional)</label>
        <input value={objective} onChange={(e) => setObjective(e.target.value)}
          placeholder="Ej: Generar 20 leads calificados en 30 días"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue" />
      </div>
      <button onClick={() => onSubmit(brief, line, audience, objective)}
        disabled={!canSubmit || isLoading}
        className="w-full bg-electric-blue text-white rounded-lg px-6 py-3 font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50">
        {isLoading ? "Analizando brief..." : "Analizar Brief"}
      </button>
    </div>
  );
}
