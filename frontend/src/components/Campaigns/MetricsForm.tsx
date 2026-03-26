import { useState } from "react";

const CHANNEL_FIELDS: Record<string, string[]> = {
  "facebook-ad": ["impressions", "clicks", "ctr", "leads", "cost"],
  "linkedin-post": ["impressions", "clicks", "ctr", "leads", "cost"],
  "instagram-post": ["impressions", "clicks", "ctr", "leads", "cost"],
  "email": ["impressions", "openRate", "clicks", "ctr", "leads"],
  "email-sequence": ["impressions", "openRate", "clicks", "ctr", "leads"],
  "blog-post": ["impressions", "bounceRate", "leads"],
  "landing-page": ["impressions", "clicks", "ctr", "conversions", "bounceRate"],
  "whatsapp": ["impressions", "clicks", "leads"],
};

const FIELD_LABELS: Record<string, string> = {
  impressions: "Impresiones", clicks: "Clicks", ctr: "CTR (%)",
  leads: "Leads", conversions: "Conversiones", cost: "Inversión (COP)",
  openRate: "Open Rate (%)", bounceRate: "Bounce Rate (%)",
};

interface MetricsFormProps {
  channel: string;
  variants: Array<{ label: string; selected: boolean }>;
  onSubmit: (data: { variantLabel: string; platform: string; metrics: Record<string, number | undefined>; notes?: string }) => void;
}

export function MetricsForm({ channel, variants, onSubmit }: MetricsFormProps) {
  const fields = CHANNEL_FIELDS[channel] || ["impressions", "clicks", "leads"];
  const selectedVariant = variants.find((v) => v.selected)?.label || "A";
  const [variantLabel, setVariantLabel] = useState(selectedVariant);
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const parsed: Record<string, number | undefined> = {};
    for (const field of fields) { parsed[field] = metrics[field] ? Number(metrics[field]) : undefined; }
    onSubmit({ variantLabel, platform: channel, metrics: parsed, notes: notes || undefined });
    setSubmitted(true);
  };

  if (submitted) return <div className="text-sm text-green-600 font-medium py-2">Métricas guardadas ✓</div>;

  return (
    <div className="bg-blue-50 rounded-lg p-4 space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-500">Variante publicada</label>
        <select value={variantLabel} onChange={(e) => setVariantLabel(e.target.value)} className="block mt-1 rounded border border-gray-300 px-2 py-1 text-sm">
          {["A", "B", "C"].map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {fields.map((field) => (
          <div key={field}>
            <label className="text-xs text-gray-500">{FIELD_LABELS[field] || field}</label>
            <input type="number" value={metrics[field] || ""} onChange={(e) => setMetrics({ ...metrics, [field]: e.target.value })}
              className="block w-full mt-1 rounded border border-gray-300 px-2 py-1 text-sm" placeholder="0" />
          </div>
        ))}
      </div>
      <div>
        <label className="text-xs text-gray-500">Notas (opcional)</label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="block w-full mt-1 rounded border border-gray-300 px-2 py-1 text-sm" placeholder="Observaciones..." />
      </div>
      <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-600">Guardar Métricas</button>
    </div>
  );
}
