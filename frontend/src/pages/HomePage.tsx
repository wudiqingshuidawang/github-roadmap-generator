import { useNavigate } from "react-router-dom";
import ProjectInput from "../components/ProjectInput";
import { getHistory } from "../utils/history";

export default function HomePage() {
  const navigate = useNavigate();
  const historyCount = getHistory().length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-4">
      {/* History link */}
      {historyCount > 0 && (
        <div className="absolute top-6 right-6">
          <button
            onClick={() => navigate("/history")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            📋 History ({historyCount})
          </button>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Project<span className="text-blue-600">Path</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-lg mx-auto">
          Describe your project idea, and AI will generate a step-by-step learning roadmap based on real GitHub projects.
        </p>
      </div>
      <ProjectInput />
      <div className="mt-16 grid grid-cols-3 gap-8 text-center max-w-3xl">
        <div>
          <div className="text-2xl font-bold text-blue-600">GitHub</div>
          <p className="text-sm text-gray-500 mt-1">Real project data</p>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">AI</div>
          <p className="text-sm text-gray-500 mt-1">Smart roadmap generation</p>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">2 Views</div>
          <p className="text-sm text-gray-500 mt-1">Timeline + Mind map</p>
        </div>
      </div>
    </div>
  );
}
