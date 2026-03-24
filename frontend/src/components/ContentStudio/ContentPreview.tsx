import Markdown from "react-markdown";
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
        <span className="text-xs text-gray-500 capitalize">{piece.type.replace("-", " ")}</span>
        <span className="text-xs text-gray-400">•</span>
        <span className="text-xs text-gray-500">{piece.audience}</span>
      </div>

      {/* Content with markdown rendering */}
      <div className="bg-off-white rounded-xl p-6 border border-light-gray">
        <div className="max-w-none text-near-black leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-near-black [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-near-black [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_a]:text-electric-blue [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-electric-blue [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-4 [&_hr]:my-6 [&_hr]:border-light-gray">
          <Markdown>{piece.content}</Markdown>
        </div>
      </div>

      {/* Agents involved */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
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
