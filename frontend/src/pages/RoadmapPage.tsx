import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRoadmap } from "../api/roadmap";
import TimelineView from "../components/TimelineView";
import MindMapView from "../components/MindMapView";
import ViewSwitcher from "../components/ViewSwitcher";
import ExportButton from "../components/ExportButton";
import { copyShareLink } from "../utils/share";
import { saveToHistory } from "../utils/history";
import type { RoadmapData } from "../types/roadmap";

export default function RoadmapPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"timeline" | "mindmap">("timeline");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareToken) return;
    getRoadmap(shareToken)
      .then((data) => {
        setRoadmap(data);
        saveToHistory(data); // Save to local history
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error || "Roadmap not found"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{roadmap.title}</h1>
          <p className="text-gray-600">{roadmap.description}</p>
          {roadmap.tech_stack && (
            <div className="flex flex-wrap gap-2 mt-4">
              {roadmap.tech_stack.map((tech, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  title={tech.reason}
                >
                  {tech.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ExportButton title={roadmap.title} />
          </div>
          <ViewSwitcher view={view} onViewChange={setView} />
        </div>

        {/* Roadmap content */}
        <div id="roadmap-content">
          {roadmap.phases && (
            view === "timeline" ? (
              <TimelineView phases={roadmap.phases} />
            ) : (
              <MindMapView phases={roadmap.phases} title={roadmap.title} />
            )
          )}
        </div>

        {/* Share link */}
        <div className="mt-12 p-4 bg-white rounded-lg border text-center">
          <p className="text-sm text-gray-500 mb-2">Share this roadmap:</p>
          <div className="flex items-center justify-center gap-2">
            <code className="text-blue-600 break-all">
              {window.location.origin}/roadmap/{roadmap.share_token}
            </code>
            <button
              onClick={async () => {
                await copyShareLink(roadmap.share_token);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
