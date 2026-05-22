import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory, clearHistory, type HistoryItem } from "../utils/history";

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>(getHistory());

  const handleClear = () => {
    if (confirm("Clear all history?")) {
      clearHistory();
      setHistory([]);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate("/")}
              className="text-sm text-blue-600 hover:underline mb-2 block"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              📋 History
            </h1>
            <p className="text-gray-500 mt-1">
              {history.length} roadmap{history.length !== 1 ? "s" : ""} generated
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* List */}
        {history.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No roadmaps yet</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Generate your first roadmap
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.share_token}
                onClick={() => navigate(`/roadmap/${item.share_token}`)}
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <span className="text-xs text-gray-400">
                        {formatDate(item.created_at)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {item.phase_count} phases
                      </span>
                      {item.tech_stack.slice(0, 3).map((tech, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                      {item.tech_stack.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{item.tech_stack.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-300 group-hover:text-blue-400 transition-colors text-lg">
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
