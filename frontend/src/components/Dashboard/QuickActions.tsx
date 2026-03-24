interface QuickActionsProps {
  onCreateContent?: () => void;
}

export function QuickActions({ onCreateContent }: QuickActionsProps) {
  const actions = [
    { label: "Nueva Campaña", icon: "📋", onClick: undefined },
    { label: "Crear Contenido", icon: "✍️", onClick: onCreateContent },
    { label: "Reporte", icon: "📊", onClick: undefined },
    { label: "Email Sequence", icon: "📧", onClick: undefined },
    { label: "Post Social", icon: "📱", onClick: undefined },
    { label: "Blog Post", icon: "📝", onClick: undefined },
    { label: "Análisis Competitivo", icon: "🔍", onClick: undefined },
    { label: "Calendario Editorial", icon: "📅", onClick: undefined },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-near-black mb-4">Acciones Rápidas</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={!action.onClick}
            className="bg-near-black text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-electric-blue transition-colors disabled:opacity-50 disabled:hover:bg-near-black flex items-center gap-2"
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
