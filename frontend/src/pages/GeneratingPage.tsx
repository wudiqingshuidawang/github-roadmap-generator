import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { generateRoadmap } from "../api/roadmap";
import LoadingScreen from "../components/LoadingScreen";

export default function GeneratingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const description = (location.state as { description?: string })?.description;

  useEffect(() => {
    if (!description) {
      navigate("/");
      return;
    }
    generateRoadmap(description)
      .then((result) => navigate(`/roadmap/${result.share_token}`))
      .catch(() => navigate("/"));
  }, [description, navigate]);

  return <LoadingScreen />;
}
