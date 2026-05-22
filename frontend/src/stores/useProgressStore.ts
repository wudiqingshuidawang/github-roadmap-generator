import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "projectpath_progress";

type ProgressMap = Record<string, boolean>;

interface ProgressState {
  allProgress: Record<string, ProgressMap>;
  getProgress: (shareToken: string) => ProgressMap;
  isTaskDone: (shareToken: string, phaseIdx: number, taskIdx: number) => boolean;
  toggleTask: (shareToken: string, phaseIdx: number, taskIdx: number) => boolean;
  getProgressStats: (
    shareToken: string,
    totalTasks: number
  ) => { done: number; total: number; percent: number };
  clearProgress: (shareToken: string) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      allProgress: {},

      getProgress: (shareToken) => get().allProgress[shareToken] ?? {},

      isTaskDone: (shareToken, phaseIdx, taskIdx) => {
        const progress = get().allProgress[shareToken];
        return progress?.[`${phaseIdx}:${taskIdx}`] === true;
      },

      toggleTask: (shareToken, phaseIdx, taskIdx) => {
        const key = `${phaseIdx}:${taskIdx}`;
        const { allProgress } = get();
        const progress = { ...(allProgress[shareToken] ?? {}) };
        progress[key] = !progress[key];
        set({ allProgress: { ...allProgress, [shareToken]: progress } });
        return progress[key];
      },

      getProgressStats: (shareToken, totalTasks) => {
        const progress = get().allProgress[shareToken] ?? {};
        const done = Object.values(progress).filter(Boolean).length;
        return {
          done,
          total: totalTasks,
          percent:
            totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0,
        };
      },

      clearProgress: (shareToken) => {
        const { allProgress } = get();
        const next = { ...allProgress };
        delete next[shareToken];
        set({ allProgress: next });
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);
