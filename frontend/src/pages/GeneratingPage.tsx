import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { generateRoadmap } from "../api/roadmap";
import LoadingScreen from "../components/LoadingScreen";

export default function GeneratingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const description = (location.state as { description?: string })?.description;
  const [error, setError] = useState("");

  useEffect(() => {
    if (!description) {
      navigate("/");
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    generateRoadmap(description)
      .then((result) => {
        clearTimeout(timeout);
        navigate(`/roadmap/${result.share_token}`);
      })
      .catch((err) => {
        clearTimeout(timeout);
        if (err.name === "AbortError") {
          setError("生成超时，服务器可能繁忙，请重试。");
        } else {
          setError(err.message || "生成失败");
        }
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [description, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return <LoadingScreen />;
}
