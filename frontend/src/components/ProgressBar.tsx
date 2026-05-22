import { getProgressStats } from "../utils/progress";

interface Props {
  shareToken: string;
  totalTasks: number;
  onRefresh?: () => void;
}

export default function ProgressBar({ shareToken, totalTasks }: Props) {
  const { done, total, percent } = getProgressStats(shareToken, totalTasks);

  if (total === 0) return null;

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">学习进度</span>
        <span className="text-sm text-gray-500">
          {done}/{total} 个任务 · {percent}%
        </span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percent}%`,
            background:
              percent === 100
                ? "linear-gradient(90deg, #22c55e, #16a34a)"
                : percent > 60
                ? "linear-gradient(90deg, #3b82f6, #2563eb)"
                : percent > 30
                ? "linear-gradient(90deg, #f59e0b, #d97706)"
                : "linear-gradient(90deg, #ef4444, #dc2626)",
          }}
        />
      </div>
      {percent === 100 && (
        <p className="text-sm text-green-600 mt-2 font-medium">
          🎉 恭喜！你已完成所有任务！
        </p>
      )}
    </div>
  );
}
