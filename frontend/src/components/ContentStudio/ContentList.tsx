import { useEffect, useState } from "react";
import { useContentStore } from "../../store/content";
import { listContent } from "../../lib/api";
import type { ContentPiece } from "../../lib/api";
import Markdown from "react-markdown";

const LINE_COLORS: Record<string, string> = {
  OPL: "bg-electric-blue",
  AAS: "bg-coral",
  MH: "bg-mh-blue",
  Volta: "bg-lime-green",
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  approved: { bg: "bg-green-100", text: "text-green-700" },
  "in-review": { bg: "bg-amber-100", text: "text-amber-700" },
  rejected: { bg: "bg-red-100", text: "text-red-700" },
  draft: { bg: "bg-gray-100", text: "text-gray-600" },
  published: { bg: "bg-blue-100", text: "text-blue-700" },
};

export function ContentList() {
  const storePieces = useContentStore((s) => s.pieces);
  const [allPieces, setAllPieces] = useState<ContentPiece[]>([]);
  const [filterLine, setFilterLine] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch from API on mount + merge with store pieces
  useEffect(() => {
    listContent().then(setAllPieces).catch(() => {});
  }, []);

  // Merge API pieces with store pieces (store pieces are newer, created in this session)
  const pieces = [...storePieces];
  for (const p of allPieces) {
    if (!pieces.find((sp) => sp.id === p.id)) {
      pieces.push(p);
    }
  }

  // Apply filters
  const filtered = pieces.filter((p) => {
    if (filterLine !== "all" && p.line !== filterLine) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-near-black">Contenido Generado</h2>
        <div className="flex gap-3">
          {/* Line filter */}
          <select
            value={filterLine}
            onChange={(e) => setFilterLine(e.target.value)}
            className="border border-light-gray rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="all">Todas las líneas</option>
            <option value="OPL">OPL</option>
            <option value="AAS">AAS</option>
            <option value="MH">MH</option>
            <option value="Volta">Volta</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-light-gray rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="all">Todos los estados</option>
            <option value="approved">Aprobado</option>
            <option value="in-review">En revisión</option>
            <option value="rejected">Rechazado</option>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-400">No hay contenido generado aún.</p>
          <p className="text-sm text-gray-300 mt-1">Usa "Crear Contenido" en el Dashboard para empezar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((piece) => {
            const statusStyle = STATUS_STYLES[piece.status] || STATUS_STYLES.draft;
            const isExpanded = expandedId === piece.id;

            return (
              <div key={piece.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : piece.id)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                >
                  {/* Line badge */}
                  <span className={`${LINE_COLORS[piece.line] || "bg-gray-400"} text-white text-xs font-bold px-2 py-0.5 rounded shrink-0`}>
                    {piece.line}
                  </span>

                  {/* Title */}
                  <span className="flex-1 text-sm font-medium text-near-black truncate">
                    {piece.title}
                  </span>

                  {/* Type */}
                  <span className="text-xs text-gray-500 capitalize shrink-0">
                    {piece.type.replace("-", " ")}
                  </span>

                  {/* Status */}
                  <span className={`${statusStyle.bg} ${statusStyle.text} text-xs font-semibold px-2 py-0.5 rounded shrink-0`}>
                    {piece.status === "in-review" ? "En revisión" : piece.status === "approved" ? "Aprobado" : piece.status}
                  </span>

                  {/* Brand score */}
                  {piece.brandReview && (
                    <span className={`text-xs font-bold shrink-0 ${piece.brandReview.score >= 80 ? "text-green-600" : "text-amber-600"}`}>
                      {piece.brandReview.score}/100
                    </span>
                  )}

                  {/* Expand indicator */}
                  <span className="text-gray-400 text-sm shrink-0">{isExpanded ? "▲" : "▼"}</span>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-light-gray pt-4">
                    <div className="bg-off-white rounded-lg p-4 mb-4">
                      <div className="max-w-none text-sm text-near-black leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:border-electric-blue [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600">
                        <Markdown>{piece.content}</Markdown>
                      </div>
                    </div>

                    {/* Brand review checks */}
                    {piece.brandReview && (
                      <div className={`rounded-lg p-4 ${piece.brandReview.approved ? "bg-green-50" : "bg-amber-50"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span>{piece.brandReview.approved ? "✅" : "⚠️"}</span>
                          <span className="text-sm font-bold">Brand Guardian — {piece.brandReview.score}/100</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {piece.brandReview.checks.map((check, i) => (
                            <div key={i} className="flex items-center gap-1 text-xs">
                              <span>{check.passed ? "✓" : "✗"}</span>
                              <span className={check.passed ? "text-green-700" : "text-red-700"}>{check.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                      <span>Agentes: {piece.agentsInvolved.join(", ")}</span>
                      <span>•</span>
                      <span>{new Date(piece.createdAt).toLocaleDateString("es-CO")}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
