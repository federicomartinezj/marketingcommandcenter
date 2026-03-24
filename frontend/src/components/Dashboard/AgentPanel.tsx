const AGENTS = [
  { role: "orchestrator", label: "Orchestrator" },
  { role: "copywriter", label: "Copywriter" },
  { role: "designer", label: "Designer" },
  { role: "ux-strategist", label: "UX Strategist" },
  { role: "business-analyst", label: "Business Analyst" },
  { role: "seo-specialist", label: "SEO Specialist" },
  { role: "social-media-manager", label: "Social Media" },
  { role: "brand-guardian", label: "Brand Guardian" },
  { role: "data-analyst", label: "Data Analyst" },
  { role: "competitive-intel", label: "Competitive Intel" },
] as const;

export function AgentPanel() {
  return (
    <div>
      <h2 className="text-lg font-bold text-near-black mb-4">Agentes IA</h2>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {AGENTS.map((agent) => (
            <div key={agent.role} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-sm text-gray-700">{agent.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
