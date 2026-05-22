import { useEffect, useState } from "react";

interface Step {
  icon: string;
  label: string;
  duration: number;
}

const STEPS: Step[] = [
  { icon: "🔍", label: "正在搜索 GitHub 上的类似项目...", duration: 0 },
  { icon: "📖", label: "正在分析项目 README...", duration: 4000 },
  { icon: "🤖", label: "AI 正在生成路线图...", duration: 10000 },
  { icon: "💾", label: "正在保存并完成...", duration: 45000 },
];

export default function LoadingScreen() {
  const [activeStep, setActiveStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 500;
        for (let i = STEPS.length - 1; i >= 0; i--) {
          if (next >= STEPS[i].duration) {
            setActiveStep(i);
            break;
          }
        }
        return next;
      });
    }, 500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-4">
      <div className="relative mb-8">
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        正在生成你的路线图
      </h2>
      <p className="text-gray-500 text-sm mb-8">
        通常需要 30-60 秒
      </p>

      <div className="w-full max-w-md space-y-3">
        {STEPS.map((step, i) => {
          const isActive = i === activeStep;
          const isDone = i < activeStep;

          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-blue-50 border border-blue-200"
                  : isDone
                  ? "opacity-60"
                  : "opacity-30"
              }`}
            >
              <span className="text-lg">{step.icon}</span>
              <span
                className={`text-sm ${
                  isActive ? "text-blue-700 font-medium" : "text-gray-600"
                }`}
              >
                {step.label}
              </span>
              {isActive && (
                <div className="ml-auto">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {isDone && <span className="ml-auto text-green-500">✓</span>}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-8">
        已过 {Math.floor(elapsed / 1000)} 秒
      </p>
    </div>
  );
}
