import { create } from "zustand";
import { createContent } from "../lib/api";
import type { ContentPiece, CreateContentRequest } from "../lib/api";
import { useActivityStore } from "./activity";

interface ContentStore {
  pieces: ContentPiece[];
  isCreating: boolean;
  currentPiece: ContentPiece | null;
  error: string | null;
  createNewContent: (request: CreateContentRequest) => Promise<void>;
  clearCurrent: () => void;
}

export const useContentStore = create<ContentStore>((set) => ({
  pieces: [],
  isCreating: false,
  currentPiece: null,
  error: null,

  createNewContent: async (request) => {
    const addActivity = useActivityStore.getState().addActivity;
    set({ isCreating: true, error: null, currentPiece: null });
    addActivity("working", `Copywriter generando ${request.type} para ${request.line}...`);
    try {
      const piece = await createContent(request);
      set((state) => ({
        pieces: [piece, ...state.pieces],
        isCreating: false,
        currentPiece: piece,
      }));
      addActivity("success", `${piece.type} "${piece.title}" generado — ${piece.status === "approved" ? "aprobado por Brand Guardian" : "en revisión"}`);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isCreating: false });
      addActivity("error", `Error generando contenido: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  clearCurrent: () => set({ currentPiece: null, error: null }),
}));
