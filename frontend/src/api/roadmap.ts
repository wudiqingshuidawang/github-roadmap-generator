import type { GenerateResponse, RoadmapData } from "../types/roadmap";

const API_BASE = "/api/roadmap";
const REQUEST_TIMEOUT = 30000;

interface ApiError {
  detail: string;
  status: number;
}

async function apiClient<T>(url: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  let resp: Response;
  try {
    resp = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw { detail: "请求超时，请稍后重试", status: 0 } satisfies ApiError;
    }
    throw { detail: "网络连接失败，请检查网络", status: 0 } satisfies ApiError;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!resp.ok) {
    const error = await resp.json().catch(() => ({ detail: "Unknown error" }));
    throw {
      detail: error.detail || `请求失败 (${resp.status})`,
      status: resp.status,
    } satisfies ApiError;
  }

  return resp.json();
}

export async function generateRoadmap(description: string): Promise<GenerateResponse> {
  return apiClient<GenerateResponse>(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
}

export async function getRoadmap(shareToken: string): Promise<RoadmapData> {
  return apiClient<RoadmapData>(`${API_BASE}/${shareToken}`);
}
