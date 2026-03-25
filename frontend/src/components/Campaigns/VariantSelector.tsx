import { useState } from "react";

interface Variant { id: string; label: string; content: string; selected: boolean; }

interface VariantSelectorProps {
  variants: Variant[];
  onSelect: (variantId: string) => void;
}

export function VariantSelector({ variants, onSelect }: VariantSelectorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {variants.map((v) => {
          const isExpanded = expandedId === v.id;
          return (
            <div key={v.id} className={`rounded-lg border-2 transition-colors ${
              v.selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
            }`}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : v.id)}
                className="w-full text-left p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${v.selected ? "text-blue-600" : "text-gray-500"}`}>
                    Variante {v.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {v.selected && <span className="text-blue-600 text-sm">✓ Seleccionada</span>}
                    <span className="text-xs text-gray-400">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>
                <div className={`text-xs text-gray-600 whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-4"}`}>
                  {v.content}
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-3 pt-0">
                  <button
                    onClick={() => onSelect(v.id)}
                    className={`w-full text-center py-2 rounded text-sm font-semibold transition-colors ${
                      v.selected
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-blue-500 hover:text-white"
                    }`}
                  >
                    {v.selected ? "Seleccionada ✓" : "Seleccionar esta variante"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
