import type { GenerateResponse, RoadmapData } from "../types/roadmap";

const API_BASE = "/api/roadmap";

export async function generateRoadmap(description: string): Promise<GenerateResponse> {
  const resp = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!resp.ok) {
    const error = await resp.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || "Failed to generate roadmap");
  }
  return resp.json();
}

export async function getRoadmap(shareToken: string): Promise<RoadmapData> {
  const resp = await fetch(`${API_BASE}/${shareToken}`);
  if (!resp.ok) {
    if (resp.status === 404) throw new Error("Roadmap not found");
    throw new Error("Failed to fetch roadmap");
  }
  return resp.json();
}
