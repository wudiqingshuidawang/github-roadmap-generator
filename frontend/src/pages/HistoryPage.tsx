import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory, clearHistory, type HistoryItem } from "../utils/history";
import { getFavorites } from "../utils/favorites";

type SortMode = "newest" | "oldest" | "phases";

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>(getHistory());
  const [favorites] = useState(() => getFavorites());
  const [search, setSearch] = useState("");
  const [selectedTech, setSelectedTech] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  // Extract all unique tech tags
  const allTechs = useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => h.tech_stack.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [history]);

  // Filter + search + sort
  const filtered = useMemo(() => {
    let items = [...history];

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q) ||
          h.tech_stack.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Tech filter
    if (selectedTech !== "all") {
      items = items.filter((h) => h.tech_stack.includes(selectedTech));
    }

    // Favorites first
    items.sort((a, b) => {
      const aFav = favorites.has(a.share_token) ? 0 : 1;
      const bFav = favorites.has(b.share_token) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;

      switch (sortMode) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "phases":
          return b.phase_count - a.phase_count;
        default:
          return 0;
      }
    });

    return items;
  }, [history, search, selectedTech, sortMode, favorites]);

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

  // Highlight matching text
  const highlightText = (text: string) => {
    if (!search.trim()) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <button
              onClick={() => navigate("/")}
              className="text-sm text-blue-600 hover:underline mb-2 block"
            >
              ← Back to Home
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              📋 History
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">
              Showing {filtered.length} / {history.length} roadmaps
              {favorites.size > 0 && ` · ⭐ ${favorites.size} favorited`}
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors self-start"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Search + Filters */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm space-y-3">
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name, description, or tech..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap gap-3">
              {/* Tech filter */}
              {allTechs.length > 0 && (
                <select
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Technologies</option>
                  {allTechs.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}

              {/* Sort */}
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="phases">Most Phases</option>
              </select>

              {/* Clear filters */}
              {(search || selectedTech !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedTech("all");
                  }}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">
              {history.length === 0
                ? "No roadmaps yet"
                : "No results match your search"}
            </p>
            {history.length === 0 ? (
              <button
                onClick={() => navigate("/")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generate your first roadmap
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedTech("all");
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const isFav = favorites.has(item.share_token);
              return (
                <div
                  key={item.share_token}
                  onClick={() => navigate(`/roadmap/${item.share_token}`)}
                  className={`bg-white rounded-xl p-4 md:p-5 border shadow-sm hover:shadow-md cursor-pointer transition-all group ${
                    isFav
                      ? "border-yellow-200 hover:border-yellow-300"
                      : "border-gray-100 hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isFav && <span className="text-yellow-500 flex-shrink-0">⭐</span>}
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate text-sm md:text-base">
                          {highlightText(item.title)}
                        </h3>
                      </div>
                      <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-2">
                        {highlightText(item.description)}
                      </p>
                      <div className="flex items-center gap-2 md:gap-4 mt-3 flex-wrap">
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
                    <span className="text-gray-300 group-hover:text-blue-400 transition-colors text-lg flex-shrink-0">
                      →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
