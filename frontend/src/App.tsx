import { BrowserRouter, Route, Routes } from "react-router-dom";
import GeneratingPage from "./pages/GeneratingPage";
import HomePage from "./pages/HomePage";
import RoadmapPage from "./pages/RoadmapPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/generating" element={<GeneratingPage />} />
        <Route path="/roadmap/:shareToken" element={<RoadmapPage />} />
      </Routes>
    </BrowserRouter>
  );
}
