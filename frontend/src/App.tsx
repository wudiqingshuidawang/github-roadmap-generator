import { BrowserRouter, Route, Routes } from "react-router-dom";
import GeneratingPage from "./pages/GeneratingPage";
import HistoryPage from "./pages/HistoryPage";
import HomePage from "./pages/HomePage";
import RoadmapPage from "./pages/RoadmapPage";
import TrendsPage from "./pages/TrendsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/generating" element={<GeneratingPage />} />
        <Route path="/roadmap/:shareToken" element={<RoadmapPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/trends" element={<TrendsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
