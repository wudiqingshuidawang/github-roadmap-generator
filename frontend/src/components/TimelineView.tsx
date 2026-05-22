import { useCallback } from "react";
import toast from "react-hot-toast";
import type { Phase, RoadmapTask } from "../types/roadmap";
import { useProgressStore } from "../stores/useProgressStore";

interface Props {
  phases: Phase[];
  shareToken: string;
  onTaskToggle?: () => void;
}

function TaskCard({
  task,
  shareToken,
  phaseIdx,
  taskIdx,
  onToggle,
}: {
  task: RoadmapTask;
  shareToken: string;
  phaseIdx: number;
  taskIdx: number;
  onToggle?: () => void;
}) {
  const done = useProgressStore((s) => s.isTaskDone(shareToken, phaseIdx, taskIdx));
  const toggleTask = useProgressStore((s) => s.toggleTask);

  const difficultyColor: Record<string, string> = {
    beginner: "bg-green-100 text-green-800",
    intermediate: "bg-yellow-100 text-yellow-800",
    advanced: "bg-red-100 text-red-800",
  };

  const difficultyLabel: Record<string, string> = {
    beginner: "入门",
    intermediate: "进阶",
    advanced: "高级",
  };

  const handleToggle = useCallback(() => {
    const newState = toggleTask(shareToken, phaseIdx, taskIdx);
    toast(newState ? "任务已完成 ✓" : "已取消完成", {
      icon: newState ? "✅" : "↩️",
    });
    onToggle?.();
  }, [shareToken, phaseIdx, taskIdx, onToggle, toggleTask]);

  return (
    <div
      className={`bg-white rounded-lg p-4 shadow-sm border transition-all ${
        done ? "border-green-200 bg-green-50/30" : "border-gray-100 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          role="checkbox"
          aria-checked={done}
          aria-label={`${done ? "取消完成" : "标记完成"}: ${task.title}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              handleToggle();
            }
          }}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${
            done
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-300 hover:border-blue-400"
          }`}
        >
          {done && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-medium ${done ? "text-gray-400 line-through" : "text-gray-900"}`}>
              {task.title}
            </h4>
            <span
              className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${difficultyColor[task.difficulty] || "bg-gray-100"}`}
            >
              {difficultyLabel[task.difficulty] || task.difficulty}
            </span>
          </div>
          <p className={`text-sm mt-2 ${done ? "text-gray-400" : "text-gray-600"}`}>
            {task.description}
          </p>
          {task.resources.length > 0 && (
            <div className="mt-3 space-y-1">
              {task.resources.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="opacity-60">[{r.type}]</span> {r.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TimelineView({ phases, shareToken, onTaskToggle }: Props) {
  let globalTaskIdx = 0;

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-200" />

      <div className="space-y-8">
        {phases.map((phase, i) => {
          const tasks = phase.tasks.map((task, j) => {
            globalTaskIdx++;
            return (
              <TaskCard
                key={j}
                task={task}
                shareToken={shareToken}
                phaseIdx={i}
                taskIdx={j}
                onToggle={onTaskToggle}
              />
            );
          });

          return (
            <div key={i} className="relative pl-16">
              <div className="absolute left-4 w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow" />
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{phase.name}</h3>
                <span className="text-sm text-gray-500">{phase.duration}</span>
              </div>
              <div className="space-y-3">{tasks}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
