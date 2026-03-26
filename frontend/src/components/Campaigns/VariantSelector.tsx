interface Variant { id: string; label: string; content: string; selected: boolean; }

interface VariantSelectorProps {
  variants: Variant[];
  onSelect: (variantId: string) => void;
}

export function VariantSelector({ variants, onSelect }: VariantSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {variants.map((v) => (
        <div key={v.id} className={`rounded-lg border-2 transition-colors flex flex-col ${
          v.selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
        }`}>
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold ${v.selected ? "text-blue-600" : "text-gray-500"}`}>
                Variante {v.label}
              </span>
              {v.selected && <span className="text-blue-600 text-xs">✓</span>}
            </div>
            <div className="text-xs text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {v.content}
            </div>
          </div>
          <div className="px-4 pb-3">
            <button
              onClick={() => onSelect(v.id)}
              className={`w-full text-center py-2 rounded text-sm font-semibold transition-colors ${
                v.selected
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-500 hover:text-white"
              }`}
            >
              {v.selected ? "Seleccionada ✓" : "Seleccionar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
