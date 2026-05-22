import { useCallback, useEffect, useRef, useState } from "react";
import { getRoadmap } from "../api/roadmap";
import { useHistoryStore } from "../stores/useHistoryStore";
import type { RoadmapData } from "../types/roadmap";

export function useRoadmap(shareToken: string | undefined) {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"timeline" | "mindmap">("timeline");
  const [progressKey, setProgressKey] = useState(0);

  const saveToHistoryRef = useRef(useHistoryStore.getState().saveToHistory);

  useEffect(() => {
    if (!shareToken) return;
    getRoadmap(shareToken)
      .then((data) => {
        setRoadmap(data);
        saveToHistoryRef.current(data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [shareToken]);

  const handleTaskToggle = useCallback(() => {
    setProgressKey((k) => k + 1);
  }, []);

  return { roadmap, loading, error, view, setView, progressKey, handleTaskToggle };
}
