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

export function saveToHistory(roadmap: RoadmapData): void {
  const history = getHistory();

  // Don't duplicate
  const existing = history.findIndex((h) => h.share_token === roadmap.share_token);
  if (existing >= 0) {
    history.splice(existing, 1);
  }

  // Add to front
  history.unshift({
    share_token: roadmap.share_token,
    title: roadmap.title,
    description: roadmap.description,
    created_at: roadmap.created_at,
    phase_count: roadmap.phases?.length ?? 0,
    tech_stack: roadmap.tech_stack?.map((t) => t.name) ?? [],
  });

  // Trim
  while (history.length > MAX_ITEMS) history.pop();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
