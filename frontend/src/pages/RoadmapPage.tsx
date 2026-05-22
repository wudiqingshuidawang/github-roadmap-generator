import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getRoadmap } from "../api/roadmap";
import TimelineView from "../components/TimelineView";
import MindMapView from "../components/MindMapView";
import ViewSwitcher from "../components/ViewSwitcher";
import ExportButton from "../components/ExportButton";
import FavoriteButton from "../components/FavoriteButton";
import ProgressBar from "../components/ProgressBar";
import { copyShareLink } from "../utils/share";
import { useHistoryStore } from "../stores/useHistoryStore";
import type { RoadmapData } from "../types/roadmap";

export default function RoadmapPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"timeline" | "mindmap">("timeline");
  const [progressKey, setProgressKey] = useState(0);
  const saveToHistory = useHistoryStore((s) => s.saveToHistory);

  useEffect(() => {
    if (!shareToken) return;
    getRoadmap(shareToken)
      .then((data) => {
        setRoadmap(data);
        saveToHistory(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [shareToken]);

  const handleTaskToggle = useCallback(() => {
    setProgressKey((k) => k + 1);
  }, []);

  const totalTasks = roadmap?.phases?.reduce((sum, p) => sum + p.tasks.length, 0) ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="animate-spin w-10 h-10 md:w-12 md:h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 text-base md:text-lg mb-4">{error || "路线图未找到"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-blue-600 hover:underline mb-2 block"
          >
            ← 返回首页
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{roadmap.title}</h1>
          <p className="text-sm md:text-base text-gray-600">{roadmap.description}</p>
          {roadmap.tech_stack && (
            <div className="flex flex-wrap gap-1.5 md:gap-2 mt-3 md:mt-4">
              {roadmap.tech_stack.map((tech, i) => (
                <span
                  key={i}
                  className="px-2 md:px-3 py-0.5 md:py-1 bg-blue-100 text-blue-800 text-xs md:text-sm rounded-full"
                  title={tech.reason}
                >
                  {tech.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {shareToken && totalTasks > 0 && (
          <div className="mb-4 md:mb-6">
            <ProgressBar key={progressKey} shareToken={shareToken} totalTasks={totalTasks} />
          </div>
        )}

        {/* Actions bar */}
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <ExportButton title={roadmap.title} />
            <FavoriteButton shareToken={roadmap.share_token} />
          </div>
          <ViewSwitcher view={view} onViewChange={setView} />
        </div>

        {/* Roadmap content */}
        <div id="roadmap-content">
          {roadmap.phases &&
            (view === "timeline" ? (
              <TimelineView
                phases={roadmap.phases}
                shareToken={roadmap.share_token}
                onTaskToggle={handleTaskToggle}
              />
            ) : (
              <MindMapView phases={roadmap.phases} title={roadmap.title} />
            ))}
        </div>

        {/* Share link */}
        <div className="mt-8 md:mt-12 p-3 md:p-4 bg-white rounded-lg border text-center">
          <p className="text-xs md:text-sm text-gray-500 mb-2">分享此路线图：</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <code className="text-blue-600 break-all text-xs md:text-sm">
              {window.location.origin}/roadmap/{roadmap.share_token}
            </code>
            <button
              onClick={async () => {
                await copyShareLink(roadmap.share_token);
                toast.success("链接已复制！");
              }}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
            >
              复制链接
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
