import type { ContentPiece } from "../../lib/api";

interface ContentPreviewProps {
  piece: ContentPiece;
}

export function ContentPreview({ piece }: ContentPreviewProps) {
  const lineColors: Record<string, string> = {
    OPL: "bg-electric-blue",
    AAS: "bg-coral",
    MH: "bg-mh-blue",
    Volta: "bg-lime-green",
  };

  return (
    <div>
      {/* Meta info */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`${lineColors[piece.line] || "bg-gray-400"} text-white text-xs font-bold px-2 py-1 rounded`}>
          {piece.line}
        </span>
        <span className="text-xs text-gray-500">{piece.type}</span>
        <span className="text-xs text-gray-400">•</span>
        <span className="text-xs text-gray-500">{piece.audience}</span>
      </div>

      {/* Content */}
      <div className="bg-off-white rounded-xl p-6 border border-light-gray">
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-near-black leading-relaxed">
          {piece.content}
        </div>
      </div>

      {/* Agents involved */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-400">Agentes:</span>
        {piece.agentsInvolved.map((agent) => (
          <span key={agent} className="text-xs bg-light-gray text-gray-600 px-2 py-0.5 rounded">
            {agent}
          </span>
        ))}
      </div>
    </div>
  );
}
