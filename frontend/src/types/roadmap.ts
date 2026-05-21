export interface Resource {
  type: string;
  title: string;
  url: string;
}

export interface RoadmapTask {
  title: string;
  description: string;
  resources: Resource[];
  difficulty: string;
  dependencies: string[];
}

export interface Phase {
  name: string;
  duration: string;
  tasks: RoadmapTask[];
}

export interface TechStackItem {
  name: string;
  reason: string;
}

export interface GitHubRef {
  name: string;
  full_name: string;
  url: string;
  stars: number;
  description: string | null;
}

export interface RoadmapData {
  id: string;
  title: string;
  description: string;
  share_token: string;
  github_refs: GitHubRef[] | null;
  tech_stack: TechStackItem[] | null;
  phases: Phase[] | null;
  llm_model: string | null;
  created_at: string;
}

export interface GenerateResponse {
  id: string;
  share_token: string;
}
