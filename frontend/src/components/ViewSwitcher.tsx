interface Props {
  view: "timeline" | "mindmap";
  onViewChange: (view: "timeline" | "mindmap") => void;
}

export default function ViewSwitcher({ view, onViewChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border bg-white p-1">
      <button
        onClick={() => onViewChange("timeline")}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          view === "timeline"
            ? "bg-blue-600 text-white"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        📅 时间线
      </button>
      <button
        onClick={() => onViewChange("mindmap")}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          view === "mindmap"
            ? "bg-blue-600 text-white"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        🧠 思维导图
      </button>
    </div>
  );
}
