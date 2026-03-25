import { useActivityStore } from "../../store/activity";

const AGENTS = [
  { role: "orchestrator", label: "Orchestrator" },
  { role: "copywriter", label: "Copywriter" },
  { role: "designer", label: "Designer" },
  { role: "ux-strategist", label: "UX Strategist" },
  { role: "seo-specialist", label: "SEO Specialist" },
  { role: "social-media-manager", label: "Social Media" },
  { role: "brand-guardian", label: "Brand Guardian" },
  { role: "data-analyst", label: "Data Analyst" },
  { role: "competitive-intel", label: "Competitive Intel" },
] as const;

const AGENT_KEYWORDS: Record<string, string[]> = {
  orchestrator: ["campaña creada", "concepto generado"],
  copywriter: ["copywriter", "generando", "blog", "email", "contenido"],
  designer: ["designer", "html", "visual"],
  "ux-strategist": ["concepto", "embudo", "funnel"],
  "seo-specialist": ["seo", "keyword"],
  "social-media-manager": ["social", "linkedin", "instagram", "whatsapp", "facebook"],
  "brand-guardian": ["brand guardian", "brand score", "aprobado por brand"],
  "data-analyst": ["análisis interno", "datos internos"],
  "competitive-intel": ["investigando", "reporte", "mercado", "oportunidades"],
};

function getAgentStatus(role: string, recentMessages: string[]): "idle" | "working" | "done" {
  const keywords = AGENT_KEYWORDS[role] || [];
  const lastFive = recentMessages.slice(0, 5);

  for (const msg of lastFive) {
    const lower = msg.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      if (lower.includes("generando") || lower.includes("investigando") || lower.includes("analizando")) {
        return "working";
      }
      return "done";
    }
  }
  return "idle";
}

const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  idle: { dot: "bg-gray-300", text: "text-gray-500" },
  working: { dot: "bg-yellow-400 animate-pulse", text: "text-yellow-700" },
  done: { dot: "bg-green-500", text: "text-gray-700" },
};

export function AgentPanel() {
  const items = useActivityStore((s) => s.items);
  const recentMessages = items.slice(0, 10).map((i) => i.message);

  return (
    <div>
      <h2 className="text-lg font-bold text-near-black mb-4">Agentes IA</h2>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {AGENTS.map((agent) => {
            const status = getAgentStatus(agent.role, recentMessages);
            const style = STATUS_STYLES[status];
            return (
              <div key={agent.role} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                <span className={`text-sm ${style.text}`}>{agent.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
