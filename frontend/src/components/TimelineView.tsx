import type { Phase, RoadmapTask } from "../types/roadmap";

interface Props {
  phases: Phase[];
}

function TaskCard({ task }: { task: RoadmapTask }) {
  const difficultyColor: Record<string, string> = {
    beginner: "bg-green-100 text-green-800",
    intermediate: "bg-yellow-100 text-yellow-800",
    advanced: "bg-red-100 text-red-800",
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-gray-900">{task.title}</h4>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor[task.difficulty] || "bg-gray-100"}`}
        >
          {task.difficulty}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-2">{task.description}</p>
      {task.resources.length > 0 && (
        <div className="mt-3 space-y-1">
          {task.resources.map((r, i) => (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <span className="opacity-60">[{r.type}]</span> {r.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TimelineView({ phases }: Props) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-200" />

      <div className="space-y-8">
        {phases.map((phase, i) => (
          <div key={i} className="relative pl-16">
            {/* Phase dot */}
            <div className="absolute left-4 w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow" />

            {/* Phase header */}
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">{phase.name}</h3>
              <span className="text-sm text-gray-500">{phase.duration}</span>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {phase.tasks.map((task, j) => (
                <TaskCard key={j} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
