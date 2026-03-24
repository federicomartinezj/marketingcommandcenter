import { create } from "zustand";

export interface CalendarItem {
  id: string;
  date: string;
  channel: string;
  line: string;
  title: string;
  status: "planned" | "created" | "published";
  contentId?: string;
  createdAt: string;
}

interface CalendarStore {
  items: CalendarItem[];
  currentMonth: string; // YYYY-MM
  isLoading: boolean;
  setMonth: (month: string) => void;
  fetchItems: (month: string) => Promise<void>;
  addItem: (item: Omit<CalendarItem, "id" | "createdAt" | "status">) => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  items: [],
  currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
  isLoading: false,

  setMonth: (month) => {
    set({ currentMonth: month });
    get().fetchItems(month);
  },

  fetchItems: async (month) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/calendar?month=${month}`);
      const items = await res.json();
      set({ items, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (res.ok) {
      get().fetchItems(get().currentMonth);
    }
  },
}));
