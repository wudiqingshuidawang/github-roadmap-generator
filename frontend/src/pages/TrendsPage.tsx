import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory } from "../utils/history";

// Simple bar chart using SVG
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barHeight = 28;
  const gap = 6;
  const labelWidth = 140;
  const chartWidth = 500;

  return (
    <svg
      viewBox={`0 0 ${labelWidth + chartWidth + 60} ${data.length * (barHeight + gap)}`}
      className="w-full h-auto"
      style={{ maxHeight: "400px" }}
    >
      {data.map((d, i) => {
        const y = i * (barHeight + gap);
        const barW = (d.value / maxVal) * chartWidth;
        return (
          <g key={i}>
            {/* Label */}
            <text
              x={labelWidth - 8}
              y={y + barHeight / 2 + 1}
              textAnchor="end"
              className="fill-gray-700 text-xs"
              dominantBaseline="middle"
            >
              {d.label.length > 18 ? d.label.slice(0, 18) + "…" : d.label}
            </text>
            {/* Bar bg */}
            <rect
              x={labelWidth}
              y={y}
              width={chartWidth}
              height={barHeight}
              rx={4}
              className="fill-gray-100"
            />
            {/* Bar fill */}
            <rect
              x={labelWidth}
              y={y}
              width={Math.max(barW, 2)}
              height={barHeight}
              rx={4}
              className={d.color}
            />
            {/* Value */}
            <text
              x={labelWidth + barW + 8}
              y={y + barHeight / 2 + 1}
              className="fill-gray-600 text-xs font-medium"
              dominantBaseline="middle"
            >
              +{d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Donut chart using SVG
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-gray-400 text-sm">No data</p>;

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;
  const strokeWidth = 30;

  let cumulative = 0;
  const segments = data.map((d) => {
    const pct = d.value / total;
    const dashArray = `${pct * 2 * Math.PI * r} ${2 * Math.PI * r}`;
    const dashOffset = -cumulative * 2 * Math.PI * r;
    cumulative += pct;
    return { ...d, pct, dashArray, dashOffset };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-40 h-40 flex-shrink-0">
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={s.dashArray}
            strokeDashoffset={s.dashOffset}
            className={s.color}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
        ))}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-gray-900 text-lg font-bold"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="fill-gray-500 text-xs"
        >
          languages
        </text>
      </svg>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        {data.slice(0, 10).map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${d.color.replace("text-", "bg-")}`} />
            <span className="text-xs text-gray-700">
              {d.label}{" "}
              <span className="text-gray-400">({d.value})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const COLORS = [
  "text-blue-500", "text-green-500", "text-purple-500", "text-orange-500",
  "text-pink-500", "text-yellow-500", "text-red-500", "text-indigo-500",
  "text-teal-500", "text-cyan-500",
];

const FILL_COLORS = [
  "fill-blue-500", "fill-green-500", "fill-purple-500", "fill-orange-500",
  "fill-pink-500", "fill-yellow-500", "fill-red-500", "fill-indigo-500",
  "fill-teal-500", "fill-cyan-500",
];

interface HistoryEntry {
  share_token: string;
  title: string;
  description: string;
  created_at: string;
  phase_count: number;
  tech_stack: string[];
}

export default function TrendsPage() {
  const navigate = useNavigate();
  const history = getHistory();

  // Aggregate tech stack distribution
  const techDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach((h: HistoryEntry) => {
      h.tech_stack.forEach((t: string) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, value], i) => ({
        label,
        value,
        color: COLORS[i % COLORS.length],
      }));
  }, [history]);

  // Roadmaps by phase count (complexity distribution)
  const complexityData = useMemo(() => {
    const buckets: Record<string, number> = { "1-2": 0, "3-4": 0, "5-6": 0, "7+": 0 };
    history.forEach((h: HistoryEntry) => {
      if (h.phase_count <= 2) buckets["1-2"]++;
      else if (h.phase_count <= 4) buckets["3-4"]++;
      else if (h.phase_count <= 6) buckets["5-6"]++;
      else buckets["7+"]++;
    });
    return Object.entries(buckets).map(([label, value], i) => ({
      label: `${label} phases`,
      value,
      color: FILL_COLORS[i],
    }));
  }, [history]);

  // Recent activity (roadmaps per month)
  const monthlyData = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach((h: HistoryEntry) => {
      const d = new Date(h.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([label, value], i) => ({
        label,
        value,
        color: FILL_COLORS[i % FILL_COLORS.length],
      }));
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center py-20">
          <p className="text-gray-400 text-lg mb-4">No data yet</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate your first roadmap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-blue-600 hover:underline mb-2 block"
          >
            ← 返回首页
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            📊 趋势分析
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            基于 {history.length} 条路线图的分析
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {[
            { label: "路线图", value: history.length, icon: "📋" },
            {
              label: "技术栈",
              value: new Set(history.flatMap((h: HistoryEntry) => h.tech_stack)).size,
              icon: "🛠",
            },
            {
              label: "平均阶段",
              value: (
                history.reduce((s: number, h: HistoryEntry) => s + h.phase_count, 0) / history.length
              ).toFixed(1),
              icon: "📐",
            },
            {
              label: "本月",
              value: history.filter((h: HistoryEntry) => {
                const d = new Date(h.created_at);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length,
              icon: "📅",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="text-lg mb-1">{stat.icon}</div>
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tech Distribution */}
        {techDistribution.length > 0 && (
          <div className="bg-white rounded-xl p-5 md:p-6 border border-gray-100 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              🛠 技术栈分布
            </h2>
            <DonutChart data={techDistribution} />
          </div>
        )}

        {/* 复杂度分布 */}
        <div className="bg-white rounded-xl p-5 md:p-6 border border-gray-100 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📐 复杂度分布
          </h2>
          <BarChart data={complexityData} />
        </div>

        {/* 月度活动 */}
        {monthlyData.length > 1 && (
          <div className="bg-white rounded-xl p-5 md:p-6 border border-gray-100 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📅 月度活动
            </h2>
            <BarChart data={monthlyData} />
          </div>
        )}

        {/* Top Tech Table */}
        {techDistribution.length > 0 && (
          <div className="bg-white rounded-xl p-5 md:p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              🏆 热门技术栈
            </h2>
            <div className="space-y-2">
              {techDistribution.map((t, i) => {
                const maxVal = techDistribution[0].value;
                const pct = (t.value / maxVal) * 100;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-28 truncate">
                      {t.label}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${t.color.replace("text-", "bg-")}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">
                      {t.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
