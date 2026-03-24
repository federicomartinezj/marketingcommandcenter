const PLACEHOLDER_ITEMS = [
  { type: "success" as const, message: 'Blog post "5 señales de que tu hotel necesita..." aprobado por Brand Guardian — listo para publicar' },
  { type: "working" as const, message: "Email sequence AAS Q2 — Copywriter generando v2" },
  { type: "warning" as const, message: 'Post IG MH — Brand Guardian: "usa paleta MH, no corporativa" — devuelto a Designer' },
  { type: "success" as const, message: "Reporte semanal de competencia — generado" },
];

const TYPE_ICONS = { success: "✅", working: "🔄", warning: "⚠️", error: "❌" };

export function ActivityFeed() {
  return (
    <div>
      <h2 className="text-lg font-bold text-near-black mb-4">Actividad Reciente</h2>
      <div className="bg-white rounded-xl p-6 shadow-sm space-y-3">
        {PLACEHOLDER_ITEMS.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span>{TYPE_ICONS[item.type]}</span>
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
