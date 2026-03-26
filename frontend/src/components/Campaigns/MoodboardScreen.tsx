interface MoodboardScreenProps {
  moodboard: {
    visualConcept: string; photographyStyle: string; colorEmphasis: string[];
    typography: string; mood: string; imagePrompts: string[]; htmlPreview: string; status: string;
  };
  onApprove: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
}

export function MoodboardScreen({ moodboard, onApprove, onRegenerate, isLoading }: MoodboardScreenProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-near-black">Dirección Visual</h2>
        <p className="text-sm text-gray-500 mt-1">Revisa el moodboard antes de generar las piezas</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Concepto Visual</div>
          <div className="text-sm text-near-black">{moodboard.visualConcept}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Mood</div>
          <div className="text-sm text-near-black">{moodboard.mood}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Estilo Fotográfico</div>
          <div className="text-sm text-near-black">{moodboard.photographyStyle}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Tipografía</div>
          <div className="text-sm text-near-black">{moodboard.typography}</div>
        </div>
      </div>
      {moodboard.colorEmphasis.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Énfasis de Color</div>
          <div className="flex flex-wrap gap-2">
            {moodboard.colorEmphasis.map((c, i) => <span key={i} className="text-xs bg-gray-100 px-3 py-1 rounded">{c}</span>)}
          </div>
        </div>
      )}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Preview Visual</div>
        <div className="border rounded-lg overflow-hidden bg-white" dangerouslySetInnerHTML={{ __html: moodboard.htmlPreview }} />
      </div>
      {moodboard.imagePrompts.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Prompts de Imagen</div>
          <div className="space-y-2">
            {moodboard.imagePrompts.map((prompt, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 flex items-start gap-2">
                <span className="text-xs text-gray-600 flex-1 font-mono">{prompt}</span>
                <button onClick={() => navigator.clipboard.writeText(prompt)} className="text-xs text-blue-500 hover:text-blue-700 shrink-0">Copiar</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={onApprove} disabled={isLoading} className="flex-1 bg-blue-500 text-white rounded-lg px-6 py-3 font-semibold hover:bg-blue-600 disabled:opacity-50">
          Aprobar Visual y Generar Contenido
        </button>
        <button onClick={onRegenerate} disabled={isLoading} className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          Regenerar
        </button>
      </div>
    </div>
  );
}
