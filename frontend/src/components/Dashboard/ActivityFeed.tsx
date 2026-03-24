import { useActivityStore } from "../../store/activity";

const TYPE_ICONS = { success: "✅", working: "🔄", warning: "⚠️", error: "❌" };

export function ActivityFeed() {
  const items = useActivityStore((s) => s.items);

  return (
    <div>
      <h2 className="text-lg font-bold text-near-black mb-4">Actividad Reciente</h2>
      <div className="bg-white rounded-xl p-6 shadow-sm space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">Sin actividad reciente</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-sm text-gray-700">
              <span>{TYPE_ICONS[item.type]}</span>
              <span className="flex-1">{item.message}</span>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {new Date(item.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
