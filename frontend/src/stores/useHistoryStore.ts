import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoadmapData } from "../types/roadmap";

const STORAGE_KEY = "projectpath_history";
const MAX_ITEMS = 20;

export interface HistoryItem {
  share_token: string;
  title: string;
  description: string;
  created_at: string;
  phase_count: number;
  tech_stack: string[];
}

interface HistoryState {
  history: HistoryItem[];
  saveToHistory: (roadmap: RoadmapData) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      history: [],

      saveToHistory: (roadmap) =>
        set((state) => {
          const history = [...state.history];
          const existing = history.findIndex(
            (h) => h.share_token === roadmap.share_token
          );
          if (existing >= 0) {
            history.splice(existing, 1);
          }

          history.unshift({
            share_token: roadmap.share_token,
            title: roadmap.title,
            description: roadmap.description,
            created_at: roadmap.created_at,
            phase_count: roadmap.phases?.length ?? 0,
            tech_stack: roadmap.tech_stack?.map((t) => t.name) ?? [],
          });

          while (history.length > MAX_ITEMS) history.pop();

          return { history };
        }),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: STORAGE_KEY,
    }
  )
);
