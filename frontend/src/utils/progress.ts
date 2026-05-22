const STORAGE_KEY = "projectpath_progress";

// Key format: `${shareToken}:${phaseIndex}:${taskIndex}`
type ProgressMap = Record<string, boolean>;

function getAllProgress(): Record<string, ProgressMap> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllProgress(data: Record<string, ProgressMap>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Evict oldest entries and retry
    const keys = Object.keys(data);
    const evictCount = Math.max(1, Math.floor(keys.length / 3));
    for (let i = 0; i < evictCount; i++) {
      delete data[keys[i]];
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Give up silently
    }
  }
}

export function getProgress(shareToken: string): ProgressMap {
  return getAllProgress()[shareToken] ?? {};
}

export function isTaskDone(shareToken: string, phaseIdx: number, taskIdx: number): boolean {
  const progress = getProgress(shareToken);
  return progress[`${phaseIdx}:${taskIdx}`] === true;
}

export function toggleTask(shareToken: string, phaseIdx: number, taskIdx: number): boolean {
  const all = getAllProgress();
  if (!all[shareToken]) all[shareToken] = {};
  const key = `${phaseIdx}:${taskIdx}`;
  all[shareToken][key] = !all[shareToken][key];
  saveAllProgress(all);
  return all[shareToken][key];
}

export function getProgressStats(shareToken: string, totalTasks: number): {
  done: number;
  total: number;
  percent: number;
} {
  const progress = getProgress(shareToken);
  const done = Object.values(progress).filter(Boolean).length;
  return { done, total: totalTasks, percent: totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0 };
}

export function clearProgress(shareToken: string): void {
  const all = getAllProgress();
  delete all[shareToken];
  saveAllProgress(all);
}
