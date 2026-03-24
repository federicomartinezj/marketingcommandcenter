import { create } from "zustand";

export type ActivityType = "success" | "working" | "warning" | "error";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
}

interface ActivityStore {
  items: ActivityItem[];
  addActivity: (type: ActivityType, message: string) => void;
}

export const useActivityStore = create<ActivityStore>((set) => ({
  items: [
    {
      id: "seed-1",
      type: "success" as ActivityType,
      message: 'Blog post "5 señales de que tu hotel necesita..." aprobado por Brand Guardian',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "seed-2",
      type: "working" as ActivityType,
      message: "Email sequence AAS Q2 — Copywriter generando v2",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "seed-3",
      type: "warning" as ActivityType,
      message: 'Post IG MH — Brand Guardian: "usa paleta MH, no corporativa"',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
    },
  ],

  addActivity: (type, message) =>
    set((state) => ({
      items: [
        {
          id: crypto.randomUUID(),
          type,
          message,
          timestamp: new Date().toISOString(),
        },
        ...state.items,
      ].slice(0, 50),
    })),
}));
