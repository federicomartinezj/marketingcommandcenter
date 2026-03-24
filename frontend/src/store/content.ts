import { create } from "zustand";
import { createContent } from "../lib/api";
import type { ContentPiece, CreateContentRequest } from "../lib/api";

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
    set({ isCreating: true, error: null, currentPiece: null });
    try {
      const piece = await createContent(request);
      set((state) => ({
        pieces: [piece, ...state.pieces],
        isCreating: false,
        currentPiece: piece,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isCreating: false });
    }
  },

  clearCurrent: () => set({ currentPiece: null, error: null }),
}));
