import { useState } from "react";

interface Variant { id: string; label: string; content: string; selected: boolean; }

interface VariantSelectorProps {
  variants: Variant[];
  onSelect: (variantId: string) => void;
  onEdit?: (variantId: string, content: string) => void;
}

export function VariantSelector({ variants, onSelect, onEdit }: VariantSelectorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const startEdit = (v: Variant) => {
    setEditingId(v.id);
    setEditContent(v.content);
  };

  const saveEdit = (variantId: string) => {
    if (onEdit) onEdit(variantId, editContent);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

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
              <div className="flex items-center gap-2">
                {v.selected && <span className="text-blue-600 text-xs font-semibold">Seleccionada</span>}
                {onEdit && editingId !== v.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(v); }}
                    className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
                    title="Editar copy"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>
            {editingId === v.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full text-xs text-gray-700 border rounded-lg p-2 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(v.id)}
                    className="text-xs bg-blue-500 text-white px-3 py-1 rounded font-semibold hover:bg-blue-600"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded font-semibold hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {v.content}
              </div>
            )}
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
              {v.selected ? "Seleccionada" : "Seleccionar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
