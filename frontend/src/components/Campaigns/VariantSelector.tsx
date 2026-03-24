interface Variant { id: string; label: string; content: string; selected: boolean; }

interface VariantSelectorProps {
  variants: Variant[];
  onSelect: (variantId: string) => void;
}

export function VariantSelector({ variants, onSelect }: VariantSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {variants.map((v) => (
        <button key={v.id} onClick={() => onSelect(v.id)}
          className={`text-left p-4 rounded-lg border-2 transition-colors ${
            v.selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-bold ${v.selected ? "text-blue-600" : "text-gray-500"}`}>
              Variante {v.label}
            </span>
            {v.selected && <span className="text-blue-600 text-sm">✓</span>}
          </div>
          <div className="text-xs text-gray-600 line-clamp-6 whitespace-pre-wrap">{v.content}</div>
        </button>
      ))}
    </div>
  );
}
