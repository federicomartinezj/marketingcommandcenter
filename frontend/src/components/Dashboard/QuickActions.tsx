interface QuickActionsProps {
  onCreateContent?: (type?: string) => void;
  onCreateCampaign?: () => void;
  onNavigate?: (view: string) => void;
}

export function QuickActions({ onCreateContent, onCreateCampaign, onNavigate }: QuickActionsProps) {
  const actions = [
    { label: "Nueva Campaña", icon: "📋", onClick: () => onCreateCampaign?.() },
    { label: "Crear Contenido", icon: "✍️", onClick: () => onCreateContent?.() },
    { label: "Investigar Mercado", icon: "🔍", onClick: () => onNavigate?.("intel") },
    { label: "Email Sequence", icon: "📧", onClick: () => onCreateContent?.("email-sequence") },
    { label: "Post Social", icon: "📱", onClick: () => onCreateContent?.("linkedin-post") },
    { label: "Blog Post", icon: "📝", onClick: () => onCreateContent?.("blog-post") },
    { label: "Ver Campañas", icon: "📊", onClick: () => onNavigate?.("campaigns") },
    { label: "Calendario", icon: "📅", onClick: () => onNavigate?.("calendar") },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-near-black mb-4">Acciones Rápidas</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="bg-near-black text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-electric-blue transition-colors flex items-center gap-2"
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
