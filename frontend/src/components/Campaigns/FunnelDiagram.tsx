const STAGE_COLORS: Record<string, string> = {
  awareness: "bg-orange-100 text-orange-700 border-orange-200",
  interest: "bg-blue-100 text-blue-700 border-blue-200",
  nurture: "bg-green-100 text-green-700 border-green-200",
  conversion: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const STAGE_LABELS: Record<string, string> = {
  awareness: "Awareness", interest: "Interés", nurture: "Nutrición", conversion: "Conversión",
};

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: "📱", "facebook-ad": "📘", "linkedin-post": "💼", "instagram-post": "📸",
  "blog-post": "📝", email: "📧", "email-sequence": "📧", "landing-page": "🌐", "social-card": "🎨",
};

interface FunnelDiagramProps {
  funnel: Array<{ stage: string; description: string; channels: string[] }>;
}

export function FunnelDiagram({ funnel }: FunnelDiagramProps) {
  return (
    <div className="space-y-3">
      {funnel.map((stage, i) => (
        <div key={stage.stage} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${STAGE_COLORS[stage.stage] || "bg-gray-100"}`}>
              {i + 1}
            </div>
            {i < funnel.length - 1 && <div className="w-px h-6 bg-gray-300" />}
          </div>
          <div className="flex-1 pb-2">
            <div className="font-semibold text-sm text-near-black">{STAGE_LABELS[stage.stage] || stage.stage}</div>
            <div className="text-xs text-gray-500 mb-2">{stage.description}</div>
            <div className="flex flex-wrap gap-2">
              {stage.channels.map((ch) => (
                <span key={ch} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                  <span>{CHANNEL_ICONS[ch] || "📄"}</span><span>{ch}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
