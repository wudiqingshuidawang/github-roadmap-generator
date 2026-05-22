import { useEffect, useState } from "react";

interface Step {
  icon: string;
  label: string;
  duration: number; // ms before this step activates
}

const STEPS: Step[] = [
  { icon: "🔍", label: "Searching GitHub for similar projects...", duration: 0 },
  { icon: "📖", label: "Analyzing project READMEs...", duration: 4000 },
  { icon: "🤖", label: "AI generating your roadmap...", duration: 10000 },
  { icon: "💾", label: "Saving and finalizing...", duration: 45000 },
];

export default function LoadingScreen() {
  const [activeStep, setActiveStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 500;
        // Find which step we should be on
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
      {/* Spinner */}
      <div className="relative mb-8">
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Generating your roadmap
      </h2>
      <p className="text-gray-500 text-sm mb-8">
        This usually takes 30-60 seconds
      </p>

      {/* Progress steps */}
      <div className="w-full max-w-md space-y-3">
        {STEPS.map((step, i) => {
          const isActive = i === activeStep;
          const isDone = i < activeStep;
          const isPending = i > activeStep;

          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-500 ${
                isActive
                  ? "bg-blue-50 border border-blue-200 shadow-sm"
                  : isDone
                  ? "opacity-60"
                  : "opacity-30"
              }`}
            >
              {/* Icon or checkmark */}
              <span className="text-lg w-6 text-center">
                {isDone ? "✅" : step.icon}
              </span>

              {/* Label */}
              <span
                className={`text-sm ${
                  isActive
                    ? "text-blue-700 font-medium"
                    : isDone
                    ? "text-gray-500 line-through"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </span>

              {/* Spinner for active step */}
              {isActive && (
                <div className="ml-auto">
                  <div className="w-4 h-4 border-2 border-blue-300 rounded-full animate-spin border-t-blue-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Elapsed time */}
      <p className="mt-6 text-xs text-gray-400">
        {Math.floor(elapsed / 1000)}s elapsed
      </p>
    </div>
  );
}
