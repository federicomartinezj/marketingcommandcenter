import { useState } from "react";
import { useContentStore } from "../../store/content";
import { ContentPreview } from "./ContentPreview";
import { BrandReviewCard } from "./BrandReviewCard";
import { SocialCardPreview } from "./SocialCardPreview";

const CONTENT_TYPES = [
  { value: "blog-post", label: "Blog Post" },
  { value: "linkedin-post", label: "LinkedIn Post" },
  { value: "instagram-post", label: "Instagram Post" },
  { value: "email", label: "Email" },
  { value: "email-sequence", label: "Email Sequence" },
  { value: "landing-page", label: "Landing Page" },
  { value: "social-card", label: "Social Card" },
];

const BUSINESS_LINES = [
  { value: "OPL", label: "OPL — Equipos Industriales", color: "#0D86FF" },
  { value: "AAS", label: "AAS — Laundry as a Service", color: "#FF632C" },
  { value: "MH", label: "MH — Lavanderías Compartidas", color: "#1DB5DE" },
  { value: "Volta", label: "Volta — Laundromats", color: "#B4FF00" },
];

interface CreateContentModalProps {
  onClose: () => void;
  initialType?: string;
}

export function CreateContentModal({ onClose, initialType }: CreateContentModalProps) {
  const { isCreating, currentPiece, error, createNewContent, clearCurrent } = useContentStore();
  const [type, setType] = useState(initialType || "blog-post");
  const [line, setLine] = useState("OPL");
  const [audience, setAudience] = useState("");
  const [topic, setTopic] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createNewContent({ type, line, audience, topic, additionalContext: additionalContext || undefined });
  };

  const handleClose = () => {
    clearCurrent();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light-gray">
          <h2 className="text-xl font-bold text-near-black">
            {currentPiece ? "Contenido Generado" : "Crear Contenido"}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-near-black text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6">
          {/* Show result if we have content */}
          {currentPiece ? (
            <div className="space-y-6">
              <ContentPreview piece={currentPiece} />
              {["linkedin-post", "instagram-post", "social-card"].includes(currentPiece.type) && (
                <SocialCardPreview
                  line={currentPiece.line}
                  platform={currentPiece.type}
                  title={currentPiece.title}
                />
              )}
              {currentPiece.brandReview && (
                <BrandReviewCard review={currentPiece.brandReview} />
              )}
              <div className="flex gap-3">
                <button onClick={handleClose} className="flex-1 bg-electric-blue text-white rounded-lg py-3 font-semibold hover:opacity-90 transition-opacity">
                  Aprobar
                </button>
                <button onClick={() => { clearCurrent(); }} className="flex-1 bg-near-black text-white rounded-lg py-3 font-semibold hover:opacity-90 transition-opacity">
                  Regenerar
                </button>
              </div>
            </div>
          ) : (
            /* Show form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Content Type */}
              <div>
                <label className="block text-sm font-semibold text-near-black mb-1.5">Tipo de contenido</label>
                <select value={type} onChange={(e) => setType(e.target.value)} disabled={isCreating}
                  className="w-full border border-light-gray rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-electric-blue">
                  {CONTENT_TYPES.map((ct) => (
                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                  ))}
                </select>
              </div>

              {/* Business Line */}
              <div>
                <label className="block text-sm font-semibold text-near-black mb-1.5">Línea de negocio</label>
                <select value={line} onChange={(e) => setLine(e.target.value)} disabled={isCreating}
                  className="w-full border border-light-gray rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-electric-blue">
                  {BUSINESS_LINES.map((bl) => (
                    <option key={bl.value} value={bl.value}>{bl.label}</option>
                  ))}
                </select>
              </div>

              {/* Audience */}
              <div>
                <label className="block text-sm font-semibold text-near-black mb-1.5">Audiencia</label>
                <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)} disabled={isCreating}
                  placeholder="Ej: Gerentes generales de hoteles de 100+ habitaciones"
                  className="w-full border border-light-gray rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue" />
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-semibold text-near-black mb-1.5">Tema</label>
                <textarea value={topic} onChange={(e) => setTopic(e.target.value)} disabled={isCreating} rows={3}
                  placeholder="Describe el tema o contexto del contenido..."
                  className="w-full border border-light-gray rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue resize-none" />
              </div>

              {/* Additional Context */}
              <div>
                <label className="block text-sm font-semibold text-near-black mb-1.5">Contexto adicional <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} disabled={isCreating} rows={2}
                  placeholder="Datos específicos, referencias, restricciones..."
                  className="w-full border border-light-gray rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue resize-none" />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
              )}

              {/* Loading State */}
              {isCreating && (
                <div className="bg-electric-blue/5 border border-electric-blue/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-electric-blue font-medium">
                    <span className="animate-spin">🔄</span>
                    {["linkedin-post", "instagram-post", "social-card"].includes(type)
                      ? "Social Media Manager generando contenido..."
                      : "Copywriter generando contenido..."}
                  </div>
                  {["linkedin-post", "instagram-post", "social-card", "email", "email-sequence"].includes(type) && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>⏳</span>
                      Designer preparando assets visuales...
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>⏳</span>
                    Brand Guardian en espera...
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isCreating || !audience.trim() || !topic.trim()}
                  className="flex-1 bg-electric-blue text-white rounded-lg py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {isCreating ? "Generando..." : "Generar Contenido"}
                </button>
                <button type="button" onClick={handleClose} disabled={isCreating}
                  className="px-6 border border-light-gray text-near-black rounded-lg py-3 font-semibold hover:bg-light-gray transition-colors disabled:opacity-50">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
