import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRoadmap } from "../api/roadmap";
import TimelineView from "../components/TimelineView";
import type { RoadmapData } from "../types/roadmap";

export default function RoadmapPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareToken) return;
    getRoadmap(shareToken)
      .then(setRoadmap)
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

        {/* View toggle placeholder - will be replaced in Task 13 */}
        <div className="mb-6 flex justify-end">
          <button className="px-4 py-2 text-sm bg-white border rounded-lg">
            Timeline View
          </button>
        </div>

        {/* Roadmap content */}
        {roadmap.phases && <TimelineView phases={roadmap.phases} />}

        {/* Share link */}
        <div className="mt-12 p-4 bg-white rounded-lg border text-center">
          <p className="text-sm text-gray-500 mb-2">Share this roadmap:</p>
          <code className="text-blue-600 break-all">
            {window.location.origin}/roadmap/{roadmap.share_token}
          </code>
        </div>
      </div>
    </div>
  );
}
